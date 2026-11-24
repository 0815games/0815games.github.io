import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawCartoonBattle,ambientAlarm} from '../core/cartoon-art.mjs';
import {createMatch,getTowerRange} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';
import {getMap} from '../core/maps.mjs';

// Lebendiges Ambient, painted: cloud shadows and wind litter drift on the
// clock, and the bird flock climbs when the shot list is fresh and settles
// when it is quiet. The alarm is read from the same shots every viewer
// receives, so nothing new crosses the wire and no client can disagree.
// The canvas is a recording proxy, so the machine sees the strokes.

function field(){
  const map=getMap('road'),p=createPlayer('a',{name:'Alice',gender:'female'}),state=createMatch([p],map.id);
  state.wave=1;state.running=false;
  const log=[];
  const doc={createElement(kind){if(kind==='canvas')return {getContext:()=>null};const image={};Object.defineProperty(image,'src',{set(){image.onload?.();}});return image;}};
  const ctx=new Proxy({canvas:{ownerDocument:doc}},{get(o,k){if(k in o)return o[k];return (...args)=>log.push([k,...args]);},set(o,k,v){o[k]=v;log.push(['set',k,v]);return true;}});
  const options={path:map.path,pads:map.pads,types:[{},{},{},{}],me:'a',getTowerRange};
  return {state,log,options,draw:extra=>{log.length=0;drawCartoonBattle(ctx,state,{...options,...extra});return log;}};
}
const freshShots=[{x:100,y:100,tx:200,ty:150,life:.24,duration:.24,kind:0,color:'#ffec9e'}];
const birdYs=log=>log.filter(call=>call[0]==='quadraticCurveTo').map(call=>call[2]);

test('the alarm reads the shot list: fresh shots startle, silence calms',()=>{
  assert.equal(ambientAlarm([],0),0,'no shots, no alarm');
  assert.equal(ambientAlarm(null,0),0,'no list, no alarm');
  assert.ok(ambientAlarm(freshShots,0)>.5,'a just-fired shot is loud');
  assert.equal(ambientAlarm(freshShots,1),0,'a shot older than its life is gone');
  assert.ok(ambientAlarm(freshShots,0)<=1,'the alarm clamps at 1');
  const many=Array.from({length:12},()=>freshShots[0]);
  assert.equal(ambientAlarm(many,0),1,'a busy field clamps at 1');
  const half=[{...freshShots[0],life:.12}];
  assert.ok(ambientAlarm(half,0)<ambientAlarm(freshShots,0),'an ageing shot quiets down');
});

test('cloud shadows and wind litter paint with the weather, not without it',()=>{
  const f=field();
  const on=f.draw({storyTime:3});
  assert.ok(on.some(call=>call[0]==='ellipse'&&call[3]===176),'a wide cloud shadow crosses the field');
  assert.ok(on.some(call=>call[0]==='set'&&call[1]==='strokeStyle'&&call[2]==='#c9b27a'),'wind litter blows in the road tint');
  const off=f.draw({storyTime:3,weatherEffects:false});
  assert.ok(!off.some(call=>call[0]==='ellipse'&&call[3]===176),'weather off, no clouds');
  const still=f.draw({storyTime:3,reducedMotion:true});
  assert.ok(!still.some(call=>call[0]==='ellipse'&&call[3]===176),'reduced motion, no clouds');
  assert.ok(!still.some(call=>call[0]==='quadraticCurveTo'),'reduced motion, no flock');
});

test('the flock climbs while shots are fresh and glides when the field is quiet',()=>{
  const f=field();
  f.state.shots=[];
  const calm=f.draw({storyTime:3});
  const calmYs=birdYs(calm);
  assert.equal(calmYs.length,12,'six birds, two wing strokes each');
  f.state.shots=freshShots.map(s=>({...s}));
  const loud=f.draw({storyTime:3});
  const loudYs=birdYs(loud);
  assert.equal(loudYs.length,12,'the startled flock still has six birds');
  const climbed=loudYs.filter((y,i)=>y<calmYs[i]-4);
  assert.ok(climbed.length>=6,'every bird climbs when a shot is fresh');
  const before=JSON.stringify(f.state.shots);
  f.draw({storyTime:9});
  assert.equal(JSON.stringify(f.state.shots),before,'painting never touches the shots');
});
