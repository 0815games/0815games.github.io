from pathlib import Path

root=Path('.')
files={
 'main':root/'rpg/js/main.js',
 'render':root/'rpg/js/world/render.js',
 'version':root/'rpg/js/core/version.js',
 'html':root/'rpg/index.html',
 'sw':root/'rpg/sw.js',
 'log':root/'change.log',
 'toast_css':root/'rpg/css/toast.css',
}
texts={k:p.read_text(encoding='utf-8') for k,p in files.items() if k!='toast_css'}

def once(key,old,new,label):
 assert texts[key].count(old)==1, f'{label}: {texts[key].count(old)} Treffer'
 texts[key]=texts[key].replace(old,new,1)

# 1. Alten Inline-Toast-Stil vollständig aus index.html entfernen
old_style="""  <style>
    #toast{position:fixed;top:max(18px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:200;display:flex;flex-direction:column;gap:8px;pointer-events:none;width:min(92vw,420px);}
    .toast{padding:12px 16px;border-radius:12px;font-size:14px;box-shadow:0 12px 32px #000a;animation:toastIn .35s cubic-bezier(.2,1.3,.3,1);}
    .toast.success{background:#102416;border:1px solid #3d7a4a;color:#a5d6a7;}
    .toast.error{background:#2b1111;border:1px solid #8b3a3a;color:#ff8a80;}
    @keyframes toastIn{from{opacity:0;transform:translateY(-18px) scale(.95);}to{opacity:1;transform:translateY(0) scale(1);}}
  </style>
"""
once('html',old_style,'','Alter Inline-Toast-Stil')

# 2. Neue zentrale Toast-CSS einbinden
once('html',
 '  <link rel="stylesheet" href="css/style.css?v=0.6.0">',
 '  <link rel="stylesheet" href="css/style.css?v=0.6.0">\n  <link rel="stylesheet" href="css/toast.css?v=0.6.12">',
 'Toast-CSS-Link'
)

# 3. Style-Injektion aus main.js entfernen; showToast wird schlank
old_show="""function showToast(message,type='success'){
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
new_show="""function showToast(message,type='success'){
 const box=document.createElement('div');
 box.className=`toast ${type}`;
 box.textContent=message;
 el('toast').appendChild(box);
 setTimeout(()=>box.remove(),4200);
}"""
once('main',old_show,new_show,'showToast')

# 4. Treppe: echte Renderer-Effekte
old_interact="""function interact(){if(state.inCombat)return;const s=state.world.stairs;if(s&&state.player.x===s.x&&state.player.y===s.y){sound.stairs();map.generate(state.world.depth+1);state.meta.bestDepth=Math.max(state.meta.bestDepth,state.world.depth);showFloorTransition(state.world.depth);log(`Du steigst auf Ebene ${state.world.depth} hinab.`);hud();saveCurrentSlot()}}"""
new_interact="""function interact(){
 if(state.inCombat)return;
 const s=state.world.stairs;
 if(s&&state.player.x===s.x&&state.player.y===s.y){
  sound.stairs();
  gfx.flash('#ffd54f',.8,.85);
  gfx.shockwave(state.player.x,state.player.y,'#ffd54f');
  gfx.shockwave(state.player.x,state.player.y,'#fff8e1');
  for(let i=0;i<100;i++){
   const a=Math.random()*Math.PI*2,spread=45+Math.random()*140;
   gfx.particles.push({
    x:state.player.x*32+16,y:state.player.y*32+16,
    vx:Math.cos(a)*spread,vy:-75-Math.random()*160,
    a:1,c:['#ffd54f','#ffca28','#fff8e1'][i%3],
    size:2+Math.random()*3,gravity:35+Math.random()*35
   });
  }
  map.generate(state.world.depth+1);
  state.meta.bestDepth=Math.max(state.meta.bestDepth,state.world.depth);
  showFloorTransition(state.world.depth);
  log(`Du steigst auf Ebene ${state.world.depth} hinab.`);
  hud();
  saveCurrentSlot();
 }
}"""
once('main',old_interact,new_interact,'Ebenenwechsel')

# 5. Truhe: alten celebrate-Aufruf durch den stärkeren ersetzen
once('main',
 "gfx.celebrate(tx,ty,{particles:120,text:'✨ REICHTUM!'})",
 """gfx.flash('#ffe082',.9,.9);
 gfx.shockwave(tx,ty,'#ffd54f');
 gfx.shockwave(tx,ty,'#fff8e1');
 gfx.shockwave(tx,ty,'#ff9800');
 for(let i=0;i<200;i++){
  const a=Math.random()*Math.PI*2,speed=85+Math.random()*250;
  gfx.particles.push({
   x:tx*32+16,y:ty*32+16,
   vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-115,
   a:1,c:['#ffd54f','#ffca28','#ff9800','#fff8e1'][i%4],
   size:2+Math.random()*4,gravity:60+Math.random()*55
  });
 }
 gfx.text('✨ REICHTUM!',tx,ty,'#ffd54f',40,2.2)""",
 'Truhen-Effekt'
)

# 6. Renderer: Schockwellen sichtbarer und langlebiger
once('render',
 "this.waves.push({x:x*this.tile+16,y:y*this.tile+16,r:8,a:.9,color});",
 "this.waves.push({x:x*this.tile+16,y:y*this.tile+16,r:10,a:1,color});",
 'Schockwelle'
)
once('render',
 "w.r+=260*dt;w.a-=dt*1.6;return w.a>0;",
 "w.r+=340*dt;w.a-=dt*1.1;return w.a>0;",
 'Schockwellen-Update'
)

# 7. Version, Build und Caches
once('version',"export const VERSION_LABEL='v0.6.11';","export const VERSION_LABEL='v0.6.12';",'Version')
once('html','data-rpg-build="0.6.11"','data-rpg-build="0.6.12"','HTML-Build')
once('html','js/main.js?v=0.6.11','js/main.js?v=0.6.12','main.js-Cache')
once('html','js/systems/mobile.js?v=0.6.11','js/systems/mobile.js?v=0.6.12','mobile.js-Cache')
once('sw',"const CACHE='schattengruft-v0.6.11';","const CACHE='schattengruft-v0.6.12';",'SW-Cache')

# 8. Changelog
heading='## 2026-10-22 – v0.6.12 – Toast-Stil bereinigt und Übergänge verstärkt'
assert heading not in texts['log']
texts['log']=texts['log'].rstrip()+f"""

