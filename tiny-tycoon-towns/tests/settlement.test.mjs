import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  stageFor, houseCapacity, growHouse, staffFactor, wageDue, assignWorkers,
} from '../src/domain/settlement.js';
import { createTown, placeBuilding, advance, setWorkerAssignment, staffing } from '../src/domain/engine.js';
import { isUnlocked } from '../src/domain/grid.js';

const cfg = JSON.parse(readFileSync(new URL('../data/economy.json', import.meta.url), 'utf8')).settlements;

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

test('staffing: without workers the building runs as before, full staffing adds the bonus', () => {
  assert.equal(staffFactor(0, 3, cfg), cfg.unstaffedFactor, 'ohne Arbeiter kein Abzug');
  assert.equal(staffFactor(3, 3, cfg), cfg.unstaffedFactor + cfg.staffBonus, 'voll besetzt');
  assert.equal(staffFactor(5, 3, cfg), staffFactor(3, 3, cfg), 'mehr Arbeiter als Plätze bringen nichts extra');
  const one = staffFactor(1, 3, cfg);
  assert.ok(one > staffFactor(0, 3, cfg) && one < staffFactor(3, 3, cfg));
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

// ---- Anbindung an den Spielstand (Engine) ----
const data = {
  resources: JSON.parse(readFileSync(new URL('../data/resources.json', import.meta.url), 'utf8')),
  biomes: JSON.parse(readFileSync(new URL('../data/biomes.json', import.meta.url), 'utf8')),
  buildings: JSON.parse(readFileSync(new URL('../data/buildings.json', import.meta.url), 'utf8')),
  economy: JSON.parse(readFileSync(new URL('../data/economy.json', import.meta.url), 'utf8')),
  merchant: JSON.parse(readFileSync(new URL('../data/merchant.json', import.meta.url), 'utf8')),
};
const ctx = { data };
const inStart = (k) => { const [x, y] = k.split(',').map(Number); return isUnlocked(x, y, 2, data); };
const NOW = Date.UTC(2026, 10, 24, 8, 0, 0);

function townWithHouse() {
  let t = createTown({ name: 'T', biome: 'coast', seed: 7, now: NOW, data });
  t = { ...t, townLevel: 2, coins: 100_000 };
  // Freie Wiese für das Haus suchen, am Rand der Startfläche.
  const spot = Object.keys(t.tiles).find((k) => inStart(k) && t.tiles[k].terrain === 'meadow' && !t.tiles[k].building && k !== '4,4');
  const [hx, hy] = spot.split(',').map(Number);
  const r = placeBuilding(t, { x: hx, y: hy, buildingId: 'house' }, ctx);
  assert.equal(r.error, undefined, 'Haus lässt sich auf Stadtlevel 2 bauen');
  return { t: r.state, house: `${hx},${hy}` };
}

test('a house is buildable from town level 2 and starts with the start population', () => {
  const { t, house } = townWithHouse();
  assert.equal(t.tiles[house].building.id, 'house');
  assert.equal(t.tiles[house].building.pop, cfg.startPop);
  const early = placeBuilding({ ...t, townLevel: 1 }, { x: 2, y: 2, buildingId: 'house' }, ctx);
  assert.ok(early.error, 'auf Stadtlevel 1 gesperrt');
});

test('an advance grows the house population over time, capped at its capacity', () => {
  const { t, house } = townWithHouse();
  const a = advance(t, NOW + 60 * 60_000, ctx).state; // 60 Minuten: +3 Bewohner, Kappe 2 (Hütte)
  assert.equal(a.tiles[house].building.pop, houseCapacity(1, cfg), 'auf Kapazität gewachsen');
  const b = advance(a, NOW + 120 * 60_000, ctx).state;
  assert.equal(b.tiles[house].building.pop, houseCapacity(1, cfg), 'bleibt bei der Kapazität');
});

test('the manual assignment is checked: distance and room', () => {
  const { t, house } = townWithHouse();
  const [hx, hy] = house.split(',').map(Number);
  // Hof direkt am Haus (Nachbarfeld, Wiese), dann weit weg.
  const near = Object.keys(t.tiles).find((k) => {
    const [x, y] = k.split(',').map(Number);
    return inStart(k) && Math.abs(x - hx) + Math.abs(y - hy) === 1 && !t.tiles[k].building && t.tiles[k].terrain === 'meadow';
  });
  const [nx, ny] = near.split(',').map(Number);
  const s = placeBuilding({ ...t, stock: { ...t.stock, lumber: 500 } }, { x: nx, y: ny, buildingId: 'farm' }, ctx).state;
  const ok = setWorkerAssignment(s, { producer: near, house, n: 1 }, ctx);
  assert.equal(ok.error, undefined);
  assert.equal(ok.state.tiles[near].building.manual[0].n, 1);
  const tooMany = setWorkerAssignment(ok.state, { producer: near, house, n: 9 }, ctx);
  assert.equal(tooMany.error, 'badAmount');
  const hasNoHouse = setWorkerAssignment(s, { producer: near, house: '0,0', n: 1 }, ctx);
  assert.equal(hasNoHouse.error, 'notHouse');
});

test('wages come out of the coins only for workers who are employed', () => {
  // Ohne Verkauf (sellEnabled leer) ändern nur Löhne das Konto.
  const { t, house } = townWithHouse();
  const idle = advance(t, NOW + 1440 * 60_000, ctx).state;
  assert.equal(idle.coins, t.coins, 'ohne Betrieb kein Lohn');

  const [hx, hy] = house.split(',').map(Number);
  const near = Object.keys(t.tiles).find((k) => {
    const [x, y] = k.split(',').map(Number);
    return inStart(k) && Math.abs(x - hx) + Math.abs(y - hy) === 1 && !t.tiles[k].building && t.tiles[k].terrain === 'meadow';
  });
  const [nx, ny] = near.split(',').map(Number);
  const built = placeBuilding({ ...t, stock: { ...t.stock, lumber: 500 } }, { x: nx, y: ny, buildingId: 'farm' }, ctx).state;
  const staffed = setWorkerAssignment(built, { producer: near, house, n: 1 }, ctx).state;
  const before = staffed.coins;
  // Verkauf aus, damit nur der Lohn das Konto ändert (Karg-Waren werden seit TTT-0082 auch verkauft).
  const after = advance({ ...staffed, sellEnabled: {} }, staffed.lastTick + 1440 * 60_000, ctx).state;
  assert.equal(Math.round(after.coins), Math.round(before - cfg.wagePerWorkerPerDay), 'ein Arbeiter kostet einen Tageslohn');
});

test('staffing shows the assignment the panel uses, without changing the town', () => {
  const { t, house } = townWithHouse();
  const [hx, hy] = house.split(',').map(Number);
  const near = Object.keys(t.tiles).find((k) => {
    const [x, y] = k.split(',').map(Number);
    return inStart(k) && Math.abs(x - hx) + Math.abs(y - hy) === 1 && !t.tiles[k].building && t.tiles[k].terrain === 'meadow';
  });
  const [nx, ny] = near.split(',').map(Number);
  const built = placeBuilding({ ...t, stock: { ...t.stock, lumber: 500 } }, { x: nx, y: ny, buildingId: 'farm' }, ctx).state;
  // Das neue Haus hat einen Bewohner: mehr als einen kann niemand zuweisen.
  const s = setWorkerAssignment(built, { producer: near, house, n: 1 }, ctx).state;
  const wf = staffing(s, data);
  assert.equal(wf.byProducer[near], 1);
  assert.equal(wf.byHouse[house], 1);
  assert.equal(s.tiles[near].building.manual[0].n, 1, 'die Zuweisung liegt im Spielstand');
  const over = setWorkerAssignment(s, { producer: near, house, n: 2 }, ctx);
  assert.equal(over.error, 'noRoom', 'mehr Bewohner als vorhanden wird abgelehnt');
  assert.equal(built.tiles[near].building.manual, undefined, 'vorher keine manuelle Zuweisung');
  assert.equal(staffing(built, data).byProducer[near], 1, 'der Bewohner arbeitet automatisch im nahen Hof');
});

import { tutorialTaskDone } from '../src/domain/settlement.js';

test('tutorial tasks: house and worker are only done when the player did them', () => {
  const empty = { tiles: { '1,1': { terrain: 'meadow' }, '2,2': { terrain: 'meadow', building: { id: 'farm', level: 1 } } } };
  assert.equal(tutorialTaskDone(empty, 'house'), false);
  assert.equal(tutorialTaskDone(empty, 'worker'), false);
  const house = { tiles: { '1,1': { terrain: 'meadow', building: { id: 'house', level: 1, pop: 1 } } } };
  assert.equal(tutorialTaskDone(house, 'house'), true);
  assert.equal(tutorialTaskDone(house, 'worker'), false);
  const worked = { tiles: { '2,2': { terrain: 'meadow', building: { id: 'farm', level: 1, manual: [{ house: '1,1', n: 1 }] } } } };
  assert.equal(tutorialTaskDone(worked, 'worker'), true);
  assert.equal(tutorialTaskDone(worked, 'unknown'), false);
  assert.equal(tutorialTaskDone(null, 'house'), false);
});

test('tutorial task upgrade: a building on level 2 or higher', () => {
  const lvl1 = { tiles: { '2,2': { terrain: 'meadow', building: { id: 'farm', level: 1 } } } };
  const lvl2 = { tiles: { '2,2': { terrain: 'meadow', building: { id: 'farm', level: 2 } } } };
  const hall = { tiles: { '1,1': { terrain: 'meadow', building: { id: 'townHall', level: 5 } } } };
  assert.equal(tutorialTaskDone(lvl1, 'upgrade'), false);
  assert.equal(tutorialTaskDone(lvl2, 'upgrade'), true);
  assert.equal(tutorialTaskDone(hall, 'upgrade'), false, 'Rathaus zählt nicht');
});
