// Weltansicht: Insel im Meer, Kamera, Eingabe, Partikel und Tag-Nacht.
// renderWorld() zeichnet nur auf einen Kontext und ist deshalb auch ohne Browser prüfbar.
// createScene() verbindet sie mit einem <canvas> im DOM.
import { HW, HH, toScreen, toTile, hash } from './iso.js?v=20261124-sitz9';
import { drawTile, drawBuilding, fillPoly, shade, mix, P } from './art.js?v=20261124-sitz9';

export const GRID_SIZE = 10;     // spielbares Raster (siehe src/domain/grid.js)
export const HALL = { x: 4, y: 4 };
export const PAD = 9;            // Land und Meer außerhalb des Rasters, in Kacheln
const ISLAND_CENTER = 4.5;
const ISLAND_RADIUS = 11.5;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.4;

/** Gelände außerhalb des Spielrasters: deterministisch, ohne Zustand. */
export function outerTerrain(x, y) {
  const d = Math.hypot(x - ISLAND_CENTER, y - ISLAND_CENTER) + (hash(x, y, 5) - 0.5) * 2.4;
  if (d > ISLAND_RADIUS) return 'water';
  if (d > ISLAND_RADIUS - 1.6) return 'sand';
  const r = hash(x, y, 6);
  if (r < 0.2) return 'forest';
  if (r < 0.28) return 'rock';
  return 'meadow';
}

/** Tageslicht 0 (Nacht) … 1 (Mittag), aus der Uhrzeit. Spitze um 13 Uhr. */
export function dayFactor(date) {
  const h = date.getHours() + date.getMinutes() / 60;
  const c = Math.cos(((h - 13) / 24) * Math.PI * 2);
  return Math.max(0, Math.min(1, (c + 0.15) / 0.45));
}

const CHIMNEYS = {
  sawmill: [-0.2, 0.12, 48],
  townHall: [-0.12, -0.16, 76],
  saltworks: [0.23, -0.2, 38],
  mine: [0.0, -0.02, 26],
};

/** Partikel-Zustand (Münzen, Symbole, Rauch). */
export function makeFx() {
  return { items: [], timers: new Map(), coinsPending: 0, coinsTimer: 0 };
}

function spawn(fx, item) {
  fx.items.push({ life: 0, ...item });
  if (fx.items.length > 220) fx.items.splice(0, fx.items.length - 220);
}

/** Schritt für die Partikel. Erzeugt Rauch und Produktionssymbole, wenn das Modell sie braucht. */
export function stepFx(fx, dt, model) {
  for (const it of fx.items) {
    it.life += dt;
    if (it.kind === 'puff') { it.y -= 14 * dt; it.x += it.drift * dt; }
    else if (it.kind === 'float') { it.y -= 26 * dt; }
  }
  fx.items = fx.items.filter((it) => it.life < it.max);
  if (!model?.state || model.reduceMotion) return;
  // Rauch an Schornsteinen, nur wenn das Gebäude steht.
  for (const [id, [u, v, z]] of Object.entries(CHIMNEYS)) {
    for (const tile of Object.values(model.state.tiles)) {
      if (tile.building?.id !== id) continue;
      const timerKey = `${id}:${tile.x}:${tile.y}`;
      const tm = (fx.timers.get(timerKey) ?? 0) + dt;
      if (tm > 0.7) {
        fx.timers.set(timerKey, 0);
        const p = P(toScreen(tile.x + 0.5, tile.y + 0.5), u, v, z);
        spawn(fx, { kind: 'puff', x: p.x, y: p.y, drift: (Math.random() - 0.3) * 8, max: 2.6 });
      } else fx.timers.set(timerKey, tm);
    }
  }
}

/** Ausgabe-Symbol über einer Produktionskachel, alle paar Sekunden. */
export function produceIcons(fx, dt, model) {
  if (!model?.state || model.reduceMotion) return;
  for (const tile of Object.values(model.state.tiles)) {
    const b = tile.building;
    if (!b) continue;
    const res = model.data?.buildings?.[b.id]?.resource;
    if (!res) continue;
    const timerKey = `prod:${tile.x}:${tile.y}`;
    const tm = (fx.timers.get(timerKey) ?? Math.random() * 2) + dt;
    if (tm > 2.6) {
      fx.timers.set(timerKey, 0);
      const p = toScreen(tile.x + 0.5, tile.y + 0.5, 44);
      spawn(fx, { kind: 'float', x: p.x, y: p.y, text: model.data.resources[res].icon, max: 1.6, size: 16 });
    } else fx.timers.set(timerKey, tm);
  }
}

