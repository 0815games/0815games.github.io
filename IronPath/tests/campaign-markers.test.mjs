// Mission-objective placement (reported on Act I mission 6, The List):
// the dressing station sat in the dead top-left corner with its OBJECTIVE
// label drawn off the canvas, and the "field hospital" to protect resolved
// 501px away - two camps for one hospital. Pins the placement contract:
// shared landmarks resolve to one point, road/entry anchors keep their whole
// marker on the canvas, and the renderer clamps the plate for field spots.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {CAMPAIGN} from '../campaign.mjs';
import {getMap} from '../maps.mjs';

const roadDistance=(p,path)=>{let m=1e9;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)):0;m=Math.min(m,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));}return m;};
// The marker draws its plate 48px left/right and 61px above the point, the
// health bar 50px below (game.js). A road-anchored objective must fit all of
// that on the canvas; field spots keep the balance-validated grid and the
// renderer clamps their plate instead (pinned below).
const fits=(stage,map)=>stage.x>=64&&stage.x<=map.width-64&&stage.y>=67&&stage.y<=map.height-52;

test('The List is one camp: the dressing station IS the field hospital',()=>{
  const mission=CAMPAIGN.find(m=>m.id==='the-list');
  assert.ok(mission,'The List is act I mission 6');
  const [station,hospital,evacuation]=mission.stages;
  assert.equal(station.x,hospital.x,'the station and the hospital share one anchor');
  assert.equal(station.y,hospital.y,'the station and the hospital share one anchor');
  const map=getMap(mission.mapId);
  assert.ok(roadDistance(hospital,map.path)<100,'the shared camp stays contestable for the protect stage');
  assert.ok(roadDistance(station,map.path)<=110,'the shared camp stays contested for the secure stage');
  assert.ok(fits(station,map)&&fits(hospital,map),'the camp keeps its whole marker on the canvas');
  assert.deepEqual([evacuation.x,evacuation.y],[map.bunker.x,map.bunker.y],'the wounded still walk to the bunker');
});

test('road and entry objectives keep their whole marker on the canvas',()=>{
  for(const mission of CAMPAIGN){
    const map=getMap(mission.mapId);
    for(const [index,stage] of mission.stages.entries()){
      if(['defend','eliminate'].includes(stage.type))continue;
      // Road-anchored stages (entry, junctions, convoys, the bunker the road
      // ends at) sit ON the road; the resolver scans for fittable points now.
      if(roadDistance(stage,map.path)<30)
        assert.ok(fits(stage,map),`${mission.id} stage ${index+1} (${stage.label}) draws its plate inside the canvas`);
    }
  }
});

test('the marker renderer clamps its label plate for edge field spots',()=>{
  const src=readFileSync(new URL('../game.js',import.meta.url),'utf8');
  // Near the top edge the plate flips below the ring; the x clamps inward.
  assert.match(src,/plateBelow=point\.y<67/,'the plate flips below the ring near the top edge');
  assert.match(src,/plateX=Math\.max\(50,Math\.min\(logicalWidth-50,point\.x\)\)/,'the plate clamps horizontally');
  assert.match(src,/plateY=plateBelow\?point\.y\+56:point\.y-61/,'the plate sits above the ring everywhere else');
});
