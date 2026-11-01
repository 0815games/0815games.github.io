import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,get,set,runTransaction,onValue,update} from 'firebase/database';
import {createCoopRewardQueue} from '../../coop-rewards.mjs';
const party='abcdef0123456789abcdef0123456789';let env,alice,bob;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../armory.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();});
beforeEach(async()=>env.clearDatabase());after(async()=>env.cleanup());
const until=async fn=>{const end=Date.now()+5000;while(!await fn()){if(Date.now()>end)throw Error('Timed out waiting for XP');await new Promise(r=>setTimeout(r,20));}};
const sdk={ref,get,onValue,runTransaction};
test('atomic wave receipts protect both profiles from duplicate credits and other accounts',async()=>{
  await assertSucceeds(set(ref(alice,'players/alice'),{name:'Alice',gender:'female',xp:0}));await assertSucceeds(set(ref(bob,'players/bob'),{name:'Bob',gender:'male',xp:0}));
  const qa=createCoopRewardQueue({db:alice,auth:{currentUser:{uid:'alice'}},sdk,partyId:party,onStatus:(s,e)=>{if(e)console.error('A reward:',e);}}),qb=createCoopRewardQueue({db:bob,auth:{currentUser:{uid:'bob'}},sdk,partyId:party,onStatus:(s,e)=>{if(e)console.error('B reward:',e);}});
  qa.observe(1);qb.observe(1);
  await until(async()=>(await get(ref(alice,'players/alice/xp'))).val()===30&&(await get(ref(bob,'players/bob/xp'))).val()===30);
  qa.observe(1);qb.observe(1);qa.observe(3);qb.observe(3);
  await until(async()=>(await get(ref(alice,'players/alice/xp'))).val()===70&&(await get(ref(bob,'players/bob/xp'))).val()===70);
  const again=createCoopRewardQueue({db:alice,auth:{currentUser:{uid:'alice'}},sdk,partyId:party});again.observe(3);await new Promise(r=>setTimeout(r,150));
  assert.equal((await get(ref(alice,'players/alice/xp'))).val(),70);
  await assertFails(set(ref(alice,'players/bob/coopRewards/'+party),7));await assertFails(get(ref(alice,'players/bob')));
  await assertFails(set(ref(alice,'players/alice/coopRewards/bad'),3));await assertFails(set(ref(alice,'players/alice/coopRewards/'+party),1024));
  qa.close();qb.close();again.close();
});
test('host snapshots credit both participants once and preserve progress on reconnect',async t=>{
  const {createFirebasePartyChannel}=await import('../../firebase-party-channel.mjs');
  const {createFirebasePartyHostSession,createFirebasePartyClientSession}=await import('../../firebase-party-session.mjs');
  const {createPartyHost}=await import('../../party-host.mjs');const {createMatch}=await import('../../simulation.mjs');const {createPlayer}=await import('../../match.mjs');
  await set(ref(alice,'players/alice'),{name:'Alice',gender:'female',xp:0});await set(ref(bob,'players/bob'),{name:'Bob',gender:'female',xp:0});
  await env.withSecurityRulesDisabled(async ctx=>{await set(ref(ctx.database(),`parties/${party}`),{hostId:'alice',guestId:'bob'});});
  const fullSdk={...sdk,set,onValue,update},ids=['alice','bob'],opts={sdk:fullSdk,partyId:party,hostId:'alice',playerIds:ids};
  const authA={currentUser:{uid:'alice'}},authB={currentUser:{uid:'bob'}};
  const qa=createCoopRewardQueue({db:alice,auth:authA,sdk,partyId:party,onStatus:(s,e)=>{if(e)console.error('A reward:',e);}}),qb=createCoopRewardQueue({db:bob,auth:authB,sdk,partyId:party});
  const state=createMatch(ids.map(id=>createPlayer(id,{name:id,gender:'female'})));state.wave=1;state.running=true;
  const engine=createPartyHost(state,{hostId:'alice'});
  const h=createFirebasePartyHostSession({channel:createFirebasePartyChannel({...opts,db:alice,auth:authA}),host:engine,playerIds:ids,epoch:'xp-test'});
  const a=createFirebasePartyClientSession({channel:createFirebasePartyChannel({...opts,db:alice,auth:authA}),onView:view=>qa.observe(view.match.players.alice.completedWaveMask)});
  const b=createFirebasePartyClientSession({channel:createFirebasePartyChannel({...opts,db:bob,auth:authB}),onView:view=>qb.observe(view.match.players.bob.completedWaveMask)});
  t.after(async()=>{qa.close();qb.close();await Promise.all([h.stop(),a.stop(),b.stop()]);});
  a.start();b.start();h.start();h.setPresence('alice',true);h.setPresence('bob',true);h.step(); // Completion is published immediately, even off the normal snapshot cadence.
  await until(async()=>(await get(ref(alice,'players/alice/xp'))).val()===30&&(await get(ref(bob,'players/bob/xp'))).val()===30);
  h.publish();h.publish();await new Promise(r=>setTimeout(r,150));
  assert.equal((await get(ref(alice,'players/alice/xp'))).val(),30);assert.equal((await get(ref(bob,'players/bob/xp'))).val(),30);
});

