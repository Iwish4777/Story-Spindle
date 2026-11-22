/* Story Spindle — searchable in-app user guide. No external dependencies. */
(function spindleHelp(){
'use strict';
let ctx=null,opened=false,selected='getting-started',search='',returnFocus=null;
const chapters=[
 {group:"Getting started",id:"getting-started",title:"Start your first novel",subtitle:"You can begin anywhere. No setup or coding needed.",view:"dashboard",steps:[
  "Open Spindle. Use the project selector at the top to choose a novel, or tap + next to it to start a new one.",
  "Tap Overview at the bottom to see the banner, word counts, planned chapters, tracked characters and today's progress.",
  "Swipe sideways along the other bottom tabs to explore the planning and creative tools.",
  "Try adding one character, plot point or chapter. Your changes are saved automatically in this browser.",
  "Before you put lots of work into a novel, download a project backup using Back up at the top."
 ],tips:["There is no required order. You can explore the world first, outline chapters first, or begin writing.","Spindle is entirely AI-free. Prompts and continuity checks follow fixed questions and rules, not generated writing."]},
 {group:"Getting started",id:"navigation",title:"Find your way around",subtitle:"A small set of controls keeps your workspace uncluttered.",view:"dashboard",steps:[
  "Overview is pinned at the left of the bottom navigation bar.",
  "Swipe the other bottom tabs horizontally to reach Plot, Characters, Worldbuilding, Chapter outlines, Writing and more.",
  "Use the selector at the top to switch novels. The + button beside it makes another novel.",
  "Tap Back up at the top to download a copy of your current project.",
  "Tap the Help button at the top whenever you want instructions. Search for a tool or choose a topic in this guide."
 ],tips:["Each novel has its own chapters, notes, characters, boards, maps and goals.","The current tab is highlighted in the bottom bar."]},
 {group:"Story planning",id:"plot",title:"Plot, ending & themes",subtitle:"Give your story shape without locking yourself into an outline.",view:"plot",steps:[
  "Open Plot. Write as little or as much as you want in the story summary.",
  "Tap Add plot point for turning points, decisions, discoveries or setbacks.",
  "Move events with their arrow controls and optionally connect an event to a chapter.",
  "Open Ending to collect your intended outcome and open threads.",
  "Open Themes to collect recurring ideas or questions that give your novel meaning."
 ],tips:["You can change your plot and ending as the book develops.","The Guided exercises button opens optional questions; Spindle does not write answers for you."]},
 {group:"Story planning",id:"characters",title:"Build your characters",subtitle:"Profiles for protagonists, allies, rivals and everyone in between.",view:"main",steps:[
  "Open Main characters or Other characters.",
  "Tap Add character and give the person a name. Fill in only the details you know.",
  "Record personality, appearance, motivations, relationships and other reference facts.",
  "When planning a chapter, mark which characters appear in it.",
  "In Story Trees, explore how characters connect to chapters and one another."
 ],tips:["A supporting character can have as much detail as a protagonist.","Recording an introduction chapter helps continuity checks spot possible early appearances."]},
 {group:"Story planning",id:"world",title:"Build a world encyclopedia",subtitle:"Make a home for places, history, magic, biology and cultures.",view:"world",steps:[
  "Open Worldbuilding and tap Add entry.",
  "Name the entry and choose a category such as Geography & lands, Culture, Science, Magic or Ecology.",
  "Describe its environment, inhabitants, rules and points of conflict.",
  "Use those entries while planning scenes and making illustrated maps.",
  "Keep established facts in the reference fields so you can consult them later."
 ],tips:["A worldbuilding entry is a reference note, not automatically a fact checked in every chapter.","Map Studio can illustrate an area, but maps and encyclopedia entries are saved as separate tools."]},
 {group:"Story planning",id:"chapters",title:"Plan chapters and scenes",subtitle:"Link your outlines to characters and the manuscript.",view:"chapters",steps:[
  "Open Chapter outlines and tap Add chapter.",
  "Add an optional title, major event, setting, purpose and outcome.",
  "Choose which characters are present and which tracked facts are used in that chapter.",
  "Use the chapter arrows to change the order. Its manuscript draft moves with it.",
  "Choose Write chapter to begin the draft in the Writing tab."
 ],tips:["If your story has flashbacks, use the flashback checkbox so chronology checks understand that the jump may be intentional.","Chapter titles and outline notes are not included in manuscript word counts."]},
 {group:"Story planning",id:"writing",title:"Write your manuscript",subtitle:"A chapter-by-chapter editor with live word counts.",view:"writing",steps:[
  "Open Writing. If you haven't planned a chapter yet, use Create first chapter.",
  "Choose a chapter from the chapter list and start typing in its editor.",
  "Watch the live chapter and manuscript totals. Titles and outline notes are excluded.",
  "Use the optional timer if you want to track a writing session.",
  "Open Project & backup to export your whole manuscript as a plain-text file."
 ],tips:["Your writing autosaves to this browser, not GitHub or a cloud writing account.","Keep downloadable JSON backups too: the plain-text manuscript export does not preserve all the planning details."]},
 {group:"Story planning",id:"continuity",title:"Run continuity checks",subtitle:"Helpful signals, not creative verdicts.",view:"continuity",steps:[
  "Open Continuity checks.",
  "Record important facts or revelations and when characters learn them.",
  "Add any words or phrases you want the scanner to flag, such as an outdated place name.",
  "Tap Scan manuscript to inspect saved chapters.",
  "Review possible timeline conflicts, premature knowledge, or description mismatches and decide what matters."
 ],tips:["Checks use structured fields and deterministic text rules. They cannot understand a scene's full meaning.","A warning is only a suggestion to investigate; flashbacks and deliberate exceptions may be perfectly fine."]},
 {group:"Creative tools",id:"wordbank",title:"Use the Word parking lot",subtitle:"Keep intriguing words ready for a future scene.",view:"wordbank",steps:[
  "Open Word parking lot.",
  "Add a word or phrase you might want to use.",
  "Save a meaning, note or context so you remember why you liked it.",
  "Return later to see whether the expression appears in chapter drafts."
 ],tips:["Matching is based on the text, not interpretation. A match does not imply the word was used intentionally."]},
 {group:"Creative tools",id:"strings",title:"Collect Strings of inspiration",subtitle:"Build a notebook of fragments and unexpected associations.",view:"strings",steps:[
  "Open Strings and save short snippets: a line of dialogue, image, sound, question or scene idea.",
  "Add tags and notes if they help you organize the idea.",
  "Review Possible pairings, which highlights matching tags and significant words.",
  "Try Unexpected pairing to compare unlinked fragments.",
  "Link any pair that feels meaningful and add your explanation."
 ],tips:["Suggested connections come from text matching and simple pairing rules, not AI.","You can keep unrelated scraps indefinitely; they don't need to become part of the story."]},
 {group:"Creative tools",id:"trees",title:"Explore Story Trees",subtitle:"See characters, chapters and concepts as connected nodes.",view:"trees",steps:[
  "Open Story Trees to see an automatically assembled diagram of your saved story entries.",
  "Tap a node to focus on its immediate relationships.",
  "Filter the diagram by characters, chapters or other sections to make it easier to read.",
  "Use Add your own connections to connect two entries and give the relationship a name.",
  "Open a source section from a selected item when you want to edit it."
 ],tips:["Some links come from explicit chapter assignments; some come from literal name matches. A name match is a clue, not a confirmed relationship.","Freeform manuscript text is not analyzed for implied relationships."]},
 {group:"Creative tools",id:"mood",title:"Create Mood Boards",subtitle:"Build collages from words, photos and tactile color swatches.",view:"mood",steps:[
  "Open Mood Boards and create a board for the whole book, a character, chapter, scene or setting.",
  "Choose a gradient, a solid background color or an uploaded background image.",
  "Add Text, Fabric swatch or Upload photo. Drag items around the collage and use the corner handle to resize.",
  "Select an item to change fonts, shadows, outlines, colors, fabric textures, dimensions and rotation.",
  "Optionally search Openverse for openly licensed images. Review creator and license details before sharing.",
  "Export a PNG image, and download image credits if you used stock photos."
 ],tips:["Device uploads are compressed and stored with your novel. Large collages may run into browser storage limits.","Openverse search needs the internet. Some stock image hosts block PNG export; use a properly licensed local copy where needed."]},
 {group:"Creative tools",id:"maps",title:"Draw maps in Map Studio",subtitle:"Sketch landforms, terrain patterns, borders and routes.",view:"maps",steps:[
  "Open Map Studio and create a map on a parchment background.",
  "Insert a preset island, continent, ocean base, lake, canyon or archipelago; or choose Draw region / Polygon points.",
  "For a polygon, tap at least three points and then choose Finish polygon. For a freehand region, trace its outline in one continuous drag.",
  "Select a region and choose up to three terrain types; adjust their relative ratio sliders for mixed illustrations.",
  "Use Draw line for roads, trails, rivers, political borders or travel routes. Use Place label for names.",
  "Choose Select / move, then tap any region or line. Drag round vertices to reshape it and square corner handles to resize. You can resize map labels using their square handle.",
  "Open Details to add a vertex along an edge, select a vertex to edit X/Y coordinates, remove a selected point, or simplify crowded outlines.",
  "Use Smooth outline for curved coasts. The Continent preset starts with a smoother shoreline and adjustable points.",
  "Tap Full screen for a larger map. Tools and Details are hidden until opened as floating panels, and Finish region appears on the map while drawing polygons.",
  "Download your finished map as SVG or PNG."
 ],tips:["Auto-fill works on a closed region or a preset shape. Separate intersecting lines are not automatically converted into regions.","The maps are illustrated sketches, not geographic GIS maps."]},
 {group:"Progress",id:"overview",title:"Read your overview",subtitle:"Your writing's progress without a complicated report.",view:"dashboard",steps:[
  "Tap Overview in the pinned bottom tab.",
  "Under your story banner, scan manuscript word count, chapters, characters, words added today, world entries and saved boards/maps.",
  "Open More writing progress to see recent writing activity, milestones and goal information.",
  "Use the creative shortcuts lower down when you want to jump directly into another tool."
 ],tips:["Words added today are counted as edits happen in this browser; deleted and rewritten words can make that figure differ from net manuscript growth.","Older writing sessions from before tracking was enabled cannot be recreated."]},
 {group:"Progress",id:"goals",title:"Set goals and track writing time",subtitle:"Gentle, flexible ways to track momentum.",view:"goals",steps:[
  "Open Goals and choose a suggested daily word target, daily writing-time target or creative milestone.",
  "Or create a custom goal with your own label and target.",
  "Start and pause the writing timer when you want to track a session.",
  "Check off one-time creative milestones yourself.",
  "Return to the Goals tab or Overview to see current progress."
 ],tips:["The timer only tracks while the tab is visible; it does not verify that you're actively writing.","Daily goals reset with your device's local date."]},
 {group:"Your work & privacy",id:"backups",title:"Back up your novel",subtitle:"The most important habit in Spindle.",view:"settings",steps:[
  "Tap Back up near the top of Spindle to download a JSON backup of the current novel.",
  "Open Project & backup to choose Export this project or Back up all projects.",
  "Save the downloaded .json file somewhere separate from your browser, such as Files, iCloud Drive or another trusted folder.",
  "Use Export manuscript (.txt) if you also want a simple text copy of all drafted chapters.",
  "Make a fresh JSON backup after major writing or visual-editing sessions."
 ],tips:["JSON backups include the novel's story data, mood boards and maps; external stock photos may still depend on their original web host.","GitHub stores the app's code, not the text and files automatically saved inside your browser."]},
 {group:"Your work & privacy",id:"restore",title:"Restore or move a project",subtitle:"Switching phones or browsers takes a backup transfer.",view:"settings",steps:[
  "Make a current JSON backup of your project or all projects on the original device.",
  "Move the downloaded .json file to the new device using a method you trust.",
  "Open Spindle on the new device and go to Project & backup.",
  "Tap Import a project (.json), choose the downloaded file and verify the imported novel's chapters and boards.",
  "Keep the original backup until you confirm everything transferred."
 ],tips:["Spindle currently stores each project in that browser's local site storage. A different phone, browser or website address won't automatically show the same novels.","Before removing an iPhone home-screen web app, export your work. Removing it may remove its separate local storage."]},
 {group:"Your work & privacy",id:"privacy",title:"Understand privacy and image licenses",subtitle:"Know what stays on the device and what goes online.",view:"settings",steps:[
  "Your writing, characters, drafts, maps, and uploaded mood-board images are saved in the browser's local storage.",
  "Spindle has no accounts, AI writing tools, analytics or cloud synchronization.",
  "The optional Openverse search sends only your image search terms to that external image service.",
  "Images chosen from Openverse can load from external hosts and may require attribution or other license conditions.",
  "If you share a mood board publicly or commercially, check each image's original source and license."
 ],tips:["If the browser says storage is full, export your project immediately and reduce large uploaded images.","Openverse image search is optional; your writing is not sent there."]},
 {group:"Your work & privacy",id:"troubleshoot",title:"Quick fixes when something looks wrong",subtitle:"A few safe checks before changing anything.",view:null,steps:[
  "If a new feature isn't showing, reload the Spindle website to request the latest files.",
  "If you can't find a tab, swipe sideways along the bottom navigation.",
  "If your novel seems missing, check the selected project and whether you are using the same browser and website address.",
  "If the app isn't saving or reports storage is full, export your current data before removing any images or site data.",
  "If a home-screen icon is outdated, first back up your novels. iPhone may cache an existing shortcut's icon.",
  "If stock photos don't appear, verify internet access and try an uploaded photo instead."
 ],tips:["Never clear site data or uninstall the home-screen app as an early troubleshooting step if you haven't saved a separate backup.","If you need help with a specific tool, search for it in this guide."]}
];
const escape=s=>ctx?.esc?ctx.esc(String(s)):String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const groupOrder=[...new Set(chapters.map(t=>t.group))];
const viewTopic={dashboard:'getting-started',plot:'plot',main:'characters',other:'characters',world:'world',ending:'plot',themes:'plot',chapters:'chapters',writing:'writing',wordbank:'wordbank',strings:'strings',trees:'trees',mood:'mood',maps:'maps',goals:'goals',continuity:'continuity',settings:'backups'};
const findTopic=id=>chapters.find(t=>t.id===id)||chapters[0];
function markdown(){
 const out=['# Story Spindle — User Guide','','An AI-free writing and story-planning workspace. This guide explains the tools in plain language.','','**Quick reminder:** Projects autosave in your browser, not in GitHub or the cloud. Back up regularly.',''];
 for(const group of groupOrder){
   out.push(`## ${group}`,'');
   for(const t of chapters.filter(x=>x.group===group)){
     out.push(`### ${t.title}`,'',t.subtitle,'');
     for(const [i,step] of t.steps.entries())out.push(`${i+1}. ${step}`);
     out.push('');for(const tip of t.tips)out.push(`- **Good to know:** ${tip}`);
     out.push('');
   }
 }
 return out.join('\n');
}
function article(t){
 return `<div class="help-chapter-label">${escape(t.group)}</div><h3 id="help-article-title">${escape(t.title)}</h3><p class="help-subtitle">${escape(t.subtitle)}</p>
 <ol class="help-steps">${t.steps.map(step=>`<li>${escape(step)}</li>`).join('')}</ol>
 ${t.tips.length?`<div class="help-tips"><strong>Good to know</strong>${t.tips.map(tip=>`<p>${escape(tip)}</p>`).join('')}</div>`:''}
 ${t.view?`<button class="btn help-go-to" type="button" data-action="help-go-to" data-view="${escape(t.view)}">Open ${escape(t.view==='dashboard'?'Overview':t.view==='settings'?'Project & backup':t.title.includes('characters')?'Main characters':t.view==='writing'?'Writing':t.view==='mood'?'Mood Boards':t.view==='maps'?'Map Studio':t.title.includes('Story Trees')?'Story Trees':t.title.includes('Continuity')?'Continuity checks':t.view==='world'?'Worldbuilding':t.view==='wordbank'?'Word parking lot':t.view==='chapters'?'Chapter outlines':t.view==='goals'?'Goals':t.view==='strings'?'Strings':t.view==='plot'?'Plot':t.title)}</button>`:''}`;
}
function navItem(t){return `<button type="button" class="help-topic ${t.id===selected?'is-selected':''}" data-action="help-topic" data-topic="${escape(t.id)}" ${t.id===selected?'aria-current="true"':''}><span>${escape(t.title)}</span></button>`;}
function updateSidebar(){
 const list=document.getElementById('help-topic-list'),status=document.getElementById('help-result-status');if(!list)return;
 const q=search.toLocaleLowerCase().trim();
 if(q){
   const match=chapters.filter(t=>[t.title,t.group,t.subtitle,...t.steps,...t.tips].join(' ').toLocaleLowerCase().includes(q));
   status.textContent=`${match.length} ${match.length===1?'topic':'topics'} found`;
   list.innerHTML=match.length?match.map(navItem).join(''):'<p class="help-none">No matching topics. Try “writing”, “maps”, or “backup”.</p>';
 }else{
   status.textContent='Browse by topic';
   list.innerHTML=groupOrder.map(group=>`<div class="help-group"><div class="help-group-title">${escape(group)}</div>${chapters.filter(t=>t.group===group).map(navItem).join('')}</div>`).join('');
 }
}
function showTopic(id,focusHeading=false){
 const t=findTopic(id);selected=t.id;
 const target=document.getElementById('help-article');
 if(!target)return;
 target.innerHTML=article(t);target.scrollTop=0;updateSidebar();
 if(focusHeading){const el=target.querySelector('#help-article-title');if(el){el.tabIndex=-1;el.focus();}}
}
function open(topic){
 if(opened){showTopic(topic||selected);document.getElementById('help-search')?.focus();return;}
 const layer=document.getElementById('modal-layer');if(!layer)return;
 returnFocus=document.activeElement;selected=topic||viewTopic[ctx?.currentView?.()]||'getting-started';search='';opened=true;
 layer.innerHTML=`<div class="modal-layer help-layer" role="presentation">
 <div class="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
 <header class="help-header"><div><div class="eyebrow">STORY SPINDLE</div><h2 id="help-title">Help & User Guide</h2><p>Answers when you need them. Your writing stays in view when you're done.</p></div><button type="button" class="help-close" data-action="help-close" aria-label="Close user guide" title="Close user guide">×</button></header>
 <div class="help-search-row"><label for="help-search" class="visually-hidden">Search the user guide</label><span aria-hidden="true">⌕</span><input class="control" id="help-search" type="search" placeholder="Search features, backups, maps, writing…" autocomplete="off"><button type="button" class="btn btn-secondary btn-small" data-action="help-download" title="Download a text copy of the complete guide">↓ Guide</button></div>
 <div class="help-body"><aside class="help-topics" aria-label="Guide topics"><div class="help-list-head" id="help-result-status" role="status"></div><div id="help-topic-list" class="help-topic-list"></div></aside><article id="help-article" class="help-article" aria-labelledby="help-article-title"></article></div>
 <div class="help-footer"><span>Human creativity first · No AI</span><button class="btn btn-secondary btn-small" type="button" data-action="help-close">Back to Spindle</button></div>
 </div></div>`;
 showTopic(selected);
 document.getElementById('help-search')?.focus();
}
function close(){
 if(!opened)return false;
 opened=false;search='';document.getElementById('modal-layer').innerHTML='';
 if(returnFocus?.isConnected && returnFocus.focus)returnFocus.focus();returnFocus=null;
 return true;
}
function download(){
 const data=markdown(),blob=new Blob([data],{type:'text/markdown;charset=utf-8'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Story-Spindle-User-Guide.md';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function onAction(action,elem){
 if(!action.startsWith('help-'))return false;
 if(action==='help-open')open();
 else if(action==='help-close')close();
 else if(action==='help-topic')showTopic(elem.dataset.topic,true);
 else if(action==='help-go-to'){const v=elem.dataset.view;close();if(v)ctx.navigate(v);}
 else if(action==='help-download')download();
 return true;
}
function onInput(t){
 if(t.id!=='help-search'||!opened)return false;
 search=t.value;updateSidebar();return true;
}
function onKeydown(e){
 if(!opened)return false;
 if(e.key==='Escape'){e.preventDefault();close();return true;}
 if(e.key==='Tab'){
  const dialog=document.querySelector('.help-dialog');if(!dialog)return false;
  const controls=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')].filter(x=>x.getClientRects().length);
  if(!controls.length)return false;
  const first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();return true;}
  if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();return true;}
 }
 return false;
}
function configure(c){ctx=c;}
return window.SpindleHelp={configure,open,close,onAction,onInput,onKeydown,markdown,getTopics:()=>chapters.map(t=>({id:t.id,title:t.title,group:t.group,view:t.view}))};
})();
