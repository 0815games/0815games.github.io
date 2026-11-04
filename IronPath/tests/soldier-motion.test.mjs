import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createSoldierMotion} from '../soldier-motion.mjs';
import {drawCartoonBattle} from '../cartoon-art.mjs';
import {createMatch,getTowerRange} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
import {getMap} from '../maps.mjs';
test('motion follows observed movement rather than movement intent or wave state',()=>{
 const motion=createSoldierMotion(),players={a:{x:50,y:50,direction:{x:1,y:0}}};
 assert.equal(motion.sample(players,0).a.moving,false);assert.equal(motion.sample(players,.1).a.moving,false,'blocked character does not walk in place');players.a.x+=6;let pose=motion.sample(players,.2).a;assert.equal(pose.moving,true);assert.equal(pose.facing,1);assert.notEqual(pose.bob,0);players.a.x-=4;pose=motion.sample(players,.3).a;assert.equal(pose.facing,-1);assert.equal(pose.moving,true);assert.equal(motion.sample(players,.32).a.moving,true,'animation holds between fixed simulation ticks');assert.equal(motion.sample(players,.43).a.moving,false,'animation settles after stopping');
 players.a.x-=4;pose=motion.sample(players,.5,{paused:true}).a;assert.equal(pose.moving,false);assert.equal(pose.bob,0);players.a.x-=4;pose=motion.sample(players,.6,{reducedMotion:true}).a;assert.equal(pose.moving,false);assert.equal(pose.lean,0);players.a.x=500;assert.equal(motion.sample(players,.7).a.moving,false,'teleports do not animate');players.a.x+=5;assert.equal(motion.sample(players,5).a.moving,false,'long background gaps do not animate');players.a.active=false;assert.equal(motion.sample(players,5.1).a,undefined);players.a.active=true;assert.equal(motion.sample(players,5.2).a.moving,false,'returning players restart cleanly');
});
test('single soldier sprite changes pose without mutating state and reduced motion is stable',()=>{
 const map=getMap('road'),p=createPlayer('a',{name:'Alice',gender:'female'}),state=createMatch([p],map.id);state.wave=1;state.running=false;const before=structuredClone(state),log=[],images=[];
 const doc={createElement(kind){if(kind==='canvas')return {getContext:()=>null};const image={};Object.defineProperty(image,'src',{set(){image.onload?.();}});images.push(image);return image;}};
 const ctx=new Proxy({canvas:{ownerDocument:doc}},{get(o,k){if(k in o)return o[k];return (...args)=>log.push([k,...args]);},set(o,k,v){o[k]=v;return true;}}),options={path:map.path,pads:map.pads,types:[{},{},{},{}],me:'a',getTowerRange};
 drawCartoonBattle(ctx,state,{...options,soldierPoses:{a:{moving:true,facing:-1,bob:-1,lean:.05,step:.5}}});const img=images.find(image=>log.some(call=>call[0]==='drawImage'&&call[1]===image&&call.length===10&&call[4]===60&&call[5]===90));assert.ok(img,'only one 60px-wide figure from the sprite is drawn');assert.ok(log.some(call=>call[0]==='scale'&&call[1]===-1));assert.ok(log.some(call=>call[0]==='rotate'&&call[1]===.05));assert.deepEqual(state,before);
});
