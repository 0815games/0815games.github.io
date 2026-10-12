// [2026-10-12 08:13] - js/main.js: Spiel-Bootstrap
// Änderungen:
// - Instanziierung aller Subsysteme und Verknüpfung der Ereignisse.

import { initInput } from './core/input.js';
import { eventBus } from './core/eventBus.js';
import { ZoneMap } from './world/map.js';
import { CanvasRenderer } from './world/render.js';
import { InventorySystem } from './systems/inventory.js';
import { CombatSystem } from './systems/combat.js';
import { UIManager } from './ui/uiManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const map = new ZoneMap();
  const renderer = new CanvasRenderer('stage');
  const inventorySys = new InventorySystem();
  const combatSys = new CombatSystem();
  const ui = new UIManager(inventorySys, combatSys);

  eventBus.on('player:request_move', ({ dx, dy }) => map.tryMovePlayer(dx, dy));
  eventBus.on('world:updated', () => renderer.render());
  eventBus.on('hud:updated', () => ui.updateHUD());
  eventBus.on('inventory:updated', () => ui.updateHUD());
  eventBus.on('log:message', (msg) => ui.pushLog(msg));

  eventBus.on('combat:engage', (monster) => combatSys.startCombat(monster));
  eventBus.on('combat:started', (monster) => ui.showCombat(monster));
  eventBus.on('combat:ended', () => ui.hideCombat());

  initInput();
  renderer.render();
  ui.updateHUD();
  ui.pushLog('Kernsysteme initialisiert. Erkunde das Ödland mit WASD.');
});
