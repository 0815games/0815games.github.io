import { state } from '../core/state.js';
import { drawCharacter } from './character.js';
import { drawMonster as drawMonsterSprite } from './monster.js';
import { installWallDecor } from './wall-decor.js';
const THEMES={katakomben:['#141722','#10121a','#1c202c','#2e364a','#271b23','#392734','#05060a'],pilzwald:['#10241a','#0d1d16','#173024','#224634','#1f4030','#2f5c44','#040a07'],frostgruft:['#101a26','#0d1620','#1b2c3d','#2c455c','#24455c','#356a8a','#04070c'],feuershrein:['#241a14','#1d1410','#38160f','#5c241a','#4a1a10','#7a2c18','#0a0403'],schattenarena:['#131320','#0f0f1a','#232338','#383858','#2e2e48','#454569','#04040a']};
export class Renderer{
 constructor(id){this.cv=document.getElementById(id);this.ctx=this.cv.getContext('2d');this.tile=32;this.camera={x:0,y:0};this.particles=[];this.texts=[];this.waves=[];this.flashEffect=null;this.loop();}
 text(txt,x,y,c='#ffd54f',size=12,life=1.2){
  this.texts.push({txt,x:x*this.tile+16,y:y*this.tile,c,a:1,size,life,maxLife:life});
 }
 flash(color='#ffd54f',strength=.55,duration=.5){
  this.flashEffect={color,strength,duration,elapsed:0};
 }
 shockwave(x,y,color='#ffd54f'){
  this.waves.push({x:x*this.tile+16,y:y*this.tile+16,r:8,a:.9,color});
 }
 celebrate(x,y,{particles=110,colors=['#ffd54f','#ffca28','#ff9800','#fff8e1'],text='REICHTUM!'}={}){
  this.flash('#ffe082',.65,.65);
  this.shockwave(x,y,'#ffd54f');
  for(let i=0;i<particles;i++){
   const a=Math.random()*Math.PI*2,s=70+Math.random()*190;
   this.particles.push({
    x:x*this.tile+16,y:y*this.tile+16,
    vx:Math.cos(a)*s,vy:Math.sin(a)*s-90,
    a:1,c:colors[i%colors.length],
    size:2+Math.random()*3,gravity:65+Math.random()*45
   });
  }
  this.text(text,x,y,'#ffd54f',30,1.6);
 }
 burst(x,y){for(let i=0;i<24;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*80;this.particles.push({x:x*this.tile+16,y:y*this.tile+16,vx:Math.cos(a)*s,vy:Math.sin(a)*s-25,a:1,c:i%2?'#ffca28':'#ff9800'});}}
 loop(){let last=performance.now();const frame=t=>{const dt=Math.min(.05,(t-last)/1000);last=t;this.update(dt);this.draw();requestAnimationFrame(frame);};requestAnimationFrame(frame);}
 update(dt){
  this.texts=this.texts.filter(t=>{
   t.y-=34*dt;t.a-=dt/(t.maxLife||1.2);return t.a>0;
  });
  this.particles=this.particles.filter(p=>{
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   p.vy+=(p.gravity??80)*dt;
   p.vx*=1-1.4*dt;p.vy*=1-.25*dt;
   p.a-=dt*1.05;
   return p.a>0;
  });
  this.waves=(this.waves||[]).filter(w=>{
   w.r+=260*dt;w.a-=dt*1.6;return w.a>0;
  });
  if(this.flashEffect){
   this.flashEffect.elapsed+=dt;
   if(this.flashEffect.elapsed>=this.flashEffect.duration)this.flashEffect=null;
  }
 }
 getTheme(){const a=THEMES[state.world.theme]||THEMES.katakomben;return{floorA:a[0],floorB:a[1],wall:a[2],wallLine:a[3],accent:a[4],accentLine:a[5],fog:a[6]};}
 updateCamera(cols,rows){const t=this.tile,w=this.cv.width,h=this.cv.height,ww=cols*t,wh=rows*t,px=(Number.isFinite(state.player.x)?state.player.x:2)*t+t/2,py=(Number.isFinite(state.player.y)?state.player.y:2)*t+t/2;this.camera.x=ww>w?Math.max(0,Math.min(px-w/2,ww-w)):(ww-w)/2;this.camera.y=wh>h?Math.max(0,Math.min(py-h/2,wh-h)):(wh-h)/2;}
 screenToTile(clientX,clientY){const r=this.cv.getBoundingClientRect();return{x:Math.floor(((clientX-r.left)*this.cv.width/r.width+this.camera.x)/this.tile),y:Math.floor(((clientY-r.top)*this.cv.height/r.height+this.camera.y)/this.tile)};}
 drawMonster(c,m,x,y){drawMonsterSprite(c,m,x,y,this._visualTime||0);}
 draw(){
  const c=this.ctx,t=this.tile,w=state.world;if(!w.tiles?.length)return;
  const cols=w.cols||20,rows=w.rows||15,theme=this.getTheme();this.updateCamera(cols,rows);
  c.clearRect(0,0,this.cv.width,this.cv.height);c.fillStyle=theme.fog;c.fillRect(0,0,this.cv.width,this.cv.height);c.save();c.translate(-this.camera.x,-this.camera.y);
  const rect=(x,y,ww,hh,color)=>{c.fillStyle=color;c.fillRect(x,y,ww,hh);};
  for(let y=Math.max(0,Math.floor(this.camera.y/t));y<Math.min(rows,Math.ceil((this.camera.y+this.cv.width*0+this.cv.height)/t));y++)for(let x=Math.max(0,Math.floor(this.camera.x/t));x<Math.min(cols,Math.ceil((this.camera.x+this.cv.width)/t));x++){
   const sx=x*t,sy=y*t;if(!w.discovered?.[y]?.[x]){rect(sx,sy,t,t,'#06070a');continue;}
   const tile=w.tiles[y]?.[x]||0;rect(sx,sy,t,t,tile===1?theme.wall:tile===2?theme.accent:(x+y)%2?theme.floorA:theme.floorB);
   if(tile===2)rect(sx+3,sy+3,t-6,t-6,theme.accentLine);else{c.strokeStyle=tile===1?theme.wallLine:'#ffffff07';c.strokeRect(sx+1,sy+1,t-2,t-2);}
  }
  this.drawWallDecor();
  if(w.stairs&&w.discovered?.[w.stairs.y]?.[w.stairs.x]){const x=w.stairs.x*t,y=w.stairs.y*t;rect(x+6,y+6,20,20,'#c99c42');rect(x+9,y+9,14,14,'#0a0c10');c.fillStyle='#ffd54f';c.font='11px serif';c.fillText('⬇️',x+10,y+21);}
  for(const ch of w.chests||[]){if(!w.discovered?.[ch.y]?.[ch.x])continue;const x=ch.x*t,y=ch.y*t;if(ch.open){rect(x+6,y+12,20,12,'#5d4037');rect(x+4,y+8,24,5,'#8d6e63');rect(x+10,y+13,12,3,'#ffe082');}else{rect(x+6,y+8,20,16,'#ffb300');rect(x+13,y+13,6,6,'#212121');}}
  for(const m of w.monsters||[]){if(!w.discovered?.[m.y]?.[m.x])continue;this.drawMonster(c,m,m.x*t,m.y*t);}
  const px=(Number.isFinite(state.player.x)?state.player.x:2)*t,py=(Number.isFinite(state.player.y)?state.player.y:2)*t;
  const glow=c.createRadialGradient(px+16,py+16,8,px+16,py+16,55);glow.addColorStop(0,'#ffb30044');glow.addColorStop(1,'#00000000');c.fillStyle=glow;c.fillRect(px-45,py-45,122,122);
  drawCharacter(c,state.player,px,py,t);
  for(const w of this.waves||[]){
  c.globalAlpha=Math.max(0,w.a);
  c.strokeStyle=w.color;c.lineWidth=4;
  c.beginPath();c.arc(w.x,w.y,w.r,0,Math.PI*2);c.stroke();
 }
 for(const p of this.particles){
  c.globalAlpha=Math.max(0,p.a);
  const size=p.size||3;
  c.shadowColor=p.c;c.shadowBlur=12;
  rect(p.x-size/2,p.y-size/2,size,size,p.c);
  c.shadowBlur=0;
 }
  for(const tx of this.texts){
  c.globalAlpha=Math.max(0,tx.a);
  c.fillStyle=tx.c;
  c.font=`bold ${tx.size||12}px serif`;
  c.shadowColor='#000';c.shadowBlur=10;
  c.textAlign='center';
  c.fillText(tx.txt,tx.x,tx.y);
  c.textAlign='left';c.shadowBlur=0;
 }
  c.restore();
  if(this.flashEffect){
   const f=this.flashEffect;
   const progress=f.elapsed/f.duration;
   c.globalAlpha=f.strength*(1-progress);
   c.fillStyle=f.color;
   c.fillRect(0,0,this.cv.width,this.cv.height);
   c.globalAlpha=1;
  }
 }
}
installWallDecor(Renderer,state);
