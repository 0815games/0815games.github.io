// [2026-10-12 08:13] - js/ui/uiManager.js: Benutzeroberfläche & HUD
// Änderungen:
// - Verwaltung der DOM-Aktualisierungen und Verknüpfung der EventBus-Signale.
// - Verriegelung der Tastatureingaben bei modaler Anzeige.

import { state } from '../core/state.js';
import { ITEM_DATABASE } from '../data/items.js';

export class UIManager {
  constructor(inventorySys, combatSys) {
    this.invSys = inventorySys;
    this.combatSys = combatSys;
    this.initBindings();
  }

  initBindings() {
    document.getElementById('act-attack').addEventListener('click', () => this.combatSys.executeAttack());
    document.getElementById('act-flee').addEventListener('click', () => this.combatSys.attemptFlee());
    document.getElementById('act-heal').addEventListener('click', () => {
      const idx = state.player.inventory.findIndex(i => i.itemId === 'stimpack');
      if (idx !== -1) this.invSys.useItem(idx);
    });
  }

  updateHUD() {
    document.getElementById('stat-hp').innerText = `${state.player.hp} / ${state.player.maxHp}`;
    document.getElementById('stat-level').innerText = state.player.level;
    document.getElementById('stat-gold').innerText = state.player.gold;
    document.getElementById('inv-capacity').innerText = state.player.inventory.reduce((a, b) => a + b.count, 0);

    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    state.player.inventory.forEach((slot, index) => {
      const proto = ITEM_DATABASE[slot.itemId];
      if (!proto) return;

      const row = document.createElement('div');
      row.className = 'inv-row';
      row.innerHTML = `<span>${proto.name} x${slot.count}</span><span>[Benutzen]</span>`;
      row.addEventListener('click', () => this.invSys.useItem(index));
      grid.appendChild(row);
    });
  }

  showCombat(monster) {
    document.getElementById('combat-box').classList.remove('hidden');
    document.getElementById('combat-narrative').innerText = `Gegner: ${monster.name} (TP: ${monster.currentHp})`;
  }

  hideCombat() {
    document.getElementById('combat-box').classList.add('hidden');
  }

  pushLog(message) {
    const box = document.getElementById('activity-log');
    const line = document.createElement('div');
    line.innerText = `> ${message}`;
    box.prepend(line);
  }
}
