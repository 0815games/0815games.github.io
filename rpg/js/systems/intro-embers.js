function setup(){
 const intro=document.getElementById('intro-screen');if(!intro)return;
 const canvas=document.createElement('canvas');canvas.id='intro-embers';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';intro.prepend(canvas);
 const c=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let w=1,h=1,particles=[],frame=0,last=0;
 function resize(){const r=intro.getBoundingClientRect();if(r.width<1||r.height<1)return;w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);c.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:w<600?45:75},()=>({x:Math.random()*w,y:Math.random()*h,r:.7+Math.random()*1.6,speed:18+Math.random()*38,phase:Math.random()*6.28,a:.3+Math.random()*.6}));}
 function paint(time){frame=0;if(intro.classList.contains('hidden')||document.hidden)return;const dt=last?Math.min(.05,(time-last)/1000):0;last=time;c.clearRect(0,0,w,h);for(const p of particles){if(!reduce.matches){p.y-=p.speed*dt;p.x+=Math.sin(time/850+p.phase)*10*dt;if(p.y<-10){p.y=h+10;p.x=Math.random()*w;}}c.globalAlpha=p.a;c.fillStyle='#ffb34b';c.beginPath();c.ellipse(p.x,p.y,p.r,p.r*1.6,0,0,Math.PI*2);c.fill();}c.globalAlpha=1;if(!reduce.matches)frame=requestAnimationFrame(paint);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(!intro.classList.contains('hidden')&&!document.hidden){resize();frame=requestAnimationFrame(paint);}}
 new MutationObserver(sync).observe(intro,{attributes:true,attributeFilter:['class']});
 addEventListener('resize',sync);document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
