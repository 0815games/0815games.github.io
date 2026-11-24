// Befund 9/10 aus docs/BEFUNDE.md: Das Würfelsystem war vollständig gebaut,
// aber an keiner Stelle angeschlossen, und die Schadensberechnung las ein Feld,
// das der Katalog nicht kennt. Beides war unsichtbar, weil kein Test die
// tatsächlichen Kampfwerte prüfte.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadBundle} from './helpers/load-bundle.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function freshGame() {
  const {window} = loadBundle(join(ROOT, 'app.js'));
  window.Game.state = {
    inventory: [], caps: 0, equip: {}, perks: {}, special: {}, playerName: 'Test',
    lvl: 5, saveSlot: 0, maxHp: 100, maxSlots: 50, quests: [], activeQuests: [],
    completedQuests: [], knownRecipes: [], explored: {}, discoveredPOIs: {},
    sector: {x: 0, y: 0}, stats: {}
  };
  window.Game.saveGame = () => {};
  if (window.UI) window.UI.log = () => {};
  return {window, game: window.Game, combat: window.Combat, ui: window.UI, state: window.Game.state};
}

function withFixedRandom(window, value, fn) {
  const original = window.Math.random;
  window.Math.random = () => value;
  try { return fn(); } finally { window.Math.random = original; }
}

test('jede Waffe macht im Kampf ihren Katalogschaden', () => {
  // Vorher rechnete getWeaponStats mit `dbItem.dmg`, das es nicht gibt, und
  // fiel auf 2 zurück: 33 von 34 Waffen machten 2 Schaden. Ein Alien Blaster
  // (80) war so stark wie die Fäuste.
  const {game, combat} = freshGame();
  const falsch = [];

  for (const [id, def] of Object.entries(game.items)) {
    if (def.type !== 'weapon') continue;
    const stats = combat.getWeaponStats({id, count: 1});
    if (stats.dmg !== def.baseDmg) falsch.push(`${id}: Katalog ${def.baseDmg}, Kampf ${stats.dmg}`);
  }

  assert.deepEqual(falsch, [], `falscher Schaden:\n  ${falsch.join('\n  ')}`);
});

test('der Präfix-Wurf erhöht den Schaden tatsächlich', () => {
  const {combat} = freshGame();
  const basis = combat.getWeaponStats({id: 'plasma_rifle'}).dmg;
  assert.equal(basis, 45);

  const legendaer = combat.getWeaponStats({id: 'plasma_rifle', props: {prefix: 'legendary', dmgMult: 1.5}});
  assert.equal(legendaer.dmg, 67, 'dmgMult 1.5 wurde nicht angewandt');

  const gehaertet = combat.getWeaponStats({id: 'plasma_rifle', props: {prefix: 'hardened', dmgMult: 1.2}});
  assert.equal(gehaertet.dmg, 54);
});

test('ein festgeschriebener Schaden wird nicht doppelt multipliziert', () => {
  // createLegendaryItem schreibt `dmg` direkt ins Item und hat dmgMult dort
  // schon angewandt. Würde getWeaponStats nochmal multiplizieren, käme
  // 45 * 1.5 * 1.5 = 101 statt 67 heraus.
  const {combat} = freshGame();
  const stats = combat.getWeaponStats({id: 'plasma_rifle', dmg: 67, props: {dmgMult: 1.5}});
  assert.equal(stats.dmg, 67, 'dmgMult wurde doppelt angewandt');
});

test('der Loot-Würfel verteilt die Präfixe wie dokumentiert', () => {
  const {game} = freshGame();
  const zaehler = {};
  const LGUFE = 40000;
  for (let i = 0; i < LGUFE; i++) {
    const key = game.rollLootPrefix() || 'ohne';
    zaehler[key] = (zaehler[key] || 0) + 1;
  }

  const anteil = (key) => (zaehler[key] || 0) / LGUFE;
  assert.ok(Math.abs(anteil('ohne') - 0.40) < 0.02, `ohne: ${anteil('ohne')}`);
  assert.ok(Math.abs(anteil('rusty') - 0.30) < 0.02, `rusty: ${anteil('rusty')}`);
  assert.ok(Math.abs(anteil('precise') - 0.15) < 0.02, `precise: ${anteil('precise')}`);
  assert.ok(Math.abs(anteil('hardened') - 0.10) < 0.02, `hardened: ${anteil('hardened')}`);
  assert.ok(Math.abs(anteil('radiated') - 0.03) < 0.02, `radiated: ${anteil('radiated')}`);
  assert.ok(Math.abs(anteil('legendary') - 0.02) < 0.01, `legendary: ${anteil('legendary')}`);
});

