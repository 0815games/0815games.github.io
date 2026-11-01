// Compact, version-independent build format for player and party profiles.
export const SKILL_PATHS=[
  {id:'assault',name:'Assault',passive:'+2 soldier damage per rank',ability:'Airstrike',description:'Deal 35 damage to all enemies.'},
  {id:'engineer',name:'Engineer',passive:'+10% damage for your towers per rank',ability:'Overdrive',description:'Your towers deal 50% extra damage for 10 seconds.'},
  {id:'logistics',name:'Logistics',passive:'+1 supply per enemy defeated per rank',ability:'Supply Drop',description:'Gain 30 supplies during a wave.'},
  {id:'medic',name:'Medic',passive:'+5 maximum bunker health per rank',ability:'Field Repair',description:'Restore 15 bunker health during a wave.'},
  {id:'recon',name:'Recon',passive:'+10 soldier movement speed per rank',ability:'Suppression',description:'Slow enemies by 50% for 8 seconds.'}
];
export const DEFAULT_BUILD='0,0,0,0,0;assault';
export function parseBuild(value,level=1){
  if(typeof value!=='string'||!/^([0-3],){4}[0-3];(assault|engineer|logistics|medic|recon)$/.test(value))value=DEFAULT_BUILD;
  const [ranks,active]=value.split(';'),values=ranks.split(',').map(Number);
  if(values.reduce((a,b)=>a+b,0)>Math.max(0,level-1))return parseBuild(DEFAULT_BUILD,level);
  return {active,...Object.fromEntries(SKILL_PATHS.map((p,i)=>[p.id,values[i]]))};
}
export function encodeBuild(build){return SKILL_PATHS.map(p=>build[p.id]).join(',')+';'+build.active;}
export function pointsLeft(build,level){return Math.max(0,level-1-SKILL_PATHS.reduce((n,p)=>n+build[p.id],0));}
export function abilityName(build){return SKILL_PATHS.find(p=>p.id===build?.active)?.ability||'Airstrike';}
