// Zeichnung der Weltansicht: Gelände, Wasser, Bäume, Gebäude und Animationen.
// Reine Canvas-2D-Funktionen ohne DOM-Zugriff. Jede Funktion bekommt den Kontext,
// den Mittelpunkt einer Kachel auf dem Bildschirm und die Zeit in Sekunden.
import { HW, HH, toScreen, hash } from './iso.js?v=20261124-sitz5';

// ---------- Farbe ----------

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Hellt (f > 1) oder dunkelt (f < 1) eine Hex-Farbe ab. */
export function shade(h, f) {
  const [r, g, b] = hex(h).map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return `rgb(${r},${g},${b})`;
}
/** Mischt zwei Hex-Farben (t = 0 → a, t = 1 → b). */
export function mix(a, b, t) {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

// ---------- Primitive ----------

export function fillPoly(ctx, pts, fill) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** Punkt relativ zur Kachelmitte: u, v in Kachelbreiten (−0.5 … 0.5), z in Pixeln nach oben. */
export function P(c, u, v, z = 0) {
  return { x: c.x + (u - v) * HW, y: c.y + (u + v) * HH - z };
}

/** Quader mit sichtbarer Oberseite, rechter und linker Wand. */
export function box(ctx, c, u0, u1, v0, v1, z0, z1, top, left, right) {
  fillPoly(ctx, [P(c, u1, v0, z0), P(c, u1, v1, z0), P(c, u1, v1, z1), P(c, u1, v0, z1)], right);
  fillPoly(ctx, [P(c, u0, v1, z0), P(c, u1, v1, z0), P(c, u1, v1, z1), P(c, u0, v1, z1)], left);
  fillPoly(ctx, [P(c, u0, v0, z1), P(c, u1, v0, z1), P(c, u1, v1, z1), P(c, u0, v1, z1)], top);
}

/** Walmdach über einem Quader: zwei sichtbare Dachflächen. */
export function hipRoof(ctx, c, u0, u1, v0, v1, z0, rh, colRight, colLeft) {
  const A = P(c, (u0 + u1) / 2, (v0 + v1) / 2, z0 + rh);
  fillPoly(ctx, [A, P(c, u1, v0, z0), P(c, u1, v1, z0)], colRight);
  fillPoly(ctx, [A, P(c, u0, v1, z0), P(c, u1, v1, z0)], colLeft);
}

/** Fenster: Glas am Tag, warmes Licht in der Nacht (night 0..1). */
function pane(ctx, pts, night) {
  fillPoly(ctx, pts, '#5d7f99');
  if (night > 0.02) {
    ctx.globalAlpha = night;
    fillPoly(ctx, pts, '#ffd66b');
    ctx.globalAlpha = 1;
  }
}

function winRight(ctx, c, u, va, vb, za, zb, night) {
  pane(ctx, [P(c, u, va, za), P(c, u, vb, za), P(c, u, vb, zb), P(c, u, va, zb)], night);
}
function winLeft(ctx, c, v, ua, ub, za, zb, night) {
  pane(ctx, [P(c, ua, v, za), P(c, ub, v, za), P(c, ub, v, zb), P(c, ua, v, zb)], night);
}

// ---------- Gelände ----------

export const TERRAIN_COLOR = {
  meadow: '#8fcc63',
  forest: '#5e9e4b',
  rock: '#a2a8a4',
  sand: '#ecd8a4',
  water: '#2f8fcf',
};

function tuft(ctx, c, t, h) {
  const u = (hash(h, 1, 7) - 0.5) * 0.7;
  const v = (hash(h, 2, 7) - 0.5) * 0.7;
  const p = P(c, u, v, 0);
  ctx.strokeStyle = shade('#8fcc63', 0.72);
  ctx.lineWidth = 1.2;
  for (let i = -1; i <= 1; i++) {
    const sway = Math.sin(t * 1.4 + h + i) * 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x + i * 2.5, p.y);
    ctx.quadraticCurveTo(p.x + i * 2.5 + sway, p.y - 3, p.x + i * 3 + sway * 1.5, p.y - 6);
    ctx.stroke();
  }
}

