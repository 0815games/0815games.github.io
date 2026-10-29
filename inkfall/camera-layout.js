/* INKFALL_FIXED_GAME_SCALE_V1 */
(() => {
  "use strict";

  const style = document.createElement("style");
  style.id = "if-fixed-game-size";
  style.textContent = `
html{width:100%;height:100%;background:#171b29;}
body{box-sizing:border-box;display:flex!important;align-items:center;justify-content:center;width:100%;height:100%;margin:0!important;padding:12px!important;overflow:hidden!important;background:radial-gradient(ellipse at center,#30384b,#171b29);}
#inkfall-window{box-sizing:border-box;flex:none;width:min(1440px,100%)!important;max-width:1440px!important;height:min(900px,calc(100dvh - 24px))!important;max-height:900px!important;margin:0!important;border:3px solid #302c43;border-radius:14px!important;box-shadow:0 8px 30px #0005!important;}
@media(max-width:760px),(max-height:540px){body{padding:0!important;}#inkfall-window{width:100%!important;max-width:none!important;height:100dvh!important;max-height:none!important;border-radius:0!important;box-shadow:none!important;}}
`;
  document.head.append(style);

  function setup() {
    if (window.inkfallCamera) return;
    const source = document.getElementById("cv");
    const game = document.getElementById("game");
    const frame = document.getElementById("inkfall-window");
    const bar = document.getElementById("if-window-titlebar");
    if (!source || !game || !frame || !bar) {
      console.error("Kamera: Erforderliche Layout-Elemente fehlen.");
      return;
    }
    const view = document.createElement("canvas");
    view.id = "if-map-view";
    view.setAttribute("aria-label", "Schlachtfeld: tippen zum Bewegen, ziehen zum Verschieben");
    game.append(view);
    const context = view.getContext("2d");
    const camera = {x:source.width/2,y:source.height/2,z:1,min:1,max:3,w:1,h:1};
    const pointers = new Map();
    let gesture = null;
    let blocked = false;
    let initialized = false;

    function limit() {
      const hw = camera.w/(2*camera.z), hh = camera.h/(2*camera.z);
      camera.x = hw >= source.width/2 ? source.width/2 : Math.max(hw,Math.min(source.width-hw,camera.x));
      camera.y = hh >= source.height/2 ? source.height/2 : Math.max(hh,Math.min(source.height-hh,camera.y));
    }
    function world(p) {
      return {x:camera.x+(p.x-camera.w/2)/camera.z,y:camera.y+(p.y-camera.h/2)/camera.z};
    }
    function zoom(value,anchor={x:camera.w/2,y:camera.h/2}) {
      const before = world(anchor);
      camera.z = Math.max(camera.min,Math.min(camera.max,value));
      camera.x = before.x-(anchor.x-camera.w/2)/camera.z;
      camera.y = before.y-(anchor.y-camera.h/2)/camera.z;
      limit();
    }
    function overview() {
      camera.z=camera.min;camera.x=source.width/2;camera.y=source.height/2;limit();
    }
    const controls = document.createElement("div");
    controls.id = "if-camera-controls";
    function button(text,title,action) {
      const b=document.createElement("button");
      b.type="button";b.textContent=text;b.title=title;b.setAttribute("aria-label",title);b.onclick=action;controls.append(b);return b;
    }
    button("−","Verkleinern",()=>zoom(camera.z/1.25));
    const zoomLabel=document.createElement("span");
    controls.append(zoomLabel);
    button("+","Vergrößern",()=>zoom(camera.z*1.25));
    button("Übersicht","Ganze Karte anzeigen",overview);
    button("Zum Helden","Kamera auf den Helden",()=>{camera.x=hero.x;camera.y=hero.y;limit();});
    game.append(controls);
    const toggle=document.createElement("button");
    toggle.id="if-sidebar-toggle";toggle.type="button";toggle.textContent="Türme";toggle.setAttribute("aria-controls","if-menu-scroll");
    const actions=document.getElementById("if-top-actions");
    (actions||bar).append(toggle);
    const narrow=matchMedia("(max-width:760px)");
    function sidebar(open) {
      frame.classList.toggle("if-tools-open",open);
      frame.classList.toggle("if-tools-closed",!open);
      toggle.setAttribute("aria-expanded",String(open));
    }
    toggle.onclick=()=>sidebar(!frame.classList.contains("if-tools-open"));
    sidebar(!narrow.matches);
    narrow.addEventListener("change",()=>sidebar(!narrow.matches));

    function resize() {
      const rect=game.getBoundingClientRect();
      if(rect.width<2||rect.height<2)return;
      camera.w=rect.width;camera.h=rect.height;
      const dpr=Math.min(2,window.devicePixelRatio||1);
      view.width=Math.round(camera.w*dpr);view.height=Math.round(camera.h*dpr);
      camera.min=Math.min(1,camera.w/source.width,camera.h/source.height);
      camera.max=3;
      if(!initialized){camera.z=1;initialized=true;}
      else camera.z=Math.max(camera.min,Math.min(camera.max,camera.z));
      limit();
    }
    new ResizeObserver(resize).observe(game);
    resize();
    function paint() {
      if(camera.w>1&&camera.h>1){
        context.setTransform(view.width/camera.w,0,0,view.height/camera.h,0,0);
        context.fillStyle="#345541";context.fillRect(0,0,camera.w,camera.h);
        context.translate(camera.w/2,camera.h/2);context.scale(camera.z,camera.z);context.translate(-camera.x,-camera.y);
        context.drawImage(source,0,0);
        zoomLabel.textContent=Math.round(camera.z*100)+"%";
      }
      requestAnimationFrame(paint);
    }
    function point(event) {
      const rect=view.getBoundingClientRect();
      return{x:event.clientX-rect.left,y:event.clientY-rect.top};
    }
    function pinch() {
      const[a,b]=[...pointers.values()];
      return{mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};
    }
    function act(screenPoint) {
      const p=world(screenPoint);
      if(p.x<0||p.y<0||p.x>source.width||p.y>source.height)return;
      if(buildType){
        if(active){window.inkfallNotify?.("Bauen erst nach der Welle.");return;}
        const cost=buildCost(buildType);
        if(gold<cost){window.inkfallNotify?.("Nicht genug Gold.");return;}
        if(near(p.x,p.y,26,ground)){window.inkfallNotify?.("Zu nah am Bodenweg.");return;}
        gold-=cost;towers.push({t:buildType,x:p.x,y:p.y,lvl:1,cd:0});buildType=null;ui();return;
      }
      sel=towers.find(t=>Math.hypot(t.x-p.x,t.y-p.y)<24)||null;
      if(!sel)hero.target={x:p.x,y:p.y};
      ui();
    }
    view.addEventListener("pointerdown",event=>{
      if(event.pointerType==="mouse"&&event.button!==0)return;
      event.preventDefault();pointers.set(event.pointerId,point(event));view.setPointerCapture(event.pointerId);
      if(pointers.size===1){blocked=false;gesture={id:event.pointerId,start:point(event),x:camera.x,y:camera.y,drag:false};}
      else{blocked=true;gesture=null;}
    });
    view.addEventListener("pointermove",event=>{
      if(!pointers.has(event.pointerId))return;
      event.preventDefault();
      const before=pointers.size>=2?pinch():null;
      pointers.set(event.pointerId,point(event));
      if(pointers.size>=2){
        blocked=true;const after=pinch(),anchor=world(before.mid);
        camera.z=Math.max(camera.min,Math.min(camera.max,camera.z*after.distance/before.distance));
        camera.x=anchor.x-(after.mid.x-camera.w/2)/camera.z;
        camera.y=anchor.y-(after.mid.y-camera.h/2)/camera.z;limit();return;
      }
      if(blocked||!gesture)return;
      const p=point(event),dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
      if(Math.hypot(dx,dy)>8)gesture.drag=true;
      if(gesture.drag){view.classList.add("dragging");camera.x=gesture.x-dx/camera.z;camera.y=gesture.y-dy/camera.z;limit();}
    });
    function end(event,cancelled) {
      if(!pointers.has(event.pointerId))return;
      const p=point(event);
      const click=!cancelled&&!blocked&&pointers.size===1&&gesture&&!gesture.drag&&gesture.id===event.pointerId&&Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)<=8;
      pointers.delete(event.pointerId);if(cancelled)blocked=true;
      if(view.hasPointerCapture(event.pointerId))view.releasePointerCapture(event.pointerId);
      if(click)act(p);
      if(!pointers.size){gesture=null;blocked=false;view.classList.remove("dragging");}
    }
    view.addEventListener("pointerup",event=>end(event,false));
    view.addEventListener("pointercancel",event=>end(event,true));
    view.addEventListener("lostpointercapture",event=>{if(pointers.has(event.pointerId))end(event,true);});
    window.addEventListener("blur",()=>{pointers.clear();gesture=null;blocked=true;view.classList.remove("dragging");});
    view.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();},true);
    view.addEventListener("wheel",event=>{
      event.preventDefault();if(pointers.size){blocked=true;return;}
      const factor=event.deltaMode===1?16:event.deltaMode===2?camera.h:1;
      zoom(camera.z*Math.exp(-event.deltaY*factor*.0015),point(event));
    },{passive:false});
    view.addEventListener("contextmenu",event=>event.preventDefault());
    window.inkfallCamera={state:camera,overview};
    paint();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();
