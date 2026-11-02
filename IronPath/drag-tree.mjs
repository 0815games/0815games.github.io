// Drag the scrollable board without turning a drag into a node activation.
export function enableTreeDrag(element){
  let pointer=null,suppressClick=false;
  element.addEventListener('pointerdown',event=>{
    if(event.button!==0||!event.isPrimary)return;
    pointer={id:event.pointerId,x:event.clientX,y:event.clientY,left:element.scrollLeft,top:element.scrollTop,dragged:false};
    suppressClick=false;
  });
  element.addEventListener('pointermove',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
    if(!pointer.dragged&&Math.hypot(dx,dy)>8){pointer.dragged=true;element.setPointerCapture(event.pointerId);element.classList.add('is-dragging');}
    if(pointer.dragged){element.scrollLeft=pointer.left-dx;element.scrollTop=pointer.top-dy;event.preventDefault();}
  });
  function end(event){if(!pointer||event.pointerId!==pointer.id)return;suppressClick=pointer.dragged;pointer=null;element.classList.remove('is-dragging');}
  element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);
  element.addEventListener('click',event=>{if(suppressClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}},true);
}
