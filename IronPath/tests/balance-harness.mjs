// Headless balance & stress harness. Drives the real engine (no DOM, no
// network) with a deterministic "competent soldier" policy and reports how
// far each map/mode/gear combination survives. Used to tune difficulty:
//   node tests/balance-harness.mjs solo|coop|versus|twovtwo|campaign|all
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPlayer,applyCommand,advanceSector,getSupplies,TOWER_COSTS} from '../match.mjs';
import {getMap} from '../maps.mjs';
import {RUN_PERKS,perkOffers} from '../run-perks.mjs';
import {upgradeCost} from '../progression.mjs';
import {createVersus,applyVersus,stepVersus} from '../versus.mjs';
import {createFourCoop,createTwoVsTwo,applyFourCommand,stepFour} from '../four-modes.mjs';
import {createSoloDeployment} from '../solo-deployment.mjs';
import {CAMPAIGN} from '../campaign.mjs';

// ---------------------------------------------------------------- policy ----
const PERK_PRIORITY=['damage','speed','tankhunter','hero','critical','pinning','chain','bunker','salvage','repair','supplies','laststand'];
const BUILD_ROTATION=[0,1,0,2,0,1,3,0,2,1];
const TOWER_CAP=12; // stop upgrading here; costs outrun income naturally

export const GEARS={
  // storyProgress models the relics the account has earned: a veteran has
  // finished act I (relic I), an elite soldier has finished the shipped story
  // (relics I-III). The relics ride into the match via createSoloDeployment.
  rookie:{label:'rookie',level:1,skills:'0,0,0,0,0;assault',loadout:'0,0,0',storyProgress:0},
  veteran:{label:'veteran',level:12,skills:'2,2,1,0,0;assault',loadout:'1,1,1',storyProgress:4},
  elite:{label:'elite',level:25,skills:'3,3,2,2,1;engineer;1100000000',loadout:'3,3,10',storyProgress:12},
};
// `branch` is the autopilot's specialization policy (Punkt 8 balance gear):
// which kit every tower takes at level 2->3. Default 0 keeps every pinned
// result identical to the pre-kit runs. Branch 2 needs soldier level 5 and
// branch 3 needs 10 (match.mjs gates), so a rookie gear can only run 0/1.
const profile=gear=>({gender:'male',name:'Soldier',level:gear.level,skills:gear.skills,loadout:gear.loadout,storyProgress:gear.storyProgress||0});

// ------------------------------------------------------------- geometry ----
function pathLength(path){let l=0;for(let i=1;i<path.length;i++)l+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);return l;}
function roadPoint(map,t){ // fraction t along the longest road
  const paths=(map.paths||[map.path]).slice().sort((a,b)=>pathLength(b)-pathLength(a));
  return roadPointAt(map,paths[0],t);
}
function roadPointAt(map,path,t){ // fraction t along one given road
  const total=pathLength(path);let left=total*t;
  for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],seg=Math.hypot(b.x-a.x,b.y-a.y);
    if(left<=seg)return {x:a.x+(b.x-a.x)*(left/seg),y:a.y+(b.y-a.y)*(left/seg)};left-=seg;}
  return {...path[path.length-1]};
}
function coverageOrder(map){ // pad indices sorted by how much road sits in range
  const pts=[];
  for(const path of (map.paths||[map.path]))for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/20));
    for(let s=0;s<steps;s++)pts.push({x:a.x+(b.x-a.x)*s/steps,y:a.y+(b.y-a.y)*s/steps});
  }
  return map.pads.map((pad,i)=>({i,score:pts.reduce((n,p)=>n+(Math.hypot(p.x-pad.x,p.y-pad.y)<=135?1:0),0)}))
    .sort((a,b)=>b.score-a.score||a.i-b.i);
}

