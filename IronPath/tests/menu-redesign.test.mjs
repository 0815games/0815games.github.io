import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root, file), 'utf8');

test('menu-redesign.css is linked last in <head> and scopes dialog display rules to [open]', () => {
  const html = read('index.html');
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  const stylesheets = [...head.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m => m[1]);
  assert.ok(stylesheets.length >= 2, 'page declares multiple layered stylesheets');
  assert.match(stylesheets.at(-1), /^menu-redesign\.css(?:\?v=[\w-]+)?$/, 'menu-redesign.css loads last so its Block 9 layer wins');

  const css = read('menu-redesign.css');
  // Every dialog display declaration must be scoped to [open] so browser dialog:not([open]){display:none} holds.
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const [, selector, body] of rules) {
    if (!/\bdisplay\s*:/.test(body)) continue;
    const touchesDialogShell = selector.split(',').some(part => {
      const trimmed = part.trim();
      return /#(?:settingsDialog|patchNotes|endlessLaunch|soldierDialog|armoryDialog|skillDialog|friendsDialog|friendStatsDialog|leaderboardDialog)(?:$|[\s,:])/.test(trimmed)
        && !/#\w+\s+[.#>\w]/.test(trimmed);
    });
    if (touchesDialogShell) {
      assert.match(selector, /\[open\]/, `dialog display rule must require [open]: ${selector.trim()}`);
    }
  }

  // Balanced braces check in menu-redesign.css.
  let depth = 0;
  for (const ch of css) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    assert.ok(depth >= 0, 'no unexpected closing brace in menu-redesign.css');
  }
  assert.equal(depth, 0, 'balanced braces in menu-redesign.css');
});

test('every artwork asset referenced by menu-redesign.css exists cleanly', () => {
  const css = read('menu-redesign.css');
  const urls = [...new Set([...css.matchAll(/url\(["']?(assets\/[^)"']+)["']?\)/g)].map(m => m[1]))];
  assert.ok(urls.length >= 10, 'menu-redesign.css references painted terrain and banner artwork');
  for (const rel of urls) {
    const bytes = readFileSync(resolve(root, rel));
    assert.ok(bytes.length > 1000, `referenced asset exists and is non-empty: ${rel}`);
  }
});

