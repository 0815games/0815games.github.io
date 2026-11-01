import {strict as assert} from 'node:assert';
import {createPlayer,applyCommand,getSupplies} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPartyHost} from '../party-host.mjs';
const profile={name:'Soldier',gender:'female',level:1};
const state=createMatch([createPlayer('host',profile),createPlayer('guest',profile)]);
assert.equal(getSupplies(state,'host'),125);assert.equal(getSupplies(state,'guest'),125);
assert.equal(applyCommand(state,'host',{type:'build',pad:0,towerType:0}).ok,true);
assert.equal(getSupplies(state,'host'),75);assert.equal(getSupplies(state,'guest'),125);
assert.equal(applyCommand(state,'guest',{type:'build',pad:1,towerType:1}).ok,true);
assert.equal(getSupplies(state,'guest'),45);assert.equal(getSupplies(state,'host'),75);
assert.equal(applyCommand(state,'guest',{type:'upgrade',pad:0}).ok,false,'not enough personal money');
assert.equal(applyCommand(state,'host',{type:'upgrade',pad:0}).ok,true);
assert.equal(getSupplies(state,'host'),5);assert.equal(getSupplies(state,'guest'),45);
// Players may sell a teammate's tower to free a pad, but the builder gets the refund.
const sale=applyCommand(state,'guest',{type:'sell',pad:0});assert.equal(sale.refund,60);assert.equal(sale.refundTo,'host');
assert.equal(getSupplies(state,'host'),65);assert.equal(getSupplies(state,'guest'),45);
// Live team rewards are duplicated to each active participant, not split.
state.wave=1;state.running=true;state.spawnLeft=1;state.spawnTimer=100;
state.enemies=[{hp:0,reward:12,speed:0,segment:1,x:10,y:130,damage:1}];stepMatch(state);
assert.equal(getSupplies(state,'host'),77);assert.equal(getSupplies(state,'guest'),57);
state.players.guest.active=false;state.enemies=[{hp:0,reward:8,speed:0,segment:1,x:10,y:130,damage:1}];stepMatch(state);
assert.equal(getSupplies(state,'host'),85);assert.equal(getSupplies(state,'guest'),57,'absent player does not earn');
state.players.guest.active=true;state.spawnLeft=0;state.enemies=[];stepMatch(state);
assert.equal(getSupplies(state,'host'),105);assert.equal(getSupplies(state,'guest'),77,'active players get wave bonus');
// The same balances survive disconnect and reconnect within the host session.
const host=createPartyHost(state,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);
assert.equal(host.snapshotFor('guest').match.players.guest.money,77);
host.setPresence('guest',false);host.advance();host.setPresence('guest',true);
assert.equal(host.snapshotFor('guest').match.players.guest.money,77);
// Solo keeps the existing starting balance, rewards and sales behavior.
const solo=createMatch([createPlayer('local',profile)]);assert.equal(getSupplies(solo,'local'),125);
assert.ok(applyCommand(solo,'local',{type:'build',pad:0,towerType:0}).ok);assert.equal(solo.money,75);
assert.equal(applyCommand(solo,'local',{type:'sell',pad:0}).refund,25);assert.equal(solo.money,100);
console.log('Independent co-op supplies, shared rewards and reconnect tests passed.');
