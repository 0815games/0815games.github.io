// Route the real solo game to its equipment implementation.
//
// The workshop path is used when the player has a valid migrated workshop, for
// endless solo AND for campaign missions. A save that has no workshop yet (any
// account that has not opened the armory) keeps the legacy equipment; the
// workshop is prepared by the account when the player opens the armory, so a live
// player is never blocked or reset. A save with a workshop that cannot be read
// never silently falls back: that would discard the player's chosen loadout.
//
// A campaign mission is a contract, not a sandbox: it carries a threat level that
// decides its wave count, enemy scale and bunker health (see campaign-pressure).
import {createMatch} from './simulation.mjs?v=20261112-kits1';
import {createWorkshopSoloMatch} from './workshop-solo.mjs?v=20261112-kits1';
import {decodeWorkshop} from './workshop-wire.mjs?v=20261112-pressure1';
import {threatFor,campaignUnitScale,campaignBunker,campaignWaves,campaignSurge,campaignPressure} from './campaign-pressure.mjs?v=20261112-pressure1';
import {TRAINING_WAVES,TRAINING_UNIT,TRAINING_BUNKER,TRAINING_BOSS_UNIT,TRAINING_BOSS_EVERY,TRAINING_SUPPLIES} from './training-run.mjs?v=20261121-supplies1';
import {relicBonus} from './relics.mjs?v=20261112-pressure1';
import {storyBossKind} from './combat.mjs?v=20261031-finale1';
import {getMap} from './maps.mjs?v=20261031-finale1';

// Where a soldier stands when a run begins. A story mission starts at its first
// stage marker ("Soldier starts every time at the bunker!" was the report that
// fixed that). Everything else - endless, training, a mission without a marker -
// deploys at the bunker OF THE MAP: the old hard-coded (850,450) only matched
// the three classic maps whose bunker sits at (900,400). Generated free-play
// maps put their bunker anywhere from (150,150) to (750,330), and the soldier
// started up to 760px away, mid-field. The offset is the one the retreat uses
// (bunker.x-90, bunker.y+60), so surviving into a new sector does not teleport
// anyone; a second soldier (co-op join) stands 50px further left, like the old
// 800/850 pair did on the classic maps.
export function bunkerStart(mapId,slot=0){
  const map=getMap(mapId),bunker=map.bunker||{x:900,y:400};
  return {x:Math.max(90,bunker.x-90-50*Math.max(0,slot)),y:Math.min((map.height||540)-60,bunker.y+60)};
}

export function createSoloDeployment({player,mapId,profile,workshopEnabled=false,campaign=null}) {
 // A story mission begins where its first stage marker sits; endless and
 // training keep the bunker start - now the real one, see bunkerStart.
 const spawn=campaign?.spawn;
 if(Number.isFinite(spawn?.x)&&Number.isFinite(spawn?.y))player={...player,x:spawn.x,y:spawn.y};
 else player={...player,...bunkerStart(mapId)};
 // The training contract is the only campaign-shaped deployment that is easier
 // than endless, so it is read from its own module rather than the threat table.
 const training=campaign?.threat==='training';
 const threat=training?{bunker:TRAINING_BUNKER,squad:0}:threatFor(campaign?.threat);
 const contract=!!campaign;
 if(workshopEnabled&&profile&&Object.hasOwn(profile,'workshop')){
  const workshop=decodeWorkshop(profile.workshop);
  if(!workshop)throw new Error('A valid workshop is required for a workshop deployment');
  const state=createWorkshopSoloMatch(player,workshop,mapId,profile);
  if(contract)applyContract(state,campaign,threat,training);
  return state;
 }
 // The classic path has no snapshot to carry them, so the account's earned
 // relics ride on the match state and merge into the legacy effects.
 const state=createMatch([player],mapId),relic=relicBonus(profile);
 state.relicBonus=relic;
 state.maxHp+=relic.bunkerHealth;state.hp+=relic.bunkerHealth;state.money+=relic.startSupplies;
 if(contract)applyContract(state,campaign,threat,training);
 return state;
}
// A mission's pressure is applied after the match is built, so endless solo and
// multiplayer keep their existing numbers. The bunker is re-scaled from its base
// health (upgrades and equipment already included), never below a floor.
function applyContract(state,campaign,threat,training=false){
 const base=state.maxHp;
 state.maxHp=campaignBunker(base,threat.bunker);
 state.hp=Math.min(state.hp,state.maxHp);
 // The mission's calibrated pressure rides on enemy health and bunker damage
 // (see PRESSURE in campaign-pressure.mjs): it levels the generated fields
 // onto one difficulty curve per threat grade.
 const pressure=campaignPressure(campaign);
 state.campaignContract=training
  ?{missionId:campaign.id,threat:'training',waves:TRAINING_WAVES,unit:TRAINING_UNIT,squad:0,bossUnit:TRAINING_BOSS_UNIT,bossEvery:TRAINING_BOSS_EVERY}
  :{missionId:campaign.id,threat:campaign.threat??'standard',waves:campaignWaves(campaign.threat),unit:campaignUnitScale(campaign.threat,1)*pressure,squad:threat.squad,damage:threat.damage*pressure,bossFinal:campaign.boss?storyBossKind(campaign.boss):null};
 // Only the training contract raises the wallet: its coach gates the upgrade card
 // on the field, and the endless start (125) could not buy the dearest tower AND
 // its first upgrade. A floor, not an override - equipment that grants start
 // supplies keeps every unit it pays above the floor. Story missions and endless
 // solo keep their own numbers.
 if(training&&!state.individualSupplies)state.money=Math.max(state.money,TRAINING_SUPPLIES);
}
