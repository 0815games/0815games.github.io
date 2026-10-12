// [2026-10-12 08:13] - js/systems/inventory.js: Inventar- & Ausrüstungslogik
// Änderungen:
// - Intelligente Slot-Verwaltung, Stacking-Prüfung und Werteanpassung beim Anlegen.

import { state } from '../core/state.js';
import { ITEM_DATABASE } from '../data/items.js';
import { eventBus } from '../core/eventBus.js';

export class InventorySystem {
  addItem(itemId, amount = 1) {
    const proto = ITEM_DATABASE[itemId];
    if (!proto) return false;

    if (proto.stackable) {
      const existing = state.player.inventory.find(i => i.itemId === itemId);
      if (existing) {
        existing.count += amount;
        eventBus.emit('inventory:updated');
        return true;
      }
    }

    if (state.player.inventory.length >= 15) {
      eventBus.emit('log:message', 'Inventar ist voll!');
      return false;
    }

    state.player.inventory.push({ itemId, count: amount });
    eventBus.emit('inventory:updated');
    return true;
  }

  useItem(slotIndex) {
    const entry = state.player.inventory[slotIndex];
    if (!entry) return;

    const proto = ITEM_DATABASE[entry.itemId];
    if (proto.type === 'consumable' && proto.effect === 'heal') {
      if (state.player.hp >= state.player.maxHp) {
        eventBus.emit('log:message', 'Gesundheit ist bereits maximiert.');
        return;
      }
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + proto.power);
      entry.count--;
      eventBus.emit('log:message', `${proto.name} genutzt (+${proto.power} TP).`);
    } else if (proto.type === 'weapon') {
      state.player.equipped.weapon = proto;
      eventBus.emit('log:message', `${proto.name} ausgerüstet.`);
    }

    if (entry.count <= 0) {
      state.player.inventory.splice(slotIndex, 1);
    }

    eventBus.emit('inventory:updated');
    eventBus.emit('hud:updated');
  }
}
