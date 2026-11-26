// Phase 5 – gemeinsame 3D-Kampfbühne: Kamera- und Bühnenlogik.
//
// Bewusst frei von Three.js-Abhängigkeiten und von Spielzustand: Hier stehen
// nur die reinen Rechnungen, damit sie ohne WebGL prüfbar sind. Der Renderer
// (world3d-phase1.js) ruft diese Funktionen auf.
//
// Bühnenlayout: Der Held steht links, der Gegner rechts, beide auf derselben
// Reihe. Das Kampffeld ist die Mitte zwischen beiden; die Kamera blickt von
// schräg oben darauf.

export const STAGE = Object.freeze({
  heroOffset: -1.15,   // Held relativ zur Kampfmitte (x)
  enemyOffset: 1.05,   // Gegner relativ zur Kampfmitte (x)
  laneZ: 0,            // beide auf derselben Tiefe
  zoomIn: 0.42,        // Ortho-Höhe im Kampf (kleiner = näher dran)
  zoomOut: 1,          // Faktor der Erkundungskamera
  height: 12,          // Kamerahöhe (wie Erkundung)
  depth: 9,            // Kameraabstand in +z
  ease: 0.16           // Übergangsgeschwindigkeit pro Frame (0..1)
});

// Kampfmitte aus Held und Gegner. Fällt auf die Heldenposition zurück, wenn
// (noch) kein Gegner bekannt ist.
export function stageCenter(hero, enemy) {
  const hx = Number.isFinite(hero?.x) ? hero.x + 0.5 : 0;
  const hz = Number.isFinite(hero?.y) ? hero.y + 0.5 : 0;
  if (!enemy || !Number.isFinite(enemy.x) || !Number.isFinite(enemy.y)) {
    return { x: hx, z: hz, valid: false };
  }
  return {
    x: (hx + (enemy.x + 0.5)) / 2,
    z: (hz + (enemy.y + 0.5)) / 2,
    valid: true
  };
}

// Positionen der beiden Bühnenfiguren. Beide stehen im Kampf auf derselben
// Reihe; der Held links, der Gegner rechts.
//
// Kämpfe am Kartenrand würden die Bühne über die Karte hinausschieben. Mit
// `bounds` (Weltkoordinaten) wird deshalb die *Mitte* so weit verschoben, dass
// beide Plätze innerhalb der Karte liegen – der Abstand bleibt dabei gleich.
export function stagePositions(center, bounds = null) {
  let x = center.x;
  let z = center.z;

  if (bounds) {
    const minX = Number.isFinite(bounds.minX) ? bounds.minX : -Infinity;
    const maxX = Number.isFinite(bounds.maxX) ? bounds.maxX : Infinity;
    const minZ = Number.isFinite(bounds.minZ) ? bounds.minZ : -Infinity;
    const maxZ = Number.isFinite(bounds.maxZ) ? bounds.maxZ : Infinity;

    x = clamp(x, minX - STAGE.heroOffset, maxX - STAGE.enemyOffset);
    z = clamp(z, minZ - STAGE.laneZ, maxZ - STAGE.laneZ);
  }

  return {
    hero: { x: x + STAGE.heroOffset, z: z + STAGE.laneZ },
    enemy: { x: x + STAGE.enemyOffset, z: z + STAGE.laneZ }
  };
}

function clamp(value, min, max) {
  if (min > max) return (min + max) / 2;
  return Math.max(min, Math.min(max, value));
}

// Kartengrenzen als Weltkoordinaten (Mittelpunkte der Randfelder).
export function worldBounds(w) {
  const rows = w?.tiles?.length;
  if (!rows) return null;

  const cols = Math.max(...w.tiles.map((row) => row.length));
  if (!cols) return null;

  return {
    minX: 0.5,
    maxX: cols - 0.5,
    minZ: 0.5,
    maxZ: rows - 0.5
  };
}

// Annäherung für flüssige Übergänge, ohne Zustand im Modul.
export function approach(current, target, ease = STAGE.ease) {
  const from = Number.isFinite(current) ? current : target;
  const step = Math.max(0, Math.min(1, ease));
  return from + (target - from) * step;
}

// Zielzustand der Kamera für den aktuellen Modus.
//   mode 'explore' -> feste Kamera auf dem Helden, Zoom 1
//   mode 'combat'  -> Kamera über der Kampfmitte, Zoom zoomIn
export function cameraTarget({ mode, hero, enemy, zoomOut = 1 }) {
  if (mode === 'combat') {
    const center = stageCenter(hero, enemy);
    return {
      x: center.x,
      z: center.z,
      height: STAGE.height,
      depth: STAGE.depth,
      zoom: STAGE.zoomIn,
      centered: center.valid
    };
  }
  return {
    x: (Number.isFinite(hero?.x) ? hero.x : 0) + 0.5,
    z: (Number.isFinite(hero?.y) ? hero.y : 0) + 0.5,
    height: STAGE.height,
    depth: STAGE.depth,
    zoom: zoomOut,
    centered: true
  };
}

