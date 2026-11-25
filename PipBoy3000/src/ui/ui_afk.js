// AFK: nach fuenf Minuten ohne Eingabe kommt ein Fenster - nicht ein Logout.
//
// Vorher war es ein stiller Abbruch: `ui_render_core.update()` sah nach
// 300000 ms, dass niemand etwas getan hatte, und rief `logout()`. Der Spieler
// kam zurueck und stand im Login, ohne zu wissen warum, und ohne Chance, das
// zu verhindern. Mitten in einer Antwort, einem Inventar, einer Karte.
//
// Jetzt:
//   1. nach 5 Minuten ohne Eingabe oeffnet sich ein Fenster in der Mitte:
//      "BIST DU NOCH DA?" mit Countdown;
//   2. wer tippt oder klickt, ist sofort wieder da - das Fenster schliesst;
//   3. nach weiteren 60 Sekunden ohne Reaktion wird ausgeloggt, mit Grund im
//      Login-Text.
//
// Die Uhr laeuft ueber `lastInputTime`, das schon ui_input.js bei jedem
// Tastendruck und Klick setzt. Diese Datei fuehrt keine zweite Uhr: zwei
// Zeitgeber, die auseinanderlaufen, waeren genau der Fehler, den wir bei der
// Sektor-Anzeige hatten.
//
// Das Fenster ist ein echtes `<div>` im DOM (kein `alert`), damit es im
// Pip-Boy-Stil erscheint und die Tastatur weiter funktioniert.

const AFK_GRENZE = 5 * 60 * 1000;      // 5 Minuten ohne Eingabe -> Fenster
const AFK_NACHLauf = 60 * 1000;        // 60 Sekunden ohne Reaktion -> raus
const TICK = 500;                      // so oft wird nachgesehen

