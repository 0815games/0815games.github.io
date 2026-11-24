// Der Build ist kaputt, sobald er den Spielstart kaputt macht. Dieser Test lädt
// app.js in jsdom und prüft die Objekte, die der Browser erwartet.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

// Der Build schreibt in den Spielordner selbst (GitHub Pages liefert von hier).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const {window, errors} = loadBundle(join(ROOT, 'app.js'));

test('Bündel lädt ohne Fehler', () => {
  assert.deepEqual(errors, [], `Konsolenfehler beim Laden: ${errors.join(' | ')}`);
});

test('Spielobjekte sind global erreichbar', () => {
  // Ohne window-Zuweisung wären die Inline-Handler in index.html blind.
  for (const name of ['Game', 'UI', 'Combat', 'Network', 'WorldGen', 'MiniGames']) {
    assert.equal(typeof window[name], 'object', `${name} fehlt auf window`);
  }
});

test('Datenkataloge sind vollständig', () => {
  const {Game} = window;
  assert.ok(Object.keys(Game.items).length >= 100, `nur ${Object.keys(Game.items).length} Items`);
  assert.ok(Object.keys(Game.monsters).length >= 9, `nur ${Object.keys(Game.monsters).length} Monster`);
  assert.ok(Game.recipes.length >= 16, `nur ${Game.recipes.length} Rezepte`);
  assert.ok(Game.questDefs.length >= 7, `nur ${Game.questDefs.length} Quests`);
  assert.ok(Game.perkDefs.length >= 10, `nur ${Game.perkDefs.length} Perks`);
});

test('Kernfunktionen des Spiels existieren', () => {
  const expected = [
    ['Game', ['init', 'move', 'saveGame', 'addToInventory', 'removeFromInventory', 'craftItem', 'gainExp', 'recalcStats']],
    ['Combat', ['start', 'playerAttack', 'enemyTurn', 'win', 'calculateHitChance']],
    ['Network', ['init', 'login', 'register', 'save', 'deleteSlot', 'startPresence']],
    ['WorldGen', ['setSeed', 'createSector', 'getSectorBiome', 'generateDungeonLayout']],
    // Der Einstieg in die Minigames läuft über UI.startMinigame;
    // MiniGames selbst ist eine Sammlung von Unterobjekten je Spielart.
    ['MiniGames', ['hacking', 'lockpicking', 'dice', 'defusal', 'memory']],
    ['UI', ['init', 'switchView', 'update', 'startMinigame', 'renderInventory', 'renderCamp', 'renderQuests', 'log']]
  ];
  for (const [object, members] of expected) {
    for (const member of members) {
      // Manche Einträge sind Unterobjekte (MiniGames.hacking), andere Funktionen.
      assert.notEqual(
        window[object][member],
        undefined,
        `${object}.${member} fehlt`
      );
    }
  }
});

test('Spielstand lässt sich anlegen, ohne dass Daten fehlen', () => {
  const {Game} = window;
  let threw = null;
  try {
    Game.init(null, null, 0, 'TESTLAUF');
  } catch (error) {
    threw = error;
  }
  assert.equal(threw, null, `Game.init warf: ${threw && threw.message}`);
  assert.equal(Game.state.playerName, 'TESTLAUF');
  assert.equal(Game.state.lvl, 1);
  assert.ok(Game.state.maxHp > 0, 'maxHp wurde nicht berechnet');
  assert.ok(Game.state.inventory.length > 0, 'Startinventar ist leer');
});

test('Neue Quests werden beim Start vergeben', () => {
  assert.ok(window.Game.state.activeQuests.length > 0, 'keine aktive Quest nach Spielstart');
});
