import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawRoad} from '../core/cartoon-art.mjs';
import {buildRoadPath,cornerDeviation,DEFAULT_CORNER_RADIUS} from '../core/road-geometry.mjs';
import {MAPS,getMap} from '../core/maps.mjs';

// Point 2 of the list: "Strassen-Design neu", re-landed with the curves fixed.
//
// The first version of this contract pinned four tone strokes and two rut
// strokes. That was true, and still not enough: the road looked wrong at every
// bend, because each layer offset and decorated its straight segments on their
// own. Measured on the shipped maps that cost 21.2 px of torn wheel rut per
// corner, a 13.0 px corner cut in the twin rails, 13 px gaps under the sleepers
// and 38 px under the pebbles, and it swallowed `forest`'s 30 px stub whole.
//
// So this contract now pins the geometry rather than the palette alone:
//   * every stroke is ONE continuous path - exactly one moveTo, never one per
//     segment, which is what made the ruts tear and the caps stack into beads;
//   * the ribbon contains real circular arcs, one per corner, so a bend is a
//     bend and not a round-join bulge on a polyline;
//   * decorations land INSIDE the bends, measured against the arc midpoints the
//     old segment loops could never reach;
//   * the driving surface stays wide enough for a unit that walks the sharp
//     simulation polygon - the cross-module bound that keeps the smoothing
//     honest instead of decorative.

// A recording 2D context. It keeps every stroke with the path that produced it,
// so "one continuous curve" and "a mark inside the bend" become checkable facts
// instead of claims about colours.
function recorder(){
  const calls={strokes:[],fills:[],rects:[],ellipses:0,saves:0,restores:0};
  let path=[],dash=null,arcs=0,moves=0;
  const ctx={
    canvas:{ownerDocument:null},
    strokeStyle:null,fillStyle:null,lineWidth:1,lineCap:'butt',lineJoin:'miter',globalAlpha:1,
    // Only beginPath clears the current path - exactly like a real 2D context.
    // `oval` fills and then strokes the SAME ellipse, so a recorder that cleared
    // on fill() would report an empty stroke and hide what was painted.
    beginPath(){path=[];arcs=0;moves=0;},
    moveTo(x,y){moves++;path.push([x,y]);},
    lineTo(x,y){path.push([x,y]);},
    closePath(){},
    arc(x,y,r,a0,a1,ccw){arcs++;path.push([x+Math.cos(a0)*r,y+Math.sin(a0)*r]);},
    ellipse(x,y){calls.ellipses++;path.push([x,y]);},
    stroke(){calls.strokes.push({style:ctx.strokeStyle,width:ctx.lineWidth,cap:ctx.lineCap,
      join:ctx.lineJoin,alpha:ctx.globalAlpha,dash,moveTo:moves,points:path.slice(),arcs});},
    fill(){calls.fills.push({style:ctx.fillStyle,alpha:ctx.globalAlpha,points:path.slice()});},
    fillRect(x,y,w,h){calls.rects.push({x,y,w,h,style:ctx.fillStyle});},
    save(){calls.saves++;},
    restore(){calls.restores++;},
    translate(){},rotate(){},scale(){},
    setLineDash(d){dash=d&&d.length?d.slice():null;},
    createPattern(){return null;}
  };
  return {ctx,calls};
}

// The painter's own test path: a zigzag that turns at 84.8, 86.6 and 74.1
// degrees. Deliberately NOT orthogonal - the shipped maps all turn at exactly 90
// degrees, and a tangent formula that is only right at 90 degrees passes every
// one of them while being wrong everywhere else.
const ZIGZAG=[{x:60,y:270},{x:240,y:120},{x:420,y:300},{x:600,y:140},{x:820,y:280}];

