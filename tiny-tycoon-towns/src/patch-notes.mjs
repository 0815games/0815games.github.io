// Feldnotizen: Was ist veröffentlicht, was ist offen. Jede Zeile braucht DE und EN
// (tests/patch-notes.test.mjs prüft das). Neue Welle immer oben in RELEASED_PATCHES.
// Ein Eintrag behauptet keine Geräteabnahme, die nicht stattgefunden hat.

export const RELEASED_PATCHES = [
  {
    build: '20261124-konto1',
    date: '2026-11-24',
    items: [
      {
        de: 'Konto: Registrierung und Anmeldung mit E-Mail und Passwort im Code angelegt.',
        en: 'Account: sign-up and sign-in with e-mail and password implemented in code.',
      },
      {
        de: 'Cloud-Speicherstand: Die Stadt wird in der Realtime Database gespeichert. Die Regeln sind noch nicht veröffentlicht.',
        en: 'Cloud save: the town is stored in the Realtime Database. The rules are not yet published.',
      },
      {
        de: 'Feldnotizen im Spiel über den Knopf oben (Stand: Branch, noch nicht auf main).',
        en: 'Field notes in the game via the button at the top (status: branch, not yet on main).',
      },
    ],
  },
];

// Noch nicht erledigt oder nicht belegt. Getrennt von dem, was veröffentlicht ist.
export const OPEN_ITEMS = [
  {
    de: 'Die Realtime-Database-Regeln sind im Repo, aber noch nicht in Firebase veröffentlicht. Bis dahin bleibt der Speicher gesperrt.',
    en: 'The Realtime Database rules are in the repo but not yet published in Firebase. Until then storage stays locked.',
  },
  {
    de: 'Die Emulator-Tests für die Regeln sind noch nicht eingerichtet.',
    en: 'Emulator tests for the rules are not set up yet.',
  },
  {
    de: 'Auf einem echten Gerät ist die Anmeldung noch nicht geprüft.',
    en: 'Sign-in has not yet been checked on a real device.',
  },
];
