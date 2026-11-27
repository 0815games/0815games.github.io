// Kartengrößen 8 bis 16: pro Stadt, abhängig von den Freibriefen. Bestehende Städte bleiben 10 × 10.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTown, hydrateTown, placeBuilding } from '../src/domain/engine.js';
import { generateTerrain } from '../src/domain/terrain.js';
import { hallOf, mapSizeFor, sizeOf, isUnlocked, inBounds, START_MAP, MAX_MAP, BASE_MAP } from '../src/domain/grid.js';
import { tutorialSpot } from '../src/domain/tutorialSpot.js';

const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}`, import.meta.url), 'utf8'));
const data = {
  resources: load('resources.json'),
  biomes: load('biomes.json'),
  buildings: load('buildings.json'),
  economy: load('economy.json'),
  merchant: load('merchant.json'),
};
const NOW = Date.UTC(2026, 10, 25, 8, 0, 0);
const ctx = (extra = {}) => ({ data, dateKey: '2026-11-25', ...extra });

test('Freibriefe: 8, 10, 12, 14, 16, danach nicht mehr', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 9].map(mapSizeFor), [8, 10, 12, 14, 16, 16, 16]);
  assert.equal(START_MAP, 8);
  assert.equal(MAX_MAP, 16);
});

test('neue Stadt hat die Größe ihrer Stufe und das Rathaus in der Mitte', () => {
  for (const n of [8, 10, 12, 14, 16]) {
    const t = createTown({ name: 'T', biome: 'coast', seed: 3, now: NOW, data, mapSize: n });
    assert.equal(sizeOf(t), n);
    assert.equal(Object.keys(t.tiles).length, n * n);
    const h = hallOf(n);
    assert.equal(t.tiles[`${h.x},${h.y}`].building.id, 'townHall');
    assert.equal(t.tiles[`${h.x},${h.y}`].terrain, 'meadow');
  }
});

test('Standardgröße ohne Angabe bleibt 10 × 10 (bestehende Städte)', () => {
  const t = createTown({ name: 'T', biome: 'riverlands', seed: 7, now: NOW, data });
  assert.equal(sizeOf(t), BASE_MAP);
  assert.equal(Object.keys(t.tiles).length, 100);
});

test('alter Stand ohne mapSize wird beim Laden als 10 × 10 gelesen', () => {
  const old = createTown({ name: 'T', biome: 'coast', seed: 2, now: NOW, data });
  delete old.mapSize;
  const back = hydrateTown(JSON.parse(JSON.stringify(old)));
  assert.equal(back.mapSize, 10);
});

test('Terrain-Generator liefert die gewünschte Größe für jedes Biom', () => {
  for (const biome of ['riverlands', 'deepwoods', 'highlands', 'coast']) {
    for (const n of [8, 12, 16]) {
      const g = generateTerrain(biome, 42, n);
      assert.equal(g.length, n);
      assert.ok(g.every((row) => row.length === n));
      const h = hallOf(n);
      assert.equal(g[h.y][h.x], 'meadow');
    }
  }
});

test('Bau nur innerhalb der eigenen Karte', () => {
  const t = createTown({ name: 'T', biome: 'deepwoods', seed: 5, now: NOW, data, mapSize: 8 });
  assert.equal(inBounds(7, 7, 8), true);
  assert.equal(inBounds(8, 0, 8), false);
  assert.equal(inBounds(8, 0, 10), true, 'auf 10 × 10 wäre Feld 8 da');
  const r = placeBuilding(t, { x: 8, y: 0, buildingId: 'farm' }, ctx());
  assert.equal(r.error, 'outOfBounds');
  assert.equal(r.state.tiles['8,0'], undefined, 'kein Feld außerhalb der Karte');
});

test('Freigeschaltetes Quadrat liegt mittig in der Karte und ist nie größer als sie', () => {
  // Stufe 1: 6 × 6. Auf 8 × 8 mittig: Felder 1..6.
  assert.equal(isUnlocked(1, 1, 1, data, 8), true);
  assert.equal(isUnlocked(0, 0, 1, data, 8), false);
  assert.equal(isUnlocked(6, 6, 1, data, 8), true);
  assert.equal(isUnlocked(7, 7, 1, data, 8), false);
  // Auf 10 × 10 wie bisher: Felder 2..7.
  assert.equal(isUnlocked(2, 2, 1, data, 10), true);
  assert.equal(isUnlocked(1, 1, 1, data, 10), false);
  // Hohe Stufe auf 8 × 8 deckt nur die Karte ab, nicht darüber hinaus.
  assert.equal(isUnlocked(0, 0, 12, data, 8), true);
  assert.equal(isUnlocked(8, 8, 12, data, 8), false);
});

test('Tutorial findet auch auf kleinen Karten ein freies Feld am Rathaus', () => {
  const t = createTown({ name: 'T', biome: 'riverlands', seed: 9, now: NOW, data, mapSize: 8 });
  const spot = tutorialSpot(t, 'farm', data);
  assert.ok(spot, 'ein Feld gefunden');
  assert.ok(inBounds(spot.x, spot.y, 8));
  assert.ok(isUnlocked(spot.x, spot.y, t.townLevel, data, 8));
});
