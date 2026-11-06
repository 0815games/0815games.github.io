// First-run language choice.
//
// A player who has never opened this game cannot read an English hint telling
// them how to switch language, so the choice comes before anything else: before
// the intro animation, before sign-in. Both languages are printed on both
// buttons, so neither reader is lost.
//
// The choice is stored per device (`ironpath:language`) and the page reloads, so
// the intro, the sign-in form and every module initialise in the chosen language
// instead of being re-rendered piecemeal. A returning player on a new device is
// asked again; that is the point of storing it per device.
export const LANGUAGE_KEY='ironpath:language';
export const LANGUAGES=Object.freeze(['en','de']);

// Pure: does this device still need to be asked?
export function needsLanguageChoice(storage){
  try{const saved=storage?.getItem(LANGUAGE_KEY);return !LANGUAGES.includes(saved);}catch{return true;}
}

// Pure: is this a language the game can actually render?
export function isSupportedLanguage(value){return LANGUAGES.includes(value);}

export function setupLanguageGate({document,storage,reload=()=>{}}){
  const gate=document.getElementById('languageGate');
  if(!gate)return {open:false,choose:()=>{},dismiss:()=>{}};
  const close=()=>{gate.hidden=true;delete document.documentElement.dataset.langGate;};
  const choose=language=>{
    if(!isSupportedLanguage(language))return false;
    try{storage?.setItem(LANGUAGE_KEY,language);}catch{/* The reload still picks a default. */}
    close();reload();
    return true;
  };
  // Choosing is remembered; Escape/backdrop is not offered, because there is no
  // correct default language to fall back on. A keyboard user can still pick.
  for(const button of gate.querySelectorAll('[data-language]'))button.addEventListener('click',()=>choose(button.dataset.language));
  const first=gate.querySelector('[data-language]');
  if(!gate.hidden)first?.focus?.({preventScroll:true});
  return {open:!gate.hidden,choose,dismiss:close};
}

// Runs only in a browser; the import is a no-op under Node tests.
if(typeof document!=='undefined'&&typeof window!=='undefined'){
  let storage=null;try{storage=window.localStorage;}catch{storage=null;}
  if(needsLanguageChoice(storage)){
    // The inline bootstrap already unhid the gate; wire the buttons and reload.
    setupLanguageGate({document,storage,reload:()=>window.location.reload()});
  }else{
    const gate=document.getElementById('languageGate');
    if(gate)gate.hidden=true;
    delete document.documentElement.dataset.langGate;
  }
}
