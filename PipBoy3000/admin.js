(() => {
  // src/data/data_core.js
  window.GameData = window.GameData || {};
  window.GameData.perks = [
    { id: "toughness", name: "Zähigkeit", desc: "+10 Max HP pro Stufe.", icon: "🛡️", max: 5 },
    { id: "medic", name: "Sanitäter", desc: "+20% Heilung durch Stimpacks pro Stufe.", icon: "💉", max: 5 },
    { id: "rad_resistant", name: "Rad-Resistenz", desc: "-10% Strahlungsaufnahme pro Stufe.", icon: "☢️", max: 5 },
    { id: "strong_back", name: "Starker Rücken", desc: "+2 Inventar-Slots pro Stufe.", icon: "🎒", max: 5 },
    { id: "fortune_finder", name: "Schatzsucher", desc: "+10% mehr Kronkorken finden pro Stufe.", icon: "💰", max: 5 },
    { id: "scrapper", name: "Wiederverwerter", desc: "Höhere Chance auf seltene Teile beim Zerlegen.", icon: "⚙️", max: 3 },
    { id: "swift_learner", name: "Heller Kopf", desc: "+5% Erfahrungspunkte (XP) pro Stufe.", icon: "🧠", max: 5 },
    { id: "mysterious_stranger", name: "Mysteriöser Fremder", desc: "+2% Krit-Chance im V.A.T.S. pro Stufe.", icon: "🕵️", max: 5 },
    { id: "gunslinger", name: "Revolverheld", desc: "+10% Schaden mit Schusswaffen pro Stufe.", icon: "🔫", max: 5 },
    { id: "slugger", name: "Schläger", desc: "+10% Schaden im Nahkampf pro Stufe.", icon: "🏏", max: 5 }
  ];
  window.GameData.questDefs = [
    // AKT 1
    {
      id: "q_start",
      title: "Überleben 101",
      desc: "Das Ödland ist unerbittlich. Zeig den Kakerlaken, wer der Boss ist.",
      type: "kill",
      target: "radRoach",
      amount: 3,
      minLvl: 1,
      reward: { xp: 50, caps: 25 }
    },
    {
      id: "q_backpack",
      title: "Der Packesel",
      desc: "Sammle Material und crafte ein Rucksack-Gestell an der Werkbank.",
      type: "collect",
      target: "backpack_frame",
      amount: 1,
      preReq: "q_start",
      minLvl: 1,
      reward: { xp: 100, items: [{ id: "leather", c: 4 }] }
    },
    {
      id: "q_explore",
      title: "Licht am Horizont",
      desc: "Gerüchten zufolge gibt es eine Siedlung namens 'Rusty Springs' bei [3,3].",
      type: "visit",
      target: "3,3",
      amount: 1,
      preReq: "q_backpack",
      minLvl: 1,
      reward: { xp: 150, caps: 50, items: [{ id: "stimpack", c: 2 }] }
    },
    // AKT 2
    {
      id: "q_radio_silence",
      title: "Funkstille",
      desc: "Repariere den Funkmast in Rusty Springs. Du brauchst Schrott und Schrauben.",
      type: "collect_multi",
      reqItems: { junk_metal: 5, screws: 3 },
      preReq: "q_explore",
      minLvl: 3,
      reward: { xp: 250, caps: 100, items: [{ id: "radio_part", c: 1 }] }
    },
    {
      id: "q_ghost_machine",
      title: "Geist in der Maschine",
      desc: "Der Funkmast empfängt Signale von Maulwurfsratten. Untersuche das.",
      type: "kill",
      target: "moleRat",
      amount: 8,
      preReq: "q_radio_silence",
      minLvl: 4,
      reward: { xp: 400, caps: 150, items: [{ id: "fusion_core", c: 1 }] }
    },
    // NEBENQUESTS
    {
      id: "q_hunter_bloat",
      title: "Kammerjäger",
      desc: "Blähfliegen sind eine Plage. Töte 5 Stück.",
      type: "kill",
      target: "bloatfly",
      amount: 5,
      minLvl: 2,
      reward: { xp: 150, caps: 75 }
    },
    {
      id: "q_collector_rare",
      title: "Seltene Funde",
      desc: "Ein Sammler sucht 3x Klemmbretter für seine Sammlung.",
      type: "collect",
      target: "clipboard",
      amount: 3,
      minLvl: 2,
      reward: { xp: 120, caps: 200 }
    }
  ];
  window.GameData.locations = [
    { name: "Vault 101", coord: "[START]", desc: "Dein Startpunkt. Ein sicherer Bunker unter der Erde. Bietet Schutz und kostenlose Heilung." },
    { name: "Rusty Springs", coord: "[3,3]", desc: "Die größte bekannte Siedlung. Hier findest du Händler, einen Arzt und Werkbänke." },
    { name: "Oasis", coord: "[NW]", desc: "Ein seltsam fruchtbares Gebiet im Nordwesten (Sektoren 0-2). Dichter Wald, aber gefährliche Flora." },
    { name: "The Pitt", coord: "[SO]", desc: "Eine trostlose Wüste im Südosten (Sektoren 7-9). Hohe Strahlung und gefährliche Raider-Banden." },
    { name: "Sumpf", coord: "[NO]", desc: "Nebeliges Feuchtgebiet im Nordosten. Heimat der Mirelurks." },
    { name: "Gebirge", coord: "[SW]", desc: "Felsiges Terrain im Südwesten. Schwer passierbar." }
  ];
  window.GameData.items = Object.assign(window.GameData.items || {}, {
    junk_metal: { name: "Schrottmetall", type: "junk", cost: 5, icon: "⚙️", desc: "Verrostet, aber brauchbar." },
    cloth: { name: "Stofffetzen", type: "component", cost: 3, icon: "🧶", desc: "Alte Kleidungsteile." },
    screws: { name: "Schrauben", type: "component", cost: 15, icon: "🔩", desc: "Immer Mangelware." },
    duct_tape: { name: "Klebeband", type: "component", cost: 20, icon: "🩹", desc: "Das Allheilmittel." },
    glue: { name: "Wunderkleber", type: "component", cost: 25, icon: "💧", desc: "Extrem stark." },
    gears: { name: "Zahnräder", type: "component", cost: 30, icon: "⚙️", desc: "Präzisionsteile." },
    springs: { name: "Federn", type: "component", cost: 30, icon: "🌀", desc: "Für Mechanik-Upgrades." },
    plastic: { name: "Plastik", type: "component", cost: 10, icon: "🧴", desc: "Wiederverwertete Flaschen." },
    leather: { name: "Leder", type: "component", cost: 12, icon: "🐄", desc: "Gegerbte Haut." },
    backpack_frame: { name: "Rucksack-Gestell", type: "quest", cost: 0, icon: "🎒", desc: "Basis für mehr Tragekapazität." },
    radio_part: { name: "Frequenz-Chip", type: "quest", cost: 0, icon: "📟", desc: "Ein modifizierter Chip für den Funkmast." },
    fusion_core: { name: "Fusionskern", type: "valuable", cost: 500, icon: "🔋", desc: "Eine massive Energiequelle." },
    tin_can: { name: "Blechdose", type: "junk", cost: 2, icon: "🥫", desc: "Leere Konserve." },
    wrench: { name: "Schraubenschlüssel", type: "junk", cost: 15, icon: "🔧", desc: "Ein schweres Werkzeug." },
    clipboard: { name: "Klemmbrett", type: "junk", cost: 10, icon: "📋", desc: "Alte Bürokratie." }
    // HIER: Das Item für die Quest
  });
  window.GameData.monsters = Object.assign(window.GameData.monsters || {}, {
    radRoach: {
      name: "Rad-Kakerlake",
      hp: 15,
      dmg: 3,
      xp: [10, 20],
      loot: 2,
      minLvl: 1,
      drops: [{ id: "junk_metal", c: 0.5 }, { id: "rad_meat", c: 0.4 }]
    },
    bloatfly: {
      name: "Blähfliege",
      hp: 20,
      dmg: 4,
      xp: [15, 25],
      loot: 3,
      minLvl: 2,
      drops: [{ id: "plastic", c: 0.3 }]
    },
    moleRat: {
      name: "Maulwurfsratte",
      hp: 30,
      dmg: 6,
      xp: [20, 35],
      loot: 5,
      minLvl: 1,
      drops: [{ id: "rad_meat", c: 0.5 }, { id: "leather", c: 0.4 }]
    },
    raider: {
      name: "Raider",
      hp: 65,
      dmg: 14,
      xp: [60, 90],
      loot: 15,
      minLvl: 3,
      // HIER: Raider droppen jetzt Klemmbretter (clipboard) zu 30%
      drops: [{ id: "ammo", c: 0.6 }, { id: "stimpack", c: 0.2 }, { id: "junk_metal", c: 0.5 }, { id: "clipboard", c: 0.3 }]
    }
  });
  window.GameData.colors = {
    ".": "#2d241b",
    "_": "#4a4036",
    ",": "#1a261a",
    ";": "#1e1e11",
    "=": "#333333",
    "#": "#555",
    "line_default": "#2a5a2a",
    "line_wall": "#39ff14",
    "V": "#39ff14",
    "C": "#eab308",
    "S": "#ff0000",
    "G": "#00ffff",
    "H": "#888888",
    "^": "#111",
    "v": "#111",
    "<": "#111",
    ">": "#111",
    "M": "#3e2723",
    "W": "#0d47a1",
    "~": "#2f4f2f",
    "t": "#1b5e20",
    "T": "#0a3d0a",
    "x": "#8b4513",
    "o": "#808080",
    "+": "#666666",
    '"': "#3cb371",
    "Y": "#deb887",
    "U": "#212121",
    "A": "#cc0000",
    "K": "#00bfff",
    "$": "#ffd700",
    "&": "#ff8c00",
    "P": "#ff3333",
    "E": "#39ff14",
    "F": "#00bfff",
    "|": "#777",
    "X": "#ff00ff",
    "wasteland": "#5d5345",
    "desert": "#eecfa1",
    "jungle": "#1a3300",
    "city": "#555555",
    "swamp": "#1e1e11"
  };
  window.GameData.statLabels = { "STR": "STÄRKE", "PER": "WAHRNEHMUNG", "END": "AUSDAUER", "INT": "INTELLIGENZ", "AGI": "BEWEGLICHKEIT", "LUC": "GLÜCK" };
  window.GameData.biomes = {
    "wasteland": {
      ground: ".",
      water: 0.02,
      mountain: 0.03,
      features: [{ char: "o", prob: 0.02, solid: true }, { char: "x", prob: 0.03, solid: false }, { char: "t", prob: 0.01, solid: true }]
    },
    "jungle": {
      ground: ",",
      water: 0.08,
      mountain: 0.05,
      features: [{ char: "T", prob: 0.08, solid: true }, { char: "t", prob: 0.15, solid: true }, { char: '"', prob: 0.15, solid: false }]
    },
    "desert": {
      ground: "_",
      water: 0.01,
      mountain: 0.1,
      features: [{ char: "o", prob: 0.02, solid: true }, { char: "Y", prob: 0.02, solid: true }]
    },
    "city": {
      ground: "=",
      water: 0,
      mountain: 0,
      features: [{ char: "#", prob: 0.1, solid: true }, { char: "+", prob: 0.08, solid: false }, { char: "o", prob: 0.02, solid: true }]
    },
    "swamp": {
      ground: ";",
      water: 0.05,
      mountain: 0,
      features: [{ char: "~", prob: 0.1, solid: false }, { char: "x", prob: 0.1, solid: false }, { char: "t", prob: 0.05, solid: true }]
    }
  };
  window.GameData.hackWords = {
    easy: ["PASS", "CODE", "HACK", "DATA", "BIOS", "BOOT", "DISK", "FILE", "LOAD", "SAVE", "EXIT", "USER", "LOCK", "KEYS", "WIFI", "NODE"],
    medium: ["SERVER", "ACCESS", "SYSTEM", "ROUTER", "MEMORY", "CONFIG", "STATUS", "REBOOT", "UPDATE", "KERNEL", "SCRIPT", "SEARCH", "SIGNAL", "TARGET", "MATRIX", "BYPASS"],
    hard: ["FIREWALL", "PROTOCOL", "PASSWORD", "DATABASE", "SECURITY", "DOWNLOAD", "TERMINAL", "MAINFRAME", "OVERRIDE", "HARDWARE", "SOFTWARE", "ENCRYPTION", "NETWORK", "BACKDOOR"]
  };
  console.log("GameData Core & Locations loaded.");

  // src/data/data_items.js
  if (typeof window.GameData === "undefined") window.GameData = {};
  if (typeof window.GameData.items === "undefined") window.GameData.items = {};
  Object.assign(window.GameData.items, {
    // --- BLUEPRINTS ---
    bp_ammo: { name: "Bauplan: Munition", type: "blueprint", recipeId: "craft_ammo", cost: 50, desc: "Lerne Munition herzustellen." },
    bp_stimpack: { name: "Bauplan: Stimpack", type: "blueprint", recipeId: "craft_stimpack", cost: 100, desc: "Medizinische Grundlagen." },
    // --- RUCKSÄCKE (MODULAR SYSTEM) ---
    // Tier 0: Das Gestell (Startpunkt)
    backpack_frame: {
      name: "Rucksack-Gestell",
      type: "back",
      slot: "back",
      cost: 20,
      bonus: { slots: 2 },
      desc: "Ein nackter Aluminiumrahmen. Besser als nichts. (+2 Slots)"
    },
    // Tier 1: Leder (Standard)
    backpack_leather: {
      name: "Leder-Rucksack",
      type: "back",
      slot: "back",
      cost: 100,
      bonus: { slots: 6 },
      desc: "Solide Taschen am Gestell. (+6 Slots)"
    },
    // Tier 2: Metall / Verstärkt (Heavy)
    backpack_metal: {
      name: "Verstärkter Rucksack",
      type: "back",
      slot: "back",
      cost: 250,
      bonus: { slots: 10, AGI: -1 },
      desc: "Mit Metallplatten verstärkt. Schwer. (+10 Slots, -1 AGI)"
    },
    // Tier 3a: Militär (Tactical - High End)
    backpack_military: {
      name: "Taktischer Rucksack",
      type: "back",
      slot: "back",
      cost: 600,
      bonus: { slots: 14, END: 1 },
      desc: "Militärstandard. Ergonomisch & Robust. (+14 Slots, +1 END)"
    },
    // Tier 3b: Lastesel (Cargo - High Capacity)
    backpack_cargo: {
      name: "Brahmin-Kiepe",
      type: "back",
      slot: "back",
      cost: 550,
      bonus: { slots: 22, AGI: -2 },
      desc: "Ein gigantischer Aufbau. Du bist ein Packesel. (+22 Slots, -2 AGI)"
    },
    // --- CAMP & TOOLS ---
    camp_kit: { name: "Zelt-Bausatz", type: "tool", cost: 150, desc: "Errichtet ein Lager im Ödland.", weight: 5 },
    lockpick: { name: "Haarklammer", type: "tool", cost: 5, desc: "Zum Knacken von Schlössern." },
    // --- MONSTER DROPS & FOOD ---
    meat_roach: { name: "Kakerlakenfleisch", type: "component", cost: 5, desc: "Ekelhaft, aber roh essbar. Gekocht deutlich bekömmlicher.", raw: { heal: 8, rad: 6 } },
    meat_fly: { name: "Fliegenfleisch", type: "component", cost: 5, desc: "Schleimig.", raw: { heal: 8, rad: 6 } },
    meat_mole: { name: "Rattenfleisch", type: "component", cost: 8, desc: "Zäh.", raw: { heal: 12, rad: 9 } },
    meat_dog: { name: "Hundefleisch", type: "component", cost: 10, desc: "Etwas zäh, aber nahrhaft.", raw: { heal: 15, rad: 10 } },
    meat_scorp: { name: "Skorpiondrüse", type: "component", cost: 20, desc: "Delikatesse.", raw: { heal: 22, rad: 14 } },
    meat_yao: { name: "Yao Guai Rippchen", type: "component", cost: 35, desc: "Sehr nahrhaft - roh aber stark verstrahlt.", raw: { heal: 30, rad: 16 } },
    hide_yao: { name: "Yao Guai Leder", type: "component", cost: 40, desc: "Robustes Fell." },
    meat_lurk: { name: "Mirelurk-Fleisch", type: "component", cost: 15, desc: "Weiches Schalentier-Fleisch.", raw: { heal: 18, rad: 12 } },
    // Cooked
    cooked_roach: { name: "Gegrillte Kakerlake", type: "consumable", effect: "heal_rad", val: 15, rad: 2, cost: 10, desc: "+15 HP, +2 RAD" },
    cooked_mole: { name: "Ratten-Steak", type: "consumable", effect: "heal_rad", val: 25, rad: 3, cost: 20, desc: "+25 HP, +3 RAD" },
    cooked_fly: { name: "Gegrillte Fliege", type: "consumable", effect: "heal_rad", val: 15, rad: 2, cost: 10, desc: "+15 HP, +2 RAD" },
    cooked_scorp: { name: "Skorpion-Überraschung", type: "consumable", effect: "heal_rad", val: 45, rad: 5, cost: 40, desc: "+45 HP, +5 RAD" },
    cooked_lurk: { name: "Mirelurk-Happen", type: "consumable", effect: "heal_rad", val: 35, rad: 4, cost: 30, desc: "+35 HP, +4 RAD" },
    // Hundefleisch und Yao-Guai-Rippchen hatten bisher kein Rezept: roh
    // ungeniessbar, gebraten unerreichbar. Mit dem neuen Rohverzehr faellt
    // das auf - jedes rohe Stueck braucht ein gebratenes Gegenstueck,
    // sonst gibt es keine Wahl zwischen den beiden.
    cooked_dog: { name: "Hunde-Steak", type: "consumable", effect: "heal_rad", val: 28, rad: 3, cost: 22, desc: "+28 HP, +3 RAD" },
    cooked_yao: { name: "Yao Guai Steak", type: "consumable", effect: "heal_rad", val: 50, rad: 6, cost: 55, desc: "+50 HP, +6 RAD" },
    stealth_boy: { name: "Stealth Boy", type: "consumable", effect: "buff", bonus: { AGI: 10 }, duration: 60, cost: 200, desc: "Macht kurzzeitig unsichtbar." },
    // --- CONSUMABLES (CHEMIS & MEDS) ---
    stimpack: { name: "Stimpack", type: "consumable", effect: "heal", val: 40, cost: 50, desc: "Sofortige Heilung (+40 HP)." },
    super_stimpack: { name: "Super-Stimpack", type: "consumable", effect: "heal", val: 100, cost: 120, desc: "Starke Heilung (+100 HP)." },
    radaway: { name: "RadAway", type: "consumable", effect: "rad", val: -50, cost: 40, desc: "Entfernt Strahlung." },
    radx: { name: "Rad-X", type: "consumable", effect: "buff", bonus: { RAD_RESIST: 20 }, cost: 40, desc: "Erhöht Strahlungsresistenz." },
    nuka_cola: { name: "Nuka Cola", type: "consumable", effect: "heal", val: 10, cost: 10, desc: "Koffeinhaltig. +10 HP, +5 RAD" },
    nuka_quantum: { name: "Nuka Quantum", type: "consumable", effect: "heal", val: 100, cost: 100, desc: "Leuchtet blau. +100 HP, +20 RAD, +AP" },
    jet: { name: "Jet", type: "consumable", effect: "buff", bonus: { AP: 20 }, cost: 30, desc: "Zeitlupeneffekt. (Macht süchtig)" },
    buffout: { name: "Buffout", type: "consumable", effect: "buff", bonus: { STR: 2, END: 2 }, cost: 40, desc: "Mehr Muckis." },
    // --- CRAFTING MATS ---
    junk_metal: { name: "Schrottmetall", type: "junk", cost: 2, desc: "Rostiges Metall." },
    screws: { name: "Schrauben", type: "component", cost: 5, desc: "Wichtig für Waffenmods." },
    duct_tape: { name: "Klebeband", type: "component", cost: 8, desc: "Hält die Welt zusammen." },
    gears: { name: "Zahnräder", type: "component", cost: 10, desc: "Mechanische Teile." },
    circuit: { name: "Schaltkreis", type: "component", cost: 25, desc: "Elektronik." },
    cloth: { name: "Stoff", type: "component", cost: 2, desc: "Textilien." },
    leather: { name: "Leder", type: "component", cost: 5, desc: "Gegerbte Haut." },
    adhesive: { name: "Kleber", type: "component", cost: 15, desc: "Wunderkleber." },
    oil: { name: "Öl", type: "component", cost: 8, desc: "Schmiermittel." },
    springs: { name: "Federn", type: "component", cost: 10, desc: "Spannung!" },
    nuclear_mat: { name: "Nukleares Material", type: "rare", cost: 50, desc: "Strahlend." },
    legendary_part: { name: "Legendäres Modul", type: "rare", cost: 500, desc: "Unbekannte Technologie." },
    // ========================
    // === NAHKAMPF (Melee) ===
    // ========================
    fists: { name: "Fäuste", type: "weapon", slot: "weapon", baseDmg: 2, cost: 0, desc: "Immer dabei.", usesAmmo: false },
    knuckles: { name: "Schlagring", type: "weapon", slot: "weapon", baseDmg: 4, cost: 25, desc: "Eisen für die Fäuste.", usesAmmo: false },
    switchblade: { name: "Springmesser", type: "weapon", slot: "weapon", baseDmg: 5, cost: 15, desc: "Schnell.", usesAmmo: false },
    rolling_pin: { name: "Nudelholz", type: "weapon", slot: "weapon", baseDmg: 3, cost: 5, desc: "Omas Waffe.", usesAmmo: false },
    pipe_wrench: { name: "Rohrzange", type: "weapon", slot: "weapon", baseDmg: 6, cost: 30, desc: "Schweres Werkzeug.", usesAmmo: false },
    police_baton: { name: "Schlagstock", type: "weapon", slot: "weapon", baseDmg: 7, cost: 40, desc: "Polizei-Ausgabe.", usesAmmo: false },
    knife: { name: "Kampfmesser", type: "weapon", slot: "weapon", baseDmg: 8, cost: 50, desc: "Scharf und tödlich.", usesAmmo: false },
    machete: { name: "Machete", type: "weapon", slot: "weapon", baseDmg: 12, cost: 80, desc: "Hackt gut.", usesAmmo: false },
    baseball_bat: { name: "Baseballschläger", type: "weapon", slot: "weapon", baseDmg: 10, cost: 60, desc: "Aus Holz.", usesAmmo: false },
    bat_alum: { name: "Alu-Schläger", type: "weapon", slot: "weapon", baseDmg: 13, cost: 120, desc: "Leichter und härter.", usesAmmo: false },
    bat_spiked: { name: "Nagelschläger", type: "weapon", slot: "weapon", baseDmg: 16, cost: 150, desc: "Böse Wunden.", usesAmmo: false },
    sledgehammer: { name: "Vorschlaghammer", type: "weapon", slot: "weapon", baseDmg: 25, cost: 180, desc: "Sehr langsam, sehr schwer.", usesAmmo: false },
    power_fist: { name: "Powerfaust", type: "weapon", slot: "weapon", baseDmg: 30, cost: 450, desc: "Pneumatischer Schlag.", usesAmmo: false },
    super_sledge: { name: "Superhammer", type: "weapon", slot: "weapon", baseDmg: 45, cost: 700, desc: "Raketengetrieben.", usesAmmo: false },
    ripper: { name: "Ripper", type: "weapon", slot: "weapon", baseDmg: 18, cost: 420, desc: "Kettensägen-Messer.", usesAmmo: false },
    deathclaw_gauntlet: { name: "Todeskralle", type: "weapon", slot: "weapon", baseDmg: 50, cost: 1e3, desc: "Die Klaue einer Bestie.", usesAmmo: false },
    // ==============================
    // === FERNKAMPF (Guns/Ammo) ===
    // ==============================
    // Munition in sechs Arten. `ammo` bleibt die Schrott-Sorte fuer die
    // Pipe-Waffen: bestehende Spielstaende, Haendler-Lager und das Rezept
    // craft_ammo arbeiten weiter damit (docs/BEFUNDE.md, 4).
    ammo: { name: "Schrott-Munition (.38)", type: "ammo", cost: 1, desc: "Selbstgegossen. Passt in Rohrwaffen.", weight: 0.05 },
    ammo_10mm: { name: "10mm-Munition", type: "ammo", cost: 2, desc: "Standard-Kaliber.", weight: 0.05 },
    ammo_308: { name: ".308-Munition", type: "ammo", cost: 3, desc: "Gewehrpatronen.", weight: 0.08 },
    ammo_shell: { name: "Schrotpatronen", type: "ammo", cost: 4, desc: "Für Flinten.", weight: 0.1 },
    ammo_micro: { name: "Mikro-Zellen", type: "ammo", cost: 2, desc: "Minigun-Futter.", weight: 0.04 },
    ammo_cell: { name: "Energiezellen", type: "ammo", cost: 5, desc: "Laser und Plasma.", weight: 0.1 },
    // Pipe Weapons (Schrott)
    pipe_pistol: { name: "Rohrpistole", type: "weapon", slot: "weapon", baseDmg: 5, cost: 15, desc: "Selbstgebaut.", usesAmmo: true, ammoType: "ammo", ammoCost: 1 },
    pipe_rifle: { name: "Rohrgewehr", type: "weapon", slot: "weapon", baseDmg: 7, cost: 30, desc: "Längerer Lauf.", usesAmmo: true, ammoType: "ammo", ammoCost: 1 },
    pipe_revolver: { name: "Rohrrevolver", type: "weapon", slot: "weapon", baseDmg: 9, cost: 45, desc: "Kaliber .45.", usesAmmo: true, ammoType: "ammo", ammoCost: 1 },
    pipe_sniper: { name: "Rohr-Sniper", type: "weapon", slot: "weapon", baseDmg: 12, cost: 60, desc: "Mit Zielfernrohr.", usesAmmo: true, ammoType: "ammo", ammoCost: 2 },
    // Conventional
    pistol_10mm: { name: "10mm Pistole", type: "weapon", slot: "weapon", baseDmg: 12, cost: 150, desc: "Verlässlich.", usesAmmo: true, ammoType: "ammo_10mm", ammoCost: 1 },
    revolver_44: { name: ".44 Revolver", type: "weapon", slot: "weapon", baseDmg: 25, cost: 250, desc: "Dirty Harry Style.", usesAmmo: true, ammoType: "ammo_308", ammoCost: 1 },
    smg: { name: "Maschinenpistole", type: "weapon", slot: "weapon", baseDmg: 10, cost: 55, desc: "Schnellfeuer.", usesAmmo: true, ammoType: "ammo_10mm", ammoCost: 3 },
    hunting_rifle: { name: "Jagdgewehr", type: "weapon", slot: "weapon", baseDmg: 20, cost: 230, desc: "Präzise.", usesAmmo: true, ammoType: "ammo_308", ammoCost: 1 },
    sniper_rifle: { name: "Scharfschützengewehr", type: "weapon", slot: "weapon", baseDmg: 45, cost: 1150, desc: "Tödlich auf Distanz.", usesAmmo: true, ammoType: "ammo_308", ammoCost: 1 },
    shotgun: { name: "Doppelflinte", type: "weapon", slot: "weapon", baseDmg: 30, cost: 350, desc: "Zwei Läufe.", usesAmmo: true, ammoType: "ammo_shell", ammoCost: 2 },
    combat_shotgun: { name: "Kampfflinte", type: "weapon", slot: "weapon", baseDmg: 38, cost: 600, desc: "Magazin-geladen.", usesAmmo: true, ammoType: "ammo_shell", ammoCost: 2 },
    assault_rifle: { name: "Sturmgewehr", type: "weapon", slot: "weapon", baseDmg: 45, cost: 1150, desc: "Militärstandard.", usesAmmo: true, ammoType: "ammo_308", ammoCost: 2 },
    minigun: { name: "Minigun", type: "weapon", slot: "weapon", baseDmg: 48, cost: 1700, desc: "Extremes Schnellfeuer (Mehrfach-Treffer).", usesAmmo: true, ammoType: "ammo_micro", ammoCost: 5 },
    // Energy
    laser_pistol: { name: "Laserpistole", type: "weapon", slot: "weapon", baseDmg: 22, cost: 240, desc: "Vorsicht, heiß.", usesAmmo: true, ammoType: "ammo_cell", ammoCost: 2 },
    laser_rifle: { name: "Lasergewehr", type: "weapon", slot: "weapon", baseDmg: 48, cost: 1250, desc: "Lange Reichweite.", usesAmmo: true, ammoType: "ammo_cell", ammoCost: 2 },
    plasma_pistol: { name: "Plasmapistole", type: "weapon", slot: "weapon", baseDmg: 40, cost: 880, desc: "Grüner Schleim.", usesAmmo: true, ammoType: "ammo_cell", ammoCost: 3 },
    plasma_rifle: { name: "Plasmagewehr", type: "weapon", slot: "weapon", baseDmg: 45, cost: 900, desc: "Schmilzt Rüstung.", usesAmmo: true, ammoType: "ammo_cell", ammoCost: 3 },
    alien_blaster: { name: "Alien Blaster", type: "weapon", slot: "weapon", baseDmg: 80, cost: 3e3, desc: "Extraterrestrisch.", usesAmmo: false },
    // ======================================
    // === RÜSTUNGEN (Nach Sets sortiert) ===
    // ======================================
    raider_armor: { name: "Raider-Rüstung", type: "body", slot: "body", def: 2, cost: 80, bonus: { END: 1, STR: 1 }, desc: "Stachelig." },
    raider_helm: { name: "Sackgassen-Helm", type: "head", slot: "head", def: 1, cost: 40, bonus: { PER: -1, END: 1 }, desc: "Furchteinflößend." },
    raider_arm_l: { name: "Raider-Armschiene (L)", type: "arms", slot: "arms", def: 1, cost: 30, bonus: { STR: 1 }, desc: "Aus Reifen." },
    raider_leg_r: { name: "Raider-Beinschutz", type: "legs", slot: "legs", def: 1, cost: 35, bonus: { END: 1 }, desc: "Rostiges Blech." },
    leather_armor: { name: "Lederrüstung", type: "body", slot: "body", def: 4, cost: 150, bonus: { END: 2, AGI: 2 }, desc: "Leicht und leise." },
    leather_helm: { name: "Lederkappe", type: "head", slot: "head", def: 2, cost: 60, bonus: { PER: 1 }, desc: "Fliegerbrille inklusive." },
    bracers_leather: { name: "Lederarmschienen", type: "arms", slot: "arms", def: 2, cost: 80, bonus: { STR: 1 }, desc: "Klassisch." },
    pants_leather: { name: "Lederhose", type: "legs", slot: "legs", def: 2, cost: 100, bonus: { AGI: 1 }, desc: "Eng anliegend." },
    boots_leather: { name: "Lederstiefel", type: "feet", slot: "feet", def: 1, cost: 70, bonus: { AGI: 1 }, desc: "Guter Halt." },
    metal_armor: { name: "Metallrüstung", type: "body", slot: "body", def: 7, cost: 300, bonus: { END: 5, AGI: -2 }, desc: "Hält Kugeln ab." },
    helmet_metal: { name: "Metallhelm", type: "head", slot: "head", def: 3, cost: 150, bonus: { END: 2, PER: -1 }, desc: "Eingeschränkte Sicht." },
    metal_arms: { name: "Metallarme", type: "arms", slot: "arms", def: 3, cost: 120, bonus: { STR: 1, END: 1 }, desc: "Schwer." },
    greaves_metal: { name: "Metallbeinschienen", type: "legs", slot: "legs", def: 3, cost: 140, bonus: { END: 2, AGI: -1 }, desc: "Klappert laut." },
    combat_armor: { name: "Kampfrüstung", type: "body", slot: "body", def: 12, cost: 600, bonus: { END: 6, STR: 1 }, desc: "Polymer-Verbund." },
    helmet_combat: { name: "Kampfhelm", type: "head", slot: "head", def: 5, cost: 300, bonus: { END: 2, PER: 1 }, desc: "Taktisch." },
    combat_arms: { name: "Kampfarmschienen", type: "arms", slot: "arms", def: 5, cost: 250, bonus: { STR: 2 }, desc: "Verstärkt." },
    combat_legs: { name: "Kampfbeinschützer", type: "legs", slot: "legs", def: 5, cost: 280, bonus: { END: 2, AGI: 1 }, desc: "Beweglich." },
    boots_combat: { name: "Kampfstiefel", type: "feet", slot: "feet", def: 3, cost: 150, bonus: { AGI: 1, END: 1 }, desc: "Militärstandard." },
    synth_armor: { name: "Synth-Rüstung", type: "body", slot: "body", def: 15, cost: 800, bonus: { END: 5, INT: 2 }, desc: "Institut-Technologie." },
    synth_helmet: { name: "Synth-Feldhelm", type: "head", slot: "head", def: 6, cost: 400, bonus: { PER: 2, INT: 1 }, desc: "Volle Abdeckung." },
    vault_suit: { name: "Vault-Anzug", type: "body", slot: "body", def: 1, cost: 0, bonus: { END: 1, INT: 1 }, desc: "Blau und eng." },
    power_armor: { name: "Power Rüstung T-45", type: "body", slot: "body", def: 25, cost: 2500, bonus: { END: 12, STR: 4, RAD: 100, AGI: -3 }, desc: "Ein Panzer zum Anziehen." },
    hazmat_suit: { name: "Strahlenschutzanzug", type: "body", slot: "body", def: 2, cost: 400, bonus: { RAD: 1e3, END: -2 }, desc: "Perfekt für das Leuchtende Meer." },
    cap_baseball: { name: "Baseballkappe", type: "head", slot: "head", def: 1, cost: 20, bonus: { PER: 1 }, desc: "Schützt vor Sonne." },
    helmet_mining: { name: "Minenhelm", type: "head", slot: "head", def: 2, cost: 50, bonus: { END: 1 }, desc: "Mit Lampe." },
    gas_mask: { name: "Gasmaske", type: "head", slot: "head", def: 2, cost: 120, bonus: { RAD: 20 }, desc: "Filtert die Luft." },
    jeans: { name: "Jeans", type: "legs", slot: "legs", def: 1, cost: 30, bonus: { AGI: 1 }, desc: "Bequemer Denim." },
    boots_worn: { name: "Alte Stiefel", type: "feet", slot: "feet", def: 1, cost: 20, bonus: {}, desc: "Besser als barfuß." },
    // --- MONSTER-DROPS ---
    // Diese Materialien werden in data_monsters.js gedroppt. Ohne Definition
    // landeten sie als unbekannte IDs im Inventar: ein Slot belegt, aber in der
    // Inventaransicht unsichtbar (ui_view_inv.js überspringt unbekannte IDs).
    bone: { name: "Knochen", type: "component", cost: 4, icon: "🦴", desc: "Zäh und vielseitig." },
    acid: { name: "Säuredrüse", type: "component", cost: 18, icon: "🧪", desc: "Ätzend. Vorsichtig lagern." },
    poison_gland: { name: "Giftdrüse", type: "component", cost: 25, icon: "☠️", desc: "Roh ungenießbar, verarbeitet wertvoll." },
    gunpowder: { name: "Schießpulver", type: "component", cost: 30, icon: "💥", desc: "Grundstoff für Munition." },
    deathclaw_hand: { name: "Todeskrallen-Hand", type: "rare", cost: 400, icon: "🦾", desc: "Kaum zu glauben, dass du das überlebt hast." },
    titanium: { name: "Titanplatte", type: "rare", cost: 350, icon: "⚙️", desc: "Leicht, hart, begehrt." }
  });
  if (typeof Game !== "undefined") Game.items = window.GameData.items;

  // src/network.js
  var Network2 = window.Network = {
    db: null,
    auth: null,
    myId: null,
    myDisplayName: null,
    otherPlayers: {},
    active: false,
    heartbeatInterval: null,
    config: {
      apiKey: "AIzaSyCgSK4nJ3QOVMBd7m9RSmURflSRWN4ejBY",
      authDomain: "pipboy-rpg.firebaseapp.com",
      databaseURL: "https://pipboy-rpg-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "pipboy-rpg",
      storageBucket: "pipboy-rpg.firebasestorage.app",
      messagingSenderId: "1023458799306",
      appId: "1:1023458799306:web:2d8c1abc23b02beac14e33",
      measurementId: "G-DYGLZTMWWT"
    },
    init: function() {
      this.active = true;
      if (typeof firebase !== "undefined" && !this.db) {
        try {
          if (!firebase.apps.length) firebase.initializeApp(this.config);
          this.db = firebase.database();
          this.auth = firebase.auth();
          this.auth.onAuthStateChanged((user) => {
            if (!user && this.myId) {
              console.warn("Session expired or logged out.");
              this.disconnect();
              if (typeof UI !== "undefined" && UI.logout) {
                UI.logout("VERBINDUNG GETRENNT");
              }
            }
          });
        } catch (e) {
          console.error("Firebase Init Error:", e);
          this.active = false;
        }
      }
    },
    register: async function(email, password, name) {
      if (!this.active) throw new Error("Netzwerk nicht aktiv (Init Failed)");
      const isFree = await this.checkNameAvailability(name);
      if (!isFree) throw new Error("Dieser Name ist bereits vergeben (Charakter lebt noch).");
      const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await user.updateProfile({ displayName: name });
      this.myId = user.uid;
      this.myDisplayName = name;
      return {};
    },
    login: async function(email, password) {
      this.init();
      if (!this.active) throw new Error("Verbindung zu Vault-Tec unterbrochen.");
      try {
        const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const playerRef = this.db.ref("players/" + user.uid);
        const playerSnap = await playerRef.once("value");
        if (playerSnap.exists()) {
          const pData = playerSnap.val();
          const now = Date.now();
          if (pData.lastSeen && now - pData.lastSeen < 12e4) {
            throw new Error("SESSION_ACTIVE");
          }
        }
        this.myId = user.uid;
        this.myDisplayName = user.displayName || "Unknown";
        const snapshot = await this.db.ref("saves/" + this.myId).once("value");
        return snapshot.val() || {};
      } catch (e) {
        console.error("Auth Error:", e);
        if (e.message === "SESSION_ACTIVE") {
          throw new Error("Account ist aktiv! Bitte anderen Tab schließen oder warten.");
        }
        throw e;
      }
    },
    checkNameAvailability: async function(charName) {
      if (!this.db || !charName) return true;
      const safeName = charName.replace(/[.#$\[\]]/g, "_");
      const ref = this.db.ref(`leaderboard/${safeName}`);
      const snap = await ref.once("value");
      if (snap.exists()) {
        const val = snap.val();
        if (val.status === "alive") return false;
      }
      return true;
    },
    updateHighscore: function(gameState) {
      if (!this.active || !this.myId || !gameState || !this.auth.currentUser) return;
      const safeName = (gameState.playerName || "Unknown").replace(/[.#$\[\]]/g, "_");
      const entry = {
        name: gameState.playerName || "Unknown",
        lvl: gameState.lvl,
        kills: gameState.kills || 0,
        xp: gameState.xp + gameState.lvl * 1e3,
        status: "alive",
        owner: this.myId,
        timestamp: Date.now()
      };
      this.db.ref(`leaderboard/${safeName}`).update(entry).catch((e) => {
      });
    },
    // --- NEU: SICHERER TODES-EINTRAG (RIP LOGIK) ---
    registerDeath: function(gameState) {
      if (!this.active || !gameState || !this.auth.currentUser) return;
      const safeName = (gameState.playerName || "Unknown").replace(/[.#$\[\]]/g, "_");
      const ts = Date.now();
      const deadSafeName = safeName + "_RIP_" + ts;
      const entry = {
        name: gameState.playerName || "Unknown",
        // Der Anzeigename bleibt sauber!
        lvl: gameState.lvl,
        kills: gameState.kills || 0,
        xp: gameState.xp + gameState.lvl * 1e3,
        status: "dead",
        owner: this.myId,
        deathTime: ts
      };
      this.db.ref(`leaderboard/${deadSafeName}`).set(entry).catch((e) => console.error(e));
      this.db.ref(`leaderboard/${safeName}`).remove().catch((e) => console.error(e));
    },
    getHighscores: async function() {
      if (!this.active) return [];
      const snap = await this.db.ref("leaderboard").once("value");
      const list = [];
      snap.forEach((child) => {
        list.push(child.val());
      });
      return list;
    },
    saveToSlot: function(slotIndex, gameState) {
      if (!this.active || !this.myId || !this.auth.currentUser) return;
      const saveObj = JSON.parse(JSON.stringify(gameState));
      if (this.auth && this.auth.currentUser && this.auth.currentUser.email) {
        saveObj._userEmail = this.auth.currentUser.email;
      }
      saveObj._lastSeen = Date.now();
      const updates = {};
      updates[`saves/${this.myId}/${slotIndex}`] = saveObj;
      this.db.ref().update(updates).then(() => {
        if (typeof UI !== "undefined") {
          const displayName = gameState && gameState.playerName ? gameState.playerName : "SLOT " + (slotIndex + 1);
          UI.log(displayName + " GESPEICHERT.", "text-cyan-400");
        }
      }).catch((e) => {
        if (e.code !== "PERMISSION_DENIED") console.error("Save Error:", e);
      });
    },
    // --- NEU: SICHERES LÖSCHEN EINES SLOTS ---
    deleteSlot: async function(slotIndex) {
      if (!this.active || !this.myId || !this.auth.currentUser) {
        return Promise.reject("Not authenticated");
      }
      try {
        const snap = await this.db.ref(`saves/${this.myId}/${slotIndex}`).once("value");
        const save = snap.val();
        if (save && save.playerName) {
          const safeName = save.playerName.replace(/[.#$\[\]]/g, "_");
          const lbRef = this.db.ref(`leaderboard/${safeName}`);
          const lbSnap = await lbRef.once("value");
          if (lbSnap.exists() && lbSnap.val().status === "alive") {
            const ts = Date.now();
            const deadSafeName = safeName + "_RIP_" + ts;
            const deadEntry = lbSnap.val();
            deadEntry.status = "dead";
            deadEntry.deathTime = ts;
            await this.db.ref(`leaderboard/${deadSafeName}`).set(deadEntry);
            await lbRef.remove();
          }
        }
        await this.db.ref(`saves/${this.myId}/${slotIndex}`).remove();
        console.log(`✅ Slot ${slotIndex} erfolgreich gelöscht.`);
      } catch (e) {
        console.error("❌ Löschfehler:", e);
        throw e;
      }
    },
    save: function(gameState) {
      if (typeof Game !== "undefined" && Game.state && Game.state.saveSlot !== void 0) {
        this.saveToSlot(Game.state.saveSlot, gameState);
      } else {
        console.error("No Save Slot defined!");
      }
    },
    deleteSave: function() {
      if (!this.active || !this.myId) return;
      if (typeof Game !== "undefined" && Game.state && Game.state.saveSlot !== void 0) {
        this.deleteSlot(Game.state.saveSlot);
      }
    },
    startPresence: function() {
      if (!this.myId || !this.auth.currentUser) return;
      this.db.ref("players/" + this.myId).onDisconnect().remove();
      this.db.ref("players").on("value", (snapshot) => {
        if (!this.active) return;
        const rawData = snapshot.val() || {};
        const now = Date.now();
        const cleanData = {};
        for (let pid in rawData) {
          if (pid === this.myId) continue;
          const p = rawData[pid];
          if (p.lastSeen && now - p.lastSeen > 12e4) continue;
          cleanData[p.name || pid] = p;
        }
        this.otherPlayers = cleanData;
        if (typeof UI !== "undefined") {
          const el = document.getElementById("val-players");
          if (el) el.textContent = `${Object.keys(this.otherPlayers).length + 1}`;
          if (UI.els.spawnScreen && UI.els.spawnScreen.style.display !== "none") {
            UI.renderSpawnList(this.otherPlayers);
          }
          UI.updatePlayerList();
        }
        if (typeof Game !== "undefined" && Game.state && Game.draw) Game.draw();
      });
      if (typeof UI !== "undefined") {
        UI.setConnectionState("online");
        const charName = typeof Game !== "undefined" && Game.state && Game.state.playerName ? Game.state.playerName : this.myDisplayName;
        UI.log(`TERMINAL LINK: ${charName}`, "text-green-400 font-bold");
      }
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, 5e3);
      this.sendHeartbeat();
    },
    disconnect: async function() {
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      if (this.db) {
        this.db.ref("players").off();
      }
      if (this.active && this.db && this.myId) {
        try {
          await this.db.ref("players/" + this.myId).remove();
          console.log("Session sauber beendet & freigegeben.");
        } catch (e) {
          console.error("Fehler beim Session-Freigeben:", e);
        }
      }
      this.active = false;
      this.myId = null;
    },
    sendHeartbeat: function() {
      if (!this.active || !this.myId || !this.auth.currentUser) return;
      if (typeof Game !== "undefined" && Game.state && Game.state.view === "map") {
        this.db.ref("players/" + this.myId).update({
          lastSeen: Date.now(),
          name: Game.state.playerName || this.myDisplayName,
          x: Game.state.player.x,
          y: Game.state.player.y,
          sector: Game.state.sector,
          lvl: Game.state.lvl
        }).catch((e) => {
        });
      }
    },
    sendBugReport: async function(reportData) {
      if (!this.db) return false;
      try {
        await this.db.ref("bug_reports").push(reportData);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
  };

  // src/admin.js
  var Admin = window.Admin = {
    gatePass: "bimbo123",
    adminUser: "admin@pipboy-system.com",
    adminPass: "zintel1992",
    dbData: {},
    bugData: {},
    lbData: {},
    currentPath: null,
    currentUserData: null,
    itemsList: [],
    isLoaded: false,
    invFilter: {
      search: "",
      category: "ALL"
    },
    unlock: function() {
      const input = document.getElementById("gate-pass").value;
      const msg = document.getElementById("gate-msg");
      if (input === this.gatePass) {
        msg.className = "mt-4 h-6 text-green-500 font-bold";
        msg.textContent = "ACCESS GRANTED. ESTABLISHING UPLINK...";
        this.connectFirebase();
      } else {
        msg.textContent = "ACCESS DENIED.";
        document.getElementById("gate-pass").value = "";
      }
    },
    updateLoader: function(percent, text) {
      const bar = document.getElementById("loader-bar");
      const status = document.getElementById("loader-status");
      if (bar) bar.style.width = percent + "%";
      if (status) status.textContent = text;
    },
    connectFirebase: async function() {
      if (typeof Network !== "undefined" && !Network.db) {
        try {
          if (typeof Network.init === "function") Network.init();
        } catch (e) {
        }
      }
      try {
        document.getElementById("gate-screen").classList.add("hidden");
        document.getElementById("admin-loader").classList.remove("hidden");
        this.updateLoader(10, "AUTHENTICATING...");
        await Network.login(this.adminUser, this.adminPass);
        this.updateLoader(30, "DOWNLOADING SECURE DATA...");
        document.getElementById("conn-dot").classList.replace("bg-red-500", "bg-green-500");
        document.getElementById("conn-dot").classList.remove("animate-pulse");
        this.initData();
      } catch (e) {
        document.getElementById("admin-loader").classList.add("hidden");
        document.getElementById("gate-screen").classList.remove("hidden");
        document.getElementById("gate-msg").textContent = "UPLINK FAILED: " + e.code;
        console.error(e);
      }
    },
    initData: function() {
      const items = typeof Game !== "undefined" && Game.items ? Game.items : window.GameData ? window.GameData.items : {};
      this.itemsList = Object.entries(items).map(([k, v]) => ({ id: k, ...v }));
      this.updateLoader(50, "LISTENING TO VAULT-TEC FREQUENCIES...");
      Network.db.ref("saves").on("value", (snap) => {
        this.dbData = snap.val() || {};
        this.renderUserList();
        if (this.currentPath) {
          const parts = this.currentPath.split("/");
          if (this.dbData[parts[1]] && this.dbData[parts[1]][parts[2]]) {
            this.selectUser(this.currentPath, true);
          }
        }
        if (!this.isLoaded) {
          this.isLoaded = true;
          this.updateLoader(100, "SYSTEM READY.");
          setTimeout(() => {
            document.getElementById("admin-loader").classList.add("hidden");
            const app = document.getElementById("app-ui");
            app.classList.remove("hidden");
            setTimeout(() => app.classList.remove("opacity-0"), 50);
          }, 800);
        }
      });
      Network.db.ref("bug_reports").on("value", (snap) => {
        this.bugData = snap.val() || {};
        const count = Object.keys(this.bugData).length;
        const counter = document.getElementById("bug-count");
        const badge = document.getElementById("menu-bug-badge");
        if (counter) counter.textContent = count;
        if (badge) {
          if (count > 0) badge.classList.remove("hidden");
          else badge.classList.add("hidden");
        }
        if (!document.getElementById("bug-overlay").classList.contains("hidden")) {
          this.renderBugs();
        }
      });
      Network.db.ref("leaderboard").on("value", (snap) => {
        this.lbData = snap.val() || {};
        if (document.getElementById("lb-overlay") && !document.getElementById("lb-overlay").classList.contains("hidden")) {
          this.renderLeaderboard();
        }
      });
    },
    toggleSystemMenu: function() {
      const menu = document.getElementById("system-menu");
      if (menu) menu.classList.toggle("hidden");
    },
    setupMenuClose: function() {
      document.addEventListener("click", (e) => {
        const menu = document.getElementById("system-menu");
        const btn = document.querySelector('button[onclick="Admin.toggleSystemMenu()"]');
        if (menu && !menu.classList.contains("hidden") && !menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
          menu.classList.add("hidden");
        }
      });
    },
    showToast: function(msg, type = "info") {
      const container = document.getElementById("toast-container");
      if (!container) return;
      const el = document.createElement("div");
      let colors = "border-green-500 text-green-400 bg-black";
      if (type === "warning") colors = "border-yellow-500 text-yellow-400 bg-black";
      if (type === "error") colors = "border-red-500 text-red-400 bg-black";
      el.className = `flex items-center justify-between p-3 border-l-4 ${colors} shadow-[0_0_15px_rgba(0,0,0,0.8)] min-w-[250px] animate-slide-in pointer-events-auto bg-opacity-90 transition-all duration-300 transform translate-x-0 mb-2`;
      el.innerHTML = `
            <div class="font-mono text-xs font-bold mr-4 uppercase tracking-widest flex items-center gap-2">
                <span>${type === "warning" ? "⚠️" : type === "error" ? "❌" : "ℹ️"}</span>
                ${msg}
            </div>
            <button class="text-xs opacity-50 hover:opacity-100 font-bold px-1">X</button>
        `;
      el.querySelector("button").onclick = () => el.remove();
      container.appendChild(el);
      setTimeout(() => {
        el.classList.add("opacity-0", "translate-x-10");
        setTimeout(() => el.remove(), 300);
      }, 4e3);
    },
    confirm: function(title, text, callback) {
      const overlay = document.getElementById("admin-confirm-overlay");
      const elTitle = document.getElementById("admin-confirm-title");
      const elText = document.getElementById("admin-confirm-text");
      const btnYes = document.getElementById("admin-confirm-yes");
      const btnNo = document.getElementById("admin-confirm-no");
      if (!overlay) {
        if (confirm(text)) callback();
        return;
      }
      elTitle.textContent = title;
      elText.innerHTML = text;
      btnYes.onclick = null;
      btnNo.onclick = null;
      btnYes.onclick = () => {
        overlay.classList.add("hidden");
        callback();
      };
      btnNo.onclick = () => {
        overlay.classList.add("hidden");
      };
      overlay.classList.remove("hidden");
    },
    showLeaderboard: function() {
      let overlay = document.getElementById("lb-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "lb-overlay";
        overlay.className = "fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 admin-font";
        overlay.innerHTML = `
                <div class="panel-box w-full max-w-4xl h-[80vh] flex flex-col shadow-[0_0_30px_#aa0] border-2 border-yellow-500">
                    <div class="p-4 border-b border-yellow-900 flex justify-between items-center bg-yellow-900/20 shrink-0">
                        <h2 class="text-xl font-bold text-yellow-400 tracking-widest">VAULT LEGENDS MANAGER</h2>
                        <button onclick="document.getElementById('lb-overlay').classList.add('hidden')" class="text-red-500 font-bold border border-red-500 px-3 py-1 hover:bg-red-900">CLOSE</button>
                    </div>
                    <div class="p-2 bg-black border-b border-gray-800 text-[10px] text-gray-400 font-mono shrink-0">
                        INFO: 'DEAD' Status means the name is free to take. 'ALIVE' locks the name. DELETE removes the entry entirely.
                    </div>
                    <div class="flex-1 overflow-hidden relative flex flex-col">
                        <div class="bg-black border-b border-yellow-900 text-yellow-600 text-xs font-bold grid grid-cols-12 p-2 shrink-0 z-10">
                            <div class="col-span-3">NAME</div>
                            <div class="col-span-1">LVL</div>
                            <div class="col-span-2">XP</div>
                            <div class="col-span-2">STATUS</div>
                            <div class="col-span-4 text-right">ACTIONS</div>
                        </div>
                        <div class="flex-1 custom-scroll p-2 bg-black/50">
                            <div id="lb-list" class="flex flex-col gap-1"></div>
                        </div>
                    </div>
                </div>
            `;
        document.body.appendChild(overlay);
      }
      overlay.classList.remove("hidden");
      this.renderLeaderboard();
      document.getElementById("system-menu")?.classList.add("hidden");
    },
    renderLeaderboard: function() {
      const list = document.getElementById("lb-list");
      if (!list) return;
      list.innerHTML = "";
      const entries = Object.entries(this.lbData).map(([key, val]) => ({ key, ...val }));
      entries.sort((a, b) => b.lvl - a.lvl || b.xp - a.xp);
      entries.forEach((entry) => {
        const isDead = entry.status === "dead";
        const div = document.createElement("div");
        div.className = "grid grid-cols-12 gap-2 items-center p-2 border-b border-gray-900 hover:bg-[#002200] transition-colors text-sm font-mono";
        const statusColor = isDead ? "text-red-500" : "text-green-500";
        const statusIcon = isDead ? "❌ DEAD" : "💚 ALIVE";
        div.innerHTML = `
                <div class="col-span-3 text-white font-bold truncate" title="${entry.name}">${entry.name}</div>
                <div class="col-span-1 text-gray-300">${entry.lvl}</div>
                <div class="col-span-2 text-gray-500 text-xs">${entry.xp}</div>
                <div class="col-span-2 ${statusColor} font-bold text-xs">${statusIcon}</div>
                <div class="col-span-4 text-right flex gap-1 justify-end">
                    ${!isDead ? `<button onclick="Admin.lbAction('${entry.key}', 'kill')" class="bg-red-900/30 text-red-400 border border-red-900 px-2 py-1 text-[10px] hover:bg-red-500 hover:text-black">☠️ KILL</button>` : `<button onclick="Admin.lbAction('${entry.key}', 'revive')" class="bg-green-900/30 text-green-400 border border-green-900 px-2 py-1 text-[10px] hover:bg-green-500 hover:text-black">❤️ REVIVE</button>`}
                    <button onclick="Admin.lbAction('${entry.key}', 'delete')" class="bg-gray-800 text-gray-400 border border-gray-600 px-2 py-1 text-[10px] hover:bg-gray-200 hover:text-black">🗑️ DEL</button>
                </div>
            `;
        list.appendChild(div);
      });
    },
    lbAction: function(key, action) {
      const ref = Network.db.ref("leaderboard/" + key);
      if (action === "kill") {
        this.confirm("MARK AS DEAD", `Mark <b>${key}</b> as DEAD?<br>This frees the name for new players.`, () => {
          ref.update({ status: "dead", deathTime: Date.now() });
          this.showToast("LEGEND MARKED DEAD", "warning");
        });
      } else if (action === "revive") {
        ref.update({ status: "alive" });
        this.showToast("LEGEND REVIVED");
      } else if (action === "delete") {
        this.confirm("DELETE LEGEND", `PERMANENTLY DELETE <b>${key}</b> from highscores?<br>This cannot be undone.`, () => {
          ref.remove();
          this.showToast("LEGEND DELETED", "error");
        });
      }
    },
    // --- BUGS (UPDATED) ---
    showBugs: function() {
      document.getElementById("bug-overlay").classList.remove("hidden");
      document.getElementById("system-menu")?.classList.add("hidden");
      this.renderBugs();
    },
    renderBugs: function() {
      const list = document.getElementById("bug-list");
      list.innerHTML = "";
      const reports = [];
      for (let key in this.bugData) {
        reports.push({ id: key, ...this.bugData[key] });
      }
      reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (reports.length === 0) {
        list.innerHTML = '<div class="text-center text-green-500 italic mt-10">NO BUGS REPORTED. SYSTEM CLEAN.</div>';
        return;
      }
      reports.forEach((bug) => {
        const date = new Date(bug.timestamp).toLocaleString();
        const div = document.createElement("div");
        div.className = "border border-red-500 bg-red-900/20 p-4 relative mb-4 shadow-[0_0_15px_rgba(255,0,0,0.2)]";
        const copyData = JSON.stringify(bug, null, 2);
        div.innerHTML = `
                <div class="flex justify-between items-start mb-2 border-b border-red-800 pb-2">
                    <div>
                        <span class="text-red-400 font-bold text-lg block">${bug.error || "UNKNOWN ERROR"}</span>
                        <div class="text-xs text-gray-400">${date} | Player: <span class="text-white font-bold">${bug.playerName}</span></div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="Admin.copyBugReport(this)" data-bug='${copyData}' class="btn border-cyan-500 text-cyan-500 text-xs px-2 py-1 hover:bg-cyan-900">COPY JSON</button>
                        <button onclick="Admin.deleteBug('${bug.id}')" class="btn btn-danger text-xs px-2 py-1">DELETE</button>
                    </div>
                </div>
                <div class="text-sm text-gray-300 font-mono mb-2 bg-black/50 p-2 border border-red-900/50">
                    <span class="text-red-600 font-bold">DESC:</span> ${bug.description}
                </div>
                <div class="text-[10px] text-gray-500 font-mono bg-black p-2 border border-gray-800">
                    LOC: ${bug.gameState?.sector || "Unknown"} | VIEW: ${bug.gameState?.view} | CAPS: ${bug.gameState?.caps || 0} | AGENT: ${bug.userAgent}
                </div>
            `;
        list.appendChild(div);
      });
    },
    copyBugReport: function(btn) {
      const data = btn.getAttribute("data-bug");
      navigator.clipboard.writeText(data).then(() => {
        this.showToast("REPORT COPIED TO CLIPBOARD", "info");
      }).catch((err) => {
        this.showToast("COPY FAILED", "error");
        console.error(err);
      });
    },
    deleteBug: function(id) {
      this.confirm("DELETE BUG REPORT", "Diesen Bug Report wirklich löschen?", () => {
        Network.db.ref("bug_reports/" + id).remove();
        this.showToast("BUG DELETED");
      });
    },
    refresh: function() {
      location.reload();
    },
    toggleSidebar: function() {
      const sb = document.getElementById("sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      if (sb.classList.contains("-translate-x-full")) {
        sb.classList.remove("-translate-x-full");
        overlay.classList.remove("hidden");
      } else {
        sb.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
      }
    },
    renderUserList: function() {
      const list = document.getElementById("user-list");
      const filter = document.getElementById("search-player").value.toLowerCase();
      list.innerHTML = "";
      let count = 0;
      for (let uid in this.dbData) {
        const slots = this.dbData[uid];
        for (let slotIdx in slots) {
          const save = slots[slotIdx];
          const name = (save.playerName || "Unknown").toLowerCase();
          const path = `saves/${uid}/${slotIdx}`;
          if (filter && !name.includes(filter) && !uid.includes(filter)) continue;
          const div = document.createElement("div");
          const isSelected = this.currentPath === path;
          const isDead = save.hp <= 0;
          div.className = `p-2 cursor-pointer border-b border-[#1a331a] flex justify-between items-center hover:bg-[#39ff14] hover:text-black transition-colors ${isSelected ? "bg-[#39ff14] text-black font-bold" : "text-[#39ff14]"}`;
          div.onclick = () => {
            this.selectUser(path);
            const sb = document.getElementById("sidebar");
            if (!sb.classList.contains("-translate-x-full")) {
              this.toggleSidebar();
            }
          };
          div.innerHTML = `
                    <div class="flex flex-col overflow-hidden">
                        <span class="truncate uppercase">${isDead ? "💀 " : ""}${save.playerName || "NO_NAME"}</span>
                        <span class="text-[10px] opacity-60 font-mono">${save._userEmail || uid.substr(0, 8)}</span>
                    </div>
                    <div class="text-right text-xs">
                        <div>LVL ${save.lvl || 1}</div>
                        <div>SEC ${save.sector ? `${save.sector.x},${save.sector.y}` : "?,?"}</div>
                    </div>
                `;
          list.appendChild(div);
          count++;
        }
      }
      document.getElementById("user-count").textContent = count;
    },
    selectUser: function(path, silent = false) {
      try {
        this.currentPath = path;
        const parts = path.split("/");
        const uid = parts[1];
        const slot = parts[2];
        this.currentUserData = this.dbData[uid][slot];
        const d = this.currentUserData;
        if (!silent) this.tab("general");
        document.getElementById("no-selection").classList.add("hidden");
        document.getElementById("editor-content").classList.remove("hidden");
        document.getElementById("editor-error").classList.add("hidden");
        document.getElementById("edit-name").textContent = d.playerName || "Unknown";
        document.getElementById("edit-uid").textContent = uid;
        document.getElementById("edit-slot").textContent = slot;
        document.getElementById("edit-email").textContent = d._userEmail || "No Email";
        document.getElementById("quick-lvl").value = d.lvl || 1;
        document.getElementById("quick-xp").value = d.xp || 0;
        this.fillGeneral(d);
        this.fillStats(d);
        this.fillInv(d);
        this.fillWorld(d);
        this.fillCamp(d);
        this.fillRaw(d);
        if (!silent) this.renderUserList();
      } catch (e) {
        console.error(e);
        const errBox = document.getElementById("editor-error");
        errBox.textContent = "RENDER ERROR: " + e.message;
        errBox.classList.remove("hidden");
      }
    },
    fillGeneral: function(d) {
      document.getElementById("inp-hp").value = Math.round(d.hp || 0);
      document.getElementById("inp-maxhp").value = d.maxHp || 10;
      document.getElementById("inp-rads").value = d.rads || 0;
      document.getElementById("inp-caps").value = d.caps || 0;
    },
    fillStats: function(d) {
      const container = document.getElementById("special-container");
      container.innerHTML = "";
      const stats = d.stats || { STR: 1, PER: 1, END: 1, CHA: 1, INT: 1, AGI: 1, LUC: 1 };
      for (let key in stats) {
        const val = stats[key];
        const div = document.createElement("div");
        div.className = "panel-box p-2 flex justify-between items-center";
        div.innerHTML = `
                <span class="font-bold text-xl w-12">${key}</span>
                <input type="range" min="1" max="20" value="${val}" class="flex-grow mx-2 accent-[#39ff14]" 
                    oninput="document.getElementById('val-${key}').textContent=this.value"
                    onchange="Admin.saveStat('${key}', this.value)">
                <span id="val-${key}" class="font-bold text-xl w-6 text-right">${val}</span>
            `;
        container.appendChild(div);
      }
      document.getElementById("inp-statPoints").value = d.statPoints || 0;
      document.getElementById("inp-perkPoints").value = d.perkPoints || 0;
      const perkContainer = document.getElementById("perk-list-container");
      if (perkContainer) {
        perkContainer.innerHTML = "";
        const allPerks = window.GameData && window.GameData.perks ? window.GameData.perks : [];
        const userPerks = d.perks || {};
        if (allPerks.length === 0) {
          perkContainer.innerHTML = '<div class="col-span-2 text-gray-500">No Perk Definitions found via GameData.</div>';
        } else {
          allPerks.forEach((p) => {
            let lvl = userPerks[p.id] || 0;
            if (Array.isArray(userPerks)) lvl = userPerks.includes(p.id) ? 1 : 0;
            const maxLvl = p.max || 1;
            const div = document.createElement("div");
            div.className = "panel-box p-2 flex justify-between items-center";
            div.innerHTML = `
                        <span class="font-bold text-sm w-32 truncate text-[#39ff14]" title="${p.name}">${p.name}</span>
                        <input type="range" min="0" max="${maxLvl}" value="${lvl}" class="flex-grow mx-2 accent-[#39ff14]"
                            oninput="document.getElementById('perk-val-${p.id}').textContent=this.value"
                            onchange="Admin.savePerk('${p.id}', this.value)">
                        <span id="perk-val-${p.id}" class="font-bold text-xl w-6 text-right">${lvl}</span>
                    `;
            perkContainer.appendChild(div);
          });
        }
      }
    },
    saveStat: function(stat, val) {
      if (!this.currentPath) return;
      Network.db.ref(this.currentPath + "/stats/" + stat).set(Number(val));
      this.showToast(`UPDATED ${stat}. SYNC REQUIRED!`, "warning");
    },
    savePerk: function(perkId, val) {
      if (!this.currentPath) return;
      const valNum = Number(val);
      Network.db.ref(this.currentPath + "/perks/" + perkId).set(valNum);
      this.showToast(`PERK ${perkId} UPDATED. SYNC!`, "warning");
    },
    fillInv: function(d) {
      const invTab = document.getElementById("tab-inv");
      const str = d.stats && d.stats.STR ? d.stats.STR : 5;
      let sbLvl = 0;
      if (d.perks) {
        if (Array.isArray(d.perks)) {
          if (d.perks.includes("strong_back")) sbLvl = 1;
        } else {
          sbLvl = d.perks["strong_back"] || 0;
        }
      }
      let packBonus = 0;
      if (d.equip && d.equip.back) {
        if (d.equip.back.bonus && d.equip.back.bonus.slots) packBonus = d.equip.back.bonus.slots;
        else if (d.equip.back.props && d.equip.back.props.bonus && d.equip.back.props.bonus.slots) packBonus = d.equip.back.props.bonus.slots;
      }
      const maxSlots = 10 + str + sbLvl * 5 + packBonus;
      const usedSlots = d.inventory ? d.inventory.length : 0;
      const loadColor = usedSlots > maxSlots ? "text-red-500 animate-pulse" : "text-gray-400";
      invTab.innerHTML = `
            <div class="flex flex-col h-full gap-2">
                <div class="flex justify-between items-center px-2 py-1 bg-[#001100] border border-[#1a551a]">
                    <span class="text-[10px] text-green-600">INVENTORY LOAD (CALC)</span>
                    <span class="text-xs font-bold ${loadColor}">${usedSlots} / ${maxSlots}</span>
                </div>
                <div class="panel-box p-2 shrink-0">
                    <h3 class="text-yellow-400 font-bold border-b border-[#1a551a] mb-1 text-xs">EQUIPPED</h3>
                    <div id="equip-list" class="grid grid-cols-2 gap-1 text-[10px]"></div>
                </div>
                <div class="panel-box flex flex-col flex-1 min-h-0 overflow-hidden relative">
                    <div class="bg-[#002200] p-2 border-b border-[#1a551a] shrink-0 z-10">
                        <div class="flex gap-2 mb-1">
                            <input type="text" id="admin-item-search" 
                                class="w-full bg-black border border-green-500 text-green-300 text-xs p-1 uppercase font-mono"
                                placeholder="SEARCH..." 
                                value="${this.invFilter.search}"
                                onkeyup="Admin.updateItemFilter(this.value)">
                        </div>
                        <div class="flex flex-wrap gap-1 justify-center" id="filter-btns"></div>
                    </div>
                    <div class="flex-1 custom-scroll bg-black relative">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-[#001100] text-gray-500 text-[9px] sticky top-0 z-20 border-b border-[#1a551a]">
                                <tr>
                                    <th class="p-1 pl-2">ITEM NAME</th>
                                    <th class="p-1 w-24 hidden md:table-cell">ID</th>
                                    <th class="p-1 w-20 text-right pr-2">ADD</th>
                                </tr>
                            </thead>
                            <tbody id="admin-item-table-body" class="text-xs font-mono"></tbody>
                        </table>
                    </div>
                </div>
                <div class="panel-box p-2 h-1/4 shrink-0 flex flex-col">
                    <h3 class="text-gray-500 font-bold text-[10px] mb-1">PLAYER INVENTORY</h3>
                    <div class="flex-1 custom-scroll bg-black border border-[#1a551a]">
                        <table class="w-full text-left border-collapse">
                            <thead class="text-[9px] text-gray-400 bg-[#001100] sticky top-0">
                                <tr><th class="p-1">ITEM</th><th class="p-1 text-center">QTY</th><th class="p-1 text-right">ACT</th></tr>
                            </thead>
                            <tbody id="inv-table-body" class="text-[10px] font-mono"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
      const equipList = document.getElementById("equip-list");
      if (d.equip) {
        for (let slot in d.equip) {
          const item = d.equip[slot];
          if (item) {
            const div = document.createElement("div");
            div.className = "flex justify-between items-center bg-black/50 p-1 border border-[#1a551a]";
            div.innerHTML = `
                        <div class="truncate"><span class="text-gray-500 mr-1">${slot.substr(0, 1).toUpperCase()}:</span><span class="text-green-300">${item.name}</span></div>
                        <button onclick="Admin.forceUnequip('${slot}')" class="text-red-500 hover:text-white ml-1 font-bold">×</button>
                    `;
            equipList.appendChild(div);
          }
        }
      }
      const tbody = document.getElementById("inv-table-body");
      const inv = d.inventory || [];
      const items = window.GameData && window.GameData.items ? window.GameData.items : {};
      inv.forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-[#1a331a] hover:bg-[#002200]";
        let name = item.id;
        if (items[item.id]) name = items[item.id].name;
        if (item.props && item.props.name) name = item.props.name + "*";
        tr.innerHTML = `
                <td class="p-1 truncate max-w-[120px]" title="${name}">${name}</td>
                <td class="p-1 text-center text-yellow-500">${item.count}</td>
                <td class="p-1 text-right">
                    <button onclick="Admin.invDelete(${idx})" class="text-red-500 hover:text-white font-bold px-1">DEL</button>
                </td>
            `;
        tbody.appendChild(tr);
      });
      const cats = ["ALL", "WEAPON", "APPAREL", "AID", "JUNK", "NOTES"];
      const btnContainer = document.getElementById("filter-btns");
      cats.forEach((c) => {
        const btn = document.createElement("button");
        const active = this.invFilter.category === c;
        btn.className = `px-2 py-0.5 text-[9px] border ${active ? "bg-green-500 text-black border-green-500 font-bold" : "bg-black text-green-500 border-green-800 hover:border-green-500"}`;
        btn.textContent = c;
        btn.onclick = () => {
          this.invFilter.category = c;
          this.refreshItemBrowser();
        };
        btnContainer.appendChild(btn);
      });
      this.refreshItemBrowser();
    },
    updateItemFilter: function(val) {
      this.invFilter.search = val.toLowerCase();
      this.refreshItemBrowser();
    },
    getItemCategory: function(type) {
      if (!type) return "MISC";
      if (type === "weapon" || type === "ammo") return "WEAPON";
      if (["body", "head", "legs", "feet", "arms", "back"].includes(type)) return "APPAREL";
      if (type === "consumable") return "AID";
      if (type === "blueprint") return "NOTES";
      if (["junk", "component", "rare", "tool"].includes(type)) return "JUNK";
      return "MISC";
    },
    refreshItemBrowser: function() {
      const tbody = document.getElementById("admin-item-table-body");
      if (!tbody) return;
      tbody.innerHTML = "";
      const allItems = this.itemsList;
      let count = 0;
      allItems.sort((a, b) => a.name.localeCompare(b.name));
      allItems.forEach((item) => {
        const cat = this.getItemCategory(item.type);
        if (this.invFilter.category !== "ALL" && cat !== this.invFilter.category) return;
        if (this.invFilter.search) {
          const searchStr = (item.name + " " + item.id).toLowerCase();
          if (!searchStr.includes(this.invFilter.search)) return;
        }
        const tr = document.createElement("tr");
        tr.className = "border-b border-[#1a331a] hover:bg-[#003300] transition-colors group";
        let icon = "📦";
        if (item.type === "weapon") icon = "🔫";
        if (item.type === "ammo") icon = "🧨";
        if (item.type === "consumable") icon = "💉";
        if (item.type === "back") icon = "🎒";
        if (["body", "head", "arms", "legs", "feet"].includes(item.type)) icon = "🛡️";
        tr.innerHTML = `
                <td class="p-1 pl-2 flex items-center gap-2 overflow-hidden">
                    <span class="opacity-50 text-[10px]">${icon}</span>
                    <div class="flex flex-col min-w-0">
                        <span class="text-green-300 font-bold truncate group-hover:text-white">${item.name}</span>
                        <span class="text-[8px] text-gray-500 md:hidden">${item.id}</span>
                    </div>
                </td>
                <td class="p-1 hidden md:table-cell text-[9px] text-gray-500 font-mono">${item.id}</td>
                <td class="p-1 pr-2 text-right whitespace-nowrap">
                    <button onclick="Admin.invAddDirect('${item.id}', 1)" class="bg-[#1a331a] text-green-400 text-[9px] px-1.5 py-0.5 border border-green-900 hover:bg-green-500 hover:text-black transition">+1</button>
                    <button onclick="Admin.invAddDirect('${item.id}', 10)" class="bg-[#1a331a] text-green-400 text-[9px] px-1.5 py-0.5 border border-green-900 hover:bg-green-500 hover:text-black transition ml-1">+10</button>
                </td>
            `;
        tbody.appendChild(tr);
        count++;
      });
      if (count === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 text-xs py-4 italic">- NO ITEMS FOUND -</td></tr>`;
      }
    },
    invAddDirect: function(id, count) {
      if (!this.currentPath || !this.currentUserData) return;
      const inv = [...this.currentUserData.inventory || []];
      let found = false;
      for (let item of inv) {
        if (item.id === id && !item.props) {
          item.count += count;
          found = true;
          break;
        }
      }
      if (!found) {
        inv.push({ id, count, isNew: true });
      }
      Network.db.ref(this.currentPath + "/inventory").set(inv);
      this.showToast(`ADDED ${count}x ${id}. PLEASE SYNC.`, "warning");
    },
    fillCamp: function(d) {
      const container = document.getElementById("camp-data-content");
      let html = "";
      if (!d.camp) {
        html += `<div class="mb-4 text-gray-500 italic">No camp deployed.</div>`;
        const savedLvl = d.savedCampLevel || 1;
        html += `
                <div class="panel-box p-3 border border-gray-700 mb-4">
                    <label class="block text-xs text-gray-500 mb-1">STORED CAMP LEVEL</label>
                    <div class="flex items-center gap-2">
                         <input type="number" value="${savedLvl}" class="text-xl font-bold w-16 text-center bg-black border border-gray-600 text-gray-300" onchange="Admin.saveVal('savedCampLevel', this.value)">
                         <span class="text-[10px] text-gray-600">Persisted Level</span>
                    </div>
                </div>
            `;
        html += `<button onclick="Admin.action('force-camp')" class="btn border-yellow-500 text-yellow-500 w-full text-sm">FORCE DEPLOY (Using Stored Lvl)</button>`;
      } else {
        html += `<div class="grid grid-cols-2 gap-4"><div><label class="block text-xs text-green-600 mb-1">LEVEL</label><input type="number" value="${d.camp.level || 1}" class="text-2xl font-bold w-20 text-center" onchange="Admin.saveVal('camp/level', this.value)"></div><div><label class="block text-xs text-green-600 mb-1">LOCATION</label><div class="text-xs text-gray-500">Sector: ${d.camp.sector.x},${d.camp.sector.y}</div></div></div><button onclick="Admin.action('destroy-camp')" class="btn btn-danger w-full mt-4">DESTROY CAMP</button>`;
      }
      container.innerHTML = html;
    },
    fillWorld: function(d) {
      const sx = d.sector ? d.sector.x : 0;
      const sy = d.sector ? d.sector.y : 0;
      document.getElementById("view-sector").textContent = `${sx},${sy}`;
      document.getElementById("tele-x").value = sx;
      document.getElementById("tele-y").value = sy;
      const qList = document.getElementById("quest-list");
      qList.innerHTML = "";
      const active = d.activeQuests || d.quests || [];
      const completed = d.completedQuests || [];
      if (active.length === 0 && completed.length === 0) {
        qList.innerHTML = '<div class="text-gray-500 italic">No quest data found.</div>';
      }
      active.forEach((q) => {
        const id = q.id || q;
        const progress = q.progress !== void 0 ? `${q.progress}/${q.max}` : "?";
        const div = document.createElement("div");
        div.className = "flex justify-between border-b border-[#1a331a] p-2 text-sm bg-yellow-900/20";
        div.innerHTML = `<div><span class="font-bold text-yellow-400">${id}</span><div class="text-xs opacity-70">Progress: ${progress}</div></div><span class="text-yellow-500 text-xs">ACTIVE</span>`;
        qList.appendChild(div);
      });
      completed.forEach((qid) => {
        const div = document.createElement("div");
        div.className = "flex justify-between border-b border-[#1a331a] p-2 text-sm opacity-60";
        div.innerHTML = `<span class="text-gray-400">${qid}</span><span class="text-green-500 text-xs">DONE</span>`;
        qList.appendChild(div);
      });
    },
    fillRaw: function(d) {
      document.getElementById("raw-json").value = JSON.stringify(d, null, 2);
    },
    tab: function(id) {
      document.querySelectorAll('[id^="tab-btn-"]').forEach((b) => {
        b.classList.replace("active-tab", "inactive-tab");
      });
      const btn = document.getElementById("tab-btn-" + id);
      if (btn) btn.classList.replace("inactive-tab", "active-tab");
      ["general", "stats", "inv", "camp", "world", "raw"].forEach((t) => {
        const el = document.getElementById("tab-" + t);
        if (el) el.classList.add("hidden");
      });
      const target = document.getElementById("tab-" + id);
      if (target) target.classList.remove("hidden");
    },
    // Save Logic with Reminder
    saveVal: function(key, val) {
      if (!this.currentPath) return;
      if (!isNaN(val) && val !== "") val = Number(val);
      Network.db.ref(this.currentPath + "/" + key).set(val);
      this.showToast("VALUE SAVED. SYNC LATER.", "warning");
    },
    modVal: function(key, amount) {
      if (!this.currentUserData) return;
      let current = this.currentUserData[key] || 0;
      this.saveVal(key, current + amount);
    },
    action: function(type) {
      if (!this.currentPath) return;
      const updates = {};
      const p = this.currentPath;
      const performUpdate = () => {
        Network.db.ref(p).update(updates);
        this.showToast("ACTION PERFORMED. PLEASE SYNC.", "warning");
      };
      if (type === "heal") {
        updates["hp"] = this.currentUserData.maxHp || 100;
        updates["rads"] = 0;
        updates["isGameOver"] = false;
        performUpdate();
      } else if (type === "de-rad") {
        updates["rads"] = 0;
        performUpdate();
      } else if (type === "kill") {
        this.confirm("KILL PLAYER", "Dies setzt HP auf 0...", () => {
          updates["hp"] = 0;
          updates["isGameOver"] = true;
          performUpdate();
        });
      } else if (type === "revive") {
        updates["hp"] = 10;
        updates["isGameOver"] = false;
        performUpdate();
      } else if (type === "delete") {
        this.confirm("DELETE SAVE", "Permanent löschen?", () => {
          Network.db.ref(p).remove();
          this.currentPath = null;
          document.getElementById("editor-content").classList.add("hidden");
          document.getElementById("no-selection").classList.remove("hidden");
          this.showToast("SAVE DELETED.");
        });
      } else if (type === "reset-vault") {
        this.confirm("RESET TO VAULT", "Zurück zu Vault 101?", () => {
          updates["sector"] = { x: 4, y: 4 };
          updates["player"] = { x: 100, y: 100 };
          updates["view"] = "map";
          performUpdate();
        });
      } else if (type === "destroy-camp") {
        this.confirm("DESTROY CAMP", "Camp löschen?", () => {
          Network.db.ref(p + "/camp").remove();
          this.showToast("CAMP DESTROYED. SYNC!", "warning");
        });
      } else if (type === "force-camp") {
        const sec = this.currentUserData.sector || { x: 4, y: 4 };
        const pos = this.currentUserData.player || { x: 100, y: 100 };
        const lvl = this.currentUserData.savedCampLevel || 1;
        updates["camp"] = { sector: sec, x: pos.x, y: pos.y, level: lvl };
        performUpdate();
      }
    },
    teleport: function() {
      const x = Number(document.getElementById("tele-x").value);
      const y = Number(document.getElementById("tele-y").value);
      Network.db.ref(this.currentPath + "/sector").set({ x, y });
      Network.db.ref(this.currentPath + "/player").set({ x: 300, y: 200 });
      this.showToast("PLAYER TELEPORTED. SYNC!", "warning");
    },
    invUpdate: function(idx, val) {
      val = Number(val);
      if (val <= 0) {
        this.invDelete(idx);
      } else {
        Network.db.ref(`${this.currentPath}/inventory/${idx}/count`).set(val);
        this.showToast("INV UPDATED. SYNC!", "warning");
      }
    },
    invDelete: function(idx) {
      this.confirm("DELETE ITEM", "Item wirklich löschen?", () => {
        const inv = [...this.currentUserData.inventory || []];
        inv.splice(idx, 1);
        Network.db.ref(this.currentPath + "/inventory").set(inv);
        this.showToast("ITEM DELETED. SYNC!", "warning");
      });
    },
    forceUnequip: function(slot) {
      this.confirm("UNEQUIP", `${slot} ablegen?`, () => {
        const item = this.currentUserData.equip[slot];
        if (!item) return;
        const inv = [...this.currentUserData.inventory || []];
        inv.push({ id: item.id, count: 1, props: item.props });
        Network.db.ref(this.currentPath + "/inventory").set(inv);
        Network.db.ref(this.currentPath + "/equip/" + slot).remove();
        this.showToast("FORCED UNEQUIP. SYNC!", "warning");
      });
    },
    saveRaw: function() {
      try {
        const data = JSON.parse(document.getElementById("raw-json").value);
        this.confirm("RAW OVERWRITE", "WARNUNG: Datenbank wird direkt überschrieben. Dies ist destruktiv!", () => {
          Network.db.ref(this.currentPath).set(data);
          this.showToast("RAW DATA WRITTEN. SYNC NOW!", "error");
        });
      } catch (e) {
        alert("INVALID JSON: " + e.message);
      }
    }
  };
  setTimeout(() => Admin.setupMenuClose(), 1e3);
})();
