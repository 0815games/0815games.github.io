import {MISSION_DECISIONS,MISSION_EVENTS,STAGE_CAPTIONS,EVENT_TEMPLATES} from './story-events.mjs?v=20261206-acttwo1';
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
 // Act II - die Region Marsch & Eis (high-water, ward-line, the-count, ice-run, cold-start).
 'high-water':'Das Schützenhaus ist unser. Wir können die Flut in den alten Kanal ableiten und ihren Tritt versumpfen – oder alle Tore versiegeln und den Deich in voller Stärke halten. Deine Entscheidung.',
 'Open the sluice':'Schleuse öffnen','+40 supplies now · the drained channel brings 4 units':'+40 Vorräte jetzt · der trockengelegte Kanal bringt 4 Einheiten ins Feld','SERA: Sluice open. The ground is soft - and they will use the dry bed to come at you.':'SERA: Schleuse offen. Der Boden ist weich – und sie werden das trockene Bett nutzen, um euch anzugreifen.',
 'Seal the gates':'Tore versiegeln','Bonus objective: clear the dyke approach within 70s (+80 supplies)':'Nebenziel: Räume den Deich-Zugang innerhalb von 70 s (+80 Vorräte)','SERA: Gates sealed. The dyke takes everything they have - clear their pioneers off it in seventy seconds and we are even.':'SERA: Tore versiegelt. Der Deich schluckt alles, was sie haben – räum ihre Pioniere in siebzig Sekunden herunter, und wir sind quitt.',
 'Clear the dyke approach within 70s':'Räume den Deich-Zugang innerhalb von 70 s',
 'The river just broke their culvert - whatever was crossing that road is gone. Press on!':'Der Fluss hat gerade ihre Durchlass weggerissen – was immer auf dieser Straße stand, ist fort. Weiter!',
 'ward-line':'Wir können den Reservebehälter des Konvois anzapfen oder jeden Tropfen für das Krankenhaus behalten. Die Reserve kauft euch Zeit; die Station braucht das Licht. Deine Entscheidung.',
 'Tap the reserve':'Reserve anzapfen','+30 supplies now · the short convoy draws 3 street patrols':'+30 Vorräte jetzt · der verkürzte Konvoi zieht 3 Straßenpatrouillen an','IVO: Tapped. Mind the patrols - they heard the pump.':'IVO: Angezapft. Vorsicht vor den Patrouillen – sie haben die Pumpe gehört.',
 'Every drop for the ward':'Jeder Tropfen für die Station','Bonus objective: the fuel skid survives with at least 75% health (+80 supplies)':'Nebenziel: Der Treibstoffschlitten übersteht mit mindestens 75 % Gesundheit (+80 Vorräte)','IVO: All of it for the ward. Keep that skid above three quarters and Sera owes you her whole night shift.':'IVO: Alles für die Station. Halte den Schlitten über drei Vierteln, und Sera schuldet dir ihre ganze Nachtschicht.',
 'Fuel skid survives with at least 75% health':'Treibstoffschlitten übersteht mit mindestens 75 % Gesundheit',
 'Street patrol rerouting to the crossing. They know our timetable - hold anyway.':'Straßenpatrouille biegt zum Übergang ab. Die kennen unseren Fahrplan – haltet trotzdem.',
 'the-count':'Wir können das Marschland mit Leuchtkugeln erhellen und das hier schnell beenden – oder verdunkeln und ihr Suchmuster lesen. Das Licht findet ihn früher. Und alles andere auch. Deine Entscheidung.',
 'Light the marsh':'Marschland erleuchten','+35 supplies now · the flares draw 4 hunters':'+35 Vorräte jetzt · die Leuchtkugeln ziehen 4 Jäger an','VOSS: Flares up. You will see them coming - all of them.':'VOSS: Leuchtkugeln hoch. Du wirst sie kommen sehen – alle.',
 'Go dark':'Verdunkeln','Bonus objective: break 12 units before the driver is found (+75 supplies)':'Nebenziel: Brich 12 Einheiten, bevor der Fahrer gefunden ist (+75 Vorräte)','VOSS: Dark it is. Break twelve of theirs before we reach the truck and the night is ours.':'VOSS: Dann dunkel. Brich zwölf von ihnen, bevor wir den Lastwagen erreichen, und die Nacht gehört uns.',
 'Break 12 units before the driver is found':'Brich 12 Einheiten, bevor der Fahrer gefunden ist',
 'Listen - the bog just swallowed their gun nest whole. Even the ground is on our side tonight.':'Hört – der Sumpf hat gerade ihr MG-Nest komplett geschluckt. Heute Nacht ist selbst der Boden auf unserer Seite.',
 'ice-run':'Wir können die Hälfte der Ladung abwerfen und die Eskorte bewaffnen – oder den Schlitten voll laufen lassen und auf den Pass vertrauen. Deine Entscheidung.',
 'Arm the escort':'Eskorte bewaffnen','+35 supplies now · the lighter sledge draws 4 raiders':'+35 Vorräte jetzt · der leichtere Schlitten zieht 4 Räuber an','SERA: Armed. They will come for the light load - meet them.':'SERA: Bewaffnet. Die Räuber kommen der leichten Ladung wegen – erwartet sie.',
 'Run the sledge heavy':'Schlitten voll laden','Bonus objective: the medicine sledge survives with at least 80% health (+85 supplies)':'Nebenziel: Der Medizinschlitten übersteht mit mindestens 80 % Gesundheit (+85 Vorräte)','SERA: Heavy it is. Keep that sledge above four fifths and every station gets its full share.':'SERA: Dann voll. Halte den Schlitten über vier Fünfteln, und jede Station bekommt ihren vollen Anteil.',
 'Medicine sledge survives with at least 80% health':'Medizinschlitten übersteht mit mindestens 80 % Gesundheit',
 'Spotters on the far ridge - they called the convoy in. Watch the high ground.':'Beobachter am fernen Kamm – sie haben den Konvoi gemeldet. Achtung, Höhengelände.',
 'cold-start':'Das Treibstoffdepot der Garnison ist unbewacht. Zündet es an, und sie kämpfen kalt und blind – oder lasst es stehen und fotografiert ihre Umplanung. Deine Entscheidung.',
 'Burn the depot':'Depot anzünden','+40 supplies now · the smoke column brings 4 to the junction':'+40 Vorräte jetzt · die Rauchsäule bringt 4 an den Knoten','ADA: Depot burning. They will see it from the next valley - be ready.':'ADA: Depot brennt. Vom nächsten Tal aus sieht man die Rauchsäule – seid bereit.',
 'Photograph the reschedule':'Umplanung fotografieren','Bonus objective: take the switch house within 80s (+80 supplies)':'Nebenziel: Nimm das Stellwerk innerhalb von 80 s (+80 Vorräte)','ADA: Quietly, then. The switch house in eighty seconds and their timetable is mine.':'ADA: Dann leise. Das Stellwerk in achtzig Sekunden, und ihr Fahrplan gehört mir.',
 'Take the switch house within 80s':'Nimm das Stellwerk innerhalb von 80 s',
 'A frozen switch just split their reserve train - half of it is stranded on the far track. Hit them now!':'Eine gefrorene Weiche hat gerade ihren Reservezug geteilt – die Hälfte steht auf dem fernen Gleis fest. Schlagt jetzt zu!',
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
