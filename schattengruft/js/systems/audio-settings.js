import { sound } from './audio.js';
const KEY='schattengruft-audio-v1';
const volume=(v,fallback)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(100,v)):fallback;
function restore(raw){try{const data=JSON.parse(raw||'null');if(!data||typeof data!=='object')return;sound.musicVolume=volume(data.musicVolume,sound.musicVolume);sound.sfxVolume=volume(data.sfxVolume,sound.sfxVolume);if(typeof data.musicMuted==='boolean')sound.musicMuted=data.musicMuted;sound.applyVolumes();}catch{}}
try{restore(localStorage.getItem(KEY));}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify({musicVolume:sound.musicVolume,sfxVolume:sound.sfxVolume,musicMuted:sound.musicMuted}));}catch{}document.dispatchEvent(new Event('rpg-audio-settings'));}
for(const name of ['setMusicVolume','setSfxVolume','toggleMusic','startMusic']){const original=sound[name];sound[name]=function(...args){const result=original.apply(this,args);save();return result;};}
function setup(){
 const css=document.createElement('style');css.textContent='#audio-settings-button{position:fixed;right:max(8px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));z-index:130;min-height:44px;padding:8px 12px;background:#151b29;color:#ffe082;border:1px solid #c99c42;border-radius:10px}#audio-settings-dialog{width:min(440px,calc(100vw - 24px));max-height:calc(100dvh - 32px);overflow-y:auto;overflow-x:hidden;background:#111420;color:#e8e4d9;border:2px solid #c99c42;border-radius:16px;padding:20px}#audio-settings-dialog::backdrop{background:#000b}#audio-settings-dialog label{display:block;margin:14px 0;line-height:1.5}#audio-settings-dialog input[type=range]{display:block;width:100%;min-height:44px}#audio-settings-dialog button{min-height:44px;padding:10px;border:1px solid #c99c42;border-radius:10px;color:#fff;background:#24293c}';document.head.append(css);
 const dialog=document.createElement('dialog');dialog.id='audio-settings-dialog';dialog.setAttribute('aria-labelledby','audio-settings-title');dialog.innerHTML='<h2 id="audio-settings-title">Audioeinstellungen</h2><label for="settings-music">Musik <output id="settings-music-value"></output></label><input id="settings-music" type="range" min="0" max="100" step="1"><label for="settings-sfx">Effekte <output id="settings-sfx-value"></output></label><input id="settings-sfx" type="range" min="0" max="100" step="1"><label><input id="settings-muted" type="checkbox"> Musik stummschalten</label><p id="settings-storage-status">Einstellungen gelten für Intro, Login, Auswahl und Spiel.</p><button id="settings-close" type="button">Zurück</button>';document.body.append(dialog);
 const button=document.createElement('button');button.id='audio-settings-button';button.type='button';button.textContent='🎵 Audio';button.setAttribute('aria-label','Audioeinstellungen öffnen');document.body.append(button);
 const el=id=>document.getElementById(id);let previous=null;
 function sync(){
  for(const[id,value]of [['settings-music',sound.musicVolume],['music-volume',sound.musicVolume],['settings-sfx',sound.sfxVolume],['sfx-volume',sound.sfxVolume]])if(el(id))el(id).value=value;
  for(const[id,value]of [['settings-music-value',sound.musicVolume],['music-volume-value',sound.musicVolume],['settings-sfx-value',sound.sfxVolume],['sfx-volume-value',sound.sfxVolume]])if(el(id))el(id).textContent=`${value}%`;
  el('settings-muted').checked=sound.musicMuted;
  document.querySelectorAll('[data-music-toggle],#sound').forEach(b=>b.textContent=sound.musicMuted?'🔇':'🎵');
  button.textContent=sound.musicMuted?'🔇 Audio':'🎵 Audio';
 }
 function open(){previous=document.activeElement;sync();dialog.showModal();el('settings-music').focus();}
 button.onclick=open;el('settings-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{if(previous?.isConnected)previous.focus();});
 document.addEventListener('input',e=>{const id=e.target.id;if(['settings-music','music-volume'].includes(id)){e.stopImmediatePropagation();sound.setMusicVolume(Number(e.target.value));if(sound.musicVolume===0)sound.stopMusic();else if(!sound.musicMuted)sound.startMusic();}else if(['settings-sfx','sfx-volume'].includes(id)){e.stopImmediatePropagation();sound.setSfxVolume(Number(e.target.value));}},true);
 el('settings-muted').onchange=e=>{if(e.target.checked!==sound.musicMuted)sound.toggleMusic();};
 window.addEventListener('keydown',e=>{if(dialog.open){if(e.key==='Escape'){e.preventDefault();dialog.close();}e.stopImmediatePropagation();return;}if(e.target===button&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)open();}},true);
 document.addEventListener('rpg-audio-settings',sync);
 window.addEventListener('storage',e=>{if(e.key!==KEY)return;restore(e.newValue);if(sound.musicMuted||sound.musicVolume===0)sound.stopMusic();else sound.startMusic();sync();});
 try{const check=localStorage.getItem(KEY);void check;}catch{el('settings-storage-status').textContent='Browser-Speicher nicht verfügbar. Einstellungen gelten nur für diese Sitzung.';}
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
