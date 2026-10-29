(() => {
"use strict";
function toWorld(x,y,rect,camera) {
  if (![x,y,rect.left,rect.top,rect.width,rect.height,camera.x,camera.y,camera.w,camera.h,camera.z].every(Number.isFinite) || rect.width<=0 || rect.height<=0 || camera.z<=0 || camera.w<=0 || camera.h<=0) return null;
  if(x<rect.left||y<rect.top||x>rect.left+rect.width||y>rect.top+rect.height)return null;
  return {x:camera.x+((x-rect.left)*camera.w/rect.width-camera.w/2)/camera.z,
    y:camera.y+((y-rect.top)*camera.h/rect.height-camera.h/2)/camera.z};
}
function placementError(point,state) {
  if(!state.enabled)return "Bauen ist gerade gesperrt.";
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.y<0||point.x>state.width||point.y>state.height)return "Außerhalb der Karte.";
  if(!Number.isFinite(state.cost)||state.cost<0||!Number.isFinite(state.gold)||state.gold<state.cost)return "Nicht genug Gold.";
  for(let i=0;i<state.ground.length-1;i++){
    const a=state.ground[i],b=state.ground[i+1],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
    const t=length?Math.max(0,Math.min(1,((point.x-a[0])*dx+(point.y-a[1])*dy)/length)):0;
    if(Math.hypot(point.x-a[0]-dx*t,point.y-a[1]-dy*t)<26)return "Zu nah am Bodenweg.";
  }
  if(state.towers.some(t=>Math.hypot(t.x-point.x,t.y-point.y)<44))return "Bauplatz ist bereits belegt.";
  return "";
}
if(typeof module==='object'&&module.exports){module.exports={toWorld,placementError};return;}
const types=["arrow","frost","cannon","antiair"];
function refresh(){
  const grid=document.getElementById("if-build-grid");
  if(!grid)return;
  for(const button of grid.querySelectorAll("button")){
    const type=button.querySelector("[data-tower]")?.dataset.tower;
    if(!types.includes(type))continue;
    let image=button.querySelector("img");
    if(!image){image=document.createElement("img");image.alt="";button.prepend(image);}
    const path="assets/art/towers/"+type+".svg";
    if(image.getAttribute("src")!==path)image.src=path;
    image.draggable=false;image.classList.add("if-tower-thumbnail");image.style.display="block";
    button.style.touchAction="none";
    button.querySelectorAll(".if-tower-icon").forEach(icon=>icon.remove());
    if(!image.dataset.monitored){image.dataset.monitored="true";image.addEventListener("error",()=>window.inkfallDiag?.warn("Bauleiste","Turmbild konnte nicht geladen werden: "+path));}
  }
}
function mount(){
  if(document.getElementById("if-tower-drag-preview"))return;
  const grid=document.getElementById("if-build-grid"),view=document.getElementById("if-map-view"),game=document.getElementById("game"),camera=window.inkfallCamera?.state,renderer=window.InkfallTowerRenderer;
  if(!grid||!view||!game||!camera||!renderer){console.error("Turm-Drag: Bauleiste, Kamera oder Renderer fehlt.");return;}
  refresh();
  const overlay=document.createElement("canvas");overlay.id="if-tower-drag-preview";overlay.setAttribute("aria-hidden","true");
  Object.assign(overlay.style,{position:"absolute",inset:"0",width:"100%",height:"100%",pointerEvents:"none",zIndex:"3"});game.append(overlay);
  const ctx=overlay.getContext("2d");
  const hint=document.createElement("div");hint.id="if-tower-drag-hint";hint.setAttribute("role","status");hint.hidden=true;
  Object.assign(hint.style,{position:"absolute",left:"12px",top:"12px",maxWidth:"calc(100% - 24px)",padding:"8px 12px",background:"#202d48ee",color:"white",borderRadius:"10px",pointerEvents:"none",zIndex:"4",font:"700 12px system-ui"});game.append(hint);
  let press=null,frame=null,suppressed=null,suppressUntil=0;
  function contextKey(){return JSON.stringify([typeof auth!=="undefined"?auth.currentUser?.uid:null,typeof hero!=="undefined"?hero.cls:null,window.inkfallMode,window.inkfallActiveCoopSession?.id]);}
  function enabled(){return !active&&lives>0&&!window.inkfallActiveCoopSession&&(typeof coopWaveActive==='undefined'||!coopWaveActive)&&!document.getElementById("tree")?.classList.contains("open");}
  function state(type){return {enabled:enabled()&&(!press||press.context===contextKey()),cost:buildCost(type),gold,width:cv.width,height:cv.height,ground,towers};}
  function point(){return toWorld(press.x,press.y,view.getBoundingClientRect(),camera);}
  function clear(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,overlay.width,overlay.height);hint.hidden=true;}
  function releaseCapture(p){if(p?.button.hasPointerCapture(p.id))p.button.releasePointerCapture(p.id);}
  function finish(){const p=press;press=null;if(frame!==null)cancelAnimationFrame(frame);frame=null;clear();releaseCapture(p);}
  function suppress(p){suppressed=p.button;suppressUntil=performance.now()+600;}
  function cancel(){if(!press)return;const p=press;if(p.dragging){suppress(p);buildType=null;}finish();}
  function paint(){
    frame=null;if(!press?.dragging)return;
    if(overlay.width!==view.width)overlay.width=view.width;if(overlay.height!==view.height)overlay.height=view.height;
    clear();const p=point(),s=state(press.type),error=placementError(p,s);
    hint.hidden=false;hint.textContent=error||T[press.type].n+" platzieren · "+s.cost+" G · Loslassen zum Bauen";
    hint.style.border="2px solid "+(error?"#ed7d7d":"#67e79b");
    if(p&&p.x>=0&&p.y>=0&&p.x<=cv.width&&p.y<=cv.height){
      ctx.setTransform(overlay.width/camera.w,0,0,overlay.height/camera.h,0,0);ctx.translate(camera.w/2,camera.h/2);ctx.scale(camera.z,camera.z);ctx.translate(-camera.x,-camera.y);
      const color=error?"#ff7474":"#70ef9e",range=towerRange(press.type);
      ctx.save();ctx.strokeStyle=color;ctx.fillStyle=error?"#ff747421":"#70ef9e21";ctx.lineWidth=2/camera.z;ctx.setLineDash([7/camera.z,5/camera.z]);ctx.beginPath();ctx.arc(p.x,p.y,range,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=.65;renderer.draw(ctx,{t:press.type,x:p.x,y:p.y,lvl:1,cd:0},false,range);ctx.globalAlpha=1;
      ctx.strokeStyle=color;ctx.lineWidth=4/camera.z;ctx.beginPath();ctx.ellipse(p.x,p.y+7,29,13,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    frame=requestAnimationFrame(paint);
  }
  document.addEventListener("pointerdown",event=>{
    if(press){if(event.pointerId!==press.id)cancel();return;}
    const button=event.target.closest?.("#if-build-grid button");
    const type=button?.querySelector("[data-tower]")?.dataset.tower;
    if(!button||button.disabled||!types.includes(type)||event.button!==0||!enabled()||gold<buildCost(type))return;
    press={id:event.pointerId,button,type,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,dragging:false,context:contextKey()};
    button.setPointerCapture(event.pointerId);
  },true);
  document.addEventListener("pointermove",event=>{
    if(!press||event.pointerId!==press.id)return;
    press.x=event.clientX;press.y=event.clientY;
    if(!press.dragging&&Math.hypot(press.x-press.startX,press.y-press.startY)>8){press.dragging=true;buildType=null;frame=requestAnimationFrame(paint);}
    if(press.dragging){event.preventDefault();event.stopImmediatePropagation();}
  },{capture:true,passive:false});
  document.addEventListener("pointerup",event=>{
    if(!press||event.pointerId!==press.id)return;
    if(!press.dragging){finish();return;}
    event.preventDefault();event.stopImmediatePropagation();
    const p=press;p.x=event.clientX;p.y=event.clientY;suppress(p);
    const world=point(),s=state(p.type),error=placementError(world,s);
    finish();buildType=null;
    if(error){window.inkfallNotify?.(error);return;}
    const tower={t:p.type,x:world.x,y:world.y,lvl:1,cd:0};
    towers.push(tower);gold-=s.cost;sel=tower;ui();
  },{capture:true,passive:false});
  document.addEventListener("pointercancel",event=>{if(event.pointerId===press?.id)cancel();},true);
  grid.addEventListener("lostpointercapture",event=>{if(event.pointerId===press?.id)cancel();},true);
  grid.addEventListener("dragstart",event=>event.preventDefault());
  grid.addEventListener("click",event=>{if(performance.now()<suppressUntil&&event.target.closest("button")===suppressed){event.preventDefault();event.stopImmediatePropagation();}},true);
  window.addEventListener("blur",cancel);
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cancel();});
  document.addEventListener("keydown",event=>{if(event.key==='Escape'&&press){event.preventDefault();event.stopImmediatePropagation();cancel();}},true);
  window.addEventListener("inkfall:coop-session",cancel);window.addEventListener("inkfall:coop-session-cleared",cancel);
  const originalDraw=renderer.draw;
  renderer.draw=function(context,tower,selected,range){
    originalDraw.call(this,context,tower,selected,range);
    if(!selected)return;
    context.save();context.setLineDash([]);context.beginPath();context.ellipse(tower.x,tower.y+7,32,14,0,0,Math.PI*2);context.strokeStyle="#202538";context.lineWidth=9;context.stroke();context.strokeStyle="#ffe269";context.lineWidth=5;context.stroke();context.restore();
  };
}
document.addEventListener("DOMContentLoaded",refresh);
window.addEventListener("load",refresh);
if(document.readyState==='complete')mount();else window.addEventListener("load",mount,{once:true});
})();
