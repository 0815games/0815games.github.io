import {test} from 'node:test';import {strict as assert} from 'node:assert';import {soldierProfile} from '../soldier-profile.mjs';import {createPlayer} from '../match.mjs';import {createMatch,stepMatch} from '../simulation.mjs';
test('soldier dossier shows real base loadout stats without modifying progression',()=>{
 const profile={name:'<Alice>',gender:'female',xp:750,skills:'2,0,0,0,0;assault',armory:{scrap:80,owned:1,equipped:1}},before=structuredClone(profile),s=soldierProfile(profile);
 assert.equal(s.name,'<Alice>');assert.equal(s.level,3);assert.equal(s.damage,19);assert.equal(s.range,150);assert.equal(s.movement,150);assert.equal(s.cooldown,30);assert.equal(s.equipment.name,'Field Scope');assert.equal(s.inventory.filter(i=>i.owned).length,1);assert.deepEqual(profile,before);
 const player=createPlayer('local',{...profile,level:3,loadout:'0,0,1'}),match=createMatch([player]);match.wave=1;match.running=true;match.spawnLeft=1;match.spawnTimer=100;match.enemies=[{kind:'infantry',hp:100,maxHp:100,speed:0,reward:0,damage:0,x:player.x,y:player.y,segment:1}];stepMatch(match);assert.equal(match.enemies[0].hp,100-s.damage,'display matches an unmodified shot');
});
test('gear and skills affect displayed range, movement and cooldown; no skill shows no cooldown',()=>{
 assert.equal(soldierProfile({xp:0}).cooldown,null);
 assert.equal(soldierProfile({xp:300,skills:'0,0,0,0,1;recon',armory:{owned:4,equipped:3}}).movement,180);
 assert.equal(soldierProfile({xp:0,armory:{owned:8,equipped:4}}).range,180);
 assert.equal(soldierProfile({xp:300,skills:'1,0,0,0,0;assault',armory:{owned:16,equipped:5}}).cooldown,26);
});
