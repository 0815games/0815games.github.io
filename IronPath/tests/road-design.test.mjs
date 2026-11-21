import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawRoad} from '../cartoon-art.mjs';

// Point 2 of the list: "Strassen-Design neu". The old road stacked three
// opaque tone strokes (hard contour bands across every bend) and drew its
// wheel ruts one segment at a time, whose round caps doubled their alpha at
// every vertex - dark beads along the whole lane. The new road wears four
// deliberate layers and strokes each rut side exactly once.

// A recording 2D context that remembers strokes, alphas and paths.
function recorder(){
  const calls={strokes:[],alphas:[],fills:0};
  const ctx=new Proxy({canvas:{ownerDocument:null}},{get(target,key){
    if(key in target)return target[key];
    return (...args)=>{
      if(key==='stroke')calls.strokes.push({style:target.strokeStyle,width:target.lineWidth,cap:target.lineCap});
      else if(key==='fill')calls.fills++;
      return undefined;
    };
  },set(target,key,value){target[key]=value;if(key==='globalAlpha')calls.alphas.push(value);return true;}});
  return {ctx,calls};
}

const ZIGZAG=[{x:60,y:270},{x:240,y:120},{x:420,y:300},{x:600,y:140},{x:820,y:280}];

test('the wheel ruts are one stroke per side, not one per segment',()=>{
  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'road');
  const ruts=calls.strokes.filter(s=>s.width===5);
  assert.equal(ruts.length,2,'exactly two rut strokes, one per side');
  assert.ok(ruts.every(rut=>/rgba\(28,24,16/.test(String(rut.style))),'the ruts keep their translucent dirt colour');
  // The lane itself is four strokes; only the decorative pebbles add more.
  assert.equal(calls.strokes.filter(s=>s.width>5).length,4,'the lane is not segment-stroked anymore');
});

test('the road wears four layers: rim, shoulder, surface, worn centre',()=>{
  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'road');
  const widths=calls.strokes.map(s=>s.width);
  assert.deepEqual(widths.filter(w=>w>=40).sort((a,b)=>b-a),[86,76,66,46],'one stroke per layer, widest first');
  assert.ok(calls.alphas.includes(.42),'the worn centre is a single translucent wash, not stacked bands');
  // The rim stays soft: it keeps its translucent colour.
  assert.match(String(calls.strokes.find(s=>s.width===86).style),/rgba\(26,30,24,\.3\)/);
});

test('every theme paints its own palette through the same four layers',()=>{
  for(const theme of ['forest','urban','arctic','marsh','scrub','talwald','road']){
    const {ctx,calls}=recorder();
    drawRoad(ctx,ZIGZAG,theme);
    assert.equal(calls.strokes.filter(s=>s.width===5).length,2,theme);
    assert.equal(calls.strokes.filter(s=>s.width===46).length,1,theme+' gets its worn centre');
  }
});

test('junction maps keep their rails and no road layers',()=>{
  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'junction');
  assert.equal(calls.strokes.filter(s=>s.width===86).length,0,'the road layers never run on rail maps');
});

test('a path without segments draws nothing instead of throwing',()=>{
  const {ctx}=recorder();
  for(const bad of [[],[{x:1,y:1}]])
    assert.doesNotThrow(()=>drawRoad(ctx,bad,'road'),'drawRoad must survive '+JSON.stringify(bad));
});
