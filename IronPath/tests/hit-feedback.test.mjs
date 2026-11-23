import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {hitFeedbackForEvent, createHitAnnouncer, HIT_ANNOUNCE_COOLDOWN_MS} from '../core/hit-feedback.mjs';
import {createCombatEffects} from '../core/combat-fx.mjs';
import {COACH_STEPS} from '../ui/first-run-coach.mjs';

// Block E, Scheibe 2 (E2): Treffer-Feedback erklärt, wer getroffen wurde und
// wie man reagiert – gedrosselt, alarmiert bei Ausfall, nie ein Schadensentscheid.

test('a soldier hit names the counter-move and carries the damage', () => {
  const own = hitFeedbackForEvent({type: 'enemyAttack', target: 'soldier', playerId: 'local', damage: 3}, 'local');
  assert.equal(own.kind, 'soldierHit');
  assert.equal(own.fx, 'soldierHit');
  assert.deepEqual(own.params, {damage: 3});
  assert.match(own.message, /Step out of/);
  const ally = hitFeedbackForEvent({type: 'enemyAttack', target: 'soldier', playerId: 'peer', damage: 3}, 'local');
  assert.match(ally.message, /teammate is under fire/i);
  assert.equal(ally.key, 'soldier:peer', 'announcements throttle per soldier');
});

test('a tower hit points at the repair, and disabling is an alarm', () => {
  const hit = hitFeedbackForEvent({type: 'enemyAttack', target: 'tower', pad: 2, damage: 4}, 'local');
  assert.equal(hit.kind, 'towerHit');
  assert.match(hit.message, /Repair it from its panel/);
  const down = hitFeedbackForEvent({type: 'towerDisabled', pad: 2}, 'local');
  assert.equal(down.severity, 'alert');
  assert.match(down.message, /stays on its pad/);
});

test('falling is explained as temporary, returning only announces the owner', () => {
  const down = hitFeedbackForEvent({type: 'soldierDown', playerId: 'local', seconds: 8}, 'local');
  assert.equal(down.severity, 'alert');
  assert.deepEqual(down.params, {seconds: 8});
  assert.match(down.message, /No penalty/);
  assert.equal(hitFeedbackForEvent({type: 'soldierReturn', playerId: 'local'}, 'local').kind, 'soldierReturn');
  assert.equal(hitFeedbackForEvent({type: 'soldierReturn', playerId: 'peer'}, 'local'), null, 'a teammate returning is not radio noise');
  assert.equal(hitFeedbackForEvent({type: 'towerRepaired', pad: 1}, 'local').severity, 'info');
});

test('unrelated or malformed events stay silent', () => {
  assert.equal(hitFeedbackForEvent(null, 'local'), null);
  assert.equal(hitFeedbackForEvent({type: 'waveCleared'}, 'local'), null);
  assert.equal(hitFeedbackForEvent({type: 'enemyAttack', target: 'bunker', damage: 5}, 'local'), null, 'the bunker keeps its own warning path');
});

test('the announcer throttles repeat hits but never an alarm', () => {
  let now = 1000;
  const announcer = createHitAnnouncer({clock: () => now});
  const hit = hitFeedbackForEvent({type: 'enemyAttack', target: 'tower', pad: 0, damage: 4}, 'local');
  assert.equal(announcer.shouldAnnounce(hit), true);
  assert.equal(announcer.shouldAnnounce(hit), false, 'the same tower under fire does not flood the radio');
  now += HIT_ANNOUNCE_COOLDOWN_MS;
  assert.equal(announcer.shouldAnnounce(hit), true, 'after the cooldown it speaks again');
  const down = hitFeedbackForEvent({type: 'towerDisabled', pad: 0}, 'local');
  assert.equal(announcer.shouldAnnounce(down), true, 'an alarm is never throttled');
  announcer.reset();
  assert.equal(announcer.shouldAnnounce(hit), true, 'a fresh run speaks again');
});

test('snapshot diffs flash landed hits for co-op guests without replaying on join', () => {
  let now = 0;
  const fx = createCombatEffects({clock: () => now});
  const view = (soldierHp, towerHp) => ({
    players: {peer: {x: 10, y: 10, hp: soldierHp, cooldown: 0}},
    towers: [{id: 1, pad: 0, hp: towerHp}],
    enemies: [],
  });
  const pads = [{x: 50, y: 60}];
  fx.observe(view(100, 160), pads);
  const changes = fx.observe(view(97, 156), pads);
  assert.ok(changes.includes('soldierHit') && changes.includes('towerHit'));
  const effects = fx.active();
  assert.equal(effects.find(e => e.kind === 'soldierHit').label, '−3');
  assert.equal(effects.find(e => e.kind === 'towerHit').label, '−4');
  assert.deepEqual(fx.observe(view(97, 156), pads), [], 'an unchanged snapshot does not re-flash');
});

test('the tutorial coach introduces the damage system before supplies', () => {
  const ids = COACH_STEPS.map(s => s.id);
  const step = COACH_STEPS.find(s => s.id === 'under-fire');
  assert.ok(step, 'the damage system has its own coach card');
  assert.equal(step.when, null, 'the card explains, it never gates the training contract');
  assert.ok(ids.indexOf('under-fire') > ids.indexOf('hero') && ids.indexOf('under-fire') < ids.indexOf('money'));
  assert.match(step.text, /dashed ring/);
  assert.match(step.text, /return at the bunker/);
});
