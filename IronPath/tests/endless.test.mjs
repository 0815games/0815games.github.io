import {strict as assert} from 'node:assert';
import {waveFormation,bossForWave,makeEnemy,ENEMY_TYPES} from '../combat.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createPartyHost} from '../party-host.mjs';
import {perkOffers,RUN_PERKS} from '../run-perks.mjs';
const player=id=>createPlayer(id,{name:id,gender:'female',level:1});
for(const wave of [5,10,15,20,25,100,1000]){
 const f=waveFormation(wave),boss=bossForWave(wave);assert.equal(f.at(-1),boss.kind);assert.ok(ENEMY_TYPES[boss.kind]);const e=makeEnemy(boss.kind,wave);assert.equal(e.boss,boss.kind);assert.ok(e.hp>makeEnemy(boss.base,wave).hp);assert.ok(f.length<=73);
}
assert.notEqual(bossForWave(5).kind,bossForWave(10).kind);assert.equal(bossForWave(21),null);assert.deepEqual(waveFormation(1000),waveFormation(1000));assert.throws(()=>waveFormation(0));
assert.equal(new Set(perkOffers('g2-12345678',5)).size,3);assert.deepEqual(perkOffers('g2-12345678',5),perkOffers('g2-12345678',5));
const s=createMatch([player('solo')],'g2-12345678');
for(const wave of [5,10,15,20,21,25,40,41,100]){
 s.wave=wave;s.running=true;s.spawnLeft=0;s.enemies=[];const events=stepMatch(s);assert.equal(events[0].wave,wave);assert.equal(s.ended,false);
 if(wave%5===0){assert.equal(s.pendingPerk,wave);assert.equal(applyCommand(s,'solo',{type:'startWave'}).ok,false);assert.equal(applyCommand(s,'solo',{type:'choosePerk',index:3}).ok,false);assert.equal(applyCommand(s,'solo',{type:'choosePerk',index:1}).ok,true);assert.equal(applyCommand(s,'solo',{type:'choosePerk',index:1}).ok,false);}
 assert.equal(applyCommand(s,'solo',{type:'startWave'}).ok,true);assert.equal(s.wave,wave+1);
}
const state=createMatch([player('host'),player('guest')]);state.wave=21;state.running=true;state.spawnLeft=0;state.players.guest.active=false;stepMatch(state);assert.equal(state.players.host.completedWaveBlocks[1],1);assert.equal(state.players.guest.completedWaveBlocks,undefined);state.wave=22;state.running=true;state.players.guest.active=true;stepMatch(state);assert.equal(state.players.host.completedWaveBlocks[1],3);assert.equal(state.players.guest.completedWaveBlocks[1],2);
const match=createMatch([player('host'),player('guest')],'g2-12345678');match.pendingPerk=5;const host=createPartyHost(match,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);assert.equal(host.receive('guest',{version:1,seq:1,command:{type:'choosePerk',index:1}}).status,'queued');host.advance();const view=host.snapshotFor('guest').match;assert.equal(view.pendingPerk,0);assert.equal(view.runPerks[RUN_PERKS[perkOffers(match.mapId,5)[1]].key],1);host.setPresence('guest',false);host.advance();host.setPresence('guest',true);assert.deepEqual(host.snapshotFor('guest').match.runPerks,view.runPerks);
// Spawn the named boss through the real wave loop.
const spawn=createMatch([player('solo')]);spawn.wave=4;assert.ok(applyCommand(spawn,'solo',{type:'startWave'}).ok);spawn.spawnIndex=waveFormation(5).length-1;spawn.spawnLeft=1;spawn.spawnTimer=0;stepMatch(spawn);assert.equal(spawn.enemies[0].boss,'bossIronclad');
console.log('Bosses, endless waves, shared upgrades and reconnect passed.');
// Distinct boss abilities and selected perks affect the shared simulation.
{
 const m=createMatch([player('solo')]);m.wave=15;m.running=true;m.spawnLeft=1;m.spawnTimer=100;m.enemies=[{...makeEnemy('bossJuggernaut',15),x:100,y:130,segment:1,speed:0}];m.enemies[0].hp-=100;const hp=m.enemies[0].hp;stepMatch(m);assert.ok(m.enemies[0].hp>hp,'juggernaut repairs itself');
}
{
 const m=createMatch([player('solo')]);m.wave=20;m.running=true;m.spawnLeft=1;m.spawnTimer=100;m.enemies=[{...makeEnemy('bossCommander',20),x:100,y:130,segment:1,speed:0},{...makeEnemy('infantry',20),x:110,y:130,segment:1}];const x=m.enemies[1].x;stepMatch(m);assert.ok(Math.abs(m.enemies[1].x-x-53/30*1.25)<1e-8,'commander boosts nearby ground troops');
}
{
 const m=createMatch([player('solo')]);m.wave=5;m.running=true;m.spawnLeft=1;m.spawnTimer=100;m.runPerks={damage:1};m.towers=[{type:0,pad:0,level:1,timer:0,ownerId:'solo'}];m.enemies=[{...makeEnemy('infantry',1),x:105,y:210,segment:1,speed:0,hp:100,maxHp:100}];stepMatch(m);assert.ok(Math.abs(m.enemies[0].hp-(100-10*1.25*1.1))<1e-8,'field ordnance improves real tower damage');
}
