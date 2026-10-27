import {drawDungeonWorld,worldFrameInterval} from './dungeon-world.js';
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
  this.waves.push({x:x*this.tile+16,y:y*this.tile+16,r:10,a:1,color});
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
 loop(){
  let last=performance.now(),drawn=-Infinity;
  const frame=time=>{
   requestAnimationFrame(frame);
   if(document.hidden||
    document.getElementById('game')?.classList.contains('hidden')){
    last=time;
    return;
   }
   if(time-drawn<worldFrameInterval())return;
   const dt=Math.min(.1,Math.max(0,(time-last)/1000));
   last=drawn=time;
   this._visualTime=time/1000;
   this.update(dt);
   this.draw();
  };
  requestAnimationFrame(frame);
 }

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
   w.r+=340*dt;w.a-=dt*1.1;return w.a>0;
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
 draw(){drawDungeonWorld(this,state.world,state.player,drawCharacter);}

}
installWallDecor(Renderer,state);
