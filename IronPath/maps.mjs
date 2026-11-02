// Legacy fixed maps plus seeded routes shared by host, guest and solo simulation.
// All maps end at the same bunker and use ten stable tower pad IDs.
export const MAPS=Object.freeze({
  road:{id:'road',name:'The Last Road',theme:'road',path:[{x:0,y:130},{x:210,y:130},{x:210,y:320},{x:470,y:320},{x:470,y:150},{x:710,y:150},{x:710,y:400},{x:900,y:400}],pads:[{x:105,y:210},{x:285,y:210},{x:135,y:360},{x:350,y:390},{x:390,y:220},{x:550,y:225},{x:620,y:75},{x:790,y:230},{x:625,y:395},{x:810,y:335}]},
  forest:{id:'forest',name:'Pinewood Crossing',theme:'forest',path:[{x:0,y:130},{x:150,y:130},{x:150,y:350},{x:350,y:350},{x:350,y:160},{x:560,y:160},{x:560,y:370},{x:745,y:370},{x:745,y:400},{x:900,y:400}],pads:[{x:75,y:210},{x:225,y:220},{x:115,y:440},{x:260,y:425},{x:270,y:285},{x:430,y:240},{x:465,y:75},{x:640,y:240},{x:650,y:440},{x:810,y:320}]},
  outpost:{id:'outpost',name:'Broken Outpost',theme:'outpost',path:[{x:0,y:130},{x:300,y:130},{x:300,y:285},{x:110,y:285},{x:110,y:420},{x:470,y:420},{x:470,y:210},{x:680,y:210},{x:680,y:400},{x:900,y:400}],pads:[{x:105,y:55},{x:205,y:200},{x:375,y:185},{x:225,y:350},{x:45,y:350},{x:340,y:345},{x:410,y:300},{x:560,y:130},{x:580,y:295},{x:780,y:320}]}
});
export const DEFAULT_MAP='road';
export function isMapId(id){return typeof id==='string'&&(Object.hasOwn(MAPS,id)||seeded(id));}
export function getMap(id){
  if(typeof id==='string'&&Object.hasOwn(MAPS,id))return MAPS[id];
  if(!seeded(id))return MAPS[DEFAULT_MAP];
  if(!generated.has(id)){if(generated.size>=MAX_CACHED)generated.delete(generated.keys().next().value);generated.set(id,id.startsWith('g2-')?buildRoadside(id):buildGenerated(id));}
  return generated.get(id);
}

// A compact seed is sent in the match snapshot, so every client reconstructs
// identical roads and pads without sending bulky or untrusted geometry.
const generated=new Map(),MAX_CACHED=128;
const seeded=id=>/^(?:gen|g2)-[0-9a-f]{8}$/.test(id);
function rng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function pointDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function buildGenerated(id){
  const random=rng(parseInt(id.slice(4),16)),pick=(min,max,step=10)=>min+step*Math.floor(random()*((max-min)/step+1));
  const x1=pick(160,240),x2=pick(390,500),x3=pick(650,750),pattern=Math.floor(random()*3);
  const y1=pattern===0?pick(280,360):pattern===1?pick(200,240):pick(320,380);
  const y2=pattern===0?pick(120,190):pattern===1?pick(310,360):pick(220,270);
  const path=[{x:0,y:130},{x:x1,y:130},{x:x1,y:y1},{x:x2,y:y1},{x:x2,y:y2},{x:x3,y:y2},{x:x3,y:400},{x:900,y:400}];
  const candidates=[];
  for(let x=55;x<=880;x+=55)for(let y=55;y<=495;y+=55){
    const point={x,y},distance=Math.min(...path.slice(1).map((b,i)=>pointDistance(point,path[i],b)));
    if(distance>=62&&distance<=140&&Math.hypot(x-900,y-400)>=70)candidates.push(point);
  }
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  // Spread defenses across the whole route rather than leaving the entry bare.
  const pads=[],quotas=[3,3,4];
  for(let zone=0;zone<3;zone++)for(const p of candidates){
    const group=p.x<300?0:p.x<600?1:2;
    if(group===zone&&quotas[zone]&&pads.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=68)){pads.push(p);quotas[zone]--;}
  }
  if(pads.length!==10)throw new Error('Could not generate enough build pads');
  const theme=['road','forest','outpost'][Math.floor(random()*3)];
  return {id,name:theme==='forest'?'Pinewood Patrol':theme==='outpost'?'Ruined Front':'The Last Road',theme,path,pads};
}
// Versioned seeds preserve the geometry of already-running legacy operations.
function buildRoadside(id){
  const random=rng(parseInt(id.slice(3),16));
  const pick=(min,max)=>min+10*Math.floor(random()*((max-min)/10+1));
  const themes=[['scrub','Scorched Scrubland'],['forest','Dense Temperate Forest'],['urban','Urban Ruin & Industrial Complex'],['arctic','Arctic Tundra & Frozen Lake'],['marsh','Marshland & Delta Mudflats']];
  const theme=themes[Math.floor(random()*themes.length)];
  // Monotonic eastward switchbacks avoid road crossings and preserve the bunker approach.
  for(let attempt=0;attempt<50;attempt++){
    const xs=[pick(130,180),pick(300,360),pick(490,550),pick(680,740)];
    const ys=random()<.5?[pick(260,320),pick(100,150),pick(260,320)]:[pick(200,250),pick(340,380),pick(200,250)];
    const path=[{x:0,y:130},{x:xs[0],y:130},{x:xs[0],y:ys[0]},{x:xs[1],y:ys[0]},{x:xs[1],y:ys[1]},{x:xs[2],y:ys[1]},{x:xs[2],y:ys[2]},{x:xs[3],y:ys[2]},{x:xs[3],y:400},{x:900,y:400}];
    const candidates=[];
    for(let x=35;x<=925;x+=20)for(let y=35;y<=505;y+=20){
      const p={x,y},distance=Math.min(...path.slice(1).map((b,i)=>pointDistance(p,path[i],b)));
      if(distance>=62&&distance<=82&&Math.hypot(x-900,y-400)>=75)candidates.push(p);
    }
    for(let retry=0;retry<8;retry++){
      for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
      const pads=[],quotas=[3,3,4];
      for(let zone=0;zone<3;zone++)for(const p of candidates){
        const group=p.x<300?0:p.x<600?1:2;
        if(group===zone&&quotas[zone]&&pads.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=68)){pads.push(p);quotas[zone]--;}
      }
      if(pads.length===10)return {id,name:theme[1],theme:theme[0],path,pads};
    }
  }
  throw new Error('Could not generate a roadside battlefield');
}
export function createRandomMapId(previous,random=globalThis.crypto){
  let value;if(random&&typeof random.getRandomValues==='function'){const bytes=new Uint32Array(1);random.getRandomValues(bytes);value=bytes[0];}else value=Math.floor(Math.random()*4294967296)>>>0;
  let id=`g2-${value.toString(16).padStart(8,'0')}`;
  if(id===previous)id=`g2-${((value+1)>>>0).toString(16).padStart(8,'0')}`;
  return id;
}
