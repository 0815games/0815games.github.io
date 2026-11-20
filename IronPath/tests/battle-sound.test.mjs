import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createBattleSound, panForX } from '../battle-sound.mjs';
import { createPlayer, applyCommand } from '../match.mjs';
import { createSoloDeployment } from '../solo-deployment.mjs';
import { stepMatch } from '../simulation.mjs';
import { getMap } from '../maps.mjs';

// 1. Preserve minimal Web Audio mock compatibility (legacy contract)
let created = 0;
let played = 0;
let instance;
class MinimalAudio {
  constructor() {
    created++;
    instance = this;
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
  }
  async resume() {
    this.state = 'running';
  }
  createOscillator() {
    return {
      frequency: {},
      connect() {},
      start() {
        played++;
      },
      stop() {},
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime() {},
        exponentialRampToValueAtTime() {},
      },
      connect() {},
    };
  }
}

const legacySound = createBattleSound(MinimalAudio);
legacySound.play('request');
assert.equal(created, 0, 'audio is opt-in and cannot autoplay');
assert.equal(await legacySound.setEnabled(true), true);
legacySound.play('request');
legacySound.play('request');
assert.equal(played, 2, 'duplicate cues are rate limited');
instance.currentTime = 0.31;
legacySound.play('request');
assert.equal(played, 4);
for (const cue of ['wave', 'build', 'upgrade', 'classUpgrade', 'ability', 'reconnect', 'combo', 'warning']) {
  legacySound.play(cue);
}
assert.equal(played, 20);
await legacySound.setEnabled(false);
legacySound.play('wave');
assert.equal(played, 20, 'muted sound stays quiet');
const unavailable = createBattleSound(null);
assert.equal(await unavailable.setEnabled(true), false);

// 2. Full Web Audio mock to inspect mixer buses, compressor, stereo panning, VO ducking & synthesis
function makeParam(initial = 0) {
  const param = {
    value: initial,
    events: [],
    setValueAtTime(v, t) {
      this.value = v;
      this.events.push(['set', v, t]);
    },
    exponentialRampToValueAtTime(v, t) {
      this.value = v;
      this.events.push(['exp', v, t]);
    },
    linearRampToValueAtTime(v, t) {
      this.value = v;
      this.events.push(['lin', v, t]);
    },
    setTargetAtTime(v, t, tau) {
      this.value = v;
      this.events.push(['target', v, t, tau]);
    },
  };
  return param;
}

class RichAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 1.0;
    this.sampleRate = 48000;
    this.destination = { kind: 'destination', incoming: [] };
    this.gains = [];
    this.compressors = [];
    this.panners = [];
    this.filters = [];
    this.shapers = [];
    this.buffers = [];
    this.noiseStarts = [];
    this.oscStarts = [];
  }
  async resume() {
    this.state = 'running';
  }
  createGain() {
    const node = {
      kind: 'gain',
      gain: makeParam(1),
      targets: [],
      connect(dest) {
        this.targets.push(dest);
        dest?.incoming?.push?.(this);
        return dest;
      },
    };
    this.gains.push(node);
    return node;
  }
  createDynamicsCompressor() {
    const node = {
      kind: 'compressor',
      threshold: makeParam(-24),
      knee: makeParam(30),
      ratio: makeParam(12),
      attack: makeParam(0.003),
      release: makeParam(0.25),
      targets: [],
      incoming: [],
      connect(dest) {
        this.targets.push(dest);
        dest?.incoming?.push?.(this);
        return dest;
      },
    };
    this.compressors.push(node);
    return node;
  }
  createStereoPanner() {
    const node = {
      kind: 'panner',
      pan: makeParam(0),
      targets: [],
      incoming: [],
      connect(dest) {
        this.targets.push(dest);
        dest?.incoming?.push?.(this);
        return dest;
      },
    };
    this.panners.push(node);
    return node;
  }
  createBiquadFilter() {
    const node = {
      kind: 'filter',
      type: 'lowpass',
      frequency: makeParam(350),
      Q: makeParam(1),
      targets: [],
      incoming: [],
      connect(dest) {
        this.targets.push(dest);
        dest?.incoming?.push?.(this);
        return dest;
      },
    };
    this.filters.push(node);
    return node;
  }
  createWaveShaper() {
    const node = {
      kind: 'shaper',
      curve: null,
      oversample: 'none',
      targets: [],
      incoming: [],
      connect(dest) {
        this.targets.push(dest);
        dest?.incoming?.push?.(this);
        return dest;
      },
    };
    this.shapers.push(node);
    return node;
  }
  createConvolver() {
    return {
      kind: 'convolver',
      buffer: null,
      targets: [],
      incoming: [],
      connect(dest) {
        this.targets.push(dest);
        dest?.incoming?.push?.(this);
        return dest;
      },
      disconnect() {},
    };
  }
  createBuffer(channels, length, sampleRate) {
    const data = new Float32Array(length);
    const buf = {
      channels,
      length,
      sampleRate,
      getChannelData() {
        return data;
      },
    };
    this.buffers.push(buf);
    return buf;
  }
  createBufferSource() {
    const ctx = this;
    return {
      kind: 'bufferSource',
      buffer: null,
      playbackRate: makeParam(1),
      targets: [],
      connect(dest) {
        this.targets.push(dest);
        dest?.incoming?.push?.(this);
        return dest;
      },
      start(when = 0) {
        ctx.noiseStarts.push({ when, rate: this.playbackRate.value, targets: this.targets });
      },
      stop() {},
    };
  }
  createOscillator() {
    const ctx = this;
    return {
      kind: 'osc',
      type: 'sine',
      frequency: makeParam(440),
      targets: [],
      connect(dest) {
        this.targets.push(dest);
        dest?.incoming?.push?.(this);
        return dest;
      },
      start(when = 0) {
        ctx.oscStarts.push({ when, type: this.type, freq: this.frequency.value, targets: this.targets });
      },
      stop() {},
    };
  }
}

