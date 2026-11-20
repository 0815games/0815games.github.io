import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {createPartyEndCoordinator} from '../party-end-coordinator.mjs';
import {createHost} from '../protocol.mjs';
import {createMatch} from '../simulation.mjs';
import {createPlayer,applyCommand} from '../match.mjs';
import {createFourCoop,createTwoVsTwo,applyFourCommand} from '../four-modes.mjs';
import {projectFourGameView} from '../four-game-view.mjs';
import {createVersus} from '../versus.mjs';
import {createFourPlayerPanel} from '../firebase-four-panel.mjs';
import {setupLanguage} from '../language.mjs?v=20261120-sellicon1';

const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('coordinator separates normal close from host force-close and tracks departed/offline precedence',async()=>{
  const ids=['alice','bob','cara','dan'];
  const queues=new Map([[0,{isSettled:()=>true,hasConfirmed:mask=>(mask&3)===3}]]);
  const statuses=[],sends=[],closes=[];
  const c=createPartyEndCoordinator({
    uid:'alice',hostId:'alice',playerIds:ids,getQueues:()=>queues,
    send:async tick=>{sends.push(tick);return {ok:true};},
    onClose:async tick=>{closes.push(tick);return true;},
    onStatus:(value,tick,detail)=>statuses.push({value,tick,detail}),
    setTimer:()=>1,clearTimer:()=>{}
  });
  c.observeReward(0,3);
  c.observe({
    partyEnd:{tick:10,acknowledged:[]},snapshotTick:12,ended:true,reportReady:true,masks:{0:3},
    members:{
      alice:{active:true,departed:false},
      bob:{active:false,departed:false},
      cara:{active:false,departed:true},
      dan:{active:true,departed:false}
    }
  });
  await flush();
  assert.deepEqual(sends,[10]);
  assert.equal(c.canClose(10),false);
  assert.equal(c.canForceClose(10),false,'host ack not reflected yet in partyEnd.acknowledged');

  c.observe({
    partyEnd:{tick:10,acknowledged:['alice']},snapshotTick:13,ended:true,reportReady:true,masks:{0:3},
    members:{
      alice:{active:true,departed:false},
      bob:{active:false,departed:false},
      cara:{active:false,departed:true},
      dan:{active:true,departed:false}
    }
  });
  await flush();
  assert.equal(c.canClose(10),false);
  assert.equal(c.canForceClose(10),true);
  assert.deepEqual(c.missingIds(),['bob','cara','dan']);
  assert.deepEqual(c.departedIds(),['cara'],'departed takes precedence over offline');
  assert.deepEqual(c.offlineIds(),['bob'],'bob is offline only, cara is not double-listed');
  assert.equal(statuses.at(-1).value,'waiting');
  assert.equal(statuses.at(-1).detail.canForceClose,true);
  assert.deepEqual(statuses.at(-1).detail.departedIds,['cara']);
  assert.deepEqual(statuses.at(-1).detail.offlineIds,['bob']);

  // Bob reconnects and Cara+Bob+Dan finish confirming.
  let canCloseDuringClose=false;
  const checkClosingCoordinator=createPartyEndCoordinator({
    uid:'alice',hostId:'alice',playerIds:ids,getQueues:()=>queues,
    send:async()=>({ok:true}),
    onClose:async tick=>{canCloseDuringClose=checkClosingCoordinator.canClose(tick);return true;},
    setTimer:()=>1,clearTimer:()=>{}
  });
  checkClosingCoordinator.observeReward(0,3);
  checkClosingCoordinator.observe({partyEnd:{tick:10,acknowledged:ids},snapshotTick:14,ended:true,reportReady:true,masks:{0:3}});
  await flush();
  assert.equal(canCloseDuringClose,true,'canClose unlocks once every member confirms');
  c.observe({
    partyEnd:{tick:10,acknowledged:ids},snapshotTick:14,ended:true,reportReady:true,masks:{0:3},
    members:{alice:{active:true},bob:{active:true,departed:false},cara:{active:true,departed:false},dan:{active:true}}
  });
  await flush();
  assert.equal(c.canForceClose(10),false,'no force-close needed once everyone confirms');
  assert.deepEqual(closes,[10]);
  c.stop();checkClosingCoordinator.stop();
});

