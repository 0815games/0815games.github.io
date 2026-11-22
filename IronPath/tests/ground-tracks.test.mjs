import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createGroundTracks} from '../core/ground-tracks.mjs';
import {drawGroundTracks} from '../core/cartoon-art.mjs';

// Ground tracks: fading boot prints, tank cleats and rail wheel marks behind
// moving units. Re-landed from #335, which shipped the recorder without a
// single test of its own - so the two claims in its header comment ("never
// mutates simulation state" and "marks fade") were asserted in prose only.
// They are measured here instead.
//
// The recorder also had two wiring defects that are pinned from the game side
// in this file's last test: one shared recorder for both battlefields made each
// view delete the other's trackers every frame (no marks at all in versus
// play), and only one of the two reset sites cleared it.

const STRIDE=13;           // soldier and infantry
const SCOUT_STRIDE=14;
const TANK_STRIDE=9.5;
const RAIL_STRIDE=12;
const TELEPORT=70;         // further than this in one sample = a jump, not a step
const MAX_STEPS=4;         // at most four marks per sample, whatever the distance

function playerState(x,y,id='local'){
  return {players:{[id]:{id,x,y,active:true}},enemies:[]};
}
function enemyState(list){
  return {players:{},enemies:list};
}
function enemy(x,y,extra={}){
  return {x,y,hp:10,kind:'soldier',...extra};
}
// `sample` hands back every mark that is still alive - that is what the painter
// needs, one call per frame. These tests are about what a single sample ADDS,
// so they count the marks born at that sample's own timestamp instead of the
// length of the list, which would silently include the previous strides.
function added(tracks,state,t,opts){
  return tracks.sample(state,t,opts).filter(m=>m.bornAt>=t-1e-9);
}

test('the recorder never touches the state it is given',()=>{
  // Its own header promises this; a freeze makes the promise load-bearing.
  const tracks=createGroundTracks();
  const state=enemyState([enemy(100,100,{boss:'bossHeavy'}),enemy(200,200,{kind:'tank'})]);
  state.players={local:{id:'local',x:10,y:10,active:true}};
  const before=JSON.stringify(state);
  Object.freeze(state);Object.freeze(state.players);Object.freeze(state.players.local);
  Object.freeze(state.enemies);for(const e of state.enemies)Object.freeze(e);
  assert.doesNotThrow(()=>{
    tracks.sample(state,0);
    tracks.sample({...state,players:{local:{id:'local',x:40,y:10,active:true}},enemies:state.enemies},1/60);
  },'sampling a frozen state must not write to it');
  assert.equal(JSON.stringify(state),before,'the state is byte-identical afterwards');
  // And the returned marks are copies: mutating one cannot reach the recorder.
  const marks=tracks.sample(state,2/60);
  assert.ok(Array.isArray(marks));
  if(marks.length){marks[0].x=1e6;marks[0].kind='tampered';}
  const again=tracks.sample(state,3/60);
  assert.ok(again.every(m=>m.x<1e5&&m.kind!=='tampered'),'handed-out marks are copies, not internals');
});

test('a soldier leaves one boot print per stride, and carries the remainder',()=>{
  const tracks=createGroundTracks();
  assert.deepEqual(added(tracks,playerState(0,0),0),[],'the first sighting only takes a bearing');
  assert.equal(added(tracks,playerState(STRIDE,0),1/60).length,1,'exactly one stride, exactly one print');
  assert.equal(added(tracks,playerState(STRIDE+5,0),2/60).length,0,'five pixels short of the next print: none yet');
  assert.equal(added(tracks,playerState(STRIDE+5+8,0),3/60).length,1,'the carried remainder completes the stride');
  // Prints alternate left and right of the line of travel.
  const t2=createGroundTracks();
  added(t2,playerState(0,0),0);
  const marks=[];
  for(let i=1;i<=4;i++)marks.push(...added(t2,playerState(i*STRIDE,0),i/60));
  assert.equal(marks.length,4,'four strides, four prints');
  assert.deepEqual(marks.map(m=>m.side),[1,-1,1,-1],'alternating feet');
  assert.ok(marks.every(m=>m.kind==='boot'),'a player walks');
  assert.ok(marks.every(m=>Math.abs(m.angle)<1e-9),'heading east, so no rotation');
  assert.ok(marks.every(m=>Math.abs(Math.abs(m.y)-3.2)<1e-9),'each print sits 3.2 px off the track line');
});

