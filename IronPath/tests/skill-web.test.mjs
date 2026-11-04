import {strict as assert} from 'node:assert';
import {WEB_NODES,webReady,webBonuses,parseBuild,encodeBuild,pointsLeft} from '../skills.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
import {createVersus} from '../versus.mjs';
assert.equal(WEB_NODES.length,75);assert.equal(new Set(WEB_NODES.map(n=>n.name)).size,75);
const build=parseBuild('3,2,0,0,0;assault',20);
assert.equal(webReady(build,WEB_NODES[0]),true);assert.equal(webReady(build,WEB_NODES[1]),false);assert.equal(webReady(build,WEB_NODES[25]),true);assert.equal(webReady(build,WEB_NODES[28]),false);
build.web[0]=1;build.web[1]=1;build.web[25]=1;build.web[26]=1;
const encoded=encodeBuild(build),decoded=parseBuild(encoded,20);assert.equal(encodeBuild(decoded),encoded);assert.equal(pointsLeft(decoded,20),10);
assert.deepEqual([webBonuses(decoded).damage,webBonuses(decoded).tower,webBonuses(decoded).heroSpeed],[6,10,5]);
assert.equal(parseBuild(encoded,8).active,null,'overspend is rejected');
const broken=structuredClone(build);broken.web[0]=0;assert.equal(parseBuild(encodeBuild(broken),20).active,null,'mastery chain cannot skip a node');
broken.web[1]=0;broken.web[25]=0;assert.equal(parseBuild(encodeBuild(broken),20).active,null,'hybrid chain cannot skip a node');
assert.equal(parseBuild(encoded+'X',20).active,null,'malformed suffix is rejected');
assert.equal(encodeBuild(parseBuild('2,0,0,0,0;assault;1000000000;1',4)),'2,0,0,0,0;assault;1000000000;1','legacy builds round trip');
const p=createPlayer('a',{name:'Alice',gender:'female',level:20,skills:encoded},100,130),m=createMatch([p]);m.wave=1;m.running=true;m.spawnLeft=1;m.spawnTimer=100;m.enemies=[{hp:1000,reward:10,segment:1,x:100,y:130,speed:0,kind:'infantry'}];stepMatch(m);assert.equal(m.enemies[0].hp,1000-(10+19+6+6),'web boosts soldier damage');assert.ok(m.players.a.shotTimer<.65,'web speeds up soldier fire');
const logistic=parseBuild('0,0,3,0,0;logistics',10);logistic.web[10]=1;logistic.web[11]=1;const lp=createPlayer('l',{name:'Logi',gender:'female',level:10,skills:encodeBuild(logistic)},100,130);const lm=createMatch([lp]);assert.equal(lm.money,140,'starting supply mastery');lm.running=true;lm.wave=1;lm.spawnLeft=1;lm.spawnTimer=100;lm.enemies=[{hp:0,reward:10,segment:1,x:0,y:130,speed:0}];stepMatch(lm);assert.equal(lm.money,154,'kill supply mastery');
const medic=parseBuild('0,0,0,3,0;medic',10);medic.web[15]=1;medic.web[16]=1;const mp=createPlayer('m',{name:'Medic',gender:'female',level:10,skills:encodeBuild(medic)}),mm=createMatch([mp]);assert.equal(mm.maxHp,120);mm.running=true;mm.hp=90;assert.equal(applyCommand(mm,'m',{type:'airstrike'}).ok,true);assert.equal(mp.cooldown,29);
const versus=createVersus([p,mp],'road','a');assert.equal(versus.lanes.a.players.a.skills.web[25],1);assert.equal(versus.lanes.m.maxHp,120);
const co=createMatch([p,mp]);assert.equal(co.maxHp,120);assert.equal(co.players.a.skills.web[25],1);assert.deepEqual(JSON.parse(JSON.stringify(co)).players.a.skills.web,co.players.a.skills.web);
console.log('Expanded skill web prerequisites, save compatibility, and combat bonuses passed.');
const full=parseBuild('3,3,3,3,3;assault',100);
for(const node of WEB_NODES.slice(0,55)){assert.ok(webReady(full,node),`${node.name} prerequisite`);full.web[node.id]=1;}
assert.equal(pointsLeft(full,100),29);assert.equal(encodeBuild(parseBuild(encodeBuild(full),100)),encodeBuild(full));
assert.deepEqual(webBonuses(full),{damage:28,tower:70,supplies:14,health:75,movement:112,heroRange:30,heroSpeed:15,towerSpeed:10,start:40,cooldown:4});

const cross=parseBuild('2,0,2,0,0;assault',15);assert.ok(webReady(cross,WEB_NODES[40]));assert.equal(webReady(cross,WEB_NODES[41]),false);cross.web[40]=1;cross.web[41]=1;const crossSave=encodeBuild(cross);assert.equal(crossSave.split(';').at(-1).length,55);assert.equal(encodeBuild(parseBuild(crossSave,15)),crossSave);assert.equal(webBonuses(parseBuild(crossSave,15)).supplies,2);const invalid=structuredClone(cross);invalid.web[40]=0;assert.equal(parseBuild(encodeBuild(invalid),15).active,null,'cross nodes require prior tier');assert.equal(parseBuild(crossSave,6).active,null,'cross nodes cost points');
