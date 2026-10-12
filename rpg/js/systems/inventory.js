// [2026-10-12 13:25] - js/systems/inventory.js: v0.0.4 Inventar & Tränkelogik
// Änderungen:
// - Unterstützung für Manatränke (`effect === 'mana'`) und Elixiere hinzugefügt.

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
      eventBus.emit('log:message', 'Dein Rucksack fasst keine weiteren Relikte!');
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
      if (item.effect === 'heal' || item.effect === 'heal_max') {
        if (state.player.hp >= state.player.maxHp) {
          eventBus.emit('log:message', 'Deine Trefferpunkte sind bereits vollständig.');
          return;
        }
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.val);
        slot.count--;
        eventBus.emit('log:message', `${item.name} getrunken (+${item.val} TP).`);
      } else if (item.effect === 'mana') {
        if (state.player.mp >= state.player.maxMp) {
          eventBus.emit('log:message', 'Dein Mana ist bereits vollkommen erfüllt.');
          return;
        }
        state.player.mp = Math.min(state.player.maxMp, state.player.mp + item.val);
        slot.count--;
        eventBus.emit('log:message', `${item.name} absorbiert (+${item.val} MP).`);
      }
    } else if (item.type === 'weapon') {
      state.player.equipped.weapon = item;
      eventBus.emit('log:message', `${item.name} gezogen (+${item.val} Schlagkraft).`);
    } else if (item.type === 'armor') {
      state.player.equipped.armor = item;
      eventBus.emit('log:message', `${item.name} angelegt (+${item.val} Schutz).`);
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
