// Pure formulas from GAME_PLAN.md section 4.5 - 4.7. No state mutation here.
import { inBounds, keyOf } from './grid.js?v=20261124-sitz18';

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

/** Units per minute a building at its current level produces. */
export function ratePerMin(state, x, y, data) {
  const b = state.tiles[keyOf(x, y)]?.building;
  if (!b) return 0;
  const def = data.buildings[b.id];
  if (!def.resource) return 0;
  return def.baseRatePerMin * b.level * productionMultiplier(state, x, y, b.id, data);
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

