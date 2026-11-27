import {createFigureFactory} from './world-actors3d.js';
import {createDungeonSurfaces,createDungeonAtmosphere,theme3D,supportsTheme3D,tileVisible} from './world3d-atmosphere.js';
import {wallDecorSites,createWallDecorTextures,createGlowTexture,createVignetteTexture} from './world3d-decor.js';
import {drawCharacter} from './character.js';
import {drawMonster} from './monster.js';
import {stageCenter,stagePositions,cameraTarget,approach,visibleInMode,stageEffectView,stageCells,worldBounds,STAGE} from './world3d-stage.js';

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
 return !!w?.tiles?.length&&supportsTheme3D(w.theme);
}

// Welt3D: kapselt Three.js, Kamera und Bühne. Stellt eine kleine API bereit,
// über die das Spiel die Ansicht ein- und ausschaltet. Die eigentliche
// Bedienung (Schalter, Speicherung der Vorliebe) liegt in systems/world3d-mode.js.
export function installWorld3D(renderer,state){
 const stage=renderer.cv,parent=stage.parentElement;
 if(!parent)return null;

 const originalOpacity=stage.style.opacity;

 // Platzhalter für die Leinwand: sie wird von der Spielführung zwischen
 // Karte und Kampfbildschirm umgehängt. Ohne Ziel bleibt sie im Kartenbereich.
 const home=document.createElement('div');
 home.className='world3d-home';
 parent.append(home);

 if(!document.getElementById('world3d-style')){
  const style=document.createElement('style');
  style.id='world3d-style';
  style.textContent=`
.world3d-home{
position:absolute;inset:0;pointer-events:none;z-index:2
}
.world3d-home canvas,
#combat-stage canvas{
position:absolute;inset:0;width:100%!important;height:100%!important;
pointer-events:none!important;display:block;border-radius:inherit
}
#combat-stage{
position:relative;width:100%;max-width:720px;margin:0 auto;
aspect-ratio:16/10;max-height:34dvh;min-height:120px;flex:0 1 auto;
overflow:hidden;background:#081018;
border:1px solid #693040;border-radius:12px
}
/* Ohne 3D bleibt der Kampfbildschirm unverändert: kein leerer Rahmen. */
#combat-stage:empty{display:none}
body:not(.world3d-combat) #combat-stage{display:none}
.world3d-on #stage{opacity:0!important}
.world3d-on #hint{display:none}

/* Im 3D-Kampf muss die Bühne neben Bedienung und Text Platz haben.
   Die 2D-Ansicht behält ihr bisheriges Layout vollständig. */
.world3d-combat{gap:10px;padding:12px}
.world3d-combat h2{font-size:15px}
.world3d-combat #combat-info{padding:8px;font-size:12px}
.world3d-combat #combat-log{min-height:44px;padding:8px;font-size:12px}
.world3d-combat .combat-buttons button{min-height:46px;font-size:14px}
.world3d-combat #ability-bar .ability-btn{padding:6px;font-size:12px}

@media(max-height:620px){
 #combat-stage{max-height:28dvh}
 .world3d-combat{gap:8px;padding:10px}
 .world3d-combat #combat-log{min-height:36px;font-size:11px}
 .world3d-combat .combat-buttons button{min-height:42px}
}`;
  document.head.append(style);
 }

 const listeners=new Set();
 const state3d={
  active:false,error:false,canvas:null
 };

 let enabled=false,loading=false,engine=null,canvas=null,ready=false;
 let lastHost=null;

 function notify(){
  for(const fn of listeners){
   try{fn(state3d);}catch(error){console.error('3D-Zustand:',error);}
  }
 }

 // Zielbereich im DOM: im Kampf der Rahmen im Kampfbildschirm, sonst die Karte.
 // Das Spiel (world3d-mode.js) entscheidet, welches Ziel gilt; hier wird nur
 // umgehängt, wenn sich das Ziel tatsächlich ändert.
 function place(target){
  if(!canvas)return;
  const next=target||home;
  if(canvas.parentElement===next)return;
  next.append(canvas);
  lastHost=next;

  // Neue Größe nach dem Umhängen (Layout ist erst im nächsten Frame fertig).
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>resize());
 }

 const api={
  get active(){return state3d.active;},
  get canvas(){return canvas;},
  get error(){return state3d.error;},
  get ready(){return ready;},
  subscribe(fn){
   listeners.add(fn);
   return ()=>listeners.delete(fn);
  },
  setEnabled(next){
   choose(!!next);
  },
  setHost(target){
   place(target);
  },
  // Die Leinwand wurde umgehängt: Größe neu messen, Puffer ggf. anpassen.
  canvasMoved(){
   if(!canvas)return;
   delete canvas.dataset.size;
   resize();
  },
  render(){
   if(!enabled||!ready||!supportsWorld(state.world)){
    show(false);
    return false;
   }

   try{
    if(!resize()){
     // Kein Platz zum Zeichnen (etwa noch nicht sichtbarer Bildschirm).
     // Den Zustand NICHT abschalten – sonst springt die Ansicht bei einem
     // einzigen 0-Größe-Frame dauerhaft auf 2D. Der nächste Frame misst neu.
     return true;
    }
    const fighting=state.inCombat===true
     &&!!state.activeMonster
     &&state.activeMonster.hp>0;

    engine.render(
     state.world,state.player,renderer._visualTime||0,renderer,
     fighting?'combat':'explore',
     fighting?state.activeMonster:null
    );
    show(true);
    return true;
   }catch(error){
    console.error('3D-Darstellung:',error);
    enabled=false;
    state3d.error=true;
    show(false);
    notify();
    return false;
   }
  },
  screenToTile(x,y){
   return engine?.pick(x,y)||{x:-1,y:-1};
  }
 };

 function show(active){
  if(state3d.active===active)return;

  // Nur state3d setzen. `api.active` ist ein reiner Getter (siehe unten) und
  // leitet daraus ab. Früher wurde hier zusätzlich `api.active=active`
  // geschrieben – das wirft im Strict Mode von ES-Modulen einen TypeError.
  // Der Fehler passierte in render() vor dem Zeichnen: Der Bildschirm blieb
  // auf dem Handy schwarz, ohne dass die 2D-Karte erschien.
  state3d.active=active;

  const opacity=active?'0':originalOpacity;
  if(stage.style.opacity!==opacity)stage.style.opacity=opacity;

  document.body?.classList.toggle('world3d-on',active);
 }

 function resize(){
  if(!canvas)return false;
  const host=canvas.parentElement;
  if(!host)return false;

  const rect=host.getBoundingClientRect();
  if(rect.width<1||rect.height<1)return false;

  const key=Math.round(rect.width)+':'+Math.round(rect.height);
  if(canvas.dataset.size===key)return true;
  canvas.dataset.size=key;

  canvas.style.width='100%';
  canvas.style.height='100%';
  engine.resize(rect.width,rect.height);
  return true;
 }

 async function choose(next){
  enabled=next;

  if(!next){
   show(false);
   notify();
   return;
  }
  if(ready||loading){
   show(true);
   notify();
   return;
  }

  loading=true;

  try{
   // Zeitgrenze: Ein haengendes CDN (Mobilfunk, Captive Portal) darf den
   // Spielstart nicht blockieren. Nach 12 s bleibt es bei 2D.
   const THREE=await Promise.race([
    import('https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js'),
    new Promise((_,reject)=>setTimeout(
     ()=>reject(new Error('3D-Bibliothek: Zeitgrenze überschritten')),12000
    ))
   ]);
   const node=document.createElement('canvas');
   node.className='world3d-canvas';
   node.setAttribute('aria-hidden','true');

   engine=createEngine(THREE,node);engine.setQuality('auto');
   canvas=node;state3d.canvas=node;
   place(null);
   ready=true;

   node.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    enabled=false;
    show(false);
    state3d.error=true;
    notify();
   });

   show(true);
  }catch(error){
   engine?.dispose();
   engine=null;
   ready=false;
   enabled=false;
   canvas=null;
   show(false);
   state3d.error=true;
   console.warn('3D-Start:',error);
  }finally{
   loading=false;
   notify();
  }
 }

 // Vergleichbar mit wants3D, aber ohne eigene UI: die Vorliebe verwaltet das Spiel.
 choose(wants3D(location.search));
 return api;
}