test('actual game adapters show each balance and credit both players for a completed wave', {timeout:20000}, async t=>{
  const {onDisconnect,remove,serverTimestamp}=await import('firebase/database');
  const {createFirebasePartyGame}=await import('../../firebase-party-game.mjs');
  const {createPlayer}=await import('../../match.mjs');
  const {STEP}=await import('../../simulation.mjs');
  const fullSdk={ref,get,set,onValue,update,runTransaction,onDisconnect,remove,serverTimestamp};
  await set(ref(alice,'players/alice'),{name:'Alice',gender:'female',xp:0});await set(ref(bob,'players/bob'),{name:'Bob',gender:'female',xp:0});
  await env.withSecurityRulesDisabled(async ctx=>{await set(ref(ctx.database(),`parties/${party}`),{hostId:'alice',guestId:'bob'});});
  const ids=['alice','bob'],authA={currentUser:{uid:'alice'}},authB={currentUser:{uid:'bob'}};
  const qa=createCoopRewardQueue({db:alice,auth:authA,sdk:fullSdk,partyId:party}),qb=createCoopRewardQueue({db:bob,auth:authB,sdk:fullSdk,partyId:party});
  let readyA=false,readyB=false,viewA,viewB,stateA,stateB;
  const common={sdk:fullSdk,partyId:party,hostId:'alice',playerIds:ids};
  const a=createFirebasePartyGame({...common,db:alice,auth:authA,players:ids.map((id,i)=>createPlayer(id,{name:id,gender:'female',level:21,loadout:i?'0,2,2':'1,0,1'},100,130)),onStatus:v=>{readyA=v;},onState:v=>{stateA=v;},onSnapshot:v=>{viewA=v;},onWaveRewards:v=>qa.observe(v)});
  const b=createFirebasePartyGame({...common,db:bob,auth:authB,onStatus:v=>{readyB=v;},onState:v=>{stateB=v;},onSnapshot:v=>{viewB=v;},onWaveRewards:v=>qb.observe(v)});
  t.after(async()=>{qa.close();qb.close();await Promise.all([a.stop(),b.stop()]);});
  // Accelerate only the game tick; network and presence timers use real time.
  const originalSetInterval=globalThis.setInterval;
  try{globalThis.setInterval=(fn,delay,...args)=>originalSetInterval(fn,delay===STEP*1000?2:delay,...args);a.start();b.start();}finally{globalThis.setInterval=originalSetInterval;}
  const readyUntil=async fn=>{const end=Date.now()+10000;while(!await fn()){if(stateA==='error'||stateB==='error')throw Error(`Adapter error: ${stateA}/${stateB}`);if(Date.now()>end)throw Error('Timed out waiting for game adapters');await new Promise(r=>setTimeout(r,20));}};
  await readyUntil(()=>readyA&&readyB&&viewA&&viewB);
  assert.equal(viewA.match.money,125);assert.equal(viewB.match.money,125);assert.equal(viewA.match.maxHp,120);assert.equal(viewB.match.plating,2);assert.equal(viewB.match.players.bob.loadout.equipped,2);
  assert.equal((await b.command({type:'build',pad:0,towerType:0})).ok,true);
  await readyUntil(()=>viewB.match.players.bob.money===75);
  assert.equal(viewB.match.money,75,'guest sees their own updated balance');assert.equal(viewA.match.players.alice.money,125);
  assert.equal((await a.command({type:'startWave'})).ok,true);
  await readyUntil(async()=>(await get(ref(alice,'players/alice/xp'))).val()===30&&(await get(ref(bob,'players/bob/xp'))).val()===30);
  assert.equal(viewB.match.players.bob.completedWaveMask,1);assert.equal(viewA.match.players.alice.completedWaveMask,1);
  assert.equal((await get(ref(alice,'players/alice/armory/scrap'))).val(),10);assert.equal((await get(ref(bob,'players/bob/armory/scrap'))).val(),10);
});


