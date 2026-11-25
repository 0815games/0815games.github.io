// Freundschaftsanfragen: Auswahl und Anzeige-Text für den Hinweis (rein, ohne DOM, testbar).

/** Die erste Anfrage, die in dieser Sitzung noch nicht gezeigt wurde. Sonst null. */
export function nextRequestToShow(pending, shown) {
  return pending.find((r) => !shown.has(r.from)) ?? null;
}

/**
 * Darf jetzt ein Anfrage-Popup erscheinen? Nur beim Spielen (Stadt geladen, gleiches Konto) und nur, wenn kein
 * anderes Fenster offen ist. Sonst wird es nach dem Schließen des Fensters erneut geprüft.
 */
export function canShowRequestPopup({ hasState, uid, requestUid, dialogOpen, sheetOpen }) {
  return Boolean(hasState && uid && requestUid === uid && !dialogOpen && !sheetOpen);
}

/** Beschriftung für den Menü-Hinweis, z. B. „Menü, 2 Freundschaftsanfragen“. */
export function requestBadgeLabel(count) {
  if (count <= 0) return 'Menü';
  return `Menü, ${count} Freundschaftsanfrage${count === 1 ? '' : 'n'}`;
}
