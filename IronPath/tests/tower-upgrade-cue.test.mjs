import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {upgradeCue,towerUpgradeCues} from '../tower-upgrade-cue.mjs';

// The field shimmer's decision: mark a tower only when its next step is BOTH
// unlocked and paid for. Two ways to lie to the soldier, and both are covered:
// a ring he cannot afford (the menu then refuses him), and a ring on a
// specialization his soldier has not reached yet.
const tower=(level,extra={})=>({id:1,pad:0,type:0,level,...extra});

test('a tower whose next step is affordable reports what it costs',()=>{
  assert.deepEqual(upgradeCue(tower(1),{supplies:70,level:1}),{cost:70});
  assert.equal(upgradeCue(tower(1),{supplies:69,level:1}),null,'one supply short is not an invitation');
  assert.deepEqual(upgradeCue(tower(3),{supplies:180,level:1}),{cost:180});
});

test('level two asks whether any specialization is open to this soldier',()=>{
  // The first two branches are open from the first tower, so the step counts.
  assert.deepEqual(upgradeCue(tower(2),{supplies:120,level:1}),{cost:120});
  // Without a soldier level nothing is proven: no mark, rather than a guess.
  assert.equal(upgradeCue(tower(2),{supplies:120,level:undefined}),null);
  assert.equal(upgradeCue(tower(2),{supplies:120}),null);
});

test('the shimmer follows the price the menu actually charges',()=>{
  // A Veteran Kit tower at rank III upgrades 15% cheaper - the ring must not
  // appear at the undiscounted price, or it promises a purchase that fails.
  const veteran=tower(5,{branch:2});
  assert.equal(upgradeCue(veteran,{supplies:305,level:1}),null);
  assert.deepEqual(upgradeCue(veteran,{supplies:306,level:1}),{cost:306});
});

test('a tower that cannot answer stays unmarked',()=>{
  for(const value of [null,undefined,{},{level:0},{level:-1},{level:1.5},{level:'2'}])
    assert.equal(upgradeCue(value,{supplies:9999,level:20}),null,JSON.stringify(value));
  for(const supplies of [undefined,null,'70',NaN,Infinity])
    assert.equal(upgradeCue(tower(1),{supplies,level:1}),null,String(supplies));
});

test('the field gets pad positions, one per tower that can be improved now',()=>{
  const pads=[{x:100,y:200},{x:300,y:400},{x:500,y:600}];
  const state={towers:[tower(1,{pad:0}),tower(1,{pad:1})]};
  assert.deepEqual(towerUpgradeCues(state,{supplies:70,level:1,pads}),[{x:100,y:200},{x:300,y:400}]);
  // The tower whose menu is open is not marked: that menu states the price.
  assert.deepEqual(towerUpgradeCues(state,{supplies:70,level:1,pads,skipPad:0}),[{x:300,y:400}]);
  assert.deepEqual(towerUpgradeCues(state,{supplies:69,level:1,pads}),[],'nobody can afford it, nobody shimmers');
});

test('towers without a pad on this map are ignored, and a broken field is empty',()=>{
  const pads=[{x:10,y:10}];
  assert.deepEqual(towerUpgradeCues({towers:[tower(1,{pad:7})]},{supplies:999,level:1,pads}),[]);
  assert.deepEqual(towerUpgradeCues({towers:[tower(1,{pad:0})]},{supplies:999,level:1,pads:[null]}),[]);
  for(const state of [null,undefined,{},{towers:null},[]])
    assert.deepEqual(towerUpgradeCues(state,{supplies:999,level:1,pads}),[],JSON.stringify(state));
  assert.deepEqual(towerUpgradeCues({towers:[tower(1,{pad:0})]},{supplies:999,level:1}),[]);
});

test('a finished operation invites nothing',()=>{
  const pads=[{x:100,y:200}];
  assert.deepEqual(towerUpgradeCues({towers:[tower(1)],ended:true},{supplies:9999,level:1,pads}),[]);
  assert.deepEqual(towerUpgradeCues({towers:[tower(1)],ended:false},{supplies:9999,level:1,pads}),[{x:100,y:200}]);
});
