(function () {
  "use strict";


  window.UFOGame =
    window.UFOGame || {};


  var running = false;

  var timers = [];


  function schedule(callback, delay) {

    var id =
      window.setTimeout(
        callback,
        delay
      );


    timers.push(id);

    return id;
  }


  function clearTimers() {

    timers.forEach(
      function (id) {
        window.clearTimeout(id);
      }
    );


    timers.length = 0;
  }


  function reducedMotionEnabled() {

    return window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  }


  function ensureTransitionLayers(intro) {

    if (
      !document.getElementById(
        "introTransitionFlash"
      )
    ) {

      var flash =
        document.createElement("div");


      flash.id =
        "introTransitionFlash";


      flash.setAttribute(
        "aria-hidden",
        "true"
      );


      intro.appendChild(flash);

    }


    if (
      !document.getElementById(
        "introTransitionScan"
      )
    ) {

      var scan =
        document.createElement("div");


      scan.id =
        "introTransitionScan";


      scan.setAttribute(
        "aria-hidden",
        "true"
      );


      intro.appendChild(scan);

    }

  }


  function playLaunchSound() {

    try {

      var AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


      if (!AudioContextClass) {
        return;
      }


      var context =
        new AudioContextClass();


      var now =
        context.currentTime;


      var master =
        context.createGain();


      master.connect(
        context.destination
      );


      master.gain.setValueAtTime(
        0.0001,
        now
      );


      master.gain.exponentialRampToValueAtTime(
        0.11,
        now + 0.03
      );


      master.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 1.38
      );


      var charge =
        context.createOscillator();


      var chargeGain =
        context.createGain();


      charge.type =
        "sine";


      charge.frequency.setValueAtTime(
        95,
        now
      );


      charge.frequency.exponentialRampToValueAtTime(
        760,
        now + 0.68
      );


      chargeGain.gain.setValueAtTime(
        0.0001,
        now
      );


      chargeGain.gain.exponentialRampToValueAtTime(
        0.075,
        now + 0.18
      );


      chargeGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 0.83
      );


      charge.connect(
        chargeGain
      );


      chargeGain.connect(
        master
      );


      charge.start(now);
      charge.stop(now + 0.86);


      var launch =
        context.createOscillator();


      var launchGain =
        context.createGain();


      launch.type =
        "sawtooth";


      launch.frequency.setValueAtTime(
        210,
        now + 0.56
      );


      launch.frequency.exponentialRampToValueAtTime(
        1450,
        now + 1.04
      );


      launchGain.gain.setValueAtTime(
        0.0001,
        now + 0.54
      );


      launchGain.gain.exponentialRampToValueAtTime(
        0.055,
        now + 0.61
      );


      launchGain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + 1.22
      );


      launch.connect(
        launchGain
      );


      launchGain.connect(
        master
      );


      launch.start(now + 0.54);
      launch.stop(now + 1.24);


      schedule(
        function () {

          context.close()
            .catch(
              function () {}
            );

        },
        1700
      );

    }

    catch (error) {

      console.warn(
        "Übergangssound konnte nicht abgespielt werden:",
        error
      );

    }

  }


  function vibrateLaunch() {

    if (
      window.UFOGame &&
      window.UFOGame.haptics &&
      typeof window.UFOGame.haptics.launch === "function"
    ) {

      window.UFOGame.haptics.launch();

    }

  }

  function revealStartMenu(intro) {

    document.body.classList.remove(
      "intro-active"
    );


    document.body.classList.add(
      "intro-transition-complete"
    );


    var message =
      document.getElementById(
        "message"
      );


    if (message) {
      message.style.display = "flex";
    }


    if (
      intro &&
      document.body.contains(intro)
    ) {
      intro.remove();
    }


    var scoreService =
      window.UfoHighscores;


    if (
      scoreService &&
      typeof scoreService.load ===
      "function"
    ) {

      scoreService.load()
        .catch(
          function () {}
        );

    }


    var playerInput =
      document.getElementById(
        "player"
      );


    var finePointer =
      window.matchMedia(
        "(pointer: fine)"
      ).matches;


    if (
      playerInput &&
      finePointer
    ) {

      schedule(
        function () {

          playerInput.focus({
            preventScroll: true
          });

        },
        180
      );

    }


    schedule(
      function () {

        document.body.classList.remove(
          "intro-transition-complete"
        );

      },
      1200
    );


    window.dispatchEvent(
      new CustomEvent(
        "ufo:intro-complete"
      )
    );

  }


  function quickTransition(intro) {

    intro.classList.add(
      "intro-transition-running",
      "transition-final-fade"
    );


    schedule(
      function () {
        revealStartMenu(intro);
      },
      80
    );

  }


  function run(options) {

    options =
      options || {};


    var intro =
      options.intro ||
      document.getElementById(
        "ufoIntro"
      );


    if (
      running ||
      !intro ||
      !document.body.contains(intro)
    ) {
      return false;
    }


    running = true;

    clearTimers();

    ensureTransitionLayers(
      intro
    );


    if (reducedMotionEnabled()) {

      quickTransition(intro);

      return true;
    }


    intro.classList.remove(
      "intro-leaving"
    );


    intro.classList.add(
      "intro-transition-running"
    );


    playLaunchSound();
    vibrateLaunch();


    /*
     * 0 ms:
     * UI fährt aus, Beam bleibt noch kurz aktiv.
     */

    schedule(
      function () {

        intro.classList.add(
          "transition-beam-off"
        );

      },
      260
    );


    /*
     * Kuh fällt nach Abschalten des Beams.
     */

    schedule(
      function () {

        intro.classList.add(
          "transition-cow-drop"
        );

      },
      360
    );


    /*
     * Reaktor lädt auf.
     */

    schedule(
      function () {

        intro.classList.add(
          "transition-ufo-charge"
        );

      },
      430
    );


    /*
     * Kurzer Impact unmittelbar vor dem Start.
     */

    schedule(
      function () {

        intro.classList.add(
          "transition-launch-impact"
        );

      },
      880
    );


    schedule(
      function () {

        intro.classList.remove(
          "transition-launch-impact"
        );

      },
      1380
    );


    /*
     * UFO startet nach oben.
     */

    schedule(
      function () {

        intro.classList.add(
          "transition-ufo-launch"
        );

      },
      990
    );


    /*
     * Lichtblitz und Scanline.
     */

    schedule(
      function () {

        intro.classList.add(
          "transition-flash"
        );

      },
      1140
    );


    /*
     * Kamera fährt in die Farm-/Spielwelt.
     */

    schedule(
      function () {

        intro.classList.add(
          "transition-camera-dive"
        );

      },
      1370
    );


    /*
     * Finaler Fade.
     */

    schedule(
      function () {

        intro.classList.add(
          "transition-final-fade"
        );

      },
      2400
    );


    /*
     * Intro entfernen und Startmenü freigeben.
     */

    schedule(
      function () {

        revealStartMenu(intro);

      },
      2860
    );


    return true;
  }


  window.UFOGame.introTransition = {
    run: run,

    isRunning: function () {
      return running;
    }
  };


  window.addEventListener(
    "pagehide",
    clearTimers,
    {
      once: true
    }
  );

})();
