(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var button = null;
  var toastTimer = 0;


  function isTouch() {

    return window.matchMedia(
      "(pointer: coarse)"
    ).matches;

  }


  function isPortrait() {

    return window.matchMedia(
      "(orientation: portrait)"
    ).matches;

  }


  function isFullscreen() {

    return Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement
    );

  }


  function getFullscreenElement() {

    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      null
    );

  }


  function requestFullscreen() {

    var element =
      document.documentElement;


    if (
      typeof element.requestFullscreen ===
      "function"
    ) {

      return element.requestFullscreen();

    }


    if (
      typeof element.webkitRequestFullscreen ===
      "function"
    ) {

      element.webkitRequestFullscreen();

      return Promise.resolve();

    }


    return Promise.reject(
      new Error(
        "Fullscreen API nicht unterstützt."
      )
    );

  }


  function exitFullscreen() {

    if (
      typeof document.exitFullscreen ===
      "function"
    ) {

      return document.exitFullscreen();

    }


    if (
      typeof document.webkitExitFullscreen ===
      "function"
    ) {

      document.webkitExitFullscreen();

      return Promise.resolve();

    }


    return Promise.resolve();

  }


  function lockLandscape() {

    if (
      !screen.orientation ||
      typeof screen.orientation.lock !==
      "function"
    ) {

      return Promise.resolve(false);

    }


    return screen.orientation
      .lock("landscape")
      .then(
        function () {
          return true;
        }
      )
      .catch(
        function (error) {

          /*
           * Orientation Lock ist je nach Browser,
           * Plattform und Installationsmodus nicht
           * immer verfügbar.
           *
           * Fullscreen bleibt trotzdem erhalten.
           */

          console.warn(
            "Landscape Lock nicht verfügbar:",
            error
          );


          return false;

        }
      );

  }


  function unlockOrientation() {

    try {

      if (
        screen.orientation &&
        typeof screen.orientation.unlock ===
        "function"
      ) {

        screen.orientation.unlock();

      }

    }

    catch (error) {
      /*
       * Optional.
       */
    }

  }


  function getToast() {

    var toast =
      document.getElementById(
        "fullscreenToast"
      );


    if (toast) {
      return toast;
    }


    toast =
      document.createElement(
        "div"
      );


    toast.id =
      "fullscreenToast";


    toast.className =
      "fullscreenToast";


    toast.setAttribute(
      "role",
      "status"
    );


    toast.setAttribute(
      "aria-live",
      "polite"
    );


    document.body.appendChild(
      toast
    );


    return toast;

  }


  function showToast(
    title,
    text
  ) {

    var toast =
      getToast();


    toast.replaceChildren();


    var strong =
      document.createElement(
        "strong"
      );


    strong.textContent =
      title;


    var span =
      document.createElement(
        "span"
      );


    span.textContent =
      text;


    toast.appendChild(
      strong
    );


    toast.appendChild(
      span
    );


    toast.classList.remove(
      "show"
    );


    void toast.offsetWidth;


    toast.classList.add(
      "show"
    );


    window.clearTimeout(
      toastTimer
    );


    toastTimer =
      window.setTimeout(
        function () {

          toast.classList.remove(
            "show"
          );

        },
        2600
      );

  }


  function updateButton() {

    if (!button) {
      return;
    }


    var fullscreen =
      isFullscreen();


    button.classList.toggle(
      "fullscreen-active",
      fullscreen
    );


    button.textContent =
      fullscreen
        ? "×"
        : "⛶";


    button.setAttribute(
      "aria-label",
      fullscreen
        ? "Vollbild verlassen"
        : (
            isTouch()
              ? "Vollbild im Querformat"
              : "Vollbild aktivieren"
          )
    );


    button.title =
      fullscreen
        ? "Vollbild verlassen"
        : (
            isTouch()
              ? "Vollbild / Querformat"
              : "Vollbild"
          );


    document.body.classList.toggle(
      "game-fullscreen",
      fullscreen
    );

  }


  function enter() {

    if (isFullscreen()) {

      if (
        isTouch() &&
        isPortrait()
      ) {

        return lockLandscape();

      }


      updateButton();

      return Promise.resolve(
        true
      );

    }


    return requestFullscreen()

      .then(
        function () {

          updateButton();


          if (!isTouch()) {

            showToast(
              "VOLLBILD AKTIV",
              "ESC beendet den Vollbildmodus."
            );


            return true;
          }


          return lockLandscape()

            .then(
              function (locked) {

                if (locked) {

                  showToast(
                    "LANDSCAPE AKTIV",
                    "UFO-Abwehr im Querformat."
                  );

                }

                else {

                  showToast(
                    "VOLLBILD AKTIV",
                    "Gerät bei Bedarf manuell ins Querformat drehen."
                  );

                }


                return true;

              }
            );

        }
      )

      .catch(
        function (error) {

          console.warn(
            "Vollbild konnte nicht aktiviert werden:",
            error
          );


          showToast(
            "VOLLBILD NICHT VERFÜGBAR",
            "Der Browser hat die Vollbild-Anfrage abgelehnt."
          );


          return false;

        }
      );

  }


  function leave() {

    unlockOrientation();


    return exitFullscreen()

      .catch(
        function (error) {

          console.warn(
            "Vollbild konnte nicht beendet werden:",
            error
          );

        }
      )

      .then(
        function () {

          updateButton();

        }
      );

  }


  function toggle() {

    if (isFullscreen()) {
      return leave();
    }


    return enter();

  }


  function createButton() {

    if (
      document.getElementById(
        "globalFullscreenButton"
      )
    ) {

      button =
        document.getElementById(
          "globalFullscreenButton"
        );


      updateButton();

      return;
    }


    button =
      document.createElement(
        "button"
      );


    button.id =
      "globalFullscreenButton";


    button.className =
      "globalFullscreenButton";


    button.type =
      "button";


    button.textContent =
      "⛶";


    button.addEventListener(
      "click",
      function (event) {

        event.preventDefault();
        event.stopPropagation();

        toggle();

      }
    );


    document.body.appendChild(
      button
    );


    updateButton();

  }


  function updateOrientationClasses() {

    var portrait =
      isPortrait();


    document.body.classList.toggle(
      "viewport-portrait",
      portrait
    );


    document.body.classList.toggle(
      "viewport-landscape",
      !portrait
    );

  }


  function init() {

    createButton();

    updateOrientationClasses();


    document.addEventListener(
      "fullscreenchange",
      updateButton
    );


    document.addEventListener(
      "webkitfullscreenchange",
      updateButton
    );


    window.addEventListener(
      "resize",
      updateOrientationClasses,
      {
        passive: true
      }
    );


    window.addEventListener(
      "orientationchange",
      function () {

        window.setTimeout(
          updateOrientationClasses,
          120
        );

      },
      {
        passive: true
      }
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


  window.UFOGame.fullscreen = {

    enter: enter,

    exit: leave,

    toggle: toggle,

    isActive:
      isFullscreen,

    requestLandscape:
      lockLandscape

  };

})();
