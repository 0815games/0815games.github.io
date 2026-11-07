import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {MAPS,getMap,isMapId,createRandomMapId,sectorOf,SECTOR_SPECS} from '../maps.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createPartyHost} from '../party-host.mjs';

test('generated maps are laid out, simulated, snapshotted and reconnected identically',async()=>{
const player=id=>createPlayer(id,{name:id,gender:'female',level:1},850,450);
const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};
assert.deepEqual(Object.keys(MAPS),['road','forest','outpost']);assert.equal(isMapId('__proto__'),false);assert.throws(()=>createMatch([player('a')],'bad'),/Invalid map/);assert.equal(getMap('bad').id,'road');
for(const map of Object.values(MAPS)){
 assert.equal(map.pads.length,10);assert.deepEqual(map.path.at(-1),{x:900,y:400});assert.equal(map.path[0].x,0);
 for(const [i,p] of map.pads.entries()){
  assert.ok(p.x>=25&&p.x<=935&&p.y>=25&&p.y<=515,`${map.id} pad in bounds`);
  for(const [j,q] of map.pads.entries())if(j>i)assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=60,`${map.id} pads do not overlap`);
  for(let j=1;j<map.path.length;j++)assert.ok(distance(p,map.path[j-1],map.path[j])>=58,`${map.id} pad ${i} is clear of the road`);
 }
 const s=createMatch([player('a')],map.id);assert.equal(s.mapId,map.id);assert.ok(applyCommand(s,'a',{type:'build',pad:0,towerType:0}).ok);
 s.wave=1;s.running=true;s.spawnLeft=1;s.spawnTimer=0;stepMatch(s);assert.ok(Math.hypot(s.enemies[0].x-map.path[0].x,s.enemies[0].y-map.path[0].y)<3);
 s.enemies=[{kind:'infantry',x:map.pads[0].x,y:map.pads[0].y,hp:100,maxHp:100,speed:0,segment:1,reward:8}];s.spawnTimer=100;s.towers[0].timer=0;stepMatch(s);assert.ok(s.enemies[0].hp<100,`${map.id} towers fire from the chosen pad coordinates`);
 const pair=createMatch([player('host'),player('guest')],map.id),host=createPartyHost(pair,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);assert.equal(host.snapshotFor('guest').match.mapId,map.id);host.setPresence('guest',false);host.advance();host.setPresence('guest',true);assert.equal(host.snapshotFor('guest').match.mapId,map.id);
}
console.log('Map layout, simulation, snapshot and reconnect tests passed.');
// Generated routes are reproducible and valid, not merely a choice of three maps.
const paths=new Set();let first;
for(let i=0;i<2000;i++){
 const id=`gen-${i.toString(16).padStart(8,'0')}`,map=getMap(id);assert.equal(isMapId(id),true);assert.equal(map.pads.length,10);assert.deepEqual(map.path.at(-1),{x:900,y:400});
 paths.add(JSON.stringify(map.path));if(i===0)first=structuredClone(map);
 assert.deepEqual([map.pads.filter(p=>p.x<300).length,map.pads.filter(p=>p.x>=300&&p.x<600).length,map.pads.filter(p=>p.x>=600).length],[3,3,4]);
 for(const [index,p] of map.pads.entries()){
  assert.ok(p.x>=25&&p.x<=935&&p.y>=25&&p.y<=515);
  assert.ok(Math.hypot(p.x-900,p.y-400)>=70);
  for(const q of map.pads.slice(index+1))assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=68);
  for(let j=1;j<map.path.length;j++)assert.ok(distance(p,map.path[j-1],map.path[j])>=62);
 }
 const state=createMatch([player('host'),player('guest')],id),host=createPartyHost(state,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);if(i===1999){host.setPresence('guest',false);host.advance();host.setPresence('guest',true);assert.equal(host.snapshotFor('guest').match.mapId,id);}
}
assert.ok(paths.size>1500,'generated seeds must produce a wide variety of roads');assert.deepEqual(getMap('gen-00000000'),first,'regenerating an evicted seed is deterministic');
assert.equal(isMapId('gen-abcdefgh'),false);assert.equal(isMapId('gen-000000000'),false);

