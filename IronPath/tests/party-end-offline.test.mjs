import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPlayer} from '../match.mjs';
import {createVersus} from '../versus.mjs';
import {createTwoVsTwo} from '../four-modes.mjs';
import {createPartyHost} from '../party-host.mjs';

for(const mode of ['versus','two-vs-two'])test(`${mode}: the host can end a paused match without simulating or skipping the absent player's receipt`,()=>{
 const ids=mode==='versus'?['host','bob']:['host','bob','cara','dan'];
 const players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
 const initial=mode==='versus'?createVersus(players,'road','host'):createTwoVsTwo(players,'host',[ids.slice(0,2),ids.slice(2)],'four-front');
 const host=createPartyHost(initial,{hostId:'host'});for(const id of ids)host.setPresence(id,true);
 const packet=(id,type,fields={})=>{const s=host.snapshotFor(id);return {version:1,seq:s.nextSeq,focusGeneration:s.focusGeneration,rosterGeneration:s.rosterGeneration,command:{type,...fields}};};
 const absent=ids.at(-1);
 assert.equal(host.receive('host',packet('host','move',{x:700,y:400})).status,'queued');
 host.setPresence(absent,false);
 assert.equal(host.ready(),false);assert.equal(host.snapshotFor('host').partyEnd,undefined,'presence loss is not end intent');
 assert.equal(host.snapshotFor('host').receipts.at(-1).status,'cancelled','queued combat does not leak through the pause');
 const paused=host.checkpoint(),tick=paused.tick;
 assert.equal(host.advance(),null);assert.equal(host.checkpoint().tick,tick,'ordinary simulation remains paused');
 assert.equal(host.canEndFor('host'),true);assert.equal(host.canEndFor(absent),false);
 host.setFocusPaused(true);assert.equal(host.canEndFor('host'),false);assert.equal(host.advance(),null);host.setFocusPaused(false);
 if(mode==='two-vs-two'){
  assert.equal(host.canEndFor('bob'),false);assert.equal(host.receive('bob',packet('bob','endRun')).status,'cancelled');
  assert.equal(host.advance(),null);assert.equal(host.snapshotFor('host').partyEnd,undefined,'an online guest cannot end the paused match');
 }
 assert.equal(host.receive('host',packet('host','endRun')).status,'queued');
 const result=host.advance();assert.deepEqual(result.events,[],'a paused administrative step is not a combat step');
 assert.equal(result.commands.length,1);assert.equal(result.commands[0].result.ok,true);
 const final=host.snapshotFor('host').partyEnd;assert.equal(final.tick,tick+1);assert.deepEqual(final.acknowledged,[]);
 assert.equal(host.snapshotFor('host').match.endReason,'retired');assert.equal(host.ready(),true,'online members may exchange final receipts after the match ends');
 assert.equal(host.receive(absent,packet(absent,'acknowledgePartyEnd',{endTick:final.tick})).status,'rejected');
 for(const id of ids.filter(id=>id!==absent)){
  assert.equal(host.receive(id,packet(id,'acknowledgePartyEnd',{endTick:final.tick})).status,'queued');host.advance();
 }
 assert.ok(!host.snapshotFor('host').partyEnd.acknowledged.includes(absent),'the missing player cannot be acknowledged by the host');
 host.setPresence(absent,true);
 assert.equal(host.receive(absent,packet(absent,'acknowledgePartyEnd',{endTick:final.tick})).status,'queued');host.advance();
 assert.deepEqual(new Set(host.snapshotFor('host').partyEnd.acknowledged),new Set(ids));
});
