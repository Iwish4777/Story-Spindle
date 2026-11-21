/* Story Spindle — entirely client-side, deliberately no AI, API calls, external scripts, or trackers. */
(() => {
'use strict';
const STORAGE_KEY = 'story-studio.v1';
const NAV = [
  ['dashboard','⌂','Overview'],['plot','◇','Plot'],['main','♙','Main characters'],['world','◈','Worldbuilding'],
  ['other','♧','Other characters'],['ending','⚑','Ending'],['themes','✿','Themes'],['chapters','▤','Chapter outlines'],
  ['writing','✎','Writing'],['wordbank','✦','Word parking lot'],['strings','⌁','Strings'],['continuity','◎','Continuity checks'],['settings','⚙','Project & backup']
];
const WORLD_CATEGORIES = ['Geography & lands','Cultures & societies','Science & nature','Magic & technology','History & politics','Creatures & ecology','Other'];
const GUIDES = {
 plot:{title:'Discover your plot',intro:'Answer any question that sparks an idea. There are no wrong answers and no generated story suggestions.',questions:[
  'What does your protagonist want before the story changes their life?',
  'What disrupts their ordinary world?',
  'What stands between them and the thing they want?',
  'What is one choice they will have to make that they would rather avoid?',
  'What could change if they succeed—or fail?',
  'Which three moments might permanently change the direction of the story?'
 ]},
 main:{title:'Develop a central character',intro:'Explore contradictions and motivations without forcing an archetype.',questions:[
  'What does this character want, and what do they actually need?',
  'What belief about themselves or the world might be challenged?',
  'What small habit would reveal something important about them?',
  'Which relationship most influences their decisions?',
  'What would be hard for them to do at the beginning but possible by the end?'
 ]},
 world:{title:'Explore your world',intro:'Choose the questions that match the genre and scale of your story.',questions:[
  'What feature of this place shapes ordinary daily life?',
  'What do residents take for granted that a visitor would find strange?',
  'How do climate, geography, resources, or technology constrain events?',
  'What conflicts, inequities, or mysteries are part of this society?',
  'What rules must remain consistent throughout the story?'
 ]},
 other:{title:'Develop a supporting character',intro:'Give every supporting character a life beyond their immediate usefulness to the plot.',questions:[
  'What does this person want when the protagonist is not around?',
  'How do they help, oppose, or challenge the protagonist?',
  'What assumption about them might turn out to be wrong?',
  'How would the story change if they were absent?'
 ]},
 ending:{title:'Find the ending',intro:'You can explore the destination without deciding every detail.',questions:[
  'What should be different about the protagonist at the end?',
  'What question from the beginning deserves an answer?',
  'What price is paid for the resolution?',
  'What emotion would you like the final scene to leave with the reader?',
  'Which threads should intentionally remain unresolved?'
 ]},
 themes:{title:'Uncover your themes',intro:'Themes can emerge from recurring choices and contrasts as much as from advance planning.',questions:[
  'Which questions or conflicts keep returning in your story?',
  'What do two characters believe differently about the same issue?',
  'Which symbol, location, or event might echo this idea?',
  'How might the meaning of this theme change by the ending?'
 ]},
 chapters:{title:'Shape a chapter',intro:'Focus on what changes rather than on making every chapter fit a formula.',questions:[
  'What is different at the end of this chapter?',
  'Whose goal drives the action here?',
  'What new information, decision, or obstacle shifts the story?',
  'How does this chapter connect to the one before and after it?'
 ]},
 writing:{title:'Get unstuck while drafting',intro:'These prompts invite your own creativity; nothing writes the scene for you.',questions:[
  'What does the viewpoint character notice first?',
  'What is the immediate tension in this scene?',
  'What does someone want to say but choose not to?',
  'What concrete sensory detail makes this place particular?',
  'What changes by the final paragraph?'
 ]}
};
const makeId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const defaultProject = (name='Untitled novel') => ({
 id:makeId(),title:name,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
 plot:{status:'unsure',summary:'',events:[]},mainCharacters:[],world:[],supportingCharacters:[],
 ending:{summary:'',openThreads:''},themes:[],chapters:[],revelations:[],customChecks:[],wordBank:[],strings:[],stringLinks:[],exerciseNotes:{},
});
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const countWords = str => (String(str || '').match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)||[]).length;
const options = (pairs,selected) => pairs.map(([value,label])=>`<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(label)}</option>`).join('');
const allCharacters = project => [...project.mainCharacters,...project.supportingCharacters];
const chapterLabel = (project,id) => {const i=project.chapters.findIndex(c=>c.id===id);return i<0?'Not selected':`Chapter ${i+1}: ${project.chapters[i].title||'Untitled'}`;};
const chapterOptions = (p,selected,{none='Not specified'}={}) => options([['',none],...p.chapters.map((c,i)=>[c.id,`Chapter ${i+1}: ${c.title||'Untitled'}`])],selected);
const toastElement = document.getElementById('toast');
let toastTimer;
function toast(message){toastElement.textContent=message;toastElement.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastElement.classList.remove('visible'),3600);}
let store;
try { const raw=localStorage.getItem(STORAGE_KEY); store=raw?JSON.parse(raw):null; } catch(e) { store=null; }
if(!store || !Array.isArray(store.projects) || !store.projects.length) {const p=defaultProject();store={version:1,activeId:p.id,projects:[p]};}
for(const p of store.projects)SpindleFeatures.ensureProject(p);
let activeView='dashboard';let selectedChapterId=null;let continuityResults=null;let storageError=false;
const project = () => store.projects.find(p=>p.id===store.activeId) || store.projects[0];
function save(){project().updatedAt=new Date().toISOString();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(store));storageError=false;const el=document.getElementById('save-status');if(el)el.textContent='✓ Saved locally';}catch(e){storageError=true;const el=document.getElementById('save-status');if(el)el.textContent='⚠ Storage full';toast('Browser storage is unavailable or full. Export a backup immediately.');}}
function getPath(obj,path){return path.split('.').reduce((a,b)=>a?.[b],obj);}
function setPath(obj,path,val){const keys=path.split('.');const last=keys.pop();const target=keys.reduce((a,k)=>(a[k]??={}),obj);target[last]=val;}
function list(p,path){return getPath(p,path) || [];}
function newItem(path){
 const core={id:makeId()};
 switch(path){
 case 'plot.events':return {...core,title:'',details:'',chapterId:''};
 case 'mainCharacters': case 'supportingCharacters':return {...core,name:'',role:'',hair:'',eyes:'',features:'',personality:'',habits:'',background:'',relationships:'',arc:'',introChapterId:''};
 case 'world':return {...core,title:'',category:'Geography & lands',description:'',features:'',issues:'',cultures:'',science:'',rules:''};
 case 'themes':return {...core,title:'',meaning:'',expression:''};
 case 'chapters':return {...core,title:'',location:'',majorEvent:'',theme:'',outcome:'',storyDay:'',isFlashback:false,characterIds:[],knowledgeUses:[],manuscript:''};
 case 'revelations':return {...core,title:'',characterId:'',learnedChapterId:'',notes:''};
 case 'customChecks':return {...core,phrase:'',replacement:'',enabled:true};
 case 'wordBank':return {...core,word:'',meaning:'',usage:''};
 case 'strings':return {...core,text:'',tags:'',notes:''};
 default:throw new Error('Unknown collection');
 }
}
function field(label,path,value,placeholder='',kind='text',hint=''){
 const props=`data-bind="${esc(path)}"`;
 return `<div class="field"><label>${esc(label)}</label>${kind==='textarea'?
 `<textarea class="control textarea" rows="4" ${props} placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:
 `<input class="control" type="${kind==='number'?'number':'text'}" ${props} value="${esc(value)}" placeholder="${esc(placeholder)}">`}${hint?`<small>${esc(hint)}</small>`:''}</div>`;
}
function itemField(label,path,id,key,value,placeholder='',kind='text',hint=''){
 const props=`data-list="${esc(path)}" data-id="${esc(id)}" data-key="${esc(key)}"`;
 return `<div class="field"><label>${esc(label)}</label>${kind==='textarea'?
 `<textarea class="control textarea" rows="3" ${props} placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:
 `<input class="control" type="${kind==='number'?'number':'text'}" ${props} value="${esc(value)}" placeholder="${esc(placeholder)}">`}${hint?`<small>${esc(hint)}</small>`:''}</div>`;
}
function itemSelect(label,path,id,key,pairs,value,hint=''){
 return `<div class="field"><label>${esc(label)}</label><select class="control" data-list="${esc(path)}" data-id="${esc(id)}" data-key="${esc(key)}">${options(pairs,value)}</select>${hint?`<small>${esc(hint)}</small>`:''}</div>`;
}
function addButton(path,label){return `<button class="btn btn-secondary" data-action="add" data-path="${esc(path)}">＋ ${esc(label)}</button>`;}
function itemHead(title,path,id,number,canMove=true){return `<div class="item-head"><strong>${esc(title || `Entry ${number}`)}</strong><div class="inline-actions">${canMove?`<button class="btn btn-ghost btn-icon" data-action="move" data-path="${path}" data-id="${id}" data-offset="-1" aria-label="Move up" title="Move up">↑</button><button class="btn btn-ghost btn-icon" data-action="move" data-path="${path}" data-id="${id}" data-offset="1" aria-label="Move down" title="Move down">↓</button>`:''}<button class="btn btn-danger btn-icon" data-action="remove" data-path="${path}" data-id="${id}" aria-label="Remove" title="Remove">×</button></div></div>`;}
function emptyState(name,description){return `<div class="empty"><strong>${esc(name)}</strong>${esc(description)}</div>`;}
function heading(section,title,desc,actions=''){return `<div class="page-heading"><div><div class="eyebrow">${esc(section)}</div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>${actions?`<div class="inline-actions">${actions}</div>`:''}</div>`;}
const guideButton = key => `<button class="btn btn-secondary btn-small" data-action="guide" data-guide="${key}">✳ Guided exercises</button>`;
function renderNav(){document.getElementById('sidebar-nav').innerHTML=NAV.map(([id,icon,label])=>`<button class="nav-btn ${activeView===id?'active':''}" data-action="nav" data-view="${id}" ${activeView===id?'aria-current="page"':''}><span class="nav-icon" aria-hidden="true">${icon}</span>${label}</button>`).join('');}
function renderSwitcher(){document.getElementById('project-select').innerHTML=options(store.projects.map(p=>[p.id,p.title || 'Untitled novel']),project().id);}
function hero(){return `<div class="hero"><img src="assets/story-spindle-banner.jpg" alt="Story Spindle — Weave the threads of your story. A vintage spinning wheel beside antique lettering on parchment." loading="eager" decoding="async"></div><div class="story-ribbon"><div class="ribbon-eyebrow">YOUR CURRENT MANUSCRIPT</div><h1>${esc(project().title)}</h1><p>Gather the threads. Shape the world. Tell your story.</p></div>`;}
function dashboard(p){
 const totalWords=p.chapters.reduce((sum,c)=>sum+countWords(c.manuscript),0);
 return `<section class="page">${hero()}${heading('The writing desk','Every thread has its place','Your plot, characters, world, and chapters—all connected, all your own.')}
 <div class="grid three">
  <div class="card metric"><span class="metric-icon">✎</span><span class="number">${totalWords.toLocaleString()}</span><small>Manuscript words</small></div>
  <div class="card metric"><span class="metric-icon">▤</span><span class="number">${p.chapters.length}</span><small>Chapters planned</small></div>
  <div class="card metric"><span class="metric-icon">♙</span><span class="number">${allCharacters(p).length}</span><small>Characters tracked</small></div>
 </div><h2 class="section-title">Continue creating</h2>
 <div class="grid three">${[
 ['plot','◇','Shape the plot','Outline major events and connect them to chapters.'],
 ['main','♙','Know your characters','Develop personalities, appearances, and character arcs.'],
 ['world','◈','Build the world','Keep places, cultures, science, and rules together.'],
 ['chapters','▤','Plan chapters','Outline scenes and track your story’s chronology.'],
 ['writing','✎','Write the manuscript','Draft in a distraction-light, chapter-linked editor.'],
 ['continuity','◎','Check continuity','Run transparent, rule-based checks without AI.'],
 ['wordbank','✦','Park interesting words','Collect words you want to weave into your manuscript.'],
 ['strings','⌁','Gather your strings','Capture sparks and discover connections between them.']
 ].map(([key,icon,title,desc])=>`<button class="link-card" data-action="nav" data-view="${key}"><span style="font-size:23px">${icon}</span><span class="title">${title}</span><span class="description">${desc}</span></button>`).join('')}</div>
 <div class="info" style="margin-top:19px"><strong>Private by design.</strong> Your work is saved in this browser, not on a server. Export regular backups from Project & backup. The app has no AI features, accounts, analytics, or outside connections.</div>
 </section>`;
}
function plotPage(p){const events=p.plot.events||[];return `<section class="page">${heading('Story architecture','Plot','Record what you know, leave what you don’t, and connect important turning points to chapters.',guideButton('plot'))}
 <div class="card stack">
  <div class="field"><label for="plot-status">How clearly do you know the central plot?</label><select class="control" id="plot-status" data-bind="plot.status">${options([['unsure','Not sure yet'],['partial','I have some ideas'],['clear','I have a clear plan']],p.plot.status)}</select></div>
  ${p.plot.status==='unsure'?`<div class="notice"><strong>Still exploring?</strong> You can leave this blank, or try a guided exercise with questions to uncover the story yourself. <div style="margin-top:10px">${guideButton('plot')}</div></div>`:''}
  ${field('Story summary','plot.summary',p.plot.summary,'What is your story about? Write a few lines or a full synopsis.','textarea')}
 </div>
 <div class="card" style="margin-top:17px"><div class="card-top"><div><h3>Chain of events</h3><p>Arrange turning points in story order. Each event can link to a chapter.</p></div>${addButton('plot.events','Add plot point')}</div>
 ${events.length?events.map((e,i)=>`<div class="item-card">${itemHead(`Plot point ${i+1}`,'plot.events',e.id,i+1)}
 <div class="stack">${itemField('Event / turning point','plot.events',e.id,'title',e.title,'A discovery, decision, setback, or turning point')}${itemField('What happens and why it matters','plot.events',e.id,'details',e.details,'Describe the event and its consequences','textarea')}${itemSelect('Connected chapter','plot.events',e.id,'chapterId',[['','Not assigned'],...p.chapters.map((c,i)=>[c.id,`Chapter ${i+1}: ${c.title||'Untitled'}`])],e.chapterId)}</div></div>`).join(''):emptyState('No plot points yet','Add the first event whenever an idea emerges.')}
 </div></section>`;}