test('multi-bus mixer, compressor limiter, stereo panning and VO ducking behave accurately', async () => {
  let ctx = null;
  class TrackedAudio extends RichAudioContext {
    constructor() {
      super();
      ctx = this;
    }
  }
  const sound = createBattleSound(TrackedAudio);
  assert.equal(await sound.setEnabled(true), true);
  assert.equal(sound.hasLimiter(), true);
  assert.equal(ctx.compressors.length, 1);
  assert.equal(ctx.compressors[0].threshold.value, -10);
  assert.equal(ctx.compressors[0].ratio.value, 8);
  assert.equal(ctx.panners.length, 14, 'creates 7 quantized panner buckets on sfx & explosion buses');
  assert.equal(ctx.buffers.length, 2, 'pre-generates shared white & pink noise buffers');

  // Stereo pan calculation bounds
  assert.equal(panForX(0, 960), -0.65);
  assert.equal(panForX(480, 960), 0);
  assert.equal(panForX(960, 960), 0.65);
  assert.equal(panForX(-200, 960), -0.65);
  assert.equal(panForX(2000, 960), 0.65);

  // Bus volume controls
  assert.equal(sound.setBusVolume('music', 0.25), 0.25);
  assert.equal(sound.getBusVolume('music'), 0.25);
  assert.equal(sound.setBusVolume('unknown', 0.5), null);

  // VO ducking smoothly drops musicDuck & combatDuck gains
  assert.equal(sound.setVoiceDucking(true), true);
  assert.equal(sound.isVoiceDucking(), true);
  // gains order: [0] masterGain, [1] combatDuck, [2] musicDuck, [3..6] buses
  assert.equal(ctx.gains[2].gain.value, 0.32);
  assert.equal(ctx.gains[1].gain.value, 0.78);
  assert.equal(sound.setVoiceDucking(false), false);
  assert.equal(ctx.gains[2].gain.value, 1);
  assert.equal(ctx.gains[1].gain.value, 1);

  // Left-side cannon shot routes through negative pan bucket -> explosion bus
  sound.play('shot', { kind: 1, x: 40, mapWidth: 960 });
  assert.ok(ctx.noiseStarts.length >= 1);
  assert.ok(ctx.oscStarts.length >= 1);
  const usedPanners = ctx.panners.filter(p => p.incoming.length > 0).map(p => p.pan.value);
  assert.ok(usedPanners.some(p => p <= -0.4), 'left-side fire routes to left stereo channel');
});

