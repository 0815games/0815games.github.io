import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {buildRoadPath,maxCentrelineDeviation,cornerDeviation,DEFAULT_CORNER_RADIUS} from '../core/road-geometry.mjs';
import {MAPS,getMap} from '../core/maps.mjs';

// The road is an orthogonal zigzag: every shipped map turns at exactly 90
// degrees. These tests hold the geometry that the painter used to fake, and
// they hold it with numbers measured from the real maps rather than from a
// decorative fixture - a bend that is wrong on `forest` is wrong in the game.
const ROAD=getMap('road').path;
const FOREST=getMap('forest').path;
const OUTPOST=getMap('outpost').path;
const ZIGZAG=[{x:60,y:270},{x:240,y:120},{x:420,y:300},{x:600,y:140},{x:820,y:280}];

// Every layer and decoration the artwork offsets from the centreline.
const OFFSETS=[13,15,21,23,24.5,25,35];

function elementEnd(e){return e.kind==='line'?e.b:e.end;}
function elementStart(e){return e.kind==='line'?e.a:e.start;}

function continuityGap(path){
  let worst=0;
  for(let i=1;i<path.elements.length;i++){
    const a=elementEnd(path.elements[i-1]),b=elementStart(path.elements[i]);
    worst=Math.max(worst,Math.hypot(a.x-b.x,a.y-b.y));
  }
  return worst;
}

test('every shipped map is a 90-degree zigzag, which is why the corners matter',()=>{
  for(const id of Object.keys(MAPS)){
    const p=getMap(id).path;
    let corners=0;
    for(let i=1;i<p.length-1;i++){
      const a=p[i-1],b=p[i],c=p[i+1];
      const u1={x:b.x-a.x,y:b.y-a.y},u2={x:c.x-b.x,y:c.y-b.y};
      const l1=Math.hypot(u1.x,u1.y),l2=Math.hypot(u2.x,u2.y);
      const delta=Math.acos(Math.max(-1,Math.min(1,(u1.x*u2.x+u1.y*u2.y)/(l1*l2))));
      if(Math.abs(delta-Math.PI/2)<1e-6)corners++;
    }
    assert.ok(corners>=6,`${id} has ${corners} right-angle corners`);
  }
});

test('the smoothed centreline is tangent-continuous: no gap at any corner',()=>{
  for(const [name,p] of [['road',ROAD],['forest',FOREST],['outpost',OUTPOST],['zigzag',ZIGZAG]]){
    const path=buildRoadPath(p);
    assert.ok(path.elements.length>=p.length-1,`${name} keeps a straight run per segment`);
    assert.ok(path.corners.length>=1,`${name} reports its corners`);
    assert.ok(continuityGap(path)<1e-9,`${name}: elements meet exactly, gap was ${continuityGap(path)}`);
    // Start and end stay the simulation's exact endpoints: the road must still
    // begin where enemies spawn and end at the bunker.
    assert.deepEqual({x:path.start.x,y:path.start.y},{x:p[0].x,y:p[0].y},`${name} starts on the spawn`);
    const last=p[p.length-1];
    assert.ok(Math.hypot(path.end.x-last.x,path.end.y-last.y)<1e-9,`${name} ends on the bunker`);
  }
});

test('a corner never takes more than half of its shorter neighbour',()=>{
  // `forest` carries a 30 px stub between two corners - shorter than the road is
  // wide. Unclamped, both fillets would overlap and the stub would vanish into a
  // blob. Clamped, they meet at its midpoint as a clean S-bend.
  const path=buildRoadPath(FOREST);
  for(const c of path.corners)assert.ok(c.radius<=DEFAULT_CORNER_RADIUS+1e-9,`radius ${c.radius} within the wanted one`);
  const stub=path.corners.filter(c=>Math.abs(c.radius-15)<1e-6);
  assert.equal(stub.length,2,'the two corners around the 30 px stub are clamped to exactly 15');
  // The straight run between them is consumed completely, so no zero-length
  // line element survives there.
  assert.ok(path.elements.every(e=>e.len>0),'no degenerate element survives the clamping');
  assert.ok(continuityGap(path)<1e-9,'the two clamped fillets still meet exactly');
  // Every other corner on every map gets the full wanted radius.
  for(const p of [ROAD,OUTPOST]){
    for(const c of buildRoadPath(p).corners)
      assert.ok(Math.abs(c.radius-DEFAULT_CORNER_RADIUS)<1e-9,`a roomy corner gets the full ${DEFAULT_CORNER_RADIUS}`);
  }
});