const UI_AFK = {
    // Wird beim Einloggen auf jetzt gesetzt, damit die Zeit nicht aus dem
    // Login-Bildschirm mitzaehlt.
    uhrStart: 0,
    fensterOffen: false,
    ticker: null,

    // Nur im Spiel: nicht auf dem Login-Bildschirm, nicht im Charakter-Menue.
    laeuft: function () {
        if (typeof Game === 'undefined' || !Game.state) return false;
        const login = document.getElementById('login-screen');
        const loginWeg = login && (login.style.display === 'none' || login.classList.contains('hidden'));
        const auth = (typeof Network !== 'undefined' && Network.myId);
        return Boolean(loginWeg && auth);
    },

    start: function () {
        this.uhrStart = Date.now();
        if (typeof UI !== 'undefined') UI.lastInputTime = this.uhrStart;
        this.fensterSchliessen();
        if (this.ticker) return;
        this.ticker = setInterval(() => this.pruefen(), TICK);
    },

    stopp: function () {
        if (this.ticker) clearInterval(this.ticker);
        this.ticker = null;
        this.fensterSchliessen();
    },

    // Wird beim Zurueckkommen ins Spiel gerufen, nicht bei jedem Zug: sonst
    // zaehlt die AFK-Uhr nie hoch.
    meldeEingabe: function () {
        if (typeof UI !== 'undefined') UI.lastInputTime = Date.now();
        if (this.fensterOffen) this.fensterSchliessen();
    },

    // Wie lange ist es her? In Millisekunden, nie negativ (eine Uhr kann
    // springen, wenn das Geraet schlaeft).
    stille: function () {
        const letzte = (typeof UI !== 'undefined' && UI.lastInputTime) || this.uhrStart || Date.now();
        return Math.max(0, Date.now() - letzte);
    },

    pruefen: function () {
        if (typeof document === 'undefined') return;
        if (!this.laeuft()) {
            // Auf dem Login-Bildschirm gibt es nichts zu bewachen. Das Fenster
            // darf dort auch nicht stehenbleiben.
            if (this.fensterOffen) this.fensterSchliessen();
            return;
        }
        const stille = this.stille();
        if (stille >= AFK_GRENZE + AFK_NACHLauf) {
            this.ausloggen();
            return;
        }
        if (stille >= AFK_GRENZE) {
            this.fensterZeigen(AFK_GRENZE + AFK_NACHLauf - stille);
        }
    },

    fensterZeigen: function (restMs) {
        const feld = this.feld();
        if (!feld) return;
        this.fensterOffen = true;
        feld.hidden = false;
        // Die Animation jedes Mal neu anstossen - sonst rastet das Feld beim
        // zweiten Mal nicht mehr ein.
        const feldInnen = feld.querySelector('.popup-feld');
        if (feldInnen) {
            feldInnen.style.animation = 'none';
            void feldInnen.offsetWidth;
            feldInnen.style.animation = '';
        }
        this.zaehlerZeichnen(restMs);
        const knopf = feld.querySelector('[data-afk-bleiben]');
        if (knopf && document.activeElement !== knopf) knopf.focus();
    },

    zaehlerZeichnen: function (restMs) {
        const feld = this.feld();
        if (!feld) return;
        const sekunden = Math.max(0, Math.ceil(restMs / 1000));
        const zaehler = feld.querySelector('[data-afk-zaehler]');
        if (zaehler) zaehler.textContent = `${String(Math.floor(sekunden / 60))}:${String(sekunden % 60).padStart(2, '0')}`;
        const balken = feld.querySelector('[data-afk-balken]');
        if (balken) balken.style.width = `${Math.max(0, Math.min(100, (restMs / AFK_NACHLauf) * 100))}%`;
    },

    fensterSchliessen: function () {
        const feld = this.feld();
        if (feld) feld.hidden = true;
        this.fensterOffen = false;
    },

    ausloggen: function () {
        this.fensterSchliessen();
        if (this.ticker) clearInterval(this.ticker);
        this.ticker = null;
        if (typeof UI !== 'undefined' && typeof UI.logout === 'function') {
            UI.logout('AFK: ZEITUEBERSCHREITUNG');
        }
    },

    // Das Fenster entsteht beim ersten Bedarf und bleibt danach im DOM.
    // Kein innerHTML bei jedem Tick: das wuerde die Animation und den Fokus
    // jede halbe Sekunde zerreissen.
    feld: function () {
        let el = document.getElementById('afk-popup');
        if (el || typeof document === 'undefined' || !document.body) return el;
        el = document.createElement('div');
        el.id = 'afk-popup';
        el.className = 'popup-mitte';
        el.hidden = true;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.setAttribute('aria-labelledby', 'afk-popup-titel');
        el.innerHTML = `
            <div class="popup-feld">
                <div class="popup-titel" id="afk-popup-titel">BIST DU NOCH DA?</div>
                <div class="popup-text">Keine Eingabe seit fuenf Minuten.</div>
                <div class="popup-text" style="margin-top:.35rem">
                    In <span data-afk-zaehler class="text-yellow-400">1:00</span> wirst du abgemeldet.
                </div>
                <div style="height:6px;background:#0f1f0f;border:1px solid #14532d;margin-top:.7rem">
                    <div data-afk-balken style="height:100%;width:100%;background:#39ff14;transition:width .45s linear"></div>
                </div>
                <div class="popup-knoepfe">
                    <button type="button" data-afk-bleiben class="action-button">ICH BIN DA</button>
                </div>
                <div class="popup-zeile" style="margin-top:.7rem">
                    <span>VAULT-TEC // SITZUNGSSCHUTZ</span><span>5 MIN</span>
                </div>
            </div>`;
        document.body.appendChild(el);
        const bleiben = el.querySelector('[data-afk-bleiben]');
        if (bleiben) {
            bleiben.onclick = (e) => {
                if (e) { e.preventDefault(); e.stopPropagation(); }
                this.meldeEingabe();
            };
        }
        return el;
    }
};

window.UI = window.UI || {};
window.AFK = UI_AFK;

// Einstiegspunkte fuer den Rest des Spiels. Bewusst duenn: die Pruefung haengt
// in update(), damit sie nicht von einem Timer abhaengt, den ein schlafender
// Tab anhaelt.
window.UI.starteAfkSchutz = function () { UI_AFK.start(); };
window.UI.stoppeAfkSchutz = function () { UI_AFK.stopp(); };

// Export fuer die Tests. Im Browser ist `module` nicht definiert; dann bleibt
// es bei window.AFK.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {UI_AFK, AFK_GRENZE, AFK_NACHLauf};
}
