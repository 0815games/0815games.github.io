// Tactical multi-bus Web Audio engine for Iron Path.
// Audio context creation remains strictly opt-in behind an explicit user gesture.
import {
  getAudioResources,
  synthesizeAbility,
  synthesizeBossEvent,
  synthesizeBuild,
  synthesizeBunkerImpact,
  synthesizeCombo,
  synthesizeCommandCue,
  synthesizeDeath,
  synthesizeHazard,
  synthesizeLoot,
  synthesizePerk,
  synthesizeSector,
  synthesizeSell,
  synthesizeShot,
  synthesizeStrike,
  synthesizeUpgrade,
} from './battle-sound-recipes.mjs?v=20261122-ring1';
import { createBattleMusic, weatherForScene } from './battle-music.mjs?v=20261122-ring1';
import { storyMapStyle } from '../core/story-map-art.mjs?v=20261122-ring1';

export { weatherForScene };

const LEGACY_FREQUENCIES = Object.freeze({
  boss: [180, 130],
  clear: [420, 560],
  ice: [230, 160],
  defeat: [240, 120],
  impact: [170, 95],
  wave: [300, 420],
  request: [380, 480],
  build: [320, 440],
  upgrade: [440, 620],
  classUpgrade: [480, 680],
  ability: [330, 520],
  combo: [510, 760],
  warning: [270, 210],
  reconnect: [360, 540],
});

const BUS_DEFAULTS = Object.freeze({
  sfx: 1,
  explosion: 1,
  ui: 0.85,
  music: 0.38,
});

const PAN_BUCKETS = [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6];

function setGain(param, value, now = 0) {
  if (!param) return;
  if (typeof param.setValueAtTime === 'function') param.setValueAtTime(value, now);
  else param.value = value;
}

function rampGain(param, target, now, tau = 0.08) {
  if (!param) return;
  if (typeof param.setTargetAtTime === 'function') {
    param.setTargetAtTime(target, now, tau);
  } else if (typeof param.linearRampToValueAtTime === 'function') {
    param.linearRampToValueAtTime(target, now + tau * 2.5);
  } else if (typeof param.setValueAtTime === 'function') {
    param.setValueAtTime(target, now);
  } else {
    param.value = target;
  }
}

export function panForX(x, mapWidth = 960) {
  if (!Number.isFinite(x)) return 0;
  const width = Number.isFinite(mapWidth) && mapWidth > 0 ? mapWidth : 960;
  const normalized = Math.max(0, Math.min(1, x / width)) * 2 - 1;
  return Math.max(-0.65, Math.min(0.65, normalized * 0.65));
}

