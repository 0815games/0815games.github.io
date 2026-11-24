// The first-run coach: the briefing that runs *while* the soldier plays.
//
// Keeps the field 100% live and tappable (never a modal dialog), preserves the
// evidence-based gating and SVG pad/element highlighter from createCoachHighlight,
// and layers in painted mission artwork thumbnails + General Vance radio clip
// notifications per training step.
import {translateText as tr} from '../language.mjs?v=20261123-aim4';
import {createCoachHighlight} from '../core/coach-highlight.mjs?v=20261112-coachptr1';

export const COACH_STEPS = Object.freeze([
  Object.freeze({
    id:'welcome',
    title:'Welcome, soldier',
    text:'Seven waves, and the boss of the last one ends the exercise. This is a real match: what you build now is what fights.',
    caption:'WAVE 1 OF 7',
    when:null,
    target:{pad:'first-free'},
    art:'assets/tutorial-soldier.jpg?v=20261123-aim4',
    voiceClip:'mission-welcome',
  }),
  Object.freeze({
    id:'build',
    title:'Build a tower',
    text:'Tap a glowing build marker, pick a tower, then confirm. Towers shoot on their own; you only choose where they stand.',
    caption:'TAP THE RINGED MARKER',
    when:'build',
    ask:'Build one tower to continue',
    target:{pad:'first-free'},
    art:'assets/tutorial-build.jpg?v=20261123-aim4',
    voiceClip:'mission-build',
  }),
  Object.freeze({
    id:'upgrade',
    title:'Upgrade it',
    text:'Tap your tower to open its panel. Upgrade it there - a level 2 tower hits noticeably harder than a second level 1 - or sell it for half back.',
    caption:'TAP YOUR TOWER',
    when:'upgrade',
    ask:'Upgrade that tower to continue',
    target:{pad:'occupied'},
    art:'assets/tutorial-build.jpg?v=20261123-aim4',
    voiceClip:'mission-upgrade',
  }),
  Object.freeze({
    id:'hero',
    title:'Move your hero',
    text:'Tap open ground and your soldier walks there and fires on his own. He is not a tower: he can be anywhere, so put him where the road bends.',
    caption:'TAP OPEN GROUND',
    when:'move',
    ask:'Send your soldier somewhere',
    target:null,
    art:'assets/tutorial-soldier.jpg?v=20261123-aim4',
    voiceClip:'mission-hero',
  }),
  Object.freeze({
    id:'under-fire',
    title:'You can be hit',
    text:'From wave 3, infantry shoots at your soldier and tanks shell your towers. A dashed ring warns first: step out and it misses. Falling costs nothing — you return at the bunker; towers repair from their panel.',
    caption:'WATCH THE RINGS · FROM WAVE 3',
    when:null,
    target:null,
    art:'assets/tutorial-defend.jpg?v=20261123-aim4',
    voiceClip:null,
  }),
  Object.freeze({
    id:'money',
    title:'Supplies',
    text:'Supplies pay for towers and only arrive when you clear a wave. That is why you build before you deploy, not after.',
    caption:'WATCH THE SUPPLY COUNT',
    when:null,
    target:{element:'#moneyPanel'},
    art:'assets/tutorial-defend.jpg?v=20261123-aim4',
    voiceClip:'mission-supplies',
  }),
  Object.freeze({
    id:'deploy',
    title:'Start the wave',
    text:'Deploy calls the next wave. Clearing it pays XP and supplies, so the field gets stronger only if you keep building.',
    caption:'PRESS DEPLOY',
    when:'deploy',
    ask:'Press Deploy to start the wave',
    target:{element:'#start'},
    art:'assets/tutorial-defend.jpg?v=20261123-aim4',
    voiceClip:null,
  }),
  Object.freeze({
    id:'specialize',
    title:'Specialize & sky cover',
    text:'Rank 3 unlocks a permanent tower specialization. Keep Flak ready for incoming aircraft and toggle 2× pace between builds.',
    caption:'RANK 3 & SKY COVER',
    when:null,
    target:{element:'#speed'},
    art:'assets/tutorial-airstrike.jpg?v=20261123-aim4',
    voiceClip:'mission-specialize',
  }),
  Object.freeze({
    id:'boss',
    title:'The boss is here',
    text:'A boss walks with the last wave. Weaken it with towers before it reaches the bunker - it hits far harder than the rest.',
    caption:'BOSS OF WAVE 7',
    when:'boss',
    target:null,
    art:'assets/tutorial-airstrike.jpg?v=20261123-aim4',
    voiceClip:'mission-boss',
  }),
]);

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

