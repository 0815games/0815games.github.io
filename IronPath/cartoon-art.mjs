import {translateText as tr,getLanguage} from './language.mjs?v=20261031-rank1';
import {towerDisplay} from './progression.mjs?v=20261105-prestige1';
import {specializationRank} from './tower-specialization.mjs?v=20261112-kits1';
import {drawStoryTerrain,drawStoryAtmosphere,drawStoryObjective,prepareStoryArt} from './story-map-art.mjs?v=20261031-rank1';
import {ENEMY_INTEL} from './combat.mjs?v=20261031-finale1';
import {bossPhase} from './boss-mechanics.mjs?v=20261031-finale1';
// Drawing only: the simulation, coordinates and hit areas stay unchanged.
const ink='#1d3028',paper='#f1e7c4';
function line(ctx,points,color=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function shape(ctx,points,fill,stroke=ink,width=3){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
// V3 depth pass: one light from the top-left, so every shadow on the field
// falls the same way. A soft ellipse reads as a painted shadow without a
// per-entity blur pass.
function castShadow(ctx,x,y,rx,ry){ctx.save();ctx.globalAlpha=.2;ctx.beginPath();ctx.ellipse(x+rx*.24,y+ry*.55,rx*1.18,ry,0,0,Math.PI*2);ctx.fillStyle='#0c120e';ctx.fill();ctx.restore();}
// Radial light with a safe fallback: headless test contexts return nothing
// from createRadialGradient, and a light effect must never crash a field.
function radial(ctx,a,b,c,d,e,f){try{const g=ctx.createRadialGradient(a,b,c,d,e,f);return g&&typeof g.addColorStop==='function'?g:null;}catch{return null;}}
function oval(ctx,x,y,rx,ry,fill,stroke=ink,width=2){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
// Legible tactical silhouettes replace cartoon drawings if an image cannot load.
function fallbackMarker(ctx,x,y,label,color='#d9c08a',rx=15,ry=13){
 ctx.save();oval(ctx,x,y,rx,ry,'#1c3029',color,2);ctx.fillStyle=color;ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(label,x,y+3);ctx.restore();
}
function ground(ctx,theme='road',width=960,height=540){
  ctx.fillStyle=({forest:'#354b3c',outpost:'#5b5748',urban:'#555a55',scrub:'#6f5445',arctic:'#a8c1c3',marsh:'#41594b',junction:'#3b4340'})[theme]||'#455740';ctx.fillRect(0,0,width,height);
  // Restrained map-like contour detail while a texture is unavailable.
  ctx.save();ctx.globalAlpha=.12;
  for(let i=0;i<75;i++){const x=(i*163+47)%width,y=(i*113+31)%height;oval(ctx,x,y,14+(i%4)*6,4+(i%3)*3,i%2?'#182a23':'#d7d3b1',null);}
  ctx.restore();
}
// V2 field art: the road is ground, not a ribbon - a soft earthen berm, a
// compacted surface, wheel ruts that follow the actual bends, and wear
// scattered ALONG the geometry instead of at nine hard-coded spots.
// Act V: in the junction the roads are rails - a ballast bed, timber
// sleepers and twin steel lines, with the odd signal mast along the way.
// Painted along the exact geometry the enemies drive on, purely cosmetic:
// the simulation path and every hit target stay untouched.
function drawRail(ctx,path){
  const trace=(w,style)=>{ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=style;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();};
  trace(88,'rgba(20,24,22,.34)');
  trace(78,'#3f4440');
  trace(66,'#4c524d');
  trace(54,'#5a5f58');
  const hash=n=>{const x=Math.sin(n*127.1+13.7)*43758.5453;return x-Math.floor(x);};
  // Sleepers: dark timber ties set across the ballast, following every bend.
  ctx.lineCap='butt';ctx.strokeStyle='#2c2922';ctx.lineWidth=7;
  let k=0;
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)continue;
    const ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,px=-uy,py=ux;
    for(let s=9;s<len-4;s+=17){
      const x=a.x+ux*s,y=a.y+uy*s;
      ctx.beginPath();ctx.moveTo(x-px*22,y-py*22);ctx.lineTo(x+px*22,y+py*22);ctx.stroke();
    }
  }
  // Twin steel rails, each with its own shadow line - readable at a glance.
  ctx.lineCap='round';
  for(const side of [-1,1])for(const [w,style] of [[3.4,'rgba(16,18,16,.5)'],[1.8,'#b6bab0']]){
    ctx.beginPath();let first=true;
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)continue;
      const px=-(b.y-a.y)/len*13*side,py=(b.x-a.x)/len*13*side;
      if(first){ctx.moveTo(a.x+px,a.y+py);first=false;}
      ctx.lineTo(b.x+px,b.y+py);
    }
    ctx.strokeStyle=style;ctx.lineWidth=w;ctx.lineJoin='round';ctx.stroke();
  }
  // Signal masts at readable intervals, deterministic per path.
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)continue;
    const ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,px=-uy,py=ux;
    for(let s=60;s<len-30;s+=190){
      const j=hash(++k),side=j<.5?-1:1,off=36+j*8;
      const x=a.x+ux*s+px*off*side,y=a.y+uy*s+py*off*side;
      line(ctx,[[x,y+10],[x,y-14]],'#3a3f3a',3);
      ctx.fillStyle='#22261f';ctx.fillRect(x-4,y-22,8,10);
      oval(ctx,x,y-19.5,1.7,1.7,j<.35?'#e05a4e':'#7ec97a',null);
      oval(ctx,x,y-16,1.7,1.7,j<.35?'#5a6f57':'#c9c05a',null);
    }
  }
  ctx.lineCap='round';
}
export function drawRoad(ctx,path,theme,texture=null){
  if(theme==='junction'){drawRail(ctx,path);return;}
  const tones=theme==='arctic'?['#7e9a98','#9fb9b4','#c2d5cf']:theme==='urban'?['#45453f','#5d5c54','#787670']:theme==='marsh'?['#453d2e','#61533f','#7d6c54']:theme==='scrub'?['#6f533a','#8a6a4f','#a58463']:theme==='talwald'?['#48563a','#65734c','#828e5e']:['#544a34','#716244','#8d7c5b'];
  // One helper, one stroke: a polyline stroked in a single operation never
  // blends with itself, so no bend can grow a seam.
  const trace=(w,style)=>{ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=style;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();};
  // The road wears four deliberate layers. The old nested 78/68/58 tone
  // strokes stacked three hard-edged bands that read as painted contour
  // lines across every bend (reported: "Strassen-Design neu").
  // 1. a soft dark rim where the road meets the ground,
  trace(86,'rgba(26,30,24,.3)');
  // 2. the dark aggregate shoulder, peeking five pixels out on each side,
  trace(76,tones[0]);
  // 3. the driving surface itself, and
  trace(66,tones[1]);
  // 4. ONE translucent wash of the lightest tone - a worn, sun-bleached
  //    centre that fades into the surface instead of stepping.
  ctx.save();ctx.globalAlpha=.42;trace(46,tones[2]);ctx.restore();
  if(texture&&ctx.createPattern){const pattern=ctx.createPattern(texture,'repeat');if(pattern){ctx.save();ctx.globalAlpha=.24;ctx.strokeStyle=pattern;ctx.lineWidth=60;ctx.stroke();ctx.restore();}}
  // Wheel ruts on both sides of the lane, following every actual bend. One
  // stroke per side: the old code stroked every segment separately, and the
  // round caps stacked their alpha at each vertex - dark beads along the
  // whole road. A single stroke of many subpaths is composited once, so the
  // beads cannot come back.
  ctx.strokeStyle='rgba(28,24,16,.26)';ctx.lineWidth=5;
  for(const side of [-1,1]){
    ctx.beginPath();
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);
      if(!l)continue;
      const px=-dy/l*15*side,py=dx/l*15*side;
      ctx.moveTo(a.x+px,a.y+py);ctx.lineTo(b.x+px,b.y+py);
    }
    ctx.stroke();
  }
  // Pebbles and track marks along the real arclength - deterministic, so the
  // cached terrain layer stays reproducible.
  const hash=n=>{const x=Math.sin(n*127.1+13.7)*43758.5453;return x-Math.floor(x);};
  let k=0;
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],len=Math.hypot(b.x-a.x,b.y-a.y);
    if(!len)continue;
    const ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,px=-uy,py=ux;
    for(let s=26;s<len-12;s+=44){
      const j1=hash(++k),j2=hash(k+57.3),off=(j1-.5)*44;
      const x=a.x+ux*s+px*off,y=a.y+uy*s+py*off;
      if(j2<.45)oval(ctx,x,y,2+j1*2.5,1.4+j2*1.4,j2<.2?'#6d5c42':'#a6906c',null);
      else if(j2<.7){const d=3+j1*4;line(ctx,[[x-px*d,y-py*d],[x+px*d,y+py*d]],'rgba(30,26,18,.22)',2);}
      else oval(ctx,x,y,1.6,1.1,'#c9b992',null);
    }
  }
}
// Presentation only: the marked segment retains the simulation's exact endpoints.
function roadZone(ctx,a,b,{color,edge,label,detail}){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)return;
  ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));ctx.lineCap='butt';
  ctx.globalAlpha=.34;line(ctx,[[0,0],[length,0]],color,45);ctx.globalAlpha=.8;
  line(ctx,[[0,-21],[length,-21]],edge,1.5);line(ctx,[[0,21],[length,21]],edge,1.5);
  for(let x=14;x<length-8;x+=25){if(detail==='ice'){line(ctx,[[x,-13],[x+5,-5],[x+1,2],[x+8,11]],edge,1);}else if(detail==='mud'){oval(ctx,x,-6,4,1.5,edge,null);oval(ctx,x+8,7,6,2,edge,null);}else{line(ctx,[[x,-10],[x+5,-8]],edge,1.5);line(ctx,[[x+9,8],[x+15,10]],edge,1.5);}}
  ctx.globalAlpha=1;ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#182b25';ctx.strokeText(label,length/2,-27);ctx.fillStyle='#e2e5d3';ctx.fillText(label,length/2,-27);ctx.restore();
}
function thinIce(ctx,path,theme){if(theme!=='arctic'||path.length!==10)return;roadZone(ctx,path[4],path[5],{color:'#6b9aa3',edge:'#d7ece9',label:tr('THIN ICE'),detail:'ice'});}
function bog(ctx,path,theme){if(theme!=='marsh'||path.length!==10)return;roadZone(ctx,path[6],path[7],{color:'#584d36',edge:'#c0b694',label:tr('DEEP BOG'),detail:'mud'});}
function fieldZone(ctx,path,state,theme){
 if(!state.mapId?.startsWith('g2-')||path.length!==10||!['forest','urban'].includes(theme))return;
 const cleared=theme==='urban'&&state.rubbleCleared;
 roadZone(ctx,path[2],path[3],{color:theme==='forest'?'#475b43':cleared?'#778270':'#645f54',edge:theme==='forest'?'#b0c4a1':'#d0c9b4',label:theme==='forest'?tr('AMBUSH TRAIL'):cleared?tr('RUBBLE CLEARED'):tr('RUBBLE {amount}',{amount:Math.max(0,Math.ceil(200-(state.rubbleDamage||0)))}),detail:'debris'});
}
function brokenIce(ctx,path,state,theme){if(theme!=='arctic'||!state.iceBroken||path.length!==10)return;roadZone(ctx,path[4],path[5],{color:'#335e6d',edge:'#d2eff0',label:tr('BROKEN ICE'),detail:'ice'});}
// Sprite images are strictly visual and load on demand; vector art remains a
// fallback for offline loading failures and non-browser renderers.
//
// Why `notify`: this function is asked for an image on EVERY frame, and the first
// frames run before the PNG has finished decoding. Returning null then is correct -
// the vector fallback is drawn instead. But nothing used to tell the loop that the
// image had arrived: the terrain layer caches `art` vs `fallback` in its revision
// key, the sprites did not, so a soldier drawn during the first 50 ms of the match
// stayed a vector "YOU" marker for the whole run, and an enemy stayed an "I". On a
// phone the images decode slowly enough that this happened every time. `notify` is
// the renderer's "something you were drawing has changed" hook; it is optional, so a
// headless renderer without images still works.
const spriteImages=new Map();
function sprite(ctx,name,notify){
  const doc=ctx.canvas?.ownerDocument;if(!doc?.createElement)return null;
  if(!spriteImages.has(name)){
    const image=doc.createElement('img'),entry={image,ready:false};
    spriteImages.set(name,entry);
    image.onload=()=>{entry.ready=true;try{notify?.();}catch{/* a redraw hint must never throw */}};
    image.onerror=()=>{entry.failed=true;};
    // V3 art ships under the same file names as V2: without a version query a
    // returning player's browser serves the old sprite from its HTTP cache and
    // the new emblems never land. Bump this with every art re-issue.
    image.src=`assets/${name}-sprite.png?v=20261111-defringe1`;
  }
  const entry=spriteImages.get(name);return entry.ready?entry.image:null;
}
// The same "draw now, refine when the image lands" contract the terrain already
// follows. Images that failed to load stay on the vector fallback instead of asking
// for a redraw every frame.
export function spritesPending(){for(const entry of spriteImages.values())if(!entry.ready&&!entry.failed)return true;return false;}
function bunker(ctx,state,notify,approach=0){
  const damage=state.hp/Math.max(1,state.maxHp||100),plating=state.plating||0;
  // Everything is drawn around the bunker centre (0,0) and the caller
  // translates to the map's bunker coordinates: the sprite finally stands
  // where the road ends, on every sector size - the old fixed 855/365 only
  // ever fit the 960x540 field.
  const artwork=sprite(ctx,'bunker2',notify);
  if(artwork)ctx.drawImage(artwork,-62,-44,124,86);
  else fallbackMarker(ctx,0,0,'HQ','#e3cc92',33,22);
  if(plating>0){line(ctx,[[-32,7],[32,7]],'#e5c883',3);for(let i=0;i<plating;i++)oval(ctx,-21+i*8,12,2,2,'#f4d894',null);}
  if(damage<.7){line(ctx,[[-3,2],[-7,7],[-2,10],[-7,17]],'#293a30',2);}
  if(damage<.35){line(ctx,[[20,-10],[15,-15],[18,-21]],'#293a30',3);line(ctx,[[-30,5],[-24,10],[-29,16]],'#293a30',2);oval(ctx,-14,-16,5,3,'#554d3d',null);}
  // The gate: the road ALWAYS ends in the bunker, so the bunker receives it
  // with an open gate facing the approach - wooden posts, a crossbeam and
  // sandbags in the map's own palette, standing upright whatever the
  // direction the road arrives from.
  const ux=Math.cos(approach),uy=Math.sin(approach),px=-uy,py=ux;
  const gate={x:ux*38,y:uy*38};
  const post=side=>({x:gate.x+px*13*side,y:gate.y+py*13*side});
  const [p1,p2]=[post(1),post(-1)];
  for(const q of [p1,p2]){
    oval(ctx,q.x,q.y+9,7,3,'#c3ab7d','#8f7a52',1);
    line(ctx,[[q.x,q.y+7],[q.x,q.y-19]],'#5c4a33',5);
    oval(ctx,q.x,q.y-21,3,3,'#6b563c',null);
  }
  line(ctx,[[p1.x,p1.y-17],[p2.x,p2.y-17]],'#6b563c',4);
  ctx.fillStyle='#344231';ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('BUNKER',0,-44);ctx.textAlign='start';
}
function pad(ctx,p,tower,selected,types,notify){
  const x=p.x,y=p.y;
  // V2 field art: the build plate is a painted concrete weapons emplacement -
  // part of the ground, in the same rendered look as the buildings. The
  // vector plate below stays as the asset-loading fallback; letter chips stay
  // gone, the level badge stays.
  const plate=sprite(ctx,'gunpit',notify);
  if(plate)ctx.drawImage(plate,x-31,y-19,62,38);
  else{
    shape(ctx,[[x-28,y-13],[x-19,y-24],[x+19,y-24],[x+28,y-13],[x+28,y+13],[x+19,y+24],[x-19,y+24],[x-28,y+13]],tower?'#28402f':'#1f3830',selected?'#cfe3d6':'#7fa08f',selected?3:2);
    shape(ctx,[[x-22,y-9],[x-15,y-18],[x+15,y-18],[x+22,y-9],[x+22,y+9],[x+15,y+18],[x-15,y+18],[x-22,y+9]],tower?'#223a2c':'#1a322b',null,0);
    for(const [sx,sy] of [[-24,-11],[24,-11],[-24,11],[24,11]])oval(ctx,x+sx,y+sy,4,2.5,'#93ab9c',null);
  }
  if(selected){ctx.save();ctx.strokeStyle='#cfe3d6';ctx.lineWidth=2.5;ctx.setLineDash([7,6]);ctx.beginPath();ctx.ellipse(x,y,33,23,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  if(!tower){line(ctx,[[x-13,y-8],[x+13,y-8]],'#78988b',1);ctx.fillStyle='#dce7d7';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(tr('BUILD'),x,y+5);ctx.textAlign='start';return;}
  const display=towerDisplay(tower.level);
  // A static gold halo remains visible even when reduced motion is enabled.
  if(display.prestige){ctx.save();ctx.shadowColor='#ffd75c';ctx.shadowBlur=15;oval(ctx,x,y-4,30,26,'rgba(255,207,79,.12)','#f8d572',2);ctx.restore();
    ctx.fillStyle='#ffe59a';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(`★${display.prestige}`,x,y-28);ctx.textAlign='start';}
  // Specialization rank chevrons under the plate: one small gold wedge per
  // earned rank (level 4/5; prestige keeps three forever).
  const kitRank=specializationRank(tower);
  if(kitRank>0){ctx.save();ctx.fillStyle='#f0d68a';ctx.strokeStyle='#5c4c22';ctx.lineWidth=.75;
    for(let i=0;i<kitRank;i++){const cx=x-11+i*11;ctx.beginPath();ctx.moveTo(cx-4.5,y+22);ctx.lineTo(cx,y+17);ctx.lineTo(cx+4.5,y+22);ctx.closePath();ctx.fill();ctx.stroke();}
    ctx.restore();}
  // Contact shadow grounds the tower on the plate; sandbag dressing only
  // exists for the vector fallback plate, the painted emplacement brings
  // its own base.
  oval(ctx,x,y+16,20,6,'rgba(24,32,26,.25)',null);
  if(!plate)for(const [sx,sy,r] of [[-17,13,7],[0,16,8],[17,13,7]])oval(ctx,x+sx,y+sy,r,r*.62,'#c3ab7d','#8f7a52',1);
  // Preserve vector rendering only as an asset-loading fallback.
  // V2: the four towers are painted positions now - sandbagged MG nest,
  // dug-in howitzer, flak platform, camouflaged sniper hide - anchored on
  // the emplacement plate, sized from each artwork's own aspect.
  const artwork=sprite(ctx,['mg2','cannon2','flak2','sniper2'][tower.type],notify);
  if(artwork){const w=58,h=w*artwork.height/artwork.width;ctx.drawImage(artwork,x-w/2,y+11-h,w,h);}
  else fallbackMarker(ctx,x,y-6,['MG','C','AA','S'][tower.type],types[tower.type].color,18,15);
  oval(ctx,x+18,y+13,9,9,paper);ctx.fillStyle=ink;ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(String(display.level),x+18,y+17);ctx.textAlign='start';
}
function soldier(ctx,p,own,pose={},notify){
  const x=p.x,y=p.y,artwork=sprite(ctx,'hero2',notify);
  castShadow(ctx,x,y+12,15,5.5);
  oval(ctx,x,y+13,13,5,own?'#e5c783':'#87c4ce',null);
  if(pose.moving){
    // Small alternating boot scuffs communicate motion without changing hitboxes.
    ctx.save();ctx.globalAlpha=.45;oval(ctx,x-6*(pose.facing||1),y+14,2.5+Math.abs(pose.step||0),1.5,'#ead7ae',null);ctx.restore();
  }
  ctx.save();ctx.translate(x,y+(pose.bob||0));ctx.rotate(pose.lean||0);ctx.scale(pose.facing===-1?-1:1,1);
  // The legacy asset contains two repeated soldiers side by side. Display just
  // one figure rather than squeezing both into a single player marker.
  // V2: a single painted soldier - the legacy asset carried two figures
  // side by side and had to be cropped every frame.
  if(artwork)ctx.drawImage(artwork,-11,-19,22,33);
  else fallbackMarker(ctx,0,0,own?'YOU':'ALLY',own?'#e5c783':'#87c4ce',12,12);
  ctx.restore();
  ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.strokeText(p.name||tr('HERO'),x,y+29);ctx.fillStyle=paper;ctx.fillText(p.name||tr('HERO'),x,y+29);ctx.textAlign='start';
}
function enemy(ctx,e,reducedMotion,notify,heading=0,bank=0,time=0,rail=false){
  const x=e.x,y=e.y;
  // V3 movement: the vehicles fly and drive where they are going. The heading
  // comes from the road geometry (the caller reads it off the next path
  // point), the plane banks into the bend ahead - both deterministic, so the
  // same frame always paints the same picture.
  const flies=e.kind==='plane'||e.boss==='bossBomber',drives=e.kind==='tank'||e.boss==='bossJuggernaut'||e.boss==='bossCommander';
  const angle=Number.isFinite(heading)?heading:0,lean=Number.isFinite(bank)?Math.max(-.5,Math.min(.5,bank))*.7:0;
  const t0=Number.isFinite(time)?time:0;
  if(e.boss){const phase=bossPhase(e);if(phase!=='normal'){
    const radius=phase==='rally'?45:phase==='shield'?31:28;
    ctx.save();ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.strokeStyle=phase==='shield'?'#a5d9e3':phase==='repair-warning'?'#addb8b':'#f3c776';ctx.lineWidth=3;ctx.setLineDash(reducedMotion?[]:[5,5]);ctx.stroke();
    if(phase==='shield'){ctx.globalAlpha=.18;ctx.fillStyle='#b6e7ed';ctx.fill();}
    if(phase==='repair-warning'){line(ctx,[[x-6,y-30],[x+6,y-30]],'#daf0ad',3);line(ctx,[[x,y-36],[x,y-24]],'#daf0ad',3);}
    if(phase==='bomb-warning'){line(ctx,[[x+3,y+17],[x+3,y+27]],'#ffd193',3);oval(ctx,x+3,y+30,3,5,'#f2ca87');}
    ctx.restore();
  }}
  if(e.boss){ctx.save();ctx.beginPath();ctx.arc(x,y,e.boss==='bossCommander'?36:24,0,Math.PI*2);ctx.fillStyle='rgba(180,69,48,.22)';ctx.fill();ctx.strokeStyle='#a83d30';ctx.lineWidth=3;ctx.setLineDash([5,4]);ctx.stroke();ctx.restore();}
  // A plane rides high: its shadow drifts lower, smaller and fainter than a
  // grounded machine's - the cheapest height illusion there is.
  if(flies){ctx.save();ctx.globalAlpha=.14;oval(ctx,x+7,y+17,11,3.5,'#0c120e',null);ctx.restore();}
  else castShadow(ctx,x,y+10,12,4.5);
  // V2: painted enemies - muddy tank, camouflaged prop plane, riflemen.
  // The bosses keep their artwork until the next art stage.
  const name=e.boss?(e.boss==='bossBomber'?'bossplane2':'bossheavy2'):e.kind==='tank'?'tank2':e.kind==='plane'?'plane2':e.kind==='infantry'||e.kind==='runner'?'infantry2':null,artwork=name&&sprite(ctx,name,notify);
  // Act V: on junction fields the ground convoys run as rail engines instead
  // of tanks - same road, same rules, different machine.
  const train=rail&&drives&&!e.boss?sprite(ctx,'train2',notify):null;
  if(!artwork&&!train)fallbackMarker(ctx,x,y,e.boss?'BOSS':(ENEMY_INTEL[e.kind]?.symbol||'!'),'#e6a182',e.boss?22:12,e.boss?16:10);
  else if(drives){
    // The tank turns into the road: artwork rotated to its heading, with a
    // rolling wobble on the move and dust kicked up behind the hull.
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    if(!reducedMotion&&e.hp>0)ctx.translate(0,Math.sin(t0*7+x*.05)*.7);
    if(train)ctx.drawImage(train,-26,-12,52,24);
    else ctx.drawImage(artwork,-(e.boss?30:20),-(e.boss?22:13),e.boss?60:40,e.boss?38:25);
    ctx.restore();
    if(!reducedMotion&&e.hp>0){for(let i=0;i<2;i++){const back=angle+Math.PI,side=angle+Math.PI/2*(i?1:-1),ph=((t0*.9+i*.5+x*.01)%1+1)%1;
      ctx.save();ctx.globalAlpha=.16*(1-ph);oval(ctx,x+Math.cos(back)*(20+ph*14)+Math.cos(side)*6,y+Math.sin(back)*(20+ph*14)+Math.sin(side)*4+8,4+ph*5,2.5+ph*3,train?'#9aa39b':'#b7a67e',null);ctx.restore();}}
  }
  else if(flies){
    // The plane flies nose-first and banks into the coming bend.
    ctx.save();ctx.translate(x,y);ctx.rotate(angle+lean);
    if(!reducedMotion&&e.hp>0)ctx.translate(0,Math.sin(t0*4+x*.04)*1.4);
    ctx.drawImage(artwork,-(e.boss?30:21),-(e.boss?18:14),e.boss?60:42,e.boss?28:26);
    ctx.restore();
  }
  else{
    // Infantry marches with a squash step - the sprite breathes around its
    // feet instead of sliding stiffly along the road.
    const sq=reducedMotion?0:.05*Math.sin((e.kind==='runner'?t0*13:t0*8.5)+(x+y)*.05);
    ctx.save();ctx.translate(x,y+10);ctx.scale(1+sq*.6,1-sq);ctx.drawImage(artwork,-10,-22,20,20);ctx.restore();
  }
  if(!e.boss&&ENEMY_INTEL[e.kind]){const bx=x+(e.kind==='tank'?18:15),by=y+10;oval(ctx,bx,by,7,7,'#344a3b','#f7e5b5',1);ctx.fillStyle='#fff3d2';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(ENEMY_INTEL[e.kind].symbol,bx,by+3);ctx.textAlign='start';}
  const w=e.boss?52:28;ctx.fillStyle=ink;ctx.fillRect(x-w/2,y-22,w,5);ctx.fillStyle=e.boss?'#eea35f':e.hp/e.maxHp<.3?'#ed9b74':'#dce59c';ctx.fillRect(x-w/2+1,y-21,(w-2)*Math.max(0,Math.min(1,e.hp/e.maxHp)),3);
  if(e.boss){const names={bossIronclad:'IRONCLAD',bossBomber:'DREAD BOMBER',bossJuggernaut:'JUGGERNAUT',bossCommander:'WAR COMMANDER'};ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle=ink;ctx.strokeText(tr(names[e.boss]||'BOSS'),x,y-29);ctx.fillStyle='#ffe1a0';ctx.fillText(tr(names[e.boss]||'BOSS'),x,y-29);ctx.textAlign='start';}
}
// Ambient particles are local presentation only. They never obscure labels or
// change simulation, and are absent when reduced motion is requested.
function ambient(ctx,theme,time,width,height){
  const t=Number.isFinite(time)?time:0;ctx.save();ctx.globalAlpha=.23;
  if(theme==='arctic'){for(let i=0;i<32;i++){const x=(i*137+t*8)%width,y=(i*71+t*24)%height;oval(ctx,x,y,1.5,1.5,'#f4f6e9',null);}}
  else if(theme==='marsh'){for(let i=0;i<22;i++){const x=(i*83+t*60)%width,y=(i*127+t*125)%height;line(ctx,[[x,y],[x-4,y+9]],'#d7e7d6',1);}}
  else if(theme==='urban'||theme==='outpost'||theme==='scrub'||theme==='junction'){for(let i=0;i<22;i++){const x=(i*109+t*6)%width,y=((i*83-t*14)%height+height)%height;oval(ctx,x,y,1.4,1.4,'#f3d092',null);}}
  else{for(let i=0;i<4;i++){const x=((i*270+t*7)%(width+220))-110;oval(ctx,x,80+i*(height/4),85,13,'#d9ddbd',null);}}
  ctx.restore();
}
// The road and terrain never change during a match; draw them once per path.
const terrainCache=new WeakMap();
// Same-origin illustrated ground is cosmetic. Cache a new terrain layer once it
// loads; no simulation data, map geometry, or hit targets are touched.
const groundImages=new Map();
function getGroundImage(doc,theme,variant=0){
  // V3 field art: one painted plate per theme in the iron-cross icon's
  // painting style - bolder contrast, olive grading, painted shadow shapes.
  // The per-field section, mirror and offset below already keep two maps of
  // the same theme from sharing ground, so the old second plates retired.
  const base=({forest:'terrain3-forest',urban:'terrain3-city',outpost:'terrain3-city',scrub:'terrain3-desert',arctic:'terrain3-snow',marsh:'terrain3-marsh',talwald:'terrain3-talwald',junction:'terrain3-junction'})[theme];
  const name=base?base+'.jpg':'endless-ground3.jpg';
  if(!groundImages.has(name)&&doc?.createElement){const image=doc.createElement('img'),entry={image,ready:false};groundImages.set(name,entry);image.onload=()=>{entry.ready=true;};image.src=`assets/${name}`;}
  const entry=groundImages.get(name);return entry?.ready?entry.image:null;
}
// Marked terrain patches: a tinted ellipse on the road with its field label.
// The state overlays (broken ice, rubble remaining) are drawn per frame in
// drawZoneStates, so the cached layer below stays valid for the whole run.
const ZONE_STYLES=Object.freeze({
 ice:{fill:'rgba(107,154,163,.5)',edge:'#d7ece9',label:'THIN ICE'},
 bog:{fill:'rgba(88,77,54,.55)',edge:'#c0b694',label:'DEEP BOG'},
 rubble:{fill:'rgba(100,95,84,.5)',edge:'#d0c9b4',label:'RUBBLE'},
 ambush:{fill:'rgba(71,91,67,.55)',edge:'#b0c4a1',label:'AMBUSH TRAIL'},
 dust:{fill:'rgba(168,137,94,.4)',edge:'#e0c9a4',label:'DUST'}
});
// Reported idea: "Fackeln als Straßen Rand in guten Abständen" - warm light
// posts at regular intervals make the enemy route readable at a glance and
// put life on the field. Every theme gets its own post: war torches in the
// wild, oil lanterns in the ruins, frosted lanterns on the ice. The painted
// sprites land asset-wise; the vector post below is the loading fallback.
function drawTorches(ctx,torches,theme,time,reducedMotion,notify){
  if(!torches||!torches.length)return;
  const kind=theme==='arctic'?'icelantern':theme==='urban'||theme==='outpost'||theme==='junction'?'lantern':'torch';
  const artwork=sprite(ctx,kind,notify),t0=Number.isFinite(time)?time:0,warm=kind==='icelantern';
  for(const [i,p] of torches.entries()){
    const flick=reducedMotion?1:1+.15*Math.sin(t0*11+i*2.4)+.09*Math.sin(t0*23+i*1.7);
    ctx.save();
    // V3: the torch is a light source, not a sticker - a radial glow that
    // breathes with the flame and lays warm light on the ground around it.
    const glow=radial(ctx,p.x,p.y+2,3,p.x,p.y+2,46);
    if(glow){glow.addColorStop(0,warm?'rgba(198,226,244,.36)':'rgba(255,198,118,.4)');glow.addColorStop(1,warm?'rgba(198,226,244,0)':'rgba(255,198,118,0)');ctx.save();ctx.globalAlpha=.5+.4*(flick-.9);ctx.beginPath();ctx.arc(p.x,p.y+2,46,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();ctx.restore();}
    else{ctx.globalAlpha=.15;oval(ctx,p.x,p.y+2,26,16,warm?'#cfe3f2':'#ffca7a',null);ctx.globalAlpha=.09;oval(ctx,p.x,p.y+2,42,26,warm?'#cfe3f2':'#ffca7a',null);ctx.globalAlpha=1;}
    if(artwork){const h=42,w=h*artwork.width/artwork.height;ctx.drawImage(artwork,p.x-w/2,p.y+2-h,w,h);}
    else{
      // Painted fallback post until the artwork lands.
      oval(ctx,p.x,p.y+3,7,3,'rgba(20,26,20,.35)',null);
      ctx.fillStyle='#4c3b28';ctx.fillRect(p.x-2.5,p.y-26,5,28);
      ctx.fillStyle='#6a533a';ctx.fillRect(p.x-2.5,p.y-26,2,28);
      ctx.fillStyle='#3a3a3c';ctx.fillRect(p.x-3,p.y-13,6,2);
    }
    // The living flame core rides at the top of whichever post is drawn -
    // painted artwork or vector fallback.
    const top=p.y+2-(artwork?42:28);
    if(warm){oval(ctx,p.x,top+5,5,6*flick,'#dceef7','#93b2c4',1);oval(ctx,p.x,top+5,2.5,3*flick,'#fff6df',null);}
    else{oval(ctx,p.x,top+4,4.5*flick,7.5*flick,'#ff9d3d',null);oval(ctx,p.x,top+5.5,2.6*flick,4.6*flick,'#ffe9b0',null);}
    ctx.restore();
  }
}
// Zones are organic patches of ground, not geometric markers: a wobbling
// closed blob derived from the zone id - deterministic, never a bare circle.
function zoneBlob(ctx,zone,scale=1){
  const wob=(zone.id||0)*2.399+1.7;
  ctx.beginPath();
  for(let k=0;k<=12;k++){
    const a=k/12*Math.PI*2,rr=zone.r*scale*(1+.13*Math.sin(a*3+wob)+.08*Math.sin(a*5-wob*2));
    const x=zone.x+Math.cos(a)*rr,y=zone.y+Math.sin(a)*rr*.74;
    k?ctx.lineTo(x,y):ctx.moveTo(x,y);
  }
  ctx.closePath();
}
function drawZone(ctx,zone){
 const style=ZONE_STYLES[zone.kind]||ZONE_STYLES.rubble;
 // Reported: "Gebiete wie Sumpf sehen auch aus als passen sie nicht mehr
 // rein, der nur Kreis" - the zone becomes part of the ground: an organic
 // blotch, a whisper of a border, a soft label instead of a sign plate.
 ctx.save();zoneBlob(ctx,zone,.96);
 ctx.fillStyle=style.fill;ctx.fill();
 ctx.setLineDash([7,9]);ctx.globalAlpha=.6;ctx.strokeStyle=style.edge;ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(241,231,196,.75)';
 ctx.strokeText(tr(style.label),zone.x,zone.y-zone.r*.72-8);
 ctx.fillStyle='rgba(29,48,40,.85)';ctx.fillText(tr(style.label),zone.x,zone.y-zone.r*.72-8);
 ctx.textAlign='start';ctx.restore();
}
function drawZoneStates(ctx,zones,state){
 for(const zone of zones||[]){
  if(zone.kind==='ice'&&state?.zoneBroken?.[zone.id]){
   ctx.save();zoneBlob(ctx,zone);
   ctx.fillStyle='rgba(51,94,109,.55)';ctx.fill();ctx.strokeStyle='#d2eff0';ctx.lineWidth=2;ctx.stroke();
   ctx.fillStyle='#d2eff0';ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.fillText(tr('BROKEN ICE'),zone.x,zone.y+4);ctx.restore();
  }else if(zone.kind==='rubble'&&state&&!state.zoneCleared?.[zone.id]&&(state.zoneDamage?.[zone.id]||0)>0){
   ctx.save();ctx.fillStyle='#d0c9b4';ctx.font='bold 10px Georgia';ctx.textAlign='center';
   ctx.fillText(tr('RUBBLE {amount}',{amount:Math.max(0,Math.ceil(200-state.zoneDamage[zone.id]))}),zone.x,zone.y+4);ctx.restore();
  }
 }
}
// Sector maps carry their own ruins, sheds and gatehouses. They are pure set
// dressing drawn into the cached terrain layer: they never cover a pad (the
// generator keeps them clear) and they never touch game state.
// Reported: the buildings, ruins etc. of the new map rendering should have the
// same look as towers and field - rendered artwork, not flat vector boxes. The
// vector branches below stay as the asset-loading fallback, exactly like the
// tower pads keep theirs.
const DECO_ART={cabin:56,barn:64,stand:44,stilt:46,shed:58,ruin:62,wall:72,factory:68,gate:34,mast:56,forester:64,cross:36};
// V2 field art: the set dressing is realistically painted now, matching
// bunker, emplacements, torches and actors. The kind keeps its map identity
// (the generator is untouched); only the artwork reference moves to the
// painted file - the same cache-busting rename every V2 sprite got.
const DECO_SPRITE={cabin:'cabin2',barn:'barn2',stand:'stand2',stilt:'stilt2',shed:'shed2',ruin:'ruin2',wall:'wall2',factory:'factory2',gate:'gate2'};
// Every field type gets its OWN buildings (reported: not just snow - all five
// map kinds): forest structures overgrown with moss, marsh dwellings on
// reed-thatched stilts, sun-bleached scrub shacks, snow-buried cabins. Urban
// keeps the brick set. Same kinds, same silhouettes, painted for their field.
const THEME_SPRITE={
  forest:{cabin:'cabin2forest',barn:'barn2forest',stand:'stand2forest'},
  arctic:{cabin:'cabin2snow',ruin:'ruin2snow'},
  marsh:{stilt:'stilt2marsh',ruin:'ruin2marsh'},
  scrub:{shed:'shed2scrub',ruin:'ruin2scrub',wall:'wall2scrub'},
  urban:{ruin:'ruin2',wall:'wall2',factory:'factory2'},
  outpost:{ruin:'ruin2',wall:'wall2',factory:'factory2'},
  // Campaign-only Act I dressing (Talwald): the relay masts, forester houses,
  // wayside crosses and the downed courier machine never appear in free play -
  // free play keeps its five rotating themes (see maps.mjs STORY_FIELDS).
  talwald:{mast:'funk2',forester:'forester2',cross:'cross2',wreck:'landmark2-wreck'},
  // Act V (the junction): rail-yard industry - the same brick set as the
  // occupied city, so the knot reads as one built world. Campaign only.
  junction:{ruin:'ruin2',wall:'wall2',factory:'factory2'},
};
function drawDeco(ctx,deco,theme,notify,scale=1){
  // `scale` grows the dressing with the field: a fixed 60px barn reads fine on
  // a 960 map but drowns on a 2040 sector field.
  const walls={forest:'#7c6b50',arctic:'#7d6a55',marsh:'#6a5c49',scrub:'#9c8663',urban:'#8a8880',outpost:'#8f8268',talwald:'#6f7a58',junction:'#86867e'}[theme]||'#8a7d64';
  const roofs={forest:'#54432f',arctic:'#dfe8e6',marsh:'#4f4436',scrub:'#6d4f35',urban:'#55564f',outpost:'#5e5340',talwald:'#3f4c34',junction:'#51524b'}[theme]||'#54432f';
  for(const d of deco||[]){
    const tone=Math.floor((d.shade||0)*3),wall=[walls,'#6f6250','#93846a'][tone]||walls;
    const artwork=sprite(ctx,(THEME_SPRITE[theme]&&THEME_SPRITE[theme][d.kind])||DECO_SPRITE[d.kind]||d.kind,notify);
    if(artwork){
      // Painted buildings stand UPRIGHT, always. The old 90-degree deco
      // rotation was made for the abstract vector shapes; applied to the
      // painted sprites it tipped whole buildings onto their side - reported
      // as "Gebaeude sehr schlecht erkennbar".
      const w=(DECO_ART[d.kind]||58)*scale,h=w*artwork.height/artwork.width;
      ctx.save();ctx.translate(d.x,d.y);
      // Grounding: a dark earth clearing under the building plus a directional
      // contact shadow (light from the top-left) separates it from the busy
      // tile mosaic behind it - the building reads as a solid object.
      oval(ctx,0,10,w*.56,Math.max(5,h*.14),'rgba(15,21,16,.24)',null);
      oval(ctx,w*.1,11,w*.44,Math.max(4,h*.1),'rgba(10,15,11,.3)',null);
      ctx.drawImage(artwork,-w/2,13-h,w,h);
      ctx.restore();continue;
    }
    ctx.save();ctx.translate(d.x,d.y);if(d.rot)ctx.rotate(Math.PI/2);
    if(d.kind==='ruin'){
      // A broken wall: jagged roofline, a gap, and rubble at the foot.
      shape(ctx,[[-22,16],[-22,-6],[-16,-2],[-12,-10],[-6,-4],[0,-12],[6,-5],[12,-14],[18,-6],[22,-12],[22,16]],wall,ink,3);
      shape(ctx,[[-22,16],[-8,10],[4,16],[16,9],[22,16]],'#7a6f5c',ink,2);
      oval(ctx,26,12,7,5,'#6e6353',ink,2);
    }else if(d.kind==='wall'){
      shape(ctx,[[-24,-4],[-6,-4],[-6,4],[-24,4]],wall,ink,2.5);
      shape(ctx,[[2,-4],[24,-4],[24,4],[2,4]],wall,ink,2.5);
      oval(ctx,-2,8,4,3,'#6e6353',ink,1.5);
    }else if(d.kind==='stand'){
      // A hunting stand: a raised hut on four legs.
      line(ctx,[[-16,18],[-12,-2]],[ink],3);line(ctx,[[16,18],[12,-2]],[ink],3);line(ctx,[[-16,18],[16,18]],[ink],2);
      shape(ctx,[[-14,-2],[14,-2],[14,-16],[-14,-16]],wall,ink,2.5);
      shape(ctx,[[-17,-16],[17,-16],[10,-26],[-10,-26]],roofs,ink,2.5);
      ctx.fillStyle='#2c3a30';ctx.fillRect(-7,-12,5,7);ctx.fillRect(3,-12,4,7);
    }else if(d.kind==='factory'){
      shape(ctx,[[-24,14],[-24,-10],[24,-10],[24,14]],wall,ink,3);
      shape(ctx,[[-24,-10],[-16,-20],[-4,-20],[-4,-10]],roofs,ink,2.5);
      shape(ctx,[[6,-10],[6,-24],[12,-24],[12,-10]],'#7b7f7a',ink,2.5);
      ctx.fillStyle='#2c3a30';ctx.fillRect(-12,-4,7,10);ctx.fillRect(6,-2,6,8);
      ctx.fillStyle='#c8d4c9';ctx.fillRect(-2,-6,5,5);
    }else{
      // Cabin, barn, shed, stilt house, gatehouse: one cartoon house body.
      const roof=d.kind==='gate'?roofs:d.kind==='barn'?'#6e3f2e':roofs;
      if(d.kind==='stilt'){line(ctx,[[-16,20],[-12,6]],[ink],3);line(ctx,[[16,20],[12,6]],[ink],3);}
      shape(ctx,[[-21,15],[-21,-8],[21,-8],[21,15]],wall,ink,3);
      shape(ctx,[[-25,-8],[0,-22],[25,-8]],roof,ink,3);
      ctx.fillStyle='#2c3a30';ctx.fillRect(-5,3,10,12);
      ctx.fillStyle=d.kind==='gate'?'#c8d4c9':'#3d4f42';ctx.fillRect(-14,-3,6,6);ctx.fillRect(8,-3,6,6);
      if(d.kind==='gate'){ctx.fillStyle=paper;ctx.font='bold 7px Georgia';ctx.textAlign='center';ctx.fillText('IN',0,-11);}
    }
    ctx.restore();
  }
}
// Deterministic per-map detail stream: xorshift32 seeded by the map seed.
function detailRng(seed){let s=(seed>>>0)||1;return ()=>{s=(s^(s<<13))>>>0;s=(s^(s>>>17))>>>0;s=(s^(s<<5))>>>0;return s/4294967296;};}
// Reported: "Wir sollten das so aufbauen das wirklich jede Karte immer andere
// Details hat" - the ground tells a per-map story: big soft patches plus theme
// scatter (tufts, stones, cracks, puddles, reeds, drifts), all derived from
// the map seed alone. Pure presentation - roads, zones, pads and buildings
// paint over whatever lands beneath them.
const GROUND_TINTS=['#d9b98a','#9db3c4','#a8b48a','#c4a9a0','#b7a9c0'];
export function drawGroundDetails(ctx,theme,width,height,seed){
  const r=detailRng(seed);
  const P={
    forest:{patch:['#1e2c1c','#39492f'],items:(x,y,k,r2)=>{
      if(k<.34){ctx.strokeStyle='#4e6b3f';ctx.lineWidth=1.5;ctx.beginPath();for(let i=-1;i<=1;i++){ctx.moveTo(x,y);ctx.lineTo(x+i*3.2,y-5-r2()*4);}ctx.stroke();}
      else if(k<.58){ctx.fillStyle=r2()<.5?'#5a4a2e':'#6b5a35';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+r2()*8-4,y+r2()*6-3,1.3+r2(),0,Math.PI*2);ctx.fill();}}
      else if(k<.8){ctx.strokeStyle='rgba(40,32,20,.22)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+8+r2()*10,y+3+r2()*5);ctx.lineTo(x+16+r2()*14,y+1+r2()*6);ctx.stroke();}
      else oval(ctx,x,y,4+r2()*4,2.5+r2()*2,'rgba(60,90,50,.18)',null);}},
    urban:{patch:['#33332e','#4a4a44'],items:(x,y,k,r2)=>{
      if(k<.3){ctx.strokeStyle='rgba(25,25,22,.28)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4+r2()*6,y+2-r2()*4);ctx.lineTo(x+9+r2()*8,y+3+r2()*4);ctx.lineTo(x+14+r2()*10,y-1-r2()*3);ctx.stroke();}
      else if(k<.55){ctx.save();ctx.globalAlpha=.14;oval(ctx,x,y,7+r2()*9,4+r2()*5,'#211f1b',null);ctx.restore();}
      else if(k<.8){ctx.fillStyle='#6e6a5e';for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x+r2()*10-5,y+r2()*8-4,.9+r2()*.9,0,Math.PI*2);ctx.fill();}}
      else{ctx.strokeStyle='rgba(200,190,150,.2)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+10+r2()*8,y);ctx.stroke();}}},
    junction:{patch:['#2c302e','#434845'],items:(x,y,k,r2)=>{
      if(k<.3){ctx.fillStyle='#6a6e66';for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x+r2()*9-4,y+r2()*7-3,.8+r2()*.8,0,Math.PI*2);ctx.fill();}}
      else if(k<.55){ctx.save();ctx.globalAlpha=.15;oval(ctx,x,y,8+r2()*10,4+r2()*5,'#191d1b',null);ctx.restore();}
      else if(k<.8){ctx.save();ctx.translate(x,y);ctx.rotate(r2()*Math.PI);ctx.fillStyle='rgba(40,36,28,.3)';ctx.fillRect(-6,-2,12,4);ctx.restore();}
      else{ctx.strokeStyle='rgba(190,196,184,.2)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+8+r2()*8,y+1-r2()*2);ctx.stroke();}}},
    arctic:{patch:['#8ea6ad','#e8eee9'],items:(x,y,k,r2)=>{
      if(k<.4){ctx.save();ctx.globalAlpha=.22;oval(ctx,x,y,10+r2()*16,4+r2()*6,'#f4f8f4',null);ctx.restore();}
      else if(k<.65){ctx.save();ctx.globalAlpha=.16;oval(ctx,x,y,6+r2()*8,3+r2()*4,'#9fb2b8',null);ctx.restore();}
      else if(k<.88){ctx.fillStyle='#f6f9f2';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+r2()*9-4,y+r2()*7-3,.7+r2()*.7,0,Math.PI*2);ctx.fill();}}
      else{ctx.strokeStyle='rgba(160,190,200,.3)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+6+r2()*10,y+2-r2()*4);ctx.stroke();}}},
    marsh:{patch:['#241f16','#3a3222'],items:(x,y,k,r2)=>{
      if(k<.34){ctx.save();ctx.globalAlpha=.3;oval(ctx,x,y,8+r2()*12,4+r2()*6,'#5d6b58',null);ctx.restore();ctx.strokeStyle='rgba(30,36,28,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,8+r2()*12,4+r2()*6,0,0,Math.PI*2);ctx.stroke();}
      else if(k<.62){ctx.strokeStyle='#5d6b46';ctx.lineWidth=1.4;ctx.beginPath();for(let i=0;i<4;i++){const a=-.3+r2()*.6;ctx.moveTo(x,y);ctx.lineTo(x+Math.sin(a)*3,y-7-r2()*5);}ctx.stroke();}
      else if(k<.85){ctx.save();ctx.globalAlpha=.16;oval(ctx,x,y,9+r2()*10,3+r2()*3,'#171410',null);ctx.restore();}
      else oval(ctx,x,y,1.5+r2(),1+r2()*.6,'#7a744e',null);}},
    scrub:{patch:['#4a3a26','#6b5638'],items:(x,y,k,r2)=>{
      if(k<.36){ctx.strokeStyle='#a08a5c';ctx.lineWidth=1.4;ctx.beginPath();for(let i=-1;i<=1;i++){ctx.moveTo(x,y);ctx.lineTo(x+i*3.5,y-4-r2()*4);}ctx.stroke();}
      else if(k<.62){oval(ctx,x+1,y+1,3+r2()*3,2+r2()*2,'rgba(30,26,18,.25)',null);oval(ctx,x,y,3+r2()*3,2+r2()*2,'#8a8274',null);}
      else if(k<.86){ctx.strokeStyle='rgba(40,30,16,.24)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5+r2()*8,y+1-r2()*3);ctx.lineTo(x+10+r2()*10,y+2+r2()*4);ctx.stroke();}
      else oval(ctx,x,y,1.4+r2(),1+r2()*.5,'#b5a075',null);}}
  }[theme]||{patch:['#2a2a20','#443f2c'],items:(x,y,k,r2)=>{
    if(k<.4){ctx.strokeStyle='#7d8a5f';ctx.lineWidth=1.4;ctx.beginPath();for(let i=-1;i<=1;i++){ctx.moveTo(x,y);ctx.lineTo(x+i*3,y-4-r2()*4);}ctx.stroke();}
    else if(k<.7){oval(ctx,x,y,2+r2()*2,1.2+r2(),'#8a8074',null);}
    else{ctx.save();ctx.globalAlpha=.12;oval(ctx,x,y,6+r2()*8,3+r2()*4,'#242018',null);ctx.restore();}}};
  const n=10+Math.floor(r()*7);
  for(let i=0;i<n;i++){ctx.save();ctx.globalAlpha=.04+r()*.05;ctx.beginPath();ctx.ellipse(r()*width,r()*height,60+r()*110,36+r()*80,r()*Math.PI,0,Math.PI*2);ctx.fillStyle=r()<.5?P.patch[0]:P.patch[1];ctx.fill();ctx.restore();}
  const m=Math.round((width*height)/(960*540)*(55+r()*40));
  for(let i=0;i<m;i++)P.items(r()*width,r()*height,r(),r);
}
// V3.2 ground: an organic painted patchwork, not soft rectangles. Each patch
// is a plate sample clipped to a seeded wobbly BLOB and feathered, laid in
// three octaves (base cover, mid variety, small accents) with per-patch
// mirror, offset and hue/brightness jitter - the patches interlock like oil
// paint and every field composes its own ground from its own seed.
function blobPath(c,cx,cy,rx,ry,rng){
  const n=11,wob=[];for(let k=0;k<n;k++)wob.push(.86+rng()*.28);
  c.beginPath();
  for(let k=0;k<=n;k++){
    const a=k/n*Math.PI*2,r=wob[k%n];
    const x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;
    k?c.lineTo(x,y):c.moveTo(x,y);
  }
  c.closePath();
}
function paintTileMosaic(target,img,width,height,rng,doc){
  const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
  if(!iw||!ih)return;
  const sample=Math.min(iw,ih);
  const scratch={};
  const getScratch=(ts,td)=>{const key=ts+'x'+td;if(!scratch[key]){const c=doc.createElement('canvas');c.width=ts;c.height=td;scratch[key]=c;}return scratch[key];};
  const patch=(ts,td)=>{
    const canvas=getScratch(ts,td),c=canvas.getContext('2d');if(!c)return null;
    c.clearRect(0,0,ts,td);
    const ss=sample*(.36+rng()*.3),sx=rng()*Math.max(0,iw-ss),sy=rng()*Math.max(0,ih-ss);
    c.save();
    const mx=rng()<.5,my=rng()<.5;c.translate(mx?ts:0,my?td:0);c.scale(mx?-1:1,my?-1:1);
    c.drawImage(img,sx,sy,ss,ss,0,0,ts,td);
    c.restore();
    // Clip to the blob and feather its rim: destination-in with a radial
    // gradient INSIDE the blob shape.
    c.globalCompositeOperation='destination-in';
    c.save();blobPath(c,ts/2,td/2,ts*.54,td*.56,rng);
    const g=c.createRadialGradient(ts/2,td/2,Math.min(ts,td)*.2,ts/2,td/2,Math.max(ts,td)*.55);
    g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.72,'rgba(0,0,0,.97)');g.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=g;c.fill();c.restore();
    c.globalCompositeOperation='source-over';
    return canvas;
  };
  const octaves=[
    {size:width/3.1,alpha:1,cover:1},
    {size:width/5.4,alpha:.85,cover:.6},
    {size:width/8.6,alpha:.68,cover:.38},
  ];
  for(const o of octaves){
    const ts=Math.round(o.size),td=Math.round(ts*.72);
    const overlap=Math.round(ts*.44),stepX=ts-overlap,stepY=td-overlap;
    const across=Math.ceil((width+overlap)/stepX)+1,down=Math.ceil((height+overlap)/stepY)+1;
    for(let j=0;j<down;j++)for(let i=0;i<across;i++){
      if(i+j>0&&rng()>o.cover)continue;
      const tile=patch(ts,td);if(!tile)continue;
      const jx=Math.round((rng()-.5)*overlap*.6),jy=Math.round((rng()-.5)*overlap*.6);
      target.save();
      // Per-patch alpha jitter: each patch breathes a little differently.
      // (A ctx.filter hue/brightness jitter was tried here - canvas filters
      // are slow enough to matter when a whole map paints at once.)
      target.globalAlpha=Math.min(1,o.alpha*(0.9+rng()*.2));
      target.drawImage(tile,i*stepX-overlap+jx,j*stepY-overlap+jy);
      target.restore();
    }
  }
}
function drawTerrain(ctx,path,theme,{paths=[path],width=960,height=540,storyMission=null,pads=[],storyArt=null,renderScale=1,artVersion=0,deco=[],zones=[],notify=null,groundSeed=0}={}){
  const doc=ctx.canvas?.ownerDocument,img=doc?getGroundImage(doc,theme,detailRng((groundSeed^0xc2b2ae35)>>>0)()<.5?1:0):null;
  function paint(target){
    if(!storyMission||!drawStoryTerrain(target,storyMission,path,pads,width,height,img,storyArt)){
      ground(target,theme,width,height);
      if(img&&doc?.createElement){
        // The seeded tile mosaic: interlocking feathered patches, a different
        // whole-map composition for every field.
        target.save();target.globalAlpha=.94;
        paintTileMosaic(target,img,width,height,detailRng((groundSeed^0x9e3779b9)>>>0),doc);
        target.restore();
      }
      else if(img){
        // No DOM (headless tests): the plate itself, as before.
        const over=.18,ow=width*(1+over),oh=height*(1+over),vr=detailRng((groundSeed^0x9e3779b9)>>>0);
        const ox=width*over*vr(),oy=height*over*vr(),flipX=vr()<.5,flipY=vr()<.5;
        target.save();target.globalAlpha=.92;
        target.translate(flipX?width:0,flipY?height:0);target.scale(flipX?-1:1,flipY?-1:1);
        target.drawImage(img,-ox,-oy,ow,oh);
        target.restore();
      }
      const tr=detailRng((groundSeed^0x85ebca6b)>>>0);
      target.save();target.globalAlpha=.05+tr()*.04;target.fillStyle=GROUND_TINTS[Math.floor(tr()*GROUND_TINTS.length)];target.fillRect(0,0,width,height);target.restore();
      drawGroundDetails(target,theme,width,height,groundSeed);
    }
    for(const road of paths)drawRoad(target,road,theme,img);thinIce(target,path,theme);bog(target,path,theme);for(const zone of zones)drawZone(target,zone);
    // Field dressing grows with the map (capped: it must not swallow the road
    // it was placed clear of).
    drawDeco(target,deco,theme,notify,Math.max(1,Math.min(1.45,width/1100)));
    // V3 grade: an olive cast with a painted vignette - the frame darkens,
    // the field centre stays bright, and the eye lands where the fighting is.
    target.save();target.globalAlpha=.14;target.fillStyle='#2c4232';target.fillRect(0,0,width,height);target.globalAlpha=1;
    const vig=radial(target,width/2,height/2,Math.min(width,height)*.44,width/2,height/2,Math.max(width,height)*.74);
    if(vig){vig.addColorStop(0,'rgba(9,13,10,0)');vig.addColorStop(1,'rgba(9,13,10,.36)');target.fillStyle=vig;}
    else{target.globalAlpha=.16;target.fillStyle='#090d0a';}
    target.fillRect(0,0,width,height);target.restore();
  }
  if(!doc?.createElement){paint(ctx);return;}
  let variants=terrainCache.get(path);if(!variants){variants=new Map();terrainCache.set(path,variants);}
  // The terrain layer's raster resolution is FIXED PER MAP. It used to follow
  // renderScale, which includes the battle-viewport zoom - so every zoom step
  // re-rastered the whole mosaic into a fresh canvas (up to 3x = ~80MB for a
  // sector map) and the game hung while zooming (reported: 'Game haengt beim
  // Zoomen'). The layer is scaled by the ctx transform instead; painted ground
  // stays crisp to 2x and only softens gently beyond.
  const resolution=Math.max(1,Math.min(2,Math.sqrt(6000000/(width*height)))),key=`${storyMission?.id||'free'}:${theme}:${width}:${height}`,revision=`${img?'art':'fallback'}:${storyArt?.version||0}:${getLanguage()}:${resolution}:${artVersion}`;let cached=variants.get(key);
  if(!cached||cached.revision!==revision){const canvas=doc.createElement('canvas');canvas.width=Math.round(width*resolution);canvas.height=Math.round(height*resolution);const off=canvas.getContext('2d');if(!off){paint(ctx);return;}off.scale(resolution,resolution);off.lineCap='round';off.lineJoin='round';paint(off);cached={canvas,revision};variants.set(key,cached);}
  ctx.drawImage(cached.canvas,0,0,width,height);
}
export function drawCartoonBattle(ctx,state,{path,pads,types,me,getTowerRange,theme='road',shotAge=0,effects=[],reducedMotion=false,soldierPoses={},paths=[path],width=960,height=540,bunkerPosition={x:900,y:400},storyMission=null,storyStage=null,storyTime=0,renderScale=1,artVersion=0,deco=[],zones=[],torches=[],onSpritesReady=null,groundSeed=0}){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';const storyArt=storyMission?prepareStoryArt(ctx.canvas?.ownerDocument):null;drawTerrain(ctx,path,theme,{paths,width,height,storyMission,pads,storyArt,renderScale,artVersion,deco,zones,notify:onSpritesReady,groundSeed});drawZoneStates(ctx,zones,state);fieldZone(ctx,path,state,theme);brokenIce(ctx,path,state,theme);if(storyMission){drawStoryAtmosphere(ctx,storyMission,storyTime,reducedMotion,width,height,path,pads);drawStoryObjective(ctx,storyMission,storyStage,storyTime,reducedMotion,storyArt);}else if(!reducedMotion)ambient(ctx,theme,storyTime,width,height);const approach=path.length>1?Math.atan2(bunkerPosition.y-path[path.length-2].y,bunkerPosition.x-path[path.length-2].x):0;
  // The bunker flinches when it takes a hit - the impact effect carries the
  // timing, the shake is a decaying wobble around the flinch.
  const hit=!reducedMotion&&(effects||[]).find(f=>f&&f.kind==='bunkerHit');
  const flinch=hit?Math.max(0,1-(hit.progress||0))*3.2:0;
  const fx=flinch?flinch*Math.sin((hit.progress||0)*34):0,fy=flinch?flinch*Math.cos((hit.progress||0)*29):0;
  ctx.save();ctx.translate(bunkerPosition.x+fx,bunkerPosition.y+fy);bunker(ctx,state,onSpritesReady,approach);ctx.restore();
  drawTorches(ctx,torches,theme,storyTime,reducedMotion,onSpritesReady);
  if(!reducedMotion&&state.hp>0&&state.hp/Math.max(1,state.maxHp||100)<.35){const t=Number.isFinite(storyTime)?storyTime:0;ctx.save();ctx.globalAlpha=.28;for(let i=0;i<3;i++){const phase=((t*.3+i/3)%1+1)%1;oval(ctx,bunkerPosition.x+20+Math.sin(t+i)*3,bunkerPosition.y-18-phase*25,3+phase*5,2+phase*3,'#465447',null);}ctx.restore();}
  // Enemy entries live where the roads actually cross the border - any of
  // the four edges - instead of two fixed labels on the left rim.
  ctx.font='bold 12px Georgia';
  for(const road of paths){
    const a=road[0],b=road[1]||{x:a.x+1,y:a.y};
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
    // Three chevrons pointing down the road, just inside the border.
    for(let k=0;k<3;k++){const cx=a.x+ux*(64+k*13),cy=a.y+uy*(64+k*13);
      line(ctx,[[cx-uy*8-ux*7,cy+ux*8-uy*7],[cx,cy],[cx+uy*8-ux*7,cy-ux*8-uy*7]],'#2f4237',4);}
    // The label sits beside the road, never on the tar, with a paper halo so
    // it stays readable on every ground.
    const lx=a.x+ux*88-uy*34,ly=a.y+uy*88+ux*34;
    ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle=paper;ctx.strokeText(tr('ENEMY ENTRY'),lx,ly);ctx.fillStyle='#344231';ctx.fillText(tr('ENEMY ENTRY'),lx,ly);ctx.textAlign='start';
  }
  const selected=state.towers.find(t=>t.pad===state.selectedPad);if(selected&&!state.ended){const p=pads[selected.pad];ctx.beginPath();ctx.arc(p.x,p.y,getTowerRange(selected),0,Math.PI*2);ctx.fillStyle='rgba(129,179,164,.10)';ctx.fill();ctx.strokeStyle='#b1d3c6';ctx.lineWidth=1.5;ctx.setLineDash([5,7]);ctx.stroke();ctx.setLineDash([]);}
  if(!reducedMotion)for(const tower of state.towers){const owner=state.players[tower.ownerId],p=pads[tower.pad];if(p&&owner?.active!==false&&owner?.overdrive>0){ctx.beginPath();ctx.ellipse(p.x,p.y,31,27,0,0,Math.PI*2);ctx.strokeStyle='#fff1a3';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);}}
  pads.forEach((p,i)=>pad(ctx,p,state.towers.find(t=>t.pad===i),state.selectedPad===i,types,onSpritesReady));
  // The soldier is drawn from the first frame, not from wave one. He used to appear
  // only while `state.wave>0`, and since the movement order itself was accepted
  // before the first deploy (the simulation walks him there), the hero moved
  // invisibly: the newest player tapped the ground, got "Hero moving to position",
  // and watched nothing happen. A hero you cannot see is a hero you cannot command.
  for(const p of Object.values(state.players))if(p.active!==false){if(state.wave>0&&p.mobileSupply?.remaining>0){ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,22,0,Math.PI*2);ctx.strokeStyle='#89d9ed';ctx.lineWidth=3;ctx.stroke();ctx.restore();}soldier(ctx,p,p.id===me,soldierPoses[p.id],undefined,onSpritesReady);}
  if(theme==='scrub'&&path.length===10)for(const cloud of state.dustClouds||[]){
    ctx.save();ctx.beginPath();ctx.arc(cloud.x,cloud.y,75,0,Math.PI*2);ctx.fillStyle='rgba(210,168,119,.12)';ctx.fill();ctx.strokeStyle='rgba(133,88,57,.45)';ctx.lineWidth=2;ctx.setLineDash(reducedMotion?[]:[4,9]);ctx.stroke();ctx.restore();
  }
  if(theme==='scrub'&&path.length===10)for(const e of state.enemies)if(e.kind==='tank'&&e.hp>0){
    ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,75,0,Math.PI*2);ctx.fillStyle='rgba(210,168,119,.18)';ctx.fill();ctx.strokeStyle='rgba(133,88,57,.65)';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.stroke();ctx.restore();
  }
  if(state.running&&Object.values(state.players).some(p=>p.active!==false&&p.healingField?.remaining>0)){ctx.save();ctx.beginPath();ctx.arc(bunkerPosition.x,bunkerPosition.y,58,0,Math.PI*2);ctx.fillStyle='rgba(139,218,148,.16)';ctx.fill();ctx.strokeStyle='#9bd69a';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
  for(const e of state.enemies){
    if(e.siegeMarks?.some(m=>m.time>0)){ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,20,0,Math.PI*2);ctx.strokeStyle='#f3a45c';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
    if(e.boss==='bossBomber'&&bossPhase(e)==='bomb-warning'){
      ctx.save();ctx.strokeStyle='#f2aa78';ctx.lineWidth=3;ctx.setLineDash(reducedMotion?[]:[7,6]);ctx.beginPath();ctx.arc(bunkerPosition.x,bunkerPosition.y,36,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(e.boss==='bossBomber'&&e.bossFlash>0&&!reducedMotion)burst(ctx,bunkerPosition.x,bunkerPosition.y,20+(1-e.bossFlash)*12,'#ef9e68');
    if(e.boss==='bossJuggernaut'&&e.bossFlash>0&&!reducedMotion)burst(ctx,e.x,e.y-20,15,'#cce7a2');
    ctx.save();if(state.running&&!reducedMotion){const offset=Math.sin((Number.isFinite(storyTime)?storyTime:0)*5+(e.x+e.y)*.035)*(e.kind==='plane'?.8:1.2);ctx.translate(0,offset);}// Where is this unit going? The next path point gives the heading, the
    // bend after it gives the bank - read from geometry, never stored.
    const road=paths[e.road]||paths[0];let heading=0,bank=0;
    if(road&&Array.isArray(road)&&road.length>1&&Number.isFinite(e.segment)){
      const at=Math.max(0,Math.min(road.length-1,e.segment)),from=road[Math.max(0,at-1)],to=road[at],next=road[Math.min(road.length-1,at+1)];
      const dx=to.x-from.x,dy=to.y-from.y,nd=next.x-to.x,ny=next.y-to.y;
      if(Math.hypot(dx,dy)>1)heading=Math.atan2(dy,dx);
      if(Math.hypot(nd,ny)>1){let turn=Math.atan2(ny,nd)-heading;while(turn>Math.PI)turn-=Math.PI*2;while(turn<-Math.PI)turn+=Math.PI*2;bank=turn;}
    }
    enemy(ctx,e,reducedMotion,onSpritesReady,heading,bank,Number.isFinite(storyTime)?storyTime:0,theme==='junction');ctx.restore();
  }
  if(!state.ended)for(const s of state.shots)drawShot(ctx,s,shotAge,reducedMotion);
  if(!reducedMotion)for(const pop of state.combatPops||[]){const life=Math.max(0,pop.life-shotAge);if(life>0){ctx.save();ctx.globalAlpha=Math.min(1,life/.35);burst(ctx,pop.x,pop.y,(pop.boss?25:10)+(1-life/.65)*(pop.boss?20:10),pop.boss?'#f5ae70':'#ebd69e');
    // V3 deaths: embers fly outward in the emblem's metals and a smoke wisp
    // rises off the wreck - a kill reads as a strike, not a popped bubble.
    const age=1-life/.65;
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+pop.x*.013,d=age*(pop.boss?34:17),ex=pop.x+Math.cos(a)*d,ey=pop.y+Math.sin(a)*d-age*age*10;
      ctx.beginPath();ctx.arc(ex,ey,2.2*(1-age)+.6,0,Math.PI*2);ctx.fillStyle=i%2?'#f0d68a':'#d9dde1';ctx.fill();}
    oval(ctx,pop.x+Math.sin(age*7)*2,pop.y-8-age*16,5+age*7,4+age*5,`rgba(78,84,78,${(.34*(1-age)).toFixed(3)})`,null);
    ctx.restore();}}
  if(!reducedMotion)for(const effect of effects)drawAbility(ctx,effect);
  ctx.restore();
}

function burst(ctx,x,y,r,fill){
  const points=[];for(let i=0;i<16;i++){const a=Math.PI*i/8,d=i%2?r*.52:r;points.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}
  // V3: the emblem language - every flash carries the polished silver rim.
  shape(ctx,points,fill,'#d9dde1',3.5);
  ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.strokeStyle=ink;ctx.lineWidth=1.25;ctx.stroke();
}
// The gold field star - the emblem's heart - as an FX flash shape.
function star(ctx,x,y,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,d=i%2?r*.45:r;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
function drawShot(ctx,s,age,reduced){
  const life=(Number.isFinite(s.life)?s.life:.12)-age;if(life<=0)return;
  const duration=s.duration||.12,progress=1-Math.max(0,Math.min(1,life/duration));
  // V3: the tracer casts its own thin shadow on the ground, and the impact
  // ring is polished silver - the shot reads as a struck spark, not a noodle.
  ctx.save();if(s.kind===3)ctx.setLineDash([9,5]);
  ctx.globalAlpha=.22;line(ctx,[[s.x+2,s.y+3],[s.tx+2,s.ty+3]],'#0c120e',s.kind===1?6:4);ctx.globalAlpha=1;
  line(ctx,[[s.x,s.y],[s.tx,s.ty]],ink,s.kind===1?6:4);line(ctx,[[s.x,s.y],[s.tx,s.ty]],s.color||'#ffec9e',s.kind===1?4:2);ctx.restore();
  if(reduced)return;
  const scale=s.kind===1?1.35:s.kind===3?.75:1;
  // V3: the first beat of a shot is a muzzle flash at the barrel - a gold
  // spark in a silver ring, right where the tracer leaves the tower.
  if(progress<.22){star(ctx,s.x,s.y,(5+9*(1-progress/.22))*scale);ctx.fillStyle='#f0d68a';ctx.fill();ctx.strokeStyle='#d9dde1';ctx.lineWidth=1.6;ctx.stroke();}
  if(progress<.65)burst(ctx,s.x,s.y,(7+(1-progress)*4)*scale,'#ffe39b');
  if(progress>.12){ctx.save();ctx.globalAlpha=Math.max(.2,1-progress*.65);ctx.beginPath();ctx.arc(s.tx,s.ty,(5+progress*9)*scale,0,Math.PI*2);ctx.strokeStyle=s.kind===1?'#f0aa72':'#d9dde1';ctx.lineWidth=2;ctx.stroke();ctx.restore();burst(ctx,s.tx,s.ty,(5+progress*8)*scale,s.kind===1?'#e89964':'#f6d787');}
}
function drawAbility(ctx,e){
  const t=e.progress,fade=Math.max(0,1-t);ctx.save();ctx.globalAlpha=fade;
  if(e.kind==='bunkerHit'){
    // V3: iron smoke rising off the hit, the flash in emblem colours.
    ctx.beginPath();ctx.arc(e.x,e.y,10+30*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=3.5-2.5*t;ctx.stroke();
    burst(ctx,e.x,e.y,16+16*t,'#f0b47a');
    for(let i=0;i<3;i++){const rise=t*34,side=(i-1)*11;oval(ctx,e.x+side+Math.sin(t*6+i)*3,e.y-14-rise-i*7,7+4*t,5+3*t,`rgba(78,84,78,${(.4*fade).toFixed(3)})`,null);}
    ctx.fillStyle='#fff1ca';ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.font='bold 16px Georgia';ctx.textAlign='center';ctx.strokeText(e.label||tr('BUNKER HIT'),e.x,e.y-45-15*t);ctx.fillText(e.label||tr('BUNKER HIT'),e.x,e.y-45-15*t);
  }else if(e.kind==='combo'){
    // V3: the combo wears the emblem - a silver ring with the gold star at
    // its heart, the pair's own tint glowing underneath.
    const palette={'War Hero':'#f6b273','War Machine':'#f39467','War Economy':'#e9d37b','Bunker Guardian':'#b0dc9c','Ghost Operative':'#8acdda'};
    const tint=palette[e.label]||'#88e3d3',cy=e.y-20;
    const g=radial(ctx,e.x,cy,2,e.x,cy,20+16*t);
    if(g){g.addColorStop(0,tint);g.addColorStop(1,'rgba(120,140,120,0)');ctx.fillStyle=g;}else ctx.fillStyle=tint;
    ctx.beginPath();ctx.arc(e.x,cy,20+16*t,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.x,cy,15+14*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=2.5-1.5*t;ctx.stroke();
    star(ctx,e.x,cy,8+5*t);ctx.fillStyle='#f0d68a';ctx.fill();ctx.strokeStyle='#1d3028';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(e.label?e.label.split(' + ').map(name=>tr(name)).join(' + '):tr('COMBO!'),e.x,e.y-43-12*t);
  }else if(e.kind==='assault'){
    // V3: the airstrike wears the emblem - a silver shock ring, warm light on
    // the ground, then the gold field star burning out where it landed.
    const targets=e.targets.length?e.targets:[{x:e.x,y:e.y}];
    for(const p of targets){
      ctx.beginPath();ctx.arc(p.x,p.y,6+26*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=3-2*t;ctx.stroke();
      const g=radial(ctx,p.x,p.y,1,p.x,p.y,14+22*t);
      if(g){g.addColorStop(0,'rgba(255,236,170,.85)');g.addColorStop(1,'rgba(255,190,110,0)');ctx.fillStyle=g;}else ctx.fillStyle='#f9dc91';
      ctx.beginPath();ctx.arc(p.x,p.y,14+22*t,0,Math.PI*2);ctx.fill();
      star(ctx,p.x,p.y,9+13*t);ctx.fillStyle='#f0d68a';ctx.fill();ctx.strokeStyle='#d9dde1';ctx.lineWidth=2;ctx.stroke();
    }
  }else if(e.kind==='build'||e.kind==='upgrade'){
    // V3: a stamp in the emblem's metal - silver ring, iron smoke for a new
    // emplacement, the gold star for a level gained.
    ctx.beginPath();ctx.arc(e.x,e.y-12,12+14*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=3-2*t;ctx.stroke();
    if(e.kind==='build'){burst(ctx,e.x,e.y-12,9+8*t,'#b8d69d');for(let i=0;i<2;i++)oval(ctx,e.x+(i?7:-7),e.y-22-t*16,4+2*t,3+2*t,`rgba(78,84,78,${(.35*fade).toFixed(3)})`,null);}
    else{star(ctx,e.x,e.y-12,8+6*t);ctx.fillStyle='#f0d68a';ctx.fill();ctx.strokeStyle='#1d3028';ctx.lineWidth=1.5;ctx.stroke();}
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr(e.kind==='build'?'BUILT':'UPGRADED'),e.x,e.y-38-12*t);
  }else if(e.kind==='engineer'){
    // V3: overdrive as a struck iron plate - double silver ring, hot centre.
    ctx.beginPath();ctx.arc(e.x,e.y-20,10+16*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=3-2*t;ctx.stroke();
    ctx.beginPath();ctx.arc(e.x,e.y-20,16+22*t,0,Math.PI*2);ctx.strokeStyle=`rgba(217,221,225,${(.6*fade).toFixed(3)})`;ctx.lineWidth=2;ctx.stroke();
    const g=radial(ctx,e.x,e.y-20,1,e.x,e.y-20,10+10*t);
    if(g){g.addColorStop(0,'#ffe9a8');g.addColorStop(1,'rgba(238,212,117,0)');ctx.fillStyle=g;}else ctx.fillStyle='#eed475';
    ctx.beginPath();ctx.arc(e.x,e.y-20,10+10*t,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('OVERDRIVE',e.x,e.y-42-12*t);
  }else if(e.kind==='logistics'){
    // V3: the supply drop as a stamped iron crate.
    const y=e.y-24-12*t;
    oval(ctx,e.x,y+11,13,4,'rgba(12,18,14,.28)',null);
    shape(ctx,[[e.x-12,y-9],[e.x+12,y-9],[e.x+12,y+9],[e.x-12,y+9]],'#d7b276','#d9dde1',3);
    line(ctx,[[e.x-11,y],[e.x+11,y]],ink,2);line(ctx,[[e.x,y-9],[e.x,y+9]],ink,2);
    star(ctx,e.x,y,5);ctx.fillStyle='#f0d68a';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=ink;ctx.font='bold 14px Georgia';ctx.textAlign='center';ctx.fillText('+30',e.x,y-15);
  }else if(e.kind==='medic'){
    // V3: the medic ring in emblem metal around the field dressing.
    ctx.beginPath();ctx.arc(e.x,e.y,26+14*t,0,Math.PI*2);ctx.strokeStyle=`rgba(217,221,225,${(.75*fade).toFixed(3)})`;ctx.lineWidth=2.5;ctx.stroke();
    const g=radial(ctx,e.x,e.y,4,e.x,e.y,22+12*t);
    if(g){g.addColorStop(0,'rgba(206,230,166,.85)');g.addColorStop(1,'rgba(206,230,166,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,22+12*t,0,Math.PI*2);ctx.fill();}
    oval(ctx,e.x,e.y,22+12*t,22+12*t,'#cee6a6',null,0);shape(ctx,[[e.x-4,e.y-12],[e.x+4,e.y-12],[e.x+4,e.y-4],[e.x+12,e.y-4],[e.x+12,e.y+4],[e.x+4,e.y+4],[e.x+4,e.y+12],[e.x-4,e.y+12],[e.x-4,e.y+4],[e.x-12,e.y+4],[e.x-12,e.y-4],[e.x-4,e.y-4]],'#f1e6c4');
  }else if(e.kind==='recon'){
    // V3: suppression ripples out in polished silver, the inner tick in gold.
    for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(e.x,e.y,16+36*t+i*15,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=3.5-i;ctx.stroke();}
    ctx.beginPath();ctx.arc(e.x,e.y,10+36*t,0,Math.PI*2);ctx.setLineDash([6,5]);ctx.strokeStyle='#f0d68a';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('SUPPRESSION'),e.x,e.y-35-12*t);
  }
  ctx.restore();
}
