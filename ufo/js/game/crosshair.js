(function () {
  "use strict";

  var canvas =
    document.getElementById("game");

  var message =
    document.getElementById("message");

  var intro =
    document.getElementById("ufoIntro");


  if (!canvas) {
    return;
  }


  var finePointer =
    window.matchMedia(
      "(pointer: fine)"
    ).matches;


  if (!finePointer) {
    return;
  }


  var crosshair =
    document.createElement("div");

  crosshair.id =
    "gameCrosshair";

  crosshair.setAttribute(
    "aria-hidden",
    "true"
  );

  crosshair.innerHTML =
    '<span class="gameCrosshairRing"></span>' +
    '<span class="gameCrosshairBrackets"></span>' +
    '<span class="gameCrosshairDot"></span>';

  document.body.appendChild(
    crosshair
  );


  var pointerX = -100;
  var pointerY = -100;

  var visible = false;
  var fireTimer = 0;
  var hitTimer = 0;


  function menuIsVisible() {

    if (!message) {
      return false;
    }

    return (
      window.getComputedStyle(message)
        .display !== "none"
    );
  }


  function introIsVisible() {

    return Boolean(
      intro &&
      document.body.contains(intro)
    );
  }


  function gameplayIsActive() {

    return (
      !introIsVisible() &&
      !menuIsVisible()
    );
  }


  function updateVisibility() {

    var active =
      visible &&
      gameplayIsActive();

    document.body.classList.toggle(
      "game-crosshair-active",
      active
    );

    if (!active) {
      crosshair.style.setProperty(
        "--crosshair-x",
        "-100px"
      );

      crosshair.style.setProperty(
        "--crosshair-y",
        "-100px"
      );
    }
  }


  function moveCrosshair(event) {

    pointerX = event.clientX;
    pointerY = event.clientY;

    crosshair.style.setProperty(
      "--crosshair-x",
      pointerX + "px"
    );

    crosshair.style.setProperty(
      "--crosshair-y",
      pointerY + "px"
    );

    updateVisibility();
  }


  function showCrosshair(event) {

    visible = true;

    if (event) {
      moveCrosshair(event);
    }

    updateVisibility();
  }


  function hideCrosshair() {

    visible = false;
    updateVisibility();
  }


  function fireCrosshair() {

    if (!gameplayIsActive()) {
      return;
    }

    window.clearTimeout(
      fireTimer
    );

    crosshair.classList.remove(
      "crosshair-fire"
    );

    void crosshair.offsetWidth;

    crosshair.classList.add(
      "crosshair-fire"
    );

    fireTimer =
      window.setTimeout(
        function () {
          crosshair.classList.remove(
            "crosshair-fire"
          );
        },
        220
      );
  }


  /*
   * Trefferfeedback wird über die Änderung des Scores erkannt.
   * Dadurch muss die bestehende Trefferlogik nicht umgebaut
   * werden.
   */
  function detectPossibleHit() {

    var scoreElement =
      document.getElementById("score");

    if (!scoreElement) {
      return;
    }

    var before =
      scoreElement.textContent;

    window.setTimeout(
      function () {

        var after =
          scoreElement.textContent;

        if (
          after !== before &&
          gameplayIsActive()
        ) {

          window.clearTimeout(
            hitTimer
          );

          crosshair.classList.remove(
            "crosshair-hit"
          );

          void crosshair.offsetWidth;

          crosshair.classList.add(
            "crosshair-hit"
          );

          hitTimer =
            window.setTimeout(
              function () {
                crosshair.classList.remove(
                  "crosshair-hit"
                );
              },
              300
            );
        }

      },
      30
    );
  }


  canvas.addEventListener(
    "pointerenter",
    showCrosshair,
    {
      passive: true
    }
  );


  canvas.addEventListener(
    "pointermove",
    moveCrosshair,
    {
      passive: true
    }
  );


  canvas.addEventListener(
    "pointerleave",
    hideCrosshair,
    {
      passive: true
    }
  );


  canvas.addEventListener(
    "pointerdown",
    function () {
      fireCrosshair();
      detectPossibleHit();
    },
    {
      passive: true
    }
  );


  window.addEventListener(
    "blur",
    hideCrosshair,
    {
      passive: true
    }
  );


  document.addEventListener(
    "visibilitychange",
    function () {

      if (document.hidden) {
        hideCrosshair();
      }

    }
  );


  /*
   * Menü, Game Over und Intro können den Zustand ändern,
   * ohne dass sich die Maus bewegt. Daher wird die Sichtbarkeit
   * zusätzlich über einen kleinen Observer aktualisiert.
   */
  var observer =
    new MutationObserver(
      updateVisibility
    );


  if (message) {
    observer.observe(
      message,
      {
        attributes: true,
        attributeFilter: [
          "style",
          "class"
        ],
        childList: true,
        subtree: false
      }
    );
  }


  if (intro) {
    observer.observe(
      document.body,
      {
        childList: true
      }
    );
  }


  window.addEventListener(
    "pagehide",
    function () {

      observer.disconnect();

      window.clearTimeout(
        fireTimer
      );

      window.clearTimeout(
        hitTimer
      );

    }
  );

})();
