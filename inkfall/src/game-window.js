(() => {
  "use strict";

  if (document.getElementById("inkfall-window")) return;

  const game = document.getElementById("game");
  const menu = document.getElementById("ui");

  if (!game || !menu) {
    console.error("INKFALL: Spielbereich oder Menü fehlt.");
    return;
  }

  const frame = document.createElement("main");
  frame.id = "inkfall-window";
  frame.setAttribute("aria-label", "INKFALL Spielfenster");

  const titlebar = document.createElement("header");
  titlebar.id = "if-window-titlebar";

  const title = document.createElement("span");
  title.textContent = "INKFALL · Heroes of the Last Tower";

  const mode = document.createElement("span");
  mode.textContent = "PROTOTYP";

  titlebar.append(title, mode);

  const scroll = document.createElement("section");
  scroll.id = "if-menu-scroll";
  scroll.setAttribute("aria-label", "Spielmenüs");
  scroll.tabIndex = 0;

  document.body.prepend(frame);
  frame.append(titlebar, game, scroll);
  scroll.append(menu);

  // Bereits vorhandene und später von Firebase erstellte Oberflächen einordnen.
  function adoptPanels() {
    const auth = document.getElementById("authBox");
    if (auth && auth.parentElement !== scroll) scroll.append(auth);

    for (const id of ["tree", "codex", "diag"]) {
      const panel = document.getElementById(id);
      if (panel && panel.parentElement !== frame) frame.append(panel);
    }
  }

  adoptPanels();

  const observer = new MutationObserver(adoptPanels);
  observer.observe(document.body, { childList: true });

  // Canvas im verfügbaren Platz einpassen, ohne Spielkoordinaten zu verändern.
  function fitCanvas() {
    const canvas = document.getElementById("cv");
    if (!canvas) return;

    const style = getComputedStyle(game);
    const width = game.clientWidth -
      parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = game.clientHeight -
      parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);

    const scale = Math.max(0, Math.min(
      (width - 8) / canvas.width,
      (height - 8) / canvas.height
    ));

    canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
    canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
  }

  new ResizeObserver(fitCanvas).observe(game);
  fitCanvas();

  // Spielinterne Toast-Meldungen, ohne HTML aus Meldungstexten auszuführen.
  const notices = document.createElement("div");
  notices.id = "if-notices";
  notices.setAttribute("aria-live", "polite");
  frame.append(notices);

  window.inkfallNotify = function(message, type = "info") {
    const item = document.createElement("div");
    item.className = "if-notice" + (type === "error" ? " error" : "");
    item.textContent = String(message);
    notices.append(item);

    while (notices.children.length > 3) {
      notices.firstElementChild.remove();
    }

    setTimeout(() => item.remove(), 5000);
  };

  // Asynchroner eigener Dialog statt nativer Browserdialoge.
  const layer = document.createElement("div");
  layer.id = "if-dialog-layer";
  layer.innerHTML = `
    <section id="if-dialog-card" role="dialog" aria-modal="true"
      aria-labelledby="if-dialog-title" tabindex="-1">
      <h2 id="if-dialog-title"></h2>
      <p id="if-dialog-message"></p>
      <div id="if-dialog-actions">
        <button id="if-dialog-cancel" class="secondary">Abbrechen</button>
        <button id="if-dialog-ok">Bestätigen</button>
      </div>
    </section>
  `;
  frame.append(layer);

  let dialogOpen = false;

  window.inkfallDialog = function({
    title = "INKFALL",
    message = "",
    confirmText = "OK",
    cancelText = null
  } = {}) {
    if (dialogOpen) return Promise.resolve(false);
    dialogOpen = true;

    const previousFocus = document.activeElement;
    const card = document.getElementById("if-dialog-card");
    const ok = document.getElementById("if-dialog-ok");
    const cancel = document.getElementById("if-dialog-cancel");

    document.getElementById("if-dialog-title").textContent = title;
    document.getElementById("if-dialog-message").textContent = message;

    ok.textContent = confirmText;
    cancel.textContent = cancelText || "Abbrechen";
    cancel.hidden = !cancelText;

    layer.classList.add("open");
    ok.focus();

    return new Promise(resolve => {
      function finish(result) {
        layer.classList.remove("open");
        layer.removeEventListener("keydown", keyboard);
        dialogOpen = false;
        if (previousFocus?.isConnected) previousFocus.focus();
        resolve(result);
      }

      function keyboard(event) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          finish(false);
        }

        if (event.key === "Tab") {
          event.preventDefault();
          if (cancel.hidden) {
            ok.focus();
          } else {
            (document.activeElement === ok ? cancel : ok).focus();
          }
        }
      }

      ok.onclick = () => finish(true);
      cancel.onclick = () => finish(false);
      layer.addEventListener("keydown", keyboard);
    });
  };

  // Vorhandenen Neustart-Button auf eigenen Bestätigungsdialog umstellen.
  const reset = Array.from(menu.querySelectorAll("button")).find(button =>
    button.getAttribute("onclick")?.includes("location.reload")
  );

  if (reset) {
    reset.removeAttribute("onclick");
    reset.onclick = async () => {
      const confirmed = await window.inkfallDialog({
        title: "Spiel neu laden?",
        message:
          "Die Seite wird neu geladen. Nicht gespeicherter Fortschritt " +
          "kann verloren gehen. Dein Firebase-Spielstand wird dabei nicht gelöscht.",
        confirmText: "Neu laden",
        cancelText: "Weiterspielen"
      });

      if (confirmed) location.reload();
    };
  }

  window.addEventListener("error", () => {
    window.inkfallNotify(
      "Ein Spielfehler ist aufgetreten. Bitte die Diagnose prüfen.",
      "error"
    );
  });

  window.addEventListener("unhandledrejection", () => {
    window.inkfallNotify(
      "Eine Aktion konnte nicht abgeschlossen werden. Bitte die Diagnose prüfen.",
      "error"
    );
  });
})();
