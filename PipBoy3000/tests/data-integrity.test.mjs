// Regressionstests für die Fehler aus docs/ANALYSE.md.
//
// Jeder Test entspricht einem belegten Befund. Solange ein Test rot ist, ist der
// jeweilige Fehler im Quellcode vorhanden. Tests, die einen noch offenen Punkt
// beschreiben, sind mit `todo` markiert und blockieren den Build nicht - sie
// dokumentieren den Sollzustand, bis er umgesetzt ist.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Der Build schreibt in den Spielordner selbst (GitHub Pages liefert von hier).
const read = (...parts) => readFileSync(join(ROOT, ...parts), 'utf8');

// --- B4: Item-IDs ohne Definition -----------------------------------------
// Monster droppen IDs, die im Item-Katalog fehlen. Sie landen im Inventar,
// belegen einen Slot und werden von der Inventaransicht übersprungen
// (ui_view_inv.js: `if(!item) return;`) - also unsichtbar.
test('jede Monster-Drop-ID ist im Item-Katalog definiert', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const items = new Set(Object.keys(window.Game.items));
  const missing = [];
  for (const [key, monster] of Object.entries(window.Game.monsters)) {
    for (const drop of monster.drops || []) {
      // 'caps' ist kein Item, sondern die Währung und wird gesondert verbucht.
      if (drop.id === 'caps') continue;
      if (!items.has(drop.id)) missing.push(`${key} -> ${drop.id}`);
    }
  }
  assert.deepEqual(missing, [], `Drops ohne Item-Definition:\n  ${missing.join('\n  ')}`);
});

// --- B4b: Rezept-Outputs ---------------------------------------------------
test('jedes Rezept erzeugt ein definiertes Item', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const items = new Set(Object.keys(window.Game.items));
  // 'AMMO' ist ein Sonderfall: craftItem erkennt genau diesen Wert und bucht
  // stattdessen das Item 'ammo'. Alle anderen Ausgaben müssen existieren.
  // Array.from: Objekte aus der jsdom-Welt haben ein fremdes Array-Prototyp,
  // an dem deepStrictEqual sonst scheitert, obwohl der Inhalt gleich ist.
  const missing = Array.from(window.Game.recipes)
    .filter(recipe => recipe.out !== 'AMMO' && !items.has(recipe.out))
    .map(recipe => `${recipe.id} -> ${recipe.out}`);
  assert.deepEqual(missing, [], `Rezepte ohne Item-Definition: ${missing.join(', ')}`);
});

test('jede Rezept-Zutat ist im Item-Katalog definiert', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const items = new Set(Object.keys(window.Game.items));
  const missing = new Set();
  for (const recipe of window.Game.recipes) {
    for (const ingredient of Object.keys(recipe.req || {})) {
      if (!items.has(ingredient)) missing.add(ingredient);
    }
  }
  assert.deepEqual([...missing], [], `Zutaten ohne Item-Definition: ${[...missing].join(', ')}`);
});

// --- B5: Monster im Spawn-Pool --------------------------------------------
// startCombat baut Pools aus Game.monsters.protectron/.sentryBot/.mirelurk/
// .mutantRose/.yaoGuai - keines davon existiert. Ein undefined-Eintrag im Pool
// führt zu "Unbekanntes Monster" mit 20 HP.
test('jede im Spawn-Pool genannte Monster-ID existiert', () => {
  const source = read('src', 'game', 'game_char_logic.js');
  const {window} = loadBundle(join(ROOT, 'app.js'));
  const referenced = new Set([...source.matchAll(/monsters\.([A-Za-z_$][\w$]*)/g)].map(m => m[1]));
  const missing = [...referenced].filter(key => !window.Game.monsters[key]);
  assert.deepEqual(missing, [], `Monster ohne Definition: ${missing.join(', ')}`);
});

