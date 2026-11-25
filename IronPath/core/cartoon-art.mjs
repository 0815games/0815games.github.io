import {translateText as tr,getLanguage} from '../language.mjs?v=20261124-aim9';
import {towerDisplay} from './progression.mjs?v=20261105-prestige1';
import {specializationRank} from './tower-specialization.mjs?v=20261124-aim9';
import {drawStoryTerrain,drawStoryAtmosphere,drawStoryObjective,prepareStoryArt} from './story-map-art.mjs?v=20261124-aim9';
import {ENEMY_INTEL,SOLDIER_MAX_HP} from './combat.mjs?v=20261124-aim9';
import {bossPhase} from './boss-mechanics.mjs?v=20261031-finale1';
import {shotTrace,shotsToDraw} from './shot-tracers.mjs?v=20261117-shots1';
import {buildRoadPath} from './road-geometry.mjs?v=20261124-aim9';
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
// The colour of the ground under a theme. Exported: the opening title paints a
// picture of the map with the very same colours the field will use seconds
// later, and a second copy of this palette is a palette that drifts apart.
export function themeGroundColor(theme='road'){
  return ({forest:'#354b3c',outpost:'#5b5748',urban:'#555a55',scrub:'#6f5445',arctic:'#a8c1c3',marsh:'#41594b',junction:'#3b4340'})[theme]||'#455740';
}
function ground(ctx,theme='road',width=960,height=540){
  ctx.fillStyle=themeGroundColor(theme);ctx.fillRect(0,0,width,height);
  // Restrained map-like contour detail while a texture is unavailable.
  ctx.save();ctx.globalAlpha=.12;
  for(let i=0;i<75;i++){const x=(i*163+47)%width,y=(i*113+31)%height;oval(ctx,x,y,14+(i%4)*6,4+(i%3)*3,i%2?'#182a23':'#d7d3b1',null);}
  ctx.restore();
}
// V2 field art: the road is ground, not a ribbon - a soft earthen berm, a
// compacted surface, wheel ruts that follow the actual bends, and wear
// scattered ALONG the geometry instead of at nine hard-coded spots.
// ---------------------------------------------------------------------------
// Road and rail painting.
//
// Everything below is derived from ONE geometric description of the road
// (`road-geometry.mjs`): a tangent-continuous ribbon of straight runs and
// circular fillet arcs. Whole layers are stroked along that ribbon in a single
// path operation, parallel layers come from its exact offset curve, and
// discrete marks - sleepers, planks, kerb notches, cleats, boot stamps - are
// placed by true arclength and oriented by the true tangent.
//
// That is what makes a bend look like a bend. The previous painter offset and
// decorated every straight segment on its own, which measured on the shipped
// maps as: wheel ruts torn apart by 21.2 px at each corner (255 px of gap on
// `road`, 339 px on `forest`), twin rails cutting each corner by 13.0 px,
// sleepers leaving 13 px and pebbles 38 px across every bend, and a 43 px
// round-join bulge that swallowed `forest`'s 30 px stub completely. None of
// those is a margin problem; all of them are consequences of not having a
// curve to work with.
//
// Cost, measured: building the ribbon plus seven offsets plus three decoration
// walks is 29 us on the longest shipped map, and `drawTerrain` caches the
// painted layer per battlefield - so this is paid once per map, not per frame.
// ---------------------------------------------------------------------------

