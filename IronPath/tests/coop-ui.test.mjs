import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { createMatch } from '../simulation.mjs';
import { createPlayer, applyCommand } from '../match.mjs';
const nodes=new Map(),drawnText=[],ctx=new Proxy({}, {get:(_target,key)=>key==='fillText'?(text=>drawnText.push(text)):()=>{},set:()=>true});let frame;
function el(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{flags:{},toggle(name,on){this.flags[name]=on;}},setAttribute(){},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return nodes.get(id);}
globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},getElementById:el,activeElement:{tagName:'BODY'}};
globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,confirm:()=>true,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
globalThis.requestAnimationFrame=fn=>{frame=fn;};
let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
for(const file of ['focus-pause.mjs','story-cinematics.mjs','campaign.mjs','story-mission.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs'])source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
source=source.replace(/'\.\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const match=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);let opts,awards=0,stopCalled=false,commands=[];match.hostId='alice';
const factory=options=>{opts=options;return {start(){options.onSnapshot({match:structuredClone(match)});options.onStatus(true);},stop(){stopCalled=true;},async command(command){commands.push(command);const result=applyCommand(match,'alice',command);options.onSnapshot({match:structuredClone(match)});return result;}};};
let mapGeneration=0,allowEnd=false,confirmation;
const game=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',getToken:async()=> 'test',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){awards++;}}, {coopUrl:'wss://trusted.example/match',clientFactory:factory,nextMapId:()=>{mapGeneration++;return 'road';},confirmAction:async options=>{confirmation=options;return allowEnd;}});
el('tutorialSkip').onclick();assert.equal(el('coopControls').hidden,false);assert.equal(mapGeneration,1);game.resetSkills();assert.equal(mapGeneration,1,'editing skills does not reroll the current operation');
await el('coopToggle').onclick();assert.equal(mapGeneration,2,'a co-op start generates a new battlefield');assert.equal(el('coopStatus').textContent,'CONNECTING');assert.equal(el('soloObjective').hidden,true,'campaign tracker is hidden in multiplayer');assert.equal(el('speed').disabled,true);
opts.onStatus(false);opts.onStatus(true);await new Promise(resolve=>setTimeout(resolve,0));assert.deepEqual(commands.at(-1),{type:'direction',x:0,y:0},'reconnection neutralizes movement');
match.wave=5;match.running=true;match.spawnLeft=1;opts.onSnapshot({match:structuredClone(match)});assert.match(el('bossAlertTitle').textContent,/BOSS INCOMING.*Ironclad/);assert.equal(el('bossAlert').hidden,false);
match.enemies=[{boss:'bossIronclad',kind:'tank',hp:50,maxHp:100,x:100,y:100,segment:1}];opts.onSnapshot({match:structuredClone(match)});assert.match(el('bossAlertTitle').textContent,/BOSS · Ironclad/);assert.equal(el('bossHealthFill').style.width,'50%');
match.enemies[0].bossClock=7;match.enemies.push({kind:'runner',hp:40,maxHp:40,x:100,y:100,segment:1,speed:0});opts.onSnapshot({match:structuredClone(match)});assert.match(el('bossAlertInfo').textContent,/SHIELD RAISING.*1s/);assert.match(el('threatSummary').textContent,/Scout 1/);assert.equal(el('threatTank').textContent,'1');assert.equal(el('threatRunner').textContent,'1');

match.wave=0;match.running=false;match.spawnLeft=0;match.enemies=[];opts.onSnapshot({match:structuredClone(match)});assert.equal(el('bossAlert').hidden,true);
match.players.bob.skills.active='recon';opts.onSnapshot({match:structuredClone(match)});match.players.bob.cooldown=30;opts.onSnapshot({match:structuredClone(match)});frame(performance.now()+100);assert.ok(drawnText.includes('SUPPRESSION'),'teammate ability renders from a co-op view');
opts.onStatus(false);opts.onStatus(true);drawnText.length=0;opts.onSnapshot({match:structuredClone(match)});frame(performance.now()+200);assert.ok(!drawnText.includes('SUPPRESSION'),'reconnect does not replay an old ability');await new Promise(resolve=>setTimeout(resolve,0));
el('game').onclick({clientX:105,clientY:210});assert.equal(el('sheetMode').textContent,'BATTLE CONTINUES');el('radial0').onclick();el('towerDetailsConfirm').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(match.towers.length,1);assert.equal(el('money').textContent,75);
// Availability updates live while the multiplayer tower sheet and details stay open.
match.towers[0].level=2;match.players.alice.money=0;opts.onSnapshot({match:structuredClone(match)});
el('game').onclick({clientX:105,clientY:210});el('radial0').onclick();
assert.equal(el('radial2').classList.flags.unaffordable,true,'level-locked specialization is grey');
el('radial2').onclick();assert.equal(el('towerDetailsConfirm').disabled,true);assert.match(el('towerDetailsCost').textContent,/level 5/i);
match.players.alice.money=1000;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('towerDetailsConfirm').disabled,true,'funds alone do not bypass level lock');
match.players.alice.level=5;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('towerDetailsConfirm').disabled,false);assert.equal(el('radial2').classList.flags.unaffordable,false);
match.players.alice.money=0;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('towerDetailsConfirm').disabled,true);assert.match(el('towerDetailsCost').textContent,/Not enough supplies/);
match.players.alice.money=1000;opts.onSnapshot({match:structuredClone(match)});assert.equal(el('towerDetailsConfirm').disabled,false,'new supplies enable the already-open confirmation');
el('towerDetailsBack').onclick();el('radialClose').onclick();match.towers[0].level=1;match.players.alice.level=1;match.players.alice.money=75;opts.onSnapshot({match:structuredClone(match)});
// A replacement made by the other player cannot be sold by an old open menu.
el('game').onclick({clientX:105,clientY:210});el('radial1').onclick();
assert.equal(applyCommand(match,'bob',{type:'sell',pad:0}).ok,true);
assert.equal(applyCommand(match,'bob',{type:'build',pad:0,towerType:0}).ok,true);
opts.onSnapshot({match:structuredClone(match)});el('radial0').onclick();await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(match.towers.length,1);assert.match(el('message').textContent,/Tower changed/);
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
await el('endRun').onclick();assert.equal(match.ended,false);assert.match(confirmation.text,/all players/);allowEnd=true;await el('endRun').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(match.ended,true);assert.equal(el('start').textContent,'MATCH ENDED');assert.equal(el('endRun').disabled,false);assert.equal(el('endRun').textContent,'CLOSE PARTY');assert.match(el('message').textContent,/Shared run ended/);assert.equal(el('runResults').open,true);assert.match(el('resultsOutcome').textContent,/CO-OP/);game.recordCoopReward('test','saved',{delta:{xp:30,scrap:10,items:['Field Scope'],levels:1},profile:{xp:300}});assert.match(el('resultsRewards').textContent,/\+30 XP/);assert.match(el('resultsRewards').textContent,/Field Scope/);assert.match(el('resultsUnlocks').textContent,/1 new skill point/);game.recordCoopReward('test','error',null,1);game.recordCoopReward('test','saved',{delta:{xp:0,scrap:0,items:[],levels:0}},0);assert.match(el('resultsSave').textContent,/could not be confirmed/);game.recordCoopReward('test','confirmed',null,1);assert.doesNotMatch(el('resultsSave').textContent,/could not be confirmed/);el('resultsDone').onclick();
el('coopToggle').onclick();assert.equal(stopCalled,true);assert.equal(el('money').textContent,125);assert.equal(el('speed').disabled,false);
assert.equal(game.confirmParty(),true);assert.equal(game.beginCoop(callbacks=>factory(callbacks),()=>{},'party-test'),true);
assert.equal(el('speed').disabled,true);assert.equal(game.beginCoop(callbacks=>factory(callbacks)),false);
await game.leaveCoop();assert.equal(el('money').textContent,125);assert.equal(el('speed').disabled,false);
console.log('Opt-in co-op UI adapter and party handoff smoke tests passed.');
// Guest approves the host's request and leaves without ending the host's run.
const guestMatch=createMatch([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})]);guestMatch.hostId='alice';
let guestOptions,guestStopped=false,leftParty=0,guestCommands=[],guestGame;
const guestFactory=options=>{guestOptions=options;return {start(){options.onSnapshot({match:structuredClone(guestMatch)});options.onStatus(true);},stop(){guestStopped=true;},async command(command){guestCommands.push(command);const result=applyCommand(guestMatch,'bob',command);options.onSnapshot({match:structuredClone(guestMatch)});return result;}};};
guestGame=startGame({getProfile:()=>({name:'Bob',gender:'male'}),getUserId:()=> 'bob',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{confirmAction:async()=>true,leaveParty:async()=>{leftParty++;await guestGame.leaveCoop();return true;},nextMapId:()=> 'road'});
assert.equal(guestGame.beginCoop(cb=>guestFactory(cb)),true);assert.equal(el('start').textContent,'WAIT FOR HOST');assert.equal(el('start').disabled,true);assert.equal(el('endRun').textContent,'LEAVE CO-OP');
assert.equal(applyCommand(guestMatch,'alice',{type:'startWave'}).waitingForGuest,true);guestOptions.onSnapshot({match:structuredClone(guestMatch)});assert.equal(el('start').textContent,'APPROVE WAVE');assert.equal(el('waveRequest').hidden,false);
el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(guestMatch.wave,1);assert.equal(guestCommands.at(-1).type,'approveWave');
await el('endRun').onclick();assert.equal(leftParty,1);assert.equal(guestStopped,true);assert.equal(guestMatch.ended,false);assert.equal(guestMatch.players.bob.active,false);assert.ok(guestCommands.some(c=>c.type==='leaveRun'));assert.equal(el('runResults').open,true);assert.match(el('resultsTitle').textContent,/left the operation/);el('resultsDone').onclick();
// The versus canvas is taller and the opponent lane is visible but read-only.
const {createVersus,applyVersus,versusView,stepVersus}=await import('../versus.mjs');
const duel=createVersus([createPlayer('alice',{name:'Alice',gender:'female'}),createPlayer('bob',{name:'Bob',gender:'male'})],'road','alice');let duelOptions,duelCommands=[];
const duelFactory=options=>{duelOptions=options;return {start(){options.onSnapshot({match:versusView(duel,'alice')});options.onStatus(true);},stop(){},async command(command){duelCommands.push(command);const result=applyVersus(duel,'alice',command);options.onSnapshot({match:versusView(duel,'alice')});return result;}};};
const duelGame=startGame({getProfile:()=>({name:'Alice',gender:'female'}),getUserId:()=> 'alice',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road'});
assert.equal(duelGame.beginCoop(cb=>duelFactory(cb)),true);assert.equal(el('game').height,1100);assert.equal(el('versusStatus').hidden,false);assert.equal(el('start').textContent,'REQUEST WAVE');
const count=duelCommands.length;el('game').onclick({clientX:100,clientY:350});assert.equal(duelCommands.length,count);assert.match(el('message').textContent,/opponent’s battlefield/);
duel.lanes.bob.hp=0;stepVersus(duel);duelOptions.onSnapshot({match:versusView(duel,'alice')});assert.equal(el('versusTitle').textContent,'VICTORY');assert.match(el('resultsTitle').textContent,/Victory/);el('resultsDone').onclick();await duelGame.leaveCoop();assert.equal(el('game').height,540);
// The real four-player protocol wrapper is projected onto the local 2v2 field.
const {createTwoVsTwo,applyFourCommand,stepFour}=await import('../four-modes.mjs');
const fourIds=['alice','bob','cara','dan'];const four=createTwoVsTwo(fourIds.map(id=>createPlayer(id,{name:id,gender:'female'})),'alice',[['alice','bob'],['cara','dan']]);let fourOptions,fourCommands=[];
const fourFactory=options=>{fourOptions=options;return {start(){options.onSnapshot({match:structuredClone(four)});options.onStatus(true);},stop(){},async command(command){fourCommands.push(command);const result=applyFourCommand(four,'cara',command);options.onSnapshot({match:structuredClone(four)});return result;}};};
const fourGame=startGame({getProfile:()=>({name:'Cara',gender:'female'}),getUserId:()=> 'cara',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{nextMapId:()=> 'road'});
assert.equal(fourGame.beginCoop(cb=>fourFactory(cb)),true);assert.equal(el('versusTitle').textContent,'2 VS 2 · TEAM B');assert.equal(el('start').textContent,'WAIT FOR HOST');
const fourRequest=applyFourCommand(four,'alice',{type:'startWave'});fourOptions.onSnapshot({match:structuredClone(four)});assert.equal(el('start').textContent,'APPROVE WAVE');el('start').onclick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(fourCommands.at(-1).requestId,fourRequest.requestId);assert.equal(el('start').textContent,'WAIT FOR PLAYERS');assert.equal(el('start').disabled,true);
four.lanes[0].hp=0;stepFour(four);fourOptions.onSnapshot({match:structuredClone(four)});assert.equal(el('versusTitle').textContent,'VICTORY');assert.match(el('resultsTitle').textContent,/Victory/);el('resultsDone').onclick();await fourGame.leaveCoop();
