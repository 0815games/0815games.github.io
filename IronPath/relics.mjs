// Campaign relics: one permanent passive ability per completed act.
//
// The 12 equipable prestige trophies were melted into these. A relic is never
// equipped, never crafted, never chosen: finishing the final mission of an act
// earns that act's relic and it is active from then on, everywhere the account
// plays. Like the dog tag, a relic is DERIVED at run time from storyProgress -
// no database field, no migration, and an old save sees exactly what a new one
// sees. Acts whose missions have not shipped yet cannot be completed, so their
// relics exist in the catalogue but stay locked.
//
// Bonus keys follow the equipment vocabulary (see equipment-effects.mjs).
// waveRepair, towerDamage and towerRange extend it for acts IV and V and are
// neutral in every merge until those relics can be earned.
import {actEndIndex,campaignProgress} from './campaign.mjs?v=20261219-trains1';

export const RELICS=Object.freeze({
  'relic-open-line':{act:1,bearer:'Ada Vale',name:'The Open Line',
    effect:'Your active ability recharges 4 seconds faster.',
    bonus:{cooldown:4}},
  'relic-the-list':{act:2,bearer:'Sera Malik',name:'The List',
    effect:'+25 shared bunker health and +15 starting supplies.',
    bonus:{bunkerHealth:25,startSupplies:15}},
  'relic-timetable':{act:3,bearer:'Ivo Chen',name:'The Timetable',
    effect:'+2 soldier damage and your soldiers fire 8% faster.',
    bonus:{damage:2,shotIntervalMultiplier:.92}},
  'relic-blueprint':{act:4,bearer:'Nia Reyes',name:'The Blueprint',
    effect:'Repairs 10 bunker health after every wave and +10 movement speed.',
    bonus:{waveRepair:10,movement:10}},
  'relic-iron-path':{act:5,bearer:null,name:'The Iron Path',
    effect:'Towers deal 10% more damage with +20 range, and +25 starting supplies.',
    bonus:{towerDamage:1.1,towerRange:20,startSupplies:25}},
});
export const RELIC_IDS=Object.freeze(Object.keys(RELICS));
export function isRelic(id){return typeof id==='string'&&Object.hasOwn(RELICS,id);}
// Only acts with shipped missions can be completed; a relic whose act has no
// finale index yet stays locked no matter the progress value.
export function relicEarned(id,profile){return isRelic(id)&&(()=>{const end=actEndIndex(RELICS[id].act);return end>=0&&campaignProgress(profile)>end;})();}
export function earnedRelicIds(profile){return RELIC_IDS.filter(id=>relicEarned(id,profile));}
// Merged passive bonus of every earned relic, in equipment vocabulary.
// Merge a relic bonus into an existing effects object (multipliers multiply).
export function applyRelicBonus(effects,relic){
  const merged={...effects};
  for(const [key,value] of Object.entries(relic||{})){
    if(key==='shotIntervalMultiplier'||key==='tankTowerMultiplier'||key==='towerDamage')merged[key]=(merged[key]??1)*value;
    else merged[key]=(merged[key]??0)+value;}
  return merged;
}
export function relicBonus(profile){
  const bonus={damage:0,range:0,movement:0,cooldown:0,bunkerHealth:0,startSupplies:0,airstrikeDamage:0,shotIntervalMultiplier:1,waveSupplies:0,tankTowerMultiplier:1,waveRepair:0,towerDamage:1,towerRange:0};
  for(const id of earnedRelicIds(profile)){for(const [key,value] of Object.entries(RELICS[id].bonus)){
    if(key==='shotIntervalMultiplier'||key==='towerDamage')bonus[key]*=value;else bonus[key]+=value;}}
  return bonus;
}