const fixedRandom={getRandomValues(bytes){bytes[0]=0;return bytes;}};
assert.equal(createRandomMapId(undefined,fixedRandom),'g3-000000000');
assert.equal(createRandomMapId('g3-000000000',fixedRandom),'g3-000000001','restarts cannot reuse the immediately previous seed');
assert.equal(createRandomMapId(undefined,fixedRandom,3),'g3-200000000','the sector rides in the id');
assert.equal(isMapId('g3-00000000'),false);assert.equal(isMapId('g3-0000000000'),false);assert.equal(isMapId('g3-0000000g'),false);assert.equal(isMapId('g3-'),false);

const themes=new Set(),roads=new Set();let saved;
for(let i=0;i<3000;i++){
 const id=`g2-${(Math.imul(i,2654435761)>>>0).toString(16).padStart(8,'0')}`, map=getMap(id);
 if(!i)saved=structuredClone(map);
 themes.add(map.theme);roads.add(JSON.stringify(map.path));
 assert.equal(map.path.length,10);assert.deepEqual(map.path.at(-1),{x:900,y:400});assert.equal(map.pads.length,10);
 assert.deepEqual([map.pads.filter(p=>p.x<300).length,map.pads.filter(p=>p.x>=300&&p.x<600).length,map.pads.filter(p=>p.x>=600).length],[3,3,4]);
 for(const [j,p] of map.pads.entries()){
  const d=Math.min(...map.path.slice(1).map((b,k)=>distance(p,map.path[k],b)));
  assert.ok(d>=62&&d<=82,`${id}: pad ${j} roadside distance ${d}`);
  assert.ok(p.x>=25&&p.x<=935&&p.y>=25&&p.y<=515);
  assert.ok(Math.hypot(p.x-900,p.y-400)>=75);
  for(const q of map.pads.slice(j+1))assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=68);
 }
}
assert.equal(themes.size,5);assert.ok(roads.size>2900);assert.deepEqual(getMap('g2-00000000'),saved);
const newState=createMatch([player('host'),player('guest')],'g2-12345678'),newHost=createPartyHost(newState,{hostId:'host'});
newHost.setPresence('host',true);newHost.setPresence('guest',true);newHost.setPresence('guest',false);newHost.advance();newHost.setPresence('guest',true);
assert.deepEqual(getMap(newHost.snapshotFor('guest').match.mapId),getMap('g2-12345678'));
});

