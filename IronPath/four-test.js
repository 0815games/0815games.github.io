import {createFourTestSession} from './four-test-session.mjs?v=20261103-test1';
import {getMap} from './maps.mjs?v=20261102-fourbase1';
import {drawCartoonBattle} from './cartoon-art.mjs?v=20261102-fourbase2';
import {getTowerRange,STEP} from './simulation.mjs?v=20261102-fourbase1';
import {getSupplies} from './match.mjs?v=20261102-fourbase1';
import {RUN_PERKS,perkOffers} from './run-perks.mjs?v=20261102-terrain4';
import {createBattleViewportController} from './battle-viewport-controller.mjs?v=20261102-fourviewport2';
import {drawInBattleViewport} from './battle-viewport.mjs?v=20261102-fourviewport2';
const $=id=>document.getElementById(id),canvas=$('battle'),ctx=canvas.getContext('2d'),map=getMap('four-front');
const types=[{name:'MG Nest',color:'#d9d884'},{name:'Cannon',color:'#e49b67'},{name:'Flak',color:'#8cc0a6'},{name:'Sniper',color:'#a9a4d4'}];
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let session,accumulator=0,last=performance.now(),selected=null,perkKey='';
const actor=()=>$('player').value,field=()=>session.field(actor()),message=text=>$('message').textContent=text;
function reset(){session=createFourTestSession($('mode').value);selected=null;perkKey='';accumulator=0;viewport.reset();$('zoom').textContent='ZOOM IN';message('Choose a player, tap a build pad and start a wave.');refresh();}
function refresh(){
  const s=field(),game=session.game,team=game.mode==='two-vs-two'?game.teams.findIndex(t=>t.includes(actor())):0;
  $('field').textContent=game.mode==='two-vs-two'?`TEAM ${team?'B':'A'}`:'CO-OP';$('wave').textContent=String(s.wave);$('health').textContent=String(Math.max(0,Math.ceil(s.hp)));$('money').textContent=String(getSupplies(s,actor()));$('rivalBox').hidden=game.mode!=='two-vs-two';if(game.mode==='two-vs-two')$('rival').textContent=String(Math.max(0,Math.ceil(game.lanes[1-team].hp)));
  $('battleInfo').textContent=game.mode==='two-vs-two'?`Team ${team?'B':'A'} · separate bunker and pads`:'Two roads · one shared bunker';$('waveStart').disabled=!!game.pending||s.running||s.ended||(game.mode==='two-vs-two'?game.lanes.some(l=>l.pendingPerk||l.running):!!s.pendingPerk);
  $('perkPanel').hidden=!s.pendingPerk||s.ended;const currentPerkKey=`${game.mode}:${team}:${s.pendingPerk||0}:${s.ended}`;if(currentPerkKey!==perkKey){perkKey=currentPerkKey;$('perkButtons').replaceChildren();if(s.pendingPerk&&!s.ended){for(const [index,key] of perkOffers(s.mapId,s.pendingPerk).entries()){const button=document.createElement('button');button.type='button';button.textContent=RUN_PERKS[key].name;button.title=RUN_PERKS[key].description;button.onclick=()=>{const result=session.command(actor(),{type:'choosePerk',index});message(result.ok?`${result.perk} acquired.`:result.reason);refresh();};$('perkButtons').append(button);}}}
  if(game.mode==='two-vs-two'&&game.ended)message(game.winnerTeam===null?'Match ended in a draw.':`Team ${game.winnerTeam?'B':'A'} wins! Start a new test match to play again.`);else if(s.ended)message('Bunker lost. Start a new test match to play again.');
}
function tap(point){
  const s=field();if(s.ended)return;let nearest=-1,distance=55;map.pads.forEach((p,i)=>{const d=Math.hypot(p.x-point.x,p.y-point.y);if(d<distance){distance=d;nearest=i;}});
  let result;if(nearest>=0){selected=nearest;const tower=s.towers.find(t=>t.pad===nearest);if(tower){result=session.command(actor(),{type:'upgrade',pad:nearest,branch:Number($('branch').value)});message(result.ok?'Tower upgraded.':result.reason);}else{result=session.command(actor(),{type:'build',pad:nearest,towerType:Number($('tower').value)});message(result.ok?'Tower built. Tap it to upgrade.':result.reason);}}else{selected=null;result=session.command(actor(),{type:'move',x:Math.max(12,Math.min(map.width-12,point.x)),y:Math.max(12,Math.min(map.height-12,point.y))});message(result.ok?'Soldier moving.':result.reason);}refresh();
}
const viewport=createBattleViewportController({canvas,worldWidth:map.width,worldHeight:map.height,onTap:tap});
$('zoom').onclick=()=>{const v=viewport.getViewport(),fit=Math.min(v.width/v.worldWidth,v.height/v.worldHeight);if(v.scale>fit+1e-8){viewport.reset();$('zoom').textContent='ZOOM IN';}else{viewport.zoom(2);$('zoom').textContent='FIT MAP';}};
$('reset').onclick=reset;$('mode').onchange=reset;$('player').onchange=()=>{selected=null;message(`Controlling ${$('player').selectedOptions[0].textContent}.`);refresh();};
$('waveStart').onclick=()=>{const result=session.startWave();message(result.ok?'Wave started for all fields.':result.reason);refresh();};
reset();
function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;accumulator+=dt;while(accumulator>=STEP){session.step();accumulator-=STEP;}ctx.clearRect(0,0,canvas.width,canvas.height);drawInBattleViewport(ctx,viewport.getViewport(),()=>{const s=field();drawCartoonBattle(ctx,s,{path:map.path,paths:map.paths,pads:map.pads,theme:map.theme,width:map.width,height:map.height,bunkerPosition:map.bunker,types,me:actor(),getTowerRange,reducedMotion});if(selected!==null){const p=map.pads[selected];ctx.beginPath();ctx.arc(p.x,p.y,35,0,Math.PI*2);ctx.lineWidth=5;ctx.strokeStyle='#ffed70';ctx.stroke();}});refresh();requestAnimationFrame(frame);}requestAnimationFrame(frame);
