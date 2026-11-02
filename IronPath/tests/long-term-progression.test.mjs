import {strict as assert} from 'node:assert';
import {readArmory,rewardWave,upgradeArmory,equipArmory,encodeLoadout,parseLoadout} from '../armory.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {serviceMedals} from '../service-record.mjs';
let a=readArmory({scrap:1000,fortify:0,plating:0,owned:63,equipped:1});
for(const wave of [14,16,18,20])a=rewardWave(a,wave);assert.equal(a.owned,1023);const duplicate=rewardWave(a,20);assert.equal(duplicate.scrap,a.scrap+20);
a=upgradeArmory(a,'supply');a=upgradeArmory(a,'safeguard');a=equipArmory(a,10);assert.equal(encodeLoadout(a),'0,0,10;0,0;1,1');assert.deepEqual(parseLoadout(encodeLoadout(a)),{fortify:0,plating:0,equipped:10,repair:0,gun:0,supply:1,safeguard:1});assert.equal(equipArmory({...a,owned:63},10),null);
assert.equal(serviceMedals({xp:999999,armory:a}).find(m=>m.name==='Full Arsenal').unlocked,true);
const player=(id,loadout='0,0,0',level=10)=>createPlayer(id,{name:id,gender:'male',level,loadout,skills:'1,0,0,0,0;assault'});
const duo=createMatch([player('a','0,0,9;0,0;1,2'),player('b','0,0,0;0,0;3,1')]);assert.equal(duo.supply,3);assert.equal(duo.safeguard,2);
for(const wave of [1,6]){const s=createMatch([player('a','0,0,9;0,0;3,0')]);s.wave=wave;s.running=true;s.spawnLeft=0;s.enemies=[];stepMatch(s);assert.equal(s.money,wave===1?145:162,'new rewards start only at wave 6');}
const inactive=createMatch([player('a','0,0,9;0,0;3,0'),player('b','0,0,9;0,0;0,0')]);inactive.wave=6;inactive.running=true;inactive.players.b.active=false;stepMatch(inactive);assert.equal(inactive.players.a.money,162);assert.equal(inactive.players.b.money,125);
for(const wave of [1,6]){const s=createMatch([player('a','0,0,7')]);s.wave=wave;s.enemies=[{hp:100}];assert.equal(applyCommand(s,'a',{type:'airstrike'}).ok,true);assert.equal(s.enemies[0].hp,wave===1?65:55);}
const low=createMatch([player('a','0,0,0',9)]);low.money=1000;assert.equal(applyCommand(low,'a',{type:'build',pad:0,towerType:0}).ok,true);assert.equal(applyCommand(low,'a',{type:'upgrade',pad:0}).ok,true);assert.equal(applyCommand(low,'a',{type:'upgrade',pad:0,branch:3}).ok,false);low.players.a.level=10;assert.equal(applyCommand(low,'a',{type:'upgrade',pad:0,branch:3}).ok,true);
console.log('Long-term equipment, bunker choices, unlocks and achievements passed.');
// New effects are deliberately inactive in the opening waves.
for(const wave of [1,6]){
 const s=createMatch([player('a','0,0,8')]);s.wave=wave;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.players.a.x=100;s.players.a.y=130;s.enemies=[{kind:'infantry',hp:1000,maxHp:1000,speed:0,segment:1,x:100,y:130}];stepMatch(s);assert.ok(Math.abs(s.players.a.shotTimer-(wave===1?.65:.585))<1e-9);
}
for(const wave of [1,6]){
 const s=createMatch([player('a','0,0,10')]);s.wave=wave;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.players.a.x=900;s.players.a.y=20;s.towers=[{id:1,pad:0,type:1,level:1,ownerId:'a',timer:0}];s.enemies=[{kind:'tank',hp:1000,maxHp:1000,speed:0,segment:1,x:105,y:210}];stepMatch(s);assert.ok(Math.abs(s.enemies[0].hp-(1000-34*1.6*(wave===1?1:1.1)))<1e-8);
}
for(const wave of [1,6]){
 const s=createMatch([player('a','0,0,0;0,0;0,3')]);s.wave=wave;s.hp=40;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.enemies=[{kind:'tank',hp:100,speed:0,segment:999,x:900,y:400,damage:10}];stepMatch(s);assert.ok(Math.abs(s.hp-(wave===1?30:30.6))<1e-9);
}
for(const boss of [false,true]){
 const s=createMatch([player('a')]);s.wave=5;s.running=true;s.spawnLeft=1;s.spawnTimer=100;s.players.a.x=900;s.players.a.y=20;s.towers=[{id:1,pad:0,type:1,level:3,branch:3,ownerId:'a',timer:0}];s.enemies=[{kind:'tank',...(boss?{boss:'bossJuggernaut',bossClock:0}:{}),hp:10000,maxHp:10000,speed:0,segment:1,x:105,y:210}];stepMatch(s);const dealt=10000-s.enemies[0].hp;assert.ok(Math.abs(dealt-34*1.6*1.6*(boss?1.5:1))<1,'Boss Hunter trades fire rate for boss damage');assert.ok(Math.abs(s.towers[0].timer-1.75)<1e-9);
}
