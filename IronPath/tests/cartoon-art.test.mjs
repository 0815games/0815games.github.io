import {strict as assert} from 'node:assert';
import {drawCartoonBattle,drawGroundDetails} from '../cartoon-art.mjs';
import {getMap} from '../maps.mjs';
import {createPlayer} from '../match.mjs';
import {createMatch,PATH,PADS,getTowerRange} from '../simulation.mjs';
const p=createPlayer('a',{name:'Alice',gender:'female'}),q=createPlayer('b',{name:'Bob',gender:'male'});
const state=createMatch([p,q]);state.wave=1;state.hp=20;state.plating=3;state.selectedPad=0;
state.towers=[0,1,2,3].map((type,pad)=>({type,pad,level:1,ownerId:'a'}));
state.enemies=['infantry','runner','tank','plane'].map((kind,i)=>({kind,x:20+i*40,y:130,hp:10,maxHp:20}));state.shots=[{x:105,y:210,tx:50,ty:130,color:'red'}];
const before=structuredClone(state),calls=[];const ctx=new Proxy({}, {get(target,key){if(key in target)return target[key];return (...args)=>{assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),`${String(key)} has non-finite coordinates`);calls.push([key,...args]);};},set(target,key,value){target[key]=value;return true;}});
const opts={path:PATH,pads:PADS,types:[{color:'#a'},{color:'#b'},{color:'#c'},{color:'#d'}],me:'a',getTowerRange};
const effects=['assault','engineer','logistics','medic','recon'].map(kind=>({kind,x:200,y:200,targets:[{x:60,y:130}],progress:.5}));
drawCartoonBattle(ctx,state,{...opts,effects});
assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='S'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='T'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='A'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='OVERDRIVE'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='SUPPRESSION'));
const count=calls.length;drawCartoonBattle(ctx,state,{...opts,effects,reducedMotion:true});assert.ok(calls.length-count<count,'reduced motion avoids animated effects');
assert.deepEqual(state,before,'the drawing must not mutate game state');assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='BUNKER'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='Alice'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='Bob'));
console.log('Cartoon drawing covers towers, enemies, players and bunker without changing state.');

const big=getMap('four-front'),bigState=createMatch([p,q],big.id),bigBefore=structuredClone(bigState);calls.length=0;drawCartoonBattle(ctx,bigState,{...opts,path:big.path,paths:big.paths,pads:big.pads,width:big.width,height:big.height,bunkerPosition:big.bunker});assert.ok(calls.some(([name,x,y,w,h])=>name==='fillRect'&&x===0&&y===0&&w===1440&&h===720));assert.equal(calls.filter(([name,text])=>name==='fillText'&&text==='ENEMY ENTRY').length,2);assert.ok(calls.some(([name,x,y])=>name==='translate'&&x===big.bunker.x&&y===big.bunker.y),'the bunker art is translated to the map bunker, not to a fixed offset');assert.ok(calls.some(([name,x,y])=>name==='moveTo'&&x===0&&y===580));assert.deepEqual(bigState,bigBefore);
// Prestige remains legible with reduced motion and does not mutate simulation state.
const prestige=createMatch([p]);prestige.towers=[{id:1,type:0,pad:0,level:13,branch:0,ownerId:'a'}];const prestigeBefore=structuredClone(prestige);calls.length=0;drawCartoonBattle(ctx,prestige,{...opts,reducedMotion:true});assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='★2'));assert.ok(calls.some(([name,text])=>name==='fillText'&&text==='1'));assert.deepEqual(prestige,prestigeBefore);

// The hero exists before the first wave. He used to be drawn only while
// `state.wave>0`, which made the very first movement order invisible: the tap was
// accepted, the simulation walked him there, and the field showed nothing moving.
{
  const field = createMatch([p]);
  assert.equal(field.wave, 0, 'the match starts before wave one');
  calls.length = 0;
  drawCartoonBattle(ctx, field, { ...opts, soldierPoses: {} });
  assert.ok(calls.some(([name, text]) => name === 'fillText' && text === 'YOU'),
    'the soldier is on the field before the first wave, so a movement order is visible');
  // And after the wave starts he is still there, exactly once.
  field.wave = 1;
  calls.length = 0;
  drawCartoonBattle(ctx, field, { ...opts, soldierPoses: {} });
  assert.equal(calls.filter(([name, text]) => name === 'fillText' && text === 'YOU').length, 1,
    'one hero, not two, once the wave started');
  console.log('The hero is drawn before the first wave, not from wave one.');
}

// V2 ground variety (reported: "wirklich jede Karte immer andere Details"):
// the per-map scatter is derived from the map seed alone - deterministic per
// seed, different between seeds, on every theme.
{
  const record=()=>{const calls=[];const ctx=new Proxy({},{get(t,k){if(k in t)return t[k];return (...a)=>{calls.push([k,...a.map(v=>typeof v==='number'?Math.round(v*100)/100:v)]);};},set(t,k,v){t[k]=v;return true;}});return {calls,ctx};};
  for(const theme of ['forest','urban','arctic','marsh','scrub','road','junction']){
    const a=record(),b=record(),c=record();
    drawGroundDetails(a.ctx,theme,960,540,12345);
    drawGroundDetails(b.ctx,theme,960,540,54321);
    drawGroundDetails(c.ctx,theme,960,540,12345);
    assert.ok(a.calls.length>50,`${theme} scatters ground details (${a.calls.length})`);
    assert.notEqual(JSON.stringify(a.calls),JSON.stringify(b.calls),`${theme}: different seeds scatter different details`);
    assert.equal(JSON.stringify(a.calls),JSON.stringify(c.calls),`${theme}: the same seed is deterministic`);
  }
}
console.log('Ground variety: per-seed details are deterministic and distinct.');
