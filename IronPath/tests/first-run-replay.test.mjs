import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createCoach, coachSeen, markCoachSeen } from '../first-run-coach.mjs';
import { trainingSeen, markTrainingSeen, forgetTrainingSeen, TRAINING_KEY } from '../training-run.mjs';
import { forgetGuideSeen, guideSeen, markGuideSeen } from '../first-run-guide.mjs';

// "FIELD TUTORIAL" in the Command Center used to mean "show me the cards again", and
// even that only worked on a live field. The player who asked for the tutorial wanted
// the first run: the training map, the contract, the cards, the guide - the thing they
// saw when they started the game. So the button now sets the seen markers back and
// lets the game deploy the contract again.
//
// Two things must never happen with that button, and both are tested here:
//   1. it must not hand out a second reward (no XP, no second dog tag);
//   2. it must not turn into a way to farm the first run by restarting it.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function memory(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: key => (Object.hasOwn(data, key) ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value); },
    removeItem: key => { delete data[key]; },
  };
}

function fakeDocument() {
  const nodes = new Map();
  const make = id => ({
    id, hidden: true, textContent: '', dataset: {}, style: {}, childElementCount: 0, children: [],
    addEventListener() {}, replaceChildren() { this.children = []; this.childElementCount = 0; },
    setAttribute(key, value) { this[key] = value; }, getAttribute() { return null; }, toggleAttribute() {},
  });
  for (const id of ['firstRunCoach', 'coachStep', 'coachTitle', 'coachText', 'coachCaption', 'coachAsk', 'coachNext', 'coachClose', 'coachPips', 'coachHighlight', 'coachRing']) nodes.set(id, make(id));
  return { getElementById: id => nodes.get(id) ?? null, createElement: () => make('i'), querySelectorAll: () => [] };
}

test('the coach can be forgotten, and then starts at the first card again', () => {
  const storage = memory();
  const document = fakeDocument();
  const coach = createCoach({ document, storage });
  assert.equal(coachSeen('soldier-a', storage), false, 'a fresh soldier has seen nothing');
  assert.equal(coach.start('soldier-a'), true);
  coach.stop();
  markCoachSeen('soldier-a', storage);
  assert.equal(coachSeen('soldier-a', storage), true, 'dismissed means dismissed');
  assert.equal(coach.start('soldier-a'), false, 'and it does not nag');

  // The replay path.
  assert.equal(coach.reset('soldier-a'), true);
  assert.equal(coachSeen('soldier-a', storage), false, 'the session forgot it');
  assert.equal(storage.getItem('ironpath:coach:v2:soldier-a'), null, 'and so did storage');
  assert.equal(coach.start('soldier-a'), true, 'the cards start again');
  assert.equal(document.getElementById('coachTitle').textContent, 'Welcome, soldier', 'at the first one');
});

test('the training contract can be forgotten, so startFirstRun deploys it again', () => {
  const storage = memory();
  assert.equal(trainingSeen('soldier-a', storage), false);
  markTrainingSeen('soldier-a', storage);
  assert.equal(trainingSeen('soldier-a', storage), true);
  assert.equal(forgetTrainingSeen('soldier-a', storage), true);
  assert.equal(trainingSeen('soldier-a', storage), false, 'a replay is a first run again');
  assert.equal(storage.getItem(`${TRAINING_KEY}:soldier-a`), null);
});

test('the four cards after the match are forgotten too', () => {
  const storage = memory();
  for (const id of ['rewards', 'equip', 'skills', 'workshop']) markGuideSeen(id, storage);
  assert.equal(guideSeen('rewards', storage), true);
  forgetGuideSeen('rewards', storage);
  assert.equal(guideSeen('rewards', storage), false, 'the replay starts the guide again');
  assert.equal(guideSeen('skills', storage), true, 'and only the one that was forgotten');
});

test('a replay pays no second reward, and the game says so', () => {
  // The reward branch is the whole honesty of this button: if the replay paid, a
  // player could restart the tutorial to farm XP and the dog tag.
  const game = readFileSync(resolve(root, 'game.js'), 'utf8');
  assert.match(game, /trainingRewards=true,/, 'a normal first run is paid');
  assert.match(game, /trainingRewards=rewards!==false/, 'and only an explicit replay turns it off');
  assert.match(game, /if\(trainingRewards\)Promise\.resolve\(account\.awardXP\(xp,/, 'the defeat payout is gated');
  assert.match(game, /if\(trainingRewards&&bonus>0/, 'and so is the completion bonus');
  assert.match(game, /This replay pays no XP/, 'the player is told, not left guessing');
  // The ending (dog tag popup, real armory, real skill tree) is not part of a replay.
  const account = readFileSync(resolve(root, 'account.js'), 'utf8');
  const replay = account.slice(account.indexOf('function replayFirstRun('), account.indexOf('function guide('));
  assert.doesNotMatch(replay, /endingKey|ENDING_KEY/, 'the ending marker is not cleared');
  assert.match(replay, /forgetGuideSeen/, 'but the four cards are');
});

test('the button starts the whole first run, not just the cards', () => {
  const game = readFileSync(resolve(root, 'game.js'), 'utf8');
  const replay = game.slice(game.indexOf('replayFirstRun:'), game.indexOf('// The Settings dialog owns the controls'));
  assert.match(replay, /forgetTrainingSeen\(id,tutorialStorage\)/, 'the contract is offered again');
  assert.match(replay, /coach\.reset\?\.\(id\)/, 'and the cards start at the first one');
  assert.match(replay, /startTrainingRun\(\{rewards:false,restart:true\}\)/, 'on the training map, without pay');
  // And a second tap has to work: while the first replay is still the active run,
  // `activeTraining` is true, so without `restart` the button silently did nothing.
  assert.match(game, /function startTrainingRun\(\{rewards=true,restart=false\}=\{\}\)\{/, 'the replay may replace a running training contract');
  assert.match(game, /if\(activeTraining&&!restart\)return false/, 'while a real deployment still refuses to be replaced');
  const account = readFileSync(resolve(root, 'account.js'), 'utf8');
  assert.match(account, /gameControl\?\.replayFirstRun\?\.\(\)/, 'reached through the game control');
  assert.match(account, /onResetFirstRun:\(\)=>replayFirstRun\(\)/, 'and wired to the Settings button');
});
