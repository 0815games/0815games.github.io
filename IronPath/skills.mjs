import {COMBOS,CAPSTONES} from './skill-combos.mjs?v=20261102-combos1';
// Existing five-rank builds remain valid. Optional bits add two specialist
// branches per path without changing or refunding existing investments.
export const SKILL_PATHS=[
  {id:'assault',name:'Assault',passive:'+2 soldier damage per rank',ability:'Airstrike',description:'Deal 35 damage to all enemies.',branches:[{name:'Quick Trigger',description:'Soldier fires 15% faster.'},{name:'Long Sight',description:'+25 soldier firing range.'}]},
  {id:'engineer',name:'Engineer',passive:'+10% damage for your towers per rank',ability:'Overdrive',description:'Your towers deal 50% extra damage for 10 seconds.',branches:[{name:'Field Mechanic',description:'Your towers fire 10% faster.'},{name:'Rapid Orders',description:'Your ability cooldown is 5 seconds shorter.'}]},
  {id:'logistics',name:'Logistics',passive:'+1 supply per enemy defeated per rank',ability:'Supply Drop',description:'Gain 30 supplies during a wave.',branches:[{name:'Scavenger',description:'+1 supply per enemy defeated.'},{name:'Extra Rations',description:'Supply Drop grants 15 extra supplies.'}]},
  {id:'medic',name:'Medic',passive:'+5 maximum bunker health per rank',ability:'Field Repair',description:'Restore 15 bunker health during a wave.',branches:[{name:'Reinforced Aid',description:'+10 shared bunker maximum health.'},{name:'Field Surgeon',description:'Field Repair restores 10 extra health.'}]},
  {id:'recon',name:'Recon',passive:'+10 soldier movement speed per rank',ability:'Suppression',description:'Slow enemies by 50% for 8 seconds.',branches:[{name:'Forward Observer',description:'+25 soldier firing range.'},{name:'Pinning Fire',description:'Suppression lasts 3 seconds longer.'}]}
];

