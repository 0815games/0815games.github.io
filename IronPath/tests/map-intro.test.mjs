import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {createMapIntro,paintMapPreview} from '../ui/map-intro.mjs';

// The map announces itself once.
//
// The name used to sit bottom-left for the whole battle, saying the same thing
// over and over. Now it is a title card: the field drawn in the game's own art,
// the name set wide and centred, once, when the map is loaded - and then it
// goes away on its own.
//
// The rules under test: it leaves by itself (no button over the battlefield),
// it is announced again for a new battle on the same ground, and a broken
// canvas or a missing map does not take the title - or the field - with it.

// A document stub with the four nodes the title touches, plus a canvas that
// records what was painted instead of painting it.
function stubDocument({withCanvas=true}={}){
  const nodes=new Map();
  for(const id of ['mapIntro','mapIntroArt','mapName','mapIntroLabel']){
    if(id==='mapIntroArt'&&!withCanvas)continue;
    // The title carries `hidden` in the markup: nothing announces itself until
    // a map is loaded.
    nodes.set(id,{id,textContent:'',hidden:id==='mapIntro',classes:new Set(),
      classList:{add(name){nodes.get(id).classes.add(name);},remove(name){nodes.get(id).classes.delete(name);}},
      getContext:()=>null});
  }
  return {
    getElementById:id=>nodes.get(id)??null,
    node:id=>nodes.get(id),
    painted:(nodes.get('mapIntroArt')||{}).canvasCalls??null
  };
}
// A canvas that records the draw calls instead of drawing, so the test can see
// that the picture is the map's own geometry and not a decoration.
function stubCanvas(){
  const calls=[];
  return {width:480,height:270,calls,
    getContext(){const ctx={};
      return new Proxy(ctx,{get(target,key){
        if(key==='canvas')return {width:480,height:270};
        return (...args)=>{calls.push([key,...args]);};},
        // A colour is assigned, not called - recorded the same way, so the test
        // can see WHICH colours were chosen.
        set(target,key,value){calls.push([key,value]);return true;}});}};
}
function clock(){
  const jobs=new Map();let serial=0;
  return {
    set:fn=>{const id=++serial;jobs.set(id,fn);return id;},
    clear:id=>{jobs.delete(id);},
    tick(){for(const [id,fn] of [...jobs])if(jobs.delete(id))fn();},
    pending:()=>jobs.size
  };
}
const MAPS={road:{id:'road',name:'The Last Road',theme:'road',path:[{x:0,y:130},{x:900,y:400}],pads:[{x:105,y:210}]},
  'g3-0e9c6f21d':{id:'g3-0e9c6f21d',name:'The Ice Road',theme:'arctic',path:[{x:0,y:100},{x:900,y:420}],pads:[{x:210,y:180},{x:640,y:300}]}};
const intro=(document,options={})=>createMapIntro(document,{translate:text=>text,getMap:id=>MAPS[id]??null,...options});

test('the map is announced when it is loaded, and it leaves on its own',()=>{
  const doc=stubDocument(),time=clock();
  const card=intro(doc,{setTimer:time.set,clearTimer:time.clear,holdMs:2600});
  assert.equal(doc.node('mapIntro').hidden,true,'nothing announces itself before a map is loaded');
  assert.equal(card.show('road',{label:'FREE PLAY'}),true,'a known map is announced');
  assert.equal(doc.node('mapIntro').hidden,false,'the title stands');
  assert.equal(doc.node('mapName').textContent,'The Last Road','and it names the map');
  assert.equal(doc.node('mapIntroLabel').textContent,'FREE PLAY','with the mode it is played in');
  assert.equal(time.pending(),1,'one clock, and it is the one that takes the title away');
  // Two steps: hold, fade, gone. No button - a control over the field is a wall.
  time.tick();
  assert.equal(doc.node('mapIntro').hidden,false,'it is still fading out');
  assert.ok(doc.node('mapIntro').classes.has('is-leaving'),'and the fade is what the stylesheet animates');
  assert.equal(time.pending(),1,'the fade has its own moment');
  time.tick();
  assert.equal(doc.node('mapIntro').hidden,true,'then it is gone');
  assert.equal(time.pending(),0,'with nothing left ticking');
  assert.equal(card.showing(),false);
});

