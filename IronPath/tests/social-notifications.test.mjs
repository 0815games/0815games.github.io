import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createSocialNotifications} from '../social-notifications.mjs';
import {setupFriends} from '../ui/friends-ui.mjs';
function fixture(){
 const nodes=new Map(),listeners=new Map(),failures=new Map(),dialogs=[];function el(id){if(!nodes.has(id)){const classes=new Set(),attrs={};nodes.set(id,{id,classes,attrs,classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)},setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k],hidden:true,open:false,textContent:'',value:'',children:[],contains(target){return target===this},addEventListener(name,cb){this['on'+name]=cb;},showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);}});}return nodes.get(id);}
 const friends=el('friendsDialog'),other=el('otherDialog');dialogs.push(friends,other);
 const document={documentElement:{lang:'en'},getElementById:el,createElement:()=>({children:[],append(...items){this.children.push(...items);}}),querySelector:()=>dialogs.find(d=>d.open)||null,querySelectorAll:()=>dialogs,addEventListener(type,fn){this['on'+type]=fn;}};
 const sdk={ref:(_db,p)=>p,onValue(path,cb,onError){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);if(onError){if(!failures.has(path))failures.set(path,new Set());failures.get(path).add(onError);}return()=>{listeners.get(path).delete(cb);failures.get(path)?.delete(onError);};},get:async()=>({val:()=>null}),set:async()=>{},remove:async()=>{},serverTimestamp:()=>Date.now()};
 const emit=(path,value)=>{for(const fn of listeners.get(path)||[])fn({val:()=>value});};const fail=(path)=>{for(const fn of failures.get(path)||[])fn(Error('offline'));};return {document,el,sdk,emit,fail,friends,other};
}
test('alerts queue, deduplicate, disappear when removed and wait for modal dialogs',()=>{
 const f=fixture(),{el,document}=f;let opened=0;const n=createSocialNotifications({document,container:el('popup'),title:el('title'),body:el('body'),openButton:el('open'),dismissButton:el('dismiss'),onOpen:()=>opened++});
 f.other.showModal();n.update('requests',[{key:'bob',name:'Bob'}]);assert.equal(el('popup').hidden,true);f.other.close();assert.equal(el('popup').hidden,false);assert.match(el('body').textContent,/Bob/);
 n.update('requests',[{key:'bob',name:'Bob'}]);n.update('invites',[{key:'eve1',name:'Eve'}]);el('dismiss').onclick();assert.match(el('body').textContent,/Eve/);n.update('invites',[]);assert.equal(el('popup').hidden,true);
 n.update('requests',[{key:'bob',name:'Bob'}]);assert.equal(el('popup').hidden,true,'unchanged snapshots do not repeat dismissed alerts');n.update('requests',[]);n.update('requests',[{key:'bob',name:'Bob'}]);assert.equal(el('popup').hidden,false,'a later new request can alert again');el('open').onclick();assert.equal(opened,1);assert.equal(el('popup').hidden,true);n.reset();
});
test('Friends requests update badges without popup; valid invitations still alert',async()=>{
 const f=fixture(),auth={currentUser:{uid:'alice'}},ui=setupFriends({document:f.document,db:{},auth,sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(4);}}});ui.start();
 f.emit('friendships/alice',{bob:{status:'pending',senderName:'<Bob>'},eve:{status:'accepted',senderName:'Eve'}});assert.equal(f.el('socialPopup').hidden,true);assert.equal(f.el('menuFriendBadge').textContent,'1');assert.equal(f.el('lobbyFriendBadge').textContent,'1');assert.equal(f.el('menuFriends').classes.has('has-friend-requests'),true);
 f.emit('friendships/alice',{bob:{status:'pending',senderName:'<Bob>'}});assert.equal(f.el('socialPopup').hidden,true);
 const inv={name:'Eve',code:'0123',partyId:'a'.repeat(32),createdAt:Date.now()};f.emit('coopInvites/alice',{eve:inv});assert.equal(f.el('socialPopupTitle').textContent,'PARTY INVITATION');
 f.el('socialPopupOpen').onclick();assert.equal(f.friends.open,true);assert.equal(f.el('socialPopup').hidden,true);f.emit('friendships/alice',{bob:{status:'pending',senderName:'<Bob>'},cara:{status:'pending',senderName:'Cara'}});f.friends.close();assert.equal(f.el('menuFriendBadge').textContent,'2');assert.equal(f.el('socialPopup').hidden,true,'requests never produce alerts');
 f.emit('coopInvites/alice',{eve:{...inv,createdAt:Date.now()-1900000}});assert.equal(f.el('socialPopup').hidden,true,'expired invite is not announced');f.emit('coopInvites/alice',{eve:{...inv,partyId:'b'.repeat(32),createdAt:Date.now()}});assert.equal(f.el('socialPopup').hidden,false,'replacement invitation is new');ui.signOut();assert.equal(f.el('menuFriendBadge').hidden,true);assert.equal(f.el('lobbyFriendBadge').hidden,true);assert.equal(f.el('socialPopup').hidden,true);auth.currentUser=null;f.emit('coopInvites/alice',{eve:inv});assert.equal(f.el('socialPopup').hidden,true);
});

