import { state } from '../core/state.js';
const stage=document.getElementById('stage');
let start=null,timer=null;
const api=()=>window.__rpg;
const ready=()=>api()&&!state.inCombat&&!document.getElementById('game').classList.contains('hidden')&&document.getElementById('death-screen').classList.contains('hidden')&&document.getElementById('floor-overlay').classList.contains('hidden')&&document.getElementById('levelup-overlay').classList.contains('hidden');
function stop(){clearInterval(timer);timer=null;}
function walkable(x,y){const w=state.world;return x>=0&&y>=0&&x<w.cols&&y<w.rows&&Boolean(w.discovered?.[y]?.[x])&&w.tiles?.[y]?.[x]!=null&&w.tiles[y][x]!==1;}
function pathTo(target){
  if(!walkable(target.x,target.y))return[];
  const key=p=>`${p.x},${p.y}`,origin={x:state.player.x,y:state.player.y},queue=[origin],parents=new Map([[key(origin),null]]);
  const blocked=new Set(state.world.monsters.filter(m=>m.x!==target.x||m.y!==target.y).map(key));
  for(let i=0;i<queue.length;i++){
    const cur=queue[i];
    if(cur.x===target.x&&cur.y===target.y){const path=[];let node=cur;while(parents.get(key(node))){path.push(node);node=parents.get(key(node));}return path.reverse();}
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const next={x:cur.x+dx,y:cur.y+dy},k=key(next);if(!walkable(next.x,next.y)||blocked.has(k)||parents.has(k))continue;parents.set(k,cur);queue.push(next);}
  }
  return[];
}
function tap(tile){
  stop(); if(!ready())return;
  if(tile.x===state.player.x&&tile.y===state.player.y){api().interact();return;}
  const path=pathTo(tile);let i=0;
  const step=()=>{if(!ready()||i>=path.length){stop();return;}const next=path[i++],dx=next.x-state.player.x,dy=next.y-state.player.y;if(Math.abs(dx)+Math.abs(dy)!==1){stop();return;}api().move(dx,dy);if(state.inCombat||state.player.x!==next.x||state.player.y!==next.y)stop();if(i>=path.length)stop();};
  if(path.length){timer=setInterval(step,150);step();}
}
if(stage){
  stage.addEventListener('pointerdown',e=>{if(!ready()||!e.isPrimary)return;stop();start={x:e.clientX,y:e.clientY,id:e.pointerId};stage.setPointerCapture(e.pointerId);e.preventDefault();},{passive:false});
  stage.addEventListener('pointerup',e=>{if(!start||start.id!==e.pointerId)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(!ready())return;if(Math.hypot(dx,dy)>30){if(Math.abs(dx)>Math.abs(dy))api().move(Math.sign(dx),0);else api().move(0,Math.sign(dy));}else tap(api().renderer.screenToTile(e.clientX,e.clientY));});
  stage.addEventListener('pointercancel',()=>{start=null;stop();});
}
addEventListener('keydown',stop);
addEventListener('pointerdown',e=>{if(e.target!==stage)stop();},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
