import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {CAMPAIGN,ACTS,actOf,actEndIndex,actComplete} from '../campaign.mjs';
import {RELICS,relicEarned,earnedRelicIds,relicBonus,applyRelicBonus,isRelic} from '../relics.mjs';
import {completeStoryMission,meltPrestige,encodeWorkshop,decodeWorkshop} from '../workshop-wire.mjs';
import {captureWorkshopLoadout,workshopEffects} from '../workshop-effects.mjs';
import {prestigeEarned,PRESTIGE_IDS} from '../prestige.mjs';
import {THREATS} from '../campaign-pressure.mjs';

const workshop=()=>({version:1,components:0,owned:[],equipped:{weapon:'standard',gear:'none',gadget:'none'},mods:{}});

test('five acts each carry exactly one relic and end on their shipped finale',()=>{
  assert.equal(ACTS.length,5);
  for(const act of ACTS){assert.ok(isRelic(act.relic),act.title);assert.equal(RELICS[act.relic].act,act.n);}
  assert.equal(CAMPAIGN[actEndIndex(1)].id,'supply-line');
  assert.equal(CAMPAIGN[actEndIndex(2)].id,'long-switch');
  assert.equal(CAMPAIGN[actEndIndex(3)].id,'last-transmission');
  // Acts IV and V have no missions yet: no finale, no completion, no relic.
  assert.equal(actEndIndex(4),-1);assert.equal(actEndIndex(5),-1);
  assert.equal(actComplete({storyProgress:CAMPAIGN.length},4),false);
  assert.equal(actComplete({storyProgress:CAMPAIGN.length},5),false);
  assert.equal(actComplete({storyProgress:4},1),true);
  assert.equal(actComplete({storyProgress:3},1),false);
  assert.equal(actOf(CAMPAIGN[actEndIndex(1)]).n,1);
});

test('relics are earned exactly at act completion and merge as passives',()=>{
  const profile=p=>({storyProgress:p});
  assert.deepEqual(earnedRelicIds(profile(0)),[]);
  assert.deepEqual(earnedRelicIds(profile(3)),[]);
  assert.deepEqual(earnedRelicIds(profile(4)),['relic-open-line']);
  assert.deepEqual(earnedRelicIds(profile(9)),['relic-open-line','relic-the-list']);
  assert.deepEqual(earnedRelicIds(profile(12)),['relic-open-line','relic-the-list','relic-timetable']);
  assert.ok(!relicEarned('relic-blueprint',profile(12)),'act IV relic stays locked until act IV ships');
  assert.ok(!relicEarned('relic-iron-path',profile(12)),'act V relic stays locked until act V ships');
  const bonus=relicBonus(profile(12));
  assert.equal(bonus.cooldown,4);assert.equal(bonus.bunkerHealth,25);assert.equal(bonus.startSupplies,15);
  assert.equal(bonus.damage,2);assert.equal(bonus.shotIntervalMultiplier,.92);
  assert.equal(bonus.waveRepair,0);assert.equal(bonus.towerDamage,1);assert.equal(bonus.towerRange,0);
  const merged=applyRelicBonus({damage:1,shotIntervalMultiplier:.9,range:5},relicBonus(profile(12)));
  assert.equal(merged.damage,3);assert.equal(merged.shotIntervalMultiplier,.9*.92);assert.equal(merged.range,5);
  assert.deepEqual(applyRelicBonus({damage:1},null),{damage:1});
});

test('relics ride the solo snapshot and standardize for competitive modes',()=>{
  const bare=captureWorkshopLoadout(workshop(),'solo');
  assert.deepEqual(bare.relics,[]);
  const carried=captureWorkshopLoadout(workshop(),'solo',{storyProgress:12});
  assert.deepEqual(carried.relics,['relic-open-line','relic-the-list','relic-timetable']);
  const effects=workshopEffects(carried,0);
  assert.equal(effects.cooldown,4);assert.equal(effects.damage,2);assert.equal(effects.bunkerHealth,25);
  // Versus stays standardized: no relics attach and none apply.
  const versus=captureWorkshopLoadout(workshop(),'versus',{storyProgress:12});
  assert.deepEqual(versus.relics,[]);
  const neutral=workshopEffects({version:1,mode:'versus',items:carried.items,relics:['relic-open-line']},0);
  assert.equal(neutral.cooldown,0);
  // Unknown relic ids grant nothing instead of failing the snapshot.
  const forged=workshopEffects({version:1,mode:'solo',items:carried.items,relics:['relig-open-line','relic-open-line']},0);
  assert.equal(forged.cooldown,4);assert.equal(forged.damage,0);
});

test('the prestige trophies are melted: no grants, no effects, stripped on sync',()=>{
  assert.equal(prestigeEarned('prestige-relay',{storyProgress:12}),false);
  // An old save carries a prestige item, equipped with a mod.
  const old={version:1,components:0,owned:['prestige-relay'],equipped:{weapon:'standard',gear:'none',gadget:'prestige-relay'},mods:{'prestige-relay':'beacon'}};
  const encoded=encodeWorkshop(old);assert.ok(encoded);
  const profile={storyProgress:4,workshop:encoded};
  const melted=meltPrestige(profile);
  const workshopAfter=decodeWorkshop(melted.workshop);
  assert.deepEqual(workshopAfter.owned,[]);
  assert.equal(workshopAfter.equipped.gadget,'none');
  assert.deepEqual({...workshopAfter.mods},{});
  // Completing a mission melts instead of granting: no trophy returns.
  const completed=completeStoryMission({storyProgress:9,storyCampaign:1,workshop:encoded},'supply-line');
  assert.equal(completed.storyProgress,10);
  assert.ok(!decodeWorkshop(completed.workshop).owned.some(id=>PRESTIGE_IDS.includes(id)));
  // Old snapshots with a prestige id resolve to no effect at all.
  const snapshot=captureWorkshopLoadout(workshop(),'solo');
  const stale=workshopEffects({version:1,mode:'solo',items:[{slot:'weapon',id:'standard',mod:null},{slot:'gear',id:'none',mod:null},{slot:'gadget',id:'prestige-relay',mod:'beacon'}]},0);
  assert.ok(stale);assert.equal(stale.cooldown,0);assert.equal(stale.range,0);
});

test('the threat ladder grows two steps and the story rides them',()=>{
  assert.ok(THREATS.veteran);assert.ok(THREATS.iron);
  assert.ok(THREATS.elite.unit<=THREATS.veteran.unit&&THREATS.veteran.unit<=THREATS.legendary.unit);
  assert.ok(THREATS.legendary.damage<=THREATS.iron.damage&&THREATS.legendary.wave<THREATS.iron.wave);
  assert.equal(CAMPAIGN.find(m=>m.id==='supply-line').threat,'elite');
  assert.equal(CAMPAIGN.find(m=>m.id==='intercept').threat,'elite');
  assert.equal(CAMPAIGN.find(m=>m.id==='long-switch').threat,'veteran');
  assert.equal(CAMPAIGN.find(m=>m.id==='city-of-glass').threat,'veteran');
});
