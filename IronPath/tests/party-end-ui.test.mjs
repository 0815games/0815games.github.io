import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {createMatch} from '../core/simulation.mjs';
import {createPlayer,applyCommand} from '../core/match.mjs';

async function setup(){
 const nodes=new Map(),ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
 function el(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},children:[],scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},removeAttribute(){},toggleAttribute(){},replaceChildren(...children){this.children=children;},get childElementCount(){return this.children.length;},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return nodes.get(id);}
 globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:el,createElement:()=>({toggleAttribute(){}}),activeElement:{tagName:'BODY'}};
 globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,confirm:()=>true,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
 globalThis.requestAnimationFrame=()=>1;
 let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
 for(const file of ['core/features.mjs','core/solo-deployment.mjs','workshop/workshop-run-receipt.mjs','core/canvas-resolution.mjs','language.mjs','core/map-zoom.mjs','core/game-localization.mjs','core/story-localization.mjs','core/soldier-motion.mjs','ui/dialog-dismiss.mjs','core/focus-pause.mjs','core/story-cinematics.mjs','core/campaign.mjs','core/relics.mjs','core/campaign-prestige.mjs','core/campaign-pressure.mjs','core/story-mission.mjs','core/story-events.mjs','core/training-run.mjs','ui/first-run-coach.mjs','core/four-game-view.mjs','battle/battle-viewport-controller.mjs','battle/battle-viewport.mjs','core/run-results.mjs','core/coop-motion.mjs','core/boss-mechanics.mjs','battle/battle-sound.mjs','core/run-perks.mjs','core/terrain.mjs','core/maps.mjs','core/combat-fx.mjs','core/cartoon-art.mjs','core/match.mjs','core/combat.mjs','core/progression.mjs','battle/battle-xp-hud.mjs','core/tower-upgrade-cue.mjs','core/tower-specialization.mjs','core/tower-class-paths.mjs','ui/development-ui.mjs','core/report-promotion.mjs','core/rank-insignia.mjs','core/ground-tracks.mjs','ui/ability-hud.mjs','core/simulation.mjs','core/tutorial.mjs','core/coop-config.mjs','core/coop-client.mjs','core/coop-input.mjs','ui/field-notice.mjs','ui/map-intro.mjs','core/hit-feedback.mjs','ui/boss-banner.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
 source=source.replace(/'\.\/core\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../core/skills.mjs',import.meta.url).href));
 const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const match=createMatch(['alice','bob'].map(id=>createPlayer(id,{name:id,gender:'female'})));match.hostId='alice';match.players.alice.completedWaveMask=3;match.players.alice.completedWaveBlocks={1:1};
 let options,stopped=0,partyEnd=null,tick=9,canEndWhilePaused=false;const commands=[],frames=[];
 const snapshot=()=>({match:structuredClone(match),tick,partyEnd:partyEnd&&structuredClone(partyEnd)});
 const game=startGame({getProfile:()=>({name:'Alice',gender:'female',xp:0}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true,confirmAction:async()=>true});
 const factory=o=>{options=o;return {start(){o.onSnapshot(snapshot());o.onStatus(true);},stop(){stopped++;},canRequestHostEnd:()=>canEndWhilePaused,async command(command){commands.push(command);if(command.type==='acknowledgePartyEnd')return {ok:true};if(command.type==='finishParty'){if(!match.ended)return {ok:false};partyEnd??={tick:++tick,acknowledged:[]};o.onSnapshot(snapshot());return {ok:true};}const result=applyCommand(match,'alice',command);if(command.type==='endRun'&&result.ok)partyEnd={tick:++tick,acknowledged:[]};o.onSnapshot(snapshot());return result;}};};
 assert.equal(game.beginCoop(factory,()=>{},'party-one','coop',frame=>frames.push(frame)),true);
 return {game,match,commands,frames,el,options:()=>options,setCanEnd:value=>{canEndWhilePaused=value;},get stopped(){return stopped;}};
}

