import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createBattleViewport,panBattleViewport,zoomBattleViewport,battleScreenToWorld,battleClientToScreen} from '../battle-viewport.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('large battlefield fits and CSS-scaled taps map to world coordinates',()=>{
  const v=createBattleViewport(1440,720,960,540);
  near(v.scale,2/3);near(v.x,0);near(v.y,-45);
  const screen=battleClientToScreen({x:370,y:235},{left:10,top:100,width:480,height:270},960,540);
  const world=battleScreenToWorld(v,screen);near(world.x,1080);near(world.y,360);
});
test('zoom keeps its anchor fixed and pan clamps to map edges',()=>{
  const initial=createBattleViewport(1440,720,960,540),anchor={x:480,y:270};
  const world=battleScreenToWorld(initial,anchor),zoomed=zoomBattleViewport(initial,2,anchor),after=battleScreenToWorld(zoomed,anchor);
  near(world.x,after.x);near(world.y,after.y);
  const left=panBattleViewport(zoomed,100000,100000),right=panBattleViewport(zoomed,-100000,-100000);
  near(left.x,0);near(left.y,0);near(right.x,1440-960/zoomed.scale);near(right.y,720-540/zoomed.scale);
  near(zoomBattleViewport(zoomed,100,anchor).scale,initial.scale*3);
  near(zoomBattleViewport(zoomed,.001,anchor).scale,initial.scale);
});
test('invalid or zero geometry is rejected without creating NaNs',()=>{
  assert.throws(()=>createBattleViewport(0,720,960,540));
  assert.throws(()=>battleClientToScreen({x:0,y:0},{left:0,top:0,width:0,height:5},960,540));
  const v=createBattleViewport(1440,720,960,540);
  assert.throws(()=>zoomBattleViewport(v,NaN,{x:0,y:0}));
  assert.throws(()=>panBattleViewport(v,Infinity,0));
});
