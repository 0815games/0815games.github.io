const CONTACT_DAMAGE_PER_SECOND = 20;
const ENEMY_HEALTH = 50;
const GOLD_PER_KILL = 10;
const TOWER_COST = 50;
const TOWER_RANGE = 150;
const TOWER_DAMAGE = 12;
const TOWER_FIRE_INTERVAL = 1;

export class World {
  constructor() {
    this.enemies = [];
    this.towers = [];
    this.gold = 100;
    this.wave = 1;
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

    this.updateTowers(dt);
    this.enemies = this.enemies.filter((enemy) => enemy.health > 0);
  }

  updateTowers(dt) {
    this.towers.forEach((tower) => {
      tower.cooldown = Math.max(0, tower.cooldown - dt);

      if (tower.cooldown > 0) return;

      const target = this.nearestEnemy(tower);

      if (!target) return;

      const distance = Math.hypot(target.x - tower.x, target.y - tower.y);

      if (distance <= TOWER_RANGE) {
        target.health -= TOWER_DAMAGE;
        tower.cooldown = TOWER_FIRE_INTERVAL;

        if (target.health <= 0) {
          this.gold += GOLD_PER_KILL;
        }
      }
    });
  }

  nearestEnemy(tower) {
    let nearest = null;
    let nearestDistance = Infinity;

    this.enemies.forEach((enemy) => {
      const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = enemy;
      }
    });

    return nearest;
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

  tryBuild(player) {
    if (!player?.alive || !player.wantsBuild) return;

    player.wantsBuild = false;

    if (this.gold < TOWER_COST) return;

    this.gold -= TOWER_COST;
    this.towers.push({
      x: player.x,
      y: player.y,
      cooldown: 0
    });
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

  serialize() {
    return {
      enemies: this.enemies.map((enemy) => ({
        x: enemy.x,
        y: enemy.y,
        speed: enemy.speed,
        radius: enemy.radius,
        health: enemy.health
      })),
      towers: this.towers.map((tower) => ({
        x: tower.x,
        y: tower.y
      })),
      gold: this.gold,
      wave: this.wave
    };
  }

  applyState(state) {
    this.enemies = state?.enemies ?? [];
    this.towers = state?.towers ?? [];
    this.gold = state?.gold ?? this.gold;
    this.wave = state?.wave ?? this.wave;
  }

  render(ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.towers.forEach((tower) => {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    this.enemies.forEach((enemy) => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(enemy.x - 14, enemy.y - 22, 28 * Math.max(enemy.health, 0) / ENEMY_HEALTH, 4);
    });
  }
}