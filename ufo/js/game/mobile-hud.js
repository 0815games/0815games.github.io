(function () {
  "use strict";


  window.UFOGame =
    window.UFOGame || {};


  var coarsePointer =
    window.matchMedia(
      "(pointer: coarse)"
    ).matches;


  var mobileViewport =
    window.matchMedia(
      "(max-width: 700px)"
    ).matches;


  if (
    !coarsePointer &&
    !mobileViewport
  ) {
    return;
  }


  var source = {
    level:
      document.getElementById("level"),

    score:
      document.getElementById("score"),

    targets:
      document.getElementById("targets"),

    ufoShot:
      document.getElementById("ufoShot"),

    jets:
      document.getElementById("jetShot"),

    slow:
      document.getElementById("slow"),

    pause:
      document.getElementById("pause"),

    quit:
      document.getElementById("quit"),

    message:
      document.getElementById("message")
  };


  var last = {
    level: null,
    score: null,
    jets: null
  };


  var pulseTimer = 0;


  function createElement(
    tag,
    className,
    text
  ) {

    var element =
      document.createElement(tag);


    if (className) {
      element.className = className;
    }


    if (
      typeof text === "string"
    ) {
      element.textContent = text;
    }


    return element;
  }


  function createItem(
    className,
    label,
    valueId
  ) {

    var item =
      createElement(
        "div",
        "mobileHudItem " + className
      );


    var labelElement =
      createElement(
        "span",
        "",
        label
      );


    var valueElement =
      createElement(
        "strong",
        ""
      );


    valueElement.id =
      valueId;


    valueElement.textContent =
      "–";


    item.appendChild(
      labelElement
    );


    item.appendChild(
      valueElement
    );


    return item;
  }


  function buildHud() {

    if (
      document.getElementById(
        "mobileHud"
      )
    ) {
      return;
    }


    var hud =
      createElement(
        "div",
        ""
      );


    hud.id =
      "mobileHud";


    hud.setAttribute(
      "aria-label",
      "Mobiles Spiel HUD"
    );


    var panel =
      createElement(
        "div",
        "mobileHudPanel"
      );


    var primary =
      createElement(
        "div",
        "mobileHudPrimary"
      );


    var secondary =
      createElement(
        "div",
        "mobileHudSecondary"
      );


    primary.appendChild(
      createItem(
        "mobileHudLevel",
        "LEVEL",
        "mobileLevel"
      )
    );


    primary.appendChild(
      createItem(
        "mobileHudScore",
        "PUNKTE",
        "mobileScore"
      )
    );


    primary.appendChild(
      createItem(
        "mobileHudCows",
        "MISSION",
        "mobileTargets"
      )
    );


    var pauseButton =
      createElement(
        "button",
        "mobileHudButton mobileHudPause"
      );


    pauseButton.id =
      "mobilePause";


    pauseButton.type =
      "button";


    pauseButton.setAttribute(
      "aria-label",
      "Spiel pausieren oder fortsetzen"
    );


    primary.appendChild(
      pauseButton
    );


    secondary.appendChild(
      createItem(
        "mobileHudUfos",
        "GETROFFEN",
        "mobileUfoShot"
      )
    );


    secondary.appendChild(
      createItem(
        "mobileHudJets",
        "JETS",
        "mobileJets"
      )
    );


    secondary.appendChild(
      createItem(
        "mobileHudTime",
        "ZEITLUPE",
        "mobileSlow"
      )
    );


    var quitButton =
      createElement(
        "button",
        "mobileHudButton mobileHudQuit"
      );


    quitButton.id =
      "mobileQuit";


    quitButton.type =
      "button";


    quitButton.setAttribute(
      "aria-label",
      "Mission beenden"
    );


    secondary.appendChild(
      quitButton
    );


    panel.appendChild(
      primary
    );


    panel.appendChild(
      secondary
    );


    hud.appendChild(
      panel
    );


    document.body.appendChild(
      hud
    );


    var orientationHint =
      createElement(
        "div",
        ""
      );


    orientationHint.id =
      "mobileOrientationHint";


    orientationHint.innerHTML =
      "<strong>GERÄT DREHEN</strong><br>" +
      "Die UFO-Abwehr funktioniert im Querformat am besten.";


    document.body.appendChild(
      orientationHint
    );


    pauseButton.addEventListener(
      "click",
      function () {

        if (source.pause) {
          source.pause.click();
        }

      }
    );


    quitButton.addEventListener(
      "click",
      function () {

        if (source.quit) {
          source.quit.click();
        }

      }
    );

  }


  function textOf(element) {

    return element
      ? element.textContent.trim()
      : "–";
  }


  function numberOf(element) {

    var value =
      Number(
        textOf(element)
          .replace(/[^\d.-]/g, "")
      );


    return Number.isFinite(value)
      ? value
      : 0;
  }


  function setText(id, value) {

    var element =
      document.getElementById(id);


    if (element) {
      element.textContent = value;
    }

  }


  function currentJetCount() {

    var text =
      textOf(source.jets);


    var match =
      text.match(/^(\d+)/);


    return match
      ? Number(match[1])
      : 0;
  }


  function pulse(className) {

    var hud =
      document.getElementById(
        "mobileHud"
      );


    if (!hud) {
      return;
    }


    window.clearTimeout(
      pulseTimer
    );


    hud.classList.remove(
      "mobileHudHit",
      "mobileHudJetHit",
      "mobileHudLevelUp"
    );


    void hud.offsetWidth;


    hud.classList.add(
      className
    );


    pulseTimer =
      window.setTimeout(
        function () {

          hud.classList.remove(
            className
          );

        },
        680
      );

  }


  function vibrate(pattern) {

    if (
      window.UFOGame &&
      window.UFOGame.haptics &&
      typeof window.UFOGame.haptics.vibrate === "function"
    ) {

      window.UFOGame.haptics.vibrate(
        pattern
      );

    }

  }

  function syncValues() {

    var newLevel =
      numberOf(source.level);


    var newScore =
      numberOf(source.score);


    var newJets =
      currentJetCount();


    setText(
      "mobileLevel",
      textOf(source.level)
    );


    setText(
      "mobileScore",
      newScore.toLocaleString("de-DE")
    );


    setText(
      "mobileTargets",
      textOf(source.targets)
    );


    setText(
      "mobileUfoShot",
      textOf(source.ufoShot)
    );


    setText(
      "mobileJets",
      textOf(source.jets)
    );


    setText(
      "mobileSlow",
      textOf(source.slow)
    );


    var mobileJets =
      document.getElementById(
        "mobileJets"
      );


    if (
      mobileJets &&
      mobileJets.parentElement
    ) {

      mobileJets.parentElement
        .classList.toggle(
          "warning",
          newJets >= 3
        );

    }


    var mobilePause =
      document.getElementById(
        "mobilePause"
      );


    if (mobilePause) {

      var paused =
        source.pause &&
        source.pause.textContent
          .trim()
          .toUpperCase() ===
          "WEITER";


      mobilePause.classList.toggle(
        "isPaused",
        paused
      );


      mobilePause.setAttribute(
        "aria-label",
        paused
          ? "Spiel fortsetzen"
          : "Spiel pausieren"
      );

    }


    /*
     * Feedback erst auslösen, wenn bereits
     * ein vorheriger Wert bekannt ist.
     */

    if (
      last.level !== null &&
      newLevel > last.level
    ) {

      pulse(
        "mobileHudLevelUp"
      );


      vibrate(
        [
          28,
          42,
          28,
          42,
          70
        ]
      );

    }


    if (
      last.jets !== null &&
      newJets > last.jets
    ) {

      pulse(
        "mobileHudJetHit"
      );


      vibrate(
        [
          45,
          28,
          70
        ]
      );

    }

    else if (
      last.score !== null &&
      newScore > last.score
    ) {

      pulse(
        "mobileHudHit"
      );


      vibrate(18);

    }


    last.level = newLevel;
    last.score = newScore;
    last.jets = newJets;

  }


  function menuVisible() {

    if (!source.message) {
      return false;
    }


    return (
      window.getComputedStyle(
        source.message
      ).display !== "none"
    );

  }


  function syncRunningState() {

    var intro =
      document.getElementById(
        "ufoIntro"
      );


    var running =
      !intro &&
      !menuVisible();


    document.body.classList.toggle(
      "mobile-game-running",
      running
    );


    syncOrientation();

  }


  function syncOrientation() {

    var portrait =
      window.matchMedia(
        "(orientation: portrait)"
      ).matches;


    document.body.classList.toggle(
      "mobile-portrait",
      portrait
    );


    document.body.classList.toggle(
      "mobile-landscape",
      !portrait
    );

  }


  function applyPerformanceProfile() {

    var memory =
      typeof navigator.deviceMemory ===
      "number"
        ? navigator.deviceMemory
        : null;


    var cores =
      typeof navigator.hardwareConcurrency ===
      "number"
        ? navigator.hardwareConcurrency
        : null;


    /*
     * Das Profil wird aktiviert, wenn das Gerät
     * erkennbare schwächere Hardware meldet.
     *
     * Falls die Browserwerte fehlen, bleibt das
     * normale Mobile-Profil aktiv.
     */

    var limited =
      (
        memory !== null &&
        memory <= 4
      ) ||
      (
        cores !== null &&
        cores <= 4
      );


    document.body.classList.toggle(
      "mobile-performance-profile",
      limited
    );

  }


  function observeElement(element) {

    if (!element) {
      return null;
    }


    var observer =
      new MutationObserver(
        function () {

          syncValues();
          syncRunningState();

        }
      );


    observer.observe(
      element,
      {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          "style",
          "class"
        ]
      }
    );


    return observer;
  }


  function init() {

    buildHud();

    applyPerformanceProfile();

    syncOrientation();
    syncValues();
    syncRunningState();


    var observers = [];


    [
      source.level,
      source.score,
      source.targets,
      source.ufoShot,
      source.jets,
      source.slow,
      source.pause,
      source.message
    ].forEach(
      function (element) {

        var observer =
          observeElement(element);


        if (observer) {
          observers.push(observer);
        }

      }
    );


    var bodyObserver =
      new MutationObserver(
        syncRunningState
      );


    bodyObserver.observe(
      document.body,
      {
        childList: true
      }
    );


    window.addEventListener(
      "resize",
      function () {

        syncOrientation();
        syncRunningState();

      },
      {
        passive: true
      }
    );


    window.addEventListener(
      "orientationchange",
      function () {

        window.setTimeout(
          function () {

            syncOrientation();
            syncRunningState();

          },
          120
        );

      },
      {
        passive: true
      }
    );


    window.addEventListener(
      "ufo:intro-complete",
      function () {

        window.setTimeout(
          syncRunningState,
          80
        );

      }
    );


    window.addEventListener(
      "pagehide",
      function () {

        observers.forEach(
          function (observer) {
            observer.disconnect();
          }
        );


        bodyObserver.disconnect();


        window.clearTimeout(
          pulseTimer
        );

      },
      {
        once: true
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


  window.UFOGame.mobileHud = {
    sync:
      syncValues,

    syncRunningState:
      syncRunningState
  };

})();
