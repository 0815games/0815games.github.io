// Game engine: state creation, player actions and time advance.
// Every exported action is (state, input, ctx) -> { state, events, error? }.
// The input state is never mutated.
import { generateTerrain } from './terrain.js?v=20261125-bal2';
import { GRID, HALL, keyOf, parseKey, inBounds, isUnlocked } from './grid.js?v=20261125-bal2';
import { checkPlacement, fieldsOf, fieldSlots } from './placement.js?v=20261125-bal2';
import {
  classOf, buildCost, productionMultiplier, townLevelFor,
  storageCap, throughputPerMin, sellPrice, ratePerMin,
  FULL, fishingGround, soilOf, fishStock, forestHealth,
} from './economy.js?v=20261125-bal2';
import { merchantOffers } from './merchant.js?v=20261125-bal2';
import { arriveConvoys, payoutFor } from './convoys.js?v=20261125-bal2';

export const SCHEMA_VERSION = 1;
export const BIOMES = ['riverlands', 'deepwoods', 'highlands', 'coast'];

const clone = (o) => structuredClone(o);

/** Pick a biome at random, never the same as `lastBiome`. */
export function chooseBiome(rnd, lastBiome = null) {
  const pool = BIOMES.filter((b) => b !== lastBiome);
  return pool[Math.floor(rnd() * pool.length)];
}

export function createTown({ name, biome, seed, now, data }) {
  const terrain = generateTerrain(biome, seed);
  const tiles = {};
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      tiles[keyOf(x, y)] = { terrain: terrain[y][x] };
    }
  }
  tiles[keyOf(HALL.x, HALL.y)].building = { id: 'townHall', level: 1 };

  const stock = {};
  const sellEnabled = {};
  for (const r of Object.keys(data.resources)) {
    stock[r] = data.economy.startStockPerResource;
    // Karg-Ressourcen are kept for building unless the player opts in.
    sellEnabled[r] = classOf(biome, r, data) !== 'scarce';
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    id: `town-${seed.toString(36)}`,
    name,
    biome,
    seed,
    townLevel: 1,
    townXp: 0,
    coins: data.economy.startCoins,
    lifetimeCoins: 0,
    stock,
    sellEnabled,
    tiles,
    merchant: { dateKey: null, bought: {} },
    tutorialStep: 0,
    lastTick: now,
    createdAt: now,
  };
}

export function newSeed(rnd = Math.random) {
  return Math.floor(rnd() * 0xffffffff) >>> 0;
}

function addXp(s, amount, data) {
  s.townXp += amount;
  const level = townLevelFor(s.townXp, data.economy.townLevelThresholds);
  if (level > s.townLevel) {
    const from = s.townLevel;
    s.townLevel = level;
    return { type: 'levelUp', from, level };
  }
  return null;
}

function rollMerchantDay(s, dateKey) {
  if (s.merchant.dateKey !== dateKey) s.merchant = { dateKey, bought: {} };
}

function pay(s, coins, material) {
  s.coins -= coins;
  if (material) s.stock[material.resource] -= material.amount;
}

function fail(state, error) {
  return { state, events: [], error };
}

/**
 * Brings a stored town (Firebase or localStorage) into the current shape.
 * Realtime Database drops empty objects and null values, so they are restored here.
 */
export function hydrateTown(raw) {
  const s = clone(raw);
  s.schemaVersion ??= SCHEMA_VERSION;
  s.merchant = { dateKey: s.merchant?.dateKey ?? null, bought: s.merchant?.bought ?? {} };
  s.sellEnabled ??= {};
  s.stock ??= {};
  s.tiles ??= {};
  s.townXp ??= 0;
  s.lifetimeCoins ??= 0;
  s.tutorialStep ??= 0;
  s.convoys ??= [];
  s.convoySeq ??= 0;
  return s;
}

// ---------- Actions ----------

