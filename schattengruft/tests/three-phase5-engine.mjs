// Phase 5 – Engine im Kampfmodus mit Three.js-Doppel.
//
// Anders als three-phase5.mjs (reine Rechnung) laeuft hier der echte
// createEngine-Pfad: Kamera, Figuren, Buehnenplaetze und Sichtbarkeit.
// Kein echter WebGL-/Pixel-/Leistungstest.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const raw=await readFile(
 new URL('../js/world/world3d-phase1.js',import.meta.url),'utf8'
);
const helper=await readFile(
 new URL('../js/world/world3d-atmosphere.js',import.meta.url),'utf8'
);
const stageModule=await import(
 new URL('../js/world/world3d-stage.js',import.meta.url)
);
globalThis.__stage=stageModule;

let reduced=false;
globalThis.matchMedia=q=>({get matches(){return q.includes('reduced')?reduced:false;}});
globalThis.devicePixelRatio=1;
globalThis.drawCharacter=()=>{};globalThis.drawMonster=()=>{};
const ctx={};for(const k of['fillRect','clearRect','beginPath','moveTo','lineTo','stroke','save','restore','setTransform','scale','strokeText','fillText','measureText','closePath','fill','arc','ellipse'])ctx[k]=()=>({width:10});
ctx.createRadialGradient=()=>({addColorStop(){}});
globalThis.document={createElement(){return{width:128,height:128,getContext:()=>ctx};}};

const helperModule=await import('data:text/javascript;base64,'+Buffer.from(helper).toString('base64'));
globalThis.__phase2=helperModule;
const decorModule=await import(
 new URL('../js/world/world3d-decor.js',import.meta.url)
);
globalThis.__decor=decorModule;

let source=raw.replace(
 "import {createFigureFactory} from './world-actors3d.js';",
 'const createFigureFactory=()=>({supports:()=>false,signature:()=>"",create:()=>null,dispose(){}});'
).replace(/^import \{(?:drawCharacter|drawMonster)\} from '\.\/(?:character|monster)\.js';$/gm,'')
.replace(/import \{([^}]*)\} from '\.\/world3d-stage\.js';/, (_,n)=>'const {'+n+'}=globalThis.__stage;')
.replace("import {createDungeonSurfaces,createDungeonAtmosphere,theme3D,supportsTheme3D,tileVisible} from './world3d-atmosphere.js';",
 'const {createDungeonSurfaces,createDungeonAtmosphere,theme3D,supportsTheme3D,tileVisible}=globalThis.__phase2;')
.replace("import {wallDecorSites,createWallDecorTextures,createGlowTexture,createVignetteTexture} from './world3d-decor.js';",
 'const {wallDecorSites,createWallDecorTextures,createGlowTexture,createVignetteTexture}=globalThis.__decor;');

const m=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

