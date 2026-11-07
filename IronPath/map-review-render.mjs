// Renders each campaign mission's generated field to a PNG review sheet:
// road, pads, bunker, zones, deco, torches and resolved stage markers.
// Pure node (zlib + hand-rolled PNG chunks), no canvas dependency.
import {deflateSync} from 'node:zlib';
import {mkdirSync} from 'node:fs';
import {getMap} from './maps.mjs?v=20261205-torchfix1';
import {CAMPAIGN} from './campaign.mjs?v=20261108-balance2';

// ------------------------------------------------------------------ png ----
const CRC_TABLE= (()=>{const t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c;}return t;})();
function crc32(buf){let c=-1;for(let i=0;i<buf.length;i++)c=CRC_TABLE[(c^buf[i])&255]^(c>>>8);return (c^-1)>>>0;}
function chunk(type,data){
  const len=Buffer.alloc(4);len.writeUInt32BE(data.length);
  const body=Buffer.concat([Buffer.from(type,'ascii'),data]);
  const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len,body,crc]);
}
function encodePNG(width,height,rgba){
  const stride=width*4,raw=Buffer.alloc((stride+1)*height);
  for(let y=0;y<height;y++){raw[y*(stride+1)]=0;rgba.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride);}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);
  ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:6})),chunk('IEND',Buffer.alloc(0))]);
}

// ---------------------------------------------------------------- canvas ---
class Canvas{
  constructor(w,h){this.w=w;this.h=h;this.data=Buffer.alloc(w*h*4);for(let i=0;i<w*h;i++){this.data[i*4]=26;this.data[i*4+1]=31;this.data[i*4+2]=24;this.data[i*4+3]=255;}}
  blend(x,y,[r,g,b,a=255]){
    x=Math.round(x);y=Math.round(y);
    if(x<0||y<0||x>=this.w||y>=this.h)return;
    const i=(y*this.w+x)*4,d=this.data,ai=a/255;
    d[i]=Math.round(r*ai+d[i]*(1-ai));d[i+1]=Math.round(g*ai+d[i+1]*(1-ai));d[i+2]=Math.round(b*ai+d[i+2]*(1-ai));d[i+3]=255;
  }
  disc(cx,cy,r,color){for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++){const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=r*r)this.blend(x,y,color);}}
  ring(cx,cy,r,color){for(let y=Math.floor(cy-r-2);y<=cy+r+2;y++)for(let x=Math.floor(cx-r-2);x<=cx+r+2;x++){const d=Math.hypot(x-cx,y-cy);if(d<=r&&d>=r-2.5)this.blend(x,y,color);}}
  rect(cx,cy,s,color){for(let y=Math.floor(cy-s/2);y<=cy+s/2;y++)for(let x=Math.floor(cx-s/2);x<=cx+s/2;x++)this.blend(x,y,color);}
  segment(a,b,half,color){const minX=Math.floor(Math.min(a.x,b.x)-half-1),maxX=Math.ceil(Math.max(a.x,b.x)+half+1),minY=Math.floor(Math.min(a.y,b.y)-half-1),maxY=Math.ceil(Math.max(a.y,b.y)+half+1);
    const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const t=len2?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/len2)):0;const px=a.x+t*dx,py=a.y+t*dy;if(Math.hypot(x-px,y-py)<=half)this.blend(x,y,color);}}
}

// ----------------------------------------------------------------- draw ----
const ZONE_TINT={ambush:[255,80,80,40],rubble:[160,160,160,45],ice:[120,190,255,45]};
const STAGE_COLORS=[[255,85,85],[255,210,74],[74,215,255],[255,122,217]];
const STAGE_TYPE_GLYPH={hold:'ring',escort:'ring',secure:'ring',protect:'disc',defend:'none',eliminate:'none'};

// Output directory: argv[2], or a folder outside the repository by default so
// review sheets never end up in a commit.
const outDir=process.argv[2]||new URL('../../map-review/',import.meta.url).pathname;
mkdirSync(outDir,{recursive:true});
for(const [index,mission] of CAMPAIGN.entries()){
  const map=getMap(mission.mapId),c=new Canvas(map.width,map.height);
  for(const zone of map.zones||[]){
    c.disc(zone.x,zone.y,zone.r,ZONE_TINT[zone.kind]||[200,200,120,35]);
    c.ring(zone.x,zone.y,zone.r,[220,220,220,120]);
  }
  for(let i=1;i<map.path.length;i++)c.segment(map.path[i-1],map.path[i],9,[38,44,34]);
  for(let i=1;i<map.path.length;i++)c.segment(map.path[i-1],map.path[i],7,[122,106,74]);
  c.disc(map.path[0].x,map.path[0].y,5,[240,240,240]);
  for(const d of map.deco||[]){c.disc(d.x,d.y,5,[86,88,78]);c.disc(d.x,d.y,2,[54,56,48]);}
  for(const t of map.torches||[]){c.disc(t.x,t.y,4,[255,154,60]);c.disc(t.x,t.y,1.6,[255,232,160]);}
  for(const p of map.pads){c.rect(p.x,p.y,24,[104,116,88]);c.rect(p.x,p.y,18,[50,69,45]);}
  const b=map.bunker;c.rect(b.x,b.y,30,[226,216,170]);c.rect(b.x,b.y,20,[120,110,72]);
  let marker=0;
  for(const stage of mission.stages){
    if(!Number.isFinite(stage.x))continue;
    const color=STAGE_COLORS[marker%4];
    c.disc(stage.x,stage.y,15,[250,250,250]);
    c.disc(stage.x,stage.y,12,color);
    c.disc(stage.x,stage.y,3,[24,26,22]);
    for(let pip=1;pip<=marker%4+1&&pip<5;pip++)c.disc(stage.x-6*(marker%4)/1+ (pip-1)*6-3*((marker%4)>0?1:0), stage.y+18,1.8,[250,250,250]);
    marker++;
  }
  const file=`${outDir.replace(/\/$/,'')}/${String(index+1).padStart(2,'0')}-${mission.id}.png`;
  const {writeFileSync}=await import('node:fs');
  writeFileSync(file,encodePNG(map.width,map.height,c.data));
  console.log(file.replace(outDir.replace(/\/$/,'')+'/',''),map.theme,'bunker',b.x+'/'+b.y,'stages:',mission.stages.map(s=>Number.isFinite(s.x)?`${s.x},${s.y}`:s.type).join(' | '));
}
