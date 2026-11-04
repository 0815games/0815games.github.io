import {strict as assert} from 'node:assert';
import {createFirebasePartyGame} from '../firebase-party-game.mjs';
import {createPlayer} from '../match.mjs';
const ids=['alice','bob','cara','dan'],profiles=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
const values=new Map([['.info/connected',true],['.info/serverTimeOffset',0]]),listeners=new Map();
function read(path){if(values.has(path))return values.get(path);const children={};for(const [key,value] of values)if(key.startsWith(path+'/')){const child=key.slice(path.length+1);if(!child.includes('/'))children[child]=value;}return Object.keys(children).length?children:null;}
function notify(path){for(const [name,cbs] of listeners)if(path===name||path.startsWith(name+'/'))for(const cb of cbs)cb({val:()=>read(name)});}
const sdk={ref:(_db,path)=>path,onValue(path,cb){if(!listeners.has(path))listeners.set(path,new Set());listeners.get(path).add(cb);cb({val:()=>read(path)});return()=>listeners.get(path).delete(cb);},onDisconnect(){return {async remove(){}};},serverTimestamp:()=>Date.now(),async set(path,v){values.set(path,v);notify(path);},async remove(path){values.delete(path);notify(path);},async update(path,patch){for(const [key,v] of Object.entries(patch))values.set(`${path}/${key}`,v);for(const key of Object.keys(patch))notify(`${path}/${key}`);}};
let nonce=0;const crypto={getRandomValues(bytes){bytes.fill(++nonce);return bytes;}};
const wait=async(pred,message)=>{for(let i=0;i<300;i++){if(pred())return;await new Promise(resolve=>setTimeout(resolve,10));}throw Error('Timed out: '+message);};
for(const [mode,count] of [['four-coop',3],['four-coop',4],['two-vs-two',4]]){
  const partyIds=ids.slice(0,count),partyPlayers=profiles.slice(0,count);
  const statuses={},views={},errors=[],rewards={};const make=id=>createFirebasePartyGame({db:{},auth:{currentUser:{uid:id}},sdk,partyId:mode+count,hostId:'alice',playerIds:partyIds,mode,...(id==='alice'?{players:partyPlayers,teams:[['alice','bob'],['cara','dan']]}:{}),crypto,onStatus:ready=>{statuses[id]=ready;},onState:state=>{if(state==='error')errors.push(id);},onSnapshot:s=>{views[id]=s;},onWaveRewards:mask=>{rewards[id]=mask;}});const instances=partyIds.map(make);
  try{for(const instance of instances)instance.start();await wait(()=>partyIds.every(id=>statuses[id]),`${mode} players ready`);assert.deepEqual(errors,[]);for(const id of partyIds)assert.equal(views[id].match.mode,mode);
    const result=await instances[0].command({type:'startWave'});assert.equal(result.waitingForPlayers,true);const requestId=result.requestId;for(let i=1;i<count;i++)assert.equal((await instances[i].command({type:'approveWave',requestId})).ok,true);
    await wait(()=>partyIds.every(id=>mode==='four-coop'?views[id]?.match.match.wave===1:views[id]?.match.lanes.every(lane=>lane.wave===1)),`${mode} wave started`);
    assert.equal((await instances[count-1].command({type:'build',pad:15,towerType:0})).ok,true);
    await wait(()=>mode==='four-coop'?views.alice?.match.match.towers.length===1:views.alice?.match.lanes[1].towers.length===1,`${mode} build replicated`);assert.deepEqual(errors,[]);assert.equal(rewards.alice,0);
    const vote=await instances[1].command({type:'requestSpeed'});assert.ok(vote.ok);await wait(()=>partyIds.every(id=>views[id]?.speedControl?.request?.id===vote.requestId),'speed vote visible');for(let i=0;i<count;i++)if(i!==1)assert.ok((await instances[i].command({type:'approveSpeed',requestId:vote.requestId})).ok);await wait(()=>partyIds.every(id=>views[id]?.speedControl?.speed===2),'all players approved 2x');assert.ok((await instances[0].command({type:'slowSpeed'})).ok);await wait(()=>partyIds.every(id=>views[id]?.speedControl?.speed===1),'slow to 1x');
    assert.equal(instances[1].setFocusPaused(true),false,'guest cannot pause the shared game');await wait(()=>views.alice.tick>0,'host continues after guest blur');
    assert.equal(instances[0].setFocusPaused(true),true);await wait(()=>partyIds.every(id=>statuses[id]===false&&views[id]?.hostPaused===true),'host pause is visible to every player');const pausedTick=views.alice.tick;await new Promise(resolve=>setTimeout(resolve,180));assert.equal(views.alice.tick,pausedTick,'simulation remains frozen while host is away');assert.equal((await instances[1].command({type:'move',x:700,y:400})).ok,false,'commands disabled while paused');assert.equal(instances[0].setFocusPaused(false),true);await wait(()=>partyIds.every(id=>statuses[id]&&views[id]?.hostPaused===false),'host return resumes play');
    await instances[count-1].stop();await wait(()=>statuses[partyIds[count-1]]===false,'guest disconnected');await wait(()=>mode==='four-coop'?statuses.alice===true:statuses.alice===false,`${mode} disconnect policy`);instances[count-1]=make(partyIds[count-1]);instances[count-1].start();await wait(()=>partyIds.every(id=>statuses[id]),`${mode} guest reconnected`);assert.deepEqual(errors,[]);
  }finally{await Promise.all(instances.map(instance=>instance.stop()));}
}
// Two-player co-op and versus also pause only for the host.
for(const mode of ['coop','versus']){
 const statuses={},views={},partyIds=ids.slice(0,2),clients=partyIds.map(id=>createFirebasePartyGame({db:{},auth:{currentUser:{uid:id}},sdk,partyId:'focus-'+mode,hostId:'alice',playerIds:partyIds,mode,...(id==='alice'?{players:profiles.slice(0,2)}:{}),crypto,onStatus:value=>statuses[id]=value,onSnapshot:value=>views[id]=value}));
 try{clients.forEach(client=>client.start());await wait(()=>statuses.alice&&statuses.bob,'two-player ready');const wave=await clients[0].command({type:'startWave'});assert.ok(wave.ok);await wait(()=>views.bob?.match?.pendingWave===1,'wave request');assert.ok((await clients[1].command({type:'approveWave',requestId:views.bob.match.waveRequestId})).ok);await wait(()=>views.bob?.match?.wave===1,'wave running');const speedVote=await clients[1].command({type:'requestSpeed'});assert.ok(speedVote.ok);assert.ok((await clients[0].command({type:'approveSpeed',requestId:speedVote.requestId})).ok);await wait(()=>views.bob?.speedControl?.speed===2,'two-player speed approved');assert.ok((await clients[1].command({type:'slowSpeed'})).ok);await wait(()=>views.bob?.speedControl?.speed===1,'two-player speed reset');assert.equal(clients[1].setFocusPaused(true),false);clients[0].setFocusPaused(true);await wait(()=>!statuses.alice&&!statuses.bob&&views.bob?.hostPaused,'host paused');const tick=views.bob.tick;await new Promise(resolve=>setTimeout(resolve,150));assert.equal(views.bob.tick,tick);clients[0].setFocusPaused(false);await wait(()=>statuses.alice&&statuses.bob&&views.bob?.hostPaused===false,'host resumed');}finally{await Promise.all(clients.map(client=>client.stop()));}
}
// A fatal corrupt packet must tear down presence immediately instead of leaving
// the failed guest appearing online (and a competitive game stuck waiting).
{
 const partyIds=ids.slice(0,2),states=[],statuses={};
 const host=createFirebasePartyGame({db:{},auth:{currentUser:{uid:'alice'}},sdk,partyId:'fatal-cleanup',hostId:'alice',playerIds:partyIds,mode:'versus',players:profiles.slice(0,2),crypto,onStatus:value=>statuses.alice=value});
 const guest=createFirebasePartyGame({db:{},auth:{currentUser:{uid:'bob'}},sdk,partyId:'fatal-cleanup',hostId:'alice',playerIds:partyIds,mode:'versus',crypto,onState:value=>states.push(value),onStatus:value=>statuses.bob=value});
 try{host.start();guest.start();await wait(()=>statuses.alice&&statuses.bob,'fatal test ready');
  assert.ok([...values.keys()].some(p=>p.startsWith('parties/fatal-cleanup/presence/bob/')));
  await sdk.set('parties/fatal-cleanup/views/bob','not-json');
  await wait(()=>states.includes('error')&&!statuses.alice,'fatal guest causes host to pause');
  await wait(()=>![...values.keys()].some(p=>p.startsWith('parties/fatal-cleanup/presence/bob/')),'fatal guest presence removed');
  assert.equal((await guest.command({type:'startWave'})).ok,false);await guest.stop();await guest.stop();
 }finally{await Promise.all([guest.stop(),host.stop()]);}
}
{
 const partyIds=ids.slice(0,2),states=[],statuses={};
 const host=createFirebasePartyGame({db:{},auth:{currentUser:{uid:'alice'}},sdk,partyId:'fatal-host',hostId:'alice',playerIds:partyIds,mode:'versus',players:profiles.slice(0,2),crypto,onState:value=>states.push(value),onStatus:value=>statuses.alice=value});
 const guest=createFirebasePartyGame({db:{},auth:{currentUser:{uid:'bob'}},sdk,partyId:'fatal-host',hostId:'alice',playerIds:partyIds,mode:'versus',crypto,onStatus:value=>statuses.bob=value});
 try{host.start();guest.start();await wait(()=>statuses.alice&&statuses.bob,'host failure test ready');await sdk.set('parties/fatal-host/inputs/bob','not-json');await wait(()=>states.includes('error')&&!statuses.bob,'host failure pauses guest');await wait(()=>![...values.keys()].some(p=>p.startsWith('parties/fatal-host/presence/alice/')),'failed host presence removed');assert.equal((await host.command({type:'startWave'})).ok,false);}
 finally{await Promise.all([guest.stop(),host.stop()]);}
}
// A syntactically valid view from the wrong host must not reach gameplay.
{
 const partyIds=ids.slice(0,2),states=[],statuses={};
 const host=createFirebasePartyGame({db:{},auth:{currentUser:{uid:'alice'}},sdk,partyId:'bad-roster',hostId:'alice',playerIds:partyIds,mode:'coop',players:profiles.slice(0,2),crypto,onStatus:value=>statuses.alice=value});
 const guest=createFirebasePartyGame({db:{},auth:{currentUser:{uid:'bob'}},sdk,partyId:'bad-roster',hostId:'alice',playerIds:partyIds,mode:'coop',crypto,onState:value=>states.push(value),onStatus:value=>statuses.bob=value});
 try{host.start();guest.start();await wait(()=>statuses.alice&&statuses.bob,'roster test ready');const path='parties/bad-roster/views/bob',view=JSON.parse(values.get(path));view.snapshot.match.hostId='mallory';await sdk.set(path,JSON.stringify(view));await wait(()=>states.includes('error'),'wrong host rejected');await wait(()=>![...values.keys()].some(p=>p.startsWith('parties/bad-roster/presence/bob/')),'invalid view client cleanup');}
 finally{await Promise.all([guest.stop(),host.stop()]);}
}
assert.throws(()=>createFirebasePartyGame({db:{},sdk,auth:{currentUser:{uid:'alice'}},partyId:'p',hostId:'alice',playerIds:ids,mode:'two-vs-two',players:profiles,teams:[['alice','bob'],['bob','dan']],crypto}),/Invalid teams/);
console.log('Four-player full game adapter tested with in-memory Firebase SDK; no database rules or real devices.');
