# Block 2 – die nötigen neuen Regeln (Übergabe zur Freigabe)

**Stand: vorbereitet und im Emulator geprüft. NICHT veröffentlicht.**
Diese Datei sagt, was die Regeln tun, wie sie geprüft sind und was vor dem
Veröffentlichen zwingend zu tun bleibt. Sie ersetzt keine Freigabe.

## Was dazugekommen ist

Der veröffentlichbare Kandidat `workshop.complete.draft.rules.json` enthält
jetzt drei Blöcke. Alle sind **additiv**: 6 Pfade neu (`characterNames/**`),
4 um je ein Leserecht ergänzt (`players/$uid/{gender,avatar}`), 2 Bedingungen
per **ODER** erweitert (`players/$uid/name`, `friendCodes/$code`). Nichts wurde
entfernt und nichts, was heute erlaubt ist, wird verboten — der Vergleich
steht unten.

### 1. Soldatenname-Index (`characterNames/<Schlüssel>`)

Verhindert, dass zwei Konten denselben Soldatennamen halten. Der Eintrag hat
genau drei Felder (`uid`, `name`, `at`) und ist nur Schlüssel für Schlüssel
lesbar — das **gesamte** Verzeichnis ist nicht abrufbar, sonst könnte jedes
angemeldete Konto die komplette Namensliste aller Spieler lesen.

Schreiben darf: wer einen freien Schlüssel belegt, der Inhaber selbst, und —
nach Schutzfrist — wer einen **verwaisten** Eintrag übernimmt (Inhaber hat
keinen Charakter **und** Eintrag älter als die Schutzfrist, gemessen mit der
**Serveruhr**). Die Schutzfrist (Vorschlag: 6 Stunden) steht als Konstante in
`character-name.mjs` und wird von dort eingesetzt.

