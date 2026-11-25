// Pure formulas from GAME_PLAN.md section 4.5 - 4.7. No state mutation here.
import { inBounds, keyOf } from './grid.js?v=20261125-bal6';
import { fieldsOf } from './placement.js?v=20261125-bal6';

export const RESOURCE_CLASSES = ['abundant', 'neutral', 'scarce'];

export function classOf(biome, resource, data) {
  const b = data.biomes[biome];
  if (!b) throw new Error(`Unknown biome: ${biome}`);
  if (b.abundant.includes(resource)) return 'abundant';
  if (b.scarce.includes(resource)) return 'scarce';
  return 'neutral';
}

export function biomeFactor(cls, data) {
  return data.economy.biomeFactors[cls];
}

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function neighbourTiles(state, x, y) {
  const out = [];
  for (const [dx, dy] of NEIGHBOURS) {
    const nx = x + dx;
    const ny = y + dy;
    if (!inBounds(nx, ny)) continue;
    const t = state.tiles[keyOf(nx, ny)];
    if (t) out.push(t);
  }
  return out;
}

/**
 * Multiplier M for a building of `buildingId` placed at (x, y).
 * Perks are not implemented yet (P1 later step); they contribute 1.0.
 */
export function productionMultiplier(state, x, y, buildingId, data) {
  const def = data.buildings[buildingId];
  const tile = state.tiles[keyOf(x, y)];
  let m = biomeFactor(classOf(state.biome, def.resource, data), data);
  m *= 1 + data.economy.levelBonusPerTownLevel * (state.townLevel - 1);

  if (def.terrainBonus && tile?.terrain === def.terrainBonus.terrain) {
    m *= def.terrainBonus.multiplier;
  }
  // Betriebsart (z. B. Fischerei: Steg oder Boot am Ufer).
  if (def.modes && tile?.building?.mode && def.modes[tile.building.mode]) {
    m *= def.modes[tile.building.mode].multiplier;
  }
  if (def.adjacencyBonus) {
    const { adjacentTo, multiplier } = def.adjacencyBonus;
    const hit = neighbourTiles(state, x, y).some((t) =>
      adjacentTo.building
        ? t.building?.id === adjacentTo.building
        : t.terrain === adjacentTo.terrain,
    );
    if (hit) m *= multiplier;
  }
  m *= data.economy.yieldMultiplier ?? 1; // Freibrief-Perk „Ertrag“
  return m;
}

// ---------- Ökosystem: Bestand je Kachel (100 = voll, fehlt = voll) ----------

export const FULL = 100;

/** Waldbestand der Kachel (0 bis 100). Nur Waldkacheln haben einen Wert. */
export const forestHealth = (state, x, y) => state.tiles[keyOf(x, y)]?.wood ?? FULL;

/** Fischbestand des Wassers (0 bis 100). */
export const fishStock = (state, x, y) => state.tiles[keyOf(x, y)]?.fish ?? FULL;

/** Bodenfruchtbarkeit eines Feldes (0 bis 100). */
export const soilOf = (tile) => tile?.field?.soil ?? FULL;

/**
 * Wo die Fischerei fischt: die eigene Wasserkachel (Steg) oder die Nachbar-Wasserkachel mit dem meisten
 * Fisch (Boot am Ufer). Null, wenn kein Wasser da ist.
 */
export function fishingGround(state, x, y) {
  const t = state.tiles[keyOf(x, y)];
  if (!t) return null;
  if (t.terrain === 'water') return [x, y];
  let best = null;
  for (const [dx, dy] of NEIGHBOURS) {
    const nx = x + dx;
    const ny = y + dy;
    if (!inBounds(nx, ny)) continue;
    const n = state.tiles[keyOf(nx, ny)];
    if (n?.terrain !== 'water') continue;
    const st = fishStock(state, nx, ny);
    if (!best || st > best.st) best = { x: nx, y: ny, st };
  }
  return best ? [best.x, best.y] : null;
}

/** Ertragsfaktor eines Gebäudes aus seinem Bestand (1 = voll). Felder rechnen einzeln, siehe ratePerMin. */
export function ecologyFactor(state, x, y, id, data) {
  const e = data.economy.ecology;
  if (id === 'sawmill') return Math.max(e.forest.floor, forestHealth(state, x, y) / FULL);
  if (id === 'fishery') {
    const g = fishingGround(state, x, y);
    return g ? Math.max(e.fish.floor, fishStock(state, g[0], g[1]) / FULL) : e.fish.floor;
  }
  return 1;
}

/** Ertragsfaktor eines einzelnen Feldes aus seiner Bodenfruchtbarkeit. */
export function soilFactor(tile, data) {
  const floor = data.economy.ecology.soil.floor;
  return floor + (1 - floor) * (soilOf(tile) / FULL);
}

/**
 * Einheiten pro Minute. Normale Gebäude wachsen mit der Stufe. Die Farm (perField) liefert je angelegtem
 * Feld die Grundrate, gemindert durch die Bodenfruchtbarkeit des Feldes. Sägewerk und Fischerei
 * sinken mit ihrem Bestand.
 */
export function ratePerMin(state, x, y, data) {
  const b = state.tiles[keyOf(x, y)]?.building;
  if (!b) return 0;
  const def = data.buildings[b.id];
  if (!def.resource) return 0;
  const m = productionMultiplier(state, x, y, b.id, data);
  if (def.perField) {
    const sum = fieldsOf(state, x, y).reduce((acc, k) => acc + soilFactor(state.tiles[k], data), 0);
    return def.baseRatePerMin * sum * m;
  }
  return def.baseRatePerMin * b.level * m * ecologyFactor(state, x, y, b.id, data);
}

/** Cost to build (level = 0) or to upgrade from `level` to `level + 1`. */
export function buildCost(buildingId, level, data) {
  const d = data.buildings[buildingId];
  const g = data.economy;
  return {
    coins: Math.ceil(d.baseCoins * Math.pow(g.upgradeCostGrowth, level)),
    material: {
      resource: d.baseMaterial.resource,
      amount: Math.ceil(d.baseMaterial.amount * Math.pow(g.materialCostGrowth, level)),
    },
  };
}

export function townLevelFor(xp, thresholds) {
  let level = 1;
  thresholds.forEach((t, i) => {
    if (xp >= t) level = i + 1;
  });
  return level;
}

function sumBuildingLevels(state, buildingId) {
  let sum = 0;
  for (const t of Object.values(state.tiles)) {
    if (t.building?.id === buildingId) sum += t.building.level;
  }
  return sum;
}

export const warehouseLevels = (state) => sumBuildingLevels(state, 'warehouse');
export const marketLevels = (state) => sumBuildingLevels(state, 'marketSquare');

export function storageCap(state, data) {
  const s = data.economy.storage;
  // Freibrief-Perk „Lagerhaus“ wirkt als Faktor (1 = ohne Perk).
  return Math.floor((s.base + s.perWarehouseLevel * warehouseLevels(state)) * (data.economy.storageMultiplier ?? 1));
}

export function throughputPerMin(state, data) {
  const s = data.economy.sell;
  return s.townHallThroughputPerMin + s.throughputPerMarketLevel * marketLevels(state);
}

export function sellPrice(resource, data) {
  // Freibrief-Perk „Warenkenner“ wirkt als Faktor (1 = ohne Perk).
  return data.resources[resource].basePrice * (data.economy.priceMultiplier ?? 1);
}

