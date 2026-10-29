// [2026-10-12 13:30] - js/systems/storage.js: v0.0.5 Speicher-Engine
// Änderungen:
// - Persistierung der Klassenwahl und Attribute in localStorage.

import { state } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';

const STORAGE_KEY = 'dark_fantasy_rpg_v004';

export class StorageSystem {
  saveGame(silent = false) {
    try {
      const data = {
        version: '0.0.5',
        timestamp: Date.now(),
        player: state.player,
        trader: state.trader,
        quests: state.quests,
        world: {
          chests: state.world.chests,
          monsters: state.world.monsters,
          discovered: state.world.discovered
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (!silent) {
        eventBus.emit('log:message', '📜 Dein Fortschritt wurde in der Ordens-Chronik festgehalten!');
      }
      return true;
    } catch (e) {
      console.error('Speichern fehlgeschlagen:', e);
      eventBus.emit('log:message', 'Fehler beim Speichern des Spielstands!');
      return false;
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || !data.player) return false;

      state.player = data.player;
      if (data.trader) state.trader = data.trader;
      if (data.quests) state.quests = data.quests;

      if (data.world) {
        if (data.world.chests) state.world.chests = data.world.chests;
        if (data.world.monsters) state.world.monsters = data.world.monsters;
        if (data.world.discovered) state.world.discovered = data.world.discovered;
      }

      eventBus.emit('log:message', '📜 Heldendaten aus der Chronik geladen!');
      return true;
    } catch (e) {
      console.error('Laden fehlgeschlagen:', e);
      return false;
    }
  }

  resetGame() {
    if (confirm('Möchtest du diese Heldenreise beenden und neu beginnen?')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  }
}
