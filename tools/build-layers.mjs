// Builds the portrait base heads and clean alpha-masked hair/beard overlays
// from the curated raw inputs in tools/raw-edits/ (or tools/raw-v2/).
//
// Design:
//   - 12 strictly frontal, bare-scalp, clean-shaven base heads (6 female, 6 male)
//     aligned to canonical framing and exported at 512x512 JPEG to
//     IronPath/assets/portraits/.
//   - 9 female hairstyles, 8 male hairstyles, and 6 male beards rendered as
//     neutral silver-gray comic-ink edits on the gender's reference base head,
//     extracted as clean grayscale+alpha PNGs (0 pixels of eyes/nose/mouth/
//     neck/collar) so IronPath/avatar-layers.mjs can tint hair & beard at
//     runtime into 5 shared colors without ghosting.
//
// Run from tools/:  npm install && node build-layers.mjs
import {existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import jpeg from 'jpeg-js';
import {PNG} from 'pngjs';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const IRON=join(ROOT,'IronPath');
const SRC=existsSync(join(ROOT,'tools/raw-edits/f-head-01.jpg'))
  ?join(ROOT,'tools/raw-edits')
  :join(ROOT,'tools/raw-v2');
const OUT=join(IRON,'assets/layers');
const PORTRAITS=join(IRON,'assets/portraits');

// pico.js face cascade stays in tools/vendor/ as a sanity check that every
// shipped portrait passes automated face detection.
const picoSrc=readFileSync(join(ROOT,'tools/vendor/pico.js'),'utf8');
(0,eval)(picoSrc+'\nglobalThis.pico=pico;');
const classify=pico.unpack_cascade(new Int8Array(readFileSync(join(ROOT,'tools/vendor/facefinder'))));

export const LAYER_TOKEN='20261119-avatar3';
export const PORTRAIT_TOKEN='20261119-avatar3';

export const HAIR_COLORS=[
  {id:'black', label:'Black',      swatch:'#1c1d22',stops:[[7,8,10],[17,18,22],[34,36,42],[68,72,82]]},
  {id:'brown', label:'Dark brown', swatch:'#4a2f1d',stops:[[12,8,6],[40,24,15],[74,47,29],[124,84,54]]},
  {id:'auburn',label:'Auburn',     swatch:'#a44426',stops:[[16,10,9],[102,38,22],[164,68,38],[218,124,78]]},
  {id:'blonde',label:'Blonde',     swatch:'#ceac5e',stops:[[24,20,13],[148,114,54],[206,172,94],[246,226,158]]},
  {id:'silver',label:'Silver',     swatch:'#b0b8c0',stops:[[16,18,20],[110,116,124],[176,184,192],[232,238,244]]},
];

const HEAD_FILES={
  female:[
    {id:'f1',src:'f-head-01',out:'f-head-01.jpg'},
    {id:'f2',src:'f-head-02',out:'f-head-02.jpg'},
    {id:'f3',src:'f-head-03',out:'f-head-03.jpg'},
    {id:'f4',src:'f-head-04',out:'f-head-04.jpg'},
    {id:'f5',src:'f-head-05',out:'f-head-05.jpg'},
    {id:'f6',src:'f-head-06',out:'f-head-06.jpg'},
  ],
  male:[
    {id:'m1',src:'m-head-01',out:'m-head-01.jpg'},
    {id:'m2',src:'m-head-02',out:'m-head-02.jpg'},
    {id:'m3',src:'m-head-03',out:'m-head-03.jpg'},
    {id:'m4',src:'m-head-04',out:'m-head-04.jpg'},
    {id:'m5',src:'m-head-05',out:'m-head-05.jpg'},
    {id:'m6',src:'m-head-06',out:'m-head-06.jpg'},
  ],
};

// Canonical reference geometry measured across all 12 bald frontal heads.
const REF={
  female:{eyeMidX:0.503,eyeY:0.347,face:{cx:0.503,cy:0.383,size:0.402}},
  male:  {eyeMidX:0.500,eyeY:0.340,face:{cx:0.500,cy:0.376,size:0.380}},
};

const LAYERS=[
  {src:'f-hair-crop',    kind:'hair',gender:'female',id:'crop',    label:'Short crop'},
  {src:'f-hair-slick',   kind:'hair',gender:'female',id:'slick',   label:'Slicked back'},
  {src:'f-hair-bob',     kind:'hair',gender:'female',id:'bob',     label:'Bob'},
  {src:'f-hair-sidebob', kind:'hair',gender:'female',id:'sidebob', label:'Side bob'},
  {src:'f-hair-bun',     kind:'hair',gender:'female',id:'bun',     label:'Bun'},
  {src:'f-hair-ponytail',kind:'hair',gender:'female',id:'ponytail',label:'Ponytail'},
  {src:'f-hair-braid',   kind:'hair',gender:'female',id:'braid',   label:'Braid'},
  {src:'f-hair-long',    kind:'hair',gender:'female',id:'long',    label:'Long hair'},
  {src:'f-hair-curly',   kind:'hair',gender:'female',id:'curly',   label:'Curly'},

  {src:'m-hair-buzz',    kind:'hair',gender:'male',id:'buzz',   label:'Buzz cut'},
  {src:'m-hair-short',   kind:'hair',gender:'male',id:'short',  label:'Short'},
  {src:'m-hair-fade',    kind:'hair',gender:'male',id:'fade',   label:'Fade'},
  {src:'m-hair-side',    kind:'hair',gender:'male',id:'side',   label:'Side part'},
  {src:'m-hair-spiky',   kind:'hair',gender:'male',id:'spiky',  label:'Spiky'},
  {src:'m-hair-medium',  kind:'hair',gender:'male',id:'medium', label:'Medium'},
  {src:'m-hair-curly',   kind:'hair',gender:'male',id:'curly',  label:'Curly'},
  {src:'m-hair-mohawk',  kind:'hair',gender:'male',id:'mohawk', label:'Mohawk'},

  {src:'m-beard-stubble', kind:'beard',gender:'male',id:'stubble', label:'Stubble'},
  {src:'m-beard-mustache',kind:'beard',gender:'male',id:'mustache',label:'Mustache'},
  {src:'m-beard-goatee',  kind:'beard',gender:'male',id:'goatee',  label:'Goatee'},
  {src:'m-beard-anchor',  kind:'beard',gender:'male',id:'anchor',  label:'Jawline'},
  {src:'m-beard-boxed',   kind:'beard',gender:'male',id:'boxed',   label:'Boxed beard'},
  {src:'m-beard-full',    kind:'beard',gender:'male',id:'full',    label:'Full beard'},
];

function decodeInput(stem){
  for(const ext of ['.png','.jpg']){
    const file=join(SRC,stem+ext);
    if(!existsSync(file))continue;
    const raw=readFileSync(file);
    if(ext==='.png'){
      const p=PNG.sync.read(raw);
      return {width:p.width,height:p.height,data:new Uint8Array(p.data)};
    }
    const j=jpeg.decode(raw,{useTArray:true,formatAsRGBA:true,tolerantDecoding:true});
    return {width:j.width,height:j.height,data:new Uint8Array(j.data)};
  }
  throw new Error(`Missing raw asset for ${stem} in ${SRC}`);
}

function assertFaceDetectable(img,label){
  const {width,height,data}=img;
  const gray=new Uint8Array(width*height);
  for(let r=0;r<height;r++)for(let c=0;c<width;c++)
    gray[r*width+c]=(2*data[r*width*4+4*c]+7*data[r*width*4+4*c+1]+1*data[r*width*4+4*c+2])/10;
  const dets=pico.cluster_detections(pico.run_cascade({pixels:gray,nrows:height,ncols:width,ldim:width},classify,{shiftfactor:.1,minsize:40,maxsize:1000,scalefactor:1.1}),0.2)
    .filter(d=>d[3]>5);
  if(!dets.length)throw new Error(`No face detected in ${label}`);
}

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
        out[(y*w+x)*4+ch]=Math.round((a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy);
      }
    }
  }
  return {width:w,height:h,data:out};
}

