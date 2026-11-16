# Arbeitsanweisung für Iron Path

Diese Hinweise gelten für Änderungen an `IronPath/` sowie für dazugehörige
Tests, GitHub-Pull-Requests und Releases. Andere Projekte im Repository sind
davon nicht betroffen.

1. Vor Beginn `IronPath/PATCH-LOG.md` lesen, danach bei Bedarf
   `IronPath/PATCH-BLOECKE.md` und `IronPath/DATENBLATT.md`. Bereits vorhandene
   Arbeit, den aktuellen Branch und uncommittete Änderungen berücksichtigen.
2. Jeden in sich abgeschlossenen Arbeitsschritt im Patch-Log festhalten: Ziel,
   betroffene Dateien, tatsächliche Änderungen, Tests und Ergebnisse,
   Einschränkungen und noch offene Punkte. Eine lokale Änderung ausdrücklich
   als lokal kennzeichnen; nicht mit einem veröffentlichten Fix verwechseln.
3. Commit, Push, PR-Eröffnung, CI, Merge, Deployment, Rules- oder Datenänderung
   **erst nach dem tatsächlichen Ereignis** mit belegbarer Kennung und Ergebnis
   als neues Log-Ereignis ergänzen. Keine PRs, Commits, Freigaben oder
   Nutzerbestätigungen erfinden. Ein Commit kann seine eigene Hash-Kennung nicht
   bereits enthalten: Das nachgetragene Ereignis darf bis zum nächsten
   ausdrücklich freigegebenen Commit lokal uncommittet bleiben und muss als
   solches erkennbar sein.
4. Nachweisgrad ehrlich angeben: Unit-Test, Emulator, Browser mit Test-Doubles,
   echtes Gerät und produktiver Test sind verschiedene Stufen. Nutzerwünsche,
   frühere Bestätigungen und weitergehende neue Anforderungen getrennt halten.
   Keine Zugangsdaten, Tokens, personenbezogenen Daten oder geheimen Firebase-
   Kennungen in das Log schreiben.
5. Die Reihenfolge im Patchplan respektieren: Block 1 zuerst, danach Block 2
   und erst anschließend die größeren Oberflächen-, Avatar-, Skill- und
   Tutorial-Umbauten. Nach jedem sinnvollen, geprüften Schritt veröffentlichen
   und das Spiel wieder zum Testen öffnen; Wartung nur für den vom Betreiber
   genannten Merge-/Commit-Vorgang verwenden. Ist der Schalter nicht zugänglich
   oder ein sicherer Rollout nicht belegt, den tatsächlichen Zustand und das
   Hindernis nennen statt eine Öffnung zu behaupten. Vor produktiven Rules- oder
   Datenänderungen den aktuellen Stand, Sicherheit und Backup unabhängig prüfen.
6. Nach jeder Veröffentlichung dem Betreiber eine verständliche Liste geben:
   Was wurde geändert, welche konkreten Schritte soll er testen und welches
   Ergebnis wird erwartet? Offene Punkte, Risiken und den tatsächlichen Live-/
   Wartungsstatus getrennt nennen; Emulatorergebnisse nicht als Geräteabnahme
   ausgeben. Die Ingame-Ansicht **FELDNOTIZEN** (Daten in
   `IronPath/patch-notes.mjs`) fortschreiben: nach einer belegten
   Veröffentlichung die Release-Liste ergänzen und bei Statusänderungen die
   Blöcke aktualisieren. Jede Zeile braucht eine deutsche und eine englische
   Fassung; `IronPath/tests/patch-notes.test.mjs` lässt eine fehlende Sprache
   nicht durch. Veröffentlichte Arbeit und offene Punkte bleiben getrennt, und
   kein Eintrag behauptet eine Geräteabnahme. Die Schnellübersicht in `IronPath/PATCH-BLOECKE.md` bei Fortschritt
   und Nutzerfeedback aktualisieren, ohne offene Kriterien oder bereits gebaute
   Funktionen zu streichen. Bei Bedarf das Patch-Log verlinken.

Das Log ist eine Arbeitsanweisung für künftige Agenten, kein automatischer
Git-Hook: Externe Änderungen oder PR-Aktionen müssen gegebenenfalls anhand der
Git-/GitHub-Historie nachgetragen werden.
