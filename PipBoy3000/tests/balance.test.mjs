// Balancing-Wächter.
//
// Prüft zwei Dinge:
//   1. daß der Balancing-Bericht (tools/balance.mjs) reproduzierbar ist
//   2. daß Ausrüstung und Werte im Spiel überhaupt etwas bewirken
//
// Punkt 2 ist der wichtigere. In diesem Projekt sind mehrere Systeme
// unbemerkt verpufft, weil die Daten zwar da waren, aber niemand sie las:
// Munition (`usesAmmo`), Waffenschaden (`baseDmg`), Strahlungsresistenz,
// Buff-Items. Werte, die niemand liest, sind für den Spieler nicht vorhanden.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';
import {buildReport} from '../tools/balance.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Die Wächter unten prüfen, ob Ausrüstung und Werte im Spiel wirken. Bis
// Version 14.0.0 liefen sie als "todo" mit, weil die Befunde offen waren
// (docs/BALANCE_BEFUNDE.md). Seit alle behoben sind, laufen sie streng wie
// jeder andere Test - und blockieren, wenn ein Wert wieder wirkungslos wird.

function freshGame(overrides = {}) {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  window.Game.state = {
    inventory: [], caps: 100, equip: {}, perks: {}, special: {}, playerName: 'Test',
    lvl: 1, saveSlot: 0, maxHp: 100, hp: 100, maxSlots: 50, rads: 0, xp: 0,
    statPoints: 0, perkPoints: 0, quests: [], activeQuests: [], completedQuests: [],
    knownRecipes: [], explored: {}, discoveredPOIs: {}, sector: {x: 0, y: 0},
    stats: {STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5},
    ...overrides
  };
  window.Game.saveGame = () => {};
  if (window.UI) window.UI.log = () => {};
  return {window, game: window.Game, combat: window.Combat, ui: window.UI, state: window.Game.state};
}

// ===========================================================================
// Bericht
// ===========================================================================
test('der Balancing-Bericht läuft und enthält alle Kategorien', () => {
  const {text, daten} = buildReport();

  for (const abschnitt of ['## 1. Waffen', '## 2. Rüstung', '## 3. Perks', '## 4. SPECIAL',
    '## 5. Verbrauchsgüter', '## 6. Minispiele', '## 7. Monster', '## 8. Strahlung', '## 9. Wirtschaft']) {
    assert.ok(text.includes(abschnitt), `Abschnitt fehlt: ${abschnitt}`);
  }

  assert.equal(daten.weapons.length, 34, 'nicht alle Waffen erfasst');
  assert.ok(daten.armor.zeilen.length >= 30, 'nicht alle Rüstungsteile erfasst');
  assert.equal(daten.perks.length, 10);
  assert.ok(daten.monster.length >= 9);
});

test('der Bericht kennt jede Waffe, jedes Rüstungsteil und jeden Perk', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const {daten} = buildReport();

  // Der Test-Helper lädt das Bündel in einem eigenen Realm. Listen, die aus
  // dem Spiel stammen, haben deshalb einen fremden Array-Prototyp — ein
  // `assert.deepEqual(leer, [])` scheitert daran, obwohl beide leer sind.
  // Darum wird hier über `join` verglichen.
  assert.ok(daten.weapons.length > 0, `daten.weapons ist leer (${daten.weapons.length})`);
  assert.ok(daten.perks.length > 0, `daten.perks ist leer (${daten.perks.length})`);

  const waffen = Object.entries(window.Game.items).filter(([, d]) => d.type === 'weapon').map(([id]) => id);
  const fehlendeWaffen = waffen.filter(id => !daten.weapons.some(w => w.id === id));

  const ruestung = Object.entries(window.Game.items)
    .filter(([, d]) => ['head', 'body', 'legs', 'arms', 'feet', 'back'].includes(d.type)).map(([id]) => id);
  const fehlendeRuestung = ruestung.filter(id => !daten.armor.zeilen.some(a => a.id === id));

  const perks = window.Game.perkDefs.map(p => p.id);
  const fehlendePerks = perks.filter(id => !daten.perks.some(p => p.id === id));

  assert.equal(fehlendeWaffen.join(','), '', `Waffen fehlen im Bericht: ${fehlendeWaffen.join(', ')}`);
  assert.equal(fehlendeRuestung.join(','), '', `Rüstung fehlt im Bericht: ${fehlendeRuestung.join(', ')}`);
  assert.equal(fehlendePerks.join(','), '', `Perks fehlen im Bericht: ${fehlendePerks.join(', ')}`);
  window.close();
});

test('der Bericht ist stabil (keine Zufallszahlen)', () => {
  // Ein Bericht, der bei jedem Lauf anders aussieht, taugt nicht als Vergleich.
  const a = buildReport().text;
  const b = buildReport().text;
  assert.equal(a, b, 'zwei Läufe liefern unterschiedliche Berichte');
});

test('docs/BALANCING.md ist aktuell', () => {
  // Verhindert, daß die eingecheckte Fassung altert.
  const {text} = buildReport();
  const gespeichert = readFileSync(join(ROOT, 'docs/BALANCING.md'), 'utf8');
  assert.equal(gespeichert.trim(), text.trim(),
    'docs/BALANCING.md weicht ab — `node tools/balance.mjs --write` ausführen');
});

// ===========================================================================
// Wirken Ausrüstung und Werte?
// ===========================================================================
test('alle Perks werden im Code gelesen', () => {
  const {daten} = buildReport();
  const tot = daten.perks.filter(p => !p.gelesen).map(p => p.name);
  assert.equal(tot.join(', '), '', `Perks ohne Wirkung: ${tot.join(', ')}`);
});

