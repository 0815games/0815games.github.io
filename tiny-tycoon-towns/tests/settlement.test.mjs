import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  stageFor, houseCapacity, growHouse, staffFactor, wageDue, assignWorkers,
} from '../src/domain/settlement.js';

const cfg = JSON.parse(readFileSync(new URL('../data/settlements.json', import.meta.url), 'utf8'));

test('five visible stages, switched at the configured levels', () => {
  assert.equal(stageFor(1, cfg).index, 1);
  assert.equal(stageFor(5, cfg).index, 1);
  assert.equal(stageFor(6, cfg).index, 2);
  assert.equal(stageFor(12, cfg).index, 3);
  assert.equal(stageFor(20, cfg).index, 4);
  assert.equal(stageFor(30, cfg).index, 5);
  assert.equal(cfg.stages.length, 5);
});

test('capacity grows with the stage and houses start small', () => {
  assert.equal(houseCapacity(1, cfg), 2);
  assert.ok(houseCapacity(28, cfg) > houseCapacity(1, cfg));
  const h = growHouse({ level: 1, pop: undefined }, 0, cfg);
  assert.equal(h.pop, cfg.startPop);
});

test('growth stops at the capacity and keeps the fraction', () => {
  // 0,05 pro Minute: 10 Minuten sind erst ein halber Bewohner, 20 Minuten einer.
  let h = { level: 1, pop: 1, progress: 0 };
  h = growHouse(h, 10, cfg);
  assert.equal(h.pop, 1, 'nach 10 Minuten noch kein neuer Bewohner');
  assert.equal(h.progress, 0.5, 'Bruchteil bleibt erhalten');
  h = growHouse(h, 10, cfg);
  assert.equal(h.pop, 2, 'nach 20 Minuten ein neuer Bewohner');
  for (let i = 0; i < 100; i++) h = growHouse(h, 10, cfg);
  assert.equal(h.pop, houseCapacity(1, cfg), 'gedeckelt auf Kapazität');
});

test('a house above its capacity drops to the capacity', () => {
  assert.equal(growHouse({ level: 1, pop: 9 }, 5, cfg).pop, houseCapacity(1, cfg));
});

test('staffing: none 0, full 1, partly in between', () => {
  assert.equal(staffFactor(0, 3), 0);
  assert.equal(staffFactor(3, 3), 1);
  assert.equal(staffFactor(5, 3), 1, 'mehr Arbeiter als Plätze bringen nichts extra');
  assert.ok(staffFactor(1, 3) > 0.5 && staffFactor(1, 3) < 1);
});

test('wage is per worker per day, pro rata in minutes', () => {
  assert.equal(wageDue(1, 1440, cfg), cfg.wagePerWorkerPerDay);
  assert.equal(wageDue(2, 720, cfg), cfg.wagePerWorkerPerDay);
  assert.equal(wageDue(0, 60, cfg), 0);
});

test('automatic assignment: far houses are not used, near ones fill the producer', () => {
  const houses = [
    { key: 'near', x: 1, y: 1, pop: 2 },
    { key: 'far', x: 9, y: 9, pop: 5 },
  ];
  const producers = [{ key: 'farm', x: 2, y: 1, rate: 6 }];
  const r = assignWorkers(houses, producers, [], cfg);
  assert.equal(r.byProducer.farm, 2, 'nur die Bewohner des nahen Hauses');
  assert.equal(r.byHouse.far, 0, 'außerhalb des Pendelbereichs');
});

test('automatic assignment prefers the producer with the higher base rate', () => {
  const houses = [{ key: 'h', x: 4, y: 4, pop: 3 }];
  const producers = [
    { key: 'low', x: 4, y: 5, rate: 1 },
    { key: 'high', x: 3, y: 4, rate: 6 },
  ];
  const r = assignWorkers(houses, producers, [], cfg);
  assert.equal(r.byProducer.high, 3, 'der bessere Betrieb wird zuerst besetzt');
  assert.equal(r.byProducer.low, 0);
});

test('manual assignment overrides the automatic one and is checked', () => {
  const houses = [{ key: 'h', x: 4, y: 4, pop: 3 }];
  const producers = [
    { key: 'a', x: 4, y: 5, rate: 6 },
    { key: 'b', x: 4, y: 6, rate: 1 },
  ];
  const r = assignWorkers(houses, producers, [{ house: 'h', producer: 'b', n: 2 }], cfg);
  assert.equal(r.byProducer.b, 2, 'manuell zuerst');
  assert.equal(r.byProducer.a, 1, 'Rest geht automatisch an a');
  assert.equal(r.rejected.length, 0);

  const far = assignWorkers(houses, [{ key: 'z', x: 9, y: 9, rate: 1 }], [{ house: 'h', producer: 'z', n: 1 }], cfg);
  assert.equal(far.byProducer.z, 0);
  assert.equal(far.rejected[0].reason, 'distance');
});
