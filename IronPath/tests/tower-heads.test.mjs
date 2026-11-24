import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawCartoonBattle} from '../core/cartoon-art.mjs';
import {createMatch,getTowerRange} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';
import {getMap} from '../core/maps.mjs';

// The layered heads, painted: every tower type with an aim wears its drawn
// head (no tower artwork on the field), the head traverses to the aim angle
// and kicks back along its own barrel line, and without an aim the painted
// artwork still lands - the fallback the loading screen and old saves rely
// on. The canvas is a recording proxy, so the machine sees the strokes.

function field(towers){
  const map=getMap('road'),p=createPlayer('a',{name:'Alice',gender:'female'}),state=createMatch([p],map.id);
  state.wave=1;state.running=false;state.towers=towers;
  const log=[],images=[];
  const doc={createElement(kind){if(kind==='canvas')return {getContext:()=>null};const image={};Object.defineProperty(image,'src',{set(){image.onload?.();}});images.push(image);return image;}};
  const ctx=new Proxy({canvas:{ownerDocument:doc}},{get(o,k){if(k in o)return o[k];return (...args)=>log.push([k,...args]);},set(o,k,v){o[k]=v;return true;}});
  const options={path:map.path,pads:map.pads,types:[{},{},{},{}],me:'a',getTowerRange};
  return {state,log,options,draw:extra=>drawCartoonBattle(ctx,state,{...options,...extra})};
}
const fourTowers=[0,1,2,3].map(type=>({pad:type,type,level:1,hp:100}));

test('all four tower types wear their drawn head when an aim is present',()=>{
  const f=field(fourTowers);
  f.draw({towerAims:{0:{angle:0,recoil:0},1:{angle:Math.PI/2,recoil:0},2:{angle:Math.PI,recoil:0},3:{angle:-Math.PI/2,recoil:0}}});
  const towerArt=f.log.filter(call=>call[0]==='drawImage'&&call[4]===58);
  assert.equal(towerArt.length,0,'no painted tower artwork lands when the heads are on');
  for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])
    assert.ok(f.log.some(call=>call[0]==='rotate'&&call[1]===angle),`a head traverses to ${angle}`);
});

test('without an aim the painted artwork still lands',()=>{
  const f=field(fourTowers);
  f.draw({});
  const towerArt=f.log.filter(call=>call[0]==='drawImage'&&call[4]===58);
  assert.equal(towerArt.length,4,'one painted tower per pad, as before');
});

test('each head kicks back along its own barrel line',()=>{
  const kick={0:-3.5,1:-5,2:-2,3:-1.5}; // recoil travel per type, in the painter
  for(const type of [0,1,2,3]){
    const f=field([{pad:0,type,level:1,hp:100}]);
    f.draw({towerAims:{0:{angle:.7,recoil:1}}});
    const at=f.log.findIndex(call=>call[0]==='rotate'&&call[1]===.7);
    assert.ok(at>=0,`type ${type} head traverses`);
    // The mount is drawn first and stays planted; the recoil translate is
    // the first one after the swing, on the barrel group only.
    const next=f.log.slice(at+1).find(call=>call[0]==='translate');
    assert.ok(next,`type ${type} head translates after the swing`);
    assert.equal(next[1],kick[type],`type ${type} recoil travel is ${kick[type]}`);
    assert.equal(next[2],0,'the kick runs along the barrel, not sideways');
  }
});

test('a head at rest does not translate sideways',()=>{
  const f=field([{pad:0,type:1,level:1,hp:100}]);
  f.draw({towerAims:{0:{angle:.7,recoil:0}}});
  const at=f.log.findIndex(call=>call[0]==='rotate'&&call[1]===.7);
  const next=f.log.slice(at+1).find(call=>call[0]==='translate');
  assert.ok(next&&next[1]===0,'no recoil, no travel');
});
