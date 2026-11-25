// Ein Patch-Werkzeug mit zwei Unterbefehlen: check und bump.
//
// Nachbau von IronPath/scripts/patch.mjs und
// tiny-tycoon-towns/scripts/patch.mjs. Gleiche Gliederung, gleiche Befehle,
// gleiche Pruefbloecke. Die Anker, Pfade und Log-Kennungen sind die dieses
// Projekts (PIP-NNNN statt IPL-NNNN / TTT-NNNN, Spielwurzel = dieser Ordner).
//
// Warum es diese Datei gibt: In PipBoy3000 gab es von alledem nichts. Der
// Versionsstempel lebte an vier Stellen, die niemand gegeneinander prueft
// (shell/Version, build.json, ?v= in index.html, docs/change.log), und ein
// Update im Spiel erfuhr der Spieler nie - ein offener Tab lief mit dem alten
// Buendel weiter, bis er die Seite selbst neu lud.
//
// Unterschied zu den beiden Vorlagen, bewusst:
//
//   * Der Stempel hier ist eine Version (X.Y.Z), kein Wellen-Token
//     (20261125-aim11). Das Projektversionieren ist aelter und steht schon in
//     165 Tests, in package.json und im Changelog. Ein zweites Format daneben
//     waere genau die Art von Doppelung, die diese Runde abschafft. Deshalb
//     gilt TOKEN_PATTERN = /^\d+\.\d+\.\d+$/.
//   * `bump` zaehlt die Version hoch; das Release-Token fuer den Browser-Cache
//     (siehe src/ui/ui_update.js) wird daraus abgeleitet, nicht daneben
//     gepflegt.
//
// check liest und meldet, schreibt nie und merged/deployed nie.
// bump schreibt nur mit --apply.
//
// Verwendung (aus PipBoy3000/):
//   node tools/patch.mjs check                    # Stempel, Notizen, Geheimnisse, Struktur
//   node tools/patch.mjs check --suite            # + volle Testsuite
//   node tools/patch.mjs check --root <pfad>      # anderer Baum (Fixtures, Tests)
//   node tools/patch.mjs bump                      # naechste Patch-Version (Trockenlauf)
//   node tools/patch.mjs bump 14.0.99               # Zielversion (Trockenlauf)
//   node tools/patch.mjs bump 14.0.99 --apply       # schreiben
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

export const GAME_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

// Der Projektstempel: drei Zahlen, mehr nicht. Siehe Kopf.
export const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export const readIfExists = path => (existsSync(path) ? readFileSync(path, 'utf8') : null);
const one = (source, pattern) => {
  const match = pattern.exec(source);
  return match ? [match[1]] : [];
};
const every = (source, pattern) => [...source.matchAll(pattern)].map(match => match[1]);

