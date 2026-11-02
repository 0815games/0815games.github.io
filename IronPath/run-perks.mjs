// Temporary shared upgrades: the offer is deterministic for this map and wave.
export const RUN_PERKS=Object.freeze([
 {name:'Field Ordnance',description:'All towers deal 10% more damage.',key:'damage'},
 {name:'Rapid Crews',description:'All towers fire 8% faster.',key:'speed'},
 {name:'Sharpened Aim',description:'Soldiers deal 15% more damage.',key:'hero'},
 {name:'Reinforce Bunker',description:'+20 maximum bunker health and repair 20.',key:'bunker'},
 {name:'Salvage Drop',description:'Each active soldier gains 60 supplies.',key:'supplies'},
 {name:'Emergency Repairs',description:'Repair 12 bunker health after every wave.',key:'repair'},
 {name:'Tank Hunters',description:'Cannons and snipers deal 20% more damage to tanks.',key:'tankhunter'},
 {name:'Quartermaster',description:'Each active soldier gains 1 extra supply per enemy defeated.',key:'salvage'},
 {name:'Hold the Line',description:'The bunker takes 15% less damage while below half health.',key:'laststand'},
 {name:'Pinning Rounds',description:'MG hits slow ground enemies 20% for 2 seconds. Extra ranks extend duration.',key:'pinning',rare:true},
 {name:'Flak Chain',description:'Flak hits also damage one nearby enemy for 30% of the original hit per rank.',key:'chain',rare:true},
 {name:'Critical Orders',description:'Every fourth sniper shot deals 75% more damage per rank.',key:'critical',rare:true}
]);
export function perkOffers(mapId,wave){
 let h=2166136261;for(const ch of `${mapId}:${wave}`)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
 const next=()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h;};
 const common=RUN_PERKS.map((p,i)=>p.rare?-1:i).filter(i=>i>=0),rare=RUN_PERKS.map((p,i)=>p.rare?i:-1).filter(i=>i>=0),out=[];
 // Rare upgrades appear in roughly one quarter of boss offers, never twice in one offer.
 const hasRare=next()%4===0;
 for(let i=0;i<(hasRare?2:3);i++)out.push(common.splice(next()%common.length,1)[0]);
 if(hasRare)out.push(rare[next()%rare.length]);return out;
}
