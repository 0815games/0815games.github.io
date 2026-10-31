(() => {
  'use strict';
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const path = [{x:0,y:130},{x:210,y:130},{x:210,y:320},{x:470,y:320},{x:470,y:150},{x:710,y:150},{x:710,y:400},{x:900,y:400}];
  const pads = [{x:105,y:210},{x:285,y:210},{x:135,y:360},{x:350,y:390},{x:390,y:220},{x:550,y:225},{x:620,y:75},{x:790,y:230},{x:625,y:395},{x:810,y:335}];
  const types = [
    {name:'MG Nest',cost:50,range:125,damage:10,interval:.55,color:'#d9d884',description:'Fast fire · reliable against infantry'},
    {name:'Cannon',cost:80,range:145,damage:34,interval:1.4,color:'#e49b67',description:'Heavy damage · slow firing'},
    {name:'Flak',cost:65,range:155,damage:17,interval:.8,color:'#8cc0a6',description:'Long range · versatile defense'},
    {name:'Sniper',cost:75,range:210,damage:45,interval:1.8,color:'#a9a4d4',description:'Extreme range · precision fire'}
  ];
  const branches = [
    [{name:'Twin MG',damage:1,interval:.55,range:1,description:'Much faster fire'}, {name:'Heavy MG',damage:2.1,interval:1,range:1,description:'More damage per shot'}],
    [{name:'Rapid Cannon',damage:1,interval:.6,range:1,description:'Faster reload'}, {name:'Siege Cannon',damage:2.1,interval:1,range:1,description:'More damage per shot'}],
    [{name:'Twin Flak',damage:1,interval:.55,range:1,description:'Much faster fire'}, {name:'Long-range Flak',damage:1.3,interval:1,range:1.45,description:'Greater range and damage'}],
    [{name:'Marksman',damage:1,interval:.6,range:1,description:'Faster shots'}, {name:'Anti-armor Rifle',damage:2,interval:1,range:1.1,description:'Heavy precision damage'}]
  ];
  const waves = 5, initialMoney = 150, keys = new Set();
  let state;
  function reset(){state={wave:0,hp:100,money:initialMoney,enemies:[],towers:[],shots:[],selected:0,speed:1,running:false,spawnLeft:0,spawnTimer:0,cooldown:0,ended:false,heroShot:0,hero:'female',heroX:850,heroY:450,heroTarget:null,branchPad:null}; updateUI();}
  function notice(text){$('message').textContent=text;}
  function updateUI(){
    $('wave').textContent=`${state.wave} / ${waves}`; $('health').textContent=Math.max(0,Math.ceil(state.hp)); $('money').textContent=state.money; $('enemies').textContent=state.enemies.length+state.spawnLeft;
    const t=types[state.selected]; $('towerInfo').innerHTML=`<strong>${t.name}</strong><span>${t.description}</span><span>BUILD COST: ${t.cost} SUPPLIES</span>`;
    const selectedTower=state.towers.find(t=>t.pad===state.branchPad); $('upgradePanel').hidden=!selectedTower||state.ended; if(selectedTower&&!state.ended){$('upgradeTitle').textContent=types[selectedTower.type].name+' · Level 3'; branches[selectedTower.type].forEach((b,i)=>{$(i?'branchB':'branchA').textContent=b.name+' — '+b.description;});}
    $('speed').textContent=`SPEED: ${state.speed}×`; $('ability').textContent=state.cooldown>0?`AIRSTRIKE: ${Math.ceil(state.cooldown)}s`:'AIRSTRIKE READY'; $('ability').disabled=state.ended||state.cooldown>0||!state.enemies.length;
    $('start').textContent=state.ended?'RESTART OPERATION':state.running?'WAVE IN PROGRESS':state.wave===0?'DEPLOY / START WAVE':'START NEXT WAVE'; $('start').disabled=state.running&&!state.ended; $('hero').disabled=state.wave>0&&!state.ended;
  }
  $('cycle').onclick=()=>{state.selected=(state.selected+1)%types.length;updateUI();};
  $('speed').onclick=()=>{state.speed=state.speed===1?2:state.speed===2?3:1;updateUI();};
  $('start').onclick=()=>{if(state.ended){reset();notice('Choose your hero and deploy when ready.');return;} if(state.running)return;state.hero=$('hero').value;state.wave++;state.running=true;state.spawnLeft=6+state.wave*3;state.spawnTimer=.2;notice(`Wave ${state.wave} incoming. Hold the line!`);updateUI();};
  $('ability').onclick=()=>{if(state.cooldown>0||!state.enemies.length||state.ended)return;state.cooldown=20;for(const enemy of state.enemies)enemy.hp-=45;notice('Airstrike deployed!');updateUI();};
  window.addEventListener('keydown', e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName))return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)){e.preventDefault();keys.add(key);}});
  window.addEventListener('keyup', e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>keys.clear());
  $('cancelBranch').onclick=()=>{state.branchPad=null;updateUI();};
  function chooseBranch(index){const tower=state.towers.find(t=>t.pad===state.branchPad);if(!tower||tower.level!==2||state.ended)return;if(state.money<80){notice('Specialization requires 80 supplies.');return;}state.money-=80;tower.level=3;tower.branch=index;state.branchPad=null;notice(`${branches[tower.type][index].name} specialization selected.`);updateUI();}
  $('branchA').onclick=()=>chooseBranch(0); $('branchB').onclick=()=>chooseBranch(1);
  canvas.addEventListener('click',e=>{if(state.ended)return;const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*canvas.width/rect.width,y=(e.clientY-rect.top)*canvas.height/rect.height;const index=pads.findIndex(p=>Math.hypot(p.x-x,p.y-y)<28);if(index<0){state.heroTarget={x,y};notice('Hero moving to position.');return;}const existing=state.towers.find(t=>t.pad===index);if(existing){const cost=40*existing.level;if(existing.level>=3){notice('Tower is already at maximum level.');return;}if(existing.level===2){state.branchPad=index;notice('Choose a tower specialization in the command panel.');updateUI();return;}if(state.money<cost){notice(`Upgrade requires ${cost} supplies.`);return;}state.money-=cost;existing.level++;notice(`${types[existing.type].name} upgraded to level ${existing.level}.`);}else{const type=types[state.selected];if(state.money<type.cost){notice(`Not enough supplies. ${type.name} costs ${type.cost}.`);return;}state.money-=type.cost;state.towers.push({pad:index,type:state.selected,level:1,timer:0});notice(`${type.name} built. Click it again to upgrade.`);}updateUI();});
  function spawn(){const tank=state.wave>=2&&Math.random()<.25;const hp=(tank?115:45)+state.wave*(tank?22:10);state.enemies.push({x:path[0].x,y:path[0].y,segment:1,hp,maxHp:hp,speed:tank?30:52+state.wave*2,reward:tank?18:10,damage:tank?18:10,tank});}
  function update(dt){if(state.ended)return;dt*=state.speed;let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(dx||dy){state.heroTarget=null;const len=Math.hypot(dx,dy);state.heroX+=dx/len*150*dt;state.heroY+=dy/len*150*dt;}else if(state.heroTarget){dx=state.heroTarget.x-state.heroX;dy=state.heroTarget.y-state.heroY;const len=Math.hypot(dx,dy),step=Math.min(len,150*dt);if(len>0){state.heroX+=dx/len*step;state.heroY+=dy/len*step;}if(len<=step)state.heroTarget=null;}state.heroX=Math.max(12,Math.min(948,state.heroX));state.heroY=Math.max(12,Math.min(528,state.heroY));state.cooldown=Math.max(0,state.cooldown-dt);state.shots=state.shots.filter(s=>(s.life-=dt)>0);
    if(state.running&&state.spawnLeft>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){spawn();state.spawnLeft--;state.spawnTimer=.8;}}
    for(const e of state.enemies){let distance=e.speed*dt;while(distance>0&&e.segment<path.length){const target=path[e.segment],dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);if(d<=distance){e.x=target.x;e.y=target.y;distance-=d;e.segment++;}else{e.x+=dx/d*distance;e.y+=dy/d*distance;distance=0;}}}
    for(const tower of state.towers){tower.timer-=dt;const type=types[tower.type],p=pads[tower.pad],branch=tower.level===3?branches[tower.type][tower.branch]:null;if(tower.timer<=0){const target=state.enemies.filter(e=>e.hp>0&&e.segment<path.length&&Math.hypot(e.x-p.x,e.y-p.y)<=type.range*(branch?branch.range:1)).sort((a,b)=>b.segment-a.segment)[0];if(target){target.hp-=type.damage*(1+(tower.level-1)*.55)*(branch?branch.damage:1);tower.timer=type.interval*(branch?branch.interval:1);state.shots.push({x:p.x,y:p.y,tx:target.x,ty:target.y,life:.12,color:type.color});}}}
    state.heroShot-=dt;const hero={x:state.heroX,y:state.heroY};if(state.wave>0&&state.heroShot<=0){const target=state.enemies.find(e=>e.hp>0&&e.segment<path.length&&Math.hypot(e.x-hero.x,e.y-hero.y)<150);if(target){target.hp-=12;state.heroShot=.65;state.shots.push({x:hero.x,y:hero.y,tx:target.x,ty:target.y,life:.12,color:'#fff'});}}
    state.enemies=state.enemies.filter(e=>{if(e.hp<=0){state.money+=e.reward;return false;}if(e.segment>=path.length){state.hp-=e.damage;return false;}return true;});
    if(state.hp<=0){state.ended=true;state.running=false;notice('Bunker lost. The operation has failed.');}else if(state.running&&state.spawnLeft===0&&state.enemies.length===0){state.running=false;if(state.wave===waves){state.ended=true;notice('Victory! The bunker survived all five waves.');}else{state.money+=35;notice('Wave cleared. +35 supplies. Prepare for the next wave.');}}updateUI();
  }
  function draw(){ctx.clearRect(0,0,960,540);ctx.fillStyle='#303c2d';ctx.fillRect(0,0,960,540);ctx.strokeStyle='#394635';ctx.lineWidth=1;for(let x=0;x<960;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<540;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}
    ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#84795e';ctx.lineWidth=62;ctx.stroke();ctx.strokeStyle='#a69a79';ctx.lineWidth=2;ctx.setLineDash([9,12]);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#aebc83';ctx.font='bold 11px Arial';ctx.fillText('ENEMY ENTRY',15,75);ctx.fillText('BUNKER',850,350);
    ctx.fillStyle='#647359';ctx.fillRect(875,375,70,50);ctx.strokeStyle='#c9d6a3';ctx.lineWidth=3;ctx.strokeRect(875,375,70,50);
    pads.forEach((p,i)=>{const tower=state.towers.find(t=>t.pad===i);ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.fillStyle=tower?'#313a2d':'#3d4938';ctx.fill();ctx.strokeStyle=tower?types[tower.type].color:'#809470';ctx.lineWidth=2;ctx.stroke();if(tower){ctx.fillStyle=types[tower.type].color;ctx.fillRect(p.x-10,p.y-10,20,20);ctx.fillStyle='#1c241b';ctx.font='bold 12px Arial';ctx.fillText(tower.level,p.x-3,p.y+4);}else{ctx.strokeStyle='#849a78';ctx.beginPath();ctx.moveTo(p.x-6,p.y);ctx.lineTo(p.x+6,p.y);ctx.moveTo(p.x,p.y-6);ctx.lineTo(p.x,p.y+6);ctx.stroke();}});
    if(state.wave>0){ctx.fillStyle=state.hero==='female'?'#e6c793':'#d5d8b3';ctx.beginPath();ctx.arc(state.heroX,state.heroY,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e8f0d4';ctx.font='bold 10px Arial';ctx.fillText('HERO',state.heroX-15,state.heroY+28);}
    for(const e of state.enemies){ctx.fillStyle=e.tank?'#925e4c':'#d18c70';if(e.tank)ctx.fillRect(e.x-12,e.y-9,24,18);else{ctx.beginPath();ctx.arc(e.x,e.y,8,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#302b25';ctx.fillRect(e.x-14,e.y-19,28,4);ctx.fillStyle='#c9db81';ctx.fillRect(e.x-14,e.y-19,28*Math.max(0,e.hp/e.maxHp),4);}
    for(const s of state.shots){ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.tx,s.ty);ctx.stroke();}
  }
  reset();let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt);draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
