// Road and rail centreline geometry: one smooth ribbon instead of a chain of
// straight bars.
//
// Why this module exists. The battlefield paths are orthogonal zigzags: every
// map turns at exactly 90 degrees (`road` six times, `forest` and `outpost`
// eight times). The painter used to stroke that raw polyline and decorate it
// segment by segment, which is invisible on a straight and wrong at every bend.
// Measured on the shipped maps, before this module:
//
//   * the wheel ruts tore apart by 21.2 px at every corner - each segment
//     offset itself along its OWN normal, so two neighbouring ruts ended and
//     started 15*sqrt(2) px apart (255 px of gap on `road`, 339 px on `forest`);
//   * the twin rails cut every corner by 13.0 px - the polyline ran through
//     `vertex + n1*13` instead of the miter point `vertex + (n1+n2)*13`;
//   * sleepers left a 13 px gap and pebbles a 38 px gap across every bend,
//     because their loops stopped short of the vertex and nothing spanned it;
//   * the body itself grew a quarter-disc bulge of radius 43 px at each corner
//     (`lineWidth` 86 with `lineJoin='round'`), and on `forest` a 30 px stub -
//     shorter than the road is wide - disappeared completely inside the two
//     bulges around it.
//
// The fix is not another loop with tighter margins. It is to describe the road
// ONCE, as a tangent-continuous sequence of straight lines and circular fillet
// arcs, and to derive every layer and every decoration from that description:
//
//   * an offset curve (ruts, rails, kerb lines) of a line is a parallel line,
//     and of an arc is the CONCENTRIC arc with radius r-d. Both meet exactly at
//     the tangent point, so an offset can never tear, kink or double back;
//   * arclength is exact on both element kinds, so sleepers, pebbles, planks
//     and track stamps can be placed by true distance and oriented by the true
//     tangent - they now fan through a bend instead of stopping before it.
//
// Presentation only. The simulation keeps walking the exact original polygon
// (`PATH[e.segment]` in `simulation.mjs`), and this module never receives or
// returns game state. A rounded ribbon therefore has to stay wide enough that
// a soldier on the sharp polygon is still standing on asphalt: at a 90 degree
// fillet the polygon vertex sits `r*(sqrt(2)-1)` off the smoothed centreline,
// which is 14.1 px for the shipped radius of 34 px - well inside the 30 px
// half-width of the 60 px driving surface. `tests/road-geometry.test.mjs` pins
// that bound so a future radius bump cannot silently push units off the road.
//
// Orthogonal maps are the common case, not an assumption: every formula here is
// written for an arbitrary deflection angle, and `tests/road-design.test.mjs`
// drives the painter with a zigzag that turns at 74, 85 and 87 degrees.

// A corner is rounded as far as the shorter of its two neighbouring segments
// allows, halved so that two fillets sharing one short segment meet tangentially
// at its midpoint instead of overlapping. On `forest` that turns the 30 px stub
// into a clean S-bend of two 15 px arcs rather than a blob.
export const DEFAULT_CORNER_RADIUS=34;
const MIN_CORNER_RADIUS=.5;
const EPS=1e-9;

function finitePoint(p){
  return p&&typeof p==='object'&&Number.isFinite(p.x)&&Number.isFinite(p.y);
}

// Drop anything that is not a usable coordinate, then collapse repeats: a zero
// length segment has no direction, and every formula below divides by one.
function clean(points){
  if(!Array.isArray(points))return [];
  const out=[];
  for(const p of points){
    if(!finitePoint(p))continue;
    const last=out[out.length-1];
    if(last&&Math.hypot(p.x-last.x,p.y-last.y)<EPS)continue;
    out.push({x:p.x,y:p.y});
  }
  return out;
}

function lineElement(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  if(len<EPS)return null;
  return {kind:'line',a,b,ux:dx/len,uy:dy/len,len};
}

