// 2026-10-01 11:31 CEST: Erster spielbarer Auftragsablauf mit einfacher Canvas-Probefahrt; 3D-Rendering folgt separat.
(() => {
  'use strict';
  const canvas = document.querySelector('#scene');
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const buttons = { diagnose: $('diagnose'), repair: $('repair'), drive: $('drive'), reset: $('reset') };
  const keys = new Set();
  const state = { phase: 'intake', x: 0, speed: 0, distance: 0, last: 0 };
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * ratio);
    canvas.height = Math.round(bounds.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function setPhase(phase, status, instruction) {
    state.phase = phase;
    $('status').textContent = status;
    $('instruction').textContent = instruction;
    $('mode').textContent = phase === 'drive' || phase === 'done' ? 'Teststrecke' : 'Werkstatt';
    buttons.diagnose.disabled = phase !== 'intake';
    buttons.repair.disabled = phase !== 'diagnosed';
    buttons.drive.disabled = phase !== 'repaired';
  }
  buttons.diagnose.addEventListener('click', () => setPhase('diagnosed', 'Fehler gefunden', 'Bremse vorne rechts: Belag verschlissen. Führe die Reparatur durch.'));
  buttons.repair.addEventListener('click', () => setPhase('repaired', 'Reparatur abgeschlossen', 'Starte die Probefahrt und fahre 300 Meter.'));
  buttons.drive.addEventListener('click', () => { state.x = 0; state.speed = 0; state.distance = 0; setPhase('drive', 'Probefahrt läuft', 'Fahre 300 Meter. Bleibe auf der Straße.'); });
  buttons.reset.addEventListener('click', () => { state.x = 0; state.speed = 0; state.distance = 0; keys.clear(); setPhase('intake', 'Fahrzeug angenommen', 'Das Fahrzeug zieht beim Bremsen nach rechts. Starte mit der Diagnose.'); });
  const controls = new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']);
  window.addEventListener('keydown', (event) => { const key = event.key.toLowerCase(); if (controls.has(key) && state.phase === 'drive') { event.preventDefault(); keys.add(key); } });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());
  function loop(time) {
    const dt = Math.min((time - (state.last || time)) / 1000, 0.05);
    state.last = time;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    if (state.phase === 'drive' || state.phase === 'done') {
      if (state.phase === 'drive') {
        const accelerate = keys.has('w') || keys.has('arrowup');
        const brake = keys.has('s') || keys.has('arrowdown');
        state.speed = Math.max(0, Math.min(28, state.speed + (accelerate ? 12 : brake ? -22 : -5) * dt));
        const steer = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
        state.x = Math.max(-1.6, Math.min(1.6, state.x + steer * dt * (0.5 + state.speed / 18)));
        if (Math.abs(state.x) > 0.95) state.speed = Math.max(0, state.speed - 20 * dt);
        state.distance += state.speed * dt;
        if (state.distance >= 300) { state.speed = 0; setPhase('done', 'Auftrag abgeschlossen', 'Probefahrt bestanden: 300 Meter gefahren.'); }
      }
      ctx.fillStyle = '#2d5946'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#414b58'; ctx.fillRect(w * .22, 0, w * .56, h);
      ctx.strokeStyle = '#f5df95'; ctx.lineWidth = 4; ctx.setLineDash([22, 22]); ctx.lineDashOffset = -(state.distance * 4) % 44;
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke(); ctx.setLineDash([]);
      drawCar(w / 2 + state.x * w * .19, h * .7, Math.min(w * .13, 65), Math.min(h * .28, 110));
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.fillText(`${Math.round(state.speed * 3.6)} km/h · ${Math.min(300, Math.floor(state.distance))} / 300 m`, 18, 28);
    } else {
      ctx.fillStyle = '#293c50'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#344d63'; ctx.fillRect(w * .12, h * .13, w * .76, h * .74);
      ctx.strokeStyle = '#5cdbbd'; ctx.lineWidth = 4; ctx.strokeRect(w * .25, h * .19, w * .5, h * .6);
      drawCar(w / 2, h / 2, Math.min(w * .25, 150), Math.min(h * .46, 190));
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.fillText('WERKSTATT', 18, 28);
    }
    requestAnimationFrame(loop);
  }
  function drawCar(x, y, width, height) {
    ctx.fillStyle = '#060b12';
    ctx.fillRect(x - width * .58, y - height * .34, width * 1.16, height * .2);
    ctx.fillRect(x - width * .58, y + height * .2, width * 1.16, height * .2);
    ctx.fillStyle = '#e35851'; ctx.fillRect(x - width / 2, y - height / 2, width, height);
    ctx.fillStyle = '#9ccbd8'; ctx.fillRect(x - width * .37, y - height * .2, width * .74, height * .32);
    ctx.fillStyle = '#f7eece'; ctx.fillRect(x - width * .38, y - height * .47, width * .2, 5); ctx.fillRect(x + width * .18, y - height * .47, width * .2, 5);
  }
  window.addEventListener('resize', resize);
  resize(); requestAnimationFrame(loop);
})();