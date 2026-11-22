import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {setupFriends} from '../ui/friends-ui.mjs';

// A2 asks for the account/character switch and signing in again to be
// INVESTIGATED, not assumed. The service level already refuses a write that
// outlives its account ('Account changed'), and a rejected request is already
// known not to be reported as a success. What was missing is the layer above
// it: does the dialog claim success anyway, does it stay busy, and can a
// straggler from the account that left paint over the one that arrived?
//
// Synthetic SDK and DOM only. A real second tab, a real sign-in on another
// device and a real interrupted network write are not covered here.
function fixture(){
 const nodes=new Map(),listeners=new Map();
 function el(id){
  if(!nodes.has(id))nodes.set(id,{id,hidden:true,open:false,textContent:'',value:'',children:[],classes:new Set(),
   classList:{add(k){nodes.get(id).classes.add(k);},remove(k){nodes.get(id).classes.delete(k);},contains(k){return nodes.get(id).classes.has(k);},toggle(){}},
   setAttribute(){},removeAttribute(){},addEventListener(name,cb){this['on'+name]=cb;},
   showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},
   replaceChildren(){this.children=[];},append(...items){this.children.push(...items);}});
  return nodes.get(id);
 }
 const document={documentElement:{lang:'en'},getElementById:el,createElement:()=>({children:[],append(...items){this.children.push(...items);}}),
  querySelector:()=>el('friendsDialog'),querySelectorAll:()=>[el('friendsDialog')],addEventListener(type,fn){this['on'+type]=fn;}};
 const store=new Map(),ops=[];let held=null;
 const sdk={
  ref:(_db,path)=>path,
  onValue(path,cb,onError){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);return()=>{listeners.get(path)?.delete(cb);};},
  get:async path=>({val:()=>store.get(path)??null}),
  set:async(path,value)=>{ops.push(['set',path]);if(held)await held;store.set(path,JSON.parse(JSON.stringify(value)));},
  remove:async path=>{ops.push(['remove',path]);store.delete(path);},
  serverTimestamp:()=>Date.now(),
 };
 const emit=(path,value)=>{if(value===undefined)store.delete(path);else store.set(path,value);for(const fn of [...(listeners.get(path)||[])])fn({val:()=>store.get(path)??null});};
 // Hold exactly one write on the wire, so an account switch can happen inside it.
 const hold=()=>{let release;held=new Promise(done=>{release=done;});return()=>{held=null;release();};};
 const callbacks=path=>[...(listeners.get(path)||[])];
 return {document,el,sdk,emit,store,ops,hold,callbacks,auth:{currentUser:{uid:'alice'}}};
}
const flush=()=>new Promise(done=>setTimeout(done,0));
const crypto={getRandomValues(bytes){bytes.fill(7);}};
// The badge shows nothing at all when there is nothing to count.
const badge=f=>f.el('menuFriendBadge').textContent||'0';

// A write already on the wire cannot be recalled. What has to hold instead:
// the dialog does not say "accepted", and it does not stay busy forever so the
// player can act again.
test('an account switch mid-action claims no success and does not wedge the dialog',async t=>{
 const f=fixture(),ui=setupFriends({document:f.document,db:{},auth:f.auth,sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto});
 t.after(()=>ui.signOut());
 ui.start();
 ui.open();
 // Emitted after opening: the dialog's own subscription renders on data, not
 // on a cached snapshot from before it was opened.
 f.emit('friendships/alice',{bob:{status:'pending',senderName:'Bob'}});
 assert.equal(f.el('friendRequests').children.length,1,'the pending request is rendered');
 const accept=f.el('friendRequests').children[0].children[1];
 assert.equal(accept.textContent,'ACCEPT');

 const release=f.hold();
 accept.onclick();
 await flush();
 assert.equal(ui.hasPending(),true,'the action is in flight');
 // The player signs into another account while the write is on the wire.
 f.auth.currentUser={uid:'carol'};
 release();
 await flush();await flush();

 assert.match(f.el('friendStatus').textContent,/account changed/i,'the refusal reaches the player');
 assert.doesNotMatch(f.el('friendStatus').textContent,/accepted/i,'and no success is claimed');
 assert.equal(ui.hasPending(),false,'the dialog is usable again');
});

// The old account's subscription is detached on sign-out, and a callback that
// somehow still fires must not paint its data over the account that arrived.
test('a listener for the account that left cannot paint over the one that arrived',async t=>{
 const f=fixture(),ui=setupFriends({document:f.document,db:{},auth:f.auth,sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto});
 t.after(()=>ui.signOut());
 ui.start();
 f.emit('friendships/alice',{bob:{status:'pending',senderName:'Bob'}});
 assert.equal(badge(f),'1');
 const straggler=f.callbacks('friendships/alice')[0];
 assert.ok(straggler,'the old subscription existed');

 await ui.signOut();
 f.auth.currentUser={uid:'carol'};
 ui.start();
 assert.equal(badge(f),'0','the new account starts clean');
 // A straggler that was never unsubscribed, and an emit on the old path.
 straggler({val:()=>({eve:{status:'pending',senderName:'Eve'}})});
 f.emit('friendships/alice',{eve:{status:'pending',senderName:'Eve'}});
 assert.equal(badge(f),'0','neither can raise the badge of another account');
 f.emit('friendships/carol',{bob:{status:'pending',senderName:'Bob'}});
 assert.equal(badge(f),'1','but the new account counts its own');
});
