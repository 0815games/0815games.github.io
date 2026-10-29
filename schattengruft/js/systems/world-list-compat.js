import {state} from '../core/state.js';
import {cloud} from './firebase.js';
import {WorldMap} from '../world/map.js';
function entityList(value,name){
 if(value==null)return [];
 let entries;
 if(Array.isArray(value))entries=value;
 else if(typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).every(key=>/^(0|[1-9][0-9]*)$/.test(key)))entries=Object.values(value);
 else throw new Error('Ungültige Weltliste: '+name+'. Spielstand nicht überschreiben.');
 if(!entries.every(item=>item==null||(typeof item==='object'&&typeof item.id==='string'&&item.id.length>0&&Number.isInteger(item.x)&&Number.isInteger(item.y))))throw new Error('Ungültiger Eintrag in '+name+'. Spielstand nicht überschreiben.');
 return Array.isArray(value)&&entries.every(item=>item!=null)?value:entries.filter(item=>item!=null);
}
export function normalizeWorldLists(world){
 if(!world||typeof world!=='object'||Array.isArray(world))throw new Error('Weltzustand fehlt. Spielstand nicht überschreiben.');
 const monsters=entityList(world.monsters,'monsters'),chests=entityList(world.chests,'chests');
 world.monsters=monsters;world.chests=chests;return world;
}
const load=cloud.loadAllSlots;
cloud.loadAllSlots=async function(...args){const slots=await load.apply(this,args);for(const slot of slots){if(slot&&slot.world)normalizeWorldLists(slot.world);}return slots;};
const ensure=WorldMap.prototype.ensureValid;
WorldMap.prototype.ensureValid=function(...args){normalizeWorldLists(state.world);return ensure.apply(this,args);};
