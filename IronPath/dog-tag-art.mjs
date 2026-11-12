// The dog tag, drawn from scratch: brushed metal plate, corner hole, chain
// stub, and the soldier's own three lines stamped in a military stencil font -
// name, gender and the day service began.
//
// 100% procedural ON PURPOSE. The photo-based tag (detect the plate inside an
// AI picture, stamp onto it) caused every tag bug reported so far: scene
// remnants around the plate, a load race between fallback and photo, and -
// the one that ended it (reported: "die weiße neue Dog Tag im Hintergrund,
// davor schwebt das alte Bild") - stale frames accumulating on the canvas,
// because a contain-fit crop never clears what it does not cover. There is no
// background to remove because none is ever drawn, and the canvas is cleared
// before every paint. No asset, no detection, no race: draw, stamp, done.
import {translateText as tr} from './language.mjs?v=20261112-live1';

// Bumped whenever the procedural tag changes shape. The diagnostic page
// (version.html) reads this to tell players' devices which tag they get.
export const DOG_TAG_ART_VERSION='procedural1';

const STENCIL='"Black Ops One","Arial Black",Impact,sans-serif';
// The plate fills the frame on its own: no backdrop, just the tag.
const PLATE=Object.freeze({x:.05,y:.12,w:.9,h:.76});

const cache={redraws:new Set(),fontTried:false,fontLoaded:false,fontSupported:undefined};

function notify(){
  for(const redraw of [...cache.redraws]){
    try{redraw();}catch{/* A repaint must never throw into the font load. */}
  }
}

// The stencil font is the only asynchronous ingredient left. Everything else
// renders immediately; when the font arrives, registered screens repaint once.
function ensureFont(document){
  if(cache.fontTried)return;
  cache.fontTried=true;
  try{
    const load=document?.fonts?.load;
    if(typeof load!=='function'){cache.fontSupported=false;return;}
    cache.fontSupported=true;
    load.call(document.fonts,`16px ${STENCIL}`).then(()=>{cache.fontLoaded=true;notify();}).catch(()=>{});
  }catch{cache.fontSupported=false;}
}

// Registers a repaint for the moment the stencil font has arrived (or
// immediately when there is nothing to wait for). Screens that draw the tag
// directly, instead of through renderDogTagArt, should hook this so the
// stamped lines upgrade to the stencil font without an unrelated repaint.
export function onDogTagArtReady(redraw){
  if(typeof redraw!=='function')return ()=>{};
  if(cache.fontLoaded||cache.fontSupported===false){try{redraw();}catch{}return ()=>{};}
  cache.redraws.add(redraw);
  return ()=>{cache.redraws.delete(redraw);};
}

// The three lines the player dictated: name, gender, service start date.
export function tagLines(profile={}){
  const name=String(profile.name||'UNKNOWN').slice(0,24).toUpperCase();
  const gender=profile.gender==='male'?'M':'F';
  let date='—';
  if(typeof profile.enlisted==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(profile.enlisted))
    date=`${profile.enlisted.slice(8,10)}.${profile.enlisted.slice(5,7)}.${profile.enlisted.slice(0,4)}`;
  return {name,gender,date};
}

// Stamps one line in the embossed stencil look: dark imprint, thin light
// edge underneath, like a machine hit the plate. The line is SHRUNK TO ITS
// MEASURED WIDTH - names must never run past the tag, so the font size
// yields to the plate, never the other way around.
function stampLine(ctx,text,x,y,px,maxWidth){
  if(Number.isFinite(maxWidth)&&maxWidth>0){
    let width=Number.NaN;
    try{
      ctx.font=`${px}px ${STENCIL}`;
      try{ctx.letterSpacing=Math.round(px*0.08)+'px';}catch{/* Older canvases: no spacing. */}
      width=ctx.measureText(text)?.width;
    }catch{/* Recording contexts and old canvases: estimate instead. */}
    if(!Number.isFinite(width)||width<=0)width=text.length*px*0.82;
    if(width>maxWidth)px=Math.max(7,px*maxWidth/width);
  }
  ctx.textAlign='center';ctx.textBaseline='middle';
  try{ctx.letterSpacing=Math.round(px*0.08)+'px';}catch{/* Older canvases: no spacing. */}
  ctx.font=`${px}px ${STENCIL}`;
  ctx.fillStyle='rgba(255,255,255,.34)';
  ctx.fillText(text,x,y+Math.max(1,px*0.05));
  ctx.fillStyle='#23231f';
  ctx.fillText(text,x,y);
  try{ctx.letterSpacing='0px';}catch{}
  return px;
}

