// Authored cutscene dialogue is presentation only; mission progress remains in campaign.mjs.
const OPENINGS={
'lost-signal':[['VOSS','The whole valley went quiet at 0600. No warning, no explanation.'],['ADA','This is courier Ada Vale. If anyone can hear me, I have the relay key. Please hurry.']],
'pinewood-rescue':[['ADA','That was my brother on the recording. He never leaves anyone behind.'],['VOSS','Then we will not leave his patrol behind either. Move out.']],
'ghost-frequency':[['ADA','The jammer is dead, but the relay chain is still dark. Someone is keeping it that way.'],['VOSS','Then we light it mast by mast. Ada - tell me what you hear.']],
'blackout':[['IVO','The jammer is using our frequencies. Every call we make gives away another position.'],['VOSS','Then we cut it out. Ada, keep a channel open until the charges are set.']],
'ash-market':[['IVO','Salvaged components, no questions asked. The ash market has what the relay chain needs.'],['VOSS','So does Rook. We get there first.']],
'the-list':[['SERA','This is Medic Malik. My hospital is a tent in the marsh, and the reprisal squads know it.'],['VOSS','Then tonight the marsh is ours. No name gets crossed off.']],
'brothers-keeper':[['ADA','A dispatch rider crossed the ice with a manifest in his satchel. Voss - if my brother’s name is on it-'],['VOSS','We bring the satchel home. Whatever it says, we face it together.']],
'quiet-road':[['IVO','The enemy convoys run the heath on a timetable. Timetables can be read - if we take one.'],['VOSS','Then we count their trucks tonight.']],
'signal-home':[['ADA','One relay left: the main mast in the deep forest. Power it and I will broadcast to the whole valley - and if my brother can hear me, he will answer with our childhood code.'],['VOSS','Then we hold that mast until he does.']],
'supply-line':[['SERA','This is Medic Malik:PLACEHOLDER, a broken axle and almost no medicine.'],['VOSS','We are coming. Keep everyone together.']],
'intercept':[['IVO','Tidelock is an old dam protocol. I need the complete order to know what it does.'],['VOSS','The dispatch case comes back intact. Whatever is in it, we face it together.']],
'high-water':[['SERA','This is Medic Malik. The river is a week ahead of the forecasts and a village is cut off behind the flooded road.'],['VOSS','And Rook’s pioneers are already at the dyke with charges. We get there first.']],
'ward-line':[['SERA','My hospital in the city is down to fumes. One convoy of fuel, one road - and Rook knows the road.'],['VOSS','Then we hold it open until the last barrel rolls through.']],
'bridge':[['SERA','The convoy is moving. There are children in the second truck.'],['VOSS','The bridge is yours. We will hold the approach until the last vehicle is clear.']],
'the-count':[['SERA','My count after the bridge is one name short. A driver went back into the marsh for a family that was never on any manifest.'],['VOSS','Then we go back in after him. Nobody is left to the water.']],
'dead-air':[['ADA','Rook is broadcasting somewhere beyond the marsh. I can find him if I take the receiver out.'],['VOSS','He will hear you too. Stay on the line, Ada.']],
'ice-run':[['IVO','Six northern stations, one pass, and a whiteout rolling in behind us. The medicine crosses tonight or not at all.'],['VOSS','Then we drive ahead of the convoy and take the ridge with us.']],
'white-noise':[['IVO','The ice station only opens its authorization window briefly. Once it starts, we cannot stop it.'],['ADA','Then we move fast. I will read the signal from the transmitter.']],
'cold-start':[['ADA','A winter lock has the rail junction frozen shut - and beyond the far track, a prison transport is rolling north. I need the switch house.'],['VOSS','We take it. Ada, get your camera ready.']],
'long-switch':[['SERA','The hospital is running on that same power line. I have people on life support.'],['IVO','I can reroute it. I just need you to keep the transformer standing.']],
'paper-war':[['IVO','The city registries hold Nia’s original gate plans—and the automation order with my signature on it.'],['VOSS','Then we take the records office before the censors burn it. Ivo—whatever is in there, we face it together.']],
'the-mentor':[['IVO','My old master Ambrose hid the original timetable in his forge before the occupation.'],['AMBROSE','And Rook’s controllers are on their way. Tell Ivo: the forge stands while it stands.']],
'city-of-glass':[['VOSS','Nia Reyes designed the second lock. Rook has her in the industrial district.'],['ADA','Then we get her out before his men move her.']],
'workshop-of-ghosts':[['AMBROSE','Rook’s answer is a conversion order: my forge is to make his war.'],['IVO','Then the forge fights back. We hold the floor while the bench still runs.']],
'night-shift':[['WORKERS','The whole night shift lays down its tools tonight. Rook will send his strikebreakers.'],['VOSS','Then we walk beside you. No column gets broken up on our watch.']],
 'tidelock':[['NIA','The gate is damaged, but it can be stabilized. Rook has to hear the truth.'],['ADA','I will tell his soldiers myself. Keep the broadcast relay alive.']],
'the-confession':[['IVO','Tonight the valley decides whether the man who wrote the timetable stays.'],['VOSS','Then the vote happens in a hall that still stands. Nobody breaks it with a squad.']],
'the-signal-above':[['ADA','Every order Rook gave arrived as a relay from one source. I want a bearing on it.'],['VOSS','Then we raise the finder and follow the beam — wherever it ends.']],
'counterfeit-key':[['NIA','The tower’s reader checks the key it is given. So we give it a lie.'],['IVO','A counterfeit that opens the door and refuses the override. One blank, one chance.']],
'last-transmission':[['NIA','The automatic override is still connected. Once it fires, the valley floods.'],['VOSS','One last line to hold. Everyone who made it this far is counting on us.']]
};
const CODAS={
'lost-signal':[['NARRATOR','The road ahead leads into Pinewood, and into the silence left behind.'],['NARRATOR','Somewhere beyond the trees, the patrol is still waiting for an answer.']],
'pinewood-rescue':[['NARRATOR','Ada holds on to the oscillator. It is all her brother could send home.'],['NARRATOR','Grief travels with the living; the warning has to travel farther.']],
'ghost-frequency':[['NARRATOR','In the loop beneath the static, a dead man’s callsign answers.'],['NARRATOR','Ada writes it down twice: once as evidence, once as hope.']],
'blackout':[['NARRATOR','Across the valley, an unseen transmitter answers the explosion.'],['NARRATOR','The resistance has broken the silence, but someone is now listening.']],
'ash-market':[['NARRATOR','The crates change hands in the dark, and the resistance keeps its relay chain.'],['NARRATOR','A prison camp code leaves Ada cold: payments for people.']],
'the-list':[['NARRATOR','The marsh hospital holds. Sera’s list grows by one line.'],['NARRATOR','Somewhere upstream, a name on that list speaks of a manifest.']],
'brothers-keeper':[['NARRATOR','Line forty-one. VALE, ELIAS. Transfer pending.'],['NARRATOR','Hope, delivered like a requisition form.']],
'quiet-road':[['NARRATOR','The timetable names the northbound transport: the night after the next.'],['NARRATOR','For once, the enemy’s own discipline is a weapon.']],
'signal-home':[['NARRATOR','Three knocks, then two. A childhood code no interrogator knows.'],['NARRATOR','The valley hears its first free transmission - and someone answers.']],
'supply-line':[['NARRATOR','The convoy is safe for now'],['NARRATOR','A name on a sealed order can change the fate of everyone on the road.']],
'intercept':[['NARRATOR','Downstream, the evacuation begins against the clock.'],['NARRATOR','The dam is no longer just a landmark. It is a weapon aimed at home.']],
'high-water':[['NARRATOR','The village is on the high road and the dyke still stands.'],['NARRATOR','Somewhere upstream, Rook’s engineers note the delay - and double the next charge.']],
'ward-line':[['NARRATOR','For one night, the operating theatre is the brightest room in the occupied city.'],['NARRATOR','Sera’s list gains no names - and that, too, is a victory.']],
'bridge':[['NARRATOR','Beyond the bridge, the valley remains in danger.'],['NARRATOR','Voss counts each truck. For the people still downstream, the fight is not over.']],
'the-count':[['NARRATOR','Three more names live because one driver turned around.'],['NARRATOR','The list is heavier now - and so is what it stands for.']],
'dead-air':[['NARRATOR','A signal points north. The enemy is listening too.'],['NARRATOR','The receiver falls silent, but the frequency remains.']],
'ice-run':[['NARRATOR','The convoy clears the ridge as the pass closes behind it.'],['NARRATOR','Six stations will see spring. Somewhere north, a prison train keeps its schedule.']],
'white-noise':[['NARRATOR','One key. Two locks. The road to the dam grows shorter.'],['NARRATOR','There is no safe shortcut to the second lock.']],
'cold-start':[['NARRATOR','The junction is ours, the film is out, and the north line runs free.'],['NARRATOR','On the far track, the transport rolls on. Now there is a car number - and a name.']],
'long-switch':[['NARRATOR','In the hospital, the lights remain on. In the occupied city, Nia waits.'],['NARRATOR','The first lock is down without sacrificing the people behind the line.']],
'paper-war':[['NARRATOR','Nia’s plans are safe—so is the file with Ivo’s signature on the automation order.'],['NARRATOR','A signature is not a sentence. Somewhere in the city, an old forge is still lit.']],
'the-mentor':[['NARRATOR','The original timetable leaves its hiding place behind the firebrick—and the master leaves with it.'],['NARRATOR','A schedule is a promise. Now the promise must be rewritten.']],
'city-of-glass':[['NARRATOR','The truth is more complicated than the order. There is still a way to save the valley.'],['NARRATOR','Nia brings more than a key: she brings a choice.']],
'workshop-of-ghosts':[['NARRATOR','The conversion order dies in the forge—and the bench keeps machining its careful parts.'],['NARRATOR','A workshop that refuses the war is worth more than a depot that burns.']],
'night-shift':[['NARRATOR','The night shift marches, loud and unbroken, and the marsh road stays open behind it.'],['NARRATOR','Paper orders cannot retool a city whose hands stay closed.']],
 'tidelock':[['NARRATOR','Rook’s soldiers have heard Ada. Now the tower must be reached.'],['NARRATOR','The broadcast has reached Rook. His answer leaves one last task.']],
'the-confession':[['NARRATOR','The council keeps the correction — and its author. The valley chooses to repair, not to banish.'],['NARRATOR','A confession is not an acquittal. It is a work order.']],
'the-signal-above':[['NARRATOR','The bearing is confirmed: one source, one road, one junction at the end of it.'],['NARRATOR','The Iron Path is real — and it runs itself.']],
'counterfeit-key':[['NARRATOR','The counterfeit is cut: a key that opens the door and lies to the lock.'],['NARRATOR','One tower, one transmission, one climb left.']],
'last-transmission':[['NARRATOR','When the radios fall quiet again, it is not because the signal is lost. It is because, at last, the fighting has stopped.'],['NARRATOR','The road remains scarred, and those who fell are not forgotten.'],['ADA','To anyone still listening: the valley is safe. This is Ada Vale, signing off.']]
};
// Locations change between the opening and aftermath to follow the journey.
const SCENES={
 'lost-signal':[{art:'dawn-road',place:'THE VALLEY ROAD',weather:'mist'},{art:'pinewood',place:'PINEWOOD APPROACH',weather:'mist'}],
 'pinewood-rescue':[{art:'pinewood-trail',place:'PINEWOOD CROSSING',weather:'mist'},{art:'pinewood',place:'THE RETURN ROAD',weather:'mist'}],
 'ghost-frequency':[{art:'relay-line',place:'THE TALWALD RELAY LINE',weather:'mist'},{art:'pinewood',place:'THE LOOP ANSWERS',weather:'mist'}],
 'blackout':[{art:'outpost-fire',place:'THE BROKEN OUTPOST',weather:'embers'},{art:'outpost',place:'THE SIGNAL RETURNS',weather:'embers'}],
 'ash-market':[{art:'market-ruins',place:'THE ASH MARKET',weather:'embers'},{art:'city',place:'THE BUYER’S TENT',weather:'embers'}],
 'the-list':[{art:'marsh-hospital',place:'THE MARSH HOSPITAL',weather:'rain'},{art:'marsh',place:'THE LAST LITTER OUT',weather:'rain'}],
 'brothers-keeper':[{art:'ice-road',place:'THE ICE ROAD',weather:'snow'},{art:'ice',place:'THE RELAY POST',weather:'snow'}],
 'quiet-road':[{art:'night-heath',place:'THE NIGHT HEATH',weather:'embers'},{art:'outpost',place:'THE COUNTING POST',weather:'embers'}],
 'signal-home':[{art:'main-relay',place:'THE MAIN RELAY',weather:'mist'},{art:'valley',place:'THE VALLEY LISTENS',weather:'mist'}],
 'supply-line':[{art:'forest-convoy',place:'THE FOREST CONVOY',weather:'mist'},{art:'valley',place:'THE VALLEY ROAD',weather:'mist'}],
 'intercept':[{art:'outpost',place:'THE DISPATCH ROUTE',weather:'embers'},{art:'valley',place:'THE VALLEY BELOW',weather:'mist'}],
'high-water':[{art:'flood-village',place:'THE CUT-OFF VILLAGE',weather:'rain'},{art:'marsh',place:'THE DYKE AT DUSK',weather:'rain'}],
'ward-line':[{art:'hospital-row',place:'THE HOSPITAL CORRIDOR',weather:'rain'},{art:'city',place:'THE LIGHTS STAY ON',weather:'rain'}],
 'bridge':[{art:'pinewood',place:'THE EVACUATION BRIDGE',weather:'mist'},{art:'valley',place:'THE ROAD TO TIDELOCK',weather:'rain'}],
'the-count':[{art:'night-count',place:'THE NIGHT MARSH',weather:'rain'},{art:'marsh',place:'THE COUNT IS EVEN',weather:'rain'}],
 'dead-air':[{art:'marsh',place:'THE FLOODED MARSH',weather:'rain'},{art:'ice',place:'THE NORTHERN SIGNAL',weather:'snow'}],
'ice-run':[{art:'white-passage',place:'THE WHITE PASSAGE',weather:'snow'},{art:'ice',place:'OVER THE RIDGE',weather:'snow'}],
 'white-noise':[{art:'ice',place:'THE ICE STATION',weather:'snow'},{art:'ice',place:'THE NORTHERN RIDGE',weather:'snow'}],
'cold-start':[{art:'frozen-junction',place:'THE FROZEN JUNCTION',weather:'snow'},{art:'ice',place:'THE TRANSPORT ROLLS NORTH',weather:'snow'}],
 'long-switch':[{art:'outpost',place:'THE POWER SUBSTATION',weather:'embers'},{art:'city',place:'THE OCCUPIED CITY',weather:'rain'}],
 'paper-war':[{art:'registry-hall',place:'THE RECORDS OFFICE',weather:'rain'},{art:'city',place:'THE CITY REGISTRY',weather:'rain'}],
 'the-mentor':[{art:'city-forge',place:'THE CITY FORGE',weather:'embers'},{art:'city',place:'THE WORKSHOP DOOR',weather:'rain'}],
 'city-of-glass':[{art:'city',place:'THE INDUSTRIAL DISTRICT',weather:'rain'},{art:'tower',place:'THE GATE AHEAD',weather:'rain'}],
 'workshop-of-ghosts':[{art:'city-forge',place:'THE FORGE FLOOR',weather:'embers'},{art:'city',place:'THE SILENT WORKSHOPS',weather:'rain'}],
 'night-shift':[{art:'night-strike',place:'THE NIGHT MARCH',weather:'rain'},{art:'city',place:'THE MARSH ROAD GATE',weather:'rain'}],
 'tidelock':[{art:'marsh',place:'THE MARSH CONTROL LINE',weather:'rain'},{art:'tower',place:'THE INDUSTRIAL TOWER',weather:'rain'}],
 'the-confession':[{art:'marsh',place:'THE ASSEMBLY HALL',weather:'rain'},{art:'valley',place:'THE VERDICT',weather:'mist'}],
 'the-signal-above':[{art:'night-heath',place:'THE BEACON HEATH',weather:'embers'},{art:'outpost',place:'THE RELAY TRACE',weather:'embers'}],
 'counterfeit-key':[{art:'city',place:'THE CUTTING BENCH',weather:'rain'},{art:'tower',place:'THE READER IN THE TOWER',weather:'rain'}],
 'last-transmission':[{art:'tower',place:'THE FINAL OVERRIDE',weather:'rain'},{art:'valley',place:'THE VALLEY AT DAWN',weather:'mist'}]
};
export function cinematicScene(mission,kind){return SCENES[mission?.id]?.[kind==='intro'?0:kind==='ending'?1:-1]??null;}
// Relict handovers: the act finales end with the bearer pressing their relic
// into the player's hands. Keyed by mission id so this file stays free of a
// campaign import; the tests enforce that every shipped act finale has a scene.
// Frames may carry their own art and place - the handover plays as a short
// illustrated sequence over the act's key art and one detail shot.
export const RELIC_SCENES={
 'supply-line':{relic:'relic-open-line',frames:[
  {speaker:'NARRATOR',text:'The valley road at dawn. The first free transmission of the war is still humming down the wire.',art:'act1-dawn',place:'THE VALLEY AT DAWN'},
  {speaker:'ADA',text:'You held the line when nobody else could hear me. Take my old field jack - it has carried every word since the silence began.',art:'act1-relic',place:'THE OPEN LINE'},
  {speaker:'ADA',text:'While you carry it, your strike call answers four seconds sooner. An open line, always.',art:'act1-relic',place:'THE OPEN LINE'},
  {speaker:'NARRATOR',text:'Somewhere north, a transport runs on schedule. Ada keeps the line open - and waits.',art:'act1-dawn',place:'THE VALLEY AT DAWN'}]},
 'long-switch':{relic:'relic-the-list',frames:[
  {speaker:'NARRATOR',text:'The flood is held back for another night. In the marsh hospital, Sera closes her notebook and holds it out.',art:'marsh',place:'THE MARSH HOSPITAL'},
  {speaker:'SERA',text:'Every name in here is someone the water did not take. Keep it with the one who held the line.',art:'marsh',place:'THE MARSH HOSPITAL'},
  {speaker:'SERA',text:'My stitches hold in the bunker walls now, and the quartermaster owes you a fuller pack. The list pays its debts.',art:'marsh',place:'THE MARSH HOSPITAL'},
  {speaker:'NARRATOR',text:'Downstream, the water waits for its turn. The list is ready for it.',art:'marsh',place:'THE MARSH HOSPITAL'}]},
 'last-transmission':{relic:'relic-timetable',frames:[
  {speaker:'NARRATOR',text:'The last transmission ends in static. In the occupied city, Ivo finally lays his timetable on the table.',art:'city',place:'THE OCCUPIED CITY'},
  {speaker:'IVO',text:'I wrote the schedule that floods this valley. Now I am rewriting it - and your soldiers will keep my correction.',art:'city',place:'THE OCCUPIED CITY'},
  {speaker:'IVO',text:'Faster hands, straighter shots. Read the rhythm, not the orders.',art:'city',place:'THE OCCUPIED CITY'},
  {speaker:'NARRATOR',text:'The correction holds. The valley buys itself one more dawn.',art:'city',place:'THE OCCUPIED CITY'}]}
};
// Presentation-only: the game appends these frames to an act finale's ending.
// `cinematicFrames` itself stays pure so debrief replays and translations can
// keep addressing the authored coda by its stable tail.
export function relicHandover(mission){return RELIC_SCENES[mission?.id]?.frames??[];}
function speakers(text){return text.split(/(?=\b(?:VOSS|ADA|IVO|SERA|NIA|ROOK|SURVIVORS):\s)/).map(line=>line.trim()).filter(Boolean).map(line=>{const m=line.match(/^([A-Z]+):\s*(.*)$/);return m?[m[1],m[2]]:['NARRATOR',line];});}
export function cinematicFrames(mission,kind){
 if(!mission||!OPENINGS[mission.id]||!['intro','ending'].includes(kind))return [];
 const lines=kind==='intro'?[['NARRATOR',mission.briefing],...OPENINGS[mission.id],...speakers(mission.stages[0].dialogue)]:[...speakers(mission.success),...CODAS[mission.id]];
 return lines.map(([speaker,text])=>({speaker,text}));
}
