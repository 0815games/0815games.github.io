// IPL-0132 Weg-Fahnen: checkpoint flags lining the enemy route. They are
// pure terrain art - the tests pin the geometry contract (paired, 36 px off
// the smoothed centreline, arclength spacing with spawn/bunker insets), the
// deterministic paint (same path + seed = identical picture), the red/cream
// alternation, and the shipped density on a campaign road.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawPathFlags} from '../core/cartoon-art.mjs';
import {buildRoadPath} from '../core/road-geometry.mjs';
import {getMap} from '../core/maps.mjs';

function recorder(){
  const calls=[];
  const ctx={fillStyle:null,strokeStyle:null,lineWidth:null};
  for(const op of ['save','restore','translate','beginPath','moveTo','lineTo','closePath','ellipse','arc'])
    ctx[op]=(...a)=>calls.push([op,...a]);
  ctx.stroke=()=>calls.push(['stroke',ctx.strokeStyle]);
  ctx.fill=()=>calls.push(['fill',ctx.fillStyle]);
  return {ctx,calls};
}

const translates=calls=>calls.filter(c=>c[0]==='translate');

test('path flags stand in pairs 36 px off the centreline, deterministically',()=>{
  const path=[{x:0,y:270},{x:900,y:270}];
  const a=recorder(),b=recorder();
  drawPathFlags(a.ctx,path);
  drawPathFlags(b.ctx,path);
  assert.deepEqual(a.calls,b.calls,'same path + seed paints the identical picture');

  const moves=translates(a.calls);
  // arclength 125 px, inset 70 (spawn), outset 90 (bunker): marks at
  // 70,195,320,445,570,695 - six marks, two flags each.
  assert.equal(moves.length,12);
  const ys=[...new Set(moves.map(m=>m[2]))].sort((p,q)=>p-q);
  assert.deepEqual(ys,[234,306],'36 px left and right of y=270');
  for(let i=0;i<moves.length;i+=2)assert.equal(moves[i][1],moves[i+1][1],'a mark carries both sides');

  const cloths=a.calls.filter(c=>c[0]==='fill'&&(c[1]==='#c9553f'||c[1]==='#f1e7c4')).map(c=>c[1]);
  assert.equal(cloths.length,12);
  for(let i=0;i<cloths.length;i+=2)assert.notEqual(cloths[i],cloths[i+1],'every mark alternates red and cream');
});

test('the forest campaign road gets the full flag line at shoulder distance',()=>{
  const path=getMap('forest').path;
  const run=()=>{const r=recorder();drawPathFlags(r.ctx,path,0);return r;};
  const first=run(),second=run();
  assert.deepEqual(first.calls,second.calls,'terrain paint is reproducible');

  const moves=translates(first.calls);
  assert.equal(moves.length,22,'eleven marks, both sides - the route reads as an avenue');

  // Every flag sits exactly on the +/-36 shoulder ring of the SMOOTHED
  // centreline - never on the 30 px driving surface, never inside the
  // +/-14.1 px unit corridor.
  const road=buildRoadPath(path);
  const centre=[];
  road.walk(2,s=>centre.push([s.x,s.y]));
  for(const m of moves){
    let min=Infinity;
    for(let i=1;i<centre.length;i++){
      const [ax,ay]=centre[i-1],[bx,by]=centre[i];
      const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((m[1]-ax)*dx+(m[2]-ay)*dy)/(dx*dx+dy*dy||1)));
      min=Math.min(min,Math.hypot(m[1]-(ax+t*dx),m[2]-(ay+t*dy)));
    }
    // Straight stretches measure exactly 36; at the sharpest bends the
    // shortest distance to the polyline dips to ~30.6 (corner geometry).
    // The pole centre therefore never stands ON the 30 px driving surface,
    // and every flag stays far outside the +/-14.1 px unit corridor.
    assert.ok(min>=30&&min<=36.5,`flag at ${m[1]},${m[2]} stands ${min.toFixed(1)} px off the centreline`);
  }
});

test('degenerate paths paint nothing',()=>{
  const {ctx,calls}=recorder();
  drawPathFlags(ctx,[]);
  drawPathFlags(ctx,[{x:5,y:5}]);
  assert.equal(calls.length,0);
});
