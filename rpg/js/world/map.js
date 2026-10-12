// [2026-10-12 14:31] - v0.0.9: Sichere Spawns, Truhen-Interaktion, Stufenabgänge und Roguelite-Ebenen.
import {state} from '../core/state.js';
import {eventBus} from '../core/eventBus.js';
import {MONSTER_TYPES} from '../data/monsters.js';
export const TILE_FLOOR=0,TILE_STONE_WALL=1,TILE_CRYPT_CHAMBER=2;
export class WorldMap{
 constructor(){this.initMap();}
 initMap(){
  const {cols,rows}=state.world;state.world.tiles=[];
  for(let y=0;y<rows;y++){const row=[];for(let x=0;x<cols;x++)row.push((x===0||y===0||x===cols-1||y===rows-1)?TILE_STONE_WALL:TILE_FLOOR);state.world.tiles.push(row);}
  this.createChamber(4,3,5,4);this.createChamber(12,7,5,4);this.createPillars();
  if(!Array.isArray(state.world.discovered)||state.world.discovered.length!==rows)state.world.discovered=Array.from({length:rows},()=>Array(cols).fill(false));
  if(!Array.isArray(state.world.chests)||state.world.chests.length===0)state.world.chests=[{id:'c1',x:6,y:5,opened:false,item:'iron_sword',caps:25},{id:'c2',x:14,y:9,opened:false,item:'chainmail',caps:35},{id:'c3',x:17,y:3,opened:false,item:'health_potion',caps:15}];
  if(!Array.isArray(state.world.monsters)||state.world.monsters.length===0)this.spawnMonsters();
  this.repairEntityPositions();
  if(!state.world.stairs||this.isWall(state.world.stairs.x,state.world.stairs.y))state.world.stairs=this.findSafeFloorTile(17,12);
  this.revealTorchLight(state.player.x,state.player.y);
 }
 spawnMonsters(){
  const d=Math.max(1,state.world.depth||1),scale=1+(d-1)*.18;
  const spawn=(id,template,x,y)=>({id,...template,x,y,maxHp:Math.round(template.maxHp*scale),hp:Math.round(template.maxHp*scale),atk:Math.round(template.atk*(1+(d-1)*.1))});
  const positions=d===1?[[5,8],[10,3],[13,4],[10,12],[16,11]]:[[5,8],[10,3],[13,4],[10,12],[16,11]];
  state.world.monsters=[spawn(`d${d}-m1`,MONSTER_TYPES.goblin,...positions[0]),spawn(`d${d}-m2`,MONSTER_TYPES.goblin,...positions[1]),spawn(`d${d}-m3`,MONSTER_TYPES.skeleton_warrior,...positions[2]),spawn(`d${d}-m4`,MONSTER_TYPES.skeleton_warrior,...positions[3]),spawn(`d${d}-boss`,MONSTER_TYPES.crypt_lord,...positions[4])];
 }
 createChamber(rx,ry,rw,rh){for(let y=ry;y<ry+rh;y++)for(let x=rx;x<rx+rw;x++)if((x===rx||x===rx+rw-1||y===ry||y===ry+rh-1)&&!(x===rx+2&&y===ry))state.world.tiles[y][x]=TILE_CRYPT_CHAMBER;}
 createPillars(){[{x:8,y:7},{x:8,y:8},{x:9,y:8},{x:14,y:2},{x:14,y:3}].forEach(p=>state.world.tiles[p.y][p.x]=TILE_STONE_WALL);}
 isWall(x,y){if(!Number.isInteger(x)||!Number.isInteger(y)||x<=0||x>=state.world.cols-1||y<=0||y>=state.world.rows-1)return true;const t=state.world.tiles[y]?.[x];return t===TILE_STONE_WALL||t===TILE_CRYPT_CHAMBER;}
 isOccupied(x,y,ignore){if(x===state.player.x&&y===state.player.y)return true;if(x===state.trader.x&&y===state.trader.y)return true;if(state.world.chests?.some(c=>c.id!==ignore&&c.x===x&&c.y===y&&!c.opened))return true;if(state.world.monsters?.some(m=>m.id!==ignore&&m.x===x&&m.y===y))return true;return false;}
 findSafeFloorTile(px,py,ignore){for(let radius=0;radius<Math.max(state.world.cols,state.world.rows);radius++){for(let y=Math.max(1,py-radius);y<=Math.min(state.world.rows-2,py+radius);y++)for(let x=Math.max(1,px-radius);x<=Math.min(state.world.cols-2,px+radius);x++)if(!this.isWall(x,y)&&!this.isOccupied(x,y,ignore))return{x,y};}return{x:2,y:2};}
 repairEntityPositions(){for(const c of state.world.chests){if(this.isWall(c.x,c.y)||this.isOccupied(c.x,c.y,c.id)){const p=this.findSafeFloorTile(c.x,c.y,c.id);c.x=p.x;c.y=p.y;}}for(const m of state.world.monsters){if(this.isWall(m.x,m.y)||this.isOccupied(m.x,m.y,m.id)){const p=this.findSafeFloorTile(m.x,m.y,m.id);m.x=p.x;m.y=p.y;}}if(this.isWall(state.trader.x,state.trader.y))Object.assign(state.trader,this.findSafeFloorTile(3,4));}
 revealTorchLight(px,py){for(let y=Math.max(0,py-4);y<=Math.min(state.world.rows-1,py+4);y++)for(let x=Math.max(0,px-4);x<=Math.min(state.world.cols-1,px+4);x++)if(Math.hypot(x-px,y-py)<=4&&state.world.discovered[y]&&!state.world.discovered[y][x]){state.world.discovered[y][x]=true;state.player.tilesVisited++;}}
 tryMovePlayer(dx,dy){const x=state.player.x+dx,y=state.player.y+dy;if(this.isWall(x,y)){eventBus.emit('log:message','Eine massive Steinmauer versperrt den Pfad.');return false;}if(x===state.trader.x&&y===state.trader.y){eventBus.emit('shop:engage');return false;}const mon=state.world.monsters.find(m=>m.x===x&&m.y===y);if(mon){eventBus.emit('fx:encounter',{x,y});eventBus.emit('combat:engage',mon);return false;}state.player.x=x;state.player.y=y;this.revealTorchLight(x,y);const chest=state.world.chests.find(c=>c.x===x&&c.y===y&&!c.opened);if(chest){chest.opened=true;eventBus.emit('chest:opened',chest);}if(state.world.stairs?.x===x&&state.world.stairs?.y===y)eventBus.emit('stairs:found');eventBus.emit('hud:updated');eventBus.emit('storage:autosave');return true;}
 descend(){if(!state.world.stairs||state.player.x!==state.world.stairs.x||state.player.y!==state.world.stairs.y){eventBus.emit('log:message','Hier führen keine Treppen in die Tiefe.');return false;}state.world.depth++;state.player.bestDepth=Math.max(state.player.bestDepth||1,state.world.depth);state.world.chests=[];state.world.monsters=[];state.world.discovered=Array.from({length:state.world.rows},()=>Array(state.world.cols).fill(false));state.player.x=2;state.player.y=2;this.initMap();eventBus.emit('audio:stairs');eventBus.emit('log:message',`Du steigst hinab auf Ebene ${state.world.depth}. Die Gruft wird gefährlicher.`);eventBus.emit('world:updated');eventBus.emit('hud:updated');eventBus.emit('storage:autosave');return true;}
}
