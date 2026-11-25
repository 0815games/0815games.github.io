// Navigation auf der Weltkarte.
//
// Gefragt war: "Klick auf Karte setzt die Navigation (lang klicken oder
// nachfragen? oder Marker setzen und dann Knopf fuer bestaetigen?). Kleiner
// Pfeil in die Richtung des gesetzten Punktes unter oder neben dem
// Sektor-Anzeiger - dynamisch drehend in die Richtung, in die man will."
//
// Die Frage ist mit "Marker setzen, dann bestaetigen" beantwortet, und zwar
// aus einem Grund, den man erst beim Hinsehen merkt: die Karte wird mit einem
// Finger GEZOGEN und mit zwei Fingern GEZOOMT. Ein Klick ohne Rueckfrage waere
// damit unbrauchbar - jedes Ende einer Ziehbewegung waere ein Ziel, und jedes
// Zoomen mit einem Finger (Pinch, der einen Finger zuerst hebt) ebenfalls.
//
// Der Ablauf:
//   1. Klick/Tap auf die Karte setzt einen MARKER (gelbes Fadenkreuz).
//   2. Ein Bestaetigungsfeld zeigt Sektor, Entfernung und Peilung, mit
//      UEBERNEHMEN und VERWERFEN. Ohne Bestaetigung passiert nichts.
//   3. Der gesetzte Punkt erscheint als kleiner Pfeil neben dem Sektor-Anzeiger
//      und dreht sich mit der Richtung: die Nadel zeigt vom Spieler zum Ziel,
//      wie ein Kompass mit einem festen Punkt.
//
// Warum die Nadel so dreht und nicht anders: Auf der Karte ist Norden oben.
// Ein Pfeil, der "nach rechts oben" zeigt, ist sofort lesbar. Ein Pfeil, der
// sich mit dem Spieler mitdreht ("vorwaerts"), waere nur mit Bezug auf die
// Blickrichtung des Spielers sinnvoll - und die Blickrichtung aendert sich mit
// jedem Schritt, also zitterte die Nadel bei jedem Zug. Die Karten-Nadel ist
// die ruhigere und ehrlichere Anzeige.
//
// Reine Rechnung und Darstellung: kein Netzwerk, kein Speicherzugriff. Der
// Stand liegt in Game.state.nav, damit er mit dem Spielstand gespeichert wird.

window.GameData = window.GameData || {};

// Ein Sektor ist 50x50 Felder. Die Welt ist WORLD_W x WORLD_H Sektoren.
const FELDER = 50;

// Peilung in Grad, 0 = Norden (oben), im Uhrzeigersinn. Das ist die Zahl, die
// in `transform: rotate(Xdeg)` geht.
function peilung(dx, dy) {
    // Bildschirm-Koordinaten: y waechst nach unten. Norden ist -y.
    const grad = Math.atan2(dx, -dy) * 180 / Math.PI;
    return (grad + 360) % 360;
}

// Kurztext fuer die Himmelsrichtung. Achtung: auf Deutsch ist Osten "O",
// nicht "E" - der Kompass auf der Karte beschriftet ebenfalls mit N/S/W/O.
function himmelsrichtung(grad) {
    const richtungen = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
    return richtungen[Math.round(grad / 45) % 8];
}

// Entfernung in Feldern, gerade Linie (Luftlinie). Ein Sektor sind 50 Felder.
function entfernung(von, nach) {
    const dx = (nach.x - von.x) * FELDER;
    const dy = (nach.y - von.y) * FELDER;
    return Math.sqrt(dx * dx + dy * dy);
}

// Rechnet einen Klick auf der Weltkarte in Sektor-Koordinaten um. Die Karte
// zeichnet Felder mit `scale` Pixeln, verschoben um offsetX/offsetY; ein
// Sektor ist 50 Felder breit. Ohne diese Umrechnung waere der Marker ein
// Pixel und das Ziel ein Sektor - und beides waere nie dasselbe.
function klickZuSektor(px, py, mapState, mapW, mapH) {
    const s = mapState.scale;
    const globalX = (px - mapState.offsetX) / s;
    const globalY = (py - mapState.offsetY) / s;
    const sektorX = Math.floor(globalX / mapW);
    const sektorY = Math.floor(globalY / mapH);
    const feldX = Math.floor(globalX) - sektorX * mapW;
    const feldY = Math.floor(globalY) - sektorY * mapH;
    return {sektorX, sektorY, feldX, feldY};
}