test('the final report is created before acknowledgement and remains available after host closure',async()=>{
 const f=await setup();assert.equal(await f.game.requestHostPartyEnd('wrong-party'),false);assert.equal(f.commands.length,0);
 assert.equal(await f.game.requestHostPartyEnd('party-one'),true);const end=f.frames.at(-1);
 assert.equal(end.reportReady,true);assert.equal(end.ended,true);assert.deepEqual(end.masks,{0:3,1:1});assert.equal(end.partyEnd.tick,10);assert.equal(f.el('runResults').open,true);
 assert.equal((await f.game.acknowledgePartyEnd('party-one',11)).ok,false);assert.equal((await f.game.acknowledgePartyEnd('party-one',10)).ok,true);assert.deepEqual(f.commands.at(-1),{type:'acknowledgePartyEnd',endTick:10});
 f.game.recordCoopReward('party-one','saved',{delta:{xp:30,scrap:10,items:[],levels:0,unlocks:[]},profile:{xp:30}});
 await f.game.leaveCoop({preserveReport:true,hostClosed:true});assert.equal(f.stopped,1);assert.equal(f.el('runResults').open,true,'leaving the transport does not close the report');assert.equal(f.el('resultsTitle').textContent,'Operation ended');assert.match(f.el('resultsRewards').textContent,/\+30 XP/);assert.match(f.el('resultsSave').textContent,/host closed the party/i);
 f.el('resultsDone').onclick();assert.equal(f.el('runResults').open,false);f.el('viewResults').onclick();assert.equal(f.el('runResults').open,true,'the same completed report can be reopened');
});

test('a disconnected host cannot end or confirm a party and an ended match preserves its outcome',async()=>{
 const f=await setup();f.options().onStatus(false);assert.equal(await f.game.requestHostPartyEnd('party-one'),false);assert.equal((await f.game.acknowledgePartyEnd('party-one',10)).ok,false);assert.deepEqual(f.commands,[]);
 f.options().onStatus(true);await new Promise(resolve=>setImmediate(resolve));f.match.ended=true;f.match.endReason='defeat';f.options().onSnapshot({match:structuredClone(f.match),tick:9});
 assert.equal(await f.game.requestHostPartyEnd('party-one'),true);assert.equal(f.commands.at(-1).type,'finishParty');assert.equal(f.match.endReason,'defeat');assert.equal(f.frames.at(-1).reportReady,true);
 await f.game.leaveCoop();
});

test('host end can use the restricted paused control path without treating a disconnected host as ready',async()=>{
 const f=await setup();f.options().onStatus(false);
 assert.equal(await f.game.requestHostPartyEnd('party-one'),false,'no control capability means no end');
 f.setCanEnd(true);assert.equal(await f.game.requestHostPartyEnd('party-one'),true);
 assert.equal(f.commands.at(-1).type,'endRun');assert.equal(f.frames.at(-1).ended,true);assert.equal(f.frames.at(-1).reportReady,true);
 await f.game.leaveCoop();
});

test('one earlier co-op receipt does not make an unfinished final report look fully saved',async()=>{
 const f=await setup();await f.game.requestHostPartyEnd('party-one');
 assert.equal(f.el('runResults').dataset.save,'uncertain');
 f.game.recordCoopReward('party-one','confirmed',null,0);
 assert.equal(f.el('runResults').dataset.save,'uncertain','a previous receipt can cover only one of several final reward blocks');
 assert.match(f.el('resultsSave').textContent,/earlier rewards.*already saved/i);
 assert.match(f.el('resultsSave').textContent,/rewards may still be saving/i);
 assert.equal(f.game.markPartyRewardsConfirmed('party-one',10),true);
 assert.equal(f.el('runResults').dataset.save,'confirmed');
 assert.match(f.el('resultsSave').textContent,/all completed-wave rewards are confirmed/i);
 assert.match(f.el('resultsSave').textContent,/earlier rewards.*already saved/i,'the visible status explains why the new session may show +0');
 await f.game.leaveCoop();
});