{heading}
- Alten grünen Inline-Toast-Stil vollständig aus index.html entfernt.
- Toast-Stil ausschließlich in css/toast.css zentralisiert.
- Erfolgsmeldungen gold, Fehlermeldungen rot; keine konkurrierenden Styles mehr.
- JavaScript injiziert keine Toast-Styles mehr.
- Ebenenwechsel erhält Lichtblitz, zwei Schockwellen und 100 aufsteigende Funken.
- Truhenöffnung erhält stärkeren Blitz, drei Schockwellen, 200 Funken und größeren Text.
- Schockwellen sind größer, heller und sichtbar länger.
- Version, Build-Metadatum, Modul-Cache-Parameter und Service-Worker-Cache auf 0.6.12 erhöht.
- Keine Änderung an Loot, Gold, Kampfwerten oder Speicherlogik.
- Aufräumarbeiten: v0611_patch.py, v0612_patch.py und ungewollte Arbeitsdateien bleiben unversioniert und werden nach Freigabe entfernt.
"""

files['toast_css'].write_text("""#toast{position:fixed;inset:0;z-index:260;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;pointer-events:none;padding:max(18px,env(safe-area-inset-top)) 16px 0}
#toast .toast{width:min(560px,calc(100vw - 32px));padding:14px 18px;border:2px solid #c99c42;border-radius:14px;background:linear-gradient(180deg,#1b1608f2,#08090ef2);color:#ffe082;font:600 15px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 0 34px #000c,0 0 26px #c99c4255,0 10px 28px #000a;animation:toast-enter .35s cubic-bezier(.2,.9,.2,1),toast-exit .45s ease-in 3.75s forwards}
#toast .toast.success{border-color:#c99c42;background:linear-gradient(180deg,#1b1608f2,#08090ef2);color:#ffe082;text-shadow:0 0 14px #c99c4288}
#toast .toast.error{border-color:#b3543f;background:linear-gradient(180deg,#22100af2,#08090ef2);color:#ffb3a0;text-shadow:0 0 14px #b3543f88}
@keyframes toast-enter{from{opacity:0;transform:translateY(-18px) scale(.96)}to{opacity:1;transform:none}}
@keyframes toast-exit{to{opacity:0;transform:translateY(-14px) scale(.98)}}
""",encoding='utf-8')

for key,path in files.items():
 if key in texts:
  path.write_text(texts[key],encoding='utf-8')

print('v0.6.12 vorbereitet: alter Toast-Stil entfernt, Effekte zentral und stärker.')
