import {test,before,after,beforeEach} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {ref,set,get} from 'firebase/database';
let env,host,guest,attacker;
const party='0123456789abcdef0123456789abcdef',code='0123';
const at=(db,path)=>ref(db,path);
before(async()=>{
  env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../party-four-digit.draft.rules.json',import.meta.url),'utf8')}});
  host=env.authenticatedContext('alice').database();guest=env.authenticatedContext('bob').database();attacker=env.authenticatedContext('eve').database();
});
beforeEach(async()=>{await env.clearDatabase();});after(async()=>{await env.cleanup();});
test('four-digit requests require explicit host approval and cannot grant unauthorized access',async()=>{
  const p=`parties/${party}`,c=`partyCodes/${code}`;
  for(const [db,uid,name] of [[host,'alice','Alice'],[guest,'bob','Bob'],[attacker,'eve','Eve']])await assertSucceeds(set(at(db,`players/${uid}`),{name,gender:'female',xp:0}));
  await assertSucceeds(set(at(host,`${p}/hostId`),'alice'));
  await assertSucceeds(set(at(host,`${c}/hostId`),'alice'));
  await assertSucceeds(set(at(host,`${p}/inviteCode`),code));
  await assertSucceeds(set(at(host,`${c}/partyId`),party));
  assert.equal((await assertSucceeds(get(at(guest,`${c}/partyId`)))).val(),party);
  await assertFails(set(at(guest,`${p}/guestId`),'bob'));
  await assertFails(get(at(guest,`${p}/views/bob`)));
  await assertFails(set(at(guest,`${c}/requests/bob`),{name:'Alice'}));
  await assertFails(set(at(attacker,`${c}/requests/bob`),{name:'Bob'}));
  await assertSucceeds(set(at(guest,`${c}/requests/bob`),{name:'Bob'}));
  await assertFails(get(at(attacker,`${c}/requests`)));
  assert.equal((await assertSucceeds(get(at(host,`${c}/requests/bob`)))).val().name,'Bob');
  await assertFails(set(at(host,`${p}/guestId`),'eve'));
  await assertFails(set(at(attacker,`${p}/guestId`),'eve'));
  await assertSucceeds(set(at(host,`${p}/guestId`),'bob'));
  await assertSucceeds(set(at(guest,`${p}/inputs/bob`),'{}'));
  await assertFails(set(at(attacker,`${p}/inputs/eve`),'{}'));
  await assertSucceeds(set(at(guest,`${p}/guestId`),null));
  // A locked match can only re-admit its original guest, even if another
  // signed-in player knows the short code and requests access.
  await env.withSecurityRulesDisabled(async context=>{await set(ref(context.database(),`${p}/startedGuest`),'bob');});
  await assertSucceeds(set(at(attacker,`${c}/requests/eve`),{name:'Eve'}));
  await assertFails(set(at(host,`${p}/guestId`),'eve'));
  await assertSucceeds(set(at(host,`${p}/guestId`),'bob'));
  await assertSucceeds(set(at(guest,`${p}/guestId`),null));
  await assertSucceeds(set(at(host,`${c}/requests/bob`),null));
  await assertFails(set(at(guest,`${p}/guestId`),'bob'));
  await assertSucceeds(set(at(host,c),null));
});

test('four-digit adapter reserves a code and requires approval',async()=>{
  const {onValue,runTransaction,remove,update}=await import('firebase/database');
  const {createFirebasePartyLobby}=await import('../../firebase-party-lobby.mjs');
  const {createFourDigitLobby}=await import('../../firebase-four-digit-lobby.mjs');
  const sdk={ref,get,set,onValue,runTransaction,remove,update};
  await assertSucceeds(set(at(host,'players/alice'),{name:'Alice',gender:'female',xp:0}));
  await assertSucceeds(set(at(guest,'players/bob'),{name:'Bob',gender:'female',xp:0}));
  let random=0;const crypto={getRandomValues(bytes){bytes.fill(++random);return bytes;}};
  const aliceAuth={currentUser:{uid:'alice'}},bobAuth={currentUser:{uid:'bob'}};
  const baseA=createFirebasePartyLobby({db:host,auth:aliceAuth,sdk,crypto}),baseB=createFirebasePartyLobby({db:guest,auth:bobAuth,sdk,crypto});
  const a=createFourDigitLobby({db:host,auth:aliceAuth,sdk,crypto,lobby:baseA}),b=createFourDigitLobby({db:guest,auth:bobAuth,sdk,crypto,lobby:baseB});
  const created=await a.create();assert.match(created.inviteCode,/^\d{4}$/);
  const requested=await b.request(created.inviteCode,'Bob');assert.equal(requested.partyId,created.partyId);
  await assertFails(set(at(guest,`parties/${created.partyId}/guestId`),'bob'));
  assert.equal(await a.approve(created.partyId,created.inviteCode,'bob'),true);
  assert.equal((await get(at(host,`parties/${created.partyId}/guestId`))).val(),'bob');
  await assertSucceeds(baseB.publishProfile(created.partyId,{name:'Bob',gender:'female',level:1}));
  await assertSucceeds(baseB.leaveGuest(created.partyId));
  assert.equal(await a.close(created.partyId,created.inviteCode),true);
});

