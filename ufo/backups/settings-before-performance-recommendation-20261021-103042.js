(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};

  var STORAGE_KEY =
    "ufoGameSettingsV1";

  var isTouch =
    window.matchMedia(
      "(pointer: coarse)"
    ).matches;

  var defaults = {

    graphics:
      isTouch
        ? "mid"
        : "high",

    targetFps:
      isTouch
        ? 30
        : 60,

    /*
     * Für zukünftige Settings bereits vorgesehen.
     * Noch ohne Einfluss auf das aktuelle Spiel.
     */
    music: true,
    musicVolume: 0.75,

    sfx: true,
    sfxVolume: 0.85,

    haptics: true

  };


  var state =
    Object.assign(
      {},
      defaults
    );


  var profiles = {

    low: {
      id: "low",
      label: "LOW",

      maxDpr: 1.0,

      stars: 70,
      meteors: 1,

      grass: 50,
      dust: 12,
      fireflies: 8,

      sparkScale: 0.40,
      shadowScale: 0.25,

      effects: "reduced"
    },

    mid: {
      id: "mid",
      label: "MID",

      maxDpr: 1.25,

      stars: 120,
      meteors: 2,

      grass: 90,
      dust: 25,
      fireflies: 14,

      sparkScale: 0.65,
      shadowScale: 0.60,

      effects: "medium"
    },

    high: {
      id: "high",
      label: "HIGH",

      maxDpr: 1.75,

      stars: 180,
      meteors: 4,

      grass: 140,
      dust: 42,
      fireflies: 24,

      sparkScale: 0.85,
      shadowScale: 0.85,

      effects: "full"
    }

  };


  function load() {

    try {

      var stored =
        JSON.parse(
          localStorage.getItem(
            STORAGE_KEY
          ) || "{}"
        );

      state =
        Object.assign(
          {},
          defaults,
          stored
        );

    }

    catch (error) {

      state =
        Object.assign(
          {},
          defaults
        );

      console.warn(
        "Settings konnten nicht geladen werden:",
        error
      );

    }


    if (
      !profiles[
        state.graphics
      ]
    ) {
      state.graphics =
        defaults.graphics;
    }

  }


  function save() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

    }

    catch (error) {

      console.warn(
        "Settings konnten nicht gespeichert werden:",
        error
      );

    }

  }


  function profile() {

    return (
      profiles[
        state.graphics
      ] ||
      profiles.mid
    );

  }


  function applyGraphics() {

    var selected =
      profile();


    document.body.dataset.graphics =
      selected.id;


    document.documentElement
      .style
      .setProperty(
        "--game-max-dpr",
        selected.maxDpr
      );


    window.dispatchEvent(
      new CustomEvent(
        "ufo:graphics-change",
        {
          detail: {
            quality:
              selected.id,

            profile:
              selected
          }
        }
      )
    );

  }


  function setGraphics(value) {

    value =
      String(value)
        .toLowerCase();


    if (!profiles[value]) {
      return false;
    }


    state.graphics =
      value;


    save();
    applyGraphics();


    return true;

  }


  function get(key) {

    return state[key];

  }


  function set(key, value) {

    if (
      key === "graphics"
    ) {
      return setGraphics(
        value
      );
    }


    state[key] =
      value;


    save();


    window.dispatchEvent(
      new CustomEvent(
        "ufo:settings-change",
        {
          detail: {
            key: key,
            value: value
          }
        }
      )
    );


    return true;

  }


  load();


  window.UFOGame.settings = {

    get: get,
    set: set,

    setGraphics:
      setGraphics,

    setTargetFps:
      function (value) {

        value =
          Number(value) === 30
            ? 30
            : 60;

        return set(
          "targetFps",
          value
        );

      },

    getTargetFps:
      function () {

        return (
          Number(state.targetFps) === 30
            ? 30
            : 60
        );

      },

    getGraphics:
      function () {
        return state.graphics;
      },

    getGraphicsProfile:
      profile,

    getAll:
      function () {

        return Object.assign(
          {},
          state
        );

      },

    profiles:
      profiles

  };


  /*
   * DOM kann beim Laden dieses Scripts schon existieren.
   */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      applyGraphics,
      {
        once: true
      }
    );

  }

  else {
    applyGraphics();
  }

})();
