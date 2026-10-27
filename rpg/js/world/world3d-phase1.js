import {drawCharacter} from './character.js';
import {drawMonster} from './monster.js';

export function discovered(w,x,y){
 return Number.isInteger(x)&&Number.isInteger(y)
  &&!!w.discovered?.[y]?.[x]&&w.tiles?.[y]?.[x]!==undefined;
}
export function gridPosition(x,y){
 return {x:x+.5,y:0,z:y+.5};
}
export function wants3D(search){
 return new URLSearchParams(search).get('view')==='3d';
}
export function supportsWorld(w){
 return !!w?.tiles?.length&&(!w.theme||w.theme==='katakomben');
}

export function installWorld3D(renderer,state){
 const stage=renderer.cv,parent=stage.parentElement;
 if(!parent)return null;

 const originalOpacity=stage.style.opacity;
 if(getComputedStyle(parent).position==='static'){
  parent.style.position='relative';
 }

 const controls=document.createElement('div');
 controls.className='world3d-controls';

 const button=document.createElement('button');
 button.type='button';
 button.textContent='3D testen';
 button.setAttribute('aria-pressed','false');

 const status=document.createElement('span');
 status.setAttribute('role','status');
 status.textContent='2D';

 controls.append(button,status);
 parent.append(controls);

 if(!document.getElementById('world3d-style')){
  const style=document.createElement('style');
  style.id='world3d-style';
  style.textContent=`
.world3d-controls{
 position:absolute;right:10px;top:10px;z-index:8;
 display:flex;gap:8px;align-items:center;padding:6px;
 background:#08111de8;border:1px solid #a28b5b;
 border-radius:8px;font:11px system-ui;color:#e7dab6
}
.world3d-controls button{
 min-height:38px;padding:7px 12px;background:#d6bd85;
 color:#171b1c;border:0;border-radius:5px;
 font:600 11px system-ui;cursor:pointer
}
.world3d-controls button:focus-visible{
 outline:3px solid white;outline-offset:3px
}
.world3d-canvas{
 position:absolute;pointer-events:none!important;
 z-index:2;display:none;border-radius:inherit
}`;
  document.head.append(style);
 }

 let enabled=false,loading=false,engine=null,overlay=null,ready=false;

 const api={
  active:false,
  render(){
   if(!enabled||!ready||!supportsWorld(state.world)){
    show(false);
    if(enabled&&ready&&status.textContent!=='2D · diese Umgebung folgt in Phase 4'){
     status.textContent='2D · diese Umgebung folgt in Phase 4';
    }
    return false;
   }

   try{
    if(!resize()){
     show(false);
     return false;
    }
    engine.render(
     state.world,state.player,renderer._visualTime||0
    );
    show(true);
    if(status.textContent!=='3D · Phase 1'){
     status.textContent='3D · Phase 1';
    }
    return true;
   }catch(error){
    console.error('3D-Darstellung:',error);
    enabled=false;
    show(false);
    status.textContent='3D-Fehler · 2D bleibt aktiv';
    button.textContent='3D erneut testen';
    button.setAttribute('aria-pressed','false');
    return false;
   }
  },
  screenToTile(x,y){
   return engine?.pick(x,y)||{x:-1,y:-1};
  }
 };

 function show(active){
  api.active=active;
  const opacity=active?'0':originalOpacity;
  if(stage.style.opacity!==opacity)stage.style.opacity=opacity;
  if(overlay){
   const display=active?'block':'none';
   if(overlay.style.display!==display){
    overlay.style.display=display;
   }
  }
 }

 function resize(){
  const rect=stage.getBoundingClientRect();
  const base=parent.getBoundingClientRect();
  if(rect.width<1||rect.height<1)return false;

  overlay.style.left=(
   rect.left-base.left-parent.clientLeft+parent.scrollLeft
  )+'px';
  overlay.style.top=(
   rect.top-base.top-parent.clientTop+parent.scrollTop
  )+'px';
  overlay.style.width=rect.width+'px';
  overlay.style.height=rect.height+'px';
  engine.resize(rect.width,rect.height);
  return true;
 }

 async function choose(next){
  enabled=next;
  button.setAttribute('aria-pressed',String(next));
  button.textContent=next?'2D wählen':'3D testen';

  if(!next){
   show(false);
   status.textContent='2D';
   return;
  }
  if(ready||loading)return;

  loading=true;
  status.textContent='3D wird geladen …';

  try{
   const THREE=await import(
    'https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js'
   );
   const canvas=document.createElement('canvas');
   canvas.className='world3d-canvas';
   canvas.setAttribute('aria-hidden','true');

   engine=createEngine(THREE,canvas);
   overlay=canvas;
   parent.append(canvas);
   ready=true;

   canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    enabled=false;
    show(false);
    status.textContent='Grafikkontext verloren · 2D';
    button.textContent='Seite neu laden für 3D';
    button.disabled=true;
    button.setAttribute('aria-pressed','false');
   });

   status.textContent=enabled?'3D bereit':'2D';
  }catch(error){
   engine?.dispose();
   engine=null;
   ready=false;
   enabled=false;
   show(false);
   button.textContent='3D erneut testen';
   button.setAttribute('aria-pressed','false');
   status.textContent='3D nicht verfügbar · 2D';
   console.warn('3D-Start:',error);
  }finally{
   loading=false;
  }
 }

 button.addEventListener('click',()=>choose(!enabled));
 choose(wants3D(location.search));
 return api;
}

