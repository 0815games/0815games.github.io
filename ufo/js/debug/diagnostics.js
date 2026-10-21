(function () {
  "use strict";


  window.UFOGame =
    window.UFOGame || {};


  var MAX_LOGS = 50;

  var logs = [];

  var counters = {
    error: 0,
    warning: 0,
    rejection: 0
  };


  var state = {
    open: false,
    startedAt: Date.now(),

    frames: 0,
    lastFrameAt: performance.now(),
    lastFpsUpdateAt: performance.now(),

    fps: 0,
    frameTime: 0,

    updateTimer: 0,
    animationFrame: 0,
    toastTimer: 0,

    threeFingerTapCount: 0,
    lastThreeFingerTapAt: 0
  };


  var originalConsole = {
    error:
      console.error.bind(console),

    warn:
      console.warn.bind(console)
  };


  var elements = {};


  function safeText(value) {

    if (value === null) {
      return "null";
    }


    if (
      typeof value === "undefined"
    ) {
      return "undefined";
    }


    if (
      value instanceof Error
    ) {

      return (
        value.name +
        ": " +
        value.message
      );

    }


    if (
      typeof value === "object"
    ) {

      try {

        return JSON.stringify(
          value,
          null,
          2
        );

      }

      catch (error) {
        return String(value);
      }

    }


    return String(value);

  }


  function argsToText(args) {

    return Array.prototype
      .map.call(
        args,
        safeText
      )
      .join(" ");

  }


  function currentTime() {

    return new Date()
      .toLocaleTimeString(
        "de-DE",
        {
          hour12: false
        }
      );

  }


  function addLog(
    type,
    message,
    details
  ) {

    var entry = {
      type: type,
      time: currentTime(),
      timestamp: Date.now(),
      message: String(
        message || "Unbekannter Fehler"
      ),
      details:
        details
          ? String(details)
          : ""
    };


    logs.unshift(entry);


    if (
      logs.length >
      MAX_LOGS
    ) {
      logs.length = MAX_LOGS;
    }


    if (type === "error") {
      counters.error += 1;
    }


    if (type === "warning") {
      counters.warning += 1;
    }


    if (type === "rejection") {
      counters.rejection += 1;
    }


    renderLogs();
    updateStatusClasses();

  }


  function interceptConsole() {

    console.error =
      function () {

        originalConsole.error
          .apply(
            console,
            arguments
          );


        addLog(
          "error",
          argsToText(arguments)
        );

      };


    console.warn =
      function () {

        originalConsole.warn
          .apply(
            console,
            arguments
          );


        addLog(
          "warning",
          argsToText(arguments)
        );

      };

  }


  function restoreConsole() {

    console.error =
      originalConsole.error;


    console.warn =
      originalConsole.warn;

  }


  function handleWindowError(event) {

    var locationText = "";


    if (event.filename) {

      locationText =
        event.filename;


      if (event.lineno) {
        locationText +=
          ":" +
          event.lineno;
      }


      if (event.colno) {
        locationText +=
          ":" +
          event.colno;
      }

    }


    addLog(
      "error",
      event.message ||
        "Unbehandelter JavaScript-Fehler",
      locationText
    );

  }


  function handleRejection(event) {

    var reason =
      event.reason;


    addLog(
      "rejection",
      "Unbehandelte Promise-Rejection",
      safeText(reason)
    );

  }


  function createElement(
    tag,
    className,
    text
  ) {

    var element =
      document.createElement(tag);


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


  function createValue(id) {

    var value =
      createElement(
        "span",
        "diagnosticsValue",
        "–"
      );


    value.id = id;

    return value;

  }


  function createRow(
    label,
    valueId
  ) {

    var row =
      createElement(
        "div",
        "diagnosticsRow"
      );


    row.appendChild(
      createElement(
        "span",
        "diagnosticsLabel",
        label
      )
    );


    row.appendChild(
      createValue(valueId)
    );


    return row;

  }


  function createCard(
    title,
    rows,
    fullWidth
  ) {

    var card =
      createElement(
        "section",
        "diagnosticsCard" +
        (
          fullWidth
            ? " diagnosticsCardFull"
            : ""
        )
      );


    card.appendChild(
      createElement(
        "div",
        "diagnosticsCardTitle",
        title
      )
    );


    rows.forEach(
      function (row) {
        card.appendChild(row);
      }
    );


    return card;

  }


  function createButton(
    text,
    title,
    className
  ) {

    var button =
      createElement(
        "button",
        "diagnosticsButton " +
        (
          className || ""
        ),
        text
      );


    button.type = "button";
    button.title = title;
    button.setAttribute(
      "aria-label",
      title
    );


    return button;

  }


  function buildInterface() {

    if (
      document.getElementById(
        "ufoDiagnostics"
      )
    ) {
      return;
    }


    var panel =
      createElement(
        "aside",
        ""
      );


    panel.id =
      "ufoDiagnostics";


    panel.setAttribute(
      "role",
      "dialog"
    );


    panel.setAttribute(
      "aria-label",
      "UFO-Jagd Diagnose"
    );


    panel.setAttribute(
      "aria-hidden",
      "true"
    );


    var header =
      createElement(
        "header",
        "diagnosticsHeader"
      );


    header.appendChild(
      createElement(
        "i",
        "diagnosticsSignal"
      )
    );


    var title =
      createElement(
        "div",
        "diagnosticsTitle"
      );


    title.innerHTML =
      "<strong>UFO DIAGNOSTICS</strong>" +
      "<span>F2 / ?debug=1 / Esc</span>";


    header.appendChild(title);


    var actions =
      createElement(
        "div",
        "diagnosticsHeaderActions"
      );


    var copyButton =
      createButton(
        "COPY",
        "Diagnosebericht kopieren"
      );


    var clearButton =
      createButton(
        "CLR",
        "Fehlerprotokoll löschen"
      );


    var closeButton =
      createButton(
        "×",
        "Diagnose schließen",
        "diagnosticsClose"
      );


    actions.appendChild(
      copyButton
    );


    actions.appendChild(
      clearButton
    );


    actions.appendChild(
      closeButton
    );


    header.appendChild(actions);
    panel.appendChild(header);


    var scroll =
      createElement(
        "div",
        "diagnosticsScroll"
      );


    var grid =
      createElement(
        "div",
        "diagnosticsGrid"
      );


    var performanceRows = [
      createRow(
        "FPS",
        "diagFps"
      ),
      createRow(
        "Frame",
        "diagFrameTime"
      ),
      createRow(
        "Qualität",
        "diagGraphicsQuality"
      ),
      createRow(
        "Ziel-FPS",
        "diagTargetFps"
      )
    ];


    var meter =
      createElement(
        "div",
        "diagnosticsMeter"
      );


    var meterBar =
      createElement(
        "i",
        ""
      );


    meterBar.id =
      "diagFpsMeter";


    meter.appendChild(meterBar);
    performanceRows.push(meter);


    grid.appendChild(
      createCard(
        "PERFORMANCE",
        performanceRows
      )
    );


    grid.appendChild(
      createCard(
        "GERÄT",
        [
          createRow(
            "Viewport",
            "diagViewport"
          ),
          createRow(
            "DPR",
            "diagDpr"
          ),
          createRow(
            "Eingabe",
            "diagPointer"
          ),
          createRow(
            "Ausrichtung",
            "diagOrientation"
          )
        ]
      )
    );


    grid.appendChild(
      createCard(
        "NETZWERK",
        [
          createRow(
            "Browser",
            "diagOnline"
          ),
          createRow(
            "Firebase",
            "diagFirebase"
          ),
          createRow(
            "Auth",
            "diagAuth"
          ),
          createRow(
            "UID",
            "diagUid"
          ),
          createRow(
            "Highscores",
            "diagHighscores"
          )
        ]
      )
    );


    grid.appendChild(
      createCard(
        "SPIELSTATUS",
        [
          createRow(
            "Phase",
            "diagPhase"
          ),
          createRow(
            "Level",
            "diagLevel"
          ),
          createRow(
            "Punkte",
            "diagScore"
          ),
          createRow(
            "UFOs",
            "diagTargets"
          ),
          createRow(
            "Jets",
            "diagJets"
          ),
          createRow(
            "Zeitlupe",
            "diagSlow"
          )
        ]
      )
    );


    grid.appendChild(
      createCard(
        "SYSTEME",
        [
          createRow(
            "Intro",
            "diagIntro"
          ),
          createRow(
            "Transition",
            "diagTransition"
          ),
          createRow(
            "Mobile HUD",
            "diagMobileHud"
          ),
          createRow(
            "Fadenkreuz",
            "diagCrosshair"
          ),
          createRow(
            "Reduced Motion",
            "diagReducedMotion"
          )
        ]
      )
    );


    var logCard =
      createElement(
        "section",
        "diagnosticsCard diagnosticsCardFull"
      );


    logCard.appendChild(
      createElement(
        "div",
        "diagnosticsCardTitle",
        "FEHLERPROTOKOLL"
      )
    );


    var summary =
      createElement(
        "div",
        "diagnosticsLogSummary"
      );


    summary.innerHTML =
      '<span id="diagErrorBadge" ' +
      'class="diagnosticsBadge error">FEHLER 0</span>' +
      '<span id="diagWarningBadge" ' +
      'class="diagnosticsBadge warning">WARNUNGEN 0</span>' +
      '<span id="diagRejectionBadge" ' +
      'class="diagnosticsBadge error">PROMISE 0</span>';


    logCard.appendChild(summary);


    var logList =
      createElement(
        "div",
        "diagnosticsLogs"
      );


    logList.id =
      "diagnosticsLogs";


    logCard.appendChild(logList);
    grid.appendChild(logCard);


    scroll.appendChild(grid);
    panel.appendChild(scroll);


    var footer =
      createElement(
        "footer",
        "diagnosticsFooter"
      );


    footer.innerHTML =
      '<span id="diagUptime">UPTIME 00:00</span>' +
      '<span id="diagLogCount">0 / ' +
      MAX_LOGS +
      " LOGS</span>";


    panel.appendChild(footer);
    document.body.appendChild(panel);


    var toast =
      createElement(
        "div",
        "diagnosticsToast"
      );


    toast.id =
      "diagnosticsToast";


    document.body.appendChild(toast);


    copyButton.addEventListener(
      "click",
      copyReport
    );


    clearButton.addEventListener(
      "click",
      clearLogs
    );


    closeButton.addEventListener(
      "click",
      close
    );


    elements.panel = panel;
    elements.logs = logList;
    elements.toast = toast;

  }


  function getElement(id) {

    return document.getElementById(id);

  }


  function setValue(
    id,
    value,
    status
  ) {

    var element =
      getElement(id);


    if (!element) {
      return;
    }


    element.textContent =
      String(value);


    element.classList.remove(
      "good",
      "warn",
      "error"
    );


    if (status) {
      element.classList.add(status);
    }

  }


  function elementText(id) {

    var element =
      getElement(id);


    return element
      ? element.textContent.trim()
      : "–";

  }


  function isElementVisible(element) {

    if (!element) {
      return false;
    }


    var style =
      window.getComputedStyle(
        element
      );


    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || 1) !== 0
    );

  }


  function shortenUid(uid) {

    if (!uid) {
      return "–";
    }


    if (uid.length <= 12) {
      return uid;
    }


    return (
      uid.slice(0, 6) +
      "…" +
      uid.slice(-5)
    );

  }


  function getGamePhase() {

    var intro =
      getElement("ufoIntro");


    var message =
      getElement("message");


    var pause =
      getElement("pause");


    if (intro) {

      if (
        intro.classList.contains(
          "intro-transition-running"
        )
      ) {
        return "ÜBERGANG";
      }


      if (
        intro.classList.contains(
          "intro-ready"
        )
      ) {
        return "INTRO BEREIT";
      }


      return "INTRO";
    }


    if (
      message &&
      isElementVisible(message)
    ) {
      return "MENÜ / GAME OVER";
    }


    if (
      pause &&
      pause.textContent
        .trim()
        .toUpperCase() ===
        "WEITER"
    ) {
      return "PAUSIERT";
    }


    return "MISSION AKTIV";

  }


  function getFirebaseStatus() {

    var fb =
      window.ufoFirebase;


    if (!fb) {

      return {
        status: "FEHLT",
        auth: "NEIN",
        uid: "–",
        state: "error"
      };

    }


    if (
      fb.ready &&
      fb.user
    ) {

      return {
        status: "ONLINE",
        auth: "ANONYM",
        uid:
          shortenUid(
            fb.user.uid
          ),
        state: "good"
      };

    }


    if (fb.readyPromise) {

      return {
        status: "VERBINDUNG",
        auth: "WARTET",
        uid: "–",
        state: "warn"
      };

    }


    return {
      status: "OFFLINE",
      auth: "NEIN",
      uid: "–",
      state: "error"
    };

  }


  function getHighscoreStatus() {

    if (
      !window.UfoHighscores
    ) {
      return {
        text: "SERVICE FEHLT",
        status: "error"
      };
    }


    if (
      typeof window.UfoHighscores
        .getCached === "function"
    ) {

      var cached =
        window.UfoHighscores
          .getCached();


      return {
        text:
          "GLOBAL / " +
          cached.length +
          " EINTRÄGE",
        status:
          navigator.onLine
            ? "good"
            : "warn"
      };

    }


    return {
      text: "SERVICE AKTIV",
      status: "good"
    };

  }


  function updateDiagnostics() {

    if (!state.open) {
      return;
    }


    var viewport =
      window.visualViewport;


    var width =
      viewport
        ? Math.round(
            viewport.width
          )
        : window.innerWidth;


    var height =
      viewport
        ? Math.round(
            viewport.height
          )
        : window.innerHeight;


    var finePointer =
      window.matchMedia(
        "(pointer: fine)"
      ).matches;


    var coarsePointer =
      window.matchMedia(
        "(pointer: coarse)"
      ).matches;


    var portrait =
      window.matchMedia(
        "(orientation: portrait)"
      ).matches;


    var reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;


    setValue(
      "diagFps",
      state.fps.toFixed(1),
      state.fps >= 50
        ? "good"
        : state.fps >= 30
          ? "warn"
          : "error"
    );


    setValue(
      "diagFrameTime",
      state.frameTime.toFixed(1) + " ms",
      state.frameTime <= 20
        ? "good"
        : state.frameTime <= 34
          ? "warn"
          : "error"
    );

    var performanceSettings =
      window.UFOGame &&
      window.UFOGame.settings;

    setValue(
      "diagGraphicsQuality",
      performanceSettings
        ? performanceSettings
            .getGraphics()
            .toUpperCase()
        : "–"
    );

    setValue(
      "diagTargetFps",
      performanceSettings &&
      typeof performanceSettings.getTargetFps ===
      "function"
        ? performanceSettings.getTargetFps() + " FPS"
        : "–"
    );


    var meter =
      getElement(
        "diagFpsMeter"
      );


    if (meter) {

      meter.style.width =
        Math.min(
          100,
          Math.max(
            0,
            state.fps / 60 * 100
          )
        ).toFixed(1) + "%";

    }


    setValue(
      "diagViewport",
      width + " × " + height
    );


    setValue(
      "diagDpr",
      Number(
        window.devicePixelRatio || 1
      ).toFixed(2)
    );


    setValue(
      "diagPointer",
      finePointer
        ? "MAUS"
        : coarsePointer
          ? "TOUCH"
          : "UNBEKANNT"
    );


    setValue(
      "diagOrientation",
      portrait
        ? "PORTRAIT"
        : "LANDSCAPE"
    );


    setValue(
      "diagOnline",
      navigator.onLine
        ? "ONLINE"
        : "OFFLINE",
      navigator.onLine
        ? "good"
        : "error"
    );


    var firebaseStatus =
      getFirebaseStatus();


    setValue(
      "diagFirebase",
      firebaseStatus.status,
      firebaseStatus.state
    );


    setValue(
      "diagAuth",
      firebaseStatus.auth,
      firebaseStatus.state
    );


    setValue(
      "diagUid",
      firebaseStatus.uid
    );


    var highscoreStatus =
      getHighscoreStatus();


    setValue(
      "diagHighscores",
      highscoreStatus.text,
      highscoreStatus.status
    );


    setValue(
      "diagPhase",
      getGamePhase()
    );


    setValue(
      "diagLevel",
      elementText("level")
    );


    setValue(
      "diagScore",
      elementText("score")
    );


    setValue(
      "diagTargets",
      elementText("targets")
    );


    setValue(
      "diagJets",
      elementText("jetShot")
    );


    setValue(
      "diagSlow",
      elementText("slow")
    );


    var intro =
      getElement("ufoIntro");


    setValue(
      "diagIntro",
      intro
        ? "AKTIV"
        : "BEENDET",
      intro
        ? "warn"
        : "good"
    );


    var transition =
      window.UFOGame &&
      window.UFOGame.introTransition;


    setValue(
      "diagTransition",
      transition
        ? (
            transition.isRunning()
              ? "LÄUFT"
              : "BEREIT"
          )
        : "FEHLT",
      transition
        ? "good"
        : "error"
    );


    setValue(
      "diagMobileHud",
      getElement("mobileHud")
        ? "GELADEN"
        : "INAKTIV",
      getElement("mobileHud")
        ? "good"
        : ""
    );


    setValue(
      "diagCrosshair",
      getElement("gameCrosshair")
        ? "GELADEN"
        : (
            coarsePointer
              ? "TOUCH: AUS"
              : "FEHLT"
          ),
      (
        getElement("gameCrosshair") ||
        coarsePointer
      )
        ? "good"
        : "warn"
    );


    setValue(
      "diagReducedMotion",
      reducedMotion
        ? "AKTIV"
        : "AUS"
    );


    var uptime =
      Math.floor(
        (
          Date.now() -
          state.startedAt
        ) / 1000
      );


    var minutes =
      Math.floor(
        uptime / 60
      );


    var seconds =
      uptime % 60;


    var uptimeElement =
      getElement("diagUptime");


    if (uptimeElement) {

      uptimeElement.textContent =
        "UPTIME " +
        String(minutes)
          .padStart(2, "0") +
        ":" +
        String(seconds)
          .padStart(2, "0");

    }


    var countElement =
      getElement("diagLogCount");


    if (countElement) {

      countElement.textContent =
        logs.length +
        " / " +
        MAX_LOGS +
        " LOGS";

    }

  }


  function renderLogs() {

    var container =
      getElement(
        "diagnosticsLogs"
      );


    if (!container) {
      return;
    }


    container.replaceChildren();


    if (!logs.length) {

      container.appendChild(
        createElement(
          "div",
          "diagnosticsEmpty",
          "Keine Fehler oder Warnungen erfasst."
        )
      );

    }

    else {

      logs.forEach(
        function (entry) {

          var item =
            createElement(
              "article",
              "diagnosticsLogEntry " +
              (
                entry.type === "warning"
                  ? "warning"
                  : "error"
              )
            );


          var meta =
            createElement(
              "div",
              "diagnosticsLogMeta"
            );


          meta.appendChild(
            createElement(
              "span",
              "diagnosticsLogType",
              entry.type.toUpperCase()
            )
          );


          meta.appendChild(
            createElement(
              "span",
              "diagnosticsLogTime",
              entry.time
            )
          );


          item.appendChild(meta);


          var message =
            createElement(
              "div",
              "diagnosticsLogMessage",
              entry.message
            );


          if (entry.details) {

            message.textContent +=
              "\n" +
              entry.details;

          }


          item.appendChild(message);
          container.appendChild(item);

        }
      );

    }


    var errorBadge =
      getElement(
        "diagErrorBadge"
      );


    var warningBadge =
      getElement(
        "diagWarningBadge"
      );


    var rejectionBadge =
      getElement(
        "diagRejectionBadge"
      );


    if (errorBadge) {

      errorBadge.textContent =
        "FEHLER " +
        counters.error;

    }


    if (warningBadge) {

      warningBadge.textContent =
        "WARNUNGEN " +
        counters.warning;

    }


    if (rejectionBadge) {

      rejectionBadge.textContent =
        "PROMISE " +
        counters.rejection;

    }


    var count =
      getElement("diagLogCount");


    if (count) {

      count.textContent =
        logs.length +
        " / " +
        MAX_LOGS +
        " LOGS";

    }

  }


  function updateStatusClasses() {

    var panel =
      getElement(
        "ufoDiagnostics"
      );


    if (!panel) {
      return;
    }


    panel.classList.toggle(
      "hasErrors",
      counters.error > 0 ||
      counters.rejection > 0
    );


    panel.classList.toggle(
      "hasWarnings",
      counters.warning > 0
    );

  }


  function clearLogs() {

    logs.length = 0;

    counters.error = 0;
    counters.warning = 0;
    counters.rejection = 0;

    renderLogs();
    updateStatusClasses();

    showToast(
      "Protokoll gelöscht"
    );

  }


  function buildReport() {

    var firebaseStatus =
      getFirebaseStatus();


    var highscoreStatus =
      getHighscoreStatus();


    var report = {
      generatedAt:
        new Date().toISOString(),

      url:
        window.location.href,

      environment: {
        userAgent:
          navigator.userAgent,

        online:
          navigator.onLine,

        viewport:
          window.innerWidth +
          "x" +
          window.innerHeight,

        dpr:
          window.devicePixelRatio || 1,

        orientation:
          window.matchMedia(
            "(orientation: portrait)"
          ).matches
            ? "portrait"
            : "landscape",

        pointer:
          window.matchMedia(
            "(pointer: coarse)"
          ).matches
            ? "coarse"
            : "fine"
      },

      performance: {
        fps:
          Number(
            state.fps.toFixed(1)
          ),

        frameTimeMs:
          Number(
            state.frameTime.toFixed(1)
          ),

        graphics:
          window.UFOGame &&
          window.UFOGame.settings
            ? window.UFOGame.settings
                .get("graphics")
            : "unknown",

        targetFps:
          window.UFOGame &&
          window.UFOGame.settings
            ? window.UFOGame.settings
                .get("targetFps")
            : null,

        performanceRecommendation:
          window.UFOGame &&
          window.UFOGame
            .performanceRecommendation
            ? window.UFOGame
                .performanceRecommendation
                .get()
            : null
      },

      game: {
        phase:
          getGamePhase(),

        level:
          elementText("level"),

        score:
          elementText("score"),

        targets:
          elementText("targets"),

        jets:
          elementText("jetShot"),

        slowMotion:
          elementText("slow")
      },

      firebase: {
        status:
          firebaseStatus.status,

        auth:
          firebaseStatus.auth,

        uid:
          firebaseStatus.uid,

        highscores:
          highscoreStatus.text
      },

      counters: {
        errors:
          counters.error,

        warnings:
          counters.warning,

        promiseRejections:
          counters.rejection
      },

      logs:
        logs.slice()
    };


    return JSON.stringify(
      report,
      null,
      2
    );

  }


  function fallbackCopy(text) {

    var textarea =
      document.createElement(
        "textarea"
      );


    textarea.value = text;


    textarea.style.position =
      "fixed";


    textarea.style.opacity =
      "0";


    textarea.style.pointerEvents =
      "none";


    document.body.appendChild(
      textarea
    );


    textarea.focus();
    textarea.select();


    var success = false;


    try {

      success =
        document.execCommand(
          "copy"
        );

    }

    catch (error) {
      success = false;
    }


    textarea.remove();

    return success;

  }


  function copyReport() {

    var report =
      buildReport();


    if (
      navigator.clipboard &&
      typeof navigator.clipboard
        .writeText === "function"
    ) {

      navigator.clipboard
        .writeText(report)

        .then(
          function () {

            showToast(
              "Diagnosebericht kopiert"
            );

          }
        )

        .catch(
          function () {

            var copied =
              fallbackCopy(report);


            showToast(
              copied
                ? "Diagnosebericht kopiert"
                : "Kopieren nicht möglich"
            );

          }
        );

    }

    else {

      var copied =
        fallbackCopy(report);


      showToast(
        copied
          ? "Diagnosebericht kopiert"
          : "Kopieren nicht möglich"
      );

    }

  }


  function showToast(message) {

    var toast =
      getElement(
        "diagnosticsToast"
      );


    if (!toast) {
      return;
    }


    window.clearTimeout(
      state.toastTimer
    );


    toast.textContent =
      message;


    toast.classList.add(
      "show"
    );


    state.toastTimer =
      window.setTimeout(
        function () {

          toast.classList.remove(
            "show"
          );

        },
        1600
      );

  }


  function open() {

    buildInterface();

    state.open = true;


    document.body.classList.add(
      "ufo-diagnostics-open"
    );


    var panel =
      getElement(
        "ufoDiagnostics"
      );


    if (panel) {

      panel.setAttribute(
        "aria-hidden",
        "false"
      );

    }


    renderLogs();
    updateDiagnostics();


    window.clearInterval(
      state.updateTimer
    );


    state.updateTimer =
      window.setInterval(
        updateDiagnostics,
        400
      );

  }


  function close() {

    state.open = false;


    document.body.classList.remove(
      "ufo-diagnostics-open"
    );


    var panel =
      getElement(
        "ufoDiagnostics"
      );


    if (panel) {

      panel.setAttribute(
        "aria-hidden",
        "true"
      );

    }


    window.clearInterval(
      state.updateTimer
    );


    state.updateTimer = 0;

  }


  function toggle() {

    if (state.open) {
      close();
    }

    else {
      open();
    }

  }


  function frameLoop(now) {

    state.frames += 1;


    var delta =
      now -
      state.lastFrameAt;


    if (
      delta > 0 &&
      delta < 1000
    ) {

      state.frameTime =
        state.frameTime === 0
          ? delta
          : (
              state.frameTime *
              .88 +
              delta *
              .12
            );

    }


    state.lastFrameAt = now;


    var elapsed =
      now -
      state.lastFpsUpdateAt;


    if (elapsed >= 500) {

      state.fps =
        state.frames *
        1000 /
        elapsed;


      state.frames = 0;


      state.lastFpsUpdateAt =
        now;

    }


    state.animationFrame =
      window.requestAnimationFrame(
        frameLoop
      );

  }


  function handleKey(event) {

    var active =
      document.activeElement;


    var editing =
      active &&
      /^(input|textarea|select)$/i
        .test(active.tagName);


    if (
      event.key === "F2"
    ) {

      event.preventDefault();
      event.stopPropagation();

      toggle();

      return;
    }


    if (
      event.key === "Escape" &&
      state.open &&
      !editing
    ) {

      event.preventDefault();
      close();

    }

  }


  function handleThreeFingerTouch(
    event
  ) {

    if (
      !event.touches ||
      event.touches.length !== 3
    ) {
      return;
    }


    var now = Date.now();


    if (
      now -
      state.lastThreeFingerTapAt >
      1200
    ) {

      state.threeFingerTapCount = 0;

    }


    state.lastThreeFingerTapAt =
      now;


    state.threeFingerTapCount += 1;


    if (
      state.threeFingerTapCount >= 5
    ) {

      state.threeFingerTapCount = 0;

      toggle();

    }

  }


  function queryRequestsDebug() {

    try {

      var params =
        new URLSearchParams(
          window.location.search
        );


      return (
        params.get("debug") === "1" ||
        params.get("diagnostics") === "1"
      );

    }

    catch (error) {
      return false;
    }

  }


  function init() {

    buildInterface();
    interceptConsole();


    window.addEventListener(
      "error",
      handleWindowError
    );


    window.addEventListener(
      "unhandledrejection",
      handleRejection
    );


    document.addEventListener(
      "keydown",
      handleKey,
      true
    );


    document.addEventListener(
      "touchstart",
      handleThreeFingerTouch,
      {
        passive: true
      }
    );


    window.addEventListener(
      "online",
      updateDiagnostics
    );


    window.addEventListener(
      "offline",
      updateDiagnostics
    );


    state.animationFrame =
      window.requestAnimationFrame(
        frameLoop
      );


    renderLogs();


    if (queryRequestsDebug()) {
      open();
    }


    window.addEventListener(
      "pagehide",
      function () {

        close();
        restoreConsole();

        window.removeEventListener(
          "error",
          handleWindowError
        );


        window.removeEventListener(
          "unhandledrejection",
          handleRejection
        );


        document.removeEventListener(
          "keydown",
          handleKey,
          true
        );


        window.cancelAnimationFrame(
          state.animationFrame
        );


        window.clearTimeout(
          state.toastTimer
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


  window.UFOGame.diagnostics = {
    open: open,
    close: close,
    toggle: toggle,

    addLog: addLog,

    clear: clearLogs,

    copyReport: copyReport,

    getReport: buildReport,

    isOpen: function () {
      return state.open;
    }
  };

})();
