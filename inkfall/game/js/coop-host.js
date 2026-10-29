(function(root, factory) {
  'use strict';

  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./coop-movement.js'));
  } else {
    root.InkfallCoopHost = factory(root.InkfallCoopMovement);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function(core) {
  'use strict';

  const LEASE_MS = 4000;
  const RENEW_MS = 1500;

  function requireValue(condition, message) {
    if (!condition) throw new Error(message);
  }

  function createHost(roomReference, session, uid, options = {}) {
    requireValue(
      core && typeof core.step === 'function',
      'Bewegungskern fehlt.'
    );

    requireValue(
      session &&
      session.schemaVersion === 1 &&
      typeof session.id === 'string' &&
      typeof session.hostUid === 'string' &&
      uid === session.hostUid,
      'Nur der Host darf die Bewegung berechnen.'
    );

    requireValue(
      roomReference &&
      typeof roomReference.get === 'function' &&
      typeof roomReference.child === 'function',
      'Ungültige Raumreferenz.'
    );

    requireValue(
      typeof options.writerId === 'string' &&
      /^[A-Za-z0-9_-]{1,80}$/.test(options.writerId),
      'Eindeutige Writer-ID fehlt.'
    );

    const initial = core.create(session);
    const sessionId = session.id;
    const hostUid = initial.players.host.uid;
    const guestUid = initial.players.guest.uid;
    const writerId = options.writerId;

    requireValue(hostUid === uid, 'Host-Zuordnung ist ungültig.');

    const now = options.now || (() => Date.now());
    requireValue(typeof now === 'function', 'Ungültige Uhr.');

    const reference = roomReference.child('movement');

    requireValue(
      reference && typeof reference.transaction === 'function',
      'Bewegungstransaktion fehlt.'
    );

    let inFlight = false;
    let stopped = false;

    async function process(operation, dt) {
      if (stopped) {
        return { committed:false, reason:'stopped' };
      }

      if (inFlight) {
        return { committed:false, reason:'busy' };
      }

      requireValue(
        Number.isFinite(dt) && dt >= 0 && dt <= 0.1,
        'Ungültiger Zeitschritt.'
      );

      const timestamp = now();

      requireValue(
        Number.isSafeInteger(timestamp) &&
        timestamp >= 0 &&
        timestamp <= Number.MAX_SAFE_INTEGER - LEASE_MS,
        'Ungültiger Zeitpunkt.'
      );

      inFlight = true;

      try {
        const snapshot = await roomReference.get();
        const room = snapshot.val();

        if (stopped) {
          return { committed:false, reason:'stopped' };
        }

        requireValue(
          room?.session?.id === sessionId &&
          room.session.hostUid === hostUid &&
          room.host?.uid === hostUid &&
          room.guest?.uid === guestUid &&
          room.session.players?.host?.uid === hostUid &&
          room.session.players?.guest?.uid === guestUid,
          'Sitzung oder Raumbelegung hat sich geändert.'
        );

        requireValue(
          ['preparation', 'running'].includes(room.session.phase),
          'Sitzung ist nicht für Bewegung freigegeben.'
        );

        const presence = { host:room.host, guest:room.guest };
        const commands = room.moveCommands || {};
        let reason = 'unchanged';

        const result = await reference.transaction(current => {
          if (stopped) {
            reason = 'stopped';
            return;
          }

          if (!current) {
            requireValue(
              operation === 'tick',
              'Bewegungszustand muss zuerst initialisiert werden.'
            );

            let created = core.create(room.session);
            created = core.step(created, {}, presence, 0);
            reason = 'initialized';

            return {
              ...created,
              lease: {
                writerId,
                until: timestamp + LEASE_MS
              }
            };
          }

          requireValue(
            current.sessionId === sessionId &&
            current.players?.host?.uid === hostUid &&
            current.players?.guest?.uid === guestUid,
            'Bewegungszustand gehört zu einer anderen Sitzung.'
          );

          // Bestehenden Zustand prüfen, ohne ihn zu verändern.
          core.step(current, {}, {
            host: { online:true },
            guest: { online:true }
          }, 0);

          const lease = current.lease;

          if (lease) {
            requireValue(
              typeof lease.writerId === 'string' &&
              Number.isSafeInteger(lease.until) &&
              lease.until >= 0,
              'Ungültige Host-Lease.'
            );
          }

          if (
            lease &&
            lease.writerId !== writerId &&
            lease.until > timestamp
          ) {
            reason = 'lease-owned';
            return;
          }

          const takeover = !lease || lease.writerId !== writerId || lease.until <= timestamp;
          let next;

          if (takeover) {
            // Nach Übernahme keine alten Laufaufträge fortsetzen.
            next = core.step(current, commands, {
              host: { online:false },
              guest: { online:false }
            }, 0);

            next = { ...next, paused:true };
            reason = 'takeover-paused';
          } else {
            next = operation === 'pause'
              ? core.step(current, commands, {
                  host: { online:false },
                  guest: { online:false }
                }, 0)
              : operation === 'resume'
                ? core.resume(current, commands, presence)
                : core.step(current, commands, presence, dt);

            if (
              next === current &&
              lease.until - timestamp > RENEW_MS
            ) {
              reason = 'unchanged';
              return;
            }

            reason = next === current
              ? 'lease-renewed'
              : operation;
          }

          return {
            ...next,
            revision: current.revision + 1,
            lease: {
              writerId,
              until: timestamp + LEASE_MS
            }
          };
        }, undefined, false);

        requireValue(
          result && typeof result.committed === 'boolean',
          'Host-Update wurde nicht bestätigt.'
        );

        if (!result.committed) {
          return { committed:false, reason };
        }

        const state = result.snapshot?.val();

        requireValue(
          state &&
          state.sessionId === sessionId &&
          state.lease?.writerId === writerId,
          'Bestätigter Host-Zustand ist ungültig.'
        );

        return { committed:true, reason, state };
      } finally {
        inFlight = false;
      }
    }

    return Object.freeze({
      tick: dt => process('tick', dt),
      resume: () => process('resume', 0),
      pause: () => process('pause', 0),
      stop: () => { stopped = true; }
    });
  }

  return Object.freeze({ LEASE_MS, createHost });
});
