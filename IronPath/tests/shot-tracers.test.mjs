import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {shotTrace,shotStyle,shotZoomFix,shotsToDraw,SHOT_STYLES,SHOT_LIMIT} from '../shot-tracers.mjs';

// The picture of a shot is a rule, and rules can be checked without a browser.
// What follows is the whole argument for the redesign: a streak that runs
// instead of a line that lies there, a handwriting per weapon, and nothing that
// outlives its own shot.
const SHOT={x:100,y:200,tx:250,ty:200,life:.24,duration:.24,color:'#fff'};
// `progress` is how far through its life the shot is - the age that produced
// it, so the numbers in the assertions read the way a player sees them.
const at=(progress,over={})=>shotTrace({...SHOT,...over},progress*.24);

test('a streak runs along the line instead of lying on the whole of it',()=>{
  const reach=150;
  for(const kind of [0,1,2,3,'hero']){
    for(const progress of [0,.1,.25,.5,.75,.99]){
      const trace=shotTrace({...SHOT,kind},progress*.24);
      assert.ok(trace,'the shot is alive');
      const lit=trace.headAt-trace.tailAt;
      assert.ok(lit<=reach+.001,`${trace.style}: the lit streak is part of the line, not more than it (${lit})`);
      assert.ok(lit<reach*.95,`${trace.style}: it never lights the whole line at once (${Math.round(lit)} of ${reach})`);
    }
  }
});

test('the streak travels from the barrel to the target and stops there',()=>{
  const early=at(.05),late=at(.4);
  assert.ok(early.headAt<late.headAt,'it moves');
  assert.equal(early.head.x,SHOT.x+early.headAt,'along the line, not off it');
  const arrived=at(.999);
  assert.ok(Math.abs(arrived.headAt-150)<.001,'and it stops at the target, never past it');
  assert.ok(arrived.alpha<.02,'a spent shot has faded out, not popped out');
});

test('every weapon keeps its own handwriting',()=>{
  const styles=[0,1,2,3,'hero'].map(kind=>shotStyle(kind));
  assert.deepEqual([...new Set(styles)],styles,'five kinds, five hands');
  const signatures=Object.keys(SHOT_STYLES).map(name=>{
    const style=SHOT_STYLES[name];
    return `${style.tail}/${style.core}/${style.travel}/${style.impactGrow}`;
  });
  assert.equal(new Set(signatures).size,signatures.length,'no two weapons share length, weight, timing and impact');
  // The two that a player must never confuse: the cannon is slow and fat, the
  // sniper is fast and thin. Measured at the same moment in their lives.
  const cannon=shotTrace({...SHOT,kind:1},.12),sniper=shotTrace({...SHOT,kind:3},.12);
  assert.ok(cannon.core>sniper.core*2,'the cannon reads heavier than the sniper');
  assert.ok(SHOT_STYLES.sniper.travel<SHOT_STYLES.cannon.travel,'and the sniper crosses the field faster');
  assert.ok(SHOT_STYLES.sniper.tail>SHOT_STYLES.mg.tail*2,'with a longer streak than the MG');
});

test('the barrel flashes, and the flash is over before the shell lands',()=>{
  for(const kind of [0,1,2,3,'hero']){
    const style=SHOT_STYLES[shotStyle(kind)];
    assert.ok(style.flashEnd<style.travel,
      `${shotStyle(kind)}: departure and arrival are two beats, not one smear (${style.flashEnd} vs ${style.travel})`);
  }
  const leaving=at(.02),halfway=at(.5);
  assert.ok(leaving.flash&&!leaving.impact,'the muzzle speaks first');
  assert.ok(!halfway.flash&&halfway.impact,'and the impact answers');
});

test('reduced motion keeps the shot, drops the theatre',()=>{
  const quiet=shotTrace({...SHOT,kind:1},.05,{reducedMotion:true});
  assert.ok(quiet,'a shot is still visible - reduced motion is not blindness');
  assert.equal(quiet.flash,null,'no muzzle flash');
  assert.equal(quiet.impact,null,'no impact burst');
  assert.ok(quiet.core>0&&quiet.ink>quiet.core,'just the streak, outlined so it reads on any ground');
});