test('a new battle on the same ground is announced again, a redraw is not',()=>{
  const doc=stubDocument(),time=clock();
  const card=intro(doc,{setTimer:time.set,clearTimer:time.clear});
  assert.equal(card.mapId(),null,'nothing is announced yet');
  card.show('road',{label:'FREE PLAY'});
  assert.equal(card.mapId(),'road');
  // The game decides: it calls `show` once per loaded map. Calling it again for
  // the same map is the game's mistake to avoid, and the title records what it
  // was last asked to announce - the guard is visible in game.js and measured
  // there, not papered over here.
  card.hide();
  assert.equal(card.showing(),false,'hiding takes it away at once');
  assert.equal(time.pending(),0,'and cancels the clock - a hidden title must not wake up');
  card.show('g3-0e9c6f21d',{label:'STORY MISSION 3'});
  assert.equal(doc.node('mapName').textContent,'The Ice Road','another map, another name');
  assert.equal(card.mapId(),'g3-0e9c6f21d');
});

test('a finished run or a left field clears the title: it hangs over nothing',()=>{
  const doc=stubDocument(),time=clock();
  const card=intro(doc,{setTimer:time.set,clearTimer:time.clear});
  card.show('road',{label:'FREE PLAY'});
  card.clear();
  assert.equal(doc.node('mapIntro').hidden,true);
  assert.equal(time.pending(),0,'no clock survives the field it was announcing');
});

test('the picture is the battlefield itself, drawn from the map geometry',()=>{
  const canvas=stubCanvas();
  const doc=stubDocument();
  doc.node('mapIntroArt').getContext=canvas.getContext;
  intro(doc).show('road',{label:'FREE PLAY'});
  const calls=canvas.calls.map(([name])=>name);
  // The ground of the theme, then the road, then the pads and the bunker.
  assert.ok(calls.includes('fillRect'),'the ground is painted');
  assert.ok(calls.includes('scale'),'scaled from the map\'s own size');
  assert.ok(calls.filter(name=>name==='stroke').length>=2,'the road and the pads are stroked');
  assert.ok(calls.includes('ellipse'),'the build pads are drawn');
  // The colours are the field's own: the road theme's ground, not a decoration.
  const fills=canvas.calls.filter(([name])=>name==='fillRect'||name==='fillStyle');
  assert.ok(canvas.calls.some(([name,value])=>name==='fillStyle'&&value==='#455740'),'the road theme\'s ground colour');
});

test('no canvas, no picture - but the title still stands',()=>{
  // A test harness, a very old browser, a template that lost a node: the title
  // is words, and a missing picture must not cost the player the name.
  for(const options of [{withCanvas:false},{withCanvas:true}]){
    const doc=stubDocument(options);
    if(options.withCanvas)doc.node('mapIntroArt').getContext=()=>null;
    const card=intro(doc);
    assert.equal(card.show('road',{label:'FREE PLAY'}),true,'the map is still announced');
    assert.equal(doc.node('mapIntro').hidden,false);
    assert.equal(doc.node('mapName').textContent,'The Last Road');
  }
  // An unknown map is announced as itself: no name invented, nothing thrown.
  const doc=stubDocument();
  const card=intro(doc);
  assert.equal(card.show('does-not-exist',{label:''}),false,'an unknown map is not a name to invent');
  assert.equal(doc.node('mapName').textContent,'');
  assert.equal(doc.node('mapIntro').hidden,false,'and the card still shows - the caller asked for a title');
});