// -------------------------------------------------------------- autopilot ---
function choosePerk(ctx){
  const s=ctx.state,offers=perkOffers(s.mapId,s.pendingPerk);
  let best=0,bestRank=-1;
  offers.forEach((offer,idx)=>{const rank=PERK_PRIORITY.indexOf(RUN_PERKS[offer].key);if(rank>bestRank){bestRank=rank;best=idx;}});
  return best;
}
function nextEmptyPad(s,ctx){
  for(const entry of ctx.order)if(!s.towers.some(t=>t.pad===entry.i))return entry.i;
  return -1;
}
function spend(ctx,id){
  const s=ctx.state;
  for(let guard=4;guard-->0;){
    const money=getSupplies(s,id);
    const emptyPad=nextEmptyPad(s,ctx);
    const type=BUILD_ROTATION[ctx.buildSeq%BUILD_ROTATION.length];
    const buildCost=TOWER_COSTS[type];
    const own=s.towers.filter(t=>t.ownerId===id&&t.level<TOWER_CAP)
      .sort((a,b)=>upgradeCost(a.level)-upgradeCost(b.level)||a.pad-b.pad);
    const up=own[0],upCost=up?upgradeCost(up.level):Infinity;
    if(emptyPad>=0&&money>=buildCost+(s.wave>1?30:0)){
      const r=ctx.command(id,{type:'build',pad:emptyPad,towerType:type});
      if(r.ok){ctx.buildSeq++;continue;}
    }
    if(up&&money>=upCost){
      // The branch policy may be a number (every tower takes that kit) or a
      // function of the tower being upgraded - the balance suite uses the
      // latter to model a player who mixes kits sensibly per tower type.
      const branch=typeof ctx.branch==='function'?ctx.branch(up):ctx.branch??0;
      const r=ctx.command(id,up.level===2?{type:'upgrade',pad:up.pad,branch}:{type:'upgrade',pad:up.pad});
      if(r.ok)continue;
    }
    break;
  }
}
// Deterministic retreat: the live game draws a crypto-random next sector
// (createRandomMapId in maps.mjs). Balance runs must be reproducible, so the
// harness derives the next seed from the field it leaves - same id always
// yields the same retreat. Multiplayer and missions never retreat, so only
// the endless solo path is affected.
export function retreatMapFor(previous,_random,sector){
  let h=2166136261;for(const ch of String(previous))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
  const value=Math.imul(h,2654435761)>>>0;
  const tag=(Math.max(1,Math.min(4,Math.round(sector)))-1).toString(16);
  let id=`g3-${tag}${value.toString(16).padStart(8,'0')}`;
  if(id===previous)id=`g3-${tag}${((value+1)>>>0).toString(16).padStart(8,'0')}`;
  return id;
}
function pilot(ctx){
  const s=ctx.state;
  if(s.ended)return;
  if(s.mapId!==ctx.mapId){ // sector retreat changed the field: re-anchor
    ctx.mapId=s.mapId;ctx.map=getMap(s.mapId);ctx.order=coverageOrder(ctx.map);
    const mid=roadPoint(ctx.map,.55);
    for(const id of ctx.ids){const p=s.players[id];p.x=mid.x;p.y=mid.y;p.target=null;p.direction={x:0,y:0};}
  }
  if(s.pendingSector){advanceSector(s,retreatMapFor);return;}
  if(s.pendingPerk&&!s.running)ctx.command(ctx.ids[0],{type:'choosePerk',index:choosePerk(ctx)});
  if(s.pendingWave){const guest=ctx.ids.find(id=>id!==s.hostId);if(guest){ctx.command(guest,{type:'approveWave',requestId:s.waveRequestId});return;}}
  if(!s.running&&!s.pendingPerk&&!s.pendingSector&&!s.pendingWave&&s.wave<ctx.maxWaves)
    ctx.command(s.hostId&&s.individualSupplies?s.hostId:ctx.ids[0],{type:'startWave'});
  const paths=ctx.map.paths||[ctx.map.path];
  ctx.ids.forEach((id,idx)=>{
    const p=s.players[id];if(!p||p.active===false)return;
    if(p.cooldown<=0&&s.running&&p.skills?.active&&(s.enemies.length>=8||s.enemies.some(e=>e.boss)))
      ctx.command(id,{type:'airstrike'});
    // Anchor spread along the roads (multi-road fields split the squad); run
    // back when a leak approaches the bunker.
    const roads=(ctx.map.paths||[ctx.map.path]);
    const anchor=roadPointAt(ctx.map,roads[idx%roads.length],ctx.ids.length===1?.55:.3+.4*Math.floor(idx/roads.length)/Math.ceil(ctx.ids.length/roads.length-1||1)||.5);
    const leak=s.enemies.filter(e=>e.hp>0&&e.segment>(paths[e.road||0]||paths[0]).length*.72)
      .sort((a,b)=>b.segment-a.segment)[0];
    p.target=leak?{x:leak.x,y:leak.y}:anchor;
    p.direction={x:0,y:0};
    spend(ctx,id);
  });
}
function laneResult(ctx){
  const s=ctx.state;
  return {label:ctx.label,wave:s.wave,hp:Math.max(0,Math.round(s.hp)),maxHp:s.maxHp,
    ended:s.ended?'defeat':'alive',towers:s.towers.length,levels:s.towers.reduce((n,t)=>n+t.level,0),
    money:Math.round(s.individualSupplies?Object.values(s.players).reduce((n,p)=>n+(p.money||0),0):s.money),samples:ctx.samples.join(' ')};
}
function driveLanes(laneCtxs,step,tickLimit=30*60*120){
  let ticks=0;
  const active=()=>laneCtxs.some(ctx=>!ctx.state.ended&&ctx.state.wave<ctx.maxWaves);
  while(active()&&ticks<tickLimit){
    if(ticks%15===0){for(const ctx of laneCtxs)pilot(ctx);for(const ctx of laneCtxs)ctx.sync?.();}
    step();
    if(ticks%450===0)for(const ctx of laneCtxs)ctx.samples.push(`${ctx.state.wave}:${Math.round(ctx.state.hp)}`);
    ticks++;
  }
  return laneCtxs.map(laneResult);
}
function makeCtx(state,ids,label,maxWaves,command,branch){
  const map=getMap(state.mapId);
  const ctx={state,ids,label,maxWaves,command,buildSeq:0,samples:[],mapId:state.mapId,map,order:coverageOrder(map),branch};
  const mid=roadPoint(map,.55);
  for(const id of ids){const p=state.players[id];p.x=mid.x;p.y=mid.y;p.target=null;p.direction={x:0,y:0};}
  return ctx;
}

