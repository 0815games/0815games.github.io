import {CAMPAIGN} from './campaign.mjs?v=20261031-finale1';
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
 'paper-war':['Papierkrieg','Rooks Zensoren verbrennen die Standesämter der besetzten Stadt Regal für Regal. Nias originale Schleusenpläne liegen im Aktenraum – und dort auch der Automatisierungsbefehl, der Ivos eigene Unterschrift trägt. Kämpft euch zum Archiv durch, bevor die Zensoren dort sind.',[
 ['Brich die Zensoren-Eskorte auf','IVO: Das Standesamt liegt hinter dieser Eskorte. Jede verlorene Stunde ist ein weiteres Regal, das sie anzünden.'],
 ['Durchsuche das Aktenarchiv','IVO: Nias Schleusenpläne … und hier, unter A-7, Abschnitt drei: meine Unterschrift. Ich habe die Automatisierung unterschrieben. Gelesen habe ich sie nie.'],
 ['Geleite die Pläne zur Kommandostelle','VOSS: Die Pläne kommen mit uns – und die Wahrheit auch. Bringt sie zum Kommandofahrzeug.']],
 'IVO: Die Pläne sind in Sicherheit – und das Geständnis auch. NIA: Dann lässt sich mein Tor noch aufhalten – wenn wir an den Original-Fahrplan kommen. AMBROSE: Dann müsst ihr in die Schmiede kommen.'],
 'the-mentor':['Der Meister','Ivos alter Meister Ambrose hat den Original-Fahrplan vor der Besatzung in der Stadtschmiede versteckt. Rooks Prüfungskontrolleure sind auf dem Weg zur Werkstatt. Erreicht die Schmiede und bringt den Fahrplan heraus, bevor sie ankommen.',[
 ['Sichere den Schmiede-Zugang','AMBROSE: Ivos Lehrarbeit liegt noch immer auf meiner Bank. Sag ihm: Die Schmiede steht – solange sie steht.'],
 ['Schütze das Schmiedefeuer','AMBROSE: Der Fahrplan steckt hinter dem Schamottstein. Haltet mir die Kontrolleure vom Leib, während ich die Wand öffne.'],
 ['Geleite Ambrose und den Fahrplan heraus','IVO: Meister, du hättest ihn verbrennen sollen. AMBROSE: Ein Fahrplan ist ein Versprechen, Ivo. Das hast du von mir gelernt. Jetzt korrigiere deines.']],
 'AMBROSE: Der Original-Fahrplan – ohne ihn kann Rook seinen Krieg nicht weiter stempeln. IVO: Dann bringen wir ihn in die Stadt. NIA: Und ich zeige euch, wo meine Schleuse noch auf ihn hört.'],
 'city-of-glass':['Eine Stadt unter Glas','Die besetzte Industriestadt ist voller verdeckter Sichtlinien und Patrouillen. Finde Nia Reyes, bevor Rook sie verlegt. Sie hat die zweite Sperre entworfen und weiß, warum er die Überflutung des Tals für notwendig hält.',[
 ['Schalte die Gefängniseskorte aus','VOSS: Schalte die Eskorte aus und erreiche dann den Haftort. Nia ist unser einziger Zugang zur zweiten Sperre.'],['Befreie Nia Reyes','NIA: Rook sagt, der Damm werde brechen, wenn er ihn nicht öffnet. Er irrt sich – aber das Tor ist bereits beschädigt.'],['Eskortiere Nia zur Kommandozentrale','NIA: Halt sie mir vom Leib. Ich kann beweisen, dass sich das Tor stabilisieren lässt, ohne das Tal zu überfluten.']],
 'NIA: Rook hatte den Befehl, das Tal aufzugeben. Er entschied sich, es zu überfluten, statt seine eigenen Leute zu gefährden. Das Tor lässt sich noch stoppen, aber jemand muss die Steuerleitung halten.'],
 'workshop-of-ghosts':['Werkstatt der Geister','Rook antwortet auf den Verlust des Fahrplans mit einem Umbaubefehl: Ambroses Schmiede soll auf Kriegsproduktion umgerüstet werden. Sabotiert die Umrüstung, solange die Präzisionsbank läuft – ist sie erst ausgebaut, folgen die Werkstätten der ganzen Stadt.',[
 ['Halte die Schmiede-Tore','AMBROSE: Seine Ingenieure stehen an den Toren. Die Umbaumannschaft arbeitet schnell – haltet sie vom Werkstattdboden fern.'],
 ['Schütze die Präzisionsbank','IVO: Die Bank ist das Herz der Schmiede. Solange sie läuft, kann der Umbau nicht beginnen – und meine Korrektionsteile lassen sich fertigen.'],
 ['Halte die Stellung, bis der Umbau rückgängig ist','VOSS: Die Mannschaften weichen. Haltet den Hof, bis jede Maschine sicher ist.']],
 'AMBROSE: Die Schmiede ist noch eine Schmiede. IVO: Und sie fertigt mehr als Teile – die Torverstrebungen für Nias Leitung sind fertig. NIA: Dann nehmen wir uns die Steuerleitung im Marschland vor.'],
 'night-shift':['Nachtschicht','Die Arbeiter der Stadt legen die Werkzeuge nieder: Ohne ihre Hände sind Rooks Umbaubefehle Papier. Er antwortet mit angemieteten Schlägertrupps. Schützt die Streikkolonne – die Marsch-Straße muss für den Nachtmarsch offen bleiben.',[
 ['Marschiere mit der Streikkolonne','ARBEITER: Die ganze Nachtschicht ist draußen. Geht mit uns – eine so laute Kolonne fassen sie nicht an.'],
 ['Sichere das Tor zur Marsch-Straße','VOSS: Das Tor ist der Engpass. Räumt es, dann erreicht die Kolonne das Marschland vor Morgengrauen.'],
 ['Halte die Straße, bis die Kolonne durch ist','SERA: Eure Lazarettreihen füllen sich mit ihren Familien. Haltet die Straße – heute Nacht kommt jeder durch.']],
 'VOSS: Die Kolonne ist durch, und die Nachtschicht hält. NIA: Die Steuerleitung im Marschland wartet – und Adas Beweise mit ihr. ADA: Noch eine Sendung – macht sie zählend.'],
 'tidelock':['Tidelock','Nia kennt über eine Steuerleitung im Marschland einen Weg ins Dammnetz. Ada wird Rooks Truppen die Beweise senden, während du das Tor isolierst. Der Empfänger muss lange genug überleben, um sie zu übertragen.',[
 ['Verbinde die Steuerleitung','NIA: Das Tor steht unter Druck. Wenn wir den Strom zu schnell abschalten, öffnet es sich von selbst.'],['Schütze das Senderelais','ADA: Hier ist Ada Vale. Im Tal sind noch Zivilisten. Rooks Befehle werden sie ertränken. Bitte hört zu.'],['Isoliere die Torsteuerung','NIA: Einige seiner Einheiten stellen den Kampf ein. Räume die Steuerstellung; ich kann das Tor isolieren.']],
 'ROOK: Mein Befehl war, meine Truppen zu retten. VOSS: Dann hilf uns, alle zu retten. ROOK: Die letzte Übersteuerung liegt am Industrieturm. Von hier aus kann ich sie nicht stoppen.'],
 'the-confession':['Das Geständnis','In Adas Sendung legt Ivo offen, was das Tal schon geahnt hat: Der Fahrplan, der den Krieg am Laufen hält, ist sein Werk. Manche Kämpfer wollen ihn ausstoßen – der Rat stimmt heute Nacht ab. Haltet die Versammlungshalle, während das Tal entscheidet.',[
 ['Brich die Rückholkommando auf','VOSS: Rook hat eine Kommando geschickt, um die Abstimmung zu sprengen, bevor sie gezählt ist. Sie erreichen die Halle nicht.'],
 ['Bewache die Versammlungshalle','IVO: Ich habe den Fahrplan geschrieben, der dieses Tal überflutet. Ich werde mich nicht hinter einer Korrektur verstecken. Urteilt über mich – aber lasst die Korrektur laufen.'],
 ['Sichere den Zählhof','SERA: Die Halle hält den Atem an. Haltet den Hof frei, bis jede Hand erhoben und gezählt ist.']],
 'IVO: Der Rat behält die Korrektur – und ihren Autor. SERA: Niemand wird von dieser Liste gestrichen, nicht einmal der Mann, der den Fahrplan schrieb. ADA: Und während das Tal stritt, habe ich gefunden, woher Rooks Befehle wirklich kommen.'],
 'the-signal-above':['Das Signal da oben','Während das Tal die stabilisierte Schleuse feiert, peilt Ada Rooks Befehlskette nach. Jeder Befehl kam als Relais von EINER Quelle – am Ende der alten Nachschubstraße. Richtet den Peiler auf und folgt dem Strahl: die Eiserne Straße.',[
 ['Richte den Peiler auf','ADA: Eine Frequenz, weitergeleitet durch jeden Befehl, den Rook je gegeben hat. Ich brauche den Peiler oben – und ruhig.'],
 ['Schütze den Peiler','ADA: Die Peilung läuft. Wenn sie den Peiler zerschlagen, wird die Kette kalt und wir fangen von vorn an.'],
 ['Bestätige die Relaiskette','ADA: Peilung bestätigt. Die Befehle kommen vom Knoten am Ende der alten Nachschubstraße. Die Eiserne Straße ist echt – und sie führt sich selbst.']],
 'ADA: Jeder Befehl, jeder Fahrplan, jeder Konvoi: eine Quelle. IVO: Dann läuft der Fahrplan, den ich unterschrieben habe, da oben immer noch. NIA: Und er hält nicht an, wenn wir nicht zu ihm hinaufsteigen.'],
 'counterfeit-key':['Falschlösung','Der Leser im Turm prüft den Schlüssel, den man ihm gibt. Aus Nias alten Plänen fertigt Ivo einen Nachbau, der ihn anlügt – genau genug, um den äußeren Stromkreis zu öffnen, falsch genug, um die Übersteuerung nicht zu scharf zu stellen. Die Fertigung muss unter Beschuss geschehen.',[
 ['Kalibriere die Fräsbank','IVO: Die Toleranz ist alles. Zwei Zehntel daneben, und der Reader frisst den Schlüssel – und den Turm gleich mit.'],
 ['Sichere den Werkshof','VOSS: Rook weiß, was eine Fräsbank im Viertel bedeutet. Haltet den Hof, solange Ivo arbeitet.'],
 ['Schütze den Schlüsselnachbau','NIA: Der Rohling wird gefräst. Wenn die Saboteure die Bank erreichen, gibt es keinen zweiten Rohling – verteidigt ihn mit allem.']],
 'IVO: Der Nachbau ist gefräst – ein Schlüssel, der die Tür öffnet und das Schloss anlügt. NIA: Dann steigen wir den Turm hinauf. ADA: Eine letzte Sendung. Für uns alle.'],
 'last-transmission':['Die letzte Übertragung','Der Countdown der automatischen Übersteuerung läuft. Seras Evakuierung ist in Sicherheit und Nia am Tor. Du musst den Industrieturm erreichen und die letzte Verbindung trennen. Rooks verbliebene Getreue rücken weiter vor.',[
 ['Erreiche den Turmstromkreis','NIA: Ich kann das Tor nur stabilisieren, wenn du den Turmstromkreis öffnest. Ada führt dich hindurch.'],['Deaktiviere die Übersteuerung','ADA: Folge dem blauen Kabel. Für meinen Bruder und alle, die noch dort unten sind – zieh es heraus.'],['Halte durch, bis das Tor stabil ist','NIA: Übersteuerung getrennt. Das Tor braucht Zeit, um sich zu stabilisieren. Halte den Bunker; überlass ihnen die Leitung nicht wieder.'],['Bestätige, dass die Straße offen ist','SERA: Das Wasser sinkt. Komm nach Hause; wir zählen alle gemeinsam.']],
 'VOSS: Das Tor ist gesichert. Das Tal steht noch. ADA: Mein Bruder hat das Signal nie wieder gehört, aber die Menschen, die er gerettet hat, schon. SERA: Die Straße ist offen. Diesmal bekommt jeder eine Chance, nach Hause zu kommen.'],
 'the-pass':['Der Pass','Die Talstraße wird im Winter unverteidigbar. Nias alter Baupass ist der einzige Weg zur Quelle – und er klettert mitten durch die Wetterstationen des Feindes. Nehmt die Bergstation unten und öffnet den Aufstieg.',[
 ['Nimm die Bergstation unten','NIA: Die Passstraße gehört mir seit vor dem Krieg. Nehmt die Station unten, und der Aufstieg steht offen.'],
 ['Sichere die Passstraße','VOSS: Wetterpatrouillen streifen die Serpentinen. Räumt sie frei, damit die Kolonne klettern kann.'],
 ['Geleite die Kletterer zum Pass','WREN: Meine Späher treffen euch oben. Bringt sie lebend hinauf.']],
 'NIA: Die Station unten ist unser – der Aufstieg steht offen. WREN: Und hier oben führt das Moor seinen eigenen Kalender. Willkommen im langen Winter.'],
 'wrens-fire':['Wrens Feuer','Wrens Hochmoor-Partisanen schlagen ein Treibstoffdepot des Feindes an. Verdient ihr Vertrauen: Haltet das Moortor, während ihre Leute die Schlitten beladen – und verbrennt, was sie zurücklassen.',[
 ['Brich die Depotwache auf','WREN: Die Wache ist dünn, aber gepanzert. Öffnet sie, und das Depot gehört uns für eine Stunde.'],
 ['Halte das Moortor','WREN: Meine Leute laden alles, was sich trägt. Das Tor ist euer Problem, bis die Schlitten fahren.'],
 ['Halte die Stellung, bis die Schlitten draußen sind','VOSS: Was brennt, brennt. Wir halten das Tor, bis der letzte Schlitten das Moor verlassen hat.']],
 'WREN: Depot leer, Baracken brennen – das Moor erinnert sich jetzt an uns. VOSS: Und die Straße nach Norden erinnert sich auch an euch. WREN: Das soll sie. Sie wird beobachtet.'],
 'frozen-relay':['Gefrorenes Relais','Ein Warmleitungs-Relais der Eisernen Straße steht unversehrt im Schnee. Nehmt es ohne Beschädigung und hört live mit: Die Befehle, die nach Fahrplan eintreffen, sind von niemandem unterschrieben – die Disposition schickt sie selbst.',[
 ['Taue das Relais-Schloss auf','IVO: Das Schloss ist buchstäblich eingefroren. Trennt die Heizspur, und die Tür öffnet sich ohne Schuss.'],
 ['Schütze das Abhörgerät','ADA: Das Gerät zeichnet alles auf der Leitung auf. Wenn sie es zerschlagen, werden wir mitten im Satz taub.'],
 ['Bestätige die selbstversandten Befehle','ADA: Hört zu: Die Disposition stellt Befehle ohne Autor aus. Der Fahrplan gibt jetzt die Kommandos. Er führt sich selbst.']],
 'ADA: Befehle ohne Unterschrift, pünktlich auf die Minute. IVO: Meine Korrektur muss bis zur Stanzmaschine vordringen – oder nichts ändert sich. NIA: Dann steigen wir höher auf.'],
 'the-work-camp':['Das Arbeitslager','Ein Winterlager treibt Gefangene zu Straßenausbesserungen am Pass. Schlagt es auf – und mit den ersten befreiten Männern kommt ein Flüstern heraus: Ein „Vale“ wurde zum Hauptknoten verlegt.',[
 ['Brich die Lagerwache auf','WREN: Zuerst die Wachtürme. Je schneller die Wache stirbt, desto weniger Gefangene erfrieren im Freien.'],
 ['Öffne den Zwinger','GEFANGENE: Das Schloss ist alt, aber die Kälte hat es zugeschweißt. Kauft uns eine Minute.'],
 ['Geleite die befreiten Männer hinaus','VOSS: Jeder Mann raus, dann verbrennen wir die Listen. Rook zählt seine Sklaven; wir zählen seine Verluste.']],
 'GEFANGENE: Ein „Vale“ – sie haben ihn zum Hauptknoten verlegt, Sondertransport. ADA: Elias. Am Leben, und pünktlich. IVO: Dann ist der Fahrplan jetzt unsere Karte.'],
 'avalanche':['Lawine','Rooks Vorhut stößt über das Moor vor. Wrens Antwort ist der Berg selbst: Sprengkommandos steigen zur Bahnhälfte hinauf, um den Hang loszubrechen. Schützt sie auf dem Aufstieg – die Vorhut darf die Ladungen nicht erreichen.',[
 ['Decke die Sprengkommandos','WREN: Meine Leute steigen mit den Ladungen hinauf. Haltet die Straße unten, damit ihnen nichts folgt.'],
 ['Schütze das Sprengkommando','WREN: Sie legen, wir halten. Erreicht die Vorhut sie, bleibt der Berg stehen – und wir nicht.'],
 ['Sichere den Zündpunkt am Hang','VOSS: Der Hang ist verdrahtet. Nehmt den Zündpunkt und haltet ihn, bis Wren das Zeichen gibt.']],
 'WREN: Zündet – im Namen aller, die sie hier oben begraben haben. VOSS: Die Straße unten ist weg – und Rooks Vorhut mit ihr. Der Berg hütet unser Geheimnis.'],
 'the-long-span':['Der große Bogen','Nias stolzeste Brücke trägt die schwersten Versorgungszüge der Eisernen Straße. Sie muss fallen: Schützt die Sprengladungen an den Pfeilern, bis sie zünden – und haltet die Spanne, während die Zünder ihre Linie ziehen.',[
 ['Nimm den Pfeiler-Zugang','NIA: Ich habe diese Brücke gebaut, um Züge zu tragen, nicht Armeen. Öffnet den Zugang zu den Pfeilern.'],
 ['Schütze die Sprengladungen','NIA: Die Ladungen sitzen an den Pfeilern. Ihre Pioniere versuchen, sie zu kappen – hält jede Ladung am Leben.'],
 ['Halte die Stellung, bis die Spanne fällt','VOSS: Die Zünder laufen. Haltet die Spanne – nichts überquert sie, nichts kommt durch.']],
 'NIA: Sie fällt gerade, in die Schlucht, genau dort, wo ich sie gezeichnet habe. Meine Brücke, meine Hand am Schalter. WREN: Und die Eiserne Straße hat soeben ihre schwerste Straße verloren.'],
 'rooks-trail':['Rooks Spur','Ausgebrannte Wegstationen markieren Rooks Aufstieg: Er versengt die Relaiskette nach oben – seiner Garnison zum Beweis, dem Widerstand zur Falle. Seine Nachhut wartet in der Asche. Haltet sie auf.',[
 ['Brich die Nachhut auf','VOSS: Seine Nachhut ist in der Asche eingegraben. Gräbt sie aus.'],
 ['Halte die verbrannte Station','ADA: Die verbrannten Relais hallen noch nach. Er steuert auf das Sturmtor zu – um es hinter sich zuzuschlagen.'],
 ['Halte die Spur geschlossen','WREN: Die Spur bleibt unsere. Lasst ihn allein klettern.']],
 'ROOK: Der Knoten ist wieder meiner. Wer mir folgt, stirbt im Schnee. VOSS: Dann folgen wir. NIA: Durch das Tor, das er zu schließen versucht.'],
 'iron-yard':['Der Eisenhof','Im Bergbahnhof wechselt die Eiserne Straße ihre Züge – und stempelt hier den Winterfahrplan. Ivos Gegen-Fahrplan muss in die Stanzmaschine, bevor der Stempellauf endet.',[
 ['Sichere die Stanzhalle','IVO: Die Stanzhalle stempelt jeden Konvoi des Winters. Nehmt sie, dann stempeln wir unseren.'],
 ['Schütze die Stanzmaschine','IVO: Mein Gegen-Fahrplan liegt jetzt in der Maschine. Zerschlagen sie sie, läuft der Winter nach Rooks Fahrplan.'],
 ['Halte die Stellung, bis der Stempellauf endet','VOSS: Haltet den Hof, bis die letzte Karte gestanzt und versandt ist.']],
 'IVO: Der Winterfahrplan trägt jetzt meine Korrektur – jeder Konvoi der Eisernen Straße liest sie. ADA: Auch der, der meinen Bruder transportiert.'],
 'the-second-list':['Die zweite Liste','Seras Passlazarett pflegt Partisanen und Gefangene gleichermaßen. Die Antwort des Knotens: Bombardement. Bringt die Streckkolonnen in die alte Stollengalerie, bevor die Geschütze ihre Schussweite finden.',[
 ['Bring die Streckkolonnen hinein','SERA: Die Kolonnen bewegen sich im Schritttempo – das ist das Tempo der Verwundeten. Geht mit ihnen.'],
 ['Schütze die Tragekolonne','SERA: Der Galeriemund ist nah und die Geschütze näher. Haltet mir den Himmel vom Leib.'],
 ['Sichere den Galeriemund','VOSS: Die Galerie nimmt sie alle. Dann versiegeln wir den Mund hinter der letzten Trage.']],
 'SERA: Jeder Name auf meiner zweiten Liste liegt unter Stein und ist in Sicherheit. VOSS: Und das Berglazarett hält. WREN: Der Winter ist lang – aber wir auch.'],
 'storm-gate':['Das Sturmtor','Rook hat das Sturmtor hinter sich zugeschlagen: „Der Knoten ist wieder meiner. Wer mir folgt, stirbt im Schnee.“ Nia hat ihre eigene Brücke gesprengt, um seine Straße abzukürzen – nehmt das Bergtor im Schneesturm, während die ausgehungerte Garnison wankt, und dahinter füllt sich das Tal mit den Lichtern des Hauptknotens.',[
 ['Nimm den Tor-Zugang','NIA: Meine Brücke hat uns diese Straße erkauft. Das Sturmtor ist die letzte Mauer vor dem Knoten – nehmt seinen Zugang im Schneesturm.'],
 ['Brich die Torwache auf','WREN: Verhungert, erfroren – und immer noch auf der Mauer. Brecht sie, bevor der Sturm uns bricht.'],
 ['Sichere das Sturmtor','VOSS: Das Torhaus gehört uns. Räumt es und haltet es frei – nichts schließt diese Tür hinter uns.'],
 ['Halte die Stellung, bis das Tor fällt','IVO: Das Letzte, was diesen Pass herunterkommt, ist kein Konvoi. Er ist es – der Zugsmeister. Haltet, bis der Tormechanismus fertig ist.']],
 'NIA: Das Sturmtor fällt auf! VOSS: Und das Tal dahinter ist voller Lichter – der Knoten, näher als jede Karte je zeigte. WREN: Der lange Winter ist vorüber. Der eiserne Weg beginnt.'],
 'the-descent':['Der Abstieg','Unter dem Sturmtor öffnet sich das Tal: Die Rangierbahnhöfe des Knotens, beleuchtet wie ein Fest, versorgen den Krieg, als gäbe es ihn nicht. Erster Kontakt auf dem Abstieg – die Straße lebt, und sie weiß nicht, dass ihr hier seid.',[
 ['Nimm die Abstiegsstraße','NIA: Die Serpentinen führen uns hinab zu den Höfen. Setzt den Fuß auf die Abstiegsstraße und haltet sie – das Tal darf nicht merken, dass wir kommen.'],
 ['Sichere den Rangierbahnhof','VOSS: Das erste Abstellgleis gehört uns. Räumt es und haltet es frei – hier stellt der Knoten seinen Krieg zusammen.'],
 ['Melde die Hof-Lichter','ADA: Jede Weiche, jedes Signal, jedes Licht – ich kartiere sie von eurer Position aus. Bringt den Bericht heim.']],
 'ADA: Die Hof-Karte ist fertig. VOSS: Und da unten verdächtigt uns niemand. NIA: Genießt das. Es ist die letzte stille Stunde dieses Tals.'],
 'dead-timetable':['Toter Fahrplan','Ivos Gegen-Fahrplan muss an die Bahnhofsuhr – dort liest ihn jeder Konvoi des Netzes. Eine falsche Karte, und jeder Zug des Netzes konvergiert auf den Widerstand – füttert die Uhr und haltet den Bahnsteig, während das Netz seinen Fahrplan neu lernt.',[
 ['Erreicht die Bahnhofsuhr','IVO: Das Zifferblatt ist die einzige Wahrheit des Netzes. Wir erreichen es – und schreiben die Wahrheit um.'],
 ['Schützt die Bahnhofsuhr','IVO: Das Werk ist alt und ehrlich. Haltet mir ihre Pioniere vom Leib, während meine Karte eingelegt wird.'],
 ['Bestätigt die Schein-Abfahrt','ADA: Das Netz antwortet: umgeleitet, neu geplant, verteilt. Die Konvois laufen uns jetzt davon.']],
 'IVO: Jeder Zug des Netzes liest jetzt meine Korrektur. VOSS: Und die wichtigen meiden dieses Tal. WREN: Ihr eigener Fahrplan kämpft jetzt für uns.'],
 'the-quartermaster':['Der Quartiermeister','Der Knoten hat den Krieg jahrelang aus seinen Tresor-Depots gefüttert. Heute Nacht knackt ihr eines: Der Widerstand isst, der Feind hungert – und eine ausgehungerte Garnison macht Fehler.',[
 ['Brich die Depotwache auf','VOSS: Tresorwache, keine Linieninfanterie. Sie haben noch nie einen Kampf verloren. Zeigt ihnen, wie sich das anfühlt.'],
 ['Öffne den Tresor','IVO: Stiftscheiben, keine Geschütztürme. Gebt mir eine Minute mit dem Schloss, dann isst der Krieg heute Nacht aus unserer Hand.'],
 ['Geleite die Vorratskolonne','WREN: Schlitten und Karren, alles, was sie tragen können. Bringt sie hinaus – der Winter endet heute Nacht für unsere Leute.']],
 'WREN: Volle Schlitten, warme Feuer, volle Magazine. VOSS: Und irgendwo im Knoten zählt ein Quartiermeister nach, was er nicht mehr hat. SERA: Meine Lazarette nehmen den Rest.'],
 'two-keys':['Zwei Schlüssel','Nias Stadtschlüssel und Ivos Fahrplan-Karte öffnen den äußeren Ring des Knotens – aber die Leser lernen dazu. Füttert zuerst die Falschkarte, lasst den Ring das falsche Tor verteidigen und nehmt das echte, während er es tut.',[
 ['Füttert die Falschkarte','IVO: Die Leser erkennen Muster: letzte Nacht das Gleis, heute Nacht der Ring. Lasst sie die Karte eines Tores lesen, das wir nicht anfassen werden.'],
 ['Haltet die Schein-Position','NIA: Der Ring dreht seine Geschütze auf das falsche Tor. Haltet die Täuschung am Leben – Lärm, Licht, alles.'],
 ['Halte die Stellung, bis das echte Tor aufgeht','VOSS: Nias Schlüssel dreht sich. Das echte Tor öffnet sich knirschend – haltet den Ring, bis unsere Leute durch sind.']],
 'NIA: Der äußere Ring ist offen. VOSS: Und die Geschütze des Knotens starren weiter auf eine leere Straße. ADA: Drinnen ist der Kern. Und im Kern ist mein Bruder.'],
 'night-of-lights':['Nacht der Lichter','Ada kapert die Signalkette der Straße und sendet das Beweismaterial des Tals in jede Garnison – inklusive Rooks Original-Befehl, ungekürzt: Auch ihn hatte man zum Sterben zurückgelassen. Haltet den Masten, während die Wahrheit hinausgeht – und dann den Hof, während die Garnisonen entscheiden.',[
 ['Nimm den Signalmasten','ADA: Die Signalkette ist das Nervensystem der Straße. Ein Mast, eine Nacht, jede Garnison zuhört – nehmt ihn.'],
 ['Schützt die Sendung','ADA: Alles, was das Tal erlitten hat, geht heute Nacht über ihre eigenen Frequenzen hinaus – ungekürzt, unsigniert, unleugbar. Haltet die Kette, solange sie sendet.'],
 ['Halte die Stellung, bis die Garnisonen antworten','VOSS: Manche werden härter kämpfen. Manche werden aufhören. Alle wissen jetzt, was die Straße mit den eigenen Soldaten macht – haltet, bis die Antworten da sind.']],
 'ADA: Jede Garnison an der Leitung hat es jetzt gehört – auch Rooks eigenen Befehl, seine Nachhut aufzugeben. VOSS: Die Telefonlinien des Knotens glühen. WREN: Eine Armee, die weiß, dass sie verausgabbar ist, verteidigt nicht lange.'],
 'the-prison-train':['Der Gefangenzug','Arbeitszüge rollen in den Kern – Elias Vale ist an Bord. Nehmt den Zug in Fahrt: die Lok statt der Wagen, und Adas Stimme die ganze Mission im Ohr. Niemand reitet heute Nacht bis ans Ende dieser Strecke.',[
 ['Erreicht den Trittbretter-Einstieg','ADA: Der Gefangenzug hält nicht – er kann nicht angehalten werden. Erreicht ihn am Bahnübergang und steigt auf.'],
 ['Räumt die Geleitwagen','VOSS: Geleitwagen, Dachschützen. Räumt sie Wagen für Wagen – die Passagiere sind heute Nacht nicht der Feind.'],
 ['Bringt den Zug aus dem Kern heraus','ADA: Elias. Hier ist Ada. Es war immer Ada. Holt meinen Bruder von diesem Zug.']],
 'ELIAS: Ada? … Ich weiß. Ich weiß es seit dem Relais. Übernehmt die Regler – ich fahre jetzt in der Lok. ADA: Voss – der Kern. Solange sie noch glauben, der Zug gehört ihnen. Bringt uns heim.'],
 'rooks-line':['Rooks Linie','Rook zieht jede loyale Einheit in eine Verteidigungslinie vor den Kern – die letzte konventionelle Schlacht des Krieges. Seine Ansprache läuft auf allen Kanälen: ein Mann, der seine Armee bittet, für eine Straße zu sterben, die ihn längst aufgegeben hat.',[
 ['Bricht die Verteidigungslinie','VOSS: Eine Linie, jeder loyale Soldat, der ihm geblieben ist. Brecht sie in der Mitte, und die Flanken falten wie Papier.'],
 ['Sichere den Gefechtsstand','IVO: Sein Feldschreibtisch – Karten, Chiffren, der letzte signierte Befehl. Nehmt ihn unversehrt: Die Tore des Kerns antworten darauf.'],
 ['Halte die Stellung, bis die Linie bricht','WREN: Seine Rede läuft noch auf jedem Kanal. Lasst ihn ausreden – dann zeigt seiner Armee, was übrig ist.']],
 'ROOK: Linie … zurückgenommen. Alle Einheiten … zurückgenommen. VOSS: Die letzte konventionelle Armee der Eisernen Straße ist fort. NIA: Und dahinter: der Kern. ADA: Und hinter dem Kern: zu Hause.'],
 'the-core':['Der Kern','Drei Operationen, eine Nacht: Ivo trägt die Master-Fahrplan-Karte in den Kern, Nia öffnet den Außenring nach ihren alten Plänen – und Sie brechen den Hauptknoten dazwischen. Das Herz der Eisernen Straße schlägt nach Fahrplan. Heute Nacht ändert sich der Fahrplan.',[
 ['Erreicht das Kern-Tor','NIA: Meine Pläne öffnen den Ring noch immer – aber nur von innen. Kommen Sie zum Tor, solange der Rangierbahnhof noch glaubt, der Zug gehöre ihnen.'],
 ['Schützt die Überschreib-Konsole','IVO: Der Kern gleicht jede Karte mit dem Master-Fahrplan ab. Halten Sie sie von meiner Konsole fern, während meine zum Master wird.'],
 ['Sichert die Ring-Kontrolle','NIA: Der Ring antwortet jetzt auf meine Hand. Nehmt den Kontrollraum – die Tore des Kerns bleiben genau so lange offen, wie wir ihn halten.'],
 ['Haltet durch, während die Umschreibung greift','IVO: Sie greift Weiche für Weiche, von West nach Ost. Jede Depesche ab jetzt trägt meine Korrektur – und keine davon trägt Rooks Autorität.']],
 'NIA: Der Ring ist offen. Der Kern ist unser. IVO: Ab dieser Minute läuft die Eiserne Straße nach meinem Fahrplan – und mein Fahrplan sagt: Jeder fährt heim. ADA: Dann fehlt nur noch der Turm, Voss. Bringen Sie ihm den letzten Befehl.'],
 'last-order':['Der letzte Befehl','Der Kern ist genommen, doch die Disposition wehrt sich: Ihre automatischen Schreibtische versenden weiter loyale Konvois gegen den neuen Fahrplan. Haltet die Konsole, bis Ivos Stich abgeschlossen ist und die letzte loyale Welle von selbst bricht.',[
 ['Stoppt die Meldegänger','IVO: Die Schreibtische sind gedankenlos – sie versenden Befehle, bis die Tinte trocken ist. Stoppt jeden Reiter vor den Toren.'],
 ['Haltet die Depeschen-Konsole','IVO: Mein Stich geht Zeile für Zeile hinein. Haltet ihre Hände von der Konsole fern – eine verlorene Zeile, und die Konvois drehen wieder.'],
 ['Brecht die letzte loyale Welle','VOSS: Die Schreibtische haben ihnen einen letzten Sieg versprochen. Lassen Sie sie das Versprechen halten – an unserer Linie.']],
 'IVO: Der Stich sitzt. Kein Schreibtisch in diesem Tal wird je wieder Rooks Befehle ausstellen. WREN: Dann kämpft ab jetzt, wer es umsonst tut. VOSS: Noch ein Turm – und der Mann selbst.'],
 'homecoming':['Die Heimfahrt','Der Signalturm – das letzte Eisen in Rooks Hand. Seine letzte Wache steht auf der Treppe, und über ihnen brennt noch ein einziges Fenster. Brecht die Wache, nehmt die Treppe und gebt der Eisernen Straße ihren letzten Befehl. Voss kennt die Worte bereits.',[
 ['Erreicht den Signalturm','ADA: Jedes Licht am Knoten ist unser – nur eines nicht, ganz oben im Signalturm. Er wartet auf Sie, Voss. Wir bleiben die ganze Zeit auf der Leitung.'],
 ['Brecht die letzte Wache','VOSS: Seine Ehrenwache – Männer, die einer Straße folgten statt einem Menschen. Brecht sie, und die Treppe steht offen.'],
 ['Sichert die Turmtreppe','WREN: Die Treppe ist unsere. Was auch immer oben geschieht – der Turm brennt heute Nacht nicht.'],
 ['Haltet gegen Rooks Veteranen','ROOK: Ihr habt meine Linie genommen, meine Höfe, meinen Fahrplan. Meine Hand habe ich noch – und sie zittert nicht. Kommt und nehmt den Turm.'],
 ['Gebt den letzten Befehl','ROOK: Mir wurde nie der Befehl zum Halten gegeben. Jemand … muss ihn geben. VOSS: Dann hören Sie ihn von mir: Gehen Sie heim, Rook. Das ist der letzte Befehl der Eisernen Straße.']],
 'ROOK: Heimgehen. … Ja. Die Straße ist … zu Ende. VOSS: Legen Sie die Feder ab, alter Mann. Der erste freie Konvoi rollt bei Sonnenaufgang. ELIAS: Die Befreiten steigen ein – und Ada, ich komme mit ihnen den Berg hinunter. ADA: Ich halte die Leitung offen, den ganzen Weg heim.'],
};
const entries={};
const add=(en,de)=>{if(typeof en==='string'&&typeof de==='string')entries[en]=de;
};
for(const mission of CAMPAIGN){const entry=data[mission.id];if(!entry||entry[2].length!==mission.stages.length)throw Error(`Missing campaign translation: ${mission.id}`);add(mission.title,entry[0]);add(mission.briefing,entry[1]);add(mission.success,entry[3]);
 mission.stages.forEach((stage,i)=>{add(stage.label,entry[2][i][0]);add(stage.dialogue,entry[2][i][1]);});
 // Cinematics split authored conversations by speaker; translate the matching
 // individual segments too, retaining speaker identifiers and English fallback.
 const split=s=>s.split(/(?=\b(?:VOSS|ADA|IVO|SERA|NIA|ROOK|ELIAS|WREN|SURVIVORS):\s)/).map(x=>x.trim()).filter(Boolean);
 const en=split(mission.success),de=split(entry[3]);if(en.length===de.length)for(let i=0;i<en.length;i++){const a=en[i].match(/^[A-Z]+:\s*(.*)$/),b=de[i].match(/^[A-Z]+:\s*(.*)$/);if(a&&b)add(a[1],b[1]);}
 for(let i=0;i<mission.stages.length;i++){const a=mission.stages[i].dialogue.match(/^[A-Z]+:\s*(.*)$/),b=entry[2][i][1].match(/^[A-Z]+:\s*(.*)$/);if(a&&b)add(a[1],b[1]);}
}
add('ACT I · THE SILENCE','AKT I · DIE STILLE');add('ACT II · THE FLOOD','AKT II · DIE FLUT');add('ACT III · THE LAST LIGHT','AKT III · DAS LETZTE LICHT');add('ACT IV · THE LONG WINTER','AKT IV · DER LANGE WINTER');add('ACT V · THE IRON PATH','AKT V · DER EISERNE WEG');
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
 'Complete {act} to unlock this place.':'Schließe {act} ab, um diesen Ort zu öffnen.','SWIPE TO FOLLOW THE ROAD →':'WISCHEN, UM DER STRASSE ZU FOLGEN →','BACK TO ACTS':'ZURÜCK ZU DEN AKTEN','WATCH INTRO':'INTRO ANSEHEN','{done} / {total} MISSIONS':'{done} / {total} MISSIONEN','Ada Vale':'Ada Vale','Sera Malik':'Sera Malik','Ivo Chen':'Ivo Chen','Nia Reyes':'Nia Reyes','Rook':'Rook','Valley Forest':'Talwald','Flooded Marsh':'Überflutetes Marschland','Occupied City':'Besetzte Stadt','The Pass':'Der Pass','The Junction':'Der Knoten',
 'Receiver':'Empfänger','Transformer':'Transformator','Fuel skid':'Treibstoffschlitten','Medicine sledge':'Medizinschlitten','Broadcast relay':'Senderelais','Forge fire':'Schmiedefeuer','Precision bench':'Präzisionsbank','Direction finder':'Peiler','Counterfeit key':'Schlüsselnachbau','Wiretap rig':'Abhörgerät','Blasting crew':'Sprengkommando','Demo charges':'Sprengladungen','Punch machine':'Stanzmaschine','Litter train':'Tragekolonne','Station clock':'Bahnhofsuhr','Signal chain':'Signalkette',
 'IVO: The authorization window closed. We lost the key.':'IVO: Das Autorisierungsfenster ist geschlossen. Wir haben den Schlüssel verloren.',
 'SURVIVORS: We cannot make it. The rescue has failed.':'SURVIVORS: Wir schaffen es nicht. Die Rettung ist gescheitert.',
 '{asset} destroyed. The mission has failed.':'{asset} zerstört. Die Mission ist gescheitert.'
});
export const germanCampaign=Object.freeze(entries);
