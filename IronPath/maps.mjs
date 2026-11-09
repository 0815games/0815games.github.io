// Legacy fixed maps plus seeded routes shared by host, guest and solo simulation.
// All maps end at the same bunker and use ten stable tower pad IDs.
export const MAPS=Object.freeze({
  road:{id:'road',name:'The Last Road',theme:'road',path:[{x:0,y:130},{x:210,y:130},{x:210,y:320},{x:470,y:320},{x:470,y:150},{x:710,y:150},{x:710,y:400},{x:900,y:400}],pads:[{x:105,y:210},{x:285,y:210},{x:135,y:360},{x:350,y:390},{x:390,y:220},{x:550,y:225},{x:620,y:75},{x:790,y:230},{x:625,y:395},{x:810,y:335}]},
  forest:{id:'forest',name:'Pinewood Crossing',theme:'forest',path:[{x:0,y:130},{x:150,y:130},{x:150,y:350},{x:350,y:350},{x:350,y:160},{x:560,y:160},{x:560,y:370},{x:745,y:370},{x:745,y:400},{x:900,y:400}],pads:[{x:75,y:210},{x:225,y:220},{x:115,y:440},{x:260,y:425},{x:270,y:285},{x:430,y:240},{x:465,y:75},{x:640,y:240},{x:650,y:440},{x:810,y:320}]},
  outpost:{id:'outpost',name:'Broken Outpost',theme:'outpost',path:[{x:0,y:130},{x:300,y:130},{x:300,y:285},{x:110,y:285},{x:110,y:420},{x:470,y:420},{x:470,y:210},{x:680,y:210},{x:680,y:400},{x:900,y:400}],pads:[{x:105,y:55},{x:205,y:200},{x:375,y:185},{x:225,y:350},{x:45,y:350},{x:340,y:345},{x:410,y:300},{x:560,y:130},{x:580,y:295},{x:780,y:320}]}
});
// The oversized squad fields. The four-player frontier is selected by the
// live game for 3p/4p co-op and 2v2 (formerly EXPERIMENTAL_MAPS).
const FOUR_FRONT_ROADS=[[{x:0,y:140},{x:260,y:140},{x:260,y:260},{x:560,y:260},{x:560,y:120},{x:880,y:120},{x:880,y:270},{x:1150,y:270},{x:1150,y:360},{x:1380,y:360}],
                       [{x:0,y:580},{x:260,y:580},{x:260,y:460},{x:560,y:460},{x:560,y:600},{x:880,y:600},{x:880,y:450},{x:1150,y:450},{x:1150,y:360},{x:1380,y:360}]];
const FOUR_FRONT_PADS=[{x:110,y:210},{x:330,y:185},{x:440,y:315},{x:640,y:190},{x:760,y:195},{x:960,y:190},{x:1050,y:300},{x:1250,y:285},
                       {x:110,y:510},{x:330,y:535},{x:440,y:405},{x:640,y:530},{x:760,y:525},{x:960,y:530},{x:1050,y:420},{x:1250,y:435}];
export const SQUAD_MAPS=Object.freeze({
  'four-front':{id:'four-front',name:'Twin Roads Frontier',theme:'road',fourPlayer:true,width:1440,height:720,bunker:{x:1380,y:360},
    path:FOUR_FRONT_ROADS[0],paths:FOUR_FRONT_ROADS,pads:FOUR_FRONT_PADS,
    // The same roadside torches as the generated fields, derived the same
    // way, so the classic frontier carries the V2 roadside look too.
    torches:torchesFor(FOUR_FRONT_ROADS,FOUR_FRONT_PADS,[],{x:1380,y:360},1440,720)}
});
export const DEFAULT_MAP='road';
export function isMapId(id){return typeof id==='string'&&(Object.hasOwn(MAPS,id)||Object.hasOwn(SQUAD_MAPS,id)||seeded(id));}
export function getMap(id){
  if(typeof id==='string'&&Object.hasOwn(MAPS,id))return MAPS[id];
  if(typeof id==='string'&&Object.hasOwn(SQUAD_MAPS,id))return SQUAD_MAPS[id];
  if(!seeded(id))return MAPS[DEFAULT_MAP];
  if(!generated.has(id)){if(generated.size>=MAX_CACHED)generated.delete(generated.keys().next().value);generated.set(id,id.startsWith('g2-')?buildRoadside(id):id.startsWith('g3-')?buildGridMap(id):buildGenerated(id));}
  return generated.get(id);
}

