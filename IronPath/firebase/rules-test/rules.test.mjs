import {test, before, after, beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,get,set,update,runTransaction,serverTimestamp} from 'firebase/database';
import {createFirebasePartyLobby} from '../../firebase-party-lobby.mjs';
import {createFirebasePartyChannel} from '../../firebase-party-channel.mjs';
const projectId='demo-ironpath',party='0123456789abcdef0123000000000000';
let env,alice,bob,eve,anonymous;
const at=(db,path)=>ref(db,`parties/${party}/${path}`);
before(async()=>{
  env=await initializeTestEnvironment({projectId,database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../party-alpha.draft.rules.json',import.meta.url),'utf8')}});
  alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();eve=env.authenticatedContext('eve').database();anonymous=env.unauthenticatedContext().database();
});
beforeEach(async()=>{await env.clearDatabase();});
after(async()=>{await env?.cleanup();});

test('only the signed-in owner can create an immutable host; guest slot is atomic',async()=>{
  await assertFails(set(at(anonymous,'hostId'),'alice'));
  await assertFails(set(at(alice,'hostId'),'bob'));
  await assertSucceeds(set(at(alice,'hostId'),'alice'));
  await assertFails(set(at(eve,'hostId'),'eve'));
  await assertFails(set(at(alice,'guestId'),'alice'));
  const joined=await assertSucceeds(runTransaction(at(bob,'guestId'),v=>v===null?'bob':undefined));assert.equal(joined.committed,true);
  await assertFails(set(at(alice,'hostId'),null));
  await assertFails(set(at(eve,'guestId'),'eve'));await assertFails(set(at(eve,'guestId'),null));
  await assertSucceeds(set(at(bob,'guestId'),null));await assertSucceeds(set(at(eve,'guestId'),'eve'));
  await assertFails(set(ref(alice,'parties/not-a-code/hostId'),'alice'));
});

test('non-members cannot read match data or write another player’s input',async()=>{
  await assertSucceeds(set(at(alice,'hostId'),'alice'));await assertSucceeds(set(at(bob,'guestId'),'bob'));
  await assertFails(get(ref(eve,`parties/${party}`)));await assertFails(get(at(eve,'inputs/bob')));
  await assertSucceeds(set(at(bob,'inputs/bob'),'{}'));await assertSucceeds(get(at(alice,'inputs/bob')));
  await assertFails(set(at(alice,'inputs/bob'),'{}'));await assertFails(set(at(eve,'inputs/eve'),'{}'));
  await assertFails(set(at(bob,'inputs/bob'),'x'.repeat(4097)));await assertFails(set(at(bob,'inputs/bob'),{unsafe:true}));
  await assertFails(set(ref(alice,`parties/${party}/unknown`),'anything'));
});

test('only host publishes member views; each member can read only their own',async()=>{
  await assertSucceeds(set(at(alice,'hostId'),'alice'));await assertSucceeds(set(at(bob,'guestId'),'bob'));
  await assertSucceeds(update(ref(alice,`parties/${party}`),{'views/alice':'{"tick":1}','views/bob':'{"tick":1}'}));
  await assertSucceeds(get(at(bob,'views/bob')));await assertFails(get(at(bob,'views/alice')));await assertFails(get(at(eve,'views/bob')));
  await assertFails(set(at(bob,'views/bob'),'{}'));await assertFails(set(at(alice,'views/eve'),'{}'));
  await assertFails(set(at(alice,'views/bob'),'x'.repeat(262145)));
});

test('presence writes belong to each member and use bounded server time',async()=>{
  await assertSucceeds(set(at(alice,'hostId'),'alice'));await assertSucceeds(set(at(bob,'guestId'),'bob'));
  const id='a'.repeat(32);await assertSucceeds(set(at(bob,`presence/bob/${id}`),serverTimestamp()));
  await assertSucceeds(get(at(alice,'presence/bob')));await assertFails(get(at(eve,'presence/bob')));
  await assertFails(set(at(eve,`presence/bob/${id}`),serverTimestamp()));await assertFails(set(at(bob,'presence/bob/not-a-connection'),serverTimestamp()));
  await assertFails(set(at(bob,`presence/bob/${id}`),1));await assertSucceeds(set(at(bob,`presence/bob/${id}`),null));
});

test('profile isolation and real client lobby/channel operations under draft rules',async()=>{
  const sdk={ref,get,set,update,runTransaction,onValue:(await import('firebase/database')).onValue};
  const authA={currentUser:{uid:'alice'}},authB={currentUser:{uid:'bob'}};
  const deterministicCrypto={getRandomValues(bytes){bytes.set(Buffer.from(party,'hex').subarray(0,bytes.length));return bytes;}};
  const lobbyA=createFirebasePartyLobby({db:alice,auth:authA,sdk,crypto:deterministicCrypto});
  const lobbyB=createFirebasePartyLobby({db:bob,auth:authB,sdk,crypto:deterministicCrypto});
  assert.equal((await lobbyA.create()).partyId,party);assert.equal((await lobbyB.join(party)).hostId,'alice');
  const opts={sdk,partyId:party,hostId:'alice',playerIds:['alice','bob']};
  const host=createFirebasePartyChannel({...opts,db:alice,auth:authA}),guest=createFirebasePartyChannel({...opts,db:bob,auth:authB});
  await assertSucceeds(guest.writeInput({version:1,seq:1,command:{type:'startWave'}}));
  await assertSucceeds(host.publishViews({alice:{tick:1},bob:{tick:1}}));
  await assertFails(get(ref(alice,'players/bob')));await assertFails(set(ref(alice,'players/bob/xp'),999));
  await host.close();await guest.close();
  const cleanup=createFirebasePartyLobby({db:alice,auth:authA,sdk:{...sdk,remove:(await import('firebase/database')).remove},crypto:deterministicCrypto});
  assert.equal(await cleanup.close(party),true);
  assert.equal((await get(at(alice,'hostId'))).exists(),false);
});


test('slot contention has one winner and departed guests lose party access',async()=>{
  await assertSucceeds(set(at(alice,'hostId'),'alice'));
  const claim=(db,id)=>runTransaction(at(db,'guestId'),v=>v===null?id:undefined);
  const claims=await Promise.all([claim(bob,'bob'),claim(eve,'eve')]);
  assert.equal(claims.filter(result=>result.committed).length,1);
  const winner=claims[0].committed?'bob':'eve',winnerDb=winner==='bob'?bob:eve;
  const next=winner==='bob'?'eve':'bob',nextDb=winner==='bob'?eve:bob;
  await assertSucceeds(set(at(winnerDb,`inputs/${winner}`),'{}'));
  await assertSucceeds(set(at(alice,`views/${winner}`),'{}'));
  await assertSucceeds(set(at(winnerDb,'guestId'),null));
  await assertFails(get(at(winnerDb,`views/${winner}`)));
  await assertFails(set(at(winnerDb,`inputs/${winner}`),'{}'));
  await assertFails(set(at(alice,`views/${winner}`),'{}'));
  await assertSucceeds(set(at(nextDb,'guestId'),next));
  await assertFails(get(at(nextDb,`views/${winner}`)));
});

test('two Firebase clients run a shared hosted match, pause, and resume', {timeout:20000}, async t=>{
  const {onValue,onDisconnect,remove,goOffline,goOnline}=await import('firebase/database');
  const {createFirebasePartyPresence}=await import('../../firebase-party-presence.mjs');
  const {createFirebasePartyHostSession,createFirebasePartyClientSession}=await import('../../firebase-party-session.mjs');
  const {createPartyHost}=await import('../../party-host.mjs');
  const {createMatch}=await import('../../simulation.mjs');
  const {createPlayer}=await import('../../match.mjs');
  const sdk={ref,get,set,update,runTransaction,onValue,onDisconnect,remove,serverTimestamp};
  const authA={currentUser:{uid:'alice'}},authB={currentUser:{uid:'bob'}};
  const opts={sdk,partyId:party,hostId:'alice',playerIds:['alice','bob']};
  await assertSucceeds(set(at(alice,'hostId'),'alice'));await assertSucceeds(set(at(bob,'guestId'),'bob'));
  const hc=createFirebasePartyChannel({...opts,db:alice,auth:authA}),ac=createFirebasePartyChannel({...opts,db:alice,auth:authA}),bc=createFirebasePartyChannel({...opts,db:bob,auth:authB});
  const engine=createPartyHost(createMatch(['alice','bob'].map(id=>createPlayer(id,{name:id,gender:'female'}))));
  let error,aliceReady=false,bobReady=false,bobSnapshot;
  const h=createFirebasePartyHostSession({channel:hc,host:engine,playerIds:opts.playerIds,epoch:'test-session',onError:e=>{error=e;}});
  const a=createFirebasePartyClientSession({channel:ac,onState:s=>{aliceReady=s==='ready';},timeoutMs:4000});
  const b=createFirebasePartyClientSession({channel:bc,onState:s=>{bobReady=s==='ready';},onView:s=>{bobSnapshot=s;},timeoutMs:4000});
  const pOpts={sdk,partyId:party,playerIds:opts.playerIds,heartbeatMs:1000,expiryMs:5000,onError:e=>{error=e;}};
  const pa=createFirebasePartyPresence({...pOpts,db:alice,auth:authA,onPresence:(id,online)=>h.setPresence(id,online)});
  const pb=createFirebasePartyPresence({...pOpts,db:bob,auth:authB});
  t.after(async()=>{await pb.stop();await pa.stop();await b.stop();await a.stop();await h.stop();});
  const until=async (fn)=>{const end=Date.now()+5000;while(!fn()){if(error)throw error;if(Date.now()>end)throw new Error('Timed out waiting for party');await new Promise(resolve=>setTimeout(resolve,20));}};
  a.start();b.start();h.start();pa.start();pb.start();
  await until(()=>engine.ready()&&aliceReady&&bobReady);
  const build=b.command({type:'build',pad:0,towerType:0});
  await until(()=>engine.snapshotFor('bob').nextSeq===2);
  for(let i=0;i<6;i++)h.step();
  assert.equal((await build).ok,true);await until(()=>bobSnapshot?.match.towers.length===1);
  const start=a.command({type:'startWave'});await until(()=>engine.snapshotFor('alice').nextSeq===2);
  for(let i=0;i<6;i++)h.step();assert.equal((await start).ok,true);
  await until(()=>bobSnapshot.match.wave===1);
  goOffline(bob);t.after(()=>goOnline(bob));await until(()=>engine.snapshotFor('alice').match.players.bob.active===false);
  assert.equal(engine.ready(),true);assert.equal(aliceReady,true);assert.ok(h.step());
  const move=a.command({type:'move',x:700,y:400});await until(()=>engine.snapshotFor('alice').nextSeq===3);
  for(let i=0;i<6;i++)h.step();assert.equal((await move).ok,true);
  goOnline(bob);await until(()=>engine.snapshotFor('bob').match.players.bob.active&&bobReady&&bobSnapshot?.match.players.bob.active&&bobSnapshot.tick===engine.snapshotFor('bob').tick);
  const direction=b.command({type:'direction',x:1,y:0});await until(()=>engine.snapshotFor('bob').nextSeq===3);
  for(let i=0;i<6;i++)h.step();assert.equal((await direction).ok,true);
});


test('only the host can delete an entire party, without gaining parent write access',async()=>{
  await assertSucceeds(set(at(alice,'hostId'),'alice'));await assertSucceeds(set(at(bob,'guestId'),'bob'));
  await assertSucceeds(set(at(bob,'inputs/bob'),'{}'));
  await assertFails(set(ref(bob,`parties/${party}`),null));
  await assertFails(set(ref(eve,`parties/${party}`),null));
  await assertFails(set(ref(alice,`parties/${party}`),{hostId:'alice',guestId:'bob',inputs:{bob:'forged'}}));
  await assertSucceeds(set(ref(alice,`parties/${party}`),null));
  await assertFails(set(at(bob,'inputs/bob'),'{}'));
  assert.equal((await get(at(alice,'hostId'))).exists(),false);
});

test('game-facing Firebase adapter connects, plays and pauses without a game server', {timeout:20000}, async t=>{
  const {onValue,onDisconnect,remove,goOffline,goOnline}=await import('firebase/database');
  const {createFirebasePartyGame}=await import('../../firebase-party-game.mjs');
  const {createPlayer}=await import('../../match.mjs');
  const sdk={ref,get,set,update,runTransaction,onValue,onDisconnect,remove,serverTimestamp};
  const crypto={getRandomValues(bytes){bytes.set(Buffer.from(party,'hex').subarray(0,bytes.length));return bytes;}};
  const hostLobby=createFirebasePartyLobby({db:alice,auth:{currentUser:{uid:'alice'}},sdk,crypto});
  const guestLobby=createFirebasePartyLobby({db:bob,auth:{currentUser:{uid:'bob'}},sdk,crypto});
  await hostLobby.create();await hostLobby.publishProfile(party,{name:'Alice',gender:'female',level:2});
  await guestLobby.join(party);await guestLobby.publishProfile(party,{name:'Bob',gender:'male',level:3});
  const info=await hostLobby.startMatch(party),ids=[info.hostId,info.guestId],players=info.profiles.map((profile,i)=>createPlayer(ids[i],profile));
  let readyA=false,readyB=false,viewB,stateA,stateB;
  const common={sdk,partyId:party,hostId:'alice',playerIds:ids};
  const a=createFirebasePartyGame({...common,db:alice,auth:{currentUser:{uid:'alice'}},players,onState:s=>{stateA=s;},onStatus:v=>{readyA=v;}});
  let holdGuestViews=false,heldGuestView=null,guestViewListener=null;
  const guestSdk={...sdk,onValue(target,callback,onError){
    if(target.toString().endsWith(`/parties/${party}/views/bob`))return onValue(target,snapshot=>{if(holdGuestViews){heldGuestView=snapshot;guestViewListener=callback;}else callback(snapshot);},onError);
    return onValue(target,callback,onError);
  }};
  const b=createFirebasePartyGame({...common,sdk:guestSdk,db:bob,auth:{currentUser:{uid:'bob'}},onState:s=>{stateB=s;},onStatus:v=>{readyB=v;},onSnapshot:s=>{viewB=s;}});
  t.after(async()=>{goOnline(bob);await Promise.all([a.stop(),b.stop()]);});
  const until=async predicate=>{const end=Date.now()+8000;while(!predicate()){if(stateA==='error'||stateB==='error')throw Error(`Party error: ${stateA} ${stateB}`);if(Date.now()>end)throw Error('Party game timed out');await new Promise(resolve=>setTimeout(resolve,25));}};
  a.start();b.start();await until(()=>readyA&&readyB);
  assert.equal((await b.command({type:'build',pad:0,towerType:0})).ok,true);
  await until(()=>viewB?.match.towers.length===1);
  assert.equal((await a.command({type:'startWave'})).ok,true);await until(()=>viewB?.match.wave===1);
  const oldConnections=Object.keys((await get(at(alice,'presence/bob'))).val());
  holdGuestViews=true;goOffline(bob);await until(()=>readyA&&!readyB);assert.equal((await b.command({type:'airstrike'})).ok,false);
  assert.equal((await a.command({type:'move',x:700,y:400})).ok,true);
  goOnline(bob);
  await until(()=>{try{const view=JSON.parse(heldGuestView?.val()||'null');return view?.ready&&view.connections?.some(id=>!oldConnections.includes(id));}catch{return false;}});
  assert.equal(readyB,false,'cached ready state must not enable a newly reconnected guest');
  holdGuestViews=false;guestViewListener(heldGuestView);await until(()=>readyA&&readyB);
  assert.equal((await b.command({type:'direction',x:1,y:0})).ok,true);
});


test('party profiles and one-time start handoff are member-bound',async()=>{
  const {onValue,remove}=await import('firebase/database');const sdk={ref,get,set,update,runTransaction,onValue,remove};
  const crypto={getRandomValues(bytes){bytes.set(Buffer.from(party,'hex').subarray(0,bytes.length));return bytes;}};
  const host=createFirebasePartyLobby({db:alice,auth:{currentUser:{uid:'alice'}},sdk,crypto});
  const guest=createFirebasePartyLobby({db:bob,auth:{currentUser:{uid:'bob'}},sdk,crypto});
  const profileA={name:'Alice',gender:'female',level:2,xp:1234},profileB={name:'Bob',gender:'male',level:3};
  await host.create();await host.publishProfile(party,profileA);await guest.join(party);
  await assert.rejects(host.startMatch(party),/not ready/);
  await assertFails(set(at(bob,'profiles/alice'),{name:'Fake',gender:'female',level:1}));
  await assertFails(set(at(bob,'profiles/bob'),{name:'Bob',gender:'male',level:3,xp:999}));
  await guest.publishProfile(party,profileB);await assertFails(get(at(eve,'profiles/bob')));
  await assertFails(set(at(bob,'startedGuest'),'bob'));
  const result=await host.startMatch(party);assert.deepEqual(result.profiles,[{name:'Alice',gender:'female',level:2},profileB]);
  assert.equal((await assertSucceeds(get(at(bob,'startedGuest')))).val(),'bob');
  await assertFails(set(at(bob,'profiles/bob'),profileB));await assert.rejects(host.startMatch(party),/already started/);
  await assertSucceeds(set(at(bob,'inputs/bob'),'{}'));
  assert.equal(await guest.leaveGuest(party),true);await assertFails(set(at(eve,'guestId'),'eve'));
  await assertSucceeds(set(at(alice,'views/bob'),'{}')); // Host can keep publishing while guest is away.
  await env.withSecurityRulesDisabled(async context=>{
    const db=context.database();assert.equal((await get(at(db,'profiles/bob'))).exists(),false);
    assert.equal((await get(at(db,'inputs/bob'))).exists(),false);assert.equal((await get(at(db,'profiles/alice'))).exists(),true);
  });
  assert.equal((await guest.join(party)).started,true);
  await assertSucceeds(set(ref(alice,`parties/${party}`),null));
});

test('party UI handoff drives the Firebase game with two authenticated clients', {timeout:20000}, async t=>{
  const {onValue,onDisconnect,remove}=await import('firebase/database');
  const {createFirebasePartyPanel}=await import('../../firebase-party-panel.mjs');
  const {createFirebasePartyGame}=await import('../../firebase-party-game.mjs');
  const {createPlayer}=await import('../../match.mjs');
  const sdk={ref,get,set,update,runTransaction,onValue,onDisconnect,remove,serverTimestamp};
  const deterministicCrypto={getRandomValues(bytes){bytes.set(Buffer.from(party,'hex').subarray(0,bytes.length));return bytes;}};
  function makeDoc(){const nodes=new Map();return {getElementById(id){if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,textContent:'',value:''});return nodes.get(id);}};}
  function player(db,uid){
    const auth={currentUser:{uid}},doc=makeDoc();let game=null,ready=false,snapshot;
    const panel=createFirebasePartyPanel({document:doc,enabled:true,createLobby:()=>createFirebasePartyLobby({db,auth,sdk,crypto:deterministicCrypto}),getProfile:()=>({name:uid,gender:'female',level:1}),
      onJoinMatch:(partyInfo,onState)=>{game=createFirebasePartyGame({db,auth,sdk,...partyInfo,players:partyInfo.profiles?.map((p,i)=>createPlayer(partyInfo.playerIds[i],p)),onState,onStatus:value=>{ready=value;},onSnapshot:value=>{snapshot=value;}});game.start();return true;},
      onLeaveMatch:async()=>{const old=game;game=null;ready=false;await old?.stop();}});
    return {doc,panel,get game(){return game;},get ready(){return ready;},get snapshot(){return snapshot;}};
  }
  const a=player(alice,'alice'),b=player(bob,'bob');t.after(async()=>{await b.game?.stop();await a.game?.stop();a.panel.reset();b.panel.reset();});
  const until=async fn=>{const end=Date.now()+8000;while(!fn()){if(Date.now()>end)throw Error(`UI flow timed out: ${a.doc.getElementById('partyStatus').textContent} / ${b.doc.getElementById('partyStatus').textContent}`);await new Promise(resolve=>setTimeout(resolve,20));}};
  await a.doc.getElementById('partyCreate').onclick();const invite=a.doc.getElementById('partyCodeDisplay').textContent;assert.match(invite,/^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/);
  b.doc.getElementById('partyCodeInput').value=invite;await b.doc.getElementById('partyJoin').onclick();
  await until(()=>!a.doc.getElementById('partyStart').disabled);await a.doc.getElementById('partyStart').onclick();
  await until(()=>a.ready&&b.ready);assert.equal((await b.game.command({type:'build',pad:0,towerType:0})).ok,true);
  await until(()=>b.snapshot?.match.towers.length===1);assert.equal(b.snapshot.match.players.alice.name,'alice');
  await b.doc.getElementById('partyLeave').onclick();await until(()=>a.ready&&/Teammate left/.test(a.doc.getElementById('partyStatus').textContent));
  assert.ok(a.game,'host must keep their current match');assert.equal((await a.game.command({type:'move',x:700,y:400})).ok,true);
  b.doc.getElementById('partyCodeInput').value=invite;await b.doc.getElementById('partyJoin').onclick();await until(()=>a.ready&&b.ready);
  assert.equal((await b.game.command({type:'direction',x:1,y:0})).ok,true);
  await b.doc.getElementById('partyLeave').onclick();await a.doc.getElementById('partyLeave').onclick();assert.equal((await get(at(alice,'hostId'))).exists(),false);
});
