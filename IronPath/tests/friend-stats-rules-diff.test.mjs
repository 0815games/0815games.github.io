import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
test('complete friend stats rules preserve previous rules except for three child reads',async()=>{const old=JSON.parse(await readFile(new URL('../firebase/friend-presence.complete.draft.rules.json',import.meta.url))),next=JSON.parse(await readFile(new URL('../firebase/friend-stats.complete.draft.rules.json',import.meta.url)));for(const key of ['xp','skills','armory']){assert.match(next.rules.players.$uid[key]['.read'],/status.*accepted/);delete next.rules.players.$uid[key]['.read'];}assert.deepEqual(next,old);});
