# Changelog

## 2026-10-18 – 0.6.0-Vorbereitung: Angreiferbewegungen, Teil 4c

- Bestehende Kampfeffekte um dekorative Porträtbewegungen ergänzt: kurzer Heldenvorstoß beim normalen Nahkampf, ruhige Zaubergeste bei Projektilen und Heiltränken. Keine neuen Schadens-/Heilungsberechnungen.
- Bei einer Trefferreaktion des Helden gegnerischen Vorstoß nach 450 ms und Heldenrückstoß nach 520 ms darstellen; neue Angreiferbewegungen dauern 180 ms, Rückstoß endet nach 740 ms. Unveränderte 850-ms-Eingabefreigabe in combat-effects.js; Schadenszahlen und Modellzustand nicht verschoben. Rein visuelle Nachinszenierung, keine neue Zugreihenfolge.
- Bewegungen an vorhandenen Canvas-Elementen über die bestehende Web-Animations-/motions-Verwaltung. clear() bricht auch verzögert startende Bewegungen ab; bei Reduced Motion keine neuen Bewegungen. Fehlende oder fehlschlagende Animationsunterstützung blockiert nicht. Keine neue DOM-Ebene, Assets oder Render-Schleife.
- Zwölf Szenarien und 100 wiederholte Aktionen mit simuliertem DOM, Timern und Web Animations erfolgreich: Angreiferzuordnung, Vorstoß/Zaubergeste, Gegenangriff, Dauergrenzen, Abbruch/Bereinigung, verborgenes Spiel/Dokument, fehlendes Porträt, fehlende/fehlschlagende Animation und Reduced-Motion-Wechsel. Zusätzlich Node-Syntaxprüfung. Kein echter Browser-/Kampf-End-to-End- oder iPhone-Sichttest durchgeführt.
- Nur battle-fx.js und Changelog geändert. Eigene Klassenfähigkeits-Effekte in ability-animations.js, Kampfberechnung/-steuerung, Zeichenreihenfolge-Fix, Speicherformat und Versionsnummer unverändert. Visuelle Abnahme und Release-Freigabe 0.6.0 weiterhin offen.

## 2026-10-18 – Fix: Zeichenreihenfolge der Wanddekoration

- Codefix e587618b9fb412e2b2673e69cccaaed3343f1cba auf main: nachgelagerten draw-Wrapper entfernt; Installation ergänzt synchron nur noch Renderer.drawWallDecor. Keine verzögerte Neuzuweisung von draw und kein zusätzlicher Dekor-Aufruf nach der Vignette.
- Aktiver living-world-Renderer ruft Wanddekor genau einmal nach der Kachelschleife und vor floorAtmosphere/Licht, Treppen, Truhen, Figuren, Partikeln, Texten und Vignette auf. Basisrenderer hat ebenfalls einen ausdrücklichen frühen Aufruf nach den Kacheln.
- Bestehende Platzierung, Farben, Entdeckungsfilter, Viewport-Culling, Zeichenfunktion und Caches unverändert. Optionale Dekorfehler werden weiterhin einmalig gewarnt; übrige Zeichnung kann weiterlaufen.
- Neun isolierte Szenarien und 100 wiederholte simulierte Bilder erfolgreich: unveränderte draw-Identität bei Installation, einmalige Installation, Reihenfolge in Basis-/aktivem Renderpfad, kein Doppelpass, verborgenes Spiel/Dokument sowie Fehlerisolation. Keine vollständige Browser-/Canvas-Integration oder iPhone-Sichtprüfung durchgeführt.
- Geändert wurden ausschließlich living-world.js, render.js und wall-decor.js; dieser Dokumentationsnachtrag erfolgt separat. Steuerung, Spielwerte, Speicherformat und Versionsnummer unverändert.
- Der ältere Wanddekor-Eintrag beschreibt den damaligen nachgelagerten Zeichenpass und wird durch diese Korrektur ergänzt. Ingame-Changelog-Quelle/Parser, weitere Grafikarbeiten und Release-Freigabe bleiben separat offen.

## 2026-10-18 – 0.6.0-Vorbereitung: Feinschliff, Wanddekoration

