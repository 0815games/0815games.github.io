import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { createTutorialDossier } from '../core/tutorial-dossier.mjs';
import { createCommandCenter } from '../core/command-center.mjs';

function makeDossierDocument({ mutateScrollOnOpen = false } = {}) {
  const nodes = new Map();
  const focusCalls = [];
  const ids = [
    'tutorialDossier', 'dossierKicker', 'dossierTitle', 'dossierLead', 'dossierRewardNote',
    'dossierAccept', 'dossierMenuTourOnly', 'dossierDecline', 'dossierClose',
    'dossierCardMissionTitle', 'dossierCardMissionText', 'dossierCardHqTitle', 'dossierCardHqText',
    'dossierRadioMute', 'dossierRadioReplay',
  ];
  for (const id of ids) {
    nodes.set(id, {
      id, hidden: false, disabled: false, open: false, textContent: '', dataset: {}, listeners: {},
      scrollTop: 0,
      showModal() {
        this.open = true;
        if (mutateScrollOnOpen && id === 'tutorialDossier') this.scrollTop = 360;
      },
      close() { this.open = false; },
      focus(opts) { focusCalls.push(opts ?? null); },
      setAttribute() {},
      addEventListener(evt, fn) { this.listeners[evt] = fn; },
    });
  }
  const bodyEl = { className: 'dossier-body', scrollTop: 0 };
  const dialog = nodes.get('tutorialDossier');
  dialog.querySelector = sel => (sel === '.dossier-body' ? bodyEl : null);
  return { getElementById: id => nodes.get(id) ?? null, nodes, bodyEl, focusCalls };
}

