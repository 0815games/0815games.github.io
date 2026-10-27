(() => {
  "use strict";

  const definitions = {
    arrow:   {file:"arrow.svg",size:74,color:"#91d76d"},
    frost:   {file:"frost.svg",size:80,color:"#7ce6ee"},
    cannon:  {file:"cannon.svg",size:80,color:"#ffbd68"},
    antiair: {file:"antiair.svg",size:78,color:"#c8a3fa"}
  };

  const images = {};

  for (const [type,definition] of Object.entries(definitions)) {
    const image = new Image();
    image.src = "assets/art/towers/" + definition.file;

    image.onerror = () => {
      window.inkfallDiag?.warn(
        "Turmgrafik",
        "Grafik konnte nicht geladen werden: " + image.src
      );
    };

    images[type] = image;
  }

  function draw(ctx,tower,selected,range) {
    const definition = definitions[tower.t];
    if (!definition) return;

    ctx.save();

    if (selected) {
      ctx.fillStyle = "#fff8be20";
      ctx.strokeStyle = "#fff4af";
      ctx.lineWidth = 2;
      ctx.setLineDash([7,6]);
      ctx.beginPath();
      ctx.arc(tower.x,tower.y,range,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = definition.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(tower.x,tower.y+7,28,10,0,0,Math.PI*2);
      ctx.stroke();
    }

    const image = images[tower.t];
    const size = definition.size;

    if (image.complete && image.naturalWidth) {
      ctx.drawImage(
        image,
        tower.x-size/2,
        tower.y-size+19,
        size,
        size
      );
    } else {
      // Fallback bleibt sichtbar, wenn ein Asset fehlt.
      ctx.fillStyle = definition.color;
      ctx.strokeStyle = "#293248";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tower.x,tower.y,16,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();
    }

    // Kompakte Stufenanzeige rechts am Fundament.
    const labelX=tower.x+18;
    const labelY=tower.y+10;

    ctx.fillStyle="#293248";
    ctx.beginPath();
    ctx.arc(labelX,labelY,10,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="#fff2ba";
    ctx.font="900 11px system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(String(tower.lvl),labelX,labelY);

    ctx.restore();
  }

  function updateBuildTiles() {
    const grid=document.getElementById("if-build-grid");
    if(!grid)return;

    for(const button of grid.querySelectorAll("button")) {
      const type=button.querySelector("[data-tower]")?.dataset.tower;
      const definition=definitions[type];

      if(!definition || button.dataset.artVersion==="2")continue;

      const previous=button.querySelector("img,.if-tower-icon");
      const image=document.createElement("img");

      image.src="assets/art/towers/"+definition.file;
      image.alt="";
      image.className="if-tower-thumbnail";

      if(previous)previous.replaceWith(image);
      else button.prepend(image);

      button.style.setProperty("--tower-accent",definition.color);
      button.dataset.artVersion="2";
    }
  }

  window.InkfallTowerArt={draw};

  document.addEventListener("DOMContentLoaded",updateBuildTiles);
  window.addEventListener("load",updateBuildTiles);
})();
