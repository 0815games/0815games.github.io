import {readArmory} from './armory.mjs?v=20261102-armory2';
import {characterProgress} from './progression.mjs?v=20261102-future1';
// Derived from existing saved data: no new profile fields or Firebase rules.
export function serviceMedals(profile){
 const a=readArmory(profile?.armory),level=characterProgress(profile?.xp||0).level;
 const count=Array.from({length:6},(_,i)=>!!(a.owned&(1<<i))).filter(Boolean).length;
 return [
  {name:'Seasoned Soldier',description:'Reach soldier level 5.',unlocked:level>=5},
  {name:'Veteran Soldier',description:'Reach soldier level 10.',unlocked:level>=10},
  {name:'Quartermaster',description:'Collect all six pieces of equipment.',unlocked:count===6},
  {name:'Bunker Engineer',description:'Buy six total bunker upgrade ranks.',unlocked:a.fortify+a.plating+a.repair+a.gun>=6}
 ];
}
