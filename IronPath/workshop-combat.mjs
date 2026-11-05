// Experimental solo-only bridge into the existing combat engine. This module is
// not wired to account loading, live matchmaking, or any player-facing screen.
import {legacyEquipmentEffects} from './equipment-effects.mjs?v=20261105-workshop1';
import {workshopEffects} from './workshop-effects.mjs';

export function equipmentForPlayer(state,player){
 const lock=state.experimentalWorkshop;
 if(!lock)return legacyEquipmentEffects(player?.loadout?.equipped,state.wave);
 // Never silently fall back to old effects if a match contains a broken lock.
 if(state.individualSupplies||state.mode&&state.mode!=='solo'||Object.keys(state.players||{}).length!==1||!player||player.id!==lock.playerId||lock.snapshot?.mode!=='solo')throw new Error('Invalid experimental solo workshop lock');
 const effects=workshopEffects(lock.snapshot,state.wave);
 if(!effects)throw new Error('Invalid experimental workshop loadout');
 return effects;
}
