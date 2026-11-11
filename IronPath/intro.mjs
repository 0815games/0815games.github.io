import {translateStaticDom} from './language.mjs?v=20261130-germanfull1';
// The intro is independent of authentication. When it ends, any loading or
// connection error remains visible underneath instead of blocking sign-in.
export function startIntro({document,window,duration=4300}){
  const overlay=document.getElementById('introOverlay'),skip=document.getElementById('introSkip');
  if(!overlay||!skip)return ()=>{};
  const reduced=typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closed=false,timer;
  const close=()=>{
    if(closed)return;closed=true;window.clearTimeout(timer);overlay.hidden=true;
    skip.removeEventListener('click',close);document.removeEventListener('keydown',onKey);
  };
  const onKey=event=>{if(event.key==='Escape')close();};
  skip.addEventListener('click',close);document.addEventListener('keydown',onKey);
  timer=window.setTimeout(close,reduced?1200:duration);
  return close;
}
// The intro must not play behind the first-run language gate: a player who has
// not chosen yet would miss it entirely. Reloading after the choice re-runs this.
if(typeof document!=='undefined'&&typeof window!=='undefined'){
  // First paint in the player's language: account.js is still fetching the
  // Firebase SDK from the CDN while the intro and sign-in form are already
  // readable, and every static string used to stay English for that window.
  // This runs before the intro decision, so the module is always evaluated.
  let storage=null;try{storage=window.localStorage;}catch{storage=null;}
  translateStaticDom({document,storage});
  if(document.documentElement.dataset.langGate!=='1')startIntro({document,window});
}
