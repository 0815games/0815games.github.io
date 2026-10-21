(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var settings =
    window.UFOGame.settings;


  if (!settings) {

    console.error(
      "Performance Settings UI: Settings-Service fehlt."
    );

    return;
  }


  var observer = null;


  function build() {

    var panel =
      document.querySelector(
        "#ufoSettings .ufoSettingsBody"
      );


    if (!panel) {
      return false;
    }


    if (
      document.getElementById(
        "performanceSettingsSection"
      )
    ) {
      render();

      return true;
    }


    var section =
      document.createElement(
        "section"
      );


    section.id =
      "performanceSettingsSection";


    section.className =
      "ufoSettingsSection performanceSettingsSection";


    section.innerHTML =
      '<div class="ufoSettingsSectionTitle">' +
        '<span>BILDRATE</span>' +
        '<small id="currentFpsSetting">60 FPS</small>' +
      '</div>' +

      '<p>' +
        '30 FPS reduziert die Belastung auf Notebooks und Smartphones. ' +
        '60 FPS bietet flüssigere Bewegungen.' +
      '</p>' +

      '<div class="fpsOptions">' +
        '<button type="button" data-fps="30">' +
          '<strong>30</strong>' +
          '<span>PERFORMANCE</span>' +
        '</button>' +

        '<button type="button" data-fps="60">' +
          '<strong>60</strong>' +
          '<span>FLÜSSIG</span>' +
        '</button>' +
      '</div>' +

      '<div id="fpsDescription" class="fpsDescription"></div>';


    var graphicsSection =
      panel.querySelector(
        ".ufoSettingsSection"
      );


    if (
      graphicsSection &&
      graphicsSection.nextSibling
    ) {

      panel.insertBefore(
        section,
        graphicsSection.nextSibling
      );

    }

    else if (graphicsSection) {

      graphicsSection.insertAdjacentElement(
        "afterend",
        section
      );

    }

    else {

      panel.prepend(section);

    }


    section
      .querySelectorAll(
        "[data-fps]"
      )
      .forEach(
        function (button) {

          button.addEventListener(
            "click",
            function () {

              settings.setTargetFps(
                Number(
                  button.dataset.fps
                )
              );


              render();

            }
          );

        }
      );


    render();

    return true;
  }


  function render() {

    var fps =
      settings.getTargetFps();


    var current =
      document.getElementById(
        "currentFpsSetting"
      );


    if (current) {

      current.textContent =
        fps + " FPS";

    }


    var description =
      document.getElementById(
        "fpsDescription"
      );


    if (description) {

      description.textContent =
        fps === 30
          ? "Empfohlen für Office-Laptops und schwächere Smartphones."
          : "Empfohlen für leistungsstarke Geräte und schnelle Displays.";

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


          button.setAttribute(
            "aria-pressed",
            selected
              ? "true"
              : "false"
          );

        }
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
