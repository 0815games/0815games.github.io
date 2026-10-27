
const textures = new Map();
const glows = new Map();
const openings = new WeakMap();
const vignettes = new WeakMap();

const reduced = typeof matchMedia === 'function'
 ? matchMedia('(prefers-reduced-motion: reduce)') : null;
const coarse = typeof matchMedia === 'function'
 ? matchMedia('(pointer: coarse)') : null;

export const WORLD_THEMES = Object.freeze({
 katakomben: Object.freeze({
  floor:'#343b40', stone:'#5b6165', face:'#303941',
  trim:'#929387', light:'#efbb76', detail:'#8b9279', air:'#c9b997'
 }),
 pilzwald: Object.freeze({
  floor:'#293e35', stone:'#526357', face:'#283e36',
  trim:'#96a67c', light:'#9eddac', detail:'#a2cc94', air:'#add599'
 }),
 frostgruft: Object.freeze({
  floor:'#304858', stone:'#718996', face:'#354b60',
  trim:'#badce0', light:'#b4e6f5', detail:'#c5eaf0', air:'#daeff5'
 }),
 feuerschrein: Object.freeze({
  floor:'#493531', stone:'#73574a', face:'#3c2d31',
  trim:'#b09272', light:'#ffaf70', detail:'#d48b5b', air:'#edb17e'
 }),
 schattenarena: Object.freeze({
  floor:'#3a344c', stone:'#6d617f', face:'#352e49',
  trim:'#aea0c7', light:'#c8a3ee', detail:'#b8a1dc', air:'#ccb2e8'
 })
});

export function tileNoise(x, y, seed=0) {
 let v = (Math.imul(x+1,374761393)
  ^ Math.imul(y+1,668265263) ^ (seed|0)) >>> 0;
 v = Math.imul(v ^ (v>>>13),1274126177) >>> 0;
 return (v ^ (v>>>16)) >>> 0;
}

export function lightStrength(time, seed, reduce=false) {
 return reduce ? .82
  : .82 + Math.sin(time*4+seed)*.06 + Math.sin(time*7+seed)*.02;
}

export function knownTile(w, x, y) {
 return Number.isInteger(x) && Number.isInteger(y)
  && !!w.discovered?.[y]?.[x] && w.tiles?.[y]?.[x] !== undefined;
}

export function themeName(name) {
 return Object.hasOwn(WORLD_THEMES,name) ? name : 'katakomben';
}

export function worldFrameInterval() {
 return reduced?.matches ? 1000/15 : 1000/30;
}

function rect(c,x,y,w,h,color) {
 c.fillStyle=color;
 c.fillRect(x,y,w,h);
}

function line(c,points,color,width=1) {
 c.beginPath();
 points.forEach(([x,y],i)=>i ? c.lineTo(x,y) : c.moveTo(x,y));
 c.strokeStyle=color;
 c.lineWidth=width;
 c.stroke();
}

function ellipse(c,x,y,rx,ry,color) {
 c.beginPath();
 c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
 c.fillStyle=color;
 c.fill();
}

function canvas(width,height) {
 const cv=document.createElement('canvas');
 cv.width=width;
 cv.height=height;
 return cv;
}

export function paintThemeIdentity(c,theme,type,variant) {
 if(type===2)return;
 const p=WORLD_THEMES[themeName(theme)];
 c.save();

 if(theme==='pilzwald') {
  if(type===1 && variant%3===0) {
   line(c,[[5,3],[9,9],[7,17],[12,28]],'#a7a08188');
   line(c,[[9,9],[18,8],[23,14]],'#a7a08166');
  }
  if(type===0 && variant%3===1) {
   rect(c,7,22,2,5,'#899878');
   rect(c,20,17,2,8,'#899878');
   ellipse(c,8,22,4,2,'#a7cf9a');
   ellipse(c,21,17,4,2,'#8fbaa0');
  }
 } else if(theme==='frostgruft') {
  if(type===1) {
   line(c,[[4,4],[7,14],[10,4]],'#bfe9ed88');
   line(c,[[22,4],[24,18],[28,4]],'#bfe9ed77');
  } else if(variant%3===0) {
   line(c,[[5,26],[14,16],[25,8]],'#b3e3ef88');
   line(c,[[14,16],[11,7]],'#b3e3ef66');
   line(c,[[14,16],[25,22]],'#b3e3ef66');
  }
 } else if(theme==='feuerschrein' && variant%3===1) {
  line(c,[[7,26],[15,20],[13,12],[24,5]],'#d6885b66',2);
  line(c,[[8,26],[16,20],[14,12],[25,5]],'#ffbe7555');
 } else if(theme==='schattenarena' && variant%3===2) {
  line(c,[[16,7],[23,16],[16,25],[9,16],[16,7]],p.detail+'77');
  line(c,[[12,16],[20,16]],p.detail+'66');
 } else if(theme==='katakomben' && variant===5) {
  rect(c,9,7,14,19,'#ffffff0a');
  line(c,[[9,7],[23,7],[23,26],[9,26],[9,7]],'#050c1466');
  line(c,[[16,11],[16,21]],'#bbb49a55');
  line(c,[[12,15],[20,15]],'#bbb49a55');
 }

 c.restore();
}