test('party invitations use the shared queue only to open the inbox, never to accept',async t=>{
 const f=fixture(),auth={currentUser:{uid:'alice'}},calls=[],updates=new Map();
 const center={update(source,items,options){updates.set(source,items);calls.push(['update',source,options]);},reset(source){updates.delete(source);calls.push(['reset',source]);},dismissSource(source){calls.push(['dismiss',source]);},refresh(){}};
 const ui=setupFriends({document:f.document,db:{},auth,sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(4);}},promptCenter:center});t.after(()=>ui.signOut());ui.start();
 const now=Date.now(),invite={name:'<Bob>',code:'0123',partyId:'a'.repeat(32),createdAt:now};f.emit('coopInvites/alice',{bob:invite});
 const card=updates.get('social:invites')[0];assert.equal(card.body(),'<Bob> invited you to a party.');assert.equal(card.expiresAt,now+1800000);assert.deepEqual(card.actions.map(action=>action.id),['view']);assert.equal(f.el('socialPopup').hidden,true,'the separate corner popup is disabled');
 f.emit('coopInvites/alice',{bob:{...invite}});assert.equal(updates.get('social:invites')[0].key,card.key,'an unchanged invitation is not re-announced');
 f.emit('coopInvites/alice',{bob:{...invite,code:'9876'}});assert.notEqual(updates.get('social:invites')[0].key,card.key,'different code is a distinct observed invitation even at the same millisecond');
 f.emit('coopInvites/alice',{bob:{...invite,name:'Robert'}});assert.notEqual(updates.get('social:invites')[0].key,card.key,'different sender name is also a distinct observed invitation');
 f.emit('coopInvites/alice',{bob:invite});assert.equal(card.actions[0].run(),true);assert.equal(f.friends.open,true);assert.ok(calls.some(call=>call[0]==='dismiss'&&call[1]==='social:invites'));
 f.friends.close();await ui.signOut();assert.equal(updates.has('social:invites'),false);
});

test('a delayed join cleanup and a stale decline preserve a newer invitation',async()=>{
 const f=fixture(),auth={currentUser:{uid:'alice'}},original={name:'Bob',code:'0123',partyId:'a'.repeat(32),createdAt:1000},replacement={...original,code:'4567',partyId:'b'.repeat(32),createdAt:2000};
 let server=original,finishJoin,removes=0;const onValue=f.sdk.onValue;
 f.sdk.onValue=(path,callback,onError)=>path==='coopInvites/alice/bob'?(queueMicrotask(()=>callback({val:()=>server})),()=>{}):onValue(path,callback,onError);
 f.sdk.remove=async()=>{removes++;server=null;};f.sdk.runTransaction=async(_path,change)=>{const next=change(server);if(next===undefined)return {committed:false};server=next;return {committed:true};};
 const ui=setupFriends({document:f.document,db:{},auth,sdk:f.sdk,getProfile:()=>({name:'Alice'}),joinInvite:()=>new Promise(resolve=>{finishJoin=resolve;}),crypto:{getRandomValues(bytes){bytes.fill(9);}}});ui.start();
 f.emit('coopInvites/alice',{bob:original});const oldRow=f.el('coopInviteList').children[0],join=oldRow.children[1],decline=oldRow.children[2];
 const pending=join.onclick();server=replacement;finishJoin(true);await pending;assert.deepEqual(server,replacement,'successful join cleanup must not remove a newer invitation');
 await decline.onclick();assert.deepEqual(server,replacement);assert.match(f.el('friendStatus').textContent,/changed or is no longer available/);assert.equal(removes,0);
 await ui.signOut();
});

