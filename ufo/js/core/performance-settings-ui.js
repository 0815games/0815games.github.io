(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var settings =
    window.UFOGame.settings;


  var recommendationService =
    window.UFOGame
      .performanceRecommendation;


  if (
    !settings ||
    !recommendationService
  ) {

    console.error(
      "Performance Settings UI: benötigter Service fehlt."
    );

    return;
  }


  var observer = null;


  function create(
    tag,
    className,
    text
  ) {

    var element =
      document.createElement(tag);


    if (className) {
      element.className =
        className;
    }


    if (
      typeof text === "string"
    ) {
      element.textContent =
        text;
    }


    return element;

  }


  function recommendationText(
    recommendation
  ) {

    if (
      recommendation.category ===
      "performance"
    ) {

      return (
        "Performance-Empfehlung für dieses Gerät"
      );

    }


    if (
      recommendation.category ===
      "quality"
    ) {

      return (
        "Hohe Grafikqualität wird für dieses Gerät empfohlen"
      );

    }


    return (
      "Ausgewogene Einstellung für dieses Gerät"
    );

  }


  function reasonText(
    recommendation
  ) {

    var device =
      recommendation.device;


    var parts = [
      device.cores +
      " Threads",

      device.memory !== null
        ? device.memory + " GB"
        : "Speicherwert nicht verfügbar",

      "DPR " +
      device.dpr.toFixed(2),

      device.renderedMegapixels
        .toFixed(1) +
      " MP Last"
    ];


    return parts.join(" · ");

  }


  function build() {

    var body =
      document.querySelector(
        "#ufoSettings .ufoSettingsBody"
      );


    if (!body) {
      return false;
    }


    if (
      document.getElementById(
        "performanceSettingsSection"
      )
    ) {
      return true;
    }


    var section =
      create(
        "section",
        "ufoSettingsSection performanceSettingsSection"
      );


    section.id =
      "performanceSettingsSection";


    var title =
      create(
        "div",
        "ufoSettingsSectionTitle"
      );


    title.innerHTML =
      "<span>PERFORMANCE</span>" +
      '<small id="performanceCurrent">' +
      "AUTO" +
      "</small>";


    section.appendChild(title);


    var recommendationBox =
      create(
        "div",
        "performanceRecommendation"
      );


    recommendationBox.innerHTML =
      '<div class="performanceRecommendationHeader">' +
      '<span class="performanceRecommendationIcon">◎</span>' +
      '<span>' +
      '<strong id="performanceRecommendationTitle">' +
      "GERÄT WIRD ANALYSIERT" +
      "</strong>" +
      '<small id="performanceRecommendationReason"></small>' +
      "</span>" +
      "</div>" +
      '<div class="performanceRecommendationResult">' +
      '<span id="recommendedGraphics">MID</span>' +
      "<i>·</i>" +
      '<span id="recommendedFps">60 FPS</span>' +
      "</div>";


    section.appendChild(
      recommendationBox
    );


    var fpsTitle =
      create(
        "div",
        "performanceOptionTitle",
        "BILDRATE"
      );


    section.appendChild(
      fpsTitle
    );


    var fpsOptions =
      create(
        "div",
        "fpsOptions"
      );


    [
      30,
      60
    ].forEach(
      function (fps) {

        var button =
          create(
            "button",
            "",
            fps + " FPS"
          );


        button.type =
          "button";


        button.dataset.fps =
          String(fps);


        button.addEventListener(
          "click",
          function () {

            settings.set(
              "targetFps",
              fps
            );


            render();

          }
        );


        fpsOptions.appendChild(
          button
        );

      }
    );


    section.appendChild(
      fpsOptions
    );


    var applyButton =
      create(
        "button",
        "applyRecommendationButton",
        "EMPFEHLUNG ÜBERNEHMEN"
      );


    applyButton.type =
      "button";


    applyButton.addEventListener(
      "click",
      function () {

        recommendationService
          .apply();


        render();


        applyButton.classList.remove(
          "applied"
        );


        void applyButton.offsetWidth;


        applyButton.classList.add(
          "applied"
        );


        applyButton.textContent =
          "EMPFEHLUNG AKTIV";


        window.setTimeout(
          function () {

            applyButton.classList.remove(
              "applied"
            );


            applyButton.textContent =
              "EMPFEHLUNG ÜBERNEHMEN";

          },
          1500
        );

      }
    );


    section.appendChild(
      applyButton
    );


    /*
     * Performance direkt nach Grafikbereich einsetzen.
     */

    var audioSection =
      document.getElementById(
        "audioSettingsSection"
      );


    if (audioSection) {

      body.insertBefore(
        section,
        audioSection
      );

    }

    else {

      body.appendChild(
        section
      );

    }


    render();


    return true;

  }


  function markRecommendedGraphics(
    recommendation
  ) {

    document
      .querySelectorAll(
        "[data-quality]"
      )
      .forEach(
        function (button) {

          button.classList.toggle(
            "recommended",
            button.dataset.quality ===
            recommendation.graphics
          );

        }
      );

  }


  function render() {

    var recommendation =
      recommendationService.get();


    var graphics =
      settings.get("graphics") ||
      recommendation.graphics;


    var fps =
      Number(
        settings.get("targetFps")
      );


    if (
      fps !== 30 &&
      fps !== 60
    ) {
      fps =
        recommendation.fps;
    }


    var current =
      document.getElementById(
        "performanceCurrent"
      );


    if (current) {

      current.textContent =
        String(graphics)
          .toUpperCase() +
        " · " +
        fps;

    }


    var title =
      document.getElementById(
        "performanceRecommendationTitle"
      );


    if (title) {

      title.textContent =
        recommendationText(
          recommendation
        );

    }


    var reason =
      document.getElementById(
        "performanceRecommendationReason"
      );


    if (reason) {

      reason.textContent =
        reasonText(
          recommendation
        );

    }


    var graphicsOutput =
      document.getElementById(
        "recommendedGraphics"
      );


    if (graphicsOutput) {

      graphicsOutput.textContent =
        recommendation.graphics
          .toUpperCase();

    }


    var fpsOutput =
      document.getElementById(
        "recommendedFps"
      );


    if (fpsOutput) {

      fpsOutput.textContent =
        recommendation.fps +
        " FPS";

    }


    document
      .querySelectorAll(
        "[data-fps]"
      )
      .forEach(
        function (button) {

          var selected =
            Number(
              button.dataset.fps
            ) === fps;


          button.classList.toggle(
            "selected",
            selected
          );


          button.classList.toggle(
            "recommended",
            Number(
              button.dataset.fps
            ) ===
            recommendation.fps
          );


          button.setAttribute(
            "aria-pressed",
            selected
              ? "true"
              : "false"
          );

        }
      );


    markRecommendedGraphics(
      recommendation
    );

  }


  function init() {

    if (build()) {
      return;
    }


    observer =
      new MutationObserver(
        function () {

          if (build()) {

            observer.disconnect();
            observer = null;

          }

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

  }


  window.addEventListener(
    "ufo:settings-change",
    render
  );


  window.addEventListener(
    "ufo:graphics-change",
    render
  );


  window.addEventListener(
    "ufo:recommendation-applied",
    render
  );


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );

  }

  else {
    init();
  }


  window.UFOGame.performanceSettingsUI = {
    render: render
  };

})();