test('each unit kind keeps its own stride',()=>{
  const cases=[['soldier',STRIDE,'boot'],['runner',SCOUT_STRIDE,'boot'],['scout',SCOUT_STRIDE,'boot'],
    ['tank',TANK_STRIDE,'tread']];
  for(const [kind,stride,expected] of cases){
    const tracks=createGroundTracks();
    const walker=enemy(0,0,{kind});
    added(tracks,enemyState([walker]),0);
    walker.x=stride-.5;
    assert.equal(added(tracks,enemyState([walker]),1/60).length,0,
      `${kind}: just under one stride leaves nothing`);
    walker.x=2*stride;
    const marks=added(tracks,enemyState([walker]),2/60);
    assert.equal(marks.length,2,`${kind}: two strides leave two marks`);
    assert.equal(marks[0].kind,expected,`${kind} is recorded as ${expected}`);
  }
});

test('a boss is heavier, and a bomber leaves nothing at all',()=>{
  const tracks=createGroundTracks();
  const boss=enemy(0,0,{boss:'bossHeavy'});
  added(tracks,enemyState([boss]),0);
  boss.x=TANK_STRIDE;
  const marks=added(tracks,enemyState([boss]),1/60);
  assert.equal(marks.length,1,'a boss drives on tracks');
  assert.equal(marks[0].kind,'tread');
  assert.ok(marks[0].scale>1,`and its marks are bigger than a tank's (${marks[0].scale})`);

  const air=createGroundTracks();
  const plane=enemy(0,0,{kind:'plane'}),bomber=enemy(50,50,{boss:'bossBomber'});
  added(air,enemyState([plane,bomber]),0);
  plane.x=30;bomber.x=80;
  assert.deepEqual(added(air,enemyState([plane,bomber]),1/60),[],'nothing that flies touches the ground');
});

test('on rails, light units leave wheel wear instead of boot prints',()=>{
  const road=createGroundTracks();
  const walker=enemy(0,0);
  added(road,enemyState([walker]),0,{theme:'road'});
  walker.x=STRIDE;
  assert.equal(added(road,enemyState([walker]),1/60,{theme:'road'})[0].kind,'boot','on a road a soldier walks');

  const rail=createGroundTracks();
  const rider=enemy(0,0);
  added(rail,enemyState([rider]),0,{theme:'junction'});
  rider.x=RAIL_STRIDE;
  const marks=added(rail,enemyState([rider]),1/60,{theme:'junction'});
  assert.equal(marks.length,1,'one stride on rails, one mark');
  assert.equal(marks[0].kind,'rail','a junction records rail wear');
  // Heavy units stay heavy whatever the ground under them.
  const tank=enemy(300,0,{kind:'tank'});
  added(rail,enemyState([rider,tank]),2/60,{theme:'junction'});
  tank.x=300+TANK_STRIDE;
  const heavy=added(rail,enemyState([rider,tank]),3/60,{theme:'junction'});
  assert.equal(heavy.length,1,'only the tank moved, so only the tank marks');
  assert.equal(heavy[0].kind,'tread','a tank on rails still leaves tread marks');
});

test('a jump leaves no smear, and a fast frame leaves at most four marks',()=>{
  const tracks=createGroundTracks();
  added(tracks,playerState(0,0),0);
  assert.equal(added(tracks,playerState(TELEPORT+1,0),1/60).length,0,
    'more than 70 px in one sample is a teleport, not a walk');
  // The tracker re-based itself, so the next real stride counts from there.
  assert.equal(added(tracks,playerState(TELEPORT+1+STRIDE,0),2/60).length,1,'and walking resumes cleanly');

  const fast=createGroundTracks();
  const runner=enemy(0,0);
  added(fast,enemyState([runner]),0);
  runner.x=65;                            // still under the teleport distance
  const marks=added(fast,enemyState([runner]),1/60);
  assert.equal(Math.floor(65/STRIDE),5,'65 px would be five strides');
  assert.equal(marks.length,MAX_STEPS,'but one sample caps at four marks, so a lag spike cannot dump a line of them');
});

