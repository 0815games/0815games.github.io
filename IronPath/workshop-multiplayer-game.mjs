// Builds a multiplayer match that carries validated workshop loadouts; used
// by the live Firebase party game and the recovery path. A validated lock
// does not establish trusted ownership.
import {createMatch} from './simulation.mjs?v=20261112-pressure1';
import {createVersus} from './versus.mjs?v=20261112-pressure1';
import {createFourCoop,createTwoVsTwo} from './four-modes.mjs?v=20261112-pressure1';
import {verifyWorkshopRoster,decodeMatchLoadout} from './workshop-multiplayer.mjs?v=20261112-pressure1';
import {workshopEffects} from './workshop-effects.mjs?v=20261112-pressure1';
function attach(lane,lock){
 const entries=Object.keys(lane.players).map(id=>lock.players.find(p=>p.id===id));
 if(entries.some(e=>!e))throw new Error('Workshop player missing');
 const loadouts=Object.fromEntries(entries.map(e=>[e.id,e.loadout]));
 lane.experimentalWorkshop={mode:lock.mode,loadouts};
 for(const {id,loadout} of entries){
  const effects=workshopEffects(decodeMatchLoadout(loadout,lock.mode),0);if(!effects)throw new Error('Invalid workshop loadout');
  lane.hp+=effects.bunkerHealth;lane.maxHp+=effects.bunkerHealth;
  if(lane.individualSupplies)lane.players[id].money+=effects.startSupplies;else lane.money+=effects.startSupplies;
 }
}
export function createWorkshopMultiplayerMatch(players,lock,{hostId,mapId,teams}={}){
 if(!lock||!Array.isArray(lock.players)||!Array.isArray(players))throw new Error('Invalid workshop lock');
 const ids=players.map(p=>p?.id),offers=Object.fromEntries(lock.players.map(p=>[p.id,{protocol:lock.protocol,loadout:p.loadout}]));
 if(!verifyWorkshopRoster(lock,{matchId:lock.matchId,mode:lock.mode,playerIds:ids,offers})||!ids.includes(hostId)||lock.mode==='solo')throw new Error('Workshop roster is not locked');
 const clean=players.map(p=>{if(!p?.loadout)throw new Error('Invalid player loadout');return {...p,loadout:{...p.loadout,equipped:0}};});
 let match;
 if(lock.mode==='coop'){match=createMatch(clean,mapId);match.mode='coop';match.hostId=hostId;attach(match,lock);}
 else if(lock.mode==='versus'){match=createVersus(clean,mapId,hostId);for(const lane of Object.values(match.lanes))attach(lane,lock);}
 else if(lock.mode==='four-coop'){match=createFourCoop(clean,hostId,mapId);attach(match.match,lock);}
 else if(lock.mode==='two-vs-two'){match=createTwoVsTwo(clean,hostId,teams,mapId);for(const lane of match.lanes)attach(lane,lock);}
 else throw new Error('Unsupported mode');
 return match;
}
