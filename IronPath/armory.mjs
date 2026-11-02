// Account-owned progression. Missing new bunker ranks default to zero.
export const ITEMS=[
  {name:'Field Scope',description:'+3 soldier damage per shot.',wave:2,icon:'scope'},
  {name:'Reinforced Vest',description:'+10 shared bunker maximum health.',wave:4,icon:'vest'},
  {name:'Combat Boots',description:'+20 soldier movement speed.',wave:6,icon:'boots'},
  {name:'Spotter Binoculars',description:'+30 soldier firing range.',wave:8,icon:'binoculars'},
  {name:'Field Radio',description:'Your active ability recharges 4 seconds faster.',wave:10,icon:'radio'},
  {name:'Supply Satchel',description:'+25 starting supplies for its wearer.',wave:12,icon:'satchel'}
];
export const DEFAULT_ARMORY={scrap:0,fortify:0,plating:0,repair:0,gun:0,owned:0,equipped:0};
export function readArmory(value){
  if(!value)return {...DEFAULT_ARMORY};
  const a={...DEFAULT_ARMORY,...value};
  if(!Number.isInteger(a.scrap)||a.scrap<0||a.scrap>10000000||!['fortify','plating','repair','gun'].every(k=>Number.isInteger(a[k])&&a[k]>=0&&a[k]<=3)||!Number.isInteger(a.owned)||a.owned<0||a.owned>63||!Number.isInteger(a.equipped)||a.equipped<0||a.equipped>ITEMS.length||a.equipped>0&&!(a.owned&(1<<(a.equipped-1))))return {...DEFAULT_ARMORY};
  return a;
}
export function rewardWave(value,wave){
  const a=readArmory(value);a.scrap=Math.min(10000000,a.scrap+10);
  const item=ITEMS.findIndex(i=>i.wave===wave)+1;
  if(item){const bit=1<<(item-1);if(a.owned&bit)a.scrap=Math.min(10000000,a.scrap+10);else a.owned|=bit;}
  return a;
}
export function upgradeArmory(value,kind){
  const a=readArmory(value);if(!['fortify','plating','repair','gun'].includes(kind)||a[kind]>=3)return null;
  const cost=(a[kind]+1)*30;if(a.scrap<cost)return null;a.scrap-=cost;a[kind]++;return a;
}
export function equipArmory(value,item){const a=readArmory(value);if(!Number.isInteger(item)||item<0||item>ITEMS.length||item>0&&!(a.owned&(1<<(item-1))))return null;a.equipped=item;return a;}
export function encodeLoadout(value){const a=readArmory(value),base=`${a.fortify},${a.plating},${a.equipped}`;return a.repair||a.gun?`${base};${a.repair},${a.gun}`:base;}
export function parseLoadout(value){
  if(typeof value!=='string'||!/^([0-3],){2}[0-6](;[0-3],[0-3])?$/.test(value))value='0,0,0';
  const [base,extras]=value.split(';'),[fortify,plating,equipped]=base.split(',').map(Number);
  return extras?{fortify,plating,equipped,repair:Number(extras[0]),gun:Number(extras[2])}:{fortify,plating,equipped};
}
