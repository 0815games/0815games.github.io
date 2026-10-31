import { Input } from '../core/input.js';

const ATTACK_COOLDOWN = 0.5;
const ATTACK_RANGE = 70;
const ATTACK_DAMAGE = 25;
const RESPAWN_TIME = 3;
const SHIELD_DURATION = 3;
const SHIELD_COOLDOWN = 8;
const ABILITY_COOLDOWN = 6;

export const CLASSES = ['knight', 'mage'];

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
    this.classIndex = role === 'host' ? 0 : 1;
    this.abilityCooldown = 0;
    this.shieldTimer = 0;
  }

  update(dt) {
    this.applyInput({
      x: this.input.getMoveVector().x,
      y: this.input.getMoveVector().y,
      attack: this.input.isDown('Space'),
      build: this.input.isDown('KeyT'),
      upgrade: this.input.isDown('KeyU'),
      cycle: this.input.isDown('KeyB'),
      classCycle: this.input.isDown('KeyC'),
      ability: this.input.isDown('KeyQ')
    }, dt);
  }

  applyInput(input, dt) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.abilityCooldown = Math.max(0, this.abilityCooldown - dt);
    this.shieldTimer = Math.max(0, this.shieldTimer - dt);

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

    if (input.classCycle) {
      this.wantsClassCycle = true;
    }

    if (input.ability && this.abilityCooldown <= 0) {
      this.abilityCooldown = this.className === 'knight' ? SHIELD_COOLDOWN : ABILITY_COOLDOWN;
      this.wantsAbility = true;
    }
  }

  cycleTowerType() {
    if (!this.wantsCycle) return;

    this.wantsCycle = false;
    this.towerTypeIndex = (this.towerTypeIndex + 1) % 3;
  }

  cycleClass() {
    if (!this.wantsClassCycle) return;

    this.wantsClassCycle = false;
    this.classIndex = (this.classIndex + 1) % CLASSES.length;
  }

  get className() {
    return CLASSES[this.classIndex];
  }

  get towerType() {
    return ['standard', 'frost', 'cannon'][this.towerTypeIndex];
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

    const reduction = this.shieldTimer > 0 ? 0.5 : 1;
    this.health -= amount * reduction;

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
    this.classIndex = state.classIndex ?? this.classIndex;
    this.abilityCooldown = state.abilityCooldown ?? this.abilityCooldown;
    this.shieldTimer = state.shieldTimer ?? this.shieldTimer;
  }

  serialize() {
    return {
      x: this.x,
      y: this.y,
      health: this.health,
      alive: this.alive,
      classIndex: this.classIndex,
      abilityCooldown: this.abilityCooldown,
      shieldTimer: this.shieldTimer
    };
  }

  render(ctx) {
    ctx.globalAlpha = this.alive ? 1 : 0.3;
    ctx.fillStyle = this.className === 'knight' ? '#38bdf8' : '#a78bfa';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    if (this.shieldTimer > 0) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}