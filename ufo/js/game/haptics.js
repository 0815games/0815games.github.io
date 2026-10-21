(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var settings =
    window.UFOGame.settings;


  function enabled() {

    return (
      settings &&
      settings.get("haptics") !== false &&
      typeof navigator.vibrate === "function"
    );

  }


  function vibrate(pattern) {

    if (!enabled()) {
      return false;
    }


    try {

      return navigator.vibrate(
        pattern
      );

    }

    catch (error) {

      console.warn(
        "Haptisches Feedback fehlgeschlagen:",
        error
      );


      return false;

    }

  }


  window.UFOGame.haptics = {

    vibrate: vibrate,

    hit:
      function () {
        return vibrate(18);
      },

    shot:
      function () {
        return vibrate(10);
      },

    warning:
      function () {

        return vibrate(
          [
            45,
            28,
            70
          ]
        );

      },

    levelUp:
      function () {

        return vibrate(
          [
            28,
            42,
            28,
            42,
            70
          ]
        );

      },

    launch:
      function () {

        return vibrate(
          [
            18,
            36,
            28,
            42,
            65
          ]
        );

      },

    isEnabled:
      enabled

  };

})();
