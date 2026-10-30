import { Input } from '../core/input.js';

export class Player {
  constructor(role) {
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
    this.applyInput({
      x: this.input.getMoveVector().x,
      y: this.input.getMoveVector().y
    }, dt);
  }

  applyInput(input, dt) {
    const length = Math.hypot(input.x, input.y) || 1;

    this.x += (input.x / length) * this.speed * dt;
    this.y += (input.y / length) * this.speed * dt;
  }

  applyState(state) {
    if (!state) return;

    this.x = state.x ?? this.x;
    this.y = state.y ?? this.y;
    this.health = state.health ?? this.health;
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      health: this.health
    };
  }

  render(ctx) {
    ctx.fillStyle = this.role === 'host' ? '#38bdf8' : '#f97316';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}