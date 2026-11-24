// Freunde im Spiel-Design: eigene Stadt mit Code, Einladung per Name oder Code, Anfragen, klappbare Freundesliste.
// Die Daten kommen aus cloud.js. Dieses Modul zeigt nur an und ruft Aktionen auf.
import * as cloud from './cloud.js?v=20261124-sitz13';

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** HTML für das Freunde-Fenster. info = { townName, level, coins, buildings }. */
export function friendsShell(info) {
  return `<div class="dlg-body friends">
    <h2 id="dlg-title">Freunde</h2>

    <section class="friends-me" aria-label="Deine Stadt">
      <p class="friends-town"><strong>${esc(info.townName)}</strong> · Level ${esc(info.level)}</p>
      <p class="small">🪙 ${esc(info.coins)} Münzen · 🏠 ${esc(info.buildings)} Gebäude</p>
      <div class="friends-code">
        <span>Dein Freundescode</span>
        <strong id="own-code" class="code-big">…</strong>
        <button type="button" class="ghost" id="copy-code" disabled>Kopieren</button>
      </div>
    </section>

    <section class="friends-invite" aria-label="Freund einladen">
      <h3>Freund einladen</h3>
      <form id="invite-form" class="invite-row" novalidate>
        <label class="sr-only" for="invite-q">Stadtname oder Freundescode</label>
        <input id="invite-q" name="q" maxlength="24" autocomplete="off" placeholder="Stadtname oder Code">
        <button type="submit" class="primary">Suchen</button>
      </form>
      <p id="invite-msg" class="warn small" role="alert"></p>
      <div id="invite-result"></div>
    </section>

    <section id="requests-section" class="friends-requests" hidden>
      <h3>Anfragen</h3>
      <ul id="requests" class="friend-list"></ul>
    </section>

    <details class="friend-fold" id="friend-fold" open>
      <summary>Freunde (<span id="friend-count">0</span>)</summary>
      <ul id="friend-list" class="friend-list"></ul>
      <p id="friend-empty" class="small muted">Noch keine Freunde. Lade jemanden mit Name oder Code ein.</p>
    </details>
  </div>`;
}

/**
 * Hängt die Funktionen an das geöffnete Fenster.
 * ctx: { me, myName(), info(), toast(msg, kind), confirm(title, text, opts) }
 * Liefert eine Funktion zum Abmelden aller Beobachter.
 */
export function mountFriends(dlg, ctx) {
  const $ = (sel) => dlg.querySelector(sel);
  const off = [];
  const profiles = new Map();
  let friendIds = [];
  let requestItems = [];
  let myFriendCount = 0;

  const showMsg = (text) => { $('#invite-msg').textContent = text; };

  // Eigener Code
  cloud.getOwnCode(ctx.me).then((code) => {
    $('#own-code').textContent = code;
    const btn = $('#copy-code');
    btn.disabled = false;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code);
        ctx.toast('Code kopiert.');
      } catch {
        ctx.toast(`Dein Code: ${code}`);
      }
    });
  }).catch((e) => {
    $('#own-code').textContent = '–';
    ctx.toast(e?.message ?? cloud.dbErrorDe(e), 'error');
  });

  // Einladen per Name oder Code
  $('#invite-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('#invite-q').value.trim();
    showMsg('');
    $('#invite-result').innerHTML = '';
    if (!q) return showMsg('Gib einen Stadtnamen oder einen Code ein.');
    let hit;
    try {
      hit = await cloud.findTown(q);
    } catch (err) {
      return showMsg(cloud.dbErrorDe(err));
    }
    if (!hit) return showMsg('Keine Stadt mit diesem Namen oder Code gefunden.');
    if (hit.uid === ctx.me) return showMsg('Das ist deine eigene Stadt.');
    if (friendIds.includes(hit.uid)) return showMsg('Ihr seid schon befreundet.');
    $('#invite-result').innerHTML = `<div class="friend-card">
      <div><strong>${esc(hit.profile.townName)}</strong><div class="small">Level ${esc(hit.profile.townLevel)}</div></div>
      <button type="button" class="primary" id="send-req">Anfrage senden</button>
    </div>`;
    $('#send-req').addEventListener('click', async (ev) => {
      ev.currentTarget.disabled = true;
      try {
        await cloud.sendFriendRequest(ctx.me, ctx.myName(), hit.uid);
        ctx.toast('Anfrage gesendet.');
        $('#invite-result').innerHTML = '';
        $('#invite-q').value = '';
      } catch (err) {
        ev.currentTarget.disabled = false;
        showMsg(cloud.dbErrorDe(err));
      }
    });
  });

  // Eingehende Anfragen
  off.push(cloud.watchRequests(ctx.me, (items) => {
    requestItems = items;
    renderRequests();
  }));

  function renderRequests() {
    const list = $('#requests');
    $('#requests-section').hidden = requestItems.length === 0;
    list.innerHTML = requestItems.map((r) => `<li class="friend-card" data-from="${esc(r.from)}">
      <div><strong>${esc(r.name)}</strong><div class="small">möchte dich als Freund hinzufügen</div></div>
      <div class="friend-actions">
        <button type="button" class="primary" data-act="accept">Annehmen</button>
        <button type="button" class="ghost" data-act="decline">Ablehnen</button>
      </div></li>`).join('');
  }

  $('#requests').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const from = btn.closest('li').dataset.from;
    btn.disabled = true;
    try {
      if (btn.dataset.act === 'accept') await cloud.acceptRequest(ctx.me, from);
      else await cloud.declineRequest(ctx.me, from);
    } catch (err) {
      btn.disabled = false;
      ctx.toast(cloud.dbErrorDe(err), 'error');
    }
  });

  // Freundesliste
  off.push(cloud.watchFriends(ctx.me, async (ids) => {
    friendIds = ids;
    myFriendCount = ids.length;
    for (const id of ids) {
      if (!profiles.has(id)) profiles.set(id, await cloud.loadProfile(id).catch(() => null));
    }
    renderFriends();
  }));

  function renderFriends() {
    $('#friend-count').textContent = String(myFriendCount);
    $('#friend-empty').hidden = myFriendCount > 0;
    $('#friend-list').innerHTML = friendIds.map((id) => {
      const p = profiles.get(id);
      const name = p?.townName ?? 'Unbekannte Stadt';
      const level = p?.townLevel ?? '?';
      return `<li class="friend-card" data-uid="${esc(id)}">
        <div><strong>${esc(name)}</strong><div class="small">Level ${esc(level)}</div></div>
        <div class="friend-actions">
          <button type="button" class="ghost" data-act="visit" disabled>Besuchen (folgt)</button>
          <button type="button" class="ghost" data-act="remove">Entfernen</button>
        </div></li>`;
    }).join('');
  }

  $('#friend-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act="remove"]');
    if (!btn) return;
    const id = btn.closest('li').dataset.uid;
    const name = profiles.get(id)?.townName ?? 'diese Stadt';
    const yes = await ctx.confirm('Freund entfernen?', `„${name}“ wird aus deiner Freundesliste entfernt.`, { ok: 'Ja, entfernen', danger: true });
    if (!yes) return;
    try {
      await cloud.removeFriend(ctx.me, id);
    } catch (err) {
      ctx.toast(cloud.dbErrorDe(err), 'error');
    }
  });

  return () => off.forEach((fn) => { try { fn(); } catch { /* schon abgemeldet */ } });
}
