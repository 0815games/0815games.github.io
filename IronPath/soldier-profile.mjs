import {characterProgress} from './progression.mjs?v=20261105-prestige1';
import {readArmory,ITEMS} from './armory.mjs?v=20261107-balance1';
import {parseBuild,webBonuses,abilityName} from './skills.mjs?v=20261107-balance1';
// Base loadout values only. Terrain, temporary perks and enemy defenses can
// change the actual battlefield result; no simulation state is written here.
export function soldierProfile(profile){
 const level=characterProgress(profile?.xp||0).level,armory=readArmory(profile?.armory),skills=parseBuild(profile?.skills,level),bonuses=webBonuses(skills),item=armory.equipped;
 return {level,name:profile?.name||'',gender:profile?.gender==='male'?'male':'female',equipment:item?ITEMS[item-1]:null,ability:abilityName(skills),
 damage:10+Math.min(level-1,20)+2*skills.assault+bonuses.damage+(item===1?3:0),
 range:150+bonuses.heroRange+(skills.extra[1]?25:0)+(skills.extra[8]?25:0)+(item===4?30:0),
 movement:150+10*skills.recon+bonuses.movement+(item===3?20:0),
 cooldown:skills.active?Math.max(10,(skills.extra[3]?25:30)-(item===5?4:0)+(['logistics','medic','recon'].includes(skills.active)&&skills.variant===1?8:0)-bonuses.cooldown):null,
 inventory:ITEMS.map((entry,i)=>({...entry,id:i+1,owned:!!(armory.owned&(1<<i)),equipped:item===i+1})),scrap:armory.scrap};
}
