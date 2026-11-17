import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {drawAfkRestScene,AFK_SCENE} from '../afk-rest-scene.mjs';

// Half an hour away, the session closes, and the player comes back to a card.
// The card is the whole message, so it is worth checking: the picture is drawn
// by the game (and draws no nonsense), the words exist in both languages, and
// the card stands on the sign-in screen rather than replacing it.

// A canvas that records every call and refuses any number that is not finite -
// a NaN coordinate on a canvas is a blank picture, and a blank picture looks
// like a bug in the art rather than a bug in the arithmetic.
function stubCanvas(){
  const calls=[];
  const ctx=new Proxy({},{
    get(target,key){if(key in target)return target[key];
      return (...args)=>{assert.ok(args.every(a=>typeof a!=='number'||Number.isFinite(a)),`${String(key)} got a non-finite number`);calls.push([String(key),...args]);};},
    set(target,key,value){target[key]=value;return true;}});
  return {canvas:{getContext:()=>ctx,width:0,height:0},calls};
}

test('the scene draws, and every number it hands the canvas is real',()=>{
  const {canvas,calls}=stubCanvas();
  assert.equal(drawAfkRestScene(canvas),true,'the picture is painted');
  assert.equal(canvas.width,AFK_SCENE.width,'at the size the card expects');
  assert.equal(canvas.height,AFK_SCENE.height);
  assert.ok(calls.length>40,'and it is a scene, not a rectangle');
  // The soldier, the crate, the lantern and the ground all want the ink.
  assert.ok(calls.some(([name])=>name==='setTransform'),'drawn in card coordinates, not device pixels alone');
  assert.ok(calls.filter(([name])=>name==='stroke').length>8,'with outlines, the way the field is drawn');
});

test('it survives a canvas that cannot do gradients',()=>{
  const bare={getContext:()=>null};
  assert.equal(drawAfkRestScene(bare),false,'no context, no picture - and no crash');
  // The one feature the scene asks for and checks: a glow. Where the browser
  // cannot make one, the lantern still has to burn, so the scene falls back to
  // a flat disc instead of throwing away the whole card.
  const plain={};
  for(const name of ['setTransform','clearRect','fillRect','beginPath','moveTo','lineTo','arc','ellipse','quadraticCurveTo','closePath','fill','stroke','save','restore'])plain[name]=()=>{};
  const canvas={getContext:()=>plain,width:0,height:0};
  assert.doesNotThrow(()=>drawAfkRestScene(canvas),'a canvas without gradients still gets a picture');
  assert.equal(canvas.width,AFK_SCENE.width,'and the canvas is still sized for the card');
});

test('reduced motion drops the steam and keeps the soldier',()=>{
  const still=stubCanvas(),moving=stubCanvas();
  drawAfkRestScene(still.canvas,{reducedMotion:true});
  drawAfkRestScene(moving.canvas,{reducedMotion:false});
  assert.ok(still.calls.length>0,'the reduced picture is not empty - reduced motion is not blindness');
  assert.ok(still.calls.length<moving.calls.length,'it is quieter: no steam curling off the mug');
});

test('the card exists, and account.js can reach every part of it',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const source=readFileSync(new URL('../account.js',import.meta.url),'utf8');
  for(const id of ['afkRestDialog','afkRestArt','afkRestKicker','afkRestTitle','afkRestText','afkRestAccept']){
    assert.match(html,new RegExp(`id="${id}"`),`${id} is in the page`);
    assert.match(source,new RegExp(`\\('${id}'\\)`),`${id} is used by account.js`);
  }
  assert.match(html,/<dialog id="afkRestDialog"/,'it is a dialog, so the browser centres it');
  assert.match(html,/id="afkRestArt"[^>]*aria-hidden="true"/,'the picture is decoration: the words carry the message');
  // Both languages, in the same sentence - an untranslated card is worse than
  // a plain text line, because it promises more.
  for(const phrase of ['You were signed out after 30 minutes of inactivity','Du wurdest nach 30 Minuten Inaktivität abgemeldet','BACK TO SIGN IN','ZUR ANMELDUNG'])
    assert.match(source,new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`the card speaks German too: ${phrase}`);
});

test('dismissing the card clears the notice, so it cannot come back',()=>{
  const source=readFileSync(new URL('../account.js',import.meta.url),'utf8');
  const line=source.split('\n').find(row=>row.includes("afkRestAccept').onclick="))||'';
  const click=line.slice(line.indexOf('=')+1);
  assert.ok(click,'the button does something');
  assert.match(click,/afkRestDialog'\)\.close\(\)/,'it closes the card');
  assert.match(click,/afkNotice\(false\)/,'and clears the notice - otherwise every language change would bring it back');
  assert.match(click,/email'\)\.focus\(\)/,'leaving the player on the sign-in screen, with the cursor where it belongs');
  // The sign-in screen itself is untouched: the card is on top of it, not instead.
  assert.match(source,/function display\(view\)/,'the views are still switched by display()');
});

// Found by the Continuous Integration, and by nothing else: the card is a
// dialog, the release safety refuses to reload while any dialog is open, and the
// card is shown at the end of the idle sign-out - which is precisely when the
// version is checked again. The two deadlocked: the page could never take the
// newer build until the player dismissed the picture, and the test that waits
// for the reload timed out. The card holds no data, so it must not hold the
// reload hostage.
test('the card does not block an automatic reload',()=>{
  const source=readFileSync(new URL('../account.js',import.meta.url),'utf8');
  const guard=source.split('\n').find(row=>row.includes("dialog[open]"))||'';
  assert.ok(guard,'the release safety still refuses to reload over an open dialog');
  assert.match(guard,/dialog\[open\]:not\(#afkRestDialog\)/,'but the rest card is exempt: it survives a reload by design');
});
