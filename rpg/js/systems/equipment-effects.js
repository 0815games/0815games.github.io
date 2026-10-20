export function equippedEffects(player,items){
 let lifeSteal=0,armorPen=0;
 for(const id of Object.values(player.equipped||{})){
  const effect=items[id]?.effects;
  if(Number.isFinite(effect?.lifeSteal))lifeSteal+=Math.max(0,effect.lifeSteal);
  if(Number.isFinite(effect?.armorPen))armorPen+=Math.max(0,effect.armorPen);
 }
 return {lifeSteal:Math.min(.25,lifeSteal),armorPen:Math.min(.50,armorPen)};
}
export function effectiveDefense(monster,stats){
 const defense=Number.isFinite(monster.def)?Math.max(0,monster.def):0;
 const penetration=Number.isFinite(stats.armorPen)
  ?Math.max(0,Math.min(.50,stats.armorPen)):0;
 return defense*(1-penetration);
}
export function applyLifeSteal(player,monster,hpBefore,stats){
 if(!(player.hp>0)||!(stats.lifeSteal>0)||!Number.isFinite(hpBefore))return 0;
 const damage=Math.max(0,Math.max(0,hpBefore)-Math.max(0,monster.hp));
 const missing=Math.max(0,player.maxHp-player.hp);
 const healing=Math.min(missing,Math.floor(damage*stats.lifeSteal));
 if(healing>0)player.hp+=healing;
 return healing;
}
