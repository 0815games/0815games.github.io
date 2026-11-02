import {strict as assert} from 'node:assert';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPartyHost} from '../party-host.mjs';
const p=id=>createPlayer(id,{name:id,gender:'female'});
for(const wave of [0,1,5,21]){
 const s=createMatch([p('solo')]);s.wave=wave;s.running=true;s.spawnLeft=5;s.pendingPerk=wave===5?5:0;s.hp=70;
 assert.equal(applyCommand(s,'solo',{type:'endRun'}).ok,true);assert.equal(s.ended,true);assert.equal(s.endReason,'retired');assert.equal(s.running,false);assert.equal(s.pendingPerk,0);assert.equal(s.hp,70);assert.equal(s.spawnLeft,0);assert.deepEqual(stepMatch(s),[],'ending never completes the unfinished wave');assert.equal(applyCommand(s,'solo',{type:'startWave'}).ok,false);
}
const s=createMatch([p('host'),p('guest')]);s.wave=21;s.running=true;s.spawnLeft=5;s.players.host.completedWaveMask=3;s.players.guest.completedWaveMask=1;
const host=createPartyHost(s,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);
assert.equal(host.receive('guest',{version:1,seq:1,command:{type:'endRun'}}).status,'queued');const update=host.advance();assert.equal(update.commands[0].result.ok,true);assert.deepEqual(update.events,[]);
for(const id of ['host','guest']){const view=host.snapshotFor(id).match;assert.equal(view.ended,true);assert.equal(view.endReason,'retired');assert.equal(view.players.host.completedWaveMask,3);assert.equal(view.players.guest.completedWaveMask,1);assert.equal(view.players.host.completedWaveBlocks,undefined);}
host.setPresence('guest',false);host.advance();host.setPresence('guest',true);assert.equal(host.snapshotFor('guest').match.endReason,'retired');
console.log('End run preserves completed rewards and synchronizes for both players.');
