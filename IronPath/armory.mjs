// Account-owned progression. Missing new bunker ranks default to zero.
// Items are indexed by position: `equipped` is a 1-based index into this array and
// is stored in every existing save's loadout string, which only accepts 0-10
// (`parseLoadout`). Adding an entry would either renumber everyone's gear or
// overflow the format, so the dog tag is NOT an armory item: it is issued by the
// first-run debrief (see first-run-ending.mjs) and drawn by dog-tag.mjs.
export const ITEMS=[
  {name:'Field Scope',description:'+3 soldier damage per shot, +1 more every three waves from wave 6.',wave:2,icon:'scope'},
  {name:'Reinforced Vest',description:'+10 shared bunker maximum health.',wave:4,icon:'vest'},
  {name:'Combat Boots',description:'+20 soldier movement speed.',wave:6,icon:'boots'},
  {name:'Spotter Binoculars',description:'+30 soldier firing range.',wave:8,icon:'binoculars'},
  {name:'Field Radio',description:'Your active ability recharges 4 seconds faster.',wave:10,icon:'radio'},
  {name:'Supply Satchel',description:'+25 starting supplies for its wearer.',wave:12,icon:'satchel'},
  {name:'Demolition Pouch',description:'From wave 6, Assault Airstrike deals 45 instead of 35 damage, +1 more every two waves.',wave:14,icon:'pouch'},
  {name:'Field Manual',description:'From wave 6, your soldier fires 10% faster.',wave:16,icon:'manual'},
  {name:'Quartermaster Badge',description:'From wave 6, gain 8 personal supplies after each completed wave, +1 more every eight waves.',wave:18,icon:'badge'},
  {name:'Tank Spotter Kit',description:'From wave 6, your towers deal 10% more damage to tanks.',wave:20,icon:'tankkit'}
];
export const DEFAULT_ARMORY={scrap:0,fortify:0,plating:0,repair:0,gun:0,supply:0,safeguard:0,owned:0,equipped:0};
export function readArmory(value){
  if(!value)return {...DEFAULT_ARMORY};
  const a={...DEFAULT_ARMORY,...value};
  if(!Number.isInteger(a.scrap)||a.scrap<0||a.scrap>10000000||!['fortify','plating','repair','gun','supply','safeguard'].every(k=>Number.isInteger(a[k])&&a[k]>=0&&a[k]<=3)||!Number.isInteger(a.owned)||a.owned<0||a.owned>1023||!Number.isInteger(a.equipped)||a.equipped<0||a.equipped>ITEMS.length||a.equipped>0&&!(a.owned&(1<<(a.equipped-1))))return {...DEFAULT_ARMORY};
  return a;
}
export function rewardWave(value,wave){
  const a=readArmory(value);a.scrap=Math.min(10000000,a.scrap+10);
  const item=ITEMS.findIndex(i=>i.wave===wave)+1;
  if(item){const bit=1<<(item-1);if(a.owned&bit)a.scrap=Math.min(10000000,a.scrap+10);else a.owned|=bit;}
  return a;
}
export function upgradeArmory(value,kind){
  const a=readArmory(value);if(!['fortify','plating','repair','gun','supply','safeguard'].includes(kind)||a[kind]>=3)return null;
  const cost=(a[kind]+1)*(['supply','safeguard'].includes(kind)?50:30);if(a.scrap<cost)return null;a.scrap-=cost;a[kind]++;return a;
}
export function equipArmory(value,item){const a=readArmory(value);if(!Number.isInteger(item)||item<0||item>ITEMS.length||item>0&&!(a.owned&(1<<(item-1))))return null;a.equipped=item;return a;}
export function encodeLoadout(value){
  const a=readArmory(value),base=`${a.fortify},${a.plating},${a.equipped}`;
  if(a.supply||a.safeguard)return `${base};${a.repair},${a.gun};${a.supply},${a.safeguard}`;
  return a.repair||a.gun?`${base};${a.repair},${a.gun}`:base;
}
export function parseLoadout(value){
  if(typeof value!=='string'||!/^([0-3],){2}(10|[0-9])(;[0-3],[0-3](;[0-3],[0-3])?)?$/.test(value))value='0,0,0';
  const [base,extras,advanced]=value.split(';'),[fortify,plating,equipped]=base.split(',').map(Number);
  return {fortify,plating,equipped,...(extras?{repair:Number(extras[0]),gun:Number(extras[2])}:{}),...(advanced?{supply:Number(advanced[0]),safeguard:Number(advanced[2])}:{})};
}
