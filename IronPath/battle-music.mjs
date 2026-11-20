// Warm, restrained procedural Web Audio tactical score, stereo delay/reverb,
// and seamless ambient weather beds for Iron Path. Zero external audio files;
// strictly opt-in behind user gesture with lazy Web Audio allocation.

export const MUSIC_PHASES = Object.freeze(['silent', 'menu', 'prep', 'wave', 'boss']);
export const WEATHER_BEDS = Object.freeze(['rain', 'wind', 'arctic']);

const NOTE = Object.freeze({
  D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81,
  D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63,
  D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25,
  D5: 587.33,
});

// All four phases share coherent D Natural Minor / Dorian voice leading (32-step
// 4-bar phrases) with deliberate rests so combat SFX & General Vance radio lead.
const PHASE_PATTERNS = Object.freeze({
  menu: Object.freeze({
    stepSec: 0.62,
    steps: 32,
    // Dm9 -> Fmaj7 -> Gm7 -> Am7
    bass: [
      NOTE.D2, 0, 0, 0, 0, 0, 0, 0,
      NOTE.F2, 0, 0, 0, 0, 0, 0, 0,
      NOTE.G2, 0, 0, 0, 0, 0, 0, 0,
      NOTE.A2, 0, 0, 0, 0, 0, 0, 0,
    ],
    lead: [
      NOTE.A4, 0, 0, NOTE.F4, 0, 0, NOTE.E4, 0,
      0, 0, NOTE.C4, 0, NOTE.E4, 0, 0, 0,
      NOTE.D4, 0, 0, NOTE.G4, 0, 0, NOTE.F4, 0,
      NOTE.E4, 0, 0, 0, 0, 0, NOTE.C4, 0,
    ],
    chords: [
      [NOTE.D3, NOTE.A3, NOTE.E4],
      [NOTE.F3, NOTE.C4, NOTE.A4],
      [NOTE.G3, NOTE.D4, NOTE.Bb4],
      [NOTE.A3, NOTE.E4, NOTE.G4],
    ],
    drum: [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
    ],
    padGain: 0.032,
    leadGain: 0.044,
    bassGain: 0.075,
    leadFilterHz: 1150,
    bassFilterHz: 240,
    playWeather: false,
  }),
  prep: Object.freeze({
    stepSec: 0.44,
    steps: 32,
    // Dm7 -> Fmaj7 -> Gm7 -> Am7
    bass: [
      NOTE.D2, 0, 0, 0, NOTE.D2, 0, 0, 0,
      NOTE.F2, 0, 0, 0, NOTE.F2, 0, 0, 0,
      NOTE.G2, 0, 0, 0, NOTE.G2, 0, 0, 0,
      NOTE.A2, 0, 0, 0, NOTE.A2, 0, 0, 0,
    ],
    lead: [
      NOTE.D4, 0, NOTE.A3, 0, NOTE.F4, 0, 0, 0,
      NOTE.E4, 0, NOTE.C4, 0, NOTE.A4, 0, 0, 0,
      NOTE.G4, 0, NOTE.D4, 0, NOTE.Bb4, 0, NOTE.A4, 0,
      NOTE.E4, 0, 0, NOTE.C4, NOTE.D4, 0, 0, 0,
    ],
    chords: [
      [NOTE.D3, NOTE.A3, NOTE.F4],
      [NOTE.F3, NOTE.C4, NOTE.E4],
      [NOTE.G3, NOTE.D4, NOTE.Bb3],
      [NOTE.A3, NOTE.E4, NOTE.G4],
    ],
    drum: [
      1, 0, 0, 0, 2, 0, 0, 0,
      1, 0, 0, 0, 2, 0, 0, 0,
      1, 0, 0, 0, 2, 0, 0, 0,
      1, 0, 0, 0, 2, 0, 2, 0,
    ],
    padGain: 0.034,
    leadGain: 0.046,
    bassGain: 0.088,
    leadFilterHz: 1280,
    bassFilterHz: 280,
    playWeather: true,
  }),
  wave: Object.freeze({
    stepSec: 0.28,
    steps: 32,
    // Dm -> Bb -> Gm7 -> Am7 (clean tactical motion without buzz)
    bass: [
      NOTE.D2, 0, NOTE.D2, 0, NOTE.D2, 0, NOTE.A2, 0,
      NOTE.Bb2, 0, NOTE.Bb2, 0, NOTE.F2, 0, NOTE.Bb2, 0,
      NOTE.G2, 0, NOTE.G2, 0, NOTE.G2, 0, NOTE.D2, 0,
      NOTE.A2, 0, NOTE.A2, 0, NOTE.C3, 0, NOTE.A2, 0,
    ],
    lead: [
      NOTE.D4, 0, NOTE.F4, 0, NOTE.A4, 0, 0, 0,
      NOTE.F4, 0, NOTE.D4, 0, NOTE.F4, 0, 0, 0,
      NOTE.G4, 0, NOTE.Bb4, 0, NOTE.A4, 0, NOTE.G4, 0,
      NOTE.E4, 0, NOTE.G4, 0, NOTE.E4, 0, 0, 0,
    ],
    chords: [
      [NOTE.D3, NOTE.A3, NOTE.F4],
      [NOTE.F3, NOTE.Bb3, NOTE.D4],
      [NOTE.G3, NOTE.D4, NOTE.Bb3],
      [NOTE.A3, NOTE.E4, NOTE.G4],
    ],
    drum: [
      1, 0, 2, 0, 1, 0, 2, 0,
      1, 0, 2, 0, 1, 0, 2, 0,
      1, 0, 2, 0, 1, 0, 2, 0,
      1, 0, 2, 0, 1, 2, 2, 0,
    ],
    padGain: 0.038,
    leadGain: 0.052,
    bassGain: 0.11,
    leadFilterHz: 1420,
    bassFilterHz: 330,
    playWeather: true,
  }),
  boss: Object.freeze({
    stepSec: 0.24,
    steps: 32,
    // Dm -> Bb -> Gm / C -> Asus4 (strictly consonant heroic drive)
    bass: [
      NOTE.D2, NOTE.D2, 0, NOTE.D2, NOTE.A2, 0, NOTE.D2, 0,
      NOTE.Bb2, NOTE.Bb2, 0, NOTE.Bb2, NOTE.F2, 0, NOTE.Bb2, 0,
      NOTE.G2, NOTE.G2, 0, NOTE.G2, NOTE.C3, 0, NOTE.C3, 0,
      NOTE.A2, NOTE.A2, 0, NOTE.A2, NOTE.G2, 0, NOTE.A2, 0,
    ],
    lead: [
      NOTE.D4, 0, NOTE.A4, 0, NOTE.F4, 0, NOTE.E4, 0,
      NOTE.D4, 0, NOTE.Bb4, 0, NOTE.A4, 0, NOTE.F4, 0,
      NOTE.G4, 0, NOTE.D5, 0, NOTE.C5, 0, NOTE.G4, 0,
      NOTE.A4, 0, NOTE.G4, 0, NOTE.E4, 0, NOTE.A3, 0,
    ],
    chords: [
      [NOTE.D3, NOTE.A3, NOTE.D4],
      [NOTE.F3, NOTE.Bb3, NOTE.D4],
      [NOTE.G3, NOTE.D4, NOTE.C4],
      [NOTE.A3, NOTE.D4, NOTE.E4],
    ],
    drum: [
      1, 0, 2, 0, 1, 0, 2, 2,
      1, 0, 2, 0, 1, 0, 2, 0,
      1, 0, 2, 0, 1, 0, 2, 2,
      1, 0, 2, 1, 1, 2, 2, 0,
    ],
    padGain: 0.044,
    leadGain: 0.058,
    bassGain: 0.125,
    leadFilterHz: 1580,
    bassFilterHz: 380,
    playWeather: true,
  }),
});