Ausführlich, mit Begründung und Grenzen:
[IPL-0034](../../IronPath/PATCH-LOG.md#ipl-0034--block-2-eindeutige-soldatennamen-für-neue-charaktere)
und
[IPL-0035](../../IronPath/PATCH-LOG.md#ipl-0035--block-2--a1-verwaiste-reservierungen-namensverzeichnis-geschlossen).

### 2. Umbenennen (`players/$uid/name`, `friendCodes/$code`)

Der Mechanismus für den Alt-Duplikat-Fall: ein Soldat kann seinen Namen
ändern, und dabei ziehen **alle vier Stellen in einem Zug** um — Profilname,
Suchindex (neuer Schlüssel und Eintrag, alter Eintrag weg), Freundescode und
Namensreservierung. Zwei Änderungen, beide als **ODER** ergänzt (nichts, was
heute erlaubt ist, wird verboten):

- `players/$uid/name` darf sich ändern, aber nur, wenn der Eintrag unter dem
  **aktuellen** Suchschlüssel schon den neuen Namen trägt. Den Schlüssel selbst
  können die Regeln nicht nachrechnen (keine Unicode-Normalisierung); sie
  können nur verlangen, dass Listing und Profil **übereinstimmen**. Ein
  Umbenennen, das den Suchindex vergisst, wird abgelehnt.
- `friendCodes/$code` darf vom Inhaber erneuert werden — ausschließlich zum
  eigenen aktuellen Profilnamen. Bisher konnte ein Eintrag nur **erzeugt**
  werden; nach einer Umbenennung hätte der Code dauerhaft den alten Namen
  beworben.

**Absichtlich noch nicht entschieden:** wer umbenennen darf, wann, wie oft und
über welchen Einstiegspunkt im Spiel. Das Modul `character-rename.mjs` hat
darum noch keine Schaltfläche — die Entscheidung fällt nach der
Bestandsaufnahme.

### 3. Freundesporträt lesen (`players/$uid/{gender,avatar}`)

Bestätigte Freunde dürfen genau diese zwei Felder lesen — dieselbe Bedingung,
die die Freundes-Statistiken schon benutzen. Leserechte kaskadieren nur nach
unten: das Profil als Ganzes, `name`, `xp`, `workshop` und alles übrige bleiben
für Freunde unlesbar, und es wird nichts schreibbar, was vorher nicht
schreibbar war.

## Wie geprüft wurde

- **Datenbank-Emulator** (`test:character-names`): mit dem zusammengesetzten
  Kandidaten — inklusive Umbenennung, Kollision und Suchbarkeit unter dem neuen
  Namen — und ohne ihn („was heute live ist"). Der Lauf ohne die neuen Regeln
  beweist, dass Charaktererstellung und Name unverändert funktionieren und eine
  Umbenennung nichts anfasst.
- **Datenbank-Emulator, drei Läufe** (`test:friend-portraits`): gegen die
  Referenz, gegen die Referenz hinter dem Veröffentlichungs-Guard und **gegen
  den eingestellten Entwurf selbst** — also gegen genau die Datei, die
  veröffentlicht würde.
- **Publish-Trockenlauf** (`IronPath/scripts/rules-publish-dry-run.mjs`):
  vergleicht den Kandidaten mit allen anderen vollständigen Entwürfen im
  Repository und meldet, wenn ein Pfad fehlen würde.
- Vollständige lokale Testsuite: 1021 bestanden, 0 fehlgeschlagen.

**Kein** Beweis: dass der Kandidat dem **live**-Stand entspricht. Dafür braucht
es den frischen Export (siehe unten).

## Vor dem Veröffentlichen — zwingend

Das Veröffentlichen ersetzt den **gesamten** Regelbaum. Ein falscher Stand ist
sofort für alle Spieler wirksam.

1. **Frischer Export** der live geltenden Regeln (Firebase-Konsole → Realtime
   Database → Regeln → als JSON kopieren).
2. **Sicherung** dieses Exports an einem Ort außerhalb des Repositories.
3. **Kandidat auf den Export anwenden**, nicht auf den Repository-Stand:
   ```sh
   node IronPath/firebase/block2-rules-candidate.mjs /pfad/zu/frischer-export.json
   ```
   Das schreibt `<name>.block2.rules.json` — die beiden Blöcke, additiv auf
   **Ihrem** Export. Ohne Argument nutzt der Befehl den eingestellten Entwurf.
4. **Vergleich** — prüft, ob der Kandidat etwas entfernen oder lockern würde:
   ```sh
   node IronPath/scripts/rules-publish-dry-run.mjs /pfad/zu/frischer-export.json
   ```
   Und der Unterschied auf einen Blick:
   ```sh
   node IronPath/scripts/rules-publish-dry-run.mjs /pfad/zu/frischer-export.json --json
   ```
5. **Freigabe** erst danach, durch Sie.

## Bekannte offene Frage an der Basis

Zwei Regelwerke im Repository widersprechen sich in vier Pfaden
(`friendCodes`, `friendOutgoing`, `friendPresence`, `friendPrivate`):

- `WORKSHOP-RULES-TO-PUBLISH.json` — die festgenagelte Referenz,
- `pre-block2.complete.draft.rules.json` — der eingestellte Entwurf vor diesem
  Schritt.

Welcher davon live ist, kann **nur der frische Export** sagen. Der hier
eingestellte Kandidat baut auf dem zweiten auf, weil er der jüngere Stand im
Repository ist; er entfernt daraus nichts. Sollte der Export zeigen, dass live
die andere Fassung gilt, ist Schritt 3 der richtige Weg — der Builder nimmt
jede Basis.

## Nach der Veröffentlichung

- Prüfen, dass Charaktererstellung, Freundessuche und Porträtanzeige
  funktionieren (Kurztest mit zwei Konten).
- Erst danach sind Namens-Eindeutigkeit und Porträt-Regeln **serverseitig
  wirksam**. Bis dahin meldet der Client „nicht unterstützt" bzw. zeigt den
  Platzhalter; die Charaktererstellung läuft unverändert weiter.
- Alt-Duplikate bleiben unberührt. Wer einen kollidierenden Namen behält, ist
  nach der autorisierten Bestandsaufnahme gesondert zu entscheiden; eine
  Umbenennung braucht eine eigene Regeländerung, weil `players/$uid/name`
  heute unveränderlich ist.
