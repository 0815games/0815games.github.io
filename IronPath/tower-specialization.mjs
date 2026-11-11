// Tower specialization kits: the level-3 branch choice grows into a ranked
// kit (see TOWER-SPECIALIZATION-PLAN.md). Ranks DERIVE from the tower's
// level - nothing is stored that the protocol, the snapshots or the
// stale-command guard would have to learn:
//
//   level 3 -> rank I   (today's stat line, unchanged)
//   level 4 -> rank II  (one mechanic)
//   level 5 -> rank III (second mechanic; prestige keeps it forever)
//
// Rank mechanics speak vocabulary the simulation already understands: pins
// (e.pinned), marks (e.marked), chain, splash, crit cadence, dust clouds,
// upgrade economy. The two team auras (Heavy MG III, Siege Cannon II) are the
// deliberately strong picks - the campaign pressure gets recalibrated after
// they land.
import {bossPhase} from './boss-mechanics.mjs?v=20261031-finale1';

export function specializationRank(tower){
  if(!tower||!Number.isInteger(tower.level)||tower.level<3||!Number.isInteger(tower.branch))return 0;
  return tower.level>=5?3:tower.level===4?2:1;
}

// The kit identity of a tower, or null while unspecialized.
export function towerKit(tower){
  if(!tower||!Number.isInteger(tower.level)||tower.level<3||!Number.isInteger(tower.branch))return null;
  return {type:tower.type,branch:tower.branch,rank:specializationRank(tower)};
}
// A universal kit (branch 2 Veteran, branch 3 Boss Hunter) matches any tower
// type; a type-specific kit only its own.
const isKit=(tower,type,branch,rank)=>{
  const kit=towerKit(tower);
  return kit!==null&&(type===undefined||kit.type===type)&&kit.branch===branch&&kit.rank>=rank;
};

// ── firing hooks (called from the simulation's tower loop) ────────────────
// Veteran Kit II: a commanded crew fires 10% faster while its hero stands
// near the gun (120px).
export function towerIntervalFactor(state,tower,pad){
  if(!isKit(tower,undefined,2,2)||!pad)return 1;
  const hero=state.players?.[tower.ownerId];
  if(!hero||hero.active===false)return 1;
  return Math.hypot(hero.x-pad.x,hero.y-pad.y)<120?.9:1;
}
// Twin Flak III: +15% range against aircraft only.
export function towerRangeFactor(tower,enemy){
  return isKit(tower,2,0,3)&&enemy?.kind==='plane'?1.15:1;
}
// Long-range Flak III: a radar station ignores dust clouds.
export function towerIgnoresClouds(tower){return isKit(tower,2,1,3);}

// The kit damage factor of one shot. Pure per-shot state except the two team
// auras, which scan the field's towers (a handful of objects).
export function towerDamageBonus(state,tower,target){
  const kit=towerKit(tower);
  if(!kit||!target)return 1;
  let factor=1;
  // Marksman II/III: an intrinsic critical every THIRD shot (1.5x); rank III
  // criticals hit pinned enemies 50% harder.
  if(kit.type===3&&kit.branch===0&&kit.rank>=2&&tower.shotCount%3===0)
    factor*=kit.rank>=3&&target.pinned>0?2:1.5;
  // Long-range Flak II spots for the rifles: any rifle critical (the
  // marksman's third shot or the perk's fourth) deals +25% vs marked targets.
  if(kit.type===3&&target.marked>0){
    const crit=(kit.branch===0&&kit.rank>=2)?tower.shotCount%3===0:tower.shotCount%4===0&&(state.runPerks?.critical||0)>0;
    if(crit)factor*=1.25;
  }
  // Heavy MG III interdiction aura: pinned enemies take +10% from ALL towers.
  if(target.pinned>0&&state.towers?.some(t=>isKit(t,0,1,3)))factor*=1.1;
  // Siege Cannon II counter-battery: marked TANKS take +20% from all towers.
  if(target.marked>0&&target.kind==='tank'&&state.towers?.some(t=>isKit(t,1,1,2)))factor*=1.2;
  // Anti-armor Rifle III: consecutive hits on the same tank stack +8%, cap +40%.
  if(isKit(tower,3,1,3)&&target.kind==='tank')factor*=1+.08*(tower.aaStreak||0);
  // Boss Hunter II: +25% damage while the boss shield is up - the counter to
  // the shield phase's weapon reduction.
  if(kit.branch===3&&kit.rank>=2&&target.boss&&bossPhase(target)==='shield')factor*=1.25;
  return factor;
}

