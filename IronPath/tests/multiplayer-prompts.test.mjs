import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createMultiplayerPrompts} from '../core/multiplayer-prompts.mjs';

function fixture(){
 const nodes=new Map(),listeners=new Map();let modal=false,now=1000,timer=null;
 const document={activeElement:null,documentElement:{},querySelector:selector=>selector==='dialog[open]'&&modal?{}:null,
  getElementById(id){return nodes.get(id);},createElement:()=>node(),
  addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);}};
 function node(id){return {id,hidden:false,disabled:false,textContent:'',dataset:{},children:[],isConnected:true,
  append(...children){this.children.push(...children);for(const child of children)child.parent=this;},
  replaceChildren(...children){for(const child of this.children)child.parent=null;this.children=[];this.append(...children);},
  contains(target){for(let n=target;n;n=n.parent)if(n===this)return true;return false;},
  setAttribute(){},matches(){return false;},closest(){return null;},getClientRects(){return [1];},
  focus(){document.activeElement=this;}};}
 for(const id of ['multiplayerPrompt','multiplayerPromptTitle','multiplayerPromptBody','multiplayerPromptNote','multiplayerPromptActions'])nodes.set(id,node(id));
 const root=nodes.get('multiplayerPrompt');root.append(nodes.get('multiplayerPromptTitle'),nodes.get('multiplayerPromptBody'),nodes.get('multiplayerPromptNote'),nodes.get('multiplayerPromptActions'));
 const outside=node('outside');document.activeElement=outside;
 const center=createMultiplayerPrompts({document,translate:(text,values={})=>text.replace(/\{(\w+)\}/g,(_,key)=>values[key]??''),clock:()=>now,
  setTimer(fn,ms){timer={fn,at:now+ms};return timer;},clearTimer(id){if(timer===id)timer=null;}});
 const actions=()=>nodes.get('multiplayerPromptActions').children;
 const emit=(type,event={})=>{for(const fn of listeners.get(type)||[])fn(event);};
 return {document,root,nodes,center,actions,outside,emit,setModal(value){modal=value;},advance(ms){now+=ms;if(timer&&timer.at<=now){const next=timer;timer=null;next.fn();}}};
}
const item=(key,body,run=()=>true,extra={})=>({key,title:'REQUEST',body,actions:[{id:'accept',label:'APPROVE',run}],...extra});

test('one nonmodal queue orders sources, updates in place and never repeats a dismissed request',async()=>{
 const f=fixture();let first=0,second=0;
 f.center.update('battle',[item('wave-1','Bob asks for wave 1',()=>{first++;return true;})]);
 assert.equal(f.root.hidden,false);assert.equal(f.nodes.get('multiplayerPromptBody').textContent,'Bob asks for wave 1');
 const original=f.actions()[0];f.center.update('battle',[item('wave-1','Bob asks; one approval remains',()=>{first++;return true;})]);
 assert.equal(f.actions()[0],original,'a changing count must not replace focused buttons');
 f.center.update('invites',[item('invite-1','Cara invited you',()=>{second++;return true;})]);
 assert.equal(f.nodes.get('multiplayerPromptBody').textContent,'Bob asks; one approval remains');
 await f.actions().at(-1).onclick();assert.equal(first,0,'Later is not approval');
 assert.equal(f.nodes.get('multiplayerPromptBody').textContent,'Cara invited you');
 await f.actions()[0].onclick();assert.equal(second,1);assert.equal(f.root.hidden,true);
 f.center.update('battle',[item('wave-1','Bob asks again',()=>first++)]);assert.equal(f.root.hidden,true,'unchanged snapshots do not reopen a dismissed request');
 f.center.update('battle',[]);f.center.update('battle',[item('wave-1','stale old snapshot',()=>first++)]);assert.equal(f.root.hidden,true,'a temporarily absent old id must not reappear');
 f.center.update('battle',[item('wave-2','A new request',()=>first++)]);assert.equal(f.root.hidden,false);
});

