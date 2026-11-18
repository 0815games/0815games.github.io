import {test} from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { createMatch } from '../simulation.mjs';
import { createPlayer, applyCommand } from '../match.mjs';

test('the opt-in co-op UI projects a party, a handoff and a mode without touching host state',async()=>{
const nodes=new Map(),drawnText=[],ctx=new Proxy({}, {get:(_target,key)=>key==='fillText'?(text=>drawnText.push(text)):()=>{},set:()=>true});let frame;
function el(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},children:[],scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{flags:{},toggle(name,on){this.flags[name]=on;}},contains(){return false;},setAttribute(){},removeAttribute(){},toggleAttribute(){},replaceChildren(...children){this.children=children;},get childElementCount(){return this.children.length;},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return nodes.get(id);}
const documentHandlers={},windowHandlers={};globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(type,fn){(documentHandlers[type]??=[]).push(fn);},querySelector:()=>null,getElementById:el,createElement:()=>({toggleAttribute(){}}),activeElement:{tagName:'BODY'}};
globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,confirm:()=>true,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(type,fn){(windowHandlers[type]??=[]).push(fn);}};
globalThis.requestAnimationFrame=fn=>{frame=fn;};
let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
for(const file of ['features.mjs','solo-deployment.mjs','workshop-run-receipt.mjs','canvas-resolution.mjs','language.mjs','map-zoom.mjs','game-localization.mjs','story-localization.mjs','soldier-motion.mjs','dialog-dismiss.mjs','focus-pause.mjs','story-cinematics.mjs','campaign.mjs','relics.mjs','story-mission.mjs','story-events.mjs','training-run.mjs','first-run-coach.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','battle-xp-hud.mjs','tower-upgrade-cue.mjs','tower-specialization.mjs','tower-class-paths.mjs','development-ui.mjs','report-promotion.mjs','rank-insignia.mjs','ability-hud.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs','field-notice.mjs','map-intro.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
source=source.replace(/'\.\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const match=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);let opts,awards=0,stopCalled=false,commands=[];match.hostId='alice';
const factory=options=>{opts=options;return {start(){options.onSnapshot({match:structuredClone(match)});options.onStatus(true);},stop(){stopCalled=true;},async command(command){commands.push(command);const result=applyCommand(match,'alice',command);options.onSnapshot({match:structuredClone(match)});return result;}};};
let mapGeneration=0,allowEnd=false,confirmation,returned=0,sessionChanged;
const game=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',getToken:async()=> 'test',isReady:()=>true,getLevel:()=>1,onSessionChange(fn){sessionChanged=fn;},awardXP(){awards++;}}, {coopUrl:'wss://trusted.example/match',clientFactory:factory,nextMapId:()=>{mapGeneration++;return 'road';},confirmAction:async options=>{confirmation=options;return allowEnd;},onReturnToCommand:()=>returned++});
el('tutorialSkip').onclick();assert.equal(el('coopControls').hidden,false);assert.equal(mapGeneration,1);game.resetSkills();assert.equal(mapGeneration,1,'editing skills does not reroll the current operation');
// Neither a visible nor a minimized tutorial task may survive a session or
// party handoff. Stopping must clear the state, not merely hide the card.
game.replayCoach();assert.equal(game.isCoachOpen(),true);sessionChanged();assert.equal(game.isCoachOpen(),false,'session change stops the visible coach');assert.equal(el('coachRecall').hidden,true);el('coachRecall').onclick();assert.equal(game.isCoachOpen(),false,'old session task cannot be reopened');
game.replayCoach();el('coachClose').onclick();game.refreshLanguage();assert.equal(el('coachRecall').hidden,false,'a dismissed coach normally remains recallable');
await el('coopToggle').onclick();assert.equal(mapGeneration,2,'a co-op start generates a new battlefield');assert.equal(el('coopStatus').textContent,'CONNECTING');assert.equal(el('soloObjective').hidden,true,'campaign tracker is hidden in multiplayer');assert.equal(el('speed').disabled,true);assert.equal(game.isCoachOpen(),false);assert.equal(el('coachRecall').hidden,true,'party handoff removes the old task');el('coachRecall').onclick();assert.equal(game.isCoachOpen(),false,'minimized task cannot resurrect in multiplayer');
opts.onStatus(false);opts.onStatus(true);await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(commands.at(-1),{type:'direction',x:0,y:0},'reconnection neutralizes movement');
match.wave=5;match.running=true;match.spawnLeft=1;opts.onSnapshot({match:structuredClone(match)});assert.match(el('bossAlertTitle').textContent,/BOSS INCOMING.*Ironclad/);assert.equal(el('bossAlert').hidden,false);
match.enemies=[{boss:'bossIronclad',kind:'tank',hp:50,maxHp:100,x:100,y:100,segment:1}];opts.onSnapshot({match:structuredClone(match)});assert.match(el('bossAlertTitle').textContent,/BOSS · Ironclad/);assert.equal(el('bossHealthFill').style.width,'50%');
match.enemies[0].bossClock=7;match.enemies.push({kind:'runner',hp:40,maxHp:40,x:100,y:100,segment:1,speed:0});opts.onSnapshot({match:structuredClone(match)});assert.match(el('bossAlertInfo').textContent,/SHIELD RAISING.*1s/);assert.match(el('threatSummary').textContent,/Scout 1/);assert.equal(el('threatTank').textContent,'1');assert.equal(el('threatRunner').textContent,'1');

match.wave=0;match.running=false;match.spawnLeft=0;match.enemies=[];opts.onSnapshot({match:structuredClone(match)});assert.equal(el('bossAlert').hidden,true);
// Dismissing the field-upgrade popup never discards the shared decision.
match.wave=5;match.pendingPerk=5;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('runPerkPanel').hidden,false);el('runPerkClose').onclick();assert.equal(el('runPerkPanel').hidden,true);assert.equal(el('runPerkReopen').hidden,false);assert.equal(match.pendingPerk,5);opts.onSnapshot({match:structuredClone(match)});assert.equal(el('runPerkPanel').hidden,true,'snapshots do not reopen dismissed choice');el('runPerkReopen').onclick();assert.equal(el('runPerkPanel').hidden,false);for(const fn of documentHandlers.click||[])fn({target:{},preventDefault(){},stopPropagation(){}});assert.equal(el('runPerkPanel').hidden,true,'outside click hides the choice');assert.equal(match.pendingPerk,5,'outside click does not spend or discard the upgrade');el('runPerkReopen').onclick();assert.equal(el('runPerkPanel').hidden,false);match.pendingPerk=0;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('runPerkPanel').hidden,true);assert.equal(el('runPerkReopen').hidden,true,'another player choice clears it');match.wave=0;opts.onSnapshot({match:structuredClone(match)});

match.players.bob.skills.active='recon';opts.onSnapshot({match:structuredClone(match)});match.players.bob.cooldown=30;opts.onSnapshot({match:structuredClone(match)});frame(performance.now()+100);assert.ok(drawnText.includes('SUPPRESSION'),'teammate ability renders from a co-op view');
opts.onStatus(false);opts.onStatus(true);drawnText.length=0;opts.onSnapshot({match:structuredClone(match)});frame(performance.now()+200);assert.ok(!drawnText.includes('SUPPRESSION'),'reconnect does not replay an old ability');await new Promise(resolve=>setTimeout(resolve,0));
// Another player's active reservation prevents opening the build sheet.
assert.equal(applyCommand(match,'bob',{type:'reserveBuild',pad:0}).ok,true);opts.onSnapshot({match:structuredClone(match)});
await el('game').onclick({clientX:105,clientY:210});assert.equal(el('radialMenu').hidden,true);
// A refusal is a warning now: it flutters in under the status bar instead
// of in the line, and it stays there instead of being replaced by the next one.
assert.equal(el('fieldNotice').hidden,false);assert.match(el('fieldNoticeText').textContent,/Another player/);
applyCommand(match,'bob',{type:'releaseBuild',pad:0});opts.onSnapshot({match:structuredClone(match)});
await el('game').onclick({clientX:105,clientY:210});assert.equal(match.buildReservations[0].playerId,'alice');assert.equal(el('sheetMode').textContent,'BATTLE CONTINUES');el('radial0').onclick();el('towerDetailsConfirm').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(match.towers.length,1);assert.equal(match.buildReservations[0],undefined,'building releases the reservation');assert.equal(el('money').textContent,75);
assert.ok(!commands.some(command=>command.type==='releaseBuild'&&command.pad===0),'a successful build does not send a redundant release that blocks the next upgrade');
// Availability updates live while the multiplayer tower sheet and details stay open.
match.towers[0].level=2;match.players.alice.money=0;opts.onSnapshot({match:structuredClone(match)});
el('game').onclick({clientX:105,clientY:210});el('radial0').onclick();
assert.equal(el('radial2').classList.flags.unaffordable,true,'level-locked specialization is grey');
el('radial2').onclick();assert.equal(el('towerDetailsConfirm').disabled,true);assert.match(el('towerDetailsCost').textContent,/level 5/i);
match.players.alice.money=1000;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('towerDetailsConfirm').disabled,true,'funds alone do not bypass level lock');
match.players.alice.level=5;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('towerDetailsConfirm').disabled,false);assert.equal(el('radial2').classList.flags.unaffordable,false);
match.players.alice.money=0;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('towerDetailsConfirm').disabled,true);assert.match(el('towerDetailsCost').textContent,/Not enough supplies/);
match.players.alice.money=1000;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('towerDetailsConfirm').disabled,false,'new supplies enable the already-open confirmation');
el('towerDetailsBack').onclick();el('radialClose').onclick();
// A Veteran III tower is cheaper in the simulation; the UI must use exactly
// that price, both before and after a balance update, for own and shared towers.
match.towers[0].level=5;match.towers[0].branch=2;match.players.alice.money=305;opts.onSnapshot({match:structuredClone(match)});
await el('game').onclick({clientX:105,clientY:210});
assert.equal(el('menuPrice0').textContent,'306','rank III displays the discounted price');
assert.equal(el('radial0').classList.flags.unaffordable,true,'305 is insufficient for a 306 upgrade');
const beforeVeteran=commands.filter(command=>command.type==='upgrade').length;
el('radial0').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(commands.filter(command=>command.type==='upgrade').length,beforeVeteran,'insufficient funds send no upgrade');
match.players.alice.money=306;opts.onSnapshot({match:structuredClone(match)});
assert.equal(el('menuPrice0').textContent,'306');assert.equal(el('radial0').classList.flags.unaffordable,false,'the live balance enables the discounted upgrade');
el('radial0').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(match.towers[0].level,6);assert.equal(match.players.alice.money,0,'the owner pays the discounted 306');
// At prestige the discount still applies and rounds up, as it does in match.mjs.
match.players.alice.money=383;opts.onSnapshot({match:structuredClone(match)});
await el('game').onclick({clientX:105,clientY:210});assert.equal(el('menuPrice0').textContent,'383');
el('radial0').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(match.towers[0].level,7);assert.equal(match.players.alice.money,0);
// A host upgrading another player's tower pays from the host's own balance.
match.towers[0].level=5;match.towers[0].ownerId='bob';match.players.alice.money=306;const bobBeforeUpgrade=match.players.bob.money;opts.onSnapshot({match:structuredClone(match)});
await el('game').onclick({clientX:105,clientY:210});assert.equal(el('menuPrice0').textContent,'306');assert.match(el('menuDesc0').textContent,/You pay/);
el('radial0').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(match.towers[0].level,6);assert.equal(match.players.alice.money,0);assert.equal(match.players.bob.money,bobBeforeUpgrade);
// Other specializations must not accidentally receive the Veteran discount.
match.towers[0].level=5;match.towers[0].branch=0;match.towers[0].ownerId='alice';match.players.alice.money=359;opts.onSnapshot({match:structuredClone(match)});
await el('game').onclick({clientX:105,clientY:210});assert.equal(el('menuPrice0').textContent,'360');assert.equal(el('radial0').classList.flags.unaffordable,true);el('radialClose').onclick();
delete match.towers[0].branch;match.towers[0].level=1;match.players.alice.level=1;match.players.alice.money=75;opts.onSnapshot({match:structuredClone(match)});
// A replacement made by the other player cannot be sold by an old open menu.
el('game').onclick({clientX:105,clientY:210});el('radial1').onclick();
assert.equal(applyCommand(match,'bob',{type:'sell',pad:0}).ok,true);
assert.equal(applyCommand(match,'bob',{type:'build',pad:0,towerType:0}).ok,true);
opts.onSnapshot({match:structuredClone(match)});el('radial0').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(match.towers.length,1);
// A refused sell is a warning now: it stands on the card, and the older warning
// it displaced waits one tap behind it.
assert.match(el('fieldNoticeText').textContent,/Tower changed/);
assert.equal(el('fieldNoticeMore').hidden,false,'and the one it displaced is still in the history');
assert.match(el('fieldNoticeText').textContent,/Tower changed/);
el('radialClose').onclick();
opts.onState('duplicate');assert.match(el('message').textContent,/another tab/);opts.onState('error');assert.match(el('message').textContent,/host reloaded/);
// Show whose balance pays for a teammate's tower and who receives a sale refund.
assert.equal(applyCommand(match,'bob',{type:'build',pad:1,towerType:0}).ok,true);opts.onSnapshot({match:structuredClone(match)});
el('game').onclick({clientX:285,clientY:210});assert.match(el('menuDesc0').textContent,/You pay.*refund goes to Bob/);assert.match(el('menuName0').textContent,/Confirm upgrade/);
el('radial1').onclick();assert.match(el('menuDesc0').textContent,/Bob receives 25/);el('radial0').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(match.players.bob.money,50);assert.match(el('message').textContent,/Bob receives 25/);
match.mapId='forest';opts.onSnapshot({match:structuredClone(match)});assert.equal(el('mapName').textContent,'Pinewood Crossing','guest uses map from host snapshot');
opts.onEvents([{type:'waveCleared',xp:30,victory:false}]);assert.equal(awards,0,'online clients must never award XP');
frame(performance.now()+100);assert.equal(awards,0);assert.equal(match.wave,0,'browser must not simulate online');
await el('endRun').onclick();assert.equal(match.ended,false);assert.match(confirmation.text,/all players/);assert.equal(returned,0);allowEnd=true;await el('endRun').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(match.ended,true);assert.equal(returned,1,'host returns without closing the party');assert.equal(stopCalled,false);assert.equal(el('start').textContent,'MATCH ENDED');assert.equal(el('endRun').disabled,false);assert.equal(el('endRun').textContent,'CLOSE PARTY');assert.match(el('message').textContent,/Shared run ended/);assert.equal(el('runResults').open,true);assert.match(el('resultsOutcome').textContent,/CO-OP/);game.recordCoopReward('test','saved',{delta:{xp:30,scrap:10,items:['Field Scope'],levels:1},profile:{xp:300}});assert.match(el('resultsRewards').textContent,/\+30 XP/);assert.match(el('resultsRewards').textContent,/Field Scope/);assert.equal(el('resultsRewardXp').textContent,'+30 XP');assert.equal(el('resultsRewardScrap').textContent,'+10');assert.match(el('resultsEquipment').textContent,/Field Scope/);assert.equal(el('resultsProgressLevel').textContent,'LEVEL 2');assert.equal(el('resultsProgressBar').value,0);assert.equal(el('resultsProgressBar').max,450);assert.equal(el('resultsEnemiesLabel').textContent,'ENEMIES DEFEATED · TEAM');assert.match(el('resultsUnlocks').textContent,/1 new skill point/);game.recordCoopReward('test','error',null,1);assert.equal(el('runResults').dataset.save,'failed');game.recordCoopReward('test','saved',{delta:{xp:0,scrap:0,items:[],levels:0}},0);assert.match(el('resultsSave').textContent,/could not be confirmed/);game.recordCoopReward('test','confirmed',null,1);assert.doesNotMatch(el('resultsSave').textContent,/could not be confirmed/);el('resultsDone').onclick();
el('coopToggle').onclick();assert.equal(stopCalled,true);assert.equal(el('money').textContent,125);assert.equal(el('speed').disabled,false);
assert.equal(game.confirmParty(),true);assert.equal(game.beginCoop(callbacks=>factory(callbacks),()=>{},'party-test'),true);
assert.equal(el('speed').disabled,true);assert.equal(game.beginCoop(callbacks=>factory(callbacks)),false);
await game.leaveCoop();assert.equal(el('money').textContent,125);assert.equal(el('speed').disabled,false);
console.log('Opt-in co-op UI adapter and party handoff smoke tests passed.');
// Guest approves the host's request and leaves without ending the host's run.
const guestMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);guestMatch.hostId='alice';
let guestOptions,guestStopped=false,leftParty=0,guestCommands=[],guestGame,guestReturned=0;
const guestPrompts={items:[],update(_source,items){this.items=items;},reset(){this.items=[];},isShowing(){return false;}};
const guestFactory=options=>{guestOptions=options;return {start(){options.onSnapshot({match:structuredClone(guestMatch)});options.onStatus(true);},stop(){guestStopped=true;},async command(command){guestCommands.push(command);const result=applyCommand(guestMatch,'bob',command);options.onSnapshot({match:structuredClone(guestMatch)});return result;}};};
guestGame=startGame({getProfile:()=>({name:'Bob',gender:'male'}),getUserId:()=> 'bob',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{confirmAction:async()=>true,leaveParty:async()=>{leftParty++;await guestGame.leaveCoop();return true;},nextMapId:()=> 'road',onReturnToCommand:()=>guestReturned++,promptCenter:guestPrompts});
assert.equal(guestGame.beginCoop(cb=>guestFactory(cb)),true);assert.equal(el('start').textContent,'REQUEST WAVE');assert.equal(el('start').disabled,false);assert.equal(el('endRun').textContent,'LEAVE CO-OP');
guestMatch.players.alice.active=false;guestOptions.onSnapshot({match:structuredClone(guestMatch)});assert.equal(el('start').textContent,'WAIT FOR PLAYERS');assert.equal(el('start').disabled,true);guestMatch.players.alice.active=true;guestOptions.onSnapshot({match:structuredClone(guestMatch)});
el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(guestMatch.waveRequest.requester,'bob');assert.equal(guestCommands.at(-1).expectedRequestId,0,'new wave clicks carry the last observed vote ID');assert.equal(el('start').textContent,'CANCEL REQUEST');assert.match(el('waveRequestText').textContent,/Bob requests wave 1\. 1 approval/);assert.equal(el('waveDecline').hidden,true);
assert.equal(applyCommand(guestMatch,'alice',{type:'declineWave',requestId:guestMatch.waveRequestId}).ok,true);guestOptions.onSnapshot({match:structuredClone(guestMatch)});assert.equal(el('waveRequest').hidden,true);
assert.equal(applyCommand(guestMatch,'alice',{type:'startWave'}).waitingForGuest,true);guestOptions.onSnapshot({match:structuredClone(guestMatch)});assert.equal(el('start').textContent,'APPROVE WAVE');assert.equal(el('waveRequest').hidden,false);assert.match(el('waveRequestText').textContent,/Alice requests wave 1/);
assert.equal(guestPrompts.items.length,1,'an actionable wave is offered to the prompt center');
const staleWaveAction=guestPrompts.items[0].actions[0].run,oldWave=guestMatch.waveRequest.id;
assert.equal(applyCommand(guestMatch,'alice',{type:'cancelWave',requestId:oldWave}).ok,true);guestOptions.onSnapshot({match:structuredClone(guestMatch)});
assert.equal(applyCommand(guestMatch,'alice',{type:'startWave'}).waitingForGuest,true);guestOptions.onSnapshot({match:structuredClone(guestMatch)});const newWave=guestMatch.waveRequest.id;
const beforeStale=guestCommands.length;assert.equal(await staleWaveAction(),false);assert.equal(guestCommands.length,beforeStale,'the old card cannot approve its replacement');
assert.equal(await guestPrompts.items[0].actions[0].run(),true);assert.equal(guestMatch.wave,1);assert.deepEqual(guestCommands.at(-1),{type:'approveWave',requestId:newWave});
await el('endRun').onclick();assert.equal(leftParty,1);assert.equal(guestReturned,1);assert.equal(guestStopped,true);assert.equal(guestMatch.ended,false);assert.equal(guestMatch.players.bob.active,false);assert.ok(guestCommands.some(c=>c.type==='leaveRun'));assert.equal(el('runResults').open,true);assert.match(el('resultsTitle').textContent,/left the operation/);el('resultsDone').onclick();
// The versus canvas is taller and the opponent lane is visible but read-only.
const {createVersus,applyVersus,versusView,stepVersus}=await import('../versus.mjs');
const duel=createVersus([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})],'road','alice');let duelOptions,duelCommands=[];
const duelFactory=options=>{duelOptions=options;return {start(){options.onSnapshot({match:versusView(duel,'alice')});options.onStatus(true);},stop(){},async command(command){duelCommands.push(command);const result=applyVersus(duel,'alice',command);options.onSnapshot({match:versusView(duel,'alice')});return result;}};};
const duelGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road'});
assert.equal(duelGame.beginCoop(cb=>duelFactory(cb)),true);assert.equal(el('game').height,1100);assert.equal(el('versusStatus').hidden,false);assert.equal(el('start').textContent,'REQUEST WAVE');
const count=duelCommands.length;el('game').onclick({clientX:100,clientY:350});assert.equal(duelCommands.length,count);
// A rule the player broke is a warning, not ordinary traffic.
assert.match(el('fieldNoticeText').textContent,/opponent’s battlefield/);
duel.lanes.bob.hp=0;stepVersus(duel);duelOptions.onSnapshot({match:versusView(duel,'alice')});assert.equal(el('versusTitle').textContent,'VICTORY');assert.match(el('resultsTitle').textContent,/Victory/);el('resultsDone').onclick();await duelGame.leaveCoop();assert.equal(el('game').height,540);
// The real four-player protocol wrapper is projected onto the local 2v2 field.
const {createTwoVsTwo,applyFourCommand,stepFour}=await import('../four-modes.mjs');
const fourIds=['alice','bob','cara','dan'];const four=createTwoVsTwo(fourIds.map(id=>createPlayer(id,{name:id,gender:'female'})),'alice',[['alice','bob'],['cara','dan']]);let fourOptions,fourCommands=[];
const fourFactory=options=>{fourOptions=options;return {start(){options.onSnapshot({match:structuredClone(four)});options.onStatus(true);},stop(){},async command(command){fourCommands.push(command);const result=applyFourCommand(four,'cara',command);options.onSnapshot({match:structuredClone(four)});return result;}};};
const fourGame=startGame({getProfile:()=>({name:'Cara',gender:'female'}),getUserId:()=> 'cara',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road'});
assert.equal(fourGame.beginCoop(cb=>fourFactory(cb)),true);assert.equal(el('versusTitle').textContent,'2 VS 2 · TEAM B');assert.equal(el('start').textContent,'REQUEST WAVE');assert.equal(el('start').disabled,false);
el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(four.pending.requester,'cara');assert.equal(fourCommands.at(-1).expectedRequestId,0);assert.equal(el('start').textContent,'CANCEL REQUEST');assert.match(el('waveRequestText').textContent,/cara requests wave 1\. 3 approvals/);el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(four.pending,null);
el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(fourCommands.at(-1).expectedRequestId,1,'the four-player projection retains a cancelled vote counter');assert.equal(four.pending.requester,'cara');el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(four.pending,null);
const fourRequest=applyFourCommand(four,'alice',{type:'startWave'});fourOptions.onSnapshot({match:structuredClone(four)});assert.equal(el('start').textContent,'APPROVE WAVE');assert.match(el('waveRequestText').textContent,/alice requests wave 1/);el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(fourCommands.at(-1).requestId,fourRequest.requestId);assert.equal(el('start').textContent,'WAIT FOR PLAYERS');assert.equal(el('start').disabled,true);assert.equal(el('waveRequest').hidden,false);assert.match(el('waveRequestText').textContent,/2 approvals still needed/);
four.lanes[0].hp=0;stepFour(four);fourOptions.onSnapshot({match:structuredClone(four)});assert.equal(el('versusTitle').textContent,'VICTORY');assert.match(el('resultsTitle').textContent,/Victory/);el('resultsDone').onclick();await fourGame.leaveCoop();
// A late reservation response cannot release a newer selection of the same pad.
const raceMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);raceMatch.hostId='alice';let raceOptions,releaseFirst,firstStarted;const firstSeen=new Promise(resolve=>{firstStarted=resolve;});let first=true;
const raceFactory=options=>{raceOptions=options;return {start(){options.onSnapshot({match:structuredClone(raceMatch)});options.onStatus(true);},stop(){},async command(command){if(command.type==='reserveBuild'&&first){first=false;firstStarted();await new Promise(resolve=>{releaseFirst=resolve;});}const result=applyCommand(raceMatch,'alice',command);options.onSnapshot({match:structuredClone(raceMatch)});return result;}};};
const raceGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});assert.equal(raceGame.beginCoop(cb=>raceFactory(cb)),true);
const firstSelection=el('game').onclick({clientX:105,clientY:210});await firstSeen;const secondSelection=el('game').onclick({clientX:105,clientY:210});releaseFirst();await Promise.all([firstSelection,secondSelection]);assert.equal(raceMatch.buildReservations[0].playerId,'alice');assert.equal(el('radialMenu').hidden,false);el('radialClose').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(raceMatch.buildReservations[0],undefined,'closing releases the claimed spot');await raceGame.leaveCoop();
// An uncertain reservation can commit after the client has stopped waiting.
// It must be cleaned up after reconnect, without releasing a claim still being selected.
const uncertainMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);uncertainMatch.hostId='alice';let uncertainOptions,finishClaim,claimSeen;const claimStarted=new Promise(resolve=>claimSeen=resolve),uncertainCommands=[];
const uncertainFactory=options=>{uncertainOptions=options;return {start(){options.onSnapshot({match:structuredClone(uncertainMatch)});options.onStatus(true);},stop(){},async command(command){uncertainCommands.push(command);const result=applyCommand(uncertainMatch,'alice',command);if(command.type==='reserveBuild'){options.onSnapshot({match:structuredClone(uncertainMatch)});claimSeen();await new Promise(resolve=>finishClaim=resolve);options.onStatus(false);return {ok:false,reason:'Command outcome unknown; waiting for synchronization.'};}options.onSnapshot({match:structuredClone(uncertainMatch)});return result;}};};
const uncertainGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});assert.equal(uncertainGame.beginCoop(cb=>uncertainFactory(cb)),true);
const pendingClaim=el('game').onclick({clientX:105,clientY:210});await claimStarted;assert.equal(uncertainMatch.buildReservations[0].playerId,'alice');assert.ok(!uncertainCommands.some(c=>c.type==='releaseBuild'),'no cleanup while claim is pending');finishClaim();await pendingClaim;assert.ok(uncertainMatch.buildReservations[0],'offline cleanup waits for reconnection');
uncertainOptions.onStatus(true);await new Promise(resolve=>setTimeout(resolve,250));assert.equal(uncertainMatch.buildReservations[0],undefined,'uncertain committed claim is released on reconnect');assert.ok(uncertainCommands.some(c=>c.type==='releaseBuild'&&c.pad===0));assert.equal(applyCommand(uncertainMatch,'bob',{type:'reserveBuild',pad:0}).ok,true,'other player can take the spot');
const stale=structuredClone(uncertainMatch);stale.buildReservations[0]={playerId:'alice',remaining:20};uncertainOptions.onSnapshot({match:stale});await new Promise(resolve=>setTimeout(resolve,30));assert.equal(uncertainMatch.buildReservations[0].playerId,'bob','stale cleanup cannot release another player’s claim');await uncertainGame.leaveCoop();

