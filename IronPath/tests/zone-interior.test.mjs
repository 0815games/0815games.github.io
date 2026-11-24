import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawCartoonBattle} from '../core/cartoon-art.mjs';
import {getMap} from '../core/maps.mjs';
import {createMatch,getTowerRange} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';
function context(log){return new Proxy({},{get(o,k){if(k in o)return o[k];return (...args)=>{assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)));log.push([k,...args]);};},set(o,k,v){o[k]=v;log.push(['set',k,v]);return true;}});}
// The browser smoke caught what the mocks missed: one zone painter called the
// radius as a function and threw only on a real canvas with a bog/dust patch.
// Render every zone kind - plus the broken-ice and rubble states - through the
// full battle draw so that class of bug fails in the unit suite.
test('every zone kind paints its interior without throwing',()=>{
  const id='road',map=getMap(id);
  const zones=['ice','bog','rubble','ambush','dust'].map((kind,i)=>({id:i,kind,x:360+i*70,y:300,r:78}));
  const state=createMatch([createPlayer('local',{name:'Test',gender:'female'})],id);
  state.zoneBroken={0:true};
  state.zoneDamage={2:120};
  const calls=[];
  drawCartoonBattle(context(calls),state,{
    path:map.path,pads:map.pads,theme:map.theme,
    types:[{color:'#aaa'},{color:'#aaa'},{color:'#aaa'},{color:'#aaa'}],
    me:'local',getTowerRange,reducedMotion:true,zones,
  });
  const texts=calls.filter(([op])=>op==='fillText').map(([,t])=>String(t));
  for(const label of ['THIN ICE','DEEP BOG','AMBUSH TRAIL','DUST','BROKEN ICE'])
    assert.ok(texts.some(t=>t===label),`label ${label} is painted`);
  assert.ok(texts.some(t=>/^RUBBLE/.test(t)),'rubble counter is painted');
});
