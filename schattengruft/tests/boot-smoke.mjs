// Startet den echten Bootstrap (js/main.js) in einem DOM-Stub.
// Zweck: Erkennen, ob das Spiel nach dem Laden der Module überhaupt hochkommt –
// genau der Schritt, der am 2026-10-29 ausgefallen ist (TypeError in UIManager).
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
    this.textContent = '';
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
  appendChild(n) { this.children.push(n); if (n) { n.parentNode = this; if (n.id) byId.set(n.id, n); } return n; }
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
  documentElement: {getAttribute: () => '0.10.2', style: {setProperty() {}}},
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
globalThis.MutationObserver = class { constructor(f) { this.fn = f; } observe() { return this; } disconnect() {} takeRecords() { return []; } };
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

console.log(JSON.stringify({
  checks: 5,
  passed: 5,
  api: Object.keys(globalThis.window.__rpg),
  registeredIds: byId.size,
  dynamicallyBuilt: [...new Set(missingIds)].length,
  scope: 'Bootstrap von js/main.js im DOM-Stub; kein Canvas-, WebGL-, Firebase- oder Gerätetest.'
}));
