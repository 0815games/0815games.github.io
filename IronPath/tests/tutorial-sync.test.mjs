import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  TUTORIAL_EDITION,
  initialOfferedTutorial,
  sanitizeTutorialRecord,
  shouldAutoPresentTutorial,
  tutorialResumeTarget,
  shouldPayTutorialReward,
  applyTutorialRewardProfile,
  createTutorialSync,
} from '../core/tutorial-sync.mjs';

test('initialOfferedTutorial emits schema-compliant record for new recruits', () => {
  const rec = initialOfferedTutorial();
  assert.deepEqual(rec, {
    edition: TUTORIAL_EDITION,
    status: 'offered',
    rewarded: false,
    missionCompleted: false,
    phase: 'dossier',
    step: 0,
  });
  assert.deepEqual(
    Object.keys(rec).sort(),
    ['edition', 'missionCompleted', 'phase', 'rewarded', 'status', 'step'],
  );
});

test('shouldAutoPresentTutorial opens automatically ONLY for new Block 6 accounts with offered/active briefing', () => {
  // Existing pre-Block-6 player (no tutorial key at all) -> never auto-interrupted
  assert.equal(shouldAutoPresentTutorial({ name: 'Vet', xp: 750 }), false);
  assert.equal(shouldAutoPresentTutorial({ name: 'FreshPreBlock6', xp: 0 }), false);

  // Declined / completed -> stays quiet
  assert.equal(shouldAutoPresentTutorial({ xp: 0, tutorial: { edition: 3, status: 'declined', rewarded: false, phase: 'dossier', step: 0 } }), false);
  assert.equal(shouldAutoPresentTutorial({ xp: 450, tutorial: { edition: 3, status: 'completed', rewarded: true, phase: 'done', step: 8 } }), false);

  // New Block 6 recruits & resumers -> presented on HQ
  assert.equal(shouldAutoPresentTutorial({ xp: 0, tutorial: initialOfferedTutorial() }), true);
  assert.equal(tutorialResumeTarget({ xp: 0, tutorial: initialOfferedTutorial() }), 'dossier');
  assert.equal(tutorialResumeTarget({ xp: 90, tutorial: { edition: 3, status: 'accepted', rewarded: false, missionCompleted: false, phase: 'mission', step: 3 } }), 'mission-resume');
  assert.equal(tutorialResumeTarget({ xp: 450, tutorial: { edition: 3, status: 'accepted', rewarded: true, missionCompleted: true, phase: 'menu', step: 4 } }), 'menu');
});

test('sanitizeTutorialRecord & shouldPayTutorialReward enforce monotonicity and anti-farm protection', () => {
  // Attempt to clear rewarded/missionCompleted or downgrade edition is ignored
  const downgraded = sanitizeTutorialRecord(
    { edition: 3, status: 'accepted', rewarded: true, missionCompleted: true, phase: 'menu', step: 5 },
    { edition: 1, rewarded: false, missionCompleted: false, phase: 'mission', step: 2 },
  );
  assert.equal(downgraded.edition, 3);
  assert.equal(downgraded.rewarded, true);
  assert.equal(downgraded.missionCompleted, true);

  // Existing pre-Block-6 accounts with XP > 0 cannot farm recruit rewards
  assert.equal(shouldPayTutorialReward({ name: 'Vet', xp: 750 }, true), false);
  assert.equal(shouldPayTutorialReward({ name: 'Recruit', xp: 0, tutorial: initialOfferedTutorial() }, true), true);
  assert.equal(shouldPayTutorialReward({ name: 'Recruit', xp: 450, tutorial: { edition: 3, status: 'accepted', rewarded: true } }, true), false);
  assert.equal(shouldPayTutorialReward({ name: 'Recruit', xp: 0, tutorial: initialOfferedTutorial() }, false), false);
});

test('applyTutorialRewardProfile pays XP/armory atomically once and blocks second claim even on recreate/replay', () => {
  const start = { name: 'Rookie', xp: 0, armory: { scrap: 0, owned: 0, equipped: 0 }, tutorial: initialOfferedTutorial() };
  const first = applyTutorialRewardProfile(start, {
    amount: 450,
    wave: 7,
    armoryRewardFn: armory => ({ ...armory, owned: armory.owned | 1 }),
  });
  assert.equal(first.credited, true);
  assert.equal(first.xpCredited, 450);
  assert.equal(first.nextProfile.xp, 450);
  assert.equal(first.nextProfile.armory.owned, 1);
  assert.equal(first.nextProfile.tutorial.rewarded, true);
  assert.equal(first.nextProfile.tutorial.missionCompleted, true);
  assert.equal(first.nextProfile.tutorial.phase, 'menu');

  const second = applyTutorialRewardProfile(first.nextProfile, {
    amount: 450,
    wave: 7,
    armoryRewardFn: armory => ({ ...armory, scrap: 999 }),
  });
  assert.equal(second.credited, false);
  assert.equal(second.xpCredited, 0);
  assert.equal(second.nextProfile.xp, 450);
  assert.equal(second.nextProfile.armory.scrap, 0);
});

test('createTutorialSync performs RTDB transactions and aborts cleanly when session changes', async () => {
  let stored = { name: 'Rookie', xp: 0, tutorial: initialOfferedTutorial() };
  let uid = 'rookie-1';
  let active = true;
  const snapshots = [];
  const sdk = {
    ref: (_db, path) => ({ path }),
    runTransaction: async (ref, updater) => {
      assert.equal(ref.path, 'players/rookie-1');
      const next = updater(stored);
      if (next === undefined) return { committed: false, snapshot: { val: () => stored } };
      stored = next;
      return { committed: true, snapshot: { val: () => stored } };
    },
  };
  const sync = createTutorialSync({
    db: {},
    sdk,
    getUid: () => uid,
    isCurrent: () => active,
    onProfile: p => snapshots.push(p),
  });

  await sync.acceptMission();
  assert.equal(stored.tutorial.status, 'accepted');
  assert.equal(stored.tutorial.phase, 'mission');

  await sync.recordMissionStep(4);
  assert.equal(stored.tutorial.step, 4);

  await sync.beginMenuTour(0);
  assert.equal(stored.tutorial.missionCompleted, true);
  assert.equal(stored.tutorial.phase, 'menu');

  await sync.completeTour(8);
  assert.equal(stored.tutorial.status, 'completed');
  assert.equal(stored.tutorial.phase, 'done');

  await sync.restartForReplay('mission', stored);
  assert.equal(stored.tutorial.status, 'accepted');
  assert.equal(stored.tutorial.phase, 'mission');
  assert.equal(stored.tutorial.missionCompleted, true, 'restart preserves missionCompleted');

  // Session logout cancels pending writes
  active = false;
  const aborted = await sync.declineMission();
  assert.equal(aborted.committed, false);
  assert.ok(snapshots.length >= 4);
});
