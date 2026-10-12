// [2026-10-12 13:15] - js/main.js: v0.0.2 Anwendungs-Bootstrap mit Speichersystem & Händler
// Änderungen:
// - Initialisierung von StorageSystem und ShopSystem.
// - Automatisches Laden persistierter Spielstände beim Starten.
// - Event-Listener für Händleröffnung und Zwischenspeicherung.

import { initInput } from './core/input.js';
import { eventBus } from './core/eventBus.js';
import { WorldMap } from './world/map.js';
import { WorldRenderer } from './world/render.js';
import { InventorySystem } from './systems/inventory.js';
import { CombatSystem } from './systems/combat.js';
import { ShopSystem } from './systems/shop.js';
import { StorageSystem } from './systems/storage.js';
import { UIManager } from './ui/uiManager.js';
import { state } from './core/state.js';

window.addEventListener('DOMContentLoaded', () => {
  const storageSys = new StorageSystem();
  storageSys.loadGame(); // Lädt vorhandenen Spielstand, falls vorhanden

  const map = new WorldMap();
  const renderer = new WorldRenderer('stage');
  const inventorySys = new InventorySystem();
  const combatSys = new CombatSystem(inventorySys, storageSys);
  const shopSys = new ShopSystem(inventorySys, storageSys);
  const ui = new UIManager(inventorySys, combatSys, shopSys, storageSys);

  // Event Verdrahtung
  eventBus.on('player:move', ({ dx, dy }) => map.tryMovePlayer(dx, dy));
  eventBus.on('world:updated', () => renderer.render());
  eventBus.on('hud:updated', () => ui.updateHUD());
  eventBus.on('inventory:updated', () => ui.renderInventory());
  eventBus.on('log:message', (msg) => ui.logMessage(msg));

  // Gefecht
  eventBus.on('combat:engage', (monster) => combatSys.startCombat(monster));
  eventBus.on('combat:started', (monster) => ui.showCombat(monster));
  eventBus.on('combat:updated', () => ui.updateCombatView());
  eventBus.on('combat:ended', () => ui.hideCombat());
  eventBus.on('combat:log', (text) => ui.combatLog(text));

  // Händler
  eventBus.on('shop:engage', () => shopSys.openShop());
  eventBus.on('shop:opened', () => ui.showShop());
  eventBus.on('shop:closed', () => ui.hideShop());
  eventBus.on('shop:close_request', () => shopSys.closeShop());
  eventBus.on('shop:updated', () => ui.renderShop());

  // Speichern
  eventBus.on('storage:autosave', () => storageSys.saveGame(true));

  eventBus.on('fx:dmg', ({ text, x, y, color }) => {
    renderer.addFloatingText(text, x, y, color);
    renderer.render();
  });

  eventBus.on('chest:opened', (chest) => {
    chest.opened = true;
    state.player.caps += chest.caps;
    inventorySys.addItem(chest.item, 1);
    eventBus.emit('log:message', `🎁 Truhe geplündert! Inhalt: ${chest.item} & +${chest.caps} Korken.`);
    renderer.addFloatingText(`+${chest.caps} Korken`, chest.x, chest.y, '#ffd700');
    storageSys.saveGame(true);
    ui.updateHUD();
    renderer.render();
  });

  initInput();
  renderer.render();
  ui.updateHUD();
  ui.logMessage('System online. Ödland-Protokoll v0.0.2 betriebsbereit.');
});
