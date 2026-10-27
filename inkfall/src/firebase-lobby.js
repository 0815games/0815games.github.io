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
    {
      id: "knight",
      name: "Ritter",
      role: "Nahkampf und Kontrolle",
      available: true
    },
    {
      id: "mage",
      name: "Elementarmagier",
      role: "Fernkampf und Flächenkontrolle",
      available: true
    }
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
    // DIAG_LOBBY_ERRORS
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

      room = snapshot.val();
      renderRoom();
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
    const buttons = screen.querySelectorAll("button");
    buttons.forEach(button => { button.disabled = true; });

    try {
      await callback();
    } catch (error) {
      message(errorText(error));
    } finally {
      busy = false;
      if (room) renderRoom();
      else buttons.forEach(button => { button.disabled = false; });
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
          Maximal zwei unterschiedliche Accounts.
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

  function renderRoom() {
    if (!room) return;

    const slot = mySlot();
    if (!slot) return;

    const me = room[slot];
    const isHost = slot === "host";
    const bothReady = Boolean(
      room.host?.ready && room.guest?.ready &&
      room.host?.online && room.guest?.online
    );
    const canChoose = room.status === "waiting" && !me.ready;

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
        <footer class="if-pregame-footer">
          <button id="if-lobby-ready" class="if-pregame-button">
            ${me.ready ? "Bereit zurücknehmen" : "Ich bin bereit"}
          </button>
          ${isHost ? `
            <button id="if-prepare-room" class="if-pregame-button secondary"
              ${!bothReady || room.status !== "waiting" ? "disabled" : ""}>
              Vorbereitung bestätigen
            </button>` : ""}
        </footer>
        <p id="if-lobby-message" role="status"></p>
        <p class="if-pregame-description">
          ${room.status === "prepared" && bothReady
            ? "Beide Spieler sind bereit. Die Lobby funktioniert. Die gemeinsame Kampfsimulation wird als nächstes angebunden."
            : room.status === "prepared"
              ? "Vorbereitung pausiert: Bereit- oder Verbindungsstatus hat sich geändert."
              : canChoose
                ? "Wähle deine Klasse und bestätige deine Bereitschaft."
                : "Deine Klasse ist gewählt. Bestätige deine Bereitschaft."}
        </p>
      </div>
    `;

    screen.querySelectorAll("[data-lobby-class]").forEach(button => {
      button.onclick = () => action(() =>
        roomRef.child(slot + "/heroClass").set(button.dataset.lobbyClass)
      );
    });

    screen.querySelector("#if-lobby-ready").onclick = () => action(() =>
      roomRef.child(slot + "/ready").set(!me.ready)
    );

    screen.querySelector("#if-prepare-room")?.addEventListener("click", () =>
      action(() => roomRef.child("status").set("prepared"))
    );

    screen.querySelector("#if-leave-room").onclick = () => action(async () => {
      if (isHost) await roomRef.remove();
      else await roomRef.child("guest").remove();
      await cleanup();
      showEntry();
    });
  }

  // Window-Capture läuft vor dem bisherigen Coop-Handler am document.
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