// Focus events are sent to the adapter, and remote pause snapshots explain the pause.
const focusMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);focusMatch.hostId='alice';let focusOptions,focusCalls=[];const focusFactory=options=>{focusOptions=options;return {setFocusPaused:value=>focusCalls.push(value),start(){options.onSnapshot({match:structuredClone(focusMatch),hostPaused:false});options.onStatus(true);},stop(){},async command(command){return applyCommand(focusMatch,'alice',command);}};};const focusGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});focusGame.beginCoop(focusFactory);for(const fn of windowHandlers.blur||[])fn();assert.equal(focusCalls.at(-1),true);focusOptions.onStatus(false);focusOptions.onSnapshot({match:structuredClone(focusMatch),hostPaused:true});assert.match(el('message').textContent,/host left the game window/i);for(const fn of windowHandlers.focus||[])fn();assert.equal(focusCalls.at(-1),false);focusOptions.onStatus(true);focusOptions.onSnapshot({match:structuredClone(focusMatch),hostPaused:false});assert.match(el('message').textContent,/match has resumed/i);await focusGame.leaveCoop();
// The speed vote uses the authoritative snapshot and explicit commands.
const speedMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);speedMatch.hostId='alice';speedMatch.running=true;speedMatch.wave=1;let speedOptions,speedCommands=[],vote=null,speedValue=1,speedLast=8;const speedSnapshot=()=>({match:structuredClone(speedMatch),speedControl:{speed:speedValue,lastRequestId:speedLast,request:vote?structuredClone(vote):null}});
const speedFactory=options=>{speedOptions=options;return {start(){options.onSnapshot(speedSnapshot());options.onStatus(true);},stop(){},async command(command){speedCommands.push(command);if(command.type==='requestSpeed'){speedLast=9;vote={id:9,requester:'alice',wave:1,required:['bob'],approved:[]};}if(command.type==='cancelSpeed')vote=null;if(command.type==='slowSpeed')speedValue=1;options.onSnapshot(speedSnapshot());return {ok:true};}};};
const speedPrompts={items:[],update(_source,items){this.items=items;},reset(){this.items=[];},isShowing(){return false;}};
const speedGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true,promptCenter:speedPrompts});
speedGame.beginCoop(speedFactory);assert.equal(el('speed').textContent,'REQUEST 2×');assert.equal(el('speed').disabled,false);el('speed').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.deepEqual(speedCommands.at(-1),{type:'requestSpeed',expectedRequestId:8});assert.equal(el('speedRequest').hidden,false);assert.equal(el('speedApprove').hidden,true);assert.match(el('speedRequestText').textContent,/Alice requests 2×/);assert.equal(speedPrompts.items.length,0,'the requester sees their waiting strip, not an answer popup');
el('speed').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(speedCommands.at(-1),{type:'cancelSpeed',requestId:9});
speedLast=10;vote={id:10,requester:'bob',wave:1,required:['alice'],approved:[]};speedOptions.onSnapshot(speedSnapshot());assert.equal(el('speedApprove').hidden,false);assert.equal(el('speed').disabled,true);assert.match(speedPrompts.items[0].note,/Battle continues/);
const oldSpeedAction=speedPrompts.items[0].actions[0].run;speedOptions.onStatus(false);assert.equal(speedPrompts.items.length,0);assert.equal(await oldSpeedAction(),false,'disconnect invalidates a displayed vote');speedOptions.onStatus(true);await new Promise(resolve=>setTimeout(resolve,0));
speedLast=11;vote={id:11,requester:'bob',wave:1,required:['alice'],approved:[]};speedOptions.onSnapshot(speedSnapshot());const sentBefore=speedCommands.length;assert.equal(await oldSpeedAction(),false);assert.equal(speedCommands.length,sentBefore,'the previous card cannot answer the replacement');
assert.equal(await speedPrompts.items[0].actions[0].run(),true);assert.deepEqual(speedCommands.at(-1),{type:'approveSpeed',requestId:11});
vote=null;speedValue=2;speedOptions.onSnapshot(speedSnapshot());assert.match(el('speed').textContent,/2×/);el('speed').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(speedCommands.at(-1),{type:'slowSpeed',expectedRequestId:11});
// A requester needs an explicit result, not just a vanished waiting strip.
speedLast=12;vote={id:12,requester:'alice',wave:1,required:['bob'],approved:[]};speedOptions.onSnapshot(speedSnapshot());vote=null;speedOptions.onSnapshot(speedSnapshot());
assert.match(el('message').textContent,/2× request ended\. Check the current speed/i,'without a reason or complete intermediate snapshots, do not invent the outcome');
speedLast=13;vote={id:13,requester:'alice',wave:1,required:['bob'],approved:[]};speedOptions.onSnapshot(speedSnapshot());vote=null;speedValue=2;speedOptions.onSnapshot(speedSnapshot());
assert.match(el('message').textContent,/2× approved by all players/i);
speedValue=1;speedLast=14;vote={id:14,requester:'alice',wave:1,required:['bob'],approved:[]};speedOptions.onSnapshot(speedSnapshot());speedLast=15;vote=null;speedValue=2;speedOptions.onSnapshot(speedSnapshot());
assert.match(el('message').textContent,/request ended\. Check the current speed/i,'a missed generation is not claimed to be an approval');
speedValue=1;speedLast=16;vote={id:16,requester:'alice',wave:1,required:['bob'],approved:[]};speedOptions.onSnapshot(speedSnapshot());vote=null;speedMatch.running=false;speedOptions.onSnapshot(speedSnapshot());
assert.match(el('message').textContent,/Wave cleared/i,'wave completion supersedes an inconclusive speed result');await speedGame.leaveCoop();

