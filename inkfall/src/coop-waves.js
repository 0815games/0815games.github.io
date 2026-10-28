(function(root, factory) {
  'use strict';
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.InkfallCoopWaves = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const clone = value => JSON.parse(JSON.stringify(value));

  function requireValue(condition, message) {
    if (!condition) throw new Error(message);
  }

  function makePath(points) {
    requireValue(
      Array.isArray(points) && points.length >= 2,
      'Ungültiger Weg.'
    );

    let total = 0;
    const segments = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];

      requireValue(
        Array.isArray(p) &&
        p.length === 2 &&
        p.every(Number.isFinite) &&
        p[0] >= 0 && p[0] <= 940 &&
        p[1] >= 0 && p[1] <= 600,
        'Ungültiger Wegpunkt.'
      );

      if (i) {
        const a = points[i - 1];
        const length = Math.hypot(p[0] - a[0], p[1] - a[1]);

        requireValue(length > 0, 'Wegsegment hat Länge null.');

        segments.push({
          a: [...a],
          b: [...p],
          length,
          start: total
        });
        total += length;
      }
    }

    return { total, segments };
  }

  function position(path, distance) {
    for (const segment of path.segments) {
      if (distance <= segment.start + segment.length) {
        const t = Math.max(0, Math.min(
          1,
          (distance - segment.start) / segment.length
        ));

        return {
          x: segment.a[0] +
            (segment.b[0] - segment.a[0]) * t,
          y: segment.a[1] +
            (segment.b[1] - segment.a[1]) * t
        };
      }
    }

    const p = path.segments.at(-1).b;
    return { x: p[0], y: p[1] };
  }

  function createEngine(config) {
    requireValue(
      config &&
      Array.isArray(config.waves) &&
      config.waves.length > 0,
      'Wellendaten fehlen.'
    );

    const waves = clone(config.waves);
    const definitions = clone(config.enemies || {});

    const paths = {
      ground: makePath(config.ground),
      air: makePath(config.air)
    };

    const intervals = {
      default: 0.85,
      runner: 0.55,
      flyer: 0.7,
      ...config.spawnIntervals
    };

    for (const value of Object.values(intervals)) {
      requireValue(
        Number.isFinite(value) && value > 0 && value <= 60,
        'Ungültiger Spawn-Abstand.'
      );
    }

    for (const wave of waves) {
      let total = 0;

      requireValue(
        Array.isArray(wave) && wave.length > 0,
        'Leere Welle.'
      );

      for (const entry of wave) {
        requireValue(
          Array.isArray(entry) && entry.length === 2,
          'Ungültiger Welleneintrag.'
        );

        const [type, count] = entry;
        const enemy = definitions[type];

        requireValue(
          typeof type === 'string' &&
          enemy &&
          Number.isInteger(count) &&
          count > 0,
          'Unbekannter Gegner oder ungültige Anzahl.'
        );

        requireValue(
          Number.isFinite(enemy.hp) && enemy.hp > 0 &&
          Number.isFinite(enemy.s) && enemy.s > 0 &&
          Number.isFinite(enemy.dmg) && enemy.dmg > 0 &&
          paths[enemy.route],
          'Ungültige Gegnerwerte.'
        );

        total += count;
      }

      requireValue(total <= 500, 'Zu viele Gegner pro Welle.');
    }

    function check(state) {
      requireValue(
        state &&
        state.schemaVersion === 1 &&
        typeof state.sessionId === 'string' &&
        typeof state.hostUid === 'string' &&
        Number.isSafeInteger(state.revision) &&
        state.revision >= 0 &&
        state.revision < Number.MAX_SAFE_INTEGER &&
        [
          'preparation', 'running', 'paused', 'won', 'lost'
        ].includes(state.phase) &&
        Number.isInteger(state.wave) &&
        state.wave >= 0 &&
        state.wave <= waves.length &&
        Number.isFinite(state.baseLives) &&
        state.baseLives >= 0 &&
        state.baseLives <= 100 &&
        Number.isFinite(state.gold) &&
        state.gold >= 0 &&
        state.gold <= 999999 &&
        Number.isSafeInteger(state.skillPoints) &&
        state.skillPoints >= 0 &&
        state.skillPoints <= 999 &&
        Number.isFinite(state.elapsed) &&
        state.elapsed >= 0,
        'Ungültiger Wellenzustand.'
      );
    }

    function host(state, uid) {
      check(state);
      requireValue(
        uid === state.hostUid,
        'Nur der Host darf Wellen steuern.'
      );
    }

    function create(session) {
      requireValue(
        session &&
        session.schemaVersion === 1 &&
        typeof session.id === 'string' &&
        /^[A-Za-z0-9_-]{1,80}$/.test(session.id) &&
        typeof session.hostUid === 'string' &&
        session.hostUid.length > 0,
        'Ungültige Sitzung.'
      );

      return {
        schemaVersion: 1,
        sessionId: session.id,
        hostUid: session.hostUid,
        revision: 0,
        phase: 'preparation',
        wave: 0,
        baseLives: 100,
        gold: 150,
        skillPoints: 0,
        elapsed: 0,
        lastStartId: null,
        enemies: {},
        pending: {}
      };
    }

    function startWave(state, uid, request) {
      host(state, uid);

      requireValue(
        request &&
        typeof request.id === 'string' &&
        /^[A-Za-z0-9_-]{1,80}$/.test(request.id),
        'Ungültige Start-ID.'
      );

      if (state.lastStartId === request.id) return state;

      requireValue(
        state.phase === 'preparation',
        'Welle kann jetzt nicht gestartet werden.'
      );

      requireValue(
        Number.isInteger(request.expectedWave) &&
        request.expectedWave === state.wave + 1 &&
        request.expectedWave <= waves.length,
        'Veralteter oder ungültiger Wellenstart.'
      );

      requireValue(
        state.baseLives > 0 &&
        Object.keys(state.enemies || {}).length === 0 &&
        Object.keys(state.pending || {}).length === 0,
        'Vorherige Welle ist nicht abgeschlossen.'
      );

      const next = clone(state);
      next.wave++;
      next.phase = 'running';
      next.elapsed = 0;
      next.lastStartId = request.id;
      next.pending = {};
      next.enemies = {};

      let at = 0;
      let index = 0;

      for (const [type, count] of waves[next.wave - 1]) {
        for (let i = 0; i < count; i++) {
          const id = state.sessionId +
            '-w' + next.wave + '-e' + index++;

          next.pending[id] = { id, type, at };
          at += intervals[type] || intervals.default;
        }
      }

      next.revision++;
      return next;
    }

    function step(state, dt) {
      check(state);

      requireValue(
        Number.isFinite(dt) && dt >= 0 && dt <= 0.1,
        'Ungültiger Zeitschritt.'
      );

      if (state.phase !== 'running' || dt === 0) return state;

      const next = clone(state);
      next.pending ||= {};
      next.enemies ||= {};

      const before = state.elapsed;
      next.elapsed += dt;
      const spawned = new Map();

      for (const [id, order] of Object.entries(next.pending)) {
        requireValue(
          definitions[order.type] &&
          Number.isFinite(order.at) &&
          order.at >= 0,
          'Ungültiger Spawn-Auftrag.'
        );

        if (order.at > next.elapsed) continue;

        const definition = definitions[order.type];
        const hp = order.type === 'boss'
          ? definition.hp
          : definition.hp * Math.pow(1.175, next.wave - 1);

        next.enemies[id] = {
          id,
          type: order.type,
          route: definition.route,
          d: 0,
          hp,
          max: hp
        };

        spawned.set(id, order.at);
        delete next.pending[id];
      }

      for (const [id, enemy] of Object.entries(next.enemies)) {
        const definition = definitions[enemy.type];

        requireValue(
          definition &&
          definition.route === enemy.route &&
          Number.isFinite(enemy.d) &&
          enemy.d >= 0,
          'Ungültiger Gegnerzustand.'
        );

        const time = spawned.has(id)
          ? Math.max(
              0,
              next.elapsed - Math.max(before, spawned.get(id))
            )
          : dt;

        enemy.d += definition.s * 40 * time;

        if (enemy.d >= paths[enemy.route].total) {
          next.baseLives = Math.max(
            0,
            next.baseLives - definition.dmg
          );
          delete next.enemies[id];

          if (next.baseLives === 0) {
            next.phase = 'lost';
            next.pending = {};
            next.enemies = {};
            break;
          }
        }
      }

      if (
        next.phase === 'running' &&
        Object.keys(next.pending).length === 0 &&
        Object.keys(next.enemies).length === 0
      ) {
        next.phase = next.wave === waves.length
          ? 'won'
          : 'preparation';
        next.skillPoints++;
        next.gold += 10;
      }

      next.revision++;
      return next;
    }

    function pause(state, uid) {
      host(state, uid);
      if (state.phase === 'paused') return state;

      requireValue(
        state.phase === 'running',
        'Keine laufende Welle zum Pausieren.'
      );

      return {
        ...clone(state),
        phase: 'paused',
        revision: state.revision + 1
      };
    }

    function resume(state, uid) {
      host(state, uid);

      requireValue(
        state.phase === 'paused',
        'Welle ist nicht pausiert.'
      );

      return {
        ...clone(state),
        phase: 'running',
        revision: state.revision + 1
      };
    }

    function project(state) {
      check(state);

      return {
        sessionId: state.sessionId,
        phase: state.phase,
        wave: state.wave,
        baseLives: state.baseLives,
        gold: state.gold,
        skillPoints: state.skillPoints,
        remaining:
          Object.keys(state.pending || {}).length +
          Object.keys(state.enemies || {}).length,
        enemies: Object.values(state.enemies || {}).map(enemy => {
          requireValue(
            paths[enemy.route],
            'Ungültige Gegnerroute.'
          );

          return {
            ...clone(enemy),
            ...position(paths[enemy.route], enemy.d)
          };
        })
      };
    }

    return Object.freeze({
      create, startWave, step, pause, resume, project
    });
  }

  return Object.freeze({ createEngine });
});
