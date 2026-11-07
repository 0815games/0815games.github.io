import {strict as assert} from 'node:assert';
import {createMatch,stepMatch,COOP_ENEMY_HEALTH,COOP_REWARD_RATE} from '../simulation.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {makeEnemy} from '../combat.mjs';
import {createPartyHost} from '../party-host.mjs';
const p=id=>createPlayer(id,{name:id,gender:'female',level:1});
const solo=createMatch([p('solo')]),coop=createMatch([p('host'),p('guest')]);
assert.equal(COOP_REWARD_RATE,.7);assert.equal(COOP_ENEMY_HEALTH,1.5);
for(const [s,id] of [[solo,'solo'],[coop,'host']]){assert.equal(applyCommand(s,id,{type:'startWave'}).ok,true);s.spawnTimer=0;stepMatch(s);}
assert.equal(solo.enemies[0].maxHp,makeEnemy('infantry',1).maxHp);
assert.equal(coop.enemies[0].maxHp,Math.round(solo.enemies[0].maxHp*1.5));
// Already spawned enemies do not change when presence changes. New spawns do.
const first=coop.enemies[0];coop.players.guest.active=false;coop.spawnTimer=0;stepMatch(coop);
assert.equal(first.maxHp,Math.round(makeEnemy('infantry',1).maxHp*1.5));assert.equal(coop.enemies[1].maxHp,makeEnemy('infantry',1).maxHp);
coop.players.guest.active=true;coop.spawnTimer=0;stepMatch(coop);assert.equal(coop.enemies[2].maxHp,first.maxHp);
// Five kills award each player five reduced kill rewards plus a reduced cache.
const rewards=createMatch([p('host'),p('guest')]);rewards.running=true;rewards.wave=1;rewards.spawnLeft=1;rewards.spawnTimer=100;
rewards.enemies=Array.from({length:5},()=>({hp:0,reward:8,speed:0,segment:1,x:0,y:130}));
const events=stepMatch(rewards);
// Two soldiers earn 70% each: five kills of an 8-supply enemy pay 5 each
// (floor of 5.6) and the cache pays 10 (floor of 10.5).
assert.equal(rewards.players.host.money,125+5*5+10);assert.equal(rewards.players.guest.money,125+5*5+10);assert.equal(events.find(e=>e.type==='lootDrop').supplies,10);
// Both active players retain wave credit; a guest away at completion does not.
rewards.enemies=[];rewards.spawnLeft=0;stepMatch(rewards);assert.equal(rewards.players.host.completedWaveMask,1);assert.equal(rewards.players.guest.completedWaveMask,1);
const absent=createMatch([p('host'),p('guest')]);absent.running=true;absent.wave=1;absent.players.guest.active=false;absent.spawnLeft=0;stepMatch(absent);assert.equal(absent.players.host.completedWaveMask,1);assert.equal(absent.players.guest.completedWaveMask,0);assert.equal(absent.players.host.money,145);assert.equal(absent.players.guest.money,125);
// Host-driven co-op continues stepping while the original guest is away.
const reconnect=createMatch([p('host'),p('guest')]);const host=createPartyHost(reconnect,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);host.setPresence('guest',false);const tick=host.advance();assert.ok(tick);assert.equal(host.snapshotFor('host').match.players.guest.active,false);host.setPresence('guest',true);assert.equal(host.snapshotFor('host').match.players.guest.active,true);
console.log('Co-op balance, solo parity, wave credit and reconnect checks passed.');
