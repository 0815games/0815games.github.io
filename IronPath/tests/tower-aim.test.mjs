import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createTowerAim} from '../core/tower-aim.mjs';

// The aim tracker is presentation only: it reads towers, pads, enemies and
// shots and answers {angle, recoil} per pad. These tests pin the contract
// the painter relies on - the head tracks the simulation's own target (the
// most advanced living enemy in range), it sweeps at a bounded traverse
// rate instead of teleporting, recoil lands on the shot that just left, and
// reduced motion or a pause never leaves a turret mid-swing.

const pads=[{x:100,y:100},{x:300,y:100}];
const getRange=()=>150;
const field=(over={})=>({towers:[{pad:0,type:0}],pads,enemies:[],shots:[],getRange,...over});

test('aim acquires the most advanced living enemy in range, like the simulation',()=>{
  const aim=createTowerAim();
  const enemies=[
    {x:240,y:100,hp:10,segment:3},   // in range, less advanced
    {x:100,y:230,hp:10,segment:7},   // in range, most advanced
    {x:100,y:500,hp:10,segment:9},   // most advanced but out of range
    {x:200,y:100,hp:0,segment:12},   // dead
  ];
  const aims=aim.sample(field({enemies}),0);
  assert.ok(Math.abs(aims[0].angle-Math.PI/2)<1e-9,'points down at the segment-7 enemy below');
  assert.equal(aims[0].recoil,0);
});

test('the traverse is rate-limited and takes the shortest arc',()=>{
  const aim=createTowerAim({turnRate:Math.PI}); // 180 degrees per second
  const left={x:0,y:100,hp:10,segment:5},right={x:200,y:100,hp:10,segment:5};
  let aims=aim.sample(field({enemies:[right]}),0);
  assert.ok(Math.abs(aims[0].angle-0)<1e-9,'first sight snaps onto the target');
  aims=aim.sample(field({enemies:[left]}),.25);
  assert.ok(Math.abs(Math.abs(aims[0].angle)-Math.PI/4)<1e-9,'a quarter second of traverse covers 45 degrees, no teleport');
  for(const t of [.5,.75,1])aims=aim.sample(field({enemies:[left]}),t);
  assert.ok(Math.abs(Math.abs(aims[0].angle)-Math.PI)<1e-9,'the swing completes on the far side');
});

test('recoil fires on a new shot from the pad and decays; first sight only arms',()=>{
  const aim=createTowerAim({recoilSeconds:.2});
  const enemy={x:200,y:100,hp:10,segment:5};
  aim.sample(field({enemies:[enemy],shots:[{x:100,y:100,tx:200,ty:100,kind:0,id:7}]}),0);
  let aims=aim.sample(field({enemies:[enemy],shots:[{x:100,y:100,tx:200,ty:100,kind:0,id:7}]}),.05);
  assert.equal(aims[0].recoil,0,'a shot already in flight when first seen kicks nothing');
  aims=aim.sample(field({enemies:[enemy],shots:[{x:100,y:100,tx:200,ty:100,kind:0,id:8}]}),.1);
  assert.equal(aims[0].recoil,1,'a newer shot id is the barrel leaving');
  aims=aim.sample(field({enemies:[enemy],shots:[]}),.2);
  assert.ok(Math.abs(aims[0].recoil-.5)<1e-9,'recoil decays linearly');
  aims=aim.sample(field({enemies:[enemy],shots:[]}),.35);
  assert.equal(aims[0].recoil,0,'and is gone after its window');
});

test('other weapons, hero shots and foreign pads never kick this turret',()=>{
  const aim=createTowerAim();
  const enemy={x:200,y:100,hp:10,segment:5};
  aim.sample(field({enemies:[enemy]}),0);
  const aims=aim.sample(field({enemies:[enemy],shots:[
    {x:100,y:100,tx:200,ty:100,kind:1,id:3},
    {x:100,y:100,tx:200,ty:100,kind:'hero',id:4},
    {x:300,y:100,tx:200,ty:100,kind:0,id:5},
  ]}),.1);
  assert.equal(aims[0].recoil,0);
});

test('reduced motion snaps the angle and never recoils; pause freezes the swing',()=>{
  const aim=createTowerAim({turnRate:.1});
  const right={x:200,y:100,hp:10,segment:5},left={x:0,y:100,hp:10,segment:5};
  aim.sample(field({enemies:[right]}),0);
  let aims=aim.sample(field({enemies:[left],shots:[{x:100,y:100,tx:0,ty:100,kind:0,id:1}]}),.1,{reducedMotion:true});
  assert.ok(Math.abs(Math.abs(aims[0].angle)-Math.PI)<1e-9,'reduced motion goes straight to the target');
  assert.equal(aims[0].recoil,0,'and the barrel stays quiet');
  aims=aim.sample(field({enemies:[right]}),.2,{paused:true});
  assert.ok(Math.abs(Math.abs(aims[0].angle)-Math.PI)<1e-9,'a paused frame does not swing');
});

test('a downed or repairing tower holds its heading and does not hunt',()=>{
  const aim=createTowerAim();
  const right={x:200,y:100,hp:10,segment:5},below={x:100,y:230,hp:10,segment:9};
  aim.sample(field({enemies:[right]}),0);
  let aims=aim.sample(field({towers:[{pad:0,type:0,hp:0}],enemies:[below]}),.5);
  assert.ok(Math.abs(aims[0].angle-0)<1e-9,'hp 0 keeps the last heading');
  aims=aim.sample(field({towers:[{pad:0,type:0,repairing:2}],enemies:[below]}),.6);
  assert.ok(Math.abs(aims[0].angle-0)<1e-9,'repairing keeps the last heading');
});

test('no target keeps the last heading, unknown pads are pruned, reset clears',()=>{
  const aim=createTowerAim();
  const right={x:200,y:100,hp:10,segment:5};
  aim.sample(field({enemies:[right]}),0);
  let aims=aim.sample(field({enemies:[]}),1);
  assert.ok(Math.abs(aims[0].angle-0)<1e-9,'an empty field leaves the turret where it was');
  aims=aim.sample(field({towers:[],enemies:[right]}),1.1);
  assert.deepEqual(aims,{},'a removed tower leaves no aim behind');
  aim.sample(field({enemies:[right]}),1.2);
  aim.reset();
  aims=aim.sample(field({enemies:[{x:100,y:230,hp:10,segment:5}]}),1.3);
  assert.ok(Math.abs(aims[0].angle-Math.PI/2)<1e-9,'after reset the next sight snaps like the first');
});
