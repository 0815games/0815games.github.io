// Pure client-side presentation recorder: emits fading footprints, tank
// tread cleats, and rail wheel wear behind moving ground units and players.
// Never mutates simulation state, coordinates, or hit targets.

const MAX_DEFAULT_MARKS=280;
const TELEPORT_DISTANCE=70;
const CLONE_MATCH_DISTANCE=45;
const MAX_STEPS_PER_SAMPLE=4;
const SOLDIER_STRIDE=13;
const INFANTRY_STRIDE=13;
const SCOUT_STRIDE=14;
const TANK_STRIDE=9.5;
const RAIL_STRIDE=12;

function enemyStampKind(enemy,theme){
  if(!enemy||enemy.kind==='plane'||enemy.boss==='bossBomber')return null;
  const heavy=enemy.kind==='tank'||enemy.boss==='bossHeavy'||enemy.boss==='bossIronclad'||enemy.boss==='bossJuggernaut'||Boolean(enemy.boss);
  if(theme==='junction'&&!heavy)return {kind:'rail',stride:RAIL_STRIDE,lifetime:3.6,scale:1};
  if(heavy)return {kind:'tread',stride:TANK_STRIDE,lifetime:6.2,scale:enemy.boss?1.25:.96};
  const stride=enemy.kind==='runner'||enemy.kind==='scout'?SCOUT_STRIDE:INFANTRY_STRIDE;
  return {kind:'boot',stride,lifetime:4.6,scale:.85};
}

function advanceAlong(marks,tracker,x,y,now,spec){
  const dx=x-tracker.x,dy=y-tracker.y,dist=Math.hypot(dx,dy);
  if(!Number.isFinite(dist)){tracker.x=x;tracker.y=y;tracker.carry=0;return;}
  if(dist>TELEPORT_DISTANCE){tracker.x=x;tracker.y=y;tracker.carry=0;return;}
  if(dist<.5)return;
  const ux=dx/dist,uy=dy/dist,angle=Math.atan2(uy,ux),stride=spec.stride;
  const prevCarry=tracker.carry||0;
  let total=prevCarry+dist;
  const count=Math.floor(total/stride);
  if(count>0){
    const firstOffset=Math.max(0,stride-prevCarry);
    const steps=Math.min(count,MAX_STEPS_PER_SAMPLE);
    const startIdx=count-steps;
    for(let s=startIdx;s<count;s++){
      const along=firstOffset+s*stride;
      const sx=tracker.x+ux*along,sy=tracker.y+uy*along;
      tracker.step=(tracker.step||0)+1;
      const side=tracker.step%2?1:-1;
      const px=-uy,py=ux;
      const ox=spec.kind==='boot'?px*side*3.2:0,oy=spec.kind==='boot'?py*side*3.2:0;
      marks.push({x:sx+ox,y:sy+oy,angle,kind:spec.kind,side,scale:spec.scale,bornAt:now,lifetime:spec.lifetime});
    }
    total%=stride;
  }
  tracker.x=x;tracker.y=y;tracker.carry=total;
}

export function createGroundTracks({maxMarks=MAX_DEFAULT_MARKS}={}){
  const limit=Math.max(20,Math.floor(maxMarks)||MAX_DEFAULT_MARKS);
  let marks=[],lastSampleAt=null;
  const playerTrackers=new Map();
  let enemyRefTrackers=new WeakMap();
  let enemyList=[];

  function reset(){
    marks=[];lastSampleAt=null;playerTrackers.clear();enemyRefTrackers=new WeakMap();enemyList=[];
  }

  function sample(state,nowSec=0,{paused=false,theme='road'}={}){
    const now=Number.isFinite(nowSec)?nowSec:0;
    if(!state||typeof state!=='object')return [];
    if(lastSampleAt!==null&&now<lastSampleAt-.25)reset();
    if(paused){
      if(lastSampleAt!==null&&marks.length){
        const shift=Math.max(0,now-lastSampleAt);
        if(shift>0)for(const m of marks)m.bornAt+=shift;
      }
      lastSampleAt=now;
      return marks.map(m=>({...m,alpha:Math.max(0,1-(now-m.bornAt)/m.lifetime)}));
    }
    lastSampleAt=now;
    const players=state.players&&typeof state.players==='object'?Object.values(state.players):[];
    const seenPlayers=new Set();
    for(const p of players){
      if(!p||p.active===false||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
      const id=String(p.id||'local');
      seenPlayers.add(id);
      let tr=playerTrackers.get(id);
      if(!tr){tr={x:p.x,y:p.y,carry:0,step:0};playerTrackers.set(id,tr);continue;}
      advanceAlong(marks,tr,p.x,p.y,now,{kind:'boot',stride:SOLDIER_STRIDE,lifetime:4.6,scale:.9});
    }
    for(const id of [...playerTrackers.keys()])if(!seenPlayers.has(id))playerTrackers.delete(id);

    const enemies=Array.isArray(state.enemies)?state.enemies:[];
    const nextList=[],used=new Set();
    for(const e of enemies){
      if(!e||!(e.hp>0)||!Number.isFinite(e.x)||!Number.isFinite(e.y))continue;
      const spec=enemyStampKind(e,theme);
      if(!spec)continue;
      let tr=enemyRefTrackers.get(e);
      if(!tr){
        let best=null,bestDist=CLONE_MATCH_DISTANCE;
        for(const cand of enemyList){
          if(used.has(cand))continue;
          if(cand.kind!==e.kind||cand.boss!==(e.boss||'')||cand.road!==(e.road||0))continue;
          const d=Math.hypot(e.x-cand.x,e.y-cand.y);
          if(d<bestDist){bestDist=d;best=cand;}
        }
        if(best){used.add(best);tr=best;enemyRefTrackers.set(e,tr);}
      }else{
        used.add(tr);
      }
      if(!tr){
        tr={x:e.x,y:e.y,carry:0,step:0,kind:e.kind,boss:e.boss||'',road:e.road||0};
        enemyRefTrackers.set(e,tr);
      }else{
        advanceAlong(marks,tr,e.x,e.y,now,spec);
      }
      nextList.push(tr);
    }
    enemyList=nextList;

    if(marks.length){
      marks=marks.filter(m=>now-m.bornAt<m.lifetime);
      if(marks.length>limit)marks=marks.slice(marks.length-limit);
    }
    return marks.map(m=>({...m,alpha:Math.max(0,1-(now-m.bornAt)/m.lifetime)}));
  }

  return {sample,reset};
}