// A late success receipt must not replace the newer result with a false
// "waiting" message after another player already declined the request.
const lateSpeedMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);lateSpeedMatch.hostId='alice';lateSpeedMatch.wave=1;lateSpeedMatch.running=true;
let lateSpeedOptions,lateSpeedVote=null,finishSpeedReceipt;const lateSpeedSnapshot=()=>({match:structuredClone(lateSpeedMatch),speedControl:{speed:1,lastRequestId:lateSpeedVote?1:lateSpeedOptions?1:0,request:lateSpeedVote}});
const lateSpeedGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});
lateSpeedGame.beginCoop(options=>{lateSpeedOptions=options;return {start(){options.onSnapshot({match:structuredClone(lateSpeedMatch),speedControl:{speed:1,lastRequestId:0,request:null}});options.onStatus(true);},stop(){},command(command){if(command.type!=='requestSpeed')return Promise.resolve({ok:true});lateSpeedVote={id:1,requester:'alice',wave:1,required:['bob'],approved:[]};options.onSnapshot(lateSpeedSnapshot());return new Promise(resolve=>{finishSpeedReceipt=resolve;});}};});
el('speed').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(typeof finishSpeedReceipt,'function');lateSpeedVote=null;lateSpeedOptions.onSnapshot(lateSpeedSnapshot());assert.match(el('message').textContent,/2× request ended\. Check the current speed/);
finishSpeedReceipt({ok:true,requestId:1});await new Promise(resolve=>setTimeout(resolve,0));assert.match(el('message').textContent,/2× request ended\. Check the current speed/,'a late receipt must not reinstate waiting');await lateSpeedGame.leaveCoop();
const lateWaveMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);lateWaveMatch.hostId='alice';let lateWaveOptions,finishWaveReceipt,lateWaveResult;
const lateWaveGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});
lateWaveGame.beginCoop(options=>{lateWaveOptions=options;return {start(){options.onSnapshot({match:structuredClone(lateWaveMatch)});options.onStatus(true);},stop(){},command(command){if(command.type!=='startWave')return Promise.resolve({ok:true});lateWaveResult=applyCommand(lateWaveMatch,'alice',command);options.onSnapshot({match:structuredClone(lateWaveMatch)});return new Promise(resolve=>{finishWaveReceipt=resolve;});}};});
el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(typeof finishWaveReceipt,'function');assert.equal(applyCommand(lateWaveMatch,'bob',{type:'declineWave',requestId:lateWaveResult.requestId}).ok,true);lateWaveOptions.onSnapshot({match:structuredClone(lateWaveMatch)});assert.match(el('message').textContent,/Wave request cancelled, declined/);
finishWaveReceipt(lateWaveResult);await new Promise(resolve=>setTimeout(resolve,0));assert.match(el('message').textContent,/Wave request cancelled, declined/,'a late wave receipt must not reinstate waiting');await lateWaveGame.leaveCoop();

