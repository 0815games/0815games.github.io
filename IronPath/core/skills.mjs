// V2 exclusive class system + 14-node single-class skill trees (84 nodes total).
// Soldiers unlock their class choice at level 2 (1st skill point) and spend up
// to MAX_CLASS_POINTS (17) points within that exclusive class tree.
export const MAX_CLASS_POINTS=17;
export const NODES_PER_CLASS=14;
export const DEFAULT_BUILD='v2;none';

export const SKILL_PATHS=[
  {id:'assault',name:'Assault',role:'Frontline firepower & airstrikes',passive:'+2 soldier damage per rank, +1 more per rank every six waves from wave 6',ability:'Airstrike',description:'Deal 35 damage to all enemies. From wave 6, the strike grows with every wave.',branches:[{name:'Quick Trigger',description:'Soldier fires 15% faster.'},{name:'Long Sight',description:'+25 soldier firing range.'}]},
  {id:'engineer',name:'Engineer',role:'Turret amplification & overdrive',passive:'+10% damage for your towers per rank',ability:'Overdrive',description:'Your towers deal 50% extra damage for 10 seconds.',branches:[{name:'Field Mechanic',description:'Your towers fire 10% faster.'},{name:'Rapid Orders',description:'Your ability cooldown is 5 seconds shorter.'}]},
  {id:'logistics',name:'Logistics',role:'Supply economy & field caches',passive:'+1 supply per enemy defeated per rank',ability:'Supply Drop',description:'Gain 30 supplies during a wave.',branches:[{name:'Scavenger',description:'+1 supply per enemy defeated.'},{name:'Extra Rations',description:'Supply Drop grants 15 extra supplies.'}]},
  {id:'medic',name:'Medic',role:'Bunker armor & field repair',passive:'+5 maximum bunker health per rank',ability:'Field Repair',description:'Restore 15 bunker health during a wave. From wave 6, the repair grows every six waves.',branches:[{name:'Reinforced Aid',description:'+10 shared bunker maximum health.'},{name:'Field Surgeon',description:'Field Repair restores 10 extra health.'}]},
  {id:'recon',name:'Recon',role:'Mobility, crowd control & disruption',passive:'+10 soldier movement speed per rank',ability:'Suppression',description:'Slow enemies by 50% for 8 seconds.',branches:[{name:'Forward Observer',description:'+25 soldier firing range.'},{name:'Pinning Fire',description:'Suppression lasts 3 seconds longer.'}]},
  {id:'airDefense',name:'Air Defense',role:'Anti-air burst & marked target focus',passive:'+12% tower damage vs aircraft and +6% damage vs Air-Defense-marked targets per rank',ability:'Sky Sweep',description:'Deal 45 flak damage to aircraft, 20 shrapnel damage to ground enemies, and mark all targets for 6 seconds. Grows from wave 6.',branches:[{name:'Target Painting',description:'+12% tower and soldier damage vs Air-Defense-marked targets.'},{name:'Flak Net',description:'+15% tower range vs aircraft and 10% faster Flak fire.'}]}
];

const VARIANTS={
  assault:[['Suppressive Bombardment','Deal 25 damage to all enemies and slow them for 3 seconds. From wave 6, the strike grows with every wave.'],['Precision Strike','Deal 80 damage to the strongest enemy. From wave 6, the strike grows with every wave.']],
  engineer:[['Sustained Overdrive','Your towers deal 35% more damage for 15 seconds.'],['Surge Overdrive','Your towers deal 80% more damage for 6 seconds.']],
  logistics:[['Heavy Airdrop','Gain 45 supplies; cooldown is 8 seconds longer.'],['Emergency Supply','Gain 20 supplies and repair the bunker by 6.']],
  medic:[['Heavy Repair','Restore 25 bunker health; cooldown is 8 seconds longer. From wave 6, the repair grows every six waves.'],['Triage','Restore 10 bunker health and gain 12 supplies. From wave 6, the repair grows every six waves.']],
  recon:[['Extended Suppression','Slow enemies by 50% for 12 seconds; cooldown is 8 seconds longer.'],['Targeted Disruption','Deal 20 damage to enemies and slow them for 4 seconds. From wave 6, the strike grows with every wave.']],
  airDefense:[['Spotter Barrage','Deal 25 damage to all enemies and mark them for 8 seconds (+12% damage taken from all towers).'],['Flak Curtain','Deal 60 damage to aircraft, pin enemies for 3 seconds, slow them, and mark them for 5 seconds; cooldown is 6 seconds longer.']]
};
for(const path of SKILL_PATHS)path.branches.forEach((branch,i)=>{[branch.ability,branch.abilityDescription]=VARIANTS[path.id][i];});

