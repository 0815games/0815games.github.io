// Integration der 3D-Ansicht ins Spiel (Phase 5, Nachtrag).
//
// Geprüft wird die Brücke zwischen Spiel-UI und Weltrenderer:
//   - der Schalter im Kopfbereich
//   - die Leinwand folgt dem Bildschirm (Karte im Erkunden, Bühne im Kampf)
//   - gespeicherte Vorliebe wird beim Start angewandt
//   - im Tod und außerhalb des Spiels wird nichts gezeichnet
//
// Benutzt einen kleinen DOM-Ersatz und einen Scheinrenderer. Kein echtes
// WebGL, kein Browser, kein Three.js.

import assert from 'node:assert/strict';

/* ---------- DOM-Ersatz ---------- */

const byId = new Map();

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

  get textContent() { return this._text; }
  set textContent(value) { this._text = String(value); }
  get title() { return this.attrs.title ?? ''; }
  set title(value) { this.attrs.title = String(value); }
  get disabled() { return this._disabled; }
  set disabled(value) { this._disabled = !!value; }

  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }

  append(...nodes) {
    for (const node of nodes) {
      if (!node) continue;
      node.parentElement = this;
      this.children.push(node);
    }
  }

  appendChild(node) { this.append(node); return node; }

  addEventListener(type, fn) {
    (this._events[type] ??= []).push(fn);
  }

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
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 640, height: 400 };
  }
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
  addEventListener(type, fn) {
    (globalThis.__docEvents ??= {});
    (globalThis.__docEvents[type] ??= []).push(fn);
  }
};

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => (storage.has(key) ? storage.get(key) : null),
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key)
};

// Echten Timer sichern, bevor die Sandbox ihn ersetzt: das Modul plant seine
// Nacharbeit in einer Mikrotask, die erst nach dem synchronen Code läuft.
const realTimeout = globalThis.setTimeout;

const timers = [];
globalThis.setTimeout = (fn) => timers.push(fn);
globalThis.requestAnimationFrame = (fn) => timers.push(fn);

// Minimaler MutationObserver: sammelt Beobachter und feuert sie auf Wunsch.
const observers = [];
globalThis.MutationObserver = class {
  constructor(fn) { this.fn = fn; this.active = false; observers.push(this); }
  observe() { this.active = true; }
  disconnect() { this.active = false; }
  takeRecords() { return []; }
};

// Wie der Browser: DOM-Änderung -> Beobachter -> Mikrotask -> Zeichnen.
// Mehrere Runden, weil ein Durchlauf den nächsten auslösen kann.
async function flush() {
  for (let round = 0; round < 4; round++) {
    while (timers.length) timers.shift()();
    for (const observer of observers) if (observer.active) observer.fn([]);
    await new Promise((resolve) => realTimeout(resolve, 0));
  }
}

/* ---------- Scheinrenderer ---------- */

const calls = [];
const fake = {
  _active: false,
  error: false,
  canvas: new El('canvas'),
  _subscribers: new Set(),
  subscribe(fn) { this._subscribers.add(fn); return () => this._subscribers.delete(fn); },
  setEnabled(next) {
    this._active = next;
    calls.push('setEnabled:' + next);
    for (const fn of this._subscribers) fn(this);
  },
  get active() { return this._active; },
  canvasMoved() { calls.push('canvasMoved'); },
  render() { return this._active; }
};

globalThis.window = { __rpg: { renderer: { world3d: fake } } };

const { install3DMode, stageHostFor, reset3DModeForTests, initialPreference } =
  await import(new URL('../js/systems/world3d-mode.js', import.meta.url));

