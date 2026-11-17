// The field radio, minimized.
//
// The radio line used to sit in the corner and take the room whether or not
// anyone was listening: two lines of "Hero moving to position." and "Wave
// cleared! +20 supplies." over the battlefield, permanently. The operator's
// verdict was plain - it takes up too much space - and the answer is a DEVICE:
// a small handset that starts closed, opens into the messages when tapped, and
// counts what arrived while it was shut.
//
// What it must not do:
//
//   * take taps from the field while it is closed. The box is a caption over the
//     battlefield - `pointer-events:none` - and only the handset and the open
//     panel take taps for themselves. A closed radio is not a wall;
//   * swallow a message. Everything the radio would have said is kept in the log
//     (a short one - the last dozen things), whether or not the panel was open,
//     so opening it tells the player what happened while they were fighting;
//   * invent news. The unread count is cleared when the panel is OPENED, not
//     when the messages arrive, and it counts messages, not taps;
//   * sit in the middle of the field. It opens in the corner where the handset
//     is, because the player opened it to read while the battle goes on - the
//     middle is where the fighting is.
//
// Nothing here is stored or sent anywhere: one player's screen, one battle.
export function createFieldRadio(document,{translate=text=>text,maxEntries=12,onChange=null}={}){
  if(!document||typeof document.getElementById!=='function')throw Error('Invalid field radio');
  if(!Number.isSafeInteger(maxEntries)||maxEntries<1)throw Error('Invalid field radio log');
  const $=id=>document.getElementById(id);
  const panel=$('radioLog'),list=$('radioLogList'),badge=$('radioUnread'),toggle=$('radioToggle');
  const entries=[];
  let open=false,unread=0;
  function resolve(entry){try{return entry==null?'':typeof entry.text==='function'?entry.text():translate(String(entry.text));}catch{return '';}}
  function render(){
    if(panel)panel.hidden=!open;
    if(toggle)toggle.setAttribute('aria-expanded',open?'true':'false');
    if(badge){badge.hidden=unread<1;if(unread>0)badge.textContent=String(unread>9?'9+':unread);}
    if(list&&open){
      list.replaceChildren();
      // Oldest first, newest last: reading down the log is reading the battle
      // forwards, and the last line is the one that just happened.
      for(const entry of entries){
        const item=document.createElement('li');
        item.className='radio-log-entry';
        item.textContent=resolve(entry);
        list.append(item);
      }
    }
    onChange?.({open,unread,entries:entries.length});
  }
  // The closed state is worth setting once: a radio that has never been asked
  // for anything is shut, whichever way the template left it.
  render();
  return Object.freeze({
    // What the radio would have said. It goes into the log either way - a
    // message that was never on screen still happened.
    say(text){
      if(text===null||text===undefined||text==='')return;
      entries.push({text});
      if(entries.length>maxEntries)entries.shift();
      if(open)render();else{unread++;render();}
    },
    open(){
      if(open)return false;
      open=true;unread=0;render();
      return true;
    },
    close(){
      if(!open)return false;
      open=false;render();
      return true;
    },
    toggle(){return open?this.close():this.open();},
    isOpen(){return open;},
    unread(){return unread;},
    // A new run: the old battle's traffic describes nothing.
    clear(){entries.length=0;unread=0;open=false;render();},
    refresh(){render();}
  });
}
