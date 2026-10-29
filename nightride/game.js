/* Nachtfahrt – Nachrichtenkette, Geldbeutel und Teileinventar. Vollständige night/game.js */
import * as THREE from 'three';
import {createCity} from './city-world.js';
import {MISSIONS,createMissionManager} from './mission.js';
const $=id=>document.getElementById(id),viewport=$('viewport'),keys=new Set();
const SAVE_KEY='nachtfahrt-profile-v1';
function loadProfile(){
  try{
    const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
    const stage=Number.isInteger(raw.stage)?Math.max(0,Math.min(MISSIONS.length,raw.stage)):0;
    const wallet=Number.isFinite(raw.wallet)?Math.max(0,Math.min(1000000,Math.floor(raw.wallet))):0;
    const completed=Array.isArray(raw.completed)?raw.completed.filter(id=>MISSIONS.some(m=>m.id===id)):[];
    const inventory={};
    for(const m of MISSIONS){
      const qty=Number(raw.inventory?.[m.part.id]);
      inventory[m.part.id]=Number.isInteger(qty)?Math.max(0,Math.min(99,qty)):0;
    }
    return {stage,wallet,completed:[...new Set(completed)],inventory,active:stage<MISSIONS.length&&raw.active===true};
  }catch{return {stage:0,wallet:0,completed:[],inventory:{},active:false}}
}
const profile=loadProfile();
function saveProfile(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(profile))}catch(e){console.warn('Speichern nicht möglich',e)}}
let renderer,scene,camera,car,body,moon,rain,raindrops=[],cityData=null,mission=null;
let world='city',playing=false,paused=false,briefOpen=false,inventoryOpen=false,letterMode='',velocity=0,heading=0;
let pos=new THREE.Vector3(),last=performance.now(),zone=false;
let lap=1,checkpoint=0,elapsed=0,previousT=0;
const circuit=new THREE.CatmullRomCurve3([
  [-188,-20],[-175,-123],[-94,-205],[35,-211],[164,-166],
  [216,-68],[194,44],[131,154],[17,212],[-106,180],[-203,93]
].map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal');
const raceSamples=[],RACE_WIDTH=24,COUNT=300;
const cameraModes=[
  {name:'Stadtblick',offset:null,look:null,fov:52},
  {name:'Verfolger nah',offset:new THREE.Vector3(0,26,33),look:new THREE.Vector3(0,2,-12),fov:52},
  {name:'Verfolger fern',offset:new THREE.Vector3(0,47,78),look:new THREE.Vector3(0,2,-12),fov:52},
  {name:'Motorhaube',offset:new THREE.Vector3(0,2.55,-2.4),look:new THREE.Vector3(0,1.5,-35),fov:70},
  {name:'Stoßstange',offset:new THREE.Vector3(0,1.25,-4.35),look:new THREE.Vector3(0,1.4,-35),fov:75}
];
let cameraMode=1;
const camPos=new THREE.Vector3(),camLook=new THREE.Vector3(),goal=new THREE.Vector3(),look=new THREE.Vector3();
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.72,...extra});
const cyan=mat(0x4ed2cd,{metalness:.55,roughness:.32});
const white=mat(0xe7efeb,{emissive:0x45564d,emissiveIntensity:.2});
const red=mat(0xff5264,{emissive:0xd22b42,emissiveIntensity:2});
function box(w,h,d,x,y,z,material){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);q.position.set(x,y,z);q.castShadow=h>1;q.receiveShadow=true;scene.add(q);return q}
function say(text){$('toast').textContent=text;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2500)}
function renderWallet(){
  $('walletHud').textContent=profile.wallet.toLocaleString('de-DE')+' €';
  $('walletDetail').textContent=profile.wallet.toLocaleString('de-DE')+' €';
  const list=$('inventoryList');list.replaceChildren();
  for(const m of MISSIONS){
    const qty=profile.inventory[m.part.id]||0;
    if(qty>0){
      const li=document.createElement('li'),name=document.createElement('span'),count=document.createElement('strong');
      name.textContent=m.part.name;count.textContent='× '+qty;li.append(name,count);list.append(li);
    }
  }
  if(!list.children.length){const li=document.createElement('li');li.textContent='Noch keine Teile gefunden.';list.append(li)}
}
function toggleInventory(force){
  if(!playing||briefOpen)return;
  inventoryOpen=typeof force==='boolean'?force:!inventoryOpen;
  keys.clear();$('inventoryPanel').classList.toggle('hidden',!inventoryOpen);renderWallet();
}
function base(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x0b1b2b);scene.fog=new THREE.FogExp2(0x102032,.0022);
  scene.add(new THREE.HemisphereLight(0x8dbed5,0x1b202a,2.1));
  moon=new THREE.DirectionalLight(0x9bb9d9,2.2);
  moon.position.set(-80,130,70);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);
  moon.shadow.camera.left=-95;moon.shadow.camera.right=95;moon.shadow.camera.top=95;moon.shadow.camera.bottom=-95;
  scene.add(moon,moon.target);
}
function carMake(){
  car=new THREE.Group();car.rotation.order='YXZ';body=new THREE.Group();car.add(body);scene.add(car);
  function part(w,h,d,x,y,z,material){const q=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);q.position.set(x,y,z);body.add(q)}
  part(3.9,1.15,7.3,0,1.15,0,cyan);part(3.3,1.2,3.65,0,2.17,.2,mat(0x183747,{metalness:.38,roughness:.26}));
  part(3.35,.09,2.5,0,2.85,.1,cyan);
  part(1,.38,.22,-1.04,1.3,-3.67,white);part(1,.38,.22,1.04,1.3,-3.67,white);
  part(.9,.29,.22,-1.07,1.3,3.67,red);part(.9,.29,.22,1.07,1.3,3.67,red);
  const tire=mat(0x0a1018,{roughness:1});
  for(const s of [-1,1])for(const z of [-2.35,2.35]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.87,.87,.52,16),tire);
    wheel.rotation.z=Math.PI/2;wheel.position.set(s*2.12,.87,z);body.add(wheel);
  }
  const left=new THREE.SpotLight(0xb5eaff,22,85,Math.PI/7,.55,1.2);
  left.position.set(-1,1.55,-3.5);left.target.position.set(-1,0,-28);car.add(left,left.target);
  const right=left.clone();right.position.x=1;right.target.position.x=1;car.add(right,right.target);
  car.position.copy(pos);car.rotation.y=-heading;
}
function makeRain(){
  rain=new THREE.BufferGeometry();rain.setAttribute('position',new THREE.BufferAttribute(new Float32Array(350*3),3));
  raindrops=Array.from({length:350},()=>({x:(Math.random()-.5)*115,y:Math.random()*65+2,z:(Math.random()-.5)*115}));
  scene.add(new THREE.Points(rain,new THREE.PointsMaterial({color:0x9cc0d4,size:.22,transparent:true,opacity:.42,depthWrite:false})));
}
function missionHud(){
  const active=playing&&world==='city'&&mission?.active;
  $('missionCompass').classList.toggle('hidden',!active);
  if(active){
    const dx=mission.current.x-pos.x,dz=mission.current.z-pos.z;
    const bearing=Math.atan2(dx,-dz),relative=Math.atan2(Math.sin(bearing-heading),Math.cos(bearing-heading));
    $('missionArrow').style.transform=`rotate(${relative*180/Math.PI}deg)`;
    $('missionDistance').textContent=`${mission.current.recipient.split(' · ')[1].toUpperCase()} · ${Math.round(Math.hypot(dx,dz))} m`;
  }
  const atGarage=playing&&world==='city'&&profile.stage===0&&!mission?.active&&!briefOpen&&
    Math.hypot(pos.x-cityData.start.x,pos.z-cityData.start.z)<18&&Math.abs(velocity)<2.5;
  const nextMessage=playing&&world==='city'&&profile.stage>0&&profile.stage<MISSIONS.length&&!profile.active&&!briefOpen;
  $('garagePrompt').textContent=nextMessage?'E DRÜCKEN · NÄCHSTE NACHRICHT':'GARAGE · E DRÜCKEN: NACHRICHT LESEN';
  $('garagePrompt').classList.toggle('hidden',!(atGarage||nextMessage));
}
function worldCity(returnFromRace=false){
  base();world='city';raceSamples.length=0;cityData=createCity(THREE,scene);
  velocity=0;zone=false;briefOpen=false;inventoryOpen=false;
  $('letterOverlay').classList.add('hidden');$('inventoryPanel').classList.add('hidden');
  pos.set(cityData.start.x,0,returnFromRace?-216:cityData.start.z);
  heading=returnFromRace?Math.PI:cityData.start.heading;
  carMake();makeRain();mission=createMissionManager(THREE,scene,profile.stage,profile.active);
  $('status').textContent=profile.stage>=MISSIONS.length?'NACHTSCHICHT · ALLE LIEFERUNGEN FERTIG':
    profile.active?'NACHTSCHICHT · '+mission.current.recipient:'NACHTSCHICHT · E für Nachricht';
  $('speed').textContent='00';renderWallet();missionHud();
  say(returnFromRace?'Zurück in der Nachtschicht.':'Bei der Garage E drücken, um den Auftrag zu lesen.');
}
function raceNearest(x,z){
  let best=Infinity,t=0;
  for(let i=1;i<raceSamples.length;i++){
    const a=raceSamples[i-1],b=raceSamples[i],dx=b.x-a.x,dz=b.z-a.z;
    const u=THREE.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);
    const d=(x-a.x-u*dx)**2+(z-a.z-u*dz)**2;
    if(d<best){best=d;t=(i-1+u)/COUNT}
  }
  return {distance:Math.sqrt(best),t};
}
function worldRace(){
  base();world='race';cityData=null;mission=null;raceSamples.length=0;
  briefOpen=false;inventoryOpen=false;$('letterOverlay').classList.add('hidden');$('inventoryPanel').classList.add('hidden');
  $('missionCompass').classList.add('hidden');$('garagePrompt').classList.add('hidden');
  velocity=0;lap=1;checkpoint=0;elapsed=0;previousT=0;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(700,700),mat(0x0c2227));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const vertices=[],faces=[];
  for(let i=0;i<=COUNT;i++){
    const p=circuit.getPoint(i/COUNT),dir=circuit.getTangent(i/COUNT).normalize(),nx=-dir.z,nz=dir.x;
    raceSamples.push({x:p.x,z:p.z});
    vertices.push(p.x+nx*RACE_WIDTH/2,.16,p.z+nz*RACE_WIDTH/2);
    vertices.push(p.x-nx*RACE_WIDTH/2,.16,p.z-nz*RACE_WIDTH/2);
    if(i<COUNT){const k=i*2;faces.push(k,k+1,k+2,k+1,k+3,k+2)}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geo.setIndex(faces);geo.computeVertexNormals();
  const road=new THREE.Mesh(geo,mat(0x1b2c35,{side:THREE.DoubleSide}));road.receiveShadow=true;scene.add(road);
  for(let i=0;i<COUNT;i+=10){
    const p=circuit.getPoint(i/COUNT),dir=circuit.getTangent(i/COUNT).normalize(),nx=-dir.z,nz=dir.x;
    for(const s of [-1,1]){
      const curb=box(1,.3,8,p.x+s*nx*11.5,.3,p.z+s*nz*11.5,mat(i%20?0xe4e8e5:0xd14655));
      curb.rotation.y=Math.atan2(dir.x,dir.z);
    }
    if(i%30===0){
      const lx=p.x+nx*16,lz=p.z+nz*16;
      box(.35,9,.35,lx,4.5,lz,mat(0x48616a));
      box(1,.3,1,lx,9,lz,mat(0xffd89a,{emissive:0xffa257,emissiveIntensity:2}));
      const light=new THREE.PointLight(0xffc584,3,35);light.position.set(lx,8.8,lz);scene.add(light);
    }
  }
  for(const t of [0,.25,.5,.75]){
    const p=circuit.getPoint(t),dir=circuit.getTangent(t).normalize(),nx=-dir.z,nz=dir.x;
    for(const s of [-1,1])box(.5,8,.5,p.x+s*nx*15,4,p.z+s*nz*15,mat(t===0?0x71eddd:0xffb774,{emissive:t===0?0x188e83:0xd76b2f,emissiveIntensity:2}));
  }
  const p=circuit.getPoint(.005),dir=circuit.getTangent(.005).normalize();
  pos.set(p.x,0,p.z);heading=Math.atan2(dir.x,-dir.z);
  carMake();makeRain();$('status').textContent='RENN-NACHT · RUNDE 1/3';$('speed').textContent='00';renderWallet();
  say('Rennstrecke betreten · 3 Runden.');
}
function playingOn(){playing=true;paused=false;keys.clear();$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('hud').hidden=false;$('bottomHud').hidden=false;missionHud()}
function cameraChange(){cameraMode=(cameraMode+1)%cameraModes.length;camera.fov=cameraModes[cameraMode].fov;camera.updateProjectionMatrix();say('Kamera '+(cameraMode+1)+'/5: '+cameraModes[cameraMode].name)}
function openLetter(mode,m){
  letterMode=mode;briefOpen=true;inventoryOpen=false;velocity=0;keys.clear();
  $('speed').textContent='00';$('inventoryPanel').classList.add('hidden');$('letterOverlay').classList.remove('hidden');
  $('letterTitle').textContent=mode==='reward'?'Nachricht von '+m.recipient.split(' · ')[0]:m.title;
  $('letterBody').textContent=mode==='reward'
    ?`${m.recipient.split(' · ')[0]} hat die Fracht erhalten. Gute Arbeit! Deine Belohnung wurde dem Geldbeutel und dem Teileinventar gutgeschrieben.`
    :m.story;
  $('letterMeta').textContent=mode==='reward'
    ?`BELOHNUNG: +${m.pay} €  ·  +1 ${m.part.name}  ·  ${profile.stage<MISSIONS.length?'NÄCHSTE NACHRICHT VERFÜGBAR':'ALLE LIEFERUNGEN ERLEDIGT'}`
    :`ABSENDER: ${m.sender}  ·  EMPFÄNGER: ${m.recipient}  ·  FRACHT: ${m.cargo}`;
  $('closeLetter').textContent=mode==='reward'
    ?profile.stage<MISSIONS.length?'NÄCHSTE NACHRICHT [E / ENTER]':'ZURÜCK ZUM SPIEL [E / ENTER]'
    :'VERSTANDEN · LOSFAHREN [E / ENTER]';
  missionHud();
}
function dismissLetter(acceptNext=true){
  if(!briefOpen)return;
  const wasReward=letterMode==='reward';
  briefOpen=false;letterMode='';$('letterOverlay').classList.add('hidden');
  if(wasReward&&acceptNext&&world==='city'&&mission&&!mission.done){
    startNextMission();return;
  }
  missionHud();
}
function startNextMission(){
  if(world!=='city'||!mission||mission.done||mission.active)return false;
  if(!mission.start())return false;
  profile.active=true;saveProfile();openLetter('brief',mission.current);return true;
}
function completeDelivery(m){
  if(!profile.completed.includes(m.id)){
    profile.completed.push(m.id);
    profile.wallet+=m.pay;
    profile.inventory[m.part.id]=(profile.inventory[m.part.id]||0)+1;
  }
  mission.advance();profile.stage=mission.stage;profile.active=false;
  saveProfile();renderWallet();openLetter('reward',m);
}
function acceptWithE(){
  if(world!=='city'||!playing||paused||briefOpen||inventoryOpen||!mission||mission.active||mission.done)return false;
  const first=mission.stage===0;
  if(first&&(Math.hypot(pos.x-cityData.start.x,pos.z-cityData.start.z)>=18||Math.abs(velocity)>=2.5))return false;
  return startNextMission();
}
function drive(dt,now){
  const gas=keys.has('KeyW')||keys.has('ArrowUp'),brake=keys.has('KeyS')||keys.has('ArrowDown');
  const steer=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
  if(gas)velocity+=35*dt;if(brake)velocity-=velocity>1?55*dt:24*dt;
  if(!gas&&!brake)velocity*=Math.exp(-1.55*dt);
  velocity=THREE.MathUtils.clamp(velocity,-13,39);if(Math.abs(velocity)<.12)velocity=0;
  heading+=steer*dt*1.65*Math.min(1,Math.abs(velocity)/15)*(velocity<0?-1:1);
  const x=pos.x+Math.sin(heading)*velocity*dt,z=pos.z-Math.cos(heading)*velocity*dt;
  const allowed=world==='city'?cityData.isRoad(x,z):raceNearest(x,z).distance<RACE_WIDTH/2-2;
  if(allowed){pos.x=x;pos.z=z}else velocity=0;
  if(world==='city'){
    pos.y=cityData.height(pos.x,pos.z);
    const dx=Math.sin(heading)*2.7,dz=-Math.cos(heading)*2.7;
    const front=cityData.height(pos.x+dx,pos.z+dz),rear=cityData.height(pos.x-dx,pos.z-dz);
    car.rotation.x=Math.atan2(front-rear,5.4);
  }
  car.position.copy(pos);car.rotation.y=-heading;
  body.rotation.z=THREE.MathUtils.lerp(body.rotation.z,-steer*velocity/39*.085,Math.min(1,dt*5));
  $('speed').textContent=String(Math.round(Math.abs(velocity)*3)).padStart(2,'0');
  if(world==='city'){
    const result=mission.update(pos.x,pos.z,velocity,dt,now);
    if(result.completed){completeDelivery(result.completed);say('Lieferung übergeben · Belohnung erhalten!')}
    $('status').textContent='NACHTSCHICHT · '+result.text;
    const gate=cityData.gate,inside=Math.hypot(pos.x-gate.x,pos.z-gate.z)<gate.radius;
    if(inside&&Math.abs(velocity)<2.5&&!zone){zone=true;say('RENN-NACHT · Halte an und drücke E')}
    if(!inside||Math.abs(velocity)>=2.5)zone=false;
  }else{
    elapsed+=dt;const t=raceNearest(pos.x,pos.z).t;
    const tangent=circuit.getTangent(t).normalize();
    const forward=velocity>2&&(Math.sin(heading)*tangent.x-Math.cos(heading)*tangent.z)>.45;
    if(forward){
      if(checkpoint===0&&t>.25&&t<.42){checkpoint=1;say('Checkpoint 1/3')}
      else if(checkpoint===1&&t>.5&&t<.67){checkpoint=2;say('Checkpoint 2/3')}
      else if(checkpoint===2&&t>.75&&t<.92){checkpoint=3;say('Checkpoint 3/3')}
      else if(checkpoint===3&&previousT>.94&&t<.05){
        checkpoint=0;lap++;
        if(lap>3){playing=false;velocity=0;say('Ziel! '+elapsed.toFixed(1)+' Sekunden');$('menu').classList.remove('hidden')}
        else say('Runde '+lap+'/3');
      }
    }
    previousT=t;
    $('status').textContent=`RENN-NACHT · RUNDE ${Math.min(lap,3)}/3 · ${elapsed.toFixed(1)} s`;
  }
  missionHud();
}
function updateRain(dt){
  const arr=rain.attributes.position.array;
  for(let i=0;i<raindrops.length;i++){
    const drop=raindrops[i];drop.y-=dt*34;
    if(drop.y<.3){drop.y=60;drop.x=(Math.random()-.5)*115;drop.z=(Math.random()-.5)*115}
    arr[i*3]=pos.x+drop.x;arr[i*3+1]=pos.y+drop.y;arr[i*3+2]=pos.z+drop.z;
  }
  rain.attributes.position.needsUpdate=true;
}
function frame(now){
  requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;
  if(playing&&!paused&&!briefOpen&&!inventoryOpen)drive(dt,now);
  updateRain(dt);
  if(cameraMode===0){goal.set(pos.x+51,pos.y+86,pos.z+89);look.set(pos.x,pos.y+2,pos.z-5)}
  else{car.updateMatrixWorld(true);goal.copy(cameraModes[cameraMode].offset);car.localToWorld(goal);look.copy(cameraModes[cameraMode].look);car.localToWorld(look)}
  if(cameraMode>=3){camPos.copy(goal);camLook.copy(look)}
  else{const smoothing=Math.min(1,dt*(cameraMode===0?3:6));camPos.lerp(goal,smoothing);camLook.lerp(look,smoothing)}
  camera.position.copy(camPos);camera.lookAt(camLook);
  moon.position.set(pos.x-80,130,pos.z+70);moon.target.position.set(pos.x,0,pos.z);
  renderer.render(scene,camera);
}
function init(){
  try{
    renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.65;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    viewport.appendChild(renderer.domElement);
    camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,1100);
    addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
    renderWallet();worldCity();requestAnimationFrame(frame);window.nachtfahrtReady=true;
  }catch(err){window.nachtfahrtBootError=err.message;console.error('Nachtfahrt Startfehler',err)}
}
$('deliveryMode').onclick=()=>{if(world!=='city')worldCity();playingOn()};
$('raceMode').onclick=()=>{worldRace();playingOn()};
$('startButton').onclick=()=>{worldRace();playingOn()};
$('enterRace').onclick=()=>{worldCity(true);playingOn()};
$('resumeButton').onclick=()=>{paused=false;keys.clear();$('pause').classList.add('hidden')};
$('menuButton').onclick=()=>{worldCity(true);playingOn()};
$('pauseButton').onclick=()=>{paused=true;keys.clear();$('pause').classList.remove('hidden')};
$('closeLetter').onclick=()=>dismissLetter(true);
$('inventoryButton').onclick=()=>toggleInventory();
$('closeInventory').onclick=()=>toggleInventory(false);
addEventListener('keydown',e=>{
  if(briefOpen){
    if(!e.repeat&&['KeyE','Enter','NumpadEnter'].includes(e.code)){e.preventDefault();dismissLetter(true)}
    else if(!e.repeat&&e.code==='Escape'){e.preventDefault();dismissLetter(false)}
    return;
  }
  if(inventoryOpen){if(['KeyI','Escape'].includes(e.code)&&!e.repeat){e.preventDefault();toggleInventory(false)}return}
  if(playing&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.code==='KeyI'&&playing&&!e.repeat){toggleInventory();return}
  if(e.code==='KeyE'&&playing&&!paused&&!e.repeat){
    if(acceptWithE())return;
    if(world==='city'&&zone){worldRace();playingOn();return}
  }
  if(e.code==='KeyC'&&playing&&!paused&&!e.repeat){cameraChange();return}
  if(e.code==='Escape'&&playing){paused=!paused;keys.clear();$('pause').classList.toggle('hidden',!paused);return}
  if(e.code==='KeyR'&&playing){worldCity(world==='race');playingOn();return}
  if(!e.repeat)keys.add(e.code);
});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&!paused){paused=true;keys.clear();$('pause').classList.remove('hidden')}});
init();
