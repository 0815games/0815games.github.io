import {strict as assert} from 'node:assert';
import {createFourDigitPanel} from '../firebase-four-digit-panel.mjs';
const nodes=new Map();function node(){return {hidden:false,disabled:false,textContent:'',value:'',children:[],attrs:{},setAttribute(key,value){this.attrs[key]=value;},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;}};}
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node};
let requestsListener,closed=0,leaves=0;
const base={async publishProfile(){},watchHost(){return()=>{};},watchGuest(){return()=>{};}};
const approval={async create(){return {partyId:'x',hostId:'alice',inviteCode:'0123'};},watchRequests(_code,fn){requestsListener=fn;return()=>{};},async close(){closed++;}};
const panel=createFourDigitPanel({document,createLobby:()=>base,createApproval:()=>approval,getProfile:()=>({name:'Alice',gender:'female',level:1}),onJoinMatch:()=>true,onLeaveMatch:()=>{leaves++;},confirmMatch:()=>true,enabled:true});
const toggle=document.getElementById('partyToggle'),root=document.getElementById('firebaseParty');
assert.equal(root.hidden,true);assert.equal(toggle.hidden,false);assert.equal(toggle.attrs['aria-expanded'],'false');
toggle.onclick();assert.equal(root.hidden,false);assert.equal(toggle.attrs['aria-expanded'],'true');
await document.getElementById('partyCreate').onclick();assert.equal(document.getElementById('partyCodeDisplay').textContent,'0123');
toggle.onclick();assert.equal(root.hidden,true);assert.equal(closed,0);assert.equal(leaves,0,'collapsing must not leave the match');
requestsListener({bob:{name:'Bob'}});assert.match(toggle.textContent,/•/);assert.match(toggle.attrs['aria-label'],/request waiting/);
toggle.onclick();assert.equal(document.getElementById('partyCodeDisplay').textContent,'0123');assert.equal(root.hidden,false);
requestsListener({});assert.equal(toggle.textContent,'MULTIPLAYER');panel.collapse();assert.equal(root.hidden,true);assert.equal(toggle.attrs['aria-expanded'],'false');
await panel.reset();assert.equal(leaves,1);
const disabled=createFourDigitPanel({document,createLobby:()=>base,createApproval:()=>approval,getProfile:()=>null,onLeaveMatch:()=>{},enabled:false});assert.equal(toggle.hidden,true);toggle.onclick();assert.equal(root.hidden,true);await disabled.reset();
console.log('Co-op panel toggle preserves party state and signals requests.');
// A delayed in-game confirmation must not close a party after logout/reset.
let resolveClose;
const guarded=createFourDigitPanel({document,createLobby:()=>base,createApproval:()=>approval,getProfile:()=>({name:'Alice'}),onJoinMatch:()=>true,onLeaveMatch:()=>{leaves++;},confirmMatch:()=>true,confirmClose:()=>new Promise(resolve=>{resolveClose=resolve;}),enabled:true});
await document.getElementById('partyCreate').onclick();
const closing=document.getElementById('partyLeave').onclick();assert.equal(typeof resolveClose,'function');await guarded.reset();resolveClose(true);await closing;assert.equal(closed,0,'stale confirmation must not close a reset party');
// Successful start collapses the panel without closing the party or match.
let guestWatch,profileWatch,startedMode;
const startingBase={...base,watchGuest(_id,fn){guestWatch=fn;return()=>{};},watchProfile(_id,_uid,fn){profileWatch=fn;return()=>{};},async startMatch(){return {partyId:'x',hostId:'alice',guestId:'bob',profiles:[{},{}]};}};
const starting=createFourDigitPanel({document,createLobby:()=>startingBase,createApproval:()=>approval,getProfile:()=>({name:'Alice'}),onJoinMatch:info=>{startedMode=info.mode;return true;},onLeaveMatch:()=>{leaves++;},confirmMatch:()=>true,confirmClose:()=>true,enabled:true});
toggle.onclick();await document.getElementById('partyCreate').onclick();guestWatch('bob');profileWatch({name:'Bob'});assert.equal(document.getElementById('partyModeArea').hidden,false);document.getElementById('partyMode').value='versus';await document.getElementById('partyStart').onclick();assert.equal(startedMode,'versus');assert.equal(root.hidden,true);assert.equal(starting.isActive(),true);assert.equal(toggle.attrs['aria-expanded'],'false');await starting.reset();
// The joining player also collapses only after accepting and joining the match.
let approvalGuest,matchWatch,guestLeaves=0;
const joinBase={...base,watchGuest(_id,fn){approvalGuest=fn;return()=>{};},watchMatch(_id,fn){matchWatch=fn;return()=>{};},async leaveGuest(){guestLeaves++;}};
const joinApproval={async request(){return {partyId:'x',hostId:'alice',guestId:'bob'};},async readStarted(){return null;},watchOwnRequest(){return()=>{};}};
const joining=createFourDigitPanel({document,createLobby:()=>joinBase,createApproval:()=>joinApproval,getProfile:()=>({name:'Bob'}),onJoinMatch:()=>true,onLeaveMatch:()=>{leaves++;},confirmMatch:()=>true,enabled:true});
toggle.onclick();document.getElementById('partyCodeInput').value='0123';await document.getElementById('partyJoin').onclick();approvalGuest('bob');await new Promise(r=>setTimeout(r,0));matchWatch('bob');await new Promise(r=>setTimeout(r,0));assert.equal(root.hidden,true);assert.equal(joining.isActive(),true);assert.equal(await joining.leaveParty(),true);assert.equal(guestLeaves,1);assert.equal(joining.isActive(),false);
