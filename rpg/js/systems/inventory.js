// [2026-10-14] - js/systems/inventory.js: v0.1.0 Inventar-Logik
import { ITEMS } from '../data/items.js';
export const INVENTORY_LIMIT = 15;
export function addItem(inv, id, count = 1) {
  const item = ITEMS[id];
  if (!item) return false;
  const max = item.stack || 1;
  let remaining = count;
  if (max > 1) {
    let slot = inv.find(s => s.id === id && s.count < max);
    while (slot && remaining > 0) {
      const space = max - slot.count;
      const add = Math.min(space, remaining);
      slot.count += add;
      remaining -= add;
      if (remaining > 0) slot = inv.find(s => s.id === id && s.count < max);
    }
  }
  while (remaining > 0 && inv.length < INVENTORY_LIMIT) {
    const add = Math.min(max, remaining);
    inv.push({ id, count: add });
    remaining -= add;
  }
  return remaining === 0;
}
export function removeItem(inv, id, count = 1) {
  let remaining = count;
  for (let i = inv.length - 1; i >= 0 && remaining > 0; i--) {
    if (inv[i].id !== id) continue;
    const take = Math.min(inv[i].count, remaining);
    inv[i].count -= take;
    remaining -= take;
    if (inv[i].count <= 0) inv.splice(i, 1);
  }
  return remaining === 0;
}
export function countItem(inv, id) {
  return inv.filter(s => s.id === id).reduce((sum, s) => sum + s.count, 0);
}
export function sortInventory(inv) {
  const order = { potion: 0, weapon: 1, armor: 2, shield: 3, helmet: 4, boots: 5, ring: 6, loot: 7 };
  inv.sort((a, b) => (order[ITEMS[a.id]?.type] ?? 9) - (order[ITEMS[b.id]?.type] ?? 9) || a.id.localeCompare(b.id));
}
