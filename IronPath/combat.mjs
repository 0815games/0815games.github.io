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
];
// Multipliers apply to base damage, including upgrades. Every tower can hit every type.
export const DAMAGE_MULTIPLIERS = [
  {infantry:1.25,runner:1.25,tank:.4,plane:.6},
  {infantry:1,runner:1,tank:1.6,plane:.35},
  {infantry:1,runner:1,tank:.7,plane:2},
  {infantry:1.3,runner:1.3,tank:1.1,plane:.65}
];
export function makeEnemy(kind, wave) {
  const type=ENEMY_TYPES[kind];
  if(!type || !Number.isInteger(wave) || wave<1) throw new Error('Invalid enemy or wave');
  const hp=Math.round(type.hp*(1+(wave-1)*.23));
  return {kind, hp, maxHp:hp, speed:type.speed, reward:type.reward, damage:type.damage};
}
export function towerDamage(type, level, branch, enemyKind) {
  const multiplier=DAMAGE_MULTIPLIERS[type]?.[enemyKind];
  if(multiplier===undefined) throw new Error('Invalid tower or enemy');
  const base=[10,34,17,45][type];
  const armorBonus=type===3 && branch===1 && enemyKind==='tank'?1.4:1;
  const branchDamage=branch===null?1:[[1,2.1],[1,2.1],[1,1.3],[1,2]][type][branch];
  return base*(1+(level-1)*.30)*branchDamage*multiplier*armorBonus;
}
