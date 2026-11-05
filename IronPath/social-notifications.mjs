import {translateText as tr,onLanguageChange} from './language.mjs?v=20261112-armory1';
// Non-modal, in-page alerts. The inbox remains the source of truth; dismissing
// an alert never accepts, declines or deletes a request or invitation.
export function createSocialNotifications({document,container,title,body,openButton,dismissButton,onOpen}){
  let known={requests:new Map(),invites:new Map()},queue=[],current=null;
  const isBlocked=()=>!!document.querySelector('dialog[open]');
  function paint(){
    if(current&&!current.valid)current=null;
    if(isBlocked()){container.hidden=true;return;}
    if(!current)current=queue.shift()||null;
    container.hidden=!current;
    if(current){title.textContent=tr(current.kind==='requests'?'FRIEND REQUEST':'PARTY INVITATION');body.textContent=tr(current.kind==='requests'?'{name} wants to connect.':'{name} invited you to a party.',{name:current.name});}
  }
  onLanguageChange(paint);
  function update(kind,items,{suppress=false}={}){
    if(!Object.hasOwn(known,kind))throw Error('Unknown notification type');
    const next=new Map(items.map(item=>[item.key,item]));
    if(current?.kind===kind&&!next.has(current.key)){current.valid=false;current=null;}
    queue=queue.filter(item=>item.kind!==kind||next.has(item.key));
    if(!suppress)for(const [key,item] of next)if(!known[kind].has(key))queue.push({...item,kind,valid:true});
    known[kind]=next;paint();
  }
  function clear(){queue=[];current=null;container.hidden=true;}
  function reset(){clear();known={requests:new Map(),invites:new Map()};}
  dismissButton.onclick=()=>{current=null;paint();};
  document.addEventListener('click',event=>{if(!container.hidden&&!container.contains(event.target))clear();},true);
  openButton.onclick=()=>{clear();onOpen();};
  for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',paint);
  return {update,clear,reset};
}
