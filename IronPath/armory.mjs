// Account-owned progression. Existing profiles without armory data start at zero.
export const ITEMS=[
  {name:'Field Scope',description:'+3 soldier damage per shot.'},
  {name:'Reinforced Vest',description:'+10 shared bunker maximum health.'},
  {name:'Combat Boots',description:'+20 soldier movement speed.'}
];
export const DEFAULT_ARMORY={scrap:0,fortify:0,plating:0,owned:0,equipped:0};
export function readArmory(value){
  if(!value||!Number.isInteger(value.scrap)||value.scrap<0||value.scrap>10000000||!Number.isInteger(value.fortify)||value.fortify<0||value.fortify>3||!Number.isInteger(value.plating)||value.plating<0||value.plating>3||!Number.isInteger(value.owned)||value.owned<0||value.owned>7||!Number.isInteger(value.equipped)||value.equipped<0||value.equipped>3||value.equipped>0&&!(value.owned&(1<<(value.equipped-1))))return {...DEFAULT_ARMORY};
  return {...DEFAULT_ARMORY,...value};
}
export function rewardWave(value,wave){
  const a=readArmory(value);a.scrap=Math.min(10000000,a.scrap+10);
  const item=wave===2?1:wave===4?2:wave===6?3:0;
  if(item){const bit=1<<(item-1);if(a.owned&bit)a.scrap=Math.min(10000000,a.scrap+10);else a.owned|=bit;}
  return a;
}
export function upgradeArmory(value,kind){
  const a=readArmory(value);if(!['fortify','plating'].includes(kind)||a[kind]>=3)return null;
  const cost=(a[kind]+1)*30;if(a.scrap<cost)return null;a.scrap-=cost;a[kind]++;return a;
}
export function equipArmory(value,item){const a=readArmory(value);if(!Number.isInteger(item)||item<0||item>3||item>0&&!(a.owned&(1<<(item-1))))return null;a.equipped=item;return a;}
export function encodeLoadout(value){const a=readArmory(value);return `${a.fortify},${a.plating},${a.equipped}`;}
export function parseLoadout(value){if(typeof value!=='string'||!/^([0-3],){2}[0-3]$/.test(value))value='0,0,0';const [fortify,plating,equipped]=value.split(',').map(Number);return {fortify,plating,equipped};}