export const SKILL_PATH_MAP=Object.freeze(Object.fromEntries(SKILL_PATHS.map(p=>[p.id,p])));
const PATH_IDS=SKILL_PATHS.map(p=>p.id);
const BONUS_EFFECTS={
  damage:['soldier damage',''],
  tower:['tower damage','%'],
  supplies:['supplies per kill',''],
  health:['shared bunker health',''],
  movement:['soldier movement speed',''],
  heroRange:['soldier firing range',''],
  heroSpeed:['soldier firing speed','%'],
  towerSpeed:['tower firing speed','%'],
  start:['starting supplies',''],
  cooldown:['ability cooldown reduction',' seconds'],
  airDamage:['tower damage vs aircraft','%'],
  markDamage:['damage vs Air-Defense-marked targets','%']
};
const describeBonuses=bonuses=>bonuses.map(([k,n])=>`+${n}${BONUS_EFFECTS[k][1]} ${BONUS_EFFECTS[k][0]}`).join(' and ')+'.';

// Exactly 14 nodes per class (6 * 14 = 84 nodes total):
//  0, 1   : specialist branches (require class rank 2)
//  2..6   : mastery chain 1..5 (requires rank 3; slot 6 is the class capstone)
//  7, 8   : specialist 1 doctrines (require slot 0)
//  9, 10  : specialist 2 doctrines (require slot 1)
//  11..13 : class synergy combo tiers I..III (require rank 2)
const CLASS_TEMPLATES={
  assault:{
    mastery:[
      ['Sharpshooter',[['damage',2]]],
      ['Battle Drills',[['heroSpeed',5]]],
      ['Veteran Aim',[['heroRange',15]]],
      ['Deadly Focus',[['damage',2]]],
      ['War Hero',[['heroSpeed',5]],'Every fourth soldier shot chains 24 damage to another nearby enemy.']
    ],
    doctrines:[
      ['Fire Discipline',[['heroSpeed',5]]],
      ['Veteran Gunner',[['damage',3]]],
      ['Long Watch',[['heroRange',15]]],
      ['Deadeye',[['damage',3]]]
    ],
    combos:[
      ['Assault Barrage I',[['damage',2]],'Assault abilities launch a ground salvo: +8 damage and 2s pin to hit enemies.'],
      ['Assault Barrage II',[['heroSpeed',4]],'Ground salvo grows to +16 damage and 2.5s pin, plus +16 strike on the strongest enemy.'],
      ['Assault Barrage III',[['damage',2]],'Ground salvo grows to +24 damage and 3s pin, plus +24 strike on the strongest enemy.']
    ]
  },
  engineer:{
    mastery:[
      ['Calibration',[['tower',5]]],
      ['Reinforced Turrets',[['towerSpeed',5]]],
      ['Advanced Mechanics',[['cooldown',1]]],
      ['Master Engineer',[['tower',5]]],
      ['War Machine',[['towerSpeed',5]],'Every fourth shot from your towers deals 22 splash damage to a nearby enemy.']
    ],
    doctrines:[
      ['Precision Works',[['tower',5]]],
      ['Master Calibration',[['towerSpeed',5]]],
      ['Signal Corps',[['cooldown',1]]],
      ['Command Network',[['tower',5]]]
    ],
    combos:[
      ['Combat Grid I',[['tower',5]],'Engineer abilities grant +4 supplies and suppress enemies for 2s.'],
      ['Combat Grid II',[['towerSpeed',4]],'Engineer abilities grant +8 supplies and suppress enemies for 4s.'],
      ['Combat Grid III',[['tower',5]],'Engineer abilities grant +12 supplies and suppress enemies for 6s.']
    ]
  },
  logistics:{
    mastery:[
      ['Salvage Routes',[['supplies',1]]],
      ['Supply Lines',[['start',15]]],
      ['Quartermaster',[['cooldown',1]]],
      ['Resource Network',[['supplies',1]]],
      ['War Economy',[['start',15]],'Gain 12 personal supplies after each completed wave.']
    ],
    doctrines:[
      ['Battle Salvage',[['supplies',1]]],
      ['Supply Chain',[['start',15]]],
      ['Relief Stockpile',[['start',15]]],
      ['Emergency Reserve',[['cooldown',1]]]
    ],
    combos:[
      ['Mobile Convoy I',[['movement',8]],'Logistics abilities grant +15 movement speed for 5s and restore 3 bunker health over 6s.'],
      ['Mobile Convoy II',[['start',10]],'Logistics abilities grant +30 movement speed for 5s and restore 6 bunker health over 6s.'],
      ['Mobile Convoy III',[['supplies',1]],'Logistics abilities grant +45 movement speed for 5s and restore 9 bunker health over 6s.']
    ]
  },
  medic:{
    mastery:[
      ['First Response',[['health',5]]],
      ['Field Hospital',[['cooldown',1]]],
      ['Combat Medicine',[['health',5]]],
      ['Lifesaver',[['start',10]]],
      ['Bunker Guardian',[['health',5]],'Once per wave, restore 22 bunker health when it falls below 35%, if it survives the hit.']
    ],
    doctrines:[
      ['Field Triage',[['health',5]]],
      ['Surgeon General',[['cooldown',1]]],
      ['Hardened Bunker',[['health',5]]],
      ['Last Stand',[['start',15]]]
    ],
    combos:[
      ['Combat Hospital I',[['health',5]],'Medic abilities heal 1 bunker HP per living enemy (max 6) and grant +25% tower damage for 4s.'],
      ['Combat Hospital II',[['cooldown',1]],'Medic abilities heal up to 12 bunker HP and grant +25% tower damage for 5s.'],
      ['Combat Hospital III',[['health',5]],'Medic abilities heal up to 18 bunker HP and grant +25% tower damage for 6s.']
    ]
  },
  recon:{
    mastery:[
      ['Trailblazer',[['movement',8]]],
      ['Forward Scout',[['heroRange',15]]],
      ['Rapid Deployment',[['heroSpeed',5]]],
      ['Pathfinder',[['movement',8]]],
      ['Ghost Operative',[['cooldown',1]],'Every fourth soldier shot pins its target for 3 seconds.']
    ],
    doctrines:[
      ['Pathfinder Training',[['movement',8]]],
      ['Rapid Traverse',[['heroSpeed',5]]],
      ['Forward Sight',[['heroRange',15]]],
      ['Spotter Network',[['cooldown',1]]]
    ],
    combos:[
      ['Vanguard Sweep I',[['movement',8]],'Recon abilities pin up to 8 enemies for 3s and extend suppression by 1.5s.'],
      ['Vanguard Sweep II',[['heroRange',10]],'Recon abilities pin up to 8 enemies for 4s and extend suppression by 3s.'],
      ['Vanguard Sweep III',[['cooldown',1]],'Recon abilities pin up to 8 enemies for 5s and extend suppression by 4.5s.']
    ]
  },
  airDefense:{
    mastery:[
      ['Radar Sweep',[['airDamage',10]]],
      ['Quick Reload',[['towerSpeed',5]]],
      ['Spotter Link',[['markDamage',8]]],
      ['Sky Shield',[['airDamage',10]]],
      ['Sky Sovereign',[['markDamage',10]],'Air-Defense-marked targets take +20% bonus damage and every fifth soldier shot refreshes a 3s mark.']
    ],
    doctrines:[
      ['Tracer Optics',[['markDamage',8]]],
      ['Priority Lock',[['damage',3]]],
      ['Flak Calibration',[['airDamage',10]]],
      ['Airspace Denial',[['towerSpeed',5]]]
    ],
    combos:[
      ['Flak Resonance I',[['airDamage',8]],'Air Defense abilities deal +12 flak blast damage to aircraft (+6 to heavy ground) and mark for 4s.'],
      ['Flak Resonance II',[['cooldown',1]],'Air Defense abilities deal +24 flak blast damage to aircraft (+12 to heavy ground) and mark for 5s.'],
      ['Flak Resonance III',[['markDamage',8]],'Air Defense abilities deal +36 flak blast damage to aircraft (+18 to heavy ground) and mark for 6s.']
    ]
  }
};

