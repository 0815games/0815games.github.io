// Deterministic, host-simulated terrain rules. Legacy maps keep their old balance.
export const TERRAIN_BRIEFINGS=Object.freeze({
 scrub:'Tanks raise dust within 75 units and leave drifting clouds for 2 seconds. Towers and soldiers have 25% less targeting range against targets in dust; sniper towers ignore it.',
 forest:'Infantry and scouts have forest cover: 20% less tower and soldier damage. Recon-trained shooters ignore cover. On the marked ambush trail infantry and scouts move 15% faster.',
 urban:'Rubble reduces tower and soldier damage by 25% beyond 110 units. Direct weapon hits on enemies in the marked rubble zone break that cover after 200 damage, removing its long-range penalty there for this run.',
 arctic:'Off-road soldiers move 25% slower in snow. Tanks damage marked thin ice: after 4 tank-seconds it breaks for the rest of the run, slowing tanks 25% and dealing 20 HP per second instead of 10.',
 marsh:'Tanks move 25% slower in mud and 50% slower on the marked bog. All infantry and scouts have reed cover: 20% less tower and soldier damage from beyond 100 units.'
});
export function terrainFor(map){return map.id?.startsWith('g2-')?map.theme:null;}
export function distanceToRoad(point,path){
 let nearest=Infinity;
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/length)):0;
  nearest=Math.min(nearest,Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy));
 }
 return nearest;
}
// segment 5 is a horizontal route section on every g2 map, drawn as thin ice.
export const onThinIce=enemy=>enemy.segment===5;
export function soldierSpeedFactor(theme,player,path){return theme==='arctic'&&distanceToRoad(player,path)>36?.75:1;}
export function enemySpeedFactor(theme,enemy){if(theme==='forest'&&enemy.segment===3&&(enemy.kind==='infantry'||enemy.kind==='runner'))return 1.15;return theme==='marsh'&&enemy.kind==='tank'?(enemy.segment===7?.5:.75):1;}
export function iceDamage(theme,enemy,dt,broken=false){return theme==='arctic'&&enemy.kind==='tank'&&onThinIce(enemy)?(broken?20:10)*dt:0;}
export function targetingRange(theme,range,target,enemies,{sniper=false,clouds=[]}={}){
 if(theme==='scrub'&&!sniper&&(enemies.some(e=>e.kind==='tank'&&e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=75)||clouds.some(c=>c.life>0&&Math.hypot(c.x-target.x,c.y-target.y)<=75)))return range*.75;
 return range;
}
export function weaponDamageFactor(theme,enemy,distance,{recon=false,rubbleCleared=false}={}){
 if(theme==='forest'&&(enemy.kind==='infantry'||enemy.kind==='runner')&&!recon)return .8;
 if(theme==='urban'&&distance>110&&!(rubbleCleared&&enemy.segment===3))return .75;
 if(theme==='marsh'&&(enemy.kind==='infantry'||enemy.kind==='runner')&&distance>100)return .8;
 return 1;
}
