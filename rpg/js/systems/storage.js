// [2026-10-12 14:31] - v0.0.9: LocalStorage save/load samt spielinterne Dialoge.
import {state} from '../core/state.js';import {eventBus} from '../core/eventBus.js';import {modalManager} from '../ui/modalManager.js';
const KEY='dark_fantasy_rpg_v009';
export class StorageSystem{
 saveGame(silent=false){try{const data={version:'0.0.9',player:state.player,trader:state.trader,quests:state.quests,world:{depth:state.world.depth,stairs:state.world.stairs,chests:state.world.chests,monsters:state.world.monsters,discovered:state.world.discovered}};localStorage.setItem(KEY,JSON.stringify(data));if(!silent)modalManager.showNotice('CHRONIK GESICHERT','Dein aktueller Run wurde in den Annalen des Ordens verewigt.','📜');return true;}catch(e){console.error(e);modalManager.showNotice('FEHLER','Der Spielstand konnte nicht gespeichert werden.','⚠️');return false;}}
 loadGame(){try{const raw=localStorage.getItem(KEY);if(!raw)return false;const d=JSON.parse(raw);if(!d?.player)return false;Object.assign(state,{player:d.player,trader:d.trader||state.trader,quests:d.quests||state.quests});Object.assign(state.world,d.world||{});return true;}catch(e){console.error(e);return false;}}
 resetGame(){modalManager.showConfirm('NEUBEGINN?','Der aktuelle Run wird beendet. Die permanente Ordenserinnerung bleibt erhalten.',()=>{localStorage.removeItem(KEY);eventBus.emit('run:new_request');},'🔥');}
}
