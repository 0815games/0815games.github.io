// Campaign progress is account-saved but client-reported, not cheat-proof.
// Each mission is a fresh solo operation using existing waves and rewards.
export const CAMPAIGN=Object.freeze([
  Object.freeze({id:'last-road',title:'The Last Road',mapId:'road',goal:5,briefing:'Hold the road through the first boss wave.'}),
  Object.freeze({id:'pinewood',title:'Pinewood Crossing',mapId:'forest',goal:10,briefing:'Secure the forest crossing through wave 10.'}),
  Object.freeze({id:'outpost',title:'Broken Outpost',mapId:'outpost',goal:15,briefing:'Defend the outpost through wave 15.'})
]);
export function campaignProgress(profile){const n=profile?.campaign;return Number.isInteger(n)&&n>=0&&n<=CAMPAIGN.length?n:0;}
export function campaignMission(id){return CAMPAIGN.find(m=>m.id===id)||null;}
export function campaignAvailable(profile,id){const index=CAMPAIGN.findIndex(m=>m.id===id);return index>=0&&index<=campaignProgress(profile);}
export function completeCampaign(profile,id,wave){const mission=campaignMission(id),index=CAMPAIGN.indexOf(mission),progress=campaignProgress(profile);if(!profile||!mission||!Number.isSafeInteger(wave)||wave<mission.goal||index>progress)return null;return {...profile,campaign:Math.max(progress,index+1)};}
