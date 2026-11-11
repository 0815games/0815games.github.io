// Dependency-free PNG decoder for tests: Node's zlib does the heavy lifting,
// this handles chunks, filters and color types. Supports 8-bit RGBA(6),
// RGB(2), grayscale(0/4) and palette(3), no interlace.
import {inflateSync} from 'node:zlib';

export function decodePng(buffer){
  const signature=Buffer.from([137,80,78,71,13,10,26,10]);
  if(buffer.length<8||!buffer.subarray(0,8).equals(signature))throw new Error('not a PNG');
  let offset=8,width=0,height=0,bitDepth=0,colorType=0,interlace=0;
  const idat=[];
  let palette=null,trns=null;
  while(offset+12<=buffer.length){
    const length=buffer.readUInt32BE(offset);
    const type=buffer.toString('ascii',offset+4,offset+8);
    const data=buffer.subarray(offset+8,offset+8+length);
    if(type==='IHDR'){
      width=data.readUInt32BE(0);height=data.readUInt32BE(4);
      bitDepth=data[8];colorType=data[9];interlace=data[12];
    }else if(type==='IDAT')idat.push(data);
    else if(type==='PLTE')palette=data;
    else if(type==='tRNS')trns=data;
    offset+=12+length;
    if(type==='IEND')break;
  }
  if(bitDepth!==8)throw new Error('unsupported bit depth '+bitDepth);
  if(interlace)throw new Error('interlaced PNG not supported');
  const channels={0:1,2:3,3:1,4:2,6:4}[colorType];
  if(!channels)throw new Error('unsupported color type '+colorType);

  const raw=inflateSync(Buffer.concat(idat));
  const stride=width*channels;
  // Unfilter in place: each scanline is prefixed with one filter byte.
  for(let y=0;y<height;y++){
    const line=y*(stride+1)+1;
    const filter=raw[line-1];
    for(let x=0;x<stride;x++){
      const i=line+x;
      const left=x>=channels?raw[i-channels]:0;
      const up=y>0?raw[i-stride-1]:0;
      const ul=x>=channels&&y>0?raw[i-stride-1-channels]:0;
      let v=raw[i];
      if(filter===1)v+=left;
      else if(filter===2)v+=up;
      else if(filter===3)v+=(left+up)>>1;
      else if(filter===4){
        const p=left+up-ul,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-ul);
        v+=pa<=pb&&pa<=pc?left:pb<=pc?up:ul;
      }
      raw[i]=v;
    }
  }
  const out=new Uint8Array(width*height*4);
  const at=(x,y,ch)=>raw[y*(stride+1)+1+x*channels+ch];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const px=(y*width+x)*4;
    if(colorType===6){out[px]=at(x,y,0);out[px+1]=at(x,y,1);out[px+2]=at(x,y,2);out[px+3]=at(x,y,3);}
    else if(colorType===2){out[px]=at(x,y,0);out[px+1]=at(x,y,1);out[px+2]=at(x,y,2);out[px+3]=255;}
    else if(colorType===0){const g=at(x,y,0);out[px]=out[px+1]=out[px+2]=g;out[px+3]=255;}
    else if(colorType===4){const g=at(x,y,0);out[px]=out[px+1]=out[px+2]=g;out[px+3]=at(x,y,1);}
    else if(colorType===3){
      const idx=at(x,y,0);
      out[px]=palette[idx*3];out[px+1]=palette[idx*3+1];out[px+2]=palette[idx*3+2];
      out[px+3]=trns&&idx<trns.length?trns[idx]:255;
    }
  }
  return {width,height,data:out};
}

export function hsv(r,g,b){
  const R=r/255,G=g/255,B=b/255;
  const max=Math.max(R,G,B),min=Math.min(R,G,B);
  const d=max-min;
  let h=0;
  if(d){
    if(max===R)h=60*(((G-B)/d)%6);
    else if(max===G)h=60*((B-R)/d+2);
    else h=60*((R-G)/d+4);
  }
  if(h<0)h+=360;
  return {h,s:max?d/max:0,v:max};
}

// The fringe the player actually sees: the violet/magenta family, bright
// enough to read as a halo on the battlefield. Dark desaturated edge pixels
// are ordinary anti-aliasing and deliberately do not count.
export function isBrightFringe(r,g,b){
  const {h,s,v}=hsv(r,g,b);
  return h>=245&&h<=355&&((s>=0.15&&v>=0.45)||(s>=0.30&&v>=0.30));
}