/** Münzgewinn als schwebende Zahl am Rathaus. Gesammelt, damit nicht jede Sekunde ein Text entsteht. */
export function coinGain(fx, dt, gained) {
  fx.coinsPending += gained;
  fx.coinsTimer += dt;
  if (fx.coinsTimer > 1.2 && fx.coinsPending >= 0.5) {
    const p = toScreen(HALL.x + 0.5, HALL.y + 0.5, 92);
    spawn(fx, { kind: 'float', x: p.x, y: p.y, text: `+${Math.floor(fx.coinsPending)} 🪙`, max: 1.8, size: 15 });
    fx.coinsPending = 0;
    fx.coinsTimer = 0;
  }
}

/** Ob Kachel (x, y) zum Meer gehört (Rand der Insel). */
function isWater(x, y, model) {
  if (x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE) {
    return model.state?.tiles?.[`${x},${y}`]?.terrain === 'water';
  }
  return outerTerrain(x, y) === 'water';
}

function terrainAt(x, y, model) {
  if (x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE) {
    return model.state?.tiles?.[`${x},${y}`]?.terrain ?? 'meadow';
  }
  return outerTerrain(x, y);
}

function inGrid(x, y) {
  return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}

/** Himmel und Meer verlaufen mit der Tageszeit. */
function seaColors(day) {
  return {
    top: mix('#14223f', '#8fdcf5', day),
    bottom: mix('#0b1830', '#2a86c2', day),
  };
}

