(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};

  var STORAGE_KEY =
    "ufoSessionPlayerName";

  var warningTimer = 0;


  function sanitizeName(value) {

    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 18);

  }


  function getStoredName() {

    try {

      return sanitizeName(
        sessionStorage.getItem(
          STORAGE_KEY
        )
      );

    }

    catch (error) {

      console.warn(
        "Session-Spielername konnte nicht gelesen werden:",
        error
      );

      return "";

    }

  }


  function storeName(name) {

    name =
      sanitizeName(name);

    if (!name) {
      return false;
    }


    try {

      sessionStorage.setItem(
        STORAGE_KEY,
        name
      );

      return true;

    }

    catch (error) {

      console.warn(
        "Session-Spielername konnte nicht gespeichert werden:",
        error
      );

      return false;

    }

  }


  function getPlayerInput() {

    return document.getElementById(
      "player"
    );

  }


  function ensureWarning() {

    var existing =
      document.getElementById(
        "playerNameWarning"
      );


    if (existing) {
      return existing;
    }


    var warning =
      document.createElement(
        "div"
      );


    warning.id =
      "playerNameWarning";

    warning.className =
      "playerNameWarning";

    warning.setAttribute(
      "role",
      "alert"
    );

    warning.setAttribute(
      "aria-live",
      "assertive"
    );


    var icon =
      document.createElement(
        "span"
      );


    icon.className =
      "playerNameWarningIcon";

    icon.setAttribute(
      "aria-hidden",
      "true"
    );

    icon.textContent =
      "⚠";


    var content =
      document.createElement(
        "span"
      );


    content.className =
      "playerNameWarningContent";


    var title =
      document.createElement(
        "strong"
      );


    title.textContent =
      "PILOTEN-ID FEHLT";


    var message =
      document.createElement(
        "span"
      );


    message.textContent =
      "Bitte gib deinen Namen ein, bevor die Mission startet.";


    content.appendChild(title);
    content.appendChild(message);

    warning.appendChild(icon);
    warning.appendChild(content);

    document.body.appendChild(
      warning
    );


    return warning;

  }


  function hideWarning() {

    var warning =
      document.getElementById(
        "playerNameWarning"
      );


    if (warning) {

      warning.classList.remove(
        "show"
      );

    }

  }


  function showWarning() {

    var input =
      getPlayerInput();

    var warning =
      ensureWarning();


    window.clearTimeout(
      warningTimer
    );


    warning.classList.remove(
      "show"
    );

    void warning.offsetWidth;

    warning.classList.add(
      "show"
    );


    if (input) {

      input.classList.remove(
        "playerNameInvalid"
      );

      void input.offsetWidth;

      input.classList.add(
        "playerNameInvalid"
      );

      input.setAttribute(
        "aria-invalid",
        "true"
      );

      input.focus({
        preventScroll: true
      });

    }


    warningTimer =
      window.setTimeout(
        function () {

          warning.classList.remove(
            "show"
          );

        },
        3600
      );

  }


  function populateInput() {

    var input =
      getPlayerInput();

    var storedName =
      getStoredName();


    if (
      input &&
      storedName &&
      !sanitizeName(input.value)
    ) {

      input.value =
        storedName;

    }


    return storedName;

  }


  function validate() {

    var input =
      getPlayerInput();

    var storedName =
      getStoredName();


    /*
     * Wichtig für "NOCH EINMAL":
     *
     * Game-Over-Screens besitzen teilweise
     * kein neues Namensfeld.
     *
     * In diesem Fall verwenden wir automatisch
     * die bestehende Session-Piloten-ID.
     */

    if (!input) {

      if (storedName) {

        return {
          valid: true,
          name: storedName,
          fromSession: true
        };

      }


      showWarning();


      return {
        valid: false,
        name: "",
        fromSession: false
      };

    }


    var name =
      sanitizeName(
        input.value
      );


    /*
     * Falls ein neues Menü erzeugt wurde und
     * dessen Feld leer ist, wird die Session-ID
     * automatisch übernommen.
     */

    if (
      !name &&
      storedName
    ) {

      name =
        storedName;

      input.value =
        storedName;

    }


    if (!name) {

      showWarning();


      return {
        valid: false,
        name: "",
        fromSession: false
      };

    }


    input.value =
      name;


    input.classList.remove(
      "playerNameInvalid"
    );


    input.removeAttribute(
      "aria-invalid"
    );


    hideWarning();

    storeName(name);


    return {
      valid: true,
      name: name,
      fromSession:
        name === storedName
    };

  }


  function handleInput(event) {

    var input =
      event.target;


    if (
      !input ||
      input.id !== "player"
    ) {
      return;
    }


    var name =
      sanitizeName(
        input.value
      );


    if (name) {

      input.classList.remove(
        "playerNameInvalid"
      );

      input.removeAttribute(
        "aria-invalid"
      );

      hideWarning();

    }

  }


  /*
   * Die Menüs werden im Legacy-Spiel dynamisch
   * neu aufgebaut. Deshalb beobachten wir den DOM
   * und füllen neu erzeugte #player-Felder wieder.
   */

  var menuObserver =
    new MutationObserver(
      function () {

        populateInput();

      }
    );


  function init() {

    populateInput();


    menuObserver.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );


    document.addEventListener(
      "input",
      handleInput
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


  window.addEventListener(
    "ufo:intro-complete",
    function () {

      window.setTimeout(
        populateInput,
        50
      );

    }
  );


  window.addEventListener(
    "pagehide",
    function () {

      window.clearTimeout(
        warningTimer
      );

      menuObserver.disconnect();

    },
    {
      once: true
    }
  );


  window.UFOGame.playerValidation = {

    validate:
      validate,

    sanitizeName:
      sanitizeName,

    getSessionName:
      getStoredName,

    storeSessionName:
      storeName,

    populateInput:
      populateInput,

    showWarning:
      showWarning,

    hideWarning:
      hideWarning

  };

})();
