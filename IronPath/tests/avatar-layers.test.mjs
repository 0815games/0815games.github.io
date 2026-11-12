import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {existsSync,readFileSync} from 'node:fs';
import {layerOptions,composePortrait,layerTransform,legacyLook} from '../avatar-layers.mjs';
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
  assert.equal(FACES.length,5,'three female + two male faces');
  assert.equal(FACES.filter(f=>f.gender==='female').length,3,'three female faces (parity request)');
  assert.equal(FACES.filter(f=>f.gender==='male').length,2);
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
  assert.equal(female.faces.length,3,'three female faces');
  assert.equal(male.faces.length,2);
  assert.equal(female.hairs.length,6,'six female hair overlays (braid, bun, curly included)');
  assert.equal(male.hairs.length,3);
  assert.equal(female.beards.length,0,'no beard row for women');
  assert.equal(male.beards.length,3);
  // total tiles per gender: women 3+1+6 = men 2+1+3+1+3 = 10
  const femaleTiles=female.faces.length+female.hairs.length+1;
  const maleTiles=male.faces.length+male.hairs.length+1+male.beards.length+1;
  assert.equal(femaleTiles,maleTiles,'same number of choices for both genders');
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

test('every legacy look maps to a combination that still exists',async ()=>{
  const {ctx}=recorder();
  const files={};
  for(const face of FACES)files[face.file]=fakeImage(face.file);
  for(const layer of [...HAIRS,...BEARDS])files[layer.file]=fakeImage(layer.file);
  for(const gender of ['female','male']){
    const looks=gender==='female'?6:6;
    for(let look=0;look<looks;look++){
      const mapped=legacyLook({gender,look});
      assert.equal(mapped.gender,gender);
      const composed=await composePortrait(canvasOf({ctx}),mapped,120,{loadImage:fakeLoader(files)});
      assert.ok(composed,'legacy look '+gender+'#'+look+' composes');
      assert.equal(composed.faceId,mapped.faceId);
      assert.equal(composed.hairId,mapped.hairId);
      assert.equal(composed.beardId,mapped.beardId);
    }
  }
  // the old stubble and full-beard looks survive as beard choices
  assert.equal(legacyLook({gender:'male',look:4}).beardId,'stubble');
  assert.equal(legacyLook({gender:'male',look:5}).beardId,'full');
});

test('the preview page is wired to the engine and stays out of search indexes',()=>{
  const html=readFileSync(new URL('../recruit-preview.html',import.meta.url),'utf8');
  assert.match(html,/name="robots" content="noindex"/,'preview is noindex');
  assert.match(html,/avatar-layers\.mjs\?v=/,'the preview uses the layer engine');
  assert.match(html,/dog-tag-art\.mjs\?v=/,'the preview shows the procedural dog tag');
  assert.doesNotMatch(html,/firebase|account\.js/,'the preview runs without login');
});
