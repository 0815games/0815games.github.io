import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readWarEffort, warEffortTier, warEffortBonus, donateWarEffort, WAR_EFFORT_DONATION, WAR_EFFORT_TIER_COST, WAR_EFFORT_GOAL} from '../core/war-effort.mjs';
import {createSoloDeployment} from '../core/solo-deployment.mjs';
import {createPlayer} from '../core/match.mjs';

// AUSBAU-PLAN Punkt 4a: die Scrap-Senke. Überschüssiger Scrap wird ein
// gespeichertes Fortschrittsziel (Kriegsanstrengung), statt nutzlos zu
// wachsen: spenden, Stufen sammeln, mit mehr Startvorräten losziehen.

const rich = scrap => ({name: 'Veteran', xp: 5000, armory: {scrap, fortify: 3, plating: 3, repair: 0, gun: 0, supply: 0, safeguard: 0, owned: 1023, equipped: 1}});

test('the stored total reads sanitized: old saves and broken values count as zero', () => {
  assert.equal(readWarEffort(null), 0);
  assert.equal(readWarEffort({}), 0);
  assert.equal(readWarEffort({warEffort: -50}), 0);
  assert.equal(readWarEffort({warEffort: 12.5}), 0);
  assert.equal(readWarEffort({warEffort: '500'}), 0);
  assert.equal(readWarEffort({warEffort: 700}), 700);
  assert.equal(readWarEffort({warEffort: WAR_EFFORT_GOAL * 3}), WAR_EFFORT_GOAL, 'never above the funding goal');
});

test('tiers land on their scrap boundaries and pay three supplies each', () => {
  assert.equal(warEffortTier({warEffort: WAR_EFFORT_TIER_COST - 1}), 0);
  assert.equal(warEffortTier({warEffort: WAR_EFFORT_TIER_COST}), 1);
  assert.equal(warEffortTier({warEffort: WAR_EFFORT_GOAL}), 10);
  assert.deepEqual(warEffortBonus({warEffort: 1500}), {startSupplies: 9});
  assert.deepEqual(warEffortBonus({}), {startSupplies: 0});
});

test('a donation moves scrap into the fund and nothing else', () => {
  const next = donateWarEffort(rich(1000));
  assert.equal(next.armory.scrap, 1000 - WAR_EFFORT_DONATION);
  assert.equal(next.warEffort, WAR_EFFORT_DONATION);
  assert.equal(next.armory.fortify, 3, 'the rest of the armory is untouched');
  assert.equal(next.name, 'Veteran');
  assert.equal(donateWarEffort(rich(100)), null, 'not enough scrap');
  assert.equal(donateWarEffort(rich(1000), 0), null);
  assert.equal(donateWarEffort(rich(1000), 1001), null, 'one write donates at most 1000 - the rule cap');
  assert.equal(donateWarEffort({...rich(1000), warEffort: WAR_EFFORT_GOAL - 100}), null, 'the fund takes nothing past its goal');
  assert.equal(donateWarEffort({...rich(1000), warEffort: WAR_EFFORT_GOAL - WAR_EFFORT_DONATION}).warEffort, WAR_EFFORT_GOAL, 'the last chunk lands exactly on the goal');
  assert.equal(donateWarEffort(null), null);
});

test('a funded effort sends a solo operation out with extra starting supplies', () => {
  const player = () => createPlayer('solo', {name: 'Solo', gender: 'female'});
  const plain = createSoloDeployment({player: player(), mapId: 'road', profile: rich(0), workshopEnabled: false});
  const funded = createSoloDeployment({player: player(), mapId: 'road', profile: {...rich(0), warEffort: 1500}, workshopEnabled: false});
  assert.equal(funded.money - plain.money, 9, 'tier 3 pays nine extra supplies, endless and campaign alike');
  const mission = createSoloDeployment({player: player(), mapId: 'g3-0a195a333', profile: {...rich(0), warEffort: 5000}, workshopEnabled: false, campaign: {id: 'lost-signal', threat: 'standard'}});
  const missionPlain = createSoloDeployment({player: player(), mapId: 'g3-0a195a333', profile: rich(0), workshopEnabled: false, campaign: {id: 'lost-signal', threat: 'standard'}});
  assert.equal(mission.money - missionPlain.money, 30, 'a fully funded effort pays thirty');
});