test('Nicht-Waffen bekommen kein Präfix', () => {
  const {window, game} = freshGame();
  // 0.01 liegt im legendären Band: bekäme ein Stimpack ein Präfix, wäre die
  // Typ-Prüfung in generateLoot kaputt.
  const loot = withFixedRandom(window, 0.01, () => game.generateLoot('stimpack'));
  // Feldweise vergleichen: das Objekt stammt aus dem jsdom-Fenster und hat
  // einen anderen Prototyp als ein Objektliteral hier.
  assert.equal(loot.id, 'stimpack');
  assert.equal(loot.count, 1);
  assert.equal(loot.props, undefined, 'Nicht-Waffe bekam ein Präfix');
});

test('Combat.win lässt Waffen durch den Präfix-Würfel laufen', () => {
  const {window, game, combat, state} = freshGame();

  state.equip.weapon = {id: 'knife'};
  combat.enemy = {
    id: 'raider', name: 'Raider', hp: 0, maxHp: 10, dmg: 1, xp: [1, 2], loot: 0,
    drops: [{id: 'knife', c: 1}]
  };
  combat.log = () => {};
  combat.turn = 'player';
  if (window.UI) window.UI.showCombatEffect = () => {};

  // 0.01 liegt im legendären Band: dieser Drop muss ein Präfix bekommen.
  withFixedRandom(window, 0.01, () => combat.win());

  const waffen = state.inventory.filter(i => i.id === 'knife');
  assert.equal(waffen.length, 1, `erwartet 1 Messer, gefunden ${waffen.length}`);
  assert.ok(waffen[0].props, 'Waffe fiel ohne Präfix - generateLoot wurde nicht genutzt');
  assert.equal(waffen[0].props.prefix, 'legendary');
});

test('das Würfelspiel ist über die Stadt erreichbar', async () => {
  // startMinigame('dice') wurde nirgends gerufen. Das Spiel war gebaut, aber
  // unerreichbar.
  const {window, game} = freshGame();
  const document = window.document;
  document.body.innerHTML = '<div id="view-container"></div>';
  game.state.view = 'city';

  window.UI.renderCity();

  // Die Ortskarten setzen `element.onclick = fn` als Property, nicht als
  // Attribut - querySelector('[onclick]') findet hier also nichts.
  const karten = [...document.querySelectorAll('#view-container div')].filter(d => typeof d.onclick === 'function');
  const gluecksspiel = karten.find(d => /GLÜCKSSPIEL/.test(d.textContent));
  assert.ok(gluecksspiel, `keine Karte für das Würfelspiel (${karten.length} Karten gefunden)`);

  // Und der Klick muss wirklich das Würfelspiel starten.
  let gestartet = false;
  const originalInit = window.MiniGames.dice.init;
  window.MiniGames.dice.init = () => { gestartet = true; };
  game.state.tutorialsSeen = {dice: true};
  gluecksspiel.onclick();
  await new Promise(resolve => setTimeout(resolve, 120));
  window.MiniGames.dice.init = originalInit;
  assert.ok(gestartet, 'Klick auf die Karte startet das Würfelspiel nicht');
});

test('der Jackpot liefert eine Waffe, die besser ist als die Basis', () => {
  const {game, combat, state} = freshGame();
  for (let i = 0; i < 60; i++) game.gambleLegendaryLoot(18);

  const legendaer = state.inventory.filter(i => i.isLegendary);
  assert.ok(legendaer.length > 0, 'keine legendäre Waffe erzeugt');

  const basis = game.items.plasma_rifle.baseDmg;
  const zuSchwach = legendaer
    .filter(i => combat.getWeaponStats(i).dmg < basis)
    .map(i => `${i.name}: ${combat.getWeaponStats(i).dmg}`);

  assert.deepEqual(zuSchwach, [], `schwächer als die Basiswaffe (${basis}):\n  ${zuSchwach.join('\n  ')}`);
  assert.ok(legendaer.every(i => i.value === game.items.plasma_rifle.cost * 5),
    'Wert rechnet nicht mit cost');
});
