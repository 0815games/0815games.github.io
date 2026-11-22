// The soldier's level while they are deployed.
//
// It used to be a bar as well: current XP, required XP and what was still
// missing, all in the status row over the battlefield. The operator's verdict
// was that it looked wild, and they were right - a combat HUD is not a
// character sheet. The level stays (it is one number, and it is the soldier);
// the bar, the "10 / 300" and the "still 290 to level 2" are gone. The Command
// Center and the report still show all of it, where there is room.
//
// The hard rule is unchanged and is the reason this file exists: this panel
// cannot guess. It has no way to be told "add 120 XP": the only input is the
// profile the account has already confirmed, so a save that has not come back
// cannot lift the level. That is exactly what "unconfirmed saves must not fake a
// level-up" means - a soldier who reads STUFE 4 on the field and STUFE 3 in the
// report has been lied to, and no retry queue can take that back.
import {characterProgress} from '../core/progression.mjs?v=20261105-prestige1';

export function createBattleXpHud(options){
  const {document,getProfile,tr}=options||{};
  if(!document||typeof document.getElementById!=='function'||typeof getProfile!=='function'||typeof tr!=='function')throw new Error('Invalid XP display');
  const node=id=>document.getElementById(id);
  // updateUI() runs on every command, so the text is only written when it
  // actually changed - but never cached across a language switch: the caller
  // re-renders through refreshLanguage() and the strings must follow.
  function write(id,text){const target=node(id);if(target&&target.textContent!==text)target.textContent=text;}
  return {
    // `fallbackLevel` is the level the soldier marched in with. It is used only
    // when nothing is confirmed yet, so the tile is never empty and never shows
    // a number nobody has confirmed.
    render(fallbackLevel){
      const profile=getProfile()||{},xp=profile.xp;
      if(!Number.isSafeInteger(xp)||xp<0){
        const level=Number.isFinite(fallbackLevel)&&fallbackLevel>=1?Math.floor(fallbackLevel):1;
        write('level',String(level));
        return null;
      }
      const progress=characterProgress(xp),remaining=progress.required-progress.current;
      write('level',String(progress.level));
      // `remaining` is no longer painted anywhere on the field; it stays in the
      // return value because the report and the tests still ask for it.
      return {...progress,remaining};
    },
  };
}
