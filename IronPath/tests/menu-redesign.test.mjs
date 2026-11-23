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
    assert.ok(bytes.length > 100, `referenced asset exists and is non-empty: ${rel}`);
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
  const launcher = read('core/endless-launcher.mjs');

  assert.ok(account.includes("$('menuDeleteCharacter').onclick=deleteCharacter;"),
    'build-pages-site.mjs literal delete handler hook must remain intact');
  assert.match(account, /closeMenuDialogs\(/, 'account.js closes open menu dialogs across screen resets');
  assert.match(account, /bindDialogBackdrop\(\$\('settingsDialog'\)/);
  assert.match(account, /bindDialogBackdrop\(\$\('endlessLaunch'\)/);
  assert.match(account, /createPasswordChange/);
  assert.match(launcher, /setAttribute\??\.?\('data-theme',/);
  for (const key of ['random', 'scrub', 'forest', 'urban', 'arctic', 'marsh']) {
    assert.match(css, new RegExp(`data-theme="${key}"`), `menu-redesign.css styles endless terrain "${key}"`);
  }
});

test('endless stage carries arrows and deploy inside one artwork, record at bottom', () => {
  const html = read('index.html');
  const css = read('menu-redesign.css');

  const endlessStart = html.indexOf('id="endlessLaunch"');
  const endlessEnd = html.indexOf('</dialog>', endlessStart);
  const endless = html.slice(endlessStart, endlessEnd);
  const stagePos = endless.indexOf('class="endless-stage"');
  const cardPos = endless.indexOf('id="endlessThemeCard"');
  const prevPos = endless.indexOf('id="endlessPrev"');
  const nextPos = endless.indexOf('id="endlessNext"');
  const deployPos = endless.indexOf('id="endlessDeploy"');
  const selectedPos = endless.indexOf('id="endlessSelectedTheme"');
  const recordPos = endless.indexOf('class="endless-record"');
  const lastRunPos = endless.indexOf('id="endlessLastRun"');
  assert.ok(stagePos > 0 && cardPos > stagePos && prevPos > cardPos && nextPos > prevPos && deployPos > nextPos,
    'the stage holds the artwork, both arrows and DEPLOY in one integrated picture');
  assert.ok(selectedPos > cardPos && selectedPos < prevPos, 'the battlefield name sits at the bottom of the artwork');
  assert.ok(!endless.includes('endlessCancel') && !endless.includes('endless-deploy-top') && !endless.includes('endlessLoadout'),
    'no CANCEL row, no deploy/loadout field above the artwork any more');
  assert.ok(deployPos < recordPos && recordPos < lastRunPos, '.endless-record and #endlessLastRun close the dialog below the stage');
  assert.match(css, /#endlessLaunch \.endless-arrow\s*\{[^}]*position:\s*absolute/, 'endless arrows are integrated into the artwork');
  assert.match(css, /#endlessLaunch #endlessDeploy\s*\{[^}]*position:\s*absolute/, 'DEPLOY sits on the artwork, not above it');
  assert.match(css, /#endlessLaunch \.endless-theme-card\s*\{[^}]*align-items:\s*flex-start/, 'the battlefield name holds the top of the artwork, DEPLOY owns the bottom');
  assert.match(css, /#endlessLaunch #endlessDeploy\s*\{[^}]*font-family:\s*"Arial Black"[^}]*letter-spacing:\s*0\.22em/, 'DEPLOY is a stencil plate with a brass frame, readable on every artwork');
  assert.match(endless, /endless-arrow-icon" viewBox="0 0 28 48"/, 'endless arrows render as classic slim line chevrons');
  assert.doesNotMatch(css, /#endlessLaunch #endlessDeploy\s*\{[^}]*min-width/, 'DEPLOY is only as wide as its stencil lettering, never a full-width bar');

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
    'assets/mode-campaign.jpg',
    'assets/mode-endless.jpg',
    'assets/mode-multiplayer.jpg',
    'assets/endless-random.jpg',
    'assets/endless-frontline.jpg',
    'assets/story-act1-relic.jpg',
    'assets/story-act2-relic.jpg',
    'assets/story-act3-relic.jpg',
    'assets/story-act4-relic.jpg',
    'assets/story-act5-relic.jpg',
    'assets/field-recruiting.jpg',
    'assets/settings-command.jpg',
    'assets/afk-rest.jpg',
    'assets/soldier-workbench.jpg',
    'assets/arsenal-workbench.jpg',
    'assets/skills-banner.jpg',
    'assets/action-friends.jpg',
    'assets/action-scores.jpg',
  ]) {
    assert.ok(css.includes(art), `menu-redesign.css integrates ${art}`);
  }
});

test('VIEW LAST RESULTS sits below mode cards, language toggles match, and HQ dialogs use COMMAND CENTER back buttons', () => {
  const html = read('index.html');
  const css = read('menu-redesign.css');
  const navStart = html.indexOf('class="command-nav"');
  const navEnd = html.indexOf('id="fieldSchool"', navStart);
  const nav = html.slice(navStart, navEnd);
  assert.ok(nav.indexOf('id="menuResume"') < nav.indexOf('class="mode-grid"'), '#menuResume stays above .mode-grid');
  assert.ok(nav.indexOf('class="mode-grid"') < nav.indexOf('id="menuResults"'), '#menuResults sits below .mode-grid');
  assert.match(css, /\.login-lang-toggle\s*\{/, 'menu-redesign.css styles the flag+code language toggle');
  assert.match(css, /#commandCenter\s+#menuResults\.command-results\s*\{/,
    'menu-redesign.css gives #menuResults a distinct secondary results bar style');
  for (const id of ['settingsClose', 'patchNotesClose', 'endlessClose', 'soldierClose', 'armoryClose', 'skillCancel', 'friendsClose', 'leaderboardClose', 'resultsClose']) {
    const start = html.indexOf(`id="${id}"`);
    assert.ok(start > 0, `button #${id} present`);
    const tag = html.slice(start, html.indexOf('</button>', start));
    assert.match(tag, /data-i18n="workspace\.back"/, `#${id} displays ← COMMAND CENTER back label`);
  }
  const launcher = read('core/endless-launcher.mjs');
  assert.doesNotMatch(launcher, /translateText\(\s*['"]command\.none['"]/, 'endless-launcher.mjs must not pass dotted message key to translateText');

  // Paket 2: single-column hero login dossier override without interface-redesign 2-column squeeze
  assert.match(html, /class="dossier-hero-stage"/, '#authView uses dedicated .dossier-hero-stage container');
  assert.match(css, /#entry\s+#authView\.dossier\s*\{[^}]*flex-direction:\s*column/, '#authView resets grid into clean single column');
  assert.match(css, /\.entry:has\(\.dossier:not\(\[hidden\]\)\)::before\s*\{[^}]*display:\s*none/, 'redundant personnel header strip hidden on redesigned login');

  // Paket 3: unified operation shell width & uniform top-left back buttons
  assert.match(css, /--hq-op-width:\s*min\(880px/, 'shared 880px HQ shell width defined');
  assert.match(css, /#gameWorkspace\[data-screen="lobby"\]\s*>\s*\.workspace-nav[\s\S]*#fourPartyPanel[\s\S]*#campaignPanel\[data-board-open="true"\]/, 'Campaign and Multiplayer share --hq-op-width');
  assert.match(css, /flex-direction:\s*column-reverse;\s*align-items:\s*flex-start/, 'HQ dialog headers anchor ← COMMAND CENTER top-left');
  assert.match(css, /body:has\(#commandCenter:not\(\[hidden\]\)\)\s+#guideRecall\.coach-recall/, 'SHOW TASK clears Command Center bottom-left utility row');

  // Paket 4: fixed card height on Endless themes + custom SVG arrows
  assert.match(html, /id="endlessPrev"[\s\S]*?<svg class="endless-arrow-icon"/, '#endlessPrev renders custom Iron Path vector arrow');
  assert.match(html, /id="endlessNext"[\s\S]*?<svg class="endless-arrow-icon"/, '#endlessNext renders custom Iron Path vector arrow');
  assert.match(css, /#endlessLaunch\s+\.endless-stage\s*\{[^}]*height:\s*clamp\(320px, 48vh, 520px\)/, 'the endless stage grows with the screen height on desktop');
  assert.match(css, /#endlessLaunch #endlessDeploy\s*\{[^}]*width:\s*fit-content/, 'DEPLOY is exactly as wide as its stencil lettering, never the stage');
  assert.match(css, /#endlessLaunch #endlessDeploy\s*\{[^}]*box-shadow:[^}]*0 0 10px rgba\(232, 201, 124, 0\.35\)/, 'DEPLOY glow stays quiet at rest');
  assert.match(css, /#endlessLaunch #endlessDeploy:hover\s*\{[^}]*box-shadow:[^}]*0 0 26px/, 'DEPLOY glow only flares up on hover');

  // Command Center soldier XP footer dock & painted action cards
  const soldierStart = nav.indexOf('id="menuSoldier"');
  const soldierEnd = nav.indexOf('class="command-soldier-actions"', soldierStart);
  const soldierHtml = nav.slice(soldierStart, soldierEnd);
  assert.ok(soldierHtml.indexOf('class="command-soldier-top"') > 0
    && soldierHtml.indexOf('class="command-soldier-top"') < soldierHtml.indexOf('class="command-soldier-xp"'),
    '#menuSoldier places .command-soldier-xp strictly below .command-soldier-top');
  assert.ok(soldierHtml.indexOf('id="menuPortrait"') < soldierHtml.indexOf('class="command-soldier-xp"'),
    '#menuXp / #menuXpBar move out from beside the portrait to the bottom footer of #menuSoldier');
  for (const actionId of ['menuArmory', 'menuSkills', 'menuFriends', 'menuLeaderboard']) {
    const btnStart = nav.indexOf(`id="${actionId}"`);
    const btnHtml = nav.slice(btnStart, nav.indexOf('</button>', btnStart));
    assert.match(btnHtml, /<svg class="action-card-icon"/, `#${actionId} carries a vector emblem`);
    assert.match(btnHtml, /class="action-card-label"\s+data-i18n="/, `#${actionId} isolates its translated label span`);
  }
});
