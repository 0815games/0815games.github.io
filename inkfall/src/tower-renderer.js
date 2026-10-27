
(() => {
  "use strict";

  const definitions = {
    arrow: {
      file: "arrow.svg",
      size: 74,
      color: "#91d76d"
    },
    frost: {
      file: "frost.svg",
      size: 80,
      color: "#8eeaf2"
    },
    cannon: {
      file: "cannon.svg",
      size: 80,
      color: "#ffc075"
    },
    antiair: {
      file: "antiair.svg",
      size: 80,
      color: "#d0a7f2"
    }
  };

  const images = {};

  for (const [type, definition] of Object.entries(definitions)) {
    const image = new Image();
    image.decoding = "async";

    image.onerror = () => {
      console.error(
        "Turmgrafik konnte nicht geladen werden:",
        type,
        image.src
      );
    };

    image.src = "assets/art/towers/" + definition.file;
    images[type] = image;
  }

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Während des Ladens keine bloßen Punkte anzeigen.
  function fallback(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#293248";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";

    ellipse(ctx, 0, 9, 22, 6, "#203a353b");

    ctx.fillStyle = "#a7b8b3";
    ctx.beginPath();
    ctx.moveTo(-20, 3);
    ctx.lineTo(0, -4);
    ctx.lineTo(20, 3);
    ctx.lineTo(16, 14);
    ctx.lineTo(-16, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(-12, -22, 24, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#e5eff0";
    ctx.beginPath();
    ctx.moveTo(0, -43);
    ctx.lineTo(15, -25);
    ctx.lineTo(0, -16);
    ctx.lineTo(-15, -25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function draw(ctx, tower, selected, range) {
    const definition = definitions[tower.t];

    if (!definition) {
      fallback(ctx, tower.x, tower.y, "#bbabd2");
      return;
    }

    const level = Math.max(1, Number(tower.lvl) || 1);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Reichweite hinter dem Modell zeichnen.
    if (selected) {
      ctx.fillStyle = "#fff4ac16";
      ctx.strokeStyle = "#fff0accc";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);

      ctx.beginPath();
      ctx.arc(tower.x, tower.y, range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.setLineDash([]);

      ellipse(
        ctx,
        tower.x, tower.y + 5,
        27, 10,
        "#fff1ae50"
      );

      ctx.strokeStyle = "#fff1ae";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(
        tower.x, tower.y + 5,
        27, 10,
        0, 0, Math.PI * 2
      );
      ctx.stroke();
    }

    const image = images[tower.t];
    const size = definition.size;

    if (image.complete && image.naturalWidth > 0) {
      ctx.drawImage(
        image,
        tower.x - size / 2,
        tower.y - size * .86,
        size,
        size
      );
    } else {
      fallback(ctx, tower.x, tower.y, definition.color);
    }

    // Kleine Ausbau-Markierungen nahe dem Fundament.
    if (level > 1) {
      const count = Math.min(4, level - 1);

      for (let i = 0; i < count; i++) {
        ellipse(
          ctx,
          tower.x - (count - 1) * 3.5 + i * 7,
          tower.y + 8,
          2.2, 2.2,
          "#ffe391"
        );
      }
    }

    // Stufenplakette neben dem Fundament.
    const text = String(level);
    const badgeX = tower.x + 22;
    const badgeY = tower.y + 4;

    ctx.font = "900 10px system-ui, sans-serif";
    const width = Math.max(20, ctx.measureText(text).width + 10);

    ctx.fillStyle = "#293248";
    ctx.strokeStyle = selected ? "#fff0ac" : definition.color;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(
      badgeX - width / 2,
      badgeY - 9,
      width,
      18,
      6
    );
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff3c7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, badgeX, badgeY);

    ctx.restore();
  }

  window.InkfallTowerRenderer = {draw};
})();