test('grid-walk sector maps: a fresh road every seed, valid in every sector',()=>{
const player=id=>createPlayer(id,{name:id,gender:'female',level:1},850,450);
const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
for(const [index,spec] of SECTOR_SPECS.entries()){
 const sector=index+1,unique=new Set();let multi=0;const edges=new Set();
 for(let i=0;i<120;i++){
  const id=`g3-${index.toString(16)}${(Math.imul(i+1,2654435761)>>>0).toString(16).padStart(8,'0')}`,map=getMap(id);
  assert.equal(isMapId(id),true);assert.equal(map.sector,sector);assert.equal(sectorOf(id),sector);
  assert.equal(map.width,spec.width);assert.equal(map.height,spec.height);assert.equal(map.pads.length,spec.pads);
  const paths=map.paths||[map.path];
  assert.ok(paths.length>=1&&paths.length<=spec.roads,`${id} road count`);
  if(paths.length>1)multi++;
  // Reported: start and end are random. The road begins OUTSIDE the field on
  // any of the four borders (enemies pour in through the border) and it ALWAYS
  // ends in the bunker - every single road of a multi-road field.
  const start=map.path[0],outside=start.x<0?'W':start.x>map.width?'E':start.y<0?'N':start.y>map.height?'S':null;
  assert.ok(outside,`${id} road starts outside the field`);
  assert.ok(start.x<=-40||start.x>=map.width+40||start.y<=-40||start.y>=map.height+40,`${id} entry reaches past the border`);
  edges.add(outside);
  for(const road of paths)assert.deepEqual(road.at(-1),map.bunker,`${id} road ends in the bunker`);
  // The bunker keeps its distance from every edge so gate and sprite always
  // sit fully on the field, whatever the seed rolls.
  assert.ok(map.bunker.x>=140&&map.bunker.x<=map.width-140&&map.bunker.y>=140&&map.bunker.y<=map.height-140,`${id} bunker clear of the borders`);
  let length=0;
  for(const road of paths)for(let j=1;j<road.length;j++){
   length+=Math.hypot(road[j].x-road[j-1].x,road[j].y-road[j-1].y);
   assert.ok(road[j].x>=-60&&road[j].x<=map.width+60&&road[j].y>=-60&&road[j].y<=map.height+60,`${id} road in bounds`);
  }
  assert.ok(length>=map.width*1.2,`${id} road meanders (x${(length/map.width).toFixed(2)})`);
  let far=0;
  for(const [j,p] of map.pads.entries()){
   const d=paths.reduce((min,road)=>Math.min(min,...road.slice(1).map((b,k)=>distance(p,road[k],b))),Infinity);
   if(d>92)far++;
   assert.ok(d>=62&&d<=120,`${id} pad ${j} sits at the road: ring 62-92, rare fallback to 120 (${Math.round(d)})`);
   assert.ok(p.x>=25&&p.x<=map.width-25&&p.y>=25&&p.y<=map.height-25,`${id} pad in bounds`);
   assert.ok(Math.hypot(p.x-map.bunker.x,p.y-map.bunker.y)>=78,`${id} pad clear of the bunker`);
   for(const q of map.pads.slice(j+1))assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=68,`${id} pads do not overlap`);
  }
  for(const d of map.deco){
   assert.ok(d.x>=20&&d.x<=map.width-20&&d.y>=20&&d.y<=map.height-20,`${id} building in bounds`);
   const r=paths.reduce((min,road)=>Math.min(min,...road.slice(1).map((b,k)=>distance(d,road[k],b))),Infinity);
   assert.ok(r>=40,`${id} building off the tar (${Math.round(r)})`);
   assert.ok(map.pads.every(p=>Math.hypot(p.x-d.x,p.y-d.y)>=58),`${id} building clear of pads`);
   assert.ok(Math.hypot(d.x-map.bunker.x,d.y-map.bunker.y)>=95,`${id} building clear of the bunker`);
  }
  assert.ok(far<=1,`${id} at most one pad may fall outside the roadside ring (${far})`);
  assert.ok(map.deco.length>=spec.gates+Math.round(spec.ruins*.5),`${id} carries buildings`);
  unique.add(JSON.stringify(map.path));
 }
 assert.ok(unique.size>=118,`sector ${sector}: seeds produce distinct roads (${unique.size}/120)`);
 assert.equal(edges.size,4,`sector ${sector}: starts use all four borders (${[...edges].join(',')})`);
 if(spec.roads>1)assert.ok(multi>=90,`sector ${sector}: most fields carry both roads (${multi}/120)`);
}
// Deterministic under cache eviction, and snapshots carry the id untouched.
const once=getMap('g3-119e3779b1');
assert.deepEqual(getMap('g3-119e3779b1'),once);
const pair=createMatch([player('host'),player('guest')],'g3-1096af9a3'),host=createPartyHost(pair,{hostId:'host'});
host.setPresence('host',true);host.setPresence('guest',true);host.setPresence('guest',false);host.advance();host.setPresence('guest',true);
assert.equal(host.snapshotFor('guest').match.mapId,'g3-1096af9a3');
assert.deepEqual(getMap(host.snapshotFor('guest').match.mapId),getMap('g3-1096af9a3'));
console.log('Grid-walk sector maps passed.');
});
