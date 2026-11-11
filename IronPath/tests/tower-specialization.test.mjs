// Tower specialization kits (Punkt 7, TOWER-SPECIALIZATION-PLAN.md): ranks
// derive from tower.level, mechanics ride the simulation's own vocabulary.
// Every kit is driven through the REAL stepMatch - no mocks of the engine.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {getMap} from '../maps.mjs';
import {createPlayer,applyCommand,TOWER_COSTS} from '../match.mjs';
import {specializationRank,towerKit,upgradeCostFor} from '../tower-specialization.mjs';

function field({type=0,branch=null,level=3,enemies=[],players}={}){
  const state=createMatch(players||[createPlayer('local',{name:'A',gender:'female'})],'road');
  state.running=true;state.wave=1;
  const tower={pad:0,type,level,branch,ownerId:'local',timer:0,shotCount:0};
  if(branch!==null)state.towers=[tower];
  state.enemies=enemies;
  return {state,tower};
}
const grunt=(x,y,kind='infantry')=>({x,y,hp:1000,maxHp:1000,kind,segment:3,speed:30,reward:8,road:0});
const PAD=getMap('road').pads[0]; // (105,210): MG 125px and sniper 210px both reach PAD+60
const near=(kind='infantry')=>grunt(PAD.x+60,PAD.y,kind);

test('ranks derive from the level ladder and survive prestige levels',()=>{
  assert.equal(specializationRank({level:2,branch:0}),0,'no kit before the choice');
  assert.equal(specializationRank({level:3,branch:1}),1);
  assert.equal(specializationRank({level:4,branch:1}),2);
  assert.equal(specializationRank({level:5,branch:1}),3);
  assert.equal(specializationRank({level:9,branch:1}),3,'prestige keeps rank III');
  assert.equal(specializationRank({level:4}),0,'no branch, no kit');
  assert.deepEqual(towerKit({level:4,type:2,branch:1}),{type:2,branch:1,rank:2});
});

test('Twin MG II pins ground enemies for one second, never planes',()=>{
  const {state,tower}=field({type:0,branch:0,level:4,enemies:[grunt(90,90)]});
  tower.timer=0;stepMatch(state);
  assert.ok(state.enemies[0].pinned>0&&state.enemies[0].pinned<=1,'pinned by the hit');
  const fly=field({type:0,branch:0,level:4,enemies:[grunt(90,90,'plane')]});
  fly.tower.timer=0;stepMatch(fly.state);
  assert.ok(!fly.state.enemies[0].pinned,'aircraft fly on');
});

test('Heavy MG II pins for two seconds and III makes pinned take +10% from all towers',()=>{
  const {state,tower}=field({type:0,branch:1,level:4,enemies:[grunt(90,90)]});
  tower.timer=0;stepMatch(state);
  assert.ok(state.enemies[0].pinned>1&&state.enemies[0].pinned<=2,'two-second pin');
  // The aura: a plain MG shooting a pinned enemy deals more with a Heavy MG III on the field.
  const base=field({type:0,branch:0,level:4,enemies:[grunt(90,90)]});
  base.state.enemies[0].pinned=1;base.tower.timer=0;stepMatch(base.state);
  const plain=1000-base.state.enemies[0].hp;
  const aura=field({type:0,branch:0,level:4,enemies:[grunt(90,90)]});
  aura.state.towers.push({pad:1,type:0,level:5,branch:1,ownerId:'local',timer:999,shotCount:0});
  aura.state.enemies[0].pinned=1;aura.tower.timer=0;stepMatch(aura.state);
  const boosted=1000-aura.state.enemies[0].hp;
  assert.ok(boosted>plain*1.05,'the interdiction aura boosts other towers: '+plain+' -> '+boosted);
});

test('Rapid Cannon II staggers tanks and Siege Cannon II marks them for the team',()=>{
  const rapid=field({type:1,branch:0,level:4,enemies:[grunt(90,90,'tank')]});
  rapid.tower.timer=0;stepMatch(rapid.state);
  assert.ok(rapid.state.enemies[0].pinned>0,'tank staggered');
  const siege=field({type:1,branch:1,level:4,enemies:[grunt(90,90,'tank')]});
  siege.tower.timer=0;stepMatch(siege.state);
  assert.ok(siege.state.enemies[0].marked>0,'tank marked');
  // Marked tanks take +20% from ALL towers while a Siege Cannon II watches.
  const plain=field({type:0,branch:0,level:4,enemies:[grunt(90,90,'tank')]});
  plain.tower.timer=0;stepMatch(plain.state);
  const without=1000-plain.state.enemies[0].hp;
  const boosted=field({type:0,branch:0,level:4,enemies:[grunt(90,90,'tank')]});
  boosted.state.towers.push({pad:1,type:1,level:4,branch:1,ownerId:'local',timer:999,shotCount:0});
  boosted.state.enemies[0].marked=3;boosted.tower.timer=0;stepMatch(boosted.state);
  const withMark=1000-boosted.state.enemies[0].hp;
  assert.ok(withMark>without*1.1,'counter-battery pays out: '+without+' -> '+withMark);
});

test('Twin Flak II chains onto a nearby enemy; III reaches further only for planes',()=>{
  const {state,tower}=field({type:2,branch:0,level:4,enemies:[grunt(90,90),grunt(130,95)]});
  tower.timer=0;stepMatch(state);
  assert.ok(state.enemies[1].hp<1000,'the chain hit landed');
  const {towerRangeFactor}=awaitImport();
  assert.equal(towerRangeFactor({type:2,level:5,branch:0},{kind:'plane'}),1.15);
  assert.equal(towerRangeFactor({type:2,level:5,branch:0},{kind:'tank'}),1);
});

