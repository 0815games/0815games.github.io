// Route the real solo game to its equipment implementation.
//
// The workshop path is used when the player has a valid migrated workshop.
// A save that has no workshop yet (any account that has not opened the armory)
// keeps the legacy equipment; the workshop is prepared by the account when the
// player opens the armory, so a live player is never blocked or reset. A save
// with a workshop that cannot be read never silently falls back: that would
// discard the player's chosen loadout.
import {createMatch} from './simulation.mjs?v=20261105-workshop3';
import {createWorkshopSoloMatch} from './workshop-solo.mjs?v=20261112-alpha1';
import {decodeWorkshop} from './workshop-wire.mjs';

export function createSoloDeployment({player,mapId,profile,workshopEnabled=false,campaign=false}) {
 if(workshopEnabled&&!campaign&&profile&&Object.hasOwn(profile,'workshop')){
  const workshop=decodeWorkshop(profile.workshop);
  if(!workshop)throw new Error('A valid workshop is required for an endless deployment');
  return createWorkshopSoloMatch(player,workshop,mapId);
 }
 return createMatch([player],mapId);
}
