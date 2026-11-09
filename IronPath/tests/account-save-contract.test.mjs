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
