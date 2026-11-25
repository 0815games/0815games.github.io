#!/usr/bin/env node
// Balance-Simulation nach docs/GAME_PLAN.md, Abschnitte 4.17 und 8.2.
// Nutzt die echten Domain-Funktionen (advance, placeBuilding, upgradeBuilding) und die JSON-Daten.
// Kein Browser. Der Bot ist bewusst einfach: er kauft jede Runde die beste Amortisation.
//
// Sitzungsmodell: 2 × 15 Minuten aktiv pro Tag (9:00 und 19:00), der Rest offline.
// Die Offline-Obergrenze gilt wie im Spiel pro Aufruf von advance().
//
// Aufruf:   node scripts/simulate-balance.mjs [--days N]
// Exit 1, wenn ein Meilenstein außerhalb des Korridors aus 4.17 liegt.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTown, advance, placeBuilding, upgradeBuilding, plantField, renewField, BIOMES } from '../src/domain/engine.js';
import { checkPlacement, fieldsOf, plantableNeighbours, fieldSlots } from '../src/domain/placement.js';
import { soilOf } from '../src/domain/economy.js';
import { buildCost, productionMultiplier, storageCap, soilFactor as soilFactorOf } from '../src/domain/economy.js';
import { GRID, keyOf, isUnlocked } from '../src/domain/grid.js';
import { charterGain } from '../src/domain/charters.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const loadJson = (name) => JSON.parse(readFileSync(join(root, 'data', `${name}.json`), 'utf8'));
const data = {
  resources: loadJson('resources'),
  biomes: loadJson('biomes'),
  buildings: loadJson('buildings'),
  economy: loadJson('economy'),
  merchant: loadJson('merchant'),
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY_MIN = 24 * 60;
// Sitzungen: 9:00 bis 9:15 und 19:00 bis 19:15, je 15 Minuten aktiv.
const SESSIONS = [540, 1140];
const SESSION_MIN = 15;
// Aktionen je aktiver Minute. Ein Mensch tippt nicht so schnell wie ein Bot. Annahme, ändert die Zeiten stark.
const ACTIONS_PER_MINUTE = 2;

// Korridore aus GAME_PLAN 4.17 (kumuliert). Die Einheit steht bei jedem Meilenstein.
const CORRIDOR = {
  firstSaleAfterBuildMin: { max: 3, label: 'Erster automatischer Verkauf (min nach erstem Gebäude)' },
  fiveBuildingsActiveMin: { max: 15, label: '5 Gebäude (min aktive Spielzeit)' },
  level5ActiveHours: { min: 4, max: 8, label: 'Stadtlevel 5 (aktive Stunden)' },
  level10ActiveHours: { min: 11, max: 13, label: 'Stadtlevel 10 (aktive Stunden, Ziel 12)' },
};

/** Bot: kauft pro aktiver Minute bis zu ACTIONS_PER_MINUTE Dinge, immer das mit dem besten Wert. */
function botAct(state, ctx) {
  let s = state;
  for (let i = 0; i < ACTIONS_PER_MINUTE; i++) {
    const best = bestAction(s, ctx);
    if (!best) break;
    const r = best.kind === 'build'
      ? placeBuilding(s, { x: best.x, y: best.y, buildingId: best.id }, ctx)
      : best.kind === 'field'
        ? plantField(s, { fx: best.fx, fy: best.fy, x: best.x, y: best.y }, ctx)
        : best.kind === 'renew'
          ? renewField(s, { x: best.x, y: best.y }, ctx)
          : upgradeBuilding(s, { x: best.x, y: best.y }, ctx);
    if (r.error) break;
    s = r.state;
  }
  return s;
}

/**
 * Wert einer Produktion: Ertrag × Verkaufspreis, weniger wenn schon viel davon auf Lager liegt
 * (dann verkauft das Rathaus nicht mehr, siehe Reserve), geteilt durch die Münzkosten.
 * Ohne diese Regel baut der Bot nur Getreide und bleibt bei 63 Gebäuden stehen.
 */
function producerScore(s, d, def, rate, cost) {
  const price = d.resources[def.resource].basePrice;
  const have = s.stock[def.resource] ?? 0;
  const demand = 1 / (1 + have / 50);
  return (rate * price * demand) / cost.coins;
}

function bestAction(s, ctx) {
  const { data: d } = ctx;
  const level = s.townLevel;
  let best = null;
  const consider = (score, action) => { if (!best || score > best.score) best = { ...action, score }; };

  for (const [id, def] of Object.entries(d.buildings)) {
    if (def.fixed || def.unlockTownLevel > level) continue;
    const cost = buildCost(id, 0, d);
    if (s.coins < cost.coins || (s.stock[cost.material.resource] ?? 0) < cost.material.amount) continue;
    if (!def.resource) continue; // Lager und Markt: eigene Regel unten
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      if (!isUnlocked(x, y, level, d)) continue;
      const tile = s.tiles[keyOf(x, y)];
      if (!tile || tile.building) continue;
      const place = checkPlacement(s, x, y, id, d);
      if (!place.ok) continue; // Gelände passt nicht (Berg, Wald, Ufer …)
      // Farm: Wert einer Farm = Grundrate eines Feldes (die Felder kommen unten dazu).
      const rate = def.baseRatePerMin * previewMultiplier(s, x, y, id, place.mode, d);
      consider(producerScore(s, d, def, rate, cost), { kind: 'build', id, x, y });
    }
  }

  // Felder der Farm: jedes Feld liefert die Grundrate der Farm.
  const fieldCost = d.economy.fields;
  if (s.coins >= fieldCost.coins && (s.stock[fieldCost.material.resource] ?? 0) >= fieldCost.material.amount) {
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const b = s.tiles[keyOf(x, y)]?.building;
      if (!b || b.id !== 'farm' || fieldsOf(s, x, y).length >= fieldSlots(b.level)) continue;
      const rate = d.buildings.farm.baseRatePerMin * productionMultiplier(s, x, y, 'farm', d);
      for (const k of plantableNeighbours(s, x, y, d)) {
        const [fx2, fy2] = k.split(',').map(Number);
        consider(producerScore(s, d, d.buildings.farm, rate, { coins: fieldCost.coins }), { kind: 'field', fx: x, fy: y, x: fx2, y: fy2 });
      }
    }
  }

  // Ausgelaugte Felder erneuern, wenn der Boden unter die Schwelle fällt.
  const renewBelow = d.economy.ecology.soil.renewBelow;
  if (s.coins >= fieldCost.coins && (s.stock[fieldCost.material.resource] ?? 0) >= fieldCost.material.amount) {
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const t = s.tiles[keyOf(x, y)];
      if (!t?.field || soilOf(t) >= renewBelow) continue;
      const farm = t.field.owner.split(',').map(Number);
      const b = s.tiles[t.field.owner]?.building;
      if (!b) continue;
      const lost = d.buildings.farm.baseRatePerMin * productionMultiplier(s, farm[0], farm[1], 'farm', d) * (1 - soilFactorOf(t, d));
      consider(producerScore(s, d, d.buildings.farm, lost, { coins: fieldCost.coins }), { kind: 'renew', x, y });
    }
  }

  // Upgrades bestehender Produktion: Gewinn je Stufe / Kosten. Farm: nur wenn alle Felder belegt sind.
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    const b = s.tiles[keyOf(x, y)]?.building;
    if (!b || !d.buildings[b.id].resource) continue;
    const def = d.buildings[b.id];
    if (b.level >= def.maxLevel) continue;
    if (def.perField && fieldsOf(s, x, y).length < fieldSlots(b.level)) continue;
    const cost = buildCost(b.id, b.level, d);
    if (s.coins < cost.coins || (s.stock[cost.material.resource] ?? 0) < cost.material.amount) continue;
    const gain = def.baseRatePerMin * productionMultiplier(s, x, y, b.id, d);
    consider(producerScore(s, d, def, gain, cost), { kind: 'upgrade', x, y });
  }

  // Lager, wenn die Vorräte fast die Kapazität erreichen.
  const cap = storageCap(s, d);
  const fullest = Math.max(0, ...Object.values(s.stock)) / cap;

  // Marktplatz: ohne Verkauf stauen sich die Vorräte am Lagerlimit (Produktion geht verloren) und die XP
  // aus Verkäufen bleiben aus. Der Bot baut deshalb einen Markt und bringt ihn auf Stufe, sobald ein Lager
  // zur Hälfte voll ist. Der Markt steht auf jedem Land, also auch wenn das Raster schon voll ist (Platzierung prüft).
  if (fullest > 0.5) {
    const mk = d.buildings.marketSquare;
    const markets = Object.values(s.tiles).filter((t) => t.building?.id === 'marketSquare');
    const mcost = buildCost('marketSquare', 0, d);
    if (markets.length === 0 && level >= mk.unlockTownLevel && s.coins >= mcost.coins && (s.stock[mcost.material.resource] ?? 0) >= mcost.material.amount) {
      for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
        if (!isUnlocked(x, y, level, d) || s.tiles[keyOf(x, y)]?.building) continue;
        if (!checkPlacement(s, x, y, 'marketSquare', d).ok) continue;
        consider(0.6, { kind: 'build', id: 'marketSquare', x, y });
        return best;
      }
    }
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const b = s.tiles[keyOf(x, y)]?.building;
      if (!b || b.id !== 'marketSquare' || b.level >= mk.maxLevel) continue;
      const uc = buildCost('marketSquare', b.level, d);
      if (s.coins >= uc.coins && (s.stock[uc.material.resource] ?? 0) >= uc.material.amount) {
        consider(0.6, { kind: 'upgrade', x, y });
        return best;
      }
    }
  }

  // Bot-Regel: höchstens 5 Lager, sonst baut er nur noch Lager statt Felder und Upgrades.
  const warehouses = Object.values(s.tiles).filter((t) => t.building?.id === 'warehouse').length;
  if (fullest > 0.9 && warehouses < 5) {
    const wh = d.buildings.warehouse;
    const cost = buildCost('warehouse', 0, d);
    if (s.coins >= cost.coins && (s.stock[cost.material.resource] ?? 0) >= cost.material.amount) {
      for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
        if (!isUnlocked(x, y, level, d) || s.tiles[keyOf(x, y)]?.building) continue;
        if (!checkPlacement(s, x, y, 'warehouse', d).ok) continue;
        consider(0.5, { kind: 'build', id: 'warehouse', x, y });
        return best;
      }
    }
    void wh;
  }
  return best;
}

