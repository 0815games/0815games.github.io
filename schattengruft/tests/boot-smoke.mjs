// Startet den echten Bootstrap (js/main.js) in einem DOM-Stub.
// Zweck: Erkennen, ob das Spiel nach dem Laden der Module überhaupt hochkommt –
// genau der Schritt, der am 2026-10-29 ausgefallen ist (TypeError in UIManager).
//
// Zusatz (2026-11-27): Das Spiel hing am Handy beim Laden, sichtbar blieb nur
// das Intro mit „v0.10.2“. Ursache war eine Endlosschleife über Mikrotasks:
// die 3D-Darstellung schrieb am eigenen Schalter und weckte darüber ihren
// eigenen MutationObserver. Der Test prüft deshalb zusätzlich, dass ein Start
// mit gespeicherter 3D-Vorliebe zur Ruhe kommt.
//
// Grenze: kein Canvas-/WebGL-/Firebase-Test, nur Bootstrap und API-Bereitstellung.

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(resolve(root, 'index.html'), 'utf8');

/* ---------- DOM-Stub (bewusst klein, aber mit ID-Registrierung) ---------- */

const byId = new Map();
const listeners = {};
const missingIds = [];

// Zaehlt DOM-Schreibvorgaenge, damit die Selbstausloesung messbar wird.
const mutationState = {pending: 0, takeRecords: 0, observers: []};
function noteMutation(){ mutationState.pending++; }

class ClassList {
  constructor(el) { this.el = el; this.set = new Set(); }
  add(...c) { c.forEach((x) => this.set.add(x)); }
  remove(...c) { c.forEach((x) => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toggle(c, on) { const n = on ?? !this.set.has(c); n ? this.set.add(c) : this.set.delete(c); return n; }
}

class El {
  constructor(tag = 'div', id = '') {
    this.tagName = String(tag).toUpperCase();
    this.id = id;
    this.children = [];
    this.parentNode = null;
    this.style = {setProperty() {}};
    this.dataset = {};
    this.attrs = {};
    this._text = '';
    this._html = '';
    this.value = '';
    this.disabled = false;
    this.hidden = false;
    this.open = false;
    this.width = 640;
    this.height = 480;
    this.classList = new ClassList(this);
    this.className = '';
    if (id) byId.set(id, this);
  }
  get textContent() { return this._text; }
  // Wie im Browser: Zuweisung ersetzt den Knoten -> immer eine Mutation.
  set textContent(value) {
    this._text = String(value);
    noteMutation();
  }

  set className(v) {
    this._class = String(v);
    this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean));
  }
  get className() { return this._class || ''; }
  set innerHTML(v) {
    this._html = String(v);
    this.children = [];
    for (const m of this._html.matchAll(/id="([^"]+)"/g)) {
      const child = new El('div', m[1]);
      child.parentNode = this;
      this.children.push(child);
    }
    for (let i = 0; i < (this._html.match(/<button/gi) || []).length; i++) {
      const b = new El('button');
      b.parentNode = this;
      this.children.push(b);
    }
  }
  get innerHTML() { return this._html; }
  addEventListener() {}
  removeEventListener() {}
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') { this.id = String(v); byId.set(this.id, this); } }
  getAttribute(k) { return this.attrs[k] ?? null; }
  removeAttribute(k) { delete this.attrs[k]; }
  appendChild(n) {
    this.children.push(n);
    if (n) { n.parentNode = this; if (n.id) byId.set(n.id, n); }
    noteMutation();
    return n;
  }
  append(...n) { n.forEach((x) => this.appendChild(x)); }
  prepend(...n) { this.children.unshift(...n); }
  insertBefore(n) { this.children.push(n); return n; }
  replaceChildren(...n) { this.children = [...n]; }
  after() {} before() {} remove() {}
  focus() {} blur() {} click() {} scrollIntoView() {} setPointerCapture() {}
  getClientRects() { return this.classList.contains('hidden') ? [] : [{}]; }
  matches(sel) {
    if (sel === 'button') return this.tagName === 'BUTTON';
    if (/^[a-z]+$/i.test(sel)) return this.tagName === sel.toUpperCase();
    return false;
  }
  closest(sel) {
    const key = sel.replace(/^\./, '').split(',')[0].trim();
    return this.classList.contains(key) ? this : null;
  }
  contains(n) { return n === this || this.children.some((c) => c.contains?.(n)); }
  querySelector(sel) {
    const hit = this.querySelectorAll(sel)[0];
    if (hit) return hit;
    const first = String(sel).trim().split(/\s+/)[0];
    if (first.startsWith('#')) return byId.get(first.slice(1)) ?? null;
    return new El('div');
  }
  querySelectorAll(sel) {
    if (sel.startsWith('button')) return this.children.filter((c) => c.tagName === 'BUTTON');
    if (sel.startsWith('#')) { const n = byId.get(sel.slice(1)); return n ? [n] : []; }
    return [];
  }
  getContext() { return new Proxy({}, {get: () => () => {}}); }
  getBoundingClientRect() { return {left: 0, top: 0, right: 640, bottom: 480, width: 640, height: 480}; }
}

