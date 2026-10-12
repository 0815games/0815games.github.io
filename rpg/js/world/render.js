// [2026-10-12 19:40] - js/world/render.js: v0.1.1
import { state } from '../core/state.js';

export class Renderer {
  constructor(id) {
    this.cv = document.getElementById(id);
    this.ctx = this.cv.getContext('2d');
    this.tile = 32;
    this.particles = [];
    this.texts = [];
    this.loop();
  }

  text(txt, x, y, c = '#ffd54f') {
    this.texts.push({ txt, x: x * this.tile + 16, y: y * this.tile, c, a: 1 });
  }

  burst(x, y) {
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * 6.28;
      const s = 30 + Math.random() * 80;
      this.particles.push({
        x: x * this.tile + 16,
        y: y * this.tile + 16,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 25,
        a: 1,
        c: i % 2 ? '#ffca28' : '#ff9800'
      });
    }
  }

  loop() {
    let last = performance.now();
    const f = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      this.update(dt);
      this.draw();
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }

  update(dt) {
    this.texts = this.texts.filter(t => (t.y -= 25 * dt, t.a -= dt * 0.9, t.a > 0));
    this.particles = this.particles.filter(p => (p.x += p.vx * dt, p.y += p.vy * dt, p.vy += 80 * dt, p.a -= dt * 1.2, p.a > 0));
  }

  draw() {
    const c = this.ctx;
    const t = this.tile;
    const w = state.world;
    if (!w.tiles || !w.tiles.length) return;

    c.clearRect(0, 0, 640, 480);

    for (let y = 0; y < w.rows; y++) {
      for (let x = 0; x < w.cols; x++) {
        const seen = w.discovered && w.discovered[y] ? w.discovered[y][x] : false;
        if (!seen) {
          c.fillStyle = '#06070a';
          c.fillRect(x * t, y * t, t, t);
          continue;
        }

        const tile = w.tiles[y][x];
        if (tile === 1) {
          c.fillStyle = '#1c202c';
          c.fillRect(x * t, y * t, t, t);
          c.strokeStyle = '#2e364a';
          c.strokeRect(x * t + 1, y * t + 1, t - 2, t - 2);
        } else if (tile === 2) {
          c.fillStyle = '#271b23';
          c.fillRect(x * t, y * t, t, t);
          c.fillStyle = '#392734';
          c.fillRect(x * t + 3, y * t + 3, t - 6, t - 6);
        } else {
          c.fillStyle = (x + y) % 2 ? '#10121a' : '#141722';
          c.fillRect(x * t, y * t, t, t);
          c.strokeStyle = '#ffffff07';
          c.strokeRect(x * t, y * t, t, t);
        }
      }
    }

    if (w.stairs && w.discovered && w.discovered[w.stairs.y] && w.discovered[w.stairs.y][w.stairs.x]) {
      const sx = w.stairs.x * t;
      const sy = w.stairs.y * t;
      c.fillStyle = '#c99c42';
      c.fillRect(sx + 6, sy + 6, 20, 20);
      c.fillStyle = '#0a0c10';
      c.fillRect(sx + 9, sy + 9, 14, 14);
      c.fillStyle = '#ffd54f';
      c.font = '11px serif';
      c.fillText('⬇️', sx + 10, sy + 21);
    }

    if (w.chests) {
      for (const ch of w.chests) {
        if (!w.discovered || !w.discovered[ch.y] || !w.discovered[ch.y][ch.x]) continue;
        const sx = ch.x * t;
        const sy = ch.y * t;
        if (ch.open) {
          c.fillStyle = '#5d4037';
          c.fillRect(sx + 6, sy + 12, 20, 12);
          c.fillStyle = '#8d6e63';
          c.fillRect(sx + 4, sy + 8, 24, 5);
          c.fillStyle = '#ffe082';
          c.fillRect(sx + 10, sy + 13, 12, 3);
        } else {
          c.fillStyle = '#ffb300';
          c.fillRect(sx + 6, sy + 8, 20, 16);
          c.fillStyle = '#212121';
          c.fillRect(sx + 13, sy + 13, 6, 6);
        }
      }
    }

    if (w.monsters) {
      for (const m of w.monsters) {
        if (!w.discovered || !w.discovered[m.y] || !w.discovered[m.y][m.x]) continue;
        const sx = m.x * t;
        const sy = m.y * t;
        c.fillStyle = m.color || '#e53935';
        c.beginPath();
        c.arc(sx + 16, sy + 16, 11, 0, 6.28);
        c.fill();
        c.fillStyle = '#ff1744';
        c.fillRect(sx + 11, sy + 12, 3, 3);
        c.fillRect(sx + 18, sy + 12, 3, 3);
        c.fillStyle = '#440000';
        c.fillRect(sx + 4, sy + 2, 24, 3);
        c.fillStyle = '#f44336';
        c.fillRect(sx + 4, sy + 2, 24 * Math.max(0, m.hp / m.maxHp), 3);
      }
    }

    const px = state.player.x * t;
    const py = state.player.y * t;
    const g = c.createRadialGradient(px + 16, py + 16, 8, px + 16, py + 16, 45);
    g.addColorStop(0, '#ffb30066');
    g.addColorStop(1, '#00000000');
    c.fillStyle = g;
    c.fillRect(px - 35, py - 35, 102, 102);

    c.fillStyle = '#d4a94d';
    c.fillRect(px + 6, py + 6, 20, 20);
    c.fillStyle = '#1c1f2e';
    c.fillRect(px + 9, py + 9, 14, 7);
    c.fillStyle = '#90caf9';
    c.fillRect(px + 12, py + 11, 3, 2);
    c.fillRect(px + 17, py + 11, 3, 2);

    for (const p of this.particles) {
      c.globalAlpha = p.a;
      c.fillStyle = p.c;
      c.fillRect(p.x, p.y, 3, 3);
    }
    for (const tx of this.texts) {
      c.globalAlpha = tx.a;
      c.fillStyle = tx.c;
      c.font = 'bold 12px serif';
      c.fillText(tx.txt, tx.x - 10, tx.y);
    }
    c.globalAlpha = 1;
  }
}
