'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'arcade/dashboard.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'arcade/dashboard.js'), 'utf8');
const games = JSON.parse(fs.readFileSync(path.join(root, 'arcade/games.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

assert.equal(games.length, 4, 'die Spielzentrale enthält genau vier Titel');
assert.deepEqual(games.map(game => game.id), ['pipboy', 'tiny-tycoon-towns', 'ironpath', 'schattengruft']);
assert.ok(!/<iframe\b/i.test(html), 'Spiele werden nicht in eingebetteten Frames geladen');
assert.ok(!source.includes('createElement(\'iframe\')'));
assert.match(html, /data-dashboard-version="3\.3\.0"/);
assert.match(html, /rel="manifest" href="manifest\.webmanifest\?v=3\.3\.0"/);
assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/);
assert.match(html, /rel="apple-touch-icon" sizes="180x180"/);
assert.equal(manifest.name, '0815 Games');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
assert.equal(manifest.icons.length, 3, 'Manifest enthält 192px-, 512px- und Maskable-Icons');
assert.equal(manifest.shortcuts.length, 4, 'Manifest-Kurzbefehle verlinken alle vier Spiele');
assert.match(serviceWorker, /caches\.open\(CACHE_NAME\)/);
assert.match(serviceWorker, /\.\/arcade\/art\/schattengruft-artwork\.jpg/);
assert.match(source, /serviceWorker\.register\('\.\/sw\.js'/);
for (const icon of manifest.icons) {
  const file = path.join(root, icon.src);
  assert.ok(fs.existsSync(file), `PWA-Icon vorhanden: ${icon.src}`);
  const png = fs.readFileSync(file);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${icon.src} ist ein PNG`);
  const [width, height] = icon.sizes.split('x').map(Number);
  assert.equal(png.readUInt32BE(16), width, `${icon.src} hat die deklarierte Breite`);
  assert.equal(png.readUInt32BE(20), height, `${icon.src} hat die deklarierte Höhe`);
}
for (const iconPath of ['arcade/icons/apple-touch-icon.png', 'arcade/icons/favicon.ico', 'arcade/icons/favicon-16.png', 'arcade/icons/favicon-32.png', 'arcade/safari-pinned-tab.svg']) {
  assert.ok(fs.existsSync(path.join(root, iconPath)), `iOS-/Browser-Icon vorhanden: ${iconPath}`);
}
assert.deepEqual(manifest.shortcuts.map(shortcut => shortcut.url), games.map(game => game.path));
assert.ok(!html.includes('class="intro"'), 'der zusätzliche Intro-Text ist entfernt');
assert.ok(!html.includes('class="section-heading"'), 'über den Spielkacheln steht keine Überschrift mehr');
assert.ok(!html.includes('class="site-header"') && !html.includes('class="site-footer"'), 'sichtbar bleiben die Kacheln und die Mobile-Navigation');
assert.match(html, /id="game-grid"/);
assert.equal((html.match(/data-game-card/g) || []).length, 4, 'vier auswählbare Spiele-Karten');
assert.equal((html.match(/data-game-select=/g) || []).length, 4, 'vier direkte Mobile-Auswahltasten');
assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'Desktop zeigt alle vier Titel nebeneinander');
assert.ok(css.includes('.game-grid[data-mobile-ready="true"] .game-card{display:none}'), 'Mobile blendet nicht ausgewählte Titel aus');
assert.match(source, /touchstart/);
assert.match(source, /Math\.abs\(dy\) > 48/);
assert.match(source, /select\(active \+ \(dy < 0 \? 1 : -1\)\)/);
assert.ok(css.includes('.game-art{aspect-ratio:1.19;touch-action:pan-x}'), 'vertikale Swipes auf dem Bild bleiben für die Spielauswahl verfügbar');
assert.match(source, /'arrowleft'/);
assert.match(source, /'arrowright'/);
assert.match(source, /'arrowup'/);
assert.match(source, /'arrowdown'/);
assert.match(source, /'a', 'w'/);
assert.match(source, /'d', 's'/);
assert.match(source, /event\.key === 'Enter'/);
assert.match(source, /event\.code === 'Space'/);
assert.match(source, /launchSelected/);
assert.match(source, /previous-game/);

for (const game of games) {
  assert.ok(fs.existsSync(path.join(root, game.path)), `Spiel vorhanden: ${game.path}`);
  assert.ok(fs.existsSync(path.join(root, game.image)), `Vorschaubild vorhanden: ${game.image}`);
  assert.ok(html.includes(`href="${game.path}"`), `Spiel ist auf der Startseite verlinkt: ${game.path}`);
}
assert.ok(html.includes('src="arcade/art/schattengruft-artwork.jpg"'), 'Schattengruft nutzt die neue Artwork-Datei');
for (const asset of ['dashboard.css', 'dashboard.js']) assert.ok(html.includes(`arcade/${asset}?v=3.3.0`));
assert.ok(html.includes('arcade/favicon.svg?v=3.2.0'));
console.log('Dashboard-Tests bestanden: vier Spiele, Vorschauen, Links, Desktop-Grid und mobile Navigation.');
