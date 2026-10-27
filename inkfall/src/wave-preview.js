(() => {
  "use strict";

  const menu = document.getElementById("ui");

  if (!menu || document.getElementById("if-wave-preview")) return;

  if (
    typeof waves === "undefined" ||
    typeof E === "undefined"
  ) {
    console.error("Wellen-Vorschau: Gegner- oder Wellendaten fehlen.");
    return;
  }

  const panel = document.createElement("section");
  panel.id = "if-wave-preview";
  panel.setAttribute("aria-label", "Wellen-Vorschau");

  const title = document.createElement("h2");
  const description = document.createElement("p");
  description.className = "if-wave-description";

  const grid = document.createElement("div");
  grid.className = "if-enemy-grid";

  const warnings = document.createElement("ul");
  warnings.className = "if-wave-warnings";

  const progress = document.createElement("div");
  progress.className = "if-wave-progress";

  const bar = document.createElement("span");
  progress.append(bar);

  panel.append(title, description, grid, warnings, progress);

  // Nach der Bauauswahl einfügen.
  const buildPanel = document.getElementById("if-build-grid")?.parentElement;

  if (buildPanel?.parentElement === menu) {
    buildPanel.after(panel);
  } else {
    menu.prepend(panel);
  }

  const symbols = {
    crawler:"●",
    runner:"»",
    tank:"▣",
    shield:"⬟",
    flyer:"↑",
    healer:"+",
    boss:"★"
  };

  let lastState = "";

  function addWarning(text) {
    const item = document.createElement("li");
    item.textContent = text;
    warnings.append(item);
  }

  function update() {
    const running = Boolean(active);
    const finished = !running && wave >= waves.length && lives > 0;
    const defeated = lives <= 0;

    const remaining = running
      ? enemies.filter(enemy => enemy.hp > 0 && enemy.alive !== false).length
        + queue.length
      : 0;

    const key = JSON.stringify({
      running, finished, defeated, wave, remaining
    });

    if (key === lastState) return;
    lastState = key;

    grid.replaceChildren();
    warnings.replaceChildren();

    progress.hidden = true;

    if (defeated) {
      title.textContent = "BASTION GEFALLEN";
      description.textContent =
        "Die Verteidigung ist beendet. Öffne das Hauptmenü oder lade neu.";
      return;
    }

    if (finished) {
      title.textContent = "VERTEIDIGUNG GESCHAFFT";
      description.textContent =
        "Alle verfügbaren Wellen wurden abgeschlossen.";
      return;
    }

    const index = running ? wave - 1 : wave;
    const definition = waves[index];

    if (!definition) {
      title.textContent = "KEINE WEITERE WELLE";
      description.textContent = "Für diesen Abschnitt fehlen Wellendaten.";
      return;
    }

    const totals = new Map();

    for (const [type, count] of definition) {
      totals.set(type, (totals.get(type) || 0) + count);
    }

    const planned = [...totals.values()].reduce(
      (sum, count) => sum + count, 0
    );

    title.textContent = running
      ? `WELLE ${wave} LÄUFT`
      : `ALS NÄCHSTES: WELLE ${index + 1}`;

    description.textContent = running
      ? `${remaining} Gegner aktiv oder noch im Anmarsch.`
      : `${planned} Gegner angekündigt. Bereite deine Verteidigung vor.`;

    for (const [type, count] of totals) {
      const enemy = E[type];
      if (!enemy) continue;

      const card = document.createElement("div");
      card.className = "if-enemy-card";

      const symbol = document.createElement("span");
      symbol.className = "if-enemy-symbol";
      symbol.style.setProperty("--enemy-color", enemy.col || "#8161af");
      symbol.textContent = symbols[type] || "✦";
      symbol.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.className = "if-enemy-label";

      const amount = document.createElement("strong");
      amount.textContent = `${count}×`;

      const name = document.createElement("span");
      name.textContent = enemy.n;

      label.append(amount, name);
      card.append(symbol, label);
      grid.append(card);
    }

    if (!running) {
      if (totals.has("runner")) {
        addWarning("Schnelle Gegner: Verlangsamung und gute Wegabdeckung helfen.");
      }
      if (totals.has("tank")) {
        addWarning("Panzerriesen: Hohe Lebenspunkte und Rüstung einplanen.");
      }
      if (totals.has("shield")) {
        addWarning("Schildlinge: Pfeilangriffe sind gegen ihren Schild schwächer.");
      }
      if (totals.has("flyer")) {
        addWarning("Luftangriff: Luftabwehr entlang der blauen Route platzieren.");
      }
      if (totals.has("healer")) {
        addWarning("Heiler: Mit dem Helden gezielt ausschalten.");
      }
      if (totals.has("boss")) {
        addWarning("Bosswelle: Fähigkeiten bereithalten und Begleitgegner beachten.");
      }
    } else {
      // Fortschritt bezieht sich auf die aktuell bekannte Gegnerzahl.
      // Zusätzliche Spawns können den Wert wieder verändern.
      const total = Math.max(planned, remaining, 1);
      const completed = Math.max(0, total - remaining);

      progress.hidden = false;
      bar.style.width = `${completed / total * 100}%`;
      progress.setAttribute(
        "aria-label",
        `${remaining} Gegner verbleibend`
      );
    }
  }

  update();
  setInterval(update, 250);
})();