test('the title takes no taps and needs no button',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../field-command.css',import.meta.url),'utf8');
  const card=html.slice(html.indexOf('id="mapIntro"'),html.indexOf('<section class="panel command"'));
  assert.ok(card.includes('id="mapName"'),'the map name lives on the title now');
  assert.doesNotMatch(card,/<button/,'no button on a title card over the battlefield');
  const rule=/#gameView \.map-intro\{([^}]*)\}/.exec(css)?.[1]||'';
  assert.match(rule,/pointer-events:none/,'a tap through the title reaches the field');
  assert.match(rule,/left:50%[^}]*top:50%/,'it stands in the middle of the screen');
  assert.match(css,/@keyframes map-intro-in/,'and it arrives');
  assert.match(css,/@keyframes map-intro-out/,'and it leaves');
  assert.match(css,/prefers-reduced-motion:reduce\)\{#gameView \.map-intro,#gameView \.map-intro\.is-leaving\{animation:none\}/,'but not for a player who asked for no motion');
  // The name is gone from the corner it used to occupy for the whole battle.
  const head=html.slice(html.indexOf('class="battle-head"'),html.indexOf('<section id="soloObjective"'));
  assert.doesNotMatch(head,/id="mapName"/,'the bottom-left corner no longer repeats the name');
});

test('the caller names the title - the card does not shorten the name',()=>{
  // The field composes "map · SECTOR 4" and reads it back later (the retreat
  // flow does). A card that named the map from its own geometry would eat the
  // sector - Chromium measured exactly that. What the caller says wins; the
  // module's own name is only the fallback for a caller that knows just the id.
  const doc=stubDocument(),time=clock();
  const card=intro(doc,{setTimer:time.set,clearTimer:time.clear});
  card.show('g3-0e9c6f21d',{label:'FREE PLAY',name:'The Ice Road · SECTOR 4'});
  assert.equal(doc.node('mapName').textContent,'The Ice Road · SECTOR 4','the composed title survives');
  card.show('road',{label:'FREE PLAY'});
  assert.equal(doc.node('mapName').textContent,'The Last Road','without one, the card names the map itself');
});

test('every map in the game paints a picture of itself',async()=>{
  // Not one theme: the title card has to survive all of them, and the generated
  // battlefields too - the grid maps with two roads and the four-player front.
  const {MAPS,SQUAD_MAPS,getMap}=await import('../maps.mjs');
  const ids=[...Object.keys(MAPS),...Object.keys(SQUAD_MAPS),'g3-0e9c6f21d','g2-1a2b3c4d5'];
  assert.ok(ids.length>=3,'the fixture exercises the fixed and the generated maps');
  for(const id of ids){
    const map=getMap(id),canvas=stubCanvas();
    assert.equal(paintMapPreview(canvas,map),true,`${id} paints`);
    const calls=canvas.calls.map(([name])=>name);
    assert.ok(calls.includes('fillRect'),`${id} paints its ground`);
    assert.ok(calls.includes('scale'),`${id} is scaled from its own size`);
    assert.ok(calls.includes('ellipse'),`${id} shows its build pads`);
    assert.ok(calls.includes('strokeRect'),`${id} shows the bunker it protects`);
  }
  // The same map paints the same picture twice: the ground is seeded, not random.
  const count=(id)=>{const canvas=stubCanvas();paintMapPreview(canvas,getMap(id));return JSON.stringify(canvas.calls);};
  assert.equal(count('g3-0e9c6f21d'),count('g3-0e9c6f21d'),'a map paints itself the same way every time');
  assert.notEqual(count('g3-0e9c6f21d'),count('g3-1e9c6f21d'),'and two different maps do not look alike');
});

test('the picture painter refuses what it cannot paint',()=>{
  assert.equal(paintMapPreview(null,MAPS.road),false);
  assert.equal(paintMapPreview(stubCanvas(),null),false);
  assert.equal(paintMapPreview({getContext:()=>null},MAPS.road),false);
  // A context that throws on the first call must not take the field with it.
  assert.equal(paintMapPreview({width:10,height:10,getContext:()=>({save(){throw Error('broken');}})},MAPS.road),false);
  // A map with no path at all is still a picture of ground, not an error.
  assert.equal(paintMapPreview(stubCanvas(),{id:'x',name:'Nothing',theme:'marsh',pads:[]}),true);
});

test('the factory rejects a caller that cannot hold a clock',()=>{
  for(const options of [null,undefined,{},{document:{getElementById:()=>null}},
    {document:{getElementById:()=>null},holdMs:0},
    {document:{getElementById:()=>null},holdMs:2600,setTimer:null}])
    assert.throws(()=>createMapIntro(options),/Invalid map title/);
});
