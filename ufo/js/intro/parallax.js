(function () {
  "use strict";

  var intro =
    document.getElementById("ufoIntro");

  var world =
    document.getElementById("parallaxWorld");

  var fireflyField =
    document.getElementById("fireflyField");

  if (!intro || !world) {
    console.warn(
      "Phase 2: Parallax-Welt konnte nicht initialisiert werden."
    );
    return;
  }


  var layers =
    Array.prototype.slice.call(
      world.querySelectorAll(
        ".parallaxLayer[data-depth]"
      )
    );


  var reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  var coarsePointer =
    window.matchMedia(
      "(pointer: coarse)"
    ).matches;


  var pointerX = 0;
  var pointerY = 0;

  var targetX = 0;
  var targetY = 0;

  var currentX = 0;
  var currentY = 0;

  var animationFrame = 0;

  var autoCamera = 0;


  /* --------------------------------------------------------
     Glühwürmchen erzeugen
     -------------------------------------------------------- */

  function createFireflies() {

    if (!fireflyField) {
      return;
    }

    var count =
      coarsePointer ? 12 : 24;

    for (
      var i = 0;
      i < count;
      i++
    ) {

      var fly =
        document.createElement("i");

      fly.className =
        "phase2Firefly";

      fly.style.left =
        (
          4 +
          Math.random() * 92
        ) + "%";

      fly.style.top =
        (
          17 +
          Math.random() * 72
        ) + "%";

      fly.style.setProperty(
        "--duration",
        (
          2.8 +
          Math.random() * 4
        ) + "s"
      );

      fly.style.setProperty(
        "--delay",
        (
          -Math.random() * 5
        ) + "s"
      );

      fly.style.setProperty(
        "--fly-x",
        (
          -15 +
          Math.random() * 30
        ) + "px"
      );

      fireflyField.appendChild(
        fly
      );
    }
  }


  /* --------------------------------------------------------
     Maussteuerung Desktop
     -------------------------------------------------------- */

  function pointerMove(event) {

    if (
      reducedMotion ||
      coarsePointer
    ) {
      return;
    }

    pointerX =
      (
        event.clientX /
        window.innerWidth
      ) * 2 - 1;

    pointerY =
      (
        event.clientY /
        window.innerHeight
      ) * 2 - 1;

    targetX =
      pointerX * 18;

    targetY =
      pointerY * 11;
  }


  /* --------------------------------------------------------
     Mobile nutzt Neigung der Touchposition statt
     DeviceOrientation-Permissions.
     -------------------------------------------------------- */

  function touchMove(event) {

    if (
      reducedMotion ||
      coarsePointer ||
      !event.touches ||
      !event.touches.length
    ) {
      return;
    }

    var touch =
      event.touches[0];

    pointerX =
      (
        touch.clientX /
        window.innerWidth
      ) * 2 - 1;

    pointerY =
      (
        touch.clientY /
        window.innerHeight
      ) * 2 - 1;

    targetX =
      pointerX * 7;

    targetY =
      pointerY * 4;
  }


  /* --------------------------------------------------------
     Kamera neutralisieren
     -------------------------------------------------------- */

  function pointerLeave() {

    targetX = 0;
    targetY = 0;
  }


  /* --------------------------------------------------------
     Phase-basierte automatische Kamerafahrt
     -------------------------------------------------------- */

  function calculateAutoCamera() {

    if (
      intro.classList.contains(
        "phase-signal"
      )
    ) {
      autoCamera = -10;
    }

    else if (
      intro.classList.contains(
        "phase-ufo"
      )
    ) {
      autoCamera = 15;
    }

    else if (
      intro.classList.contains(
        "phase-beam"
      )
    ) {
      autoCamera = 22;
    }

    else if (
      intro.classList.contains(
        "phase-warning"
      )
    ) {
      autoCamera = 9;
    }

    else {
      autoCamera *= .94;
    }
  }


  /* --------------------------------------------------------
     Render Loop
     -------------------------------------------------------- */

  function renderParallax() {

    if (
      !document.body.contains(
        intro
      )
    ) {
      cancelAnimationFrame(
        animationFrame
      );

      return;
    }


    if (!reducedMotion) {

      calculateAutoCamera();


      /*
       * Mobile verwendet einen ruhigen automatischen Drift.
       * Dadurch konkurriert die Landschaft nicht mit der
       * Touch-Bestätigung des Intros.
       */
      if (coarsePointer) {
        var mobileDriftTime = performance.now() * 0.00032;

        targetX =
          Math.sin(mobileDriftTime) * 5.5;

        targetY =
          Math.cos(mobileDriftTime * 0.73) * 2.8;
      }


      currentX +=
        (
          targetX -
          currentX
        ) * .055;


      currentY +=
        (
          targetY -
          currentY
        ) * .055;


      layers.forEach(
        function (layer) {

          var depth =
            Number(
              layer.dataset.depth
            ) || 0;


          var x =
            currentX *
            depth *
            5.2;


          var y =
            (
              currentY *
              depth *
              4.2
            ) +
            (
              autoCamera *
              depth
            );


          layer.style.setProperty(
            "--mx",
            x.toFixed(2) + "px"
          );


          layer.style.setProperty(
            "--my",
            y.toFixed(2) + "px"
          );

        }
      );
    }


    animationFrame =
      requestAnimationFrame(
        renderParallax
      );
  }


  createFireflies();


  window.addEventListener(
    "pointermove",
    pointerMove,
    {
      passive: true
    }
  );


  window.addEventListener(
    "pointerleave",
    pointerLeave,
    {
      passive: true
    }
  );


  intro.addEventListener(
    "touchmove",
    touchMove,
    {
      passive: true
    }
  );


  intro.addEventListener(
    "touchend",
    pointerLeave,
    {
      passive: true
    }
  );


  animationFrame =
    requestAnimationFrame(
      renderParallax
    );


  window.addEventListener(
    "blur",
    pointerLeave,
    {
      passive: true
    }
  );


  window.addEventListener(
    "pagehide",
    function () {

      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "pointermove",
        pointerMove
      );

      window.removeEventListener(
        "pointerleave",
        pointerLeave
      );

    }
  );

})();
