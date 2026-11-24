# Betreiber-Eintrag einrichten

Datei: `firebase/admins.json` (Inhalt: die UID mit dem Wert `true`).
Der Knoten in der Datenbank heißt `admins`, die UID ist das Kind darunter.

**Achtung:** Den Import der JSON-Datei in der Firebase-Konsole ersetzt die GESAMTE Datenbank.
Damit wären alle Städte weg. Deshalb nicht importieren, sondern von Hand anlegen:

1. Firebase-Konsole → Realtime Database → Daten.
2. Am Wurzelknoten `tiny-tycoon-towns-default-rtdb` auf **+** klicken.
   - Name: `admins`, Wert leer lassen, hinzufügen.
3. Beim neuen Knoten `admins` auf **+** klicken.
   - Name: `f2ZAt1MCFChUBbKKm9Hm3YYn6H43`
   - Wert: `true` (Boolean), hinzufügen.
4. Fertig. Die Stadt-Daten bleiben unberührt.

Die Datei `admins.json` dient als Referenz für genau diesen Eintrag.
