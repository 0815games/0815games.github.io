// Builds the portrait layer assets (hair / beard overlays) from the raw AI
// edits in IronPath/assets/layers/src/.
//
// How it works: every raw edit was made from ONE base portrait per gender
// (female: f-crop.jpg, male: m-buzz.jpg) with the instruction to change ONLY
// hair or beard. So the pixel DIFFERENCE between base and edit is exactly the
// changed hair or beard - that diff becomes the overlay's alpha mask. The
// mask is clipped to a generous head (or lower-face) box as a safety net
// against global lighting drift, dilated and feathered, and written as a PNG
// with transparency. The face detector (pico.js + facefinder cascade, both
// vendored in tools/vendor/) measures the face box of every image; overlays
// are later anchored onto any target face by mapping their face box onto the
// target's, which makes the edits self-correcting against small shifts.
//
// Output: IronPath/assets/layers/<name>.png (the overlay) and
// IronPath/assets/layers/manifest.mjs (baked tables for the engine).
//
// Run from tools/:  npm install && node build-layers.mjs
import {readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import jpeg from 'jpeg-js';
import {PNG} from 'pngjs';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const IRON=join(ROOT,'IronPath');
// Raw AI edits are BUILD INPUTS, not game assets - they live under tools/ so
// the deployed assets folder only ever contains what the game loads.
const SRC=join(ROOT,'tools/raw-edits');
const OUT=join(IRON,'assets/layers');
const PORTRAITS=join(IRON,'assets/portraits');

// pico.js is a browser script: evaluate it and grab the global.
const picoSrc=readFileSync(join(ROOT,'tools/vendor/pico.js'),'utf8');
(0,eval)(picoSrc+'\nglobalThis.pico=pico;');
const classify=pico.unpack_cascade(new Int8Array(readFileSync(join(ROOT,'tools/vendor/facefinder'))));

function decode(file){
  const img=jpeg.decode(readFileSync(file),{useTArray:true,formatAsRGBA:true,tolerantDecoding:true});
  return {width:img.width,height:img.height,data:img.data};
}

function detectFace(img){
  const {width,height,data}=img;
  const gray=new Uint8Array(width*height);
  for(let r=0;r<height;r++)for(let c=0;c<width;c++)
    gray[r*width+c]=(2*data[r*width*4+4*c]+7*data[r*width*4+4*c+1]+1*data[r*width*4+4*c+2])/10;
  const dets=pico.cluster_detections(pico.run_cascade({pixels:gray,nrows:height,ncols:width,ldim:width},classify,{shiftfactor:.1,minsize:40,maxsize:1000,scalefactor:1.1}),0.2)
    .filter(d=>d[3]>5).sort((a,b)=>b[3]-a[3]);
  if(!dets.length)throw new Error('no face found');
  const d=dets[0];
  return {cx:d[1]/width,cy:d[0]/height,size:d[2]/width};
}

// Bilinear resize to the base dimensions, so the diff is pixel-true.
function resizeTo(img,w,h){
  if(img.width===w&&img.height===h)return img;
  const out=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++){
    const sy=Math.min(img.height-1,Math.max(0,(y+0.5)*img.height/h-0.5));
    const y0=Math.floor(sy),y1=Math.min(img.height-1,y0+1),fy=sy-y0;
    for(let x=0;x<w;x++){
      const sx=Math.min(img.width-1,Math.max(0,(x+0.5)*img.width/w-0.5));
      const x0=Math.floor(sx),x1=Math.min(img.width-1,x0+1),fx=sx-x0;
      for(let ch=0;ch<4;ch++){
        const a=img.data[(y0*img.width+x0)*4+ch],b=img.data[(y0*img.width+x1)*4+ch];
        const c=img.data[(y1*img.width+x0)*4+ch],d=img.data[(y1*img.width+x1)*4+ch];
        out[(y*w+x)*4+ch]=(a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy;
      }
    }
  }
  return {width:w,height:h,data:out};
}

function dilate(mask,w,h,r){
  if(r<=0)return mask;
  const out=new Uint8Array(mask);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(mask[y*w+x])continue;
    let hit=0;
    for(let dy=-r;dy<=r&&!hit;dy++)for(let dx=-r;dx<=r&&!hit;dx++){
      const nx=x+dx,ny=y+dy;
      if(nx>=0&&nx<w&&ny>=0&&ny<h&&mask[ny*w+nx])hit=1;
    }
    out[y*w+x]=hit;
  }
  return out;
}

