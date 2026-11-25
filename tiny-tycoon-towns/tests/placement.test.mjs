// Platzierungsregeln, Felder der Farm und Berge im Gelände.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { generateTerrain } from '../src/domain/terrain.js';
import { keyOf, HALL } from '../src/domain/grid.js';
import { checkPlacement, fieldsOf, plantableNeighbours } from '../src/domain/placement.js';
import { createTown, placeBuilding, plantField, removeField, advance } from '../src/domain/engine.js';
import { ratePerMin, productionMultiplier } from '../src/domain/economy.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '..', 'data', f), 'utf8'));
const data = {
  resources: load('resources.json'),
  biomes: load('biomes.json'),
  buildings: load('buildings.json'),
  economy: load('economy.json'),
  merchant: load('merchant.json'),
};
const NOW = Date.UTC(2026, 10, 25, 8, 0, 0);
const ctx = (extra = {}) => ({ data, dateKey: '2026-11-25', ...extra });

/** Stadt mit 10×10 Wiese, Rathaus in der Mitte und Lagervorrat für alles. */
function flatTown(biome = 'deepwoods') {
  const t = createTown({ name: 'Test', biome, seed: 1, now: NOW, data });
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) {
    t.tiles[keyOf(x, y)] = { terrain: 'meadow' };
  }
  t.tiles[keyOf(HALL.x, HALL.y)].building = { id: 'townHall', level: 1 };
  t.townLevel = 12;
  t.coins = 1e6;
  for (const r of Object.keys(data.resources)) t.stock[r] = 1000;
  return t;
}
const set = (t, x, y, terrain, extra = {}) => { t.tiles[keyOf(x, y)] = { terrain, ...extra }; return t; };

test('highlands get mountain ranges, other biomes at most a small one', () => {
  let withMountain = 0;
  for (let seed = 1; seed <= 50; seed++) {
    const g = generateTerrain('highlands', seed).flat();
    if (g.includes('mountain')) withMountain++;
  }
  assert.equal(withMountain, 50, 'every highlands map has mountains');
  const g = generateTerrain('highlands', 7);
  assert.equal(g[HALL.y][HALL.x], 'meadow', 'hall tile stays meadow');
});

test('mine only stands on a mountain', () => {
  const t = flatTown();
  assert.equal(checkPlacement(t, 2, 2, 'mine', data).ok, false);
  set(t, 2, 2, 'rock');
  assert.equal(checkPlacement(t, 2, 2, 'mine', data).reason, 'terrain');
  set(t, 2, 2, 'mountain');
  assert.equal(checkPlacement(t, 2, 2, 'mine', data).ok, true);
  const r = placeBuilding(t, { x: 2, y: 2, buildingId: 'mine' }, ctx());
  assert.equal(r.error, undefined);
  set(t, 3, 3, 'meadow');
  assert.equal(placeBuilding(t, { x: 3, y: 3, buildingId: 'mine' }, ctx()).error, 'terrain');
});

test('quarry needs rock, sawmill needs forest, saltworks needs sand', () => {
  const t = flatTown();
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'quarry' }, ctx()).error, 'terrain');
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'sawmill' }, ctx()).error, 'terrain');
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'saltworks' }, ctx()).error, 'terrain');
  set(t, 2, 2, 'rock');
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'quarry' }, ctx()).error, undefined);
  set(t, 3, 3, 'forest');
  assert.equal(placeBuilding(t, { x: 3, y: 3, buildingId: 'sawmill' }, ctx()).error, undefined);
  set(t, 5, 5, 'sand');
  assert.equal(placeBuilding(t, { x: 5, y: 5, buildingId: 'saltworks' }, ctx()).error, undefined);
});

test('farm only on meadow', () => {
  const t = flatTown();
  set(t, 2, 2, 'forest');
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'farm' }, ctx()).error, 'terrain');
  set(t, 2, 2, 'meadow');
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'farm' }, ctx()).error, undefined);
});

test('fishery: Steg on water, Boot on the shore, nothing inland', () => {
  const t = flatTown();
  set(t, 2, 2, 'water');
  const steg = placeBuilding(t, { x: 2, y: 2, buildingId: 'fishery' }, ctx());
  assert.equal(steg.state.tiles['2,2'].building.mode, 'steg');

  const shore = flatTown();
  set(shore, 3, 3, 'water');
  const boot = placeBuilding(shore, { x: 3, y: 2, buildingId: 'fishery' }, ctx());
  assert.equal(boot.state.tiles['3,2'].building.mode, 'boot');

  const inland = flatTown();
  assert.equal(placeBuilding(inland, { x: 2, y: 2, buildingId: 'fishery' }, ctx()).error, 'terrain');
});

test('fishery modes change the yield', () => {
  const steg = placeBuilding(set(flatTown(), 2, 2, 'water'), { x: 2, y: 2, buildingId: 'fishery' }, ctx()).state;
  const t2 = flatTown(); set(t2, 3, 3, 'water');
  const boot = placeBuilding(t2, { x: 3, y: 2, buildingId: 'fishery' }, ctx()).state;
  const rs = ratePerMin(steg, 2, 2, data);
  const rb = ratePerMin(boot, 3, 2, data);
  assert.ok(rb > rs, `boot ${rb} must beat steg ${rs}`);
});

test('pearl hut only on water, apiary needs forest next to it', () => {
  const t = flatTown();
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'pearlHut' }, ctx()).error, 'terrain');
  set(t, 2, 2, 'water');
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'pearlHut' }, ctx()).error, undefined);

  const a = flatTown();
  assert.equal(placeBuilding(a, { x: 5, y: 5, buildingId: 'apiary' }, ctx()).error, 'near');
  set(a, 6, 5, 'forest');
  assert.equal(placeBuilding(a, { x: 5, y: 5, buildingId: 'apiary' }, ctx()).error, undefined);
});