// Sichtbarkeitsregel: In der Erkundung gilt Nebel (nur entdeckte Felder).
// Im Kampf muss die Bühne sichtbar sein, auch wenn der Gegner noch nicht
// aufgedeckt war – sonst kämpft man gegen einen unsichtbaren Gegner.
export function visibleInMode({ mode, discovered, isHero, isEnemy }) {
  if (isHero) return true;
  // Nur der aktive Gegner steht im Kampf auf der Bühne. Alle anderen Monster
  // bleiben der Erkundung unterworfen.
  if (mode === 'combat' && isEnemy) return true;
  return discovered === true;
}

// --- Effekt-Brücke -------------------------------------------------------
//
// Die Kampf-Effekte (Trefferzahlen, Ringe, Funken) werden weiterhin mit
// Kachelkoordinaten erzeugt. Auf der Bühne stehen die Figuren aber nicht auf
// ihren Kacheln, sondern links und rechts der Kampfmitte. Damit Treffer dort
// erscheinen, wo sie hingehören, wird der Effekt um die Differenz zwischen
// Bühnenplatz und Kachel verschoben.
//
// Die Verschiebung wird pro Effekt über den *nächstgelegenen* der beiden
// Kämpfer bestimmt. Dadurch bleiben Funkenwolken zusammen und driften
// gemeinsam, statt bei jedem Frame neu zu springen.

export const EFFECT_TILE = 32;

// Nächster Kämpfer zu einer Pixelposition. Liefert null, wenn beide zu weit
// entfernt sind (dann bleibt der Effekt an seinem Ort).
export function effectAnchor(px, py, hero, enemy, radius = 2.5) {
  const tile = EFFECT_TILE;
  const ex = px / tile;
  const ey = py / tile;

  let best = null;
  let bestDist = Infinity;

  for (const [kind, who] of [['hero', hero], ['enemy', enemy]]) {
    if (!Number.isFinite(who?.x) || !Number.isFinite(who?.y)) continue;
    const dx = ex - (who.x + 0.5);
    const dy = ey - (who.y + 0.5);
    const dist = Math.hypot(dx, dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = kind;
    }
  }

  return bestDist <= radius ? best : null;
}

// Verschiebung in Pixeln für einen Effekt an (px,py). Ohne Bühne (spots null)
// bleibt alles unverändert.
export function effectShift(px, py, hero, enemy, spots) {
  if (!spots) return { dx: 0, dy: 0 };

  const kind = effectAnchor(px, py, hero, enemy);
  if (!kind) return { dx: 0, dy: 0 };

  const who = kind === 'hero' ? hero : enemy;
  const spot = kind === 'hero' ? spots.hero : spots.enemy;
  if (!spot) return { dx: 0, dy: 0 };

  const tile = EFFECT_TILE;
  return {
    dx: spot.x * tile - (who.x + 0.5) * tile,
    dy: spot.z * tile - (who.y + 0.5) * tile
  };
}

// Baut eine Sicht auf die Effektlisten, in der die Kämpfer-Effekte auf ihren
// Bühnenplätzen liegen. Die Originalobjekte des 2D-Renderers werden weder
// verändert noch ersetzt – es entstehen nur flache Kopien.
export function stageEffectView(effects, { hero, enemy, spots } = {}) {
  if (!effects || !spots) return effects;

  const map = (list) => {
    if (!Array.isArray(list)) return list;
    return list.map((entry) => {
      if (!entry) return entry;
      const { dx, dy } = effectShift(entry.x, entry.y, hero, enemy, spots);
      if (!dx && !dy) return entry;
      return { ...entry, x: entry.x + dx, y: entry.y + dy };
    });
  };

  return {
    ...effects,
    particles: map(effects.particles),
    waves: map(effects.waves),
    texts: map(effects.texts)
  };
}


// --- Bühnenboden ---------------------------------------------------------
//
// Die Bühnenplätze werden aus der Kampfmitte berechnet und können auf noch
// nicht entdeckten Feldern liegen. Ohne Boden schweben die Figuren im Nichts.
// Diese Funktion liefert die Felder, die während des Kampfs zusätzlich
// sichtbar sein müssen – nur Lesen, keine Änderung an der Weltkarte.

export function stageCells(w, hero, enemy, spots) {
  if (!spots) return [];

  const cells = [];
  const seen = new Set();

  const add = (x, z) => {
    const cx = Math.floor(x);
    const cz = Math.floor(z);
    if (!Number.isInteger(cx) || !Number.isInteger(cz)) return;
    if (cz < 0 || cx < 0) return;
    if (!w?.tiles?.[cz] || w.tiles[cz][cx] === undefined) return;
    const key = cx + ':' + cz;
    if (seen.has(key)) return;
    seen.add(key);
    cells.push({ x: cx, y: cz });
  };

  // Mittleres Feld zwischen den Kämpfern, die Bühnenplätze und die
  // Kacheln, auf denen beide tatsächlich stehen.
  for (const spot of [spots.hero, spots.enemy]) {
    add(spot.x, spot.z);
    add(spot.x - 0.5, spot.z - 0.5);
  }

  if (Number.isFinite(hero?.x) && Number.isFinite(hero?.y)) {
    add(hero.x, hero.y);
  }
  if (Number.isFinite(enemy?.x) && Number.isFinite(enemy?.y)) {
    add(enemy.x, enemy.y);
  }

  return cells;
}
