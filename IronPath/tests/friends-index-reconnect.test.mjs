import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {setupFriends} from '../ui/friends-ui.mjs';

// The search listing is a background sync: it publishes the player under their
// name so friends can find them. When it fails, the friends dialog retries
// quietly (30s, 60s, 120s) and only then shows a notice - and that notice lives
// INSIDE the dialog, so a player who never opens it never learns that they are
// not findable. This suite covers the gap that leaves: a device that was
// offline when the sync ran stayed broken until the player did something.
//
// Emulator and synthetic SDK only. A real reconnect on a real network, with
// real latency and a real offline queue, is not covered here.
function fixture(){
 const nodes=new Map(),listeners=new Map();
 function el(id){
  if(!nodes.has(id))nodes.set(id,{id,hidden:true,open:false,textContent:'',value:'',children:[],classes:new Set(),
   classList:{toggle(){},add(){},remove(){}},setAttribute(){},removeAttribute(){},addEventListener(name,cb){this['on'+name]=cb;},
   showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},replaceChildren(){this.children=[];},
   append(...items){this.children.push(...items);}});
  return nodes.get(id);
 }
 const document={documentElement:{lang:'en'},getElementById:el,createElement:()=>({children:[],append(...items){this.children.push(...items);}}),
  querySelector:()=>el('friendsDialog'),querySelectorAll:()=>[el('friendsDialog')],addEventListener(type,fn){this['on'+type]=fn;}};
 // `failing` stands in for an offline or refused queue: the listing write
 // simply does not land.
 let failing=false,writes=[],removeCalls=[];
 const sdk={
  ref:(_db,path)=>path,
  onValue(path,cb,onError){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);return()=>{listeners.get(path)?.delete(cb);};},
  get:async()=>({val:()=>null}),
  set:async(path,value)=>{if(failing)throw Error('offline');writes.push([path,value]);},
  remove:async path=>{removeCalls.push(path);},
  serverTimestamp:()=>Date.now(),
 };
 const emit=(path,value)=>{for(const fn of [...(listeners.get(path)||[])])fn({val:()=>value});};
 const listenerCount=path=>(listeners.get(path)||new Set()).size;
 return {document,el,sdk,emit,listenerCount,set failing(v){failing=v;},writes,removeCalls,reset(){writes.length=0;removeCalls.length=0;}};
}
const flush=()=>new Promise(done=>setImmediate(done));
const listingAttempts=f=>f.writes.filter(([path])=>path.startsWith('friendNames/')).length;

// Cleanup is registered before the first assertion: a presence heartbeat keeps
// the process alive, so a test that fails before its own signOut() would hang
// the whole run instead of reporting the failure.
test('a listing that failed is retried when the connection comes back',async t=>{
 const f=fixture(),ui=setupFriends({document:f.document,db:{},auth:{currentUser:{uid:'alice'}},sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(1);}}});
 t.after(()=>ui.signOut());
 f.failing=true;ui.start();
 await flush();await flush();await flush();
 assert.equal(listingAttempts(f),0,'nothing was written while the queue refused');
 assert.equal(f.el('friendIndexError').hidden,true,'still quiet: the retries are not exhausted');

 // Back online. No timer would fire for another 30 seconds, and the player has
 // not opened the friends dialog - so without this the listing stayed broken.
 f.failing=false;f.emit('.info/connected',true);
 await flush();await flush();await flush();
 assert.equal(listingAttempts(f),1,'the reconnect earns one more attempt');
 assert.equal(f.el('friendIndexError').hidden,true,'and nothing is shown when it works');
});

test('a reconnect is not a write storm, and a healthy listing is left alone',async t=>{
 const f=fixture(),ui=setupFriends({document:f.document,db:{},auth:{currentUser:{uid:'alice'}},sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(2);}}});
 t.after(()=>ui.signOut());
 f.failing=true;ui.start();
 await flush();await flush();await flush();
 f.failing=false;
 // Two tabs and a flapping connection all see `connected` at once.
 f.emit('.info/connected',true);f.emit('.info/connected',true);f.emit('.info/connected',true);
 await flush();await flush();await flush();
 assert.equal(listingAttempts(f),1,'exactly one attempt per reconnect, not one per event');
 // Healthy again: further reconnects must not touch the database at all.
 f.reset();f.emit('.info/connected',true);f.emit('.info/connected',true);
 await flush();await flush();
 assert.equal(f.writes.length,0,'a listing that is fine is not rewritten on every reconnect');
});

test('sign-out stops listening: a later reconnect writes nothing',async t=>{
 const f=fixture(),ui=setupFriends({document:f.document,db:{},auth:{currentUser:{uid:'alice'}},sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(3);}}});
 t.after(()=>ui.signOut());
 f.failing=true;ui.start();
 await flush();await flush();await flush();
 await ui.signOut();
 f.reset();f.failing=false;f.emit('.info/connected',true);
 await flush();await flush();
 assert.equal(f.writes.length,0,'no background write after sign-out');
 // The listener itself is gone, not merely muted.
 assert.equal(f.listenerCount('.info/connected'),0);
});
