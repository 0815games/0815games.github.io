import { CoopSession } from './session.js';
import { FirebaseNet } from './net.js';

export class Lobby {
  constructor() {
    this.net = new FirebaseNet();
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

    try {
      const code = this.generateCode();
      const session = new CoopSession({ code, role: 'host', net: this.net });
      await session.open();
      this.onStatus(`Raum erstellt. Code: ${code}`);
      this.onSessionReady(session);
    } catch (error) {
      this.onStatus(error.message);
    }
  }

  async joinRoom(code) {
    this.onStatus(`Raum ${code} wird beigetreten …`);

    try {
      const session = new CoopSession({ code, role: 'guest', net: this.net });
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