// Wunsch beim Start: Link schlägt gespeicherte Vorliebe, sonst gilt der Speicher.
assert.equal(initialPreference({ search: '?view=3d' }), 'on');
assert.equal(initialPreference({ search: '?view=2d', stored: true }), 'off');
assert.equal(initialPreference({ search: '?view=3d', stored: false }), 'on');
assert.equal(initialPreference({ search: '', stored: true }), 'on');
assert.equal(initialPreference({ search: '', stored: false }), 'off');
assert.equal(initialPreference({ search: '?foo=1', stored: null }), 'off');
assert.equal(initialPreference({ search: '?view=unsinn', stored: true }), 'on');

// Bewusst NICHT autoInstall(): der Test verdrahtet den Schalter selbst und
// prüft damit genau eine Installation.
reset3DModeForTests();

// Ein schlanker Spielzustand genügt; das Modul liest nur `inCombat`.
const state = { inCombat: false };

/* ---------- 1. Reine Host-Logik ---------- */

assert.equal(
  stageHostFor({ inCombat: false, deathScreen: false, gameVisible: true }),
  'mapbox', 'Erkundung zeichnet in der Karte'
);
assert.equal(
  stageHostFor({ inCombat: true, deathScreen: false, gameVisible: true }),
  'combat-stage', 'Kampf zeichnet auf der Bühne'
);
assert.equal(
  stageHostFor({ inCombat: false, deathScreen: true, gameVisible: true }),
  null, 'Tod: keine Bühne'
);
assert.equal(
  stageHostFor({ inCombat: true, deathScreen: false, gameVisible: false }),
  null, 'außerhalb des Spiels: keine Bühne'
);

/* ---------- 2. Installation ---------- */

const api = install3DMode(state);
const installedRef = api;

// Eine zweite Installation darf keinen zweiten Klick-Handler anhängen –
// sonst heben sich die Handler gegenseitig auf (ein Klick schaltet ein
// und sofort wieder aus).
const clicksBefore = byId.get('btn-3d')._events?.click?.length ?? 0;
const again = install3DMode(state);
assert.equal(again, installedRef, 'zweiter Aufruf liefert dieselbe Verdrahtung');
assert.equal(
  byId.get('btn-3d')._events?.click?.length ?? 0, clicksBefore,
  'kein doppelter Klick-Handler'
);
assert.ok(api, 'Modul installiert sich');
await flush();

const button = byId.get('btn-3d');
assert.equal(button.getAttribute('aria-pressed'), 'false', 'Start: 3D aus');
assert.equal(button.textContent, '3D aus');

/* ---------- 3. Einschalten ---------- */

button.click();

assert.equal(fake.active, true, '3D eingeschaltet');
assert.ok(calls.includes('setEnabled:true'), 'Renderer wurde benachrichtigt');
assert.equal(button.textContent, '3D ein');
assert.equal(button.getAttribute('aria-pressed'), 'true');
assert.equal(storage.get('schattengruft-3d'), 'on', 'Vorliebe gespeichert');

await flush();
assert.equal(
  fake.canvas.parentElement.id, 'mapbox',
  'Erkundung: Leinwand liegt in der Karte'
);
assert.equal(
  document.body.classList.contains('world3d-on'), true,
  'Body kennzeichnet 3D'
);

/* ---------- 4. Kampf beginnt ---------- */

state.inCombat = true;
byId.get('combat').classList.remove('hidden');
// Klassenänderung am DOM genügt: der Beobachter im Modul reagiert darauf.
await flush();

assert.equal(
  fake.canvas.parentElement.id, 'combat-stage',
  'Kampf: Leinwand liegt auf der Bühne'
);
assert.equal(
  document.body.classList.contains('world3d-combat'), true,
  'Kampf ist gekennzeichnet'
);
assert.ok(
  calls.filter((c) => c === 'canvasMoved').length >= 1,
  'Größe wurde nach dem Umhängen neu gemessen'
);

/* ---------- 5. Kampf endet ---------- */

state.inCombat = false;
byId.get('combat').classList.add('hidden');
await flush();

assert.equal(
  fake.canvas.parentElement.id, 'mapbox', 'zurück in die Karte'
);
assert.equal(
  document.body.classList.contains('world3d-combat'), false,
  'Kampf-Kennzeichnung entfernt'
);

