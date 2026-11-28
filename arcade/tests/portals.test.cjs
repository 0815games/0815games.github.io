'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'arcade/dashboard.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'arcade/dashboard.js'), 'utf8');
const games = JSON.parse(fs.readFileSync(path.join(root, 'arcade/games.json'), 'utf8'));

assert.equal(games.length, 4, 'die Spielzentrale enthält genau vier Titel');
assert.deepEqual(games.map(game => game.id), ['pipboy', 'tiny-tycoon-towns', 'ironpath', 'schattengruft']);
assert.ok(!/<iframe\b/i.test(html), 'Spiele werden nicht in eingebetteten Frames geladen');
assert.ok(!source.includes('createElement(\'iframe\')'));
assert.match(html, /data-dashboard-version="3\.0\.0"/);
assert.match(html, /id="game-grid"/);
assert.equal((html.match(/data-game-card/g) || []).length, 4, 'vier auswählbare Spiele-Karten');
assert.equal((html.match(/data-game-select=/g) || []).length, 4, 'vier direkte Mobile-Auswahltasten');
assert.match(css, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'Desktop zeigt alle vier Titel nebeneinander');
assert.ok(css.includes('.game-grid[data-mobile-ready="true"] .game-card{display:none}'), 'Mobile blendet nicht ausgewählte Titel aus');
assert.match(source, /touchstart/);
assert.match(source, /ArrowLeft/);
assert.match(source, /previous-game/);

for (const game of games) {
  assert.ok(fs.existsSync(path.join(root, game.path)), `Spiel vorhanden: ${game.path}`);
  assert.ok(fs.existsSync(path.join(root, game.image)), `Vorschaubild vorhanden: ${game.image}`);
  assert.ok(html.includes(`href="${game.path}"`), `Spiel ist auf der Startseite verlinkt: ${game.path}`);
}
for (const asset of ['theme.js', 'dashboard.css', 'dashboard.js']) assert.ok(html.includes(`arcade/${asset}?v=3.0.0`));
console.log('Dashboard-Tests bestanden: vier Spiele, Vorschauen, Links, Desktop-Grid und mobile Navigation.');