window.Navigation = {
    FELDER,
    peilung,
    himmelsrichtung,
    entfernung,
    klickZuSektor,

    // Der aktuelle Stand. `null`, solange kein Ziel gesetzt ist.
    stand: function() {
        return (typeof Game !== 'undefined' && Game.state && Game.state.nav) ? Game.state.nav : null;
    },

    // Setzt das Ziel. Das ist die einzige Stelle, die Game.state.nav schreibt -
    // damit es keinen zweiten Weg gibt, der die Form anders fuellt.
    setzen: function(sektorX, sektorY) {
        if (typeof Game === 'undefined' || !Game.state) return null;
        const ziel = {x: sektorX, y: sektorY, gesetzt: Date.now()};
        Game.state.nav = ziel;
        if (typeof Game.saveGame === 'function') Game.saveGame();
        return ziel;
    },

    loeschen: function() {
        if (typeof Game === 'undefined' || !Game.state) return;
        Game.state.nav = null;
        if (typeof Game.saveGame === 'function') Game.saveGame();
        this.aktualisiere();
    },

    // Position des Spielers als Sektor-Koordinate. Der Spieler steht in einem
    // Sektor auf einem Feld; fuer die Peilung zaehlt das Feld mit, sonst
    // springt die Nadel in 50er-Schritten.
    _spieler: function() {
        if (typeof Game === 'undefined' || !Game.state || !Game.state.sector) return null;
        const sx = Game.state.sector.x;
        const sy = Game.state.sector.y;
        const px = (Game.state.player && Game.state.player.x) || 0;
        const py = (Game.state.player && Game.state.player.y) || 0;
        // Globale Feldkoordinate, damit Sektorgrenzen keine Sprünge machen.
        return {x: sx + px / FELDER, y: sy + py / FELDER};
    },

    // Peilung, Richtung und Entfernung zum Ziel. `null`, wenn kein Ziel oder
    // kein Spieler da ist.
    richtung: function() {
        const ziel = this.stand();
        const spieler = this._spieler();
        if (!ziel || !spieler) return null;
        // Zielmitte: der Marker sitzt im Sektor, die Nadel zeigt auf die Mitte.
        const zx = ziel.x + 0.5;
        const zy = ziel.y + 0.5;
        const dx = (zx - spieler.x) * FELDER;
        const dy = (zy - spieler.y) * FELDER;
        const grad = peilung(dx, dy);
        return {
            grad,
            himmel: himmelsrichtung(grad),
            felder: Math.round(Math.sqrt(dx * dx + dy * dy)),
            sektoren: Math.round(Math.sqrt((zx - spieler.x) ** 2 + (zy - spieler.y) ** 2) * 10) / 10,
            dx, dy,
            ziel
        };
    },

    // Ist das Ziel erreicht? Ein Sektor ist 50 Felder breit, also gilt der
    // gleiche Sektor als angekommen.
    angekommen: function() {
        const ziel = this.stand();
        if (!ziel || typeof Game === 'undefined' || !Game.state || !Game.state.sector) return false;
        return Game.state.sector.x === ziel.x && Game.state.sector.y === ziel.y;
    },

    // Zeichnet die Nadel in das Element `#nav-pfeil`. Das Ziel ist ein
    // Canvas mit fester Groesse 44x44; gezeichnet wird bei jedem Aufruf neu.
    //
    // Der Aufruf kommt aus UI.update(), also nach jedem Zug - die Nadel dreht
    // sich damit, sobald sich die Richtung aendert.
    // Die Sektor-Anzeige traegt das Ziel mit: "[3,4] ▸ [7,2]". Ohne das
    // muesste man raten, wohin die Nadel daneben zeigt.
    anzeigeAktualisieren: function() {
        const el = document.getElementById('val-sector-display');
        if (!el || typeof Game === 'undefined' || !Game.state) return;
        const sx = Game.state.sector ? Game.state.sector.x : 0;
        const sy = Game.state.sector ? Game.state.sector.y : 0;
        const ziel = this.stand();
        const neu = ziel
            ? `🌍 [${sx},${sy}] <span class="text-[#39ff14]">▸ [${ziel.x},${ziel.y}]</span>`
            : `🌍 SEKTOR [${sx},${sy}]`;
        // Nur schreiben, wenn sich etwas geaendert hat: aktualisiere() laeuft
        // nach jedem Zug, und innerHTML kostet jedes Mal Layout.
        if (el.dataset.navStand !== neu) {
            el.dataset.navStand = neu;
            el.innerHTML = neu;
        }
        el.classList.remove('border-yellow-500');
    },

    aktualisiere: function() {
        // Eine Hand fuer beides: Pfeil UND Ziel in der Sektor-Anzeige. Vorher
        // schrieb UI.update() die Anzeige und diese Funktion den Pfeil - beim
        // Aufheben blieb das Ziel deshalb in der Anzeige stehen.
        this.anzeigeAktualisieren();

        const behaelter = document.getElementById('nav-pfeil');
        if (!behaelter) return;

        const info = this.richtung();
        if (!info) {
            behaelter.classList.add('hidden');
            behaelter.style.display = 'none';
            // Auch den Text leeren. Ein verstecktes "ZIEL" von eben ist zwar
            // unsichtbar, aber beim naechsten Oeffnen waere es die falsche
            // Auskunft fuer einen Wimpernschlag.
            const leer = behaelter.querySelector('[data-nav-text]');
            if (leer && leer.textContent) leer.textContent = '';
            return;
        }
        behaelter.classList.remove('hidden');
        behaelter.style.display = 'flex';

        // Angekommen: die Nadel wird zur Markierung, statt in eine Richtung zu
        // zeigen, die es nicht mehr gibt.
        const fertig = this.angekommen();
        const cvs = behaelter.querySelector('canvas');
        // Ohne Leinwand keine Nadel - aber trotzdem der Text. Eine fehlende
        // oder ersetzte Leinwand darf die Anzeige nicht abstuerzen lassen:
        // aktualisiere() laeuft in UI.update(), also nach jedem Zug.
        const ctx = cvs && cvs.getContext ? cvs.getContext('2d') : null;
        if (ctx) {
        const w = cvs.width;
        const h = cvs.height;
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2);

        if (fertig) {
            // Ziel erreicht: Ring mit Punkt, kein Pfeil.
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#39ff14';
            ctx.beginPath();
            ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.rotate(info.grad * Math.PI / 180);
            const r = Math.min(w, h) / 2 - 4;
            // Nadel: gefuellte Spitze nach oben (Norden), Schwanz als Linie.
            // Die Spitze ist oben, weil rotate(0) nach Norden zeigt.
            ctx.fillStyle = '#39ff14';
            ctx.strokeStyle = '#39ff14';
            ctx.shadowColor = '#39ff14';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(r * 0.55, r * 0.45);
            ctx.lineTo(0, r * 0.15);
            ctx.lineTo(-r * 0.55, r * 0.45);
            ctx.closePath();
            ctx.fill();
            // Der Schwanz macht die Drehung lesbar: ohne ihn ist ein
            // symmetrischer Pfeil bei 180 Grad von 0 Grad nicht zu unterscheiden.
            ctx.shadowBlur = 0;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, r * 0.75);
            ctx.stroke();
            ctx.restore();
        }
        }

        // Text daneben: "S 12" = Richtung Sued, 12 Sektoren. Der Sektor-Anzeiger
        // bleibt die Hauptanzeige; das hier ist die Ergaenzung.
        const text = behaelter.querySelector('[data-nav-text]');
        if (text) {
            text.textContent = fertig
                ? 'ZIEL'
                : `${info.himmel} ${info.sektoren}`;
        }
        behaelter.title = fertig
            ? 'Ziel erreicht'
            : `Ziel: Sektor [${info.ziel.x}, ${info.ziel.y}] - ${info.himmel}, ${info.felder} Felder`;
        behaelter.classList.toggle('nav-angekommen', fertig);
    },

    // --- Karte: Marker setzen und bestaetigen -----------------------------

    // Der Marker, der auf der Karte gezeichnet wird (noch nicht bestaetigt).
    marker: null,

    // Wird vom Karten-Klick gerufen. Setzt den Marker und oeffnet das
    // Bestaetigungsfeld - aber nur, wenn der Klick kein Ziehen war.
    // `mapState` optional von aussen: die Karte haelt ihr eigenes Objekt fest
    // (Ereignis-Handler duerfen nicht von `UI.mapState` abhaengen, das beim
    // Neuaufbau ersetzt wird). Ohne Parameter wird UI.mapState genommen.
    markerSetzen: function(px, py, mapState) {
        if (typeof UI === 'undefined' || typeof Game === 'undefined') return null;
        const zustand = mapState || UI.mapState;
        if (!zustand) return null;
        const treffer = klickZuSektor(px, py, zustand, Game.MAP_W || FELDER, Game.MAP_H || FELDER);
        const {sektorX, sektorY} = treffer;
        const maxX = (Game.WORLD_W || 1) - 1;
        const maxY = (Game.WORLD_H || 1) - 1;
        if (sektorX < 0 || sektorX > maxX || sektorY < 0 || sektorY > maxY) {
            // Ausserhalb der Welt: kein Marker, keine Nachfrage. Ein Ziel, das
            // es nicht gibt, waere schlimmer als keines.
            if (typeof UI.log === 'function') UI.log('Ausserhalb der Karte', 'text-green-700');
            return null;
        }
        this.marker = {x: sektorX, y: sektorY};
        if (UI.mapState) UI.mapState.needsRender = true;
        this.bestaetigungZeigen();
        return this.marker;
    },

    markerLoeschen: function() {
        this.marker = null;
        if (typeof UI !== 'undefined' && UI.mapState) UI.mapState.needsRender = true;
    },

    bestaetigungZeigen: function() {
        const feld = document.getElementById('nav-bestaetigung');
        if (!feld || !this.marker) return;

        const spieler = this._spieler();
        const dx = (this.marker.x + 0.5 - (spieler ? spieler.x : 0)) * FELDER;
        const dy = (this.marker.y + 0.5 - (spieler ? spieler.y : 0)) * FELDER;
        const grad = peilung(dx, dy);
        const felder = Math.round(Math.sqrt(dx * dx + dy * dy));
        const himmel = himmelsrichtung(grad);

        const ziel = document.getElementById('nav-bestaetigung-ziel');
        const weg = document.getElementById('nav-bestaetigung-weg');
        if (ziel) ziel.textContent = `[${this.marker.x}, ${this.marker.y}]`;
        if (weg) weg.textContent = `${himmel} · ${felder} Felder · ${Math.round(grad)}°`;

        // Ist der Punkt der, an dem der Spieler schon steht? Dann sagt das
        // Feld das, statt ein Ziel anzubieten, das man nicht erreichen kann.
        const schonDa = typeof Game !== 'undefined' && Game.state && Game.state.sector
            && Game.state.sector.x === this.marker.x && Game.state.sector.y === this.marker.y;
        const knopf = document.getElementById('nav-bestaetigung-ok');
        if (knopf) knopf.textContent = schonDa ? 'TROTZDEM SETZEN' : 'ZIEL SETZEN';

        feld.classList.remove('hidden');
        feld.style.display = 'flex';
    },

    bestaetigungVerstecken: function() {
        const feld = document.getElementById('nav-bestaetigung');
        if (feld) { feld.classList.add('hidden'); feld.style.display = 'none'; }
    },

    // Der Knopf im Bestaetigungsfeld.
    bestaetigen: function() {
        if (!this.marker) return;
        const {x, y} = this.marker;
        this.setzen(x, y);
        this.bestaetigungVerstecken();
        this.marker = null;
        this.aktualisiere();
        if (typeof UI !== 'undefined') {
            if (UI.mapState) UI.mapState.needsRender = true;
            if (typeof UI.log === 'function') UI.log(`Navigation: Sektor [${x}, ${y}]`, 'text-[#39ff14]');
        }
    },

    verwerfen: function() {
        this.bestaetigungVerstecken();
        this.markerLoeschen();
    },

    // Zeichnet Marker und Ziellinie auf die Karte. Wird aus renderWorldMap
    // gerufen, direkt nach dem Spieler - damit die Linie unter dem Marker
    // liegt und der Marker ueber allem.
    zeichnen: function(ctx, mapState, felder) {
        if (typeof Game === 'undefined' || !Game.state) return;
        const s = mapState.scale;
        const ox = mapState.offsetX;
        const oy = mapState.offsetY;

        const punkt = (sektorX, sektorY) => ({
            x: (sektorX * felder + felder / 2) * s + ox,
            y: (sektorY * felder + felder / 2) * s + oy
        });

        // 1. Bestaetigtes Ziel: duenne Linie vom Spieler, dann das Kreuz.
        const ziel = this.stand();
        if (ziel) {
            const sx = Game.state.sector.x;
            const sy = Game.state.sector.y;
            const a = punkt(sx, sy);
            const b = punkt(ziel.x, ziel.y);
            ctx.save();
            ctx.strokeStyle = 'rgba(57, 255, 20, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            ctx.setLineDash([]);
            this._kreuz(ctx, b.x, b.y, 11, '#39ff14', 2);
            ctx.restore();
        }

        // 2. Der Marker, der noch bestaetigt werden muss: gelb und blinkend,
        //    damit er nicht mit dem gesetzten Ziel verwechselt wird.
        if (this.marker) {
            const m = punkt(this.marker.x, this.marker.y);
            const puls = 1 + Math.sin(Date.now() / 180) * 0.12;
            this._kreuz(ctx, m.x, m.y, 13 * puls, '#ffd700', 2);
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(m.x, m.y, 20 * puls, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    },

    // Fadenkreuz mit Luecke in der Mitte - auf der Karte besser zu sehen als
    // ein gefuellter Punkt, der wie ein POI aussieht.
    _kreuz: function(ctx, x, y, r, farbe, dicke) {
        ctx.save();
        ctx.strokeStyle = farbe;
        ctx.lineWidth = dicke;
        ctx.beginPath();
        ctx.moveTo(x - r, y); ctx.lineTo(x - r * 0.35, y);
        ctx.moveTo(x + r * 0.35, y); ctx.lineTo(x + r, y);
        ctx.moveTo(x, y - r); ctx.lineTo(x, y - r * 0.35);
        ctx.moveTo(x, y + r * 0.35); ctx.lineTo(x, y + r);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = farbe;
        ctx.fill();
        ctx.restore();
    }
};

// ---------------------------------------------------------------------------
// Handbedienung.
//
// Zwei Wege, ein Ziel zu setzen, weil ein Klick auf der Karte nur dort geht,
// wo die Karte sichtbar ist:
//   * auf der Weltkarte: Klick/Tap setzt den Marker, dann ZIEL SETZEN;
//   * aus dem Spiel heraus: "NAVIGATION" im Spielmenue oeffnet ein kleines
//     Feld, in das man den Sektor eintippt. Wer die Koordinaten aus einer
//     Quest hat, muss dafuer nicht erst die Karte oeffnen und den Sektor
//     treffen.
// ---------------------------------------------------------------------------
window.UI = window.UI || {};

window.UI.oeffneNavigation = function() {
    const feld = document.getElementById('nav-eingabe');
    if (!feld) return;
    if (typeof Game !== 'undefined' && Game.state) Game.state.inDialog = true;

    const ziel = Navigation.stand();
    const text = document.getElementById('nav-eingabe-stand');
    const sx = document.getElementById('nav-eingabe-x');
    const sy = document.getElementById('nav-eingabe-y');

    if (text) {
        if (ziel) {
            const info = Navigation.richtung();
            text.innerHTML = `AKTUELL: <span class="text-[#39ff14]">[${ziel.x}, ${ziel.y}]</span>`
                + (info ? ` · ${info.himmel} · ${info.felder} Felder` : '');
        } else {
            text.innerHTML = 'KEIN ZIEL GESETZT';
        }
    }
    if (sx && ziel) sx.value = ziel.x;
    if (sy && ziel) sy.value = ziel.y;

    feld.classList.remove('hidden');
    feld.style.display = 'flex';
    if (sx) sx.focus();
};

window.UI.schliesseNavigation = function() {
    const feld = document.getElementById('nav-eingabe');
    if (feld) { feld.classList.add('hidden'); feld.style.display = 'none'; }
    if (typeof Game !== 'undefined' && Game.state) Game.state.inDialog = false;
};

// Der OK-Knopf im Eingabefeld.
window.UI.setzeNavigation = function() {
    const sx = parseInt((document.getElementById('nav-eingabe-x') || {}).value, 10);
    const sy = parseInt((document.getElementById('nav-eingabe-y') || {}).value, 10);
    if (!Number.isFinite(sx) || !Number.isFinite(sy)) {
        if (typeof UI.log === 'function') UI.log('Sektor unvollstaendig', 'text-red-400');
        return;
    }
    const maxX = (typeof Game !== 'undefined' && Game.WORLD_W ? Game.WORLD_W : 1) - 1;
    const maxY = (typeof Game !== 'undefined' && Game.WORLD_H ? Game.WORLD_H : 1) - 1;
    if (sx < 0 || sx > maxX || sy < 0 || sy > maxY) {
        // Eine Nummer ausserhalb der Welt ist keine Navigation, sondern ein
        // Tippfehler. Lieber sagen als still nichts tun.
        if (typeof UI.log === 'function') UI.log(`Sektor [${sx}, ${sy}] liegt ausserhalb (0-${maxX} / 0-${maxY})`, 'text-red-400');
        return;
    }
    Navigation.setzen(sx, sy);
    Navigation.aktualisiere();
    if (typeof UI.log === 'function') UI.log(`Navigation: Sektor [${sx}, ${sy}]`, 'text-[#39ff14]');
    UI.schliesseNavigation();
};

window.UI.loescheNavigation = function() {
    Navigation.loeschen();
    if (typeof UI.log === 'function') UI.log('Navigation aufgehoben', 'text-green-700');
    UI.schliesseNavigation();
};