// --- B6: Biome und Zonen --------------------------------------------------
// Die Biome 'city' und 'jungle' sowie die Zonen 'Supermarkt' und 'Höhle' werden
// nirgends erzeugt; die zugehörigen Gegner-Pools sind damit unerreichbar.
test('Spawn-Pools nennen keine Biome, die der Generator nie erzeugt', () => {
  const generator = read('src', 'game', 'game_world_gen.js');
  const combat = read('src', 'game', 'game_char_logic.js');
  const produced = new Set([...generator.matchAll(/return '([a-z]+)';/g)].map(m => m[1]));
  const used = [...combat.matchAll(/biome === '([a-z]+)'/g)].map(m => m[1]);
  const unreachable = used.filter(biome => !produced.has(biome));
  assert.deepEqual(unreachable, [], `Biome ohne Generator: ${unreachable.join(', ')}`);
});

// --- B1: Gamble-Überschreibung -------------------------------------------
// game_inv_logic.js enthält das vollständige System für legendäre Waffen
// (Präfixe, UID-Items); game_char_logic.js überschreibt es. Die Fassung in
// game_inv_logic.js ist toter Code.
test('gambleLegendaryLoot stammt aus genau einer Datei', () => {
  const first = read('src', 'game', 'game_inv_logic.js');
  const second = read('src', 'game', 'game_char_logic.js');
  const inFirst = first.includes('gambleLegendaryLoot:');
  const inSecond = second.includes('gambleLegendaryLoot:');
  assert.ok(!(inFirst && inSecond), 'gambleLegendaryLoot ist in zwei Dateien definiert');
});

// --- B2: Touch-Joystick ---------------------------------------------------
// ui_render_overlays.js überschreibt restoreOverlay aus ui_render_core.js. Nur
// die überschriebene Fassung legt #joystick-base an, deshalb bleibt
// UI.els.joyBase null und der Joystick erscheint nie.
test('restoreOverlay legt den Joystick an', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  window.UI.restoreOverlay();
  assert.ok(
    window.document.getElementById('joystick-base'),
    'nach restoreOverlay fehlt #joystick-base'
  );
  assert.ok(window.UI.els.joyBase, 'UI.els.joyBase wurde nicht gesetzt');
});

// --- B7: Ladereihenfolge --------------------------------------------------
test('eine Datei in src/ ist nicht doppelt vorhanden', () => {
  const names = [];
  for (const dir of ['data', 'game', 'ui']) {
    for (const name of readdirSync(join(ROOT, 'src', dir))) names.push(name);
  }
  const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
  assert.deepEqual(duplicates, [], `Doppelte Dateinamen: ${duplicates.join(', ')}`);
});

// --- B8: Quest-Ansicht ----------------------------------------------------
// Der AUFGABEN-Button zeigt auf die View 'journal', für die es kein Template
// gibt; die echte Ansicht liegt in views/quests.html.
test('jede per switchView und Navigation angesteuerte View hat ein Template', () => {
  const available = new Set(
    readdirSync(join(ROOT, 'templates')).map(name => name.replace(/\.html$/, ''))
  );
  // Diese Views werden nicht per fetch geladen, sondern im Code erzeugt.
  const builtIn = new Set(['map', 'hacking', 'lockpicking']);
  const sources = [
    read('src', 'ui', 'ui_render_core.js'),
    read('src', 'ui', 'ui_input.js'),
    read('src', 'ui', 'ui_combat.js')
  ].join('\n');
  const targets = new Set(
    [...sources.matchAll(/switchView\(\s*'([a-z]+)'/g)].map(m => m[1])
  );
  const missing = [...targets].filter(view => !available.has(view) && !builtIn.has(view));
  assert.deepEqual(missing, [], `Views ohne Template: ${missing.join(', ')}`);
});

// --- B9: aufgerufene, aber fehlende Funktionen ---------------------------
test('Game.deleteSave und Game.getMaxHp existieren', () => {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  assert.equal(typeof window.Game.deleteSave, 'function', 'Game.deleteSave fehlt');
  assert.equal(typeof window.Game.getMaxHp, 'function', 'Game.getMaxHp fehlt');
});
