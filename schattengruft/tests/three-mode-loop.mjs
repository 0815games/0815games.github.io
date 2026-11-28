// Regressionstest: Die 3D-Darstellung darf sich nicht selbst aufwecken.
//
// Fehlerbild am Handy (2026-11-27): Das Spiel hing beim Laden, Version 0.10.2
// blieb stehen. Ursache: `paint()` schreibt `textContent` am Schalter, was im
// Browser IMMER eine childList-Mutation auslöst – auch wenn der Text gleich
// bleibt. Der MutationObserver sah diese eigene Mutation und rief `paint()`
// erneut auf. Ergebnis: eine Endlosschleife über Mikrotasks.
//
// Dieser Test bildet das Browser-Verhalten echt nach:
//   - jede Zuweisung an `textContent` erzeugt einen Datensatz, auch bei
//     identischem Wert (Knoten werden ersetzt)
//   - Datensätze werden gesammelt und im Observer-Callback übergeben
//   - `takeRecords()` verwirft anstehende Datensätze
//
// Er schlägt fehl, wenn die Selbstauslösung zurückkommt.

import assert from 'node:assert/strict';

/* ---------- DOM mit echter Mutationszählung ---------- */

const byId = new Map();
const observers = [];
let records = 0;

class El {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.children = [];
    this.parentElement = null;
    this.attrs = {};
    this.style = {};
    this.dataset = {};
    this._text = '';
    this._disabled = false;
    this._open = false;
    this._classes = new Set();
    this._events = {};
    this.classList = {
      add: (...names) => names.forEach((n) => this._classes.add(n)),
      remove: (...names) => names.forEach((n) => this._classes.delete(n)),
      contains: (name) => this._classes.has(name),
      toggle: (name, on) => {
        const next = on === undefined ? !this._classes.has(name) : !!on;
        if (next) this._classes.add(name); else this._classes.delete(name);
        return next;
      }
    };
    if (id) byId.set(id, this);
  }

  get open() { return this._open; }
  set open(value) { this._open = !!value; }

  get textContent() { return this._text; }
  // Wie im Browser: Zuweisung ersetzt den Knoten -> immer ein Datensatz.
  set textContent(value) {
    this._text = String(value);
    records++;
  }

  get title() { return this.attrs.title ?? ''; }
  set title(value) {
    if (this.attrs.title !== String(value)) {
      this.attrs.title = String(value);
      records++;
    }
  }

  get disabled() { return this._disabled; }
  set disabled(value) { this._disabled = !!value; }

  showModal() { this._open = true; }
  close() { this._open = false; }

  setAttribute(name, value) {
    if (this.attrs[name] !== String(value)) {
      this.attrs[name] = String(value);
      records++;
    }
  }
  getAttribute(name) { return this.attrs[name] ?? null; }

  append(...nodes) {
    let changed = false;
    for (const node of nodes) {
      if (!node) continue;
      node.parentElement = this;
      this.children.push(node);
      changed = true;
    }
    if (changed) records++;
  }
  appendChild(node) { this.append(node); return node; }

  addEventListener(type, fn) { (this._events[type] ??= []).push(fn); }
  removeEventListener(type, fn) {
    this._events[type] = (this._events[type] ?? []).filter((x) => x !== fn);
  }
  fire(type, extra = {}) {
    for (const fn of this._events[type] ?? []) {
      fn({ ...extra, preventDefault() {}, stopPropagation() {} });
    }
  }
  click() { this.fire('click'); }

  getClientRects() { return [{}]; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 400 }; }
}

for (const id of [
  'game', 'mapbox', 'combat', 'combat-stage', 'death-screen', 'btn-3d', 'stage'
]) new El('div', id);

byId.get('game').classList.remove('hidden');
byId.get('death-screen').classList.add('hidden');
byId.get('combat').classList.add('hidden');
byId.get('btn-3d').disabled = false;

globalThis.document = {
  readyState: 'complete',
  hidden: false,
  body: new El('body'),
  head: new El('head'),
  getElementById: (id) => byId.get(id) ?? null,
  createElement: (tag) => new El(tag),
  addEventListener() {}
};

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value))
};

globalThis.setTimeout = () => 1;
globalThis.requestAnimationFrame = () => 1;

/* ---------- Browser-treuer MutationObserver ---------- */

let pending = 0;          // angesammelte Datensätze
let takeRecordsCalls = 0;

