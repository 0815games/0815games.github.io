// Prüft, dass Held- und Gegnernamen niemals als Markup interpretiert werden.
// Hintergrund: Namen kommen aus einer Eingabe und werden über Firebase
// gespeichert. Mehrere Stellen setzen sie in HTML-Vorlagen ein; ohne Escaping
// könnte ein manipulierter Spielstand Markup einschleusen.

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {escapeHtml} from '../js/core/escape.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0;
const check = (fn) => { fn(); checks++; };

/* ---------- 1. Der Escaper selbst ---------- */

check(() => assert.equal(escapeHtml('<script>alert(1)</script>'),
  '&lt;script&gt;alert(1)&lt;/script&gt;'));
check(() => assert.equal(escapeHtml(`"'&`), '&quot;&#39;&amp;'));
check(() => assert.equal(escapeHtml('Schattenjäger'), 'Schattenjäger'));
check(() => assert.equal(escapeHtml(undefined), ''));
check(() => assert.equal(escapeHtml(null), ''));
check(() => assert.equal(escapeHtml(42), '42'));
check(() => assert.equal(escapeHtml('ä ö ü ß — ⚔️'), 'ä ö ü ß — ⚔️',
  'Umlaute und Emoji dürfen nicht verändert werden.'));
check(() => assert.equal(escapeHtml('<img src=x onerror=alert(1)>'),
  '&lt;img src=x onerror=alert(1)&gt;'));

/* ---------- 2. Die Ausgabestellen im Spielcode ---------- */

const main = await readFile(resolve(root, 'js/main.js'), 'utf8');
const mobileUi = await readFile(resolve(root, 'js/systems/mobile-ui.js'), 'utf8');

check(() => assert.ok(main.includes("import { escapeHtml } from './core/escape.js';"),
  'main.js importiert den zentralen Escaper nicht.'));
check(() => assert.ok(main.includes('${escapeHtml(p.name)}'),
  'Der Heldname wird in main.js nicht escaped.'));
check(() => assert.ok(main.includes('${escapeHtml(m.name)}'),
  'Der Gegnername wird im Kampfpanel nicht escaped.'));
// In HTML-Vorlagen (innerHTML) darf kein roher Name stehen. In Log-Texten oder
// confirm()-Meldungen ist das unkritisch und bleibt erlaubt.
const htmlAssignments = [...main.matchAll(/innerHTML\s*=\s*(`[^`]*`)/g)].map((m) => m[1]);
check(() => assert.ok(htmlAssignments.length >= 5,
  `Zu wenige innerHTML-Vorlagen gefunden (${htmlAssignments.length}).`));
for (const [index, template] of htmlAssignments.entries()) {
  for (const token of ['${p.name}', '${m.name}', '${c}']) {
    check(() => assert.ok(!template.includes(token),
      `innerHTML-Vorlage #${index + 1} enthält rohes ${token}.`));
  }
}

// mobile-ui.js hatte einen wirkungslosen Escaper (ersetzte "<" durch "<").
const escLine = mobileUi.split('\n').find((line) => line.includes('const esc=')) || '';
check(() => assert.ok(escLine.includes('&amp;') && escLine.includes('&lt;') && escLine.includes('&gt;'),
  `Der Escaper in mobile-ui.js ist wirkungslos: ${escLine.trim()}`));
check(() => assert.ok(escLine.includes('&quot;'), 'Der Escaper in mobile-ui.js maskiert keine Doppel-Anführungszeichen.'));

/* ---------- 3. Wirklichkeitstest: der Name landet escaped im DOM ---------- */

const nasty = '<img src=x onerror=alert(1)>';
const rendered = `<div class="slot-hero-name">${escapeHtml(nasty)}</div>`;
check(() => assert.ok(!rendered.includes('<img'), 'Escapter Name erzeugt weiterhin ein <img>-Tag.'));
check(() => assert.ok(rendered.includes('&lt;img'), 'Escapter Name enthält kein escaptes <img>.'));

console.log(JSON.stringify({
  checks,
  passed: checks,
  scope: 'Escaper-Logik und Quelltextstellen; kein DOM-, Browser- oder Firebase-Test.'
}));
