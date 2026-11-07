// Legacy fixed maps plus seeded routes shared by host, guest and solo simulation.
// All maps end at the same bunker and use ten stable tower pad IDs.
export const MAPS=Object.freeze({
  road:{id:'road',name:'The Last Road',theme:'road',path:[{x:0,y:130},{x:210,y:130},{x:210,y:320},{x:470,y:320},{x:470,y:150},{x:710,y:150},{x:710,y:400},{x:900,y:400}],pads:[{x:105,y:210},{x:285,y:210},{x:135,y:360},{x:350,y:390},{x:390,y:220},{x:550,y:225},{x:620,y:75},{x:790,y:230},{x:625,y:395},{x:810,y:335}]},
  forest:{id:'forest',name:'Pinewood Crossing',theme:'forest',path:[{x:0,y:130},{x:150,y:130},{x:150,y:350},{x:350,y:350},{x:350,y:160},{x:560,y:160},{x:560,y:370},{x:745,y:370},{x:745,y:400},{x:900,y:400}],pads:[{x:75,y:210},{x:225,y:220},{x:115,y:440},{x:260,y:425},{x:270,y:285},{x:430,y:240},{x:465,y:75},{x:640,y:240},{x:650,y:440},{x:810,y:320}]},
  outpost:{id:'outpost',name:'Broken Outpost',theme:'outpost',path:[{x:0,y:130},{x:300,y:130},{x:300,y:285},{x:110,y:285},{x:110,y:420},{x:470,y:420},{x:470,y:210},{x:680,y:210},{x:680,y:400},{x:900,y:400}],pads:[{x:105,y:55},{x:205,y:200},{x:375,y:185},{x:225,y:350},{x:45,y:350},{x:340,y:345},{x:410,y:300},{x:560,y:130},{x:580,y:295},{x:780,y:320}]}
});
// Not selected by the live game until the four-player UI and rules are ready.
export const EXPERIMENTAL_MAPS=Object.freeze({
  'four-front':{id:'four-front',name:'Twin Roads Frontier',theme:'road',fourPlayer:true,width:1440,height:720,bunker:{x:1380,y:360},
    path:[{x:0,y:140},{x:260,y:140},{x:260,y:260},{x:560,y:260},{x:560,y:120},{x:880,y:120},{x:880,y:270},{x:1150,y:270},{x:1150,y:360},{x:1380,y:360}],
    paths:[[{x:0,y:140},{x:260,y:140},{x:260,y:260},{x:560,y:260},{x:560,y:120},{x:880,y:120},{x:880,y:270},{x:1150,y:270},{x:1150,y:360},{x:1380,y:360}],
           [{x:0,y:580},{x:260,y:580},{x:260,y:460},{x:560,y:460},{x:560,y:600},{x:880,y:600},{x:880,y:450},{x:1150,y:450},{x:1150,y:360},{x:1380,y:360}]],
    pads:[{x:110,y:210},{x:330,y:185},{x:440,y:315},{x:640,y:190},{x:760,y:195},{x:960,y:190},{x:1050,y:300},{x:1250,y:285},
          {x:110,y:510},{x:330,y:535},{x:440,y:405},{x:640,y:530},{x:760,y:525},{x:960,y:530},{x:1050,y:420},{x:1250,y:435}]}
});
export const DEFAULT_MAP='road';
export function isMapId(id){return typeof id==='string'&&(Object.hasOwn(MAPS,id)||Object.hasOwn(EXPERIMENTAL_MAPS,id)||seeded(id));}
export function getMap(id){
  if(typeof id==='string'&&Object.hasOwn(MAPS,id))return MAPS[id];
  if(typeof id==='string'&&Object.hasOwn(EXPERIMENTAL_MAPS,id))return EXPERIMENTAL_MAPS[id];
  if(!seeded(id))return MAPS[DEFAULT_MAP];
  if(!generated.has(id)){if(generated.size>=MAX_CACHED)generated.delete(generated.keys().next().value);generated.set(id,id.startsWith('g2-')?buildRoadside(id):id.startsWith('g3-')?buildGridMap(id):buildGenerated(id));}
  return generated.get(id);
}

