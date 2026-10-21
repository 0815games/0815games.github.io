(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var settings =
    window.UFOGame.settings;


  if (!settings) {

    console.error(
      "Performance Recommendation: Settings-Service fehlt."
    );

    return;
  }


  var SETTINGS_KEY =
    "ufoGameSettingsV1";


  var recommendation = null;


  function safeNumber(
    value,
    fallback
  ) {

    value =
      Number(value);


    return Number.isFinite(value)
      ? value
      : fallback;

  }


  function readStoredSettings() {

    try {

      return JSON.parse(
        localStorage.getItem(
          SETTINGS_KEY
        ) || "{}"
      );

    }

    catch (error) {

      console.warn(
        "Gespeicherte Performance-Einstellungen konnten nicht gelesen werden:",
        error
      );


      return {};

    }

  }


  function collectDeviceInfo() {

    var width =
      Math.max(
        1,
        window.screen.width ||
        window.innerWidth ||
        1
      );


    var height =
      Math.max(
        1,
        window.screen.height ||
        window.innerHeight ||
        1
      );


    var dpr =
      Math.max(
        1,
        safeNumber(
          window.devicePixelRatio,
          1
        )
      );


    var cores =
      Math.max(
        1,
        safeNumber(
          navigator.hardwareConcurrency,
          4
        )
      );


    var memory =
      typeof navigator.deviceMemory ===
      "number"
        ? navigator.deviceMemory
        : null;


    var coarsePointer =
      window.matchMedia(
        "(pointer: coarse)"
      ).matches;


    var renderedPixels =
      width *
      height *
      dpr *
      dpr;


    var renderedMegapixels =
      renderedPixels /
      1000000;


    return {

      width:
        width,

      height:
        height,

      dpr:
        dpr,

      cores:
        cores,

      memory:
        memory,

      coarsePointer:
        coarsePointer,

      renderedMegapixels:
        renderedMegapixels

    };

  }


  function calculate() {

    var device =
      collectDeviceInfo();


    var score = 0;

    var reasons = [];


    /*
     * CPU-Einstufung
     */

    if (device.cores <= 4) {

      score -= 3;

      reasons.push(
        "höchstens 4 CPU-Threads"
      );

    }

    else if (device.cores <= 8) {

      score += 0;

      reasons.push(
        device.cores +
        " CPU-Threads"
      );

    }

    else {

      score += 2;

      reasons.push(
        device.cores +
        " CPU-Threads"
      );

    }


    /*
     * Speicher, sofern der Browser diesen Wert liefert.
     */

    if (device.memory !== null) {

      if (device.memory <= 4) {

        score -= 3;

        reasons.push(
          device.memory +
          " GB gemeldeter Gerätespeicher"
        );

      }

      else if (device.memory <= 8) {

        score += 0;

        reasons.push(
          device.memory +
          " GB gemeldeter Gerätespeicher"
        );

      }

      else {

        score += 2;

        reasons.push(
          device.memory +
          " GB gemeldeter Gerätespeicher"
        );

      }

    }


    /*
     * Hohe Renderauflösung belastet auch leistungsfähige
     * integrierte Laptop-GPUs.
     */

    if (
      device.renderedMegapixels >= 8
    ) {

      score -= 4;

      reasons.push(
        device.renderedMegapixels
          .toFixed(1) +
        " MP potenzielle Renderlast"
      );

    }

    else if (
      device.renderedMegapixels >= 4.5
    ) {

      score -= 2;

      reasons.push(
        device.renderedMegapixels
          .toFixed(1) +
        " MP potenzielle Renderlast"
      );

    }

    else {

      score += 1;

      reasons.push(
        device.renderedMegapixels
          .toFixed(1) +
        " MP potenzielle Renderlast"
      );

    }


    if (
      device.dpr >= 2.5
    ) {

      score -= 2;

    }

    else if (
      device.dpr <= 1.25
    ) {

      score += 1;

    }


    if (device.coarsePointer) {

      score -= 1;

    }


    var graphics;
    var fps;
    var category;


    if (score <= -4) {

      graphics = "low";
      fps = 30;
      category = "performance";

    }

    else if (score >= 4) {

      graphics = "high";
      fps = 60;
      category = "quality";

    }

    else {

      graphics = "mid";
      fps = 60;
      category = "balanced";

    }


    recommendation = {

      graphics:
        graphics,

      fps:
        fps,

      category:
        category,

      score:
        score,

      reasons:
        reasons,

      device:
        device

    };


    return recommendation;

  }


  function apply(
    recommendationToApply
  ) {

    recommendationToApply =
      recommendationToApply ||
      recommendation ||
      calculate();


    settings.set(
      "graphics",
      recommendationToApply.graphics
    );


    settings.set(
      "targetFps",
      recommendationToApply.fps
    );


    window.dispatchEvent(
      new CustomEvent(
        "ufo:recommendation-applied",
        {
          detail:
            recommendationToApply
        }
      )
    );


    return recommendationToApply;

  }


  function applyFirstRunDefaults() {

    var stored =
      readStoredSettings();


    var result =
      recommendation ||
      calculate();


    var changed = false;


    /*
     * Nur bei echter Ersteinrichtung automatisch übernehmen.
     * Bestehende manuelle Grafikwerte werden nicht ersetzt.
     */

    if (
      typeof stored.graphics !==
      "string"
    ) {

      settings.set(
        "graphics",
        result.graphics
      );

      changed = true;

    }


    if (
      stored.targetFps !== 30 &&
      stored.targetFps !== 60
    ) {

      settings.set(
        "targetFps",
        result.fps
      );

      changed = true;

    }


    return changed;

  }


  calculate();
  applyFirstRunDefaults();


  window.UFOGame.performanceRecommendation = {

    calculate:
      calculate,

    get:
      function () {

        return (
          recommendation ||
          calculate()
        );

      },

    apply:
      apply,

    collectDeviceInfo:
      collectDeviceInfo

  };


  window.dispatchEvent(
    new CustomEvent(
      "ufo:recommendation-ready",
      {
        detail:
          recommendation
      }
    )
  );

})();