function flowers(ctx, c, x, y) {
  const colors = ['#ffe066', '#ff8fab', '#ffffff', '#c6a6ff'];
  for (let i = 0; i < 3; i++) {
    const u = (hash(x, y, 20 + i) - 0.5) * 0.8;
    const v = (hash(x, y, 30 + i) - 0.5) * 0.8;
    const p = P(c, u, v, 0);
    ctx.fillStyle = colors[Math.floor(hash(x, y, 40 + i) * colors.length)];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Baum mit leicht schwankender Krone. base = Fußpunkt, s = Größe. */
export function tree(ctx, base, s, t, phase, dark = false) {
  const sway = Math.sin(t * 1.3 + phase) * 1.6 * s;
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(base.x - 1.6 * s, base.y - 8 * s, 3.2 * s, 9 * s);
  const top = dark ? '#3f7a3a' : '#5fae4f';
  const mid = dark ? '#2e6130' : '#4a9a40';
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.ellipse(base.x + sway * 0.6, base.y - 15 * s, 9 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(base.x + sway, base.y - 22 * s, 7.5 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function boulder(ctx, base, s, colorBase) {
  ctx.fillStyle = shade(colorBase, 0.7);
  ctx.beginPath();
  ctx.ellipse(base.x, base.y - 4 * s, 9 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = shade(colorBase, 1.08);
  ctx.beginPath();
  ctx.ellipse(base.x - 1.5 * s, base.y - 6 * s, 5 * s, 3.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Wasser mit wandernden Wellen und Glitzern. */
function waves(ctx, c, x, y, t, day) {
  ctx.strokeStyle = `rgba(255,255,255,${0.18 + 0.12 * day})`;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 2; i++) {
    const u = (hash(x, y, 50 + i) - 0.5) * 0.5;
    const v = (hash(x, y, 60 + i) - 0.5) * 0.5;
    const off = (t * 0.25 + hash(x, y, 70 + i)) % 1;
    const a = P(c, u - 0.18, v, 0);
    const b = P(c, u + 0.18, v, 0);
    ctx.beginPath();
    ctx.moveTo(a.x + off * 6, a.y + Math.sin(off * 6) * 0.5);
    ctx.quadraticCurveTo((a.x + b.x) / 2, a.y - 3 + Math.sin(t + i) * 1.5, b.x - off * 6, b.y);
    ctx.stroke();
  }
  const sp = (Math.sin(t * 2.6 + hash(x, y, 80) * 12) + 1) / 2;
  if (sp > 0.82) {
    const p = P(c, (hash(x, y, 81) - 0.5) * 0.7, (hash(x, y, 82) - 0.5) * 0.7, 0);
    ctx.fillStyle = `rgba(255,255,255,${(sp - 0.82) * 4})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Eine Bodenkachel mit Details. env: { day (0..1), sideS, sideE (Wasser oder Meer daneben), locked }.
 */
export function drawTile(ctx, x, y, terrain, t, env) {
  const c = toScreen(x + 0.5, y + 0.5);
  const base = TERRAIN_COLOR[terrain] ?? TERRAIN_COLOR.meadow;
  const jitter = (hash(x, y, 3) - 0.5) * 0.08;
  const top = shade(base, 1 + jitter);

  // Steilküste: nur dort, wo daneben Wasser liegt.
  if (terrain !== 'water') {
    const depth = 14;
    if (env.sideS) fillPoly(ctx, [P(c, -0.5, 0.5, 0), P(c, 0.5, 0.5, 0), P(c, 0.5, 0.5, -depth), P(c, -0.5, 0.5, -depth)], '#7d5d3b');
    if (env.sideE) fillPoly(ctx, [P(c, 0.5, -0.5, 0), P(c, 0.5, 0.5, 0), P(c, 0.5, 0.5, -depth), P(c, 0.5, -0.5, -depth)], '#5f4327');
  }

  fillPoly(ctx, [P(c, -0.5, -0.5), P(c, 0.5, -0.5), P(c, 0.5, 0.5), P(c, -0.5, 0.5)], top);

  if (terrain === 'water') {
    waves(ctx, c, x, y, t, env.day);
    return;
  }
  if (terrain === 'sand') {
    ctx.strokeStyle = 'rgba(180,140,80,0.25)';
    ctx.lineWidth = 1;
    const p = P(c, (hash(x, y, 90) - 0.5) * 0.4, (hash(x, y, 91) - 0.5) * 0.4, 0);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 8, 3, 0, 0, Math.PI);
    ctx.stroke();
  } else if (terrain === 'rock') {
    boulder(ctx, P(c, -0.15, 0.1), 1.1, base);
    if (hash(x, y, 92) > 0.5) boulder(ctx, P(c, 0.22, -0.18), 0.7, base);
  } else if (terrain === 'forest') {
    tree(ctx, P(c, -0.18, 0.12), 1, t, hash(x, y, 93) * 6);
    if (hash(x, y, 94) > 0.45) tree(ctx, P(c, 0.2, -0.16), 0.8, t, hash(x, y, 95) * 6, true);
  } else {
    for (let i = 0; i < 3; i++) if (hash(x, y, 100 + i) > 0.35) tuft(ctx, c, t, hash(x, y, 110 + i) * 10);
    if (hash(x, y, 120) > 0.72) flowers(ctx, c, x, y);
  }

  if (env.locked) {
    fillPoly(ctx, [P(c, -0.5, -0.5), P(c, 0.5, -0.5), P(c, 0.5, 0.5), P(c, -0.5, 0.5)], 'rgba(226,234,242,0.62)');
  }
}

// ---------- Gebäude ----------

/** Lichtschein über einem Gebäude in der Dämmerung. */
function glow(ctx, c, night, r) {
  if (night < 0.05) return;
  const g = ctx.createRadialGradient(c.x, c.y - 20, 2, c.x, c.y - 20, r);
  g.addColorStop(0, `rgba(255,214,120,${0.35 * night})`);
  g.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c.x, c.y - 20, r, 0, Math.PI * 2);
  ctx.fill();
}

function townHall(ctx, c, t, env) {
  box(ctx, c, -0.32, 0.32, -0.28, 0.28, 0, 34, '#fbeed0', '#e6cf9f', '#f3e2b9');
  hipRoof(ctx, c, -0.32, 0.32, -0.28, 0.28, 34, 16, '#b8452f', '#8f3322');
  for (const va of [-0.2, 0.0]) {
    winRight(ctx, c, 0.32, va, va + 0.12, 9, 20, env.night);
    winRight(ctx, c, 0.32, va, va + 0.12, 22, 30, env.night);
  }
  winLeft(ctx, c, 0.28, -0.22, -0.08, 9, 20, env.night);
  winLeft(ctx, c, 0.28, -0.22, -0.08, 22, 30, env.night);
  // Eingang
  fillPoly(ctx, [P(c, 0.32, -0.06, 0), P(c, 0.32, 0.06, 0), P(c, 0.32, 0.06, 13), P(c, 0.32, -0.06, 13)], '#6b4a2b');
  // Uhrturm
  box(ctx, c, -0.2, -0.04, -0.24, -0.08, 34, 74, '#fff6e0', '#e3cfa1', '#f1e1bb');
  hipRoof(ctx, c, -0.2, -0.04, -0.24, -0.08, 74, 18, '#2f6fb0', '#215a92');
  const clock = P(c, -0.04, -0.16, 56);
  ctx.fillStyle = '#fffdf6';
  ctx.beginPath();
  ctx.ellipse(clock.x - 0.5, clock.y, 6, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3a3026';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(clock.x - 0.5, clock.y);
  ctx.lineTo(clock.x - 0.5 + Math.cos(t * 0.2) * 4, clock.y + Math.sin(t * 0.2) * 4);
  ctx.moveTo(clock.x - 0.5, clock.y);
  ctx.lineTo(clock.x - 0.5 + Math.cos(t * 0.02) * 3, clock.y - Math.sin(t * 0.02) * 3);
  ctx.stroke();
  // Fahne
  const pole = P(c, -0.12, -0.16, 74);
  ctx.strokeStyle = '#4a4036';
  ctx.beginPath();
  ctx.moveTo(pole.x, pole.y);
  ctx.lineTo(pole.x, pole.y - 26);
  ctx.stroke();
  ctx.fillStyle = '#e0503c';
  ctx.beginPath();
  ctx.moveTo(pole.x, pole.y - 26);
  for (let i = 1; i <= 6; i++) {
    ctx.lineTo(pole.x + i * 2.6, pole.y - 26 + Math.sin(t * 4 + i * 0.9) * 1.3 * (i / 6));
  }
  for (let i = 6; i >= 0; i--) {
    ctx.lineTo(pole.x + i * 2.6, pole.y - 19 + Math.sin(t * 4 + i * 0.9 + 0.6) * 1.1 * (i / 6));
  }
  ctx.closePath();
  ctx.fill();
}

function farm(ctx, c, t, env) {
  // Scheune
  box(ctx, c, -0.34, 0.06, -0.06, 0.3, 0, 30, '#d9694f', '#a9462f', '#c8553d');
  hipRoof(ctx, c, -0.34, 0.06, -0.06, 0.3, 30, 16, '#7a3b2b', '#5e2d20');
  winRight(ctx, c, 0.06, 0.06, 0.16, 10, 20, env.night);
  // Windmühle
  box(ctx, c, 0.2, 0.3, -0.3, -0.2, 0, 62, '#f2e6cc', '#d8c8a4', '#ebdcb8');
  hipRoof(ctx, c, 0.2, 0.3, -0.3, -0.2, 62, 10, '#8f3322', '#6d2719');
  const hub = P(c, 0.25, -0.25, 64);
  const angle = t * 1.4;
  ctx.strokeStyle = '#fff8e8';
  ctx.lineWidth = 4;
  for (let k = 0; k < 4; k++) {
    const a = angle + (k * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(hub.x, hub.y);
    ctx.lineTo(hub.x + Math.cos(a) * 24, hub.y + Math.sin(a) * 24);
    ctx.stroke();
  }
  ctx.fillStyle = '#6d5a44';
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, 3, 0, Math.PI * 2);
  ctx.fill();
  // Weizenfeld mit wehenden Halmen
  for (let i = 0; i < 7; i++) {
    const u = -0.36 + i * 0.1;
    const a = P(c, u, 0.38, 0);
    ctx.strokeStyle = i % 2 ? '#e8c35a' : '#d9ae45';
    ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) {
      const sway = Math.sin(t * 2 + i * 0.7 + k) * 2.2;
      ctx.beginPath();
      ctx.moveTo(a.x + k * 3, a.y);
      ctx.quadraticCurveTo(a.x + k * 3 + sway * 0.5, a.y - 6, a.x + k * 3 + sway, a.y - 12);
      ctx.stroke();
    }
  }
}

function sawmill(ctx, c, t, env) {
  box(ctx, c, -0.32, 0.12, -0.2, 0.22, 0, 26, '#b07c48', '#7d522c', '#9c6a3c');
  hipRoof(ctx, c, -0.32, 0.12, -0.2, 0.22, 26, 14, '#5a3a20', '#46301a');
  winLeft(ctx, c, 0.22, -0.24, -0.08, 8, 18, env.night);
  // Schornstein
  box(ctx, c, -0.24, -0.16, 0.08, 0.16, 26, 46, '#6b4a32', '#55392a', '#7a5538');
  // Stapel Baumstämme
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 3 - row; k++) {
      const p = P(c, 0.22 + k * 0.1 - row * 0.05, 0.08 + row * 0.02, 5 + row * 9);
      ctx.fillStyle = '#e0a66a';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a06a35';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 3.5, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Sägeblatt, dreht sich
  const saw = P(c, 0.12, -0.02, 14);
  ctx.strokeStyle = '#c8ccd0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(saw.x, saw.y, 8, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 6; k++) {
    const a = t * 5 + (k * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(saw.x + Math.cos(a) * 8, saw.y + Math.sin(a) * 8);
    ctx.lineTo(saw.x + Math.cos(a) * 10.5, saw.y + Math.sin(a) * 10.5);
    ctx.stroke();
  }
}

function quarry(ctx, c, t, env) {
  // Steinbruch
  ctx.fillStyle = '#6f6a62';
  ctx.beginPath();
  ctx.ellipse(c.x + 2, c.y + 4, 34, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#58534c';
  ctx.beginPath();
  ctx.ellipse(c.x + 2, c.y + 5, 22, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Steinblöcke
  box(ctx, c, 0.04, 0.22, -0.02, 0.2, 0, 12, '#d6d0c4', '#aaa398', '#bfb9ad');
  box(ctx, c, 0.14, 0.3, -0.26, -0.1, 0, 9, '#cfc8bb', '#a39d91', '#b7b1a4');
  // Kran, schwingt
  box(ctx, c, -0.2, -0.16, -0.06, -0.02, 0, 58, '#e0a526', '#b3801c', '#c8921f');
  const top = P(c, -0.18, -0.04, 58);
  const swing = Math.sin(t * 0.8) * 0.5;
  const tip = { x: top.x + Math.cos(swing - 0.3) * 40, y: top.y + Math.sin(swing - 0.3) * 40 + 16 };
  ctx.strokeStyle = '#e0a526';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.strokeStyle = '#4a4036';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x, tip.y + 10 + Math.sin(t * 1.6) * 2);
  ctx.stroke();
  ctx.fillStyle = '#9ca3a8';
  ctx.fillRect(tip.x - 4, tip.y + 10 + Math.sin(t * 1.6) * 2, 8, 6);
  void env;
}

function warehouse(ctx, c, t, env) {
  box(ctx, c, -0.34, 0.34, -0.3, 0.3, 0, 40, '#7b9cc0', '#4b6a8c', '#6f93b8');
  box(ctx, c, -0.36, 0.36, -0.32, 0.32, 40, 45, '#4b6a8c', '#3a5672', '#46637f');
  // Rolltor an der linken Wand
  fillPoly(ctx, [P(c, -0.34, 0.3, 0), P(c, -0.06, 0.3, 0), P(c, -0.06, 0.3, 24), P(c, -0.34, 0.3, 24)], '#2f3e52');
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let z = 4; z < 24; z += 4) {
    const a = P(c, -0.34, 0.3, z);
    const b = P(c, -0.06, 0.3, z);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  winRight(ctx, c, 0.34, -0.2, -0.1, 26, 34, env.night);
  // Kisten davor
  box(ctx, c, 0.38, 0.5, -0.12, 0.02, 0, 10, '#e0b878', '#b8905a', '#caa26c');
  box(ctx, c, 0.4, 0.5, -0.1, 0.0, 10, 19, '#d8ad6e', '#ad8651', '#c39861');
  void t;
}

function apiary(ctx, c, t, env) {
  for (let k = 0; k < 3; k++) {
    const z0 = k * 9;
    box(ctx, c, -0.14, 0.12, -0.12, 0.1, z0, z0 + 8, k % 2 ? '#f5c752' : '#f0b93b', '#c98f24', '#e4a52f');
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    const a = P(c, -0.14, 0.1, z0 + 4), b = P(c, 0.12, 0.1, z0 + 4);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  hipRoof(ctx, c, -0.16, 0.14, -0.14, 0.12, 27, 8, '#8a5a2b', '#6e4520');
  // Bienen kreisen
  for (let i = 0; i < 4; i++) {
    const a = t * 2.4 + i * 1.6;
    const r = 18 + i * 3;
    const p = { x: c.x + Math.cos(a) * r, y: c.y - 24 + Math.sin(a) * r * 0.45 };
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 2.6, 2, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - 2, 2, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  void env;
}

function fishery(ctx, c, t, env) {
  // Steg ins Wasser
  box(ctx, c, 0.08, 0.44, 0.1, 0.48, 0, 5, '#b98b56', '#8e6a40', '#a77c4a');
  // Hütte
  box(ctx, c, -0.32, 0.0, -0.32, 0.0, 0, 26, '#4fa3b8', '#3d8496', '#62b4c8');
  hipRoof(ctx, c, -0.32, 0.0, -0.32, 0.0, 26, 14, '#c2543e', '#9e4330');
  winRight(ctx, c, 0.0, -0.2, -0.1, 9, 18, env.night);
  // Boot, schaukelt
  const bob = Math.sin(t * 1.7) * 2;
  const bx = c.x + 40, by = c.y + 14 + bob;
  ctx.fillStyle = '#c6402f';
  ctx.beginPath();
  ctx.moveTo(bx - 15, by - 4);
  ctx.lineTo(bx + 15, by - 4);
  ctx.quadraticCurveTo(bx + 12, by + 5, bx + 2, by + 5);
  ctx.lineTo(bx - 9, by + 5);
  ctx.quadraticCurveTo(bx - 13, by + 1, bx - 15, by - 4);
  ctx.fill();
  ctx.fillStyle = '#fff7ea';
  ctx.fillRect(bx - 12, by - 6, 24, 2);
  ctx.strokeStyle = '#7a5b33';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(bx + 4, by - 6);
  ctx.lineTo(bx + 4, by - 20 + Math.sin(t) * 1.2);
  ctx.stroke();
}

function marketSquare(ctx, c, t, env) {
  // Tisch und Pfosten
  box(ctx, c, -0.2, 0.2, -0.12, 0.12, 0, 9, '#c98b4f', '#8e5f32', '#a86f3c');
  for (const [u, v] of [[-0.22, -0.14], [0.2, -0.14], [-0.22, 0.12], [0.2, 0.12]]) {
    const b = P(c, u, v, 0);
    ctx.strokeStyle = '#6b4a2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x, b.y - 40);
    ctx.stroke();
  }
  // Markise mit wellig wehenden Streifen
  const n = 6;
  for (let i = 0; i < n; i++) {
    const u0 = -0.26 + (i * 0.52) / n;
    const u1 = u0 + 0.52 / n;
    const w0 = Math.sin(t * 2 + i) * 1.2;
    const w1 = Math.sin(t * 2 + i + 1) * 1.2;
    fillPoly(ctx, [P(c, u0, -0.22, 42), P(c, u1, -0.22, 42), P(c, u1, 0.16, 34 + w1), P(c, u0, 0.16, 34 + w0)],
      i % 2 ? '#fff7ea' : '#d7463a');
  }
  // Münzkorb auf dem Tisch
  const cp = P(c, 0, 0, 10);
  ctx.fillStyle = '#ffd23a';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(cp.x - 6 + k * 6, cp.y - 2 - k * 0.5, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  void env;
}

function saltworks(ctx, c, t, env) {
  // Verdunstungsbecken, glänzen
  for (let k = 0; k < 3; k++) {
    const u = -0.34 + k * 0.2;
    const shimmer = 0.5 + 0.5 * Math.sin(t * 1.5 + k);
    fillPoly(ctx, [P(c, u, -0.3, 1), P(c, u + 0.16, -0.3, 1), P(c, u + 0.16, 0.12, 1), P(c, u, 0.12, 1)], '#c7b193');
    fillPoly(ctx, [P(c, u + 0.02, -0.28, 2), P(c, u + 0.14, -0.28, 2), P(c, u + 0.14, 0.1, 2), P(c, u + 0.02, 0.1, 2)],
      mix('#e3ecf0', '#ffffff', shimmer));
  }
  // Salzhaufen
  for (const [u, v] of [[-0.2, 0.22], [0.02, 0.24]]) {
    const p = P(c, u, v, 4);
    ctx.fillStyle = '#fbfbf7';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Hütte
  box(ctx, c, 0.12, 0.34, -0.32, -0.08, 0, 24, '#e0c9a0', '#b89f76', '#cfb68a');
  hipRoof(ctx, c, 0.12, 0.34, -0.32, -0.08, 24, 12, '#9e5a3a', '#7a432a');
  winRight(ctx, c, 0.34, -0.26, -0.16, 8, 16, env.night);
}

function mine(ctx, c, t, env) {
  // Felsbuckel
  ctx.fillStyle = '#7f776d';
  ctx.beginPath();
  ctx.ellipse(c.x - 2, c.y - 12, 36, 22, 0, Math.PI, 0);
  ctx.lineTo(c.x + 34, c.y + 6);
  ctx.lineTo(c.x - 38, c.y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#948a7e';
  ctx.beginPath();
  ctx.ellipse(c.x - 8, c.y - 24, 16, 9, 0, Math.PI, 0);
  ctx.fill();
  // Stolleneingang
  ctx.fillStyle = '#25201c';
  ctx.beginPath();
  ctx.moveTo(c.x - 12, c.y + 6);
  ctx.lineTo(c.x - 12, c.y - 8);
  ctx.quadraticCurveTo(c.x - 2, c.y - 20, c.x + 8, c.y - 8);
  ctx.lineTo(c.x + 8, c.y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#8a6a44';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(c.x - 13, c.y + 6);
  ctx.lineTo(c.x - 13, c.y - 8);
  ctx.quadraticCurveTo(c.x - 2, c.y - 21, c.x + 9, c.y - 8);
  ctx.lineTo(c.x + 9, c.y + 6);
  ctx.stroke();
  // Schienen und Lore, die hin und her fährt
  ctx.strokeStyle = '#5a4a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c.x + 4, c.y + 10);
  ctx.lineTo(c.x + 36, c.y + 22);
  ctx.moveTo(c.x + 2, c.y + 14);
  ctx.lineTo(c.x + 34, c.y + 26);
  ctx.stroke();
  const f = (Math.sin(t * 0.7) + 1) / 2;
  const lx = c.x + 8 + f * 22, ly = c.y + 12 + f * 11;
  ctx.fillStyle = '#7d8a96';
  ctx.fillRect(lx - 6, ly - 6, 12, 7);
  ctx.fillStyle = '#4b5661';
  ctx.fillRect(lx - 6, ly - 6, 12, 2);
  void env;
}

function pearlHut(ctx, c, t, env) {
  box(ctx, c, -0.28, 0.02, -0.26, 0.04, 0, 22, '#eedcb8', '#c9b28a', '#dcc7a0');
  hipRoof(ctx, c, -0.28, 0.02, -0.26, 0.04, 22, 16, '#c9a15a', '#a2803f');
  for (let k = 0; k < 4; k++) {
    const s = P(c, -0.26 + k * 0.08, -0.26, 22 + 8 * (1 - k / 4));
    ctx.strokeStyle = 'rgba(120,80,30,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + 6, s.y + 12);
    ctx.stroke();
  }
  winRight(ctx, c, 0.02, -0.18, -0.08, 8, 15, env.night);
  // Muschel mit leuchtender Perle
  const shell = P(c, 0.26, 0.22, 2);
  ctx.fillStyle = '#f7c9d4';
  ctx.beginPath();
  ctx.ellipse(shell.x, shell.y, 9, 5, 0, Math.PI, 0);
  ctx.fill();
  const pulse = 0.8 + 0.2 * Math.sin(t * 2.2);
  const pearl = P(c, 0.26, 0.22, 10);
  const g = ctx.createRadialGradient(pearl.x, pearl.y, 0, pearl.x, pearl.y, 16 * pulse);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.4, 'rgba(255,190,230,0.5)');
  g.addColorStop(1, 'rgba(255,190,230,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(pearl.x, pearl.y, 16 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(pearl.x, pearl.y, 3.2, 0, Math.PI * 2);
  ctx.fill();
}

const DRAW = {
  townHall, farm, sawmill, quarry, warehouse, apiary, fishery, marketSquare, saltworks, mine, pearlHut,
};

/** Gebäude auf seiner Kachel, mit Stufe (wächst leicht) und Nachtlicht. env: { night, day }. */
export function drawBuilding(ctx, id, x, y, level, t, env) {
  const draw = DRAW[id];
  if (!draw) return;
  const c = toScreen(x + 0.5, y + 0.5);
  const s = 1 + Math.min(Math.max(level - 1, 0), 25) * 0.012;
  ctx.save();
  if (s !== 1) {
    ctx.translate(c.x, c.y);
    ctx.scale(s, s);
    ctx.translate(-c.x, -c.y);
  }
  glow(ctx, c, env.night, 70);
  draw(ctx, c, t, env);
  ctx.restore();
  // Stufenpunkte am vorderen Kachelrand
  if (id !== 'townHall') {
    const n = Math.min(level, 10);
    ctx.fillStyle = '#ffd23a';
    ctx.strokeStyle = 'rgba(60,40,10,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const p = P(toScreen(x + 0.5, y + 0.5), -0.36 + i * 0.08, 0.38, 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export const BUILDING_IDS = Object.keys(DRAW);
