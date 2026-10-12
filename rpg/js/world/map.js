// [2026-10-12 19:15] - map.js: Verliesebenen, sich auflösende Truhen & sichere Spawns
import {state} from '../core/state.js';import {MONSTERS} from '../data/monsters.js';import {sound} from '../systems/audio.js';
export class WorldMap{
 constructor(){this.cols=20;this.rows=15;}
 generate(depth=1){
  state.world.depth=depth;state.world.tiles=[];state.world.discovered=[];state.world.chests=[];state.world.monsters=[];
  for(let y=0;y<this.rows;y++){const r=[];const d=[];for(let x=0;x<this.cols;x++){r.push((x===0||y===0||x===this.cols-1||y===this.rows-1)?1:0);d.push(false);}state.world.tiles.push(r);state.world.discovered.push(d);}
  for(let y=3;y<=6;y++)for(let x=4;x<=8;x++)if(x===4||x===8||y===3||y===6)if(!(x===6&&y===3))state.world.tiles[y][x]=2;
  for(let y=8;y<=11;y++)for(let x=12;x<=16;x++)if(x===12||x===16||y===8||y===11)if(!(x===14&&y===8))state.world.tiles[y][x]=2;
  [{x:8,y:7},{x:8,y:8},{x:9,y:8},{x:14,y:2}].forEach(p=>state.world.tiles[p.y][p.x]=1);
  state.player.x=2;state.player.y=2;
  const safe=this.getSafeSpot.bind(this);
  state.world.stairs=safe(17,12);
  const scale=1+(depth-1)*.2;
  state.world.chests=[{id:'c1',...safe(6,5),caps:25+depth*10,item:depth>1?'runic_blade':'iron_sword',open:false},{id:'c2',...safe(14,9),caps:35+depth*10,item:depth>1?'knight_armor':'chainmail',open:false},{id:'c3',...safe(17,3),caps:15+depth*10,item:'health_potion',open:false}];
  state.world.monsters=[{id:'m1',key:'goblin',...MONSTERS.goblin,...safe(5,8),hp:Math.round(22*scale),maxHp:Math.round(22*scale),atk:Math.round(6*scale)},{id:'m2',key:'goblin',...MONSTERS.goblin,...safe(10,3),hp:Math.round(22*scale),maxHp:Math.round(22*scale),atk:Math.round(6*scale)},{id:'m3',key:'skeleton',...MONSTERS.skeleton,...safe(13,4),hp:Math.round(38*scale),maxHp:Math.round(38*scale),atk:Math.round(10*scale)},{id:'m4',key:'skeleton',...MONSTERS.skeleton,...safe(10,12),hp:Math.round(38*scale),maxHp:Math.round(38*scale),atk:Math.round(10*scale)},{id:'m5',key:'lord',...MONSTERS.lord,...safe(16,11),hp:Math.round(65*scale),maxHp:Math.round(65*scale),atk:Math.round(15*scale)}];
  this.reveal();
 }
 isWall(x,y){return x<=0||x>=this.cols-1||y<=0||y>=this.rows-1||state.world.tiles[y]?.[x]>0;}
 getSafeSpot(x,y){if(!this.isWall(x,y))return{x,y};for(let r=1;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(!this.isWall(x+dx,y+dy))return{x:x+dx,y:y+dy};return{x:2,y:2};}
 reveal(){const px=state.player.x,py=state.player.y;for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++)if(Math.hypot(x-px,y-py)<=4.2)state.world.discovered[y][x]=true;}
}
