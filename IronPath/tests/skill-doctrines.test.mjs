import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {SKILL_PATHS,parseBuild,encodeBuild,WEB_NODES,webReady,webBonuses,pointsLeft,webRequirement} from '../skills.mjs';
import {prerequisites,nodeMatches} from '../skill-planner.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch,stepMatch} from '../simulation.mjs';

test('twenty-four specialist doctrines require matching class, specialist, and preceding tier',()=>{
  assert.equal(WEB_NODES.filter(n=>n.kind==='doctrine').length,24);
  for(const path of SKILL_PATHS){
    for(let j=0;j<2;j++){
      const doctrines=WEB_NODES.filter(n=>n.path===path.id&&n.kind==='doctrine'&&n.branch===j);
      assert.equal(doctrines.length,2);
      const first=doctrines[0],second=doctrines[1];
      const b=parseBuild(`v2;${path.id};3;0;00000000000000`,20);
      assert.equal(webReady(b,first),false);
      b.extra[j]=1;b.web[WEB_NODES.find(n=>n.path===path.id&&n.slot===j).id]=1;
      assert.equal(webReady(b,first),true);
      assert.equal(webReady(b,second),false);
      assert.deepEqual(prerequisites(path.id,first.id+100),[`${path.id}:${first.path===path.id?WEB_NODES.find(n=>n.path===path.id&&n.slot===j).id+100:0}`]);
      assert.match(webRequirement(first),/Requires/);
      assert.ok(!nodeMatches(b,20,path.id,first.id+100,'hybrid'));

      b.extra[first.slot]=1;b.web[first.id]=1;
      assert.equal(webReady(b,second),true);
      b.extra[second.slot]=1;b.web[second.id]=1;
      const encoded=encodeBuild(b);
      assert.equal(encoded.split(';').at(-1).length,14);
      assert.equal(encodeBuild(parseBuild(encoded,20)),encoded);
      assert.equal(pointsLeft(parseBuild(encoded,20),20),11);

      const noSpec=structuredClone(b);noSpec.extra[j]=0;noSpec.web[WEB_NODES.find(n=>n.path===path.id&&n.slot===j).id]=0;
      assert.equal(parseBuild(encodeBuild(noSpec),20).active,null);
      const skipped=structuredClone(b);skipped.extra[first.slot]=0;skipped.web[first.id]=0;
      assert.equal(parseBuild(encodeBuild(skipped),20).active,null);
    }
  }
});

test('doctrine bonuses apply in the actual match and V2 builds round trip cleanly',()=>{
  const buildStr='v2;assault;2;1;10000001100000';
  const b=parseBuild(buildStr,15);
  assert.equal(encodeBuild(b),buildStr);
  assert.equal(webBonuses(b).heroSpeed,5);
  assert.equal(webBonuses(b).damage,3);
  const p=createPlayer('p',{name:'A',gender:'female',level:15,skills:buildStr},100,130),state=createMatch([p]);
  state.wave=1;state.running=true;state.spawnLeft=1;state.spawnTimer=100;
  state.enemies=[{hp:1000,reward:10,segment:1,x:100,y:130,speed:0,kind:'infantry'}];
  stepMatch(state);
  assert.equal(state.enemies[0].hp,1000-(10+14+4+3));
  assert.ok(p.shotTimer<.65);
});
