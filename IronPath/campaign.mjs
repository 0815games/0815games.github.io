// First campaign: four fixed battlefields, one per region, each with a finale
// boss drawn from the existing boss cycle. Unlocks use soldier level, which
// already comes from saved account XP, so no new save data is required.
// Campaign missions are solo-only; co-op keeps the endless operation rules.
import {bossForWave,BOSSES} from './combat.mjs?v=20261102-battle2';
import {getMap} from './maps.mjs?v=20261102-terrain4';
import {TERRAIN_BRIEFINGS} from './terrain.mjs?v=20261102-terrain4';

export const CAMPAIGN_MISSIONS=Object.freeze([
  {id:'scrub-first-contact',region:'Scrubland Front',name:'First Contact',map:'g2-000007b4',objectiveWave:5,level:1,boss:'bossIronclad',
   brief:'Hold the scrubland road. Tanks kick up dust, so place towers where their route stays visible.'},
  {id:'arctic-thin-ice',region:'Frozen Lake',name:'Thin Ice',map:'g2-000003ac',objectiveWave:10,level:2,boss:'bossBomber',
   brief:'Tanks crack the lake ice. Once it breaks, the road is faster and deadlier for the bunker.'},
  {id:'urban-rubble-line',region:'Ruined Industrial Zone',name:'Rubble Line',map:'g2-000001a7',objectiveWave:15,level:3,boss:'bossJuggernaut',
   brief:'Rubble weakens long-range fire until you clear it. Break the cover before the Juggernaut arrives.'},
  {id:'marsh-last-stand',region:'Delta Mudflats',name:'Last Stand',map:'g2-000005b0',objectiveWave:20,level:4,boss:'bossCommander',
   brief:'Mud slows tanks, and reed cover hides infantry. Survive the finale and break the War Commander’s rally.'}
]);

export function missionById(id){return CAMPAIGN_MISSIONS.find(m=>m.id===id)||null;}

export function missionStatus(mission,level){
  if(!mission)return {open:false,reason:'Unknown mission.'};
  return level>=mission.level?{open:true,reason:''}:{open:false,reason:`Reach soldier level ${mission.level} to unlock.`};
}

export function missionSetup(mission){
  return {mapId:mission.map,objectiveWave:mission.objectiveWave};
}

export function missionDetails(mission){
  const map=getMap(mission.map),boss=BOSSES.find(b=>b.kind===mission.boss);
  return {
    terrain:map.name,
    terrainBriefing:TERRAIN_BRIEFINGS[map.theme]||'',
    bossLabel:boss?.label||'Boss',
    bossDescription:boss?.description||'',
    objective:`Clear wave ${mission.objectiveWave} to complete this mission.`
  };
}

// Used by tests and by the campaign UI to verify the finale boss matches the wave.
export function finaleBossKind(mission){return bossForWave(mission.objectiveWave)?.kind||null;}
