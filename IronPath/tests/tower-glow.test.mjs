import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawCartoonBattle} from '../core/cartoon-art.mjs';
import {createMatch,PATH,PADS,getTowerRange} from '../core/simulation.mjs';
import {createPlayer} from '../core/match.mjs';
import {readFileSync} from 'node:fs';

// The prestige glow, measured.
//
// The operator's verdict on the tower glow was short: too weak to notice. The
// machine cannot see the field, but it can read back what the brush was told -
// how much light, how far it reaches, and whether the light is painted UNDER
// the tower or over it. That last one is the real risk: a glow bright enough to
// please is a glow bright enough to hide the tower it belongs to.

// A canvas that records every brush setting, not just the calls. `shadowBlur`
// is a property, not a call, so a proxy that only logs calls sees a glow that
// is not there.
function recordingCanvas(){
  const sets=[],calls=[];
  const target={};
  const ctx=new Proxy(target,{
    get(t,key){
      if(key==='createRadialGradient')return (...args)=>{
        assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),'the glow has real coordinates');
        calls.push(['gradient',...args]);
        const stops=[];const g={addColorStop:(offset,color)=>{assert.ok(Number.isFinite(offset)&&offset>=0&&offset<=1,'a gradient stop inside the gradient');
          assert.match(color,/^rgba?\(/,'a colour the canvas understands');stops.push([offset,color]);},get stops(){return stops;}};
        return g;
      };
      if(key in t)return t[key];
      return (...args)=>{assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),`${String(key)} got a non-finite number`);calls.push([String(key),...args]);};
    },
    set(t,key,value){sets.push([String(key),value]);t[key]=value;return true;}});
  return {ctx,sets,calls};
}

const p=createPlayer('a',{name:'Alice',gender:'female'});
const opts={path:PATH,pads:PADS,types:[{color:'#a'},{color:'#b'},{color:'#c'},{color:'#d'}],me:'a',getTowerRange};
const plain=()=>{const m=createMatch([p]);m.towers=[{id:1,type:0,pad:0,level:1,branch:0,ownerId:'a'}];return m;};
const shiny=()=>{const m=createMatch([p]);m.towers=[{id:1,type:0,pad:0,level:13,branch:0,ownerId:'a'}];return m;};

test('a prestige tower glows, and a plain one does not',()=>{
  const quiet=recordingCanvas();
  drawCartoonBattle(quiet.ctx,plain(),opts);
  assert.equal(quiet.sets.filter(([key])=>key==='shadowColor').length,0,'an ordinary tower asks for no light');

  const lit=recordingCanvas();
  drawCartoonBattle(lit.ctx,shiny(),opts);
  // IPL-0128: the prestige halo is amethyst - the upgrade cue keeps its gold,
  // the halo no longer masquerades as one.
  const glows=lit.sets.filter(([key,value])=>key==='shadowColor'&&/^#b48ce0$/i.test(value));
  assert.ok(glows.length>=1,'a prestige tower asks for light');
  assert.ok(lit.sets.some(([key,value])=>key==='shadowBlur'&&value>=20),
    'and for enough of it to be seen - the first version asked for 15 and was called too weak');
});

test('the glow is painted under the tower, not over it',()=>{
  const f=recordingCanvas();
  drawCartoonBattle(f.ctx,shiny(),opts);
  assert.ok(f.calls.some(([name])=>name==='gradient'),'the pool of light is painted');
  // Ordering is a property of the source, not of the stubbed brush: in this
  // environment `sprite()` has no images to hand, so the tower is drawn by the
  // vector fallback and no drawImage ever happens. What matters is that the
  // light goes down BEFORE the tower does - a glow over the tower hides the
  // thing it is meant to point at, and that is the one way of making a glow
  // "stronger" that makes the field worse.
  const source=readFileSync(new URL('../core/cartoon-art.mjs',import.meta.url),'utf8');
  const glow=source.indexOf('if(display.prestige){');
  const artwork=source.indexOf("sprite(ctx,['mg2','cannon2','flak2','sniper2']");
  const fallback=source.indexOf("fallbackMarker(ctx,x,y-6,['MG','C','AA','S']");
  assert.ok(glow>=0,'there is a prestige glow');
  assert.ok(artwork>=0,'and a tower drawn from artwork');
  assert.ok(glow<artwork,'the glow is painted before the tower, so it lies beneath it');
  assert.ok(glow<fallback,'and before the fallback mark too, for fields with no images');
});

// The module is imported with the release stamp, not its own wave: the
// cache-chain test forbids a second instance of a module the game holds once.
// So the glow ships with the next build stamp, not before it.
test('the glow keeps its shape with reduced motion and stays visible',()=>{
  for(const reducedMotion of [true,false]){
    const f=recordingCanvas();
    drawCartoonBattle(f.ctx,shiny(),{...opts,reducedMotion});
    assert.ok(f.sets.some(([key,value])=>key==='shadowBlur'&&value>=20),
      `reduced motion is calm, not dark (reducedMotion=${reducedMotion})`);
    assert.ok(f.calls.some(([name])=>name==='gradient'),'the pool of light is there either way');
  }
});
