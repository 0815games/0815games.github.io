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
import {translateText as tr} from './language.mjs?v=20261116-firstrunde1';
import {createCoachHighlight} from './coach-highlight.mjs?v=20261112-coachptr1';

// `when` is the engine event that finishes the card; `target` is what the pointer
// rings while the card is up. Every card explains one thing the player has to do,
// and the pointer shows them where - a card without a target is a card the player
// has to translate into a search on an unfamiliar field.
//
// `target` is one of:
//   {pad:'first-free'}  a build marker with nothing on it - the next tower goes here
//   {element:'#start'}  a real control, by selector
//   null                nothing to point at (the boss card is an announcement)
export const COACH_STEPS = Object.freeze([
  Object.freeze({id:'welcome',title:'Welcome, soldier',text:'Five waves, and the boss of the last one ends the exercise. This is a real match: what you build now is what fights.',caption:'WAVE 1 OF 5',when:null,target:{pad:'first-free'}}),
  Object.freeze({id:'build',title:'Build a tower',text:'Tap a glowing build marker, pick a tower, then confirm. Towers shoot on their own; you only choose where they stand.',caption:'TAP THE RINGED MARKER',when:'build',target:{pad:'first-free'}}),
  Object.freeze({id:'upgrade',title:'Upgrade it',text:'Tap your tower to open its panel. Upgrade it there - a level 2 tower hits noticeably harder than a second level 1 - or sell it for half back.',caption:'TAP YOUR TOWER',when:'upgrade',target:{pad:'occupied'}}),
  Object.freeze({id:'hero',title:'Move your hero',text:'Tap open ground and your soldier walks there and fires on his own. He is not a tower: he can be anywhere, so put him where the road bends.',caption:'TAP OPEN GROUND',when:'move',target:null}),
  Object.freeze({id:'money',title:'Supplies',text:'Supplies pay for towers and only arrive when you clear a wave. That is why you build before you deploy, not after.',caption:'WATCH THE SUPPLY COUNT',when:null,target:{element:'#moneyPanel'}}),
  Object.freeze({id:'deploy',title:'Start the wave',text:'Deploy calls the next wave. Clearing it pays XP and supplies, so the field gets stronger only if you keep building.',caption:'PRESS DEPLOY',when:'deploy',target:{element:'#start'}}),
  Object.freeze({id:'boss',title:'The boss is here',text:'A boss walks with the last wave and drops your dog tag. Weaken it with towers before it reaches the bunker - it hits far harder than the rest.',caption:'BOSS OF WAVE 5',when:'boss',target:null}),
]);

// The edition decides whether an existing soldier is shown the cards again. It is
// versioned exactly like the briefing and the ending: a dismissed card is a "seen
// it" marker, so without a bump an account that closed the old card once would
// never be shown the explanations again, not even on the new field.
//
// v2 is the six-wave contract, with the last wave as the boss wave and the dog tag
// coming from that boss rather than from wave five.
const EDITION=2;
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
// `resolveTarget` is supplied by the engine: the coach must not guess where a free
// pad is, because that depends on the live match. It returns either
// `{pad:{x,y}}` for a battlefield marker or `{element:node}` for a control, or null
// when there is nothing honest to point at.
export function createCoach({document,window:win,storage,resolveTarget=()=>null,onVisibilityChange=()=>{},onDone=()=>{}}={}){
  const $=id=>document.getElementById(id);
  const root=$('firstRunCoach');
  const highlight=createCoachHighlight({document,window:win});
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
    // Ticks, not a counter: the player should see how much of the briefing is left
    // without reading a number. Built once, then only re-marked on each step.
    const pips=$('coachPips');
    if(pips){
      if(pips.childElementCount!==COACH_STEPS.length){
        pips.replaceChildren(...COACH_STEPS.map(()=>document.createElement('i')));
      }
      [...pips.children].forEach((pip,at)=>pip.toggleAttribute('data-done',at<=index));
    }
    root.hidden=false;
    root.dataset.step=current.id;
    pointAt(current);
  }

  // Show the player the thing the card is talking about. A missing target hides the
  // pointer instead of throwing: the card must still be readable on a dead frame.
  function pointAt(current){
    try{
      if(current?.target){
        const found=resolveTarget(current.target);
        if(found?.pad){highlight.markPad(found.pad);return true;}
        if(found?.element){highlight.markElement(found.element);return true;}
      }
    }catch{/* The pointer is decoration; never let it break the card. */}
    highlight.hide();
    return false;
  }

  // The field pans, the phone rotates, the window resizes. Re-marking is cheap and
  // keeps the ring on the thing it named instead of on where it used to be.
  function remark(){
    if(!open())return;
    const current=step();
    if(current)pointAt(current);
  }

  function hide(){
    if(root)root.hidden=true;
    highlight.hide();
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
    // The last boss turning up raises the boss card, even if the player is
    // still on an earlier card: the run is about to end, and the hint matters.
    boss(){if(!open())return false;const target=COACH_STEPS.findIndex(s=>s.id==='boss');if(target<0||index>=target)return false;index=target;render();return true;},
    // Walk the cards again on the live field, on request. `start()` deliberately
    // refuses a soldier who already dismissed the card - that is what keeps the first
    // run from nagging - but dismissing a hint must not be a one-way door, so the
    // replay path ignores the seen marker. It does not clear it: the first run still
    // stays finished for every automatic caller.
    replay(id){
      if(!id||!root)return false;
      if(root.hidden)highlight.hide();
      activeUser=id;index=0;announced=new Set();render();onVisibilityChange(true);
      return true;
    },
    stop(){hide();index=-1;activeUser=null;},
    refreshLanguage(){if(open())render();},
    // The engine calls this when the field moved under the ring (pan, zoom, rotate)
    // or when the card's target changed without a new card.
    remark,
  };
}
