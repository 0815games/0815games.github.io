// [2026-10-12 18:55] - js/world/render.js: v0.0.9 Autonome Animationen, Partikel, Treppen & Fackelschein
// Änderungen:
// - Verlässliches 60fps-Rendering ohne schwarzen Bildschirm.
// - Treppen-Grafik (Stufen in die Tiefe ⬇️).
// - Truhen-Animation: Öffnet sich, erzeugt Goldpartikel und löst sich auf.
// - Klingenblitz & Schockwellen bei Feindkontakt.

import { state } from '../core/state.js';
import { TILE_STONE_WALL, TILE_CRYPT_CHAMBER } from './map.js';

export class WorldRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.tileSize = 32;
    this.floatingTexts = [];
    this.particles = [];
    this.slashes = [];
    this.torchFlicker = 0;
    this.lastTimestamp = performance.now();

    this.startLoop();
  }

  startLoop() {
    const loop = (timestamp) => {
      const deltaTime = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
      this.lastTimestamp = timestamp;

      this.update(deltaTime);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  addFloatingText(text, x, y, color = '#ff5252') {
    this.floatingTexts.push({
      text,
      x: x * this.tileSize + 16,
      y: y * this.tileSize,
      alpha: 1.0,
      color,
      speed: 28
    });
  }

  triggerChestBurst(tileX, tileY) {
    const originX = tileX * this.tileSize + 16;
    const originY = tileY * this.tileSize + 16;

    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 95;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 25,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.35 ? '#ffd700' : '#ff9800',
        alpha: 1.0,
        decay: 1.2 + Math.random() * 0.8
      });
    }

    this.addFloatingText('✨ REICHTUM!', tileX, tileY - 0.5, '#ffe082');
  }

  triggerEncounterSlash(tileX, tileY) {
    const originX = tileX * this.tileSize + 16;
    const originY = tileY * this.tileSize + 16;

    this.slashes.push({
      x: originX,
      y: originY,
      radius: 4,
      maxRadius: 36,
      alpha: 1.0
    });

    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
      wrapper.classList.remove('shake-canvas');
      void wrapper.offsetWidth;
      wrapper.classList.add('shake-canvas');
    }
  }

  update(deltaTime) {
    // 1. Schwebende Zahlen
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= ft.speed * deltaTime;
      ft.alpha -= 0.85 * deltaTime;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // 2. Partikel
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 85 * deltaTime;
      p.alpha -= p.decay * deltaTime;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Klingenblitze
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.radius += (s.maxRadius - s.radius) * 12 * deltaTime;
      s.alpha -= 2.5 * deltaTime;
      if (s.alpha <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // 4. Fackelschein
    this.torchFlicker = Math.sin(Date.now() / 180) * 2.5;
  }

  render() {
    const { ctx, tileSize } = this;
    const { cols, rows, tiles, discovered, chests, monsters, stairs } = state.world;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isDiscovered = discovered && discovered[y] ? discovered[y][x] : false;
        const screenX = x * tileSize;
        const screenY = y * tileSize;

        if (!isDiscovered) {
          ctx.fillStyle = '#06070a';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          continue;
        }

        const t = tiles[y] ? tiles[y][x] : 0;
        if (t === TILE_STONE_WALL) {
          ctx.fillStyle = '#1c202c';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.strokeStyle = '#2d3345';
          ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
        } else if (t === TILE_CRYPT_CHAMBER) {
          ctx.fillStyle = '#261a20';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.fillStyle = '#3a2732';
          ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
        } else {
          ctx.fillStyle = '#10121a';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          if ((x + y) % 2 === 0) {
            ctx.fillStyle = '#141722';
            ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
          }
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.strokeRect(screenX, screenY, tileSize, tileSize);
      }
    }

    // Steintreppe nach unten (Verliesabgang)
    if (stairs && discovered && discovered[stairs.y] && discovered[stairs.y][stairs.x]) {
      const sx = stairs.x * tileSize;
      const sy = stairs.y * tileSize;

      ctx.fillStyle = '#c99c42';
      ctx.fillRect(sx + 5, sy + 5, 22, 22);
      ctx.fillStyle = '#0a0c10';
      ctx.fillRect(sx + 8, sy + 8, 16, 16);

      // Stufen
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(sx + 10, sy + 11, 12, 3);
      ctx.fillRect(sx + 12, sy + 16, 8, 3);
      ctx.fillRect(sx + 14, sy + 21, 4, 2);
    }

    // Schatztruhen
    if (chests) {
      chests.forEach(c => {
        if (discovered && discovered[c.y] && discovered[c.y][c.x]) {
          const sx = c.x * tileSize;
          const sy = c.y * tileSize;

          if (c.opened) {
            // Geöffnete Truhe
            ctx.fillStyle = '#4e342e';
            ctx.fillRect(sx + 5, sy + 10, 22, 14);
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(sx + 3, sy + 6, 26, 6);
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(sx + 10, sy + 12, 12, 4);
          } else {
            // Glänzende geschlossene Truhe
            ctx.fillStyle = '#ffb300';
            ctx.fillRect(sx + 5, sy + 7, 22, 17);
            ctx.fillStyle = '#212121';
            ctx.fillRect(sx + 13, sy + 13, 6, 6);
            ctx.fillStyle = '#fff8e1';
            ctx.fillRect(sx + 7, sy + 9, 4, 2);
          }
        }
      });
    }

    // Alchemist Eldrin
    const tr = state.trader;
    if (tr && discovered && discovered[tr.y] && discovered[tr.y][tr.x]) {
      const tx = tr.x * tileSize;
      const ty = tr.y * tileSize;

      ctx.fillStyle = '#1565c0';
      ctx.fillRect(tx + 4, ty + 6, 24, 20);
      ctx.fillStyle = '#0d47a1';
      ctx.fillRect(tx + 7, ty + 10, 18, 12);
      ctx.fillStyle = '#64b5f6';
      ctx.font = 'bold 12px serif';
      ctx.fillText('🔮', tx + 8, ty + 20);

      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(tx + 2, ty + 3, 28, 4);
    }

    // Monster
    if (monsters) {
      monsters.forEach(m => {
        if (discovered && discovered[m.y] && discovered[m.y][m.x]) {
          const sx = m.x * tileSize;
          const sy = m.y * tileSize;

          ctx.fillStyle = m.color || '#e53935';
          ctx.beginPath();
          ctx.arc(sx + 16, sy + 16, 11, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff1744';
          ctx.fillRect(sx + 11, sy + 12, 3, 3);
          ctx.fillRect(sx + 18, sy + 12, 3, 3);

          const barW = 24;
          const hpPct = Math.max(0, m.hp / m.maxHp);
          ctx.fillStyle = '#370000';
          ctx.fillRect(sx + 4, sy + 1, barW, 4);
          ctx.fillStyle = '#d32f2f';
          ctx.fillRect(sx + 4, sy + 1, barW * hpPct, 4);
        }
      });
    }

    // Held
    const px = (Number.isFinite(state.player.x) ? state.player.x : 2) * tileSize;
    const py = (Number.isFinite(state.player.y) ? state.player.y : 2) * tileSize;

    const torchRadius = 38 + this.torchFlicker;
    const gradient = ctx.createRadialGradient(px + 16, py + 16, 6, px + 16, py + 16, Math.max(12, torchRadius));
    gradient.addColorStop(0, 'rgba(255, 179, 0, 0.45)');
    gradient.addColorStop(0.7, 'rgba(255, 87, 34, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(px - 32, py - 32, 96, 96);

    ctx.fillStyle = '#c99c42';
    ctx.fillRect(px + 6, py + 6, 20, 20);
    ctx.fillStyle = '#1c1f2e';
    ctx.fillRect(px + 9, py + 9, 14, 8);
    ctx.fillStyle = '#90caf9';
    ctx.fillRect(px + 12, py + 11, 3, 2);
    ctx.fillRect(px + 17, py + 11, 3, 2);

    // Partikel
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // Klingenblitze
    this.slashes.forEach(s => {
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s.x - s.radius, s.y - s.radius);
      ctx.lineTo(s.x + s.radius, s.y + s.radius);
      ctx.moveTo(s.x + s.radius, s.y - s.radius);
      ctx.lineTo(s.x - s.radius, s.y + s.radius);
      ctx.stroke();
    });

    // Schwebende Texte
    this.floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 12px serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.textAlign = 'start';
    ctx.globalAlpha = 1.0;
  }
}
