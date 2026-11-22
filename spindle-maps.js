/* Story Spindle: illustrated parchment map studio (AI-free). */
(function mapStudio(){
'use strict';
let ctx=null,activeId='',selectedId='',selectedPoint=-1,tool='select',drawing=null,polygonPoints=[],lineStyle='road',paper='antique',pointInsertMode=false,focusMode=false,toolsOpen=false,detailsOpen=false;
const W=1000,H=650;
const themePalette=[
 ['antique','Aged parchment','#e9d9b4','#917f62'],
 ['ivory','Ivory manuscript','#f7ecd5','#b29b74'],
 ['dark','Weathered sepia','#c6ad83','#735b44'],
 ['blue','Cartographer blue','#d7ded7','#7d9a9b'],
 ['rose','Rose-tinted vellum','#ead4c9','#a67a70']
];
const terrains=[
 ['ocean','Ocean','#81adb3'],['lake','Lake water','#8db7bd'],
 ['plains','Grassland plains','#b9c894'],['savanna','Savanna','#cbd193'],['dunes','Sand dunes','#e5cf99'],
 ['desert','Rocky desert','#d0b18b'],['tundra','Tundra','#aeb9ad'],['snow','Snow & ice','#e6e9dc'],
 ['rocky-mountains','Rocky mountains','#a7a69a'],['forest-mountains','Forested mountains','#7c9f83'],['arctic-mountains','Arctic mountains','#b7c5c6'],
 ['canyon','Canyons','#bc8970'],['beach','Beaches','#f1dba7'],['deciduous','Deciduous forest','#88b07b'],
 ['evergreen','Evergreen forest','#567f69'],['tropical','Tropical jungle','#67a58c'],['wetland','Wetlands','#a1ad86'],
 ['volcanic','Volcanic terrain','#84716a']
];
const terra=Object.fromEntries(terrains.map(([id,title,color])=>[id,{title,color}]));
const lineKinds=[['road','Road'],['trail','Footpath / trail'],['river','River'],['border','Political border'],['route','Travel route']];
const lineColors={road:'#8f7657',trail:'#9e8d70',river:'#477e95',border:'#784f53',route:'#b16351'};
const bgColors={antique:'#e9d9b4',ivory:'#f7ecd5',dark:'#c6ad83',blue:'#d7ded7',rose:'#ead4c9'};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
const esc=s=>ctx.esc(s);
const uid=()=>ctx.makeId();
const opt=(arr,v)=>arr.map(([id,title])=>`<option value="${esc(id)}" ${id===v?'selected':''}>${esc(title)}</option>`).join('');
function ensure(p){if(!Array.isArray(p.storyMaps))p.storyMaps=[];for(const m of p.storyMaps){if(!Array.isArray(m.features))m.features=[];if(!bgColors[m.paper])m.paper='antique';}}
function current(p){ensure(p);const m=p.storyMaps.find(x=>x.id===activeId)||p.storyMaps[0];if(m)activeId=m.id;return m;}
function selected(m){const f=m?.features.find(x=>x.id===selectedId);if(!f)selectedId='';return f;}
function point(x,y){return {x:Math.round(clamp(x,0,W)*10)/10,y:Math.round(clamp(y,0,H)*10)/10};}
function presetPoints(shape,x=500,y=325){
 const params={island:[155,100,15],continent:[240,165,36],lake:[125,80,24],archipelago:[100,65,18],peninsula:[175,130,18],canyon:[160,85,14]};
 const [rx,ry,count]=params[shape]||params.island,pts=[];
 for(let i=0;i<count;i++){
  const angle=i*2*Math.PI/count;
  const wobble=shape==='continent'?.89+.07*Math.sin(angle*3+.7)+.045*Math.cos(angle*7-.2):shape==='lake'?.91+.08*Math.sin(i*2.7):shape==='canyon'?.82+.16*Math.sin(i*3.3):.74+.22*Math.sin(i*2.3+1.1)+.08*Math.cos(i*5.6);
  let dx=Math.cos(angle)*rx*wobble,dy=Math.sin(angle)*ry*wobble;
  if(shape==='peninsula'&&Math.cos(angle)<-.2)dx*=.32;
  pts.push(point(x+dx,y+dy));
 }
 return pts;
}
function addMap(p){ensure(p);const m={id:uid(),title:`Story map ${p.storyMaps.length+1}`,paper:'antique',features:[]};p.storyMaps.push(m);activeId=m.id;selectedId='';selectedPoint=-1;tool='select';ctx.save();ctx.render();ctx.toast('A blank parchment map is ready.');}
function addRegion(m,points,kind='plains',title='Land region',smooth=false){
 if(m.features.length>=300){ctx.toast('This map has reached the 300-element safety limit.');return;}
 if(points.length<3)return;
 const f={id:uid(),type:'region',title,points,smooth,terrain1:kind,terrain2:'evergreen',terrain3:'rocky-mountains',weight1:100,weight2:0,weight3:0,opacity:1};
 m.features.push(f);selectedId=f.id;selectedPoint=-1;pointInsertMode=false;ctx.save();ctx.render();
}
function addLine(m,points,style=lineStyle){
 if(points.length<2)return;
 if(m.features.length>=300){ctx.toast('This map has reached its 300-element limit.');return;}
 const f={id:uid(),type:'line',title:lineKinds.find(x=>x[0]===style)?.[1]||'Line',points,style,width:style==='border'?2.2:style==='river'?5:3.3};
 m.features.push(f);selectedId=f.id;selectedPoint=-1;pointInsertMode=false;ctx.save();ctx.render();
}
function addLabel(m,p){
 const f={id:uid(),type:'label',title:'New place',x:p.x,y:p.y,size:27,color:'#674e3f'};
 m.features.push(f);selectedId=f.id;selectedPoint=-1;pointInsertMode=false;ctx.save();ctx.render();
}
function bounds(points){
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
 return {minX:Math.min(...xs),minY:Math.min(...ys),maxX:Math.max(...xs),maxY:Math.max(...ys)};
}

function shapePath(points,smooth=false){
 if(!points.length)return '';
 let path='M '+points[0].x+' '+points[0].y;
 if(!smooth||points.length<3)return path+points.slice(1).map(p=>' L '+p.x+' '+p.y).join('')+' Z';
 for(let i=0;i<points.length;i++){
  const a=points[(i-1+points.length)%points.length],b=points[i],c=points[(i+1)%points.length],d=points[(i+2)%points.length],t=.85/6;
  path+=' C '+(b.x+(c.x-a.x)*t).toFixed(1)+' '+(b.y+(c.y-a.y)*t).toFixed(1)+' '+(c.x-(d.x-b.x)*t).toFixed(1)+' '+(c.y-(d.y-b.y)*t).toFixed(1)+' '+c.x+' '+c.y;
 }
 return path+' Z';
}
function handleBounds(pts){
 const b=bounds(pts),cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2,w=Math.max(30,b.maxX-b.minX),h=Math.max(30,b.maxY-b.minY);
 return {x:clamp(cx-w/2,3,W-w-3),y:clamp(cy-h/2,3,H-h-3),w,h};
}
function mapHandles(m){
 if(tool!=='select')return '';
 const f=selected(m);if(!f)return '';
 if(f.type==='label'){
  const x=clamp(f.x+Math.max(26,f.size*1.3),12,W-12),y=clamp(f.y-f.size,12,H-12);
  return '<g class="map-edit-handles"><rect class="map-resize-handle" data-map-resize="label" data-map-feature="'+esc(f.id)+'" x="'+(x-10)+'" y="'+(y-10)+'" width="20" height="20" rx="3"><title>Resize label</title></rect></g>';
 }
 if(!f.points?.length)return '';
 const b=handleBounds(f.points),id=esc(f.id);
 const corners=[['nw',b.x,b.y],['ne',b.x+b.w,b.y],['sw',b.x,b.y+b.h],['se',b.x+b.w,b.y+b.h]];
 return '<g class="map-edit-handles"><rect class="map-handle-bounds" x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" pointer-events="none"/>'+
 corners.map(([corner,x,y])=>'<rect class="map-resize-handle" data-map-resize="'+corner+'" data-map-feature="'+id+'" x="'+(x-9)+'" y="'+(y-9)+'" width="18" height="18" rx="3"><title>Drag to resize</title></rect>').join('')+
 f.points.map((p,i)=>'<circle class="map-vertex-handle '+(i===selectedPoint?'is-active':'')+'" data-map-vertex="'+i+'" data-map-feature="'+id+'" cx="'+p.x+'" cy="'+p.y+'" r="'+(i===selectedPoint?14:11)+'"><title>Drag point '+(i+1)+'</title></circle>').join('')+'</g>';
}
function nearestPointOnEdge(f,p){
 let best=null;const pts=f.points,count=f.type==='region'?pts.length:pts.length-1;
 for(let i=0;i<count;i++){
  const a=pts[i],b=pts[(i+1)%pts.length],dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
  const q=point(a.x+dx*t,a.y+dy*t),dist=Math.hypot(q.x-p.x,q.y-p.y);
  if(!best||dist<best.dist)best={index:i+1,point:q,dist};
 }return best;
}
function resizeCorners(f,points,corner,p){
 const b=handleBounds(points),ax=corner.includes('w')?b.x+b.w:b.x,ay=corner[0]==='n'?b.y+b.h:b.y,
 hx=corner.includes('w')?b.x:b.x+b.w,hy=corner[0]==='n'?b.y:b.y+b.h;
 const sx=clamp((p.x-ax)/(hx-ax),.06,10),sy=clamp((p.y-ay)/(hy-ay),.06,10);
 f.points=points.map(v=>point(ax+(v.x-ax)*sx,ay+(v.y-ay)*sy));
}
function simplifyLine(pts,tol=6){
 if(pts.length<5)return pts;
 const d=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return (p.x-a.x-dx*t)**2+(p.y-a.y-dy*t)**2;};
 const keep=new Set([0,pts.length-1]),stack=[[0,pts.length-1]];
 while(stack.length){const [a,b]=stack.pop();let at=-1,max=tol*tol;for(let j=a+1;j<b;j++){const x=d(pts[j],pts[a],pts[b]);if(x>max){max=x;at=j;}}if(at>=0){keep.add(at);stack.push([a,at],[at,b]);}}
 const out=pts.filter((_,i)=>keep.has(i));return out.length>=3?out:pts;
}
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function random(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
function terrainMark(kind,x,y,scale=1){
 const col=kind==='ocean'||kind==='lake'?'#386f8a':kind==='snow'?'#a7b8bf':kind.includes('mountains')?'#5c6a63':kind==='canyon'?'#835b4c':kind==='volcanic'?'#554d49':kind==='dunes'||kind==='desert'||kind==='beach'?'#bc986e':'#466e50';
 const s=scale;
 if(['ocean','lake','wetland'].includes(kind))return `<path d="M ${x-12*s} ${y} q ${6*s} ${-5*s} ${12*s} 0 t ${12*s} 0 M ${x-8*s} ${y+6*s} q ${6*s} ${-4*s} ${12*s} 0" stroke="${col}" opacity=".58" stroke-width="${1.4*s}" fill="none"/>`;
 if(kind.includes('mountains'))return `<path d="M ${x-15*s} ${y+10*s} l ${11*s} ${-21*s} l ${11*s} ${21*s} M ${x-2*s} ${y+9*s} l ${12*s} ${-16*s} l ${11*s} ${16*s}" stroke="${col}" fill="none" stroke-width="${1.8*s}" opacity=".8"/><path d="M ${x-7*s} ${y-5*s} l ${3*s} ${-4*s} l ${3*s} ${4*s}" stroke="#e9e8da" stroke-width="${2*s}" fill="none"/>`;
 if(['evergreen','forest-mountains'].includes(kind))return `<path d="M ${x} ${y-12*s} l ${-9*s} ${17*s} h ${18*s} z M ${x} ${y-4*s} l ${-11*s} ${15*s} h ${22*s} z" fill="${col}" opacity=".6"/><path d="M ${x} ${y+6*s} v ${9*s}" stroke="#625844" stroke-width="${2*s}"/>`;
 if(['deciduous','tropical'].includes(kind))return `<path d="M ${x} ${y+2*s} v ${12*s}" stroke="#655948" stroke-width="${2*s}"/><circle cx="${x}" cy="${y-6*s}" r="${9*s}" fill="${col}" opacity=".5"/><circle cx="${x-7*s}" cy="${y-2*s}" r="${6*s}" fill="${col}" opacity=".35"/>`;
 if(['dunes','beach','desert'].includes(kind))return `<path d="M ${x-15*s} ${y+5*s} q ${15*s} ${-19*s} ${29*s} 0 M ${x-12*s} ${y+10*s} q ${13*s} ${-10*s} ${25*s} 0" fill="none" stroke="${col}" stroke-width="${1.8*s}" opacity=".56"/>`;
 if(kind==='canyon')return `<path d="M ${x-17*s} ${y-12*s} q ${25*s} ${7*s} ${23*s} ${15*s} t ${10*s} ${11*s} M ${x-14*s} ${y-5*s} q ${18*s} ${6*s} ${14*s} ${13*s} t ${16*s} ${9*s}" fill="none" stroke="${col}" opacity=".68" stroke-width="${1.8*s}"/>`;
 if(kind==='volcanic')return `<path d="M ${x-14*s} ${y+11*s} l ${11*s} ${-20*s} l ${8*s} ${10*s} l ${8*s} ${-10*s} l ${10*s} ${20*s} z" fill="${col}" opacity=".47"/><path d="M ${x-3*s} ${y-9*s} q ${-6*s} ${-9*s} 0 ${-15*s}" stroke="#a87e6b" fill="none"/>`;
 if(kind==='snow'||kind==='tundra')return `<path d="M${x-10*s} ${y}h${20*s} M${x} ${y-10*s}v${20*s} M${x-7*s} ${y-7*s}l${14*s} ${14*s} M${x-7*s} ${y+7*s}l${14*s} ${-14*s}" stroke="${col}" fill="none" stroke-width="${1.3*s}" opacity=".6"/>`;
 return `<path d="M${x-8*s} ${y+6*s}q${4*s} ${-10*s} ${8*s} 0q${5*s} ${-12*s} ${10*s} 0 M${x-1*s} ${y+10*s}v${-8*s}" stroke="${col}" fill="none" opacity=".62" stroke-width="${1.6*s}"/>`;
}
function regionSVG(f){
 if(f.points.length<3)return '';
 const shape=shapePath(f.points,!!f.smooth),box=bounds(f.points);
 const entries=[{kind:f.terrain1||'plains',weight:clamp(f.weight1,0,100)},{kind:f.terrain2||'evergreen',weight:clamp(f.weight2,0,100)},{kind:f.terrain3||'rocky-mountains',weight:clamp(f.weight3,0,100)}].filter(t=>t.weight>0);
 if(!entries.length)entries.push({kind:'plains',weight:100});
 const weights=entries.reduce((a,b)=>a+b.weight,0),rng=random(hash(f.id));
 const clip='region-'+String(f.id).replace(/[^\w-]/g,'');
 let cells='',n=0;
 const cell=49;
 for(let y=Math.floor(box.minY/cell)*cell;y<box.maxY;y+=cell)for(let x=Math.floor(box.minX/cell)*cell;x<box.maxX;x+=cell){
  if(n++>550)break;
  const roll=rng()*weights;let sum=0,ch=entries[0].kind;
  for(const e of entries){sum+=e.weight;if(roll<=sum){ch=e.kind;break;}}
  const jitterX=(rng()-.5)*14,jitterY=(rng()-.5)*14;
  cells+=`<rect x="${x}" y="${y}" width="${cell+1}" height="${cell+1}" fill="${terra[ch]?.color||'#b9c894'}" opacity=".78"/>${terrainMark(ch,x+cell/2+jitterX,y+cell/2+jitterY,0.8)}`;
 }
 return `<g class="map-feature ${selectedId===f.id?'map-selected':''}" data-map-feature="${esc(f.id)}"><defs><clipPath id="${clip}"><path d="${shape}"/></clipPath></defs>
 <path d="${shape}" fill="${terra[f.terrain1]?.color||'#aebc91'}" stroke="#725c44" stroke-width="${selectedId===f.id?3.5:2}" stroke-linejoin="round"/>
 <g clip-path="url(#${clip})">${cells}</g>
 <path d="${shape}" fill="none" stroke="#f2dfb9" stroke-width="1.1" stroke-linejoin="round" opacity=".7"/>
 </g>`;
}
function lineSVG(f){
 const pts=f.points.map(p=>`${p.x},${p.y}`).join(' '),color=lineColors[f.style]||lineColors.road;
 const dash=f.style==='border'?'9 6':f.style==='trail'?'3 7':f.style==='route'?'10 4':'none';
 return `<g data-map-feature="${esc(f.id)}" class="map-feature ${selectedId===f.id?'map-selected':''}"><polyline points="${pts}" fill="none" stroke="#f1e6ce" stroke-width="${(f.width||3)+3}" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${selectedId===f.id?(f.width||3)+1.8:(f.width||3)}" stroke-dasharray="${dash}" stroke-linejoin="round" stroke-linecap="round"/><polyline points="${pts}" fill="none" stroke="transparent" stroke-width="22" pointer-events="stroke" stroke-linejoin="round" stroke-linecap="round"/></g>`;
}
function svgContent(m){
 const theme=themePalette.find(x=>x[0]===m.paper)||themePalette[0];
 const features=m.features.map(f=>f.type==='region'?regionSVG(f):f.type==='line'?lineSVG(f):`<g data-map-feature="${esc(f.id)}" class="map-feature ${selectedId===f.id?'map-selected':''}"><text x="${f.x}" y="${f.y}" font-family="Georgia,serif" text-anchor="middle" font-weight="bold" fill="${/^#[\da-f]{6}$/i.test(f.color)?f.color:'#70533f'}" stroke="${selectedId===f.id?'#fff9e9':'none'}" stroke-width="3" paint-order="stroke" font-size="${clamp(f.size,12,76)}">${esc(f.title)}</text></g>`).join('');
 return `<defs><pattern id="map-paper-grain" width="71" height="83" patternUnits="userSpaceOnUse"><circle cx="14" cy="27" r="1.2" fill="${theme[3]}" opacity=".15"/><circle cx="47" cy="18" r=".9" fill="${theme[3]}" opacity=".25"/><circle cx="65" cy="62" r="1.8" fill="${theme[3]}" opacity=".12"/><path d="M5 67 l12 -3 M33 52 l9 4" stroke="${theme[3]}" stroke-width=".7" opacity=".12"/></pattern></defs>
 <rect width="${W}" height="${H}" fill="${theme[2]}"/><rect width="${W}" height="${H}" fill="url(#map-paper-grain)"/>
 <rect x="23" y="23" width="${W-46}" height="${H-46}" rx="3" fill="none" stroke="${theme[3]}" opacity=".65" stroke-width="2"/>
 <rect x="32" y="32" width="${W-64}" height="${H-64}" fill="none" stroke="${theme[3]}" opacity=".3" stroke-width="1"/>
 ${features}<g opacity=".62" pointer-events="none" stroke="#6c5944" fill="none" stroke-width="1.5"><circle cx="933" cy="92" r="27"/><path d="M933 53 v78 M896 92 h74 M933 70 l8 22 -8 22 -8 -22z" fill="#977a57"/></g><text x="933" y="49" font-family="Georgia,serif" font-size="17" fill="#6c5944" text-anchor="middle">N</text>
 ${mapHandles(m)}
 <polyline id="map-draft-line" points="" fill="none" stroke="#68594c" stroke-width="3" stroke-dasharray="4 4" stroke-linecap="round" pointer-events="none"/>
 `;
}
function mapSVG(m,forExport=false){
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" ${forExport?'':'id="map-canvas" class="map-canvas" aria-label="Illustrated interactive fantasy map canvas"'}>${svgContent(m)}</svg>`;
}
function inspector(f){
 if(!f)return '<div class="empty"><strong>Select an element</strong>Choose Select, then tap an area, line or label. Drag the round points to reshape or square corners to resize.</div>';
 const field=(name,key,value,type='text')=>`<div class="field"><label>${name}</label><input class="control" data-map-edit="${key}" type="${type}" value="${esc(value??'')}"></div>`;
 const select=(label,key,pairs,value)=>`<div class="field"><label>${label}</label><select class="control" data-map-edit="${key}">${opt(pairs,value)}</select></div>`;
 const isShape=!!f.points;
 const canRemove=f.points?.length>(f.type==='region'?3:2);
 const node=f.points?.[selectedPoint];
 return `<div class="stack"><div class="inline-actions"><strong>${esc(f.title||'Map feature')}</strong><button class="btn btn-danger btn-small" data-action="map-delete-feature">Remove feature</button></div>
 ${field('Name / label','title',f.title)}
 ${isShape?`<div class="map-vertex-tools"><strong>Shape points & resizing</strong><p class="small muted">Tap a circular point to move it, or drag a square corner to resize. This works on every landmass, hand-drawn region, and line.</p>
 <div class="inline-actions"><button type="button" class="btn btn-small ${pointInsertMode?'':'btn-secondary'}" data-action="map-add-point" aria-pressed="${pointInsertMode}">${pointInsertMode?'Tap border to add…':'+ Add point'}</button><button type="button" class="btn btn-secondary btn-small" data-action="map-remove-point" ${selectedPoint<0||!canRemove?'disabled':''}>Remove selected point</button></div>
 <div class="field"><label for="map-point-select">Selected vertex</label><select class="control" id="map-point-select" data-map-point><option value="">Choose a point</option>${f.points.map((pt,i)=>`<option value="${i}" ${i===selectedPoint?'selected':''}>Point ${i+1} · ${Math.round(pt.x)}, ${Math.round(pt.y)}</option>`).join('')}</select></div>
 ${node?`<div class="field-row"><div class="field"><label>X position</label><input type="number" class="control" data-map-coordinate="x" min="0" max="1000" value="${Math.round(node.x)}"></div><div class="field"><label>Y position</label><input type="number" class="control" data-map-coordinate="y" min="0" max="650" value="${Math.round(node.y)}"></div></div>`:''}
 <div class="inline-actions"><button type="button" class="btn btn-secondary btn-small" data-action="map-enlarge">Enlarge 10%</button><button type="button" class="btn btn-secondary btn-small" data-action="map-shrink">Shrink 10%</button><button type="button" class="btn btn-secondary btn-small" data-action="map-simplify" ${f.points.length<8?'disabled':''}>Fewer points</button></div>
 </div>`:''}
 ${f.type==='region'?`<div class="field"><label class="toggle-row"><input type="checkbox" data-map-edit="smooth" ${f.smooth?'checked':''}>Smooth outline (curved coast)</label></div>
 <p class="small muted">Mix up to three terrain types. Slider weights are relative; the map fills the closed region with their illustrated textures.</p>
 ${[1,2,3].map(n=>`<div class="field-row">${select('Terrain '+n,'terrain'+n,terrains.map(x=>[x[0],x[1]]),f['terrain'+n])}<div class="field"><label>Ratio weight: <strong>${f['weight'+n]||0}</strong></label><input class="control" data-map-edit="weight${n}" type="range" min="0" max="100" step="5" value="${f['weight'+n]||0}"></div></div>`).join('')}`:
 f.type==='line'?`<div class="field-row">${select('Line type','style',lineKinds,f.style)}${field('Line width','width',f.width,'number')}</div>`:
 `<div class="field-row">${field('Font size','size',f.size,'number')}${field('Label color','color',f.color,'color')}</div><p class="small muted">Drag the square handle beside your label to change its size, or adjust the font size above.</p>`}
 </div>`;
}
function toolHint(){
 if(pointInsertMode)return 'Tap the selected shape or line to insert a new point along its edge.';
 return tool==='polygon'?'Tap three or more border points, then Finish polygon.':
 tool==='freehand'?'Drag continuously to trace a closed region.':
 tool==='line'?'Drag a line to draw a road, river, trail or boundary.':
 tool==='label'?'Tap the map to place a text label.':
 'Tap a feature to select it; move the round points or drag square corner handles to resize.';
}
function render(p,{heading}){
 ensure(p);
 const m=current(p),f=selected(m);
 const toggle=focusMode?'✕ Exit full screen':'⛶ Full screen';
 const tools=`<div class="map-editor-tools ${focusMode&&!toolsOpen?'is-collapsed':''}" id="map-editor-tools">
 <div class="map-editor-tools-scroll">
 <div class="mood-board-tabs">${focusMode?`<button class="btn btn-secondary btn-small" data-action="map-new">＋ New map</button>`:""}${p.storyMaps.map(x=>`<button class="btn btn-small ${x.id===m?.id?'':'btn-ghost'}" data-action="map-choose" data-id="${esc(x.id)}">${esc(x.title)}</button>`).join('')}</div>
 <div class="field-row"><div class="field"><label>Map name</label><input class="control" data-map-title value="${esc(m?.title||'')}"></div><div class="field"><label>Paper style</label><select class="control" data-map-paper>${opt(themePalette.map(x=>[x[0],x[1]]),m?.paper)}</select></div></div>
 <div class="map-toolbar">${[['select','Select / move'],['freehand','Draw region'],['polygon','Polygon points'],['line','Draw line'],['label','Place label']].map(([t,label])=>`<button class="btn btn-small ${tool===t?'':'btn-secondary'}" data-action="map-tool" data-tool="${t}">${label}</button>`).join('')}</div>
 <div class="map-toolbar"><span class="small muted">Insert a shape:</span>
 ${[['ocean','Ocean base'],['island','Island'],['continent','Continent'],['peninsula','Peninsula'],['lake','Lake'],['archipelago','Archipelago'],['canyon','Canyon']].map(([v,t])=>`<button class="btn btn-secondary btn-small" data-action="map-preset" data-shape="${v}">${t}</button>`).join('')}</div>
 <div class="map-toolbar"><label class="small muted" for="map-line-kind">Line kind:</label><select id="map-line-kind" class="control map-line-select" data-map-line-style>${opt(lineKinds,lineStyle)}</select>
 <button class="btn btn-secondary btn-small" data-action="map-finish-polygon" ${tool==='polygon'&&polygonPoints.length>=3?'':'disabled'}>Finish polygon (${polygonPoints.length})</button><button class="btn btn-secondary btn-small" data-action="map-cancel-drawing">Cancel drawing</button></div>
 </div></div>`;
 return `<section class="page map-page ${focusMode?'map-focus-mode':''}">${focusMode?'':heading('Sketch your geography','Map Studio','Create illustrated story maps with draggable points, terrain fills, and freehand drawing.')}
 <div class="card map-editor-card">
 <div class="map-editor-head"><div class="map-editor-heading"><h3>${focusMode?esc(m?.title||'Map Studio'):'Your story maps'}</h3>${focusMode?'<span class="small muted">Focus editing · Select a shape to adjust points</span>':'<p>Build worlds, regional maps, journey sketches or maps for individual scenes.</p>'}</div>
 <div class="inline-actions map-editor-head-actions">
 ${focusMode?`<button type="button" class="btn btn-secondary btn-small" data-action="map-toggle-tools" aria-expanded="${toolsOpen}" aria-controls="map-editor-tools">⚒ Tools</button><button type="button" class="btn btn-secondary btn-small" data-action="map-toggle-details" aria-expanded="${detailsOpen}" aria-controls="map-inspector">☷ Details</button>`:`<button class="btn btn-secondary btn-small" data-action="map-new">＋ New map</button>`}
 <button class="btn btn-secondary btn-small" data-action="map-fullscreen" aria-pressed="${focusMode}">${toggle}</button>
 </div></div>
 ${m?`${tools}
 <div class="map-workspace">
  <div class="map-stage-column"><div class="map-stage-wrap" id="map-stage-wrap">${mapSVG(m)}<div class="map-stage-caption">${esc(toolHint())}</div>${tool==='polygon'&&polygonPoints.length>=3?`<button class="btn map-quick-finish" data-action="map-finish-polygon">✓ Finish region (${polygonPoints.length} points)</button>`:''} </div>
  <div class="inline-actions map-download-actions"><button class="btn btn-secondary btn-small" data-action="map-export-svg">↓ SVG</button><button class="btn btn-secondary btn-small" data-action="map-export-png">↓ PNG</button>${!focusMode?`<button class="btn btn-danger btn-small" data-action="map-delete">Delete map</button>`:''}</div>
  </div>
 <aside class="map-inspector ${focusMode&&!detailsOpen?'is-collapsed':''}" id="map-inspector"><h3>Selected feature</h3>${inspector(f)}
 <div class="divider"></div><h3>Map features</h3>
 ${m.features.length?`<div class="map-feature-list">${m.features.map(e=>`<button class="${e.id===selectedId?'active':''}" data-action="map-select-feature" data-id="${esc(e.id)}"><span>${esc(e.type==='region'?'▧':e.type==='line'?'∿':'T')}</span>${esc(e.title||e.type)}</button>`).join('')}</div>`:'<p class="small muted">This map is blank. Add a landmass or draw your first region.</p>'}
 ${focusMode?`<button class="btn btn-danger btn-small" data-action="map-delete">Delete map</button><button class="btn btn-secondary btn-small" data-action="map-toggle-details">Hide panel</button>`:''}
 </aside>
 </div>`:`<div class="empty"><strong>The world is yours to draw</strong>Create a map to start with a parchment canvas.</div><button class="btn" data-action="map-new">＋ New map</button>`}
 </div>
 ${focusMode?'':`<div class="info" style="margin-top:17px"><strong>Editing shapes:</strong> Select any landform, drawn region, road or river to see adjustable points and corner resize handles. Use Details to add or remove points. A continent now has a gently curved outline. For an uncluttered workspace, open full screen and reveal Tools or Details only when needed. Terrain fills still require a closed region, not unrelated intersecting lines.</div>`}
 </section>`;
}
function editPointFromEvent(e){
 const svg=document.getElementById('map-canvas');if(!svg)return null;
 const r=svg.getBoundingClientRect();
 // SVG uses meet/letterboxing in focus mode, so account for unused space.
 const scale=Math.min(r.width/W,r.height/H);
 if(!scale)return null;
 const offX=(r.width-W*scale)/2,offY=(r.height-H*scale)/2;
 return point((e.clientX-r.left-offX)/scale,(e.clientY-r.top-offY)/scale);
}
function updatePreview(){
 const poly=document.getElementById('map-draft-line');if(!poly)return;
 const pts=tool==='polygon'?polygonPoints:(drawing?.points||[]);
 poly.setAttribute('points',pts.map(x=>x.x+','+x.y).join(' '));
}
function onPointerDown(e){
 const svg=e.target.closest?.('#map-canvas');if(!svg||!current(ctx.project()))return false;
 const p=editPointFromEvent(e);if(!p)return false;const m=current(ctx.project());
 if(tool==='polygon'){polygonPoints.push(p);ctx.render();updatePreview();return true;}
 if(tool==='label'){addLabel(m,p);tool='select';ctx.render();return true;}
 const clicked=e.target.closest?.('[data-map-feature]');
 if(tool==='select'){
  if(pointInsertMode){
   const f=selected(m);
   if(f?.points && clicked?.dataset.mapFeature===f.id){
    const near=nearestPointOnEdge(f,p);
    if(near){f.points.splice(near.index,0,near.point);selectedPoint=near.index;pointInsertMode=false;ctx.save();ctx.render();ctx.toast('Point added. Drag it to reshape.');}
   }else ctx.toast('Tap the selected shape or line to insert a point.');
   e.preventDefault();return true;
  }
  const vertex=e.target.closest?.('[data-map-vertex]'),handle=e.target.closest?.('[data-map-resize]');
  if(vertex||handle){
   const source=vertex||handle,f=m.features.find(x=>x.id===source.dataset.mapFeature);
   if(!f)return true;
   selectedId=f.id;
   if(vertex){
    const index=Number(vertex.dataset.mapVertex);
    if(!Number.isInteger(index)||index<0||index>=f.points.length)return true;
    selectedPoint=index;drawing={mode:'vertex',id:f.id,index,moved:false,start:p};
   }else if(handle.dataset.mapResize==='label'){
    selectedPoint=-1;drawing={mode:'label-resize',id:f.id,start:p,size:f.size,moved:false};
   }else{
    selectedPoint=-1;drawing={mode:'corner-resize',id:f.id,corner:handle.dataset.mapResize,original:f.points.map(q=>({...q})),start:p,moved:false};
   }
   svg.setPointerCapture?.(e.pointerId);e.preventDefault();return true;
  }
  if(!clicked){selectedId='';selectedPoint=-1;ctx.render();return true;}
  const f=m.features.find(x=>x.id===clicked.dataset.mapFeature);if(!f)return true;
  selectedId=f.id;selectedPoint=-1;
  drawing={mode:'move',id:f.id,start:p,original:f.points?.map(q=>({...q})),originalX:f.x,originalY:f.y,moved:false};
  svg.setPointerCapture?.(e.pointerId);
  svg.innerHTML=svgContent(m);e.preventDefault();return true;
 }
 if(tool==='freehand'||tool==='line'){
  drawing={mode:tool,points:[p]};svg.setPointerCapture?.(e.pointerId);e.preventDefault();return true;
 }
 return false;
}
function onPointerMove(e){
 if(!drawing)return false;
 const p=editPointFromEvent(e);if(!p)return false;
 const d=drawing;
 if(d.mode==='freehand'||d.mode==='line'){
  const last=d.points[d.points.length-1];
  if(Math.hypot(p.x-last.x,p.y-last.y)>5){d.points.push(p);updatePreview();}
  return true;
 }
 const m=current(ctx.project()),f=m?.features.find(x=>x.id===d.id);if(!f)return false;
 const dx=p.x-d.start.x,dy=p.y-d.start.y;
 if(Math.abs(dx)+Math.abs(dy)<.2&&!d.moved)return true;
 d.moved=true;
 if(d.mode==='vertex')f.points[d.index]=p;
 else if(d.mode==='corner-resize')resizeCorners(f,d.original,d.corner,p);
 else if(d.mode==='label-resize')f.size=clamp(Math.round(d.size+dx/2-dy/2),12,76);
 else if(d.mode==='move'){
  if(f.points){
   const b=bounds(d.original),mx=clamp(dx,-b.minX,W-b.maxX),my=clamp(dy,-b.minY,H-b.maxY);
   f.points=d.original.map(q=>point(q.x+mx,q.y+my));
  }else {f.x=clamp(d.originalX+dx,0,W);f.y=clamp(d.originalY+dy,0,H);}
 }
 const svg=document.getElementById('map-canvas');if(svg)svg.innerHTML=svgContent(m);
 return true;
}
function onPointerUp(e){
 if(!drawing)return false;
 const d=drawing;drawing=null;
 const svg=document.getElementById('map-canvas');
 if(svg&&e?.pointerId!=null){try{svg.releasePointerCapture?.(e.pointerId);}catch(_){}}
 if(['move','vertex','corner-resize','label-resize'].includes(d.mode)){
  if(d.moved)ctx.save();ctx.render();return true;
 }
 const m=current(ctx.project());if(!m)return false;
 if(d.mode==='freehand'&&d.points.length>=3){addRegion(m,simplifyLine(d.points,7),'plains','Freehand region');tool='select';ctx.render();}
 else if(d.mode==='line'&&d.points.length>=2){addLine(m,simplifyLine(d.points,5),lineStyle);tool='select';ctx.render();}
 else{ctx.render();ctx.toast('Draw a longer stroke to make a map feature.');}
 return true;
}
function resizeFeature(f,scale){
 const b=bounds(f.points),cx=(b.maxX+b.minX)/2,cy=(b.maxY+b.minY)/2;
 let next=f.points.map(p=>({x:cx+(p.x-cx)*scale,y:cy+(p.y-cy)*scale}));
 const n=bounds(next);const dx=Math.max(0,-n.minX)+Math.min(0,W-n.maxX),dy=Math.max(0,-n.minY)+Math.min(0,H-n.maxY);
 f.points=next.map(p=>point(p.x+dx,p.y+dy));
}
function onAction(a,el,p){
 if(!a.startsWith('map-'))return false;
 let m=current(p);
 if(a==='map-fullscreen'){focusMode=!focusMode;toolsOpen=false;detailsOpen=false;ctx.render();return true;}
 if(a==='map-toggle-tools'){toolsOpen=!toolsOpen;if(toolsOpen)detailsOpen=false;ctx.render();return true;}
 if(a==='map-toggle-details'){detailsOpen=!detailsOpen;if(detailsOpen)toolsOpen=false;ctx.render();return true;}
 if(a==='map-new'){addMap(p);if(focusMode){toolsOpen=false;ctx.render();}}
 if(a==='map-choose'){activeId=el.dataset.id;selectedId='';selectedPoint=-1;pointInsertMode=false;polygonPoints=[];tool='select';if(focusMode)toolsOpen=false;ctx.render();}
 if(a==='map-delete'&&m&&confirm(`Delete map “${m.title}”?`)){p.storyMaps=p.storyMaps.filter(x=>x.id!==m.id);activeId=p.storyMaps[0]?.id||'';selectedId='';selectedPoint=-1;ctx.save();ctx.render();}
 if(a==='map-tool'){tool=el.dataset.tool;drawing=null;polygonPoints=[];pointInsertMode=false;selectedPoint=-1;if(focusMode)toolsOpen=false;ctx.render();}
 if(a==='map-preset'&&m){
  const shape=el.dataset.shape;
  if(shape==='ocean'){
   addRegion(m,[point(34,34),point(966,34),point(966,616),point(34,616)],'ocean','Ocean background');
   const added=m.features.pop();if(added)m.features.unshift(added);
   ctx.save();ctx.render();
  }else if(shape==='archipelago'){
   for(const [dx,dy,scale,n] of [[-115,-25,.48,1],[80,-60,.36,2],[110,75,.46,3]]){
     const cx=500+dx,cy=325+dy;
     const pts=presetPoints('island',cx,cy).map(pt=>point(cx+(pt.x-cx)*scale,cy+(pt.y-cy)*scale));
     addRegion(m,pts,'plains','Island '+n);
   }
  }else{
   addRegion(m,presetPoints(shape),shape==='lake'?'lake':shape==='canyon'?'canyon':'plains',shape.charAt(0).toUpperCase()+shape.slice(1),shape==='continent');
  }
  tool='select';if(focusMode)toolsOpen=false;ctx.render();
 }
 if(a==='map-finish-polygon'){
  if(polygonPoints.length>=3&&m)addRegion(m,[...polygonPoints],'plains','Polygon region');
  else ctx.toast('Add at least three points to close a polygon.');
  polygonPoints=[];tool='select';
 }
 if(a==='map-cancel-drawing'){drawing=null;polygonPoints=[];ctx.render();}
 if(a==='map-select-feature'){selectedId=el.dataset.id;selectedPoint=-1;pointInsertMode=false;tool='select';ctx.render();}
 if(a==='map-delete-feature'){if(selectedId&&m&&confirm('Remove this map feature?')){m.features=m.features.filter(x=>x.id!==selectedId);selectedId='';selectedPoint=-1;pointInsertMode=false;ctx.save();ctx.render();}}
 if(a==='map-add-point'){
  const f=selected(m);if(!f?.points)return true;
  tool='select';pointInsertMode=!pointInsertMode;ctx.render();
  return true;
 }
 if(a==='map-remove-point'){
  const f=selected(m),min=f?.type==='region'?3:2;
  if(f?.points&&selectedPoint>=0&&f.points.length>min){
   f.points.splice(selectedPoint,1);selectedPoint=-1;pointInsertMode=false;ctx.save();ctx.render();
  }
  return true;
 }
 if(a==='map-simplify'){
  const f=selected(m);if(f?.points){
   const simpler=simplifyLine(f.points,f.type==='region'?7:5);
   if(simpler.length<f.points.length&&simpler.length>=(f.type==='region'?3:2)){
    f.points=simpler;selectedPoint=-1;ctx.save();ctx.render();ctx.toast('Extra points reduced. You can add them back.');
   }else ctx.toast('This outline is already simple enough.');
  }return true;
 }
 if(a==='map-enlarge'||a==='map-shrink'){
  const f=selected(m);if(f?.points){resizeFeature(f,a==='map-enlarge'?1.1:.9);ctx.save();ctx.render();}
 }
 if(a==='map-export-svg'||a==='map-export-png'){exportMap(m,a==='map-export-png');return true;}
 return true;
}
function onChange(el,p){
 const m=current(p);
 if(el.dataset.mapTitle!==undefined){m.title=el.value;ctx.save();ctx.render();return true;}
 if(el.dataset.mapPaper!==undefined){m.paper=el.value;ctx.save();ctx.render();return true;}
 if(el.dataset.mapLineStyle!==undefined){lineStyle=el.value;return true;}
 if(el.dataset.mapPoint!==undefined){
  const f=selected(m);selectedPoint=el.value===''?-1:clamp(Number(el.value),0,(f?.points?.length||1)-1);ctx.render();return true;
 }
 if(el.dataset.mapCoordinate){
  const f=selected(m),v=f?.points?.[selectedPoint];if(!v)return true;
  v[el.dataset.mapCoordinate]=clamp(el.value,0,el.dataset.mapCoordinate==='x'?W:H);
  ctx.save();ctx.render();return true;
 }
 if(el.dataset.mapEdit){const f=selected(m);if(!f)return true;const k=el.dataset.mapEdit;
  f[k]=k==='smooth'?el.checked:['size','width'].includes(k)?Number(el.value):k.startsWith('weight')?Number(el.value):el.value;
  if(k==='size')f.size=clamp(f.size,12,76);
  if(k==='width')f.width=clamp(f.width,1,20);
  ctx.save();ctx.render();return true;
 }
 return false;
}
function onInput(el,p){
 if(el.dataset.mapEdit){
  const m=current(p),f=selected(m);if(!f)return true;const k=el.dataset.mapEdit;
  f[k]=k.startsWith('weight')?Number(el.value):el.value;
  ctx.save();return true;
 }
 return false;
}
function download(name,blob){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.download=name;a.href=url;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
async function exportMap(m,png){
 if(!m)return;
 try{
  // Temporarily hide UI selection highlights in exported artwork.
  const existing=selectedId;selectedId='';
  const xml='<?xml version="1.0" encoding="utf-8"?>'+mapSVG(m,true);
  selectedId=existing;
  const name=(m.title||'story-map').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,55)||'story-map';
  if(!png){download(name+'.svg',new Blob([xml],{type:'image/svg+xml;charset=utf-8'}));ctx.toast('Editable SVG map downloaded.');return;}
  const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
  try{
   const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('SVG conversion failed'));im.src=url;});
   const can=document.createElement('canvas');can.width=1500;can.height=975;can.getContext('2d').drawImage(image,0,0,can.width,can.height);
   const data=can.toDataURL('image/png'),link=document.createElement('a');link.download=name+'.png';link.href=data;document.body.appendChild(link);link.click();link.remove();ctx.toast('Map PNG downloaded.');
  }finally{URL.revokeObjectURL(url);}
 }catch(e){ctx.toast('Map export was blocked by this browser. Try the SVG download.');}
}
function onKeydown(e){
 if(e.key==='Escape'&&(drawing||polygonPoints.length||pointInsertMode)){
  e.preventDefault?.();drawing=null;polygonPoints=[];pointInsertMode=false;ctx.render();return true;
 }
 if(e.key==='Escape'&&focusMode){e.preventDefault?.();focusMode=false;toolsOpen=false;detailsOpen=false;ctx.render();return true;}
 return false;
}
function reset(){activeId='';selectedId='';selectedPoint=-1;pointInsertMode=false;tool='select';drawing=null;polygonPoints=[];focusMode=false;toolsOpen=false;detailsOpen=false;}
function configure(c){ctx=c;}
window.SpindleMaps={configure,ensure,render,onAction,onInput,onChange,onPointerDown,onPointerMove,onPointerUp,onKeydown,reset,presetPoints,terrainMark,svgContent};
})();
