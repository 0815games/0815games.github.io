from pathlib import Path
import re

paths={
 'render':Path('rpg/js/world/render.js'),
 'main':Path('rpg/js/main.js'),
 'version':Path('rpg/js/core/version.js'),
 'html':Path('rpg/index.html'),
 'log':Path('change.log'),
}
texts={k:p.read_text(encoding='utf-8') for k,p in paths.items()}

def once(key,old,new):
 assert texts[key].count(old)==1, f'{paths[key]}: nicht eindeutig: {old[:80]}'
 texts[key]=texts[key].replace(old,new,1)

assert "export const VERSION_LABEL='v0.6.10';" in texts['version'], 'Erwartet v0.6.10.'

once('render',
 "text(txt,x,y,c='#ffd54f'){this.texts.push({txt,x:x*this.tile+16,y:y*this.tile,c,a:1});}",
 """text(txt,x,y,c='#ffd54f',size=12,life=1.2){
  this.texts.push({txt,x:x*this.tile+16,y:y*this.tile,c,a:1,size,life,maxLife:life});
 }
 flash(color='#ffd54f',strength=.55,duration=.5){
  this.flashEffect={color,strength,duration,elapsed:0};
 }
 shockwave(x,y,color='#ffd54f'){
  this.waves.push({x:x*this.tile+16,y:y*this.tile+16,r:8,a:.9,color});
 }
 celebrate(x,y,{particles=110,colors=['#ffd54f','#ffca28','#ff9800','#fff8e1'],text='REICHTUM!'}={}){
  this.flash('#ffe082',.65,.65);
  this.shockwave(x,y,'#ffd54f');
  for(let i=0;i<particles;i++){
   const a=Math.random()*Math.PI*2,s=70+Math.random()*190;
   this.particles.push({
    x:x*this.tile+16,y:y*this.tile+16,
    vx:Math.cos(a)*s,vy:Math.sin(a)*s-90,
    a:1,c:colors[i%colors.length],
    size:2+Math.random()*3,gravity:65+Math.random()*45
   });
  }
  this.text(text,x,y,'#ffd54f',30,1.6);
 }"""
)

once('render',
 "this.particles=[];this.texts=[];this.loop();",
 "this.particles=[];this.texts=[];this.waves=[];this.flashEffect=null;this.loop();"
)

once('render',
 """update(dt){this.texts=this.texts.filter(t=>{t.y-=25*dt;t.a-=dt*.9;return t.a>0;});this.particles=this.particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;p.a-=dt*1.2;return p.a>0;});}""",
 """update(dt){
  this.texts=this.texts.filter(t=>{
   t.y-=34*dt;t.a-=dt/(t.maxLife||1.2);return t.a>0;
  });
  this.particles=this.particles.filter(p=>{
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   p.vy+=(p.gravity??80)*dt;
   p.vx*=1-1.4*dt;p.vy*=1-.25*dt;
   p.a-=dt*1.05;
   return p.a>0;
  });
  this.waves=(this.waves||[]).filter(w=>{
   w.r+=260*dt;w.a-=dt*1.6;return w.a>0;
  });
  if(this.flashEffect){
   this.flashEffect.elapsed+=dt;
   if(this.flashEffect.elapsed>=this.flashEffect.duration)this.flashEffect=null;
  }
 }"""
)

once('render',
 "for(const p of this.particles){c.globalAlpha=p.a;rect(p.x,p.y,3,3,p.c);}",
 """for(const w of this.waves||[]){
  c.globalAlpha=Math.max(0,w.a);
  c.strokeStyle=w.color;c.lineWidth=4;
  c.beginPath();c.arc(w.x,w.y,w.r,0,Math.PI*2);c.stroke();
 }
 for(const p of this.particles){
  c.globalAlpha=Math.max(0,p.a);
  const size=p.size||3;
  c.shadowColor=p.c;c.shadowBlur=12;
  rect(p.x-size/2,p.y-size/2,size,size,p.c);
  c.shadowBlur=0;
 }"""
)

once('render',
 """for(const tx of this.texts){c.globalAlpha=tx.a;c.fillStyle=tx.c;c.font='bold 12px serif';c.fillText(tx.txt,tx.x-10,tx.y);}""",
 """for(const tx of this.texts){
  c.globalAlpha=Math.max(0,tx.a);
  c.fillStyle=tx.c;
  c.font=`bold ${tx.size||12}px serif`;
  c.shadowColor='#000';c.shadowBlur=10;
  c.textAlign='center';
  c.fillText(tx.txt,tx.x,tx.y);
  c.textAlign='left';c.shadowBlur=0;
 }"""
)

once('render',
 "c.restore();\n }\n}",
 """c.restore();
  if(this.flashEffect){
   const f=this.flashEffect;
   const progress=f.elapsed/f.duration;
   c.globalAlpha=f.strength*(1-progress);
   c.fillStyle=f.color;
   c.fillRect(0,0,this.cv.width,this.cv.height);
   c.globalAlpha=1;
  }
 }
}"""
)