// Gently scales only the upper head silhouette slightly around the eye center
// (e.g. when one base head's ears flare 2% wider than the canonical hairline),
// keeping shoulders & collar untouched.
function zoomUpperHead(img,scale,anchorX,anchorY){
  if(!scale||Math.abs(scale-1)<1e-4)return img;
  const {width:w,height:h,data}=img;
  const out=new Uint8Array(data);
  const bgR=data[0],bgG=data[1],bgB=data[2];
  const ax=anchorX*w,ay=anchorY*h;
  for(let y=0;y<Math.round(0.62*h);y++){
    // Smoothly blend back to 1.0 between jaw (0.48h) and neck/collar (0.62h)
    const blend=y<=0.48*h?1:Math.max(0,1-(y-0.48*h)/(0.14*h));
    const effScale=1+(scale-1)*blend;
    for(let x=0;x<w;x++){
      const sx=ax+(x-ax)/effScale,sy=ay+(y-ay)/effScale;
      const di=(y*w+x)*4;
      if(sx<0||sx>=w-1||sy<0||sy>=h-1){
        out[di]=bgR;out[di+1]=bgG;out[di+2]=bgB;out[di+3]=255;continue;
      }
      const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
      for(let ch=0;ch<3;ch++){
        const a=data[(y0*w+x0)*4+ch],b=data[(y0*w+x0+1)*4+ch];
        const c=data[((y0+1)*w+x0)*4+ch],d=data[((y0+1)*w+x0+1)*4+ch];
        out[di+ch]=Math.round((a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy);
      }
      out[di+3]=255;
    }
  }
  return {width:w,height:h,data:out};
}

// Extracts ONLY clean grayscale hair or beard + smooth alpha from a silver-gray
// edit over the gender's bald/clean-shaven base head.
function extractLayer(base,edit,layer){
  const ref=REF[layer.gender];
  const {eyeMidX,eyeY}=ref;
  const {width:w,height:h,data:e}=edit;
  const b=base.data;
  const rawMask=new Uint8Array(w*h);
  const strength=new Float32Array(w*h);
  const browTopY=(eyeY-0.025)*h;
  const chinY=(eyeY+0.245)*h;

  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    const d=Math.abs(e[i]-b[i])+Math.abs(e[i+1]-b[i+1])+Math.abs(e[i+2]-b[i+2]);
    const r=e[i],g=e[i+1],bl=e[i+2];
    const lum=0.299*r+0.587*g+0.114*bl;
    const chroma=Math.max(r,g,bl)-Math.min(r,g,bl);
    const warm=r-bl;

    if(layer.kind==='hair'){
      if(y>0.99*h)continue;
      // Inner face oval (eyebrows, eyes, nose, cheeks, mouth, center jaw) stays 100% clean.
      if(y>=browTopY&&y<=chinY){
        const t=(y-browTopY)/(chinY-browTopY);
        const rx=(0.143-0.042*Math.max(0,t-0.35))*w;
        if(Math.abs(x-eyeMidX*w)<rx)continue;
      }
      // Front throat and center uniform shirt collar stay clean while braids drape beside neck.
      if(y>chinY-0.01*h){
        const centerHalf=y<0.72*h?0.105*w:0.085*w;
        if(Math.abs(x-eyeMidX*w)<centerHalf)continue;
      }
      const minD=y>0.72*h?78:34;
      if(d<minD)continue;

      const isSilver=chroma<46&&lum>82;
      const isPartCrevice=y<0.24*h&&chroma<34&&lum>52;
      const isRimHighlight=warm>=15&&lum>155&&chroma<85&&x<(eyeMidX-0.165)*w&&d>95;
      const isDarkInk=lum<62&&d>65;
      const db=b[i]-b[i+2];
      const cooledOrDarkened=((warm<db-8)||(lum<0.299*b[i]+0.587*b[i+1]+0.114*b[i+2]-18))&&y<eyeY*h+0.04*h;
      if(isSilver||isPartCrevice||isRimHighlight||isDarkInk||cooledOrDarkened){
        rawMask[y*w+x]=1;
        strength[y*w+x]=(d>85||isDarkInk||(isSilver&&d>65))?1.0:Math.min(1.0,Math.max(0.2,(d-28)/62));
      }
    }else{
      // Beard zone: strictly lower face (below eyes/nose/upper cheeks, above shirt collar).
      const topBeardY=(eyeY+0.095)*h;
      const botBeardY=(eyeY+0.300)*h;
      if(y<topBeardY||y>botBeardY)continue;
      if(Math.abs(x-eyeMidX*w)>0.185*w)continue;

      // Protect nose tip & nostrils
      const noseCy=(eyeY+0.105)*h;
      const ndx=(x-eyeMidX*w)/(0.042*w),ndy=(y-noseCy)/(0.030*h);
      if(ndx*ndx+ndy*ndy<1.0)continue;

      // Protect lips interior unless strongly covered by beard hair
      const mouthCy=(eyeY+0.168)*h;
      const mdx=(x-eyeMidX*w)/(0.050*w),mdy=(y-mouthCy)/(0.017*h);
      if(mdx*mdx+mdy*mdy<1.0&&d<125)continue;

      const isStubble=layer.id==='stubble';
      const baseLum=0.299*b[i]+0.587*b[i+1]+0.114*b[i+2];
      const baseWarm=b[i]-b[i+2];

      if(isStubble){
        // Stubble: only keep follicles/hairs (cool silver flecks & dark ink pores),
        // keeping soft alpha so underlying skin tone shines cleanly through!
        const coolDrop=baseWarm-warm;
        const darkDrop=baseLum-lum;
        const silverSpeck=(chroma<48&&coolDrop>10&&d>32);
        const inkSpeck=(lum<92&&darkDrop>18);
        if(silverSpeck||inkSpeck){
          rawMask[y*w+x]=1;
          strength[y*w+x]=Math.min(0.86,Math.max(0.24,(Math.max(d,darkDrop*2.2)-26)/115));
        }
      }else{
        const minD=55;
        if(d<minD)continue;
        const isSilver=chroma<46&&lum>85;
        const isDarkInk=lum<65&&d>65;
        const coolFoliage=baseWarm-warm>18&&d>60;
        if(isSilver||isDarkInk||coolFoliage){
          rawMask[y*w+x]=1;
          strength[y*w+x]=(d>92||isDarkInk)?1.0:Math.min(1.0,Math.max(0.25,(d-45)/75));
        }
      }
    }
  }

  // Keep connected components (tighter threshold for dotted stubble, standard for solid styles)
  const minComp=layer.id==='stubble'?4:60;
  const visited=new Uint8Array(w*h),keep=new Uint8Array(w*h),queue=new Int32Array(w*h);
  for(let idx=0;idx<w*h;idx++){
    if(!rawMask[idx]||visited[idx])continue;
    let qh=0,qt=0,maxS=0;
    queue[qt++]=idx;visited[idx]=1;
    while(qh<qt){
      const cur=queue[qh++],cx=cur%w,cy=(cur/w)|0;
      if(strength[cur]>maxS)maxS=strength[cur];
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=cx+dx,ny=cy+dy;
        if(nx>=0&&nx<w&&ny>=0&&ny<h){
          const ni=ny*w+nx;
          if(rawMask[ni]&&!visited[ni]){visited[ni]=1;queue[qt++]=ni;}
        }
      }
    }
    if(qt>=minComp||(qt>=18&&maxS>0.8))for(let k=0;k<qt;k++)keep[queue[k]]=1;
  }

  if(layer.id!=='stubble'){
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      if(keep[y*w+x])continue;
      let n=0;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(keep[(y+dy)*w+(x+dx)])n++;
      if(n>=6){keep[y*w+x]=1;strength[y*w+x]=0.9;}
    }
  }

  const full={width:w,height:h,data:new Uint8Array(w*h*4)};
  let opaqueCount=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const idx=y*w+x,i=idx*4;
    if(!keep[idx]){full.data[i+3]=0;continue;}
    let sum=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)
      sum+=keep[Math.min(h-1,Math.max(0,y+dy))*w+Math.min(w-1,Math.max(0,x+dx))];
    const edge=layer.id==='stubble'?1:(sum>=7?1:sum/9);
    const alpha=Math.round(Math.min(1,edge*strength[idx])*255);
    const lum=Math.min(255,Math.max(0,Math.round(0.299*e[i]+0.587*e[i+1]+0.114*e[i+2])));
    full.data[i]=lum;full.data[i+1]=lum;full.data[i+2]=lum;full.data[i+3]=alpha;
    if(alpha>32)opaqueCount++;
  }
  return {img:full,coverage:opaqueCount/(w*h)};
}

