// Geometry for the large four-player battlefield. Coordinates are in logical
// canvas pixels, independent of CSS size and device pixel ratio.
const finitePositive=n=>Number.isFinite(n)&&n>0;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function validPoint(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y);}
function validate(v){
  if(!v||![v.worldWidth,v.worldHeight,v.width,v.height,v.scale].every(finitePositive)||!Number.isFinite(v.x)||!Number.isFinite(v.y))throw Error('Invalid viewport');
}
function bounded(v){
  const visibleWidth=v.width/v.scale,visibleHeight=v.height/v.scale;
  return {...v,x:visibleWidth>=v.worldWidth?(v.worldWidth-visibleWidth)/2:clamp(v.x,0,v.worldWidth-visibleWidth),y:visibleHeight>=v.worldHeight?(v.worldHeight-visibleHeight)/2:clamp(v.y,0,v.worldHeight-visibleHeight)};
}
const fitScale=v=>Math.min(v.width/v.worldWidth,v.height/v.worldHeight);
const fillScale=v=>Math.max(v.width/v.worldWidth,v.height/v.worldHeight);
// A tall phone needs more than 3× the overview scale just to fill its screen
// with a wide map. Leave some extra headroom for precise touch selection.
const maxScale=v=>Math.max(fitScale(v)*3,fillScale(v)*1.5);
// Fit the whole map initially; callers can choose a closer opening view.
export function createBattleViewport(worldWidth,worldHeight,width,height){
  if(![worldWidth,worldHeight,width,height].every(finitePositive))throw Error('Invalid viewport dimensions');
  const minScale=Math.min(width/worldWidth,height/worldHeight);
  return bounded({worldWidth,worldHeight,width,height,scale:minScale,x:0,y:0});
}
export function panBattleViewport(view,dx,dy){
  validate(view);if(!Number.isFinite(dx)||!Number.isFinite(dy))throw Error('Invalid pan');
  return bounded({...view,x:view.x-dx/view.scale,y:view.y-dy/view.scale});
}
export function zoomBattleViewport(view,factor,anchor){
  validate(view);if(!finitePositive(factor)||!validPoint(anchor))throw Error('Invalid zoom');
  const scale=clamp(view.scale*factor,fitScale(view),maxScale(view));
  const worldX=view.x+anchor.x/view.scale,worldY=view.y+anchor.y/view.scale;
  return bounded({...view,scale,x:worldX-anchor.x/scale,y:worldY-anchor.y/scale});
}
// Resizing/rotating keeps the world point under the screen centre and the
// zoom relative to the overview, subject to the new view's bounds.
export function resizeBattleViewport(view,width,height){
  validate(view);if(![width,height].every(finitePositive))throw Error('Invalid viewport dimensions');
  const centerX=view.x+view.width/(2*view.scale),centerY=view.y+view.height/(2*view.scale);
  const next={...view,width,height},scale=clamp(view.scale/fitScale(view)*fitScale(next),fitScale(next),maxScale(next));
  return bounded({...next,scale,x:centerX-width/(2*scale),y:centerY-height/(2*scale)});
}
export function battleScreenToWorld(view,point){
  validate(view);if(!validPoint(point))throw Error('Invalid point');
  return {x:view.x+point.x/view.scale,y:view.y+point.y/view.scale};
}
export function battleClientToScreen(client,rect,width,height){
  if(!validPoint(client)||!rect||!Number.isFinite(rect.left)||!Number.isFinite(rect.top)||![rect.width,rect.height,width,height].every(finitePositive))throw Error('Invalid canvas geometry');
  return {x:(client.x-rect.left)*width/rect.width,y:(client.y-rect.top)*height/rect.height};
}
// Limit painting to the battlefield even when the fitted map is letterboxed.
// Restore the caller's canvas state if rendering throws.
export function drawInBattleViewport(ctx,view,draw){
  validate(view);if(!ctx||typeof draw!=='function')throw Error('Invalid viewport draw');
  ctx.save();try{
    ctx.scale(view.scale,view.scale);ctx.translate(-view.x,-view.y);
    ctx.beginPath();ctx.rect(0,0,view.worldWidth,view.worldHeight);ctx.clip();draw();
  }finally{ctx.restore();}
}
