// Lager unten links: Hilfsfunktionen ohne DOM (testbar). Die Anzeige selbst steht in main.js.

/** Ressourcen, deren Lager voll ist (Bestand erreicht die Obergrenze). */
export function fullResources(stock, cap, ids) {
  return ids.filter((r) => (stock[r] ?? 0) >= cap);
}

/** Füllstand in Prozent, begrenzt auf 0 bis 100. */
export function fillPercent(amount, cap) {
  if (!(cap > 0)) return 0;
  return Math.min(100, Math.max(0, (amount / cap) * 100));
}
