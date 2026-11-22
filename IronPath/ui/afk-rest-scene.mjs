// The picture for the "you were away" card: a soldier taking a break.
//
// It is drawn by the game, with the game's own hand - the same ink outlines,
// the same olive and gold, the same crate and lantern the field is made of. No
// borrowed photograph, no second art style: the card a player sees after half
// an hour away should look like the field they left.
//
// A pose, not a portrait: sitting on an ammo crate, helmet tilted back, rifle
// leaned against the crate within reach, a mug in the hand, the lantern lit and
// the bunker behind. Resting, not defeated - nobody was hit, the soldier simply
// stopped for a moment.
//
// Drawing only. This module touches nothing but the canvas it is given.

const INK='#1d3028',GOLD='#f0d68a',SILVER='#d9dde1';
const SKY_TOP='#16241d',SKY_LOW='#2b3f31',GROUND='#22362a',FAR='#1c2c23';
const CLOTH='#3f5642',CLOTH_DARK='#334736',WOOD='#8a7350',WOOD_DARK='#6d5a3f';
const SKIN='#d9b98c',METAL='#7d8a78',LIGHT='#ffe6a8';

function fill(ctx,color){ctx.fillStyle=color;ctx.fill();}
function stroke(ctx,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function path(ctx,points,close=true){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  if(close)ctx.closePath();
}
function shape(ctx,points,color,lineWidth=2.5){
  path(ctx,points);fill(ctx,color);stroke(ctx,INK,lineWidth);
}
function oval(ctx,x,y,rx,ry,color,lineWidth=2.5){
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  if(color)fill(ctx,color);
  if(lineWidth)stroke(ctx,INK,lineWidth);
}
function line(ctx,points,color,width,cap='round'){
  ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.lineCap=cap;stroke(ctx,color,width);
}
function glow(ctx,x,y,r,inner,outer){
  try{
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    if(!g||typeof g.addColorStop!=='function')return false;
    g.addColorStop(0,inner);g.addColorStop(1,outer);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    return true;
  }catch{return false;}
}
function fade(ctx,y0,y1,top,bottom){
  try{
    const g=ctx.createLinearGradient(0,y0,0,y1);
    if(!g||typeof g.addColorStop!=='function')return false;
    g.addColorStop(0,top);g.addColorStop(1,bottom);
    ctx.fillStyle=g;return true;
  }catch{return false;}
}
function star(ctx,x,y,r,color){
  ctx.beginPath();
  for(let i=0;i<10;i++){
    const a=-Math.PI/2+i*Math.PI/5,d=i%2?r*.45:r;
    const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;
    i?ctx.lineTo(px,py):ctx.moveTo(px,py);
  }
  ctx.closePath();fill(ctx,color);
}

export const AFK_SCENE={width:360,height:180,horizon:118};

export function drawAfkRestScene(canvas,{scale=1,reducedMotion=false}={}){
  const ctx=canvas?.getContext?.('2d');
  if(!ctx||typeof ctx.setTransform!=='function')return false;
  const {width,height,horizon}=AFK_SCENE;
  const ratio=scale>0?scale:1;
  try{
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  }catch{return false;}
  ctx.setTransform(ratio,0,0,ratio,0,0);
  ctx.clearRect(0,0,width,height);
  ctx.lineJoin='round';
  if(!fade(ctx,0,horizon,SKY_TOP,SKY_LOW))fill(ctx,SKY_TOP);
  ctx.fillRect(0,0,width,horizon);
  // A late sky: a few stars, and the field star low over the bunker.
  ctx.save();
  ctx.globalAlpha=.5;
  for(const [x,y,r] of [[42,26,1.6],[78,44,1.2],[128,22,1.4],[196,36,1.1]])oval(ctx,x,y,r,r,GOLD,0);
  ctx.globalAlpha=.32;star(ctx,318,30,9,GOLD);ctx.restore();
  // The far treeline, then the bunker the soldier is resting beside.
  ctx.save();ctx.globalAlpha=.9;fill(ctx,FAR);
  ctx.beginPath();ctx.moveTo(0,horizon);
  for(let x=0;x<=width;x+=30)ctx.lineTo(x,horizon-10-Math.sin(x/47)*7-Math.cos(x/23)*4);
  ctx.lineTo(width,horizon);ctx.closePath();ctx.fill();ctx.restore();
  shape(ctx,[[248,horizon],[250,74],[268,60],[318,60],[334,76],[334,horizon]],'#1a2a21',2.5);
  shape(ctx,[[286,horizon],[286,92],[306,92],[306,horizon]],'#0e1712',2);
  // The ground, with the horizon ruled in ink so the scene has a floor.
  fill(ctx,GROUND);ctx.fillRect(0,horizon,width,height-horizon);
  line(ctx,[[0,horizon],[width,horizon]],INK,2.4,'butt');
  // The lantern on its post: the only warm thing in the picture.
  line(ctx,[[300,horizon],[300,58]],METAL,3);
  if(!glow(ctx,300,66,34,'rgba(255,214,132,.42)','rgba(255,214,132,0)')){
    ctx.save();ctx.globalAlpha=.25;oval(ctx,300,66,24,24,LIGHT,0);ctx.restore();
  }
  shape(ctx,[[292,58],[308,58],[310,74],[290,74]],LIGHT,2);
  line(ctx,[[292,58],[308,58]],INK,2);
  // The crate he sits on: stencilled star, plank lines, a shadow under it.
  oval(ctx,125,142,52,7,'rgba(12,18,14,.35)',0);
  shape(ctx,[[86,102],[166,102],[166,140],[86,140]],WOOD,2.5);
  line(ctx,[[86,114],[166,114],[86,127],[166,127]],WOOD_DARK,1.6,'butt');
  ctx.save();ctx.globalAlpha=.5;star(ctx,126,121,7,'#5f4f36');ctx.restore();
  // The rifle, leaned on the crate - put down, but within reach.
  line(ctx,[[178,136],[150,62]],INK,7);
  line(ctx,[[178,136],[150,62]],METAL,3.4);
  shape(ctx,[[174,140],[186,138],[188,132],[176,133]],WOOD,2);
  // The soldier. One leg forward and bent, one back; the torso leaning into
  // the crate; the helmet tipped back because nobody is shooting.
  line(ctx,[[124,104],[152,110],[154,134]],INK,15);
  line(ctx,[[124,104],[152,110],[154,134]],CLOTH_DARK,10);
  shape(ctx,[[146,134],[164,134],[166,142],[144,142]],'#2a3326',2.2);
  line(ctx,[[120,106],[136,118],[134,136]],INK,14);
  line(ctx,[[120,106],[136,118],[134,136]],CLOTH,9);
  shape(ctx,[[126,136],[146,136],[148,144],[124,144]],'#2a3326',2.2);
  shape(ctx,[[112,100],[132,100],[130,72],[114,72]],CLOTH,2.5);
  // The far arm rests on the crate; the near one holds the mug.
  line(ctx,[[118,80],[104,98],[112,104]],INK,9);
  line(ctx,[[118,80],[104,98],[112,104]],CLOTH,5.4);
  line(ctx,[[128,82],[142,92],[136,100]],INK,9);
  line(ctx,[[128,82],[142,92],[136,100]],CLOTH,5.4);
  oval(ctx,116,60,12,12.5,SKIN);
  ctx.beginPath();ctx.arc(116,58,12.5,Math.PI,Math.PI*2);ctx.closePath();
  fill(ctx,CLOTH_DARK);stroke(ctx,INK,2.4);
  shape(ctx,[[102,58],[130,58],[132,52],[100,52]],CLOTH_DARK,2);
  // A mug in the hand, and - unless motion is reduced - the steam off it.
  shape(ctx,[[131,88],[145,88],[143,100],[133,100]],SILVER,2);
  if(!reducedMotion){
    ctx.save();ctx.globalAlpha=.5;
    for(const offset of [0,5]){
      ctx.beginPath();ctx.moveTo(134+offset,86);
      ctx.quadraticCurveTo(138+offset,80,134+offset,74);
      ctx.quadraticCurveTo(130+offset,68,135+offset,62);
      stroke(ctx,SILVER,1.6);
    }
    ctx.restore();
  }
  // Grass along the front, so the ground is a place and not a rectangle.
  for(const [x,y] of [[24,150],[52,162],[96,172],[186,158],[214,170],[262,152],[330,166]]){
    line(ctx,[[x,y],[x-4,y-9]],'#2f4237',2);
    line(ctx,[[x+2,y],[x+6,y-7]],'#2f4237',2);
  }
  // The frame: a vignette, so the card's own edge is not the horizon.
  if(!glow(ctx,width/2,height/2,Math.max(width,height)*.72,'rgba(9,13,10,0)','rgba(9,13,10,.45)')){
    ctx.save();ctx.globalAlpha=.2;fill(ctx,'#090d0a');ctx.fillRect(0,0,width,height);ctx.restore();
  }
  return true;
}