function feather(mask,w,h,r){
  if(r<=0)return mask;
  const out=new Float32Array(w*h);
  // separable box blur
  const tmp=new Float32Array(w*h);
  for(let y=0;y<h;y++){
    let sum=0;
    for(let x=-r;x<=r;x++)sum+=mask[y*w+Math.min(w-1,Math.max(0,x))];
    for(let x=0;x<w;x++){
      tmp[y*w+x]=sum/(2*r+1);
      const add=mask[y*w+Math.min(w-1,Math.max(0,x+r+1))];
      const sub=mask[y*w+Math.min(w-1,Math.max(0,x-r))];
      sum+=add-sub;
    }
  }
  for(let x=0;x<w;x++){
    let sum=0;
    for(let y=-r;y<=r;y++)sum+=tmp[Math.min(h-1,Math.max(0,y))*w+x];
    for(let y=0;y<h;y++){
      out[y*w+x]=sum/(2*r+1);
      const add=tmp[Math.min(h-1,Math.max(0,y+r+1))*w+x];
      const sub=tmp[Math.min(h-1,Math.max(0,y-r))*w+x];
      sum+=add-sub;
    }
  }
  return out;
}

const BASES={
  female:{file:'f-crop.jpg'},
  male:{file:'m-buzz.jpg'},
};

const LAYERS=[
  {src:'f-hair-bob.jpg',kind:'hair',gender:'female',id:'bob',label:'Bob'},
  {src:'f-hair-long.jpg',kind:'hair',gender:'female',id:'long',label:'Long hair'},
  {src:'f-hair-braid.jpg',kind:'hair',gender:'female',id:'braid',label:'Braid'},
  {src:'f-hair-ponytail.jpg',kind:'hair',gender:'female',id:'ponytail',label:'Ponytail'},
  {src:'m-hair-short.jpg',kind:'hair',gender:'male',id:'short',label:'Short'},
  {src:'m-hair-side.jpg',kind:'hair',gender:'male',id:'side',label:'Side part'},
  {src:'m-hair-medium.jpg',kind:'hair',gender:'male',id:'medium',label:'Medium'},
  {src:'m-beard-stubble.jpg',kind:'beard',gender:'male',id:'stubble',label:'Stubble'},
  {src:'m-beard-mustache.jpg',kind:'beard',gender:'male',id:'mustache',label:'Mustache'},
  {src:'m-beard-full.jpg',kind:'beard',gender:'male',id:'full',label:'Full beard'},
];

const PORTRAIT_TOKEN='20261112-avatar2';
const LAYER_TOKEN='20261112-layers1';

const baseImgs={};
for(const [gender,base] of Object.entries(BASES)){
  const img=decode(join(PORTRAITS,base.file));
  base.face=detectFace(img);
  baseImgs[gender]=img;
  console.log(`base ${gender}: ${base.file} face x=${(base.face.cx*100).toFixed(1)}% y=${(base.face.cy*100).toFixed(1)}% size=${(base.face.size*100).toFixed(1)}%`);
}