test('skill builds are owner-only, validated and survive XP transactions',async()=>{
  await assertSucceeds(set(ref(alice,'players/alice'),{name:'Alice',gender:'female',xp:0}));
  await assertSucceeds(set(ref(alice,'players/alice/skills'),'1,0,0,0,0;engineer'));
  await assertFails(set(ref(bob,'players/alice/skills'),'0,0,0,0,0;assault'));
  await assertFails(set(ref(alice,'players/alice/skills'),'4,0,0,0,0;assault'));
  await assertFails(set(ref(alice,'players/alice/skills'),'0,0,0,0,0;bogus'));
  const q=createCoopRewardQueue({db:alice,auth:{currentUser:{uid:'alice'}},sdk,partyId:party});q.observe(1);
  await until(async()=>(await get(ref(alice,'players/alice/xp'))).val()===30);
  assert.equal((await get(ref(alice,'players/alice/skills'))).val(),'1,0,0,0,0;engineer');q.close();
  await env.withSecurityRulesDisabled(async ctx=>{await set(ref(ctx.database(),`parties/${party}`),{hostId:'alice',guestId:'bob'});});
  await assertSucceeds(set(ref(alice,`parties/${party}/profiles/alice`),{name:'Alice',gender:'female',level:2,skills:'1,0,0,0,0;engineer'}));
  await assertFails(set(ref(bob,`parties/${party}/profiles/alice/skills`),'0,0,0,0,0;assault'));
  await assertFails(set(ref(alice,`parties/${party}/profiles/alice/skills`),'9,0,0,0,0;assault'));
});


test('armory data and party loadout are owner-only and bounded',async()=>{
  await assertSucceeds(set(ref(alice,'players/alice'),{name:'Alice',gender:'female',xp:0}));
  const armor={scrap:30,fortify:1,plating:0,owned:1,equipped:1};
  await assertSucceeds(set(ref(alice,'players/alice/armory'),armor));
  await assertFails(set(ref(bob,'players/alice/armory/scrap'),999));
  await assertFails(set(ref(alice,'players/alice/armory/fortify'),4));
  await assertFails(set(ref(alice,'players/alice/armory/scrap'),-1));
  await assertFails(set(ref(alice,'players/alice/armory/unknown'),1));
  await env.withSecurityRulesDisabled(async ctx=>{await set(ref(ctx.database(),`parties/${party}`),{hostId:'alice',guestId:'bob'});});
  await assertSucceeds(set(ref(alice,`parties/${party}/profiles/alice`),{name:'Alice',gender:'female',level:1,loadout:'1,0,1'}));
  await assertFails(set(ref(bob,`parties/${party}/profiles/alice/loadout`),'0,0,0'));
  await assertFails(set(ref(alice,`parties/${party}/profiles/alice/loadout`),'4,0,0'));
});
