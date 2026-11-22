import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPlayer} from '../core/match.mjs';
import {createMatch} from '../core/simulation.mjs';
import {createVersus} from '../core/versus.mjs';
import {createFourCoop,createTwoVsTwo} from '../core/four-modes.mjs';
import {createPartyHost,restorePartyHost} from '../core/party-host.mjs';
import {normalizeCommand} from '../core/protocol.mjs';

const profile=id=>createPlayer(id,{name:id,gender:'female'});
const make=(mode,count)=>{
 const ids=['host','bob','cara','dan'].slice(0,count),players=ids.map(profile),teams=[ids.slice(0,2),ids.slice(2)];
 const match=mode==='coop'?createMatch(players):mode==='versus'?createVersus(players,'road','host'):mode==='four-coop'?createFourCoop(players,'host','four-front'):createTwoVsTwo(players,'host',teams,'four-front');
 const host=createPartyHost(match,{hostId:'host'});for(const id of ids)host.setPresence(id,true);
 const seq=Object.fromEntries(ids.map(id=>[id,0]));
 const command=(id,type,fields={})=>{
  const snapshot=host.snapshotFor(id),response=host.receive(id,{version:1,seq:++seq[id],command:{type,...fields},focusGeneration:snapshot.focusGeneration,rosterGeneration:snapshot.rosterGeneration});
  assert.equal(response.status,'queued',`${id} ${type}`);return host.advance().commands.find(item=>item.playerId===id).result;
 };
 return {ids,teams,host,command};
};

for(const [mode,count] of [['coop',2],['versus',2],['four-coop',3],['four-coop',4],['two-vs-two',4]])test(`${mode} ${count}: only an intentional host end creates a roster-bound finalization`,()=>{
 const {ids,teams,host,command}=make(mode,count),guest=ids[1];
 assert.equal(normalizeCommand({type:'acknowledgePartyEnd',endTick:0}),null);
 assert.equal(normalizeCommand({type:'acknowledgePartyEnd',endTick:1.5}),null);
 assert.equal(normalizeCommand({type:'acknowledgePartyEnd',endTick:1,extra:1}),null);
 assert.equal(command(guest,'acknowledgePartyEnd',{endTick:1}).ok,false,'a premature acknowledgement cannot be banked');
 assert.equal(command(guest,'endRun').ok,false,'a guest cannot intentionally end the shared run');
 host.setPresence(guest,false);host.setPresence(guest,true);
 assert.equal(host.snapshotFor('host').partyEnd,undefined,'a temporary disconnect is not an intentional end');
 assert.equal(command('host','endRun').ok,true);
 const final=host.snapshotFor('host').partyEnd;
 assert.ok(Number.isSafeInteger(final?.tick)&&final.tick>0);assert.deepEqual(final.acknowledged,[]);
 assert.equal(command(guest,'acknowledgePartyEnd',{endTick:final.tick+1}).ok,false,'wrong finalization generation cannot acknowledge');
 for(const id of ids){assert.equal(command(id,'acknowledgePartyEnd',{endTick:final.tick}).ok,true);assert.ok(host.snapshotFor(id).partyEnd.acknowledged.includes(id));}
 assert.deepEqual(new Set(host.snapshotFor('host').partyEnd.acknowledged),new Set(ids));
 assert.equal(command(guest,'acknowledgePartyEnd',{endTick:final.tick}).ok,true,'acknowledgements are idempotent');
 const restored=restorePartyHost(host.checkpoint(),{hostId:'host',playerIds:ids,mode,teams});
 assert.deepEqual(new Set(restored.snapshotFor('host').partyEnd.acknowledged),new Set(ids),'recovery retains the finalization proof');
 assert.equal(restored.snapshotFor('host').partyEnd.tick,final.tick);
});

test('a naturally ended match still requires an explicit host close intent',()=>{
 const ids=['host','bob'],match=createMatch(ids.map(profile));match.ended=true;match.running=false;match.endReason='defeat';
 const host=createPartyHost(match,{hostId:'host'});ids.forEach(id=>host.setPresence(id,true));
 const send=(id,seq,type)=>{assert.equal(host.receive(id,{version:1,seq,command:{type}}).status,'queued');return host.advance().commands[0].result;};
 assert.equal(host.snapshotFor('host').partyEnd,undefined);assert.equal(send('bob',1,'finishParty').ok,false);
 assert.equal(send('host',1,'finishParty').ok,true);assert.ok(host.snapshotFor('bob').partyEnd.tick>0);
 assert.equal(host.snapshotFor('bob').match.endReason,'defeat','the original outcome is not rewritten');
});

test('a malformed restored finalization fails closed',()=>{
 const {host,command,ids,teams}=make('coop',2);assert.equal(command('host','endRun').ok,true);
 const checkpoint=host.checkpoint();checkpoint.partyEnd.acknowledged=['intruder'];
 assert.throws(()=>restorePartyHost(checkpoint,{hostId:'host',playerIds:ids,mode:'coop',teams}),/finalization/i);
});
