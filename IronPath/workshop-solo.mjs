// Builds a solo match that carries the account's workshop loadout; reached
// from solo-deployment for endless solo and campaign missions.
import {createMatch} from './simulation.mjs?v=20261031-finale1';
import {captureWorkshopLoadout,workshopEffects} from './workshop-effects.mjs?v=20261031-finale1';
export function createWorkshopSoloMatch(player,workshop,mapId,profile=null){
 const snapshot=captureWorkshopLoadout(workshop,'solo',profile);if(!snapshot||!player?.loadout)throw new Error('Invalid solo workshop loadout');
 // The new loadout replaces, rather than stacks with, the old equipped field.
 const copy={...player,loadout:{...player.loadout,equipped:0}};
 const state=createMatch([copy],mapId),effects=workshopEffects(snapshot,0);
 state.experimentalWorkshop={playerId:copy.id,snapshot};
 state.maxHp+=effects.bunkerHealth;state.hp+=effects.bunkerHealth;state.money+=effects.startSupplies;
 return state;
}