export function paintDungeonDepth(c,theme,type,variant,palette) {
 if(type===2)return;
 c.save();

 if(type===1) {
  rect(c,0,27,32,5,'#03081166');
  rect(c,1,1,30,2,'#d5dfce33');
  rect(c,1,3,2,25,'#ffffff0e');
  rect(c,29,3,2,25,'#00000038');
  rect(c,2,24,28,1,'#03081166');
 } else {
  rect(c,1,1,30,1,'#00000045');
  rect(c,1,2,1,29,'#00000045');
  rect(c,2,29,27,1,'#d5e1d020');
  if(variant===3 || variant===7) {
   line(c,[[22,3],[18,10],[19,16],[12,22],[13,28]],'#070c1488');
  }
 }

 paintThemeIdentity(c,theme,type,variant);
 c.restore();
}

function texture(theme,type,variant) {
 type=type===1 ? 1 : type===2 ? 2 : 0;
 const key=theme+':'+type+':'+variant;
 if(textures.has(key))return textures.get(key);

 const cv=canvas(32,32);
 const c=cv.getContext('2d');
 const p=WORLD_THEMES[theme];

 rect(c,0,0,32,32,'#11191e');

 if(type===1) {
  rect(c,1,1,30,28,p.stone);
  rect(c,2,17,28,13,p.face);
  rect(c,2,2,28,2,p.trim+'88');
  line(c,[[0,11],[32,11]],'#10171c66');
  line(c,[[0,21],[32,21]],'#0a101766');
  line(c,[[8+variant,1],[8+variant,11]],'#0a101766');
  line(c,[[22-variant,12],[22-variant,21]],'#0a101766');
  rect(c,1,16,30,1,'#d3d9c52b');
  rect(c,2,18,28,2,'#070d1822');
 } else if(type===2) {
  rect(c,0,0,32,32,p.floor);
  rect(c,7,5,18,24,p.face);
  rect(c,8,5,16,2,p.trim);
  rect(c,10,9,12,16,'#121b24');
  line(c,[[16,11],[20,17],[16,23],[12,17],[16,11]],p.light+'b3');
 } else {
  rect(c,1,1,30,30,p.floor);
  const cut=11+variant;
  line(c,[[2,16],[30,16]],'#0b131b77');
  line(c,[[cut,2],[cut,15]],'#0b131b77');
  line(c,[[30-cut,17],[30-cut,29]],'#0b131b77');
  line(c,[[2,17],[29,17]],'#e2e5cb12');
  rect(c,2,2,28,1,'#e3e8d411');

  if(variant===6) {
   ellipse(c,20,24,8,3,'#08151b66');
   rect(c,16,23,8,1,'#d7e3df22');
  }
  if(variant===0 || variant===4) {
   ellipse(c,9,25,6,2,'#080e1655');
   rect(c,6,22,4,3,p.trim+'77');
   rect(c,12,25,3,2,p.stone);
  }
 }

 for(let i=0;i<12;i++) {
  const n=tileNoise(i,variant,type);
  rect(c,2+n%27,3+(n>>>7)%26,1+(n>>>14)%3,1,
   i%2 ? '#ffffff09' : '#00000016');
 }

 paintDungeonDepth(c,theme,type,variant);
 textures.set(key,cv);
 return cv;
}