test('a fillet touches BOTH of its segments, at any deflection angle',()=>{
  // The regression guard for the tangent-length formula r*tan(delta/2). Written
  // the other way round (r/tan(delta/2)) the two agree only at delta=90 degrees,
  // so every shipped map stayed green while the arc drifted off the second
  // segment by up to 31 px on an angled corner. Touching both segments is the
  // property that cannot be faked.
  const distToLine=(p,a,u)=>Math.abs(u.ux*(p.y-a.y)-u.uy*(p.x-a.x));
  for(const [name,p] of [['road',ROAD],['forest',FOREST],['outpost',OUTPOST],['zigzag',ZIGZAG]]){
    const path=buildRoadPath(p);
    const arcs=path.elements.filter(e=>e.kind==='arc');
    assert.equal(arcs.length,path.corners.length,`${name}: one arc per corner, in order`);
    path.corners.forEach((c,n)=>{
      const a=p[c.index-1],b=p[c.index],d=p[c.index+1];
      const unit=(q,r)=>{const l=Math.hypot(r.x-q.x,r.y-q.y);return{ux:(r.x-q.x)/l,uy:(r.y-q.y)/l};};
      const u1=unit(a,b),u2=unit(b,d);
      const arc=arcs[n];
      // `c` is the VERTEX (that is what the deviation measure needs); the arc
      // carries the centre. The centre must be exactly one radius from both
      // segments - touching only the first is what the wrong formula did.
      assert.ok(Math.abs(distToLine(arc.c,b,u1)-c.radius)<1e-9,
        `${name} corner ${c.index}: centre is one radius from the incoming segment`);
      assert.ok(Math.abs(distToLine(arc.c,b,u2)-c.radius)<1e-9,
        `${name} corner ${c.index}: and one radius from the outgoing one`);
      assert.equal(arc.r,c.radius,`${name} corner ${c.index}: the arc uses the corner radius`);
      // Both tangent points sit INSIDE their segment, never beyond a vertex.
      const onSeg=(t,q,r)=>{
        const l=Math.hypot(r.x-q.x,r.y-q.y),k=((t.x-q.x)*(r.x-q.x)+(t.y-q.y)*(r.y-q.y))/(l*l);
        return k>=-1e-9&&k<=1+1e-9;
      };
      assert.ok(onSeg(arc.start,a,b),`${name} corner ${c.index}: the arc starts on the incoming segment`);
      assert.ok(onSeg(arc.end,b,d),`${name} corner ${c.index}: and ends on the outgoing one`);
      // The interior angle relation, checked independently of the code under test.
      const interior=Math.acos(Math.max(-1,Math.min(1,-u1.ux*u2.ux-u1.uy*u2.uy)));
      const tanLen=Math.hypot(arc.start.x-b.x,arc.start.y-b.y);
      assert.ok(Math.abs(tanLen-c.radius/Math.tan(interior/2))<1e-9,
        `${name} corner ${c.index}: tangent length is r/tan(interior/2), not r*tan(interior/2)`);
      assert.ok(Math.abs(arc.len-c.radius*(Math.PI-interior))<1e-9,
        `${name} corner ${c.index}: the sweep is the heading change`);
    });
  }
});

