import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {getMap} from '../maps.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createFourCoop,applyFourCommand,stepFour,SQUAD_MAP_POOL} from '../four-modes.mjs';

// Generated squad maps have two routes to the same bunker, and their numbers
// of waypoints differ. These cases deliberately straddle the primary route's
// endpoint so checking against the wrong route cannot accidentally pass.
function atRoad(mapId,segment,{hp=100}={}){
 const map=getMap(mapId),road=map.paths[1],point=road[Math.min(road.length-1,Math.max(0,segment-1))];
 const match=createMatch([createPlayer('alice',{name:'Alice',gender:'female'})],mapId);
 Object.assign(match,{running:true,wave:1,spawnLeft:0,enemies:[{kind:'infantry',hp,maxHp:100,speed:0,reward:8,damage:10,x:point.x,y:point.y,segment,road:1}]});
 Object.assign(match.players.alice,{x:point.x,y:point.y,shotTimer:0});
 return {match,road};
}

test('an enemy reaching the shorter second road damages the bunker, not an invisible waypoint',()=>{
 const map=getMap('g3-29e3779b1');assert.ok(map.paths[1].length<map.path.length);
 const {match}=atRoad(map.id,map.paths[1].length,{hp:1});stepMatch(match);
 assert.equal(match.hp,90,'the arrived enemy hits before a soldier can shoot beyond its road');
 assert.equal(match.enemies.length,0);assert.equal(match.running,false,'the cleared wave can finish');
});

test('an enemy on the longer second road remains targetable past the first road’s endpoint',()=>{
 const map=getMap('g3-3cc623a9b');assert.ok(map.paths[1].length>map.path.length);
 const {match,road}=atRoad(map.id,map.path.length);stepMatch(match);
 assert.equal(match.hp,100,'no premature bunker hit on the longer road');
 assert.equal(match.enemies.length,1);assert.ok(match.enemies[0].hp<100,'the soldier can still fire at it');
 Object.assign(match.enemies[0],{x:road.at(-1).x,y:road.at(-1).y,segment:road.length});stepMatch(match);
 assert.equal(match.hp,90);assert.equal(match.enemies.length,0);assert.equal(match.running,false);
});

test('bunker guns, towers and chained hits can still target the longer road',()=>{
 const map=getMap('g3-3cc623a9b'),segment=map.path.length;
 const gun=atRoad(map.id,segment).match;gun.players.alice.shotTimer=1e6;gun.gun=1;gun.gunTimer=0;
 stepMatch(gun);assert.ok(gun.enemies[0].hp<100,'bunker gun reaches the second road');assert.equal(gun.hp,100);
 const tower=atRoad(map.id,segment).match;const enemy=tower.enemies[0];
 const pad=map.pads.findIndex(p=>Math.hypot(p.x-enemy.x,p.y-enemy.y)<100);assert.ok(pad>=0);
 assert.equal(applyCommand(tower,'alice',{type:'build',pad,towerType:2}).ok,true);
 tower.players.alice.shotTimer=1e6;tower.runPerks={chain:1};tower.enemies.push({...enemy});stepMatch(tower);
 assert.equal(tower.enemies.length,2);assert.ok(tower.enemies.every(e=>e.hp<100),'both direct and chained hits reach the second road');assert.equal(tower.hp,100);
});

for(const count of [3,4])for(const mapId of SQUAD_MAP_POOL)test(`${count} players: wave one finishes on both roads of ${mapId}`,()=>{
 const players=['alice','bob','cara','dan'].slice(0,count).map(id=>createPlayer(id,{name:id,gender:'female'}));
 const state=createFourCoop(players,'alice',mapId);
 // No defenders: every one of the nine infantry must arrive at the bunker on
 // its own road. Nine hits leave ten HP, so the completed-wave receipt is
 // unambiguous; this exercises real spawn, movement and completion logic.
 for(const player of Object.values(state.match.players))player.shotTimer=1e6;
 assert.equal(applyFourCommand(state,'cara',{type:'startWave'}).ok,true);
 for(const player of players.filter(p=>p.id!=='cara'))assert.equal(applyFourCommand(state,player.id,{type:'approveWave',requestId:state.pending.id}).ok,true);
 let steps=0;while(state.match.running&&!state.match.ended&&steps++<5000)stepFour(state);
 assert.equal(state.match.ended,false);assert.equal(state.match.running,false);assert.equal(state.match.hp,10);
 assert.equal(state.match.enemies.length,0);assert.equal(state.match.spawnLeft,0);
 for(const player of Object.values(state.match.players))assert.equal(player.completedWaveMask&1,1);
});