// ---------------------------------------------------------------- runners ---
export function runSolo(mapId,gear=GEARS.rookie,maxWaves=25){
  const player=createPlayer('p1',profile(gear),850,450);
  const state=createMatch([player],mapId);
  return driveLanes([makeCtx(state,['p1'],`solo ${mapId} ${gear.label}`,maxWaves,(id,c)=>applyCommand(state,id,c),gear.branch??0)],()=>stepMatch(state))[0];
}
export function runCoop(mapId,count,gear=GEARS.rookie,maxWaves=25){
  const players=Array.from({length:count},(_,i)=>createPlayer(`p${i+1}`,profile(gear),850,450));
  const state=createMatch(players,mapId);
  return driveLanes([makeCtx(state,players.map(p=>p.id),`coop${count} ${mapId} ${gear.label}`,maxWaves,(id,c)=>applyCommand(state,id,c),gear.branch??0)],()=>stepMatch(state))[0];
}
export function runVersus(mapId,gear=GEARS.rookie,maxWaves=25){
  const players=[createPlayer('host',profile(gear),850,450),createPlayer('guest',profile(gear),850,450)];
  const v=createVersus(players,mapId,'host');
  const cmd=(id,command)=>applyVersus(v,id,command);
  const ctxs=[makeCtx(v.lanes.host,['host'],`versus-host ${mapId} ${gear.label}`,maxWaves,cmd,gear.branch??0),
              makeCtx(v.lanes.guest,['guest'],`versus-guest ${mapId} ${gear.label}`,maxWaves,cmd,gear.branch??0)];
  ctxs[0].sync=()=>{if(v.pendingWave)applyVersus(v,'guest',{type:'approveWave',requestId:v.waveRequestId});};
  const results=driveLanes(ctxs,()=>stepVersus(v));
  return {mode:'versus',mapId,gear:gear.label,waves:results.map(r=>r.wave),ended:v.ended?v.endReason:'running',lanes:results};
}
export function runTwoVsTwo(gear=GEARS.rookie,maxWaves=25,mapId){
  const players=['a','b','c','d'].map(id=>createPlayer(id,profile(gear),850,450));
  const s=createTwoVsTwo(players,'a',[['a','b'],['c','d']],mapId);
  const cmd=(id,command)=>applyFourCommand(s,id,command);
  const ctxs=[makeCtx(s.lanes[0],['a','b'],`2v2-team1 ${gear.label}`,maxWaves,cmd,gear.branch??0),
              makeCtx(s.lanes[1],['c','d'],`2v2-team2 ${gear.label}`,maxWaves,cmd,gear.branch??0)];
  const sync=()=>{if(s.pending)for(const id of s.pending.required)if(!s.pending.approved.includes(id))applyFourCommand(s,id,{type:'approveWave',requestId:s.pending.id});};
  ctxs[0].sync=sync;ctxs[1].sync=sync;
  const results=driveLanes(ctxs,()=>stepFour(s));
  return {mode:'2v2',gear:gear.label,waves:results.map(r=>r.wave),ended:s.ended?s.endReason:'running',lanes:results};
}
export function runFourCoop(count,gear=GEARS.rookie,maxWaves=25,mapId){
  const players=Array.from({length:count},(_,i)=>createPlayer(`p${i+1}`,profile(gear),850,450));
  const s=createFourCoop(players,'p1',mapId);
  const cmd=(id,command)=>applyFourCommand(s,id,command);
  const ctx=makeCtx(s.match,players.map(p=>p.id),`four${count} ${gear.label}`,maxWaves,cmd,gear.branch??0);
  ctx.sync=()=>{if(s.pending)for(const id of s.pending.required)if(!s.pending.approved.includes(id))applyFourCommand(s,id,{type:'approveWave',requestId:s.pending.id});};
  return {...driveLanes([ctx],()=>stepFour(s))[0],mode:`four-coop-${count}`};
}
export function runCampaign(mission,gear=GEARS.rookie){
  const player=createPlayer('p1',profile(gear),850,450);
  const state=createSoloDeployment({player,mapId:mission.mapId,profile:profile(gear),workshopEnabled:false,campaign:{id:mission.id,threat:mission.threat}});
  const maxWaves=state.campaignContract.waves;
  const result=driveLanes([makeCtx(state,['p1'],`${mission.id}(${mission.threat}) ${gear.label}`,maxWaves,(id,c)=>applyCommand(state,id,c),gear.branch??0)],()=>stepMatch(state))[0];
  return {...result,won:!state.ended&&state.wave>=maxWaves,map:mission.mapId};
}