test('Settings owns Account password-change and Danger Zone; Command utilities hold 4 actions', () => {
  const html = read('index.html');
  const utilitiesStart = html.indexOf('class="command-utilities"');
  const utilitiesEnd = html.indexOf('</div>', utilitiesStart);
  const utilities = html.slice(utilitiesStart, utilitiesEnd);
  const utilityButtons = [...utilities.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(utilityButtons, ['menuPatchNotes', 'menuSettings', 'menuTutorial', 'menuLogout']);

  const accountPanelStart = html.indexOf('id="settingsPanelAccount"');
  const accountPanelEnd = html.indexOf('</dialog>', accountPanelStart);
  const accountPanel = html.slice(accountPanelStart, accountPanelEnd);
  for (const id of [
    'settingsAccountEmail',
    'settingsPasswordForm',
    'settingsCurrentPassword',
    'settingsNewPassword',
    'settingsConfirmPassword',
    'settingsPasswordSubmit',
    'settingsPasswordResetEmail',
    'settingsAccountStatus',
    'menuDeleteCharacter',
  ]) {
    assert.match(accountPanel, new RegExp(`id="${id}"`), `Account panel contains #${id}`);
  }

  for (const [dialogId, bannerClass] of [
    ['settingsDialog', 'dialog-banner-settings'],
    ['patchNotes', 'dialog-banner-notes'],
    ['endlessLaunch', 'dialog-banner-endless'],
    ['friendsDialog', 'dialog-banner-friends'],
    ['friendStatsDialog', 'dialog-banner-friends'],
    ['leaderboardDialog', 'dialog-banner-leaderboard'],
  ]) {
    const start = html.indexOf(`id="${dialogId}"`);
    const slice = html.slice(start, start + 600);
    assert.match(slice, new RegExp(`class="dialog-banner ${bannerClass}"`), `#${dialogId} uses .${bannerClass}`);
  }
});

test('account.js wires password-change, backdrop dismiss, menu dialog cleanup, and keeps pages-rollback delete hook', () => {
  const account = read('account.js');
  const css = read('menu-redesign.css');
  const launcher = read('endless-launcher.mjs');

  assert.ok(account.includes("$('menuDeleteCharacter').onclick=deleteCharacter;"),
    'build-pages-site.mjs literal delete handler hook must remain intact');
  assert.match(account, /closeMenuDialogs\(/, 'account.js closes open menu dialogs across screen resets');
  assert.match(account, /bindDialogBackdrop\(\$\('settingsDialog'\)/);
  assert.match(account, /bindDialogBackdrop\(\$\('endlessLaunch'\)/);
  assert.match(account, /createPasswordChange/);
  assert.match(launcher, /setAttribute\('data-theme',/);
  for (const key of ['random', 'scrub', 'forest', 'urban', 'arctic', 'marsh']) {
    assert.match(css, new RegExp(`data-theme="${key}"`), `menu-redesign.css styles endless terrain "${key}"`);
  }
});

test('endless quick-deploy sits at the top above terrain cards and record; campaign dossier records unify story and relics with cohesive art', () => {
  const html = read('index.html');
  const css = read('menu-redesign.css');

  const endlessStart = html.indexOf('id="endlessLaunch"');
  const endlessEnd = html.indexOf('</dialog>', endlessStart);
  const endless = html.slice(endlessStart, endlessEnd);
  const quickStart = endless.indexOf('class="endless-quick-start"');
  const deployPos = endless.indexOf('id="endlessDeploy"');
  const selectedPos = endless.indexOf('id="endlessSelectedTheme"');
  const themesPos = endless.indexOf('id="endlessThemes"');
  const recordPos = endless.indexOf('class="endless-record"');
  const lastRunPos = endless.indexOf('id="endlessLastRun"');
  assert.ok(quickStart > 0 && selectedPos > quickStart && deployPos > quickStart);
  assert.ok(deployPos < themesPos, '#endlessDeploy sits above battlefield cards so players can start immediately');
  assert.ok(themesPos < recordPos && recordPos < lastRunPos, '.endless-record and #endlessLastRun sit below #endlessThemes');

  const boardStart = html.indexOf('id="campaignBoard"');
  const boardEnd = html.indexOf('class="campaign-quick-select"', boardStart);
  const board = html.slice(boardStart, boardEnd);
  const recordsPos = board.indexOf('class="campaign-dossier-records"');
  const journalPos = board.indexOf('class="story-journal"');
  const relicPos = board.indexOf('class="relic-panel"');
  assert.ok(recordsPos > 0 && journalPos > recordsPos && relicPos > journalPos,
    '#campaignBoard groups .story-journal and .relic-panel inside .campaign-dossier-records');

  assert.doesNotMatch(css, /assets\/(?:endless-ground|terrain3-[a-z]+)\.jpg/,
    'menu-redesign.css replaces flat ground tiles with panoramic painted artwork');
  assert.doesNotMatch(endless, /id="endlessArmory"|id="endlessSkills"/, '#endlessLaunch omits redundant Armory/Skills detour buttons');
  assert.match(html, /id="campaignProgressBar"[^>]*max="50"/, 'campaign progress bar uses the real 50-mission count');
  assert.match(html, /data-i18n-text="50 MISSIONS"/, 'campaign header shows 50 MISSIONS');
  assert.match(html, /across five acts/, 'campaign intro accurately states five acts');
  assert.match(html, /id="afkRestArt"[^>]*src="assets\/afk-rest\.jpg"/, '#afkRestDialog uses painted AFK shelter art');

  for (const art of [
    'assets/endless-frontline.jpg',
    'assets/story-act1-relic.jpg',
    'assets/story-act2-relic.jpg',
    'assets/story-act3-relic.jpg',
    'assets/story-act4-relic.jpg',
    'assets/story-act5-relic.jpg',
    'assets/field-recruiting.jpg',
    'assets/settings-command.jpg',
    'assets/afk-rest.jpg',
  ]) {
    assert.ok(css.includes(art), `menu-redesign.css integrates ${art}`);
  }
});

test('VIEW LAST RESULTS sits below mode cards, language select stays visible in Settings, and Endless None equipped is translated', () => {
  const html = read('index.html');
  const css = read('menu-redesign.css');
  const navStart = html.indexOf('class="command-nav"');
  const navEnd = html.indexOf('id="fieldSchool"', navStart);
  const nav = html.slice(navStart, navEnd);
  assert.ok(nav.indexOf('id="menuResume"') < nav.indexOf('class="mode-grid"'), '#menuResume stays above .mode-grid');
  assert.ok(nav.indexOf('class="mode-grid"') < nav.indexOf('id="menuResults"'), '#menuResults sits below .mode-grid');
  assert.match(css, /#settingsDialog\s+\.language-flag-control\s+select\s*\{[^}]*position:\s*static[^}]*opacity:\s*1/s,
    'menu-redesign.css resets legacy style.css opacity:0 / position:absolute on #languageSelect');
  assert.match(css, /#commandCenter\s+#menuResults\.command-results\s*\{/,
    'menu-redesign.css gives #menuResults a distinct secondary results bar style');
  const launcher = read('endless-launcher.mjs');
  assert.doesNotMatch(launcher, /translateText\(\s*['"]command\.none['"]/, 'endless-launcher.mjs must not pass dotted message key to translateText');
});
