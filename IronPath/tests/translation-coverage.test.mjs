import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GAME_MODULE_FOLDERS} from '../release-tools/stage-version.mjs';

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
const rootDir = fileURLToPath(root);
const isModule = name => /\.(mjs|js)$/.test(name);
// Every shipped module, wherever the structure puts it: the game root plus the
// approved module folders, recursively, as root-relative paths. A scan that
// only reads the root would silently stop seeing modules the day a group moves
// into i18n/ or battle/ - and report full coverage over half the game.
function allModuleFiles() {
  const found = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(join(dir, entry.name), rel);
      else if (entry.isFile() && isModule(entry.name)) found.push(rel);
    }
  };
  for (const name of readdirSync(rootDir)) if (isModule(name)) found.push(name);
  for (const folder of GAME_MODULE_FOLDERS)
    if (existsSync(join(rootDir, folder))) walk(join(rootDir, folder), folder);
  return found.sort();
}
const baseName = rel => rel.split('/').pop();
const rootModules = allModuleFiles().filter(rel => baseName(rel) !== 'language.mjs'
  && !baseName(rel).startsWith('localization-') && !baseName(rel).startsWith('sw.'));
const dictionaryFiles = () => allModuleFiles().filter(rel =>
  baseName(rel).startsWith('localization') && baseName(rel).endsWith('-de.mjs'));

function dictionaryKeys() {
  const keys = new Set();
  for (const name of dictionaryFiles()) {
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
 for (const name of dictionaryFiles()) {
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
