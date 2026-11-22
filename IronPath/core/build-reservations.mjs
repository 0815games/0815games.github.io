// Host-owned, bounded leases for shared build pads. Time advances with the
// authoritative simulation clock, so reconnect/recovery never trusts a guest's
// wall clock. Only the hosting player is authoritative, not anti-cheat secure.
export const BUILD_RESERVATION_SECONDS=90;
export function releaseBuildReservations(state,playerId){
  for(const [pad,reservation] of Object.entries(state.buildReservations||{}))if(reservation.playerId===playerId)delete state.buildReservations[pad];
}
export function reserveBuildPad(state,playerId,pad){
  const reservations=state.buildReservations||(state.buildReservations={}),current=reservations[pad];
  if(current&&current.playerId!==playerId)return {ok:false,reason:'Another player is choosing a tower here.'};
  releaseBuildReservations(state,playerId);
  reservations[pad]={playerId,remaining:BUILD_RESERVATION_SECONDS};return {ok:true};
}
export function releaseBuildPad(state,playerId,pad){
  const current=state.buildReservations?.[pad];
  if(current?.playerId===playerId)delete state.buildReservations[pad];
  return {ok:true};
}
export function advanceBuildReservations(state,dt){
  for(const [pad,reservation] of Object.entries(state.buildReservations||{})){
    reservation.remaining-=dt;if(reservation.remaining<=0)delete state.buildReservations[pad];
  }
}
