import {ITEMS} from '../data/items.js';
import {state} from '../core/state.js';
import {WorldMap} from '../world/map.js';
export const NEW_ITEMS=[["crypt_blade","Gruftklinge","weapon","mainhand",12,75,2,2,"warrior","🗡️"],["blacksteel_sword","Schwarzstahl-Schwert","weapon","mainhand",16,140,6,6,"warrior","⚔️"],["runewood_staff","Runenholzstab","weapon","mainhand",10,70,2,2,"mage","🔮"],["eclipse_staff","Stab der Finsternis","weapon","mainhand",16,145,6,6,"mage","🔮"],["bone_dagger","Knochendolch","weapon","mainhand",9,60,2,2,"rogue","🔪"],["night_fang","Nachtzahn","weapon","mainhand",15,135,6,6,"rogue","🗡️"],["bone_mail","Knochenpanzer","armor","body",8,90,3,3,null,"🛡️"],["warden_plate","Harnisch des Gruftwächters","armor","body",12,160,8,8,null,"🪖"],["warden_helmet","Helm des Gruftwächters","helmet","head",5,70,3,3,null,"⛑️"],["shadow_boots","Schattenstiefel","boots","feet",4,65,3,3,null,"🥾"],["runic_shield","Runenschild","shield","offhand",6,85,4,4,"warrior","🛡️"],["obsidian_ring","Obsidianring","ring","ring",7,100,5,5,null,"💍"]];

// Weitere Fundgegenstände: fünf Fortschrittsstufen, alle sechs Slots.
const LOOT_TIERS = [
 {tag:'crypt',label:'der Gruft',depth:1,level:1,weapon:4,armor:2,minor:1},
 {tag:'bone',label:'der Knochenwacht',depth:3,level:3,weapon:8,armor:4,minor:2},
 {tag:'ashen',label:'der Asche',depth:6,level:5,weapon:12,armor:6,minor:3},
 {tag:'abyss',label:'des Abgrunds',depth:10,level:8,weapon:17,armor:9,minor:4},
 {tag:'eclipse',label:'der ewigen Nacht',depth:15,level:12,weapon:23,armor:12,minor:6}
];
const LOOT_FAMILIES = [
 ['sword','Schwert','weapon','mainhand','warrior','🗡️'],
 ['staff','Stab','weapon','mainhand','mage','🔮'],
 ['dagger','Dolch','weapon','mainhand','rogue','🔪'],
 ['mail','Panzer','armor','body',null,'🛡️'],
 ['helm','Helm','helmet','head',null,'⛑️'],
 ['boots','Stiefel','boots','feet',null,'🥾'],
 ['ward','Schutzsiegel','shield','offhand',null,'🛡️'],
 ['ring','Ring','ring','ring',null,'💍']
];
for(const tier of LOOT_TIERS){
 for(const [key,label,type,slot,heroClass,icon] of LOOT_FAMILIES){
  const val=type==='weapon'?tier.weapon:slot==='body'?tier.armor:tier.minor;
  const price=20+val*(type==='weapon'?8:12);
  NEW_ITEMS.push([
   `loot_${tier.tag}_${key}`,`${label} ${tier.label}`,
   type,slot,val,price,tier.depth,tier.level,heroClass,icon
  ]);
 }
}

for(const[id,name,type,slot,val,price,minDepth,minLevel,heroClass,icon]of NEW_ITEMS){ITEMS[id]={name,type,slot,val,price,stack:1,icon,category:type==='weapon'?'Waffe':type==='ring'?'Reliquie':'Rüstung',minDepth,minLevel,heroClass,desc:`+${val} ${type==='weapon'||type==='ring'?'ATK':'DEF'} (${slot}). Truhenbeute ab Ebene ${minDepth} und Charakterlevel ${minLevel}.`};if(type==='ring')ITEMS[id].stat='atk';}
export function pickNewItem(level,depth,heroClass,rnd=Math.random,slot=null){
 const eligible=NEW_ITEMS.filter(row=>
  level>=row[7]&&depth>=row[6]&&
  (!row[8]||row[8]===heroClass)&&(!slot||row[3]===slot)
 );
 if(!eligible.length)return null;
 // Höherwertige, freigeschaltete Stufen bevorzugen, ältere bleiben möglich.
 const highestDepth=Math.max(...eligible.map(row=>row[6]));
 const pool=eligible.filter(row=>row[6]>=Math.max(1,highestDepth-5));
 const weighted=pool.map(row=>({row,weight:row[6]===highestDepth?3:1}));
 let roll=rnd()*weighted.reduce((sum,entry)=>sum+entry.weight,0);
 for(const entry of weighted){
  roll-=entry.weight;
  if(roll<0)return entry.row[0];
 }
 return weighted[weighted.length-1].row[0];
}
const generate=WorldMap.prototype.generate;
WorldMap.prototype.generate=function(...args){
 const result=generate.apply(this,args);
 for(const chest of state.world.chests||[]){
  const old=ITEMS[chest.item];
  if(chest.open||!old?.slot)continue;
  const id=pickNewItem(
   state.player.level,state.world.depth,state.player.heroClass,
   Math.random,old.slot
  );
  if(id)chest.item=id;
 }
 return result;
};
