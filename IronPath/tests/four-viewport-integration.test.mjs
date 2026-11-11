import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
test('experimental map uses viewport rendering and taps, then restores legacy controls',async()=>{
  const elements=new Map(),calls=[];
  const ctx=new Proxy({}, {get(target,key){return target[key]||((...args)=>calls.push([key,...args]));},set(target,key,value){target[key]=value;return true;}});
  function element(id){if(!elements.has(id))elements.set(id,{id,textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{touchAction:'pan-x'},dataset:{},scrollWidth:960,clientWidth:960,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},removeEventListener(type,fn){if(this['on'+type]===fn)delete this['on'+type];},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return elements.get(id);}
  globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:element,activeElement:{tagName:'BODY'}};globalThis.window={scrollBy(){},innerWidth:1000,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
  let frame;globalThis.requestAnimationFrame=fn=>{frame=fn;};
  let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
  for(const file of ['features.mjs','solo-deployment.mjs','workshop-run-receipt.mjs','canvas-resolution.mjs','language.mjs','map-zoom.mjs','game-localization.mjs','story-localization.mjs','soldier-motion.mjs','dialog-dismiss.mjs','focus-pause.mjs','story-cinematics.mjs','campaign.mjs','relics.mjs','story-mission.mjs','story-events.mjs','training-run.mjs','first-run-coach.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs','skills.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
  const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  let mapCalls=0;startGame({getProfile:()=>({name:'Test',gender:'female'}),getUserId:()=> 'tester',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{experimentalFourViewport:true,nextMapId:()=>mapCalls++?'road':'four-front',confirmAction:async()=>true});
  element('tutorialSkip').onclick();const canvas=element('game');assert.equal(canvas.style.touchAction,'none');
  frame(performance.now());assert.ok(calls.some(c=>c[0]==='scale'&&Math.abs(c[1]-2/3)<1e-8));assert.ok(calls.some(c=>c[0]==='rect'&&c[3]===1440&&c[4]===720));
  const event={pointerId:1,pointerType:'touch',button:0,clientX:110*2/3,clientY:255*2/3};canvas.onpointerdown(event);canvas.onpointerup(event);assert.equal(element('radialMenu').hidden,false);assert.equal(element('sheetTitle').textContent,'Build defense');
  canvas.onclick({clientX:100,clientY:100});assert.equal(element('radialMenu').hidden,false,'synthetic click does not trigger a second action');
  element('radialClose').onclick();await element('endRun').onclick();element('resultsDone').onclick();element('start').onclick();assert.equal(element('mapName').textContent,'The Last Road');assert.equal(canvas.style.touchAction,'pan-x');assert.equal(canvas.onpointerdown,undefined);canvas.onclick({clientX:105,clientY:210});assert.equal(element('radialMenu').hidden,false,'legacy click restored');
});
