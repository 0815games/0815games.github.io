import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPartyHost,restorePartyHost} from '../party-host.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch} from '../simulation.mjs';
import {createVersus} from '../versus.mjs';
import {createFourCoop,createTwoVsTwo} from '../four-modes.mjs';
const ids=['a','b','c','d'],players=ids.map(id=>createPlayer(id,{name:id,gender:'female'}));
const cases=[['coop',2,p=>createMatch(p)],['versus',2,p=>createVersus(p,undefined,'a')],['four-coop',3,p=>createFourCoop(p,'a')],['four-coop',4,p=>createFourCoop(p,'a')],['two-vs-two',4,p=>createTwoVsTwo(p,'a',[['a','b'],['c','d']])]];
for(const [mode,count,make] of cases)test(`checkpoint recovery core preserves ${mode} ${count} roster without replaying pending inputs`,()=>{
 const roster=ids.slice(0,count),teams=mode==='two-vs-two'?[['a','b'],['c','d']]:undefined,host=createPartyHost(make(players.slice(0,count)),{hostId:'a'});for(const id of roster)host.setPresence(id,true);
 assert.equal(host.receive('a',{version:1,seq:1,command:{type:'move',x:700,y:400}}).status,'queued');host.advance();
 assert.equal(host.receive('b',{version:1,seq:1,command:{type:'move',x:650,y:400}}).status,'queued');const checkpoint=host.checkpoint(),saved=structuredClone(checkpoint);
 const resumed=restorePartyHost(checkpoint,{hostId:'a',playerIds:roster,mode,teams});assert.deepEqual(checkpoint,saved,'restore does not mutate input');assert.equal(resumed.advance(),null);assert.equal(resumed.snapshotFor('b').receipts.find(r=>r.seq===1).status,'cancelled');
 for(const id of roster)resumed.setPresence(id,true);const step=resumed.advance();assert.equal(step.commands.length,0);assert.equal(step.tick,checkpoint.tick+1);
 assert.equal(resumed.receive('b',{version:1,seq:2,command:{type:'move',x:640,y:400}}).status,'queued');
 assert.throws(()=>restorePartyHost(checkpoint,{hostId:'a',playerIds:['a','x'],mode,teams}),/locked party/);assert.throws(()=>restorePartyHost(checkpoint,{hostId:'a',playerIds:roster,mode:mode==='versus'?'coop':'versus',teams}),/locked party|teams/);
 if(teams)assert.throws(()=>restorePartyHost(checkpoint,{hostId:'a',playerIds:roster,mode,teams:[['a','c'],['b','d']]}),/teams/);
});