test('all tactical-dry weapon variants, branch paths, class overlays, strike and deaths synthesize cleanly with rate limits', async () => {
  let ctx = null;
  class TrackedAudio extends RichAudioContext {
    constructor() {
      super();
      ctx = this;
    }
  }
  const sound = createBattleSound(TrackedAudio);
  assert.equal(await sound.setEnabled(true), true);

  const shotVariants = [
    { kind: 0, x: 100 },
    { kind: 0, branch: 0, x: 200 },
    { kind: 0, branch: 1, x: 300 },
    { kind: 1, x: 400 },
    { kind: 1, branch: 1, fx: 'splash', x: 500 },
    { kind: 2, x: 600 },
    { kind: 2, branch: 1, fx: 'chain', x: 650 },
    { kind: 3, x: 700 },
    { kind: 3, fx: 'crit', classPath: 'recon', x: 750 },
    { kind: 0, classPath: 'logistics', x: 800 },
    { kind: 0, classPath: 'medic', x: 820 },
    { kind: 2, classPath: 'airDefense', x: 840 },
    { kind: 'hero', x: 500 },
    { kind: 'hero', fx: 'bunker', x: 910 },
  ];

  for (const variant of shotVariants) {
    ctx.currentTime += 0.35;
    const beforeNoise = ctx.noiseStarts.length;
    const beforeOsc = ctx.oscStarts.length;
    sound.play('shot', { ...variant, mapWidth: 960 });
    assert.ok(
      ctx.noiseStarts.length > beforeNoise || ctx.oscStarts.length > beforeOsc,
      `shot variant ${JSON.stringify(variant)} produced audio`,
    );
  }

  for (const death of [
    { kind: 'infantry', x: 300 },
    { kind: 'runner', x: 350 },
    { kind: 'tank', x: 450 },
    { kind: 'plane', x: 550 },
    { kind: 'bossBomber', boss: true, x: 650 },
  ]) {
    ctx.currentTime += 0.5;
    const before = ctx.noiseStarts.length + ctx.oscStarts.length;
    sound.play('death', { ...death, mapWidth: 960 });
    assert.ok(ctx.noiseStarts.length + ctx.oscStarts.length > before, `death ${death.kind} produced audio`);
  }

  // Story tactical strike cue
  ctx.currentTime += 0.5;
  const beforeStrike = ctx.noiseStarts.length;
  sound.play('strike');
  assert.ok(ctx.noiseStarts.length > beforeStrike, 'strike cue fires multi-impact rumble');

  // Polyphony & per-weapon rate limiting prevents simultaneous flood
  ctx.currentTime += 1.0;
  const burstBefore = ctx.noiseStarts.length;
  for (let i = 0; i < 20; i++) {
    sound.play('shot', { kind: 0, x: 100 + i * 20, mapWidth: 960 });
  }
  const burstStarts = ctx.noiseStarts.length - burstBefore;
  assert.ok(burstStarts > 0 && burstStarts <= 4, `burst MG fire throttled (${burstStarts} starts)`);
});

test('observeCombat integrates with simulation shots/deaths, resolves pad branches, and respects co-op baselineOnly', async () => {
  let ctx = null;
  class TrackedAudio extends RichAudioContext {
    constructor() {
      super();
      ctx = this;
    }
  }
  const sound = createBattleSound(TrackedAudio);
  assert.equal(await sound.setEnabled(true), true);

  const player = createPlayer('local', { name: 'Tester', gender: 'male', level: 10 });
  const state = createSoloDeployment({ player, mapId: 'road' });
  const map = getMap(state.mapId);

  // Build & upgrade pad 0 to Heavy MG (branch 1) and add a Cannon on pad 1
  state.money = 1000;
  assert.equal(applyCommand(state, 'local', { type: 'build', pad: 0, towerType: 0 }).ok, true);
  assert.equal(applyCommand(state, 'local', { type: 'upgrade', pad: 0 }).ok, true);
  assert.equal(applyCommand(state, 'local', { type: 'upgrade', pad: 0, branch: 1 }).ok, true);
  assert.equal(applyCommand(state, 'local', { type: 'build', pad: 1, towerType: 1 }).ok, true);
  assert.equal(applyCommand(state, 'local', { type: 'startWave' }).ok, true);

  // Step until shots and at least one enemy death occur
  let observedShots = 0;
  let observedDeaths = 0;
  for (let tick = 0; tick < 360; tick++) {
    ctx.currentTime += 1 / 30;
    stepMatch(state);
    const res = sound.observeCombat(state, { pads: map.pads, mapWidth: map.width });
    observedShots += res.shots;
    observedDeaths += res.deaths;

    // Re-observing exact same tick state must emit zero duplicates
    const dup = sound.observeCombat(state, { pads: map.pads, mapWidth: map.width });
    assert.deepEqual(dup, { shots: 0, deaths: 0 });
    if (observedShots >= 3 && observedDeaths >= 1) break;
  }
  assert.ok(observedShots >= 3, `expected >=3 observed shots from simulation, got ${observedShots}`);
  assert.ok(observedDeaths >= 1, `expected >=1 observed enemy deaths from simulation, got ${observedDeaths}`);

  // Co-op initial snapshot (baselineOnly: true) absorbs existing shots/pops silently
  sound.resetCombat();
  const resBaseline = sound.observeCombat(state, { pads: map.pads, mapWidth: map.width, baselineOnly: true });
  assert.deepEqual(resBaseline, { shots: 0, deaths: 0 });

  // Immediately calling normal observeCombat without advancing sim emits zero stale sounds
  const resAfterBaseline = sound.observeCombat(state, { pads: map.pads, mapWidth: map.width });
  assert.deepEqual(resAfterBaseline, { shots: 0, deaths: 0 });
});

