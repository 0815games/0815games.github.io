// Wire contract for match loadouts, live through the party game and the
// combat equipment path. Participant declarations and hosts are
// client-controlled; this does not prove item ownership and is not an
// anti-cheat boundary.
import {captureWorkshopLoadout,workshopEffects} from './workshop-effects.mjs?v=20261219-trains1';
import {decodeWorkshop} from './workshop-wire.mjs?v=20261219-trains1';
const protocol=1,slots=['weapon','gear','gadget'];
const counts={solo:[1],coop:[2],versus:[2],'four-coop':[3,4],'two-vs-two':[4]};
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=128&&!/[.#$\[\]/\u0000-\u001f\u007f]/.test(id);
const validMatchId=id=>typeof id==='string'&&/^[a-f0-9]{32}$/.test(id);
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));

export function encodeMatchLoadout(snapshot){
 // `relics` is an optional fourth key (solo snapshots carry it); the wire
 // format does not serialize it - co-op relics get their own protocol bump.
 const snapshotKeys=Object.keys(snapshot||{});
 if(!snapshotKeys.every(k=>['version','mode','items','relics'].includes(k))||!snapshotKeys.includes('version')||!snapshotKeys.includes('mode')||!snapshotKeys.includes('items')||Object.hasOwn(snapshot,'relics')&&!Array.isArray(snapshot.relics)||!Array.isArray(snapshot.items)||!snapshot.items.every(item=>exact(item,['slot','id','mod']))||!workshopEffects(snapshot,0))return null;
 return JSON.stringify([protocol,snapshot.mode,snapshot.items.map(i=>[i.id,i.mod])]);
}
export function decodeMatchLoadout(encoded,mode){
 if(typeof encoded!=='string'||encoded.length>512)return null;
 let value;try{value=JSON.parse(encoded);}catch{return null;}
 if(!Array.isArray(value)||value.length!==3||value[0]!==protocol||value[1]!==mode||!Array.isArray(value[2])||value[2].length!==3||value[2].some(pair=>!Array.isArray(pair)||pair.length!==2))return null;
 const items=value[2].map((pair,i)=>Object.freeze({slot:slots[i],id:pair[0],mod:pair[1]}));
 const snapshot=Object.freeze({version:protocol,mode,items:Object.freeze(items)});
 return workshopEffects(snapshot,0)?snapshot:null;
}
export function makeWorkshopOffer(profile,mode){
 const workshop=decodeWorkshop(profile?.workshop);if(!workshop)return null;
 const snapshot=captureWorkshopLoadout(workshop,mode),loadout=snapshot&&encodeMatchLoadout(snapshot);
 return loadout?{protocol,loadout}:null;
}
// Every roster member must advertise this protocol and a validated loadout;
// no implicit legacy fallback. Store the resulting lock with the match and
// verify it again on recovery. This contract alone cannot stop old clients
// from using paths that have not been gated by production rules.
export function lockWorkshopRoster({matchId,mode,playerIds,offers}={}){
 if(!validMatchId(matchId)||!Object.hasOwn(counts,mode)||!Array.isArray(playerIds)||!counts[mode].includes(playerIds.length)||playerIds.some(id=>!validId(id))||new Set(playerIds).size!==playerIds.length||!offers||typeof offers!=='object'||Array.isArray(offers))return null;
 const players=[];
 for(const id of playerIds){
  if(!Object.hasOwn(offers,id))return null;
  const offer=offers[id];if(!exact(offer,['protocol','loadout'])||offer.protocol!==protocol)return null;
  const parsed=decodeMatchLoadout(offer.loadout,mode);if(!parsed)return null;
  const loadout=encodeMatchLoadout(parsed);if(!loadout)return null;
  players.push(Object.freeze({id,loadout}));
 }
 return Object.freeze({protocol,matchId,mode,players:Object.freeze(players)});
}
// Compare canonical payloads, not just a claimed protocol version. A restore
// must bind the roster, mode, party and captured loadouts to the original lock.
export function verifyWorkshopRoster(lock,{matchId,mode,playerIds,offers}={}){
 const expected=lockWorkshopRoster({matchId,mode,playerIds,offers});
 if(!expected||!exact(lock,['protocol','matchId','mode','players'])||!Array.isArray(lock.players)||lock.players.some(p=>!exact(p,['id','loadout'])))return false;
 return lock.protocol===expected.protocol&&lock.matchId===expected.matchId&&lock.mode===expected.mode&&lock.players.length===expected.players.length&&lock.players.every((p,i)=>p.id===expected.players[i].id&&p.loadout===expected.players[i].loadout);
}