test('marks fade over their lifetime and are then dropped',()=>{
  const tracks=createGroundTracks();
  tracks.sample(playerState(0,0),0);
  const made=tracks.sample(playerState(STRIDE,0),1);
  assert.equal(made.length,1);
  const lifetime=made[0].lifetime;
  assert.ok(lifetime>0,'every mark has a lifetime');
  assert.ok(Math.abs(made[0].alpha-1)<1e-9,'fresh marks are fully opaque');
  const half=tracks.sample(playerState(STRIDE,0),1+lifetime/2);
  assert.ok(Math.abs(half[0].alpha-.5)<1e-9,`halfway through it is at half alpha (${half[0].alpha})`);
  const gone=tracks.sample(playerState(STRIDE,0),1+lifetime+1);
  assert.equal(gone.length,0,'and afterwards it is gone, not merely transparent');
});

test('the mark list is capped, so a long match cannot grow without bound',()=>{
  const tracks=createGroundTracks({maxMarks:40});
  for(let i=0;i<400;i++)tracks.sample(playerState(i*STRIDE,0),i/60);
  const marks=tracks.sample(playerState(400*STRIDE,0),400/60);
  assert.ok(marks.length<=40,`capped at 40, got ${marks.length}`);
  // The newest survive, not the oldest: the cap drops from the front.
  assert.ok(marks[marks.length-1].x>marks[0].x,'the tail of the list is the recent end');
  const tiny=createGroundTracks({maxMarks:1});
  for(let i=0;i<50;i++)tiny.sample(playerState(i*STRIDE,0),i/60);
  assert.ok(tiny.sample(playerState(60*STRIDE,0),60/60).length>=20,'an absurd cap is floored, not honoured');
});

test('pausing ages nothing, and a clock running backwards starts over',()=>{
  const tracks=createGroundTracks();
  tracks.sample(playerState(0,0),10);
  const made=tracks.sample(playerState(STRIDE,0),11);
  assert.equal(made.length,1);
  const paused=tracks.sample(playerState(STRIDE,0),14,{paused:true});
  assert.equal(paused.length,1,'a paused field keeps its marks');
  assert.ok(Math.abs(paused[0].alpha-made[0].alpha)<1e-9,
    `and does not let them fade while paused (${made[0].alpha} -> ${paused[0].alpha})`);
  // Resuming must not dump three seconds of footsteps at once.
  const resumed=tracks.sample(playerState(STRIDE,0),14.1);
  assert.equal(resumed.length,1,'resuming adds nothing for a unit that did not move');

  const back=createGroundTracks();
  back.sample(playerState(0,0),100);
  back.sample(playerState(STRIDE,0),101);
  assert.deepEqual(back.sample(playerState(STRIDE,0),50),[],'a clock that jumps back clears the recorder');
});

test('reset clears the field between battles',()=>{
  const tracks=createGroundTracks();
  tracks.sample(playerState(0,0),0);
  assert.equal(tracks.sample(playerState(STRIDE,0),1/60).length,1);
  tracks.reset();
  assert.deepEqual(tracks.sample(playerState(STRIDE,0),2/60),[],'after a reset the first sighting takes a bearing again');
  assert.equal(tracks.sample(playerState(STRIDE+STRIDE,0),3/60).length,1,'and walking resumes');
});

test('a unit that is cloned or replaced keeps its track',()=>{
  // Enemies are re-created as plain objects by the interpolation layer, so the
  // recorder matches a new object to the nearest recent one of the same kind
  // instead of starting a fresh tracker - otherwise every frame would be a
  // "first sighting" and no mark would ever be laid.
  const tracks=createGroundTracks();
  const walker=enemy(0,0);
  added(tracks,enemyState([walker]),0);
  walker.x=STRIDE;
  assert.equal(added(tracks,enemyState([walker]),1/60).length,1,'the same object walks');
  const clone=enemy(2*STRIDE,0);            // a different object, same kind and lane
  assert.equal(added(tracks,enemyState([clone]),2/60).length,1,
    'and so does its replacement one stride on');
  // A unit that appears far away is a newcomer, not a continuation.
  const fresh=createGroundTracks();
  const lone=enemy(0,0);
  added(fresh,enemyState([lone]),0);
  lone.x=STRIDE;
  added(fresh,enemyState([lone]),1/60);
  const jumped=enemy(500,500);
  assert.equal(added(fresh,enemyState([jumped]),2/60).length,0,
    'a replacement 500 px away is treated as new, so no smear crosses the map');
});

