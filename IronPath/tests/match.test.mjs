import { strict as assert } from 'node:assert';
import { createPlayer, applyCommand, towerRefund, TOWER_COSTS } from '../match.mjs';
const state={ended:false, money:300, towers:[], enemies:[{hp:100}], players:{
  alice:createPlayer('alice',{name:'Alice',gender:'female'}),
  bob:createPlayer('bob',{name:'Bob',gender:'male'},100,100)
}};
const cmd=(id, action)=>applyCommand(state,id,action);
assert.equal(cmd('eve',{type:'build',pad:0,towerType:0}).ok,false);
assert.equal(cmd('alice',{type:'move',x:100,y:150}).ok,true);
assert.deepEqual(state.players.alice.target,{x:100,y:150});
assert.equal(state.players.bob.target,null);
assert.equal(cmd('bob',{type:'move',x:Infinity,y:2}).ok,false);
assert.equal(cmd('alice',{type:'build',pad:1,towerType:0}).ok,true);
assert.equal(state.money,300-TOWER_COSTS[0]);
assert.equal(state.towers[0].ownerId,'alice');
const towerId=state.towers[0].id;
assert.equal(cmd('bob',{type:'sell',pad:1,expectedTowerId:towerId+1,expectedLevel:1}).ok,false);
assert.equal(cmd('bob',{type:'upgrade',pad:1,expectedTowerId:towerId,expectedLevel:2}).ok,false);
assert.equal(cmd('bob',{type:'build',pad:1,towerType:1}).ok,false);
assert.equal(state.money,250);
assert.equal(cmd('bob',{type:'upgrade',pad:1}).ok,true); // shared towers
assert.equal(state.towers[0].level,2);
const balance=state.money;
assert.equal(cmd('alice',{type:'upgrade',pad:1,branch:99}).ok,false);
assert.equal(state.money,balance);
assert.equal(cmd('bob',{type:'upgrade',pad:1,branch:1}).ok,true);
assert.equal(state.towers[0].branch,1);
assert.equal(cmd('bob',{type:'upgrade',pad:1}).ok,false); // insufficient funds
assert.equal(cmd('alice',{type:'airstrike'}).ok,true);
assert.equal(state.enemies[0].hp,65);
assert.equal(state.players.bob.cooldown,0);
assert.equal(cmd('alice',{type:'airstrike'}).ok,false);
assert.equal(cmd('bob',{type:'airstrike'}).ok,true);
assert.equal(state.enemies[0].hp,30);
assert.equal(towerRefund(state.towers[0]),120); // 50 + 70 + 120, half refunded
const beforeSell=state.money;
assert.equal(cmd('bob',{type:'sell',pad:1}).refund,120);
assert.equal(state.money,beforeSell+120);
assert.equal(cmd('alice',{type:'sell',pad:1}).ok,false);
assert.equal(state.money,beforeSell+120);
assert.equal(cmd('bob',{type:'sell',pad:-1}).ok,false);
assert.equal(cmd('alice',{type:'build',pad:1,towerType:0}).ok,true);
state.ended=true;
assert.equal(cmd('bob',{type:'sell',pad:1}).ok,false);
assert.equal(cmd('bob',{type:'airstrike'}).ok,false);
assert.equal(cmd('alice',{type:'move',x:200,y:200}).ok,false);
assert.equal(state.enemies[0].hp,30);
console.log('Two-player shared command tests passed.');
