export class World {
  constructor() {
    this.enemies = [];
    this.wave = 1;
    this.spawnTimer = 0;
  }

  update(dt, players) {
    this.spawnTimer += dt;

    if (this.spawnTimer >= 4) {
      this.spawnTimer = 0;
      this.spawnEnemy(players);
    }

    this.enemies.forEach((enemy) => enemy.update(dt, players));
    this.enemies = this.enemies.filter((enemy) => enemy.alive);
  }

  spawnEnemy(players) {
    const playerList = [...players.values()];
    if (!playerList.length) return;

    this.enemies.push({
      x: Math.random() * 600 + 100,
      y: 80,
      speed: 70,
      radius: 12,
      alive: true,
      update(dt, targets) {
        const target = targets[0];
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy) || 1;

        this.x += (dx / distance) * this.speed * dt;
        this.y += (dy / distance) * this.speed * dt;
      }
    });
  }

  render(ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = '#ef4444';
    this.enemies.forEach((enemy) => {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}