test('the spotting station marks for rifle criticals and ignores clouds at III',()=>{
  const {towerIgnoresClouds}=awaitImport();
  assert.equal(towerIgnoresClouds({type:2,level:5,branch:1}),true);
  assert.equal(towerIgnoresClouds({type:2,level:4,branch:1}),false);
  const spot=field({type:2,branch:1,level:4,enemies:[grunt(90,90)]});
  spot.tower.timer=0;stepMatch(spot.state);
  assert.ok(spot.state.enemies[0].marked>0,'target marked');
});

test('Marksman II criticizes every third shot, harder against pinned at III',()=>{
  const {state,tower}=field({type:3,branch:0,level:4,enemies:[near()]});
  // Sniper range is 210: park the enemy in range and fire three shots.
  const damages=[];
  for(let shot=1;shot<=3;shot++){tower.timer=0;tower.shotCount=shot-1;stepMatch(state);damages.push(1000-state.enemies[0].hp);state.enemies[0].hp=1000;}
  assert.ok(damages[2]>damages[0]*1.3,'third shot criticizes: '+damages.join('/'));
  const {towerDamageBonus}=awaitImport();
  assert.ok(towerDamageBonus({towers:[],runPerks:{}},{type:3,branch:0,level:5,shotCount:3},{pinned:1})>towerDamageBonus({towers:[],runPerks:{}},{type:3,branch:0,level:5,shotCount:3},{}),'rank III punishes pinned');
});

test('Anti-armor Rifle III stacks consecutive hits on the same tank up to +40%',()=>{
  const {state,tower}=field({type:3,branch:1,level:5,enemies:[near('tank')]});
  const damages=[];
  for(let shot=1;shot<=6;shot++){tower.timer=0;tower.shotCount=shot-1;stepMatch(state);damages.push(1000-state.enemies[0].hp);state.enemies[0].hp=1000;}
  assert.ok(damages[5]>damages[0]*1.2,'the streak stacks: '+damages.map(d=>Math.round(d)).join('/'));
  assert.ok(damages[5]<=damages[0]*1.45,'and caps at +40%');
});

test('Veteran Kit II fires faster near its hero and III discounts its upgrades',()=>{
  const {state,tower}=field({type:0,branch:2,level:4,enemies:[grunt(90,90)]});
  const hero=state.players.local;
  hero.x=PAD.x;hero.y=PAD.y;
  tower.timer=0;stepMatch(state);
  const nearInterval=tower.timer;
  hero.x=PAD.x+400;hero.y=PAD.y+400;
  tower.timer=0;stepMatch(state);
  const farInterval=tower.timer;
  assert.ok(nearInterval<farInterval,'commanded crew fires faster near the hero');
  assert.equal(upgradeCostFor({type:0,level:5,branch:2},300),255,'rank III discount');
  assert.equal(upgradeCostFor({type:0,level:5,branch:0},300),300,'other kits pay full price');
});

test('Boss Hunter II punches through the shield phase and III pays a bounty',()=>{
  const {towerDamageBonus}=awaitImport();
  const shielded={boss:'bossIronclad',kind:'tank',hp:1,bossClock:9};
  const factor=towerDamageBonus({towers:[]},{type:1,level:4,branch:3,shotCount:1},shielded);
  assert.ok(factor>=1.25,'shield phase counter');
  const {state,tower}=field({type:1,branch:3,level:5,enemies:[]});
  const boss={boss:'bossIronclad',kind:'tank',x:PAD.x+60,y:PAD.y,hp:1,maxHp:1000,segment:3,speed:10,reward:50,road:0,bossClock:0};
  state.enemies=[boss];tower.timer=0;
  let events=[];
  // Spy on the event array by stepping once and checking the reward landed.
  const before=state.money;
  stepMatch(state);
  assert.ok(boss.hp<=0,'the boss died');
  assert.ok(state.money>=before+25,'the bounty was paid: '+before+' -> '+state.money);
});

test('the kit data, UI and wiring are pinned',()=>{
  const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
  assert.match(game,/RANK II at level 4: \{rank2\}\. RANK III at level 5: \{rank3\}\./,'the branch sheet shows the rank track');
  assert.match(game,/· Rank \{rank\}/,'the tower card shows the rank');
  assert.match(game,/Then RANK \{rank\}: \{mechanic\}/,'the upgrade summary names the next rank');
  assert.match(game,/Trophy gun! The boss kill pays \+25 supplies\./,'the bounty notice is wired');
  assert.match(game,/rank2:'Suppression nest/,'every kit carries its rank mechanics');
  const sim=readFileSync(new URL('../simulation.mjs',import.meta.url),'utf8');
  assert.match(sim,/applyHitEffects\(state,tower,target,dealt,events,rewardTeam\)/,'the simulation applies hit effects');
  assert.match(sim,/towerDamageBonus\(state,tower,target\)/,'kit damage rides the shot');
  assert.match(sim,/\*towerIntervalFactor\(state,tower,p\)/,'kit fire rate rides the timer');
  const match=readFileSync(new URL('../match.mjs',import.meta.url),'utf8');
  assert.match(match,/upgradeCostFor\(tower,upgradeCost\(tower\.level\)\)/,'the upgrade price honors the Veteran discount');
  const art=readFileSync(new URL('../cartoon-art.mjs',import.meta.url),'utf8');
  assert.match(art,/specializationRank\(tower\)/,'the canvas draws rank chevrons');
  const de=readFileSync(new URL('../localization-towers-de.mjs',import.meta.url),'utf8');
  assert.match(de,/RANG II ab Stufe 4/,'the rank track is German');
});

// The ESM helpers under test are imported once, lazily, for the assertion
// sections that call pure functions directly.
function awaitImport(){
  return cached;
}
import * as cached from '../tower-specialization.mjs';