test('coordinator never allows guests to force-close even when missing players exist',async()=>{
  const queues=new Map([[0,{isSettled:()=>true,hasConfirmed:()=>true}]]);
  const c=createPartyEndCoordinator({
    uid:'bob',hostId:'alice',playerIds:['alice','bob','cara'],getQueues:()=>queues,
    send:async()=>({ok:true}),onClose:async()=>true,setTimer:()=>1,clearTimer:()=>{}
  });
  c.observeReward(0,1);
  c.observe({partyEnd:{tick:5,acknowledged:['bob']},snapshotTick:6,ended:true,reportReady:true,masks:{0:1},members:{alice:{active:false},bob:{active:true},cara:{active:false,departed:true}}});
  await flush();
  assert.equal(c.canForceClose(5),false);
  assert.equal(c.canClose(5),false);
  c.stop();
});

test('all multiplayer modes mark early leavers as departed and clear departed on reconnect',()=>{
  const players=n=>Array.from({length:n},(_,i)=>createPlayer(['alice','bob','cara','dan'][i],{name:['Alice','Bob','Cara','Dan'][i],gender:'female'}));

  // 2p coop
  const coop=createMatch(players(2));coop.hostId='alice';
  assert.equal(applyCommand(coop,'bob',{type:'leaveRun'}).ok,true);
  assert.equal(coop.players.bob.departed,true);
  const coopHost=createHost(coop);coopHost.setPlayerActive('bob',true);
  assert.equal(coopHost.snapshotFor('alice').match.players.bob.departed,undefined);

  // four-coop
  const fc=createFourCoop(players(4),'alice');
  assert.equal(applyFourCommand(fc,'cara',{type:'leaveRun'}).ok,true);
  const fcView=projectFourGameView({tick:1,match:fc},'alice').match;
  assert.deepEqual(fcView.fourInfo.memberStates.cara,{active:false,departed:true});
  const fcHost=createHost(fc);fcHost.setPlayerActive('cara',true);
  assert.deepEqual(projectFourGameView(fcHost.snapshotFor('alice'),'alice').match.fourInfo.memberStates.cara,{active:true,departed:false});

  // two-vs-two preserves memberStates across separate lanes
  const tvt=createTwoVsTwo(players(4),'alice',[['alice','bob'],['cara','dan']]);
  assert.equal(applyFourCommand(tvt,'dan',{type:'leaveRun'}).ok,true);
  const tvtHost=createHost(tvt);tvtHost.setPlayerActive('bob',false);
  const tvtView=projectFourGameView(tvtHost.snapshotFor('alice'),'alice').match;
  assert.deepEqual(tvtView.fourInfo.memberStates,{
    alice:{active:true,departed:false},
    bob:{active:false,departed:false},
    cara:{active:true,departed:false},
    dan:{active:true,departed:true}
  });

  // versus exposes top-level memberStates despite rival per-lane active=false masking
  const vs=createVersus(players(2),'road','alice');
  const vsHost=createHost(vs);
  const activeBoth=vsHost.snapshotFor('alice').match;
  assert.equal(activeBoth.players.bob.active,false,'versusView intentionally masks rival lane active flag');
  assert.deepEqual(activeBoth.memberStates,{alice:{active:true,departed:false},bob:{active:true,departed:false}},'top-level memberStates distinguishes an active rival from an offline one');
  vsHost.setPlayerActive('bob',false);
  assert.equal(vsHost.snapshotFor('alice').match.memberStates.bob.active,false);
  vsHost.setPlayerActive('bob',true);
  vsHost.receive('bob',{version:1,seq:1,command:{type:'leaveRun'}});
  vsHost.advance();
  const vsForfeit=vsHost.snapshotFor('alice').match;
  assert.equal(vsForfeit.ended,true);
  assert.deepEqual(vsForfeit.memberStates.bob,{active:true,departed:true});
});

