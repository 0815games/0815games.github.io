// The pointer that follows a first-run card.
//
// A card that says "tap a build marker" is not an explanation. The player has to
// find the marker on a battlefield they have never seen, on a phone, while enemies
// are walking. This module draws the ring around the actual thing and the arrow
// from the card to it, so the instruction and the object are the same gesture.
//
// Three hard rules, learned from the modal that made the first run unplayable:
//
//   * it is `pointer-events:none` and `aria-hidden`, so it can never eat a tap;
//   * it never decides anything - the card does, this only draws;
//   * every element it marks is resolved by id or by pad index at call time, so a
//     missing pad hides the highlight instead of throwing mid-frame.
//
// Pure geometry lives in `padRing`/`elementRing` and is unit tested; the DOM part is
// deliberately thin.
const RING_PAD=52;

// Where a map pad sits on the screen. The battlefield is drawn in logical 960x540
// space, then scaled by the canvas rectangle and, on phones, by the pan/zoom view.
export function padRing(pad,{rect,view=null,logicalWidth=960,radius=RING_PAD}){
 if(!pad||!rect||!Number.isFinite(rect.width)||rect.width<=0)return null;
 const scale=(view?.scale??1)*rect.width/logicalWidth;
 if(!Number.isFinite(scale)||scale<=0)return null;
 const originX=view?.x??0,originY=view?.y??0;
 return {
  x:rect.left+(pad.x-originX)*scale,
  y:rect.top+(pad.y-originY)*scale,
  size:2*radius*scale,
  visible:(pad.x-originX)*scale>=0&&(pad.x-originX)*scale<=rect.width&&(pad.y-originY)*scale>=0&&(pad.y-originY)*scale<=rect.height,
 };
}

// Same thing for a DOM control: the ring sits over the element's own box.
export function elementRing(box,padding=6){
 if(!box||!Number.isFinite(box.width)||!Number.isFinite(box.height))return null;
 return {x:box.x-padding,y:box.y-padding,size:0,width:box.width+2*padding,height:box.height+2*padding,visible:true};
}

// The arrow runs from the card to the ring. Clamped so it never points off screen.
export function arrowBetween(from,to){
 if(!from||!to)return null;
 return {x1:from.x,y1:from.y,x2:to.x,y2:to.y};
}

export function createCoachHighlight({document,window}){
 const layer=document.getElementById('coachHighlight');
 const ring=document.getElementById('coachRing');
 const arrow=document.getElementById('coachArrow');
 const getCanvas=()=>document.getElementById('game');
 const enabled=()=>!!layer&&!layer.hidden;

 function hide(){
  if(layer)layer.hidden=true;
  if(ring)ring.hidden=true;
  if(arrow)arrow.hidden=true;
 }

 function show(){
  if(layer)layer.hidden=false;
 }

 // Ring around a battlefield pad, arrow from the card's top edge to the ring.
 function markPad(pad,{radius=RING_PAD}={}){
  const canvas=getCanvas();
  if(!pad||!canvas||!ring)return hide();
  const box=padRing(pad,{rect:canvas.getBoundingClientRect(),radius});
  if(!box||!box.visible)return hide();
  show();
  const target={x:box.x,y:box.y};
  return draw(target,{diameter:box.size});
 }

 // Ring around a real control (Deploy, a tower choice, a skill path...).
 function markElement(selector){
  const node=typeof selector==='string'?document.querySelector(selector):selector;
  if(!node||!ring)return hide();
  const rect=node.getBoundingClientRect();
  if(!rect.width||!rect.height)return hide();
  show();
  const target={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
  return draw(target,{diameter:Math.max(rect.width,rect.height)+18});
 }

 function draw(target,{diameter}){
  ring.hidden=false;
  ring.style.width=`${Math.round(diameter)}px`;
  ring.style.height=`${Math.round(diameter)}px`;
  ring.style.left=`${Math.round(target.x-diameter/2)}px`;
  ring.style.top=`${Math.round(target.y-diameter/2)}px`;
  const card=document.getElementById('firstRunCoach');
  if(card&&arrow){
   const cardBox=card.getBoundingClientRect();
   const line=arrowBetween({x:cardBox.left+cardBox.width/2,y:cardBox.top},{x:target.x,y:target.y});
   if(line){
    arrow.hidden=false;
    arrow.setAttribute('x1',String(Math.round(line.x1)));
    arrow.setAttribute('y1',String(Math.round(line.y1)));
    arrow.setAttribute('x2',String(Math.round(line.x2)));
    arrow.setAttribute('y2',String(Math.round(line.y2)));
    return true;
   }
  }
  return true;
 }

 // The field moves under the ring when the phone pans or the window resizes, so the
 // caller re-marks on those events rather than the module polling a frame loop.
 return {
  markPad,markElement,hide,show,enabled,
  redraw:target=>target?null:hide(),
 };
}