// Insert a circular fillet of radius r at vertex v, arriving along unit vector
// u1 and leaving along unit vector u2. Both are given in the segment-descriptor
// shape (`ux`/`uy`) that `buildRoadPath` already carries, so there is exactly
// one vector convention in this file and no chance of mixing them up again.
// Returns the tangent points, the centre, the arc angles and the sweep - or null
// when the two directions are (nearly) collinear, in which case there is nothing
// to round.
function fillet(v,u1,u2,r){
  const dot=Math.max(-1,Math.min(1,u1.ux*u2.ux+u1.uy*u2.uy));
  const delta=Math.acos(dot);                 // heading change, 0 = straight, PI = U-turn
  if(delta<1e-4)return null;                  // collinear: there is no corner to round
  const cross=u1.ux*u2.uy-u1.uy*u2.ux;        // sign of the turn
  if(Math.abs(cross)<EPS)return null;
  const turn=cross>0?1:-1;
  // The interior angle at the vertex is PI-delta, and the tangent length of a
  // fillet is r/tan(interior/2) = r*tan(delta/2). Getting this the other way
  // round (r/tan(delta/2)) is indistinguishable at delta=90 degrees - which is
  // every corner on every shipped map - and wrong by tens of pixels anywhere
  // else, so it is written out here rather than left to intuition.
  const t=r*Math.tan(delta/2);                // tangent distance from the vertex
  const T1={x:v.x-u1.ux*t,y:v.y-u1.uy*t};
  const T2={x:v.x+u2.ux*t,y:v.y+u2.uy*t};
  // The centre sits on the inner bisector, r away from both segments. The inner
  // side is the left normal of u1 for a positive turn and its mirror otherwise.
  const n1={x:-u1.uy*turn,y:u1.ux*turn};
  const c={x:T1.x+n1.x*r,y:T1.y+n1.y*r};
  const a0=Math.atan2(T1.y-c.y,T1.x-c.x);
  // Deriving the end angle from the sweep (instead of from T2) keeps the arc on
  // the short way round whatever the floating point says about T2.
  const a1=a0+turn*delta;
  return {kind:'arc',c,r,a0,a1,ccw:turn<0,turn,len:r*delta,start:T1,end:T2,delta};
}

