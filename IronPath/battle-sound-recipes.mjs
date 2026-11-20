// Realistic tactical Web Audio synthesis recipes for Iron Path.
// Zero external asset dependencies; safely feature-detects Web Audio nodes so
// minimal test doubles never throw.

const contextResources = new WeakMap();

const jitter = (span = 0.06) => 1 + (Math.random() * 2 - 1) * span;
const clampGain = value => Math.max(0.0001, Math.min(1, value));

function setParam(param, value, time) {
  if (!param) return;
  if (typeof param.setValueAtTime === 'function') param.setValueAtTime(value, time);
  else param.value = value;
}

function expRamp(param, value, time) {
  if (!param) return;
  if (typeof param.exponentialRampToValueAtTime === 'function') {
    param.exponentialRampToValueAtTime(Math.max(0.0001, value), time);
  } else if (typeof param.setValueAtTime === 'function') {
    param.setValueAtTime(value, time);
  } else {
    param.value = value;
  }
}

export function getAudioResources(context) {
  if (!context) return null;
  let cached = contextResources.get(context);
  if (cached) return cached;

  const sampleRate = Number.isFinite(context.sampleRate) && context.sampleRate > 0 ? context.sampleRate : 44100;
  const length = Math.max(2048, Math.floor(sampleRate * 1.5));
  let whiteBuffer = null;
  let pinkBuffer = null;
  let satCurve = null;

  if (typeof context.createBuffer === 'function') {
    try {
      whiteBuffer = context.createBuffer(1, length, sampleRate);
      const white = whiteBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) white[i] = Math.random() * 2 - 1;

      pinkBuffer = context.createBuffer(1, length, sampleRate);
      const pink = pinkBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, peak = 0.001;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.950 * b2 + w * 0.048;
        const sample = b0 + b1 + b2 + w * 0.08;
        pink[i] = sample;
        if (Math.abs(sample) > peak) peak = Math.abs(sample);
      }
      const norm = 0.9 / peak;
      for (let i = 0; i < length; i++) pink[i] *= norm;
    } catch {
      whiteBuffer = null;
      pinkBuffer = null;
    }
  }

  if (typeof context.createWaveShaper === 'function') {
    satCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 255 - 1;
      satCurve[i] = Math.tanh(x * 2.4);
    }
  }

  cached = { whiteBuffer, pinkBuffer, satCurve, sampleRate };
  contextResources.set(context, cached);
  return cached;
}

export function createSaturationNode(context, resources) {
  if (!resources?.satCurve || typeof context?.createWaveShaper !== 'function') return null;
  try {
    const shaper = context.createWaveShaper();
    shaper.curve = resources.satCurve;
    shaper.oversample = 'none';
    return shaper;
  } catch {
    return null;
  }
}

export function playNoiseBurst(context, dest, resources, {
  pink = false,
  start,
  duration = 0.08,
  filterType = 'bandpass',
  freq = 1200,
  freqEnd = null,
  q = 1.2,
  gain = 0.08,
  attack = 0.002,
  saturate = false,
} = {}) {
  const buffer = pink ? resources?.pinkBuffer : resources?.whiteBuffer;
  if (!buffer || typeof context?.createBufferSource !== 'function') return false;
  try {
    const src = context.createBufferSource();
    src.buffer = buffer;
    const gainNode = context.createGain();
    setParam(gainNode.gain, 0.0001, start);
    expRamp(gainNode.gain, clampGain(gain), start + Math.max(0.001, attack));
    expRamp(gainNode.gain, 0.0001, start + Math.max(0.012, duration));

    let head = src;
    if (typeof context.createBiquadFilter === 'function') {
      const filter = context.createBiquadFilter();
      filter.type = filterType;
      setParam(filter.frequency, Math.max(30, freq), start);
      if (Number.isFinite(freqEnd) && freqEnd > 20) {
        expRamp(filter.frequency, Math.max(25, freqEnd), start + duration);
      }
      if (filter.Q) setParam(filter.Q, Math.max(0.1, q), start);
      head.connect(filter);
      head = filter;
    }
    if (saturate) {
      const shaper = createSaturationNode(context, resources);
      if (shaper) {
        head.connect(shaper);
        head = shaper;
      }
    }
    head.connect(gainNode);
    gainNode.connect(dest);

    const maxOffset = Math.max(0, (buffer.duration || 1.2) - duration - 0.05);
    const offset = maxOffset > 0 ? Math.random() * maxOffset : 0;
    src.start(start, offset, duration + 0.02);
    return true;
  } catch {
    return false;
  }
}

export function playToneDrop(context, dest, {
  type = 'triangle',
  start,
  duration = 0.07,
  freq = 180,
  freqEnd = 60,
  gain = 0.08,
  attack = 0.002,
  filterFreq = 0,
} = {}) {
  if (typeof context?.createOscillator !== 'function') return false;
  try {
    const osc = context.createOscillator();
    osc.type = type;
    setParam(osc.frequency, Math.max(20, freq), start);
    if (Number.isFinite(freqEnd) && freqEnd > 18) {
      expRamp(osc.frequency, Math.max(18, freqEnd), start + Math.max(0.01, duration * 0.92));
    }

    const gainNode = context.createGain();
    setParam(gainNode.gain, 0.0001, start);
    expRamp(gainNode.gain, clampGain(gain), start + Math.max(0.001, attack));
    expRamp(gainNode.gain, 0.0001, start + Math.max(0.01, duration));

    let head = osc;
    if (filterFreq > 0 && typeof context.createBiquadFilter === 'function') {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      setParam(filter.frequency, filterFreq, start);
      head.connect(filter);
      head = filter;
    }
    head.connect(gainNode);
    gainNode.connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.015);
    return true;
  } catch {
    return false;
  }
}

