// One non-modal surface for independent multiplayer request producers. The
// source still owns the underlying request: hiding this card is never a vote.
// Identifiers must remain unique for a source until reset at the next session.
export function createMultiplayerPrompts({document,translate=(text)=>text,clock=Date.now,setTimer=setTimeout,clearTimer=clearTimeout}){
 const $=id=>document.getElementById(id),root=$('multiplayerPrompt'),title=$('multiplayerPromptTitle'),body=$('multiplayerPromptBody'),note=$('multiplayerPromptNote'),actions=$('multiplayerPromptActions');
 if(!root||!title||!body||!note||!actions)throw Error('Multiplayer prompt elements missing');
 const sources=new Map(),listeners=new Set();let queue=[],current=null,rendered=null,signature='',renderVersion=0,returnFocus=null,lastOutside=null,timer=null,timerAt=null,lastShown='',notificationPending=false;
 function notifyVisibility(){
  const shown=!root.hidden&&current?JSON.stringify([current.source,current.key]):'';
  if(shown===lastShown)return;lastShown=shown;
  if(notificationPending)return;notificationPending=true;queueMicrotask(()=>{notificationPending=false;for(const listener of listeners)try{listener();}catch{/* A broken subscriber must not prevent the others. */}});
 }
 const source=name=>{if(!sources.has(name))sources.set(name,{entries:new Map(),seen:new Set()});return sources.get(name);};
 const text=value=>String((typeof value==='function'?value():value)??'');
 const setText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
 function blocked(){
  if(document.querySelector?.('dialog[open]'))return true;
  // These existing non-modal field choices must not be covered. A parked
  // choice in a hidden workspace (or behind the lobby's CSS) is not visible
  // and must not suppress unrelated notices. The radial has a zero-sized
  // container with visible children, so its own hidden flag is authoritative.
  for(const id of ['radialMenu','runPerkPanel','sectorPanel','storyDecision']){
   const node=$(id);if(node&&!node.hidden&&!node.closest?.('[hidden], [inert]')&&(id==='radialMenu'||!node.getClientRects||node.getClientRects().length))return true;
  }
  const active=document.activeElement;
  return !!active&&!root.contains(active)&&!!active.matches?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]');
 }
 function valid(entry){
  if(!entry||source(entry.source).entries.get(entry.key)!==entry)return false;
  if(Number.isFinite(entry.data.expiresAt)&&clock()>=entry.data.expiresAt)return false;
  try{return typeof entry.data.valid!=='function'||entry.data.valid();}catch{return false;}
 }
 function restoreFocus(){
  const active=document.activeElement,target=returnFocus;returnFocus=null;
  if(!active||!root.contains(active)||!target||target.isConnected===false||target.disabled||document.querySelector?.('dialog[open]'))return;
  if(target.closest?.('[hidden], [inert], dialog:not([open])')||target.getClientRects&&target.getClientRects().length===0)return;
  try{target.focus?.({preventScroll:true});}catch{/* Focus is advisory, never a reason to act. */}
 }
 function release(){
  const hadCurrent=!!current;current=null;rendered=null;signature='';renderVersion++;
  // focus() can synchronously dispatch focusin and re-enter paint. Clear the
  // old entry first so that callback cannot consume and then lose the next one.
  if(hadCurrent)restoreFocus();
 }
 function scheduleExpiry(){
  let nearest=Infinity;
  for(const entry of [...queue,...(current?[current]:[])])if(Number.isFinite(entry.data.expiresAt))nearest=Math.min(nearest,entry.data.expiresAt);
  if(nearest===timerAt)return;
  if(timer!==null)clearTimer(timer);timer=null;timerAt=null;
  if(nearest!==Infinity){timerAt=nearest;timer=setTimer(()=>{timer=null;timerAt=null;paint();},Math.max(0,Math.min(2147483647,nearest-clock())));timer?.unref?.();}
 }
 function dismiss(entry,version){
  if(current!==entry||renderVersion!==version||root.hidden)return;
  release();paint();
 }
 async function activate(entry,version,id){
  if(current!==entry||renderVersion!==version||root.hidden||entry.busy||blocked()||!valid(entry)){paint();return;}
  const action=entry.data.actions?.find(item=>item.id===id);
  if(!action||typeof action.run!=='function'||action.disabled)return;
  entry.busy=true;paint();
  let result=false;try{result=await action.run();}catch{/* The producer supplies any specific error feedback. */}
  if(current!==entry||renderVersion!==version)return;
  entry.busy=false;
  if(result!==false)release();
  paint();
 }
 function renderActions(entry){
  const list=Array.isArray(entry.data.actions)?entry.data.actions:[],next=list.map(action=>action.id).join('\u0000');
  if(rendered!==entry||signature!==next){
   rendered=entry;signature=next;const version=++renderVersion;
   const buttons=list.map(action=>{const button=document.createElement('button');button.type='button';button.dataset.action=action.id;button.onclick=()=>activate(entry,version,action.id);return button;});
   const later=document.createElement('button');later.type='button';later.dataset.action='later';later.onclick=()=>dismiss(entry,version);actions.replaceChildren(...buttons,later);
  }
  const buttons=actions.children;
  list.forEach((action,index)=>{setText(buttons[index],text(action.label));buttons[index].disabled=entry.busy||!!action.disabled;});
  const later=buttons[list.length];setText(later,translate('LATER'));later.disabled=entry.busy;
 }
 function paint(){
  if(current&&!valid(current)){source(current.source).seen.add(current.key);release();}
  queue=queue.filter(entry=>{if(valid(entry))return true;source(entry.source).seen.add(entry.key);return false;});
  if(blocked()){const wasVisible=!root.hidden;root.hidden=true;if(wasVisible)restoreFocus();scheduleExpiry();notifyVisibility();return;}
  if(!current)current=queue.shift()||null;
  if(!current){root.hidden=true;scheduleExpiry();notifyVisibility();return;}
  if(root.hidden||rendered!==current){const active=document.activeElement;returnFocus=active&&!root.contains(active)?active:lastOutside;}
  source(current.source).seen.add(current.key);root.hidden=false;
  setText(title,text(current.data.title));setText(body,text(current.data.body));const hint=text(current.data.note);note.hidden=!hint;setText(note,hint);
  renderActions(current);scheduleExpiry();notifyVisibility();
 }
 function update(name,items,{suppressNew=false}={}){
  if(typeof name!=='string'||!name||!Array.isArray(items))throw Error('Invalid request source');
  const state=source(name),next=new Map();
  for(const data of items){
   if(!data||typeof data.key!=='string'||!data.key||next.has(data.key))throw Error('Invalid request key');
   let entry=state.entries.get(data.key);
   if(entry)entry.data=data;
   else{entry={source:name,key:data.key,data,busy:false};if(suppressNew)state.seen.add(data.key);else if(!state.seen.has(data.key))queue.push(entry);}
   next.set(data.key,entry);
  }
  state.entries=next;paint();
 }
 function reset(name){
  const state=source(name);state.entries=new Map();
  // Remove old-generation entries before release(), whose focus restoration
  // may synchronously re-enter paint(). Otherwise paint would mark those stale
  // keys seen again and hide matching requests from the next session.
  queue=queue.filter(entry=>entry.source!==name);
  if(current?.source===name)release();
  state.seen.clear();paint();
 }
 function dismissSource(name){if(current?.source===name){release();paint();}}
 root.hidden=true;
 document.addEventListener?.('focusin',event=>{if(event.target&&!root.contains(event.target))lastOutside=event.target;paint();},true);
 document.addEventListener?.('focusout',()=>queueMicrotask(paint),true);
 document.addEventListener?.('close',()=>queueMicrotask(paint),true);
 document.addEventListener?.('keydown',event=>{if(event.key==='Escape'&&!root.hidden&&root.contains(event.target)){event.preventDefault();event.stopPropagation();dismiss(current,renderVersion);}},true);
 // Dialogs and existing field choices can open or close without a focus event
 // or another network snapshot. Observe only their relevant attributes, not our
 // own `hidden` changes, to avoid a paint/observer loop.
 const Observer=document.defaultView?.MutationObserver||globalThis.MutationObserver;
 if(Observer&&document.documentElement){
  const observer=new Observer(paint);
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['open']});
  for(const [id,attributes] of [
   ['radialMenu',['hidden']],['runPerkPanel',['hidden']],['sectorPanel',['hidden']],['storyDecision',['hidden']],
   ['gameView',['hidden']],['gameWorkspace',['hidden','data-screen','data-online-ready']],['campaignPanel',['data-board-open']]
  ]){const node=$(id);if(node)observer.observe(node,{attributes:true,attributeFilter:attributes});}
 }
 return {update,reset,dismissSource,refresh:paint,isShowing:(name,key)=>!root.hidden&&current?.source===name&&current.key===key,onChange(listener){listeners.add(listener);return ()=>listeners.delete(listener);}};
}
