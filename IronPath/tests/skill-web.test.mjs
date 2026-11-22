import {strict as assert} from 'node:assert';
import {WEB_NODES,NODES_PER_CLASS,webReady,webBonuses,parseBuild,encodeBuild,pointsLeft} from '../core/skills.mjs';
import {createPlayer,applyCommand} from '../core/match.mjs';
import {createMatch,stepMatch} from '../core/simulation.mjs';
import {createVersus} from '../core/versus.mjs';

assert.equal(WEB_NODES.length,84);
assert.equal(NODES_PER_CLASS,14);
assert.equal(new Set(WEB_NODES.map(n=>n.name)).size,84);

// Assault 14-node tree: nodes 0..13
const build=parseBuild('v2;assault;3;0;00000000000000',20);
assert.equal(webReady(build,WEB_NODES[0]),true,'specialist slot 0 unlocked at rank 2');
assert.equal(webReady(build,WEB_NODES[2]),true,'mastery 1 unlocked at rank 3');
assert.equal(webReady(build,WEB_NODES[3]),false,'mastery 2 requires mastery 1');
assert.equal(webReady(build,WEB_NODES[7]),false,'doctrine requires matching specialist');
build.extra[0]=1;build.web[0]=1;
build.extra[2]=1;build.web[2]=1;
build.extra[3]=1;build.web[3]=1;
build.extra[7]=1;build.web[7]=1;
const encoded=encodeBuild(build),decoded=parseBuild(encoded,20);
assert.equal(encodeBuild(decoded),encoded);
assert.equal(pointsLeft(decoded,20),10);
assert.deepEqual([webBonuses(decoded).damage,webBonuses(decoded).heroSpeed],[2,10]);

assert.equal(parseBuild(encoded,6).active,null,'overspend is rejected');
const broken=structuredClone(build);broken.extra[2]=0;broken.web[2]=0;
assert.equal(parseBuild(encodeBuild(broken),20).active,null,'mastery chain cannot skip a node');
const badDoc=structuredClone(build);badDoc.extra[0]=0;badDoc.web[0]=0;
assert.equal(parseBuild(encodeBuild(badDoc),20).active,null,'doctrine cannot exist without its specialist');
assert.equal(parseBuild(encoded+'X',20).active,null,'malformed suffix is rejected');

// Combat bonuses apply for Assault, Logistics, Medic and Air Defense
const p=createPlayer('a',{name:'Alice',gender:'female',level:20,skills:encoded},100,130);
const m=createMatch([p]);m.wave=1;m.running=true;m.spawnLeft=1;m.spawnTimer=100;
m.enemies=[{hp:1000,reward:10,segment:1,x:100,y:130,speed:0,kind:'infantry'}];
stepMatch(m);
assert.equal(m.enemies[0].hp,1000-(10+19+6+2),'web boosts soldier damage');
assert.ok(m.players.a.shotTimer<.65,'web speeds up soldier fire');

const logistic=parseBuild('v2;logistics;3;0;00110000000000',10);
const lp=createPlayer('l',{name:'Logi',gender:'female',level:10,skills:encodeBuild(logistic)},100,130);
const lm=createMatch([lp]);assert.equal(lm.money,140,'starting supply mastery');
lm.running=true;lm.wave=1;lm.spawnLeft=1;lm.spawnTimer=100;
lm.enemies=[{hp:0,reward:10,segment:1,x:0,y:130,speed:0}];stepMatch(lm);
assert.equal(lm.money,154,'kill supply mastery');

const medic=parseBuild('v2;medic;3;0;00110000000000',10);
const mp=createPlayer('m',{name:'Medic',gender:'female',level:10,skills:encodeBuild(medic)}),mm=createMatch([mp]);
assert.equal(mm.maxHp,120);mm.running=true;mm.hp=90;
assert.equal(applyCommand(mm,'m',{type:'airstrike'}).ok,true);
assert.equal(mp.cooldown,29);

const air=parseBuild('v2;airDefense;3;0;10111001000000',15);
const airBonuses=webBonuses(air);
assert.equal(airBonuses.airDamage,10);
assert.equal(airBonuses.markDamage,16);

const versus=createVersus([p,mp],'road','a');
assert.equal(versus.lanes.a.players.a.skills.extra[2],1);
assert.equal(versus.lanes.m.maxHp,120);
const co=createMatch([p,mp]);
assert.equal(co.maxHp,120);
assert.equal(co.players.a.skills.extra[2],1);
assert.deepEqual(JSON.parse(JSON.stringify(co)).players.a.skills.extra,co.players.a.skills.extra);

// Full single-class V2 17-point build is valid at level 18 (17 points)
const full=parseBuild('v2;assault;3;1;11111111111111',18);
assert.equal(full.classId,'assault');
assert.equal(pointsLeft(full,18),0);
assert.equal(encodeBuild(parseBuild(encodeBuild(full),18)),encodeBuild(full));
assert.deepEqual(webBonuses(full),{damage:14,tower:0,supplies:0,health:0,movement:0,heroRange:30,heroSpeed:19,towerSpeed:0,start:0,cooldown:0,airDamage:0,markDamage:0});
assert.equal(parseBuild('v2;assault;3;1;11111111111111',17).active,null,'17 points rejected at level 17');
console.log('Expanded V2 84-node skill web prerequisites and combat bonuses passed.');
