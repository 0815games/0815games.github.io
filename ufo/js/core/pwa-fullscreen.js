(() => {
  const d = document;
  const root = d.documentElement;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true;

  root.classList.toggle("is-ios", isIOS);
  root.classList.toggle("is-standalone", isStandalone);

  const style = d.createElement("style");

  style.textContent = `
    html,
    body {
      width: 100%;
      min-height: 100%;
      margin: 0;
      background: #020914;
    }

    body {
      min-height: 100dvh;
      overscroll-behavior: none;
    }

    html.is-ios.is-standalone,
    html.is-ios.is-standalone body {
      width: 100%;
      height: 100dvh;
      overflow: hidden;
    }

    html.is-ios.is-standalone body {
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    }

    .ios-app-mode {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: none;
      align-items: center;
      justify-content: center;
      padding:
        max(24px, env(safe-area-inset-top))
        max(24px, env(safe-area-inset-right))
        max(24px, env(safe-area-inset-bottom))
        max(24px, env(safe-area-inset-left));
      background: rgba(2, 9, 20, .96);
      backdrop-filter: blur(18px);
      color: #eafdff;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
    }

    .ios-app-mode.show {
      display: flex;
    }

    .ios-app-mode__card {
      width: 100%;
      max-width: 480px;
      padding: 26px;
      border: 1px solid rgba(93, 234, 255, .5);
      border-radius: 26px;
      background: linear-gradient(
        145deg,
        rgba(8, 34, 59, .97),
        rgba(3, 17, 35, .97)
      );
      box-shadow:
        0 0 55px rgba(37, 221, 255, .15),
        inset 0 1px rgba(255,255,255,.1);
    }

    .ios-app-mode__title {
      color: #72efff;
      font-size: 23px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    .ios-app-mode__card p {
      margin: 12px 0;
      line-height: 1.5;
      color: #c8eaf0;
    }

    .ios-app-mode__card button {
      margin-top: 14px;
      border: 1px solid rgba(93,234,255,.55);
      border-radius: 999px;
      padding: 12px 22px;
      color: #eaffff;
      background: #073054;
      font-weight: 800;
    }

    @media (orientation: landscape) and (max-height: 600px) {
      html.is-ios body {
        height: 100dvh;
        overflow: hidden;
      }
    }
  `;

  d.head.appendChild(style);

  const panel = d.createElement("div");
  panel.className = "ios-app-mode";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  panel.innerHTML = `
    <div class="ios-app-mode__card">
      <div class="ios-app-mode__title">App-Modus</div>

      <p>
        Auf dem iPhone läuft UFO-Jagd am besten als
        Home-Screen-App.
      </p>

      <p>
        Tippe in Safari auf <strong>Teilen</strong> und anschließend
        auf <strong>Zum Home-Bildschirm</strong>.
        Starte UFO-Jagd danach über das neue Symbol.
      </p>

      <p>
        Im Querformat nutzt das Spiel dann den verfügbaren
        Bildschirm optimal aus.
      </p>

      <button type="button">
        Verstanden
      </button>
    </div>
  `;

  panel
    .querySelector("button")
    .addEventListener("click", () => panel.classList.remove("show"));

  d.body.appendChild(panel);

  function findFullscreenButton() {
    return d.querySelector(
      [
        '[data-action="fullscreen"]',
        '#fullscreenBtn',
        '#fullscreen-btn',
        '.fullscreen-btn',
        '[aria-label*="Vollbild" i]',
        '[title*="Vollbild" i]'
      ].join(",")
    );
  }

  async function enterFullscreen() {

    if (isIOS && !isStandalone) {
      panel.classList.add("show");
      return;
    }

    const el = d.documentElement;

    const request =
      el.requestFullscreen ||
      el.webkitRequestFullscreen;

    if (!request) {
      if (isIOS) {
        panel.classList.add("show");
      }
      return;
    }

    try {

      await request.call(el);

      if (screen.orientation?.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }

    } catch (error) {

      console.warn(
        "[UFO] Fullscreen konnte nicht aktiviert werden:",
        error
      );

      if (isIOS) {
        panel.classList.add("show");
      }
    }
  }

  function wireFullscreenButton() {

    const btn = findFullscreenButton();

    if (!btn || btn.dataset.pwaFullscreenWired) {
      return;
    }

    btn.dataset.pwaFullscreenWired = "1";

    btn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        enterFullscreen();
      },
      true
    );
  }

  wireFullscreenButton();

  new MutationObserver(wireFullscreenButton)
    .observe(d.body, {
      childList: true,
      subtree: true
    });

  if (
    "serviceWorker" in navigator &&
    location.protocol.startsWith("http")
  ) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js")
        .catch(error =>
          console.warn("[UFO] Service Worker:", error)
        );
    });
  }

  console.info(
    "[UFO] PWA Fullscreen:",
    { isIOS, isStandalone }
  );
})();