// A transport can deliver a receipt before the matching game snapshot. The
// pending state may be skipped entirely by coalescing: report the current
// outcome, never claim a different generation approved the original request.
for(const scenario of ['accepted','later-generation','pending-then-ended']){
 const m=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);m.hostId='alice';m.wave=1;m.running=true;let options,finish,last=0,vote=null,speed=1;
 const snapshot=()=>({match:structuredClone(m),speedControl:{speed,lastRequestId:last,request:vote?structuredClone(vote):null}});
 const g=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});
 g.beginCoop(o=>{options=o;return {start(){o.onSnapshot(snapshot());o.onStatus(true);},stop(){},command(c){if(c.type==='requestSpeed')return new Promise(resolve=>finish=resolve);return Promise.resolve({ok:true});}};});
 el('speed').onclick();await new Promise(resolve=>setTimeout(resolve,0));finish({ok:true,requestId:1});await new Promise(resolve=>setTimeout(resolve,0));assert.match(el('message').textContent,/synchronizing the game state/i,scenario);
 last=scenario==='later-generation'?2:1;speed=scenario==='pending-then-ended'?1:2;
 if(scenario==='pending-then-ended')vote={id:1,requester:'alice',wave:1,required:['bob'],approved:[]};
 options.onSnapshot(snapshot());
 if(scenario==='accepted')assert.match(el('message').textContent,/2× approved by all players/i);
 else if(scenario==='later-generation')assert.match(el('message').textContent,/request ended\. Check the current speed/i,'a later approval cannot be attributed to the original request');
 else{assert.match(el('message').textContent,/Waiting for every other player/i);vote=null;options.onSnapshot(snapshot());assert.match(el('message').textContent,/request ended\. Check the current speed/i);}
 await g.leaveCoop();
}
for(const scenario of ['started','declined']){
 const m=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);m.hostId='alice';let options,finish;
 const g=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});
 g.beginCoop(o=>{options=o;return {start(){o.onSnapshot({match:structuredClone(m)});o.onStatus(true);},stop(){},command(c){if(c.type==='startWave')return new Promise(resolve=>finish=resolve);return Promise.resolve({ok:true});}};});
 el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));finish({ok:true,waitingForGuest:true,requestId:1});await new Promise(resolve=>setTimeout(resolve,0));assert.match(el('message').textContent,/synchronizing the game state/i,scenario);
 m.waveRequestId=1;if(scenario==='started'){m.wave=1;m.running=true;}options.onSnapshot({match:structuredClone(m)});
 assert.match(el('message').textContent,scenario==='started'?/Wave started\./:/Wave request cancelled, declined/);await g.leaveCoop();
}
for(const scenario of ['snapshot-first-approved','snapshot-first-newer','missing-id','disconnect']){
 const m=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);m.hostId='alice';m.wave=1;m.running=true;let options,finish,last=0,speed=1;
 const snapshot=()=>({match:structuredClone(m),speedControl:{speed,lastRequestId:last,request:null}});
 const g=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});
 g.beginCoop(o=>{options=o;return {start(){o.onSnapshot(snapshot());o.onStatus(true);},stop(){},command(c){if(c.type==='requestSpeed')return new Promise(resolve=>finish=resolve);return Promise.resolve({ok:true});}};});
 el('speed').onclick();await new Promise(resolve=>setTimeout(resolve,0));
 if(scenario.startsWith('snapshot-first')){last=scenario==='snapshot-first-approved'?1:2;speed=2;options.onSnapshot(snapshot());}
 if(scenario==='disconnect')options.onStatus(false);
 finish(scenario==='missing-id'||scenario==='disconnect'?{ok:true}:{ok:true,requestId:1});await new Promise(resolve=>setTimeout(resolve,0));
 const expected=scenario==='snapshot-first-approved'?/2× approved by all players/i:scenario==='snapshot-first-newer'?/2× request ended\. Check the current speed/i:scenario==='missing-id'?/Request sent\. Check the current status/i:/connection interrupted/i;
 assert.match(el('message').textContent,expected,scenario);await g.leaveCoop();
}