test('offset curves are gap-free at every bend, for every offset the art uses',()=>{

  // This is the defect that was measured on the shipped painter: each segment
  // offset itself along its own normal, so neighbouring ruts ended and started
  // 15*sqrt(2) = 21.2 px apart. Reproduce the OLD gap first, then prove the new
  // one is exactly zero - otherwise the test could pass by never having been
  // about anything.
  const p=ROAD;
  let oldGap=0;
  for(let i=1;i<p.length-1;i++){
    const a=p[i-1],b=p[i],c=p[i+1];
    const n1=(()=>{const l=Math.hypot(b.x-a.x,b.y-a.y);return{x:-(b.y-a.y)/l,y:(b.x-a.x)/l};})();
    const n2=(()=>{const l=Math.hypot(c.x-b.x,c.y-b.y);return{x:-(c.y-b.y)/l,y:(c.x-b.x)/l};})();
    for(const d of [15]){
      const end={x:b.x+n1.x*d,y:b.y+n1.y*d},start={x:b.x+n2.x*d,y:b.y+n2.y*d};
      oldGap=Math.max(oldGap,Math.hypot(end.x-start.x,end.y-start.y));
    }
  }
  assert.ok(Math.abs(oldGap-21.213)<.01,`the segment-wise offset really did tear by ${oldGap.toFixed(1)} px`);

  for(const [name,path_] of [['road',ROAD],['forest',FOREST],['outpost',OUTPOST],['zigzag',ZIGZAG]]){
    const base=buildRoadPath(path_);
    for(const d of OFFSETS)for(const side of [-1,1]){
      const off=base.offset(d*side);
      assert.ok(off.elements.length>0,`${name} offset ${d*side} produces a path`);
      const gap=continuityGap(off);
      assert.ok(gap<1e-9,`${name} offset ${d*side}: gap ${gap} px must be zero (was ${oldGap.toFixed(1)})`);
      assert.ok(off.length>0,`${name} offset ${d*side} has arclength`);
    }
  }
});

test('an offset keeps the arc concentric and shifts the straights parallel',()=>{
  const base=buildRoadPath(ROAD);
  for(const d of [13,15,23]){
    const off=base.offset(d);
    const arcs=base.elements.filter(e=>e.kind==='arc');
    const offArcs=off.elements.filter(e=>e.kind==='arc');
    assert.equal(offArcs.length,arcs.length,'one offset arc per centreline arc');
    for(let i=0;i<arcs.length;i++){
      assert.deepEqual({x:offArcs[i].c.x,y:offArcs[i].c.y},{x:arcs[i].c.x,y:arcs[i].c.y},
        'the offset arc shares its centre - that is what makes it parallel');
      assert.equal(offArcs[i].a0,arcs[i].a0,'and its angles, so it stays tangent');
      assert.equal(offArcs[i].ccw,arcs[i].ccw,'and its direction');
      const expected=arcs[i].r-d*arcs[i].turn;
      assert.ok(Math.abs(offArcs[i].r-expected)<1e-9,`radius ${offArcs[i].r} is r-d*turn`);
    }
    // Total length changes exactly as geometry says it must: each arc gains or
    // loses d * sweep, the straights keep their length.
    const sweep=arcs.reduce((s,a)=>s+a.turn*a.delta,0);
    assert.ok(Math.abs(off.length-(base.length-d*sweep))<1e-6,'the offset arclength is exact');
  }
});

test('arclength sampling is continuous through the bends',()=>{
  for(const [name,p] of [['road',ROAD],['forest',FOREST],['outpost',OUTPOST]]){
    const path=buildRoadPath(p);
    assert.ok(Math.abs(path.length-path.elements.reduce((s,e)=>s+e.len,0))<1e-9,'length is the sum of its elements');
    const start=path.at(0),end=path.at(path.length);
    assert.ok(Math.hypot(start.x-p[0].x,start.y-p[0].y)<1e-9,`${name}: at(0) is the spawn point`);
    const last=p[p.length-1];
    assert.ok(Math.hypot(end.x-last.x,end.y-last.y)<1e-6,`${name}: at(length) is the bunker`);
    // Walk in 1 px steps: consecutive samples may never be further apart than
    // the step, otherwise something jumped over a corner.
    let prev=path.at(0),worst=0;
    for(let s=1;s<=path.length;s+=1){
      const cur=path.at(s);
      worst=Math.max(worst,Math.hypot(cur.x-prev.x,cur.y-prev.y));
      prev=cur;
    }
    assert.ok(worst<1.02,`${name}: sampling never jumps (worst step ${worst.toFixed(3)} px)`);
  }
});

test('the tangent turns smoothly through a fillet instead of snapping at the vertex',()=>{
  const path=buildRoadPath(ROAD);
  let prev=path.at(0).angle,worstTurn=0;
  for(let s=.5;s<=path.length;s+=.5){
    const cur=path.at(s).angle;
    let d=Math.abs(cur-prev);
    if(d>Math.PI)d=Math.PI*2-d;
    worstTurn=Math.max(worstTurn,d);
    prev=cur;
  }
  // On the raw polyline a 90 degree corner changes heading by 90 degrees in one
  // step. Spread over the fillet at half a pixel sampling it must stay tiny.
  assert.ok(worstTurn<0.05,`heading changes by at most ${(worstTurn*180/Math.PI).toFixed(2)} degrees per half pixel`);
});

