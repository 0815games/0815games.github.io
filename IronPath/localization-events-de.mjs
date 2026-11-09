import {MISSION_DECISIONS,MISSION_EVENTS,STAGE_CAPTIONS,EVENT_TEMPLATES} from './story-events.mjs?v=20261111-events1';
// German for the mission accompaniment (radio decisions, field events, stage
// captions). Matched to authored strings only - never stored in profiles or
// fed back into mission rules. The import itself validates coverage, so a new
// decision that ships without its German lines fails the build here.
const data={
 // Act II · THE FLOOD
 'intercept':'Die Eskorte ist schwach und bewegt sich schnell. Wir können sie frontal schlagen, oder du liest ihren Funk, während du sie beschattest. Deine Entscheidung, Soldat.',
 'Set the ambush':'Den Hinterhalt legen',
 '+35 supplies now · the escort’s reserve joins the field (4 units)':'+35 Vorräte sofort · die Reserve der Eskorte rückt an (4 Einheiten)',
 'VOSS: Ambush it is. Supplies dropped - expect their reserve to react.':'VOSS: Also Hinterhalt. Vorräte abgeworfen – rechne mit ihrer Reserve.',
 'Shadow the courier':'Den Kurier beschatten',
 'Bonus objective: break 8 units before the orders reach command (+75 supplies)':'Bonusziel: 8 Einheiten ausschalten, bevor die Befehle die Kommandozentrale erreichen (+75 Vorräte)',
 'VOSS: Shadow them. Break eight before the case comes home and the quartermaster pays out.':'VOSS: Beschatten. Schalte acht aus, bevor der Koffer heimkommt, und der Quartiermeister zahlt.',
 'Shadow the courier: break 8 units before delivery':'Den Kurier beschatten: 8 Einheiten vor der Übergabe ausschalten',
 'bridge':'Der Konvoi ist startklar. Wir können unsere Leuchtkugeln für dein Feld opfern, oder du räumst den Zufahrtsweg selbst, während die Kinder überqueren. Was brauchst du?',
 'Spare the flares':'Die Leuchtkugeln opfern',
 '+45 supplies now · Rook’s reserve answers the light (5 units)':'+45 Vorräte sofort · Rooks Reserve antwortet auf das Licht (5 Einheiten)',
 'SERA: Flares away. Watch the far treeline - the light draws them in.':'SERA: Leuchtkugeln unterwegs. Achte auf das Wäldchen am anderen Ufer – das Licht lockt sie an.',
 'Hold the far bank':'Das andere Ufer halten',
 'Bonus objective: secure the approach within 75s (+85 supplies)':'Bonusziel: den Zufahrtsweg innerhalb von 75s sichern (+85 Vorräte)',
 'SERA: Then hold it clean. Secure the approach in seventy-five seconds and we owe you.':'SERA: Dann halte es sauber. Sichere den Zufahrtsweg in fünfundsiebzig Sekunden und wir stehen in deiner Schuld.',
 'Secure the approach within 75s':'Den Zufahrtsweg innerhalb von 75s sichern',
 'Break 10 units before the transmitter is reached':'10 Einheiten ausschalten, bevor der Sender erreicht ist',
 'dead-air':'Der Empfänger verträgt die Ersatzbatterie für einen Schub, oder ich halte die Leistung niedrig und wir hören leise zu. Beides bringt mich auf Rooks Karte. Entscheide du.',
 'Wire the spare battery':'Die Ersatzbatterie anschließen',
 '+30 supplies now · the power draw brings 3 enemies to the receiver':'+30 Vorräte sofort · der Stromverbrauch lockt 3 Gegner an den Empfänger',
 'ADA: Battery is in. They will see the spike - be ready.':'ADA: Batterie drin. Der Anstieg wird sichtbar – sei bereit.',
 'Listen low':'Leise zuhören',
 'Bonus objective: the receiver survives with at least 75% health (+80 supplies)':'Bonusziel: der Empfänger übersteht mit mindestens 75% Integrität (+80 Vorräte)',
 'ADA: Listening low. Keep the receiver above three quarters and the recording is clean.':'ADA: Ich höre leise. Halte den Empfänger über drei Vierteln und die Aufnahme bleibt sauber.',
 'Receiver survives with at least 75% health':'Empfänger übersteht mit mindestens 75% Integrität',
 'white-noise':'Das Fenster ist kurz. Wir können die Stationstür aufbrechen und den Widerstand schlucken, oder den Schlüssel still spiegeln und uns Zeit bewahren. Entscheide schnell.',
 'Force the door':'Die Tür aufbrechen',
 '+40 supplies now · 4 defenders hold the station grounds':'+40 Vorräte sofort · 4 Verteidiger halten das Stationsgelände',
 'IVO: Forcing it. Supplies ahead - so are the defenders.':'IVO: Wir brechen auf. Vorräte voraus – die Verteidiger auch.',
 'Mirror the key':'Den Schlüssel spiegeln',
 'Bonus objective: reach the transmitter with at least 60s on the clock (+90 supplies)':'Bonusziel: den Sender mit mindestens 60s auf der Uhr erreichen (+90 Vorräte)',
 'IVO: Mirror it. Reach the transmitter with a minute left and we walk out clean.':'IVO: Spiegeln. Erreiche den Sender mit einer Minute Restzeit und wir gehen sauber raus.',
 'Reach the transmitter with 60s on the clock':'Den Sender mit 60s auf der Uhr erreichen',
 'long-switch':'Das Schaltfeld gehört uns für den Moment. Wir können die Mannschaft aufteilen, um die Umschaltung zu beschleunigen, oder jedes Relais doppelt prüfen, bevor ich umlege. Deine Entscheidung.',
 'Split the crew':'Die Mannschaft aufteilen',
 '+35 supplies now · the exposed yard draws 4 sappers':'+35 Vorräte sofort · das offene Schaltfeld lockt 4 Pioniere an',
 'IVO: Crew split. Watch the yard - they will not leave it alone.':'IVO: Mannschaft geteilt. Achte aufs Feld – die lassen es nicht in Ruhe.',
 'Double-check the relays':'Die Relais doppelt prüfen',
 'Bonus objective: the transformer survives with at least 70% health (+85 supplies)':'Bonusziel: der Transformator übersteht mit mindestens 70% Integrität (+85 Vorräte)',
 'IVO: Checked twice. Keep the transformer above seventy percent and the hospital never flickers.':'IVO: Zweimal geprüft. Halte den Transformator über siebzig Prozent und im Krankenhaus flackert nichts.',
 'Transformer survives with at least 70% health':'Transformator übersteht mit mindestens 70% Integrität',
 // Field events
 'Their reserve is moving on your position. Hold the line.':'Ihre Reserve rückt gegen deine Stellung vor. Halte die Linie.',
 'Counter-battery, NOW. Make those guns count, soldier.':'Gegenfeuer, JETZT. Lass diese Geschütze zählen, Soldat.',
 'The hospital generator is backing you - channel the surge into the line!':'Der Krankenhausgenerator unterstützt dich – leite den Schub in die Leitung!',
 // Stage captions (tutorial style)
 'MOVE TO THE MARKER AND HOLD':'ZUM MARKER BEWEGEN UND HALTEN',
 'CLEAR THE POSITION, THEN HOLD IT':'STELLUNG RÄUMEN UND HALTEN',
 'PROTECT THE BUNKER':'SCHÜTZE DEN BUNKER',
 'KEEP THE ASSET STANDING':'DAS OBJEKT MUSS STEHEN',
 'WALK WITH THEM TO THE MARKER':'GELEITE SIE ZUM MARKER',
 'BREAK THE ESCORT':'BRICH DIE ESKORTE',
 // UI templates
 'FIELD DECISION':'FUNK-ENTSCHEIDUNG',
 'Choose before the moment passes - the field keeps running.':'Entscheide, solange der Moment da ist – das Feld läuft weiter.',
 'BONUS · {label}':'BONUS · {label}',
 'BONUS · {label} ({progress}/{max})':'BONUS · {label} ({progress}/{max})',
 'BONUS · {label} ({percent}%)':'BONUS · {label} ({percent}%)',
 'Bonus objective complete: {label} (+{reward} supplies)':'Bonusziel erfüllt: {label} (+{reward} Vorräte)',
 'Bonus objective missed: {label}':'Bonusziel verpasst: {label}',
 '+{amount} supplies':'+{amount} Vorräte',
 'Reinforcements: {count} extra units on the field':'Verstärkung: {count} zusätzliche Einheiten auf dem Feld',
};
const entries={};
const add=(en,de)=>{if(typeof en==='string'&&typeof de==='string')entries[en]=de;};
for(const [id,decision] of Object.entries(MISSION_DECISIONS)){
 if(!data[id])throw Error(`Missing decision translation: ${id}`);
 add(decision.text,data[id]);
 for(const choice of decision.choices){
  for(const key of ['label','detail','confirm']){if(choice[key]&&!data[choice[key]])throw Error(`Missing decision ${key}: ${choice[key]}`);add(choice[key],data[choice[key]]);}
  if(choice.side){if(!data[choice.side.label])throw Error(`Missing side label: ${choice.side.label}`);add(choice.side.label,data[choice.side.label]);}
 }
}
for(const [id,events] of Object.entries(MISSION_EVENTS))for(const event of events){
 if(event.text){if(!data[event.text])throw Error(`Missing event translation: ${id}/${event.id}`);add(event.text,data[event.text]);}
 if(event.kind==='side'&&event.side?.label){if(!data[event.side.label])throw Error(`Missing side-event label: ${id}/${event.id}`);add(event.side.label,data[event.side.label]);}
}
for(const caption of Object.values(STAGE_CAPTIONS)){if(!data[caption])throw Error(`Missing caption translation: ${caption}`);add(caption,data[caption]);}
for(const template of Object.values(EVENT_TEMPLATES)){if(!data[template])throw Error(`Missing template translation: ${template}`);add(template,data[template]);}
export const germanEvents=Object.freeze(entries);