const pendingWrites=[];
const desiredPortraits=new Set();
const desiredLayers=new Set();

const FACES=[];
const baseRefs={};
for(const gender of ['female','male']){
  let idx=0;
  for(const spec of HEAD_FILES[gender]){
    idx++;
    let img=decodeInput(spec.src);
    if(spec.scaleHead)img=zoomUpperHead(img,spec.scaleHead,REF[gender].eyeMidX,REF[gender].eyeY);
    if(idx===1)baseRefs[gender]=img;
    assertFaceDetectable(img,`${gender} ${spec.id}`);
    const out512=resizeTo(img,512,512);
    const encoded=jpeg.encode({width:512,height:512,data:out512.data},90);
    desiredPortraits.add(spec.out);
    pendingWrites.push([join(PORTRAITS,spec.out),encoded.data,`${spec.out} (${encoded.data.length} bytes)`]);
    FACES.push({
      gender,id:spec.id,label:`Face ${idx}`,
      file:`assets/portraits/${spec.out}?v=${PORTRAIT_TOKEN}`,
      face:REF[gender].face,
    });
  }
}

const manifest={hairs:[],beards:[]};
for(const layer of LAYERS){
  const base=baseRefs[layer.gender];
  let edit=decodeInput(layer.src);
  edit=resizeTo(edit,base.width,base.height);
  const {img,coverage}=extractLayer(base,edit,layer);
  const maxCov=layer.kind==='hair'?0.42:0.10;
  if(coverage<=0.001||coverage>maxCov){
    throw new Error(`Unexpected coverage for ${layer.src}: ${(coverage*100).toFixed(2)}%`);
  }
  const small=resizeTo(img,512,512);
  const png=new PNG({width:512,height:512});
  png.data.set(small.data);
  const outFile=`${layer.kind}-${layer.gender}-${layer.id}.png`;
  desiredLayers.add(outFile);
  pendingWrites.push([join(OUT,outFile),PNG.sync.write(png,{deflateLevel:9}),`${outFile} (${(coverage*100).toFixed(2)}% mask)`]);
  const entry={
    gender:layer.gender,id:layer.id,label:layer.label,
    file:`assets/layers/${outFile}?v=${LAYER_TOKEN}`,
    face:REF[layer.gender].face,
  };
  manifest[layer.kind==='hair'?'hairs':'beards'].push(entry);
}

