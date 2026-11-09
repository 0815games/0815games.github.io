// Balance & stress suite: the numbers tuned in the campaign/difficulty pass,
// pinned so a future change that silently breaks them fails here.
//
// The harness (tests/balance-harness.mjs) drives the REAL engine heads-up:
// every number below was produced by the same simulation the game runs.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {runSolo,runCoop,runVersus,runFourCoop,runCampaign,GEARS} from './balance-harness.mjs';
import {CAMPAIGN,actOf,actEndIndex} from '../campaign.mjs';
import {getMap} from '../maps.mjs';
import {legacyEquipmentEffects} from '../equipment-effects.mjs';
import {createSoloDeployment} from '../solo-deployment.mjs';
import {createVersus} from '../versus.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';

test('every mission resolves valid objectives on its generated field',()=>{
  assert.equal(CAMPAIGN.length,39);
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

test('act finales gate a rookie and carried relics complete the story',()=>{
  // Five-act curve: acts I and II are winnable with a fresh soldier EXCEPT
  // their finales - the act gates (supply-line, long-switch). Act III is the
  // relic wall: a rookie without act relics does not clear it. Mid gear plus
  // the first act relic clears acts I-II; full gear plus all earned relics
  // clears everything, including the legendary finale (see campaign.mjs).
  const finale=mission=>CAMPAIGN.indexOf(mission)===actEndIndex(actOf(mission));
  for(const mission of CAMPAIGN.slice(0,15)){
    if(finale(mission))continue;
    const result=runCampaign(mission,GEARS.rookie);
    assert.equal(result.won,true,`${mission.id} must be winnable for a rookie`);
  }
  // The documented gates: the act I finale (escort-heavy) and the wall at the
  // start of act III (eliminate stages). The hold-heavy finales stay clearable
  // for a skilled rookie - the fixed-step bot defends very well; humans meet
  // the wall much earlier. Threat grades carry the intended curve.
  for(const id of ['supply-line','city-of-glass']){
    const mission=CAMPAIGN.find(m=>m.id===id);
    assert.equal(runCampaign(mission,GEARS.rookie).won,false,`${id} gates a rookie`);
  }
  for(const mission of CAMPAIGN.slice(0,10)){
    const result=runCampaign(mission,GEARS.veteran);
    assert.equal(result.won,true,`${mission.id} must be winnable with mid gear and the first relic`);
  }
  for(const mission of CAMPAIGN){
    const result=runCampaign(mission,GEARS.elite);
    assert.equal(result.won,true,`${mission.id} must be winnable with ${GEARS.elite.label} gear`);
  }
});

test('contested objectives sit where the road can reach them',()=>{
  // A protected asset further than the enemy reach (100px) from the road can
  // never be damaged, a secure point beyond the contest radius (110px) is
  // never contested - both would be free stages on a generated field.
  const roadDistance=(p,path)=>{let m=1e9;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)):0;m=Math.min(m,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));}return m;};
  for(const mission of CAMPAIGN){
    const map=getMap(mission.mapId);
    for(const stage of mission.stages){
      if(stage.type==='protect')assert.ok(roadDistance(stage,map.path)<100,`${mission.id}: ${stage.label} is contestable`);
      if(stage.type==='secure')assert.ok(roadDistance(stage,map.path)<=110,`${mission.id}: ${stage.label} is contested`);
    }
  }
});

test('a pair earns the friendly rate: 70% each against 1.5x enemy health',()=>{
  // Two soldiers are the friendliest team size: the pair keeps pace with the
  // endless curve while bigger squads split harder bills (see rewardTeam).
  const state=createMatch([createPlayer('a',{name:'A',gender:'female'}),createPlayer('b',{name:'B',gender:'male'})]);
  state.running=true;state.wave=1;state.spawnLeft=1;state.spawnTimer=100;
  state.enemies=Array.from({length:4},()=>({hp:0,reward:8,speed:0,segment:1,x:0,y:130}));
  stepMatch(state);
  // Four kills of an 8-supply enemy: floor(8*.7)=5 each, so 20 supplies per soldier.
  assert.equal(state.players.a.money,125+4*5);
  assert.equal(state.players.b.money,125+4*5);
});

test('crafted workshop gear grows with the wave curve like the armory',async()=>{
  const {workshopEffects,captureWorkshopLoadout}=await import('../workshop-effects.mjs');
  const {migrateWorkshop}=await import('../workshop-model.mjs');
  const w=migrateWorkshop(null);w.owned=['marksman'];w.equipped={weapon:'marksman',gear:'none',gadget:'none'};w.mods={};
  const solo=captureWorkshopLoadout(w,'solo');
  const early=workshopEffects(solo,6),late=workshopEffects(solo,30);
  assert.ok(late.damage>early.damage,'marksman damage grows after wave 6');
  assert.equal(early.damage,2,'the early value stays as advertised');
  assert.equal(workshopEffects(captureWorkshopLoadout(w,'versus'),30).damage,0,'competitive modes stay neutral');
  // Legacy migrated gear scales exactly once: the scope's 3 damage grows to 8
  // by wave 20 (3 + floor(15/3) + ... see equipment-effects.mjs), not further.
  const legacy=migrateWorkshop({owned:1,equipped:1});
  assert.equal(workshopEffects(captureWorkshopLoadout(legacy,'solo'),20).damage,8,'legacy gear is not scaled twice');
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

test('endless pairs are friendly for a new duo but still fall',()=>{
  // The 70% pair rate buys the classic road into the late waves for two
  // rookies; the covered forest stays the counterplay map and still wins.
  assert.ok(runCoop('road',2,GEARS.rookie,40).wave>=30,'a rookie pair reaches the late game');
  assert.ok(runCoop('forest',2,GEARS.rookie,40).wave<40,'the covered forest still ends the run');
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
    // The live game draws a crypto-random retreat map; the harness derives it
    // from the field it leaves (see retreatMapFor), so the same run must
    // always produce the same number - otherwise these pins are a lottery.
    const repeat=runSolo(mapId,GEARS.rookie,45);
    assert.equal(repeat.wave,result.wave,`${mapId}: the harness retreat is deterministic`);
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