test('tutorialDossier supports offer, resume, and replay modes with proper buttons & rewards notice', async () => {
  const doc = makeDossierDocument();
  const calls = [];
  const radio = {
    played: [],
    snapshot: () => ({ voiceOver: true }),
    play: id => { radio.played.push(id); return true; },
    stop() {},
    replay() { return true; },
    toggleMute() { return false; },
  };
  const dossier = createTutorialDossier({
    document: doc,
    radio,
    onAccept: mode => calls.push(['accept', mode]),
    onDecline: mode => calls.push(['decline', mode]),
    onReplayMenuOnly: () => calls.push(['menuOnly']),
  });

  // 1. Offer mode: rewards notice visible, close & menuOnly hidden, Escape prevented
  dossier.open({ mode: 'offer', rewarded: false });
  assert.equal(dossier.isOpen(), true);
  assert.equal(doc.nodes.get('dossierClose').hidden, true);
  assert.equal(doc.nodes.get('dossierMenuTourOnly').hidden, true);
  assert.equal(doc.nodes.get('dossierDecline').hidden, false);
  assert.match(doc.nodes.get('dossierRewardNote').textContent, /450 XP/);
  assert.equal(radio.played.at(-1), 'dossier-offer');

  let prevented = false;
  doc.nodes.get('tutorialDossier').listeners.cancel({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(dossier.isOpen(), true, 'initial offer cannot be Escape-aborted silently');

  // Accept closes dossier and invokes handler
  doc.nodes.get('dossierAccept').onclick();
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(calls.at(-1), ['accept', 'offer']);
  assert.equal(dossier.isOpen(), false);

  // 2. Replay mode: no reward notice, shows both replay mission and menu-tour-only button
  dossier.open({ mode: 'replay', rewarded: true });
  assert.equal(doc.nodes.get('dossierClose').hidden, false);
  assert.equal(doc.nodes.get('dossierMenuTourOnly').hidden, false);
  assert.equal(doc.nodes.get('dossierDecline').hidden, true);
  assert.match(doc.nodes.get('dossierRewardNote').textContent, /already claimed/i);

  doc.nodes.get('dossierMenuTourOnly').onclick();
  await new Promise(r => setTimeout(r, 10));
  assert.deepEqual(calls.at(-1), ['menuOnly']);
  assert.equal(dossier.isOpen(), false);
});

test('tutorialDossier resets scrollTop to top across dialog and .dossier-body and pins banner/actions in markup & CSS', () => {
  const doc = makeDossierDocument({ mutateScrollOnOpen: true });
  doc.nodes.get('tutorialDossier').scrollTop = 280;
  doc.bodyEl.scrollTop = 420;
  const radio = {
    snapshot: () => ({ voiceOver: true }),
    play: () => {
      doc.nodes.get('tutorialDossier').scrollTop = 190;
      doc.bodyEl.scrollTop = 140;
      return true;
    },
    stop() {},
    replay() { return true; },
    toggleMute() { return false; },
  };
  const dossier = createTutorialDossier({ document: doc, radio });
  dossier.open({ mode: 'offer', rewarded: false });

  assert.equal(doc.nodes.get('tutorialDossier').scrollTop, 0, 'dialog scrollTop stays at 0 after open/radio');
  assert.equal(doc.bodyEl.scrollTop, 0, '.dossier-body scrollTop resets to 0 on open');
  assert.deepEqual(doc.focusCalls.at(-1), { preventScroll: true }, 'focus uses preventScroll so mobile browsers never jump down');

  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const dossierHtml = html.slice(html.indexOf('id="tutorialDossier"'), html.indexOf('</dialog>', html.indexOf('id="tutorialDossier"')));
  assert.match(dossierHtml, /id="tutorialDossier"[^>]*tabindex="-1"/);
  const bodyIdx = dossierHtml.indexOf('class="dossier-body"');
  const actionsIdx = dossierHtml.indexOf('class="dossier-actions"');
  const bodyCloseIdx = dossierHtml.lastIndexOf('</div>', actionsIdx);
  assert.ok(bodyIdx > 0 && actionsIdx > bodyCloseIdx, '.dossier-actions is pinned as a sibling footer outside .dossier-body');

  const menuCss = readFileSync(new URL('../menu-redesign.css', import.meta.url), 'utf8');
  assert.match(menuCss, /dialog#tutorialDossier\[open\]\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*overflow:\s*hidden;/);
  assert.match(menuCss, /#tutorialDossier\s+\.dossier-body\s*\{[^}]*flex:\s*1\s+1\s+auto;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto;/);
  assert.match(menuCss, /#tutorialDossier\s+\.dossier-actions\s*\{[^}]*flex:\s*0\s+0\s+auto;/);
  assert.match(menuCss, /#tutorialDossier\s+\.dossier-radio\s+\.general-radio-sub\s*\{[^}]*max-height:\s*none;[^}]*overflow:\s*visible;/);
  assert.match(menuCss, /@media\s*\(max-width:\s*859px\)[\s\S]*dialog#tutorialDossier\[open\]\s*\{[^}]*height:\s*100dvh;/);
});

test('commandCenter routes #menuTutorial through onTutorial dossier hook when provided', () => {
  const nodes = new Map();
  const el = id => {
    if (!nodes.has(id)) nodes.set(id, { id, hidden: false, dataset: {}, textContent: '', value: 0, max: 0, src: '', onclick: null });
    return nodes.get(id);
  };
  let dossierOpened = 0;
  let fallbackCalled = 0;
  const cc = createCommandCenter({
    document: { getElementById: el },
    getProfile: () => ({ name: 'Alex', gender: 'female', xp: 450 }),
    getGame: () => ({ setMenuOpen() {}, getRunSummary: () => null, hasResults: () => false, replayFirstRun: () => { fallbackCalled++; return true; }, showTutorial: () => { fallbackCalled++; } }),
    isPartyActive: () => false,
    openParty() {},
    signOut() {},
    onTutorial: () => { dossierOpened++; },
  });
  cc.showMenu();
  el('menuTutorial').onclick();
  assert.equal(dossierOpened, 1);
  assert.equal(fallbackCalled, 0);
});
