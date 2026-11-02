import {strict as assert} from 'node:assert';
import {createFourLobby,transitionFourLobby as transition} from '../four-lobby.mjs';
const profile=name=>({name,gender:'female',level:1});
let lobby=createFourLobby('alice',profile('Alice'));const original=structuredClone(lobby);
assert.equal(transition(lobby,'bob',{type:'approve',uid:'bob'}),null,'only host approves');
assert.equal(transition(lobby,'alice',{type:'approve',uid:'bad/id'}),null);
assert.equal(transition(lobby,'alice',{type:'start'}),null,'cannot start without four ready profiles');
for(const id of ['bob','cara','dan']){lobby=transition(lobby,'alice',{type:'approve',uid:id});assert.ok(lobby);lobby=transition(lobby,id,{type:'profile',profile:profile(id)});assert.ok(lobby);}
assert.deepEqual(original.slots.slice(1),[null,null,null],'state transitions do not mutate the prior snapshot');
assert.equal(transition(lobby,'alice',{type:'approve',uid:'bob'}),null,'no duplicate accounts');assert.equal(transition(lobby,'alice',{type:'approve',uid:'eve'}),null,'capacity is exactly four');
assert.equal(transition(lobby,'bob',{type:'teams',teams:[0,1,0,1]}),null);assert.equal(transition(lobby,'alice',{type:'teams',teams:[0,0,0,1]}),null,'teams must stay balanced');
lobby=transition(lobby,'alice',{type:'mode',mode:'two-vs-two'});lobby=transition(lobby,'alice',{type:'teams',teams:[0,1,0,1]});assert.deepEqual(lobby.teams,[0,1,0,1]);
assert.equal(transition(lobby,'bob',{type:'profile',profile:{...profile('bob'),level:1,skills:'bad'}}),null);assert.equal(transition(lobby,'eve',{type:'profile',profile:profile('eve')}),null);
const departed=transition(lobby,'cara',{type:'leave'});assert.equal(departed.slots[2],null);assert.equal(transition(departed,'alice',{type:'start'}),null);assert.equal(lobby.slots[2].id,'cara');
const removed=transition(lobby,'alice',{type:'remove',uid:'cara'});assert.equal(removed.slots[2],null);assert.equal(transition(lobby,'bob',{type:'remove',uid:'cara'}),null);
const started=transition(lobby,'alice',{type:'start'});assert.equal(started.started,true);for(const cmd of [{type:'mode',mode:'four-coop'},{type:'approve',uid:'eve'},{type:'remove',uid:'bob'},{type:'teams',teams:[0,0,1,1]},{type:'start'}])assert.equal(transition(started,'alice',cmd),null,'roster, teams and mode lock at start');assert.equal(transition(started,'bob',{type:'leave'}),null,'match departure uses presence/forfeit, not roster replacement');
console.log('Four-player lobby capacity, authorization decisions and immutable roster tests passed.');
