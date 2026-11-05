import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {createCoopRewardQueue} from '../coop-rewards.mjs';
import {initializeWireWorkshop,decodeWorkshop} from '../workshop-wire.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
const party='ab'.repeat(16),profile={name:'Alice',gender:'female',level:1};
const match=createMatch([createPlayer('a',profile),createPlayer('b',profile)]);
match.wave=1;match.running=true;stepMatch(match);assert.equal(match.players.a.completedWaveMask,1);assert.equal(match.players.b.completedWaveMask,1);
match.players.b.active=false;match.wave=2;match.running=true;stepMatch(match);assert.equal(match.players.a.completedWaveMask,3);assert.equal(match.players.b.completedWaveMask,1);
match.players.b.active=true;match.wave=3;match.running=true;stepMatch(match);assert.equal(match.players.a.completedWaveMask,7);assert.equal(match.players.b.completedWaveMask,5);
const uid={currentUser:{uid:'a'}},data={xp:0,name:'Alice',gender:'female'},statuses=[],deltas=[];let calls=0,fail=false,now=1000;
const sdk={ref(_db,path){return path;},onValue(_ref,callback){callback({val:()=>structuredClone(data)});return()=>{};},async runTransaction(_ref,update){calls++;if(fail)throw Error('offline');const next=update(structuredClone(data));if(next)Object.assign(data,next);return {committed:!!next,snapshot:{val:()=>structuredClone(data)}};}};
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
const queue=createCoopRewardQueue({db:{},auth:uid,sdk,partyId:party,onStatus:(s,detail)=>{statuses.push(s);if(s==='saved')deltas.push(detail.delta);},clock:()=>now});
queue.observe(1);queue.observe(1);await flush();assert.equal(data.xp,30);assert.equal(data.armory.scrap,10);assert.equal(data.coopRewards[party],1);assert.deepEqual(statuses,['saved']);assert.deepEqual(deltas[0],{xp:30,scrap:10,items:[],levels:0,unlocks:[]});
queue.observe(1);await flush();assert.equal(calls,1,'repeated snapshots must not create more transactions');
queue.observe(5);await flush();assert.equal(data.xp,80);assert.equal(data.coopRewards[party],5);
fail=true;queue.observe(7);await flush();assert.equal(data.xp,80);assert.equal(statuses.at(-1),'error');const attempted=calls;
queue.observe(7);await flush();assert.equal(calls,attempted,'failed claims are backed off');
fail=false;now+=5001;queue.observe(7);await flush();assert.equal(data.xp,120);assert.equal(data.coopRewards[party],7);assert.deepEqual(deltas.at(-1),{xp:40,scrap:10,items:['Field Scope'],levels:0,unlocks:[]});
const second=createCoopRewardQueue({db:{},auth:uid,sdk,partyId:party});second.observe(7);await flush();assert.equal(data.xp,120,'rejoin cannot credit a wave twice');assert.equal(data.armory.scrap,30,'rejoin cannot duplicate loot');assert.equal(data.armory.owned,1,'wave two unlocks the scope');
// Later waves retain old receipts and pay exactly once through wave 20.
const late=7|(1<<10)|(1<<19);queue.observe(late);await flush();assert.equal(data.xp,470);assert.equal(data.armory.scrap,50);assert.equal(data.coopRewards[party],late);
second.observe(late);await flush();assert.equal(data.xp,470,'rejoin cannot credit late waves twice');
uid.currentUser={uid:'other'};queue.observe(late|(1<<11));await flush();assert.equal(data.xp,470,'account switch cannot credit previous profile');
queue.close();second.close();
console.log('Co-op wave participation and idempotent reward queue tests passed.');
// Additional 20-wave blocks use separate valid receipts and retain exactly-once XP.
uid.currentUser={uid:'a'};
const later=createCoopRewardQueue({db:{},auth:uid,sdk,partyId:party,block:1});later.observe(1);await flush();assert.equal(data.xp,700);assert.equal(data.armory.scrap,60);later.observe(1);await flush();assert.equal(data.xp,700);
const laterReconnect=createCoopRewardQueue({db:{},auth:uid,sdk,partyId:party,block:1});laterReconnect.observe(1);await flush();assert.equal(data.xp,700,'wave 21 is not credited twice on reconnect');later.close();laterReconnect.close();
// Gated workshop alpha: the same transaction credits components and keeps receipts.
{
 const flushWait=()=>new Promise(resolve=>setTimeout(resolve,0));
 const state={xp:0,name:'Alice',gender:'female',armory:{scrap:0,fortify:0,plating:0,owned:0,equipped:0},workshop:initializeWireWorkshop({name:'Alice',xp:0}).workshop},deltas=[];
 const sdk={ref:(_db,path)=>path,onValue:(_ref,callback)=>{callback({val:()=>structuredClone(state)});return()=>{};},async runTransaction(_ref,update){const next=update(structuredClone(state));if(next)Object.assign(state,next);return {committed:!!next,snapshot:{val:()=>structuredClone(state)}};}};
 const auth={currentUser:{uid:'a'}},queue=createCoopRewardQueue({db:{},auth,sdk,partyId:party,workshop:true,onStatus:(status,detail)=>{if(status==='saved')deltas.push(detail.delta);}});
 queue.observe(31);await flushWait();assert.equal(state.xp,250);assert.equal(state.armory.scrap,70,'five completed waves pay ten regular scrap each plus twenty for the boss');assert.ok(decodeWorkshop(state.workshop));assert.equal(decodeWorkshop(state.workshop).components,1);assert.equal(state.coopRewards[party],31);
 const before=state.xp;queue.observe(31);await flushWait();assert.equal(state.xp,before,'a replayed workshop receipt earns nothing');queue.close();
}
console.log('Workshop co-op receipt tests passed.');

test('co-op credits the workshop once, including boss components',async()=>{
 // The live queue must pay the workshop path, not only the legacy scrap/XP path:
 // without it, crafted gear never gets its boss components in multiplayer.
 const state={name:'Alice',gender:'female',xp:0,armory:{scrap:0,owned:0,equipped:0}},statuses=[];
 const workshopSdk={ref:(_db,path)=>path,onValue(_ref,callback){callback({val:()=>structuredClone(state)});return()=>{};},
  async runTransaction(_ref,update){const next=update(structuredClone(state));if(next)Object.assign(state,next);return {committed:!!next,snapshot:{val:()=>structuredClone(state)}};}};
 const queue=createCoopRewardQueue({db:{},auth:{currentUser:{uid:'a'}},sdk:workshopSdk,partyId:party,workshop:true,onStatus:status=>statuses.push(status)});
 queue.observe(0b11111);await flush();
 assert.equal(statuses.at(-1),'saved','the workshop transaction commits');
 assert.ok(decodeWorkshop(state.workshop),'a workshop is created by the credit');
 assert.equal(decodeWorkshop(state.workshop).components,1,'wave 5 is a boss wave and pays a component');
 assert.equal(state.coopRewards[party],0b11111);
 const paid=JSON.stringify(state);
 queue.observe(0b11111);await flush();assert.equal(JSON.stringify(state),paid,'a replay pays nothing');
 queue.observe(0b111111);await flush();
 assert.equal(state.coopRewards[party],0b111111,'a later block still pays its own waves');
});
