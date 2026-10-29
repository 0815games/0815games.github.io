(function(root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./coop-session.js'));
  } else {
    root.InkfallCoopStart = factory(root.InkfallCoopSession);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(sessionApi) {
  'use strict';

  function requireValue(condition, message) {
    if (!condition) throw new Error(message);
  }

  function validateSession(session, room, options) {
    requireValue(
      session &&
      session.schemaVersion === sessionApi.VERSION &&
      typeof session.id === 'string' &&
      /^[A-Za-z0-9_-]{1,80}$/.test(session.id) &&
      session.roomCode === options.roomCode &&
      session.hostUid === room.host.uid &&
      session.players?.host?.uid === room.host.uid &&
      session.players?.guest?.uid === room.guest.uid &&
      Number.isSafeInteger(session.revision) &&
      session.revision >= 0 &&
      [
        'preparation',
        'running',
        'paused',
        'won',
        'lost',
        'closed'
      ].includes(session.phase),
      'Vorhandene Sitzung passt nicht zum Raum. Bitte nicht erneut starten.'
    );

    return session;
  }

  async function start(roomReference, options) {
    requireValue(
      sessionApi && typeof sessionApi.create === 'function',
      'Coop-Sitzungsmodul fehlt. coop-session.js zuerst laden.'
    );

    requireValue(
      roomReference &&
      typeof roomReference.get === 'function' &&
      typeof roomReference.child === 'function',
      'Ungültige Raumreferenz.'
    );

    requireValue(
      options && typeof options.actorUid === 'string',
      'Spieler-ID fehlt.'
    );

    const snapshot = await roomReference.get();
    const room = snapshot.val();

    requireValue(
      room && room.host && room.guest,
      'Zwei Spieler im Raum erforderlich.'
    );

    requireValue(
      options.actorUid === room.host.uid,
      'Nur der Host darf die Sitzung erstellen.'
    );

    requireValue(
      room.status === 'prepared',
      'Vorbereitung muss zuerst bestätigt werden.'
    );

    // B1 prüft unter anderem Klassen, Bereitschaft und Verbindung.
    const candidate = sessionApi.create(room, options);

    const reference = roomReference.child('session');

    requireValue(
      reference && typeof reference.transaction === 'function',
      'Sitzungstransaktion ist nicht verfügbar.'
    );

    const result = await reference.transaction(current => {
      // Bestehende Sitzungen niemals durch einen zweiten Start ersetzen.
      if (current !== null && current !== undefined) return;

      return candidate;
    }, undefined, false);

    requireValue(
      result &&
      typeof result.committed === 'boolean' &&
      result.snapshot &&
      typeof result.snapshot.val === 'function',
      'Sitzungserstellung wurde nicht bestätigt.'
    );

    const session = validateSession(
      result.snapshot.val(),
      room,
      options
    );

    return {
      created: result.committed,
      session
    };
  }

  return Object.freeze({ start });
});
