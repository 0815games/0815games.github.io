import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const raw=await readFile(
 new URL('../js/world/world3d-phase1.js',import.meta.url),'utf8'
);
const helper=await readFile(
 new URL('../js/world/world3d-atmosphere.js',import.meta.url),'utf8'
);

const resources=[],nodes=[];
let reduced=false,coarse=false;

globalThis.matchMedia=query=>({
 get matches(){
  return query.includes('reduced')?reduced:coarse;
 }
});
globalThis.devicePixelRatio=2;
globalThis.drawCharacter=()=>{};
globalThis.drawMonster=()=>{};
globalThis.document={
 createElement(){
  const ctx={};
  for(const key of[
   'fillRect','clearRect','beginPath','moveTo','lineTo',
   'stroke','save','restore','setTransform','scale',
   'strokeText','fillText'
  ])ctx[key]=()=>{};

  return {
   width:128,height:128,getContext:()=>ctx
  };
 }
};

const helperModule=await import(
 'data:text/javascript;base64,'+
 Buffer.from(helper).toString('base64')
);
globalThis.__phase2=helperModule;

let count=0;
const source=raw.replace(
 /^import \{(?:drawCharacter|drawMonster)\} from '\.\/(?:character|monster)\.js';$/gm,
 ()=>{count++;return '';}
).replace(
 "import {createDungeonSurfaces,createDungeonAtmosphere} from './world3d-atmosphere.js';",
 'const {createDungeonSurfaces,createDungeonAtmosphere}=globalThis.__phase2;'
);

assert.equal(count,2);

const m=await import(
 'data:text/javascript;base64,'+
 Buffer.from(source).toString('base64')
);

assert.equal(m.wants3D('?view=3d'),true);
assert.equal(m.wants3D(''),false);
assert.deepEqual(m.gridPosition(2,3),{x:2.5,y:0,z:3.5});
assert.equal(
 m.supportsWorld({tiles:[[0]],theme:'pilzwald'}),false
);
assert.equal(
 helperModule.qualityProfile('auto',true).shadows,false
);
assert.equal(
 helperModule.qualityProfile('detail',true).shadows,true
);
assert.equal(
 helperModule.qualityProfile('mobile',false).lights,2
);
assert.equal(
 helperModule.visualNoise(2,3,4),
 helperModule.visualNoise(2,3,4)
);

class V{
 constructor(x=0,y=0,z=0){this.set(x,y,z);}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
}

class Node{
 constructor(){
  this.children=[];
  this.position=new V();
  this.rotation=new V();
  this.scale=new V(1,1,1);
  this.center=new V();
  this.visible=true;
  nodes.push(this);
 }
 add(...items){
  for(const n of items){
   this.children.push(n);
   n.parent=this;
  }
 }
 remove(n){
  this.children=this.children.filter(x=>x!==n);
  n.parent=null;
 }
 lookAt(){}
 updateMatrixWorld(){}
 updateProjectionMatrix(){}
}

class R{
 constructor(){
  this.disposed=false;
  resources.push(this);
 }
 dispose(){this.disposed=true;}
}

class Color{
 constructor(value){this.value=value;}
 set(value){this.value=value;return this;}
}

class Material extends R{
 constructor(options={}){
  super();
  Object.assign(this,options);
  this.color=new Color(options.color);
 }
}

class Geometry extends R{
 constructor(...args){super();this.args=args;}
}

class Mesh extends Node{
 constructor(geometry,material){
  super();
  this.geometry=geometry;
  this.material=material;
 }
}

class Sprite extends Node{
 constructor(material){super();this.material=material;}
}

class Sun extends Node{
 constructor(){
  super();
  this.target=new Node();
  this.shadow={camera:new Node(),mapSize:new V()};
 }
}

class GPU{
 constructor(){this.shadowMap={};}
 setPixelRatio(value){this.ratio=value;}
 setClearColor(){}
 setSize(){}
 render(){}
 dispose(){}
}

