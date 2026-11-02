import {bossPhase,bossWeaponFactor,crossedCycle} from './boss-mechanics.mjs?v=20261102-terrain4';
import {terrainFor,soldierSpeedFactor,enemySpeedFactor,iceDamage,targetingRange,weaponDamageFactor} from './terrain.mjs?v=20261102-terrain4';
import {getMap,isMapId,DEFAULT_MAP} from './maps.mjs?v=20261102-terrain4';
// Fixed-step simulation. Browser and a future server can execute the same rules.
// Not a networking protocol or an anti-cheat system by itself.
import { WAVE_COUNT,waveFormation,makeEnemy,towerDamage } from './combat.mjs?v=20261102-terrain4';
import { waveXP } from './progression.mjs?v=20261102-terrain4';
import {addSupplies} from './match.mjs?v=20261102-coopflow1';
export const STEP = 1/30;
export const PATH=getMap(DEFAULT_MAP).path, PADS=getMap(DEFAULT_MAP).pads;
const towerStats=[{range:125,interval:.55,color:'#d9d884'},{range:145,interval:1.4,color:'#e49b67'},{range:155,interval:.8,color:'#8cc0a6'},{range:210,interval:1.8,color:'#a9a4d4'}];
const branchStats=[[{interval:.55,range:1},{interval:1,range:1},{interval:.85,range:1.15}],[{interval:.6,range:1},{interval:1,range:1},{interval:.85,range:1.15}],[{interval:.55,range:1},{interval:1,range:1.45},{interval:.85,range:1.15}],[{interval:.6,range:1},{interval:1,range:1.1},{interval:.85,range:1.15}]];
export function getTowerRange(tower){
  const stats=towerStats[tower.type],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;
  return stats.range*(branch?branch.range:1);
}
export function createMatch(players,mapId=DEFAULT_MAP){
  if(!isMapId(mapId))throw new Error('Invalid map');
  if(!Array.isArray(players)||players.length<1||players.length>2||new Set(players.map(p=>p.id)).size!==players.length)throw new Error('A match needs one or two unique players');
  const individualSupplies=players.length>1;
  // The shared bunker uses the strongest purchased upgrade of each type;
  // equipment and Medic bonuses from each player stack.
  const fortify=Math.max(...players.map(p=>p.loadout?.fortify||0)),plating=Math.max(...players.map(p=>p.loadout?.plating||0));
  const repair=Math.max(...players.map(p=>p.loadout?.repair||0)),gun=Math.max(...players.map(p=>p.loadout?.gun||0));
  const maxHp=100+fortify*10+players.reduce((n,p)=>n+5*(p.skills?.medic||0)+(p.skills?.extra?.[6]?10:0)+(p.loadout?.equipped===2?10:0),0);
  return {mapId,wave:0,hp:maxHp,maxHp,plating,repair,gun,gunTimer:0,lootKills:0,suppression:0,...(individualSupplies?{individualSupplies:true}:{money:125+(players[0].loadout?.equipped===6?25:0)}),enemies:[],towers:[],shots:[],running:false,spawnLeft:0,spawnIndex:0,spawnTimer:0,ended:false,players:Object.fromEntries(players.map(p=>[p.id,individualSupplies?{...p,money:125+(p.loadout?.equipped===6?25:0),completedWaveMask:0,lootCaches:0}:p]))};
}
// Co-op rewards are personal: when both players are active, each gets 65% of
// the base reward (rounded down); the owner's Logistics bonus remains intact.
// An absent guest earns nothing; the remaining host receives the solo base rate.
export const COOP_REWARD_RATE=.65;
export const COOP_ENEMY_HEALTH=1.5;
function activePlayers(state){return Object.keys(state.players).sort().filter(id=>state.players[id].active!==false);}
function rewardTeam(state,amount,enemyKill=false){
  const active=activePlayers(state),salvage=enemyKill?(state.runPerks?.salvage||0):0,base=state.individualSupplies&&active.length>1?Math.floor(amount*COOP_REWARD_RATE):amount;
  if(state.individualSupplies){for(const id of active)addSupplies(state,id,base+salvage+(enemyKill?((state.players[id].skills?.logistics||0)+(state.players[id].skills?.extra?.[4]?1:0)):0));}
  else state.money+=base+salvage+(enemyKill?((Object.values(state.players)[0]?.skills?.logistics||0)+(Object.values(state.players)[0]?.skills?.extra?.[4]?1:0)):0);
  return base;
}
// Exactly one fixed step per call. Events are transient, not a record of validated rewards.
export function stepMatch(state){
  const events=[];if(state.ended)return events;const dt=STEP,map=getMap(state.mapId),{path:PATH,pads:PADS}=map,theme=terrainFor(map);
  // Purely visual trails persist long enough to reach 5 Hz co-op snapshots.
  const shotDuration=state.individualSupplies ? .55 : .24;
  state.shots=state.shots.filter(s=>(s.life-=dt)>0);
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];if(p.active===false)continue;const speed=(150+10*(p.skills?.recon||0)+(p.loadout?.equipped===3?20:0))*soldierSpeedFactor(theme,p,PATH);p.overdrive=Math.max(0,(p.overdrive||0)-dt);let {x:dx,y:dy}=p.direction;
    if(dx||dy){const len=Math.hypot(dx,dy);p.x+=dx/len*speed*dt;p.y+=dy/len*speed*dt;}
    else if(p.target){dx=p.target.x-p.x;dy=p.target.y-p.y;const len=Math.hypot(dx,dy),step=Math.min(len,speed*dt);if(len>0){p.x+=dx/len*step;p.y+=dy/len*step;}if(len<=step)p.target=null;}
    p.x=Math.max(12,Math.min(948,p.x));p.y=Math.max(12,Math.min(528,p.y));p.cooldown=Math.max(0,p.cooldown-dt);
  }
  if(state.running&&state.spawnLeft>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){const kind=waveFormation(state.wave)[state.spawnIndex++],enemy=makeEnemy(kind,state.wave);if(state.individualSupplies&&activePlayers(state).length>1){enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*COOP_ENEMY_HEALTH);}state.enemies.push({...enemy,x:PATH[0].x,y:PATH[0].y,segment:1});state.spawnLeft--;state.spawnTimer=.8;}}
  if(theme==='scrub'){
    state.dustClouds=(state.dustClouds||[]).map(c=>({...c,life:c.life-dt})).filter(c=>c.life>0);
    state.dustTimer=(state.dustTimer||0)-dt;
    if(state.dustTimer<=0){
      const tanks=state.enemies.filter(e=>e.kind==='tank'&&e.hp>0&&e.speed>0&&e.segment<PATH.length);
      if(tanks.length){const start=(state.dustCursor||0)%tanks.length;for(let i=0;i<Math.min(3,tanks.length);i++){const e=tanks[(start+i)%tanks.length];state.dustClouds.push({x:e.x,y:e.y,life:2});}state.dustCursor=(start+3)%tanks.length;}
      state.dustClouds=state.dustClouds.slice(-12);state.dustTimer=.75;
    }
  }
  function hitRubble(target,damage){
    if(theme!=='urban'||state.rubbleCleared||target.segment!==3||damage<=0)return;
    state.rubbleDamage=Math.min(200,(state.rubbleDamage||0)+Math.min(damage,Math.max(0,target.hp)));
    if(state.rubbleDamage>=200){state.rubbleCleared=true;events.push({type:'rubbleCleared'});}
  }
  state.suppression=Math.max(0,(state.suppression||0)-dt);
  // Timers live on enemies, so co-op snapshots and reconnects retain telegraphs.
  for(const e of state.enemies)if(e.boss&&e.hp>0){
    const before=e.bossClock||0,after=before+dt;e.bossClock=after;e.bossFlash=Math.max(0,(e.bossFlash||0)-dt);
    if(e.boss==='bossJuggernaut'&&crossedCycle(before,after,10)){e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.02);e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'repair'});}
    if(e.boss==='bossBomber'&&crossedCycle(before,after,12)){
      const damage=8*(1-.1*(state.plating||0))*(state.hp<state.maxHp*.5?Math.pow(.85,state.runPerks?.laststand||0):1);
      state.hp-=damage;e.bossFlash=.8;events.push({type:'bossAbility',boss:e.boss,ability:'bomb',damage});
    }
  }
  const commander=state.enemies.find(e=>e.boss==='bossCommander'&&e.hp>0),rally=commander&&bossPhase(commander)==='rally';
  if(theme==='arctic'&&!state.iceBroken){
    const tanks=state.enemies.filter(e=>e.hp>0&&e.kind==='tank'&&e.segment===5).length;
    if(tanks){state.iceStress=(state.iceStress||0)+tanks*dt;if(state.iceStress>=4){state.iceBroken=true;events.push({type:'iceBroken'});}}
  }
  for(const e of state.enemies){e.pinned=Math.max(0,(e.pinned||0)-dt);if(e.boss==='bossJuggernaut'&&e.hp>0)e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.002*dt);e.hp-=iceDamage(theme,e,dt,state.iceBroken);let distance=e.speed*dt*(theme==='arctic'&&state.iceBroken&&e.kind==='tank'&&e.segment===5?.75:1)*(e.pinned>0?.8:1)*enemySpeedFactor(theme,e)*(state.suppression>0?.5:1)*(e.kind!=='plane'&&!e.boss&&commander&&Math.hypot(e.x-commander.x,e.y-commander.y)<(rally?180:100)?(rally?1.4:1.25):1);while(distance>0&&e.segment<PATH.length){const target=PATH[e.segment],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<=distance){e.x=target.x;e.y=target.y;distance-=d;e.segment++;}else{e.x+=dx/d*distance;e.y+=dy/d*distance;distance=0;}}}
  if(state.gun>0&&state.running){
    state.gunTimer=Math.max(0,(state.gunTimer||0)-dt);
    if(state.gunTimer<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-900,e.y-400)<=170);if(target){target.hp-=5*state.gun;state.gunTimer=3;state.shots.push({x:900,y:400,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:'hero',color:'#fff'});}}
  }
  for(const tower of state.towers){tower.timer-=dt;const type=towerStats[tower.type],p=PADS[tower.pad],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;if(tower.timer<=0){const target=state.enemies.filter(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-p.x,e.y-p.y)<=targetingRange(theme,getTowerRange(tower),e,state.enemies,{sniper:tower.type===3,clouds:state.dustClouds||[]})).sort((a,b)=>b.segment-a.segment)[0];if(target){const owner=state.players[tower.ownerId];const perks=state.runPerks||{};tower.shotCount=(tower.shotCount||0)+1;
      const dealt=towerDamage(tower.type,tower.level,tower.level>=3?tower.branch:null,target.kind)*(target.boss==='bossIronclad'?.8:1)*bossWeaponFactor(target)*(1+.1*(perks.damage||0))*(target.kind==='tank'&&(tower.type===1||tower.type===3)?1+.2*(perks.tankhunter||0):1)*(tower.type===3&&tower.shotCount%4===0?1+.75*(perks.critical||0):1)*weaponDamageFactor(theme,target,Math.hypot(target.x-p.x,target.y-p.y),{recon:(owner?.skills?.recon||0)>0,rubbleCleared:state.rubbleCleared})*(1+.1*(owner?.skills?.engineer||0))*(owner?.active!==false&&owner?.overdrive>0?1.5:1);
      hitRubble(target,dealt);target.hp-=dealt;
      if(tower.type===0&&perks.pinning&&target.kind!=='plane')target.pinned=Math.max(target.pinned||0,2+perks.pinning-1);
      if(tower.type===2&&perks.chain){const other=state.enemies.find(e=>e!==target&&e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-target.x,e.y-target.y)<=85);if(other){other.hp-=dealt*.3*perks.chain*bossWeaponFactor(other);state.shots.push({x:target.x,y:target.y,tx:other.x,ty:other.y,life:shotDuration,duration:shotDuration,kind:2,color:'#8cc0a6'});}}tower.timer=type.interval*(branch?branch.interval:1)*(owner?.skills?.extra?.[2] ? .9 : 1)*Math.pow(.92,state.runPerks?.speed||0);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:tower.type,color:type.color});}}}
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];if(p.active===false)continue;p.shotTimer-=dt;if(state.wave>0&&p.shotTimer<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-p.x,e.y-p.y)<targetingRange(theme,150+(p.skills?.extra?.[1]?25:0)+(p.skills?.extra?.[8]?25:0)+(p.loadout?.equipped===4?30:0),e,state.enemies,{clouds:state.dustClouds||[]}));if(target){const dealt=(10+Math.min(p.level-1,20)+2*(p.skills?.assault||0)+(p.loadout?.equipped===1?3:0))*(target.boss==='bossIronclad'?.8:1)*bossWeaponFactor(target)*(1+.15*(state.runPerks?.hero||0))*weaponDamageFactor(theme,target,Math.hypot(target.x-p.x,target.y-p.y),{recon:(p.skills?.recon||0)>0,rubbleCleared:state.rubbleCleared});hitRubble(target,dealt);target.hp-=dealt;p.shotTimer=.65*(p.skills?.extra?.[0] ? .85 : 1);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:'hero',color:'#fff'});}}
  }
  state.enemies=state.enemies.filter(e=>{if(e.hp<=0){rewardTeam(state,e.reward,true);state.lootKills=(state.lootKills||0)+1;if(state.lootKills%5===0){const cacheReward=rewardTeam(state,15);if(state.individualSupplies)for(const p of Object.values(state.players))if(p.active!==false)p.lootCaches=(p.lootCaches||0)+1;events.push({type:'lootDrop',supplies:cacheReward});}return false;}if(e.segment>=PATH.length){const damage=e.damage*(1-.1*(state.plating||0))*(state.hp<state.maxHp*.5?Math.pow(.85,state.runPerks?.laststand||0):1);state.hp-=damage;events.push({type:'bunkerHit',kind:e.kind,damage});return false;}return true;});
  if(state.hp<=0){state.ended=true;state.running=false;events.push({type:'defeat'});}
  else if(state.running&&state.spawnLeft===0&&state.enemies.length===0){
    state.running=false;state.hp=Math.min(state.maxHp,state.hp+3*(state.repair||0)+12*(state.runPerks?.repair||0));
    if(state.individualSupplies)for(const player of Object.values(state.players))if(player.active!==false){
      const block=Math.floor((state.wave-1)/WAVE_COUNT),bit=1<<((state.wave-1)%WAVE_COUNT);
      if(block===0)player.completedWaveMask|=bit;else{const blocks=player.completedWaveBlocks||(player.completedWaveBlocks={});blocks[block]=(blocks[block]||0)|bit;}
    }
    rewardTeam(state,20);if(state.wave%5===0)state.pendingPerk=state.wave;
    events.push({type:'waveCleared',wave:state.wave,xp:waveXP(state.wave),victory:false});
  }
  return events;
}
