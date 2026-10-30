export class CoopSession {
  static MAX_PLAYERS = 2;

  constructor({ code, role, net }) {
    this.code = code;
    this.role = role;
    this.net = net;
    this.players = new Map();
    this.onPlayersChanged = () => {};
  }

  async open() {
    await this.net.createRoom(this.code);
    this.addLocalPlayer('host');
    this.watchPlayers();
  }

  async join() {
    const playerCount = await this.net.getPlayerCount(this.code);

    if (playerCount >= CoopSession.MAX_PLAYERS) {
      throw new Error('Raum ist voll. Maximal 2 Spieler erlaubt.');
    }

    await this.net.joinRoom(this.code);
    this.addLocalPlayer('guest');
    this.watchPlayers();
  }

  addLocalPlayer(role) {
    const id = role === 'host' ? 'host' : 'guest';
    this.players.set(id, { id, role });
  }

  watchPlayers() {
    this.net.onPlayers(this.code, (players) => {
      this.remotePlayers = players ?? {};
      this.onPlayersChanged(this.remotePlayers);
    });
  }

  getPlayers() {
    return this.players;
  }

  isHost() {
    return this.role === 'host';
  }
}