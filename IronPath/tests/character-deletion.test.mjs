import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createCharacterDeletion} from '../character-deletion.mjs';
import {friendNameKey} from '../friends.mjs';

const code='a'.repeat(32),connection='b'.repeat(32),key=friendNameKey('Alice');
function fixture(initial={}){
 const data=structuredClone(initial),calls=[],auth={currentUser:{uid:'alice'}};let failure=null,gate=null;
 const get=path=>{let value=data;for(const segment of path.split('/').filter(Boolean)){if(value===null||typeof value!=='object'||!Object.hasOwn(value,segment))return null;value=value[segment];}return structuredClone(value);};
 const erase=path=>{const parts=path.split('/'),last=parts.pop();let value=data;for(const segment of parts){if(!value?.[segment])return;value=value[segment];}delete value[last];};
 const sdk={ref:(_db,path)=>path||'',async get(path){calls.push(['get',path]);return {val:()=>get(path)};},async update(path,patch){calls.push(['update',path,structuredClone(patch)]);if(gate)await gate;if(failure)throw failure;for(const [p,value] of Object.entries(patch)){assert.equal(value,null);erase(p);}}};
 return {data,calls,auth,sdk,get,fail(error){failure=error;},wait(promise){gate=promise;},service(isCurrent){return createCharacterDeletion({db:{},auth,sdk,...(isCurrent?{isCurrent}:{})});}};
}
const initial=()=>({
 players:{alice:{name:'Alice',gender:'female',xp:100},bob:{name:'Bob',gender:'male',xp:0}},
 friendPrivate:{alice:{code,searchKey:key}},friendCodes:{[code]:{uid:'alice',name:'Alice'}},friendNames:{[key]:{alice:{name:'Alice',code}}},
 friendships:{alice:{carol:{status:'accepted'},dan:{status:'pending'}},bob:{alice:{status:'accepted'}}},
 friendOutgoing:{alice:{bob:{code:'c'.repeat(32),name:'Bob'},eve:{code:'d'.repeat(32),name:'Eve'}},carol:{alice:{code,name:'Alice'}},dan:{alice:{code,name:'Alice'}}},
 coopInvites:{alice:{carol:{partyId:'e'.repeat(32)},frank:{partyId:'f'.repeat(32)}},bob:{alice:{partyId:'e'.repeat(32)}},eve:{alice:{partyId:'e'.repeat(32)}},zara:{other:{name:'untouched'}}},
 friendPresence:{alice:{[connection]:42}},leaderboards:{solo:{alice:{name:'Alice',wave:8}},coop:{alice:{name:'Alice',wave:4}}}
});

test('one atomic update deletes the soldier, discovered edges, peer pointers, invites, identity and scores',async()=>{
 const f=fixture(initial()),result=await f.service().remove('Alice');
 assert.deepEqual(result,{incoming:2,outgoing:2,invitations:2});
 for(const path of ['players/alice','friendPrivate/alice/code','friendPrivate/alice/searchKey',`friendCodes/${code}`,`friendNames/${key}/alice`,'friendships/alice/carol','friendships/alice/dan','friendships/bob/alice','friendOutgoing/alice/bob','friendOutgoing/alice/eve','friendOutgoing/carol/alice','friendOutgoing/dan/alice','coopInvites/alice/carol','coopInvites/alice/frank','coopInvites/bob/alice','coopInvites/eve/alice',`friendPresence/alice/${connection}`,'leaderboards/solo/alice','leaderboards/coop/alice'])assert.equal(f.get(path),null,path);
 assert.equal(f.get('players/bob').name,'Bob');assert.equal(f.get('coopInvites/zara/other').name,'untouched');
 const writes=f.calls.filter(c=>c[0]==='update');assert.equal(writes.length,1);assert.equal(writes[0][1],'');
 const paths=Object.keys(writes[0][2]);assert.ok(paths.includes('players/alice'));assert.ok(!paths.includes('friendships/alice'));assert.ok(!paths.includes('coopInvites/alice'));assert.ok(!paths.includes('friendships/eve/alice'),'absent edge must not be deleted');
});

test('a rejected atomic update never reports success or changes any local mock data',async()=>{
 const f=fixture(initial()),before=structuredClone(f.data);f.fail(Error('permission denied'));
 await assert.rejects(()=>f.service().remove('Alice'),/permission denied/);assert.deepEqual(f.data,before);
 assert.equal(f.calls.filter(c=>c[0]==='update').length,1);
});

test('session changes and invalid stored identities fail before writing',async()=>{
 const f=fixture(initial());await assert.rejects(()=>f.service().remove('Another soldier'),/Soldier changed/);assert.equal(f.calls.some(c=>c[0]==='update'),false);
 const g=fixture(initial());g.data.friendPrivate.alice.code='not-a-code';await assert.rejects(()=>g.service().remove('Alice'),/Invalid stored social data/);assert.equal(g.calls.some(c=>c[0]==='update'),false);
 const h=fixture(initial());h.data.friendCodes[code].uid='bob';await assert.rejects(()=>h.service().remove('Alice'),/Invalid stored friend code/);assert.equal(h.calls.some(c=>c[0]==='update'),false);
 const i=fixture(initial());let alive=true;const original=i.sdk.get;i.sdk.get=async path=>{const snap=await original(path);alive=false;return snap;};await assert.rejects(()=>i.service(()=>alive).remove('Alice'),/Account changed/);assert.equal(i.calls.some(c=>c[0]==='update'),false);
});

test('an account change while waiting for server acknowledgement is not reported as success',async()=>{
 const f=fixture(initial());let resolve;f.wait(new Promise(done=>{resolve=done;}));const pending=f.service().remove('Alice');
 while(!f.calls.some(c=>c[0]==='update'))await new Promise(done=>setImmediate(done));
 f.auth.currentUser={uid:'bob'};resolve();await assert.rejects(pending,/Account changed/);
});

test('a soldier without social state uses only the profile and score leaves',async()=>{
 const f=fixture({players:{alice:{name:'Alice',gender:'female',xp:0}}});await f.service().remove('Alice');
 const patch=f.calls.find(c=>c[0]==='update')[2];assert.deepEqual(Object.keys(patch).sort(),['leaderboards/coop/alice','leaderboards/solo/alice','players/alice']);
});
