import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {applyProgressionDeltaCaps, PROGRESSION_DELTAS} from '../firebase/progression-delta-candidate.mjs';

// Sicherheit (AUSBAU-PLAN Punkt 2): Die Fortschrittsregeln begrenzten nur
// Monotonie + Maximum — ein manipulierter Client konnte XP, Bestwelle und
// Endlos-Zähler in einer Schreibung ans Limit springen lassen. Die
// Publish-Datei deckelt den Zuwachs pro Schreibung und ändert sonst nichts.

const CHANGED = [
  '/rules/players/$uid/xp/.validate',
  '/rules/players/$uid/storyProgress/.validate',
  '/rules/players/$uid/endlessRuns/.validate',
  '/rules/players/$uid/endlessWaves/.validate',
  '/rules/players/$uid/endlessBosses/.validate',
  '/rules/players/$uid/armory/scrap/.validate',
  '/rules/leaderboards/$mode/$uid/wave/.validate',
];

test('the delta-cap publish file is the live ruleset plus exactly seven tightened validates', async () => {
  const base = JSON.parse(await readFile(new URL('../firebase/ENDLESS-LAST-RUN-TO-PUBLISH.json', import.meta.url), 'utf8'));
  const publish = JSON.parse(await readFile(new URL('../firebase/PROGRESSION-DELTA-CAPS-TO-PUBLISH.json', import.meta.url), 'utf8'));
  const changed = [];
  const walk = (a, b, path = '') => {
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      assert.deepEqual(Object.keys(b).sort(), Object.keys(a).sort(), `${path} gains or loses no keys`);
      for (const key of Object.keys(a)) walk(a[key], b[key], `${path}/${key}`);
    } else if (a !== b) changed.push(path);
  };
  walk(base, publish);
  assert.deepEqual(changed.sort(), [...CHANGED].sort(), 'only the seven validate strings move');
  const rebuilt = JSON.parse(JSON.stringify(base));
  applyProgressionDeltaCaps(rebuilt.rules);
  assert.deepEqual(publish, rebuilt, 'the publish file is reproducible from the base');
});

test('every cap sits above honest play and below a one-shot jump', async () => {
  // Wellen-XP spitzt bei 1.020 (20 + 100*10); ein Lauf meldet seine Summen
  // einmal; Scrap zahlt 20 pro Boss. Die Deckel lassen ehrliches Spiel mit
  // großem Abstand durch und stoppen den Sprung ans Limit (10 Mio./10.000).
  assert.ok(PROGRESSION_DELTAS.xp >= 1020 && PROGRESSION_DELTAS.xp < 100000);
  assert.equal(PROGRESSION_DELTAS.storyProgress, 1);
  assert.equal(PROGRESSION_DELTAS.endlessRuns, 1);
  assert.ok(PROGRESSION_DELTAS.scrap >= 20 * 10, 'ten bosses of scrap in one write stay legal');
  const publish = JSON.parse(await readFile(new URL('../firebase/PROGRESSION-DELTA-CAPS-TO-PUBLISH.json', import.meta.url), 'utf8'));
  const xp = publish.rules.players.$uid.xp['.validate'];
  assert.match(xp, /<= data\.val\(\) \+ 5000/);
  assert.match(xp, />= data\.val\(\)/, 'monotonic stays');
  assert.match(xp, /<= 10000000/, 'the ceiling stays');
  const scrap = publish.rules.players.$uid.armory.scrap['.validate'];
  assert.match(scrap, /newData\.val\(\) <= data\.val\(\) \|\|/, 'spending scrap down is never capped');
});

test('a drifted base aborts the candidate build', async () => {
  const base = JSON.parse(await readFile(new URL('../firebase/ENDLESS-LAST-RUN-TO-PUBLISH.json', import.meta.url), 'utf8'));
  base.rules.players.$uid.xp['.validate'] = 'newData.isNumber()';
  assert.throws(() => applyProgressionDeltaCaps(base.rules), /re-audit/);
  const missing = JSON.parse(await readFile(new URL('../firebase/ENDLESS-LAST-RUN-TO-PUBLISH.json', import.meta.url), 'utf8'));
  delete missing.rules.leaderboards;
  assert.throws(() => applyProgressionDeltaCaps(missing.rules), /re-audit/);
});
