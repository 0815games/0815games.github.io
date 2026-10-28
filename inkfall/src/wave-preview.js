(() => {
  "use strict";

  const titlebar = document.getElementById("if-window-titlebar");
  const menu = document.getElementById("ui");

  if (!titlebar || !menu || document.getElementById("if-wave-header")) return;

  if (
    typeof waves === "undefined" ||
    typeof E === "undefined"
  ) {
    console.error("Wellen-Vorschau: Gegner- oder Wellendaten fehlen.");
    return;
  }

  // Kompakte Anzeige im Spiele-Header.
  const header = document.createElement("button");
  header.id = "if-wave-header";
  header.type = "button";
  header.className = "if-top-action";
  header.setAttribute("aria-expanded", "false");
  header.setAttribute("aria-controls", "if-wave-preview");

  const headerLabel = document.createElement("span");
  headerLabel.className = "if-wave-header-label";

  const headerProgress = document.createElement("span");
  headerProgress.className = "if-wave-header-progress";

  const headerBar = document.createElement("span");
  headerBar.className = "if-wave-header-bar";
  headerProgress.append(headerBar);

  header.append(headerLabel, headerProgress);

  // Direkt links neben "Hauptmenü" in die bestehende Button-Gruppe einsortieren.
  function placeHeader() {
    const actions = document.getElementById("if-top-actions");
    const home = document.getElementById("if-return-menu");

    if (!actions || !home) return false;
    if (header.parentElement === actions) return true;

    actions.insertBefore(header, home);
    return true;
  }

  if (!placeHeader()) {
    const placementTimer = setInterval(() => {
      if (placeHeader()) clearInterval(placementTimer);
    }, 50);

    setTimeout(() => clearInterval(placementTimer), 5000);
  }

  // Aufklappbare Detailvorschau.
  const panel = document.createElement("section");
  panel.id = "if-wave-preview";
  panel.hidden = true;
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
  titlebar.append(panel);

  header.onclick = () => {
    const open = panel.hidden;
    panel.hidden = !open;
    header.setAttribute("aria-expanded", String(open));
    header.classList.toggle("open", open);
  };

  const symbols = {
    crawler: "●",
    runner: "»",
    tank: "▣",
    shield: "⬟",
    flyer: "↑",
    healer: "+",
    boss: "★"
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
      headerLabel.textContent = "Bastion gefallen";
      headerBar.style.width = "0%";
      title.textContent = "BASTION GEFALLEN";
      description.textContent =
        "Die Verteidigung ist beendet. Öffne das Hauptmenü oder lade neu.";
      return;
    }

    if (finished) {
      headerLabel.textContent = "Verteidigung geschafft";
      headerBar.style.width = "100%";
      title.textContent = "VERTEIDIGUNG GESCHAFFT";
      description.textContent =
        "Alle verfügbaren Wellen wurden abgeschlossen.";
      return;
    }

    const index = running ? wave - 1 : wave;
    const definition = waves[index];

    if (!definition) {
      headerLabel.textContent = "Keine weitere Welle";
      headerBar.style.width = "0%";
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

    if (running) {
      headerLabel.textContent = `Welle ${wave} · ${remaining} übrig`;
      const total = Math.max(planned, remaining, 1);
      const completed = Math.max(0, total - remaining);
      const percent = completed / total * 100;

      headerBar.style.width = `${percent}%`;
      progress.hidden = false;
      bar.style.width = `${percent}%`;
      progress.setAttribute("aria-label", `${remaining} Gegner verbleibend`);

      title.textContent = `WELLE ${wave} LÄUFT`;
      description.textContent =
        `${remaining} Gegner aktiv oder noch im Anmarsch.`;
    } else {
      headerLabel.textContent = `Nächste Welle ${index + 1} · ${planned} Gegner`;
      headerBar.style.width = "0%";

      title.textContent = `ALS NÄCHSTES: WELLE ${index + 1}`;
      description.textContent =
        `${planned} Gegner angekündigt. Bereite deine Verteidigung vor.`;
    }

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
    }
  }

  update();
  setInterval(update, 250);
})();

