// [2026-10-13 07:55] - js/systems/audio.js: v0.2.3 Epische Musik & getrennte Lautstärken
export class AudioSystem {
  constructor() {
    const C = window.AudioContext || window.webkitAudioContext;
    this.ctx = C ? new C() : null;
    this.musicVolume = 70;
    this.sfxVolume = 80;
    this.musicMuted = false;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.musicStep = 0;

    if (this.ctx) {
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applyVolumes();
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  applyVolumes() {
    if (!this.ctx) return;
    this.musicGain.gain.value = this.musicMuted ? 0 : (this.musicVolume / 100) * 0.22;
    this.sfxGain.gain.value = (this.sfxVolume / 100) * 0.55;
  }

  setMusicVolume(value) {
    this.musicVolume = Math.max(0, Math.min(100, Number(value) || 0));
    this.applyVolumes();
  }

  setSfxVolume(value) {
    this.sfxVolume = Math.max(0, Math.min(100, Number(value) || 0));
    this.applyVolumes();
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    this.applyVolumes();
    if (this.musicMuted) this.stopMusic();
    else this.startMusic();
    return !this.musicMuted;
  }

  tone(freq, dur = 0.16, type = 'sine', vol = 0.2, destination = this.sfxGain, delay = 0) {
    if (!this.ctx || destination === this.sfxGain && this.sfxVolume <= 0) return;
    this.resume();
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  startMusic() {
    if (!this.ctx || this.musicPlaying || this.musicMuted || this.musicVolume <= 0) return;
    this.resume();
    this.musicPlaying = true;
    this.playMusicBar();
    this.musicTimer = setInterval(() => this.playMusicBar(), 4800);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playMusicBar() {
    if (!this.ctx || this.musicMuted || this.musicVolume <= 0) return;
    const chords = [
      [110, 164.81, 220],
      [98, 146.83, 196],
      [87.31, 130.81, 174.61],
      [103.83, 155.56, 207.65]
    ];
    const chord = chords[this.musicStep % chords.length];
    this.musicStep++;

    chord.forEach((freq, i) => {
      this.tone(freq, 4.4, i === 0 ? 'sawtooth' : 'triangle', i === 0 ? 0.16 : 0.09, this.musicGain, i * 0.08);
    });

    for (let beat = 0; beat < 8; beat++) {
      this.tone(55, 0.22, 'sine', beat % 2 === 0 ? 0.30 : 0.16, this.musicGain, beat * 0.6);
    }

    const melody = [440, 523.25, 659.25, 587.33, 523.25, 440, 392, 440];
    melody.forEach((freq, i) => {
      this.tone(freq, 0.45, 'triangle', 0.10, this.musicGain, i * 0.6 + 0.15);
    });
  }

  step() { this.tone(75, 0.05, 'triangle', 0.08); }
  sword() {
    this.tone(420, 0.18, 'sawtooth', 0.22);
    this.tone(160, 0.2, 'sine', 0.25);
  }
  fire() {
    this.tone(120, 0.35, 'triangle', 0.35);
    this.tone(240, 0.2, 'sawtooth', 0.15);
  }
  potion() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, 'sine', 0.15), i * 40));
  }
  chest() {
    [740, 1174].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.22), i * 80));
  }
  hurt() { this.tone(90, 0.16, 'sawtooth', 0.32); }
  stairs() {
    [280, 210, 140].forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'sine', 0.2), i * 100));
  }
  death() { this.tone(65, 1.4, 'sawtooth', 0.4); }
}

export const sound = new AudioSystem();
