(function () {
  "use strict";

  var game = window.UFOGame;

  function matches(query) {
    return window.matchMedia(query).matches;
  }

  game.core.device = {

    isTouch:
      matches("(pointer: coarse)"),

    hasFinePointer:
      matches("(pointer: fine)"),

    isPortrait:
      matches("(orientation: portrait)"),

    isLandscape:
      matches("(orientation: landscape)"),

    reducedMotion:
      matches("(prefers-reduced-motion: reduce)"),

    viewport: function () {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        ratio:
          window.innerWidth /
          Math.max(1, window.innerHeight)
      };
    }

  };

})();
