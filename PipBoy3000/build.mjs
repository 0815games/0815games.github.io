// Pip-Boy 3003 - Build
//
// GitHub Pages liefert dieses Repository direkt aus dem Branch main/ an der
// Wurzel aus (build_type: legacy). Der fertige Stand muss deshalb *im*
// Spielordner liegen, nicht in einem dist/ daneben. Der Build schreibt:
//
//   PipBoy3000/index.html   Startseite (aus shell/index.html)
//   PipBoy3000/admin.html   Verwaltung  (aus shell/admin.html)
//   PipBoy3000/app.js       ein Bündel statt 26 Einzeldateien
//   PipBoy3000/admin.js     Bündel der Verwaltung
//   PipBoy3000/app.css      gebautes Tailwind statt Play-CDN
//   PipBoy3000/templates/   HTML-Templates (unverändert)
//   PipBoy3000/Version      Versionsstempel
//
// Quellen liegen in src/, shell/ und templates/. Der Build räumt seine eigenen
// Artefakte vorher weg, damit keine veralteten Bündel liegen bleiben.
//
//   node build.mjs           baut
//   node build.mjs --check   prüft nur, schreibt nichts (für Tests und CI)
import {build} from 'esbuild';
import {readFile, readdir, rm, stat, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {ADMIN_ORDER, BUNDLES, ORDER, files, unapprovedOverrides, unusedOverrides} from './entries.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CHECK = process.argv.includes('--check');

// Was der Build erzeugt. Genau diese Pfade werden vor dem Schreiben entfernt.
// templates/ ist Quelle und darf hier nicht stehen - es wird mit ausgeliefert,
// aber nicht erzeugt.
const ARTIFACTS = [
  'style.css','index.html', 'admin.html', 'app.js', 'admin.js', 'app.css', 'build.json', 'Version'];

// Die Reihenfolge in entry.js muss ORDER entsprechen. Zwei Listen, die
// auseinanderlaufen, wären genau der Fehler, den dieser Build verhindern soll.
async function checkEntryOrder(file, order) {
  const source = await readFile(join(ROOT, file), 'utf8');
  const imported = [...source.matchAll(/^import\s+'\.\/(.+?)';/gm)].map(m => m[1]);
  if (imported.join('\n') === order.join('\n')) return;
  fail(
    `${file} und die Ladereihenfolge in entries.mjs stimmen nicht überein.\n` +
      `  nur in ${file}: ${imported.filter(f => !order.includes(f)).join(', ') || '-'}\n` +
      `  nur in der Reihenfolge: ${order.filter(f => !imported.includes(f)).join(', ') || '-'}`
  );
}

function fail(message) {
  const error = new Error(message);
  error.buildFailure = true;
  throw error;
}

// Prüft den Quellstand, bevor gebaut wird. Ein Verstoß bricht den Build ab -
// lieber kein Bündel als ein Bündel mit unbemerkter Überschreibung.
async function preflight() {
  await checkEntryOrder('entry.js', ORDER);
  await checkEntryOrder('entry-admin.js', ADMIN_ORDER);

  const problems = [];

  // Jedes Bündel wird für sich geprüft. Eine Überschreibung ist nur zulässig,
  // wenn sie in KNOWN_OVERRIDES begründet ist.
  for (const [name, order] of Object.entries(BUNDLES)) {
    const unapproved = unapprovedOverrides(files(order));
    if (unapproved.length > 0) {
      problems.push(
        `Unbestätigte Doppel-Definition(en) im Bündel "${name}":\n` +
          unapproved.map(o => `  ${o.key}: ${o.shadowed} wird von ${o.winner} verdeckt`).join('\n') +
          '\n  Entweder die verdeckte Fassung entfernen oder in entries.mjs unter KNOWN_OVERRIDES begründen.'
      );
    }
  }

  const stale = unusedOverrides();
  if (stale.length > 0) {
    problems.push(`KNOWN_OVERRIDES nennt nicht mehr vorhandene Überschreibungen: ${stale.join(', ')}`);
  }

  const known = new Set([...ORDER, ...ADMIN_ORDER]);
  const orphaned = (await collectSources()).filter(f => !known.has(f));
  if (orphaned.length > 0) {
    problems.push(
      `Datei(en) in src/, die von keiner Ladereihenfolge erreicht werden (toter Code): ${orphaned.join(', ')}`
    );
  }

  for (const file of [...ORDER, ...ADMIN_ORDER, 'shell/index.html', 'shell/admin.html', 'shell/style.css', 'shell/Version']) {
    try {
      await stat(join(ROOT, file));
    } catch {
      problems.push(`Fehlende Datei: ${file}`);
    }
  }

  if (problems.length > 0) fail(problems.join('\n\n'));
}

async function collectSources() {
  const found = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, {withFileTypes: true})) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.js')) found.push(relative(ROOT, full).split('\\').join('/'));
    }
  }
  await walk(join(ROOT, 'src'));
  return found.sort();
}

