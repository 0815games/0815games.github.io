import { createPlayer, applyCommand, TOWER_COSTS } from './match.mjs?v=20261031-coop1';
import { ENEMY_TYPES, WAVES, makeEnemy, towerDamage } from './combat.mjs?v=20261031-rpg2';
import { MAX_TOWER_LEVEL, upgradeCost, waveXP } from './progression.mjs?v=20261031-rpg2';
export function startGame(account) {
  'use strict';
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const path = [{x:0,y:130},{x:210,y:130},{x:210,y:320},{x:470,y:320},{x:470,y:150},{x:710,y:150},{x:710,y:400},{x:900,y:400}];
  const pads = [{x:105,y:210},{x:285,y:210},{x:135,y:360},{x:350,y:390},{x:390,y:220},{x:550,y:225},{x:620,y:75},{x:790,y:230},{x:625,y:395},{x:810,y:335}];
  const types = [
    {name:'MG Nest',cost:TOWER_COSTS[0],range:125,damage:10,interval:.55,color:'#d9d884',description:'Fast fire · strong vs infantry and scouts; weak vs armor and aircraft'},
    {name:'Cannon',cost:TOWER_COSTS[1],range:145,damage:34,interval:1.4,color:'#e49b67',description:'Heavy damage · strong vs tanks; weak vs aircraft'},
    {name:'Flak',cost:TOWER_COSTS[2],range:155,damage:17,interval:.8,color:'#8cc0a6',description:'Long range · strong vs aircraft; weaker vs tanks'},
    {name:'Sniper',cost:TOWER_COSTS[3],range:210,damage:45,interval:1.8,color:'#a9a4d4',description:'Extreme range · strong vs infantry; anti-armor upgrade available'}
  ];
  const branches = [
    [{name:'Twin MG',damage:1,interval:.55,range:1,description:'Much faster fire'}, {name:'Heavy MG',damage:2.1,interval:1,range:1,description:'More damage per shot'}],
    [{name:'Rapid Cannon',damage:1,interval:.6,range:1,description:'Faster reload'}, {name:'Siege Cannon',damage:2.1,interval:1,range:1,description:'More damage per shot'}],
    [{name:'Twin Flak',damage:1,interval:.55,range:1,description:'Much faster fire'}, {name:'Long-range Flak',damage:1.3,interval:1,range:1.45,description:'Greater range and damage'}],
    [{name:'Marksman',damage:1,interval:.6,range:1,description:'Faster shots'}, {name:'Anti-armor Rifle',damage:2,interval:1,range:1.1,description:'Heavy damage, extra vs tanks'}]
  ];
  const waves = WAVES.length, initialMoney = 125, keys = new Set();
  let state;
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
  function reset(){state={wave:0,hp:100,money:initialMoney,enemies:[],towers:[],shots:[],selected:0,speed:1,running:false,spawnLeft:0,spawnIndex:0,spawnTimer:0,ended:false,players:{local:createPlayer('local',account.getProfile())},branchPad:null}; updateUI();}
  function notice(text){$('message').textContent=text;}
  function updateUI(){
    const preview=state.ended?'Operation complete. Restart to play again.':state.running?'Current: '+waveSummary(state.wave):'Next: '+waveSummary(state.wave+1); if($('wavePreview').textContent!==preview)$('wavePreview').textContent=preview;
    $('wave').textContent=`${state.wave} / ${waves}`; $('health').textContent=Math.max(0,Math.ceil(state.hp)); $('money').textContent=state.money; $('enemies').textContent=state.enemies.length+state.spawnLeft;
    const t=types[state.selected]; $('towerInfo').innerHTML=`<strong>${t.name}</strong><span>${t.description}</span><span>BUILD COST: ${t.cost} SUPPLIES</span>`;
    const selectedTower=state.towers.find(t=>t.pad===state.branchPad); if(selectedTower&&!state.ended){const next=selectedTower.level+1,cost=upgradeCost(selectedTower.level);$('upgradeTitle').textContent=types[selectedTower.type].name+' · Level '+next;$('upgradeHelp').textContent=selectedTower.level===2?`Choose a permanent specialization · ${cost} supplies. The battle is paused.`:`Upgrade to level ${next} · ${cost} supplies. The battle is paused.`;$('branchB').hidden=selectedTower.level!==2;if(selectedTower.level===2){branches[selectedTower.type].forEach((b,i)=>{$(i?'branchB':'branchA').textContent=b.name+' — '+b.description;});}else{$('branchA').textContent=`UPGRADE TO LEVEL ${next} · ${cost} SUPPLIES`;}}
    $('speed').textContent=`SPEED: ${state.speed}×`; $('ability').textContent=state.players.local.cooldown>0?`AIRSTRIKE: ${Math.ceil(state.players.local.cooldown)}s`:'AIRSTRIKE READY'; $('ability').disabled=state.ended||state.players.local.cooldown>0||!state.enemies.length;
    $('start').textContent=state.ended?'RESTART OPERATION':state.running?'WAVE IN PROGRESS':state.wave===0?'DEPLOY / START WAVE':'START NEXT WAVE'; $('start').disabled=state.running&&!state.ended;
  }
  function waveSummary(wave){const counts={};for(const kind of WAVES[wave-1]) counts[kind]=(counts[kind]||0)+1;return `Wave ${wave} · `+Object.entries(counts).map(([kind,n])=>`${n} ${ENEMY_TYPES[kind].label}`).join(' · ');}
  $('cycle').onclick=()=>{state.selected=(state.selected+1)%types.length;updateUI();};
  $('speed').onclick=()=>{state.speed=state.speed===1?2:state.speed===2?3:1;updateUI();};
  $('start').onclick=()=>{if(state.ended){reset();notice('Deploy when ready.');return;} if(state.running)return;state.wave++;state.running=true;state.spawnLeft=WAVES[state.wave-1].length;state.spawnIndex=0;state.spawnTimer=.2;notice(`Wave ${state.wave} incoming: ${waveSummary(state.wave)}.`);updateUI();};
  $('ability').onclick=()=>{const result=applyCommand(state,'local',{type:'airstrike'});if(!result.ok){notice(result.reason);return;}notice('Airstrike deployed!');updateUI();};
  window.addEventListener('keydown', e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);}});
  window.addEventListener('keyup', e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>keys.clear());
  function closeBranch(){state.branchPad=null; $('upgradePanel').close(); updateUI();}
  $('cancelBranch').onclick=closeBranch;
  $('upgradePanel').addEventListener('cancel',e=>{e.preventDefault();closeBranch();});
  function chooseBranch(index){const tower=state.towers.find(t=>t.pad===state.branchPad);if(!tower)return;const result=applyCommand(state,'local',{type:'upgrade',pad:tower.pad,branch:index});if(!result.ok){$('upgradeError').textContent=result.reason;return;}notice(`${tower.branch!=null?branches[tower.type][tower.branch].name:types[tower.type].name} upgraded to level ${tower.level}.`);closeBranch();}
  $('branchA').onclick=()=>chooseBranch(0); $('branchB').onclick=()=>chooseBranch(1);
  canvas.addEventListener('click',e=>{if(state.ended)return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*canvas.width/rect.width,y=(e.clientY-rect.top)*canvas.height/rect.height;const radius=Math.min(56,Math.max(28,22*canvas.width/rect.width));let index=-1,nearest=radius; pads.forEach((p,i)=>{const d=Math.hypot(p.x-x,p.y-y);if(d<nearest){index=i;nearest=d;}});if(index<0){const result=applyCommand(state,'local',{type:'move',x:Math.max(12,Math.min(948,x)),y:Math.max(12,Math.min(528,y))});notice(result.ok?'Hero moving to position.':result.reason);return;}const existing=state.towers.find(t=>t.pad===index);if(existing){if(existing.level>=MAX_TOWER_LEVEL){notice('Tower is already at maximum level.');return;}state.branchPad=index;keys.clear();$('upgradeError').textContent='';updateUI();$('upgradePanel').showModal();return;}else{const type=types[state.selected];const result=applyCommand(state,'local',{type:'build',pad:index,towerType:state.selected});if(!result.ok){notice(result.reason);return;}notice(`${type.name} built. Click it again to upgrade.`);}updateUI();});
  function spawn(){const kind=WAVES[state.wave-1][state.spawnIndex++];state.enemies.push({...makeEnemy(kind,state.wave),x:path[0].x,y:path[0].y,segment:1});}
  function update(dt){if(state.ended||$('upgradePanel').open||!account.isReady())return;dt*=state.speed;let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(dx||dy){state.players.local.target=null;const len=Math.hypot(dx,dy);state.players.local.x+=dx/len*150*dt;state.players.local.y+=dy/len*150*dt;}else if(state.players.local.target){dx=state.players.local.target.x-state.players.local.x;dy=state.players.local.target.y-state.players.local.y;const len=Math.hypot(dx,dy),step=Math.min(len,150*dt);if(len>0){state.players.local.x+=dx/len*step;state.players.local.y+=dy/len*step;}if(len<=step)state.players.local.target=null;}state.players.local.x=Math.max(12,Math.min(948,state.players.local.x));state.players.local.y=Math.max(12,Math.min(528,state.players.local.y));state.players.local.cooldown=Math.max(0,state.players.local.cooldown-dt);state.shots=state.shots.filter(s=>(s.life-=dt)>0);
    if(state.running&&state.spawnLeft>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){spawn();state.spawnLeft--;state.spawnTimer=.8;}}
    for(const e of state.enemies){let distance=e.speed*dt;while(distance>0&&e.segment<path.length){const target=path[e.segment],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<=distance){e.x=target.x;e.y=target.y;distance-=d;e.segment++;}else{e.x+=dx/d*distance;e.y+=dy/d*distance;distance=0;}}}
    for(const tower of state.towers){tower.timer-=dt;const type=types[tower.type],p=pads[tower.pad],branch=tower.level>=3?branches[tower.type][tower.branch]:null;if(tower.timer<=0){const target=state.enemies.filter(e=>e.hp>0&&e.segment<path.length&&Math.hypot(e.x-p.x,e.y-p.y)<=type.range*(branch?branch.range:1)).sort((a,b)=>b.segment-a.segment)[0];if(target){target.hp-=towerDamage(tower.type,tower.level,tower.level>=3?tower.branch:null,target.kind);tower.timer=type.interval*(branch?branch.interval:1);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:.12,color:type.color});}}}
    state.players.local.shotTimer-=dt;const hero={x:state.players.local.x,y:state.players.local.y};if(state.wave>0&&state.players.local.shotTimer<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<path.length&&Math.hypot(e.x-hero.x,e.y-hero.y)<150);if(target){target.hp-=10+Math.min(account.getLevel()-1,20);state.players.local.shotTimer=.65;state.shots.push({x:hero.x,y:hero.y,tx:target.x,ty:target.y,life:.12,color:'#fff'});}}
    state.enemies=state.enemies.filter(e=>{if(e.hp<=0){state.money+=e.reward;return false;}if(e.segment>=path.length){state.hp-=e.damage;notice(`${ENEMY_TYPES[e.kind].label} reached the bunker! −${e.damage} health.`);return false;}return true;});
    if(state.hp<=0){state.ended=true;state.running=false;notice('Bunker lost. The operation has failed.');}else if(state.running&&state.spawnLeft===0&&state.enemies.length===0){state.running=false;account.awardXP(waveXP(state.wave));if(state.wave===waves){state.ended=true;notice(`Victory! The bunker survived all ${waves} waves. +${waveXP(state.wave)} XP.`);}else{state.money+=20;notice(`Wave cleared! +20 supplies and +${waveXP(state.wave)} XP. Prepare for the next wave.`);}}updateUI();
  }
  function draw(){ctx.clearRect(0,0,960,540);ctx.fillStyle='#303c2d';ctx.fillRect(0,0,960,540);ctx.strokeStyle='#394635';ctx.lineWidth=1;for(let x=0;x<960;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<540;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}
    ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#84795e';ctx.lineWidth=62;ctx.stroke();ctx.strokeStyle='#a69a79';ctx.lineWidth=2;ctx.setLineDash([9,12]);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#aebc83';ctx.font='bold 11px Arial';ctx.fillText('ENEMY ENTRY',15,75);ctx.fillText('BUNKER',850,350);
    ctx.fillStyle='#647359';ctx.fillRect(875,375,70,50);ctx.strokeStyle='#c9d6a3';ctx.lineWidth=3;ctx.strokeRect(875,375,70,50);
    pads.forEach((p,i)=>{const tower=state.towers.find(t=>t.pad===i);ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.fillStyle=tower?'#313a2d':'#3d4938';ctx.fill();ctx.strokeStyle=tower?types[tower.type].color:'#809470';ctx.lineWidth=2;ctx.stroke();if(tower){ctx.fillStyle=types[tower.type].color;ctx.fillRect(p.x-10,p.y-10,20,20);ctx.fillStyle='#1c241b';ctx.font='bold 12px Arial';ctx.fillText(tower.level,p.x-3,p.y+4);}else{ctx.strokeStyle='#849a78';ctx.beginPath();ctx.moveTo(p.x-6,p.y);ctx.lineTo(p.x+6,p.y);ctx.moveTo(p.x,p.y-6);ctx.lineTo(p.x,p.y+6);ctx.stroke();}});
    if(state.wave>0){ctx.fillStyle=state.players.local.gender==='female'?'#e6c793':'#d5d8b3';ctx.beginPath();ctx.arc(state.players.local.x,state.players.local.y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e8f0d4';ctx.font='bold 10px Arial';ctx.fillText(account.getProfile()?.name||'HERO',state.players.local.x-15,state.players.local.y+28);}
    for(const e of state.enemies){
      ctx.fillStyle={infantry:'#d18c70',runner:'#f0ca79',tank:'#925e4c',plane:'#91cbd5'}[e.kind];
      ctx.beginPath();if(e.kind==='tank'){ctx.rect(e.x-12,e.y-9,24,18);}else if(e.kind==='plane'){ctx.moveTo(e.x+12,e.y);ctx.lineTo(e.x-10,e.y-10);ctx.lineTo(e.x-5,e.y);ctx.lineTo(e.x-10,e.y+10);ctx.closePath();}else if(e.kind==='runner'){ctx.moveTo(e.x,e.y-10);ctx.lineTo(e.x+9,e.y+8);ctx.lineTo(e.x-9,e.y+8);ctx.closePath();}else{ctx.arc(e.x,e.y,8,0,Math.PI*2);}ctx.fill();
      ctx.fillStyle='#302b25';ctx.fillRect(e.x-14,e.y-19,28,4);ctx.fillStyle='#c9db81';ctx.fillRect(e.x-14,e.y-19,28*Math.max(0,e.hp/e.maxHp),4);
    }
    for(const s of state.shots){ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.tx,s.ty);ctx.stroke();}
  }
  account.onSessionChange(()=>{if($('upgradePanel').open)$('upgradePanel').close();keys.clear();if(account.isReady())reset();});
  reset();let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
}
