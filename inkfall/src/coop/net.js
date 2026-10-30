import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase,
  ref,
  get,
  set,
  onValue,
  onDisconnect,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import { firebaseConfig } from '../firebase-config.js';

export class FirebaseNet {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getDatabase(this.app);
    this.playerId = crypto.randomUUID();
  }

  roomRef(code) {
    return ref(this.db, `rooms/${code}`);
  }

  async createRoom(code) {
    const hostRef = ref(this.db, `rooms/${code}/players/host`);

    await set(hostRef, {
      playerId: this.playerId,
      role: 'host',
      joinedAt: serverTimestamp()
    });

    onDisconnect(hostRef).remove();
    return { code, role: 'host' };
  }

  async joinRoom(code) {
    const playersSnapshot = await get(ref(this.db, `rooms/${code}/players`));
    const players = playersSnapshot.val() ?? {};

    if (Object.keys(players).length >= 2) {
      throw new Error('Raum ist voll. Maximal 2 Spieler erlaubt.');
    }

    const guestRef = ref(this.db, `rooms/${code}/players/guest`);

    await set(guestRef, {
      playerId: this.playerId,
      role: 'guest',
      joinedAt: serverTimestamp()
    });

    onDisconnect(guestRef).remove();
    return { code, role: 'guest' };
  }

  async getPlayerCount(code) {
    const snapshot = await get(ref(this.db, `rooms/${code}/players`));
    return Object.keys(snapshot.val() ?? {}).length;
  }

  send(code, event) {
    const eventRef = ref(this.db, `rooms/${code}/events/${crypto.randomUUID()}`);
    return set(eventRef, {
      ...event,
      playerId: this.playerId,
      createdAt: serverTimestamp()
    });
  }

  onState(code, callback) {
    return onValue(ref(this.db, `rooms/${code}/state`), (snapshot) => {
      callback(snapshot.val());
    });
  }
}

export class LocalNet {
  async createRoom(code) {
    this.room = { code, players: 1 };
    return { code, role: 'host' };
  }

  async joinRoom(code) {
    if (!this.room || this.room.code !== code) {
      this.room = { code, players: 2 };
    }
    return { code, role: 'guest' };
  }

  async getPlayerCount(code) {
    return this.room?.code === code ? this.room.players : 0;
  }

  send() {}

  onState() {}
}