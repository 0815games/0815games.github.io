import {test} from 'node:test';import {strict as assert} from 'node:assert';import {canvasResolution} from '../canvas-resolution.mjs';
test('backing buffer follows CSS size and pixel density with bounded memory',()=>{
 assert.deepEqual(canvasResolution(960,540,{width:1600},1),{width:1600,height:900});
 assert.deepEqual(canvasResolution(960,540,{width:700},2),{width:1400,height:788});
 assert.deepEqual(canvasResolution(960,540,{width:390},2),{width:960,height:540});
 assert.deepEqual(canvasResolution(960,540,{width:10000},4),{width:2880,height:1620});
 const versus=canvasResolution(960,1100,{width:1500},3);assert.ok(versus.width*versus.height<6005000);assert.ok(Math.abs(versus.width/versus.height-960/1100)<.002);
 assert.deepEqual(canvasResolution(960,540,{width:0},undefined),{width:960,height:540});
});
