// [2026-10-12 08:13] - js/world/render.js: Canvas-Renderer
// Änderungen:
// - Gitter-Rendering mit Farbcodierung für Spieler, Monster und Barrieren.

import { state } from '../core/state.js';

export class CanvasRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.tileSize = 32;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < state.activeZone.height; y++) {
      for (let x = 0; x < state.activeZone.width; x++) {
        this.ctx.strokeStyle = '#092109';
        this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }
    }

    this.ctx.fillStyle = '#163b16';
    state.activeZone.walls.forEach(w => {
      this.ctx.fillRect(w.x * this.tileSize + 1, w.y * this.tileSize + 1, this.tileSize - 2, this.tileSize - 2);
    });

    state.activeZone.monsters.forEach(m => {
      this.ctx.fillStyle = '#ff3333';
      this.ctx.fillRect(m.x * this.tileSize + 3, m.y * this.tileSize + 3, this.tileSize - 6, this.tileSize - 6);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px Courier New';
      this.ctx.fillText(m.name[0], m.x * this.tileSize + 12, m.y * this.tileSize + 20);
    });

    this.ctx.fillStyle = '#33ff33';
    this.ctx.fillRect(state.player.x * this.tileSize + 2, state.player.y * this.tileSize + 2, this.tileSize - 4, this.tileSize - 4);
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 12px Courier New';
    this.ctx.fillText('@', state.player.x * this.tileSize + 10, state.player.y * this.tileSize + 21);
  }
}
