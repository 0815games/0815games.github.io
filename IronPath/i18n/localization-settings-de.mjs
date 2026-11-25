// German for the Settings dialog.
//
// The dialog is the only place language, audio, graphics, camera defaults, and
// fullscreen live now, so its copy is read both in the Command Center and mid-battle.
// House style, same as the rest of the German: Du-form, short sentences, no "Sie".
export const germanSettings = Object.freeze({
  // Dialog chrome, sections, and controls.
  'SETTINGS': 'EINSTELLUNGEN',
  'FIELD & HELP': 'FELD & HILFE',
  'Field Notes': 'Feldnotizen',
  'Field Tutorial': 'Feld-Tutorial',
  'Settings': 'Einstellungen',
  'Close settings': 'Einstellungen schließen',
  'Settings sections': 'Bereiche der Einstellungen',
  'GENERAL': 'ALLGEMEIN',
  'ACCOUNT': 'KONTO',
  'LANGUAGE & DISPLAY': 'SPRACHE & ANZEIGE',
  'AUDIO & COMMS': 'TON & FUNK',
  'GRAPHICS & EFFECTS': 'GRAFIK & EFFEKTE',
  'OPERATION & TRAINING': 'EINSATZ & TRAINING',
  'Language': 'Sprache',
  'Switch language': 'Sprache wechseln',
  'Default battlefield view': 'Standard-Kartenansicht',
  'Fit whole field': 'Gesamtes Feld',
  'Tactical zoom': 'Taktischer Zoom',
  'Display mode': 'Anzeigemodus',
  'FULLSCREEN': 'VOLLBILD',
  'EXIT FULLSCREEN': 'VOLLBILD BEENDEN',
  'Sound effects': 'Soundeffekte',
  'Master volume': 'Gesamtlautstärke',
  'Effects volume': 'Effektlautstärke',
  'Music': 'Musik',
  'Music volume': 'Musiklautstärke',
  'Mission voice-over': 'Missions-Sprachausgabe',
  'Graphics preset': 'Grafikqualität',
  'Full': 'Voll',
  'Reduced': 'Reduziert',
  'Camera shake': 'Kamerawackeln',
  'Weather & atmosphere': 'Wetter & Atmosphäre',
  'Combat tracers & sparks': 'Leuchtspur & Funken',
  'Auto-pause on tab switch': 'Pause bei Tabwechsel',
  'ON': 'AN',
  'OFF': 'AUS',
  'PLAY THE FIRST RUN AGAIN': 'DEN ERSTEN EINSATZ NEU SPIELEN',
  'RESET SETTINGS': 'EINSTELLUNGEN ZURÜCKSETZEN',
  'Audio, graphics, and camera settings apply identically in Command Center and during battle. Quality presets and training replay ask first.':
    'Ton-, Grafik- und Kameraoptionen gelten in der Zentrale und im Kampf identisch. Grafikqualität und Trainings-Neustart fragen vorher nach.',
  'Signed in as': 'Angemeldet als',
  'Change password': 'Passwort ändern',
  'Current password': 'Aktuelles Passwort',
  'New password': 'Neues Passwort',
  'Confirm new password': 'Neues Passwort bestätigen',
  'UPDATE PASSWORD': 'PASSWORT ÄNDERN',
  'SEND RESET EMAIL': 'RESET-E-MAIL SENDEN',
  'DANGER ZONE': 'GEFAHRENZONE',
  'Discharging your soldier permanently removes your character, progression, gear and friend links after confirmation. Leave any active multiplayer party first.':
    'Das Entlassen entfernt Soldaten, Fortschritt, Ausrüstung und Freundesverbindungen dauerhaft nach Bestätigung. Verlasse zuerst eine aktive Mehrspielergruppe.',

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
  'Reset settings?': 'Einstellungen zurücksetzen?',
  'Restore default audio, graphics, and battlefield display preferences. Language and your account stay unchanged.':
    'Standardwerte für Ton, Grafik und Kartenansicht wiederherstellen. Sprache und Konto bleiben unverändert.',
  'RESET': 'ZURÜCKSETZEN',

  // What the game says while a replay runs, so nobody wonders where the XP went.
  'Run over. This replay pays no XP - the first run already did.':
    'Einsatz vorbei. Dieser Durchlauf zahlt keine EP – der erste hat das schon getan.',

  // The fullscreen failure note, which now appears inside the dialog.
  'Fullscreen unavailable. Check your browser permissions or exit fullscreen and try again.':
    'Vollbild nicht verfügbar. Prüfe die Browserberechtigungen oder beende das Vollbild und versuche es erneut.',
});