test('removed, replaced, expired or externally invalidated buttons cannot perform an action',async()=>{
 const f=fixture();let calls=[];let valid=true;
 f.center.update('battle',[item('one','First',()=>{calls.push('first');}, {valid:()=>valid})]);
 const old=f.actions()[0];f.center.update('battle',[item('two','Second',()=>{calls.push('second');})]);
 await old.onclick();assert.deepEqual(calls,[],'a detached button does not act on a later request');
 const removed=f.actions()[0];f.center.update('battle',[]);await removed.onclick();assert.deepEqual(calls,[]);
 f.center.update('battle',[item('three','Third',()=>{calls.push('third');},{valid:()=>valid})]);const invalid=f.actions()[0];valid=false;await invalid.onclick();assert.deepEqual(calls,[]);assert.equal(f.root.hidden,true);
 f.center.update('invites',[item('expiring','Invitation',()=>{calls.push('invite');},{expiresAt:1100})]);const expired=f.actions()[0];f.advance(101);assert.equal(f.root.hidden,true);await expired.onclick();assert.deepEqual(calls,[]);
});

test('a modal dialog or focused text field defers display without closing or stealing focus',async()=>{
 const f=fixture();let calls=0;f.setModal(true);f.center.update('battle',[item('one','Waiting',()=>calls++)]);assert.equal(f.root.hidden,true);
 f.setModal(false);f.center.refresh();assert.equal(f.root.hidden,false);assert.equal(f.document.activeElement,f.outside,'display does not move focus');
 const editable={matches:selector=>selector.includes('input'),closest:()=>null,focus(){f.document.activeElement=this;}};editable.focus();f.emit('focusin',{target:editable});assert.equal(f.root.hidden,true);assert.equal(f.document.activeElement,editable);
 f.document.activeElement=f.outside;f.emit('focusin',{target:f.outside});assert.equal(f.root.hidden,false);assert.equal(calls,0);
 f.actions()[0].focus();f.emit('keydown',{key:'Escape',target:f.actions()[0],preventDefault(){this.prevented=true;},stopPropagation(){}});assert.equal(calls,0);assert.equal(f.root.hidden,true);assert.equal(f.document.activeElement,f.outside,'focus returns only when it was in the prompt');
});

test('focus restoration cannot drop the next request when a focused card becomes stale',()=>{
 const f=fixture();f.outside.focus=()=>{f.document.activeElement=f.outside;f.emit('focusin',{target:f.outside});};
 f.center.update('battle',[item('one','First')]);f.center.update('invites',[item('two','Next')]);f.actions()[0].focus();
 f.center.update('battle',[]);assert.equal(f.document.activeElement,f.outside);assert.equal(f.root.hidden,false);assert.equal(f.nodes.get('multiplayerPromptBody').textContent,'Next');
});

test('pending actions cannot double send and a failed action stays available',async()=>{
 const f=fixture();let resolve,calls=0;
 f.center.update('battle',[item('wave','Wave',()=>{calls++;return new Promise(r=>{resolve=r;});})]);
 const button=f.actions()[0],pending=button.onclick();await button.onclick();assert.equal(calls,1);assert.equal(button.disabled,true);
 resolve(false);await pending;assert.equal(f.root.hidden,false);assert.equal(button.disabled,false);
 const retry=button.onclick();assert.equal(calls,2);resolve(true);await retry;assert.equal(f.root.hidden,true);
});

test('reset forgets visible and queued ids without losing other sources',async()=>{
 const f=fixture();
 f.center.update('battle',[item('wave:1','Old visible'),item('wave:2','Old waiting')]);
 f.center.update('invites',[item('invite:1','Other source')]);
 f.actions()[0].focus();f.outside.focus=()=>{f.document.activeElement=f.outside;f.emit('focusin',{target:f.outside});};
 f.center.reset('battle');assert.equal(f.nodes.get('multiplayerPromptBody').textContent,'Other source');
 f.center.update('battle',[item('wave:1','New visible id'),item('wave:2','New waiting id')]);
 await f.actions().at(-1).onclick();assert.equal(f.nodes.get('multiplayerPromptBody').textContent,'New visible id');
 await f.actions().at(-1).onclick();assert.equal(f.nodes.get('multiplayerPromptBody').textContent,'New waiting id');
});

test('reset permits a fresh session while suppressed inbox items stay quiet',()=>{
 const f=fixture();f.center.update('invites',[item('same','Inbox')],{suppressNew:true});assert.equal(f.root.hidden,true);
 f.center.update('invites',[item('same','Inbox')]);assert.equal(f.root.hidden,true);
 f.center.reset('invites');f.center.update('invites',[item('same','A new session')]);assert.equal(f.root.hidden,false);
});
