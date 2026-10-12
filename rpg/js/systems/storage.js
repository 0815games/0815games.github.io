// [2026-10-12 13:15] - js/systems/storage.js: v0.0.2 LocalStorage Persistenz-Engine
// Änderungen:
// - Spielstand-Serialisierung und Wiederherstellung via localStorage ('wasteland_rpg_v002').
// - Speichert Spielerwerte, Inventar, Ausrüstung, entdeckte Kartenkacheln, Truhen, Händler und verbleibende Monster.
// - Saubere Reset-Funktion mit Bestätigungsabfrage.

import { state, INITIAL_PLAYER, INITIAL_TRADER } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';

const STORAGE_KEY = 'wasteland_rpg_v002';

export class StorageSystem {
  saveGame(silent = false) {
    try {
      const data = {
        version: '0.0.2',
        timestamp: Date.now(),
        player: state.player,
        trader: state.trader,
        world: {
          chests: state.world.chests,
          monsters: state.world.monsters,
          discovered: state.world.discovered
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (!silent) {
        eventBus.emit('log:message', '💾 Spielstand erfolgreich lokal gespeichert!');
      }
      return true;
    } catch (e) {
      console.error('Speichern fehlgeschlagen:', e);
      eventBus.emit('log:message', 'Fehler beim Speichern in LocalStorage!');
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

      if (data.world) {
        if (data.world.chests) state.world.chests = data.world.chests;
        if (data.world.monsters) state.world.monsters = data.world.monsters;
        if (data.world.discovered) state.world.discovered = data.world.discovered;
      }

      eventBus.emit('log:message', '💾 Vorheriger Spielstand aus LocalStorage geladen!');
      return true;
    } catch (e) {
      console.error('Laden fehlgeschlagen:', e);
      return false;
    }
  }

  resetGame() {
    if (confirm('Möchtest du den Spielstand wirklich zurücksetzen? Alle Fortschritte gehen verloren.')) {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  }
}
