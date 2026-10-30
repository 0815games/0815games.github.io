import { Player } from '../player/player.js';
import { World } from '../world/world.js';
import { Hud } from '../ui/hud.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.world = new World();
    this.hud = new Hud();
    this.players = new Map();
    this.running = false;
    this.lastTime = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setSession(session) {
    this.session = session;
    this.session.getPlayers().forEach((player, id) => {
      this.players.set(id, new Player(id, player.role));
    });
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.frame(time));
  }

  frame(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.render();
    requestAnimationFrame((next) => this.frame(next));
  }

  update(dt) {
    this.world.update(dt, this.players);
    this.players.forEach((player) => player.update(dt));
  }

  render() {
    const ctx = this.context;
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.world.render(ctx);
    this.players.forEach((player) => player.render(ctx));
    this.hud.render(ctx, this.session);
  }
}