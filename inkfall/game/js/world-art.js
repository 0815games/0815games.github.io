(() => {
  "use strict";

  const INK = "#293248";

  function random(seed) {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function distanceToPath(x, y, points) {
    let nearest = Infinity;

    for (let i = 0; i < points.length - 1; i++) {
      const [ax, ay] = points[i];
      const [bx, by] = points[i + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const length = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1,
        ((x - ax) * dx + (y - ay) * dy) / length
      ));

      nearest = Math.min(nearest,
        Math.hypot(x - ax - dx * t, y - ay - dy * t)
      );
    }

    return nearest;
  }

  function bush(ctx, x, y, scale, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ellipse(ctx, 0, 10, 23, 8, "#294e433b");

    const leaves = [
      [-14, 0, 15, "#348b55"],
      [12, -2, 16, "#368f51"],
      [0, -12, 19, "#4fae55"],
      [-7, -17, 12, "#73ca61"]
    ];

    for (const [lx, ly, r, color] of leaves) {
      ctx.fillStyle = color;
      ctx.strokeStyle = "#28764d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.strokeStyle = "#a1de75";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, -17);
    ctx.lineTo(-3, -22);
    ctx.moveTo(6, -9);
    ctx.lineTo(13, -14);
    ctx.stroke();

    if (random(seed) > .5) {
      ellipse(ctx, -12, -4, 3, 3, "#d8a6f6");
      ellipse(ctx, 11, -12, 3, 3, "#fff0b2");
    }

    ctx.restore();
  }

  function background(ctx, width, height, path) {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#86d35f");
    gradient.addColorStop(.5, "#99db68");
    gradient.addColorStop(1, "#73bf59");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Weiche Farbflächen statt einer gleichmäßigen grünen Platte.
    for (let i = 0; i < 45; i++) {
      const x = random(i + 1) * width;
      const y = random(i + 200) * height;

      ellipse(
        ctx, x, y,
        25 + random(i + 400) * 70,
        12 + random(i + 600) * 35,
        i % 2 ? "#c8ef8430" : "#4a9d4820"
      );
    }

    for (let i = 0; i < 180; i++) {
      const x = 12 + random(i + 900) * (width - 24);
      const y = 12 + random(i + 1200) * (height - 24);

      if (distanceToPath(x, y, path) < 28) continue;

      ctx.strokeStyle = i % 3 ? "#61ad55" : "#b8e67b";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(x - 3, y + 3);
      ctx.lineTo(x - 5, y - 1);
      ctx.moveTo(x, y + 3);
      ctx.lineTo(x + 1, y - 4);
      ctx.moveTo(x + 3, y + 3);
      ctx.lineTo(x + 5, y);
      ctx.stroke();

      if (i % 9 === 0) {
        ellipse(ctx, x + 5, y - 3, 3, 3, "#fff6cb");
        ellipse(ctx, x + 5, y - 3, 1.2, 1.2, "#e9ac51");
      }
    }

    // Randvegetation bleibt dekorativ und blockiert keine Bewegung.
    for (let i = 0; i < 22; i++) {
      const side = i % 4;
      let x, y;

      if (side < 2) {
        x = 25 + random(i + 1600) * (width - 50);
        y = side === 0 ? 14 : height - 8;
      } else {
        x = side === 2 ? 10 : width - 10;
        y = 30 + random(i + 1800) * (height - 60);
      }

      if (distanceToPath(x, y, path) < 52) continue;

      bush(ctx, x, y, .7 + random(i + 2000) * .4, i);
    }

    ctx.restore();
  }

  function drawPath(ctx, points, air) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (air) {
      // Taktische Markierung, keine zweite gepflasterte Straße.
      ctx.strokeStyle = "#e7fcff70";
      ctx.lineWidth = 3;
      ctx.setLineDash([3, 15]);
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      points.slice(1).forEach(point => ctx.lineTo(...point));
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.strokeStyle = "#638d4955";
    ctx.lineWidth = 40;
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    points.slice(1).forEach(point => ctx.lineTo(...point));
    ctx.stroke();

    let index = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const [ax, ay] = points[i];
      const [bx, by] = points[i + 1];
      const length = Math.hypot(bx - ax, by - ay);
      const count = Math.ceil(length / 27);

      for (let j = 0; j < count; j++) {
        const t = (j + .5) / count;
        const x = ax + (bx - ax) * t;
        const y = ay + (by - ay) * t;
        const angle = Math.atan2(by - ay, bx - ax);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + (random(index + 10) - .5) * .12);

        ctx.fillStyle = "#5d735b55";
        ctx.beginPath();
        ctx.ellipse(1, 4, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-12, -11);
        ctx.lineTo(-7, -16);
        ctx.lineTo(10, -14);
        ctx.lineTo(14, -7);
        ctx.lineTo(12, 13);
        ctx.lineTo(3, 16);
        ctx.lineTo(-13, 11);
        ctx.closePath();

        ctx.fillStyle = index % 3 === 0 ? "#d6d4b7" : "#e3ddc2";
        ctx.strokeStyle = "#8b9677";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-9, -8);
        ctx.lineTo(-6, -12);
        ctx.lineTo(7, -11);
        ctx.strokeStyle = "#fff7d8";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
        index++;
      }
    }

    ctx.restore();
  }

  function bastion(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    ellipse(ctx, 0, 9, 38, 12, "#254f4950");

    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;

    ctx.fillStyle = "#adc9ce";
    ctx.beginPath();
    ctx.moveTo(-29, 5);
    ctx.lineTo(-29, -30);
    ctx.lineTo(-16, -30);
    ctx.lineTo(-16, -20);
    ctx.lineTo(16, -20);
    ctx.lineTo(16, -30);
    ctx.lineTo(29, -30);
    ctx.lineTo(29, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#789ba9";
    ctx.fillRect(-25, -5, 50, 12);

    ctx.fillStyle = "#60538f";
    ctx.beginPath();
    ctx.moveTo(-12, 7);
    ctx.lineTo(-12, -9);
    ctx.quadraticCurveTo(0, -24, 12, -9);
    ctx.lineTo(12, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#7de9ed";
    ctx.beginPath();
    ctx.moveTo(0, -51);
    ctx.lineTo(12, -35);
    ctx.lineTo(0, -20);
    ctx.lineTo(-12, -35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#e4ffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -38);
    ctx.lineTo(0, -44);
    ctx.lineTo(4, -36);
    ctx.stroke();

    ctx.restore();
  }

  function enemy(ctx, enemy, x, y, radius, color) {
    ctx.save();
    ctx.translate(x, y);

    ellipse(ctx, 0, radius * .8, radius * 1.1, 4, "#25404740");

    // Flügel liegen hinter dem Körper.
    if (enemy.t === "flyer") {
      ctx.fillStyle = "#c8a1ef";
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.quadraticCurveTo(-29, -19, -24, 7);
      ctx.lineTo(-8, 8);
      ctx.moveTo(5, -2);
      ctx.quadraticCurveTo(29, -19, 24, 7);
      ctx.lineTo(8, 8);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = {
      crawler:"#b968aa",
      runner:"#f29b49",
      tank:"#728eae",
      shield:"#6ea5b4",
      flyer:"#a872d1",
      healer:"#65bca0",
      boss:"#7653ac"
    }[enemy.t] || color;

    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 1.05, -.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ellipse(ctx, -radius * .28, -radius * .4,
      radius * .4, radius * .22, "#ffffff30");

    // Augen und Pupillen.
    for (const offset of [-1, 1]) {
      ellipse(ctx, offset * radius * .34, -2,
        radius * .23, radius * .29, "#fff8dc");
      ellipse(ctx, offset * radius * .34 + 1, -1,
        radius * .1, radius * .15, INK);
    }

    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, radius * .45);
    ctx.lineTo(3, radius * .4);
    ctx.stroke();

    if (enemy.t === "tank" || enemy.t === "boss") {
      ctx.fillStyle = enemy.t === "boss" ? "#dfa453" : "#a9c1ce";
      ctx.beginPath();
      ctx.moveTo(-radius, -radius * .45);
      ctx.lineTo(-radius * .6, -radius * 1.1);
      ctx.lineTo(radius * .7, -radius);
      ctx.lineTo(radius, -radius * .4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (enemy.t === "shield") {
      ctx.fillStyle = "#e2bd66";
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(17, -4);
      ctx.lineTo(20, 9);
      ctx.lineTo(12, 18);
      ctx.lineTo(3, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (enemy.t === "healer") {
      ctx.strokeStyle = "#fff1c8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-4, -radius + 4);
      ctx.lineTo(4, -radius + 4);
      ctx.moveTo(0, -radius);
      ctx.lineTo(0, -radius + 8);
      ctx.stroke();
    }

    ctx.restore();
  }

  window.InkfallWorld = {background, drawPath, bastion, enemy};
})();