// A compact seed is sent in the match snapshot, so every client reconstructs
// identical roads and pads without sending bulky or untrusted geometry.
const generated=new Map(),MAX_CACHED=128;
const seeded=id=>/^(?:gen|g2)-[0-9a-f]{8}$|^g3-[0-9a-f]{9}$/.test(id);
function rng(seed){let x=seed>>>0;return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function pointDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy,t=len2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
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
// Act I story fields (Talwald). The ids are fixed campaign mapIds; everything
// below the look is generated from the seed exactly like a free-play field.
const STORY_FIELDS=Object.freeze({
  'g3-0b3f01a77':{theme:'talwald',name:'The Relay Line'},
  'g3-0c5d2e19b':{theme:'urban',name:'The Ash Market'},
  'g3-0d7a4b35c':{theme:'marsh',name:'The Field Hospital'},
  'g3-0e9c6f21d':{theme:'arctic',name:'The Ice Road'},
  'g3-0f1a8b44e':{theme:'scrub',name:'The Night Heath'},
  'g3-002000003':{theme:'talwald',name:'The Main Relay'},
  // Act II · THE FLOOD - the Marsch & Eis region: cut-off village, hospital
  // corridor, night marsh, white passage and the frozen rail junction.
  'g3-000000005':{theme:'marsh',name:'The Cut-Off Village'},
  'g3-000000007':{theme:'urban',name:'The Hospital Corridor'},
  'g3-000000001':{theme:'marsh',name:'The Night Count'},
  'g3-000000008':{theme:'arctic',name:'The White Passage'},
  'g3-000000009':{theme:'arctic',name:'The Frozen Junction'}
});
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
// How many soldiers a field can carry: the squad frontier by flag, generated
// retreat sectors from the second onward (they have the pads and the room),
// everything else - including generated sector one - stays a duo field.
export function mapPlayerCap(mapId){return getMap(mapId).fourPlayer||sectorOf(mapId)>=2?4:2;}
// Which marked patch (if any) covers a field position.
export function zoneAt(map,x,y){for(const zone of map?.zones||[])if(Math.hypot(x-zone.x,y-zone.y)<=zone.r)return zone;return null;}
// Roadside torches - the reported idea: "Fackeln als Straßen Rand in guten
// Abständen". Warm light at regular intervals makes the enemy route readable
// at a glance. This is a PURE derivation from the finished geometry (no rng
// calls at all), so no existing field changes by a single coordinate.
function torchesFor(paths,pads,deco,bunker,width,height){
  const torches=[],road=p=>paths.reduce((min,path)=>Math.min(min,...path.slice(1).map((b,i)=>pointDistance(p,path[i],b))),Infinity);
  // A rare seed crowds every strict torch spot (hairpin returns, buildings,
  // pads, the bunker). The relaxed second pass only runs when the strict one
  // placed nothing, so no existing field changes by a single torch: it keeps
  // the reported promise that no map ever goes dark. Still pure derivation
  // from the finished geometry - no rng, no map change.
  const pass=relaxed=>{
    torches.length=0;
    const m=relaxed?{road:26,deco:22,gate:44,pad:30,bunker:95}:{road:30,deco:34,gate:56,pad:40,bunker:115};
    const free=p=>p.x>=16&&p.x<=width-16&&p.y>=16&&p.y<=height-16
      &&Math.hypot(p.x-bunker.x,p.y-bunker.y)>=m.bunker
      &&road(p)>=m.road
      // Buildings crowd the roadside band the torches live in - a slim post
      // only needs a small gap, gate wings keep their distance.
      &&(!deco||deco.every(d=>Math.hypot(p.x-d.x,p.y-d.y)>=(d.kind==='gate'?m.gate:m.deco)))
      &&pads.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=m.pad)
      &&torches.every(t=>Math.hypot(p.x-t.x,p.y-t.y)>=100);
    paths.forEach((path,ri)=>{
      // Roads start on opposite rims so the first torch of each does too.
      let side=ri%2?1:-1,arc=140,cum=0;
      for(let i=1;i<path.length;i++){
        const a=path[i-1],b=path[i],len=Math.hypot(b.x-a.x,b.y-a.y);
        if(!len){cum+=0;continue;}
        const ux=(b.x-a.x)/len,uy=(b.y-a.y)/len,px=-uy,py=ux;
        // Positions are measured over the WHOLE road, not per segment: the
        // grid walk leaves short staircase steps and those would never see a
        // torch at all. 140 in clears the entry marker; 165 apart after that.
        while(arc<=cum+len){
          const s=arc-cum;
          // Reported: "Wo Fackeln? die sollten die Wege entlang stehen, nicht
          // nur vereinzelt manchmal." A spot used to vanish when its ONE
          // candidate position was taken - a winding marsh road with a
          // neighbour lane, a pad or a building on that side went dark there.
          // Every spot now walks a small ladder of candidates: the alternating
          // rim, the other rim, then both rims a little further out. Each
          // candidate still passes the same `free` distances, so no torch ever
          // stands in the tar, on a pad or against a wall - a spot is only
          // dropped when EVERY rung violates a safety distance.
          const cands=[];
          for(const off of [46,38,52,60])cands.push({x:a.x+ux*s+px*off*side,y:a.y+uy*s+py*off*side},{x:a.x+ux*s-px*off*side,y:a.y+uy*s-py*off*side});
          for(const p of cands){if(free(p)){torches.push(p);break;}}
          side=-side;arc+=165;
        }
        cum+=len;
      }
    });
  };
  pass(false);
  if(!torches.length)pass(true);
  return torches;
}
function buildGridMap(id){
  const sector=Math.min(4,parseInt(id[3],16)+1),spec=SECTOR_SPECS[sector-1],random=rng(parseInt(id.slice(4),16));
  const cell=60,cols=spec.width/cell,rows=spec.height/cell;
  const themes=[['scrub','Scorched Scrubland'],['forest','Dense Temperate Forest'],['urban','Urban Ruin & Industrial Complex'],['arctic','Arctic Tundra & Frozen Lake'],['marsh','Marshland & Delta Mudflats']];
  const picked=themes[Math.floor(random()*themes.length)];
  // Campaign-only story fields: the Act I missions play on named battlefields.
  // The seed still decides every coordinate (road, pads, bunker, zones); only
  // the look - theme and name - is authored, so the story never touches the
  // generator and free play keeps its five rotating themes.
  const story=STORY_FIELDS[id];
  const theme=story?story.theme:picked[0],name=story?story.name:picked[1];
  // Reported: "Anfang irgendwo am Rand der Karte halt" - and the bunker is no
  // longer glued to the right edge either. The end cell keeps two cells of
  // distance to every edge so the gate and the bunker always sit fully on the
  // field; the start is any cell on any of the four borders.
  const bc=2+Math.floor(random()*(cols-5)),br=2+Math.floor(random()*(rows-5)),bunker={x:bc*cell+cell/2,y:br*cell+cell/2};
  const key=(c,r)=>r*cols+c,centre=(c,r)=>({x:c*cell+cell/2,y:r*cell+cell/2});
  const pickStart=edge=>edge==='W'?[0,1+Math.floor(random()*(rows-2))]:edge==='E'?[cols-1,1+Math.floor(random()*(rows-2))]:edge==='N'?[1+Math.floor(random()*(cols-2)),0]:[1+Math.floor(random()*(cols-2)),rows-1];
  const edgeCells=()=>{
    const cells=[];
    for(let r=1;r<rows-1;r++){cells.push([0,r,'W'],[cols-1,r,'E']);}
    for(let c=1;c<cols-1;c++){cells.push([c,0,'N'],[c,rows-1,'S']);}
    for(let i=cells.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
    return cells;
  };
  const roadDistance=(p,paths)=>paths.reduce((min,path)=>Math.min(min,...path.slice(1).map((b,i)=>pointDistance(p,path[i],b))),Infinity);
  // Weighted depth-first walk from the border start to the bunker cell: steps
  // that close in on the bunker are preferred, away-steps still happen - that
  // is where the meanders come from. Visited cells are refused and dead ends
  // backtrack, so a road can never cross itself. The road also never hugs
  // itself: a candidate cell is refused when any orthogonal neighbour is
  // already road. Parallel stretches keep one clear cell between them - two
  // 65-unit roads 60 units apart would visually melt into one.
  function walk(startCell,blocked,minCells,shared=null){
    const visited=new Set(blocked),onPath=new Set(),stack=[startCell];
    visited.add(key(startCell[0],startCell[1]));onPath.add(key(startCell[0],startCell[1]));
    // Warm-up: the first 40-70% of the road wanders direction-free - only
    // afterwards does the walk lock onto the bunker. That is where the
    // meanders come from, no matter where start and bunker sit.
    let c=startCell[0],r=startCell[1],steps=0,wander=Math.round(minCells*(.4+random()*.3)),guard=cols*rows*8;
    while(guard-->0){
      if(c===bc&&r===br)return stack.length>=minCells?stack.map(([cc,rr])=>key(cc,rr)):null;
      const options=[];
      const offer=(dc,dr)=>{const nc=c+dc,nr=r+dr;
        if(nc<0||nc>=cols||nr<1||nr>=rows-1)return;
        // Own road first: a shared cell the walk itself already occupies is
        // closed, otherwise the funnel would let the road double back onto
        // itself and leave zero-length segments in the polyline.
        if(onPath.has(key(nc,nr)))return;
        // The bunker cell and the shared funnel are always enterable: both roads
        // are allowed to merge into one final approach, exactly like the
        // four-player frontier funnels two lanes into one gate.
        if((nc===bc&&nr===br)||(shared&&shared.has(key(nc,nr)))){options.push([nc,nr,9]);return;}
        if(visited.has(key(nc,nr)))return;
        // Anti-hug counts only the ROAD - cells a backtrack abandoned are not
        // road, so a dead end must not poison the neighbourhood forever.
        for(const [ac,ad] of [[1,0],[-1,0],[0,1],[0,-1]]){const ax=nc+ac,ay=nr+ad;if(ax===c&&ay===r)continue;if(ax>=0&&ax<cols&&ay>=0&&ay<rows&&onPath.has(key(ax,ay)))return;}
        const toward=(dc*(bc-c)+dr*(br-r))/Math.max(1,Math.hypot(bc-c,br-r));
        options.push([nc,nr,steps<wander?1:.4+2.6*Math.max(0,toward)]);};
      offer(1,0);offer(-1,0);offer(0,1);offer(0,-1);
      if(!options.length){stack.pop();onPath.delete(key(c,r));if(!stack.length)return null;[c,r]=stack[stack.length-1];continue;}
      let total=0;for(const o of options)total+=o[2];let pick=random()*total,chosen=options[options.length-1];
      for(const o of options){pick-=o[2];if(pick<=0){chosen=o;break;}}
      c=chosen[0];r=chosen[1];steps++;visited.add(key(c,r));onPath.add(key(c,r));stack.push([c,r]);
    }
    return null;
  }
  const polyline=(cells,edge)=>{
    const pts=cells.map(k=>centre(k%cols,Math.floor(k/cols))),first=pts[0];
    // The road begins OUTSIDE the field: enemies pour in through the border,
    // and the entry gate has ground to stand on.
    const out=[edge==='W'?{x:-54,y:first.y}:edge==='E'?{x:spec.width+54,y:first.y}:edge==='N'?{x:first.x,y:-54}:{x:first.x,y:spec.height+54}];
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
    // Candidates are sampled on a fine grid, not on the walk cells: the cell
    // centres alone skip half of the roadside ring, which is exactly the band
    // the pads are supposed to come from. The spread zones run along the ROAD,
    // not along the map: with a random start and a random bunker the route no
    // longer crosses every map third, but it always crosses its own.
    const marks=paths.map(path=>{let l=0;const m=[0];for(let i=1;i<path.length;i++){l+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);m.push(l);}return m;});
    const total=marks.reduce((sum,m)=>sum+m[m.length-1],0)||1;
    const candidates=[];
    for(let x=25;x<=spec.width-25;x+=12)for(let y=25;y<=spec.height-25;y+=12){
      if(Math.hypot(x-bunker.x,y-bunker.y)<78)continue;
      let best=Infinity,pos=0;
      for(let ri=0;ri<paths.length;ri++)for(let i=1;i<paths[ri].length;i++){
        const a=paths[ri][i-1],b=paths[ri][i],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
        const t=len2?Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/len2)):0;
        const d=Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
        if(d<best){best=d;pos=marks[ri][i-1]+t*Math.sqrt(len2)+(ri>0?marks[ri-1][marks[ri-1].length-1]:0);}
      }
      if(best>=62&&best<=150)candidates.push({x,y,d:best,pos});
    }
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    // Reported: "Tower Platzierung voll für den Arsch. Muss schon AN der
    // Straße sein." Pads are picked nearest-first: the roadside ring (62-92
    // from the road centre, i.e. touching the tar) fills the quotas, the
    // wider rings only exist so a rare seed can still place every pad.
    const ranked=[...candidates.filter(c=>c.d<=92),...candidates.filter(c=>c.d>92&&c.d<=120),...candidates.filter(c=>c.d>120)];
    const quotas=sector===1?[3,3,4]:sector===2?[4,5,5]:sector===3?[6,6,6]:[7,7,8],pads=[],zone=c=>Math.min(2,Math.floor(c.pos/total*3));
    for(let z=0;z<3;z++)for(const p of ranked)if(zone(p)===z&&quotas[z]>0&&pads.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=68)){pads.push(p);quotas[z]--;}
    for(const p of ranked){if(pads.length>=spec.pads)break;if(pads.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=68))pads.push(p);}
    // Upgrade pass: a pad that had to fall back outside the ring is swapped
    // for an unused ring candidate whenever one still fits the plate spacing -
    // at most one pad per field may sit outside the roadside ring at all.
    for(const [i,p] of pads.entries()){
      if(p.d<=92)continue;
      const better=ranked.find(q=>q.d<=92&&q!==p&&!pads.includes(q)&&pads.every((o,j)=>j===i||Math.hypot(q.x-o.x,q.y-o.y)>=68));
      if(better)pads[i]=better;
    }
    return pads.length>=spec.pads?pads.map(({x,y})=>({x,y})):null;
  }
  // Ruins and buildings: a few gates the road squeezes through, plus sheds and
  // broken walls along the way. Purely decoration - they never cover a pad.
  function decoFor(paths,pads){
    const deco=[],kinds={forest:['cabin','barn','stand'],arctic:['cabin','ruin'],marsh:['stilt','ruin'],scrub:['shed','ruin','wall'],urban:['ruin','wall','factory'],talwald:['mast','forester','cross','wreck']}[theme]||['ruin'];
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
      // A gate only stands when BOTH flanks stay inside the field - and clear
      // of every road segment: a wing that lands on the neighbouring lane of
      // a funnel or a hairpin would stand in the middle of the tar.
      const wings=[-1,1].map(side=>({x:mx+side*nx*52,y:my+side*ny*52}));
      if(wings.some(w=>w.x<24||w.x>spec.width-24||w.y<24||w.y>spec.height-24||roadDistance(w,paths)<46))continue;
      for(const w of wings)deco.push({kind:'gate',x:w.x,y:w.y,rot:a.x===b.x?1:0,shade:random()});
      gates++;
    }
    const spots=[];
    for(let c=0;c<cols;c++)for(let r=1;r<rows-1;r++)spots.push(centre(c,r));
    for(let i=spots.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[spots[i],spots[j]]=[spots[j],spots[i]];}
    let ruins=0;
    for(const p of spots){
      if(ruins>=spec.ruins)break;
      const d=roadDistance(p,paths);
      if(d<58||d>190)continue;
      // Pads own the roadside ring (62-92); buildings keep a working gap to a pad plate (66) rather than the old 80, which the tighter pads starved.
      if(Math.hypot(p.x-bunker.x,p.y-bunker.y)<120||Math.hypot(p.x-entry.x,p.y-entry.y)<110)continue;
      if(pads.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<66)||deco.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<85))continue;
      deco.push({kind:kinds[Math.floor(random()*kinds.length)],x:p.x,y:p.y,rot:random()<.5?0:1,shade:random()});
      ruins++;
    }
    return deco;
  }
  for(let attempt=0;attempt<80;attempt++){
    const edges=['W','E','N','S'],firstEdge=edges[Math.floor(random()*edges.length)];
    const first=walk(pickStart(firstEdge),[],Math.round(cols*1.3));
    if(!first)continue;
    let roadKeys=[first],roadEdges=[firstEdge];
    if(spec.roads>1){
      // A second road keeps one clear cell to the first at all times, so the two
      // never touch or merge; only the bunker approach is shared.
      const blocked=new Set();
      for(const k of first){const c=k%cols,r=Math.floor(k/cols);for(const [dc,dr] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])blocked.add(key(c+dc,r+dr));}
      // The funnel: the two cells around the bunker belong to both roads, so
      // the second one can always finish no matter where the first wedged
      // itself. Every border cell is tried, in random order.
      const shared=new Set();
      for(let dc=-2;dc<=2;dc++)for(let dr=-2;dr<=2;dr++)shared.add(key(bc+dc,br+dr));
      let second=null,secondEdge=null;
      for(const [ec,er,e] of edgeCells()){
        if(blocked.has(key(ec,er)))continue;
        const road=walk([ec,er],blocked,Math.round(cols*1.05),shared);
        if(road){second=road;secondEdge=e;break;}
      }
      // A rare seed keeps one road instead of none: the battlefield is still
      // valid, only quieter. Determinism is untouched - the id decides. The
      // first sixty attempts insist on the twin road before settling.
      if(!second&&attempt<60)continue;
      if(second){roadKeys.push(second);roadEdges.push(secondEdge);}
    }
    const paths=roadKeys.map((cells,i)=>polyline(cells,roadEdges[i])),pads=padsFor(paths);
    if(!pads)continue;
    // Mixed ground: a few marked patches the road runs through. Each carries
  // one of the five terrain rules (thin ice, deep bog, rubble, ambush trail,
  // dust), so one battlefield can hold several - that is the point.
  const zoneKinds=['ice','bog','rubble','ambush','dust'];
  for(let i=zoneKinds.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[zoneKinds[i],zoneKinds[j]]=[zoneKinds[j],zoneKinds[i]];}
  const zoneCount=[1,2,2,3][sector-1],zones=[],roadPoints=[];
  for(const road of paths)for(let i=1;i<road.length-1;i++)roadPoints.push(road[i]);
  for(let i=roadPoints.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[roadPoints[i],roadPoints[j]]=[roadPoints[j],roadPoints[i]];}
  for(const point of roadPoints){
    if(zones.length>=zoneCount)break;
    if(point.x<70||point.x>spec.width-70||point.y<70||point.y>spec.height-70)continue;
    if(Math.hypot(point.x-bunker.x,point.y-bunker.y)<170||Math.hypot(point.x-paths[0][0].x,point.y-paths[0][0].y)<150)continue;
    if(zones.some(z=>Math.hypot(z.x-point.x,z.y-point.y)<260))continue;
    zones.push({id:zones.length,kind:zoneKinds[zones.length],x:point.x,y:point.y,r:78+8*Math.floor(random()*3)});
  }
  const deco=decoFor(paths,pads);
  return {id,name,theme,path:paths[0],...(paths.length>1?{paths}:{}),pads,deco,zones,width:spec.width,height:spec.height,bunker,sector,torches:torchesFor(paths,pads,deco,bunker,spec.width,spec.height)};
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
