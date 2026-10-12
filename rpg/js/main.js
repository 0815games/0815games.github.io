// [2026-10-12 13:35] - js/main.js: v0.0.6 Anwendungs-Bootstrap mit DeathScreen- & Animationsevents
// Änderungen:
// - Verdrahtung von `player:death` zum Aufrufen des spieleigenen Todesbildschirms.
// - Integration des autarken Animation-Loops für Schadenszahlen.

import { initInput } from './core/input.js';
import { eventBus } from './core/eventBus.js';
import { WorldMap } from './world/map.js';
import { WorldRenderer } from './world/render.js';
import { InventorySystem } from './systems/inventory.js';
import { CombatSystem } from './systems/combat.js';
import { ShopSystem } from './systems/shop.js';
import { StorageSystem } from './systems/storage.js';
import { QuestSystem } from './systems/quest.js';
import { UIManager } from './ui/uiManager.js';
import { IntroFlow } from './ui/introFlow.js';
import { state } from './core/state.js';

window.addEventListener('DOMContentLoaded', () => {
  const storageSys = new StorageSystem();
  storageSys.loadGame();

  const map = new WorldMap();
  const renderer = new WorldRenderer('stage');
  const inventorySys = new InventorySystem();
  const combatSys = new CombatSystem(inventorySys, storageSys);
  const shopSys = new ShopSystem(inventorySys, storageSys);
  const questSys = new QuestSystem(inventorySys, storageSys);
  const ui = new UIManager(inventorySys, combatSys, shopSys, storageSys, questSys);
  const introFlow = new IntroFlow(inventorySys, storageSys);

  // Bewegung & Welt
  eventBus.on('player:move', ({ dx, dy }) => map.tryMovePlayer(dx, dy));
  eventBus.on('world:updated', () => {}); // Renderer läuft jetzt autark in 60fps Loop
  eventBus.on('hud:updated', () => ui.updateHUD());
  eventBus.on('inventory:updated', () => {
    ui.renderInventory();
    questSys.checkInventoryItems();
  });
  eventBus.on('log:message', (msg) => ui.logMessage(msg));

  // Gefecht
  eventBus.on('combat:engage', (monster) => combatSys.startCombat(monster));
  eventBus.on('combat:started', (monster) => ui.showCombat(monster));
  eventBus.on('combat:updated', () => ui.updateCombatView());
  eventBus.on('combat:ended', () => ui.hideCombat());
  eventBus.on('combat:log', (text) => ui.combatLog(text));
  eventBus.on('monster:killed', (typeId) => questSys.onMonsterKilled(typeId));
  eventBus.on('player:death', () => ui.showDeathModal());

  // Alchemist / Händler
  eventBus.on('shop:engage', () => {
    shopSys.openShop();
    questSys.onTraderVisited();
  });
  eventBus.on('shop:opened', () => ui.showShop());
  eventBus.on('shop:closed', () => ui.hideShop());
  eventBus.on('shop:close_request', () => shopSys.closeShop());
  eventBus.on('shop:updated', () => ui.renderShop());

  // Quests
  eventBus.on('quests:updated', () => ui.renderQuests());
  eventBus.on('storage:autosave', () => storageSys.saveGame(true));

  // Autonome schwebende Zahlen
  eventBus.on('fx:dmg', ({ text, x, y, color }) => {
    renderer.addFloatingText(text, x, y, color);
  });

  eventBus.on('chest:opened', (chest) => {
    chest.opened = true;
    state.player.caps += chest.caps;
    inventorySys.addItem(chest.item, 1);
    eventBus.emit('log:message', `🎁 Reliquientruhe geborgen! Inhalt: ${chest.item} & +${chest.caps} Gold.`);
    renderer.addFloatingText(`+${chest.caps} Gold`, chest.x, chest.y, '#ffd54f');
    storageSys.saveGame(true);
    questSys.checkInventoryItems();
    ui.updateHUD();
  });

  initInput();
  ui.updateHUD();
  questSys.checkInventoryItems();
});
