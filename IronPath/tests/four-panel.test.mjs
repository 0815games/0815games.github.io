import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createFourPlayerPanel} from '../firebase-four-panel.mjs';
const profiles={alice:{name:'Alice',gender:'female',level:1},bob:{name:'Bob',gender:'male',level:1},cara:{name:'Cara',gender:'female',level:1},dan:{name:'Dan',gender:'male',level:1}};
const manifest={hostId:'alice',playerIds:['alice','bob','cara','dan'],mode:'two-vs-two',teams:[0,1,0,1]};
function fixture(role='host'){
  const nodes=new Map();const make=()=>({hidden:false,disabled:false,textContent:'',value:'',children:[],append(...els){this.children.push(...els);},replaceChildren(...els){this.children=[...els];}});const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,make());return nodes.get(id);},createElement:make};const $=id=>doc.getElementById(id);
  const w={},watchedProfiles={};let calls=[],joined=[],stopped=0;
  const watch=(key,initial)=>(_id,cb)=>{w[key]=cb;if(initial!==undefined)cb(initial);return()=>{if(w[key]===cb)delete w[key];};};
  const lobby={async create(){return {hostId:'alice',partyId:'party',inviteCode:'0123'};},async request(){return {hostId:'alice',partyId:'party',inviteCode:'0123',uid:'bob'};},async approve(_p,_c,id){calls.push(['approve',id]);},async reject(_c,id){calls.push(['reject',id]);},async publishProfile(_p,p){calls.push(['publish',p.name]);},async configure(_p,c){calls.push(['config',c]);w.config(c);},async start(){calls.push(['start']);return {...manifest,profiles:Object.values(profiles),teamRosters:[['alice','cara'],['bob','dan']]};},async close(){calls.push(['close']);},async leave(){calls.push(['leave']);},async cancel(){calls.push(['cancel']);},
    watchHost:watch('host','alice'),watchSlots:watch('slots',null),watchConfig:watch('config',{mode:'four-coop',teams:[0,0,1,1]}),watchStarted:watch('started',null),watchRequests:watch('requests',{}),watchOwnRequest:watch('own',{name:'Bob'}),watchProfile(_p,id,cb){watchedProfiles[id]=cb;cb(profiles[id]||null);return()=>{if(watchedProfiles[id]===cb)delete watchedProfiles[id];};}};
  const panel=createFourPlayerPanel({document:doc,createLobby:()=>lobby,getProfile:()=>profiles[role==='host'?'alice':'bob'],confirmClose:async()=>true,onMatch:m=>{joined.push(m);return true;},onLeaveMatch:async()=>{stopped++;}});
  return {$,w,watchedProfiles,panel,calls,joined,lobby,get stopped(){return stopped;}};
}
test('host lobby handles approvals, roster readiness, teams and start',async()=>{
  const f=fixture();assert.equal(f.$('fourPartyPanel').hidden,true);f.panel.show();await f.$('fourPartyCreate').onclick();assert.equal(f.$('fourPartyCodeDisplay').textContent,'0123');assert.equal(f.$('fourPartyStart').disabled,true);
  f.w.requests({bob:{name:'Bob'},eve:{name:'<b>Not HTML</b>'}});const rows=f.$('fourPartyRequests').children;assert.equal(rows[1].children[0].textContent,'<b>Not HTML</b>');await rows[0].children[1].onclick();assert.deepEqual(f.calls[0],['approve','bob']);
  f.w.slots({one:'bob',two:'cara'});assert.equal(f.$('fourPartyStart').disabled,false);assert.deepEqual(f.$('fourPartyMode').children.map(x=>x.value),['four-coop']);f.w.slots({one:'bob',two:'cara',three:'dan'});assert.equal(f.$('fourPartyStart').disabled,false);
  f.$('fourPartyMode').value='two-vs-two';f.$('fourPartyMode').onchange();f.$('fourPartyTeams').value='1';f.$('fourPartyTeams').onchange();assert.equal(f.$('fourPartyTeams').hidden,false);assert.match(f.$('fourPartyRoster').children[2].textContent,/Cara · Team A · Ready/);
  await f.$('fourPartyStart').onclick();assert.deepEqual(f.calls.find(c=>c[0]==='config')[1],{mode:'two-vs-two',teams:[0,1,0,1]});assert.deepEqual(f.joined[0].playerIds,manifest.playerIds);assert.equal(f.$('fourPartyStart').hidden,true);await f.$('fourPartyLeave').onclick();assert.equal(f.stopped,1);assert.deepEqual(f.calls.at(-1),['close']);assert.equal(f.panel.isActive(),false);
});
test('guest approval publishes profile and hands off locked match once',async()=>{
  const f=fixture('guest');f.$('fourPartyCodeInput').value='0123';await f.$('fourPartyJoin').onclick();assert.match(f.$('fourPartyStatus').textContent,/Waiting/);f.w.slots({one:'bob',two:'cara',three:'dan'});await new Promise(resolve=>setImmediate(resolve));assert.deepEqual(f.calls[0],['publish','Bob']);assert.match(f.$('fourPartyStatus').textContent,/Approved/);
  f.w.started(manifest);f.w.started(manifest);await new Promise(resolve=>setImmediate(resolve));assert.equal(f.joined.length,1);assert.deepEqual(f.joined[0].teamRosters,[['alice','cara'],['bob','dan']]);await f.$('fourPartyLeave').onclick();assert.equal(f.stopped,1);assert.equal(f.panel.isActive(),false);assert.ok(!f.calls.some(c=>c[0]==='leave'),'locked roster is not mutated');
});
test('stale readiness callbacks cannot mark a replaced player ready',async()=>{
  const f=fixture();await f.$('fourPartyCreate').onclick();f.w.slots({one:'bob'});const stale=f.watchedProfiles.bob;f.w.slots({one:'cara'});stale(profiles.bob);f.w.slots({one:'bob',two:'cara',three:'dan'});f.watchedProfiles.bob(null);stale(profiles.bob);assert.equal(f.$('fourPartyStart').disabled,true);
});
test('logout clears the panel and bounds offline cleanup',async()=>{
  const f=fixture();await f.$('fourPartyCreate').onclick();await f.panel.leaveForLogout(20);assert.equal(f.panel.isActive(),false);assert.equal(f.$('fourPartyPanel').hidden,true);assert.deepEqual(f.calls.at(-1),['close']);
});
test('logout during party creation closes the late reservation',async()=>{
  const f=fixture();let resolve,closed=0;const base={};const lobby={...base,create:()=>new Promise(r=>{resolve=r;}),async close(){closed++;}};
  const doc={getElementById:f.$,createElement:()=>({append(){}})};
  const p=createFourPlayerPanel({document:doc,createLobby:()=>lobby,getProfile:()=>profiles.alice,onMatch:()=>true});
  const pending=f.$('fourPartyCreate').onclick();await p.leaveForLogout(5);resolve({partyId:'party',inviteCode:'0123',hostId:'alice'});await pending;assert.equal(closed,1);assert.equal(p.isActive(),false);
});

