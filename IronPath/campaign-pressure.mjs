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
  veteran:{label:'Veteran',wave:7,unit:1.33,damage:1.4,squad:2,bunker:.7},
  legendary:{label:'Legendary',wave:8,unit:1.35,damage:1.45,squad:3,bunker:.68},
  iron:{label:'Iron',wave:9,unit:1.5,damage:1.6,squad:4,bunker:.6},
});

export function threatFor(key){return Object.hasOwn(THREATS,key)?THREATS[key]:THREATS.standard;}

// Per-mission pressure. The generated fields differ wildly in how well a
// defender can cover them: at the same threat grade the rookie autopilot
// finished ward-line and dead-air without a scratch (72/72 bunker) while
// signal-home and ice-run hung on by 2hp - the MAP decided the difficulty,
// not the grade (reported: "Act 1 easy peasy" with no equipment at all).
// These factors scale enemy health and bunker damage per mission, calibrated
// with the balance harness (tools/calibrate-pressure.mjs) against two
// story-aware policies - the pinned survival autopilot must still win its
// wave contract, and a competent no-gear story runner must stay victorious.
// Act finales and everything past the act III relic wall keep factor 1 -
// they are gates and walls, not races to tune.
export const PRESSURE={
  // act I - the autopilot holds 44/100/29% of its bunker through the standard
  // contracts; the no-gear story runner coasts through the two onboarding
  // sprints and lands at 54% on the third.
  'lost-signal':1.55,
  'pinewood-rescue':1.8,
  'ghost-frequency':1.55,
  'blackout':1.05,
  'ash-market':1.15,
  'the-list':1.3,
  'brothers-keeper':1.05,
  'quiet-road':1.05,
  'signal-home':1,
  // act II - the elite band: autopilot 3-44%, story runner 21-63% except the
  // rushable sprints (high-water, white-noise, cold-start), whose wave
  // contracts still run hot (29-35% autopilot) for anyone who stays.
  'intercept':1,
  'high-water':1.25,
  'ward-line':1.05,
  'bridge':1,
  'the-count':1.05,
  'dead-air':1.15,
  'ice-run':1,
  'white-noise':1,
  'cold-start':1.15,
};
// The pressure of a mission contract. Anything unlisted (finales, the acts
// behind the relic wall, training, endless) runs at 1.
export function campaignPressure(campaign){
  const value=PRESSURE[campaign?.id];
  return Number.isFinite(value)&&value>0?value:1;
}

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
