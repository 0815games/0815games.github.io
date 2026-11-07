// Prestige gear: campaign trophies, not shop stock.
//
// A prestige item can never be crafted or bought. It is unlocked once, by
// finishing the mission that carries it, and it keeps that source in its record
// so the workshop can show where it came from. Like every other item it is a
// single encoded string in the account's workshop, so no new database field and
// no new rules are needed.
//
// Effects follow the existing workshop vocabulary (damage, range, movement,
// bunkerHealth, startSupplies, cooldown, shotIntervalMultiplier) so the live
// reducer and the match effects treat them like any other item.
import {CAMPAIGN,campaignProgress,campaignMission} from './campaign.mjs?v=20261107-balance1';

export const PRESTIGE=Object.freeze({
  'prestige-relay':{
    slot:'gadget',mission:'lost-signal',name:'Relay Key',tier:'I',
    effect:'Ada’s relay key, carried through the first night. The active ability recharges 4 seconds faster.',
    mods:{beacon:{name:'Beacon',effect:'+15 firing range.'},cadence:{name:'Cadence',effect:'+10 starting supplies.'}},
    bonus:{cooldown:4},
  },
  'prestige-oscillator':{
    slot:'gadget',mission:'pinewood-rescue',name:'Patrol Oscillator',tier:'I',
    effect:'The oscillator Ivo’s patrol died protecting. +12 firing range and +5 starting supplies.',
    mods:{relay:{name:'Relay Tap',effect:'The active ability recharges 2 seconds faster.'},signal:{name:'Signal Boost',effect:'+10 firing range.'}},
    bonus:{range:12,startSupplies:5},
  },
  'prestige-chargekey':{
    slot:'weapon',mission:'blackout',name:'Detonator Key',tier:'II',
    effect:'A key from the outpost charges. +3 soldier damage.',
    mods:{shaped:{name:'Shaped Charge',effect:'+2 soldier damage.'},pinned:{name:'Pinned Line',effect:'Soldier shot interval is 6% shorter.'}},
    bonus:{damage:3},
  },
  'prestige-convoy-plate':{
    slot:'gear',mission:'supply-line',name:'Convoy Plate',tier:'II',
    effect:'Cut from a relief truck to shield the wounded. +20 shared bunker health and +10 starting supplies.',
    mods:{spall:{name:'Spall Liner',effect:'+10 shared bunker health.'},stow:{name:'Stowage',effect:'+10 starting supplies.'}},
    bonus:{bunkerHealth:20,startSupplies:10},
  },
  'prestige-tidelock-seal':{
    slot:'gear',mission:'intercept',name:'Tidelock Seal',tier:'III',
    effect:'Rook’s dispatch seal, taken from the ashes. +15 shared bunker health and +15 starting supplies.',
    mods:{orders:{name:'Sealed Orders',effect:'+15 firing range.'},ballast:{name:'Ballast',effect:'+8 movement speed.'}},
    bonus:{bunkerHealth:15,startSupplies:15},
  },
  'prestige-bridge-marker':{
    slot:'gear',mission:'bridge',name:'Bridge Marker',tier:'III',
    effect:'The last marker from the evacuation. +25 movement speed.',
    mods:{span:{name:'Long Span',effect:'+10 movement speed.'},escort:{name:'Escort Drill',effect:'+10 firing range.'}},
    bonus:{movement:25},
  },
  'prestige-receiver':{
    slot:'gadget',mission:'dead-air',name:'Field Receiver',tier:'III',
    effect:'Ada’s receiver, still warm. The active ability recharges 3 seconds faster and +12 firing range.',
    mods:{listen:{name:'Long Listen',effect:'The active ability recharges 2 seconds faster.'},scope:{name:'Field Scope',effect:'+10 firing range.'}},
    bonus:{cooldown:3,range:12},
  },
  'prestige-icekey':{
    slot:'weapon',mission:'white-noise',name:'Ice Station Key',tier:'IV',
    effect:'The authorization key, cut from the ice station. +4 soldier damage and +10 firing range.',
    mods:{cipher:{name:'Cipher Break',effect:'+2 soldier damage.'},window:{name:'Short Window',effect:'Soldier shot interval is 6% shorter.'}},
    bonus:{damage:4,range:10},
  },
  'prestige-transformer-coil':{
    slot:'gear',mission:'long-switch',name:'Transformer Coil',tier:'IV',
    effect:'A coil from the substation, still humming. +30 shared bunker health.',
    mods:{stepdown:{name:'Step Down',effect:'+15 shared bunker health.'},taps:{name:'Tap Set',effect:'+10 starting supplies.'}},
    bonus:{bunkerHealth:30},
  },
  'prestige-nia-badge':{
    slot:'gadget',mission:'city-of-glass',name:'Reyes Badge',tier:'IV',
    effect:'Nia’s controller badge. +4 soldier damage and the active ability recharges 3 seconds faster.',
    mods:{override:{name:'Override',effect:'+10 firing range.'},access:{name:'Access Code',effect:'+10 starting supplies.'}},
    bonus:{damage:4,cooldown:3},
  },
  'prestige-broadcast-horn':{
    slot:'gadget',mission:'tidelock',name:'Broadcast Horn',tier:'V',
    effect:'The horn that turned Rook’s army. +20 firing range and +20 starting supplies.',
    mods:{wide:{name:'Wide Band',effect:'+10 firing range.'},carrier:{name:'Carrier Wave',effect:'+10 starting supplies.'}},
    bonus:{range:20,startSupplies:20},
  },
  'prestige-override-flag':{
    slot:'weapon',mission:'last-transmission',name:'Override Flag',tier:'V',
    effect:'The last pull at the industrial tower, kept as a trophy. +6 soldier damage and +15 firing range.',
    mods:{victory:{name:'Victory Plate',effect:'+2 soldier damage.'},last:{name:'Last Cable',effect:'Soldier shot interval is 8% shorter.'}},
    bonus:{damage:6,range:15},
  },
});

export const PRESTIGE_IDS=Object.freeze(Object.keys(PRESTIGE));

export function isPrestige(id){return typeof id==='string'&&Object.hasOwn(PRESTIGE,id);}
export function prestigeFor(id){return isPrestige(id)?PRESTIGE[id]:null;}

// A trophy is mine only once the mission that carries it is finished, so the
// mission index is the gate: progress is the number of completed missions.
export function prestigeEarned(id,profile){
  const item=prestigeFor(id),index=CAMPAIGN.findIndex(m=>m.id===item?.mission);
  return index>=0&&index<campaignProgress(profile);
}

// Everything the account should own right now. Used to backfill after a client
// update so a player who finished a mission never loses its trophy, and cannot
// claim one for a mission the server does not see as complete.
export function earnedPrestige(profile){
  const owned=[];for(const id of PRESTIGE_IDS)if(prestigeEarned(id,profile))owned.push(id);return owned;
}

// Ids still missing from a workshop, in campaign order. The caller writes them
// through the normal workshop transaction; this only decides what is owed.
export function missingPrestige(profile,workshop){
  const have=new Set(Array.isArray(workshop?.owned)?workshop.owned:[]);
  return earnedPrestige(profile).filter(id=>!have.has(id));
}

// The mission that awards a trophy, for the armory and the campaign board.
export function prestigeMission(id){const item=prestigeFor(id);return item?campaignMission(item.mission):null;}
export function prestigeByMission(){
  const map={};for(const id of PRESTIGE_IDS){map[PRESTIGE[id].mission]=PRESTIGE[id];}return map;
}
