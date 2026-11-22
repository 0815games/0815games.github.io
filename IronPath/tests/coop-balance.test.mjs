import {strict as assert} from 'node:assert';
import {
  createMatch,stepMatch,
  COOP_ENEMY_HEALTH,COOP_REWARD_RATE,
  COOP_THREE_ENEMY_HEALTH,COOP_THREE_REWARD_RATE,
  COOP_FOUR_ENEMY_HEALTH,COOP_FOUR_REWARD_RATE,
  MULTIPLAYER_SECTOR_START_WAVE
} from '../core/simulation.mjs';
import {createPlayer,applyCommand} from '../core/match.mjs';
import {makeEnemy} from '../core/combat.mjs';
import {createPartyHost} from '../core/party-host.mjs';
const p=id=>createPlayer(id,{name:id,gender:'female',level:1});
const solo=createMatch([p('solo')]),coop=createMatch([p('host'),p('guest')]);
assert.equal(COOP_REWARD_RATE,.7);assert.equal(COOP_ENEMY_HEALTH,1.5);
assert.equal(COOP_THREE_REWARD_RATE,.6);assert.equal(COOP_THREE_ENEMY_HEALTH,1.75);
assert.equal(COOP_FOUR_REWARD_RATE,.55);assert.equal(COOP_FOUR_ENEMY_HEALTH,2);
assert.equal(MULTIPLAYER_SECTOR_START_WAVE,11);
for(const [s,id] of [[solo,'solo'],[coop,'host']]){assert.equal(applyCommand(s,id,{type:'startWave'}).ok,true);s.spawnTimer=0;stepMatch(s);}
assert.equal(solo.enemies[0].maxHp,makeEnemy('infantry',1).maxHp);
assert.equal(coop.enemies[0].maxHp,Math.round(solo.enemies[0].maxHp*1.5));
// Three and four active players scale HP (1.75x / 2x) and individual supply share (0.60 / 0.55) dynamically.
const trio=createMatch([p('p1'),p('p2'),p('p3')],'four-front');
const squad=createMatch([p('p1'),p('p2'),p('p3'),p('p4')],'four-front');
assert.equal(applyCommand(trio,'p1',{type:'startWave'}).ok,true);trio.spawnTimer=0;stepMatch(trio);
assert.equal(trio.enemies[0].maxHp,Math.round(makeEnemy('infantry',1).maxHp*COOP_THREE_ENEMY_HEALTH));
trio.players.p3.active=false;trio.spawnTimer=0;stepMatch(trio);
assert.equal(trio.enemies[1].maxHp,Math.round(makeEnemy('infantry',1).maxHp*COOP_ENEMY_HEALTH),'disconnect drops trio HP scaling back to duo');
trio.players.p3.active=true;
assert.equal(applyCommand(squad,'p1',{type:'startWave'}).ok,true);squad.spawnTimer=0;stepMatch(squad);
assert.equal(squad.enemies[0].maxHp,Math.round(makeEnemy('infantry',1).maxHp*COOP_FOUR_ENEMY_HEALTH));
for(const [count,rate,match] of [[3,COOP_THREE_REWARD_RATE,trio],[4,COOP_FOUR_REWARD_RATE,squad]]){
  match.running=true;match.wave=1;match.spawnLeft=1;match.spawnTimer=100;
  match.enemies=[{hp:0,reward:20,speed:0,segment:1,x:0,y:130}];
  const startMoney=match.players.p1.money;
  stepMatch(match);
  assert.equal(match.players.p1.money-startMoney,Math.floor(20*rate),`${count}p active kill reward pays ${rate*100}%`);
  assert.equal(match.players.p3.money-startMoney,Math.floor(20*rate));
}
// Sector 2+ maps keep sector 1 enemy scaling for waves 1-10 in multiplayer while solo endless keeps full map sector from wave 1.
const secSolo=createMatch([p('s')],'g3-0b9f45231');
const secDuo=createMatch([p('h'),p('g')],'g3-0b9f45231');secDuo.hostId='h';
assert.equal(applyCommand(secSolo,'s',{type:'startWave'}).ok,true);secSolo.spawnTimer=0;stepMatch(secSolo);
const duoVote=applyCommand(secDuo,'h',{type:'startWave'});assert.equal(duoVote.ok,true);
assert.equal(applyCommand(secDuo,'g',{type:'approveWave',requestId:duoVote.requestId}).ok,true);
secDuo.spawnTimer=0;stepMatch(secDuo);
assert.equal(secSolo.enemies[0].maxHp,makeEnemy('infantry',1,2).maxHp,'solo endless on sector 2 uses sector 2 at wave 1');
assert.equal(secDuo.enemies[0].maxHp,Math.round(makeEnemy('infantry',1,1).maxHp*COOP_ENEMY_HEALTH),'multiplayer uses sector 1 scaling before wave 11');
secDuo.wave=MULTIPLAYER_SECTOR_START_WAVE;secDuo.spawnTimer=0;stepMatch(secDuo);
assert.equal(secDuo.enemies[1].maxHp,Math.round(makeEnemy(secDuo.enemies[1].kind,MULTIPLAYER_SECTOR_START_WAVE,2).maxHp*COOP_ENEMY_HEALTH),'multiplayer steps up to map sector at wave 11');
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
