// Block E, Scheibe 2: Treffer-Feedback als reine Darstellungslogik.
//
// Die Simulation meldet Treffer, Ausfall und Reparatur als Ereignisse
// (`enemyAttack`, `soldierDown`, `towerDisabled`, `soldierReturn`,
// `towerRepaired`). Dieses Modul übersetzt sie in Ansagen: Wer wurde
// getroffen, wie stark, und was die Gegenmaßnahme ist. Es entscheidet
// nichts über Schaden, Leben oder Belohnungen – es erklärt nur, was die
// Simulation bereits entschieden hat. Die Drosselung verhindert, dass ein
// Dauerbeschuss die Funkzeile flutet: Alarme (Ausfall) kommen immer,
// gewöhnliche Treffer höchstens einmal je Schlüssel und Zeitfenster.

export const HIT_ANNOUNCE_COOLDOWN_MS = 7000;

const DESCRIPTORS = Object.freeze({
  soldierHitOwn: Object.freeze({
    kind: 'soldierHit', severity: 'warn', fx: 'soldierHit',
    message: 'Infantry hit you! −{damage} life. Step out of the ringed enemy\'s reach to dodge the next strike.',
  }),
  soldierHitAlly: Object.freeze({
    kind: 'soldierHit', severity: 'warn', fx: 'soldierHit',
    message: 'Your teammate is under fire! −{damage} life. Infantry shoots at soldiers in reach.',
  }),
  towerHit: Object.freeze({
    kind: 'towerHit', severity: 'warn', fx: 'towerHit',
    message: 'A tank hit your tower! −{damage} life. Repair it from its panel before it falls silent.',
  }),
  soldierDownOwn: Object.freeze({
    kind: 'soldierDown', severity: 'alert', fx: 'soldierHit',
    message: 'You are down! No penalty — you return at the bunker in {seconds} s with brief protection.',
  }),
  soldierDownAlly: Object.freeze({
    kind: 'soldierDown', severity: 'alert', fx: 'soldierHit',
    message: 'Teammate down! They return at the bunker in {seconds} s — they are not disconnected.',
  }),
  towerDisabled: Object.freeze({
    kind: 'towerDisabled', severity: 'alert', fx: 'towerHit',
    message: 'Tower disabled! It stays on its pad and stops firing. Repair it, or hold until the wave ends.',
  }),
  soldierReturnOwn: Object.freeze({
    kind: 'soldierReturn', severity: 'info', fx: null,
    message: 'Back in the fight! Brief protection is active — reposition before it fades.',
  }),
  towerRepaired: Object.freeze({
    kind: 'towerRepaired', severity: 'info', fx: null,
    message: 'Tower repaired and firing again.',
  }),
});

// `ownId` ist die eigene Spieler-ID in dieser Partie (`local` solo, die
// Netz-ID im Koop). Ohne Treffer auf einen bekannten Deskriptor: null.
export function hitFeedbackForEvent(event, ownId = null) {
  if (!event || typeof event !== 'object') return null;
  switch (event.type) {
    case 'enemyAttack': {
      if (event.target === 'soldier') {
        const own = event.playerId != null && event.playerId === ownId;
        const base = own ? DESCRIPTORS.soldierHitOwn : DESCRIPTORS.soldierHitAlly;
        return {...base, key: `soldier:${event.playerId ?? '?'}`, params: {damage: event.damage}};
      }
      if (event.target === 'tower') {
        return {...DESCRIPTORS.towerHit, key: `tower:${event.pad ?? '?'}`, params: {damage: event.damage}};
      }
      return null;
    }
    case 'soldierDown': {
      const own = event.playerId != null && event.playerId === ownId;
      const base = own ? DESCRIPTORS.soldierDownOwn : DESCRIPTORS.soldierDownAlly;
      return {...base, key: `down:${event.playerId ?? '?'}`, params: {seconds: event.seconds ?? 8}};
    }
    case 'towerDisabled':
      return {...DESCRIPTORS.towerDisabled, key: `disabled:${event.pad ?? '?'}`, params: {}};
    case 'soldierReturn': {
      if (event.playerId == null || event.playerId !== ownId) return null;
      return {...DESCRIPTORS.soldierReturnOwn, key: `return:${event.playerId}`, params: {}};
    }
    case 'towerRepaired':
      return {...DESCRIPTORS.towerRepaired, key: `repaired:${event.pad ?? '?'}`, params: {}};
    default:
      return null;
  }
}

// Drosselung mit injizierbarer Uhr, damit Tests ohne Wanduhr auskommen.
// Alarme (Ausfall eines Soldaten oder Turms) werden nie gedrosselt; sie
// setzen die Uhr ihres Schlüssels neu, damit der nächste gewöhnliche
// Treffer danach nicht sofort wieder ansagt.
export function createHitAnnouncer({cooldownMs = HIT_ANNOUNCE_COOLDOWN_MS, clock = () => Date.now()} = {}) {
  const lastAnnounced = new Map();
  return {
    shouldAnnounce(descriptor, now = clock()) {
      if (!descriptor) return false;
      if (descriptor.severity === 'alert') {
        lastAnnounced.set(descriptor.key, now);
        return true;
      }
      const last = lastAnnounced.get(descriptor.key);
      if (last != null && now - last < cooldownMs) return false;
      lastAnnounced.set(descriptor.key, now);
      return true;
    },
    reset() { lastAnnounced.clear(); },
  };
}