function playClassNuance(context, dest, resources, classPath, start, scale) {
  if (!classPath) return;
  const g = scale;
  switch (classPath) {
    case 'assault':
      playToneDrop(context, dest, { type: 'sine', start, duration: 0.045, freq: 140, freqEnd: 52, gain: 0.028 * g });
      break;
    case 'engineer':
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.012, duration: 0.016, freq: 2550 * jitter(0.04), freqEnd: 1700, gain: 0.018 * g });
      break;
    case 'logistics':
      playToneDrop(context, dest, { type: 'sine', start: start + 0.008, duration: 0.012, freq: 3400, freqEnd: 2900, gain: 0.014 * g });
      break;
    case 'medic':
      playNoiseBurst(context, dest, resources, { start: start + 0.015, duration: 0.032, filterType: 'bandpass', freq: 950, freqEnd: 520, q: 2.2, gain: 0.016 * g });
      break;
    case 'recon':
      playNoiseBurst(context, dest, resources, { start, duration: 0.026, filterType: 'highpass', freq: 2600, q: 0.9, gain: 0.022 * g });
      break;
    case 'airDefense':
      playToneDrop(context, dest, { type: 'sine', start: start + 0.014, duration: 0.018, freq: 2900, freqEnd: 2300, gain: 0.016 * g });
      break;
  }
}

