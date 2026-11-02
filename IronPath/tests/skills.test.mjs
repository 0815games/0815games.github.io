import {strict as assert} from 'node:assert';
import {parseBuild,encodeBuild,pointsLeft} from '../skills.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
const player=(id,skills,level=10)=>createPlayer(id,{name:id,gender:'female',level,skills},100,130);
assert.equal(encodeBuild(parseBuild('3,0,0,0,0;recon',3)),'0,0,0,0,0;assault','overspending is ignored');
assert.equal(encodeBuild(parseBuild('invalid',10)),'0,0,0,0,0;assault');
assert.equal(pointsLeft(parseBuild('1,1,1,1,1;medic',10),10),4);
const a=player('a','1,1,1,1,1;logistics'),b=player('b','0,0,0,2,0;medic');
const state=createMatch([a,b]);assert.equal(state.hp,115);assert.equal(state.players.a.skills.recon,1);
assert.equal(applyCommand(state,'a',{type:'airstrike'}).ok,false,'no supply drops between waves');
state.running=true;state.wave=1;state.spawnLeft=10;state.spawnTimer=100;
assert.equal(applyCommand(state,'a',{type:'airstrike'}).ok,true);assert.equal(state.players.a.money,155);assert.equal(state.players.b.money,125);assert.equal(applyCommand(state,'a',{type:'airstrike'}).ok,false);
assert.equal(applyCommand(state,'b',{type:'airstrike'}).ok,false,'cannot repair full bunker');state.hp=110;assert.equal(applyCommand(state,'b',{type:'airstrike'}).ok,true);assert.equal(state.hp,115);
state.enemies.push({hp:0,reward:10,segment:1,x:0,y:130,speed:0});stepMatch(state);assert.equal(state.players.a.money,162);assert.equal(state.players.b.money,131,'logistics only benefits its owner');
const solo=createMatch([player('local','0,1,0,0,0;engineer')]);solo.running=true;solo.wave=1;solo.spawnLeft=5;solo.spawnTimer=100;
assert.equal(applyCommand(solo,'local',{type:'airstrike'}).ok,false);assert.equal(applyCommand(solo,'local',{type:'build',pad:0,towerType:0}).ok,true);assert.equal(applyCommand(solo,'local',{type:'airstrike'}).ok,true);assert.equal(solo.players.local.overdrive,10);
solo.enemies.push({hp:1000,reward:10,segment:1,x:100,y:130,speed:0,kind:'infantry'});stepMatch(solo);assert.ok(solo.enemies[0].hp<984,'engineer passive and overdrive increase tower damage');
const recon=createMatch([player('local','0,0,0,0,1;recon')]);recon.running=true;recon.wave=1;recon.spawnLeft=3;recon.spawnTimer=100;recon.enemies.push({hp:1000,reward:10,segment:1,x:10,y:130,speed:30,kind:'infantry'});assert.equal(applyCommand(recon,'local',{type:'airstrike'}).ok,true);stepMatch(recon);assert.ok(Math.abs(recon.enemies[0].x-10.5)<.001);
const assault=createMatch([player('local','1,0,0,0,0;assault')]);assault.enemies.push({hp:100,x:0,y:0});assert.equal(applyCommand(assault,'local',{type:'airstrike'}).ok,true);assert.equal(assault.enemies[0].hp,65);
console.log('Skill build validation, abilities and solo/co-op passives passed.');

// Level one starts without an ability; a point must unlock a main skill.
const novice=createMatch([player('local','0,0,0,0,0;assault',1)]);novice.enemies.push({hp:100});
assert.equal(novice.players.local.skills.active,null);
assert.equal(applyCommand(novice,'local',{type:'airstrike'}).ok,false);
assert.equal(parseBuild('1,0,0,0,0;assault',2).active,'assault');
// Specialists must be purchased on a rank-two path, and cannot overspend.
const builds=['2,0,0,0,0;assault;1000000000;1','2,0,0,0,0;assault;0100000000;2','0,2,0,0,0;engineer;0010000000;1','0,2,0,0,0;engineer;0001000000;2','0,0,2,0,0;logistics;0000100000;1','0,0,2,0,0;logistics;0000010000;2','0,0,0,2,0;medic;0000001000;1','0,0,0,2,0;medic;0000000100;2','0,0,0,0,2;recon;0000000010;1','0,0,0,0,2;recon;0000000001;2'];
for(const build of builds){assert.equal(encodeBuild(parseBuild(build,4)),build);assert.equal(parseBuild(build,3).active,null);}
assert.equal(parseBuild('2,0,0,0,0;assault;1000000000;2',4).active,null,'unowned specialist rejected');
assert.equal(parseBuild('1,0,0,0,0;assault;1000000000;1',4).active,null,'branch requires rank two');
assert.equal(parseBuild('2,0,0,0,0;assault;1000000000;1;injection',4).active,null);
for(const [i,build] of builds.entries()){
 const m=createMatch([player('local',build,4)]);m.running=true;m.wave=1;m.hp=70;m.enemies=[{hp:100},{hp:200}];m.towers=[{ownerId:'local'}];
 assert.equal(applyCommand(m,'local',{type:'airstrike'}).ok,true,build);
 assert.equal(applyCommand(m,'local',{type:'airstrike'}).ok,false,'cooldown');
 if(i===0){assert.equal(m.enemies[0].hp,75);assert.equal(m.suppression,3);}
 if(i===1){assert.equal(m.enemies[0].hp,100);assert.equal(m.enemies[1].hp,120);}
 if(i===2||i===3){assert.equal(m.players.local.overdrive,i===2?15:6);assert.equal(m.players.local.overdriveFactor,i===2?1.35:1.8);}
 if(i===4){assert.equal(m.money,170);assert.equal(m.players.local.cooldown,38);}
 if(i===5){assert.equal(m.money,160);assert.equal(m.hp,76);}
 if(i===6)assert.equal(m.hp,95);
 if(i===7){assert.equal(m.hp,90);assert.equal(m.money,137);}
 if(i===8)assert.equal(m.suppression,12);
 if(i===9){assert.equal(m.suppression,7);assert.equal(m.enemies[0].hp,80);}
}
