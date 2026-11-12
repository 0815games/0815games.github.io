// German for the first run: the seven coach cards on the field, the four cards after
// the match, and the four class explanations.
//
// Why a file of its own: `translateText()` falls back to the English string when a
// lookup misses, so a missing translation is invisible in code review and in every
// test that does not look for it. It showed: the seven cards a new soldier sees FIRST
// were 4 of 21 German, the guide after the match was 0 of 20, and the class lines 3 of
// 16 - while the menu, the battle and the armory around them were translated. These
// are the strings of the part of the game that explains the rest.
//
// Tone follows localization-battle-de.mjs and localization-towers-de.mjs: Du-form,
// short sentences, German punctuation, `EP` for XP and `Vorfäte` for supplies. The
// strings are keys, so they must match the English source EXACTLY - a test in
// tests/first-run-german.test.mjs fails on any card that has no entry here.
export const germanFirstRun=Object.freeze({
  // ---- The seven coach cards on the live field ------------------------------
  'Welcome, soldier':'Willkommen, Soldat',
  'Five waves, and the boss of the last one ends the exercise. This is a real match: what you build now is what fights.':
    'Fünf Wellen, und der Boss der letzten beendet die Übung. Das hier ist ein echter Einsatz: Was du jetzt baust, kämpft auch.',
  'WAVE 1 OF 5':'WELLE 1 VON 5',

  'Build a tower':'Baue einen Turm',
  'Tap a glowing build marker, pick a tower, then confirm. Towers shoot on their own; you only choose where they stand.':
    'Tippe auf einen leuchtenden Bauplatz, wähle einen Turm und bestätige. Türme schießen von allein; du entscheidest nur, wo sie stehen.',
  'TAP THE RINGED MARKER':'TIPPE AUF DEN MARKIERTEN PLATZ',
  'Build one tower to continue':'Baue einen Turm, um weiterzukommen',

  'Upgrade it':'Verbessere ihn',
  'Tap your tower to open its panel. Upgrade it there - a level 2 tower hits noticeably harder than a second level 1 - or sell it for half back.':
    'Tippe deinen Turm an, um sein Menü zu öffnen. Verbessere ihn dort – ein Turm auf Stufe 2 trifft deutlich härter als ein zweiter auf Stufe 1 – oder verkaufe ihn für die Hälfte zurück.',
  'TAP YOUR TOWER':'TIPPE DEINEN TURM AN',
  'Upgrade that tower to continue':'Verbessere diesen Turm, um weiterzukommen',

  'Move your hero':'Bewege deinen Helden',
  'Tap open ground and your soldier walks there and fires on his own. He is not a tower: he can be anywhere, so put him where the road bends.':
    'Tippe auf freies Gelände und dein Soldat läuft dorthin und feuert selbst. Er ist kein Turm: er kann überall stehen, also stell ihn dorthin, wo die Straße sich biegt.',
  'TAP OPEN GROUND':'TIPPE AUF FREIES GELÄNDE',
  'Send your soldier somewhere':'Schicke deinen Soldaten woandershin',

  'Supplies':'Vorräte',
  'Supplies pay for towers and only arrive when you clear a wave. That is why you build before you deploy, not after.':
    'Vorräte bezahlen die Türme und kommen nur, wenn du eine Welle schaffst. Darum baust du, bevor du startest – nicht danach.',
  'WATCH THE SUPPLY COUNT':'BEHALTE DIE VORRÄTE IM BLICK',

  'Start the wave':'Starte die Welle',
  'Deploy calls the next wave. Clearing it pays XP and supplies, so the field gets stronger only if you keep building.':
    'Einsatz ruft die nächste Welle. Eine geschaffte Welle bringt EP und Vorräte – das Feld wird also nur stärker, wenn du weiter baust.',
  'PRESS DEPLOY':'DRÜCKE EINSATZ',
  'Press Deploy to start the wave':'Drücke Einsatz, um die Welle zu starten',

  'The boss is here':'Der Boss ist da',
  'A boss walks with the last wave. Weaken it with towers before it reaches the bunker - it hits far harder than the rest.':
    'Mit der letzten Welle kommt ein Boss. Schwäche ihn mit Türmen, bevor er den Bunker erreicht: er trifft weit härter als alles andere.',
  'BOSS OF WAVE 5':'BOSS DER WELLE 5',

  // ---- The three cards after the match -------------------------------------

  'Gear is what fights':'Ausrüstung kämpft',
  'The Armory holds what you own. Each piece raises one number - damage, health, supplies per wave. Equip the piece you just won: an item in the bag does nothing at all.':
    'In der Waffenkammer liegt, was dir gehört. Jedes Stück hebt einen Wert – Schaden, Gesundheit, Vorräte pro Welle. Rüste das Stück aus, das du gerade gewonnen hast: Was in der Tasche liegt, wirkt überhaupt nicht.',
  'ARMORY · EQUIPMENT':'WAFFENKAMMER · AUSRÜSTUNG',

  'Four classes, one point':'Vier Klassen, ein Punkt',
  'The skill tree has four paths and you have one point. Assault adds damage and rate of fire. Engineer makes towers cheaper and tougher. Recon moves your soldier faster and further. Command buffs the whole field. Pick the one that matches how you played.':
    'Der Fähigkeitsbaum hat vier Pfade, du hast einen Punkt. Angriff bringt Schaden und Feuerrate. Pionier macht Türme billiger und robuster. Aufklärung macht deinen Soldaten schneller und lässt ihn weiter sehen. Kommando stärkt das ganze Feld. Nimm den Pfad, der zu deiner Spielweise passt.',
  'SKILLS · CHOOSE A PATH':'FÄHIGKEITEN · WÄHLE EINEN PFAD',

  'Where gear comes from':'Woher die Ausrüstung kommt',
  'The workshop builds new equipment from scrap, which arrives as you clear waves. This is the long game: the first run paid for one item, the workshop is how you earn the rest.':
    'Die Werkstatt baut neue Ausrüstung aus Schrott, und Schrott kommt, wenn du Wellen schaffst. Das ist die lange Strecke: Der erste Einsatz hat ein Stück bezahlt, die Werkstatt ist der Weg zum Rest.',
  'ARMORY · WORKSHOP':'WAFFENKAMMER · WERKSTATT',

  // ---- The four class explanations ----------------------------------------
  'Assault':'Angriff',
  'More damage per shot and a faster rate of fire.':
    'Mehr Schaden pro Schuss und eine schnellere Feuerrate.',
  'If you want the towers to kill things.':
    'Wenn du willst, dass die Türme wirklich töten.',

  'Engineer':'Pionier',
  'Towers cost less and take more damage before they fall.':
    'Türme kosten weniger und halten mehr aus, bevor sie fallen.',
  'If you would rather build a lot than hit hard.':
    'Wenn du lieber viel baust, statt hart zu treffen.',

  'Recon':'Aufklärung',
  'The soldier moves faster and sees further.':
    'Der Soldat läuft schneller und sieht weiter.',
  'If you like running the hero around the road.':
    'Wenn du deinen Helden gern über die Straße schickst.',

  'Command':'Kommando',
  'Auras that help every tower near the bunker.':
    'Auren, die jedem Turm am Bunker helfen.',
  'If you would rather hold the last line.':
    'Wenn du lieber die letzte Linie hältst.',
});