- Zerrissene Wandbanner und eingelassene Wandreliefs als separate Dekoration ergänzt, farblich an die fünf vorhandenen Themen angepasst. Keine interaktiven Altäre oder neuen Gegenstände.
- Deterministische Platzierung anhand Karten-Seed und Wand-/Bodenstruktur: drei zusammenhängende Wandkacheln mit Boden davor, horizontaler Abstand über ein Vierer-Raster, bestehende Fackelplätze ausgeschlossen. Nicht jeder Raum erhält zwingend Dekoration.
- Zeichnung vollständig innerhalb von Wandkacheln und erst nach Entdeckung des betreffenden Wand-/Bodenabschnitts; außerhalb des Bildausschnitts keine Zeichnung. Kandidaten je Kachelarray/Seed und bis zu zehn 32-Pixel-Dekorgrafiken werden gecacht.
- Zusätzlicher statischer Zeichenpass nach dem aktiven Renderer, installiert zum DOM-Start; keine zweite requestAnimationFrame-Schleife. Bestehende Texturen, Licht-/Nebel- und Vignettenberechnung unverändert; Dekoration wird darüber gezeichnet. Optionale Dekorfehler einmalig als Warnung ausgegeben.
- Geändert: neues wall-decor.js, Anbindung in render.js und Changelog. Kartenlayout, Laufwege, Kollisionen, Themen-IDs, Spielstände und Versionsnummer unverändert.
- Isolierte Tests mit simuliertem DOM/Renderer erfolgreich: 100 Seeds mit 220 gültigen Platzierungen, deterministische Ausgabe, unveränderte Kacheln, Topologie/Fackelausschluss, Grafikcache, unentdeckte Bereiche, Viewport-Culling, ausgeglichene Canvas-save/restore-Aufrufe sowie einmalige Installation und Anbindung des zum DOM-Start aktiven Renderers. Kein Browser-/iPhone-Sicht- oder Leistungstest durchgeführt.
- Visuelle Abnahme und Gesamtprüfung 0.6.0 weiter offen; kein Release-Abschluss und keine neue Benutzerbestätigung für vorangegangene Grafikschritte.

## 2026-10-18 – 0.6.0-Vorbereitung: Umgebungsidentität, Teil 5

- Die fünf vorhandenen Themen beibehalten und durch sparsame Wand-/Bodenmotive differenziert: Katakomben mit Grabnischen und flachen Steinplatten, Pilzwald mit Wurzeln/Moos, Frostgruft mit Eislinien, Feuerschrein mit Brand-/Aschespuren, Schattenarena mit geometrischen Runenmustern.
- Motive in zwei von acht bestehenden Texturvarianten; zeichnen ausschließlich beim Aufbau gecachter 32-Pixel-Texturen. Keine neuen Assets, Imports oder Render-Schleifen. Kacheltyp 2 unverändert.
- Bestehende Themen-IDs, Ebenenfolge, Kartenlayout, Kollisionen, Entdeckung, Licht/Nebel, Gegner, Kampfkulisse und Spielstände unverändert. Keine überfluteten Räume, neuen Biome, Fallen, Lava- oder Wassermechaniken; keine großen Raumobjekte.
- 120 isolierte Zeichenfälle mit simuliertem Canvas erfolgreich: fünf Themen, drei Kacheltypen, acht Varianten. Determinismus, 32-Pixel-Grenzen, Canvas-Zustandswiederherstellung, sparsame Motivverteilung, unangetasteter Typ 2 und Katakomben-Fallback geprüft. Kein Browser-/iPhone-Sicht- oder Leistungstest durchgeführt.
- Geändert: living-world.js und Changelog. Dies ist der Textur-/Motivschritt für Punkt 5, keine vollständige Raumgestaltung. Visuelle Abnahme und Release-Abschluss 0.6.0 stehen aus; Versionsnummer unverändert.

## 2026-10-18 – 0.6.0-Vorbereitung: Gemeinsame Gegnergrafik, Teil 4b