function glow(color) {
 if(glows.has(color))return glows.get(color);
 const cv=canvas(128,128);
 const c=cv.getContext('2d');
 const g=c.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,color+'59');
 g.addColorStop(.28,color+'2b');
 g.addColorStop(1,color+'00');
 c.fillStyle=g;
 c.fillRect(0,0,128,128);
 glows.set(color,cv);
 return cv;
}

function bounds(r,w) {
 const t=r.tile;
 const cols=w.cols||w.tiles[0].length;
 const rows=w.rows||w.tiles.length;
 return {
  left:Math.max(0,Math.floor(r.camera.x/t)),
  top:Math.max(0,Math.floor(r.camera.y/t)),
  right:Math.min(cols,Math.ceil((r.camera.x+r.cv.width)/t)),
  bottom:Math.min(rows,Math.ceil((r.camera.y+r.cv.height)/t))
 };
}

function inView(r,x,y,padding=32) {
 const t=r.tile;
 return x*t+t>=r.camera.x-padding
  && y*t+t>=r.camera.y-padding
  && x*t<=r.camera.x+r.cv.width+padding
  && y*t<=r.camera.y+r.cv.height+padding;
}

function clipDiscovered(c,w,b,t) {
 c.beginPath();
 for(let y=b.top;y<b.bottom;y++) {
  for(let x=b.left;x<b.right;x++) {
   if(knownTile(w,x,y))c.rect(x*t,y*t,t,t);
  }
 }
 c.clip();
}

function torch(c,x,y,p,time,n,reduce) {
 c.save();
 c.translate(x,y);
 rect(c,13,13,6,13,'#1b1717');
 rect(c,12,20,8,3,p.trim);
 rect(c,15,15,3,8,'#8f6b49');
 const flicker=reduce ? 0 : Math.sin(time*7+n)*1.3;
 c.beginPath();
 c.moveTo(12,17);
 c.quadraticCurveTo(9,12,16+flicker,5);
 c.quadraticCurveTo(15,11,20,15);
 c.quadraticCurveTo(20,20,12,17);
 c.fillStyle=p.light;
 c.fill();
 ellipse(c,16,15,2,4,'#fff0c9');
 c.restore();
}

function shadow(c,x,y,width=23) {
 ellipse(c,x,y,width/2,3,'#00000060');
 ellipse(c,x,y,width/3,2,'#00000044');
}

function chest(c,ch,t,time,reduce) {
 c.save();
 c.translate(ch.x*t,ch.y*t);
 c.scale(t/32,t/32);
 shadow(c,16,28,27);
 rect(c,5,13,23,14,'#231911');
 rect(c,7,14,19,11,'#865b35');
 rect(c,8,15,17,2,'#b4894c');
 line(c,[[7,20],[26,20]],'#4c311f');
 rect(c,8,14,2,11,'#c2a16b');
 rect(c,22,14,2,11,'#c2a16b');

 let entry=openings.get(ch);
 if(!entry) {
  entry={seenClosed:!ch.open,at:null};
  openings.set(ch,entry);
 }
 if(!ch.open) {
  entry.seenClosed=true;
  entry.at=null;
 } else if(entry.seenClosed && entry.at===null) {
  entry.at=time;
 }

 const amount=ch.open
  ? (reduce||entry.at===null ? 1
   : Math.min(1,Math.max(0,(time-entry.at)/.35)))
  : 0;

 if(ch.open) {
  rect(c,8,13,18,3,'#15100b');
  rect(c,11,14,11,2,'#ffe8ab');
  c.globalAlpha=.4;
  const g=c.createLinearGradient(0,3,0,17);
  g.addColorStop(0,'#ffe4a000');
  g.addColorStop(1,'#ffe4a080');
  c.fillStyle=g;
  c.fillRect(8,3,18,12);
  c.globalAlpha=1;
 }

 c.save();
 c.translate(6,13);
 c.rotate(-amount*.85);
 rect(c,0,-7,21,7,'#865b35');
 rect(c,1,-7,19,2,'#b8884b');
 rect(c,2,-7,2,7,'#ceb17b');
 rect(c,16,-7,2,7,'#ceb17b');
 line(c,[[0,0],[21,0]],'#d8b46f');
 c.restore();

 if(!ch.open) {
  rect(c,14,13,5,6,'#d5b36f');
  rect(c,16,15,1,3,'#271e11');
 }
 c.restore();
}

