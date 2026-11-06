// Tests import production modules by URL. The game loads them with a per-release
// cache token (`?v=YYYYMMDD-name`), and in ES modules a different token is a
// different instance with its own state. When a test has to share the instance
// the game uses - language.mjs holds the active language, so a second copy is an
// unconfigured one - it must reuse the *exact* URL, not a copy of the token.
//
// Retyping that token made four files go red on every release for no coverage
// gain. Reading it out of game.js keeps the intent and drops the chore; it also
// fails loudly if the token ever disappears from the import.
import {readFileSync} from 'node:fs';

const gameSource = readFileSync(new URL('../game.js', import.meta.url), 'utf8');

export function productionModuleUrl(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\?v=([\\w-]+)`).exec(gameSource);
  if (!match) throw new Error(`game.js does not import ${name} with a cache token`);
  return new URL(`../${name}?v=${match[1]}`, import.meta.url).href;
}