// Plays one realistic tactical weapon shot into `dest`.
export function synthesizeShot(context, dest, resources, {
  kind = 0,
  branch = null,
  classPath = null,
  level = 1,
  fx = null,
  start,
  scale = 1,
} = {}) {
  const s = clampGain(scale);
  const lvlBoost = 1 + Math.min(4, Math.max(0, (level || 1) - 1)) * 0.035;
  const g = s * lvlBoost;
  const p = jitter(0.06);

  // Chain arc (Twin Flak II, Chain perk, Engineer/Assault capstones)
  if (fx === 'chain') {
    playNoiseBurst(context, dest, resources, { start, duration: 0.042, filterType: 'bandpass', freq: 2450 * p, freqEnd: 1050, q: 1.9, gain: 0.045 * g });
    playToneDrop(context, dest, { type: 'triangle', start, duration: 0.032, freq: 520 * p, freqEnd: 190, gain: 0.028 * g });
    return;
  }

  if (kind === 1) {
    // Cannon: heavy breech blast + propellant roar + distant shell thud
    const siege = branch === 1;
    const rapid = branch === 0;
    const bodyDur = siege ? 0.28 : rapid ? 0.14 : 0.19;
    const tailDur = siege ? 0.34 : rapid ? 0.15 : 0.23;
    playToneDrop(context, dest, { type: 'sine', start, duration: bodyDur, freq: (siege ? 72 : rapid ? 102 : 88) * p, freqEnd: siege ? 22 : rapid ? 34 : 27, gain: (siege ? 0.14 : 0.115) * g });
    playToneDrop(context, dest, { type: 'triangle', start, duration: 0.06, freq: 165 * p, freqEnd: 52, gain: 0.065 * g, filterFreq: 420 });
    playNoiseBurst(context, dest, resources, { pink: true, start, duration: tailDur, filterType: 'lowpass', freq: (siege ? 440 : 580) * p, freqEnd: siege ? 90 : 130, q: 0.9, gain: (siege ? 0.135 : 0.105) * g, saturate: true });
    playNoiseBurst(context, dest, resources, { start, duration: 0.036, filterType: 'bandpass', freq: 1180 * p, freqEnd: 540, q: 1.2, gain: 0.055 * g });

    if (rapid) {
      // Autoloader breech clack
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.082, duration: 0.022, freq: 1120 * p, freqEnd: 680, gain: 0.024 * g });
    }
    if (fx === 'splash') {
      // Rapid Cannon III 6th-shot shrapnel burst
      playNoiseBurst(context, dest, resources, { pink: true, start: start + 0.075, duration: 0.16, filterType: 'bandpass', freq: 1350 * p, freqEnd: 360, q: 0.9, gain: 0.078 * g, saturate: true });
    } else {
      // Subtle distant shell impact thud
      const delay = siege ? 0.135 : 0.11;
      playNoiseBurst(context, dest, resources, { pink: true, start: start + delay, duration: 0.11, filterType: 'lowpass', freq: 270, freqEnd: 95, gain: (siege ? 0.065 : 0.042) * g });
      playToneDrop(context, dest, { type: 'sine', start: start + delay, duration: 0.09, freq: siege ? 58 : 70, freqEnd: 24, gain: (siege ? 0.06 : 0.036) * g });
    }
    playClassNuance(context, dest, resources, classPath, start, g);
    return;
  }

  if (kind === 2) {
    // Flak: hollow launch cough + high-altitude airburst crack(s)
    const twin = branch === 0;
    const longRange = branch === 1;
    playToneDrop(context, dest, { type: 'triangle', start, duration: 0.052, freq: (twin ? 240 : longRange ? 168 : 210) * p, freqEnd: longRange ? 64 : 88, gain: 0.052 * g, filterFreq: 680 });
    playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.048, filterType: 'bandpass', freq: 760 * p, freqEnd: 380, q: 1.4, gain: 0.046 * g });

    const burstDelay = twin ? 0.052 : longRange ? 0.084 : 0.068;
    playNoiseBurst(context, dest, resources, { start: start + burstDelay, duration: 0.058, filterType: 'bandpass', freq: (longRange ? 2250 : 1900) * p, freqEnd: 880, q: 1.7, gain: 0.064 * g, saturate: true });
    playNoiseBurst(context, dest, resources, { start: start + burstDelay + 0.008, duration: 0.042, filterType: 'highpass', freq: 3100, q: 0.8, gain: 0.028 * g });
    if (twin) {
      playNoiseBurst(context, dest, resources, { start: start + 0.094, duration: 0.048, filterType: 'bandpass', freq: 2080 * jitter(0.08), freqEnd: 940, q: 1.7, gain: 0.048 * g });
    }
    playClassNuance(context, dest, resources, classPath, start, g);
    return;
  }

  if (kind === 3) {
    // Sniper: supersonic whip-crack + punch + dry bolt-action cycle
    const marksman = branch === 0;
    const antiArmor = branch === 1;
    playNoiseBurst(context, dest, resources, { start, duration: antiArmor ? 0.095 : 0.058, filterType: 'bandpass', freq: (antiArmor ? 1900 : 2750) * p, freqEnd: antiArmor ? 420 : 860, q: 1.25, gain: (antiArmor ? 0.11 : 0.088) * g, saturate: true });
    playToneDrop(context, dest, { type: 'triangle', start, duration: antiArmor ? 0.105 : 0.052, freq: (antiArmor ? 112 : 152) * p, freqEnd: antiArmor ? 36 : 54, gain: (antiArmor ? 0.105 : 0.072) * g, filterFreq: 550 });
    if (antiArmor) {
      playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.12, filterType: 'lowpass', freq: 720, freqEnd: 160, gain: 0.075 * g, saturate: true });
    }
    if (fx === 'crit' || (marksman && fx === 'crit')) {
      // Armor-piercing steel strike ping (clean & metallic, not arcade)
      playToneDrop(context, dest, { type: 'sine', start: start + 0.016, duration: 0.075, freq: 1480 * p, freqEnd: 1080, gain: 0.045 * g });
      playNoiseBurst(context, dest, resources, { start: start + 0.014, duration: 0.04, filterType: 'highpass', freq: 3400, gain: 0.032 * g });
    }
    // Crisp dry bolt cycle
    const boltAt = start + (antiArmor ? 0.155 : 0.138);
    playToneDrop(context, dest, { type: 'triangle', start: boltAt, duration: 0.014, freq: (antiArmor ? 1380 : 2350) * p, freqEnd: 1100, gain: 0.02 * g });
    playClassNuance(context, dest, resources, classPath, start, g);
    return;
  }

  if (kind === 'hero') {
    if (fx === 'bunker') {
      // Bunker pillbox autocannon: resonant emplacement thump
      playToneDrop(context, dest, { type: 'triangle', start, duration: 0.082, freq: 138 * p, freqEnd: 46, gain: 0.088 * g, filterFreq: 480 });
      playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.085, filterType: 'bandpass', freq: 920 * p, freqEnd: 340, q: 1.1, gain: 0.072 * g, saturate: true });
      return;
    }
    // Soldier service rifle: tight, dry, personal combat snap
    playNoiseBurst(context, dest, resources, { start, duration: 0.044, filterType: 'bandpass', freq: 1580 * p, freqEnd: 760, q: 1.35, gain: 0.058 * g, saturate: true });
    playToneDrop(context, dest, { type: 'triangle', start, duration: 0.044, freq: 196 * p, freqEnd: 74, gain: 0.048 * g, filterFreq: 520 });
    playToneDrop(context, dest, { type: 'sine', start: start + 0.008, duration: 0.012, freq: 3050 * p, freqEnd: 2200, gain: 0.014 * g });
    return;
  }

  // Default / Tower 0 (MG Nest): dry LMG snap + branch variants
  const heavy = branch === 1;
  const twin = branch === 0;
  const veteran = branch === 2;
  const hunter = branch === 3;
  if (heavy) {
    // .50 cal tripod punch
    playToneDrop(context, dest, { type: 'triangle', start, duration: 0.068, freq: 128 * p, freqEnd: 48, gain: 0.072 * g, filterFreq: 460 });
    playNoiseBurst(context, dest, resources, { start, duration: 0.074, filterType: 'bandpass', freq: 980 * p, freqEnd: 460, q: 1.15, gain: 0.066 * g, saturate: true });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.03, duration: 0.014, freq: 1480 * p, freqEnd: 920, gain: 0.018 * g });
  } else {
    const center = twin ? 2050 : veteran ? 2220 : hunter ? 1620 : 1840;
    playNoiseBurst(context, dest, resources, { start, duration: 0.044, filterType: 'bandpass', freq: center * p, freqEnd: center * 0.5, q: 1.4, gain: 0.052 * g, saturate: true });
    playToneDrop(context, dest, { type: 'triangle', start, duration: 0.038, freq: (hunter ? 148 : 176) * p, freqEnd: hunter ? 54 : 68, gain: (hunter ? 0.054 : 0.042) * g, filterFreq: 500 });
    playToneDrop(context, dest, { type: 'sine', start: start + 0.006, duration: 0.01, freq: 3300 * p, freqEnd: 2400, gain: 0.013 * g });
    if (twin) {
      // Second barrel tight offset tap
      playNoiseBurst(context, dest, resources, { start: start + 0.028, duration: 0.036, filterType: 'bandpass', freq: center * 1.07 * p, freqEnd: center * 0.55, q: 1.45, gain: 0.034 * g });
    }
  }
  playClassNuance(context, dest, resources, classPath, start, g);
}

