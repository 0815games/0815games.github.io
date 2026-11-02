import {strict as assert} from 'node:assert';
import {MAPS,getMap,isMapId} from '../maps.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createPartyHost} from '../party-host.mjs';
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
