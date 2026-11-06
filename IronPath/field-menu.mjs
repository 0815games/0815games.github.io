// Reuse the existing navigation, fullscreen and language controls rather than
// duplicating their behavior or touching match state.
export function setupFieldMenu({document,onLanguageChange=()=>()=>{}}){
 const $=id=>document.getElementById(id),menu=$('fieldOps'),language=$('languageSelect'),fieldLanguage=$('fieldLanguage'),fullscreen=$('fullscreenToggle'),fieldFullscreen=$('fieldFullscreen');
 function sync(){fieldLanguage.value=language.value;fieldFullscreen.hidden=fullscreen.hidden;fieldFullscreen.textContent=fullscreen.textContent;fieldFullscreen.setAttribute('aria-pressed',fullscreen.getAttribute('aria-pressed')||'false');const status=$('fullscreenStatus'),copy=$('fieldFullscreenStatus');copy.hidden=status.hidden;copy.textContent=status.textContent;}
 fieldLanguage.addEventListener('change',()=>{language.value=fieldLanguage.value;language.dispatchEvent(new Event('change',{bubbles:true}));});
 for(const [source,target] of [['fieldBack','backToCommand'],['fieldParty','partyToggle'],['fieldMissionBoard','campaignShowBoard']])$(source).addEventListener('click',()=>{menu.open=false;$(target).click();});
 // Dismissing the coaching card must not be a one-way door: this replays the seven
 // cards on the live field. It borrows the Command Center's "field tutorial" action
 // so there is exactly one replay path, not two that can drift apart.
 $('fieldCoachReplay').addEventListener('click',()=>{menu.open=false;$('menuTutorial').click();});
 fieldFullscreen.addEventListener('click',()=>{menu.open=false;fullscreen.click();});
 document.addEventListener('fullscreenchange',sync);new MutationObserver(sync).observe($('fullscreenStatus'),{attributes:true,childList:true,characterData:true,subtree:true});new MutationObserver(sync).observe(fullscreen,{attributes:true,childList:true,characterData:true,subtree:true});onLanguageChange(sync);sync();
}
