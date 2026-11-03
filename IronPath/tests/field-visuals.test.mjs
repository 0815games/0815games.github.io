import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {drawCartoonBattle} from '../cartoon-art.mjs';
import {getMap} from '../maps.mjs';
import {createMatch,getTowerRange} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
function context(log){return new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>{assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)));log.push([k,...args]);};},set(o,k,v){o[k]=v;log.push(['set',k,v]);return true;}});}
test('new build markers and road hazards retain labels without changing simulation',()=>{
 for(const id of ['g2-f16b92c3','road']){const map=getMap(id),state=createMatch([createPlayer('local',{name:'Test',gender:'female'})],id),before=structuredClone(state),calls=[];drawCartoonBattle(context(calls),state,{path:map.path,pads:map.pads,theme:map.theme,types:[{color:'#aaa'},{color:'#aaa'},{color:'#aaa'},{color:'#aaa'}],me:'local',getTowerRange,reducedMotion:true});assert.ok(calls.some(([op,text])=>op==='fillText'&&text==='BUILD'));assert.ok(!calls.some(([op,key,value])=>op==='set'&&key==='strokeStyle'&&value==='#ffed70'));assert.deepEqual(state,before);}
 const game=readFileSync(new URL('../game.js',import.meta.url),'utf8');assert.doesNotMatch(game,/#ffed70/);assert.match(game,/#bad8ca/);
});
