import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOWER_CLASS_PATHS,
  classPathConfig,
  classTierSpec,
  classPathCost,
  classPathInvested,
  classUpgradeState,
  canUpgradeClassPath,
  classTowerRangeFactor,
  classTowerIntervalFactor,
  classTowerIgnoresClouds,
  classTowerDamageFactor,
  applyClassTowerHitEffects
} from '../tower-class-paths.mjs';
import {createPlayer,applyCommand,advanceSector,getSupplies,towerRefund,TOWER_COSTS} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createHost} from '../protocol.mjs';

test('all six classes define two tower refinement tiers gated cleanly by ownership and class rank',()=>{
  for(const classId of ['assault','engineer','logistics','medic','recon','airDefense']){
    const cfg=classPathConfig(classId);
    assert.ok(cfg,`${classId} class tower path exists`);
    assert.equal(cfg.tiers.length,2);
    assert.ok(cfg.tiers[0].cost.length===4&&cfg.tiers[1].cost.length===4);
  }

  const pNoClass=createPlayer('p1',{name:'P1',gender:'male',level:10,skills:'v2;none',loadout:'0,0,0'},100,100);
  const pRank1=createPlayer('p1',{name:'P1',gender:'male',level:10,skills:'v2;assault;1;0;00000000000000',loadout:'0,0,0'},100,100);
  const pRank2=createPlayer('p1',{name:'P1',gender:'male',level:10,skills:'v2;assault;2;0;00000000000000',loadout:'0,0,0'},100,100);
  const pRank3=createPlayer('p1',{name:'P1',gender:'male',level:10,skills:'v2;assault;3;0;00000000000000',loadout:'0,0,0'},100,100);
  const pOther=createPlayer('p2',{name:'P2',gender:'female',level:10,skills:'v2;engineer;3;0;00000000000000',loadout:'0,0,0'},100,100);

  const tower={id:1,type:0,level:1,ownerId:'p1',classPath:null,classTier:0};
  assert.equal(classUpgradeState(pRank3,null).reason,'missing-tower');
  assert.equal(classUpgradeState(pNoClass,tower).reason,'no-class');
  assert.equal(classUpgradeState(pOther,tower).reason,'not-owner');
  assert.equal(classUpgradeState(pRank1,tower).reason,'rank-locked');
  assert.equal(classUpgradeState(pRank1,tower).requiredRank,2);
  assert.equal(canUpgradeClassPath(pRank2,tower),true);
  assert.equal(classUpgradeState(pRank2,tower).nextTier,1);

  tower.classPath='assault';tower.classTier=1;
  assert.equal(classUpgradeState(pRank2,tower).reason,'rank-locked');
  assert.equal(classUpgradeState(pRank2,tower).requiredRank,3);
  assert.equal(canUpgradeClassPath(pRank3,tower),true);
  assert.equal(classUpgradeState(pRank3,tower).nextTier,2);
  assert.equal(classPathCost(tower,1),TOWER_CLASS_PATHS.assault.tiers[0].cost[0]);
  assert.equal(classPathInvested(tower),55);

  tower.classTier=2;
  assert.equal(classUpgradeState(pRank3,tower).reason,'maxed');
  assert.equal(classUpgradeState(pRank3,tower).maxed,true);
  assert.equal(classPathInvested(tower),140);
});

test('match classUpgrade applies independently from level-3 universal kits and refunds proportionally on sell or sector advance',()=>{
  const p1=createPlayer('p1',{name:'P1',gender:'male',level:12,skills:'v2;engineer;3;0;00000000000000',loadout:'0,0,0'},100,100);
  const m=createMatch([p1],'g3-04e114f5c');
  m.money=1000;
  assert.equal(applyCommand(m,'p1',{type:'build',pad:0,towerType:0}).ok,true);
  const tower=m.towers[0];

  // Upgrade to level 3 and take a universal tower kit first
  assert.equal(applyCommand(m,'p1',{type:'upgrade',pad:0}).ok,true);
  assert.equal(applyCommand(m,'p1',{type:'upgrade',pad:0,branch:0}).ok,true);
  assert.equal(tower.level,3);
  assert.equal(tower.branch,0);

  // Stale expectedLevel guard rejects stale UI taps
  const beforeClass=getSupplies(m,'p1');
  assert.equal(applyCommand(m,'p1',{type:'classUpgrade',pad:0,expectedTowerId:tower.id,expectedLevel:2}).ok,false);
  assert.equal(tower.classTier||0,0);
  assert.equal(getSupplies(m,'p1'),beforeClass);

  // Valid Tier I + Tier II class upgrade leaves universal branch intact
  assert.equal(applyCommand(m,'p1',{type:'classUpgrade',pad:0,expectedTowerId:tower.id,expectedLevel:3}).ok,true);
  assert.equal(tower.classPath,'engineer');
  assert.equal(tower.classTier,1);
  assert.equal(tower.branch,0,'level-3 universal branch stays untouched');

  assert.equal(applyCommand(m,'p1',{type:'classUpgrade',pad:0}).ok,true);
  assert.equal(tower.classTier,2);
  const expectedSellRefund=towerRefund(tower);
  const suppliesBeforeSell=getSupplies(m,'p1');
  const sellRes=applyCommand(m,'p1',{type:'sell',pad:0});
  assert.equal(sellRes.ok,true);
  assert.equal(sellRes.refund,expectedSellRefund);
  assert.equal(getSupplies(m,'p1')-suppliesBeforeSell,expectedSellRefund);

  // Sector advance rebates 60% of both universal and class investment
  assert.equal(applyCommand(m,'p1',{type:'build',pad:1,towerType:1}).ok,true);
  const t2=m.towers[0];
  assert.equal(applyCommand(m,'p1',{type:'classUpgrade',pad:1}).ok,true);
  const basePlusClass=TOWER_COSTS[1]+classPathInvested(t2);
  const beforeAdvance=getSupplies(m,'p1');
  m.pendingSector=1;
  const adv=advanceSector(m);
  assert.equal(adv.sector,2);
  assert.equal(adv.refund,Math.floor(basePlusClass*.6));
  assert.equal(getSupplies(m,'p1')-beforeAdvance,Math.floor(basePlusClass*.6));
});

