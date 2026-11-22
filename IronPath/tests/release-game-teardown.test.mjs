import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';

// Exercise the real game closure with a small DOM and transport, not Firebase.
// The guarded browser/emulator test covers the account-to-fence integration.
test('one-way release teardown stops the frame loop and multiplayer transport',async()=>{
 const nodes=new Map(),ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
 function el(id){
  if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},
   scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},
   addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},
   getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});
  return nodes.get(id);
 }
 const removed=[];
 globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},removeEventListener:type=>removed.push(`document:${type}`),
  querySelector:()=>null,getElementById:el,activeElement:{tagName:'BODY'}};
 globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}}),
  addEventListener(){},removeEventListener:type=>removed.push(`window:${type}`)};
 let frame,scheduled=0;const cancelled=[];
 globalThis.requestAnimationFrame=fn=>{frame=fn;return ++scheduled;};
 globalThis.cancelAnimationFrame=id=>cancelled.push(id);
 let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
 for(const file of ['core/features.mjs','core/solo-deployment.mjs','workshop/workshop-run-receipt.mjs','core/canvas-resolution.mjs','language.mjs','core/map-zoom.mjs','core/game-localization.mjs','core/story-localization.mjs','core/soldier-motion.mjs','ui/dialog-dismiss.mjs','core/focus-pause.mjs','core/story-cinematics.mjs','core/campaign.mjs','core/relics.mjs','core/story-mission.mjs','core/story-events.mjs','core/training-run.mjs','ui/first-run-coach.mjs','core/four-game-view.mjs','battle/battle-viewport-controller.mjs','battle/battle-viewport.mjs','core/run-results.mjs','core/coop-motion.mjs','core/boss-mechanics.mjs','battle/battle-sound.mjs','core/run-perks.mjs','core/terrain.mjs','core/maps.mjs','core/combat-fx.mjs','core/cartoon-art.mjs','core/match.mjs','core/combat.mjs','core/progression.mjs','battle/battle-xp-hud.mjs','core/tower-upgrade-cue.mjs','core/tower-specialization.mjs','core/tower-class-paths.mjs','ui/development-ui.mjs','core/report-promotion.mjs','core/rank-insignia.mjs','core/ground-tracks.mjs','ui/ability-hud.mjs','core/simulation.mjs','core/tutorial.mjs','core/coop-config.mjs','core/coop-client.mjs','core/coop-input.mjs','ui/field-notice.mjs','ui/map-intro.mjs'])
  source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
 source=source.replace(/'\.\/core\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../core/skills.mjs',import.meta.url).href));
 const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const account={getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,
  getLevel:()=>1,onSessionChange(){},awardXP(){}};
 const game=startGame(account,{nextMapId:()=> 'road',deferTutorial:true});
 let transportStops=0;
 const factory=()=>({start(){},stop(){transportStops++;return Promise.resolve();},command:async()=>({ok:true})});
 assert.equal(game.beginCoop(factory),true);assert.equal(game.isOnlineMatch(),true);
 const lastFrame=frame,lastHandle=scheduled;
 game.stopForRelease();
 assert.equal(transportStops,1);assert.equal(game.isOnlineMatch(),false);assert.deepEqual(cancelled,[lastHandle]);
 assert.ok(removed.includes('window:blur'));assert.ok(removed.includes('window:focus'));assert.ok(removed.includes('document:visibilitychange'));
 // A queued callback that escaped cancellation must not draw or re-arm itself.
 lastFrame(performance.now()+100);assert.equal(scheduled,lastHandle);
 assert.equal(game.beginCoop(factory),false);assert.equal(game.startTrainingRun(),false);
 game.stopForRelease();assert.equal(transportStops,1);assert.deepEqual(cancelled,[lastHandle]);
});
