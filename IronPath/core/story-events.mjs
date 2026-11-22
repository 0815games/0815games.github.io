// Mission accompaniment for the solo campaign: radio decisions with bonus
// objectives, and authored field events (side objectives, reinforcements,
// set-piece strikes). Presentation data plus pure definitions only - the
// runtime lives in story-mission.mjs, the rendering in game.js.
//
// Scope (campaign plan, decided): radio decisions and field events start
// with Act II. Act I keeps its lean briefing; the systems are built so the
// later act PRs only add entries here.
//
// Effects are run-local by design: supplies and enemy counts of the current
// operation, never account data. Nothing here is written to the profile, so
// the published rules stay untouched.

// One radio decision per authored mission, offered once when stage `at`
// becomes active. Non-modal: the field keeps running while the card waits.
export const MISSION_DECISIONS=Object.freeze({
  // Act II · THE FLOOD
  'intercept':{at:0,speaker:'VOSS',text:'The escort is light and moving fast. We can hit them head-on, or you read their traffic while the unit shadows them. Your call, soldier.',
    choices:[
      {id:'ambush',label:'Set the ambush',detail:'+35 supplies now · the escort’s reserve joins the field (4 units)',confirm:'VOSS: Ambush it is. Supplies dropped - expect their reserve to react.',supplies:35,reinforce:4},
      {id:'shadow',label:'Shadow the courier',detail:'Bonus objective: break 8 units before the orders reach command (+75 supplies)',confirm:'VOSS: Shadow them. Break eight before the case comes home and the quartermaster pays out.',side:{id:'intercept-shadow',label:'Shadow the courier: break 8 units before delivery',kind:'kills',count:8,until:{stage:2},reward:75}},
    ]},
  'high-water':{at:1,speaker:'SERA',text:'The sluice house is ours. We can drain the flood into the old channel and bog their footing, or seal every gate and keep the dyke at full strength. Choose.',
    choices:[
      {id:'sluice',label:'Open the sluice',detail:'+40 supplies now · the drained channel brings 4 units',confirm:'SERA: Sluice open. The ground is soft - and they will use the dry bed to come at you.',supplies:40,reinforce:4},
      {id:'seal',label:'Seal the gates',detail:'Bonus objective: clear the dyke approach within 70s (+80 supplies)',confirm:'SERA: Gates sealed. The dyke takes everything they have - clear their pioneers off it in seventy seconds and we are even.',side:{id:'high-water-seal',label:'Clear the dyke approach within 70s',kind:'time',stage:1,seconds:70,reward:80}},
    ]},
  'ward-line':{at:0,speaker:'IVO',text:'We can tap the convoy’s reserve tank for the field, or keep every drop for the hospital. The reserve buys you time; the ward needs the light. Choose.',
    choices:[
      {id:'tap',label:'Tap the reserve',detail:'+30 supplies now · the short convoy draws 3 street patrols',confirm:'IVO: Tapped. Mind the patrols - they heard the pump.',supplies:30,reinforce:3},
      {id:'ward',label:'Every drop for the ward',detail:'Bonus objective: the fuel skid survives with at least 75% health (+80 supplies)',confirm:'IVO: All of it for the ward. Keep that skid above three quarters and Sera owes you her whole night shift.',side:{id:'ward-line-ward',label:'Fuel skid survives with at least 75% health',kind:'asset',stage:0,threshold:75,reward:80}},
    ]},
  'bridge':{at:0,speaker:'SERA',text:'The convoy is ready to roll. We can burn our flares to light your field, or you clear the far bank approach yourself while the children cross. What do you need?',
    choices:[
      {id:'flares',label:'Spare the flares',detail:'+45 supplies now · Rook’s reserve answers the light (5 units)',confirm:'SERA: Flares away. Watch the far treeline - the light draws them in.',supplies:45,reinforce:5},
      {id:'farbank',label:'Hold the far bank',detail:'Bonus objective: secure the approach within 75s (+85 supplies)',confirm:'SERA: Then hold it clean. Secure the approach in seventy-five seconds and we owe you.',side:{id:'bridge-farbank',label:'Secure the approach within 75s',kind:'time',stage:0,seconds:75,reward:85}},
    ]},
  'the-count':{at:0,speaker:'VOSS',text:'We can light the marsh with flares and end this fast, or go dark and read their search pattern. The light finds him sooner - and everything else. Choose.',
    choices:[
      {id:'flares',label:'Light the marsh',detail:'+35 supplies now · the flares draw 4 hunters',confirm:'VOSS: Flares up. You will see them coming - all of them.',supplies:35,reinforce:4},
      {id:'dark',label:'Go dark',detail:'Bonus objective: break 12 units before the driver is found (+75 supplies)',confirm:'VOSS: Dark it is. Break twelve of theirs before we reach the truck and the night is ours.',side:{id:'the-count-dark',label:'Break 12 units before the driver is found',kind:'kills',count:12,until:{stage:1},reward:75}},
    ]},
  'dead-air':{at:1,speaker:'ADA',text:'The receiver can take the spare battery for a boost, or I keep the power low and we listen quiet. Both put me on Rook’s map. Choose.',
    choices:[
      {id:'battery',label:'Wire the spare battery',detail:'+30 supplies now · the power draw brings 3 enemies to the receiver',confirm:'ADA: Battery is in. They will see the spike - be ready.',supplies:30,reinforce:3},
      {id:'listen',label:'Listen low',detail:'Bonus objective: the receiver survives with at least 75% health (+80 supplies)',confirm:'ADA: Listening low. Keep the receiver above three quarters and the recording is clean.',side:{id:'dead-air-listen',label:'Receiver survives with at least 75% health',kind:'asset',stage:1,threshold:75,reward:80}},
    ]},
  'ice-run':{at:1,speaker:'SERA',text:'We can drop half the load and arm the escort, or run the sledge heavy and trust the pass. Choose.',
    choices:[
      {id:'arm',label:'Arm the escort',detail:'+35 supplies now · the lighter sledge draws 4 raiders',confirm:'SERA: Armed. They will come for the light load - meet them.',supplies:35,reinforce:4},
      {id:'heavy',label:'Run the sledge heavy',detail:'Bonus objective: the medicine sledge survives with at least 80% health (+85 supplies)',confirm:'SERA: Heavy it is. Keep that sledge above four fifths and every station gets its full share.',side:{id:'ice-run-heavy',label:'Medicine sledge survives with at least 80% health',kind:'asset',stage:1,threshold:80,reward:85}},
    ]},
  'white-noise':{at:0,speaker:'IVO',text:'The window is short. We can force the station door and eat the resistance, or mirror the key quietly and keep our time. Choose fast.',
    choices:[
      {id:'force',label:'Force the door',detail:'+40 supplies now · 4 defenders hold the station grounds',confirm:'IVO: Forcing it. Supplies ahead - so are the defenders.',supplies:40,reinforce:4},
      {id:'mirror',label:'Mirror the key',detail:'Bonus objective: reach the transmitter with at least 60s on the clock (+90 supplies)',confirm:'IVO: Mirror it. Reach the transmitter with a minute left and we walk out clean.',side:{id:'white-noise-mirror',label:'Reach the transmitter with 60s on the clock',kind:'clock',stage:1,threshold:60,reward:90}},
    ]},
  'cold-start':{at:0,speaker:'ADA',text:'The garrison’s fuel depot is unguarded. Burn it and they fight cold and blind, or leave it standing and photograph their reschedule. Choose.',
    choices:[
      {id:'burn',label:'Burn the depot',detail:'+40 supplies now · the smoke column brings 4 to the junction',confirm:'ADA: Depot burning. They will see it from the next valley - be ready.',supplies:40,reinforce:4},
      {id:'film',label:'Photograph the reschedule',detail:'Bonus objective: take the switch house within 80s (+80 supplies)',confirm:'ADA: Quietly, then. The switch house in eighty seconds and their timetable is mine.',side:{id:'cold-start-film',label:'Take the switch house within 80s',kind:'time',stage:0,seconds:80,reward:80}},
    ]},
  'long-switch':{at:1,speaker:'IVO',text:'The switching yard is ours for now. Split the crew to speed the reroute, or double-check every relay before I throw the switch. Your call.',
    choices:[
      {id:'split',label:'Split the crew',detail:'+35 supplies now · the exposed yard draws 4 sappers',confirm:'IVO: Crew split. Watch the yard - they will not leave it alone.',supplies:35,reinforce:4},
      {id:'relays',label:'Double-check the relays',detail:'Bonus objective: the transformer survives with at least 70% health (+85 supplies)',confirm:'IVO: Checked twice. Keep the transformer above seventy percent and the hospital never flickers.',side:{id:'long-switch-relays',label:'Transformer survives with at least 70% health',kind:'asset',stage:2,threshold:70,reward:85}},
    ]},
});

