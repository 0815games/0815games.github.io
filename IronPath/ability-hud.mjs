// The ability HUD: what the button says, and why it is grey.
//
// The old button answered one question - "can I press it?" - and stayed silent
// about the rest, which is how a soldier ends up staring at a dead button. This
// module answers the second question too, in the order a player would ask it:
// the operation is over, there is no ability chosen, a panel is in the way, the
// ability is recharging, the party is not ready, the wave has not started, or
// there is nothing to hit.
//
// It owns no DOM and no state: `game.js` has both. What it decides is
// presentation, never simulation - nothing here can fire an ability or change a
// cooldown.
import {abilityName} from './skills.mjs?v=20261107-balance1';

// Abilities that need something to hit. An airstrike over an empty field is a
// wasted cooldown and suppression of nothing is nothing; towers, supplies and
// the bunker are always there, so the rest work anywhere.
const TARGETED=Object.freeze(['assault','recon']);
export function abilityTargets(activeSkill){return TARGETED.includes(activeSkill);}

// `enemies` is a count, `cooldown` seconds of game time still to wait. A `null`
// arrives from callers that lost their match: an unreadable field is a quiet
// button, never an exception.
export function abilityHud(options){
  const {skills,cooldown=0,running=false,enemies=0,menuOpen=false,coopReady=true,ended=false}=options||{};
  const active=skills?.active,name=abilityName(skills);
  const seconds=Number.isFinite(cooldown)&&cooldown>0?Math.ceil(cooldown):0;
  const state=(reason,ready=false)=>({active,name,ready,reason,seconds:reason==='cooldown'?seconds:0});
  if(!active)return state('no-skill');
  if(ended)return state('ended');
  if(menuOpen)return state('panel-open');
  if(seconds>0)return state('cooldown');
  if(!coopReady)return state('waiting');
  if(!running)return state('not-running');
  if(abilityTargets(active)&&!(Number.isFinite(enemies)&&enemies>0))return state('no-targets');
  return state('ready',true);
}

// One mark per ability, drawn in the same stencil gold as the rank insignia:
// a falling strike, a bolt, a crate, a cross and a slowing wave. Decorative - the
// name is always written next to it - so the caller may hide it from a reader.
const GOLD='#e4ca89',EDGE='#1f3024';
const MARKS={
  // Airstrike: three streaks falling out of the corner onto a burst.
  assault:`<g fill="${GOLD}" stroke="${EDGE}" stroke-width="0.6"><path d="M6 7 L11 12 L9.2 13.8 L4.2 8.8 Z"/><path d="M11 7 L16 12 L14.2 13.8 L9.2 8.8 Z"/><path d="M16 7 L21 12 L19.2 13.8 L14.2 8.8 Z"/></g><circle cx="8" cy="18" r="3.1" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.6"/>`,
  // Overdrive: a bolt through the barrel ring.
  engineer:`<path d="M13.5 3 L6.5 13.5 H11 L9.5 21 L17.5 10.5 H13 Z" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/>`,
  // Supply drop: a crate with a falling load above it.
  logistics:`<path d="M4 11 L20 11 L18 20 L6 20 Z" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/><path d="M3 8 L21 8 L21 10.4 L3 10.4 Z" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/><path d="M12 2 L12 6 M9.6 4 L12 6.4 L14.4 4" stroke="${GOLD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
  // Field repair: the cross.
  medic:`<path d="M10 3.5 H14 V10 H20.5 V14 H14 V20.5 H10 V14 H3.5 V10 H10 Z" fill="${GOLD}" stroke="${EDGE}" stroke-width="0.7"/>`,
  // Suppression: three waves slowing to a stop.
  recon:`<g fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round"><path d="M5 8 A9 9 0 0 1 19 8"/><path d="M7.5 12.5 A6.5 6.5 0 0 1 16.5 12.5"/><path d="M10 17 A4 4 0 0 1 14 17"/></g>`,
};
export const ABILITY_ICON_KINDS=Object.freeze(Object.keys(MARKS));

export function abilityHudSvg(activeSkill,{size=24}={}){
  if(!Object.hasOwn(MARKS,activeSkill))return '';
  const w=Math.max(8,Math.round(size));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${w}" height="${w}" aria-hidden="true" focusable="false">${MARKS[activeSkill]}</svg>`;
}
