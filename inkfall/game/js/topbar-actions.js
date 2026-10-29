(() => {
  "use strict";

  // Character level comes only from the selected character, never profile.level.
  function characterLevel(profile, loadedUid, uid, classId) {
    if (!uid || loadedUid !== uid) return null;
    const level = profile?.characters?.[classId]?.level;
    return Number.isInteger(level) && level >= 1 && level <= 999 ? level : null;
  }

  function setup() {
    if (document.getElementById("if-top-actions")) return;
    const bar = document.getElementById("if-window-titlebar");
    const home = document.getElementById("if-return-menu");
    const save = document.getElementById("if-save-floppy");
    const restart = document.getElementById("if-restart-top");
    const hp = document.getElementById("lives")?.closest(".stat");
    const money = document.getElementById("gold")?.closest(".stat");
    const oldHud = document.getElementById("if-top-hud");
    const oldWave = document.getElementById("wave")?.closest(".stat");
    if (!bar || !home || !save || !restart || !hp || !money || !oldHud || !oldWave) {
      console.error("Kopfleiste: Erforderliche Status- oder Bedienelemente fehlen.");
      return;
    }

    const paths = {
      home: '<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
      save: '<path d="M4 3h13l4 4v14H3V3Z"/><path d="M7 3v6h9V3M7 21v-8h10v8M13 4v3"/>',
      restart: '<path d="M20 10a8 8 0 1 0-1 8M20 4v6h-6"/>'
    };
    function label(button, type, text) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = paths[type];
      const span = document.createElement("span");
      span.textContent = text;
      button.replaceChildren(svg, span);
      button.classList.add("if-top-action");
      button.setAttribute("aria-label", text);
      button.type = "button";
    }
    label(home, "home", "Hauptmenü");
    label(save, "save", "Safe");
    label(restart, "restart", "Restart");

    const identity = document.createElement("div");
    identity.id = "if-top-character";
    const name = document.createElement("strong");
    const heroClass = document.createElement("span");
    const level = document.createElement("span");
    level.id = "if-top-character-level";
    identity.append(name, heroClass, level);

    const stats = document.createElement("div");
    stats.id = "if-top-resources";
    hp.firstElementChild.textContent = "♥ HP";
    hp.title = "Bastionsleben, nicht Helden-Lebenspunkte";
    money.firstElementChild.textContent = "Gold";
    stats.append(hp, money);

    // Keep the original #wave node: ui() still writes to it.
    oldWave.hidden = true;
    oldHud.hidden = true;
    oldHud.setAttribute("aria-hidden", "true");
    for (const child of [...bar.children]) {
      if (child.tagName === "SPAN") child.hidden = true;
    }
    bar.prepend(identity, stats);
    bar.classList.add("if-unified-topbar");

    const actions = document.createElement("div");
    actions.id = "if-top-actions";
    home.before(actions);
    actions.append(home, save, restart);

    const status = document.createElement("div");
    status.id = "if-save-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.hidden = true;
    bar.append(status);
    let hideTimer;
    function tell(message, error = false) {
      clearTimeout(hideTimer);
      status.textContent = message;
      status.dataset.error = String(error);
      status.hidden = false;
      hideTimer = setTimeout(() => { status.hidden = true; }, 5500);
    }
    save.removeAttribute("onclick");
    save.onclick = async () => {
      if (save.disabled) return;
      if (typeof saveGame !== "function") {
        tell("Speicherfunktion ist nicht verfügbar.", true);
        return;
      }
      save.disabled = true;
      save.setAttribute("aria-busy", "true");
      try {
        const result = await saveGame();
        tell(result === true ? "Spielstand gespeichert."
          : result === false ? "Nicht gespeichert. Charakter, Spielmodus oder laufende Welle prüfen."
          : "Speicheraufruf beendet — ohne Erfolgsbestätigung.", result !== true);
      } catch (error) {
        console.error("Manuelles Speichern:", error);
        tell("Speichern fehlgeschlagen: " + error.message, true);
      } finally {
        save.disabled = false;
        save.removeAttribute("aria-busy");
      }
    };
    // Home/restart handlers and the wave preview remain unchanged.
    document.getElementById("if-retired-menu")?.remove();
    const authBox = document.getElementById("authBox");
    if (authBox) authBox.hidden = true;

    const style = document.createElement("style");
    style.id = "if-unified-topbar-style";
    style.textContent = `
      #inkfall-window #if-window-titlebar.if-unified-topbar {
        display:flex; align-items:center; flex-wrap:wrap; gap:8px 12px;
        padding:8px 12px 11px !important; min-height:58px;
      }
      #inkfall-window #if-top-hud[hidden],
      #inkfall-window #if-window-titlebar > span[hidden] {
        display:none !important;
      }
      #inkfall-window #if-top-character {
        display:flex; align-items:center; flex-wrap:wrap; gap:5px 8px;
        flex:1 1 180px; min-width:0; color:#fff1da;
        font:750 12px/1.3 system-ui;
      }
      #inkfall-window #if-top-character strong {
        max-width:100%; overflow-wrap:anywhere; font-size:14px;
      }
      #inkfall-window #if-top-character-level {
        white-space:nowrap; color:#302c43; background:#ffe39a;
        border:1px solid #b48b50; border-radius:8px; padding:4px 7px;
        font-weight:850;
      }
      #inkfall-window #if-top-resources {
        display:flex; align-items:center; flex-wrap:wrap; gap:7px;
        flex:0 1 auto; min-width:0;
      }
      #inkfall-window #if-top-resources .stat {
        display:flex; justify-content:space-between; align-items:center;
        gap:10px; width:auto; min-width:72px; margin:0; padding:6px 9px;
        border:1px solid #ffffff35; border-radius:9px;
        color:#fff1da; background:#ffffff0c;
        font:800 12px/1.3 system-ui;
      }
      #inkfall-window #if-window-titlebar.if-unified-topbar #if-top-actions {
        display:flex; flex:0 1 auto; width:auto; margin-left:auto;
        align-items:center; justify-content:flex-end; flex-wrap:wrap; gap:7px;
        min-width:0; max-width:100%;
      }
      @media(max-width:760px) {
        #inkfall-window #if-window-titlebar.if-unified-topbar {
          gap:7px; padding:7px 8px 10px !important;
        }
        #inkfall-window #if-top-character { flex-basis:140px; }
        #inkfall-window #if-top-resources .stat { min-width:60px; padding:5px 7px; }
        #inkfall-window #if-window-titlebar.if-unified-topbar #if-top-actions {
          flex:1 1 100%; justify-content:flex-start; margin-left:0;
        }
      }
    `;
    document.head.append(style);

    function syncIdentity() {
      const uid = typeof auth !== "undefined" ? auth.currentUser?.uid : null;
      const session = window.inkfallActiveCoopSession;
      const player = uid && session ? Object.values(session.players || {}).find(p => p.uid === uid) : null;
      const classId = player?.heroClass ||
        (typeof activeCharacterId !== "undefined" && activeCharacterId) ||
        (typeof hero !== "undefined" ? hero.cls : null);
      const profile = typeof currentProfile !== "undefined" ? currentProfile : null;
      const loadedUid = typeof characterLoadedUid !== "undefined" ? characterLoadedUid : null;
      const value = characterLevel(profile, loadedUid, uid, classId);
      const character = uid && uid === loadedUid ? profile?.characters?.[classId] : null;
      const definition = typeof HERO !== "undefined" ? HERO[classId] : null;
      const text = player?.heroName || character?.heroName ||
        (uid && uid === loadedUid && typeof hero !== "undefined" ? hero.name : null) || "INKFALL";
      const classText = definition?.name || "Kein Charakter geladen";
      const levelText = value === null ? "Lv. —" : "Lv. " + value;
      if (name.textContent !== text) name.textContent = text;
      if (heroClass.textContent !== classText) heroClass.textContent = classText;
      if (level.textContent !== levelText) level.textContent = levelText;
      level.title = value === null ? "Charakterlevel noch nicht geladen" : "Charakterlevel " + value;
    }
    syncIdentity();
    setInterval(syncIdentity, 250);
    window.addEventListener("inkfall:coop-session", syncIdentity);
    window.addEventListener("inkfall:coop-session-cleared", syncIdentity);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once:true });
  } else {
    setup();
  }
})();
