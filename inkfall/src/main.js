import { Game } from './core/game.js';
import { Lobby } from './coop/lobby.js';

const canvas = document.getElementById('game');
const lobbyElement = document.getElementById('lobby');
const statusElement = document.getElementById('lobby-status');

const game = new Game(canvas);
const lobby = new Lobby({
  onCreate: () => lobby.createRoom(),
  onJoin: (code) => lobby.joinRoom(code)
});

lobby.onStatus = (message) => {
  statusElement.textContent = message;
};

lobby.onSessionReady = (session) => {
  lobbyElement.classList.add('hidden');
  game.setSession(session);
  game.start();
};

lobby.init();