// Tailwind ohne Play-CDN: einmal zur Buildzeit über den Quelltext laufen lassen
// und nur die tatsächlich verwendeten Klassen erzeugen.
async function buildCss() {
  const {default: tailwindcss} = await import('tailwindcss');
  const postcss = (await import('postcss')).default;
  const config = {
    content: [
      join(ROOT, 'src/**/*.js'),
      join(ROOT, 'shell/*.html'),
      join(ROOT, 'templates/*.html')
    ],
    theme: {extend: {fontFamily: {mono: ['VT323', 'ui-monospace', 'monospace']}}},
    corePlugins: {preflight: false}
  };
  const input = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
  const result = await postcss([tailwindcss(config)]).process(input, {from: undefined});
  // app.css bleibt reines Tailwind-CSS. shell/style.css ist handgeschrieben,
  // bleibt unangetastet und wird als eigene Datei ausgeliefert (siehe unten).
  return result.css;
}

async function bundle(entry, name) {
  const result = await build({
    entryPoints: [join(ROOT, entry)],
    bundle: true,
    format: 'iife',
    target: ['es2020'],
    charset: 'utf8',
    legalComments: 'none',
    outfile: join(ROOT, name),
    write: false,
    logLevel: 'silent'
  });
  return result.outputFiles[0].text;
}

export async function run({check = CHECK} = {}) {
  await preflight();

  const version = (await readFile(join(ROOT, 'shell', 'Version'), 'utf8')).trim();
  const js = await bundle('entry.js', 'app.js');
  const adminJs = await bundle('entry-admin.js', 'admin.js');
  const css = await buildCss();
  const indexHtml = await renderShell('index.html', version, {game: true});
  const adminHtml = await renderShell('admin.html', version, {game: false});
  const manifest = {
    version,
    scripts: ORDER.length,
    bytes: {
      js: Buffer.byteLength(js),
      admin: Buffer.byteLength(adminJs),
      css: Buffer.byteLength(css),
      html: Buffer.byteLength(indexHtml)
    },
    sha256: {
      js: createHash('sha256').update(js).digest('hex').slice(0, 16),
      css: createHash('sha256').update(css).digest('hex').slice(0, 16)
    }
  };

  if (!check) {
    for (const artifact of ARTIFACTS) {
      await rm(join(ROOT, artifact), {recursive: true, force: true});
    }
    await writeFile(join(ROOT, 'index.html'), indexHtml);
    await writeFile(join(ROOT, 'admin.html'), adminHtml);
    await writeFile(join(ROOT, 'app.js'), js);
    await writeFile(join(ROOT, 'admin.js'), adminJs);
    await writeFile(join(ROOT, 'app.css'), css);
    // shell/style.css bleibt die Quelle, wird aber mit ausgeliefert: die
    // Hüllseite verlinkt style.css, und Pages liefert nur diesen Ordner.
    await writeFile(join(ROOT, 'style.css'), await readFile(join(ROOT, 'shell', 'style.css')));
    await writeFile(join(ROOT, 'build.json'), JSON.stringify(manifest, null, 2) + '\n');
    await writeFile(join(ROOT, 'Version'), `${version}\n`);
  }

  return manifest;
}