- Den älteren lokalen Gegner-Painter im Kampffenster durch drawMonsterPortrait aus dem gemeinsamen monster.js ersetzt. Karte und Kampf nutzen dieselben zwölf Gegnertypen und dieselbe Boss-/Key-Erkennung.
- Kampfporträt auf dem bestehenden 112x112-Canvas mit 3-facher Skalierung und 8 Pixel Rand; Bildglättung beim Zeichnen deaktiviert, Canvas-Zustand anschließend wiederhergestellt.
- Optionaler showHealth-Parameter im gemeinsamen Painter: Karten-TP-Balken standardmäßig weiterhin sichtbar, im Kampfporträt abgeschaltet. Bestehende TP-Anzeige unter dem Porträt bleibt erhalten.
- Keine neue Render-Schleife: Kampfporträts bleiben ereignisbasiert mit fester Pose. Kartenanimationen, Canvas-Elemente, Effektziele, Buttons, Eingabesicherung, 850-ms-Freigabe und Kampfablauf unverändert.
- 260 Vergleichsfälle mit simuliertem Canvas erfolgreich: zwölf Formen plus Fallback, fünf TP-Werte, mit/ohne Elite-Kennzeichnung und Reduced Motion. Gemeinsame Zeichenbefehle, fehlender Porträt-TP-Streifen, vorhandener Karten-TP-Streifen, Canvas-Zustand, unveränderte eingefrorene Gegnerdaten und Boss-/Key-Fallback geprüft. Kein Browser-/Kampf-End-to-End- oder iPhone-Sichttest durchgeführt.
- Geändert: monster.js, combat-effects.js und Changelog. Kulisse aus Teil 4a, Heldenoptik, Gegenstandsdaten, Speicherformat und Versionsnummer unverändert. Teil 4/Release 0.6.0 noch nicht als vollständig getestet markiert.

## 2026-10-18 – 0.6.0-Vorbereitung: Kampfkulisse, Teil 4a

- Gemeinsame CSS-Kulisse hinter den beiden vorhandenen Kampfeinheiten: stilisiertes Mauerwerk, dunkle Bodenfläche, seitliche Lichtstimmungen und zentrales geometrisches Ornament. Fünf bestehende Umgebungsfarbstimmungen über data-battle-theme.
- Bossbegegnungen mit stärkerem Ornament und goldener Einfassung; keine neuen Bossmechaniken. Porträtrahmen zurückgenommen, Anzeigen mit dunklem Hintergrundverlauf und Textschatten.
- Vorhandene Canvas-Elemente, Effektziele, TP/MP-Anzeigen, Aktionsbuttons, kurze Bildschirmhöhen und Scrollmöglichkeiten bleiben erhalten. Dekorative Pseudoelemente sind nicht anklickbar; keine neuen Animationen oder Assets.
- Ausschließlich CSS-Regeln in combat-layout.js ergänzt. Kampfablauf, Eingabesicherung, Effekt-Timing und Versionsnummer unverändert.
- Statische Prüfung der 15 zusätzlichen CSS-Regeln erfolgreich: Parsing, auf den Kampfdialog begrenzte Selektoren, Umgebungsvarianten, nicht anklickbare Dekoration und keine neuen Ausblend-/Animationsregeln. Kein Browser-Layout-, Barrierefreiheits- oder iPhone-Leistungstest durchgeführt.
- Teil 4 noch nicht vollständig: Kampf verwendet weiterhin den bisherigen eigenen Gegner-Painter; Vereinheitlichung mit den neuen Kartengegnern und weitere Inszenierung folgen separat. Bestehende Nahkampf-, Projektil-, Heilungs- und Treffer-Effekte nicht doppelt implementiert.

## 2026-10-18 – 0.6.0-Vorbereitung: Heldenbewegung, Teil 3c

- Rein visuelle Stand-/Schrittpose in drawCharacter ergänzt: dezente Körperbewegung und abwechselnder Bein-/Stiefelversatz nach einem benachbarten Feldwechsel; Schrittphase endet nach 180 ms. Keine Positionsinterpolation, Richtungs-Sprites oder neue Animationsschleife.
- Animationszustand liegt in einer WeakMap je Canvas-Kontext, nicht in Spieler- oder Speicherdaten. Heldenwechsel, große Positionssprünge, längere Renderpausen und rückläufige Zeit setzen die Schrittphase zurück.
- Neue Pose nur auf Canvas stage, mit gültigen Koordinaten und lebendem Helden. Heldenvorschauen bleiben statisch; bei Reduced Motion sind die neuen Versätze null. Bereits vorhandenes äußeres Wippen im living-world-Renderer bleibt unverändert.
- Waffen-/Ausrüstungsoptik aus Teil 3a bleibt erhalten. Nur character.js und Changelog geändert; Gegner, Steuerung, Kollisionen, Laufgeschwindigkeit, Kämpfe, Kauf-/Speicherlogik und Versionsnummer unverändert.
- Geprüft: 16 Szenarioprüfungen und 1000 Zeitstichproben der Pose-Logik erfolgreich, darunter Schrittwechsel/-ende, Sprünge, Renderpausen, Heldenwechsel, ungültige Zeit/Koordinaten, tote Helden, Vorschau und reduzierte Bewegung. Keine vollständige Canvas-/Browser-Integration oder iPhone-Sicht-/Leistungsprüfung durchgeführt.
- Die geplanten Basisteile 3a/3b/3c sind damit implementiert; visuelle Abnahme steht aus. Release 0.6.0 bleibt in Vorbereitung. Frühere Hinweise auf noch ausstehende Heldenbewegungen dokumentieren den damaligen Stand.

