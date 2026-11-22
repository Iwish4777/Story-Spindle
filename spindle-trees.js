/* Story Spindle: AI-free Story Trees network visualization. */
(function treeFeature(){
 'use strict';
 let ctx=null,focus='',filter='all';
 const kinds=[['character','Characters'],['chapter','Chapters'],['plot','Plot points'],['revelation','Revelations'],['world','Worldbuilding'],['theme','Themes'],['string','Strings'],['ending','Ending']];
 const kindLabel=Object.fromEntries(kinds);
 const groupOf={character:0,chapter:1,plot:2,revelation:2,world:3,theme:3,string:3,ending:3};
 const colors={character:'#45745e',chapter:'#826445',plot:'#a07442',revelation:'#7c5e9d',world:'#4d7b7b',theme:'#ab667b',string:'#667eae',ending:'#a37c36'};
 const norm=t=>String(t||'').toLocaleLowerCase().normalize('NFKC').replace(/\s+/g,' ').trim();
 const shorten=(t,n=90)=>{const s=String(t||'').replace(/\s+/g,' ').trim();return s.length>n?s.slice(0,n-1)+'…':s||'Untitled';};
 const key=(kind,id)=>kind+':'+id;
 const containsPhrase=(text,term)=>{
  const a=norm(text),b=norm(term);if(b.length<2)return false;let pos=0;
  while((pos=a.indexOf(b,pos))!==-1){const before=a[pos-1],after=a[pos+b.length];const word=c=>c&&/[\p{L}\p{N}]/u.test(c);if(!word(before)&&!word(after))return true;pos+=b.length;}
  return false;
 };
 function ensure(p){if(!Array.isArray(p.storyTreeLinks))p.storyTreeLinks=[];}
 function build(p){
  ensure(p);const nodes=[],edges=[],ids=new Set(),seen=new Set();
  function node(type,id,title,view,detail=''){
   if(!id)return;const n={id:key(type,id),type,title:shorten(title,160),view,detail:String(detail||'')};if(ids.has(n.id))return;ids.add(n.id);nodes.push(n);
  }
  function edge(a,b,label,manual=false,note='',linkId=''){
   if(!ids.has(a)||!ids.has(b)||a===b)return;
   const id=manual?`manual:${linkId}`:`${[a,b].sort().join('/')}|${label}`;
   if(seen.has(id))return;seen.add(id);edges.push({a,b,label,manual,note,id:linkId});
  }
  const chars=[...(p.mainCharacters||[]),...(p.supportingCharacters||[])];
  chars.forEach((c,i)=>node('character',c.id,c.name||`Character ${i+1}`,(p.mainCharacters||[]).includes(c)?'main':'other',c.role||c.personality));
  (p.chapters||[]).forEach((c,i)=>node('chapter',c.id,`Chapter ${i+1}: ${c.title||'Untitled'}`,'chapters',c.majorEvent||c.outcome||c.location));
  (p.plot?.events||[]).forEach((c,i)=>node('plot',c.id,c.title||`Plot point ${i+1}`,'plot',c.details));
  (p.revelations||[]).forEach((c,i)=>node('revelation',c.id,c.title||`Discovery ${i+1}`,'continuity',c.notes));
  (p.world||[]).forEach((c,i)=>node('world',c.id,c.title||`World entry ${i+1}`,'world',c.description));
  (p.themes||[]).forEach((c,i)=>node('theme',c.id,c.title||`Theme ${i+1}`,'themes',c.meaning));
  (p.strings||[]).forEach((c,i)=>node('string',c.id,c.text||`String ${i+1}`,'strings',c.notes));
  if(p.ending?.summary?.trim())node('ending','story','Story ending','ending',p.ending.summary);
  for(const c of p.chapters||[]){
   const ch=key('chapter',c.id);
   for(const id of c.characterIds||[])edge(key('character',id),ch,'Appears in chapter');
   for(const id of c.knowledgeUses||[])edge(key('revelation',id),ch,'Fact used in chapter');
   for(const w of p.world||[])if(w.title && containsPhrase(c.location,w.title))edge(key('world',w.id),ch,'Location name matches setting');
   for(const t of p.themes||[])if(t.title && containsPhrase(c.theme,t.title))edge(key('theme',t.id),ch,'Theme name appears in chapter notes');
  }
  for(const c of chars){
   if(c.introChapterId)edge(key('character',c.id),key('chapter',c.introChapterId),'First appears in chapter');
   for(const other of chars)if(c.id!==other.id&&other.name&&containsPhrase(c.relationships,other.name))
    edge(key('character',c.id),key('character',other.id),'Name in relationship notes');
  }
  for(const e of p.plot?.events||[])if(e.chapterId)edge(key('plot',e.id),key('chapter',e.chapterId),'Plot point assigned to chapter');
  for(const r of p.revelations||[]){
   if(r.characterId)edge(key('revelation',r.id),key('character',r.characterId),'Character learns fact');
   if(r.learnedChapterId)edge(key('revelation',r.id),key('chapter',r.learnedChapterId),'Revealed in chapter');
  }
  for(const link of p.stringLinks||[])edge(key('string',link.a),key('string',link.b),'Linked Strings',false,link.note||'');
  for(const link of p.storyTreeLinks)if(link?.id)edge(link.from,link.to,link.label||'Connected',true,link.notes||'',link.id);
  return {nodes,edges};
 }
 function selectGraph(full){
  const found=full.nodes.some(n=>n.id===focus);if(!found)focus='';
  let selected;
  if(focus){const keep=new Set([focus]);for(const e of full.edges){if(e.a===focus)keep.add(e.b);if(e.b===focus)keep.add(e.a);}selected=full.nodes.filter(n=>keep.has(n.id));}
  else selected=(filter==='all'?full.nodes:full.nodes.filter(n=>n.type===filter)).slice(0,72);
  const ids=new Set(selected.map(n=>n.id));
  return {nodes:selected,edges:full.edges.filter(e=>ids.has(e.a)&&ids.has(e.b)),truncated:!focus && selected.length<(filter==='all'?full.nodes.length:full.nodes.filter(n=>n.type===filter).length)};
 }
 function svgMap(part,esc){
  const columns=[[],[],[],[]];for(const n of part.nodes)columns[groupOf[n.type]??3].push(n);
  const xs=[24,278,532,786],w=210,h=57,step=81,height=Math.max(365,117+Math.max(3,...columns.map(x=>x.length))*step);
  const pos=new Map();columns.forEach((arr,col)=>arr.forEach((n,i)=>pos.set(n.id,{x:xs[col],y:102+i*step})));
  const strokes=part.edges.map(e=>{
    const a=pos.get(e.a),b=pos.get(e.b);if(!a||!b)return '';
    const x1=a.x+w/2,y1=a.y+h/2,x2=b.x+w/2,y2=b.y+h/2;
    const curve=Math.max(65,Math.abs(x2-x1)*.42),direction=Math.sign(x2-x1)||1;
    const d=Math.abs(x1-x2)>20?`M${x1},${y1} C${x1+direction*curve},${y1} ${x2-direction*curve},${y2} ${x2},${y2}`:`M${x1},${y1} Q${x1+95},${(y1+y2)/2} ${x2},${y2}`;
    return `<path d="${d}" stroke="${e.manual?'#a4774b':'#b7c5b9'}" stroke-width="${e.manual?2.8:1.8}" ${e.manual?'stroke-dasharray="6 4"':''} fill="none"><title>${esc(e.label)}</title></path>`;
  }).join('');
  const blocks=part.nodes.map(n=>{
    const p=pos.get(n.id),color=colors[n.type],label=kindLabel[n.type],first=shorten(n.title,26),second=n.title.length>26?shorten(n.title.slice(25),25):'';
    return `<g class="tree-graph-node" data-action="tree-focus-node" data-node="${esc(n.id)}" role="button" tabindex="0" aria-label="${esc('Explore '+n.title)}"><title>${esc(n.title)}</title><rect x="${p.x}" y="${p.y}" width="${w}" height="${h}" rx="9" fill="#fff" stroke="${color}" stroke-width="${n.id===focus?3:1.5}"/><rect x="${p.x}" y="${p.y}" width="6" height="${h}" rx="3" fill="${color}"/><text x="${p.x+14}" y="${p.y+18}" font-size="10" fill="${color}" font-weight="700">${esc(label)}</text><text x="${p.x+14}" y="${p.y+37}" font-size="12" fill="#283c32" font-weight="650">${esc(first)}</text>${second?`<text x="${p.x+14}" y="${p.y+50}" font-size="9" fill="#5b7065">${esc(second)}</text>`:''}</g>`;
  }).join('');
  const heads=['CHARACTERS','CHAPTERS','PLOT & DISCOVERIES','WORLD, THEMES & IDEAS'].map((title,i)=>`<text x="${xs[i]}" y="60" fill="#53695c" font-size="12" font-weight="750">${title} · ${columns[i].length}</text>`).join('');
  return `<div class="tree-map-scroll" aria-label="Scrollable interactive story relationship map"><svg viewBox="0 0 1020 ${height}" width="1020" height="${height}" role="group" aria-label="Story nodes and connections">${heads}${strokes}${blocks}</svg></div>`;
 }
 function options(nodes,esc,chosen='',placeholder='Choose a story element'){
  return `<option value="">${esc(placeholder)}</option>`+kinds.map(([type,title])=>{
   const group=nodes.filter(n=>n.type===type);
   return group.length?`<optgroup label="${esc(title)}">${group.map(n=>`<option value="${esc(n.id)}" ${chosen===n.id?'selected':''}>${esc(shorten(n.title,72))}</option>`).join('')}</optgroup>`:'';
  }).join('');
 }
 function linkedDetails(full,esc){
  const n=full.nodes.find(x=>x.id===focus);if(!n)return '<p class="small muted">Click any node in the diagram to focus on it and explore its links.</p>';
  const edges=full.edges.filter(x=>x.a===focus||x.b===focus);
  return `<div class="tree-detail"><div class="tree-detail-head"><div><span class="small muted">${esc(kindLabel[n.type])}</span><h3>${esc(n.title)}</h3></div><button class="btn btn-secondary btn-small" data-action="tree-open-source" data-node="${esc(n.id)}">Open source section</button></div>${n.detail?`<p class="muted small">${esc(shorten(n.detail,250))}</p>`:''}<p class="small muted">${edges.length} direct connection${edges.length===1?'':'s'}</p>${edges.length?`<div class="tree-related">${edges.map(e=>{
   const other=full.nodes.find(x=>x.id===(e.a===focus?e.b:e.a));
   return other?`<button data-action="tree-focus-node" data-node="${esc(other.id)}"><strong>${esc(shorten(other.title,70))}</strong><span>${esc((e.manual?'Manual: ':'')+e.label)}</span></button>`:'';
  }).join('')}</div>`:'<p class="small muted">No connections are recorded for this entry yet.</p>'}</div>`;
 }
 function render(p,{heading,esc}){
  const full=build(p),part=selectGraph(full),manual=full.edges.filter(e=>e.manual).length,auto=full.edges.length-manual;
  const linked=new Set(full.edges.flatMap(e=>[e.a,e.b]));
  const orphan=full.nodes.filter(n=>!linked.has(n.id)).length;
  return `<section class="page">${heading('An evolving map','Story Trees','Explore the connections between your characters, chapters, plot, places, themes, and ideas.')}
    <div class="grid three tree-stat-grid"><div class="card metric"><span class="number">${full.nodes.length}</span><small>Story elements</small></div><div class="card metric"><span class="number">${auto}</span><small>Automatic links</small></div><div class="card metric"><span class="number">${manual}</span><small>Your own connections</small></div></div>
    <div class="info" style="margin-top:17px"><strong>Updates as you plan.</strong> Spindle reads chapter assignments, linked events and revelations, saved Strings links, and literal name matches in planning fields. A matching name is a clue—not an inferred relationship. No AI or manuscript interpretation is used.</div>
    <div class="card" style="margin-top:17px"><div class="card-top"><div><h3>Story connection map</h3><p>${orphan} story element${orphan===1?'':'s'} without a saved connection. Select a node to explore.</p></div>${focus?`<button class="btn btn-secondary btn-small" data-action="tree-reset">Show entire map</button>`:''}</div>
       <div class="tree-filters"><div class="field"><label for="tree-focus">Focus on an item</label><select class="control" id="tree-focus" data-tree-change="focus">${options(full.nodes,esc,focus,'Entire story')}</select></div>
       <div class="field"><label for="tree-filter">Filter by section</label><select class="control" id="tree-filter" data-tree-change="filter"><option value="all">All sections</option>${kinds.filter(([k])=>full.nodes.some(n=>n.type===k)).map(([k,v])=>`<option value="${k}" ${filter===k?'selected':''}>${esc(v)}</option>`).join('')}</select></div></div>
       ${part.truncated?`<div class="notice" style="margin-bottom:10px">This overview displays up to 72 entries. Choose a section or focus on an item to explore more.</div>`:''}
       ${part.nodes.length?svgMap(part,esc):'<div class="empty"><strong>Your story begins here</strong>Add characters or chapters and they will appear in the tree.</div>'}
       ${linkedDetails(full,esc)}
    </div>
    <div class="card" style="margin-top:17px"><div class="card-top"><div><h3>Add your own connections</h3><p>For relationships the existing planning fields don’t explicitly capture: allies, rivals, foreshadowing, shared locations, and more.</p></div></div>
    ${full.nodes.length>=2?`<div class="stack"><div class="field-row"><div class="field"><label for="tree-from">From</label><select class="control" id="tree-from">${options(full.nodes,esc,focus)}</select></div><div class="field"><label for="tree-to">To</label><select class="control" id="tree-to">${options(full.nodes,esc)}</select></div></div>
    <div class="field-row"><div class="field"><label for="tree-label">Relationship (optional)</label><input id="tree-label" class="control" maxlength="120" placeholder="e.g. Siblings, Foreshadows, Supports"></div><div class="field"><label for="tree-notes">Notes (optional)</label><input id="tree-notes" class="control" maxlength="500" placeholder="Describe this connection"></div></div><div><button class="btn" data-action="tree-add">＋ Save connection</button></div></div>`:'<p class="small muted">Add at least two entries to start making your own connections.</p>'}
    ${p.storyTreeLinks.length?`<h3 class="section-title">Saved manual connections</h3>${p.storyTreeLinks.map(l=>{
     const a=full.nodes.find(x=>x.id===l.from),b=full.nodes.find(x=>x.id===l.to);
     return `<div class="tree-link-row"><div><strong>${esc(a?.title||'Deleted entry')} ↔ ${esc(b?.title||'Deleted entry')}</strong><div class="small muted">${esc(l.label||'Connected')}${l.notes?' · '+esc(l.notes):''}</div></div><button class="btn btn-danger btn-small" data-action="tree-remove" data-id="${esc(l.id)}">Remove</button></div>`;
    }).join('')}`:''}
    </div><p class="small muted" style="margin-top:15px">Automatically identified links are recalculated from current project data. Manually saved links are included in project backups.</p>
  </section>`;
 }
 function onAction(action,el,p){
  if(!action.startsWith('tree-'))return false;
  if(action==='tree-focus-node'){focus=el.dataset.node;ctx.render();}
  if(action==='tree-reset'){focus='';filter='all';ctx.render();}
  if(action==='tree-open-source'){const n=build(p).nodes.find(n=>n.id===el.dataset.node);if(n)ctx.navigate(n.view);}
  if(action==='tree-add'){
   const from=document.getElementById('tree-from')?.value,to=document.getElementById('tree-to')?.value;
   const valid=new Set(build(p).nodes.map(n=>n.id));
   if(!from||!to||from===to||!valid.has(from)||!valid.has(to)){ctx.toast('Choose two different story elements.');return true;}
   const label=document.getElementById('tree-label')?.value.trim().slice(0,120)||'Connected',notes=document.getElementById('tree-notes')?.value.trim().slice(0,500)||'';
   if(p.storyTreeLinks.some(l=>[l.from,l.to].sort().join('|')===[from,to].sort().join('|')&&l.label===label)){ctx.toast('This connection is already saved.');return true;}
   p.storyTreeLinks.push({id:ctx.makeId(),from,to,label,notes});focus=from;ctx.save();ctx.render();ctx.toast('Story connection saved.');
  }
  if(action==='tree-remove'){
   const l=p.storyTreeLinks.find(x=>x.id===el.dataset.id);
   if(l && confirm(`Remove your connection “${l.label}”?`)){p.storyTreeLinks=p.storyTreeLinks.filter(x=>x.id!==l.id);ctx.save();ctx.render();}
  }
  return true;
 }
 function onChange(el){
  if(el.dataset.treeChange==='focus'){focus=el.value;ctx.render();return true;}
  if(el.dataset.treeChange==='filter'){focus='';filter=el.value;ctx.render();return true;}
  return false;
 }
 function onKeydown(e){
  const el=e.target?.closest?.('.tree-graph-node');
  if(el&&(e.key==='Enter'||e.key===' ')){e.preventDefault();focus=el.dataset.node;ctx.render();return true;}return false;
 }
 const configure=c=>{ctx=c;};
 const reset=()=>{focus='';filter='all';};
 window.SpindleTrees={ensure,build,render,onAction,onChange,onKeydown,configure,reset,containsPhrase};
})();
