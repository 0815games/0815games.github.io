import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync, readdirSync} from 'node:fs';

// The translation coverage guard.
//
// Reported after a full playthrough: "Schau das Spiel durch, ob alles
// uebersetzt wurde." The answer was: 688 strings reach the player through
// tr()/translateText()/notice() or a data-i18n attribute, and eight of them
// had no German at all - each one found by hand. This test is that hand,
// automated: every English literal a surface can show must have a German
// entry in some dictionary, or the suite goes red at the commit that added it.
//
// What it covers:
//   * literals passed to tr() / translateText() / notice() in the root modules
//     (notice() ends in tr() through localizeGameMessage);
//   * every data-i18n / data-i18n-text / -aria-label / -title / -placeholder
//     attribute value in index.html, HTML-unescaped;
//   * the dotted keys of language.mjs's own `messages` block (they need a de).
// What it deliberately does not cover:
//   * dynamic keys (map names, tower names, mission titles) - those are walked
//     by their own domain tests, which is where the English source lives;
//   * staged or brand surfaces that are English on purpose (the language gate
//     itself, "0815 GAMES").

const root = new URL('..', import.meta.url);
const isModule = name => /\.(mjs|js)$/.test(name);
const rootModules = readdirSync(root).filter(name => isModule(name)
  && name !== 'language.mjs' && !name.startsWith('localization-') && !name.startsWith('sw.'));

function dictionaryKeys() {
  const keys = new Set();
  for (const name of readdirSync(root)) {
    if (!name.startsWith('localization') || !name.endsWith('-de.mjs')) continue;
    const source = readFileSync(new URL(name, root), 'utf8');
    for (const match of source.matchAll(/'((?:[^'\\]|\\.)+)'\s*:/g)) keys.add(match[1]);
    for (const match of source.matchAll(/"((?:[^"\\]|\\.)+)"\s*:/g)) keys.add(match[1]);
  }
  // The plain data-i18n system: dotted keys with {en,de} pairs in language.mjs.
  const language = readFileSync(new URL('language.mjs', root), 'utf8');
  const block = language.match(/const messages=\{.*?\n\};/s);
  assert.ok(block, 'language.mjs still has its messages block');
  for (const match of block[0].matchAll(/'([a-z][\w.]*)'\s*:\s*\{[^}]*de:'/g)) keys.add(match[1]);
  return keys;
}

function usedLiterals() {
  const used = new Map();
  const remember = (literal, where) => {
    if (!literal || literal.startsWith('#') || literal.startsWith('.') || literal.includes('/')) return;
    used.set(literal, where);
  };
  const call = /\b(?:tr|translateText|notice)\(\s*('((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")/g;
  for (const name of rootModules) {
    const source = readFileSync(new URL(name, root), 'utf8');
    for (const match of source.matchAll(call)) remember(match[2] ?? match[3], name);
  }
  const attribute = /data-i18n(?:-(?:text|aria-label|title|placeholder))?="([^"]+)"/g;
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const unescape = text => text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  for (const match of html.matchAll(attribute)) remember(unescape(match[1]), 'index.html');
  return used;
}

test('every string a surface can show has a German entry',()=>{
 const keys=dictionaryKeys(),used=usedLiterals();
 assert.ok(used.size>600,`the scan still sees the game (found ${used.size}, expected 600+)`);
 const missing=[...used.entries()].filter(([literal])=>!keys.has(literal));
 assert.deepEqual(missing.map(([literal])=>literal),[],
  'untranslated strings (add them to the matching localization-*-de.mjs): '
   +JSON.stringify(missing,null,2));
});

test('no dictionary key is defined twice in the same file',()=>{
 // A duplicate silently wins by position, which is how a stale entry can
 // shadow a correction. Found twice in localization-de.mjs during the audit.
 for (const name of readdirSync(root)) {
  if (!name.startsWith('localization') || !name.endsWith('-de.mjs')) continue;
  const source = readFileSync(new URL(name, root), 'utf8');
  const seen = new Map();
  for (const style of [/'((?:[^'\\]|\\.)+)'\s*:/g, /"((?:[^"\\]|\\.)+)"\s*:/g]) {
   for (const match of source.matchAll(style)) {
    if (seen.has(match[1])) assert.fail(`${name} defines '${match[1]}' twice`);
    seen.set(match[1], true);
   }
  }
 }
});
