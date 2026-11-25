// Animierte Insel als Hintergrund des Anmeldebildschirms.
// Dieselbe Zeichnung wie im Spiel (scene.js), nur mit kreisender Kamera,
// schnellem Tag-Nacht-Zyklus und Mausparallaxe. Kein Spielzustand, keine Daten.
import { renderWorld, makeFx, stepFx } from './scene.js?v=20261125-bal5';
import { toScreen, hash } from './iso.js?v=20261125-bal5';

// Gebäude für das Bild: id, Kachel, Stufe. Feste Anordnung, damit die Szene immer gleich aussieht.
const SHOWCASE = [
  ['townHall', 4, 4, 3], ['farm', 2, 6, 2], ['sawmill', 6, 2, 2], ['quarry', 7, 6, 3],
  ['warehouse', 2, 2, 1], ['apiary', 5, 7, 2], ['fishery', 8, 4, 2], ['marketSquare', 3, 3, 4],
  ['saltworks', 8, 8, 1], ['mine', 1, 8, 2], ['pearlHut', 6, 5, 1],
];

function buildModel() {
  const tiles = {};
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const r = hash(x, y, 21);
      const terrain = r < 0.18 ? 'forest' : r < 0.26 ? 'rock' : 'meadow';
      tiles[`${x},${y}`] = { x, y, terrain, building: null };
    }
  }
  for (const [id, x, y, level] of SHOWCASE) tiles[`${x},${y}`].building = { id, level };
  return { state: { tiles }, data: null, unlocked: () => true, reduceMotion: false };
}

/**
 * Startet die Szene auf `canvas`. Liefert { start(), stop(), destroy() }.
 * Die Animation läuft nur, solange start() aktiv ist (Anmeldung sichtbar).
 */
export function createLoginScene(canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const model = buildModel();
  const fx = makeFx();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let W = 0, H = 0, dpr = 1, rafId = 0, running = false, t0 = performance.now(), last = t0;
  const center = toScreen(4.5, 4.5);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    // Kamera kreist um die Insel, Zoom atmet langsam, Maus verschiebt leicht.
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    const orbit = reduce ? 0 : t * 0.05;
    const zoom = Math.min(W / 1100, H / 700) * (1 + Math.sin(t * 0.25) * 0.06);
    const view = {
      x: center.x + Math.cos(orbit) * 260 + mouse.x * 40,
      y: center.y + Math.sin(orbit * 1.3) * 90 + mouse.y * 25,
      zoom,
    };
    // Tag-Nacht: ein voller Zyklus etwa alle 80 Sekunden. Bei reduzierter Bewegung: Mittag.
    const day = reduce ? 1 : 0.5 + 0.5 * Math.sin((t / 80) * Math.PI * 2 - Math.PI / 2);
    if (!reduce) stepFx(fx, dt, model);
    renderWorld(ctx, { W, H, view, model, time: reduce ? 0 : t, day, fx, hover: null });
  }

  function loop(now) {
    if (!running) return;
    draw(now);
    rafId = requestAnimationFrame(loop);
  }

  const onResize = () => { resize(); if (!running) draw(performance.now()); };
  const onMove = (e) => {
    mouse.tx = (e.clientX / Math.max(1, W)) * 2 - 1;
    mouse.ty = (e.clientY / Math.max(1, H)) * 2 - 1;
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onMove);
  resize();

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      if (reduce) draw(last);
      else rafId = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    destroy() {
      this.stop();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
    },
  };
}
