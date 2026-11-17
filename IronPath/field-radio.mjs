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
export function createFieldRadio(document,{translate=text=>text,maxEntries=12,onChange=null,rootId='battleFoot',closeOnOutsideTap=true,closeOnEscape=true}={}){
  if(!document||typeof document.getElementById!=='function')throw Error('Invalid field radio');
  if(!Number.isSafeInteger(maxEntries)||maxEntries<1)throw Error('Invalid field radio log');
  const $=id=>document.getElementById(id);
  const panel=$('radioLog'),list=$('radioLogList'),badge=$('radioUnread'),toggle=$('radioToggle'),shutter=$('radioLogClose');
  const entries=[];
  let open=false,unread=0,disposed=false;
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
  function reveal(){
    if(open)return false;
    open=true;unread=0;render();
    return true;
  }
  function shut(){
    if(!open)return false;
    open=false;render();
    return true;
  }
  // The radio owns its own hands: the handset opens it, the panel's cross shuts
  // it, and a tap anywhere on the field shuts it too. Wiring that from game.js
  // meant the one thing a player does most - tap the field to close the panel -
  // was the one thing no test could reach. Here it is dispatchable.
  function onOutsideTap(event){
    if(disposed||!open)return;
    if(event?.target?.closest?.('#'+rootId))return;
    shut();
  }
  function onKeyDown(event){if(disposed||!open||event?.key!=='Escape')return;shut();}
  // The closed state is worth setting once: a radio that has never been asked
  // for anything is shut, whichever way the template left it.
  render();
  if(toggle)toggle.onclick=()=>open?shut():reveal();
  if(shutter)shutter.onclick=()=>shut();
  if(closeOnOutsideTap)document.addEventListener?.('pointerdown',onOutsideTap,true);
  if(closeOnEscape)document.addEventListener?.('keydown',onKeyDown);
  return Object.freeze({
    // What the radio would have said. It goes into the log either way - a
    // message that was never on screen still happened.
    say(text){
      if(text===null||text===undefined||text==='')return;
      entries.push({text});
      if(entries.length>maxEntries)entries.shift();
      if(open)render();else{unread++;render();}
    },
    open:reveal,
    close:shut,
    toggle(){return open?shut():reveal();},
    isOpen(){return open;},
    unread(){return unread;},
    // A new run: the old battle's traffic describes nothing.
    clear(){entries.length=0;unread=0;open=false;render();},
    refresh(){render();},
    // Test seams and teardown: the listeners are the radio's, so the radio takes
    // them off the document again.
    destroy(){
      disposed=true;
      if(closeOnOutsideTap)document.removeEventListener?.('pointerdown',onOutsideTap,true);
      if(closeOnEscape)document.removeEventListener?.('keydown',onKeyDown);
      if(toggle)toggle.onclick=null;
      if(shutter)shutter.onclick=null;
    }
  });
}