export function createBattleSound(AudioContextClass) {
  let context = null;
  let enabled = false;
  let mixer = null;
  let music = null;
  let resources = null;
  let voiceDucking = false;
  let musicEnabled = true;
  let sfxVolume = 1;
  let musicVolume = 1;
  let lastScene = { phase: 'silent', storyMissionId: null, theme: null, weatherEffects: true, paused: false };
  let lastPlayed = new Map();
  let lastCuePlayed = new Map();
  let recentCombatTimes = [];

  // Combat observer state (shot & death high-water marks)
  let seenShotId = 0;
  let seenPopId = 0;
  let seenShotRefs = new WeakSet();
  let seenPopRefs = new WeakSet();

  // Volume is a real gain, not a second mute switch: `setVolume(0)` stays audible
  // (silence has to be spelled as `setEnabled(false)`), so a slider at zero cannot
  // take the sound away without the player noticing why. 0..1, clamped.
  let volume = 1;
  const busVolumes = { ...BUS_DEFAULTS };
  const clamp = value => (Number.isFinite(value) ? Math.max(0.05, Math.min(1, value)) : 1);
  const clampBus = value => (Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1);

  function effectiveBusGain(busName) {
    if (busName === 'music') return busVolumes.music * musicVolume;
    return busVolumes[busName] * sfxVolume;
  }

  function applyBusGains() {
    if (!mixer?.buses || !context) return;
    const now = context.currentTime || 0;
    for (const busName of Object.keys(mixer.buses)) {
      setGain(mixer.buses[busName].gain, effectiveBusGain(busName), now);
    }
  }

  function resolveSceneWeather({ storyMissionId = null, theme = null } = {}) {
    const storyWeather = storyMissionId ? storyMapStyle(storyMissionId)?.weather || null : null;
    return weatherForScene({ storyWeather, theme });
  }

  function syncMusicState() {
    if (!music) return;
    const weather = resolveSceneWeather(lastScene);
    music.setEnabled(enabled && musicEnabled && musicVolume > 0.01);
    music.setPaused(!!lastScene.paused);
    music.setScene({
      phase: lastScene.phase,
      weather,
      weatherEffects: lastScene.weatherEffects !== false,
    });
  }

  function ensureMixer() {
    if (mixer || !context) return mixer;
    try {
      const masterGain = context.createGain();
      setGain(masterGain.gain, enabled ? volume : 0.0001, context.currentTime || 0);
      masterGain.connect(context.destination);

      let masterInput = masterGain;
      let limiter = null;
      if (typeof context.createDynamicsCompressor === 'function') {
        try {
          limiter = context.createDynamicsCompressor();
          const now = context.currentTime || 0;
          setGain(limiter.threshold, -10, now);
          setGain(limiter.knee, 12, now);
          setGain(limiter.ratio, 8, now);
          setGain(limiter.attack, 0.003, now);
          setGain(limiter.release, 0.14, now);
          limiter.connect(masterGain);
          masterInput = limiter;
        } catch {
          masterInput = masterGain;
          limiter = null;
        }
      }

      const combatDuck = context.createGain();
      setGain(combatDuck.gain, voiceDucking ? 0.78 : 1, context.currentTime || 0);
      combatDuck.connect(masterInput);

      const musicDuck = context.createGain();
      setGain(musicDuck.gain, voiceDucking ? 0.32 : 1, context.currentTime || 0);
      musicDuck.connect(masterInput);

      const buses = {
        sfx: context.createGain(),
        explosion: context.createGain(),
        ui: context.createGain(),
        music: context.createGain(),
      };
      const now = context.currentTime || 0;
      setGain(buses.sfx.gain, effectiveBusGain('sfx'), now);
      setGain(buses.explosion.gain, effectiveBusGain('explosion'), now);
      setGain(buses.ui.gain, effectiveBusGain('ui'), now);
      setGain(buses.music.gain, effectiveBusGain('music'), now);

      buses.sfx.connect(combatDuck);
      buses.explosion.connect(combatDuck);
      buses.ui.connect(masterInput);
      buses.music.connect(musicDuck);

      const panPools = {};
      if (typeof context.createStereoPanner === 'function') {
        for (const busName of ['sfx', 'explosion']) {
          try {
            panPools[busName] = PAN_BUCKETS.map(pan => {
              const node = context.createStereoPanner();
              setGain(node.pan, pan, now);
              node.connect(buses[busName]);
              return { pan, node };
            });
          } catch {
            panPools[busName] = null;
          }
        }
      }

      resources = getAudioResources(context);
      music = createBattleMusic({
        context,
        destination: buses.music,
        getResources: () => resources,
      });
      mixer = { masterGain, masterInput, limiter, combatDuck, musicDuck, buses, panPools };
      syncMusicState();
    } catch {
      mixer = null;
    }
    return mixer;
  }

  function busDestination(busName = 'sfx', x = null, mapWidth = 960) {
    const m = ensureMixer();
    if (!m) return context.destination;
    const bus = m.buses[busName] || m.buses.sfx;
    const pool = Number.isFinite(x) ? m.panPools[busName] : null;
    if (!pool?.length) return bus;
    const targetPan = panForX(x, mapWidth);
    let best = pool[0];
    let bestDist = Math.abs(best.pan - targetPan);
    for (let i = 1; i < pool.length; i++) {
      const d = Math.abs(pool[i].pan - targetPan);
      if (d < bestDist) {
        best = pool[i];
        bestDist = d;
      }
    }
    return best.node;
  }

  function resetCombat() {
    seenShotId = 0;
    seenPopId = 0;
    seenShotRefs = new WeakSet();
    seenPopRefs = new WeakSet();
    recentCombatTimes = [];
    lastCuePlayed.clear();
  }

  function registerCombatHit(now, priority = false) {
    const cutoff = now - 0.16;
    recentCombatTimes = recentCombatTimes.filter(t => t >= cutoff);
    if (!priority && recentCombatTimes.length >= 10) return null;
    recentCombatTimes.push(now);
    const count = recentCombatTimes.length;
    return count <= 3 ? 1 : Math.max(0.56, 1 - (count - 3) * 0.06);
  }

  function canPlayCue(key, minInterval, now) {
    const prev = lastCuePlayed.get(key) ?? -Infinity;
    if (now - prev < minInterval) return false;
    lastCuePlayed.set(key, now);
    return true;
  }

  function playShot(detail = {}) {
    if (!enabled || !context || context.state !== 'running') return false;
    const now = context.currentTime || 0;
    const offset = Math.max(0, Math.min(0.14, Number(detail.offset) || 0));
    const at = now + offset;
    const kind = detail.kind ?? 0;
    const branch = Number.isInteger(detail.branch) ? detail.branch : null;
    const fx = detail.fx || null;
    const priority = fx === 'crit' || fx === 'splash' || fx === 'bunker';

    let rateKey = `shot:${kind}`;
    let minInterval = 0.062;
    if (fx === 'chain') {
      rateKey = 'shot:chain';
      minInterval = 0.105;
    } else if (kind === 0) {
      rateKey = branch === 1 ? 'shot:0:heavy' : 'shot:0';
      minInterval = branch === 1 ? 0.095 : 0.062;
    } else if (kind === 1) {
      rateKey = 'shot:1';
      minInterval = 0.105;
    } else if (kind === 2) {
      rateKey = 'shot:2';
      minInterval = 0.088;
    } else if (kind === 3) {
      rateKey = 'shot:3';
      minInterval = 0.115;
    } else if (kind === 'hero') {
      rateKey = fx === 'bunker' ? 'shot:bunker' : 'shot:hero';
      minInterval = fx === 'bunker' ? 0.25 : 0.082;
    }

    if (!canPlayCue(rateKey, minInterval, at)) return false;
    const scale = registerCombatHit(at, priority);
    if (scale === null) return false;

    try {
      const dest = busDestination(kind === 1 ? 'explosion' : 'sfx', detail.x, detail.mapWidth);
      synthesizeShot(context, dest, resources, {
        kind,
        branch,
        classPath: detail.classPath || null,
        level: detail.level || 1,
        fx,
        start: at,
        scale,
      });
      return true;
    } catch {
      /* Sound must never interrupt the game. */
      return false;
    }
  }

  function playDeath(detail = {}) {
    if (!enabled || !context || context.state !== 'running') return false;
    const now = context.currentTime || 0;
    const offset = Math.max(0, Math.min(0.12, Number(detail.offset) || 0));
    const at = now + offset;
    const boss = !!detail.boss;
    const kind = detail.kind || 'infantry';

    const rateKey = boss
      ? 'death:boss'
      : kind === 'tank'
        ? 'death:tank'
        : kind === 'plane'
          ? 'death:plane'
          : 'death:infantry';
    const minInterval = boss ? 0.35 : kind === 'tank' ? 0.13 : kind === 'plane' ? 0.12 : 0.075;

    if (!canPlayCue(rateKey, minInterval, at)) return false;
    const scale = registerCombatHit(at, boss || kind === 'tank' || kind === 'plane');
    if (scale === null) return false;

    try {
      const bus = boss || kind === 'tank' || kind === 'plane' ? 'explosion' : 'sfx';
      const dest = busDestination(bus, detail.x, detail.mapWidth);
      synthesizeDeath(context, dest, resources, { kind, boss, start: at, scale });
      return true;
    } catch {
      /* Sound must never interrupt the game. */
      return false;
    }
  }

  function playLegacyCue(kind, detail = {}) {
    const notes = LEGACY_FREQUENCIES[kind];
    if (!notes) return false;
    const now = context.currentTime || 0;
    if (now - (lastPlayed.get(kind) ?? -Infinity) < 0.3) return false;
    lastPlayed.set(kind, now);

    const busName = kind === 'boss' || kind === 'impact' || kind === 'defeat'
      ? 'explosion'
      : kind === 'build' || kind === 'upgrade' || kind === 'classUpgrade' || kind === 'ability' || kind === 'combo' || kind === 'ice'
        ? 'sfx'
        : 'ui';
    const dest = busDestination(busName, detail?.x, detail?.mapWidth);
    const gainScale = mixer ? 0.045 : 0.045 * volume;

    try {
      // Minimal test doubles lack AudioBuffer/BiquadFilter: preserve the exact
      // 2-oscillator cue contract there, while real Web Audio plays full
      // realistic tactical-dry multi-layer synthesis.
      if (!resources?.pinkBuffer) {
        notes.forEach((frequency, i) => {
          const osc = context.createOscillator();
          const gain = context.createGain();
          const start = now + i * 0.12;
          osc.type = 'triangle';
          osc.frequency.value = frequency;
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(gainScale, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(start);
          osc.stop(start + 0.15);
        });
        return true;
      }

      if (kind === 'build') {
        synthesizeBuild(context, dest, resources, { towerType: detail?.towerType ?? 0, start: now, scale: 1 });
      } else if (kind === 'upgrade' || kind === 'classUpgrade') {
        synthesizeUpgrade(context, dest, resources, { kind, start: now, scale: 1 });
      } else if (kind === 'ice') {
        synthesizeHazard(context, dest, resources, { kind: 'ice', start: now, scale: 1 });
      } else if (kind === 'impact') {
        synthesizeBunkerImpact(context, dest, resources, { start: now, scale: 1 });
      } else if (kind === 'ability') {
        synthesizeAbility(context, dest, resources, {
          classId: detail?.classId || 'assault',
          variant: detail?.variant || 0,
          start: now,
          scale: 1,
        });
      } else if (kind === 'combo') {
        synthesizeCombo(context, dest, resources, { start: now, scale: 1 });
      } else if (kind === 'boss' || kind === 'warning') {
        synthesizeBossEvent(context, dest, resources, { kind, start: now, scale: 1 });
      } else {
        synthesizeCommandCue(context, dest, resources, { kind, start: now, scale: 1 });
      }
      return true;
    } catch {
      /* Sound must never interrupt the game. */
      return false;
    }
  }

  function playExtendedCue(kind, detail = {}) {
    const now = context.currentTime || 0;
    const isUi = kind.startsWith('ui');
    const cooldown = isUi ? 0.09 : kind === 'loot' ? 0.15 : kind === 'abilityReady' ? 1.0 : 0.3;
    if (now - (lastPlayed.get(kind) ?? -Infinity) < cooldown) return false;
    lastPlayed.set(kind, now);

    const busName = kind === 'strike' || kind === 'bossAbility'
      ? 'explosion'
      : isUi || kind === 'victory' || kind === 'abilityReady' || kind === 'perk' || kind === 'sector'
        ? 'ui'
        : 'sfx';
    const dest = busDestination(busName, isUi ? null : detail?.x, detail?.mapWidth);
    try {
      switch (kind) {
        case 'strike':
          synthesizeStrike(context, dest, resources, { start: now, scale: 1 });
          return true;
        case 'branch':
        case 'prestige':
          synthesizeUpgrade(context, dest, resources, { kind, start: now, scale: 1 });
          return true;
        case 'sell':
          synthesizeSell(context, dest, resources, { start: now, scale: 1 });
          return true;
        case 'loot':
          synthesizeLoot(context, dest, resources, { bounty: !!detail?.bounty, start: now, scale: 1 });
          return true;
        case 'perk':
          synthesizePerk(context, dest, resources, { start: now, scale: 1 });
          return true;
        case 'sector':
          synthesizeSector(context, dest, resources, { start: now, scale: 1 });
          return true;
        case 'rubble':
          synthesizeHazard(context, dest, resources, { kind: 'rubble', start: now, scale: 1 });
          return true;
        case 'bossAbility':
          synthesizeBossEvent(context, dest, resources, { kind: 'bossAbility', ability: detail?.ability || null, start: now, scale: 1 });
          return true;
        case 'victory':
        case 'abilityReady':
        case 'uiClick':
        case 'uiCraft':
        case 'uiEquip':
        case 'uiConfirm':
        case 'uiError':
          synthesizeCommandCue(context, dest, resources, { kind, start: now, scale: 1 });
          return true;
        default:
          return false;
      }
    } catch {
      /* Sound must never interrupt the game. */
      return false;
    }
  }

  return {
    async setEnabled(value) {
      if (!value) {
        enabled = false;
        lastPlayed.clear();
        resetCombat();
        syncMusicState();
        if (mixer?.masterGain && context) setGain(mixer.masterGain.gain, 0.0001, context.currentTime || 0);
        return false;
      }
      if (!AudioContextClass) return false;
      try {
        context ??= new AudioContextClass();
        await context.resume();
        enabled = context.state === 'running';
        if (enabled) {
          ensureMixer();
          if (mixer?.masterGain) setGain(mixer.masterGain.gain, volume, context.currentTime || 0);
          syncMusicState();
        }
      } catch {
        enabled = false;
      }
      return enabled;
    },

    needsResume() {
      return !!enabled && !!context && context.state !== 'running';
    },

    async resume() {
      if (!enabled || !context) return false;
      try {
        if (context.state !== 'running') await context.resume();
        const running = context.state === 'running';
        if (running) {
          ensureMixer();
          music?.syncContextState?.();
          syncMusicState();
        }
        return running;
      } catch {
        return false;
      }
    },

    isEnabled() {
      return enabled;
    },

    getVolume() {
      return volume;
    },

    setVolume(value) {
      volume = clamp(value);
      if (enabled && mixer?.masterGain && context) {
        setGain(mixer.masterGain.gain, volume, context.currentTime || 0);
      }
      return volume;
    },

    setSfxVolume(value) {
      sfxVolume = clampBus(value);
      applyBusGains();
      return sfxVolume;
    },

    getSfxVolume() {
      return sfxVolume;
    },

    setMusicVolume(value) {
      musicVolume = clampBus(value);
      applyBusGains();
      syncMusicState();
      return musicVolume;
    },

    getMusicVolume() {
      return musicVolume;
    },

    setMusicEnabled(value) {
      musicEnabled = !!value;
      syncMusicState();
      return musicEnabled;
    },

    getMusicEnabled() {
      return musicEnabled;
    },

    setScene(next = {}) {
      if (!next || typeof next !== 'object') return null;
      const changedWeatherSource = Object.hasOwn(next, 'storyMissionId') || Object.hasOwn(next, 'theme');
      const nextScene = {
        ...lastScene,
        ...next,
      };
      if (Object.hasOwn(next, 'phase') && next.phase === 'menu' && !changedWeatherSource) {
        nextScene.storyMissionId = null;
        nextScene.theme = null;
      }
      lastScene = nextScene;
      syncMusicState();
      return music?.getState?.() || null;
    },

    getMusicState() {
      return music?.getState?.() || {
        enabled: enabled && musicEnabled && musicVolume > 0.01,
        paused: !!lastScene.paused,
        phase: lastScene.phase,
        weather: resolveSceneWeather(lastScene),
        weatherEffects: lastScene.weatherEffects !== false,
        hasReverb: false,
        hasWeatherBed: false,
        scheduling: false,
      };
    },

    setBusVolume(busName, value) {
      if (!Object.hasOwn(busVolumes, busName)) return null;
      const clamped = clampBus(value);
      busVolumes[busName] = clamped;
      if (mixer?.buses?.[busName] && context) {
        setGain(mixer.buses[busName].gain, effectiveBusGain(busName), context.currentTime || 0);
      }
      return clamped;
    },

    getBusVolume(busName) {
      return Object.hasOwn(busVolumes, busName) ? busVolumes[busName] : null;
    },

    setVoiceDucking(active) {
      voiceDucking = !!active;
      if (!mixer || !context) return voiceDucking;
      const now = context.currentTime || 0;
      rampGain(mixer.musicDuck?.gain, voiceDucking ? 0.32 : 1, now, 0.12);
      rampGain(mixer.combatDuck?.gain, voiceDucking ? 0.78 : 1, now, 0.12);
      return voiceDucking;
    },

    isVoiceDucking() {
      return voiceDucking;
    },

    hasLimiter() {
      return !!mixer?.limiter;
    },

    resetCombat,

    observeCombat(state, { pads = null, mapWidth = 960, baselineOnly = false } = {}) {
      const out = { shots: 0, deaths: 0 };
      if (!state || typeof state !== 'object') return out;

      const shots = Array.isArray(state.shots) ? state.shots : [];
      const pops = Array.isArray(state.combatPops) ? state.combatPops : [];

      if (baselineOnly) {
        for (const shot of shots) {
          if (!shot) continue;
          if (Number.isInteger(shot.id) && shot.id > seenShotId) seenShotId = shot.id;
          else seenShotRefs.add(shot);
        }
        for (const pop of pops) {
          if (!pop) continue;
          if (Number.isInteger(pop.id) && pop.id > seenPopId) seenPopId = pop.id;
          else seenPopRefs.add(pop);
        }
        return out;
      }

      const freshShots = [];
      let nextShotId = seenShotId;
      for (const shot of shots) {
        if (!shot) continue;
        if (Number.isInteger(shot.id)) {
          if (shot.id > seenShotId) {
            freshShots.push(shot);
            if (shot.id > nextShotId) nextShotId = shot.id;
          }
        } else if (!seenShotRefs.has(shot)) {
          seenShotRefs.add(shot);
          const dur = Number.isFinite(shot.duration) && shot.duration > 0 ? shot.duration : 0.24;
          const life = Number.isFinite(shot.life) ? shot.life : dur;
          if (life >= dur - 0.04) freshShots.push(shot);
        }
      }
      seenShotId = nextShotId;

      const freshPops = [];
      let nextPopId = seenPopId;
      for (const pop of pops) {
        if (!pop) continue;
        if (Number.isInteger(pop.id)) {
          if (pop.id > seenPopId) {
            freshPops.push(pop);
            if (pop.id > nextPopId) nextPopId = pop.id;
          }
        } else if (!seenPopRefs.has(pop)) {
          seenPopRefs.add(pop);
          const life = Number.isFinite(pop.life) ? pop.life : 0.65;
          if (life >= 0.6) freshPops.push(pop);
        }
      }
      seenPopId = nextPopId;

      if (!enabled || !context || context.state !== 'running') return out;
      if (!freshShots.length && !freshPops.length) return out;

      let towerByCoord = null;
      if (freshShots.length && Array.isArray(pads) && Array.isArray(state.towers) && state.towers.length) {
        towerByCoord = new Map();
        for (const tower of state.towers) {
          const pad = pads[tower.pad];
          if (pad && Number.isFinite(pad.x) && Number.isFinite(pad.y)) {
            towerByCoord.set(`${Math.round(pad.x)},${Math.round(pad.y)}`, tower);
          }
        }
      }

      if (freshShots.length > 1) {
        freshShots.sort((a, b) => (a.id || 0) - (b.id || 0));
      }
      let maxShotLife = 0;
      for (const shot of freshShots) {
        if (Number.isFinite(shot.life) && shot.life > maxShotLife) maxShotLife = shot.life;
      }

      for (const shot of freshShots) {
        const tower = towerByCoord && shot.fx !== 'chain' && shot.kind !== 'hero'
          ? towerByCoord.get(`${Math.round(shot.x)},${Math.round(shot.y)}`) || null
          : null;
        const life = Number.isFinite(shot.life) ? shot.life : maxShotLife;
        const offset = maxShotLife > life ? Math.min(0.11, (maxShotLife - life) * 0.6) : 0;
        const played = playShot({
          kind: shot.kind,
          x: shot.x,
          mapWidth,
          fx: shot.fx || null,
          branch: tower && tower.level >= 3 && Number.isInteger(tower.branch) ? tower.branch : null,
          classPath: tower?.classPath && tower?.classTier ? tower.classPath : null,
          level: tower?.level || 1,
          offset,
        });
        if (played) out.shots++;
      }

      if (freshPops.length > 1) {
        freshPops.sort((a, b) => (a.id || 0) - (b.id || 0));
      }
      let maxPopLife = 0;
      for (const pop of freshPops) {
        if (Number.isFinite(pop.life) && pop.life > maxPopLife) maxPopLife = pop.life;
      }
      for (const pop of freshPops) {
        const life = Number.isFinite(pop.life) ? pop.life : maxPopLife;
        const offset = maxPopLife > life ? Math.min(0.1, (maxPopLife - life) * 0.5) : 0;
        const played = playDeath({
          kind: pop.kind || 'infantry',
          boss: !!pop.boss,
          x: pop.x,
          mapWidth,
          offset,
        });
        if (played) out.deaths++;
      }

      return out;
    },

    play(kind, detail = {}) {
      if (!enabled || !context || context.state !== 'running') return;
      if (kind === 'shot') {
        playShot(detail);
        return;
      }
      if (kind === 'death') {
        playDeath(detail);
        return;
      }
      if (Object.hasOwn(LEGACY_FREQUENCIES, kind)) {
        playLegacyCue(kind, detail);
        return;
      }
      playExtendedCue(kind, detail);
    },

    dispose() {
      enabled = false;
      lastPlayed.clear();
      resetCombat();
      try { music?.dispose?.(); } catch {}
      music = null;
      if (mixer?.masterGain && context) setGain(mixer.masterGain.gain, 0.0001, context.currentTime || 0);
    },
  };
}
