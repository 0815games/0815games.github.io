import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';

// Reported live: "Nach Sieg in Kampagnen-Mission 1 bleiben 'Mission wiederholen'
// + 'Naechste Mission' ausgegraut; Mission wird nie als abgeschlossen markiert
// (auch nicht nach Reload)." The published ruleset predated the storyCampaign
// field, so `$other: {".validate": false}` rejected every story save the moment
// the client started writing the format stamp - while XP-only saves kept
// working, which is why the gap looked like a client bug.
//
// The file that gets pasted into the Firebase console is
// firebase/WORKSHOP-RULES-TO-PUBLISH.json. The emulator suites in
// firebase/rules-test load the draft files, so nothing pinned the publish
// candidate itself. This contract test does (the emulator suite
// publish-rules.test.mjs exercises the same file against a real rules engine
// in CI).
test('the publish candidate carries the story fields the live ruleset was missing', async () => {
  const publish = JSON.parse(await readFile(new URL('../firebase/WORKSHOP-RULES-TO-PUBLISH.json', import.meta.url), 'utf8'));
  const player = publish.rules.players.$uid;
  assert.ok(player.storyCampaign, 'players/$uid has an explicit storyCampaign rule');
  assert.match(player.storyCampaign['.validate'], /val\(\) >= 1/, 'storyCampaign lower bound is 1');
  assert.match(player.storyCampaign['.validate'], /val\(\) <= 9/, 'storyCampaign upper bound is 9');
  assert.ok(player.storyProgress, 'players/$uid has an explicit storyProgress rule');
  assert.match(player.storyProgress['.validate'], /val\(\) <= 50/, 'storyProgress is capped at 50');
  assert.match(player.storyProgress['.validate'], /val\(\) >= data\.val\(\)/, 'storyProgress never decreases');
  // The catch-all is what silently rejected the story writes: with it in place,
  // every field the client writes must be spelled out above it.
  assert.equal(player.$other['.validate'], false, 'unknown fields stay rejected');
  assert.match(player['.validate'], /storyProgress/, 'the profile guard refuses to drop storyProgress');
  assert.match(player['.validate'], /storyCampaign/, 'the profile guard refuses to drop storyCampaign');
});

test('publish candidate and story draft agree on the story schemas', async () => {
  const read = file => readFile(new URL(file, import.meta.url), 'utf8').then(JSON.parse);
  const publish = await read('../firebase/WORKSHOP-RULES-TO-PUBLISH.json');
  const draft = await read('../firebase/story.complete.draft.rules.json');
  assert.deepEqual(publish.rules.players.$uid.storyCampaign, draft.rules.players.$uid.storyCampaign,
    'the console file matches the emulator-tested storyCampaign schema');
  assert.deepEqual(publish.rules.players.$uid.storyProgress, draft.rules.players.$uid.storyProgress,
    'the console file matches the emulator-tested storyProgress schema');
});

test('the emulator suite for the publish file is wired into CI and npm', async () => {
  const pkg = JSON.parse(await readFile(new URL('../firebase/rules-test/package.json', import.meta.url), 'utf8'));
  assert.ok(pkg.scripts['test:publish'], 'npm run test:publish exists');
  const emulator = await readFile(new URL('../firebase/firebase-publish.emulator.json', import.meta.url), 'utf8');
  assert.match(emulator, /WORKSHOP-RULES-TO-PUBLISH\.json/, 'the emulator config loads the publish file');
  const ci = await readFile(new URL('../../.github/workflows/ironpath-firebase-rules.yml', import.meta.url), 'utf8');
  assert.match(ci, /test:publish/, 'CI runs the publish-file suite');
});
