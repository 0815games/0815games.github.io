import {test} from 'node:test';
import {strict as assert} from 'node:assert';
// Stage 3 of the map rework: sector fields carry marked patches (thin ice,
// deep bog, rubble, ambush trail, dust) whose rules key off the enemy's
// POSITION, not fixed path indices - one field can mix several terrains.
import {getMap,zoneAt,SECTOR_SPECS} from '../maps.mjs';
import {createMatch,stepMatch,STEP} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
import {enemySpeedFactor,iceDamage,weaponDamageFactor} from '../terrain.mjs';

const player=(id='local')=>createPlayer(id,{name:id,gender:'female',level:1},850,450);
const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
const roadDistance=(p,paths)=>Math.min(...paths.flatMap(path=>path.slice(1).map((b,i)=>distance(p,path[i],b))));
const seed=i=>`g3-0${(Math.imul(i+1,2654435761)>>>0).toString(16).padStart(8,'0')}`;

test('every sector field carries valid marked patches on the road',()=>{
 for(let i=0;i<150;i++){
  const map=getMap(seed(i)),paths=map.paths||[map.path];
  const expected=[1,2,2,3][map.sector-1];
  assert.equal(map.zones.length,expected,`${map.id} zone count`);
  const kinds=new Set();
  for(const zone of map.zones){
   assert.ok(['ice','bog','rubble','ambush','dust'].includes(zone.kind),`${map.id} kind`);
   kinds.add(zone.kind);
   assert.ok(zone.r>=78&&zone.r<=94,`${map.id} radius`);
   assert.ok(zone.x>=70&&zone.x<=map.width-70&&zone.y>=70&&zone.y<=map.height-70,`${map.id} bounds`);
   assert.ok(roadDistance(zone,paths)<=1,`${map.id} patch sits on the road`);
   assert.ok(Math.hypot(zone.x-map.bunker.x,zone.y-map.bunker.y)>=170,`${map.id} clear of the bunker`);
   for(const other of map.zones)if(other!==zone)assert.ok(Math.hypot(zone.x-other.x,zone.y-other.y)>=260,`${map.id} patches spaced`);
  }
  assert.equal(kinds.size,map.zones.length,'patch kinds are distinct');
  assert.equal(zoneAt(map,map.zones[0].x,map.zones[0].y).id,map.zones[0].id,'zoneAt finds the patch');
  assert.equal(zoneAt(map,20,20),null,'zoneAt ignores open ground');
 }
});

test('zone rules: speed, ice and cover key off the position, not the path index',()=>{
 const tank={kind:'tank'},runner={kind:'runner'},plane={kind:'plane'};
 assert.equal(enemySpeedFactor(null,tank,{kind:'bog'}),.5,'bog halves tanks');
 assert.equal(enemySpeedFactor(null,tank,{kind:'ice',broken:true}),.75,'broken ice slows tanks');
 assert.equal(enemySpeedFactor(null,tank,{kind:'ice'}),1,'intact ice does not slow tanks');
 assert.equal(enemySpeedFactor(null,runner,{kind:'ambush'}),1.15,'ambush trail speeds scouts');
 assert.equal(enemySpeedFactor(null,plane,{kind:'ambush'}),1,'aircraft ignore the trail');
 assert.equal(iceDamage(null,tank,1,false,{kind:'ice'}),10,'intact ice burns tanks');
 assert.equal(iceDamage(null,tank,1,false,{kind:'ice',broken:true}),20,'broken ice burns harder');
 assert.equal(iceDamage(null,runner,1,false,{kind:'ice'}),0,'ice ignores scouts');
 assert.equal(weaponDamageFactor(null,runner,50,{zoneInfo:{kind:'ambush'}}),.8,'forest cover');
 assert.equal(weaponDamageFactor(null,runner,50,{recon:true,zoneInfo:{kind:'ambush'}}),1,'recon sees through cover');
 assert.equal(weaponDamageFactor(null,runner,150,{zoneInfo:{kind:'bog'}}),.8,'reeds beyond 100');
 assert.equal(weaponDamageFactor(null,runner,90,{zoneInfo:{kind:'bog'}}),1,'reeds only far out');
 assert.equal(weaponDamageFactor(null,tank,130,{zoneInfo:{kind:'rubble'}}),.75,'rubble weakens far fire');
 assert.equal(weaponDamageFactor(null,tank,130,{zoneInfo:{kind:'rubble',cleared:true}}),1,'cleared rubble is gone');
 assert.equal(weaponDamageFactor(null,tank,90,{zoneInfo:{kind:'rubble'}}),1,'rubble only far fire');
 // Legacy behaviour is untouched: g2 themes still rule by segment.
 assert.equal(enemySpeedFactor('marsh',{kind:'tank',segment:7}),.5);
 assert.equal(weaponDamageFactor('forest',{kind:'infantry'},50,{}),.8);
});