// Plays an enemy or boss destruction sound into `dest`.
export function synthesizeDeath(context, dest, resources, {
  kind = 'infantry',
  boss = false,
  start,
  scale = 1,
} = {}) {
  const s = clampGain(scale);
  const p = jitter(0.08);

  if (boss) {
    // Multi-stage heavy boss explosion: armor rupture + cook-offs + shockwave
    playToneDrop(context, dest, { type: 'sine', start, duration: 0.44, freq: 62 * p, freqEnd: 20, gain: 0.175 * s });
    playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.52, filterType: 'lowpass', freq: 560, freqEnd: 85, q: 0.85, gain: 0.165 * s, saturate: true });
    playNoiseBurst(context, dest, resources, { start, duration: 0.09, filterType: 'bandpass', freq: 1580, freqEnd: 420, q: 1.3, gain: 0.085 * s });
    // Secondary cook-off blasts
    playNoiseBurst(context, dest, resources, { pink: true, start: start + 0.095, duration: 0.22, filterType: 'bandpass', freq: 680, freqEnd: 160, gain: 0.105 * s, saturate: true });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.095, duration: 0.16, freq: 110, freqEnd: 30, gain: 0.09 * s });
    playNoiseBurst(context, dest, resources, { pink: true, start: start + 0.21, duration: 0.28, filterType: 'lowpass', freq: 480, freqEnd: 100, gain: 0.095 * s, saturate: true });
    return;
  }

  if (kind === 'tank') {
    // Heavy armor crunch + roaring hull detonation
    playToneDrop(context, dest, { type: 'triangle', start, duration: 0.065, freq: 235 * p, freqEnd: 58, gain: 0.082 * s, filterFreq: 750 });
    playNoiseBurst(context, dest, resources, { start, duration: 0.052, filterType: 'bandpass', freq: 1850 * p, freqEnd: 620, q: 1.8, gain: 0.058 * s });
    playToneDrop(context, dest, { type: 'sine', start: start + 0.01, duration: 0.28, freq: 72 * p, freqEnd: 24, gain: 0.125 * s });
    playNoiseBurst(context, dest, resources, { pink: true, start: start + 0.012, duration: 0.34, filterType: 'lowpass', freq: 480, freqEnd: 105, q: 0.9, gain: 0.12 * s, saturate: true });
    return;
  }

  if (kind === 'plane') {
    // Mid-air fuselage tear + descending turbine drop + fireball pop
    playNoiseBurst(context, dest, resources, { start, duration: 0.2, filterType: 'bandpass', freq: 980 * p, freqEnd: 220, q: 2.2, gain: 0.072 * s });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.04, duration: 0.19, freq: 130 * p, freqEnd: 40, gain: 0.092 * s, filterFreq: 480 });
    playNoiseBurst(context, dest, resources, { pink: true, start: start + 0.045, duration: 0.22, filterType: 'lowpass', freq: 860, freqEnd: 180, q: 0.9, gain: 0.096 * s, saturate: true });
    return;
  }

  // Infantry / Runner: subtle, dry, non-fatiguing tactical drop
  playToneDrop(context, dest, { type: 'sine', start, duration: 0.05, freq: 108 * p, freqEnd: 44, gain: 0.036 * s });
  playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.042, filterType: 'bandpass', freq: 880 * p, freqEnd: 380, q: 1.1, gain: 0.028 * s });
}

// Story setpiece / artillery barrage cue ('strike')
export function synthesizeStrike(context, dest, resources, { start, scale = 1 } = {}) {
  const s = clampGain(scale);
  playNoiseBurst(context, dest, resources, { start, duration: 0.14, filterType: 'bandpass', freq: 920, freqEnd: 280, q: 3.0, gain: 0.055 * s });
  const impactAt = start + 0.13;
  playToneDrop(context, dest, { type: 'sine', start: impactAt, duration: 0.34, freq: 76, freqEnd: 22, gain: 0.145 * s });
  playNoiseBurst(context, dest, resources, { pink: true, start: impactAt, duration: 0.38, filterType: 'lowpass', freq: 520, freqEnd: 95, q: 0.9, gain: 0.14 * s, saturate: true });
}

