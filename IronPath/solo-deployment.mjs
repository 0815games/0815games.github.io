// Route the real solo game to its equipment implementation. The workshop path
// is opt-in and requires a valid migrated profile; never silently discard an
// invalid loadout or fall back to old equipment. Campaign remains legacy.
import {createMatch} from './simulation.mjs?v=20261105-workshop3';
import {createWorkshopSoloMatch} from './workshop-solo.mjs?v=20261112-alpha1';
import {decodeWorkshop} from './workshop-wire.mjs';

export function createSoloDeployment({player,mapId,profile,workshopEnabled=false,campaign=false}) {
 if(workshopEnabled&&!campaign){
  const workshop=decodeWorkshop(profile?.workshop);
  if(!workshop)throw new Error('A valid workshop is required for an endless deployment');
  return createWorkshopSoloMatch(player,workshop,mapId);
 }
 return createMatch([player],mapId);
}
