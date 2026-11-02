// All enemies follow the same route for this prototype; aircraft are a target type,
// not a shortcut. Wave composition is fixed so players can plan their defenses.
export const ENEMY_TYPES = {
  infantry: {label:'Infantry', hp:55, speed:53, reward:8, damage:10},
  runner: {label:'Scout', hp:42, speed:86, reward:9, damage:8},
  tank: {label:'Tank', hp:150, speed:32, reward:17, damage:20},
  plane: {label:'Aircraft', hp:70, speed:70, reward:12, damage:14}
};
export const WAVES = [
  ['infantry','infantry','infantry','infantry','infantry','infantry','infantry','infantry','infantry'],
  ['infantry','runner','infantry','runner','infantry','tank','infantry','runner','infantry','tank','runner','infantry'],
  ['infantry','runner','plane','infantry','tank','runner','plane','infantry','tank','runner','plane','infantry','tank','runner','plane'],
  ['runner','plane','tank','infantry','runner','plane','tank','runner','infantry','plane','tank','runner','plane','infantry','tank','plane','runner','tank'],
  ['tank','runner','plane','infantry','plane','tank','runner','plane','tank','infantry','runner','plane','tank','plane','runner','tank','plane','runner','tank','plane','tank'],
  ['tank','runner','plane','infantry','tank','plane','runner','tank','plane','runner','tank','plane','infantry','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane'],
  ['plane','tank','runner','plane','tank','infantry','plane','runner','tank','plane','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane','tank','runner','plane','tank','plane'],
  ['tank','plane','runner','tank','plane','runner','tank','plane','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane','tank'],
  ['plane','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane','tank','plane'],
  ['tank','plane','runner','tank','plane','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane','tank','plane','runner','tank','plane','tank','runner','plane','tank','plane','tank','runner','plane','tank','plane','tank']
,
  // Reinforcements: repeated mixed formations build toward two heavy assaults.
  ...[
    ['infantry','runner','plane','tank','runner','plane'],
    ['tank','infantry','plane','runner','tank','plane'],
    ['runner','plane','tank','runner','plane','tank'],
    ['plane','tank','infantry','tank','runner','plane'],
    ['tank','tank','plane','runner','tank','plane'],
    ['runner','tank','plane','infantry','tank','plane'],
    ['plane','runner','tank','plane','tank','runner'],
    ['tank','plane','tank','runner','infantry','plane'],
    ['plane','tank','runner','tank','plane','tank'],
    ['tank','plane','tank','runner','tank','plane']
  ].map((formation,index)=>Array.from({length:6+Math.floor(index/3)},()=>formation).flat())
];
export const WAVE_COUNT=WAVES.length;
export const MAX_WAVE_MASK=(2**WAVE_COUNT)-1;
// Multipliers apply to base damage, including upgrades. Every tower can hit every type.
export const DAMAGE_MULTIPLIERS = [
  {infantry:1.25,runner:1.25,tank:.4,plane:.6},
  {infantry:1,runner:1,tank:1.6,plane:.35},
  {infantry:1,runner:1,tank:.7,plane:2},
  {infantry:1.3,runner:1.3,tank:1.1,plane:.65}
];
export function makeEnemy(kind, wave) {
  const boss=BOSSES.find(b=>b.kind===kind),type=ENEMY_TYPES[kind];
  if(!type || !Number.isInteger(wave) || wave<1) throw new Error('Invalid enemy or wave');
  const hp=Math.round(type.hp*(1+(wave-1)*.23));
  if(boss){const maxHp=Math.round(hp*boss.hp);return {kind:boss.base,boss:boss.kind,hp:maxHp,maxHp,speed:type.speed*boss.speed,reward:boss.reward,damage:type.damage*boss.damage};}
  return {kind, hp, maxHp:hp, speed:type.speed, reward:type.reward, damage:type.damage};
}
export function towerDamage(type, level, branch, enemyKind) {
  const baseKind=BOSSES.find(b=>b.kind===enemyKind)?.base||enemyKind;
  const multiplier=DAMAGE_MULTIPLIERS[type]?.[baseKind];
  if(multiplier===undefined) throw new Error('Invalid tower or enemy');
  const base=[10,34,17,45][type];
  const armorBonus=type===3 && branch===1 && baseKind==='tank'?1.4:1;
  const branchDamage=branch===null?1:[[1,2.1,1.4],[1,2.1,1.4],[1,1.3,1.4],[1,2,1.4]][type][branch];
  return base*(1+(level-1)*.30)*branchDamage*multiplier*armorBonus;
}

// Authored opening followed by deterministic, bounded-size endless formations.
export const BOSSES=Object.freeze([
 {kind:'bossIronclad',label:'Ironclad',base:'tank',hp:4,speed:.9,damage:1.5,reward:75,description:'Armored: takes 20% less tower and soldier damage.'},
 {kind:'bossBomber',label:'Dread Bomber',base:'plane',hp:4,speed:.85,damage:2,reward:90,description:'Fast aerial boss: doubles its bunker damage.'},
 {kind:'bossJuggernaut',label:'Juggernaut',base:'tank',hp:5,speed:.8,damage:2,reward:110,description:'Self-repair: regenerates 0.2% of maximum HP per second.'},
 {kind:'bossCommander',label:'War Commander',base:'tank',hp:6,speed:.8,damage:2.5,reward:140,description:'Command aura: nearby ground enemies move 25% faster.'}
]);
for(const boss of BOSSES)ENEMY_TYPES[boss.kind]={...ENEMY_TYPES[boss.base],label:boss.label};
export function bossForWave(wave){return wave>0&&wave%5===0?BOSSES[(Math.floor(wave/5)-1)%BOSSES.length]:null;}
export function waveFormation(wave){
 if(!Number.isSafeInteger(wave)||wave<1)throw new Error('Invalid wave');
 const base=wave<=WAVE_COUNT?[...WAVES[wave-1]]:Array.from({length:Math.min(72,36+Math.floor((wave-21)/2))},(_,i)=>['tank','runner','plane','infantry','tank','plane'][(i+wave)%6]);
 const boss=bossForWave(wave);if(boss)base.push(boss.kind);return base;
}
