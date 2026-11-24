import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawCartoonBattle} from '../core/cartoon-art.mjs';
import {createMatch,PATH,PADS,getTowerRange} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';

// IPL-0127 - the field between the frames: muzzle powder, the struck unit,
// driving dust, battle scars, the wave lull, marsh weather and the amethyst
// prestige halo. The machine cannot see any of it, so every pin reads back
// what the brush was told: the colour it asked for, in the situation the
// operator asked for it in.

// A canvas that records every brush setting, not just the calls. A colour is
// a property, not a call - a proxy that only logs calls sees nothing.
function recordingCanvas(){
  const sets=[],calls=[];
  const target={};
  const ctx=new Proxy(target,{
    get(t,key){
      if(key==='createRadialGradient')return (...args)=>{
        assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),'a gradient with real coordinates');
        calls.push(['gradient',...args]);
        const stops=[];
        const g={addColorStop:(offset,color)=>{
          assert.ok(Number.isFinite(offset)&&offset>=0&&offset<=1,'a stop inside the gradient');
          assert.ok(typeof color==='string'&&color.length>0,'a colour the canvas understands');
          stops.push([offset,color]);calls.push(['gradientStop',offset,color]);},get stops(){return stops;}};
        return g;
      };
      if(key in t)return t[key];
      return (...args)=>{
        assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),`${String(key)} got a non-finite number`);
        calls.push([String(key),...args]);
      };
    },
    set(t,key,value){sets.push([String(key),value]);t[key]=value;return true;}});
  return {ctx,sets,calls};
}

const p=createPlayer('a',{name:'Alice',gender:'female'});
const opts={path:PATH,pads:PADS,types:[{color:'#a'},{color:'#b'},{color:'#c'},{color:'#d'}],me:'a',getTowerRange};
const field=()=>createMatch([p]);
const tower=(type,extra={})=>{const m=field();m.towers=[{id:1,type,pad:0,level:1,branch:0,ownerId:'a',hp:100,maxHp:100,...extra}];return m;};
const has=(sets,color)=>sets.some(([k,v])=>k==='fillStyle'&&new RegExp(`^${color}$`,'i').test(v));
const stroked=(sets,color)=>sets.some(([k,v])=>k==='strokeStyle'&&new RegExp(`^${color}$`,'i').test(v));

