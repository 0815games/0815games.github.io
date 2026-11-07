// Balance sweep driver: prints one line per mode/map/gear combination.
// Usage: node tests/balance-sweep.mjs [gear] [maxWave]
import {runSolo,runCoop,runVersus,runTwoVsTwo,runFourCoop,runCampaign,GEARS} from './balance-harness.mjs';
import {CAMPAIGN} from '../campaign.mjs';
const gearName=process.argv[2]||'rookie',maxWave=Number(process.argv[3]||40);
const gear=GEARS[gearName]||GEARS.rookie;
const line=(tag,r)=>console.log(tag.padEnd(28),
  `wave=${String(r.wave).padStart(2)} hp=${String(r.hp).padStart(3)}/${r.maxHp} twr=${String(r.towers).padStart(2)} lvls=${String(r.levels).padStart(2)} $=${String(r.money).padStart(4)} ${r.won!==undefined?(r.won?'WON':'LOST'):r.ended}`);
for(const m of ['road','forest','outpost','g2-75eac321','g2-f16b92c3','g3-0b9f45231','g3-0d3e7f521','g3-17c2a4b8e'])line('SOLO '+m,runSolo(m,gear,maxWave));
for(const m of ['road','forest','outpost','g2-75eac321','g3-0b9f45231'])line('COOP2 '+m,runCoop(m,2,gear,maxWave));
line('FOUR3',runFourCoop(3,gear,maxWave));
line('FOUR4',runFourCoop(4,gear,maxWave));
for(const m of ['road','forest','outpost','g2-75eac321','g3-0b9f45231','g3-2c1f0e3a2']){
  const r=runVersus(m,gear,maxWave);
  console.log('VERSUS '+m.padEnd(21),`waves=[${r.waves}] ${r.ended}`);
}
{const r=runTwoVsTwo(gear,maxWave);console.log('2V2'.padEnd(28),`waves=[${r.waves}] ${r.ended}`);}
for(const mission of CAMPAIGN)line('MIS '+mission.id,runCampaign(mission,gear));
