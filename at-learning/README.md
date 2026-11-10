# @Learning – Website-Relaunch (React + Vite + Tailwind CSS)

Moderner, strukturierter, rechtssicherer und SEO-optimierter Webauftritt für das Bildungszentrum **@Learning** (Plochingen & Reutlingen, Inhaber: Tim Ohnmeiss MSc).

## Was wurde gegenüber der bisherigen Website verbessert?

- **Aufgeräumte Struktur (6 Hauptpunkte + Footer statt 24er-Seitenleiste):** Alle 7 IHK-Abschlüsse, Kombimodell, AEVO, Termine, Förderung, Zulassungen, Downloads, Buchtipps, Über uns, Dozentensuche, Kontakt, Impressum & Datenschutz klar gegliedert.
- **Einheitliche „Du“-Ansprache & korrigierte Rechtschreibung:** Alle Inhalte übernommen, Widersprüche (z. B. Copy-Paste-Fehler beim Vollzeitkurs) bereinigt und Tippfehler korrigiert.
- **Recht & DSGVO/TDDDG:** Echtes Opt-in-Cookie-Banner (keine vorab feuernden Tracker), fehlerfreie Datenschutzerklärung, Impressum auf **§ 5 DDG** aktualisiert, Google-Screenshots auf `/kontakt` durch datensparsame OpenStreetMap-/Google-Maps-Links ersetzt.
- **Tote Links repariert & Assets lokalisiert:** `/ueber-uns` (bisher 404) vollständig erstellt; alle 20 PDF-Dokumente lokal unter `public/downloads/` eingebunden (keine ablaufenden CDN-Signaturen).
- **SEO & Performance:** Dynamische `<title>`- & `<meta description>`-Tags pro Route, genau eine `<h1>` pro Seite, sprechende URLs, `JSON-LD` (`EducationalOrganization`), ~7,4 KB gzipped CSS.

## Lokal starten & bauen

```bash
npm install
npm run dev      # Entwicklungsserver (http://localhost:5173)
npm run build    # Produktions-Build in ./dist
```

## Empfohlene 301-Weiterleitungen beim Live-Gang

| Alte URL | Neue URL |
| :--- | :--- |
| `/industriemeister` | `/lehrgaenge/industriemeister-metall` |
| `/newpage` | `/lehrgaenge/industriemeister-elektro` |
| `/gepr-industriemeister-in--mechatronik` | `/lehrgaenge/industriemeister-mechatronik` |
| `/newpage2` | `/lehrgaenge/logistikmeister` |
| `/newpage1` | `/lehrgaenge/technischer-fachwirt` |
| `/newpage3` | `/lehrgaenge/technischer-betriebswirt` |
| `/gepr-wirtschaftsfachwirt-in--wfw` | `/lehrgaenge/wirtschaftsfachwirt` |
| `/newpage4` | `/lehrgaenge/kombimodell` |
| `/aevo-sonderkurse` | `/lehrgaenge/aevo` |
| `/beginn-der-kurse`, `/news` | `/termine` |
| `/Leistung`, `/bezeichnung-für-die-höherquali-berufsbildung` | `/leistungen` |
| `/Zulassungen`, `/links`, `/buchtipps` | `/service` |
| `/dozentensuche`, `/stammzellenspende-für-hannah`, `/oktoberfest-2025--learning` | `/ueber-uns` |
| `/privacy` | `/datenschutz` |
