import { CoopSession } from './session.js';
import { LocalNet } from './net.js';

export class Lobby {
  constructor({ onCreate, onJoin }) {
    this.net = new LocalNet();
    this.onCreate = onCreate;
    this.onJoin = onJoin;
    this.onStatus = () => {};
    this.onSessionReady = () => {};
  }

  init() {
    document.getElementById('create-room')?.addEventListener('click', () => {
      this.createRoom();
    });

    document.getElementById('join-room')?.addEventListener('click', () => {
      const code = document.getElementById('room-code').value.trim().toUpperCase();
      if (code.length === 6) this.joinRoom(code);
    });
  }

  async createRoom() {
    this.onStatus('Raum wird erstellt …');
    const code = this.generateCode();
    const session = new CoopSession({ code, role: 'host', net: this.net });
    await session.open();
    this.onStatus(`Raum erstellt. Code: ${code}`);
    this.onSessionReady(session);
  }

  async joinRoom(code) {
    this.onStatus(`Raum ${code} wird beigetreten …`);
    const session = new CoopSession({ code, role: 'guest', net: this.net });
    try {
      await session.join();
      this.onStatus(`Raum ${code} beigetreten.`);
      this.onSessionReady(session);
    } catch (error) {
      this.onStatus(error.message);
    }
  }

  generateCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join('');
  }
}