
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const raw=await readFile(
 new URL('../js/world/world3d-phase1.js',import.meta.url),'utf8'
);
let imports=0;
const source=raw.replace(
 /^import \{(?:drawCharacter|drawMonster)\} from '\.\/(?:character|monster)\.js';$/gm,
 ()=>{imports++;return '';}
);
assert.equal(imports,2);

globalThis.drawCharacter=()=>{};
globalThis.drawMonster=()=>{};
globalThis.matchMedia=()=>({matches:false});
globalThis.devicePixelRatio=1;
globalThis.document={
 createElement(){
  return {
   width:128,height:128,
   getContext(){
    return {
     setTransform(){},clearRect(){},
     save(){},restore(){},scale(){}
    };
   }
  };
 }
};

const m=await import(
 'data:text/javascript;base64,'+
 Buffer.from(source).toString('base64')
);

assert.deepEqual(m.gridPosition(2,3),{x:2.5,y:0,z:3.5});
assert.equal(m.wants3D('?view=3d'),true);
assert.equal(m.wants3D(''),false);
assert.equal(
 m.supportsWorld({tiles:[[0]],theme:'katakomben'}),true
);
assert.equal(
 m.supportsWorld({tiles:[[0]],theme:'pilzwald'}),false
);

const nodes=[],resources=[];

class Vector{
 constructor(x=0,y=0,z=0){this.set(x,y,z);}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
}
class Node{
 constructor(){
  this.children=[];
  this.position=new Vector();
  this.rotation=new Vector();
  this.scale=new Vector(1,1,1);
  this.center=new Vector();
  nodes.push(this);
 }
 add(n){this.children.push(n);n.parent=this;}
 remove(n){
  this.children=this.children.filter(x=>x!==n);
  n.parent=null;
 }
 lookAt(){}
 updateMatrixWorld(){}
 updateProjectionMatrix(){}
}
class Resource{
 constructor(){this.disposed=false;resources.push(this);}
 dispose(){this.disposed=true;}
}
class Material extends Resource{
 constructor(options){super();Object.assign(this,options);}
}
class Mesh extends Node{
 constructor(geometry,material){
  super();this.geometry=geometry;this.material=material;
 }
}
class Sprite extends Node{
 constructor(material){super();this.material=material;}
}
class GPU{
 setPixelRatio(){}
 setClearColor(){}
 setSize(){}
 render(){this.rendered=true;}
 dispose(){}
}

const T={
 WebGLRenderer:GPU,Scene:Node,Group:Node,
 Color:class{},Fog:class{},
 OrthographicCamera:Node,
 HemisphereLight:Node,DirectionalLight:Node,
 BoxGeometry:Resource,
 MeshStandardMaterial:Material,SpriteMaterial:Material,
 Mesh,Sprite,CanvasTexture:Resource,
 Raycaster:class{
  constructor(){
   this.ray={intersectPlane(){return null;}};
  }
  setFromCamera(){}
 },
 Vector2:Vector,Vector3:Vector,Plane:class{},
 SRGBColorSpace:1,NearestFilter:2,LinearFilter:3
};

const frozen=value=>{
 if(value&&typeof value==='object'){
  Object.freeze(value);
  Object.values(value).forEach(frozen);
 }
 return value;
};

const w=frozen({
 tiles:[[1,0],[0,0]],
 discovered:[[true,true],[false,false]],
 theme:'katakomben',seed:2,
 monsters:[
  {id:'visible',x:1,y:0,hp:3,maxHp:3},
  {id:'hidden',x:1,y:1,hp:3,maxHp:3}
 ],
 chests:[]
});
const p=frozen({
 x:1,y:0,hp:20,heroClass:'warrior',equipped:{}
});
const before=JSON.stringify({w,p});

const engine=m.createEngine(T,{
 getBoundingClientRect:()=>({
  left:0,top:0,width:320,height:240
 })
});
engine.resize(320,240);
engine.render(w,p,1);

assert.equal(
 nodes.filter(n=>n instanceof Sprite&&n.parent).length,
 2,'only hero and discovered monster'
);

const count=resources.length;
engine.render(w,p,1.1);
assert.equal(resources.length,count,'reuse resources');
assert.equal(m.discovered(w,1,1),false);
assert.equal(m.discovered(w,1,0),true);
assert.equal(JSON.stringify({w,p}),before,'state unchanged');

engine.dispose();
assert.ok(
 resources.every(r=>r.disposed),
 'dispose geometries/materials/textures'
);

const renderer=await readFile(
 new URL('../js/world/render.js',import.meta.url),'utf8'
);
assert.ok(renderer.includes('this.world3d?.render()'));
assert.ok(renderer.includes('this.world3d.active'));
assert.ok(renderer.includes('installWorld3D(this,state)'));

console.log(
 'BESTANDEN: Koordinaten, Katakomben-Grenze, verborgene Gegner, '+
 'Zustandsschutz, Ressourcen und Renderer-Anbindung. '+
 'Kein WebGL-/Browsernachweis.'
);
