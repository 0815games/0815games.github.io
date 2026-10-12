// [2026-10-12 13:50] - js/main.js: v0.0.8 Effekt-Event-Verdrahtung
// Änderungen:
// - Anbindung der visuellen Truhen-Partikel (`fx:chest_burst`) und des Feindkontakt-Slashes (`fx:encounter`).
// - Auslösen der roten Schock-Vignette bei Monsterkollision.

import { initInput } from './core/input.js';
import { eventBus } from './core/eventBus.js';
import { WorldMap } from './world/map.js';
import { WorldRenderer } from './world/render.js';
import { InventorySystem } from './systems/inventory.js';
import { CombatSystem } from './systems/combat.js';
import { ShopSystem } from './systems/shop.js';
import { StorageSystem } from './systems/storage.js';
import { QuestSystem } from './systems/quest.js';
import { AudioSystem } from './systems/audio.js';
import { UIManager } from './ui/uiManager.js';
import { IntroFlow } from './ui/introFlow.js';
import { state } from './core/state.js';

window.addEventListener('DOMContentLoaded', () => {
  const audioSys = new AudioSystem();
  const storageSys = new StorageSystem();
  storageSys.loadGame();

  const map = new WorldMap();
  const renderer = new WorldRenderer('stage');
  const inventorySys = new InventorySystem();
  const combatSys = new CombatSystem(inventorySys, storageSys);
  const shopSys = new ShopSystem(inventorySys, storageSys);
  const questSys = new QuestSystem(inventorySys, storageSys);
  const ui = new UIManager(inventorySys, combatSys, shopSys, storageSys, questSys, audioSys);
  const introFlow = new IntroFlow(inventorySys, storageSys);

  // Audio-Events
  eventBus.on('audio:step', () => audioSys.playFootstep());
  eventBus.on('audio:sword', () => audioSys.playSwordHit());
  eventBus.on('audio:fireball', () => audioSys.playFireball());
  eventBus.on('audio:potion', () => audioSys.playPotion());
  eventBus.on('audio:chest', () => audioSys.playChestOpen());
  eventBus.on('audio:hurt', () => audioSys.playPlayerHurt());
  eventBus.on('audio:levelup', () => audioSys.playLevelUp());
  eventBus.on('audio:death', () => audioSys.playDeathGong());

  // Bewegung & Welt
  eventBus.on('player:move', ({ dx, dy }) => {
    map.tryMovePlayer(dx, dy);
    eventBus.emit('audio:step');
  });

  eventBus.on('hud:updated', () => ui.updateHUD());
  eventBus.on('inventory:updated', () => {
    ui.renderInventory();
    questSys.checkInventoryItems();
  });
  eventBus.on('log:message', (msg) => ui.logMessage(msg));

  // Gefecht & Begegnung
  eventBus.on('fx:encounter', ({ x, y }) => {
    renderer.triggerEncounterSlash(x, y);
    audioSys.playPlayerHurt();
    const flashEl = document.getElementById('encounter-flash');
    if (flashEl) {
      flashEl.classList.remove('hidden');
      setTimeout(() => flashEl.classList.add('hidden'), 450);
    }
  });

  eventBus.on('combat:engage', (monster) => combatSys.startCombat(monster));
  eventBus.on('combat:started', (monster) => ui.showCombat(monster));
  eventBus.on('combat:updated', () => ui.updateCombatView());
  eventBus.on('combat:ended', () => ui.hideCombat());
  eventBus.on('combat:log', (text) => ui.combatLog(text));
  eventBus.on('monster:killed', (typeId) => questSys.onMonsterKilled(typeId));
  eventBus.on('player:death', () => {
    eventBus.emit('audio:death');
    ui.showDeathModal();
  });

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

  // Truhen-Öffnung mit Partikelexplosion
  eventBus.on('chest:opened', (chest) => {
    chest.opened = true;
    state.player.caps += chest.caps;
    inventorySys.addItem(chest.item, 1);

    // Visueller Goldstaub-Burst & Sound
    renderer.triggerChestBurst(chest.x, chest.y);
    eventBus.emit('audio:chest');

    eventBus.emit('log:message', `🎁 Reliquientruhe geborgen! Inhalt: ${chest.item} & +${chest.caps} Gold.`);
    storageSys.saveGame(true);
    questSys.checkInventoryItems();
    ui.updateHUD();
  });

  initInput();
  ui.updateHUD();
  questSys.checkInventoryItems();
});
