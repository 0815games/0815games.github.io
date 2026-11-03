import {drawStoryTerrain,drawStoryAtmosphere,drawStoryObjective} from './story-map-art.mjs?v=20261103-storymaps1';
import {ENEMY_INTEL} from './combat.mjs?v=20261102-battle2';
import {bossPhase} from './boss-mechanics.mjs?v=20261102-battle2';
// Drawing only: the simulation, coordinates and hit areas stay unchanged.
const ink='#1d3028',paper='#f1e7c4';
function line(ctx,points,color=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function shape(ctx,points,fill,stroke=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
function oval(ctx,x,y,rx,ry,fill,stroke=ink,width=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function ground(ctx,theme='road',width=960,height=540){
  ctx.fillStyle=({forest:'#779463',outpost:'#a69c79',urban:'#989488',scrub:'#b76f51',arctic:'#d8e6e3',marsh:'#788c6b'})[theme]||'#8b9d6c';ctx.fillRect(0,0,width,height);
  // Stable underpainting and contour marks; cached below roads, pads and units.
  ctx.save();ctx.globalAlpha=.13;
  for(let i=0;i<75;i++){const x=(i*163+47)%width,y=(i*113+31)%height;oval(ctx,x,y,14+(i%4)*6,4+(i%3)*3,i%2?'#253f34':'#f4d9a1',null);}
  ctx.restore();
  // Fixed decorative marks, never random on redraw, so nothing flickers.
  for(let i=0;i<96;i++){let x=(i*137+37)%width,y=(i*89+19)%height;ctx.strokeStyle=theme==='scrub'?'#d79a73':theme==='arctic'?'#adc9cb':theme==='urban'?'#77776d':theme==='marsh'?'#637d69':i%3?'#718759':'#b4bc88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y-5);ctx.moveTo(x+7,y+1);ctx.lineTo(x+10,y-3);ctx.stroke();}
  if(['scrub','arctic','urban','marsh'].includes(theme))return;
  for(const [x,y] of [[70,50],[330,65],[575,65],[850,75],[65,465],[420,470],[565,470],[935,260]]){
    oval(ctx,x,y,16,6,'#71875b',null);line(ctx,[[x-8,y],[x-10,y-6],[x-5,y-10]],'#506744',2);line(ctx,[[x,y],[x+2,y-9],[x+6,y-12]],'#506744',2);line(ctx,[[x+7,y],[x+10,y-6]],'#506744',2);
  }
}
// Illustrated landmarks are part of the cached terrain, below roads and units.
function landmarks(ctx,theme){
  if(theme==='forest'){
    for(const [x,y,size] of [[45,45,1],[120,55,.8],[250,55,1],[340,65,.8],[590,48,1],[735,65,.85],[860,65,1],[55,485,.85],[390,480,.9],[570,480,.8],[920,500,1]]){
      ctx.save();ctx.translate(x,y);ctx.scale(size,size);oval(ctx,0,18,18,6,'#607a50',null);shape(ctx,[[-5,18],[-5,0],[5,0],[5,18]],'#816e4f');shape(ctx,[[-22,2],[-12,-13],[-17,-13],[0,-35],[17,-13],[12,-13],[22,2]],'#456d4c');line(ctx,[[-10,-5],[0,-14],[9,-5]],'#83a377',2);ctx.restore();
    }
    line(ctx,[[20,255],[58,247],[87,250]],'#b7ca9a',3);line(ctx,[[770,470],[810,464],[840,468]],'#b7ca9a',3);
  }else if(theme==='outpost'||theme==='urban'){
    for(const [x,y] of [[65,50],[430,58],[790,65],[65,480],[520,485],[920,485]]){
      ctx.save();ctx.translate(x,y);shape(ctx,[[-28,20],[-28,-8],[-17,-8],[-17,-20],[-5,-14],[5,-22],[16,-12],[28,-12],[28,20]],'#c5b492','#695f4b',3);line(ctx,[[-21,2],[-6,2],[-6,15],[7,15]],'#8c7e61',2);line(ctx,[[10,-5],[22,-5],[22,8]],'#8c7e61',2);ctx.restore();
    }
    for(const [x,y] of [[440,80],[570,65],[800,470]]){oval(ctx,x,y,22,9,'#817862','#605b4a',2);oval(ctx,x+3,y-1,12,4,'#b2a589',null);}
  }else if(theme==='scrub'){
    for(const [x,y] of [[75,55],[355,55],[620,65],[850,60],[70,475],[380,470],[600,485],[900,480]]){
      shape(ctx,[[x-18,y+10],[x-12,y-13],[x-2,y-25],[x+12,y-18],[x+19,y+10]],'#d79a72','#794e3d');line(ctx,[[x-9,y],[x-5,y-12],[x+2,y-16]],'#efbd8d',2);
    }
    for(const [x,y] of [[245,55],[500,470],[805,480]]){shape(ctx,[[x-20,y+5],[x-15,y-7],[x+12,y-7],[x+22,y+5]],'#806f5c');oval(ctx,x-12,y+7,5,5,'#514c42');oval(ctx,x+13,y+7,5,5,'#514c42');}
  }else if(theme==='arctic'){
    for(const [x,y] of [[70,55],[360,55],[650,55],[850,70],[70,470],[360,480],[590,475],[900,485]]){
      shape(ctx,[[x-24,y+14],[x-5,y-24],[x+3,y-9],[x+13,y-20],[x+25,y+14]],'#b0d1d4','#6f9297');line(ctx,[[x-5,y-24],[x-1,y+5],[x+13,y-20]],'#eef6ed',2);
    }
    for(const [x,y] of [[220,55],[520,480],[800,475]]){oval(ctx,x,y,42,13,'#a9ced2','#82aaaf');line(ctx,[[x-15,y],[x,y-4],[x+15,y+2]],'#e9f5ef',2);}
  }else if(theme==='marsh'){
    for(const [x,y] of [[70,55],[350,55],[640,55],[850,65],[70,470],[380,475],[620,480],[900,480]]){
      oval(ctx,x,y,35,14,'#87a9a0','#536f61');line(ctx,[[x-20,y],[x-23,y-19],[x-19,y-25]],'#536a4c',3);line(ctx,[[x-12,y+3],[x-10,y-21]],'#536a4c',3);oval(ctx,x-10,y-23,3,6,'#795c42');
    }
    line(ctx,[[440,480],[500,480]],'#a5855e',9);for(let x=445;x<500;x+=10)line(ctx,[[x,475],[x,485]],'#624d3b',2);
  }
}
function drawRoad(ctx,path,theme){
  ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#303d30';ctx.lineWidth=73;ctx.stroke();ctx.strokeStyle=theme==='arctic'?'#a5c2c0':theme==='urban'?'#77766d':theme==='marsh'?'#8e795c':theme==='scrub'?'#bd8765':'#b19a70';ctx.lineWidth=65;ctx.stroke();ctx.strokeStyle=theme==='arctic'?'#c4d9d4':theme==='urban'?'#aaa69a':theme==='marsh'?'#b29b74':theme==='scrub'?'#dda77f':'#cbb58a';ctx.lineWidth=55;ctx.stroke();
  ctx.strokeStyle='#756a53';ctx.lineWidth=1.5;ctx.setLineDash([4,16]);ctx.stroke();ctx.setLineDash([]);
  for(const [x,y] of [[50,119],[160,140],[206,220],[230,328],[350,311],[480,250],[600,157],[709,278],[775,409]]){line(ctx,[[x-7,y+8],[x-2,y+7],[x+2,y+9]],'#ac986f',2);line(ctx,[[x+6,y-7],[x+11,y-8]],'#a08a66',2);}
}
function thinIce(ctx,path,theme){
  if(theme!=='arctic'||path.length!==10)return;
  const a=path[4],b=path[5];
  ctx.save();ctx.lineCap='butt';line(ctx,[[a.x,a.y],[b.x,b.y]],'#8fc4cb',49);
  for(let x=a.x+25;x<b.x-10;x+=45)line(ctx,[[x-8,a.y-12],[x+1,a.y-3],[x-5,a.y+6],[x+7,a.y+14]],'#eaf8f4',2);
  ctx.fillStyle='#355e62';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('THIN ICE',(a.x+b.x)/2,a.y-31);ctx.restore();
}
function bog(ctx,path,theme){
  if(theme!=='marsh'||path.length!==10)return;const a=path[6],b=path[7];
  ctx.save();ctx.lineCap='butt';line(ctx,[[a.x,a.y],[b.x,b.y]],'#77674f',46);
  for(let x=a.x+15;x<b.x-10;x+=30)line(ctx,[[x-7,a.y-10],[x+2,a.y-8],[x+8,a.y-10]],'#b4a17b',2);
  ctx.fillStyle='#354a36';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('DEEP BOG',(a.x+b.x)/2,a.y-31);ctx.restore();
}
function fieldZone(ctx,path,state,theme){
  if(!state.mapId?.startsWith('g2-')||path.length!==10||!['forest','urban'].includes(theme))return;
  const a=path[2],b=path[3];ctx.save();ctx.lineCap='butt';
  if(theme==='forest'){
    line(ctx,[[a.x,a.y],[b.x,b.y]],'#9f9d72',45);
    for(let x=a.x+18;x<b.x-10;x+=32){line(ctx,[[x-9,a.y-11],[x,a.y-16],[x+9,a.y-11]],'#536e4a',3);line(ctx,[[x-5,a.y+11],[x+2,a.y+15],[x+10,a.y+10]],'#688254',2);}
  }else if(!state.rubbleCleared){
    line(ctx,[[a.x,a.y],[b.x,b.y]],'#827d72',44);
    for(let x=a.x+18;x<b.x-10;x+=32){shape(ctx,[[x-7,a.y-7],[x-1,a.y-14],[x+8,a.y-9],[x+4,a.y-3]],'#b3aa97','#665f56',1);shape(ctx,[[x+3,a.y+7],[x+8,a.y+3],[x+14,a.y+7],[x+10,a.y+12]],'#ada48f','#665f56',1);}
  }else{line(ctx,[[a.x,a.y],[b.x,b.y]],'#b3aa98',44);}
  ctx.fillStyle='#344a35';ctx.font='bold 11px Georgia';ctx.textAlign='center';
  const label=theme==='forest'?'AMBUSH TRAIL':state.rubbleCleared?'RUBBLE CLEARED':`RUBBLE ${Math.max(0,Math.ceil(200-(state.rubbleDamage||0)))}`;
  ctx.fillText(label,(a.x+b.x)/2,a.y-31);ctx.restore();
}
function brokenIce(ctx,path,state,theme){
  if(theme!=='arctic'||!state.iceBroken||path.length!==10)return;const a=path[4],b=path[5];
  ctx.save();ctx.lineCap='butt';line(ctx,[[a.x,a.y],[b.x,b.y]],'#648f9b',33);
  for(let x=a.x+18;x<b.x-10;x+=32)line(ctx,[[x-12,a.y-18],[x,a.y-5],[x-6,a.y+6],[x+12,a.y+17]],'#d9f5ef',3);
  ctx.fillStyle='#244b52';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('BROKEN ICE',(a.x+b.x)/2,a.y+37);ctx.restore();
}
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
  oval(ctx,909,430,53,15,'#273e30',null);shape(ctx,[[858,414],[870,405],[877,409],[869,422],[856,424]],'#7b8269');shape(ctx,[[949,406],[960,414],[960,424],[946,421]],'#707c63');
  // Reinforced foundation, cast shadow, roof and the firing slit are deliberately
  // separate shapes so bunker damage remains readable at phone scale.
  shape(ctx,[[866,407],[874,383],[883,372],[934,372],[946,385],[951,407],[946,423],[870,423]],'#586d54');
  shape(ctx,[[875,391],[880,379],[886,374],[933,374],[940,379],[945,391]],'#9ead85');
  line(ctx,[[881,381],[936,381]],'#cad1a3',2);line(ctx,[[884,387],[932,387]],'#536c58',1);for(const x of [886,901,916,931])oval(ctx,x,385,1,1,'#3e5445',null);
  shape(ctx,[[878,391],[940,391],[940,416],[878,416]],'#7f9270');
  shape(ctx,[[885,393],[933,393],[933,402],[885,402]],'#263a30');line(ctx,[[892,397],[925,397]],'#c6c8a0',2);
  for(const x of [881,892,903,914,925,936]){oval(ctx,x,419,6,3,'#b5b795','#3f5343',1);}
  shape(ctx,[[941,400],[948,399],[948,417],[941,417]],'#455b48');
  const artwork=sprite(ctx,'bunker');if(artwork)ctx.drawImage(artwork,855,365,105,62);
  if(plating>0){line(ctx,[[876,407],[940,407]],'#e5c883',3);for(let i=0;i<plating;i++)oval(ctx,887+i*8,412,2,2,'#f4d894',null);}
  if(damage<.7){line(ctx,[[905,402],[901,407],[906,410],[901,417]],'#293a30',2);}
  if(damage<.35){line(ctx,[[928,390],[923,385],[926,379]],'#293a30',3);line(ctx,[[878,405],[884,410],[879,416]],'#293a30',2);oval(ctx,894,384,5,3,'#554d3d',null);}
  ctx.fillStyle='#344231';ctx.font='bold 13px Georgia';ctx.fillText('BUNKER',849,350);
}
function pad(ctx,p,tower,selected,types){
  const x=p.x,y=p.y;oval(ctx,x+2,y+5,26,20,'#465c48',null);oval(ctx,x,y,24,21,tower?'#6e8061':'#8fa77b',selected?'#fff2ad':'#354c3c',selected?4:3);
  oval(ctx,x,y-1,18,15,tower?'#829372':'#a9bd91','#647c5e',1);
  if(!tower){line(ctx,[[x-7,y],[x+7,y]],'#f5efd0',3);line(ctx,[[x,y-7],[x,y+7]],'#f5efd0',3);return;}
  // A different silhouette, barrel and colour for every tower class.
  const c=types[tower.type].color;shape(ctx,[[x-14,y+9],[x-14,y-2],[x-8,y-9],[x+8,y-9],[x+14,y-2],[x+14,y+9]],'#526c54');
  line(ctx,[[x-10,y+7],[x+10,y+7]],'#b9c59a',2);for(const dx of [-10,0,10])oval(ctx,x+dx,y+4,1.4,1.4,'#e6d6a5',null);
  if(tower.type===0){shape(ctx,[[x-9,y-8],[x-6,y-15],[x+6,y-15],[x+10,y-8]],c);line(ctx,[[x+2,y-11],[x+18,y-17]],ink,4);line(ctx,[[x-8,y-4],[x+7,y-4]],'#d5c999',2);}
  if(tower.type===1){oval(ctx,x,y-8,9,6,c);line(ctx,[[x+3,y-9],[x+19,y-18]],ink,7);line(ctx,[[x+4,y-10],[x+18,y-18]],'#d5ad82',3);oval(ctx,x-8,y+1,2,2,'#d5c999',null);}
  if(tower.type===2){shape(ctx,[[x-9,y-9],[x-6,y-15],[x+5,y-15],[x+9,y-9]],c);line(ctx,[[x-4,y-13],[x+3,y-23]],ink,3);line(ctx,[[x+2,y-13],[x+9,y-23]],ink,3);line(ctx,[[x-9,y-5],[x+9,y-5]],'#cee1c2',2);}
  if(tower.type===3){shape(ctx,[[x-8,y-8],[x-5,y-15],[x+5,y-15],[x+8,y-8]],c);line(ctx,[[x+3,y-13],[x+21,y-17]],ink,3);oval(ctx,x-1,y-12,2,2,'#e4ddbd',null);}
  const artwork=sprite(ctx,['mg','cannon','flak','sniper'][tower.type]);if(artwork){ctx.drawImage(artwork,x-24,y-25,48,40);oval(ctx,x-15,y+13,7,7,'#263e30','#f1dfaa',1);ctx.fillStyle='#f6e9c6';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(['M','C','F','S'][tower.type],x-15,y+16);}
  oval(ctx,x+15,y+13,9,9,paper);ctx.fillStyle=ink;ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(String(tower.level),x+15,y+17);ctx.textAlign='start';
}
function soldier(ctx,p,own){
  const x=p.x,y=p.y;oval(ctx,x,y+13,13,5,'#50674e',null);
  // Contrasting uniforms and name outlines keep individual players visible.
  shape(ctx,[[x-8,y+7],[x-7,y-2],[x+6,y-2],[x+9,y+7],[x+7,y+12],[x-7,y+12]],own?'#c9a46f':'#74a7ab');
  shape(ctx,[[x-5,y+1],[x+5,y+1],[x+5,y+8],[x-5,y+8]],own?'#75865d':'#54828a');line(ctx,[[x-5,y+5],[x+5,y+5]],'#e6d6aa',1.5);
  oval(ctx,x,y-6,7,7,'#e8bf92');shape(ctx,[[x-9,y-7],[x-7,y-13],[x+5,y-14],[x+9,y-7]],own?'#6a7651':'#547e85');
  line(ctx,[[x-6,y-8],[x+6,y-8]],'#a6b38c',1.5);line(ctx,[[x+3,y+1],[x+14,y-4]],ink,3);line(ctx,[[x-4,y+11],[x-5,y+15]],ink,3);line(ctx,[[x+5,y+11],[x+6,y+15]],ink,3);
  const artwork=sprite(ctx,'hero');if(artwork){oval(ctx,x,y+12,11,5,own?'#e5c783':'#87c4ce',null);ctx.drawImage(artwork,x-10,y-16,20,30);}
  ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.strokeText(p.name||'HERO',x,y+29);ctx.fillStyle=paper;ctx.fillText(p.name||'HERO',x,y+29);ctx.textAlign='start';
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
  if(e.boss==='bossBomber'){
    shape(ctx,[[x+24,y],[x-4,y-7],[x-15,y-16],[x-13,y-5],[x-24,y+1],[x-8,y+6],[x-16,y+16],[x-5,y+11]],'#879b92');line(ctx,[[x-8,y],[x+8,y]],'#e1c49a',3);oval(ctx,x-4,y-4,4,3,'#d8b77f');
  }else if(e.boss){
    const color=e.boss==='bossIronclad'?'#8a6350':e.boss==='bossJuggernaut'?'#ad7658':'#7d6955';
    shape(ctx,[[x-22,y-8],[x+17,y-8],[x+21,y+9],[x-22,y+9]],color);shape(ctx,[[x-15,y-9],[x-9,y-17],[x+8,y-17],[x+14,y-8]],'#c29773');line(ctx,[[x+6,y-13],[x+26,y-17]],ink,5);
    for(const dx of [-14,-5,5,14])oval(ctx,x+dx,y+8,3,3,'#463e34',null);
    if(e.boss==='bossIronclad')line(ctx,[[x-18,y-3],[x+16,y-3]],'#ead1a0',3);
    if(e.boss==='bossJuggernaut'){line(ctx,[[x-2,y-15],[x-2,y-8]],'#f5ddb5',2);line(ctx,[[x-6,y-11],[x+2,y-11]],'#f5ddb5',2);}
    if(e.boss==='bossCommander'){line(ctx,[[x-13,y-15],[x-13,y-28]],ink,2);shape(ctx,[[x-13,y-28],[x-2,y-26],[x-13,y-21]],'#cf765c');}
  }else if(e.kind==='tank'){shape(ctx,[[x-13,y-6],[x+11,y-6],[x+13,y+7],[x-13,y+7]],'#a36e57');oval(ctx,x,y-7,7,5,'#c39170');line(ctx,[[x+3,y-8],[x+16,y-12]],ink,3);for(const dx of [-8,-2,4,9])oval(ctx,x+dx,y+7,2,2,'#483d32',null);line(ctx,[[x-9,y-2],[x+9,y-2]],'#d7a887',1.5);}
  else if(e.kind==='plane'){shape(ctx,[[x+15,y],[x-5,y-4],[x-11,y-11],[x-10,y-2],[x-15,y+2],[x-5,y+4],[x-10,y+11],[x-4,y+8]],'#9fc5bd');oval(ctx,x-1,y-3,3,2,'#d9e6c5',null);line(ctx,[[x-8,y],[x+8,y]],'#547877',1.5);}
  else {oval(ctx,x,y+3,7,8,e.kind==='runner'?'#e1b86d':'#bc846d');oval(ctx,x,y-6,5,5,'#e1b391');shape(ctx,[[x-6,y-7],[x-4,y-11],[x+4,y-11],[x+6,y-7]],'#725f4a');line(ctx,[[x-4,y+2],[x+4,y+2]],'#f1d0a1',1.5);if(e.kind==='runner')line(ctx,[[x-11,y+3],[x-16,y+3]],'#6d624e',2);}
  if(!e.boss){const name=e.kind==='tank'?'tank':e.kind==='plane'?'plane':e.kind==='infantry'||e.kind==='runner'?'infantry':null;const artwork=name&&sprite(ctx,name);if(artwork){if(name==='tank')ctx.drawImage(artwork,x-17,y-12,34,20);else if(name==='plane')ctx.drawImage(artwork,x-17,y-14,34,27);else ctx.drawImage(artwork,x-8,y-13,16,24);}}
  if(!e.boss&&ENEMY_INTEL[e.kind]){const bx=x+(e.kind==='tank'?18:15),by=y+10;oval(ctx,bx,by,7,7,'#344a3b','#f7e5b5',1);ctx.fillStyle='#fff3d2';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(ENEMY_INTEL[e.kind].symbol,bx,by+3);ctx.textAlign='start';}
  const w=e.boss?52:28;ctx.fillStyle=ink;ctx.fillRect(x-w/2,y-22,w,5);ctx.fillStyle=e.boss?'#eea35f':e.hp/e.maxHp<.3?'#ed9b74':'#dce59c';ctx.fillRect(x-w/2+1,y-21,(w-2)*Math.max(0,Math.min(1,e.hp/e.maxHp)),3);
  if(e.boss){const names={bossIronclad:'IRONCLAD',bossBomber:'DREAD BOMBER',bossJuggernaut:'JUGGERNAUT',bossCommander:'WAR COMMANDER'};ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.strokeText(names[e.boss]||'BOSS',x,y-29);ctx.fillStyle='#ffe1a0';ctx.fillText(names[e.boss]||'BOSS',x,y-29);ctx.textAlign='start';}
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
let groundImage=null, groundReady=false;
function getGroundImage(doc){
  if(!groundImage&&doc?.createElement){groundImage=doc.createElement('img');groundImage.onload=()=>{groundReady=true;};groundImage.src='assets/battlefield-ground.jpg';}
  return groundReady?groundImage:null;
}
function drawTerrain(ctx,path,theme,{paths=[path],width=960,height=540,storyMission=null,pads=[]}={}){
  function paint(target){if(!storyMission||!drawStoryTerrain(target,storyMission,path,pads,width,height)){ground(target,theme,width,height);landmarks(target,theme);}const img=target.canvas?.ownerDocument?getGroundImage(target.canvas.ownerDocument):null;if(img){target.save();target.globalAlpha=['road','forest'].includes(theme)?.48:.16;target.drawImage(img,0,0,width,height);target.restore();}for(const road of paths)drawRoad(target,road,theme);thinIce(target,path,theme);bog(target,path,theme);}
  const doc=ctx.canvas?.ownerDocument;if(!doc?.createElement){paint(ctx);return;}
  getGroundImage(doc);let variants=terrainCache.get(path);if(!variants){variants=new Map();terrainCache.set(path,variants);}const key=`${storyMission?.id||'free'}:${theme}:${width}:${height}:${groundReady?'art':'fallback'}`;let cached=variants.get(key);
  if(!cached){const canvas=doc.createElement('canvas');canvas.width=width;canvas.height=height;const off=canvas.getContext('2d');if(!off){paint(ctx);return;}off.lineCap='round';off.lineJoin='round';paint(off);cached=canvas;variants.set(key,cached);}
  ctx.drawImage(cached,0,0);
}
export function drawCartoonBattle(ctx,state,{path,pads,types,me,getTowerRange,theme='road',shotAge=0,effects=[],reducedMotion=false,paths=[path],width=960,height=540,bunkerPosition={x:900,y:400},storyMission=null,storyStage=null,storyTime=0}){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';drawTerrain(ctx,path,theme,{paths,width,height,storyMission,pads});fieldZone(ctx,path,state,theme);brokenIce(ctx,path,state,theme);if(storyMission){drawStoryAtmosphere(ctx,storyMission,storyTime,reducedMotion,width,height,path,pads);drawStoryObjective(ctx,storyMission,storyStage,storyTime,reducedMotion);}else if(!reducedMotion)ambient(ctx,theme,storyTime,width,height);ctx.save();ctx.translate(bunkerPosition.x-900,bunkerPosition.y-400);bunker(ctx,state);ctx.restore();
  if(!reducedMotion&&state.hp>0&&state.hp/Math.max(1,state.maxHp||100)<.35){const t=Number.isFinite(storyTime)?storyTime:0;ctx.save();ctx.globalAlpha=.28;for(let i=0;i<3;i++){const phase=((t*.3+i/3)%1+1)%1;oval(ctx,bunkerPosition.x+20+Math.sin(t+i)*3,bunkerPosition.y-18-phase*25,3+phase*5,2+phase*3,'#465447',null);}ctx.restore();}
  ctx.fillStyle='#344231';ctx.font='bold 12px Georgia';ctx.fillText('ENEMY ENTRY',15,75);if(paths.length>1)ctx.fillText('ENEMY ENTRY',15,height-75);
  const selected=state.towers.find(t=>t.pad===state.selectedPad);if(selected&&!state.ended){const p=pads[selected.pad];ctx.beginPath();ctx.arc(p.x,p.y,getTowerRange(selected),0,Math.PI*2);ctx.fillStyle='rgba(241,231,177,.16)';ctx.fill();ctx.strokeStyle='#f2e2a3';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);}
  if(!reducedMotion)for(const tower of state.towers){const owner=state.players[tower.ownerId],p=pads[tower.pad];if(p&&owner?.active!==false&&owner?.overdrive>0){ctx.beginPath();ctx.ellipse(p.x,p.y,31,27,0,0,Math.PI*2);ctx.strokeStyle='#fff1a3';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);}}
  pads.forEach((p,i)=>pad(ctx,p,state.towers.find(t=>t.pad===i),state.selectedPad===i,types));
  if(state.wave>0)for(const p of Object.values(state.players))if(p.active!==false){if(p.mobileSupply?.remaining>0){ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,22,0,Math.PI*2);ctx.strokeStyle='#89d9ed';ctx.lineWidth=3;ctx.stroke();ctx.restore();}ctx.save();if(state.running&&!reducedMotion&&(p.target||p.direction?.x||p.direction?.y)){const t=Number.isFinite(storyTime)?storyTime:0;ctx.translate(0,Math.sin(t*7)*1.1);}soldier(ctx,p,p.id===me);ctx.restore();}
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
  if(e.kind==='bunkerHit'){burst(ctx,e.x,e.y,20+18*t,'#f27f59');ctx.fillStyle='#fff1ca';ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.font='bold 16px Georgia';ctx.textAlign='center';ctx.strokeText(e.label||'BUNKER HIT',e.x,e.y-45-15*t);ctx.fillText(e.label||'BUNKER HIT',e.x,e.y-45-15*t);
  }else if(e.kind==='combo'){const palette={'War Hero':'#f6b273','War Machine':'#f39467','War Economy':'#e9d37b','Bunker Guardian':'#b0dc9c','Ghost Operative':'#8acdda'};burst(ctx,e.x,e.y-20,14+15*t,palette[e.label]||'#88e3d3');ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(e.label||'COMBO!',e.x,e.y-43-12*t);
  }else if(e.kind==='assault'){
    const targets=e.targets.length?e.targets:[{x:e.x,y:e.y}];for(const p of targets){burst(ctx,p.x,p.y,12+20*t,'#ef9e68');oval(ctx,p.x,p.y,6+12*t,4+8*t,'#f9dc91',ink,2);}
  }else if(e.kind==='build'||e.kind==='upgrade'){
    burst(ctx,e.x,e.y-12,13+15*t,e.kind==='upgrade'?'#f4d982':'#b8d69d');
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(e.kind==='build'?'BUILT':'UPGRADED',e.x,e.y-38-12*t);
  }else if(e.kind==='engineer'){
    burst(ctx,e.x,e.y-20,12+15*t,'#eed475');ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('OVERDRIVE',e.x,e.y-42-12*t);
  }else if(e.kind==='logistics'){
    const y=e.y-24-12*t;shape(ctx,[[e.x-12,y-9],[e.x+12,y-9],[e.x+12,y+9],[e.x-12,y+9]],'#d7b276');line(ctx,[[e.x-11,y],[e.x+11,y]],ink,2);line(ctx,[[e.x,y-9],[e.x,y+9]],ink,2);ctx.fillStyle=ink;ctx.font='bold 14px Georgia';ctx.textAlign='center';ctx.fillText('+30',e.x,y-15);
  }else if(e.kind==='medic'){
    oval(ctx,e.x,e.y,22+12*t,22+12*t,'#cee6a6',ink,2);shape(ctx,[[e.x-4,e.y-12],[e.x+4,e.y-12],[e.x+4,e.y-4],[e.x+12,e.y-4],[e.x+12,e.y+4],[e.x+4,e.y+4],[e.x+4,e.y+12],[e.x-4,e.y+12],[e.x-4,e.y+4],[e.x-12,e.y+4],[e.x-12,e.y-4],[e.x-4,e.y-4]],'#f1e6c4');
  }else if(e.kind==='recon'){
    for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(e.x,e.y,16+36*t+i*15,0,Math.PI*2);ctx.strokeStyle='#b8e0d1';ctx.lineWidth=4-i;ctx.stroke();}ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('SUPPRESSION',e.x,e.y-35-12*t);
  }
  ctx.restore();
}
