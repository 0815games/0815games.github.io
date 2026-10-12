// [2026-10-12 13:25] - js/systems/shop.js: v0.0.4 Alchemie- & Rüstkammer
// Änderungen:
// - Goldtransaktionen bei Alchemist Eldrin mit Slot-Prüfung und 50%-Verkaufswert.

import { state } from '../core/state.js';
import { ITEM_DATABASE } from '../data/items.js';
import { eventBus } from '../core/eventBus.js';

export class ShopSystem {
  constructor(inventorySys, storageSys) {
    this.invSys = inventorySys;
    this.storageSys = storageSys;
  }

  openShop() {
    state.inShop = true;
    state.isInputLocked = true;
    eventBus.emit('shop:opened');
  }

  closeShop() {
    state.inShop = false;
    state.isInputLocked = false;
    eventBus.emit('shop:closed');
    this.storageSys.saveGame(true);
  }

  buyItem(itemId) {
    const proto = ITEM_DATABASE[itemId];
    if (!proto) return;

    const traderEntry = state.trader.inventory.find(i => i.itemId === itemId && i.count > 0);
    if (!traderEntry) {
      eventBus.emit('log:message', 'Der Alchemist führt dieses Gut momentan nicht.');
      return;
    }

    const price = traderEntry.price || proto.price;
    if (state.player.caps < price) {
      eventBus.emit('log:message', 'Nicht genügend Goldmünzen in deinem Beutel!');
      return;
    }

    const added = this.invSys.addItem(itemId, 1);
    if (!added) {
      eventBus.emit('log:message', 'Erwerb gescheitert: Deine Tasche ist voll!');
      return;
    }

    state.player.caps -= price;
    state.trader.caps += price;
    traderEntry.count--;

    eventBus.emit('log:message', `Erworben: ${proto.name} für ${price} Gold.`);
    eventBus.emit('shop:updated');
    eventBus.emit('hud:updated');
  }

  sellItem(slotIndex) {
    const slot = state.player.inventory[slotIndex];
    if (!slot || slot.count <= 0) return;

    const proto = ITEM_DATABASE[slot.itemId];
    if (!proto) return;

    const sellPrice = Math.max(1, Math.floor(proto.price * 0.5));

    if (state.trader.caps < sellPrice) {
      eventBus.emit('log:message', 'Der Alchemist hat nicht mehr genügend Gold!');
      return;
    }

    state.player.caps += sellPrice;
    state.trader.caps -= sellPrice;
    slot.count--;

    const traderEntry = state.trader.inventory.find(i => i.itemId === slot.itemId);
    if (traderEntry) {
      traderEntry.count++;
    } else {
      state.trader.inventory.push({ itemId: slot.itemId, count: 1, price: proto.price });
    }

    if (slot.count <= 0) {
      state.player.inventory.splice(slotIndex, 1);
    }

    eventBus.emit('log:message', `Veräußert: ${proto.name} für +${sellPrice} Gold.`);
    eventBus.emit('shop:updated');
    eventBus.emit('hud:updated');
    eventBus.emit('inventory:updated');
  }
}
