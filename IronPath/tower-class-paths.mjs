import {SKILL_PATH_MAP} from './skills.mjs?v=20261122-net1';

// Exclusive class upgrade paths on basic towers, separated completely from the
// 10 universal level-3 tower kits (tower-specialization.mjs).
// Every basic tower remains buildable by every player; once a soldier reaches
// class Rank 2 (and Tier 2 at Rank 3), each tower they own unlocks its class's
// extra 2-tier refinement path.
export const TOWER_CLASS_PATHS=Object.freeze({
  assault:{
    id:'assault',
    name:'Assault Ordnance',
    color:'#d89970',
    tiers:[
      {tier:1,cost:[55,70,60,65],damageMult:1.15,bossDamageMult:1.22,label:'Storm Mount',summary:'+15% tower damage (+22% vs bosses).'},
      {tier:2,cost:[85,105,95,100],damageMult:1.28,bossDamageMult:1.38,label:'Heavy Breach Mount',summary:'+28% tower damage (+38% vs bosses).'}
    ]
  },
  engineer:{
    id:'engineer',
    name:'Field Overclock',
    color:'#d7bd71',
    tiers:[
      {tier:1,cost:[55,70,60,65],intervalMult:.88,rangeMult:1.05,label:'Overclock Core I',summary:'Fires 12% faster and +5% range.'},
      {tier:2,cost:[85,105,95,100],intervalMult:.78,rangeMult:1.1,label:'Overclock Core II',summary:'Fires 22% faster and +10% range.'}
    ]
  },
  logistics:{
    id:'logistics',
    name:'Salvage Telemetry',
    color:'#b4c682',
    tiers:[
      {tier:1,cost:[50,65,55,60],killBounty:1,rangeMult:1.05,label:'Salvage Optics I',summary:'+1 supply per tower kill and +5% range.'},
      {tier:2,cost:[80,95,85,90],killBounty:2,rangeMult:1.1,label:'Salvage Optics II',summary:'+2 supplies per tower kill and +10% range.'}
    ]
  },
  medic:{
    id:'medic',
    name:'Triage Relay',
    color:'#8ac7b1',
    tiers:[
      {tier:1,cost:[55,70,60,65],damageMult:1.08,healEveryShots:12,label:'Triage Relay I',summary:'+8% tower damage; heals bunker +1 HP every 12 shots.'},
      {tier:2,cost:[85,105,95,100],damageMult:1.15,healEveryShots:8,label:'Triage Relay II',summary:'+15% tower damage; heals bunker +1 HP every 8 shots.'}
    ]
  },
  recon:{
    id:'recon',
    name:'Spotter Optics',
    color:'#8eafcf',
    tiers:[
      {tier:1,cost:[55,70,60,65],rangeMult:1.15,pinSeconds:.8,ignoresClouds:false,label:'Spotter Optics I',summary:'+15% range and pins non-air enemies for 0.8s.'},
      {tier:2,cost:[85,105,95,100],rangeMult:1.25,pinSeconds:1.4,ignoresClouds:true,label:'Spotter Optics II',summary:'+25% range, pins for 1.4s, and ignores dust clouds.'}
    ]
  },
  airDefense:{
    id:'airDefense',
    name:'Skyburst Guidance',
    color:'#7fc6de',
    tiers:[
      {tier:1,cost:[55,70,60,65],airMult:1.25,markDamageMult:1.14,markSeconds:4,label:'Skyburst Lock I',summary:'+25% damage vs aircraft; hits paint targets for 4s (+14% dmg vs Air-Defense marks).'},
      {tier:2,cost:[85,105,95,100],airMult:1.45,markDamageMult:1.26,markSeconds:6,label:'Skyburst Lock II',summary:'+45% damage vs aircraft; hits paint targets for 6s (+26% dmg vs Air-Defense marks).'}
    ]
  }
});

export function classPathConfig(classId){
  return classId&&Object.hasOwn(TOWER_CLASS_PATHS,classId)?TOWER_CLASS_PATHS[classId]:null;
}

export function classTierSpec(tower){
  if(!tower?.classPath||!tower?.classTier)return null;
  const cfg=classPathConfig(tower.classPath);
  return cfg?.tiers[(tower.classTier|0)-1]||null;
}

export function classPathCost(tower,tier){
  if(!tower||![1,2].includes(tier))return null;
  const idx=Number.isInteger(tower.type)?tower.type:0;
  const cfg=classPathConfig(tower.classPath)||TOWER_CLASS_PATHS.assault;
  return cfg.tiers[tier-1]?.cost[idx]??null;
}

