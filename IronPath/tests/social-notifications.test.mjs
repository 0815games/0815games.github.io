import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createSocialNotifications} from '../social-notifications.mjs';
import {setupFriends} from '../friends-ui.mjs';
function fixture(){
 const nodes=new Map(),listeners=new Map(),dialogs=[];function el(id){if(!nodes.has(id)){const classes=new Set(),attrs={};nodes.set(id,{id,classes,attrs,classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)},setAttribute:(k,v)=>attrs[k]=v,removeAttribute:k=>delete attrs[k],hidden:true,open:false,textContent:'',value:'',children:[],contains(target){return target===this},addEventListener(name,cb){this['on'+name]=cb;},showModal(){this.open=true;},close(){this.open=false;this.onclose?.();},replaceChildren(){this.children=[];},append(...items){this.children.push(...items);}});}return nodes.get(id);}
 const friends=el('friendsDialog'),other=el('otherDialog');dialogs.push(friends,other);
 const document={documentElement:{lang:'en'},getElementById:el,createElement:()=>({children:[],append(...items){this.children.push(...items);}}),querySelector:()=>dialogs.find(d=>d.open)||null,querySelectorAll:()=>dialogs,addEventListener(type,fn){this['on'+type]=fn;}};
 const sdk={ref:(_db,p)=>p,onValue(path,cb){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);return()=>listeners.get(path).delete(cb);},get:async()=>({val:()=>null}),set:async()=>{},remove:async()=>{},serverTimestamp:()=>Date.now()};
 const emit=(path,value)=>{for(const fn of listeners.get(path)||[])fn({val:()=>value});};return {document,el,sdk,emit,friends,other};
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
