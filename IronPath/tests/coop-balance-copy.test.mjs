import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {COOP_ENEMY_HEALTH,COOP_REWARD_RATE} from '../simulation.mjs';
import {germanMoreStatic} from '../localization-more-static-de.mjs';

test('the two-player supply explanation matches the simulation in both languages',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const note=/<p class="party-note" data-i18n-text="([^"]+)">([^<]+)<\/p>/.exec(html);
 assert.ok(note,'the co-op explanation exists');
 assert.equal(note[1],note[2],'the translation key and English text match');
 const rate=`${Math.round(COOP_REWARD_RATE*100)}%`,health=`${Math.round((COOP_ENEMY_HEALTH-1)*100)}%`;
 assert.ok(note[2].includes(`${rate} of base supply rewards`));
 assert.ok(note[2].includes(`${health} more health`));
 const german=germanMoreStatic[note[1]];
 assert.ok(german,'the explanation has a German translation');
 assert.ok(german.includes(`${rate} der Grundvorratsbelohnungen`));
 assert.ok(german.includes(`${health} mehr Lebenspunkten`));
});
