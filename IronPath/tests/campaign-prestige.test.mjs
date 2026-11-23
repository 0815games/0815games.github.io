import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {prestigeScale, PRESTIGE_MAX_TIER} from '../core/campaign-pressure.mjs';
import {prestigeTierOf, prestigeScrapBonus, recordPrestigeClear} from '../core/campaign-prestige.mjs';
import {createSoloDeployment} from '../core/solo-deployment.mjs';
import {createPlayer, applyCommand} from '../core/match.mjs';

// AUSBAU-PLAN Punkt 4b: Kampagnen-NG+. Abgeschlossene Missionen werden
// unter steigendem Prestige-Druck erneut gespielt; die Leiter steht auf
// dem Profil, der Druck stapelt auf dem vorhandenen Vertrags-System.

test('prestige pressure stacks on the threat vocabulary and clamps at the ladder top', () => {
  assert.deepEqual(prestigeScale(0), {tier: 0, unit: 1, damage: 1, squad: 0});
  assert.deepEqual(prestigeScale(undefined), {tier: 0, unit: 1, damage: 1, squad: 0});
  assert.deepEqual(prestigeScale(1), {tier: 1, unit: 1.15, damage: 1.1, squad: 1});
  assert.deepEqual(prestigeScale(2), {tier: 2, unit: 1.3, damage: 1.2, squad: 2});
  assert.equal(prestigeScale(99).tier, PRESTIGE_MAX_TIER);
  assert.equal(prestigeScale(PRESTIGE_MAX_TIER).unit, 2.5);
  assert.equal(prestigeScale(PRESTIGE_MAX_TIER).squad, 4, 'the surge widens to four, never wider');
  assert.equal(prestigeScale(-3).tier, 0);
});

test('the ladder pays scrap per rung and only ever climbs one rung per clear', () => {
  assert.equal(prestigeScrapBonus(0), 0);
  assert.equal(prestigeScrapBonus(1), 150);
  assert.equal(prestigeScrapBonus(10), 600);
  assert.equal(prestigeScrapBonus(11), 0);
  assert.equal(prestigeTierOf({}), 0);
  assert.equal(prestigeTierOf({campaignPrestige: 99}), PRESTIGE_MAX_TIER);
  assert.equal(prestigeTierOf({campaignPrestige: 2.5}), 0);
  const start = {armory: {scrap: 40, fortify: 0, plating: 0, repair: 0, gun: 0, supply: 0, safeguard: 0, owned: 0, equipped: 0}};
  assert.equal(recordPrestigeClear(start, 2), null, 'no skipping rungs');
  const first = recordPrestigeClear(start, 1);
  assert.equal(first.campaignPrestige, 1);
  assert.equal(first.armory.scrap, 190, 'the rung pays its scrap into the same balance the war effort drains');
  assert.equal(recordPrestigeClear(first, 1), null, 'the same rung twice proves nothing new');
  assert.equal(recordPrestigeClear({...start, campaignPrestige: PRESTIGE_MAX_TIER}, PRESTIGE_MAX_TIER + 1), null, 'the ladder ends at ten');
});

test('a prestige replay stiffens the contract but keeps its shape', () => {
  const player = () => createPlayer('solo', {name: 'Solo', gender: 'female'});
  const campaign = prestige => ({id: 'signal-home', threat: 'elite', ...(prestige ? {prestige} : {})});
  const standard = createSoloDeployment({player: player(), mapId: 'g3-002000003', profile: {}, workshopEnabled: false, campaign: campaign(0)});
  const loaded = createSoloDeployment({player: player(), mapId: 'g3-002000003', profile: {}, workshopEnabled: false, campaign: campaign(2)});
  assert.equal(standard.campaignContract.prestige, undefined, 'a standard contract carries no prestige');
  assert.equal(loaded.campaignContract.prestige, 2);
  assert.equal(loaded.campaignContract.waves, standard.campaignContract.waves, 'the wave contract is the mission its own');
  assert.equal(loaded.campaignContract.unit, Math.round(standard.campaignContract.unit * 1.3 * 1000) / 1000, 'unit health stacks by the tier');
  assert.equal(loaded.campaignContract.damage, Math.round(standard.campaignContract.damage * 1.2 * 1000) / 1000);
  assert.equal(loaded.maxHp, standard.maxHp, 'the bunker is not taxed twice');
  const training = createSoloDeployment({player: player(), mapId: 'road', profile: {}, workshopEnabled: false, campaign: {id: 'training', threat: 'training', prestige: 5}});
  assert.equal(training.campaignContract.threat, 'training');
  assert.equal(training.campaignContract.prestige, undefined, 'the training contract never carries prestige');
});

test('the board offers the ladder and a victory records it', () => {
  const game = readFileSync(new URL('../game.js', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(page, /id="campaignPrestige"/, 'the mission brief carries the pressure select');
  assert.match(game, /CAMPAIGN\.indexOf\(mission\)<campaignProgress/, 'only completed missions can load prestige');
  assert.match(game, /account\.recordPrestige\(clearedTier\)/, 'a prestige victory records its rung separately from the mission save');
  const account = readFileSync(new URL('../account.js', import.meta.url), 'utf8');
  assert.match(account, /recordPrestigeClearCore\(current,tier\)/, 'the record runs through the pure reducer in its own transaction');
  assert.match(account, /saveWarEffortDonation/, 'the war effort donation has its own save path');
});

test('the wider surge only lands on surge waves', () => {
  const player = () => createPlayer('solo', {name: 'Solo', gender: 'female'});
  const deploy = prestige => createSoloDeployment({player: player(), mapId: 'g3-002000003', profile: {}, workshopEnabled: false, campaign: {id: 'signal-home', threat: 'elite', prestige}});
  const start = (state, wave) => { state.wave = wave - 1; state.running = false; applyCommand(state, 'solo', {type: 'startWave'}); return state.spawnLeft; };
  const standard = deploy(0), loaded = deploy(2);
  assert.equal(start(loaded, 2) - start(standard, 2), 0, 'a quiet wave stays quiet');
  const standard3 = deploy(0), loaded3 = deploy(2);
  assert.equal(start(loaded3, 3) - start(standard3, 3), 2, 'the surge wave carries two extra enemies at tier 2');
});
