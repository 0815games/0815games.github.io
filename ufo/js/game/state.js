(function () {
  "use strict";

  var game = window.UFOGame;

  function createInitialState() {
    return {

      run: false,
      paused: false,
      lost: false,

      score: 0,
      level: 1,

      hits: 0,
      jetDown: 0,

      playerName: "Spieler",

      slowUntil: 0,
      moonReady: 0,

      objects: [],
      sparks: [],
      raiders: [],

      stolen: Object.create(null)

    };
  }

  game.systems.state = {
    createInitialState:
      createInitialState
  };

})();