// Package 2: Construction, upgrades, dismantling, supplies, perks, sectors & bunker impact.
export function synthesizeBuild(context, dest, resources, { towerType = 0, start, scale = 1 } = {}) {
  const s = clampGain(scale);
  const p = jitter(0.05);
  // Sandbag / concrete pad anchor thump
  playToneDrop(context, dest, { type: 'sine', start, duration: 0.085, freq: 118 * p, freqEnd: 42, gain: 0.075 * s });
  playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.09, filterType: 'lowpass', freq: 440, freqEnd: 140, q: 0.9, gain: 0.064 * s });
  // Weapon mount latch & ratchet settle customized by tower class
  if (towerType === 1) {
    // Heavy cannon trunnion slam + breech lock
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.05, duration: 0.055, freq: 148 * p, freqEnd: 52, gain: 0.068 * s, filterFreq: 480 });
    playNoiseBurst(context, dest, resources, { start: start + 0.055, duration: 0.04, filterType: 'bandpass', freq: 1320 * p, freqEnd: 680, q: 1.8, gain: 0.042 * s });
  } else if (towerType === 2) {
    // AA Flak rotary gear twin-ratchet
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.045, duration: 0.02, freq: 1420 * p, freqEnd: 920, gain: 0.03 * s });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.085, duration: 0.022, freq: 1680 * p, freqEnd: 1120, gain: 0.032 * s });
  } else if (towerType === 3) {
    // Sniper precision tripod clamp & optic click
    playNoiseBurst(context, dest, resources, { start: start + 0.04, duration: 0.03, filterType: 'bandpass', freq: 2150 * p, freqEnd: 1200, q: 1.6, gain: 0.038 * s });
    playToneDrop(context, dest, { type: 'sine', start: start + 0.082, duration: 0.016, freq: 2450 * p, freqEnd: 1850, gain: 0.024 * s });
  } else {
    // MG nest steel tripod snap
    playNoiseBurst(context, dest, resources, { start: start + 0.042, duration: 0.036, filterType: 'bandpass', freq: 1750 * p, freqEnd: 880, q: 1.5, gain: 0.044 * s });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.08, duration: 0.024, freq: 980 * p, freqEnd: 640, gain: 0.028 * s });
  }
}

export function synthesizeUpgrade(context, dest, resources, { kind = 'upgrade', start, scale = 1 } = {}) {
  const s = clampGain(scale);
  const p = jitter(0.04);
  if (kind === 'classUpgrade') {
    // Class equipment attachment: buckle snap + crisp 2-tone tactical comm chirp
    playNoiseBurst(context, dest, resources, { start, duration: 0.032, filterType: 'bandpass', freq: 1850 * p, freqEnd: 920, q: 1.5, gain: 0.04 * s });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.035, duration: 0.055, freq: 540, freqEnd: 540, gain: 0.034 * s, filterFreq: 1800 });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.09, duration: 0.075, freq: 760, freqEnd: 760, gain: 0.038 * s, filterFreq: 2000 });
    return;
  }
  if (kind === 'prestige') {
    // Foundry stamp + heavy steel bolt + warm brass resolve
    playToneDrop(context, dest, { type: 'sine', start, duration: 0.14, freq: 102 * p, freqEnd: 34, gain: 0.09 * s });
    playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.11, filterType: 'lowpass', freq: 620, freqEnd: 180, gain: 0.068 * s, saturate: true });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.06, duration: 0.08, freq: 330, freqEnd: 330, gain: 0.034 * s, filterFreq: 1400 });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.13, duration: 0.13, freq: 495, freqEnd: 495, gain: 0.042 * s, filterFreq: 1500 });
    return;
  }
  if (kind === 'branch') {
    // Permanent specialization: pneumatic lock-in + twin steel pin + warm latch
    playNoiseBurst(context, dest, resources, { start, duration: 0.05, filterType: 'bandpass', freq: 1550 * p, freqEnd: 720, q: 1.4, gain: 0.044 * s });
    playToneDrop(context, dest, { type: 'sine', start: start + 0.04, duration: 0.075, freq: 140 * p, freqEnd: 58, gain: 0.064 * s });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.08, duration: 0.085, freq: 380, freqEnd: 480, gain: 0.034 * s, filterFreq: 1500 });
    return;
  }
  // Standard upgrade: two-stroke field wrench ratchet + lock clack
  playNoiseBurst(context, dest, resources, { start, duration: 0.026, filterType: 'bandpass', freq: 2100 * p, freqEnd: 1150, q: 1.7, gain: 0.036 * s });
  playNoiseBurst(context, dest, resources, { start: start + 0.052, duration: 0.032, filterType: 'bandpass', freq: 2350 * p, freqEnd: 1280, q: 1.8, gain: 0.04 * s });
  playToneDrop(context, dest, { type: 'triangle', start: start + 0.078, duration: 0.065, freq: 280, freqEnd: 360, gain: 0.034 * s, filterFreq: 1350 });
}

export function synthesizeSell(context, dest, resources, { start, scale = 1 } = {}) {
  const s = clampGain(scale);
  playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.075, filterType: 'bandpass', freq: 640, freqEnd: 240, q: 1.2, gain: 0.052 * s });
  playToneDrop(context, dest, { type: 'triangle', start, duration: 0.08, freq: 340, freqEnd: 135, gain: 0.042 * s, filterFreq: 950 });
  playToneDrop(context, dest, { type: 'sine', start: start + 0.07, duration: 0.05, freq: 1320, freqEnd: 980, gain: 0.028 * s });
}

export function synthesizeLoot(context, dest, resources, { bounty = false, start, scale = 1 } = {}) {
  const s = clampGain(scale);
  // Ammo crate latch snap + crate lid thud + brass/supply settle
  playNoiseBurst(context, dest, resources, { start, duration: 0.025, filterType: 'bandpass', freq: 2400, freqEnd: 1400, q: 1.7, gain: 0.036 * s });
  playToneDrop(context, dest, { type: 'sine', start: start + 0.024, duration: 0.06, freq: 145, freqEnd: 56, gain: 0.048 * s });
  playToneDrop(context, dest, { type: 'sine', start: start + 0.058, duration: 0.055, freq: bounty ? 1560 : 1240, freqEnd: bounty ? 1680 : 1180, gain: 0.03 * s });
  if (bounty) {
    playToneDrop(context, dest, { type: 'sine', start: start + 0.1, duration: 0.065, freq: 1860, freqEnd: 1720, gain: 0.028 * s });
  }
}

