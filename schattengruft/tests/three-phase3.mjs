import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

let reduce=false;
globalThis.matchMedia=()=>({
 get matches(){return reduce;}
});

const characters=await readFile(
 new URL('../js/world/character.js',import.meta.url),'utf8'
);
const characterModule=await import(
 'data:text/javascript;base64,'+
 Buffer.from(characters).toString('base64')
);
globalThis.__weaponVisual=characterModule.getWeaponVisual;

const raw=await readFile(
 new URL('../js/world/world-actors3d.js',import.meta.url),'utf8'
);
assert.ok(raw.includes(
 "import {getWeaponVisual} from './character.js';"
));
const source=raw.replace(
 "import {getWeaponVisual} from './character.js';",
 'const getWeaponVisual=globalThis.__weaponVisual;'
);
const m=await import(
 'data:text/javascript;base64,'+
 Buffer.from(source).toString('base64')
);

const resources=[];

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
  this.visible=true;
 }
 add(...nodes){
  for(const n of nodes){
   this.children.push(n);
   n.parent=this;
  }
 }
}
class Resource{
 constructor(...args){
  this.args=args;
  this.disposed=false;
  resources.push(this);
 }
 dispose(){this.disposed=true;}
}
class Material extends Resource{
 constructor(options){
  super();
  Object.assign(this,options);
 }
}
class Mesh extends Node{
 constructor(geometry,material){
  super();
  this.geometry=geometry;
  this.material=material;
 }
}

const T={
 Group:Node,Mesh,MeshStandardMaterial:Material,
 BoxGeometry:Resource,SphereGeometry:Resource,
 CylinderGeometry:Resource,ConeGeometry:Resource,
 OctahedronGeometry:Resource,TorusGeometry:Resource
};

const factory=m.createFigureFactory(T);

const freeze=value=>{
 if(value&&typeof value==='object'){
  Object.freeze(value);
  Object.values(value).forEach(freeze);
 }
 return value;
};

function named(node,name){
 return node.name===name||
  node.children.some(n=>named(n,name));
}

const heroes=[
 freeze({
  x:1,y:1,hp:50,heroClass:'warrior',
  equipped:{
   mainhand:'runic_blade',head:'iron_helmet',
   body:'knight_armor',offhand:'iron_shield',
   feet:'leather_boots',ring:'ruby_ring'
  }
 }),
 freeze({
  x:1,y:1,hp:30,heroClass:'mage',
  equipped:{mainhand:'order_mage_1'}
 }),
 freeze({
  x:1,y:1,hp:35,heroClass:'rogue',
  equipped:{mainhand:'dagger'}
 })
];

for(const hero of heroes){
 const before=JSON.stringify(hero);
 const model=factory.create(hero,true);
 assert.ok(model);

 model.update(hero,1);
 assert.equal(model.node.position.x,1.5);
 assert.equal(model.node.position.z,1.5);

 const next=freeze({
  ...hero,x:2,hp:hero.hp-1
 });
 const nextBefore=JSON.stringify(next);

 model.update(next,1.1);
 model.update(next,1.2);
 assert.ok(
  model.node.position.x>1.5&&model.node.position.x<2.5,
  'interpolated movement'
 );

 reduce=true;
 model.update(next,1.21);
 assert.equal(model.node.position.x,2.5);
 reduce=false;

 assert.equal(JSON.stringify(hero),before);
 assert.equal(JSON.stringify(next),nextBefore);

 if(hero.heroClass==='warrior'){
  for(const name of[
   'helmet','shield','blade','ring','boot'
  ])assert.ok(named(model.node,name),name);
 }
 if(hero.heroClass==='mage'){
  assert.ok(named(model.node,'staff'));
  assert.ok(named(model.node,'hat'));
 }
 if(hero.heroClass==='rogue'){
  assert.ok(named(model.node,'hood'));
 }

 model.dispose();
 assert.equal(model.node.visible,false);
}

assert.equal(
 m.equipmentVisual(heroes[1]).weapon,'staff'
);
assert.equal(
 m.equipmentVisual(heroes[2]).weapon,'dagger'
);
assert.notEqual(
 m.figureSignature(heroes[0],true),
 m.figureSignature({...heroes[0],equipped:{}},true)
);

for(const shape of[
 'goblin','skeleton','rat','slime','bat'
]){
 const monster=freeze({
  x:2,y:3,shape,color:'#628d58',
  hp:5,maxHp:10,elite:true
 });
 const before=JSON.stringify(monster);

 assert.equal(factory.supports(monster,false),true);
 const model=factory.create(monster,false);
 model.update(monster,3);

 assert.ok(named(model.node,'health'));
 assert.ok(named(model.node,'elite-ring'));
 assert.equal(JSON.stringify(monster),before);
 model.dispose();
}

assert.equal(
 factory.supports({shape:'wraith'},false),false
);
assert.equal(
 factory.create({shape:'wraith'},false),null
);

const number=resources.length;
const another=factory.create(heroes[0],true);
assert.equal(resources.length,number,'reuse resources');
another.dispose();

factory.dispose();
factory.dispose();
assert.ok(
 resources.every(r=>r.disposed),'resource cleanup'
);

const engine=await readFile(
 new URL('../js/world/world3d-phase1.js',import.meta.url),'utf8'
);
assert.ok(engine.includes('figures.supports(value,hero)'));
assert.ok(engine.includes('entry.figure.update(value,time)'));
assert.ok(engine.includes('figures.dispose()'));

console.log(
 'BESTANDEN: drei Klassen, Ausrüstung, fünf Gegnermodelle, '+
 'Sprite-Rückfall, Bewegungsdarstellung, Zustandsfreiheit '+
 'und Ressourcen. Keine Browser-/Pixelabnahme.'
);