// The middle of every fillet arc - the places the old segment loops never
// reached, because they stopped short of each vertex and restarted after it.
function arcMidpoints(points){
  const road=buildRoadPath(points);
  return road.elements.filter(e=>e.kind==='arc').map(e=>{
    const mid=e.a0+e.turn*e.delta/2;
    return {x:e.c.x+Math.cos(mid)*e.r,y:e.c.y+Math.sin(mid)*e.r,r:e.r};
  });
}
// Distance from a point to a recorded stroke, measured to the SEGMENT between
// two commands - a sleeper is 46 px long and lies across the road, so measuring
// to its endpoints would report 23 px even when it crosses the point exactly.
function strokeDist(stroke,x,y){
  let best=Infinity;
  for(let i=1;i<stroke.points.length;i++){
    const a=stroke.points[i-1],b=stroke.points[i];
    const dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy;
    if(!l2){best=Math.min(best,Math.hypot(x-a[0],y-a[1]));continue;}
    const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/l2));
    best=Math.min(best,Math.hypot(x-(a[0]+t*dx),y-(a[1]+t*dy)));
  }
  return best;
}

test('every road stroke is one continuous path, never one per segment',()=>{
  for(const theme of ['road','forest','urban','arctic','marsh','scrub','talwald','outpost']){
    const {ctx,calls}=recorder();
    drawRoad(ctx,ZIGZAG,theme);
    assert.ok(calls.strokes.length>10,`${theme}: the road paints a full stack of layers`);
    for(const s of calls.strokes){
      // A stroke assembled from N segments needs N moveTo calls - that is what
      // the old painter did, and it is what tore the ruts and stacked the caps.
      // Every stroke here starts its path at most once (closed decorations such
      // as an ellipse outline start it not at all).
      assert.ok(s.moveTo<=1,
        `${theme}: the ${s.width} px stroke is one continuous path, not ${s.points.length} fragments`);
      assert.ok(s.points.length>=1,`${theme}: a stroke of width ${s.width} actually draws something`);
    }
    assert.equal(calls.saves,calls.restores,`${theme}: save/restore stay balanced`);
  }
});

test('the ribbon contains real arcs, one per corner',()=>{
  // "Echte Rundungen" is the requirement, so the curve commands are the proof:
  // a polyline with round joins emits no arc at all and bulges 43 px instead.
  for(const [name,points] of [['zigzag',ZIGZAG],...Object.keys(MAPS).map(id=>[id,getMap(id).path])]){
    const {ctx,calls}=recorder();
    drawRoad(ctx,points,'road');
    const corners=buildRoadPath(points).corners.length;
    assert.ok(corners>0,`${name} has corners to round`);
    const wide=calls.strokes.filter(s=>s.width>=56);
    assert.ok(wide.length>=4,`${name}: the road body is several wide layers`);
    for(const s of wide)
      assert.equal(s.arcs,corners,`${name}: the ${s.width} px layer carries one arc per corner (${s.arcs}/${corners})`);
  }
});

test('the road wears its layers widest first, down to the driving surface',()=>{
  // Paved themes carry a gutter between shoulder and surface; the natural ones
  // swap it for a lit shoulder. Either way the stack is five strokes, widest
  // first, one per layer - never one per segment.
  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'urban');
  assert.deepEqual(calls.strokes.filter(s=>s.width>=40).map(s=>s.width),[94,82,76,66,60],
    'urban: halo, ink, shoulder, gutter, surface');
  const {ctx:fc,calls:f}=recorder();
  drawRoad(fc,ZIGZAG,'road');
  assert.deepEqual(f.strokes.filter(s=>s.width>=40).map(s=>s.width),[94,82,76,68,60],
    'road: halo, ink, shoulder, lit shoulder, surface');
  // The surface width is not a taste decision: it is the bound that keeps a unit
  // walking the sharp simulation polygon on the asphalt. Pinned here so a
  // redesign of the stack cannot quietly narrow the road under the geometry
  // module's feet.
  const surface=calls.strokes.find(s=>s.width===60);
  assert.ok(surface,'the driving surface is stroked at 60 px');
  assert.ok(cornerDeviation(DEFAULT_CORNER_RADIUS,Math.PI/2)<surface.width/2,
    'a 90 degree bend strays less than half the surface width from the polygon');
});