test('lobby panel surfaces missing/departed/offline names, force-closes with confirmation, and stays race-safe if everyone confirms during the dialog',async()=>{
  const profiles={alice:{name:'Alice',gender:'female',level:1},bob:{name:'Bob',gender:'male',level:1},cara:{name:'Cara',gender:'female',level:1},dan:{name:'Dan',gender:'male',level:1}};
  const manifest={hostId:'alice',playerIds:['alice','bob','cara','dan'],mode:'four-coop',teams:[0,0,1,1]};
  const makeFixture=(opts={})=>{
    const nodes=new Map();
    const make=()=>({hidden:false,disabled:false,textContent:'',value:'',className:'',src:'',alt:'',innerHTML:'',title:'',children:[],setAttribute(n,v){this[n]=v;},append(...els){this.children.push(...els);},replaceChildren(...els){this.children=[...els];}});
    const doc={getElementById(id){if(!nodes.has(id))nodes.set(id,make());return nodes.get(id);},createElement:make};
    const $=id=>doc.getElementById(id);
    const w={},calls=[],leaves=[];
    const watch=(key,initial)=>(_id,cb)=>{w[key]=cb;if(initial!==undefined)cb(initial);return()=>{if(w[key]===cb)delete w[key];};};
    const lobby={
      async create(){return {hostId:'alice',partyId:'party',inviteCode:'0123'};},
      async configure(){},
      async start(){return {...manifest,profiles:Object.values(profiles)};},
      async close(){calls.push('close');if(opts.failClose)throw Error('offline');},
      async leave(){},async cancel(){},
      watchHost:watch('host','alice'),watchSlots:watch('slots',{one:'bob',two:'cara',three:'dan'}),
      watchConfig:watch('config',{mode:'four-coop'}),watchStarted:watch('started',null),
      watchRequests:watch('requests',{}),watchOwnRequest:watch('own',{name:'Bob'}),
      watchProfile(_p,id,cb){cb(profiles[id]||null);return()=>{};}
    };
    let canComplete=opts.canComplete??false,canForce=opts.canForce??true;
    const panel=createFourPlayerPanel({
      document:doc,createLobby:()=>lobby,getProfile:()=>profiles.alice,
      confirmStart:async()=>true,confirmClose:async()=>true,
      confirmForceClose:opts.confirmForceClose|| (async()=>true),
      onRequestHostEnd:async()=>true,
      canCompleteEnd:()=>canComplete,
      canForceCloseEnd:()=>canForce,
      onLeaveMatch:async options=>leaves.push(options),
      onMatch:()=>true
    });
    return {$,w,calls,leaves,panel,setFlags:(complete,force)=>{canComplete=complete;canForce=force;}};
  };

  // Host starts, sees missing/offline/departed names (EN + DE), cancels -> keeps party, confirms -> forced close
  const select={value:'',addEventListener(_type,callback){this.change=callback;}},note={},langDoc={documentElement:{},getElementById:id=>id==='languageSelect'?select:note,querySelectorAll:()=>[]};
  setupLanguage({document:langDoc,storage:null});
  select.value='en';select.change();

  let forcePrompts=[],nextConfirm=false;
  const f=makeFixture({confirmForceClose:async payload=>{forcePrompts.push(payload);return nextConfirm;}});
  await f.$('fourPartyCreate').onclick();
  await f.$('fourPartyStart').onclick();
  assert.equal(f.$('fourPartyForceClose').hidden,true,'hidden until waiting with canForceClose');

  const detail={endTick:10,canForceClose:true,missingEntries:[{name:'Bob',state:'offline'},{name:'Cara',state:'departed'},{name:'Dan',state:'confirming'}]};
  f.panel.completionStatus('party','waiting',detail);
  assert.equal(f.$('fourPartyForceClose').hidden,false);
  assert.equal(f.$('fourPartyForceClose').disabled,false);
  assert.equal(f.$('fourPartyStatus').textContent,'Waiting for reports and saved rewards from: Bob (offline), Cara (left early), Dan.');

  // Language switches live to German and back to English
  select.value='de';select.change();
  assert.equal(f.$('fourPartyForceClose').textContent,'GRUPPE JETZT SCHLIESSEN');
  assert.equal(f.$('fourPartyStatus').textContent,'Ausstehende Berichte und gespeicherte Belohnungen von: Bob (offline), Cara (frühzeitig verlassen), Dan.');
  select.value='en';select.change();

  // Cancel confirmation keeps party alive
  assert.equal(await f.panel.forceCompleteParty('party',10),false);
  assert.equal(forcePrompts.length,1);
  assert.deepEqual(forcePrompts[0].departedNames,['Cara']);
  assert.deepEqual(forcePrompts[0].offlineNames,['Bob']);
  assert.deepEqual(forcePrompts[0].missingNames,['Bob','Cara','Dan']);
  assert.deepEqual(f.calls,[]);
  assert.equal(f.panel.isActive(),true);

  // Confirm forces party closure and preserves local report with forced=true
  nextConfirm=true;
  assert.equal(await f.panel.forceCompleteParty('party',10),true);
  assert.deepEqual(f.calls,['close']);
  assert.equal(f.panel.isActive(),false);
  assert.deepEqual(f.leaves,[{preserveReport:true,hostClosed:true,forced:true}]);

  // Concurrency guard: while confirmForceClose is open, normal completeParty is NOT blocked
  let resolveModal;
  const r=makeFixture({confirmForceClose:()=>new Promise(res=>{resolveModal=res;})});
  await r.$('fourPartyCreate').onclick();
  await r.$('fourPartyStart').onclick();
  r.panel.completionStatus('party','waiting',detail);
  const pendingForce=r.panel.forceCompleteParty('party',10);
  assert.equal(typeof resolveModal,'function');
  // Now missing player confirms before host responds to modal -> automatic completeParty wins cleanly!
  r.setFlags(true,false);
  assert.equal(await r.panel.completeParty('party',10),true);
  assert.equal(r.panel.isActive(),false);
  resolveModal(true);
  assert.equal(await pendingForce,false,'stale modal cannot throw or double-close');
  assert.equal(r.calls.length,1,'close called exactly once');

  // Failed close keeps party open for retry
  const err=makeFixture({failClose:true});
  await err.$('fourPartyCreate').onclick();
  await err.$('fourPartyStart').onclick();
  err.panel.completionStatus('party','waiting',detail);
  assert.equal(await err.panel.forceCompleteParty('party',10),undefined);
  assert.equal(err.panel.isActive(),true);
  assert.equal(err.$('fourPartyForceClose').hidden,false);
});

