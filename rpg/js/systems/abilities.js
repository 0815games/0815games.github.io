import { effectiveDefense } from './equipment-effects.js';
// [2026-10-14] - js/systems/abilities.js: v0.1.0 Klassen-Fähigkeiten
export const ABILITIES = {
 warrior: [
  {id:'power_strike',name:'Mächtiger Schlag',icon:'💥',mana:0,cd:3,desc:'Verursacht 200% Angriffsschaden.',use:(p,m,s)=>{const d=Math.max(1,Math.floor(s.totalAtk*2-effectiveDefense(m,s)));m.hp-=d;return `Mächtiger Schlag trifft für ${d}.`}},
  {id:'shield_wall',name:'Schildwall',icon:'🛡️',mana:5,cd:4,desc:'Reduziert den nächsten erlittenen Schaden um 50%.',use:(p)=>{p.buffs.shield=1;return 'Schildwall aktiv.'}},
  {id:'battle_cry',name:'Schlachtruf',icon:'📣',mana:8,cd:5,desc:'Heilt 15% der maximalen TP.',use:(p)=>{const h=Math.floor(p.maxHp*.15);p.hp=Math.min(p.maxHp,p.hp+h);return `Schlachtruf heilt ${h} TP.`}}
 ],
 mage: [
  {id:'frost_bolt',name:'Frostblitz',icon:'❄️',mana:6,cd:2,desc:'Verursacht 150% Angriffsschaden.',use:(p,m,s)=>{const d=Math.max(1,Math.floor(s.totalAtk*1.5-effectiveDefense(m,s)));m.hp-=d;return `Frostblitz trifft für ${d}.`}},
  {id:'arcane_shield',name:'Arkanschild',icon:'🔮',mana:10,cd:5,desc:'Blockt den nächsten Angriff vollständig.',use:(p)=>{p.buffs.block=true;return 'Arkanschild aktiv.'}},
  {id:'mana_surge',name:'Manawelle',icon:'🌀',mana:0,cd:6,desc:'Stellt 20 Mana wieder her.',use:(p)=>{p.mp=Math.min(p.maxMp,p.mp+20);return 'Manawelle stellt 20 MP wieder her.'}}
 ],
 rogue: [
  {id:'backstab',name:'Meucheln',icon:'🗡️',mana:0,cd:3,desc:'Verursacht 250% Angriffsschaden, 50% Crit-Chance.',use:(p,m,s)=>{let d=Math.max(1,Math.floor(s.totalAtk*2.5-effectiveDefense(m,s)));if(Math.random()<.5)d=Math.floor(d*1.5);m.hp-=d;return `Meucheln trifft für ${d}.`}},
  {id:'poison',name:'Giftklinge',icon:'☠️',mana:5,cd:4,desc:'Vergiftet den Gegner für 3 Runden (5 Schaden/Runde).',use:(p,m)=>{m.dot={turns:3,dmg:5};return 'Giftklinge wirkt.'}},
  {id:'smoke_bomb',name:'Rauchbombe',icon:'💨',mana:8,cd:5,desc:'Weicht dem nächsten Angriff sicher aus.',use:(p)=>{p.buffs.evade=true;return 'Rauchbombe aktiv.'}}
 ]
};
export function getCooldown(p,id){return p.cooldowns?.[id]||0}
export function setCooldown(p,id,cd){if(!p.cooldowns)p.cooldowns={};p.cooldowns[id]=cd}
export function tickCooldowns(p){if(!p.cooldowns)return;for(const k in p.cooldowns){if(p.cooldowns[k]>0)p.cooldowns[k]--}}
