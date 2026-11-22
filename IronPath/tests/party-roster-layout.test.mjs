import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

// The party roster was asked for as "four compact cards - avatar, name, rank,
// host/team and readiness; 2x2 where there is room". The cards were built, but
// the task list still said "the current presentation is a list". This test is
// what turns that claim into something checkable: the roster is a GRID, a card
// is the five things it was asked to be, and none of it is painted in colours
// that fight the active theme.

const css=readFileSync(new URL('../interface-redesign.css',import.meta.url),'utf8');
const panel=readFileSync(new URL('../net/firebase-four-panel.mjs',import.meta.url),'utf8');

test('the roster is a grid of cards, not a list of rows',()=>{
  const rule=/\.party-roster\{([^}]*)\}/.exec(css)?.[1]||'';
  assert.ok(rule,'the party roster has its own rule');
  // `auto-fit` + `minmax(150px,1fr)`: as many columns as fit, never one fixed
  // count. Two where the panel is wide, one on a narrow phone - which is what
  // "2x2, wo Platz ist" asks for, and a fixed `repeat(2,...)` would break.
  assert.match(rule,/grid-template-columns:repeat\(auto-fit,minmax\(150px,1fr\)\)/,
    'as many columns as fit, each at least 150px wide');
  assert.doesNotMatch(rule,/grid-template-columns:repeat\(2,/,'and never a hard two columns that cannot collapse');
  // A bare `.party-card` would lose to `.four-party-list li` (one class plus one
  // element) and inherit the row's centred alignment. The comment in the CSS
  // says so; this keeps the qualification from being quietly dropped.
  assert.match(css,/\.party-roster \.party-card\{[^}]*align-items:flex-start/,
    'the card wins the specificity fight against the list row');
});

test('one card carries the five things it was asked to carry',()=>{
  const build=panel.slice(panel.indexOf('function buildCard'),panel.indexOf('function syncPortraits'));
  assert.ok(build,'the panel builds one card per slot');
  for(const [needle,what] of [
    ['party-card-portrait','a portrait'],
    ['party-card-name','the soldier’s name'],
    ['rankInsigniaSvg','the rank, drawn as an insignia'],
    ['party-card-rankname','and the rank written out, not only drawn'],
    ["tag('party-tag',tr('Host'))",'the host mark'],
    ["tag('party-tag',tr('Team {letter}'",'the team, when the mode has teams'],
    ['party-card-state','and whether the soldier is ready'],
  ])assert.ok(build.includes(needle),`the card carries ${what}`);
  // An open slot is not a soldier: it says so and looks different, but a screen
  // reader still counts it as a member of the roster.
  assert.match(panel,/party-card party-card-open/,'an empty slot is marked as one, not filled with a placeholder soldier');
  assert.match(panel,/tr\('Slot \{number\} · Open'/,'and it is named as an open slot');
});

test('the card keeps the theme’s colours and stays readable',()=>{
  const card=css.split('\n').filter(line=>line.startsWith('.party-card')&&line.includes('{'));
  assert.ok(card.length>=4,'the card has rules of its own');
  // No colour of its own: the card rides whatever the active theme gives a row.
  // A card that brought its own background would look wrong the moment the
  // theme changed - which is exactly the bug the comment in the CSS warns of.
  const joined=css.slice(css.indexOf('.party-roster{'),css.indexOf('.party-card-state.is-waiting'));
  assert.doesNotMatch(joined,/background:#[0-9a-f]{3,6}/i,'the card paints no background of its own');
  assert.doesNotMatch(joined,/color:#[0-9a-f]{3,6}/i,'and no text colour of its own');
  // The portrait is decoration - the name next to it is the information.
  assert.match(panel,/portrait\.alt=''/,'the portrait is decorative, not the only carrier of a name');
});
