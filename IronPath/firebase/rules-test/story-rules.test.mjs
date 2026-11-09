import {test,before,after,beforeEach} from 'node:test';import {strict as assert} from 'node:assert';import {readFile} from 'node:fs/promises';import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';import {ref,get,set,update,onValue,runTransaction} from 'firebase/database';import {CAMPAIGN,completeStory,STORY_FORMAT} from '../../campaign.mjs';
let env,alice,bob;before(async()=>{env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:await readFile(new URL('../story.complete.draft.rules.json',import.meta.url),'utf8')}});alice=env.authenticatedContext('alice').database();bob=env.authenticatedContext('bob').database();});beforeEach(async()=>{await env.clearDatabase();await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),'players/alice'),{name:'Alice',gender:'female',xp:900,campaign:3}));});after(async()=>env.cleanup());
test('story starts independently of retired campaign and retains legacy progress and XP',async()=>{const p=ref(alice,'players/alice');let stop;await new Promise((ok,no)=>{stop=onValue(p,ok,no);});const first=await assertSucceeds(runTransaction(p,v=>completeStory(v,'lost-signal')??undefined,{applyLocally:false}));assert.equal(first.snapshot.val().storyProgress,1);assert.equal(first.snapshot.val().storyCampaign,STORY_FORMAT);assert.equal(first.snapshot.val().campaign,3);assert.equal(first.snapshot.val().xp,900);
 // The whole eighteen-mission chain saves through the rules, each write
 // carrying the story format stamp alongside the raw progress number.
 for(const [i,mission] of CAMPAIGN.slice(1).entries()){const next=await assertSucceeds(runTransaction(p,v=>completeStory(v,mission.id)??undefined,{applyLocally:false}));assert.equal(next.snapshot.val().storyProgress,i+2,mission.id);assert.equal(next.snapshot.val().storyCampaign,STORY_FORMAT,mission.id);}
 assert.equal((await get(p)).val().storyProgress,CAMPAIGN.length);stop();});
test('story progress is monotonic, capped, undeletable and account-bound',async()=>{const p=ref(alice,'players/alice');
 // No story yet: the first write may only start at one.
 await assertFails(update(p,{storyProgress:2}));await assertFails(update(p,{storyProgress:-1}));await assertFails(update(p,{storyProgress:1.5}));await assertFails(update(ref(bob,'players/alice'),{storyProgress:1}));
 await assertSucceeds(update(p,{storyProgress:1}));
 await assertFails(update(p,{storyProgress:null}));await assertFails(update(p,{campaign:null}));await assertFails(update(p,{storyProgress:0}));
 // The five-act story grows by inserting missions, so progress may jump
 // forward (legacy remap, act inserts) but never move backwards.
 await assertSucceeds(update(p,{storyProgress:2}));await assertSucceeds(update(p,{storyProgress:3}));await assertSucceeds(update(p,{storyProgress:10}));await assertFails(update(p,{storyProgress:9}));
 await assertSucceeds(update(p,{storyProgress:50}));await assertFails(update(p,{storyProgress:51}));
 // The format stamp has its own band: nine future format bumps without
 // another rules publish.
 await assertFails(update(p,{storyCampaign:0}));await assertFails(update(p,{storyCampaign:10}));await assertSucceeds(update(p,{storyCampaign:1}));await assertSucceeds(update(p,{storyCampaign:9}));await assertFails(update(p,{storyCampaign:null}));
 assert.equal((await get(p)).val().campaign,3);});
