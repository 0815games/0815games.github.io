import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {drawAvatarFace,avatarPortrait} from '../avatar-art.mjs';
import {defaultAvatar,randomAvatar} from '../avatar.mjs';

// A recording 2D context: counts operations and remembers colours and text.
function recorder(){
  const calls={fill:0,stroke:0,arc:0,ellipse:0,fillText:[],colors:new Set(),scale:[]};
  const ctx=new Proxy({},{get(target,key){
    if(key==='fillStyle'||key==='strokeStyle'||key==='globalAlpha')return target[key];
    if(key==='canvas')return {width:0,height:0};
    return (...args)=>{
      if(key==='fill')calls.fill++;
      else if(key==='stroke')calls.stroke++;
      else if(key==='arc'||key==='ellipse')calls[key]++;
      else if(key==='fillText')calls.fillText.push(String(args[0]));
      else if(key==='scale')calls.scale.push([...args]);
      return undefined;
    };
  },set(target,key,value){target[key]=value;if(key==='fillStyle'||key==='strokeStyle')calls.colors.add(String(value));return true;}});
  return {ctx,calls};
}

test('the face paints a full picture for every option combination',()=>{
  let seed=3;const random=()=>{seed=(seed*48271)%2147483647;return seed/2147483647;};
  for(let i=0;i<60;i++){
    const face=randomAvatar(i%2?'male':'female',random);
    const {ctx,calls}=recorder();
    drawAvatarFace(ctx,200,face);
    assert.ok(calls.ellipse>15,`ellipses drawn (${calls.ellipse})`);
    assert.ok(calls.fill>15,`fills drawn (${calls.fill})`);
    assert.deepEqual(calls.scale.at(-1),[2,2],'the design grid scales to the canvas size');
  }
});

test('the chosen colours reach the canvas',()=>{
  const {ctx,calls}=recorder();
  drawAvatarFace(ctx,200,{...defaultAvatar('female'),skin:4,hair:'long',hairColor:5});
  assert.ok(calls.colors.has('#6f4a2f'),'the skin tone paints');
  assert.ok(calls.colors.has('#3f4a3a'),'the hair colour paints');
  // The glasses extra adds its lens tint.
  const plain=recorder();drawAvatarFace(plain.ctx,200,{...defaultAvatar('female'),extra:'none'});
  const bespectacled=recorder();drawAvatarFace(bespectacled.ctx,200,{...defaultAvatar('female'),extra:'glasses'});
  assert.ok(bespectacled.calls.stroke>plain.calls.stroke,'glasses add strokes');
  // The full beard covers more than the clean jaw.
  const clean=recorder();drawAvatarFace(clean.ctx,200,{...defaultAvatar('male'),beard:'none'});
  const bearded=recorder();drawAvatarFace(bearded.ctx,200,{...defaultAvatar('male'),beard:'full'});
  assert.ok(bearded.calls.fill>clean.calls.fill,'a beard adds fills');
});

test('a broken context or size is refused, not thrown',()=>{
  const {ctx}=recorder();
  assert.doesNotThrow(()=>drawAvatarFace(null,200,defaultAvatar()));
  assert.doesNotThrow(()=>drawAvatarFace(ctx,0,defaultAvatar()));
  assert.doesNotThrow(()=>drawAvatarFace(ctx,-5,defaultAvatar()));
  assert.doesNotThrow(()=>drawAvatarFace(ctx,Number.NaN,defaultAvatar()));
  assert.doesNotThrow(()=>drawAvatarFace(ctx,200,null));
});

test('avatarPortrait renders a data URL for img consumers',()=>{
  const realDocument=globalThis.document;
  globalThis.document={createElement(){
    return {width:0,height:0,style:{},getContext(){return recorder().ctx;},toDataURL(){return 'data:image/png;base64,FACE';}};
  }};
  try{
    assert.equal(avatarPortrait(defaultAvatar('male'),192),'data:image/png;base64,FACE');
    assert.equal(avatarPortrait(defaultAvatar('female')),'data:image/png;base64,FACE');
  }finally{globalThis.document=realDocument;}
  const noCanvas={createElement(){return {width:0,height:0,style:{},getContext(){return null;}};},toDataURL(){return null;}};
  globalThis.document=noCanvas;
  try{assert.equal(avatarPortrait(defaultAvatar(),64),null,'no 2d context: no portrait, callers fall back');}
  finally{globalThis.document=realDocument;}
  globalThis.document=undefined;
  assert.equal(avatarPortrait(defaultAvatar(),64),null,'without a document there is no data URL');
});