test('decorations placed by arclength leave no hole at a corner',()=>{
  // Sleepers stopped 4 px before a vertex and restarted 9 px after it: a 13 px
  // gap across every bend, with no sleeper spanning it. Pebbles left 38 px.
  // Walking the smoothed path by distance cannot do that, because a corner is
  // now ordinary distance like any other - and the marks that land on an arc
  // element are the proof, since a per-segment loop can never produce one.
  for(const [name,p] of [['road',ROAD],['forest',FOREST],['outpost',OUTPOST]]){
    const path=buildRoadPath(p);
    const arcs=path.elements.filter(e=>e.kind==='arc');
    assert.ok(arcs.length>=path.corners.length-1,`${name}: one arc per corner`);
    const coverage=new Map();
    for(const step of [11,17,44]){
      const marks=[];
      const placed=path.walk(step,sample=>marks.push(sample),{inset:9,outset:4});
      assert.equal(placed,marks.length,`${name}/${step}: walk reports what it placed`);
      assert.ok(marks.length>4,`${name}/${step}: the walk places marks`);
      for(let i=1;i<marks.length;i++){
        const gap=marks[i].s-marks[i-1].s;
        assert.ok(gap<=step+1e-6,`${name}/${step}: marks are evenly spaced (gap ${gap.toFixed(2)})`);
        assert.ok(gap>0,`${name}/${step}: no mark is placed twice at the same distance`);
      }
      // Every mark carries the geometry its decoration needs: a position and a
      // heading, so a sleeper can be drawn across the road instead of along it.
      for(const m of marks.slice(0,5)){
        assert.ok(Number.isFinite(m.x)&&Number.isFinite(m.y)&&Number.isFinite(m.angle),
          `${name}/${step}: a mark is a usable point with a heading`);
      }
      const onArc=marks.filter(m=>m.element.kind==='arc');
      assert.ok(onArc.length>0,
        `${name}/${step}: ${onArc.length} marks land inside the bends - the old per-segment loops placed none`);
      // A bend longer than the step cannot be skipped; a shorter one may be,
      // which is not a hole but arithmetic (`forest`'s clamped 15 px fillets are
      // only 23.6 px long, so a 44 px sleeper spacing legitimately steps over
      // them). Across the spacings the artwork actually uses, every bend is hit.
      for(const a of arcs){
        if(a.len>step)assert.ok(marks.some(m=>m.element===a),
          `${name}/${step}: a ${(a.len).toFixed(1)} px bend is longer than the step and must get a mark`);
      }
      coverage.set(step,arcs.filter(a=>marks.some(m=>m.element===a)).length);
    }
    assert.ok(coverage.get(11)>=arcs.length-1&&coverage.get(17)>=arcs.length-1,
      `${name}: a fine spacing reaches every bend (${coverage.get(11)},${coverage.get(17)} of ${arcs.length})`);
  }
});

test('an offset wider than the bend stays continuous through the cusp',()=>{
  // A decoration standing 35 px out crosses the inside of a 34 px bend: the true
  // parallel curve doubles back on itself. The first version answered that with
  // a chord and tore 1.75 px at each such corner; the exact circle keeps the
  // offset gap-free and marks the element as a cusp so callers can tell.
  const base=buildRoadPath(ROAD);
  for(const d of [35,-35]){
    const off=base.offset(d);
    assert.ok(continuityGap(off)<1e-9,`offset ${d} on road is gap-free`);
    const cusps=off.elements.filter(e=>e.cusp);
    assert.ok(cusps.length>0,`offset ${d} reports the corners it doubles back through`);
    assert.ok(cusps.length<off.elements.filter(e=>e.kind==='arc').length+1,'and not every corner is singular');
    for(const a of off.elements.filter(e=>e.kind==='arc'))
      assert.ok(a.r>0&&Number.isFinite(a.len)&&a.len>0,`arc radius ${a.r} stays usable`);
  }
  // The road's own continuous layers live inside the bend radius, so they never
  // meet a cusp: that is the invariant the artwork has to respect.
  for(const d of OFFSETS.filter(v=>v<34)){
    assert.equal(base.offset(d).elements.some(e=>e.cusp),false,`offset ${d} is cusp-free`);
  }
});