export function synthesizePerk(context, dest, resources, { start, scale = 1 } = {}) {
  const s = clampGain(scale);
  playToneDrop(context, dest, { type: 'sine', start, duration: 0.07, freq: 135, freqEnd: 52, gain: 0.062 * s });
  playNoiseBurst(context, dest, resources, { start, duration: 0.032, filterType: 'bandpass', freq: 1200, freqEnd: 520, q: 1.2, gain: 0.038 * s });
  playToneDrop(context, dest, { type: 'triangle', start: start + 0.045, duration: 0.09, freq: 350, freqEnd: 465, gain: 0.034 * s, filterFreq: 1400 });
}

export function synthesizeSector(context, dest, resources, { start, scale = 1 } = {}) {
  const s = clampGain(scale);
  // Armored convoy air-brake hiss + diesel gear drop + tactical relay chime
  playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.22, filterType: 'bandpass', freq: 980, freqEnd: 320, q: 1.1, gain: 0.058 * s });
  playToneDrop(context, dest, { type: 'sine', start: start + 0.03, duration: 0.22, freq: 88, freqEnd: 42, gain: 0.09 * s });
  playToneDrop(context, dest, { type: 'triangle', start: start + 0.16, duration: 0.08, freq: 440, freqEnd: 440, gain: 0.032 * s, filterFreq: 1600 });
  playToneDrop(context, dest, { type: 'triangle', start: start + 0.24, duration: 0.14, freq: 659, freqEnd: 659, gain: 0.038 * s, filterFreq: 1800 });
}

export function synthesizeHazard(context, dest, resources, { kind = 'ice', start, scale = 1 } = {}) {
  const s = clampGain(scale);
  if (kind === 'rubble') {
    // Crumbling concrete/masonry cascade settling cleanly
    playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.12, filterType: 'bandpass', freq: 720, freqEnd: 260, q: 1.1, gain: 0.075 * s, saturate: true });
    playNoiseBurst(context, dest, resources, { pink: true, start: start + 0.08, duration: 0.14, filterType: 'lowpass', freq: 460, freqEnd: 130, gain: 0.072 * s });
    playToneDrop(context, dest, { type: 'sine', start: start + 0.03, duration: 0.18, freq: 92, freqEnd: 32, gain: 0.082 * s });
    return;
  }
  // Thin ice fracture crackle + cold sub-surface groan
  playNoiseBurst(context, dest, resources, { start, duration: 0.048, filterType: 'highpass', freq: 2600, q: 1.1, gain: 0.058 * s });
  playNoiseBurst(context, dest, resources, { start: start + 0.038, duration: 0.055, filterType: 'bandpass', freq: 3400, freqEnd: 1400, q: 1.5, gain: 0.052 * s });
  playToneDrop(context, dest, { type: 'sine', start: start + 0.02, duration: 0.24, freq: 145, freqEnd: 42, gain: 0.088 * s });
  playNoiseBurst(context, dest, resources, { pink: true, start: start + 0.06, duration: 0.24, filterType: 'lowpass', freq: 420, freqEnd: 110, gain: 0.074 * s });
}

export function synthesizeBunkerImpact(context, dest, resources, { start, scale = 1 } = {}) {
  const s = clampGain(scale);
  // Concrete & steel bunker strike + subtle inward shudder
  playToneDrop(context, dest, { type: 'sine', start, duration: 0.24, freq: 86, freqEnd: 26, gain: 0.125 * s });
  playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.26, filterType: 'lowpass', freq: 420, freqEnd: 90, q: 0.9, gain: 0.115 * s, saturate: true });
  playToneDrop(context, dest, { type: 'triangle', start: start + 0.015, duration: 0.09, freq: 195, freqEnd: 78, gain: 0.048 * s, filterFreq: 520 });
}

