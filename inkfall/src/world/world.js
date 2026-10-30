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
  }

  spawnEnemy(players) {
    const target = players.find(Boolean);
    if (!target) return;

    this.enemies.push({
      x: Math.random() * 600 + 100,
      y: 80,
      speed: 70,
      radius: 12,
      update(dt, targets) {
        const player = targets.find(Boolean);
        if (!player) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy) || 1;

        this.x += (dx / distance) * this.speed * dt;
        this.y += (dy / distance) * this.speed * dt;
      }
    });
  }

  serializeEnemies() {
    return this.enemies.map((enemy) => ({
      x: enemy.x,
      y: enemy.y,
      speed: enemy.speed,
      radius: enemy.radius
    }));
  }

  applyState(enemies) {
    this.enemies = enemies.map((enemy) => ({
      ...enemy,
      update: (dt, targets) => {
        const player = targets.find(Boolean);
        if (!player) return;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.hypot(dx, dy) || 1;

        enemy.x += (dx / distance) * enemy.speed * dt;
        enemy.y += (dy / distance) * enemy.speed * dt;
      }
    }));
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