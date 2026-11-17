// The field radio has two voices.
//
// The radio LINE reports what happened: a tower was built, a wave was cleared,
// a cache was found. A new line replaces the old one, and nobody has to answer.
// That is right for news and wrong for trouble.
//
// A WARNING is the other voice. It is raised when the player asked for
// something and did not get it - the simulation refused a build, an upgrade, a
// wave - or when something went wrong on the field: the bunker was hit, the ice
// broke under the tanks. Those must not be overwritten by the next "Hero moving
// to position.", because a message that was never read is not a message.
//
// So a warning:
//
//   * gets its own card, floating directly ABOVE the radio and spanning exactly
//     its width, so it cannot collide with anything the radio already clears -
//     the ability button and the zoom column live in the corner on the right,
//     and their geometry is pinned against the radio. It is NOT centred like a
//     vote or an invitation: it does not ask the player to stop playing, and
//     the middle of the field is where the playing happens;
//   * does not take the radio's place. The line below keeps speaking, because a
//     warning about a refused upgrade must not hide "Run ended";
//   * STAYS until it is dismissed, instead of fading on a timer;
//   * QUEUES instead of overwriting. The NEWEST warning is the one on the card,
//     because it describes the field as it is now; the one it displaces is kept
//     behind it - most recent first - and a count says there is more. Dismissing
//     walks back through them, so a bunker hit is not lost behind a refused
//     upgrade; it is one tap away. (The first version read the queue oldest
//     first, which buried the newest message behind the stalest - the wrong way
//     round for a player who wants to know what just went wrong.)
//   * stands down when the run does. A warning from a battlefield that no
//     longer exists is noise.
//
// One thing the stylesheet has to know: the radio box is click-through, because
// it is a caption over the field and a tap on it must reach the ground. The
// warning card is not - it asks for a tap - so `field-command.css` gives it
// `pointer-events:auto`. Chromium found that by hitting the canvas through the
// dismiss button.
//
// The queue is deliberately small. Three waiting warnings are three things to
// read; a fourth pushes out the oldest waiting one, because a warning that is
// minutes old describes a field that has already changed. Nothing is stored and
// nothing is announced over the network: this is one player's screen.
export function createFieldAlert(document,{translate=text=>text,maxWaiting=3,onChange=null}={}){
  if(!document||typeof document.getElementById!=='function')throw Error('Invalid field alert');
  if(!Number.isSafeInteger(maxWaiting)||maxWaiting<1)throw Error('Invalid field alert queue');
  const $=id=>document.getElementById(id);
  const card=$('radioAlert'),text=$('radioAlertText'),more=$('radioAlertMore'),dismiss=$('radioAlertDismiss');
  // `waiting` is a history, most recent first: what was on the card before the
  // warning that displaced it.
  const waiting=[];
  let current=null;
  // A function is asked again on every render (a refusal names a tower, a pad
  // or a number that has since changed); a plain string is translated here, so
  // switching language re-reads the warning instead of keeping yesterday's
  // words.
  function resolve(entry){try{return entry==null?'':typeof entry.text==='function'?entry.text():translate(String(entry.text));}catch{return '';}}
  function render(){
    // Only the line of the card is required. A field drawn without the rest of
    // the furniture - a test harness, a future layout, a broken template -
    // still reports, it just does not show the card.
    const alerting=!!current;
    if(card)card.hidden=!alerting;
    if(text)text.textContent=resolve(current);
    if(more){more.hidden=waiting.length<1;if(waiting.length)more.textContent=translate('+{count} more',{count:waiting.length});}
    if(dismiss)dismiss.hidden=!alerting;
    onChange?.({alerting,waiting:waiting.length});
  }
  function advance(){
    current=waiting.shift()||null;
    render();
  }
  // The quiet state is worth setting once: a card that has never been asked for
  // anything is hidden, whichever way the template left it.
  render();
  return Object.freeze({
    warn(text){
      if(text===null||text===undefined||text==='')return;
      const entry={text};
      if(current)waiting.unshift(current);
      if(waiting.length>maxWaiting)waiting.length=maxWaiting;
      current=entry;
      render();
    },
    dismiss(){
      if(!current)return false;
      advance();
      return true;
    },
    // The run is over, or a new one begins: warnings from a battlefield that no
    // longer exists are noise. The radio line is not ours and stays as it is.
    clear(){current=null;waiting.length=0;render();},
    refresh(){render();},
    alerting(){return !!current;},
    waiting(){return waiting.length;}
  });
}
