// Game engine: state creation, player actions and time advance.
// Every exported action is (state, input, ctx) -> { state, events, error? }.
// The input state is never mutated.
import { generateTerrain } from './terrain.js?v=20261124-sitz1';
import { GRID, HALL, keyOf, parseKey, inBounds, isUnlocked } from './grid.js?v=20261124-sitz1';
import {
  classOf, buildCost, productionMultiplier, townLevelFor,
  storageCap, throughputPerMin, sellPrice,
} from './economy.js?v=20261124-sitz1';
import { merchantOffers } from './merchant.js?v=20261124-sitz1';

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

  const cost = buildCost(buildingId, 0, data);
  if (s.coins < cost.coins) return fail(state, 'noCoins');
  if ((s.stock[cost.material.resource] ?? 0) < cost.material.amount) return fail(state, 'noMaterial');

  pay(s, cost.coins, cost.material);
  tile.building = { id: buildingId, level: 1 };

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

function produce(s, dt, data, events) {
  const cap = storageCap(s, data);
  const produced = {};
  for (const [k, tile] of Object.entries(s.tiles)) {
    if (!tile.building) continue;
    const def = data.buildings[tile.building.id];
    if (!def.resource) continue;
    const [x, y] = parseKey(k);
    const perSec = (def.baseRatePerMin * tile.building.level / 60)
      * productionMultiplier(s, x, y, tile.building.id, data);
    const before = s.stock[def.resource];
    const after = Math.min(cap, before + perSec * dt);
    s.stock[def.resource] = after;
    produced[def.resource] = (produced[def.resource] ?? 0) + Math.max(0, after - before);
  }
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

  return { state: s, events, appliedSec: dt, capped: elapsed > dt };
}