once('main',
 "ch.open=true;sound.chest();gfx.burst(tx,ty);gfx.text('✨ REICHTUM!',tx,ty);",
 "ch.open=true;sound.chest();gfx.celebrate(tx,ty,{particles:120,text:'✨ REICHTUM!'});document.body.classList.add('screen-shake');setTimeout(()=>document.body.classList.remove('screen-shake'),550);"
)

once('main',
 "function showToast(message,type='success'){const box=document.createElement('div');box.className=`toast ${type}`;box.textContent=message;el('toast').appendChild(box);setTimeout(()=>box.remove(),3600)}",
 """function showToast(message,type='success'){
 if(!document.getElementById('toast-center-style')){
  const style=document.createElement('style');
  style.id='toast-center-style';
  style.textContent=`#toast{position:fixed;inset:0;pointer-events:none;z-index:260;display:flex;align-items:flex-start;justify-content:center;padding:max(18px,env(safe-area-inset-top)) 16px 0}
  #toast .toast{width:min(560px,calc(100vw - 32px));margin-top:0;padding:14px 18px;border:2px solid #c99c42;border-radius:14px;background:linear-gradient(180deg,#111420f2,#08090ef2);color:#ffe082;font:600 15px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 0 34px #000c,0 0 24px #c99c4233,0 10px 28px #000a;animation:toast-enter .35s cubic-bezier(.2,.9,.2,1),toast-exit .45s ease-in 3.15s forwards}
  #toast .toast.success{border-color:#c99c42;color:#ffe082;text-shadow:0 0 12px #c99c4255}
  #toast .toast.error{border-color:#b3543f;color:#ffb3a0;text-shadow:0 0 12px #b3543f55}
  @keyframes toast-enter{from{opacity:0;transform:translateY(-18px) scale(.96)}to{opacity:1;transform:none}}
  @keyframes toast-exit{to{opacity:0;transform:translateY(-14px) scale(.98)}}`;
  document.head.append(style);
 }
 const box=document.createElement('div');
 box.className=`toast ${type}`;
 box.textContent=message;
 el('toast').appendChild(box);
 setTimeout(()=>box.remove(),3600);
}"""
)

once('main',
 "function showFloorTransition(d){const o=el('floor-overlay'),t=el('floor-title');if(!o||!t)return;t.textContent=`EBENE ${d}`;o.classList.remove('hidden');setTimeout(()=>o.classList.add('hidden'),1700)}",
 """function showFloorTransition(d){
 const o=el('floor-overlay'),t=el('floor-title');
 if(!o||!t)return;
 t.textContent=`EBENE ${d}`;
 o.classList.remove('hidden');
 document.body.classList.add('screen-shake');
 setTimeout(()=>document.body.classList.remove('screen-shake'),550);
 setTimeout(()=>o.classList.add('hidden'),2100);
}"""
)

once('version',
 "export const VERSION_LABEL='v0.6.10';",
 "export const VERSION_LABEL='v0.6.11';"
)
texts['version'],count=re.subn(
 r"(\.\./world/render\.js)\?[^']*",
 r'\g<1>?v=0.6.11',
 texts['version']
)
print(f'Render-Import-Cache aktualisiert: {count}')

texts['html'],count=re.subn(
 r'(<title>[^<]*)v0\.6\.10([^<]*</title>)',
 r'\g<1>v0.6.11\g<2>',
 texts['html']
)
assert count==1
texts['html'],count=re.subn(
 r'(<button\b[^>]*\bdata-version\b[^>]*>)v0\.6\.10(</button>)',
 r'\g<1>v0.6.11\g<2>',
 texts['html']
)
assert count==3

heading='## 2026-10-22 – v0.6.11 – Prunkvolle Effekte und zentrierte Meldungen'
assert heading not in texts['log']
texts['log']=texts['log'].rstrip()+f"""

{heading}
- Truhenöffnung erhält Lichtblitz, Schockwelle, 120 leuchtende Partikel und Bildschirmwackeln.
- Zentrierter „REICHTUM!“-Text mit größerer Schrift und längerer Laufzeit.
- Partikel haben Größen, Schatten, Reibung und individuelle Gravitation.
- Neue Renderer-Effekte: flash, shockwave und celebrate.
- Ebenenwechsel erhält stärkeren Auftritt und längere Anzeige.
- Alle Erfolgs- und Fehlermeldungen erscheinen zentriert oben im Stil des Ebenenübergangs.
- Fehlermeldungen behalten rote Akzente; Erfolgsmeldungen goldene Akzente.
- Keine Änderung an Loot, Gold, Kampfwerten oder Speicherlogik.
- Browser- und Mobiltest erforderlich.
"""

for k,p in paths.items():p.write_text(texts[k],encoding='utf-8')
print('v0.6.11 vorbereitet: prunkvolle Effekte und zentrierte Meldungen.')
