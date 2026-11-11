// Build-wide feature switches (Stufe 1 of the modularization).
//
// Every large area of the game can be switched off here: the entry points
// disappear from the UI, their Firebase listeners are never wired and their
// side-effecting code paths return early. Flipping a flag to false is the
// supported way to "take a part out" for a special build; the code itself
// stays in the repository so nothing rots.
//
// Rules for this file:
// - A flag must default to the shipping configuration (everything on).
// - A flag must gate a WHOLE area, not a single string or color.
// - Unknown keys are ignored by resolveFeatures, so tests and callers cannot
//   invent switches that nothing reads.
export const FEATURES=Object.freeze({
  // Solo operations.
  campaign:true,     // the 50-mission story: menu card, mission board, cinematics
  endless:true,      // free play: menu card and quick select
  endlessMenu:true,  // the endless launch dialog (record, battlefield choice, loadout)
  // Online play (2P co-op/1v1 and the four-player lobby share one switch).
  multiplayer:true,
  // Progression surfaces.
  workshop:true,     // armory workshop tab, workshop loadouts and reward receipts
  friends:true,      // friend list, search and presence
  leaderboards:true, // high scores: recording and the scores dialog
  // Guidance.
  tutorial:true,     // the field tutorial / first-run contract
  coach:true,        // the seven in-field coach cards
  // Presentation.
  voiceOver:true,    // mission voice-over playback
  actVideos:true,    // the illustrated act intro videos
});

// Pure merge for tests and future build variants: only known keys, only
// booleans, never invents a switch.
export function resolveFeatures(overrides={},base=FEATURES){
  const out={};
  for(const key of Object.keys(base))out[key]=overrides[key]===undefined?base[key]:overrides[key]===true;
  return Object.freeze(out);
}

export function featureEnabled(key,features=FEATURES){
  return Object.hasOwn(features,key)&&features[key]===true;
}

// Hide every statically marked entry point of a disabled feature. Runs once
// at boot (see intro.mjs, before the Firebase SDK finishes loading); dynamic
// elements are guarded where they are created.
export function applyFeatureVisibility(document,features=FEATURES){
  if(!document||typeof document.querySelectorAll!=='function')return;
  for(const element of document.querySelectorAll('[data-feature]')){
    const key=element.getAttribute('data-feature');
    if(Object.hasOwn(features,key))element.hidden=features[key]!==true;
  }
}
