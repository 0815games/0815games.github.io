import {test,before,after,beforeEach} from 'node:test';import {strict as assert} from 'node:assert';import {readFile} from 'node:fs/promises';import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';import {ref,get,set,update,remove,onValue,runTransaction} from 'firebase/database';import {CAMPAIGN,completeStory,STORY_FORMAT} from '../../campaign.mjs';
// The file that gets pasted into the Firebase console is
// ../WORKSHOP-RULES-TO-PUBLISH.json - not the draft files the other suites
// load. Reported live: "Nach Sieg in Kampagnen-Mission 1 bleiben 'Mission
// wiederholen' + 'Naechste Mission' ausgegraut" - the published ruleset
// predated the storyCampaign field, so every story transaction was rejected
// by $other while XP-only writes kept working. This suite pins the exact
// file that ships to production, so a candidate without the story fields can
// never pass CI again.
let env,alice,bob;before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();});beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),'players/alice'),{name:'Alice',gender:'female',xp:900,campaign:3}));});after(async()=>env.cleanup());
test('publish file carries the whole story chain with the format stamp',async()=>{const p=ref(alice,'players/alice');
 let stop;await new Promise((ok,no)=>{stop=onValue(p,ok,no);});
 const first=await assertSucceeds(runTransaction(p,v=>completeStory(v,'lost-signal')??undefined,{applyLocally:false}));
 assert.equal(first.snapshot.val().storyProgress,1);
 assert.equal(first.snapshot.val().storyCampaign,STORY_FORMAT);
 assert.equal(first.snapshot.val().campaign,3);
 assert.equal(first.snapshot.val().xp,900);
 for(const [i,mission] of CAMPAIGN.slice(1).entries()){const next=await assertSucceeds(runTransaction(p,v=>completeStory(v,mission.id)??undefined,{applyLocally:false}));assert.equal(next.snapshot.val().storyProgress,i+2,mission.id);assert.equal(next.snapshot.val().storyCampaign,STORY_FORMAT,mission.id);}
 stop();});
test('publish file keeps story progress monotonic, capped and account-bound',async()=>{const p=ref(alice,'players/alice');
 await assertFails(update(p,{storyProgress:2}));
 await assertFails(update(ref(bob,'players/alice'),{storyProgress:1}));
 await assertSucceeds(update(p,{storyProgress:1,storyCampaign:STORY_FORMAT}));
 await assertFails(update(p,{storyProgress:null}));
 await assertFails(update(p,{storyProgress:0}));
 await assertSucceeds(update(p,{storyProgress:2}));
 await assertSucceeds(update(p,{storyProgress:50}));
 await assertFails(update(p,{storyProgress:51}));
 await assertFails(update(p,{storyCampaign:0}));
 await assertFails(update(p,{storyCampaign:10}));
 await assertSucceeds(update(p,{storyCampaign:9}));
 await assertFails(update(p,{storyCampaign:null}));
 assert.equal((await get(p)).val().campaign,3);});
test('the saveCampaign fallback patch lands as a merge update',async()=>{const p=ref(alice,'players/alice');
 // When the transaction is rejected or aborted, account.js retries the exact
 // fields completeStoryMission would change as a plain update patch.
 await assertSucceeds(update(p,{storyProgress:1,storyCampaign:STORY_FORMAT}));
 const after=(await get(p)).val();
 assert.equal(after.storyProgress,1);
 assert.equal(after.storyCampaign,STORY_FORMAT);
 assert.equal(after.campaign,3);
 assert.equal(after.xp,900);});
test('legacy XP-only saves still pass the publish file',async()=>{const p=ref(alice,'players/alice');
 const bumped=await assertSucceeds(runTransaction(p,v=>({...v,xp:(v?.xp||0)+25})));
 assert.equal(bumped.snapshot.val().xp,925);
 assert.equal(bumped.snapshot.val().storyProgress,undefined);
 assert.equal(bumped.snapshot.val().storyCampaign,undefined);});
test('workshop profile writes still pass the publish file',async()=>{const p=ref(alice,'players/alice');
 await assertSucceeds(update(p,{workshop:'w1:1'}));
 assert.equal((await get(p)).val().workshop,'w1:1');
 await assertFails(update(p,{workshop:''}));});
