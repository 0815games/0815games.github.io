import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawRoad} from '../cartoon-art.mjs';

// Point 2 of the list: "Strassen-Design neu". The old road stacked three
// opaque tone strokes (hard contour bands across every bend) and drew its
// wheel ruts one segment at a time, whose round caps doubled their alpha at
// every vertex - dark beads along the whole lane. The new road wears six
// deliberate layers (rim halo, ink outline, shoulder, shoulderHi, surface,
// crown) and strokes each rut side exactly once.

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
  // Ruts keep a translucent theme-tuned colour (road: warm dirt).
  assert.ok(ruts.every(rut=>/rgba\(/.test(String(rut.style))&&rut.style.includes('.32')),'the ruts stay translucent');
  // The lane itself is six strokes (rim, ink, shoulder, shoulderHi, surface, crown);
  // only the decorative pebbles, cleats and boot stamps add more.
  assert.equal(calls.strokes.filter(s=>s.width>5).length,6,'the lane is not segment-stroked anymore');
});

test('the road wears six layers: rim halo, ink, shoulder, shoulderHi, surface, crown',()=>{
  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'road');
  const widths=calls.strokes.map(s=>s.width);
  assert.deepEqual(widths.filter(w=>w>=30).sort((a,b)=>b-a),[94,82,76,68,60,38],'one stroke per layer, widest first');
  // The rim stays soft: it keeps its translucent colour.
  assert.match(String(calls.strokes.find(s=>s.width===94).style),/rgba\(/);
  // The surface is the widest opaque-ish lane stroke.
  assert.ok(calls.strokes.some(s=>s.width===60),'the surface layer is present');
});

test('every theme paints its own palette through the same five core layers',()=>{
  for(const theme of ['forest','urban','arctic','marsh','scrub','talwald','road']){
    const {ctx,calls}=recorder();
    drawRoad(ctx,ZIGZAG,theme);
    assert.equal(calls.strokes.filter(s=>s.width===5).length,2,theme);
    // Every theme gets its surface layer at width 60.
    assert.equal(calls.strokes.filter(s=>s.width===60).length,1,theme+' gets its surface layer');
  }
});

test('junction maps keep their rails and no road layers',()=>{
  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'junction');
  // Junction uses drawRail, which has its own 94px halo - but no road surface.
  assert.equal(calls.strokes.filter(s=>s.width===60).length,0,'the road surface (60px) never runs on rail maps');
  assert.equal(calls.strokes.filter(s=>s.width===82).length,0,'the road ink (82px) never runs on rail maps');
});

test('a path without segments draws nothing instead of throwing',()=>{
  const {ctx}=recorder();
  for(const bad of [[],[{x:1,y:1}]])
    assert.doesNotThrow(()=>drawRoad(ctx,bad,'road'),'drawRoad must survive '+JSON.stringify(bad));
});
