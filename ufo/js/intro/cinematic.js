(function () {
  "use strict";

  var intro = document.getElementById("ufoIntro");
  var sequence = document.getElementById("cinematicSequenceText");
  var code = document.getElementById("cinematicCode");
  var main = document.getElementById("cinematicMainText");
  var sub = document.getElementById("cinematicSubText");

  if (!intro || !sequence || !code || !main || !sub) {
    console.warn("Phase-1-Sequenz konnte nicht initialisiert werden.");
    return;
  }

  var timers = [];
  var reducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function schedule(callback, delay) {
    var timer = window.setTimeout(callback, delay);
    timers.push(timer);
    return timer;
  }

  function clearPhaseClasses() {
    [
      "phase-boot",
      "phase-landscape",
      "phase-signal",
      "phase-ufo",
      "phase-beam",
      "phase-warning",
      "phase-title"
    ].forEach(function (phase) {
      intro.classList.remove(phase);
    });
  }

  function setPhase(phase) {
    clearPhaseClasses();
    intro.classList.add(phase);
  }

  function setTransmission(newCode, newMain, newSub, useGlitch) {
    sequence.classList.add("changing");

    schedule(function () {
      code.textContent = newCode;
      main.textContent = newMain;
      sub.textContent = newSub;

      sequence.classList.remove("changing");
      sequence.classList.add("visible");

      if (useGlitch) {
        sequence.classList.remove("glitch");
        void sequence.offsetWidth;
        sequence.classList.add("glitch");

        schedule(function () {
          sequence.classList.remove("glitch");
        }, 570);
      }
    }, 145);
  }

  function impact() {
    intro.classList.remove("camera-impact");
    void intro.offsetWidth;
    intro.classList.add("camera-impact");

    schedule(function () {
      intro.classList.remove("camera-impact");
    }, 520);
  }

  function beamFlash() {
    intro.classList.remove("beam-impact");
    void intro.offsetWidth;
    intro.classList.add("beam-impact");

    schedule(function () {
      intro.classList.remove("beam-impact");
    }, 760);
  }

  function startReducedSequence() {
    sequence.classList.add("visible");
    setPhase("phase-title");

    setTransmission(
      "ABWEHRPROTOKOLL AKTIV",
      "UFO-JAGD",
      "NACHTANGRIFF // EINSATZBEREIT",
      false
    );
  }

  if (reducedMotion) {
    sequence.classList.add("visible");
    setPhase("phase-title");

    code.textContent = "ABWEHRPROTOKOLL AKTIV";
    main.textContent = "UFO-JAGD";
    sub.textContent = "NACHTANGRIFF // EINSATZBEREIT";

    return;
  }

  setPhase("phase-boot");

  schedule(function () {
    sequence.classList.add("visible");

    setTransmission(
      "SYSTEMSTART // 23:47",
      "VERTEIDIGUNGSNETZWERK ONLINE",
      "SEKTOR 51 // NACHTPROTOKOLL",
      false
    );
  }, 760);

  schedule(function () {
    setPhase("phase-landscape");

    setTransmission(
      "LANGSTRECKENSCAN AKTIV",
      "NACHTHIMMEL WIRD ANALYSIERT",
      "RADARREICHWEITE 100 PROZENT",
      false
    );
  }, 1650);

  schedule(function () {
    setPhase("phase-signal");

    setTransmission(
      "SIGNAL 7-ALPHA",
      "UNIDENTIFIZIERTES SIGNAL ERFASST",
      "FLUGBAHN UNBEKANNT // DISTANZ SINKT",
      true
    );
  }, 2600);

  schedule(function () {
    setPhase("phase-ufo");

    setTransmission(
      "ALARMSTUFE CYAN",
      "OBJEKT TRITT IN DEN SEKTOR EIN",
      "VISUELLE IDENTIFIKATION LÄUFT",
      true
    );
  }, 3700);

  schedule(function () {
    impact();
  }, 4630);

  schedule(function () {
    setPhase("phase-beam");

    setTransmission(
      "ENERGIESIGNATUR KRITISCH",
      "TRAKTORSTRAHL AKTIVIERT",
      "ZIVILES ZIEL WIRD ERFASST",
      true
    );

    beamFlash();
  }, 5050);

  schedule(function () {
    setPhase("phase-warning");

    setTransmission(
      "NOTFALLPROTOKOLL",
      "VIEHBESTAND IN GEFAHR",
      "SOFORTIGE ABWEHR ERFORDERLICH",
      true
    );

    impact();
  }, 6150);

  schedule(function () {
    setPhase("phase-title");

    setTransmission(
      "ABWEHRPROTOKOLL AKTIV",
      "MISSION WIRD FREIGEGEBEN",
      "PILOTENSTATUS WIRD ERWARTET",
      false
    );
  }, 7000);

  window.addEventListener("pagehide", function () {
    timers.forEach(function (timer) {
      window.clearTimeout(timer);
    });
  });
})();