test('Rüstung mindert den erlittenen Schaden', () => {
  // Am Kampf gemessen, nicht am Datenfeld: ein Gegner mit 30 Schaden greift
  // mehrfach an, einmal nackt und einmal gerüstet.
  const schaden = (equip) => {
    const {window, combat, state} = freshGame({lvl: 5, hp: 100});
    let summe = 0;
    const runden = 20;
    const original = window.Math.random;
    try {
      for (let i = 0; i < runden; i++) {
        state.equip = equip;
        state.hp = 100;
        combat.enemy = {name: 'Raider', dmg: 30, hp: 100, maxHp: 100};
        combat.turn = 'enemy';
        window.Math.random = () => 0;
        combat.enemyTurn();
        summe += 100 - state.hp;
      }
    } finally {
      window.Math.random = original;
    }
    return summe / runden;
  };

  const nackt = schaden({});
  const geruestet = schaden({body: {id: 'power_armor', def: 25}});

  assert.ok(geruestet < nackt,
    `Rüstung schützt nicht (nackt ${nackt}, gerüstet ${geruestet}) — kein Ausrüstungsteil hat ein def-Feld`);
});

test('Buff-Items legen ihren Bonus auch an', () => {
  // Buffout (+STR 2, +END 2), Jet (+AP 20), Rad-X und Stealth Boy haben
  // `effect: 'buff'` mit `bonus`. useItem schreibt nur "noch WIP" ins Log.
  const {game, state} = freshGame();
  state.inventory = [{id: 'buffout', count: 1}];
  const strVorher = game.getStat('STR');

  game.useItem('buffout');

  const strNachher = game.getStat('STR');
  assert.equal(strNachher, strVorher + 2,
    `Buffout erhöht STR nicht (${strVorher} -> ${strNachher}) — der Bonus wird nie angewandt`);
  assert.equal(game.buffBonus('STR'), 2, 'kein laufender Buff eingetragen');
});

test('Strahlungsresistenz aus Ausrüstung wirkt', () => {
  // Der Strahlenschutzanzug trägt bonus.RAD+1000, Rad-X RAD_RESIST+20.
  // addRadiation kennt nur den Rad-Resistenz-Perk.
  const {game, state} = freshGame({maxHp: 100});
  state.equip = {body: {id: 'hazmat_suit'}};
  state.rads = 0;

  game.addRadiation(50);

  assert.ok(state.rads < 50,
    `Strahlung kommt ungehindert durch (${state.rads} von 50) — der RAD-Bonus wird ignoriert`);
});

test('jedes Minispiel, das gestartet wird, existiert auch', () => {
  // startMinigame bricht bei unbekanntem Schlüssel still ab. Der Aufrufer
  // wartet dann ewig auf einen Rückruf: bei Truhen bleibt inDialog = true
  // und damit jeder weitere Truhenklick wirkungslos.
  const {daten} = buildReport();
  const fehlend = daten.minigames.fehlend ?? [];
  const texte = fehlend.map(f => `startMinigame('${f.key}') in ${f.datei}`);
  assert.equal(texte.join('; '), '', `Aufruf auf unbekanntes Minispiel: ${texte.join(', ')}`);
});

test('jedes Minispiel ist über eine Spielsituation erreichbar', () => {
  const {daten} = buildReport();
  const tot = daten.minigames.liste.filter(m => m.erreicht.length === 0).map(m => m.type);
  assert.equal(tot.join(', '), '', `nicht erreichbar: ${tot.join(', ')}`);
});

test('CHA wird von einer Spielmechanik gelesen', () => {
  // CHA wird nirgends gelesen: kein Dialogwurf, kein Händlerrabatt.
  const {daten} = buildReport();
  const ungenutzt = Object.entries(daten.special.leser)
    .filter(([, stellen]) => stellen.length === 0)
    .map(([key]) => key);
  assert.equal(ungenutzt.join(', '), '', `SPECIAL-Werte ohne Wirkung: ${ungenutzt.join(', ')}`);
});

// ===========================================================================
// Zahlen, die stimmen müssen
// ===========================================================================
test('jede Waffe macht im Kampf ihren Katalogwert', () => {
  const {game, combat} = freshGame();
  const falsch = [];
  for (const [id, def] of Object.entries(game.items)) {
    if (def.type !== 'weapon') continue;
    if (combat.getWeaponStats({id}).dmg !== def.baseDmg) falsch.push(id);
  }
  assert.equal(falsch.join(', '), '', `falscher Kampfschaden: ${falsch.join(', ')}`);
});

test('keine Fernkampfwaffe ist teurer und gleichzeitig schwächer als eine billigere', () => {
  // Eine Waffe, die mehr kostet und weniger Schaden macht, ist eine Falle.
  // Verglichen wird innerhalb der Fernkampfgruppe: sie kostet zusätzlich
  // Munition, eine Pistole ist also nicht automatisch schlechter als ein
  // gleich starker Hammer.
  const {game} = freshGame();
  const waffen = Object.entries(game.items)
    .filter(([, d]) => d.type === 'weapon' && d.cost > 0 && d.ammoType)
    .map(([id, d]) => ({id, kosten: d.cost, dmg: d.baseDmg, munition: !!d.ammoType}))
    .sort((a, b) => a.kosten - b.kosten);

  const fallen = [];
  let besteBisher = null;
  for (const w of waffen) {
    if (besteBisher && w.dmg < besteBisher.dmg) {
      fallen.push(`${w.id} (${w.kosten} KK, ${w.dmg} DMG) vs ${besteBisher.id} (${besteBisher.kosten} KK, ${besteBisher.dmg} DMG)`);
    }
    if (!besteBisher || w.dmg > besteBisher.dmg) besteBisher = w;
  }

  assert.equal(fallen.join('\n  '), '', `teurer und schwächer:\n  ${fallen.join('\n  ')}`);
});
