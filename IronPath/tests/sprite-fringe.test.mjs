// The violet-fringe guard. The AI cutouts used to ship with a violet
// chroma-key halo baked into their semi-transparent edge (and one sprite,
// cross2, kept its whole magenta background). The 2026-11 defringe pass
// cleaned all 65 sprites; this test keeps them clean.
//
// What counts as a violation:
//   1. a sprite whose canvas is fully opaque AND mostly fringe-coloured -
//      an un-cut background (the cross2 class);
//   2. a bright violet/magenta pixel in the anti-alias skirt or the 1px
//      opaque rim that has clean artwork within 4px to borrow colour from.
//      Legitimately violet artwork (a violet uniform's own edge) has no clean
//      neighbour and does not count.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {decodePng,isBrightFringe} from './png-decode.mjs';

const assets=join(import.meta.dirname,'..','assets');
const pngs=readdirSync(assets).filter(f=>f.endsWith('.png')).sort();
const sprites=pngs.filter(f=>f.endsWith('-sprite.png'));
assert.ok(sprites.length>=60,'expected the sprite family, found '+sprites.length);

// A fringe pixel is guilty only if solid, non-fringe artwork is close enough
// to have lent it a colour. That separates halo from legitimately violet art.
function hasCleanOpaque(data,width,height,x,y){
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
    const nx=x+dx,ny=y+dy;
    if(nx<0||ny<0||nx>=width||ny>=height)continue;
    const j=(ny*width+nx)*4;
    if(data[j+3]===255&&!isBrightFringe(data[j],data[j+1],data[j+2]))return true;
  }
  return false;
}

test('every asset PNG decodes in the plain-Node decoder',()=>{
  for(const file of pngs){
    const image=decodePng(readFileSync(join(assets,file)));
    assert.ok(image.width>0&&image.height>0,file+' decodes to a real canvas');
    assert.equal(image.data.length,image.width*image.height*4,file+' has complete RGBA data');
  }
});

test('no sprite ships an un-cut background',()=>{
  for(const file of sprites){
    const {width,height,data}=decodePng(readFileSync(join(assets,file)));
    let transparent=0,fringe=0;
    for(let i=0;i<data.length;i+=4){
      if(data[i+3]===0)transparent++;
      else if(isBrightFringe(data[i],data[i+1],data[i+2]))fringe++;
    }
    // A fully opaque canvas that is mostly fringe colour is a background that
    // was never keyed away - the sprite draws as a coloured box on the field.
    assert.ok(!(transparent===0&&fringe>width*height*0.5),
      `${file}: fully opaque with ${Math.round(100*fringe/(width*height))}% fringe colour - background not removed`);
  }
});

test('sprite silhouettes carry no visible violet fringe',()=>{
  const budget=30; // pixels: the 2026-11 pass left <=22 per sprite
  for(const file of sprites){
    const {width,height,data}=decodePng(readFileSync(join(assets,file)));
    const alphaAt=(x,y)=>x<0||y<0||x>=width||y>=height?0:data[(y*width+x)*4+3];
    let guilty=[];
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4,a=data[i+3];
      if(a===0)continue;
      if(!isBrightFringe(data[i],data[i+1],data[i+2]))continue;
      // Only the silhouette edge: the anti-alias skirt and the opaque rim.
      if(a===255&&!(alphaAt(x-1,y)<255||alphaAt(x+1,y)<255||alphaAt(x,y-1)<255||alphaAt(x,y+1)<255))continue;
      if(hasCleanOpaque(data,width,height,x,y))guilty.push([x,y]);
    }
    assert.ok(guilty.length<=budget,
      `${file}: ${guilty.length} fringe pixels at the silhouette (first: ${JSON.stringify(guilty.slice(0,3))}) - defringe the sprite`);
  }
});