function stairs(c,s,t,time,p,reduce) {
 c.save();
 c.translate(s.x*t,s.y*t);
 c.scale(t/32,t/32);
 rect(c,3,4,26,25,p.trim);
 rect(c,5,6,22,23,'#080e17');

 for(let i=0;i<5;i++) {
  const yy=8+i*4;
  const inset=6+i*.8;
  rect(c,inset,yy,32-inset*2,3,i%2?p.face:p.floor);
  rect(c,inset,yy,32-inset*2,1,p.trim+'aa');
 }

 line(c,[[4,5],[4,29],[28,29],[28,5]],p.trim,2);
 c.globalAlpha=reduce ? .65 : .55+Math.sin(time*2)*.15;
 c.strokeStyle=p.light;
 c.lineWidth=.8;
 c.beginPath();
 c.arc(16,17,13,0,Math.PI*2);
 c.stroke();

 for(let i=0;i<6;i++) {
  const a=i*Math.PI/3;
  c.beginPath();
  c.moveTo(16+Math.cos(a)*11,17+Math.sin(a)*11);
  c.lineTo(16+Math.cos(a)*14,17+Math.sin(a)*14);
  c.stroke();
 }
 c.restore();
}

function drawVignette(r) {
 let e=vignettes.get(r);
 const w=r.cv.width,h=r.cv.height;

 if(!e||e.w!==w||e.h!==h) {
  const cv=canvas(w,h);
  const c=cv.getContext('2d');
  const g=c.createRadialGradient(
   w/2,h/2,Math.min(w,h)*.2,
   w/2,h/2,Math.hypot(w,h)*.55
  );
  g.addColorStop(0,'#02091200');
  g.addColorStop(.55,'#02091200');
  g.addColorStop(1,'#02091240');
  c.fillStyle=g;
  c.fillRect(0,0,w,h);
  e={w,h,cv};
  vignettes.set(r,e);
 }
 r.ctx.drawImage(e.cv,0,0);
}

function drawEffects(r) {
 const c=r.ctx;

 for(const wave of r.waves||[]) {
  if(wave.a<=0)continue;
  c.globalAlpha=Math.min(1,wave.a);
  c.strokeStyle=wave.color;
  c.lineWidth=3;
  c.beginPath();
  c.arc(wave.x,wave.y,wave.r,0,Math.PI*2);
  c.stroke();
 }

 for(const item of r.particles||[]) {
  if(item.a<=0)continue;
  c.globalAlpha=Math.min(1,item.a);
  const size=item.size||3;
  rect(c,item.x-size/2,item.y-size/2,size,size,item.c);
 }

 for(const item of r.texts||[]) {
  if(item.a<=0)continue;
  c.globalAlpha=Math.min(1,item.a);
  c.fillStyle=item.c;
  c.font=`bold ${item.size||12}px Georgia,serif`;
  c.textAlign='center';
  c.shadowColor='#000';
  c.shadowBlur=5;
  c.fillText(item.txt,item.x,item.y);
  c.shadowBlur=0;
 }

 c.globalAlpha=1;
 c.textAlign='left';
}

