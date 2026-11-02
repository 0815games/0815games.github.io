// Pan by dragging with a mouse; touch keeps native scrolling and pinch zoom.
// Resizing the board rather than transforming it keeps scroll bounds accurate.
export function enableTreeDrag(element){
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
  element.addEventListener('wheel',event=>{
    // The tree owns the wheel only while the pointer is over it.
    event.preventDefault();const delta=event.deltaMode===1?event.deltaY*16:event.deltaMode===2?event.deltaY*element.clientHeight:event.deltaY;
    zoom(scale*Math.exp(-delta*.0015),event.clientX,event.clientY);
  },{passive:false});
  element.addEventListener('keydown',event=>{
    if(event.key!=='+'&&event.key!=='='&&event.key!=='-')return;
    const rect=element.getBoundingClientRect();event.preventDefault();zoom(scale*(event.key==='-'?1/1.2:1.2),rect.left+element.clientWidth/2,rect.top+element.clientHeight/2);
  });
  element.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||event.button!==0||!event.isPrimary)return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,left:element.scrollLeft,top:element.scrollTop,dragged:false};suppressClick=false;
  });
  element.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(!pointer.dragged&&Math.hypot(dx,dy)>5){pointer.dragged=true;element.setPointerCapture(event.pointerId);element.classList.add('is-dragging');}
    if(pointer.dragged){element.scrollLeft=pointer.left-dx;element.scrollTop=pointer.top-dy;event.preventDefault();}
  });
  function end(event){if(!pointer||event.pointerId!==pointer.id)return;suppressClick=pointer.dragged;pointer=null;element.classList.remove('is-dragging');}
  element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);
  element.addEventListener('lostpointercapture',()=>{pointer=null;element.classList.remove('is-dragging');});
  element.addEventListener('click',event=>{if(suppressClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
}
