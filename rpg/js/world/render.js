// [2026-10-12 13:25] - js/world/render.js: v0.0.4 Dark Fantasy Katakomben-Renderer
// Änderungen:
// - Dynamischer Fackelschein: Warmes, flackerndes Licht um den Spieler statt simpler Kreis.
// - Dunkle Steinpflaster-Texturen und verzierte Gruftmauern.
// - Fantasy-Sprites für Held (Ritter-Silhouette), Goblins (grün), Skelette (weiß/silber) und den Alchemisten (blaue Fackel/Runenstand).

import { state } from '../core/state.js';
import { TILE_STONE_WALL, TILE_CRYPT_CHAMBER } from './map.js';

export class WorldRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.tileSize = 32;
    this.floatingTexts = [];
    this.torchFlicker = 0;
  }

  addFloatingText(text, x, y, color = '#ff5252') {
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

    this.torchFlicker = (Math.sin(Date.now() / 200) * 2);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isDiscovered = discovered && discovered[y] ? discovered[y][x] : false;
        const screenX = x * tileSize;
        const screenY = y * tileSize;

        if (!isDiscovered) {
          ctx.fillStyle = '#050609';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          continue;
        }

        const t = tiles[y][x];
        if (t === TILE_STONE_WALL) {
          // Zyklopen-Mauerwerk
          ctx.fillStyle = '#1c202c';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.strokeStyle = '#2d3345';
          ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
        } else if (t === TILE_CRYPT_CHAMBER) {
          // Antike Grabmauer
          ctx.fillStyle = '#261a20';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          ctx.fillStyle = '#3a2732';
          ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
        } else {
          // Schieferboden
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

    // Schatztruhen (Holz mit Eisenbeschlag / Gold)
    chests.forEach(c => {
      if (discovered[c.y] && discovered[c.y][c.x]) {
        const sx = c.x * tileSize;
        const sy = c.y * tileSize;
        ctx.fillStyle = c.opened ? '#3e2723' : '#ffb300';
        ctx.fillRect(sx + 5, sy + 7, 22, 17);
        ctx.fillStyle = '#212121';
        ctx.fillRect(sx + 13, sy + 13, 6, 6);
      }
    });

    // Alchemist Eldrin (Blaue Magiefackel & Alchemiestand)
    const tr = state.trader;
    if (discovered[tr.y] && discovered[tr.y][tr.x]) {
      const tx = tr.x * tileSize;
      const ty = tr.y * tileSize;

      ctx.fillStyle = '#1565c0';
      ctx.fillRect(tx + 4, ty + 6, 24, 20);
      ctx.fillStyle = '#0d47a1';
      ctx.fillRect(tx + 7, ty + 10, 18, 12);
      ctx.fillStyle = '#64b5f6';
      ctx.font = 'bold 12px serif';
      ctx.fillText('🔮', tx + 8, ty + 20);

      // Fackeldach
      ctx.fillStyle = '#ffd54f';
      ctx.fillRect(tx + 2, ty + 3, 28, 4);
    }

    // Monster (Goblins, Skelette, Gruftfürst)
    monsters.forEach(m => {
      if (discovered[m.y] && discovered[m.y][m.x]) {
        const sx = m.x * tileSize;
        const sy = m.y * tileSize;

        ctx.fillStyle = m.color || '#e53935';
        ctx.beginPath();
        ctx.arc(sx + 16, sy + 16, 11, 0, Math.PI * 2);
        ctx.fill();

        // Glühende Augen
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(sx + 11, sy + 12, 3, 3);
        ctx.fillRect(sx + 18, sy + 12, 3, 3);

        // HP-Balken
        const barW = 24;
        const hpPct = Math.max(0, m.hp / m.maxHp);
        ctx.fillStyle = '#370000';
        ctx.fillRect(sx + 4, sy + 1, barW, 4);
        ctx.fillStyle = '#d32f2f';
        ctx.fillRect(sx + 4, sy + 1, barW * hpPct, 4);
      }
    });

    // Held: Schattenjäger mit flackerndem Fackelschein
    const px = state.player.x * tileSize;
    const py = state.player.y * tileSize;

    // Fackellicht-Atmosphäre
    const torchRadius = 38 + this.torchFlicker;
    const gradient = ctx.createRadialGradient(px + 16, py + 16, 6, px + 16, py + 16, torchRadius);
    gradient.addColorStop(0, 'rgba(255, 179, 0, 0.45)');
    gradient.addColorStop(0.7, 'rgba(255, 87, 34, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(px - 32, py - 32, 96, 96);

    // Helden-Sprite (Krieger mit Kapuze und Schwert)
    ctx.fillStyle = '#c99c42';
    ctx.fillRect(px + 6, py + 6, 20, 20);
    ctx.fillStyle = '#1c1f2e';
    ctx.fillRect(px + 9, py + 9, 14, 8);
    ctx.fillStyle = '#90caf9';
    ctx.fillRect(px + 12, py + 11, 3, 2);
    ctx.fillRect(px + 17, py + 11, 3, 2);

    // Fliegende Zahlen
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold 12px serif';
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
