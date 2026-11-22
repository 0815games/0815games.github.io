import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {existsSync,readdirSync} from 'node:fs';
import {layerOptions,composePortrait,layerTransform,facePortrait,tintTone,stopsForColor} from '../core/avatar-layers.mjs';
import {FACES,HAIRS,BEARDS,HAIR_COLORS} from '../assets/layers/manifest.mjs';

function recorder(){
  const calls={drawImages:[],cleared:0};
  const ctx=new Proxy({canvas:{}},{get(target,key){
    if(key in target)return target[key];
    return (...args)=>{
      if(key==='drawImage')calls.drawImages.push(args);
      else if(key==='clearRect')calls.cleared++;
      return undefined;
    };
  }});
  return {ctx,calls};
}

const fakeImage=(file)=>({naturalWidth:512,naturalHeight:512,file});
const fakeLoader=(files)=>(src)=>{for(const [name,image] of Object.entries(files))if(src.startsWith(name))return Promise.resolve(image);return Promise.reject(new Error('no such layer: '+src));};

test('the manifest ships 12 aligned base heads, 17 hairs, 6 beards and 5 tint palettes',()=>{
  assert.equal(FACES.length,12,'six female + six male bald/clean-shaven base heads');
  assert.equal(FACES.filter(f=>f.gender==='female').length,6);
  assert.equal(FACES.filter(f=>f.gender==='male').length,6);
  assert.equal(HAIRS.filter(h=>h.gender==='female').length,9);
  assert.equal(HAIRS.filter(h=>h.gender==='male').length,8);
  assert.equal(BEARDS.length,6);
  assert.equal(HAIR_COLORS.length,5);
  for(const layer of [...FACES,...HAIRS,...BEARDS]){
    assert.match(layer.file,/^assets\/(portraits|layers)\//);
    assert.ok(existsSync(new URL('../'+layer.file.split('?')[0],import.meta.url)),'file exists: '+layer.file);
    assert.ok(layer.face.cx>0&&layer.face.cx<1&&layer.face.cy>0&&layer.face.cy<1&&layer.face.size>0&&layer.face.size<1);
  }
  assert.ok(BEARDS.every(b=>b.gender==='male'));
});

test('every shipped portrait file is in FACES and every face id is unique and ordered',()=>{
  const folder=readdirSync(new URL('../assets/portraits',import.meta.url)).filter(name=>name.endsWith('.jpg')).sort();
  const shipped=FACES.map(face=>face.file.split('?')[0].split('/').pop()).sort();
  assert.deepEqual(shipped,folder,'every portrait file in assets/portraits is a pickable face');
  for(const gender of ['female','male']){
    const {faces}=layerOptions(gender);
    assert.equal(new Set(faces.map(f=>f.id)).size,faces.length);
    assert.deepEqual(faces.map(f=>f.label),faces.map((_f,i)=>`Face ${i+1}`));
  }
});

test('tintTone maps luminance cleanly across all 5 palettes without clipping',()=>{
  for(const color of HAIR_COLORS){
    const stops=stopsForColor(color.id);
    const dark=tintTone(0,stops),mid=tintTone(128,stops),bright=tintTone(255,stops);
    assert.ok(dark[0]<bright[0]&&dark[1]<bright[1]&&dark[2]<bright[2],`monotonic brightness for ${color.id}`);
    assert.ok(mid.every(c=>c>=0&&c<=255));
  }
  assert.deepEqual(stopsForColor('unknown'),stopsForColor('brown'),'unknown color falls back to brown');
});

test('layerTransform maps the overlay face box exactly onto the target face box',()=>{
  const rect=layerTransform({cx:.5,cy:.5,size:.5},{cx:.5,cy:.4,size:.4},200,512,512);
  assert.ok(rect);
  const scale=rect.w/512;
  assert.equal(rect.w,250);
  assert.ok(Math.abs((.5*512)*scale+rect.dx-.5*200)<1e-9);
  assert.ok(Math.abs((.4*512)*scale+rect.dy-.5*200)<1e-9);
  assert.equal(layerTransform(null,{cx:.5},100,10,10),null);
});

function canvasOf({ctx}){
  return {width:0,height:0,getContext:()=>ctx};
}

test('composePortrait draws base, then hair, then beard, clamps stale ids, and guards async races',async ()=>{
  const rec=recorder();
  const {calls}=rec;
  const files={};
  for(const face of FACES)files[face.file]=fakeImage(face.file);
  for(const layer of [...HAIRS,...BEARDS])files[layer.file]=fakeImage(layer.file);
  const hair=HAIRS.find(h=>h.gender==='male');
  const beard=BEARDS[0];
  const canvas=canvasOf(rec);
  const result=await composePortrait(canvas,{gender:'male',faceId:'m1',hairId:hair.id,beardId:beard.id,colorId:'auburn'},240,{loadImage:fakeLoader(files)});
  assert.equal(calls.cleared,1);
  assert.equal(calls.drawImages.length,3,'base + hair + beard');
  assert.equal(result.hairId,hair.id);
  assert.equal(result.beardId,beard.id);
  assert.equal(result.colorId,'auburn');
  assert.deepEqual(calls.drawImages[0].slice(1),[0,0,240,240]);

  const clamped=await composePortrait(canvas,{gender:'male',faceId:'gone',hairId:'nonsense',beardId:'nope',colorId:'neon'},240,{loadImage:fakeLoader(files)});
  assert.equal(clamped.faceId,'m1');
  assert.equal(clamped.hairId,null);
  assert.equal(clamped.beardId,null);
  assert.equal(clamped.colorId,'brown');

  // Async race guard: an earlier slower render must NOT overwrite a newer fast render!
  let resolveSlow;
  const slowLoader=src=>src.includes('m-head-02')
    ?new Promise(r=>{resolveSlow=()=>r(fakeImage(src));})
    :Promise.resolve(fakeImage(src));
  const drawsBefore=calls.drawImages.length;
  const slow=composePortrait(canvas,{gender:'male',faceId:'m2',hairId:hair.id},240,{loadImage:slowLoader});
  const fast=await composePortrait(canvas,{gender:'male',faceId:'m3',hairId:null},240,{loadImage:slowLoader});
  assert.equal(fast.faceId,'m3');
  const drawsAfterFast=calls.drawImages.length;
  assert.equal(drawsAfterFast-drawsBefore,1,'only fast draw ran');
  resolveSlow();
  const staleResult=await slow;
  assert.equal(staleResult,null,'stale composition aborted cleanly');
  assert.equal(calls.drawImages.length,drawsAfterFast,'stale render never painted over newer portrait');
});

test('facePortrait returns the base face file for sync callers',()=>{
  assert.match(facePortrait({gender:'male',faceId:'m1'}),/^assets\/portraits\/m-head-01\.jpg\?v=/);
  assert.match(facePortrait({gender:'female',faceId:'f2'}),/^assets\/portraits\/f-head-02\.jpg\?v=/);
  assert.match(facePortrait({gender:'female'}),/^assets\/portraits\/f-head-01\.jpg\?v=/);
  assert.equal(facePortrait(null),null);
});
