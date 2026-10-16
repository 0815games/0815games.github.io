const VERSION_LABEL='v0.5.26';
function install(){
 try{
  const game=document.getElementById('game');if(!game||document.getElementById('changelog-viewer'))return;
  const dialog=document.createElement('dialog');dialog.id='changelog-viewer';dialog.className='changelog-viewer';dialog.setAttribute('aria-labelledby','changelog-title');
  dialog.innerHTML='<form method="dialog"><header class="changelog-header"><h2 id="changelog-title">📜 ÄNDERUNGEN</h2><button type="button" class="changelog-close" aria-label="Änderungen schließen">✕</button></header><div class="changelog-body" id="changelog-body" tabindex="0"><p class="changelog-loading">Änderungen werden geladen…</p></div><footer class="changelog-footer"><button type="button" class="changelog-close gold">Schließen</button></footer></form>';
  document.body.append(dialog);
  const style=document.createElement('style');style.id='changelog-viewer-style';style.textContent='#changelog-viewer{position:fixed;inset:0;width:100dvw;max-width:100dvw;height:100dvh;max-height:100dvh;margin:0;border:0;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:#05060af2;color:#e8e4d9;overflow:hidden}#changelog-viewer::backdrop{background:#05060ae6}#changelog-viewer form{display:flex;flex-direction:column;width:min(720px,100%);max-width:100%;height:100%;max-height:100%;margin:auto;background:#111420;border:2px solid #c99c42;border-radius:16px;box-shadow:0 20px 60px #000c;overflow:hidden}#changelog-viewer .changelog-header{display:flex;align-items:center;justify-content:space-between;gap:10px;flex:0 0 auto;padding:14px 16px;border-bottom:1px solid #3b4258;background:#171b29}#changelog-viewer h2{margin:0;color:#ffd36c;font-size:clamp(15px,4vw,20px);letter-spacing:.06em;overflow-wrap:anywhere}#changelog-viewer .changelog-close{flex:0 0 auto;width:44px;height:44px;padding:0;border:1px solid #c99c42;border-radius:10px;background:#24293c;color:#fff;font:inherit;font-size:18px;line-height:1;touch-action:manipulation}#changelog-viewer .changelog-body{flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px 16px;-webkit-overflow-scrolling:touch}#changelog-viewer .changelog-loading,#changelog-viewer .changelog-error{margin:0;color:#8b93a5}#changelog-viewer .changelog-error{color:#ff9a8b}#changelog-viewer details{margin:0 0 10px;border:1px solid #3b4258;border-radius:12px;background:#171b29;overflow:hidden}#changelog-viewer details[open]{border-color:#c99c42}#changelog-viewer summary{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;padding:10px 12px;color:#ffd36c;font-weight:700;cursor:pointer;list-style:none;overflow-wrap:anywhere}#changelog-viewer summary::-webkit-details-marker{display:none}#changelog-viewer summary::after{content:'+';color:#8b93a5;font-size:18px}#changelog-viewer details[open] summary::after{content:'−'}#changelog-viewer .changelog-entry{padding:0 12px 12px;color:#d7dbe6;font-size:14px;line-height:1.55}#changelog-viewer .changelog-entry ul{margin:8px 0 0;padding-left:18px}#changelog-viewer .changelog-entry li{margin:5px 0;overflow-wrap:anywhere}#changelog-viewer .changelog-footer{flex:0 0 auto;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid #3b4258;background:#171b29}#changelog-viewer .changelog-footer .gold{width:100%;min-height:48px;border:0;border-radius:10px;background:#c99c42;color:#16120a;font:inherit;font-weight:700;touch-action:manipulation}#changelog-viewer button:focus-visible,#changelog-viewer summary:focus-visible{outline:3px solid #ffe082;outline-offset:2px}.version-badge.changelog-trigger{cursor:pointer;border-color:#c99c42;color:#ffd36c;background:#24293c;min-height:32px;padding:4px 10px;font:inherit;font-size:11px;touch-action:manipulation}.version-badge.changelog-trigger:focus-visible{outline:3px solid #ffe082;outline-offset:2px}@media(prefers-reduced-motion:reduce){#changelog-viewer{transition:none}}';document.head.append(style);
  const body=dialog.querySelector('#changelog-body');let loaded=false,loading=false;
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function render(markdown){
   const sections=[];let current=null;
   for(const line of String(markdown).split(/\r?\n/)){
    const heading=line.match(/^##\s+(v\d+[^–]*?)\s*[–-]\s*(\d{4}-\d{2}-\d{2})?\s*[–-]?\s*(.*)$/);
    if(heading){current={title:heading[1].trim(),date:heading[2]?.trim()||'',subtitle:heading[3]?.trim()||'',items:[]};sections.push(current);continue;}
    if(!current)continue;
    const bullet=line.match(/^[-*]\s+(.*)$/);
    if(bullet)current.items.push(bullet[1].trim());
   }
   if(!sections.length){body.innerHTML='<p class="changelog-error">Keine Änderungen gefunden.</p>';return;}
   body.innerHTML=sections.map((section,index)=>`<details${index===0?' open':''}><summary><span>${escapeHtml(section.title)}${section.date?` · ${escapeHtml(section.date)}`:''}${section.subtitle?`<small>${escapeHtml(section.subtitle)}</small>`:''}</span></summary><div class="changelog-entry">${section.items.length?`<ul>${section.items.map(item=>`<li>${escapeHtml(item)}</li>`).join('')}</ul>`:'<p>Keine Detailpunkte hinterlegt.</p>'}</div></details>`).join('');
  }
  async function load(){
   if(loaded||loading)return;loading=true;
   try{const response=await fetch('change.log',{cache:'no-store'});if(!response.ok)throw new Error(`HTTP ${response.status}`);render(await response.text());loaded=true;}catch(error){console.warn('Changelog:',error);body.innerHTML='<p class="changelog-error">Änderungen konnten nicht geladen werden.</p>';}finally{loading=false;}
  }
  function open(){if(dialog.open)return;dialog.showModal();load();dialog.querySelector('.changelog-close').focus({preventScroll:true});}
  function close(){if(dialog.open)dialog.close();}
  dialog.querySelectorAll('.changelog-close').forEach(button=>button.addEventListener('click',close));
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
  document.querySelectorAll('[data-version]').forEach(badge=>{
   badge.textContent=VERSION_LABEL;badge.classList.add('changelog-trigger');badge.setAttribute('aria-haspopup','dialog');badge.setAttribute('aria-label',`${VERSION_LABEL}: Änderungen anzeigen`);
   badge.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();open();});
   badge.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();open();}});
  });
  if(game&&!game.querySelector('#game-version')){
   const header=game.querySelector('header')||game;
   const badge=document.createElement('button');badge.type='button';badge.id='game-version';badge.className='version-badge changelog-trigger';badge.dataset.version='';badge.textContent=VERSION_LABEL;badge.setAttribute('aria-haspopup','dialog');badge.setAttribute('aria-label',`${VERSION_LABEL}: Änderungen anzeigen`);
   badge.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();open();});
   header.append(badge);
  }
 }catch(error){console.warn('Changelog-Viewer konnte nicht initialisiert werden:',error);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0),{once:true});else setTimeout(install,0);
export {VERSION_LABEL};
