
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(
 new URL('../js/world/dungeon-world.js',import.meta.url),'utf8'
);
const canvases=[];

function fakeCanvas() {
 const cv={width:320,height:240};
 const ops=[],stack=[];
 const c={
  canvas:cv,ops,depth:0,globalAlpha:1,
  fillStyle:'#000',globalCompositeOperation:'source-over'
 };
 const methods=[
  'setTransform','translate','scale','rotate',
  'beginPath','closePath','moveTo','lineTo','quadraticCurveTo',
  'ellipse','arc','rect','clip','stroke','fill','strokeRect',
  'fillRect','drawImage','fillText'
 ];

 for(const method of methods) {
  c[method]=(...args)=>{
   for(const value of args) {
    if(typeof value==='number') {
     assert.ok(Number.isFinite(value),method+' finite');
    }
   }
   ops.push({method,args,fill:c.fillStyle,alpha:c.globalAlpha});
  };
 }

 c.save=()=>{
  stack.push({
   globalAlpha:c.globalAlpha,fillStyle:c.fillStyle,
   globalCompositeOperation:c.globalCompositeOperation
  });
  c.depth++;
 };
 c.restore=()=>{
  assert.ok(stack.length>0,'balanced restore');
  Object.assign(c,stack.pop());
  c.depth--;
 };
 c.createRadialGradient=c.createLinearGradient=
  ()=>({addColorStop(){}});
 cv.getContext=()=>c;
 canvases.push(cv);
 return cv;
}

globalThis.document={createElement:()=>fakeCanvas()};
globalThis.matchMedia=()=>({matches:false});

const mod=await import(
 'data:text/javascript;base64,'+
 Buffer.from(source).toString('base64')
);

for(let i=0;i<100;i++) {
 assert.equal(mod.tileNoise(i,-i,123),mod.tileNoise(i,-i,123));
}
assert.notEqual(mod.tileNoise(2,3,1),mod.tileNoise(2,3,2));
assert.equal(mod.themeName('missing'),'katakomben');
assert.equal(mod.lightStrength(10,3,true),.82);

function freeze(value) {
 if(value&&typeof value==='object') {
  Object.freeze(value);
  for(const item of Object.values(value))freeze(item);
 }
 return value;
}

function makeWorld(theme) {
 return {
  seed:77,theme,cols:4,rows:4,
  tiles:[
   [1,1,1,1],[1,0,0,1],
   [1,0,0,1],[1,1,1,1]
  ],
  discovered:[
   [true,true,true,false],
   [true,true,true,false],
   [true,true,false,false],
   [false,false,false,false]
  ],
  stairs:{x:2,y:1},
  chests:[{x:1,y:2,open:false}],
  monsters:[
   {id:'visible',x:2,y:1},
   {id:'hidden',x:2,y:2}
  ]
 };
}

const player=freeze({x:1,y:1,hp:50,equipped:{}});

for(const theme of Object.keys(mod.WORLD_THEMES)) {
 const world=freeze(makeWorld(theme));
 const before=JSON.stringify(world);
 const cv=fakeCanvas(),drawn=[];

 const renderer={
  cv,ctx:cv.getContext('2d'),tile:32,camera:{x:0,y:0},
  _visualTime:2,
  particles:[{x:48,y:48,a:.7,c:'#fff',size:4}],
  waves:[{x:48,y:48,r:10,a:.8,color:'#fff'}],
  texts:[{x:48,y:48,a:1,c:'#fff',size:28,txt:'TEST'}],
  flashEffect:{
   color:'#ffe082',strength:.8,duration:1,elapsed:.2
  },
  updateCamera(){},
  drawWallDecor(){},
  drawMonster(c,m){drawn.push(m.id);}
 };

 let heroes=0;
 mod.drawDungeonWorld(renderer,world,player,()=>heroes++);

 assert.equal(heroes,1);
 assert.deepEqual(drawn,['visible']);
 assert.equal(JSON.stringify(world),before);
 assert.equal(renderer.ctx.depth,0);

 assert.ok(renderer.ctx.ops.some(
  o=>o.method==='arc'&&o.args[2]===10
 ),'shockwave');
 assert.ok(renderer.ctx.ops.some(
  o=>o.method==='fillText'&&o.args[0]==='TEST'
 ),'effect text');
 assert.ok(renderer.ctx.ops.some(
  o=>o.method==='fillRect'&&o.fill==='#ffe082'
 ),'flash');

 assert.equal(mod.knownTile(world,2,2),false);
 assert.equal(mod.knownTile(world,1,1),true);

 const openWorld=freeze({
  ...makeWorld(theme),chests:[{x:1,y:2,open:true}]
 });
 mod.drawDungeonWorld(renderer,openWorld,player,()=>{});
 assert.equal(world.chests[0].open,false);
 assert.equal(renderer.ctx.depth,0);
}

const renderer=await readFile(
 new URL('../js/world/render.js',import.meta.url),'utf8'
);
const compatibility=await readFile(
 new URL('../js/systems/living-world.js',import.meta.url),'utf8'
);

assert.ok(renderer.includes(
 'drawDungeonWorld(this,state.world,state.player,drawCharacter)'
));
assert.ok(!compatibility.includes('Renderer.prototype'));
assert.ok(!source.includes('Math.random'));

for(const cv of canvases) {
 assert.equal(cv.getContext('2d').depth,0);
}

console.log(
 'BESTANDEN: fünf Themen, stabile Texturen, unveränderter Zustand, '+
 'unbekannte Gegner verborgen, Effekte und Canvas-Balance. '+
 'Keine Pixel-/Browserabnahme.'
);
