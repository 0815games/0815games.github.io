// Which towers on the field may be improved right now.
//
// Block 3 asks for a shimmer on the battlefield: only upgrades that are
// UNLOCKED and actually AFFORDABLE may be marked. The tower menu already says
// what a step costs and which specializations are still locked - the field had
// no such mark at all.
//
// Two ways to get this wrong, and the module is built against both:
//
//   * a tower that shimmers although the soldier cannot pay is a promise the
//     menu then refuses. Supplies are the one number that moves every frame, so
//     the answer is recomputed from the live wallet, never cached;
//   * a tower that shimmers although its branch is locked (Veteran at soldier
//     level 5, Boss Hunter at 10) points at a door that is still shut. The
//     question is the protocol's own question, asked through the same helper -
//     not a copy of it.
//
// The mark is an invitation, so the one tower whose sheet is already open
// stays quiet: that sheet states the price in full.
import {upgradeCost} from './progression.mjs?v=20261105-prestige1';
import {upgradeCostFor,anyBranchUnlocked} from './tower-specialization.mjs?v=20261123-skill1';

// `supplies` is what the soldier can spend right now; `level` their soldier
// level, which gates the two later specializations.
export function upgradeCue(tower,{supplies,level}={}){
  if(!tower||!Number.isSafeInteger(tower.level)||tower.level<1)return null;
  const base=upgradeCost(tower.level);
  // Nothing left to unlock at this level (a broken or oversized tower).
  if(base===null)return null;
  const cost=upgradeCostFor(tower,base);
  if(!Number.isSafeInteger(cost))return null;
  // Level two is the specialization step: it only counts when at least one
  // branch is open to this soldier.
  if(tower.level===2&&!anyBranchUnlocked(level))return null;
  if(!Number.isSafeInteger(supplies)||supplies<cost)return null;
  return {cost};
}

// The towers to mark, as pad positions ready to draw. `skipPad` is the pad
// whose sheet is open - `null` when nothing is open.
export function towerUpgradeCues(state,{supplies,level,pads,skipPad=null}={}){
  if(!state||!Array.isArray(state.towers)||!Array.isArray(pads))return [];
  // A finished operation invites nothing: the field is being read, not played.
  if(state.ended)return [];
  const cues=[];
  for(const tower of state.towers){
    if(!tower||tower.pad===skipPad)continue;
    const pad=pads[tower.pad];
    if(!pad||!Number.isFinite(pad.x)||!Number.isFinite(pad.y))continue;
    if(!upgradeCue(tower,{supplies,level}))continue;
    cues.push({x:pad.x,y:pad.y});
  }
  return cues;
}