const nodes=[];
class V{constructor(x=0,y=0,z=0){this.set(x,y,z);}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
class Node{constructor(){this.children=[];this.position=new V();this.rotation=new V();this.scale=new V(1,1,1);this.center=new V();this.visible=true;nodes.push(this);}add(...i){for(const n of i){this.children.push(n);n.parent=this;}}remove(n){this.children=this.children.filter(x=>x!==n);n.parent=null;}lookAt(x,y,z){this.lookAtArgs=[x,y,z];}updateMatrixWorld(){}updateProjectionMatrix(){this.projUpdates=(this.projUpdates||0)+1;}}
class R{constructor(){this.disposed=false;}dispose(){this.disposed=true;}}
class Color{constructor(v){this.value=v;}set(v){this.value=v;return this;}}
class Mat extends R{constructor(o={}){super();Object.assign(this,o);this.color=new Color(o.color);}}
class Geo extends R{constructor(...a){super();this.args=a;}}
class Mesh extends Node{constructor(g,mm){super();this.geometry=g;this.material=mm;}}
class Sprite extends Node{constructor(mm){super();this.material=mm;}}
class Cam extends Node{constructor(l,r,t,b,n,f){super();this.left=l;this.right=r;this.top=t;this.bottom=b;this.near=n;this.far=f;this.zoom=1;}}
class Sun extends Node{constructor(){super();this.target=new Node();this.shadow={camera:new Node(),mapSize:new V()};}}
class GPU{constructor(){this.shadowMap={};this.renders=0;}setPixelRatio(){}setClearColor(){}setSize(){}render(){this.renders++;}dispose(){}}
const T={WebGLRenderer:GPU,Scene:Node,Group:Node,Color,Fog:class{constructor(){this.color=new Color();}},OrthographicCamera:Cam,
 HemisphereLight:Node,DirectionalLight:Sun,PointLight:Node,BoxGeometry:Geo,OctahedronGeometry:Geo,RingGeometry:Geo,
 PlaneGeometry:Geo,ConeGeometry:Geo,TorusGeometry:Geo,CylinderGeometry:Geo,SphereGeometry:Geo,
 MeshStandardMaterial:Mat,MeshBasicMaterial:Mat,SpriteMaterial:Mat,Mesh,Sprite,CanvasTexture:R,
 Raycaster:class{constructor(){this.ray={intersectPlane(){return null;}}}setFromCamera(){}},
 Vector2:V,Vector3:V,Plane:class{},SRGBColorSpace:1,NoColorSpace:2,NearestFilter:3,LinearFilter:4,
 PCFSoftShadowMap:5,DoubleSide:6,ACESFilmicToneMapping:7,ClampToEdgeWrapping:8};

const freeze=v=>{if(v&&typeof v==='object'){Object.freeze(v);Object.values(v).forEach(freeze);}return v;};

// 10x8-Karte, Held und Gegner weit auseinander -> Buehne muss zusammenruecken.
const tiles=[];
const discovered=[];
for(let y=0;y<8;y++){tiles.push(new Array(10).fill(0));discovered.push(new Array(10).fill(false));}
discovered[2][1]=true; // nur das Feld des Helden ist bekannt

const w=freeze({tiles,discovered,theme:'katakomben',seed:7,
 monsters:[{id:'m1',x:7,y:2,hp:9,maxHp:9,shape:'rat'}],
 chests:[],stairs:{x:0,y:7}});
const p=freeze({x:1,y:2,hp:20,heroClass:'warrior',equipped:{}});
const enemy=w.monsters[0];

const fx={particles:[{x:(enemy.x+.5)*32,y:(enemy.y+.5)*32,a:.9,c:'#fff',size:4}],
 waves:[{x:(enemy.x+.5)*32,y:(enemy.y+.5)*32,a:.8,r:16,color:'#f00'}],
 texts:[{x:(enemy.x+.5)*32,y:(enemy.y+.5)*32,a:1,c:'#f00',txt:'-7',size:30}],
 flashEffect:{strength:.6,elapsed:.1,duration:.5}};

const engine=m.createEngine(T,{getBoundingClientRect:()=>({left:0,top:0,width:320,height:240})});
engine.resize(320,240);

const camera=nodes.find(n=>n instanceof Cam);

// --- Erkundung ---
engine.render(w,p,1,fx,'explore',null);
assert.ok(Math.abs(camera.position.x-1.5)<1e-6,'Erkundung: Kamera auf Held');
assert.ok(Math.abs(camera.zoom-1)<1e-9,'Erkundung: Zoom 1');

// --- Kampf: mehrere Frames fuer den Uebergang ---
for(let i=2;i<40;i++)engine.render(w,p,i*.1,fx,'combat',enemy);
const centerX=(1.5+7.5)/2;
assert.ok(Math.abs(camera.position.x-centerX)<.05,'Kampf: Kamera in der Mitte, ist '+camera.position.x);
assert.ok(camera.zoom>1.5,'Kampf: herangezoomt, zoom='+camera.zoom);
assert.ok(camera.zoom<=1.81,'Kampf: Zoom nicht uebers Ziel hinaus, zoom='+camera.zoom);

// --- Gegner war nie aufgedeckt, muss aber sichtbar sein ---
const enemySprites=nodes.filter(n=>n instanceof Sprite&&n.parent&&n.visible&&
  Math.abs(n.position.z-2.5)<1.5&&n.position.x>4);
assert.ok(enemySprites.length>0,'Gegner-Sprite auf der Buehne sichtbar (unentdeckt!)');

// --- Held steht links ---
const heroSprite=nodes.find(n=>n instanceof Sprite&&n.parent&&n.visible&&
  Math.abs(n.position.x-1.5)<2&&Math.abs(n.position.z-2.5)<1);
assert.ok(heroSprite,'Held steht in Buehnennähe');

// --- Buehnenplaetze: Abstand fix ---
const spots=stageModule.stagePositions(stageModule.stageCenter(p,enemy),stageModule.worldBounds(w));
assert.ok(spots.enemy.x<7.5,'Gegner wurde von seiner Kachel herangeholt');
assert.ok(spots.hero.x>1.5,'Held wurde von seiner Kachel herangeholt');

// --- Rueckfall: Kampf ohne Gegner ---
engine.render(w,p,9,fx,'combat',null);
assert.ok(nodes.filter(n=>n instanceof Sprite&&n.visible).length>=1,'kein Absturz ohne Gegner');

// --- Zurueck in die Erkundung ---
for(let i=0;i<80;i++)engine.render(w,p,10+i*.1,fx,'explore',null);
assert.ok(Math.abs(camera.position.x-1.5)<.05,'Rueckkehr: Kamera wieder auf Held');
assert.ok(Math.abs(camera.zoom-1)<.01,'Rueckkehr: Zoom wieder 1, zoom='+camera.zoom);

// --- Zustand unveraendert ---
assert.equal(JSON.stringify(w),JSON.stringify(freeze({tiles,discovered,theme:'katakomben',seed:7,
 monsters:[{id:'m1',x:7,y:2,hp:9,maxHp:9,shape:'rat'}],chests:[],stairs:{x:0,y:7}})),'Welt unveraendert');
assert.equal(p.hp,20,'Spieler unveraendert');
assert.equal(enemy.hp,9,'Gegner unveraendert');

// --- Neuer Grundriss (Ebenenwechsel): Kamera springt sofort, kein Flug ----
const tiles2=[];
const disc2=[];
for(let y=0;y<8;y++){tiles2.push(new Array(10).fill(0));disc2.push(new Array(10).fill(true));}
const w2=freeze({tiles:tiles2,discovered:disc2,theme:'katakomben',seed:8,
 monsters:[],chests:[],stairs:{x:9,y:7}});
const p2=freeze({x:8,y:6,hp:20,heroClass:'warrior',equipped:{}});

engine.render(w2,p2,20,fx,'explore',null);
assert.ok(
 Math.abs(camera.position.x-8.5)<1e-6,
 'neue Ebene: Kamera steht sofort am Helden, x='+camera.position.x
);
assert.ok(Math.abs(camera.zoom-1)<1e-6,'neue Ebene: Zoom zurueckgesetzt');

const disposed=engine.dispose();
assert.equal(disposed,undefined,'dispose ohne Rueckgabe');

console.log(
 'BESTANDEN: Engine-Kampfbuehne – Kameraübergang hin und zurück, Zoom, '+
 'unentdeckter Gegner sichtbar, Bühne rückt am Rand zusammen, '+
 'Spielzustand unberührt. Keine Browser-/Pixelabnahme.'
);
