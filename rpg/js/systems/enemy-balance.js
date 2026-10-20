import {rollElite} from './elite-enemies.js';
import {MONSTERS} from '../data/monsters.js';
import {state} from '../core/state.js';
import {WorldMap} from '../world/map.js';

const VERSION='roguelite-depth-v1';
const EARLY={
 rat:[24,10],bat:[26,10],slime:[32,11],
 goblin:[34,12],skeleton:[42,12]
};
for(const [key,[hp,atk]] of Object.entries(EARLY)){
 Object.assign(MONSTERS[key],{hp,atk});
}

// Vorhandene Bosskurve beibehalten; getrennt von normalen Gegnern.
export function bossStats(depth){
 const tier=Math.max(1,Math.floor(depth/5));
 return {
  hp:Math.round(220*tier**1.2),
  atk:Math.round(20*tier**1.1),
  def:4+2*tier
 };
}

export function applyEnemyBalance(world){
 const depth=Number.isFinite(world.depth)?Math.max(1,world.depth):1;
 for(const m of world.monsters||[]){
  if(m.enemyBalance===VERSION)continue;
  let stats;
  if(m.id==='boss'){
   stats=bossStats(depth);
  }else{
   const base=MONSTERS[m.key];
   if(!base)continue;
   const steps=depth-1;
   stats={
    hp:Math.round(base.hp*(1+steps*.24)),
    atk:Math.round(base.atk*(1+steps*.18)),
    def:Math.round((base.def||0)*(1+steps*.10))
   };
   // Belohnungen wachsen langsamer als die Lebenspunkte.
   m.xp=Math.round(base.xp*(1+steps*.12));
   m.gold=Math.round(base.gold*(1+steps*.08));
  }
  const ratio=Number.isFinite(m.hp)&&m.maxHp>0
   ?Math.max(0,Math.min(1,m.hp/m.maxHp)):1;
  m.maxHp=stats.hp;
  m.hp=ratio>0?Math.max(1,Math.round(stats.hp*ratio)):0;
  m.atk=stats.atk;
  m.def=stats.def;
  m.enemyBalance=VERSION;
 }
}

const generate=WorldMap.prototype.generate;
WorldMap.prototype.generate=function(...args){
 const result=generate.apply(this,args);
 applyEnemyBalance(state.world);
 rollElite(state.world);
 return result;
};

const ensure=WorldMap.prototype.ensureValid;
WorldMap.prototype.ensureValid=function(...args){
 const result=ensure.apply(this,args);
 if(!state.inCombat)applyEnemyBalance(state.world);
 return result;
};
