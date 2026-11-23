import {SKILL_PATHS,SKILL_PATH_MAP,WEB_NODES,NODES_PER_CLASS,webReady,webBonuses,pointsLeft,abilityName,parseBuild,encodeBuild,specialistUnlocked,hasCapstone} from './skills.mjs?v=20261123-blocke1';
import {COMBOS,CAPSTONES,comboTier} from './skill-combos.mjs?v=20261123-blocke1';
export const nodeKey=(path,rank)=>`${path}:${rank}`;
export function prerequisites(path,rank){
  if(rank===1)return [];
  if(rank===2||rank===3)return [nodeKey(path,rank-1)];
  const n=rank>=100?WEB_NODES[rank-100]:null;
  if(!n||n.path!==path)return [];
  if(n.kind==='specialist')return [nodeKey(path,2)];
  if(n.kind==='mastery')return n.tier===0?[nodeKey(path,3)]:[nodeKey(path,rank-1)];
  if(n.kind==='doctrine'){
    if(n.tier===0){
      const specNode=WEB_NODES.find(x=>x.path===path&&x.kind==='specialist'&&x.branch===n.branch);
      return specNode?[nodeKey(path,specNode.id+100)]:[nodeKey(path,2)];
    }
    return [nodeKey(path,rank-1)];
  }
  if(n.kind==='combo')return n.tier===0?[nodeKey(path,2)]:[nodeKey(path,rank-1)];
  return [];
}
export function relatedNodes(selected){
  const current=nodeKey(selected.path,selected.rank),before=new Set(prerequisites(selected.path,selected.rank)),after=new Set();
  for(const rank of [1,2,3])if(prerequisites(selected.path,rank).includes(current))after.add(nodeKey(selected.path,rank));
  for(const n of WEB_NODES.filter(x=>x.path===selected.path))if(prerequisites(n.path,n.id+100).includes(current))after.add(nodeKey(n.path,n.id+100));
  return {current,before,after};
}
export function nodeMatches(build,level,path,rank,filter='all',pathFilter='all'){
  if(pathFilter!=='all'&&path!==pathFilter)return false;
  if(build?.classId&&path!==build.classId&&pathFilter==='all')return false;
  const n=rank>=100?WEB_NODES[rank-100]:null;
  if(filter==='combo'||filter==='hybrid')return !!n&&n.kind==='combo';
  if(filter==='active')return rank===1||(!!n&&n.kind==='specialist');
  if(filter==='unlocked')return n?!!build.extra?.[n.slot]&&build.classId===n.path:((build.classId===path)&&(build.rank>=rank));
  if(filter==='available'){
    if(pointsLeft(build,level)<1)return false;
    if(n)return !build.extra?.[n.slot]&&webReady(build,n);
    if(!build.classId)return rank===1;
    return build.classId===path&&rank===build.rank+1;
  }
  return true;
}
export function skillBuildSummary(build,level){
  const w=webBonuses(build),cls=SKILL_PATH_MAP[build?.classId];
  const heroSpeedPct=Math.round(100*Math.max(.5,1-w.heroSpeed/100)*(specialistUnlocked(build,'assault',0)?.85:1));
  const towerSpeedPct=Math.round(100*Math.max(.5,1-w.towerSpeed/100)*(specialistUnlocked(build,'engineer',0)?.9:1));
  const cooldownRed=w.cooldown+(specialistUnlocked(build,'engineer',1)?5:0);
  const values=[
    `Class: ${cls?cls.name:'Unchosen'}`,
    `Soldier damage +${2*(build?.assault||0)+w.damage}`,
    `Tower damage +${10*(build?.engineer||0)+w.tower}%`,
    `Supplies per kill +${(build?.logistics||0)+(specialistUnlocked(build,'logistics',0)?1:0)+w.supplies}`,
    `Bunker maximum health +${5*(build?.medic||0)+(specialistUnlocked(build,'medic',0)?10:0)+w.health}`,
    `Movement speed +${10*(build?.recon||0)+w.movement}`,
    `Anti-air tower damage +${12*(build?.airDefense||0)+w.airDamage}%`,
    `Marked-target damage +${6*(build?.airDefense||0)+(specialistUnlocked(build,'airDefense',0)?12:0)+w.markDamage}%`,
    `Soldier range +${(specialistUnlocked(build,'assault',1)?25:0)+(specialistUnlocked(build,'recon',0)?25:0)+w.heroRange}`,
    `Soldier firing interval ${heroSpeedPct}% of base`,
    `Tower firing interval ${towerSpeedPct}% of base`,
    `Starting supplies +${w.start}`,
    `Ability cooldown reduction ${cooldownRed}s (minimum 10s)`
  ];
  if(specialistUnlocked(build,'logistics',1))values.push('Supply Drop +15 supplies');
  if(specialistUnlocked(build,'medic',1))values.push('Field Repair +10 health');
  if(specialistUnlocked(build,'recon',1))values.push('Recon Suppression +3 seconds');
  if(specialistUnlocked(build,'airDefense',1))values.push('Anti-air tower range +15% · Flak firing interval -10%');
  const tier=build?.classId?comboTier(build,build.classId):0;
  const combo=tier?COMBOS.find(c=>c.id===build.classId):null;
  const combos=combo?[`${combo.name} ${tier}/3`]:[];
  const cap=build?.classId&&hasCapstone(build)?CAPSTONES[build.classId]:null;
  const caps=cap?[cap.name]:[];
  return {active:abilityName(build),classId:build?.classId||null,rank:build?.rank||0,points:pointsLeft(build,level),values,combos,caps};
}

// Reject stale edits rather than silently replacing another device's build.
export function canSaveSkillDraft(current,expected,build,levelOf){
  if(!current||!Number.isInteger(current.xp)||current.xp<0)return false;
  const lvl=levelOf(current.xp);
  return encodeBuild(parseBuild(current.skills,lvl))===expected&&encodeBuild(parseBuild(build,lvl))===build;
}
