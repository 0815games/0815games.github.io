// The rank line of the after-action report: what the uniform shows now, and
// whether this operation changed it.
//
// A rank is never stored and never awarded - it is read off the level, the same
// way the menu, the dossier and the four-player panel read it. This module only
// answers the two questions the report asks: which rank is this, and did this
// report earn a new one?
//
// Both numbers it works from are confirmed. The XP total comes from the saved
// profile; the gained levels come from the deltas of committed saves, the same
// numbers that fill the XP and scrap tiles. The unconfirmed run is never asked,
// so a report whose rewards are still in the air cannot promote anybody - the
// rule the XP tile in the battle HUD already follows.
import {characterProgress} from './progression.mjs?v=20261105-prestige1';
import {rankForLevel,rankProgress} from './rank-insignia.mjs?v=20261119-block6b';

// `levelsGained` is the number of levels THIS report added - not a lifetime
// count, and not a guess at what the last wave was worth.
export function reportRank({xp,levelsGained=0}={}){
  if(!Number.isSafeInteger(xp)||xp<0)return null;
  const {level,current,required}=characterProgress(xp);
  const gained=Math.max(0,Number.isFinite(levelsGained)?Math.trunc(levelsGained):0);
  const rank=rankForLevel(level),previous=rankForLevel(Math.max(1,level-gained));
  const {next}=rankProgress(level);
  // Levels alone are not a promotion; only crossing a threshold is. A soldier
  // who went from level 4 to 5 is still a Private, and the report says so by
  // staying quiet about ranks.
  return {level,current,required,rank,previous,next,promoted:gained>0&&previous.id!==rank.id};
}
