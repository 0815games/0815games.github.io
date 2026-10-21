(function () {
  "use strict";

  window.UFOGame =
    window.UFOGame || {};


  var warningTimer = 0;


  function getPlayerInput() {
    return document.getElementById(
      "player"
    );
  }


  function sanitizeName(value) {

    return String(
      value || ""
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 18);

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


    content.appendChild(
      title
    );


    content.appendChild(
      message
    );


    warning.appendChild(
      icon
    );


    warning.appendChild(
      content
    );


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


    if (!warning) {
      return;
    }


    warning.classList.remove(
      "show"
    );

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


  function validate() {

    var input =
      getPlayerInput();


    if (!input) {

      showWarning();

      return {
        valid: false,
        name: ""
      };

    }


    var name =
      sanitizeName(
        input.value
      );


    if (!name) {

      showWarning();

      return {
        valid: false,
        name: ""
      };

    }


    input.value = name;


    input.classList.remove(
      "playerNameInvalid"
    );


    input.removeAttribute(
      "aria-invalid"
    );


    hideWarning();


    return {
      valid: true,
      name: name
    };

  }


  function handleInput() {

    var input =
      getPlayerInput();


    if (!input) {
      return;
    }


    if (
      sanitizeName(input.value)
    ) {

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
   * Da das Startmenü bei Game Over teilweise
   * neu aufgebaut wird, wird Event Delegation
   * verwendet.
   */

  document.addEventListener(
    "input",
    function (event) {

      if (
        event.target &&
        event.target.id === "player"
      ) {
        handleInput();
      }

    }
  );


  window.addEventListener(
    "pagehide",
    function () {

      window.clearTimeout(
        warningTimer
      );

    },
    {
      once: true
    }
  );


  window.UFOGame.playerValidation = {
    validate: validate,
    sanitizeName: sanitizeName,
    showWarning: showWarning,
    hideWarning: hideWarning
  };

})();