test('the prestige halo wears amethyst while the upgrade keeps its gold',()=>{
  const lit=recordingCanvas();
  drawCartoonBattle(lit.ctx,tower(0,{level:13}),opts);
  assert.ok(lit.sets.some(([k,v])=>k==='shadowColor'&&/^#b48ce0$/i.test(v)),
    'a prestige tower asks for amethyst light');

  const plain=recordingCanvas();
  drawCartoonBattle(plain.ctx,tower(0,{level:1}),opts);
  assert.ok(!plain.sets.some(([k,v])=>k==='shadowColor'&&/^#b48ce0$/i.test(v)),
    'a plain tower wears no halo at all');

  // The upgrade's own star stays gold - amethyst is the halo's colour, not
  // the cue's. The shimmer itself lives in game.js and keeps #f2d891 there.
  const upgraded=recordingCanvas();
  drawCartoonBattle(upgraded.ctx,tower(0),{...opts,
    effects:[{kind:'upgrade',x:PADS[0].x,y:PADS[0].y,started:0,duration:950,progress:0.1}]});
  assert.ok(upgraded.sets.some(([k,v])=>k==='fillStyle'&&/^#f0d68a$/i.test(v)),
    'the upgrade star keeps its gold');
  assert.ok(!upgraded.sets.some(([k,v])=>k==='shadowColor'&&/^#b48ce0$/i.test(v)),
    'and an upgrade is not prestige - no amethyst halo');
});

test('the muzzle breathes powder smoke with the recoil and stays clean when motion is off',()=>{
  const kick=recordingCanvas();
  drawCartoonBattle(kick.ctx,tower(0),{...opts,towerAims:{0:{angle:.7,recoil:.6}}});
  assert.ok(has(kick.sets,'#8f968b'),'the recoil carries its powder cloud');

  const quiet=recordingCanvas();
  drawCartoonBattle(quiet.ctx,tower(0),{...opts,towerAims:{0:{angle:.7,recoil:0}}});
  assert.ok(!has(quiet.sets,'#8f968b'),'no recoil, no powder - the kick is the only gate');

  // Reduced motion is the tracker's contract here: it answers recoil 0, and
  // the painter draws exactly what it is told - no recoil, no powder.
  const still=recordingCanvas();
  drawCartoonBattle(still.ctx,tower(0),{...opts,towerAims:{0:{angle:.7,recoil:0}},reducedMotion:true});
  assert.ok(!has(still.sets,'#8f968b'),'reduced motion (recoil 0) keeps the muzzle clean');
});

test('the level badge pulses when an upgrade lands on its pad',()=>{
  const pad0=PADS[0];
  const fx={kind:'upgrade',x:pad0.x,y:pad0.y,started:0,duration:950,progress:0.1};
  // An empty pad returns before its level badge - the pulse lives on a
  // built pad, where the number that changed actually sits.
  const hot=recordingCanvas();
  drawCartoonBattle(hot.ctx,tower(0),{...opts,effects:[fx]});
  assert.ok(stroked(hot.sets,'#fff6d8'),'the badge rings on the landing');

  const cold=recordingCanvas();
  drawCartoonBattle(cold.ctx,tower(0),{...opts,effects:[]});
  assert.ok(!stroked(cold.sets,'#fff6d8'),'without an effect the badge is quiet');

  const still=recordingCanvas();
  drawCartoonBattle(still.ctx,tower(0),{...opts,effects:[fx],reducedMotion:true});
  assert.ok(!stroked(still.sets,'#fff6d8'),'reduced motion keeps the badge still');

  const tracersOff=recordingCanvas();
  drawCartoonBattle(tracersOff.ctx,tower(0),{...opts,effects:[fx],combatTracers:false});
  assert.ok(!stroked(tracersOff.sets,'#fff6d8'),'with the tracer switch off the badge is quiet too');
});

test('a repairing tower throws sparks from its work piece',()=>{
  const hot=recordingCanvas();
  drawCartoonBattle(hot.ctx,tower(0,{repairing:800}),opts);
  assert.ok(has(hot.sets,'#ffe9a0'),'the sparks fly');

  const cold=recordingCanvas();
  drawCartoonBattle(cold.ctx,tower(0,{repairing:0}),opts);
  assert.ok(!has(cold.sets,'#ffe9a0'),'no repair, no sparks');

  const still=recordingCanvas();
  drawCartoonBattle(still.ctx,tower(0,{repairing:800}),{...opts,reducedMotion:true});
  assert.ok(!has(still.sets,'#ffe9a0'),'reduced motion keeps the work quiet');
});

test('the struck unit flares up where the tracer lands',()=>{
  const scene=()=>{
    const m=field();
    m.wave=1;m.running=true;
    m.enemies=[{kind:'runner',x:150,y:130,hp:10,maxHp:20}];
    m.shots=[{x:105,y:210,tx:150,ty:130,color:'#f6d787',kind:0,life:.067,duration:.12}];
    return m;
  };
  // Position based: the tracer's impact meets the unit at (150,130). No
  // enemy ids are needed - the wire does not carry any.
  const hot=recordingCanvas();
  drawCartoonBattle(hot.ctx,scene(),opts);
  assert.ok(has(hot.sets,'#fdf6e0'),'the hit flares on the unit');

  const cold=recordingCanvas();
  const empty=scene();empty.shots=[];
  drawCartoonBattle(cold.ctx,empty,opts);
  assert.ok(!has(cold.sets,'#fdf6e0'),'no shot, no flare');

  const still=recordingCanvas();
  drawCartoonBattle(still.ctx,scene(),{...opts,reducedMotion:true});
  assert.ok(!has(still.sets,'#fdf6e0'),'reduced motion keeps the hit quiet');
});

test('vehicle dust reads the tread marks, so a standing column stops puffing',()=>{
  const draw=(tracks,extra={})=>{
    const f=recordingCanvas();
    const m=field();
    m.wave=1;m.running=true;
    m.enemies=[{kind:'tank',x:200,y:150,hp:10,maxHp:20}];
    drawCartoonBattle(f.ctx,m,{...opts,groundTracks:tracks,storyTime:10,...extra});
    return f;
  };
  const tread=bornAt=>[{kind:'tread',x:200,y:150,angle:0,side:1,scale:1,bornAt,lifetime:6.2}];

  assert.ok(has(draw(tread(10)).sets,'#b7a67e'),'fresh treads under the hull kick dust');
  assert.ok(!has(draw(tread(0)).sets,'#b7a67e'),'stale treads mean a parked column');
  assert.ok(!has(draw([],{reducedMotion:true}).sets,'#b7a67e'),'reduced motion keeps the road clean');
});

test('between waves the bunker breathes and the flag waves',()=>{
  const draw=(storyTime,running,extra={})=>{
    const f=recordingCanvas();
    const m=field();
    m.wave=1;m.running=running;
    drawCartoonBattle(f.ctx,m,{...opts,storyTime,...extra});
    return f;
  };
  const clothY=f=>f.calls.filter(([op,x])=>op==='lineTo'&&x===-26).map(([, ,y])=>y);

  assert.ok(has(draw(1,false).sets,'#a8b0a3'),'the stack breathes in the lull');
  assert.ok(!has(draw(1,true).sets,'#a8b0a3'),'in battle the stack is quiet');
  assert.ok(!has(draw(1,false,{reducedMotion:true}).sets,'#a8b0a3'),'reduced motion keeps the chimney calm');

  assert.notDeepEqual(clothY(draw(1,false)),clothY(draw(4,false)),'the flag waves between waves');
  assert.deepEqual(clothY(draw(1,true)),clothY(draw(4,true)),'in battle the flag hangs still');
  assert.deepEqual(clothY(draw(1,false,{reducedMotion:true})),clothY(draw(4,false,{reducedMotion:true})),
    'reduced motion keeps the flag still');
});

test('battle scars stamp the ground where the shells land, and fade with the painter clock',()=>{
  const f=recordingCanvas();
  const m=field();
  m.wave=1;m.running=true;
  m.shots=[{x:105,y:210,tx:300,ty:300,color:'#f6d787',kind:0,life:.067,duration:.12}];
  const draw=storyTime=>drawCartoonBattle(f.ctx,m,{...opts,storyTime});
  const stamped=fn=>{const before=f.sets.length;fn();return f.sets.slice(before).filter(([k,v])=>k==='fillStyle'&&/^#463c2a$/i.test(v));};

  assert.equal(stamped(()=>draw(10)).length,1,'the impact stamps once');
  // The scar keeps being painted every frame - the pin is that the list
  // holds ONE entry, not that the brush falls silent.
  assert.equal(stamped(()=>draw(10)).length,1,'the same shell still paints exactly one scar');
  m.shots=[];
  assert.equal(stamped(()=>draw(25)).length,0,'fourteen seconds later the scar is gone');

  const still=recordingCanvas();
  m.shots=[{x:105,y:210,tx:300,ty:300,color:'#f6d787',kind:0,life:.067,duration:.12}];
  drawCartoonBattle(still.ctx,m,{...opts,storyTime:10,reducedMotion:true});
  assert.ok(!has(still.sets,'#463c2a'),'reduced motion leaves the ground unmarked');

  const quiet=recordingCanvas();
  drawCartoonBattle(quiet.ctx,m,{...opts,storyTime:10,combatTracers:false});
  assert.ok(!has(quiet.sets,'#463c2a'),'with the tracer switch off the ground stays clean');
});

test('the marsh weather shows: rain threads, puddle glints and the lightning window',()=>{
  const draw=(storyTime,theme,extra={})=>{
    const f=recordingCanvas();
    drawCartoonBattle(f.ctx,field(),{...opts,theme,storyTime,...extra});
    return f;
  };

  const rain=draw(1,'marsh');
  assert.ok(stroked(rain.sets,'#cfe4ea'),'rain threads over the marsh');
  assert.ok(has(rain.sets,'#577379'),'puddles on the marsh');
  assert.ok(stroked(rain.sets,'#cfe9ee'),'a glint on the puddles');

  const flash=draw(19.02,'marsh');
  assert.ok(has(flash.sets,'#eef4ff'),'the lightning window is open at 19.02');
  assert.ok(!has(draw(5,'marsh').sets,'#eef4ff'),'and closed at 5');

  assert.ok(!stroked(draw(1,'marsh',{reducedMotion:true}).sets,'#cfe4ea'),'reduced motion keeps the sky dry');
  assert.ok(!stroked(draw(1,'marsh',{weatherEffects:false}).sets,'#cfe4ea'),'weather off, sky dry');
  assert.ok(stroked(draw(1,'forest').sets,'#c9e4de'),'a light drizzle in the forest');
  assert.ok(!stroked(draw(1,'road').sets,'#cfe4ea'),'no rain threads on the road');
});

test('one field, everything at once, still paints cleanly',()=>{
  // The kitchen sink: lull, repair, upgrade effect, hit, treads and marsh
  // weather in a single draw. Every argument stays finite - the recording
  // canvas fails the test otherwise.
  const f=recordingCanvas();
  const m=field();
  m.wave=1;m.running=false;
  m.towers=[{id:1,type:0,pad:0,level:1,branch:0,ownerId:'a',hp:100,maxHp:100,repairing:800}];
  m.enemies=[{kind:'tank',x:200,y:150,hp:10,maxHp:20}];
  m.shots=[{x:105,y:210,tx:300,ty:300,color:'#f6d787',kind:0,life:.067,duration:.12}];
  drawCartoonBattle(f.ctx,m,{
    ...opts,theme:'marsh',storyTime:1,
    effects:[{kind:'upgrade',x:PADS[0].x,y:PADS[0].y,started:0,duration:950,progress:0.1}],
    groundTracks:[{kind:'tread',x:200,y:150,angle:0,side:1,scale:1,bornAt:1,lifetime:6.2}],
  });
  assert.ok(f.calls.length>0,'the field painted something');
  assert.ok(has(f.sets,'#a8b0a3'),'the chimney breathes');
  assert.ok(has(f.sets,'#ffe9a0'),'the repair sparks');
  assert.ok(stroked(f.sets,'#cfe4ea'),'the rain falls');
});