for (const m of html.matchAll(/id="([^"]+)"/g)) new El('div', m[1]);
const body = new El('body', 'body');
const head = new El('head', 'head');

/* ---------- Globals ---------- */

globalThis.window = {
  addEventListener: (t, f) => {(listeners[t] ??= []).push(f);},
  removeEventListener() {},
  innerWidth: 1280, innerHeight: 800,
  firebase: undefined, AudioContext: undefined, webkitAudioContext: undefined,
  matchMedia: () => ({matches: false, addEventListener() {}}),
  location: {search: '', href: 'https://example.test/schattengruft/'}
};
globalThis.document = {
  readyState: 'complete', hidden: false, title: '', body, head,
  documentElement: {getAttribute: () => '0.10.3', style: {setProperty() {}}},
  getElementById: (id) => { if (!byId.has(id)) { missingIds.push(id); return null; } return byId.get(id); },
  createElement: (t) => new El(t),
  createTextNode: () => ({}),
  querySelector: (sel) => {
    const first = String(sel).trim().split(/\s+/)[0];
    if (first.startsWith('#')) return byId.get(first.slice(1)) ?? new El('div');
    return new El('div');
  },
  querySelectorAll: (sel) => sel.startsWith('#') ? (byId.has(sel.slice(1)) ? [byId.get(sel.slice(1))] : []) : [],
  addEventListener: (t, f) => {(listeners[t] ??= []).push(f);},
  execCommand() {}
};
globalThis.addEventListener = (t, f) => {(listeners[t] ??= []).push(f);};
globalThis.removeEventListener = () => {};
globalThis.localStorage = {getItem: () => null, setItem() {}, removeItem() {}};
// Browser-treu: nimmt Datensaetze an, takeRecords() liefert und leert sie.
globalThis.MutationObserver = class {
  constructor(fn) { this.fn = fn; this.active = false; mutationState.observers.push(this); }
  observe() { this.active = true; return this; }
  disconnect() { this.active = false; }
  takeRecords() {
    mutationState.takeRecords++;
    const out = mutationState.pending;
    mutationState.pending = 0;
    return new Array(out).fill({});
  }
};
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.matchMedia = () => ({matches: false, addEventListener() {}, addListener() {}});
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.setInterval = () => 0;
globalThis.setTimeout = () => 0;
globalThis.clearInterval = () => {};
globalThis.clearTimeout = () => {};
globalThis.getComputedStyle = () => ({position: 'relative', getPropertyValue: () => ''});
globalThis.location = {search: '', href: 'https://example.test/schattengruft/', reload() {}};
globalThis.innerWidth = 1280;
globalThis.innerHeight = 800;
globalThis.devicePixelRatio = 1;
Object.defineProperty(globalThis, 'navigator', {value: {onLine: true, userAgent: 'node-stub'}, configurable: true});
Object.defineProperty(globalThis, 'crypto', {value: {randomUUID: () => 'stub-uuid', getRandomValues: (a) => a}, configurable: true});

/* ---------- Prüfung ---------- */

