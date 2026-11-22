/* Story Spindle: handcrafted mood-board editor, no AI. */
(function moodModule(){
'use strict';
let ctx=null,boardId='',layerId='',drag=null,uploadMode='',stock=[],stockStatus='',stockQuery='',stockLicense='cc0',inFlight=false;
const W=1000,H=620;
const gradients=[
 ['Parchment','linear-gradient(135deg,#f7edda,#e0ceb1)'],
 ['Ink & cream','linear-gradient(135deg,#f8f5ec 15%,#b8c5c0 100%)'],
 ['Forest dusk','linear-gradient(125deg,#263d36,#597966,#d1baa1)'],
 ['Twilight','linear-gradient(120deg,#3b3563,#b078ac,#dca8a1)'],
 ['Autumn','linear-gradient(120deg,#542c32,#bd7651,#e8c894)'],
 ['Sea glass','linear-gradient(120deg,#bfe4dc,#8eaab6,#e9e3d6)'],
 ['Nocturne','linear-gradient(125deg,#121a2f,#344664,#688492)'],
 ['Rose & clay','linear-gradient(125deg,#f3d5cd,#d7b2ad,#846c77)'],
 ['Golden hour','linear-gradient(120deg,#f2d2a6,#b88164,#66596a)'],
 ['Mist','linear-gradient(135deg,#ecece4,#b6c4c2,#c9cedc)'],
 ['Midnight sky','radial-gradient(circle at 70% 20%,#5c6595,#212e4c 70%)'],
 ['Blue hour','linear-gradient(180deg,#182e52,#517994,#b2aba0)'],
 ['Copper earth','linear-gradient(125deg,#e9c1a0,#a87655,#665346)'],
 ['Wildflower','linear-gradient(140deg,#b0bca9,#ead5cf,#b5a4c5)']
];
const solidColors=['#f5eedf','#fffaf0','#e6dec9','#c9d4cb','#a8c8d0','#d3bdce','#ebd0bf','#53433d','#2f4148','#1c2f3b','#253b2f','#d4b578','#dedfe4','#ffffff','#222222'];
const fonts=[
 ['Georgia','Georgia,serif'],['Garamond','Garamond,Georgia,serif'],['Baskerville','Baskerville,Georgia,serif'],
 ['Palatino','Palatino Linotype,Palatino,serif'],['Times','Times New Roman,serif'],['Book Antiqua','Book Antiqua,Palatino,serif'],
 ['Arial','Arial,sans-serif'],['Verdana','Verdana,sans-serif'],['Trebuchet','Trebuchet MS,sans-serif'],
 ['Gill Sans','Gill Sans,Arial,sans-serif'],['Arial Black','Arial Black,Arial,sans-serif'],['Impact','Impact,sans-serif'],
 ['Courier','Courier New,monospace'],['Lucida Console','Lucida Console,monospace'],
 ['Brush Script','Brush Script MT,cursive'],['Segoe Script','Segoe Script,cursive'],['Comic Sans','Comic Sans MS,cursive']
];
const patterns=['solid','linen','woven','denim','stripes','plaid','dots','speckled','herringbone','floral'];
const presetKinds=['Whole book','Character','Chapter','Scene','Setting','Other'];
const esc=s=>ctx.esc(s),id=()=>ctx.makeId();
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||0));
const cleanColor=(s,fallback='#eee8d8')=>/^#[\da-f]{3}([\da-f]{3})?$/i.test(String(s||''))?String(s):fallback;
const secureImageUrl=s=>/^https:\/\/[^"'<>\\\s]+$/i.test(String(s||''))||/^data:image\/(png|jpeg|webp);base64,/i.test(String(s||''))?String(s):'';
const opt=(arr,selected)=>arr.map(([value,label])=>`<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(label)}</option>`).join('');
function ensure(p){if(!Array.isArray(p.moodBoards))p.moodBoards=[];for(const b of p.moodBoards){if(!Array.isArray(b.items))b.items=[];if(!b.background)b.background={kind:'gradient',color:'#f5eedf',gradient:0,image:''};if(!b.kind)b.kind='Whole book';}}
function board(p){ensure(p);const b=p.moodBoards.find(b=>b.id===boardId)||p.moodBoards[0];if(b)boardId=b.id;return b;}
function item(b){const i=b?.items?.find(x=>x.id===layerId);if(!i)layerId='';return i;}
function newBoard(p){ensure(p);const b={id:id(),title:`Mood board ${p.moodBoards.length+1}`,kind:'Whole book',linkedId:'',background:{kind:'gradient',color:'#f5eedf',gradient:0,image:''},items:[]};p.moodBoards.push(b);boardId=b.id;layerId='';ctx.save();ctx.render();ctx.toast('Mood board created.');}
function newItem(type,b){
 const defaults={id:id(),type,x:110+b.items.length*16,y:105+b.items.length*12,w:type==='text'?360:type==='image'?310:190,h:type==='text'?150:type==='image'?230:190,rotate:0};
 if(type==='text')return {...defaults,text:'A moment worth remembering',font:'Georgia',size:45,color:'#263d34',bold:false,italic:false,underline:false,shadow:true,outline:0,outlineColor:'#f6e9ce',align:'left'};
 if(type==='swatch')return {...defaults,w:185,h:185,color:'#a77964',pattern:'woven',caption:'Fabric & feeling'};
 return {...defaults,w:300,h:235,url:'',credit:'',source:'',license:''};
}
function fontCSS(s){return (fonts.find(f=>f[0]===s)||fonts[0])[1];}
function swatchBackground(color,pattern){
 const c=cleanColor(color);
 const texture={
 solid:'none',
 linen:'repeating-linear-gradient(0deg,rgba(255,255,255,.2) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(0,0,0,.12) 0 1px,transparent 1px 5px)',
 woven:'repeating-linear-gradient(90deg,rgba(255,255,255,.22) 0 2px,transparent 2px 7px),repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 2px,transparent 2px 7px)',
 denim:'repeating-linear-gradient(45deg,rgba(255,255,255,.19) 0 1px,transparent 1px 4px),repeating-linear-gradient(-45deg,rgba(0,0,0,.17) 0 1px,transparent 1px 4px)',
 stripes:'repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 10px,transparent 10px 21px)',
 plaid:'repeating-linear-gradient(0deg,transparent 0 23px,rgba(255,255,255,.36) 23px 31px,transparent 31px 52px),repeating-linear-gradient(90deg,transparent 0 19px,rgba(0,0,0,.2) 19px 29px,transparent 29px 47px)',
 dots:'radial-gradient(circle,rgba(255,255,255,.66) 0 3px,transparent 3.5px)',
 speckled:'radial-gradient(circle at 30% 50%,rgba(255,255,255,.56) 0 2px,transparent 2.5px),radial-gradient(circle at 75% 70%,rgba(0,0,0,.24) 0 1px,transparent 2px)',
 herringbone:'repeating-linear-gradient(130deg,rgba(255,255,255,.32) 0 3px,transparent 3px 9px),repeating-linear-gradient(50deg,rgba(0,0,0,.14) 0 3px,transparent 3px 9px)',
 floral:'radial-gradient(ellipse at 35% 30%,rgba(255,255,255,.6) 0 5px,transparent 6px),radial-gradient(ellipse at 55% 52%,rgba(255,255,255,.36) 0 4px,transparent 5px),radial-gradient(circle at 45% 40%,rgba(50,77,50,.5) 0 2px,transparent 3px)'
 };
 const size=pattern==='dots'?'23px 23px':pattern==='floral'?'55px 55px':pattern==='speckled'?'31px 29px':'auto';
 return `background-color:${c};background-image:${texture[pattern]||'none'};background-size:${size}`;
}
function backgroundStyle(bg){
 if(bg.kind==='color')return `background:${cleanColor(bg.color)}`;
 if(bg.kind==='gradient')return `background:${gradients[Number(bg.gradient)]?.[1]||gradients[0][1]}`;
 return 'background:#eee5d7';
}
function layerHTML(i){
 const s=`left:${i.x/10}%;top:${i.y/H*100}%;width:${i.w/10}%;height:${i.h/H*100}%;transform:rotate(${clamp(i.rotate,-180,180)}deg)`;
 const chosen=layerId===i.id;
 let content='';
 if(i.type==='text')content=`<div class="mood-text-content" style="font-family:${fontCSS(i.font)};font-size:clamp(8px,${clamp(i.size,10,100)/1000*100}cqw,100px);color:${cleanColor(i.color,'#333333')};font-weight:${i.bold?'bold':'normal'};font-style:${i.italic?'italic':'normal'};text-decoration:${i.underline?'underline':'none'};text-align:${['left','center','right'].includes(i.align)?i.align:'left'};text-shadow:${i.shadow?'2px 3px 4px #182c275a':'none'};-webkit-text-stroke:${clamp(i.outline,0,4)}px ${cleanColor(i.outlineColor,'#ffffff')}">${esc(i.text||'')}</div>`;
 else if(i.type==='swatch')content=`<div class="mood-fabric" style="${swatchBackground(i.color,i.pattern)}"><span class="mood-fabric-caption">${esc(i.caption||'')}</span></div>`;
 else content=`<img class="mood-photo" alt="${esc(i.credit||'Mood board photograph')}" src="${esc(secureImageUrl(i.url))}" draggable="false">`;
 return `<div class="mood-layer mood-${i.type}${chosen?' mood-selected':''}" tabindex="0" role="button" aria-label="Select ${i.type}" data-mood-layer="${esc(i.id)}" style="${s}">${content}${chosen?'<span class="mood-resize-handle" data-mood-resize title="Drag to resize" aria-label="Resize element"></span>':''}</div>`;
}
function selectBoardOptions(p,sel){
 return `<option value="">Select a related entry (optional)</option>`+[
 ['Characters',[...(p.mainCharacters||[]),...(p.supportingCharacters||[])],'name'],
 ['Chapters',p.chapters||[],'title'],
 ['Worldbuilding',p.world||[],'title']
 ].map(([label,items,prop])=>`<optgroup label="${label}">${items.map((v,i)=>`<option value="${esc(v.id)}" ${sel===v.id?'selected':''}>${esc(v[prop]||`${label} ${i+1}`)}</option>`).join('')}</optgroup>`).join('');
}
function layerEditor(i,b){
 if(!i)return `<div class="empty"><strong>Select a layer</strong>Drag a photo, text block, or swatch to position it. Select it for more options.</div>`;
 const inp=(label,key,value,type='text',max='')=>`<div class="field"><label>${label}</label><input class="control" type="${type}" ${max?`min="1" max="${max}"`:''} data-mood-edit="${key}" value="${esc(value??'')}"></div>`;
 const sel=(label,key,pairs,value)=>`<div class="field"><label>${label}</label><select class="control" data-mood-edit="${key}">${opt(pairs,value)}</select></div>`;
 const check=(key,label)=>`<label class="toggle-row"><input type="checkbox" data-mood-edit="${key}" ${i[key]?'checked':''}>${label}</label>`;
 return `<div class="stack"><div class="inline-actions"><strong>${i.type==='text'?'Text layer':i.type==='image'?'Photo':'Fabric swatch'}</strong><button class="btn btn-danger btn-small" data-action="mood-remove-layer">Remove</button><button class="btn btn-secondary btn-small" data-action="mood-layer-front">Bring forward</button></div>
 ${i.type==='text'?`<div class="field"><label>Text</label><textarea class="control textarea" rows="3" data-mood-edit="text">${esc(i.text)}</textarea></div>
 ${sel('Font','font',fonts.map(f=>[f[0],f[0]]),i.font)}
 <div class="field-row">${inp('Font size','size',i.size,'number',100)}${inp('Text color','color',i.color,'color')}</div>
 <div class="inline-actions">${check('bold','Bold')}${check('italic','Italic')}${check('underline','Underline')}${check('shadow','Shadow')}</div>
 <div class="field-row">${sel('Alignment','align',[['left','Left'],['center','Center'],['right','Right']],i.align)}${inp('Outline thickness (0–4)','outline',i.outline,'number',4)}</div>${inp('Outline color','outlineColor',i.outlineColor,'color')}`:
 i.type==='swatch'?`<div class="field-row">${inp('Fabric color','color',i.color,'color')}${sel('Texture or pattern','pattern',patterns.map(x=>[x,x[0].toUpperCase()+x.slice(1)]),i.pattern)}</div>${inp('Swatch caption','caption',i.caption)}`:
 `<p class="small muted">${esc(i.credit||'Your uploaded photo')}${i.license?` · ${esc(i.license)}`:''}</p>${i.source?`<a href="${esc(secureImageUrl(i.source))}" target="_blank" rel="noopener noreferrer">View source & license</a>`:''}<button class="btn btn-secondary btn-small" data-action="mood-replace-photo">Replace photo</button>`}
 <div class="field-row">${inp('Width','w',Math.round(i.w),'number',960)}${inp('Height','h',Math.round(i.h),'number',600)}</div>
 <div class="field-row">${inp('Horizontal position','x',Math.round(i.x),'number',1000)}${inp('Vertical position','y',Math.round(i.y),'number',620)}</div>
 ${inp('Rotation (degrees)','rotate',i.rotate,'number',180)}
 <p class="small muted">Tip: Drag the item on the board to move it. Drag its lower-right corner to resize, or use these number fields for precise positioning.</p></div>`;
}
function stockHTML(){
 const status=stockStatus?`<p class="small muted">${esc(stockStatus)}</p>`:'';
 return `<div class="card mood-stock" style="margin-top:17px"><div class="card-top"><div><h3>Free image library: Openverse</h3><p>Optional online search. Some images require attribution; always check the source's license before publishing.</p></div></div>
 <div class="mood-stock-controls"><div class="field"><label>Search openly licensed images</label><input id="mood-stock-query" class="control" placeholder="e.g., misty forest, antique fabric" value="${esc(stockQuery)}"></div><div class="field"><label>License filter</label><select id="mood-stock-license" class="control">${opt([['cc0','CC0 / public domain'],['all','All Creative Commons licenses']],stockLicense)}</select></div><button class="btn btn-secondary" data-action="mood-stock-search" ${inFlight?'disabled':''}>${inFlight?'Searching…':'Search images'}</button></div>
 ${status}${stock.length?`<div class="mood-stock-results">${stock.map((s,i)=>`<div class="mood-stock-card"><img loading="lazy" src="${esc(secureImageUrl(s.thumbnail||s.url))}" alt="${esc(s.title)}"><div class="small"><strong>${esc(shorten(s.title,55))}</strong><span class="muted">${esc(s.license?.toUpperCase()||'License unknown')} · ${esc(shorten(s.creator||'Creator unknown',32))}</span></div><div class="inline-actions"><button class="btn btn-secondary btn-small" data-action="mood-stock-add" data-stock="${i}">Add</button><a target="_blank" rel="noopener noreferrer" href="${esc(secureImageUrl(s.foreign_landing_url||s.license_url||''))}">Source</a></div></div>`).join('')}</div>`:''}
 </div>`;
}
const shorten=(s,n)=>String(s||'Untitled').length>n?String(s).slice(0,n-1)+'…':String(s||'Untitled');
function render(p,{heading}){
 ensure(p);const b=board(p),chosen=item(b);
 return `<section class="page mood-page">${heading('Collect visual inspiration','Mood Boards','Create movable, resizable visual collages for your whole novel, a character, a chapter, a scene, or a setting.')}
 <div class="card"><div class="card-top"><div><h3>Your boards</h3><p>Saved with this novel. Uploaded pictures are resized to help fit browser storage.</p></div><button class="btn btn-secondary btn-small" data-action="mood-new">＋ New mood board</button></div>
 ${p.moodBoards.length?`<div class="mood-board-tabs">${p.moodBoards.map(x=>`<button class="btn btn-small ${x.id===b?.id?'':'btn-ghost'}" data-action="mood-select-board" data-id="${esc(x.id)}">${esc(shorten(x.title,30))}</button>`).join('')}</div>`:''}
 ${!b?`<div class="empty"><strong>A blank canvas awaits</strong>Start a mood board to collect colors, imagery, and fragments of atmosphere.</div>`:`<div class="stack">
 <div class="field-row"><div class="field"><label>Board title</label><input class="control" data-mood-board="title" value="${esc(b.title)}"></div><div class="field"><label>Board type</label><select class="control" data-mood-board="kind">${opt(presetKinds.map(x=>[x,x]),b.kind)}</select></div></div>
 <div class="field-row"><div class="field"><label>Link to a story entry (optional)</label><select class="control" data-mood-board="linkedId">${selectBoardOptions(p,b.linkedId)}</select></div><div class="inline-actions" style="align-items:end"><button class="btn btn-danger btn-small" data-action="mood-delete-board">Delete board</button><button class="btn btn-secondary btn-small" data-action="mood-export-png">Export as PNG</button></div></div>
 <div class="mood-toolbar"><button class="btn btn-secondary btn-small" data-action="mood-add-text">＋ Text</button><button class="btn btn-secondary btn-small" data-action="mood-add-swatch">＋ Fabric swatch</button><button class="btn btn-secondary btn-small" data-action="mood-upload-photo">＋ Upload photo</button></div>
 <div class="mood-workspace"><div class="mood-stage-wrap"><div class="mood-stage" id="mood-stage" style="${backgroundStyle(b.background)}">${b.background.kind==='image'&&b.background.image?`<img class="mood-stage-bg" src="${esc(secureImageUrl(b.background.image))}" alt="">`:''}${b.items.map(layerHTML).join('')}</div><p class="small muted">Drag layers to move them. Tap or click one to customize it on the right.</p></div>
 <div class="mood-inspector"><div class="field"><label>Board background</label><select class="control" data-mood-background="kind">${opt([['gradient','Gradient'],['color','Solid color'],['image','Uploaded image']],b.background.kind)}</select></div>
 ${b.background.kind==='color'?`<div class="field"><label>Background color</label><input class="control" type="color" data-mood-background="color" value="${esc(cleanColor(b.background.color))}"></div><div class="mood-colors">${solidColors.map(c=>`<button class="mood-color" data-action="mood-bg-color" data-color="${c}" style="background:${c}" title="${c}" aria-label="Use color ${c}"></button>`).join('')}</div>`:''}
 ${b.background.kind==='gradient'?`<div class="field"><label>Gradient palette</label><select class="control" data-mood-background="gradient">${opt(gradients.map((x,i)=>[i,x[0]]),b.background.gradient)}</select></div><div class="mood-gradient-grid">${gradients.map((x,i)=>`<button title="${esc(x[0])}" aria-label="Choose ${esc(x[0])}" data-action="mood-bg-gradient" data-gradient="${i}" style="background:${x[1]}"></button>`).join('')}</div>`:''}
 ${b.background.kind==='image'?`<button class="btn btn-secondary btn-small" data-action="mood-upload-background">Upload background image</button>`:''}
 <div class="divider"></div><h3>Selected item</h3>${layerEditor(chosen,b)}</div></div>
 </div>`}
 <input type="file" accept="image/png,image/jpeg,image/webp" id="mood-file-input" hidden>
 </div>${b?stockHTML():''}
 <p class="small muted" style="margin-top:17px">Your original words and uploaded pictures stay in your browser and are included in downloaded JSON backups. Images from Openverse are externally hosted: they may need internet to display, and their licenses remain the creator's responsibility. There is no AI image generation.</p>
 </section>`;
}
function liveStage(layer,b) {
 const el=[...document.querySelectorAll("[data-mood-layer]")].find(n=>n.dataset.moodLayer===layer.id);if(!el)return;
 el.style.left=layer.x/10+'%';el.style.top=layer.y/H*100+'%';el.style.width=layer.w/10+'%';el.style.height=layer.h/H*100+'%';el.style.transform=`rotate(${layer.rotate}deg)`;
 const t=el.querySelector('.mood-text-content');if(t){t.textContent=layer.text||'';t.style.color=cleanColor(layer.color);t.style.fontFamily=fontCSS(layer.font);t.style.fontWeight=layer.bold?'bold':'normal';t.style.fontStyle=layer.italic?'italic':'normal';t.style.textDecoration=layer.underline?'underline':'none';t.style.textShadow=layer.shadow?'2px 3px 4px #182c275a':'none';t.style.webkitTextStroke=`${layer.outline}px ${cleanColor(layer.outlineColor)}`;t.style.textAlign=layer.align;t.style.fontSize=`clamp(8px,${layer.size/10}cqw,100px)`;}
 if(layer.type==='swatch'){const sw=el.querySelector('.mood-fabric');sw.style.cssText=swatchBackground(layer.color,layer.pattern);sw.querySelector('span').textContent=layer.caption||'';}
}
function onAction(a,el,p){
 if(!a.startsWith('mood-'))return false;
 const b=board(p);
 if(a==='mood-new')newBoard(p);
 if(a==='mood-select-board'){boardId=el.dataset.id;layerId='';ctx.render();}
 if(a==='mood-delete-board' && b && confirm(`Delete mood board “${b.title}”?`)){p.moodBoards=p.moodBoards.filter(x=>x.id!==b.id);boardId=p.moodBoards[0]?.id||'';layerId='';ctx.save();ctx.render();}
 if(a==='mood-add-text'||a==='mood-add-swatch'){const i=newItem(a.endsWith('text')?'text':'swatch',b);b.items.push(i);layerId=i.id;ctx.save();ctx.render();}
 if(a==='mood-upload-photo'||a==='mood-upload-background'||a==='mood-replace-photo'){uploadMode=a;document.getElementById('mood-file-input')?.click();}
 if(a==='mood-remove-layer'){b.items=b.items.filter(i=>i.id!==layerId);layerId='';ctx.save();ctx.render();}
 if(a==='mood-layer-front'){const i=b.items.findIndex(x=>x.id===layerId);if(i>=0){b.items.push(b.items.splice(i,1)[0]);ctx.save();ctx.render();}}
 if(a==='mood-bg-gradient'){b.background.kind='gradient';b.background.gradient=+el.dataset.gradient;ctx.save();ctx.render();}
 if(a==='mood-bg-color'){b.background.kind='color';b.background.color=el.dataset.color;ctx.save();ctx.render();}
 if(a==='mood-stock-search'){searchStock();return true;}
 if(a==='mood-stock-add'){
  const s=stock[Number(el.dataset.stock)];if(!s||!b)return true;
  const url=secureImageUrl(s.url||s.thumbnail);if(!url){ctx.toast('This source has no supported secure image URL.');return true;}
  const i=newItem('image',b);i.url=url;i.credit=s.attribution||`${s.title||'Image'} — ${s.creator||'Unknown creator'}`;i.license=(s.license||'').toUpperCase();i.source=secureImageUrl(s.foreign_landing_url)||secureImageUrl(s.license_url);
  b.items.push(i);layerId=i.id;ctx.save();ctx.render();ctx.toast('Image added. Check its license before publishing.');
 }
 if(a==='mood-export-png'){exportPNG(p,b);return true;}
 return true;
}
function onChange(el,p){
 const b=board(p);
 if(el.id==='mood-file-input'){addUpload(el.files?.[0],p,b);el.value='';return true;}
 if(el.dataset.moodBoard){if(!b)return true;b[el.dataset.moodBoard]=el.value;ctx.save();ctx.render();return true;}
 if(el.dataset.moodBackground){if(!b)return true;const k=el.dataset.moodBackground;b.background[k]=k==='gradient'?Number(el.value):el.value;ctx.save();ctx.render();return true;}
 if(el.dataset.moodEdit){const i=item(b);if(!i)return true;const k=el.dataset.moodEdit;
  i[k]=el.type==='checkbox'?el.checked:['size','x','y','w','h','rotate','outline'].includes(k)?Number(el.value):el.value;
  if(['w','h'].includes(k))i[k]=clamp(i[k],30,k==='w'?960:600);
  if(k==='x')i.x=clamp(i.x,0,W-i.w);if(k==='y')i.y=clamp(i.y,0,H-i.h);
  ctx.save();ctx.render();return true;
 }
 return false;
}
function onInput(el,p){
 if(el.id==='mood-stock-query'){stockQuery=el.value;return true;}
 if(el.id==='mood-stock-license'){stockLicense=el.value;return true;}
 if(el.dataset.moodEdit){const b=board(p),i=item(b);if(!i)return true;
  const k=el.dataset.moodEdit;i[k]=el.type==='checkbox'?el.checked:['size','x','y','w','h','rotate','outline'].includes(k)?Number(el.value):el.value;
  if(['w','h'].includes(k))i[k]=clamp(i[k],30,k==='w'?960:600);
  if(k==='size')i.size=clamp(i.size,10,100);if(k==='outline')i.outline=clamp(i.outline,0,4);
  if(k==='x')i.x=clamp(i.x,0,W-i.w);if(k==='y')i.y=clamp(i.y,0,H-i.h);
  liveStage(i,b);ctx.save();return true;
 }
 return false;
}
function onPointerDown(e){
 const target=e.target.closest?.('[data-mood-layer]');if(!target)return false;
 const p=ctx.project(),b=board(p),i=b?.items?.find(x=>x.id===target.dataset.moodLayer);
 if(!i)return false;
 const selectedNew=layerId!==i.id;layerId=i.id;
 const stage=document.getElementById('mood-stage'),rect=stage?.getBoundingClientRect();if(!rect)return false;
 drag={boardId:b.id,itemId:i.id,x:e.clientX,y:e.clientY,startX:i.x,startY:i.y,startW:i.w,startH:i.h,rect,resize:!!e.target.closest?.('[data-mood-resize]'),moved:false};
 target.setPointerCapture?.(e.pointerId);
 if(selectedNew){for(const el of stage.querySelectorAll('.mood-layer'))el.classList.toggle('mood-selected',el===target);}
 e.preventDefault();return true;
}
function onPointerMove(e){
 if(!drag)return false;
 const b=ctx.project().moodBoards.find(x=>x.id===drag.boardId),i=b?.items.find(x=>x.id===drag.itemId);if(!i)return false;
 const dx=(e.clientX-drag.x)*W/drag.rect.width,dy=(e.clientY-drag.y)*H/drag.rect.height;
 if(Math.abs(dx)+Math.abs(dy)>2)drag.moved=true;
 if(drag.resize){i.w=clamp(drag.startW+dx,40,W-i.x);i.h=clamp(drag.startH+dy,40,H-i.y);}
 else {i.x=clamp(drag.startX+dx,0,W-i.w);i.y=clamp(drag.startY+dy,0,H-i.h);}
 liveStage(i,b);return true;
}
function onPointerUp(){
 if(!drag)return false;
 const moved=drag.moved;drag=null;if(moved)ctx.save();ctx.render();return true;
}
async function addUpload(file,p,b){
 if(!file||!b)return;
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)){ctx.toast('Please use a PNG, JPEG, or WebP image.');return;}
 if(file.size>15*1024*1024){ctx.toast('Please choose an image under 15 MB.');return;}
 try{
  const image=await new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image could not be opened'));};img.src=url;});
  const canvas=document.createElement('canvas'),scale=Math.min(1,1200/Math.max(image.width,image.height));
  canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  const c=canvas.getContext('2d');c.fillStyle='#ffffff';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(image,0,0,canvas.width,canvas.height);
  let data=canvas.toDataURL('image/jpeg',.72);for(let q=.61;data.length>380000&&q>=.35;q-=.12)data=canvas.toDataURL('image/jpeg',q);
  const current=JSON.stringify(p).length;
  if(current+data.length>3_600_000){ctx.toast('This browser project is near its image-storage limit. Please back up and remove some pictures before adding more.');return;}
  const target=ctx.project().moodBoards.find(x=>x.id===b.id);if(!target)return;
  if(uploadMode==='mood-upload-background'){target.background.kind='image';target.background.image=data;}
  else if(uploadMode==='mood-replace-photo'){const currentItem=target.items.find(x=>x.id===layerId);if(currentItem){currentItem.url=data;currentItem.credit='Personal upload';currentItem.source='';currentItem.license='';}}
  else {const i=newItem('image',target);i.url=data;i.credit='Personal upload';target.items.push(i);layerId=i.id;}
  ctx.save();ctx.render();ctx.toast('Image saved to this project. Back up your work regularly.');
 }catch(e){ctx.toast('Unable to read that image. Try a smaller PNG or JPEG.');}
}
async function searchStock(){
 const q=document.getElementById('mood-stock-query')?.value.trim()||stockQuery;
 stockLicense=document.getElementById('mood-stock-license')?.value||stockLicense;
 if(!q){ctx.toast('Enter an image search term.');return;}
 if(inFlight)return;stockQuery=q;inFlight=true;stockStatus='Searching Openverse…';stock=[];ctx.render();
 try{
  const params=new URLSearchParams({q,page_size:'12'});if(stockLicense==='cc0')params.set('license','cc0');
  const response=await fetch('https://api.openverse.org/v1/images/?'+params,{mode:'cors'});
  if(!response.ok)throw new Error('Search not available ('+response.status+')');
  const data=await response.json();stock=(data.results||[]).filter(s=>secureImageUrl(s.url||s.thumbnail)&&secureImageUrl(s.foreign_landing_url||s.license_url)).slice(0,12);
  stockStatus=stock.length?`Found ${stock.length} images. Review source and usage terms before publishing.`:'No matching images. Try another phrase.';
 }catch(e){stockStatus='Openverse search is unavailable right now. You can still upload images from your device or try again later.';}
 finally{inFlight=false;ctx.render();}
}
async function loadImage(src,remote){
 return new Promise((resolve,reject)=>{
  const image=new Image();if(remote)image.crossOrigin='anonymous';image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Image could not be loaded'));image.src=src;
 });
}
async function exportPNG(p,b){
 try{
  const scale=1.5,can=document.createElement('canvas');can.width=W*scale;can.height=H*scale;const c=can.getContext('2d');c.scale(scale,scale);
  const bg=b.background||{};if(bg.kind==='image'&&bg.image){const im=await loadImage(secureImageUrl(bg.image),!bg.image.startsWith('data:'));c.drawImage(im,0,0,W,H);}
  else if(bg.kind==='gradient'){
   const g=gradients[+bg.gradient]?.[1]||'';const colors=g.match(/#[0-9a-fA-F]{6}/g)||['#eee4d4','#dac5ab'];
   const gradient=c.createLinearGradient(0,0,W,H);colors.forEach((cl,i)=>gradient.addColorStop(i/Math.max(1,colors.length-1),cl));c.fillStyle=gradient;c.fillRect(0,0,W,H);
  }else{c.fillStyle=cleanColor(bg.color);c.fillRect(0,0,W,H);}
  for(const i of b.items){
   c.save();c.translate(i.x+i.w/2,i.y+i.h/2);c.rotate((i.rotate||0)*Math.PI/180);c.translate(-i.w/2,-i.h/2);
   if(i.type==='image'){const src=secureImageUrl(i.url);if(src){const image=await loadImage(src,!src.startsWith('data:'));c.drawImage(image,0,0,i.w,i.h);}}
   if(i.type==='swatch'){
    c.fillStyle=cleanColor(i.color);c.fillRect(0,0,i.w,i.h);c.save();c.beginPath();c.rect(0,0,i.w,i.h);c.clip();
    if(i.pattern==='dots'||i.pattern==='floral'||i.pattern==='speckled'){c.fillStyle='#ffffff66';for(let x=7;x<i.w;x+=20)for(let y=7;y<i.h;y+=20){c.beginPath();c.arc(x+(y%4)*2,y,2.4,0,Math.PI*2);c.fill();}}
    else if(i.pattern!=='solid'){c.strokeStyle='#ffffff55';c.lineWidth=3;for(let x=-i.h;x<i.w+i.h;x+=i.pattern==='stripes'?23:9){c.beginPath();c.moveTo(x,0);c.lineTo(x+i.h,i.h);c.stroke();}}
    c.restore();c.strokeStyle='#ffffffba';c.lineWidth=5;c.strokeRect(3,3,i.w-6,i.h-6);c.font='12px Georgia';c.fillStyle='#fff';c.fillText(shorten(i.caption||'',24),10,i.h-14);
   }
   if(i.type==='text'){
    c.font=`${i.italic?'italic ':''}${i.bold?'bold ':''}${Math.max(12,i.size)}px ${fontCSS(i.font)}`;c.textAlign=i.align||'left';c.textBaseline='top';c.fillStyle=cleanColor(i.color,'#333333');
    const x=i.align==='center'?i.w/2:i.align==='right'?i.w:0;let y=0;
    for(const line of String(i.text||'').split('\n')){c.shadowColor=i.shadow?'#2228':'transparent';c.shadowBlur=i.shadow?3:0;c.shadowOffsetY=i.shadow?3:0;c.shadowOffsetX=i.shadow?2:0;
      if(i.outline>0){c.strokeStyle=cleanColor(i.outlineColor,'#ffffff');c.lineWidth=i.outline*2;c.strokeText(line,x,y,i.w);}c.fillText(line,x,y,i.w);
      if(i.underline){const tw=Math.min(c.measureText(line).width,i.w);c.beginPath();c.moveTo(x-(i.align==='center'?tw/2:i.align==='right'?tw:0),y+i.size+2);c.lineTo(x+(i.align==='center'?tw/2:i.align==='right'?0:tw),y+i.size+2);c.strokeStyle=cleanColor(i.color);c.lineWidth=1.5;c.stroke();}
      y+=i.size*1.3;
    }
   }c.restore();
  }
  const link=document.createElement('a');link.download=(b.title||'mood-board').replace(/[^a-z0-9-]/gi,'-').slice(0,60)+'.png';link.href=can.toDataURL('image/png');document.body.appendChild(link);link.click();link.remove();ctx.toast('Mood board PNG downloaded.');
 }catch(e){ctx.toast('PNG export failed, often because a stock-image host blocks cross-site downloads. Remove that photo or use a locally uploaded copy.');}
}
function onKeydown(e){
 const layer=e.target?.closest?.('[data-mood-layer]');if(layer&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();const b=board(ctx.project()),i=b?.items.find(x=>x.id===layer.dataset.moodLayer);if(!i)return false;
  layerId=i.id;const step=e.shiftKey?10:2;if(e.key==='ArrowLeft')i.x=Math.max(0,i.x-step);if(e.key==='ArrowRight')i.x=Math.min(W-i.w,i.x+step);
  if(e.key==='ArrowUp')i.y=Math.max(0,i.y-step);if(e.key==='ArrowDown')i.y=Math.min(H-i.h,i.y+step);
  liveStage(i,b);ctx.save();return true;
 }return false;
}
function reset(){boardId='';layerId='';drag=null;stock=[];stockStatus='';}
function configure(c){ctx=c;}
window.SpindleMood={configure,ensure,render,onAction,onInput,onChange,onPointerDown,onPointerMove,onPointerUp,onKeydown,reset,swatchBackground,secureImageUrl};
})();
