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
        <h1 class="if-logo">INKFALL</h1>
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

      if (registering && (name.length < 3 || name.length > 20)) {
        tell("Der Spielername muss 3 bis 20 Zeichen enthalten.", true);
        return;
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

  async function prepareAccount() {
    ready = false;
    const user = auth.currentUser;
    if (!user) return;

    const reference = db.ref("users/" + user.uid);
    const snapshot = await reference.get();

    if (!snapshot.exists()) {
      const name = user.displayName ||
        content.querySelector("#if-playername")?.value.trim();

      if (!name || name.length < 3 || name.length > 20) {
        renderProfileRepair();
        return;
      }

      await reference.set({
        profile:{
          displayName:name,
          level:1,
          createdAt:firebase.database.ServerValue.TIMESTAMP
        },
        save:{
          gold:150,
          lives:100,
          wave:0,
          skillPoints:0,
          heroClass:"knight"
        }
      });
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
      if (name.length < 3 || name.length > 20) {
        tell("Bitte 3 bis 20 Zeichen eingeben.", true);
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
      <h2 id="if-menu-greeting"></h2>
      <button id="if-single">Einzelspieler starten / fortsetzen</button>
      <button id="if-coop" class="secondary">Coop mit einem Freund</button>
      <p class="if-start-note">
        Einzelspieler ist spielbar. Online-Coop wird als nächster
        eigener Entwicklungsschritt synchronisiert.
      </p>
      <button id="if-signout" class="text-button">Abmelden</button>
    `;

    content.querySelector("#if-menu-greeting").textContent =
      "Hallo, " + (snapshot.val()?.displayName || "Wächter") + "!";

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

    tell("Account bereit.");
  }

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

  if (typeof auth === "undefined" || typeof db === "undefined") {
    content.innerHTML = "<h2>Firebase fehlt</h2>";
    tell("Firebase konnte nicht geladen werden. Bitte Diagnose prüfen.", true);
    return;
  }

  renderAuth();

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
    }
  });
})();
