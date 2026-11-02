import {bossPhase} from './boss-mechanics.mjs?v=20261102-boss2';
// Drawing only: the simulation, coordinates and hit areas stay unchanged.
const ink='#29352c',paper='#f1e7c4';
function line(ctx,points,color=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function shape(ctx,points,fill,stroke=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
function oval(ctx,x,y,rx,ry,fill,stroke=ink,width=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function ground(ctx,theme='road'){
  ctx.fillStyle=({forest:'#779463',outpost:'#a69c79',urban:'#989488',scrub:'#b76f51',arctic:'#d8e6e3',marsh:'#788c6b'})[theme]||'#8b9d6c';ctx.fillRect(0,0,960,540);
  // Fixed decorative marks, never random on redraw, so nothing flickers.
  for(let i=0;i<64;i++){let x=(i*137+37)%960,y=(i*89+19)%540;ctx.strokeStyle=theme==='scrub'?'#d79a73':theme==='arctic'?'#adc9cb':theme==='urban'?'#77776d':theme==='marsh'?'#637d69':i%3?'#718759':'#b4bc88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y-5);ctx.moveTo(x+7,y+1);ctx.lineTo(x+10,y-3);ctx.stroke();}
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
  ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#4b503d';ctx.lineWidth=73;ctx.stroke();ctx.strokeStyle=theme==='arctic'?'#a5c2c0':theme==='urban'?'#77766d':theme==='marsh'?'#8e795c':theme==='scrub'?'#bd8765':'#b19a70';ctx.lineWidth=65;ctx.stroke();ctx.strokeStyle=theme==='arctic'?'#c4d9d4':theme==='urban'?'#aaa69a':theme==='marsh'?'#b29b74':theme==='scrub'?'#dda77f':'#cbb58a';ctx.lineWidth=55;ctx.stroke();
  ctx.strokeStyle='#a38d69';ctx.lineWidth=1.5;ctx.setLineDash([8,18]);ctx.stroke();ctx.setLineDash([]);
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
function brokenIce(ctx,path,state,theme){
  if(theme!=='arctic'||!state.iceBroken||path.length!==10)return;const a=path[4],b=path[5];
  ctx.save();ctx.lineCap='butt';line(ctx,[[a.x,a.y],[b.x,b.y]],'#648f9b',33);
  for(let x=a.x+18;x<b.x-10;x+=32)line(ctx,[[x-12,a.y-18],[x,a.y-5],[x-6,a.y+6],[x+12,a.y+17]],'#d9f5ef',3);
  ctx.fillStyle='#244b52';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText('BROKEN ICE',(a.x+b.x)/2,a.y+37);ctx.restore();
}
function bunker(ctx,state){
  const damage=state.hp/Math.max(1,state.maxHp||100),plating=state.plating||0;
  oval(ctx,910,427,43,12,'#71835f',null);
  shape(ctx,[[872,387],[881,373],[936,373],[946,386],[946,420],[872,420]],'#82906a');
  shape(ctx,[[872,387],[882,376],[936,376],[946,387]],'#aab58a');
  shape(ctx,[[884,391],[934,391],[934,403],[884,403]],'#3d4838');
  line(ctx,[[890,397],[928,397]],'#a8b78c',2);
  if(plating>0){line(ctx,[[876,407],[941,407]],'#e4c982',3);for(let i=0;i<plating;i++)oval(ctx,887+i*8,413,2,2,'#e8ce81',null);}
  if(damage<.7){line(ctx,[[905,403],[900,410],[906,412],[901,419]],'#333d30',2);}
  if(damage<.35){line(ctx,[[928,389],[921,384],[925,379]],'#333d30',3);line(ctx,[[878,405],[884,410],[879,416]],'#333d30',2);}
  ctx.fillStyle='#344231';ctx.font='bold 13px Georgia';ctx.fillText('BUNKER',849,350);
}
function pad(ctx,p,tower,selected,types){
  oval(ctx,p.x+1,p.y+4,25,20,'#6e805a',null);oval(ctx,p.x,p.y,24,21,tower?'#7d8960':'#a3b27d',selected?'#fff2ad':'#3c503b',selected?4:3);
  if(!tower){line(ctx,[[p.x-7,p.y],[p.x+7,p.y]],'#edf1cc',3);line(ctx,[[p.x,p.y-7],[p.x,p.y+7]],'#edf1cc',3);return;}
  // Distinct hand-inked silhouettes for the four tower classes.
  const x=p.x,y=p.y,c=types[tower.type].color;
  shape(ctx,[[x-13,y+9],[x-14,y-2],[x-7,y-8],[x+8,y-8],[x+14,y-1],[x+13,y+9]],'#66764e');
  if(tower.type===0){shape(ctx,[[x-8,y-8],[x-6,y-14],[x+6,y-14],[x+9,y-8]],c);line(ctx,[[x+3,y-11],[x+17,y-17]],ink,4);}
  if(tower.type===1){oval(ctx,x,y-7,8,6,c);line(ctx,[[x+3,y-9],[x+17,y-17]],ink,6);line(ctx,[[x+4,y-10],[x+16,y-17]],'#b89167',3);}
  if(tower.type===2){shape(ctx,[[x-9,y-9],[x-6,y-15],[x+5,y-15],[x+9,y-9]],c);line(ctx,[[x-4,y-13],[x+3,y-23]],ink,3);line(ctx,[[x+2,y-13],[x+9,y-23]],ink,3);}
  if(tower.type===3){shape(ctx,[[x-8,y-8],[x-5,y-15],[x+5,y-15],[x+8,y-8]],c);line(ctx,[[x+3,y-13],[x+20,y-17]],ink,3);}
  oval(ctx,x+15,y+13,9,9,paper);ctx.fillStyle=ink;ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(String(tower.level),x+15,y+17);ctx.textAlign='start';
}
function soldier(ctx,p,own){
  const x=p.x,y=p.y;oval(ctx,x,y+12,12,5,'#667853',null);
  shape(ctx,[[x-8,y+7],[x-7,y-2],[x+6,y-2],[x+9,y+7],[x+7,y+12],[x-7,y+12]],own?'#d4af72':'#79aeb9');
  oval(ctx,x,y-6,7,7,'#e8bf92');shape(ctx,[[x-9,y-7],[x-7,y-13],[x+5,y-14],[x+9,y-7]],own?'#6a7651':'#547e85');
  line(ctx,[[x+3,y+1],[x+14,y-4]],ink,3);line(ctx,[[x-4,y+11],[x-5,y+15]],ink,3);line(ctx,[[x+5,y+11],[x+6,y+15]],ink,3);
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
  }else if(e.kind==='tank'){shape(ctx,[[x-13,y-6],[x+11,y-6],[x+13,y+7],[x-13,y+7]],'#a36e57');oval(ctx,x,y-7,7,5,'#c39170');line(ctx,[[x+3,y-8],[x+16,y-12]],ink,3);}
  else if(e.kind==='plane'){shape(ctx,[[x+15,y],[x-5,y-4],[x-11,y-11],[x-10,y-2],[x-15,y+2],[x-5,y+4],[x-10,y+11],[x-4,y+8]],'#9fc5bd');}
  else {oval(ctx,x,y+3,7,8,e.kind==='runner'?'#e1b86d':'#bc846d');oval(ctx,x,y-6,5,5,'#e1b391');shape(ctx,[[x-6,y-7],[x-4,y-11],[x+4,y-11],[x+6,y-7]],'#725f4a');if(e.kind==='runner')line(ctx,[[x-11,y+3],[x-16,y+3]],'#6d624e',2);}
  const w=e.boss?52:28;ctx.fillStyle=ink;ctx.fillRect(x-w/2,y-22,w,5);ctx.fillStyle=e.boss?'#eea35f':'#d4df88';ctx.fillRect(x-w/2+1,y-21,(w-2)*Math.max(0,Math.min(1,e.hp/e.maxHp)),3);
  if(e.boss){const names={bossIronclad:'IRONCLAD',bossBomber:'DREAD BOMBER',bossJuggernaut:'JUGGERNAUT',bossCommander:'WAR COMMANDER'};ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.strokeText(names[e.boss]||'BOSS',x,y-29);ctx.fillStyle='#ffe1a0';ctx.fillText(names[e.boss]||'BOSS',x,y-29);ctx.textAlign='start';}
}
// The road and terrain never change during a match; draw them once per path.
const terrainCache=new WeakMap();
function drawTerrain(ctx,path,theme){
  const doc=ctx.canvas?.ownerDocument;if(!doc?.createElement){ground(ctx,theme);landmarks(ctx,theme);drawRoad(ctx,path,theme);thinIce(ctx,path,theme);bog(ctx,path,theme);return;}
  let cached=terrainCache.get(path);
  if(!cached){const canvas=doc.createElement('canvas');canvas.width=960;canvas.height=540;const off=canvas.getContext('2d');if(!off){ground(ctx,theme);landmarks(ctx,theme);drawRoad(ctx,path,theme);thinIce(ctx,path,theme);bog(ctx,path,theme);return;}off.lineCap='round';off.lineJoin='round';ground(off,theme);landmarks(off,theme);drawRoad(off,path,theme);thinIce(off,path,theme);bog(off,path,theme);cached=canvas;terrainCache.set(path,cached);}
  ctx.drawImage(cached,0,0);
}
export function drawCartoonBattle(ctx,state,{path,pads,types,me,getTowerRange,theme='road',shotAge=0,effects=[],reducedMotion=false}){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';drawTerrain(ctx,path,theme);brokenIce(ctx,path,state,theme);bunker(ctx,state);
  ctx.fillStyle='#344231';ctx.font='bold 12px Georgia';ctx.fillText('ENEMY ENTRY',15,75);
  const selected=state.towers.find(t=>t.pad===state.selectedPad);if(selected&&!state.ended){const p=pads[selected.pad];ctx.beginPath();ctx.arc(p.x,p.y,getTowerRange(selected),0,Math.PI*2);ctx.fillStyle='rgba(241,231,177,.16)';ctx.fill();ctx.strokeStyle='#f2e2a3';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);}
  if(!reducedMotion)for(const tower of state.towers){const owner=state.players[tower.ownerId],p=pads[tower.pad];if(p&&owner?.active!==false&&owner?.overdrive>0){ctx.beginPath();ctx.ellipse(p.x,p.y,31,27,0,0,Math.PI*2);ctx.strokeStyle='#fff1a3';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);}}
  pads.forEach((p,i)=>pad(ctx,p,state.towers.find(t=>t.pad===i),state.selectedPad===i,types));
  if(state.wave>0)for(const p of Object.values(state.players))if(p.active!==false)soldier(ctx,p,p.id===me);
  if(theme==='scrub'&&path.length===10)for(const e of state.enemies)if(e.kind==='tank'&&e.hp>0){
    ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,75,0,Math.PI*2);ctx.fillStyle='rgba(210,168,119,.18)';ctx.fill();ctx.strokeStyle='rgba(133,88,57,.65)';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.stroke();ctx.restore();
  }
  for(const e of state.enemies){
    if(e.boss==='bossBomber'&&bossPhase(e)==='bomb-warning'){
      ctx.save();ctx.strokeStyle='#f2aa78';ctx.lineWidth=3;ctx.setLineDash(reducedMotion?[]:[7,6]);ctx.beginPath();ctx.arc(900,400,36,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(e.boss==='bossBomber'&&e.bossFlash>0&&!reducedMotion)burst(ctx,900,400,20+(1-e.bossFlash)*12,'#ef9e68');
    if(e.boss==='bossJuggernaut'&&e.bossFlash>0&&!reducedMotion)burst(ctx,e.x,e.y-20,15,'#cce7a2');
    enemy(ctx,e,reducedMotion);
  }
  if(!state.ended)for(const s of state.shots)drawShot(ctx,s,shotAge,reducedMotion);
  if(!reducedMotion)for(const effect of effects)drawAbility(ctx,effect);
  ctx.restore();
}

function burst(ctx,x,y,r,fill){
  const points=[];for(let i=0;i<16;i++){const a=Math.PI*i/8,d=i%2?r*.52:r;points.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}shape(ctx,points,fill,ink,2);
}
function drawShot(ctx,s,age,reduced){
  const life=(Number.isFinite(s.life)?s.life:.12)-age;if(life<=0)return;
  const duration=s.duration||.12,progress=1-Math.max(0,Math.min(1,life/duration));
  line(ctx,[[s.x,s.y],[s.tx,s.ty]],ink,4);line(ctx,[[s.x,s.y],[s.tx,s.ty]],s.color||'#ffec9e',2);
  if(reduced)return;
  const scale=s.kind===1?1.35:s.kind===3?.75:1;
  if(progress<.65)burst(ctx,s.x,s.y,(7+(1-progress)*4)*scale,'#ffe39b');
  if(progress>.12)burst(ctx,s.tx,s.ty,(5+progress*8)*scale,s.kind===1?'#e89964':'#f6d787');
}
function drawAbility(ctx,e){
  const t=e.progress,fade=Math.max(0,1-t);ctx.save();ctx.globalAlpha=fade;
  if(e.kind==='assault'){
    const targets=e.targets.length?e.targets:[{x:e.x,y:e.y}];for(const p of targets){burst(ctx,p.x,p.y,12+20*t,'#ef9e68');oval(ctx,p.x,p.y,6+12*t,4+8*t,'#f9dc91',ink,2);}
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
