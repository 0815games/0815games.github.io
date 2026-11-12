// Layered character portraits: one base face per gender plus hair and beard
// overlays, composited on a canvas. This is what makes a three-row picker
// (GESICHT / HAARE / BART) affordable: 9 overlay images cover 3x4x4
// combinations instead of pre-rendering every one of them (requested:
// "verschiedene Varianten mit Haaren und Bart" as separate choices).
//
// The overlays are built by tools/build-layers.mjs: each is an AI edit of the
// gender's base portrait that changes ONLY hair or beard, so the pixel diff
// becomes the overlay's alpha mask. Every image carries its measured face box
// (pico.js detector); at composite time the overlay is scaled and positioned
// by mapping ITS face box onto the TARGET face's box - small drift in the AI
// edit therefore self-corrects, and one overlay fits every face of its
// gender.
import {FACES,HAIRS,BEARDS} from './assets/layers/manifest.mjs?v=20261112-layers2';

// The option a row offers when no overlay is drawn: the base portrait's own
// cut. Ids are null so they simply skip the layer.
export const NO_LAYER=Object.freeze({id:null,label:null});

export function layerOptions(gender){
  const faces=FACES.filter(f=>f.gender===gender);
  const hairs=HAIRS.filter(h=>h.gender===gender);
  // Beards are a male-only row; the female row offers just "no beard".
  const beards=gender==='male'?BEARDS.filter(b=>b.gender===gender):[];
  return {faces,hairs,beards};
}

// Maps an overlay (generated on `ref` face geometry) onto `target` face
// geometry on a `size`-pixel canvas. Returns the drawImage rectangle. Pure
// math, unit-tested: the overlay's face box lands exactly on the target's.
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

function clampChoice(list,id,fallback){
  return list.some(o=>o.id===id)?id:fallback;
}

// The base face file of an avatar's gender - the immediate fallback for
// sync callers while the composed portrait renders (the composition is
// async; the dossier must never show a blank frame).
export function facePortrait(avatar){
  if(!avatar)return null;
  const gender=avatar.gender==='male'?'male':'female';
  const faces=FACES.filter(f=>f.gender===gender);
  const face=faces.find(f=>f.id===avatar?.faceId)??faces[0];
  return face?.file??null;
}

// Draws the composed portrait (base face + hair + beard) onto a square
// canvas of `size` pixels. `avatar` is {gender, faceId, hairId, beardId};
// unknown ids clamp to the first option, so stale saves can never break the
// render. `deps.loadImage` is injectable for tests.
export async function composePortrait(canvas,avatar,size,deps={}){
  const loadImage=deps.loadImage||defaultLoadImage;
  const gender=avatar?.gender==='female'?'female':'male';
  const {faces,hairs,beards}=layerOptions(gender);
  const face=faces.find(f=>f.id===clampChoice(faces,avatar?.faceId,faces[0]?.id))??faces[0];
  // Stale saves with ids that no longer exist fall back to the base cut /
  // no beard - never to a random first option.
  const hairId=clampChoice(hairs,avatar?.hairId,null);
  const beardId=clampChoice(beards,avatar?.beardId,null);
  const hair=hairs.find(h=>h.id===hairId);
  const beard=beards.find(b=>b.id===beardId);
  if(!face||!canvas?.getContext)return null;
  const ctx=canvas.getContext('2d');
  if(canvas.width!==size){canvas.width=size;canvas.height=size;}
  ctx.clearRect(0,0,size,size);
  ctx.drawImage(await loadImage(face.file),0,0,size,size);
  for(const layer of [hair,beard]){
    if(!layer)continue;
    const image=await loadImage(layer.file);
    const rect=layerTransform(face.face,layer.face,size,image.naturalWidth||image.width,image.naturalHeight||image.height);
    if(rect)ctx.drawImage(image,rect.dx,rect.dy,rect.w,rect.h);
  }
  return {gender,faceId:face.id,hairId,beardId};
}
