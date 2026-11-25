// Freundschaftsanfragen: Auswahl und Anzeige-Text für den Hinweis (rein, ohne DOM, testbar).

/** Die erste Anfrage, die in dieser Sitzung noch nicht gezeigt wurde. Sonst null. */
export function nextRequestToShow(pending, shown) {
  return pending.find((r) => !shown.has(r.from)) ?? null;
}

/** Beschriftung für den Menü-Hinweis, z. B. „Menü, 2 Freundschaftsanfragen“. */
export function requestBadgeLabel(count) {
  if (count <= 0) return 'Menü';
  return `Menü, ${count} Freundschaftsanfrage${count === 1 ? '' : 'n'}`;
}
