import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createTutorialDossier } from '../tutorial-dossier.mjs';
import { createCommandCenter } from '../command-center.mjs';

function makeDossierDocument() {
  const nodes = new Map();
  const ids = [
    'tutorialDossier', 'dossierKicker', 'dossierTitle', 'dossierLead', 'dossierRewardNote',
    'dossierAccept', 'dossierMenuTourOnly', 'dossierDecline', 'dossierClose',
    'dossierCardMissionTitle', 'dossierCardMissionText', 'dossierCardHqTitle', 'dossierCardHqText',
    'dossierRadioMute', 'dossierRadioReplay',
  ];
  for (const id of ids) {
    nodes.set(id, {
      id, hidden: false, disabled: false, open: false, textContent: '', dataset: {}, listeners: {},
      showModal() { this.open = true; },
      close() { this.open = false; },
      setAttribute() {},
      addEventListener(evt, fn) { this.listeners[evt] = fn; },
    });
  }
  return { getElementById: id => nodes.get(id) ?? null, nodes };
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
