import {strict as assert} from 'node:assert';
import {drawCartoonBattle} from '../cartoon-art.mjs';
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

const big=getMap('four-front'),bigState=createMatch([p,q],big.id),bigBefore=structuredClone(bigState);calls.length=0;drawCartoonBattle(ctx,bigState,{...opts,path:big.path,paths:big.paths,pads:big.pads,width:big.width,height:big.height,bunkerPosition:big.bunker});assert.ok(calls.some(([name,x,y,w,h])=>name==='fillRect'&&x===0&&y===0&&w===1440&&h===720));assert.equal(calls.filter(([name,text])=>name==='fillText'&&text==='ENEMY ENTRY').length,2);assert.ok(calls.some(([name,x,y])=>name==='translate'&&x===480&&y===-40));assert.ok(calls.some(([name,x,y])=>name==='moveTo'&&x===0&&y===580));assert.deepEqual(bigState,bigBefore);