test('an existing guest can reconnect after a page reload without republishing a locked profile',async()=>{
  const f=fixture('guest');f.lobby.reconnect=async()=>manifest;f.$('fourPartyCodeInput').value='0123';await f.$('fourPartyJoin').onclick();f.w.slots({one:'bob',two:'cara',three:'dan'});await new Promise(resolve=>setImmediate(resolve));assert.equal(f.joined.length,1);assert.deepEqual(f.joined[0].playerIds,manifest.playerIds);assert.ok(!f.calls.some(c=>c[0]==='publish'));assert.ok(f.calls.some(c=>c[0]==='cancel'));assert.equal(f.$('fourPartyLeave').hidden,true);
});

test('host can cancel closing the party before stopping the match',async()=>{
  const f=fixture();const doc={getElementById:f.$,createElement:()=>({children:[],append(...a){this.children.push(...a);}})};const panel=createFourPlayerPanel({document:doc,createLobby:()=>f.lobby,getProfile:()=>profiles.alice,onMatch:()=>true,confirmClose:async()=>false});await f.$('fourPartyCreate').onclick();await f.$('fourPartyLeave').onclick();assert.equal(panel.isActive(),true);assert.ok(!f.calls.some(c=>c[0]==='close'));
});

test('the same lobby exposes appropriate modes as the roster grows',async()=>{
  const f=fixture();await f.$('fourPartyCreate').onclick();f.w.slots({one:'bob'});assert.deepEqual(f.$('fourPartyMode').children.map(x=>x.value),['coop','versus']);assert.equal(f.$('fourPartyStart').disabled,false);f.w.slots({one:'bob',two:'cara'});assert.deepEqual(f.$('fourPartyMode').children.map(x=>x.value),['four-coop']);f.w.slots({one:'bob',two:'cara',three:'dan'});assert.deepEqual(f.$('fourPartyMode').children.map(x=>x.value),['four-coop','two-vs-two']);
});
