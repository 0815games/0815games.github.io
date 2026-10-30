import { Input } from '../core/input.js';

const ATTACK_COOLDOWN = 0.5;
const ATTACK_RANGE = 70;
const ATTACK_DAMAGE = 25;
const RESPAWN_TIME = 3;

export const TOWER_TYPES = ['standard', 'frost', 'cannon'];

export class Player {
  constructor(role) {
    this.role = role;
    this.input = new Input();
    this.spawnX = role === 'host' ? 240 : 320;
    this.spawnY = 240;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.speed = 220;
    this.health = 100;
    this.maxHealth = 100;
    this.radius = 16;
    this.attackCooldown = 0;
    this.respawnTimer = 0;
    this.alive = true;
    this.towerTypeIndex = 0;
  }

  update(dt) {
    this.applyInput({
      x: this.input.getMoveVector().x,
      y: this.input.getMoveVector().y,
      attack: this.input.isDown('Space'),
      build: this.input.isDown('KeyT'),
      upgrade: this.input.isDown('KeyU'),
      cycle: this.input.isDown('KeyB')
    }, dt);
  }

  applyInput(input, dt) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    if (!this.alive) {
      this.respawnTimer -= dt;

      if (this.respawnTimer <= 0) {
        this.respawn();
      }
      return;
    }

    const length = Math.hypot(input.x, input.y) || 1;

    this.x += (input.x / length) * this.speed * dt;
    this.y += (input.y / length) * this.speed * dt;

    if (input.attack && this.attackCooldown <= 0) {
      this.attackCooldown = ATTACK_COOLDOWN;
      this.wantsAttack = true;
    }

    if (input.build) {
      this.wantsBuild = true;
    }

    if (input.upgrade) {
      this.wantsUpgrade = true;
    }

    if (input.cycle) {
      this.wantsCycle = true;
    }
  }

  cycleTowerType() {
    if (!this.wantsCycle) return;

    this.wantsCycle = false;
    this.towerTypeIndex = (this.towerTypeIndex + 1) % TOWER_TYPES.length;
  }

  get towerType() {
    return TOWER_TYPES[this.towerTypeIndex];
  }

  tryAttack(enemies) {
    if (!this.alive || !this.wantsAttack) return;

    this.wantsAttack = false;

    enemies.forEach((enemy) => {
      const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);

      if (distance <= ATTACK_RANGE + enemy.radius) {
        enemy.health -= ATTACK_DAMAGE;
      }
    });
  }

  takeDamage(amount) {
    if (!this.alive) return;

    this.health -= amount;

    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.respawnTimer = RESPAWN_TIME;
    }
  }

  respawn() {
    this.alive = true;
    this.health = this.maxHealth;
    this.x = this.spawnX;
    this.y = this.spawnY;
  }

  applyState(state) {
    if (!state) return;

    this.x = state.x ?? this.x;
    this.y = state.y ?? this.y;
    this.health = state.health ?? this.health;
    this.alive = state.alive ?? this.alive;
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      health: this.health,
      alive: this.alive
    };
  }

  render(ctx) {
    ctx.globalAlpha = this.alive ? 1 : 0.3;
    ctx.fillStyle = this.role === 'host' ? '#38bdf8' : '#f97316';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}