test('a soldier on the sharp polygon still stands on the asphalt',()=>{
  // The simulation walks the exact polygon; the ribbon is smoothed. The vertex
  // therefore strays from the centreline by r*(1/sin(delta/2)-1). The driving
  // surface is 60 px wide in the rebuilt painter, so half of it is 30 px: the
  // stray has to stay clearly inside that or a unit would visibly walk on grass.
  assert.ok(Math.abs(cornerDeviation(34,Math.PI/2)-14.08)<.02,'a 90 degree bend at radius 34 strays 14.08 px');
  for(const id of Object.keys(MAPS)){
    const {deviation,at,corners}=maxCentrelineDeviation(getMap(id).path);
    assert.ok(corners>=6,`${id} measured over its corners`);
    assert.ok(deviation<30,`${id}: worst stray ${deviation.toFixed(2)} px at ${at.x}/${at.y} stays inside the 30 px half-width`);
    // Cross-check the closed form against a direct measurement of the built path.
    const path=buildRoadPath(getMap(id).path);
    let sampled=0;
    for(const c of path.corners){
      let best=Infinity;
      for(let s=0;s<=path.length;s+=.5){
        const q=path.at(s);
        best=Math.min(best,Math.hypot(q.x-c.x,q.y-c.y));
      }
      sampled=Math.max(sampled,best);
    }
    assert.ok(Math.abs(sampled-deviation)<.6,`${id}: closed form ${deviation.toFixed(2)} matches measurement ${sampled.toFixed(2)}`);
  }
});

test('a bigger radius is refused before it would push units off the road',()=>{
  // Guard for a future "make the curves rounder" request: the deviation grows
  // linearly with the radius, and this is the number that decides the limit.
  for(const r of [40,50,60,72]){
    const d=cornerDeviation(r,Math.PI/2);
    assert.ok(Math.abs(d-r*(Math.SQRT2-1))<1e-9,`radius ${r} strays ${d.toFixed(2)} px`);
  }
  assert.ok(cornerDeviation(72,Math.PI/2)>29.7,'radius 72 would reach the edge of the 60 px surface');
  assert.ok(buildRoadPath(ROAD,{radius:72}).corners.every(c=>c.radius<=72),'the builder honours a larger request without overshooting');
});

test('bad input cannot throw',()=>{
  const bad=[null,undefined,[],[{x:1,y:2}],[{x:NaN,y:1},{x:2,y:2}],[{x:1,y:1},{x:1,y:1}],
    [{x:1,y:1},null,{x:9,y:9}],'not-an-array',[{x:1,y:1},{x:1,y:1},{x:1,y:1}]];
  for(const input of bad){
    assert.doesNotThrow(()=>buildRoadPath(input,'road'),'buildRoadPath must survive '+JSON.stringify(input));
    const path=buildRoadPath(input);
    assert.doesNotThrow(()=>path.offset(15));
    assert.doesNotThrow(()=>path.walk(10,()=>{}));
    assert.doesNotThrow(()=>path.at(0));
    assert.doesNotThrow(()=>path.emit({moveTo(){},lineTo(){},arc(){}}));
    assert.doesNotThrow(()=>maxCentrelineDeviation(input));
  }
  assert.equal(buildRoadPath([]).length,0,'an empty path has no length');
  assert.equal(buildRoadPath([{x:1,y:2}]).elements.length,0,'a single point draws nothing');
});

test('a radius of zero reproduces the raw polygon exactly',()=>{
  // The fallback for anyone who wants the old crisp look back, and a check that
  // smoothing is additive rather than a rewrite of the geometry.
  const path=buildRoadPath(ROAD,{radius:0});
  assert.equal(path.corners.length,0,'no corner is rounded');
  assert.equal(path.elements.every(e=>e.kind==='line'),true,'only straight runs remain');
  let raw=0;
  for(let i=1;i<ROAD.length;i++)raw+=Math.hypot(ROAD[i].x-ROAD[i-1].x,ROAD[i].y-ROAD[i-1].y);
  assert.ok(Math.abs(path.length-raw)<1e-9,'the length is the polygon length');
  assert.ok(continuityGap(path)<1e-9,'and it is still continuous');
});
