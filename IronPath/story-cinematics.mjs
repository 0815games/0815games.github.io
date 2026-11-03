// Authored cutscene dialogue is presentation only; mission progress remains in campaign.mjs.
const OPENINGS={
'lost-signal':[['VOSS','The whole valley went quiet at 0600. No warning, no explanation.'],['ADA','This is courier Ada Vale. If anyone can hear me, I have the relay key. Please hurry.']],
'pinewood-rescue':[['ADA','That was my brother on the recording. He never leaves anyone behind.'],['VOSS','Then we will not leave his patrol behind either. Move out.']],
'blackout':[['IVO','The jammer is using our frequencies. Every call we make gives away another position.'],['VOSS','Then we cut it out. Ada, keep a channel open until the charges are set.']],
'supply-line':[['SERA','This is Medic Malik. We have wounded, a broken axle and almost no medicine.'],['VOSS','We are coming. Keep everyone together.']],
'intercept':[['IVO','Tidelock is an old dam protocol. I need the complete order to know what it does.'],['VOSS','The dispatch case comes back intact. Whatever is in it, we face it together.']],
'bridge':[['SERA','The convoy is moving. There are children in the second truck.'],['VOSS','The bridge is yours. We will hold the approach until the last vehicle is clear.']],
'dead-air':[['ADA','Rook is broadcasting somewhere beyond the marsh. I can find him if I take the receiver out.'],['VOSS','He will hear you too. Stay on the line, Ada.']],
'white-noise':[['IVO','The ice station only opens its authorization window briefly. Once it starts, we cannot stop it.'],['ADA','Then we move fast. I will read the signal from the transmitter.']],
'long-switch':[['SERA','The hospital is running on that same power line. I have people on life support.'],['IVO','I can reroute it. I just need you to keep the transformer standing.']],
'city-of-glass':[['VOSS','Nia Reyes designed the second lock. Rook has her in the industrial district.'],['ADA','Then we get her out before his men move her.']],
 'tidelock':[['NIA','The gate is damaged, but it can be stabilized. Rook has to hear the truth.'],['ADA','I will tell his soldiers myself. Keep the broadcast relay alive.']],
'last-transmission':[['NIA','The automatic override is still connected. Once it fires, the valley floods.'],['VOSS','One last line to hold. Everyone who made it this far is counting on us.']]
};
const CODAS={
'lost-signal':[['NARRATOR','The road ahead leads into Pinewood, and into the silence left behind.'],['NARRATOR','Somewhere beyond the trees, the patrol is still waiting for an answer.']],
'pinewood-rescue':[['NARRATOR','Ada holds on to the oscillator. It is all her brother could send home.'],['NARRATOR','Grief travels with the living; the warning has to travel farther.']],
'blackout':[['NARRATOR','Across the valley, an unseen transmitter answers the explosion.'],['NARRATOR','The resistance has broken the silence, but someone is now listening.']],
'supply-line':[['NARRATOR','The convoy is safe for now. The word on the orders is not.'],['NARRATOR','A name on a sealed order can change the fate of everyone on the road.']],
'intercept':[['NARRATOR','Downstream, the evacuation begins against the clock.'],['NARRATOR','The dam is no longer just a landmark. It is a weapon aimed at home.']],
'bridge':[['NARRATOR','Beyond the bridge, the valley remains in danger.'],['NARRATOR','Voss counts each truck. For the people still downstream, the fight is not over.']],
'dead-air':[['NARRATOR','A signal points north. The enemy is listening too.'],['NARRATOR','The receiver falls silent, but the frequency remains.']],
'white-noise':[['NARRATOR','One key. Two locks. The road to the dam grows shorter.'],['NARRATOR','There is no safe shortcut to the second lock.']],
'long-switch':[['NARRATOR','In the hospital, the lights remain on. In the occupied city, Nia waits.'],['NARRATOR','The first lock is down without sacrificing the people behind the line.']],
'city-of-glass':[['NARRATOR','The truth is more complicated than the order. There is still a way to save the valley.'],['NARRATOR','Nia brings more than a key: she brings a choice.']],
 'tidelock':[['NARRATOR','Rook’s soldiers have heard Ada. Now the tower must be reached.'],['NARRATOR','The broadcast has reached Rook. His answer leaves one last task.']],
'last-transmission':[['NARRATOR','When the radios fall quiet again, it is not because the signal is lost. It is because, at last, the fighting has stopped.'],['NARRATOR','The road remains scarred, and those who fell are not forgotten.'],['ADA','To anyone still listening: the valley is safe. This is Ada Vale, signing off.']]
};
// Locations change between the opening and aftermath to follow the journey.
const SCENES={
 'lost-signal':[{art:'signal',place:'THE VALLEY ROAD',weather:'mist'},{art:'pinewood',place:'PINEWOOD APPROACH',weather:'mist'}],
 'pinewood-rescue':[{art:'pinewood',place:'PINEWOOD CROSSING',weather:'mist'},{art:'pinewood',place:'THE RETURN ROAD',weather:'mist'}],
 'blackout':[{art:'outpost',place:'THE BROKEN OUTPOST',weather:'embers'},{art:'outpost',place:'THE SIGNAL RETURNS',weather:'embers'}],
 'supply-line':[{art:'pinewood',place:'THE FOREST CONVOY',weather:'mist'},{art:'valley',place:'THE VALLEY ROAD',weather:'mist'}],
 'intercept':[{art:'outpost',place:'THE DISPATCH ROUTE',weather:'embers'},{art:'valley',place:'THE VALLEY BELOW',weather:'mist'}],
 'bridge':[{art:'pinewood',place:'THE EVACUATION BRIDGE',weather:'mist'},{art:'valley',place:'THE ROAD TO TIDELOCK',weather:'rain'}],
 'dead-air':[{art:'marsh',place:'THE FLOODED MARSH',weather:'rain'},{art:'ice',place:'THE NORTHERN SIGNAL',weather:'snow'}],
 'white-noise':[{art:'ice',place:'THE ICE STATION',weather:'snow'},{art:'ice',place:'THE NORTHERN RIDGE',weather:'snow'}],
 'long-switch':[{art:'outpost',place:'THE POWER SUBSTATION',weather:'embers'},{art:'city',place:'THE OCCUPIED CITY',weather:'rain'}],
 'city-of-glass':[{art:'city',place:'THE INDUSTRIAL DISTRICT',weather:'rain'},{art:'tower',place:'THE GATE AHEAD',weather:'rain'}],
 'tidelock':[{art:'marsh',place:'THE MARSH CONTROL LINE',weather:'rain'},{art:'tower',place:'THE INDUSTRIAL TOWER',weather:'rain'}],
 'last-transmission':[{art:'tower',place:'THE FINAL OVERRIDE',weather:'rain'},{art:'valley',place:'THE VALLEY AT DAWN',weather:'mist'}]
};
export function cinematicScene(mission,kind){return SCENES[mission?.id]?.[kind==='intro'?0:kind==='ending'?1:-1]??null;}
function speakers(text){return text.split(/(?=\b(?:VOSS|ADA|IVO|SERA|NIA|ROOK|SURVIVORS):\s)/).map(line=>line.trim()).filter(Boolean).map(line=>{const m=line.match(/^([A-Z]+):\s*(.*)$/);return m?[m[1],m[2]]:['NARRATOR',line];});}
export function cinematicFrames(mission,kind){
 if(!mission||!OPENINGS[mission.id]||!['intro','ending'].includes(kind))return [];
 const lines=kind==='intro'?[['NARRATOR',mission.briefing],...OPENINGS[mission.id],...speakers(mission.stages[0].dialogue)]:[...speakers(mission.success),...CODAS[mission.id]];
 return lines.map(([speaker,text])=>({speaker,text}));
}
