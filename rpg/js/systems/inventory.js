// [2026-10-12 13:15] - js/systems/inventory.js: v0.0.2 Inventarsystem
// Änderungen:
// - Boni für neue Rüstungs- und Waffentypen korrekt eingepflegt.

import { state } from '../core/state.js';
import { ITEM_DATABASE } from '../data/items.js';
import { eventBus } from '../core/eventBus.js';

export class InventorySystem {
  addItem(itemId, amount = 1) {
    const proto = ITEM_DATABASE[itemId];
    if (!proto) return false;

    if (proto.stackable) {
      const found = state.player.inventory.find(i => i.itemId === itemId);
      if (found) {
        found.count += amount;
        eventBus.emit('inventory:updated');
        return true;
      }
    }

    if (state.player.inventory.length >= 15) {
      eventBus.emit('log:message', 'Dein Rucksack ist voll!');
      return false;
    }

    state.player.inventory.push({ itemId, count: amount });
    eventBus.emit('inventory:updated');
    return true;
  }

  useItem(slotIndex) {
    const slot = state.player.inventory[slotIndex];
    if (!slot) return;

    const item = ITEM_DATABASE[slot.itemId];
    if (!item) return;

    if (item.type === 'consumable') {
      if (item.effect === 'heal') {
        if (state.player.hp >= state.player.maxHp) {
          eventBus.emit('log:message', 'Gesundheit ist bereits voll.');
          return;
        }
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.val);
        slot.count--;
        eventBus.emit('log:message', `${item.name} benutzt (+${item.val} TP).`);
      }
    } else if (item.type === 'weapon') {
      state.player.equipped.weapon = item;
      eventBus.emit('log:message', `${item.name} angelegt (+${item.val} ATK).`);
    } else if (item.type === 'armor') {
      state.player.equipped.armor = item;
      eventBus.emit('log:message', `${item.name} angelegt (+${item.val} DEF).`);
    }

    if (slot.count <= 0) {
      state.player.inventory.splice(slotIndex, 1);
    }

    eventBus.emit('inventory:updated');
    eventBus.emit('hud:updated');
  }

  getTotalAtk() {
    const wBonus = state.player.equipped.weapon ? state.player.equipped.weapon.val : 0;
    return state.player.baseAtk + wBonus;
  }

  getTotalDef() {
    const aBonus = state.player.equipped.armor ? state.player.equipped.armor.val : 0;
    return state.player.baseDef + aBonus;
  }
}
