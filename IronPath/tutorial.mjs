// Add new lessons here as systems are introduced. Completion is per account and
// browser for now; do not put tutorial data in Firebase until rules are migrated.
export const TUTORIAL_STEPS = [
  {title:'Welcome, soldier',text:'Enemies follow the road toward your bunker. Keep the bunker standing through all ten waves.',scene:'bunker',caption:'DEFEND THE BUNKER'},
  {title:'Build your defenses',text:'Tap a + pad to open the circle menu. Choose one of four towers. Grey choices need more supplies.',scene:'build',caption:'TAP A + PAD'},
  {title:'Upgrade or sell',text:'Tap a tower to see its range and open its action menu. Upgrade it, choose a specialization at level 3, or sell it for half the investment.',scene:'upgrade',caption:'CHOOSE AN ACTION'},
  {title:'Move your hero',text:'Tap open ground to move. On a keyboard, use WASD or the arrow keys. Your hero automatically fires at nearby enemies once deployed.',scene:'hero',caption:'MOVE INTO POSITION'},
  {title:'Start the battle',text:'Start each wave with Deploy. Use Speed to change the pace and Airstrike to damage enemies. Defeated enemies provide supplies; cleared waves earn XP.',scene:'battle',caption:'HOLD THE LINE'},
  {title:'Find your way around',text:'On a phone, swipe the enlarged map sideways or use Entry and Bunker to jump around. Open How to play to replay this briefing anytime.',scene:'map',caption:'SWIPE THE MAP'}
];
const memory=new Set();
const keyFor=id=>`ironpath:tutorial:v1:${id}`;
export function createTutorial({document,storage,onVisibilityChange=()=>{}}){
  const $=id=>document.getElementById(id),dialog=$('tutorialDialog');
  let index=0,activeUser=null;
  function completed(id){if(memory.has(id))return true;try{return storage?.getItem(keyFor(id))==='done';}catch{return false;}}
  function markCompleted(id){memory.add(id);try{storage?.setItem(keyFor(id),'done');}catch{/* Continue in this session if storage is unavailable. */}}
  function render(){const step=TUTORIAL_STEPS[index];$('tutorialStep').textContent=`FIELD BRIEFING · ${index+1} / ${TUTORIAL_STEPS.length}`;$('tutorialTitle').textContent=step.title;$('tutorialText').textContent=step.text;$('tutorialCaption').textContent=step.caption;$('tutorialScene').dataset.scene=step.scene;$('tutorialBack').disabled=index===0;$('tutorialNext').textContent=index===TUTORIAL_STEPS.length-1?'FINISH':'NEXT →';}
  function open(id){if(!id)return;activeUser=id;index=0;render();if(!dialog.open)dialog.showModal();onVisibilityChange(true);}
  function close(mark){if(!dialog.open)return;if(mark&&activeUser)markCompleted(activeUser);dialog.close();activeUser=null;onVisibilityChange(false);}
  $('tutorialNext').onclick=()=>{if(index<TUTORIAL_STEPS.length-1){index++;render();}else close(true);};
  $('tutorialBack').onclick=()=>{if(index>0){index--;render();}};
  $('tutorialSkip').onclick=()=>close(true);
  dialog.addEventListener('cancel',e=>{e.preventDefault();close(true);});
  return {startIfNeeded(id){if(id&&!completed(id))open(id);},replay:open,stop(){close(false);},isOpen:()=>dialog.open};
}
