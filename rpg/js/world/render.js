// [2026-10-12 13:15] - js/world/render.js: v0.0.2 Händler-Rendering & Visuelle Effekte
// Änderungen:
// - Händler-Stand (Cyan/Gelber Stand mit '$'-Symbol) auf der Karte gerendert.
// - Farbcodierung und Beschriftung für freundliche NPCs hinzugefügt.

import { state } from '../core/state.js';
import { TILE_WALL, TILE_RUIN } from './map.js';

export class WorldRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.tileSize = 32;
    this.floatingTexts = [];
  }

  addFloatingText(text, x, y, color = '#ff3333') {
    this.floatingTexts.push({
      text,
      x: x * this.tileSize + 16,
      y: y * this.tileSize,
      alpha: 1.0,
      color
    });
  }

  render() {
    const { ctx, tileSize } = this;
    const { cols, rows, tiles, discovered, chests, monsters } = state.world;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isDiscovered = discovered && discovered[y] ? discovered[y][x] : false;
        const screenX = x * tileSize;
        const screenY = y * tileSize;

        if (!isDiscovered) {
          ctx.fillStyle = '#010301';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          continue;
        }

        const t = tiles[y][x];
        if (t === TILE_WALL) {
          ctx.fillStyle = '#1c261c';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.strokeStyle = '#2d3f2d';
          ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
        } else if (t === TILE_RUIN) {
          ctx.fillStyle = '#261b17';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.fillStyle = '#3d2b24';
          ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
        } else {
          ctx.fillStyle = '#091209';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.fillStyle = '#0f1f0f';
          if ((x + y) % 3 === 0) ctx.fillRect(screenX + 10, screenY + 10, 4, 4);
        }

        ctx.strokeStyle = 'rgba(51, 255, 51, 0.05)';
        ctx.strokeRect(screenX, screenY, tileSize, tileSize);
      }
    }

    // Schatztruhen
    chests.forEach(c => {
      if (discovered[c.y] && discovered[c.y][c.x]) {
        const sx = c.x * tileSize;
        const sy = c.y * tileSize;
        ctx.fillStyle = c.opened ? '#554422' : '#ffd700';
        ctx.fillRect(sx + 6, sy + 8, 20, 16);
        ctx.fillStyle = '#000000';
        ctx.fillRect(sx + 13, sy + 13, 6, 6);
      }
    });

    // Händler Gus
    const tr = state.trader;
    if (discovered[tr.y] && discovered[tr.y][tr.x]) {
      const tx = tr.x * tileSize;
      const ty = tr.y * tileSize;

      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(tx + 4, ty + 6, 24, 20);
      ctx.fillStyle = '#003344';
      ctx.fillRect(tx + 7, ty + 10, 18, 12);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 12px Courier New';
      ctx.fillText('$', tx + 13, ty + 20);

      // Dach / Markise
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(tx + 2, ty + 3, 28, 5);
    }

    // Monster
    monsters.forEach(m => {
      if (discovered[m.y] && discovered[m.y][m.x]) {
        const sx = m.x * tileSize;
        const sy = m.y * tileSize;

        ctx.fillStyle = m.color || '#ff3333';
        ctx.beginPath();
        ctx.arc(sx + 16, sy + 16, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffff00';
        ctx.fillRect(sx + 11, sy + 12, 3, 3);
        ctx.fillRect(sx + 18, sy + 12, 3, 3);

        const barW = 24;
        const hpPct = Math.max(0, m.hp / m.maxHp);
        ctx.fillStyle = '#440000';
        ctx.fillRect(sx + 4, sy + 1, barW, 4);
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(sx + 4, sy + 1, barW * hpPct, 4);
      }
    });

    // Spieler-Avatar
    const px = state.player.x * tileSize;
    const py = state.player.y * tileSize;

    const gradient = ctx.createRadialGradient(px + 16, py + 16, 4, px + 16, py + 16, 32);
    gradient.addColorStop(0, 'rgba(51, 255, 51, 0.35)');
    gradient.addColorStop(1, 'rgba(51, 255, 51, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(px - 16, py - 16, 64, 64);

    ctx.fillStyle = '#33ff33';
    ctx.fillRect(px + 6, py + 6, 20, 20);
    ctx.fillStyle = '#061a06';
    ctx.fillRect(px + 10, py + 10, 12, 6);
    ctx.fillStyle = '#aaffaa';
    ctx.fillRect(px + 12, py + 11, 4, 2);

    // Schwebende Texte
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 12px Courier New';
      ctx.fillText(ft.text, ft.x, ft.y);
      ft.y -= 0.6;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
    ctx.globalAlpha = 1.0;
  }
}
