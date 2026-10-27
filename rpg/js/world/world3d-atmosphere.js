export function visualNoise(x,y,seed=0){
 let n=(Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^(seed|0))>>>0;
 n=Math.imul(n^(n>>>13),1274126177)>>>0;
 return(n^(n>>>16))>>>0;
}

export function qualityProfile(mode,coarse=false){
 const low=mode==='mobile'||mode!=='detail'&&coarse;
 return {
  name:low?'mobile':'detail',
  pixelRatio:low?1:1.5,
  shadows:!low,
  shadowSize:1024,
  lights:low?2:4,
  particles:low?20:56,
  dust:low?5:12
 };
}

function known(w,x,y){
 return Number.isInteger(x)&&Number.isInteger(y)
  &&!!w.discovered?.[y]?.[x]&&w.tiles?.[y]?.[x]!==undefined;
}

export function torchSites(w,p,limit){
 const candidates=[];

 for(let y=0;y<w.tiles.length-1;y++){
  for(let x=0;x<w.tiles[y].length;x++){
   if(w.tiles[y][x]!==1||!known(w,x,y)
    ||!known(w,x,y+1)||w.tiles[y+1][x]!==0)continue;

   const distance=(x-p.x)**2+(y+1-p.y)**2;
   if(distance>49||visualNoise(x,y,w.seed)%3!==0)continue;

   candidates.push({x:x+.5,z:y+1.015,distance});
  }
 }

 candidates.sort(
  (a,b)=>a.distance-b.distance||a.z-b.z||a.x-b.x
 );
 return candidates.slice(0,limit);
}

export function createDungeonSurfaces(T){
 const textures=[],materials=[];

 const texture=(kind,height=false)=>{
  const cv=document.createElement('canvas');
  cv.width=cv.height=256;
  const c=cv.getContext('2d');

  c.fillStyle=height?'#303030'
   :kind==='wood'?'#3b261a':'#30383c';
  c.fillRect(0,0,256,256);

  if(kind==='wood'){
   for(let x=0;x<256;x+=32){
    const n=visualNoise(x,4,19);
    const v=height?110+n%35:0;

    c.fillStyle=height
     ?`rgb(${v},${v},${v})`
     :`rgb(${102+n%27},${64+n%17},${35+n%11})`;
    c.fillRect(x+2,0,29,256);

    for(let j=0;j<11;j++){
     const k=visualNoise(x,j,71);
     c.strokeStyle=height?'#99999966':'#25170f66';
     c.lineWidth=1;
     c.beginPath();
     c.moveTo(x+3+k%24,0);
     c.lineTo(x+3+(k>>>5)%24,256);
     c.stroke();
    }
   }
  }else{
   const rows=kind==='wall'?4:2;
   const step=256/rows;

   for(let row=0;row<rows;row++){
    for(let col=-1;col<=2;col++){
     const n=visualNoise(
      col,row,kind==='wall'?33:15
     );
     const x=col*128+
      (kind==='wall'&&row%2?64:0);
     const y=row*step;
     const v=height?145+n%35:0;

     c.fillStyle=height
      ?`rgb(${v},${v},${v})`
      :`rgb(${98+n%29},${104+n%27},${107+n%24})`;

     c.fillRect(x+3,y+3,122,step-6);
     c.fillStyle=height?'#c8c8c8':'#d5d9c542';
     c.fillRect(x+4,y+4,120,2);
     c.fillStyle=height?'#6d6d6d':'#11191d77';
     c.fillRect(x+4,y+step-5,120,2);

     if(n%3===0){
      c.strokeStyle=height?'#555555':'#161e2466';
      c.lineWidth=1;
      c.beginPath();
      c.moveTo(x+35,y+6);
      c.lineTo(x+49,y+step*.45);
      c.lineTo(x+43,y+step-7);
      c.stroke();
     }
    }
   }
  }

  for(let i=0;i<550;i++){
   const n=visualNoise(i,9,17);
   c.fillStyle=height
    ?(i%2?'#ffffff12':'#00000015')
    :(i%2?'#ffffff0c':'#00000015');
   c.fillRect(
    n%256,(n>>>8)%256,1+(n>>>17)%3,1
   );
  }

  const t=new T.CanvasTexture(cv);
  t.colorSpace=height?T.NoColorSpace:T.SRGBColorSpace;
  t.anisotropy=2;
  textures.push(t);
  return t;
 };

 const floor=texture('floor');
 const floorBump=texture('floor',true);
 const wall=texture('wall');
 const wallBump=texture('wall',true);
 const woodMap=texture('wood');
 const woodBump=texture('wood',true);

 const material=options=>{
  const m=new T.MeshStandardMaterial(options);
  materials.push(m);
  return m;
 };

 const floorMats=[
  0xb6bdba,0xa5b0ae,0xb7b9ad,0xaeb6b8
 ].map(color=>material({
  color,map:floor,bumpMap:floorBump,
  bumpScale:.035,roughness:.96
 }));

 const wallMat=material({
  color:0xc1c4b8,map:wall,bumpMap:wallBump,
  bumpScale:.055,roughness:.95
 });

 const fadeMat=material({
  color:0xc1c4b8,map:wall,bumpMap:wallBump,
  bumpScale:.055,roughness:.95,
  transparent:true,opacity:.24,depthWrite:false
 });

 const wood=material({
  color:0xd0af89,map:woodMap,bumpMap:woodBump,
  bumpScale:.025,roughness:.84
 });

 const trim=material({
  color:0xb59962,roughness:.42,metalness:.65
 });

 const stone=material({
  color:0xa0a69e,map:floor,bumpMap:floorBump,
  bumpScale:.025,roughness:1
 });

 const pit=material({
  color:0x090d12,roughness:1
 });

 let closed=false;

 return {
  floorMats,wallMat,fadeMat,wood,trim,stone,pit,
  dispose(){
   if(closed)return;
   closed=true;
   materials.forEach(m=>m.dispose());
   textures.forEach(t=>t.dispose());
  }
 };
}