## 2026-10-18 – 0.6.0-Vorbereitung: Gegneridentität, Teil 3b

- Eigenen Monster-Painter ergänzt und über Renderer.drawMonster angebunden; der aktive living-world-Renderer verwendet diese Methode bereits.
- Zwölf bestehende Gegnertypen zeichnerisch differenziert: Ratte, Fledermaus, Schleim, Spinne, Goblin, Skelett, Zombie, Wraith, Imp, Golem, Dämon und Gruftfürst. Unterschiede über Körperformen und Details statt nur Farben.
- Gruftfürst mit Krone, Robe und Stab; Boss-Erkennung auch über id="boss" oder key="lord", wenn shape im vorhandenen Spielstand fehlt.
- Dezente zusätzliche Flügel-, Bein-, Arm- und Schwanzbewegungen innerhalb der bestehenden Render-Schleife; reduzierte Bewegung wird berücksichtigt. Bestehende Schwebe-/Schleimanimationen bleiben erhalten.
- Optionales Elite-Abzeichen nur bei explizitem elite=true; keine neuen Elite-Spawns, Gegnerwerte oder Belohnungen. TP-Balken rein grafisch auf 0 bis 100 Prozent begrenzt, ohne TP zu verändern.
- 130 isolierte Gegnerfälle mit simuliertem Canvas erfolgreich: zwölf Typen plus Fallback, unterschiedliche TP-Werte einschließlich NaN und negative TP, mit/ohne Elite-Abzeichen; zusätzlich Boss-/Key-Fallback und konstante Bewegung bei Reduced Motion geprüft. Kein Browser-Sichttest oder iPhone-Leistungstest durchgeführt.
- Heldenbewegungen folgen separat als Teil 3c; Teil 3 und Release 0.6.0 sind noch nicht vollständig. Karte, Kollisionen, Kampfablauf, Gegenstandsdaten und Speicherung unverändert. Keine Benutzerbestätigung für Teil 2 oder 3a ergänzt.

## 2026-10-18 – 0.6.0-Vorbereitung: Heldenidentität, Teil 3a

- Gemeinsamen drawCharacter-Renderer für Karte und vorhandene Heldenvorschauen überarbeitet: Krieger mit breiteren Schultern, Arkanist mit längerer kontrastierter Robe, Schurke mit schmaler Silhouette, Mantel, Riemen und Maske.
- Waffenoptik anhand vorhandener IDs zugeordnet: Kristall-/Runenholz-/Finsternisstäbe sowie alle Ordens- und Notstäbe als Stab; Knochen-/Nachtzahn-/Ordens-/Notdolche als Dolch statt Langschwert. Keine Waffe wird bei leerem Haupthandslot erfunden.
- Vorhandene Ausrüstung besser sichtbar: Wächterharnisch, Knochenpanzer, Wächter-/Ordenshelme, Runen-/Ordensschilde, angelegte Stiefel und Obsidian-/Ordensringe. Keine individuellen Modelle für jede Gegenstandsstufe.
- 70 Waffen-Zuordnungen und 176 deterministische Zeichentests mit simuliertem Canvas erfolgreich: Klassen/Fallback, leere und belegte Ausrüstung, Karten- und Vorschaugröße, endliche Koordinaten, Canvas-Zustandswiederherstellung und unveränderte eingefrorene Spielerdaten. Kein Browser-Sichttest oder iPhone-Leistungstest durchgeführt.
- Nur character.js und Changelog geändert. Gegner, neue Laufanimationen, Kampfansicht, Gegenstandsdaten, Spielwerte, Speicherformat, Dungeon-Tiefe und Licht bleiben unverändert. Teil 3 ist damit noch nicht vollständig umgesetzt; Versionsnummer bleibt unverändert.
- Sichtprüfung von Teil 2 (Licht/Atmosphäre) noch nicht ausdrücklich vom Benutzer bestätigt.