export function weatherForScene({ storyWeather = null, theme = null } = {}) {
  if (storyWeather === 'rain' || theme === 'marsh') return 'rain';
  if (storyWeather === 'snow' || theme === 'arctic') return 'arctic';
  if (storyWeather === 'mist' || storyWeather === 'embers' || theme === 'scrub' || theme === 'urban' || theme === 'forest') {
    return 'wind';
  }
  return 'wind';
}

function setParam(param, value, time = 0) {
  if (!param) return;
  if (typeof param.setValueAtTime === 'function') param.setValueAtTime(value, time);
  else param.value = value;
}

function initZeroGain(context, start = 0) {
  const g = context.createGain();
  if (g?.gain) g.gain.value = 0.0001;
  setParam(g?.gain, 0.0001, start);
  return g;
}

function rampParam(param, target, now, tau = 0.22) {
  if (!param) return;
  if (typeof param.setTargetAtTime === 'function') param.setTargetAtTime(target, now, tau);
  else if (typeof param.linearRampToValueAtTime === 'function') param.linearRampToValueAtTime(target, now + tau * 2.5);
  else if (typeof param.setValueAtTime === 'function') param.setValueAtTime(target, now);
  else param.value = target;
}

function expParam(param, target, time) {
  if (!param) return;
  const safe = Math.max(0.0001, target);
  if (typeof param.exponentialRampToValueAtTime === 'function') param.exponentialRampToValueAtTime(safe, time);
  else if (typeof param.setValueAtTime === 'function') param.setValueAtTime(safe, time);
  else param.value = safe;
}