function characterCard(p,c,path,index){return `<div class="item-card">${itemHead(c.name||`Character ${index+1}`,path,c.id,index+1)}
 <div class="stack">
 <div class="field-row">${itemField('Name',path,c.id,'name',c.name,'Character name')}${itemField('Role in the story',path,c.id,'role',c.role,'Protagonist, mentor, foil, friend…')}</div>
 <div class="field-row">${itemField('Hair',path,c.id,'hair',c.hair,'Color and appearance')}${itemField('Eyes',path,c.id,'eyes',c.eyes,'Color and appearance')}</div>
 ${itemField('Other physical characteristics',path,c.id,'features',c.features,'Build, distinctive features, clothing…','textarea')}
 <div class="field-row">${itemField('Personality and motivations',path,c.id,'personality',c.personality,'Traits, goals, fears, contradictions…','textarea')}${itemField('Habits and mannerisms',path,c.id,'habits',c.habits,'Speech patterns, routines, quirks…','textarea')}</div>
 ${itemField('Background',path,c.id,'background',c.background,'Past events that shape their choices…','textarea')}
 ${itemField('Important relationships',path,c.id,'relationships',c.relationships,'Connections, conflicts, and their evolution…','textarea')}
 ${itemField('Character arc / development',path,c.id,'arc',c.arc,'What changes and when?','textarea')}
 ${itemSelect('First appears in chapter (optional)',path,c.id,'introChapterId',[['','Not specified'],...p.chapters.map((ch,i)=>[ch.id,`Chapter ${i+1}: ${ch.title||'Untitled'}`])],c.introChapterId,'Used by structured continuity checks.')}
 </div></div>`;}
