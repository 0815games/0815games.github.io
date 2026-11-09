import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// The mission accompaniment (radio decisions, field events, stage captions) is
// the newest part of the German screen. `translateText()` silently falls back
// to English on a miss, so - like the first-run dictionary - every string the
// accompaniment can show must have a German entry, and every German entry must
// belong to a string that still exists. The dictionary file itself throws on a
// missing key at import time; these tests cover the screen direction (what
// game.js actually asks for), the house style, and dead keys.

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// game.js reads the dictionaries through language.mjs with a cache token; the
// harness must switch the language on the very same module instance.
const languageUrl = (() => {
  const source = readFileSync(resolve(root, 'story-mission.mjs'), 'utf8');
  const match = source.match(/from '\.\/story-events\.mjs(\?v=[^']+)'/);
  assert.ok(match, 'story-mission.mjs imports story-events.mjs');
  return `../language.mjs${readFileSync(resolve(root, 'game.js'), 'utf8').match(/from '\.\/language\.mjs(\?v=[^']+)'/)[1]}`;
})();

async function withGerman(run) {
  let saved = 'de';
  const storage = { getItem: key => (key === 'ironpath:language' ? saved : null), setItem() {} };
  const node = () => ({ value: '', textContent: '', hidden: false, dataset: {},
    classList: { toggle() {}, add() {}, remove() {} }, setAttribute() {}, addEventListener() {}, dispatchEvent() {}, getAttribute() { return null; } });
  const savedDocument = globalThis.document;
  globalThis.document = { documentElement: { lang: 'en' }, getElementById: node, querySelector: node, querySelectorAll: () => [], addEventListener() {}, dispatchEvent() {} };
  try {
    const language = await import(languageUrl);
    language.setupLanguage({ document: globalThis.document, storage });
    assert.equal(language.getLanguage(), 'de', 'the harness really switched to German');
    return await run(language);
  } finally { globalThis.document = savedDocument; }
}

const accompanimentStrings = events => [
  ...Object.values(events.MISSION_DECISIONS).flatMap(decision => [
    decision.text,
    ...decision.choices.flatMap(choice => [choice.label, choice.detail, choice.confirm]),
    ...decision.choices.filter(c => c.side).map(c => c.side.label),
  ]),
  ...Object.values(events.MISSION_EVENTS).flatMap(list => list.flatMap(event => [
    ...(event.text ? [event.text] : []),
    ...(event.side?.label ? [event.side.label] : []),
  ])),
  ...Object.values(events.STAGE_CAPTIONS),
  ...Object.values(events.EVENT_TEMPLATES),
];

test('every accompaniment string is German on a German screen, with no dead keys', async () => {
  const events = await import('../story-events.mjs');
  const { germanEvents } = await import('../localization-events-de.mjs');
  const strings = accompanimentStrings(events);
  assert.ok(strings.length >= 50, 'the accompaniment still has its strings');
  await withGerman(language => {
    const missing = strings.filter(text => typeof text === 'string' && language.translateText(text) === text && germanEvents[text] !== text);
    assert.deepEqual(missing, [], `untranslated accompaniment strings: ${missing.join(' | ')}`);
  });
  const live = new Set(strings);
  const orphans = Object.keys(germanEvents).filter(key => !live.has(key));
  assert.deepEqual(orphans, [], `German entries nothing asks for: ${orphans.join(' / ')}`);
});

test('the accompaniment keeps the house style: Du-form and intact placeholders', async () => {
  const { germanEvents } = await import('../localization-events-de.mjs');
  for (const [key, value] of Object.entries(germanEvents)) {
    assert.doesNotMatch(value, /\bSie\b|\bIhnen\b|\bIhr\b/, `formal address in the German accompaniment: ${value}`);
    for (const match of key.matchAll(/\{(\w+)\}/g))
      assert.ok(value.includes(`{${match[1]}}`), `${key} lost its {${match[1]}} placeholder`);
  }
});

test('the events dictionary is imported and asked before the generic fallback', () => {
  const language = readFileSync(resolve(root, 'language.mjs'), 'utf8');
  assert.match(language, /import \{germanEvents\} from '\.\/localization-events-de\.mjs\?v=/, 'the events dictionary is imported');
  const chain = language.slice(language.indexOf("active==='de'?"), language.indexOf("active==='de'?") + 700);
  assert.match(chain, /germanCinematics\[text\]\?\?germanEvents\[text\]\?\?text/, 'and asked before falling back to English');
});

test('game.js renders the accompaniment through the translated templates', () => {
  // The panel and the bonus line must go through translateText - a hardcoded
  // English string here would be invisible to every dictionary check above.
  const source = readFileSync(resolve(root, 'game.js'), 'utf8');
  assert.match(source, /tr\(EVENT_TEMPLATES\.decisionTitle\)/, 'the decision title is translated');
  assert.match(source, /tr\(EVENT_TEMPLATES\.bonusProgress,/, 'the bonus progress line is translated');
  assert.match(source, /tr\(STAGE_CAPTIONS\[stage\?\.type\]\|\|null\)|tr\(card\.caption\)/, 'the stage caption is translated');
  assert.match(source, /tr\(EVENT_TEMPLATES\.reinforcements,\{count:entry\.count\}\)/, 'the reinforcement line is translated');
});
