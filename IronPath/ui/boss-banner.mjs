// The boss, announced in the middle of the field.
//
// The small boss plate at the top of the field says a boss is coming and how
// he fights, and it stays for the whole fight - that is its job. What it
// cannot do is land like a headline. When a boss wave starts, the field
// itself carries the announcement for a few seconds: a centred banner in the
// map title's frame, in the boss plate's red, with the boss's name set wide -
// and then it goes away on its own and leaves the small plate to the fight.
//
// The rules that matter, the same ones the map title learned:
//
//   * it takes NO TAPS. It is a card over a field the player may already be
//     fighting on; `pointer-events` is the stylesheet's business, but nothing
//     here may fight it;
//   * it leaves on its own. There is no button to dismiss it. The clock is
//     injected so a test can hold it;
//   * one boss, one announcement. The caller keys the announcement (wave and
//     boss kind); the same key offered again - every frame of the same boss
//     wave - is not a new headline. A new key is. `reset()` forgets the key,
//     because a new battle may announce the same boss again;
//   * it never fails over a missing node. The announcement is information,
//     not a load-bearing wall: a harness without the banner still gets the
//     small boss plate, and the field keeps running.
//
// The reverted #338 banner is the counterexample kept in PATCH-BLOECKE: a red
// blinking box in the corner, drawn inside the canvas painter, calling a
// label function the painter did not import - with a real boss that threw
// and froze the field. This module is DOM, holds no game state, and is
// tested with a real clock stub; the painter test with a real boss lives in
// tests/cartoon-art.test.mjs.

export function createBossBanner(document,{holdMs=4000,fadeMs=600,
  setTimer=setTimeout,clearTimer=clearTimeout,onChange=null}={}){
  if(!document||typeof document.getElementById!=='function')throw Error('Invalid boss banner');
  if(!Number.isSafeInteger(holdMs)||holdMs<200)throw Error('Invalid boss banner timing');
  if(!Number.isSafeInteger(fadeMs)||fadeMs<0)throw Error('Invalid boss banner timing');
  if([setTimer,clearTimer].some(fn=>typeof fn!=='function'))throw Error('Invalid boss banner timer');
  const $=id=>document.getElementById(id);
  const card=$('bossBanner'),eyebrow=$('bossBannerEyebrow'),
    name=$('bossBannerName'),text=$('bossBannerText');
  let timer=null,announced=null;
  function cancel(){if(timer!==null){clearTimer(timer);timer=null;}}
  // The stylesheet owns the fade; a DOM without `classList` (a test harness,
  // an older browser) still gets the banner, only without the animation.
  function fading(on){
    if(!card||typeof card.classList?.remove!=='function')return;
    if(on)card.classList.add('is-leaving');else card.classList.remove('is-leaving');
  }
  function hide(){
    cancel();
    fading(false);
    if(card)card.hidden=true;
    onChange?.({showing:false,key:announced});
  }
  return Object.freeze({
    // A boss is incoming or has entered: put his name in the middle of the
    // field, hold it, fade it, take it out of the way. Offering the same key
    // again is a no-op, so the caller may offer every frame.
    announce(key,{eyebrow:eyebrowText='',name:nameText='',text:infoText=''}={}){
      if(!key||key===announced)return false;
      announced=key;
      cancel();
      if(eyebrow)eyebrow.textContent=String(eyebrowText??'');
      if(name)name.textContent=String(nameText??'');
      if(text)text.textContent=String(infoText??'');
      fading(false);
      if(card)card.hidden=false;
      // Two steps, like the map title: hold it, then fade it out, then take
      // it out of the way. The class animates the leaving; `hidden` removes.
      timer=setTimer(()=>{
        timer=null;
        fading(true);
        timer=setTimer(()=>{timer=null;hide();},fadeMs);
      },holdMs);
      onChange?.({showing:true,key:announced});
      return true;
    },
    hide,
    showing(){return !!card&&!card.hidden;},
    announcedFor(){return announced;},
    // A new battle begins: forget which boss was announced, so the same
    // boss on the same wave number may be announced again.
    reset(){announced=null;hide();},
  });
}
