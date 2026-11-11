// The dog tag as a photograph, not a drawing: a rendered blank tag image with
// the soldier's own three lines stamped on in a military stencil font - name,
// gender and the day service began (reported: "Dog Tag per Canvas sieht
// einfach nur scheiße aus, auch Bild-Rendering und dann die Military-Font
// drauf schreiben").
//
// The plate's position inside the photo is not hardcoded: it is detected from
// the pixels (the largest bright, low-saturation blob) once the image has
// loaded, so a re-rendered photo with a different crop still gets its stamp
// in the right place. Until the photo and the stencil font have arrived, a
// clean fallback plate is drawn and the canvas repaints the moment they land
// - the same "draw now, refine when the image lands" contract the map uses.
import {translateText as tr} from './language.mjs?v=20261112-friendpurge1';

const TAG_ASSET='assets/dog-tag-plate.jpg?v=20261112-avatar2';
const STENCIL='"Black Ops One","Arial Black",Impact,sans-serif';
const FALLBACK_PLATE=Object.freeze({x:.2,y:.34,w:.6,h:.4});

const cache={image:null,ready:false,failed:false,plate:null,redraws:new Set()};

function notify(){
  for(const redraw of [...cache.redraws]){
    try{redraw();}catch{/* A repaint must never throw into the image load. */}
  }
}

// Starts loading the tag photo and the stencil font exactly once.
function loadAssets(document){
  if(cache.image||cache.loading)return;
  const image=typeof document?.createElement==='function'?document.createElement('img'):null;
  if(!image){cache.failed=true;return;}
  cache.loading=true;
  image.onload=()=>{
    cache.image=image;
    cache.plate=detectPlate(image,document)||FALLBACK_PLATE;
    cache.ready=true;
    notify();
  };
  image.onerror=()=>{cache.failed=true;};
  image.src=TAG_ASSET;
  try{
    document.fonts?.load(`16px ${STENCIL}`)?.then(()=>notify())?.catch(()=>{});
  }catch{/* No font API: the stack falls back to Arial Black / Impact. */}
}

