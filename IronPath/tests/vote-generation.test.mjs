import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPartyHost} from '../party-host.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch} from '../simulation.mjs';
import {createFourCoop,createTwoVsTwo} from '../four-modes.mjs';
import {createVersus} from '../versus.mjs';

const cases=[['coop',2],['four-coop',3],['four-coop',4],['versus',2],['two-vs-two',4]];
function fixture(mode,count,{running=false}={}){
 const ids=['a','b','c','d'].slice(0,count),players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
 const game=mode==='four-coop'?createFourCoop(players,'a'):mode==='two-vs-two'?createTwoVsTwo(players,'a',[['a','b'],['c','d']]):mode==='versus'?createVersus(players,'road','a'):createMatch(players,'road');
 const fields=mode==='four-coop'?[game.match]:mode==='two-vs-two'?game.lanes:mode==='versus'?Object.values(game.lanes):[game];
 if(running)for(const field of fields)Object.assign(field,{wave:1,running:true,spawnLeft:1,spawnTimer:100});
 const host=createPartyHost(game,{hostId:'a'});for(const id of ids)host.setPresence(id,true);
 const packet=(id,command)=>{const snap=host.snapshotFor(id);return {version:1,seq:snap.nextSeq,command,rosterGeneration:snap.rosterGeneration,focusGeneration:snap.focusGeneration};};
 const run=(id,command)=>{const p=packet(id,command);assert.equal(host.receive(id,p).status,'queued');const result=host.advance().commands.find(c=>c.playerId===id&&c.seq===p.seq)?.result;assert.ok(result);return result;};
 return {ids,host,packet,run};
}

for(const [mode,count] of cases){
 test(`${mode}/${count}: a delayed wave request cannot reopen a declined vote`,()=>{
  const f=fixture(mode,count),old=f.packet('a',{type:'startWave',expectedRequestId:0});
  const first=f.run('b',{type:'startWave'});assert.ok(first.ok);assert.ok(f.run('b',{type:'cancelWave',requestId:first.requestId}).ok);
  assert.equal(f.host.receive('a',old).status,'queued');assert.equal(f.host.advance().commands[0].result.ok,false);
  const redelivery=f.host.receive('a',old);assert.equal(redelivery.status,'applied');assert.equal(redelivery.result.ok,false,'the rejected action has an idempotent receipt');
  assert.equal(f.run('a',{type:'startWave',expectedRequestId:first.requestId}).ok,true,'fresh counter is accepted');
 });
 test(`${mode}/${count}: delayed speed request and slowdown cannot replace a newer vote`,()=>{
  const f=fixture(mode,count,{running:true}),old=f.packet('a',{type:'requestSpeed',expectedRequestId:0});
  const first=f.run('b',{type:'requestSpeed'});assert.ok(first.ok);assert.ok(f.run('b',{type:'cancelSpeed',requestId:first.requestId}).ok);
  assert.equal(f.host.receive('a',old).status,'queued');assert.equal(f.host.advance().commands[0].result.ok,false);
  assert.equal(f.host.snapshotFor('a').speedControl.request,null);
  const active=f.run('b',{type:'requestSpeed',expectedRequestId:first.requestId});assert.ok(active.ok);
  for(const id of f.ids.filter(id=>id!=='b'))assert.ok(f.run(id,{type:'approveSpeed',requestId:active.requestId}).ok);
  assert.equal(f.host.snapshotFor('a').speedControl.speed,2);
  const staleSlow=f.packet('a',{type:'slowSpeed',expectedRequestId:active.requestId});
  assert.ok(f.run('b',{type:'slowSpeed',expectedRequestId:active.requestId}).ok);
  const newer=f.run('b',{type:'requestSpeed',expectedRequestId:active.requestId});assert.ok(newer.ok);
  assert.equal(f.host.receive('a',staleSlow).status,'queued');assert.equal(f.host.advance().commands[0].result.ok,false);
  assert.equal(f.host.snapshotFor('a').speedControl.request.id,newer.requestId,'old slowdown cannot clear the new vote');
  for(const id of f.ids.filter(id=>id!=='b'))assert.ok(f.run(id,{type:'approveSpeed',requestId:newer.requestId}).ok);
  const anotherOld=f.packet('a',{type:'slowSpeed',expectedRequestId:active.requestId});assert.equal(f.host.receive('a',anotherOld).status,'queued');assert.equal(f.host.advance().commands[0].result.ok,false);
  assert.equal(f.host.snapshotFor('a').speedControl.speed,2,'old slowdown cannot undo the new unanimous speed');
 });
}

test('expected vote counters must be nonnegative safe integers',()=>{
 const f=fixture('coop',2);
 for(const bad of [-1,1.5,Number.MAX_SAFE_INTEGER+1]){
  const p=f.packet('a',{type:'startWave',expectedRequestId:bad});assert.equal(f.host.receive('a',p).reason,'malformed-command');
 }
});
