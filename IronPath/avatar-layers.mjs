// Layered character portraits: 12 strictly frontal bald/clean-shaven base
// heads (6 female, 6 male) plus clean grayscale+alpha hair and beard overlays,
// tinted at runtime into 5 shared HAIR_COLORS and composited on a canvas.
//
// Overlays are built by tools/build-layers.mjs from neutral silver-gray comic
// ink edits on each gender's reference base head, masked cleanly with zero
// skin/eyes/collar bleed so any hairstyle and beard fit any base head without
// double eyebrows or old-face ghosting.
import {HAIR_COLORS,FACES,HAIRS,BEARDS} from './assets/layers/manifest.mjs?v=20261119-avatar3';

export const NO_LAYER=Object.freeze({id:null,label:null});
export const DEFAULT_COLOR_ID='brown';

export function hairColors(){
  return HAIR_COLORS;
}

export function stopsForColor(colorId){
  return (HAIR_COLORS.find(c=>c.id===colorId)??HAIR_COLORS.find(c=>c.id===DEFAULT_COLOR_ID)??HAIR_COLORS[0]).stops;
}

export function tintTone(lum,stops){
  const t=Math.max(0,Math.min(1,lum/255));
  const pos=t<=0.35?t/0.35:t<=0.72?1+(t-0.35)/0.37:2+(t-0.72)/0.28;
  const idx=Math.min(2,Math.floor(pos)),f=pos-idx;
  const a=stops[idx],b=stops[idx+1];
  return [
    Math.round(a[0]+(b[0]-a[0])*f),
    Math.round(a[1]+(b[1]-a[1])*f),
    Math.round(a[2]+(b[2]-a[2])*f),
  ];
}

export function layerOptions(gender){
  const faces=FACES.filter(f=>f.gender===gender);
  const hairs=HAIRS.filter(h=>h.gender===gender);
  const beards=gender==='male'?BEARDS.filter(b=>b.gender===gender):[];
  return {faces,hairs,beards,colors:HAIR_COLORS};
}

// Maps an overlay (generated on `ref` face geometry) onto `target` face
// geometry on a `size`-pixel canvas. Returns the drawImage rectangle.
export function layerTransform(target,ref,size,natW,natH){
  if(!target||!ref||!Number.isFinite(size)||size<=0||!Number.isFinite(natW)||natW<=0)
    return null;
  const scale=target.size/ref.size*size/natW;
  return {
    dx:target.cx*size-ref.cx*natW*scale,
    dy:target.cy*size-ref.cy*natH*scale,
    w:natW*scale,
    h:natH*scale,
  };
}

const imageCache=new Map();
const tintedCache=new Map();
const canvasRenderTokens=new WeakMap();

function defaultLoadImage(src){
  if(imageCache.has(src))return imageCache.get(src);
  const promise=new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>{imageCache.delete(src);reject(new Error('portrait layer failed to load: '+src));};
    image.src=src;
  });
  imageCache.set(src,promise);
  return promise;
}

// Tints a neutral grayscale+alpha overlay image via a 4-stop tonal LUT onto an
// offscreen canvas and caches the result per (file, colorId). Mock images in
// Node tests without DOM canvas ImageData pass straight through unmodified.
function tintedLayerDrawable(image,src,colorId){
  const key=`${src}#${colorId}`;
  if(tintedCache.has(key))return tintedCache.get(key);
  if(typeof document==='undefined'||typeof document.createElement!=='function')return image;
  const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
  if(!w||!h)return image;
  try{
    const off=document.createElement('canvas');
    off.width=w;off.height=h;
    const octx=off.getContext&&off.getContext('2d');
    if(!octx||typeof octx.getImageData!=='function'||typeof octx.putImageData!=='function')return image;
    octx.drawImage(image,0,0,w,h);
    const imgData=octx.getImageData(0,0,w,h);
    const d=imgData&&imgData.data;
    if(!d)return image;
    const stops=stopsForColor(colorId);
    for(let i=0;i<d.length;i+=4){
      if(d[i+3]===0)continue;
      const lum=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
      const [r,g,b]=tintTone(lum,stops);
      d[i]=r;d[i+1]=g;d[i+2]=b;
    }
    octx.putImageData(imgData,0,0);
    tintedCache.set(key,off);
    return off;
  }catch{
    return image;
  }
}

function clampChoice(list,id,fallback){
  return list.some(o=>o.id===id)?id:fallback;
}

// The base face file of an avatar's gender - immediate fallback for sync
// callers while the composed portrait renders.
export function facePortrait(avatar){
  if(!avatar)return null;
  const gender=avatar.gender==='male'?'male':'female';
  const faces=FACES.filter(f=>f.gender===gender);
  const face=faces.find(f=>f.id===avatar?.faceId)??faces[0];
  return face?.file??null;
}

// Draws the composed portrait (base face + tinted hair + tinted beard) onto a
// square canvas of `size` pixels. Guarded per canvas against out-of-order async
// completion when rapid stepper clicks overlap.
export async function composePortrait(canvas,avatar,size,deps={}){
  const loadImage=deps.loadImage||defaultLoadImage;
  const gender=avatar?.gender==='female'?'female':'male';
  const {faces,hairs,beards,colors}=layerOptions(gender);
  const face=faces.find(f=>f.id===clampChoice(faces,avatar?.faceId,faces[0]?.id))??faces[0];
  const hairId=clampChoice(hairs,avatar?.hairId,null);
  const beardId=clampChoice(beards,avatar?.beardId,null);
  const colorId=clampChoice(colors,avatar?.colorId,DEFAULT_COLOR_ID);
  const hair=hairs.find(h=>h.id===hairId);
  const beard=beards.find(b=>b.id===beardId);
  if(!face||!canvas?.getContext)return null;

  const token=(canvasRenderTokens.get(canvas)||0)+1;
  canvasRenderTokens.set(canvas,token);

  const activeLayers=[hair,beard].filter(Boolean);
  const [baseImg,...layerImgs]=await Promise.all([
    loadImage(face.file),
    ...activeLayers.map(layer=>loadImage(layer.file)),
  ]);
  // A newer compose call superseded this one while assets were loading.
  if(canvasRenderTokens.get(canvas)!==token)return null;

  const ctx=canvas.getContext('2d');
  if(canvas.width!==size){canvas.width=size;canvas.height=size;}
  ctx.clearRect(0,0,size,size);
  ctx.drawImage(baseImg,0,0,size,size);
  for(let i=0;i<activeLayers.length;i++){
    const layer=activeLayers[i],image=layerImgs[i];
    const drawable=tintedLayerDrawable(image,layer.file,colorId);
    const rect=layerTransform(face.face,layer.face,size,image.naturalWidth||image.width,image.naturalHeight||image.height);
    if(rect)ctx.drawImage(drawable,rect.dx,rect.dy,rect.w,rect.h);
  }
  return {gender,faceId:face.id,hairId,beardId,colorId};
}