// The shared description of one road: straight runs and corner fillets, in
// order, tangent-continuous from the first point to the last.
function makePath(elements,corners){
  const length=elements.reduce((s,e)=>s+e.len,0);
  // Exact position and heading at arclength s. Decorations use this instead of
  // walking raw segments, which is why nothing gaps at a bend any more.
  function at(s){
    const total=length;
    if(total<=0)return null;
    const target=Math.max(0,Math.min(total,s));
    let walked=0;
    for(const e of elements){
      if(target<=walked+e.len||e===elements[elements.length-1]){
        const local=target-walked;
        if(e.kind==='line'){
          return {x:e.a.x+e.ux*local,y:e.a.y+e.uy*local,angle:Math.atan2(e.uy,e.ux),
            element:e,local,s:target,arcLength:total};
        }
        const dir=e.ccw?-1:1;
        const theta=e.a0+dir*(local/e.r);
        const tangent=theta+(e.ccw?-Math.PI/2:Math.PI/2);
        return {x:e.c.x+Math.cos(theta)*e.r,y:e.c.y+Math.sin(theta)*e.r,angle:tangent,
          element:e,local,s:target,arcLength:total};
      }
      walked+=e.len;
    }
    return null;
  }
  const path={
    elements,
    corners,
    length,
    start:elements.length?elements[0].a:null,
    end:elements.length?(elements[elements.length-1].kind==='line'
      ?elements[elements.length-1].b:elements[elements.length-1].end):null,
    at,
    // Walk by true arclength. `inset`/`outset` keep decorations away from the
    // open ends without ever opening a hole at a corner: the corner is part of
    // the same continuous distance now.
    walk(step,visit,{inset=0,outset=0}={}){
      if(!(step>0)||typeof visit!=='function'||length<=0)return 0;
      const from=Math.max(0,Math.min(inset,length)),to=Math.max(from,length-Math.max(0,outset));
      let count=0;
      for(let s=from;s<=to+EPS;s+=step){
        const sample=at(s);
        if(sample){visit(sample,count++);if(count>100000)break;}
      }
      return count;
    },
    // Lay this path into the current canvas subpath. Arcs are emitted as real
    // arcs, so a bend costs one curve command instead of a pile of short
    // segments - fewer operations AND no visible faceting.
    emit(ctx){
      if(!elements.length||typeof ctx?.moveTo!=='function')return false;
      const first=elements[0].a;
      ctx.moveTo(first.x,first.y);
      for(const e of elements){
        if(e.kind==='line')ctx.lineTo(e.b.x,e.b.y);
        else ctx.arc(e.c.x,e.c.y,e.r,e.a0,e.a1,e.ccw);
      }
      return true;
    },
    // The parallel curve at signed distance d (positive = left of travel).
    // Lines shift along their normal, arcs keep their centre and change radius,
    // so the result is tangent-continuous by construction: this is the function
    // that ends the 21.2 px tears in the wheel ruts and the 13 px corner cuts
    // in the rails, for any offset the artwork asks for.
    offset(d){
      const shift=Number.isFinite(d)?d:0;
      if(Math.abs(shift)<EPS)return makePath(elements.slice(),corners.slice());
      const next=[],nextCorners=[];
      for(const e of elements){
        if(e.kind==='line'){
          const nx=-e.uy*shift,ny=e.ux*shift;
          const el=lineElement({x:e.a.x+nx,y:e.a.y+ny},{x:e.b.x+nx,y:e.b.y+ny});
          if(el)next.push(el);
          continue;
        }
        // The centre lies on the left for a positive turn, so moving left shrinks
        // the radius and moving right grows it.
        const r2=e.r-shift*e.turn;
        if(Math.abs(r2)<=EPS){
          // The offset passes exactly through the centre of this bend: the
          // parallel curve degenerates to a single point. Emitting nothing is
          // the continuous answer - the two neighbouring offset lines both end
          // at that very point, so no gap can appear. Flooring the radius to
          // some minimum here (as the first version did) invented a 0.75 px
          // step where geometry says there is none.
          continue;
        }
        if(r2>0){
          next.push({kind:'arc',c:e.c,r:r2,a0:e.a0,a1:e.a1,ccw:e.ccw,turn:e.turn,
            len:r2*e.delta,
            start:{x:e.c.x+Math.cos(e.a0)*r2,y:e.c.y+Math.sin(e.a0)*r2},
            end:{x:e.c.x+Math.cos(e.a1)*r2,y:e.c.y+Math.sin(e.a1)*r2},delta:e.delta});
        }else{
          // The offset is wider than this bend on this side, so the exact
          // parallel curve doubles back through itself. It is STILL a circle
          // about the same centre: radius |r2| with both angles turned by PI,
          // travelled the same way round. Written like that the offset stays
          // position-continuous - the earlier version substituted a chord here
          // and tore a 1.75 px gap at every such corner, which is precisely the
          // defect this module exists to end. The tangent does reverse (a cusp),
          // because that is the true shape; only decorations standing further
          // out than the corner is wide ever reach this branch. Continuous road
          // layers - ruts, edge lines, guardrails - must stay inside the radius.
          const rr=-r2;
          const a0=e.a0+Math.PI,a1=e.a1+Math.PI;
          next.push({kind:'arc',c:e.c,r:rr,a0,a1,ccw:e.ccw,turn:e.turn,len:rr*e.delta,cusp:true,
            start:{x:e.c.x+Math.cos(a0)*rr,y:e.c.y+Math.sin(a0)*rr},
            end:{x:e.c.x+Math.cos(a1)*rr,y:e.c.y+Math.sin(a1)*rr},delta:e.delta});
        }
      }
      // The corner table describes the CENTRELINE, so it is carried along
      // unchanged: an offset path is still the same road, seen from the kerb.
      for(const c of corners)nextCorners.push({...c});
      return makePath(next,nextCorners);
    },
    // Sampled polyline, for anything that needs plain points (tests, hit marks).
    sample(step=6){
      const out=[];
      if(length<=0)return out;
      const dist=Math.max(.5,Number.isFinite(step)?step:6);
      for(let s=0;s<length;s+=dist){const p=at(s);if(p)out.push({x:p.x,y:p.y,angle:p.angle});}
      const last=at(length);
      if(last)out.push({x:last.x,y:last.y,angle:last.angle});
      return out;
    },
  };
  return path;
}

