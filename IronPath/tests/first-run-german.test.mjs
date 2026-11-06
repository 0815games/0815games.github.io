import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// The first run is the one part of the game a new soldier cannot skip, and it was the
// least translated part of it: 4 of 21 coach strings German, 0 of 20 in the guide, 3 of
// 16 in the class lines - while the menu, the battle and the armory around them were
// German. `translateText()` returns the English string when a lookup misses, which is
// why nobody noticed: there is no error, just English text on a German screen.
//
// These tests make a missing translation a build failure instead of a surprise on a
// phone. Every string a first-run card can show must have a German entry, and every
// German entry must still belong to a real string (so an edited English sentence does
// not leave a dead key behind and silently drop back to English).

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// In the browser `language.mjs` is fetched through a cache token, and the token is part
// of the module URL: two different tokens are two different modules, each with its own
// `active` language. The harness must therefore import the very same URL the game code
// imports, or it would switch the language on a copy nobody is reading from.
const languageUrl = (() => {
  const source = readFileSync(resolve(root, 'first-run-coach.mjs'), 'utf8');
  const match = source.match(/from '\.\/language\.mjs(\?v=[^']+)?'/);
  assert.ok(match, 'first-run-coach.mjs imports language.mjs');
  return `../language.mjs${match[1] ?? ''}`;
})();

async function withLanguage(run, initial = 'de') {
  // `language.mjs` reads the language from storage on setup, so this is the same path
  // the browser takes, not a mock of `translateText`.
  let saved_language = initial;
  const storage = { getItem: key => (key === 'ironpath:language' ? saved_language : null), setItem() {} };
  const node = () => ({
    value: '', textContent: '', hidden: false,
    classList: { toggle() {}, add() {}, remove() {} },
    setAttribute() {}, addEventListener() {}, dispatchEvent() {}, getAttribute() { return null; },
  });
  const saved = globalThis.document;
  globalThis.document = {
    documentElement: { lang: 'en' },
    getElementById: node, querySelector: node, querySelectorAll: () => [],
    addEventListener() {}, dispatchEvent() {},
  };
  try {
    const language = await import(languageUrl);
    language.setupLanguage({ document: globalThis.document, storage });
    assert.equal(language.getLanguage(), initial, `the harness really switched to ${initial}`);
    // Switching the way `account.js` does it: store the choice, then re-run setup, which
    // is what `refreshLanguage()` reacts to.
    const switchTo = async next => {
      saved_language = next;
      language.setupLanguage({ document: globalThis.document, storage });
      assert.equal(language.getLanguage(), next, `switched to ${next}`);
    };
    return await run(language, switchTo);
  } finally {
    globalThis.document = saved;
  }
}
const withGerman = run => withLanguage(run, 'de');

const cardStrings = (coach, guide) => [
  ...coach.COACH_STEPS.flatMap(step => [
    [`coach.${step.id}.title`, step.title],
    [`coach.${step.id}.text`, step.text],
    [`coach.${step.id}.caption`, step.caption],
    // The line the gate shows while it waits. It was added after this list existed and
    // slipped through untranslated for exactly that reason: the guard only knew the
    // three fields it had been written for.
    [`coach.${step.id}.ask`, step.ask],
  ]),
  ...guide.STEPS.flatMap(step => [
    [`guide.${step.id}.title`, step.title],
    [`guide.${step.id}.text`, step.text],
    [`guide.${step.id}.caption`, step.caption],
  ]),
  ...guide.CLASSES.flatMap((entry, index) => [
    [`classes.${entry.id || index}.name`, entry.name],
    [`classes.${entry.id || index}.what`, entry.what],
    [`classes.${entry.id || index}.forYou`, entry.forYou],
  ]),
];

test('every first-run card is German, not the English fallback', async () => {
  const coach = await import('../first-run-coach.mjs');
  const guide = await import('../first-run-guide.mjs');
  const strings = cardStrings(coach, guide);
  assert.ok(strings.length >= 45, 'the first run still has its strings');
  await withGerman(language => {
    const missing = strings.filter(([, text]) => typeof text === 'string' && language.translateText(text) === text);
    assert.deepEqual(missing, [], `untranslated first-run strings: ${missing.map(([name]) => name).join(', ')}`);
  });
});

test('the German text is really German, not an English copy', async () => {
  const coach = await import('../first-run-coach.mjs');
  const guide = await import('../first-run-guide.mjs');
  await withGerman(language => {
    // A word-level check: these sentences must not survive translation as English.
    const englishOnly = [
      ' the ', ' and ', ' your ', ' you ', ' with ', ' what ', ' this ',
    ];
    for (const [name, text] of cardStrings(coach, guide)) {
      if (typeof text !== 'string' || text.length < 12) continue;
      const german = language.translateText(text);
      assert.notEqual(german, text, `${name} was not translated`);
      for (const word of englishOnly) {
        assert.ok(!german.toLowerCase().includes(word),
          `${name} still reads English ("${word.trim()}"): ${german}`);
      }
    }
  });
});

test('no German entry points at a string that no longer exists', async () => {
  // An English sentence that gets edited keeps its old German entry, which then never
  // matches - the card silently falls back to English. Both directions are checked.
  const { germanFirstRun } = await import('../localization-firstrun-de.mjs');
  const coach = await import('../first-run-coach.mjs');
  const guide = await import('../first-run-guide.mjs');
  const live = new Set(cardStrings(coach, guide).map(([, text]) => text));
  const orphans = Object.keys(germanFirstRun).filter(key => !live.has(key));
  assert.deepEqual(orphans, [], `German entries nothing asks for: ${orphans.join(' / ')}`);
});