test('broken input cannot throw',()=>{
  const tracks=createGroundTracks();
  for(const bad of [null,undefined,42,'state',{},{players:null,enemies:null},
    {players:{a:null,b:{x:NaN,y:1}},enemies:[null,{x:1},{hp:5,x:'a',y:0},{hp:5,x:0,y:0}]}]){
    assert.doesNotThrow(()=>tracks.sample(bad,0),'sample must survive '+JSON.stringify(bad));
    assert.doesNotThrow(()=>tracks.sample(bad,NaN,{paused:true}));
  }
  assert.deepEqual(tracks.sample(null,0),[],'nothing in, nothing out');
});

// --- the painter -----------------------------------------------------------

function recorder(){
  const calls={saves:0,restores:0,rects:[],ellipses:0,alphas:[]};
  const ctx={
    canvas:{ownerDocument:null},fillStyle:null,globalAlpha:1,
    save(){calls.saves++;calls.alphas.push(ctx.globalAlpha);},
    restore(){calls.restores--;},
    translate(){},rotate(){},
    beginPath(){},
    ellipse(){calls.ellipses++;},
    fill(){},
    fillRect(x,y,w,h){calls.rects.push({x,y,w,h});},
    stroke(){}
  };
  return {ctx,calls};
}

test('the painter draws a stamp per mark and balances its context',()=>{
  const {ctx,calls}=recorder();
  const tracks=[
    {x:10,y:10,angle:0,kind:'boot',side:1,scale:.85,alpha:.6},
    {x:30,y:30,angle:.4,kind:'tread',side:1,scale:1,alpha:.4},
    {x:50,y:50,angle:1,kind:'rail',side:-1,scale:1,alpha:.2}
  ];
  drawGroundTracks(ctx,tracks,'road');
  assert.equal(calls.saves+calls.restores,0,'every save is matched by a restore');
  assert.ok(calls.ellipses>=2,'boots and treads are stamped');
  assert.ok(calls.rects.length>=2,'rail wear is stamped');
  assert.ok(calls.alphas.every(a=>a<=1),'nothing paints above full alpha');
});

test('the painter ignores marks it cannot place',()=>{
  const {ctx,calls}=recorder();
  assert.doesNotThrow(()=>drawGroundTracks(ctx,[
    null,undefined,{},{x:NaN,y:1,angle:0,kind:'boot',alpha:1},{x:1,y:1,angle:NaN,kind:'boot',alpha:1},
    {x:1,y:1,angle:0,kind:'boot',alpha:0},{x:1,y:1,angle:0,kind:'boot',alpha:-1}
  ],'road'));
  assert.equal(calls.ellipses,0,'no malformed mark is stamped');
  assert.equal(calls.rects.length,0,'and no invisible one either');
  for(const bad of [null,undefined,'tracks',[],{}])
    assert.doesNotThrow(()=>drawGroundTracks(ctx,bad,'road'),'an empty track list is a no-op');
});

test('every theme has a palette, and an unknown one falls back',()=>{
  for(const theme of ['road','forest','urban','arctic','marsh','scrub','outpost','talwald','junction','nonsense']){
    const {ctx,calls}=recorder();
    assert.doesNotThrow(()=>drawGroundTracks(ctx,[{x:1,y:1,angle:0,kind:'boot',side:1,scale:1,alpha:1}],theme),
      theme+' paints');
    assert.ok(calls.ellipses>0,theme+' stamps something');
  }
});

test('the game keeps one recorder per battlefield and clears both',()=>{
  // Wiring guard for the two defects the first version of this feature had.
  const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');
  assert.equal((game.match(/createGroundTracks\(\)/g)||[]).length,2,
    'two recorders are created: one for the local field, one for the opponent');
  assert.ok(game.includes('rivalGroundTracks.sample(rival,'),
    'the opponent view samples its own recorder');
  assert.equal((game.match(/groundTracks\.reset\(\);rivalGroundTracks\.reset\(\)/g)||[]).length,2,
    'both are cleared at both reset sites, so no track bleeds into the next battle');
  assert.ok(/groundTracks\.sample\(visual,performance\.now\(\)\/1000,\{paused,theme\}\)/.test(game),
    'the local view samples in seconds, with the pause flag and the map theme');
});
