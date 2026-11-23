import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createSoldierMotion} from '../core/soldier-motion.mjs';
import {drawCartoonBattle} from '../core/cartoon-art.mjs';
import {createMatch,getTowerRange} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';
import {getMap} from '../core/maps.mjs';
test('motion follows observed movement rather than movement intent or wave state',()=>{
 const motion=createSoldierMotion(),players={a:{x:50,y:50,direction:{x:1,y:0}}};
 assert.equal(motion.sample(players,0).a.moving,false);assert.equal(motion.sample(players,.1).a.moving,false,'blocked character does not walk in place');players.a.x+=6;let pose=motion.sample(players,.2).a;assert.equal(pose.moving,true);assert.equal(pose.facing,1);assert.notEqual(pose.bob,0);players.a.x-=4;pose=motion.sample(players,.3).a;assert.equal(pose.facing,-1);assert.equal(pose.moving,true);assert.equal(motion.sample(players,.32).a.moving,true,'animation holds between fixed simulation ticks');assert.equal(motion.sample(players,.43).a.moving,false,'animation settles after stopping');
 players.a.x-=4;pose=motion.sample(players,.5,{paused:true}).a;assert.equal(pose.moving,false);assert.equal(pose.bob,0);players.a.x-=4;pose=motion.sample(players,.6,{reducedMotion:true}).a;assert.equal(pose.moving,false);assert.equal(pose.lean,0);players.a.x=500;assert.equal(motion.sample(players,.7).a.moving,false,'teleports do not animate');players.a.x+=5;assert.equal(motion.sample(players,5).a.moving,false,'long background gaps do not animate');players.a.active=false;assert.equal(motion.sample(players,5.1).a,undefined);players.a.active=true;assert.equal(motion.sample(players,5.2).a.moving,false,'returning players restart cleanly');
});
test('single soldier sprite changes pose without mutating state and reduced motion is stable',()=>{
 const map=getMap('road'),p=createPlayer('a',{name:'Alice',gender:'female'}),state=createMatch([p],map.id);state.wave=1;state.running=false;const before=structuredClone(state),log=[],images=[];
 const doc={createElement(kind){if(kind==='canvas')return {getContext:()=>null};const image={};Object.defineProperty(image,'src',{set(){image.onload?.();}});images.push(image);return image;}};
 const ctx=new Proxy({canvas:{ownerDocument:doc}},{get(o,k){if(k in o)return o[k];return (...args)=>log.push([k,...args]);},set(o,k,v){o[k]=v;return true;}}),options={path:map.path,pads:map.pads,types:[{},{},{},{}],me:'a',getTowerRange};
 drawCartoonBattle(ctx,state,{...options,soldierPoses:{a:{moving:true,facing:-1,bob:-1,lean:.05,step:.5}}});const img=images.find(image=>log.some(call=>call[0]==='drawImage'&&call[1]===image&&call.length===6&&call[4]===22&&call[5]===33));assert.ok(img,'the painted single-figure hero sprite is drawn whole, no legacy crop');assert.ok(log.some(call=>call[0]==='scale'&&call[1]===-1));assert.ok(log.some(call=>call[0]==='rotate'&&call[1]===.05));assert.deepEqual(state,before);
});
test('standing soldiers breathe, face threats and kick with their own shots and hits',()=>{
 const motion=createSoldierMotion(),players={a:{x:100,y:100,hp:50}};
 // First sight: no kick, no turn - the tracker only arms itself.
 let pose=motion.sample(players,0,{shots:[{x:100,y:100,kind:'hero',id:3}]}).a;
 assert.equal(pose.lean,0);assert.equal(pose.facing,1);
 // Breathing: idle bob sways gently and never appears with reduced motion.
 const b1=motion.sample(players,1).a.bob,b2=motion.sample(players,1.6).a.bob;
 assert.ok(Math.abs(b1)<=.55&&Math.abs(b2)<=.55&&b1!==b2,'idle breathing is a small sway');
 assert.equal(motion.sample(players,1.6,{reducedMotion:true}).a.bob,0,'reduced motion stands still');
 // Threat facing: settled soldiers turn toward the nearest living enemy.
 pose=motion.sample(players,2,{threats:[{x:40,y:100,hp:5},{x:400,y:100,hp:5}]}).a;
 assert.equal(pose.facing,-1,'faces the nearer threat on the left');
 pose=motion.sample(players,2.2,{threats:[{x:40,y:100,hp:0}]}).a;
 assert.equal(pose.facing,-1,'a dead threat turns nobody');
 // Recoil: a newer hero shot from his position kicks the stance back.
 motion.sample(players,3,{shots:[{x:100,y:100,kind:'hero',id:4}]});
 pose=motion.sample(players,3.05,{shots:[{x:100,y:100,kind:'hero',id:5}]}).a;
 assert.ok(pose.lean>0,'the rifle kick leans him back against his facing');
 assert.equal(motion.sample(players,3.4).a.lean,0,'the kick is gone after its window');
 // Flinch: a life drop dips the stance once.
 players.a.hp=41;pose=motion.sample(players,4).a;
 assert.ok(pose.bob>0&&pose.lean>0,'a hit dips and rocks the stance');
 assert.equal(motion.sample(players,4.4).a.lean,0,'and settles again');
 // Walking still wins over threat facing.
 players.a.x+=6;pose=motion.sample(players,4.5,{threats:[{x:0,y:100,hp:5}]}).a;
 assert.equal(pose.facing,1,'mid-stride he faces where he walks');
});
