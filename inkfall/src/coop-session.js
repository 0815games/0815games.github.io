(function(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.InkfallCoopSession = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const VERSION = 1;
  const NEXT = {
    preparation: ['running', 'closed'],
    running: ['paused', 'won', 'lost', 'closed'],
    paused: ['running', 'closed'],
    won: ['closed'],
    lost: ['closed'],
    closed: []
  };

  function requireValue(condition, message) {
    if (!condition) throw new Error(message);
  }

  function copy(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function player(source, slot) {
    requireValue(
      source &&
      typeof source.uid === 'string' &&
      source.uid.length > 0 &&
      source.uid.length <= 128,
      'Spieler-ID fehlt.'
    );

    requireValue(
      ['knight', 'mage'].includes(source.heroClass),
      'Klasse nicht verfügbar.'
    );

    requireValue(
      source.ready === true && source.online === true,
      'Beide Spieler müssen bereit und verbunden sein.'
    );

    const name = typeof source.name === 'string'
      ? source.name.trim()
      : '';

    requireValue(
      name.length >= 3 && name.length <= 20,
      'Ungültiger Spielername.'
    );

    const fallback = source.heroClass === 'mage'
      ? 'Elementarmagier'
      : 'Ritter';

    const heroName = typeof source.heroName === 'string'
      ? source.heroName.trim()
      : fallback;

    requireValue(
      heroName.length >= 3 &&
      heroName.length <= 20 &&
      !/[\u0000-\u001f\u007f]/.test(heroName),
      'Ungültiger Heldenname.'
    );

    return {
      uid: source.uid,
      name,
      heroClass: source.heroClass,
      heroName,
      online: true,
      x: slot === 'host' ? 120 : 170,
      y: 300,
      target: null
    };
  }

  function create(room, options) {
    requireValue(
      room && ['waiting', 'prepared'].includes(room.status),
      'Raum nicht startbereit.'
    );

    requireValue(
      options &&
      /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(options.roomCode),
      'Ungültiger Raumcode.'
    );

    requireValue(
      typeof options.sessionId === 'string' &&
      /^[A-Za-z0-9_-]{1,80}$/.test(options.sessionId),
      'Ungültige Sitzungs-ID.'
    );

    requireValue(
      Number.isSafeInteger(options.now) && options.now >= 0,
      'Ungültiger Startzeitpunkt.'
    );

    const host = player(room.host, 'host');
    const guest = player(room.guest, 'guest');

    requireValue(
      host.uid !== guest.uid,
      'Zwei unterschiedliche Accounts erforderlich.'
    );

    requireValue(
      options.actorUid === host.uid,
      'Nur der Host darf die Sitzung erstellen.'
    );

    return {
      schemaVersion: VERSION,
      id: options.sessionId,
      roomCode: options.roomCode,
      hostUid: host.uid,
      createdAt: options.now,
      revision: 0,
      phase: 'preparation',
      wave: 0,
      base: { lives: 100 },
      economy: { gold: 150 },
      players: { host, guest },
      towers: [],
      enemies: [],
      projectiles: []
    };
  }

  function check(state) {
    requireValue(
      state &&
      state.schemaVersion === VERSION &&
      Object.prototype.hasOwnProperty.call(NEXT, state.phase) &&
      Number.isSafeInteger(state.revision) &&
      state.revision >= 0 &&
      state.players?.host?.uid === state.hostUid &&
      typeof state.players?.guest?.uid === 'string' &&
      state.players.guest.uid !== state.hostUid,
      'Ungültige Coop-Sitzung.'
    );
  }

  function transition(state, phase, actorUid) {
    check(state);

    requireValue(
      actorUid === state.hostUid,
      'Nur der Host darf die Spielphase ändern.'
    );

    requireValue(
      NEXT[state.phase].includes(phase),
      'Phasenwechsel nicht erlaubt.'
    );

    if (phase === 'running') {
      requireValue(
        state.players.host.online && state.players.guest.online,
        'Start oder Fortsetzung nur mit zwei verbundenen Spielern.'
      );
    }

    const result = copy(state);
    result.phase = phase;
    result.revision++;
    return result;
  }

  function connection(state, actorUid, online) {
    check(state);

    requireValue(
      state.phase !== 'closed',
      'Sitzung ist geschlossen.'
    );

    requireValue(
      typeof online === 'boolean',
      'Verbindungsstatus muss boolesch sein.'
    );

    const slot = ['host', 'guest'].find(
      key => state.players[key].uid === actorUid
    );

    requireValue(slot, 'Spieler gehört nicht zur Sitzung.');

    if (state.players[slot].online === online) return state;

    const result = copy(state);
    result.players[slot].online = online;

    if (!online && result.phase === 'running') {
      result.phase = 'paused';
    }

    result.revision++;
    return result;
  }

  return Object.freeze({
    VERSION,
    create,
    transition,
    connection
  });
});
