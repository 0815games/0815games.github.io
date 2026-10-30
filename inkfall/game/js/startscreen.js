(() => {
  "use strict";

  const frame = document.getElementById("inkfall-window");
  if (!frame || document.getElementById("if-launcher")) return;

  const launcher = document.createElement("section");
  launcher.id = "if-launcher";
  launcher.setAttribute("aria-label", "INKFALL Hauptmenü");
  launcher.innerHTML = `
    <div class="if-launcher-shell">
      <div class="if-brand">
        <div class="if-brand-mark" aria-hidden="true">✦</div>
        <h1 class="if-logo if-logo-animated" aria-label="INKFALL">
          <span class="if-logo-word" aria-hidden="true">
            <span style="--letter:0">I</span><span style="--letter:1">N</span><span style="--letter:2">K</span><span style="--letter:3">F</span><span style="--letter:4">A</span><span style="--letter:5">L</span><span style="--letter:6">L</span>
          </span>
        </h1>
        <div class="if-brand-subtitle">Heroes of the Last Tower</div>
        <p>Entwickle deinen Helden.<br>
        Errichte deine Verteidigung.<br>
        Bewahre die letzte Bastion.</p>
      </div>
      <div class="if-start-card">
        <div id="if-start-content"></div>
        <p id="if-start-message" role="status" aria-live="polite"></p>
      </div>
    </div>
  `;
  frame.append(launcher);

  const content = launcher.querySelector("#if-start-content");
  const message = launcher.querySelector("#if-start-message");

  let registering = false;
  let ready = false;
  let busy = false;
  let visible = true;
  let previousSpeed = typeof speed !== "undefined" ? speed : 1;

  if (typeof speed !== "undefined") speed = 0;

  function tell(text, error = false) {
    message.textContent = text;
    message.style.color = error ? "#ab2949" : "#436835";
  }

  function errorText(error) {
    const messages = {
      "auth/invalid-email": "Bitte eine gültige E-Mail-Adresse eingeben.",
      "auth/invalid-credential": "E-Mail oder Passwort ist nicht korrekt.",
      "auth/wrong-password": "E-Mail oder Passwort ist nicht korrekt.",
      "auth/user-not-found": "E-Mail oder Passwort ist nicht korrekt.",
      "auth/email-already-in-use": "Diese E-Mail-Adresse wird bereits verwendet.",
      "auth/weak-password": "Das Passwort erfüllt die Passwortanforderungen nicht.",
      "auth/network-request-failed": "Netzwerkfehler. Bitte Verbindung prüfen.",
      "auth/too-many-requests": "Zu viele Versuche. Bitte später erneut versuchen.",
      "auth/unauthorized-domain": "Diese Domain ist in Firebase nicht freigegeben.",
      "PERMISSION_DENIED": "Die Datenbankregeln erlauben diese Aktion nicht."
    };
    return messages[error.code] || "Aktion fehlgeschlagen: " + error.message;
  }

  function lock(value) {
    busy = value;
    content.querySelectorAll("button").forEach(button => {
      button.disabled = value;
    });
  }

  function renderAuth() {
    tell("");
    content.innerHTML = `
      <h2>${registering ? "Account erstellen" : "Willkommen zurück"}</h2>
      <form id="if-login-form">
        ${registering ? `
          <label>Spielername
            <input id="if-playername" minlength="3" maxlength="20"
              autocomplete="nickname" required>
          </label>` : ""}
        <label>E-Mail
          <input id="if-email" type="email"
            autocomplete="username" required>
        </label>
        <label>Passwort
          <input id="if-password" type="password"
            autocomplete="${registering ? "new-password" : "current-password"}"
            required>
        </label>
        <button type="submit">
          ${registering ? "Registrieren" : "Anmelden"}
        </button>
      </form>
      <button id="if-switch-auth" class="secondary">
        ${registering ? "Ich habe bereits einen Account" : "Neuen Account erstellen"}
      </button>
      <button id="if-reset-password" class="text-button">
        Passwort vergessen?
      </button>
    `;

    content.querySelector("#if-switch-auth").onclick = () => {
      registering = !registering;
      renderAuth();
    };

    content.querySelector("#if-reset-password").onclick = async () => {
      const email = content.querySelector("#if-email").value.trim();
      if (!email) {
        tell("Bitte zuerst deine E-Mail-Adresse eingeben.", true);
        return;
      }
      lock(true);
      try {
        await auth.sendPasswordResetEmail(email);
        tell("Falls ein passender Account existiert, erhältst du eine E-Mail.");
      } catch (error) {
        tell(errorText(error), true);
      } finally {
        lock(false);
      }
    };

    content.querySelector("#if-login-form").onsubmit = async event => {
      event.preventDefault();
      if (busy) return;

      const email = content.querySelector("#if-email").value.trim();
      const password = content.querySelector("#if-password").value;
      const name = registering
        ? content.querySelector("#if-playername").value.trim()
        : null;

      if (registering) {
        const problem = playerNameError(name);

        if (problem) {
          tell(problem, true);
          return;
        }
      }

      lock(true);

      try {
        if (registering) {
          // Profilname zuerst am Auth-Account hinterlegen.
          // Falls die Datenbank nicht erreichbar ist, kann das Menü
          // die Profilerstellung nach der Anmeldung erneut anbieten.
          const credential = await auth.createUserWithEmailAndPassword(
            email, password
          );
          await credential.user.updateProfile({displayName:name});
        } else {
          await auth.signInWithEmailAndPassword(email, password);
        }

        await prepareAccount();
        await renderMenu();
      } catch (error) {
        tell(errorText(error), true);
      } finally {
        lock(false);
      }
    };
  }

  // Der Spielername steht in users/{uid}/profile/displayName. Er ist KEIN
  // Firebase-Schlüssel mehr: die veröffentlichten Regeln (solo-only, Stand
  // f49fc32) kennen den Knoten usernames/ nicht, jede Reservierung dort endet
  // mit PERMISSION_DENIED. Deshalb wird nur noch auf Zeichen geprüft, die in
  // der Datenbank und in der Anzeige unproblematisch sind.
  const NAME_FORBIDDEN = /[.#$\[\]\/\u0000-\u001f\u007f]/;

  function playerNameError(name) {
    const trimmed = String(name || "").trim();

    if (trimmed.length < 3 || trimmed.length > 20) {
      return "Der Spielername muss 3 bis 20 Zeichen enthalten.";
    }

    if (NAME_FORBIDDEN.test(trimmed)) {
      return "Der Spielername darf keine Punkte, Rauten, Klammern, " +
        "Dollarzeichen oder Schrägstriche enthalten.";
    }

    return "";
  }

  async function prepareAccount() {
    ready = false;
    const user = auth.currentUser;
    if (!user) return;

    const reference = db.ref("users/" + user.uid);
    const snapshot = await reference.get();

    if (!snapshot.exists()) {
      const name = (user.displayName ||
        content.querySelector("#if-playername")?.value.trim() || "").trim();
      const problem = playerNameError(name);

      if (problem) {
        tell(problem, true);
        renderProfileRepair();
        return;
      }

      // Die veröffentlichten Regeln erlauben unter users/{uid} ausschließlich
      // profile, schemaVersion, selectedClass und characters. `$other` steht
      // dort auf false — ein einziges zusätzliches Feld (früher: `save`) lässt
      // deshalb die komplette Anfrage mit PERMISSION_DENIED scheitern.
      try {
        await reference.set({
          profile: {
            displayName: name,
            level: 1,
            createdAt: firebase.database.ServerValue.TIMESTAMP
          },
          selectedClass: "knight",
          schemaVersion: 2,
          characters: { knight: characterRecord("knight") }
        });
      } catch (error) {
        const denied = String(error?.code || "")
          .toLowerCase().includes("permission");

        window.inkfallDiag?.capture(error, "Profil anlegen");

        tell(denied
          ? "Das Profil wurde von der Datenbank abgelehnt, obwohl nur " +
            "erlaubte Felder geschrieben wurden. Bitte die Regeln in der " +
            "Firebase-Konsole mit inkfall/config/database.rules.json " +
            "vergleichen."
          : errorText(error), true);

        throw error;
      }
    }

    if (typeof loadGame === "function") await loadGame();
    ready = true;
  }

  function renderProfileRepair() {
    content.innerHTML = `
      <h2>Spielerprofil vervollständigen</h2>
      <p class="if-start-note">
        Dein Account existiert. Ergänze jetzt deinen Spielernamen.
      </p>
      <input id="if-repair-name" minlength="3" maxlength="20"
        placeholder="Spielername" aria-label="Spielername">
      <button id="if-repair-profile">Profil anlegen</button>
    `;

    content.querySelector("#if-repair-profile").onclick = async () => {
      const name = content.querySelector("#if-repair-name").value.trim();
      const problem = playerNameError(name);

      if (problem) {
        tell(problem, true);
        return;
      }
      lock(true);
      try {
        await auth.currentUser.updateProfile({displayName:name});
        await prepareAccount();
        await renderMenu();
      } catch (error) {
        tell(errorText(error), true);
      } finally {
        lock(false);
      }
    };
  }

  async function renderMenu() {
    if (!ready || !auth.currentUser) return;

    const snapshot = await db.ref(
      "users/" + auth.currentUser.uid + "/profile"
    ).get();

    content.innerHTML = `
      <!-- IF_PLAYER_MENU_V1 -->
      <header class="if-player-header">
        <div class="if-player-emblem" aria-hidden="true">✦</div>
        <div class="if-player-identity">
          <span class="if-player-eyebrow">DEINE BASTION WARTET</span>
          <h2 id="if-menu-greeting"></h2>
          <span id="if-menu-character" class="if-player-character"></span>
        </div>
      </header>
      <div class="if-mode-heading">Wähle dein Abenteuer</div>
      <button id="if-single" class="if-mode-card">
        <span class="if-mode-icon" aria-hidden="true">⚔</span>
        <span class="if-mode-copy">
          <strong>Einzelspieler</strong>
          <small>Dein Held. Deine Verteidigung.</small>
        </span>
        <span class="if-mode-arrow" aria-hidden="true">›</span>
      </button>
      <button id="if-coop" class="if-mode-card if-mode-coop">
        <span class="if-mode-icon" aria-hidden="true">∞</span>
        <span class="if-mode-copy">
          <strong>Online-Coop</strong>
          <small>Zusammen in die letzte Bastion.</small>
        </span>
        <span class="if-mode-arrow" aria-hidden="true">›</span>
      </button>
      <p class="if-menu-development">
        Coop-Lobby verfügbar · Gemeinsamer Kampf in Entwicklung
      </p>
      <footer class="if-menu-footer">
        <span>INKFALL · Entwicklungsfassung</span>
        <button id="if-signout" class="if-signout-button">
          Account abmelden
        </button>
      </footer>
    `;

    content.querySelector("#if-menu-greeting").textContent =
      snapshot.val()?.displayName || "Wächter";

    const menuCharacter = content.querySelector("#if-menu-character");
    const selectedClass = typeof activeCharacterId !== "undefined"
      ? activeCharacterId
      : null;

    const selectedCharacter = typeof currentProfile !== "undefined"
      ? currentProfile?.characters?.[selectedClass]
      : null;

    menuCharacter.textContent = selectedClass && HERO[selectedClass]
      ? HERO[selectedClass].name + " · Level " + (selectedCharacter?.level || 1)
      : "Dein Abenteuer beginnt hier";

    content.querySelector("#if-single").onclick = () => {
      visible = false;
      launcher.hidden = true;
      if (typeof speed !== "undefined") speed = previousSpeed || 1;
    };

    content.querySelector("#if-coop").onclick = () => {
      tell(
        "Coop ist noch nicht spielbereit. Raumcode, Beitritt und " +
        "gemeinsamer Spielzustand werden im nächsten Schritt eingebaut."
      );
    };

    content.querySelector("#if-signout").onclick = async () => {
      try {
        await auth.signOut();
      } catch (error) {
        tell(errorText(error), true);
      }
    };

    tell("");
  }

  /* INKFALL_STARTUP_FIX_V1 */
  renderAuth();

  const back = document.createElement("button");
  back.id = "if-return-menu";
  back.textContent = "Hauptmenü";

  document.getElementById("if-window-titlebar")?.append(back);

  back.onclick = async () => {
    if (!visible) {
      previousSpeed = typeof speed !== "undefined" ? speed : 1;
    }
    visible = true;
    launcher.hidden = false;
    if (typeof speed !== "undefined") speed = 0;

    if (typeof auth !== "undefined" && auth.currentUser) {
      try {
        await renderMenu();
      } catch (error) {
        tell(errorText(error), true);
      }
    } else {
      renderAuth();
    }
  };


  function reportStartupError(error) {
    // DIAG_STARTUP_ERRORS
    window.inkfallDiag?.capture(error, "Startbildschirm");

    ready = false;
    renderAuth();

    tell(
      "Firebase konnte nicht gestartet werden: " +
      (error && error.message ? error.message : String(error)),
      true
    );

    const hint = document.createElement("p");
    hint.className = "if-start-note";
    hint.textContent =
      "Das Loginformular ist sichtbar, aber Anmeldung und Registrierung " +
      "funktionieren erst nach Behebung dieses Verbindungsfehlers.";

    const retry = document.createElement("button");
    retry.className = "secondary";
    retry.textContent = "Seite erneut laden";
    retry.onclick = () => location.reload();

    content.append(hint, retry);
    console.error("INKFALL Startfehler:", error);
  }

  try {
    if (typeof firebase === "undefined") {
      throw new Error(
        "Firebase SDK fehlt. Die Firebase-Scriptdateien wurden nicht geladen."
      );
    }

    // Auch einen nicht initialisierten globalen Auth-/DB-Bezeichner
    // innerhalb des try-Blocks abfangen.
    if (typeof auth === "undefined" || typeof db === "undefined") {
      throw new Error(
        "Firebase Auth oder Realtime Database wurde nicht initialisiert."
      );
    }

    tell("Anmeldung bereit. Accountstatus wird geprüft …");

    auth.onAuthStateChanged(async user => {
      if (busy) return;

      if (!user) {
        ready = false;
        visible = true;
        launcher.hidden = false;
        if (typeof speed !== "undefined") speed = 0;
        renderAuth();
        return;
      }

      try {
        tell("Spielerprofil wird geladen …");
        await prepareAccount();
        await renderMenu();
      } catch (error) {
        tell(errorText(error), true);

        // Bei Ladefehlern aus einem bestehenden Account abmelden können.
        if (!content.querySelector("#if-recovery-signout")) {
          const button = document.createElement("button");
          button.id = "if-recovery-signout";
          button.className = "secondary";
          button.textContent = "Abmelden und erneut versuchen";
          button.onclick = async () => {
            try {
              await auth.signOut();
            } catch (signoutError) {
              tell(errorText(signoutError), true);
            }
          };
          content.append(button);
        }
      }
    }, reportStartupError);

  } catch (error) {
    reportStartupError(error);
  }
})();
