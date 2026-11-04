import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch,STEP} from '../simulation.mjs';
import {createFourCoop,createTwoVsTwo,applyFourCommand,setFourPresence} from '../four-modes.mjs';
import {createPartyHost} from '../party-host.mjs';
import {BUILD_RESERVATION_SECONDS} from '../build-reservations.mjs';
const players=['alice','bob','cara','dan'].map(name=>createPlayer(name,{name,gender:'female'}));
const command=(type,pad,extra={})=>({type,pad,...extra});
test('first reservation wins; owner only releases and builds, failures preserve reservation',()=>{
 const s=createMatch(players.slice(0,2));
 assert.equal(applyCommand(s,'alice',command('reserveBuild',0)).ok,true);
 assert.equal(applyCommand(s,'bob',command('reserveBuild',0)).ok,false);
 assert.equal(applyCommand(s,'bob',command('releaseBuild',0)).ok,true);
 assert.equal(applyCommand(s,'bob',command('build',0,{towerType:0})).ok,false);
 s.players.alice.money=0;assert.equal(applyCommand(s,'alice',command('build',0,{towerType:0})).ok,false);
 assert.equal(s.buildReservations[0].playerId,'alice');s.players.alice.money=100;
 assert.equal(applyCommand(s,'alice',command('build',0,{towerType:0})).ok,true);assert.equal(s.buildReservations[0],undefined);
 assert.equal(applyCommand(s,'bob',command('reserveBuild',0)).ok,false);
});
test('reservation is bounded, renewable and switches pads atomically',()=>{
 const s=createMatch(players.slice(0,2));applyCommand(s,'alice',command('reserveBuild',0));for(let i=0;i<90;i++)stepMatch(s);assert.ok(s.buildReservations[0].remaining<BUILD_RESERVATION_SECONDS);
 applyCommand(s,'alice',command('reserveBuild',0));assert.equal(s.buildReservations[0].remaining,BUILD_RESERVATION_SECONDS);
 applyCommand(s,'bob',command('reserveBuild',1));assert.equal(applyCommand(s,'alice',command('reserveBuild',1)).ok,false);assert.ok(s.buildReservations[0]);
 applyCommand(s,'alice',command('reserveBuild',2));assert.equal(s.buildReservations[0],undefined);assert.ok(s.buildReservations[2]);
 for(let i=0;i<Math.ceil(BUILD_RESERVATION_SECONDS/STEP)+2;i++)stepMatch(s);assert.equal(Object.keys(s.buildReservations).length,0);
});
test('four-player shared pads and isolated two-versus-two fields respect ownership and presence',()=>{
 const s=createFourCoop(players,'alice');assert.ok(applyFourCommand(s,'alice',command('reserveBuild',0)).ok);assert.equal(applyFourCommand(s,'bob',command('build',0,{towerType:0})).ok,false);setFourPresence(s,'alice',false);assert.equal(s.match.buildReservations[0],undefined);
 const v=createTwoVsTwo(players,'alice',[['alice','bob'],['cara','dan']]);assert.ok(applyFourCommand(v,'alice',command('reserveBuild',0)).ok);assert.equal(applyFourCommand(v,'bob',command('reserveBuild',0)).ok,false);assert.ok(applyFourCommand(v,'cara',command('reserveBuild',0)).ok);setFourPresence(v,'cara',false);assert.equal(v.lanes[1].buildReservations[0],undefined);assert.ok(v.lanes[0].buildReservations[0]);
});
test('host protocol processes simultaneous reservation commands serially and disconnect clears ownership',()=>{
 const match=createMatch(players.slice(0,2));const h=createPartyHost(match,{hostId:'alice'});h.setPresence('alice',true);h.setPresence('bob',true);for(const id of ['alice','bob'])assert.equal(h.receive(id,{version:1,seq:1,command:command('reserveBuild',0)}).status,'queued');const result=h.advance();assert.deepEqual(result.commands.map(x=>x.result.ok),[true,false]);h.setPresence('alice',false);assert.equal(h.checkpoint().match.buildReservations[0],undefined);
});
