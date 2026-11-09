import {CAMPAIGN} from './campaign.mjs?v=20261206-acttwo1';
// Translations are matched to authored mission IDs, never stored in profiles or
// fed back into mission rules. Each stage entry follows the authored order.
const data={
 'lost-signal':['Das verstummte Signal','Bei Tagesanbruch verstummen alle Funkgeräte auf der Talstraße – bis auf einen abgebrochenen Notruf. Captain Mara Voss schickt dich los, um die Kurierin mit dem Relaisschlüssel zu finden. Der Bunker ist der letzte Ort, der noch antwortet.',[
 ['Finde die abgestürzte Kurierin','VOSS: Kurierin Ada Vale ist nahe der Straße abgestürzt. Finde sie, bevor der Feind es tut.'],['Stelle das Feldrelais wieder her','ADA: Ich habe den Schlüssel in meinem Mantel versteckt. Die Stimme auf der Aufnahme war mein Bruder. Bitte stelle das Relais wieder her.'],['Übermittle das Signal an die Kommandozentrale','ADA: Die Koordinaten kommen durch. Bring sie zu Voss; ich halte die Leitung offen.']],
 'VOSS: Das Signal weist nach Pinewood. Adas Bruder gehörte zur dortigen Patrouille. Wenn noch jemand lebt, bringen wir ihn nach Hause.'],
 'pinewood-rescue':['Die vermisste Patrouille','Der Übergang bei Pinewood wird angegriffen. Der Notruf kam von einem Techniker namens Ivo Chen und einer Handvoll Soldaten. Ada besteht darauf, dass ihr Bruder bei ihnen ist; Voss kann nicht versprechen, wen du finden wirst.',[
 ['Finde die vermisste Patrouille','VOSS: Durchsuche den Unterstand hinter dem Übergang. Ivo hatte ein Bauteil bei sich, das wir nicht ersetzen können.'],['Eskortiere die Patrouille zum Bunker','IVO: Wir sind alles, was übrig ist. Adas Bruder blieb zurück, damit wir entkommen konnten. Bitte sag ihr, dass er uns gerettet hat.']],
 'ADA: Er sollte nach Hause kommen. IVO: Er gab mir den Oszillator, damit wir euch warnen konnten. Der feindliche Sender richtet unser eigenes Relaisnetz gegen uns.'],
 'ghost-frequency':['Geisterfrequenz','Ada spürt das Störsignal einer alten Relaiskette im Talwald nach. Mit jedem Mast, den sie in Betrieb nimmt, antwortet ihr eine geloopte Rufnummer – eine, die seit einem Jahr tot ist.',[
 ['Erreiche den ersten Mast','ADA: Die Relaislinie verläuft durch den Wald. Fang beim ersten Mast an; ich höre zu, während du gehst.'],['Schütze den Relais-Masten','ADA: Er ist da. Der alte Rufname meines Bruders, in einer Schleife auf unserer Frequenz. Halte sie vom Mast fern, während ich aufnehme.'],['Bring die Aufnahme zurück','ADA: Voss, hör zu. Das ist Elias. Er lebt – und jemand benutzt seine Stimme, um uns in eine Falle zu locken.']],
 'VOSS: Wenn Elias Vale lebt, wird er verlegt. ADA: Dann folgen wir dem Signal – ganzem.'],
 'blackout':['Blackout am Außenposten','Ivo erkennt den alten Sender des Außenpostens als Quelle der Störung. Seine Zerstörung könnte die Straße wieder öffnen, verrät dem Feind aber auch genau, wo sich der Widerstand versteckt.',[
 ['Platziere die erste Ladung','IVO: Zwei Ladungen. Eine an der Kreuzung, eine an der Zuleitung. Keine ist dein Leben wert.'],['Platziere die zweite Ladung','ADA: Die erste Ladung antwortet. Ivo, bist du sicher, dass die zweite nicht auch unser Relais lahmlegt?'],['Verteidige bis zur Detonation','IVO: Sicher genug. Die Ladungen sind scharf – halte den Bunker bis zur Explosion.']],
 'VOSS: Der Störsender ist ausgeschaltet. ADA: Warte. Ein zweites Signal ist gerade erwacht. Jemand wollte, dass wir diesen Sender zerstören.'],
 'ash-market':['Der Aschmarkt','Die Relaiskette braucht Teile, die der Widerstand nicht selbst bauen kann. Im zerstörten Industrieviertel handelt ein Schwarzmarkt mit Bergungsbauteilen – und Rooks Quartiermeister bieten auf dieselben Kisten.',[
 ['Breche die Eskorte des Quartiermeisters','VOSS: Rooks Käufer sind schon da. Brich ihre Eskorte, bevor die Auktion schließt.'],['Sichere die Auktionskisten','IVO: Bauteile für zwei Masten. Biete schnell – der Markt bewegt sich, sobald der Beschuss beginnt.'],['Eskortiere den Teiletransporter','IVO: Der Transporter ist beladen. Bring ihn nach Hause; der Markt gibt nichts zurück.']],
 'IVO: Genug Bauteile für drei Masten. ADA: Und ein Manifest aus dem Zelt des Käufers – die Zahlungen sind mit einem Lagercode gezeichnet.'],
 'the-list':['Die Liste','Der Lagercode verweist auf ein Feldlazarett im Marschland, geleitet von Sanitäterin Sera Malik. Feindliche Vergeltungstruppen durchkämmen das Delta nach ihren Verwundeten. Ihre Liste von Namen beginnt hier.',[
 ['Sichere den Verbandsplatz','SERA: Ich operiere, solange der Boden draußen unser ist. Räum ihn und halt ihn frei.'],['Schütze das Feldlazarett','SERA: Vergeltungstrupps im Schilf. Lasst sie nicht an die Zelte – jeder Name auf meiner Liste atmet noch.'],['Evakuiere die Verwundeten','SERA: Die Tragbaren sind unterwegs. Geleit sie hinaus, bevor der nächste Suchtrupp kommt.']],
 'SERA: Alle auf der Liste sind draußen. Einer meiner Verwundeten war Kurier – er sprach von einem Manifest mit einem Gefangenen namens VALE.'],
 'brothers-keeper':['Wächterbruder','Ein gefangener Meldereiter wurde über die Eisstraße verlegt, bevor der Pass zuschloss. Seine Kuriertasche soll ein Gefangenenmanifest enthalten – und Ada stellt nicht länger so, als würde sie nicht zuhören.',[
 ['Breche die Meldereitereskorte','VOSS: Der Reiter ist bei dieser Eskorte. Schalte sie aus, bevor sie das andere Ufer erreicht.'],['Berge die Kuriertasche','ADA: Die Tasche liegt am Relaisposten. Bring sie mir ungeöffnet. Bitte.'],['Lies das Manifest','ADA: Zeile einundvierzig. VALE, ELIAS. Verlegung ausstehend. Er lebt, Voss – und man bringt ihn nach Norden.']],
 'ADA: Ein Jahr Funkstille, und nun ist er ein Name auf einer Verlegungsliste. VOSS: Dann gehen wir nach Norden – sobald die Straße unser ist.'],
 'quiet-road':['Stille Straße','Die nächtliche Heide trägt Konvoiverkehr nach striktem Fahrplan. Ivo will eine vollständige Zählung: Wenn Elias in einem dieser Lastwagen sitzt, verrät der Fahrplan selbst, in welchem.',[
 ['Nimm den Zählposten','IVO: Der Beobachtungsposten überblickt die Konvoispur. Halte ihn und fang an zu zählen.'],['Sichere die Fahrplanübergabe','IVO: Ein Kurier übergibt den Nachtplan am Wegpunkt. Nimm ihn unversehrt – jede Minute zählt für sie.'],['Überbringe den Fahrplan','IVO: Abgeglichen: der Transport nach Norden fährt in der übernächsten Nacht. Eine Nacht bis zum Relais.']],
 'IVO: Die Straße läuft nach Plan, weil sie es muss. ADA: Dann ist der Fahrplan diesmal auf unserer Seite.'],
 'signal-home':['Heimsignal','Das Hauptrelais steht tief im Talwald. Ada wird heute Nacht die erste freie Sendung des Tals davon ausstrahlen – und auf eine Antwort auf einem Klopfcode warten, den nur ihr Bruder kennt.',[
 ['Erreiche das Hauptrelais','ADA: Das Hauptrelais ist alt, aber ehrlich. Bring mich hin und ich erledige den Rest.'],['Schütze das Hauptrelais','ADA: Ich sende. Wenn Elias mich hören kann, antwortet er mit dem Klopfcode. Halt den Mast, solange ich höre.'],['Halte durch, bis die Antwort kommt','VOSS: Sie wissen, was sie tut. Haltet den Bunker, bis die Übertragung endet.']],
 'ADA: Drei Klopfzeichen, dann zwei. Das ist unser Code aus Kindertagen. VOSS: Dann haben wir einen Bruder heimzuholen – und einen Konvoi zu erreichen.'],
 'supply-line':['Der Hilfskonvoi','Der Blackout hat einen im Wald festsitzenden Hilfskonvoi aufgedeckt. Sanitäterin Sera Malik ist bei ihm. Voss befiehlt, die Vorräte zu bergen, aber Sera weigert sich, jemanden zurückzulassen.',[
 ['Berge die medizinischen Vorräte','SERA: In der nördlichen Kiste sind Antibiotika. Ohne sie überstehen die Verwundeten die Nacht nicht.'],['Finde die Überlebenden des Konvois','SERA: Danke. Die Fahrer suchen an der südlichen Straße Schutz; wir gehen gemeinsam.'],['Eskortiere die Überlebenden des Konvois','SURVIVORS: Wir können gehen. Haltet den Feind fern, dann folgen wir euch.']],
 'SERA: Alle haben es geschafft. Einer der Fahrer fand versiegelte Befehle in einem feindlichen Lastwagen: TIDELOCK. Ivo, sag mir, dass damit nicht der Damm gemeint ist.'],
 'intercept':['Befehle in der Asche','Die Befehle sind unvollständig. Eine feindliche Kuriereinheit trägt den Rest durch den zerstörten Außenposten. Schalte ihre Eskorte aus, sichere den Koffer und finde vor der nächsten Übertragung heraus, was Tidelock bedeutet.',[
 ['Schalte die Kuriereskorte aus','VOSS: Schalte die Eskorte aus. Wir brauchen den Koffer unversehrt, keinen weiteren Krater.'],['Berge den Kurierkoffer','ADA: Die Eskorte ist ausgeschaltet. Ich sehe den Koffer an der Kreuzung – rück vor.'],['Überbringe die Befehle','IVO: Das Siegel trägt die Aufschrift TIDELOCK. Bring es zurück; ich kann die Verschlüsselung knacken.']],
 'IVO: Tidelock öffnet die Fluttore und überflutet die Talstraße. Der Befehl ist von Commander Rook unterzeichnet. Die Evakuierung muss sofort beginnen.'],
 'high-water':['Hochwasser','Der Fluss steigt Wochen zu früh. Ein Dorf ist hinter der überfluteten Straße abgeschnitten, und Rooks Pioniertrupps verlegen bereits die Sprengladungen am Deich – die Detonation würde die letzte Versorgungslinie des Widerstands ertränken und alle, die noch in den Obergeschossen warten.',[
 ['Erreiche das abgeschnittene Dorf','SERA: Das Wasser hat ihnen die Straße weggenommen. Die Dorfbewohner sind im Obergeschoss der Schule – komm an, bevor der Fluss es tut.'],
 ['Räume den Deich-Zugang frei','VOSS: Rooks Pioniere verkabeln den Deich. Räum sie herunter – diese Wand ist alles, was das Marschland draußen hält.'],
 ['Geleite die Dorfbewohner zur Hochstraße','DORFBEWOHNER: Wir können die Kinder tragen. Halte uns das Wasser und die Soldaten vom Leib.']],
 'SERA: Alle sind drüben, und der Deich hält – vorerst. Rook wird nicht vergessen, wer seine Sprengung gestoppt hat. IVO: Der Fluss auch nicht. Er kommt mit der Schneeschmelze zurück.'],
 'ward-line':['Station Strom','Der Generator des Stadtkrankenhauses ist kurz vor dem Leerlauf. Ein Treibstoffkonvoi muss vor Einbruch der Dunkelheit durch die besetzten Straßen – und Rooks Straßenpatrouillen wissen genau, welche Straße er nehmen muss.',[
 ['Schütze den Treibstoffschlitten','SERA: Der Treibstoffschlitten muss heil bleiben. Ein platzender Schlauch – und der Operationssaal wird dunkel.'],
 ['Halte den Kanalübergang','VOSS: Der Kanalübergang ist der einzige Weg nach Osten. Halte ihn offen, bis der Konvoi durch ist.'],
 ['Geleite den Treibstoff zum Krankenhausflügel','SERA: Langsam und ruhig. Die Patienten versammeln sich schon auf der Treppe und warten auf das Licht.']],
 'SERA: Der Generator summt. Heute Nacht hat der Operationssaal Strom, und jeder Name auf meiner Liste steht noch in Tinte – nicht auf einer Verlustliste.'],
 'bridge':['Halte die Brücke','Die Evakuierung führt über die einzige Brücke aus dem Tal. Rooks Vorhut rückt näher. Sichere die Zufahrt, bis Seras Konvoi übergesetzt hat; Gegner nahe der Stellung blockieren den Fortschritt.',[
 ['Sichere die Brückenzufahrt','VOSS: Halte die Zufahrt. Wenn der Feind deine Stellung erreicht, räume sie, bevor der Konvoi weiterfährt.'],['Decke die Evakuierung','SERA: Der erste Lastwagen ist drüben. Im zweiten sind Kinder – gebt uns noch etwas Zeit.'],['Bestätige die Evakuierung','SERA: Der letzte Lastwagen ist durch. Kehre zur Kommandozentrale zurück und bestätige die Anzahl.']],
 'SERA: Alle auf meiner Liste sind drüben. ADA: Ich habe Rook abgefangen: „Die Brücke war nie das Ziel.“ Ivo, was versorgt den Damm noch?'],
 'the-count':['Die Zählung','Nach der Brücke fehlt Seras Zählung ein Name: Ein Fahrer ist für eine Familie umgekehrt, die auf keinem Manifest stand. Er ist noch da draußen – und die Patrouillen, die ihn jagen, auch.',[
 ['Brich die Nachtpatrouille','VOSS: Ihre Nachtpatrouille jagt ihn mit Hunden und Leuchtkugeln. Brich sie, bevor sie ihn findet.'],
 ['Finde den Lastwagen des Fahrers','VOSS: Achseltief im Sumpf – Scheinwerfer an, Türen offen. Er ist nah.'],
 ['Bring den Fahrer und die Familie nach Hause','FAHRER: Ich konnte sie nicht zurücklassen. Ich weiß, was die Liste sagt. Bring uns zurück.']],
 'SERA: Die Zählung geht wieder auf – und heute Nacht ist sie um drei gewachsen. Ein Fahrer, eine Mutter, ein Kind. Genau dafür ist die Liste da.'],
 'dead-air':['Totenstille','Ivo verfolgt das zweite Signal bis ins überflutete Marschland. Ada bietet an, im Feld einen tragbaren Empfänger zu bedienen, obwohl Rook sie hören kann. Schütze den Empfänger, während sie die Steuerfrequenz des Damms findet.',[
 ['Stelle den Empfänger auf','ADA: Dieser Empfänger wird Aufmerksamkeit erregen. Ich brauche eine freie Stellung und genug Zeit zum Abhören.'],['Schütze Adas Empfänger','ADA: Ich habe ein Trägersignal. Lass sie nicht an den Empfänger, während ich es isoliere.'],['Bringe die Frequenz zurück','ADA: Gefunden. Der Steuerkanal kommt von der nördlichen Eisstation.']],
 'ROOK: Ihr könnt das Tor stoppen oder eure Leute retten. Nicht beides. VOSS: Er will uns spalten. Wir gehen gemeinsam nach Norden.'],
 'ice-run':['Eislauf','Medizin für die Nordstationen muss den Pass überqueren, bevor er für den Winter schließt. Der Konvoi fährt blind durch den Weißen – und Rooks Beobachter sind schon entlang des Kamms eingegraben.',[
 ['Führe den Konvoi in den Weißen','IVO: Bleib vor dem führenden LKW. Im Schneetreiben folgen sie deiner Spur – oder gar keiner.'],
 ['Schütze den Medizinschlitten','SERA: Der Schlitten darf nicht getroffen werden. Sechs Stationen hängen an dieser Fahrt.'],
 ['Sieh den Konvoi über den Kamm','VOSS: Noch ein Kamm. Lass sie dir das letzte Stück nicht nehmen.']],
 'IVO: Der Konvoi ist durch, und der Pass gehört bis zur Schneeschmelze uns. SERA: Sechs Stationen werden den Frühling sehen. Die Liste wird kürzer, wenn der Norden hält.'],
 'white-noise':['Weißes Rauschen','Die nördliche Eisstation sendet nur kurz ein Autorisierungsfenster. Erreiche ihre Geräte, bevor es sich schließt, und bring Ivo den Schlüssel. Die Uhr läuft nur während einer aktiven Welle; verschwende die Gelegenheit nicht.',[
 ['Erreiche die Eisstation','IVO: Die Station wechselt ihren Autorisierungsschlüssel. Wir haben ein Zeitfenster, bevor er sich ändert.'],['Sichere den Sender','ADA: Ich kann den Schlüssel lesen, aber Gegner in Sendernähe stören das Signal.'],['Kehre mit dem Schlüssel zurück','IVO: Das ist der Schlüssel. Bring ihn zurück, bevor sich das Zeitfenster schließt.']],
 'IVO: Der Schlüssel funktioniert, aber es gibt zwei Sperren. Eine liegt am Umspannwerk. Die andere befindet sich in einer Stadt, die Rook bereits besetzt hat.'],
 'cold-start':['Kaltstart','Ein Winterriegel blockiert den gefrorenen Bahnknoten: Rooks Garnison hält das Stellwerk – und damit die Nordstrecke. Jenseits des ferneren Gleises fotografiert Ada einen Gefangenentransport auf dem Weg nach Norden.',[
 ['Nimm das Stellwerk','VOSS: Das Stellwerk ist das Schloss des ganzen Knotens. Nimm es, und die Nordstrecke öffnet sich.'],
 ['Brich die Garnisonsreserve','VOSS: Ihre Reserve kommt über das Eis. Brich sie, bevor sie sich an den Weichen eingräbt.'],
 ['Halte den Knoten über die Nacht','ADA: Ich habe den Transport auf Film – Gesichter, Nummern, alles. Halte den Knoten, damit es Voss erreicht.']],
 'ADA: Der Knoten ist unser und der Film ist draußen. Irgendwo in diesem Zug fährt ein Waggon mit Elias’ Namen darauf – und jetzt wissen wir welcher.'],
 'long-switch':['Die lange Umschaltung','Die erste Sperre des Damms hängt von einem abgelegenen Umspannwerk im verbrannten Buschland ab. Ivo muss den Strom umleiten, ohne das Krankenhaus abzuschalten. Sichere die Knotenpunkte und verteidige den Transformator, während er arbeitet.',[
 ['Öffne den Stromknoten','IVO: Das Krankenhaus und der Damm teilen sich diese Leitung. Leg den falschen Schalter um und Sera verliert ihre Patienten.'],['Sichere die Schaltanlage','SERA: Noch haben wir Licht. Räume die Anlage, damit Ivo die Leitung umschalten kann.'],['Schütze den Transformator','IVO: Umschaltung läuft. Wenn sie den Transformator zerstören, geht im Krankenhaus das Licht aus.']],
 'SERA: Das Licht ist an geblieben. IVO: Die erste Sperre ist isoliert. Der zweite Schlüssel gehört der gefangenen Anlagenleiterin der Stadt, Nia Reyes.'],
 'city-of-glass':['Eine Stadt unter Glas','Die besetzte Industriestadt ist voller verdeckter Sichtlinien und Patrouillen. Finde Nia Reyes, bevor Rook sie verlegt. Sie hat die zweite Sperre entworfen und weiß, warum er die Überflutung des Tals für notwendig hält.',[
 ['Schalte die Gefängniseskorte aus','VOSS: Schalte die Eskorte aus und erreiche dann den Haftort. Nia ist unser einziger Zugang zur zweiten Sperre.'],['Befreie Nia Reyes','NIA: Rook sagt, der Damm werde brechen, wenn er ihn nicht öffnet. Er irrt sich – aber das Tor ist bereits beschädigt.'],['Eskortiere Nia zur Kommandozentrale','NIA: Halt sie mir vom Leib. Ich kann beweisen, dass sich das Tor stabilisieren lässt, ohne das Tal zu überfluten.']],
 'NIA: Rook hatte den Befehl, das Tal aufzugeben. Er entschied sich, es zu überfluten, statt seine eigenen Leute zu gefährden. Das Tor lässt sich noch stoppen, aber jemand muss die Steuerleitung halten.'],
 'tidelock':['Tidelock','Nia kennt über eine Steuerleitung im Marschland einen Weg ins Dammnetz. Ada wird Rooks Truppen die Beweise senden, während du das Tor isolierst. Der Empfänger muss lange genug überleben, um sie zu übertragen.',[
 ['Verbinde die Steuerleitung','NIA: Das Tor steht unter Druck. Wenn wir den Strom zu schnell abschalten, öffnet es sich von selbst.'],['Schütze das Senderelais','ADA: Hier ist Ada Vale. Im Tal sind noch Zivilisten. Rooks Befehle werden sie ertränken. Bitte hört zu.'],['Isoliere die Torsteuerung','NIA: Einige seiner Einheiten stellen den Kampf ein. Räume die Steuerstellung; ich kann das Tor isolieren.']],
 'ROOK: Mein Befehl war, meine Truppen zu retten. VOSS: Dann hilf uns, alle zu retten. ROOK: Die letzte Übersteuerung liegt am Industrieturm. Von hier aus kann ich sie nicht stoppen.'],
 'last-transmission':['Die letzte Übertragung','Der Countdown der automatischen Übersteuerung läuft. Seras Evakuierung ist in Sicherheit und Nia am Tor. Du musst den Industrieturm erreichen und die letzte Verbindung trennen. Rooks verbliebene Getreue rücken weiter vor.',[
 ['Erreiche den Turmstromkreis','NIA: Ich kann das Tor nur stabilisieren, wenn du den Turmstromkreis öffnest. Ada führt dich hindurch.'],['Deaktiviere die Übersteuerung','ADA: Folge dem blauen Kabel. Für meinen Bruder und alle, die noch dort unten sind – zieh es heraus.'],['Halte durch, bis das Tor stabil ist','NIA: Übersteuerung getrennt. Das Tor braucht Zeit, um sich zu stabilisieren. Halte den Bunker; überlass ihnen die Leitung nicht wieder.'],['Bestätige, dass die Straße offen ist','SERA: Das Wasser sinkt. Komm nach Hause; wir zählen alle gemeinsam.']],
 'VOSS: Das Tor ist gesichert. Das Tal steht noch. ADA: Mein Bruder hat das Signal nie wieder gehört, aber die Menschen, die er gerettet hat, schon. SERA: Die Straße ist offen. Diesmal bekommt jeder eine Chance, nach Hause zu kommen.']
};
const entries={};
const add=(en,de)=>{if(typeof en==='string'&&typeof de==='string')entries[en]=de;};
for(const mission of CAMPAIGN){const entry=data[mission.id];if(!entry||entry[2].length!==mission.stages.length)throw Error(`Missing campaign translation: ${mission.id}`);add(mission.title,entry[0]);add(mission.briefing,entry[1]);add(mission.success,entry[3]);
 mission.stages.forEach((stage,i)=>{add(stage.label,entry[2][i][0]);add(stage.dialogue,entry[2][i][1]);});
 // Cinematics split authored conversations by speaker; translate the matching
 // individual segments too, retaining speaker identifiers and English fallback.
 const split=s=>s.split(/(?=\b(?:VOSS|ADA|IVO|SERA|NIA|ROOK|SURVIVORS):\s)/).map(x=>x.trim()).filter(Boolean);
 const en=split(mission.success),de=split(entry[3]);if(en.length===de.length)for(let i=0;i<en.length;i++){const a=en[i].match(/^[A-Z]+:\s*(.*)$/),b=de[i].match(/^[A-Z]+:\s*(.*)$/);if(a&&b)add(a[1],b[1]);}
 for(let i=0;i<mission.stages.length;i++){const a=mission.stages[i].dialogue.match(/^[A-Z]+:\s*(.*)$/),b=entry[2][i][1].match(/^[A-Z]+:\s*(.*)$/);if(a&&b)add(a[1],b[1]);}
}
add('ACT I · THE SILENCE','AKT I · DIE STILLE');add('ACT II · THE FLOOD','AKT II · DIE FLUT');add('ACT III · THE LAST LIGHT','AKT III · DAS LETZTE LICHT');
Object.assign(entries,{
 'CLASSIFIED':'GEHEIM','LOCKED':'GESPERRT','COMPLETED':'ABGESCHLOSSEN','NEXT MISSION':'NÄCHSTE MISSION',
 'The valley is safe. Revisit any completed mission.':'Das Tal ist sicher. Spiele abgeschlossene Missionen erneut.',
 'Your next mission awaits. {done} of {total} missions completed.':'Deine nächste Mission wartet. {done} von {total} Missionen abgeschlossen.',
 'A lost signal is only the beginning.':'Ein verlorenes Signal ist nur der Anfang.', '{done} / {total} COMPLETED':'{done} / {total} ABGESCHLOSSEN',
 'REPLAY FINAL MISSION →':'LETZTE MISSION ERNEUT SPIELEN →','CONTINUE STORY →':'GESCHICHTE FORTSETZEN →','BEGIN STORY →':'GESCHICHTE BEGINNEN →',
 'Select a mission':'Wähle eine Mission','Leave your party before changing solo operations.':'Verlasse deine Gruppe, bevor du Solo-Einsätze wechselst.',
 'Select a mission on the board or load this selection.':'Wähle eine Mission auf der Karte oder lade diese Auswahl.','Free play: random map and endless waves.':'Freies Spiel: Zufallskarte und endlose Wellen.',
 'No transmissions recorded yet. Start The Silent Signal to begin the story.':'Noch keine Funksprüche aufgezeichnet. Starte „Das verstummte Signal“, um die Geschichte zu beginnen.',
 'Previously: {text}':'Bisher: {text}','Available.':'Verfügbar.','Complete the previous mission first.':'Schließe zuerst die vorherige Mission ab.',
 'Free play: random map and endless waves. Campaign: {done} / {total} operations complete.':'Freies Spiel: Zufallskarte und endlose Wellen. Kampagne: {done} / {total} Einsätze abgeschlossen.',
 'BRIEFING':'EINSATZBESPRECHUNG','DEBRIEF':'NACHBESPRECHUNG','FIELD REPORT':'FELDBERICHT','DEPLOY':'EINSATZ STARTEN','VIEW RESULTS':'ERGEBNISSE ANZEIGEN',
 'OBJECTIVE {current} / {total}: {label}':'ZIEL {current} / {total}: {label}', 'PROTECT':'SCHÜTZEN','OBJECTIVE':'ZIEL',
 'Mission failed':'Mission gescheitert','Mission complete':'Mission abgeschlossen','The bunker was lost.':'Der Bunker wurde zerstört.',
 'Deploy the first wave to begin the mission.':'Starte die erste Welle, um die Mission zu beginnen.','Deploy the next wave to continue the objective.':'Starte die nächste Welle, um das Ziel fortzusetzen.',
 'Position contested! Eliminate nearby enemies to continue.':'Stellung umkämpft! Schalte Gegner in der Nähe aus, um fortzufahren.',
 '{seconds}s remaining. Protect the bunker.':'Noch {seconds} s. Schütze den Bunker.',
 '{asset} health: {health}%. Protect it for {seconds}s; nearby enemies damage it.':'{asset}: {health} % Gesundheit. Schütze das Ziel {seconds} s lang; Gegner in der Nähe beschädigen es.',
 'Escort the survivors to the marker. Health: {health}%.':'Eskortiere die Überlebenden zur Markierung. Gesundheit: {health} %.',
 'Defeat {count} more enemy units to break the escort.':'Besiege noch {count} Gegner, um die Eskorte auszuschalten.',
 'Hold the marked position for {seconds}s. Nearby enemies contest it.':'Halte die markierte Stellung {seconds} s lang. Gegner in der Nähe blockieren sie.',
 'Move to the marked location and hold for {seconds}s.':'Begib dich zur markierten Stelle und halte sie {seconds} s lang.',
 ' Mission time: {seconds}s (runs during waves).':' Missionszeit: {seconds} s (läuft während Wellen).',
 'Receiver':'Empfänger','Transformer':'Transformator','Fuel skid':'Treibstoffschlitten','Medicine sledge':'Medizinschlitten','Broadcast relay':'Senderelais',
 'IVO: The authorization window closed. We lost the key.':'IVO: Das Autorisierungsfenster ist geschlossen. Wir haben den Schlüssel verloren.',
 'SURVIVORS: We cannot make it. The rescue has failed.':'SURVIVORS: Wir schaffen es nicht. Die Rettung ist gescheitert.',
 '{asset} destroyed. The mission has failed.':'{asset} zerstört. Die Mission ist gescheitert.'
});
export const germanCampaign=Object.freeze(entries);