test('results dialog displays missing players, exposes #resultsForceCloseParty only to host, and preserves DOM/CSS contracts',async()=>{
  const nodes=new Map(),ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
  function el(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',disabled:false,hidden:false,open:false,style:{},dataset:{},children:[],scrollWidth:400,clientWidth:400,scrollLeft:0,classList:{toggle(){}},contains(){return false;},setAttribute(){},removeAttribute(){},toggleAttribute(){},replaceChildren(...c){this.children=c;},get childElementCount(){return this.children.length;},addEventListener(type,fn){this['on'+type]=fn;},scrollTo(){},showModal(){this.open=true;},close(){this.open=false;},getContext(){return ctx;},getBoundingClientRect(){return {left:0,top:0,width:960,height:540};},width:960,height:540});return nodes.get(id);}
  globalThis.document={hasFocus:()=>true,hidden:false,addEventListener(){},querySelector:()=>null,getElementById:el,createElement:()=>({toggleAttribute(){}}),activeElement:{tagName:'BODY'}};
  globalThis.window={scrollBy(){},innerWidth:400,innerHeight:800,confirm:()=>true,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
  globalThis.requestAnimationFrame=()=>1;

  let source=await readFile(new URL('../game.js',import.meta.url),'utf8');
  for(const file of ['features.mjs','solo-deployment.mjs','workshop-run-receipt.mjs','canvas-resolution.mjs','language.mjs','map-zoom.mjs','game-localization.mjs','story-localization.mjs','soldier-motion.mjs','dialog-dismiss.mjs','focus-pause.mjs','story-cinematics.mjs','campaign.mjs','relics.mjs','story-mission.mjs','story-events.mjs','training-run.mjs','first-run-coach.mjs','four-game-view.mjs','battle-viewport-controller.mjs','battle-viewport.mjs','run-results.mjs','coop-motion.mjs','boss-mechanics.mjs','battle-sound.mjs','run-perks.mjs','terrain.mjs','maps.mjs','combat-fx.mjs','cartoon-art.mjs','match.mjs','combat.mjs','progression.mjs','battle-xp-hud.mjs','tower-upgrade-cue.mjs','tower-specialization.mjs','tower-class-paths.mjs','development-ui.mjs','report-promotion.mjs','rank-insignia.mjs','ability-hud.mjs','simulation.mjs','tutorial.mjs','coop-config.mjs','coop-client.mjs','coop-input.mjs','field-notice.mjs','map-intro.mjs'])
    source=source.replace(new RegExp(`'\\./${file.replace('.','\\.')}\\?[^']+'`),JSON.stringify(new URL('../'+file,import.meta.url).href));
  source=source.replace(/'\.\/skills\.mjs(?:\?[^']*)?'/,JSON.stringify(new URL('../skills.mjs',import.meta.url).href));
  const {startGame}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

  const runUiFor=async(myId)=>{
    nodes.clear();
    const match=createMatch(['alice','bob','cara'].map(id=>createPlayer(id,{name:id,gender:'female'})),'four-front');
    match.hostId='alice';match.players[myId].completedWaveMask=1;
    let tick=10,partyEnd={tick:11,acknowledged:['alice']},forceCalls=[];
    const snapshot=()=>({match:structuredClone(match),tick,partyEnd:structuredClone(partyEnd)});
    const game=startGame({getProfile:()=>({name:myId,gender:'female',xp:0}),getUserId:()=>myId,isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{
      nextMapId:()=>'road',deferTutorial:true,confirmAction:async()=>true,
      onForceCloseParty:(id,endTick)=>forceCalls.push({id,endTick})
    });
    const factory=o=>({start(){o.onSnapshot(snapshot());o.onStatus(true);},stop(){},canRequestHostEnd:()=>false,async command(cmd){const r=applyCommand(match,myId,cmd);o.onSnapshot(snapshot());return r;}});
    assert.equal(game.beginCoop(factory,()=>{},'party-force','coop',()=>{}),true);
    await game.requestHostPartyEnd('party-force');
    return {game,el,forceCalls};
  };

  // Host gets #resultsForceCloseParty & missing player names
  const hostUi=await runUiFor('alice');
  assert.equal(hostUi.game.setPartyFinalizationState('party-force',11,{
    canForceClose:true,
    missingEntries:[{name:'Bob',state:'offline'},{name:'Cara',state:'departed'}]
  }),true);
  assert.equal(hostUi.el('resultsForceCloseParty').hidden,false);
  assert.match(hostUi.el('resultsSave').textContent,/Waiting for reports and saved rewards from: Bob \(offline\), Cara \(left early\)\./);
  hostUi.el('resultsForceCloseParty').onclick();
  assert.deepEqual(hostUi.forceCalls,[{id:'party-force',endTick:11}]);
  await hostUi.game.leaveCoop({preserveReport:true,hostClosed:true});
  assert.equal(hostUi.el('resultsForceCloseParty').hidden,true,'hidden after party closure');
  assert.doesNotMatch(hostUi.el('resultsSave').textContent,/Waiting for reports/);
  assert.match(hostUi.el('resultsSave').textContent,/host closed the party/i);

  // Guest NEVER sees #resultsForceCloseParty
  nodes.clear();
  const match=createMatch(['alice','bob'].map(id=>createPlayer(id,{name:id,gender:'female'})));
  match.hostId='alice';match.players.bob.completedWaveMask=1;
  let onSnap;
  const game=startGame({getProfile:()=>({name:'Bob',gender:'female',xp:0}),getUserId:()=>'bob',isReady:()=>true,getLevel:()=>1,onSessionChange(){},awardXP(){}},{
    nextMapId:()=>'road',deferTutorial:true,confirmAction:async()=>true,
    onForceCloseParty:()=>{}
  });
  game.beginCoop(o=>{onSnap=o.onSnapshot;return {start(){o.onSnapshot({match:structuredClone(match),tick:10});o.onStatus(true);},stop(){},canRequestHostEnd:()=>false,async command(){return {ok:true};}};},()=>{},'party-force-guest','coop',()=>{});
  match.ended=true;match.endReason='retired';
  onSnap({match:structuredClone(match),tick:11,partyEnd:{tick:11,acknowledged:['alice']}});
  assert.equal(game.setPartyFinalizationState('party-force-guest',11,{canForceClose:true,missingEntries:[{name:'Bob',state:'offline'}]}),true);
  assert.equal(el('resultsForceCloseParty').hidden,true,'guests must never see the host-only force-close action');
  await game.leaveCoop();

  // HTML + CSS integration check
  const [html,menuCss,resultsCss]=await Promise.all([
    readFile(new URL('../index.html',import.meta.url),'utf8'),
    readFile(new URL('../menu-redesign.css',import.meta.url),'utf8'),
    readFile(new URL('../results-debrief.css',import.meta.url),'utf8')
  ]);
  assert.match(html,/id="fourPartyForceClose"[^>]*class="danger-utility"/);
  assert.match(html,/id="resultsForceCloseParty"[^>]*class="danger-utility"/);
  assert.match(menuCss,/#fourPartyForceClose/);
  assert.match(menuCss,/#resultsForceCloseParty/);
  assert.match(resultsCss,/\.results-actions\{[^}]*flex-wrap:\s*wrap/);
});
