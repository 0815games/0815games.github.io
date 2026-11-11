// The rendered portraits: one AI-rendered soldier image per look, in the same
// semi-realistic style as the game's artwork. This module maps an avatar to
// its asset URL; there is no procedural face painting anymore (reported: the
// canvas-drawn comic face should be a "realistisches Rendering", 1:1 with the
// game's graphics). Unknown or missing looks clamp to the gender's first
// portrait, so a stale mirror string can never produce a broken image.
import {looksFor} from './avatar.mjs?v=20261112-avatar3';

// Bump together with the portrait files on every art re-issue.
export const PORTRAIT_TOKEN='20261112-avatar2';

export function avatarPortrait(avatar){
  const looks=looksFor(avatar?.gender);
  const index=Math.min(Math.max(0,Number(avatar?.look)||0),looks.length-1);
  const look=looks[index]??looks[0];
  return look?`assets/portraits/${look.file}?v=${PORTRAIT_TOKEN}`:null;
}
