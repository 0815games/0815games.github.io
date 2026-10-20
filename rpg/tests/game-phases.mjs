import assert from 'node:assert/strict';
import { PHASES, canTransition, createPhaseController } from '../js/systems/game-phases.js';

const controller = createPhaseController();
assert.equal(controller.current, PHASES.MENU);
assert.equal(controller.is(PHASES.MENU), true);

assert.equal(canTransition(PHASES.MENU, PHASES.EXPLORE), true);
assert.equal(canTransition(PHASES.EXPLORE, PHASES.COMBAT), true);
assert.equal(canTransition(PHASES.EXPLORE, PHASES.FLOOR_TRANSITION), true);
assert.equal(canTransition(PHASES.EXPLORE, PHASES.DEATH), true);
assert.equal(canTransition(PHASES.COMBAT, PHASES.REWARD), true);
assert.equal(canTransition(PHASES.COMBAT, PHASES.DEATH), true);
assert.equal(canTransition(PHASES.COMBAT, PHASES.EXPLORE), true);
assert.equal(canTransition(PHASES.REWARD, PHASES.EXPLORE), true);
assert.equal(canTransition(PHASES.REWARD, PHASES.PREPARATION), true);
assert.equal(canTransition(PHASES.REWARD, PHASES.FLOOR_TRANSITION), true);
assert.equal(canTransition(PHASES.DEATH, PHASES.PREPARATION), true);
assert.equal(canTransition(PHASES.DEATH, PHASES.MENU), true);
assert.equal(canTransition(PHASES.PREPARATION, PHASES.EXPLORE), true);
assert.equal(canTransition(PHASES.FLOOR_TRANSITION, PHASES.EXPLORE), true);

const forbidden = [
  [PHASES.MENU, PHASES.COMBAT],
  [PHASES.MENU, PHASES.DEATH],
  [PHASES.EXPLORE, PHASES.PREPARATION],
  [PHASES.COMBAT, PHASES.PREPARATION],
  [PHASES.DEATH, PHASES.EXPLORE],
  [PHASES.PREPARATION, PHASES.COMBAT],
  [PHASES.FLOOR_TRANSITION, PHASES.COMBAT]
];
for (const [from, to] of forbidden) {
  assert.equal(canTransition(from, to), false, `${from} → ${to} darf nicht erlaubt sein`);
}

assert.throws(() => controller.transition(PHASES.COMBAT));
assert.equal(controller.current, PHASES.MENU);

controller.transition(PHASES.EXPLORE);
assert.equal(controller.current, PHASES.EXPLORE);
controller.transition(PHASES.COMBAT);
assert.equal(controller.current, PHASES.COMBAT);
controller.transition(PHASES.REWARD);
assert.equal(controller.current, PHASES.REWARD);
controller.transition(PHASES.PREPARATION);
assert.equal(controller.current, PHASES.PREPARATION);
controller.transition(PHASES.EXPLORE);
assert.equal(controller.current, PHASES.EXPLORE);

assert.throws(() => createPhaseController('invalid'));

console.log('game-phases: alle Prüfungen bestanden.');