mkdirSync(OUT,{recursive:true});
mkdirSync(PORTRAITS,{recursive:true});
for(const f of readdirSync(PORTRAITS))if(f.endsWith('.jpg')&&!desiredPortraits.has(f))rmSync(join(PORTRAITS,f));
for(const f of readdirSync(OUT))if(f.endsWith('.png')&&!desiredLayers.has(f))rmSync(join(OUT,f));
for(const [dest,buf,logLine] of pendingWrites){
  writeFileSync(dest,buf);
  console.log(logLine);
}

const js=`// GENERATED by tools/build-layers.mjs - do not edit by hand.
// Every portrait is a strictly frontal bald/clean-shaven base head (512x512 JPEG),
// and every overlay is a clean neutral grayscale+alpha PNG (zero skin/eyes/collar)
// tinted at runtime across HAIR_COLORS.
export const LAYER_TOKEN='${LAYER_TOKEN}';
export const HAIR_COLORS=${JSON.stringify(HAIR_COLORS,null,2)};
export const FACES=${JSON.stringify(FACES,null,2)};
export const HAIRS=${JSON.stringify(manifest.hairs,null,2)};
export const BEARDS=${JSON.stringify(manifest.beards,null,2)};
`;
writeFileSync(join(OUT,'manifest.mjs'),js);
console.log('manifest.mjs written:',FACES.length,'faces,',manifest.hairs.length,'hairs,',manifest.beards.length,'beards');
