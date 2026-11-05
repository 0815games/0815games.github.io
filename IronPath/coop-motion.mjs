import {legacyEquipmentEffects} from './equipment-effects.mjs?v=20261105-workshop1';
import {webBonuses} from './skills.mjs?v=20261104-doctrines1';
import {getMap} from './maps.mjs?v=20261102-fourbase1';
import {terrainFor,soldierSpeedFactor,enemySpeedFactor} from './terrain.mjs?v=20261102-terrain4';
import {bossPhase} from './boss-mechanics.mjs?v=20261102-battle2';

// Render-only prediction from the latest authoritative snapshot. It never changes
// the game state or awards damage/rewards, and stops after a short connection gap.
export function projectCoopMotion(state,age){
  const dt=Math.max(0,Math.min(.25,Number.isFinite(age)?age:0));
  if(!dt||state.ended)return state;
  const map=getMap(state.mapId),{path}=map,theme=terrainFor(map),paths=map.paths||[path];
  const players=Object.fromEntries(Object.entries(state.players).map(([id,p])=>{
    if(p.active===false)return [id,p];
    let dx=p.direction?.x||0,dy=p.direction?.y||0;
    if(!dx&&!dy&&p.target){dx=p.target.x-p.x;dy=p.target.y-p.y;}
    const len=Math.hypot(dx,dy);if(!len)return [id,p];
    const mobile=p.mobileSupply?.remaining>0?p.mobileSupply.bonus*Math.min(dt,p.mobileSupply.remaining)/dt:0;const speed=(150+10*(p.skills?.recon||0)+webBonuses(p.skills).movement+mobile+legacyEquipmentEffects(p.loadout?.equipped,state.wave).movement)*soldierSpeedFactor(theme,p,path);
    const distance=p.direction?.x||p.direction?.y?speed*dt:Math.min(len,speed*dt);
    return [id,{...p,x:Math.max(12,Math.min((map.width||960)-12,p.x+dx/len*distance)),y:Math.max(12,Math.min((map.height||540)-12,p.y+dy/len*distance))}];
  }));
  const commander=state.enemies.find(e=>e.boss==='bossCommander'&&e.hp>0),rally=commander&&bossPhase(commander)==='rally';
  const enemies=state.enemies.map(original=>{
    const e={...original},path=paths[e.road]||paths[0];let distance=e.speed*dt*(theme==='arctic'&&state.iceBroken&&e.kind==='tank'&&e.segment===5?.75:1)*(e.pinned>0?.8:1)*enemySpeedFactor(theme,e)*(state.suppression>0?.5:1)*(e.kind!=='plane'&&!e.boss&&commander&&Math.hypot(e.x-commander.x,e.y-commander.y)<(rally?180:100)?(rally?1.4:1.25):1);
    while(distance>0&&e.segment<path.length){const target=path[e.segment],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<=distance){e.x=target.x;e.y=target.y;distance-=d;e.segment++;}else{e.x+=dx/d*distance;e.y+=dy/d*distance;distance=0;}}
    return e;
  });
  return {...state,players,enemies};
}
