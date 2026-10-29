// [2026-10-12 18:55] - js/systems/storage.js: v0.0.9 Persistenz-Engine für Runs & Ebenen
import { state } from '../core/state.js';
import { eventBus } from '../core/eventBus.js';

const STORAGE_KEY = 'shadow_crypt_roguelite_v009';

export class StorageSystem {
  constructor(modalManager) {
    this.modal = modalManager;
  }

  saveGame(silent = false) {
    try {
      const data = {
        version: '0.0.9',
        timestamp: Date.now(),
        player: state.player,
        trader: state.trader,
        quests: state.quests,
        world: {
          depth: state.world.depth || 1,
          stairs: state.world.stairs,
          chests: state.world.chests,
          monsters: state.world.monsters,
          discovered: state.world.discovered
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (!silent && this.modal) {
        this.modal.showNotice('CHRONIK GESICHERT', 'Dein aktueller Run wurde in den Annalen des Ordens verewigt.', '📜');
      }
      return true;
    } catch (e) {
      console.error('Speichern fehlgeschlagen:', e);
      return false;
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      const data = JSON.parse(raw);
      if (!data || !data.player) return false;

      // Werte sanitieren
      state.player = data.player;
      state.player.x = Number.isFinite(state.player.x) ? state.player.x : 2;
      state.player.y = Number.isFinite(state.player.y) ? state.player.y : 2;

      if (data.trader) state.trader = data.trader;
      if (data.quests) state.quests = data.quests;

      if (data.world) {
        state.world.depth = data.world.depth || 1;
        state.world.stairs = data.world.stairs || { x: 17, y: 12 };
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
    if (this.modal) {
      this.modal.showConfirm(
        'RUN ZURÜCKSETZEN?',
        'Möchtest du den aktuellen Lauf beenden und mit einem neuen Helden beginnen?',
        () => {
          localStorage.removeItem(STORAGE_KEY);
          eventBus.emit('run:restart');
        },
        '🔥'
      );
    }
  }
}
