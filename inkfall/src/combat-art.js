(() => {
  "use strict";

  const particles = [];
  const effects = [];
  const numbers = [];

  const ink = "#293248";
  const reducedMotion = matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let animationTime = 0;
  let lastFrame = performance.now();

  const heroVisual = {
    x: 120,
    y: 300,
    moving: 0,
    facing: 1,
    attack: 0
  };

  function circle(ctx,x,y,r,color) {
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
  }

  function burst(x,y,color,count=8) {
    if(reducedMotion)return;

    for(let i=0;i<count;i++) {
      if(particles.length>=160)break;
      const angle=Math.random()*Math.PI*2;
      const velocity=25+Math.random()*65;

      particles.push({
        x,y,
        vx:Math.cos(angle)*velocity,
        vy:Math.sin(angle)*velocity-20,
        life:.35+Math.random()*.3,
        max:.65,
        color,
        size:2+Math.random()*2
      });
    }
  }

  function ring(x,y,r,color) {
    if(effects.length>=32)effects.shift();
    effects.push({kind:"ring",x,y,r,color,life:.55,max:.55});
  }

  function attackEffect(x,y,knight) {
    if(effects.length>=32)effects.shift();

    effects.push({
      kind:knight?"slash":"magic",
      x,y,
      life:.23,
      max:.23,
      color:knight?"#fff0a1":"#9af5ff"
    });
  }

  function renderHero(ctx) {
    const h=hero;
    const movement=Math.hypot(h.x-heroVisual.x,h.y-heroVisual.y);
    const walking=movement>.05;

    if(h.x>heroVisual.x+.05)heroVisual.facing=1;
    if(h.x<heroVisual.x-.05)heroVisual.facing=-1;

    heroVisual.x=h.x;
    heroVisual.y=h.y;

    const stride=walking&&!reducedMotion
      ? Math.sin(animationTime*15)
      : 0;

    const bob=walking&&!reducedMotion
      ? Math.abs(stride)*2
      : 0;

    ctx.save();
    ctx.translate(h.x,h.y);

    ctx.fillStyle="#24443d40";
    ctx.beginPath();
    ctx.ellipse(0,10,17,6,0,0,Math.PI*2);
    ctx.fill();

    ctx.translate(0,-bob);
    ctx.scale(heroVisual.facing,1);
    ctx.strokeStyle=ink;
    ctx.lineWidth=2.5;
    ctx.lineJoin="round";
    ctx.lineCap="round";

    // Stiefel und Beine.
    ctx.fillStyle="#3e4864";
    ctx.beginPath();
    ctx.roundRect(-10,2+stride*2,8,13,3);
    ctx.roundRect(3,2-stride*2,8,13,3);
    ctx.fill();
    ctx.stroke();

    if(h.cls==="knight") {
      // Orangefarbener Umhang.
      ctx.fillStyle="#f49a50";
      ctx.beginPath();
      ctx.moveTo(-12,-22);
      ctx.lineTo(9,-20);
      ctx.lineTo(15+stride*2,8);
      ctx.lineTo(-15,10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Türkise Rüstung.
      ctx.fillStyle="#61cbd2";
      ctx.beginPath();
      ctx.roundRect(-12,-22,25,28,7);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle="#baf4eb";
      ctx.beginPath();
      ctx.moveTo(-6,-17);
      ctx.lineTo(-6,-3);
      ctx.stroke();

      // Helm.
      ctx.fillStyle="#b8dce1";
      ctx.strokeStyle=ink;
      ctx.beginPath();
      ctx.roundRect(-12,-42,25,24,8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle="#35445e";
      ctx.fillRect(-7,-33,17,6);
      ctx.strokeStyle="#e5fcf4";
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(-1,-33);
      ctx.lineTo(-1,-27);
      ctx.moveTo(5,-33);
      ctx.lineTo(5,-27);
      ctx.stroke();

      // Helmbusch.
      ctx.strokeStyle="#f49a50";
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.moveTo(1,-42);
      ctx.quadraticCurveTo(1,-51,10,-48);
      ctx.stroke();

      // Schild.
      ctx.lineWidth=2.5;
      ctx.strokeStyle=ink;
      ctx.fillStyle="#e7bc65";
      ctx.beginPath();
      ctx.moveTo(-24,-18);
      ctx.lineTo(-13,-22);
      ctx.lineTo(-3,-17);
      ctx.lineTo(-6,0);
      ctx.lineTo(-14,8);
      ctx.lineTo(-23,-1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle="#fff1b2";
      ctx.beginPath();
      ctx.moveTo(-14,-15);
      ctx.lineTo(-14,0);
      ctx.moveTo(-19,-8);
      ctx.lineTo(-8,-8);
      ctx.stroke();

      // Schwert schwingt nur bei einem tatsächlichen Helden-Treffer.
      ctx.save();
      ctx.translate(14,-13);
      const attack=heroVisual.attack/.22;
      ctx.rotate(-.35+(attack>0?Math.sin(attack*Math.PI)*1.5:0));

      ctx.strokeStyle=ink;
      ctx.fillStyle="#def3f0";
      ctx.beginPath();
      ctx.moveTo(-3,1);
      ctx.lineTo(-3,-24);
      ctx.lineTo(1,-31);
      ctx.lineTo(5,-24);
      ctx.lineTo(4,1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle="#e8b85f";
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(-7,2);
      ctx.lineTo(8,2);
      ctx.moveTo(1,4);
      ctx.lineTo(1,11);
      ctx.stroke();
      ctx.restore();
    } else {
      // Violett-blaue Magierrobe.
      ctx.fillStyle="#9271d3";
      ctx.beginPath();
      ctx.moveTo(-10,-22);
      ctx.lineTo(11,-22);
      ctx.lineTo(18,10);
      ctx.quadraticCurveTo(0,16,-18,10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle="#e5c978";
      ctx.lineWidth=4;
      ctx.beginPath();
      ctx.moveTo(-10,7);
      ctx.lineTo(12,7);
      ctx.stroke();

      // Gesicht.
      circle(ctx,0,-29,11,"#f0c698");
      ctx.strokeStyle=ink;
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(-3,-29);
      ctx.lineTo(-2,-29);
      ctx.moveTo(5,-29);
      ctx.lineTo(6,-29);
      ctx.stroke();

      // Hut.
      ctx.fillStyle="#647dcc";
      ctx.beginPath();
      ctx.moveTo(-12,-36);
      ctx.lineTo(-2,-59);
      ctx.lineTo(6,-48);
      ctx.lineTo(13,-36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0,-36,20,5,-.08,0,Math.PI*2);
      ctx.fill();
      ctx.stroke();

      // Stab.
      ctx.strokeStyle="#77543f";
      ctx.lineWidth=5;
      ctx.beginPath();
      ctx.moveTo(21,9);
      ctx.lineTo(19,-36);
      ctx.stroke();

      ctx.strokeStyle=ink;
      ctx.lineWidth=2;
      ctx.fillStyle="#90edf0";
      ctx.beginPath();
      ctx.moveTo(19,-51);
      ctx.lineTo(27,-40);
      ctx.lineTo(20,-30);
      ctx.lineTo(12,-40);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if(heroVisual.attack>0) {
        circle(ctx,20,-40,5,"#eaffff");
      }
    }

    ctx.restore();
  }

  function renderEffects(ctx) {
    ctx.save();

    for(const effect of effects) {
      const progress=1-effect.life/effect.max;
      ctx.globalAlpha=Math.max(0,1-progress);

      if(effect.kind==="ring") {
        const radius=8+effect.r*progress;
        ctx.strokeStyle=effect.color;
        ctx.lineWidth=6*(1-progress)+1;
        ctx.beginPath();
        ctx.arc(effect.x,effect.y,radius,0,Math.PI*2);
        ctx.stroke();
      } else if(effect.kind==="slash") {
        ctx.strokeStyle=effect.color;
        ctx.lineWidth=5;
        ctx.beginPath();
        ctx.arc(effect.x,effect.y,18+progress*8,-1.3,.9);
        ctx.stroke();
      } else {
        circle(ctx,effect.x,effect.y,5+progress*13,effect.color);
      }
    }

    ctx.globalAlpha=1;

    for(const particle of particles) {
      ctx.globalAlpha=Math.max(0,particle.life/particle.max);
      circle(ctx,particle.x,particle.y,particle.size,particle.color);
    }

    ctx.textAlign="center";
    ctx.font="900 12px system-ui";
    ctx.lineWidth=3;
    ctx.strokeStyle="#293248";

    for(const number of numbers) {
      ctx.globalAlpha=Math.min(1,number.life*2);
      ctx.strokeText(number.text,number.x,number.y);
      ctx.fillStyle="#fff2b2";
      ctx.fillText(number.text,number.x,number.y);
    }

    ctx.restore();
  }

  function frame(ctx) {
    const now=performance.now();
    const timeScale=typeof speed==="number"?speed:1;
    const dt=Math.min(.05,(now-lastFrame)/1000)*timeScale;
    lastFrame=now;
    animationTime+=dt;

    heroVisual.attack=Math.max(0,heroVisual.attack-dt);

    for(const particle of particles) {
      particle.life-=dt;
      particle.x+=particle.vx*dt;
      particle.y+=particle.vy*dt;
      particle.vy+=65*dt;
    }

    for(const effect of effects)effect.life-=dt;

    for(const number of numbers) {
      number.life-=dt;
      number.y-=23*dt;
    }

    for(const list of [particles,effects,numbers]) {
      for(let i=list.length-1;i>=0;i--) {
        if(list[i].life<=0)list.splice(i,1);
      }
    }

    renderEffects(ctx);
  }

  function connectCombat() {
    const originalHit=window.hit;

    window.hit=function(enemy,damage,type) {
      if(!enemy)return originalHit(enemy,damage,type);

      const wasAlive=enemy.hp>0 && enemy.alive!==false;
      const before=enemy.hp;
      const point=pos(enemy);

      const result=originalHit(enemy,damage,type);
      const dealt=Math.max(0,before-enemy.hp);

      if(wasAlive && dealt>0) {
        const color=type==="frost"?"#a5f5ff":"#ffe28b";

        burst(point.x,point.y,color,4);

        if(!reducedMotion && numbers.length<24) {
          numbers.push({
            x:point.x,
            y:point.y-22,
            text:String(Math.round(dealt)),
            life:.65
          });
        }

        if(type==="hero") {
          heroVisual.attack=.22;
          attackEffect(point.x,point.y,hero.cls==="knight");
        }

        if(enemy.hp<=0) {
          burst(point.x,point.y,E[enemy.t].col,12);
        }
      }

      return result;
    };

    const originalAbility=window.useAbility;

    window.useAbility=function() {
      // Fähigkeit nicht im Menü, während Pause oder außerhalb einer Welle auslösen.
      if(!active || speed<=0 || hero.cd>0)return;

      const knight=hero.cls==="knight";
      const x=hero.x;
      const y=hero.y;

      const result=originalAbility();

      if(hero.cd>0) {
        ring(x,y,knight?130:150,knight?"#ffe28b":"#9af4ff");
        burst(x,y,knight?"#ffce72":"#c7ffff",knight?14:22);
        heroVisual.attack=.22;
      }

      return result;
    };

    // Tatsächliche neue Turmprojektile für Schussimpulse erkennen.
    const originalUpdate=window.update;

    window.update=function(dt) {
      const previous=new Set(shots);
      const result=originalUpdate(dt);

      for(const shot of shots) {
        if(previous.has(shot))continue;

        let nearest=null;
        let distance=Infinity;

        for(const tower of towers) {
          if(tower.t!==shot.type)continue;
          const d=Math.hypot(tower.x-shot.x,tower.y-shot.y);
          if(d<distance) {
            distance=d;
            nearest=tower;
          }
        }

        if(nearest && distance<40) {
          nearest.artShotTime=performance.now();
        }
      }

      return result;
    };

    if(window.InkfallTowerArt) {
      const originalDraw=window.InkfallTowerArt.draw;

      window.InkfallTowerArt.draw=function(ctx,tower,selected,range) {
        const age=performance.now()-(tower.artShotTime||0);
        const pulse=!reducedMotion && speed>0 && age<140
          ? Math.sin(age/140*Math.PI)
          : 0;

        ctx.save();
        ctx.translate(0,-pulse*2.5);

        originalDraw(ctx,tower,selected,range);

        // Upgrade-Bänder: sichtbarer Ausbau ohne falsche neue Mechanik.
        ctx.strokeStyle="#ffe19b";
        ctx.lineWidth=2.5;
        ctx.lineCap="round";

        for(let i=0;i<Math.min(3,tower.lvl-1);i++) {
          ctx.beginPath();
          ctx.moveTo(tower.x-9,tower.y-i*4);
          ctx.lineTo(tower.x+8,tower.y-i*4);
          ctx.stroke();
        }

        ctx.restore();

        if(pulse>0) {
          ctx.save();
          ctx.globalAlpha=pulse*.55;
          circle(ctx,tower.x,tower.y-25,5,
            tower.t==="frost"?"#aefaff":"#ffe6a0");
          ctx.restore();
        }
      };
    }
  }

  window.InkfallCombatArt={renderHero,frame};

  // Erst nach Laden der bisherigen Spiel- und Grafikdateien verbinden.
  document.addEventListener("DOMContentLoaded",connectCombat);
})();
