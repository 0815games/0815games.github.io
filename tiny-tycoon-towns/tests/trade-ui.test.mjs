import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tradeFormHtml, convoyListHtml, previewFor, fmtDuration } from '../src/trade-ui.js';

const here = dirname(fileURLToPath(import.meta.url));
const load = (f) => JSON.parse(readFileSync(join(here, '..', 'data', f), 'utf8'));
const data = {
  resources: load('resources.json'),
  biomes: load('biomes.json'),
  economy: { ...load('economy.json'), expressLevel: 0 },
  npcs: load('npcs.json'),
};
const NOW = Date.UTC(2026, 10, 24, 8, 0, 0);

test('the form lists all 8 partner towns, both directions and all resources', () => {
  const html = tradeFormHtml(data);
  for (const t of data.npcs.towns) assert.ok(html.includes(t.name), t.name);
  assert.equal((html.match(/name="direction"/g) ?? []).length, 2);
  for (const r of Object.keys(data.resources)) assert.ok(html.includes(`value="${r}"`), r);
  assert.ok(html.includes('min="10"') && html.includes('max="100"'));
});

test('the duration is shown in hours and minutes', () => {
  assert.equal(fmtDuration(150), '2 h 30 min');
  assert.equal(fmtDuration(420), '7 h 0 min');
});

test('the preview of an export shows the duration and expected payout', () => {
  const p = previewFor({
    partner: { id: 'eichenfeld', distance: 2 }, direction: 'export', resource: 'grain', qty: 20, data,
  });
  assert.equal(p.durationMin, 180);
  assert.ok(p.text.includes('🪙'));
});

test('the preview of an import shows the cost and arriving quantity', () => {
  const p = previewFor({
    partner: { id: 'wiesenau', distance: 10 }, direction: 'import', resource: 'honey', qty: 10, data,
  });
  assert.equal(p.durationMin, 420);
  assert.ok(p.text.includes('Kostet'));
  assert.ok(p.text.includes('etwa 9 Einheiten'));
});

test('an empty list says so', () => {
  assert.ok(convoyListHtml({ convoys: [] }, data, NOW).includes('Noch keine Konvois'));
});

test('each convoy state shows the right control', () => {
  const base = { partnerId: 'eichenfeld', direction: 'export', resource: 'grain', qty: 20, distance: 2 };
  const state = {
    convoys: [
      { ...base, id: 'a', status: 'travelling', departAt: NOW, arriveAt: NOW + 60 * 60000 },
      { ...base, id: 'b', status: 'arrived', departAt: NOW, arriveAt: NOW },
      { ...base, id: 'c', status: 'settled', departAt: NOW, arriveAt: NOW, payout: { coins: 70, crowns: 1, goods: 0, xp: 25 } },
    ],
  };
  const html = convoyListHtml(state, data, NOW);
  assert.ok(html.includes('unterwegs, noch 1 h 0 min'));
  assert.ok(html.includes('data-settle="b"'));
  assert.ok(html.includes('+70 🪙') && html.includes('+1 Kronen'));
});

test('convoy names are escaped', () => {
  const evil = { towns: [{ id: 'x', name: '<img src=x>', biome: 'coast', distance: 1, likes: 'salt' }] };
  const html = convoyListHtml({ convoys: [{ partnerId: 'x', direction: 'export', resource: 'grain', qty: 10, status: 'arrived', id: 'q' }] },
    { ...data, npcs: evil }, NOW);
  assert.ok(!html.includes('<img'));
});

test('the trade dialog shows the crown balance of the account', async () => {
  const { tradeFormHtml } = await import('../src/trade-ui.js');
  const html = tradeFormHtml(data, 7);
  assert.match(html, /Kronen auf dem Konto: <strong data-crowns>7<\/strong>/);
});