// The tag itself: brushed metal with a soft diagonal sheen, rounded corners,
// a corner hole with the chain stub leading off-frame. Returns the plate
// rectangle in canvas pixels so the stamp lands on the metal and nowhere else.
export function drawTagPlate(ctx,size){
  const plate={x:size*PLATE.x,y:size*PLATE.y,w:size*PLATE.w,h:size*PLATE.h};
  ctx.strokeStyle='#8f948b';ctx.lineWidth=Math.max(2,size*0.012);
  ctx.beginPath();ctx.moveTo(size/2,0);ctx.lineTo(plate.x+plate.w*0.14,plate.y+plate.h*.5);ctx.stroke();
  const grad=typeof ctx.createLinearGradient==='function'?ctx.createLinearGradient(plate.x,plate.y,plate.x+plate.w,plate.y+plate.h):null;
  if(grad){grad.addColorStop(0,'#b9bdc0');grad.addColorStop(.5,'#cfd3d6');grad.addColorStop(1,'#a9adb0');ctx.fillStyle=grad;}
  else ctx.fillStyle='#c6cacc';
  const r=plate.h*0.18;
  ctx.beginPath();
  ctx.roundRect?ctx.roundRect(plate.x,plate.y,plate.w,plate.h,r):ctx.rect(plate.x,plate.y,plate.w,plate.h);
  ctx.fill();
  // A faint rim along the top edge reads as stamped metal, not a flat rectangle.
  if(typeof ctx.createLinearGradient==='function'){
    ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=Math.max(1,size*0.006);
    ctx.beginPath();ctx.moveTo(plate.x+r,plate.y+ctx.lineWidth);ctx.lineTo(plate.x+plate.w-r,plate.y+ctx.lineWidth);ctx.stroke();
    ctx.strokeStyle='rgba(20,22,18,.35)';
    ctx.beginPath();ctx.moveTo(plate.x+r,plate.y+plate.h-ctx.lineWidth);ctx.lineTo(plate.x+plate.w-r,plate.y+plate.h-ctx.lineWidth);ctx.stroke();
  }
  ctx.beginPath();ctx.arc(plate.x+plate.w*0.14,plate.y+plate.h/2,Math.max(2,plate.h*0.07),0,Math.PI*2);
  ctx.fillStyle='#23231f';ctx.fill();
  return plate;
}

// Draws the whole tag into a square canvas of `size` pixels. Returns the
// stamped lines (also used for the accessible label).
export function drawDogTagArt(ctx,size,data={},options={}){
  if(!ctx||!Number.isFinite(size)||size<=0)return null;
  const lines=tagLines(data.profile||{});
  ensureFont(ctx.canvas?.ownerDocument??(typeof document!=='undefined'?document:null));
  ctx.save();
  // Always start from a clean plate: a canvas accumulates frames, and a
  // contain-fit layout never covers what it does not draw.
  ctx.clearRect(0,0,size,size);
  const box=drawTagPlate(ctx,size);
  // Name first and largest; gender and date follow its (possibly shrunk)
  // size so a long name compresses the whole stamp block, never overflows.
  const namePx=stampLine(ctx,lines.name,box.x+box.w/2,box.y+box.h*0.32,box.h*0.3,box.w*0.9);
  stampLine(ctx,lines.gender,box.x+box.w/2,box.y+box.h*0.58,Math.max(9,namePx*0.62),box.w*0.9);
  stampLine(ctx,lines.date,box.x+box.w/2,box.y+box.h*0.8,Math.max(9,namePx*0.52),box.w*0.9);
  ctx.restore();
  return lines;
}

// Mounts the tag as a labelled canvas inside a container, and repaints it
// once the stencil font has finished loading.
export function renderDogTagArt(document,container,data={},options={}){
  if(!container||typeof document?.createElement!=='function')return null;
  const size=Math.max(60,Number(options.size)||180);
  const canvas=document.createElement('canvas');
  canvas.className='dog-tag-art';
  canvas.setAttribute('role','img');
  const paint=()=>{
    const ratio=Math.min(2,Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1));
    const px=Math.round(size*ratio);
    if(canvas.width!==px){canvas.width=px;canvas.height=px;}
    canvas.style.width=size+'px';canvas.style.height=size+'px';
    const lines=drawDogTagArt(canvas.getContext&&canvas.getContext('2d'),px,data,options);
    if(lines)canvas.setAttribute('aria-label',`${tr('Your dog tag')}: ${lines.name} · ${lines.gender} · ${lines.date}`);
  };
  paint();
  const redraw=()=>{if(canvas.isConnected)paint();};
  cache.redraws.add(redraw);
  container.replaceChildren(canvas);
  return canvas;
}
