import {threatFor,campaignWaves} from './campaign-pressure.mjs?v=20261101-campaign1';
import {getMap} from './maps.mjs?v=20261031-finale1';

// Story progress is account-saved and client-reported, not cheat-proof.
// The retired wave-goal campaign remains only as legacy account data.
//
// Every mission now plays on a generated sector-1 field (g3): the story uses
// the same painted terrain, zones, torches and roadside look as free play.
// Because a generated map's road, pads and bunker move with its seed, stages
// cannot ship fixed coordinates. They carry semantic anchors instead, which
// resolveStages() turns into concrete points against the real map at load
// time - deterministically, so every client agrees without any wiring:
//   at:'bunker'        the mission's destination (escorts, deliveries)
//   at:'entry'         where the enemy road enters the field
//   at:<fraction>      that fraction along the road (junctions, convoys)
//   at:'field'         the next free field spot away from road, pads, bunker
const MISSIONS=[
  {id:'lost-signal',act:'ACT I · THE SILENCE',title:'The Silent Signal',mapId:'g3-0a195a333',threat:'standard',
   briefing:'At dawn, every radio on the valley road goes silent—except for one broken distress call. Captain Mara Voss sends you to find the courier carrying the relay key. The bunker is the last place still answering.',
   stages:[{type:'hold',at:.62,seconds:4,label:'Find the downed courier',dialogue:'VOSS: Courier Ada Vale went down near the road. Find her before the enemy does.'},{type:'hold',at:.3,seconds:5,label:'Restore the field relay',dialogue:'ADA: I hid the key in my coat. The voice on that recording was my brother. Please bring the relay back.'},{type:'hold',at:'bunker',seconds:2,label:'Return the signal to command',dialogue:'ADA: The coordinates are coming through. Get them to Voss; I will keep this line open.'}],
   success:'VOSS: The signal points to Pinewood. Ada’s brother served with the patrol there. If anyone is alive, we bring them home.'},
  {id:'pinewood-rescue',act:'ACT I · THE SILENCE',title:'The Missing Patrol',mapId:'g3-0538453d7',threat:'standard',
   briefing:'Pinewood’s crossing is under attack. The distress signal came from an engineer named Ivo Chen and a handful of soldiers. Ada insists her brother is with them; Voss cannot promise what you will find.',
   stages:[{type:'hold',at:'field',seconds:5,label:'Find the missing patrol',dialogue:'VOSS: Search the shelter beyond the crossing. Ivo was carrying a component we cannot replace.'},{type:'escort',at:'bunker',seconds:2,label:'Escort the patrol to the bunker',dialogue:'IVO: We are all that is left. Ada’s brother stayed behind to get us out. Please tell her he saved us.'}],
   success:'ADA: He was supposed to come home. IVO: He gave me the oscillator so we could warn you. The enemy transmitter is turning our own relay network against us.'},
  {id:'ghost-frequency',act:'ACT I · THE SILENCE',title:'Ghost Frequency',mapId:'g3-0b3f01a77',threat:'standard',
   briefing:'Ada traces the jamming signal to an old relay chain through the Talwald. As she brings each mast online, a looped callsign answers her - one that has been dead for a year.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the first mast',dialogue:'ADA: The relay line runs through the forest. Start at the first mast; I will listen as you go.'},{type:'protect',at:'field',asset:'Relay',seconds:20,label:'Protect the relay mast',dialogue:'ADA: It is here. My brother’s old callsign, looping on our frequency. Keep them off the mast while I record it.'},{type:'hold',at:'bunker',seconds:2,label:'Return the recording',dialogue:'ADA: Voss, listen. That is Elias. He is alive, and someone is using his voice to bait us.'}],
   success:'VOSS: If Elias Vale is alive, he is being moved. ADA: Then we follow the signal - all of it.'},
  {id:'blackout',act:'ACT I · THE SILENCE',title:'Blackout at the Outpost',mapId:'g3-02e2ac0ea',threat:'hardened',
   briefing:'Ivo identifies the old outpost transmitter as the source of the jamming. Destroying it may reopen the road, but it will also tell the enemy exactly where the resistance is hiding.',
   stages:[{type:'hold',at:.3,seconds:3,label:'Plant the first charge',dialogue:'IVO: One goes at the junction, the other on the feed. But no assignment is worth your life.'},{type:'hold',at:.72,seconds:3,label:'Plant the second charge',dialogue:'ADA: First charge is answering. Ivo, are you sure the second will not bring down our relay too?'},{type:'defend',seconds:40,label:'Defend until detonation',dialogue:'IVO: I am sure enough. Charges armed—hold the bunker until they fire.'}],
   success:'VOSS: The jammer is down. ADA: Wait. A second signal just woke up. Someone wanted us to destroy that transmitter.'},
  {id:'ash-market',act:'ACT I · THE SILENCE',title:'The Ash Market',mapId:'g3-0c5d2e19b',threat:'hardened',
   briefing:'The relay chain needs parts the resistance cannot make. In the ruined industrial quarter, a black market trades in salvaged components - and Rook’s quartermasters bid for the same crates.',
   stages:[{type:'eliminate',count:6,label:'Break the quartermaster’s escort',dialogue:'VOSS: Rook’s buyers are already there. Break their escort before the auction closes.'},{type:'hold',at:.3,seconds:4,label:'Win the auction crates',dialogue:'IVO: Two masts’ worth of components. Bid fast - the market moves when the shelling starts.'},{type:'escort',at:'bunker',seconds:3,label:'Escort the parts hauler',dialogue:'IVO: The hauler is loaded. Walk it home; the market does not give refunds.'}],
   success:'IVO: Enough components for three masts. ADA: And a manifest from the buyer’s tent - the payments are signed with a prison camp code.'},
  {id:'the-list',act:'ACT I · THE SILENCE',title:'The List',mapId:'g3-0d7a4b35c',threat:'hardened',
   briefing:'The camp code points to a marsh field hospital run by Medic Sera Malik. Enemy reprisal squads are combing the delta for her wounded. Her list of names begins here.',
   stages:[{type:'secure',at:'field',seconds:10,label:'Secure the dressing station',dialogue:'SERA: I operate as long as the ground outside is ours. Clear it and keep it clear.'},{type:'protect',at:'field',asset:'Field hospital',seconds:20,label:'Protect the field hospital',dialogue:'SERA: Reprisal squads in the reeds. Do not let them reach the tents - every name on my list is still breathing.'},{type:'escort',at:'bunker',seconds:3,label:'Evacuate the wounded',dialogue:'SERA: Litters are moving. Walk them out ahead of the next sweep.'}],
   success:'SERA: Everyone on the list is out. One of my wounded was a courier - he spoke of a manifest with a prisoner called VALE.'},
  {id:'brothers-keeper',act:'ACT I · THE SILENCE',title:'Brother’s Keeper',mapId:'g3-0e9c6f21d',threat:'hardened',
   briefing:'A captured dispatch rider was moved across the ice road before the pass closed. His satchel is said to hold a prisoner manifest - and Ada has stopped pretending she is not listening.',
   stages:[{type:'eliminate',count:8,label:'Break the dispatch escort',dialogue:'VOSS: The rider is with that escort. Take them down before they reach the far shore.'},{type:'hold',at:.3,seconds:4,label:'Recover the dispatch satchel',dialogue:'ADA: The satchel is at the relay post. Bring it to me unopened. Please.'},{type:'hold',at:'bunker',seconds:2,label:'Read the manifest',dialogue:'ADA: Line forty-one. VALE, ELIAS. Transfer pending. He is alive, Voss - and he is being moved north.'}],
   success:'ADA: A year of silence, and he is a name on a transfer list. VOSS: Then we go north - after the road is ours.'},
  {id:'quiet-road',act:'ACT I · THE SILENCE',title:'The Quiet Road',mapId:'g3-0f1a8b44e',threat:'hardened',
   briefing:'The night heath carries convoy traffic on a strict timetable. Ivo wants a full count: if Elias rides one of those trucks, the timetable itself will tell them which one.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Take the counting post',dialogue:'IVO: The observation post overlooks the convoy lane. Hold it and start counting.'},{type:'secure',at:'field',seconds:10,label:'Secure the timetable handoff',dialogue:'IVO: A courier passes the night’s schedule at the waypoint. Take it intact - every minute matters to them.'},{type:'hold',at:'bunker',seconds:2,label:'Deliver the timetable',dialogue:'IVO: Cross-referenced: the northbound transport runs the night after the next. One night to reach the relay.'}],
   success:'IVO: The road runs on schedule because it must. ADA: Then for once, the timetable is on our side.'},
  {id:'signal-home',act:'ACT I · THE SILENCE',title:'Signal Home',mapId:'g3-002000003',threat:'elite',
   briefing:'The main relay stands in the deep Talwald. Ada will broadcast the valley’s first free transmission from it tonight - and wait for an answer on a knock code only her brother knows.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the main relay',dialogue:'ADA: The main relay is old but honest. Get me to it and I will do the rest.'},{type:'protect',at:'field',asset:'Main relay',seconds:30,label:'Protect the main relay',dialogue:'ADA: Broadcasting. If Elias can hear me, he will answer with the knock code. Keep the mast standing while I listen.'},{type:'defend',seconds:45,label:'Hold until the answer comes',dialogue:'VOSS: They know what she is doing. Hold the bunker until the transmission ends.'}],
   success:'ADA: Three knocks, then two. That is our childhood code. VOSS: Then we have a brother to bring home - and a convoy to catch.'},
  {id:'supply-line',act:'ACT I · THE SILENCE',title:'The Relief Convoy',mapId:'g3-0e6d5c492',threat:'elite',boss:'riegel',finale:true,
   briefing:'The blackout exposed a relief convoy trapped in the forest. Medic Sera Malik is with them. Voss orders the supplies recovered, but Sera refuses to leave anyone behind.',
   stages:[{type:'hold',at:'field',seconds:4,label:'Recover the medical supplies',dialogue:'SERA: The northern crate has antibiotics. Without it, the wounded will not survive the night.'},{type:'hold',at:.55,seconds:4,label:'Find the convoy survivors',dialogue:'SERA: Thank you. The drivers are sheltering on the southern road; we leave together.'},{type:'escort',at:'bunker',seconds:3,label:'Escort the convoy survivors',dialogue:'SURVIVORS: We can walk. Keep the enemy away and we will follow you.'}],
   success:'SERA: Everyone made it. One of the drivers found sealed orders in an enemy truck: TIDELOCK. Ivo, tell me that is not the dam.'},
  {id:'intercept',act:'ACT II · THE FLOOD',title:'Orders in the Ashes',mapId:'g3-0f1bbcd88',threat:'elite',
   briefing:'The orders are incomplete. An enemy dispatch unit is moving through the ruined outpost with the rest. Break its escort, recover the case, and learn what Tidelock means before the next transmission.',
   stages:[{type:'eliminate',count:8,label:'Break the dispatch escort',dialogue:'VOSS: Clear the escort. We need the case intact, not another crater.'},{type:'hold',at:.3,seconds:4,label:'Recover the dispatch case',dialogue:'ADA: Escort is broken. I see the case at the junction—move in.'},{type:'hold',at:'bunker',seconds:2,label:'Deliver the orders',dialogue:'IVO: The seal is marked TIDELOCK. Bring it back; I can break the cipher.'}],
   success:'IVO: Tidelock opens the floodgates and drowns the valley road. The order is signed by Commander Rook. The evacuation has to move now.'},
  {id:'high-water',act:'ACT II · THE FLOOD',title:'High Water',mapId:'g3-000000005',threat:'elite',
   briefing:'The river is rising weeks early. A village is cut off behind the flooded road, and Rook’s pioneer squads are already wiring the dyke - blowing it would drown the resistance’s last supply line and everyone still waiting on the upper floors.',
   stages:[{type:'hold',at:.55,seconds:5,label:'Reach the cut-off village',dialogue:'SERA: The water took the road behind them. The villagers are on the school’s upper floor - get there before the river does.'},{type:'secure',at:'field',seconds:8,label:'Clear the dyke approach',dialogue:'VOSS: Rook’s pioneers are wiring the dyke. Clear them off it - that wall is all that keeps the marsh out.'},{type:'escort',at:'bunker',seconds:4,label:'Walk the villagers to the high road',dialogue:'VILLAGERS: We can carry the children. Keep the water and the soldiers off our backs.'}],
   success:'SERA: Everyone is across and the dyke holds - for now. Rook will not forget who stopped his demolition. IVO: Neither will the river. It comes back with the thaw.',},
  {id:'ward-line',act:'ACT II · THE FLOOD',title:'Ward Line',mapId:'g3-000000007',threat:'elite',
   briefing:'The city hospital’s generator is down to fumes. A fuel convoy must cross the occupied streets before dark - and Rook’s street patrols know exactly which road it has to take.',
   stages:[{type:'protect',at:'field',asset:'Fuel skid',seconds:22,label:'Protect the fuel skid',dialogue:'SERA: The fuel skid has to stay whole. One burst hose and the operating theatre goes dark.'},{type:'hold',at:.4,seconds:5,label:'Hold the canal crossing',dialogue:'VOSS: The canal crossing is the only way east. Hold it open until the convoy is through.'},{type:'escort',at:'bunker',seconds:4,label:'Walk the fuel to the hospital wing',dialogue:'SERA: Slow and steady. The patients are already gathered on the stairs, waiting for the light.'}],
   success:'SERA: The generator is humming. Tonight the theatre has power and every name on my list is still written in ink - not on a casualty board.',},
  {id:'bridge',act:'ACT II · THE FLOOD',title:'Hold the Bridge',mapId:'g3-0f519f70a',threat:'elite',
   briefing:'The evacuation is crossing the only bridge out of the valley. Rook’s advance guard is closing in. Secure the approach long enough for Sera’s convoy to cross; enemies near the position will contest it.',
   stages:[{type:'secure',at:.3,seconds:12,label:'Secure the bridge approach',dialogue:'VOSS: Hold the approach. If the enemy reaches your position, clear it before the convoy moves.'},{type:'defend',seconds:30,label:'Cover the evacuation',dialogue:'SERA: First truck is across. There are children in the second—give us a little longer.'},{type:'hold',at:'bunker',seconds:2,label:'Confirm the evacuation',dialogue:'SERA: Last truck is clear. Return to command and confirm the count.'}],
   success:'SERA: Everyone on my list is across. ADA: I intercepted Rook: “The bridge was never the target.” Ivo, what else feeds the dam?'},
  {id:'the-count',act:'ACT II · THE FLOOD',title:'The Count',mapId:'g3-000000001',threat:'elite',
   briefing:'After the bridge, Sera’s count is one name short: a driver turned back into the night marsh for a family that was never on the manifest. He is still out there - and so are the patrols hunting him.',
   stages:[{type:'eliminate',count:10,label:'Break the night patrol',dialogue:'VOSS: Their night patrol is hunting him with dogs and flares. Break it before it finds him first.'},{type:'hold',at:.5,seconds:5,label:'Find the driver’s truck',dialogue:'VOSS: Axle-deep in the bog - headlights on, doors open. He is close.'},{type:'escort',at:'bunker',seconds:4,label:'Bring the driver and the family home',dialogue:'DRIVER: I could not leave them behind. I know what the list says. Take us back.'}],
   success:'SERA: The count is even again - and tonight it grew by three. A driver, a mother, a child. That is the whole point of the list.',},
  {id:'dead-air',act:'ACT II · THE FLOOD',title:'Dead Air',mapId:'g3-0afd9d5ab',threat:'elite',
   briefing:'Ivo traces the second signal into the flooded marsh. Ada offers to operate a portable receiver from the field, knowing Rook can hear her. Protect the receiver while she locates the dam’s control frequency.',
   stages:[{type:'hold',at:'field',seconds:4,label:'Set up the receiver',dialogue:'ADA: This receiver will draw attention. I need a clean position and enough time to listen.'},{type:'protect',at:'field',asset:'Receiver',seconds:22,label:'Protect Ada’s receiver',dialogue:'ADA: I have a carrier signal. Do not let them reach the receiver while I isolate it.'},{type:'hold',at:'bunker',seconds:2,label:'Return the frequency',dialogue:'ADA: Found it. The control channel comes from the northern ice station.'}],
   success:'ROOK: You can stop the gate or save your people. You cannot do both. VOSS: He is trying to split us. We go north together.'},
  {id:'ice-run',act:'ACT II · THE FLOOD',title:'Ice Run',mapId:'g3-000000008',threat:'elite',
   briefing:'Medicine for the northern stations has to cross the pass before it closes for the winter. The convoy drives blind through the white, and Rook’s spotters are already dug in along the ridge.',
   stages:[{type:'hold',at:.3,seconds:5,label:'Lead the convoy into the white',dialogue:'IVO: Stay ahead of the lead truck. In the whiteout they follow your tracks or nothing at all.'},{type:'protect',at:'field',asset:'Medicine sledge',seconds:25,label:'Protect the medicine sledge',dialogue:'SERA: The sledge must not be hit. Six stations are holding their winter on this run.'},{type:'hold',at:'bunker',seconds:4,label:'See the convoy over the ridge',dialogue:'VOSS: One more ridge. Do not let them take the last stretch from us.'}],
   success:'IVO: The convoy is through and the pass is ours until the thaw. SERA: Six stations will see spring. The list grows shorter when the north holds.',},
  {id:'white-noise',act:'ACT II · THE FLOOD',title:'White Noise',mapId:'g3-006bc5304',threat:'elite',timeLimit:125,
   briefing:'The northern ice station transmits a short authorization window. Reach its equipment before it closes and bring Ivo the key. The clock runs only while a wave is active; do not waste the opening.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the ice station',dialogue:'IVO: The station cycles its authorization key. We have one window before it changes.'},{type:'secure',at:'field',seconds:8,label:'Secure the transmitter',dialogue:'ADA: I can read the key, but enemies near the transmitter are corrupting the signal.'},{type:'hold',at:'bunker',seconds:2,label:'Return with the key',dialogue:'IVO: That is the key. Get it back before the window closes.'}],
   success:'IVO: The key works, but there are two locks. One is at the power substation. The other is in a city Rook has already occupied.'},
  {id:'cold-start',act:'ACT II · THE FLOOD',title:'Cold Start',mapId:'g3-000000009',threat:'elite',
   briefing:'A winter lock chokes the frozen rail junction: Rook’s garrison holds the switch house and the north line with it. Beyond the far track, Ada photographs a prison transport rolling north through the snow.',
   stages:[{type:'secure',at:'field',seconds:8,label:'Take the switch house',dialogue:'VOSS: The switch house is the lock on the whole junction. Take it and the north line opens.'},{type:'eliminate',count:12,label:'Break the garrison reserve',dialogue:'VOSS: Their reserve is coming across the ice. Break it before it digs in around the switches.'},{type:'hold',at:'bunker',seconds:5,label:'Hold the junction through the night',dialogue:'ADA: I have the transport on film - faces, numbers, everything. Hold the junction so it reaches Voss.'}],
   success:'ADA: The junction is ours and the film is out. Somewhere on that train is a car with Elias’s name on it - and now we know which one.',},
  {id:'long-switch',act:'ACT II · THE FLOOD',title:'The Long Switch',mapId:'g3-0935170bb',threat:'veteran',boss:'kolt',finale:true,
   briefing:'The dam’s first lock depends on a remote substation in the scorched scrubland. Ivo must reroute power without cutting the hospital’s supply. Secure the junctions and defend the transformer while he works.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Open the power junction',dialogue:'IVO: The hospital and the dam share this line. Pull the wrong switch and Sera loses her patients.'},{type:'secure',at:'field',seconds:10,label:'Secure the switching yard',dialogue:'SERA: I have the lights for now. Clear the yard so Ivo can reroute the line.'},{type:'protect',at:'field',asset:'Transformer',seconds:25,label:'Protect the transformer',dialogue:'IVO: Reroute in progress. If they destroy the transformer, the hospital goes dark.'}],
   success:'SERA: The lights stayed on. IVO: First lock is isolated. The second key belongs to the city’s captured controller, Nia Reyes.'},
  // Act III opens inside the occupied city: the paper war for Nia's gate
  // plans, and the forge where the original timetable survived the occupation.
  {id:'paper-war',act:'ACT III · THE LAST LIGHT',title:'Paper War',mapId:'g3-00000000b',threat:'veteran',
   briefing:'Rook’s censors are burning the city registries shelf by shelf. Nia’s original gate plans are filed in the records office—and so is the automation order that carries Ivo’s own signature. Fight through to the archive before the censors reach it.',
   stages:[{type:'eliminate',count:10,label:'Break the censor escort',dialogue:'IVO: The records office sits behind that escort. Every hour we lose is another shelf they burn.'},{type:'hold',at:'field',seconds:5,label:'Search the records office',dialogue:'IVO: Nia’s gate plans… and here, under A-7, section three: my signature. I signed the automation. I never read it.'},{type:'escort',at:'bunker',seconds:3,label:'Escort the plans to command',dialogue:'VOSS: The plans come with us, and so does the truth. Get them to the command vehicle.'}],
   success:'IVO: The plans are safe—and so is the confession. NIA: Then my gate can still be stopped, if we reach the original timetable. AMBROSE: Then you must come to the forge.'},
  {id:'the-mentor',act:'ACT III · THE LAST LIGHT',title:'The Mentor',mapId:'g3-00000000c',threat:'veteran',
   briefing:'Ivo’s old master Ambrose hid the original timetable inside the city forge before the occupation. Rook’s inspection controllers are closing in on the workshop. Reach the forge and bring the timetable out before they arrive.',
   stages:[{type:'secure',at:'field',seconds:10,label:'Secure the forge approach',dialogue:'AMBROSE: Ivo’s apprentice work still sits on my bench. Tell him: the forge stands while it stands.'},{type:'protect',at:'field',asset:'Forge fire',seconds:20,label:'Protect the forge fire',dialogue:'AMBROSE: The timetable is behind the firebrick. Keep their controllers off my back while I open the wall.'},{type:'escort',at:'bunker',seconds:3,label:'Escort Ambrose and the timetable out',dialogue:'IVO: Master, you should have burned it. AMBROSE: A schedule is a promise, Ivo. You taught me that. Now correct yours.'}],
   success:'AMBROSE: The original timetable—without it, Rook cannot stamp his war any further. IVO: Then we take it into the city. NIA: And I will show you where my gate still answers to it.'},
  {id:'city-of-glass',act:'ACT III · THE LAST LIGHT',title:'A City Under Glass',mapId:'g3-0d891921a',threat:'veteran',
   briefing:'The occupied industrial city is full of broken sightlines and patrols. Find Nia Reyes before Rook moves her. She designed the second lock; she also knows why he believes flooding the valley is necessary.',
   stages:[{type:'eliminate',count:10,label:'Break the prison escort',dialogue:'VOSS: Clear the escort, then reach the holding site. Nia is our only way into the second lock.'},{type:'hold',at:'field',seconds:5,label:'Free Nia Reyes',dialogue:'NIA: Rook says the dam will fail unless he opens it. He is wrong—but the gate is already damaged.'},{type:'escort',at:'bunker',seconds:3,label:'Escort Nia to command',dialogue:'NIA: Keep them off me. I can prove the gate can be stabilized without flooding the valley.'}],
   success:'NIA: Rook was ordered to abandon the valley. He chose to flood it instead of risking his own people. The gate can still be stopped, but someone must hold the control line.'},
  {id:'workshop-of-ghosts',act:'ACT III · THE LAST LIGHT',title:'Workshop of Ghosts',mapId:'g3-00000000d',threat:'veteran',
   briefing:'Rook answers the loss of the timetable with a conversion order: Ambrose’s forge is to be retooled for war production. Sabotage the conversion while the precision bench still runs—once it is torn out, the city’s workshops follow.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Hold the forge gates',dialogue:'AMBROSE: His engineers are at the gates. The conversion crew works fast—keep them off the floor.'},{type:'protect',at:'field',asset:'Precision bench',seconds:22,label:'Protect the precision bench',dialogue:'IVO: The bench is the heart of the forge. While it runs, the conversion cannot start—and my corrections can be machined.'},{type:'defend',seconds:35,label:'Hold until the conversion is undone',dialogue:'VOSS: The crews are falling back. Hold the yard until every machine is safe.'}],
   success:'AMBROSE: The forge is still a forge. IVO: And it machines more than parts—the gate braces for Nia’s line are ready. NIA: Then we take the marsh control line.'},
  {id:'night-shift',act:'ACT III · THE LAST LIGHT',title:'Night Shift',mapId:'g3-00000000e',threat:'veteran',
   briefing:'The city’s workers lay down their tools: without their hands, Rook’s conversion orders are paper. He answers with hired strikebreakers. Protect the strike column—the marsh road must stay open for the night march.',
   stages:[{type:'escort',at:'bunker',seconds:3,label:'March with the strike column',dialogue:'WORKERS: The whole night shift is out. Walk with us—they will not touch a column this loud.'},{type:'secure',at:'field',seconds:10,label:'Secure the marsh road gate',dialogue:'VOSS: The gate is the bottleneck. Clear it and the column reaches the marsh before dawn.'},{type:'hold',at:'field',seconds:5,label:'Hold the road until the column is through',dialogue:'SERA: Your hospital rows are filling with their families. Hold the road—everyone gets through tonight.'}],
   success:'VOSS: The column is through and the night shift holds. NIA: The marsh control line is waiting, and Ada’s evidence with it. ADA: One broadcast left—make it count.'},
  {id:'tidelock',act:'ACT III · THE LAST LIGHT',title:'Tidelock',mapId:'g3-04e114f5c',threat:'legendary',
   briefing:'Nia knows a way into the dam network through a marsh control line. Ada will broadcast the evidence to Rook’s troops while you isolate the gate. The receiver must survive long enough to send it.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Connect the control line',dialogue:'NIA: The gate is under strain. If we cut power too quickly, it will open by itself.'},{type:'protect',at:'field',asset:'Broadcast relay',seconds:30,label:'Protect the broadcast relay',dialogue:'ADA: This is Ada Vale. The valley is still occupied by civilians. Rook’s orders will drown them. Please listen.'},{type:'secure',at:'field',seconds:10,label:'Isolate the gate control',dialogue:'NIA: Some of his units are standing down. Clear the control position; I can isolate the gate.'}],
   success:'ROOK: My orders were to save my troops. VOSS: Then help us save everyone. ROOK: The final override is at the industrial tower. I cannot stop it from here.'},
  {id:'the-confession',act:'ACT III · THE LAST LIGHT',title:'The Confession',mapId:'g3-000000012',threat:'legendary',
   briefing:'In Ada’s broadcast, Ivo confesses what the valley has suspected: the timetable that keeps the war running is his work. Some fighters want him cast out; the council votes tonight. Hold the assembly hall while the valley decides.',
   stages:[{type:'eliminate',count:10,label:'Break the recall squad',dialogue:'VOSS: Rook sent a squad to break the vote before it is counted. They do not reach the hall.'},{type:'hold',at:'field',seconds:5,label:'Guard the assembly hall',dialogue:'IVO: I wrote the schedule that floods this valley. I will not hide behind a correction. Judge me — but let the correction run.'},{type:'secure',at:'field',seconds:10,label:'Secure the counting yard',dialogue:'SERA: The hall holds its breath. Keep the yard clear until every hand is raised and counted.'}],
   success:'IVO: The council keeps the correction—and its author. SERA: Nobody gets crossed off this list, not even the man who wrote the timetable. ADA: And while the valley argued, I found where Rook’s orders really come from.'},
  {id:'the-signal-above',act:'ACT III · THE LAST LIGHT',title:'The Signal Above',mapId:'g3-000000013',threat:'legendary',
   briefing:'While the valley celebrates the stabilized gate, Ada traces Rook’s command chain. Every order arrived as a relay from ONE source — at the end of the old supply road. Raise the direction finder and follow the beam: the Iron Path.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Raise the direction finder',dialogue:'ADA: One frequency, relayed through every order Rook ever gave. I need the finder up and steady.'},{type:'protect',at:'field',asset:'Direction finder',seconds:25,label:'Protect the direction finder',dialogue:'ADA: The trace is running. If they smash the finder, the chain goes cold and we start over.'},{type:'hold',at:'field',seconds:5,label:'Confirm the relay chain',dialogue:'ADA: Bearing confirmed. The orders come from the junction at the end of the old supply road. The Iron Path is real — and it runs itself.'}],
   success:'ADA: Every order, every timetable, every convoy: one source. IVO: Then the timetable I signed is still running up there. NIA: And it will not stop unless we climb to it.'},
  {id:'counterfeit-key',act:'ACT III · THE LAST LIGHT',title:'Counterfeit Key',mapId:'g3-000000014',threat:'legendary',
   briefing:'The tower’s reader checks the key it is given. From Nia’s old plans, Ivo machines a counterfeit that lies to it — close enough to open the outer circuit, wrong enough to keep the override from arming. The forging has to happen under fire.',
   stages:[{type:'hold',at:'field',seconds:4,label:'Calibrate the cutting bench',dialogue:'IVO: Tolerance is everything. Two tenths off and the reader eats the key — and the tower with it.'},{type:'secure',at:'field',seconds:10,label:'Secure the workshop courtyard',dialogue:'VOSS: Rook knows what a cutting bench in the district means. Hold the courtyard while Ivo works.'},{type:'protect',at:'field',asset:'Counterfeit key',seconds:20,label:'Protect the counterfeit key',dialogue:'NIA: The blank is cutting. If their saboteurs reach the bench, there is no second blank — guard it with everything.'}],
   success:'IVO: The counterfeit is cut — a key that opens the door and lies to the lock. NIA: Then we go up the tower. ADA: One last transmission. For all of us.'},
  {id:'last-transmission',act:'ACT III · THE LAST LIGHT',title:'The Last Transmission',mapId:'g3-06be302d5',threat:'legendary',boss:'a7',finale:true,
   briefing:'The automatic override is counting down. With Sera’s evacuation clear and Nia at the gate, you must reach the industrial tower and break the last connection. Rook’s remaining loyalists are still advancing.',
   stages:[{type:'hold',at:'entry',seconds:5,label:'Access the tower circuit',dialogue:'NIA: I can stabilize the gate only if you open the tower circuit. Ada will talk you through it.'},{type:'hold',at:'field',seconds:5,label:'Disable the override',dialogue:'ADA: Follow the blue cable. For my brother, and everyone still down there—pull it.'},{type:'defend',seconds:50,label:'Hold until the gate stabilizes',dialogue:'NIA: Override disconnected. The gate needs time to settle. Hold the bunker; do not give them the line back.'},{type:'hold',at:'bunker',seconds:2,label:'Confirm the road is open',dialogue:'SERA: The water is falling. Come home; we will count everyone together.'}],
   success:'VOSS: The gate is secure. The valley is still standing. ADA: My brother never heard the signal return, but the people he saved did. SERA: The road is open. This time, everyone gets a chance to go home.'},
  // Act IV - THE LONG WINTER. The valley road dies in the snow; Nia's old
  // building pass climbs toward the source, and the high moor partisans of
  // Wren decide whether the resistance survives the cold.
  {id:'the-pass',act:'ACT IV · THE LONG WINTER',title:'The Pass',mapId:'g3-000000015',threat:'veteran',
   briefing:'The valley road becomes indefensible in winter. Nia’s old building pass is the only route left toward the source — and it climbs straight through the enemy’s weather stations. Take the lower mountain station and open the climb.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Take the lower station',dialogue:'NIA: The pass road is mine from before the war. Take the lower station and the climb opens.'},{type:'secure',at:'field',seconds:10,label:'Secure the pass road',dialogue:'VOSS: Weather patrols sweep the switchbacks. Clear them so the column can climb.'},{type:'escort',at:'bunker',seconds:3,label:'Escort the climbers to the pass',dialogue:'WREN: My scouts will meet you at the top. Bring them up alive.'}],
   success:'NIA: The lower station is ours — the climb stands open. WREN: And up here the moor keeps its own calendar. Welcome to the long winter.'},
  {id:'wrens-fire',act:'ACT IV · THE LONG WINTER',title:'Wren’s Fire',mapId:'g3-000000016',threat:'veteran',
   briefing:'Wren’s high-moor partisans strike an enemy fuel depot. Earn their trust: hold the moor gate while her people load the sleds — and burn whatever they leave behind.',
   stages:[{type:'eliminate',count:10,label:'Break the depot guard',dialogue:'WREN: The guard is thin but armored. Open it, and the depot is ours for an hour.'},{type:'secure',at:'field',seconds:10,label:'Hold the moor gate',dialogue:'WREN: My people load everything worth carrying. The gate is your problem until the sleds move.'},{type:'defend',seconds:30,label:'Hold until the sleds are out',dialogue:'VOSS: Whatever burns, burns. We hold the gate until the last sled clears the moor.'}],
   success:'WREN: Depot empty, barracks burning — the moor remembers us now. VOSS: And the road north remembers you too. WREN: It should. It is watched.'},
  {id:'frozen-relay',act:'ACT IV · THE LONG WINTER',title:'Frozen Relay',mapId:'g3-000000017',threat:'veteran',
   briefing:'A warm-line relay of the Iron Path stands intact in the snow. Take it without damaging it and listen live: the orders arriving on the schedule are signed by nobody — the dispatch sends itself.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Thaw the relay lock',dialogue:'IVO: The lock is frozen shut — literally. Cut the heat trace and the door opens without a shot.'},{type:'protect',at:'field',asset:'Wiretap rig',seconds:22,label:'Protect the wiretap rig',dialogue:'ADA: The rig records everything on the line. If they smash it, we go deaf mid-sentence.'},{type:'hold',at:'field',seconds:5,label:'Confirm the self-sent orders',dialogue:'ADA: Listen: the dispatch is issuing orders with no author. The timetable gives the commands now. It runs itself.'}],
   success:'ADA: Orders with no signature, on schedule, to the minute. IVO: My correction has to reach the stamp — or nothing changes. NIA: Then we climb higher.'},
  {id:'the-work-camp',act:'ACT IV · THE LONG WINTER',title:'The Work Camp',mapId:'g3-000000018',threat:'veteran',
   briefing:'A winter labor camp drives prisoners to road repairs on the pass. Break it open — and a whisper comes out with the first freed men: a "Vale" has been moved to the main junction.',
   stages:[{type:'eliminate',count:10,label:'Break the camp guard',dialogue:'WREN: Watch towers first. The faster the guard dies, the fewer prisoners freeze in the open.'},{type:'hold',at:'field',seconds:5,label:'Open the stockade',dialogue:'PRISONERS: The lock is old but the cold welded it shut. Buy us a minute.'},{type:'escort',at:'bunker',seconds:3,label:'Escort the freed men out',dialogue:'VOSS: Every man out, then we burn the ledgers. Rook counts his slaves; we count his losses.'}],
   success:'PRISONERS: A "Vale" — they moved him to the main junction, special transport. ADA: Elias. Alive, and on schedule. IVO: Then the timetable is our map now.'},
  {id:'avalanche',act:'ACT IV · THE LONG WINTER',title:'Avalanche',mapId:'g3-000000019',threat:'veteran',
   briefing:'Rook’s vanguard pushes over the moor. Wren’s answer is the mountain itself: blasting crews climb to the rail half to cut the slope loose. Protect them on the way up — the vanguard must not reach the charges.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Cover the blasting crews',dialogue:'WREN: My crews climb with the charges. Hold the road below so nothing follows them up.'},{type:'protect',at:'field',asset:'Blasting crew',seconds:25,label:'Protect the blasting crew',dialogue:'WREN: They place, we hold. If the vanguard reaches them, the mountain stays standing and we do not.'},{type:'secure',at:'field',seconds:10,label:'Secure the slope fuse point',dialogue:'VOSS: The slope is wired. Take the fuse point and hold it until Wren gives the word.'}],
   success:'WREN: Fire, in the name of everyone they buried up here. VOSS: The road below is gone — and Rook’s vanguard with it. The mountain keeps our secret.'},
  {id:'the-long-span',act:'ACT IV · THE LONG WINTER',title:'The Long Span',mapId:'g3-00000001a',threat:'legendary',
   briefing:'Nia’s proudest bridge carries the Iron Path’s heaviest supply trains. It has to fall: protect the demo charges at the piers until they fire — and hold the span while the detonators run their line.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Take the pier access',dialogue:'NIA: I built this bridge to carry trains, not armies. Open the pier access.'},{type:'protect',at:'field',asset:'Demo charges',seconds:25,label:'Protect the demo charges',dialogue:'NIA: The charges sit at the piers. Their sappers will try to cut them — keep every charge alive.'},{type:'defend',seconds:45,label:'Hold until the span falls',dialogue:'VOSS: The detonators are running. Hold the span — nothing crosses, nothing gets through.'}],
   success:'NIA: It falls straight, into the gorge, where I drew it. My bridge, my hand on the switch. WREN: And the Iron Path just lost its heaviest road.'},
  {id:'rooks-trail',act:'ACT IV · THE LONG WINTER',title:'Rook’s Trail',mapId:'g3-00000001b',threat:'legendary',
   briefing:'Burned-out way stations mark Rook’s climb: he is scorching the relay chain upward — proof for his garrison, bait for the resistance. His rearguard waits in the ash. Hold them back.',
   stages:[{type:'eliminate',count:10,label:'Break the rearguard',dialogue:'VOSS: His rearguard is dug into the ash. Dig them out.'},{type:'hold',at:'field',seconds:5,label:'Hold the burned station',dialogue:'ADA: The relays he burned still echo. He is heading for the storm gate — to lock it behind him.'},{type:'hold',at:'bunker',seconds:3,label:'Keep the trail closed',dialogue:'WREN: The trail stays ours. Let him climb alone.'}],
   success:'ROOK: The junction is mine again. Whoever follows me dies in the snow. VOSS: Then we follow. NIA: Through the gate he is trying to close.'},
  {id:'iron-yard',act:'ACT IV · THE LONG WINTER',title:'The Iron Yard',mapId:'g3-00000001c',threat:'legendary',
   briefing:'In the mountain rail yard the Iron Path changes its trains — and stamps the winter timetable. Ivo’s counter-timetable must go into the punch machine before the stamp run ends.',
   stages:[{type:'secure',at:'field',seconds:10,label:'Secure the punch hall',dialogue:'IVO: The punch hall stamps every convoy of the winter. Take it, and we stamp ours.'},{type:'protect',at:'field',asset:'Punch machine',seconds:25,label:'Protect the punch machine',dialogue:'IVO: My counter-timetable feeds the machine now. If they wreck it, the winter runs on Rook’s schedule.'},{type:'defend',seconds:35,label:'Hold until the stamp run ends',dialogue:'VOSS: Hold the yard until the last card is stamped and dispatched.'}],
   success:'IVO: The winter timetable carries my correction now — every convoy of the Iron Path reads it. ADA: Including the one carrying my brother.'},
  {id:'the-second-list',act:'ACT IV · THE LONG WINTER',title:'The Second List',mapId:'g3-00000001d',threat:'legendary',
   briefing:'Sera’s pass hospital nurses partisans and prisoners alike. The junction’s answer is bombardment: bring the stretcher columns into the old gallery before the guns find their range.',
   stages:[{type:'escort',at:'bunker',seconds:3,label:'Bring the stretcher columns in',dialogue:'SERA: The columns move at walking pace — that is the pace of the wounded. Walk with them.'},{type:'protect',at:'field',asset:'Litter train',seconds:22,label:'Protect the litter train',dialogue:'SERA: The gallery mouth is close and the guns are closer. Keep the sky off my patients.'},{type:'secure',at:'field',seconds:10,label:'Secure the gallery mouth',dialogue:'VOSS: The gallery takes them all. Then we seal the mouth behind the last stretcher.'}],
   success:'SERA: Every name on my second list is under stone and safe. VOSS: And the mountain hospital holds. WREN: The winter is long — but so are we.'},
  {id:'storm-gate',act:'ACT IV · THE LONG WINTER',title:'The Storm Gate',mapId:'g3-00000001e',threat:'legendary',boss:'zugsmeister',finale:true,
   briefing:'Rook has slammed the storm gate behind him: "The junction is mine again. Whoever follows me dies in the snow." Nia blew up her own bridge to cut his road short — take the mountain gate in the blizzard, while the starved garrison falters, and the valley beyond fills with the lights of the main junction.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Take the gate approach',dialogue:'NIA: My bridge bought us this road. The storm gate is the last wall before the junction — take its approach in the blizzard.'},{type:'eliminate',count:10,label:'Break the gate garrison',dialogue:'WREN: Starving, frozen, and still on the wall. Break them before the storm breaks us.'},{type:'secure',at:'field',seconds:10,label:'Secure the storm gate',dialogue:'VOSS: The gatehouse is ours to open. Clear it and keep it clear — nothing closes that door behind us.'},{type:'defend',seconds:50,label:'Hold until the gate falls',dialogue:'IVO: The last thing down this pass is not a convoy. It is him — the Zugsmeister. Hold until the gate mechanism finishes.'}],
   success:'NIA: The gate falls open! VOSS: And the valley beyond is awake with lights — the junction, closer than any map ever showed. WREN: The long winter is over. The iron path begins.'},
  {id:'the-descent',act:'ACT V · THE IRON PATH',title:'The Descent',mapId:'g3-00000001f',threat:'elite',
   briefing:'Below the storm gate the valley opens: the junction’s shunting yards, lit like a festival, feed the war as if there were none. First contact on the descent — the road is alive, and it does not know you are here.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Take the descent road',dialogue:'NIA: The switchbacks take us down to the yards. Set foot on the descent road and hold it — the valley must not know we are coming.'},{type:'secure',at:'field',seconds:10,label:'Secure the shunting yard',dialogue:'VOSS: The first siding is ours to take. Clear it and keep it clear — this is where the junction marshals its war.'},{type:'hold',at:'bunker',seconds:3,label:'Report the yard lights',dialogue:'ADA: Every switch, every signal, every light — I am mapping them from your position. Bring the report home.'}],
   success:'ADA: The yard map is complete. VOSS: And nobody down there suspects a thing. NIA: Enjoy that. It is the last quiet hour this valley will have.'},
  {id:'dead-timetable',act:'ACT V · THE IRON PATH',title:'Dead Timetable',mapId:'g3-000000020',threat:'legendary',
   briefing:'Ivo’s counter-timetable has to go up on the station clock, where every convoy of the network reads it. One wrong card and every train converges on the resistance — feed the clock, then hold the platform while the network re-learns its schedule.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the station clock',dialogue:'IVO: The clock face is the network’s only truth. We reach it, we rewrite the truth.'},{type:'protect',at:'field',asset:'Station clock',seconds:25,label:'Protect the station clock',dialogue:'IVO: The mechanism is old and honest. Keep their sappers off it while my card goes in.'},{type:'hold',at:'bunker',seconds:3,label:'Confirm the false departure',dialogue:'ADA: The network answers: rerouted, rescheduled, dispersed. The convoys are running away from us now.'}],
   success:'IVO: Every train of the network now reads my correction. VOSS: And the ones that matter are avoiding this valley. WREN: Their own timetable, fighting for us now.'},
  {id:'the-quartermaster',act:'ACT V · THE IRON PATH',title:'The Quartermaster',mapId:'g3-000000021',threat:'legendary',
   briefing:'The junction has fed the war for years out of its vault depots. Crack one open tonight: the resistance eats, the enemy hungers — and a starving garrison makes mistakes.',
   stages:[{type:'eliminate',count:10,label:'Break the depot guard',dialogue:'VOSS: Vault guards, not line infantry. They have never lost a fight. Show them how that feels.'},{type:'hold',at:'field',seconds:5,label:'Open the vault',dialogue:'IVO: Tumblers, not turrets. Give me a minute with the lock and the war eats from our hand tonight.'},{type:'escort',at:'bunker',seconds:3,label:'Escort the supply column',dialogue:'WREN: Sleds and carts, everything they can carry. Walk them out — the winter ends for our people tonight.'}],
   success:'WREN: Full sleds, warm fires, full magazines. VOSS: And somewhere in the junction a quartermaster is counting what he no longer has. SERA: My hospitals will take the rest.'},
  {id:'two-keys',act:'ACT V · THE IRON PATH',title:'Two Keys',mapId:'g3-000000022',threat:'legendary',
   briefing:'Nia’s city key and Ivo’s timetable card open the outer ring of the junction — but the readers learn. Feed the false map first, let the ring defend the wrong gate, and take the real one while it does.',
   stages:[{type:'secure',at:'field',seconds:10,label:'Feed the false map',dialogue:'IVO: The readers pattern-match: last night’s rail, tonight’s ring. Let them read a map of a gate we will not touch.'},{type:'hold',at:'field',seconds:5,label:'Hold the decoy approach',dialogue:'NIA: The ring turns its guns toward the false gate. Keep the pretence alive — noise, light, everything.'},{type:'defend',seconds:40,label:'Hold until the real gate opens',dialogue:'VOSS: Nia’s key turns. The real gate is grinding open — hold the ring until our people are through.'}],
   success:'NIA: The outer ring is open. VOSS: And the junction’s guns are still watching an empty road. ADA: Inside is the core. And inside the core is my brother.'},
  {id:'night-of-lights',act:'ACT V · THE IRON PATH',title:'Night of Lights',mapId:'g3-000000023',threat:'legendary',
   briefing:'Ada hijacks the road’s signal chain and broadcasts the valley’s evidence to every garrison — including Rook’s original order, uncensored: they had left him to die too. Hold the mast while the truth goes out, then hold the yard while the garrisons decide.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Take the signal mast',dialogue:'ADA: The signal chain is the road’s nervous system. One mast, one night, every garrison listening — take it.'},{type:'protect',at:'field',asset:'Signal chain',seconds:30,label:'Protect the broadcast',dialogue:'ADA: Everything the valley suffered goes out tonight on their own frequencies — uncensored, unsigned, undeniable. Keep the chain standing while it transmits.'},{type:'defend',seconds:40,label:'Hold until the garrisons answer',dialogue:'VOSS: Some will fight harder. Some will stop. All of them now know what the road does with its own soldiers — hold until the answers come in.'}],
   success:'ADA: Every garrison on the line has heard it now — including Rook’s own order to abandon his rearguard. VOSS: The junction’s phone lines are burning. WREN: An army that knows it is expendable defends nothing for long.'},
  {id:'the-prison-train',act:'ACT V · THE IRON PATH',title:'The Prison Train',mapId:'g3-000000024',threat:'legendary',
   briefing:'Labor trains roll into the core — Elias Vale is aboard. Take the train in motion: the engine, not the carriages, with Ada’s voice in your ear the whole way. Nobody rides that train to the end of the line tonight.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the running board',dialogue:'ADA: The prison train does not stop — it cannot be stopped. Reach it at the crossing and get aboard.'},{type:'eliminate',count:10,label:'Clear the escort cars',dialogue:'VOSS: Escort cars, roof gunners. Clear them car by car — the passengers are not the enemy tonight.'},{type:'escort',at:'bunker',seconds:3,label:'Bring the train out of the core',dialogue:'ADA: Elias. It is Ada. It has always been Ada. Get my brother off this train.'}],
   success:'ELIAS: Ada? ...I know. I have known since the relay. Take the controls — I ride in the engine now. ADA: Voss — the core. While they still think the train is theirs. Bring us home.'},
  {id:'rooks-line',act:'ACT V · THE IRON PATH',title:'Rook’s Line',mapId:'g3-000000025',threat:'legendary',
   briefing:'Rook pulls every loyal unit into one defence line before the core — the last conventional battle of the war. His address runs on every channel: one man, asking his army to die for a road that already abandoned him.',
   stages:[{type:'eliminate',count:10,label:'Break the defence line',dialogue:'VOSS: One line, every loyal soldier he has left. Break it in the middle and the flanks fold.'},{type:'secure',at:'field',seconds:10,label:'Secure the command post',dialogue:'IVO: His field desk — maps, codes, the last signed order. Take it intact: the core’s doors answer to it.'},{type:'defend',seconds:50,label:'Hold until the line breaks',dialogue:'WREN: His speech is still playing on every channel. Let him finish — then show his army what is left.'}],
   success:'ROOK: Line... withdrawn. All units... withdrawn. VOSS: The last conventional army of the Iron Path is gone. NIA: And behind it: the core. ADA: And behind the core: home.'},
  {id:'the-core',act:'ACT V · THE IRON PATH',title:'The Core',mapId:'g3-000000026',threat:'legendary',
   briefing:'Three operations, one night. Ivo carries the master timetable card into the core’s own slot, Nia opens the outer ring from her old plans — and you break the main knot between them. The heart of the Iron Path beats on a schedule. Tonight the schedule changes.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the core gate',dialogue:'NIA: My plans still open the ring — but only from the inside. Get to the gate while the yard still believes the train was theirs.'},{type:'protect',at:'field',asset:'Override console',seconds:25,label:'Protect the override console',dialogue:'IVO: The core re-checks every card against the master timetable. Keep them off my console while mine becomes the master.'},{type:'secure',at:'field',seconds:10,label:'Secure the ring control',dialogue:'NIA: The ring answers to my hand now. Take the control room — the core’s doors stay open exactly as long as we hold it.'},{type:'defend',seconds:40,label:'Hold while the rewrite spreads',dialogue:'IVO: It propagates switch by switch, west to east. Every dispatch from now on carries my correction — and none of them carries Rook’s authority.'}],
   success:'NIA: The ring is open. The core is ours. IVO: From this minute the Iron Path runs on my timetable — and my timetable says: everyone goes home. ADA: Then only the tower is left, Voss. Bring him the last order.'},
  {id:'last-order',act:'ACT V · THE IRON PATH',title:'The Last Order',mapId:'g3-000000027',threat:'legendary',
   briefing:'The core is taken, but the disposition fights on: its automatic desks keep dispatching loyal convoys against the new timetable. Hold the console until Ivo’s cut is complete and the last loyal wave breaks on its own.',
   stages:[{type:'eliminate',count:10,label:'Stop the dispatch riders',dialogue:'IVO: The desks are mindless — they will keep sending orders until the ink dries. Stop every rider before the gates.'},{type:'protect',at:'field',asset:'Dispatch console',seconds:30,label:'Hold the dispatch console',dialogue:'IVO: My cut goes in line by line. Keep their hands off the console — one edit lost, and the convoys turn again.'},{type:'defend',seconds:60,label:'Break the last loyal wave',dialogue:'VOSS: The desks promised them one more victory. Let them keep that promise — over our line.'}],
   success:'IVO: The line is cut. No desk in this valley will ever issue Rook’s orders again. WREN: Then whoever still fights for him does it for free. VOSS: One tower left — and the man himself.'},
  {id:'homecoming',act:'ACT V · THE IRON PATH',title:'The Homecoming',mapId:'g3-000000028',threat:'legendary',boss:'rook',finale:true,
   briefing:'The signal tower — the last iron in Rook’s hand. His final guard stands on the stair, and above them one window still burns. Break the guard, take the stair, and give the Iron Path its last order. Voss already knows the words.',
   stages:[{type:'hold',at:'entry',seconds:4,label:'Reach the signal tower',dialogue:'ADA: Every light in the junction is ours — except that one. He is waiting for you, Voss. We stay on the line the whole way up.'},{type:'eliminate',count:10,label:'Break the last guard',dialogue:'VOSS: His honour guard — men who followed a road instead of a man. Break them, and the stair stands open.'},{type:'secure',at:'field',seconds:10,label:'Secure the tower stair',dialogue:'WREN: The stair is ours. Whatever happens up there — the tower does not burn tonight.'},{type:'defend',seconds:45,label:'Hold against Rook’s veterans',dialogue:'ROOK: You have taken my line, my yards, my timetable. I still have my hand — and it does not shake. Come and take the tower.'},{type:'hold',at:'bunker',seconds:3,label:'Give the last order',dialogue:'ROOK: I was never given the order to stop. Someone... must give it. VOSS: Then hear it from me: go home, Rook. That is the last order of the Iron Path.'}],
   success:'ROOK: Go home. ...Yes. The road is finished. VOSS: Lay down the pen, old man. The first free convoy rolls at dawn. ELIAS: The freed are boarding — and Ada, I am coming down the mountain with them. ADA: I will keep the line open all the way home.'}
];
// ---------------------------------------------------------------------------
// Anchor resolution. All geometry helpers are pure; the same seed always
// resolves to the same points, so host and client never need to sync stages.
function distanceToSegment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/d)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
function pointAlong(path,t){let total=0;for(let i=1;i<path.length;i++)total+=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);let left=total*Math.max(0,Math.min(1,t));for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],seg=Math.hypot(b.x-a.x,b.y-a.y);if(left<=seg)return {x:a.x+(b.x-a.x)*(left/seg),y:a.y+(b.y-a.y)*(left/seg)};left-=seg;}return {...path[path.length-1]};}
// The first point between two road fractions that stays clear of every pad:
// objective markers must never sit on top of a buildable pad.
function padClearPoint(path,pads,from,to){for(let i=0;i<=24;i++){const p=pointAlong(path,from+(to-from)*i/24);if(pads.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>56))return {x:Math.round(p.x),y:Math.round(p.y)};}return null;}
// Free field spots: the same jittered grid the story map art anchors its
// landmarks to, so scenery and objectives share one visual language.
function fieldSpots(path,pads,bunker,stages){const spots=[];for(let row=0;row<=6;row++)for(let col=0;col<=12;col++){const x=55+col*70+((col*13+row*7)%19)-9,y=52+row*70+((col*5+row*11)%19)-9,p={x,y};if(path.slice(1).some((b,i)=>distanceToSegment(p,path[i],b)<58))continue;if(pads.some(q=>Math.hypot(q.x-x,q.y-y)<60))continue;if(Math.hypot(bunker.x-x,bunker.y-y)<80)continue;if(stages.some(q=>Number.isFinite(q.x)&&Math.hypot(q.x-x,q.y-y)<65))continue;spots.push(p);}return spots;}
function resolveStages(mission){
  const map=getMap(mission.mapId),path=map.path,pads=map.pads,bunker=map.bunker||{x:900,y:400};
  const stages=mission.stages.map(s=>({...s}));
  for(const stage of stages){
    if(stage.at==='bunker')Object.assign(stage,{x:bunker.x,y:bunker.y});
    else if(stage.at==='entry'){
      // Generated roads lead in from outside the field: the entry objective is
      // the first stretch of road that is actually on the map and pad-free.
      let p=null;
      for(let i=0;i<=30&&!p;i++){const c=pointAlong(path,.15*i/30);
        if(c.x>=40&&c.x<=map.width-40&&c.y>=40&&c.y<=map.height-40&&pads.every(q=>Math.hypot(q.x-c.x,q.y-c.y)>56))p=c;}
      p=p||pointAlong(path,.1);
      Object.assign(stage,{x:Math.round(Math.max(40,Math.min(map.width-40,p.x))),y:Math.round(Math.max(40,Math.min(map.height-40,p.y)))});
    }
    else if(typeof stage.at==='number'){const t=stage.at,p=padClearPoint(path,pads,Math.max(0,t-.15),Math.min(1,t+.15))||pointAlong(path,t);Object.assign(stage,{x:Math.round(p.x),y:Math.round(p.y)});}
  }
  // Field spots are shuffled per mission and spread apart, so two protected
  // assets never share one corner of the map.
  const spots=fieldSpots(path,pads,bunker,stages);
  const hash=[...mission.id].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
  const order=spots.map((p,i)=>({p,k:(hash+Math.imul(i+1,2654435761))>>>0})).sort((a,b)=>a.k-b.k).map(e=>e.p);
  // Contested objectives must sit where the road can actually reach them: a
  // protected asset 250px from every enemy is a free stage, and a secure
  // position beyond the contest radius is never contested. Those stages pick
  // a spot inside a contested band (passing enemies can reach, the player can
  // still clear them); other field anchors keep the plain spread rules.
  const roadDistance=p=>{let m=1e9;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy,t=l2?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2)):0;m=Math.min(m,Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy));}return m;};
  let fallback=0;
  for(const stage of stages)if(stage.at==='field'){
    const band=stage.type==='protect'?[80,95]:stage.type==='secure'?[58,105]:null;
    const inBand=q=>{if(!band)return true;const d=roadDistance(q);return d>=band[0]&&d<=band[1];};
    const spread=q=>stages.every(s=>!Number.isFinite(s.x)||Math.hypot(s.x-q.x,s.y-q.y)>=180);
    // Third try: a widened band before giving up on the road entirely. Some
    // generated fields have no free spot at all inside the strict ring (the
    // 15px-wide protect band can be empty on a marsh map); a slightly wider
    // ring keeps the stage contestable instead of dropping it 500px from the
    // nearest enemy. Protect stays under the 100px enemy reach, secure under
    // the 110px contest radius the balance suite asserts. The widened ring also
    // accepts the balance suite's own 90px marker floor instead of the full
    // 180px spread - on a small marsh field the only contestable spot can sit
    // near the bunker the escort stage walks to.
    const relaxed=q=>{if(!band)return true;const d=roadDistance(q);return d>=band[0]-15&&d<=(stage.type==='protect'?99:110);};
    const nearSpread=q=>stages.every(s=>!Number.isFinite(s.x)||Math.hypot(s.x-q.x,s.y-q.y)>=90);
    const p=order.find(q=>spread(q)&&inBand(q))||(band?order.find(inBand):null)||(band?order.find(q=>nearSpread(q)&&relaxed(q)):null)||order.find(spread)||order[fallback++%Math.max(1,order.length)]||{x:Math.round(path[0].x),y:Math.round(path[0].y)};
    Object.assign(stage,{x:p.x,y:p.y});
  }
  for(const stage of stages)delete stage.at;
  return stages.map(s=>Object.freeze(s));
}
export const CAMPAIGN=Object.freeze(MISSIONS.map(m=>Object.freeze({...m,stages:Object.freeze(resolveStages(m))})));
// The five-act structure. Acts IV and V ship their missions in later builds;
// an act without missions has no finale index yet and can neither be completed
// nor earn its relic. Region keys map to the campaign-exclusive battlefields.
export const ACTS=Object.freeze([
  {n:1,key:'silence', title:'ACT I · THE SILENCE',     character:'Ada Vale',  region:'talwald',  regionLabel:'Valley Forest', relic:'relic-open-line'},
  {n:2,key:'flood',   title:'ACT II · THE FLOOD',      character:'Sera Malik',region:'marsch',   regionLabel:'Flooded Marsh', relic:'relic-the-list'},
  {n:3,key:'light',   title:'ACT III · THE LAST LIGHT',character:'Ivo Chen', region:'stadt',    regionLabel:'Occupied City', relic:'relic-timetable'},
  {n:4,key:'winter',  title:'ACT IV · THE LONG WINTER',character:'Nia Reyes',region:'pass',     regionLabel:'The Pass',      relic:'relic-blueprint'},
  {n:5,key:'iron',    title:'ACT V · THE IRON PATH',   character:'Rook',     region:'knoten',   regionLabel:'The Junction',  relic:'relic-iron-path'},
].map(a=>Object.freeze(a)));
export function actOf(mission){return ACTS.find(a=>mission?.act===a.title)||null;}
// Index of the act's finale mission (finale:true) in CAMPAIGN order, or -1
// while the act's finale has not shipped yet - even if earlier missions of the
// act already have. Completing past this index completes the act and earns its
// relic, so a partially shipped act can never be completed early.
export function actEndIndex(act){const n=typeof act==='number'?act:act?.n;let end=-1;CAMPAIGN.forEach((m,i)=>{if(actOf(m)?.n===n&&m.finale)end=i;});return end;}
export function actComplete(profile,act){const end=actEndIndex(act);return end>=0&&campaignProgress(profile)>end;}
// A mission's threat decides its difficulty (see campaign-pressure.mjs): tougher
// units, wider surge waves, a smaller bunker and a fixed wave contract, so the
// last three missions expect prestige gear rather than standard kit.
export function campaignThreat(mission){return mission?.threat??'standard';}
export function campaignDifficulty(mission){return threatFor(mission?.threat);}
export function campaignWaveContract(mission){return campaignWaves(mission?.threat);}
// Story progress formats. Inserting act missions renumbers the story, so a
// bare storyProgress number is ambiguous between formats. Every write stamps
// the format (storyCampaign, allowed by the published rules); reads remap
// older formats forward, old mission boundary by old mission boundary, so an
// account never loses an earned act or relic when the story grows. The table
// below maps the twelve-mission story onto the five-act order.
export const STORY_FORMAT=5;
// Format 1 shipped eighteen missions; format 2 grew to twenty-three; formats 3
// and 4 added the city and workshop operations. The last three act-III
// missions slot between the marsh control line and the tower, so an older
// boundary maps to the new index of the very same mission: an account never
// loses an earned act or relic, and the new missions simply count as played
// where they were skipped.
const FORMAT_1_PROGRESS=[0,1,2,3,4,5,6,7,8,9,10,13,15,17,19,20,23,26,30];
const FORMAT_2_PROGRESS=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,23,26,30];
const FORMAT_3_PROGRESS=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,26,30];
const FORMAT_4_PROGRESS=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,30];
const LEGACY_STORY_PROGRESS=[0,1,2,4,10,11,12,13,14,15,16,17,18];
export function campaignProgress(profile){
  const raw=profile?.storyProgress,format=profile?.storyCampaign;
  if(!Number.isInteger(raw)||raw<0)return 0;
  if(Number.isInteger(format)&&format>=STORY_FORMAT)return raw>CAMPAIGN.length?0:raw;
  if(format===4)return raw>27?0:FORMAT_4_PROGRESS[raw]??0;
  if(format===3)return raw>25?0:FORMAT_3_PROGRESS[raw]??0;
  if(format===2)return raw>23?0:FORMAT_2_PROGRESS[raw]??0;
  if(format===1)return raw>18?0:FORMAT_1_PROGRESS[raw]??0;
  if(raw>12)return 0;
  return LEGACY_STORY_PROGRESS[raw];
}
export function campaignMission(id){return CAMPAIGN.find(m=>m.id===id)||null;}
export function campaignAvailable(profile,id){const index=CAMPAIGN.findIndex(m=>m.id===id);return index>=0&&index<=campaignProgress(profile);}
export function completeStory(profile,id){const index=CAMPAIGN.findIndex(m=>m.id===id),progress=campaignProgress(profile);if(!profile||index<0||index>progress)return null;return {...profile,storyProgress:Math.max(progress,index+1),storyCampaign:STORY_FORMAT};}
// Compatibility with old account values and old rules tests; not playable missions.
const LEGACY=[['last-road',5],['pinewood',10],['outpost',15]];
export function completeCampaign(profile,id,wave){const index=LEGACY.findIndex(m=>m[0]===id),progress=Number.isInteger(profile?.campaign)&&profile.campaign>=0&&profile.campaign<=3?profile.campaign:0;if(!profile||index<0||!Number.isSafeInteger(wave)||wave<LEGACY[index][1]||index>progress)return null;return {...profile,campaign:Math.max(progress,index+1)};}
