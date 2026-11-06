// Reuse the existing navigation, fullscreen and language controls rather than
// duplicating their behavior or touching match state.
export function setupFieldMenu({document,onLanguageChange=()=>()=>{}}){
 const $=id=>document.getElementById(id),menu=$('fieldOps'),language=$('languageSelect'),fieldLanguage=$('fieldLanguage'),fullscreen=$('fullscreenToggle'),fieldFullscreen=$('fieldFullscreen');
 function sync(){fieldLanguage.value=language.value;fieldFullscreen.hidden=fullscreen.hidden;fieldFullscreen.textContent=fullscreen.textContent;fieldFullscreen.setAttribute('aria-pressed',fullscreen.getAttribute('aria-pressed')||'false');const status=$('fullscreenStatus'),copy=$('fieldFullscreenStatus');copy.hidden=status.hidden;copy.textContent=status.textContent;}
 // The field menu is a popover over live gameplay: the contract card, the status row
 // and the language flag all sit at z-index 5-10 and used to stay painted on top of
 // it, so the menu looked broken. One attribute on the workspace lets the stylesheet
 // put everything that is not the menu behind it, and no layout code has to move.
 const workspace=$('gameWorkspace');
 function syncOpen(){if(workspace)workspace.dataset.fieldMenu=menu.open?'open':'closed';}
 menu.addEventListener('toggle',syncOpen);syncOpen();
 fieldLanguage.addEventListener('change',()=>{language.value=fieldLanguage.value;language.dispatchEvent(new Event('change',{bubbles:true}));});
 for(const [source,target] of [['fieldBack','backToCommand'],['fieldParty','partyToggle'],['fieldMissionBoard','campaignShowBoard']])$(source).addEventListener('click',()=>{menu.open=false;$(target).click();});
 fieldFullscreen.addEventListener('click',()=>{menu.open=false;fullscreen.click();});
 document.addEventListener('fullscreenchange',sync);new MutationObserver(sync).observe($('fullscreenStatus'),{attributes:true,childList:true,characterData:true,subtree:true});new MutationObserver(sync).observe(fullscreen,{attributes:true,childList:true,characterData:true,subtree:true});onLanguageChange(sync);sync();
}
