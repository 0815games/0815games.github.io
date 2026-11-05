// Provisional economy model for the armory workshop. Numbers are for playtesting,
// not final: this file only answers "how long until I can craft/own something?"
//
// Model: a completed wave pays 10 scrap (as the live `rewardWave` does) and pays
// a duplicate item's scrap again when the wave's item is already owned. Every
// fifth wave is a boss wave that also pays BOSS_SCRAP and one component.
// Effects are intentionally not modelled here; they are in `workshop-effects.mjs`.
export const ECONOMY=Object.freeze({
  scrapPerWave:10,
  duplicateScrap:10,
  bossScrap:20,
  componentPerBoss:1,
  modScrap:60,
  itemCosts:Object.freeze({
    marksman:{scrap:150,components:1},
    mechanic:{scrap:150,components:1},
    radio:{scrap:150,components:1},
    boots:{scrap:50,components:0}
  })
});

// Income after `waves` completed waves, assuming waves are completed in order
// from wave 1. `ownedWaves` lists item-unlock waves already owned (duplicates).
export function incomeAfter(waves,ownedWaves=[]){
  const count=Math.max(0,Math.floor(Number.isFinite(waves)?waves:0));
  const bosses=Math.floor(count/5);
  const unlockedItemWaves=[2,4,6,8,10,12,14,16,18,20];
  const duplicates=unlockedItemWaves.filter(wave=>wave<=count&&ownedWaves.includes(wave)).length;
  return {waves:count,scrap:count*ECONOMY.scrapPerWave+duplicates*ECONOMY.duplicateScrap+bosses*ECONOMY.bossScrap,components:bosses*ECONOMY.componentPerBoss,bosses};
}

// Waves of income still needed for a given wallet, or 0 when affordable.
export function wavesUntilAffordable(item,cost,wallet){
  const {scrap=0,components=0}=wallet||{};
  const missingScrap=Math.max(0,cost.scrap-scrap),missingComponents=Math.max(0,cost.components-components);
  // Walk wave by wave so boss scrap is counted exactly (not averaged).
  let scrapWaves=0,earned=0;
  while(earned<missingScrap&&scrapWaves<100000){scrapWaves++;earned+=ECONOMY.scrapPerWave+(scrapWaves%5===0?ECONOMY.bossScrap:0);}
  // One component arrives every five waves.
  return Math.max(scrapWaves,missingComponents*5);
}

export function catalogue(itemIds=Object.keys(ECONOMY.itemCosts)){
  return itemIds.filter(id=>Object.hasOwn(ECONOMY.itemCosts,id)).map(id=>({id,...ECONOMY.itemCosts[id]}));
}

// Coarse playtest report: when does each item become reachable from scratch?
export function starterReport(){
  const rows=[],zero={scrap:0,components:0};
  for(const entry of catalogue()){
    const waves=wavesUntilAffordable(entry.id,entry,zero);
    rows.push({...entry,wavesFromScratch:waves,income:incomeAfter(waves)});
  }
  return rows.sort((a,b)=>a.wavesFromScratch-b.wavesFromScratch);
}
