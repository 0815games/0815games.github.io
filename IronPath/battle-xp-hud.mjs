// The soldier's confirmed experience, shown while they are deployed.
//
// Block 3 asks for the level, the current and the required XP, a bar and what
// is still missing — DURING the mission, not only in the menu and the report.
//
// The one hard rule is that this panel cannot guess. It has no way to be told
// "add 120 XP": the only input is the profile the account has already
// confirmed, so a save that has not come back cannot move the bar by a pixel
// and cannot lift the level. That is exactly what the requirement means by
// "unconfirmed saves must not fake a level-up" — a soldier who reads STUFE 4
// on the field and STUFE 3 in the report has been lied to, and no retry queue
// can take that back. The field radio reports saves on its own.
import {characterProgress} from './progression.mjs?v=20261105-prestige1';

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
      const profile=getProfile()||{},xp=profile.xp,box=node('levelXpBox');
      if(!Number.isSafeInteger(xp)||xp<0){
        const level=Number.isFinite(fallbackLevel)&&fallbackLevel>=1?Math.floor(fallbackLevel):1;
        write('level',String(level));
        if(box)box.hidden=true;
        return null;
      }
      const progress=characterProgress(xp),remaining=progress.required-progress.current;
      write('level',String(progress.level));
      write('levelXpText',tr('{current} / {required} XP',progress));
      write('levelXpLeft',tr('{amount} XP to level {level}',{amount:remaining,level:progress.level+1}));
      const bar=node('levelXpBar');
      if(bar){bar.max=progress.required;bar.value=progress.current;}
      if(box)box.hidden=false;
      return {...progress,remaining};
    },
  };
}