## 2026-10-18 – 0.6.0-Vorbereitung: Licht und Atmosphäre

- Lichtprofile getrennt: warme bernsteinfarbene Fackeln, kühle blaue Runen-/Treppenlichtflächen und dezentes warmes Heldenlicht. Im Feuerschrein erhalten Runenlichtflächen einen gedämpften Rotton. Keine neuen Gefahrenmechaniken oder Sicherheitszonen.
- Fackelfarbe bleibt unabhängig von der Umgebungspalette warm; Lichtflächen werden je Umgebung und Profil gecacht.
- Lichtschwankung der bis zu sechs bestehenden Umgebungslichtquellen auf 0.74 bis 0.90 begrenzt und mit zwei Frequenzen gestaltet; bei reduzierter Bewegung konstant 0.82. Bestehende Schleife und Quellenauswahl bleiben erhalten.
- Bodennebel dezenter (Zeichenalpha 0.35 statt 0.55); Heldenlicht schwächer (0.45 statt 0.60). Bestehende Entdeckungs-Clips, Dungeon-Tiefentexturen, Schatten, Partikelanzahl und Gameplay unverändert. Kein neues Wand-Occlusion-/Schattenwurfsystem.
- Geprüft: 4000 numerische Lichtstichproben inklusive Reduced-Motion-Konstanz sowie 15 Lichtprofil-/Cache-Kombinationen mit simuliertem Canvas-Kontext, transparenten Rändern und Fallback-Umgebung. Kein Browser-Sichttest oder iPhone-Leistungstest durchgeführt.
- Benutzer bestätigt den Dungeon-Tiefe-Prototyp aus dem vorherigen Schritt als optisch gut. 0.6.0 bleibt in Vorbereitung; Versionsnummer unverändert.

## 2026-10-18 – 0.6.0-Vorbereitung: Dungeon-Tiefe, Textur-Prototyp

- Erster Teil des geplanten Grafik-Updates, noch kein vollständiges Release 0.6.0; Versionsnummer unverändert.
- Bestehenden living-world-Renderer erweitert: Wandkanten, Sockel und dezente Steinbeschädigungen; Bodenfugen, zusätzliche Risse und vereinzelte Feuchtstellen. Bestehende fünf Umgebungspaletten bleiben erhalten.
- Details entstehen nur beim Aufbau der gecachten 32-Pixel-Texturen, nicht als zusätzliche Zeichenpassage je Frame. Keine neuen Assets, Imports oder Animationsschleifen.
- Kacheltyp 2 bleibt unverändert. Kartenlayout, Kollisionen, Entdeckung, Licht/Nebel, Figuren, Kämpfe, Inventar, Käufe und Speicherung unverändert; noch keine neuen Säulen, Altäre oder Raumdekorationen.
- 120 isolierte Painter-Testfälle erfolgreich: fünf Umgebungen, drei Kacheltypen, acht Varianten. Determinismus, Kachelgrenzen, Canvas-Zustandswiederherstellung, unveränderte Paletten und unangetasteter Typ 2 geprüft. Kein echter Browser-Sichttest oder iPhone-Leistungstest durchgeführt.
- Nächster Prüfschritt: Sichtbarkeit der Wand-/Bodendetails, klare Laufwege und flüssige Bewegung auf dem iPhone; danach Umfang weiterer Dungeon-Dekoration festlegen.

## 2026-10-18 – Spieltests bestätigt: Datenbasis und Diagnose

### Behoben / vom Benutzer im Spiel bestätigt

- Diagnose-Zugriff funktioniert nach Fix 1; Benutzer bestätigt anschließend auch Inventar und Speichern als funktionierend.
- Fehlendes Inventar beim Laden: Fix 2 ergänzt fehlende Helden-Container. Der zuvor gemeldete Fehler bei inventory.length unterbrach HUD-Aktualisierungen bei Bewegung und Kampf.
- Tod und Todesübergang funktionieren nach Fix 2 laut Benutzertest wieder. Dafür war bislang kein separater Umbau der Todeslogik erforderlich.
- Gegenstände kaufen und den nächsten Run starten funktionieren nach Fix 2 laut Benutzertest wieder; kein zusätzlicher Kauf-Patch vorgenommen.
- Keine weiteren akuten Fehler im zuletzt bestätigten Teststand gemeldet. Dies ist eine Benutzerbestätigung, keine vollständige Browser-/Cloud-Testabdeckung.

