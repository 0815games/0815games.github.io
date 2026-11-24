// Freibriefe (Prestige) nach docs/GAME_PLAN.md, Abschnitt 4.11.
// Reine Rechenregeln: keine Oberfläche, kein Speichern. Die Anbindung an Stand und Spiel folgt später.

export const CHARTER_MIN_LEVEL = 8;
export const CHARTER_MIN_LIFETIME = 100000;
export const CHARTER_UNIT = 100000;

// Perk-Baum. `per` ist der Effekt je Stufe, `max` die höchste Stufe. Gesamt: 28 Punkte.
export const PERKS = [
  { id: 'yield', max: 5, per: 0.05, label: 'Ertrag', effect: '+5 % Produktion' },
  { id: 'storage', max: 5, per: 0.2, label: 'Lagerhaus', effect: '+20 % Lagerkapazität' },
  { id: 'market', max: 5, per: 0.05, label: 'Warenkenner', effect: '+5 % Verkaufspreis' },
  { id: 'startCoins', max: 5, per: 250, label: 'Startkapital', effect: '+250 Münzen beim Start' },
  { id: 'memory', max: 3, per: 1, label: 'Gedächtnis', effect: '+1 h Offline-Obergrenze' },
  { id: 'express', max: 5, per: 0.05, label: 'Eilpost', effect: '−5 % Konvoi-Dauer (ab P2)' },
];

export const TOTAL_PERK_POINTS = PERKS.reduce((sum, p) => sum + p.max, 0);

export function emptyCharter() {
  return { earned: 0, spent: 0, perks: {} };
}

/** Freibriefe, die gerade gebraucht werden können (gewonnen minus ausgegeben). */
export function availableCharters(charter) {
  return charter.earned - charter.spent;
}

export function perkLevel(charter, id) {
  return charter.perks?.[id] ?? 0;
}

/** Anzahl Freibriefe, die eine Stadt mit diesem Gesamtertrag einbringt. */
export function charterGain(lifetimeCoinsThisTown) {
  return Math.floor(Math.sqrt(Math.max(0, lifetimeCoinsThisTown) / CHARTER_UNIT));
}

/** Darf eine Stadt jetzt einen Freibrief gründen? Liefert { ok, reason?, gain? }. */
export function canFoundCharter(town) {
  if (town.townLevel < CHARTER_MIN_LEVEL) {
    return { ok: false, reason: `Stadtlevel ${CHARTER_MIN_LEVEL} nötig.` };
  }
  if (town.lifetimeCoins < CHARTER_MIN_LIFETIME) {
    return { ok: false, reason: '100.000 Münzen Gesamtertrag in dieser Stadt nötig.' };
  }
  return { ok: true, gain: charterGain(town.lifetimeCoins) };
}

/** Schreibt den Gewinn einer Gründung gut. Gibt einen neuen Stand zurück. */
export function grantCharters(charter, lifetimeCoinsThisTown) {
  return { ...charter, earned: charter.earned + charterGain(lifetimeCoinsThisTown) };
}

/** Kauft eine Perk-Stufe. Liefert { ok, reason?, charter? }. */
export function buyPerk(charter, id) {
  const def = PERKS.find((p) => p.id === id);
  if (!def) return { ok: false, reason: 'Unbekannter Perk.' };
  const level = perkLevel(charter, id);
  if (level >= def.max) return { ok: false, reason: 'Schon auf der höchsten Stufe.' };
  if (availableCharters(charter) < 1) return { ok: false, reason: 'Kein Freibrief frei.' };
  return {
    ok: true,
    charter: { ...charter, spent: charter.spent + 1, perks: { ...charter.perks, [id]: level + 1 } },
  };
}

/** Wirkung eines Perks bei der aktuellen Stufe, z. B. 0.10 für +10 % oder 500 für Startmünzen. */
export function perkEffect(charter, id) {
  const def = PERKS.find((p) => p.id === id);
  return def ? perkLevel(charter, id) * def.per : 0;
}
