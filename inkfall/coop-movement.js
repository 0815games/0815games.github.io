(function(root, factory) {
  'use strict';
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.InkfallCoopMovement = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const SLOTS = ['host', 'guest'];
  const SPEED = 150;
  const WIDTH = 940;
  const HEIGHT = 600;

  function point(value) {
    return value &&
      Number.isFinite(value.x) &&
      Number.isFinite(value.y) &&
      value.x >= 0 && value.x <= WIDTH &&
      value.y >= 0 && value.y <= HEIGHT;
  }

  function check(state) {
    if (
      !state ||
      state.schemaVersion !== 1 ||
      typeof state.sessionId !== 'string' ||
      !Number.isSafeInteger(state.revision) ||
      state.revision < 0 ||
      state.revision >= Number.MAX_SAFE_INTEGER ||
      typeof state.paused !== 'boolean'
    ) {
      throw new Error('Ungültiger Bewegungszustand.');
    }

    for (const slot of SLOTS) {
      const player = state.players?.[slot];

      if (
        !point(player) ||
        typeof player.uid !== 'string' ||
        !player.uid ||
        !Number.isSafeInteger(player.ack) ||
        player.ack < 0 ||
        (player.target != null && !point(player.target))
      ) {
        throw new Error('Ungültige Spielerdaten.');
      }
    }

    if (state.players.host.uid === state.players.guest.uid) {
      throw new Error('Spieler müssen verschieden sein.');
    }
  }

  function create(session) {
    if (
      !session ||
      session.schemaVersion !== 1 ||
      typeof session.id !== 'string' ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(session.id) ||
      session.players?.host?.uid !== session.hostUid
    ) {
      throw new Error('Ungültige Sitzung.');
    }

    const state = {
      schemaVersion: 1,
      sessionId: session.id,
      revision: 0,
      paused: false,
      players: {}
    };

    for (const slot of SLOTS) {
      const player = session.players?.[slot];
      state.players[slot] = {
        uid: player?.uid,
        x: player?.x,
        y: player?.y,
        target: null,
        ack: 0
      };
    }

    check(state);
    return state;
  }

  function validCommand(command, state, slot) {
    return Boolean(
      command &&
      command.sessionId === state.sessionId &&
      command.uid === state.players[slot].uid &&
      Number.isSafeInteger(command.seq) &&
      command.seq > state.players[slot].ack &&
      point(command)
    );
  }

  function online(presence) {
    return SLOTS.every(slot => presence?.[slot]?.online === true);
  }

  function copy(state) {
    return {
      ...state,
      players: Object.fromEntries(SLOTS.map(slot => {
        const player = state.players[slot];
        return [
          slot,
          {
            ...player,
            target: player.target ? { ...player.target } : null
          }
        ];
      }))
    };
  }

  function sameTarget(a, b) {
    return (!a && !b) ||
      Boolean(a && b && a.x === b.x && a.y === b.y);
  }

  function finish(before, after) {
    const changed =
      before.paused !== after.paused ||
      SLOTS.some(slot => {
        const a = before.players[slot];
        const b = after.players[slot];

        return a.x !== b.x ||
          a.y !== b.y ||
          a.ack !== b.ack ||
          !sameTarget(a.target, b.target);
      });

    if (!changed) return before;

    after.revision = before.revision + 1;
    return after;
  }

  function discardTargets(next, commands) {
    for (const slot of SLOTS) {
      if (validCommand(commands?.[slot], next, slot)) {
        next.players[slot].ack = commands[slot].seq;
      }
      next.players[slot].target = null;
    }
  }

  function step(state, commands, presence, dt) {
    check(state);

    if (!Number.isFinite(dt) || dt < 0 || dt > 0.1) {
      throw new Error(
        'Zeitschritt muss zwischen 0 und 0.1 Sekunden liegen.'
      );
    }

    const next = copy(state);

    if (state.paused || !online(presence)) {
      next.paused = true;
      discardTargets(next, commands);
      return finish(state, next);
    }

    for (const slot of SLOTS) {
      const player = next.players[slot];
      const command = commands?.[slot];

      if (validCommand(command, state, slot)) {
        player.ack = command.seq;
        player.target = { x: command.x, y: command.y };
      }

      if (!player.target || dt === 0) continue;

      const dx = player.target.x - player.x;
      const dy = player.target.y - player.y;
      const distance = Math.hypot(dx, dy);
      const travel = SPEED * dt;

      if (distance <= travel) {
        player.x = player.target.x;
        player.y = player.target.y;
        player.target = null;
      } else {
        player.x += dx / distance * travel;
        player.y += dy / distance * travel;
      }
    }

    return finish(state, next);
  }

  function resume(state, commands, presence) {
    check(state);

    if (!online(presence)) {
      throw new Error('Beide Spieler müssen verbunden sein.');
    }

    if (!state.paused) return state;

    const next = copy(state);
    next.paused = false;
    discardTargets(next, commands);
    return finish(state, next);
  }

  return Object.freeze({ SPEED, create, step, resume });
});
