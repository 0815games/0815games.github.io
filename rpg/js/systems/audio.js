// [2026-10-12 19:40] - js/systems/audio.js: v0.1.1 Lazy-Init Audio
export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensureContext() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (C) this.ctx = new C();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.muted = !this.muted;
    return !this.muted;
  }

  beep(freq, dur = 0.16, type = 'sine', vol = 0.2) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) {}
  }

  step() { this.beep(75, 0.05, 'triangle', 0.08); }
  sword() {
    this.beep(420, 0.18, 'sawtooth', 0.22);
    this.beep(160, 0.2, 'sine', 0.25);
  }
  fire() {
    this.beep(120, 0.35, 'triangle', 0.35);
    this.beep(240, 0.2, 'sawtooth', 0.15);
  }
  potion() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.15, 'sine', 0.15), i * 40));
  }
  chest() {
    [740, 1174].forEach((f, i) => setTimeout(() => this.beep(f, 0.25, 'triangle', 0.22), i * 80));
  }
  hurt() { this.beep(90, 0.16, 'sawtooth', 0.32); }
  stairs() {
    [280, 210, 140].forEach((f, i) => setTimeout(() => this.beep(f, 0.3, 'sine', 0.2), i * 100));
  }
  death() { this.beep(65, 1.4, 'sawtooth', 0.4); }
}

export const sound = new AudioSystem();
