// AFK-Modus: Nach 5 Minuten ohne Eingabe wird die Sitzung beendet (Abmelden, Stadt vorher sichern).
// Die Zeitlogik ist vom DOM getrennt, damit sie in Tests ohne Browser läuft.

export const AFK_LIMIT_MS = 5 * 60_000;
export const AFK_CHECK_MS = 10_000;
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'];

/** true, wenn seit der letzten Eingabe mindestens limitMs vergangen sind. */
export function isAfk(lastActivityAt, now, limitMs = AFK_LIMIT_MS) {
  return Number.isFinite(lastActivityAt) && now - lastActivityAt >= limitMs;
}

/**
 * Beobachtet Eingaben und ruft onAfk genau einmal auf, wenn die Grenze erreicht ist.
 * Liefert die Stopfunktion. stop.check() prüft sofort (für Tests).
 * Ein Tab im Hintergrund zählt als inaktiv, Zurückkehren ohne Eingabe setzt den Zähler nicht zurück.
 */
export function startAfkWatch(onAfk, {
  limitMs = AFK_LIMIT_MS,
  checkMs = AFK_CHECK_MS,
  now = () => Date.now(),
  target = globalThis,
} = {}) {
  let last = now();
  let fired = false;   // Grenze schon gemeldet
  let stopped = false; // Beobachtung beendet
  let timer = null;
  const touch = () => { if (!fired && !stopped) last = now(); };
  const opts = { passive: true, capture: true };
  for (const ev of ACTIVITY_EVENTS) target.addEventListener?.(ev, touch, opts);

  function check() {
    if (fired || stopped) return;
    if (isAfk(last, now(), limitMs)) {
      fired = true;
      stop();
      onAfk();
    }
  }

  function stop() {
    stopped = true;
    if (timer !== null) clearInterval(timer);
    timer = null;
    for (const ev of ACTIVITY_EVENTS) target.removeEventListener?.(ev, touch, opts);
  }

  timer = setInterval(check, checkMs);
  stop.check = check;
  return stop;
}

/** Vollbild-Hinweis für den AFK-Modus. Ein Klick schließt ihn. */
export function showAfkOverlay(text) {
  document.getElementById('afk-overlay')?.remove();
  const wrap = document.createElement('div');
  wrap.id = 'afk-overlay';
  wrap.setAttribute('role', 'alertdialog');
  wrap.setAttribute('aria-labelledby', 'afk-title');
  wrap.setAttribute('aria-describedby', 'afk-text');
  wrap.innerHTML = `<div class="afk-card">
    <div class="afk-moon" aria-hidden="true">🌙</div>
    <div class="afk-zzz" aria-hidden="true"><span>z</span><span>Z</span><span>Z</span></div>
    <h2 id="afk-title">Deine Stadt schläft</h2>
    <p id="afk-text"></p>
    <button type="button" class="primary" id="afk-ok">Zur Anmeldung</button>
  </div>`;
  wrap.querySelector('#afk-text').textContent = text;
  document.body.append(wrap);
  const ok = wrap.querySelector('#afk-ok');
  ok.addEventListener('click', () => wrap.remove());
  ok.focus();
}
