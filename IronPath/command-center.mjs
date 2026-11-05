import {translate,translateText} from './language.mjs?v=20261105-soldier1';
import {characterProgress} from './progression.mjs?v=20261105-prestige1';
import {readArmory,ITEMS} from './armory.mjs?v=20261102-longterm1';
import {campaignProgress,CAMPAIGN} from './campaign.mjs?v=20261103-cinematic1';
import {parseBuild,pointsLeft} from './skills.mjs?v=20261104-doctrines1';
// Navigation only: online matches and account mutations remain with their existing owners.
export function createCommandCenter({document,getProfile,getGame,isPartyActive,openParty,closeParty=()=>{},signOut}){
 const $=id=>document.getElementById(id);
 function render(){const profile=getProfile();if(!profile)return;const p=characterProgress(profile.xp),armory=readArmory(profile.armory),points=pointsLeft(parseBuild(profile.skills,p.level),p.level),progress=campaignProgress(profile),game=getGame();
  $('menuName').textContent=profile.name;$('menuLevel').textContent=translate('command.level',{level:p.level});$('menuXp').textContent=`${p.current} / ${p.required} XP`;$('menuXpBar').max=p.required;$('menuXpBar').value=p.current;$('menuEquipment').textContent=armory.equipped?translateText(ITEMS[armory.equipped-1].name):translate('command.none');$('menuScrap').textContent=String(armory.scrap);$('menuPoints').textContent=String(points);$('menuPortrait').src=profile.gender==='male'?'assets/soldier-male.jpg':'assets/soldier-female.jpg';$('menuCampaignProgress').textContent=progress>=CAMPAIGN.length?translate('command.storyDone'):translate('command.missions',{done:progress,total:CAMPAIGN.length});
  const summary=game?.getRunSummary();$('menuResume').hidden=!summary&&!isPartyActive();$('menuResumeLabel').textContent=isPartyActive()?translate('command.returnOnline'):summary?translate('command.resume',{operation:summary}):translate('command.resumeDefault');
 }
 function showBattle(pauseSolo=false,mode=null){const game=getGame(),workspace=$('gameWorkspace');workspace.dataset.screen=mode||(game?.isOnlineMatch?.()?'online':game?.getSoloMode?.()||'endless');workspace.dataset.online=String(!!game?.isOnlineMatch?.());$('commandCenter').hidden=true;workspace.hidden=false;game?.setMenuOpen(pauseSolo===true);}
 function showLobby(){showBattle(true,'lobby');}
 function navigateToMenu(allowParty=false){if(isPartyActive()&&!allowParty){$('saveStatus').textContent=translateText('Leave your multiplayer party before returning to the Command Center.');return false;}closeParty();getGame()?.setMenuOpen(true);$('gameWorkspace').hidden=true;$('commandCenter').hidden=false;render();return true;}
 $('menuResume').onclick=()=>{if(isPartyActive()&&!getGame()?.isOnlineMatch?.()){showLobby();openParty();}else showBattle();};
 $('menuCampaign').onclick=()=>{if(isPartyActive()){$('saveStatus').textContent=translateText('Leave your multiplayer party before choosing a solo operation.');return;}showBattle(false,'campaign');getGame()?.chooseStory();};
 $('menuEndless').onclick=async()=>{if(isPartyActive()){$('saveStatus').textContent=translateText('Leave your multiplayer party before choosing a solo operation.');return;}showBattle(true,'endless');const loaded=await getGame()?.chooseEndless();if(loaded) getGame()?.setMenuOpen(false);else showMenu();};
 $('menuMultiplayer').onclick=()=>{showLobby();openParty();};
 $('returnOnline').onclick=()=>{if(getGame()?.isOnlineMatch?.()){closeParty();showBattle();}};
 $('menuTutorial').onclick=()=>getGame()?.showTutorial();$('menuArmory').onclick=()=>$('armoryOpen').onclick();$('menuSkills').onclick=()=>$('skillOpen').onclick();$('menuLogout').onclick=()=>signOut();$('backToCommand').onclick=showMenu;
 function showMenu(){return navigateToMenu();}
 function showAfterEnd(){return navigateToMenu(true);}
 return {render,showBattle,showLobby,showMenu,showAfterEnd};
}
