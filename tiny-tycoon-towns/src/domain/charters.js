// Freibriefe (Prestige) nach docs/GAME_PLAN.md, Abschnitt 4.11.
// Reine Rechenregeln. Oberfläche und Speichern in main.js und cloud.js.
// Die Perk-Wirkung geht über applyCharterToData() in die Spieldaten, die Wirtschaft liest sie dort.

export const CHARTER_MIN_LEVEL = 10;
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
  return { earned: 0, spent: 0, perks: {}, founded: {} };
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

/**
 * Darf diese Stadt jetzt einen Freibrief gründen? Liefert { ok, reason?, gain? }.
 * Jede Stadt bringt nur einmal einen Freibrief, auch wenn der Speicher erneut lädt.
 */
export function canFoundCharter(town, charter) {
  if (charter.founded?.[town.id]) {
    return { ok: false, reason: 'Diese Stadt hat schon einen Freibrief gebracht.' };
  }
  if (town.townLevel < CHARTER_MIN_LEVEL) {
    return { ok: false, reason: `Stadtlevel ${CHARTER_MIN_LEVEL} nötig.` };
  }
  if (town.lifetimeCoins < CHARTER_MIN_LIFETIME) {
    return { ok: false, reason: '100.000 Münzen Gesamtertrag in dieser Stadt nötig.' };
  }
  return { ok: true, gain: charterGain(town.lifetimeCoins) };
}

/** Schreibt den Gewinn einer Gründung gut und merkt sich die Stadt. Gibt einen neuen Stand zurück. */
export function grantCharters(charter, town) {
  return {
    ...charter,
    earned: charter.earned + charterGain(town.lifetimeCoins),
    founded: { ...(charter.founded ?? {}), [town.id]: true },
  };
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
/**
 * Kopie der Spieldaten mit den Perk-Wirkungen dieses Kontos. Die Originaldaten bleiben unverändert.
 * Faktoren: yieldMultiplier (Ertrag), storageMultiplier (Lager), priceMultiplier (Verkaufspreis),
 * offline.baseCapHours (Offline-Obergrenze, +Stunden).
 */
export function applyCharterToData(data, charter) {
  const c = charter ?? emptyCharter();
  const e = data.economy;
  return {
    ...data,
    economy: {
      ...e,
      yieldMultiplier: 1 + perkEffect(c, 'yield'),
      storageMultiplier: 1 + perkEffect(c, 'storage'),
      priceMultiplier: 1 + perkEffect(c, 'market'),
      expressLevel: perkLevel(c, 'express'),
      offline: { ...e.offline, baseCapHours: e.offline.baseCapHours + perkEffect(c, 'memory') },
    },
  };
}

export function perkEffect(charter, id) {
  const def = PERKS.find((p) => p.id === id);
  return def ? perkLevel(charter, id) * def.per : 0;
}
