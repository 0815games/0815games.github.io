// The dog tag as a photograph, not a drawing: a rendered blank tag image with
// the soldier's own three lines stamped on in a military stencil font - name,
// gender and the day service began (reported: "Dog Tag per Canvas sieht
// einfach nur scheiße aus, auch Bild-Rendering und dann die Military-Font
// drauf schreiben").
//
// The scene around the tag is cropped away (reported: "Können wir den
// Hintergrund entfernen, das Holzfiguren, bzw nur die Dog Tag benutzen ohne
// Hintergrund? So das es größer wird" - names ran past the small plate while
// the wooden-figure backdrop ate the frame). The canvas shows the tag itself,
// edge to edge, and every stamped line is shrunk to its measured width so a
// name can never run past the plate again.
//
// The plate's position inside the photo is not hardcoded: it is detected from
// the pixels (the largest bright, low-saturation blob) once the image has
// loaded, so a re-rendered photo with a different crop still gets its stamp
// in the right place. Until the photo and the stencil font have arrived, a
// clean fallback plate is drawn and the canvas repaints the moment they land
// - the same "draw now, refine when the image lands" contract the map uses.
import {translateText as tr} from './language.mjs?v=20261112-kits1';

const TAG_ASSET='assets/dog-tag-plate.jpg?v=20261112-avatar2';
const STENCIL='"Black Ops One","Arial Black",Impact,sans-serif';
// The fallback plate fills the frame on its own: no backdrop, just the tag.
const FALLBACK_PLATE=Object.freeze({x:.05,y:.12,w:.9,h:.76});
// Breathing room around the detected plate when cropping the photo. Kept
// TIGHT on purpose: the tag must fill the frame (reported: "nur die Dog Tag
// benutzen ohne Hintergrund - so das es größer wird"). At five percent the
// plate covers ~91% of the canvas width - the same footprint as the drawn
// fallback, so the fallback-to-photo transition does not visibly shrink the
// tag. Wider margins brought the scene (and the shrink) back.
const CROP_MARGIN=.05;

const cache={image:null,ready:false,failed:false,plate:null,redraws:new Set()};

function notify(){
  for(const redraw of [...cache.redraws]){
    try{redraw();}catch{/* A repaint must never throw into the image load. */}
  }
}

// Registers a repaint for the moment the photo and the stencil font have
// arrived. Screens that draw the tag directly (instead of through
// renderDogTagArt) must hook this, or they keep their first paint - the
// fallback plate - forever and only swap to the photo on the next unrelated
// repaint (that late swap read as "worked briefly, then broke").
export function onDogTagArtReady(redraw){
  if(typeof redraw!=='function')return ()=>{};
  // Already settled (loaded, or loading is impossible here): paint now.
  if(cache.ready||cache.failed){try{redraw();}catch{}return ()=>{};}
  cache.redraws.add(redraw);
  return ()=>{cache.redraws.delete(redraw);};
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
// edge underneath, like a machine hit the plate. The line is SHRUNK TO ITS
// MEASURED WIDTH - the reported bug was names running past the tag, so the
// font size yields to the plate, never the other way around.
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

// Crops the photo down to the tag itself (plus a little chain margin) and
// CONTAIN-fits that crop into the square canvas: the whole tag stays visible,
// the scene around it is gone and the leftover strip is transparent. Returns
// where the plate landed, in canvas pixels, so the stamp lands on the metal
// and nowhere else.
export function drawPlateCrop(ctx,size,image,plate){
  const mx=plate.w*CROP_MARGIN,my=plate.h*CROP_MARGIN;
  const x0=Math.max(0,plate.x-mx),y0=Math.max(0,plate.y-my);
  const x1=Math.min(1,plate.x+plate.w+mx),y1=Math.min(1,plate.y+plate.h+my);
  const sx=x0*image.width,sy=y0*image.height,sw=(x1-x0)*image.width,sh=(y1-y0)*image.height;
  const scale=Math.min(size/sw,size/sh);
  const dw=sw*scale,dh=sh*scale,dx=(size-dw)/2,dy=(size-dh)/2;
  ctx.drawImage(image,sx,sy,sw,sh,dx,dy,dw,dh);
  return {x:dx+(plate.x-x0)*image.width*scale,y:dy+(plate.y-y0)*image.height*scale,
    w:plate.w*image.width*scale,h:plate.h*image.height*scale};
}

// The interim plate: plain brushed metal, corner hole, short chain stub - a
// clean placeholder until the photo asset lands, never the final look. No
// backdrop: the tag sits alone on the transparent canvas, filling the frame.
export function drawFallbackPlate(ctx,size){
  const plate={x:size*FALLBACK_PLATE.x,y:size*FALLBACK_PLATE.y,w:size*FALLBACK_PLATE.w,h:size*FALLBACK_PLATE.h};
  ctx.strokeStyle='#8f948b';ctx.lineWidth=Math.max(2,size*0.012);
  ctx.beginPath();ctx.moveTo(size/2,0);ctx.lineTo(plate.x+plate.w*0.14,plate.y+plate.h*.5);ctx.stroke();
  const grad=typeof ctx.createLinearGradient==='function'?ctx.createLinearGradient(plate.x,plate.y,plate.x+plate.w,plate.y+plate.h):null;
  if(grad){grad.addColorStop(0,'#b9bdc0');grad.addColorStop(.5,'#cfd3d6');grad.addColorStop(1,'#a9adb0');ctx.fillStyle=grad;}
  else ctx.fillStyle='#c6cacc';
  const r=plate.h*0.18;
  ctx.beginPath();
  ctx.roundRect?ctx.roundRect(plate.x,plate.y,plate.w,plate.h,r):ctx.rect(plate.x,plate.y,plate.w,plate.h);
  ctx.fill();
  ctx.beginPath();ctx.arc(plate.x+plate.w*0.14,plate.y+plate.h/2,Math.max(2,plate.h*0.07),0,Math.PI*2);
  ctx.fillStyle='#2c2418';ctx.fill();
  return plate;
}

// Draws the whole tag into a square canvas of `size` pixels. Returns the
// stamped lines (also used for the accessible label).
export function drawDogTagArt(ctx,size,data={},options={}){
  if(!ctx||!Number.isFinite(size)||size<=0)return null;
  const lines=tagLines(data.profile||{});
  loadAssets(ctx.canvas?.ownerDocument??(typeof document!=='undefined'?document:null));
  ctx.save();
  const box=cache.ready&&cache.image
    ?drawPlateCrop(ctx,size,cache.image,cache.plate||FALLBACK_PLATE)
    :drawFallbackPlate(ctx,size);
  // Name first and largest; gender and date follow its (possibly shrunk)
  // size so a long name compresses the whole stamp block, never overflows.
  const namePx=stampLine(ctx,lines.name,box.x+box.w/2,box.y+box.h*0.32,box.h*0.3,box.w*0.9);
  stampLine(ctx,lines.gender,box.x+box.w/2,box.y+box.h*0.58,Math.max(9,namePx*0.62),box.w*0.9);
  stampLine(ctx,lines.date,box.x+box.w/2,box.y+box.h*0.8,Math.max(9,namePx*0.52),box.w*0.9);
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