test('the dictionary is registered before the other German files can shadow it', () => {
  // Lookup order matters: if a generic file happened to hold "Assault", the class name
  // would come from there and the first-run entries would quietly never be used.
  const language = readFileSync(resolve(root, 'language.mjs'), 'utf8');
  assert.match(language, /import \{germanFirstRun\} from '\.\/localization-firstrun-de\.mjs\?v=/,
    'the first-run dictionary is imported');
  const chain = language.slice(language.indexOf("active==='de'?"), language.indexOf("active==='de'?") + 400);
  // The Settings dictionary sits in front of it: the dialog that switches the language
  // must never fall back to English. The first-run dictionary is still asked before
  // every generic file, which is what this test is actually about.
  assert.match(chain, /^active==='de'\?\(germanSettings\[text\]\?\?germanFirstRun\[text\]\?\?/, 'and asked first');
});

test('the German strings keep the house style', async () => {
  const { germanFirstRun } = await import('../localization-firstrun-de.mjs');
  const values = Object.values(germanFirstRun);
  // The rest of the German UI uses the Du-form; a stray "Sie" reads like a different
  // product. Case-insensitive, word-bounded, and "Sie" as a pronoun only - the same
  // check the battle dictionary would pass.
  for (const value of values) {
    assert.doesNotMatch(value, /\bSie\b|\bIhnen\b|\bIhr\b/,
      `formal address in the German first run: ${value}`);
  }
  // Placeholders must survive translation, or a card shows a literal {amount}.
  for (const [key, value] of Object.entries(germanFirstRun)) {
    const placeholders = [...key.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
    for (const name of placeholders) {
      assert.ok(value.includes(`{${name}}`), `${key} lost its {${name}} placeholder`);
    }
  }
});

test('the open card re-renders when the language is switched under it', async () => {
  // `refreshLanguage()` is what account.js calls on a switch, and it only re-renders when
  // the card is open. With the strings translated but this hook broken, a player would
  // switch to German and keep reading English until the next card appeared - so the card
  // here is opened in English *first* and has to turn German without being reopened.
  const nodes = new Map();
  const make = id => ({ id, hidden: false, disabled: false, textContent: '', dataset: {}, attrs: {},
    addEventListener() {}, setAttribute(name, value) { this.attrs[name] = value; }, getAttribute(name) { return this.attrs[name] ?? null; } });
  for (const id of ['firstRunCoach', 'coachStep', 'coachTitle', 'coachText', 'coachCaption', 'coachAsk', 'coachNext', 'coachClose']) nodes.set(id, make(id));
  const fakeDocument = { getElementById: id => nodes.get(id) ?? null, createElement: () => make('i') };
  await withLanguage(async (language, switchTo) => {
    const { createCoach } = await import('../first-run-coach.mjs?test=refresh');
    const coach = createCoach({ document: fakeDocument, storage: { getItem: () => null, setItem() {} } });
    coach.start('soldier-a');
    assert.equal(nodes.get('coachTitle').textContent, 'Welcome, soldier', 'the card opens in English');
    await switchTo('de');
    coach.refreshLanguage();
    assert.equal(nodes.get('coachTitle').textContent, 'Willkommen, Soldat', 'the open card follows the switch');
    assert.equal(nodes.get('coachText').textContent,
      'Fünf Wellen, und der Boss der letzten beendet die Übung. Das hier ist ein echter Einsatz: Was du jetzt baust, kämpft auch.',
      'and the body follows, not just the title');
    assert.equal(nodes.get('coachCaption').textContent, 'WELLE 1 VON 5', 'the caption follows too');
  }, 'en');
});

test('the guide cards are translated on screen, not just in the dictionary', async () => {
  // The dictionary alone proved nothing: `first-run-guide.mjs` wrote `current.title`
  // straight to the DOM, so all twelve of its German entries were dead weight and the
  // cards after the first match stayed English. This test reads what the guide writes.
  const nodes = new Map();
  const make = id => ({ id, hidden: false, textContent: '', dataset: {}, style: {}, addEventListener() {} });
  for (const id of ['firstRunGuide', 'guideStep', 'guideTitle', 'guideText', 'guideCaption', 'guideNext', 'coachHighlight', 'coachRing']) nodes.set(id, make(id));
  const fakeDocument = { getElementById: id => nodes.get(id) ?? null, querySelector: () => null, querySelectorAll: () => [] };
  await withGerman(async language => {
    const { createGuide, STEPS } = await import('../first-run-guide.mjs?test=screen');
    const guide = createGuide({ document: fakeDocument, storage: { getItem: () => null, setItem() {} } });
    guide.start('soldier-a');
    for (const [index, step] of STEPS.entries()) {
      assert.equal(nodes.get('guideTitle').textContent, language.translateText(step.title),
        `card ${step.id} shows the German title on a German screen`);
      assert.equal(nodes.get('guideText').textContent, language.translateText(step.text),
        `card ${step.id} shows the German body on a German screen`);
      assert.notEqual(nodes.get('guideTitle').textContent, step.title,
        `card ${step.id} still shows its English title`);
      assert.equal(nodes.get('guideCaption').textContent, language.translateText(step.caption),
        `card ${step.id} shows the German caption`);
      if (index < STEPS.length - 1) {
        // Every card but the last advances on a button; the action cards are driven by
        // the account, so nudge those the same way before reading the next one.
        if (!guide.next()) guide.event(step.id);
      }
    }
  });
});
