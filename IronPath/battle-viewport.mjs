// Geometry for the experimental large battlefield. Coordinates are in logical
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
// Fit the whole map initially; permit up to 3x the fit scale for touch use.
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
  const minScale=Math.min(view.width/view.worldWidth,view.height/view.worldHeight),scale=clamp(view.scale*factor,minScale,minScale*3);
  const worldX=view.x+anchor.x/view.scale,worldY=view.y+anchor.y/view.scale;
  return bounded({...view,scale,x:worldX-anchor.x/scale,y:worldY-anchor.y/scale});
}
export function battleScreenToWorld(view,point){
  validate(view);if(!validPoint(point))throw Error('Invalid point');
  return {x:view.x+point.x/view.scale,y:view.y+point.y/view.scale};
}
export function battleClientToScreen(client,rect,width,height){
  if(!validPoint(client)||!rect||!Number.isFinite(rect.left)||!Number.isFinite(rect.top)||![rect.width,rect.height,width,height].every(finitePositive))throw Error('Invalid canvas geometry');
  return {x:(client.x-rect.left)*width/rect.width,y:(client.y-rect.top)*height/rect.height};
}