test('a shot keeps its weight on screen without taking over the field',()=>{
  const near=shotTrace({...SHOT,kind:0},.1,{renderScale:1});
  const far=shotTrace({...SHOT,kind:0},.1,{renderScale:.5});
  assert.ok(far.core>near.core,'zoomed out, the streak is drawn heavier in world units, so it survives on screen');
  // ...but only so far. Half the zoom must not mean double the paint over the
  // field: the correction is clamped at both ends.
  assert.equal(shotZoomFix(.1),shotZoomFix(.6),'a wild zoom cannot blow the strokes up');
  assert.equal(shotZoomFix(9),shotZoomFix(1.6),'nor shrink them into nothing');
  assert.ok(far.core<=near.core*1.7,'the correction stays modest');
});

test('a broken shot draws nothing rather than nonsense',()=>{
  assert.equal(shotTrace(null),null);
  assert.equal(shotTrace({...SHOT,life:0}),null,'a shot that is over is gone');
  assert.equal(shotTrace(SHOT,.24),null,'and so is one the clock has passed');
  assert.equal(shotTrace({...SHOT,tx:NaN}),null,'no NaN coordinates ever reach the painter');
  // A shot fired at its own feet: zero length, nothing to divide by.
  const still=shotTrace({...SHOT,tx:100,ty:200},.1);
  assert.ok(still);
  for(const point of [still.head,still.tail])for(const value of [point.x,point.y])assert.ok(Number.isFinite(value));
  assert.equal(still.headAt,0,'it has nowhere to travel');
  // No duration at all - the painter still needs a number.
  assert.ok(shotTrace({x:0,y:0,tx:10,ty:0,life:.1},0));
});

test('reading a shot never writes to it',()=>{
  const shot={...SHOT,kind:1},before=structuredClone(shot);
  shotTrace(shot,.05,{renderScale:.7});
  assert.deepEqual(shot,before,'the painter must not reach back into the simulation');
});

test('the painter leaves the surplus out and never hands the canvas a NaN',async()=>{
  const {drawCartoonBattle}=await import('../cartoon-art.mjs');
  const {createPlayer}=await import('../match.mjs');
  const {createMatch,PATH,PADS,getTowerRange}=await import('../simulation.mjs');
  const player=createPlayer('a',{name:'Alice',gender:'female'});
  const state=createMatch([player]);state.wave=1;
  const opts={path:PATH,pads:PADS,types:[{color:'#a'},{color:'#b'},{color:'#c'},{color:'#d'}],me:'a',getTowerRange};
  const calls=[];const ctx=new Proxy({},{
    get(target,key){if(key in target)return target[key];return (...args)=>{
      assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),`${String(key)} has non-finite coordinates`);
      calls.push([key,...args]);};},
    set(target,key,value){target[key]=value;return true;}});
  const strokes=shots=>{state.shots=shots;calls.length=0;drawCartoonBattle(ctx,state,{...opts});
    return calls.filter(([name])=>name==='stroke').length;};
  const make=count=>Array.from({length:count},()=>({...SHOT,kind:0}));
  const empty=strokes([]),full=strokes(make(SHOT_LIMIT)),over=strokes(make(SHOT_LIMIT+10));
  assert.ok(full>empty,'the field paints its shots');
  assert.equal(over,full,'past the limit the surplus is not painted - it cannot pile up over the enemies');
  // A shot the network got wrong must not put a NaN on the canvas.
  assert.doesNotThrow(()=>strokes([{...SHOT,tx:NaN},{...SHOT,life:NaN},{...SHOT,duration:0}]));
});

test('a crowded field paints the newest shots and no more',()=>{
  const shots=Array.from({length:60},(_,i)=>({...SHOT,kind:0}));
  const drawn=shotsToDraw(shots);
  assert.equal(drawn.length,SHOT_LIMIT);
  assert.equal(drawn[drawn.length-1],shots[59],'the newest shot is always on the field');
  assert.equal(shotsToDraw(shots.slice(0,5)).length,5,'and a quiet field paints all of them');
  assert.deepEqual(shotsToDraw(undefined),[]);
});
