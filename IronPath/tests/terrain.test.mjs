import {strict as assert} from 'node:assert';
import {getMap} from '../maps.mjs';
import {createMatch,stepMatch,STEP} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
import {createPartyHost} from '../party-host.mjs';
import {terrainFor,targetingRange,weaponDamageFactor,soldierSpeedFactor,enemySpeedFactor,iceDamage,distanceToRoad,TERRAIN_BRIEFINGS} from '../terrain.mjs';
const maps={};for(let i=0;Object.keys(maps).length<5&&i<10000;i++){const id=`g2-${(Math.imul(i,2654435761)>>>0).toString(16).padStart(8,'0')}`;const map=getMap(id);maps[map.theme]??=map;}
assert.equal(Object.keys(maps).length,5);
assert.equal(terrainFor(getMap('forest')),null);assert.equal(terrainFor(getMap('gen-00000000')),null);
const infantry={kind:'infantry',x:120,y:130,hp:100},tank={kind:'tank',x:100,y:130,hp:100,segment:5};
assert.equal(targetingRange('scrub',100,infantry,[tank]),75);assert.equal(targetingRange('scrub',100,infantry,[tank],{sniper:true}),100);assert.equal(targetingRange('scrub',100,infantry,[{...tank,hp:0}]),100);assert.equal(targetingRange('scrub',100,{...infantry,x:200},[tank]),100);
assert.equal(weaponDamageFactor('forest',infantry,40),.8);assert.equal(weaponDamageFactor('forest',infantry,40,{recon:true}),1);assert.equal(weaponDamageFactor('forest',tank,40),1);
assert.equal(weaponDamageFactor('urban',tank,110),1);assert.equal(weaponDamageFactor('urban',tank,111),.75);
assert.equal(weaponDamageFactor('marsh',infantry,101),.8);assert.equal(weaponDamageFactor('marsh',infantry,100),1);assert.equal(enemySpeedFactor('marsh',tank),.75);assert.equal(enemySpeedFactor('marsh',infantry),1);
assert.equal(iceDamage('arctic',tank,1),10);assert.equal(iceDamage('arctic',{...tank,segment:4},1),0);assert.equal(iceDamage('arctic',{...tank,kind:'plane'},1),0);
const path=maps.arctic.path;assert.equal(distanceToRoad(path[0],path),0);assert.equal(soldierSpeedFactor('arctic',path[0],path),1);assert.equal(soldierSpeedFactor('arctic',{x:900,y:20},path),.75);
const player=id=>createPlayer(id,{name:id,gender:'female'},900,20);
for(const [theme,map] of Object.entries(maps)){
 assert.ok(TERRAIN_BRIEFINGS[theme]);
 const s=createMatch([player('a')],map.id);s.wave=1;s.running=true;s.spawnLeft=0;s.enemies=[{...tank,x:map.path[4].x+10,y:map.path[4].y,speed:0,maxHp:100,reward:17,damage:20}];
 stepMatch(s);assert.ok(Math.abs(s.enemies[0].hp-(100-(theme==='arctic'?10*STEP:0)))<1e-8,`${theme} ice effect`);
 const pair=createMatch([player('host'),player('guest')],map.id),host=createPartyHost(pair,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);host.advance();host.setPresence('guest',false);host.advance();host.setPresence('guest',true);const view=host.snapshotFor('guest').match;assert.equal(terrainFor(getMap(view.mapId)),theme);
}
// Verify damage is applied by the real tower firing path, not just the helper.
for(const theme of ['forest','urban','marsh']){
 const map=maps[theme],s=createMatch([player('a')],map.id),pad=map.pads[0];s.wave=1;s.running=true;s.spawnLeft=0;s.towers=[{type:3,pad:0,level:1,timer:0,ownerId:'a'}];
 s.enemies=[{kind:'infantry',x:pad.x+120,y:pad.y,hp:1000,maxHp:1000,speed:0,segment:1,reward:8,damage:10}];stepMatch(s);
 const expected=45*1.3*(theme==='urban'?.75:.8);assert.ok(Math.abs(s.enemies[0].hp-(1000-expected))<1e-8,`${theme} modifies actual tower damage`);
}
console.log('Terrain mechanics, real combat, legacy maps and co-op reconnect passed.');
// End-to-end targeting in dust and movement in snow/mud.
{
 const map=maps.scrub,s=createMatch([player('a')],map.id),pad=map.pads[0];s.wave=1;s.running=true;s.towers=[{type:0,pad:0,level:1,timer:0,ownerId:'a'}];s.enemies=[{kind:'tank',x:pad.x+110,y:pad.y,hp:1000,maxHp:1000,speed:0,segment:1,reward:1,damage:1}];stepMatch(s);assert.equal(s.enemies[0].hp,1000,'dust prevents out-of-range MG firing');
 s.towers[0].type=3;stepMatch(s);assert.ok(s.enemies[0].hp<1000,'sniper ignores dust');
}
{
 const s=createMatch([player('a')],maps.arctic.id);s.players.a.direction={x:-1,y:0};stepMatch(s);assert.ok(Math.abs(s.players.a.x-(900-150*.75*STEP))<1e-8);
 const map=maps.marsh,m=createMatch([player('a')],map.id);m.running=true;m.wave=1;m.enemies=[{kind:'tank',x:map.path[0].x,y:map.path[0].y,hp:100,maxHp:100,speed:32,segment:1,reward:1,damage:1}];stepMatch(m);assert.ok(Math.abs(m.enemies[0].x-32*.75*STEP)<1e-8);
}
