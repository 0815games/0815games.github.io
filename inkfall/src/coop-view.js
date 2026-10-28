(function(root, factory) {
  'use strict';
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.InkfallCoopView = api;
    api.mount(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  function createViewModel(session, uid, presence) {
    if (
      !session ||
      session.schemaVersion !== 1 ||
      typeof session.id !== 'string' ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(session.id) ||
      !/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(session.roomCode) ||
      ![
        'preparation', 'running', 'paused', 'won', 'lost', 'closed'
      ].includes(session.phase)
    ) {
      throw new Error('Ungültige Coop-Sitzung.');
    }

    const source = ['host', 'guest'].map(slot => ({
      ...session.players?.[slot],
      slot
    }));

    if (
      !source[0].uid ||
      !source[1].uid ||
      source[0].uid === source[1].uid ||
      source[0].uid !== session.hostUid ||
      !source.some(player => player.uid === uid)
    ) {
      throw new Error('Du gehörst nicht zu dieser Coop-Sitzung.');
    }

    const players = source.map(player => {
      if (
        !['knight', 'mage'].includes(player.heroClass) ||
        typeof player.heroName !== 'string' ||
        player.heroName.trim().length < 3 ||
        player.heroName.trim().length > 20 ||
        /[\u0000-\u001f\u007f]/.test(player.heroName) ||
        !Number.isFinite(player.x) ||
        player.x < 0 || player.x > 940 ||
        !Number.isFinite(player.y) ||
        player.y < 0 || player.y > 600
      ) {
        throw new Error('Ungültige Heldendaten.');
      }

      const live = presence
        ? presence[player.slot]?.online
        : player.online;

      return {
        slot: player.slot,
        uid: player.uid,
        heroClass: player.heroClass,
        heroName: player.heroName.trim(),
        x: player.x,
        y: player.y,
        isLocal: player.uid === uid,
        online: live === true
      };
    });

    return {
      id: session.id,
      roomCode: session.roomCode,
      phase: session.phase,
      players
    };
  }

  function mount(root) {
    const doc = root.document;
    const frame = doc?.getElementById('inkfall-window');

    if (!frame || doc.getElementById('if-coop-view')) return;

    const layer = doc.createElement('section');
    layer.id = 'if-coop-view';
    layer.hidden = true;
    layer.setAttribute('aria-label', 'Gemeinsame Coop-Kartenansicht');

    layer.innerHTML = `
      <header>
        <div>
          <strong>Coop · Gemeinsame Bastion</strong>
          <div id="if-coop-session-label"></div>
        </div>
        <button type="button" id="if-coop-view-back">Zur Lobby</button>
      </header>
      <div id="if-coop-roster"></div>
      <div id="if-coop-map-stage">
        <canvas id="if-coop-canvas" width="940" height="600"
          role="img" aria-label="Coop-Karte mit beiden Helden"></canvas>
      </div>
      <p id="if-coop-view-status" role="status"></p>
    `;

    const style = doc.createElement('style');
    style.textContent = `
      #if-coop-view {
        box-sizing:border-box;
        position:absolute;
        inset:0;
        z-index:196;
        display:flex;
        flex-direction:column;
        gap:8px;
        padding:12px;
        background:#202d48;
        color:#fff1da;
        overflow:hidden;
      }
      #if-coop-view[hidden] { display:none; }
      #if-coop-view header {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        flex-shrink:0;
      }
      #if-coop-view button {
        width:auto;
        min-height:44px;
        margin:0;
        padding:8px 12px;
        border:2px solid #182141;
        border-radius:10px;
        background:linear-gradient(#fff3d1,#e7cc94);
        color:#302c43;
        font:800 12px system-ui;
        cursor:pointer;
      }
      #if-coop-session-label {
        font:11px system-ui;
        overflow-wrap:anywhere;
      }
      #if-coop-roster {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        flex-shrink:0;
      }
      #if-coop-roster span {
        padding:7px 10px;
        border:2px solid #80e6ed;
        border-radius:9px;
        font:800 12px system-ui;
        overflow-wrap:anywhere;
      }
      #if-coop-roster span[data-local="true"] {
        border-color:#ffe36a;
      }
      #if-coop-map-stage {
        flex:1;
        min-height:0;
        min-width:0;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
      }
      #if-coop-canvas {
        display:block;
        flex:none;
        border:2px solid #182141;
        border-radius:10px;
        max-width:100%;
        max-height:100%;
        box-sizing:border-box;
      }
      #if-coop-view-status {
        margin:0;
        font:12px/1.4 system-ui;
        flex-shrink:0;
      }
      @media(max-width:650px) {
        #if-coop-view { padding:8px; gap:6px; }
        #if-coop-roster span {
          font-size:11px;
          padding:5px 7px;
        }
      }
    `;

    doc.head.append(style);
    frame.append(layer);

    const canvas = layer.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const stage = layer.querySelector('#if-coop-map-stage');
    const status = layer.querySelector('#if-coop-view-status');
    const roster = layer.querySelector('#if-coop-roster');


    const resumeButton = doc.createElement('button');
    resumeButton.type = 'button';
    resumeButton.hidden = true;
    layer.querySelector('header').append(resumeButton);

    function updateMovementStatus() {
      if (layer.hidden) return;

      const runtime = root.InkfallCoopRuntime.getActive();
      const state = runtime?.status();

      resumeButton.hidden = true;
      resumeButton.disabled = false;

      if (!state) {
        status.textContent = 'Coop-Bewegung wird vorbereitet …';
        return;
      }

      if (state.error) {
        status.textContent = 'Bewegungsfehler: ' + state.error;
        resumeButton.textContent = 'Erneut versuchen';
        resumeButton.hidden = false;
        return;
      }

      if (!state.connected) {
        status.textContent = 'Verbindung unterbrochen. Bewegung gesperrt.';
        return;
      }

      if (state.paused) {
        status.textContent =
          'Bewegung pausiert. Nach dem Fortsetzen ist ein neuer Klick nötig.';

        if (state.isHost && state.owner) {
          resumeButton.textContent = 'Bewegung fortsetzen';
          resumeButton.hidden = false;
        } else if (state.isHost) {
          status.textContent += ' Ein anderer Host-Tab ist zuständig.';
        } else {
          status.textContent += ' Der Host kann fortsetzen.';
        }
        return;
      }

      status.textContent = state.canSend
        ? 'Klicke auf die Karte, um deinen Helden zu bewegen. Kampf ist noch deaktiviert.'
        : 'Warte auf den Host und die Verbindung beider Spieler …';
    }

    resumeButton.onclick = async () => {
      const runtime = root.InkfallCoopRuntime.getActive();
      if (!runtime) return;

      resumeButton.disabled = true;
      try {
        if (runtime.status().error) await runtime.retry();
        else await runtime.resume();
      } catch (error) {
        root.inkfallNotify?.(error.message, 'error');
      } finally {
        updateMovementStatus();
      }
    };

    root.addEventListener(
      'inkfall:coop-movement-status',
      updateMovementStatus
    );

    canvas.addEventListener('click', async event => {
      const runtime = root.InkfallCoopRuntime.getActive();
      if (!runtime) return;

      try {
        const rect = canvas.getBoundingClientRect();
        const css = root.getComputedStyle(canvas);
        const number = name => parseFloat(css[name]) || 0;

        const leftInset =
          number('borderLeftWidth') + number('paddingLeft');
        const rightInset =
          number('borderRightWidth') + number('paddingRight');
        const topInset =
          number('borderTopWidth') + number('paddingTop');
        const bottomInset =
          number('borderBottomWidth') + number('paddingBottom');

        const point = root.InkfallCoopCommands.mapPoint(
          event.clientX, event.clientY, {
            left: rect.left + leftInset,
            top: rect.top + topInset,
            width: rect.width - leftInset - rightInset,
            height: rect.height - topInset - bottomInset
          }
        );

        await runtime.sendTarget(point.x, point.y);
      } catch (error) {
        root.inkfallNotify?.(error.message, 'error');
      }
    });

    let model = null;
    let reference = null;
    let listener = null;

    const images = {};
    const groundPath = [
      [40,70],[280,70],[280,240],[600,240],
      [600,430],[850,430],[850,540]
    ];
    const airPath = [
      [40,30],[300,30],[300,150],[640,150],
      [640,330],[880,330],[880,540]
    ];

    function currentUid() {
      return typeof auth !== 'undefined'
        ? auth.currentUser?.uid
        : null;
    }

    function fit() {
      if (layer.hidden) return;

      const scale = Math.max(0, Math.min(
        (stage.clientWidth - 4) / 940,
        (stage.clientHeight - 4) / 600
      ));

      canvas.style.width = Math.floor(940 * scale) + 'px';
      canvas.style.height = Math.floor(600 * scale) + 'px';
    }

    function draw() {
      if (!model || layer.hidden || !ctx) return;

      ctx.clearRect(0, 0, 940, 600);

      if (root.InkfallWorld) {
        root.InkfallWorld.background(ctx, 940, 600, groundPath);
        root.InkfallWorld.drawPath(ctx, groundPath, false);
        root.InkfallWorld.drawPath(ctx, airPath, true);
        root.InkfallWorld.bastion(ctx, 850, 540);
      } else {
        ctx.fillStyle = '#86c66a';
        ctx.fillRect(0, 0, 940, 600);
      }

      for (const player of model.players) {
        ctx.save();
        ctx.strokeStyle = player.isLocal ? '#ffe36a' : '#80e6ed';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(
          player.x, player.y + 10, 22, 9, 0, 0, Math.PI * 2
        );
        ctx.stroke();

        const image = images[player.heroClass];

        if (image?.complete && image.naturalWidth) {
          ctx.drawImage(
            image, player.x - 27, player.y - 60, 54, 76
          );
        } else {
          ctx.fillStyle = player.heroClass === 'knight'
            ? '#61cbd2'
            : '#9271d3';
          ctx.beginPath();
          ctx.arc(player.x, player.y - 15, 16, 0, Math.PI * 2);
          ctx.fill();
        }

        const text = player.heroName +
          (player.isLocal ? ' · Du' : ' · Partner');

        ctx.font = '800 13px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const width = Math.min(
          270, ctx.measureText(text).width + 18
        );
        const x = Math.max(
          width / 2 + 3,
          Math.min(940 - width / 2 - 3, player.x)
        );
        const y = Math.max(
          14, player.y - (player.slot === 'host' ? 78 : 106)
        );

        ctx.fillStyle = '#202d48';
        ctx.fillRect(x - width / 2, y - 11, width, 22);
        ctx.fillStyle = player.isLocal ? '#ffe36a' : '#e2fcff';
        ctx.fillText(text, x, y, width - 10);
        ctx.restore();
      }
    }

    function paint() {
      layer.querySelector('#if-coop-session-label').textContent =
        'Sitzung ' + model.id;

      roster.replaceChildren();

      for (const player of model.players) {
        const badge = doc.createElement('span');
        badge.dataset.local = String(player.isLocal);
        badge.textContent =
          player.heroName + ' · ' +
          (player.heroClass === 'mage' ? 'Elementarmagier' : 'Ritter') +
          (player.isLocal ? ' · Du' : ' · Partner') +
          (player.online ? '' : ' · Offline');
        roster.append(badge);
      }

      updateMovementStatus();

      fit();
      draw();
    }

    function detach() {
      if (reference && listener) {
        reference.off('value', listener);
      }
      reference = null;
      listener = null;
    }

    function close() {
      detach();
      layer.hidden = true;
      model = null;
    }

    function open(session) {
      try {
        const uid = currentUid();
        if (!uid) throw new Error('Bitte zuerst anmelden.');

        const next = createViewModel(session, uid);
        if (next.phase === 'closed') {
          throw new Error('Diese Sitzung ist geschlossen.');
        }

        const same = model?.id === next.id && reference;
        model = next;
        layer.hidden = false;
        paint();

        if (same) return;

        detach();
        reference = db.ref('rooms/' + next.roomCode);
        const watched = reference;

        listener = snapshot => {
          if (reference !== watched) return;

          const room = snapshot.val();

          if (
            !room?.session ||
            room.session.id !== next.id ||
            !room.host ||
            !room.guest ||
            currentUid() !== uid
          ) {
            close();
            return;
          }

          try {
            const visibleSession = root.InkfallCoopRuntime.project(
              room.session, room.movement
            );
            model = createViewModel(visibleSession, uid, {
              host: room.host,
              guest: room.guest
            });

            if (model.phase === 'closed') {
              close();
              return;
            }

            paint();
          } catch (error) {
            close();
            root.inkfallNotify?.(error.message, 'error');
          }
        };

        reference.on('value', listener, error => {
          if (reference === watched) {
            close();
            root.inkfallNotify?.(
              'Coop-Karte: ' + error.message,
              'error'
            );
          }
        });
      } catch (error) {
        close();
        root.inkfallNotify?.(error.message, 'error');
      }
    }

    for (const id of ['knight', 'mage']) {
      const image = new root.Image();
      images[id] = image;
      image.onload = draw;
      image.onerror = draw;
      image.src = 'assets/art/heroes/' + id + '.svg';
    }

    layer.querySelector('#if-coop-view-back').onclick = close;

    root.addEventListener(
      'inkfall:coop-session',
      event => open(event.detail)
    );
    root.addEventListener('inkfall:coop-session-cleared', close);

    layer.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    });

    if (root.ResizeObserver) {
      new root.ResizeObserver(fit).observe(stage);
    } else {
      root.addEventListener('resize', fit);
    }

    function addOpenButton() {
      const lobby = doc.getElementById('if-online-lobby');

      if (
        !root.inkfallActiveCoopSession ||
        lobby?.querySelector('#if-open-coop-map')
      ) return;

      const footer = lobby?.querySelector('.if-pregame-footer');
      if (!footer) return;

      const button = doc.createElement('button');
      button.id = 'if-open-coop-map';
      button.className = 'if-pregame-button';
      button.type = 'button';
      button.textContent = 'Coop-Karte ansehen';
      button.onclick = () => open(root.inkfallActiveCoopSession);
      footer.append(button);
    }

    const lobby = doc.getElementById('if-online-lobby');
    if (lobby) {
      new root.MutationObserver(addOpenButton).observe(lobby, {
        childList: true,
        subtree: true
      });
    }

    if (typeof auth !== 'undefined') {
      auth.onAuthStateChanged(user => {
        if (
          !user ||
          (model && !model.players.some(player => player.uid === user.uid))
        ) close();
      });
    }

    addOpenButton();

    if (root.inkfallActiveCoopSession) {
      open(root.inkfallActiveCoopSession);
    }
  }

  return Object.freeze({ createViewModel, mount });
});