// A compact seed is sent in the match snapshot, so every client reconstructs
// identical roads and pads without sending bulky or untrusted geometry.
const generated=new Map(),MAX_CACHED=128;
const seeded=id=>/^(?:gen|g2)-[0-9a-f]{8}$|^g3-[0-9a-f]{9}$/.test(id);
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
// --- The sector campaign (g3): grid-walk maps -------------------------------
// Endless and multiplayer draw their battlefield from a seed: the road is
// walked cell by cell from the left edge to the bunker, so it can meander,
// hook and squeeze between buildings instead of always running the same four
// switchbacks. The id carries the sector (g3-<sector><seed>, one hex digit
// plus eight), so a snapshot alone reconstructs the identical field on every
// client - and a retreat leads to a bigger one. Legacy gen/g2 ids keep their
// generators untouched.
export const SECTOR_SPECS=Object.freeze([
  {width:960, height:540, pads:10, roads:1, ruins:6, gates:2},
  {width:1320,height:720, pads:14, roads:1, ruins:9, gates:3},
  {width:1680,height:960, pads:18, roads:2, ruins:12,gates:3},
  {width:2040,height:1140,pads:22, roads:2, ruins:15,gates:4},
]);
export function sectorOf(mapId){return /^g3-[0-9a-f]{9}$/.test(mapId||'')?Math.min(4,parseInt(mapId[3],16)+1):0;}
function buildGridMap(id){
  const sector=Math.min(4,parseInt(id[3],16)+1),spec=SECTOR_SPECS[sector-1],random=rng(parseInt(id.slice(4),16));
  const cell=60,cols=spec.width/cell,rows=spec.height/cell;
  const themes=[['scrub','Scorched Scrubland'],['forest','Dense Temperate Forest'],['urban','Urban Ruin & Industrial Complex'],['arctic','Arctic Tundra & Frozen Lake'],['marsh','Marshland & Delta Mudflats']],[theme,name]=themes[Math.floor(random()*themes.length)];
  const bunkerRow=1+Math.floor(random()*(rows-2)),bunker={x:spec.width-cell/2,y:bunkerRow*cell+cell/2};
  const key=(c,r)=>r*cols+c,centre=(c,r)=>({x:c*cell+cell/2,y:r*cell+cell/2});
  const roadDistance=(p,paths)=>paths.reduce((min,path)=>Math.min(min,...path.slice(1).map((b,i)=>pointDistance(p,path[i],b))),Infinity);
  // Weighted depth-first walk: east is preferred, vertical meanders are welcome,
  // visited cells are refused and dead ends backtrack, so a road can never cross
  // itself and always reaches the bunker cell. The road also never hugs itself:
  // a candidate cell is refused when any orthogonal neighbour is already road
  // (the cell being left aside). Parallel stretches keep one clear cell between
  // them - two 65-unit roads 60 units apart would visually melt into one.
  function walk(startRow,blocked,minCells,shared=null){
    const visited=new Set(blocked),stack=[[0,startRow]];visited.add(key(0,startRow));
    let c=0,r=startRow,guard=cols*rows*3;
    while(guard-->0){
      if(c===cols-1&&r===bunkerRow)return stack.length>=minCells?stack.map(([cc,rr])=>key(cc,rr)):null;
      const options=[];
      const offer=(dc,dr,weight)=>{const nc=c+dc,nr=r+dr;
        if(nc<0||nc>=cols||nr<1||nr>=rows-1)return;
        // The bunker cell and the shared funnel are always enterable: both roads
        // are allowed to merge into one final approach, exactly like the
        // four-player frontier funnels two lanes into one gate.
        if((nc===cols-1&&nr===bunkerRow)||(shared&&shared.has(key(nc,nr)))){options.push([nc,nr,8]);return;}
        if(visited.has(key(nc,nr)))return;
        for(const [ac,ad] of [[1,0],[-1,0],[0,1],[0,-1]]){const ax=nc+ac,ay=nr+ad;if(ax===c&&ay===r)continue;if(ax>=0&&ax<cols&&ay>=0&&ay<rows&&visited.has(key(ax,ay)))return;}
        options.push([nc,nr,weight]);};
      offer(1,0,5);
      if(bunkerRow>=r)offer(0,1,2+Math.min(3,bunkerRow-r));else offer(0,-1,2+Math.min(3,r-bunkerRow));
      if(bunkerRow>=r)offer(0,-1,1);else offer(0,1,1);
      offer(-1,0,.4);
      if(!options.length){stack.pop();if(!stack.length)return null;[c,r]=stack[stack.length-1];continue;}
      let total=0;for(const o of options)total+=o[2];let pick=random()*total,chosen=options[options.length-1];
      for(const o of options){pick-=o[2];if(pick<=0){chosen=o;break;}}
      c=chosen[0];r=chosen[1];visited.add(key(c,r));stack.push([c,r]);
    }
    return null;
  }
  const polyline=cells=>{
    const pts=cells.map(k=>centre(k%cols,Math.floor(k/cols))),out=[{x:0,y:pts[0].y}];
    for(let i=1;i<pts.length-1;i++){
      const a=pts[i-1],b=pts[i],c=pts[i+1];
      if((a.x===b.x&&b.x===c.x)||(a.y===b.y&&b.y===c.y))continue;
      out.push(b);
    }
    out.push({x:bunker.x,y:bunker.y});
    return out;
  };
  // Build pads from the cells beside the road: close enough to matter, never on
  // the tar, spread over the whole route instead of bunching at the entry.
  function padsFor(paths){
    const roadCells=new Set();
    for(const path of paths)for(let c=0;c<cols;c++)for(let r=1;r<rows-1;r++){const p=centre(c,r);if(roadDistance(p,[path])<cell*.9)roadCells.add(key(c,r));}
    const candidates=[];
    for(let c=0;c<cols;c++)for(let r=1;r<rows-1;r++){
      if(roadCells.has(key(c,r)))continue;
      const p=centre(c,r),d=roadDistance(p,paths);
      if(d>=62&&d<=150&&Math.hypot(p.x-bunker.x,p.y-bunker.y)>=78)candidates.push(p);
    }
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    const quotas=sector===1?[3,3,4]:sector===2?[4,5,5]:sector===3?[6,6,6]:[7,7,8],pads=[],zone=x=>Math.min(2,Math.floor(x*3/spec.width));
    for(let z=0;z<3;z++)for(const p of candidates)if(zone(p.x)===z&&quotas[z]>0&&pads.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=68)){pads.push(p);quotas[z]--;}
    for(const p of candidates){if(pads.length>=spec.pads)break;if(pads.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=68))pads.push(p);}
    return pads.length>=spec.pads?pads.slice(0,spec.pads):null;
  }
  // Ruins and buildings: a few gates the road squeezes through, plus sheds and
  // broken walls along the way. Purely decoration - they never cover a pad.
  function decoFor(paths,pads){
    const deco=[],kinds={forest:['cabin','barn','stand'],arctic:['cabin','ruin'],marsh:['stilt','ruin'],scrub:['shed','ruin','wall'],urban:['ruin','wall','factory']}[theme]||['ruin'];
    const entry=paths[0][0],segments=[];
    for(const path of paths)for(let i=1;i<path.length;i++)if(Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y)>=150)segments.push([path[i-1],path[i]]);
    for(let i=segments.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[segments[i],segments[j]]=[segments[j],segments[i]];}
    let gates=0;
    for(const [a,b] of segments){
      if(gates>=spec.gates)break;
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      if(Math.hypot(mx-bunker.x,my-bunker.y)<150||Math.hypot(mx-entry.x,my-entry.y)<130)continue;
      if(pads.some(p=>Math.hypot(p.x-mx,p.y-my)<115)||deco.some(d=>Math.hypot(d.x-mx,d.y-my)<130))continue;
      const length=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length;
      // A gate only stands when BOTH flanks stay inside the field.
      if([-1,1].some(side=>mx+side*nx*52<24||mx+side*nx*52>spec.width-24||my+side*ny*52<24||my+side*ny*52>spec.height-24))continue;
      for(const side of [-1,1])deco.push({kind:'gate',x:mx+side*nx*52,y:my+side*ny*52,rot:a.x===b.x?1:0,shade:random()});
      gates++;
    }
    const spots=[];
    for(let c=0;c<cols;c++)for(let r=1;r<rows-1;r++)spots.push(centre(c,r));
    for(let i=spots.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[spots[i],spots[j]]=[spots[j],spots[i]];}
    let ruins=0;
    for(const p of spots){
      if(ruins>=spec.ruins)break;
      const d=roadDistance(p,paths);
      if(d<58||d>170)continue;
      if(Math.hypot(p.x-bunker.x,p.y-bunker.y)<120||Math.hypot(p.x-entry.x,p.y-entry.y)<110)continue;
      if(pads.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<80)||deco.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<85))continue;
      deco.push({kind:kinds[Math.floor(random()*kinds.length)],x:p.x,y:p.y,rot:random()<.5?0:1,shade:random()});
      ruins++;
    }
    return deco;
  }
  for(let attempt=0;attempt<80;attempt++){
    const first=walk(1+Math.floor(random()*(rows-2)),[],Math.round(cols*1.5));
    if(!first)continue;
    let roadKeys=[first];
    if(spec.roads>1){
      // A second road keeps one clear cell to the first at all times, so the two
      // never touch or merge; only the bunker cell is shared.
      const blocked=new Set();
      for(const k of first){const c=k%cols,r=Math.floor(k/cols);for(const [dc,dr] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])blocked.add(key(c+dc,r+dr));}
      blocked.delete(key(cols-1,bunkerRow));
      let second=null;
      // The funnel: the last stretch of the bunker approach belongs to both
      // roads, so the second one can always finish no matter how the first
      // wedged itself against the right edge.
      const shared=new Set();
      for(let c=cols-4;c<cols;c++)shared.add(key(c,bunkerRow));
      const startRows=[];
      for(let r=1;r<rows-1;r++)startRows.push(r);
      for(let i=startRows.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[startRows[i],startRows[j]]=[startRows[j],startRows[i]];}
      for(const startRow of startRows){
        if(blocked.has(key(0,startRow)))continue;
        second=walk(startRow,blocked,Math.round(cols*1.05),shared);
        if(second)break;
      }
      // A rare seed keeps one road instead of none: the battlefield is still
      // valid, only quieter. Determinism is untouched - the id decides. The
      // first sixty attempts insist on the twin road before settling.
      if(!second&&attempt<60)continue;
      roadKeys=[first];
      if(second)roadKeys.push(second);
    }
    const paths=roadKeys.map(polyline),pads=padsFor(paths);
    if(!pads)continue;
    return {id,name,theme,path:paths[0],...(paths.length>1?{paths}:{}),pads,deco:decoFor(paths,pads),width:spec.width,height:spec.height,bunker,sector};
  }
  throw new Error('Could not generate a sector battlefield');
}
export function createRandomMapId(previous,random=globalThis.crypto,sector=1){
  let value;if(random&&typeof random.getRandomValues==='function'){const bytes=new Uint32Array(1);random.getRandomValues(bytes);value=bytes[0];}else value=Math.floor(Math.random()*4294967296)>>>0;
  const tag=(Math.max(1,Math.min(4,Math.round(sector)))-1).toString(16);
  let id=`g3-${tag}${value.toString(16).padStart(8,'0')}`;
  if(id===previous)id=`g3-${tag}${((value+1)>>>0).toString(16).padStart(8,'0')}`;
  return id;
}