function charactersPage(p,main){const path=main?'mainCharacters':'supportingCharacters',items=p[path];return `<section class="page">${heading('Your people',main?'Main characters':'Other characters',main?'Explore who drives the story, what shapes them, and how they change.':'Keep friends, rivals, guides, and minor characters as developed as you need.',guideButton(main?'main':'other'))}
 <div class="card"><div class="card-top"><div><h3>${main?'Central characters':'Supporting cast'}</h3><p>Add as many as your story requires.</p></div>${addButton(path,'Add character')}</div>
 ${items.length?items.map((c,i)=>characterCard(p,c,path,i)).join(''):emptyState('Your cast starts here','Add a character to begin developing their story.')}</div></section>`;}
function worldPage(p){return `<section class="page">${heading('Setting & systems','Worldbuilding','Build places, cultures, ecological systems, invented sciences, social pressures, and rules.',guideButton('world'))}
 <div class="card"><div class="card-top"><div><h3>World encyclopedia</h3><p>Every entry can represent a land, culture, creature, scientific rule, or anything else.</p></div>${addButton('world','Add entry')}</div>
 ${p.world.length?p.world.map((w,i)=>`<div class="item-card">${itemHead(w.title||`World entry ${i+1}`,'world',w.id,i+1)}<div class="stack">
 <div class="field-row">${itemField('Name / topic','world',w.id,'title',w.title,'Place, people, force, culture…')}${itemSelect('Category','world',w.id,'category',WORLD_CATEGORIES.map(c=>[c,c]),w.category)}</div>
 ${itemField('Overview','world',w.id,'description',w.description,'What is this place or concept?','textarea')}
 <div class="field-row">${itemField('Physical aspects & features','world',w.id,'features',w.features,'Terrain, structures, climate, species…','textarea')}${itemField('Issues & conflicts','world',w.id,'issues',w.issues,'Risks, tensions, struggles…','textarea')}</div>
 <div class="field-row">${itemField('Cultures & inhabitants','world',w.id,'cultures',w.cultures,'Customs, languages, communities…','textarea')}${itemField('Science, nature, or technology','world',w.id,'science',w.science,'Physical laws, biology, magic systems…','textarea')}</div>
 ${itemField('Established continuity rules','world',w.id,'rules',w.rules,'Facts that should stay true throughout this world','textarea','Reference notes for the author. Automated checks require explicit custom rules or structured timeline data.')}
 </div></div>`).join(''):emptyState('A whole world to discover','Create your first location, culture, scientific rule, or other entry.')}</div></section>`;}
