// Stadtnamen sind eindeutig. Der Schlüssel ist der normalisierte Name (Groß/Klein und mehrfache Leerzeichen egal).
// Die Datenbankregeln prüfen dasselbe Muster: nur Zeichen, die als Datenbankschlüssel erlaubt sind.

export const NAME_MAX = 24;
const FORBIDDEN = /[.#$[\]/]/;

export function townKey(name) {
  return String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Prüft einen Stadtnamen. Liefert { ok, key } oder { ok: false, reason } mit einer Meldung für den Spieler. */
export function checkTownName(name) {
  const clean = String(name ?? '').trim().replace(/\s+/g, ' ');
  if (!clean) return { ok: false, reason: 'Gib deiner Stadt einen Namen.' };
  if (clean.length > NAME_MAX) return { ok: false, reason: `Höchstens ${NAME_MAX} Zeichen.` };
  if (FORBIDDEN.test(clean)) return { ok: false, reason: 'Die Zeichen . # $ [ ] / sind im Namen nicht erlaubt.' };
  return { ok: true, key: townKey(clean), name: clean };
}
