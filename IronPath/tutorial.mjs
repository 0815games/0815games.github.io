import {translateText as tr} from './language.mjs?v=20261112-markers1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
// The practice steps open the real dialogs in sandbox mode (see account.js). The
// callbacks are injected so this module never needs the account app itself.
// Tutorial completion is per account and browser. The interactive exercises
// use isolated example data; they never touch a soldier profile or Firebase.
export const TUTORIAL_STEPS = [
  {title:'Welcome, soldier',text:'Enemies follow the road toward your bunker. Keep the bunker standing as long as you can. Bosses attack every five waves.',scene:'bunker',caption:'DEFEND THE BUNKER'},
  {title:'Build your defenses',text:'Tap a BUILD marker to open the build panel. Tap a tower to see its details, then confirm to build. Grey choices need more supplies but can still be inspected.',scene:'build',caption:'TAP A BUILD MARKER'},
  {title:'Upgrade or sell',text:'Tap a tower to see its range and open its action panel. Confirm the upgrade directly in the action panel, choose a specialization at level 3, or sell it for half the investment.',scene:'upgrade',caption:'CHOOSE AN ACTION'},
  {title:'Move your hero',text:'Tap open ground to move. On a keyboard, use WASD or the arrow keys. Your hero automatically fires at nearby enemies once deployed.',scene:'hero',caption:'MOVE INTO POSITION'},
  {title:'Start the battle',text:'Use Field Intel below the map to identify threats and tower counters. Start each wave with Deploy. Use Speed in solo. You start without an ability; unlock one after reaching level 2. Defeated enemies provide supplies; cleared waves earn XP and loot. After each boss choose a temporary field upgrade; rare upgrades can change how towers fight.',scene:'battle',caption:'HOLD THE LINE'},
  {title:'Find your way around',text:'Each new operation generates a different battlefield. On a phone, swipe the enlarged map sideways or use Entry and Bunker to jump around. Open Terrain effects for battlefield rules and watch the marked zones: dust, cover, ice and mud change combat. Open How to play for sound and this briefing. A co-op battle continues while the briefing is open.',scene:'map',caption:'SWIPE THE MAP'},
  {title:'Play together',text:'Open MULTIPLAYER to create a party for two to four players. Invite an accepted friend to join directly, or share the four-digit code and approve their join request. The host chooses a mode and requests waves; guests approve or choose Not Yet. Competitive modes pause if a player disconnects. Keep the host browser open.',scene:'hero',caption:'ONE PARTY · YOUR SQUAD'},
  {title:'Practice the Skills menu',text:'At level 2, you earn your first skill point. Pick a category and select a skill card to see its details. Unlock it, then save your build. Try it here on a sample soldier: nothing you do is saved.',scene:'skills',caption:'EXAMPLE BUILD',practice:'skills',dialogs:['skills']},
  {title:'Practice the Armory',text:'Use Equipment to equip unlocked rewards, Bunker to upgrade defenses, and Service Record to see medals. Try it on a sample soldier: nothing you do is saved.',scene:'armory',caption:'EXAMPLE ARMORY',practice:'armory',dialogs:['armory']},
  // These two open the REAL dialogs against a sample soldier. Nothing is saved.
  {title:'Your workshop',text:'The Armory has a WORKSHOP tab: craft gear from scrap and boss components, equip it, then install a modification. Try it on a sample soldier. Nothing you do here is saved.',scene:'armory',caption:'CRAFT · EQUIP · MODIFY',practice:'workshop',dialogs:['armoryWorkshop']},
  {title:'Prestige gear',text:'Finishing campaign missions awards prestige trophies: one per mission, never sold and never crafted. Locked trophies name the mission that unlocks them. Missions get harder as the story goes on, so the gear matters.',scene:'armory',caption:'EARNED IN THE CAMPAIGN',practice:'prestige',dialogs:['armoryPrestige']}
];
const memory=new Set();
// The marker carries the edition of the briefing it belongs to, because the tour
// changes what a returning player has seen. The old 8-step tour wrote
// `ironpath:tutorial:v1:<id>`, so reusing that key meant every account that
// finished it looked "already briefed" for ever and never saw the new briefing -
// there was no way to reach it, because the replay button is inside another dialog.
// Bump this whenever the briefing gains content worth showing a returning player;
// a new edition is offered once, and skipping it is remembered like finishing.
const TUTORIAL_EDITION=2;
const keyFor=id=>`ironpath:tutorial:v${TUTORIAL_EDITION}:${id}`;
export function createTutorial({document,storage,onVisibilityChange=()=>{},onPractice=()=>{},onFinish=()=>{},onTearDown=()=>{}}){
  const $=id=>document.getElementById(id),dialog=$('tutorialDialog');
  let index=0,activeUser=null,skill,armory,workshop,skipped,lastDialogs=-1,pendingDialogs=-1;
  function resetPractice(){skill={upgraded:false,saved:false};armory={equipped:false,upgraded:false};workshop={crafted:false,equippedItem:false};skipped=new Set();}
  resetPractice();
  function completed(id){if(memory.has(id))return true;try{return storage?.getItem(keyFor(id))==='done';}catch{return false;}}
  function markCompleted(id){memory.add(id);try{storage?.setItem(keyFor(id),'done');}catch{/* Continue in this session if storage is unavailable. */}}
  function practiceDone(type){return skipped.has(type)||(type==='skills'?skill.upgraded&&skill.saved:type==='armory'?armory.equipped&&armory.upgraded:type==='workshop'?workshop.crafted&&workshop.equippedItem:type==='prestige'?true:true);}
  function render(){
    const step=TUTORIAL_STEPS[index],practice=step.practice;
    $('tutorialStep').textContent=tr('FIELD BRIEFING · {step} / {total}',{step:index+1,total:TUTORIAL_STEPS.length});$('tutorialTitle').textContent=tr(step.title);$('tutorialText').textContent=tr(step.text);$('tutorialCaption').textContent=tr(step.caption);$('tutorialScene').dataset.scene=step.scene;
    $('tutorialScene').hidden=!!practice;$('tutorialPracticeSkip').hidden=!practice||practiceDone(practice);
    $('tutorialBack').disabled=index===0;$('tutorialNext').disabled=!!practice&&!practiceDone(practice);$('tutorialNext').textContent=index===TUTORIAL_STEPS.length-1?tr('FINISH'):tr('NEXT →');
    const wantDialogs=step.dialogs||[];
    if(wantDialogs.length&&lastDialogs!==index){
      lastDialogs=index;
      // A practice step opens the matching real dialog in sandbox mode (account.js),
      // but not while the briefing itself is hidden: the topmost modal would swallow
      // the tour. It opens as soon as the briefing is actually in front of the player.
      if(!dialog.open)pendingDialogs=index;
      else try{onPractice(wantDialogs[0]);}catch{/* The skip button still lets the tour continue. */}
    }
    // Say what the step is waiting for, instead of leaving a disabled NEXT behind.
    $('tutorialPracticeStatus').hidden=!practice;
    if(practice)$('tutorialPracticeStatus').textContent=practiceDone(practice)?tr('Practice complete. Continue when you are ready.'):tr('Use the real {making} on the sample soldier. Nothing is saved.',{making:practice==='skills'?tr('Skills menu'):tr('Armory')});
  }
  function open(id){if(!id)return;activeUser=id;index=0;lastDialogs=-1;pendingDialogs=-1;resetPractice();render();if(!dialog.open)dialog.showModal();flushPendingPractice();onVisibilityChange(true);}
  // Opening the dialog from the menu is what makes a pending practice step runnable.
  function flushPendingPractice(){
    if(pendingDialogs<0||!dialog.open)return;
    const step=TUTORIAL_STEPS[pendingDialogs],want=step?.dialogs||[];
    pendingDialogs=-1;
    if(!want.length)return;
    lastDialogs=TUTORIAL_STEPS.indexOf(step);
    try{onPractice(want[0]);}catch{/* The skip button still lets the tour continue. */}
  }
  dialog.addEventListener('close',()=>{if(pendingDialogs>=0)flushPendingPractice();});
  // `finished` distinguishes a completed walk from a dismissal: only a finished
  // tour hands the player on to the training contract.
  function close(mark,finished=false){if(!dialog.open)return;const user=activeUser;if(mark&&user)markCompleted(user);dialog.close();activeUser=null;onVisibilityChange(false);
    // Reported: "Abbrechen des Tutorials muss auch die Aufgaben abbrechen". A
    // practice step leaves the real dialog open in sandbox mode; skipping or
    // finishing the tour must tear that down, not only the tour itself.
    try{onTearDown();}catch{/* Tearing down the practice must never break the close. */}
    if(finished&&user){try{onFinish(user);}catch{/* The tour is over either way. */}}}
  $('tutorialPracticeSkip').onclick=()=>{const practice=TUTORIAL_STEPS[index].practice;if(practice){skipped.add(practice);render();}};
  // The real dialogs report what happened here instead of a mock screen doing it.
  function practiceResult(type,detail){
    if(type==='workshop'&&detail){if(detail.crafted)workshop.crafted=true;if(detail.equipped)workshop.equippedItem=true;if(skipped.has('workshop'))skipped.delete('workshop');render();}
    if(type==='armory'&&detail){if(detail.equipped)armory.equipped=true;if(detail.upgraded)armory.upgraded=true;render();}
    if(type==='skills'&&detail){if(detail.upgraded)skill.upgraded=true;if(detail.saved)skill.saved=true;render();}
  }
  $('tutorialNext').onclick=()=>{const practice=TUTORIAL_STEPS[index].practice;if(practice&&!practiceDone(practice))return;if(index<TUTORIAL_STEPS.length-1){index++;lastDialogs=-1;render();}else close(true,true);};
  $('tutorialBack').onclick=()=>{if(index>0){index--;lastDialogs=-1;render();}};
  $('tutorialSkip').onclick=()=>close(true);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close(true);});
  // Backdrop dismissal is not completion; the player can replay it later.
  bindDialogBackdrop(dialog,()=>close(false));
  return {practiceResult,currentStep:()=>TUTORIAL_STEPS[index]||null,stepDialogs:()=>TUTORIAL_STEPS[index]?.dialogs||[],startIfNeeded(id){if(id&&!completed(id))open(id);},
   // A replay that is walked to the end hands over the training contract like a first
   // run does (`finished`), while skipping one stays a skip. `trainingSeen` decides
   // whether that is a fresh offer, so an account that never had the contract gets it
   // from whichever route it takes.
   replay:open,
   stop(){close(false);},refreshLanguage(){if(dialog.open)render();},isOpen:()=>dialog.open};
}
