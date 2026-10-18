const plans=new WeakMap(),stamps=new Map(),installed=new WeakSet();
const COLORS={katakomben:['#634354','#999181'],pilzwald:['#415e43','#a1b77c'],frostgruft:['#55768d','#bfdce7'],feuershrein:['#8a4736','#c4a477'],schattenarena:['#635075','#c0a6d9']};
function noise(x,y,seed=0){let v=(Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^(seed|0))>>>0;v=Math.imul(v^(v>>>13),1274126177)>>>0;return(v^(v>>>16))>>>0;}
function site(tiles,x,y){return [-1,0,1].every(dx=>tiles[y]?.[x+dx]===1&&tiles[y+1]?.[x+dx]===0);}
export function planWallDecor(tiles,seed=0){
 const result=[];
 for(let y=1;y<tiles.length-1;y++)for(let x=4;x<(tiles[y]?.length||0)-2;x+=4){const n=noise(x,y,seed);if(n%3===0&&n%9!==0&&site(tiles,x,y))result.push({x,y,kind:(n>>>8)%2});}
 return result;
}
function stamp(theme,kind){
 theme=Object.hasOwn(COLORS,theme)?theme:'katakomben';const key=theme+':'+kind;if(stamps.has(key))return stamps.get(key);
 const cv=document.createElement('canvas');cv.width=cv.height=32;const c=cv.getContext('2d'),[cloth,trim]=COLORS[theme];
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 if(kind===0){rect(7,4,19,2,'#171720');rect(8,4,17,1,trim);c.beginPath();c.moveTo(10,7);c.lineTo(22,7);c.lineTo(22,25);c.lineTo(18,22);c.lineTo(16,27);c.lineTo(13,24);c.lineTo(10,26);c.closePath();c.fillStyle=cloth;c.fill();rect(10,7,1,16,'#c7bb9d35');rect(20,8,2,14,'#080b123d');rect(15,11,2,8,trim);rect(12,13,8,2,trim);}
 else{rect(6,7,20,22,'#080a1248');rect(7,6,18,21,'#676a76');rect(9,8,14,16,'#181d2b');rect(8,6,16,2,trim);c.beginPath();c.moveTo(16,10);c.lineTo(21,16);c.lineTo(16,22);c.lineTo(11,16);c.closePath();c.strokeStyle=trim;c.lineWidth=1;c.stroke();rect(8,25,16,2,'#94939a');}
 stamps.set(key,cv);return cv;
}
export function drawWallDecor(renderer,world){
 const tiles=world?.tiles;if(!Array.isArray(tiles)||!tiles.length||!renderer.cv.width||!renderer.cv.height)return;
 let entry=plans.get(tiles);if(!entry||entry.seed!==world.seed){entry={seed:world.seed,items:planWallDecor(tiles,world.seed)};plans.set(tiles,entry);}
 const c=renderer.ctx,t=renderer.tile,cx=renderer.camera.x,cy=renderer.camera.y;
 c.save();try{c.setTransform(1,0,0,1,0,0);c.globalAlpha=.85;c.globalCompositeOperation='source-over';c.imageSmoothingEnabled=false;c.translate(-cx,-cy);
 for(const item of entry.items){const{x,y,kind}=item,sx=x*t,sy=y*t;if(sx+t<=cx||sy+t<=cy||sx>=cx+renderer.cv.width||sy>=cy+renderer.cv.height)continue;
 if(!site(tiles,x,y)||![-1,0,1].every(dx=>world.discovered?.[y]?.[x+dx]&&world.discovered?.[y+1]?.[x+dx]))continue;
 c.drawImage(stamp(world.theme,kind),sx,sy,t,t);
 }}finally{c.restore();}
}
export function installWallDecor(Renderer,state){
 if(installed.has(Renderer))return;installed.add(Renderer);
 const apply=()=>{const original=Renderer.prototype.draw;let warned=false;Renderer.prototype.draw=function(...args){const result=original.apply(this,args);if(document.hidden||document.getElementById('game')?.classList.contains('hidden'))return result;try{drawWallDecor(this,state.world);}catch(error){if(!warned){warned=true;console.warn('Wanddekoration:',error);}}return result;};};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else queueMicrotask(apply);
}
