// Fixed-step simulation. Browser and a future server can execute the same rules.
// Not a networking protocol or an anti-cheat system by itself.
import { WAVES, makeEnemy, towerDamage } from './combat.mjs';
import { waveXP } from './progression.mjs';
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
  return {wave:0,hp:100,money:125,enemies:[],towers:[],shots:[],running:false,spawnLeft:0,spawnIndex:0,spawnTimer:0,ended:false,players:Object.fromEntries(players.map(p=>[p.id,p]))};
}
// Exactly one fixed step per call. Events are transient, not a record of validated rewards.
export function stepMatch(state){
  const events=[];if(state.ended)return events;const dt=STEP;
  state.shots=state.shots.filter(s=>(s.life-=dt)>0);
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];let {x:dx,y:dy}=p.direction;
    if(dx||dy){const len=Math.hypot(dx,dy);p.x+=dx/len*150*dt;p.y+=dy/len*150*dt;}
    else if(p.target){dx=p.target.x-p.x;dy=p.target.y-p.y;const len=Math.hypot(dx,dy),step=Math.min(len,150*dt);if(len>0){p.x+=dx/len*step;p.y+=dy/len*step;}if(len<=step)p.target=null;}
    p.x=Math.max(12,Math.min(948,p.x));p.y=Math.max(12,Math.min(528,p.y));p.cooldown=Math.max(0,p.cooldown-dt);
  }
  if(state.running&&state.spawnLeft>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){const kind=WAVES[state.wave-1][state.spawnIndex++];state.enemies.push({...makeEnemy(kind,state.wave),x:PATH[0].x,y:PATH[0].y,segment:1});state.spawnLeft--;state.spawnTimer=.8;}}
  for(const e of state.enemies){let distance=e.speed*dt;while(distance>0&&e.segment<PATH.length){const target=PATH[e.segment],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<=distance){e.x=target.x;e.y=target.y;distance-=d;e.segment++;}else{e.x+=dx/d*distance;e.y+=dy/d*distance;distance=0;}}}
  for(const tower of state.towers){tower.timer-=dt;const type=towerStats[tower.type],p=PADS[tower.pad],branch=tower.level>=3?branchStats[tower.type][tower.branch]:null;if(tower.timer<=0){const target=state.enemies.filter(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-p.x,e.y-p.y)<=getTowerRange(tower)).sort((a,b)=>b.segment-a.segment)[0];if(target){target.hp-=towerDamage(tower.type,tower.level,tower.level>=3?tower.branch:null,target.kind);tower.timer=type.interval*(branch?branch.interval:1);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:.12,color:type.color});}}}
  for(const id of Object.keys(state.players).sort()){
    const p=state.players[id];p.shotTimer-=dt;if(state.wave>0&&p.shotTimer<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<PATH.length&&Math.hypot(e.x-p.x,e.y-p.y)<150);if(target){target.hp-=10+Math.min(p.level-1,20);p.shotTimer=.65;state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:.12,color:'#fff'});}}
  }
  state.enemies=state.enemies.filter(e=>{if(e.hp<=0){state.money+=e.reward;return false;}if(e.segment>=PATH.length){state.hp-=e.damage;events.push({type:'bunkerHit',kind:e.kind,damage:e.damage});return false;}return true;});
  if(state.hp<=0){state.ended=true;state.running=false;events.push({type:'defeat'});}
  else if(state.running&&state.spawnLeft===0&&state.enemies.length===0){state.running=false;const victory=state.wave===WAVES.length;if(victory)state.ended=true;else state.money+=20;events.push({type:'waveCleared',wave:state.wave,xp:waveXP(state.wave),victory});}
  return events;
}
