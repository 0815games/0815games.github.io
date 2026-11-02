// Shared lobby policy; enforcement at the Firebase boundary is still required.
export function availablePartyModes(playerCount){
  if(playerCount===2)return ['coop','versus'];
  if(playerCount===3)return ['four-coop'];
  if(playerCount===4)return ['four-coop','two-vs-two'];
  return [];
}
export function canStartParty({playerIds,profiles,mode,teams}){
  if(!Array.isArray(playerIds)||!availablePartyModes(playerIds.length).includes(mode)||new Set(playerIds).size!==playerIds.length||playerIds.some(id=>typeof id!=='string'||!id))return false;
  if(!profiles||playerIds.some(id=>!profiles[id]))return false;
  if(mode==='two-vs-two'&&(!Array.isArray(teams)||teams.length!==4||teams.some(t=>t!==0&&t!==1)||teams.filter(t=>t===0).length!==2))return false;
  return true;
}
