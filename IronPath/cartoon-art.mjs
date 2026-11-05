import {translateText as tr,getLanguage} from './language.mjs?v=20261112-firstrun2';
import {towerDisplay} from './progression.mjs?v=20261105-prestige1';
import {drawStoryTerrain,drawStoryAtmosphere,drawStoryObjective,prepareStoryArt} from './story-map-art.mjs?v=20261105-workshop5';
import {ENEMY_INTEL} from './combat.mjs?v=20261102-battle2';
import {bossPhase} from './boss-mechanics.mjs?v=20261102-battle2';
// Drawing only: the simulation, coordinates and hit areas stay unchanged.
const ink='#1d3028',paper='#f1e7c4';
function line(ctx,points,color=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function shape(ctx,points,fill,stroke=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
function oval(ctx,x,y,rx,ry,fill,stroke=ink,width=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
// Legible tactical silhouettes replace cartoon drawings if an image cannot load.
function fallbackMarker(ctx,x,y,label,color='#d9c08a',rx=15,ry=13){
 ctx.save();oval(ctx,x,y,rx,ry,'#1c3029',color,2);ctx.fillStyle=color;ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(label,x,y+3);ctx.restore();
}
function ground(ctx,theme='road',width=960,height=540){
  ctx.fillStyle=({forest:'#354b3c',outpost:'#5b5748',urban:'#555a55',scrub:'#6f5445',arctic:'#a8c1c3',marsh:'#41594b'})[theme]||'#455740';ctx.fillRect(0,0,width,height);
  // Restrained map-like contour detail while a texture is unavailable.
  ctx.save();ctx.globalAlpha=.12;
  for(let i=0;i<75;i++){const x=(i*163+47)%width,y=(i*113+31)%height;oval(ctx,x,y,14+(i%4)*6,4+(i%3)*3,i%2?'#182a23':'#d7d3b1',null);}
  ctx.restore();
}
function drawRoad(ctx,path,theme,texture=null){
  ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#303d30';ctx.lineWidth=73;ctx.stroke();ctx.strokeStyle=theme==='arctic'?'#a5c2c0':theme==='urban'?'#77766d':theme==='marsh'?'#8e795c':theme==='scrub'?'#bd8765':'#b19a70';ctx.lineWidth=65;ctx.stroke();ctx.strokeStyle=theme==='arctic'?'#c4d9d4':theme==='urban'?'#aaa69a':theme==='marsh'?'#b29b74':theme==='scrub'?'#dda77f':'#cbb58a';ctx.lineWidth=55;ctx.stroke();
  if(texture&&ctx.createPattern){const pattern=ctx.createPattern(texture,'repeat');if(pattern){ctx.save();ctx.globalAlpha=.3;ctx.strokeStyle=pattern;ctx.lineWidth=52;ctx.stroke();ctx.restore();}}
  ctx.strokeStyle='#756a53';ctx.lineWidth=1;ctx.setLineDash([5,18]);ctx.stroke();ctx.setLineDash([]);
  for(const [x,y] of [[50,119],[160,140],[206,220],[230,328],[350,311],[480,250],[600,157],[709,278],[775,409]]){line(ctx,[[x-7,y+8],[x-2,y+7],[x+2,y+9]],'#ac986f',2);line(ctx,[[x+6,y-7],[x+11,y-8]],'#a08a66',2);}
}
// Presentation only: the marked segment retains the simulation's exact endpoints.
function roadZone(ctx,a,b,{color,edge,label,detail}){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)return;
  ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));ctx.lineCap='butt';
  ctx.globalAlpha=.34;line(ctx,[[0,0],[length,0]],color,45);ctx.globalAlpha=.8;
  line(ctx,[[0,-21],[length,-21]],edge,1.5);line(ctx,[[0,21],[length,21]],edge,1.5);
  for(let x=14;x<length-8;x+=25){if(detail==='ice'){line(ctx,[[x,-13],[x+5,-5],[x+1,2],[x+8,11]],edge,1);}else if(detail==='mud'){oval(ctx,x,-6,4,1.5,edge,null);oval(ctx,x+8,7,6,2,edge,null);}else{line(ctx,[[x,-10],[x+5,-8]],edge,1.5);line(ctx,[[x+9,8],[x+15,10]],edge,1.5);}}
  ctx.globalAlpha=1;ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#182b25';ctx.strokeText(label,length/2,-27);ctx.fillStyle='#e2e5d3';ctx.fillText(label,length/2,-27);ctx.restore();
}
function thinIce(ctx,path,theme){if(theme!=='arctic'||path.length!==10)return;roadZone(ctx,path[4],path[5],{color:'#6b9aa3',edge:'#d7ece9',label:tr('THIN ICE'),detail:'ice'});}
function bog(ctx,path,theme){if(theme!=='marsh'||path.length!==10)return;roadZone(ctx,path[6],path[7],{color:'#584d36',edge:'#c0b694',label:tr('DEEP BOG'),detail:'mud'});}
function fieldZone(ctx,path,state,theme){
 if(!state.mapId?.startsWith('g2-')||path.length!==10||!['forest','urban'].includes(theme))return;
 const cleared=theme==='urban'&&state.rubbleCleared;
 roadZone(ctx,path[2],path[3],{color:theme==='forest'?'#475b43':cleared?'#778270':'#645f54',edge:theme==='forest'?'#b0c4a1':'#d0c9b4',label:theme==='forest'?tr('AMBUSH TRAIL'):cleared?tr('RUBBLE CLEARED'):tr('RUBBLE {amount}',{amount:Math.max(0,Math.ceil(200-(state.rubbleDamage||0)))}),detail:'debris'});
}
function brokenIce(ctx,path,state,theme){if(theme!=='arctic'||!state.iceBroken||path.length!==10)return;roadZone(ctx,path[4],path[5],{color:'#335e6d',edge:'#d2eff0',label:tr('BROKEN ICE'),detail:'ice'});}
// Sprite images are strictly visual and load on demand; vector art remains a
// fallback for offline loading failures and non-browser renderers.
const spriteImages=new Map();
function sprite(ctx,name){
  const doc=ctx.canvas?.ownerDocument;if(!doc?.createElement)return null;
  if(!spriteImages.has(name)){const image=doc.createElement('img'),entry={image,ready:false};spriteImages.set(name,entry);image.onload=()=>{entry.ready=true;};image.src=`assets/${name}-sprite.png`;}
  const entry=spriteImages.get(name);return entry.ready?entry.image:null;
}
function bunker(ctx,state){
  const damage=state.hp/Math.max(1,state.maxHp||100),plating=state.plating||0;
  const artwork=sprite(ctx,'bunker');
  if(artwork)ctx.drawImage(artwork,855,365,105,62);
  else fallbackMarker(ctx,908,400,'HQ','#e3cc92',33,22);
  if(plating>0){line(ctx,[[876,407],[940,407]],'#e5c883',3);for(let i=0;i<plating;i++)oval(ctx,887+i*8,412,2,2,'#f4d894',null);}
  if(damage<.7){line(ctx,[[905,402],[901,407],[906,410],[901,417]],'#293a30',2);}
  if(damage<.35){line(ctx,[[928,390],[923,385],[926,379]],'#293a30',3);line(ctx,[[878,405],[884,410],[879,416]],'#293a30',2);oval(ctx,894,384,5,3,'#554d3d',null);}
  ctx.fillStyle='#344231';ctx.font='bold 13px Georgia';ctx.fillText('BUNKER',849,350);
}
function pad(ctx,p,tower,selected,types){
  const x=p.x,y=p.y;
  shape(ctx,[[x-23,y-11],[x-15,y-20],[x+15,y-20],[x+23,y-11],[x+23,y+11],[x+15,y+20],[x-15,y+20],[x-23,y+11]],tower?'#263b31':'#213a33',selected?'#b5d6ca':'#819f92',selected?2.5:1.5);
  if(!tower){line(ctx,[[x-12,y-8],[x+12,y-8]],'#78988b',1);ctx.fillStyle='#dce7d7';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(tr('BUILD'),x,y+5);ctx.textAlign='start';return;}
  const display=towerDisplay(tower.level);
  // A static gold halo remains visible even when reduced motion is enabled.
  if(display.prestige){ctx.save();ctx.shadowColor='#ffd75c';ctx.shadowBlur=15;oval(ctx,x,y-4,26,23,'rgba(255,207,79,.12)','#f8d572',2);ctx.restore();
    ctx.fillStyle='#ffe59a';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(`★${display.prestige}`,x,y-25);ctx.textAlign='start';}
  // Preserve vector rendering only as an asset-loading fallback.
  const artwork=sprite(ctx,['mg','cannon','flak','sniper'][tower.type]);
  if(artwork)ctx.drawImage(artwork,x-24,y-25,48,40);
  else fallbackMarker(ctx,x,y-3,['MG','C','AA','S'][tower.type],types[tower.type].color,16,14);
  oval(ctx,x-15,y+13,7,7,'#263e30','#f1dfaa',1);ctx.fillStyle='#f6e9c6';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(['M','C','F','S'][tower.type],x-15,y+16);
  oval(ctx,x+15,y+13,9,9,paper);ctx.fillStyle=ink;ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(String(display.level),x+15,y+17);ctx.textAlign='start';
}
function soldier(ctx,p,own,pose={}){
  const x=p.x,y=p.y,artwork=sprite(ctx,'hero');
  oval(ctx,x,y+13,13,5,own?'#e5c783':'#87c4ce',null);
  if(pose.moving){
    // Small alternating boot scuffs communicate motion without changing hitboxes.
    ctx.save();ctx.globalAlpha=.45;oval(ctx,x-6*(pose.facing||1),y+14,2.5+Math.abs(pose.step||0),1.5,'#ead7ae',null);ctx.restore();
  }
  ctx.save();ctx.translate(x,y+(pose.bob||0));ctx.rotate(pose.lean||0);ctx.scale(pose.facing===-1?-1:1,1);
  // The legacy asset contains two repeated soldiers side by side. Display just
  // one figure rather than squeezing both into a single player marker.
  if(artwork)ctx.drawImage(artwork,0,0,60,90,-11,-18,22,33);
  else fallbackMarker(ctx,0,0,own?'YOU':'ALLY',own?'#e5c783':'#87c4ce',12,12);
  ctx.restore();
  ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.strokeText(p.name||tr('HERO'),x,y+29);ctx.fillStyle=paper;ctx.fillText(p.name||tr('HERO'),x,y+29);ctx.textAlign='start';
}
function enemy(ctx,e,reducedMotion){
  const x=e.x,y=e.y;
  if(e.boss){const phase=bossPhase(e);if(phase!=='normal'){
    const radius=phase==='rally'?45:phase==='shield'?31:28;
    ctx.save();ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.strokeStyle=phase==='shield'?'#a5d9e3':phase==='repair-warning'?'#addb8b':'#f3c776';ctx.lineWidth=3;ctx.setLineDash(reducedMotion?[]:[5,5]);ctx.stroke();
    if(phase==='shield'){ctx.globalAlpha=.18;ctx.fillStyle='#b6e7ed';ctx.fill();}
    if(phase==='repair-warning'){line(ctx,[[x-6,y-30],[x+6,y-30]],'#daf0ad',3);line(ctx,[[x,y-36],[x,y-24]],'#daf0ad',3);}
    if(phase==='bomb-warning'){line(ctx,[[x+3,y+17],[x+3,y+27]],'#ffd193',3);oval(ctx,x+3,y+30,3,5,'#f2ca87');}
    ctx.restore();
  }}
  if(e.boss){ctx.save();ctx.beginPath();ctx.arc(x,y,e.boss==='bossCommander'?36:24,0,Math.PI*2);ctx.fillStyle='rgba(180,69,48,.22)';ctx.fill();ctx.strokeStyle='#a83d30';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.stroke();ctx.restore();}
  oval(ctx,x,y+10,11,4,'#8c8264',null);
  const name=e.boss?(e.boss==='bossBomber'?'boss-plane':'boss-heavy'):e.kind==='tank'?'tank':e.kind==='plane'?'plane':e.kind==='infantry'||e.kind==='runner'?'infantry':null,artwork=name&&sprite(ctx,name);
  if(!artwork)fallbackMarker(ctx,x,y,e.boss?'BOSS':(ENEMY_INTEL[e.kind]?.symbol||'!'),'#e6a182',e.boss?22:12,e.boss?16:10);
  else if(name==='tank'||name==='boss-heavy')ctx.drawImage(artwork,x-(e.boss?25:17),y-(e.boss?18:12),e.boss?50:34,e.boss?32:20);
  else if(name==='plane'||name==='boss-plane')ctx.drawImage(artwork,x-(e.boss?27:17),y-(e.boss?20:14),e.boss?54:34,e.boss?40:27);
  else ctx.drawImage(artwork,x-8,y-13,16,24);
  if(!e.boss&&ENEMY_INTEL[e.kind]){const bx=x+(e.kind==='tank'?18:15),by=y+10;oval(ctx,bx,by,7,7,'#344a3b','#f7e5b5',1);ctx.fillStyle='#fff3d2';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(ENEMY_INTEL[e.kind].symbol,bx,by+3);ctx.textAlign='start';}
  const w=e.boss?52:28;ctx.fillStyle=ink;ctx.fillRect(x-w/2,y-22,w,5);ctx.fillStyle=e.boss?'#eea35f':e.hp/e.maxHp<.3?'#ed9b74':'#dce59c';ctx.fillRect(x-w/2+1,y-21,(w-2)*Math.max(0,Math.min(1,e.hp/e.maxHp)),3);
  if(e.boss){const names={bossIronclad:'IRONCLAD',bossBomber:'DREAD BOMBER',bossJuggernaut:'JUGGERNAUT',bossCommander:'WAR COMMANDER'};ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.strokeText(tr(names[e.boss]||'BOSS'),x,y-29);ctx.fillStyle='#ffe1a0';ctx.fillText(tr(names[e.boss]||'BOSS'),x,y-29);ctx.textAlign='start';}
}
// Ambient particles are local presentation only. They never obscure labels or
// change simulation, and are absent when reduced motion is requested.
function ambient(ctx,theme,time,width,height){
  const t=Number.isFinite(time)?time:0;ctx.save();ctx.globalAlpha=.23;
  if(theme==='arctic'){for(let i=0;i<32;i++){const x=(i*137+t*8)%width,y=(i*71+t*24)%height;oval(ctx,x,y,1.5,1.5,'#f4f6e9',null);}}
  else if(theme==='marsh'){for(let i=0;i<22;i++){const x=(i*83+t*60)%width,y=(i*127+t*125)%height;line(ctx,[[x,y],[x-4,y+9]],'#d7e7d6',1);}}
  else if(theme==='urban'||theme==='outpost'||theme==='scrub'){for(let i=0;i<22;i++){const x=(i*109+t*6)%width,y=((i*83-t*14)%height+height)%height;oval(ctx,x,y,1.4,1.4,'#f3d092',null);}}
  else{for(let i=0;i<4;i++){const x=((i*270+t*7)%(width+220))-110;oval(ctx,x,80+i*(height/4),85,13,'#d9ddbd',null);}}
  ctx.restore();
}
// The road and terrain never change during a match; draw them once per path.
const terrainCache=new WeakMap();
// Same-origin illustrated ground is cosmetic. Cache a new terrain layer once it
// loads; no simulation data, map geometry, or hit targets are touched.
const groundImages=new Map();
function getGroundImage(doc,theme){
  const name=({forest:'terrain-forest.jpg',urban:'terrain-city.jpg',outpost:'terrain-city.jpg',scrub:'terrain-desert.jpg',arctic:'terrain-snow.jpg',marsh:'terrain-marsh.jpg'})[theme]||'endless-ground.jpg';
  if(!groundImages.has(name)&&doc?.createElement){const image=doc.createElement('img'),entry={image,ready:false};groundImages.set(name,entry);image.onload=()=>{entry.ready=true;};image.src=`assets/${name}`;}
  const entry=groundImages.get(name);return entry?.ready?entry.image:null;
}
function drawTerrain(ctx,path,theme,{paths=[path],width=960,height=540,storyMission=null,pads=[],storyArt=null,renderScale=1}={}){
  const doc=ctx.canvas?.ownerDocument,img=doc?getGroundImage(doc,theme):null;
  function paint(target){
    if(!storyMission||!drawStoryTerrain(target,storyMission,path,pads,width,height,img,storyArt)){
      ground(target,theme,width,height);
      if(img){target.save();target.globalAlpha=.92;target.drawImage(img,0,0,width,height);target.restore();}
    }
    for(const road of paths)drawRoad(target,road,theme,img);thinIce(target,path,theme);bog(target,path,theme);
  }
  if(!doc?.createElement){paint(ctx);return;}
  let variants=terrainCache.get(path);if(!variants){variants=new Map();terrainCache.set(path,variants);}const resolution=Math.max(1,Math.min(3,Math.sqrt(6000000/(width*height)),Math.ceil(renderScale*2)/2)),key=`${storyMission?.id||'free'}:${theme}:${width}:${height}`,revision=`${img?'art':'fallback'}:${storyArt?.version||0}:${getLanguage()}:${resolution}`;let cached=variants.get(key);
  if(!cached||cached.revision!==revision){const canvas=doc.createElement('canvas');canvas.width=Math.round(width*resolution);canvas.height=Math.round(height*resolution);const off=canvas.getContext('2d');if(!off){paint(ctx);return;}off.scale(resolution,resolution);off.lineCap='round';off.lineJoin='round';paint(off);cached={canvas,revision};variants.set(key,cached);}
  ctx.drawImage(cached.canvas,0,0,width,height);
}
export function drawCartoonBattle(ctx,state,{path,pads,types,me,getTowerRange,theme='road',shotAge=0,effects=[],reducedMotion=false,soldierPoses={},paths=[path],width=960,height=540,bunkerPosition={x:900,y:400},storyMission=null,storyStage=null,storyTime=0,renderScale=1}){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';const storyArt=storyMission?prepareStoryArt(ctx.canvas?.ownerDocument):null;drawTerrain(ctx,path,theme,{paths,width,height,storyMission,pads,storyArt,renderScale});fieldZone(ctx,path,state,theme);brokenIce(ctx,path,state,theme);if(storyMission){drawStoryAtmosphere(ctx,storyMission,storyTime,reducedMotion,width,height,path,pads);drawStoryObjective(ctx,storyMission,storyStage,storyTime,reducedMotion,storyArt);}else if(!reducedMotion)ambient(ctx,theme,storyTime,width,height);ctx.save();ctx.translate(bunkerPosition.x-900,bunkerPosition.y-400);bunker(ctx,state);ctx.restore();
  if(!reducedMotion&&state.hp>0&&state.hp/Math.max(1,state.maxHp||100)<.35){const t=Number.isFinite(storyTime)?storyTime:0;ctx.save();ctx.globalAlpha=.28;for(let i=0;i<3;i++){const phase=((t*.3+i/3)%1+1)%1;oval(ctx,bunkerPosition.x+20+Math.sin(t+i)*3,bunkerPosition.y-18-phase*25,3+phase*5,2+phase*3,'#465447',null);}ctx.restore();}
  ctx.fillStyle='#344231';ctx.font='bold 12px Georgia';ctx.fillText(tr('ENEMY ENTRY'),15,75);if(paths.length>1)ctx.fillText(tr('ENEMY ENTRY'),15,height-75);
  const selected=state.towers.find(t=>t.pad===state.selectedPad);if(selected&&!state.ended){const p=pads[selected.pad];ctx.beginPath();ctx.arc(p.x,p.y,getTowerRange(selected),0,Math.PI*2);ctx.fillStyle='rgba(129,179,164,.10)';ctx.fill();ctx.strokeStyle='#b1d3c6';ctx.lineWidth=1.5;ctx.setLineDash([5,7]);ctx.stroke();ctx.setLineDash([]);}
  if(!reducedMotion)for(const tower of state.towers){const owner=state.players[tower.ownerId],p=pads[tower.pad];if(p&&owner?.active!==false&&owner?.overdrive>0){ctx.beginPath();ctx.ellipse(p.x,p.y,31,27,0,0,Math.PI*2);ctx.strokeStyle='#fff1a3';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);}}
  pads.forEach((p,i)=>pad(ctx,p,state.towers.find(t=>t.pad===i),state.selectedPad===i,types));
  if(state.wave>0)for(const p of Object.values(state.players))if(p.active!==false){if(p.mobileSupply?.remaining>0){ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,22,0,Math.PI*2);ctx.strokeStyle='#89d9ed';ctx.lineWidth=3;ctx.stroke();ctx.restore();}soldier(ctx,p,p.id===me,soldierPoses[p.id]);}
  if(theme==='scrub'&&path.length===10)for(const cloud of state.dustClouds||[]){
    ctx.save();ctx.beginPath();ctx.arc(cloud.x,cloud.y,75,0,Math.PI*2);ctx.fillStyle='rgba(210,168,119,.12)';ctx.fill();ctx.strokeStyle='rgba(133,88,57,.45)';ctx.lineWidth=2;ctx.setLineDash(reducedMotion?[]:[4,9]);ctx.stroke();ctx.restore();
  }
  if(theme==='scrub'&&path.length===10)for(const e of state.enemies)if(e.kind==='tank'&&e.hp>0){
    ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,75,0,Math.PI*2);ctx.fillStyle='rgba(210,168,119,.18)';ctx.fill();ctx.strokeStyle='rgba(133,88,57,.65)';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.stroke();ctx.restore();
  }
  if(state.running&&Object.values(state.players).some(p=>p.active!==false&&p.healingField?.remaining>0)){ctx.save();ctx.beginPath();ctx.arc(bunkerPosition.x,bunkerPosition.y,58,0,Math.PI*2);ctx.fillStyle='rgba(139,218,148,.16)';ctx.fill();ctx.strokeStyle='#9bd69a';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
  for(const e of state.enemies){
    if(e.siegeMarks?.some(m=>m.time>0)){ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,20,0,Math.PI*2);ctx.strokeStyle='#f3a45c';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
    if(e.boss==='bossBomber'&&bossPhase(e)==='bomb-warning'){
      ctx.save();ctx.strokeStyle='#f2aa78';ctx.lineWidth=3;ctx.setLineDash(reducedMotion?[]:[7,6]);ctx.beginPath();ctx.arc(bunkerPosition.x,bunkerPosition.y,36,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(e.boss==='bossBomber'&&e.bossFlash>0&&!reducedMotion)burst(ctx,bunkerPosition.x,bunkerPosition.y,20+(1-e.bossFlash)*12,'#ef9e68');
    if(e.boss==='bossJuggernaut'&&e.bossFlash>0&&!reducedMotion)burst(ctx,e.x,e.y-20,15,'#cce7a2');
    ctx.save();if(state.running&&!reducedMotion){const offset=Math.sin((Number.isFinite(storyTime)?storyTime:0)*5+(e.x+e.y)*.035)*(e.kind==='plane'?.8:1.2);ctx.translate(0,offset);}enemy(ctx,e,reducedMotion);ctx.restore();
  }
  if(!state.ended)for(const s of state.shots)drawShot(ctx,s,shotAge,reducedMotion);
  if(!reducedMotion)for(const pop of state.combatPops||[]){const life=Math.max(0,pop.life-shotAge);if(life>0){ctx.save();ctx.globalAlpha=Math.min(1,life/.35);burst(ctx,pop.x,pop.y,(pop.boss?25:10)+(1-life/.65)*(pop.boss?20:10),pop.boss?'#f5ae70':'#ebd69e');ctx.restore();}}
  if(!reducedMotion)for(const effect of effects)drawAbility(ctx,effect);
  ctx.restore();
}

function burst(ctx,x,y,r,fill){
  const points=[];for(let i=0;i<16;i++){const a=Math.PI*i/8,d=i%2?r*.52:r;points.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}shape(ctx,points,fill,ink,2);
}
function drawShot(ctx,s,age,reduced){
  const life=(Number.isFinite(s.life)?s.life:.12)-age;if(life<=0)return;
  const duration=s.duration||.12,progress=1-Math.max(0,Math.min(1,life/duration));
  ctx.save();if(s.kind===3)ctx.setLineDash([9,5]);line(ctx,[[s.x,s.y],[s.tx,s.ty]],ink,s.kind===1?6:4);line(ctx,[[s.x,s.y],[s.tx,s.ty]],s.color||'#ffec9e',s.kind===1?4:2);ctx.restore();
  if(reduced)return;
  const scale=s.kind===1?1.35:s.kind===3?.75:1;
  if(progress<.65)burst(ctx,s.x,s.y,(7+(1-progress)*4)*scale,'#ffe39b');
  if(progress>.12){ctx.save();ctx.globalAlpha=Math.max(.2,1-progress*.65);ctx.beginPath();ctx.arc(s.tx,s.ty,(5+progress*9)*scale,0,Math.PI*2);ctx.strokeStyle=s.kind===1?'#f0aa72':'#fff0b8';ctx.lineWidth=2;ctx.stroke();ctx.restore();burst(ctx,s.tx,s.ty,(5+progress*8)*scale,s.kind===1?'#e89964':'#f6d787');}
}
function drawAbility(ctx,e){
  const t=e.progress,fade=Math.max(0,1-t);ctx.save();ctx.globalAlpha=fade;
  if(e.kind==='bunkerHit'){burst(ctx,e.x,e.y,20+18*t,'#f27f59');ctx.fillStyle='#fff1ca';ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.font='bold 16px Georgia';ctx.textAlign='center';ctx.strokeText(e.label||tr('BUNKER HIT'),e.x,e.y-45-15*t);ctx.fillText(e.label||tr('BUNKER HIT'),e.x,e.y-45-15*t);
  }else if(e.kind==='combo'){const palette={'War Hero':'#f6b273','War Machine':'#f39467','War Economy':'#e9d37b','Bunker Guardian':'#b0dc9c','Ghost Operative':'#8acdda'};burst(ctx,e.x,e.y-20,14+15*t,palette[e.label]||'#88e3d3');ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(e.label?e.label.split(' + ').map(name=>tr(name)).join(' + '):tr('COMBO!'),e.x,e.y-43-12*t);
  }else if(e.kind==='assault'){
    const targets=e.targets.length?e.targets:[{x:e.x,y:e.y}];for(const p of targets){burst(ctx,p.x,p.y,12+20*t,'#ef9e68');oval(ctx,p.x,p.y,6+12*t,4+8*t,'#f9dc91',ink,2);}
  }else if(e.kind==='build'||e.kind==='upgrade'){
    burst(ctx,e.x,e.y-12,13+15*t,e.kind==='upgrade'?'#f4d982':'#b8d69d');
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr(e.kind==='build'?'BUILT':'UPGRADED'),e.x,e.y-38-12*t);
  }else if(e.kind==='engineer'){
    burst(ctx,e.x,e.y-20,12+15*t,'#eed475');ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('OVERDRIVE',e.x,e.y-42-12*t);
  }else if(e.kind==='logistics'){
    const y=e.y-24-12*t;shape(ctx,[[e.x-12,y-9],[e.x+12,y-9],[e.x+12,y+9],[e.x-12,y+9]],'#d7b276');line(ctx,[[e.x-11,y],[e.x+11,y]],ink,2);line(ctx,[[e.x,y-9],[e.x,y+9]],ink,2);ctx.fillStyle=ink;ctx.font='bold 14px Georgia';ctx.textAlign='center';ctx.fillText('+30',e.x,y-15);
  }else if(e.kind==='medic'){
    oval(ctx,e.x,e.y,22+12*t,22+12*t,'#cee6a6',ink,2);shape(ctx,[[e.x-4,e.y-12],[e.x+4,e.y-12],[e.x+4,e.y-4],[e.x+12,e.y-4],[e.x+12,e.y+4],[e.x+4,e.y+4],[e.x+4,e.y+12],[e.x-4,e.y+12],[e.x-4,e.y+4],[e.x-12,e.y+4],[e.x-12,e.y-4],[e.x-4,e.y-4]],'#f1e6c4');
  }else if(e.kind==='recon'){
    for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(e.x,e.y,16+36*t+i*15,0,Math.PI*2);ctx.strokeStyle='#b8e0d1';ctx.lineWidth=4-i;ctx.stroke();}ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('SUPPRESSION'),e.x,e.y-35-12*t);
  }
  ctx.restore();
}