test('all six class tower factors and hit effects behave strictly and propagate across protocol snapshots',()=>{
  const assaultT={type:0,ownerId:'p1',classPath:'assault',classTier:2};
  assert.ok(Math.abs(classTowerDamageFactor(assaultT,{kind:'raider',boss:false})-1.28)<1e-6);
  assert.ok(Math.abs(classTowerDamageFactor(assaultT,{kind:'boss',boss:true})-1.38)<1e-6);

  const engT={type:0,ownerId:'p1',classPath:'engineer',classTier:2};
  assert.equal(classTowerIntervalFactor(engT),.78);
  assert.equal(classTowerRangeFactor(engT),1.1);

  const reconT={type:0,ownerId:'p1',classPath:'recon',classTier:2};
  assert.equal(classTowerIgnoresClouds(reconT),true);
  assert.equal(classTowerRangeFactor(reconT),1.25);
  const groundEnemy={kind:'raider',hp:50,pinned:0};
  const airEnemy={kind:'plane',baseKind:'plane',hp:50,pinned:0};
  applyClassTowerHitEffects({running:true,hp:10,maxHp:20},reconT,groundEnemy);
  applyClassTowerHitEffects({running:true,hp:10,maxHp:20},reconT,airEnemy);
  assert.equal(groundEnemy.pinned,1.4);
  assert.equal(airEnemy.pinned,0,'recon spotter optics does not pin planes');

  // Air-Defense mark amplification ONLY fires on targets painted with markedByAirDefense=true
  const adT={type:0,ownerId:'p1',classPath:'airDefense',classTier:2};
  const adMarkedPlane={kind:'plane',baseKind:'plane',hp:50,marked:3,markedByAirDefense:true};
  const nonAdMarkedPlane={kind:'plane',baseKind:'plane',hp:50,marked:3,markedByAirDefense:false};
  assert.ok(Math.abs(classTowerDamageFactor(adT,adMarkedPlane)-(1.45*1.26))<1e-5);
  assert.ok(Math.abs(classTowerDamageFactor(adT,nonAdMarkedPlane)-1.45)<1e-5);

  const adHitTarget={kind:'plane',baseKind:'plane',hp:80,marked:0,markedByAirDefense:false};
  applyClassTowerHitEffects({running:true,hp:10,maxHp:20},adT,adHitTarget);
  assert.equal(adHitTarget.marked,6);
  assert.equal(adHitTarget.markedByAirDefense,true);

  // Logistics bounty + Medic triage heal
  const state={individualSupplies:false,supplies:0,running:true,hp:10,maxHp:20,players:{p1:{supplies:0}}};
  let credited=0;
  const logT={type:0,ownerId:'p1',classPath:'logistics',classTier:2};
  const deadEnemy={kind:'raider',hp:0,classBountyPaid:false};
  applyClassTowerHitEffects(state,logT,deadEnemy,[],true,(s,id,amt)=>{credited+=amt;});
  applyClassTowerHitEffects(state,logT,deadEnemy,[],true,(s,id,amt)=>{credited+=amt;});
  assert.equal(credited,2,'bounty is paid once per dead enemy');

  const medT={type:0,ownerId:'p1',classPath:'medic',classTier:2,shotCount:8};
  applyClassTowerHitEffects(state,medT,{kind:'raider',hp:10});
  assert.equal(state.hp,11);

  // Protocol wire snapshots include classPath/classTier and air-defense mark flag while compacting player skill webs
  const p=createPlayer('p1',{name:'P1',gender:'male',level:15,skills:'v2;airDefense;3;1;11111111111111',loadout:'0,0,0'},100,100);
  const m=createMatch([p],'forest');
  m.towers.push({id:7,type:0,pad:0,x:100,y:100,level:3,branch:1,classPath:'airDefense',classTier:2,ownerId:'p1',kills:0,aim:0,cooldown:0,invested:100,shots:4});
  m.enemies.push({id:9,kind:'plane',baseKind:'plane',x:120,y:120,hp:50,maxHp:50,speed:30,marked:4,markedByAirDefense:true,pinned:0,boss:false,armored:false});
  const snap=createHost(m).snapshotFor('p1').match;
  assert.equal(snap.towers[0].classPath,'airDefense');
  assert.equal(snap.towers[0].classTier,2);
  assert.equal(snap.enemies[0].marked,4);
  assert.equal(snap.enemies[0].markedByAirDefense,true);
  assert.equal('web' in snap.players.p1.skills,false,'wire snapshots strip skills.web for bandwidth');
});
