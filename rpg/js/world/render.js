import { state } from '../core/state.js';
import { drawCharacter } from './character.js';
const THEMES={katakomben:['#141722','#10121a','#1c202c','#2e364a','#271b23','#392734','#05060a'],pilzwald:['#10241a','#0d1d16','#173024','#224634','#1f4030','#2f5c44','#040a07'],frostgruft:['#101a26','#0d1620','#1b2c3d','#2c455c','#24455c','#356a8a','#04070c'],feuershrein:['#241a14','#1d1410','#38160f','#5c241a','#4a1a10','#7a2c18','#0a0403'],schattenarena:['#131320','#0f0f1a','#232338','#383858','#2e2e48','#454569','#04040a']};
export class Renderer{
 constructor(id){this.cv=document.getElementById(id);this.ctx=this.cv.getContext('2d');this.tile=32;this.camera={x:0,y:0};this.particles=[];this.texts=[];this.loop();}
 text(txt,x,y,c='#ffd54f'){this.texts.push({txt,x:x*this.tile+16,y:y*this.tile,c,a:1});}
 burst(x,y){for(let i=0;i<24;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*80;this.particles.push({x:x*this.tile+16,y:y*this.tile+16,vx:Math.cos(a)*s,vy:Math.sin(a)*s-25,a:1,c:i%2?'#ffca28':'#ff9800'});}}
 loop(){let last=performance.now();const frame=t=>{const dt=Math.min(.05,(t-last)/1000);last=t;this.update(dt);this.draw();requestAnimationFrame(frame);};requestAnimationFrame(frame);}
 update(dt){this.texts=this.texts.filter(t=>{t.y-=25*dt;t.a-=dt*.9;return t.a>0;});this.particles=this.particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;p.a-=dt*1.2;return p.a>0;});}
 getTheme(){const a=THEMES[state.world.theme]||THEMES.katakomben;return{floorA:a[0],floorB:a[1],wall:a[2],wallLine:a[3],accent:a[4],accentLine:a[5],fog:a[6]};}
 updateCamera(cols,rows){const t=this.tile,w=this.cv.width,h=this.cv.height,ww=cols*t,wh=rows*t,px=(Number.isFinite(state.player.x)?state.player.x:2)*t+t/2,py=(Number.isFinite(state.player.y)?state.player.y:2)*t+t/2;this.camera.x=ww>w?Math.max(0,Math.min(px-w/2,ww-w)):(ww-w)/2;this.camera.y=wh>h?Math.max(0,Math.min(py-h/2,wh-h)):(wh-h)/2;}
 screenToTile(clientX,clientY){const r=this.cv.getBoundingClientRect();return{x:Math.floor(((clientX-r.left)*this.cv.width/r.width+this.camera.x)/this.tile),y:Math.floor(((clientY-r.top)*this.cv.height/r.height+this.camera.y)/this.tile)};}
 drawMonster(c,m,x,y){
  const color=m.color||'#e53935',shape=m.shape||'goblin';
  c.fillStyle=color;
  if(shape==='bat'){c.beginPath();c.moveTo(x+16,y+16);c.lineTo(x+4,y+8);c.lineTo(x+10,y+16);c.lineTo(x+4,y+24);c.closePath();c.fill();c.beginPath();c.moveTo(x+16,y+16);c.lineTo(x+28,y+8);c.lineTo(x+22,y+16);c.lineTo(x+28,y+24);c.closePath();c.fill();c.beginPath();c.arc(x+16,y+16,7,0,Math.PI*2);c.fill();}
  else if(shape==='slime'){c.beginPath();c.ellipse(x+16,y+20,12,8,0,0,Math.PI*2);c.fill();c.fillStyle='#ffffff88';c.beginPath();c.arc(x+12,y+17,3,0,Math.PI*2);c.fill();}
  else if(shape==='spider'){c.beginPath();c.arc(x+16,y+16,8,0,Math.PI*2);c.fill();c.strokeStyle=color;c.lineWidth=2;for(let i=-1;i<=1;i++){c.beginPath();c.moveTo(x+16,y+16);c.lineTo(x+16+i*10,y+6);c.stroke();c.beginPath();c.moveTo(x+16,y+16);c.lineTo(x+16+i*10,y+26);c.stroke();}}
  else if(shape==='skeleton'){c.fillStyle='#eceff1';c.beginPath();c.arc(x+16,y+13,7,0,Math.PI*2);c.fill();c.fillStyle='#111';c.fillRect(x+13,y+11,2,2);c.fillRect(x+18,y+11,2,2);c.fillStyle=color;c.fillRect(x+11,y+21,10,8);}
  else if(shape==='zombie'){c.fillStyle=color;c.fillRect(x+10,y+9,12,16);c.fillStyle='#37474f';c.fillRect(x+12,y+13,8,3);}
  else if(shape==='wraith'){c.globalAlpha=.75;c.beginPath();c.moveTo(x+16,y+5);c.quadraticCurveTo(x+28,y+16,x+16,y+28);c.quadraticCurveTo(x+4,y+16,x+16,y+5);c.fill();c.globalAlpha=1;}
  else if(shape==='imp'){c.beginPath();c.arc(x+16,y+15,8,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x+9,y+9);c.lineTo(x+6,y+3);c.lineTo(x+12,y+7);c.closePath();c.fill();c.beginPath();c.moveTo(x+23,y+9);c.lineTo(x+26,y+3);c.lineTo(x+20,y+7);c.closePath();c.fill();}
  else if(shape==='golem'){c.fillStyle=color;c.fillRect(x+7,y+7,18,18);c.fillStyle='#263238';c.fillRect(x+11,y+12,4,4);c.fillRect(x+18,y+12,4,4);}
  else if(shape==='demon'){c.beginPath();c.arc(x+16,y+15,9,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(x+8,y+9);c.lineTo(x+4,y+2);c.lineTo(x+12,y+7);c.closePath();c.fill();c.beginPath();c.moveTo(x+24,y+9);c.lineTo(x+28,y+2);c.lineTo(x+20,y+7);c.closePath();c.fill();}
  else if(shape==='rat'){c.beginPath();c.ellipse(x+16,y+17,10,6,0,0,Math.PI*2);c.fill();c.beginPath();c.arc(x+25,y+15,4,0,Math.PI*2);c.fill();}
  else{c.beginPath();c.arc(x+16,y+16,10,0,Math.PI*2);c.fill();}
  c.fillStyle='#ff1744';c.fillRect(x+13,y+13,2,2);c.fillRect(x+18,y+13,2,2);
  c.fillStyle='#440000';c.fillRect(x+4,y+2,24,3);
  c.fillStyle='#f44336';c.fillRect(x+4,y+2,24*Math.max(0,m.hp/m.maxHp),3);
 }
 draw(){
  const c=this.ctx,t=this.tile,w=state.world;if(!w.tiles?.length)return;
  const cols=w.cols||20,rows=w.rows||15,theme=this.getTheme();this.updateCamera(cols,rows);
  c.clearRect(0,0,this.cv.width,this.cv.height);c.fillStyle=theme.fog;c.fillRect(0,0,this.cv.width,this.cv.height);c.save();c.translate(-this.camera.x,-this.camera.y);
  const rect=(x,y,ww,hh,color)=>{c.fillStyle=color;c.fillRect(x,y,ww,hh);};
  for(let y=Math.max(0,Math.floor(this.camera.y/t));y<Math.min(rows,Math.ceil((this.camera.y+this.cv.height)/t));y++)for(let x=Math.max(0,Math.floor(this.camera.x/t));x<Math.min(cols,Math.ceil((this.camera.x+this.cv.width)/t));x++){
   const sx=x*t,sy=y*t;if(!w.discovered?.[y]?.[x]){rect(sx,sy,t,t,'#06070a');continue;}
   const tile=w.tiles[y]?.[x]||0;rect(sx,sy,t,t,tile===1?theme.wall:tile===2?theme.accent:(x+y)%2?theme.floorA:theme.floorB);
   if(tile===2)rect(sx+3,sy+3,t-6,t-6,theme.accentLine);else{c.strokeStyle=tile===1?theme.wallLine:'#ffffff07';c.strokeRect(sx+1,sy+1,t-2,t-2);}
  }
  if(w.stairs&&w.discovered?.[w.stairs.y]?.[w.stairs.x]){const x=w.stairs.x*t,y=w.stairs.y*t;rect(x+6,y+6,20,20,'#c99c42');rect(x+9,y+9,14,14,'#0a0c10');c.fillStyle='#ffd54f';c.font='11px serif';c.fillText('⬇️',x+10,y+21);}
  for(const ch of w.chests||[]){if(!w.discovered?.[ch.y]?.[ch.x])continue;const x=ch.x*t,y=ch.y*t;if(ch.open){rect(x+6,y+12,20,12,'#5d4037');rect(x+4,y+8,24,5,'#8d6e63');rect(x+10,y+13,12,3,'#ffe082');}else{rect(x+6,y+8,20,16,'#ffb300');rect(x+13,y+13,6,6,'#212121');}}
  for(const m of w.monsters||[]){if(!w.discovered?.[m.y]?.[m.x])continue;this.drawMonster(c,m,m.x*t,m.y*t);}
  const px=(Number.isFinite(state.player.x)?state.player.x:2)*t,py=(Number.isFinite(state.player.y)?state.player.y:2)*t;
  const glow=c.createRadialGradient(px+16,py+16,8,px+16,py+16,55);glow.addColorStop(0,'#ffb30044');glow.addColorStop(1,'#00000000');c.fillStyle=glow;c.fillRect(px-45,py-45,122,122);
  drawCharacter(c,state.player,px,py,t);
  for(const p of this.particles){c.globalAlpha=p.a;rect(p.x,p.y,3,3,p.c);}
  for(const tx of this.texts){c.globalAlpha=tx.a;c.fillStyle=tx.c;c.font='bold 12px serif';c.fillText(tx.txt,tx.x-10,tx.y);}
  c.restore();
 }
}
