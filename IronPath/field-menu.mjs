// The field menu: one <details> over the battlefield with the actions that are
// about the match, not about a tower.
//
// It used to mirror the page-level controls instead of owning them: a second
// language flag and a second FULLSCREEN button were copied into the panel and kept
// in sync with `#languageSelect` / `#fullscreenToggle` through MutationObservers.
// That is how two switches for one setting end up disagreeing - and both of those
// controls now live in the Settings dialog, which this menu simply opens.
//
// The rule this file keeps: the menu never changes a setting itself. It requests
// the dialog (`onSettings`), which has exactly one implementation in settings.mjs.
export function setupFieldMenu({document, onLanguageChange = () => () => {}, onSettings = null} = {}) {
  const $ = id => document.getElementById(id);
  const menu = $('fieldOps');
  if (!menu) return;

  for (const [source, target] of [['fieldBack', 'backToCommand'], ['fieldParty', 'partyToggle'], ['fieldMissionBoard', 'campaignShowBoard']]) {
    $(source)?.addEventListener('click', () => { menu.open = false; $(target)?.click(); });
  }

  // Dismissing the coaching card must not be a one-way door: this replays the seven
  // cards on the live field. It borrows the Command Center's "first run again" action
  // so there is exactly one replay path, not two that can drift apart.
  $('fieldCoachReplay')?.addEventListener('click', () => { menu.open = false; $('menuTutorial')?.click(); });

  // Settings: same dialog the Command Center opens, closed over the field.
  $('fieldSettings')?.addEventListener('click', () => {
    menu.open = false;
    if (typeof onSettings === 'function') onSettings($('fieldSettings'));
  });

  // The field menu is a <details>: a tap elsewhere closes it. That used to be the
  // browser's job on desktop only, so on a phone the panel stayed open over the
  // battlefield until MENU was tapped again.
  document.addEventListener('click', event => {
    if (!menu.open || menu.contains(event.target)) return;
    menu.open = false;
  });

  onLanguageChange(() => { /* the panel now shows translated copy from the page */ });
}
