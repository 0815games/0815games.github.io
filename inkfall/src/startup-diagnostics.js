(() => {
  "use strict";

  const issues = [];
  let opened = false;

  function record(text) {
    issues.push({
      time: new Date().toLocaleTimeString("de-DE"),
      text: String(text)
    });

    if (issues.length > 100) issues.shift();
    render();
  }

  function render() {
    const frame = document.getElementById("inkfall-window");
    if (!frame) return;

    let button = document.getElementById("if-startup-toggle");
    let panel = document.getElementById("if-startup-errors");

    if (!button) {
      button = document.createElement("button");
      button.id = "if-startup-toggle";
      button.type = "button";
      button.setAttribute("aria-controls", "if-startup-errors");
      button.style.cssText = `
        position:absolute;
        top:4px;
        right:12px;
        z-index:260;
        width:auto;
        margin:0;
        padding:3px 9px;
        color:#f5edff;
        background:#594784;
        border:1px solid #ad93df;
        border-radius:7px;
        font:700 11px system-ui,sans-serif;
        cursor:pointer;
      `;

      button.onclick = () => {
        opened = !opened;
        render();
      };

      frame.append(button);
    }

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "if-startup-errors";
      panel.setAttribute("aria-label", "Startdiagnose");

      panel.style.cssText = `
        position:absolute;
        top:40px;
        right:12px;
        z-index:260;
        width:min(540px,calc(100% - 24px));
        max-height:60%;
        overflow:auto;
        padding:14px;
        color:#f4edff;
        background:#25233ff5;
        border:3px solid #a783ed;
        border-radius:14px 9px 15px 10px;
        box-shadow:0 5px 0 #12192a88;
        font:12px/1.5 system-ui,sans-serif;
        overflow-wrap:anywhere;
      `;

      frame.append(panel);
    }

    button.textContent = issues.length
      ? `Diagnose · ${issues.length}`
      : "Diagnose";

    button.setAttribute("aria-expanded", String(opened));
    button.style.borderColor = issues.length ? "#ffacbb" : "#ad93df";

    panel.hidden = !opened;

    if (!opened) return;

    panel.replaceChildren();

    const heading = document.createElement("strong");
    heading.textContent = "INKFALL – Startdiagnose";
    panel.append(heading);

    const status = document.createElement("p");
    status.textContent =
      "Webkonfiguration: " +
      (window.FIREBASE_CONFIG ? "vorhanden" : "fehlt") +
      " · Firebase SDK: " +
      (window.firebase ? "geladen" : "fehlt");

    panel.append(status);

    if (!issues.length) {
      const line = document.createElement("p");
      line.textContent =
        "Seit diesem Seitenstart wurden keine Startfehler erfasst. " +
        "Das bestätigt noch keinen erfolgreichen Datenbanktest.";
      panel.append(line);
    }

    for (const issue of issues) {
      const line = document.createElement("div");
      line.style.cssText =
        "margin-top:8px;padding:8px;background:#392b4c;border-radius:7px;";
      line.textContent = `${issue.time} – ${issue.text}`;
      panel.append(line);
    }

    const close = document.createElement("button");
    close.type = "button";
    close.textContent = "Schließen";
    close.style.cssText = `
      width:auto;
      margin-top:12px;
      padding:7px 12px;
      color:#202840;
      background:#d6bdff;
      border:2px solid #151c33;
      border-radius:8px;
      font:700 12px system-ui,sans-serif;
      cursor:pointer;
    `;
    close.onclick = () => {
      opened = false;
      render();
      button.focus();
    };

    panel.append(close);
  }

  window.addEventListener("error", event => {
    if (event.target instanceof HTMLScriptElement) {
      record("Script konnte nicht geladen werden: " + event.target.src);
    } else if (event.message) {
      record(
        event.message + " | " +
        (event.filename || "unbekannte Datei") +
        ":" + (event.lineno || "?")
      );
    }
  }, true);

  window.addEventListener("unhandledrejection", event => {
    record(
      "Nicht abgefangener Fehler: " +
      (event.reason?.message || String(event.reason))
    );
  });

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("load", render);
})();