/** Faktor für ein Gebäude auf (x, y), ohne den Spielstand zu verändern. Berücksichtigt die Fischerei-Betriebsart. */
function previewMultiplier(s, x, y, id, mode, d) {
  const k = keyOf(x, y);
  const st = { ...s, tiles: { ...s.tiles, [k]: { ...s.tiles[k], building: mode ? { id, level: 1, mode } : { id, level: 1 } } } };
  return productionMultiplier(st, x, y, id, d);
}

/** Eine Simulation eines Bioms. Gibt Meilensteine zurück. */
export function simulate({ biome, days }) {
  let now = 0;
  const ctx = { data, maxElapsedSec: data.economy.offline.baseCapHours * 3600, dateKey: null };
  let state = createTown({ name: 'Sim', biome, seed: 1234, now, data });

  const m = {
    firstBuildWall: null,
    firstSaleWall: null,
    fiveBuildingsActive: null,
    level5Wall: null,
    level5Active: null,
    firstCharterWall: null,
    level10Wall: null,
    coins100kWall: null,
    violations: 0,
    levels: {}, // Stadtstufe -> { activeH, wallH }
  };
  let activeMin = 0;

  const countBuildings = (s) => Object.values(s.tiles).filter((t) => t.building && t.building.id !== 'townHall').length;
  const checkMilestones = (s, wallMs, events) => {
    for (let l = 2; l <= s.townLevel; l++) {
      if (!m.levels[l]) m.levels[l] = { activeH: activeMin / 60, wallH: wallMs / HOUR };
    }
    // Invarianten (GAME_PLAN 8.1, Property-Tests): nichts negativ, Lager nie über Kapazität.
    const cap = storageCap(s, data);
    if (s.coins < 0 || Object.values(s.stock).some((v) => v < 0 || v > cap)) m.violations++;
    if (m.firstBuildWall === null && countBuildings(s) > 0) m.firstBuildWall = wallMs;
    if (m.firstSaleWall === null && events.some((e) => e.type === 'sold') && m.firstBuildWall !== null) m.firstSaleWall = wallMs;
    if (m.fiveBuildingsActive === null && countBuildings(s) >= 5) m.fiveBuildingsActive = activeMin;
    if (m.level5Wall === null && s.townLevel >= 5) { m.level5Wall = wallMs; m.level5Active = activeMin; }
    if (m.level10Wall === null && s.townLevel >= 10) m.level10Wall = wallMs;
    if (m.coins100kWall === null && s.lifetimeCoins >= 100000) m.coins100kWall = wallMs;
    if (m.firstCharterWall === null && s.townLevel >= 10 && charterGain(s.lifetimeCoins) >= 1) m.firstCharterWall = wallMs;
  };

  const endDay = days * DAY_MIN;
  for (let day = 0; day < days; day++) {
    for (let si = 0; si < SESSIONS.length; si++) {
      const start = day * DAY_MIN + SESSIONS[si];
      // Offline bis zum Start der Sitzung: ein Aufruf, damit die Obergrenze greift.
      if (start * MIN > now) {
        const r = advance(state, start * MIN, ctx);
        state = r.state; now = start * MIN;
        checkMilestones(state, now, r.events);
      }
      for (let k = 0; k < SESSION_MIN; k++) {
        now += MIN;
        const r = advance(state, now, ctx);
        state = r.state;
        activeMin += 1;
        checkMilestones(state, now, r.events);
        state = botAct(state, ctx);
        checkMilestones(state, now, []);
      }
    }
  }
  // Rest bis Ende des Tages: offline.
  if (endDay * MIN > now) {
    const r = advance(state, endDay * MIN, ctx);
    state = r.state; now = endDay * MIN;
    checkMilestones(state, now, r.events);
  }

  const wallH = (ms) => (ms === null ? null : ms / HOUR);
  return {
    biome,
    buildings: countBuildings(state),
    townLevel: state.townLevel,
    coins: Math.floor(state.coins),
    lifetimeCoins: Math.floor(state.lifetimeCoins),
    firstSaleAfterBuildMin: m.firstSaleWall !== null && m.firstBuildWall !== null
      ? (m.firstSaleWall - m.firstBuildWall) / MIN : null,
    fiveBuildingsActiveMin: m.fiveBuildingsActive,
    level5ActiveHours: m.level5Active === null ? null : m.level5Active / 60,
    level10ActiveHours: m.levels[10]?.activeH ?? null,
    level10WallHours: m.levels[10]?.wallH ?? null,
    firstCharterHours: wallH(m.firstCharterWall),
    level10Hours: wallH(m.level10Wall),
    coins100kHours: wallH(m.coins100kWall),
    firstBuildHours: wallH(m.firstBuildWall),
    capHours: data.economy.offline.baseCapHours,
    violations: m.violations,
    levels: m.levels,
  };
}

