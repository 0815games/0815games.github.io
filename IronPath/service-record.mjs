import {readArmory} from './armory.mjs?v=20261102-longterm1';
import {characterProgress} from './progression.mjs?v=20261105-prestige1';
// Derived from existing saved data: no new profile fields or Firebase rules.
export function serviceMedals(profile){
 const a=readArmory(profile?.armory),level=characterProgress(profile?.xp||0).level;
 const count=Array.from({length:6},(_,i)=>!!(a.owned&(1<<i))).filter(Boolean).length;
 return [
  {name:'Seasoned Soldier',description:'Reach soldier level 5.',unlocked:level>=5},
  {name:'Veteran Soldier',description:'Reach soldier level 10.',unlocked:level>=10},
  {name:'Quartermaster',description:'Collect all six pieces of equipment.',unlocked:count===6},
  {name:'Bunker Engineer',description:'Buy six total bunker upgrade ranks.',unlocked:a.fortify+a.plating+a.repair+a.gun+a.supply+a.safeguard>=6},
  {name:'Field Commander',description:'Reach soldier level 15.',unlocked:level>=15},
  {name:'Campaign Legend',description:'Reach soldier level 25.',unlocked:level>=25},
  {name:'Demolition Expert',description:'Earn the Demolition Pouch at wave 14.',unlocked:!!(a.owned&(1<<6))},
  {name:'Supply Officer',description:'Earn the Quartermaster Badge at wave 18.',unlocked:!!(a.owned&(1<<8))},
  {name:'Iron Path Veteran',description:'Earn the Tank Spotter Kit at wave 20.',unlocked:!!(a.owned&(1<<9))},
  {name:'Master Engineer',description:'Buy twelve total bunker upgrade ranks.',unlocked:a.fortify+a.plating+a.repair+a.gun+a.supply+a.safeguard>=12},
  {name:'Full Arsenal',description:'Collect all ten pieces of equipment.',unlocked:a.owned===1023}
 ];
}
