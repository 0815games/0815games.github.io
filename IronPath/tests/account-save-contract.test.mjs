import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';

// Reported: "Nach Abschluss der ersten Quest wird die zweite nicht
// freigeschalten und die erste nicht abgeschlossen markiert."
//
// The Firebase write itself committed - the in-memory profile of account.js
// never learned about it. Every board and menu kept rendering the pre-mission
// account until a full reload, so no unlock and no completion mark appeared.
// The UI harness mocks the account and (correctly) update their profile inside
// saveCampaign, which is exactly why this gap was invisible to the suite: the
// real account object has to adopt the committed snapshot itself.
//
// This contract test pins the real saveCampaign to that behaviour on source
// level, because loading account.js outside a browser (Firebase SDK, auth,
// window) is not practical here.
test('saveCampaign adopts the committed profile so the board unlocks in the same session', async () => {
  const source = await readFile(new URL('../account.js', import.meta.url), 'utf8');
  const start = source.indexOf('saveCampaign:async(id)=>');
  const end = source.indexOf('awardXP:', start);
  assert.ok(start >= 0 && end > start, 'saveCampaign found in account.js');
  const body = source.slice(start, end);
  assert.match(body, /if\(result\.committed\)\{profile=result\.snapshot\.val\(\);commandCenter\?\.render\(\);\}/,
    'a committed story save updates the in-memory profile and re-renders the command center');
  assert.match(body, /if\(version!==sessionVersion\)return \{committed:false\};/,
    'a session change still discards the result before adopting it');
});

// Reported live: "Nach Sieg in Kampagnen-Mission 1 bleiben 'Mission wiederholen'
// + 'Naechste Mission' ausgegraut" - a story save that never settles (offline
// transaction, rejected ruleset) left campaignSaved at null forever, so the
// results screen showed "Saving mission progress…" with no retry and no error.
// The save now has to terminate in every failure mode and name its reason.
test('saveCampaign always terminates and reports why a story save failed', async () => {
  const source = await readFile(new URL('../account.js', import.meta.url), 'utf8');
  const start = source.indexOf('saveCampaign:async(id)=>');
  const end = source.indexOf('awardXP:', start);
  assert.ok(start >= 0 && end > start, 'saveCampaign found in account.js');
  const body = source.slice(start, end);
  assert.match(body, /Promise\.race\(\[work,new Promise\(resolve=>setTimeout\(\(\)=>resolve\('timeout'\),12000\)\)\]\)/,
    'a hanging transaction is raced against a 12s watchdog instead of pending forever');
  assert.match(body, /reason:'timeout'/,
    'a watchdog hit resolves the save as not committed with reason "timeout"');
  assert.match(body, /completeStoryMission\(current,id\)/,
    'a rejected or aborted transaction recomputes the mission result from its own snapshot');
  assert.match(body, /update\(ref\(db,`players\/\$\{currentUser\.uid\}`\),patch\)/,
    'the retry lands as a minimal merge patch of exactly the changed fields');
  assert.match(body, /alreadyComplete:true/,
    'a mission already complete on the server is adopted without a second write');
  assert.match(body, /includes\('permission'\)\?'rejected':'error'/,
    'a permission-denied patch is reported as "rejected" so the UI can name the likely rules gap');
});

// The results screen has to surface the reason: a rules gap reads as an
// actionable message, not as an endless "Saving mission progress…".
test('renderResults names the campaign save failure reason', async () => {
  const source = await readFile(new URL('../game.js', import.meta.url), 'utf8');
  assert.match(source, /target\.campaignReason=result\?\.reason\|\|null;/,
    'both the victory save and the retry store the failure reason on the report');
  assert.match(source, /campaignSaveProblem\(target\.campaignReason\)/,
    'the results banner picks its message from that reason');
  assert.match(source, /reason==='rejected'\)return 'The database rejected the mission save\. The Iron Path database rules may need to be deployed\.'/,
    'a rejected write points at the database rules');
  const german = await readFile(new URL('../localization-results-de.mjs', import.meta.url), 'utf8');
  for (const english of [
    'The database rejected the mission save. The Iron Path database rules may need to be deployed.',
    'Saving mission progress timed out. Check your connection and retry.',
    'Your saved story progress is behind this mission. Reload the page to sync, then replay it.',
  ]) assert.ok(german.includes(english), `German translation ships for: ${english}`);
});
