import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {parseBuild,encodeBuild,WEB_NODES,webReady,webBonuses,pointsLeft,webRequirement} from '../skills.mjs';
import {prerequisites,nodeMatches} from '../skill-planner.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';
test('twenty specialist doctrines require the correct specialist and preceding tier',()=>{
 assert.equal(WEB_NODES.filter(n=>n.kind==='doctrine').length,20);
 for(let i=0;i<5;i++)for(let j=0;j<2;j++){
  const first=WEB_NODES[55+i*4+j*2],second=WEB_NODES[first.id+1],b=parseBuild('2,2,2,2,2;assault',100);
  assert.equal(webReady(b,first),false);b.extra[i*2+j]=1;assert.equal(webReady(b,first),true);assert.equal(webReady(b,second),false);b.web[first.id]=1;assert.equal(webReady(b,second),true);
  assert.deepEqual(prerequisites(first.path,first.id+100),[`${first.path}:${5+j}`]);assert.match(webRequirement(first),/Requires/);assert.ok(!nodeMatches(b,100,first.path,first.id+100,'hybrid'));b.web[second.id]=1;
  const encoded=encodeBuild(b);assert.equal(encoded.split(';').at(-1).length,75);assert.equal(encodeBuild(parseBuild(encoded,100)),encoded);assert.equal(pointsLeft(parseBuild(encoded,100),100),86);
  const invalid=structuredClone(b);invalid.extra[i*2+j]=0;assert.equal(parseBuild(encodeBuild(invalid),100).active,null);
  invalid.extra[i*2+j]=1;invalid.web[first.id]=0;assert.equal(parseBuild(encodeBuild(invalid),100).active,null);
 }
});
test('doctrine bonuses apply in the actual match and legacy formats remain stable',()=>{
 const b=parseBuild('2,0,0,0,0;assault;1000000000;1',15);b.web[55]=1;b.web[56]=1;
 assert.equal(webBonuses(b).heroSpeed,5);assert.equal(webBonuses(b).damage,3);
 const p=createPlayer('p',{name:'A',gender:'female',level:15,skills:encodeBuild(b)},100,130),state=createMatch([p]);state.wave=1;state.running=true;state.spawnLeft=1;state.spawnTimer=100;state.enemies=[{hp:1000,reward:10,segment:1,x:100,y:130,speed:0,kind:'infantry'}];stepMatch(state);assert.equal(state.enemies[0].hp,1000-(10+14+4+3));assert.ok(p.shotTimer<.65);
 for(const str of ['0,0,0,0,0;assault','2,0,0,0,0;assault;1000000000;1'])assert.equal(encodeBuild(parseBuild(str,15)),str);
});