/* Append after the existing wave-preview.js IIFE. */
(() => {
  "use strict";
  function mount() {
    if (document.getElementById("if-wave-disclosure")) return true;
    const frame = document.getElementById("inkfall-window");
    const actions = document.getElementById("if-top-actions");
    const header = document.getElementById("if-wave-header");
    const panel = document.getElementById("if-wave-preview");
    if (!frame || !actions || !header || !panel || header.parentElement !== actions) return false;

    const wrapper = document.createElement("div");
    wrapper.id = "if-wave-disclosure";
    const surface = document.createElement("div");
    surface.className = "if-wave-surface";
    surface.setAttribute("aria-hidden", "true");
    actions.insertBefore(wrapper, header);
    wrapper.append(surface, header, panel);
    panel.hidden = true;
    panel.inert = true;
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-labelledby", "if-wave-header");
    header.setAttribute("aria-expanded", "false");
    header.classList.remove("open");

    const style = document.createElement("style");
    style.id = "if-wave-disclosure-style";
    style.textContent = `
      #inkfall-window > #if-window-titlebar {
        position:relative; overflow:visible; z-index:30;
      }
      #inkfall-window > #if-battle {
        position:relative; isolation:isolate; z-index:0;
      }
      #inkfall-window #if-top-actions > #if-wave-disclosure {
        position:relative; display:inline-flex; flex:0 1 auto;
        align-items:stretch; min-width:0; max-width:100%; z-index:1;
      }
      #if-wave-disclosure > .if-wave-surface {
        box-sizing:border-box; position:absolute; top:0; left:0;
        width:100%; height:100%; z-index:0; pointer-events:none;
        border:2px solid #302c43; border-radius:9px;
        background:linear-gradient(#eaf6ff,#a9d9f7 44px,#fff1d3 44px);
        box-shadow:inset 0 2px 0 #f2fbff,0 3px 0 #4a7ba6,0 5px 0 #211e3433;
        transition:height 180ms cubic-bezier(.2,.8,.3,1);
      }
      #if-wave-disclosure.is-open > .if-wave-surface {
        height:var(--if-wave-expanded-height,100%);
      }
      #inkfall-window #if-window-titlebar #if-top-actions #if-wave-disclosure > #if-wave-header {
        position:relative; z-index:1; width:100%; min-width:0;
        border-color:transparent; background:transparent; box-shadow:none;
        transform:none; filter:none;
      }
      #if-wave-disclosure .if-wave-header-label {
        min-width:0; overflow:hidden; text-overflow:ellipsis;
      }
      #if-wave-disclosure .if-wave-header-progress { flex-shrink:0; }
      #inkfall-window #if-wave-disclosure > #if-wave-preview {
        box-sizing:border-box; position:absolute; top:calc(100% - 2px);
        left:0; right:auto; width:100%; margin:0; padding:0;
        min-height:0; overflow:auto; overscroll-behavior:contain;
        color:#302840; background:transparent; border:0;
        border-radius:0 0 9px 9px; box-shadow:none; z-index:1;
        animation:none; transform:none;
        opacity:0; clip-path:inset(0 0 100% 0); pointer-events:none;
        transition:clip-path 180ms cubic-bezier(.2,.8,.3,1),opacity 120ms ease;
      }
      #inkfall-window #if-wave-disclosure.is-open > #if-wave-preview {
        opacity:1; clip-path:inset(0); pointer-events:auto;
      }
      #inkfall-window #if-wave-disclosure > #if-wave-preview[hidden] {
        display:none !important;
      }
      @media(prefers-reduced-motion:reduce) {
        #if-wave-disclosure > .if-wave-surface,
        #inkfall-window #if-wave-disclosure > #if-wave-preview { transition:none; }
      }
    `;
    document.head.append(style);

    let opened = false, closeTimer = null, pending = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function measure() {
      if (panel.hidden) return;
      const rect = wrapper.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      const deck = document.getElementById("if-bottom-hud");
      const deckTop = deck?.getBoundingClientRect().top;
      const bottom = Number.isFinite(deckTop) && deckTop > rect.bottom
        ? Math.min(frameRect.bottom, deckTop) : frameRect.bottom;
      panel.style.maxHeight = Math.max(0, bottom - rect.bottom - 8) + "px";
      const height = Math.ceil(rect.height + panel.getBoundingClientRect().height);
      wrapper.style.setProperty("--if-wave-expanded-height", height + "px");
    }
    function scheduleMeasure() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; measure(); });
    }
    function setOpen(value, restoreFocus = false) {
      clearTimeout(closeTimer);
      closeTimer = null;
      opened = value;
      header.setAttribute("aria-expanded", String(value));
      header.classList.toggle("open", value);
      panel.inert = !value;
      if (value) {
        panel.hidden = false;
        measure();
        // Commit the collapsed frame before starting its height transition.
        surface.getBoundingClientRect();
        wrapper.classList.add("is-open");
      } else {
        wrapper.classList.remove("is-open");
        const hide = () => { if (!opened) panel.hidden = true; };
        if (reducedMotion.matches) hide();
        else closeTimer = setTimeout(hide, 190);
      }
      if (restoreFocus) header.focus({preventScroll:true});
    }
    header.onclick = () => setOpen(!opened);
    wrapper.addEventListener("keydown", event => {
      if (event.key === "Escape" && opened) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false, true);
      }
    });
    document.addEventListener("pointerdown", event => {
      if (opened && !wrapper.contains(event.target)) setOpen(false);
    });
    document.addEventListener("focusin", event => {
      if (opened && !wrapper.contains(event.target)) setOpen(false);
    });
    new MutationObserver(scheduleMeasure).observe(panel, {
      childList:true, subtree:true, characterData:true
    });
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(scheduleMeasure);
      observer.observe(wrapper);
      observer.observe(frame);
      const deck = document.getElementById("if-bottom-hud");
      if (deck) observer.observe(deck);
    }
    window.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("resize", scheduleMeasure);
    return true;
  }
  function start() {
    if (mount()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      if (mount() || ++attempts >= 100) clearInterval(timer);
    }, 50);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {once:true});
  } else start();
})();
