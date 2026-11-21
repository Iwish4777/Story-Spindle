/* Story Spindle additional AI-free creative tools: word parking lot and Strings. */
(function spindleExtras() {
  'use strict';
  const STOP = new Set(('about above after again against almost along already also although among another around because before being below between beyond chapter could every first from have into itself little might more most much must never other over same should since some something still story such than that their them there these they this those through under until very what when where which while with without would your').split(' '));
  let pairingOffset = 0;
  const tokens = str => (String(str || '').toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []);
  const keywords = str => new Set(tokens(str).filter(w => w.length > 3 && !STOP.has(w)));
  const tags = str => new Set(String(str || '').split(/[,;\n]+/).map(s => s.trim().toLocaleLowerCase()).filter(Boolean));
  const countWords = str => tokens(str).length;
  function ensureProject(p) {
    for (const key of ['wordBank','strings','stringLinks']) if (!Array.isArray(p[key])) p[key] = [];
    for (const entry of p.wordBank) {
      if (!entry.id) entry.id = `word-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      entry.word = String(entry.word || '');
      entry.meaning = String(entry.meaning || '');
      entry.usage = String(entry.usage || '');
    }
    for (const entry of p.strings) {
      if (!entry.id) entry.id = `string-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      entry.text = String(entry.text || '');
      entry.tags = String(entry.tags || '');
      entry.notes = String(entry.notes || '');
    }
    const ids = new Set(p.strings.map(s => s.id));
    p.stringLinks = p.stringLinks.filter(link => link && ids.has(link.a) && ids.has(link.b) && link.a !== link.b);
  }
  function wordFrequency(p) {
    const freq = new Map();
    for (const chapter of p.chapters || []) for (const word of tokens(chapter.manuscript)) freq.set(word,(freq.get(word)||0)+1);
    return freq;
  }
  function wordBankPage(p, h) {
    ensureProject(p);
    const {esc, heading, itemField, itemHead, addButton, emptyState} = h;
    const frequencies = wordFrequency(p);
    return `<section class="page">${heading('A place for promising words','Word parking lot','Keep words you want to use someday, along with meanings and ideas for where they might fit.')}
      <div class="info"><strong>Your word collection stays separate from your manuscript.</strong> Usage counts look for exact words in chapter drafts, ignoring capitalization. They are clues, not confirmation that a word was intentionally incorporated.</div>
      <div class="card" style="margin-top:17px">
        <div class="card-top"><div><h3>Saved words</h3><p>${p.wordBank.length} word${p.wordBank.length===1?'':'s'} parked for later.</p></div>${addButton('wordBank','Park a word')}</div>
        ${p.wordBank.length ? p.wordBank.map((entry,i) => {
          const word=entry.word.trim(); const used=word?frequencies.get(word.toLocaleLowerCase())||0:0;
          return `<div class="item-card">${itemHead(word || `Word ${i+1}`,'wordBank',entry.id,i+1)}
            <div class="stack"><div class="field-row">
              ${itemField('Word or short expression','wordBank',entry.id,'word',entry.word,'A word you would like to use')}
              ${itemField('Meaning / definition','wordBank',entry.id,'meaning',entry.meaning,'What does it mean?')}
            </div>${itemField('Possible uses / notes','wordBank',entry.id,'usage',entry.usage,'What made this word interesting? Where might it fit?','textarea')}
            <div class="small muted">${word ? `${used} exact ${used===1?'use':'uses'} found in drafted chapters` : 'Enter a word to check its use in your manuscript'}</div>
            </div></div>`;
        }).join('') : emptyState('Words worth keeping','Park an intriguing word so you can find it when your story needs it.')}
      </div></section>`;
  }
  const snippet = (value,length=125) => {
    const s=String(value||'').trim().replace(/\s+/g,' ');
    return s.length>length?s.slice(0,length-1)+'…':s||'Untitled string';
  };
  function pairData(p) {
    const entries=p.strings.filter(s => String(s.text||'').trim()).slice(0,200);
    const linked=new Set(p.stringLinks.map(l=>[l.a,l.b].sort().join('|')));
    const result=[];
    for(let i=0;i<entries.length;i++) for(let j=i+1;j<entries.length;j++) {
      const a=entries[i],b=entries[j];
      if(linked.has([a.id,b.id].sort().join('|')))continue;
      const commonTags=[...tags(a.tags)].filter(t=>tags(b.tags).has(t));
      const commonWords=[...keywords(a.text)].filter(w=>keywords(b.text).has(w)).slice(0,5);
      result.push({a,b,commonTags,commonWords,score:commonTags.length*4+commonWords.length});
    }
    result.sort((x,y)=>y.score-x.score||String(x.a.id).localeCompare(String(y.a.id))||String(x.b.id).localeCompare(String(y.b.id)));
    return result;
  }
  function pairCard(pair, h, label) {
    const {esc}=h;
    const reason=pair.commonTags.length ? `Shared tags: ${pair.commonTags.join(', ')}` : pair.commonWords.length ? `Shared words: ${pair.commonWords.join(', ')}` : 'No obvious word overlap — what might connect them?';
    return `<div class="string-pair"><div class="small muted">${esc(label)}</div>
      <div class="string-pair-snippets"><div>“${esc(snippet(pair.a.text))}”</div><div>“${esc(snippet(pair.b.text))}”</div></div>
      <div class="string-pair-bottom"><span class="small muted">${esc(reason)}</span>
      <button class="btn btn-secondary btn-small" data-action="prefill-string-link" data-a="${esc(pair.a.id)}" data-b="${esc(pair.b.id)}">Explore this connection</button></div></div>`;
  }
  function stringsPage(p,h) {
    ensureProject(p);
    const {esc,heading,itemField,itemHead,addButton,emptyState,options} = h;
    const pairs=pairData(p), matched=pairs.filter(pair=>pair.score>0).slice(0,3), surprises=pairs.filter(pair=>pair.score===0);
    const surprise=surprises.length?surprises[pairingOffset%surprises.length]:null;
    const find=id=>p.strings.find(s=>s.id===id);
    return `<section class="page">${heading('Fragments worth keeping','Strings','Capture brief sparks of inspiration, then discover how separate fragments might relate.')}
      <div class="info"><strong>Creative connections, without AI.</strong> Suggested pairings only compare shared tags and words. Unexpected pairings deliberately place unrelated snippets together. You decide what, if anything, they mean.</div>
      <div class="card" style="margin-top:17px"><div class="card-top"><div><h3>Collected strings</h3><p>A phrase, an image, a question, a bit of dialogue, or any small idea.</p></div>${addButton('strings','Add string')}</div>
        ${p.strings.length?p.strings.map((s,i)=>`<div class="item-card">${itemHead(`String ${i+1}`,'strings',s.id,i+1)}
          <div class="stack">${itemField('Snippet / inspiration','strings',s.id,'text',s.text,'A line, an image, a question, or a moment…','textarea')}
          <div class="field-row">${itemField('Tags (comma-separated)','strings',s.id,'tags',s.tags,'e.g., grief, mountains, belonging')}
          ${itemField('Why it resonates / possible direction','strings',s.id,'notes',s.notes,'What does it make you think of?','textarea')}</div></div></div>`).join(''):emptyState('Catch your first spark','Add a string whenever a small idea arrives. It does not need to make sense yet.')}
      </div>
      <h2 class="section-title">Find connections</h2>
      <div class="card stack">
        ${p.strings.length<2?`<div class="muted small">Add at least two strings to begin connecting them.</div>`:
        `<div class="field-row"><div class="field"><label for="string-from">First string</label><select class="control" id="string-from">${options(p.strings.map((s,i)=>[s.id,`String ${i+1}: ${snippet(s.text,55)}`]),'')}</select></div>
        <div class="field"><label for="string-to">Second string</label><select class="control" id="string-to">${options([['','Choose a string'],...p.strings.map((s,i)=>[s.id,`String ${i+1}: ${snippet(s.text,55)}`])],'')}</select></div></div>
        <div class="field"><label for="string-connection-note">Your connection / question</label><textarea class="control textarea" id="string-connection-note" rows="3" placeholder="What might tie these ideas together?"></textarea></div>
        <div><button class="btn" data-action="connect-strings">Link these strings</button></div>`}
      </div>
      ${p.strings.length>=2?`<div class="card" style="margin-top:17px"><div class="card-top"><div><h3>Possible pairings</h3><p>Matching is based on literal tags and keywords, not interpretation.</p></div></div>
        ${matched.length?matched.map((pair,i)=>pairCard(pair,h,`Shared detail ${i+1}`)).join(''):`<p class="muted small">No unlinked snippets currently share tags or significant words. Add tags if you want to make more connections visible.</p>`}
        ${surprise?`<div class="divider"></div><div class="card-top"><h3>Unexpected pairing</h3><button class="btn btn-secondary btn-small" data-action="shuffle-string-pair">↻ Another pairing</button></div>${pairCard(surprise,h,'An invitation to free-associate')}`:''}
        </div>`:''}
      <h2 class="section-title">Connections you have made</h2>
      <div class="card"><div class="card-top"><div><h3>Linked strings</h3><p>Keep the links and your reasoning; revisit them as your story develops.</p></div><span class="small muted">${p.stringLinks.length} link${p.stringLinks.length===1?'':'s'}</span></div>
        ${p.stringLinks.length?p.stringLinks.map((l,i)=>`<div class="item-card">${itemHead(`Connection ${i+1}`,'stringLinks',l.id,i+1,false)}
          <div class="string-pair-snippets"><div>“${esc(snippet(find(l.a)?.text))}”</div><div>“${esc(snippet(find(l.b)?.text))}”</div></div>
          <div style="margin-top:13px">${itemField('Connection notes','stringLinks',l.id,'note',l.note||'','Why are these connected?','textarea')}</div></div>`).join(''):emptyState('No strings linked yet','Use the form above, or explore a suggested pairing, to make your first connection.')}
      </div></section>`;
  }
  function handleAction(a,element,p,ctx) {
    if(a==='shuffle-string-pair'){pairingOffset++;ctx.render();return true;}
    if(a==='prefill-string-link'){
      const first=document.getElementById('string-from'),second=document.getElementById('string-to'),note=document.getElementById('string-connection-note');
      if(first&&second){first.value=element.dataset.a;second.value=element.dataset.b;first.scrollIntoView({behavior:'smooth',block:'center'});note?.focus();}
      return true;
    }
    if(a==='connect-strings'){
      const first=document.getElementById('string-from')?.value,second=document.getElementById('string-to')?.value;
      if(!first || !second || first===second || !p.strings.some(s=>s.id===first) || !p.strings.some(s=>s.id===second)){ctx.toast('Select two different strings to connect.');return true;}
      if(p.stringLinks.some(l=>(l.a===first&&l.b===second)||(l.a===second&&l.b===first))){ctx.toast('These strings are already linked.');return true;}
      p.stringLinks.push({id:ctx.makeId(),a:first,b:second,note:document.getElementById('string-connection-note')?.value||''});
      ctx.save();ctx.render();ctx.toast('The strings are linked.');return true;
    }
    return false;
  }
  function updateWritingCount(p,chapterId,count) {
    const total=document.getElementById('manuscript-total-words');
    if(total)total.textContent=p.chapters.reduce((sum,c)=>sum+count(c.manuscript),0).toLocaleString();
    const line=[...document.querySelectorAll('[data-chapter-word-count]')].find(el=>el.dataset.chapterWordCount===chapterId);
    const chapter=p.chapters.find(c=>c.id===chapterId);
    if(line&&chapter)line.textContent=`${chapter.title||'Untitled chapter'} · ${count(chapter.manuscript)} words`;
  }
  window.SpindleFeatures={ensureProject,wordBankPage,stringsPage,handleAction,updateWritingCount,countWords};
})();
