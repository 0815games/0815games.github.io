// Pan with a pointer; pinch the board itself rather than zooming the page.
// Resizing the board rather than transforming it keeps scroll bounds accurate.
export function enableTreeDrag(element,{minButtonScale=()=>.45}={}){
  let pointer=null,suppressClick=false,scale=1;
  function zoom(next,clientX,clientY){
    const board=element.querySelector('.skill-tree-board');if(!board)return;
    const rect=element.getBoundingClientRect(),x=clientX-rect.left-element.clientLeft,y=clientY-rect.top-element.clientTop;
    const oldWidth=board.offsetWidth;if(!oldWidth)return;
    const boardX=(element.scrollLeft+x)/oldWidth,boardY=(element.scrollTop+y)/oldWidth;
    scale=Math.max(.45,Math.min(1.8,next));element.style.setProperty('--tree-size',`${1400*scale}px`);
    const width=board.offsetWidth;element.style.setProperty('--tree-zoom',String(width/1400));
    element.scrollLeft=boardX*width-x;element.scrollTop=boardY*width-y;
  }
  const center=()=>{element.scrollLeft=(element.scrollWidth-element.clientWidth)/2;element.scrollTop=(element.scrollHeight-element.clientHeight)/2;};
  const zoomBy=factor=>{const rect=element.getBoundingClientRect();zoom(scale*factor,rect.left+element.clientWidth/2,rect.top+element.clientHeight/2);};
  element.addEventListener('wheel',event=>{
    // The tree owns the wheel only while the pointer is over it.
    event.preventDefault();const delta=event.deltaMode===1?event.deltaY*16:event.deltaMode===2?event.deltaY*element.clientHeight:event.deltaY;
    zoom(scale*Math.exp(-delta*.0015),event.clientX,event.clientY);
  },{passive:false});
  element.addEventListener('keydown',event=>{
    if(event.key!=='+'&&event.key!=='='&&event.key!=='-')return;
    const rect=element.getBoundingClientRect();event.preventDefault();zoom(scale*(event.key==='-'?1/1.2:1.2),rect.left+element.clientWidth/2,rect.top+element.clientHeight/2);
  });
  const touches=new Map();let gesture=null;
  const point=e=>({x:e.clientX,y:e.clientY});
  const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function beginTouch(){
    const values=[...touches.values()];
    if(values.length>=2){const [a,b]=values;gesture={kind:'pinch',distance:Math.max(1,distance(a,b)),scale,mid:midpoint(a,b)};suppressClick=true;element.classList.add('is-dragging');}
    else if(values.length===1){const p=values[0];gesture={kind:'pan',x:p.x,y:p.y,left:element.scrollLeft,top:element.scrollTop,dragged:false};}
    else gesture=null;
  }
  element.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'){
      if(!touches.size)suppressClick=false;
      touches.set(event.pointerId,point(event));beginTouch();return;
    }
    if(event.button!==0||!event.isPrimary)return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,left:element.scrollLeft,top:element.scrollTop,dragged:false};suppressClick=false;
  });
  element.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'&&touches.has(event.pointerId)){
      touches.set(event.pointerId,point(event));const values=[...touches.values()];
      if(gesture?.kind==='pinch'&&values.length>=2){
        const mid=midpoint(values[0],values[1]);
        zoom(Math.max(minButtonScale(),gesture.scale*distance(values[0],values[1])/gesture.distance),gesture.mid.x,gesture.mid.y);
        element.scrollLeft-=mid.x-gesture.mid.x;element.scrollTop-=mid.y-gesture.mid.y;
        gesture={kind:'pinch',distance:Math.max(1,distance(values[0],values[1])),scale,mid};event.preventDefault();
      }else if(gesture?.kind==='pan'){
        const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
        if(!gesture.dragged&&Math.hypot(dx,dy)>5){gesture.dragged=true;suppressClick=true;element.classList.add('is-dragging');}
        if(gesture.dragged){element.scrollLeft=gesture.left-dx;element.scrollTop=gesture.top-dy;event.preventDefault();}
      }
      return;
    }
    if(!pointer||event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(!pointer.dragged&&Math.hypot(dx,dy)>5){pointer.dragged=true;element.setPointerCapture(event.pointerId);element.classList.add('is-dragging');}
    if(pointer.dragged){element.scrollLeft=pointer.left-dx;element.scrollTop=pointer.top-dy;event.preventDefault();}
  });
  function end(event){
    if(event.pointerType==='touch'&&touches.has(event.pointerId)){touches.delete(event.pointerId);beginTouch();if(!touches.size)element.classList.remove('is-dragging');return;}
    if(!pointer||event.pointerId!==pointer.id)return;suppressClick=pointer.dragged;pointer=null;element.classList.remove('is-dragging');
  }
  element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);
  element.addEventListener('lostpointercapture',event=>{if(event.pointerType!=='touch'){pointer=null;element.classList.remove('is-dragging');}});
  element.addEventListener('click',event=>{if(suppressClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
  return {zoomIn:()=>zoomBy(1.2),zoomOut:()=>zoomBy(Math.max(scale/1.2,minButtonScale())/scale),center};
}