function endingPage(p){return `<section class="page">${heading('The destination','Story ending','Sketch the resolution. Keep it loose if you prefer to discover the end while drafting.',guideButton('ending'))}
 <div class="card stack">${field('General overview of the ending','ending.summary',p.ending.summary,'How might the main conflict resolve? What changes?','textarea')}${field('Threads intentionally left unresolved','ending.openThreads',p.ending.openThreads,'Mysteries, ambiguities, sequel possibilities…','textarea')}</div></section>`;}
function themesPage(p){return `<section class="page">${heading('Meaning & motifs','Themes','Explore what your story asks, questions, or returns to. Themes may evolve with the draft.',guideButton('themes'))}
 <div class="card"><div class="card-top"><div><h3>Thematic threads</h3><p>Track meaning, symbols, and how each idea unfolds throughout the book.</p></div>${addButton('themes','Add theme')}</div>
 ${p.themes.length?p.themes.map((t,i)=>`<div class="item-card">${itemHead(t.title||`Theme ${i+1}`,'themes',t.id,i+1)}<div class="stack">${itemField('Theme','themes',t.id,'title',t.title,'Belonging, freedom, grief, interdependence…')}${itemField('What this theme means in your story','themes',t.id,'meaning',t.meaning,'What questions or tensions surround it?','textarea')}${itemField('How it plays out','themes',t.id,'expression',t.expression,'Scenes, arcs, symbols, conflicts…','textarea')}</div></div>`).join(''):emptyState('Themes may emerge over time','Add themes as you discover the ideas at the center of your story.')}</div></section>`;}
function chapterPage(p){return `<section class="page">${heading('Scene by scene','Chapter outlines','Plan each chapter and connect it to characters, revelations, and story chronology.',guideButton('chapters'))}
 <div class="card"><div class="card-top"><div><h3>Chapters</h3><p>Reorder chapters with the arrows. The linked manuscript follows its chapter.</p></div>${addButton('chapters','Add chapter')}</div>
 ${p.chapters.length?p.chapters.map((c,i)=>`<div class="item-card">${itemHead(`Chapter ${i+1}${c.title?': '+c.title:''}`,'chapters',c.id,i+1)}
 <div class="stack">
 <div class="field-row">${itemField('Chapter title','chapters',c.id,'title',c.title,'A working title is fine')}${itemField('Location / setting','chapters',c.id,'location',c.location,'Where does it take place?')}</div>
 <div class="field-row">${itemField('Major event','chapters',c.id,'majorEvent',c.majorEvent,'What happens in this chapter?','textarea')}${itemField('Theme / purpose','chapters',c.id,'theme',c.theme,'What is being explored?','textarea')}</div>
 ${itemField('Outcome / change','chapters',c.id,'outcome',c.outcome,'What is different at the end?','textarea')}
 <div class="field-row">${itemField('Story day (optional)','chapters',c.id,'storyDay',c.storyDay,'1, 2, 3…','number','Use story-relative days, not chapter numbers.')}<div class="field"><span>Chronology</span><label class="toggle-row"><input type="checkbox" data-list="chapters" data-id="${c.id}" data-key="isFlashback" ${c.isFlashback?'checked':''}>This is a flashback / intentionally nonlinear scene</label><small>Allows deliberate jumps backward in chapter-order timeline checks.</small></div></div>
 <div class="field"><span>Characters present</span>${characterCheckboxes(p,c)}</div>
 <div class="field"><span>Important facts used or referenced</span>${knowledgeCheckboxes(p,c)}</div>
 <div class="inline-actions"><button class="btn btn-secondary btn-small" data-action="write-chapter" data-id="${c.id}">✎ Open this chapter in Writing</button><span class="muted small">${countWords(c.manuscript)} words drafted</span></div>
 </div></div>`).join(''):emptyState('Your chapter map is empty','Add a chapter to start outlining your book.')}</div></section>`;}
