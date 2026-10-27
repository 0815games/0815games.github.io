(() => {
  "use strict";

  const types=["arrow","frost","cannon","antiair"];

  function refresh() {
    const grid=document.getElementById("if-build-grid");
    if(!grid)return;

    for(const button of grid.querySelectorAll("button")) {
      const type=button.querySelector("[data-tower]")?.dataset.tower;
      if(!types.includes(type))continue;

      let image=button.querySelector("img");

      if(!image) {
        image=document.createElement("img");
        image.alt="";
        button.prepend(image);
      }

      const path="assets/art/towers/"+type+".svg";

      if(image.getAttribute("src")!==path)image.src=path;

      image.classList.add("if-tower-thumbnail");
      image.style.display="block";

      button.querySelectorAll(".if-tower-icon").forEach(icon=>icon.remove());

      if(!image.dataset.monitored) {
        image.dataset.monitored="true";

        image.addEventListener("error",()=>{
          window.inkfallDiag?.warn(
            "Bauleiste",
            "Turmbild konnte nicht geladen werden: "+path
          );
        });
      }
    }
  }

  document.addEventListener("DOMContentLoaded",refresh);
  window.addEventListener("load",refresh);
})();