// Package 3: Class active abilities, combos & boss spawns/telegraphs/abilities.
export function synthesizeAbility(context, dest, resources, { classId = 'assault', variant = 0, start, scale = 1 } = {}) {
  const s = clampGain(scale);
  switch (classId) {
    case 'engineer': {
      // Pneumatic relay clunk + turbo overdrive spin-up
      playToneDrop(context, dest, { type: 'sine', start, duration: 0.06, freq: 130, freqEnd: 65, gain: 0.065 * s });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.03, duration: 0.22, freq: 190, freqEnd: variant === 2 ? 780 : 620, gain: 0.048 * s, filterFreq: 1600 });
      playNoiseBurst(context, dest, resources, { start: start + 0.04, duration: 0.19, filterType: 'bandpass', freq: 1100, freqEnd: 2400, q: 1.8, gain: 0.04 * s });
      break;
    }
    case 'logistics': {
      // Radio drop flare pop + supply pallet impact
      playToneDrop(context, dest, { type: 'sine', start, duration: 0.03, freq: 1180, freqEnd: 1420, gain: 0.03 * s });
      playNoiseBurst(context, dest, resources, { start: start + 0.04, duration: 0.075, filterType: 'bandpass', freq: 1600, freqEnd: 720, q: 1.4, gain: 0.042 * s });
      playToneDrop(context, dest, { type: 'sine', start: start + 0.12, duration: 0.14, freq: 115, freqEnd: 38, gain: 0.09 * s });
      playNoiseBurst(context, dest, resources, { pink: true, start: start + 0.12, duration: 0.15, filterType: 'lowpass', freq: 440, freqEnd: 120, gain: 0.075 * s });
      break;
    }
    case 'medic': {
      // Pressurized repair seal + dual armor weld rivets
      playNoiseBurst(context, dest, resources, { start, duration: 0.18, filterType: 'bandpass', freq: 2300, freqEnd: 1150, q: 1.5, gain: 0.044 * s });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.055, duration: 0.055, freq: 380, freqEnd: 210, gain: 0.04 * s, filterFreq: 1100 });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.125, duration: 0.065, freq: 480, freqEnd: 320, gain: 0.038 * s, filterFreq: 1200 });
      break;
    }
    case 'recon': {
      // Laser rangefinder double lock + suppression flare whistle
      playToneDrop(context, dest, { type: 'sine', start, duration: 0.025, freq: 1680, freqEnd: 1680, gain: 0.03 * s });
      playToneDrop(context, dest, { type: 'sine', start: start + 0.045, duration: 0.028, freq: 2120, freqEnd: 2120, gain: 0.032 * s });
      playNoiseBurst(context, dest, resources, { start: start + 0.07, duration: 0.17, filterType: 'bandpass', freq: 1450, freqEnd: 520, q: 2.2, gain: 0.048 * s });
      break;
    }
    case 'airDefense': {
      // Radar lock double sweep + SAM/AA rocket ignition whoosh
      playToneDrop(context, dest, { type: 'sine', start, duration: 0.04, freq: 1320, freqEnd: 1760, gain: 0.032 * s });
      playNoiseBurst(context, dest, resources, { start: start + 0.045, duration: 0.24, filterType: 'bandpass', freq: 1250, freqEnd: 2450, q: 1.2, gain: 0.072 * s, saturate: true });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.05, duration: 0.18, freq: 210, freqEnd: 88, gain: 0.064 * s, filterFreq: 750 });
      break;
    }
    case 'assault':
    default: {
      // Incoming artillery whistle -> heavy tactical detonation
      const heavy = variant === 2;
      playNoiseBurst(context, dest, resources, { start, duration: 0.13, filterType: 'bandpass', freq: 1050, freqEnd: 340, q: 3.1, gain: 0.05 * s });
      const hitAt = start + 0.12;
      playToneDrop(context, dest, { type: 'sine', start: hitAt, duration: heavy ? 0.36 : 0.28, freq: heavy ? 68 : 82, freqEnd: 22, gain: (heavy ? 0.15 : 0.125) * s });
      playNoiseBurst(context, dest, resources, { pink: true, start: hitAt, duration: heavy ? 0.4 : 0.32, filterType: 'lowpass', freq: 560, freqEnd: 95, q: 0.9, gain: (heavy ? 0.14 : 0.12) * s, saturate: true });
      break;
    }
  }
}

export function synthesizeCombo(context, dest, resources, { start, scale = 1 } = {}) {
  const s = clampGain(scale);
  playNoiseBurst(context, dest, resources, { start, duration: 0.035, filterType: 'bandpass', freq: 1950, freqEnd: 980, q: 1.5, gain: 0.038 * s });
  playToneDrop(context, dest, { type: 'triangle', start: start + 0.015, duration: 0.08, freq: 440, freqEnd: 440, gain: 0.036 * s, filterFreq: 1700 });
  playToneDrop(context, dest, { type: 'triangle', start: start + 0.09, duration: 0.12, freq: 659, freqEnd: 659, gain: 0.044 * s, filterFreq: 1900 });
}

export function synthesizeBossEvent(context, dest, resources, { kind = 'boss', ability = null, start, scale = 1 } = {}) {
  const s = clampGain(scale);
  if (kind === 'warning') {
    // Two-pulse mechanical radar klaxon (urgent without ear fatigue)
    playToneDrop(context, dest, { type: 'triangle', start, duration: 0.07, freq: 470, freqEnd: 390, gain: 0.046 * s, filterFreq: 1400 });
    playToneDrop(context, dest, { type: 'triangle', start: start + 0.105, duration: 0.075, freq: 470, freqEnd: 380, gain: 0.048 * s, filterFreq: 1400 });
    return;
  }
  if (kind === 'bossAbility') {
    if (ability === 'interceptors') {
      playNoiseBurst(context, dest, resources, { start, duration: 0.22, filterType: 'bandpass', freq: 420, freqEnd: 2100, q: 1.6, gain: 0.062 * s });
      return;
    }
    if (ability === 'flood') {
      playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.28, filterType: 'lowpass', freq: 680, freqEnd: 180, q: 1.0, gain: 0.075 * s });
      return;
    }
    if (ability === 'repair') {
      playNoiseBurst(context, dest, resources, { start, duration: 0.14, filterType: 'bandpass', freq: 2200, freqEnd: 1100, q: 1.8, gain: 0.04 * s });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.06, duration: 0.07, freq: 240, freqEnd: 120, gain: 0.045 * s });
      return;
    }
    // Armor drop / phase shift bulkhead clank
    playToneDrop(context, dest, { type: 'sine', start, duration: 0.18, freq: 96, freqEnd: 34, gain: 0.088 * s });
    playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.16, filterType: 'lowpass', freq: 440, freqEnd: 120, gain: 0.07 * s, saturate: true });
    return;
  }
  // Boss wave / Boss spawn: deep diesel warhorn + armored tread rumble
  playToneDrop(context, dest, { type: 'triangle', start, duration: 0.36, freq: 92, freqEnd: 78, gain: 0.078 * s, filterFreq: 380 });
  playToneDrop(context, dest, { type: 'sine', start, duration: 0.4, freq: 62, freqEnd: 48, gain: 0.095 * s });
  playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.38, filterType: 'lowpass', freq: 260, freqEnd: 75, q: 0.9, gain: 0.085 * s, saturate: true });
}

