// Fixed-step simulation. Browser and a future server can execute the same rules.
// Not a networking protocol or an anti-cheat system by itself.
import { WAVES, makeEnemy, towerDamage } from './combat.mjs?v=20261102-waves20';
import { waveXP } from './progression.mjs';
import {addSupplies} from './match.mjs?v=20261102-armory2';
export const STEP = 1/30;
export const PATH = [{x:0,y:130},{x:210,y:130},{x:210,y:320},{x:470,y:320},{x:470,y:150},{x:710,y:150},{x:710,y:400},{x:900,y:400}];
export const PADS = [{x:105,y:210},{x:285,y:210},{x:135,y:360},{x:350,y:390},{x:390,y:220},{x:550,y:225},{x:620,y:75},{x:790,y:230},{x:625,y:395},{x:810,y:335}];
const towerStats=[{range:125,interval:.55,color:'#d9d884'},{range:145,interval:1.4,color:'#e49b67'},{range:155,interval:.8,color:'#8cc0a6'},{range:210,interval:1.8,color:'#a9a4d4'}];
const branchStats=[[{interval:.55,range:1},{interval:1,range:1}],[{interval:.6,range:1},{interval:1,range:1}],[{interval:.55,range:1},{interval:1,range:1.45}],[{interval:.6,range:1},{interval:1,range:1.1}]];
export function getTowerRange(tower){
  const stats=towerStats[tower.type],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;
  return stats.range*(branch?branch.range:1);
}
export function createMatch(players){
  if(!Array.isArray(players)||players.length<1||players.length>2||new Set(players.map(p=>p.id)).size!==players.length)throw new Error('A match needs one or two unique players');
  const individualSupplies=players.length>1;
  // The shared bunker uses the strongest purchased upgrade of each type;
  // equipment and Medic bonuses from each player stack.
  const fortify=Math.max(...players.map(p=>p.loadout?.fortify||0)),plating=Math.max(...players.map(p=>p.loadout?.plating||0));
  const repair=Math.max(...players.map(p=>p.loadout?.repair||0)),gun=Math.max(...players.map(p=>p.loadout?.gun||0));
  const maxHp=100+fortify*10+players.reduce((n,p)=>n+5*(p.skills?.medic||0)+(p.skills?.extra?.[6]?10:0)+(p.loadout?.equipped===2?10:0),0);
  return {wave:0,hp:maxHp,maxHp,plating,repair,gun,gunTimer:0,lootKills:0,suppression:0,...(individualSupplies?{individualSupplies:true}:{money:125+(players[0].loadout?.equipped===6?25:0)}),enemies:[],towers:[],shots:[],running:false,spawnLeft:0,spawnIndex:0,spawnTimer:0,ended:false,players:Object.fromEntries(players.map(p=>[p.id,individualSupplies?{...p,money:125+(p.loadout?.equipped===6?25:0),completedWaveMask:0,lootCaches:0}:p]))};
}
// Co-op rewards are personal: when both players are active, each gets 65% of
// the base reward (rounded down); the owner's Logistics bonus remains intact.
// An absent guest earns nothing; the remaining host receives the solo base rate.
export const COOP_REWARD_RATE=.65;
export const COOP_ENEMY_HEALTH=1.5;
function activePlayers(state){return Object.keys(state.players).sort().filter(id=>state.players[id].active!==false);}
function rewardTeam(state,amount,enemyKill=false){
  const active=activePlayers(state),base=state.individualSupplies&&active.length>1?Math.floor(amount*COOP_REWARD_RATE):amount;
  if(state.individualSupplies){for(const id of active)addSupplies(state,id,base+(enemyKill?((state.players[id].skills?.logistics||0)+(state.players[id].skills?.extra?.[4]?1:0)):0));}
  else state.money+=base+(enemyKill?((Object.values(state.players)[0]?.skills?.logistics||0)+(Object.values(state.players)[0]?.skills?.extra?.[4]?1:0)):0);
  return base;
}
// Exactly one fixed step per call. Events are transient, not a record of validated rewards.
export function stepMatch(state){
  const events=[];if(state.ended)return events;const dt=STEP;
  // Purely visual trails persist long enough to reach 5 Hz co-op snapshots.
  const shotDuration=state.individualSupplies ? .55 : .24;
  state.shots=state.shots.filter(s=>(s.life-=dt)>0);
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];if(p.active===false)continue;const speed=150+10*(p.skills?.recon||0)+(p.loadout?.equipped===3?20:0);p.overdrive=Math.max(0,(p.overdrive||0)-dt);let {x:dx,y:dy}=p.direction;
    if(dx||dy){const len=Math.hypot(dx,dy);p.x+=dx/len*speed*dt;p.y+=dy/len*speed*dt;}
    else if(p.target){dx=p.target.x-p.x;dy=p.target.y-p.y;const len=Math.hypot(dx,dy),step=Math.min(len,speed*dt);if(len>0){p.x+=dx/len*step;p.y+=dy/len*step;}if(len<=step)p.target=null;}
    p.x=Math.max(12,Math.min(948,p.x));p.y=Math.max(12,Math.min(528,p.y));p.cooldown=Math.max(0,p.cooldown-dt);
  }
  if(state.running&&state.spawnLeft>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){const kind=WAVES[state.wave-1][state.spawnIndex++],enemy=makeEnemy(kind,state.wave);if(state.individualSupplies&&activePlayers(state).length>1){enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*COOP_ENEMY_HEALTH);}state.enemies.push({...enemy,x:PATH[0].x,y:PATH[0].y,segment:1});state.spawnLeft--;state.spawnTimer=.8;}}
  state.suppression=Math.max(0,(state.suppression||0)-dt);
  for(const e of state.enemies){let distance=e.speed*dt*(state.suppression>0?.5:1);while(distance>0&&e.segment<PATH.length){const target=PATH[e.segment],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<=distance){e.x=target.x;e.y=target.y;distance-=d;e.segment++;}else{e.x+=dx/d*distance;e.y+=dy/d*distance;distance=0;}}}
  if(state.gun>0&&state.running){
    state.gunTimer=Math.max(0,(state.gunTimer||0)-dt);
    if(state.gunTimer<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-900,e.y-400)<=170);if(target){target.hp-=5*state.gun;state.gunTimer=3;state.shots.push({x:900,y:400,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:'hero',color:'#fff'});}}
  }
  for(const tower of state.towers){tower.timer-=dt;const type=towerStats[tower.type],p=PADS[tower.pad],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;if(tower.timer<=0){const target=state.enemies.filter(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-p.x,e.y-p.y)<=getTowerRange(tower)).sort((a,b)=>b.segment-a.segment)[0];if(target){const owner=state.players[tower.ownerId];target.hp-=towerDamage(tower.type,tower.level,tower.level>=3?tower.branch:null,target.kind)*(1+.1*(owner?.skills?.engineer||0))*(owner?.active!==false&&owner?.overdrive>0?1.5:1);tower.timer=type.interval*(branch?branch.interval:1)*(owner?.skills?.extra?.[2] ? .9 : 1);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:tower.type,color:type.color});}}}
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];if(p.active===false)continue;p.shotTimer-=dt;if(state.wave>0&&p.shotTimer<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-p.x,e.y-p.y)<150+(p.skills?.extra?.[1]?25:0)+(p.skills?.extra?.[8]?25:0)+(p.loadout?.equipped===4?30:0));if(target){target.hp-=10+Math.min(p.level-1,20)+2*(p.skills?.assault||0)+(p.loadout?.equipped===1?3:0);p.shotTimer=.65*(p.skills?.extra?.[0] ? .85 : 1);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:shotDuration,duration:shotDuration,kind:'hero',color:'#fff'});}}
  }
  state.enemies=state.enemies.filter(e=>{if(e.hp<=0){rewardTeam(state,e.reward,true);state.lootKills=(state.lootKills||0)+1;if(state.lootKills%5===0){const cacheReward=rewardTeam(state,15);if(state.individualSupplies)for(const p of Object.values(state.players))if(p.active!==false)p.lootCaches=(p.lootCaches||0)+1;events.push({type:'lootDrop',supplies:cacheReward});}return false;}if(e.segment>=PATH.length){const damage=e.damage*(1-.1*(state.plating||0));state.hp-=damage;events.push({type:'bunkerHit',kind:e.kind,damage});return false;}return true;});
  if(state.hp<=0){state.ended=true;state.running=false;events.push({type:'defeat'});}
  else if(state.running&&state.spawnLeft===0&&state.enemies.length===0){state.running=false;if(state.repair)state.hp=Math.min(state.maxHp,state.hp+3*state.repair);if(state.individualSupplies){for(const player of Object.values(state.players))if(player.active!==false)player.completedWaveMask|=1<<(state.wave-1);}const victory=state.wave===WAVES.length;if(victory)state.ended=true;else rewardTeam(state,20);events.push({type:'waveCleared',wave:state.wave,xp:waveXP(state.wave),victory});}
  return events;
}
