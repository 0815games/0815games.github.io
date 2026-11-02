// Existing five-rank builds remain valid. Optional bits add two specialist
// branches per path without changing or refunding existing investments.
export const SKILL_PATHS=[
  {id:'assault',name:'Assault',passive:'+2 soldier damage per rank',ability:'Airstrike',description:'Deal 35 damage to all enemies.',branches:[{name:'Quick Trigger',description:'Soldier fires 15% faster.'},{name:'Long Sight',description:'+25 soldier firing range.'}]},
  {id:'engineer',name:'Engineer',passive:'+10% damage for your towers per rank',ability:'Overdrive',description:'Your towers deal 50% extra damage for 10 seconds.',branches:[{name:'Field Mechanic',description:'Your towers fire 10% faster.'},{name:'Rapid Orders',description:'Your ability cooldown is 5 seconds shorter.'}]},
  {id:'logistics',name:'Logistics',passive:'+1 supply per enemy defeated per rank',ability:'Supply Drop',description:'Gain 30 supplies during a wave.',branches:[{name:'Scavenger',description:'+1 supply per enemy defeated.'},{name:'Extra Rations',description:'Supply Drop grants 15 extra supplies.'}]},
  {id:'medic',name:'Medic',passive:'+5 maximum bunker health per rank',ability:'Field Repair',description:'Restore 15 bunker health during a wave.',branches:[{name:'Reinforced Aid',description:'+10 shared bunker maximum health.'},{name:'Field Surgeon',description:'Field Repair restores 10 extra health.'}]},
  {id:'recon',name:'Recon',passive:'+10 soldier movement speed per rank',ability:'Suppression',description:'Slow enemies by 50% for 8 seconds.',branches:[{name:'Forward Observer',description:'+25 soldier firing range.'},{name:'Pinning Fire',description:'Suppression lasts 3 seconds longer.'}]}
];
export const DEFAULT_BUILD='0,0,0,0,0;assault';
const BUILD=/^([0-3],){4}[0-3];(assault|engineer|logistics|medic|recon)(;[01]{10})?$/;
export function parseBuild(value,level=1){
  if(typeof value!=='string'||!BUILD.test(value))value=DEFAULT_BUILD;
  const [ranks,active,bits='0000000000']=value.split(';'),values=ranks.split(',').map(Number),extra=[...bits].map(Number);
  if(values.reduce((a,b)=>a+b,0)+extra.reduce((a,b)=>a+b,0)>Math.max(0,level-1)||extra.some((on,i)=>on&&values[Math.floor(i/2)]<2))return parseBuild(DEFAULT_BUILD,level);
  return {active,...Object.fromEntries(SKILL_PATHS.map((p,i)=>[p.id,values[i]])),extra};
}
export function encodeBuild(build){const bits=(build.extra||Array(10).fill(0)).join('');return SKILL_PATHS.map(p=>build[p.id]).join(',')+';'+build.active+(bits.includes('1')?';'+bits:'');}
export function pointsLeft(build,level){return Math.max(0,level-1-SKILL_PATHS.reduce((n,p)=>n+build[p.id],0)-(build.extra||[]).reduce((a,b)=>a+b,0));}
export function abilityName(build){return SKILL_PATHS.find(p=>p.id===build?.active)?.ability||'Airstrike';}
