import {strict as assert} from 'node:assert';
import {createPlayer} from '../match.mjs';
import {createFourCoop,setFourPresence,stepFour} from '../four-modes.mjs';
import {createCoopRewardQueue} from '../coop-rewards.mjs';
const ids=['alice','bob','cara','dan'],partyId='a1'.repeat(16),profiles=ids.map(id=>createPlayer(id,{name:id,gender:'female'})),match=createFourCoop(profiles,'alice');
function clearWave(wave){match.match.wave=wave;match.match.running=true;match.match.spawnLeft=0;match.match.enemies=[];stepFour(match);}
clearWave(1);setFourPresence(match,'dan',false);clearWave(2);setFourPresence(match,'dan',true);clearWave(3);
assert.equal(match.match.players.alice.completedWaveMask,7);assert.equal(match.match.players.dan.completedWaveMask,5);
const accounts=Object.fromEntries(ids.map(id=>[id,{name:id,gender:'female',xp:0}]));
const sdk={ref:(_db,path)=>path,onValue(path,cb){const id=path.split('/').at(-1);cb({val:()=>structuredClone(accounts[id])});return()=>{};},async runTransaction(path,fn){const id=path.split('/').at(-1),next=fn(structuredClone(accounts[id]));if(next)accounts[id]=next;return {committed:!!next,snapshot:{val:()=>structuredClone(accounts[id])}};}};
const queues=ids.map(id=>createCoopRewardQueue({db:{},auth:{currentUser:{uid:id}},sdk,partyId}));for(let i=0;i<4;i++)queues[i].observe(match.match.players[ids[i]].completedWaveMask);await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(accounts.alice.xp,120);assert.equal(accounts.bob.xp,120);assert.equal(accounts.cara.xp,120);assert.equal(accounts.dan.xp,80);assert.equal(accounts.dan.armory.owned,0,'absent wave 2 cannot grant equipment');assert.equal(accounts.alice.armory.owned,1);
const rejoin=createCoopRewardQueue({db:{},auth:{currentUser:{uid:'alice'}},sdk,partyId});rejoin.observe(7);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(accounts.alice.xp,120,'reconnecting does not pay waves twice');
for(const q of queues)q.close();rejoin.close();console.log('Four-player personal participation and idempotent reward receipt tests passed.');
