import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createBattleViewportController} from '../battle-viewport-controller.mjs';
function setup(){
  const listeners=new Map(),canvas={width:960,height:540,style:{touchAction:'pan-y'},addEventListener(t,f){listeners.set(t,f);},removeEventListener(t){listeners.delete(t);},getBoundingClientRect(){return {left:10,top:20,width:480,height:270};},setPointerCapture(){}};
  const taps=[],changes=[];const controller=createBattleViewportController({canvas,worldWidth:1440,worldHeight:720,onTap:p=>taps.push(p),onChange:v=>changes.push(v)});
  const send=(type,id,x,y,extra={})=>listeners.get(type)?.({pointerId:id,clientX:x,clientY:y,pointerType:'touch',button:0,preventDefault(){},...extra});
  return {canvas,controller,taps,changes,send,listeners};
}
test('tap maps CSS pixels to world; drag and cancellation never tap',()=>{
  const s=setup();s.send('pointerdown',1,250,155);s.send('pointerup',1,250,155);assert.deepEqual(s.taps,[{x:720,y:360}]);
  s.send('pointerdown',1,250,155);s.send('pointermove',1,270,155);s.send('pointerup',1,270,155);s.send('pointerdown',1,250,155);s.send('pointercancel',1,250,155);assert.equal(s.taps.length,1);
  s.send('pointerdown',1,250,21);s.send('pointerup',1,250,21);assert.equal(s.taps.length,1,'letterbox does not create a world tap');
});
test('pinch zooms, pans and never triggers a tap when fingers lift',()=>{
  const s=setup();s.send('pointerdown',1,200,155);s.send('pointerdown',2,300,155);s.send('pointermove',2,350,155);assert.ok(s.controller.getViewport().scale>2/3);s.send('pointerup',2,350,155);s.send('pointerup',1,200,155);assert.equal(s.taps.length,0);
  const old=s.controller.getViewport();s.send('pointerdown',3,250,155);s.send('pointermove',3,280,155);s.send('pointerup',3,280,155);assert.notEqual(s.controller.getViewport().x,old.x);
  s.controller.reset();assert.equal(s.controller.getViewport().scale,2/3);assert.ok(s.changes.length>=3);
});
test('wheel zoom and destroy restore canvas behavior',()=>{
  const s=setup();let prevented=false;s.send('wheel',0,250,155,{deltaY:-200,preventDefault(){prevented=true;}});assert.ok(prevented);assert.ok(s.controller.getViewport().scale>2/3);
  s.controller.destroy();s.controller.destroy();assert.equal(s.canvas.style.touchAction,'pan-y');assert.equal(s.listeners.size,0);
});

test('resized controller uses the new logical height for touch mapping',()=>{
  const s=setup();s.controller.resize(960,1080);
  const view=s.controller.getViewport(),target={x:720,y:360};
  const x=10+(target.x-view.x)*view.scale*480/view.width;
  const y=20+(target.y-view.y)*view.scale*270/view.height;
  s.send('pointerdown',1,x,y);s.send('pointerup',1,x,y);
  assert.equal(s.taps.length,1);assert.ok(Math.abs(s.taps[0].x-target.x)<1e-8);assert.ok(Math.abs(s.taps[0].y-target.y)<1e-8);
  s.controller.destroy();
});
