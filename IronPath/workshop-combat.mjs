// The live equipment path: routes each player's gear to its effects. A match
// carries either a legacy one-slot loadout or a captured workshop snapshot;
// a broken workshop lock fails closed instead of falling back silently.
import {legacyEquipmentEffects} from './equipment-effects.mjs?v=20261107-balance1';
import {workshopEffects} from './workshop-effects.mjs?v=20261210-actiii1';
import {decodeMatchLoadout} from './workshop-multiplayer.mjs?v=20261210-actiii1';
import {applyRelicBonus} from './relics.mjs?v=20261210-actiii1';

export function equipmentForPlayer(state,player){
 const lock=state.experimentalWorkshop;
 if(!lock){const legacy=legacyEquipmentEffects(player?.loadout?.equipped,state.wave);return state.relicBonus?applyRelicBonus(legacy,state.relicBonus):legacy;}
 // Never silently fall back to old effects if a match contains a broken lock.
 let snapshot;
 if(lock.mode){
  if(!['coop','four-coop','versus','two-vs-two'].includes(lock.mode)||!lock.loadouts||typeof lock.loadouts!=='object'||!player||!Object.hasOwn(state.players,player.id)||!Object.hasOwn(lock.loadouts,player.id)||Object.keys(lock.loadouts).length!==Object.keys(state.players).length||Object.keys(state.players).some(id=>!Object.hasOwn(lock.loadouts,id)))throw new Error('Invalid experimental workshop match lock');
  snapshot=decodeMatchLoadout(lock.loadouts[player.id],lock.mode);
 }else{
  if(state.individualSupplies||state.mode&&state.mode!=='solo'||Object.keys(state.players||{}).length!==1||!player||player.id!==lock.playerId||lock.snapshot?.mode!=='solo')throw new Error('Invalid experimental solo workshop lock');
  snapshot=lock.snapshot;
 }
 const effects=workshopEffects(snapshot,state.wave);
 if(!effects)throw new Error('Invalid experimental workshop loadout');
 return effects;
}