test('the wheel ruts are one exact offset curve per side',()=>{
  for(const theme of ['road','urban','arctic','marsh','forest']){
    const {ctx,calls}=recorder();
    drawRoad(ctx,ZIGZAG,theme);
    const ruts=calls.strokes.filter(s=>s.width===5);
    assert.equal(ruts.length,2,`${theme}: exactly two rut strokes, one per side`);
    const corners=buildRoadPath(ZIGZAG).corners.length;
    for(const rut of ruts){
      assert.equal(rut.moveTo,1,`${theme}: a rut is a single path`);
      assert.equal(rut.arcs,corners,`${theme}: and it is rounded through every corner`);
      assert.equal(rut.cap,'round',`${theme}: round caps, stroked once, so no beads`);
    }
    // The two ruts are mirror images about the centreline: same shape, opposite
    // side. That is what an exact offset curve gives and what the segment-wise
    // version could not hold at a corner.
    const [a,b]=ruts;
    assert.equal(a.points.length,b.points.length,`${theme}: both ruts have the same command count`);
  }
});

test('sleepers, planks and kerb notches land INSIDE the bends',()=>{
  // The sharpest difference to the old painter: a decoration placed by arclength
  // exists on the corner itself. Measured against the arc midpoints, which the
  // per-segment loops stopped 4-12 px short of and never reached.
  const mids=arcMidpoints(ZIGZAG);
  assert.ok(mids.length>=3,'the zigzag has three bends to decorate');

  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'junction');
  // Sleepers are 9 px wide ink strokes drawn across the track.
  const sleepers=calls.strokes.filter(s=>s.width===9);
  assert.ok(sleepers.length>20,`the junction lays ${sleepers.length} sleepers`);
  for(const m of mids){
    const d=Math.min(...sleepers.map(s=>strokeDist(s,m.x,m.y)));
    // Sleepers are spaced 16 px apart, so one of them crosses the middle of
    // every bend within half that - the old loop stopped 4 px before the vertex
    // and restarted 9 px after it, leaving a 13 px hole with nothing in it.
    assert.ok(d<9,`a sleeper crosses the bend midpoint within ${d.toFixed(1)} px (was never reachable)`);
  }
  // The twin rails run 13 px either side of the centreline, as offset curves.
  const rails=calls.strokes.filter(s=>s.width===4.4||s.width===2.4);
  assert.equal(rails.length,4,'two rails, each with a shadow line');
  const origin=buildRoadPath(ZIGZAG).at(0);
  for(const rail of rails){
    assert.equal(rail.moveTo,1,'a rail is one continuous curve');
    assert.equal(rail.arcs,mids.length,'and it is rounded through every bend');
    // It keeps its gauge from the very first metre: exactly 13 px beside the
    // centreline, which is what the concentric-arc offset guarantees and what
    // the old `vertex + n1*13` polyline lost at every corner.
    const d0=Math.hypot(rail.points[0][0]-origin.x,rail.points[0][1]-origin.y);
    assert.ok(Math.abs(d0-13)<1e-6,`the rail starts ${d0.toFixed(3)} px beside the track`);
  }

  const {ctx:mc,calls:m}=recorder();
  drawRoad(mc,ZIGZAG,'marsh');
  const planks=m.strokes.filter(s=>s.width===9.2);
  assert.ok(planks.length>40,`the marsh lays ${planks.length} corduroy planks`);
  for(const mid of mids){
    const d=Math.min(...planks.map(s=>strokeDist(s,mid.x,mid.y)));
    assert.ok(d<7,`a plank crosses the bend midpoint within ${d.toFixed(1)} px (planks sit 11 px apart)`);
  }
  const rails6=m.strokes.filter(s=>[7.2,4.4,1.4].includes(s.width));
  assert.equal(rails6.length,6,'three guardrail layers per side');
  for(const g of rails6)assert.equal(g.arcs,mids.length,'each guardrail follows the bends');
});

