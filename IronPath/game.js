import { COOP_SERVER_URL } from './coop-config.mjs?v=20261031-coopui1';
import { createCoopClient } from './coop-client.mjs?v=20261031-coopui1';
import { createCoopInput } from './coop-input.mjs?v=20261031-coopui1';
import { createTutorial } from './tutorial.mjs?v=20261031-sheet1';
import { createMatch, stepMatch, getTowerRange, STEP, PATH as path, PADS as pads } from './simulation.mjs?v=20261031-towers1';
import { createPlayer, applyCommand, towerRefund, TOWER_COSTS } from './match.mjs?v=20261031-coopui1';
import { ENEMY_TYPES, WAVES } from './combat.mjs?v=20261031-rpg2';
import { MAX_TOWER_LEVEL, upgradeCost } from './progression.mjs?v=20261031-rpg2';
export function startGame(account, {coopUrl=COOP_SERVER_URL, clientFactory=createCoopClient}={}) {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const types = [
    {name:'MG Nest',cost:TOWER_COSTS[0],range:125,damage:10,interval:.55,color:'#d9d884',description:'Fast fire · strong vs infantry and scouts; weak vs armor and aircraft'},
    {name:'Cannon',cost:TOWER_COSTS[1],range:145,damage:34,interval:1.4,color:'#e49b67',description:'Heavy damage · strong vs tanks; weak vs aircraft'},
    {name:'Flak',cost:TOWER_COSTS[2],range:155,damage:17,interval:.8,color:'#8cc0a6',description:'Long range · strong vs aircraft; weaker vs tanks'},
    {name:'Sniper',cost:TOWER_COSTS[3],range:210,damage:45,interval:1.8,color:'#a9a4d4',description:'Extreme range · strong vs infantry; anti-armor upgrade available'}
  ];
  const branches = [
    [{name:'Twin MG',damage:1,interval:.55,range:1,description:'45% shorter firing interval'}, {name:'Heavy MG',damage:2.1,interval:1,range:1,description:'110% more damage per shot'}],
    [{name:'Rapid Cannon',damage:1,interval:.6,range:1,description:'40% shorter firing interval'}, {name:'Siege Cannon',damage:2.1,interval:1,range:1,description:'110% more damage per shot'}],
    [{name:'Twin Flak',damage:1,interval:.55,range:1,description:'45% shorter firing interval'}, {name:'Long-range Flak',damage:1.3,interval:1,range:1.45,description:'45% more range and 30% more damage'}],
    [{name:'Marksman',damage:1,interval:.6,range:1,description:'40% shorter firing interval'}, {name:'Anti-armor Rifle',damage:2,interval:1,range:1.1,description:'100% more damage, 10% more range and another 40% damage against tanks'}]
  ];
  const waves = WAVES.length, keys = new Set();
  let state, accumulator=0, menuPad=null, coop=null, coopInput=null, coopReady=false, lastDirection='0,0';
  const me=()=>coop?account.getUserId():'local';
  // A large, horizontally scrollable map is the default in portrait on phones.
  const mapViewport=$('mapViewport'), zoomButton=$('mapZoom');
  const portrait=window.matchMedia('(max-width: 850px) and (orientation: portrait)');
  let largeMap=portrait.matches;
  function setMapZoom(large){largeMap=large;mapViewport.classList.toggle('map-large',large);zoomButton.setAttribute('aria-pressed',String(large));zoomButton.textContent=large?'MAP: LARGE':'MAP: FIT';$('mapHint').textContent=large?'Swipe the map left or right to see the battlefield. Tap to build or move.':'Full map view. Tap MAP: FIT to enlarge it.';}
  setMapZoom(largeMap);
  zoomButton.addEventListener('click',()=>{const middle=(mapViewport.scrollLeft+mapViewport.clientWidth/2)/mapViewport.scrollWidth;setMapZoom(!largeMap);mapViewport.scrollLeft=middle*mapViewport.scrollWidth-mapViewport.clientWidth/2;});
  $('mapEntry').addEventListener('click',()=>mapViewport.scrollTo({left:0,behavior:'smooth'}));
  $('mapBunker').addEventListener('click',()=>mapViewport.scrollTo({left:mapViewport.scrollWidth,behavior:'smooth'}));
  portrait.addEventListener('change',e=>setMapZoom(e.matches));
  function reset(){state=createMatch([createPlayer('local',{...account.getProfile(),level:account.getLevel()})]);Object.assign(state,{speed:1,selectedPad:null});accumulator=0;keys.clear();closeMenu();updateUI();}
  function dispatch(command,done){
    if(!coop){done(applyCommand(state,'local',command));return;}
    const active=coop;
    coopInput.execute(command).then(result=>{if(coop===active)done(result);});
  }
  function notice(text){$('message').textContent=text;}
  function updateUI(){
    const preview=state.ended?'Operation complete. Restart to play again.':state.wave>=waves?'Final wave underway.':'Next: '+waveSummary(state.wave+1); if($('wavePreview').textContent!==preview)$('wavePreview').textContent=preview;
    $('wave').textContent=`${state.wave} / ${waves}`; $('health').textContent=Math.max(0,Math.ceil(state.hp)); $('money').textContent=state.money; $('enemies').textContent=state.enemies.length+state.spawnLeft;
    const player=state.players[me()]; $('speed').textContent=coop?'SPEED: 1×':`SPEED: ${state.speed}×`; $('ability').textContent=player?.cooldown>0?`AIRSTRIKE: ${Math.ceil(player.cooldown)}s`:'AIRSTRIKE READY'; $('ability').disabled=state.ended||!player||player.cooldown>0||!state.enemies.length||!menu.hidden||(!!coop&&!coopReady); $('speed').disabled=!!coop||!menu.hidden;
    $('start').textContent=state.ended?(coop?'MATCH ENDED':'RESTART OPERATION'):state.running?'WAVE IN PROGRESS':state.wave===0?'DEPLOY / START WAVE':'START NEXT WAVE'; $('start').disabled=(state.running&&!state.ended)||!menu.hidden||(!!coop&&(!coopReady||state.ended));
  }
  function waveSummary(wave){const counts={};for(const kind of WAVES[wave-1]) counts[kind]=(counts[kind]||0)+1;return `Wave ${wave} · `+Object.entries(counts).map(([kind,n])=>`${n} ${ENEMY_TYPES[kind].label}`).join(' · ');}
  $('speed').onclick=()=>{state.speed=state.speed===1?2:state.speed===2?3:1;updateUI();};
  $('start').onclick=()=>{if(state.ended){if(!coop){reset();notice('Deploy when ready.');}return;}if(state.running)return;if(!coop)state.players.local.level=account.getLevel();dispatch({type:'startWave'},result=>{if(!result.ok){notice(result.reason);return;}notice(coop?'Wave started.':`Wave ${state.wave} incoming: ${waveSummary(state.wave)}.`);updateUI();});};
  $('ability').onclick=()=>dispatch({type:'airstrike'},result=>{if(!result.ok){notice(result.reason);return;}notice('Airstrike deployed!');updateUI();});
  function sendDirection(){const x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),y=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(coop){const key=`${x},${y}`;if(key!==lastDirection){lastDirection=key;coopInput.direction({type:'direction',x,y});}}else applyCommand(state,'local',{type:'direction',x,y});}
  window.addEventListener('keydown', e=>{if(!menu.hidden){if(e.key==='Escape'){closeMenu();state.selectedPad=null;updateUI();}return;}if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);sendDirection();}});
  window.addEventListener('keyup', e=>{keys.delete(e.key.toLowerCase());sendDirection();});
  window.addEventListener('blur',()=>{keys.clear();sendDirection();});
  let tutorialStorage;try{tutorialStorage=window.localStorage;}catch{tutorialStorage=null;}
  const tutorial=createTutorial({document,storage:tutorialStorage});
  $('tutorialReplay').onclick=()=>{closeMenu();state.selectedPad=null;keys.clear();sendDirection();tutorial.replay(account.getUserId());updateUI();};
  const menu=$('radialMenu');
  const options=[0,1,2,3].map(i=>$('radial'+i));
  function closeMenu(){menu.hidden=true;menuPad=null;}
  function showMenu(pad,mode='actions'){
    const tower=state.towers.find(t=>t.pad===pad);menuPad=pad;state.selectedPad=tower?pad:null;
    keys.clear();sendDirection();
    const actions=[];
    if(!tower){
      types.forEach((type,i)=>actions.push({label:`${type.name} · ${type.cost}`,summary:type.description,unaffordable:state.money<type.cost,description:`View ${type.name}, ${type.cost} supplies. ${type.description}${state.money<type.cost?'. Not enough supplies to build.':''}`,run:()=>{
        showDetails(type.name,`${type.description}. Base damage: ${type.damage} per shot, firing interval: ${type.interval} seconds, range: ${type.range}. Damage varies by enemy type.`,type.cost,'BUILD',()=>{
          dispatch({type:'build',pad,towerType:i},result=>{if(!result.ok){$('towerDetailsCost').textContent=result.reason;return;}if($('towerDetails').open)$('towerDetails').close();state.selectedPad=pad;closeMenu();notice(`${type.name} built. Tap it to upgrade or sell.`);updateUI();});
        });
      }}));
      notice(`Tap a tower for details. Grey options need more supplies. ${coop?'Battle continues in co-op.':'Battle paused.'}`);
    }else if(mode==='branches'){
      const cost=upgradeCost(tower.level);
      branches[tower.type].forEach((branch,i)=>actions.push({label:`${branch.name} · ${cost}`,summary:branch.description,unaffordable:state.money<cost,description:`View ${branch.name}: ${branch.description}. ${cost} supplies${state.money<cost?'. Not enough supplies.':''}`,run:()=>showDetails(branch.name,`${branch.description}. Level 3 also increases the base damage multiplier before specialization and enemy modifiers. This specialization is permanent.`,cost,'UPGRADE',()=>upgrade(i))}));
      notice(`Tap a specialization to see its effects. ${coop?'Battle continues in co-op.':'Battle paused.'}`);
    }else if(mode==='confirmSell'){
      actions.push({label:`Confirm sale · +${towerRefund(tower)}`,summary:'Remove this tower and recover half of its total cost.',description:`Confirm sale for ${towerRefund(tower)} supplies`,run:()=>{dispatch({type:'sell',pad,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{if(!result.ok){notice(result.reason);return;}state.selectedPad=null;closeMenu();notice(`Tower sold. +${result.refund} supplies.`);updateUI();});}});
      actions.push({label:'Cancel',summary:'Keep this tower.',description:'Cancel sale',run:()=>showMenu(pad)});
      notice(`Confirm sale for half the investment, or cancel. ${coop?'Battle continues in co-op.':'Battle paused.'}`);
    }else{
      const cost=upgradeCost(tower.level),max=tower.level>=MAX_TOWER_LEVEL;
      actions.push({label:max?'Max level':`Upgrade · ${cost}`,summary:max?'This tower is fully upgraded.':tower.level===2?'Choose a permanent specialization.':'Increase damage by one level.',disabled:max,unaffordable:!max&&state.money<cost,description:max?'Maximum level':`View upgrade to level ${tower.level+1}, ${cost} supplies${state.money<cost?'. Not enough supplies.':''}`,run:()=>{if(tower.level===2)showMenu(pad,'branches');else showDetails(`Level ${tower.level+1} upgrade`,`Adds 0.3 to the base damage multiplier; specialization and enemy modifiers still apply. Range and firing interval stay the same.`,cost,'UPGRADE',()=>upgrade(0));}});
      actions.push({label:`Sell · +${towerRefund(tower)}`,summary:'Recover half of build and upgrade costs.',description:`Sell tower for ${towerRefund(tower)} supplies`,run:()=>showMenu(pad,'confirmSell')});
      const name=tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name;
      notice(`${name} · level ${tower.level} · range ${Math.round(getTowerRange(tower))}. ${coop?"Battle continues in co-op.":"Battle paused."}`);
    }
    function upgrade(branch){dispatch({type:'upgrade',pad,branch,...(coop?{expectedTowerId:tower.id,expectedLevel:tower.level}:{})},result=>{if(!result.ok){if($('towerDetails').open)$('towerDetailsCost').textContent=result.reason;else notice(result.reason);return;}notice(`Tower upgraded to level ${tower.level+(coop?1:0)}.`);if($('towerDetails').open)$('towerDetails').close();closeMenu();updateUI();});}
    $('sheetMode').textContent=coop?'BATTLE CONTINUES':'BATTLE PAUSED';
    $('sheetTitle').textContent=!tower?'Build defense':mode==='branches'?'Choose specialization':mode==='confirmSell'?'Sell tower?':`${tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name} · Level ${tower.level}`;
    $('sheetHint').textContent=!tower?'Choose a tower to inspect.':mode==='branches'?'This choice is permanent.':mode==='confirmSell'?'Confirm or cancel the sale.':`Range ${Math.round(getTowerRange(tower))} · tap an action for details`;
    options.forEach((button,i)=>{const action=actions[i];button.hidden=!action;button.disabled=!action||!!action.disabled;button.classList.toggle('unaffordable',!!action?.unaffordable);$('menuName'+i).textContent=action?action.label:'';$('menuDesc'+i).textContent=action?(action.summary||'')+(action.unaffordable?' · Not enough supplies':''):'';button.setAttribute('aria-label',action?action.description:'');button.onclick=action?()=>action.run():null;});
    menu.hidden=false;updateUI();
  }
  function showDetails(title,text,cost,verb,confirm){
    $('towerDetailsTitle').textContent=title;$('towerDetailsText').textContent=text;
    $('towerDetailsCost').textContent=`Cost: ${cost} supplies · Available: ${state.money}${state.money<cost?' · Not enough supplies':''}`;
    const button=$('towerDetailsConfirm');button.textContent=`${verb} · ${cost}`;button.disabled=state.money<cost;button.onclick=confirm;
    $('towerDetails').showModal();
  }
  $('towerDetailsBack').onclick=()=>$('towerDetails').close();
  $('radialClose').onclick=()=>{closeMenu();state.selectedPad=null;notice('Tower menu closed.');updateUI();};
  canvas.addEventListener('click',e=>{
    if(state.ended||(coop&&!coopReady))return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*canvas.width/rect.width,y=(e.clientY-rect.top)*canvas.height/rect.height;
    const radius=Math.min(56,Math.max(28,22*canvas.width/rect.width));let index=-1,nearest=radius;
    pads.forEach((p,i)=>{const d=Math.hypot(p.x-x,p.y-y);if(d<nearest){index=i;nearest=d;}});
    if(index<0){closeMenu();state.selectedPad=null;dispatch({type:'move',x:Math.max(12,Math.min(948,x)),y:Math.max(12,Math.min(528,y))},result=>{notice(result.ok?'Hero moving to position.':result.reason);updateUI();});return;}
    showMenu(index);
    // On phones the fixed action sheet may cover the spot that was just tapped.
    // Move only the page vertically, leaving the player's horizontal map position intact.
    if(window.innerWidth<=850){
      const spotY=rect.top+pads[index].y*rect.height/canvas.height;
      const margin=48*rect.height/canvas.height+12;
      const overlap=spotY+margin-menu.getBoundingClientRect().top;
      if(overlap>0)window.scrollBy({top:overlap,behavior:'auto'});
    }
  });
  function update(dt){
    if(coop||state.ended||!menu.hidden||tutorial.isOpen()||!account.isReady()){accumulator=0;return;}
    accumulator+=dt*state.speed;
    while(accumulator>=STEP){
      accumulator-=STEP;
      for(const event of stepMatch(state)){
        if(event.type==='bunkerHit')notice(`${ENEMY_TYPES[event.kind].label} reached the bunker! −${event.damage} health.`);
        else if(event.type==='defeat')notice('Bunker lost. The operation has failed.');
        else if(event.type==='waveCleared'){account.awardXP(event.xp);notice(event.victory?`Victory! The bunker survived all ${waves} waves. +${event.xp} XP.`:`Wave cleared! +20 supplies and +${event.xp} XP. Prepare for the next wave.`);}
      }
      if(state.ended){accumulator=0;break;}
    }
    updateUI();
  }
  function draw(){ctx.clearRect(0,0,960,540);ctx.fillStyle='#303c2d';ctx.fillRect(0,0,960,540);ctx.strokeStyle='#394635';ctx.lineWidth=1;for(let x=0;x<960;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<540;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}
    ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#84795e';ctx.lineWidth=62;ctx.stroke();ctx.strokeStyle='#a69a79';ctx.lineWidth=2;ctx.setLineDash([9,12]);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#aebc83';ctx.font='bold 11px Arial';ctx.fillText('ENEMY ENTRY',15,75);ctx.fillText('BUNKER',850,350);
    ctx.fillStyle='#647359';ctx.fillRect(875,375,70,50);ctx.strokeStyle='#c9d6a3';ctx.lineWidth=3;ctx.strokeRect(875,375,70,50);
    const selected=state.towers.find(t=>t.pad===state.selectedPad);if(selected&&!state.ended){const p=pads[selected.pad];ctx.beginPath();ctx.arc(p.x,p.y,getTowerRange(selected),0,Math.PI*2);ctx.fillStyle='rgba(211,223,124,0.12)';ctx.fill();ctx.strokeStyle='#d3df7c';ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([]);}
    pads.forEach((p,i)=>{const tower=state.towers.find(t=>t.pad===i);ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.fillStyle=tower?'#313a2d':'#3d4938';ctx.fill();ctx.strokeStyle=state.selectedPad===i?'#ffffff':tower?types[tower.type].color:'#809470';ctx.lineWidth=state.selectedPad===i?4:2;ctx.stroke();if(tower){ctx.fillStyle=types[tower.type].color;ctx.fillRect(p.x-10,p.y-10,20,20);ctx.fillStyle='#1c241b';ctx.font='bold 12px Arial';ctx.fillText(tower.level,p.x-3,p.y+4);}else{ctx.strokeStyle='#849a78';ctx.beginPath();ctx.moveTo(p.x-6,p.y);ctx.lineTo(p.x+6,p.y);ctx.moveTo(p.x,p.y-6);ctx.lineTo(p.x,p.y+6);ctx.stroke();}});
    if(state.wave>0){for(const player of Object.values(state.players)){ctx.fillStyle=player.id===me()?'#e6c793':'#8cc7dd';ctx.beginPath();ctx.arc(player.x,player.y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e8f0d4';ctx.font='bold 10px Arial';ctx.fillText(player.name||'HERO',player.x-15,player.y+28);}}

    for(const e of state.enemies){
      ctx.fillStyle={infantry:'#d18c70',runner:'#f0ca79',tank:'#925e4c',plane:'#91cbd5'}[e.kind];
      ctx.beginPath();if(e.kind==='tank'){ctx.rect(e.x-12,e.y-9,24,18);}else if(e.kind==='plane'){ctx.moveTo(e.x+12,e.y);ctx.lineTo(e.x-10,e.y-10);ctx.lineTo(e.x-5,e.y);ctx.lineTo(e.x-10,e.y+10);ctx.closePath();}else if(e.kind==='runner'){ctx.moveTo(e.x,e.y-10);ctx.lineTo(e.x+9,e.y+8);ctx.lineTo(e.x-9,e.y+8);ctx.closePath();}else{ctx.arc(e.x,e.y,8,0,Math.PI*2);}ctx.fill();
      ctx.fillStyle='#302b25';ctx.fillRect(e.x-14,e.y-19,28,4);ctx.fillStyle='#c9db81';ctx.fillRect(e.x-14,e.y-19,28*Math.max(0,e.hp/e.maxHp),4);
    }
    for(const s of state.shots){ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.tx,s.ty);ctx.stroke();}
    // Draw selection above units and effects, including an empty pad while its
    // build menu is open. A dark border keeps the bright marker legible on roads.
    const markerPad=menuPad??state.selectedPad;
    if(markerPad!==null&&!state.ended){
      const p=pads[markerPad];
      if(p){
        ctx.beginPath();ctx.arc(p.x,p.y,35,0,Math.PI*2);
        ctx.strokeStyle='#172016';ctx.lineWidth=10;ctx.stroke();
        ctx.strokeStyle='#ffed70';ctx.lineWidth=5;ctx.stroke();
        ctx.beginPath();
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(p.x+dx*40,p.y+dy*40);ctx.lineTo(p.x+dx*49,p.y+dy*49);}
        ctx.strokeStyle='#172016';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#fff6ac';ctx.lineWidth=4;ctx.stroke();
      }
    }
  }
  $('coopControls').hidden=!coopUrl;
  function leaveCoop(){if(!coop)return;const old=coop;coop=null;coopReady=false;coopInput.setEnabled(false);coopInput=null;old.stop();keys.clear();lastDirection='0,0';$('coopToggle').textContent='JOIN CO-OP (TEST)';$('coopStatus').textContent='SOLO';if(account.isReady())reset();}
  $('coopToggle').onclick=()=>{
    if(coop){leaveCoop();notice('Returned to solo.');return;}
    if((state.wave>0||state.towers.length)&&!window.confirm('Joining co-op will end the current solo run. Continue?'))return;
    closeMenu();keys.clear();lastDirection='0,0';
    try{
      const client=clientFactory({url:coopUrl,getToken:()=>account.getToken(),onState:value=>{if(coop!==client)return;$('coopStatus').textContent=value.toUpperCase();if(value==='error')notice('Co-op connection failed. Leave and try again.');},onStatus:ready=>{if(coop!==client)return;coopReady=ready;coopInput.setEnabled(ready);if(!ready){keys.clear();lastDirection='0,0';notice('Co-op paused: waiting for both players.');}updateUI();},onSnapshot:snapshot=>{if(coop!==client)return;const selectedPad=state.selectedPad;state={...snapshot.match,selectedPad,speed:1};updateUI();},onEvents:events=>{if(coop!==client)return;for(const event of events){if(event.type==='bunkerHit')notice(`${ENEMY_TYPES[event.kind].label} reached the bunker! −${event.damage} health.`);else if(event.type==='defeat')notice('Bunker lost.');else if(event.type==='waveCleared')notice(event.victory?'Co-op victory!':'Wave cleared. Prepare for the next wave.');}}});
      coop=client;coopInput=createCoopInput(client,message=>notice(message));coopReady=false;$('coopToggle').textContent='LEAVE CO-OP';$('coopStatus').textContent='CONNECTING';client.start();updateUI();
    }catch{notice('Co-op could not be started. Check the server configuration.');}
  };
  account.onSessionChange(()=>{leaveCoop();if($('towerDetails').open)$('towerDetails').close();closeMenu();tutorial.stop();keys.clear();if(account.isReady()){reset();tutorial.startIfNeeded(account.getUserId());}});
  reset();tutorial.startIfNeeded(account.getUserId());let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
}
