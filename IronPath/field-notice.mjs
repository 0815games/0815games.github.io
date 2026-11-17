// The one message that still comes to the field.
//
// Everything else went away. The radio line that reported every move is gone,
// and the handset that opened the log behind it is gone with it: a player in a
// firefight does not read a ticker. What is left is the message that matters,
// and it arrives the way a shout does - from above, under the status bar, it
// stays for a moment and it goes away on its own.
//
// It is raised for what the player asked for and did not get - the simulation
// refused a build, an upgrade, a wave - and for what happened to the field
// without being asked: a bomber struck the bunker, the ice broke under the
// tanks, a boss walked in. Those must not be overwritten by the next "Hero
// moving to position.", because a message that was never read is not a
// message.
//
// So the notice:
//
//   * flutters in UNDER THE STATUS BAR and stays clear of the corners: the
//     ability button and the zoom column live at the bottom right, the status
//     row sits at the top, and the middle of the field is where the playing
//     happens. It is not centred like a vote or an invitation - it does not ask
//     the player to stop playing;
//   * takes its turn and steps aside. Each notice is shown for `showMs`, then
//     the next follows; there is no dismiss button, because a button floating
//     over the battlefield is a wall however small it is - Chromium found it
//     twice: first the button did not answer, then, made to answer, it
//     swallowed a tap meant for a build pad. The notice is a CAPTION: taps go
//     through it to the field;
//   * QUEUES instead of overwriting. The NEWEST notice is the one shown, because
//     it describes the field as it is now; the one it displaced is kept behind
//     it - most recent first - and a count says there is more. A bunker hit is
//     not lost behind a refused upgrade; it is one turn away. (The first version
//     read the queue oldest first, which buried the newest message behind the
//     stalest - the wrong way round for a player who wants to know what just
//     went wrong.)
//   * stands down when the run does. A notice from a battlefield that no longer
//     exists is noise.
//
// One thing the stylesheet has to know: the notice takes no taps at all. A
// field that cannot be tapped because a message is showing is worse than a
// message.
//
// The queue is deliberately small. Three waiting notices are three things to
// read; a fourth pushes out the oldest waiting one, because a notice that is
// minutes old describes a field that has already changed. Nothing is stored and
// nothing is announced over the network: this is one player's screen.
export function createFieldNotice(document,{translate=text=>text,maxWaiting=3,showMs=6000,
  setTimer=setTimeout,clearTimer=clearTimeout,onChange=null}={}){
  if(!document||typeof document.getElementById!=='function')throw Error('Invalid field notice');
  if(!Number.isSafeInteger(maxWaiting)||maxWaiting<1)throw Error('Invalid field notice queue');
  if(!Number.isSafeInteger(showMs)||showMs<500)throw Error('Invalid field notice timing');
  if([setTimer,clearTimer].some(fn=>typeof fn!=='function'))throw Error('Invalid field notice timer');
  const $=id=>document.getElementById(id);
  const card=$('fieldNotice'),text=$('fieldNoticeText'),more=$('fieldNoticeMore');
  // `waiting` is a history, most recent first: what was on the card before the
  // warning that displaced it.
  const waiting=[];
  let current=null,timer=null;
  function cancel(){if(timer!==null){clearTimer(timer);timer=null;}}
  // No button, so the clock is the only thing that moves the queue on. It is
  // injected rather than taken from the window, so a test can hold it.
  function schedule(){
    cancel();
    if(current)timer=setTimer(()=>{timer=null;advance();},showMs);
  }
  // A function is asked again on every render (a refusal names a tower, a pad
  // or a number that has since changed); a plain string is translated here, so
  // switching language re-reads the warning instead of keeping yesterday's
  // words.
  function resolve(entry){try{return entry==null?'':typeof entry.text==='function'?entry.text():translate(String(entry.text));}catch{return '';}}
  function render(){
    // Only the line of the notice is required. A field drawn without the rest
    // of the furniture - a test harness, a future layout, a broken template -
    // still reports, it just does not show anything.
    const alerting=!!current;
    if(card)card.hidden=!alerting;
    if(text)text.textContent=resolve(current);
    if(more){more.hidden=waiting.length<1;if(waiting.length)more.textContent=translate('+{count} more',{count:waiting.length});}
    onChange?.({alerting,waiting:waiting.length});
  }
  function advance(){
    current=waiting.shift()||null;
    render();schedule();
  }
  // The quiet state is worth setting once: a notice that has never been asked
  // for anything is hidden, whichever way the template left it.
  render();
  return Object.freeze({
    warn(text){
      if(text===null||text===undefined||text==='')return;
      const entry={text};
      if(current)waiting.unshift(current);
      if(waiting.length>maxWaiting)waiting.length=maxWaiting;
      current=entry;
      render();schedule();
    },
    // Skip to the next notice. There is no button for it: the notice takes no
    // taps at all, so this is for the game, not for the player.
    dismiss(){
      if(!current)return false;
      advance();
      return true;
    },
    // The run is over, or a new one begins: notices from a battlefield that no
    // longer exists are noise.
    clear(){cancel();current=null;waiting.length=0;render();},
    refresh(){render();},
    showing(){return !!current;},
    // Kept for the callers that ask whether something is on the screen.
    alerting(){return !!current;},
    waiting(){return waiting.length;}
  });
}