export function classPathInvested(tower){
  if(!tower?.classPath||!Number.isInteger(tower.classTier)||tower.classTier<1)return 0;
  let total=0;
  for(let t=1;t<=Math.min(2,tower.classTier);t++)total+=towerClassPathCost(tower,tower.classPath,t)||0;
  return total;
}

export function towerClassPathCost(tower,classId,tier){
  const cfg=classPathConfig(classId);
  if(!cfg||![1,2].includes(tier)||!tower)return null;
  const idx=Number.isInteger(tower.type)?tower.type:0;
  const list=cfg.tiers[tier-1]?.cost;
  return Array.isArray(list)?(list[idx]??list[0]):null;
}

export function classUpgradeState(player,tower){
  const classId=player?.skills?.classId||null;
  const classRank=player?.skills?.rank||0;
  if(!tower)return {available:false,locked:false,maxed:false,reason:'missing-tower',classId:null,currentTier:0,nextTier:null,cost:null,spec:null};
  if(tower.ownerId&&player?.id&&tower.ownerId!==player.id){
    return {available:false,locked:true,maxed:false,reason:'not-owner',classId:tower.classPath||classId,currentTier:tower.classTier||0,nextTier:null,cost:null,spec:null};
  }
  const effectiveClass=tower.classPath||classId;
  const cfg=classPathConfig(effectiveClass);
  if(!cfg){
    return {available:false,locked:true,maxed:false,reason:'no-class',classId:null,currentTier:0,nextTier:1,cost:null,spec:null,requirement:'Choose a class in Skills at level 2.'};
  }
  const currentTier=tower.classPath===effectiveClass?(tower.classTier||0):0;
  if(currentTier>=2){
    return {available:false,locked:false,maxed:true,reason:'maxed',classId:effectiveClass,currentTier:2,nextTier:null,cost:null,spec:cfg.tiers[1]};
  }
  const nextTier=currentTier+1;
  const requiredRank=nextTier===1?2:3;
  const spec=cfg.tiers[nextTier-1];
  const cost=towerClassPathCost(tower,effectiveClass,nextTier);
  const className=SKILL_PATH_MAP[effectiveClass]?.name||effectiveClass;
  if(classRank<requiredRank){
    return {available:false,locked:true,maxed:false,reason:'rank-locked',requiredRank,classId:effectiveClass,currentTier,nextTier,cost,spec,requirement:`Requires ${className} rank ${requiredRank} in Skills.`};
  }
  return {available:true,locked:false,maxed:false,reason:'ready',requiredRank,classId:effectiveClass,currentTier,nextTier,cost,spec};
}

export function canUpgradeClassPath(player,tower){
  return classUpgradeState(player,tower).available;
}

export function classTowerRangeFactor(tower){
  const spec=classTierSpec(tower);
  return spec?.rangeMult||1;
}

export function classTowerIntervalFactor(tower){
  const spec=classTierSpec(tower);
  return spec?.intervalMult||1;
}

export function classTowerIgnoresClouds(tower){
  return !!classTierSpec(tower)?.ignoresClouds;
}

export function classTowerDamageFactor(tower,target){
  const spec=classTierSpec(tower);
  if(!spec||!target)return 1;
  let factor=spec.damageMult||1;
  if(spec.bossDamageMult&&target.boss)factor=spec.bossDamageMult;
  if(spec.airMult&&(target.baseKind==='plane'||target.kind==='plane'))factor*=spec.airMult;
  // Air-Defense class mark amplification ONLY applies to marks created by Air Defense.
  if(spec.markDamageMult&&target.marked>0&&target.markedByAirDefense)factor*=spec.markDamageMult;
  return factor;
}

export function applyClassTowerHitEffects(state,tower,target,events,rewardTeam,addSupplies){
  const spec=classTierSpec(tower);
  if(!spec||!target)return;
  if(spec.pinSeconds&&target.kind!=='plane'&&target.hp>0){
    target.pinned=Math.max(target.pinned||0,spec.pinSeconds);
  }
  if(spec.markSeconds&&target.hp>0){
    target.marked=Math.max(target.marked||0,spec.markSeconds);
    target.markedByAirDefense=true;
  }
  if(spec.killBounty&&target.hp<=0&&!target.classBountyPaid){
    target.classBountyPaid=true;
    if(state.individualSupplies){
      if(tower.ownerId&&state.players?.[tower.ownerId])addSupplies?.(state,tower.ownerId,spec.killBounty);
    }else if(rewardTeam){
      addSupplies?.(state,tower.ownerId,spec.killBounty);
    }
  }
  if(spec.healEveryShots&&(tower.shotCount||0)%spec.healEveryShots===0&&state.running&&state.hp>0&&state.hp<state.maxHp){
    state.hp=Math.min(state.maxHp,state.hp+1);
  }
}