function linearParam(param, target, time) {
  if (!param) return;
  if (typeof param.linearRampToValueAtTime === 'function') param.linearRampToValueAtTime(target, time);
  else if (typeof param.setValueAtTime === 'function') param.setValueAtTime(target, time);
  else param.value = target;
}

// Smooth warm hall impulse with pre-delay fade-in and dark high-frequency rolloff
// so Web Audio ConvolverNode never rings metallically.
function makeRoomImpulse(context, durationSec = 1.6) {
  if (!context || typeof context.createBuffer !== 'function') return null;
  const sampleRate = Number.isFinite(context.sampleRate) && context.sampleRate > 0 ? context.sampleRate : 44100;
  const length = Math.max(2048, Math.floor(sampleRate * durationSec));
  const fadeSamples = Math.max(128, Math.floor(sampleRate * 0.035));
  const buffer = context.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp1 = 0;
    let lp2 = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const fadeIn = i < fadeSamples ? Math.sin((i / fadeSamples) * Math.PI * 0.5) : 1;
      const decay = Math.pow(1 - t, 3.4);
      const n = (Math.random() * 2 - 1) * fadeIn * decay;
      lp1 = lp1 * 0.78 + n * 0.22;
      lp2 = lp2 * 0.72 + lp1 * 0.28;
      data[i] = lp2 * (ch === 0 ? 0.55 : 0.53);
    }
  }
  return buffer;
}

// Seamless crossfaded pink noise so 4-second weather loops never click at wrap.
function makeWeatherNoise(context, seconds = 4.0) {
  if (!context || typeof context.createBuffer !== 'function') return null;
  const sampleRate = Number.isFinite(context.sampleRate) && context.sampleRate > 0 ? context.sampleRate : 44100;
  const length = Math.max(2048, Math.floor(sampleRate * seconds));
  const xfade = Math.max(256, Math.floor(length * 0.1));
  const raw = new Float32Array(length + xfade);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < raw.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + w * 0.029;
    b1 = 0.985 * b1 + w * 0.032;
    b2 = 0.950 * b2 + w * 0.048;
    raw[i] = b0 + b1 + b2 + w * 0.04;
  }
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let peak = 0.001;
  for (let i = 0; i < length; i++) {
    let s = raw[i];
    if (i < xfade) {
      const t = i / xfade;
      const a = Math.sin(t * Math.PI * 0.5);
      const b = Math.cos(t * Math.PI * 0.5);
      s = s * a + raw[length + i] * b;
    }
    data[i] = s;
    if (Math.abs(s) > peak) peak = Math.abs(s);
  }
  // Smooth the final wrap sample pair over a short 16-sample bridge so loop wrap has zero step discontinuity.
  const bridge = Math.min(16, Math.floor(xfade / 4));
  const halfStep = (data[0] - data[length - 1]) * 0.5;
  for (let k = 0; k < bridge; k++) {
    const rightIdx = k;
    const leftIdx = length - bridge + k;
    data[leftIdx] += halfStep * ((k + 1) / bridge);
    data[rightIdx] -= halfStep * ((bridge - k) / bridge);
    peak = Math.max(peak, Math.abs(data[leftIdx]), Math.abs(data[rightIdx]));
  }
  const scale = 0.7 / peak;
  for (let i = 0; i < length; i++) data[i] *= scale;
  return buffer;
}