test('Packages 2, 3 & 4 cues (construction, economy, class abilities, bosses, waves & subtle UI) synthesize cleanly and isolate cooldowns', async () => {
  let ctx = null;
  class TrackedAudio extends RichAudioContext {
    constructor() {
      super();
      ctx = this;
    }
  }
  const sound = createBattleSound(TrackedAudio);
  assert.equal(await sound.setEnabled(true), true);
  assert.equal(sound.isEnabled(), true);

  const packageCues = [
    // Package 2: construction, upgrades, dismantling, supplies, perks, sectors & bunker impact
    ['build', { towerType: 0, x: 100, mapWidth: 960 }],
    ['build', { towerType: 1, x: 200, mapWidth: 960 }],
    ['build', { towerType: 2, x: 300, mapWidth: 960 }],
    ['build', { towerType: 3, x: 400, mapWidth: 960 }],
    ['upgrade', { x: 220, mapWidth: 960 }],
    ['branch', { x: 240, mapWidth: 960 }],
    ['prestige', { x: 260, mapWidth: 960 }],
    ['classUpgrade', { classId: 'engineer', x: 280, mapWidth: 960 }],
    ['sell', { x: 320, mapWidth: 960 }],
    ['loot', {}],
    ['loot', { bounty: true }],
    ['perk', {}],
    ['sector', {}],
    ['impact', { x: 900, mapWidth: 960 }],
    // Package 3: 6 class abilities, combos, hazards & boss events
    ['ability', { classId: 'assault', variant: 2, x: 400, mapWidth: 960 }],
    ['ability', { classId: 'engineer', variant: 1, x: 420, mapWidth: 960 }],
    ['ability', { classId: 'logistics', variant: 0, x: 440, mapWidth: 960 }],
    ['ability', { classId: 'medic', variant: 1, x: 460, mapWidth: 960 }],
    ['ability', { classId: 'recon', variant: 2, x: 480, mapWidth: 960 }],
    ['ability', { classId: 'airDefense', variant: 1, x: 500, mapWidth: 960 }],
    ['combo', { x: 500, mapWidth: 960 }],
    ['ice', {}],
    ['rubble', {}],
    ['boss', {}],
    ['warning', {}],
    ['bossAbility', { boss: 'bossRiegel', ability: 'interceptors' }],
    ['bossAbility', { boss: 'bossKolt', ability: 'flood' }],
    ['bossAbility', { boss: 'bossJuggernaut', ability: 'repair' }],
    ['bossAbility', { boss: 'bossA7', ability: 'a7-kern' }],
    // Package 4: waves, victory/defeat, radio/coop, cooldown ready & restrained UI
    ['wave', {}],
    ['clear', {}],
    ['victory', {}],
    ['defeat', {}],
    ['request', {}],
    ['reconnect', {}],
    ['abilityReady', {}],
    ['uiClick', {}],
    ['uiCraft', {}],
    ['uiEquip', {}],
    ['uiConfirm', {}],
    ['uiError', {}],
  ];

  for (const [cue, detail] of packageCues) {
    ctx.currentTime += 1.1;
    const before = ctx.noiseStarts.length + ctx.oscStarts.length;
    sound.play(cue, detail);
    assert.ok(ctx.noiseStarts.length + ctx.oscStarts.length > before, `cue '${cue}' (${JSON.stringify(detail)}) synthesized audio`);
  }

  // UI cues throttle at 0.09s and do not route into spatial panners
  ctx.currentTime += 1.0;
  const pannersBefore = ctx.panners.reduce((sum, p) => sum + p.incoming.length, 0);
  sound.play('uiCraft');
  const afterFirst = ctx.noiseStarts.length + ctx.oscStarts.length;
  sound.play('uiCraft');
  assert.equal(ctx.noiseStarts.length + ctx.oscStarts.length, afterFirst, 'duplicate uiCraft within 0.09s throttled');
  assert.equal(ctx.panners.reduce((sum, p) => sum + p.incoming.length, 0), pannersBefore, 'UI cues stay centered (bypass spatial panners)');
});