function fmt(v) {
  if (v === null || v === undefined) return 'nicht erreicht';
  return typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : String(v);
}

function inCorridor(key, v) {
  const c = CORRIDOR[key];
  if (!c) return true;
  if (v === null) return false;
  if (c.min !== undefined && v < c.min) return false;
  if (c.max !== undefined && v > c.max) return false;
  return true;
}

function main() {
  const argDays = process.argv.indexOf('--days');
  const days = argDays > -1 ? Number(process.argv[argDays + 1]) : 30;
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    console.error('--days muss zwischen 1 und 365 liegen');
    process.exit(2);
  }
  const rows = BIOMES.map((biome) => simulate({ biome, days }));
  let failed = 0;
  for (const r of rows) failed += r.violations;
  console.log(`Balance-Simulation: ${days} Tage, 2 × 15 min aktiv pro Tag, Offline-Obergrenze ${data.economy.offline.baseCapHours} h\n`);
  for (const r of rows) {
    console.log(`Biom ${r.biome}: ${r.buildings} Gebäude, Stadtlevel ${r.townLevel}, Münzen ${r.coins}, Gesamtertrag ${r.lifetimeCoins}`);
    for (const key of Object.keys(CORRIDOR)) {
      const v = r[key];
      const ok = inCorridor(key, v);
      if (!ok) failed++;
      console.log(`  ${ok ? 'ok ' : 'AUS'}  ${CORRIDOR[key].label}: ${fmt(v)}  (Korridor ${CORRIDOR[key].min ?? 0} bis ${CORRIDOR[key].max})`);
    }
    console.log(`  --   Diagnose: Stadtlevel 10 nach ${fmt(r.level10ActiveHours)} h aktiv (Kalender ${fmt(r.level10WallHours)} h), 100.000 Gesamtertrag nach ${fmt(r.coins100kHours)} h Kalenderzeit`);
  }
  for (const r of rows) if (r.violations) console.log(`Invariante verletzt in ${r.biome}: ${r.violations} Mal`);
  console.log('\nNicht simuliert: Händlerpreis (4.17), Perk-Punkte in 2 bis 4 Wochen, Offline-Obergrenze als Spürbarkeit.');
  if (failed > 0) {
    console.log(`\n${failed} Meilenstein(e) außerhalb des Korridors.`);
    process.exit(1);
  }
  console.log('\nAlle geprüften Meilensteine im Korridor.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
