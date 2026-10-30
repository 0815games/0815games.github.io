import { Player } from '../player/player.js';
import { World } from '../world/world.js';
import { Hud } from '../ui/hud.js';

const STATE_INTERVAL = 0.1;
const INPUT_INTERVAL = 0.066;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.hud = new Hud();
    this.running = false;
    this.lastTime = 0;
    this.stateTimer = 0;
    this.inputTimer = 0;
    this.remoteState = null;
    this.remoteInputs = {};

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  setSession(session) {
    this.session = session;
    this.world = new World();

    this.localPlayer = new Player(session.role);
    this.remotePlayer = new Player(session.isHost() ? 'guest' : 'host');

    if (session.isHost()) {
      this.session.net.onInputs(this.session.code, (inputs) => {
        this.remoteInputs = inputs ?? {};
      });
    } else {
      this.session.net.onState(this.session.code, (state) => {
        this.remoteState = state;
      });
    }
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
    if (this.session.isHost()) {
      this.updateHost(dt);
    } else {
      this.updateGuest(dt);
    }
  }

  updateHost(dt) {
    this.localPlayer.update(dt);

    const guestInput = this.remoteInputs.guest;
    if (guestInput) {
      this.remotePlayer.applyInput(guestInput, dt);
    }

    this.localPlayer.tryAttack(this.world.enemies);
    this.remotePlayer.tryAttack(this.world.enemies);
    this.world.tryBuild(this.localPlayer);
    this.world.tryBuild(this.remotePlayer);
    this.world.update(dt, [this.localPlayer, this.remotePlayer]);

    this.stateTimer += dt;
    if (this.stateTimer >= STATE_INTERVAL) {
      this.stateTimer = 0;
      this.session.net.writeState(this.session.code, {
        players: {
          host: this.localPlayer.serialize(),
          guest: this.remotePlayer.serialize()
        },
        ...this.world.serialize()
      });
    }
  }

  updateGuest(dt) {
    this.inputTimer += dt;

    if (this.inputTimer >= INPUT_INTERVAL) {
      this.inputTimer = 0;
      const move = this.localPlayer.input.getMoveVector();

      this.session.net.sendInput(this.session.code, 'guest', {
        x: move.x,
        y: move.y,
        attack: this.localPlayer.input.isDown('Space'),
        build: this.localPlayer.input.isDown('KeyT')
      });
    }

    const state = this.remoteState;
    if (!state) return;

    this.localPlayer.applyState(state.players?.guest);
    this.remotePlayer.applyState(state.players?.host);
    this.world.applyState(state);
  }

  render() {
    const ctx = this.context;
    ctx.fillStyle = '#0b1020';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.world.render(ctx);
    this.localPlayer.render(ctx);
    this.remotePlayer.render(ctx);
    this.hud.render(ctx, this.session, this.localPlayer, this.remotePlayer, this.world);
  }
}