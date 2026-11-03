import {characterProgress} from './progression.mjs?v=20261102-terrain4';
import {readArmory,ITEMS} from './armory.mjs?v=20261102-longterm1';
import {campaignProgress,CAMPAIGN} from './campaign.mjs?v=20261103-cinematic1';
import {parseBuild,pointsLeft} from './skills.mjs?v=20261102-results1';
// Navigation only: online matches and account mutations remain with their existing owners.
export function createCommandCenter({document,getProfile,getGame,isPartyActive,openParty,signOut}){
 const $=id=>document.getElementById(id);
 function render(){const profile=getProfile();if(!profile)return;const p=characterProgress(profile.xp),armory=readArmory(profile.armory),points=pointsLeft(parseBuild(profile.skills,p.level),p.level),progress=campaignProgress(profile),game=getGame();
  $('menuName').textContent=profile.name;$('menuLevel').textContent=`LEVEL ${p.level}`;$('menuXp').textContent=`${p.current} / ${p.required} XP`;$('menuXpBar').max=p.required;$('menuXpBar').value=p.current;$('menuEquipment').textContent=armory.equipped?ITEMS[armory.equipped-1].name:'None equipped';$('menuScrap').textContent=String(armory.scrap);$('menuPoints').textContent=String(points);$('menuPortrait').src=profile.gender==='male'?'assets/soldier-male.jpg':'assets/soldier-female.jpg';$('menuCampaignProgress').textContent=progress>=CAMPAIGN.length?'Story complete · replay missions':`${progress} / ${CAMPAIGN.length} missions completed`;
  const summary=game?.getRunSummary();$('menuResume').hidden=!summary&&!isPartyActive();$('menuResumeLabel').textContent=isPartyActive()?'RETURN TO MULTIPLAYER':summary?`RESUME ${summary}`:'RESUME OPERATION';
 }
 function showBattle(pauseSolo=false){const game=getGame();$('commandCenter').hidden=true;$('gameWorkspace').hidden=false;game?.setMenuOpen(pauseSolo===true);}
 function showMenu(){if(isPartyActive()){$('saveStatus').textContent='Leave your multiplayer party before returning to the Command Center.';return false;}getGame()?.setMenuOpen(true);$('gameWorkspace').hidden=true;$('commandCenter').hidden=false;render();return true;}
 $('menuResume').onclick=()=>showBattle();
 $('menuCampaign').onclick=()=>{if(isPartyActive()){$('saveStatus').textContent='Leave your multiplayer party before choosing a solo operation.';return;}showBattle();getGame()?.chooseStory();};
 $('menuEndless').onclick=async()=>{if(isPartyActive()){$('saveStatus').textContent='Leave your multiplayer party before choosing a solo operation.';return;}showBattle();await getGame()?.chooseEndless();};
 $('menuMultiplayer').onclick=()=>{showBattle(true);openParty();};
 $('menuTutorial').onclick=()=>getGame()?.showTutorial();$('menuArmory').onclick=()=>$('armoryOpen').onclick();$('menuSkills').onclick=()=>$('skillOpen').onclick();$('menuLogout').onclick=()=>signOut();$('backToCommand').onclick=showMenu;
 return {render,showBattle,showMenu};
}