export const WEB_NODES=[];
for(let c=0;c<SKILL_PATHS.length;c++){
  const path=SKILL_PATHS[c],tpl=CLASS_TEMPLATES[path.id],base=c*NODES_PER_CLASS;
  path.branches.forEach((branch,j)=>{
    WEB_NODES.push({
      id:base+j,slot:j,path:path.id,kind:'specialist',branch:j,tier:0,
      name:branch.name,ability:branch.ability,bonuses:[],
      description:`${branch.description} Unlocks ${branch.ability}: ${branch.abilityDescription}`
    });
  });
  tpl.mastery.forEach(([name,bonuses,capstone],tier)=>{
    const slot=2+tier;
    WEB_NODES.push({
      id:base+slot,slot,path:path.id,kind:'mastery',tier,capstone:tier===4,
      name,bonuses,description:describeBonuses(bonuses)+(capstone?` CAPSTONE: ${capstone}`:'')
    });
  });
  tpl.doctrines.forEach(([name,bonuses],idx)=>{
    const branch=Math.floor(idx/2),tier=idx%2,slot=7+idx;
    WEB_NODES.push({
      id:base+slot,slot,path:path.id,kind:'doctrine',branch,tier,
      name,bonuses,description:describeBonuses(bonuses)
    });
  });
  tpl.combos.forEach(([name,bonuses,comboText],tier)=>{
    const slot=11+tier;
    WEB_NODES.push({
      id:base+slot,slot,path:path.id,kind:'combo',tier,
      name,bonuses,description:`${describeBonuses(bonuses)} SYNERGY (tier ${tier+1}): ${comboText}`
    });
  });
}