export function createEngine(T,canvas){
 const gpu=new T.WebGLRenderer({
  canvas,antialias:true,alpha:false,powerPreference:'low-power'
 });
 gpu.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
 gpu.setClearColor(0x081018,1);
 gpu.outputColorSpace=T.SRGBColorSpace;gpu.toneMapping=T.ACESFilmicToneMapping;

 const scene=new T.Scene();
 scene.background=new T.Color(0x081018);
 scene.fog=new T.Fog(0x081018,18,45);

 const camera=new T.OrthographicCamera(-6,6,5,-5,.1,80);

 const ambient=new T.HemisphereLight(0xc5d4da,0x29302b,.8);
 scene.add(ambient);
 const sun=new T.DirectionalLight(0xffe0ae,1.8);
 sun.position.set(-5,12,5);
 scene.add(sun);
 const atmosphere=createDungeonAtmosphere(T,scene,gpu,sun);

 const group=new T.Group();
 scene.add(group);
 const figures=createFigureFactory(T);

 const floorGeo=new T.BoxGeometry(.98,.12,.98);
 const wallGeo=new T.BoxGeometry(.99,1.25,.99);
 const chestGeo=new T.BoxGeometry(.65,.34,.46);
 const lidGeo=new T.BoxGeometry(.69,.13,.5);
 const stepGeo=new T.BoxGeometry(.7,.09,.17);

 const surfaces=createDungeonSurfaces(T);
 const {floorMats,wallMat,fadeMat,wood,trim,stone,pit}=surfaces;
 const strapGeo=new T.BoxGeometry(.055,.36,.48);
 const lidStrapGeo=new T.BoxGeometry(.055,.15,.51);
 const lockGeo=new T.BoxGeometry(.12,.14,.05);
 const railGeo=new T.BoxGeometry(.12,.18,1.05);

 // Wanddekoration (Banner/Schilder), Tor-Licht und Vignette. Die 2D-Karte
 // zeigt all das; die 3D-Ansicht holt es hier nach.
 const decorGeo=new T.PlaneGeometry(.62,.9);
 const glowTexture=createGlowTexture(T);
 const vignetteTexture=createVignetteTexture(T);
 const decorTextures=new Map();

 const decorMats=[
  new T.MeshBasicMaterial({
   map:null,transparent:true,depthWrite:false,
   side:T.DoubleSide
  }),
  new T.MeshBasicMaterial({
   map:null,transparent:true,depthWrite:false,
   side:T.DoubleSide
  })
 ];
 const gateMat=new T.SpriteMaterial({
  map:glowTexture,transparent:true,depthWrite:false,
  opacity:.55
 });
 const vignetteMat=new T.SpriteMaterial({
  map:vignetteTexture,transparent:true,depthWrite:false,
  opacity:.5
 });
 const vignette=new T.Sprite(vignetteMat);
 vignette.renderOrder=20;
 scene.add(vignette);

 const decor=new Map(),gates=new Map();
 let decorTheme='',decorStamps=null;

 const cells=new Map(),actors=new Map(),chests=new Map();
 let tiles=null,seed=null,stairs=null,size='',closed=false,themeKey='';
 let cameraX=null,cameraZ=null;

 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const ray=new T.Raycaster();
 const pointer=new T.Vector2();
 const plane=new T.Plane(new T.Vector3(0,1,0),0);
 const hit=new T.Vector3();

 function destroyActor(entry){
  if(entry.figure){group.remove(entry.node);entry.figure.dispose();return;}
  group.remove(entry.node);
  entry.texture.dispose();
  entry.material.dispose();
 }

 function reset(){
  for(const entry of cells.values())group.remove(entry.node);
  for(const entry of actors.values())destroyActor(entry);
  for(const entry of chests.values())group.remove(entry.node);
  for(const entry of decor.values())group.remove(entry.node);
  for(const entry of gates.values())group.remove(entry.node);
  if(stairs)group.remove(stairs.node);

  cells.clear();
  actors.clear();
  chests.clear();
  decor.clear();
  gates.clear();
  stairs=null;

  // Neuer Grundriss: die Kamera springt, statt quer ueber die Karte zu fliegen.
  cameraX=null;
  cameraZ=null;
  if(camera){
   camera.zoom=1;
   camera.updateProjectionMatrix();
  }
 }

 function synchronizeCells(w,p,extra=null){
  const retained=new Set();

  for(let y=0;y<w.tiles.length;y++){
   for(let x=0;x<w.tiles[y].length;x++){
    const onStage=extra?.has(x+':'+y);
    if(!discovered(w,x,y)&&!onStage)continue;

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
     floor.position.y=-.06;floor.receiveShadow=true;
     node.add(floor);

     let wall=null;
     if(type===1){
      wall=new T.Mesh(wallGeo,wallMat);
      wall.position.y=.625;wall.castShadow=true;wall.receiveShadow=true;
      node.add(wall);
     }

     if(type===2){
      const mark=new T.Mesh(stepGeo,trim);
      mark.position.y=.06;
      node.add(mark);
     }

     group.add(node);
     entry={node,wall,floor,type,x,y};
     cells.set(key,entry);
    }

    entry.floor.visible=!(w.stairs&&w.stairs.x===x&&w.stairs.y===y);
    if(entry.wall){
     const inFront=y>p.y&&y-p.y<6&&Math.abs(x-p.x)<1.8;
     entry.wall.material=inFront?fadeMat:wallMat;entry.wall.castShadow=!inFront;
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

 // Wanddekoration und Tor-Licht der 2D-Karte nachbilden. Standorte werden
 // nur bei Grundrisswechsel berechnet; pro Frame wird nur der Umkreis um
 // die Kamera synchronisiert, wie bei den Zellen selbst.
 let decorPlan=null;

 function synchronizeDecor(w,p,center,stageTiles){
  if(!decorPlan){
   decorPlan=wallDecorSites(w.tiles,w.seed);
  }

  const keep=new Set();
  const cx=center?center.x:p.x,cz=center?center.z:p.y;

  for(const item of decorPlan){
   const key=item.x+':'+item.y;
   // Nur Standorte in der Naehe der Kamera/Buehne synchronisieren.
   if(Math.abs(item.x+.5-cx)+Math.abs(item.y+.5-cz)>14)continue;

   // Nordwand mit freiem Boden suedlich, alle drei Kacheln sichtbar.
   const visible=[-1,0,1].every(dx=>
    tileVisible(w,item.x+dx,item.y,stageTiles)&&
    tileVisible(w,item.x+dx,item.y+1,stageTiles)
   );
   if(!visible)continue;

   keep.add(key);
   let entry=decor.get(key);
   if(!entry){
    const node=new T.Group();
    node.position.set(item.x+.5,0,item.y+.5);
    const plane=new T.Mesh(
     decorGeo,
     decorMats[item.kind]
    );
    plane.position.set(0,.6,.51);
    node.add(plane);
    group.add(node);
    entry={node,plane,kind:item.kind};
    decor.set(key,entry);
   }
  }

  for(const[key,entry]of decor){
   if(!keep.has(key)){
    group.remove(entry.node);
    decor.delete(key);
   }
  }
 }

 // Tor-Kacheln (Tile 2) leuchten wie in der 2D-Karte.
 function synchronizeGates(w,p,center,stageTiles){
  const keep=new Set();
  const cx=center?center.x:p.x,cz=center?center.z:p.y;

  for(let y=0;y<w.tiles.length;y++){
   const row=w.tiles[y];
   if(!row)continue;
   for(let x=0;x<row.length;x++){
    if(row[x]!==2)continue;
    if(Math.abs(x+.5-cx)+Math.abs(y+.5-cz)>14)continue;
    if(!tileVisible(w,x,y,stageTiles))continue;

    const key=x+':'+y;
    keep.add(key);
    let entry=gates.get(key);
    if(!entry){
     const node=new T.Sprite(gateMat);
     node.position.set(x+.5,.55,y+.5);
     node.scale.set(1.15,1.15,1);
     group.add(node);
     entry={node};
     gates.set(key,entry);
    }
   }
  }

  for(const[key,entry]of gates){
   if(!keep.has(key)){
    group.remove(entry.node);
    gates.delete(key);
   }
  }
 }

 // Setzt eine Figur auf ihren Buehnenplatz. Der eigene Zustand in der
 // Actor-Huelle verhindert, dass sich die Figur-Interpolation und die
 // Buehnenposition gegenseitig ueberschreiben.
 function stagePlace(entry,spot){
  if(!spot){
   entry.stageX=entry.stageZ=null;
   return false;
  }
  const still=reduced.matches;
  if(entry.stageX===null||entry.stageX===undefined){
   entry.stageX=spot.x;
   entry.stageZ=spot.z;
  }else if(still){
   entry.stageX=spot.x;
   entry.stageZ=spot.z;
  }else{
   entry.stageX=approach(entry.stageX,spot.x);
   entry.stageZ=approach(entry.stageZ,spot.z);
  }
  entry.node.position.set(
   entry.stageX,entry.node.position.y,entry.stageZ
  );
  return true;
 }

 function actor(key,value,hero,time,spot=null){
  if(figures.supports(value,hero)){
   const signature=figures.signature(value,hero);
   let entry=actors.get(key);

   if(entry&&(!entry.figure||entry.signature!==signature)){
    destroyActor(entry);
    actors.delete(key);
    entry=null;
   }

   if(!entry){
    const figure=figures.create(value,hero);
    group.add(figure.node);
    entry={node:figure.node,figure,signature};
    actors.set(key,entry);
   }

   entry.figure.update(value,time);
   stagePlace(entry,spot);
   return;
  }

  const previous=actors.get(key);
  if(previous?.figure){
   destroyActor(previous);
   actors.delete(key);
  }
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

  if(stagePlace(entry,spot))return;
  entry.node.position.set(value.x+.5,.035,value.y+.5);
 }

 function synchronizeObjects(w,p,time,fighting=false,enemy=null){
  const live=new Set();

  const center=fighting?stageCenter(p,enemy):null;
  const spots=fighting&&center.valid
   ?stagePositions(center,worldBounds(w))
   :null;

  if(fighting||discovered(w,p.x,p.y)){
   actor('hero',p,true,time,spots?spots.hero:null);
   live.add('hero');
  }

  if(fighting&&enemy){
   // Der aktive Gegner steht auf der Buehne, auch ohne Aufdeckung.
   actor(enemy,enemy,false,time,spots?spots.enemy:null);
   live.add(enemy);
  }

  for(const monster of w.monsters||[]){
   if(fighting&&monster===enemy)continue;
   if(visibleInMode({
    mode:fighting?'combat':'explore',
    discovered:discovered(w,monster.x,monster.y),
    isEnemy:false
   })){
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
    body.castShadow=true;
    body.receiveShadow=true;
    node.add(body);
    for(const x of [-.23,.23]){
     const band=new T.Mesh(strapGeo,trim);
     band.position.set(x,.18,0);
     band.castShadow=true;
     node.add(band);
    }
    const lock=new T.Mesh(lockGeo,trim);
    lock.position.set(0,.25,.25);
    node.add(lock);

    const hinge=new T.Group();
    hinge.position.set(0,.35,-.23);
    const lid=new T.Mesh(lidGeo,wood);
    lid.castShadow=true;
    lid.receiveShadow=true;
    for(const x of [-.23,.23]){
     const band=new T.Mesh(lidStrapGeo,trim);
     band.position.set(x,0,0);
     lid.add(band);
    }
    lid.position.set(0,.02,.23);
    hinge.add(lid);
    node.add(hinge);

    group.add(node);
    entry={node,hinge,amount:chest.open?1.1:0,lastTime:time};
    chests.set(chest,entry);
   }

   const target=chest.open?1.1:0;
   const dt=Math.min(.1,Math.max(0,time-entry.lastTime));
   entry.lastTime=time;
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){
    entry.amount=target;
   }else{
    entry.amount+=(target-entry.amount)*Math.min(1,dt*9);
   }
   entry.hinge.rotation.x=-entry.amount;
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
    const bottom=new T.Mesh(floorGeo,pit);
    bottom.position.y=-.47;
    bottom.receiveShadow=true;
    node.add(bottom);
    for(const x of [-.45,.45]){
     const rail=new T.Mesh(railGeo,stone);
     rail.position.set(x,-.015,0);
     rail.castShadow=true;
     rail.receiveShadow=true;
     node.add(rail);
    }

    for(let i=0;i<5;i++){
     const step=new T.Mesh(stepGeo,stone);
     step.position.set(0,-.04-i*.075,-.34+i*.17);step.receiveShadow=true;
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

 function render(w,p,time,effects,mode='explore',enemy=null){
  if(closed)return;

  // Kampf nur mit lebendem Gegner: nach Flucht/Tod bleibt die Erkundung.
  const fighting=mode==='combat'&&!!enemy&&enemy.hp>0;

  if(tiles!==w.tiles||seed!==w.seed){
   reset();
   tiles=w.tiles;
   seed=w.seed;
   decorPlan=null;
  }

  const palette=surfaces.setTheme(w.theme);

  if(themeKey!==palette.key){
   themeKey=palette.key;
   scene.background.set(palette.background);
   scene.fog.color?.set(palette.background);
   ambient.color?.set(palette.sky);
   ambient.groundColor?.set(palette.floors[0]);
   sun.color?.set(palette.sun);

   // Wandbehang/Schilder wechseln mit dem Thema.
   if(decorTheme!==themeKey){
    decorTheme=themeKey;
    if(decorStamps){
     decorStamps.forEach(t=>t.dispose());
    }
    decorStamps=createWallDecorTextures(T,palette.key);
    decorMats[0].map=decorStamps[0];
    decorMats[1].map=decorStamps[1];
   }

   // Tor-Licht bekommt die Lichtfarbe des Themas.
   gateMat.color?.set(palette.light);
  }

  // Buehne einmal bestimmen und an Zellen, Figuren und Effekte geben.
  const center=fighting?stageCenter(p,enemy):null;
  const spots=center&&center.valid
   ?stagePositions(center,worldBounds(w))
   :null;

  // Trefferzahlen und Funken entstehen in Kachelkoordinaten. Auf der Buehne
  // werden sie auf die Figuren umgerechnet; die Listen des Renderers bleiben
  // unangetastet (nur flache Kopien).
  const stageTiles=spots
   ?new Set(stageCells(w,p,enemy,spots).map(c=>c.x+':'+c.y))
   :null;

  synchronizeCells(w,p,stageTiles);
  synchronizeObjects(w,p,time,fighting,enemy);
  synchronizeDecor(w,p,center,stageTiles);
  synchronizeGates(w,p,center,stageTiles);

  atmosphere.update(
   w,p,time,
   {
    ...stageEffectView(effects,{hero:p,enemy,spots}),
    stageFocus:spots?{x:center.x,z:center.z}:null,
    // Buehnenfelder gelten auch fuer Effekte als sichtbar.
    stageTiles
   }
  );

  const target=cameraTarget({
   mode:fighting?'combat':'explore',hero:p,enemy
  });

  if(fighting&&!target.centered){
   // Ohne Gegner keine Bühne: Kamera bleibt bei der Erkundung.
   target.x=p.x+.5;target.z=p.y+.5;target.zoom=STAGE.zoomOut;
  }

  // Übergang nur bei echter Bewegung, damit ein ruhender Kampf nicht
  // jeden Frame neu berechnet.
  const still=reduced.matches;
  if(still){
   cameraX=target.x;cameraZ=target.z;
  }else{
   cameraX=approach(cameraX,target.x);
   cameraZ=approach(cameraZ,target.z);
  }

  camera.position.set(cameraX,target.height,cameraZ+target.depth);
  camera.lookAt(cameraX,0,cameraZ);
  camera.updateMatrixWorld();

  if(Math.abs(camera.zoom-target.zoom)>.001){
   camera.zoom=still?target.zoom:approach(camera.zoom,target.zoom);
   camera.updateProjectionMatrix();
  }

  // Vignette folgt der Kamera und deckt das ganze Sichtfeld ab (wie 2D).
  const halfH=4.8/camera.zoom,aspect=size?parseFloat(size.split(':')[0])/parseFloat(size.split(':')[1]):1.6;
  vignette.position.set(cameraX,target.height,cameraZ+target.depth);
  vignette.scale.set(halfH*2*aspect*1.1,halfH*2*1.1,1);

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
   floorGeo,wallGeo,chestGeo,lidGeo,stepGeo,strapGeo,lidStrapGeo,lockGeo,railGeo,
   decorGeo
  ])geometry.dispose();

  for(const m of decorMats)m.dispose();
  gateMat.dispose();
  vignetteMat.dispose();
  scene.remove(vignette);
  glowTexture.dispose();
  vignetteTexture.dispose();
  decorStamps?.forEach(t=>t.dispose());

  atmosphere.dispose();surfaces.dispose();

  figures.dispose();
  gpu.dispose();
 }

 return {resize,render,pick,dispose,setQuality:atmosphere.setQuality};
}