const T={
 WebGLRenderer:GPU,Scene:Node,Group:Node,Color,
 Fog:class{},OrthographicCamera:Node,
 HemisphereLight:Node,DirectionalLight:Sun,
 PointLight:Node,
 BoxGeometry:Geometry,OctahedronGeometry:Geometry,
 RingGeometry:Geometry,
 MeshStandardMaterial:Material,
 MeshBasicMaterial:Material,SpriteMaterial:Material,
 Mesh,Sprite,CanvasTexture:R,
 Raycaster:class{
  constructor(){
   this.ray={intersectPlane(){return null;}};
  }
  setFromCamera(){}
 },
 Vector2:V,Vector3:V,Plane:class{},
 SRGBColorSpace:1,NoColorSpace:2,
 NearestFilter:3,LinearFilter:4,
 PCFSoftShadowMap:5,DoubleSide:6,
 ACESFilmicToneMapping:7
};

const freeze=value=>{
 if(value&&typeof value==='object'){
  Object.freeze(value);
  Object.values(value).forEach(freeze);
 }
 return value;
};

const w=freeze({
 tiles:[[1,1,1],[0,0,0],[0,0,0]],
 discovered:[
  [true,true,true],
  [true,true,false],
  [true,false,false]
 ],
 theme:'katakomben',seed:2,
 monsters:[
  {id:'visible',x:1,y:1,hp:3,maxHp:3},
  {id:'hidden',x:2,y:1,hp:3,maxHp:3}
 ],
 chests:[{x:0,y:1,open:false}],
 stairs:{x:0,y:2}
});

const p=freeze({
 x:0,y:1,hp:20,heroClass:'warrior',equipped:{}
});

const fx=freeze({
 particles:[{x:16,y:48,a:.8,c:'#fff',size:4}],
 waves:[{x:16,y:48,a:.7,r:16,color:'#fff'}],
 texts:[{x:16,y:48,a:1,c:'#fff',txt:'TEST',size:30}],
 flashEffect:{strength:.8,elapsed:.2,duration:1}
});

const before=JSON.stringify({w,p,fx});
const sites=helperModule.torchSites(w,p,4);
assert.ok(sites.length<=4);

for(const site of sites){
 const x=Math.floor(site.x),y=Math.floor(site.z)-1;
 assert.ok(w.discovered[y][x]&&w.discovered[y+1][x]);
}

const engine=m.createEngine(T,{
 getBoundingClientRect:()=>({
  left:0,top:0,width:320,height:240
 })
});

engine.resize(320,240);
engine.render(w,p,1,fx);

assert.equal(
 nodes.filter(
  n=>n instanceof Sprite&&n.parent&&n.visible
 ).length,
 3,'hero, known monster, effect text'
);

const nr=resources.length;
engine.render(w,p,1.1,fx);
assert.equal(resources.length,nr,'resource reuse');
assert.equal(
 JSON.stringify({w,p,fx}),before,
 'game state unchanged'
);

engine.setQuality('mobile');
engine.render(w,p,2,fx);
engine.setQuality('detail');
reduced=true;
engine.render(w,p,3,fx);

assert.ok(
 nodes.filter(
  n=>n instanceof Sprite&&n.parent&&n.visible
 ).length>=2
);

engine.dispose();
assert.ok(
 resources.every(x=>x.disposed),
 'all owned GPU resources disposed'
);

assert.ok(raw.includes(
 'atmosphere.update(w,p,time,effects)'
));
assert.ok(raw.includes(
 'entry.floor.visible=!(w.stairs'
));
assert.ok(!helper.includes('Math.random'));

console.log(
 'BESTANDEN: Phase-1-Regression, Qualitätsprofile, '+
 'deterministische Materialien, verborgene Gegner, Effekte, '+
 'Zustandsschutz und Ressourcenentsorgung. '+
 'Kein echter WebGL-/Pixel-/Leistungstest.'
);
