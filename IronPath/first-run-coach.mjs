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
import {translateText as tr} from './language.mjs?v=20261209-savefix1';
import {createCoachHighlight} from './coach-highlight.mjs?v=20261112-coachptr1';

// Every card except the two announcements asks for something, and the card does
// not move on until the *field* says it happened: a tower really stands, a tower
// really gained a level, the soldier really arrived where he was sent. A click is
// not evidence - see `evidence()` below for why that distinction is the whole
// point of this file.
//
// `when` names what finishes the card; `ask` is the same thing as a sentence the
// player can act on, and it is only rendered while it is still outstanding;
// `target` is what the pointer rings while the card is up. A card without a
// target is a card the player has to translate into a search on an unfamiliar
// field.
//
// `target` is one of:
//   {pad:'first-free'}  a build marker with nothing on it - the next tower goes here
//   {element:'#start'}  a real control, by selector
//   null                nothing to point at (the boss card is an announcement)
export const COACH_STEPS = Object.freeze([
  Object.freeze({id:'welcome',title:'Welcome, soldier',text:'Five waves, and the boss of the last one ends the exercise. This is a real match: what you build now is what fights.',caption:'WAVE 1 OF 5',when:null,target:{pad:'first-free'}}),
  Object.freeze({id:'build',title:'Build a tower',text:'Tap a glowing build marker, pick a tower, then confirm. Towers shoot on their own; you only choose where they stand.',caption:'TAP THE RINGED MARKER',when:'build',ask:'Build one tower to continue',target:{pad:'first-free'}}),
  Object.freeze({id:'upgrade',title:'Upgrade it',text:'Tap your tower to open its panel. Upgrade it there - a level 2 tower hits noticeably harder than a second level 1 - or sell it for half back.',caption:'TAP YOUR TOWER',when:'upgrade',ask:'Upgrade that tower to continue',target:{pad:'occupied'}}),
  Object.freeze({id:'hero',title:'Move your hero',text:'Tap open ground and your soldier walks there and fires on his own. He is not a tower: he can be anywhere, so put him where the road bends.',caption:'TAP OPEN GROUND',when:'move',ask:'Send your soldier somewhere',target:null}),
  Object.freeze({id:'money',title:'Supplies',text:'Supplies pay for towers and only arrive when you clear a wave. That is why you build before you deploy, not after.',caption:'WATCH THE SUPPLY COUNT',when:null,target:{element:'#moneyPanel'}}),
  Object.freeze({id:'deploy',title:'Start the wave',text:'Deploy calls the next wave. Clearing it pays XP and supplies, so the field gets stronger only if you keep building.',caption:'PRESS DEPLOY',when:'deploy',ask:'Press Deploy to start the wave',target:{element:'#start'}}),
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
// What the field has to show before a card counts as done. `observe` is supplied
// by the engine and returns the live match. The checks read that state, not the
// callback that fired: `event('build')` says a build *succeeded*, but a player can
// sell the tower again two seconds later, and then the card would be asking about
// a tower that no longer exists. Re-reading on every render and every engine tick
// means the card follows the field in both directions - it goes back if the tower
// goes away.
export function evidence(name,seen,observe){
  let state=null;
  try{state=observe?.()||null;}catch{/* A dead frame is not proof either way. */}
  const towers=Array.isArray(state?.towers)?state.towers:null;
  const player=state?.players?.[state.localId??'local']||state?.players?.local||null;
  switch(name){
    case 'build':{const id=seen?.builtTowerId;if(towers&&id!=null)return towers.some(t=>t.id===id&&t.hp!==0);return !!(towers?towers.length:seen?.built);}
    case 'upgrade':{const id=seen?.builtTowerId;if(towers&&id!=null){const tower=towers.find(t=>t.id===id);if(!tower)return false;return tower.level>=2||tower.branch!=null;}return !!seen?.upgraded;}
    // "Moved" means the soldier is no longer where he stood when the card opened,
    // not that a tap happened: a tap on the bunker, or a move command the state
    // rejected, is not evidence.
    case 'move':{
      if(!seen?.moved)return false;
      const from=seen.moveFrom;
      if(!from||!Number.isFinite(state?.x)||!Number.isFinite(state?.y))return true;
      return Math.hypot(state.x-from.x,state.y-from.y)>=8;
    }
    case 'deploy':return !!seen?.deployed;
    case 'boss':return !!seen?.boss;
    default:return false;
  }
}

export function createCoach({document,window:win,storage,resolveTarget=()=>null,observe=()=>null,onVisibilityChange=()=>{},onDone=()=>{}}={}){
  const $=id=>document.getElementById(id);
  const root=$('firstRunCoach');
  const highlight=createCoachHighlight({document,window:win});
  let index=-1,activeUser=null,announced=new Set(),seen={};

  const step=()=>COACH_STEPS[index]||null;
  const open=()=>!!root&&!root.hidden;
  // The coaching is *active* from `start` to `finish` - including while the card
  // is put away. Reported: "Ist das Aufgaben Fenster minimiert, registriert er
  // die Bewegung des Soldaten nicht." Gates, events and ticks used to stop the
  // moment the card was hidden, so a step done in private never counted.
  const active=()=>index>=0&&activeUser!=null;

  function render(){
    const current=step();
    if(!current){return hide();}
    if(!root)return;
    $('coachStep').textContent=tr('FIRST RUN · {step} / {total}',{step:index+1,total:COACH_STEPS.length});
    $('coachTitle').textContent=tr(current.title);
    $('coachText').textContent=tr(current.text);
    $('coachCaption').textContent=tr(current.caption);
    // The card is a gate, not a slide deck: while the step asks for something the
    // field has not shown yet, NEXT is disabled and says what is missing. Announcing
    // the requirement only in the body copy left players tapping a dead button.
    const outstanding=required(current);
    // Only while outstanding: once the player did it, the line is noise.
    $('coachAsk').hidden=!outstanding;
    $('coachAsk').textContent=outstanding?tr(current.ask||''):'';
    $('coachNext').disabled=outstanding;
    $('coachNext').textContent=outstanding?tr('NEXT →'):index===COACH_STEPS.length-1?tr('GOT IT'):tr('NEXT →');
    $('coachNext').setAttribute('aria-disabled',outstanding?'true':'false');
    root.dataset.awaiting=outstanding?current.id:'';
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

  // True while the current card still waits for the field. A card without `when`
  // (the two announcements) never blocks, and neither does a card whose condition
  // the field no longer contradicts, which is what makes the gate reversible.
  function required(current=step()){
    if(!current?.when)return false;
    return !evidence(current.when,seen,observe);
  }

  function hide(){
    if(root)root.hidden=true;
    highlight.hide();
    onVisibilityChange(false);
  }

  // The engine reports what it observed. That is *not* enough to finish a card: the
  // report is only a hint that the field may now satisfy the condition, and the
  // condition itself is re-read below. A successful build that the player immediately
  // sells must not count, and a move the player cancels must not count either.
  function reach(name){
    if(!active())return false;
    const current=step();
    if(!current)return false;
    if(current.when!==name)return false;
    announced.add(name);
    if(name==='build'&&seen.builtTowerId==null)seen.built=true;
    if(name==='upgrade')seen.upgraded=true;
    if(name==='move')seen.moved=true;
    if(name==='deploy')seen.deployed=true;
    if(name==='boss')seen.boss=true;
    return settle();
  }

  // Adopt whatever the field has caught up with. Called after every engine event
  // and after every render, so the gate opens on its own when the evidence arrives
  // by another route (a tower built before the card came up, a wave started from a
  // hotkey) and closes again if the evidence disappears.
  function settle(){
    if(!active())return false;
    const current=step();
    if(!current)return false;
    const waiting=required(current);
    // Only repaint when the answer actually changed. This is called once per painted
    // frame, and a card that re-renders 60 times a second would restart its own
    // entrance animation and never settle on the screen. And never while put away:
    // rendering unhides the card, which would un-minimize it without a step being
    // done. Advancing - the case below - is the one un-hiding that is wanted.
    const wasWaiting=root?.dataset.awaiting||'';
    if(waiting){
      // The requirement came back (the tower was sold). Say so instead of leaving a
      // button that silently stopped working.
      if(root&&!root.hidden&&wasWaiting!==current.id)render();
      return false;
    }
    // Only the cards that ask for an action advance by themselves. The two
    // announcements still wait for the player to read them.
    if(current.when)return advance();
    return false;
  }

  function advance(){
    index++;
    if(index>=COACH_STEPS.length){finish();return true;}
    render();
    // The new card may point somewhere else - the build card rings a free pad, the
    // upgrade card rings the tower that now stands on it. Rendering happens before
    // the engine has painted the change, so re-mark once more on the next frame; the
    // card must never ring the pad it just told the player to leave.
    try{win?.requestAnimationFrame?.(()=>{try{remark();}catch{}});}catch{/* No frame, no problem. */}
    return true;
  }

  function finish(){
    const user=activeUser;
    hide();index=-1;activeUser=null;
    if(user){markCoachSeen(user,storage);try{onDone(user);}catch{/* The run is over either way. */}}
  }

  if(root){
    // NEXT cannot skip a step that asks for field evidence. The announcements (no
    // `when`) still advance on the player's word, because there is nothing to prove.
    $('coachNext').onclick=()=>{
      const current=step();
      if(required(current))return;
      announced.add('acknowledged');
      advance();
    };
    // Putting the card away is not finishing the coaching. Reported: "wenn man die
    // Aufgabe wegklickt, hat man keine Möglichkeit, sie nachzuschauen." The card
    // keeps its place; the recall button brings it back, and only `finish()` writes
    // the seen marker - a dismissed card is a paused card, not a skipped briefing.
    $('coachClose').onclick=()=>{hide();};
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
      activeUser=id;index=0;announced=new Set();seen={};render();onVisibilityChange(true);
      return true;
    },
    // The engine reports what happened, together with the concrete thing it saw (a
    // tower id, not just "it worked"). Anything unknown is ignored, so wiring a new
    // event cannot break the card.
    event(name,detail){if(detail&&typeof detail==='object')seen={...seen,...detail};return reach(name);},
    // The engine calls this after every simulation step and UI paint: it is the
    // cheapest way to let the gate open by itself when the evidence arrives without
    // an event, and to close again when it stops being true.
    tick(){return settle();},
    // What the current card is waiting for, for the tests and for the field menu.
    awaiting(){const current=step();return required(current)?(current?.ask||current?.id||''):'';},
    // The last boss turning up raises the boss card, even if the player is
    // still on an earlier card: the run is about to end, and the hint matters.
    boss(){if(!active())return false;const target=COACH_STEPS.findIndex(s=>s.id==='boss');if(target<0||index>=target)return false;index=target;render();return true;},
    // Walk the cards again on the live field, on request. `start()` deliberately
    // refuses a soldier who already dismissed the card - that is what keeps the first
    // run from nagging - but dismissing a hint must not be a one-way door, so the
    // replay path ignores the seen marker. It does not clear it: the first run still
    // stays finished for every automatic caller.
    replay(id){
      if(!id||!root)return false;
      if(root.hidden)highlight.hide();
      activeUser=id;index=0;announced=new Set();seen={};render();onVisibilityChange(true);
      return true;
    },
    // The card was put away but the coaching is not over: the engine shows the
    // recall button for exactly this state.
    dismissed(){return !!root&&root.hidden&&index>=0&&activeUser!=null;},
    // Brings the put-away card back at the step it was on. The gate re-reads the
    // field on the next tick, so a player who built while the card was away comes
    // back to an open gate, not to an accusation.
    reopen(){if(!root||!root.hidden||index<0||activeUser==null)return false;render();onVisibilityChange(true);return true;},
    stop(){hide();index=-1;activeUser=null;},
    // The training contract is WON: whatever cards remain will never be proven on
    // this field. Reported: the SHOW TASK button outlived the finished tutorial.
    // Completing writes the seen marker, so no automatic caller nags either.
    complete(){if(activeUser==null)return false;finish();return true;},
    // Forget that this soldier has seen the coaching. Only the Settings replay calls
    // this: every automatic path (`start`) treats the marker as permanent, which is
    // what keeps the cards from nagging after they were dismissed.
    reset(id){
      if(!id)return false;
      memory.delete(id);
      try{storage?.removeItem?.(keyFor(id));}catch{/* the session copy is gone either way */}
      return true;
    },
    refreshLanguage(){if(open())render();},
    // The engine calls this when the field moved under the ring (pan, zoom, rotate)
    // or when the card's target changed without a new card.
    remark,
  };
}