export function placeBuilding(state, { x, y, buildingId }, ctx) {
  const { data } = ctx;
  if (!inBounds(x, y)) return fail(state, 'outOfBounds');
  if (!isUnlocked(x, y, state.townLevel, data)) return fail(state, 'locked');
  const def = data.buildings[buildingId];
  if (!def || def.fixed) return fail(state, 'unknownBuilding');
  if (def.unlockTownLevel > state.townLevel) return fail(state, 'townLevelTooLow');

  const s = clone(state);
  const tile = s.tiles[keyOf(x, y)];
  if (tile.building) return fail(state, 'occupied');
  if (tile.field) return fail(state, 'fieldOccupied');
  const place = checkPlacement(state, x, y, buildingId, data);
  if (!place.ok) return fail(state, place.reason);

  const cost = buildCost(buildingId, 0, data);
  if (s.coins < cost.coins) return fail(state, 'noCoins');
  if ((s.stock[cost.material.resource] ?? 0) < cost.material.amount) return fail(state, 'noMaterial');

  pay(s, cost.coins, cost.material);
  tile.building = place.mode ? { id: buildingId, level: 1, mode: place.mode } : { id: buildingId, level: 1 };

  const events = [{ type: 'built', x, y, buildingId }];
  const lu = addXp(s, data.economy.xp.buildingPlaced, data);
  if (lu) events.push(lu);
  return { state: s, events };
}

export function upgradeBuilding(state, { x, y }, ctx) {
  const { data } = ctx;
  const b = state.tiles[keyOf(x, y)]?.building;
  if (!b) return fail(state, 'noBuilding');
  if (b.id === 'townHall') return fail(state, 'notUpgradable');
  const def = data.buildings[b.id];
  if (b.level >= def.maxLevel) return fail(state, 'maxLevel');

  const cost = buildCost(b.id, b.level, data);
  if (state.coins < cost.coins) return fail(state, 'noCoins');
  if ((state.stock[cost.material.resource] ?? 0) < cost.material.amount) return fail(state, 'noMaterial');

  const s = clone(state);
  pay(s, cost.coins, cost.material);
  const sb = s.tiles[keyOf(x, y)].building;
  sb.level += 1;

  const events = [{ type: 'upgraded', x, y, buildingId: b.id, level: sb.level }];
  const lu = addXp(s, data.economy.xp.upgradePerNewLevel * sb.level, data);
  if (lu) events.push(lu);
  return { state: s, events };
}

/** Legt ein Feld der Farm (fx, fy) auf der angrenzenden Wiese (x, y) an. Kostet Münzen und Holz. */
export function plantField(state, { fx, fy, x, y }, ctx) {
  const { data } = ctx;
  const farm = state.tiles[keyOf(fx, fy)]?.building;
  if (!farm || farm.id !== 'farm') return fail(state, 'noFarm');
  if (!inBounds(x, y) || Math.max(Math.abs(x - fx), Math.abs(y - fy)) !== 1) return fail(state, 'notNextToFarm');
  if (!isUnlocked(x, y, state.townLevel, data)) return fail(state, 'locked');
  const t = state.tiles[keyOf(x, y)];
  if (t.building) return fail(state, 'occupied');
  if (t.field) return fail(state, 'alreadyField');
  if (t.terrain !== 'meadow') return fail(state, 'terrain');
  if (fieldsOf(state, fx, fy).length >= fieldSlots(farm.level)) return fail(state, 'noFieldSlot');

  const cost = data.economy.fields;
  if (state.coins < cost.coins) return fail(state, 'noCoins');
  if ((state.stock[cost.material.resource] ?? 0) < cost.material.amount) return fail(state, 'noMaterial');

  const s = clone(state);
  pay(s, cost.coins, cost.material);
  s.tiles[keyOf(x, y)].field = { owner: keyOf(fx, fy) };
  return { state: s, events: [{ type: 'fieldPlanted', x, y, fx, fy }] };
}

/** Erneuert einen ausgelaugten Acker: Fruchtbarkeit zurück auf voll. Kostet wie ein neues Feld. */
export function renewField(state, { x, y }, ctx) {
  const { data } = ctx;
  const t = state.tiles[keyOf(x, y)];
  if (!t?.field) return fail(state, 'noField');
  if (soilOf(t) >= FULL) return fail(state, 'soilFine');
  const cost = data.economy.fields;
  if (state.coins < cost.coins) return fail(state, 'noCoins');
  if ((state.stock[cost.material.resource] ?? 0) < cost.material.amount) return fail(state, 'noMaterial');
  const s = clone(state);
  pay(s, cost.coins, cost.material);
  s.tiles[keyOf(x, y)].field.soil = FULL;
  return { state: s, events: [{ type: 'fieldRenewed', x, y }] };
}

