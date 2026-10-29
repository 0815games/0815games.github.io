(() => {
  "use strict";

  if(window.inkfallCheckpointAutosave)return;
  window.inkfallCheckpointAutosave=true;

  const originalUpdate=window.update;

  if(typeof originalUpdate!=="function"){
    console.error("Autosave: update()-Funktion fehlt.");
    return;
  }

  window.update=function(dt){
    const wasActive=active;

    originalUpdate(dt);

    if(wasActive && !active && lives>0){
      // Snapshot noch im selben Ablauf erzeugen, bevor eine neue Welle startet.
      saveGame().catch(error=>{
        console.error("Speicherpunkt:",error);
      });
    }
  };
})();