// Build the smoothed description of one road or rail.
//
// `radius` is the WANTED corner radius. Each corner gets
// `min(radius, (shorterNeighbour / 2) / tan(delta / 2))`, so a short segment can
// never be swallowed by the two corners around it and two fillets on one
// segment always meet at its midpoint.
export function buildRoadPath(points,{radius=DEFAULT_CORNER_RADIUS}={}){
  const pts=clean(points);
  const wanted=Number.isFinite(radius)?Math.max(0,radius):DEFAULT_CORNER_RADIUS;
  if(pts.length<2)return makePath([],[]);
  if(pts.length===2||wanted<MIN_CORNER_RADIUS){
    const elements=[];
    for(let i=1;i<pts.length;i++){const el=lineElement(pts[i-1],pts[i]);if(el)elements.push(el);}
    return makePath(elements,[]);
  }
  const segments=[];
  for(let i=1;i<pts.length;i++){
    const dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y,len=Math.hypot(dx,dy);
    segments.push({len,ux:dx/len,uy:dy/len});
  }
  const elements=[],corners=[];
  let cursor={x:pts[0].x,y:pts[0].y};
  for(let i=1;i<pts.length-1;i++){
    const u1=segments[i-1],u2=segments[i],v=pts[i];
    const dot=Math.max(-1,Math.min(1,u1.ux*u2.ux+u1.uy*u2.uy));
    const delta=Math.acos(dot);
    const cross=u1.ux*u2.uy-u1.uy*u2.ux;
    const available=Math.min(u1.len,u2.len)/2;
    // The tangent run a corner eats is r*tan(delta/2), so the radius that fits
    // into the usable straight run is available/tan(delta/2). A near-hairpin
    // (delta -> PI) drives that to zero, which is right: no circle of any size
    // can turn a U-bend without swallowing both neighbouring segments.
    const tanHalf=Math.tan(delta/2);
    const fits=tanHalf>EPS?available/tanHalf:0;
    const r=Math.max(0,Math.min(wanted,fits));
    if(r<MIN_CORNER_RADIUS||Math.abs(cross)<EPS||delta<1e-4){
      const el=lineElement(cursor,v);
      if(el)elements.push(el);
      cursor={x:v.x,y:v.y};
      continue;
    }
    const f=fillet(v,u1,u2,r);
    if(!f){
      const el=lineElement(cursor,v);
      if(el)elements.push(el);
      cursor={x:v.x,y:v.y};
      continue;
    }
    const el=lineElement(cursor,f.start);
    if(el)elements.push(el);
    elements.push(f);
    corners.push({index:i,x:v.x,y:v.y,radius:r,delta,turn:cross>0?1:-1,
      tangentIn:f.start,tangentOut:f.end,centre:{x:f.c.x,y:f.c.y}});
    cursor={x:f.end.x,y:f.end.y};
  }
  const tail=lineElement(cursor,pts[pts.length-1]);
  if(tail)elements.push(tail);
  return makePath(elements,corners);
}

// How far the smoothed centreline strays from the polygon the simulation walks.
// A bend is only honest while this stays well inside the road's half width, so
// the value is exposed rather than buried: the guard test compares it against
// the driving surface and fails before a soldier would visibly leave the asphalt.
//
// Closed form, not sampled: the fillet centre sits at distance r/cos(delta/2)
// from the vertex (the interior angle is PI-delta), and the arc's nearest point
// to that vertex is one radius closer. So the vertex ends up
// r*(1/cos(delta/2) - 1) off the smoothed centreline - 14.08 px for a 90 degree
// bend at radius 34, where cos(45) is 1/sqrt(2) and this becomes r*(sqrt(2)-1).
export function cornerDeviation(radius,delta){
  const r=Number.isFinite(radius)?Math.max(0,radius):0;
  const d=Number.isFinite(delta)?delta:0;
  const cos=Math.cos(d/2);
  if(!(r>0)||!(cos>EPS))return 0;
  return r*(1/cos-1);
}

// The worst such stray across a real map path, with the corner it came from.
// Diagnostic and test helper: it rebuilds the path, so it is not for per-frame use.
export function maxCentrelineDeviation(points,{radius=DEFAULT_CORNER_RADIUS}={}){
  const path=buildRoadPath(points,{radius});
  let worst=0,worstAt=null;
  for(const c of path.corners){
    const d=cornerDeviation(c.radius,c.delta);
    if(d>worst){worst=d;worstAt={x:c.x,y:c.y,index:c.index,radius:c.radius};}
  }
  return {deviation:worst,at:worstAt,length:path.length,corners:path.corners.length};
}