function characterCheckboxes(p,c){const chars=allCharacters(p).filter(x=>x.name.trim());return chars.length?`<div class="check-grid">${chars.map(ch=>`<label class="check-tile"><input type="checkbox" data-action="toggle-ref" data-kind="characterIds" data-chapter="${c.id}" value="${ch.id}" ${c.characterIds?.includes(ch.id)?'checked':''}>${esc(ch.name)}</label>`).join('')}</div>`:`<div class="muted small">Add characters first to connect them with this chapter.</div>`;}
function knowledgeCheckboxes(p,c){return p.revelations.length?`<div class="check-grid">${p.revelations.map(r=>`<label class="check-tile"><input type="checkbox" data-action="toggle-ref" data-kind="knowledgeUses" data-chapter="${c.id}" value="${r.id}" ${c.knowledgeUses?.includes(r.id)?'checked':''}>${esc(r.title||'Untitled revelation')}</label>`).join('')}</div><small class="muted">Mark revelations a character acts on or refers to here. The checker compares them to the established discovery chapter.</small>`:`<div class="muted small">Add knowledge milestones in Continuity checks to track who learns what, and when.</div>`;}
function writingPage(p){
 if(!p.chapters.length)return `<section class="page">${heading('Your manuscript','Writing','Draft each chapter in a simple editor linked directly to its outline.',guideButton('writing'))}${emptyState('Make room for the story','Create a chapter outline first, then your writing desk will be ready.')}<div style="margin-top:14px"><button class="btn" data-action="add-and-write">＋ Create first chapter</button></div></section>`;
 let c=p.chapters.find(c=>c.id===selectedChapterId)||p.chapters[0];selectedChapterId=c.id;const index=p.chapters.findIndex(x=>x.id===c.id);
 return `<section class="page">${heading('Your manuscript','Writing desk','Your words remain yours. Draft by chapter; everything autosaves locally.',guideButton('writing'))}
 <div class="word-total">Complete manuscript: <strong id="manuscript-total-words">${p.chapters.reduce((sum,ch)=>sum+countWords(ch.manuscript),0).toLocaleString()}</strong> words <span class="muted small">· Chapter drafts only; titles and outlines excluded</span></div>
 <div class="writing-layout"><div class="chapter-index"><h3>CHAPTERS</h3>${p.chapters.map((ch,i)=>`<button class="chapter-choice ${ch.id===c.id?'selected':''}" data-action="select-chapter" data-id="${ch.id}">Chapter ${i+1}<span data-chapter-word-count="${esc(ch.id)}">${esc(ch.title||'Untitled chapter')} · ${countWords(ch.manuscript)} words</span></button>`).join('')}<button class="btn btn-secondary btn-small" style="margin:9px 5px 3px" data-action="add-and-write">＋ Chapter</button></div>
 <div class="card writer"><div class="eyebrow">CHAPTER ${index+1} OF ${p.chapters.length}</div><input class="writer-title" aria-label="Chapter title" placeholder="Untitled chapter" data-list="chapters" data-id="${c.id}" data-key="title" value="${esc(c.title)}"><div class="divider" style="margin:7px 0"></div>
 <textarea data-list="chapters" data-id="${c.id}" data-key="manuscript" id="manuscript-editor" aria-label="Chapter manuscript" placeholder="Begin your chapter here…" spellcheck="true">${esc(c.manuscript)}</textarea>
 <div class="writer-status"><span id="writer-word-count">${countWords(c.manuscript)} words · ${c.manuscript.length} characters</span><span>Autosaved locally · No AI</span></div>
 <div class="inline-actions" style="margin-top:12px"><button class="btn btn-secondary btn-small" data-action="nav" data-view="chapters">View chapter outline</button><button class="btn btn-secondary btn-small" data-action="continuity-for-chapter" data-id="${c.id}">◎ Check continuity</button></div></div></div></section>`;
}
function revelationCard(p,r,i){const characters=allCharacters(p).filter(c=>c.name.trim());return `<div class="item-card">${itemHead(r.title||`Knowledge milestone ${i+1}`,'revelations',r.id,i+1)}<div class="stack">
 ${itemField('Secret / discovery / important fact','revelations',r.id,'title',r.title,'The location of the key, a true identity…')}
 <div class="field-row">${itemSelect('Who learns it?','revelations',r.id,'characterId',[['','Not specified'],...characters.map(c=>[c.id,c.name])],r.characterId)}${itemSelect('Learns it in chapter','revelations',r.id,'learnedChapterId',[['','Not specified'],...p.chapters.map((c,i)=>[c.id,`Chapter ${i+1}: ${c.title||'Untitled'}`])],r.learnedChapterId)}</div>
 ${itemField('Notes','revelations',r.id,'notes',r.notes,'How is it learned? Who else knows?','textarea')}
 </div></div>`;}
function customRuleCard(r,i){return `<div class="item-card">${itemHead(`Phrase rule ${i+1}`,'customChecks',r.id,i+1)}<div class="stack">
 <div class="field-row">${itemField('Flag this phrase','customChecks',r.id,'phrase',r.phrase,'Old spelling, discarded name…')}${itemField('Preferred wording / note','customChecks',r.id,'replacement',r.replacement,'Use this spelling instead')}</div>
 <label class="toggle-row"><input type="checkbox" data-list="customChecks" data-id="${r.id}" data-key="enabled" ${r.enabled?'checked':''}>Enable this check</label>
 </div></div>`;}
function continuityPage(p){const findings=continuityResults;return `<section class="page">${heading('Consistency, not creativity','Continuity checks','No AI is used. This scanner compares structured facts and explicit phrase rules; it never claims to understand your story.',`<button class="btn" data-action="scan">◎ Scan manuscript</button>`)}
 <div class="info"><strong>What gets checked:</strong> Chapter chronology (with flashback exceptions), characters appearing before their recorded introduction, knowledge milestones used before they are learned, user-defined watched phrases, and simple possible hair/eye description conflicts near character names. Results are suggestions, not verdicts.</div>
 <div class="card" style="margin-top:17px"><div class="card-top"><div><h3>Knowledge milestones</h3><p>Record when specific characters learn important facts. In chapter outlines, mark where those facts are referenced.</p></div>${addButton('revelations','Add milestone')}</div>
 ${p.revelations.length?p.revelations.map((r,i)=>revelationCard(p,r,i)).join(''):emptyState('No revelations tracked','Create a knowledge milestone to help detect premature references.')}</div>
 <div class="card" style="margin-top:17px"><div class="card-top"><div><h3>Phrase watchlist</h3><p>Flag deprecated names, alternate spellings, and any wording you want to catch in your manuscript.</p></div>${addButton('customChecks','Add phrase rule')}</div>
 ${p.customChecks.length?p.customChecks.map((r,i)=>customRuleCard(r,i)).join(''):emptyState('No phrase rules yet','For example, watch for an old city name and show the approved spelling.')}</div>
 <h2 class="section-title" id="scan-results">Scan results</h2>
 ${findings===null?`<div class="empty"><strong>Ready when you are</strong>Run the scanner to review potential continuity issues in the current novel.</div>`:
 findings.length?`<p class="summary-line">Found ${findings.length} potential issue${findings.length!==1?'s':''}. Verify each against your intended story.</p>${findings.map(r=>`<div class="result ${r.level==='info'?'info-result':'warning'}"><div class="result-title">${esc(r.title)} <span class="tag">${r.level==='info'?'Review':'Possible conflict'}</span></div><div class="result-meta">${esc(r.where)}</div><p>${esc(r.details)}</p>${r.chapterId?`<div><button class="btn btn-secondary btn-mini" data-action="write-chapter" data-id="${esc(r.chapterId)}">Open chapter</button></div>`:''}</div>`).join('')}`:
 `<div class="info"><strong>No issues matched the active rules.</strong> This is not a guarantee of consistency. The checker can miss context-dependent contradictions or details that were never entered into your reference fields.</div>`}
 </section>`;}
