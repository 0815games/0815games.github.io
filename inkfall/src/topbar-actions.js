
(() => {
  "use strict";

  function setup() {
    if(document.getElementById("if-top-actions"))return;

    const bar=document.getElementById("if-window-titlebar");
    const home=document.getElementById("if-return-menu");
    const save=document.getElementById("if-save-floppy");
    const restart=document.getElementById("if-restart-top");

    if(!bar || !home || !save || !restart) {
      console.error("Kopfleiste: Ein erforderlicher Button fehlt.");
      return;
    }

    const paths={
      home:'<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
      save:'<path d="M4 3h13l4 4v14H3V3Z"/><path d="M7 3v6h9V3M7 21v-8h10v8M13 4v3"/>',
      restart:'<path d="M20 10a8 8 0 1 0-1 8M20 4v6h-6"/>'
    };

    function label(button,type,text) {
      button.replaceChildren();

      const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
      svg.setAttribute("viewBox","0 0 24 24");
      svg.setAttribute("aria-hidden","true");
      svg.innerHTML=paths[type];

      const span=document.createElement("span");
      span.textContent=text;

      button.append(svg,span);
      button.classList.add("if-top-action");
      button.setAttribute("aria-label",text);
      button.type="button";
    }

    label(home,"home","Hauptmenü");
    label(save,"save","Safe");
    label(restart,"restart","Restart");

    const actions=document.createElement("div");
    actions.id="if-top-actions";

    home.before(actions);
    actions.append(home,save,restart);

    const status=document.createElement("div");
    status.id="if-save-status";
    status.setAttribute("role","status");
    status.setAttribute("aria-live","polite");
    status.hidden=true;
    bar.append(status);

    let hideTimer;

    function tell(message,error=false) {
      clearTimeout(hideTimer);
      status.textContent=message;
      status.dataset.error=String(error);
      status.hidden=false;
      hideTimer=setTimeout(()=>{status.hidden=true;},5500);
    }

    // Alten Inline-Handler ersetzen; vorhandene Speichersperren bleiben in saveGame().
    save.removeAttribute("onclick");
    save.onclick=async()=>{
      if(save.disabled)return;

      if(typeof saveGame!=="function") {
        tell("Speicherfunktion ist nicht verfügbar.",true);
        return;
      }

      save.disabled=true;
      save.setAttribute("aria-busy","true");

      try {
        const result=await saveGame();

        if(result===true) {
          tell("Spielstand gespeichert.");
        } else if(result===false) {
          tell("Nicht gespeichert. Charakter, Spielmodus oder laufende Welle prüfen.",true);
        } else {
          tell("Speicheraufruf beendet — ohne Erfolgsbestätigung.",true);
        }
      } catch(error) {
        console.error("Manuelles Speichern:",error);
        tell("Speichern fehlgeschlagen: "+error.message,true);
      } finally {
        save.disabled=false;
        save.removeAttribute("aria-busy");
      }
    };

    // Home- und Restart-Handler werden bewusst nicht ersetzt.
    // Dadurch bleiben Hauptmenü-Verhalten und Neustart-Dialog erhalten.
    document.getElementById("if-retired-menu")?.remove();

    // Firebase-Statusknoten nicht löschen:
    // Andere Skripte können sie weiterhin für Statusmeldungen verwenden.
    const authBox=document.getElementById("authBox");
    if(authBox)authBox.hidden=true;
  }

  if(document.readyState==="loading") {
    document.addEventListener("DOMContentLoaded",setup,{once:true});
  } else {
    setup();
  }
})();
