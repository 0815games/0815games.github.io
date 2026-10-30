const CONTACT_DAMAGE_PER_SECOND = 20;
const ENEMY_HEALTH = 50;

export class World {
  constructor() {
    this.enemies = [];
    this.wave = 1;
    this.spawnTimer = 0;
    this.waveBreak = 0;
  }

  update(dt, players) {
    const alivePlayers = players.filter((player) => player.alive);

    if (this.enemies.length === 0) {
      this.waveBreak += dt;

      if (this.waveBreak >= 2) {
        this.waveBreak = 0;
        this.startWave(alivePlayers.length);
      }
    } else {
      this.spawnTimer += dt;
    }

    this.enemies.forEach((enemy) => {
      const target = this.nearestPlayer(enemy, alivePlayers);

      if (!target) return;

      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;

      enemy.x += (dx / distance) * enemy.speed * dt;
      enemy.y += (dy / distance) * enemy.speed * dt;

      if (distance <= enemy.radius + target.radius) {
        target.takeDamage(CONTACT_DAMAGE_PER_SECOND * dt);
      }
    });

    this.enemies = this.enemies.filter((enemy) => enemy.health > 0);
  }

  nearestPlayer(enemy, players) {
    let nearest = null;
    let nearestDistance = Infinity;

    players.forEach((player) => {
      const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = player;
      }
    });

    return nearest;
  }

  startWave(playerCount) {
    this.wave += 1;
    const enemyCount = 2 + this.wave + (playerCount - 1) * 2;

    for (let i = 0; i < enemyCount; i += 1) {
      this.spawnEnemy();
    }
  }

  spawnEnemy() {
    this.enemies.push({
      x: Math.random() * 600 + 100,
      y: 80,
      speed: 70,
      radius: 12,
      health: ENEMY_HEALTH
    });
  }

  serializeEnemies() {
    return this.enemies.map((enemy) => ({
      x: enemy.x,
      y: enemy.y,
      speed: enemy.speed,
      radius: enemy.radius,
      health: enemy.health
    }));
  }

  applyState(enemies, wave) {
    this.enemies = enemies ?? [];
    this.wave = wave ?? this.wave;
  }

  render(ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.enemies.forEach((enemy) => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(enemy.x - 14, enemy.y - 22, 28 * Math.max(enemy.health, 0) / 50, 4);
    });
  }
}