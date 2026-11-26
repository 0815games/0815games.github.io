// Zentrales Escaping für alle Stellen, die Benutzer- oder Spieldaten in
// HTML-Vorlagen einsetzen. Grund: Heldnamen stammen aus einer Eingabe und
// werden über Firebase gespeichert – sie dürfen nie als Markup interpretiert
// werden. textContent ist weiterhin der bevorzugte Weg; dieses Modul ist für
// die Fälle da, in denen eine HTML-Vorlage unvermeidbar ist.

const MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
}
