// Pure results model for a finished or retired operation. It reads only match
// state that the authoritative simulation already produced. Client-side XP,
// scrap and level values are estimates from the same published formulas; the
// server-side award path remains the source of truth for account progression.
import {waveXP,characterProgress} from './progression.mjs?v=20261102-terrain4';
import {ITEMS} from './armory.mjs?v=20261102-longterm1';
import {RUN_PERKS} from './run-perks.mjs?v=20261102-terrain4';

const EMPTY_RECORD=Object.freeze({heroDamage:0,towerDamage:0,kills:0,supplies:0,combos:0});

export function outcomeOf(state){
  if(state?.endReason==='victory')return 'victory';
  if(state?.endReason==='retired')return 'retired';
  if(state?.ended)return 'defeat';
  return 'active';
}

// startXP and startOwned are captured when the operation begins, because the
// account profile is updated after each cleared wave.
export function summarizeRun(state,{playerId=null,mission=null,startXP=0,startOwned=null}={}){
  const cleared=Math.max(0,Number.isSafeInteger(state?.clearedWaves)?state.clearedWaves:0);
  let xp=0;for(let wave=1;wave<=cleared;wave++)xp+=waveXP(wave);
  const bossesDefeated=Math.floor(cleared/5);

  const contributions=Object.entries(state?.players||{}).map(([id,p])=>{
    // Shots deal fractional damage (overdrive, terrain); the report shows whole points.
    const r={...EMPTY_RECORD,...(p.record||{})},hero=Math.round(r.heroDamage),tower=Math.round(r.towerDamage);
    return {id,name:p.name||'Soldier',you:id===playerId,heroDamage:hero,towerDamage:tower,damage:hero+tower,kills:r.kills,supplies:r.supplies,combos:r.combos};
  }).sort((a,b)=>b.damage-a.damage||a.id.localeCompare(b.id));
  const totalDamage=contributions.reduce((n,c)=>n+c.damage,0);
  for(const c of contributions)c.share=totalDamage?Math.round(100*c.damage/totalDamage):0;
  const you=contributions.find(c=>c.you)||null;

  const levelBefore=characterProgress(startXP).level,levelAfter=characterProgress(startXP+xp).level;

  // Armory rewards are per account. Null means the account snapshot is unavailable (co-op).
  let equipment=null,scrap=null;
  if(startOwned!==null&&Number.isInteger(startOwned)){
    equipment=[];scrap=10*cleared;
    ITEMS.forEach((item,i)=>{
      if(item.wave>cleared)return;
      if(startOwned&(1<<i))scrap+=10;else equipment.push({name:item.name,description:item.description});
    });
  }

  const perks=RUN_PERKS.filter(perk=>state?.runPerks?.[perk.key]).map(perk=>({name:perk.name,rank:state.runPerks[perk.key]}));
  const towers={standing:(state?.towers||[]).length,upgrades:(state?.towers||[]).reduce((n,t)=>n+Math.max(0,(t.level||1)-1),0)};

  return {
    outcome:outcomeOf(state),
    mission:mission?{id:mission.id,name:mission.name,region:mission.region,objectiveWave:mission.objectiveWave}:null,
    wave:Number.isSafeInteger(state?.wave)?state.wave:0,
    wavesSurvived:cleared,
    bossesDefeated,
    enemiesDefeated:state?.lootKills||0,
    caches:Math.floor((state?.lootKills||0)/5),
    xp,levelBefore,levelAfter,skillPointsGained:levelAfter-levelBefore,
    supplies:you?you.supplies:contributions.reduce((n,c)=>n+c.supplies,0),
    combos:contributions.reduce((n,c)=>n+c.combos,0),
    contributions,totalDamage,
    perks,towers,equipment,scrap
  };
}
