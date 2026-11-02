// Tutorial completion is per account and browser. The interactive exercises
// use isolated example data; they never touch a soldier profile or Firebase.
export const TUTORIAL_STEPS = [
  {title:'Welcome, soldier',text:'Enemies follow the road toward your bunker. Keep the bunker standing as long as you can. Bosses attack every five waves.',scene:'bunker',caption:'DEFEND THE BUNKER'},
  {title:'Build your defenses',text:'Tap a + pad to open the build panel. Tap a tower to see its details, then confirm to build. Grey choices need more supplies but can still be inspected.',scene:'build',caption:'TAP A + PAD'},
  {title:'Upgrade or sell',text:'Tap a tower to see its range and open its action panel. Confirm the upgrade directly in the action panel, choose a specialization at level 3, or sell it for half the investment.',scene:'upgrade',caption:'CHOOSE AN ACTION'},
  {title:'Move your hero',text:'Tap open ground to move. On a keyboard, use WASD or the arrow keys. Your hero automatically fires at nearby enemies once deployed.',scene:'hero',caption:'MOVE INTO POSITION'},
  {title:'Start the battle',text:'Start each wave with Deploy. Use Speed in solo and your selected ability in battle. Defeated enemies provide supplies; cleared waves earn XP and loot. After each boss choose a temporary field upgrade; rare upgrades can change how towers fight.',scene:'battle',caption:'HOLD THE LINE'},
  {title:'Find your way around',text:'Each new operation generates a different battlefield. On a phone, swipe the enlarged map sideways or use Entry and Bunker to jump around. Open Terrain effects for battlefield rules and watch the marked zones: dust, cover, ice and mud change combat. Open How to play for sound and this briefing. A co-op battle continues while the briefing is open.',scene:'map',caption:'SWIPE THE MAP'},
  {title:'Practice the skill tree',text:'In this example, inspect a node, upgrade it, then select an ability. This practice uses example points and will not change your soldier.',scene:'skills',caption:'EXAMPLE BUILD',practice:'skills'},
  {title:'Practice the armory',text:'In this example, equip a reward and upgrade the bunker. This is a safe practice: no real scrap or equipment is changed.',scene:'armory',caption:'EXAMPLE ARMORY',practice:'armory'}
];
const memory=new Set();
const keyFor=id=>`ironpath:tutorial:v1:${id}`;
export function createTutorial({document,storage,onVisibilityChange=()=>{}}){
  const $=id=>document.getElementById(id),dialog=$('tutorialDialog');
  let index=0,activeUser=null,skill,armory,skipped;
  function resetPractice(){skill={inspected:false,upgraded:false,ability:false};armory={equipped:false,upgraded:false};skipped=new Set();}
  resetPractice();
  function completed(id){if(memory.has(id))return true;try{return storage?.getItem(keyFor(id))==='done';}catch{return false;}}
  function markCompleted(id){memory.add(id);try{storage?.setItem(keyFor(id),'done');}catch{/* Continue in this session if storage is unavailable. */}}
  function practiceDone(type){return skipped.has(type)||(type==='skills'?skill.upgraded&&skill.ability:type==='armory'?armory.equipped&&armory.upgraded:true);}
  function render(){
    const step=TUTORIAL_STEPS[index],practice=step.practice;
    $('tutorialStep').textContent=`FIELD BRIEFING · ${index+1} / ${TUTORIAL_STEPS.length}`;$('tutorialTitle').textContent=step.title;$('tutorialText').textContent=step.text;$('tutorialCaption').textContent=step.caption;$('tutorialScene').dataset.scene=step.scene;
    $('tutorialScene').hidden=!!practice;$('tutorialSkillsPractice').hidden=practice!=='skills';$('tutorialArmoryPractice').hidden=practice!=='armory';$('tutorialPracticeSkip').hidden=!practice||practiceDone(practice);
    $('tutorialBack').disabled=index===0;$('tutorialNext').disabled=!!practice&&!practiceDone(practice);$('tutorialNext').textContent=index===TUTORIAL_STEPS.length-1?'FINISH':'NEXT →';
    if(practice==='skills'){
      $('tutorialSkillPoints').textContent=`EXAMPLE: ${skill.upgraded?0:1} POINT AVAILABLE`;
      $('tutorialSkillNode').textContent=skill.inspected?'ASSAULT · RANK 1 SELECTED':'1 · INSPECT ASSAULT';$('tutorialSkillNode').setAttribute('aria-pressed',String(skill.inspected));
      $('tutorialSkillUpgrade').disabled=!skill.inspected||skill.upgraded;$('tutorialSkillUpgrade').textContent=skill.upgraded?'✓ RANK 2 UNLOCKED':'UPGRADE · 1 POINT';
      $('tutorialSkillAbility').disabled=!skill.upgraded||skill.ability;$('tutorialSkillAbility').textContent=skill.ability?'✓ AIRSTRIKE SELECTED':'SELECT AIRSTRIKE';
      $('tutorialPracticeStatus').textContent=skipped.has('skills')?'Practice skipped. Your real build is unchanged.':!skill.inspected?'Tap the Assault node to inspect it.':!skill.upgraded?'Now tap Upgrade to spend the example point.':!skill.ability?'Now select the example ability.':'Well done! Your real build is unchanged.';
    }else if(practice==='armory'){
      $('tutorialScrap').textContent=`EXAMPLE: ${armory.upgraded?30:60} SCRAP`;
      $('tutorialEquip').disabled=armory.equipped;$('tutorialEquip').textContent=armory.equipped?'✓ SCOPE EQUIPPED':'EQUIP FIELD SCOPE';
      $('tutorialBunkerUpgrade').disabled=armory.upgraded;$('tutorialBunkerUpgrade').textContent=armory.upgraded?'✓ FORTIFICATION RANK 1':'UPGRADE BUNKER · 30 SCRAP';
      $('tutorialPracticeStatus').textContent=skipped.has('armory')?'Practice skipped. Your real armory is unchanged.':!armory.equipped&&!armory.upgraded?'Try equipping the example scope and upgrading the bunker.':!armory.equipped?'Now equip the example scope.':!armory.upgraded?'Now upgrade the example bunker.':'Well done! Your real scrap and equipment are unchanged.';
    }
    $('tutorialPracticeStatus').hidden=!practice;
  }
  function open(id){if(!id)return;activeUser=id;index=0;resetPractice();render();if(!dialog.open)dialog.showModal();onVisibilityChange(true);}
  function close(mark){if(!dialog.open)return;if(mark&&activeUser)markCompleted(activeUser);dialog.close();activeUser=null;onVisibilityChange(false);}
  $('tutorialSkillNode').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='skills'){skill.inspected=true;render();}};
  $('tutorialSkillUpgrade').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='skills'&&skill.inspected&&!skill.upgraded){skill.upgraded=true;render();}};
  $('tutorialSkillAbility').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='skills'&&skill.upgraded&&!skill.ability){skill.ability=true;render();}};
  $('tutorialEquip').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='armory'&&!armory.equipped){armory.equipped=true;render();}};
  $('tutorialBunkerUpgrade').onclick=()=>{if(TUTORIAL_STEPS[index].practice==='armory'&&!armory.upgraded){armory.upgraded=true;render();}};
  $('tutorialPracticeSkip').onclick=()=>{const practice=TUTORIAL_STEPS[index].practice;if(practice){skipped.add(practice);render();}};
  $('tutorialNext').onclick=()=>{const practice=TUTORIAL_STEPS[index].practice;if(practice&&!practiceDone(practice))return;if(index<TUTORIAL_STEPS.length-1){index++;render();}else close(true);};
  $('tutorialBack').onclick=()=>{if(index>0){index--;render();}};
  $('tutorialSkip').onclick=()=>close(true);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close(true);});
  return {startIfNeeded(id){if(id&&!completed(id))open(id);},replay:open,stop(){close(false);},isOpen:()=>dialog.open};
}
