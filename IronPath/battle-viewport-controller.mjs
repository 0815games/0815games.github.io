// Input adapter for the large battlefield viewport, instantiated by the game
// for every oversized field. The caller applies the viewport transform when
// drawing, and receives taps in world coordinates.
import {createBattleViewport,panBattleViewport,zoomBattleViewport,battleScreenToWorld,battleClientToScreen} from './battle-viewport.mjs?v=20261102-fourviewport2';
export function createBattleViewportController({canvas,worldWidth,worldHeight,screenWidth=canvas.width,screenHeight=canvas.height,onChange=()=>{},onTap=()=>{}}){
  if(!canvas||typeof canvas.addEventListener!=='function'||typeof canvas.removeEventListener!=='function'||typeof onChange!=='function'||typeof onTap!=='function')throw Error('Invalid viewport controller');
  let view=createBattleViewport(worldWidth,worldHeight,screenWidth,screenHeight),gesture=false,origin=null,pinch=null,destroyed=false;
  const pointers=new Map(),oldTouchAction=canvas.style.touchAction;
  canvas.style.touchAction='none';
  const point=e=>battleClientToScreen({x:e.clientX,y:e.clientY},canvas.getBoundingClientRect(),screenWidth,screenHeight);
  const pair=()=>{const [a,b]=[...pointers.values()];return {center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.hypot(a.x-b.x,a.y-b.y)};};
  const changed=()=>onChange({...view});
  function down(e){
    if(destroyed||pointers.has(e.pointerId)||(e.pointerType==='mouse'&&e.button!==0))return;
    const p=point(e);pointers.set(e.pointerId,p);canvas.setPointerCapture?.(e.pointerId);
    if(pointers.size===1){origin=p;gesture=false;}else{gesture=true;origin=null;if(pointers.size===2)pinch=pair();}
  }
  function move(e){
    if(!pointers.has(e.pointerId))return;
    const before=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);
    if(pointers.size===1){
      if(!gesture&&origin&&Math.hypot(p.x-origin.x,p.y-origin.y)>8)gesture=true;
      if(gesture){view=panBattleViewport(view,p.x-before.x,p.y-before.y);changed();}
    }else if(pointers.size===2){
      const next=pair();if(pinch&&pinch.distance>0&&next.distance>0){view=zoomBattleViewport(view,next.distance/pinch.distance,pinch.center);view=panBattleViewport(view,next.center.x-pinch.center.x,next.center.y-pinch.center.y);changed();}pinch=next;
    }
  }
  function finish(e,cancelled){
    if(!pointers.has(e.pointerId))return;
    const p=point(e),tap=!cancelled&&pointers.size===1&&!gesture&&origin&&Math.hypot(p.x-origin.x,p.y-origin.y)<=8;
    pointers.delete(e.pointerId);pinch=pointers.size===2?pair():null;
    if(tap){const world=battleScreenToWorld(view,p);if(world.x>=0&&world.x<=worldWidth&&world.y>=0&&world.y<=worldHeight)onTap(world);}
    if(!pointers.size){gesture=false;origin=null;}else{gesture=true;origin=null;}
  }
  function up(e){finish(e,false);}
  function cancel(e){finish(e,true);}
  function wheel(e){
    if(!Number.isFinite(e.deltaY))return;
    e.preventDefault();const factor=Math.exp(-Math.max(-1000,Math.min(1000,e.deltaY))*0.0015);
    view=zoomBattleViewport(view,factor,point(e));changed();
  }
  const listeners=[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['wheel',wheel,{passive:false}]];
  for(const [type,fn,options] of listeners)canvas.addEventListener(type,fn,options);
  return {
    getViewport:()=>({...view}),
    zoom(factor,anchor={x:screenWidth/2,y:screenHeight/2}){if(destroyed)return;view=zoomBattleViewport(view,factor,anchor);changed();},
    pan(dx,dy){if(destroyed)return;view=panBattleViewport(view,dx,dy);changed();},
    reset(){if(destroyed)return;view=createBattleViewport(worldWidth,worldHeight,screenWidth,screenHeight);pointers.clear();gesture=false;origin=pinch=null;changed();},
    destroy(){if(destroyed)return;destroyed=true;for(const [type,fn,options] of listeners)canvas.removeEventListener(type,fn,options);pointers.clear();canvas.style.touchAction=oldTouchAction;}
  };
}