// Each specialist preserves its passive bonus and offers an alternative active.
const VARIANTS={
 assault:[['Suppressive Bombardment','Deal 25 damage to all enemies and slow them for 3 seconds.'],['Precision Strike','Deal 80 damage to the strongest enemy.']],
 engineer:[['Sustained Overdrive','Your towers deal 35% more damage for 15 seconds.'],['Surge Overdrive','Your towers deal 80% more damage for 6 seconds.']],
 logistics:[['Heavy Airdrop','Gain 45 supplies; cooldown is 8 seconds longer.'],['Emergency Supply','Gain 20 supplies and repair the bunker by 6.']],
 medic:[['Heavy Repair','Restore 25 bunker health; cooldown is 8 seconds longer.'],['Triage','Restore 10 bunker health and gain 12 supplies.']],
 recon:[['Extended Suppression','Slow enemies by 50% for 12 seconds; cooldown is 8 seconds longer.'],['Targeted Disruption','Deal 20 damage to enemies and slow them for 4 seconds.']]
};
for(const path of SKILL_PATHS)path.branches.forEach((branch,i)=>{[branch.ability,branch.abilityDescription]=VARIANTS[path.id][i];});
// Five deep mastery chains and five bridges between neighboring disciplines.
const paths=SKILL_PATHS.map(p=>p.id);
const effects={damage:['soldier damage',''],tower:['tower damage','%'],supplies:['supplies per kill',''],health:['shared bunker health',''],movement:['soldier movement speed',''],heroRange:['soldier firing range',''],heroSpeed:['soldier firing speed','%'],towerSpeed:['tower firing speed','%'],start:['starting supplies',''],cooldown:['ability cooldown reduction',' seconds']};
const primary=[['damage',2],['tower',5],['supplies',1],['health',5],['movement',8]];
const masteryEffects=[[["damage",2],["heroSpeed",5],["heroRange",15],["damage",2],["heroSpeed",5]],[["tower",5],["towerSpeed",5],["cooldown",1],["tower",5],["towerSpeed",5]],[["supplies",1],["start",15],["cooldown",1],["supplies",1],["start",15]],[["health",5],["cooldown",1],["health",5],["start",10],["health",5]],[["movement",8],["heroRange",15],["heroSpeed",5],["movement",8],["cooldown",1]]];
const names=[['Sharpshooter','Battle Drills','Veteran Aim','Deadly Focus','War Hero'],['Calibration','Reinforced Turrets','Advanced Mechanics','Master Engineer','War Machine'],['Salvage Routes','Supply Lines','Quartermaster','Resource Network','War Economy'],['First Response','Field Hospital','Combat Medicine','Lifesaver','Bunker Guardian'],['Trailblazer','Forward Scout','Rapid Deployment','Pathfinder','Ghost Operative']];
const bridgeNames=['Siege Command','Combat Logistics','Humanitarian Supply','Rapid Response','Vanguard'];
const crossNames=['Supply Shock','Combat Medics','Mobile Supply','Combat Hospital','Recon Engineering'];
const describe=bonuses=>bonuses.map(([key,amount])=>`+${amount}${effects[key][1]} ${effects[key][0]}`).join(' and ')+'.';
export const WEB_NODES=[...paths.flatMap((path,i)=>names[i].map((name,tier)=>{const bonuses=[masteryEffects[i][tier]];return {id:i*5+tier,name,path,tier,kind:'mastery',bonuses,description:describe(bonuses)};})),...paths.flatMap((path,i)=>Array.from({length:3},(_,tier)=>{const other=paths[(i+1)%5],bonuses=[primary[i],primary[(i+1)%5]];return {id:25+i*3+tier,name:`${bridgeNames[i]} ${['I','II','III'][tier]}`,path,other,tier,kind:'hybrid',bonuses,description:describe(bonuses)};})),...paths.flatMap((path,i)=>Array.from({length:3},(_,tier)=>{const other=paths[(i+2)%5],bonuses=[primary[i],primary[(i+2)%5]];return {id:40+i*3+tier,name:`${crossNames[i]} ${['I','II','III'][tier]}`,path,other,tier,kind:'cross',bonuses,description:describe(bonuses)};}))];
for(const node of WEB_NODES){if(CAPSTONES[node.id])node.description+=` CAPSTONE: ${CAPSTONES[node.id]}`;const combo=COMBOS.find(c=>node.id>=c.id&&node.id<c.id+3);if(combo)node.description+=` COMBO (tier ${node.tier+1}): ${combo.description}`;}
export function webReady(build,node){return node.kind==='mastery'?build[node.path]>=3&&(node.tier===0||!!build.web?.[node.id-1]):build[node.path]>=2&&build[node.other]>=2&&(node.tier===0||!!build.web?.[node.id-1]);}
export function webRequirement(node){const path=SKILL_PATHS.find(p=>p.id===node.path).name;if(node.kind==='mastery')return node.tier?`Requires previous ${path} mastery.`:`Requires ${path} rank 3.`;const other=SKILL_PATHS.find(p=>p.id===node.other).name;return node.tier?'Requires previous hybrid node.':`Requires ${path} and ${other} rank 2.`;}
export function webBonuses(build){const result=Object.fromEntries(Object.keys(effects).map(key=>[key,0]));for(const node of WEB_NODES)if(build?.web?.[node.id])for(const [key,amount] of node.bonuses)result[key]+=amount;return result;}
export const DEFAULT_BUILD='0,0,0,0,0;assault';
const BUILD=/^([0-3],){4}[0-3];(assault|engineer|logistics|medic|recon)(;[01]{10}(;[12]|;[012];[01]{40}([01]{15})?)?)?$/;
export function parseBuild(value,level=1){
  if(typeof value!=='string'||!BUILD.test(value))value=DEFAULT_BUILD;
  const [ranks,active,bits='0000000000',variantText,webBits='0000000000000000000000000000000000000000']=value.split(';'),values=ranks.split(',').map(Number),extra=[...bits].map(Number),web=[...webBits.padEnd(55,'0')].map(Number),variant=Number(variantText)||0,activeIndex=SKILL_PATHS.findIndex(p=>p.id===active);
  const build={active:values.some(Boolean)?active:null,variant,...Object.fromEntries(SKILL_PATHS.map((p,i)=>[p.id,values[i]])),extra,web};
  if(values.reduce((a,b)=>a+b,0)+extra.reduce((a,b)=>a+b,0)+web.reduce((a,b)=>a+b,0)>Math.max(0,level-1)||extra.some((on,i)=>on&&values[Math.floor(i/2)]<2)||(variant&&(!extra[activeIndex*2+variant-1]||!values[activeIndex]))||WEB_NODES.some(node=>web[node.id]&&!webReady(build,node)))return parseBuild(DEFAULT_BUILD,level);
  return build;
}
export function encodeBuild(build){const bits=(build.extra||Array(10).fill(0)).join(''),allWeb=(build.web||Array(55).fill(0)).join('').padEnd(55,'0'),web=allWeb.slice(40).includes('1')?allWeb:allWeb.slice(0,40),variant=build.variant||0;return SKILL_PATHS.map(p=>build[p.id]).join(',')+';'+(build.active||'assault')+(web.includes('1')?`;${bits};${variant};${web}`:bits.includes('1')||variant?';'+bits+(variant?';'+variant:''):'');}
export function pointsLeft(build,level){return Math.max(0,level-1-SKILL_PATHS.reduce((n,p)=>n+build[p.id],0)-(build.extra||[]).reduce((a,b)=>a+b,0)-(build.web||[]).reduce((a,b)=>a+b,0));}
export function abilityName(build){const path=SKILL_PATHS.find(p=>p.id===build?.active);return path?(build.variant?path.branches[build.variant-1]?.ability||path.ability:path.ability):'No skill';}
