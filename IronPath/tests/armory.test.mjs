import {test} from 'node:test';
// Weapon store: the legacy readArmory() saves, loot caches, the shared bunker
// and the pre-match upgrades. These were two files because they were written
// months apart; they describe one contract, so they live together now. Each
// half keeps its own scope, so neither can shadow the other's fixtures.

import {encodeLoadout, equipArmory, parseLoadout, readArmory, rewardWave, upgradeArmory} from '../armory.mjs';
import {applyCommand, createPlayer} from '../match.mjs';
import {createMatch, stepMatch} from '../simulation.mjs';
import {strict as assert} from 'node:assert';

test('legacy saves move up the weapon store and pay duplicate items as scrap',async()=>{
let a=readArmory(null);assert.equal(a.scrap,0);assert.equal(upgradeArmory(a,'fortify'),null);assert.equal(equipArmory(a,1),null);
a=rewardWave(a,1);a=rewardWave(a,2);assert.equal(a.scrap,20);assert.equal(a.owned,1);a=rewardWave(a,2);assert.equal(a.scrap,40,'duplicate item grants bonus scrap');
a=upgradeArmory(a,'fortify');assert.equal(a.scrap,10);assert.equal(a.fortify,1);assert.equal(upgradeArmory(a,'fortify'),null);a=equipArmory(a,1);assert.equal(encodeLoadout(a),'1,0,1');assert.deepEqual(parseLoadout('4,0,1'),{fortify:0,plating:0,equipped:0});
const player=(id,loadout)=>createPlayer(id,{name:id,gender:'male',loadout},500,300);
const state=createMatch([player('a','1,1,2'),player('b','3,2,0')]);assert.equal(state.maxHp,140);assert.equal(state.plating,2,'highest player upgrade applies to shared bunker');
state.wave=1;state.running=true;state.spawnLeft=5;state.spawnTimer=100;state.enemies.push({hp:100,segment:8,x:900,y:400,speed:0,damage:10});stepMatch(state);assert.equal(state.hp,132);
for(let i=0;i<5;i++)state.enemies.push({hp:0,reward:2,segment:1,x:0,y:130,speed:0});state.players.b.active=false;const events=stepMatch(state);assert.equal(state.players.a.money,150);assert.equal(state.players.b.money,125,'absent teammate receives neither kills nor cache');assert.equal(state.players.a.lootCaches,1);assert.equal(state.players.b.lootCaches,0);assert.ok(events.some(e=>e.type==='lootDrop'));
const strong=createMatch([player('a','0,0,1')]);strong.wave=1;strong.running=true;strong.spawnLeft=1;strong.spawnTimer=100;strong.players.a.x=100;strong.players.a.y=130;strong.enemies.push({hp:100,kind:'infantry',segment:1,x:100,y:130,speed:0});stepMatch(strong);assert.equal(strong.enemies[0].hp,87,'scope adds damage');
console.log('Armory progression, loot, and shared bunker tests passed.');
});

test('later waves unlock the expanded gear, and the pre-match upgrades reach the field',async()=>{
const old={scrap:300,fortify:2,plating:1,owned:7,equipped:1};let a=readArmory(old);
assert.equal(a.scrap,300);assert.equal(a.fortify,2);assert.equal(a.repair,0);assert.equal(a.gun,0);assert.equal(encodeLoadout(a),'2,1,1');
a=upgradeArmory(a,'repair');a=upgradeArmory(a,'gun');assert.equal(a.scrap,240);assert.equal(encodeLoadout(a),'2,1,1;1,1');assert.deepEqual(parseLoadout('2,1,1;1,1'),{fortify:2,plating:1,equipped:1,repair:1,gun:1});
for(const wave of [8,10,12])a=rewardWave(a,wave);assert.equal(a.owned,63);assert.equal(equipArmory(a,6).equipped,6);const before=a.scrap;a=rewardWave(a,12);assert.equal(a.scrap,before+20);assert.equal(equipArmory({...a,owned:7},4),null);
assert.deepEqual(parseLoadout('1,1,11;1,1'),{fortify:0,plating:0,equipped:0});assert.equal(upgradeArmory({...a,repair:3},'repair'),null);
const p=(id,loadout,x=500,y=300,skills)=>createPlayer(id,{name:id,gender:'female',loadout,skills,level:10},x,y);
const solo=createMatch([p('solo','0,0,6;2,1')]);assert.equal(solo.money,150);assert.equal(solo.repair,2);assert.equal(solo.gun,1);
solo.wave=1;solo.running=true;solo.hp=80;solo.spawnLeft=1;solo.spawnTimer=100;solo.enemies=[{kind:'tank',hp:50,maxHp:50,speed:0,reward:10,damage:10,segment:7,x:800,y:400}];stepMatch(solo);assert.equal(solo.enemies[0].hp,45,'bunker gun attacks nearby enemy');stepMatch(solo);assert.equal(solo.enemies[0].hp,45,'bunker gun has a cooldown');
solo.enemies=[];solo.spawnLeft=0;stepMatch(solo);assert.equal(solo.hp,86,'repair applies once on wave clear');stepMatch(solo);assert.equal(solo.hp,86,'repair is not repeated between waves');
const pair=createMatch([p('a','0,0,6;1,3'),p('b','0,0,0;3,1')]);assert.equal(pair.repair,3);assert.equal(pair.gun,3);assert.equal(pair.players.a.money,150);assert.equal(pair.players.b.money,125);pair.players.b.active=false;assert.equal(pair.gun,3,'shared bunker keeps the strongest pre-match upgrade if guest leaves');
const scope=createMatch([p('p','0,0,4',100,130)]);scope.wave=1;scope.running=true;scope.spawnLeft=1;scope.spawnTimer=100;scope.enemies=[{kind:'infantry',hp:100,maxHp:100,reward:8,speed:0,segment:1,x:270,y:130}];stepMatch(scope);assert.equal(scope.enemies[0].hp,81,'binoculars extend soldier firing range');
const radio=createMatch([p('p','0,0,5',100,130,'0,2,0,0,0;engineer;0001000000')]);radio.wave=1;radio.running=true;radio.towers.push({id:1,pad:0,type:0,level:1,ownerId:'p'});assert.equal(applyCommand(radio,'p',{type:'airstrike'}).ok,true);assert.equal(radio.players.p.cooldown,21,'radio stacks with Rapid Orders');
console.log('Expanded armory legacy saves, combat and co-op checks passed.');
});
