// Daily wandering merchant ("Eberhard"). Offers are derived from a seed,
// so no server is needed and the same town sees the same offers all day.
import { fnv1a, mulberry32 } from './rng.js?v=20261124-welt1';
import { classOf, sellPrice } from './economy.js?v=20261124-welt1';

export function merchantOffers(townId, dateKey, biome, data) {
  const cfg = data.merchant;
  const rnd = mulberry32(fnv1a(`${townId}|${dateKey}`));

  let pool = Object.keys(data.resources).map((r) => ({
    resource: r,
    weight: cfg.weightByClass[classOf(biome, r, data)],
  }));

  const steps = Math.floor((cfg.quantity.max - cfg.quantity.min) / cfg.quantity.step);
  const offers = [];
  for (let i = 0; i < cfg.offersPerDay && pool.length; i++) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let roll = rnd() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      roll -= pool[idx].weight;
      if (roll < 0) break;
    }
    const [picked] = pool.splice(idx, 1);
    const quantity = cfg.quantity.min + cfg.quantity.step * Math.floor(rnd() * (steps + 1));
    const mult = cfg.priceMultiplier.min + rnd() * (cfg.priceMultiplier.max - cfg.priceMultiplier.min);
    offers.push({
      index: i,
      resource: picked.resource,
      quantity,
      unitPrice: Math.ceil(sellPrice(picked.resource, data) * mult),
      mood: cfg.moods[Math.floor(rnd() * cfg.moods.length)],
    });
  }
  return offers;
}

/** Local calendar day as YYYY-MM-DD. Uses the device's local time. */
export function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
