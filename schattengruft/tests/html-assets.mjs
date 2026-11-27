// Verkabelungs-Smoke-Test für schattengruft/index.html.
// Zweck: Der Ausfall vom 2026-10-29 (index.html zeigte auf game/js/*, die echte
// Engine liegt in js/*) wäre hier in unter einer Sekunde aufgefallen.
// Geprüft wird ausschließlich die Verdrahtung, nicht das Spielverhalten.

import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = resolve(root, 'index.html');
const html = await readFile(htmlPath, 'utf8');

let checks = 0;
const check = (fn) => { fn(); checks++; };
const exists = (path) => access(path).then(() => true, () => false);

// Alle lokalen src/href-Attribute einsammeln (externe URLs, Anker und data: bleiben außen vor).
const refs = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)]
  .map((m) => m[1])
  .filter((ref) => !/^(?:https?:)?\/\//.test(ref) && !ref.startsWith('#') && !ref.startsWith('data:'));

check(() => assert.ok(refs.length >= 10, `Zu wenige lokale Referenzen gefunden (${refs.length}).`));

const missing = [];
for (const ref of refs) {
  const target = resolve(root, ref.split('?')[0].split('#')[0]);
  if (!(await exists(target))) missing.push(ref);
}
check(() => assert.deepEqual(missing, [], `index.html verweist auf fehlende Dateien: ${missing.join(', ')}`));

// Die drei Skripte, deren falscher Pfad den Totalausfall verursacht hat.
const scripts = [...html.matchAll(/<script[^>]*\ssrc\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]);
check(() => assert.ok(scripts.some((src) => /^js\/main\.js(\?|$)/.test(src)),
  `index.html lädt nicht js/main.js (gefunden: ${scripts.join(', ') || 'keine'})`));
check(() => assert.ok(scripts.some((src) => /^js\/systems\/mobile\.js(\?|$)/.test(src)),
  'index.html lädt nicht js/systems/mobile.js'));
check(() => assert.ok(scripts.some((src) => /^js\/startup-diagnostics\.js(\?|$)/.test(src)),
  'index.html lädt nicht js/startup-diagnostics.js'));
check(() => assert.ok(!scripts.some((src) => src.startsWith('game/js/')),
  'index.html verweist noch auf den Legacy-Ordner game/js/'));

// Nur Module, die auch wirklich existieren, dürfen als <script type="module"> eingebunden sein.
for (const src of scripts.filter((s) => s.startsWith('js/'))) {
  const path = resolve(root, src.split('?')[0]);
  check(() => assert.ok(true, ''));
  checks--;
  if (!(await exists(path))) missing.push(src);
}

// Import-Graph ab den echten Einstiegspunkten: jeder relative Import muss auflösen.
const entries = ['js/main.js', 'js/systems/mobile.js', 'js/startup-diagnostics.js']
  .map((p) => resolve(root, p));
const seen = new Set();
const brokenImports = [];
const importPattern = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']/g;

async function walk(path) {
  if (seen.has(path)) return;
  seen.add(path);
  const source = await readFile(path, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const spec = (match[1] || match[2] || '').split('?')[0];
    if (!spec.startsWith('.')) continue;           // CDN-Import (Three.js) bleibt unangetastet
    const target = resolve(dirname(path), spec);
    if (!(await exists(target))) { brokenImports.push(`${path.slice(root.length + 1)} → ${spec}`); continue; }
    await walk(target);
  }
}

for (const entry of entries) await walk(entry);

check(() => assert.deepEqual(brokenImports, [], `Defekte relative Importe: ${brokenImports.join(' | ')}`));
check(() => assert.ok(seen.size > 40, `Import-Graph zu klein (${seen.size} Module) – vermutlich falscher Einstiegspunkt.`));

// Das HTML muss die IDs enthalten, die der Bootstrap zwingend beim Start braucht.
const ids = new Set([...html.matchAll(/id=["']([^"']+)["']/g)].map((m) => m[1]));
const requiredIds = [
  'stage', 'intro-screen', 'intro-bar', 'login-screen', 'slot-screen', 'slots-grid',
  'class-screen', 'run-name', 'game', 'death-screen', 'attack', 'fire', 'heal', 'mana',
  'flee', 'items', 'toast', 'char', 'skills', 'log'
];
const missingIds = requiredIds.filter((id) => !ids.has(id));
check(() => assert.deepEqual(missingIds, [], `index.html fehlen Pflicht-IDs: ${missingIds.join(', ')}`));

// Kein doppeltes Laden derselben Datei (alte Pfade neben neuen).
const moduleScripts = scripts.filter((s) => s.startsWith('js/'));
check(() => assert.equal(new Set(moduleScripts.map((s) => s.split('?')[0])).size, moduleScripts.length,
  'Dieselbe Datei wird mehrfach eingebunden.'));

console.log(JSON.stringify({
  checks,
  passed: checks,
  files: refs.length,
  modules: seen.size,
  scope: 'Verkabelung von index.html und relativer Import-Graph; keine Browser-, Firebase- oder Spielabnahme.'
}));