/** Entfernt ein Feld. Kein Erstattung, damit der Vorgang nicht zum Ausprobieren einlädt. */
export function removeField(state, { x, y }) {
  const t = state.tiles[keyOf(x, y)];
  if (!t?.field) return fail(state, 'noField');
  const s = clone(state);
  delete s.tiles[keyOf(x, y)].field;
  return { state: s, events: [{ type: 'fieldRemoved', x, y }] };
}


/**
 * Rechnet einen angekommenen Konvoi ab. Idempotent: Die Konvoi-ID ist der Schlüssel, ein zweiter Aufruf
 * ändert nichts. Kronen gehen nicht in den Stadtstand, sie werden in `payout.crowns` zurückgegeben
 * und vom Konto gutgeschrieben (Scheibe 5).
 */
export function settleConvoyAction(state, { id }, ctx) {
  const { data } = ctx;
  const idx = (state.convoys ?? []).findIndex((c) => c.id === id);
  if (idx < 0) return fail(state, 'noConvoy');
  const convoy = state.convoys[idx];
  if (convoy.status === 'settled') return fail(state, 'alreadySettled');
  if (convoy.status !== 'arrived') return fail(state, 'notArrived');

  const payout = payoutFor(state, convoy, data);
  const s = clone(state);
  const c = s.convoys[idx];
  c.status = 'settled';
  c.payout = payout;
  s.coins += payout.coins;
  s.lifetimeCoins += payout.coins;
  if (payout.goods > 0) {
    const cap = storageCap(s, data);
    s.stock[convoy.resource] = Math.min(cap, (s.stock[convoy.resource] ?? 0) + payout.goods);
  }
  const lu = addXp(s, payout.xp + payout.coins * data.economy.xp.perCoin, data);
  const events = [{ type: 'convoy_settled', id, coins: payout.coins, crowns: payout.crowns, goods: payout.goods }];
  if (lu) events.push(lu);
  return { state: s, events, payout };
}

export function toggleSell(state, { resource }) {
  if (!(resource in state.sellEnabled)) return fail(state, 'unknownResource');
  const s = clone(state);
  s.sellEnabled[resource] = !s.sellEnabled[resource];
  return { state: s, events: [] };
}

/** Tutorial-Fortschritt pro Konto (wird mit dem Spielstand gespeichert). Reine Zustandsänderung. */
export function setTutorialStep(state, step) {
  if (!Number.isInteger(step) || step < 0 || step > 99) return fail(state, 'invalidStep');
  const s = clone(state);
  s.tutorialStep = step;
  return { state: s, events: [] };
}

export function buyOffer(state, { index }, ctx) {
  const { data, dateKey } = ctx;
  const s = clone(state);
  rollMerchantDay(s, dateKey);
  const offers = merchantOffers(s.id, dateKey, s.biome, data);
  const offer = offers[index];
  if (!offer) return fail(state, 'noOffer');
  if (s.merchant.bought[index]) return fail(state, 'alreadyBought');

  const total = offer.unitPrice * offer.quantity;
  if (s.coins < total) return fail(state, 'noCoins');
  if (s.stock[offer.resource] + offer.quantity > storageCap(s, data)) return fail(state, 'storageFull');

  s.coins -= total;
  s.stock[offer.resource] += offer.quantity;
  s.merchant.bought[index] = true;

  const events = [{ type: 'merchantBought', offer }];
  const lu = addXp(s, data.economy.xp.merchantPurchase, data);
  if (lu) events.push(lu);
  return { state: s, events };
}

// ---------- Time ----------