export function evidence(name,seen,observe){
  let state=null;
  try{state=observe?.()||null;}catch{/* A dead frame is not proof either way. */}
  const towers=Array.isArray(state?.towers)?state.towers:null;
  switch(name){
    case 'build':{const id=seen?.builtTowerId;if(towers&&id!=null)return towers.some(t=>t.id===id&&t.hp!==0);return !!(towers?towers.length:seen?.built);}
    case 'upgrade':{const id=seen?.builtTowerId;if(towers&&id!=null){const tower=towers.find(t=>t.id===id);if(!tower)return false;return tower.level>=2||tower.branch!=null;}return !!seen?.upgraded;}
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

export function createCoach({document,window:win,storage,resolveTarget=()=>null,observe=()=>null,onVisibilityChange=()=>{},onStepChange=()=>{},onDone=()=>{}}={}){
  const $=id=>document.getElementById(id);
  const root=$('firstRunCoach');
  const highlight=createCoachHighlight({document,window:win});
  let index=-1,activeUser=null,announced=new Set(),voicedSteps=new Set(),seen={};

  const step=()=>COACH_STEPS[index]||null;
  const open=()=>!!root&&!root.hidden;
  const active=()=>index>=0&&activeUser!=null;

  function render({announceVoice=true}={}){
    const current=step();
    if(!current){return hide();}
    if(!root)return;
    $('coachStep').textContent=tr('FIRST RUN · {step} / {total}',{step:index+1,total:COACH_STEPS.length});
    $('coachTitle').textContent=tr(current.title);
    $('coachText').textContent=tr(current.text);
    $('coachCaption').textContent=tr(current.caption);
    const artNode=$('coachArt');
    if(artNode&&current.art){artNode.src=current.art;artNode.alt=tr(current.title);}
    const outstanding=required(current);
    $('coachAsk').hidden=!outstanding;
    $('coachAsk').textContent=outstanding?tr(current.ask||''):'';
    $('coachNext').disabled=outstanding;
    $('coachNext').textContent=outstanding?tr('NEXT →'):index===COACH_STEPS.length-1?tr('GOT IT'):tr('NEXT →');
    $('coachNext').setAttribute('aria-disabled',outstanding?'true':'false');
    root.dataset.awaiting=outstanding?current.id:'';
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
    if(announceVoice&&!voicedSteps.has(current.id)){
      voicedSteps.add(current.id);
      try{onStepChange(current,index);}catch{}
    }
  }

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

  function remark(){
    if(!open())return;
    const current=step();
    if(current)pointAt(current);
  }

  function required(current=step()){
    if(!current?.when)return false;
    return !evidence(current.when,seen,observe);
  }

  function hide(){
    if(root)root.hidden=true;
    highlight.hide();
    onVisibilityChange(false);
  }

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

  function settle(){
    if(!active())return false;
    const current=step();
    if(!current)return false;
    const waiting=required(current);
    const wasWaiting=root?.dataset.awaiting||'';
    if(waiting){
      if(root&&!root.hidden&&wasWaiting!==current.id)render({announceVoice:false});
      return false;
    }
    if(current.when)return advance();
    return false;
  }

  function advance(){
    index++;
    if(index>=COACH_STEPS.length){finish();return true;}
    render({announceVoice:true});
    try{win?.requestAnimationFrame?.(()=>{try{remark();}catch{}});}catch{/* No frame, no problem. */}
    return true;
  }

  function finish(){
    const user=activeUser;
    hide();index=-1;activeUser=null;
    if(user){markCoachSeen(user,storage);try{onDone(user);}catch{/* The run is over either way. */}}
  }

  if(root){
    $('coachNext').onclick=()=>{
      const current=step();
      if(required(current))return;
      announced.add('acknowledged');
      advance();
    };
    $('coachClose').onclick=()=>{hide();};
    root.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();$('coachClose').onclick();}});
  }

  return {
    isOpen:open,
    step:step,
    steps:COACH_STEPS,
    start(id){
      if(!id||coachSeen(id,storage))return false;
      activeUser=id;index=0;announced=new Set();voicedSteps=new Set();seen={};render({announceVoice:true});onVisibilityChange(true);
      return true;
    },
    event(name,detail){if(detail&&typeof detail==='object')seen={...seen,...detail};return reach(name);},
    tick(){return settle();},
    awaiting(){const current=step();return required(current)?(current?.ask||current?.id||''):'';},
    boss(){if(!active())return false;const target=COACH_STEPS.findIndex(s=>s.id==='boss');if(target<0||index>=target)return false;index=target;render({announceVoice:true});return true;},
    replay(id){
      if(!id||!root)return false;
      if(root.hidden)highlight.hide();
      activeUser=id;index=0;announced=new Set();voicedSteps=new Set();seen={};render({announceVoice:true});onVisibilityChange(true);
      return true;
    },
    dismissed(){return !!root&&root.hidden&&index>=0&&activeUser!=null;},
    reopen(){if(!root||!root.hidden||index<0||activeUser==null)return false;render({announceVoice:false});onVisibilityChange(true);return true;},
    stop(){hide();index=-1;activeUser=null;},
    complete(){if(activeUser==null)return false;finish();return true;},
    reset(id){
      if(!id)return false;
      memory.delete(id);
      try{storage?.removeItem?.(keyFor(id));}catch{/* the session copy is gone either way */}
      return true;
    },
    refreshLanguage(){if(open())render({announceVoice:false});},
    remark,
  };
}
