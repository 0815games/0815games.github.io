// Temporary shared upgrades: the offer is deterministic for this map and wave.
export const RUN_PERKS=Object.freeze([
 {name:'Field Ordnance',description:'All towers deal 10% more damage.',key:'damage'},
 {name:'Rapid Crews',description:'All towers fire 8% faster.',key:'speed'},
 {name:'Sharpened Aim',description:'Soldiers deal 15% more damage.',key:'hero'},
 {name:'Reinforce Bunker',description:'+20 maximum bunker health and repair 20.',key:'bunker'},
 {name:'Salvage Drop',description:'Each active soldier gains 60 supplies.',key:'supplies'},
 {name:'Emergency Repairs',description:'Repair 12 bunker health after every wave.',key:'repair'}
]);
export function perkOffers(mapId,wave){
 let h=2166136261;for(const ch of `${mapId}:${wave}`)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;
 const pool=RUN_PERKS.map((_,i)=>i),out=[];for(let i=0;i<3;i++){h=(Math.imul(h,1664525)+1013904223)>>>0;out.push(pool.splice(h%pool.length,1)[0]);}return out;
}
