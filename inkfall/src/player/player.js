import { Input } from '../core/input.js';

export class Player {
  constructor(id, role) {
    this.id = id;
    this.role = role;
    this.input = new Input();
    this.x = role === 'host' ? 240 : 320;
    this.y = 240;
    this.speed = 220;
    this.health = 100;
    this.maxHealth = 100;
    this.radius = 16;
  }

  update(dt) {
    const move = this.input.getMoveVector();
    const length = Math.hypot(move.x, move.y) || 1;

    this.x += (move.x / length) * this.speed * dt;
    this.y += (move.y / length) * this.speed * dt;
  }

  render(ctx) {
    ctx.fillStyle = this.role === 'host' ? '#38bdf8' : '#f97316';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}