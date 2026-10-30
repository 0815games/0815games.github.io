/**
 * Lokaler Netzadapter für das Grundgerüst.
 * Für Online-Coop später durch FirebaseRealtimeNet ersetzen.
 */
export class LocalNet {
  async createRoom(code) {
    this.room = { code, players: 1 };
    return this.room;
  }

  async joinRoom(code) {
    if (!this.room || this.room.code !== code) {
      this.room = { code, players: 2 };
    }
    return this.room;
  }

  async getPlayerCount(code) {
    return this.room?.code === code ? this.room.players : 0;
  }

  send() {}

  onState() {}
}