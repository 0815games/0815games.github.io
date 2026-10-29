export const ABILITY_KEYS=['q','e','r'];
export function activateAbilityShortcut(event,buttons,allowed){
 const index=ABILITY_KEYS.indexOf(String(event.key).toLowerCase());
 if(index<0||event.altKey||event.ctrlKey||event.metaKey||event.isComposing)return false;
 event.preventDefault();event.stopImmediatePropagation();
 const button=buttons[index];
 if(!allowed||event.repeat||!button||button.disabled||button.hidden||button.getAttribute('aria-disabled')==='true')return true;
 button.click();return true;
}
export function isInteractionKey(event){
 return !event.altKey&&!event.ctrlKey&&!event.metaKey&&!event.isComposing&&(event.key==='Enter'||event.key===' ');
}
