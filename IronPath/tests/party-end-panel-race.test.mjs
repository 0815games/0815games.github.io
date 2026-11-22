import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createFourPlayerPanel} from '../net/firebase-four-panel.mjs';

async function setup(onLeaveMatch){
 const nodes=new Map(),el=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,textContent:'',value:'',className:'',src:'',alt:'',innerHTML:'',title:'',children:[],setAttribute(name,value){this[name]=value;},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;}});return nodes.get(id);};
 const watchers={};let closes=0,creates=0;
 const watch=(name,initial)=>(_id,cb)=>{watchers[name]=cb;if(initial!==undefined)cb(initial);return()=>{};};
 const manifest={hostId:'alice',playerIds:['alice','bob'],mode:'coop',teams:[0,0,1,1],profiles:[{name:'Alice'},{name:'Bob'}]};
 const lobby={create:async()=>({partyId:creates++?'new-p':'p',hostId:'alice',inviteCode:creates===1?'1234':'5678'}),start:async()=>manifest,configure:async()=>{},close:async()=>{closes++;watchers.host?.(null);},watchHost:watch('host','alice'),watchSlots:watch('slots',null),watchConfig:watch('config',{mode:'coop'}),watchStarted:watch('started',null),watchRequests:watch('requests',{}),watchProfile:(_p,id,cb)=>{cb({name:id});return()=>{};}};
 const panel=createFourPlayerPanel({document:{getElementById:el,createElement:()=>el(Symbol())},createLobby:()=>lobby,getProfile:()=>({name:'Alice'}),onMatch:async()=>true,confirmStart:async()=>true,onLeaveMatch,canCompleteEnd:()=>true});
 await el('fourPartyCreate').onclick();watchers.slots({one:'bob'});await el('fourPartyStart').onclick();
 assert.equal(panel.isActive(),true);return {panel,el,watchers,get closes(){return closes;}};
}

test('a confirmed remote delete remains complete if local teardown rejects',async()=>{
 const f=await setup(async()=>{throw Error('teardown failed');});
 assert.equal(await f.panel.completeParty('p',5),true);assert.equal(f.closes,1);assert.equal(f.panel.isActive(),false);
});

test('a stalled transport teardown does not strand the panel after the remote delete was acknowledged',async()=>{
 const f=await setup(()=>new Promise(()=>{}));
 const result=await Promise.race([f.panel.completeParty('p',5),new Promise(resolve=>setTimeout(()=>resolve('stalled'),50))]);
 assert.equal(result,true);assert.equal(f.closes,1);assert.equal(f.panel.isActive(),false);
});

test('a delayed old-party teardown and watcher cannot clear a newly created party',async()=>{
 let release;const teardown=new Promise(resolve=>{release=resolve;});const f=await setup(()=>teardown);
 const oldHostWatch=f.watchers.host;
 assert.equal(await f.panel.completeParty('p',5),true);assert.equal(f.panel.isActive(),false);
 await f.el('fourPartyCreate').onclick();assert.equal(f.panel.isActive(),true);assert.equal(f.el('fourPartyCodeDisplay').textContent,'5678');
 oldHostWatch(null);release();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(f.panel.isActive(),true,'the new party survives callbacks from the old generation');
 assert.equal(f.el('fourPartyCodeDisplay').textContent,'5678');
 assert.equal(await f.panel.completeParty('p',5),false,'old proof cannot close a replacement party');assert.equal(f.closes,1);
});