test('host approves four-digit request and two clients play and rejoin', {timeout:25000}, async t=>{
  const {onValue,runTransaction,remove,update,onDisconnect,serverTimestamp}=await import('firebase/database');
  const {createFirebasePartyLobby}=await import('../../firebase-party-lobby.mjs');
  const {createFourDigitLobby}=await import('../../firebase-four-digit-lobby.mjs');
  const {createFourDigitPanel}=await import('../../firebase-four-digit-panel.mjs');
  const {createFirebasePartyGame}=await import('../../firebase-party-game.mjs');
  const {createPlayer}=await import('../../match.mjs');
  const sdk={ref,get,set,onValue,runTransaction,remove,update,onDisconnect,serverTimestamp};
  for(const [db,uid,name] of [[host,'alice','Alice'],[guest,'bob','Bob']])await set(at(db,`players/${uid}`),{name,gender:'female',xp:0});
  let seed=1;const crypto={getRandomValues(bytes){bytes.fill(seed++);return bytes;}};
  function makeDoc(){const nodes=new Map();function node(){return {hidden:false,disabled:false,textContent:'',value:'',children:[],attributes:{},setAttribute(k,v){this.attributes[k]=v;},append(...v){this.children.push(...v);},replaceChildren(...v){this.children=v;}};}return {getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:()=>node()};}
  let allowClose=false;
  function player(db,uid,name){
    const auth={currentUser:{uid}},doc=makeDoc();let game=null,ready=false;
    const panel=createFourDigitPanel({document:doc,enabled:true,createLobby:()=>createFirebasePartyLobby({db,auth,sdk,crypto}),createApproval:lobby=>createFourDigitLobby({db,auth,sdk,crypto,lobby}),getProfile:()=>({name,gender:'female',level:1}),confirmMatch:()=>true,confirmClose:()=>allowClose,
      onJoinMatch:(info,onState)=>{game=createFirebasePartyGame({db,auth,sdk,...info,players:info.profiles?.map((p,i)=>createPlayer(info.playerIds[i],p)),onState,onStatus:value=>{ready=value;}});game.start();return true;},
      onLeaveMatch:async()=>{const old=game;game=null;ready=false;await old?.stop();}});
    return {doc,panel,get game(){return game;},get ready(){return ready;}};
  }
  const a=player(host,'alice','Alice'),b=player(guest,'bob','Bob');t.after(async()=>{await b.game?.stop();await a.game?.stop();a.panel.reset();b.panel.reset();});
  const until=async fn=>{const end=Date.now()+10000;while(!fn()){if(Date.now()>end)throw Error(`UI timed out: ${a.doc.getElementById('partyStatus').textContent} / ${b.doc.getElementById('partyStatus').textContent}`);await new Promise(resolve=>setTimeout(resolve,25));}};
  assert.equal(a.doc.getElementById('firebaseParty').hidden,true);a.doc.getElementById('partyToggle').onclick();assert.equal(a.doc.getElementById('firebaseParty').hidden,false);
  await a.doc.getElementById('partyCreate').onclick();a.doc.getElementById('partyToggle').onclick();assert.equal(a.doc.getElementById('firebaseParty').hidden,true);const invite=a.doc.getElementById('partyCodeDisplay').textContent;assert.match(invite,/^\d{4}$/);assert.equal(a.doc.getElementById('partyCodeArea').hidden,false);assert.equal(a.doc.getElementById('partyLeave').textContent,'CLOSE PARTY');
  b.doc.getElementById('partyCodeInput').value=invite;await b.doc.getElementById('partyJoin').onclick();
  assert.equal(b.doc.getElementById('partyLeave').textContent,'CANCEL REQUEST');assert.equal(b.doc.getElementById('partyCodeArea').hidden,true);
  await until(()=>a.doc.getElementById('partyRequests').children.length===1);
  assert.match(a.doc.getElementById('partyToggle').textContent,/•/);a.doc.getElementById('partyToggle').onclick();assert.equal(a.doc.getElementById('partyCodeDisplay').textContent,invite);
  const row=a.doc.getElementById('partyRequests').children[0];assert.match(row.children[0].textContent,/Bob/);assert.equal(b.game,null);
  await row.children[1].onclick();await until(()=>!a.doc.getElementById('partyStart').disabled&&b.doc.getElementById('partyLeave').textContent==='LEAVE PARTY');
  await a.doc.getElementById('partyStart').onclick();await until(()=>a.ready&&b.ready);
  assert.equal((await b.game.command({type:'build',pad:0,towerType:0})).ok,true);
  await b.doc.getElementById('partyLeave').onclick();await until(()=>a.ready&&/Teammate left/.test(a.doc.getElementById('partyStatus').textContent));
  assert.equal((await a.game.command({type:'move',x:700,y:400})).ok,true);
  b.doc.getElementById('partyCodeInput').value=invite;await b.doc.getElementById('partyJoin').onclick();
  await until(()=>a.doc.getElementById('partyRequests').children.length===1);await a.doc.getElementById('partyRequests').children[0].children[1].onclick();
  await until(()=>a.ready&&b.ready);assert.equal((await b.game.command({type:'direction',x:1,y:0})).ok,true);
  await b.doc.getElementById('partyLeave').onclick();await a.doc.getElementById('partyLeave').onclick();assert.ok(a.game,'cancelling close keeps the host playing');allowClose=true;await a.doc.getElementById('partyLeave').onclick();
});
