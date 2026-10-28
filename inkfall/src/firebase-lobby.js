(() => {
  "use strict";

  const frame = document.getElementById("inkfall-window");
  if (!frame || document.getElementById("if-online-lobby")) return;

  const screen = document.createElement("section");
  screen.id = "if-online-lobby";
  screen.hidden = true;
  screen.setAttribute("aria-label", "Online-Coop-Lobby");
  frame.append(screen);

  let roomRef = null;
  let room = null;
  let roomCode = "";
  let roomListener = null;
  let presenceRef = null;
  let connectionListener = null;
  let busy = false;

  const lobbyClasses = [
    { id: "knight", name: "Ritter", role: "Nahkampf und Kontrolle" },
    { id: "mage", name: "Elementarmagier", role: "Fernkampf und Flächenkontrolle" }
  ];

  const uid = () => auth.currentUser?.uid;
  const escapeText = text => String(text).replace(/[&<>"']/g, char =>
    ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char])
  );

  function message(text) {
    const target = screen.querySelector("#if-lobby-message");
    if (target) target.textContent = text;
  }

  function errorText(error) {
    window.inkfallDiag?.capture(error, "Coop-Lobby");

    const code = String(error.code || "").toLowerCase();
    if (code.includes("permission")) {
      return "Zugriff verweigert. Raumbelegung und Firebase-Regeln prüfen.";
    }
    return error.message || String(error);
  }

  function mySlot() {
    if (room?.host?.uid === uid()) return "host";
    if (room?.guest?.uid === uid()) return "guest";
    return null;
  }

  async function playerData() {
    const user = auth.currentUser;
    if (!user) throw new Error("Bitte zuerst anmelden.");

    const snapshot = await db.ref(
      "users/" + user.uid + "/profile/displayName"
    ).get();

    const name = snapshot.val() || user.displayName;
    if (!name || name.length < 3 || name.length > 20) {
      throw new Error("Bitte zuerst ein gültiges Spielerprofil anlegen.");
    }

    return {
      uid: user.uid,
      name,
      heroName: hero.name || HERO[hero.cls].name,
      heroClass: hero.cls === "mage" ? "mage" : "knight",
      ready: false,
      online: true
    };
  }

  function randomCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const values = new Uint32Array(8);
    crypto.getRandomValues(values);
    return Array.from(values, value =>
      alphabet[value % alphabet.length]
    ).join("");
  }

  async function cleanup() {
    if (roomRef && roomListener) {
      roomRef.off("value", roomListener);
    }

    if (connectionListener) {
      db.ref(".info/connected").off("value", connectionListener);
    }

    if (presenceRef) {
      try {
        await presenceRef.onDisconnect().cancel();
      } catch (error) {
        console.warn("Presence-Aufräumen:", error);
      }
    }

    roomRef = null;
    roomListener = null;
    connectionListener = null;
    presenceRef = null;
    room = null;
    roomCode = "";
    window.inkfallActiveCoopSession = null;
    window.dispatchEvent(new Event("inkfall:coop-session-cleared"));
  }

  async function watch(code) {
    roomCode = code;
    roomRef = db.ref("rooms/" + code);

    roomListener = snapshot => {
      if (!snapshot.exists()) {
        message("Der Gastgeber hat den Raum geschlossen.");
        cleanup().then(showEntry);
        return;
      }

      const next = snapshot.val();
      const relevant = value => JSON.stringify({
        host:value?.host,
        guest:value?.guest,
        status:value?.status,
        session:value?.session
      });
      const redraw = relevant(room) !== relevant(next);
      room = next;
      if (redraw) renderRoom();
    };

    roomRef.on("value", roomListener, error => {
      message(errorText(error));
    });

    const first = await roomRef.get();
    room = first.val();

    const slot = mySlot();
    if (!slot) throw new Error("Dein Spielerplatz wurde nicht gefunden.");

    presenceRef = roomRef.child(slot + "/online");

    connectionListener = async snapshot => {
      if (!snapshot.val() || !presenceRef) return;

      const reference = presenceRef;
      try {
        await reference.onDisconnect().set(false);
        if (reference === presenceRef) await reference.set(true);
      } catch (error) {
        message("Verbindungsstatus: " + errorText(error));
      }
    };

    db.ref(".info/connected").on("value", connectionListener);
    renderRoom();
  }

  async function createRoom() {
    const player = await playerData();

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode();
      const reference = db.ref("rooms/" + code);

      const result = await reference.transaction(current => {
        if (current !== null) return;
        return {
          host: player,
          status: "waiting",
          createdAt: firebase.database.ServerValue.TIMESTAMP
        };
      }, undefined, false);

      if (result.committed) {
        await watch(code);
        return;
      }
    }

    throw new Error("Kein freier Raumcode. Bitte erneut versuchen.");
  }

  async function joinRoom(code) {
    code = code.trim().toUpperCase();

    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(code)) {
      throw new Error("Bitte einen gültigen achtstelligen Raumcode eingeben.");
    }

    const reference = db.ref("rooms/" + code);
    const snapshot = await reference.get();

    if (!snapshot.exists()) throw new Error("Raum nicht gefunden.");

    const data = snapshot.val();

    if (data.host.uid === uid()) {
      await watch(code);
      return;
    }

    if (data.guest?.uid !== uid() &&
        (data.status !== "waiting" || !data.host.online)) {
      throw new Error("Dieser Raum ist gerade nicht für einen Beitritt verfügbar.");
    }

    const player = await playerData();

    const result = await reference.child("guest").transaction(current => {
      if (current && current.uid !== player.uid) return;
      return {
        ...player,
        heroClass: current?.heroClass || player.heroClass,
        heroName: current?.heroName || player.heroName,
        ready: false
      };
    }, undefined, false);

    if (!result.committed) {
      throw new Error("Der zweite Spielerplatz ist bereits belegt.");
    }

    await watch(code);
  }


  async function action(callback) {
    if (busy) return;
    busy = true;
    let failure = "";

    screen.querySelectorAll("button").forEach(button => {
      button.disabled = true;
    });

    try {
      await callback();
    } catch (error) {
      failure = errorText(error);
    } finally {
      busy = false;
      if (room) renderRoom();
      else {
        screen.querySelectorAll("button").forEach(button => {
          button.disabled = false;
        });
      }
      if (failure) message(failure);
    }
  }

  function showEntry() {
    screen.innerHTML = `
      <div class="if-pregame-shell">
        <header class="if-pregame-heading">
          <h1>Online-Coop</h1>
          <button id="if-lobby-back" class="if-pregame-button secondary">
            Zurück
          </button>
        </header>
        <p class="if-pregame-description">
          Erstelle einen Raum oder tritt mit dem Code deines Freundes bei.
        </p>
        <section class="if-class-info">
          <button id="if-create-room" class="if-pregame-button">
            Raum erstellen
          </button>
          <p>Oder einem Raum beitreten:</p>
          <input id="if-room-code" maxlength="8"
            autocomplete="off" spellcheck="false"
            placeholder="8-stelliger Raumcode"
            aria-label="Raumcode">
          <button id="if-join-room" class="if-pregame-button secondary">
            Beitreten
          </button>
        </section>
        <p id="if-lobby-message" role="status"></p>
      </div>
    `;

    screen.querySelector("#if-lobby-back").onclick = () => {
      screen.hidden = true;
    };

    screen.querySelector("#if-create-room").onclick = () =>
      action(createRoom);

    screen.querySelector("#if-join-room").onclick = () => {
      const code = screen.querySelector("#if-room-code").value;
      action(() => joinRoom(code));
    };
  }


  async function startCoopSession() {
    const user = auth.currentUser;
    const reference = roomRef;
    const code = roomCode;

    if (!user || !reference || mySlot() !== "host") {
      throw new Error("Nur der angemeldete Host darf starten.");
    }

    if (!window.InkfallCoopStart) {
      throw new Error("Coop-Startmodul wurde nicht geladen.");
    }

    const result = await window.InkfallCoopStart.start(reference, {
      actorUid: user.uid,
      roomCode: code,
      sessionId: randomCode() + "-" + Date.now(),
      now: Date.now()
    });

    if (auth.currentUser?.uid !== user.uid || roomRef !== reference) {
      throw new Error("Account oder Raum hat sich während des Starts geändert.");
    }

    const snapshot = await reference.get();
    if (!snapshot.exists()) {
      throw new Error("Der Raum wurde inzwischen geschlossen.");
    }

    room = snapshot.val();

    if (room.session?.id !== result.session.id) {
      throw new Error("Die Sitzung konnte nicht eindeutig bestätigt werden.");
    }
  }

  function publishSession() {
    const session = room?.session;
    if (!session) {
      window.inkfallActiveCoopSession = null;
      return;
    }

    const previous = window.inkfallActiveCoopSession;
    if (previous?.id === session.id &&
        previous?.revision === session.revision) return;

    const confirmed = JSON.parse(JSON.stringify(session));
    window.inkfallActiveCoopSession = confirmed;
    window.dispatchEvent(new CustomEvent("inkfall:coop-session", {
      detail: JSON.parse(JSON.stringify(confirmed))
    }));
  }

  function renderRoom() {
    if (!room) return;

    const slot = mySlot();
    if (!slot) return;

    publishSession();
    const me = room[slot];
    const isHost = slot === "host";
    const bothReady = Boolean(
      room.host?.ready && room.guest?.ready &&
      room.host?.online && room.guest?.online
    );
    const canChoose = !busy && !room.session && room.status === "waiting" && !me.ready;

    function playerCard(player, label) {
      if (!player) {
        return `<div class="if-player-slot empty">
          <strong>${label}</strong>Wartet auf einen Spieler …
        </div>`;
      }

      const selectedClass = lobbyClasses.find(
        item => item.id === player.heroClass
      );

      return `<div class="if-player-slot">
        <strong>${label} · ${escapeText(player.name)}</strong>
        <div><b>${escapeText(player.heroName || "Held")}</b></div>
        <div>${selectedClass ? selectedClass.name : "Ritter"}</div>
        <div>${player.online ? "Verbunden" : "Verbindung unterbrochen"}</div>
        <div>${player.ready ? "✓ Bereit" : "Noch nicht bereit"}</div>
      </div>`;
    }

    const classCards = lobbyClasses.map(item => `
      <button
        data-lobby-class="${item.id}"
        class="if-class-card${me.heroClass === item.id ? " selected" : ""}"
        aria-pressed="${me.heroClass === item.id}"
        ${canChoose ? "" : "disabled"}
      >
        <img src="assets/art/heroes/${item.id}.svg" alt="" 
          onerror="this.hidden=true">
        <strong>${item.name}</strong>
        <small>${item.role}</small>
        ${me.heroClass === item.id ? "<small>Ausgewählt</small>" : ""}
      </button>
    `).join("");

    screen.innerHTML = `
      <div class="if-pregame-shell">
        <header class="if-pregame-heading">
          <h1>Raum ${roomCode}</h1>
          <button id="if-leave-room" class="if-pregame-button secondary">
            ${isHost ? "Raum schließen" : "Raum verlassen"}
          </button>
        </header>
        <p class="if-pregame-description">
          Teile den Raumcode mit deinem Freund und wählt eure Klassen.
        </p>
        <div class="if-player-slots">
          ${playerCard(room.host, "Gastgeber")}
          ${playerCard(room.guest, "Spieler 2")}
        </div>
        <div id="if-class-grid" class="if-class-grid">
          ${classCards}
        </div>

        <section class="if-class-info" aria-live="polite">
          ${room.session ? `
            <h2>Gemeinsame Sitzung bereit</h2>
            <p>Sitzung: <code>${escapeText(room.session.id)}</code></p>
            <p>
              ${escapeText(room.session.players?.host?.heroName || "Held 1")}
              &amp;
              ${escapeText(room.session.players?.guest?.heroName || "Held 2")}
            </p>
            <p>Phase: ${escapeText(room.session.phase)}</p>
            <p>Die gemeinsame Karte wird im nächsten Schritt angebunden.</p>
          ` : `
            <p>${room.status === "prepared"
              ? "Vorbereitung bestätigt. Der Host kann die Sitzung erstellen."
              : "Beide Spieler wählen ihre Klasse und bestätigen ihre Bereitschaft."}</p>
          `}
        </section>
        <footer class="if-pregame-footer">
          <button id="if-lobby-ready" class="if-pregame-button"
            ${busy || room.session ? "disabled" : ""}>
            ${me.ready ? "Bereit zurücknehmen" : "Ich bin bereit"}
          </button>
          ${isHost ? `
            <button id="if-prepare-room" class="if-pregame-button secondary"
              ${!bothReady || room.status !== "waiting" ? "disabled" : ""}>
              Vorbereitung bestätigen
            </button>` : ""}

          ${isHost && room.status === "prepared" && !room.session ? `
            <button id="if-start-coop" class="if-pregame-button"
              ${!bothReady || busy ? "disabled" : ""}>
              Coop-Sitzung starten
            </button>
          ` : ""}
        </footer>
        <p id="if-lobby-message" role="status"></p>
      </div>
    `;

    screen.querySelectorAll("[data-lobby-class]").forEach(button => {
      button.onclick = () => action(async () => {
        const user = auth.currentUser;
        const reference = roomRef;
        const classId = button.dataset.lobbyClass;

        if (!user || !canChoose) {
          throw new Error("Klassenwechsel ist gerade gesperrt.");
        }

        const snapshot = await db.ref(
          "users/" + user.uid + "/characters/" + classId
        ).get();

        if (auth.currentUser?.uid !== user.uid || roomRef !== reference) {
          throw new Error("Account oder Raum wurde geändert.");
        }

        const character = snapshot.val();
        const heroName = typeof heroNameState === "function"
          ? heroNameState(character, classId).name
          : HERO[classId].name;

        await reference.child(slot).update({
          heroClass: classId,
          heroName
        });
      });
    });

    screen.querySelector("#if-lobby-ready").onclick = () => action(() =>
      roomRef.child(slot + "/ready").set(!me.ready)
    );

    screen.querySelector("#if-prepare-room")?.addEventListener("click", () =>
      action(() => roomRef.child("status").set("prepared"))
    );

    screen.querySelector("#if-start-coop")?.addEventListener(
      "click", () => action(startCoopSession)
    );

    screen.querySelector("#if-leave-room").onclick = () => action(async () => {
      if (isHost) await roomRef.remove();
      else await roomRef.child("guest").remove();
      await cleanup();
      showEntry();
    });
  }

  window.addEventListener("click", event => {
    if (!event.target.closest?.("#if-coop")) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (typeof auth === "undefined" || !auth.currentUser) return;

    if (window.inkfallMode === "single" && active) {
      if (typeof inkfallNotify === "function") {
        inkfallNotify("Bitte zuerst die laufende Einzelspieler-Welle abschließen.");
      }
      return;
    }

    window.inkfallMode = "lobby";
    speed = 0;
    screen.hidden = false;

    if (room) renderRoom();
    else showEntry();
  }, true);

  auth.onAuthStateChanged(user => {
    if (!user) {
      cleanup();
      screen.hidden = true;
    }
  });
})();
