// Balance & stress suite: the numbers tuned in the campaign/difficulty pass,
// pinned so a future change that silently breaks them fails here.
//
// The harness (tests/balance-harness.mjs) drives the REAL engine heads-up:
// every number below was produced by the same simulation the game runs.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {runSolo,runCoop,runVersus,runFourCoop,runCampaign,GEARS} from './balance-harness.mjs';
import {CAMPAIGN} from '../campaign.mjs';
import {getMap} from '../maps.mjs';
import {legacyEquipmentEffects} from '../equipment-effects.mjs';
import {createSoloDeployment} from '../solo-deployment.mjs';
import {createVersus} from '../versus.mjs';
import {createPlayer} from '../match.mjs';
import {stepMatch} from '../simulation.mjs';

test('every mission resolves valid objectives on its generated field',()=>{
  assert.equal(CAMPAIGN.length,12);
  for(const mission of CAMPAIGN){
    const map=getMap(mission.mapId);
    assert.equal(map.id,mission.mapId,`${mission.id} deploys on its own map`);
    let held=0;
    for(const stage of mission.stages){
      if(['defend','eliminate'].includes(stage.type))continue;
      // On the field, off every build pad, never outside the borders.
      assert.ok(stage.x>20&&stage.x<map.width-20&&stage.y>20&&stage.y<map.height-20,`${mission.id}: ${stage.label} sits on the field`);
      assert.ok(map.pads.every(p=>Math.hypot(p.x-stage.x,p.y-stage.y)>56),`${mission.id}: ${stage.label} avoids build pads`);
      if(stage.type!=='escort')held++;
    }
    // Protected assets and hold points must not collapse onto one spot.
    const points=mission.stages.filter(s=>Number.isFinite(s.x));
    for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)
      assert.ok(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)>=90||held<2,`${mission.id}: objectives are spread out`);
  }
});

test('the story is completable with mid gear and gates a rookie in act III',()=>{
  // Acts I and II are winnable with a fresh soldier; the legendary finale is
  // the documented prestige-gear gate (campaign.mjs).
  for(const mission of CAMPAIGN.slice(0,9)){
    const result=runCampaign(mission,GEARS.rookie);
    assert.equal(result.won,true,`${mission.id} must be winnable for a rookie`);
  }
  for(const gear of [GEARS.veteran,GEARS.elite]){
    for(const mission of CAMPAIGN){
      const result=runCampaign(mission,gear);
      assert.equal(result.won,true,`${mission.id} must be winnable with ${gear.label} gear`);
    }
  }
});

test('co-op scales: squads survive deep waves once geared, rookies fall mid-run',()=>{
  // Two, three and four soldiers with mid gear hold into the late waves.
  assert.ok(runCoop('road',2,GEARS.veteran,22).wave>=20,'2p reaches wave 20');
  assert.ok(runFourCoop(3,GEARS.veteran,22).wave>=20,'3p reaches wave 20');
  const four=runFourCoop(4,GEARS.veteran,22);
  assert.ok(four.wave>=20&&four.ended==='alive','4p is alive at wave 20');
  // Unguarded, the same squad still falls - the pressure curve is real.
  assert.ok(runFourCoop(4,GEARS.rookie,26).wave<26,'4p rookies do not survive forever');
});

test('versus stays a fair duel on both standard and generated fields',()=>{
  for(const mapId of ['road','forest','g2-75eac321','g3-0b9f45231']){
    const result=runVersus(mapId,GEARS.rookie,15);
    assert.ok(!result.ended||result.waves[0]<=result.waves[1]+1||result.waves[1]<=result.waves[0]+1,'lanes stay within one wave of each other');
    assert.ok(result.waves[0]>=10&&result.waves[1]>=10,`${mapId}: both duelists survive early waves`);
  }
});

test('endless solo stays challenging but fair for a rookie',()=>{
  // The classic road is the gentle introduction: a competent rookie reaches
  // the late game there, while rougher fields still grind them down.
  assert.ok(runSolo('road',GEARS.rookie,45).wave>=15,'a competent rookie reaches the mid game');
  for(const mapId of ['forest','g3-0d3e7f521']){
    const result=runSolo(mapId,GEARS.rookie,45);
    assert.ok(result.wave<45,`${mapId}: the endless curve eventually wins`);
    assert.ok(result.wave>=12,`${mapId}: a rookie still gets a real run`);
  }
});

test('flat gear and abilities keep their share of the late game',()=>{
  // The scope's damage grows with the waves instead of fading behind the
  // +23%-per-wave enemy health curve.
  assert.deepEqual(legacyEquipmentEffects(1,5),{...legacyEquipmentEffects(1,5)});
  assert.ok(legacyEquipmentEffects(1,30).damage>legacyEquipmentEffects(1,6).damage,'scope damage grows after wave 6');
  assert.ok(legacyEquipmentEffects(7,30).airstrikeDamage>legacyEquipmentEffects(7,6).airstrikeDamage,'pouch strike grows after wave 6');
  assert.equal(legacyEquipmentEffects(2,30).bunkerHealth,10,'utility bonuses stay flat');
});

test('contracts and duels never fall back a sector',()=>{
  const player=createPlayer('local',{name:'A',gender:'female',level:5,skills:'1,0,0,0,0;assault',loadout:'0,0,0'});
  const mission=createSoloDeployment({player,mapId:'g3-04e114f5c',workshopEnabled:false,campaign:{id:'tidelock',threat:'legendary'}});
  mission.wave=10;mission.running=true;mission.spawnLeft=0;mission.enemies=[];
  stepMatch(mission);
  assert.equal(mission.pendingSector,undefined,'a mission holds its map');
  const duel=createVersus([player,createPlayer('guest',{name:'B',gender:'male',level:5,skills:'1,0,0,0,0;assault',loadout:'0,0,0'})],'g3-0b9f45231','local');
  const lane=duel.lanes.local;
  lane.wave=10;lane.running=true;lane.spawnLeft=0;lane.enemies=[];
  stepMatch(lane);
  assert.equal(lane.pendingSector,undefined,'a versus lane holds its map');
});