test('publish file accepts the endless record fields, monotonic and capped',async()=>{const p=ref(alice,'players/alice');
 // Prime the cache the way the production listener does, so the transaction's
 // first local pass sees the real profile.
 let stop;await new Promise((ok,no)=>{stop=onValue(p,ok,no);});
 // The endless launch dialog's record: one client-reported transaction per
 // finished free-play run (runs, waves, bosses, best sector). The update
 // function runs once against an empty local cache first, so like the
 // production writer it must tolerate a null current value.
 await assertSucceeds(runTransaction(p,v=>v?{...v,endlessRuns:(v.endlessRuns||0)+1,endlessWaves:(v.endlessWaves||0)+7,endlessBosses:(v.endlessBosses||0)+1,endlessBestSector:Math.max(v.endlessBestSector||0,2)}:undefined,{applyLocally:false}));
 const after=(await get(p)).val();
 assert.equal(after.endlessRuns,1);assert.equal(after.endlessWaves,7);assert.equal(after.endlessBosses,1);assert.equal(after.endlessBestSector,2);
 assert.equal(after.xp,900);assert.equal(after.campaign,3); // untouched by the stats write
 // Decreasing any stat is rejected (monotonic like storyProgress).
 await assertFails(update(p,{endlessRuns:0}));
 await assertFails(update(p,{endlessWaves:6}));
 await assertFails(update(p,{endlessBosses:0}));
 await assertFails(update(p,{endlessBestSector:1}));
 // Non-integer or out-of-band values are rejected.
 await assertFails(update(p,{endlessBosses:1.5}));
 await assertFails(update(p,{endlessBestSector:5}));
 await assertFails(update(p,{endlessWaves:null}));
 // First-write sanity caps: a brand-new field cannot arrive pre-inflated.
 await assertFails(update(ref(bob,'players/bob'),{name:'Bob',gender:'male',xp:0,endlessRuns:2}));
 await assertSucceeds(update(ref(bob,'players/bob'),{name:'Bob',gender:'male',xp:0,endlessRuns:1,endlessWaves:10000,endlessBosses:1000,endlessBestSector:4}));
 // The $other catch-all still rejects unknown fields.
 await assertFails(update(p,{somethingNew:1}));
 stop();
});
test('publish file accepts the avatar string, bounded and undeletable',async()=>{const p=ref(alice,'players/alice');
 // The painted face from the recruiting office: one short encoded string,
 // written once at enlistment and whenever the face is edited.
 await assertSucceeds(update(p,{avatar:'g:f|s:2|h:long|c:1|e:0|b:none|x:scar'}));
 assert.equal((await get(p)).val().avatar,'g:f|s:2|h:long|c:1|e:0|b:none|x:scar');
 await assertSucceeds(update(p,{avatar:'g:m|s:0|h:buzz|c:0|e:0|b:full|x:none'}));
 // Out-of-band values are refused: not a string, too short to be a face, too
 // long to be honest, and null would delete it.
 await assertFails(update(p,{avatar:'short'}));
 await assertFails(update(p,{avatar:'x'.repeat(65)}));
 await assertFails(update(p,{avatar:42}));
 await assertFails(update(p,{avatar:null}));
 // Another account cannot stamp a face onto someone else's dossier.
 await assertFails(update(ref(bob,'players/alice'),{avatar:'g:f|s:1|h:bun|c:2|e:1|b:none|x:none'}));
 // The rest of the profile is untouched by the write.
 assert.equal((await get(p)).val().xp,900);
});

test('the enlistment date is a bounded, undeletable profile field',async()=>{const p=ref(alice,'players/alice');
 // The service start date shown in the service record: written once at enlistment
 // (or backfilled for an existing account), never changed, never removed.
 await assertSucceeds(update(p,{enlisted:'2026-11-11'}));
 assert.equal((await get(p)).val().enlisted,'2026-11-11');
 // Wrong shapes are refused: not a date, not the ISO shape, not a string.
 await assertFails(update(p,{enlisted:'11.11.2026'}));
 await assertFails(update(p,{enlisted:'2026-11-1'}));
 await assertFails(update(p,{enlisted:'abcdefghij'}));
 await assertFails(update(p,{enlisted:20261111}));
 await assertFails(update(p,{enlisted:null}));
 // Another account cannot date someone else's service record.
 await assertFails(update(ref(bob,'players/alice'),{enlisted:'2027-01-01'}));
 // The rest of the profile is untouched by the write.
 assert.equal((await get(p)).val().xp,900);
});

test('the owner may delete the whole character, nobody else',async()=>{
 // "Charakter löschen": the profile node is removed so the account returns to
 // the recruiting office. Validate only guards non-null writes, so the owner's
 // delete goes through; another account is still locked out.
 await assertSucceeds(remove(ref(alice,'players/alice')));
 assert.equal((await get(ref(alice,'players/alice'))).val(),null);
 await assertFails(remove(ref(bob,'players/alice')));
 // And a fresh character can be enlisted again right after.
 await assertSucceeds(set(ref(alice,'players/alice'),{name:'Alice',gender:'female',xp:0}));
 assert.equal((await get(ref(alice,'players/alice'))).val().name,'Alice');
});
