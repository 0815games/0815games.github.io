(() => {
  "use strict";

  const ink="#293248";
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

  let time=0;
  let last=performance.now();

  const phases = new WeakMap();
  let nextPhase = 0;

  function phase(enemy) {
    if (!phases.has(enemy)) {
      phases.set(enemy, (++nextPhase) * 1.618);
    }
    return phases.get(enemy);
  }

  const particles=[];
  const flashes=[];
  const deaths=[];

  function circle(ctx,x,y,r,color) {
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
  }

  function burst(x,y,color,count=10) {
    if(reduced)return;

    for(let i=0;i<count;i++) {
      if(particles.length>=180)break;
      const a=Math.random()*Math.PI*2;
      const v=35+Math.random()*90;

      particles.push({
        x,y,
        vx:Math.cos(a)*v,
        vy:Math.sin(a)*v-35,
        life:.35+Math.random()*.35,
        max:.7,
        color,
        size:2+Math.random()*2.5
      });
    }
  }

  function hit(enemy,color) {
    const p=enemy.artPos;
    if(!p)return;

    if(flashes.length<40)flashes.push({
      x:p.x,y:p.y,life:.14,max:.14,color
    });

    burst(p.x,p.y,color,4);
  }

  function die(enemy,color) {
    const p=enemy.artPos;
    if(!p)return;

    burst(p.x,p.y,color,18);

    if(deaths.length<24)deaths.push({
      x:p.x,y:p.y,r:E[enemy.t].r,
      color:E[enemy.t].col,
      life:.38,max:.38
    });
  }

  function legs(ctx,stride,color) {
    ctx.strokeStyle=ink;
    ctx.lineWidth=3;
    ctx.lineCap="round";
    ctx.fillStyle=color;

    for(const side of [-1,1]) {
      ctx.save();
      ctx.translate(side*7,7);
      ctx.rotate(stride*side*.5);

      ctx.beginPath();
      ctx.roundRect(-3.5,0,7,11,3);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function face(ctx,r,angry) {
    for(const side of [-1,1]) {
      circle(ctx,side*r*.32,-r*.22,r*.24,"#fff8dc");
      circle(ctx,side*r*.32+1,-r*.18,r*.11,ink);
    }

    ctx.strokeStyle=ink;
    ctx.lineWidth=2;
    ctx.beginPath();

    if(angry) {
      ctx.moveTo(-r*.3,-r*.48);
      ctx.lineTo(-r*.08,-r*.34);
      ctx.moveTo(r*.3,-r*.48);
      ctx.lineTo(r*.08,-r*.34);
    }

    ctx.moveTo(-r*.22,r*.3);
    ctx.quadraticCurveTo(0,r*.52,r*.22,r*.3);
    ctx.stroke();
  }

  function draw(ctx,e,healthRatio,frozen) {
    const p=pos(e);
    e.artPos=p;

    const def=E[e.t];
    const r=def.r;
    const moving=active && speed>0 && def.s>0 && e.slow<1 && !reduced;
    const stride=moving?Math.sin(time*14+phase(e)):0;
    const bob=moving?Math.abs(stride)*1.5:0;

    ctx.save();
    ctx.translate(p.x,p.y);

    // Bodenschatten.
    ctx.fillStyle="#24443d33";
    ctx.beginPath();
    ctx.ellipse(0,r*.85,r*1.05,r*.3,0,0,Math.PI*2);
    ctx.fill();

    ctx.translate(0,-bob);
    ctx.strokeStyle=ink;
    ctx.lineWidth=2.5;
    ctx.lineJoin="round";
    ctx.lineCap="round";

    // Frosttönung bei Treffern durch den Frostturm.
    if(frozen) {
      ctx.globalAlpha=.25;
      circle(ctx,0,0,r*1.35,"#a8f6ff");
      ctx.globalAlpha=1;
    }

    if(e.t==="crawler") {
      legs(ctx,stride,"#7b3f70");

      ctx.fillStyle="#b968aa";
      ctx.beginPath();
      ctx.ellipse(0,0,r,r*.85,0,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      // Stacheln.
      ctx.fillStyle="#8a4a80";
      for(let i=-2;i<=2;i++) {
        ctx.beginPath();
        ctx.moveTo(i*7,-r*.55);
        ctx.lineTo(i*7+3,-r*1.05);
        ctx.lineTo(i*7+6,-r*.55);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      face(ctx,r,true);
    }

    else if(e.t==="runner") {
      legs(ctx,stride*1.5,"#b96b2a");

      ctx.fillStyle="#f29b49";
      ctx.beginPath();
      ctx.ellipse(0,0,r*.85,r,0,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      // Windlinie.
      ctx.strokeStyle="#ffe6a8";
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(-r*1.4,-r*.2);
      ctx.lineTo(-r*.8,-r*.2);
      ctx.moveTo(-r*1.6,r*.25);
      ctx.lineTo(-r*.9,r*.25);
      ctx.stroke();

      face(ctx,r,true);
    }

    else if(e.t==="tank") {
      legs(ctx,stride*.5,"#4a5f7a");

      ctx.fillStyle="#728eae";
      ctx.beginPath();
      ctx.roundRect(-r,-r*.9,r*2,r*1.8,9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle="#8fa8c2";
      ctx.beginPath();
      ctx.roundRect(-r*.75,-r*1.25,r*1.5,r*.55,6);
      ctx.fill();
      ctx.stroke();

      face(ctx,r*.9,true);

      // Faust.
      circle(ctx,r*.85,r*.15,r*.4,"#5d7189");
      ctx.stroke();
    }

    else if(e.t==="shield") {
      legs(ctx,stride*.7,"#4b6c7a");

      ctx.fillStyle="#6ea5b4";
      ctx.beginPath();
      ctx.ellipse(0,0,r*.9,r,0,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      face(ctx,r*.9,false);

      // Schild in Blickrichtung.
      ctx.fillStyle="#e2bd66";
      ctx.beginPath();
      ctx.moveTo(r*.35,-r*.85);
      ctx.lineTo(r*1.35,-r*.45);
      ctx.lineTo(r*1.5,r*.35);
      ctx.lineTo(r*.75,r*.95);
      ctx.lineTo(r*.35,r*.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle="#fff1b2";
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(r*.75,-r*.35);
      ctx.lineTo(r*.75,r*.45);
      ctx.stroke();
    }

    else if(e.t==="flyer") {
      const flap=reduced?0:Math.sin(time*18+phase(e))*.55;

      // Flügel hinter dem Körper.
      ctx.fillStyle="#c8a1ef";
      for(const side of [-1,1]) {
        ctx.save();
        ctx.translate(side*r*.35,0);
        ctx.rotate(side*(.35+flap*.5));

        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.quadraticCurveTo(side*r*1.5,-r*1.5,side*r*1.15,r*.5);
        ctx.quadraticCurveTo(side*r*.6,r*.25,0,0);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle="#a872d1";
      ctx.beginPath();
      ctx.ellipse(0,0,r*.9,r,0,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      face(ctx,r*.9,false);

      // Schweif.
      ctx.strokeStyle="#7d4fae";
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(0,r*.75);
      ctx.quadraticCurveTo(0,r*1.35,Math.sin(time*9+phase(e))*5,r*1.7);
      ctx.stroke();
    }

    else if(e.t==="healer") {
      legs(ctx,stride*.6,"#3f7a67");

      ctx.fillStyle="#65bca0";
      ctx.beginPath();
      ctx.ellipse(0,0,r*.9,r,0,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      face(ctx,r*.9,false);

      // Heilstab mit pulsierendem Kristall.
      ctx.strokeStyle="#77543f";
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(r*.8,r*.6);
      ctx.lineTo(r*.9,-r*1.15);
      ctx.stroke();

      const pulse=reduced?0:(Math.sin(time*6)*.5+.5);
      circle(ctx,r*.9,-r*1.3,4+pulse*2,"#d8fff1");
      ctx.strokeStyle=ink;
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(r*.9,-r*1.3,4+pulse*2,0,Math.PI*2);
      ctx.stroke();
    }

    else if(e.t==="boss") {
      legs(ctx,stride*.35,"#4c3768");

      // Umhang.
      ctx.fillStyle="#5c3f8c";
      ctx.beginPath();
      ctx.moveTo(-r*.9,-r*.35);
      ctx.lineTo(r*.9,-r*.35);
      ctx.lineTo(r*1.25,r*.75);
      ctx.lineTo(-r*1.25,r*.75);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle="#7653ac";
      ctx.beginPath();
      ctx.roundRect(-r,-r,r*2,r*1.7,10);
      ctx.fill();
      ctx.stroke();

      // Krone.
      ctx.fillStyle="#e3b45f";
      ctx.beginPath();
      ctx.moveTo(-r*.75,-r);
      ctx.lineTo(-r*.45,-r*1.55);
      ctx.lineTo(-r*.1,-r*1.05);
      ctx.lineTo(r*.25,-r*1.65);
      ctx.lineTo(r*.55,-r*1.05);
      ctx.lineTo(r*.85,-r*1.5);
      ctx.lineTo(r*.9,-r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      face(ctx,r*.95,true);

      // Zepter.
      circle(ctx,-r*.95,r*.15,r*.38,"#e3b45f");
      ctx.stroke();
    }

    else {
      circle(ctx,0,0,r,def.col);
      ctx.stroke();
      face(ctx,r,false);
    }

    ctx.restore();

    // Lebensbalken direkt über dem Gegner.
    if(healthRatio<1) {
      const width=r*2.1;
      const x=p.x-width/2;
      const y=p.y-r-14;

      ctx.fillStyle="#293248";
      ctx.beginPath();
      ctx.roundRect(x-1,y-1,width+2,7,4);
      ctx.fill();

      ctx.fillStyle=healthRatio>.5?"#7bd35f":healthRatio>.25?"#f4b942":"#e75f5f";
      ctx.beginPath();
      ctx.roundRect(x,y,width*healthRatio,5,3);
      ctx.fill();
    }
  }

  function frame(ctx) {
    const now=performance.now();
    const scale=typeof speed==="number"?speed:1;
    const dt=Math.min(.05,(now-last)/1000)*scale;
    last=now;
    time+=dt;

    ctx.save();

    for(const particle of particles) {
      particle.life-=dt;
      particle.x+=particle.vx*dt;
      particle.y+=particle.vy*dt;
      particle.vy+=80*dt;
    }

    for(const flash of flashes)flash.life-=dt;
    for(const death of deaths)death.life-=dt;

    for(const list of [particles,flashes,deaths]) {
      for(let i=list.length-1;i>=0;i--) {
        if(list[i].life<=0)list.splice(i,1);
      }
    }

    for(const death of deaths) {
      const progress=1-death.life/death.max;
      ctx.globalAlpha=Math.max(0,1-progress);
      ctx.strokeStyle="#fff2b2";
      ctx.lineWidth=4*(1-progress)+1;
      ctx.beginPath();
      ctx.arc(death.x,death.y,death.r+progress*18,0,Math.PI*2);
      ctx.stroke();
    }

    ctx.globalAlpha=1;

    for(const particle of particles) {
      ctx.globalAlpha=Math.max(0,particle.life/particle.max);
      circle(ctx,particle.x,particle.y,particle.size,particle.color);
    }

    ctx.globalAlpha=1;

    for(const flash of flashes) {
      const progress=1-flash.life/flash.max;
      ctx.globalAlpha=Math.max(0,1-progress);
      circle(ctx,flash.x,flash.y,6+progress*12,flash.color);
    }

    ctx.restore();
  }

  function connect() {
    if (!window.InkfallWorld) {
      console.error("Gegneranimation: InkfallWorld fehlt.");
      return;
    }

    window.InkfallWorld.enemy = function(
      ctx, enemy, x, y, radius, color
    ) {
      const maximum = enemy.max || E[enemy.t].hp;
      const ratio = Math.max(
        0, Math.min(1, enemy.hp / maximum)
      );

      // Die bestehende Spiellogik kennt allgemeine Verlangsamung,
      // nicht getrennte Frost-/Schildstoß-Statusobjekte.
      draw(ctx, enemy, ratio, enemy.slow > 0);
    };
  }


  window.InkfallEnemyArt = {
    frame,
    connect,
    onHit(enemy, color) {
      enemy.artPos = pos(enemy);
      hit(enemy, color);
    },
    onDeath(enemy, color) {
      enemy.artPos = pos(enemy);
      die(enemy, color);
    }
  };

  document.addEventListener("DOMContentLoaded",connect);
})();
