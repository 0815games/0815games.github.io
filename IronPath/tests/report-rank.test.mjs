import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {reportRank} from '../report-promotion.mjs';
import {rankForLevel} from '../rank-insignia.mjs';
import {characterProgress} from '../progression.mjs';
import {createMatch} from '../simulation.mjs';
import {createPlayer,applyCommand} from '../match.mjs';

// The rank line of the after-action report.
//
// The rule is the report's, not the ranks': which one the uniform shows, and
// whether this operation changed it. Thresholds are Recruit 1, Private 3,
// Sergeant 6, Lieutenant 10, Captain 15 - and levels alone are not a promotion.
const XP={l5:2900,l6:3000,l10:8100,l15:17850}; // totals the curve reaches those levels at

test('the rank follows the level exactly where the thresholds sit',()=>{
  assert.equal(reportRank({xp:0}).rank.id,'recruit');
  assert.equal(reportRank({xp:XP.l5}).rank.id,'private','still a Private one level below Sergeant');
  assert.equal(reportRank({xp:XP.l6}).rank.id,'sergeant');
  assert.equal(reportRank({xp:XP.l10}).rank.id,'lieutenant');
  assert.equal(reportRank({xp:XP.l15}).rank.id,'captain');
  assert.equal(reportRank({xp:XP.l15*4}).rank.id,'captain','the last rank is a home, not a ceiling');
  for(const xp of Object.values(XP))assert.equal(reportRank({xp}).rank.id,rankForLevel(characterProgress(xp).level).id);
  assert.equal(reportRank({xp:XP.l15}).next,null,'nothing is dangled above the last rank');
  assert.equal(reportRank({xp:XP.l6}).next.min,10,'and the next one is named where it is reachable');
});

test('a promotion is a crossed threshold, not a gained level',()=>{
  assert.equal(reportRank({xp:XP.l6,levelsGained:1}).promoted,true,'Private 5 to Sergeant 6');
  assert.equal(reportRank({xp:XP.l6,levelsGained:1}).previous.id,'private');
  assert.equal(reportRank({xp:XP.l5,levelsGained:1}).promoted,false,'level 4 to 5 stays Private');
  assert.equal(reportRank({xp:XP.l6,levelsGained:0}).promoted,false,'the rank was already earned before this run');
  assert.equal(reportRank({xp:XP.l6,levelsGained:5}).promoted,true);
  // Garbage never promotes. A missing or unreadable count is zero levels, not a
  // lifetime guess: the report would otherwise claim a rank nobody confirmed.
  for(const levelsGained of [undefined,null,NaN,Infinity,-3,'2',0.9,{},[]])assert.equal(reportRank({xp:XP.l6,levelsGained}).promoted,false);
  assert.equal(reportRank({xp:XP.l6,levelsGained:1.9}).promoted,true,'a whole level is a whole level');
});

test('nothing but a confirmed total produces a rank line',()=>{
  for(const xp of [undefined,null,NaN,Infinity,-1,1.5,'3000',{}])assert.equal(reportRank({xp}),null);
  assert.equal(reportRank(),null);
  assert.deepEqual(Object.keys(reportRank({xp:XP.l6})).sort(),['current','level','next','previous','promoted','rank','required']);
});

