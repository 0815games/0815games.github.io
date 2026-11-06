import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {startIntro} from '../intro.mjs';
function fixture(reduced=false){
  const overlay={hidden:false},events=new Map(),skip={addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:(type,fn)=>{if(events.get(type)===fn)events.delete(type);}},docEvents=new Map();
  const document={getElementById:id=>id==='introOverlay'?overlay:id==='introSkip'?skip:null,addEventListener:(type,fn)=>docEvents.set(type,fn),removeEventListener:(type,fn)=>{if(docEvents.get(type)===fn)docEvents.delete(type);}};
  let delay,callback,cleared=false;const window={matchMedia:()=>({matches:reduced}),setTimeout:(fn,ms)=>{callback=fn;delay=ms;return 12;},clearTimeout:id=>{assert.equal(id,12);cleared=true;}};
  const close=startIntro({document,window});return {overlay,events,docEvents,close,finish:()=>callback(),delay,get cleared(){return cleared;}};
}
let f=fixture();assert.equal(f.delay,4300);assert.equal(f.overlay.hidden,false);f.events.get('click')();assert.equal(f.overlay.hidden,true);assert.equal(f.cleared,true);assert.equal(f.events.size,0);assert.equal(f.docEvents.size,0);f.close();
f=fixture();f.docEvents.get('keydown')({key:'Escape'});assert.equal(f.overlay.hidden,true);
f=fixture();f.finish();assert.equal(f.overlay.hidden,true);
f=fixture(true);assert.equal(f.delay,1200,'reduced-motion intro finishes sooner');f.finish();assert.equal(f.overlay.hidden,true);
assert.doesNotThrow(()=>startIntro({document:{getElementById:()=>null},window:{}}));
const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),css=await readFile(new URL('../style.css',import.meta.url),'utf8');
assert.match(html,/id="introSkip"/);assert.match(html,/intro\.mjs\?v=\d{8}-[a-z0-9]+/,'the intro module is cache-busted per release');assert.match(html,/intro\.hidden=true;\},6500\)/,'an independent fallback dismisses the intro if its module fails');assert.match(html,/if\(!window\.ironPathLoaded\)/,'connection errors remain available');assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);assert.match(css,/@keyframes intro-run/);
console.log('Intro skip, timeout, reduced motion and loading fallback tests passed.');