// A reconnect sends a neutral movement command. A simultaneous vote click
// must wait for that receipt, but never outlive the roster or request it saw.
const queueMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);queueMatch.hostId='alice';queueMatch.wave=1;queueMatch.running=true;
let queueOptions,releaseDirection,queueGeneration=10,queueSpeedVote=null,queueSpeedLast=0;const queueCalls=[];
const queueSnapshot=()=>({match:structuredClone(queueMatch),speedControl:{speed:1,lastRequestId:queueSpeedLast,request:queueSpeedVote},rosterGeneration:queueGeneration,focusGeneration:1});
const queueFactory=options=>{queueOptions=options;return {start(){options.onSnapshot(queueSnapshot());options.onStatus(true);},stop(){},async command(command){queueCalls.push(command);if(command.type==='direction')return new Promise(resolve=>{releaseDirection=resolve;});if(command.type==='requestSpeed'){queueSpeedLast++;queueSpeedVote={id:queueSpeedLast,requester:'alice',wave:1,required:['bob'],approved:[]};options.onSnapshot(queueSnapshot());return {ok:true};}return applyCommand(queueMatch,'alice',command);}};};
const queueGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});queueGame.beginCoop(queueFactory);
queueOptions.onStatus(false);queueOptions.onStatus(true);el('speed').onclick();assert.match(el('message').textContent,/after movement is synchronized/);assert.equal(queueCalls.filter(c=>c.type==='requestSpeed').length,0);
releaseDirection({ok:true});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(queueCalls.filter(c=>c.type==='requestSpeed').length,1,'2x tap is sent once after movement');
queueSpeedVote=null;queueOptions.onSnapshot(queueSnapshot());queueOptions.onStatus(false);queueOptions.onStatus(true);el('speed').onclick();queueGeneration++;queueOptions.onSnapshot(queueSnapshot());releaseDirection({ok:true});await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(queueCalls.filter(c=>c.type==='requestSpeed').length,1,'a changed roster invalidates the deferred 2x request');assert.match(el('fieldNoticeText').textContent,/request changed/i,'a refused request is a warning, not ordinary traffic');
// A vote may start and be cancelled before this client sees any pending vote.
// The counter still advances, so a queued tap cannot revive the old request.
queueOptions.onStatus(false);queueOptions.onStatus(true);el('speed').onclick();queueSpeedLast++;queueOptions.onSnapshot(queueSnapshot());releaseDirection({ok:true});await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(queueCalls.filter(c=>c.type==='requestSpeed').length,1,'an unseen completed 2x vote invalidates the deferred request');assert.match(el('fieldNoticeText').textContent,/request changed/i,'a refused request is a warning, not ordinary traffic');
queueMatch.running=false;queueSpeedVote=null;queueOptions.onSnapshot(queueSnapshot());queueOptions.onStatus(false);queueOptions.onStatus(true);el('start').onclick();
const unseen=applyCommand(queueMatch,'bob',{type:'startWave'});assert.equal(unseen.ok,true);assert.equal(applyCommand(queueMatch,'bob',{type:'cancelWave',requestId:unseen.requestId}).ok,true);queueOptions.onSnapshot(queueSnapshot());releaseDirection({ok:true});await new Promise(resolve=>setTimeout(resolve,0));
assert.ok(!queueCalls.some(c=>c.type==='startWave'),'an unseen withdrawn wave invalidates the deferred request');assert.match(el('fieldNoticeText').textContent,/request changed/i,'a refused request is a warning, not ordinary traffic');
assert.equal(applyCommand(queueMatch,'bob',{type:'startWave'}).ok,true);queueOptions.onSnapshot(queueSnapshot());const oldWaveId=queueMatch.waveRequest.id;
queueOptions.onStatus(false);queueOptions.onStatus(true);el('start').onclick();assert.equal(applyCommand(queueMatch,'alice',{type:'declineWave',requestId:oldWaveId}).ok,true);assert.equal(applyCommand(queueMatch,'bob',{type:'startWave'}).ok,true);queueOptions.onSnapshot(queueSnapshot());
releaseDirection({ok:true});await new Promise(resolve=>setTimeout(resolve,0));assert.ok(!queueCalls.some(c=>c.type==='approveWave'),'an approval cannot jump to a replacement request');assert.match(el('fieldNoticeText').textContent,/request changed/i,'a refused request is a warning, not ordinary traffic');await queueGame.leaveCoop();