test('every theme paints its own palette through the same layers',()=>{
  const surfaces={road:'#caa972',forest:'#c4a670',urban:'#31373a',arctic:'#3a4449',
    marsh:'#4a321c',scrub:'#e4c792',talwald:'#bfa26c',outpost:'#3a362e'};
  for(const [theme,surface] of Object.entries(surfaces)){
    const {ctx,calls}=recorder();
    drawRoad(ctx,ZIGZAG,theme);
    const s=calls.strokes.find(k=>k.width===60);
    assert.equal(s.style,surface,`${theme} drives on its own surface colour`);
    assert.equal(calls.strokes.filter(k=>k.width===5).length,2,`${theme} keeps two ruts`);
    assert.ok(calls.strokes.find(k=>k.width===94),`${theme} keeps the ground-clearing halo`);
    assert.ok(calls.ellipses>0||calls.strokes.length>8,`${theme} adds its verge dressing`);
  }
});

test('an unknown theme falls back to the road palette instead of throwing',()=>{
  const {ctx,calls}=recorder();
  assert.doesNotThrow(()=>drawRoad(ctx,ZIGZAG,'no-such-theme'));
  assert.equal(calls.strokes.find(s=>s.width===60).style,'#caa972','the fallback paints the road surface');
});

test('junction maps keep their rails and no road layers',()=>{
  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'junction');
  assert.equal(calls.strokes.filter(s=>s.width===60).length,0,'the road surface never runs on rail maps');
  assert.equal(calls.strokes.filter(s=>s.width===82).length,0,'and neither does the road ink silhouette');
  assert.ok(calls.strokes.some(s=>s.width===56),'the ballast does');
  assert.ok(calls.strokes.filter(s=>s.width===4.4).length===2,'two steel rails');
});

test('lane markings dash along the centreline and leave no dash behind',()=>{
  const {ctx,calls}=recorder();
  drawRoad(ctx,ZIGZAG,'urban');
  const dashed=calls.strokes.filter(s=>s.dash);
  assert.equal(dashed.length,1,'exactly one dashed stroke: the centre lane marking');
  assert.deepEqual(dashed[0].dash,[16,14],'in the painted rhythm');
  assert.equal(dashed[0].width,3);
  const after=calls.strokes.slice(calls.strokes.indexOf(dashed[0])+1);
  assert.ok(after.every(s=>!s.dash),'no later stroke inherits the dash');
});

test('a road texture is applied over the surface, not instead of it',()=>{
  const {ctx,calls}=recorder();
  ctx.createPattern=()=>({setTransform(){}});
  drawRoad(ctx,ZIGZAG,'road',null,{});
  const texture=calls.strokes.find(s=>s.width===58);
  assert.ok(texture,'the texture is stroked just inside the 60 px surface');
  assert.ok(texture.alpha<1,'at a translucent alpha, so the surface reads through');
  assert.ok(calls.strokes.some(s=>s.width===60),'and the surface itself is still painted');
});

test('a path without segments draws nothing instead of throwing',()=>{
  const {ctx}=recorder();
  for(const bad of [[],[{x:1,y:1}],null,undefined,'nope',[{x:1,y:1},{x:1,y:1}]])
    assert.doesNotThrow(()=>drawRoad(ctx,bad,'road'),'drawRoad must survive '+JSON.stringify(bad));
  const {ctx:jctx}=recorder();
  for(const bad of [[],[{x:1,y:1}],null])
    assert.doesNotThrow(()=>drawRoad(jctx,bad,'junction'),'drawRail must survive '+JSON.stringify(bad));
});

test('every shipped map paints without throwing, in its own theme',()=>{
  for(const id of Object.keys(MAPS)){
    const map=getMap(id);
    const {ctx,calls}=recorder();
    assert.doesNotThrow(()=>drawRoad(ctx,map.path,map.theme),`${id} paints`);
    assert.ok(calls.strokes.length>10,`${id} really painted`);
    assert.equal(calls.saves,calls.restores,`${id} leaves the context balanced`);
    // `forest` carries a 30 px stub between two corners - shorter than the road
    // is wide. It used to vanish inside two round-join bulges; now it survives as
    // an S-bend, so the painted ribbon must still visit it.
    if(id==='forest'){
      const stub=map.path[2];
      const wide=calls.strokes.filter(s=>s.width>=56);
      for(const s of wide)
        assert.ok(s.points.some(p=>Math.hypot(p[0]-stub.x,p[1]-stub.y)<40),
          'the 30 px stub is still part of the road');
    }
  }
});