export function createEngine(T,canvas){
 const gpu=new T.WebGLRenderer({
  canvas,antialias:true,alpha:false,powerPreference:'low-power'
 });
 gpu.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
 gpu.setClearColor(0x081018,1);
 gpu.outputColorSpace=T.SRGBColorSpace;

 const scene=new T.Scene();
 scene.background=new T.Color(0x081018);
 scene.fog=new T.Fog(0x081018,18,45);

 const camera=new T.OrthographicCamera(-6,6,5,-5,.1,80);

 scene.add(new T.HemisphereLight(0xc5d4da,0x29302b,2.1));
 const sun=new T.DirectionalLight(0xffe0ae,2.2);
 sun.position.set(-5,12,5);
 scene.add(sun);

 const group=new T.Group();
 scene.add(group);

 const floorGeo=new T.BoxGeometry(.98,.12,.98);
 const wallGeo=new T.BoxGeometry(.99,1.25,.99);
 const chestGeo=new T.BoxGeometry(.65,.34,.46);
 const lidGeo=new T.BoxGeometry(.69,.13,.5);
 const stepGeo=new T.BoxGeometry(.7,.09,.17);

 const floorMats=[
  0x58616a,0x505b63,0x60666b,0x556168
 ].map(color=>new T.MeshStandardMaterial({color,roughness:1}));

 const wallMat=new T.MeshStandardMaterial({
  color:0x7a817e,roughness:.96
 });
 const fadeMat=new T.MeshStandardMaterial({
  color:0x7a817e,roughness:1,
  transparent:true,opacity:.24,depthWrite:false
 });
 const wood=new T.MeshStandardMaterial({
  color:0x91633c,roughness:.88
 });
 const trim=new T.MeshStandardMaterial({
  color:0xc4a365,roughness:.65,metalness:.25
 });
 const stone=new T.MeshStandardMaterial({
  color:0xaaa589,roughness:1
 });

 const cells=new Map(),actors=new Map(),chests=new Map();
 let tiles=null,seed=null,stairs=null,size='',closed=false;

 const ray=new T.Raycaster();
 const pointer=new T.Vector2();
 const plane=new T.Plane(new T.Vector3(0,1,0),0);
 const hit=new T.Vector3();

 function destroyActor(entry){
  group.remove(entry.node);
  entry.texture.dispose();
  entry.material.dispose();
 }

 function reset(){
  for(const entry of cells.values())group.remove(entry.node);
  for(const entry of actors.values())destroyActor(entry);
  for(const entry of chests.values())group.remove(entry.node);
  if(stairs)group.remove(stairs.node);

  cells.clear();
  actors.clear();
  chests.clear();
  stairs=null;
 }

 function synchronizeCells(w,p){
  const retained=new Set();

  for(let y=0;y<w.tiles.length;y++){
   for(let x=0;x<w.tiles[y].length;x++){
    if(!discovered(w,x,y))continue;

    const key=x+':'+y,type=w.tiles[y][x];
    retained.add(key);
    let entry=cells.get(key);

    if(entry&&entry.type!==type){
     group.remove(entry.node);
     cells.delete(key);
     entry=null;
    }

    if(!entry){
     const node=new T.Group();
     node.position.set(x+.5,0,y+.5);

     const material=floorMats[
      ((x*17+y*31+(w.seed|0))>>>0)%4
     ];
     const floor=new T.Mesh(floorGeo,material);
     floor.position.y=-.06;
     node.add(floor);

     let wall=null;
     if(type===1){
      wall=new T.Mesh(wallGeo,wallMat);
      wall.position.y=.625;
      node.add(wall);
     }

     if(type===2){
      const mark=new T.Mesh(stepGeo,trim);
      mark.position.y=.06;
      node.add(mark);
     }

     group.add(node);
     entry={node,wall,type,x,y};
     cells.set(key,entry);
    }

    if(entry.wall){
     const inFront=y>p.y&&y-p.y<6&&Math.abs(x-p.x)<1.8;
     entry.wall.material=inFront?fadeMat:wallMat;
    }
   }
  }

  for(const[key,entry]of cells){
   if(!retained.has(key)){
    group.remove(entry.node);
    cells.delete(key);
   }
  }
 }

 function actor(key,value,hero,time){
  let entry=actors.get(key);

  if(!entry){
   const textureCanvas=document.createElement('canvas');
   textureCanvas.width=textureCanvas.height=128;
   const context=textureCanvas.getContext('2d');

   const texture=new T.CanvasTexture(textureCanvas);
   texture.colorSpace=T.SRGBColorSpace;
   texture.magFilter=T.NearestFilter;
   texture.minFilter=T.LinearFilter;

   const material=new T.SpriteMaterial({
    map:texture,transparent:true,depthWrite:false
   });
   const node=new T.Sprite(material);
   node.center.set(.5,0);
   node.scale.set(1.25,1.25,1);
   group.add(node);

   entry={
    node,texture,material,context,
    last:-Infinity,signature:''
   };
   actors.set(key,entry);
  }

  const signature=JSON.stringify(hero
   ?[value.heroClass,value.equipped,value.hp>0]
   :[
     value.id,value.key,value.shape,value.color,
     value.elite,value.hp,value.maxHp
    ]
  );
  const animated=!matchMedia(
   '(prefers-reduced-motion: reduce)'
  ).matches;

  if(signature!==entry.signature||
   (animated&&!hero&&time-entry.last>.18)){
   const c=entry.context;
   c.setTransform(1,0,0,1,0,0);
   c.clearRect(0,0,128,128);
   c.imageSmoothingEnabled=false;
   c.save();
   try{
    c.scale(4,4);
    if(hero)drawCharacter(c,value,0,0,32);
    else drawMonster(c,value,0,0,time,true);
   }finally{
    c.restore();
   }

   entry.texture.needsUpdate=true;
   entry.signature=signature;
   entry.last=time;
  }

  entry.node.position.set(value.x+.5,.035,value.y+.5);
 }

 function synchronizeObjects(w,p,time){
  const live=new Set();

  if(discovered(w,p.x,p.y)){
   actor('hero',p,true,time);
   live.add('hero');
  }

  for(const monster of w.monsters||[]){
   if(discovered(w,monster.x,monster.y)){
    actor(monster,monster,false,time);
    live.add(monster);
   }
  }

  for(const[key,entry]of actors){
   if(!live.has(key)){
    destroyActor(entry);
    actors.delete(key);
   }
  }

  const keep=new Set();

  for(const chest of w.chests||[]){
   if(!discovered(w,chest.x,chest.y))continue;
   keep.add(chest);
   let entry=chests.get(chest);

   if(!entry){
    const node=new T.Group();
    node.position.set(chest.x+.5,0,chest.y+.5);

    const body=new T.Mesh(chestGeo,wood);
    body.position.y=.18;
    node.add(body);

    const hinge=new T.Group();
    hinge.position.set(0,.35,-.23);
    const lid=new T.Mesh(lidGeo,trim);
    lid.position.set(0,.02,.23);
    hinge.add(lid);
    node.add(hinge);

    group.add(node);
    entry={node,hinge};
    chests.set(chest,entry);
   }

   entry.hinge.rotation.x=chest.open?-1.1:0;
  }

  for(const[key,entry]of chests){
   if(!keep.has(key)){
    group.remove(entry.node);
    chests.delete(key);
   }
  }

  const s=w.stairs;
  const stairKey=s&&discovered(w,s.x,s.y)
   ?s.x+':'+s.y:null;

  if((stairs?.key||null)!==stairKey){
   if(stairs)group.remove(stairs.node);
   stairs=null;

   if(stairKey){
    const node=new T.Group();
    node.position.set(s.x+.5,0,s.y+.5);

    for(let i=0;i<5;i++){
     const step=new T.Mesh(stepGeo,stone);
     step.position.set(0,.10-i*.02,-.34+i*.17);
     node.add(step);
    }

    group.add(node);
    stairs={key:stairKey,node};
   }
  }
 }

 function resize(w,h){
  const key=Math.round(w)+':'+Math.round(h);
  if(size===key)return;
  size=key;

  gpu.setSize(w,h,false);
  const halfHeight=4.8,aspect=w/h;

  camera.left=-halfHeight*aspect;
  camera.right=halfHeight*aspect;
  camera.top=halfHeight;
  camera.bottom=-halfHeight;
  camera.updateProjectionMatrix();
 }

 function render(w,p,time){
  if(closed)return;

  if(tiles!==w.tiles||seed!==w.seed){
   reset();
   tiles=w.tiles;
   seed=w.seed;
  }

  synchronizeCells(w,p);
  synchronizeObjects(w,p,time);

  camera.position.set(p.x+.5,12,p.y+.5+9);
  camera.lookAt(p.x+.5,0,p.y+.5);
  camera.updateMatrixWorld();

  gpu.render(scene,camera);
 }

 function pick(clientX,clientY){
  const rect=canvas.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return {x:-1,y:-1};

  pointer.set(
   (clientX-rect.left)/rect.width*2-1,
   -((clientY-rect.top)/rect.height)*2+1
  );
  ray.setFromCamera(pointer,camera);

  if(!ray.ray.intersectPlane(plane,hit))return {x:-1,y:-1};
  return {x:Math.floor(hit.x),y:Math.floor(hit.z)};
 }

 function dispose(){
  if(closed)return;
  closed=true;
  reset();

  for(const geometry of[
   floorGeo,wallGeo,chestGeo,lidGeo,stepGeo
  ])geometry.dispose();

  for(const material of[
   ...floorMats,wallMat,fadeMat,wood,trim,stone
  ])material.dispose();

  gpu.dispose();
 }

 return {resize,render,pick,dispose};
}
