import {characterProgress} from './progression.mjs?v=20261105-prestige1';
import {readArmory,ITEMS} from './armory.mjs?v=20261121-adminacc1';
import {parseBuild,webBonuses,abilityName,specialistUnlocked,SKILL_PATH_MAP} from './skills.mjs?v=20261121-adminacc1';
import {decodeWorkshop} from '../workshop/workshop-wire.mjs?v=20261121-adminacc1';
import {captureWorkshopLoadout,workshopEffects} from '../workshop/workshop-effects.mjs?v=20261121-adminacc1';
// Base loadout values only. Terrain, temporary perks and enemy defenses can
// change the actual battlefield result; no simulation state is written here.
//
// IPL-0137: with a workshop account the item bonuses come from the taken
// list — everything the soldier wears at once — through the same effects the
// match uses. Accounts without the workshop string keep the old one-slot
// legacy index as their fallback.
export function soldierProfile(profile){
  const level=characterProgress(profile?.xp||0).level,armory=readArmory(profile?.armory),skills=parseBuild(profile?.skills,level),bonuses=webBonuses(skills),item=armory.equipped;
  const workshop=profile?.workshop?decodeWorkshop(profile.workshop):null;
  const snapshot=workshop?captureWorkshopLoadout(workshop,'solo'):null, gear=snapshot?workshopEffects(snapshot,0):null;
  const taken=workshop?new Set(workshop.equipped):null;
  const itemDamage=gear?gear.damage:(item===1?3:0);
  const itemRange=gear?gear.range:(item===4?30:0);
  const itemMovement=gear?gear.movement:(item===3?20:0);
  const itemCooldown=gear?gear.cooldown:(item===5?4:0);
  const cooldownBase=(specialistUnlocked(skills,'engineer',1)?25:30)-itemCooldown+((['logistics','medic','recon'].includes(skills.active)&&skills.variant===1)?8:(skills.active==='airDefense'&&skills.variant===2)?6:0)-bonuses.cooldown;
  return {
    level,
    name:profile?.name||'',
    gender:profile?.gender==='male'?'male':'female',
    equipment:item?ITEMS[item-1]:null,
    classId:skills.classId||null,
    className:skills.classId?SKILL_PATH_MAP[skills.classId]?.name||null:null,
    ability:abilityName(skills),
    damage:10+Math.min(level-1,20)+2*(skills.assault||0)+bonuses.damage+itemDamage,
    range:150+bonuses.heroRange+(specialistUnlocked(skills,'assault',1)?25:0)+(specialistUnlocked(skills,'recon',0)?25:0)+itemRange,
    movement:150+10*(skills.recon||0)+bonuses.movement+itemMovement,
    cooldown:skills.active?Math.max(10,cooldownBase):null,
    inventory:ITEMS.map((entry,i)=>({...entry,id:i+1,owned:!!(armory.owned&(1<<i)),equipped:taken?taken.has(`legacy-${i+1}`):item===i+1})),
    scrap:armory.scrap
  };
}
