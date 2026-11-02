import {SKILL_PATHS,WEB_NODES,webReady,webBonuses,pointsLeft,abilityName,parseBuild,encodeBuild} from './skills.mjs?v=20261102-results1';
import {COMBOS,CAPSTONES,comboTier} from './skill-combos.mjs?v=20261102-results1';
export const nodeKey=(path,rank)=>`${path}:${rank}`;
export function prerequisites(path,rank){
 if(rank===1)return [];
 if(rank===2||rank===3)return [nodeKey(path,rank-1)];
 if(rank===5||rank===6)return [nodeKey(path,2)];
 const n=WEB_NODES[rank-100];if(!n||n.path!==path)return [];
 if(n.tier>0)return [nodeKey(path,rank-1)];
 return n.kind==='mastery'?[nodeKey(path,3)]:[nodeKey(path,2),nodeKey(n.other,2)];
}
export function relatedNodes(selected){
 const current=nodeKey(selected.path,selected.rank),before=new Set(prerequisites(selected.path,selected.rank)),after=new Set();
 for(const path of SKILL_PATHS)for(const rank of [1,2,3,5,6])if(prerequisites(path.id,rank).includes(current))after.add(nodeKey(path.id,rank));
 for(const n of WEB_NODES)if(prerequisites(n.path,n.id+100).includes(current))after.add(nodeKey(n.path,n.id+100));
 return {current,before,after};
}
export function nodeMatches(build,level,path,rank,filter='all',pathFilter='all'){
 const n=rank>=100?WEB_NODES[rank-100]:null,relatedPath=path===pathFilter||n?.other===pathFilter;
 if(pathFilter!=='all'&&!relatedPath)return false;
 if(filter==='hybrid')return !!n&&n.kind!=='mastery';
 if(filter==='active')return rank===1||rank===5||rank===6;
 if(filter==='unlocked')return n?!!build.web?.[n.id]:rank>=5?!!build.extra?.[SKILL_PATHS.findIndex(p=>p.id===path)*2+rank-5]:build[path]>=rank;
 if(filter==='available'){
  if(pointsLeft(build,level)<1)return false;
  if(n)return !build.web?.[n.id]&&webReady(build,n);
  if(rank>=5)return !build.extra?.[SKILL_PATHS.findIndex(p=>p.id===path)*2+rank-5]&&build[path]>=2;
  return rank===build[path]+1;
 }
 return true;
}
export function skillBuildSummary(build,level){
 const w=webBonuses(build),e=build.extra||[],values=[
  `Soldier damage +${2*build.assault+w.damage}`,
  `Tower damage +${10*build.engineer+w.tower}%`,
  `Supplies per kill +${build.logistics+(e[4]?1:0)+w.supplies}`,
  `Bunker maximum health +${5*build.medic+(e[6]?10:0)+w.health}`,
  `Movement speed +${10*build.recon+w.movement}`,
  `Soldier range +${(e[1]?25:0)+(e[8]?25:0)+w.heroRange}`,
  `Soldier firing interval ${Math.round(100*Math.max(.5,1-w.heroSpeed/100)*(e[0]?.85:1))}% of base`,
  `Tower firing interval ${Math.round(100*Math.max(.5,1-w.towerSpeed/100)*(e[2]?.9:1))}% of base`,
  `Starting supplies +${w.start}`,
  `Ability cooldown reduction ${w.cooldown+(e[3]?5:0)}s (minimum 10s)`
 ];
 if(e[5])values.push('Supply Drop +15 supplies');if(e[7])values.push('Field Repair +10 health');if(e[9])values.push('Recon Suppression +3 seconds');
 const combos=COMBOS.map(c=>({name:c.name,tier:comboTier(build,c.id)})).filter(c=>c.tier>0).map(c=>`${c.name} ${c.tier}/3`);
 const caps=WEB_NODES.filter(n=>CAPSTONES[n.id]&&build.web?.[n.id]).map(n=>n.name);
 return {active:abilityName(build),points:pointsLeft(build,level),values,combos,caps};
}

// Reject stale edits rather than silently replacing another device's build.
export function canSaveSkillDraft(current,expected,build,levelOf){
 if(!current||!Number.isInteger(current.xp)||current.xp<0)return false;
 const level=levelOf(current.xp);return encodeBuild(parseBuild(current.skills,level))===expected&&encodeBuild(parseBuild(build,level))===build;
}
