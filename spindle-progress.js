/* Story Spindle: browser-only goals, activity, writing timer and progress dashboard. */
(function progressFeatureModule() {
  'use strict';
  let ctx=null, lastAutoSave=0;
  const MILESTONES=[100,500,1000,2500,5000,10000,25000,50000,75000,100000,150000,200000];
  const PRESETS=[
    {id:'words250',title:'Write 250 words a day',kind:'words',target:250},
    {id:'words500',title:'Write 500 words a day',kind:'words',target:500},
    {id:'words1000',title:'Write 1,000 words a day',kind:'words',target:1000},
    {id:'minutes15',title:'Spend 15 minutes writing each day',kind:'minutes',target:15},
    {id:'minutes30',title:'Spend 30 minutes writing each day',kind:'minutes',target:30},
    {id:'minutes60',title:'Spend 60 minutes writing each day',kind:'minutes',target:60},
    {id:'scene',title:'Finish a particular scene',kind:'milestone'},
    {id:'dialogue',title:'Write or refine a dialogue exchange',kind:'milestone'},
    {id:'chapterplan',title:'Plan a chapter',kind:'milestone'},
    {id:'character',title:'Develop a character profile',kind:'milestone'},
    {id:'world',title:'Document a worldbuilding detail',kind:'milestone'},
    {id:'chapterdraft',title:'Finish a chapter draft',kind:'milestone'},
    {id:'revision',title:'Complete a revision pass',kind:'milestone'}
  ];
  const pad=n=>String(n).padStart(2,'0');
  function dayKey(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
  function ensureProject(p) {
    if(!Array.isArray(p.goals))p.goals=[];
    if(!p.writingActivity || typeof p.writingActivity!=='object' || Array.isArray(p.writingActivity))p.writingActivity={};
    if(!p.writingTimer || typeof p.writingTimer!=='object')p.writingTimer={running:false,lastTickAt:null};
    for(const goal of p.goals){
      if(!goal.id)goal.id=`goal-${Math.random().toString(36).slice(2)}`;
      if(!['words','minutes','milestone'].includes(goal.kind))goal.kind='milestone';
      goal.title=String(goal.title||'Untitled goal');
      if(goal.kind!=='milestone')goal.target=Math.max(1,Math.min(1000000,Math.trunc(Number(goal.target)||1)));
      if(goal.kind==='milestone')goal.completedAt=goal.completedAt||null;
    }
  }
  function dayRecord(p,key=dayKey()) {
    ensureProject(p);
    if(!p.writingActivity[key])p.writingActivity[key]={wordsAdded:0,writingMs:0,sessions:0};
    return p.writingActivity[key];
  }
  function getDay(p,key=dayKey()) {return p.writingActivity?.[key]||{wordsAdded:0,writingMs:0,sessions:0};}
  function logManuscriptEdit(p,oldText,newText) {
    ensureProject(p);
    const delta=ctx.countWords(newText)-ctx.countWords(oldText);
    if(delta) {
      const today=dayRecord(p);
      if(delta>0)today.wordsAdded+=delta;
      today.netWords=(Number(today.netWords)||0)+delta;
    }
  }
  function addElapsed(p,from,to) {
    let start=from;
    while(start<to){
      const d=new Date(start);
      const nextMidnight=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime();
      const end=Math.min(to,nextMidnight);
      dayRecord(p,dayKey(d)).writingMs+=Math.max(0,end-start);
      start=end;
    }
  }
  function refreshTimerText(p) {
    const day=getDay(p),mins=Math.floor((day.writingMs||0)/60000),secs=Math.floor(((day.writingMs||0)%60000)/1000);
    for(const el of document.querySelectorAll('[data-live-timer]'))el.textContent=`${mins}m ${pad(secs)}s today`;
    for(const el of document.querySelectorAll('[data-timer-state]'))el.textContent=p.writingTimer?.running?'Pause timer':'Start timer';
    for(const el of document.querySelectorAll('[data-timer-notice]'))el.textContent=p.writingTimer?.running?'Timer running while this tab is visible':'Timer paused';
    for(const el of document.querySelectorAll('[data-live-today-minutes]'))el.textContent=String(Math.floor((day.writingMs||0)/60000));
    for(const el of document.querySelectorAll('[data-live-goal-summary]'))el.textContent=goalSummary(p);
    for(const el of document.querySelectorAll('[data-goal-live]')) {
      const goal=p.goals.find(g=>g.id===el.dataset.goalLive);
      if(!goal)continue;
      const info=currentGoalProgress(p,goal);el.textContent=info.label;
      const card=el.closest('.item-card');
      const fill=card?.querySelector('.goal-progress-fill');if(fill)fill.style.width=`${Math.max(0,Math.min(100,100*info.value/Math.max(1,info.target)))}%`;
      const track=card?.querySelector('.goal-progress-track');if(track)track.setAttribute('aria-valuenow',String(Math.min(100,Math.round(100*info.value/Math.max(1,info.target)))));
      const status=card?.querySelector('.goal-status');if(status){status.textContent=info.done?'✓ Reached':goal.kind==='milestone'?'Milestone':'Daily goal';status.classList.toggle('goal-done',info.done);}
    }
  }
  function tick() {
    if(!ctx)return;
    const p=ctx.project();ensureProject(p);
    if(!p.writingTimer.running)return;
    if(document.hidden){pauseTimer(p,false);return;}
    const now=Date.now(),last=p.writingTimer.lastTickAt||now;
    // Background-throttled intervals do not silently count inactive writing time.
    const elapsed=Math.max(0,Math.min(3000,now-last));
    if(elapsed)addElapsed(p,now-elapsed,now);
    p.writingTimer.lastTickAt=now;
    refreshTimerText(p);
    if(now-lastAutoSave>=10000){ctx.save();lastAutoSave=now;}
  }
  function pauseTimer(p,rerender=true) {
    ensureProject(p);
    if(!p.writingTimer.running)return;
    tickOnce(p);
    p.writingTimer.running=false;
    p.writingTimer.lastTickAt=null;
    ctx.save();
    if(rerender)ctx.render();
    else refreshTimerText(p);
  }
  function tickOnce(p) {
    const now=Date.now(),last=p.writingTimer.lastTickAt||now;
    const elapsed=Math.max(0,Math.min(3000,now-last));
    if(elapsed && !document.hidden)addElapsed(p,now-elapsed,now);
    p.writingTimer.lastTickAt=now;
  }
  function toggleTimer(p) {
    ensureProject(p);
    if(p.writingTimer.running){pauseTimer(p);return;}
    p.writingTimer.running=true;
    p.writingTimer.lastTickAt=Date.now();
    dayRecord(p).sessions=(Number(dayRecord(p).sessions)||0)+1;
    ctx.save();ctx.render();
  }
  function configure(nextCtx) {
    ctx=nextCtx;
    let recovered=false;
    for(const p of ctx.projects()){
      ensureProject(p);
      // If a session ended unexpectedly, do not charge time after the last saved tick.
      if(p.writingTimer.running){p.writingTimer.running=false;p.writingTimer.lastTickAt=null;recovered=true;}
    }
    if(recovered)ctx.save();
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseTimer(ctx.project(),false);});
    window.addEventListener('pagehide',()=>pauseTimer(ctx.project(),false));
    setInterval(tick,1000);
  }
  function currentGoalProgress(p,goal) {
    const day=getDay(p);
    if(goal.kind==='milestone')return {value:goal.completedAt?1:0,target:1,done:!!goal.completedAt,label:goal.completedAt?'Complete':'Not completed'};
    const value=goal.kind==='words'?(day.wordsAdded||0):(day.writingMs||0)/60000;
    const target=Math.max(1,Number(goal.target)||1);
    return {value,target,done:value>=target,label:goal.kind==='words'?`${Math.floor(value).toLocaleString()} / ${target.toLocaleString()} words today`:`${Math.floor(value)} / ${target} minutes today`};
  }
  function progressHtml(value,target) {
    const percentage=Math.max(0,Math.min(100,Math.round(100*value/Math.max(target,1))));
    return `<div class="goal-progress-track" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="Goal progress"><div class="goal-progress-fill" style="width:${percentage}%"></div></div>`;
  }
  function streak(p) {
    const d=new Date();
    const activity=key=>{const x=getDay(p,key);return (x.wordsAdded||0)>0 || (x.writingMs||0)>0;};
    if(!activity(dayKey(d)))d.setDate(d.getDate()-1);
    let n=0;
    for(let i=0;i<365;i++){
      if(!activity(dayKey(d)))break;
      n++;d.setDate(d.getDate()-1);
    }
    return n;
  }
  function weekDays(p) {
    const result=[];
    for(let i=6;i>=0;i--){
      const d=new Date();
      d.setHours(12,0,0,0);
      d.setDate(d.getDate()-i);
      const stat=getDay(p,dayKey(d));
      result.push({day:new Intl.DateTimeFormat(undefined,{weekday:'short'}).format(d),date:dayKey(d),words:stat.wordsAdded||0,writingMs:stat.writingMs||0});
    }
    return result;
  }
  function milestoneData(total) {
    const passed=MILESTONES.filter(n=>n<=total);
    const last=passed[passed.length-1]||0;
    const next=MILESTONES.find(n=>n>total)||Math.ceil((total+1)/50000)*50000;
    return {last,next};
  }
  const goalSummary=p=>{
    const done=p.goals.filter(g=>currentGoalProgress(p,g).done).length;
    return `${done} of ${p.goals.length} goals reached`;
  };
  function timerControl(p) {
    const day=getDay(p),mins=Math.floor((day.writingMs||0)/60000),secs=Math.floor(((day.writingMs||0)%60000)/1000);
    return `<div class="timer-strip"><div><strong>Writing & planning timer</strong><div class="small muted" data-live-timer>${mins}m ${pad(secs)}s today</div><div class="small muted" data-timer-notice>${p.writingTimer.running?'Timer running while this tab is visible':'Timer paused'}</div></div>
    <button class="btn btn-secondary btn-small" data-action="progress-timer-toggle" data-timer-state>${p.writingTimer.running?'Pause timer':'Start timer'}</button></div>`;
  }
  function dashboardWidgets(p,h) {
    ensureProject(p);
    const {esc}=h;
    const today=getDay(p),week=weekDays(p);
    const weeklyWords=week.reduce((a,d)=>a+d.words,0);
    const weeklyDays=week.filter(d=>d.words>0||d.writingMs>0).length;
    const total=p.chapters.reduce((n,c)=>n+ctx.countWords(c.manuscript),0);
    const started=p.chapters.filter(c=>ctx.countWords(c.manuscript)>0).length;
    const milestone=milestoneData(total);
    const max=Math.max(1,...week.map(d=>d.words));
    return `<h2 class="section-title">Writing progress</h2>
      <div class="grid three">
        <div class="card metric"><span class="metric-icon">✦</span><span class="number">${(today.wordsAdded||0).toLocaleString()}</span><small>Words added today</small></div>
        <div class="card metric"><span class="metric-icon">◷</span><span class="number" data-live-today-minutes>${Math.floor((today.writingMs||0)/60000)}</span><small>Tracked minutes today</small></div>
        <div class="card metric"><span class="metric-icon">▤</span><span class="number">${started} / ${p.chapters.length}</span><small>Chapters with a draft started</small></div>
        <div class="card metric"><span class="metric-icon">✿</span><span class="number">${streak(p)}</span><small>Consecutive writing days</small></div>
        <div class="card metric"><span class="metric-icon">☼</span><span class="number">${weeklyDays} / 7</span><small>Days active in the last week</small></div>
        <div class="card metric"><span class="metric-icon">✧</span><span class="number">${weeklyWords.toLocaleString()}</span><small>Words added in the last 7 days</small></div>
      </div>
      <div class="grid progress-panels">
        <div class="card">
          <div class="card-top"><div><h3>Seven-day writing activity</h3><p>Words added to chapter drafts in this browser.</p></div></div>
          <div class="week-bars" role="img" aria-label="${esc(week.map(d=>`${d.day}: ${d.words} words`).join('; '))}">${week.map(d=>`<div class="week-bar-col"><span class="week-bar-value">${d.words.toLocaleString()}</span><div class="week-bar-area"><div class="week-bar" style="height:${Math.max(d.words?5:0,100*d.words/max)}%"></div></div><span class="small muted">${esc(d.day)}</span></div>`).join('')}</div>
        </div>
        <div class="card stack">
          <div><h3>Word milestone</h3><p>${milestone.last?`You've passed ${milestone.last.toLocaleString()} manuscript words!`:'Your first 100 words are waiting.'}</p></div>
          ${progressHtml(total-milestone.last,milestone.next-milestone.last)}
          <div class="small muted">${total.toLocaleString()} total · Next celebration at ${milestone.next.toLocaleString()} words</div>
          <div class="divider"></div>
          <h3>Goals</h3><p data-live-goal-summary>${esc(goalSummary(p))}</p>
          <div><button class="btn btn-secondary btn-small" data-action="nav" data-view="goals">${p.goals.length?'Review goals':'Set a writing goal'}</button></div>
        </div>
      </div>
      <div class="info" style="margin-top:16px">Daily word and time activity is recorded from this version onward, on this browser only. Deleted or rewritten words can make “words added” differ from net manuscript growth; previous writing sessions cannot be reconstructed.</div>`;
  }
  function goalCard(g,p,h) {
    const {esc}=h, info=currentGoalProgress(p,g);
    const daily=g.kind!=='milestone';
    return `<div class="item-card"><div class="item-head"><strong>${esc(g.title)}</strong>
      <div class="inline-actions"><span class="goal-status ${info.done?'goal-done':''}">${info.done?'✓ Reached':daily?'Daily goal':'Milestone'}</span>
      <button class="btn btn-danger btn-icon" data-action="progress-remove-goal" data-id="${esc(g.id)}" aria-label="Remove goal" title="Remove goal">×</button></div></div>
      <div class="small muted" data-goal-live="${esc(g.id)}">${esc(info.label)}</div>
      <div style="margin-top:10px">${progressHtml(info.value,info.target)}</div>
      ${!daily?`<button class="btn btn-secondary btn-small" style="margin-top:12px" data-action="progress-toggle-goal" data-id="${esc(g.id)}">${info.done?'Mark unfinished':'Mark complete'}</button>`:''}
    </div>`;
  }
  function goalsPage(p,h) {
    ensureProject(p);
    const {esc,heading,options,emptyState}=h;
    const day=getDay(p);
    return `<section class="page">${heading('A little progress every day','Writing goals','Choose a suggested goal or make your own. Word and time goals track automatically; creative milestones are yours to check off.')}
    <div class="card stack"><h3>Writing & planning time</h3>${timerControl(p)}
    <p class="muted small">Start or pause the timer deliberately. It counts time while this tab is visible, including planning, and pauses when the tab is hidden. It cannot verify active writing. Today: ${Math.floor((day.writingMs||0)/60000)} full minutes across ${day.sessions||0} timed sessions.</p>
    </div>
    <div class="grid" style="margin-top:16px">
      <div class="card stack"><h3>Choose a suggested goal</h3>
        <div class="field"><label for="goal-preset-select">Goal template</label><select id="goal-preset-select" class="control">${options(PRESETS.map(g=>[g.id,g.title]),PRESETS[0].id)}</select></div>
        <div><button class="btn" data-action="progress-add-preset">＋ Add selected goal</button></div>
      </div>
      <div class="card stack"><h3>Create your own goal</h3>
        <div class="field"><label for="goal-title-input">Name your goal</label><input class="control" id="goal-title-input" maxlength="160" placeholder="Finish the conversation in chapter four"></div>
        <div class="field"><label for="goal-type-select">How is this goal measured?</label><select class="control" id="goal-type-select">
          <option value="milestone">Mark a task complete</option><option value="words">Words added each day</option><option value="minutes">Minutes tracked each day</option></select></div>
        <div class="field" id="custom-goal-target-wrapper" hidden><label for="goal-target-input">Daily target</label><input class="control" type="number" id="goal-target-input" min="1" max="1000000" step="1" value="500"></div>
        <div><button class="btn btn-secondary" data-action="progress-add-custom">＋ Create custom goal</button></div>
      </div>
    </div>
    <h2 class="section-title">Your goals</h2>
    <div class="card"><div class="card-top"><div><h3>${esc(goalSummary(p))}</h3><p>Daily word and minute goals reset each local calendar day. Completed one-time milestones stay complete until you change them.</p></div></div>
      ${p.goals.length?p.goals.map(g=>goalCard(g,p,h)).join(''):emptyState('Your first goal starts here','Choose a suggestion above or create something specific to your story.')}
    </div></section>`;
  }
  function addGoal(p,g) {
    ensureProject(p);
    p.goals.push({id:ctx.makeId(),title:g.title,kind:g.kind,target:g.target||null,completedAt:null});
    ctx.save();ctx.render();ctx.toast('Goal added.');
  }
  function handleAction(action,element,p) {
    if(action==='progress-timer-toggle'){toggleTimer(p);return true;}
    if(action==='progress-add-preset'){
      const selected=document.getElementById('goal-preset-select')?.value;
      const g=PRESETS.find(x=>x.id===selected);
      if(g)addGoal(p,g);
      return true;
    }
    if(action==='progress-add-custom'){
      const title=document.getElementById('goal-title-input')?.value.trim();
      const kind=document.getElementById('goal-type-select')?.value;
      const target=Number(document.getElementById('goal-target-input')?.value);
      if(!title){ctx.toast('Give your goal a name.');return true;}
      if(!['milestone','words','minutes'].includes(kind)){ctx.toast('Choose a goal type.');return true;}
      if(kind!=='milestone'&&(!Number.isInteger(target)||target<1||target>1000000)){ctx.toast('Enter a positive whole-number daily target.');return true;}
      addGoal(p,{title,kind,target:kind==='milestone'?null:target});
      return true;
    }
    if(action==='progress-toggle-goal'){
      const g=p.goals.find(x=>x.id===element.dataset.id);
      if(g?.kind==='milestone'){g.completedAt=g.completedAt?null:new Date().toISOString();ctx.save();ctx.render();ctx.toast(g.completedAt?'Milestone celebrated!':'Milestone reopened.');}
      return true;
    }
    if(action==='progress-remove-goal'){
      const g=p.goals.find(x=>x.id===element.dataset.id);
      if(g && confirm(`Remove goal “${g.title}”?`)){p.goals=p.goals.filter(x=>x.id!==g.id);ctx.save();ctx.render();}
      return true;
    }
    return false;
  }
  function handleChange(target) {
    if(target.id==='goal-type-select') {
      const wrap=document.getElementById('custom-goal-target-wrapper');
      if(wrap)wrap.hidden=target.value==='milestone';
    }
  }
  return window.SpindleProgress={configure,ensureProject,logManuscriptEdit,goalsPage,dashboardWidgets,timerControl,handleAction,handleChange,currentGoalProgress,dayKey,streak,weekDays,milestoneData,pauseForProjectChange:p=>{if(p?.writingTimer?.running)pauseTimer(p,false);}};
})();
