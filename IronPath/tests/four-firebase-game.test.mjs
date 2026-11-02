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
    await instances[count-1].stop();await wait(()=>statuses[partyIds[count-1]]===false,'guest disconnected');await wait(()=>mode==='four-coop'?statuses.alice===true:statuses.alice===false,`${mode} disconnect policy`);instances[count-1]=make(partyIds[count-1]);instances[count-1].start();await wait(()=>partyIds.every(id=>statuses[id]),`${mode} guest reconnected`);assert.deepEqual(errors,[]);
  }finally{await Promise.all(instances.map(instance=>instance.stop()));}
}
assert.throws(()=>createFirebasePartyGame({db:{},sdk,auth:{currentUser:{uid:'alice'}},partyId:'p',hostId:'alice',playerIds:ids,mode:'two-vs-two',players:profiles,teams:[['alice','bob'],['bob','dan']],crypto}),/Invalid teams/);
console.log('Four-player full game adapter tested with in-memory Firebase SDK; no database rules or real devices.');
