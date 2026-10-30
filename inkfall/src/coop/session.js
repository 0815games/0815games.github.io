export class CoopSession {
  static MAX_PLAYERS = 2;

  constructor({ code, role, net }) {
    this.code = code;
    this.role = role;
    this.net = net;
    this.players = new Map();
  }

  async open() {
    await this.net.createRoom(this.code);
    this.addLocalPlayer('host');
  }

  async join() {
    const playerCount = await this.net.getPlayerCount(this.code);

    if (playerCount >= CoopSession.MAX_PLAYERS) {
      throw new Error('Raum ist voll. Maximal 2 Spieler erlaubt.');
    }

    await this.net.joinRoom(this.code);
    this.addLocalPlayer('guest');
  }

  addLocalPlayer(role) {
    const id = role === 'host' ? 'player-1' : 'player-2';
    this.players.set(id, { id, role });
  }

  getPlayers() {
    return this.players;
  }

  isHost() {
    return this.role === 'host';
  }
}