test('Package 5 & 6: adaptive music, weather bed routing, split SFX/Music gains, pause context & lifecycle resume/dispose', async () => {
  const { createBattleSound } = await import('../battle-sound.mjs');
  const { weatherForScene } = await import('../battle-music.mjs');

  assert.equal(weatherForScene({ storyWeather: 'rain' }), 'rain');
  assert.equal(weatherForScene({ storyWeather: 'snow' }), 'arctic');
  assert.equal(weatherForScene({ theme: 'marsh' }), 'rain');
  assert.equal(weatherForScene({ theme: 'arctic' }), 'arctic');
  assert.equal(weatherForScene({ theme: 'forest' }), 'wind');

  let ctx = null;
  class MusicTestAudio extends RichAudioContext {
    constructor() {
      super();
      this.state = 'running';
      ctx = this;
    }
  }
  const sound = createBattleSound(MusicTestAudio);

  await sound.setEnabled(true);
  // Music default bus stays restrained under combat SFX & General Vance radio.
  assert.equal(sound.getBusVolume('music'), 0.38);
  // Lazily keeps bare SFX init at 2 buffers until music/weather actually activates.
  assert.equal(ctx.buffers.length, 2, 'noise buffers remain lazy until music/weather plays');
  assert.equal(sound.setSfxVolume(0.75), 0.75);
  assert.equal(sound.setMusicVolume(0.45), 0.45);
  assert.equal(sound.setMusicEnabled(true), true);

  sound.setScene({
    phase: 'menu',
    weatherEffects: true,
    paused: false,
  });
  assert.equal(sound.getMusicState().phase, 'menu');
  // Weather noise bed stays silent in Command HQ menu, and uses gentle Q <= 0.75.
  const weatherFilters = ctx.filters.filter(f => f.Q.value <= 0.75 && f.Q.value > 0 && [2100, 260, 680].includes(f.frequency.value));
  assert.equal(weatherFilters.length, 3, 'three low-Q weather bed filters initialized without resonant whistling');
  for (const wf of weatherFilters) {
    const wfGain = wf.targets[0];
    assert.ok(wfGain.gain.value <= 0.0002, 'weather bed remains muted on menu phase');
  }
  const weatherBuffer = ctx.buffers.find(b => b.length >= 4 * ctx.sampleRate);
  assert.ok(weatherBuffer, 'allocates dedicated 4s crossfaded weather noise loop buffer');
  const weatherSamples = weatherBuffer.getChannelData(0);
  assert.ok(
    Math.abs(weatherSamples[0] - weatherSamples[weatherSamples.length - 1]) < 0.08,
    'weather loop buffer crossfades smoothly across loop wrap without clicking'
  );

  sound.setScene({
    phase: 'prep',
    storyMissionId: 'bridge',
    weatherEffects: true,
    paused: false,
  });
  assert.equal(sound.getMusicState().phase, 'prep');
  assert.equal(sound.getMusicState().weather, 'rain');
  assert.equal(sound.getMusicState().hasReverb, true, 'lazy stereo room convolver initialized');
  assert.equal(sound.getMusicState().hasWeatherBed, true, 'lazy weather noise bed initialized');
  assert.ok(ctx.buffers.length >= 3, 'lazy stereo room convolver impulse allocates when battle music starts');
  assert.equal(sound.getMusicState().scheduling, true, 'adaptive scheduler starts');

  sound.setScene({ phase: 'wave', paused: false });
  sound.setScene({ phase: 'boss', paused: false });
  assert.equal(sound.getMusicState().phase, 'boss');
  assert.equal(sound.getMusicState().weather, 'rain', 'weather persists across wave/boss scene updates');
  assert.ok(ctx.oscStarts.length >= 8, 'scheduled melodic/harmonic/bass oscillators across phases');
  assert.ok(
    ctx.oscStarts.every(osc => osc.type === 'sine' || osc.type === 'triangle'),
    'music engine never emits harsh unmodulated sawtooth/square oscillators'
  );

  sound.setScene({ paused: true });
  assert.equal(sound.getMusicState().paused, true);
  assert.equal(sound.getMusicState().weather, 'rain', 'partial paused scene keeps active mission weather');

  sound.setMusicEnabled(false);
  assert.equal(sound.getMusicState().enabled, false);
  assert.equal(sound.getMusicState().scheduling, false);

  assert.equal(sound.needsResume(), false);
  ctx.state = 'suspended';
  assert.equal(sound.needsResume(), true);
  assert.equal(await sound.resume(), true);

  sound.dispose();
  assert.equal(sound.getMusicState().scheduling, false, 'dispose cancels music timers cleanly');
});


