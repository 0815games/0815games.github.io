(() => {
  "use strict";

  const events = [];
  const startedAt = new Date().toISOString();

  let opened = false;
  let version = 0;
  let renderedVersion = -1;
  let latestHeartbeat = 0;
  let stalledReported = false;

  function clean(value) {
    return String(value ?? "")
      .replace(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        "[E-Mail entfernt]"
      )
      .replace(/AIza[A-Za-z0-9_-]+/g, "[API-Key entfernt]")
      .replace(
        /([?&](?:token|access_token|refresh_token|key|password)=)[^&\s]+/gi,
        "$1[entfernt]"
      )
      .slice(0, 12000);
  }

  function read(getter, fallback = "nicht verfügbar") {
    try {
      const value = getter();
      return value === undefined || value === null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function state() {
    return {
      browserOnline: navigator.onLine,
      pageVisible: !document.hidden,
      firebaseSdk: Boolean(window.firebase),
      firebaseConfig: Boolean(window.FIREBASE_CONFIG),
      signedIn: read(() => Boolean(auth.currentUser), false),
      databaseConnected: read(() => dbConnected, false),
      mode: read(() => window.inkfallMode),
      character: read(() => activeCharacterId),
      characterLoaded: read(
        () => Boolean(characterLoadedUid) &&
          characterLoadedUid === auth.currentUser?.uid,
        false
      ),
      level: read(
        () => currentProfile.characters[activeCharacterId].level
      ),
      wave: read(() => wave),
      waveActive: read(() => active, false),
      speed: read(() => speed),
      enemies: read(() => enemies.length),
      queuedEnemies: read(() => queue.length),
      towers: read(() => towers.length),
      skillPoints: read(() => skillPoints),
      lastSave: read(() => lastSave),
      lastError: clean(read(() => lastError, "")),
      heartbeatAgeMs: latestHeartbeat
        ? Math.round(performance.now() - latestHeartbeat)
        : null
    };
  }

  function record(level, source, value) {
    const error = value instanceof Error ? value : null;
    const message = clean(error ? error.message : value);
    const previous = events[events.length - 1];

    if (
      previous &&
      previous.level === level &&
      previous.source === source &&
      previous.message === message &&
      Date.now() - previous.lastSeen < 2000
    ) {
      previous.count++;
      previous.lastSeen = Date.now();
    } else {
      events.push({
        time: new Date().toISOString(),
        lastSeen: Date.now(),
        level,
        source: clean(source),
        message,
        code: clean(value?.code || ""),
        stack: clean(value?.stack || ""),
        count: 1
      });
    }

    while (events.length > 200) events.shift();
    version++;
    render();
  }

  window.inkfallDiag = {
    info(source, message) {
      record("info", source, message);
    },
    warn(source, message) {
      record("warning", source, message);
    },
    capture(error, source = "Anwendung") {
      record("error", source, error);
    },
    heartbeat() {
      latestHeartbeat = performance.now();
      stalledReported = false;
    },
    snapshot() {
      return {startedAt, state:state(), events:JSON.parse(JSON.stringify(events))};
    }
  };

  function button(label, action) {
    const element = document.createElement("button");
    element.type = "button";
    element.textContent = label;
    element.style.cssText = `
      width:auto;margin:5px 6px 5px 0;padding:7px 10px;
      color:#182141;background:#d6bdff;
      border:2px solid #111a32;border-radius:8px;
      font:700 12px system-ui;cursor:pointer;
    `;
    element.onclick = action;
    return element;
  }

  function exportReport() {
    const report = window.inkfallDiag.snapshot();
    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      {type:"application/json"}
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inkfall-diagnose-" +
      new Date().toISOString().replace(/[:.]/g, "-") + ".json";

    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function render() {
    const frame = document.getElementById("inkfall-window");
    if (!frame) return;

    let toggle = document.getElementById("if-startup-toggle");
    let panel = document.getElementById("if-startup-errors");

    if (!toggle) {
      toggle = button("Diagnose", () => {
        opened = !opened;
        renderedVersion = -1;
        render();
      });
      toggle.id = "if-startup-toggle";
      toggle.setAttribute("aria-controls", "if-startup-errors");
      toggle.style.cssText += `
        position:absolute;top:3px;right:10px;z-index:260;
        margin:0;padding:4px 9px;font-size:11px;
      `;
      frame.append(toggle);
    }

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "if-startup-errors";
      panel.setAttribute("aria-label", "INKFALL Diagnose");
      panel.style.cssText = `
        position:absolute;top:40px;right:12px;z-index:260;
        width:min(640px,calc(100% - 24px));max-height:80%;
        overflow:auto;padding:15px;color:#edf0ff;
        background:#20243bf5;border:3px solid #ad8eea;
        border-radius:15px;box-shadow:0 5px 0 #101733;
        font:12px/1.5 system-ui;overflow-wrap:anywhere;
      `;

      const heading = document.createElement("strong");
      heading.textContent = "INKFALL · Diagnose";

      const controls = document.createElement("div");
      controls.append(
        button("Bericht exportieren", exportReport),
        button("Diagnose testen", () => {
          const error = new Error("Absichtlich erzeugter Diagnose-Test.");
          error.code = "DIAGNOSTIC_TEST";
          window.inkfallDiag.capture(error, "Selbsttest");
        }),
        button("Protokoll leeren", () => {
          events.length = 0;
          version++;
          render();
        }),
        button("Schließen", () => {
          opened = false;
          render();
          toggle.focus();
        })
      );

      const status = document.createElement("pre");
      status.id = "if-diagnostic-state";
      status.style.cssText =
        "white-space:pre-wrap;padding:10px;background:#142039;border-radius:8px;";

      const list = document.createElement("div");
      list.id = "if-diagnostic-events";

      panel.append(heading, controls, status, list);
      frame.append(panel);
    }

    const errorCount = events
      .filter(event => event.level === "error")
      .reduce((sum, event) => sum + event.count, 0);

    toggle.textContent = errorCount ? "Diagnose · " + errorCount : "Diagnose";
    toggle.setAttribute("aria-expanded", String(opened));
    toggle.style.background = errorCount ? "#ffb3c4" : "#d6bdff";
    panel.hidden = !opened;

    if (!opened) return;

    panel.querySelector("#if-diagnostic-state").textContent =
      JSON.stringify(state(), null, 2);

    if (renderedVersion === version) return;
    renderedVersion = version;

    const list = panel.querySelector("#if-diagnostic-events");
    list.replaceChildren();

    if (!events.length) {
      const empty = document.createElement("p");
      empty.textContent =
        "Keine Ereignisse erfasst. Das ist keine automatische Freigabe aller Funktionen.";
      list.append(empty);
    }

    for (const event of [...events].reverse()) {
      const entry = document.createElement("details");
      entry.style.cssText = `
        margin-top:8px;padding:9px;border-radius:8px;
        background:${event.level === "error" ? "#4d2c45" : "#303951"};
      `;

      const summary = document.createElement("summary");
      summary.textContent =
        `${event.time.slice(11,19)} · ${event.level} · ${event.source}` +
        (event.count > 1 ? ` · ${event.count}×` : "");

      const text = document.createElement("p");
      text.textContent = event.message;

      const detail = document.createElement("pre");
      detail.style.whiteSpace = "pre-wrap";
      detail.textContent =
        (event.code ? "Code: " + event.code + "\n" : "") + event.stack;

      entry.append(summary, text, detail);
      list.append(entry);
    }
  }

  window.addEventListener("error", event => {
    if (event.target instanceof HTMLScriptElement ||
        event.target instanceof HTMLLinkElement ||
        event.target instanceof HTMLImageElement) {
      record(
        "error",
        "Datei laden",
        event.target.src || event.target.href || "Unbekannte Ressource"
      );
    } else if (event.message) {
      window.inkfallDiag.capture(
        event.error || new Error(
          event.message + " @ " + event.filename + ":" + event.lineno
        ),
        "JavaScript"
      );
    }
  }, true);

  window.addEventListener("unhandledrejection", event => {
    window.inkfallDiag.capture(
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason)),
      "Unbehandelte Promise"
    );
  });

  window.addEventListener("offline", () =>
    window.inkfallDiag.warn("Netzwerk", "Browser meldet offline.")
  );

  window.addEventListener("online", () =>
    window.inkfallDiag.info("Netzwerk", "Browser meldet online.")
  );

  setInterval(() => {
    const current = state();

    if (
      current.pageVisible &&
      current.waveActive &&
      typeof current.speed === "number" &&
      current.speed > 0 &&
      current.heartbeatAgeMs > 4000 &&
      !stalledReported
    ) {
      stalledReported = true;
      window.inkfallDiag.warn(
        "Spielschleife",
        "Seit über vier Sekunden kein Update-Heartbeat. Möglicher Stillstand."
      );
    }

    render();
  }, 1000);

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("load", render);
})();
