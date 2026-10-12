// [2026-10-12 13:15] - js/systems/shop.js: v0.0.2 Handelslogik (Kauf & Verkauf)
// Änderungen:
// - Überprüfung von Korken-Budget (Spieler und Händler) und Slot-Limits (max 15 Slots).
// - Dynamische Verkaufspreise (50% des Katalogwerts).
// - Übertragung von Waren zwischen Händler- und Spieler-Inventar.

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
    state.isInputLocked = true; // Bewegung verbieten solange Händler aktiv ist
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
      eventBus.emit('log:message', 'Händler hat diesen Gegenstand nicht mehr auf Lager.');
      return;
    }

    const price = traderEntry.price || proto.price;
    if (state.player.caps < price) {
      eventBus.emit('log:message', 'Nicht genügend Korken für diesen Kauf!');
      return;
    }

    const added = this.invSys.addItem(itemId, 1);
    if (!added) {
      eventBus.emit('log:message', 'Kauf abgebrochen: Dein Rucksack ist voll!');
      return;
    }

    state.player.caps -= price;
    state.trader.caps += price;
    traderEntry.count--;

    eventBus.emit('log:message', `Gekauft: ${proto.name} für ${price} Korken.`);
    eventBus.emit('shop:updated');
    eventBus.emit('hud:updated');
  }

  sellItem(slotIndex) {
    const slot = state.player.inventory[slotIndex];
    if (!slot || slot.count <= 0) return;

    const proto = ITEM_DATABASE[slot.itemId];
    if (!proto) return;

    // Verkaufspreis beträgt 50% des Grundwerts (mindestens 1 Korken)
    const sellPrice = Math.max(1, Math.floor(proto.price * 0.5));

    if (state.trader.caps < sellPrice) {
      eventBus.emit('log:message', 'Der Händler hat nicht mehr genügend Korken!');
      return;
    }

    // Übergabe
    state.player.caps += sellPrice;
    state.trader.caps -= sellPrice;
    slot.count--;

    // Ins Händler-Inventar zurückstellen
    const traderEntry = state.trader.inventory.find(i => i.itemId === slot.itemId);
    if (traderEntry) {
      traderEntry.count++;
    } else {
      state.trader.inventory.push({ itemId: slot.itemId, count: 1, price: proto.price });
    }

    if (slot.count <= 0) {
      state.player.inventory.splice(slotIndex, 1);
    }

    eventBus.emit('log:message', `Verkauft: ${proto.name} für +${sellPrice} Korken.`);
    eventBus.emit('shop:updated');
    eventBus.emit('hud:updated');
    eventBus.emit('inventory:updated');
  }
}
