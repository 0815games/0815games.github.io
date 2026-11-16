// Local Firebase emulator only. Neither this suite nor the candidate publishes
// Rules, reads real users, or proves that the production rules match the pin.
import {test,before,beforeEach,after} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {ref,get,set,remove} from 'firebase/database';
import {buildFriendPortraitCandidate} from '../friend-portrait-candidate.mjs';
import {buildRulesCandidate} from '../../release-tools/rules-candidate.mjs';

// Three bases, because the rules that are TESTED must be the rules that a
// publication would DEPLOY:
//   default                      - the pinned workshop reference plus the
//                                  portrait candidate (the standalone review);
//   FRIEND_PORTRAIT_GUARDED=1    - the same, behind the release guard;
//   FRIEND_PORTRAIT_STAGED=1     - the staged complete draft as it stands,
//                                  i.e. the artifact that would be published.
const epoch='a'.repeat(32),guarded=process.env.FRIEND_PORTRAIT_GUARDED==='1',staged=process.env.FRIEND_PORTRAIT_STAGED==='1';
let env,alice,bob,eve,anon;
const claims=()=>({auth_time:Math.floor(Date.now()/1000),firebase:{sign_in_provider:'custom'},ip_release_epoch:epoch});
const db=id=>env.authenticatedContext(id,claims()).database();
before(async()=>{
 const base=staged
  ?JSON.parse(await readFile(new URL('../workshop.complete.draft.rules.json',import.meta.url),'utf8'))
  :buildFriendPortraitCandidate(await readFile(new URL('../WORKSHOP-RULES-TO-PUBLISH.json',import.meta.url)));
 const rules=guarded?buildRulesCandidate(base).candidate:base;
 env=await initializeTestEnvironment({projectId:'demo-ironpath',database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}});
 alice=db('alice');bob=db('bob');eve=db('eve');anon=env.unauthenticatedContext().database();
});
beforeEach(async()=>{
 await env.clearDatabase();
 await env.withSecurityRulesDisabled(async ctx=>set(ref(ctx.database()),{
  _ironpathRelease:{mode:'open',build:'portrait-test',epoch,authAfterMs:(Math.floor(Date.now()/1000)-120)*1000},
  players:{alice:{name:'Alice',gender:'female',xp:0,avatar:'g:f|face:crop|hair:bob'},bob:{name:'Bob',gender:'male',xp:0,avatar:'g:m|look:beard'},eve:{name:'Eve',gender:'female',xp:0}},
  friendships:{bob:{alice:{status:'accepted',senderName:'Alice',receiverName:'Bob',code:'b'.repeat(32)}}}
 }));
});
after(async()=>env.cleanup());

test('accepted friends can read only the two portrait fields in both directions',async()=>{
 assert.equal((await assertSucceeds(get(ref(alice,'players/bob/avatar')))).val(),'g:m|look:beard');
 assert.equal((await assertSucceeds(get(ref(alice,'players/bob/gender')))).val(),'male');
 assert.equal((await assertSucceeds(get(ref(bob,'players/alice/avatar')))).val(),'g:f|face:crop|hair:bob');
 assert.equal((await assertSucceeds(get(ref(bob,'players/alice/gender')))).val(),'female');
 for(const path of ['players','players/bob','players/bob/name','players/bob/workshop'])await assertFails(get(ref(alice,path)));
 for(const path of ['players/bob/avatar','players/bob/gender']){await assertFails(get(ref(eve,path)));await assertFails(get(ref(anon,path)));}
});

test('pending, revoked and forged friendships do not grant new portrait reads',async()=>{
 await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),'friendships/bob/alice/status'),'pending'));
 for(const id of ['alice','bob'])for(const key of ['avatar','gender'])await assertFails(get(ref(db(id),`players/${id==='alice'?'bob':'alice'}/${key}`)));
 await assertFails(set(ref(eve,'friendships/bob/eve'),{status:'accepted',senderName:'Eve',receiverName:'Bob',code:'b'.repeat(32)}));
 await env.withSecurityRulesDisabled(ctx=>remove(ref(ctx.database(),'friendships/bob/alice')));
 for(const id of ['alice','bob'])for(const key of ['avatar','gender'])await assertFails(get(ref(db(id),`players/${id==='alice'?'bob':'alice'}/${key}`)));
});

test('portrait access does not allow a friend to write either field or alter other data',async()=>{
 await assertFails(set(ref(alice,'players/bob/avatar'),'g:m|face:short'));
 await assertFails(set(ref(alice,'players/bob/gender'),'female'));
 await assertFails(set(ref(alice,'players/bob/xp'),999));
 await assertSucceeds(set(ref(bob,'players/bob/avatar'),'g:m|face:short'));
 assert.equal((await get(ref(alice,'players/bob/avatar'))).val(),'g:m|face:short');
});

test('an accepted friend may read an absent legacy avatar as null but no private parent',async()=>{
 await env.withSecurityRulesDisabled(ctx=>remove(ref(ctx.database(),'players/bob/avatar')));
 assert.equal((await assertSucceeds(get(ref(alice,'players/bob/avatar')))).val(),null);
 await assertFails(get(ref(alice,'players/bob')));
});

test('the release guard still fences portrait reads while closed', {skip:!guarded||staged},async()=>{
 await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),'_ironpathRelease/mode'),'maintenance'));
 await assertFails(get(ref(db('alice'),'players/bob/avatar')));
 await assertFails(get(ref(db('alice'),'players/bob/gender')));
});
