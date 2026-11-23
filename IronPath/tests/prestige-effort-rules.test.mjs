import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {applyPrestigeEffortRules, buildPrestigeEffortCandidate} from '../firebase/prestige-effort-candidate.mjs';
import {PRESTIGE_MAX_TIER, prestigeScrapBonus} from '../core/campaign-prestige.mjs';
import {WAR_EFFORT_GOAL} from '../core/war-effort.mjs';

// AUSBAU-PLAN Punkt 4: Kampagnen-Prestige (4b) und Kriegsanstrengung (4a)
// brauchen je ein neues Profilfeld. Die veröffentlichten Regeln verweigern
// unbekannte Felder ($other: false), also liefert dieses Paket - wie
// IPL-0112/IPL-0116 - eine additive Publish-Datei auf dem live Stand; der
// Betreiber veröffentlicht selbst, WORKSHOP-RULES-TO-PUBLISH.json bleibt
// unangetastet.

test('the prestige/effort publish file is the live ruleset plus exactly two player fields', async () => {
  const baseText = await readFile(new URL('../firebase/PROGRESSION-DELTA-CAPS-TO-PUBLISH.json', import.meta.url), 'utf8');
  const publishText = await readFile(new URL('../firebase/PRESTIGE-EFFORT-TO-PUBLISH.json', import.meta.url), 'utf8');
  const base = JSON.parse(baseText), publish = JSON.parse(publishText);
  const added = [], changed = [];
  const walk = (a, b, path = '') => {
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      for (const key of Object.keys(b)) if (!Object.hasOwn(a, key)) added.push(`${path}/${key}`);
      for (const key of Object.keys(a)) {
        if (!Object.hasOwn(b, key)) changed.push(`${path}/${key} (removed)`);
        else walk(a[key], b[key], `${path}/${key}`);
      }
    } else if (a !== b) changed.push(path);
  };
  walk(base, publish);
  assert.deepEqual(added.sort(), ['/rules/players/$uid/campaignPrestige', '/rules/players/$uid/warEffort']);
  assert.deepEqual(changed, [], 'no existing rule moves');
  assert.equal(buildPrestigeEffortCandidate(baseText), publishText, 'the publish file is reproducible from the live base, byte for byte');
});

test('both fields are bounded, monotonic, and step like the client writes them', async () => {
  const publish = JSON.parse(await readFile(new URL('../firebase/PRESTIGE-EFFORT-TO-PUBLISH.json', import.meta.url), 'utf8'));
  const player = publish.rules.players.$uid;
  const prestige = player.campaignPrestige['.validate'];
  assert.match(prestige, /<= data\.val\(\) \+ 1/, 'the ladder climbs one rung per write, like recordPrestigeClear');
  assert.match(prestige, new RegExp(`<= ${PRESTIGE_MAX_TIER} &&`), 'and ends where the client ladder ends');
  assert.ok(prestigeScrapBonus(PRESTIGE_MAX_TIER) <= 1000, 'the top rung bonus fits the scrap growth cap of the live rules');
  const effort = player.warEffort['.validate'];
  assert.match(effort, />= data\.val\(\)/, 'donations never come back');
  assert.match(effort, /<= data\.val\(\) \+ 1000/, 'one write funds at most one donation cap');
  assert.ok(WAR_EFFORT_GOAL <= 50000, 'the client funding goal sits inside the rule ceiling');
});

test('a drifted base aborts the candidate build', async () => {
  const base = JSON.parse(await readFile(new URL('../firebase/PROGRESSION-DELTA-CAPS-TO-PUBLISH.json', import.meta.url), 'utf8'));
  base.rules.players.$uid.warEffort = {'.validate': 'newData.isNumber()'};
  assert.throws(() => applyPrestigeEffortRules(base.rules), /re-audit/);
  const missing = JSON.parse(await readFile(new URL('../firebase/PROGRESSION-DELTA-CAPS-TO-PUBLISH.json', import.meta.url), 'utf8'));
  delete missing.rules.players;
  assert.throws(() => applyPrestigeEffortRules(missing.rules), /re-audit/);
});
