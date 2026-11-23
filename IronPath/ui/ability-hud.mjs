// The ability HUD: what the button says, and why it is grey.
//
// Owns no DOM and no simulation state. Returns `active` (`mark` alias too) so
// both `#abilityIcon` and `#ability` callers resolve the same active class mark.
import {abilityName} from '../core/skills.mjs?v=20261123-endless5';

// Abilities that need something to hit on the field.
const TARGETED=Object.freeze(['assault','recon','airDefense']);
export function abilityTargets(activeSkill){return TARGETED.includes(activeSkill);}

export function abilityHud(options){
  const {skills,cooldown=0,running=false,enemies=0,menuOpen=false,coopReady=true,ended=false}=options||{};
  const mark=skills?.active||null,variant=Number.isInteger(skills?.variant)?skills.variant:0,name=abilityName(skills);
  const seconds=Number.isFinite(cooldown)&&cooldown>0?Math.ceil(cooldown):0;
  const state=(reason,ready=false)=>({active:mark,mark,variant,name,ready,reason,seconds:reason==='cooldown'?seconds:0});
  if(!mark)return state('no-skill');
  if(ended)return state('ended');
  if(menuOpen)return state('panel-open');
  if(seconds>0)return state('cooldown');
  if(!coopReady)return state('waiting');
  if(!running)return state('not-running');
  if(abilityTargets(mark)&&!(Number.isFinite(enemies)&&enemies>0))return state('no-targets');
  return state('ready',true);
}

const GOLD='#e4ca89',EDGE='#1f3024';
const MARKS={
  // Airstrike: three streaks falling onto a burst.
  assault:`<g fill="${GOLD}" stroke="${EDGE}" stroke-width="0.6"><path d="M6 7 L11 12 L9.2 13.8 L4.2 8.8 Z"/><path d="M11 7 L16 12 L14.2 13.8 L9.2 8.8 Z"/><path d="M16 7 L21 12 L19.2 13.8 L14.2 8.8 Z"/></g><circle cx="8" cy="18" r="3.1" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.6"/>`,
  // Overdrive: a bolt through the barrel ring.
  engineer:`<path d="M13.5 3 L6.5 13.5 H11 L9.5 21 L17.5 10.5 H13 Z" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/>`,
  // Supply drop: a crate with a falling load above it.
  logistics:`<path d="M4 11 L20 11 L18 20 L6 20 Z" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/><path d="M3 8 L21 8 L21 10.4 L3 10.4 Z" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/><path d="M12 2 L12 6 M9.6 4 L12 6.4 L14.4 4" stroke="${GOLD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  // Field repair: the cross.
  medic:`<path d="M10 3.5 H14 V10 H20.5 V14 H14 V20.5 H10 V14 H3.5 V10 H10 Z" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/>`,
  // Suppression: three slowing waves.
  recon:`<g fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round"><path d="M5 8 A9 9 0 0 1 19 8"/><path d="M7.5 12.5 A6.5 6.5 0 0 1 16.5 12.5"/><path d="M10 17 A4 4 0 0 1 14 17"/></g>`,
  // Sky Sweep: twin anti-air barrels crossing under a radar lock arc.
  airDefense:`<g fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-linecap="round"><path d="M4.5 9.5 A8.5 8.5 0 0 1 19.5 9.5"/><path d="M8 17.5 L11.5 6.5 M16 17.5 L12.5 6.5"/><circle cx="12" cy="18.5" r="2.2" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.6"/></g>`
};
export const ABILITY_ICON_KINDS=Object.freeze(Object.keys(MARKS));

export function abilityHudSvg(activeSkill,{size=24,variant=0}={}){
  if(!Object.hasOwn(MARKS,activeSkill))return '';
  const w=Math.max(8,Math.round(size));
  const vBadge=variant===1?`<circle cx="19.5" cy="4.5" r="2.2" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/>`:variant===2?`<polygon points="19.5,1.8 21.8,4.5 19.5,7.2 17.2,4.5" fill="#9df2dd" stroke="${EDGE}" stroke-width="0.7"/>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${w}" height="${w}" aria-hidden="true" focusable="false">${MARKS[activeSkill]}${vBadge}</svg>`;
}