globalThis.MutationObserver = class {
  constructor(fn) { this.fn = fn; this.active = false; observers.push(this); }
  observe() { this.active = true; }
  disconnect() { this.active = false; }
  // Liefert die anstehenden Datensätze und leert den Puffer – wie im Browser.
  takeRecords() {
    takeRecordsCalls++;
    const out = pending;
    pending = 0;
    return new Array(out).fill({});
  }
};

const tick = () => new Promise((resolve) => setImmediate(resolve));

// Ein Durchlauf entspricht dem, was der Browser nach einer Änderung tut:
// Datensätze an alle aktiven Beobachter liefern, Callbacks laufen lassen,
// Mikrotasks abarbeiten. Gibt die Zahl der Runden zurück, bis Ruhe herrscht.
async function settle(limit = 200) {
  let rounds = 0;
  while (records > 0 || pending > 0) {
    if (rounds >= limit) return { rounds, stable: false };

    pending += records;
    records = 0;
    rounds++;

    for (const observer of observers) {
      if (!observer.active) continue;
      const has = pending > 0;
      if (has) {
        // Der Browser übergibt die Datensätze und leert den Puffer.
        const delivered = pending;
        pending = 0;
        observer.delivered = delivered;
        observer.fn([]);
      }
    }

    await tick();
  }
  return { rounds, stable: true };
}

/* ---------- Scheinrenderer ---------- */

const fake = {
  _active: false,
  error: false,
  canvas: new El('canvas'),
  _subscribers: new Set(),
  subscribe(fn) { this._subscribers.add(fn); return () => this._subscribers.delete(fn); },
  setEnabled(next) {
    this._active = next;
    for (const fn of this._subscribers) fn(this);
  },
  get active() { return this._active; },
  canvasMoved() {},
  render() { return this._active; }
};

globalThis.window = {
  __rpg: { renderer: { world3d: fake } },
  addEventListener() {},
  removeEventListener() {}
};

/* ---------- Test ---------- */

const { install3DMode, reset3DModeForTests } = await import(
  new URL('../js/systems/world3d-mode.js', import.meta.url)
);

reset3DModeForTests();
install3DMode({ inCombat: false, world: { tiles: [{}], theme: 'katakomben' } });

// 1. Ruhezustand nach der Installation
const start = await settle();
assert.ok(start.stable, `Installation läuft nicht aus (${start.rounds} Runden)`);

// 2. 3D einschalten – hier schreibt paint() mehrere Eigenschaften
byId.get('btn-3d').click();
const afterToggle = await settle();
assert.ok(
  afterToggle.stable,
  `Einschalten läuft nicht aus (${afterToggle.rounds} Runden) – ` +
  'paint() weckt vermutlich den eigenen Beobachter'
);

// 3. Kampf beginnt: Klasse ändert sich, die Leinwand wird umgehängt
const state = { inCombat: true, world: { tiles: [{}], theme: 'katakomben' } };
reset3DModeForTests();
install3DMode(state);
// 3D ist bereits eingeschaltet (der Renderer behält seinen Zustand). Kein
// zweiter Klick – der würde ausschalten.
await settle();

byId.get('combat').classList.remove('hidden');
const afterCombat = await settle();
assert.ok(
  afterCombat.stable,
  `Kampfstart läuft nicht aus (${afterCombat.rounds} Runden)`
);

// 4. Der Beobachter hat die eigenen Datensätze wirklich verworfen
assert.ok(
  takeRecordsCalls > 0,
  'eigene Mutationen werden über takeRecords() verworfen'
);

// 5. Ein Kampfwechsel ohne eigene Mutation: Layout einmal direkt anstoßen,
//    wie es der Beobachter täte. Danach muss die Leinwand auf der Bühne liegen.
const api = install3DMode(state);
api.syncLayout();
await tick();

const button = byId.get('btn-3d');
assert.equal(button.getAttribute('aria-pressed'), 'true', '3D ist eingeschaltet');
assert.equal(button.textContent, '3D ein', 'Beschriftung stimmt');
assert.equal(
  fake.canvas.parentElement.id, 'combat-stage',
  'Leinwand liegt im Kampf auf der Bühne'
);

// 6. Ausschalten und zurück in die Karte
button.click();
await settle();
assert.equal(fake.active, false, '3D ausgeschaltet');
assert.equal(button.textContent, '3D aus');

console.log(
  'BESTANDEN: Keine Selbstauslösung – paint() weckt den eigenen Beobachter ' +
  'nicht mehr. Geprüft in Ruhe, beim Einschalten und beim Kampfstart. ' +
  'Kein WebGL-/Browser-/Gerätetest.'
);