// Opening an occupied pad while movement is still being acknowledged must not
// drop the first upgrade tap. Closing/changing the menu cancels a deferred tap.
const heldMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);heldMatch.hostId='alice';assert.ok(applyCommand(heldMatch,'bob',{type:'build',pad:0,towerType:0}).ok);
let heldOptions,finishMovement;const heldCalls=[];const heldSnapshot=()=>({match:structuredClone(heldMatch),rosterGeneration:1,focusGeneration:0});
const heldFactory=options=>{heldOptions=options;return {start(){options.onSnapshot(heldSnapshot());options.onStatus(true);},stop(){},async command(command){heldCalls.push(command);if(command.type==='direction')return new Promise(resolve=>{finishMovement=resolve;});const result=applyCommand(heldMatch,'alice',command);options.onSnapshot(heldSnapshot());return result;}};};
const heldGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road',deferTutorial:true});heldGame.beginCoop(heldFactory);
heldOptions.onStatus(false);heldOptions.onStatus(true);await el('game').onclick({clientX:105,clientY:210});el('radial0').onclick();
assert.match(el('message').textContent,/upgrade.*synchronized/i);assert.equal(heldCalls.filter(c=>c.type==='upgrade').length,0);
finishMovement({ok:true});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(heldCalls.filter(c=>c.type==='upgrade').length,1);assert.equal(heldMatch.towers[0].level,2);
heldMatch.towers[0].level=1;heldMatch.players.alice.money=125;heldOptions.onSnapshot(heldSnapshot());heldOptions.onStatus(false);heldOptions.onStatus(true);await el('game').onclick({clientX:105,clientY:210});el('radial0').onclick();el('radialClose').onclick();finishMovement({ok:true});await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(heldCalls.filter(c=>c.type==='upgrade').length,1,'a closed menu cannot send a queued upgrade');
heldOptions.onStatus(false);heldOptions.onStatus(true);await el('game').onclick({clientX:105,clientY:210});el('radial0').onclick();heldMatch.towers[0].id++;heldOptions.onSnapshot(heldSnapshot());finishMovement({ok:true});await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(heldCalls.filter(c=>c.type==='upgrade').length,1,'a replacement tower cannot receive an old queued upgrade');
// Back out of one specialization and reopen another: even though a details
// dialog is open again, it is not the same user decision.
el('radialClose').onclick();heldMatch.towers[0].level=2;heldMatch.players.alice.money=1000;heldOptions.onSnapshot(heldSnapshot());heldOptions.onStatus(false);heldOptions.onStatus(true);await el('game').onclick({clientX:105,clientY:210});el('radial0').onclick();el('radial0').onclick();assert.equal(el('towerDetails').open,true);el('towerDetailsConfirm').onclick();assert.match(el('towerDetailsCost').textContent,/upgrade.*synchronized/i);
el('towerDetailsBack').onclick();el('radial1').onclick();assert.equal(el('towerDetails').open,true);finishMovement({ok:true});await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(heldCalls.filter(c=>c.type==='upgrade').length,1,'reopening a different specialization cannot authorize the old selection');el('radialClose').onclick();await heldGame.leaveCoop();

