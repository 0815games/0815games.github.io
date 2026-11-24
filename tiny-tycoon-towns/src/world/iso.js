// Isometrische Projektion und deterministischer Zufall für die Weltansicht.
// Rein: keine DOM- oder Canvas-Abhängigkeit, daher mit node --test prüfbar.

export const TW = 88;        // Breite einer Kachel in Pixeln bei Zoom 1
export const TH = 44;        // Höhe einer Kachel (2:1)
export const HW = TW / 2;
export const HH = TH / 2;

/** Kachelecke (x, y) bzw. Punkt in Kachelkoordinaten nach Bildschirm. z hebt an (Pixel). */
export function toScreen(x, y, z = 0) {
  return { x: (x - y) * HW, y: (x + y) * HH - z };
}

/** Umkehrung auf der Bodenebene (z = 0). Liefert fließende Kachelkoordinaten. */
export function toTile(sx, sy) {
  return {
    x: (sx / HW + sy / HH) / 2,
    y: (sy / HH - sx / HW) / 2,
  };
}

/** Stabiler Zufallswert in [0, 1) für eine Kachel und einen Zusatzschlüssel. */
export function hash(x, y, salt = 0) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt | 0, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