// The plate is the largest bright, low-saturation connected region - bigger
// than any chain bead, unlike the beads not part of a thin strand.
function detectPlate(image,document){
  try{
    const w=96,h=96;
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d');
    if(!ctx||!ctx.getImageData)return null;
    ctx.drawImage(image,0,0,w,h);
    const {data}=ctx.getImageData(0,0,w,h);
    const bright=new Uint8Array(w*h);
    for(let i=0,p=0;i<data.length;i+=4,p++){
      const r=data[i],g=data[i+1],b=data[i+2];
      const max=Math.max(r,g,b),min=Math.min(r,g,b);
      if(max>110&&max-min<46)bright[p]=1;
    }
    let best=null;
    const seen=new Uint8Array(w*h);
    for(let p=0;p<w*h;p++){
      if(!bright[p]||seen[p])continue;
      // Flood fill one bright blob, remembering its bounds and size.
      const queue=[p];seen[p]=1;
      let minX=w,minY=h,maxX=0,maxY=0,count=0;
      while(queue.length){
        const q=queue.pop();count++;
        const x=q%w,y=(q-x)/w;
        if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
        const neighbours=[q-1,q+1,q-w,q+w];
        for(const n of neighbours){
          if(n<0||n>=w*h||seen[n]||!bright[n])continue;
          // Left/right neighbours must stay on the same row.
          if((n===q-1&&x===0)||(n===q+1&&x===w-1))continue;
          seen[n]=1;queue.push(n);
        }
      }
      if(!best||count>best.count)best={count,minX,minY,maxX,maxY};
    }
    if(!best||best.count<w*h*0.08)return null;
    return {x:best.minX/w,y:best.minY/h,w:(best.maxX-best.minX+1)/w,h:(best.maxY-best.minY+1)/h};
  }catch{return null;}
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
// edge underneath, like a machine hit the plate.
function stampLine(ctx,text,x,y,px){
  ctx.textAlign='center';ctx.textBaseline='middle';
  try{ctx.letterSpacing=Math.round(px*0.08)+'px';}catch{/* Older canvases: no spacing. */}
  ctx.font=`${px}px ${STENCIL}`;
  ctx.fillStyle='rgba(255,255,255,.34)';
  ctx.fillText(text,x,y+Math.max(1,px*0.05));
  ctx.fillStyle='#23231f';
  ctx.fillText(text,x,y);
  try{ctx.letterSpacing='0px';}catch{}
}

function drawCover(ctx,size,image){
  const ratio=Math.max(size/image.width,size/image.height);
  const w=image.width*ratio,h=image.height*ratio;
  ctx.drawImage(image,(size-w)/2,(size-h)/2,w,h);
}

// The interim plate: plain brushed metal, corner hole, short chain stub - a
// clean placeholder until the photo asset lands, never the final look.
function drawFallbackPlate(ctx,size){
  const plate={x:size*FALLBACK_PLATE.x,y:size*FALLBACK_PLATE.y,w:size*FALLBACK_PLATE.w,h:size*FALLBACK_PLATE.h};
  ctx.fillStyle='#2c2418';
  ctx.fillRect(0,0,size,size);
  ctx.strokeStyle='#8f948b';ctx.lineWidth=Math.max(2,size*0.012);
  ctx.beginPath();ctx.moveTo(size/2,0);ctx.lineTo(plate.x+plate.w*0.32,plate.y+6);ctx.stroke();
  const grad=typeof ctx.createLinearGradient==='function'?ctx.createLinearGradient(plate.x,plate.y,plate.x+plate.w,plate.y+plate.h):null;
  if(grad){grad.addColorStop(0,'#b9bdc0');grad.addColorStop(.5,'#cfd3d6');grad.addColorStop(1,'#a9adb0');ctx.fillStyle=grad;}
  else ctx.fillStyle='#c6cacc';
  const r=plate.h*0.18;
  ctx.beginPath();
  ctx.roundRect?ctx.roundRect(plate.x,plate.y,plate.w,plate.h,r):ctx.rect(plate.x,plate.y,plate.w,plate.h);
  ctx.fill();
  ctx.beginPath();ctx.arc(plate.x+plate.w*0.14,plate.y+plate.h/2,Math.max(2,plate.h*0.07),0,Math.PI*2);
  ctx.fillStyle='#2c2418';ctx.fill();
}

// Draws the whole tag into a square canvas of `size` pixels. Returns the
// stamped lines (also used for the accessible label).
export function drawDogTagArt(ctx,size,data={},options={}){
  if(!ctx||!Number.isFinite(size)||size<=0)return null;
  const lines=tagLines(data.profile||{});
  loadAssets(ctx.canvas?.ownerDocument??(typeof document!=='undefined'?document:null));
  ctx.save();
  if(cache.ready&&cache.image)drawCover(ctx,size,cache.image);
  else drawFallbackPlate(ctx,size);
  const plate=cache.plate||FALLBACK_PLATE;
  const box={x:size*plate.x,y:size*plate.y,w:size*plate.w,h:size*plate.h};
  const namePx=Math.min(box.w/(lines.name.length*0.72),box.h*0.34);
  stampLine(ctx,lines.name,box.x+box.w/2,box.y+box.h*0.34,namePx);
  stampLine(ctx,lines.gender,box.x+box.w/2,box.y+box.h*0.58,Math.max(9,namePx*0.6));
  stampLine(ctx,lines.date,box.x+box.w/2,box.y+box.h*0.8,Math.max(9,namePx*0.52));
  ctx.restore();
  return lines;
}

// Mounts the tag as a labelled canvas inside a container, and repaints it
// once the photo and the stencil font have finished loading.
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
    canvas.style.width=size+'px';
    canvas.style.height=size+'px';
    const lines=drawDogTagArt(canvas.getContext&&canvas.getContext('2d'),px,data,options);
    if(lines)canvas.setAttribute('aria-label',`${tr('Your dog tag')}: ${lines.name} · ${lines.gender} · ${lines.date}`);
  };
  paint();
  const redraw=()=>{if(canvas.isConnected)paint();};
  cache.redraws.add(redraw);
  container.replaceChildren(canvas);
  return canvas;
}