export function classNodes(classId){
  const idx=PATH_IDS.indexOf(classId);
  return idx<0?[]:WEB_NODES.slice(idx*NODES_PER_CLASS,(idx+1)*NODES_PER_CLASS);
}

const V2_REGEX=/^v2;(none|(assault|engineer|logistics|medic|recon|airDefense);([1-3]);([0-2]);([01]{14}))$/;
const LEGACY_REGEX=/^([0-3],){4}[0-3];(assault|engineer|logistics|medic|recon)(;[01]{10}(;[12]|;[012];[01]{40}([01]{15}([01]{20})?)?)?)?$/;

export function isV2BuildString(value){
  return typeof value==='string'&&V2_REGEX.test(value);
}

export function isLegacyBuildString(value){
  if(typeof value!=='string'||!value||value==='0,0,0,0,0;assault')return false;
  return LEGACY_REGEX.test(value);
}

function legacyStringHasSpentPoints(value){
  if(!LEGACY_REGEX.test(value))return false;
  const parts=value.split(';');
  if(parts[0].split(',').some(n=>Number(n)>0))return true;
  if(parts[2]&&parts[2].includes('1'))return true;
  if(parts[4]&&parts[4].includes('1'))return true;
  return false;
}

export function webReady(build,node){
  if(!build||!node||build.classId!==node.path)return false;
  const rank=build.rank||0,extra=build.extra||[];
  if(node.kind==='specialist')return rank>=2;
  if(node.kind==='mastery')return rank>=3&&(node.tier===0||!!extra[node.slot-1]);
  if(node.kind==='doctrine')return rank>=2&&!!extra[node.branch]&&(node.tier===0||!!extra[node.slot-1]);
  if(node.kind==='combo')return rank>=2&&(node.tier===0||!!extra[node.slot-1]);
  return false;
}

export function webRequirement(node){
  const path=SKILL_PATH_MAP[node?.path];
  if(!path)return '';
  if(node.kind==='specialist')return `Requires ${path.name} rank 2.`;
  if(node.kind==='mastery'){
    if(node.tier===0)return `Requires ${path.name} rank 3.`;
    return `Requires ${WEB_NODES[node.id-1].name}.`;
  }
  if(node.kind==='doctrine'){
    if(node.tier===0)return `Requires ${path.branches[node.branch].name} (${path.branches[node.branch].ability}).`;
    return `Requires ${WEB_NODES[node.id-1].name}.`;
  }
  if(node.kind==='combo'){
    if(node.tier===0)return `Requires ${path.name} rank 2.`;
    return `Requires ${WEB_NODES[node.id-1].name}.`;
  }
  return '';
}

export function emptyBuild({legacy=false,legacyHadSpent=false}={}){
  const ranks=Object.fromEntries(PATH_IDS.map(id=>[id,0]));
  return {
    version:2,
    classId:null,
    active:null,
    variant:0,
    rank:0,
    ...ranks,
    extra:Array(NODES_PER_CLASS).fill(0),
    web:Array(WEB_NODES.length).fill(0),
    legacy,
    legacyHadSpent
  };
}

