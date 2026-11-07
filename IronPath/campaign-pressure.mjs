// Campaign pressure: what makes a story mission hard.
//
// Endless solo is a sandbox; a mission is an operation with a contract. Each
// campaign mission states its own threat level, and that level adds enemies,
// toughens them and eats into the bunker. Prestige gear is the intended answer:
// the last missions are close to impossible in standard kit.
//
// Pure maths, no state: the simulation and the tests both call these.

// Threat levels, weakest first. `wave` is the number of waves on the contract,
// `unit` scales enemy health, `damage` scales what reaches the bunker, `squad`
// widens each formation and `bunker` multiplies starting/maximum bunker health.
export const THREATS=Object.freeze({
  standard:{label:'Standard',wave:5,unit:1,damage:1,squad:0,bunker:1},
  hardened:{label:'Hardened',wave:6,unit:1.15,damage:1.2,squad:1,bunker:.85},
  elite:{label:'Elite',wave:7,unit:1.3,damage:1.35,squad:2,bunker:.72},
  legendary:{label:'Legendary',wave:8,unit:1.35,damage:1.45,squad:3,bunker:.68},
});

export function threatFor(key){return Object.hasOwn(THREATS,key)?THREATS[key]:THREATS.standard;}

// Enemy health multiplier for a mission wave. Measured against the endless curve
// (makeEnemy already adds 23% per wave), so a legendary contract at wave 5 faces
// roughly what endless sees around wave 8, plus its squad width.
export function campaignUnitScale(threat,wave){
  const t=threatFor(threat);
  if(!Number.isSafeInteger(wave)||wave<1)return 1;
  return Math.round(t.unit*100)/100;
}

// Every n-th wave of a contract arrives with an extra push instead of a boss,
// so a mission cannot be idled through.
export function campaignSurge(threat,wave){
  const t=threatFor(threat);
  if(!Number.isSafeInteger(wave)||wave<1)return 0;
  return wave>=3&&wave%2===1?t.squad:0;
}

// Bunker health for a mission. A legendary contract starts with 55% of a
// standard bunker, which is why bunker upgrades and the Mechanic Kit matter.
export function campaignBunker(base,tHp){
  const health=Math.round(base*tHp);
  return Number.isSafeInteger(health)&&health>=20?health:20;
}

// Wave contract for a mission: the number of waves the operation runs for.
export function campaignWaves(threat){return threatFor(threat).wave;}
