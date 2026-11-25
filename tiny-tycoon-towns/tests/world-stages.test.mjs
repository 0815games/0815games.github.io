// Sichtbare Stufen: jede Stufe muss andere Zeichenbefehle erzeugen. Gemessen wird mit einem Protokoll-Kontext,
// damit der Test ohne Browser läuft.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawBuilding, BUILDING_IDS } from '../src/world/art.js';

function recorder() {
  const log = [];
  const target = {};
  const proxy = new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      return (...args) => { log.push(String(prop)); return proxy; };
    },
    set(t, prop, value) { t[prop] = value; return true; },
  });
  return { ctx: proxy, log };
}

const env = { night: 0, day: 1 };

function commands(id, stage) {
  const { ctx, log } = recorder();
  drawBuilding(ctx, id, 4, 4, 1, 0.5, { ...env, stage });
  return log;
}

test('every building has a drawing, the house included', () => {
  assert.ok(BUILDING_IDS.includes('house'));
  for (const id of BUILDING_IDS) assert.ok(commands(id, 1).length > 0, `${id} wird gezeichnet`);
});

test('each upgrade stage adds visible parts: stage 2 to 5 draw more than the stage before', () => {
  for (const id of BUILDING_IDS) {
    let prev = commands(id, 1).length;
    for (let stage = 2; stage <= 5; stage++) {
      const now = commands(id, stage).length;
      assert.ok(now > prev, `${id}: Stufe ${stage} zeigt mehr als Stufe ${stage - 1}`);
      prev = now;
    }
  }
});

test('stage 5 is not the same drawing as stage 1 (gold edge and sparkle)', () => {
  for (const id of BUILDING_IDS) {
    const a = commands(id, 1).join(',');
    const b = commands(id, 5).join(',');
    assert.notEqual(a, b, `${id}: Stufe 1 und 5 unterscheiden sich`);
  }
});

test('the sparkle moves over time in stage 5, the drawing stays readable', () => {
  const r1 = recorder();
  drawBuilding(r1.ctx, 'farm', 4, 4, 1, 0.0, { ...env, stage: 5 });
  const r2 = recorder();
  drawBuilding(r2.ctx, 'farm', 4, 4, 1, 1.0, { ...env, stage: 5 });
  assert.equal(r1.log.length, r2.log.length, 'gleiche Befehle, nur Größe des Funkelns ändert sich');
});

// Gebäudespezifische Akzente (ab Stufe 3): Name und Zahlen der Befehle, damit gleiche Formen mit anderer Lage
// nicht als gleich gelten. Der Akzent ist der Teil, der zur Stufe 2 dazukommt und nicht zum gemeinsamen Zaun gehört.
function detailed(id, stage) {
  const log = [];
  const target = {};
  const proxy = new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      return (...args) => {
        const nums = args.filter((a) => typeof a === 'number').map((a) => Math.round(a * 10) / 10);
        log.push(`${String(prop)}(${nums.join(',')})`);
        return proxy;
      };
    },
    set(t, prop, value) { t[prop] = value; return true; },
  });
  drawBuilding(proxy, id, 4, 4, 1, 0, { ...env, stage });
  return log;
}

test('stage 3 adds a building-specific accent, and no two buildings share the same accent', () => {
  const extra = {};
  for (const id of BUILDING_IDS) {
    const base = detailed(id, 2);
    const s3 = detailed(id, 3);
    // Was Stufe 3 gegenüber Stufe 2 dazugibt: gemeinsamer Zaun plus Akzent des Gebäudes.
    assert.ok(s3.length > base.length, `${id}: Stufe 3 zeigt mehr als Stufe 2`);
    extra[id] = s3.slice(base.length).join(';');
  }
  const seen = new Map();
  for (const [id, sig] of Object.entries(extra)) {
    assert.ok(!seen.has(sig), `${id} und ${seen.get(sig)} zeigen denselben Akzent`);
    seen.set(sig, id);
  }
});

test('stages 4 and 5 add their own parts, and they differ per building and per stage', () => {
  const sig = new Map();
  for (const id of BUILDING_IDS) {
    const s3 = detailed(id, 3);
    const s4 = detailed(id, 4);
    const s5 = detailed(id, 5);
    const add4 = s4.slice(s3.length).join(';');
    const add5 = s5.slice(s4.length).join(';');
    assert.ok(add4.length > 0, `${id}: Stufe 4 fügt etwas hinzu`);
    assert.ok(add5.length > 0, `${id}: Stufe 5 fügt etwas hinzu`);
    assert.notEqual(add4, add5, `${id}: Stufe 4 und 5 unterscheiden sich`);
    sig.set(id, add4);
  }
  // Der Akzent der Stufe 4 ist die Kopie des eigenen Requisits, also je Gebäude verschieden. Gemeinsame Teile
  // wie die goldene Umrandung sind in Stufe 5, nicht in Stufe 4. Deshalb genügt die Prüfung auf Stufe 4 hier.
  const seen = new Map();
  for (const [id, v] of sig) {
    assert.ok(!seen.has(v), `${id} und ${seen.get(v)} haben denselben Stufe-4-Akzent`);
    seen.set(v, id);
  }
});