function settingsPage(p){return `<section class="page">${heading('Ownership & control','Project & backup','Give your novel a title, export your writing, or move your work to another browser.')}
 <div class="card stack"><h3>Project details</h3>${field('Novel title','title',p.title,'Name your story')}<div class="muted small">Created ${new Date(p.createdAt).toLocaleDateString()} · Last edited ${new Date(p.updatedAt).toLocaleDateString()}</div></div>
 <div class="card stack" style="margin-top:16px"><h3>Backups & transfer</h3><p>Browser storage can be lost if site data is cleared, private browsing closes, or you change devices. Download backups regularly.</p><div class="inline-actions"><button class="btn" data-action="export-project">↧ Export this project (.json)</button><button class="btn btn-secondary" data-action="import-project">↥ Import a project (.json)</button><button class="btn btn-secondary" data-action="export-all">↧ Back up all projects</button></div><div class="divider"></div><h3>Manuscript export</h3><p>Download all drafted chapters as a plain text file, without changing your project.</p><div><button class="btn btn-secondary" data-action="export-manuscript">↧ Export manuscript (.txt)</button></div></div>
 <div class="card stack" style="margin-top:16px"><h3>Story Spindle design</h3><p>Your custom Story Spindle banner is included in <code>assets/story-spindle-banner.jpg</code>. The writing desk uses coordinated parchment, walnut, bronze, and ink tones throughout.</p><div class="notice">The banner is part of your downloaded site files. It is displayed locally without being uploaded or sent to another service.</div></div>
 <div class="card stack" style="margin-top:16px"><h3>Privacy & AI-free guarantee</h3><p>Runs locally in your browser with plain JavaScript. No generative AI, machine learning, AI APIs, third-party code, account registration, analytics, or server-side manuscript processing. Continuity checks use deterministic code and simple word patterns.</p><h3>Project controls</h3><div class="inline-actions"><button class="btn btn-secondary" data-action="new-project">＋ Start another novel</button><button class="btn btn-danger" data-action="delete-project">Delete current project</button></div></div>
 </section>`;}