test('dust, ice and rubble act in the simulation, per patch',()=>{
 const find=kind=>{for(let i=0;i<400;i++){const map=getMap(seed(i));if(map.zones.some(z=>z.kind===kind))return map;}return null;};
 const tankIn=(state,zone)=>{state.enemies=[{kind:'tank',hp:100,maxHp:100,speed:40,segment:1,reward:8,x:zone.x,y:zone.y}];state.spawnTimer=100;};

 const dustMap=find('dust');
 assert.ok(dustMap,'a seed with a dust patch exists');
 const dustState=createMatch([player()],dustMap.id),dustZone=dustMap.zones.find(z=>z.kind==='dust');
 dustState.wave=1;dustState.running=true;tankIn(dustState,dustZone);dustState.dustTimer=0;
 stepMatch(dustState);
 assert.ok(dustState.dustClouds.length>0,'a tank in the dust patch raises clouds');
 const outside=dustState.dustClouds;tankIn(dustState,{x:dustMap.bunker.x-200,y:dustMap.bunker.y});dustState.dustClouds=[];dustState.dustTimer=0;
 stepMatch(dustState);
 assert.equal(dustState.dustClouds.length,0,'tanks outside the patch raise nothing');

 const iceMap=find('ice');
 assert.ok(iceMap,'a seed with an ice patch exists');
 const iceState=createMatch([player()],iceMap.id),iceZone=iceMap.zones.find(z=>z.kind==='ice');
 iceState.wave=1;iceState.running=true;tankIn(iceState,iceZone);
 const hpBefore=iceState.enemies[0].hp;
 stepMatch(iceState);
 assert.ok(iceState.enemies[0].hp<hpBefore-0.1,`intact ice burns the tank (${(hpBefore-iceState.enemies[0].hp).toFixed(2)})`);
 assert.ok((iceState.zoneStress?.[iceZone.id]||0)>0,'the ice is under stress');
 iceState.zoneBroken={[iceZone.id]:true};
 const hpBroken=iceState.enemies[0].hp;
 stepMatch(iceState);
 assert.ok(hpBroken-iceState.enemies[0].hp>(hpBefore-hpBroken)*.9,'broken ice burns harder');

 const rubbleMap=find('rubble');
 assert.ok(rubbleMap,'a seed with a rubble patch exists');
 const rubbleState=createMatch([player()],rubbleMap.id),rubbleZone=rubbleMap.zones.find(z=>z.kind==='rubble');
 rubbleState.wave=1;
 const hero=rubbleState.players.local;
 hero.x=rubbleZone.x-130;hero.y=rubbleZone.y;
 rubbleState.enemies=[{kind:'tank',hp:100,maxHp:100,speed:0,segment:1,reward:8,x:rubbleZone.x,y:rubbleZone.y}];rubbleState.spawnTimer=100;
 hero.shotTimer=0;
 stepMatch(rubbleState);
 assert.ok(rubbleState.enemies[0].hp<100,'the hero fires');
 const dealt=100-rubbleState.enemies[0].hp;
 assert.ok(Math.abs(dealt-7.5)<.01,`rubble weakens the hero shot to 7.5 (got ${dealt.toFixed(2)})`);
 assert.ok((rubbleState.zoneDamage?.[rubbleZone.id]||0)>0,'the direct hit works the rubble');
 rubbleState.zoneCleared={[rubbleZone.id]:true};
 rubbleState.enemies[0].hp=100;hero.shotTimer=0;
 stepMatch(rubbleState);
 assert.ok(Math.abs(100-rubbleState.enemies[0].hp-10)<.01,'cleared rubble no longer weakens fire');
});