// Einstiegspunkt aus index.html lesen: Der Test soll genau das starten, was
// der Browser starten würde, nicht pauschal js/main.js.
const moduleEntry = [...html.matchAll(/<script[^>]*type=["']module["'][^>]*\ssrc=["']([^"']+)["']/g)]
  .map((m) => m[1].split('?')[0])
  .find((src) => !/mobile(\.min)?\.js$/.test(src));

assert.ok(moduleEntry, 'index.html lädt kein Modul als Spiel-Einstiegspunkt.');
assert.equal(moduleEntry, 'js/main.js',
  `index.html lädt als Einstieg "${moduleEntry}" statt "js/main.js" – das ist der v0.0.5-Prototyp und kann diese Seite nicht bedienen.`);

let error = null;
try {
  await import(new URL(`../${moduleEntry}`, import.meta.url).href);
  for (const fn of listeners.DOMContentLoaded || []) await fn();
} catch (e) {
  error = e;
}

assert.equal(error, null, `js/main.js bricht beim Start ab: ${error?.name}: ${error?.message}`);
assert.ok(globalThis.window.__rpg, 'window.__rpg wurde nicht gesetzt – Spiel-API fehlt.');
for (const fn of ['move', 'interact']) {
  assert.equal(typeof globalThis.window.__rpg[fn], 'function', `window.__rpg.${fn} fehlt.`);
}

// Von den per getElementById angefragten IDs darf nur erwartbar Dynamisches fehlen.
const dynamic = new Set([
  'music-volume', 'sfx-volume', 'music-volume-value', 'sfx-volume-value',
  'fantasy-modal', 'fantasy-modal-icon', 'fantasy-modal-title', 'fantasy-modal-msg',
  'fantasy-modal-error', 'fantasy-modal-actions',
  'preparation-shop-layout-v0510', 'discard-confirm', 'ability-bar', 'levelup-choice-style'
]);
const unexpected = [...new Set(missingIds)].filter((id) => !dynamic.has(id));
assert.deepEqual(unexpected, [], `index.html fehlen IDs, die der Bootstrap sofort braucht: ${unexpected.join(', ')}`);

/* ---------- Zusatz: Start mit gespeichertem 3D (Haenger vom 27.11.) ---------- */

// main.js laedt das 3D-Modul dynamisch nach dem Setzen von window.__rpg.
// Ohne echtes Warten waere der Test hier blind – deshalb Mikrotasks abarbeiten.
const tick = () => new Promise((resolve) => setImmediate(resolve));
for (let i = 0; i < 8; i++) await tick();

// Die 3D-Vorliebe lag beim Nutzer im Speicher. Der Stub oben liefert immer
// null; hier wird der Merker gesetzt und das Modul frisch geladen.
globalThis.localStorage = {
  getItem: (key) => (key === 'schattengruft-3d' ? 'on' : null),
  setItem() {}, removeItem() {}
};

const mode = await import(
  new URL('../js/systems/world3d-mode.js', import.meta.url).href
);
mode.reset3DModeForTests();

// Ohne WebGL/CDN bleibt 3D zwar aus, aber der Schalter wird trotzdem
// dargestellt. Genau dabei lief die Schleife: paint() schreibt am Schalter,
// der Beobachter sieht es und ruft paint() erneut.
const fakeRenderer = {
  active: false,
  error: false,
  canvas: null,
  subscribe() { return () => {}; },
  setEnabled() {},
  canvasMoved() {},
  render() { return false; }
};
globalThis.window.__rpg = Object.assign(globalThis.window.__rpg ?? {}, {
  renderer: Object.assign(globalThis.window.__rpg?.renderer ?? {}, {
    world3d: fakeRenderer
  })
});

mode.install3DMode({ inCombat: false });

// Was der Browser nach einer Mutation tut: Datensaetze zustellen, Callbacks
// laufen lassen, Mikrotasks abarbeiten. Eine Selbstausloesung endet nie.
let rounds = 0;
const LIMIT = 300;
while (rounds < LIMIT) {
  const anstehend = mutationState.pending;
  mutationState.pending = 0;
  if (!anstehend) break;
  rounds++;

  // Der Browser uebergibt die Datensaetze an jeden aktiven Beobachter.
  for (const observer of mutationState.observers) {
    if (!observer.active) continue;
    observer.fn([]);
  }
  await tick();
}

assert.ok(
  rounds < LIMIT,
  `Start mit 3D laeuft aus (${rounds} Runden ohne Ruhe) – ` +
  'die 3D-Darstellung weckt sich vermutlich selbst'
);
assert.ok(
  mutationState.takeRecords > 0,
  'eigene Schreibvorgaenge werden verworfen statt erneut auszuloesen'
);
assert.ok(rounds <= 4, `Start wird zuegig ruhig (${rounds} Runden)`);

console.log(JSON.stringify({
  checks: 6,
  passed: 6,
  api: Object.keys(globalThis.window.__rpg),
  registeredIds: byId.size,
  dynamicallyBuilt: [...new Set(missingIds)].length,
  threeDRounds: rounds,
  scope: 'Bootstrap von js/main.js im DOM-Stub, auch mit gespeicherter 3D-Vorliebe; kein Canvas-, WebGL-, Firebase- oder Gerätetest.'
}));
