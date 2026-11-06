// The first-run coach: the briefing that runs *while* the soldier plays.
//
// Why this file exists. The 11-step briefing was a modal <dialog> shown over the
// battlefield, and `game.js` pauses the simulation whenever that dialog is open
// (`tutorial.isOpen()` was part of both pause conditions). On a phone that is
// unplayable by construction: the brief covers the field, the field stands still,
// and the only way to play is to dismiss the brief. This coach is the opposite:
//
//   * it is NOT modal and never captures pointer events outside its own card;
//   * it does not pause anything — the simulation keeps running;
//   * it is anchored to the bottom, at most 45% of the viewport tall, so the
//     build pads stay visible and tappable;
//   * it advances on what the player actually does (build, upgrade, move,
//     deploy), not on "next" presses over screenshots.
//
// Copy is one sentence per card. Pictures belong to the reward popups, not to the
// card that has to keep the field free.
import {translateText as tr} from './language.mjs?v=20261112-firstrun5';

// `when` is the engine event that dismisses the card; `hint` is shown until then.
// Order is deliberate: the first card is the welcome, and it appears only after
// the first frame of the training field has been drawn.
export const COACH_STEPS = Object.freeze([
  Object.freeze({id:'welcome',title:'Welcome, soldier',text:'Five waves, and the boss of the last one ends the exercise. Tap a build marker to place your first tower.',caption:'FIVE WAVES',when:null}),
  Object.freeze({id:'build',title:'Build a tower',text:'Tap a glowing build marker, choose a tower, then confirm. Supplies only grow while waves run.',caption:'TAP A BUILD MARKER',when:'build'}),
  Object.freeze({id:'upgrade',title:'Upgrade or sell',text:'Tap your tower to see its range. Upgrade it in that panel, or sell it for half the investment.',caption:'CHOOSE AN ACTION',when:'upgrade'}),
  Object.freeze({id:'hero',title:'Move your hero',text:'Tap open ground to move. Your hero fires at nearby enemies on their own once deployed.',caption:'MOVE INTO POSITION',when:'move'}),
  Object.freeze({id:'deploy',title:'Start the battle',text:'Deploy calls the next wave. Clearing a wave pays XP and supplies, so build before you deploy.',caption:'HOLD THE LINE',when:'deploy'}),
  Object.freeze({id:'boss',title:'The boss is here',text:'The wave-five boss drops your dog tag. Weaken it with towers before it reaches the bunker.',caption:'BOSS OF WAVE FIVE',when:'boss'}),
]);

const EDITION=1;
const keyFor=id=>`ironpath:coach:v${EDITION}:${id}`;
const memory=new Set();

export function coachSeen(id,storage){
  if(!id)return false;
  if(memory.has(id))return true;
  try{return storage?.getItem(keyFor(id))==='done';}catch{return false;}
}
export function markCoachSeen(id,storage){
  if(!id)return;
  memory.add(id);
  try{storage?.setItem(keyFor(id),'done');}catch{/* The session still remembers. */}
}

// The card's own state machine. Deliberately tiny and DOM-thin: the engine calls
// `event('build')` and the card moves on. `onHide` is what the engine uses to know
// that a hint is no longer owed.
export function createCoach({document,storage,onVisibilityChange=()=>{},onDone=()=>{}}={}){
  const $=id=>document.getElementById(id);
  const root=$('firstRunCoach');
  let index=-1,activeUser=null,announced=new Set();

  const step=()=>COACH_STEPS[index]||null;
  const open=()=>!!root&&!root.hidden;

  function render(){
    const current=step();
    if(!current){return hide();}
    if(!root)return;
    $('coachStep').textContent=tr('FIRST RUN · {step} / {total}',{step:index+1,total:COACH_STEPS.length});
    $('coachTitle').textContent=tr(current.title);
    $('coachText').textContent=tr(current.text);
    $('coachCaption').textContent=tr(current.caption);
    // The card is a hint, not a wall: the only control is "understood".
    $('coachNext').textContent=index===COACH_STEPS.length-1?tr('GOT IT'):tr('NEXT →');
    root.hidden=false;
    root.dataset.step=current.id;
  }

  function hide(){
    if(root)root.hidden=true;
    onVisibilityChange(false);
  }

  // Advance past a card whose condition has just been met by the player.
  function reach(name){
    if(!open())return false;
    const current=step();
    if(!current)return false;
    // A card with no condition (welcome) is only dismissed by the player.
    if(current.when!==name)return false;
    announced.add(name);
    return advance();
  }

  function advance(){
    index++;
    if(index>=COACH_STEPS.length){finish();return true;}
    render();
    return true;
  }

  function finish(){
    const user=activeUser;
    hide();index=-1;activeUser=null;
    if(user){markCoachSeen(user,storage);try{onDone(user);}catch{/* The run is over either way. */}}
  }

  if(root){
    $('coachNext').onclick=()=>{announced.add('acknowledged');advance();};
    $('coachClose').onclick=()=>{const user=activeUser;hide();index=-1;activeUser=null;if(user)markCoachSeen(user,storage);};
    // Escape is a hint dismissal too, never a pause.
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();$('coachClose').onclick();}});
  }

  return {
    isOpen:open,
    step:step,
    steps:COACH_STEPS,
    // Starts at the card the player has not seen yet. A returning account that
    // already finished the coaching simply gets nothing.
    start(id){
      if(!id||coachSeen(id,storage))return false;
      activeUser=id;index=0;announced=new Set();render();onVisibilityChange(true);
      return true;
    },
    // The engine reports what happened. Anything unknown is ignored, so wiring a
    // new event cannot break the card.
    event(name){return reach(name);},
    // The wave-five boss turning up raises the boss card, even if the player is
    // still on an earlier card: the run is about to end, and the hint matters.
    boss(){if(!open())return false;const target=COACH_STEPS.findIndex(s=>s.id==='boss');if(target<0||index>=target)return false;index=target;render();return true;},
    stop(){hide();index=-1;activeUser=null;},
    refreshLanguage(){if(open())render();},
  };
}
