import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {existsSync,readdirSync} from 'node:fs';
import {layerOptions,composePortrait,layerTransform,facePortrait} from '../avatar-layers.mjs';
import {FACES,HAIRS,BEARDS} from '../assets/layers/manifest.mjs';

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

const fakeImage=(file)=>({naturalWidth:1024,naturalHeight:1024,file});
const fakeLoader=(files)=>(src)=>{for(const [name,image] of Object.entries(files))if(src.startsWith(name))return Promise.resolve(image);return Promise.reject(new Error('no such layer: '+src));};

test('the manifest ships only well-formed layers whose files exist',()=>{
  assert.equal(FACES.length,13,'every painted portrait in the game is a face: seven female + six male');
  assert.equal(FACES.filter(f=>f.gender==='female').length,7);
  assert.equal(FACES.filter(f=>f.gender==='male').length,6);
  for(const layer of [...FACES,...HAIRS,...BEARDS]){
    assert.match(layer.file,/^assets\/(portraits|layers)\//,'asset path is repo-relative');
    assert.ok(existsSync(new URL('../'+layer.file.split('?')[0],import.meta.url)),'file exists: '+layer.file);
    assert.ok(layer.face.cx>0&&layer.face.cx<1&&layer.face.cy>0&&layer.face.cy<1&&layer.face.size>0&&layer.face.size<1,'face box in range: '+layer.id);
  }
  assert.ok(BEARDS.every(b=>b.gender==='male'),'beards are a male-only row');
  // The first braid edit (66% of the image changed) was rejected by the
  // pipeline's coverage gate; the second attempt passed and ships.
  assert.ok(HAIRS.some(h=>h.id==='braid'),'the braid overlay ships (retry passed the gate)');
});

test('the rows: equal option counts for women and men (reported parity request)',()=>{
  const female=layerOptions('female');
  const male=layerOptions('male');
  assert.equal(female.faces.length,7,'seven female faces');
  assert.equal(male.faces.length,6,'six male faces');
  assert.equal(female.hairs.length,6,'six female hair overlays (braid, bun, curly included)');
  assert.equal(male.hairs.length,3);
  assert.equal(female.beards.length,0,'no beard row for women');
  assert.equal(male.beards.length,3);
  // total tiles per gender: women 7+1+6 = men 6+1+3+1+3 = 14
  const femaleTiles=female.faces.length+female.hairs.length+1;
  const maleTiles=male.faces.length+male.hairs.length+1+male.beards.length+1;
  assert.equal(femaleTiles,maleTiles,'same number of choices for both genders');
  assert.equal(femaleTiles,14,'fourteen tiles each');
});

test('no painted portrait is left behind: every file in the folder is a pickable face',()=>{
  // Eight finished portraits sat in the folder that only the legacy mapping
  // could still reach - shipped art nobody could choose. The operator asked for
  // more looks, so the folder and the picker must never drift apart again.
  const folder=readdirSync(new URL('../assets/portraits',import.meta.url)).filter(name=>name.endsWith('.jpg')).sort();
  const shipped=FACES.map(face=>face.file.split('?')[0].split('/').pop()).sort();
  assert.deepEqual(shipped,folder,'every portrait file is a face, and every face has a file');
  // Ids are unique per gender and every face carries a label and a face box.
  for(const gender of ['female','male']){
    const {faces}=layerOptions(gender);
    assert.equal(new Set(faces.map(face=>face.id)).size,faces.length,`${gender} face ids are unique`);
    assert.deepEqual(faces.map(face=>face.label),faces.map((face,index)=>`Face ${index+1}`),`${gender} faces are numbered in order`);
  }
  // The flat-haired base stays first per gender: that is the cut every hair
  // overlay covers cleanly, and it is what "no hair" shows.
  assert.equal(layerOptions('female').faces[0].id,'crop');
  assert.equal(layerOptions('male').faces[0].id,'buzz');
});

test('layerTransform maps the overlay face box exactly onto the target face box',()=>{
  // Hand-computed: overlay face sits at (0.5, 0.4) covering 40% of a
  // 1024px image; target face at (0.5, 0.5) covering 50% of a 200px canvas.
  const rect=layerTransform({cx:.5,cy:.5,size:.5},{cx:.5,cy:.4,size:.4},200,1024,1024);
  assert.ok(rect,'a transform is returned');
  const scale=rect.w/1024;
  assert.equal(rect.w,250,'overlay width scales by target/ref face size (0.5/0.4 * 200)');
  assert.equal(rect.h,250,'aspect is preserved');
  // the overlay's face center lands on the target's face center:
  assert.ok(Math.abs((.5*1024)*scale+rect.dx-.5*200)<1e-9,'x centers coincide');
  assert.ok(Math.abs((.4*1024)*scale+rect.dy-.5*200)<1e-9,'y centers coincide');
  assert.equal(layerTransform(null,{cx:.5},100,10,10),null,'no target means no transform');
});

function canvasOf({ctx}){
  return {width:0,height:0,getContext:()=>ctx};
}

test('composePortrait draws base, then hair, then beard - and clamps stale ids',async ()=>{
  const rec=recorder();
  const {ctx,calls}=rec;
  const files={};
  for(const face of FACES)files[face.file]=fakeImage(face.file);
  for(const layer of [...HAIRS,...BEARDS])files[layer.file]=fakeImage(layer.file);
  const hair=HAIRS.find(h=>h.gender==='male');
  const beard=BEARDS[0];
  const result=await composePortrait(canvasOf(rec),{gender:'male',faceId:'buzz',hairId:hair.id,beardId:beard.id},240,{loadImage:fakeLoader(files)});
  assert.equal(calls.cleared,1,'the canvas starts clean');
  assert.equal(calls.drawImages.length,3,'base + hair + beard');
  assert.equal(result.hairId,hair.id);
  assert.equal(result.beardId,beard.id);
  // base first: full-canvas draw
  assert.deepEqual(calls.drawImages[0].slice(1),[0,0,240,240]);
  // stale save with ids that no longer exist clamps instead of breaking
  const clamped=await composePortrait(canvasOf(rec),{gender:'male',faceId:'gone',hairId:'nonsense',beardId:'nope'},240,{loadImage:fakeLoader(files)});
  assert.equal(clamped.faceId,layerOptions('male').faces[0].id,'unknown face falls back to the first');
  assert.equal(clamped.hairId,null,'unknown hair falls back to the base cut');
  assert.equal(clamped.beardId,null,'unknown beard falls back to no beard');
  // female selection never draws a beard
  const female=layerOptions('female');
  const before=calls.drawImages.length;
  await composePortrait(canvasOf(rec),{gender:'female',faceId:female.faces[0].id,hairId:female.hairs[0].id,beardId:'full'},240,{loadImage:fakeLoader(files)});
  assert.equal(calls.drawImages.length-before,2,'female draws base + hair only');
});

test('facePortrait returns the base face file for sync callers',()=>{
  assert.match(facePortrait({gender:'male',faceId:'buzz'}),/^assets\/portraits\/m-buzz\.jpg\?v=/,'the male base face');
  assert.match(facePortrait({gender:'female',faceId:'bun'}),/^assets\/portraits\/f-bun\.jpg\?v=/,'the second female face');
  assert.match(facePortrait({gender:'female'}),/^assets\/portraits\/f-crop\.jpg\?v=/,'an unknown face id falls back to the first of the gender');
  assert.equal(facePortrait(null),null,'no avatar means no URL');
});
