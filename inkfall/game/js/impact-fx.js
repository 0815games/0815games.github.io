
(() => {
  "use strict";

  const particles = [];
  const rings = [];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  let lastFrame = performance.now();

  function particle(x, y, color, options = {}) {
    if (particles.length >= 240) return;

    const angle = Math.random() * Math.PI * 2;
    const velocity = options.velocity ?? (30 + Math.random() * 70);
    const life = options.life ?? (.2 + Math.random() * .3);

    particles.push({
      x, y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      size: options.size ?? (1.5 + Math.random() * 2),
      life,
      max: life,
      color,
      kind: options.kind || "spark",
      gravity: options.gravity ?? 35
    });
  }

  function ring(x, y, radius, color, life = .3, fill = false) {
    if (rings.length >= 40) rings.shift();

    rings.push({
      x, y, radius, color, life, max: life, fill
    });
  }

  function impact(shot, point) {
    const x = point.x;
    const y = point.y;

    // Auch ein geblocktes Projektil schlägt sichtbar ein,
    // soll aber nicht wie ein erfolgreicher Schadenstreffer aussehen.
    const blocked = shot.type === "arrow" &&
      shot.e?.t === "boss" &&
      shot.e?.shieldUp;

    if (blocked) {
      ring(x, y, 18, "#a8cfff", .2);
      if (!reduced.matches) {
        for (let i = 0; i < 4; i++) {
          particle(x, y, "#c9e7ff", {
            velocity: 45, life: .2
          });
        }
      }
      return;
    }

    const count = reduced.matches ? 3 : 10;

    if (shot.type === "arrow") {
      ring(x, y, 12, "#fff0b2", .16);

      for (let i = 0; i < (reduced.matches ? 2 : 5); i++) {
        particle(x, y, i % 2 ? "#f7d98b" : "#ae794b", {
          kind: "shard",
          velocity: 28 + Math.random() * 45,
          life: .2,
          gravity: 80
        });
      }
    }

    else if (shot.type === "frost") {
      ring(x, y, 25, "#9defff", .32);
      ring(x, y, 10, "#e3ffff", .16, true);

      for (let i = 0; i < count; i++) {
        particle(x, y, i % 2 ? "#c9ffff" : "#65cfe8", {
          kind: "ice",
          velocity: 35 + Math.random() * 65,
          life: .35,
          gravity: 15
        });
      }
    }

    else if (shot.type === "cannon") {
      const radius = Number(shot.aoe) || 28;

      // Der äußere Ring orientiert sich am tatsächlichen Splash-Radius.
      ring(x, y, radius, "#ffcb77", .35);
      ring(x, y, 17, "#fff1b1", .16, true);
      ring(x, y, 26, "#f59a4a", .25);

      for (let i = 0; i < count; i++) {
        particle(x, y, i % 2 ? "#ffcf72" : "#f08743", {
          velocity: 45 + Math.random() * 90,
          life: .3,
          gravity: 95,
          size: 2 + Math.random() * 2
        });
      }

      if (!reduced.matches) {
        for (let i = 0; i < 5; i++) {
          particle(x, y, "#68716b", {
            kind: "smoke",
            velocity: 12 + Math.random() * 16,
            life: .65,
            gravity: -15,
            size: 4 + Math.random() * 4
          });
        }
      }
    }

    else if (shot.type === "antiair") {
      ring(x, y, 21, "#b6f9ff", .24);
      ring(x, y, 8, "#ffffff", .12, true);

      for (let i = 0; i < count; i++) {
        particle(x, y, i % 2 ? "#cdb5ff" : "#8ef6ff", {
          kind: "spark",
          velocity: 55 + Math.random() * 65,
          life: .23,
          gravity: 0
        });
      }
    }
  }

  function projectile(ctx, shot) {
    if (shot.dead || !shot.e ||
        shot.e.alive === false || shot.e.hp <= 0) return;

    const target = pos(shot.e);
    const angle = Math.atan2(
      target.y - shot.y, target.x - shot.x
    );

    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(angle);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    if (shot.type === "arrow") {
      ctx.strokeStyle = "#293248";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();

      ctx.strokeStyle = "#e6bf78";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#d2e9e7";
      ctx.strokeStyle = "#293248";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(4, -4);
      ctx.lineTo(5, 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#98d67b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-14, -4);
      ctx.moveTo(-10, 0);
      ctx.lineTo(-14, 4);
      ctx.stroke();
    }

    else if (shot.type === "frost") {
      ctx.fillStyle = "#9eeeff35";
      ctx.beginPath();
      ctx.ellipse(-5, 0, 17, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#9ff9f0";
      ctx.strokeStyle = "#367c9e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-2, -5);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-2, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#f1ffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();
    }

    else if (shot.type === "cannon") {
      if (!reduced.matches) {
        for (let i = 1; i <= 3; i++) {
          ctx.globalAlpha = .2 / i;
          ctx.fillStyle = "#d1b790";
          ctx.beginPath();
          ctx.arc(-i * 7, 0, 4 + i, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#39475a";
      ctx.strokeStyle = "#20283c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#a3b6c2";
      ctx.beginPath();
      ctx.arc(-1.5, -2, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }

    else if (shot.type === "antiair") {
      ctx.strokeStyle = "#967ce466";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(5, 0);
      ctx.stroke();

      ctx.strokeStyle = "#8cf3f5";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(7, 0);
      ctx.stroke();

      ctx.strokeStyle = "#f1ffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    else {
      ctx.fillStyle = "#fff0b5";
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function frame(ctx) {
    const now = performance.now();
    const scale = typeof speed === "number" ? speed : 1;
    const dt = Math.min(.05, (now - lastFrame) / 1000) * scale;
    lastFrame = now;

    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }

    for (const r of rings) r.life -= dt;

    for (const list of [particles, rings]) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].life <= 0) list.splice(i, 1);
      }
    }

    ctx.save();
    ctx.lineCap = "round";

    for (const r of rings) {
      const progress = 1 - r.life / r.max;
      const radius = r.radius * (.25 + progress * .75);

      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = r.color;
      ctx.fillStyle = r.color;
      ctx.lineWidth = 1 + 3 * (1 - progress);

      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);

      if (r.fill) {
        ctx.globalAlpha *= .65;
        ctx.fill();
      } else {
        ctx.stroke();
      }
    }

    for (const p of particles) {
      const progress = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.size * .65);

      if (p.kind === "smoke") {
        ctx.globalAlpha *= .25;
        ctx.beginPath();
        ctx.arc(
          p.x, p.y,
          p.size * (1 + progress),
          0, Math.PI * 2
        );
        ctx.fill();
      } else if (p.kind === "ice") {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size * 1.5);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.lineTo(p.x, p.y + p.size * 1.5);
        ctx.lineTo(p.x - p.size, p.y);
        ctx.closePath();
        ctx.fill();
      } else {
        const length = p.kind === "shard" ? .035 : .02;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(
          p.x - p.vx * length,
          p.y - p.vy * length
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  window.InkfallImpactFX = {projectile, impact, frame};
})();
