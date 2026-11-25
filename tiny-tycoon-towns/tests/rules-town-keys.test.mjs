// Wächter: Jedes Feld, das die Engine in den Stadtstand schreibt, muss in firebase/database.rules.json
// erlaubt sein. Sonst lehnt die Datenbank das Speichern ab ($other: false). Das ist die Ursache von
// „Cloud Safe fehlgeschlagen“ gewesen (convoySeq, convoys fehlten).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTown, advance, settleConvoyAction } from '../src/domain/engine.js';
import { startConvoy } from '../src/domain/convoys.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const load = (f) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const rules = JSON.parse(readFileSync(join(root, 'firebase', 'database.rules.json'), 'utf8'));
const data = {
  resources: load('resources.json'), biomes: load('biomes.json'), buildings: load('buildings.json'),
  economy: { ...load('economy.json'), expressLevel: 0 }, merchant: load('merchant.json'),
};
const NOW = Date.UTC(2026, 10, 24, 8, 0, 0);

test('the town rule has $other: false, so every written field must be listed', () => {
  const townRule = rules.rules.saves.$uid.town;
  assert.equal(townRule['$other']['.validate'], false);
});

test('every field the engine writes into a town is allowed by the rules', () => {
  const townRule = rules.rules.saves.$uid.town;
  let t = createTown({ name: 'T', biome: 'riverlands', seed: 7, now: NOW, data });
  t = { ...t, coins: 10_000, stock: { ...t.stock, grain: 500 } };
  const started = startConvoy(t, { partner: { id: 'eichenfeld', distance: 2 }, direction: 'export', resource: 'grain', qty: 20 }, { data, nowMs: NOW });
  const convoy = started.state.convoys[0];
  const arrived = { ...started.state, convoys: [{ ...convoy, status: 'arrived' }] };
  const settled = settleConvoyAction(arrived, { id: convoy.id }, { data, nowMs: NOW }).state;
  const written = advance(settled, NOW + 1000, { data }).state;
  const missing = Object.keys(written).filter((k) => !(k in townRule));
  assert.deepEqual(missing, [], `Felder ohne Regel: ${missing.join(', ')}`);
});

test('convoy entries carry the fields the convoy rule needs', () => {
  const t = createTown({ name: 'T', biome: 'riverlands', seed: 7, now: NOW, data });
  const r = startConvoy({ ...t, coins: 10_000, stock: { ...t.stock, grain: 500 } }, { partner: { id: 'eichenfeld', distance: 2 }, direction: 'export', resource: 'grain', qty: 20 }, { data, nowMs: NOW });
  const c = r.state.convoys[0];
  for (const key of ['id', 'status', 'departAt', 'arriveAt']) assert.ok(key in c, `Konvoi ohne ${key}`);
});
