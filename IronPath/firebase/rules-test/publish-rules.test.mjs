import {test,before,after,beforeEach} from 'node:test';import {strict as assert} from 'node:assert';import {readFile} from 'node:fs/promises';import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';import {ref,get,set,update,onValue,runTransaction} from 'firebase/database';import {CAMPAIGN,completeStory,STORY_FORMAT} from '../../campaign.mjs';
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