export function drawDungeonWorld(r,w,player,drawHero) {
 if(!w?.tiles?.length||r.cv.width<=0||r.cv.height<=0)return;

 const c=r.ctx;
 const t=r.tile;
 const theme=themeName(w.theme);
 const p=WORLD_THEMES[theme];
 const reduce=reduced?.matches===true;
 const time=reduce ? 0 : (r._visualTime??performance.now()/1000);

 r.updateCamera(
  w.cols||w.tiles[0].length,
  w.rows||w.tiles.length
 );

 const b=bounds(r,w);
 const sources=[];

 c.save();
 try {
  c.setTransform(1,0,0,1,0,0);
  c.globalAlpha=1;
  c.globalCompositeOperation='source-over';
  c.shadowBlur=0;
  c.lineWidth=1;
  c.textAlign='left';
  c.imageSmoothingEnabled=false;

  rect(c,0,0,r.cv.width,r.cv.height,'#060a11');

  c.save();
  try {
   c.translate(-r.camera.x,-r.camera.y);

   for(let y=b.top;y<b.bottom;y++) {
    for(let x=b.left;x<b.right;x++) {
     if(!knownTile(w,x,y))continue;

     const type=w.tiles[y][x];
     const n=tileNoise(x,y,w.seed);
     const sx=x*t,sy=y*t;

     c.drawImage(texture(theme,type,n%8),sx,sy,t,t);

     if(type===0) {
      if(knownTile(w,x,y-1)&&w.tiles[y-1][x]===1) {
       rect(c,sx,sy,t,4,'#0309124d');
      }
      if(knownTile(w,x-1,y)&&w.tiles[y][x-1]===1) {
       rect(c,sx,sy,3,t,'#03091238');
      }
     }

     const facesFloor=type===1
      &&knownTile(w,x,y+1)&&w.tiles[y+1][x]===0;

     if(facesFloor&&n%7===0&&sources.length<8) {
      torch(c,sx,sy,p,time,n,reduce);
      sources.push({x:sx+t/2,y:sy+t*.4,n});
     }

     if(type===2&&sources.length<8) {
      sources.push({x:sx+t/2,y:sy+t/2,n});
     }
    }
   }

   if(typeof r.drawWallDecor==='function')r.drawWallDecor();

   c.save();
   try {
    clipDiscovered(c,w,b,t);

    for(const source of sources) {
     c.globalAlpha=lightStrength(time,source.n,reduce)*.7;
     c.drawImage(glow(p.light),source.x-56,source.y-56,112,112);
    }
    c.globalAlpha=1;

    const s=w.stairs;
    if(s&&knownTile(w,s.x,s.y)&&inView(r,s.x,s.y)) {
     c.globalAlpha=.55;
     c.drawImage(glow(p.light),s.x*t-30,s.y*t-30,92,92);
     c.globalAlpha=1;
     stairs(c,s,t,time,p,reduce);
    }

    if(knownTile(w,player.x,player.y)) {
     c.globalAlpha=.45;
     c.drawImage(
      glow('#ffe0aa'),player.x*t-35,player.y*t-35,102,102
     );
     c.globalAlpha=1;
    }

    const units=[];

    for(const ch of w.chests||[]) {
     if(knownTile(w,ch.x,ch.y)&&inView(r,ch.x,ch.y)) {
      units.push({y:ch.y,kind:'chest',value:ch});
     }
    }

    for(const m of w.monsters||[]) {
     if(knownTile(w,m.x,m.y)&&inView(r,m.x,m.y)) {
      units.push({y:m.y,kind:'monster',value:m});
     }
    }

    if(knownTile(w,player.x,player.y)) {
     units.push({y:player.y,kind:'hero',value:player});
    }

    units.sort((a,b)=>a.y-b.y);

    for(const unit of units) {
     const u=unit.value;
     const x=u.x*t,y=u.y*t;

     if(unit.kind==='chest') {
      chest(c,u,t,time,reduce);
     } else if(unit.kind==='monster') {
      shadow(c,x+t/2,y+t-3,22);
      c.save();
      try {
       if(!reduce&&(u.shape==='bat'||u.shape==='wraith')) {
        c.translate(0,
         Math.sin(time*3+tileNoise(u.x,u.y,w.seed))*1.5
        );
       }
       r.drawMonster(c,u,x,y);
      } finally {
       c.restore();
      }
     } else {
      drawHero(c,u,x,y,t);
     }
    }

    if(!reduce) {
     const count=coarse?.matches?8:16;
     for(let i=0;i<count;i++) {
      const n=tileNoise(i,91,w.seed);
      const x=r.camera.x+n%r.cv.width;
      const speed=theme==='feuerschrein'?12
       :theme==='frostgruft'?-6:3;
      const y=r.camera.y+
       (((n>>>8)-time*speed)%r.cv.height+r.cv.height)%r.cv.height;
      const tx=Math.floor(x/t),ty=Math.floor(y/t);

      if(!knownTile(w,tx,ty)||w.tiles[ty][tx]===1)continue;

      c.globalAlpha=.15+.1*Math.sin(time+i);
      rect(c,x,y,theme==='frostgruft'?1.5:1,1.5,p.air);
     }
     c.globalAlpha=1;
    }

    drawEffects(r);
   } finally {
    c.restore();
   }
  } finally {
   c.restore();
  }

  drawVignette(r);

  if(r.flashEffect) {
   const f=r.flashEffect;
   const progress=Math.min(1,f.elapsed/Math.max(.001,f.duration));
   c.globalAlpha=Math.max(
    0,Math.min(1,f.strength*(1-progress))
   );
   rect(c,0,0,r.cv.width,r.cv.height,f.color);
  }
 } finally {
  c.restore();
 }
}