### Offene Prüfpunkte / Grenzen

- Sonderfälle wie Verbindungsabbruch während Kauf/Speichern, Diagnose bei Sitzungspause und parallele Sitzungen sind durch diese Rückmeldung nicht einzeln bestätigt. Keine nachgewiesenen neuen Fehler.
- Bereits mit TP <= 0 gespeicherte Helden beim Laden sowie tatsächlich beschädigte statt nur fehlende Container bleiben gesonderte Prüffälle; Fix 2 ist keine vollständige Spielstandmigration oder Schema-Validierung.
- Die historischen Hinweise auf ausstehende Tests in den Einträgen zu Fix 1 und Fix 2 dokumentieren deren damaligen Stand; obige Benutzerbestätigung ergänzt sie.
- Grafik-Update 0.6.0 ist als nächstes Update vorgesehen, noch nicht implementiert oder veröffentlicht.

## 2026-10-18 – Fix 2: Datenbasis beim Laden von Helden

- state.player wird bei vollständiger Neuzuweisung normalisiert; dies umfasst Object.assign(state, data) im bestehenden Ladeweg, ohne main.js zu ändern.
- Fehlendes oder null-Inventar wird zu einem neuen leeren Array. Fehlende Ausrüstungsplätze sowie Skilltree, Buffs, Cooldowns und preparationBought werden ergänzt.
- Vorhandene Inventare, Gegenstände, Ausrüstung, Skills, Kaufstatus und sonstige Heldenwerte bleiben erhalten; Eingabedaten werden nicht durch Ergänzungen verändert.
- Unbekannte falsche Containerformate werden mit TypeError abgewiesen, statt Inhalte stillschweigend zu löschen; der bisherige state.player bleibt bei abgewiesener Zuweisung erhalten. Keine vollständige Spielstandvalidierung und keine Datenbankmigration.
- 34 isolierte Node-Testfälle erfolgreich, darunter fehlende/null-Felder, Erhalt belegter Daten, Object.assign-Ladeweg, JSON-Serialisierung, getrennte leere Inventare und abgewiesene Formate; zusätzlich 100 wiederholte Normalisierungen ohne Inhaltsänderung. Kein Browser-/iPhone- oder Firebase-End-to-End-Test durchgeführt.
- Kauf-, Speicher-, Diagnose- und Todeslogik unverändert. Negative TP werden nicht automatisch geheilt; Todesablauf und Käufe müssen nach diesem Datenbasis-Fix gesondert geprüft werden.
- to_do.log geprüft: kein eindeutiger Eintrag zu fehlenden Helden-Containern; bestehende Aufgaben unverändert.

## 2026-10-18 – Fix 1: Diagnose-Zugriff bei Eingabesperren

- Rüstkammer- und Sitzungs-Eingabehandler lassen Ereignisse aus dem vorhandenen startup-diagnostics-host passieren; composedPath berücksichtigt auch Bedienelemente im Shadow DOM.
- Ausnahme gilt ausschließlich für den Diagnose-Host. Andere Eingaben bleiben entsprechend Rüstkammer- und Sitzungszustand gesperrt.
- Kauf-, Gold-, Inventar-, Speicher- und Sitzungsprüfungslogik unverändert; Kaufreparatur folgt separat nach Benutzertest.
- 146 Fälle der Handler-Simulation erfolgreich: Klick, Pointer, Touch und Tastatur; Diagnose-Host und Shadow-DOM-Pfad; reguläre Eingaben; gültige, getrennte und pausierte Sitzung; fehlender Host und fehlendes composedPath. Kein echter Browser-/iPhone- oder Firebase-End-to-End-Test durchgeführt.
- to_do.log: kein passender Diagnose-Eintrag im zuletzt geprüften Stand; keine bestehenden Gameplay-Aufgaben als erledigt markiert.

## 2026-10-18 – Fix: Observer-Rückkopplung im Inventar