export function createBattleMusic({ context, destination, getResources = null } = {}) {
  let enabled = false;
  let paused = false;
  let phase = 'silent';
  let weather = null;
  let weatherEffects = true;
  let graph = null;
  let roomBuffer = null;
  let weatherBuffer = null;
  let stepTimer = null;
  let nextStepAt = 0;
  let stepIndex = 0;
  let disposed = false;

  function clearScheduler() {
    if (stepTimer !== null) {
      clearInterval(stepTimer);
      stepTimer = null;
    }
  }

  function ensureGraph() {
    if (graph || !context || !destination || disposed) return graph;
    try {
      const musicOut = context.createGain();
      const now = context.currentTime || 0;
      setParam(musicOut.gain, enabled && !paused && phase !== 'silent' ? 1 : 0.0001, now);
      musicOut.connect(destination);

      let roomSend = null;
      let convolver = null;
      if (typeof context.createConvolver === 'function' && typeof context.createBuffer === 'function') {
        try {
          roomBuffer ??= makeRoomImpulse(context, 1.6);
          if (roomBuffer) {
            convolver = context.createConvolver();
            convolver.buffer = roomBuffer;
            roomSend = context.createGain();
            // Gentle, non-muddy reverb return
            setParam(roomSend.gain, 0.14, now);
            roomSend.connect(convolver);
            convolver.connect(musicOut);
          }
        } catch {
          roomSend = null;
          convolver = null;
        }
      }

      // Warm damped echo delay for delicate melodic plucks (when supported by context)
      let delaySend = null;
      let delayNode = null;
      let delayFb = null;
      if (typeof context.createDelay === 'function') {
        try {
          delayNode = context.createDelay(1.0);
          delayNode.delayTime.value = 0.36;
          delayFb = context.createGain();
          setParam(delayFb.gain, 0.24, now);
          const tone = typeof context.createBiquadFilter === 'function' ? context.createBiquadFilter() : null;
          if (tone) {
            tone.type = 'lowpass';
            setParam(tone.frequency, 1100, now);
            delayNode.connect(tone);
            tone.connect(delayFb);
            tone.connect(musicOut);
          } else {
            delayNode.connect(delayFb);
            delayNode.connect(musicOut);
          }
          delayFb.connect(delayNode);
          delaySend = context.createGain();
          setParam(delaySend.gain, 0.16, now);
          delaySend.connect(delayNode);
        } catch {
          delaySend = null;
          delayNode = null;
          delayFb = null;
        }
      }

      // Dedicated seamless crossfaded 4s noise buffer for looping weather beds;
      // short weapon pinkBuffer stays separate so weather never clicks at loop wrap.
      const weatherGains = {};
      let weatherSource = null;
      if (typeof context.createBufferSource === 'function' && typeof context.createBiquadFilter === 'function') {
        try {
          weatherBuffer ??= makeWeatherNoise(context, 4.0);
          if (weatherBuffer) {
            weatherSource = context.createBufferSource();
            weatherSource.buffer = weatherBuffer;
            weatherSource.loop = true;

            // Gentle low-Q shaping (<= 0.707) prevents any pitched whistling resonance
            const specs = {
              rain: { type: 'bandpass', freq: 2100, q: 0.45 },
              wind: { type: 'lowpass', freq: 260, q: 0.5 },
              arctic: { type: 'bandpass', freq: 680, q: 0.55 },
            };
            for (const bed of WEATHER_BEDS) {
              const filter = context.createBiquadFilter();
              filter.type = specs[bed].type;
              setParam(filter.frequency, specs[bed].freq, now);
              setParam(filter.Q, specs[bed].q, now);
              const gain = context.createGain();
              setParam(gain.gain, 0.0001, now);
              weatherSource.connect(filter);
              filter.connect(gain);
              gain.connect(musicOut);
              weatherGains[bed] = gain;
            }
            weatherSource.start(now);
          }
        } catch {
          weatherSource = null;
        }
      }

      const drumBuffer = getResources?.()?.pinkBuffer || weatherBuffer;
      graph = { musicOut, roomSend, delaySend, delayNode, delayFb, convolver, weatherSource, weatherGains, drumBuffer };
    } catch {
      graph = null;
    }
    return graph;
  }

  function syncWeatherMix() {
    if (!graph?.weatherGains || !context) return;
    const now = context.currentTime || 0;
    const pattern = PHASE_PATTERNS[phase];
    const weatherActive = enabled && !paused && phase !== 'silent' && !!pattern?.playWeather && weatherEffects && !!weather;
    // Subtle, non-fatiguing atmospheric whisper beds
    const bedTarget = { rain: 0.018, wind: 0.024, arctic: 0.018 };
    for (const bed of WEATHER_BEDS) {
      const gainNode = graph.weatherGains[bed];
      if (!gainNode) continue;
      const target = weatherActive && weather === bed ? bedTarget[bed] : 0.0001;
      rampParam(gainNode.gain, target, now, 0.55);
    }
  }

  function syncMasterMix() {
    if (!graph?.musicOut || !context) return;
    const now = context.currentTime || 0;
    const active = enabled && !paused && phase !== 'silent';
    rampParam(graph.musicOut.gain, active ? 1 : 0.0001, now, active ? 0.35 : 0.16);
    syncWeatherMix();
  }

  // Smooth warm sub-bass: sine fundamental + soft filtered triangle warmth
  function triggerBass(freq, start, dur, peak, filterHz) {
    if (!graph?.musicOut || !context || !Number.isFinite(freq) || freq <= 0) return;
    const sub = context.createOscillator();
    const warm = context.createOscillator();
    const subMix = context.createGain();
    const warmMix = context.createGain();
    const env = initZeroGain(context, start);

    sub.type = 'sine';
    warm.type = 'triangle';
    setParam(sub.frequency, freq, start);
    setParam(warm.frequency, freq, start);
    setParam(subMix.gain, 0.72, start);
    setParam(warmMix.gain, 0.28, start);

    const attackEnd = start + 0.018;
    const sustainEnd = Math.max(attackEnd + 0.02, start + dur * 0.65);
    const releaseEnd = start + dur;

    linearParam(env.gain, peak, attackEnd);
    linearParam(env.gain, peak * 0.75, sustainEnd);
    expParam(env.gain, 0.0001, releaseEnd);

    sub.connect(subMix);
    warm.connect(warmMix);

    if (typeof context.createBiquadFilter === 'function') {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      setParam(filter.frequency, Math.min(420, filterHz), start);
      filter.Q.value = 0.65;
      subMix.connect(filter);
      warmMix.connect(filter);
      filter.connect(env);
    } else {
      subMix.connect(env);
      warmMix.connect(env);
    }

    env.connect(graph.musicOut);
    sub.start(start);
    warm.start(start);
    sub.stop(releaseEnd + 0.03);
    warm.stop(releaseEnd + 0.03);
  }

  // Soft electric-felt / bell pluck with subtle octave shimmer & warm decay
  function triggerPluck(freq, start, dur, peak, filterHz) {
    if (!graph?.musicOut || !context || !Number.isFinite(freq) || freq <= 0) return;
    const body = context.createOscillator();
    const chime = context.createOscillator();
    const bodyMix = context.createGain();
    const chimeMix = context.createGain();
    const env = initZeroGain(context, start);

    body.type = 'triangle';
    chime.type = 'sine';
    setParam(body.frequency, freq, start);
    setParam(chime.frequency, freq * 2, start);
    setParam(bodyMix.gain, 0.84, start);
    setParam(chimeMix.gain, 0.16, start);

    const attackEnd = start + 0.014;
    const releaseEnd = start + dur;

    linearParam(env.gain, peak, attackEnd);
    expParam(env.gain, 0.0001, releaseEnd);

    body.connect(bodyMix);
    chime.connect(chimeMix);

    if (typeof context.createBiquadFilter === 'function') {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      setParam(filter.frequency, filterHz, start);
      expParam(filter.frequency, Math.max(380, filterHz * 0.4), releaseEnd);
      filter.Q.value = 0.7;
      bodyMix.connect(filter);
      chimeMix.connect(filter);
      filter.connect(env);
    } else {
      bodyMix.connect(env);
      chimeMix.connect(env);
    }

    env.connect(graph.musicOut);
    if (graph.roomSend) env.connect(graph.roomSend);
    if (graph.delaySend) env.connect(graph.delaySend);

    body.start(start);
    chime.start(start);
    body.stop(releaseEnd + 0.03);
    chime.stop(releaseEnd + 0.03);
  }

  // Pure phase-solid warm chord pad (3 clean voices with studio hall + soft lowpass,
  // avoiding dual-oscillator detune phase beating on mono phone speakers)
  function triggerChordPad(freqs, start, dur, peak, filterHz) {
    if (!graph?.musicOut || !context || !Array.isArray(freqs)) return;
    const env = initZeroGain(context, start);
    const attackEnd = start + Math.min(0.45, dur * 0.25);
    const holdEnd = Math.max(attackEnd + 0.1, start + dur * 0.72);
    const releaseEnd = start + dur;

    linearParam(env.gain, peak, attackEnd);
    linearParam(env.gain, peak * 0.85, holdEnd);
    expParam(env.gain, 0.0001, releaseEnd);

    let dest = env;
    if (typeof context.createBiquadFilter === 'function') {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      setParam(filter.frequency, Math.min(820, filterHz * 0.65), start);
      filter.Q.value = 0.6;
      filter.connect(env);
      dest = filter;
    }

    env.connect(graph.musicOut);
    if (graph.roomSend) env.connect(graph.roomSend);

    for (const freq of freqs) {
      if (!Number.isFinite(freq) || freq <= 0) continue;
      const osc = context.createOscillator();
      osc.type = 'triangle';
      setParam(osc.frequency, freq, start);
      const voiceGain = context.createGain();
      setParam(voiceGain.gain, 1 / freqs.length, start);
      osc.connect(voiceGain);
      voiceGain.connect(dest);
      osc.start(start);
      osc.stop(releaseEnd + 0.04);
    }
  }

  function triggerDrum(kind, start) {
    if (!graph?.musicOut || !context) return;
    if (kind === 1) {
      // Smooth warm tactical pulse kick (linear attack prevents any sample-0 click)
      const osc = context.createOscillator();
      const env = initZeroGain(context, start);
      osc.type = 'sine';
      setParam(osc.frequency, 96, start);
      expParam(osc.frequency, 44, start + 0.14);
      linearParam(env.gain, 0.095, start + 0.008);
      expParam(env.gain, 0.0001, start + 0.19);
      osc.connect(env);
      env.connect(graph.musicOut);
      osc.start(start);
      osc.stop(start + 0.21);
    } else if (kind === 2 && graph.drumBuffer && typeof context.createBufferSource === 'function') {
      // Soft brushed tick (bounded safely inside buffer length)
      const src = context.createBufferSource();
      src.buffer = graph.drumBuffer;
      const env = initZeroGain(context, start);
      linearParam(env.gain, 0.022, start + 0.005);
      expParam(env.gain, 0.0001, start + 0.065);
      if (typeof context.createBiquadFilter === 'function') {
        const bp = context.createBiquadFilter();
        bp.type = 'bandpass';
        setParam(bp.frequency, 2600, start);
        bp.Q.value = 0.85;
        src.connect(bp);
        bp.connect(env);
      } else {
        src.connect(env);
      }
      env.connect(graph.musicOut);
      const safeSpan = Math.max(0.05, (graph.drumBuffer.duration || 1.2) - 0.15);
      const offset = (stepIndex * 0.19) % safeSpan;
      src.start(start, offset);
      src.stop(start + 0.08);
    }
  }

  function scheduleStep(at) {
    const pattern = PHASE_PATTERNS[phase];
    if (!pattern || !graph || !enabled || paused) return;
    const idx = stepIndex % pattern.steps;
    const bassFreq = pattern.bass[idx];
    const leadFreq = pattern.lead[idx];
    const drumHit = pattern.drum[idx];

    if (bassFreq) {
      triggerBass(bassFreq, at, pattern.stepSec * 1.65, pattern.bassGain, pattern.bassFilterHz);
    }
    if (leadFreq) {
      triggerPluck(leadFreq, at, pattern.stepSec * 2.4, pattern.leadGain, pattern.leadFilterHz);
    }
    if (idx % 8 === 0 && pattern.chords?.length) {
      const chord = pattern.chords[(idx / 8) % pattern.chords.length];
      triggerChordPad(chord, at, pattern.stepSec * 7.8, pattern.padGain, pattern.leadFilterHz);
    }
    if (drumHit) triggerDrum(drumHit, at);
    stepIndex = (stepIndex + 1) % pattern.steps;
  }

  function pumpSchedule() {
    if (!enabled || paused || phase === 'silent' || !context || context.state !== 'running') return;
    const pattern = PHASE_PATTERNS[phase];
    if (!pattern) return;
    const now = context.currentTime || 0;
    // Preserve steady beat phase; only resync if resuming after a real suspension gap
    if (nextStepAt < now - 0.2) nextStepAt = now + 0.03;
    const horizon = now + Math.max(0.32, pattern.stepSec * 1.6);
    while (nextStepAt <= horizon) {
      scheduleStep(nextStepAt);
      nextStepAt += pattern.stepSec;
    }
  }

  function syncScheduler() {
    if (disposed || !enabled || paused || phase === 'silent' || !context || context.state !== 'running') {
      clearScheduler();
      return;
    }
    ensureGraph();
    syncMasterMix();
    pumpSchedule();
    if (stepTimer === null) {
      stepTimer = setInterval(pumpSchedule, 100);
      stepTimer?.unref?.();
    }
  }

  return {
    setScene({ phase: nextPhase, weather: nextWeather, weatherEffects: nextWeatherFx } = {}) {
      if (disposed) return getState();
      if (nextPhase !== undefined && MUSIC_PHASES.includes(nextPhase)) {
        if (nextPhase !== phase) {
          phase = nextPhase;
          stepIndex = 0;
          nextStepAt = (context?.currentTime || 0) + 0.04;
        }
      }
      if (nextWeather !== undefined) {
        weather = nextWeather === null || WEATHER_BEDS.includes(nextWeather) ? nextWeather : weather;
      }
      if (nextWeatherFx !== undefined) weatherEffects = !!nextWeatherFx;

      if (phase === 'silent') {
        clearScheduler();
        if (graph) syncMasterMix();
      } else if (enabled && !paused && context?.state === 'running') {
        syncScheduler();
      } else if (graph) {
        syncMasterMix();
      }
      return getState();
    },

    setEnabled(value) {
      enabled = !!value;
      if (!enabled) {
        clearScheduler();
        if (graph) syncMasterMix();
      } else if (!paused && phase !== 'silent' && context?.state === 'running') {
        syncScheduler();
      }
      return enabled;
    },

    setPaused(value) {
      paused = !!value;
      if (paused) {
        clearScheduler();
        if (graph) syncMasterMix();
      } else if (enabled && phase !== 'silent' && context?.state === 'running') {
        nextStepAt = (context?.currentTime || 0) + 0.04;
        syncScheduler();
      }
      return paused;
    },

    syncContextState() {
      if (enabled && !paused && phase !== 'silent' && context?.state === 'running') syncScheduler();
      else clearScheduler();
    },

    getRoomSend() {
      return graph?.roomSend || null;
    },

    getState,

    dispose() {
      disposed = true;
      clearScheduler();
      try { graph?.weatherSource?.stop?.(); } catch {}
      try { graph?.weatherSource?.disconnect?.(); } catch {}
      try { graph?.delayFb?.disconnect?.(); } catch {}
      try { graph?.delayNode?.disconnect?.(); } catch {}
      try { graph?.delaySend?.disconnect?.(); } catch {}
      try { graph?.roomSend?.disconnect?.(); } catch {}
      try { graph?.convolver?.disconnect?.(); } catch {}
      try { graph?.musicOut?.disconnect?.(); } catch {}
      graph = null;
    },
  };

  function getState() {
    return {
      enabled,
      paused,
      phase,
      weather,
      weatherEffects,
      hasReverb: !!graph?.convolver,
      hasWeatherBed: !!graph?.weatherSource,
      scheduling: stepTimer !== null,
    };
  }
}