(function () {
  "use strict";

  var intro = document.getElementById("ufoIntro");
  var enterButton = document.getElementById("introEnter");
  var gateText = document.getElementById("introGateText");
  var gateHint = document.getElementById("introGateHint");
  var status = document.getElementById("introStatus");

  var ready = false;
  var finished = false;
  var readyTimer = null;

  if (!intro || !enterButton) {
    document.body.classList.remove("intro-active");
    return;
  }

  function isTouchDevice() {
    return (
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window
    );
  }

  function playIntroConfirmSound() {
    try {
      var AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) return;

      var context = new AudioContextClass();
      var now = context.currentTime;
      var master = context.createGain();

      master.connect(context.destination);
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.13, now + 0.025);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      [196, 294, 392, 588].forEach(function (frequency, index) {
        var oscillator = context.createOscillator();
        var gain = context.createGain();
        var start = now + index * 0.065;

        oscillator.type = index < 2 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(
          frequency * 1.18,
          start + 0.25
        );

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(
          0.06 / (index + 1),
          start + 0.025
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + 0.43
        );

        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(start);
        oscillator.stop(start + 0.48);
      });

      window.setTimeout(function () {
        context.close().catch(function () {});
      }, 1100);
    } catch (error) {
      console.warn("Intro-Sound konnte nicht abgespielt werden:", error);
    }
  }

  function makeReady() {
    if (ready || finished) return;

    ready = true;
    intro.classList.add("intro-ready");
    enterButton.disabled = false;

    if (isTouchDevice()) {
      gateText.textContent = "ZUM STARTEN BERÜHREN";
      gateHint.textContent = "TOUCH BESTÄTIGEN";
      status.textContent = "EINSATZBEREITSCHAFT HERGESTELLT";
    } else {
      gateText.textContent = "ENTER DRÜCKEN";
      gateHint.textContent = "ODER HIER KLICKEN";
      status.textContent = "EINSATZBEREITSCHAFT HERGESTELLT";
    }

    enterButton.focus({ preventScroll: true });
  }

  function finishIntro(event) {

    if (
      finished ||
      !ready
    ) {
      return;
    }


    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }


    finished = true;
    enterButton.disabled = true;


    /*
     * Phase Übergang Intro -> Startmenü.
     *
     * Die eigentliche Sequenz lebt ab jetzt
     * modular in js/intro/transition.js.
     */

    if (
      window.UFOGame &&
      window.UFOGame.introTransition &&
      typeof window.UFOGame
        .introTransition
        .run === "function"
    ) {

      window.UFOGame
        .introTransition
        .run({
          intro: intro
        });

      return;
    }


    /*
     * Sicherheitsfallback, falls transition.js
     * nicht geladen werden konnte.
     */

    playIntroConfirmSound();

    intro.classList.add(
      "intro-leaving"
    );

    document.body.classList.remove(
      "intro-active"
    );


    window.setTimeout(
      function () {

        intro.remove();


        var playerInput =
          document.getElementById(
            "player"
          );


        if (
          playerInput &&
          !isTouchDevice()
        ) {

          playerInput.focus({
            preventScroll: true
          });

        }

      },
      920
    );

  }

  function skipIntroWithEscape(event) {

    var diagnostics =
      window.UFOGame &&
      window.UFOGame.diagnostics;


    /*
     * Wenn die Diagnose geöffnet ist, gehört ESC
     * der Diagnose und überspringt nicht zusätzlich
     * das Intro.
     */

    if (
      diagnostics &&
      typeof diagnostics.isOpen === "function" &&
      diagnostics.isOpen()
    ) {
      return false;
    }


    if (
      event.key !== "Escape" &&
      event.code !== "Escape"
    ) {
      return false;
    }


    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();


    finished = true;
    ready = true;


    if (readyTimer) {
      window.clearTimeout(
        readyTimer
      );
    }


    document.body.classList.remove(
      "intro-active"
    );


    if (
      intro &&
      document.body.contains(intro)
    ) {
      intro.remove();
    }


    var message =
      document.getElementById(
        "message"
      );


    if (message) {
      message.style.display = "flex";
    }


    if (
      window.UfoHighscores &&
      typeof window.UfoHighscores.load ===
      "function"
    ) {

      window.UfoHighscores
        .load()
        .catch(
          function () {}
        );

    }


    var playerInput =
      document.getElementById(
        "player"
      );


    if (
      playerInput &&
      !isTouchDevice()
    ) {

      window.setTimeout(
        function () {

          playerInput.focus({
            preventScroll: true
          });

        },
        50
      );

    }


    window.dispatchEvent(
      new CustomEvent(
        "ufo:intro-complete"
      )
    );


    return true;

  }


  function handleIntroKey(event) {

    if (
      skipIntroWithEscape(event)
    ) {
      return;
    }

    if (finished) return;

    if (
      event.key === "Enter" ||
      event.code === "Enter" ||
      event.code === "NumpadEnter"
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();

      if (ready) {
        finishIntro(event);
      }
    }
  }

  enterButton.addEventListener("click", finishIntro);
  enterButton.addEventListener("pointerup", function (event) {
    if (ready) {
      finishIntro(event);
    }
  });

  document.addEventListener("keydown", handleIntroKey, true);

  window.addEventListener("pagehide", function () {
    if (readyTimer) {
      window.clearTimeout(readyTimer);
    }

    document.removeEventListener("keydown", handleIntroKey, true);
  });

  var reducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  readyTimer = window.setTimeout(
    makeReady,
    reducedMotion ? 350 : 7900
  );
})();
