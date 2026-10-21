(function () {
  "use strict";

  var game = window.UFOGame;

  game.core.utils = {

    clamp: function (value, min, max) {
      return Math.min(
        max,
        Math.max(min, value)
      );
    },

    random: function (min, max) {
      return (
        min +
        Math.random() * (max - min)
      );
    },

    randomInt: function (min, max) {
      return Math.floor(
        min +
        Math.random() *
        (max - min + 1)
      );
    },

    now: function () {
      return performance.now();
    },

    isFiniteNumber: function (value) {
      return (
        typeof value === "number" &&
        Number.isFinite(value)
      );
    }

  };

})();
