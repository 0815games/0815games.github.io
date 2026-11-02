// Drawing only: the simulation, coordinates and hit areas stay unchanged.
const ink='#29352c',paper='#f1e7c4';
function line(ctx,points,color=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function shape(ctx,points,fill,stroke=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
function oval(ctx,x,y,rx,ry,fill,stroke=ink,width=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function ground(ctx){
  ctx.fillStyle='#8b9d6c';ctx.fillRect(0,0,960,540);
  // Fixed decorative marks, never random on redraw, so nothing flickers.
  for(let i=0;i<64;i++){let x=(i*137+37)%960,y=(i*89+19)%540;ctx.strokeStyle=i%3?'#718759':'#b4bc88';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y-5);ctx.moveTo(x+7,y+1);ctx.lineTo(x+10,y-3);ctx.stroke();}
  for(const [x,y] of [[70,50],[330,65],[575,65],[850,75],[65,465],[420,470],[565,470],[935,260]]){
    oval(ctx,x,y,16,6,'#71875b',null);line(ctx,[[x-8,y],[x-10,y-6],[x-5,y-10]],'#506744',2);line(ctx,[[x,y],[x+2,y-9],[x+6,y-12]],'#506744',2);line(ctx,[[x+7,y],[x+10,y-6]],'#506744',2);
  }
}
function drawRoad(ctx,path){
  ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#4b503d';ctx.lineWidth=73;ctx.stroke();ctx.strokeStyle='#b19a70';ctx.lineWidth=65;ctx.stroke();ctx.strokeStyle='#cbb58a';ctx.lineWidth=55;ctx.stroke();
  ctx.strokeStyle='#a38d69';ctx.lineWidth=1.5;ctx.setLineDash([8,18]);ctx.stroke();ctx.setLineDash([]);
  for(const [x,y] of [[50,119],[160,140],[206,220],[230,328],[350,311],[480,250],[600,157],[709,278],[775,409]]){line(ctx,[[x-7,y+8],[x-2,y+7],[x+2,y+9]],'#ac986f',2);line(ctx,[[x+6,y-7],[x+11,y-8]],'#a08a66',2);}
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
function enemy(ctx,e){
  const x=e.x,y=e.y;oval(ctx,x,y+10,11,4,'#8c8264',null);
  if(e.kind==='tank'){shape(ctx,[[x-13,y-6],[x+11,y-6],[x+13,y+7],[x-13,y+7]],'#a36e57');oval(ctx,x,y-7,7,5,'#c39170');line(ctx,[[x+3,y-8],[x+16,y-12]],ink,3);}
  else if(e.kind==='plane'){shape(ctx,[[x+15,y],[x-5,y-4],[x-11,y-11],[x-10,y-2],[x-15,y+2],[x-5,y+4],[x-10,y+11],[x-4,y+8]],'#9fc5bd');}
  else {oval(ctx,x,y+3,7,8,e.kind==='runner'?'#e1b86d':'#bc846d');oval(ctx,x,y-6,5,5,'#e1b391');shape(ctx,[[x-6,y-7],[x-4,y-11],[x+4,y-11],[x+6,y-7]],'#725f4a');if(e.kind==='runner')line(ctx,[[x-11,y+3],[x-16,y+3]],'#6d624e',2);}
  ctx.fillStyle=ink;ctx.fillRect(x-14,y-22,28,5);ctx.fillStyle='#d4df88';ctx.fillRect(x-13,y-21,26*Math.max(0,Math.min(1,e.hp/e.maxHp)),3);
}
export function drawCartoonBattle(ctx,state,{path,pads,types,me,getTowerRange,shotAge=0,effects=[],reducedMotion=false}){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ground(ctx);drawRoad(ctx,path);bunker(ctx,state);
  ctx.fillStyle='#344231';ctx.font='bold 12px Georgia';ctx.fillText('ENEMY ENTRY',15,75);
  const selected=state.towers.find(t=>t.pad===state.selectedPad);if(selected&&!state.ended){const p=pads[selected.pad];ctx.beginPath();ctx.arc(p.x,p.y,getTowerRange(selected),0,Math.PI*2);ctx.fillStyle='rgba(241,231,177,.16)';ctx.fill();ctx.strokeStyle='#f2e2a3';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);}
  if(!reducedMotion)for(const tower of state.towers){const owner=state.players[tower.ownerId],p=pads[tower.pad];if(p&&owner?.active!==false&&owner?.overdrive>0){ctx.beginPath();ctx.ellipse(p.x,p.y,31,27,0,0,Math.PI*2);ctx.strokeStyle='#fff1a3';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);}}
  pads.forEach((p,i)=>pad(ctx,p,state.towers.find(t=>t.pad===i),state.selectedPad===i,types));
  if(state.wave>0)for(const p of Object.values(state.players))if(p.active!==false)soldier(ctx,p,p.id===me);
  for(const e of state.enemies)enemy(ctx,e);
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
