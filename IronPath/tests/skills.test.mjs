import {test} from 'node:test';
import {applyCommand, createPlayer} from '../core/match.mjs';
import {createMatch, stepMatch} from '../core/simulation.mjs';
import {DEFAULT_BUILD, MAX_CLASS_POINTS, SKILL_PATHS, encodeBuild, parseBuild, pointsLeft} from '../core/skills.mjs';
import {strict as assert} from 'node:assert';

test('V2 exclusive 6-class builds validate, abilities fire, and passives reach solo and co-op',async()=>{
  assert.equal(SKILL_PATHS.length,6);
  const player=(id,skills,level=10)=>createPlayer(id,{name:id,gender:'female',level,skills},100,130);
  assert.equal(encodeBuild(parseBuild('v2;recon;3;0;00000000000000',3)),'v2;none','overspending is ignored');
  assert.equal(encodeBuild(parseBuild('invalid',10)),'v2;none');
  assert.equal(pointsLeft(parseBuild('v2;medic;2;0;00000000000000',10),10),7);
  assert.equal(pointsLeft(parseBuild('v2;assault;3;1;11111111111111',25),25),0);
  assert.equal(MAX_CLASS_POINTS,17);

  // Exclusive class choice: Logistics solo/co-op supplies vs Medic bunker HP/repair
  const a=player('a','v2;logistics;1;0;00000000000000'),b=player('b','v2;medic;2;0;00000000000000');
  const state=createMatch([a,b]);
  assert.equal(state.hp,110); // Medic rank 2 adds +10 maxHp
  assert.equal(state.players.a.skills.logistics,1);
  assert.equal(state.players.a.skills.medic,0);
  assert.equal(applyCommand(state,'a',{type:'airstrike'}).ok,false,'no supply drops between waves');
  state.running=true;state.wave=1;state.spawnLeft=10;state.spawnTimer=100;
  assert.equal(applyCommand(state,'a',{type:'airstrike'}).ok,true);
  assert.equal(state.players.a.money,155);
  assert.equal(state.players.b.money,125);
  assert.equal(applyCommand(state,'a',{type:'airstrike'}).ok,false);
  assert.equal(applyCommand(state,'b',{type:'airstrike'}).ok,false,'cannot repair full bunker');
  state.hp=105;
  assert.equal(applyCommand(state,'b',{type:'airstrike'}).ok,true);
  assert.equal(state.hp,110);
  state.enemies.push({hp:0,reward:10,segment:1,x:0,y:130,speed:0});
  stepMatch(state);
  assert.equal(state.players.a.money,163,'logistics passive benefits only its owner (+1 per kill on 70% duo share)');
  assert.equal(state.players.b.money,132);

  // Engineer passive + overdrive
  const solo=createMatch([player('local','v2;engineer;1;0;00000000000000')]);
  solo.running=true;solo.wave=1;solo.spawnLeft=5;solo.spawnTimer=100;
  assert.equal(applyCommand(solo,'local',{type:'airstrike'}).ok,false);
  assert.equal(applyCommand(solo,'local',{type:'build',pad:0,towerType:0}).ok,true);
  assert.equal(applyCommand(solo,'local',{type:'airstrike'}).ok,true);
  assert.equal(solo.players.local.overdrive,10);
  solo.enemies.push({hp:1000,reward:10,segment:1,x:100,y:130,speed:0,kind:'infantry'});
  stepMatch(solo);
  assert.ok(solo.enemies[0].hp<984,'engineer passive and overdrive increase tower damage');

  // Recon active suppression
  const recon=createMatch([player('local','v2;recon;1;0;00000000000000')]);
  recon.running=true;recon.wave=1;recon.spawnLeft=3;recon.spawnTimer=100;
  recon.enemies.push({hp:1000,reward:10,segment:1,x:10,y:130,speed:30,kind:'infantry'});
  assert.equal(applyCommand(recon,'local',{type:'airstrike'}).ok,true);
  stepMatch(recon);
  assert.ok(Math.abs(recon.enemies[0].x-10.5)<.001);

  // Assault active strike
  const assault=createMatch([player('local','v2;assault;1;0;00000000000000')]);
  assault.enemies.push({hp:100,x:0,y:0});
  assert.equal(applyCommand(assault,'local',{type:'airstrike'}).ok,true);
  assert.equal(assault.enemies[0].hp,65);

  // 6th class: Air Defense main ability (Sky Sweep) + specialist variants + marked focus passive
  const air=createMatch([player('local','v2;airDefense;1;0;00000000000000')]);
  air.running=true;air.wave=1;
  air.enemies.push({hp:100,kind:'plane',baseKind:'plane'},{hp:100,kind:'infantry'});
  assert.equal(applyCommand(air,'local',{type:'airstrike'}).ok,true);
  assert.equal(air.enemies[0].hp,55,'Sky Sweep deals 45 flak damage to aircraft');
  assert.equal(air.enemies[1].hp,80,'Sky Sweep deals 20 shrapnel damage to ground');
  assert.equal(air.enemies[0].marked,6,'Sky Sweep marks targets');
  assert.equal(air.enemies[0].markedByAirDefense,true,'marks originate from Air Defense');

  // Level 1 starts without a chosen class or active ability
  const novice=createMatch([player('local','v2;none',1)]);novice.enemies.push({hp:100});
  assert.equal(novice.players.local.skills.active,null);
  assert.equal(applyCommand(novice,'local',{type:'airstrike'}).ok,false);
  assert.equal(parseBuild('v2;assault;1;0;00000000000000',2).active,'assault');

  // All 12 class specialist abilities require rank 2, node slot unlocked, and cannot overspend
  const builds=[
    'v2;assault;2;1;10000000000000','v2;assault;2;2;01000000000000',
    'v2;engineer;2;1;10000000000000','v2;engineer;2;2;01000000000000',
    'v2;logistics;2;1;10000000000000','v2;logistics;2;2;01000000000000',
    'v2;medic;2;1;10000000000000','v2;medic;2;2;01000000000000',
    'v2;recon;2;1;10000000000000','v2;recon;2;2;01000000000000',
    'v2;airDefense;2;1;10000000000000','v2;airDefense;2;2;01000000000000',
  ];
  for(const build of builds){
    assert.equal(encodeBuild(parseBuild(build,4)),build);
    assert.equal(parseBuild(build,3).active,null,'3-point specialist requires level 4');
  }
  assert.equal(parseBuild('v2;assault;2;2;10000000000000',4).active,null,'unowned specialist rejected');
  assert.equal(parseBuild('v2;assault;1;1;10000000000000',4).active,null,'specialist requires rank 2');
  assert.equal(parseBuild('v2;assault;2;1;10000000000000;injection',4).active,null);
  for(const [i,build] of builds.entries()){
    const m=createMatch([player('local',build,4)]);m.running=true;m.wave=1;m.hp=70;
    m.enemies=[{hp:100,kind:'plane',baseKind:'plane'},{hp:200,kind:'infantry'}];
    m.towers=[{ownerId:'local'}];
    assert.equal(applyCommand(m,'local',{type:'airstrike'}).ok,true,build);
    assert.equal(applyCommand(m,'local',{type:'airstrike'}).ok,false,'cooldown');
    if(i===0){assert.equal(m.enemies[0].hp,75);assert.equal(m.suppression,3);}
    if(i===1){assert.equal(m.enemies[0].hp,100);assert.equal(m.enemies[1].hp,120);}
    if(i===2||i===3){assert.equal(m.players.local.overdrive,i===2?15:6);assert.equal(m.players.local.overdriveFactor,i===2?1.35:1.8);}
    if(i===4){assert.equal(m.money,170);assert.equal(m.players.local.cooldown,38);}
    if(i===5){assert.equal(m.money,160);assert.equal(m.hp,76);}
    if(i===6)assert.equal(m.hp,95);
    if(i===7){assert.equal(m.hp,90);assert.equal(m.money,137);}
    if(i===8)assert.equal(m.suppression,12);
    if(i===9){assert.equal(m.suppression,7);assert.equal(m.enemies[0].hp,80);}
    if(i===10){assert.equal(m.enemies[0].hp,75);assert.equal(m.enemies[0].marked,8);assert.equal(m.enemies[0].markedByAirDefense,true);}
    if(i===11){assert.equal(m.enemies[0].hp,40);assert.equal(m.enemies[1].hp,180);assert.equal(m.enemies[0].pinned,3);assert.equal(m.players.local.cooldown,36);}
  }
});

test('V1 legacy builds reset cleanly to v2;none with legacyHadSpent recorded without crashing',()=>{
  const spent=parseBuild('2,0,0,0,0;assault',10);
  assert.equal(encodeBuild(spent),'v2;none');
  assert.equal(spent.legacy,true);
  assert.equal(spent.legacyHadSpent,true);
  assert.equal(pointsLeft(spent,10),9,'all earned points are refunded on reset');

  const unspent=parseBuild('0,0,0,0,0;assault',10);
  assert.equal(encodeBuild(unspent),'v2;none');
  assert.equal(unspent.legacy,true);
  assert.equal(unspent.legacyHadSpent,false);
});

test('missing or unchosen build falls back to the V2 default loadout',()=>{
  assert.equal(DEFAULT_BUILD,'v2;none');
  assert.equal(encodeBuild(parseBuild(undefined,1)),DEFAULT_BUILD);
  assert.equal(parseBuild(undefined,1).active,null);
  assert.equal(parseBuild(undefined,1).classId,null);
});
