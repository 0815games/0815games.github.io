import {test} from 'node:test';import {strict as assert} from 'node:assert';import {readFile} from 'node:fs/promises';
test('complete story rules preserve the currently published baseline',async()=>{const load=async f=>JSON.parse(await readFile(new URL(`../firebase/${f}`,import.meta.url),'utf8'));const base=await load('online-recovery.complete.draft.rules.json'),story=await load('story.complete.draft.rules.json'),player=story.rules.players.$uid;
// Story progress: the five-act story grows by inserting missions, so progress
// may legitimately jump (legacy remap, act inserts) - monotonic, capped at 50
// planned missions, but never step-limited to +1 like the retired campaign.
assert.equal(player.storyProgress['.validate'],'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 0 && newData.val() <= 50 && (!data.exists() ? newData.val() <= 1 : newData.val() >= data.val())');
// The format stamp: every write marks which story layout the number belongs to,
// so inserted missions never re-map a fresh save. 1..9 leaves room for future
// format bumps without another rules publish.
assert.equal(player.storyCampaign['.validate'],'newData.isNumber() && newData.val() % 1 === 0 && newData.val() >= 1 && newData.val() <= 9');
assert.equal(player['.validate'],base.rules.players.$uid['.validate']+" && (!data.child('storyProgress').exists() || newData.child('storyProgress').exists()) && (!data.child('storyCampaign').exists() || newData.child('storyCampaign').exists())");
delete player.storyProgress;delete player.storyCampaign;player['.validate']=base.rules.players.$uid['.validate'];assert.deepEqual(story,base);});