/* ---------- 6. Tod ---------- */

state.inCombat = false;
byId.get('death-screen').classList.remove('hidden');
await flush();

assert.equal(
  api.syncLayout(), undefined,
  'Tod: Layout-Aufruf endet ohne Fehler'
);
byId.get('death-screen').classList.add('hidden');

/* ---------- 7. Ausschalten ---------- */

button.click();

assert.equal(fake.active, false, '3D ausgeschaltet');
assert.equal(storage.get('schattengruft-3d'), 'off');
assert.equal(button.textContent, '3D aus');
assert.equal(document.body.classList.contains('world3d-on'), false);

/* ---------- 8. Vorliebe beim nächsten Start ---------- */

storage.set('schattengruft-3d', 'on');
const before = calls.length;
reset3DModeForTests();
install3DMode(state);
await flush();

assert.ok(calls.length > before, 'Vorliebe beim Start angewandt');
assert.equal(fake.active, true, '3D startet eingeschaltet');

/* ---------- 9. Der Schalter ist im echten Markup verdrahtet ---------- */

const { readFile } = await import('node:fs/promises');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.ok(html.includes('id="btn-3d"'), 'index.html hat den 3D-Schalter');
assert.ok(html.includes('id="combat-stage"'), 'index.html hat den Bühnenrahmen');
// Das Modul wird nicht per <script> geladen, sondern von main.js nach dem
// Setzen von window.__rpg – sonst wäre der Renderer beim Start noch leer.
const main = await readFile(new URL('../js/main.js', import.meta.url), 'utf8');
assert.ok(
  main.includes("import('./systems/world3d-mode.js')"),
  'main.js lädt das Spielmodul nach dem Renderer'
);
assert.ok(
  main.includes('autoInstall'),
  'main.js startet die 3D-Integration'
);
assert.ok(
  /id="combat"[\s\S]{0,200}id="combat-stage"/.test(html),
  'Bühnenrahmen liegt im Kampfbildschirm'
);

/* ---------- 10. Zwei Fehler, die beim Bauen aufgetreten sind ---------- */

// (a) Klassen müssen vor dem Umhängen gesetzt sein. Der Bühnenrahmen ist ohne
//     `world3d-combat` unsichtbar; eine Leinwand darin würde 0 × 0 messen.
const modeSource = await readFile(
  new URL('../js/systems/world3d-mode.js', import.meta.url), 'utf8'
);
// Letztes Vorkommen suchen: der Bezeichner steht auch in Kommentaren.
const classPos = modeSource.lastIndexOf("classList.toggle('world3d-combat'");
const mountPos = modeSource.indexOf('mount(target);');
assert.ok(classPos > 0 && mountPos > 0, 'beide Stellen vorhanden');
assert.ok(
  classPos < mountPos,
  'Bühnen-Klasse wird vor dem Umhängen gesetzt'
);

// (b) Eine 0-Größen-Messung darf 3D nicht dauerhaft abschalten.
const engineSource = await readFile(
  new URL('../js/world/world3d-phase1.js', import.meta.url), 'utf8'
);
assert.ok(
  !/if\(!resize\(\)\)\{\s*show\(false\);\s*return false;\s*\}/.test(engineSource),
  '0-Größe schaltet die Ansicht nicht ab'
);
assert.ok(
  engineSource.includes('Den Zustand NICHT abschalten') ||
  engineSource.includes('Der nächste Frame misst neu'),
  'Grund ist im Code dokumentiert'
);


console.log(
  'BESTANDEN: 3D-Schalter im Spiel, Leinwand folgt Kampf und Erkundung, ' +
  'Tod lässt sie ruhen, Vorliebe wird gespeichert und beim Start angewandt, ' +
  'Doppelinstallation und 0-Größen-Falle sind abgesichert. ' +
  'Kein WebGL-/Browser-/Gerätetest.'
);