// Pins, marks, chain, splash, dust clearing and the boss bounty of one hit.
// `events` is the step's event array; `rewardTeam` is passed in by the
// simulation so this module stays dependency-free.
export function applyHitEffects(state,tower,target,dealt,events,rewardTeam){
  if(!target||target.hp<=0)return;
  // Twin MG II: suppression nest - every hit pins ground enemies for 1s.
  if(isKit(tower,0,0,2)&&target.kind!=='plane')target.pinned=Math.max(target.pinned||0,1);
  // Heavy MG II: interdiction - every hit pins for 2s.
  if(isKit(tower,0,1,2)&&target.kind!=='plane')target.pinned=Math.max(target.pinned||0,2);
  // Rapid Cannon II: autoloaders stagger tanks for half a second.
  if(isKit(tower,1,0,2)&&target.kind==='tank')target.pinned=Math.max(target.pinned||0,.5);
  // Anti-armor Rifle II: the tank breaker slows tanks for 2s.
  if(isKit(tower,3,1,2)&&target.kind==='tank')target.pinned=Math.max(target.pinned||0,2);
  // Anti-armor Rifle III streak bookkeeping (enemies get a lazy tag; snapshots
  // carry the harmless extra field).
  if(isKit(tower,3,1,3)&&target.kind==='tank'){
    if(!target._tag)target._tag=(state._tagSeq=(state._tagSeq||0)+1);
    if(tower.aaTag===target._tag)tower.aaStreak=Math.min((tower.aaStreak||0)+1,5);
    else{tower.aaTag=target._tag;tower.aaStreak=0;}
  }
  // Siege Cannon II: counter-battery marks tanks for 3s.
  if(isKit(tower,1,1,2)&&target.kind==='tank')target.marked=Math.max(target.marked||0,3);
  // Long-range Flak II: the spotting station marks any target for 3s.
  if(isKit(tower,2,1,2))target.marked=Math.max(target.marked||0,3);
  // Twin Flak II: barrage chain - one nearby enemy takes 20% of the hit.
  if(isKit(tower,2,0,2)){
    const other=state.enemies.find(e=>e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<=85);
    if(other){other.hp-=dealt*.2;state.shots?.push({x:target.x,y:target.y,tx:other.x,ty:other.y,life:.22,duration:.22,kind:2,color:'#8cc0a6'});}
  }
  // Rapid Cannon III: every sixth shot splashes 25% onto enemies within 40px.
  if(isKit(tower,1,0,3)&&tower.shotCount%6===0){
    for(const other of state.enemies)if(other!==target&&other.hp>0&&Math.hypot(other.x-target.x,other.y-target.y)<=40)other.hp-=dealt*.25;
  }
  // Siege Cannon III: the blast clears dust clouds at the impact point.
  if(isKit(tower,1,1,3)&&state.dustClouds?.length)state.dustClouds=state.dustClouds.filter(c=>Math.hypot(c.x-target.x,c.y-target.y)>60);
  // Boss Hunter III: the trophy gun pays +25 supplies for a boss it finishes.
  if(isKit(tower,undefined,3,3)&&target.boss&&!target.bountyPaid&&target.hp<=0){
    target.bountyPaid=true;
    rewardTeam?.(state,25,true);
    events?.push?.({type:'bounty'});
  }
}

// Veteran Kit III: a commanded crew's own upgrades cost 15% less.
export function upgradeCostFor(tower,cost){
  if(!Number.isFinite(cost))return cost;
  return isKit(tower,undefined,2,3)?Math.ceil(cost*.85):cost;
}
