
(() => {
  "use strict";

  function setup() {
    if (window.inkfallCommandDeck) return;

    const frame = document.getElementById("inkfall-window");
    const stage = document.getElementById("if-stage");
    const deck = document.getElementById("if-bottom-hud");
    const sidebar = document.getElementById("if-menu-scroll");
    const badge = deck?.querySelector(".if-hero-badge");
    const ability = document.getElementById("abilityBtn");

    const skillsButton = deck
      ? Array.from(deck.querySelectorAll("button")).find(button =>
          /openTree/.test(button.getAttribute("onclick") || "") ||
          /skilltree|skills/i.test(button.textContent)
        )
      : null;

    if (!frame || !stage || !deck || !sidebar ||
        !badge || !ability || !skillsButton) {
      console.error(
        "Kommandodeck: Vorhandene Helden-, Fähigkeits- oder Skill-Bedienelemente fehlen."
      );
      return;
    }

    const narrow = matchMedia("(max-width:760px)");

    const paths = {
      build: '<path d="M4 21V10h16v11M3 10l3-6h12l3 6M8 4V2m8 2V2M9 21v-6h6v6"/>',
      skills: '<path d="M12 3v6m0 6v6M3 12h6m6 0h6"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="3" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="21" cy="12" r="1"/><circle cx="12" cy="21" r="1"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>'
    };

    function icon(type) {
      const svg = document.createElementNS(
        "http://www.w3.org/2000/svg", "svg"
      );
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = paths[type];
      return svg;
    }

    function actionButton(id, type, text) {
      const button = document.createElement("button");
      button.id = id;
      button.type = "button";
      button.className = "if-deck-action";

      const label = document.createElement("span");
      label.textContent = text;

      button.append(icon(type), label);
      return button;
    }

    const buildButton = actionButton(
      "if-deck-build", "build", "Bauen"
    );

    buildButton.setAttribute("aria-controls", "if-menu-scroll");

    // Der vorhandene Skilltree-Handler bleibt erhalten.
    skillsButton.id = "if-deck-skills";
    skillsButton.classList.add("if-deck-action");

    const skillsLabel = document.createElement("span");
    skillsLabel.textContent = "Skills";

    const pointsBadge = document.createElement("span");
    pointsBadge.className = "if-deck-points";
    pointsBadge.hidden = true;

    skillsButton.replaceChildren(
      icon("skills"), skillsLabel, pointsBadge
    );

    // Zusätzliche bestehende Kurzbefehle nicht versehentlich löschen.
    const extraButtons = Array.from(deck.querySelectorAll("button"))
      .filter(button =>
        button !== ability && button !== skillsButton
      );

    if (extraButtons.length) {
      const extras = document.createElement("div");
      extras.className = "if-deck-extra-actions";
      extras.append(...extraButtons);
      document.getElementById("ui")?.append(extras);
    }

    badge.id = "if-deck-hero";
    badge.setAttribute("role", "button");
    badge.setAttribute("tabindex", "0");
    badge.setAttribute("aria-label", "Heldenübersicht öffnen");
    badge.setAttribute("aria-controls", "if-deck-hero-panel");
    badge.setAttribute("aria-expanded", "false");

    ability.classList.add("if-deck-ability");

    deck.replaceChildren(
      badge, ability, buildButton, skillsButton
    );
    deck.classList.add("if-command-deck");

    const sheetHeader = document.createElement("div");
    sheetHeader.id = "if-command-sheet-header";

    const sheetTitle = document.createElement("strong");
    sheetTitle.textContent = "Bauen & Verteidigung";

    const sheetClose = actionButton(
      "if-command-sheet-close", "close", "Schließen"
    );
    sheetClose.setAttribute("aria-label", "Baumenü schließen");

    sheetHeader.append(sheetTitle, sheetClose);
    sidebar.prepend(sheetHeader);
    sidebar.setAttribute("aria-label", "Bauen und Verteidigung");

    const heroPanel = document.createElement("section");
    heroPanel.id = "if-deck-hero-panel";
    heroPanel.hidden = true;
    heroPanel.setAttribute("aria-label", "Heldenübersicht");

    const heroHeading = document.createElement("strong");
    const heroAbility = document.createElement("p");
    const heroCooldown = document.createElement("p");
    const heroNote = document.createElement("p");
    heroNote.textContent =
      "Die aktive Fähigkeit wird direkt über das Kommandodeck ausgelöst.";

    const heroClose = actionButton(
      "if-command-hero-close", "close", "Schließen"
    );

    heroPanel.append(
      heroHeading, heroAbility, heroCooldown, heroNote, heroClose
    );
    stage.append(heroPanel);

    function setBuild(open) {
      frame.classList.toggle("if-tools-open", open);
      frame.classList.toggle("if-tools-closed", !open);

      buildButton.setAttribute("aria-expanded", String(open));
      buildButton.classList.toggle("is-active", open);

      if (open) closeHero();
    }

    function closeHero() {
      heroPanel.hidden = true;
      badge.setAttribute("aria-expanded", "false");
      badge.classList.remove("is-active");
    }

    function updateHeroInfo() {
      const definition = HERO[hero.cls];
      heroHeading.textContent = definition.name;
      heroAbility.textContent = "Fähigkeit: " + definition.ability;
      heroCooldown.textContent =
        "Basis-Abklingzeit: " + definition.cd + " Sekunden";
    }

    function toggleHero() {
      const open = heroPanel.hidden;

      if (open) {
        setBuild(false);
        updateHeroInfo();
      }

      heroPanel.hidden = !open;
      badge.setAttribute("aria-expanded", String(open));
      badge.classList.toggle("is-active", open);
    }

    buildButton.onclick = () => {
      setBuild(!frame.classList.contains("if-tools-open"));
    };

    sheetClose.onclick = () => {
      setBuild(false);
      buildButton.focus();
    };

    badge.addEventListener("click", toggleHero);

    badge.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleHero();
      }
    });

    heroClose.onclick = () => {
      closeHero();
      badge.focus();
    };

    // Nicht den Skilltree-Handler ersetzen, nur andere Panels schließen.
    skillsButton.addEventListener("click", () => {
      closeHero();
      setBuild(false);
    }, true);

    const placement = document.createElement("div");
    placement.id = "if-placement-status";
    placement.hidden = true;

    const placementText = document.createElement("span");
    const cancelBuild = document.createElement("button");
    cancelBuild.type = "button";
    cancelBuild.textContent = "Abbrechen";

    cancelBuild.onclick = () => {
      buildType = null;
      placement.hidden = true;
    };

    placement.append(placementText, cancelBuild);
    document.getElementById("game").append(placement);

    const buildGrid = document.getElementById("if-build-grid");

    // Bestehende Bau-Handler laufen zuerst.
    buildGrid?.addEventListener("click", event => {
      if (!event.target.closest("button")) return;

      if (buildType && narrow.matches) {
        setBuild(false);
      }
    });

    document.getElementById("start")?.addEventListener("click", () => {
      if (active && narrow.matches) setBuild(false);
    });

    const view = document.getElementById("if-map-view");
    let pointerStart = null;
    let pointerCount = 0;
    let gestureMoved = false;

    // Nur UI-Reaktion auf einen tatsächlichen kurzen Kartentipp.
    // Kamera und Spielaktion bleiben bei camera-layout.js.
    view?.addEventListener("pointerdown", event => {
      pointerCount++;

      if (pointerCount === 1) {
        pointerStart = {x:event.clientX, y:event.clientY};
        gestureMoved = false;
      } else {
        gestureMoved = true;
      }
    });

    view?.addEventListener("pointermove", event => {
      if (pointerStart && Math.hypot(
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y
      ) > 8) {
        gestureMoved = true;
      }
    });

    view?.addEventListener("pointerup", event => {
      const tapped = pointerStart && !gestureMoved &&
        pointerCount === 1 &&
        Math.hypot(
          event.clientX - pointerStart.x,
          event.clientY - pointerStart.y
        ) <= 8;

      pointerCount = Math.max(0, pointerCount - 1);

      // camera-layout.js hat die Turmauswahl bereits verarbeitet.
      if (tapped && sel && !buildType) {
        closeHero();
        setBuild(true);
      }

      if (!pointerCount) pointerStart = null;
    });

    view?.addEventListener("pointercancel", () => {
      pointerCount = 0;
      pointerStart = null;
      gestureMoved = true;
    });

    window.addEventListener("blur", () => {
      pointerCount = 0;
      pointerStart = null;
      gestureMoved = true;
    });

    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;

      if (buildType) {
        buildType = null;
      } else if (!heroPanel.hidden) {
        closeHero();
      } else if (frame.classList.contains("if-tools-open")) {
        setBuild(false);
      }
    });

    function sync() {
      const points = typeof skillPoints === "number"
        ? skillPoints : 0;

      const text = String(points);
      if (pointsBadge.textContent !== text) {
        pointsBadge.textContent = text;
      }
      pointsBadge.hidden = points <= 0;

      skillsButton.setAttribute(
        "aria-label",
        "Skilltree öffnen, " + points + " freie Skillpunkte"
      );

      ability.classList.toggle("is-cooling", hero.cd > 0);
      ability.setAttribute(
        "aria-label",
        HERO[hero.cls].ability +
        (hero.cd > 0
          ? ", bereit in " + Math.ceil(hero.cd) + " Sekunden"
          : ", bereit")
      );

      if (!heroPanel.hidden) updateHeroInfo();

      const building = Boolean(buildType);
      placement.hidden = !building;

      if (building) {
        const name = T[buildType]?.n || buildType;
        const message = name + " platzieren";

        if (placementText.textContent !== message) {
          placementText.textContent = message;
        }
      }

      const open = frame.classList.contains("if-tools-open");
      buildButton.setAttribute("aria-expanded", String(open));
      buildButton.classList.toggle("is-active", open);
    }

    new ResizeObserver(() => {
      frame.style.setProperty(
        "--if-deck-height",
        Math.ceil(deck.getBoundingClientRect().height) + "px"
      );
    }).observe(deck);

    narrow.addEventListener("change", () => {
      closeHero();
      setBuild(!narrow.matches);
    });

    setBuild(!narrow.matches);
    sync();
    setInterval(sync, 150);

    window.inkfallCommandDeck = {
      openBuild: () => setBuild(true),
      closeBuild: () => setBuild(false)
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, {once:true});
  } else {
    setup();
  }
})();
