// Structural validation for an explicitly locked workshop match. These checks
// do not authenticate the lock or stop older clients; enforcement belongs at
// a trusted manifest/rules boundary before this can be enabled.
import {verifyWorkshopRoster} from './workshop-multiplayer.mjs?v=20261112-pressure1';

export function validWorkshopMatchLock(lock,{partyId,mode,playerIds}){
 if(!lock||!Array.isArray(lock.players))return false;
 const offers=Object.fromEntries(lock.players.map(p=>[p?.id,{protocol:lock.protocol,loadout:p?.loadout}]));
 return verifyWorkshopRoster(lock,{matchId:partyId,mode,playerIds,offers});
}
// Accept either full host state or a player's projected view. In 1v1 the
// projected view has own and rival lanes; each lane lock contains one player.
export function validWorkshopMatchState(game,lock){
 if(!game||!lock||!Array.isArray(lock.players))return false;
 let lanes;
 if(lock.mode==='four-coop')lanes=[game.match];
 else if(lock.mode==='two-vs-two')lanes=game.lanes;
 else if(lock.mode==='versus')lanes=game.lanes?Object.values(game.lanes):[game,game.rival];
 else if(lock.mode==='coop')lanes=[game];
 else return false;
 if(!Array.isArray(lanes)||lanes.length!==(['versus','two-vs-two'].includes(lock.mode)?2:1))return false;
 const expected=Object.fromEntries(lock.players.map(p=>[p.id,p.loadout])),seen=new Set();
 for(const lane of lanes){
  const w=lane?.experimentalWorkshop,loadouts=w?.loadouts;
  if(w?.mode!==lock.mode||!loadouts||typeof loadouts!=='object'||Array.isArray(loadouts))return false;
  const ids=Object.keys(loadouts);if(!ids.length)return false;
  for(const id of ids){
   if(seen.has(id)||!Object.hasOwn(expected,id)||loadouts[id]!==expected[id]||lane.players?.[id]?.loadout?.equipped!==0)return false;
   seen.add(id);
  }
 }
 return seen.size===lock.players.length;
}
