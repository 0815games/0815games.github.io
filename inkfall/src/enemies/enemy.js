export class Enemy {
  constructor({ x, y, speed = 70, radius = 12 }) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.radius = radius;
    this.alive = true;
  }

  update(dt, players) {
    const target = [...players.values()][0];
    if (!target) return;

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;

    this.x += (dx / distance) * this.speed * dt;
    this.y += (dy / distance) * this.speed * dt;
  }

  render(ctx) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}