test('failed character deletion can restart social listeners without resetting the same account notices',async()=>{
 const f=fixture(),auth={currentUser:{uid:'alice'}},resets=[],updates=new Map();
 const center={update(source,items){updates.set(source,items);},reset(source){resets.push(source);updates.delete(source);},dismissSource(){},refresh(){}};
 const ui=setupFriends({document:f.document,db:{},auth,sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(6);}},promptCenter:center});
 ui.start();const initialResets=resets.length;
 const invite={name:'Bob',code:'0123',partyId:'a'.repeat(32),createdAt:Date.now()};f.emit('coopInvites/alice',{bob:invite});assert.equal(updates.get('social:invites').length,1);
 await ui.prepareForDeletion();assert.equal(resets.length,initialResets,'pausing listeners is not a new account session');assert.deepEqual(updates.get('social:invites'),[],'no stale prompt remains during deletion');
 ui.start();f.emit('coopInvites/alice',{bob:invite});assert.equal(resets.length,initialResets,'retrying the same profile preserves seen request ids');
 await ui.signOut();assert.ok(resets.length>initialResets,'a real sign-out forgets the previous account');
});

test('empty invitation and request sections are hidden without hiding loading errors',async()=>{
 const f=fixture(),auth={currentUser:{uid:'alice'}},ui=setupFriends({document:f.document,db:{},auth,sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(8);}}});
 ui.start();f.emit('coopInvites/alice',{});ui.open();f.emit('friendships/alice',{});f.emit('friendOutgoing/alice',{});
 for(const id of ['friendInvitesSection','friendRequestsSection','friendSentSection'])assert.equal(f.el(id).hidden,true,`${id} is empty`);
 assert.equal(f.el('friendListSection').hidden,false,'friends remain visible even when empty');
 f.emit('coopInvites/alice',{eve:{name:'Eve',code:'0123',partyId:'a'.repeat(32),createdAt:Date.now()}});
 f.emit('friendships/alice',{bob:{status:'pending',senderName:'Bob'}});f.emit('friendOutgoing/alice',{cara:{name:'Cara',code:'b'.repeat(32)}});
 for(const id of ['friendInvitesSection','friendRequestsSection','friendSentSection'])assert.equal(f.el(id).hidden,false,`${id} has an item`);
 f.emit('coopInvites/alice',{});f.emit('friendships/alice',{});f.emit('friendOutgoing/alice',{});
 for(const id of ['friendInvitesSection','friendRequestsSection','friendSentSection'])assert.equal(f.el(id).hidden,true,`${id} is empty again`);
 f.fail('coopInvites/alice');f.fail('friendOutgoing/alice');assert.equal(f.el('friendInvitesError').hidden,false);assert.equal(f.el('friendListError').hidden,false,'a separate friend listener error is not masked by the empty lists');
 f.emit('coopInvites/alice',{});assert.equal(f.el('friendInvitesError').hidden,true,'a successful invitation snapshot clears its error');
 await ui.signOut();
});

test('deletion pauses social listeners and waits for an already started index write',async()=>{
 const f=fixture(),auth={currentUser:{uid:'alice'}};let release,first=true;
 f.sdk.get=async()=>{if(first){first=false;await new Promise(resolve=>{release=resolve;});}return {val:()=>null};};
 const ui=setupFriends({document:f.document,db:{},auth,sdk:f.sdk,getProfile:()=>({name:'Alice'}),crypto:{getRandomValues(bytes){bytes.fill(7);}}});
 ui.start();await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof release,'function');
 let paused=false;const pending=ui.prepareForDeletion().then(()=>{paused=true;});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(paused,false);
 release();await pending;assert.equal(paused,true);
 f.emit('friendships/alice',{bob:{status:'pending',senderName:'Bob'}});assert.equal(f.el('menuFriendBadge').hidden,true);
});