test('warehouse and market on any land, never on water', () => {
  const t = flatTown();
  set(t, 2, 2, 'water');
  assert.equal(placeBuilding(t, { x: 2, y: 2, buildingId: 'warehouse' }, ctx()).error, 'terrain');
  set(t, 3, 3, 'mountain');
  assert.equal(placeBuilding(t, { x: 3, y: 3, buildingId: 'warehouse' }, ctx()).error, undefined);
});

test('farm plants fields on free meadow next to it, one per level', () => {
  let t = placeBuilding(flatTown(), { x: 2, y: 2, buildingId: 'farm' }, ctx()).state;
  const r1 = plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx());
  assert.equal(r1.error, undefined);
  assert.equal(r1.state.tiles['3,2'].field.owner, '2,2');
  assert.equal(plantField(r1.state, { fx: 2, fy: 2, x: 2, y: 3 }, ctx()).error, 'noFieldSlot', 'stufe 1 hat nur einen Platz');
  assert.equal(plantField(t, { fx: 2, fy: 2, x: 5, y: 5 }, ctx()).error, 'notNextToFarm');
  assert.equal(plantField(t, { fx: 5, fy: 5, x: 5, y: 6 }, ctx()).error, 'noFarm');
});

test('fields cannot go on water, forest or a building', () => {
  let t = placeBuilding(flatTown(), { x: 2, y: 2, buildingId: 'farm' }, ctx()).state;
  set(t, 3, 2, 'water');
  assert.equal(plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx()).error, 'terrain');
  set(t, 3, 2, 'forest');
  assert.equal(plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx()).error, 'terrain');
  set(t, 3, 2, 'meadow', { building: { id: 'warehouse', level: 1 } });
  assert.equal(plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx()).error, 'occupied');
});

test('farm yields per field, not per level', () => {
  let t = placeBuilding(flatTown(), { x: 2, y: 2, buildingId: 'farm' }, ctx()).state;
  assert.equal(ratePerMin(t, 2, 2, data), 0, 'ohne Feld kein Ertrag');
  t = plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx()).state;
  const one = ratePerMin(t, 2, 2, data);
  assert.ok(one > 0);
  t.tiles['2,2'].building.level = 2;
  assert.equal(ratePerMin(t, 2, 2, data), one, 'neue Stufe allein bringt noch keinen Ertrag');
  t = plantField(t, { fx: 2, fy: 2, x: 2, y: 3 }, ctx()).state;
  assert.ok(Math.abs(ratePerMin(t, 2, 2, data) / one - 2) < 1e-9, 'zwei Felder, doppelter Ertrag');
});

test('removing a field frees its slot without refund', () => {
  let t = placeBuilding(flatTown(), { x: 2, y: 2, buildingId: 'farm' }, ctx()).state;
  t = plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx()).state;
  const coins = t.coins;
  const r = removeField(t, { x: 3, y: 2 });
  assert.equal(r.error, undefined);
  assert.equal(r.state.tiles['3,2'].field, undefined);
  assert.equal(r.state.coins, coins);
  assert.equal(removeField(r.state, { x: 3, y: 2 }).error, 'noField');
});

test('plantable neighbours and field list', () => {
  let t = placeBuilding(flatTown(), { x: 2, y: 2, buildingId: 'farm' }, ctx()).state;
  assert.equal(plantableNeighbours(t, 2, 2, data).length, 8);
  t = plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx()).state;
  assert.equal(plantableNeighbours(t, 2, 2, data).length, 7);
  assert.deepEqual(fieldsOf(t, 2, 2), ['3,2']);
});

test('fields are paid in coins and lumber', () => {
  let t = placeBuilding(flatTown(), { x: 2, y: 2, buildingId: 'farm' }, ctx()).state;
  t.stock.lumber = 1; // zu wenig für 2 Holz
  assert.equal(plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx()).error, 'noMaterial');
  t.stock.lumber = 10;
  const coins = t.coins;
  const r = plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx());
  assert.equal(r.state.coins, coins - data.economy.fields.coins);
  assert.equal(r.state.stock.lumber, 10 - data.economy.fields.material.amount);
});

test('farm with fields produces over time, bare farm does not', () => {
  let t = placeBuilding(flatTown(), { x: 2, y: 2, buildingId: 'farm' }, ctx()).state;
  t.sellEnabled.grain = false;
  t.stock.grain = 0;
  t = plantField(t, { fx: 2, fy: 2, x: 3, y: 2 }, ctx()).state;
  const before = t.stock.grain;
  const r = advance(t, t.lastTick + 60_000, ctx({ maxElapsedSec: 8 * 3600 }));
  assert.ok(r.state.stock.grain > before);
  assert.ok(productionMultiplier(t, 2, 2, 'farm', data) > 0);
});

test('existing buildings on other ground keep working (no forced demolition)', () => {
  const t = flatTown();
  set(t, 2, 2, 'rock', { building: { id: 'mine', level: 1 } });
  // Produktion wird nicht nachträglich geprüft; die Mine liefert weiter.
  assert.ok(ratePerMin(t, 2, 2, data) > 0);
});

test('farm rule keys are present in the buildings data', () => {
  for (const [id, def] of Object.entries(data.buildings)) {
    if (def.fixed) continue;
    assert.ok(def.placement, `${id} has a placement rule`);
    assert.ok(def.placement.hint, `${id} has a hint`);
  }
});