// Authored field events, independent of any decision.
//   side       a bonus objective that activates on its own (no choice needed)
//   reinforce  extra units joining a wave, announced on the radio
//   setpiece   a scripted strike: damage to every living enemy on the field
export const MISSION_EVENTS=Object.freeze({
  'intercept':[
    {kind:'reinforce',id:'intercept-reserve',at:0,delay:20,count:3,speaker:'VOSS',text:'Their reserve is moving on your position. Hold the line.'},
  ],
  'bridge':[
    {kind:'setpiece',id:'bridge-barrage',at:1,delay:8,damage:45,speaker:'VOSS',text:'Counter-battery, NOW. Make those guns count, soldier.'},
  ],
  'white-noise':[
    {kind:'side',id:'white-noise-grounds',activate:{stage:0},side:{id:'white-noise-grounds',label:'Break 10 units before the transmitter is reached',kind:'kills',count:10,until:{stage:1},reward:60}},
  ],
  'long-switch':[
    {kind:'setpiece',id:'long-switch-surge',at:2,delay:10,damage:40,speaker:'SERA',text:'The hospital generator is backing you - channel the surge into the line!'},
  ],
  'high-water':[
    {kind:'setpiece',id:'high-water-culvert',at:2,delay:6,damage:45,speaker:'SERA',text:'The river just broke their culvert - whatever was crossing that road is gone. Press on!'},
  ],
  'ward-line':[
    {kind:'reinforce',id:'ward-line-patrol',at:1,delay:15,count:3,speaker:'VOSS',text:'Street patrol rerouting to the crossing. They know our timetable - hold anyway.'},
  ],
  'the-count':[
    {kind:'setpiece',id:'the-count-bog',at:2,delay:8,damage:40,speaker:'SERA',text:'Listen - the bog just swallowed their gun nest whole. Even the ground is on our side tonight.'},
  ],
  'ice-run':[
    {kind:'reinforce',id:'ice-run-spotters',at:2,delay:10,count:3,speaker:'IVO',text:'Spotters on the far ridge - they called the convoy in. Watch the high ground.'},
  ],
  'cold-start':[
    {kind:'setpiece',id:'cold-start-switch',at:1,delay:12,damage:45,speaker:'IVO',text:'A frozen switch just split their reserve train - half of it is stranded on the far track. Hit them now!'},
  ],
});

// Tutorial-style captions for the stage radio card, one per stage type.
export const STAGE_CAPTIONS=Object.freeze({
  hold:'MOVE TO THE MARKER AND HOLD',
  secure:'CLEAR THE POSITION, THEN HOLD IT',
  defend:'PROTECT THE BUNKER',
  protect:'KEEP THE ASSET STANDING',
  escort:'WALK WITH THEM TO THE MARKER',
  eliminate:'BREAK THE ESCORT',
});

// UI templates the accompaniment renders (translated via language.mjs).
export const EVENT_TEMPLATES=Object.freeze({
  decisionTitle:'FIELD DECISION',
  decisionPending:'Choose before the moment passes - the field keeps running.',
  bonusLine:'BONUS · {label}',
  bonusProgress:'BONUS · {label} ({progress}/{max})',
  bonusAsset:'BONUS · {label} ({percent}%)',
  bonusComplete:'Bonus objective complete: {label} (+{reward} supplies)',
  bonusMissed:'Bonus objective missed: {label}',
  suppliesGranted:'+{amount} supplies',
  reinforcements:'Reinforcements: {count} extra units on the field',
});
