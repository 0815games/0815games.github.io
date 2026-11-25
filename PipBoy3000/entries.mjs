// Pip-Boy 3003 - Schritt 0: Legacy-Bündelung
//
// Baut aus dem bestehenden Quellcode ein einziges, gebündeltes Skript. Die
// Modulreihenfolge, die bisher implizit in der `loadScript`-Kette von
// index.html steckte, steht ab jetzt an genau einer Stelle: ORDER.
//
// Der Loader meldet Doppel-Definitionen (eine spätere Datei überschreibt eine
// gleichnamige Methode) als Fehler, sobald sie nicht in KNOWN_OVERRIDES stehen.
// Damit kann kein weiterer "wer überschreibt wen"-Fehler unbemerkt entstehen.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));

// Reihenfolge = Abhängigkeitsgraph. Muss der bisherigen Ladereihenfolge in
// index.html entsprechen; Abweichungen ändern das Spielverhalten.
export const ORDER = [
  'src/data/data_core.js',
  'src/data/data_items.js',
  'src/data/data_item_icons.js',
  'src/data/data_recipes.js',
  'src/data/data_monsters.js',
  'src/data/data_minigames.js',
  'src/network.js',
  'src/ui/ui_core.js',
  'src/ui/ui_item_symbol.js',
  'src/game/game_core.js',
  'src/game/game_map.js',
  'src/game/world_air.js',
  'src/game/game_render.js',
  'src/game/game_world_gen.js',
  'src/game/game_inv_logic.js',
  'src/game/game_world_logic.js',
  'src/game/game_char_logic.js',
  'src/game/game_combat.js',
  'src/ui/ui_combat.js',
  'src/ui/ui_input.js',
  'src/ui/ui_view_inv.js',
  'src/ui/ui_view_world.js',
  'src/ui/ui_view_town.js',
  'src/ui/ui_view_journal.js',
  'src/ui/ui_view_camp.js',
  'src/ui/ui_render_core.js',
  'src/ui/ui_render_views.js',
  'src/ui/ui_render_minigames.js',
  'src/ui/ui_render_overlays.js',
  // Patch-Notizen und Update-Pruefung. Beide nur Darstellung, aber sie
  // gehoeren ans Ende: ui_update.js liest beim Start Game.state und Combat.
  'src/ui/ui_patch_notes.js',
  'src/ui/ui_update.js'
];

// Bewusste Überschreibungen. Jede Zeile ist eine Entscheidung, keine Zufallslage:
// die spätere Datei gewinnt. Wer hier etwas einträgt, muss begründen, warum die
// ältere Fassung entbehrlich ist. Ziel ist eine leere Liste.
export const KNOWN_OVERRIDES = [
  // game_render.js ersetzt die gleichnamige Funktion aus game_core.js.
  'Game.initCache',
  // ui_render_views.js ersetzt die V.A.T.S.-Ansicht aus ui_combat.js.
  // ui_combat.js bleibt geladen, weil es Combat.render aufruft.
  'UI.renderCombat',
  // ui_render_core.js ersetzt update() aus ui_core.js (AFK-Prüfung + HUD).
  'UI.update',
  // ui_render_core.js ersetzt den Hinweis aus ui_core.js.
  'UI.showMobileControlsHint',
  // ui_render_overlays.js ersetzt showGameOver aus ui_core.js.
  'UI.showGameOver',
  // ui_render_overlays.js ersetzt restoreOverlay aus ui_render_core.js.
  // ACHTUNG: die Fassung in ui_render_core.js legt #joystick-base an, die
  // Gewinner-Fassung nicht. Deshalb funktioniert der Touch-Joystick nicht.
  // Siehe docs/ANALYSE.md, Punkt B2.
  'UI.restoreOverlay',
];

// Zweiter Einstiegspunkt: die Verwaltungsseite admin.html. Sie teilt sich
// network.js mit dem Spiel, lädt aber keine Spiellogik.
// admin.js liest GameData.items und GameData.perks, deshalb die Datenmodule.
export const ADMIN_ORDER = [
  'src/data/data_core.js',
  'src/data/data_items.js',
  'src/network.js',
  'src/admin.js'
];

// Beide Einstiegspunkte als benannte Bündel. Jedes wird für sich geprüft:
// network.js steckt in beiden, ist aber pro Bündel genau einmal geladen.
export const BUNDLES = {game: ORDER, admin: ADMIN_ORDER};

export function files(order = ORDER) {
  return order.map(rel => ({rel, code: readFileSync(join(DIR, rel), 'utf8')}));
}

// Liest den Rumpf eines Objektliterals ab `from` (Position direkt nach der
// öffnenden Klammer) bis zur passenden schließenden Klammer.
function literalBody(code, from) {
  let depth = 1;
  let i = from;
  while (i < code.length && depth > 0) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
    i++;
  }
  return code.slice(from, i - 1);
}

// Sammelt die Methodennamen, die direkt auf der obersten Ebene eines
// Objektliterals liegen. Verschachtelte Unterobjekte (z. B. MiniGames.hacking)
// zählen nicht: dort heißen Methoden absichtlich wieder `init`/`end`.
export function definitions(code, objectNames) {
  const found = [];
  for (const obj of objectNames) {
    const patterns = [
      new RegExp(`(?:const|let|var)\\s+${obj}\\s*=\\s*\\{`, 'g'),
      new RegExp(`window\\.${obj}\\s*=\\s*\\{`, 'g'),
      new RegExp(`Object\\.assign\\(\\s*${obj}\\s*,\\s*\\{`, 'g')
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const body = literalBody(code, match.index + match[0].length);
        const name = /^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*:\s*(?:async\s+)?function/;
        let depth = 0;
        let lineStart = true;
        for (let i = 0; i < body.length; i++) {
          const ch = body[i];
          if (ch === '{' || ch === '(' || ch === '[') depth++;
          else if (ch === '}' || ch === ')' || ch === ']') depth--;
          else if (ch === '\n') lineStart = true;
          if (lineStart && depth === 0 && (ch === ' ' || ch === '\t' || ch === '\n')) continue;
          if (lineStart && depth === 0) {
            const rest = body.slice(i);
            const hit = rest.match(name);
            if (hit) found.push({object: obj, name: hit[1]});
            lineStart = false;
          } else if (depth === 0 && ch === ',') {
            lineStart = true;
          }
        }
      }
    }
  }
  return found;
}

export const OBJECT_NAMES = ['Game', 'UI', 'Combat', 'WorldGen', 'Network', 'MiniGames', 'Admin'];

// Liefert alle Überschreibungen in Ladereihenfolge. Jeder Eintrag nennt die
// Datei, die gewinnt, und die, die verdeckt wird.
export function overrides(loaded = files()) {
  const seen = new Map();
  const result = [];
  for (const {rel, code} of loaded) {
    for (const {object, name} of definitions(code, OBJECT_NAMES)) {
      const key = `${object}.${name}`;
      if (seen.has(key)) {
        result.push({key, winner: rel, shadowed: seen.get(key)});
      }
      seen.set(key, rel);
    }
  }
  return result;
}

export function unapprovedOverrides(loaded = files()) {
  return overrides(loaded).filter(entry => !KNOWN_OVERRIDES.includes(entry.key));
}

export function unusedOverrides(loaded = files()) {
  const present = new Set(overrides(loaded).map(entry => entry.key));
  return KNOWN_OVERRIDES.filter(key => !present.has(key));
}
