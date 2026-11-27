// Regression: Die 3D-Bühne darf beim Zeichnen nicht abstürzen.
//
// Fehlerbild (2026-11-27): Nach dem Einloggen auf dem Handy war der Bildschirm
// schwarz, keine Karte. Ursache: `show()` in world3d-phase1.js schrieb
// `api.active=active`, aber `active` ist in der öffentlichen API ein reiner
// Getter. In ES-Modulen (Strict Mode) wirft das einen TypeError. Der Fehler
// passierte in `render()` VOR dem Zeichnen – die Karte blieb schwarz.
//
// Zusätzlich: Der 2D-Canvas wurde nie auf die Bildschirmgröße gebracht. Auf dem
// Handy blieb er bei 640×480 oder 0 und war damit oft schwarz.

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const raw = await readFile(
  new URL('../js/world/world3d-phase1.js', import.meta.url), 'utf8'
);

/* ---------- Minimaler DOM ---------- */

class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.style = {};
    this.dataset = {};
    this.className = '';
    this._attrs = {};
    this._events = {};
    this.width = 640;
    this.height = 480;
    this._rect = {width: 390, height: 500, left: 0, top: 0};
  }
  getContext() {
    const ctx = {};
    for (const key of [
      'fillRect', 'clearRect', 'beginPath', 'moveTo', 'lineTo', 'stroke',
      'save', 'restore', 'setTransform', 'scale', 'strokeText', 'fillText',
      'drawImage', 'arc', 'fill', 'closePath', 'translate', 'rotate',
      'createLinearGradient', 'measureText', 'clip', 'ellipse', 'rect',
      'setLineDash', 'quadraticCurveTo', 'bezierCurveTo'
    ]) ctx[key] = () => {};
    ctx.createLinearGradient = () => ({addColorStop() {}});
    ctx.measureText = () => ({width: 10});
    return ctx;
  }
  append(child) {
    if (!child) return;
    child.parentElement = this;
    this.children.push(child);
  }
  setAttribute(name, value) { this._attrs[name] = String(value); }
  getAttribute(name) { return this._attrs[name] ?? null; }
  removeAttribute(name) { delete this._attrs[name]; }
  addEventListener(type, fn) { (this._events[type] ??= []).push(fn); }
  removeEventListener() {}
  classList = {
    _set: new Set(),
    add: (...n) => n.forEach((x) => this.classList._set.add(x)),
    remove: (...n) => n.forEach((x) => this.classList._set.delete(x)),
    contains: (x) => this.classList._set.has(x),
    toggle: (x, on) => {
      const next = on === undefined ? !this.classList._set.has(x) : !!on;
      if (next) this.classList._set.add(x); else this.classList._set.delete(x);
      return next;
    }
  };
  getBoundingClientRect() { return this._rect; }
}

const mapbox = new El('section');
const stage = new El('canvas');
stage.width = 640;
stage.height = 480;
mapbox.append(stage);

globalThis.document = {
  body: new El('body'),
  head: new El('head'),
  createElement: (tag) => new El(tag),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  readyState: 'complete'
};
globalThis.window = {addEventListener() {}, devicePixelRatio: 2};
globalThis.matchMedia = () => ({matches: false, addEventListener() {}});
globalThis.devicePixelRatio = 2;
globalThis.requestAnimationFrame = (fn) => { try { fn(0); } catch (e) { throw e; } return 1; };
globalThis.location = {search: ''};
globalThis.drawCharacter = () => {};
globalThis.drawMonster = () => {};

/* ---------- Modul laden (Three.js-Import wird ersetzt) ---------- */

const stubbed = raw
  .replace(
    /import \{createFigureFactory\} from '\.\/world-actors3d\.js';/,
    'const createFigureFactory=()=>({supports:()=>false,signature:()=>"",create:()=>null,dispose(){}});'
  )
  .replace(
    /^import \{(?:drawCharacter|drawMonster)\} from '\.\/(?:character|monster)\.js';$/gm,
    ''
  );

// Feuerprobe: Der Quelltext darf nicht auf einen reinen Getter schreiben.
// Das ist die eigentliche Regression – unabhängig vom Laden des Moduls.
const start = stubbed.indexOf('function show(active)');
// Kommentare entfernen: Sie dürfen den Namen `api.active` nennen, ohne dass
// der Test anschlägt. Geprüft wird nur echter Code.
const showBody = stubbed
  .slice(start, start + 900)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
assert.ok(showBody, 'show() gefunden');

assert.ok(
  !/api\.active\s*=/.test(showBody),
  'show() schreibt auf api.active. `active` ist ein reiner Getter – das wirft ' +
  'in ES-Modulen einen TypeError und die Karte bleibt schwarz.'
);

assert.ok(
  /state3d\.active\s*=/.test(showBody),
  'show() setzt den Zustand über state3d.active'
);

console.log(
  'BESTANDEN: show() schreibt nicht auf den Getter api.active. ' +
  'Kein WebGL-/Browser-/Gerätetest.'
);