// Ersetzt in den Hüllseiten genau die Stellen, die mit dem Ladesystem zu tun
// haben. Alles andere bleibt unangetastet.
async function renderShell(file, version, {game}) {
  let html = await readFile(join(ROOT, 'shell', file), 'utf8');

  html = html.replace(/[ \t]*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\n/, '');
  html = html.replace(
    /[ \t]*<script>document\.write\('<link rel="stylesheet" href="style\.css\?v=' \+ Date\.now\(\) \+ '">'\);<\/script>\n/,
    `    <link rel="stylesheet" href="app.css?v=${version}">\n    <link rel="stylesheet" href="style.css?v=${version}">\n`
  );

  if (game) {
    // Die Hüllseite enthält nur noch Marker, keinen dynamischen Ladeteil. Damit
    // kann der Build nichts mitten in einem Block abschneiden - genau das war
    // beim ersten Versuch passiert und ergab ein Syntaxfehler-HTML.
    const marker = /[ \t]*\/\/ BUILD:LOADER-START[\s\S]*?\/\/ BUILD:LOADER-ENDE\n/;
    if (!marker.test(html)) {
      fail('shell/index.html: die BUILD:LOADER-Marker wurden nicht gefunden.');
    }
    html = html.replace(
      marker,
      `                if (typeof UI !== 'undefined') UI.init();\n` +
        `                scriptsLoaded = true;\n`
    );

    // Das Bündel wird am Ende eingebunden - vorher, damit die Prüfungen unten
    // die fertige Seite sehen und nicht die halbe.
    html = html.replace('</body>', `    <script src="app.js?v=${version}"></script>\n</body>`);

    // Prüfungen am Ergebnis: die Seite muss ausliefern, was der Build erwartet.
    if (/loadScript\(/.test(html)) fail('shell/index.html enthält nach dem Umbau noch "loadScript(".');
    if (!html.includes('scriptsLoaded = true;')) fail('shell/index.html setzt scriptsLoaded nicht - Boot bliebe hängen.');
    if (!html.includes('src="app.js')) fail('shell/index.html lädt app.js nicht.');

    // Ein Syntaxfehler in der Hüllseite ist im Browser ein weißer Bildschirm.
    // Deshalb wird das Inline-Skript vor dem Schreiben geprüft.
    const inline = html.match(/<script>\s*\n\s*let scriptsLoaded[\s\S]*?<\/script>/);
    if (!inline) fail('shell/index.html: Inline-Skript nicht gefunden.');
    try {
      new Function(inline[0].replace(/^<script>/, '').replace(/<\/script>$/, ''));
    } catch (error) {
      fail(`shell/index.html: Inline-Skript ist kein gültiges JavaScript (${error.message}).`);
    }
  } else {
    const boot = /<script>\s*\n\s*\/\/ INITIALIZATION SCRIPT[\s\S]*?<\/script>/;
    if (!boot.test(html)) fail('shell/admin.html: das Initialisierungsskript wurde nicht gefunden.');
    // Die dort gesetzten Attrappen bleiben nötig: admin.js prüft sie, bevor die
    // echten Datenmodule greifen.
    html = html.replace(
      boot,
      '<script>\n    window.Game = { items: {}, recipes: [] };\n    window.GameData = { items: {}, recipes: [], monsters: {} };\n</script>'
    );
    html = html.replace(
      '</body>',
      `    <script crossorigin src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>\n    <script src="admin.js?v=${version}"></script>\n</body>`
    );
    if (/load\('(data|network|admin)/.test(html)) fail('shell/admin.html lädt nach dem Umbau noch Einzeldateien.');
  }

  return html;
}

if (process.argv[1] && relative(ROOT, process.argv[1]) === 'build.mjs') {
  run()
    .then(manifest => {
      const kb = n => `${(n / 1024).toFixed(1)} kB`;
      console.log(
        `Pip-Boy ${manifest.version}: ${manifest.scripts} Module gebündelt -> ` +
          `app.js ${kb(manifest.bytes.js)}, admin.js ${kb(manifest.bytes.admin)}, app.css ${kb(manifest.bytes.css)}` +
          (CHECK ? ' (nur geprüft)' : '')
      );
    })
    .catch(error => {
      console.error(error.buildFailure ? error.message : error);
      process.exit(1);
    });
}
