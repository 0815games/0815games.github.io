// Arbeiterzuweisung: Ein Bewohner, der schon automatisch arbeitet, lässt sich manuell umbuchen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createTown, setWorkerAssignment, staffing } from '../src/domain/engine.js';

const load = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const data = { resources: load('resources'), biomes: load('biomes'), buildings: load('buildings'), economy: load('economy'), merchant: load('merchant') };
const ctx = { data };

test('a single resident already working automatically can be assigned manually', () => {
  const town = createTown({ name: 'T', biome: 'riverlands', seed: 3, now: 0, data });
  const house = '5,4', farm = '6,4';
  town.tiles[house].building = { id: 'house', level: 1, pop: 1 };
  town.tiles[farm].building = { id: 'farm', level: 1 };
  assert.equal(staffing(town, data).byHouse[house] ?? 0, 1, 'automatisch besetzt');
  const r = setWorkerAssignment(town, { producer: farm, house, n: 1 }, ctx);
  assert.ok(!r.error, r.error);
  const wf = staffing(r.state, data);
  assert.equal(wf.byProducer[farm], 1);
  assert.equal(r.state.tiles[farm].building.manual[0].n, 1);
});

test('more workers than residents are still refused', () => {
  const town = createTown({ name: 'T', biome: 'riverlands', seed: 3, now: 0, data });
  town.tiles['5,4'].building = { id: 'house', level: 1, pop: 1 };
  town.tiles['6,4'].building = { id: 'farm', level: 1 };
  const r = setWorkerAssignment(town, { producer: '6,4', house: '5,4', n: 2 }, ctx);
  assert.ok(r.error, 'zwei Arbeiter aus einem Bewohner werden abgelehnt');
});
