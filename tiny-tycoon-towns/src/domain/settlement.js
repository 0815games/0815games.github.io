// Siedlungen: Bevölkerung in Wohnhäusern, automatische und manuelle Zuweisung zu Produktionsgebäuden,
// Ertrag je Besetzung, Tageslohn. Reine Rechenregeln, kein Zustand, keine Oberfläche.
// Zahlen stehen in data/settlements.json. Diese Datei bekommt nur die Daten, nicht den Spielstand.

/** Stufe 1 bis 5 eines Gebäudes aus seiner Stufe (Stufenschwellen aus den Daten). */
export function stageFor(level, cfg) {
  let idx = 0;
  cfg.stages.forEach((s, i) => { if (level >= s.fromLevel) idx = i; });
  return { index: idx + 1, ...cfg.stages[idx] };
}

/** Kapazität eines Wohnhauses auf seiner Stufe. */
export function houseCapacity(level, cfg) {
  return stageFor(level, cfg).capacity;
}

/**
 * Ein Haus wächst langsam bis zur Kapazität. Der Fortschritt bleibt als Bruchteil erhalten, damit
 * kleine Zeitspannen nicht verloren gehen. Über der Kapazität (nach Abbau) sinkt die Zahl auf die Kapazität.
 */
export function growHouse(house, dtMin, cfg) {
  const cap = houseCapacity(house.level, cfg);
  let pop = house.pop ?? cfg.startPop;
  let progress = house.progress ?? 0;
  if (pop > cap) return { ...house, pop: cap, progress: 0 };
  if (pop >= cap) return { ...house, pop, progress: 0 };
  progress += cfg.growthPerMin * dtMin;
  const whole = Math.floor(progress);
  pop = Math.min(cap, pop + whole);
  progress = pop >= cap ? 0 : progress - whole;
  return { ...house, pop, progress };
}

/**
 * Ertragsfaktor eines Produktionsgebäudes bei n Arbeitern. Ohne Arbeiter gilt `unstaffedFactor` (Startwert 1,
 * damit bestehende Städte unverändert produzieren). Voll besetzt kommt `staffBonus` dazu (Startwert +25 %).
 * Die Regel ist eine Nutzerentscheidung offen: Setzt man unstaffedFactor auf 0, braucht jedes Gebäude Arbeiter.
 */
export function staffFactor(n, slots, cfg) {
  const filled = Math.min(Math.max(n, 0), slots) / slots;
  return cfg.unstaffedFactor + cfg.staffBonus * filled;
}

/** Lohn, der in `dtMin` Minuten für `workers` Arbeiter fällig wird. */
export function wageDue(workers, dtMin, cfg) {
  return workers * cfg.wagePerWorkerPerDay * dtMin / 1440;
}

const dist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/**
 * Zuweisung. houses: [{ key, x, y, pop }], producers: [{ key, x, y, rate, slots? }], manual: [{ house, producer, n }].
 * Manuelle Zuweisungen gelten zuerst, wenn Entfernung und Bevölkerung passen. Der Rest wird automatisch verteilt:
 * zuerst die Gebäude mit dem höchsten Grundertrag, dann die nächsten Häuser im Pendelbereich.
 * Liefert { byProducer: {key: n}, byHouse: {key: n}, rejected: [...] }.
 */
export function assignWorkers(houses, producers, manual, cfg) {
  const free = new Map(houses.map((h) => [h.key, h.pop ?? 0]));
  const byHouse = Object.fromEntries(houses.map((h) => [h.key, 0]));
  const byProducer = Object.fromEntries(producers.map((p) => [p.key, 0]));
  const H = new Map(houses.map((h) => [h.key, h]));
  const P = new Map(producers.map((p) => [p.key, p]));
  const rejected = [];

  const take = (hk, pk, n) => {
    const h = H.get(hk), p = P.get(pk);
    const slots = p.slots ?? cfg.workSlots;
    const room = Math.min(free.get(hk), slots - byProducer[pk]);
    const give = Math.min(n, room);
    if (give <= 0) return 0;
    free.set(hk, free.get(hk) - give);
    byHouse[hk] += give;
    byProducer[pk] += give;
    return give;
  };

  for (const m of manual) {
    const h = H.get(m.house), p = P.get(m.producer);
    if (!h || !p) { rejected.push({ ...m, reason: 'unknown' }); continue; }
    if (dist(h, p) > cfg.commuteDistance) { rejected.push({ ...m, reason: 'distance' }); continue; }
    const done = take(m.house, m.producer, m.n);
    if (done < m.n) rejected.push({ ...m, reason: 'capacity', given: done });
  }

  const order = [...producers].sort((a, b) => b.rate - a.rate || (a.key < b.key ? -1 : 1));
  for (const p of order) {
    const slots = p.slots ?? cfg.workSlots;
    let need = slots - byProducer[p.key];
    if (need <= 0) continue;
    const near = houses
      .filter((h) => dist(h, p) <= cfg.commuteDistance && free.get(h.key) > 0)
      .sort((a, b) => dist(a, p) - dist(b, p) || (a.key < b.key ? -1 : 1));
    for (const h of near) {
      if (need <= 0) break;
      need -= take(h.key, p.key, Math.min(need, free.get(h.key)));
    }
  }
  return { byProducer, byHouse, rejected };
}
