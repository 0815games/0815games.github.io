(function () {
  "use strict";

  var game = window.UFOGame;

  game.systems.renderer = {

    /*
     * Ziel:
     *
     * Der Renderer bekommt später Canvas +
     * Context und ruft die Teilrenderer auf.
     *
     * Der Game-State entscheidet WAS existiert.
     * Der Renderer entscheidet WIE es aussieht.
     */

    ready: true

  };

})();