// The report itself, rendered. The rank is presentation; the numbers behind it
// are the deltas of committed saves, so a pending reward cannot promote anybody.
async function setup(){
 const nodes=new Map(),ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
 function el(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},children:[],scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},removeAttribute(){},toggleAttribute(){},replaceChildren(...children){this.children=children;},get childElementCount(){return this.children.length;},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return nodes.get(id);}
 globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:el,createElement:()=>({toggleAttribute(){}}),activeElement:{tagName:'BODY'}};
 globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,confirm:()=>true,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
 globalThis.requestAnimationFrame=()=>1;
 let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
 for(const file of ['features.mjs','solo-deployment.mjs','workshop-run-receipt.mjs','canvas-resolution.mjs','language.mjs','map-zoom.mjs','game-localization.mjs','story-localization.mjs','soldier-motion.mjs','dialog-dismiss.mjs','focus-pause.mjs','story-cinematics.mjs','campaign.mjs','relics.mjs','story-mission.mjs','story-events.mjs','training-run.mjs','first-run-coach.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','battle-xp-hud.mjs','tower-upgrade-cue.mjs','tower-specialization.mjs','report-promotion.mjs','rank-insignia.mjs','ability-hud.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs','field-notice.mjs','map-intro.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
 source=source.replace(/'\.\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
 const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const match=createMatch(['alice','bob'].map(id=>createPlayer(id,{name:id,gender:'female'})));match.hostId='alice';match.players.alice.completedWaveMask=3;
 let tick=9,partyEnd=null;const commands=[],frames=[];
 const snapshot=()=>({match:structuredClone(match),tick,partyEnd:partyEnd&&structuredClone(partyEnd)});
 const game=startGame({getProfile:()=>({name:'Alice',gender:'female',xp:0}),getUserId:()=>'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=>'road',deferTutorial:true,confirmAction:async()=>true});
 const factory=o=>({start(){o.onSnapshot(snapshot());o.onStatus(true);},stop(){},canRequestHostEnd:()=>true,async command(command){commands.push(command);if(command.type==='acknowledgePartyEnd')return {ok:true};if(command.type==='finishParty'){if(!match.ended)return {ok:false};partyEnd??={tick:++tick,acknowledged:[]};o.onSnapshot(snapshot());return {ok:true};}const result=applyCommand(match,'alice',command);if(command.type==='endRun'&&result.ok)partyEnd={tick:++tick,acknowledged:[]};o.onSnapshot(snapshot());return result;}});
 assert.equal(game.beginCoop(factory,()=>{},'party-one','coop',frame=>frames.push(frame)),true);
 return {game,el:el};
}

async function finish(game,xp,levels){
  assert.equal(await game.requestHostPartyEnd('party-one'),true);
  game.recordCoopReward('party-one','saved',{delta:{xp,scrap:0,items:[],levels,unlocks:[]},profile:{xp}});
}

test('the report shows the rank next to the level and shouts only for a real promotion',async()=>{
  const f=await setup();
  await finish(f.game,XP.l6,0);
  assert.equal(f.el('resultsProgressLevel').textContent,'LEVEL 6');
  assert.equal(f.el('resultsRankName').textContent,'Sergeant','the rank is written out next to the level');
  assert.equal(f.el('resultsRank').hidden,false);
  assert.match(f.el('resultsRankInsignia').innerHTML,/^<svg /,'and carries its mark');
  assert.equal(f.el('resultsPromotion').hidden,true,'a rank already earned before the run is not a promotion');

  const g=await setup();
  await finish(g.game,XP.l6,1);
  assert.equal(g.el('resultsProgressLevel').textContent,'LEVEL 6');
  assert.equal(g.el('resultsRankName').textContent,'Sergeant');
  assert.equal(g.el('resultsPromotion').hidden,false,'this run crossed the threshold');
  assert.equal(g.el('resultsPromotionRank').textContent,'Sergeant','the new rank is named');
  assert.match(g.el('resultsPromotionInsignia').innerHTML,/^<svg /,'and shown');
  assert.equal(g.el('resultsPromotionFrom').textContent,'Previously Private.');

  const h=await setup();
  await finish(h.game,XP.l5,1);
  assert.equal(h.el('resultsRankName').textContent,'Private');
  assert.equal(h.el('resultsPromotion').hidden,true,'a level without a new rank stays quiet');
});

test('the outlook moved into the collapsible report and the results stayed on top',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const details=html.match(/<details class="debrief-details">[\s\S]*?<\/details>/);
  assert.ok(details,'the report still has one expandable area');
  assert.match(details[0],/class="results-next"/,'WHAT’S NEXT opens with the details, not above them');
  assert.match(details[0],/id="resultsNext"/);
  assert.doesNotMatch(details[0],/id="resultsUnlocks"/,'the earned unlocks are a result, not an outlook');
  // The results that stay visible: rewards and progress come before the details.
  const body=html.match(/<div class="debrief-body">[\s\S]*?<div class="results-actions">/)[0];
  assert.ok(body.indexOf('id="resultsUnlocks"')<body.indexOf('<details'),'unlocks are read before anything is expanded');
  assert.ok(body.indexOf('resultsProgressSection')<body.indexOf('<details'),'soldier progress is read before anything is expanded');
  assert.ok(body.indexOf('id="resultsPromotion"')<body.indexOf('<details'),'so is the promotion');
  assert.doesNotMatch(body.slice(0,body.indexOf('<details')),/class="results-next"/);
});