// ------------------------------------------------------------------- CLI ----
const SOLO_MAPS=['road','forest','outpost','g2-75eac321','g2-f16b92c3','g3-0b9f45231','g3-0d3e7f521','g3-17c2a4b8e'];
const VERSUS_MAPS=['road','forest','outpost','g2-75eac321','g3-0b9f45231','g3-2c1f0e3a2'];
const show=r=>console.log(typeof r.wave==='number'
  ?`${r.label.padEnd(46)} wave=${String(r.wave).padStart(2)} hp=${String(r.hp).padStart(3)}/${r.maxHp} towers=${String(r.towers).padStart(2)} lvls=${String(r.levels).padStart(2)} money=${String(r.money).padStart(4)} ${r.won!==undefined?(r.won?'WON':'LOST'):r.ended}`
  :`${r.mode} ${r.gear} waves=[${r.waves}] ${r.ended}`);
export function main(argv=process.argv.slice(2)){
  const [task='all',gearName='rookie']=argv;
  const gear=GEARS[gearName]||GEARS.rookie;
  if(task==='solo'||task==='all')for(const map of SOLO_MAPS)show(runSolo(map,gear));
  if(task==='coop'||task==='all'){for(const map of ['road','forest','outpost','g2-75eac321','g3-0b9f45231'])show(runCoop(map,2,gear));
    show(runFourCoop(3,gear));show(runFourCoop(4,gear));}
  if(task==='versus'||task==='all')for(const map of VERSUS_MAPS)show(runVersus(map,gear));
  if(task==='twovtwo'||task==='all')show(runTwoVsTwo(gear));
  if(task==='campaign'||task==='all')for(const mission of CAMPAIGN)show(runCampaign(mission,gear));
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href)main();
