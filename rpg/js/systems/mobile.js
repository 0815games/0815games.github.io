// v0.4.0 – Touch-Steuerung: Tap und Swipe direkt auf der Karte
import { state } from '../core/state.js';

const stage=document.getElementById('stage');
let touchStart=null;
let walkTimer=null;

function getApi(){return window.__rpg}
function isWalkable(x,y){const w=state.world;return x>=0&&y>=0&&x<w.cols&&y<w.rows&&w.tiles?.[y]?.[x]!==1}
function findPath(start,target){if(!isWalkable(target.x,target.y))return[];const key=(x,y)=>`${x},${y}`;const queue=[[start]];const seen=new Set([key(start.x,start.y)]);while(queue.length){const path=queue.shift();const cur=path[path.length-1];if(cur.x===target.x&&cur.y===target.y)return path.slice(1);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cur.x+dx,ny=cur.y+dy;if(!isWalkable(nx,ny)||seen.has(key(nx,ny)))continue;seen.add(key(nx,ny));queue.push([...path,{x:nx,y:ny}])}}return[]}
function stopWalk(){if(walkTimer){clearInterval(walkTimer);walkTimer=null}}
function autoWalk(path){stopWalk();let i=0;walkTimer=setInterval(()=>{const api=getApi();if(!api||state.inCombat||i>=path.length){stopWalk();return}const step=path[i++];api.move(step.x-state.player.x,step.y-state.player.y);if(state.inCombat)stopWalk()},150)}
function handleTap(tile){const api=getApi();if(!api||!tile)return;const p=state.player;if(tile.x===p.x&&tile.y===p.y){api.interact();return}const dx=tile.x-p.x,dy=tile.y-p.y;if(Math.abs(dx)+Math.abs(dy)===1){api.move(dx,dy);return}const path=findPath({x:p.x,y:p.y},tile);if(path.length)autoWalk(path)}

if(stage){stage.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};e.preventDefault()},{passive:false});stage.addEventListener('pointerup',e=>{const api=getApi();if(!touchStart||!api)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.hypot(dx,dy)>30){if(Math.abs(dx)>Math.abs(dy))api.move(Math.sign(dx),0);else api.move(0,Math.sign(dy));return}const tile=api.renderer.screenToTile(e.clientX,e.clientY);handleTap(tile)});stage.addEventListener('pointercancel',()=>{touchStart=null})}