export function createDungeonAtmosphere(T,scene,gpu,sun){
 const reduced=matchMedia(
  '(prefers-reduced-motion: reduce)'
 );
 const coarse=matchMedia('(pointer: coarse)');

 let mode='auto',profile=null,closed=false;
 const geos=[],mats=[],textures=[];

 const geometry=g=>{
  geos.push(g);
  return g;
 };

 const basic=options=>{
  const m=new T.MeshBasicMaterial(options);
  mats.push(m);
  return m;
 };

 const baseGeo=geometry(
  new T.BoxGeometry(.13,.1,.1)
 );
 const shaftGeo=geometry(
  new T.BoxGeometry(.06,.24,.07)
 );
 const flameGeo=geometry(
  new T.OctahedronGeometry(.065,0)
 );

 const mount=basic({color:0x594d3d});
 const shaft=basic({color:0x967443});
 const flame=basic({color:0xffd392});
 const torches=[];

 for(let i=0;i<4;i++){
  const group=new T.Group();
  const a=new T.Mesh(baseGeo,mount);
  const b=new T.Mesh(shaftGeo,shaft);
  const f=new T.Mesh(flameGeo,flame);

  b.position.y=.12;
  f.position.y=.3;
  group.add(a,b,f);
  group.visible=false;
  scene.add(group);

  const light=new T.PointLight(
   0xffb76b,1.9,5.2,2
  );
  light.visible=false;
  light.castShadow=false;
  scene.add(light);

  torches.push({group,light,flame:f});
 }

 scene.add(sun.target);
 sun.shadow.camera.left=-8;
 sun.shadow.camera.right=8;
 sun.shadow.camera.top=8;
 sun.shadow.camera.bottom=-8;
 sun.shadow.camera.near=.5;
 sun.shadow.camera.far=35;
 sun.shadow.bias=-.0004;
 sun.shadow.normalBias=.035;
 sun.shadow.camera.updateProjectionMatrix();

 const stairsLight=new T.PointLight(
  0x8ca8d4,.65,3.5,2
 );
 stairsLight.castShadow=false;
 stairsLight.visible=false;
 scene.add(stairsLight);

 const particleGeo=geometry(
  new T.BoxGeometry(1,1,1)
 );
 const dustGeo=geometry(
  new T.OctahedronGeometry(.018,0)
 );
 const ringGeo=geometry(
  new T.RingGeometry(.91,1,48)
 );

 const particles=[],rings=[],dust=[],labels=[];

 for(let i=0;i<56;i++){
  const mat=basic({
   color:0xffd08d,transparent:true,
   opacity:0,depthWrite:false
  });
  const mesh=new T.Mesh(particleGeo,mat);
  mesh.visible=false;
  scene.add(mesh);
  particles.push(mesh);
 }

 for(let i=0;i<6;i++){
  const mat=basic({
   color:0xffd08d,transparent:true,opacity:0,
   side:T.DoubleSide,depthWrite:false
  });
  const mesh=new T.Mesh(ringGeo,mat);
  mesh.rotation.x=-Math.PI/2;
  mesh.visible=false;
  scene.add(mesh);
  rings.push(mesh);
 }

 for(let i=0;i<12;i++){
  const mat=basic({
   color:0xd6c6a1,transparent:true,
   opacity:.25,depthWrite:false
  });
  const mesh=new T.Mesh(dustGeo,mat);
  mesh.visible=false;
  scene.add(mesh);
  dust.push(mesh);
 }

 for(let i=0;i<6;i++){
  const cv=document.createElement('canvas');
  cv.width=512;
  cv.height=96;
  const context=cv.getContext('2d');
  const texture=new T.CanvasTexture(cv);
  texture.colorSpace=T.SRGBColorSpace;
  textures.push(texture);

  const mat=new T.SpriteMaterial({
   map:texture,transparent:true,depthWrite:false
  });
  mats.push(mat);

  const node=new T.Sprite(mat);
  node.visible=false;
  node.scale.set(3.8,.71,1);
  scene.add(node);
  labels.push({node,context,texture,key:''});
 }

 function setQuality(next){
  mode=['auto','mobile','detail'].includes(next)
   ?next:'auto';

  const nextProfile=qualityProfile(mode,coarse.matches);
  if(profile?.name===nextProfile.name)return;

  profile=nextProfile;
  gpu.setPixelRatio(
   Math.min(devicePixelRatio||1,profile.pixelRatio)
  );
  gpu.shadowMap.enabled=profile.shadows;
  gpu.shadowMap.type=T.PCFSoftShadowMap;
  sun.castShadow=profile.shadows;
  sun.shadow.mapSize.set(
   profile.shadowSize,profile.shadowSize
  );
 }

 function update(w,p,time,effects){
  if(closed)return;
  setQuality(mode);

  const still=reduced.matches;
  const t=still?0:time;

  sun.position.set(p.x-5,12,p.y+7);
  sun.target.position.set(p.x+.5,0,p.y+.5);

  const sites=torchSites(w,p,profile.lights);

  torches.forEach((item,i)=>{
   const site=sites[i];
   item.group.visible=item.light.visible=!!site;
   if(!site)return;

   item.group.position.set(site.x,.65,site.z);
   item.light.position.set(site.x,.99,site.z+.15);

   const pulse=still?1:1+Math.sin(t*7+i)*.035;
   item.light.intensity=1.9*pulse;
   item.flame.scale.set(.85,pulse*1.3,.85);
  });

  const s=w.stairs;
  stairsLight.visible=!!(
   s&&known(w,s.x,s.y)
  );
  if(stairsLight.visible){
   stairsLight.position.set(s.x+.5,.22,s.y+.5);
  }

  particles.forEach((mesh,i)=>{
   const v=effects?.particles?.[i];
   const ok=!still&&i<profile.particles
    &&v&&v.a>0
    &&known(w,Math.floor(v.x/32),Math.floor(v.y/32));

   mesh.visible=!!ok;
   if(!ok)return;

   const scale=Math.max(.025,(v.size||3)/32);
   mesh.position.set(v.x/32,.16+(1-v.a)*.8,v.y/32);
   mesh.scale.set(scale,scale,scale);
   mesh.material.color.set(v.c||'#ffd08d');
   mesh.material.opacity=Math.min(1,v.a);
  });

  rings.forEach((mesh,i)=>{
   const v=effects?.waves?.[i];
   const ok=!still&&v&&v.a>0
    &&known(w,Math.floor(v.x/32),Math.floor(v.y/32));

   mesh.visible=!!ok;
   if(!ok)return;

   mesh.position.set(v.x/32,.035,v.y/32);
   const scale=Math.max(.01,v.r/32);
   mesh.scale.set(scale,scale,scale);
   mesh.material.color.set(v.color||'#ffd08d');
   mesh.material.opacity=Math.min(.7,v.a);
  });

  labels.forEach((item,i)=>{
   const v=effects?.texts?.[i];
   const ok=v&&v.a>0
    &&known(w,Math.floor(v.x/32),Math.floor(v.y/32));

   item.node.visible=!!ok;
   if(!ok)return;

   const key=JSON.stringify([v.txt,v.c,v.size]);
   if(key!==item.key){
    const c=item.context;
    c.clearRect(0,0,512,96);
    c.font='bold '+
     Math.min(48,Math.max(18,v.size||24))+'px Georgia';
    c.textAlign='center';
    c.textBaseline='middle';
    c.lineWidth=6;
    c.strokeStyle='#111820';
    c.strokeText(String(v.txt),256,48,490);
    c.fillStyle=v.c||'#fff0c7';
    c.fillText(String(v.txt),256,48,490);

    item.texture.needsUpdate=true;
    item.key=key;
   }

   item.node.position.set(v.x/32,1.05,v.y/32);
   item.node.material.opacity=Math.min(1,v.a);
  });

  dust.forEach((mesh,i)=>{
   const n=visualNoise(i,37,w.seed);
   const x=Math.floor(p.x)+(n%11)-5;
   const z=Math.floor(p.y)+((n>>>8)%11)-5;

   mesh.visible=!still&&i<profile.dust
    &&known(w,x,z)&&w.tiles[z][x]===0;

   if(mesh.visible){
    mesh.position.set(
     x+.2+(n%60)/100,
     .15+((t*.1+i*.21)%1)*1.3,
     z+.4
    );
    mesh.material.opacity=.1+.12*(1+Math.sin(t+i));
   }
  });

  const flash=effects?.flashEffect;
  gpu.toneMappingExposure=1+(
   still||!flash?0:
   Math.max(
    0,flash.strength*(
     1-flash.elapsed/Math.max(.001,flash.duration)
    )
   )*.55
  );
 }

 function dispose(){
  if(closed)return;
  closed=true;

  for(const item of torches){
   scene.remove(item.group);
   scene.remove(item.light);
  }

  scene.remove(stairsLight);
  scene.remove(sun.target);

  for(const node of[
   ...particles,...rings,...dust,...labels.map(x=>x.node)
  ])scene.remove(node);

  geos.forEach(g=>g.dispose());
  mats.forEach(m=>m.dispose());
  textures.forEach(t=>t.dispose());
  sun.shadow.map?.dispose();
 }

 setQuality('auto');
 return {update,setQuality,dispose};
}
