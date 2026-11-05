import {translateText as tr} from './language.mjs?v=20261105-debrief1';
import {bindDialogBackdrop} from './dialog-dismiss.mjs?v=20261104-dismiss1';
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
  {title:'Practice the Skills menu',text:'At level 2, you earn your first skill point. Pick a category and select a skill card to see its details. Unlock it in the inspector, then save your build. Try it here: this example never changes your soldier.',scene:'skills',caption:'EXAMPLE BUILD',practice:'skills'},
  {title:'Practice the Armory',text:'Use Equipment to equip unlocked rewards, Bunker to upgrade defenses, and Service Record to see medals. Practice with the example below; it will not change your real inventory.',scene:'armory',caption:'EXAMPLE ARMORY',practice:'armory'}
];
const memory=new Set();
const keyFor=id=>`ironpath:tutorial:v1:${id}`;
export function createTutorial({document,storage,onVisibilityChange=()=>{}}){
  const $=id=>document.getElementById(id),dialog=$('tutorialDialog');
  let index=0,activeUser=null,skill,armory,skipped;
  function resetPractice(){skill={inspected:false,upgraded:false,saved:false};armory={equipped:false,upgraded:false,category:'equipment',confirming:false};skipped=new Set();}
  resetPractice();
  function completed(id){if(memory.has(id))return true;try{return storage?.getItem(keyFor(id))==='done';}catch{return false;}}
  function markCompleted(id){memory.add(id);try{storage?.setItem(keyFor(id),'done');}catch{/* Continue in this session if storage is unavailable. */}}
  function practiceDone(type){return skipped.has(type)||(type==='skills'?skill.upgraded&&skill.saved:type==='armory'?armory.equipped&&armory.upgraded:true);}
  function render(){
    const step=TUTORIAL_STEPS[index],practice=step.practice;
    $('tutorialStep').textContent=tr('FIELD BRIEFING · {step} / {total}',{step:index+1,total:TUTORIAL_STEPS.length});$('tutorialTitle').textContent=tr(step.title);$('tutorialText').textContent=tr(step.text);$('tutorialCaption').textContent=tr(step.caption);$('tutorialScene').dataset.scene=step.scene;
    $('tutorialScene').hidden=!!practice;$('tutorialSkillsPractice').hidden=practice!=='skills';$('tutorialArmoryPractice').hidden=practice!=='armory';$('tutorialPracticeSkip').hidden=!practice||practiceDone(practice);
    $('tutorialBack').disabled=index===0;$('tutorialNext').disabled=!!practice&&!practiceDone(practice);$('tutorialNext').textContent=index===TUTORIAL_STEPS.length-1?tr('FINISH'):tr('NEXT →');
    if(practice==='skills'){
      $('tutorialSkillPoints').textContent=tr(skill.upgraded?'{count} POINTS AVAILABLE':'{count} POINT AVAILABLE',{count:skill.upgraded?0:1});
      $('tutorialSkillNode').setAttribute('aria-pressed',String(skill.inspected));$('tutorialSkillCardState').textContent=skill.upgraded?tr('EQUIPPED'):tr('AVAILABLE');
      $('tutorialSkillDetailTitle').textContent=skill.inspected?tr('Airstrike'):tr('Select a skill');$('tutorialSkillDetailText').textContent=skill.inspected?tr('Deal 35 damage to all enemies. Spend one point to unlock this main skill.'):tr('Choose the Airstrike card to inspect it.');
      $('tutorialSkillUpgrade').disabled=!skill.inspected||skill.upgraded;$('tutorialSkillUpgrade').textContent=skill.upgraded?tr('MAIN SKILL SELECTED'):tr('UNLOCK · 1 POINT');
      $('tutorialSkillSave').disabled=!skill.upgraded||skill.saved;$('tutorialSkillSave').textContent=skill.saved?tr('BUILD SAVED'):tr('SAVE BUILD');
      $('tutorialPracticeStatus').textContent=skipped.has('skills')?tr('Practice skipped. Your real build is unchanged.'):!skill.inspected?tr('Select the Airstrike card.'):!skill.upgraded?tr('Use the inspector to unlock this example skill.'):!skill.saved?tr('Save the example build.'):tr('Example saved. Your real build is unchanged.');
    }else if(practice==='armory'){
      $('tutorialScrap').textContent=tr('{count} SCRAP',{count:armory.upgraded?30:60});
      for(const [id,category] of [['tutorialEquipmentTab','equipment'],['tutorialBunkerTab','bunker'],['tutorialServiceTab','service']])$(id).setAttribute('aria-pressed',String(armory.category===category));
      $('tutorialEquipmentPanel').hidden=armory.category!=='equipment';$('tutorialBunkerPanel').hidden=armory.category!=='bunker';$('tutorialServicePanel').hidden=armory.category!=='service';
      $('tutorialEquipState').textContent=armory.equipped?tr('EQUIPPED'):tr('UNLOCKED');$('tutorialEquip').disabled=armory.equipped;$('tutorialEquip').textContent=armory.equipped?tr('EQUIPPED'):tr('EQUIP');
      $('tutorialBunkerUpgrade').disabled=armory.upgraded||armory.confirming;$('tutorialBunkerUpgrade').textContent=armory.upgraded?tr('UPGRADED'):tr('UPGRADE · 30 SCRAP');$('tutorialBunkerConfirmArea').hidden=!armory.confirming;$('tutorialFortifyRank').textContent=tr('Rank {rank} of 3',{rank:armory.upgraded?1:0});
      $('tutorialPracticeStatus').textContent=skipped.has('armory')?tr('Practice skipped. Your real armory is unchanged.'):!armory.equipped?tr('Open Equipment and equip the example Field Scope.'):armory.confirming?tr('Confirm the example upgrade or cancel.'):!armory.upgraded?tr('Open Bunker and upgrade example Fortification.'):tr('Well done! Your real scrap and equipment are unchanged.');
    }
    $('tutorialPracticeStatus').hidden=!practice;
  }
  function open(id){if(!id)return;activeUser=id;index=0;resetPractice();render();if(!dialog.open)dialog.showModal();onVisibilityChange(true);}
  function close(mark){if(!dialog.open)return;if(mark&&activeUser)markCompleted(activeUser);dialog.close();activeUser=null;onVisibilityChange(false);}
  $('tutorialSkillNode').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='skills'){skill.inspected=true;render();}};
  $('tutorialSkillUpgrade').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='skills'&&skill.inspected&&!skill.upgraded){skill.upgraded=true;render();}};
  $('tutorialSkillSave').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='skills'&&skill.upgraded&&!skill.saved){skill.saved=true;render();}};
  for(const [id,category] of [['tutorialEquipmentTab','equipment'],['tutorialBunkerTab','bunker'],['tutorialServiceTab','service']])$(id).onclick=()=>{if(TUTORIAL_STEPS[index].practice==='armory'){armory.category=category;armory.confirming=false;render();}};
  $('tutorialEquip').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='armory'&&armory.category==='equipment'&&!armory.equipped){armory.equipped=true;render();}};
  $('tutorialBunkerUpgrade').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='armory'&&armory.category==='bunker'&&!armory.upgraded&&!armory.confirming){armory.confirming=true;render();}};
  $('tutorialBunkerConfirm').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='armory'&&armory.category==='bunker'&&armory.confirming&&!armory.upgraded){armory.upgraded=true;armory.confirming=false;render();}};
  $('tutorialBunkerCancel').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='armory'&&armory.confirming){armory.confirming=false;render();}};
  $('tutorialPracticeSkip').onclick=()=>{const practice=TUTORIAL_STEPS[index].practice;if(practice){skipped.add(practice);render();}};
  $('tutorialNext').onclick=()=>{const practice=TUTORIAL_STEPS[index].practice;if(practice&&!practiceDone(practice))return;if(index<TUTORIAL_STEPS.length-1){index++;render();}else close(true);};
  $('tutorialBack').onclick=()=>{if(index>0){index--;render();}};
  $('tutorialSkip').onclick=()=>close(true);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close(true);});
  // Backdrop dismissal is not completion; the player can replay it later.
  bindDialogBackdrop(dialog,()=>close(false));
  return {startIfNeeded(id){if(id&&!completed(id))open(id);},replay:open,stop(){close(false);},refreshLanguage(){if(dialog.open)render();},isOpen:()=>dialog.open};
}
