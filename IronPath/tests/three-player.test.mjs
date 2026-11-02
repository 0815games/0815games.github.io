import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createPlayer} from '../match.mjs';
import {createFourCoop,createTwoVsTwo} from '../four-modes.mjs';
import {createPartyHost} from '../party-host.mjs';
test('three players defend the large two-road map with separate supplies',()=>{
 const ids=['a','b','c'],players=ids.map((id,i)=>createPlayer(id,{name:id,gender:'female'},1200,200+i*30));
 const game=createFourCoop(players,'a');assert.equal(game.match.mapId,'four-front');assert.equal(Object.keys(game.members).length,3);assert.throws(()=>createTwoVsTwo(players,'a',[['a','b'],['c','d']]));
 const host=createPartyHost(game,{hostId:'a'});for(const id of ids)host.setPresence(id,true);
 let seq={a:1,b:1,c:1};function command(id,c){assert.equal(host.receive(id,{version:1,seq:seq[id]++,command:c}).status,'queued');return host.advance().commands[0].result;}
 assert.equal(command('c',{type:'build',pad:15,towerType:0}).ok,true);assert.equal(host.snapshotFor('a').match.match.players.c.money,75);assert.equal(host.snapshotFor('a').match.match.players.a.money,125);
 const request=command('a',{type:'startWave'});assert.equal(request.waitingForPlayers,true);assert.equal(command('b',{type:'approveWave',requestId:request.requestId}).ok,true);assert.equal(host.snapshotFor('a').match.match.wave,0);assert.equal(command('c',{type:'approveWave',requestId:request.requestId}).ok,true);assert.equal(host.snapshotFor('a').match.match.wave,1);
 for(let i=0;i<35;i++)host.advance();const enemies=host.snapshotFor('b').match.match.enemies;assert.deepEqual(enemies.slice(0,2).map(e=>e.road),[0,1]);
 host.setPresence('c',false);assert.equal(host.ready(),true);assert.equal(host.snapshotFor('a').match.match.players.c.active,false);
});
