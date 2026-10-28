(() => {
  "use strict";

  const frame = document.getElementById("inkfall-window");
  const game = document.getElementById("game");
  const menu = document.getElementById("ui");
  const scroll = document.getElementById("if-menu-scroll");

  if (!frame || !game || !menu || !scroll) {
    console.error("Battle-Layout: Vorhandenes Spielfenster fehlt.");
    return;
  }

  if (document.getElementById("if-battle")) return;

  const battle = document.createElement("div");
  battle.id = "if-battle";

  const stage = document.createElement("section");
  stage.id = "if-stage";
  stage.setAttribute("aria-label", "Schlachtfeld");

  const top = document.createElement("div");
  top.id = "if-top-hud";

  const bottom = document.createElement("div");
  bottom.id = "if-bottom-hud";

  const hidden = document.createElement("div");
  hidden.id = "if-hidden-status";

  // Vorhandene Controls behalten ihre Handler und IDs.
  const buttons = Array.from(menu.querySelectorAll("button"));
  const stats = Array.from(menu.querySelectorAll(".stat"));

  function panel(title) {
    const wrapper = document.createElement("section");
    wrapper.className = "if-panel";
    const heading = document.createElement("h2");
    heading.textContent = title;
    wrapper.append(heading);
    return wrapper;
  }

  const buildPanel = panel("TÜRME");
  const buildGrid = document.createElement("div");
  buildGrid.id = "if-build-grid";
  buildPanel.append(buildGrid);

  /* INKFALL_TOWER_AFFORDABILITY_V1 */
  const affordabilityStyle = document.createElement("style");
  affordabilityStyle.textContent = `
    #if-build-grid button.if-build-unaffordable {
      filter: grayscale(1);
      opacity: 0.45;
      cursor: not-allowed;
      box-shadow: none;
    }

    #if-build-grid button:disabled:hover {
      transform: none;
    }
  `;
  document.head.append(affordabilityStyle);


  const selectionPanel = document.createElement("div");
  const selection = document.createElement("div");
  selection.id = "if-selection";

  const selectionText = document.createElement("p");
  selectionText.textContent = "Wähle einen Turm auf der Karte.";
  // Auswahltext bleibt nur als interne Referenz erhalten.
  selectionPanel.append(selection);

  const controls = panel("VERTEIDIGUNG");
  // Interner Sammelbehälter für die alte Menü-Sortierung.
  // Wird nach Verschieben der oberen Aktionen aus dem DOM entfernt.
  const extras = document.createElement("div");
  extras.id = "if-retired-menu";
  extras.hidden = true;

  const heroBadge = document.createElement("div");
  heroBadge.className = "if-hero-badge";

  const heroImage = document.createElement("img");
  heroImage.src = "assets/art/heroes/knight.svg";
  heroImage.alt = "";
  heroImage.onerror = () => { heroImage.hidden = true; };
  heroBadge.append(heroImage);

  // Statusanzeigen aus dem bisherigen Menü holen.
  for (const stat of stats) {
    if (stat.querySelector("#lives")) {
      stat.firstElementChild.textContent = "♥";
      top.append(stat);
    } else if (stat.querySelector("#gold")) {
      stat.firstElementChild.textContent = "Gold";
      top.append(stat);
    } else if (stat.querySelector("#wave")) {
      stat.firstElementChild.textContent = "Welle";
      top.append(stat);
    } else if (stat.querySelector("#className")) {
      heroBadge.append(stat.querySelector("#className"));
      hidden.append(stat);
    } else {
      hidden.append(stat);
    }
  }

  bottom.append(heroBadge);

  const shortcutButtons = [];
  const towerInfo = {
    arrow:   {name:"Pfeilturm", icon:"➶", color:"#bd7944", cost:100},
    frost:   {name:"Frostturm", icon:"❄", color:"#429fc5", cost:140},
    cannon:  {name:"Kanone", icon:"●", color:"#e88f48", cost:180},
    antiair: {name:"Luftabwehr", icon:"↑", color:"#9761c5", cost:160}
  };

  let resetButton = null;

  for (const button of buttons) {
    const action = button.getAttribute("onclick") || "";
    const match = action.match(/build\(['"]([^'"]+)['"]\)/);

    if (match) {
      const type = match[1];
      const info = towerInfo[type] || {
        name:type, icon:"✦", color:"#7262ac", cost:0
      };

      button.classList.add("if-build-tile");
      button.setAttribute("aria-label", `${info.name} bauen`);
      button.title = `${info.name} auswählen und auf der Karte platzieren`;
      button.replaceChildren();

      if (type === "arrow") {
        const image = document.createElement("img");
        image.src = "assets/art/towers/arrow.svg";
        image.alt = "";
        image.onerror = () => {
          const fallback = document.createElement("span");
          fallback.className = "if-tower-icon";
          fallback.textContent = info.icon;
          image.replaceWith(fallback);
        };
        button.append(image);
      } else {
        const icon = document.createElement("span");
        icon.className = "if-tower-icon";
        icon.style.setProperty("--tile-color", info.color);
        icon.textContent = info.icon;
        button.append(icon);
      }

      const name = document.createElement("span");
      name.textContent = info.name;

      const price = document.createElement("span");
      price.className = "if-build-price";
      price.dataset.tower = type;
      price.textContent = `${info.cost} G`;

      button.append(name, price);
      buildGrid.append(button);
    } else if (button.id === "abilityBtn") {
      bottom.append(button);
    } else if (action.includes("openTree")) {
      shortcutButtons.push(button);
    } else if (action.includes("openCodex")) {
      button.textContent = "Spielbuch";
      shortcutButtons.push(button);
    } else if (button.id === "up") {
      selection.append(button);
    } else if (
      button.id === "start" ||
      action.includes("speed=") ||
      action.includes("speed =")
    ) {
      controls.append(button);
    } else if (action.includes("setHero")) {
      let chooser = extras.querySelector("details");
      if (!chooser) {
        chooser = document.createElement("details");
        const summary = document.createElement("summary");
        chooser.append(summary);
        extras.append(chooser);
      }
      chooser.append(button);
    } else {
      if (button.textContent.toLowerCase().includes("neustart")) {
        resetButton = button;
      }
      extras.append(button);
    }
  }

  const spacer = document.createElement("div");
  spacer.className = "if-hud-spacer";
  bottom.append(spacer);
  shortcutButtons.forEach(button => bottom.append(button));

  const account = document.createElement("div");
  account.hidden = true;

  // Übrige Originalelemente bleiben versteckt erhalten.
  for (const child of Array.from(menu.children)) {
    hidden.append(child);
  }

  buildPanel.append(selectionPanel);
  menu.append(buildPanel, controls, extras, hidden);

  frame.append(battle);
  battle.append(stage, scroll);
  stage.append(game, top, bottom);

  // Firebase erzeugt den Accountbereich eventuell erst später.
  function adoptAccount() {
    const authBox = document.getElementById("authBox");
    if (authBox && authBox.parentElement !== account) {
      account.append(authBox);
    }
  }

  adoptAccount();
  new MutationObserver(adoptAccount).observe(scroll, {childList:true});

  // Turmauswahl wiederherstellen: bisher ging jeder Klick an den Helden.
  const previousClick = game.querySelector("canvas").onclick;
  const canvas = game.querySelector("canvas");

  canvas.onclick = function(event) {
    if (typeof buildType !== "undefined" && buildType) {
      if (previousClick) previousClick.call(canvas, event);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX-rect.left)*canvas.width/rect.width;
    const y = (event.clientY-rect.top)*canvas.height/rect.height;

    const tower = towers.find(item =>
      Math.hypot(item.x-x, item.y-y) < 24
    );

    sel = tower || null;
    if (typeof ui === "function") ui();

    if (!tower && previousClick) {
      previousClick.call(canvas, event);
    }

    updateDetails();
  };

  function updateDetails() {
    if (typeof sel !== "undefined" && sel) {
      const definition = T[sel.t];
      selectionText.textContent =
        `${definition.n} · Stufe ${sel.lvl}`;
    } else {
      selectionText.textContent = "Wähle einen Turm auf der Karte.";
    }

    if (typeof hero !== "undefined") {
      const source = `assets/art/heroes/${hero.cls}.svg`;
      if (heroImage.getAttribute("src") !== source) {
        heroImage.hidden = false;
        heroImage.src = source;
      }
    }

    for (const price of buildGrid.querySelectorAll("[data-tower]")) {
      if (typeof buildCost !== "function") continue;

      const cost = buildCost(price.dataset.tower);
      price.textContent = `${cost} G`;

      const button = price.closest("button");
      if (!button) continue;

      const tooExpensive =
        typeof gold !== "number" || !Number.isFinite(gold) || gold < cost;

      const waveRunning = typeof active !== "undefined" && active;
      const defeated = typeof lives !== "undefined" && lives <= 0;
      const disabled = tooExpensive || waveRunning || defeated;

      button.disabled = disabled;
      button.setAttribute("aria-disabled", String(disabled));
      button.classList.toggle("if-build-unaffordable", tooExpensive);

      const name = towerInfo[price.dataset.tower]?.name || "Turm";

      button.title = tooExpensive
        ? `${name}: zu wenig Gold (${cost} G benötigt)`
        : defeated
          ? "Die Partie ist beendet"
          : waveRunning
            ? "Turmbau erst nach der laufenden Welle möglich"
            : `${name} auswählen und auf der Karte platzieren`;
    }
  }

  setInterval(updateDetails, 300);
  updateDetails();

  // Falls game-window.js noch nicht den Neustart-Dialog zugeordnet hat.
  if (resetButton && typeof window.inkfallDialog === "function") {
    resetButton.removeAttribute("onclick");
    resetButton.onclick = async () => {
      const confirmed = await window.inkfallDialog({
        title:"Spiel neu laden?",
        message:"Nicht gespeicherter Fortschritt kann verloren gehen.",
        confirmText:"Neu laden",
        cancelText:"Weiterspielen"
      });
      if (confirmed) location.reload();
    };
  }
})();
