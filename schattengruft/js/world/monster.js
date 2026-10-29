const preference=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
const reducedMotion=()=>preference?.matches===true;
export function monsterShape(m){return m.id==='boss'||m.key==='lord'?'lord':m.shape||m.key||'goblin';}
export function drawMonster(c,m,x,y,time=0,showHealth=true){
 const shape=monsterShape(m),color=m.color||'#628d58',wave=reducedMotion()?0:Math.sin(time*4+(Number.isFinite(m.x)?m.x:0)),bone='#d4d7cc';
 c.save();c.translate(x,y);c.lineJoin='round';
 const rect=(x,y,w,h,fill)=>{c.fillStyle=fill;c.fillRect(x,y,w,h);};
 const poly=(points,fill)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle='#0a0d17';c.lineWidth=1;c.stroke();};
 const oval=(x,y,rx,ry,fill)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();};
 const line=(points,color,width=1)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();};
 if(shape==='rat'){
  line([[8,22],[3,24],[2,19+wave]],'#a18783',2);oval(16,21,9,5,color);oval(24,18,5,4,color);oval(22,15,2,2,'#bc9590');rect(25,17,1,1,'#ff9a75');rect(27,19,2,1,'#d0b4a1');rect(12,25,3,2,'#594a49');
 }else if(shape==='bat'){
  poly([[14,15],[3,8+wave*2],[5,19],[10,17],[12,23]],color);poly([[18,15],[29,8-wave*2],[27,19],[22,17],[20,23]],color);
  line([[5,11],[10,15],[12,21]],'#c2a3db');line([[27,11],[22,15],[20,21]],'#c2a3db');oval(16,17,4,7,'#302b48');poly([[12,13],[12,7],[16,12],[20,7],[20,13]],color);rect(14,15,1,1,'#ffb78a');rect(18,15,1,1,'#ffb78a');
 }else if(shape==='slime'){
  oval(16,22,12,6,color);oval(15,18,9,7,color);oval(12,15,3,2,'#d9ffff70');rect(12,20,2,2,'#102a34');rect(19,20,2,2,'#102a34');line([[14,24],[18,24]],'#114a57');
 }else if(shape==='spider'){
  for(let i=0;i<4;i++){const a=9+i*4,d=i%2?wave:-wave;line([[13,17],[6,a+d],[2,a+5+d]],'#8f7967',2);line([[19,17],[26,a-d],[30,a+5-d]],'#8f7967',2);}
  oval(16,15,6,8,color);oval(16,23,4,4,'#32272c');rect(14,21,1,1,'#ff927c');rect(17,21,1,1,'#ff927c');line([[15,10],[17,14],[15,18]],'#c2a58e');
 }else if(shape==='skeleton'){
  poly([[9,15],[23,15],[21,24],[11,24]],'#35424e');oval(16,10,6,5,bone);rect(12,9,3,2,'#151b25');rect(18,9,2,2,'#151b25');rect(14,13,4,2,bone);
  line([[16,16],[16,23]],bone,2);for(let i=0;i<3;i++)line([[12,17+i*2],[20,17+i*2]],bone);
  line([[10,17],[7,22],[5,17]],bone,2);line([[22,17],[25,22],[27,16]],bone,2);line([[13,24],[12,29]],bone,2);line([[19,24],[21,29]],bone,2);rect(26,9,1,13,'#bbcbd4');
 }else if(shape==='zombie'){
  poly([[10,14],[22,13],[24,25],[9,25]],'#4d4b3f');rect(11,6,11,9,color);rect(11,7,3,3,'#8b7561');rect(13,10,2,1,'#d0d7a0');rect(19,10,2,1,'#d0d7a0');line([[13,13],[19,13]],'#2c3325');
  line([[10,16],[5,18+wave]],color,3);line([[22,16],[27,15-wave]],color,3);rect(11,25,4,4,'#343432');rect(19,24,4,5,'#343432');
 }else if(shape==='wraith'){
  poly([[16,5],[23,13],[25,28],[20,25],[16,29],[12,25],[7,28],[9,13]],'#25283e');poly([[16,7],[21,14],[19,19],[13,19],[11,14]],color);rect(12,13,8,5,'#0c1125');rect(13,14,2,1,'#a6e9ed');rect(18,14,2,1,'#a6e9ed');line([[12,21],[16,25],[20,21]],'#768bb1');
 }else if(shape==='golem'){
  poly([[8,12],[24,12],[25,25],[7,25]],color);rect(11,5,10,8,'#98a6a6');rect(12,9,3,2,'#132b37');rect(18,9,2,2,'#132b37');rect(3,14,5,11,color);rect(25,14,5,11,color);rect(9,25,5,4,'#435966');rect(19,25,5,4,'#435966');
  line([[16,14],[13,19],[19,19],[16,23]],'#a1eeeb',2);line([[9,16],[11,20],[9,23]],'#344b58');
 }else if(shape==='lord'){
  poly([[9,12],[23,12],[28,29],[20,27],[16,30],[11,27],[4,29]],'#33233f');poly([[12,14],[20,14],[22,27],[10,27]],'#76518a');oval(16,10,5,5,'#a4adb7');rect(12,9,3,2,'#eac3ff');rect(18,9,2,2,'#eac3ff');
  poly([[10,7],[9,3],[13,5],[16,2],[19,5],[23,3],[22,7]],'#d1b46f');rect(15,4,2,2,'#e6a0dd');line([[16,16],[16,25]],'#c8b074',2);rect(27,10,2,19,'#9683ac');oval(28,8,3,3,'#bf9bdf');
 }else if(shape==='demon'||shape==='imp'){
  const big=shape==='demon';poly(big?[[11,14],[3,10],[5,25],[12,22]]:[[12,15],[5,12],[8,22]],'#582e39');poly(big?[[21,14],[29,10],[27,25],[20,22]]:[[20,15],[27,12],[24,22]],'#582e39');
  poly([[11,13],[21,13],[23,25],[9,25]],color);oval(16,10,6,5,color);poly([[10,8],[8,3],[14,6]],'#c9af91');poly([[18,6],[24,3],[22,8]],'#c9af91');rect(12,9,3,1,'#ffe0a0');rect(18,9,3,1,'#ffe0a0');rect(11,25,4,4,'#3b2830');rect(18,25,4,4,'#3b2830');line([[21,24],[27,27],[29,22+wave]],color,2);
 }else{
  poly([[11,16],[21,16],[23,26],[9,26]],'#514634');poly([[10,8],[22,8],[24,13],[20,17],[12,17],[8,13]],color);poly([[10,10],[4,8],[9,15]],color);poly([[22,10],[28,8],[23,15]],color);rect(12,11,2,1,'#efdaa0');rect(18,11,2,1,'#efdaa0');rect(14,15,5,1,'#243425');rect(10,26,4,3,'#302b28');rect(19,26,4,3,'#302b28');rect(25,16,2,12,'#8c704f');oval(26,15,3,4,'#655a4b');
 }
 if(m.elite===true){poly([[5,5],[8,8],[5,11],[2,8]],'#e4bf73');}
 const ratio=Number.isFinite(m.hp)&&Number.isFinite(m.maxHp)&&m.maxHp>0?Math.max(0,Math.min(1,m.hp/m.maxHp)):0;
 if(showHealth){rect(4,0,24,3,'#320e19');rect(4,0,24*ratio,3,'#d86260');}
 c.restore();
}
export function drawMonsterPortrait(c,m){
 c.clearRect(0,0,112,112);c.save();
 try{c.imageSmoothingEnabled=false;c.translate(8,8);c.scale(3,3);drawMonster(c,m,0,0,0,false);}finally{c.restore();}
}