export function parseBuild(value,level=1){
  const maxAllowed=Math.min(MAX_CLASS_POINTS,Math.max(0,(Number.isInteger(level)?level:1)-1));
  if(typeof value!=='string'||!value||value==='v2;none'){
    return emptyBuild({legacy:false,legacyHadSpent:false});
  }
  if(LEGACY_REGEX.test(value)){
    // Legacy builds are cleanly reset to v2;none so players choose 1 of 6
    // classes with 100% of their earned points returned. XP & gear stay intact.
    return emptyBuild({legacy:true,legacyHadSpent:legacyStringHasSpentPoints(value)});
  }
  const match=V2_REGEX.exec(value);
  if(!match)return emptyBuild({legacy:false,legacyHadSpent:false});
  if(match[1]==='none')return emptyBuild({legacy:false,legacyHadSpent:false});
  const classId=match[2],rank=Number(match[3]),variant=Number(match[4]),bits=[...match[5]].map(Number);
  const classIndex=PATH_IDS.indexOf(classId);
  const spent=rank+bits.reduce((a,b)=>a+b,0);
  if(spent>maxAllowed)return emptyBuild({legacy:false,legacyHadSpent:false});
  if(variant&&(bits[variant-1]!==1||rank<2))return emptyBuild({legacy:false,legacyHadSpent:false});
  const build=emptyBuild({legacy:false,legacyHadSpent:false});
  build.classId=classId;
  build.active=classId;
  build.variant=variant;
  build.rank=rank;
  build[classId]=rank;
  build.extra=bits;
  for(let slot=0;slot<NODES_PER_CLASS;slot++)build.web[classIndex*NODES_PER_CLASS+slot]=bits[slot];
  const nodes=classNodes(classId);
  for(const node of nodes){
    if(build.extra[node.slot]&&!webReady(build,node))return emptyBuild({legacy:false,legacyHadSpent:false});
  }
  return build;
}

export function encodeBuild(build){
  if(!build||!build.classId||!PATH_IDS.includes(build.classId)||!build.rank)return DEFAULT_BUILD;
  const rank=Math.max(1,Math.min(3,build.rank|0));
  const extra=Array.from({length:NODES_PER_CLASS},(_,i)=>build.extra?.[i]?1:0);
  const variant=(build.variant===1&&extra[0])||(build.variant===2&&extra[1])?build.variant:0;
  return `v2;${build.classId};${rank};${variant};${extra.join('')}`;
}

export function pointsSpent(build){
  if(!build||!build.classId)return 0;
  return (build.rank||0)+(build.extra||[]).reduce((a,b)=>a+(b?1:0),0);
}

export function pointsLeft(build,level=1){
  const total=Math.min(MAX_CLASS_POINTS,Math.max(0,(Number.isInteger(level)?level:1)-1));
  return Math.max(0,total-pointsSpent(build));
}

export function hasCapstone(build){
  return !!build?.classId&&build?.extra?.[6]===1;
}

export function specialistUnlocked(build,classId,branchIndex){
  return build?.classId===classId&&build?.extra?.[branchIndex]===1;
}

export function syncBuildWeb(build){
  if(!build)return build;
  build.web=Array(WEB_NODES.length).fill(0);
  for(const id of PATH_IDS)build[id]=0;
  if(!build.classId||!PATH_IDS.includes(build.classId)){
    build.classId=null;build.active=null;build.variant=0;build.rank=0;
    build.extra=Array(NODES_PER_CLASS).fill(0);
    return build;
  }
  const idx=PATH_IDS.indexOf(build.classId);
  build.active=build.classId;
  build[build.classId]=build.rank;
  for(let slot=0;slot<NODES_PER_CLASS;slot++)build.web[idx*NODES_PER_CLASS+slot]=build.extra?.[slot]?1:0;
  return build;
}

export function webBonuses(build){
  const result=Object.fromEntries(Object.keys(BONUS_EFFECTS).map(key=>[key,0]));
  if(!build?.classId)return result;
  for(const node of classNodes(build.classId)){
    if(build.extra?.[node.slot]){
      for(const [key,amount] of node.bonuses)result[key]+=amount;
    }
  }
  return result;
}

export function abilityName(build){
  const path=SKILL_PATH_MAP[build?.active||build?.classId];
  if(!path)return 'No skill';
  return build?.variant?path.branches[build.variant-1]?.ability||path.ability:path.ability;
}
