// CSS-sized map zoom: preserve the simulation's existing canvas coordinates.
// The scroll viewport owns panning, so single-finger drags remain native.
export function createMapZoom({viewport,canvas,onChange=()=>{},isEnabled=()=>true}){
 let factor=1,pinch=null,destroyed=false,suppressClickUntil=0;
 const distance=(a,b)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
 const center=(a,b)=>({x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2});
 function resize(next,anchor){
  if(destroyed)return;next=Math.max(1,Math.min(3,next));
  const rect=viewport.getBoundingClientRect(),old=canvas.getBoundingClientRect();
  const point=anchor||{x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  const wx=old.width?(point.x-old.left)/old.width:.5,wy=old.height?(point.y-old.top)/old.height:.5;
  factor=next;const fit=Math.min(viewport.clientWidth,viewport.clientHeight*canvas.width/canvas.height);
  if(!(fit>0))return;
  canvas.style.width=`${fit*factor}px`;canvas.style.height='auto';
  const after=canvas.getBoundingClientRect();viewport.scrollLeft+=(after.left+wx*after.width)-point.x;viewport.scrollTop+=(after.top+wy*after.height)-point.y;
  onChange(factor);
 }
 function start(e){if(e.touches.length===1)suppressClickUntil=0;if(!isEnabled()||e.touches.length!==2)return;const [a,b]=e.touches;pinch={distance:distance(a,b),factor};}
 function move(e){if(!isEnabled()||!pinch||e.touches.length!==2)return;const [a,b]=e.touches,d=distance(a,b);if(pinch.distance>0&&d>0){e.preventDefault();resize(pinch.factor*d/pinch.distance,center(a,b));}}
 function end(e){if(pinch&&e.touches.length<2){pinch=null;suppressClickUntil=Date.now()+500;}}
 function click(e){if(Date.now()<suppressClickUntil){suppressClickUntil=0;e.preventDefault();e.stopImmediatePropagation();}}
 viewport.addEventListener('click',click,true);viewport.addEventListener('touchstart',start,{passive:true});viewport.addEventListener('touchmove',move,{passive:false});viewport.addEventListener('touchend',end,{passive:true});viewport.addEventListener('touchcancel',end,{passive:true});
 return {getFactor:()=>factor,resize,toggle(){resize(factor>1.01?1:2);},reset(){resize(1);},destroy(){destroyed=true;viewport.removeEventListener('click',click,true);viewport.removeEventListener('touchstart',start);viewport.removeEventListener('touchmove',move);viewport.removeEventListener('touchend',end);viewport.removeEventListener('touchcancel',end);canvas.style.width='';canvas.style.height='';}};
}