function render(){const p=project();renderNav();renderSwitcher();document.getElementById('save-status').textContent=storageError?'⚠ Storage full':'✓ Saved locally';
 const extras={esc,heading,itemField,itemHead,addButton,emptyState,options};
 const pages={dashboard,plot:plotPage,main:p=>charactersPage(p,true),world:worldPage,other:p=>charactersPage(p,false),ending:endingPage,themes:themesPage,chapters:chapterPage,writing:writingPage,wordbank:p=>SpindleFeatures.wordBankPage(p,extras),strings:p=>SpindleFeatures.stringsPage(p,extras),continuity:continuityPage,settings:settingsPage};
 document.getElementById('main-content').innerHTML=(pages[activeView]||dashboard)(p);
}
function tokenizeSentences(text){return String(text||'').split(/(?<=[.!?])\s+|\n+/g).filter(Boolean);}
const COLORS=['black','brown','blonde','blond','red','auburn','white','gray','grey','silver','green','blue','hazel','amber','gold','golden','purple','violet','pink','orange'];
function textConflicts(chapter,character){
 const name=(character.name||'').trim();if(!name || !chapter.manuscript)return [];
 const results=[];const fragments=tokenizeSentences(chapter.manuscript);
 for(const fragment of fragments){
  if(!new RegExp(`\\b${escapeRegExp(name)}\\b`,'i').test(fragment))continue;
  for(const [attribute,rawValue,noun] of [['hair',character.hair,'hair'],['eyes',character.eyes,'eyes']]){
   if(!rawValue?.trim())continue;
   const expected=COLORS.filter(col=>new RegExp(`\\b${col}\\b`,'i').test(rawValue.toLowerCase()));
   if(!expected.length)continue;
   const possible=COLORS.filter(col=>new RegExp(`\\b${col}\\s+(?:\\w+\\s+)?${noun}\\b|\\b${noun}\\s+(?:were|was|are|is|looked|appeared|turned|shone|seemed|became)?\\s*${col}\\b`,'i').test(fragment));
   const conflicting=possible.filter(c=>!expected.includes(c) && !(c==='blond' && expected.includes('blonde')) && !(c==='blonde' && expected.includes('blond')) && !(c==='gray' && expected.includes('grey')) && !(c==='grey' && expected.includes('gray')));
   if(conflicting.length){results.push({title:`Possible ${attribute} description mismatch: ${name}`,details:`This sentence mentions ${name} and “${conflicting[0]} ${noun},” but the reference profile says “${rawValue}.” It may describe someone else. Review context. Snippet: ${fragment.trim().slice(0,190)}`,level:'info',where:'',chapterId:chapter.id});}
  }
  if(results.length>=4)break;
 }
 return results;
}
const escapeRegExp = text => String(text).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function scan(p){const results=[];const idx=id=>p.chapters.findIndex(c=>c.id===id);const named=allCharacters(p);
 p.chapters.forEach((c,i)=>{
  const where=`Chapter ${i+1}: ${c.title||'Untitled'}`;
  const prev=p.chapters[i-1];
  if(i>0 && c.storyDay!=='' && c.storyDay!=null && prev?.storyDay!=='' && prev?.storyDay!=null && Number.isFinite(+c.storyDay) && Number.isFinite(+prev.storyDay) && +c.storyDay<+prev.storyDay && !c.isFlashback){
   results.push({title:'Story chronology moves backward',where,chapterId:c.id,details:`Chapter ${i+1} takes place on story day ${c.storyDay}, after a chapter set on day ${prev.storyDay}. Mark this chapter as a flashback if intentional.`,level:'warning'});
  }
  for(const characterId of c.characterIds||[]){
   const ch=named.find(x=>x.id===characterId);if(ch?.introChapterId && idx(ch.introChapterId)>=0 && i<idx(ch.introChapterId)){
    results.push({title:`${ch.name||'A character'} appears before their listed introduction`,where,chapterId:c.id,details:`Profile introduction: ${chapterLabel(p,ch.introChapterId)}. This chapter is earlier in the outline.`,level:'warning'});
   }
  }
  for(const knowledgeId of c.knowledgeUses||[]){
   const milestone=p.revelations.find(x=>x.id===knowledgeId);if(!milestone?.learnedChapterId || idx(milestone.learnedChapterId)<0)continue;
   if(i<idx(milestone.learnedChapterId)){
    const character=named.find(x=>x.id===milestone.characterId);
    results.push({title:'Knowledge used before it is learned',where,chapterId:c.id,details:`“${milestone.title||'Unnamed fact'}” is linked to ${character?.name||'a character'}, who does not learn it until ${chapterLabel(p,milestone.learnedChapterId)}. Check whether this use is intentional.`,level:'warning'});
   }
  }
  for(const rule of p.customChecks){
   if(!rule.enabled || !rule.phrase?.trim())continue;
   const phrase=rule.phrase.trim();const re=new RegExp(escapeRegExp(phrase),'ig');
   const matches=[...(c.manuscript||'').matchAll(re)].length;
   if(matches)results.push({title:`Watched phrase: “${phrase}”`,where,chapterId:c.id,details:`Found ${matches} occurrence${matches===1?'':'s'}. ${rule.replacement?`Preferred wording or note: ${rule.replacement}`:'Review whether the phrase is intentional.'}`,level:'info'});
  }
  for(const ch of named){for(const possible of textConflicts(c,ch)){possible.where=where;results.push(possible);}}
 });
 return results;
}
function modalGuide(key){const guide=GUIDES[key];if(!guide)return;const note=project().exerciseNotes[key]||'';
 const layer=document.getElementById('modal-layer');layer.innerHTML=`<div class="modal-layer" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(guide.title)}"><div class="modal-head"><div><div class="eyebrow">SELF-GUIDED CREATIVE EXERCISE</div><h2>${esc(guide.title)}</h2></div><button class="btn btn-ghost btn-icon" data-action="close-guide" aria-label="Close">×</button></div><p>${esc(guide.intro)}</p><ol class="exercise-questions">${guide.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol><div class="field"><label>Your working notes (saved to this project)</label><textarea class="control textarea" rows="6" data-exercise="${esc(key)}" placeholder="Explore your ideas here. You can return whenever you like.">${esc(note)}</textarea></div><div class="inline-actions" style="margin-top:17px"><button class="btn" data-action="close-guide">Done for now</button><span class="muted small">No AI. No judgment. Just questions.</span></div></div></div>`;
 layer.querySelector('textarea').focus();
}
function closeModal(){document.getElementById('modal-layer').innerHTML='';}
function download(name,text,mime='application/json'){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const slug = text => String(text||'novel').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'novel';
function exportProject(){const p=project();download(`${slug(p.title)}-story-spindle-backup.json`,JSON.stringify({format:'story-studio',version:1,exportedAt:new Date().toISOString(),project:p},null,2));toast('Project backup downloaded.');}
function exportAll(){download('story-spindle-all-projects-backup.json',JSON.stringify({format:'story-studio',version:1,exportedAt:new Date().toISOString(),projects:store.projects},null,2));toast('All projects backup downloaded.');}
function exportManuscript(){const p=project();const text=`${p.title}\n${'='.repeat(p.title.length)}\n\n`+p.chapters.map((c,i)=>`Chapter ${i+1}${c.title?': '+c.title:''}\n\n${c.manuscript||''}`).join('\n\n\n');download(`${slug(p.title)}-manuscript.txt`,text,'text/plain;charset=utf-8');toast('Manuscript exported.');}
function normalizeProject(raw){
 if(!raw || typeof raw!=='object' || Array.isArray(raw) || !('plot' in raw) || !('chapters' in raw))throw new Error('File does not look like a Story Studio project.');
 const p={...defaultProject(),...raw};p.id=makeId();p.title=String(p.title||'Imported novel')+' (imported)';
 const defaults=defaultProject();for(const key of ['mainCharacters','world','supportingCharacters','themes','chapters','revelations','customChecks','wordBank','strings','stringLinks']){if(!Array.isArray(p[key]))p[key]=[];}
 p.plot={...defaults.plot,...p.plot};if(!Array.isArray(p.plot.events))p.plot.events=[];
 p.ending={...defaults.ending,...p.ending};p.exerciseNotes=p.exerciseNotes&&typeof p.exerciseNotes==='object'?p.exerciseNotes:{};
 for(const c of p.chapters){if(!c.id)c.id=makeId();if(!Array.isArray(c.characterIds))c.characterIds=[];if(!Array.isArray(c.knowledgeUses))c.knowledgeUses=[];if(typeof c.manuscript!=='string')c.manuscript='';}
 SpindleFeatures.ensureProject(p);
 return p;
}
async function importFile(file){if(!file)return;try{if(file.size>30*1024*1024)throw new Error('Backup exceeds 30 MB.');const parsed=JSON.parse(await file.text());const raws=parsed.project?[parsed.project]:(Array.isArray(parsed.projects)?parsed.projects:[]);if(!raws.length)throw new Error('No project was found in that file.');const imported=raws.map(normalizeProject);store.projects.push(...imported);store.activeId=imported[0].id;activeView='dashboard';continuityResults=null;selectedChapterId=null;save();render();toast(imported.length===1?`Imported “${imported[0].title}”.`:`Imported ${imported.length} novels.`);}catch(err){toast('Import failed: '+err.message);}finally{document.getElementById('import-input').value='';}}
function changeProject(id){if(!store.projects.some(p=>p.id===id))return;store.activeId=id;activeView='dashboard';selectedChapterId=null;continuityResults=null;save();render();window.scrollTo({top:0});}
function runScan(chapterId=null){continuityResults=scan(project());if(chapterId){continuityResults=continuityResults.filter(x=>x.chapterId===chapterId);}activeView='continuity';render();document.getElementById('scan-results')?.scrollIntoView({behavior:'smooth',block:'start'});}
function action(a,elem){const p=project();if(SpindleFeatures.handleAction(a,elem,p,{save,render,toast,makeId}))return;switch(a){
 case 'nav':activeView=elem.dataset.view;continuityResults=null;render();window.scrollTo({top:0});break;
 case 'add':{const path=elem.dataset.path;const entry=newItem(path);list(p,path).push(entry);if(path==='chapters')selectedChapterId=entry.id;continuityResults=null;save();render();break;}
 case 'remove':{const path=elem.dataset.path,id=elem.dataset.id;const items=list(p,path);const x=items.findIndex(it=>it.id===id);if(x===-1)return;if(!confirm('Remove this entry? This cannot be undone unless you have a backup.'))return;items.splice(x,1);if(path==='strings')p.stringLinks=p.stringLinks.filter(link=>link.a!==id && link.b!==id);if(path==='chapters' && selectedChapterId===id)selectedChapterId=null;continuityResults=null;save();render();break;}
 case 'move':{const items=list(p,elem.dataset.path),i=items.findIndex(it=>it.id===elem.dataset.id),next=i+Number(elem.dataset.offset);if(i<0||next<0||next>=items.length)return;[items[i],items[next]]=[items[next],items[i]];continuityResults=null;save();render();break;}
 case 'guide':modalGuide(elem.dataset.guide);break;
 case 'close-guide':closeModal();break;
 case 'select-chapter':selectedChapterId=elem.dataset.id;render();break;
 case 'write-chapter':selectedChapterId=elem.dataset.id;activeView='writing';render();window.scrollTo({top:0});break;
 case 'add-and-write':{const c=newItem('chapters');p.chapters.push(c);selectedChapterId=c.id;activeView='writing';save();render();document.getElementById('manuscript-editor')?.focus();break;}
 case 'scan':runScan();break;
 case 'continuity-for-chapter':runScan(elem.dataset.id);break;
 case 'new-project':{const title=prompt('What is your new novel called?','Untitled novel');if(title===null)return;const np=defaultProject(title.trim()||'Untitled novel');store.projects.push(np);store.activeId=np.id;activeView='dashboard';selectedChapterId=null;continuityResults=null;save();render();toast('New novel created.');break;}
 case 'delete-project':{if(store.projects.length===1){toast('Create another project first, or export a backup before clearing data.');return;}if(!confirm(`Permanently delete “${p.title}” from this browser? Export a backup first if you want to preserve it.`))return;store.projects=store.projects.filter(x=>x.id!==p.id);store.activeId=store.projects[0].id;activeView='dashboard';selectedChapterId=null;continuityResults=null;save();render();break;}
 case 'export-project':exportProject();break;
 case 'export-all':exportAll();break;
 case 'export-manuscript':exportManuscript();break;
 case 'import-project':document.getElementById('import-input').click();break;
 }}
document.addEventListener('click',e=>{const target=e.target.closest('[data-action]');if(target && target.tagName!=='INPUT'){e.preventDefault();action(target.dataset.action,target);}if(e.target.classList.contains('modal-layer'))closeModal();});
document.addEventListener('input',e=>{const target=e.target;if(target.dataset.exercise){project().exerciseNotes[target.dataset.exercise]=target.value;save();return;}if(!target.matches('[data-bind],[data-list]'))return;if(target.dataset.list){const obj=list(project(),target.dataset.list).find(x=>x.id===target.dataset.id);if(!obj)return;obj[target.dataset.key]=target.type==='checkbox'?target.checked:target.value;
  if(target.dataset.key==='manuscript'){const wc=document.getElementById('writer-word-count');if(wc)wc.textContent=`${countWords(target.value)} words · ${target.value.length} characters`;SpindleFeatures.updateWritingCount(project(),target.dataset.id,countWords);}
 }else{setPath(project(),target.dataset.bind,target.value);if(target.dataset.bind==='title'){document.querySelector('.story-ribbon h1')?.replaceChildren(document.createTextNode(target.value));}}
 continuityResults=null;save();});
document.addEventListener('change',e=>{const target=e.target;
 if(target.id==='project-select'){changeProject(target.value);return;}
 if(target.id==='import-input'){importFile(target.files[0]);return;}
 if(target.dataset.action==='toggle-ref'){const c=project().chapters.find(c=>c.id===target.dataset.chapter);if(!c)return;const collection=c[target.dataset.kind]||[];if(target.checked && !collection.includes(target.value))collection.push(target.value);else if(!target.checked)c[target.dataset.kind]=collection.filter(x=>x!==target.value);save();return;}
 if(target.dataset.list && target.type==='checkbox'){const obj=list(project(),target.dataset.list).find(x=>x.id===target.dataset.id);if(!obj)return;obj[target.dataset.key]=target.checked;continuityResults=null;save();return;}
 if(target.dataset.list){const obj=list(project(),target.dataset.list).find(x=>x.id===target.dataset.id);if(obj)obj[target.dataset.key]=target.value;save();return;}
 if(target.dataset.bind){setPath(project(),target.dataset.bind,target.value);continuityResults=null;save();if(target.dataset.bind==='plot.status')render();}
 });
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
render();
})();
