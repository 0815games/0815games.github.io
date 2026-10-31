const CONTACT_DAMAGE_PER_SECOND = 20;
const ENEMY_HEALTH = 50;
const GOLD_PER_KILL = 10;
const TOWER_UPGRADE_BASE_COST = 50;
const TOWER_UPGRADE_RANGE = 60;
const MAGE_BLAST_DAMAGE = 40;
const MAGE_BLAST_RADIUS = 120;
const SHIELD_DURATION = 3;
const DUO_WINDOW = 1.5;
const DUO_DAMAGE = 80;
const DUO_RADIUS = 180;
const DUO_SLOW_DURATION = 3;

export const TOWER_CONFIG = {
  standard: { cost: 50, damage: 12, range: 150, fireInterval: 1 },
  frost: { cost: 70, damage: 6, range: 130, fireInterval: 1 },
  cannon: { cost: 90, damage: 30, range: 170, fireInterval: 1.6 }
};

export class World {
  constructor() {
    this.enemies = [];
    this.towers = [];
    this.gold = 100;
    this.wave = 1;
    this.waveBreak = 0;
    this.knightAbilityAt = null;
    this.mageAbilityAt = null;
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
      enemy.slowTimer = Math.max(0, (enemy.slowTimer ?? 0) - dt);
      const speedFactor = enemy.slowTimer > 0 ? 0.5 : 1;
      const target = this.nearestPlayer(enemy, alivePlayers);

      if (!target) return;

      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;

      enemy.x += (dx / distance) * enemy.speed * speedFactor * dt;
      enemy.y += (dy / distance) * enemy.speed * speedFactor * dt;

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

      if (distance <= tower.range) {
        target.health -= tower.damage;
        tower.cooldown = tower.fireInterval;

        if (tower.type === 'frost') {
          target.slowTimer = 2;
        }

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

    const type = player.towerType;
    const config = TOWER_CONFIG[type];

    if (this.gold < config.cost) return;

    this.gold -= config.cost;
    this.towers.push({
      type,
      x: player.x,
      y: player.y,
      level: 1,
      damage: config.damage,
      range: config.range,
      fireInterval: config.fireInterval,
      cooldown: 0
    });
  }

  tryUpgrade(player) {
    if (!player?.alive || !player.wantsUpgrade) return;

    player.wantsUpgrade = false;

    const tower = this.nearestTower(player);

    if (!tower) return;

    const cost = TOWER_UPGRADE_BASE_COST * tower.level;

    if (this.gold < cost) return;

    this.gold -= cost;
    tower.level += 1;
    tower.damage += 6;
    tower.range += 20;
    tower.fireInterval = Math.max(0.4, tower.fireInterval - 0.1);
  }

  nearestTower(player) {
    let nearest = null;
    let nearestDistance = Infinity;

    this.towers.forEach((tower) => {
      const distance = Math.hypot(player.x - tower.x, player.y - tower.y);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = tower;
      }
    });

    return nearestDistance <= TOWER_UPGRADE_RANGE ? nearest : null;
  }

  tryAbility(player, now) {
    if (!player?.alive || !player.wantsAbility) return;

    player.wantsAbility = false;

    if (player.className === 'knight') {
      player.shieldTimer = SHIELD_DURATION;
      this.knightAbilityAt = now;
      this.checkDuoSynergy(player, now);
      return;
    }

    this.mageAbilityAt = now;
    this.mageBlast(player);
    this.checkDuoSynergy(player, now);
  }

  mageBlast(player) {
    this.enemies.forEach((enemy) => {
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);

      if (distance <= MAGE_BLAST_RADIUS) {
        enemy.health -= MAGE_BLAST_DAMAGE;
      }
    });
  }

  checkDuoSynergy(player, now) {
    const knightTime = this.knightAbilityAt;
    const mageTime = this.mageAbilityAt;

    if (knightTime === null || mageTime === null) return;

    const difference = Math.abs(knightTime - mageTime);

    if (difference > DUO_WINDOW) return;

    this.knightAbilityAt = null;
    this.mageAbilityAt = null;

    const center = player.className === 'mage' ? player : this.findMage(player);

    if (!center) return;

    this.enemies.forEach((enemy) => {
      const distance = Math.hypot(enemy.x - center.x, enemy.y - center.y);

      if (distance <= DUO_RADIUS) {
        enemy.health -= DUO_DAMAGE;
        enemy.slowTimer = DUO_SLOW_DURATION;
      }
    });
  }

  findMage(exclude) {
    return this.enemies.length >= 0 ? exclude : null;
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
      health: ENEMY_HEALTH,
      slowTimer: 0
    });
  }

  serialize() {
    return {
      enemies: this.enemies.map((enemy) => ({
        x: enemy.x,
        y: enemy.y,
        speed: enemy.speed,
        radius: enemy.radius,
        health: enemy.health,
        slowTimer: enemy.slowTimer
      })),
      towers: this.towers.map((tower) => ({
        type: tower.type,
        x: tower.x,
        y: tower.y,
        level: tower.level,
        damage: tower.damage,
        range: tower.range,
        fireInterval: tower.fireInterval
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

    const colors = {
      standard: '#a855f7',
      frost: '#38bdf8',
      cannon: '#f97316'
    };

    this.towers.forEach((tower) => {
      ctx.fillStyle = colors[tower.type] ?? '#a855f7';
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eaf2ff';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`L${tower.level}`, tower.x, tower.y + 4);
    });

    this.enemies.forEach((enemy) => {
      ctx.fillStyle = enemy.slowTimer > 0 ? '#7dd3fc' : '#ef4444';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(enemy.x - 14, enemy.y - 22, 28 * Math.max(enemy.health, 0) / ENEMY_HEALTH, 4);
    });
  }
}