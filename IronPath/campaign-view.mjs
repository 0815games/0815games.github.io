// Campaign picker. Mission text comes from trusted static data, but every node
// is still created with textContent so future content edits stay safe.
import {missionStatus,missionDetails} from './campaign.mjs?v=20261102-beta1';
function node(document,tag,text,className){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
export function renderCampaign(document,missions,level,{onStart,activeId=null,coop=false}={}){
  const list=document.getElementById('campaignList');list.textContent='';
  for(const mission of missions){
    const status=missionStatus(mission,level),details=missionDetails(mission);
    const card=node(document,'article',undefined,'campaign-mission'+(status.open?'':' is-locked')+(activeId===mission.id?' is-active':''));
    card.append(
      node(document,'span',`${mission.region} · Mission ${missions.indexOf(mission)+1}`,'eyebrow'),
      node(document,'h3',mission.name),
      node(document,'p',mission.brief),
      node(document,'small',`Terrain: ${details.terrain}. ${details.terrainBriefing}`),
      node(document,'small',`Finale: ${details.bossLabel} at wave ${mission.objectiveWave}. ${details.bossDescription}`)
    );
    const button=node(document,'button',activeId===mission.id?'PLAYING':status.open?'START MISSION':'LOCKED','primary');
    button.type='button';button.disabled=!status.open||coop||activeId===mission.id;
    if(!status.open)card.append(node(document,'p',status.reason,'campaign-lock'));
    if(coop)card.append(node(document,'p','Leave co-op to start a campaign mission.','campaign-lock'));
    button.onclick=()=>onStart(mission);
    card.append(button);list.append(card);
  }
}