// Quality gate: a well-behaved edit changes only hair (at most ~a third of
// the image, long hair draped over shoulders included) or beard (a few
// percent). An overlay that changes more than that re-interpreted the scene
// (first braid attempt: 66% of all pixels) and is REJECTED, not shipped.
const MAX_COVERAGE={hair:0.30,beard:0.08};
const manifest={hairs:[],beards:[]};
const rejected=[];
for(const layer of LAYERS){
  const base=BASES[layer.gender];
  let img=decode(join(SRC,layer.src));
  const face=detectFace(img);
  img=resizeTo(img,baseImgs[layer.gender].width,baseImgs[layer.gender].height);
  const {width:w,height:h}=img;
  const b=baseImgs[layer.gender];
  // diff mask, clipped to a generous region around the face so global
  // lighting drift can never leak in (hair: head + shoulders where long hair
  // drapes; beard: the lower face box only)
  const diff=new Float32Array(w*h);
  let region;
  if(layer.kind==='hair')
    region={x0:face.cx-1.6*face.size,x1:face.cx+1.6*face.size,y0:face.cy-1.35*face.size,y1:face.cy+1.15*face.size};
  else
    region={x0:face.cx-0.8*face.size,x1:face.cx+0.8*face.size,y0:face.cy-0.2*face.size,y1:face.cy+1.15*face.size};
  const X0=Math.max(0,Math.floor(region.x0*w)),X1=Math.min(w,Math.ceil(region.x1*w));
  const Y0=Math.max(0,Math.floor(region.y0*h)),Y1=Math.min(h,Math.ceil(region.y1*h));
  let changed=0;
  for(let y=Y0;y<Y1;y++)for(let x=X0;x<X1;x++){
    const i=(y*w+x)*4;
    const d=Math.abs(img.data[i]-b.data[i])+Math.abs(img.data[i+1]-b.data[i+1])+Math.abs(img.data[i+2]-b.data[i+2]);
    if(d>48){diff[y*w+x]=1;changed++;}
  }
  const coverage=changed/(w*h);
  if(coverage>MAX_COVERAGE[layer.kind]){
    rejected.push(`${layer.src}: ${(coverage*100).toFixed(1)}% changed (max ${(MAX_COVERAGE[layer.kind]*100).toFixed(0)}%) - REJECTED, regenerate this edit`);
    continue;
  }
  const mask=dilate(diff,w,h,4);
  const alpha=feather(mask,w,h,3);
  // Compose the final RGBA at full resolution, then downscale to at most
  // 512px: the largest on-screen use is the 240px preview portrait at 2x
  // device pixel ratio (480px), so 512 keeps it sharp while cutting the
  // shipped weight to about a quarter. Face boxes are fractions and survive
  // the resize unchanged.
  const full={width:w,height:h,data:new Uint8Array(w*h*4)};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    full.data[i]=img.data[i];full.data[i+1]=img.data[i+1];full.data[i+2]=img.data[i+2];
    // soft knee: 0.25..0.75 of the feathered mask ramps 0..255
    full.data[i+3]=Math.round(Math.min(1,Math.max(0,(alpha[y*w+x]-0.25)/0.5))*255);
  }
  const down=Math.min(1,512/Math.max(w,h));
  const ow=Math.max(1,Math.round(w*down)),oh=Math.max(1,Math.round(h*down));
  const small=down<1?resizeTo(full,ow,oh):full;
  const png=new PNG({width:small.width,height:small.height});
  png.data.set(small.data);
  const outFile=`${layer.kind}-${layer.gender}-${layer.id}.png`;
  writeFileSync(join(OUT,outFile),PNG.sync.write(png,{deflateLevel:9}));
  const entry={id:layer.id,label:layer.label,file:`assets/layers/${outFile}?v=${LAYER_TOKEN}`,face};
  manifest[layer.kind==='hair'?'hairs':'beards'].push({...entry,gender:layer.gender});
  console.log(`${outFile}: face x=${(face.cx*100).toFixed(1)}% y=${(face.cy*100).toFixed(1)}% size=${(face.size*100).toFixed(1)}% | mask ${(coverage*100).toFixed(1)}% of image | drift dx=${((face.cx-base.face.cx)*100).toFixed(1)}% dy=${((face.cy-base.face.cy)*100).toFixed(1)}%`);
}

// The faces the player can pick: the two flat-haired bases per gender, so
// every hair overlay covers what is underneath.
const FACES=[
  {gender:'female',id:'crop',label:'Face 1',file:`assets/portraits/f-crop.jpg?v=${PORTRAIT_TOKEN}`,face:BASES.female.face},
  {gender:'female',id:'bun',label:'Face 2',file:`assets/portraits/f-bun.jpg?v=${PORTRAIT_TOKEN}`,face:detectFace(decode(join(PORTRAITS,'f-bun.jpg')))},
  {gender:'male',id:'buzz',label:'Face 1',file:`assets/portraits/m-buzz.jpg?v=${PORTRAIT_TOKEN}`,face:BASES.male.face},
  {gender:'male',id:'short',label:'Face 2',file:`assets/portraits/m-short.jpg?v=${PORTRAIT_TOKEN}`,face:detectFace(decode(join(PORTRAITS,'m-short.jpg')))},
];

const js=`// GENERATED by tools/build-layers.mjs - do not edit by hand.
// Face boxes are measured with the pico.js face detector (see tools/).
// Overlays are anchored by mapping their face box onto the target face box,
// so a small drift in the AI edit self-corrects at composite time.
export const LAYER_TOKEN='${LAYER_TOKEN}';
export const FACES=${JSON.stringify(FACES,null,2)};
export const HAIRS=${JSON.stringify(manifest.hairs,null,2)};
export const BEARDS=${JSON.stringify(manifest.beards,null,2)};
`;
writeFileSync(join(OUT,'manifest.mjs'),js);
console.log('manifest.mjs written');
if(rejected.length){console.log('\nREJECTED LAYERS (not shipped):\n  '+rejected.join('\n  '));}
