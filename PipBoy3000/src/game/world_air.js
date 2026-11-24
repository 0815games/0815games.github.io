// RAD-Wolken - wandernde Strahlungsfelder in der Spielwelt.
//
// Idee: RAD gab es bisher nur als Getränkewert (gebratenes Fleisch, RadAway,
// Schlafen). Keine Zone und kein Wetter hat gestrahlt - die Glühende See war
// reine Optik. Die Wolke macht RAD zu einem Ortsphänomen: man sieht sie
// kommen, kann sie umgehen oder durchlaufen, und mit Gasmaske, Anzug oder
// Rad-X kostet der Weg weniger.
//
// Aufbau bewusst getrennt:
//   - diese Datei: Daten und Regeln (wo, wie viele, wie schnell, wie viel RAD)
//   - drawRadClouds() in game_render.js: nur Darstellung
//
// Die Wolken leben im Spielstand (state.radClouds), damit sie beim Speichern
// nicht springen. Sie bewegen sich langsam - deutlich langsamer als der
// Spieler. Eine gleich schnelle Wolke kann man nicht umgehen, nur erleiden.

Object.assign(Game, {

    // Wie viele Wolken je Sektor, nach Biom. Bewusst sparsam: man sieht nur
    // zehn Felder weit, der Sektor ist 50x50. Zu viele Wolken waeren ein
    // Nebelmeer und kein Hindernis.
    RAD_WOLKEN_JE_BIOM: {
        desert: 5,      // Die Glühende See - die Heimat der Wolken
        swamp: 3,       // Todes-Sümpfe
        forest: 2,      // Verstrahlter Wald
        jungle: 2,
        wasteland: 1,
        mountain: 1,
        city: 0         // in der Stadt gibt es Strassen, keine Wolken
    },

    // RAD pro Feld, das in der Wolke steht. Ein Sektor ist 50 Felder breit;
    // wer eine Wolke durchquert, kommt mit 6-8 Feldern durch - das sind bei
    // einer dichten Wolke grob 20-30 RAD, also ein knappes RadAway.
    RAD_PRO_FELD: 4,

    // Ein Wolkenzug pro Sekunde waere zu schnell (der Spieler laeuft bei
    // jedem Tastendruck ein Feld). Alle 6 Sekunden ein Feld ist sichtbar,
    // aber umgehbar.
    RAD_WOLKE_ZUG_MS: 6000,

    // --- Lebenszyklus -------------------------------------------------------

    radWolkenZahlFuerBiom: function(biome) {
        const zahl = this.RAD_WOLKEN_JE_BIOM[biome];
        return (typeof zahl === 'number') ? zahl : 1;
    },

    // Wird beim Betreten eines Sektors gerufen. Vorhandene Wolken des Sektors
    // werden weiterverwendet, damit ein Wechsel hin und zurueck sie nicht neu
    // auswuerfelt.
    baueRadWolken: function(biome) {
        if(!this.state) return [];
        if(!Array.isArray(this.state.radClouds)) this.state.radClouds = [];

        const sektor = this.state.sector || {x: 0, y: 0};
        const vorhanden = this.state.radClouds.filter(w =>
            w.sektor.x === sektor.x && w.sektor.y === sektor.y);
        if(vorhanden.length > 0) return vorhanden;

        const anzahl = this.radWolkenZahlFuerBiom(biome);
        for(let i = 0; i < anzahl; i++) {
            this.state.radClouds.push(this._neueRadWolke(sektor));
        }
        return this.state.radClouds.filter(w =>
            w.sektor.x === sektor.x && w.sektor.y === sektor.y);
    },

    _neueRadWolke: function(sektor) {
        // Nicht auf dem Startfeld des Spielers ablegen: ein Treffer direkt
        // beim Betreten waere kein Hindernis, sondern eine Strafe.
        let x, y, versuche = 0;
        const px = (this.state.player && this.state.player.x) || 0;
        const py = (this.state.player && this.state.player.y) || 0;
        do {
            x = 3 + Math.floor(Math.random() * (this.MAP_W - 6));
            y = 3 + Math.floor(Math.random() * (this.MAP_H - 6));
            versuche++;
        } while(versuche < 40 && Math.abs(x - px) + Math.abs(y - py) < 8);

        return {
            sektor: {x: sektor.x, y: sektor.y},
            x: x,
            y: y,
            radius: 2,          // Felder um das Zentrum
            dichte: 1,          // 1 = volle Dichte, sinkt beim Aufloesen
            zug: Date.now()     // Zeitpunkt des letzten Zugs
        };
    },

    // Alle Wolken des aktuellen Sektors.
    radWolkenImSektor: function() {
        if(!this.state || !Array.isArray(this.state.radClouds)) return [];
        const sektor = this.state.sector || {x: 0, y: 0};
        return this.state.radClouds.filter(w =>
            w.sektor.x === sektor.x && w.sektor.y === sektor.y);
    },

    // Steht der Spieler in einer Wolke? Gibt die Wolke zurueck oder null.
    // Der Radius wird euklidisch gemessen, damit die Wolke rund wirkt und
    // nicht wie ein Kreuz.
    radWolkeAufFeld: function(fx, fy) {
        for(const w of this.radWolkenImSektor()) {
            const dx = w.x - fx, dy = w.y - fy;
            if(Math.sqrt(dx * dx + dy * dy) <= w.radius) return w;
        }
        return null;
    },

    // --- Bewegung -----------------------------------------------------------

    // Wird bei jedem Spielerzug gerufen (aus Game.move heraus, nicht aus dem
    // Renderer): die Wolken wandern, wenn ihr Zug faellig ist.
    bewegeRadWolken: function() {
        if(!this.state || !Array.isArray(this.state.radClouds)) return;
        const jetzt = Date.now();
        const sektor = this.state.sector || {x: 0, y: 0};

        for(const w of this.state.radClouds) {
            if(w.sektor.x !== sektor.x || w.sektor.y !== sektor.y) continue;
            if(jetzt - (w.zug || 0) < this.RAD_WOLKE_ZUG_MS) continue;

            // Wanderrichtung: leichte Grunddrift nach Osten (der Wind), plus
            // Zufall. Der Wind macht die Bewegung vorhersagbar genug, dass man
            // ausweichen kann.
            const richtungen = [[1, 0], [1, 0], [1, 1], [1, -1], [0, 1], [0, -1]];
            const [dx, dy] = richtungen[Math.floor(Math.random() * richtungen.length)];

            let nx = w.x + dx, ny = w.y + dy;
            // Am Sektorrand umkehren, nicht anstossen: sonst sitzt die Wolke
            // dauerhaft in der Ecke.
            if(nx < 2 || nx > this.MAP_W - 3) nx = w.x - dx;
            if(ny < 2 || ny > this.MAP_H - 3) ny = w.y - dy;

            // Nicht in Waende wandern - eine Wolke im Berg sieht falsch aus.
            const feld = this.state.currentMap && this.state.currentMap[ny]
                ? this.state.currentMap[ny][nx] : '.';
            if(['#', '^', 'Y'].includes(feld)) { w.zug = jetzt; continue; }

            w.x = nx;
            w.y = ny;
            w.zug = jetzt;
        }
    },

    // --- Wirkung ------------------------------------------------------------

    // Ein Zug des Spielers ist zu Ende: Wolken ziehen, Strahlung pruefen.
    // Wird aus Game.move gerufen (dort, wo sich der Spieler wirklich bewegt).
    tickRadWolken: function() {
        if(!this.state) return;
        this.bewegeRadWolken();

        const w = this.radWolkeAufFeld(this.state.player.x, this.state.player.y);
        if(w) {
            // addRadiation rechnet Ruestung, Perk und Buffs ein und deckelt bei
            // 90 Prozent - dieselbe Mechanik wie beim Schlafen und beim Essen.
            this.addRadiation(this.RAD_PRO_FELD);
            if(typeof UI !== 'undefined' && UI.log && !this._radWolkenMeldung) {
                UI.log("Du stehst in einer Strahlungswolke!", "text-green-400 font-bold");
                this._radWolkenMeldung = true;
            }
        } else {
            this._radWolkenMeldung = false;
        }
    },

    // Strahlungswert eines Feldes - fuer Vorschau und Tests.
    radWolkenWertAufFeld: function(fx, fy) {
        const w = this.radWolkeAufFeld(fx, fy);
        if(!w) return 0;
        return Math.ceil(this.RAD_PRO_FELD * (w.dichte || 1));
    }
});
