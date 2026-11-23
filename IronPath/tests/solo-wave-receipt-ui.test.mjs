import {test} from 'node:test';import {strict as assert} from 'node:assert';import {readFile} from 'node:fs/promises';
import {applySoloWaveReward} from '../workshop/workshop-solo-reward.mjs';
import {initializeWireWorkshop} from '../workshop/workshop-wire.mjs';

// Endless solo must send a per-run receipt to the account transaction only when
// the gated workshop alpha is enabled. A retried/replayed wave report must not be
// credited twice, and campaign must keep the legacy additive path.
async function boot(experimentalWorkshop){
 const nodes=new Map(),ctx=new Proxy({},{get:()=>()=>{},set:()=>true});let frame;
 function el(id){if(!nodes.has(id))nodes.set(id,{id,value:'',textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,right:960,top:0,bottom:540,width:960,height:540};},width:960,height:540});return nodes.get(id);}
 globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:el,activeElement:{tagName:'BODY'}};
 globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
 globalThis.requestAnimationFrame=fn=>{frame=fn;};
 let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
 for(const file of ['core/features.mjs','core/solo-deployment.mjs','workshop/workshop-run-receipt.mjs','core/canvas-resolution.mjs','language.mjs','core/map-zoom.mjs','core/game-localization.mjs','core/story-localization.mjs','core/soldier-motion.mjs','ui/dialog-dismiss.mjs','core/focus-pause.mjs','core/story-cinematics.mjs','core/campaign.mjs','core/relics.mjs','core/campaign-prestige.mjs','core/campaign-pressure.mjs','core/story-mission.mjs','core/story-events.mjs','core/training-run.mjs','ui/first-run-coach.mjs','core/four-game-view.mjs','battle/battle-viewport-controller.mjs','battle/battle-viewport.mjs','core/run-results.mjs','core/coop-motion.mjs','core/boss-mechanics.mjs','battle/battle-sound.mjs','core/run-perks.mjs','core/terrain.mjs','core/maps.mjs','core/combat-fx.mjs','core/cartoon-art.mjs','core/match.mjs','core/combat.mjs','core/progression.mjs','battle/battle-xp-hud.mjs','core/tower-upgrade-cue.mjs','core/tower-specialization.mjs','core/tower-class-paths.mjs','ui/development-ui.mjs','core/report-promotion.mjs','core/rank-insignia.mjs','core/ground-tracks.mjs','ui/ability-hud.mjs','core/simulation.mjs','core/tutorial.mjs','core/coop-config.mjs','core/coop-client.mjs','core/coop-input.mjs','ui/field-notice.mjs','ui/map-intro.mjs','core/hit-feedback.mjs','ui/boss-banner.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
 source=source.replace(/'\.\/core\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../core/skills.mjs',import.meta.url).href));
 // Replace only the first wave's completion event with a deterministic one.
 source=source.replace('for(const event of stepMatch(state))','for(const event of globalThis.__testStep(state))');
 globalThis.__testStep=state=>{if(state.__sent)return [];state.__sent=true;state.wave=1;return [{type:'waveCleared',wave:1,xp:30,victory:false}];};
 let profile=initializeWireWorkshop({name:'Alice',gender:'female',xp:0,armory:{scrap:0,fortify:0,plating:0,owned:0,equipped:0}});
 const calls=[],ledger={};
 const account={getProfile:()=>profile,getUserId:()=>'alice',getLevel:()=>1,isReady:()=>true,onSessionChange(){},canChooseSolo:()=>true,recordScore(){},
  async awardXP(amount,wave,runId){calls.push({amount,wave,runId});const next=runId?applySoloWaveReward(ledger.latest??profile,{runId,wave}):(()=>{const next={...profile,xp:profile.xp+amount};return next;})();ledger.latest=next??ledger.latest;return {committed:!!next,profile:next,delta:{xp:next?.xp??0,scrap:10,items:[],levels:0,unlocks:[]}};},
  async saveCampaign(){return {committed:true,profile};}};
 const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const game=startGame(account,{nextMapId:()=>'road',confirmAction:async()=>true,experimentalWorkshop,deferTutorial:true});
 el('tutorialSkip').onclick?.();
 return {game,el,calls,frame:()=>frame(performance.now()+200),ledger};
}

test('gated endless solo sends one per-run receipt and never credits a replay twice',async()=>{
 const ui=await boot(true);
 assert.equal(ui.game.getSoloMode(),'endless');
 ui.frame();
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(ui.calls.length,1,'one wave completion sends one account call');
 const [{wave,runId}]=ui.calls;assert.equal(wave,1);assert.match(runId,/^[a-f0-9]{32}$/);
 const first=ui.ledger.latest;assert.equal(first.xp,30);
 assert.equal(applySoloWaveReward(first,{runId,wave}),null,'replaying the same report earns nothing');
});

test('live endless solo without the alpha keeps legacy saving and no receipt',async()=>{
 const ui=await boot(false);
 ui.frame();
 await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(ui.calls.length,1);assert.equal(ui.calls[0].runId,null,'the live game must not write workshop receipt fields');
});