/** Verbrauch durch Produktion: Wald, Fisch und Boden sinken je erzeugter Einheit. */
function depleteFor(s, x, y, def, added, data) {
  const e = data.economy.ecology;
  const tile = s.tiles[keyOf(x, y)];
  if (def.perField) {
    const fields = fieldsOf(s, x, y);
    if (!fields.length) return;
    const per = (added / fields.length) * e.soil.wearPerUnit;
    for (const k of fields) {
      const f = s.tiles[k].field;
      f.soil = Math.max(0, soilOf(s.tiles[k]) - per);
    }
  } else if (tile.building.id === 'sawmill') {
    tile.wood = Math.max(0, forestHealth(s, x, y) - added * e.forest.wearPerUnit);
  } else if (tile.building.id === 'fishery') {
    const g = fishingGround(s, x, y);
    if (g) {
      const gt = s.tiles[keyOf(g[0], g[1])];
      gt.fish = Math.max(0, fishStock(s, g[0], g[1]) - added * e.fish.wearPerUnit);
    }
  }
}

/** Erholung: Wald, Fischbestand und Boden wachsen langsam von allein nach. */
function regrow(s, dt, data) {
  const e = data.economy.ecology;
  for (const tile of Object.values(s.tiles)) {
    if (tile.terrain === 'forest' && tile.wood !== undefined && tile.wood < FULL) {
      tile.wood = Math.min(FULL, tile.wood + e.forest.regenPerMin * dt / 60);
    }
    if (tile.terrain === 'water' && tile.fish !== undefined && tile.fish < FULL) {
      tile.fish = Math.min(FULL, tile.fish + e.fish.regenPerMin * dt / 60);
    }
    if (tile.field && soilOf(tile) < FULL) {
      tile.field.soil = Math.min(FULL, soilOf(tile) + e.soil.regenPerMin * dt / 60);
    }
  }
}

function produce(s, dt, data, events) {
  const cap = storageCap(s, data);
  const produced = {};
  for (const [k, tile] of Object.entries(s.tiles)) {
    if (!tile.building) continue;
    const def = data.buildings[tile.building.id];
    if (!def.resource) continue;
    const [x, y] = parseKey(k);
    const perSec = ratePerMin(s, x, y, data) / 60;
    const before = s.stock[def.resource];
    const after = Math.min(cap, before + perSec * dt);
    s.stock[def.resource] = after;
    const added = Math.max(0, after - before);
    produced[def.resource] = (produced[def.resource] ?? 0) + added;
    depleteFor(s, x, y, def, added, data);
  }
  regrow(s, dt, data);
  events.push({ type: 'produced', amounts: produced });
}

/** Sell with throughput shared evenly among eligible resources; reserve is kept. */
function sell(s, dt, data, events) {
  const reserve = data.economy.sell.reserve;
  let budget = throughputPerMin(s, data) * dt / 60;
  let coins = 0;
  let units = 0;

  for (let pass = 0; pass < 8 && budget > 1e-9; pass++) {
    const eligible = Object.keys(s.stock).filter(
      (r) => s.sellEnabled[r] && s.stock[r] - reserve > 1e-9,
    );
    if (!eligible.length) break;
    const share = budget / eligible.length;
    let used = 0;
    for (const r of eligible) {
      const amt = Math.min(share, s.stock[r] - reserve);
      s.stock[r] -= amt;
      coins += amt * sellPrice(r, data);
      used += amt;
    }
    budget -= used;
    units += used;
  }

  if (units > 0) {
    s.coins += coins;
    s.lifetimeCoins += coins;
    events.push({ type: 'sold', coins, units });
    const lu = addXp(s, coins * data.economy.xp.perCoin, data);
    if (lu) events.push(lu);
  }
}

/**
 * Advance the town to `nowMs`. Elapsed time is capped at ctx.maxElapsedSec
 * (offline cap). Time beyond the cap is discarded.
 * ctx: { data, maxElapsedSec, dateKey? }
 */
export function advance(state, nowMs, ctx) {
  const { data } = ctx;
  const s = clone(state);
  const events = [];
  const elapsed = Math.max(0, (nowMs - s.lastTick) / 1000);
  const dt = Math.min(elapsed, ctx.maxElapsedSec ?? Infinity);

  if (ctx.dateKey) rollMerchantDay(s, ctx.dateKey);
  if (dt > 0) {
    produce(s, dt, data, events);
    sell(s, dt, data, events);
  }
  if (nowMs > s.lastTick) s.lastTick = nowMs;
  const arr = arriveConvoys(s, nowMs);
  events.push(...arr.events);

  return { state: arr.state, events, appliedSec: dt, capped: elapsed > dt };
}