// One stroke for one whole layer. A single path operation never blends with
// itself, so no bend can grow a seam and no round cap can stack its alpha into
// the dark beads the segment-wise strokes used to leave at every vertex.
function traceRoad(ctx,road,w,style){
  ctx.beginPath();road.emit(ctx);
  ctx.strokeStyle=style;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
// A layer running beside the centreline: ruts, rails, kerb lines, guardrails.
// The offset of a straight run is the parallel line and the offset of an arc is
// the concentric arc, so the two meet exactly at the tangent point and the
// layer cannot tear, kink or gap at a bend whatever distance it keeps.
function traceBeside(ctx,road,d,w,style){
  const off=road.offset(d);
  if(!off.length)return;
  ctx.beginPath();off.emit(ctx);
  ctx.strokeStyle=style;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
}
// Discrete marks at even distance along the road. `visit` gets the position,
// the unit normal (px,py; a positive distance is to the LEFT of travel) and the
// heading, so a sleeper lies across the ROAD on a bend instead of across the
// segment it was computed from, and marks fan through a corner instead of
// stopping short of it. Lateral placement is `centreline + normal*d`, which
// equals the offset curve while d stays inside the bend radius and stays
// well-defined beyond it: a kerb notch on the tight side of a bend simply
// follows the road around, as a real kerb does.
function marksAlong(road,step,inset,outset,visit){
  let k=0;
  road.walk(step,s=>{
    const px=-Math.sin(s.angle),py=Math.cos(s.angle);
    visit(s.x,s.y,px,py,s.angle,++k);
  },{inset,outset});
}
// Deterministic variation, seeded by the mark's index along the road so the
// cached terrain layer paints identically on every load.
const roadHash=n=>{const x=Math.sin(n*127.1+13.7)*43758.5453;return x-Math.floor(x);};

// One road per biome, in the layer vocabulary the artwork settled on: a calm
// halo that clears the noisy ground around it, a comic-ink silhouette at the
// sprite's ink weight, a high-contrast shoulder (kerb, snowbank, embankment or
// ditch), the driving surface, and optional crown, lane lines and texture.
// The surface is 60 px wide, which is the number `road-geometry.mjs` guards
// against: a soldier walking the sharp simulation polygon strays at most
// 14.1 px from the smoothed centreline, so it always stands on asphalt.
const ROAD_THEMES=Object.freeze({
  urban:{kind:'paved',rim:'rgba(8,11,12,.52)',ink:'#121617',shoulder:'#d2d7cd',shoulderHi:'rgba(248,252,244,.60)',gutter:'#161b1c',surface:'#31373a',dash:'rgba(244,222,138,.78)',edgeLine:'rgba(224,228,216,.38)',rut:'rgba(14,16,18,.32)',cleat:'rgba(16,18,20,.30)',boot:'rgba(16,18,20,.28)',textureScale:.20,textureAlpha:.46},
  outpost:{kind:'outpost',rim:'rgba(10,10,8,.50)',ink:'#171511',shoulder:'#cbbda0',shoulderHi:'rgba(244,232,202,.52)',gutter:'#1d1b16',surface:'#3a362e',dash:'rgba(232,206,126,.64)',edgeLine:'rgba(216,204,174,.30)',rut:'rgba(18,15,12,.34)',cleat:'rgba(18,15,12,.34)',boot:'rgba(20,17,13,.32)',textureScale:.20,textureAlpha:.46},
  arctic:{kind:'arctic',rim:'rgba(8,18,26,.48)',ink:'#0f2029',shoulder:'#f5fafc',shoulderHi:'#ffffff',gutter:'#15252f',surface:'#3a4449',crown:'rgba(120,140,150,.28)',rut:'rgba(18,26,32,.55)',cleat:'rgba(14,22,28,.60)',boot:'rgba(18,26,32,.52)',textureScale:.22,textureAlpha:.52},
  marsh:{kind:'marsh',rim:'rgba(6,10,6,.58)',ink:'#0e0b07',shoulder:'#24180e',shoulderHi:'#4d3520',gutter:'#120b07',surface:'#4a321c',crown:'rgba(160,120,75,.28)',planks:true,rut:'rgba(20,14,8,.44)',cleat:'rgba(16,10,6,.52)',boot:'rgba(20,14,8,.46)',textureScale:.20,textureAlpha:.28},
  scrub:{kind:'scrub',rim:'rgba(26,14,6,.48)',ink:'#1c1007',shoulder:'#492914',shoulderHi:'rgba(144,90,48,.58)',gutter:'#24140a',surface:'#e4c792',crown:'rgba(255,245,220,.38)',rut:'rgba(72,42,18,.34)',cleat:'rgba(62,36,14,.42)',boot:'rgba(66,38,16,.38)',textureScale:.22,textureAlpha:.46},
  forest:{kind:'forest',rim:'rgba(10,16,10,.48)',ink:'#131a11',shoulder:'#32281a',shoulderHi:'#e2cc98',surface:'#c4a670',crown:'rgba(246,232,196,.30)',rut:'rgba(62,46,24,.34)',cleat:'rgba(54,40,20,.42)',boot:'rgba(58,42,22,.38)',textureScale:.22,textureAlpha:.45},
  talwald:{kind:'talwald',rim:'rgba(8,14,8,.50)',ink:'#111910',shoulder:'#2c2418',shoulderHi:'#dfc996',surface:'#bfa26c',crown:'rgba(244,230,192,.28)',rut:'rgba(58,44,24,.34)',cleat:'rgba(50,38,20,.42)',boot:'rgba(54,40,22,.38)',textureScale:.22,textureAlpha:.45},
  road:{kind:'road',rim:'rgba(12,18,10,.46)',ink:'#151910',shoulder:'#3a301f',shoulderHi:'#e6d2a0',surface:'#caa972',crown:'rgba(248,236,202,.32)',rut:'rgba(66,50,26,.32)',cleat:'rgba(56,42,20,.40)',boot:'rgba(60,44,22,.36)',textureScale:.22,textureAlpha:.45}
});

// A boot print: heel block plus sole ellipse, tilted slightly outwards on the
// side it belongs to. Used both by the road dressing and by the ground tracks.
function drawBootStamp(ctx,x,y,angle,side,scale,markColor,edgeColor){
  const s=Math.max(.5,scale||1);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  if(edgeColor){
    ctx.fillStyle=edgeColor;
    ctx.beginPath();ctx.ellipse(2.3*s,.4*s,3.1*s,1.8*s,side*.08,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle=markColor;
  ctx.fillRect(-4.1*s,-1.5*s,2.6*s,3*s);
  ctx.beginPath();ctx.ellipse(1.9*s,0,2.9*s,1.75*s,side*.08,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
// A tank cleat pair: the dark tread band with the lighter grouser on top, at
// the gauge the vehicle sprites actually stand on.
function drawTankTreadStamp(ctx,x,y,angle,scale,markColor,edgeColor,baseAlpha=1){
  const s=Math.max(.6,scale||1),gauge=11.5*s,cleatHalf=3.3*s;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  for(const side of [-1,1]){
    const cy=side*gauge;
    ctx.globalAlpha=baseAlpha*.45;
    ctx.fillStyle=markColor;
    ctx.fillRect(-3.8*s,cy-cleatHalf*.85,7.6*s,cleatHalf*1.7);
    ctx.globalAlpha=baseAlpha;
    if(edgeColor){
      ctx.fillStyle=edgeColor;
      ctx.fillRect(-.8*s,cy-cleatHalf,2.6*s,cleatHalf*2);
    }
    ctx.fillStyle=markColor;
    ctx.fillRect(-1.3*s,cy-cleatHalf,2.4*s,cleatHalf*2);
  }
  ctx.restore();
}

// Act V: in the junction the roads are rails - a ballast bed, timber sleepers
// and twin steel lines, with the odd signal mast along the way. Painted along
// the same smoothed ribbon the road uses, purely cosmetic: the simulation path
// and every hit target stay untouched.
function drawRail(ctx,path,texture=null){
  if(!Array.isArray(path)||path.length<2)return;
  const road=buildRoadPath(path);
  if(!road.length)return;
  // Ballast bed, from the ground-clearing halo inwards to the running surface.
  traceRoad(ctx,road,94,'rgba(8,11,10,.55)');
  traceRoad(ctx,road,84,'#111514');
  traceRoad(ctx,road,78,'#6a7268');
  traceRoad(ctx,road,68,'#858d82');
  traceRoad(ctx,road,56,'#99a196');
  if(texture&&ctx.createPattern){
    const pattern=ctx.createPattern(texture,'repeat');
    if(pattern){ctx.save();ctx.globalAlpha=.22;traceRoad(ctx,road,56,pattern);ctx.restore();}
  }
  // Crushed limestone along both shoulders, spaced by distance along the track
  // so the stones keep their rhythm straight through a bend.
  marksAlong(road,20,14,8,(x,y,px,py,angle,k)=>{
    const j=roadHash(k*1.7),side=k%2?1:-1,off=(28+j*7)*side;
    oval(ctx,x+px*off,y+py*off,2.3+j*1.5,1.5+j,j<.5?'#a9b0a4':'#767d74','#161a19',.9);
  });
  // Sleepers: warm oak ties with a crisp ink outline, a sunlit top bevel and
  // iron tie-plates under both rails. Each one is drawn across the TANGENT of
  // the ribbon, so the ties fan around a curve the way they do on real track
  // instead of stopping four pixels before the vertex and restarting after it.
  ctx.save();ctx.lineCap='butt';
  marksAlong(road,16,9,4,(x,y,px,py)=>{
    ctx.strokeStyle='#14120e';ctx.lineWidth=9;
    ctx.beginPath();ctx.moveTo(x-px*23,y-py*23);ctx.lineTo(x+px*23,y+py*23);ctx.stroke();
    ctx.strokeStyle='#6e5237';ctx.lineWidth=6.8;
    ctx.beginPath();ctx.moveTo(x-px*21.8,y-py*21.8);ctx.lineTo(x+px*21.8,y+py*21.8);ctx.stroke();
    ctx.strokeStyle='#9b7954';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x-px*20,y-py*20-1);ctx.lineTo(x+px*20,y+py*20-1);ctx.stroke();
    for(const railSide of [-1,1]){
      const rx=x+px*13*railSide,ry=y+py*13*railSide;
      ctx.fillStyle='#202423';ctx.fillRect(rx-3.2,ry-3.2,6.4,6.4);
    }
  });
  ctx.restore();
  // High-contrast steel over rail-shadow ink, each rail one exact offset curve.
  // This is the 13.0 px corner cut, gone: the old polyline ran through
  // `vertex + n1*13`, which is not on the parallel curve - the miter point is.
  for(const side of [-1,1])for(const [w,style] of [[4.4,'rgba(10,13,12,.85)'],[2.4,'#eff4ed']])
    traceBeside(ctx,road,13*side,w,style);
  // Signal masts at readable intervals, deterministic per track.
  ctx.lineCap='round';
  marksAlong(road,190,60,30,(x,y,px,py,angle,k)=>{
    const j=roadHash(k*3.1),side=j<.5?-1:1,off=39+j*7;
    const mx=x+px*off*side,my=y+py*off*side;
    line(ctx,[[mx,my+10],[mx,my-14]],'#3a3f3a',3);
    ctx.fillStyle='#22261f';ctx.fillRect(mx-4,my-22,8,10);
    oval(ctx,mx,my-19.5,1.7,1.7,j<.35?'#e05a4e':'#7ec97a',null);
    oval(ctx,mx,my-16,1.7,1.7,j<.35?'#5a6f57':'#c9c05a',null);
  });
}
export function drawRoad(ctx,path,theme='road',texture=null,roadTexture=null){
  if(!Array.isArray(path)||path.length<2)return;
  if(theme==='junction'){drawRail(ctx,path,texture);return;}
  const spec=ROAD_THEMES[theme]||ROAD_THEMES.road;
  const road=buildRoadPath(path);
  if(!road.length)return;
  // 1. A wide calm halo that clears the noisy ground around the road.
  traceRoad(ctx,road,94,spec.rim);
  // 2. The comic-ink silhouette, at the same ink weight as the sprites.
  traceRoad(ctx,road,82,spec.ink);
  // 3. The biome's shoulder: kerb, snowbank, rock embankment or ditch.
  traceRoad(ctx,road,76,spec.shoulder);
  if(spec.gutter)traceRoad(ctx,road,66,spec.gutter);
  else if(spec.shoulderHi)traceRoad(ctx,road,68,spec.shoulderHi);
  // 4. The driving surface. Sixty pixels wide, so its half width is 30 px -
  //    comfortably more than the 14.1 px a unit on the sharp polygon strays
  //    from the smoothed centreline at the shipped corner radius.
  traceRoad(ctx,road,60,spec.surface);
  // 5. The seamless road texture, scaled crisp without washing out contrast.
  const tex=roadTexture||texture;
  if(tex&&ctx.createPattern){
    const pattern=ctx.createPattern(tex,'repeat');
    if(pattern){
      if(roadTexture&&typeof pattern.setTransform==='function'&&typeof DOMMatrix==='function'){
        try{pattern.setTransform(new DOMMatrix().scale(spec.textureScale,spec.textureScale));}catch{}
      }
      ctx.save();ctx.globalAlpha=roadTexture?(spec.textureAlpha||.46):.20;
      traceRoad(ctx,road,58,pattern);
      ctx.restore();
    }
  }
  // 6. A worn crown down the middle, and a hairline where gutter meets kerb.
  if(spec.crown){ctx.save();ctx.globalAlpha=.34;traceRoad(ctx,road,38,spec.crown);ctx.restore();}
  if(spec.shoulderHi&&spec.gutter){ctx.save();ctx.globalAlpha=.8;traceRoad(ctx,road,1.6,spec.shoulderHi);ctx.restore();}
  // Crisp tactical lane markings on paved urban and outpost avenues - one exact
  // offset curve per side, so the line follows the bend instead of jumping the
  // corner the way two separately offset segments did.
  if(spec.edgeLine)for(const side of [-1,1])traceBeside(ctx,road,23*side,1.8,spec.edgeLine);
  if(spec.dash){
    ctx.save();
    ctx.beginPath();road.emit(ctx);
    ctx.strokeStyle=spec.dash;ctx.lineWidth=3;ctx.lineCap='butt';ctx.lineJoin='round';
    ctx.setLineDash([16,14]);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
  }
  if(spec.planks){
    // Marsh: a continuous corduroy causeway. Planks by arclength, each laid
    // across the tangent, so the timber fans through the bends.
    ctx.save();ctx.lineCap='butt';
    marksAlong(road,11,6,3,(x,y,px,py,angle,k)=>{
      const j=roadHash(k*1.3);
      line(ctx,[[x-px*24.5,y-py*24.5],[x+px*24.5,y+py*24.5]],'#18120a',9.2);
      line(ctx,[[x-px*23.5,y-py*23.5],[x+px*23.5,y+py*23.5]],j<.35?'#b9925c':j<.7?'#a8824e':'#9b7645',7);
      line(ctx,[[x-px*21,y-py*21-1.2],[x+px*21,y+py*21-1.2]],'rgba(235,208,162,.34)',1.5);
      oval(ctx,x-px*18,y-py*18,1.1,1.1,'#221f1a',null);
      oval(ctx,x+px*18,y+py*18,1.1,1.1,'#221f1a',null);
    });
    ctx.restore();
    // Twin timber guardrails: three stacked offset curves per side.
    for(const [w,style] of [[7.2,'#19120a'],[4.4,'#8f6b3e'],[1.4,'rgba(232,202,150,.55)']])
      for(const side of [-1,1])traceBeside(ctx,road,25*side,w,style);
  }else if(spec.kind==='paved'||spec.kind==='outpost'){
    // Kerb joints every 22 px, and the odd loose slab on outpost avenues.
    ctx.save();ctx.lineCap='butt';ctx.strokeStyle='#151a19';ctx.lineWidth=2;
    marksAlong(road,22,14,10,(x,y,px,py,angle,k)=>{
      const j=roadHash(k*2.9);
      if(spec.kind==='outpost'&&j<.22)return;
      for(const side of [-1,1]){
        const cx=x+px*35*side,cy=y+py*35*side;
        ctx.beginPath();ctx.moveTo(cx-px*3.5,cy-py*3.5);ctx.lineTo(cx+px*3.5,cy+py*3.5);ctx.stroke();
      }
      if(spec.kind==='outpost'&&j>.68){
        const side=j>.84?1:-1,d=26+j*12;
        oval(ctx,x+px*d*side,y+py*d*side,2.5,1.6,'#8a785f','#1d1812',.9);
      }
    });
    ctx.restore();
  }else if(spec.kind==='arctic'){
    // Snowdrifts heaped along both edges, with the occasional crack in the ice.
    marksAlong(road,26,18,12,(x,y,px,py,angle,k)=>{
      const j=roadHash(k*4.3),side=k%2?1:-1,d=(35+j*3)*side;
      ctx.save();ctx.translate(x+px*d,y+py*d);ctx.rotate(angle);
      oval(ctx,0,side*1.2,9.5+j*4,4.4+j*1.6,'#5b7c8e',null);
      oval(ctx,0,0,9+j*3.8,3.8+j*1.4,'#f6fbfd','#1e3846',1.2);
      ctx.restore();
      if(j<.44){
        const ux=Math.cos(angle),uy=Math.sin(angle),cx=x+px*(j-.5)*20,cy=y+py*(j-.5)*20;
        line(ctx,[[cx,cy],[cx+ux*6+px*4,cy+uy*6+py*4],[cx+ux*11-px*2,cy+uy*11-py*2]],'#203440',1.2);
      }
    });
  }else if(spec.kind==='scrub'){
    // Desert: rock and gravel scattered clear of the wheels, plus sand sheen.
    marksAlong(road,26,20,12,(x,y,px,py,angle,k)=>{
      const j=roadHash(k*5.7),side=k%2?1:-1,d=(34+j*4)*side;
      oval(ctx,x+px*d,y+py*d,4.5+j*3,2.4+j*1.2,'#62371c','#1f1007',1);
      if(j<.55){
        const s=(j-.3)*24;
        oval(ctx,x+px*s,y+py*s,7+j*4,2.4,'rgba(255,244,218,.38)',null);
      }
    });
  }else{
    // Woodland and open track: undergrowth at the verge, broken branches in
    // the valley forest, loose stones on the last road.
    marksAlong(road,26,20,12,(x,y,px,py,angle,k)=>{
      const j=roadHash(k*6.1),side=k%2?1:-1;
      if(spec.kind==='talwald'&&k%3===0){
        ctx.save();ctx.lineCap='butt';
        line(ctx,[[x-px*32,y-py*32],[x-px*20,y-py*20]],'#231b11',4.6);
        line(ctx,[[x+px*20,y+py*20],[x+px*32,y+py*32]],'#231b11',4.6);
        ctx.restore();
      }
      const d=(33+j*5)*side;
      oval(ctx,x+px*d,y+py*d,2.8+j*2,1.9+j,spec.kind==='road'?'#968464':'#6e6045',spec.ink,1);
    });
  }
  // Static road wear. Twin track ruts, ONE stroke per side on the exact offset
  // curve: the segment-wise version tore these apart by 21.2 px at every corner
  // and stacked round caps into dark beads along the whole road.
  ctx.save();
  for(const side of [-1,1])traceBeside(ctx,road,14.5*side,5,spec.rut);
  ctx.restore();
  // Tank cleats across both ruts, every 12 px of true distance - through bends.
  ctx.save();ctx.lineCap='butt';ctx.strokeStyle=spec.cleat;ctx.lineWidth=2.1;
  marksAlong(road,12,14,8,(x,y,px,py)=>{
    for(const side of [-1,1]){
      const cx=x+px*14.5*side,cy=y+py*14.5*side;
      ctx.beginPath();ctx.moveTo(cx-px*3.2,cy-py*3.2);ctx.lineTo(cx+px*3.2,cy+py*3.2);ctx.stroke();
    }
  });
  ctx.restore();
  // Boot stamps alternating left and right of the lane, turned to the heading.
  marksAlong(road,26,20,10,(x,y,px,py,angle,k)=>{
    const jm=roadHash(k*7.3);
    if(jm<.18)return;
    const side=k%2?1:-1,flank=(jm<.55?-5:2)+side*3.2;
    drawBootStamp(ctx,x+px*flank,y+py*flank,angle,side,.85,spec.boot,null);
  });
}
// Presentation only: the marked segment retains the simulation's exact endpoints.
function roadZone(ctx,a,b,{color,deep,edge,label,detail}){
  const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(!length)return;
  const toRGBA=(hex,a)=>{const n=parseInt(hex.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;};
  ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));ctx.lineCap='butt';
  // A band cut into the road: soft shoulders, a sunken (darker) centre line.
  // Reported: the slow patches read as flat brown stripes - give them depth.
  // Headless canvas mocks (tests) have no gradient factory - fall back to
  // the flat band instead of crashing the scene.
  const grad=typeof ctx.createLinearGradient==='function'?ctx.createLinearGradient(0,-24,0,24):null;
  if(grad){
    grad.addColorStop(0,toRGBA(edge,0));grad.addColorStop(.2,toRGBA(color,.4));
    grad.addColorStop(.5,toRGBA(deep||color,.6));grad.addColorStop(.8,toRGBA(color,.4));grad.addColorStop(1,toRGBA(edge,0));
    ctx.fillStyle=grad;ctx.fillRect(0,-24,length,48);
  }else{
    ctx.globalAlpha=.34;line(ctx,[[0,0],[length,0]],color,45);ctx.globalAlpha=1;
  }
  ctx.globalAlpha=.75;
  line(ctx,[[0,-21],[length,-21]],edge,1.5);line(ctx,[[0,21],[length,21]],edge,1.5);
  ctx.globalAlpha=1;
  // Surface detail: ice veins, sludge swirls or debris chunks, deterministic
  // along the band.
  for(let x=12;x<length-8;x+=19){
    const w=(x*7919)%13;
    if(detail==='ice'){
      ctx.globalAlpha=.7;ctx.strokeStyle=edge;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,-12+(w%5));ctx.lineTo(x+4,-4+(w%4));ctx.lineTo(x+1,2+(w%3));ctx.lineTo(x+7,11-(w%4));ctx.stroke();
      ctx.globalAlpha=.3;ctx.fillStyle='#ffffff';oval(ctx,x+10,-6+(w%7),5,2,null,null);
    }else if(detail==='mud'){
      ctx.globalAlpha=.5;ctx.fillStyle=edge;oval(ctx,x+(w%6),-6+(w%5),4.5,1.6,null,null);
      oval(ctx,x+7+(w%4),7-(w%5),6,2.2,null,null);
      ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(x+3+(w%8),1+(w%6),1.6,0,Math.PI*2);ctx.strokeStyle=deep||color;ctx.lineWidth=1.2;ctx.stroke();
    }else{
      ctx.globalAlpha=.65;ctx.fillStyle=edge;
      oval(ctx,x+(w%5),-9+(w%6),3.2,1.6,null,null);oval(ctx,x+8,8-(w%5),3.6,1.8,null,null);
      ctx.globalAlpha=.5;ctx.strokeStyle=edge;ctx.lineWidth=1.3;
      ctx.beginPath();ctx.moveTo(x,-10);ctx.lineTo(x+5,-8);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+9,8);ctx.lineTo(x+15,10);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#182b25';ctx.strokeText(label,length/2,-27);ctx.fillStyle='#e2e5d3';ctx.fillText(label,length/2,-27);ctx.restore();
}
function thinIce(ctx,path,theme){if(theme!=='arctic'||path.length!==10)return;roadZone(ctx,path[4],path[5],{color:'#6b9aa3',deep:'#2f5f74',edge:'#d7ece9',label:tr('THIN ICE'),detail:'ice'});}
function bog(ctx,path,theme){if(theme!=='marsh'||path.length!==10)return;roadZone(ctx,path[6],path[7],{color:'#584d36',deep:'#241f12',edge:'#c0b694',label:tr('DEEP BOG'),detail:'mud'});}
function fieldZone(ctx,path,state,theme){
 if(!state.mapId?.startsWith('g2-')||path.length!==10||!['forest','urban'].includes(theme))return;
 const cleared=theme==='urban'&&state.rubbleCleared;
 roadZone(ctx,path[2],path[3],{color:theme==='forest'?'#475b43':cleared?'#778270':'#645f54',deep:theme==='forest'?'#1f2c1d':cleared?'#4a5444':'#3a352c',edge:theme==='forest'?'#b0c4a1':'#d0c9b4',label:theme==='forest'?tr('AMBUSH TRAIL'):cleared?tr('RUBBLE CLEARED'):tr('RUBBLE {amount}',{amount:Math.max(0,Math.ceil(200-(state.rubbleDamage||0)))}),detail:'debris'});
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
    image.src=`assets/${name}-sprite.png?v=20261121-towerdeco1`;
  }
  const entry=spriteImages.get(name);return entry.ready?entry.image:null;
}
// The same "draw now, refine when the image lands" contract the terrain already
// follows. Images that failed to load stay on the vector fallback instead of asking
// for a redraw every frame.
export function spritesPending(){for(const entry of spriteImages.values())if(!entry.ready&&!entry.failed)return true;return false;}
function bunker(ctx,state,notify,approach=0,time=0,motion=true){
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
  // IPL-0128 Fahnen-Wellung: a flag on the bunker roof. It waves only in the
  // wave lull and only when motion is allowed; in battle and under reduced
  // motion it hangs still - the same pennant either way, never a new state.
  const flagLull=!state.running&&!state.ended&&(state.hp??100)>0;
  const wave=flagLull&&motion?1:0;
  const fph=Number.isFinite(time)?time*2.4:0;
  const d1=wave?Math.sin(fph)*4:0,d2=wave?Math.sin(fph+1.2)*4:0;
  line(ctx,[[-50,-38],[-50,-76]],'#5c4a33',2.5);
  oval(ctx,-50,-77.5,2.5,2.5,'#6b563c',null);
  shape(ctx,[[-50,-74],[-26,-71+d1],[-32,-63+d2],[-50,-61]],'#c9553f',ink,1.6);
  ctx.fillStyle='#344231';ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText('BUNKER',0,-44);ctx.textAlign='start';
}
// The layered turrets: the painted pit stays the ground truth of the
// position, the gun itself is drawn in ink and olive on top of it so it can
// traverse onto its target - swing, recoil and all - without the painting
// having to spin. Each position wears its own head: the MG's tripod gun,
// the howitzer's box trail and heavy barrel, the flak's shielded twin
// barrels, the sniper's long thin rifle with scope. The ground dressing
// (sandbags, concrete ring, ammo crates, camo mound) never turns with the
// gun - it is ground, not weapon.
// Muzzle flash and shell casing, both read off the same kick the barrel
// just made: the flash lives while the kick is fresh (recoil above half),
// the casing flies out of the ejection port as the kick fades. The recoil
// value is the whole animation - no state, no clock, and reduced motion
// never sees it because the tracker answers recoil 0 there.
function muzzleFx(ctx,recoil,muzzles,port,arc){
  if(recoil<=0)return;
  const cx=port[0]+(1-recoil)*arc[0],cy=port[1]+(1-recoil)*arc[1];
  ctx.save();ctx.globalAlpha=recoil;oval(ctx,cx,cy,2.2,1.4,'#d9c08a','#8a6f3c',.8);ctx.restore();
  // IPL-0128 Rueckstossrauch: das Fach atmet Pulver - klein und dicht an
  // der Muedung, wenn der Schuss frisch ist, breiter und faeber wenn sich
  // der Lauf setzt. Dasselbe Fenster wie die Huelle (recoil > 0), also
  // sieht reduzierte Bewegung (Rueckstoss 0) keinen Rauch.
  ctx.save();
  for(const [mx,my,r] of muzzles){
    const spread=1-recoil;
    ctx.globalAlpha=recoil*.5;
    oval(ctx,mx-spread*2.5,my-1-spread*4,r*.75+spread*3,r*.55+spread*2.4,'#8f968b',null);
  }
  ctx.restore();
  if(recoil<=.5)return;
  const f=(recoil-.5)*2;
  for(const [mx,my,r] of muzzles){
    ctx.save();ctx.globalAlpha=f;
    ctx.fillStyle='#ff9a3c';star(ctx,mx,my,r);ctx.fill();
    ctx.fillStyle='#ffd75c';star(ctx,mx,my,r*.55);ctx.fill();
    ctx.restore();
  }
}
function mgTurret(ctx,x,y,aim){
  // The sandbag ring is laid once around the plate and never turns with
  // the gun - it is ground, not weapon.
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2,bx=x+Math.cos(a)*26,by=y+7+Math.sin(a)*14.5;
    oval(ctx,bx,by,7.6,5,k%2?'#bfa87c':'#cbb384','#8f7a52',1);}
  oval(ctx,x,y+3,13,5,'rgba(24,32,26,.28)',null);
  const angle=Number.isFinite(aim?.angle)?aim.angle:0,recoil=Math.max(0,Math.min(1,aim?.recoil||0));
  ctx.save();ctx.translate(x,y-3);ctx.rotate(angle);
  // Tripod and mount first: the legs stay planted while the top works.
  line(ctx,[[-1,0],[-10,10]],'#33402f',3.4);line(ctx,[[1,0],[10,10]],'#33402f',3.4);line(ctx,[[0,1],[0,11]],'#33402f',3.4);
  shape(ctx,[[-3,-4],[3,-4],[3,5],[-3,5]],'#46523f');
  // Only the barrel group kicks: receiver, barrel and belt slide back
  // inside the mount, the mount itself never moves.
  ctx.translate(-recoil*3.5,0);
  // Receiver with top cover, rear grip and sight post.
  shape(ctx,[[-12,-7],[5,-7],[7,-4],[7,1],[-10,2],[-12,-2]],'#55624c');
  line(ctx,[[-11,-7],[4,-7]],'#6d7c60',2);line(ctx,[[-12,-2],[-16,1]],ink,2.6);
  line(ctx,[[-4,-7],[-4,-10]],ink,1.8);oval(ctx,-4,-10.6,1.4,1.4,'#d9c08a',null);
  // Barrel with perforated jacket and muzzle brake.
  shape(ctx,[[6,-5],[27,-3.4],[27,-1.2],[6,-.8]],'#39443a');
  for(let i=0;i<3;i++)oval(ctx,12+i*5,-3.1,1.1,1.1,'#232d24',null);
  shape(ctx,[[27,-3.8],[30,-3.8],[30,-.8],[27,-.8]],'#2b352c');
  // Belt box feeding the receiver from the side.
  shape(ctx,[[-14,1],[-5,1],[-5,8],[-14,8]],'#6b7256');line(ctx,[[-9,1],[-4,-3]],'#8a8f6d',2);
  muzzleFx(ctx,recoil,[[31.5,-2.3,6]],[-2,3],[-4,-8]);
  ctx.restore();
}
// The layered howitzer: a concrete ring instead of sandbags - this gun was
// dug in on a platform, not behind a pit wall. The box trail and the heavy
// barrel kick harder than the MG's, so the recoil travel is longer.
function cannonTurret(ctx,x,y,aim){
  for(let k=0;k<10;k++){const a=k/10*Math.PI*2,bx=x+Math.cos(a)*29,by=y+8+Math.sin(a)*16;
    oval(ctx,bx,by,8.4,5.4,k%2?'#9aa39b':'#8b948c','#6f7a70',1);}
  oval(ctx,x,y+4,14,5,'rgba(24,32,26,.28)',null);
  const angle=Number.isFinite(aim?.angle)?aim.angle:0,recoil=Math.max(0,Math.min(1,aim?.recoil||0));
  ctx.save();ctx.translate(x,y-3);ctx.rotate(angle);
  // Box trail: two legs splayed back from the pedestal, spades at the ends.
  line(ctx,[[-3,3],[-17,12]],'#33402f',4);line(ctx,[[-3,-3],[-17,-12]],'#33402f',4);
  shape(ctx,[[-20,10],[-14,10],[-14,15],[-20,15]],'#2b352c');shape(ctx,[[-20,-15],[-14,-15],[-14,-10],[-20,-10]],'#2b352c');
  shape(ctx,[[-6,-6],[4,-6],[4,8],[-6,8]],'#46523f');
  // Elevation wheel rides on the pedestal, so it stays with the mount.
  oval(ctx,-2,9,3.2,3.2,'#6b7256','#2b352c',1.4);line(ctx,[[-2,6],[-2,12]],'#2b352c',1.4);
  // Only the breech and barrel kick back inside the mount.
  ctx.translate(-recoil*5,0);
  // Breech block and the thick barrel with its muzzle brake.
  shape(ctx,[[-8,-7],[6,-7],[8,-4],[8,2],[-6,3],[-8,-2]],'#55624c');
  line(ctx,[[-7,-7],[5,-7]],'#6d7c60',2);
  shape(ctx,[[6,-5],[30,-4],[30,0],[6,1]],'#39443a');
  shape(ctx,[[30,-5.5],[34,-5.5],[34,.5],[30,.5]],'#2b352c');
  line(ctx,[[31,-5.5],[31,.5]],'#55624c',1.6);line(ctx,[[33,-5.5],[33,.5]],'#55624c',1.6);
  // Sight post rides on the breech, so it kicks with the barrel.
  line(ctx,[[-4,-7],[-4,-10]],ink,1.8);oval(ctx,-4,-10.6,1.4,1.4,'#d9c08a',null);
  muzzleFx(ctx,recoil,[[35.5,-2.5,7]],[2,3],[-5,-7]);
  ctx.restore();
}
// The layered flak: sandbags like the MG, but the gun wears an armoured
// shield and twin barrels - the plate is what the crew hides behind.
function flakTurret(ctx,x,y,aim){
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2,bx=x+Math.cos(a)*26,by=y+7+Math.sin(a)*14.5;
    oval(ctx,bx,by,7.6,5,k%2?'#bfa87c':'#cbb384','#8f7a52',1);}
  // Ammo crates stay on the ground beside the gun, never turning with it.
  shape(ctx,[[x-31,y+9],[x-19,y+9],[x-19,y+17],[x-31,y+17]],'#6b7256','#4a5138',1.4);
  line(ctx,[[x-25,y+9],[x-25,y+17]],'#4a5138',1.2);
  shape(ctx,[[x+20,y+11],[x+29,y+11],[x+29,y+18],[x+20,y+18]],'#5d6449','#4a5138',1.4);
  oval(ctx,x,y+3,13,5,'rgba(24,32,26,.28)',null);
  const angle=Number.isFinite(aim?.angle)?aim.angle:0,recoil=Math.max(0,Math.min(1,aim?.recoil||0));
  ctx.save();ctx.translate(x,y-3);ctx.rotate(angle);
  // Pedestal and yoke, then the shield plate the barrels poke through.
  shape(ctx,[[-5,-5],[3,-5],[3,7],[-5,7]],'#46523f');
  line(ctx,[[-2,-5],[-2,-9]],'#33402f',3);line(ctx,[[-2,5],[-2,9]],'#33402f',3);
  shape(ctx,[[-3,-11],[3,-11],[3,11],[-3,11]],'#3d4a3c','#2b352c',1.6);
  line(ctx,[[-3,-6],[3,-6]],'#55624c',1.4);line(ctx,[[-3,6],[3,6]],'#55624c',1.4);
  // Only the twin barrels and their drum kick back behind the shield.
  ctx.translate(-recoil*2,0);
  // Twin barrels with muzzle rings.
  shape(ctx,[[3,-4.6],[28,-4.2],[28,-2.8],[3,-2.2]],'#39443a');
  shape(ctx,[[3,2.2],[28,2.8],[28,4.2],[3,4.6]],'#39443a');
  shape(ctx,[[28,-5],[31,-5],[31,-2.4],[28,-2.4]],'#2b352c');shape(ctx,[[28,2.4],[31,2.4],[31,5],[28,5]],'#2b352c');
  // Ammo drum on the side and the sight post above the shield.
  oval(ctx,-8,6,4,4,'#6b7256','#2b352c',1.4);
  line(ctx,[[0,-11],[0,-14]],ink,1.8);oval(ctx,0,-14.6,1.4,1.4,'#d9c08a',null);
  muzzleFx(ctx,recoil,[[32.5,-3.7,5],[32.5,3.7,5]],[-4,9],[-4,-8]);
  ctx.restore();
}
// The layered sniper: a camouflaged mound instead of a ring - the hide is
// the position. The rifle is long and thin, the scope is the giveaway.
function sniperTurret(ctx,x,y,aim){
  oval(ctx,x,y+6,30,15,'#2c3d2a','#22331f',1.6);
  oval(ctx,x-12,y+2,9,5,'#3d5238',null);oval(ctx,x+11,y+9,8,4.6,'#3d5238',null);oval(ctx,x+2,y-2,7,4,'#35492f',null);
  for(const [gx,gy] of [[-20,10],[16,12],[0,16]])line(ctx,[[x+gx,y+gy],[x+gx+2,y+gy-5]],'#4a6136',1.6);
  oval(ctx,x,y+3,13,5,'rgba(24,32,26,.28)',null);
  const angle=Number.isFinite(aim?.angle)?aim.angle:0,recoil=Math.max(0,Math.min(1,aim?.recoil||0));
  ctx.save();ctx.translate(x,y-3);ctx.rotate(angle);
  // Bipod legs splayed forward: they stay planted while the rifle kicks.
  line(ctx,[[4,1],[12,11]],'#33402f',2.6);line(ctx,[[4,-1],[12,-11]],'#33402f',2.6);
  ctx.translate(-recoil*1.5,0);
  shape(ctx,[[-12,-4],[6,-4],[8,-1],[8,2],[-10,3],[-12,0]],'#4a5545');
  line(ctx,[[-11,-4],[5,-4]],'#6d7c60',1.6);
  shape(ctx,[[7,-2.6],[36,-2],[36,-.6],[7,-.4]],'#39443a');
  shape(ctx,[[36,-2.6],[39,-2.6],[39,-.4],[36,-.4]],'#2b352c');
  // Scope on its mounts, magazine below, bolt handle at the rear.
  line(ctx,[[-2,-4],[-2,-8]],ink,1.6);line(ctx,[[2,-4],[2,-8]],ink,1.6);
  shape(ctx,[[-8,-9.5],[4,-9.5],[4,-7.5],[-8,-7.5]],'#2b352c');
  oval(ctx,4,-8.5,1.6,1.6,'#d9c08a',null);oval(ctx,-8,-8.5,1.2,1.2,'#55624c',null);
  shape(ctx,[[-4,2],[1,2],[1,6],[-4,6]],'#6b7256');
  line(ctx,[[-6,-2],[-9,1]],ink,2);
  muzzleFx(ctx,recoil,[[40.5,-1.5,5]],[-4,3],[-3,-7]);
  ctx.restore();
}
function pad(ctx,p,tower,selected,types,notify,pulse=1,aim=null,levelFx=null){
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
  // The selection ring is the one animated affordance on an empty pad: thick
  // enough to read at a glance, breathing via globalAlpha. The caller passes
  // the pulse (1 when reduced motion is on), so this stays a pure function
  // of its arguments and a recording canvas can pin it exactly.
  if(selected){ctx.save();ctx.strokeStyle='#d4eee0';ctx.lineWidth=3.2;ctx.globalAlpha=pulse;ctx.setLineDash([8,5]);ctx.beginPath();ctx.ellipse(x,y,34,24,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  if(!tower){line(ctx,[[x-13,y-8],[x+13,y-8]],'#78988b',1);ctx.fillStyle='#dce7d7';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(tr('BUILD'),x,y+5);ctx.textAlign='start';return;}
  const display=towerDisplay(tower.level);
  // A prestige tower has been paid for twice over, so it is allowed to glow.
  // Everything here is painted BEFORE the tower itself (the artwork lands at
  // the end of this function), so the glow can be strong without covering the
  // tower it belongs to - a glow that hides its own tower is worse than none.
  // A static amethyst halo remains visible even when reduced motion is enabled.
  // IPL-0128: Prestige wears amethyst (#b48ce0), not the upgrade's gold - the
  // same colour for both was called out by the operator as nonsense.
  if(display.prestige){
    const pool=radial(ctx,x,y-6,2,x,y-6,58);
    if(pool){pool.addColorStop(0,'rgba(180,140,224,.36)');pool.addColorStop(.5,'rgba(165,120,230,.18)');pool.addColorStop(1,'rgba(165,120,230,0)');
      ctx.save();ctx.beginPath();ctx.ellipse(x,y-6,58,46,0,0,Math.PI*2);ctx.fillStyle=pool;ctx.fill();ctx.restore();}
    ctx.save();ctx.shadowColor='#b48ce0';ctx.shadowBlur=26;oval(ctx,x,y-4,30,26,'rgba(180,140,224,.20)','#c9a8f2',2.5);ctx.restore();
    ctx.save();ctx.strokeStyle='rgba(214,196,255,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y-4,37,32,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    ctx.fillStyle='#efe4ff';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText(`★${display.prestige}`,x,y-28);ctx.textAlign='start';}
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
  if(tower.classPath&&tower.classTier>=1){
    const badgeColor=({assault:'#d89970',engineer:'#d7bd71',logistics:'#b4c682',medic:'#8ac7b1',recon:'#8eafcf',airDefense:'#d9849e'})[tower.classPath]||'#d8c596';
    const tier2=tower.classTier>=2;
    ctx.save();
    if(tier2){
      const aura=radial(ctx,x,y+12,4,x,y+12,34);
      if(aura){aura.addColorStop(0,badgeColor);aura.addColorStop(1,'rgba(25,43,35,0)');ctx.globalAlpha=.28;ctx.fillStyle=aura;ctx.beginPath();ctx.ellipse(x,y+12,34,15,0,0,Math.PI*2);ctx.fill();}
    }
    ctx.globalAlpha=tier2?.85:.6;
    ctx.beginPath();ctx.ellipse(x,y+12,26,11.5,0,0,Math.PI*2);ctx.strokeStyle=badgeColor;ctx.lineWidth=tier2?2.2:1.6;
    if(!tier2)ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
  }
  const headPainter=[mgTurret,cannonTurret,flakTurret,sniperTurret][tower.type];
  if(aim&&headPainter)headPainter(ctx,x,y,aim);
  else if(artwork){const w=58,h=w*artwork.height/artwork.width;ctx.drawImage(artwork,x-w/2,y+11-h,w,h);}
  else fallbackMarker(ctx,x,y-6,['MG','C','AA','S'][tower.type],types[tower.type].color,18,15);
  if(tower.classPath&&tower.classTier>=1){
    const badgeColor=({assault:'#d89970',engineer:'#d7bd71',logistics:'#b4c682',medic:'#8ac7b1',recon:'#8eafcf',airDefense:'#d9849e'})[tower.classPath]||'#d8c596';
    const mx=x-18,my=y-13;
    oval(ctx,mx,my,10,10,'#172720',badgeColor,1.8);
    if(tower.classPath==='assault'){shape(ctx,[[mx,my-5],[mx+4,my+1],[mx,my+3.5],[mx-4,my+1]],badgeColor,null);}
    else if(tower.classPath==='engineer'){oval(ctx,mx,my,4,4,null,badgeColor,1.6);line(ctx,[[mx,my-6],[mx,my-4]],badgeColor,1.5);line(ctx,[[mx,my+4],[mx,my+6]],badgeColor,1.5);line(ctx,[[mx-6,my],[mx-4,my]],badgeColor,1.5);line(ctx,[[mx+4,my],[mx+6,my]],badgeColor,1.5);}
    else if(tower.classPath==='logistics'){shape(ctx,[[mx-4,my-3.5],[mx+4,my-3.5],[mx+4,my+3.5],[mx-4,my+3.5]],null,badgeColor,1.5);line(ctx,[[mx,my-3.5],[mx,my+3.5]],badgeColor,1.3);line(ctx,[[mx-4,my],[mx+4,my]],badgeColor,1.3);}
    else if(tower.classPath==='medic'){line(ctx,[[mx,my-4.5],[mx,my+4.5]],badgeColor,2.2);line(ctx,[[mx-4.5,my],[mx+4.5,my]],badgeColor,2.2);}
    else if(tower.classPath==='recon'){oval(ctx,mx,my,4,4,null,badgeColor,1.4);line(ctx,[[mx,my-6],[mx,my+6]],badgeColor,1.2);line(ctx,[[mx-6,my],[mx+6,my]],badgeColor,1.2);}
    else{ctx.beginPath();ctx.arc(mx,my+2,5.5,Math.PI,0);ctx.strokeStyle=badgeColor;ctx.lineWidth=1.6;ctx.stroke();line(ctx,[[mx-3,my+5],[mx,my-2],[mx+3,my+5]],badgeColor,1.4);}
    if(tower.classTier>=2){oval(ctx,mx+4,my-8,3,3,'#f0d68a','#172720',1);oval(ctx,mx-4,my-8,3,3,'#f0d68a','#172720',1);}
  }
  oval(ctx,x+18,y+13,9,9,paper);ctx.fillStyle=ink;ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(String(display.level),x+18,y+17);ctx.textAlign='start';
  // IPL-0128 Level-Up-Sichtbarkeit: das Abzeichen pocht, wenn der Turm
  // aufsteigt - ein Emblem-Blitz rund um die Zahl, die sich eben drehete.
  // Nur ein Wert, den der Effekt ohnehin mitbringt; keine Uhr, kein Zustand.
  if(Number.isFinite(levelFx)){
    const t=Math.max(0,Math.min(1,levelFx));
    ctx.save();ctx.globalAlpha=Math.max(0,1-t);
    ctx.beginPath();ctx.arc(x+18,y+13,10+16*t,0,Math.PI*2);ctx.strokeStyle='#fff6d8';ctx.lineWidth=2.6-2*t;ctx.stroke();
    star(ctx,x+18,y+13,2+(1-t)*6);ctx.fillStyle='#fdf6e0';ctx.fill();
    ctx.restore();
  }
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
function enemy(ctx,e,reducedMotion,notify,heading=0,bank=0,time=0,rail=false,dust=1,hit=0){
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
    // Marching feet raise a little dust of their own, phased off the
    // position so a column does not puff in lockstep.
    if(!reducedMotion&&e.hp>0){const ph=(((t0*(e.kind==='runner'?2.4:1.6)+(x+y)*.021)%1)+1)%1;
      ctx.save();ctx.globalAlpha=.13*(1-ph);oval(ctx,x-ph*7,y+12,3+ph*4.5,1.6+ph*1.8,'#b7a67e',null);ctx.restore();}
  }
  // IPL-0128 Fahrzeug-Staub: land machines kick dust from what they actually
  // drove - the tread marks - and the puff draws even when the hull falls
  // back to a marker, because dust belongs to the ground, not the artwork.
  if(!reducedMotion&&e.hp>0&&dust>0&&drives){for(let i=0;i<2;i++){const back=angle+Math.PI,side=angle+Math.PI/2*(i?1:-1),ph=((t0*.9+i*.5+x*.01)%1+1)%1;
    ctx.save();ctx.globalAlpha=0.16*dust*(1-ph);oval(ctx,x+Math.cos(back)*(20+ph*14)+Math.cos(side)*6,y+Math.sin(back)*(20+ph*14)+Math.sin(side)*4+8,4+ph*5,2.5+ph*3,train?'#9aa39b':'#b7a67e',null);ctx.restore();}}
  // A vehicle shot to pieces tells you so: dark smoke boils off it in a
  // slow loop, the same visual sentence the bunker already speaks. It is
  // read off the life fraction alone, so every viewer paints the same
  // smoke from the same state.
  if(!reducedMotion&&e.hp>0&&e.maxHp>0&&e.hp/e.maxHp<.35&&(drives||flies||e.boss)){
    ctx.save();
    for(let i=0;i<3;i++){const phase=(((t0*.5+i/3+(x+y)*.013)%1)+1)%1;
      ctx.globalAlpha=.3*(1-phase*.65);
      oval(ctx,x+Math.sin(t0*1.4+i*2.1)*3+phase*5,y-14-phase*24,3+phase*6.5,2.2+phase*4.5,'#3d4740',null);}
    ctx.restore();
  }
  // IPL-0128 Treffer-Feedback: the struck unit flares up - a bright emblem
  // star on the body, and on a machine two light dents across the plating.
  if(hit>0){
    ctx.save();ctx.globalAlpha=Math.min(1,hit*1.2);
    star(ctx,x,y-11,5+7*hit);ctx.fillStyle='#fdf6e0';ctx.fill();
    if(drives){line(ctx,[[x-8,y-4],[x+7,y]],'#fdf6e0',1.7);line(ctx,[[x-5,y+2],[x+6,y-3]],'#ffe9a0',1.3);}
    ctx.restore();
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
  // IPL-0128 Wettergefuehl: rain threads (dense on the marsh, light in the
  // forest) and puddle discs with a glint sliding across - all from the same
  // painter's clock the existing particles already use.
  if(theme==='marsh'||theme==='forest'){
    const dense=theme==='marsh',threads=dense?16:10,fall=dense?260:150,drift=dense?140:70,len=dense?14:9;
    ctx.globalAlpha=dense?0.3:0.18;ctx.strokeStyle=dense?'#cfe4ea':'#c9e4de';ctx.lineWidth=1;
    for(let i=0;i<threads;i++){
      const x=((i*97+t*drift)%(width+40))-20,y=((i*151+t*fall)%height);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5,y+len);ctx.stroke();
    }
    for(let i=0;i<3;i++){
      const px=width*(0.2+0.27*i),py=height*(0.68+0.06*(i%2));
      ctx.globalAlpha=0.3;oval(ctx,px,py,16+i*5,4.5+i*1.4,'#577379',null);
      const gx=px-14+((t*(20+i*4)+i*40)%28);
      ctx.globalAlpha=0.5;ctx.strokeStyle='#cfe9ee';ctx.lineWidth=1.8;
      ctx.beginPath();ctx.moveTo(gx,py-1.5);ctx.lineTo(gx+7,py-1.5);ctx.stroke();
    }
  }
  ctx.restore();
}
// How startled the birds are: read off the shot list every viewer already
// receives - the freshest shot's remaining life (minus snapshot age, the same
// arithmetic the tracer uses) plus how many shots are in flight. No state, no
// clock, no new value on the wire: every client startles at the same moment.
export function ambientAlarm(shots,shotAge=0){
  const age=Number.isFinite(shotAge)?shotAge:0;
  let fresh=0,count=0;
  for(const s of shots||[]){
    if(!s)continue;
    const duration=Number.isFinite(s.duration)&&s.duration>0?s.duration:.12;
    const left=(Number.isFinite(s.life)?s.life:0)-age;
    if(!(left>0))continue;
    count++;
    const a=left/duration;
    if(a>fresh)fresh=a;
  }
  if(!count)return 0;
  const alarm=count/6+fresh*.55;
  return alarm>1?1:alarm;
}

// Lebendiges Ambient: cloud shadows drift over the ground, wind litter tumbles
// across it, and a small flock crosses the sky. The flock climbs and beats
// faster while shots are fresh (ambientAlarm), and settles when the field goes
// quiet. All three layers are drawn from the clock and the shot list alone -
// nothing is stored, so no two viewers can disagree about the sky. Reduced
// motion and the weather toggle switch the whole scene off.
function ambientLife(ctx,theme,time,width,height,shots,shotAge){
  const t=Number.isFinite(time)?time:0;
  const alarm=ambientAlarm(shots,shotAge);
  // 1. Cloud shadows: two wide, soft ellipses crossing the field slowly.
  ctx.save();ctx.fillStyle='#16211c';
  for(let i=0;i<2;i++){
    ctx.globalAlpha=.055+i*.015;
    const x=((i*.57+t*.013)%(1))*(width+440)-220;
    const y=height*(.28+.38*i)+Math.sin(t*.07+i*2.1)*18;
    ctx.beginPath();ctx.ellipse(x,y,176-i*28,58+i*10,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+120,y+22,110,40,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  // 2. Wind litter: twigs and leaves tumbling low across the ground, tinted
  // by the biome so the desert blows sand and the marsh blows reed.
  const litter={arctic:'#eef4ec',marsh:'#c7d8a8',forest:'#9db471',urban:'#b9bfae'}[theme]||'#c9b27a';
  ctx.save();ctx.globalAlpha=.5;ctx.strokeStyle=litter;ctx.lineWidth=1.6;
  for(let i=0;i<9;i++){
    const x=((i*.19+t*(.045+.011*(i%3)))%(1))*(width+90)-45;
    const y=height*.22+((i*71)%(height*.62))+Math.sin(t*1.4+i*2.3)*9;
    const a=Math.sin(t*2.2+i*1.7)*.9;
    ctx.beginPath();
    ctx.moveTo(x-Math.cos(a)*4,y-Math.sin(a)*4);
    ctx.lineTo(x+Math.cos(a)*4,y+Math.sin(a)*4);
    ctx.stroke();
  }
  ctx.restore();
  // 3. The flock: six birds crossing the sky. Fresh shots make them climb and
  // beat their wings faster; quiet weather lets them glide. The wings are two
  // quadratic strokes - a flat line glides, a curved one flaps.
  ctx.save();ctx.strokeStyle='#1d3028';ctx.lineWidth=1.6;ctx.globalAlpha=.78;
  for(let i=0;i<6;i++){
    const x=((i*.17+t*(.035+.006*i))%(1))*(width+140)-70;
    const y=52+i*21+Math.sin(t*.5+i*1.4)*7-alarm*(16+i*3);
    const flap=Math.sin(t*(6+alarm*12)+i*1.9)*(2.6+alarm*2);
    const w=6+alarm*2;
    ctx.beginPath();
    ctx.moveTo(x-w,y+flap);
    ctx.quadraticCurveTo(x-w*.35,y-flap*.8,x,y);
    ctx.quadraticCurveTo(x+w*.35,y-flap*.8,x+w,y+flap);
    ctx.stroke();
  }
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
// The road wears its own seamless texture plate per biome, over the ground
// plate below it. Same rules as the ground: cosmetic only, one image per name,
// painted from the moment it has decoded and never blocking on it.
const roadImages=new Map();
function getRoadImage(doc,theme,notify=null){
  const base=({forest:'road3-forest',talwald:'road3-forest',urban:'road3-city',outpost:'road3-city',
    scrub:'road3-desert',arctic:'road3-snow',marsh:'road3-marsh',road:'road3-road'})[theme];
  if(!base||!doc?.createElement)return null;
  const name=base+'.jpg';
  if(!roadImages.has(name)){
    const image=doc.createElement('img'),entry={image,ready:false};
    roadImages.set(name,entry);
    image.onload=()=>{entry.ready=true;try{notify?.();}catch{}};
    image.onerror=()=>{entry.failed=true;};
    image.src=`assets/${name}`;
  }
  const entry=roadImages.get(name);
  return entry?.ready?entry.image:null;
}
// Footprints, tank cleats and rail wheel wear left behind by moving units, read
// from the presentation recorder in `ground-tracks.mjs`. Painted per frame ON
// TOP of the cached terrain layer - the marks fade within seconds, so they can
// never be baked into a cache that outlives them.
export function drawGroundTracks(ctx,tracks,theme='road'){
  if(!Array.isArray(tracks)||!tracks.length)return;
  const palette=({
    arctic:{mark:'#1d2b34',edge:'rgba(240,248,252,.55)',boost:1},
    marsh:{mark:'#1f160c',edge:'rgba(220,188,136,.38)',boost:1.05},
    scrub:{mark:'#4e2d15',edge:'rgba(255,244,218,.44)',boost:.98},
    urban:{mark:'#141718',edge:'rgba(182,190,186,.32)',boost:.78},
    outpost:{mark:'#191612',edge:'rgba(186,176,158,.32)',boost:.80},
    junction:{mark:'#191d1b',edge:'rgba(228,236,226,.34)',boost:.85}
  })[theme]||{mark:'#3a2b18',edge:'rgba(232,212,172,.36)',boost:.94};
  for(const m of tracks){
    if(!m||!Number.isFinite(m.x)||!Number.isFinite(m.y)||!Number.isFinite(m.angle)||!(m.alpha>0))continue;
    const baseAlpha=Math.min(.72,m.alpha*palette.boost);
    if(m.kind==='tread'){
      drawTankTreadStamp(ctx,m.x,m.y,m.angle,m.scale||1,palette.mark,palette.edge,Math.min(.68,baseAlpha*.52));
    }else if(m.kind==='rail'){
      ctx.save();
      ctx.globalAlpha=Math.min(.52,baseAlpha*.38);
      ctx.translate(m.x,m.y);ctx.rotate(m.angle);
      ctx.fillStyle=palette.mark;
      for(const side of [-1,1])ctx.fillRect(-5,side*13-1.4,10,2.8);
      ctx.restore();
    }else{
      ctx.save();
      ctx.globalAlpha=Math.min(.72,baseAlpha*.56);
      drawBootStamp(ctx,m.x,m.y,m.angle,m.side||1,m.scale||1,palette.mark,palette.edge);
      ctx.restore();
    }
  }
}
// Marked terrain patches: a tinted ellipse on the road with its field label.
// The state overlays (broken ice, rubble remaining) are drawn per frame in
// drawZoneStates, so the cached layer below stays valid for the whole run.
// Each zone is a small painted diorama, not a tinted disc. Every kind gets
// the same five-layer recipe - ground bleed, depth gradient, shore step,
// interior detail, rim life - in its own palette, so a player reads
// "freezing water" / "deep mud" / "rubble field" at a glance (reported:
// "teilweise einfach nur braun und hingemalt ... es muss Tiefe haben").
const ZONE_STYLES=Object.freeze({
 ice:{fill:'rgba(107,154,163,.5)',deep:'#39697d',halo:'rgba(150,201,212,.15)',shade:'#1d4356',edge:'#d7ece9',detail:'#e8f6f7',label:'THIN ICE'},
 bog:{fill:'rgba(88,77,54,.55)',deep:'#33301c',halo:'rgba(124,112,76,.17)',shade:'#221e12',edge:'#c0b694',detail:'#a89c74',label:'DEEP BOG'},
 rubble:{fill:'rgba(100,95,84,.5)',deep:'#4b4740',halo:'rgba(142,136,122,.15)',shade:'#322f29',edge:'#d0c9b4',detail:'#8a8474',label:'RUBBLE'},
 ambush:{fill:'rgba(71,91,67,.55)',deep:'#26331f',halo:'rgba(112,142,96,.16)',shade:'#172312',edge:'#b0c4a1',detail:'#6f8a4d',label:'AMBUSH TRAIL'},
 dust:{fill:'rgba(168,137,94,.4)',deep:'#8a6f47',halo:'rgba(216,188,142,.18)',shade:'#69512f',edge:'#e0c9a4',detail:'#c9a877',label:'DUST'}
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
  for(let k=0;k<=18;k++){
    const a=k/18*Math.PI*2,rr=zone.r*scale*(1+.13*Math.sin(a*3+wob)+.08*Math.sin(a*5-wob*2));
    const x=zone.x+Math.cos(a)*rr,y=zone.y+Math.sin(a)*rr*.74;
    k?ctx.lineTo(x,y):ctx.moveTo(x,y);
  }
  ctx.closePath();
}
// Interior painters per zone kind. Everything is deterministic per zone id -
// the terrain cache redraws the patch identically forever.
function zoneInterior(ctx,zone,style,rng){
 const r=zone.r,kind=zone.kind;
 if(kind==='ice'){
  // Freeze cracks: radial white veins with small branches.
  ctx.strokeStyle=style.detail;ctx.lineCap='round';
  for(let i=0;i<5+Math.floor(rng()*3);i++){
   const a=rng()*Math.PI*2,len=r*(.34+rng()*.4),x=zone.x+Math.cos(a)*r*.15,y=zone.y+Math.sin(a)*r*.1;
   const ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len*.74;
   ctx.globalAlpha=.55+rng()*.3;ctx.lineWidth=1+rng()*.8;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo((x+ex)/2+(rng()-.5)*10,(y+ey)/2+(rng()-.5)*7);ctx.lineTo(ex,ey);ctx.stroke();
   if(rng()<.7){const t=.5+rng()*.3,bx=x+(ex-x)*t,by=y+(ey-y)*t,ba=a+(rng()<.5?1:-1)*(0.5+rng()*.6);
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+Math.cos(ba)*len*.34,by+Math.sin(ba)*len*.28);ctx.stroke();}
  }
  // Sheen: two soft highlights read as a wet, glassy surface.
  ctx.globalAlpha=.16;ctx.fillStyle='#ffffff';
  oval(ctx,zone.x-r*.3,zone.y-r*.28,r*.34,r*.13,null,null);
  ctx.globalAlpha=.1;oval(ctx,zone.x+r*.24,zone.y+r*.2,r*.26,r*.1,null,null);
  ctx.globalAlpha=1;
 }else if(kind==='bog'){
  // Depth swirls: darker spirals sink in the middle, lighter sludge floats.
  for(let i=0;i<6+Math.floor(rng()*3);i++){
   const a=rng()*Math.PI*2,d=rng()*r*.62,x=zone.x+Math.cos(a)*d,y=zone.y+Math.sin(a)*d*.7;
   ctx.globalAlpha=.3+rng()*.25;
   ctx.fillStyle=rng()<.42?style.detail:style.shade;
   oval(ctx,x,y,r*(.12+rng()*.16),r*(.05+rng()*.06),null,null);
  }
  // Sludge bubbles: dark ring, pale cap.
  for(let i=0;i<4+Math.floor(rng()*3);i++){
   const a=rng()*Math.PI*2,d=rng()*.6*r*(.3+rng()*.55),x=zone.x+Math.cos(a)*d,y=zone.y+Math.sin(a)*d*.7;
   const br=2+rng()*3;ctx.globalAlpha=.8;
   ctx.beginPath();ctx.arc(x,y,br,0,Math.PI*2);ctx.strokeStyle=style.shade;ctx.lineWidth=1.2;ctx.stroke();
   ctx.beginPath();ctx.arc(x-br*.2,y-br*.25,br*.4,0,Math.PI*2);ctx.fillStyle=style.edge;ctx.fill();
  }
  ctx.globalAlpha=1;
 }else if(kind==='rubble'){
  // Broken masonry: angular chunks with a lit top face and a dark joint.
  for(let i=0;i<9+Math.floor(rng()*5);i++){
   const a=rng()*Math.PI*2,d=rng()*r*.68,x=zone.x+Math.cos(a)*d,y=zone.y+Math.sin(a)*d*.7;
   const sr=4+rng()*7,pts=[];
   for(let k=0;k<6;k++){const aa=k/6*Math.PI*2+rng()*.4,rr=sr*(.7+rng()*.5);pts.push([x+Math.cos(aa)*rr,y+Math.sin(aa)*rr*.72]);}
   ctx.beginPath();pts.forEach(([px,py],i2)=>i2?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();
   ctx.globalAlpha=.75;ctx.fillStyle=style.detail;ctx.fill();
   ctx.strokeStyle=style.shade;ctx.lineWidth=1.3;ctx.stroke();
   ctx.globalAlpha=.5;ctx.beginPath();ctx.moveTo(pts[4][0],pts[4][1]);ctx.lineTo(pts[5][0],pts[5][1]);ctx.lineTo(pts[0][0],pts[0][1]);ctx.strokeStyle='#d8d2c0';ctx.lineWidth=1.4;ctx.stroke();
  }
  ctx.globalAlpha=1;
 }else if(kind==='ambush'){
  // Leaf litter and moss clumps: the trail hides under canopy debris.
  for(let i=0;i<10+Math.floor(rng()*6);i++){
   const a=rng()*Math.PI*2,d=rng()*r*.72,x=zone.x+Math.cos(a)*d,y=zone.y+Math.sin(a)*d*.7;
   ctx.save();ctx.translate(x,y);ctx.rotate(rng()*Math.PI);
   ctx.globalAlpha=.4+rng()*.35;ctx.fillStyle=rng()<.6?style.detail:'#8fa05a';
   oval(ctx,0,0,3.4+rng()*3.4,1.6+rng()*1.6,null,null);
   ctx.restore();
  }
  for(let i=0;i<3+Math.floor(rng()*3);i++){
   const a=rng()*Math.PI*2,d=rng()*r*.6,x=zone.x+Math.cos(a)*d,y=zone.y+Math.sin(a)*d*.7;
   ctx.globalAlpha=.5;ctx.strokeStyle='#4c3b28';ctx.lineWidth=1.6;
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(rng()-.5)*16,y+(rng()-.5)*10);ctx.stroke();
  }
  ctx.globalAlpha=1;
 }else{ // dust
  // Dry lakebed: forked cracks and wind-drawn streaks.
  ctx.strokeStyle=style.shade;ctx.lineCap='round';
  for(let i=0;i<5+Math.floor(rng()*3);i++){
   const a=rng()*Math.PI*2,len=r*(.3+rng()*.4),x=zone.x+Math.cos(a)*r*.12,y=zone.y+Math.sin(a)*r*.08;
   ctx.globalAlpha=.5+rng()*.25;ctx.lineWidth=1+rng()*.9;
   ctx.beginPath();ctx.moveTo(x,y);
   ctx.quadraticCurveTo(x+Math.cos(a)*len*.5+(rng()-.5)*12,y+Math.sin(a)*len*.4,x+Math.cos(a)*len,y+Math.sin(a)*len*.7);
   ctx.stroke();
  }
  for(let i=0;i<7+Math.floor(rng()*4);i++){
   const a=rng()*Math.PI*2,d=rng()*.75*r*(.3+rng()*.6),x=zone.x+Math.cos(a)*d,y=zone.y+Math.sin(a)*d*.7;
   ctx.globalAlpha=.4;ctx.fillStyle=style.detail;
   ctx.beginPath();ctx.arc(x,y,1+rng()*1.6,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
 }
}
function drawZone(ctx,zone){
 const style=ZONE_STYLES[zone.kind]||ZONE_STYLES.rubble;
 // Reported: "Gebiete wie Sumpf sehen auch aus als passen sie nicht mehr
 // rein, der nur Kreis" - and later "einfach nur braun und hingemalt, es
 // muss Tiefe haben". Recipe: bleed -> depth gradient -> shore step ->
 // clipped interior diorama -> rim clumps -> the old whisper of a border.
 const rng=detailRng((((zone.id||0)+1)*2654435761)>>>0 ^ zone.kind.length*97);
 ctx.save();
 zoneBlob(ctx,zone,1.16);ctx.fillStyle=style.halo;ctx.fill();
 const grad=radial(ctx,zone.x-zone.r*.24,zone.y-zone.r*.2,zone.r*.08,zone.x,zone.y,zone.r*.98);
 if(grad){grad.addColorStop(0,style.deep);grad.addColorStop(.62,style.fill);grad.addColorStop(1,style.fill);}
 zoneBlob(ctx,zone,.96);ctx.fillStyle=grad||style.fill;ctx.fill();
 // Shore step: an inner rim shadow makes the patch sink below the field.
 zoneBlob(ctx,zone,.88);ctx.globalAlpha=.45;ctx.strokeStyle=style.shade;ctx.lineWidth=6;ctx.stroke();ctx.globalAlpha=1;
 ctx.save();zoneBlob(ctx,zone,.93);ctx.clip();zoneInterior(ctx,zone,style,rng);ctx.restore();
 // Rim life: small clumps sitting on the shoreline.
 for(let i=0;i<9+Math.floor(rng()*5);i++){
  const a=rng()*Math.PI*2,rr=zone.r*(.9+rng()*.16);
  const x=zone.x+Math.cos(a)*rr,y=zone.y+Math.sin(a)*rr*.74;
  ctx.globalAlpha=.5+rng()*.4;
  if(zone.kind==='ice'){ctx.fillStyle='#eef8fa';oval(ctx,x,y,3+rng()*3.4,2+rng()*2,null,null);}
  else if(zone.kind==='bog'){ctx.strokeStyle=style.detail;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(rng()-.5)*4,y-5-rng()*7);ctx.stroke();}
  else{ctx.fillStyle=style.edge;oval(ctx,x,y,2+rng()*3,1.4+rng()*2,null,null);}
 }
 ctx.globalAlpha=1;
 zoneBlob(ctx,zone,.96);ctx.setLineDash([7,9]);ctx.globalAlpha=.55;ctx.strokeStyle=style.edge;ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 ctx.font='bold 10px Georgia';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='rgba(241,231,196,.75)';
 ctx.strokeText(tr(style.label),zone.x,zone.y-zone.r*.72-8);
 ctx.fillStyle='rgba(29,48,40,.85)';ctx.fillText(tr(style.label),zone.x,zone.y-zone.r*.72-8);
 ctx.textAlign='start';ctx.restore();
}
function drawZoneStates(ctx,zones,state){
 for(const zone of zones||[]){
  if(zone.kind==='ice'&&state?.zoneBroken?.[zone.id]){
   // The shelf has gone: dark open water with drifting shards, painted over
   // the cached zone so the state flip reads instantly.
   ctx.save();
   const grad=radial(ctx,zone.x-zone.r*.2,zone.y-zone.r*.15,zone.r*.1,zone.x,zone.y,zone.r*.95);
   if(grad){grad.addColorStop(0,'#1d4356');grad.addColorStop(1,'rgba(51,94,109,.75)');}
   zoneBlob(ctx,zone,.94);ctx.fillStyle=grad||'rgba(51,94,109,.75)';ctx.fill();
   ctx.strokeStyle='#d2eff0';ctx.lineWidth=2;ctx.stroke();
   const rng=detailRng((((zone.id||0)+1)*40503)>>>0);
   for(let i=0;i<9+Math.floor(rng()*5);i++){
    const a=rng()*Math.PI*2,d=(.34+rng()*.56)*zone.r;
    const x=zone.x+Math.cos(a)*d,y=zone.y+Math.sin(a)*d*.72,sz=4+rng()*7,rot=rng()*Math.PI;
    ctx.save();ctx.translate(x,y);ctx.rotate(rot);
    ctx.beginPath();ctx.moveTo(0,-sz*.6);ctx.lineTo(sz*.7,sz*.5);ctx.lineTo(-sz*.7,sz*.45);ctx.closePath();
    ctx.fillStyle='rgba(223,243,246,.9)';ctx.fill();ctx.strokeStyle='#9fd0da';ctx.lineWidth=1.2;ctx.stroke();
    ctx.restore();
   }
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
const DECO_ART={cabin:56,barn:64,stand:44,stilt:46,shed:58,ruin:62,wall:72,factory:68,gate:34,mast:56,forester:64,cross:36,
  // Clutter: the static "totes Leben" set - barrels, carts, crates, rocks,
  // stumps, log piles, fences, signposts. Small widths so the field reads
  // full without anything competing with the buildings.
  barrels:40,cart:46,crates:40,rocks:42,stump:34,logpile:44,fence:44,signpost:30};
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
      // Grounding comes baked into the V3 sprites: they sit on their own
      // earthen plinth with a soft contact shadow, exactly like the towers.
      // On top of that a two-step silhouette shadow (reported: the whole
      // field reads flat, buildings "go under" the ground) - it follows the
      // ink outline, so every piece separates from the busy tile mosaic.
      // The terrain layer caches this once; no per-frame cost.
      ctx.filter='drop-shadow(0 1.5px 1.5px rgba(8,12,8,.55)) drop-shadow(0 4px 6px rgba(8,12,8,.32))';
      ctx.drawImage(artwork,-w/2,13-h,w,h);
      ctx.filter='none';
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
    }else if(d.kind==='barrels'||d.kind==='crates'||d.kind==='logpile'){
      // Clutter stand-ins for the asset-loading window; the painted sprite
      // takes over as soon as it arrives.
      shape(ctx,[[-11,12],[-11,-3],[11,-3],[11,12]],'#7a5c3b',ink,2.5);
      line(ctx,[[-11,4],[11,4]],[ink],1.5);
    }else if(d.kind==='rocks'||d.kind==='stump'){
      oval(ctx,0,7,11,7,d.kind==='stump'?'#6e5a41':'#7d8578',ink,2.5);
    }else if(d.kind==='cart'||d.kind==='fence'||d.kind==='signpost'){
      line(ctx,[[-12,12],[-8,-2]],[ink],3);line(ctx,[[12,12],[8,-2]],[ink],3);
      line(ctx,[[-10,-2],[10,-2]],[ink],2.5);
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
  const doc=ctx.canvas?.ownerDocument,img=doc?getGroundImage(doc,theme,detailRng((groundSeed^0xc2b2ae35)>>>0)()<.5?1:0):null,roadImg=doc?getRoadImage(doc,theme,notify):null;
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
    for(const road of paths)drawRoad(target,road,theme,img,roadImg);thinIce(target,path,theme);bog(target,path,theme);for(const zone of zones)drawZone(target,zone);
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
// Block E field state, painted read-only: a slim life bar in field colours -
// green while holding, amber when worn, red when critical. Always painted
// (full bars included), so every soldier and tower carries its state openly.
function lifeBar(ctx,x,y,width,fraction){
  const f=Math.max(0,Math.min(1,fraction));
  ctx.save();
  ctx.fillStyle='rgba(16,26,21,.72)';ctx.fillRect(x-width/2-1,y-1,width+2,6);
  ctx.fillStyle=f>.5?'#9bd69a':f>.25?'#e9c46a':'#ef7d5c';ctx.fillRect(x-width/2,y,width*f,4);
  ctx.restore();
}
export function drawCartoonBattle(ctx,state,{path,pads,types,me,getTowerRange,theme='road',shotAge=0,effects=[],reducedMotion=false,weatherEffects=true,combatTracers=true,soldierPoses={},towerAims={},groundTracks=[],paths=[path],width=960,height=540,bunkerPosition={x:900,y:400},storyMission=null,storyStage=null,storyTime=0,renderScale=1,artVersion=0,deco=[],zones=[],torches=[],onSpritesReady=null,groundSeed=0}){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';const storyArt=storyMission?prepareStoryArt(ctx.canvas?.ownerDocument):null;drawTerrain(ctx,path,theme,{paths,width,height,storyMission,pads,storyArt,renderScale,artVersion,deco,zones,notify:onSpritesReady,groundSeed});drawZoneStates(ctx,zones,state);fieldZone(ctx,path,state,theme);brokenIce(ctx,path,state,theme);drawGroundTracks(ctx,groundTracks,theme);
  // IPL-0128 Schlacht-Spuren: a painted list of impacts, derived from the
  // shots every viewer already receives. Stored against the canvas per field,
  // capped and pruned by the painter's own clock - painted state only.
  if(!reducedMotion&&combatTracers&&!state.ended){
    const scars=scarList(ctx,me),now=Number.isFinite(storyTime)?storyTime:0;
    for(const s of shotsToDraw(state.shots)){
      const tr=shotTrace(s,shotAge,{renderScale,reducedMotion:false});
      if(!tr||!tr.impact)continue;
      const dup=scars.some(m=>(Number.isInteger(s.id)&&m.sid===s.id)||(Math.abs(m.x-tr.tx)<6&&Math.abs(m.y-tr.ty)<6&&now-m.born<0.5));
      if(dup)continue;
      scars.push({x:tr.tx,y:tr.ty,style:tr.style,sid:Number.isInteger(s.id)?s.id:null,born:now});
      if(scars.length>30)scars.shift();
    }
    for(let i=scars.length-1;i>=0;i--)if(now-scars[i].born>14)scars.splice(i,1);
    ctx.save();
    for(const m of scars){
      const age=Math.max(0,now-m.born);
      ctx.globalAlpha=Math.max(0.15,0.6-age*0.03);
      const r=m.style==='cannon'?9:m.style==='sniper'?4.5:6;
      oval(ctx,m.x,m.y,r,r*.62,'#463c2a',null);
      if(m.style==='cannon'){for(let k=0;k<4;k++){const ang=k*(Math.PI/2)+0.4+m.x*.01;
        line(ctx,[[m.x+Math.cos(ang)*r*.5,m.y+Math.sin(ang)*r*.35],[m.x+Math.cos(ang)*r*1.5,m.y+Math.sin(ang)*r*1.05]],'#3a3226',1.4);}}
    }
    ctx.restore();
  }
  if(storyMission){if(weatherEffects)drawStoryAtmosphere(ctx,storyMission,storyTime,reducedMotion,width,height,path,pads);drawStoryObjective(ctx,storyMission,storyStage,storyTime,reducedMotion,storyArt);}else if(!reducedMotion&&weatherEffects)ambient(ctx,theme,storyTime,width,height);if(!reducedMotion&&weatherEffects)ambientLife(ctx,theme,storyTime,width,height,state.shots,shotAge);const approach=path.length>1?Math.atan2(bunkerPosition.y-path[path.length-2].y,bunkerPosition.x-path[path.length-2].x):0;
  // IPL-0128 Wellen-Ruhe: between waves, while the field is not ended and the
  // bunker lives, the painting is allowed to breathe (chimney, flag, soldier).
  const lull=!state.running&&!state.ended&&(state.hp??100)>0;
  const nowSec=Number.isFinite(storyTime)?storyTime:0;
  // IPL-0128 Treffer-Feedback: fresh impacts from the same shot list the
  // tracers paint - position based, no enemy ids, nothing new on the wire.
  const hitMarks=[];
  if(!reducedMotion&&combatTracers&&!state.ended){
    for(const s of shotsToDraw(state.shots)){
      const tr=shotTrace(s,shotAge,{renderScale,reducedMotion:false});
      if(tr&&tr.impact&&tr.impact.alpha>0)hitMarks.push(tr);
    }
  }
  // The bunker flinches when it takes a hit - the impact effect carries the
  // timing, the shake is a decaying wobble around the flinch.
  const hit=!reducedMotion&&(effects||[]).find(f=>f&&f.kind==='bunkerHit');
  const flinch=hit?Math.max(0,1-(hit.progress||0))*3.2:0;
  const fx=flinch?flinch*Math.sin((hit.progress||0)*34):0,fy=flinch?flinch*Math.cos((hit.progress||0)*29):0;
  ctx.save();ctx.translate(bunkerPosition.x+fx,bunkerPosition.y+fy);bunker(ctx,state,onSpritesReady,approach,Number.isFinite(storyTime)?storyTime:0,!reducedMotion);ctx.restore();
  drawTorches(ctx,torches,theme,storyTime,reducedMotion,onSpritesReady);
  if(!reducedMotion&&weatherEffects&&state.hp>0&&state.hp/Math.max(1,state.maxHp||100)<.35){const t=Number.isFinite(storyTime)?storyTime:0;ctx.save();ctx.globalAlpha=.28;for(let i=0;i<3;i++){const phase=((t*.3+i/3)%1+1)%1;oval(ctx,bunkerPosition.x+20+Math.sin(t+i)*3,bunkerPosition.y-18-phase*25,3+phase*5,2+phase*3,'#465447',null);}ctx.restore();}
  // IPL-0128: between waves the stack breathes a thin, calm wisp - lighter
  // than the damage smoke and on only when the field itself is at rest.
  if(lull&&!reducedMotion&&weatherEffects){
    const ct=Number.isFinite(storyTime)?storyTime:0;
    ctx.save();ctx.globalAlpha=.2;
    for(let i=0;i<3;i++){const phase=((ct*.12+i/3)%1+1)%1;
      oval(ctx,bunkerPosition.x+20+Math.sin(ct*.6+i*2.1)*2.5,bunkerPosition.y-18-phase*30,2.6+phase*4,2+phase*3,'#a8b0a3',null);}
    ctx.restore();
  }
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
  const selected=state.towers.find(t=>t.pad===state.selectedPad);if(selected&&!state.ended){const p=pads[selected.pad];ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,getTowerRange(selected),0,Math.PI*2);ctx.fillStyle='rgba(139,190,173,.14)';ctx.fill();ctx.globalAlpha=reducedMotion?1:.88+.12*Math.sin(storyTime/.42);ctx.strokeStyle='#c2dfd2';ctx.lineWidth=2.2;ctx.setLineDash([6,5]);ctx.stroke();ctx.restore();}
  if(!reducedMotion)for(const tower of state.towers){const owner=state.players[tower.ownerId],p=pads[tower.pad];if(p&&owner?.active!==false&&owner?.overdrive>0){ctx.beginPath();ctx.ellipse(p.x,p.y,31,27,0,0,Math.PI*2);ctx.strokeStyle='#fff1a3';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);}}
  const selectionPulse=reducedMotion?1:.85+.15*Math.sin(storyTime/.3);
  // IPL-0128: an upgrade effect landing on this pad pulses its level badge.
  // The caller only forwards the effect's own progress - presentation only.
  pads.forEach((p,i)=>{
    let levelFx=null;
    if(!reducedMotion&&combatTracers)for(const ef of effects){
      if(!ef||(ef.kind!=='upgrade'&&ef.kind!=='classUpgrade'&&ef.kind!=='build'))continue;
      if(Math.abs(ef.x-p.x)<26&&Math.abs(ef.y-p.y)<26){levelFx=Number.isFinite(ef.progress)?ef.progress:null;break;}
    }
    pad(ctx,p,state.towers.find(t=>t.pad===i),state.selectedPad===i,types,onSpritesReady,selectionPulse,towerAims?towerAims[i]:null,levelFx);
  });
  // Block E: a damaged tower carries its life above the pad; at zero it sits
  // dark on its pad until repaired, and a running repair shows its mark.
  for(const tower of state.towers){const p=pads[tower.pad],maxHp=tower.maxHp;if(!p||!maxHp)continue;const hp=tower.hp??maxHp;if(hp<=0){ctx.save();ctx.globalAlpha=.45;ctx.beginPath();ctx.ellipse(p.x,p.y,26,22,0,0,Math.PI*2);ctx.fillStyle='#101a15';ctx.fill();ctx.restore();}if(hp>0)lifeBar(ctx,p.x,p.y-34,36,hp/maxHp);if(tower.repairing>0){
      oval(ctx,p.x+15,p.y-31,4,4,'#ffe3a8','#192b23',1);
      // IPL-0128 Reparatur-Funken: kleine Funken spruehen vom Werkstueck -
      // Phase aus der Maler-Uhr, keine Uhr und kein Zustand auf dem Draht.
      if(!reducedMotion){
        const rt=Number.isFinite(storyTime)?storyTime:0;
        ctx.save();
        for(let i=0;i<3;i++){
          const ph=(((rt*2.6+i/3+tower.pad*.17)%1)+1)%1;
          const a=ph*Math.PI*1.6+tower.pad*.9,r=5+ph*13;
          ctx.globalAlpha=(1-ph)*.85;
          oval(ctx,p.x+15+Math.cos(a)*r,p.y-31-Math.sin(ph*Math.PI)*9+Math.sin(a)*3,1.7,1.3,'#ffe9a0',null);
        }
        ctx.restore();
      }
    }}
  // The soldier is drawn from the first frame, not from wave one. He used to appear
  // only while `state.wave>0`, and since the movement order itself was accepted
  // before the first deploy (the simulation walks him there), the hero moved
  // invisibly: the newest player tapped the ground, got "Hero moving to position",
  // and watched nothing happen. A hero you cannot see is a hero you cannot command.
  for(const p of Object.values(state.players))if(p.active!==false){if(state.wave>0&&p.mobileSupply?.remaining>0){ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,22,0,Math.PI*2);ctx.strokeStyle='#89d9ed';ctx.lineWidth=3;ctx.stroke();ctx.restore();}soldier(ctx,p,p.id===me,soldierPoses[p.id],undefined,onSpritesReady);
    // IPL-0128 Wellen-Ruhe: zwischen den Wellen blickt der Held sich um
    // und prueft sein Gewehr - zwei kleine Maler-Zeichen aus derselben
    // Uhr wie das Ambient, kein Zustand, kein Pose-Eingriff.
    if(lull&&!reducedMotion&&!(p.downed>0)&&!(soldierPoses[p.id]||{}).moving){
      const it=Number.isFinite(storyTime)?storyTime:0;
      const cyc=(((it*.42+(p.x*.013+p.y*.017))%1)+1)%1;
      if(cyc<.16){
        const g=Math.sin(cyc/.16*Math.PI);
        ctx.save();ctx.globalAlpha=.7*g;
        line(ctx,[[p.x-11,p.y-26],[p.x-6,p.y-30]],paper,1.6);
        line(ctx,[[p.x-13,p.y-21],[p.x-8,p.y-24]],paper,1.4);
        ctx.restore();
      }else if(cyc>.5&&cyc<.62){
        const g=Math.sin((cyc-.5)/.12*Math.PI);
        ctx.save();ctx.globalAlpha=.9*g;
        star(ctx,p.x+8*(((soldierPoses[p.id]||{}).facing||1)),p.y-12,3.2);ctx.fillStyle='#fdf6e0';ctx.fill();
        ctx.restore();
      }
    }
    if(Number.isFinite(p.hp))lifeBar(ctx,p.x,p.y-30,30,p.hp/SOLDIER_MAX_HP);if(p.downed>0){ctx.save();ctx.fillStyle='#ffd9c2';ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.fillText(String(Math.ceil(p.downed)),p.x,p.y-36);ctx.restore();}}
  if(theme==='scrub'&&path.length===10)for(const cloud of state.dustClouds||[]){
    ctx.save();ctx.beginPath();ctx.arc(cloud.x,cloud.y,75,0,Math.PI*2);ctx.fillStyle='rgba(210,168,119,.12)';ctx.fill();ctx.strokeStyle='rgba(133,88,57,.45)';ctx.lineWidth=2;ctx.setLineDash(reducedMotion?[]:[4,9]);ctx.stroke();ctx.restore();
  }
  if(theme==='scrub'&&path.length===10)for(const e of state.enemies)if(e.kind==='tank'&&e.hp>0){
    ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,75,0,Math.PI*2);ctx.fillStyle='rgba(210,168,119,.18)';ctx.fill();ctx.strokeStyle='rgba(133,88,57,.65)';ctx.lineWidth=2;ctx.setLineDash([6,7]);ctx.stroke();ctx.restore();
  }
  if(state.running&&Object.values(state.players).some(p=>p.active!==false&&p.healingField?.remaining>0)){ctx.save();ctx.beginPath();ctx.arc(bunkerPosition.x,bunkerPosition.y,58,0,Math.PI*2);ctx.fillStyle='rgba(139,218,148,.16)';ctx.fill();ctx.strokeStyle='#9bd69a';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
  for(const e of state.enemies){
    // Block E telegraph: the winding enemy and its target carry the warning
    // ring, so a player can still step out or brace before the strike.
    if(e.windup){const targetPoint=e.windup.kind==='tower'?pads[e.windup.pad]:state.players[e.windup.id];ctx.save();ctx.strokeStyle='#ef9d60';ctx.lineWidth=2.4;ctx.setLineDash(reducedMotion?[]:[5,4]);ctx.beginPath();ctx.arc(e.x,e.y,16,0,Math.PI*2);ctx.stroke();if(targetPoint){ctx.beginPath();ctx.arc(targetPoint.x,targetPoint.y,e.windup.kind==='tower'?30:20,0,Math.PI*2);ctx.stroke();}ctx.restore();}
    if(e.siegeMarks?.some(m=>m.time>0)){ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,20,0,Math.PI*2);ctx.strokeStyle='#f3a45c';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
    if(e.boss==='bossBomber'&&bossPhase(e)==='bomb-warning'){
      ctx.save();ctx.strokeStyle='#f2aa78';ctx.lineWidth=3;ctx.setLineDash(reducedMotion?[]:[7,6]);ctx.beginPath();ctx.arc(bunkerPosition.x,bunkerPosition.y,36,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(e.marked>0&&e.markedByAirDefense){
      ctx.save();ctx.beginPath();ctx.arc(e.x,e.y,19,0,Math.PI*2);ctx.strokeStyle='#f284a8';ctx.lineWidth=2.4;ctx.setLineDash(reducedMotion?[]:[4,4]);ctx.stroke();ctx.setLineDash([]);
      oval(ctx,e.x,e.y-21,3,3,'#ffe3a8','#192b23',1);ctx.restore();
    }
    if(e.boss==='bossBomber'&&e.bossFlash>0&&!reducedMotion)burst(ctx,bunkerPosition.x,bunkerPosition.y,20+(1-e.bossFlash)*12,'#ef9e68');
    if(e.boss==='bossJuggernaut'&&e.bossFlash>0&&!reducedMotion)burst(ctx,e.x,e.y-20,15,'#cce7a2');
    let hit=0;
    for(const tr of hitMarks){const d=Math.hypot(tr.tx-e.x,tr.ty-e.y);if(d<(e.boss?30:17)&&tr.impact.alpha>hit)hit=tr.impact.alpha;}
    // IPL-0128: dust reads the tread marks the sampler stamped - actual
    // movement, so a standing column stops puffing between waves.
    let dust=state.running?0.7:0;
    if(Array.isArray(groundTracks)&&groundTracks.length){
      let fresh=0;
      for(const m of groundTracks){
        if(!m||(m.kind!=='tread'&&m.kind!=='rail'))continue;
        const age=nowSec-(Number.isFinite(m.bornAt)?m.bornAt:-99);
        if(age<0||age>2.2)continue;
        if(Math.abs(m.x-e.x)<60&&Math.abs(m.y-e.y)<44)fresh++;
      }
      dust=Math.min(1,fresh/2);
    }
    ctx.save();if(state.running&&!reducedMotion){const offset=Math.sin((Number.isFinite(storyTime)?storyTime:0)*5+(e.x+e.y)*.035)*(e.kind==='plane'?.8:1.2);ctx.translate(0,offset);}
    // The struck unit wobbles with the same freshness the impact draws with.
    if(hit>0)ctx.translate(Math.sin(hit*51+e.x)*2.6*hit,Math.cos(hit*37+e.y)*1.4*hit);// Where is this unit going? The next path point gives the heading, the
    // bend after it gives the bank - read from geometry, never stored.
    const road=paths[e.road]||paths[0];let heading=0,bank=0;
    if(road&&Array.isArray(road)&&road.length>1&&Number.isFinite(e.segment)){
      const at=Math.max(0,Math.min(road.length-1,e.segment)),from=road[Math.max(0,at-1)],to=road[at],next=road[Math.min(road.length-1,at+1)];
      const dx=to.x-from.x,dy=to.y-from.y,nd=next.x-to.x,ny=next.y-to.y;
      if(Math.hypot(dx,dy)>1)heading=Math.atan2(dy,dx);
      if(Math.hypot(nd,ny)>1){let turn=Math.atan2(ny,nd)-heading;while(turn>Math.PI)turn-=Math.PI*2;while(turn<-Math.PI)turn+=Math.PI*2;bank=turn;}
    }
    enemy(ctx,e,reducedMotion,onSpritesReady,heading,bank,Number.isFinite(storyTime)?storyTime:0,theme==='junction',Math.min(1,dust),hit);ctx.restore();
  }
  // A busy field fires more shots than it can show. The oldest are left out of
  // the paint - they still happened, they still hit, they simply do not lie
  // across the battlefield any more than the newest two dozen do.
  if(!state.ended)for(const s of shotsToDraw(state.shots))drawShot(ctx,s,shotAge,reducedMotion||!combatTracers,renderScale);
  if(!reducedMotion&&combatTracers)for(const pop of state.combatPops||[]){const life=Math.max(0,pop.life-shotAge);if(life>0){ctx.save();ctx.globalAlpha=Math.min(1,life/.35);burst(ctx,pop.x,pop.y,(pop.boss?25:10)+(1-life/.65)*(pop.boss?20:10),pop.boss?'#f5ae70':'#ebd69e');
    // V3 deaths: embers fly outward in the emblem's metals and a smoke wisp
    // rises off the wreck - a kill reads as a strike, not a popped bubble.
    const age=1-life/.65;
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2+pop.x*.013,d=age*(pop.boss?34:17),ex=pop.x+Math.cos(a)*d,ey=pop.y+Math.sin(a)*d-age*age*10;
      ctx.beginPath();ctx.arc(ex,ey,2.2*(1-age)+.6,0,Math.PI*2);ctx.fillStyle=i%2?'#f0d68a':'#d9dde1';ctx.fill();}
    oval(ctx,pop.x+Math.sin(age*7)*2,pop.y-8-age*16,5+age*7,4+age*5,`rgba(78,84,78,${(.34*(1-age)).toFixed(3)})`,null);
    ctx.restore();}}
  if(!reducedMotion&&combatTracers)for(const effect of effects)drawAbility(ctx,effect);
  // IPL-0128 Blitz: a short double flash over the marsh, hard-timed from the
  // painter's own clock - a weather feeling, not a weather state.
  if(!reducedMotion&&weatherEffects&&!storyMission&&theme==='marsh'){
    const lt=Number.isFinite(storyTime)?storyTime:0,ph=lt%19;
    let glow=0;
    if(ph<0.09)glow=0.16*(1-ph/0.09);
    else if(ph>0.16&&ph<0.24)glow=0.09*(1-Math.abs(ph-0.2)/0.04);
    if(glow>0){ctx.save();ctx.globalAlpha=glow;ctx.fillStyle='#eef4ff';ctx.fillRect(0,0,width,height);ctx.restore();}
  }
  ctx.restore();
}

// IPL-0128 Schlacht-Spuren: the painter's own list of impacts, keyed by the
// canvas and the field's `me` so own and rival lanes keep separate ground.
// Capped, pruned by the painter's clock, never touching simulation state.
const scarField=new WeakMap();
function scarList(ctx,me){
  let byMe=scarField.get(ctx);
  if(!byMe){byMe=new Map();scarField.set(ctx,byMe);}
  const key=String(me??'');
  let list=byMe.get(key);
  if(!list){list=[];byMe.set(key,list);}
  return list;
}
function burst(ctx,x,y,r,fill){
  const points=[];for(let i=0;i<16;i++){const a=Math.PI*i/8,d=i%2?r*.52:r;points.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}
  // V3: the emblem language - every flash carries the polished silver rim.
  shape(ctx,points,fill,'#d9dde1',3.5);
  ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.closePath();ctx.strokeStyle=ink;ctx.lineWidth=1.25;ctx.stroke();
}
// The gold field star - the emblem's heart - as an FX flash shape.
function star(ctx,x,y,r){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,d=i%2?r*.45:r;const px=x+Math.cos(a)*d,py=y+Math.sin(a)*d;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
function drawShot(ctx,s,age,reduced,renderScale=1){
  // A short streak that RUNS from the barrel to the target, a flash where it
  // leaves, a mark where it lands. The whole line at once is what buried the
  // field before: enemies, roads and warnings disappeared behind it.
  const t=shotTrace(s,age,{renderScale,reducedMotion:reduced});if(!t)return;
  ctx.save();ctx.globalAlpha=.2*t.alpha;line(ctx,[[t.tail.x+2,t.tail.y+3],[t.head.x+2,t.head.y+3]],'#0c120e',t.ink);
  ctx.globalAlpha=t.alpha;
  line(ctx,[[t.tail.x,t.tail.y],[t.head.x,t.head.y]],ink,t.ink);
  line(ctx,[[t.tail.x,t.tail.y],[t.head.x,t.head.y]],t.colour,t.core);
  // The bright tip says which way it is going - a streak without a head is a
  // scratch on the screen, not a shot.
  ctx.beginPath();ctx.arc(t.head.x,t.head.y,t.tip,0,Math.PI*2);ctx.fillStyle='#fff8e2';ctx.fill();
  ctx.restore();
  if(reduced)return;
  ctx.save();
  if(t.flash){
    ctx.globalAlpha=Math.max(0,t.flash.alpha);
    star(ctx,t.x,t.y,t.flash.r);ctx.fillStyle='#f0d68a';ctx.fill();ctx.strokeStyle='#d9dde1';ctx.lineWidth=1.6;ctx.stroke();
    burst(ctx,t.x,t.y,t.flash.r*.8,'#ffe39b');
  }
  if(t.impact){
    ctx.globalAlpha=Math.max(0,t.impact.alpha);
    if(t.style==='cannon'){
      // A shell lands heavy: a warm ring, then the struck spark.
      ctx.beginPath();ctx.arc(t.tx,t.ty,t.impact.r,0,Math.PI*2);ctx.strokeStyle='#f0aa72';ctx.lineWidth=2.4;ctx.stroke();
      burst(ctx,t.tx,t.ty,t.impact.r*.6,'#e89964');
    }else if(t.style==='flak'){
      // Flak opens in the air: two rings, the outer one thinner and fainter.
      ctx.beginPath();ctx.arc(t.tx,t.ty,t.impact.r,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=2;ctx.stroke();
      ctx.globalAlpha=Math.max(0,t.impact.alpha*.6);
      ctx.beginPath();ctx.arc(t.tx,t.ty,t.impact.r*.55,0,Math.PI*2);ctx.strokeStyle='#f6d787';ctx.lineWidth=1.6;ctx.stroke();
      ctx.globalAlpha=Math.max(0,t.impact.alpha);
      burst(ctx,t.tx,t.ty,t.impact.r*.45,'#f6d787');
    }else if(t.style==='sniper'){
      // A crack: a small hard ring and four short spokes where it hit.
      ctx.beginPath();ctx.arc(t.tx,t.ty,t.impact.r*.8,0,Math.PI*2);ctx.strokeStyle='#e6e0f2';ctx.lineWidth=1.6;ctx.stroke();
      const spokes=t.impact.r*1.5;
      for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;line(ctx,[[t.tx-Math.cos(a)*spokes*.35,t.ty-Math.sin(a)*spokes*.35],[t.tx+Math.cos(a)*spokes*.9,t.ty+Math.sin(a)*spokes*.9]],'#e6e0f2',1.4);}
    }else{
      ctx.beginPath();ctx.arc(t.tx,t.ty,t.impact.r,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=2;ctx.stroke();
      burst(ctx,t.tx,t.ty,t.impact.r*.55,'#f6d787');
    }
  }
  ctx.restore();
}
function drawAbility(ctx,e){
  const t=e.progress,fade=Math.max(0,1-t);ctx.save();ctx.globalAlpha=fade;
  if(e.kind==='bunkerHit'){
    // V3: iron smoke rising off the hit, the flash in emblem colours.
    ctx.beginPath();ctx.arc(e.x,e.y,10+30*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=3.5-2.5*t;ctx.stroke();
    burst(ctx,e.x,e.y,16+16*t,'#f0b47a');
    for(let i=0;i<3;i++){const rise=t*34,side=(i-1)*11;oval(ctx,e.x+side+Math.sin(t*6+i)*3,e.y-14-rise-i*7,7+4*t,5+3*t,`rgba(78,84,78,${(.4*fade).toFixed(3)})`,null);}
    ctx.fillStyle='#fff1ca';ctx.strokeStyle=ink;ctx.lineWidth=4;ctx.font='bold 16px Georgia';ctx.textAlign='center';ctx.strokeText(e.label||tr('BUNKER HIT'),e.x,e.y-45-15*t);ctx.fillText(e.label||tr('BUNKER HIT'),e.x,e.y-45-15*t);
  }else if(e.kind==='soldierHit'||e.kind==='towerHit'){
    // Block E hit flash: shape carries the meaning, not colour alone - a
    // ring blooms on the struck soldier, a diamond on the struck tower -
    // and the lost life climbs away as a number.
    if(e.kind==='towerHit'){ctx.save();ctx.translate(e.x,e.y-12);ctx.rotate(Math.PI/4);ctx.strokeStyle='#f2a65c';ctx.lineWidth=3-2*t;ctx.strokeRect(-(11+13*t),-(11+13*t),(22+26*t),(22+26*t));ctx.restore();}
    else{ctx.beginPath();ctx.arc(e.x,e.y-12,10+24*t,0,Math.PI*2);ctx.strokeStyle='#f2a65c';ctx.lineWidth=3-2*t;ctx.stroke();}
    burst(ctx,e.x,e.y-12,9+11*t,'#ef9d60');
    ctx.fillStyle='#ffe3c2';ctx.strokeStyle=ink;ctx.lineWidth=3.5;ctx.font='bold 14px Georgia';ctx.textAlign='center';
    const label=e.label||tr('HIT');ctx.strokeText(label,e.x,e.y-34-14*t);ctx.fillText(label,e.x,e.y-34-14*t);
  }else if(e.kind==='combo'){
    // V3: the combo wears the emblem - a silver ring with the gold star at
    // its heart, the pair's own tint glowing underneath.
    const palette={'Siege Commander':'#f6b273','Iron Bastion':'#f39467','Supply Line':'#e9d37b','Lifeline':'#b0dc9c','Deadeye':'#8acdda','Sky Sovereign':'#f284a8','War Hero':'#f6b273','War Machine':'#f39467','War Economy':'#e9d37b','Bunker Guardian':'#b0dc9c','Ghost Operative':'#8acdda'};
    const tint=palette[e.label]||'#88e3d3',cy=e.y-20;
    const g=radial(ctx,e.x,cy,2,e.x,cy,20+16*t);
    if(g){g.addColorStop(0,tint);g.addColorStop(1,'rgba(120,140,120,0)');ctx.fillStyle=g;}else ctx.fillStyle=tint;
    ctx.beginPath();ctx.arc(e.x,cy,20+16*t,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(e.x,cy,15+14*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=2.5-1.5*t;ctx.stroke();
    star(ctx,e.x,cy,8+5*t);ctx.fillStyle='#f0d68a';ctx.fill();ctx.strokeStyle='#1d3028';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(e.label?e.label.split(' + ').map(name=>tr(name)).join(' + '):tr('COMBO!'),e.x,e.y-43-12*t);
  }else if(e.kind==='assault'){
    const v=e.variant||0,targets=e.targets.length?e.targets:[{x:e.x,y:e.y}];
    if(v===1){
      // Suppressive Bombardment: concussion shock shells + icy suppression dust halo.
      for(const p of targets){
        ctx.beginPath();ctx.arc(p.x,p.y,8+30*t,0,Math.PI*2);ctx.strokeStyle='#9fd5e8';ctx.lineWidth=3-2*t;ctx.stroke();
        ctx.beginPath();ctx.arc(p.x,p.y,5+18*t,0,Math.PI*2);ctx.strokeStyle='#f3be7a';ctx.lineWidth=2.4-1.4*t;ctx.stroke();
        burst(ctx,p.x,p.y,9+10*t,'#f2c57c');
      }
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('SUPPRESSIVE BOMBARDMENT'),e.x,e.y-42-12*t);
    }else if(v===2){
      // Precision Strike: vertical orbital laser lock + crimson-gold crosshair burst on strongest target.
      const p=targets[0];
      const beamTop=Math.max(0,p.y-220*(1-t*.3));
      line(ctx,[[p.x,beamTop],[p.x,p.y]],'#ffdf9a',6-4*t);
      line(ctx,[[p.x,beamTop],[p.x,p.y]],'#f07f65',2.5);
      ctx.beginPath();ctx.arc(p.x,p.y,14+20*(1-t),0,Math.PI*2);ctx.strokeStyle='#f07f65';ctx.lineWidth=2.5;ctx.stroke();
      line(ctx,[[p.x-22,p.y],[p.x+22,p.y]],'#ffdf9a',1.8);line(ctx,[[p.x,p.y-22],[p.x,p.y+22]],'#ffdf9a',1.8);
      star(ctx,p.x,p.y,12+12*t);ctx.fillStyle='#ffdf9a';ctx.fill();
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('PRECISION STRIKE'),p.x,p.y-36-12*t);
    }else{
      // Airstrike: silver shock ring, warm ground light, burning gold star.
      for(const p of targets){
        ctx.beginPath();ctx.arc(p.x,p.y,6+26*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=3-2*t;ctx.stroke();
        const g=radial(ctx,p.x,p.y,1,p.x,p.y,14+22*t);
        if(g){g.addColorStop(0,'rgba(255,236,170,.85)');g.addColorStop(1,'rgba(255,190,110,0)');ctx.fillStyle=g;}else ctx.fillStyle='#f9dc91';
        ctx.beginPath();ctx.arc(p.x,p.y,14+22*t,0,Math.PI*2);ctx.fill();
        star(ctx,p.x,p.y,9+13*t);ctx.fillStyle='#f0d68a';ctx.fill();ctx.strokeStyle='#d9dde1';ctx.lineWidth=2;ctx.stroke();
      }
    }
  }else if(e.kind==='airDefense'){
    const v=e.variant||0,targets=e.targets.length?e.targets:[{x:e.x,y:e.y}],hx=Number.isFinite(e.hx)?e.hx:e.x,hy=Number.isFinite(e.hy)?e.hy:e.y;
    if(v===1){
      // Spotter Barrage: twin sweeping radar cones + cyan-rose crosshair pings on every target.
      for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(hx,hy-10,20+64*t+i*22,0,Math.PI*2);ctx.strokeStyle=i?'#8edbe8':'#f284a8';ctx.lineWidth=2.8-1.5*t;ctx.stroke();}
      for(const p of targets){
        line(ctx,[[hx,hy-12],[p.x,p.y]],'rgba(242,132,168,.55)',1.8);
        ctx.beginPath();ctx.arc(p.x,p.y,10+16*(1-t),0,Math.PI*2);ctx.strokeStyle='#f59eb8';ctx.lineWidth=2.2;ctx.stroke();
        star(ctx,p.x,p.y,7+8*t);ctx.fillStyle='#ffe2a8';ctx.fill();
      }
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('SPOTTER BARRAGE'),hx,hy-44-12*t);
    }else if(v===2){
      // Flak Curtain: crystalline iron dome arch + vertical flak tracer streaks at all planes & ground targets.
      ctx.beginPath();ctx.arc(hx,hy,26+96*t,Math.PI,0);ctx.strokeStyle='#f284a8';ctx.lineWidth=3.5-2*t;ctx.stroke();
      ctx.beginPath();ctx.arc(hx,hy,16+74*t,Math.PI,0);ctx.setLineDash([7,5]);ctx.strokeStyle='#a8f0e8';ctx.lineWidth=2.2;ctx.stroke();ctx.setLineDash([]);
      for(const p of targets){
        const sx=hx+(p.x-hx)*Math.min(1,t*1.5),sy=hy+(p.y-hy)*Math.min(1,t*1.5);
        line(ctx,[[hx,hy-10],[sx,sy]],'#ffd98e',2.4);
        burst(ctx,p.x,p.y,10+14*t,p.air?'#9ef0e4':'#f59eb8');
      }
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('FLAK CURTAIN'),hx,hy-46-12*t);
    }else{
      ctx.beginPath();ctx.arc(e.x,e.y-12,18+52*t,0,Math.PI*2);ctx.strokeStyle='#f284a8';ctx.lineWidth=3-2*t;ctx.stroke();
      for(const p of targets){
        ctx.beginPath();ctx.arc(p.x,p.y,8+20*t,0,Math.PI*2);ctx.strokeStyle='#d9dde1';ctx.lineWidth=2.5-1.5*t;ctx.stroke();
        burst(ctx,p.x,p.y,8+10*t,'#f59eb8');
      }
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('SKY SWEEP'),e.x,e.y-42-12*t);
    }
  }else if(e.kind==='build'||e.kind==='upgrade'||e.kind==='classUpgrade'){
    // V3: a stamp in the emblem's metal - silver ring, iron smoke for a new
    // emplacement, the gold star for a level gained.
    // IPL-0128 Level-Up-Blitz: a bright bloom punches out of the pad while
    // the effect is fresh, under the ring - the upgrade reads as an event.
    if(t<0.5){
      const bt=1-t*2;
      const g=radial(ctx,e.x,e.y-6,2,e.x,e.y-6,12+46*t);
      if(g){g.addColorStop(0,`rgba(255,246,214,${(0.85*bt).toFixed(3)})`);g.addColorStop(1,'rgba(255,246,214,0)');ctx.fillStyle=g;}
      else ctx.fillStyle='#fff6d8';
      ctx.save();ctx.globalAlpha=bt*0.7;ctx.beginPath();ctx.arc(e.x,e.y-6,10+44*t,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    ctx.beginPath();ctx.arc(e.x,e.y-12,12+14*t,0,Math.PI*2);ctx.strokeStyle=e.kind==='classUpgrade'?'#f0c478':'#d9dde1';ctx.lineWidth=3-2*t;ctx.stroke();
    if(e.kind==='build'){burst(ctx,e.x,e.y-12,9+8*t,'#b8d69d');for(let i=0;i<2;i++)oval(ctx,e.x+(i?7:-7),e.y-22-t*16,4+2*t,3+2*t,`rgba(78,84,78,${(.35*fade).toFixed(3)})`,null);}
    else{star(ctx,e.x,e.y-12,8+6*t);ctx.fillStyle=e.kind==='classUpgrade'?'#f39db8':'#f0d68a';ctx.fill();ctx.strokeStyle='#1d3028';ctx.lineWidth=1.5;ctx.stroke();}
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr(e.kind==='build'?'BUILT':e.kind==='classUpgrade'?'CLASS PATH':'UPGRADED'),e.x,e.y-38-12*t);
  }else if(e.kind==='engineer'){
    const v=e.variant||0,targets=e.targets||[];
    for(const p of targets){
      line(ctx,[[e.x,e.y-12],[p.x,p.y]],v===2?'#ffe680':v===1?'#9fd0e8':'rgba(238,212,117,.5)',v===2?2.4:1.6);
      ctx.beginPath();ctx.arc(p.x,p.y,10+18*t,0,Math.PI*2);ctx.strokeStyle=v===2?'#ffd266':v===1?'#9fd0e8':'#d9dde1';ctx.lineWidth=2.5-1.4*t;ctx.stroke();
    }
    ctx.beginPath();ctx.arc(e.x,e.y-20,10+16*t,0,Math.PI*2);ctx.strokeStyle=v===1?'#9fd0e8':'#d9dde1';ctx.lineWidth=3-2*t;ctx.stroke();
    ctx.beginPath();ctx.arc(e.x,e.y-20,16+22*t,0,Math.PI*2);ctx.strokeStyle=v===2?`rgba(255,214,92,${(.8*fade).toFixed(3)})`:`rgba(217,221,225,${(.6*fade).toFixed(3)})`;ctx.lineWidth=2;ctx.stroke();
    if(v===2){star(ctx,e.x,e.y-20,11+12*t);ctx.fillStyle='#ffe89c';ctx.fill();}
    else{const g=radial(ctx,e.x,e.y-20,1,e.x,e.y-20,10+10*t);if(g){g.addColorStop(0,'#ffe9a8');g.addColorStop(1,'rgba(238,212,117,0)');ctx.fillStyle=g;}else ctx.fillStyle='#eed475';ctx.beginPath();ctx.arc(e.x,e.y-20,10+10*t,0,Math.PI*2);ctx.fill();}
    const label=v===1?tr('SUSTAINED OVERDRIVE'):v===2?tr('SURGE OVERDRIVE'):'OVERDRIVE';
    ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(label,e.x,e.y-42-12*t);
  }else if(e.kind==='logistics'){
    const v=e.variant||0,y=e.y-24-12*t;
    oval(ctx,e.x,y+11,13,4,'rgba(12,18,14,.28)',null);
    if(v===1){
      // Heavy Airdrop: canvas parachute canopy overhead + oversized gold-trimmed crate (+45).
      ctx.beginPath();ctx.arc(e.x,y-18,15,Math.PI,0);ctx.fillStyle='#8c9c72';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();
      line(ctx,[[e.x-14,y-18],[e.x-9,y-9]],'#d9dde1',1.4);line(ctx,[[e.x+14,y-18],[e.x+9,y-9]],'#d9dde1',1.4);
      line(ctx,[[e.x,y-33],[e.x,y-9]],'#d9dde1',1.2);
    }else if(v===2){
      // Emergency Supply: teal repair shockwave ring alongside armored crate (+20 / +6 HP).
      ctx.beginPath();ctx.arc(e.x,y,18+24*t,0,Math.PI*2);ctx.strokeStyle='#8ac7b1';ctx.lineWidth=2.5-1.5*t;ctx.stroke();
    }
    shape(ctx,[[e.x-12,y-9],[e.x+12,y-9],[e.x+12,y+9],[e.x-12,y+9]],v===2?'#8fa79a':'#d7b276','#d9dde1',3);
    line(ctx,[[e.x-11,y],[e.x+11,y]],ink,2);line(ctx,[[e.x,y-9],[e.x,y+9]],ink,2);
    star(ctx,e.x,y,5);ctx.fillStyle=v===2?'#9ce8cc':'#f0d68a';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=ink;ctx.font='bold 14px Georgia';ctx.textAlign='center';ctx.fillText(v===1?'+45':v===2?'+20 · +6':'+30',e.x,v===1?y-38:y-16);
  }else if(e.kind==='medic'){
    const v=e.variant||0,hx=Number.isFinite(e.hx)?e.hx:e.x,hy=Number.isFinite(e.hy)?e.hy:e.y;
    const drawCross=(cx,cy,rad,tint)=>{
      ctx.beginPath();ctx.arc(cx,cy,rad+14*t,0,Math.PI*2);ctx.strokeStyle=tint;ctx.lineWidth=2.6;ctx.stroke();
      oval(ctx,cx,cy,rad+8*t,rad+8*t,v===2?'rgba(240,214,138,.78)':'rgba(206,230,166,.85)',null,0);
      shape(ctx,[[cx-4,cy-12],[cx+4,cy-12],[cx+4,cy-4],[cx+12,cy-4],[cx+12,cy+4],[cx+4,cy+4],[cx+4,cy+12],[cx-4,cy+12],[cx-4,cy+4],[cx-12,cy+4],[cx-12,cy-4],[cx-4,cy-4]],'#f1e6c4');
    };
    if(v===1){
      // Heavy Repair: heavy pulse both at the bunker AND hero aura.
      drawCross(910,400,26,'#92e0b9');
      drawCross(hx,hy-12,18,'#92e0b9');
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('HEAVY REPAIR'),910,356-10*t);
    }else if(v===2){
      // Triage: golden sanctuary + mint healing flare on bunker.
      drawCross(e.x,e.y,24,'#f0d68a');
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(`${tr('TRIAGE')} +12`,e.x,e.y-36-10*t);
    }else{
      ctx.beginPath();ctx.arc(e.x,e.y,26+14*t,0,Math.PI*2);ctx.strokeStyle=`rgba(217,221,225,${(.75*fade).toFixed(3)})`;ctx.lineWidth=2.5;ctx.stroke();
      const g=radial(ctx,e.x,e.y,4,e.x,e.y,22+12*t);
      if(g){g.addColorStop(0,'rgba(206,230,166,.85)');g.addColorStop(1,'rgba(206,230,166,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(e.x,e.y,22+12*t,0,Math.PI*2);ctx.fill();}
      oval(ctx,e.x,e.y,22+12*t,22+12*t,'#cee6a6',null,0);shape(ctx,[[e.x-4,e.y-12],[e.x+4,e.y-12],[e.x+4,e.y-4],[e.x+12,e.y-4],[e.x+12,e.y+4],[e.x+4,e.y+4],[e.x+4,e.y+12],[e.x-4,e.y+12],[e.x-4,e.y+4],[e.x-12,e.y+4],[e.x-12,e.y-4],[e.x-4,e.y-4]],'#f1e6c4');
    }
  }else if(e.kind==='recon'){
    const v=e.variant||0,targets=e.targets||[];
    if(v===2){
      // Targeted Disruption: crisp cyan laser sightlines from hero onto enemies + disruption bursts.
      for(const p of targets){
        line(ctx,[[e.x,e.y-8],[p.x,p.y]],'#7fe3ff',2);
        ctx.beginPath();ctx.arc(p.x,p.y,8+14*(1-t),0,Math.PI*2);ctx.strokeStyle='#7fe3ff';ctx.lineWidth=2;ctx.stroke();
        burst(ctx,p.x,p.y,6+8*t,'#b6f2ff');
      }
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr('TARGETED DISRUPTION'),e.x,e.y-38-12*t);
    }else{
      for(let i=0;i<(v===1?3:2);i++){ctx.beginPath();ctx.arc(e.x,e.y,16+36*t+i*15,0,Math.PI*2);ctx.strokeStyle=v===1?'#a4d8f0':'#d9dde1';ctx.lineWidth=3.5-i;ctx.stroke();}
      ctx.beginPath();ctx.arc(e.x,e.y,10+36*t,0,Math.PI*2);ctx.setLineDash([6,5]);ctx.strokeStyle='#f0d68a';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=ink;ctx.font='bold 13px Georgia';ctx.textAlign='center';ctx.fillText(tr(v===1?'EXTENDED SUPPRESSION':'SUPPRESSION'),e.x,e.y-35-12*t);
    }
  }
  ctx.restore();
}
