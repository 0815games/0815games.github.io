# @-learning Webseite
Statisch, kein Build nötig. Hochladen (GitHub Pages, Firebase Hosting, Webspace) oder index.html lokal öffnen.
Seiten: index, kurs.html?k=im|imm|ime|iml|tfw|tbw|wfw|kombi|aevo, termine, leistungen, dozentensuche, zulassung, links, buchtipps, aktionen, kontakt, impressum, datenschutz.
ALLE Inhalte stehen in js/data.js (Kurse, Lerninhalte, Termine, Links, FAQ). Neuer Kurs = Eintrag in `courses` plus Kapitel in `categories`.
Termine: Status (läuft/startet bald) wird automatisch aus dem Datum berechnet, beendete Kurse verschwinden.
Downloads: PDFs nach downloads/ legen und in data.js bei links.groups eintragen.
