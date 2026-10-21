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
      stars: 90,
      meteors: 2,
      sparkScale: 0.45,
      effects: "reduced"
    },

    mid: {
      id: "mid",
      label: "MID",
      maxDpr: 1.5,
      stars: 150,
      meteors: 3,
      sparkScale: 0.7,
      effects: "medium"
    },

    high: {
      id: "high",
      label: "HIGH",
      maxDpr: 4,
      stars: 220,
      meteors: 5,
      sparkScale: 1,
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
