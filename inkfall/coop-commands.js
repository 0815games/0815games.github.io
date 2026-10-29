(function(root, factory) {
  'use strict';
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.InkfallCoopCommands = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  function requireValue(condition, message) {
    if (!condition) throw new Error(message);
  }

  function point(x, y) {
    return Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= 0 && x <= 940 &&
      y >= 0 && y <= 600;
  }

  // rect beschreibt den Canvas-Inhalt ohne Rahmen und Padding.
  function mapPoint(clientX, clientY, rect) {
    requireValue(
      rect &&
      [
        clientX, clientY,
        rect.left, rect.top, rect.width, rect.height
      ].every(Number.isFinite) &&
      rect.width > 0 &&
      rect.height > 0,
      'Ungültige Zeichenfläche.'
    );

    const x = (clientX - rect.left) / rect.width * 940;
    const y = (clientY - rect.top) / rect.height * 600;

    requireValue(point(x, y), 'Klick liegt außerhalb der Karte.');
    return { x, y };
  }

  function createSender(roomReference, session, uid) {
    requireValue(
      roomReference &&
      typeof roomReference.get === 'function' &&
      typeof roomReference.child === 'function',
      'Ungültige Raumreferenz.'
    );

    requireValue(
      session &&
      session.schemaVersion === 1 &&
      typeof session.id === 'string' &&
      /^[A-Za-z0-9_-]{1,80}$/.test(session.id) &&
      /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(session.roomCode),
      'Ungültige Sitzung.'
    );

    const hostUid = session.players?.host?.uid;
    const guestUid = session.players?.guest?.uid;

    requireValue(
      typeof hostUid === 'string' &&
      typeof guestUid === 'string' &&
      hostUid !== guestUid &&
      hostUid === session.hostUid,
      'Ungültige Spielerplätze.'
    );

    requireValue(
      typeof uid === 'string' &&
      uid.length > 0 &&
      (uid === hostUid || uid === guestUid),
      'Spieler gehört nicht zur Sitzung.'
    );

    const slot = uid === hostUid ? 'host' : 'guest';
    const sessionId = session.id;
    const reference = roomReference.child('moveCommands/' + slot);

    requireValue(
      reference && typeof reference.transaction === 'function',
      'Befehlsübertragung ist nicht verfügbar.'
    );

    let pending = Promise.resolve();

    async function perform(x, y) {
      const snapshot = await roomReference.get();
      const room = snapshot.val();

      requireValue(
        room?.session?.id === sessionId &&
        room.host?.uid === hostUid &&
        room.guest?.uid === guestUid &&
        room.session.hostUid === hostUid &&
        room.session.players?.host?.uid === hostUid &&
        room.session.players?.guest?.uid === guestUid,
        'Sitzung oder Raumbelegung hat sich geändert.'
      );

      requireValue(
        ['preparation', 'running'].includes(room.session.phase) &&
        room.movement?.paused !== true,
        'Bewegung ist pausiert oder beendet.'
      );

      requireValue(
        room.host.online === true && room.guest.online === true,
        'Beide Spieler müssen verbunden sein.'
      );

      const result = await reference.transaction(current => {
        let seq = 0;

        if (current?.sessionId === sessionId) {
          requireValue(
            current.uid === uid &&
            Number.isSafeInteger(current.seq) &&
            current.seq >= 1,
            'Gespeicherter Befehl ist ungültig.'
          );
          seq = current.seq;
        }

        requireValue(
          seq < Number.MAX_SAFE_INTEGER,
          'Befehlszähler ist ausgeschöpft.'
        );

        return {
          sessionId,
          uid,
          seq: seq + 1,
          x,
          y
        };
      }, undefined, false);

      requireValue(
        result?.committed === true &&
        result.snapshot &&
        typeof result.snapshot.val === 'function',
        'Bewegungsbefehl wurde nicht bestätigt.'
      );

      const saved = result.snapshot.val();

      requireValue(
        saved &&
        saved.sessionId === sessionId &&
        saved.uid === uid &&
        Number.isSafeInteger(saved.seq) &&
        saved.seq >= 1 &&
        saved.x === x &&
        saved.y === y,
        'Bestätigter Bewegungsbefehl ist ungültig.'
      );

      return {
        sessionId: saved.sessionId,
        uid: saved.uid,
        seq: saved.seq,
        x: saved.x,
        y: saved.y
      };
    }

    function sendTarget(x, y) {
      if (!point(x, y)) {
        return Promise.reject(
          new Error('Ungültiges Bewegungsziel.')
        );
      }

      // Klicks innerhalb dieses Senders in Reihenfolge verarbeiten.
      // Ein Fehler darf die Warteschlange nicht dauerhaft blockieren.
      const task = pending.then(() => perform(x, y));
      pending = task.catch(() => {});
      return task;
    }

    return Object.freeze({ slot, sendTarget });
  }

  return Object.freeze({ mapPoint, createSender });
});