- Wiederholtes Setzen von hidden im Nutzen-Button konnte den Seiten-Observer erneut auslösen und eine Endlosschleife verursachen.
- hidden wird nur noch bei tatsächlicher Zustandsänderung gesetzt; der Seiten-Observer ignoriert Änderungen innerhalb der eigenen Button-Gruppe. Externe Menü- und Spielzustandsänderungen werden weiterhin verarbeitet.
- main.js, Wegwerfen-Dialog, Button-Farben, planDiscard und persistDiscard bleiben unverändert.
- Geprüft: Node-Syntaxprüfung sowie Regression im DOM-/Observer-Simulator. Alter Code läuft nach 30 Zustellungen weiter; Fix endet nach einer Zustellung. Zusätzlich 100 wiederholte Aktualisierungen, externe Sperrzustände, Ausrüstung, Nutzen, Wegwerfen-Auswahl und veraltete Auswahl geprüft.
- Kein echter iPhone-/Safari- oder Cloud-End-to-End-Test durchgeführt; Bestätigung des gemeldeten Handy-Freeze nach Veröffentlichung steht noch aus.
- to_do.log geprüft: kein passender Eintrag zu diesem Observer-Fehler, daher unverändert.

## 2026-10-18 – Inventar: Nutzen neben Wegwerfen

- Blauer Nutzen-Button links neben dem roten Wegwerfen-Button ergänzt.
- Auf schmalen Displays steht die gemeinsame Button-Gruppe unter dem Gegenstandstext; beide Buttons bleiben nebeneinander.
- Nutzen verwendet den bestehenden Klickhandler der Inventarzeile und damit die vorhandene useItem()-Logik; main.js bleibt unverändert. Optional kann installDiscard weiterhin eine useItem-Funktion entgegennehmen.
- Nutzen wird bei Ausrüstung ausgeblendet; Ausrüsten bleibt unverändert.
- Button-Klicks stoppen die Weiterleitung des ursprünglichen Ereignisses; Auswahl und Sperrzustand werden vor Nutzen erneut geprüft.
- Wegwerfen-Dialog, Mengenwahl, planDiscard und persistDiscard bleiben unverändert; weiterhin kein Gold und keine Bodenbeute.
- Geprüft: Node-Syntaxprüfung und isolierte Tests für Button-Reihenfolge, doppelte Dekoration, Nutzen-Fallback, Wegwerfen-Auswahl, Sperrzustände, veraltete Auswahl und ausgeblendeten Nutzen-Button bei Ausrüstung. Kein Browser- oder Cloud-End-to-End-Test durchgeführt.
- to_do.log geprüft: kein entsprechender Button-Eintrag vorhanden, daher unverändert.

## 2026-10-17 – Wiederherstellung nach fehlerhaften Inventar-Pushes

- Repository-Dateistand mit Wiederherstellungs-Commit 832b58a auf bb849fb68adc96c3f3d7dc981567cd1bd6d919a5 zurückgebracht.
- Benutzer bestätigt erfolgreichen Spieltest nach Wiederherstellung.

## v0.4.0 – Mobile Edition & Episches Intro

- Episches Fullscreen-Intro mit Lore, Glut-Atmosphäre und animiertem Titel.
- Mobile-First-Layout für Phones und Tablets.
- Virtuelles D-Pad entfernt.
- Bewegung direkt per Tap auf angrenzende Felder oder Swipe über die Karte.
- Auto-Lauf zu angetippten sichtbaren Zielen per Wegfindung.
- Kampf als eigenes, großes Fullscreen-Fenster.
- Kompakte HUD, Bottom-Sheet-Panels und größere Touch-Flächen.
- Sichere Randabstände für Notch und Home-Bar.

## v0.3.8 – Skilltree & Roguelite-Builds

- Skilltree mit 12 Skills in den Zweigen Krieg, Arkan und Schatten.
- Ein Skillpunkt pro Level-Up.
- Effekte für TP, MP, ATK, DEF, Krit, Ausweichen, Feuer, Heilung und Gold.
- Persistente Speicherung pro Recken.

## v0.3.7 – Level Design & Bewegbare Welt

- Größere, prozedural erzeugte Ebenen.
- Bewegbare Kamera.
- Fünf unterschiedliche Ebenen-Designs.
- Zufallsnamen, AFK-Logout und Speicher-Benachrichtigung.
