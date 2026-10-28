(() => {
  "use strict";

  const frame = document.getElementById("inkfall-window");
  if (!frame || document.getElementById("if-pregame")) return;

  const classes = [
    {
      id:"knight",
      name:"Ritter",
      role:"Nahkampf und Kontrolle",
      description:
        "Kämpft auf kurze Distanz. Schildstoß schädigt und " +
        "verlangsamt Bodengegner in seiner Nähe.",
      strength:"Stärkerer einzelner Basisangriff, kurze Angriffsreichweite.",
      ability:"Schildstoß · 10 Sekunden Abklingzeit",
      available:true
    },
    {
      id:"mage",
      name:"Elementarmagier",
      role:"Fernkampf und Flächenkontrolle",
      description:
        "Greift aus größerer Entfernung an. Frostnova schädigt " +
        "und verlangsamt Gegner im Umkreis.",
      strength:"Größere Reichweite, schwächerer einzelner Basisangriff.",
      ability:"Frostnova · 12 Sekunden Abklingzeit",
      available:true
    },
    {id:"rogue",name:"Schattenklinge",role:"Mobilität und Elite-Jagd"},
    {id:"engineer",name:"Tüftler",role:"Türme und Fallen"},
    {id:"druid",name:"Naturdruide",role:"Natur und Unterstützung"},
    {id:"bard",name:"Barde",role:"Verstärkung und Schwächung"}
  ];

  const screen = document.createElement("section");
  screen.id = "if-pregame";
  screen.hidden = true;
  screen.setAttribute("aria-label","Spielvorbereitung");
  frame.append(screen);

  let mode = "single";
  let chosen = "knight";
  let changed = false;
  let chosenName = "";

  function playerName() {
    if (typeof currentProfile !== "undefined") {
      const name = currentProfile?.profile?.displayName;
      if (name) return name;
    }
    if (typeof auth !== "undefined") {
      return auth.currentUser?.displayName || "Wächter";
    }
    return "Wächter";
  }

  function existingHeroName(classId) {
    if (typeof currentProfile !== "undefined") {
      return currentProfile?.characters?.[classId]?.heroName || "";
    }
    return "";
  }

  function show(selectedMode) {
    mode = selectedMode;
    chosen = typeof hero !== "undefined" ? hero.cls : "knight";
    if (!classes.some(item=>item.id===chosen && item.available)) {
      chosen = "knight";
    }
    changed = false;
    chosenName = existingHeroName(chosen) ||
      (typeof hero !== "undefined" && hero.cls === chosen ? hero.name : "");
    speed = 0;
    screen.hidden = false;
    render();
  }

  function render() {
    const continuing = wave > 0 || active || towers.length > 0;
    const selected = classes.find(item=>item.id===chosen);

    screen.innerHTML = `
      <div class="if-pregame-shell">
        <header class="if-pregame-heading">
          <h1>${mode==="coop"?"Coop-Vorbereitungsraum":"Dein Held"}</h1>
          <button id="if-pregame-back"
            class="if-pregame-button secondary">Zurück</button>
        </header>
        <p class="if-pregame-description">
          ${mode==="coop"
            ? "Zwei Helden. Eine gemeinsame Bastion. Kein Gegeneinander."
            : "Wähle deine Klasse und bereite dich auf die Verteidigung vor."}
        </p>
        <div class="if-player-slots">
          <div class="if-player-slot">
            <strong>Spieler 1 · Du</strong>
            <span id="if-local-player"></span>
          </div>
          ${mode==="coop"?`
            <div class="if-player-slot empty">
              <strong>Spieler 2</strong>
              Noch keine Online-Verbindung implementiert.
            </div>`:""}
        </div>
        <div id="if-class-grid" class="if-class-grid"></div>
        <section id="if-class-info" class="if-class-info">
          <h2>${selected.name}</h2>
          <label class="if-hero-name-label">
            Name deines Helden
            <input id="if-hero-name" maxlength="20" minlength="3"
              autocomplete="off" spellcheck="false"
              placeholder="3–20 Zeichen"
              value="${chosenName.replace(/"/g,"&quot;")}">
          </label>
          <p>${selected.description || "Diese Klasse ist noch nicht implementiert."}</p>
          ${selected.ability?`<p>${selected.ability}</p>`:""}
          ${selected.strength?`<p>${selected.strength}</p>`:""}
        </section>
        <footer class="if-pregame-footer">
          <button id="if-pregame-start" class="if-pregame-button"
            ${mode==="coop"?"disabled":""}>
            ${mode==="coop"?"Online-Coop folgt":continuing?"Spiel fortsetzen":"Verteidigung betreten"}
          </button>
          <p id="if-pregame-message"></p>
        </footer>
      </div>
    `;

    screen.querySelector("#if-local-player").textContent = playerName();

    const grid = screen.querySelector("#if-class-grid");

    for (const item of classes) {
      const button = document.createElement("button");
      button.className = "if-class-card" +
        (chosen===item.id?" selected":"");
      button.disabled = !item.available;
      button.setAttribute("aria-pressed",String(chosen===item.id));

      if (item.available) {
        const image = document.createElement("img");
        image.src = `assets/art/heroes/${item.id}.svg`;
        image.alt = "";
        image.onerror = () => { image.hidden=true; };
        button.append(image);
      } else {
        const placeholder = document.createElement("div");
        placeholder.className = "if-class-placeholder";
        placeholder.textContent = "✦";
        button.append(placeholder);
      }

      const name = document.createElement("strong");
      name.textContent = item.name;

      const role = document.createElement("small");
      role.textContent = item.role;

      button.append(name,role);

      if (!item.available) {
        const note = document.createElement("small");
        note.textContent = "Noch nicht implementiert";
        button.append(note);
      }

      button.onclick = () => {
        if (active) {
          screen.querySelector("#if-pregame-message").textContent =
            "Während einer laufenden Welle ist kein Klassenwechsel möglich.";
          return;
        }
        chosen = item.id;
        changed = chosen !== hero.cls;
        chosenName = existingHeroName(chosen) ||
          (hero.cls === chosen ? hero.name : "");
        render();
      };

      grid.append(button);
    }

    const nameInput = screen.querySelector("#if-hero-name");
    nameInput.oninput = () => {
      chosenName = nameInput.value;
    };

    screen.querySelector("#if-pregame-message").textContent =
      mode==="coop"
      ? "Dies ist die vorbereitete Lobby-Oberfläche. Raumcode, Beitritt " +
        "und Bereit-Status werden erst mit echter Firebase-Synchronisierung aktiviert."
      : active
        ? "Laufende Welle pausiert. Deine aktuelle Klasse bleibt erhalten."
        : changed
          ? "Die gewählte Klasse und der Name werden beim Betreten übernommen."
          : "Deine aktuelle Klasse ist ausgewählt.";

    screen.querySelector("#if-pregame-back").onclick = () => {
      screen.hidden = true;
    };

    screen.querySelector("#if-pregame-start").onclick = async () => {
      if (mode!=="single") return;

      const button = screen.querySelector("#if-pregame-start");
      const status = screen.querySelector("#if-pregame-message");
      button.disabled = true;

      try {
        const originalStart = document.getElementById("if-single");

        if (!originalStart || typeof originalStart.onclick!=="function") {
          throw new Error("Start-Handler fehlt. Bitte zum Hauptmenü zurückkehren.");
        }

        status.textContent = "Charakter wird geladen …";
        await window.selectSoloCharacter(chosen);
        await window.setHeroName(chosen, chosenName);

        screen.hidden = true;
        originalStart.onclick();
      } catch (error) {
        status.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
  }

  document.addEventListener("click",event => {
    const button = event.target.closest?.("#if-single, #if-coop");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    show(button.id==="if-coop"?"coop":"single");
  },true);
})();
