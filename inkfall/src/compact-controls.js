
(() => {
  "use strict";

  function setup() {
    if (document.getElementById("if-wave-controls")) return;

    const start = document.getElementById("start");
    const menu = document.getElementById("ui");

    if (!start || !menu) {
      console.error("Kompakte Steuerung: Menü oder Startbutton fehlt.");
      return;
    }

    const speedButton = Array.from(menu.querySelectorAll("button")).find(
      button => {
        const action = button.getAttribute("onclick") || "";
        return /speed\s*=/.test(action);
      }
    );

    if (!speedButton) {
      console.error("Kompakte Steuerung: Geschwindigkeitsbutton fehlt.");
      return;
    }

    const row = document.createElement("div");
    row.id = "if-wave-controls";

    start.before(row);
    row.append(start, speedButton);

    speedButton.id = "if-speed-toggle";
    speedButton.type = "button";
    speedButton.removeAttribute("onclick");

    function sync() {
      const paused = speed === 0;
      const fast = speed === 2;
      const label = fast ? "2x" : "1x";

      if (speedButton.textContent !== label) {
        speedButton.textContent = label;
      }

      const state = fast ? "fast" : "normal";
      if (speedButton.dataset.speed !== state) {
        speedButton.dataset.speed = state;
      }

      speedButton.disabled = paused;
      speedButton.title = paused
        ? "Spiel pausiert"
        : fast
          ? "Doppelte Geschwindigkeit – auf 1x wechseln"
          : "Normale Geschwindigkeit – auf 2x wechseln";

      speedButton.setAttribute(
        "aria-label",
        speedButton.title
      );
    }

    speedButton.onclick = () => {
      if (speed === 0) return;
      speed = speed === 2 ? 1 : 2;
      sync();
    };

    sync();
    setInterval(sync, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, {once:true});
  } else {
    setup();
  }
})();
