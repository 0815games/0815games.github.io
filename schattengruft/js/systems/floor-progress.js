import { state } from '../core/state.js';
import { WorldMap } from '../world/map.js';
const generate=WorldMap.prototype.generate;
WorldMap.prototype.generate=function(...args){const result=generate.apply(this,args);state.world.enemyTotal=state.world.monsters.length;return result;};
function reachable(map){
 const origin={x:state.player.x,y:state.player.y,d:0},queue=[origin],seen=new Set([`${origin.x},${origin.y}`]);
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,key=`${x},${y}`;if(seen.has(key)||map.isWall(x,y))continue;seen.add(key);queue.push({x,y,d:p.d+1});}}
 return queue;
}
WorldMap.prototype.spawnStairsAfterClear=function(){
 const w=state.world;if((w.monsters||[]).length)return null;
 const tiles=reachable(this);
 const existing=w.stairs&&tiles.find(p=>p.x===w.stairs.x&&p.y===w.stairs.y);
 const candidates=tiles.filter(p=>p.d>0&&!(w.chests||[]).some(ch=>ch.x===p.x&&ch.y===p.y));
 const near=candidates.filter(p=>p.d>=2&&p.d<=5);
 const spot=existing||(near.length?near[Math.floor(Math.random()*near.length)]:candidates[0])||tiles[0];
 if(!spot)return null;
 w.stairs={x:spot.x,y:spot.y};w.sealBroken=true;
 this.reveal();
 for(let y=spot.y-1;y<=spot.y+1;y++)for(let x=spot.x-1;x<=spot.x+1;x++){if(y>=0&&y<w.rows&&x>=0&&x<w.cols)w.discovered[y][x]=true;}
 return w.stairs;
};
const ensure=WorldMap.prototype.ensureValid;
WorldMap.prototype.ensureValid=function(...args){
 this.cols=state.world.cols||this.cols;this.rows=state.world.rows||this.rows;
 const result=ensure.apply(this,args);
 if(!Number.isFinite(state.world.enemyTotal))state.world.enemyTotal=null;
 if(!(state.world.monsters||[]).length)this.spawnStairsAfterClear();
 return result;
};
function setup(){
 const node=document.createElement('div');node.id='floor-enemy-progress';node.setAttribute('role','status');node.style.cssText='width:100%;font-size:12px;line-height:1.5;color:#ffd36c;overflow-wrap:anywhere;';document.querySelector('#game header').append(node);
 const map=new WorldMap();
 function update(){
  const w=state.world;if(!w.tiles?.length)return;
  const remaining=(w.monsters||[]).length,total=w.enemyTotal;
  if(!remaining&&!w.stairs)map.spawnStairsAfterClear();
  const count=Number.isFinite(total)&&total>=remaining?`${total-remaining} / ${total} besiegt · ${remaining} verbleiben`:`${remaining} verbleiben · Gesamtzahl im alten Spielstand unbekannt`;
  const stairs=w.stairs;
  node.textContent=`⚔ Gegner: ${count} · ${remaining?'🔒 Runensiegel aktiv':stairs?`⬇ Abstieg frei · Treppe (${stairs.x+1}, ${stairs.y+1})`:'⚠ Kein erreichbares Treppenfeld'}`;
 }
 new MutationObserver(update).observe(document.getElementById('logs'),{childList:true});
 new MutationObserver(update).observe(document.getElementById('depth'),{childList:true,characterData:true,subtree:true});
 new MutationObserver(update).observe(document.getElementById('game'),{attributes:true,attributeFilter:['class']});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
