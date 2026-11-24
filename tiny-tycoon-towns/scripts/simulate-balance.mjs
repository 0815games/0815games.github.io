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
import { createTown, advance, placeBuilding, upgradeBuilding, BIOMES } from '../src/domain/engine.js';
import { buildCost, productionMultiplier, storageCap } from '../src/domain/economy.js';
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

// Korridore aus GAME_PLAN 4.17 (kumuliert). Die Einheit steht bei jedem Meilenstein.
const CORRIDOR = {
  firstSaleAfterBuildMin: { max: 3, label: 'Erster automatischer Verkauf (min nach erstem Gebäude)' },
  fiveBuildingsActiveMin: { max: 15, label: '5 Gebäude (min aktive Spielzeit)' },
  level5Hours: { min: 4, max: 8, label: 'Stadtlevel 5 (Stunden Spielzeit)' },
  firstCharterHours: { min: 36, max: 72, label: 'Erster Freibrief (Stunden Spielzeit)' },
};

/** Bot: kauft pro Minute bis zu fünf Dinge, immer das mit der besten Amortisation. */
function botAct(state, ctx) {
  let s = state;
  for (let i = 0; i < 5; i++) {
    const best = bestAction(s, ctx);
    if (!best) break;
    const r = best.kind === 'build'
      ? placeBuilding(s, { x: best.x, y: best.y, buildingId: best.id }, ctx)
      : upgradeBuilding(s, { x: best.x, y: best.y }, ctx);
    if (r.error) break;
    s = r.state;
  }
  return s;
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
      const rate = def.baseRatePerMin * productionMultiplier(s, x, y, id, d);
      consider(rate / cost.coins, { kind: 'build', id, x, y });
    }
  }

  // Upgrades bestehender Produktion: Gewinn je Stufe / Kosten.
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    const b = s.tiles[keyOf(x, y)]?.building;
    if (!b || !d.buildings[b.id].resource) continue;
    const def = d.buildings[b.id];
    if (b.level >= def.maxLevel) continue;
    const cost = buildCost(b.id, b.level, d);
    if (s.coins < cost.coins || (s.stock[cost.material.resource] ?? 0) < cost.material.amount) continue;
    const gain = def.baseRatePerMin * productionMultiplier(s, x, y, b.id, d);
    consider(gain / cost.coins, { kind: 'upgrade', x, y });
  }

  // Lager, wenn die Vorräte fast die Kapazität erreichen.
  const cap = storageCap(s, d);
  const fullest = Math.max(0, ...Object.values(s.stock)) / cap;
  if (fullest > 0.9) {
    const wh = d.buildings.warehouse;
    const cost = buildCost('warehouse', 0, d);
    if (s.coins >= cost.coins && (s.stock[cost.material.resource] ?? 0) >= cost.material.amount) {
      for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
        if (!isUnlocked(x, y, level, d) || s.tiles[keyOf(x, y)]?.building) continue;
        consider(0.5, { kind: 'build', id: 'warehouse', x, y });
        return best;
      }
    }
    void wh;
  }
  return best;
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
    level8Wall: null,
    coins100kWall: null,
    violations: 0,
  };
  let activeMin = 0;

  const countBuildings = (s) => Object.values(s.tiles).filter((t) => t.building && t.building.id !== 'townHall').length;
  const checkMilestones = (s, wallMs, events) => {
    // Invarianten (GAME_PLAN 8.1, Property-Tests): nichts negativ, Lager nie über Kapazität.
    const cap = storageCap(s, data);
    if (s.coins < 0 || Object.values(s.stock).some((v) => v < 0 || v > cap)) m.violations++;
    if (m.firstBuildWall === null && countBuildings(s) > 0) m.firstBuildWall = wallMs;
    if (m.firstSaleWall === null && events.some((e) => e.type === 'sold') && m.firstBuildWall !== null) m.firstSaleWall = wallMs;
    if (m.fiveBuildingsActive === null && countBuildings(s) >= 5) m.fiveBuildingsActive = activeMin;
    if (m.level5Wall === null && s.townLevel >= 5) { m.level5Wall = wallMs; m.level5Active = activeMin; }
    if (m.level8Wall === null && s.townLevel >= 8) m.level8Wall = wallMs;
    if (m.coins100kWall === null && s.lifetimeCoins >= 100000) m.coins100kWall = wallMs;
    if (m.firstCharterWall === null && s.townLevel >= 8 && charterGain(s.lifetimeCoins) >= 1) m.firstCharterWall = wallMs;
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
    level5Hours: wallH(m.level5Wall),
    level5ActiveHours: m.level5Active === null ? null : m.level5Active / 60,
    firstCharterHours: wallH(m.firstCharterWall),
    level8Hours: wallH(m.level8Wall),
    coins100kHours: wallH(m.coins100kWall),
    firstBuildHours: wallH(m.firstBuildWall),
    capHours: data.economy.offline.baseCapHours,
    violations: m.violations,
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
    console.log(`  --   Diagnose: Stadtlevel 8 nach ${fmt(r.level8Hours)} h, 100.000 Gesamtertrag nach ${fmt(r.coins100kHours)} h`);
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
