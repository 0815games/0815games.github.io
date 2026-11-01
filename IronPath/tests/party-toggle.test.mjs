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
requestsListener({});assert.equal(toggle.textContent,'CO-OP');panel.collapse();assert.equal(root.hidden,true);assert.equal(toggle.attrs['aria-expanded'],'false');
await panel.reset();assert.equal(leaves,1);
const disabled=createFourDigitPanel({document,createLobby:()=>base,createApproval:()=>approval,getProfile:()=>null,onLeaveMatch:()=>{},enabled:false});assert.equal(toggle.hidden,true);toggle.onclick();assert.equal(root.hidden,true);await disabled.reset();
console.log('Co-op panel toggle preserves party state and signals requests.');
