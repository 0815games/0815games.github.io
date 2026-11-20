// Option C Hybrid adaptive tactical music, stereo room reverb, and weather beds
// for Iron Path. Zero external audio files; strictly opt-in behind user gesture,
// with lazy Web Audio node/buffer allocation so bare initialization allocates nothing
// extra until an audible scene runs.

export const MUSIC_PHASES = Object.freeze(['silent', 'menu', 'prep', 'wave', 'boss']);
export const WEATHER_BEDS = Object.freeze(['rain', 'wind', 'arctic']);

const NOTE = Object.freeze({
  D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, Bb2: 116.54, C3: 130.81,
  D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, C4: 261.63,
  D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, C5: 523.25,
});

const PHASE_PATTERNS = Object.freeze({
  menu: Object.freeze({
    stepSec: 0.56,
    steps: 16,
    bass: [NOTE.D2, 0, 0, 0, NOTE.A2, 0, 0, 0, NOTE.F2, 0, 0, 0, NOTE.C3, 0, NOTE.A2, 0],
    lead: [NOTE.A3, 0, NOTE.D4, 0, 0, NOTE.E4, 0, 0, NOTE.F4, 0, NOTE.C4, 0, 0, NOTE.D4, 0, 0],
    pad: [NOTE.D3, NOTE.A3, NOTE.F3, NOTE.C4],
    drum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    filterHz: 780,
    padGain: 0.055,
    leadGain: 0.048,
    bassGain: 0.095,
  }),
  prep: Object.freeze({
    stepSec: 0.36,
    steps: 16,
    bass: [NOTE.D2, 0, NOTE.D2, 0, NOTE.A2, 0, 0, NOTE.C3, NOTE.F2, 0, NOTE.F2, 0, NOTE.G2, 0, NOTE.A2, 0],
    lead: [NOTE.D4, 0, NOTE.A3, 0, NOTE.F4, 0, NOTE.E4, 0, NOTE.D4, 0, NOTE.C4, 0, NOTE.A3, 0, NOTE.E4, 0],
    pad: [NOTE.D3, NOTE.A3, NOTE.F3, NOTE.A3],
    drum: [1, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 2, 0, 0],
    filterHz: 1080,
    padGain: 0.06,
    leadGain: 0.055,
    bassGain: 0.115,
  }),
  wave: Object.freeze({
    stepSec: 0.25,
    steps: 16,
    bass: [NOTE.D2, NOTE.D2, NOTE.A2, NOTE.D2, NOTE.F2, NOTE.F2, NOTE.C3, NOTE.A2, NOTE.G2, NOTE.G2, NOTE.D2, NOTE.G2, NOTE.A2, NOTE.A2, NOTE.C3, NOTE.A2],
    lead: [NOTE.D4, 0, NOTE.F4, NOTE.E4, NOTE.D4, 0, NOTE.A4, 0, NOTE.G4, 0, NOTE.F4, NOTE.E4, NOTE.D4, NOTE.E4, NOTE.C4, 0],
    pad: [NOTE.D3, NOTE.F3, NOTE.G3, NOTE.A3],
    drum: [1, 0, 2, 0, 1, 0, 2, 2, 1, 0, 2, 0, 1, 2, 1, 2],
    filterHz: 1580,
    padGain: 0.07,
    leadGain: 0.072,
    bassGain: 0.135,
  }),
  boss: Object.freeze({
    stepSec: 0.205,
    steps: 16,
    bass: [NOTE.D2, NOTE.D2, NOTE.Eb3, NOTE.D2, NOTE.D2, NOTE.Bb2, NOTE.A2, NOTE.G2, NOTE.D2, NOTE.D2, NOTE.F2, NOTE.D2, NOTE.G2, NOTE.Eb3, NOTE.A2, NOTE.A2],
    lead: [NOTE.D4, NOTE.Eb4, NOTE.F4, 0, NOTE.A4, 0, NOTE.Bb4, NOTE.A4, NOTE.G4, 0, NOTE.F4, NOTE.Eb4, NOTE.D4, 0, NOTE.C4, NOTE.Eb4],
    pad: [NOTE.D3, NOTE.Eb3, NOTE.Bb2, NOTE.A3],
    drum: [1, 2, 1, 2, 1, 0, 1, 2, 1, 2, 1, 2, 1, 1, 2, 2],
    filterHz: 2100,
    padGain: 0.085,
    leadGain: 0.085,
    bassGain: 0.16,
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

function makeRoomImpulse(context, durationSec = 2.0) {
  if (!context || typeof context.createBuffer !== 'function') return null;
  const sampleRate = Number.isFinite(context.sampleRate) && context.sampleRate > 0 ? context.sampleRate : 44100;
  const length = Math.max(2048, Math.floor(sampleRate * durationSec));
  const buffer = context.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const decay = Math.pow(1 - t, 2.75);
      const n = (Math.random() * 2 - 1) * decay;
      lp = lp * 0.62 + n * 0.38;
      data[i] = lp * (ch === 0 ? 0.85 : 0.82);
    }
  }
  return buffer;
}

function makeWeatherNoise(context, seconds = 3.0) {
  if (!context || typeof context.createBuffer !== 'function') return null;
  const sampleRate = Number.isFinite(context.sampleRate) && context.sampleRate > 0 ? context.sampleRate : 44100;
  const length = Math.max(2048, Math.floor(sampleRate * seconds));
  const buffer = context.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, peak = 0.001;
  for (let i = 0; i < length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + w * 0.029;
    b1 = 0.985 * b1 + w * 0.032;
    b2 = 0.950 * b2 + w * 0.048;
    const s = b0 + b1 + b2 + w * 0.06;
    data[i] = s;
    if (Math.abs(s) > peak) peak = Math.abs(s);
  }
  const scale = 0.85 / peak;
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
          roomBuffer ??= makeRoomImpulse(context, 2.0);
          if (roomBuffer) {
            convolver = context.createConvolver();
            convolver.buffer = roomBuffer;
            roomSend = context.createGain();
            setParam(roomSend.gain, 0.28, now);
            roomSend.connect(convolver);
            convolver.connect(musicOut);
          }
        } catch {
          roomSend = null;
          convolver = null;
        }
      }

      const weatherGains = {};
      let weatherSource = null;
      if (typeof context.createBufferSource === 'function' && typeof context.createBiquadFilter === 'function') {
        try {
          weatherBuffer ??= getResources?.()?.pinkBuffer || makeWeatherNoise(context, 3.0);
          if (weatherBuffer) {
            weatherSource = context.createBufferSource();
            weatherSource.buffer = weatherBuffer;
            weatherSource.loop = true;

            const specs = {
              rain: { type: 'bandpass', freq: 1850, q: 0.75 },
              wind: { type: 'lowpass', freq: 440, q: 1.9 },
              arctic: { type: 'bandpass', freq: 920, q: 3.1 },
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

      graph = { musicOut, roomSend, convolver, weatherSource, weatherGains };
    } catch {
      graph = null;
    }
    return graph;
  }

  function syncWeatherMix() {
    if (!graph?.weatherGains || !context) return;
    const now = context.currentTime || 0;
    const weatherActive = enabled && !paused && phase !== 'silent' && weatherEffects && !!weather;
    const bedTarget = { rain: 0.065, wind: 0.075, arctic: 0.055 };
    for (const bed of WEATHER_BEDS) {
      const gainNode = graph.weatherGains[bed];
      if (!gainNode) continue;
      const target = weatherActive && weather === bed ? bedTarget[bed] : 0.0001;
      rampParam(gainNode.gain, target, now, 0.45);
    }
  }

  function syncMasterMix() {
    if (!graph?.musicOut || !context) return;
    const now = context.currentTime || 0;
    const active = enabled && !paused && phase !== 'silent';
    rampParam(graph.musicOut.gain, active ? 1 : 0.0001, now, active ? 0.25 : 0.14);
    syncWeatherMix();
  }

  function triggerNote(freq, start, dur, { type = 'triangle', peak = 0.07, filterHz = 1200, sendReverb = true } = {}) {
    if (!graph?.musicOut || !context || !Number.isFinite(freq) || freq <= 0) return;
    const osc = context.createOscillator();
    const env = context.createGain();
    osc.type = type;
    setParam(osc.frequency, freq, start);

    setParam(env.gain, 0.0001, start);
    if (typeof env.gain.linearRampToValueAtTime === 'function') {
      env.gain.linearRampToValueAtTime(peak, start + 0.018);
    } else {
      setParam(env.gain, peak, start + 0.015);
    }
    expParam(env.gain, 0.0001, start + dur);

    if (typeof context.createBiquadFilter === 'function') {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      setParam(filter.frequency, filterHz, start);
      osc.connect(filter);
      filter.connect(env);
    } else {
      osc.connect(env);
    }

    env.connect(graph.musicOut);
    if (sendReverb && graph.roomSend) env.connect(graph.roomSend);

    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  function triggerDrum(kind, start) {
    if (!graph?.musicOut || !context) return;
    if (kind === 1) {
      // Low war-drum thump
      const osc = context.createOscillator();
      const env = context.createGain();
      osc.type = 'sine';
      setParam(osc.frequency, 108, start);
      expParam(osc.frequency, 42, start + 0.16);
      setParam(env.gain, 0.0001, start);
      setParam(env.gain, 0.14, start + 0.006);
      expParam(env.gain, 0.0001, start + 0.21);
      osc.connect(env);
      env.connect(graph.musicOut);
      if (graph.roomSend) env.connect(graph.roomSend);
      osc.start(start);
      osc.stop(start + 0.22);
    } else if (kind === 2 && weatherBuffer && typeof context.createBufferSource === 'function') {
      // Tight brushed tactical snare
      const src = context.createBufferSource();
      src.buffer = weatherBuffer;
      const env = context.createGain();
      setParam(env.gain, 0.0001, start);
      setParam(env.gain, 0.042, start + 0.004);
      expParam(env.gain, 0.0001, start + 0.09);
      if (typeof context.createBiquadFilter === 'function') {
        const bp = context.createBiquadFilter();
        bp.type = 'bandpass';
        setParam(bp.frequency, 1900, start);
        bp.Q.value = 1.2;
        src.connect(bp);
        bp.connect(env);
      } else {
        src.connect(env);
      }
      env.connect(graph.musicOut);
      src.start(start);
      src.stop(start + 0.1);
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
      triggerNote(bassFreq, at, pattern.stepSec * 0.9, {
        type: 'sawtooth',
        peak: pattern.bassGain,
        filterHz: pattern.filterHz * 0.6,
        sendReverb: false,
      });
    }
    if (leadFreq) {
      triggerNote(leadFreq, at, pattern.stepSec * 1.45, {
        type: phase === 'boss' ? 'sawtooth' : 'triangle',
        peak: pattern.leadGain,
        filterHz: pattern.filterHz,
        sendReverb: true,
      });
    }
    if (idx % 4 === 0) {
      const padNote = pattern.pad[(idx / 4) % pattern.pad.length];
      triggerNote(padNote, at, pattern.stepSec * 3.8, {
        type: 'sine',
        peak: pattern.padGain,
        filterHz: pattern.filterHz * 0.8,
        sendReverb: true,
      });
    }
    if (drumHit) triggerDrum(drumHit, at);
    stepIndex = (stepIndex + 1) % pattern.steps;
  }

  function pumpSchedule() {
    if (!enabled || paused || phase === 'silent' || !context || context.state !== 'running') return;
    const pattern = PHASE_PATTERNS[phase];
    if (!pattern) return;
    const now = context.currentTime || 0;
    if (nextStepAt < now) nextStepAt = now + 0.02;
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
      stepTimer = setInterval(pumpSchedule, 110);
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
          nextStepAt = (context?.currentTime || 0) + 0.03;
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
        nextStepAt = (context?.currentTime || 0) + 0.03;
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