/** Zeichnet die ganze Szene. view = { x, y, zoom } in Weltpixeln, model = { state, data, selected, unlocked }. */
export function renderWorld(ctx, { W, H, view, model, time, day, fx, hover }) {
  const night = 1 - day;
  // Meer
  const sea = seaColors(day);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, sea.top);
  g.addColorStop(1, sea.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // Sonnenglitzer auf dem Meer
  ctx.fillStyle = `rgba(255,255,255,${0.25 * day})`;
  for (let i = 0; i < 26; i++) {
    const px = (hash(i, 1, 9) * W + time * (8 + i % 5) * 4) % W;
    const py = hash(i, 2, 9) * H;
    ctx.fillRect(px, py + Math.sin(time * 1.5 + i) * 3, 2.2, 1.2);
  }

  // Sichtbarer Kachelbereich, mit Rand
  const toWorld = (sx, sy) => ({ x: (sx - W / 2) / view.zoom + view.x, y: (sy - H / 2) / view.zoom + view.y });
  const corners = [toWorld(0, 0), toWorld(W, 0), toWorld(0, H), toWorld(W, H)].map((p) => toTile(p.x, p.y));
  const x0 = Math.max(-PAD, Math.floor(Math.min(...corners.map((c) => c.x))) - 2);
  const x1 = Math.min(GRID_SIZE + PAD - 1, Math.ceil(Math.max(...corners.map((c) => c.x))) + 2);
  const y0 = Math.max(-PAD, Math.floor(Math.min(...corners.map((c) => c.y))) - 2);
  const y1 = Math.min(GRID_SIZE + PAD - 1, Math.ceil(Math.max(...corners.map((c) => c.y))) + 2);

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(view.zoom, view.zoom);
  ctx.translate(-view.x, -view.y);

  // Malreihenfolge: hinten nach vorn, also nach x + y.
  for (let s = x0 + y0; s <= x1 + y1; s++) {
    for (let x = x0; x <= x1; x++) {
      const y = s - x;
      if (y < y0 || y > y1) continue;
      const terrain = terrainAt(x, y, model);
      const locked = inGrid(x, y) && !model.unlocked(x, y);
      drawTile(ctx, x, y, terrain, time, {
        day,
        sideS: terrain !== 'water' && isWater(x, y + 1, model),
        sideE: terrain !== 'water' && isWater(x + 1, y, model),
        locked,
      });
      const tile = inGrid(x, y) ? model.state?.tiles?.[`${x},${y}`] : null;
      if (tile?.building && !locked) {
        drawBuilding(ctx, tile.building.id, x, y, tile.building.level, time, { night, day });
      }
      // Auswahl und Hover
      const c = toScreen(x + 0.5, y + 0.5);
      const diamond = [P(c, -0.5, -0.5), P(c, 0.5, -0.5), P(c, 0.5, 0.5), P(c, -0.5, 0.5)];
      if (inGrid(x, y) && model.selected && model.selected.x === x && model.selected.y === y) {
        ctx.strokeStyle = `rgba(255,209,102,${0.6 + 0.4 * Math.sin(time * 4)})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        diamond.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.stroke();
      } else if (hover && hover.x === x && hover.y === y) {
        fillPoly(ctx, diamond, 'rgba(255,255,255,0.18)');
      }
    }
  }

  // Schwebende Partikel in Weltkoordinaten
  if (fx) {
    for (const it of fx.items) {
      const k = it.life / it.max;
      if (it.kind === 'puff') {
        ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - k)})`;
        ctx.beginPath();
        ctx.arc(it.x, it.y, 3 + k * 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (it.kind === 'float') {
        ctx.globalAlpha = 1 - k;
        ctx.font = `${it.size ?? 14}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#3a2a10';
        ctx.fillText(it.text, it.x + 1, it.y + 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(it.text, it.x, it.y);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Wolkenschatten über die Insel
  ctx.fillStyle = 'rgba(20,30,60,0.07)';
  for (let i = 0; i < 6; i++) {
    const cx = ((hash(i, 0, 11) * 900 + time * (10 + i * 2)) % 1800) - 900;
    const cy = (hash(i, 1, 11) - 0.5) * 900;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 160 + i * 20, 70 + i * 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Nacht: kühler Schleier über allem
  if (night > 0.02) {
    ctx.fillStyle = `rgba(10,16,40,${0.42 * night})`;
    ctx.fillRect(0, 0, W, H);
  }
  // Dämmerungs-Schimmer
  const dusk = Math.max(0, 1 - Math.abs(day - 0.5) * 4) * 0.12;
  if (dusk > 0) {
    ctx.fillStyle = `rgba(255,140,80,${dusk})`;
    ctx.fillRect(0, 0, W, H);
  }
  // Wolken am Himmel (Bildschirmkoordinaten)
  for (let i = 0; i < 4; i++) {
    const cx = ((hash(i, 3, 12) * W * 1.4 + time * (6 + i * 3)) % (W * 1.4)) - W * 0.2;
    const cy = 26 + hash(i, 4, 12) * 90;
    ctx.fillStyle = `rgba(255,255,255,${0.7 - night * 0.45})`;
    for (const [dx, dy, r] of [[0, 0, 22], [24, -6, 26], [52, 2, 20]]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Ein Punkt auf dem Bildschirm → angeklickte Kachel im Raster (oder null). */
export function pickTile(sx, sy, W, H, view) {
  const wx = (sx - W / 2) / view.zoom + view.x;
  const wy = (sy - H / 2) / view.zoom + view.y;
  const approx = toTile(wx, wy);
  const cand = [];
  for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
    const x = Math.floor(approx.x) + dx, y = Math.floor(approx.y) + dy;
    if (inGrid(x, y)) cand.push({ x, y });
  }
  cand.sort((a, b) => (b.x + b.y) - (a.x + a.y)); // vorderste zuerst
  for (const { x, y } of cand) {
    const c = toScreen(x + 0.5, y + 0.5);
    const local = { x: wx - c.x, y: wy - c.y };
    // Rautenprüfung auf dem Boden
    if (Math.abs(local.x) / HW + Math.abs(local.y) / HH <= 1) return { x, y };
  }
  // Über einem Gebäude: großzügige Box oberhalb der Raute
  for (const { x, y } of cand) {
    const c = toScreen(x + 0.5, y + 0.5);
    if (Math.abs(wx - c.x) <= HW * 0.9 && wy <= c.y + HH && wy >= c.y - 96) return { x, y };
  }
  return null;
}

