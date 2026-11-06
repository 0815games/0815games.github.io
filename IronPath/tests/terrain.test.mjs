// Terrain effects on generated maps: range, damage, speed, ice and the drawn
// battlefield. Both halves search the seeded map ids for the themes they need.

import {drawCartoonBattle} from '../cartoon-art.mjs';
import {getMap} from '../maps.mjs';
import {createPlayer} from '../match.mjs';
import {createPartyHost} from '../party-host.mjs';
import {STEP, createMatch, stepMatch} from '../simulation.mjs';
import {TERRAIN_BRIEFINGS, distanceToRoad, enemySpeedFactor, iceDamage, soldierSpeedFactor, targetingRange, terrainFor, weaponDamageFactor} from '../terrain.mjs';
import {strict as assert} from 'node:assert';

// ---- from terrain.test.mjs ----
{
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
}

// ---- from terrain-expanded.test.mjs ----
{
const maps={};for(let i=0;Object.keys(maps).length<5&&i<20000;i++){const m=getMap(`g2-${(Math.imul(i,2654435761)>>>0).toString(16).padStart(8,'0')}`);maps[m.theme]??=m;}
assert.equal(Object.keys(maps).length,5);
const p=id=>createPlayer(id,{name:id,gender:'female'},900,20);
assert.equal(enemySpeedFactor('forest',{kind:'runner',segment:3}),1.15);assert.equal(enemySpeedFactor('forest',{kind:'infantry',segment:3}),1.15);assert.equal(enemySpeedFactor('forest',{kind:'plane',segment:3}),1);assert.equal(enemySpeedFactor('forest',{kind:'runner',segment:2}),1);
assert.equal(enemySpeedFactor('marsh',{kind:'tank',segment:7}),.5);
const enemy={x:100,y:100,segment:3};assert.equal(weaponDamageFactor('urban',enemy,120),.75);assert.equal(weaponDamageFactor('urban',enemy,120,{rubbleCleared:true}),1);assert.equal(weaponDamageFactor('urban',{...enemy,segment:2},120,{rubbleCleared:true}),.75);
assert.equal(targetingRange('scrub',100,enemy,[],{clouds:[{x:100,y:100,life:1}]}),75);assert.equal(targetingRange('scrub',100,enemy,[],{sniper:true,clouds:[{x:100,y:100,life:1}]}),100);assert.equal(targetingRange('scrub',100,enemy,[],{clouds:[{x:100,y:100,life:0}]}),100);
{
 const m=maps.scrub,s=createMatch([p('solo')],m.id);s.wave=1;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.enemies=[{kind:'tank',x:100,y:130,segment:1,hp:100,maxHp:100,speed:20,reward:1,damage:1}];stepMatch(s);
 assert.equal(s.dustClouds.length,1);const saved=structuredClone(s.dustClouds[0]);s.enemies=[];for(let i=0;i<30;i++)stepMatch(s);assert.ok(s.dustClouds.some(c=>c.life>0));assert.equal(targetingRange('scrub',100,{x:saved.x,y:saved.y},[],{clouds:s.dustClouds}),75);
 for(let i=0;i<35;i++)stepMatch(s);assert.equal(s.dustClouds.length,0,'clouds disappear after two seconds');
}
{
 const m=maps.urban,s=createMatch([p('solo')],m.id);s.wave=1;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.rubbleDamage=195;s.towers=[{type:3,level:1,pad:0,timer:0,ownerId:'solo'}];const pad=m.pads[0];s.enemies=[{kind:'infantry',x:pad.x+120,y:pad.y,segment:3,hp:1000,maxHp:1000,speed:0,reward:1,damage:1}];
 const first=stepMatch(s);assert.ok(first.some(e=>e.type==='rubbleCleared'));assert.equal(s.rubbleCleared,true);assert.equal(s.rubbleDamage,200);assert.ok(Math.abs(s.enemies[0].hp-(1000-45*1.3*.75))<1e-8,'the breaking hit is still obstructed');
 s.towers[0].timer=0;const before=s.enemies[0].hp;stepMatch(s);assert.ok(Math.abs(before-s.enemies[0].hp-45*1.3)<1e-8,'later hits ignore rubble in the cleared zone');
 const hostState=createMatch([p('host'),p('guest')],m.id);hostState.rubbleCleared=true;hostState.rubbleDamage=200;const host=createPartyHost(hostState,{hostId:'host'});host.setPresence('host',true);host.setPresence('guest',true);host.advance();host.setPresence('guest',false);host.advance();host.setPresence('guest',true);assert.equal(host.snapshotFor('guest').match.rubbleCleared,true);
}
{
 const m=maps.urban,s=createMatch([p('solo')],m.id);s.wave=1;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.towers=[{type:3,level:1,pad:0,timer:0,ownerId:'solo'}];const pad=m.pads[0];s.enemies=[{kind:'infantry',x:pad.x+100,y:pad.y,segment:3,hp:1,maxHp:1,speed:0,reward:1,damage:1}];stepMatch(s);assert.equal(s.rubbleDamage,1,'overkill cannot artificially destroy cover');
}
// Illustrations and labels communicate zones and their changing state.
for(const theme of ['urban','forest']){
 const m=maps[theme],state=createMatch([p('solo')],m.id),labels=[];if(theme==='urban')state.rubbleCleared=true;
 const ctx=new Proxy({}, {get(target,key){if(key in target)return target[key];if(key==='fillText')return text=>labels.push(text);return ()=>{};},set(target,key,value){target[key]=value;return true;}});
 drawCartoonBattle(ctx,state,{path:m.path,pads:m.pads,types:[{color:'#000'}],me:'solo',getTowerRange:()=>0,theme});assert.ok(labels.includes(theme==='forest'?'AMBUSH TRAIL':'RUBBLE CLEARED'));
}
console.log('Expanded terrain hazards, targeting, cover, rendering and reconnect passed.');

// Legacy fixed forest maps must not show a zone that has no gameplay effect.
{const m=getMap('forest'),state=createMatch([p('solo')],m.id),labels=[];const ctx=new Proxy({}, {get(target,key){if(key in target)return target[key];if(key==='fillText')return text=>labels.push(text);return ()=>{};},set(target,key,value){target[key]=value;return true;}});drawCartoonBattle(ctx,state,{path:m.path,pads:m.pads,types:[{color:'#000'}],me:'solo',getTowerRange:()=>0,theme:m.theme});assert.ok(!labels.includes('AMBUSH TRAIL'));}
}
