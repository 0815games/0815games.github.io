// [2026-10-12 18:55] - js/main.js: v0.0.9 Roguelite Bootstrap
// Änderungen:
// - Robuste Initialisierung ohne Abhängigkeiten zu asynchronen Splashscreens.
// - Anbindung von Verliesabstieg (`stairs:reached`, `player:interact`) und Truhenauflösung.

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
import { ModalManager } from './ui/modalManager.js';
import { UIManager } from './ui/uiManager.js';
import { state } from './core/state.js';

window.addEventListener('DOMContentLoaded', () => {
  const modalManager = new ModalManager();
  const audioSys = new AudioSystem();
  const storageSys = new StorageSystem(modalManager);

  const hasLoaded = storageSys.loadGame();

  const map = new WorldMap();
  const renderer = new WorldRenderer('stage');
  const inventorySys = new InventorySystem();
  const combatSys = new CombatSystem(inventorySys, storageSys);
  const shopSys = new ShopSystem(inventorySys, storageSys);
  const questSys = new QuestSystem(inventorySys, storageSys);
  const ui = new UIManager(inventorySys, combatSys, shopSys, storageSys, questSys, audioSys, map);

  // Audio-Events
  eventBus.on('audio:step', () => audioSys.playFootstep());
  eventBus.on('audio:sword', () => audioSys.playSwordHit());
  eventBus.on('audio:fireball', () => audioSys.playFireball());
  eventBus.on('audio:potion', () => audioSys.playPotion());
  eventBus.on('audio:chest', () => audioSys.playChestOpen());
  eventBus.on('audio:hurt', () => audioSys.playPlayerHurt());
  eventBus.on('audio:levelup', () => audioSys.playLevelUp());
  eventBus.on('audio:death', () => audioSys.playDeathGong());
  eventBus.on('audio:stairs', () => audioSys.playStairs());

  // Bewegung & Interaktion
  eventBus.on('player:move', ({ dx, dy }) => {
    const moved = map.tryMovePlayer(dx, dy);
    if (moved) eventBus.emit('audio:step');
  });

  eventBus.on('player:interact', () => {
    if (state.inCombat || state.inShop || state.isInputLocked) return;

    // Steht Held auf Treppe?
    if (state.world.stairs && state.player.x === state.world.stairs.x && state.player.y === state.world.stairs.y) {
      map.descend();
      return;
    }

    // Steht Held neben Händler?
    const tr = state.trader;
    const dist = Math.hypot(state.player.x - tr.x, state.player.y - tr.y);
    if (dist <= 1.5) {
      shopSys.openShop();
      questSys.onTraderVisited();
      return;
    }

    eventBus.emit('log:message', 'Hier gibt es keine Treppe oder Person zum Interagieren.');
  });

  eventBus.on('stairs:reached', () => {
    eventBus.emit('log:message', 'Eine steinerne Wendeltreppe führt nach unten! Drücke [E], [Leertaste] oder [✦] zum Hinabsteigen.');
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

  // Alchemist
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
  eventBus.on('run:restart', () => ui.openCharSelectModal());

  // Schwebende Zahlen
  eventBus.on('fx:dmg', ({ text, x, y, color }) => {
    renderer.addFloatingText(text, x, y, color);
  });

  // Truhen: Öffnen, Partikelexplosion & Auflösen nach 0.8 Sekunden
  eventBus.on('chest:opened', (chest) => {
    chest.opened = true;
    state.player.caps += chest.caps;
    inventorySys.addItem(chest.item, 1);

    renderer.triggerChestBurst(chest.x, chest.y);
    eventBus.emit('audio:chest');
    eventBus.emit('log:message', `🎁 Reliquientruhe geborgen! Inhalt: ${chest.item} & +${chest.caps} Gold.`);

    // Nach 800ms löst sich die Kiste auf wie ein Monster
    setTimeout(() => {
      state.world.chests = state.world.chests.filter(c => c.id !== chest.id);
    }, 800);

    storageSys.saveGame(true);
    questSys.checkInventoryItems();
    ui.updateHUD();
  });

  initInput();
  ui.updateHUD();
  questSys.checkInventoryItems();

  // Falls Erststart ohne Speicherstand: Klassenwahl öffnen
  if (!hasLoaded) {
    ui.openCharSelectModal();
  }
});
