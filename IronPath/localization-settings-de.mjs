// German for the Settings dialog.
//
// The dialog is the only place language, sound, graphics and fullscreen live now, so
// its copy is read by a player who has just arrived - often on the screen where they
// first need to switch the language. That is the worst possible place for an English
// fallback, which is why it gets its own file instead of drifting into the generic
// dictionaries.
//
// House style, same as the rest of the German: Du-form, short sentences, no "Sie".
export const germanSettings = Object.freeze({
  // Dialog chrome and row labels.
  'SETTINGS': 'EINSTELLUNGEN',
  'Settings': 'Einstellungen',
  'Close settings': 'Einstellungen schließen',
  'Language': 'Sprache',
  'Sound': 'Ton',
  'Graphics': 'Grafik',
  'Full': 'Voll',
  'Reduced': 'Reduziert',
  'FULLSCREEN': 'VOLLBILD',
  'EXIT FULLSCREEN': 'VOLLBILD BEENDEN',
  'PLAY THE FIRST RUN AGAIN': 'DEN ERSTEN EINSATZ NEU SPIELEN',
  'Sound, graphics and the first run ask for confirmation before anything changes.':
    'Ton, Grafik und der erste Einsatz fragen nach, bevor sich etwas ändert.',

  // Confirmations. These are the sentences that have to be unambiguous, because they
  // are the last thing between a tap and a changed setting.
  'Change graphics?': 'Grafik ändern?',
  'Animated effects on the battlefield are turned off. The game plays exactly the same.':
    'Die bewegten Effekte auf dem Feld werden abgeschaltet. Das Spiel läuft genau gleich.',
  'Animated effects on the battlefield are turned back on.':
    'Die bewegten Effekte auf dem Feld kommen zurück.',
  'APPLY': 'ÜBERNEHMEN',
  'Play the first run again?': 'Den ersten Einsatz neu spielen?',
  'The training contract starts from the beginning: same map, same cards, same guide. Progress you already earned stays yours, and this replay pays no second XP.':
    'Der Trainingsvertrag startet von vorn: gleiche Karte, gleiche Karten, gleicher Guide. Was du schon verdient hast, bleibt dir, und dieser Durchlauf zahlt keine zweite EP.',
  'START OVER': 'NEU STARTEN',

  // What the game says while a replay runs, so nobody wonders where the XP went.
  'Run over. This replay pays no XP - the first run already did.':
    'Einsatz vorbei. Dieser Durchlauf zahlt keine EP – der erste hat das schon getan.',

  // The fullscreen failure note, which now appears inside the dialog.
  'Fullscreen unavailable. Check your browser permissions or exit fullscreen and try again.':
    'Vollbild nicht verfügbar. Prüfe die Browserberechtigungen oder beende das Vollbild und versuche es erneut.',
});