// Training schedules its coach two animation frames later. Run those frames
// manually so we can change session, abandon the run or join a party in between.
const trainingFrames=[];globalThis.requestAnimationFrame=fn=>{trainingFrames.push(fn);return trainingFrames.length;};
let trainingId='first',trainingVersion=1,trainingSessionChange,canChooseSolo=true;
const trainingAccount={getProfile:()=>({name:trainingId,gender:'female'}),getUserId:()=>trainingId,getSessionVersion:()=>trainingVersion,isReady:()=>true,getLevel:()=>1,canChooseSolo:()=>canChooseSolo,onSessionChange(fn){trainingSessionChange=fn;},awardXP(){}};
const trainingRaceGame=startGame(trainingAccount,{nextMapId:()=> 'road',deferTutorial:true,confirmAction:async()=>true});
trainingFrames.shift(); // The independent, continuously scheduled game loop.
const scheduleCoach=()=>{const outer=trainingFrames.shift();assert.equal(typeof outer,'function');outer();const inner=trainingFrames.shift();assert.equal(typeof inner,'function');return inner;};
assert.equal(trainingRaceGame.startTrainingRun(),true);const oldSessionCoach=scheduleCoach();
trainingId='second';trainingVersion++;trainingSessionChange();
assert.equal(trainingRaceGame.isTrainingRun(),false,'a new account must not inherit the old training contract');
assert.equal(trainingRaceGame.startTrainingRun(),true,'the new account can start its own training');
oldSessionCoach();assert.equal(trainingRaceGame.isCoachOpen(),false,'an old queued coach cannot start in the new session');
scheduleCoach()();assert.equal(trainingRaceGame.isCoachOpen(),true,'the current training coach still starts normally');trainingRaceGame.stopCoach();
assert.equal(trainingRaceGame.startTrainingRun({restart:true}),true);const abandonedCoach=scheduleCoach();
await el('endRun').onclick();abandonedCoach();assert.equal(trainingRaceGame.isCoachOpen(),false,'an abandoned run cannot start its queued coach');
assert.equal(trainingRaceGame.startTrainingRun({restart:true}),true);const partyCoach=scheduleCoach();
const trainingParty=createMatch([createPlayer('second',{name:'Second',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);trainingParty.hostId='second';
assert.equal(trainingRaceGame.beginCoop(options=>({start(){options.onSnapshot({match:structuredClone(trainingParty)});options.onStatus(true);},stop(){},command:async()=>({ok:true})})),true);
assert.equal(trainingRaceGame.isTrainingRun(),false,'joining a party ends the training contract');
assert.equal(trainingRaceGame.startTrainingRun(),false,'training cannot replace an active multiplayer field');partyCoach();assert.equal(trainingRaceGame.isCoachOpen(),false);
await trainingRaceGame.leaveCoop();canChooseSolo=false;assert.equal(trainingRaceGame.startTrainingRun(),false,'an open lobby also blocks a late training handoff');
});