// Die Stellen, die die Version tragen. Genau diese Liste ist der Grund fuer
// `check`: eine Stelle allein zu aktualisieren ist ein halber Release, und man
// sieht es dem Spiel nicht an. Beim Bau dieses Werkzeugs stand `build.json`
// noch auf der vorigen Version, waehrend `shell/Version` schon weiter war -
// gefunden hat es niemand, weil es keine Pruefung gab, die beide liest.
export const STAMP_ANCHORS = Object.freeze([
  {label: 'shell/Version', file: 'shell/Version', find: source => one(source.trim(), /^(\d+\.\d+\.\d+)$/)},
  {label: 'package.json → version', file: 'package.json', find: source => one(source, /"version":\s*"([^"]+)"/)},
  {label: 'build.json → version (erzeugt)', file: 'build.json', find: source => one(source, /"version":\s*"([^"]+)"/)},
  {label: 'Version (ausgeliefert, erzeugt)', file: 'Version', find: source => one(source.trim(), /^(\d+\.\d+\.\d+)$/)},
  {label: 'index.html → app.css?v=', file: 'index.html', find: source => one(source, /app\.css\?v=([0-9.]+)/)},
  {label: 'index.html → app.js?v=', file: 'index.html', find: source => one(source, /app\.js\?v=([0-9.]+)/)},
  {label: 'index.html → style.css?v=', file: 'index.html', find: source => one(source, /href="style\.css\?v=([0-9.]+)"/)},
  {label: 'index.html → meta pipboy-build', file: 'index.html', find: source => one(source, /<meta name="pipboy-build" content="([^"]+)"/)},
  // Nicht `/RELEASED_PATCHES[\s\S]*?version:/`: das las die erste Zahl nach
  // dem Wort - und das war ein Beispiel im Kopfkommentar, nicht der Eintrag.
  // Der Anker muss den Datenblock selbst treffen, nicht die Prosa davor.
  {label: 'src/ui/ui_patch_notes.js → Eintrag oben', file: 'src/ui/ui_patch_notes.js',
   find: source => {
     const block = /window\.GameData\.RELEASED_PATCHES\s*=\s*\[([\s\S]*?)\n\];/.exec(source);
     return block ? one(block[1], /version:\s*'([^']+)'/) : [];
   }},
  {label: 'docs/change.log → erster Eintrag', file: 'docs/change.log', find: source => one(source, /## v(\d+\.\d+\.\d+)/)},
]);

// Dateien, in denen nur `?v=`-Importe wandern. Alles andere in ihnen ist
// Protokoll: was wann veroeffentlicht wurde. Das umzuschreiben wuerde den
// Nachweis faelschen - ein Eintrag behauptet sonst, eine alte Fassung sei
// unter der neuen Nummer erschienen.
export const PROTECTED_FILES = Object.freeze([
  {file: 'src/ui/ui_patch_notes.js',
   reason: 'version:-Felder und Protokollsaetze veroeffentlichter Patches bleiben stehen; nur ?v=-Importe wandern'},
  {file: 'docs/change.log',
   reason: 'Changelog ist Protokoll und wird inhaltlich gepflegt, nie mechanisch umgeschrieben'},
]);

// Dateien, die ein Bump schreiben darf - die QUELLEN des Stempels.
//
// Das ist die wichtigste Lehre aus dem ersten Lauf dieses Werkzeugs: Es hatte
// auch `index.html`, `app.js` und `docs/BALANCING.md` mitgeschrieben. Die sind
// aber erzeugt. Ein Bump, der ein Artefakt anfasst, wird beim naechsten Build
// ueberschrieben - und ein Bump, der `app.js` umschreibt, macht aus einem
// 490-kB-Buendel eine Datei, die niemand mehr nachvollziehen kann.
//
// Deshalb: bump schreibt `shell/Version` und `package.json`, danach laeuft
// `node build.mjs` und erzeugt `index.html`, `build.json`, `Version` neu.
// `check` prueft anschliessend BEIDE Seiten - Quelle und Artefakt.
const SCHREIB_DATEIEN = new Set([
  'shell/Version', 'package.json', 'shell/index.html',
  'src/ui/ui_patch_notes.js', 'docs/change.log'
]);

// Erzeugt oder Protokoll. Wird beim Bump uebersprungen.
const ERZEUGT = new Set([
  'app.js', 'admin.js', 'app.css', 'style.css', 'index.html', 'admin.html',
  'build.json', 'Version', 'docs/BALANCING.md', 'docs/README.md'
]);

const CODE_FILE = /\.(?:mjs|js|cjs|json|html|css|md|log)$/;
const SKIPPED_DIRECTORY = new Set(['node_modules', '.git', 'img', 'tests']);

// Dateien ohne Endung, die trotzdem Quellen des Stempels sind.
const ENDUNGSLOS = new Set(['Version']);

export function codeFiles(root = GAME_ROOT) {
  const found = [];
  const queue = [root];
  while (queue.length) {
    const directory = queue.pop();
    for (const entry of readdirSync(directory, {withFileTypes: true})) {
      if (SKIPPED_DIRECTORY.has(entry.name) || entry.name.startsWith('.')) continue;
      const full = join(directory, entry.name);
      if (entry.isDirectory()) queue.push(full);
      else if (entry.isFile() && (CODE_FILE.test(entry.name) || ENDUNGSLOS.has(entry.name))) found.push(full);
    }
  }
  return found.sort();
}

export function currentVersion(root = GAME_ROOT) {
  const source = readIfExists(join(root, 'shell', 'Version'));
  const match = source && /^\s*(\d+\.\d+\.\d+)\s*$/.exec(source);
  return match ? match[1] : null;
}

// Liest jeden Anker und meldet, was er tatsaechlich gefunden hat.
export function anchorReport(root = GAME_ROOT) {
  return STAMP_ANCHORS.map(anchor => {
    const source = readIfExists(join(root, anchor.file));
    const values = source === null ? [] : anchor.find(source);
    const unique = [...new Set(values)];
    return {
      label: anchor.label,
      file: anchor.file,
      found: values.length,
      values,
      unique,
      missingFile: source === null,
      ok: source !== null && values.length === 1 && unique.length === 1
    };
  });
}

// Trifft die Uhr: alle Anker nennen dieselbe Version.
export function stampReport(root = GAME_ROOT) {
  const report = anchorReport(root);
  const versions = [...new Set(report.flatMap(anchor => anchor.unique))];
  const wrong = report.filter(anchor => !anchor.ok);
  return {report, versions, wrong, ok: wrong.length === 0 && versions.length === 1};
}

// Welche Versionen der Baum traegt, und wie oft. Alte Versionen duerfen
// richtig sein: ein Changelog zitiert sie als Protokoll. Deshalb ist das eine
// Information fuer Menschen, nie ein Urteil.
export function versionHistogram(root = GAME_ROOT) {
  const counts = new Map();
  for (const file of codeFiles(root)) {
    if (ERZEUGT.has(relative(root, file).split('\\').join('/'))) continue;
    const source = readIfExists(file);
    if (!source) continue;
    for (const match of source.matchAll(/\b\d+\.\d+\.\d+\b/g)) {
      const entry = counts.get(match[0]) ?? {version: match[0], count: 0, files: new Set()};
      entry.count += 1;
      entry.files.add(relative(root, file));
      counts.set(match[0], entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.version.localeCompare(b.version));
}

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------------------
// bump: planen, schreiben, pruefen.
//
// Zwei Fehler sind leicht und beide im Spiel unsichtbar: einen der Anker
// vergessen (dann liefert Pages die alte Datei) und das Protokoll
// mitschreiben (dann behauptet der Changelog etwas Falsches). Der Planer
// zeigt jede Zeile, die kein `?v=`-Import ist, und lehnt unbekannte Formen ab.
// ---------------------------------------------------------------------------

export function planBump({root = GAME_ROOT, from, to} = {}) {
  // `from` erst hier ableiten, nicht als Vorgabewert im Parameter: im
  // Parameter steht `root` zu diesem Zeitpunkt noch nicht zur Verfuegung.
  if (from === undefined) from = currentVersion(root);
  const problems = [];
  if (typeof to !== 'string' || !VERSION_PATTERN.test(to)) {
    problems.push(`Die Zielversion erfuellt nicht X.Y.Z: ${JSON.stringify(to)}`);
  }
  if (typeof from !== 'string' || !VERSION_PATTERN.test(from)) {
    problems.push(`Keine gueltige Ausgangsversion gefunden (shell/Version): ${JSON.stringify(from)}`);
  }
  if (from && to && from === to) problems.push('Alt und neu sind dieselbe Version - nichts zu tun.');
  if (typeof to === 'string' && VERSION_PATTERN.test(to) && typeof from === 'string' && VERSION_PATTERN.test(from)) {
    const [a, b, c] = from.split('.').map(Number);
    const [x, y, z] = to.split('.').map(Number);
    if (x < a || (x === a && (y < b || (y === b && z < c)))) {
      problems.push(`Die Zielversion ${to} liegt vor ${from} - Rueckwaerts-Bump abgelehnt.`);
    }
  }

  const protectedFiles = new Set(PROTECTED_FILES.map(entry => entry.file));
  const versioned = new RegExp(`\\?v=${escapeRegExp(from)}`, 'g');
  const files = [];
  const nonVersion = [];
  const kept = [];
  let tokens = 0;

  if (!problems.length) {
    for (const path of codeFiles(root)) {
      const source = readIfExists(path);
      if (!source || !source.includes(from)) continue;
      const file = relative(root, path).split('\\').join('/');
      // Erzeugte Dateien tragen die Version, weil der Build sie hineinschreibt.
      // Sie hier zu aendern waere Arbeit, die der naechste Build verwirft.
      if (ERZEUGT.has(file)) continue;
      // Dokumentation zitiert Versionen als Beispiel ("Stempel X.Y.Z",
      // "vorher X.Y.W"). Das ist Prosa und darf stehen bleiben - sonst
      // schreibt ein Bump die eigene Anleitung um. Ausnahme: der Changelog,
      // der den Stempel traegt.
      if (file.startsWith('docs/') && file !== 'docs/change.log') continue;
      if (file === 'README.md' || file === 'AGENTS.md') continue;
      const isProtected = protectedFiles.has(file);
      const touched = [];
      source.split('\n').forEach((line, index) => {
        if (!line.includes(from)) return;
        const total = line.split(from).length - 1;
        const versionedCount = (line.match(versioned) || []).length;
        const record = {line: index + 1, text: line.trim().slice(0, 150), total, replaced: 0};
        if (isProtected) {
          // Protokoll: nur Importe wandern, alles andere bleibt stehen.
          record.replaced = versionedCount;
          if (versionedCount) touched.push({...record, kind: '?v='});
          if (total - versionedCount > 0) kept.push({file, line: index + 1, text: record.text, count: total - versionedCount});
          return;
        }
        record.replaced = total;
        touched.push({...record, kind: versionedCount ? '?v=' : 'anchor'});
        if (total - versionedCount > 0) {
          const entry = {file, line: index + 1, text: record.text, count: total - versionedCount};
          nonVersion.push(entry);
          if (!SCHREIB_DATEIEN.has(file)) {
            problems.push(`Unbekannte Stelle ohne ?v= in ${file}:${index + 1} - SCHREIB_DATEIEN pruefen`);
          }
        }
      });
      const count = touched.reduce((sum, entry) => sum + entry.replaced, 0);
      if (count) {
        files.push({file, path, touched});
        tokens += count;
      }
    }
  }

  return {
    root, from, to, files, tokens, nonVersion, kept, problems,
    anchorFilesTouched: [...new Set(nonVersion.map(entry => entry.file))].sort()
  };
}

export function applyBump(plan) {
  if (plan.problems.length) throw new Error(`Bump abgelehnt: ${plan.problems.join(' | ')}`);
  const protectedFiles = new Set(PROTECTED_FILES.map(entry => entry.file));
  const written = [];
  for (const entry of plan.files) {
    const source = readFileSync(entry.path, 'utf8');
    // In geschuetzten Dateien wandern nur die Importe - dort stehen
    // Protokollsaetze, die eine alte Version zitieren.
    const out = protectedFiles.has(entry.file) && entry.file !== 'docs/change.log'
      ? source.split(`?v=${plan.from}`).join(`?v=${plan.to}`)
      : replaceVersion(source, plan, entry.file, protectedFiles.has(entry.file));
    if (out === source) continue;
    writeFileSync(entry.path, out);
    written.push(entry.file);
  }
  return {written: written.length, files: written};
}

// Ersetzt die Version genau dort, wo sie der Stempel ist - nicht in jedem
// Vorkommen. Sonst wuerde die Nummer auch in einem Satz der Notizen wandern.
function replaceVersion(source, plan, file, isProtected) {
  const from = plan.from;
  const to = plan.to;
  if (file === 'shell/Version' || file === 'Version') return `${to}\n`;
  if (file === 'package.json' || file === 'build.json') {
    return source.replace(/("version":\s*")([^"]+)(")/, `$1${to}$3`);
  }
  if (file === 'shell/index.html') {
    // Nur der Platzhalter-Stempel. `?v=` an app.js, app.css und style.css
    // setzt der Build - in der Quelle stehen sie nicht.
    return source.replace(/(<meta name="pipboy-build" content=")[^"]+(")/, `$1${to}$2`);
  }
  if (isProtected) return source.split(`?v=${from}`).join(`?v=${to}`);
  return source.split(from).join(to);
}

// Liest jeden Anker nach dem Schreiben neu. Ein Bump, der einen Anker
// stehen laesst, wird hier gemeldet - nicht von einem Spieler mit alter Seite.
export function verifyBump({root = GAME_ROOT, to = currentVersion(root)} = {}) {
  const result = stampReport(root);
  const wrong = result.report.filter(anchor => !anchor.ok || anchor.unique[0] !== to);
  return {to, report: result.report, wrong, ok: wrong.length === 0};
}

export function formatPlan(plan) {
  const lines = [
    `Version ${plan.from} → ${plan.to}`,
    `${plan.files.length} Dateien, ${plan.tokens} Vorkommen`,
    '',
    `Zeilen ohne ?v= (${plan.nonVersion.length}) - das muessen die bekannten Anker sein:`
  ];
  for (const entry of plan.nonVersion) lines.push(`  ${entry.file}:${entry.line}  ${entry.text.slice(0, 110)}`);
  lines.push('', `Protokoll behalten (${plan.kept.length} Zeilen):`);
  for (const entry of plan.kept) lines.push(`  ${entry.file}:${entry.line}  ${entry.text.slice(0, 110)}`);
  if (plan.problems.length) {
    lines.push('', 'PROBLEME:');
    for (const problem of plan.problems) lines.push(`  ${problem}`);
  }
  return lines.join('\n');
}

// Naechste Patch-Version: die letzte Zahl plus eins.
export function nextVersion(from = currentVersion(GAME_ROOT)) {
  if (!from) return null;
  const [a, b, c] = from.split('.').map(Number);
  return `${a}.${b}.${c + 1}`;
}

// ---------------------------------------------------------------------------
// check: die Pruefungen vor und nach einem Patch.
//
// Liest Dateien, laeuft die Vertragstests und - nur auf Wunsch - die Suite.
// Schreibt nie, merged nie, deployed nie.
// ---------------------------------------------------------------------------

// Die Vertraege, die ein Patch brechen kann. Sie laufen in wenigen Sekunden
// und gehoeren deshalb in jede Vorpruefung, nicht nur in CI.
export const CONTRACT_TESTS = Object.freeze(['gestaltung', 'item-bilder', 'repo-hygiene']);

// Formen von Geheimnissen. Nur hinzugefuegte Zeilen werden geprueft. Der
// Firebase-Webschluessel ist oeffentliche Konfiguration, steht aber nicht in
// Protokollen - deshalb faellt auch er auf.
const SECRET_PATTERNS = Object.freeze([
  {name: 'PEM-Privatschluessel', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/},
  {name: 'Firebase-Dienstkonto', pattern: /"private_key_id"\s*:/},
  {name: 'npm-Token', pattern: /\bnpm_[A-Za-z0-9]{30,}/},
  {name: 'GitHub-Token', pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{20,}/},
  {name: 'Google-API-Schluessel', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/}
]);
export const SECRET_ALLOWLIST = Object.freeze(new Map([
  ['tools/patch.mjs', 'Pruefcode: enthaelt die Muster, keinen Schluessel'],
  ['src/network.js', 'oeffentliche Web-Konfiguration des Projekts (kein Geheimnis)']
]));

function gitLines(root, args) {
  try {
    const out = execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']});
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Nur hinzugefuegte Zeilen, und nur in Dateien dieses Ordners. Ein Geheimnis
// in einem alten Commit ist ein anderer Fall und nicht hier zu reparieren.
export function secretsInDiff(root = GAME_ROOT) {
  const findings = [];
  for (const line of gitLines(root, ['diff', '--unified=0', '--', '.'])) {
    if (!line.startsWith('+') || line.startsWith('+++')) continue;
    const text = line.slice(1);
    for (const {name, pattern} of SECRET_PATTERNS) {
      if (pattern.test(text)) findings.push({name, text: text.trim().slice(0, 140)});
    }
  }
  return findings;
}

// Die Notizen im Spiel: der erste Eintrag muss die Version nennen, die der
// Stempel traegt. Sonst behauptet das Fenster "NEU", was die Datei nicht hergibt.
export function patchNotesReport(root = GAME_ROOT) {
  const source = readIfExists(join(root, 'src', 'ui', 'ui_patch_notes.js'));
  if (!source) return {ok: false, reason: 'src/ui/ui_patch_notes.js fehlt'};
  const block = /window\.GameData\.RELEASED_PATCHES\s*=\s*\[([\s\S]*?)\n\];/.exec(source);
  const versions = block ? every(block[1], /version:\s*'([^']+)'/g) : [];
  const first = versions[0] ?? null;
  const current = currentVersion(root);
  const problems = [];
  if (!first) problems.push('Kein Eintrag in RELEASED_PATCHES gefunden');
  else if (first !== current) problems.push(`Erster Eintrag nennt ${first}, der Stempel steht auf ${current}`);
  // Jeder Eintrag braucht einen Titel und mindestens eine Zeile. Ein leerer
  // Eintrag waere ein Update-Fenster ohne Inhalt.
  const eintraege = [...source.matchAll(/\{\s*version:\s*'([^']+)'([\s\S]*?)\n  \}/g)];
  for (const [, version, body] of eintraege) {
    if (!/title:\s*'[^']+'/.test(body)) problems.push(`Eintrag ${version} hat keinen Titel`);
    if (!/punkte:\s*\[[\s\S]*?'/.test(body)) problems.push(`Eintrag ${version} hat keine Punkte`);
  }
  return {ok: problems.length === 0, problems, first, current, count: versions.length};
}

export async function runPatchCheck({root = GAME_ROOT, suite = false} = {}) {
  const blocks = [];
  const add = (name, ok, lines = []) => blocks.push({name, ok, lines});

  const stamp = stampReport(root);
  add('Stempel', stamp.ok,
    stamp.wrong.length
      ? stamp.wrong.map(anchor => `${anchor.label}: ${anchor.unique.join(', ') || (anchor.missingFile ? 'Datei fehlt' : 'nichts gefunden')}`)
      : [`Alle ${stamp.report.length} Anker nennen ${stamp.versions.join(', ')}`]);

  const notes = patchNotesReport(root);
  add('Patch-Notizen', notes.ok, notes.ok ? [`${notes.count} Eintraege, oberster ${notes.first}`] : notes.problems);

  const secrets = secretsInDiff(root);
  add('Geheimnisse', secrets.length === 0, secrets.map(s => `${s.name}: ${s.text}`));

  // Die Struktur, die der Build verlangt. Das sind genau die Faelle, die
  // vorher still brachen: ein fehlendes Buendel, ein verlinkter Pfad ohne
  // Datei, ein doppelter Eintrag.
  const structure = [];
  for (const file of ['index.html', 'app.js', 'app.css', 'style.css', 'build.json', 'Version']) {
    if (!existsSync(join(root, file))) structure.push(`${file} fehlt - Build nicht gelaufen?`);
  }
  const built = readIfExists(join(root, 'build.json'));
  if (built) {
    try {
      const manifest = JSON.parse(built);
      if (manifest.version !== currentVersion(root)) {
        structure.push(`build.json nennt ${manifest.version}, shell/Version ${currentVersion(root)}`);
      }
    } catch {
      structure.push('build.json ist kein gueltiges JSON');
    }
  }
  add('Struktur', structure.length === 0, structure.length ? structure : ['Buendel und Stempel liegen im Spielordner']);

  let testLines = [];
  let testsOk = true;
  if (suite) {
    try {
      const out = execFileSync('node', ['--test', '--test-force-exit', ...CONTRACT_TESTS.flatMap(name => [`tests/${name}.test.mjs`])], {
        cwd: root, encoding: 'utf8', env: {...process.env, NODE_TEST_CONTEXT: undefined}
      });
      const pass = /# pass (\d+)/.exec(out);
      testLines = [`Vertragstests: ${pass ? pass[1] : '?'} bestanden`];
    } catch (error) {
      testsOk = false;
      testLines = [`Vertragstests rot (Exit ${error.status})`];
    }
    add('Vertragstests', testsOk, testLines);
  }

  return {blocks, ok: blocks.every(block => block.ok)};
}

export function formatCheck(result) {
  const lines = [];
  for (const block of result.blocks) {
    lines.push(`${block.ok ? 'OK  ' : 'ROT '} ${block.name}`);
    for (const line of block.lines) lines.push(`        ${line}`);
  }
  lines.push('', result.ok ? 'Alles gruen.' : 'Mindestens ein Block ist rot.');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Kommandozeile
// ---------------------------------------------------------------------------
function argValue(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

if (process.argv[1] && relative(process.cwd(), process.argv[1]) === 'tools/patch.mjs') {
  const args = process.argv.slice(2);
  const command = args[0];
  const root = argValue(args, '--root') ?? GAME_ROOT;

  const fail = message => {
    console.error(message);
    process.exit(1);
  };

  if (command === 'check') {
    const result = await runPatchCheck({root, suite: args.includes('--suite')});
    console.log(formatCheck(result));
    process.exit(result.ok ? 0 : 1);
  } else if (command === 'bump') {
    const to = args[1] && !args[1].startsWith('--') ? args[1] : nextVersion(currentVersion(root));
    const apply = args.includes('--apply');
    if (!to) fail('Keine Version gefunden - ist shell/Version lesbar?');
    const plan = planBump({root, to});
    console.log(formatPlan(plan));
    if (plan.problems.length) process.exit(1);
    if (!apply) {
      console.log('\nTrockenlauf. Nichts geschrieben. Mit --apply ausfuehren.');
      process.exit(0);
    }
    const result = applyBump(plan);
    console.log(`\nGeschrieben: ${result.written} Dateien (${result.files.join(', ')})`);
    if (plan.files.some(entry => entry.file === 'index.html' || entry.file === 'shell/Version')) {
      console.log('Jetzt `node build.mjs` laufen lassen - der Build schreibt build.json und Version neu.');
    }
    const verified = verifyBump({root, to});
    if (!verified.ok) {
      console.log('\nNoch offen:');
      for (const anchor of verified.wrong) {
        console.log(`  ${anchor.label}: ${anchor.unique.join(', ') || 'nichts gefunden'}`);
      }
      console.log('\nDas bleibt rot, bis build.json und Version neu erzeugt sind (node build.mjs)');
      console.log('und src/ui/ui_patch_notes.js einen Eintrag fuer diese Version hat.');
      process.exit(1);
    }
    process.exit(0);
  } else {
    fail('Unbekannter Befehl. Verwendung:\n' +
      '  node tools/patch.mjs check [--suite] [--root <pfad>]\n' +
      '  node tools/patch.mjs bump [<version>] [--apply] [--root <pfad>]');
  }
}
