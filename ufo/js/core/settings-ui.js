(function () {
  "use strict";


  var game =
    window.UFOGame;


  if (
    !game ||
    !game.settings
  ) {

    console.error(
      "Settings UI: Settings-Service fehlt."
    );

    return;
  }


  var overlay = null;


  function create(
    tag,
    className,
    text
  ) {

    var element =
      document.createElement(
        tag
      );


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


  function build() {

    if (
      document.getElementById(
        "ufoSettings"
      )
    ) {
      overlay =
        document.getElementById(
          "ufoSettings"
        );

      return;
    }


    overlay =
      create(
        "div",
        "ufoSettings"
      );


    overlay.id =
      "ufoSettings";


    overlay.setAttribute(
      "aria-hidden",
      "true"
    );


    var panel =
      create(
        "section",
        "ufoSettingsPanel"
      );


    panel.setAttribute(
      "role",
      "dialog"
    );


    panel.setAttribute(
      "aria-modal",
      "true"
    );


    panel.setAttribute(
      "aria-label",
      "Spieleinstellungen"
    );


    var header =
      create(
        "header",
        "ufoSettingsHeader"
      );


    var heading =
      create(
        "div",
        ""
      );


    heading.innerHTML =
      "<strong>SYSTEMEINSTELLUNGEN</strong>" +
      "<span>UFO DEFENSE CONTROL</span>";


    var close =
      create(
        "button",
        "ufoSettingsClose",
        "×"
      );


    close.type =
      "button";


    close.setAttribute(
      "aria-label",
      "Einstellungen schließen"
    );


    header.appendChild(
      heading
    );


    header.appendChild(
      close
    );


    var body =
      create(
        "div",
        "ufoSettingsBody"
      );


    var graphics =
      create(
        "section",
        "ufoSettingsSection"
      );


    graphics.innerHTML =
      '<div class="ufoSettingsSectionTitle">' +
      '<span>GRAFIKQUALITÄT</span>' +
      '<small id="graphicsCurrent">MID</small>' +
      '</div>' +
      '<p>Bestimmt Renderauflösung und Effektmenge.</p>' +
      '<div class="graphicsOptions">' +
      '<button type="button" data-quality="low">' +
      '<strong>LOW</strong>' +
      '<span>MAX FPS</span>' +
      '</button>' +
      '<button type="button" data-quality="mid">' +
      '<strong>MID</strong>' +
      '<span>BALANCED</span>' +
      '</button>' +
      '<button type="button" data-quality="high">' +
      '<strong>HIGH</strong>' +
      '<span>FULL FX</span>' +
      '</button>' +
      '</div>' +
      '<div id="graphicsDescription" class="graphicsDescription"></div>';


    var future =
      create(
        "section",
        "ufoSettingsSection ufoSettingsFuture"
      );


    future.innerHTML =
      '<div class="ufoSettingsSectionTitle">' +
      '<span>AUDIO</span>' +
      '<small>COMING NEXT</small>' +
      '</div>' +
      '<div class="futureSetting">' +
      '<span>♪ MUSIK</span>' +
      '<span class="futureValue">ON</span>' +
      '</div>' +
      '<div class="futureSetting">' +
      '<span>◉ SFX</span>' +
      '<span class="futureValue">ON</span>' +
      '</div>';


    body.appendChild(
      graphics
    );


    body.appendChild(
      future
    );


    panel.appendChild(
      header
    );


    panel.appendChild(
      body
    );


    overlay.appendChild(
      panel
    );


    document.body.appendChild(
      overlay
    );


    close.addEventListener(
      "click",
      closeSettings
    );


    overlay.addEventListener(
      "pointerdown",
      function (event) {

        if (
          event.target === overlay
        ) {
          closeSettings();
        }

      }
    );


    graphics
      .querySelectorAll(
        "[data-quality]"
      )
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            function () {

              game.settings
                .setGraphics(
                  button.dataset.quality
                );


              render();

            }
          );

        }
      );


    render();

  }


  function description(
    quality
  ) {

    if (
      quality === "low"
    ) {

      return (
        "Performance-Modus · Canvas DPR 1.0 · " +
        "weniger Partikel und Umgebungseffekte"
      );

    }


    if (
      quality === "high"
    ) {

      return (
        "Maximale Darstellung · volle Renderauflösung · " +
        "alle Effekte"
      );

    }


    return (
      "Empfohlen für Smartphones · Canvas DPR 1.5 · " +
      "ausgewogene Effekte"
    );

  }


  function render() {

    if (!overlay) {
      return;
    }


    var quality =
      game.settings
        .getGraphics();


    var current =
      document.getElementById(
        "graphicsCurrent"
      );


    if (current) {
      current.textContent =
        quality.toUpperCase();
    }


    var desc =
      document.getElementById(
        "graphicsDescription"
      );


    if (desc) {
      desc.textContent =
        description(
          quality
        );
    }


    overlay
      .querySelectorAll(
        "[data-quality]"
      )
      .forEach(
        function (button) {

          var selected =
            button.dataset.quality ===
            quality;


          button.classList.toggle(
            "selected",
            selected
          );


          button.setAttribute(
            "aria-pressed",
            selected
              ? "true"
              : "false"
          );

        }
      );

  }


  function openSettings() {

    build();


    overlay.classList.add(
      "show"
    );


    overlay.setAttribute(
      "aria-hidden",
      "false"
    );


    document.body.classList.add(
      "settings-open"
    );


    render();

  }


  function closeSettings() {

    if (!overlay) {
      return;
    }


    overlay.classList.remove(
      "show"
    );


    overlay.setAttribute(
      "aria-hidden",
      "true"
    );


    document.body.classList.remove(
      "settings-open"
    );

  }


  function toggleSettings() {

    build();


    if (
      overlay.classList.contains(
        "show"
      )
    ) {
      closeSettings();
    }

    else {
      openSettings();
    }

  }


  function addButton() {

    if (
      document.getElementById(
        "globalSettingsButton"
      )
    ) {
      return;
    }


    var button =
      create(
        "button",
        "globalSettingsButton",
        "⚙"
      );


    button.id =
      "globalSettingsButton";


    button.type =
      "button";


    button.title =
      "Einstellungen";


    button.setAttribute(
      "aria-label",
      "Spieleinstellungen öffnen"
    );


    button.addEventListener(
      "click",
      function (event) {

        event.preventDefault();
        event.stopPropagation();

        toggleSettings();

      }
    );


    document.body.appendChild(
      button
    );

  }


  function handleKey(event) {

    if (
      event.key === "Escape" &&
      overlay &&
      overlay.classList.contains(
        "show"
      )
    ) {

      event.preventDefault();
      event.stopPropagation();

      closeSettings();

    }

  }


  function init() {

    build();
    addButton();


    document.addEventListener(
      "keydown",
      handleKey,
      true
    );

  }


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


  game.settingsUI = {

    open:
      openSettings,

    close:
      closeSettings,

    toggle:
      toggleSettings

  };

})();