// Package 4: Wave lifecycle, radio/co-op comms & restrained tactical UI clicks.
export function synthesizeCommandCue(context, dest, resources, { kind = 'wave', start, scale = 1 } = {}) {
  const s = clampGain(scale);
  switch (kind) {
    case 'wave':
      playNoiseBurst(context, dest, resources, { start, duration: 0.032, filterType: 'bandpass', freq: 1450, freqEnd: 720, q: 1.3, gain: 0.036 * s });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.02, duration: 0.14, freq: 220, freqEnd: 294, gain: 0.046 * s, filterFreq: 950 });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.14, duration: 0.16, freq: 330, freqEnd: 330, gain: 0.042 * s, filterFreq: 1100 });
      break;
    case 'clear':
      playNoiseBurst(context, dest, resources, { start, duration: 0.022, filterType: 'bandpass', freq: 2100, freqEnd: 1400, q: 1.8, gain: 0.024 * s });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.02, duration: 0.085, freq: 440, freqEnd: 440, gain: 0.036 * s, filterFreq: 1600 });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.105, duration: 0.14, freq: 587, freqEnd: 587, gain: 0.04 * s, filterFreq: 1700 });
      break;
    case 'victory':
      playToneDrop(context, dest, { type: 'sine', start, duration: 0.16, freq: 110, freqEnd: 48, gain: 0.075 * s });
      playToneDrop(context, dest, { type: 'triangle', start, duration: 0.11, freq: 330, freqEnd: 330, gain: 0.038 * s, filterFreq: 1500 });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.105, duration: 0.11, freq: 440, freqEnd: 440, gain: 0.04 * s, filterFreq: 1600 });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.21, duration: 0.22, freq: 659, freqEnd: 659, gain: 0.046 * s, filterFreq: 1850 });
      break;
    case 'defeat':
      playNoiseBurst(context, dest, resources, { pink: true, start, duration: 0.34, filterType: 'lowpass', freq: 480, freqEnd: 95, gain: 0.075 * s });
      playToneDrop(context, dest, { type: 'triangle', start, duration: 0.14, freq: 220, freqEnd: 185, gain: 0.044 * s, filterFreq: 800 });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.14, duration: 0.22, freq: 165, freqEnd: 98, gain: 0.046 * s, filterFreq: 680 });
      break;
    case 'request':
      // VHF military radio squelch + crisp two-tone ping
      playNoiseBurst(context, dest, resources, { start, duration: 0.024, filterType: 'bandpass', freq: 2200, q: 1.5, gain: 0.026 * s });
      playToneDrop(context, dest, { type: 'sine', start: start + 0.015, duration: 0.032, freq: 980, freqEnd: 980, gain: 0.026 * s });
      playToneDrop(context, dest, { type: 'sine', start: start + 0.055, duration: 0.042, freq: 1240, freqEnd: 1240, gain: 0.028 * s });
      break;
    case 'reconnect':
      playNoiseBurst(context, dest, resources, { start, duration: 0.02, filterType: 'bandpass', freq: 1950, q: 1.5, gain: 0.022 * s });
      playToneDrop(context, dest, { type: 'sine', start: start + 0.015, duration: 0.045, freq: 760, freqEnd: 1020, gain: 0.028 * s });
      break;
    case 'abilityReady':
      playToneDrop(context, dest, { type: 'sine', start, duration: 0.022, freq: 1760, freqEnd: 1480, gain: 0.02 * s });
      break;
    case 'uiClick':
      playNoiseBurst(context, dest, resources, { start, duration: 0.014, filterType: 'bandpass', freq: 2300, q: 1.8, gain: 0.022 * s });
      break;
    case 'uiCraft':
      playNoiseBurst(context, dest, resources, { start, duration: 0.024, filterType: 'bandpass', freq: 1900, freqEnd: 950, q: 1.5, gain: 0.032 * s });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.02, duration: 0.045, freq: 520, freqEnd: 340, gain: 0.028 * s, filterFreq: 1300 });
      break;
    case 'uiEquip':
    case 'uiConfirm':
      playNoiseBurst(context, dest, resources, { start, duration: 0.022, filterType: 'bandpass', freq: 1700, freqEnd: 900, q: 1.4, gain: 0.026 * s });
      playToneDrop(context, dest, { type: 'triangle', start: start + 0.018, duration: 0.055, freq: 440, freqEnd: 580, gain: 0.028 * s, filterFreq: 1400 });
      break;
    case 'uiError':
      playToneDrop(context, dest, { type: 'sine', start, duration: 0.045, freq: 155, freqEnd: 110, gain: 0.034 * s });
      playToneDrop(context, dest, { type: 'sine', start: start + 0.06, duration: 0.055, freq: 135, freqEnd: 95, gain: 0.034 * s });
      break;
  }
}
