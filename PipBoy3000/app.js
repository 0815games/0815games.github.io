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

  // src/data/data_item_icons.js
  if (typeof window.GameData === "undefined") window.GameData = {};
  window.GameData.itemBilder = [
    "alien_blaster",
    "ammo_10mm",
    "ammo_micro",
    "ammo_shell",
    "assault_rifle",
    "baseball_bat",
    "bat_alum",
    "bat_spiked",
    "boots_combat",
    "boots_leather",
    "bracers_leather",
    "buffout",
    "combat_armor",
    "combat_arms",
    "combat_legs",
    "combat_shotgun",
    "deathclaw_gauntlet",
    "helmet_metal",
    "hunting_rifle",
    "jet",
    "knife",
    "knuckles",
    "laser_pistol",
    "laser_rifle",
    "leather_armor",
    "leather_helm",
    "machete",
    "metal_armor",
    "metal_arms",
    "minigun",
    "nuka_cola",
    "nuka_quantum",
    "pants_leather",
    "pipe_pistol",
    "pipe_revolver",
    "pipe_rifle",
    "pipe_sniper",
    "pipe_wrench",
    "pistol_10mm",
    "plasma_pistol",
    "plasma_rifle",
    "police_baton",
    "power_armor",
    "radaway",
    "radx",
    "raider_arm_l",
    "raider_armor",
    "raider_helm",
    "raider_leg_r",
    "revolver_44",
    "rolling_pin",
    "shotgun",
    "smg",
    "sniper_rifle",
    "stealth_boy",
    "stimpack",
    "switchblade",
    "synth_armor"
  ];

  // src/data/data_recipes.js
  if (typeof window.GameData === "undefined") window.GameData = {};
  window.GameData.recipes = [
    // --- BASIC SURVIVAL ---
    // Schrott-Munition bleibt das Einstiegsrezept. Die übrigen Sorten brauchen
    // passende Zutaten und etwas mehr Level, damit Munition nicht beliebig ist.
    { id: "craft_ammo", type: "ammo", out: "AMMO", count: 10, req: { "junk_metal": 2 }, lvl: 1 },
    { id: "craft_ammo_10mm", type: "ammo", out: "ammo_10mm", count: 10, req: { "junk_metal": 2, "gunpowder": 1 }, lvl: 2 },
    { id: "craft_ammo_308", type: "ammo", out: "ammo_308", count: 10, req: { "junk_metal": 3, "gunpowder": 2 }, lvl: 3 },
    { id: "craft_ammo_shell", type: "ammo", out: "ammo_shell", count: 10, req: { "junk_metal": 3, "gunpowder": 1, "cloth": 1 }, lvl: 3 },
    { id: "craft_ammo_micro", type: "ammo", out: "ammo_micro", count: 20, req: { "junk_metal": 2, "screws": 2 }, lvl: 4 },
    { id: "craft_ammo_cell", type: "ammo", out: "ammo_cell", count: 10, req: { "circuit": 1, "nuclear_mat": 1 }, lvl: 5 },
    { id: "craft_stimpack_simple", type: "med", out: "stimpack", count: 1, req: { "meat_roach": 2, "junk_metal": 1 }, lvl: 1 },
    { id: "craft_stimpack", type: "med", out: "stimpack", count: 1, req: { "meat_fly": 1, "junk_metal": 1, "adhesive": 1 }, lvl: 2 },
    // --- BACKPACK MODDING (TIER SYSTEM) ---
    // Tier 0: Frame (Basis)
    {
      id: "craft_bp_frame",
      type: "gear",
      out: "backpack_frame",
      count: 1,
      req: { "junk_metal": 5, "screws": 2 },
      lvl: 1
    },
    // Tier 1: Leder (Erfordert Frame)
    {
      id: "craft_bp_leather",
      type: "gear",
      out: "backpack_leather",
      count: 1,
      req: { "backpack_frame": 1, "leather": 4, "cloth": 4, "duct_tape": 2 },
      lvl: 2
    },
    // Tier 2: Metall (Erfordert Leder)
    {
      id: "craft_bp_metal",
      type: "gear",
      out: "backpack_metal",
      count: 1,
      req: { "backpack_leather": 1, "junk_metal": 8, "screws": 4, "gears": 2 },
      lvl: 3
    },
    // Tier 3a: Militär (Erfordert Metall + Rare)
    {
      id: "craft_bp_military",
      type: "gear",
      out: "backpack_military",
      count: 1,
      req: { "backpack_metal": 1, "adhesive": 5, "circuit": 1, "cloth": 10 },
      lvl: 5
    },
    // Tier 3b: Lastesel (Erfordert Metall + Viel Material)
    {
      id: "craft_bp_cargo",
      type: "gear",
      out: "backpack_cargo",
      count: 1,
      req: { "backpack_metal": 1, "leather": 10, "springs": 4, "junk_metal": 20 },
      lvl: 5
    },
    // --- CAMPING ---
    { id: "rcp_camp", type: "tool", out: "camp_kit", count: 1, req: { "cloth": 2, "junk_metal": 2 }, lvl: 1 },
    // --- WEAPONS ---
    { id: "craft_machete", type: "weapon", out: "machete", count: 1, req: { "junk_metal": 10, "leather": 2, "adhesive": 2 }, lvl: 2 },
    { id: "craft_pipe_pistol", type: "weapon", out: "pipe_pistol", count: 1, req: { "junk_metal": 6, "screws": 2, "gears": 1 }, lvl: 1 },
    // --- COOKING ---
    { id: "cook_roach", type: "cooking", out: "cooked_roach", count: 1, req: { "meat_roach": 1 }, lvl: 1 },
    { id: "cook_fly", type: "cooking", out: "cooked_fly", count: 1, req: { "meat_fly": 1 }, lvl: 1 },
    { id: "cook_mole", type: "cooking", out: "cooked_mole", count: 1, req: { "meat_mole": 1 }, lvl: 1 },
    { id: "cook_lurk", type: "cooking", out: "cooked_lurk", count: 1, req: { "meat_lurk": 1 }, lvl: 2 },
    { id: "cook_scorp", type: "cooking", out: "cooked_scorp", count: 1, req: { "meat_scorp": 1 }, lvl: 3 },
    { id: "cook_dog", type: "cooking", out: "cooked_dog", count: 1, req: { "meat_dog": 1 }, lvl: 2 },
    { id: "cook_yao", type: "cooking", out: "cooked_yao", count: 1, req: { "meat_yao": 1 }, lvl: 4 }
  ];
  if (typeof Game !== "undefined") Game.recipes = window.GameData.recipes;

  // src/data/data_monsters.js
  if (typeof window.GameData === "undefined") window.GameData = {};
  window.GameData.monsters = {
    // Lvl 1 - Farmbar für das Rucksack-Gestell
    radRoach: {
      name: "Rad-Kakerlake",
      hp: 15,
      dmg: 3,
      xp: [10, 20],
      loot: 2,
      minLvl: 1,
      drops: [
        { id: "junk_metal", c: 0.6 },
        // Häufiger Schrott
        { id: "screws", c: 0.3 },
        // NEU: Schrauben (30% Chance)
        { id: "meat_roach", c: 0.4 }
      ]
    },
    moleRat: {
      name: "Maulwurfsratte",
      hp: 25,
      dmg: 5,
      xp: [15, 30],
      loot: 5,
      minLvl: 1,
      drops: [
        { id: "meat_mole", c: 0.5 },
        { id: "leather", c: 0.3 },
        // Leder für das nächste Upgrade
        { id: "junk_metal", c: 0.4 },
        { id: "screws", c: 0.2 }
        // NEU: Schrauben (20% Chance)
      ]
    },
    // Lvl 2+
    wildDog: {
      name: "Wilder Hund",
      hp: 35,
      dmg: 8,
      xp: [25, 40],
      loot: 0,
      minLvl: 2,
      drops: [
        { id: "meat_dog", c: 0.6 },
        { id: "leather", c: 0.5 },
        { id: "bone", c: 0.4 }
        // Knochen (falls wir das Item haben/hinzufügen)
      ]
    },
    // Humanoid - Droppt Waffen zum Zerlegen (Hauptquelle für Schrauben im Mid-Game)
    raider: {
      name: "Raider",
      hp: 60,
      dmg: 12,
      xp: [50, 80],
      loot: 15,
      minLvl: 2,
      drops: [
        { id: "ammo", c: 0.6 },
        { id: "stimpack", c: 0.2 },
        { id: "knife", c: 0.2 },
        { id: "pipe_pistol", c: 0.3 },
        // Waffe -> Zerlegen -> Schrauben
        { id: "junk_metal", c: 0.5 },
        { id: "cloth", c: 0.3 }
      ]
    },
    // Mid/High Level
    bloatfly: {
      name: "Blähfliege",
      hp: 20,
      dmg: 15,
      xp: [20, 35],
      loot: 0,
      minLvl: 2,
      drops: [{ id: "meat_fly", c: 0.6 }, { id: "acid", c: 0.3 }]
    },
    ghoul: {
      name: "Wilder Ghul",
      hp: 80,
      dmg: 18,
      xp: [60, 90],
      loot: 5,
      minLvl: 3,
      drops: [{ id: "radaway", c: 0.15 }, { id: "junk_metal", c: 0.4 }, { id: "cloth", c: 0.5 }]
    },
    radScorpion: {
      name: "Rad-Skorpion",
      hp: 120,
      dmg: 25,
      xp: [100, 150],
      loot: 0,
      minLvl: 4,
      drops: [{ id: "meat_scorp", c: 0.8 }, { id: "poison_gland", c: 0.5 }]
    },
    superMutant: {
      name: "Supermutant",
      hp: 200,
      dmg: 30,
      xp: [150, 250],
      loot: 30,
      minLvl: 5,
      drops: [{ id: "pipe_rifle", c: 0.4 }, { id: "ammo", c: 0.8 }, { id: "gunpowder", c: 0.5 }, { id: "caps", c: 1 }]
    },
    deathclaw: {
      name: "Todeskralle",
      hp: 500,
      dmg: 80,
      xp: [500, 800],
      loot: 50,
      minLvl: 10,
      drops: [{ id: "deathclaw_hand", c: 1 }, { id: "leather", c: 1 }, { id: "titanium", c: 0.5 }]
    }
  };
  if (typeof Game !== "undefined") Game.monsters = window.GameData.monsters;

  // src/data/data_minigames.js
  window.MiniGames = {
    active: null,
    // --- HACKING ---
    hacking: {
      words: [],
      password: "",
      attempts: 4,
      logs: [],
      onSuccess: null,
      onFail: null,
      // Wie bei defusal: der Aufrufer (Terminal-Truhe) muss das Ergebnis
      // erfahren. Ohne Rückruf blieb die Truhe zu und inDialog gesperrt.
      init: function(onSuccess, onFail) {
        this.onSuccess = typeof onSuccess === "function" ? onSuccess : null;
        this.onFail = typeof onFail === "function" ? onFail : null;
        const int = Game.getStat("INT") || 1;
        const diff = 12 - Math.min(8, int);
        const wordList = ["PASS", "FAIL", "DATA", "CODE", "HACK", "BIOS", "BOOT", "USER", "ROOT", "WIFI", "LINK", "NODE", "CORE", "DISK", "FILE", "SAVE", "LOAD", "EXIT"];
        this.words = [];
        while (this.words.length < diff) {
          const w = wordList[Math.floor(Math.random() * wordList.length)];
          if (!this.words.includes(w)) {
            this.words.push(w);
          }
        }
        this.password = this.words[Math.floor(Math.random() * this.words.length)];
        this.attempts = 4;
        this.logs = ["> SYSTEM LOCKED", "> ENTER PASSWORD"];
        if (typeof UI.renderHacking === "function") UI.renderHacking();
      },
      checkWord: function(word) {
        if (this.attempts <= 0) return;
        let likeness = 0;
        for (let i = 0; i < 4; i++) {
          if (word[i] === this.password[i]) likeness++;
        }
        this.logs.unshift(`> ${word}: ${likeness}/4 MATCH`);
        this.attempts--;
        if (word === this.password) {
          this.logs.unshift("> ACCESS GRANTED");
          setTimeout(() => this.end(true), 1e3);
        } else if (this.attempts <= 0) {
          this.logs.unshift("> SYSTEM LOCKOUT");
          setTimeout(() => this.end(false), 1e3);
        }
        if (typeof UI.renderHacking === "function") UI.renderHacking();
      },
      end: function(success) {
        if (success) {
          if (typeof Game.updateQuestProgress === "function") Game.updateQuestProgress("hack", "terminal", 1);
          UI.log("Terminal gehackt!", "text-green-400");
        } else {
          UI.log("Zugriff verweigert.", "text-red-500");
        }
        const rueckruf = success ? this.onSuccess : this.onFail;
        this.onSuccess = null;
        this.onFail = null;
        if (rueckruf) setTimeout(rueckruf, 800);
        else UI.stopMinigame();
      }
    },
    // --- LOCKPICKING ---
    lockpicking: {
      difficulty: "easy",
      lockAngle: 0,
      currentAngle: 0,
      sweetSpot: 0,
      health: 100,
      init: function(diff = "easy") {
        this.difficulty = diff;
        this.lockAngle = 0;
        this.currentAngle = 0;
        this.health = 100;
        this.sweetSpot = Math.floor(Math.random() * 160) - 80;
        if (typeof UI.renderLockpicking === "function") UI.renderLockpicking(true);
      },
      rotateLock: function() {
        const dist = Math.abs(this.currentAngle - this.sweetSpot);
        const maxRot = Math.max(0, 90 - dist);
        this.lockAngle = maxRot;
        if (dist < 10) {
          this.lockAngle = 90;
          setTimeout(() => this.end(true), 500);
        } else {
          this.health -= 10;
          if (this.health <= 0) {
            Game.removeFromInventory("bobby_pin", 1);
            this.end(false);
          }
        }
        if (typeof UI.renderLockpicking === "function") UI.renderLockpicking();
      },
      releaseLock: function() {
        this.lockAngle = 0;
        if (typeof UI.renderLockpicking === "function") UI.renderLockpicking();
      },
      end: function(success) {
        if (success) UI.log("Schloss geknackt!", "text-green-400");
        else UI.log("Dietrich abgebrochen!", "text-red-500");
        UI.stopMinigame();
      }
    },
    // --- DICE GAME (3 Dice) ---
    dice: {
      d1: 1,
      d2: 1,
      d3: 1,
      rolling: false,
      init: function() {
        this.d1 = 1;
        this.d2 = 1;
        this.d3 = 1;
        this.rolling = false;
        this.render();
      },
      roll: function() {
        if (this.rolling) return;
        this.rolling = true;
        let rolls = 0;
        const rollInterval = setInterval(() => {
          this.d1 = Math.floor(Math.random() * 6) + 1;
          this.d2 = Math.floor(Math.random() * 6) + 1;
          this.d3 = Math.floor(Math.random() * 6) + 1;
          this.render();
          rolls++;
          if (rolls >= 10) {
            clearInterval(rollInterval);
            this.rolling = false;
            this.finish();
          }
        }, 100);
      },
      finish: function() {
        const sum = this.d1 + this.d2 + this.d3;
        const luck = Game.getStat("LUC") || 1;
        const bonus = Math.floor(luck / 2);
        const total = sum + bonus;
        this.render(total);
        if (typeof Game.gambleLegendaryLoot === "function") {
          Game.gambleLegendaryLoot(total);
        } else {
          UI.log(`Ergebnis: ${total}`, "text-yellow-400");
          Game.state.caps += total * 10;
          Game.saveGame();
        }
        setTimeout(() => UI.stopMinigame(), 2500);
      },
      render: function(finalResult = null) {
        if (typeof UI.renderDice === "function") UI.renderDice(this, finalResult);
      }
    },
    // --- BOMB DEFUSAL (TIMING) ---
    defusal: {
      round: 1,
      maxRounds: 3,
      cursor: 50,
      direction: 1,
      speed: 1.5,
      zoneStart: 40,
      zoneWidth: 20,
      gameLoop: null,
      isRunning: false,
      onSuccess: null,
      onFail: null,
      // Die Truhe ruft das Minispiel mit ihren Rückrufen auf. Vorher nahm
      // init() keine Argumente - der Aufrufer erfuhr deshalb nie, wie es
      // ausging, und die Truhe blieb für immer zu (docs/BALANCE_BEFUNDE.md,
      // B2). `memory` macht es seit jeher so.
      init: function(onSuccess, onFail) {
        this.onSuccess = typeof onSuccess === "function" ? onSuccess : null;
        this.onFail = typeof onFail === "function" ? onFail : null;
        this.round = 1;
        this.maxRounds = 3;
        this.isRunning = true;
        this.setupRound();
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 20);
        if (typeof UI.renderDefusal === "function") UI.renderDefusal();
      },
      setupRound: function() {
        const agi = Game.getStat("AGI") || 1;
        const per = Game.getStat("PER") || 1;
        let baseSpeed = 1.5 + this.round * 0.5;
        this.speed = Math.max(0.5, baseSpeed - agi * 0.15);
        let baseWidth = 25 - this.round * 3;
        this.zoneWidth = Math.max(5, baseWidth + per * 2);
        const maxStart = 100 - this.zoneWidth;
        this.zoneStart = Math.floor(Math.random() * maxStart);
        this.cursor = Math.random() < 0.5 ? 0 : 100;
        this.direction = this.cursor === 0 ? 1 : -1;
      },
      update: function() {
        if (!this.isRunning) return;
        this.cursor += this.speed * this.direction;
        if (this.cursor >= 100) {
          this.cursor = 100;
          this.direction = -1;
        } else if (this.cursor <= 0) {
          this.cursor = 0;
          this.direction = 1;
        }
        if (typeof UI.renderDefusal === "function") UI.renderDefusal();
      },
      cutWire: function() {
        if (!this.isRunning) return;
        const hit = this.cursor >= this.zoneStart && this.cursor <= this.zoneStart + this.zoneWidth;
        if (hit) {
          if (this.round >= this.maxRounds) {
            this.end(true);
          } else {
            this.round++;
            this.setupRound();
          }
        } else {
          this.end(false);
        }
      },
      end: function(success) {
        this.isRunning = false;
        clearInterval(this.gameLoop);
        if (success) {
          UI.log("Bombe entschärft!", "text-green-400 font-bold");
          Game.gainExp(50);
        } else {
          UI.log("BOOM! Explosion!", "text-red-500 font-bold blink-red");
          if (typeof Game.addRadiation === "function") {
            Game.addRadiation(20);
          } else {
            Game.state.rads = (Game.state.rads || 0) + 20;
          }
          Game.state.hp = Math.max(0, Game.state.hp - 30);
          if (typeof UI.update === "function") UI.update();
        }
        const rueckruf = success ? this.onSuccess : this.onFail;
        this.onSuccess = null;
        this.onFail = null;
        if (rueckruf) setTimeout(rueckruf, 1500);
        else setTimeout(() => UI.stopMinigame(), 1500);
      }
    },
    // --- MEMORY OVERRIDE (CHEST UNLOCK) ---
    memory: {
      sequence: [],
      playerInput: [],
      showing: false,
      activeCell: null,
      onSuccess: null,
      init: function(callback) {
        this.onSuccess = callback;
        this.sequence = [];
        this.playerInput = [];
        this.showing = false;
        this.activeCell = null;
        const int = Game.getStat("INT") || 1;
        const len = Math.max(3, 7 - Math.floor(int / 3));
        for (let i = 0; i < len; i++) {
          this.sequence.push(Math.floor(Math.random() * 9));
        }
        setTimeout(() => this.playSequence(), 500);
        if (typeof UI.renderMemory === "function") UI.renderMemory();
      },
      playSequence: function() {
        this.showing = true;
        this.playerInput = [];
        let i = 0;
        const interval = setInterval(() => {
          this.activeCell = this.sequence[i];
          if (typeof UI.renderMemory === "function") UI.renderMemory();
          setTimeout(() => {
            this.activeCell = null;
            if (typeof UI.renderMemory === "function") UI.renderMemory();
          }, 400);
          i++;
          if (i >= this.sequence.length) {
            clearInterval(interval);
            setTimeout(() => {
              this.showing = false;
              if (typeof UI.renderMemory === "function") UI.renderMemory();
              UI.log("Code wiederholen...", "text-blue-400");
            }, 500);
          }
        }, 800);
      },
      input: function(idx) {
        if (this.showing) return;
        this.playerInput.push(idx);
        this.activeCell = idx;
        if (typeof UI.renderMemory === "function") UI.renderMemory();
        setTimeout(() => {
          this.activeCell = null;
          if (typeof UI.renderMemory === "function") UI.renderMemory();
        }, 150);
        const currentStep = this.playerInput.length - 1;
        if (this.playerInput[currentStep] !== this.sequence[currentStep]) {
          this.end(false);
          return;
        }
        if (this.playerInput.length === this.sequence.length) {
          setTimeout(() => this.end(true), 300);
        }
      },
      end: function(success) {
        if (success) {
          UI.log("Sicherheitssperre deaktiviert!", "text-green-400 font-bold");
          if (this.onSuccess) this.onSuccess();
        } else {
          UI.log("FEHLER! Alarm ausgelöst!", "text-red-500 font-bold");
          UI.shakeView();
          if (Game.state.hp) Game.state.hp = Math.max(1, Game.state.hp - 10);
          UI.update();
        }
        setTimeout(() => UI.stopMinigame(), 1500);
      }
    }
  };

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
      if (typeof firebase === "undefined") {
        this.active = false;
        if (typeof window !== "undefined" && typeof window.pruefeNetzwerk === "function") {
          window.pruefeNetzwerk();
        }
        return;
      }
      if (!this.db) {
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
      this.init();
      if (!this.active) throw new Error("Netzwerk nicht aktiv (Init Failed)");
      const isFree = await this.checkNameAvailability(name);
      if (!isFree) throw new Error("Dieser Name ist bereits vergeben (Charakter lebt noch).");
      try {
        const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await user.updateProfile({ displayName: name });
        this.myId = user.uid;
        this.myDisplayName = name;
        return {};
      } catch (e) {
        throw new Error(this.fehlerText(e));
      }
    },
    // Firebase-Fehlercodes in verständliche Sätze. Bewusst hier gebündelt:
    // der Login zeigt nur noch `error.message`, und die stammte vorher
    // ungefiltert aus dem fremden Skript.
    fehlerText: function(e) {
      const code = e && e.code || "";
      const tabelle = {
        "auth/network-request-failed": "Kein Netz. Bitte Verbindung prüfen.",
        "auth/invalid-email": "Die E-Mail-Adresse ist ungültig.",
        "auth/user-not-found": "Kein Account mit dieser E-Mail.",
        "auth/wrong-password": "Passwort falsch.",
        "auth/invalid-credential": "E-Mail oder Passwort falsch.",
        "auth/too-many-requests": "Zu viele Versuche. Bitte kurz warten.",
        "auth/email-already-in-use": "Diese E-Mail ist schon registriert.",
        "auth/weak-password": "Das Passwort ist zu kurz (min. 6 Zeichen).",
        "auth/operation-not-allowed": "Anmeldung ist für dieses Projekt gesperrt."
      };
      if (tabelle[code]) return tabelle[code];
      const roh = e && e.message || String(e);
      return `Anmeldung fehlgeschlagen (${code || "unbekannt"}).`;
    },
    login: async function(email, password) {
      this.init();
      if (!this.active) {
        throw new Error("Verbindung zu Vault-Tec unterbrochen. Spiel ohne Anmeldung möglich.");
      }
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
        throw new Error(this.fehlerText(e));
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

  // src/ui/ui_core.js
  var UI2 = {
    els: {},
    lastInputTime: Date.now(),
    biomeColors: typeof window.GameData !== "undefined" ? window.GameData.colors : {},
    // States
    loginBusy: false,
    isRegistering: false,
    charSelectMode: false,
    deleteMode: false,
    currentSaves: {},
    selectedSlot: -1,
    isSystemReady: false,
    // Focus System
    focusIndex: -1,
    focusableEls: [],
    inputMethod: "touch",
    // Queue System für Toasts (Max 1)
    toastQueue: [],
    isToastShowing: false,
    // --- NEW LOG SYSTEM (QUEUE BASED) ---
    log: function(message, colorClass = "text-green-500") {
      this.toastQueue.push({ message, colorClass });
      this.processToastQueue();
    },
    processToastQueue: function() {
      if (this.isToastShowing || this.toastQueue.length === 0) return;
      const container = this.els.toastContainer || document.getElementById("game-toast-container");
      if (!container) return;
      this.isToastShowing = true;
      const item = this.toastQueue.shift();
      let borderColor = "border-green-500";
      let icon = "ℹ️";
      if (item.colorClass.includes("red")) {
        borderColor = "border-red-600";
        icon = "⚠️";
      } else if (item.colorClass.includes("yellow") || item.colorClass.includes("orange")) {
        borderColor = "border-yellow-500";
        icon = "⚡";
      } else if (item.colorClass.includes("blue") || item.colorClass.includes("cyan")) {
        borderColor = "border-blue-500";
        icon = "💾";
      } else if (item.colorClass.includes("gray")) {
        borderColor = "border-gray-500";
        icon = "📝";
      }
      const el = document.createElement("div");
      el.className = `
            pointer-events-auto bg-black/95 border-l-4 ${borderColor} p-3 
            shadow-[0_0_15px_rgba(0,0,0,0.8)] animate-slide-in 
            flex items-start justify-between gap-4 transition-all duration-300 ease-out 
            mb-1 backdrop-blur-sm w-fit max-w-[90vw] md:max-w-md self-end rounded-l
        `;
      el.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-lg opacity-80 select-none">${icon}</span>
                <span class="font-mono text-sm md:text-base font-bold ${item.colorClass} tracking-wide drop-shadow-md whitespace-nowrap md:whitespace-normal">${item.message}</span>
            </div>
            <button class="text-gray-600 hover:text-white font-bold text-xs self-start mt-0.5 px-1 ml-2">✕</button>
        `;
      const closeToast = () => {
        if (el.classList.contains("closing")) return;
        el.classList.add("closing");
        el.classList.add("opacity-0", "translate-x-full");
        setTimeout(() => {
          if (el.parentNode) el.remove();
          this.isToastShowing = false;
          setTimeout(() => this.processToastQueue(), 150);
        }, 300);
      };
      el.querySelector("button").onclick = closeToast;
      container.innerHTML = "";
      container.appendChild(el);
      const duration = item.colorClass.includes("red") ? 4e3 : 2500;
      setTimeout(() => {
        if (document.body.contains(el)) closeToast();
      }, duration);
    },
    error: function(msg) {
      console.error(`ERROR: ${msg}`);
      this.log(`ERROR: ${msg}`, "text-red-500 blink-red");
      this.openBugModal(msg);
    },
    showLoadingSequence: function() {
      return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center font-vt323 text-green-500 cursor-wait select-none";
        overlay.innerHTML = `
                <div class="w-72 max-w-[90%] relative">
                    <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-20"></div>
                    <div class="text-center text-3xl mb-6 font-bold text-green-400 tracking-widest animate-pulse">PLEASE STAND BY</div>
                    <div class="h-6 border-2 border-green-700 p-1 rounded relative bg-[#001100] shadow-[0_0_15px_#003300]">
                        <div id="load-bar-fill" class="h-full bg-green-500 w-0 shadow-[0_0_10px_#0f0] transition-all duration-300 ease-out"></div>
                    </div>
                    <div class="flex justify-between items-end mt-2 px-1">
                        <div id="load-text" class="text-xs text-green-600 font-mono animate-pulse">INITIALIZING...</div>
                        <div id="load-percent" class="text-xl font-bold text-green-400">0%</div>
                    </div>
                    <div class="mt-8 flex justify-center opacity-50"><span class="animate-spin text-4xl">⚙️</span></div>
                </div>
            `;
        document.body.appendChild(overlay);
        const steps = [
          { t: "LOADING ASSETS...", p: 15 },
          { t: "DECRYPTING SAVE DATA...", p: 30 },
          { t: "SYNCHRONIZING PIP-BOY...", p: 55 },
          { t: "ESTABLISHING UPLINK...", p: 75 },
          { t: "RENDERING WASTELAND...", p: 90 },
          { t: "SYSTEM READY.", p: 100 }
        ];
        let step = 0;
        const bar = overlay.querySelector("#load-bar-fill");
        const txt = overlay.querySelector("#load-text");
        const pct = overlay.querySelector("#load-percent");
        const interval = setInterval(() => {
          if (step >= steps.length) {
            clearInterval(interval);
            setTimeout(() => {
              overlay.classList.add("opacity-0", "duration-500");
              setTimeout(() => {
                overlay.remove();
                resolve();
              }, 500);
            }, 400);
            return;
          }
          const s = steps[step];
          bar.style.width = s.p + "%";
          txt.textContent = s.t;
          pct.textContent = s.p + "%";
          step++;
        }, 250);
      });
    },
    showCombatEffect: function(mainText, subText, color = "red", duration = 1e3) {
      const view = document.getElementById("view-container");
      if (!view) return;
      const el = document.createElement("div");
      el.className = "click-effect-overlay";
      el.style.animation = `clickEffectAnim ${duration / 1e3}s ease-out forwards`;
      el.innerHTML = `<div class="click-effect-text" style="color:${color}; text-shadow: 0 0 20px ${color}">${mainText}</div><div class="click-effect-sub" style="border-color:${color}">${subText}</div>`;
      view.appendChild(el);
      setTimeout(() => {
        if (el) el.remove();
      }, duration);
    },
    triggerInventoryAlert: function() {
      if (this.els.btnInv) this.els.btnInv.classList.add("alert-glow-yellow");
      if (this.els.btnMenu) this.els.btnMenu.classList.add("alert-glow-yellow");
    },
    resetInventoryAlert: function() {
      if (this.els.btnInv) this.els.btnInv.classList.remove("alert-glow-yellow");
      if (this.els.btnMenu) this.els.btnMenu.classList.remove("alert-glow-yellow");
    },
    openBugModal: function(autoErrorMsg = null) {
      if (document.getElementById("bug-report-overlay")) return;
      if (this.els.navMenu) this.els.navMenu.classList.add("hidden");
      const title = autoErrorMsg ? "⚠️ SYSTEMFEHLER ERKANNT" : "🐞 BUG MELDEN";
      const subText = autoErrorMsg ? `CODE: "${autoErrorMsg}"` : "Fehler gefunden? Beschreibe ihn kurz:";
      const overlay = document.createElement("div");
      overlay.id = "bug-report-overlay";
      overlay.className = "fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4";
      overlay.innerHTML = `
            <div class="bg-[#051105] border-2 border-red-600 p-6 rounded shadow-[0_0_30px_red] max-w-md w-full relative">
                <h2 class="text-2xl text-red-500 font-bold mb-2 font-vt323 tracking-widest">${title}</h2>
                <div class="text-red-300 text-sm font-mono mb-4 border-b border-red-900 pb-2">${subText}</div>
                <label class="block text-green-500 text-sm mb-1 uppercase tracking-wider">Beschreibung</label>
                <textarea id="bug-desc" class="w-full bg-black border border-green-700 text-green-400 p-2 font-mono text-sm h-24 focus:border-green-400 outline-none mb-4" placeholder="Was ist passiert?"></textarea>
                <div class="flex gap-2">
                    <button id="btn-bug-send" class="flex-1 bg-red-900/30 border border-red-500 text-red-400 py-2 font-bold hover:bg-red-500 hover:text-black transition-all uppercase">REPORT SENDEN</button>
                    <button id="btn-bug-close" class="px-4 border border-gray-600 text-gray-500 hover:text-white transition-all uppercase">ABBRECHEN</button>
                </div>
            </div>
        `;
      document.body.appendChild(overlay);
      const textArea = document.getElementById("bug-desc");
      if (textArea) {
        textArea.focus();
        const stopPropagation = (e) => e.stopPropagation();
        textArea.addEventListener("keydown", stopPropagation);
        textArea.addEventListener("keyup", stopPropagation);
        textArea.addEventListener("keypress", stopPropagation);
      }
      document.getElementById("btn-bug-close").onclick = () => overlay.remove();
      document.getElementById("btn-bug-send").onclick = () => {
        const desc = document.getElementById("bug-desc").value;
        const errorType = autoErrorMsg || "Manuelle Meldung";
        this.saveBugReport(errorType, desc);
        overlay.remove();
      };
    },
    saveBugReport: async function(errorMsg, userDesc) {
      const playerName = Game.state && Game.state.playerName ? Game.state.playerName : "Unbekannt/Login";
      const report = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        playerName,
        error: errorMsg,
        description: userDesc || "Keine Beschreibung",
        gameState: { view: Game.state ? Game.state.view : "null", sector: Game.state ? `${Game.state.sector.x},${Game.state.sector.y}` : "null", caps: Game.state ? Game.state.caps : 0, lvl: Game.state ? Game.state.lvl : 0 },
        userAgent: navigator.userAgent
      };
      this.log("Sende Fehlerbericht an Vault-Tec...", "text-yellow-400 blink-red");
      let sent = false;
      if (typeof Network !== "undefined" && Network.sendBugReport) sent = await Network.sendBugReport(report);
      if (sent) this.log("✅ Bericht erfolgreich übertragen.", "text-green-400 font-bold");
      else {
        this.log("❌ Bug report aktuell nicht möglich.", "text-red-500 font-bold");
        console.warn("Bug Report Senden fehlgeschlagen.");
      }
    },
    showMobileControlsHint: function() {
      if (document.getElementById("controls-overlay")) return;
      const overlay = document.createElement("div");
      overlay.id = "controls-overlay";
      overlay.className = "fixed inset-0 z-[9000] bg-black/95 flex flex-col items-center justify-center p-6 text-center";
      overlay.innerHTML = `
            <div class="border-2 border-green-500 p-6 max-w-sm w-full shadow-[0_0_20px_#1aff1a] bg-[#001100]">
                <div class="text-4xl mb-4">📱</div>
                <h2 class="text-2xl text-green-400 font-bold mb-4 font-vt323 tracking-widest border-b border-green-800 pb-2">STEUERUNG</h2>
                <div class="text-green-300 font-mono text-sm space-y-4 text-left mb-6">
                    <div class="flex items-start gap-3"><span class="text-xl">👆</span><div><strong class="text-green-100">TIPPEN:</strong><br>Bewegen / Interagieren / Angreifen</div></div>
                    <div class="flex items-start gap-3"><span class="text-xl">📄</span><div><strong class="text-green-100">MENÜ:</strong><br>Burger-Icon (☰) oben rechts für Inventar & Charakter.</div></div>
                </div>
                <div class="border-t border-green-800 pt-4 mt-4">
                    <h3 class="text-red-500 font-bold mb-2 animate-pulse">⚠️ WARNUNG: PERMADEATH</h3>
                    <p class="text-red-400 text-xs font-mono leading-relaxed">In diesem Modus ist der Tod endgültig.<br>Stirbt dein Charakter, wird der Spielstand <span class="underline">automatisch gelöscht</span>.</p>
                </div>
                <button id="btn-close-controls" class="mt-6 w-full border-2 border-green-500 text-green-500 py-3 font-bold hover:bg-green-900 transition-colors uppercase tracking-widest">VERSTANDEN</button>
            </div>
        `;
      document.body.appendChild(overlay);
      document.getElementById("btn-close-controls").onclick = () => overlay.remove();
    },
    setConnectionState: function(status) {
      const v = this.els.version;
      if (!v) return;
      if (status === "online") {
        v.className = "text-[#39ff14] font-bold tracking-widest";
        v.style.textShadow = "0 0 5px #39ff14";
      } else if (status === "offline") {
        v.className = "text-red-500 font-bold tracking-widest";
        v.style.textShadow = "0 0 5px red";
      } else {
        v.className = "text-yellow-400 font-bold tracking-widest animate-pulse";
      }
    },
    update: function() {
      const loginScreen = this.els.loginScreen;
      const isLoginHidden = loginScreen && (loginScreen.style.display === "none" || loginScreen.classList.contains("hidden"));
      const isAuth = typeof Network !== "undefined" && Network.myId;
      if (isLoginHidden && isAuth) {
        if (Date.now() - this.lastInputTime > 3e5) {
          console.log("AFK Trigger: Logout initiiert.");
          this.logout("AFK: ZEITÜBERSCHREITUNG");
        }
      }
    },
    init: function() {
      const toastCont = document.getElementById("game-toast-container");
      if (toastCont) {
        toastCont.classList.remove("w-72", "md:w-96");
        toastCont.classList.add("w-auto", "items-end", "max-w-full", "md:max-w-[400px]");
      }
      this.els = {
        touchArea: document.getElementById("main-content"),
        view: document.getElementById("view-container"),
        toastContainer: toastCont,
        hp: document.getElementById("val-hp"),
        hpBar: document.getElementById("bar-hp"),
        expBarTop: document.getElementById("bar-exp-top"),
        lvl: document.getElementById("val-lvl"),
        xpTxt: document.getElementById("val-xp-txt"),
        caps: document.getElementById("val-caps"),
        name: document.getElementById("val-name"),
        headerCharInfo: document.getElementById("header-char-info"),
        version: document.getElementById("version-display"),
        joyBase: null,
        joyStick: null,
        dialog: document.getElementById("dialog-overlay"),
        btnNew: document.getElementById("btn-new"),
        btnInv: document.getElementById("btn-inv"),
        btnWiki: document.getElementById("btn-wiki"),
        btnMap: document.getElementById("btn-map"),
        btnChar: document.getElementById("btn-char"),
        btnQuests: document.getElementById("btn-quests"),
        btnBugReport: document.getElementById("btn-bug-report"),
        btnMenuSave: document.getElementById("btn-menu-save"),
        btnLogout: document.getElementById("btn-logout"),
        btnReset: document.getElementById("btn-reset"),
        btnMenu: document.getElementById("btn-menu-toggle"),
        navMenu: document.getElementById("main-nav"),
        playerCount: document.getElementById("val-players"),
        playerList: document.getElementById("player-list-overlay"),
        playerListContent: document.getElementById("player-list-content"),
        loginScreen: document.getElementById("login-screen"),
        loginStatus: document.getElementById("login-status"),
        inputEmail: document.getElementById("login-email"),
        inputPass: document.getElementById("login-pass"),
        inputName: document.getElementById("login-name"),
        // Ist null, da entfernt
        btnLogin: document.getElementById("btn-login"),
        btnToggleRegister: document.getElementById("btn-toggle-register"),
        loginTitle: document.getElementById("login-title"),
        charSelectScreen: document.getElementById("char-select-screen"),
        charSlotsList: document.getElementById("char-slots-list"),
        newCharOverlay: document.getElementById("new-char-overlay"),
        inputNewCharName: document.getElementById("new-char-name"),
        btnCreateCharConfirm: document.getElementById("btn-create-char"),
        btnCharDeleteAction: document.getElementById("btn-char-delete-action"),
        btnCharBack: document.getElementById("btn-char-back"),
        deleteOverlay: document.getElementById("delete-confirm-overlay"),
        deleteTargetName: document.getElementById("delete-target-name"),
        deleteInput: document.getElementById("delete-input"),
        btnDeleteConfirm: document.getElementById("btn-delete-confirm"),
        btnDeleteCancel: document.getElementById("btn-delete-cancel"),
        spawnScreen: document.getElementById("spawn-screen"),
        spawnMsg: document.getElementById("spawn-msg"),
        spawnList: document.getElementById("spawn-list"),
        btnSpawnRandom: document.getElementById("btn-spawn-random"),
        resetOverlay: document.getElementById("reset-overlay"),
        btnConfirmReset: document.getElementById("btn-confirm-reset"),
        btnCancelReset: document.getElementById("btn-cancel-reset"),
        gameScreen: document.getElementById("game-screen"),
        gameOver: document.getElementById("game-over-screen")
      };
      if (this.els.btnBugReport) this.els.btnBugReport.addEventListener("click", () => {
        this.openBugModal();
      });
      if (this.els.btnInv) this.els.btnInv.addEventListener("click", () => this.resetInventoryAlert());
      if (this.els.headerCharInfo) this.els.headerCharInfo.addEventListener("click", () => {
        this.switchView("char");
      });
      if (this.els.btnToggleRegister) {
        this.els.btnToggleRegister.onclick = () => {
          this.isRegistering = !this.isRegistering;
          this.els.loginTitle.textContent = this.isRegistering ? "NEUEN ACCOUNT REGISTRIEREN" : "AUTHENTICATION REQUIRED";
          this.els.btnLogin.textContent = this.isRegistering ? "REGISTRIEREN" : "LOGIN";
          this.els.btnToggleRegister.textContent = this.isRegistering ? "Zurück zum Login" : "Noch kein Account? Hier registrieren";
        };
      }
      window.Game = Game;
      window.UI = this;
      if (this.initInput) this.initInput();
      setInterval(() => {
        if (this.update) this.update();
      }, 1e3);
    },
    isMobile: function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
    },
    startGame: async function(saveData, slotIndex, newName = null) {
      this.charSelectMode = false;
      this.els.charSelectScreen.style.display = "none";
      await this.showLoadingSequence();
      this.els.gameScreen.classList.remove("hidden");
      this.els.gameScreen.classList.remove("opacity-0");
      const isNewGame = !saveData;
      Game.init(saveData, null, slotIndex, newName);
      if (this.isMobile() && isNewGame) this.showMobileControlsHint();
      if (typeof Network !== "undefined") Network.startPresence();
    },
    logout: async function(msg) {
      this.loginBusy = false;
      this.selectedSlot = -1;
      this.charSelectMode = false;
      if (Game.state) {
        Game.saveGame(true);
        Game.state = null;
      }
      if (typeof Network !== "undefined") {
        await Network.disconnect();
      }
      this.els.gameScreen.classList.add("hidden");
      if (this.els.charSelectScreen) this.els.charSelectScreen.style.display = "none";
      if (this.els.newCharOverlay) this.els.newCharOverlay.classList.add("hidden");
      if (this.els.deleteOverlay) this.els.deleteOverlay.style.display = "none";
      if (this.els.spawnScreen) this.els.spawnScreen.style.display = "none";
      this.els.loginScreen.style.display = "flex";
      this.els.loginScreen.classList.remove("hidden");
      this.els.loginStatus.textContent = msg || "AUSGELOGGT";
      this.els.loginStatus.className = "mt-4 text-yellow-400";
      this.els.inputPass.value = "";
      if (this.els.navMenu) {
        this.els.navMenu.classList.add("hidden");
        this.els.navMenu.style.display = "none";
      }
      if (this.els.playerList) this.els.playerList.style.display = "none";
    },
    // Startet das Spiel ohne Firebase.
    //
    // Es gibt genau einen Spielstand im localStorage (`pipboy_save`), und
    // Game.init/saveGame kommen ohne Netz aus. Der Offline-Weg ist damit
    // schon vorhanden - er war nur nicht erreichbar, wenn die drei
    // Firebase-Skripte vom CDN nicht kamen. Dann blieb der Login stehen,
    // weil Network.init() `active` auf false setzt und jeder
    // Anmeldeversuch mit "Verbindung unterbrochen" endet.
    startOffline: async function() {
      this.isSystemReady = true;
      let save = null;
      try {
        const roh = localStorage.getItem("pipboy_save");
        if (roh) save = JSON.parse(roh);
      } catch (e) {
        save = null;
      }
      this.selectedSlot = 0;
      this.loginBusy = false;
      try {
        await this.startGame(save, 0, save ? null : "SURVIVOR");
      } catch (e) {
        console.error("Offline-Start fehlgeschlagen:", e);
        this.isSystemReady = true;
        if (this.els.gameScreen) this.els.gameScreen.classList.add("hidden");
        if (this.els.loginScreen) this.els.loginScreen.style.display = "flex";
        showCrashReport("OFFLINE_START_FAILED", {
          msg: e && e.message || String(e),
          stack: e && e.stack || "N/A"
        });
      }
    },
    attemptLogin: async function() {
      if (!this.isSystemReady) {
        this.els.loginStatus.textContent = "SYSTEM INITIALIZING... PLEASE WAIT";
        this.els.loginStatus.className = "mt-4 text-blue-400 animate-pulse";
        return;
      }
      if (this.loginBusy) return;
      this.loginBusy = true;
      const email = this.els.inputEmail.value.trim();
      const pass = this.els.inputPass.value.trim();
      this.els.loginStatus.textContent = "VERBINDE MIT VAULT-TEC...";
      this.els.loginStatus.className = "mt-4 text-yellow-400 animate-pulse";
      try {
        if (typeof Network === "undefined") throw new Error("Netzwerkfehler");
        Network.init();
        let saves = null;
        if (this.isRegistering) {
          if (email.length < 5 || pass.length < 6) throw new Error("Daten unvollständig (PW min 6)");
          const generatedName = email.split("@")[0].toUpperCase();
          saves = await Network.register(email, pass, generatedName);
        } else {
          if (email.length < 5 || pass.length < 1) throw new Error("Bitte E-Mail und Passwort eingeben");
          saves = await Network.login(email, pass);
        }
        this.selectedSlot = -1;
        if (this.renderCharacterSelection) this.renderCharacterSelection(saves || {});
      } catch (e) {
        let msg = e.message;
        if (msg && (msg.includes("INVALID_LOGIN_CREDENTIALS") || msg.includes("INVALID_EMAIL"))) msg = "E-Mail oder Passwort falsch!";
        else if (e.code === "auth/email-already-in-use") msg = "E-Mail wird bereits verwendet!";
        else if (e.code === "auth/invalid-email") msg = "Ungültige E-Mail-Adresse!";
        else if (e.code === "auth/wrong-password") msg = "Falsches Passwort!";
        else if (e.code === "auth/user-not-found") msg = "Benutzer nicht gefunden!";
        this.els.loginStatus.textContent = "FEHLER: " + msg;
        this.els.loginStatus.className = "mt-4 text-red-500 font-bold blink-red";
      } finally {
        this.loginBusy = false;
      }
    },
    handleSaveClick: function() {
      Game.saveGame(true);
      [this.els.btnSave, this.els.btnMenuSave].forEach((btn) => {
        if (!btn) return;
        const originalText = btn.textContent;
        const originalClass = btn.className;
        btn.textContent = "SAVED!";
        btn.className = "header-btn bg-[#39ff14] text-black border-[#39ff14] w-full text-left";
        setTimeout(() => {
          btn.textContent = originalText;
          btn.className = originalClass;
        }, 1e3);
      });
    },
    handleReset: function() {
      if (this.els.navMenu) {
        this.els.navMenu.classList.add("hidden");
        this.els.navMenu.style.display = "none";
      }
      if (this.els.resetOverlay) this.els.resetOverlay.style.display = "flex";
    },
    confirmReset: function() {
      if (typeof Game !== "undefined") Game.hardReset();
    },
    cancelReset: function() {
      if (this.els.resetOverlay) this.els.resetOverlay.style.display = "none";
    },
    selectSpawn: function(mode) {
      this.els.spawnScreen.style.display = "none";
      if (mode === "random") {
        this.startGame(null, this.selectedSlot, null);
      }
    },
    selectSlot: function(index) {
      if (this.selectedSlot === index) {
        this.triggerCharSlot();
        return;
      }
      this.selectedSlot = index;
      if (this.els.charSlotsList && this.els.charSlotsList.children) {
        const slots = this.els.charSlotsList.children;
        for (let i = 0; i < slots.length; i++) {
          slots[i].classList.remove("active-slot");
        }
        if (slots[index]) slots[index].classList.add("active-slot");
      }
      const save = this.currentSaves ? this.currentSaves[index] : null;
      if (this.els.btnCharDeleteAction) {
        if (save) {
          this.els.btnCharDeleteAction.disabled = false;
          this.els.btnCharDeleteAction.classList.remove("opacity-50", "cursor-not-allowed");
        } else {
          this.els.btnCharDeleteAction.disabled = true;
          this.els.btnCharDeleteAction.classList.add("opacity-50", "cursor-not-allowed");
        }
      }
    },
    navigateCharSlot: function(delta) {
      let newIndex = this.selectedSlot + delta;
      if (newIndex < 0) newIndex = 4;
      if (newIndex > 4) newIndex = 0;
      this.selectSlot(newIndex);
    },
    triggerCharSlot: function() {
      if (this.selectedSlot === -1) return;
      const save = this.currentSaves[this.selectedSlot];
      if (save) {
        this.startGame(save, this.selectedSlot);
      } else {
        this.els.newCharOverlay.classList.remove("hidden");
        this.els.inputNewCharName.value = "";
        this.els.inputNewCharName.focus();
      }
    },
    triggerDeleteSlot: function() {
      if (this.selectedSlot === -1) return;
      const save = this.currentSaves[this.selectedSlot];
      if (!save) return;
      this.deleteMode = true;
      this.els.deleteOverlay.style.display = "flex";
      this.els.deleteTargetName.textContent = save.playerName || "UNBEKANNT";
      this.els.deleteInput.value = "";
      this.els.btnDeleteConfirm.disabled = true;
      this.els.btnDeleteConfirm.classList.add("border-red-500", "text-red-500");
      this.els.btnDeleteConfirm.classList.remove("border-green-500", "text-green-500", "animate-pulse");
      this.els.deleteInput.focus();
    },
    closeDeleteOverlay: function() {
      this.deleteMode = false;
      this.els.deleteOverlay.style.display = "none";
      this.els.charSelectScreen.focus();
    },
    showGameOver: function() {
      if (this.els.gameOver) {
        this.els.gameOver.classList.remove("hidden");
      }
      Game.selectedSlot = -1;
      Game.state = null;
      console.log("GameOver: State vernichtet, Slot entkoppelt.");
    }
  };
  window.UI = UI2;
  console.log("UI Core Loaded.");

  // src/game/game_core.js
  window.Game = {
    // Globale Konstanten (Auf 50 erhöht für die neuen Flüsse)
    TILE: 30,
    MAP_W: 50,
    MAP_H: 50,
    WORLD_W: 10,
    WORLD_H: 10,
    // Daten-Container (Fallback falls Data-Files fehlen)
    colors: typeof window.GameData !== "undefined" ? window.GameData.colors : {},
    items: typeof window.GameData !== "undefined" ? window.GameData.items : {},
    monsters: typeof window.GameData !== "undefined" ? window.GameData.monsters : {},
    recipes: typeof window.GameData !== "undefined" ? window.GameData.recipes : [],
    perkDefs: typeof window.GameData !== "undefined" ? window.GameData.perks : [],
    questDefs: typeof window.GameData !== "undefined" ? window.GameData.questDefs : [],
    lootPrefixes: {
      "rusty": { name: "Rostige", dmgMult: 0.8, valMult: 0.5, color: "text-gray-500" },
      "hardened": { name: "Gehärtete", dmgMult: 1.2, valMult: 1.3, color: "text-gray-300" },
      "precise": { name: "Präzise", dmgMult: 1.1, valMult: 1.5, bonus: { PER: 1 }, color: "text-blue-300" },
      "radiated": { name: "Verstrahlte", dmgMult: 1, valMult: 1.2, effect: "rads", color: "text-green-300" },
      "legendary": { name: "Legendäre", dmgMult: 1.5, valMult: 3, bonus: { LUC: 2 }, color: "text-yellow-400 font-bold" }
    },
    state: null,
    worldData: {},
    ctx: null,
    loopId: null,
    camera: { x: 0, y: 0 },
    cacheCanvas: null,
    cacheCtx: null,
    saveTimer: null,
    isDirty: false,
    initCache: function() {
      this.cacheCanvas = document.createElement("canvas");
      this.cacheCanvas.width = this.MAP_W * this.TILE;
      this.cacheCanvas.height = this.MAP_H * this.TILE;
      this.cacheCtx = this.cacheCanvas.getContext("2d");
    },
    initCanvas: function() {
      const cvs = document.getElementById("game-canvas");
      if (!cvs) return;
      const viewContainer = document.getElementById("view-container");
      const dpr = window.devicePixelRatio || 1;
      const rect = viewContainer.getBoundingClientRect();
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      cvs.style.width = `${rect.width}px`;
      cvs.style.height = `${rect.height}px`;
      this.ctx = cvs.getContext("2d");
      this.ctx.scale(dpr, dpr);
      this.ctx.imageSmoothingEnabled = false;
      if (this.loopId) cancelAnimationFrame(this.loopId);
      this.drawLoop();
    },
    drawText: function(ctx, text, x, y, size, color, align = "center", shadow = false) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      const scale = 0.25;
      ctx.scale(scale, scale);
      ctx.font = "bold " + size / scale + "px monospace";
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      ctx.imageSmoothingEnabled = true;
      if (shadow) {
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4 / scale;
      }
      ctx.fillText(text, 0, 0);
      ctx.restore();
    },
    drawLoop: function() {
      if (this.state && this.state.view === "map" && !this.state.isGameOver) {
        this.draw();
        this.loopId = requestAnimationFrame(() => this.drawLoop());
      }
    },
    saveGame: function(force = false) {
      this.isDirty = true;
      if (force) {
        this.performSave();
        return;
      }
      if (this.saveTimer) return;
      this.saveTimer = setTimeout(() => {
        this.performSave();
      }, 2e3);
    },
    performSave: function() {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
      if (!this.isDirty || !this.state) return;
      if (this.state.isGameOver || this.state.saveSlot === -1) {
        return;
      }
      if (typeof Network !== "undefined") {
        Network.save(this.state);
        if (!this.state.isGameOver) Network.updateHighscore(this.state);
      }
      try {
        localStorage.setItem("pipboy_save", JSON.stringify(this.state));
      } catch (e) {
      }
      this.isDirty = false;
    },
    // Wird von Combat.playerAttack (Vampir-Waffen) aufgerufen. Fehlte bisher,
    // wodurch der Effekt still wirkungslos blieb (docs/ANALYSE.md, B8).
    getMaxHp: function() {
      return this.state && this.state.maxHp || 100;
    },
    // Wird beim Permadeath aufgerufen (ui_render_overlays.js). Fehlte bisher;
    // der dortige Ersatzweg löschte Schlüssel, die das Spiel nie geschrieben hat.
    deleteSave: function(slot) {
      const index = slot === void 0 || slot === null ? this.state ? this.state.saveSlot : 0 : slot;
      if (typeof Network !== "undefined" && typeof Network.deleteSlot === "function") {
        Network.deleteSlot(index).catch(() => {
        });
      }
      try {
        localStorage.removeItem("pipboy_save");
      } catch (e) {
      }
      this.isDirty = false;
      this.state = null;
    },
    hardReset: function() {
      if (typeof Network !== "undefined") Network.deleteSave();
      this.state = null;
      location.reload();
    },
    getPerkLevel: function(perkId) {
      if (!this.state || !this.state.perks) return 0;
      return this.state.perks[perkId] || 0;
    },
    recalcStats: function() {
      if (!this.state) return;
      let end = this.getStat("END");
      let baseHp = 50 + end * 10 + this.state.lvl * 5;
      const toughnessLvl = this.getPerkLevel("toughness");
      baseHp += toughnessLvl * 10;
      this.state.maxHp = baseHp;
      if (this.state.hp > this.state.maxHp) this.state.hp = this.state.maxHp;
      let luc = this.getStat("LUC");
      let strangerLvl = this.getPerkLevel("mysterious_stranger");
      this.state.critChance = luc * 1 + strangerLvl * 2;
      if (typeof UI !== "undefined" && UI.update) UI.update();
    },
    // Pfad zum Item-Bild oder null. Die Bilder liegen neben der Seite in
    // img/items/ - relativer Pfad, damit GitHub Pages (/PipBoy3000/) und
    // Vercel denselben Code benutzen koennen.
    itemBildPfad: function(id) {
      if (!id) return null;
      const liste = window.GameData && window.GameData.itemBilder || [];
      if (!liste.includes(id)) return null;
      return `img/items/${id}.png`;
    },
    getUsedSlots: function() {
      if (!this.state || !this.state.inventory) return 0;
      return this.state.inventory.length;
    },
    getStackLimit: function(itemId) {
      if (itemId === "caps") return 99999;
      if (this.items[itemId] && this.items[itemId].type === "ammo") return 100;
      const i = this.items[itemId];
      if (!i) return 1;
      if (i.type === "component" || i.type === "rare" || i.type === "consumable" || i.type === "junk") return 20;
      if (i.type === "ammo") return 100;
      return 1;
    },
    // Zaehlt alle Munitionsarten zusammen. Vorher nur 'ammo' - mit sechs
    // Sorten waere der HUD-Zaehler sonst still falsch (docs/BEFUNDE.md, 4).
    syncAmmo: function() {
      if (!this.state) return;
      const t = this.state.inventory.reduce((sum, i) => i && this.items[i.id] && this.items[i.id].type === "ammo" ? sum + i.count : sum, 0);
      this.state.ammo = t;
      if (typeof UI !== "undefined" && UI.update) UI.update();
    },
    // Summiert einen Bonus-Schlüssel aus der angelegten Ausrüstung.
    // getStat() taugt dafür nicht: es liefert für jeden Schlüssel, der nicht
    // in state.stats steht, eine Basis von 5 (die SPECIAL-Vorgabe). Für
    // RAD oder RAD_RESIST hieße das, jeder trüge schon Schutz.
    equipBonus: function(key) {
      if (!this.state || !this.state.equip) return 0;
      let summe = 0;
      ["weapon", "body", "head", "legs", "feet", "arms", "back"].forEach((slot) => {
        const teil = this.state.equip[slot];
        if (!teil) return;
        const katalog = teil.id && this.items[teil.id] ? this.items[teil.id] : null;
        const quelle = teil.bonus || !katalog ? teil : katalog;
        if (quelle.bonus && typeof quelle.bonus[key] === "number") summe += quelle.bonus[key];
        if (teil.props && teil.props.bonus && typeof teil.props.bonus[key] === "number") {
          summe += teil.props.bonus[key];
        }
      });
      return summe;
    },
    // Rüstungsschutz aus allen Teilen. Der Kampf rechnet damit gegen den
    // erlittenen Schaden (docs/BALANCE_BEFUNDE.md, B1).
    equipDef: function() {
      if (!this.state || !this.state.equip) return 0;
      let summe = 0;
      ["body", "head", "legs", "feet", "arms"].forEach((slot) => {
        const teil = this.state.equip[slot];
        if (!teil) return;
        if (typeof teil.def === "number") summe += teil.def;
        else if (teil.id && this.items[teil.id] && typeof this.items[teil.id].def === "number") {
          summe += this.items[teil.id].def;
        }
      });
      return summe;
    },
    getStat: function(key) {
      if (!this.state) return 5;
      let v = this.state.stats[key] || 5;
      ["weapon", "body", "head", "legs", "feet", "arms", "back"].forEach((s) => {
        const i = this.state.equip[s];
        if (!i) return;
        if (i.bonus && i.bonus[key]) v += i.bonus[key];
        if (i.props && i.props.bonus && i.props.bonus[key]) v += i.props.bonus[key];
      });
      if (typeof this.buffBonus === "function") v += this.buffBonus(key);
      return v;
    },
    expToNextLevel: function(l) {
      return Math.floor(100 * Math.pow(l, 1.5));
    },
    gainExp: function(amount) {
      const perkLvl = this.getPerkLevel("swift_learner");
      let finalAmount = amount;
      if (perkLvl > 0) {
        const multi = 1 + perkLvl * 0.05;
        finalAmount = Math.floor(amount * multi);
      }
      this.state.xp += finalAmount;
      if (perkLvl > 0 && finalAmount > amount) {
        UI.log(`+${finalAmount} XP (Bonus!)`, "text-yellow-400");
      } else {
        UI.log(`+${finalAmount} XP`, "text-yellow-400");
      }
      let next = this.expToNextLevel(this.state.lvl);
      if (this.state.xp >= next) {
        this.state.lvl++;
        this.state.xp -= next;
        this.state.statPoints++;
        if (this.state.lvl % 3 === 0) {
          this.state.perkPoints++;
          UI.log("🌟 NEUER PERK PUNKT VERFÜGBAR! 🌟", "text-yellow-400 font-bold animate-pulse text-lg");
        }
        this.recalcStats();
        this.state.hp = this.state.maxHp;
        UI.log(`LEVEL UP! Du bist jetzt Level ${this.state.lvl}`, "text-yellow-400 font-bold animate-pulse");
        this.checkNewQuests();
        this.saveGame(true);
      } else {
        this.saveGame();
      }
    },
    checkNewQuests: function() {
      if (!this.questDefs || !this.state) return;
      this.questDefs.forEach((def) => {
        const lvlMet = this.state.lvl >= def.minLvl;
        const preReqMet = !def.preReq || this.state.completedQuests.includes(def.preReq);
        if (lvlMet && preReqMet) {
          const active = this.state.activeQuests.find((q) => q.id === def.id);
          const completed = this.state.completedQuests.includes(def.id);
          if (!active && !completed) {
            const newQuest = { id: def.id, progress: 0, max: def.amount || 0, type: def.type, target: def.target || null };
            if (def.type === "collect_multi" && def.reqItems) {
              newQuest.max = Object.values(def.reqItems).reduce((a, b) => a + b, 0);
              let currentTotal = 0;
              for (let id in def.reqItems) {
                const inInv = this.state.inventory.filter((i) => i.id === id).reduce((s, i) => s + i.count, 0);
                currentTotal += Math.min(inInv, def.reqItems[id]);
              }
              newQuest.progress = currentTotal;
            }
            this.state.activeQuests.push(newQuest);
            UI.log(`QUEST: "${def.title}" erhalten!`, "text-cyan-400 font-bold animate-pulse");
            if (this.state.activeQuests.length === 1 && !this.state.trackedQuestId) {
              this.state.trackedQuestId = newQuest.id;
              if (typeof UI !== "undefined" && UI.updateQuestTracker) UI.updateQuestTracker();
            }
            if (newQuest.progress >= newQuest.max && newQuest.max > 0) {
              const idx = this.state.activeQuests.findIndex((q) => q.id === def.id);
              if (idx !== -1) this.completeQuest(idx);
            }
          }
        }
      });
    },
    updateQuestProgress: function(type, target, value = 1) {
      if (!this.state || !this.state.activeQuests) return;
      let updated = false;
      for (let i = this.state.activeQuests.length - 1; i >= 0; i--) {
        const q = this.state.activeQuests[i];
        const def = this.questDefs.find((d) => d.id === q.id);
        if (!def) continue;
        let match = false;
        if (q.type === type && q.target === target) match = true;
        if (q.type === "collect_multi" && type === "collect" && def.reqItems && def.reqItems[target]) {
          let currentTotal = 0;
          for (let itemId in def.reqItems) {
            const countInInv = this.state.inventory.filter((item) => item.id === itemId).reduce((sum, item) => sum + item.count, 0);
            currentTotal += Math.min(countInInv, def.reqItems[itemId]);
          }
          q.progress = currentTotal;
          updated = true;
        }
        if (match) {
          q.progress += value;
          updated = true;
        }
        if (q.progress >= q.max) this.completeQuest(i);
      }
      this.checkNewQuests();
      if (updated && typeof UI !== "undefined") {
        UI.update();
        if (UI.updateQuestTracker) UI.updateQuestTracker();
      }
    },
    completeQuest: function(index) {
      const q = this.state.activeQuests[index];
      const def = this.questDefs.find((d) => d.id === q.id);
      if (def) {
        if (def.reward) {
          if (def.reward.xp) this.gainExp(def.reward.xp);
          if (def.reward.caps) this.state.caps += def.reward.caps;
          if (def.reward.items) def.reward.items.forEach((item) => {
            if (typeof Game.addItem === "function") Game.addItem(item.id, item.c || 1);
          });
        }
        this.state.completedQuests.push(q.id);
        if (typeof UI !== "undefined" && UI.showQuestComplete) UI.showQuestComplete(def);
      }
      if (this.state.trackedQuestId === q.id) this.state.trackedQuestId = null;
      this.state.activeQuests.splice(index, 1);
      if (!this.state.trackedQuestId && this.state.activeQuests.length > 0) this.state.trackedQuestId = this.state.activeQuests[0].id;
      this.saveGame(true);
      this.checkNewQuests();
      if (typeof UI !== "undefined" && UI.updateQuestTracker) UI.updateQuestTracker();
    },
    checkShopRestock: function() {
      const now = Date.now();
      if (!this.state.shop) this.state.shop = { nextRestock: 0, stock: {}, merchantCaps: 1e3 };
      if (now >= this.state.shop.nextRestock) {
        const stock = {};
        stock["stimpack"] = 2 + Math.floor(Math.random() * 4);
        stock["radaway"] = 1 + Math.floor(Math.random() * 3);
        stock["nuka_cola"] = 3 + Math.floor(Math.random() * 5);
        this.state.shop.ammoStock = 30 + Math.floor(Math.random() * 9) * 10;
        this.state.shop.ammoStockByType = {
          ammo: 30 + Math.floor(Math.random() * 9) * 10,
          ammo_10mm: 20 + Math.floor(Math.random() * 8) * 10,
          ammo_308: 10 + Math.floor(Math.random() * 5) * 10,
          ammo_shell: 10 + Math.floor(Math.random() * 4) * 10,
          ammo_micro: 20 + Math.floor(Math.random() * 8) * 10,
          ammo_cell: 10 + Math.floor(Math.random() * 3) * 10
        };
        stock["camp_kit"] = 1;
        this.state.shop.merchantCaps = 500 + Math.floor(Math.random() * 1e3);
        this.state.shop.stock = stock;
        this.state.shop.nextRestock = now + 36e5;
        if (typeof UI !== "undefined") UI.log("Händler hat neue Ware.", "text-green-500");
      }
    },
    // Würfelt beim Fund einer Waffe ein Präfix aus. Die Prozente stehen als
    // Tabelle da und nicht als Kette von else-if, damit sie sich prüfen lassen.
    // Diese Funktion hatte bis eben keinen einzigen Aufrufer: Waffen fielen
    // immer ohne Präfix (docs/BEFUNDE.md, 9).
    lootChances: [
      { key: "legendary", bis: 0.02 },
      { key: "radiated", bis: 0.05 },
      { key: "hardened", bis: 0.15 },
      { key: "precise", bis: 0.3 },
      { key: "rusty", bis: 0.6 }
    ],
    rollLootPrefix: function() {
      const roll = Math.random();
      const treffer = this.lootChances.find((c) => roll < c.bis);
      return treffer ? treffer.key : null;
    },
    generateLoot: function(baseId) {
      const itemDef = this.items[baseId];
      if (!itemDef || itemDef.type !== "weapon") return { id: baseId, count: 1 };
      const prefixKey = this.rollLootPrefix();
      if (!prefixKey) return { id: baseId, count: 1 };
      const p = this.lootPrefixes[prefixKey];
      return {
        id: baseId,
        count: 1,
        props: {
          prefix: prefixKey,
          name: `${p.name} ${itemDef.name}`,
          dmgMult: p.dmgMult || 1,
          valMult: p.valMult || 1,
          bonus: p.bonus || null,
          effect: p.effect || null,
          color: p.color
        }
      };
    },
    init: function(saveData, spawnTarget = null, slotIndex = 0, newName = null) {
      this.worldData = {};
      this.initCache();
      window.addEventListener("beforeunload", () => {
        if (this.isDirty) this.saveGame(true);
      });
      if (this.items && Object.keys(this.items).length === 0) this.items.ammo = { name: "Munition", type: "ammo", cost: 2, icon: "bullet" };
      try {
        let isNewGame = false;
        const defaultPOIs = [{ type: "V", x: 4, y: 4 }, { type: "C", x: 3, y: 3 }];
        if (saveData) {
          this.state = saveData;
          if (!this.state.worldSeed) {
            this.state.worldSeed = Date.now();
          }
          if (typeof WorldGen !== "undefined") WorldGen.setSeed(this.state.worldSeed);
          if (!this.state.explored) this.state.explored = {};
          if (!this.state.view) this.state.view = "map";
          if (typeof this.state.rads === "undefined") this.state.rads = 0;
          if (!this.state.activeQuests) this.state.activeQuests = [];
          if (!this.state.completedQuests) this.state.completedQuests = [];
          if (!this.state.quests) this.state.quests = [];
          if (!this.state.knownRecipes) this.state.knownRecipes = [];
          ["craft_ammo", "craft_stimpack_simple", "rcp_camp", "craft_bp_frame", "craft_bp_leather", "craft_bp_metal", "craft_bp_military", "craft_bp_cargo"].forEach((r) => {
            if (!this.state.knownRecipes.includes(r)) this.state.knownRecipes.push(r);
          });
          if (!this.state.perks) this.state.perks = {};
          if (!this.state.shop) this.state.shop = { nextRestock: 0, stock: {}, merchantCaps: 1e3 };
          if (!this.state.equip) this.state.equip = { weapon: null, body: null };
          this.state.saveSlot = slotIndex;
          this.checkNewQuests();
          this.syncAmmo();
          this.recalcStats();
          if (typeof UI !== "undefined") UI.log(">> Spielstand geladen.", "text-cyan-400");
        } else {
          isNewGame = true;
          const seed = Date.now();
          if (typeof WorldGen !== "undefined") WorldGen.setSeed(seed);
          let startSector = { x: 4, y: 4 };
          if (typeof WorldGen !== "undefined" && WorldGen.getStartSector) startSector = WorldGen.getStartSector();
          const startWeapon = this.items["fists"] ? { ...this.items["fists"] } : { id: "fists", name: "Fäuste", baseDmg: 2, type: "weapon" };
          const startBody = this.items["vault_suit"] ? { ...this.items["vault_suit"] } : { id: "vault_suit", name: "Vault-Anzug", def: 1, type: "body" };
          this.state = {
            saveSlot: slotIndex,
            worldSeed: seed,
            playerName: newName || "SURVIVOR",
            sector: startSector,
            startSector,
            worldPOIs: defaultPOIs,
            player: { x: 25, y: 25, rot: 0 },
            stats: { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 },
            equip: { weapon: startWeapon, body: startBody },
            inventory: [],
            hp: 100,
            maxHp: 100,
            xp: 0,
            lvl: 1,
            caps: 50,
            ammo: 0,
            statPoints: 0,
            perkPoints: 0,
            perks: {},
            camp: null,
            rads: 0,
            kills: 0,
            view: "map",
            zone: "Ödland",
            inDialog: false,
            isGameOver: false,
            explored: {},
            visitedSectors: [`${startSector.x},${startSector.y}`],
            activeQuests: [],
            completedQuests: [],
            knownRecipes: ["craft_ammo", "craft_stimpack_simple", "rcp_camp", "craft_bp_frame", "craft_bp_leather", "craft_bp_metal", "craft_bp_military", "craft_bp_cargo"],
            hiddenItems: {},
            shop: { nextRestock: 0, stock: {}, merchantCaps: 1e3 },
            startTime: Date.now()
          };
          this.state.inventory.push({ id: "stimpack", count: 1, isNew: true });
          this.state.inventory.push({ id: "ammo", count: 10, isNew: true });
          this.syncAmmo();
          this.recalcStats();
          this.state.hp = this.state.maxHp;
          this.checkNewQuests();
          if (typeof UI !== "undefined") UI.log(">> Neuer Charakter erstellt.", "text-green-400");
          this.saveGame(true);
        }
        if (isNewGame) {
          if (typeof this.loadSector === "function") this.loadSector(this.state.sector.x, this.state.sector.y);
        } else {
          if (typeof this.loadSector === "function") this.loadSector(this.state.sector.x, this.state.sector.y);
        }
        if (typeof UI !== "undefined") {
          UI.switchView("map").then(() => {
            if (UI.els.gameOver) UI.els.gameOver.classList.add("hidden");
            if (isNewGame) setTimeout(() => UI.showPermadeathWarning(), 500);
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // src/game/game_map.js
  Object.assign(Game, {
    reveal: function(px, py) {
      if (!this.state) return;
      if (!this.state.explored) this.state.explored = {};
      if (!this.state.discoveredPOIs) this.state.discoveredPOIs = {};
      const r = 3;
      const sx = this.state.sector.x;
      const sy = this.state.sector.y;
      const sk = `${sx},${sy}`;
      for (let y = py - r; y <= py + r; y++) {
        for (let x = px - r; x <= px + r; x++) {
          if (x >= 0 && x < this.MAP_W && y >= 0 && y < this.MAP_H) {
            const key = `${sk}_${x},${y}`;
            const tile = this.state.currentMap[y][x];
            if (!this.state.explored[key]) {
              this.state.explored[key] = tile;
            }
            if (["V", "C", "G", "S", "H", "A", "R"].includes(tile)) {
              if (!this.state.discoveredPOIs[sk]) this.state.discoveredPOIs[sk] = [];
              if (!this.state.discoveredPOIs[sk].includes(tile)) {
                this.state.discoveredPOIs[sk].push(tile);
                if (typeof UI !== "undefined" && UI.log) UI.log("Neuen Ort auf Weltkarte verzeichnet!", "text-yellow-400 font-bold");
                this.saveGame();
              }
            }
          }
        }
      }
    },
    move: function(dx, dy) {
      if (!this.state || this.state.isGameOver || this.state.view !== "map" || this.state.inDialog) return;
      const nx = this.state.player.x + dx;
      const ny = this.state.player.y + dy;
      if (nx < 0 || nx >= this.MAP_W || ny < 0 || ny >= this.MAP_H) {
        this.changeSector(nx, ny);
        return;
      }
      const t = this.state.currentMap[ny][nx];
      const pk = `${nx},${ny}`;
      if (this.state.hiddenItems && this.state.hiddenItems[pk]) {
        this.addToInventory(this.state.hiddenItems[pk], 1);
        if (typeof UI !== "undefined") UI.log(`Gefunden!`, "text-yellow-400 font-bold");
        if (typeof UI !== "undefined" && UI.shakeView) UI.shakeView();
        delete this.state.hiddenItems[pk];
      }
      if (t === "X") {
        if (this.state.dungeonLevel >= 3) {
          this.openChest(nx, ny);
        } else {
          this.interactWithChest(nx, ny);
        }
        return;
      }
      if (t === "v") {
        this.descendDungeon();
        return;
      }
      if (t === "?") {
        this.testMinigames();
        return;
      }
      if (["M", "W", "#", "U", "t", "o", "Y", "|", "F", "T", "R", "^", "~"].includes(t) && t !== "R" && t !== "+") {
        if (this.state.hiddenItems && this.state.hiddenItems[pk]) {
          this.addToInventory(this.state.hiddenItems[pk], 1);
          delete this.state.hiddenItems[pk];
          return;
        }
        if (typeof UI !== "undefined" && UI.shakeView) UI.shakeView();
        if (["#", "^", "|"].includes(t) && this.spawnParticle) this.spawnParticle(nx, ny, "rubble", 4);
        if (["M", "W"].includes(t) && this.spawnParticle) this.spawnParticle(nx, ny, "blood", 6);
        return;
      }
      if (this.spawnParticle) this.spawnParticle(this.state.player.x, this.state.player.y, "dust", 3);
      this.state.player.x = nx;
      this.state.player.y = ny;
      if (dx === 1) this.state.player.rot = Math.PI / 2;
      if (dx === -1) this.state.player.rot = -Math.PI / 2;
      if (dy === 1) this.state.player.rot = Math.PI;
      if (dy === -1) this.state.player.rot = 0;
      this.reveal(nx, ny);
      if (typeof this.tickRadWolken === "function") this.tickRadWolken();
      if (typeof Network !== "undefined") Network.sendHeartbeat();
      if (t === "V") {
        if (typeof UI !== "undefined" && typeof UI.enterVault === "function") {
          UI.enterVault();
        } else {
          if (typeof UI !== "undefined") UI.log("Vault 101 erreicht", "text-yellow-400");
        }
        return;
      }
      if (t === "C") {
        this.enterCity();
        return;
      }
      if (t === "S" || t === "H" || t === "A" || t === "R" || t === "K") {
        this.tryEnterDungeon(t === "S" ? "market" : t === "H" ? "cave" : t === "A" ? "military" : t === "R" ? "raider" : "tower");
        return;
      }
      if (Math.random() < 0.03 && !["=", "+", "V", "C"].includes(t)) {
        this.startCombat();
        return;
      }
      if (typeof UI !== "undefined" && UI.update) UI.update();
    },
    changeSector: function(px, py) {
      let sx = this.state.sector.x, sy = this.state.sector.y;
      let newPx = px, newPy = py;
      if (py < 0) {
        sy--;
        newPy = this.MAP_H - 1;
        newPx = this.state.player.x;
      } else if (py >= this.MAP_H) {
        sy++;
        newPy = 0;
        newPx = this.state.player.x;
      }
      if (px < 0) {
        sx--;
        newPx = this.MAP_W - 1;
        newPy = this.state.player.y;
      } else if (px >= this.MAP_W) {
        sx++;
        newPx = 0;
        newPy = this.state.player.y;
      }
      if (sx < 0 || sx >= this.WORLD_W || sy < 0 || sy >= this.WORLD_H) {
        if (typeof UI !== "undefined") UI.log("Ende der Welt.", "text-red-500");
        return;
      }
      this.state.sector = { x: sx, y: sy };
      this.loadSector(sx, sy);
      this.state.player.x = newPx;
      this.state.player.y = newPy;
      this.ensureWalkableSpawn();
      this.reveal(newPx, newPy);
      this.saveGame();
      if (typeof this.updateQuestProgress === "function") this.updateQuestProgress("visit", `${sx},${sy}`, 1);
      if (typeof UI !== "undefined") UI.log(`Sektor: ${sx},${sy}`, "text-blue-400");
    },
    ensureWalkableSpawn: function() {
      if (!this.state || !this.state.currentMap) return;
      if (this.state.player.x < 0 || this.state.player.x >= this.MAP_W || this.state.player.y < 0 || this.state.player.y >= this.MAP_H) {
        this.state.player.x = 25;
        this.state.player.y = 25;
      }
      const px = this.state.player.x;
      const py = this.state.player.y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const tx = px + dx, ty = py + dy;
        if (tx >= 0 && tx < this.MAP_W && ty >= 0 && ty < this.MAP_H) {
          const t = this.state.currentMap[ty][tx];
          if (["^", "Y", "t", "~", "#"].includes(t)) this.state.currentMap[ty][tx] = ".";
        }
      }
      const ct = this.state.currentMap[py][px];
      if (ct === "~") this.state.currentMap[py][px] = "+";
    },
    loadSector: function(sx_in, sy_in) {
      const sx = parseInt(sx_in), sy = parseInt(sy_in);
      const key = `${sx},${sy}`;
      if (this.state.worldSeed && typeof WorldGen !== "undefined") WorldGen.setSeed(this.state.worldSeed);
      if (!this.worldData[key]) {
        let biome = "wasteland", map;
        if (typeof WorldGen !== "undefined") {
          biome = WorldGen.getSectorBiome(sx, sy);
          map = WorldGen.createSector(this.MAP_W, this.MAP_H, sx, sy);
        } else map = Array(this.MAP_H).fill().map(() => Array(this.MAP_W).fill("."));
        this.worldData[key] = { layout: map, biome };
      }
      this.state.currentMap = this.worldData[key].layout;
      if (!this.state.visitedSectors.includes(key)) this.state.visitedSectors.push(key);
      this.state.hiddenItems = {};
      if (Math.random() < 0.3) {
        let hx = Math.floor(Math.random() * this.MAP_W);
        let hy = Math.floor(Math.random() * this.MAP_H);
        if (["t", "#"].includes(this.state.currentMap[hy][hx])) this.state.hiddenItems[`${hx},${hy}`] = "screws";
      }
      let zn = "Ödland";
      const bd = this.worldData[key].biome;
      if (bd === "forest") zn = "Verstrahlter Wald";
      if (bd === "swamp") zn = "Todes-Sümpfe";
      if (bd === "desert") zn = "Die Glühende See";
      if (bd === "mountain") zn = "Felsengebirge";
      if (bd === "city") zn = "Zerfallene Stadt";
      if (bd === "jungle") zn = "Überwucherter Dschungel";
      this.state.zone = `${zn} (${sx},${sy})`;
      this.ensureWalkableSpawn();
      if (typeof this.baueRadWolken === "function") this.baueRadWolken(bd);
      if (this.renderStaticMap) this.renderStaticMap();
      this.reveal(this.state.player.x, this.state.player.y);
    },
    tryEnterDungeon: function(t) {
      const k = `${this.state.sector.x},${this.state.sector.y}_${t}`;
      const c = this.state.cooldowns ? this.state.cooldowns[k] : 0;
      if (c && Date.now() < c) {
        if (typeof UI !== "undefined") UI.showDungeonLocked(Math.ceil((c - Date.now()) / 6e4));
        return;
      }
      if (typeof UI !== "undefined") UI.showDungeonWarning(() => this.enterDungeon(t));
    },
    enterDungeon: function(t, l = 1) {
      if (l === 1) {
        this.state.savedPosition = { x: this.state.player.x, y: this.state.player.y };
        this.state.sectorExploredCache = JSON.parse(JSON.stringify(this.state.explored));
      }
      this.state.dungeonLevel = l;
      this.state.dungeonType = t;
      if (typeof WorldGen !== "undefined") {
        WorldGen.setSeed((this.state.sector.x + 1) * (this.state.sector.y + 1) * Date.now() + l);
        const d = WorldGen.generateDungeonLayout(this.MAP_W, this.MAP_H);
        this.state.currentMap = d.map;
        this.state.player.x = d.startX;
        this.state.player.y = d.startY;
        if (l < 3) {
          for (let y = 0; y < this.MAP_H; y++) for (let x = 0; x < this.MAP_W; x++) if (this.state.currentMap[y][x] === "X") this.state.currentMap[y][x] = "v";
        }
      }
      this.state.zone = "Dungeon";
      this.state.explored = {};
      this.reveal(this.state.player.x, this.state.player.y);
      if (this.renderStaticMap) this.renderStaticMap();
      if (typeof UI !== "undefined") UI.update();
    },
    descendDungeon: function() {
      this.enterDungeon(this.state.dungeonType, this.state.dungeonLevel + 1);
      if (typeof UI !== "undefined") {
        UI.shakeView();
        UI.log("Tiefer...", "text-purple-400");
      }
    },
    openChest: function(x, y) {
      if (this.state.dungeonLevel >= 3) {
        if (typeof UI !== "undefined") UI.startMinigame("memory", () => this.forceOpenChest(x, y));
        return;
      }
      this.forceOpenChest(x, y);
    },
    forceOpenChest: function(x, y) {
      this.state.currentMap[y][x] = "B";
      if (this.renderStaticMap) this.renderStaticMap();
      const m = this.state.dungeonLevel || 1;
      this.state.caps += 100 * m;
      this.addToInventory("legendary_part", 1);
      if (Math.random() < 0.5) this.addToInventory("stimpack", 1);
      if (typeof UI !== "undefined") UI.showDungeonVictory(100 * m, m);
      setTimeout(() => this.leaveCity(), 4e3);
    },
    leaveCity: function() {
      this.state.view = "map";
      this.state.dungeonLevel = 0;
      if (this.state.savedPosition) {
        this.state.player.x = this.state.savedPosition.x;
        this.state.player.y = this.state.savedPosition.y;
        this.state.savedPosition = null;
      }
      if (typeof UI !== "undefined") UI.switchView("map").then(() => {
        if (this.renderStaticMap) this.renderStaticMap();
      });
    },
    enterCity: function() {
      this.state.savedPosition = { x: this.state.player.x, y: this.state.player.y };
      if (typeof UI !== "undefined" && typeof UI.enterCityCinematic === "function") {
        UI.enterCityCinematic(() => {
          this.state.view = "city";
          this.saveGame();
          UI.switchView("city").then(() => {
            if (UI.renderCity) UI.renderCity();
          });
        });
      } else {
        this.state.view = "city";
        this.saveGame();
        if (typeof UI !== "undefined") UI.switchView("city").then(() => {
          if (UI.renderCity) UI.renderCity();
        });
      }
    },
    testMinigames: function() {
      if (UI.els.dialog) {
        UI.els.dialog.style.display = "flex";
        UI.els.dialog.innerHTML = `<div class="bg-black text-white p-4 border border-green-500"><button onclick="UI.startMinigame('hacking')">HACK</button><button onclick="UI.els.dialog.style.display='none'">X</button></div>`;
      }
    },
    // ==========================================
    // NEU: SCALING CHESTS & MINIGAMES LOGIK
    // ==========================================
    interactWithChest: function(x, y) {
      if (this.state.inDialog) return;
      this.state.inDialog = true;
      const typWurf = Math.random();
      const istTerminal = (this.state.dungeonLevel || 0) >= 2 && typWurf < 0.25;
      const isBomb = !istTerminal && typWurf >= 0.7;
      const diff = Math.max(1, Math.min(10, Math.floor(this.state.lvl / 5) + 1));
      const onSuccess = () => {
        this.state.inDialog = false;
        this.state.currentMap[y][x] = ".";
        if (this.renderStaticMap) this.renderStaticMap();
        const loot = this.generateScaledLoot(this.state.lvl);
        let lootMsg = "Du hast die Truhe geplündert!<br><br><div class='text-left inline-block mt-2'>";
        loot.forEach((item) => {
          this.safeGiveItem(item.id, item.count);
          const itemName = this.items[item.id] ? this.items[item.id].name : item.id.toUpperCase();
          lootMsg += `<span class="text-yellow-400 font-bold font-mono">> + ${item.count}x ${itemName}</span><br>`;
        });
        lootMsg += "</div>";
        if (typeof UI !== "undefined" && UI.showInfoDialog) {
          UI.showInfoDialog("TRUHE GEÖFFNET", lootMsg);
        }
        this.saveGame();
        if (this.draw) this.draw();
        if (typeof UI !== "undefined" && UI.update) UI.update();
      };
      const onFail = () => {
        this.state.inDialog = false;
        this.state.currentMap[y][x] = ".";
        if (this.renderStaticMap) this.renderStaticMap();
        if (isBomb) {
          const dmg = 15 + this.state.lvl * 3;
          this.state.hp -= dmg;
          if (typeof UI !== "undefined" && UI.showInfoDialog) {
            UI.showInfoDialog("💥 BOOOM! 💥", `Du hast den Zünder ausgelöst! Die Kiste ist explodiert und der Loot vernichtet.<br><br>Du verlierst <span class="text-red-500 font-bold">${dmg} TP</span>.`);
          }
          if (this.state.hp <= 0 && typeof UI !== "undefined" && UI.showGameOver) UI.showGameOver();
        } else if (istTerminal) {
          if (typeof UI !== "undefined" && UI.showInfoDialog) {
            UI.showInfoDialog("ZUGRIFF VERWEIGERT", "Das Terminal hat sich gesperrt. Die Truhe bleibt zu.");
          }
        } else {
          if (typeof UI !== "undefined" && UI.showInfoDialog) {
            UI.showInfoDialog("VERKLEMMT", "Dein Dietrich ist abgebrochen und das Schloss hat sich für immer verklemmt. Die Truhe lässt sich nicht mehr öffnen.");
          }
        }
        this.saveGame();
        if (this.draw) this.draw();
        if (typeof UI !== "undefined" && UI.update) UI.update();
      };
      const typ = istTerminal ? "hacking" : isBomb ? "defusal" : "lockpicking";
      if (typeof UI !== "undefined" && UI.startMinigame && UI.hasMinigame && UI.hasMinigame(typ)) {
        UI.startMinigame(typ, onSuccess, onFail, diff);
      } else if (typeof UI !== "undefined" && UI.startMinigame && !UI.hasMinigame) {
        UI.startMinigame(typ, onSuccess, onFail, diff);
      } else {
        this.state.inDialog = false;
        onSuccess();
      }
    },
    generateScaledLoot: function(playerLevel) {
      const loot = [];
      const capsAmount = Math.floor(Math.random() * 20 * playerLevel) + 15;
      loot.push({ id: "caps", count: capsAmount });
      if (Math.random() > 0.2) {
        const ammoAmount = Math.floor(Math.random() * 5 * playerLevel) + 5;
        loot.push({ id: "ammo", count: ammoAmount });
      }
      if (Math.random() > 0.5) {
        loot.push({ id: "stimpack", count: Math.random() > 0.8 ? 2 : 1 });
      }
      if (this.items) {
        const possibleEquip = Object.values(this.items).filter(
          (item) => (item.type === "weapon" || item.type === "body" || item.type === "head" || item.type === "legs") && (item.lvlReq || 1) <= playerLevel && (item.lvlReq || 1) >= Math.max(1, playerLevel - 5)
        );
        if (possibleEquip.length > 0 && Math.random() > 0.6) {
          const randomEquip = possibleEquip[Math.floor(Math.random() * possibleEquip.length)];
          loot.push({ id: randomEquip.id, count: 1 });
        } else if (Math.random() > 0.2) {
          loot.push({ id: "junk", count: Math.floor(Math.random() * 4) + 1 });
        }
      }
      return loot;
    },
    safeGiveItem: function(id, count) {
      if (id === "caps") {
        this.state.caps = (this.state.caps || 0) + count;
        return;
      }
      if (typeof this.addToInventory === "function") {
        this.addToInventory(id, count);
      } else if (typeof this.giveItem === "function") {
        this.giveItem(id, count);
      } else {
        if (!this.state.inventory) this.state.inventory = [];
        let item = this.state.inventory.find((i) => i.id === id);
        if (item) item.count += count;
        else this.state.inventory.push({ id, count });
      }
    }
  });

  // src/game/world_air.js
  Object.assign(Game, {
    // Wie viele Wolken je Sektor, nach Biom. Bewusst sparsam: man sieht nur
    // zehn Felder weit, der Sektor ist 50x50. Zu viele Wolken waeren ein
    // Nebelmeer und kein Hindernis.
    RAD_WOLKEN_JE_BIOM: {
      desert: 5,
      // Die Glühende See - die Heimat der Wolken
      swamp: 3,
      // Todes-Sümpfe
      forest: 2,
      // Verstrahlter Wald
      jungle: 2,
      wasteland: 1,
      mountain: 1,
      city: 0
      // in der Stadt gibt es Strassen, keine Wolken
    },
    // RAD pro Feld, das in der Wolke steht. Ein Sektor ist 50 Felder breit;
    // wer eine Wolke durchquert, kommt mit 6-8 Feldern durch - das sind bei
    // einer dichten Wolke grob 20-30 RAD, also ein knappes RadAway.
    RAD_PRO_FELD: 4,
    // Ein Wolkenzug pro Sekunde waere zu schnell (der Spieler laeuft bei
    // jedem Tastendruck ein Feld). Alle 6 Sekunden ein Feld ist sichtbar,
    // aber umgehbar.
    RAD_WOLKE_ZUG_MS: 6e3,
    // --- Lebenszyklus -------------------------------------------------------
    radWolkenZahlFuerBiom: function(biome) {
      const zahl = this.RAD_WOLKEN_JE_BIOM[biome];
      return typeof zahl === "number" ? zahl : 1;
    },
    // Wird beim Betreten eines Sektors gerufen. Vorhandene Wolken des Sektors
    // werden weiterverwendet, damit ein Wechsel hin und zurueck sie nicht neu
    // auswuerfelt.
    baueRadWolken: function(biome) {
      if (!this.state) return [];
      if (!Array.isArray(this.state.radClouds)) this.state.radClouds = [];
      const sektor = this.state.sector || { x: 0, y: 0 };
      const vorhanden = this.state.radClouds.filter((w) => w.sektor.x === sektor.x && w.sektor.y === sektor.y);
      if (vorhanden.length > 0) return vorhanden;
      const anzahl = this.radWolkenZahlFuerBiom(biome);
      for (let i = 0; i < anzahl; i++) {
        this.state.radClouds.push(this._neueRadWolke(sektor));
      }
      return this.state.radClouds.filter((w) => w.sektor.x === sektor.x && w.sektor.y === sektor.y);
    },
    _neueRadWolke: function(sektor) {
      let x, y, versuche = 0;
      const px = this.state.player && this.state.player.x || 0;
      const py = this.state.player && this.state.player.y || 0;
      do {
        x = 3 + Math.floor(Math.random() * (this.MAP_W - 6));
        y = 3 + Math.floor(Math.random() * (this.MAP_H - 6));
        versuche++;
      } while (versuche < 40 && Math.abs(x - px) + Math.abs(y - py) < 8);
      return {
        sektor: { x: sektor.x, y: sektor.y },
        x,
        y,
        radius: 2,
        // Felder um das Zentrum
        dichte: 1,
        // 1 = volle Dichte, sinkt beim Aufloesen
        zug: Date.now()
        // Zeitpunkt des letzten Zugs
      };
    },
    // Alle Wolken des aktuellen Sektors.
    radWolkenImSektor: function() {
      if (!this.state || !Array.isArray(this.state.radClouds)) return [];
      const sektor = this.state.sector || { x: 0, y: 0 };
      return this.state.radClouds.filter((w) => w.sektor.x === sektor.x && w.sektor.y === sektor.y);
    },
    // Steht der Spieler in einer Wolke? Gibt die Wolke zurueck oder null.
    // Der Radius wird euklidisch gemessen, damit die Wolke rund wirkt und
    // nicht wie ein Kreuz.
    radWolkeAufFeld: function(fx, fy) {
      for (const w of this.radWolkenImSektor()) {
        const dx = w.x - fx, dy = w.y - fy;
        if (Math.sqrt(dx * dx + dy * dy) <= w.radius) return w;
      }
      return null;
    },
    // --- Bewegung -----------------------------------------------------------
    // Wird bei jedem Spielerzug gerufen (aus Game.move heraus, nicht aus dem
    // Renderer): die Wolken wandern, wenn ihr Zug faellig ist.
    bewegeRadWolken: function() {
      if (!this.state || !Array.isArray(this.state.radClouds)) return;
      const jetzt = Date.now();
      const sektor = this.state.sector || { x: 0, y: 0 };
      for (const w of this.state.radClouds) {
        if (w.sektor.x !== sektor.x || w.sektor.y !== sektor.y) continue;
        if (jetzt - (w.zug || 0) < this.RAD_WOLKE_ZUG_MS) continue;
        const richtungen = [[1, 0], [1, 0], [1, 1], [1, -1], [0, 1], [0, -1]];
        const [dx, dy] = richtungen[Math.floor(Math.random() * richtungen.length)];
        let nx = w.x + dx, ny = w.y + dy;
        if (nx < 2 || nx > this.MAP_W - 3) nx = w.x - dx;
        if (ny < 2 || ny > this.MAP_H - 3) ny = w.y - dy;
        const feld = this.state.currentMap && this.state.currentMap[ny] ? this.state.currentMap[ny][nx] : ".";
        if (["#", "^", "Y"].includes(feld)) {
          w.zug = jetzt;
          continue;
        }
        w.x = nx;
        w.y = ny;
        w.zug = jetzt;
      }
    },
    // --- Wirkung ------------------------------------------------------------
    // Ein Zug des Spielers ist zu Ende: Wolken ziehen, Strahlung pruefen.
    // Wird aus Game.move gerufen (dort, wo sich der Spieler wirklich bewegt).
    tickRadWolken: function() {
      if (!this.state) return;
      this.bewegeRadWolken();
      const w = this.radWolkeAufFeld(this.state.player.x, this.state.player.y);
      if (w) {
        this.addRadiation(this.RAD_PRO_FELD);
        if (typeof UI !== "undefined" && UI.log && !this._radWolkenMeldung) {
          UI.log("Du stehst in einer Strahlungswolke!", "text-green-400 font-bold");
          this._radWolkenMeldung = true;
        }
      } else {
        this._radWolkenMeldung = false;
      }
    },
    // Strahlungswert eines Feldes - fuer Vorschau und Tests.
    radWolkenWertAufFeld: function(fx, fy) {
      const w = this.radWolkeAufFeld(fx, fy);
      if (!w) return 0;
      return Math.ceil(this.RAD_PRO_FELD * (w.dichte || 1));
    }
  });

  // src/game/game_render.js
  Object.assign(Game, {
    particles: [],
    weatherParticles: [],
    initCache: function() {
      this.cacheCanvas = document.createElement("canvas");
      this.cacheCanvas.width = this.MAP_W * this.TILE;
      this.cacheCanvas.height = this.MAP_H * this.TILE;
      this.cacheCtx = this.cacheCanvas.getContext("2d");
    },
    pseudoRand: function(x, y) {
      return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },
    spawnParticle: function(x, y, type, count = 5) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: px + (Math.random() * 10 - 5),
          y: py + (Math.random() * 10 - 5),
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1,
          type,
          color: type === "blood" ? "#d32f2f" : type === "dust" ? "#a1887f" : "#fff",
          size: Math.random() * 3 + 1,
          decay: 0.05
        });
      }
    },
    updateParticles: function() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        let p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    },
    drawParticles: function(ctx) {
      for (let p of this.particles) {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    },
    renderStaticMap: function() {
      if (!this.cacheCtx) this.initCache();
      const ctx = this.cacheCtx;
      const map = this.state.currentMap;
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height);
      if (!map) return;
      for (let y = 0; y < this.MAP_H; y++) {
        for (let x = 0; x < this.MAP_W; x++) {
          const t = map[y][x];
          this.drawFloorDetail(ctx, x, y, t);
          if (t === "#") this.drawConnectedWall(ctx, x, y, map);
          else if (t === "^") this.drawMountain(ctx, x, y);
          else if (t === "Y") this.drawHighMountain(ctx, x, y);
          else if (t === "=") this.drawRoad(ctx, x, y);
          else if (t === "+") this.drawBridge(ctx, x, y);
          else if (t === "~") {
            ctx.fillStyle = "#0d47a1";
            ctx.fillRect(x * this.TILE, y * this.TILE, this.TILE, this.TILE);
          }
        }
      }
    },
    drawFloorDetail: function(ctx, x, y, type) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      const rand = this.pseudoRand(x, y);
      let color = "#1a1a1a";
      if (type === '"') color = "#1b331b";
      if (type === "_") color = "#3b3626";
      if (type === ";") color = "#241f1a";
      if (type === ",") color = "#26211d";
      if (type === "t") color = "#1b331b";
      if (type === "^" || type === "Y") color = "#222";
      if (type === "~") return;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, ts, ts);
      if (type === '"' && rand > 0.6) {
        ctx.fillStyle = "#2e4e2e";
        ctx.fillRect(px + rand * ts, py + (1 - rand) * ts, 2, 2);
      }
      if (type === "_" && rand > 0.8) {
        ctx.fillStyle = "#5e5a4a";
        ctx.fillRect(px + rand * ts, py + (1 - rand) * ts, 2, 2);
      }
      if (type === ",") {
        ctx.fillStyle = "#666";
        if (rand > 0.5) {
          ctx.fillRect(px + ts * 0.2, py + ts * 0.3, ts * 0.4, ts * 0.3);
          ctx.fillStyle = "#888";
          ctx.fillRect(px + ts * 0.25, py + ts * 0.35, ts * 0.1, ts * 0.1);
        } else {
          ctx.fillRect(px + ts * 0.1, py + ts * 0.1, ts * 0.2, ts * 0.2);
          ctx.fillRect(px + ts * 0.6, py + ts * 0.6, ts * 0.25, ts * 0.25);
        }
      }
      if (type === "." && rand > 0.8) {
        ctx.fillStyle = "#333";
        ctx.fillRect(px + rand * ts, py + (1 - rand) * ts, 2, 2);
      }
    },
    drawRoad: function(ctx, x, y) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      ctx.fillStyle = "#444";
      ctx.fillRect(px, py, ts, ts);
      if (this.pseudoRand(x, y) > 0.5) {
        ctx.fillStyle = "#222";
        ctx.fillRect(px + 4, py + 4, ts - 8, ts - 8);
      }
    },
    drawBridge: function(ctx, x, y) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      ctx.fillStyle = "#0d47a1";
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(px + 4, py, ts - 8, ts);
      ctx.fillStyle = "#3e2723";
      for (let i = 0; i < ts; i += 5) ctx.fillRect(px + 4, py + i, ts - 8, 1);
      ctx.fillStyle = "#8d6e63";
      ctx.fillRect(px + 2, py, 2, ts);
      ctx.fillRect(px + ts - 4, py, 2, ts);
    },
    drawConnectedWall: function(ctx, x, y, map) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      const rand = this.pseudoRand(x, y);
      const n = y > 0 && map[y - 1][x] === "#";
      const shade = Math.floor(70 + rand * 30);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(px, py, ts, ts);
      ctx.fillStyle = "#333";
      ctx.fillRect(px, py + ts - 8, ts, 8);
      ctx.fillStyle = "#666";
      if (!n) ctx.fillRect(px, py, ts, 4);
      if (rand > 0.4) {
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.moveTo(px + ts * rand, py + ts * 0.2);
        ctx.lineTo(px + ts * rand + 3, py + ts * 0.6);
        ctx.stroke();
      }
    },
    drawHighMountain: function(ctx, x, y) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      ctx.fillStyle = "#2c2c2c";
      ctx.beginPath();
      ctx.moveTo(px, py + ts);
      ctx.lineTo(px + ts / 2, py - ts * 0.2);
      ctx.lineTo(px + ts, py + ts);
      ctx.fill();
      ctx.fillStyle = "#444";
      ctx.beginPath();
      ctx.moveTo(px + ts * 0.2, py + ts);
      ctx.lineTo(px + ts / 2, py - ts * 0.2);
      ctx.lineTo(px + ts / 2, py + ts);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(px + ts * 0.4, py + ts * 0.2);
      ctx.lineTo(px + ts / 2, py - ts * 0.2);
      ctx.lineTo(px + ts * 0.6, py + ts * 0.2);
      ctx.lineTo(px + ts / 2, py + ts * 0.3);
      ctx.fill();
    },
    drawMountain: function(ctx, x, y) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      const rand = this.pseudoRand(x, y);
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(px, py + ts);
      ctx.lineTo(px + ts / 2, py + ts * 0.1);
      ctx.lineTo(px + ts, py + ts);
      ctx.fill();
      ctx.fillStyle = "#444";
      ctx.beginPath();
      ctx.moveTo(px + ts * 0.3, py + ts);
      ctx.lineTo(px + ts * 0.5, py + ts * 0.4);
      ctx.lineTo(px + ts * 0.7, py + ts);
      ctx.fill();
      ctx.fillStyle = rand > 0.7 ? "#666" : "#555";
      ctx.beginPath();
      ctx.moveTo(px + ts / 2, py + ts * 0.1);
      ctx.lineTo(px + ts * 0.35, py + ts * 0.4);
      ctx.lineTo(px + ts * 0.65, py + ts * 0.4);
      ctx.fill();
    },
    drawTree: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      const rand = this.pseudoRand(x, y);
      const sway = Math.sin(time / 1e3 + x) * 2;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.ellipse(px + ts / 2, py + ts - 5, ts / 3, ts / 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(px + ts / 2 - 3, py + ts / 2, 6, ts / 2);
      const green = rand > 0.5 ? "#388e3c" : "#2e7d32";
      ctx.fillStyle = green;
      ctx.beginPath();
      ctx.arc(px + ts / 2 + sway, py + ts / 2, ts / 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rand > 0.5 ? "#66bb6a" : "#4caf50";
      ctx.beginPath();
      ctx.arc(px + ts / 2 + sway * 1.5, py + ts / 3, ts / 3, 0, Math.PI * 2);
      ctx.fill();
    },
    drawWater: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      ctx.fillStyle = "#0d47a1";
      ctx.fillRect(px, py, ts, ts);
      ctx.strokeStyle = "rgba(100, 220, 255, 0.4)";
      ctx.lineWidth = 1;
      const offset = (time / 100 + x * 10) % ts;
      ctx.beginPath();
      ctx.moveTo(px, py + offset);
      ctx.lineTo(px + ts / 2, py + offset + 2);
      ctx.lineTo(px + ts, py + offset);
      ctx.stroke();
    },
    drawGrass: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts;
      const py = y * ts;
      const rand = this.pseudoRand(x, y);
      if (rand < 0.6) return;
      const sway = Math.sin(time / 500 + x * y) * 3;
      ctx.strokeStyle = rand > 0.8 ? "#7cb342" : "#558b2f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 10, py + ts);
      ctx.lineTo(px + 10 + sway, py + ts - 8);
      ctx.stroke();
    },
    drawCity: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(0, 0, ts * 2.5, ts * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2d2d2d";
      ctx.fillRect(-ts * 1.8, -ts * 1.5, ts * 0.8, ts * 2);
      ctx.fillStyle = "#444";
      ctx.fillRect(-ts * 1.9, -ts * 1.5, ts * 1, ts * 0.3);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillRect(-ts * 1.5, -ts * 1.2, ts * 0.2, ts * 0.2);
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(ts * 0.8, -ts * 0.8, ts * 1.5, ts * 1.2);
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(ts * 0.7, -ts * 0.9, ts * 1.7, ts * 0.3);
      ctx.fillStyle = "#000";
      ctx.fillRect(ts * 1.2, -ts * 0.2, ts * 0.4, ts * 0.6);
      const glow = Math.sin(time / 200) * 0.3 + 0.5;
      ctx.fillStyle = "#1b5e20";
      ctx.fillRect(ts * 1.5, ts * 0.5, ts * 0.4, ts * 0.6);
      ctx.fillStyle = `rgba(57, 255, 20, ${glow})`;
      ctx.beginPath();
      ctx.arc(ts * 1.7, ts * 0.5, ts * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(-ts * 0.8, -ts * 1.2, ts * 0.4, ts * 1.5);
      ctx.fillRect(ts * 0.4, -ts * 1.2, ts * 0.4, ts * 1.5);
      ctx.fillStyle = "#2d1a11";
      ctx.fillRect(-ts * 1, -ts * 1, ts * 2, ts * 0.5);
      const flicker = Math.sin(time / 150) * 0.2 + 0.8;
      ctx.fillStyle = `rgba(0, 255, 255, ${flicker})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#0ff";
      ctx.font = `bold ${ts * 0.25}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("RUSTY SPRINGS", 0, -ts * 0.75);
      ctx.shadowBlur = 0;
      ctx.restore();
    },
    drawGhostTown: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = "#3e3a35";
      ctx.beginPath();
      ctx.ellipse(0, 0, ts * 2.8, ts * 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(-ts * 1.8, -ts * 1.2);
      ctx.strokeStyle = "#2a1e18";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 25);
      ctx.lineTo(0, -25);
      ctx.lineTo(10, 25);
      ctx.stroke();
      ctx.translate(0, -25);
      ctx.rotate(time / 1e3);
      ctx.fillStyle = "#1a120e";
      ctx.fillRect(-2, -20, 4, 40);
      ctx.fillRect(-20, -2, 40, 4);
      ctx.restore();
      ctx.save();
      ctx.translate(ts * 1.5, -ts * 0.8);
      ctx.fillStyle = "#2d1f18";
      ctx.fillRect(-ts * 0.8, -ts * 0.8, ts * 1.6, ts * 1.2);
      ctx.fillStyle = "#150d09";
      ctx.beginPath();
      ctx.moveTo(-ts, -ts * 0.8);
      ctx.lineTo(-ts * 0.2, -ts * 1.5);
      ctx.lineTo(ts * 0.8, -ts * 0.6);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.fillRect(-ts * 0.4, -ts * 0.2, ts * 0.4, ts * 0.6);
      ctx.restore();
      ctx.fillStyle = "#2a1e18";
      ctx.fillRect(ts * 1.2, ts * 0.8, 3, 12);
      ctx.fillRect(ts * 1, ts * 1, 7, 3);
      ctx.fillRect(ts * 1.8, ts * 1.2, 3, 10);
      ctx.fillRect(ts * 1.6, ts * 1.4, 7, 3);
      ctx.fillStyle = "#2a1e18";
      ctx.fillRect(-ts * 0.9, -ts * 0.8, ts * 1.8, ts * 1.2);
      ctx.fillStyle = "#1a120e";
      ctx.beginPath();
      ctx.moveTo(-ts * 1.1, -ts * 0.8);
      ctx.lineTo(0, -ts * 1.4);
      ctx.lineTo(ts * 1.1, -ts * 0.8);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.fillRect(-ts * 0.6, -ts * 0.2, ts * 0.3, ts * 0.4);
      ctx.fillRect(ts * 0.3, -ts * 0.2, ts * 0.3, ts * 0.4);
      ctx.fillRect(-ts * 0.25, ts * 0.1, ts * 0.5, ts * 0.3);
      ctx.save();
      ctx.translate(0, -ts * 0.6);
      ctx.rotate(0.15);
      ctx.fillStyle = "#111";
      ctx.fillRect(-ts * 0.7, -ts * 0.2, ts * 1.4, ts * 0.4);
      ctx.fillStyle = "#555";
      ctx.font = `bold ${ts * 0.25}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HOPELESS", 0, 0);
      ctx.restore();
      const tX = time / 20 % (ts * 8) - ts * 4;
      const bounce = Math.abs(Math.sin(time / 150)) * 10;
      ctx.save();
      ctx.translate(tX, ts * 0.8 - bounce);
      ctx.rotate(time / 80);
      ctx.strokeStyle = "#8b7355";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.ellipse(0, 0, ts * 0.25, ts * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    },
    drawVault: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(0, 0, ts * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        ctx.strokeStyle = i % 2 === 0 ? "#eab308" : "#000";
        ctx.beginPath();
        ctx.arc(0, 0, ts * 0.85, i * Math.PI / 6, (i + 1) * Math.PI / 6);
        ctx.stroke();
      }
      const rot = Math.sin(time / 2e3) * 0.5;
      ctx.rotate(rot);
      ctx.fillStyle = "#4a5568";
      ctx.beginPath();
      ctx.arc(0, 0, ts * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4a5568";
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate(i * Math.PI / 4);
        ctx.fillRect(-ts * 0.15, -ts * 0.85, ts * 0.3, ts * 0.2);
        ctx.restore();
      }
      ctx.fillStyle = "#2d3748";
      ctx.beginPath();
      ctx.arc(0, 0, ts * 0.5, 0, Math.PI * 2);
      ctx.fill();
      const pulse = (Math.sin(time / 300) + 1) / 2;
      ctx.shadowBlur = 10 + pulse * 15;
      ctx.shadowColor = "#eab308";
      ctx.fillStyle = "#facc15";
      ctx.font = `bold ${ts * 0.35}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("101", 0, 0);
      ctx.restore();
    },
    drawMarket: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = "#3b3b3b";
      ctx.fillRect(-ts * 0.9, -ts * 0.8, ts * 1.8, ts * 1.4);
      ctx.fillStyle = "#222";
      ctx.fillRect(-ts * 0.9, -ts * 0.8, ts * 1.8, ts * 0.2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(-ts * 0.7, -ts * 0.2, ts * 0.5, ts * 0.6);
      ctx.fillRect(ts * 0.2, -ts * 0.2, ts * 0.5, ts * 0.6);
      ctx.fillStyle = "#111";
      ctx.fillRect(-ts * 0.8, -ts * 0.6, ts * 1.6, ts * 0.3);
      const flicker = Math.sin(time / 120) > 0 ? "#10b981" : "#064e3b";
      ctx.fillStyle = flicker;
      ctx.font = `bold ${ts * 0.2}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SUPER DUPER", 0, -ts * 0.45);
      ctx.restore();
    },
    drawCave: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = "#4a4a4a";
      ctx.beginPath();
      ctx.arc(0, ts * 0.4, ts, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(ts * 0.2, ts * 0.4, ts * 0.8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(0, ts * 0.4, ts * 0.4, Math.PI, 0);
      ctx.fill();
      const glow = Math.sin(time / 300) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(0, 255, 255, ${glow})`;
      ctx.beginPath();
      ctx.arc(-ts * 0.6, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ts * 0.5, ts * 0.2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    drawMilitary: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = "#4b5320";
      ctx.fillRect(-ts * 0.9, -ts * 0.8, ts * 1.8, ts * 1.4);
      ctx.fillStyle = "#333";
      ctx.fillRect(-ts * 0.9, -ts * 0.8, ts * 1.8, ts * 0.3);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(-ts * 0.3, -ts * 0.1, ts * 0.6, ts * 0.7);
      ctx.fillStyle = "#555";
      ctx.fillRect(-ts * 0.25, 0, ts * 0.2, ts * 0.6);
      ctx.fillRect(ts * 0.05, 0, ts * 0.2, ts * 0.6);
      ctx.save();
      ctx.translate(0, -ts * 0.9);
      ctx.rotate(time / 200);
      ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, ts, 0, Math.PI / 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, ts, Math.PI, Math.PI + Math.PI / 4);
      ctx.fill();
      ctx.fillStyle = "#f00";
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.restore();
    },
    drawRaider: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(-ts * 0.8, -ts * 0.6, ts * 1.6, ts);
      ctx.fillStyle = "#5d4037";
      ctx.beginPath();
      ctx.moveTo(-ts * 0.8, -ts * 0.6);
      ctx.lineTo(-ts * 0.5, -ts);
      ctx.lineTo(-ts * 0.2, -ts * 0.6);
      ctx.fill();
      ctx.strokeStyle = "#4e342e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-ts * 0.9, ts * 0.4);
      ctx.lineTo(-ts * 1.2, -ts * 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ts * 0.9, ts * 0.4);
      ctx.lineTo(ts * 1.2, -ts * 0.2);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(0, -ts * 0.2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(ts * 0.4, 0, ts * 0.3, ts * 0.4);
      const fireColors = ["#ef4444", "#f59e0b", "#eab308"];
      ctx.fillStyle = fireColors[Math.floor(time / 100 % 3)];
      ctx.beginPath();
      ctx.arc(ts * 0.55, -2 + Math.sin(time / 50) * 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
    checkLineOfSight: function(x0, y0, x1, y1) {
      let dx = Math.abs(x1 - x0);
      let dy = Math.abs(y1 - y0);
      let sx = x0 < x1 ? 1 : -1;
      let sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      let dist = 0;
      while (true) {
        if (x0 === x1 && y0 === y1) return true;
        if (dist > 0) {
          if (x0 >= 0 && x0 < this.MAP_W && y0 >= 0 && y0 < this.MAP_H) {
            const t = this.state.currentMap[y0][x0];
            if (["#", "^", "Y", "t"].includes(t)) return false;
          }
        }
        let e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
        dist++;
      }
    },
    // RAD-Wolken zeichnen (world_air.js haelt die Daten). Bewusst hier und
    // nicht in world_air: die Datei bleibt frei von Canvas-Code, damit die
    // Regeln testbar sind.
    drawRadClouds: function(ctx, time) {
      if (typeof this.radWolkenImSektor !== "function") return;
      const wolken = this.radWolkenImSektor();
      if (!wolken.length) return;
      for (const w of wolken) {
        const cx = (w.x + 0.5) * this.TILE;
        const cy = (w.y + 0.5) * this.TILE;
        const r = (w.radius + 0.5) * this.TILE;
        const puls = 1 + Math.sin(time / 700 + w.x) * 0.06;
        const dichte = w.dichte === void 0 ? 1 : w.dichte;
        const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * puls);
        grad.addColorStop(0, `rgba(120, 255, 80, ${0.3 * dichte})`);
        grad.addColorStop(0.55, `rgba(80, 200, 60, ${0.18 * dichte})`);
        grad.addColorStop(1, "rgba(40, 120, 30, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, r * puls, 0, Math.PI * 2);
        ctx.fill();
        for (let i = 0; i < 3; i++) {
          const phase = time / 1100 + i * 2.1 + w.x * 0.7;
          const dx = Math.cos(phase) * r * 0.45;
          const dy = Math.sin(phase * 1.3) * r * 0.35;
          ctx.fillStyle = `rgba(150, 255, 110, ${0.1 * dichte})`;
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dy, r * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    draw: function() {
      if (!this.ctx || !this.cacheCanvas) return;
      if (!this.state.currentMap) return;
      const ctx = this.ctx;
      const cvs = ctx.canvas;
      const time = Date.now();
      if (cvs.clientWidth === 0) return;
      const viewW = cvs.clientWidth;
      const viewH = cvs.clientHeight;
      let targetCamX = this.state.player.x * this.TILE - viewW / 2;
      let targetCamY = this.state.player.y * this.TILE - viewH / 2;
      const maxCamX = this.MAP_W * this.TILE - viewW;
      const maxCamY = this.MAP_H * this.TILE - viewH;
      const lerp = 0.1;
      this.camera.x += (Math.max(0, Math.min(targetCamX, maxCamX)) - this.camera.x) * lerp;
      this.camera.y += (Math.max(0, Math.min(targetCamY, maxCamY)) - this.camera.y) * lerp;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.save();
      ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));
      const startX = Math.floor(this.camera.x / this.TILE);
      const startY = Math.floor(this.camera.y / this.TILE);
      const endX = startX + Math.ceil(viewW / this.TILE) + 1;
      const endY = startY + Math.ceil(viewH / this.TILE) + 1;
      const visibleTiles = [];
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (y >= 0 && y < this.MAP_H && x >= 0 && x < this.MAP_W) {
            const dist = Math.sqrt((x - this.state.player.x) ** 2 + (y - this.state.player.y) ** 2);
            if (dist > 10) continue;
            if (!this.checkLineOfSight(this.state.player.x, this.state.player.y, x, y)) continue;
            visibleTiles.push({ x, y, dist, t: this.state.currentMap[y][x] });
            ctx.drawImage(this.cacheCanvas, x * this.TILE, y * this.TILE, this.TILE, this.TILE, x * this.TILE, y * this.TILE, this.TILE, this.TILE);
            const t = this.state.currentMap[y][x];
            if (t === "~") this.drawWater(ctx, x, y, time);
            else if (t === "t") this.drawTree(ctx, x, y, time);
            else if (t === '"') this.drawGrass(ctx, x, y, time);
            else if (t === ".") this.drawGrass(ctx, x, y, time);
          }
        }
      }
      visibleTiles.forEach((tile) => {
        if (tile.t === "V") this.drawVault(ctx, tile.x, tile.y, time);
        if (tile.t === "C") this.drawCity(ctx, tile.x, tile.y, time);
        if (tile.t === "G") this.drawGhostTown(ctx, tile.x, tile.y, time);
        if (tile.t === "S") this.drawMarket(ctx, tile.x, tile.y, time);
        if (tile.t === "H") this.drawCave(ctx, tile.x, tile.y, time);
        if (tile.t === "A") this.drawMilitary(ctx, tile.x, tile.y, time);
        if (tile.t === "R") this.drawRaider(ctx, tile.x, tile.y, time);
        if (["X", "?"].includes(tile.t)) this.drawTile(ctx, tile.x, tile.y, tile.t);
      });
      visibleTiles.forEach((tile) => {
        if (tile.t === "M") this.drawMonster(ctx, tile.x, tile.y, time);
        if (tile.t === "W") this.drawWanderer(ctx, tile.x, tile.y, time);
      });
      this.drawRadClouds(ctx, time);
      this.drawPlayer(ctx);
      this.drawOtherPlayers(ctx);
      this.updateParticles();
      this.drawParticles(ctx);
      visibleTiles.forEach((tile) => {
        const opacity = Math.max(0, (tile.dist - 4) / (10 - 4));
        if (opacity > 0) {
          ctx.fillStyle = `rgba(0,0,0,${opacity})`;
          ctx.fillRect(tile.x * this.TILE, tile.y * this.TILE, this.TILE, this.TILE);
        }
      });
      if (!this.weatherParticles) this.weatherParticles = [];
      let wType = "ash";
      const zn = this.state.zone || "";
      if (zn.includes("Glühende")) wType = "radstorm";
      else if (zn.includes("Sümpfe")) wType = "rain";
      const spawnRate = wType === "radstorm" ? 3 : wType === "rain" ? 4 : 1;
      for (let i = 0; i < spawnRate; i++) {
        if (Math.random() < 0.6) {
          this.weatherParticles.push({
            x: this.camera.x + Math.random() * viewW,
            y: this.camera.y - 20,
            vx: wType === "radstorm" ? Math.random() * 4 + 4 : Math.random() - 0.5,
            vy: wType === "rain" ? Math.random() * 5 + 10 : wType === "radstorm" ? Math.random() * 2 + 1 : Math.random() * 1.5 + 0.5,
            size: wType === "rain" ? 1.5 : wType === "radstorm" ? 2.5 : 1.5,
            life: 1,
            type: wType
          });
        }
      }
      for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
        let p = this.weatherParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.type === "ash") {
          p.x += Math.sin(time / 1e3 + p.y / 100) * 0.5;
          ctx.fillStyle = `rgba(200, 200, 200, ${p.life * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === "radstorm") {
          ctx.fillStyle = `rgba(57, 255, 20, ${p.life * 0.8})`;
          ctx.fillRect(p.x, p.y, p.size * 3, p.size / 2);
        } else if (p.type === "rain") {
          ctx.fillStyle = `rgba(100, 200, 255, ${p.life * 0.6})`;
          ctx.fillRect(p.x, p.y, 1, p.size * 5);
        }
        if (p.y > this.camera.y + viewH || p.x > this.camera.x + viewW || p.x < this.camera.x) {
          this.weatherParticles.splice(i, 1);
        }
      }
      ctx.restore();
      if (wType === "radstorm") {
        const radPulse = (Math.sin(time / 500) + 1) / 2;
        ctx.fillStyle = `rgba(20, 80, 0, ${0.1 + radPulse * 0.15})`;
        ctx.fillRect(0, 0, viewW, viewH);
      }
      const cycleLength = 10 * 60 * 1e3;
      const timePhase = (time + 6e4) % cycleLength / cycleLength;
      let darkness = 0;
      if (timePhase < 0.25 || timePhase > 0.75) darkness = 0.85;
      else if (timePhase < 0.35) darkness = 0.85 - (timePhase - 0.25) / 0.1 * 0.85;
      else if (timePhase > 0.65) darkness = (timePhase - 0.65) / 0.1 * 0.85;
      if (darkness > 0) {
        ctx.save();
        const screenPx = this.state.player.x * this.TILE + this.TILE / 2 - this.camera.x;
        const screenPy = this.state.player.y * this.TILE + this.TILE / 2 - this.camera.y;
        const ambientGrad = ctx.createRadialGradient(screenPx, screenPy, 30, screenPx, screenPy, 250);
        ambientGrad.addColorStop(0, `rgba(0,0,0,${Math.max(0, darkness - 0.5)})`);
        ambientGrad.addColorStop(1, `rgba(0,0,0,${darkness})`);
        ctx.fillStyle = ambientGrad;
        ctx.fillRect(0, 0, viewW, viewH);
        ctx.translate(screenPx, screenPy);
        const pRot = this.state.player.rot || 0;
        ctx.rotate(pRot);
        const beamGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 300);
        beamGrad.addColorStop(0, `rgba(255, 255, 200, ${darkness * 0.6})`);
        beamGrad.addColorStop(1, "rgba(255, 255, 200, 0)");
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 300, -Math.PI / 2 - Math.PI / 5, -Math.PI / 2 + Math.PI / 5);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = "rgba(0, 255, 0, 0.02)";
      for (let i = 0; i < viewH; i += 4) {
        ctx.fillRect(0, i, viewW, 1);
      }
      const totalMinutes = Math.floor(timePhase * 24 * 60);
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
      const mins = (totalMinutes % 60).toString().padStart(2, "0");
      ctx.fillStyle = "#39ff14";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`LOKALE ZEIT: ${hours}:${mins}`, viewW - 15, 25);
      if (this.state && this.state.trackedQuestId && this.state.view === "map" && !this.state.inDialog) {
        const qId = this.state.trackedQuestId;
        let qData = null;
        if (Array.isArray(this.state.activeQuests)) qData = this.state.activeQuests.find((q) => q.id === qId);
        else if (this.state.activeQuests) qData = this.state.activeQuests[qId];
        let def = null;
        if (this.questDefs) {
          if (Array.isArray(this.questDefs)) def = this.questDefs.find((d) => d.id === qId);
          else def = this.questDefs[qId];
        }
        if (qData || def) {
          let title = def ? def.title : "Unbekannt";
          let prog = "";
          if (def && def.type === "collect_multi") {
            let td = 0;
            let tr = def.reqItems ? Object.keys(def.reqItems).length : 1;
            if (def.reqItems) Object.entries(def.reqItems).forEach(([id, amt]) => {
              const inInv = this.state.inventory.filter((i) => i.id === id).reduce((s, i) => s + i.count, 0);
              if (inInv >= amt) td++;
            });
            prog = `[${td}/${tr}]`;
          } else {
            prog = `[${qData ? qData.progress || 0 : 0}/${qData ? qData.max || 1 : 1}]`;
          }
          const txt = `📌 MISSION: ${title.toUpperCase()} ${prog}`;
          ctx.font = "bold 13px monospace";
          const tw = ctx.measureText(txt).width;
          const bx = 15;
          const by = 80;
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillRect(bx, by, tw + 30, 26);
          ctx.strokeStyle = "#facc15";
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by, tw + 30, 26);
          ctx.fillStyle = "#facc15";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(txt, bx + 15, by + 14);
        }
      }
    },
    // ALTER KEGEL ENTFERNT - Nur noch das Sprite wird gezeichnet
    drawPlayer: function(ctx) {
      const px = this.state.player.x * this.TILE + this.TILE / 2;
      const py = this.state.player.y * this.TILE + this.TILE / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.state.player.rot - Math.PI / 2);
      ctx.fillStyle = "#39ff14";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#39ff14";
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, 7);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-6, -7);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    },
    drawOtherPlayers: function(ctx) {
      if (typeof Network === "undefined" || !Network.otherPlayers) return;
      for (let pid in Network.otherPlayers) {
        const p = Network.otherPlayers[pid];
        if (p.sector && (p.sector.x !== this.state.sector.x || p.sector.y !== this.state.sector.y)) continue;
        const ox = p.x * this.TILE + this.TILE / 2;
        const oy = p.y * this.TILE + this.TILE / 2;
        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    drawMonster: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      const sc = 1 + Math.sin(time / 200) * 0.1;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(sc, sc);
      ctx.fillStyle = "#d32f2f";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ff5252";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const a = i / 8 * Math.PI * 2;
        ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
        ctx.stroke();
      }
      ctx.fillStyle = "#ffeb3b";
      ctx.fillRect(-4, -2, 3, 3);
      ctx.fillRect(2, -2, 3, 3);
      ctx.restore();
    },
    drawWanderer: function(ctx, x, y, time) {
      const ts = this.TILE;
      const px = x * ts + ts / 2;
      const py = y * ts + ts / 2;
      const b = Math.abs(Math.sin(time / 300)) * 3;
      ctx.save();
      ctx.translate(px, py - b);
      ctx.fillStyle = "#4fc3f7";
      ctx.beginPath();
      ctx.arc(0, -6, 5, Math.PI, 0);
      ctx.lineTo(6, 10);
      ctx.lineTo(-6, 10);
      ctx.fill();
      ctx.fillStyle = "#8d6e63";
      ctx.fillRect(-4, 0, 8, 6);
      ctx.restore();
    },
    drawTile: function(ctx, x, y, type) {
      const ts = this.TILE;
      const cx = x * ts + ts / 2;
      const cy = y * ts + ts / 2;
      const dI = (c, cl, s = 20) => {
        ctx.font = `bold ${s}px monospace`;
        ctx.fillStyle = cl;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = cl;
        ctx.shadowBlur = 5;
        ctx.fillText(c, cx, cy);
        ctx.shadowBlur = 0;
      };
      switch (type) {
        case "R":
          dI("💰", "#ff3333", 22);
          break;
        case "X":
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(cx - 8, cy - 6, 16, 12);
          ctx.strokeStyle = "#ffd700";
          ctx.strokeRect(cx - 8, cy - 6, 16, 12);
          break;
        case "S":
          dI("🏪", "#00ff00", 22);
          break;
        case "H":
          dI("⛰️", "#888", 22);
          break;
        case "E":
          dI("EXIT", "#00ffff", 10);
          break;
        case "P":
          dI("✚", "#ff0000", 18);
          break;
        case "?":
          dI("?", "#ff00ff", 20);
          break;
      }
    }
  });

  // src/game/game_world_gen.js
  var WorldGen2 = window.WorldGen = {
    _seed: 12345,
    locations: { vault: { x: 4, y: 4 }, city: { x: 7, y: 7 }, ghostTown: { x: 2, y: 8 } },
    sectorRoads: {},
    setSeed: function(val) {
      this._seed = val % 2147483647;
      if (this._seed <= 0) this._seed += 2147483646;
      this.calculateLocations();
    },
    rand: function() {
      this._seed = this._seed * 16807 % 2147483647;
      return (this._seed - 1) / 2147483646;
    },
    calculateLocations: function() {
      let tempSeed = this._seed;
      const pseudoRand = () => {
        tempSeed = tempSeed * 16807 % 2147483647;
        return (tempSeed - 1) / 2147483646;
      };
      this.locations.vault = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
      do {
        this.locations.city = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
      } while (this.locations.city.x === this.locations.vault.x && this.locations.city.y === this.locations.vault.y);
      do {
        this.locations.ghostTown = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
      } while (this.locations.ghostTown.x === this.locations.vault.x && this.locations.ghostTown.y === this.locations.vault.y || this.locations.ghostTown.x === this.locations.city.x && this.locations.ghostTown.y === this.locations.city.y);
      this.sectorRoads = {};
      this.generateGlobalPath(this.locations.vault, this.locations.city, pseudoRand);
      this.generateGlobalPath(this.locations.city, this.locations.ghostTown, pseudoRand);
      for (let i = 0; i < 1; i++) {
        const start = { x: Math.floor(pseudoRand() * 10), y: Math.floor(pseudoRand() * 10) };
        const end = { x: Math.floor(pseudoRand() * 10), y: Math.floor(pseudoRand() * 10) };
        this.generateGlobalPath(start, end, pseudoRand);
      }
    },
    generateGlobalPath: function(start, end, rng) {
      let curr = { x: start.x, y: start.y };
      const target = { x: end.x, y: end.y };
      let steps = 0;
      while ((curr.x !== target.x || curr.y !== target.y) && steps < 30) {
        let next = { x: curr.x, y: curr.y };
        if (curr.x !== target.x && (curr.y === target.y || rng() > 0.5)) {
          next.x += target.x > curr.x ? 1 : -1;
        } else {
          next.y += target.y > curr.y ? 1 : -1;
        }
        this.addRoadSegment(curr, next);
        curr = next;
        steps++;
      }
    },
    addRoadSegment: function(s1, s2) {
      let dirFromS1 = "";
      if (s2.y < s1.y) dirFromS1 = "N";
      if (s2.y > s1.y) dirFromS1 = "S";
      if (s2.x > s1.x) dirFromS1 = "E";
      if (s2.x < s1.x) dirFromS1 = "W";
      const s1Key = `${s1.x},${s1.y}`;
      const s2Key = `${s2.x},${s2.y}`;
      if (!this.sectorRoads[s1Key]) this.sectorRoads[s1Key] = [];
      if (!this.sectorRoads[s1Key].includes(dirFromS1)) this.sectorRoads[s1Key].push(dirFromS1);
      let dirFromS2 = "";
      if (dirFromS1 === "N") dirFromS2 = "S";
      if (dirFromS1 === "S") dirFromS2 = "N";
      if (dirFromS1 === "E") dirFromS2 = "W";
      if (dirFromS1 === "W") dirFromS2 = "E";
      if (!this.sectorRoads[s2Key]) this.sectorRoads[s2Key] = [];
      if (!this.sectorRoads[s2Key].includes(dirFromS2)) this.sectorRoads[s2Key].push(dirFromS2);
    },
    getStartSector: function() {
      return this.locations.vault;
    },
    noise: function(nx, ny) {
      const val = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
      return val - Math.floor(val);
    },
    smoothNoise: function(x, y, seed) {
      const corners = (this.noise(x - 1 + seed, y - 1 + seed) + this.noise(x + 1 + seed, y - 1 + seed) + this.noise(x - 1 + seed, y + 1 + seed) + this.noise(x + 1 + seed, y + 1 + seed)) / 16;
      const sides = (this.noise(x - 1 + seed, y + seed) + this.noise(x + 1 + seed, y + seed) + this.noise(x + seed, y - 1 + seed) + this.noise(x + seed, y + 1 + seed)) / 8;
      const center = this.noise(x + seed, y + seed) / 4;
      return Math.abs(corners + sides + center);
    },
    isGlobalRiver: function(gx, gy) {
      const riverWidth = 2.5;
      let r1 = 100 + Math.sin(gy * 0.02) * 40;
      if (Math.abs(gx - r1) < riverWidth) return true;
      let r2 = 380 + Math.sin(gy * 0.03 + 2) * 30;
      if (Math.abs(gx - r2) < riverWidth) return true;
      let r3 = 400 + Math.cos(gx * 0.015) * 50;
      if (Math.abs(gy - r3) < riverWidth + 1) return true;
      let r4 = gx + Math.sin(gx * 0.02) * 40;
      if (Math.abs(gy - r4) < riverWidth) return true;
      return false;
    },
    getSectorBiome: function(sx, sy) {
      const gx = sx * 50 + 25;
      const gy = sy * 50 + 25;
      const moisture = this.smoothNoise(gx * 3e-3, gy * 3e-3, this._seed + 200);
      const heat = this.smoothNoise(gx * 3e-3 + 100, gy * 3e-3 + 100, 888);
      const urban = this.smoothNoise(gx * 4e-3 + 300, gy * 4e-3 + 300, this._seed + 300);
      if (urban > 0.78 && heat < 0.7) return "city";
      if (moisture > 0.6 && heat < 0.5) return "forest";
      if (moisture > 0.65 && heat > 0.62) return "jungle";
      if (moisture > 0.65 && heat > 0.5) return "swamp";
      if (heat > 0.7 && moisture < 0.4) return "desert";
      if (this.smoothNoise(gx * 5e-3, gy * 5e-3, this._seed + 100) > 0.75) return "mountain";
      return "wasteland";
    },
    createSector: function(width, height, sx, sy) {
      let map = Array(height).fill().map(() => Array(width).fill("."));
      const worldSeed = this._seed;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let gx = sx * width + x;
          let gy = sy * height + y;
          let moisture = this.smoothNoise(gx * 3e-3, gy * 3e-3, worldSeed + 200);
          let heat = this.smoothNoise(gx * 3e-3 + 500, gy * 3e-3 + 500, worldSeed + 500);
          let elevation = this.smoothNoise(gx * 6e-3, gy * 6e-3, worldSeed + 100);
          let isRiver = this.isGlobalRiver(gx, gy);
          let ground = ".";
          let treeThresh = 0.15;
          if (heat > 0.7 && moisture < 0.4) {
            ground = "_";
            treeThresh = 0.02;
          } else if (moisture > 0.65 && heat > 0.5) {
            ground = ";";
            treeThresh = 0.35;
          } else if (moisture > 0.6 && heat < 0.5) {
            ground = '"';
            treeThresh = 0.55;
          }
          if (ground === "." || ground === "_") {
            if (this.rand() > 0.92) ground = ",";
          }
          let detail = this.smoothNoise(gx * 0.15, gy * 0.15, worldSeed + 300);
          map[y][x] = ground;
          if (isRiver) map[y][x] = "~";
          else if (elevation > 0.94) map[y][x] = "Y";
          else if (elevation > 0.85) map[y][x] = "^";
          else if (detail < treeThresh) map[y][x] = "t";
          if (x < 2 || x > width - 3 || y < 2 || y > height - 3) {
            if (["^", "Y", "t", "#"].includes(map[y][x])) map[y][x] = ground;
          }
        }
      }
      for (let y = 3; y < height - 3; y += 5) {
        for (let x = 3; x < width - 3; x += 5) {
          let gx = sx * width + x;
          let gy = sy * height + y;
          let ruinVal = this.smoothNoise(gx * 0.04, gy * 0.04, worldSeed + 800);
          if (ruinVal > 0.82) this.placeHouseRuin(map, x, y);
        }
      }
      if (sx === this.locations.vault.x && sy === this.locations.vault.y) {
        this.placePOI(map, 25, 21, "V", 4);
        for (let py = 22; py <= 25; py++) map[py][25] = "=";
      }
      if (sx === this.locations.city.x && sy === this.locations.city.y) {
        this.placePOI(map, 25, 21, "C", 6);
        for (let py = 22; py <= 25; py++) map[py][25] = "=";
        for (let i = 0; i < 15; i++) {
          let rx = 15 + Math.floor(this.rand() * 20);
          let ry = 15 + Math.floor(this.rand() * 20);
          if (map[ry][rx] === ".") this.placeHouseRuin(map, rx, ry);
        }
      }
      if (sx === this.locations.ghostTown.x && sy === this.locations.ghostTown.y) {
        this.placeGhostTown(map, width, height);
      }
      let sectorRNG = (sx * 17 + sy * 23 + this._seed) % 100;
      if (map[21][25] !== "V" && map[21][25] !== "C" && map[21][25] !== "G" && sectorRNG < 15) {
        let type = "S";
        if (sectorRNG < 5) type = "H";
        else if (sectorRNG < 8) type = "A";
        else if (sectorRNG < 12) type = "R";
        let dx = 10 + sectorRNG * 3 % 30;
        let dy = 10 + sectorRNG * 7 % 30;
        this.placePOI(map, dx, dy, type, 3);
        this.buildRoad(map, this.getRandomEdgePoint(width, height), { x: dx, y: dy });
      }
      const connections = this.sectorRoads[`${sx},${sy}`] || [];
      let gates = [];
      connections.forEach((dir) => {
        let seed = 0;
        let gate = { x: 25, y: 25 };
        if (dir === "N") {
          seed = sx * 1e3 + sy;
          gate = { x: Math.floor(this.seededRand(seed) * (width - 4)) + 2, y: 0 };
        }
        if (dir === "S") {
          seed = sx * 1e3 + (sy + 1);
          gate = { x: Math.floor(this.seededRand(seed) * (width - 4)) + 2, y: height - 1 };
        }
        if (dir === "W") {
          seed = sx * 1e3 + sy + 5e3;
          gate = { x: 0, y: Math.floor(this.seededRand(seed) * (height - 4)) + 2 };
        }
        if (dir === "E") {
          seed = (sx + 1) * 1e3 + sy + 5e3;
          gate = { x: width - 1, y: Math.floor(this.seededRand(seed) * (height - 4)) + 2 };
        }
        gates.push(gate);
      });
      if (gates.length > 0) {
        let center = { x: 25, y: 25 };
        gates.forEach((g) => this.buildRoad(map, g, center));
      }
      return map;
    },
    placeHouseRuin: function(map, x, y) {
      const w = 3 + Math.floor(this.rand() * 2);
      const h = 3 + Math.floor(this.rand() * 2);
      if (x + w >= map[0].length || y + h >= map.length) return;
      for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
        if (["~", "^", "Y", "V", "C", "G"].includes(map[y + dy][x + dx])) return;
      }
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          if (dy === 0 || dy === h - 1 || dx === 0 || dx === w - 1) {
            if (this.rand() > 0.2) map[y + dy][x + dx] = "#";
          } else {
            map[y + dy][x + dx] = ".";
          }
        }
      }
      if (this.rand() < 0.3) map[y + Math.floor(h / 2)][x + Math.floor(w / 2)] = "X";
    },
    placeGhostTown: function(map, w, h) {
      this.clearArea(map, 25, 25, 18);
      for (let i = 10; i < 40; i++) {
        map[25][i] = "=";
        map[i][25] = "=";
      }
      const blocks = [{ x: 12, y: 12 }, { x: 30, y: 12 }, { x: 12, y: 30 }, { x: 30, y: 30 }];
      blocks.forEach((b) => {
        this.placeHouseRuin(map, b.x, b.y);
        if (this.rand() < 0.7) this.placeHouseRuin(map, b.x + 5, b.y);
        if (this.rand() < 0.7) this.placeHouseRuin(map, b.x, b.y + 5);
      });
      map[21][25] = "G";
    },
    seededRand: function(seed) {
      let t = seed % 2147483647;
      if (t <= 0) t += 2147483646;
      t = t * 16807 % 2147483647;
      return (t - 1) / 2147483646;
    },
    placePOI: function(map, cx, cy, type, radius) {
      const h = map.length;
      const w = map[0].length;
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        const ny = cy + dy, nx = cx + dx;
        if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
          const t = map[ny][nx];
          if (["^", "Y", "t", "~", "#"].includes(t)) map[ny][nx] = ".";
        }
      }
      map[cy][cx] = type;
    },
    getRandomEdgePoint: function(w, h) {
      const side = Math.floor(this.rand() * 4);
      if (side === 0) return { x: Math.floor(this.rand() * (w - 4)) + 2, y: 0 };
      if (side === 1) return { x: Math.floor(this.rand() * (w - 4)) + 2, y: h - 1 };
      if (side === 2) return { x: 0, y: Math.floor(this.rand() * (h - 4)) + 2 };
      return { x: w - 1, y: Math.floor(this.rand() * (h - 4)) + 2 };
    },
    buildRoad: function(map, start, end) {
      let x = start.x, y = start.y;
      let steps = 0;
      const isWater = (tx, ty) => {
        if (tx < 0 || tx >= map[0].length || ty < 0 || ty >= map.length) return false;
        return map[ty][tx] === "~" || map[ty][tx] === "+";
      };
      while ((x !== end.x || y !== end.y) && steps < 200) {
        steps++;
        let dx = end.x - x;
        let dy = end.y - y;
        let moveX = Math.abs(dx) > Math.abs(dy);
        let nextX = x + (moveX ? dx > 0 ? 1 : -1 : 0);
        let nextY = y + (!moveX ? dy > 0 ? 1 : -1 : 0);
        if (isWater(nextX, nextY)) {
          let altX = x + (!moveX ? dx > 0 ? 1 : -1 : 0);
          let altY = y + (moveX ? dy > 0 ? 1 : -1 : 0);
          if (!isWater(altX, altY) && (moveX ? dy !== 0 : dx !== 0)) {
            moveX = !moveX;
          }
        }
        if (moveX) x += dx > 0 ? 1 : -1;
        else y += dy > 0 ? 1 : -1;
        if (x < 0 || x >= map[0].length || y < 0 || y >= map.length) continue;
        const setRoad = (tx, ty) => {
          if (tx < 0 || tx >= map[0].length || ty < 0 || ty >= map.length) return;
          const t = map[ty][tx];
          if (t === "~" || t === "+") map[ty][tx] = "+";
          else {
            if (["^", "Y", "t", "#"].includes(t)) map[ty][tx] = "=";
            else map[ty][tx] = "=";
            this.clearArea(map, tx, ty, 1);
          }
        };
        setRoad(x, y);
        if (x + 1 < map[0].length && map[y][x + 1] !== "~") setRoad(x + 1, y);
      }
    },
    clearArea: function(map, cx, cy, radius) {
      const h = map.length;
      const w = map[0].length;
      for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
        const ny = cy + dy, nx = cx + dx;
        if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
          if (["^", "Y", "t", "#"].includes(map[ny][nx])) map[ny][nx] = ".";
        }
      }
    },
    generateCityLayout: function(w, h) {
      return this._genBox(w, h, "=");
    },
    generateDungeonLayout: function(w, h) {
      return this._genBox(w, h, "#");
    },
    _genBox: function(w, h, fill) {
      let map = Array(h).fill().map(() => Array(w).fill("."));
      for (let y = 0; y < h; y++) {
        map[y][0] = fill;
        map[y][w - 1] = fill;
      }
      for (let x = 0; x < w; x++) {
        map[0][x] = fill;
        map[h - 1][x] = fill;
      }
      map[h - 1][Math.floor(w / 2)] = "E";
      if (fill === "#") map[Math.floor(h / 2)][Math.floor(w / 2)] = "X";
      return { map, startX: Math.floor(w / 2), startY: h - 2 };
    }
  };

  // src/game/game_inv_logic.js
  Object.assign(Game, {
    getMaxSlots: function() {
      let base = 10;
      if (this.state.stats) base += this.state.stats.STR || 1;
      const strongBack = this.getPerkLevel("strong_back");
      if (strongBack > 0) base += strongBack * 5;
      if (this.state.equip && this.state.equip.back) {
        const pack = this.state.equip.back;
        let packBonus = 0;
        if (pack.bonus && pack.bonus.slots) packBonus = pack.bonus.slots;
        else if (pack.props && pack.props.bonus && pack.props.bonus.slots) packBonus = pack.props.bonus.slots;
        else if (this.items[pack.id] && this.items[pack.id].bonus && this.items[pack.id].bonus.slots) {
          packBonus = this.items[pack.id].bonus.slots;
        }
        base += packBonus;
      }
      return base;
    },
    // [MODIFIED] addToInventory supports custom full item objects (for Legendaries)
    addToInventory: function(idOrItem, count = 1, customData = null) {
      if (!this.state.inventory) this.state.inventory = [];
      let itemId, props = null, fullItemObj = null;
      if (typeof idOrItem === "object") {
        itemId = idOrItem.id;
        props = idOrItem.props;
        count = idOrItem.count || count || 1;
        fullItemObj = idOrItem;
      } else {
        itemId = idOrItem;
        if (customData) fullItemObj = customData;
      }
      if (itemId === "camp_kit") {
        const hasCamp = this.state.inventory.some((i) => i.id === "camp_kit");
        if (hasCamp) return false;
      }
      const limit = this.getStackLimit(itemId);
      let remaining = count;
      let added = false;
      let isActuallyNew = false;
      if (!props && (!fullItemObj || !fullItemObj.uid)) {
        for (let item of this.state.inventory) {
          if (item.id === itemId && !item.props && !item.uid && item.count < limit) {
            const space = limit - item.count;
            const take = Math.min(space, remaining);
            item.count += take;
            remaining -= take;
            added = true;
            if (remaining <= 0) break;
          }
        }
      }
      if (remaining > 0) {
        const maxSlots = this.getMaxSlots();
        while (remaining > 0) {
          if (this.getUsedSlots() >= maxSlots) {
            UI.log("INVENTAR VOLL!", "text-red-500 font-bold blink-red");
            if (added && itemId === "ammo") this.syncAmmo();
            return false;
          }
          const take = Math.min(limit, remaining);
          let newItem;
          if (fullItemObj && (fullItemObj.uid || fullItemObj.isLegendary)) {
            newItem = JSON.parse(JSON.stringify(fullItemObj));
            newItem.count = take;
            newItem.isNew = true;
            if (!newItem.id) newItem.id = itemId;
          } else {
            newItem = { id: itemId, count: take, isNew: true };
            if (props) newItem.props = props;
          }
          this.state.inventory.push(newItem);
          remaining -= take;
          added = true;
          isActuallyNew = true;
        }
      }
      if (added) {
        const itemDef = this.items[itemId];
        let name = fullItemObj && fullItemObj.name ? fullItemObj.name : props && props.name ? props.name : itemDef ? itemDef.name : itemId;
        const color = props && props.color ? props.color.split(" ")[0] : "text-green-400";
        if (itemId !== "ammo" || count < 10) {
          UI.log(`+ ${name} (${count})`, color);
        } else {
          UI.log(`+ ${count} Munition`, "text-green-400");
        }
        if (itemId === "ammo") this.syncAmmo();
        if (typeof Game.updateQuestProgress === "function") {
          Game.updateQuestProgress("collect", itemId, count);
        }
        if (isActuallyNew && typeof UI !== "undefined" && UI.triggerInventoryAlert) {
          UI.triggerInventoryAlert();
        }
        this.updateWeight();
        return true;
      }
      return false;
    },
    removeFromInventory: function(itemId, amount = 1) {
      if (!this.state) return false;
      let remaining = amount;
      for (let i = 0; i < this.state.inventory.length; i++) {
        const item = this.state.inventory[i];
        if (item.id === itemId) {
          const take = Math.min(item.count, remaining);
          item.count -= take;
          remaining -= take;
          if (item.count <= 0) {
            this.state.inventory.splice(i, 1);
            i--;
          }
          if (remaining <= 0) break;
        }
      }
      if (itemId === "ammo") this.syncAmmo();
      this.updateWeight();
      return remaining === 0;
    },
    destroyItem: function(invIndex) {
      if (!this.state.inventory || !this.state.inventory[invIndex]) return;
      const item = this.state.inventory[invIndex];
      if (item.id === "fists" || item.id === "vault_suit" || item.id === "camp_kit") {
        UI.log("Das ist ein permanenter Gegenstand.", "text-gray-500");
        return;
      }
      const def = this.items[item.id];
      let name = item.props && item.props.name ? item.props.name : item.name || def.name;
      this.state.inventory.splice(invIndex, 1);
      if (item.id === "ammo") this.syncAmmo();
      UI.log(`${name} weggeworfen.`, "text-red-500 italic");
      this.updateWeight();
      UI.update();
      if (this.state.view === "inventory") UI.renderInventory();
      this.saveGame();
    },
    scrapItem: function(invIndex) {
      if (!this.state.inventory || !this.state.inventory[invIndex]) return;
      const item = this.state.inventory[invIndex];
      if (item.id === "fists" || item.id === "vault_suit" || item.id === "camp_kit") {
        UI.log("Dieses Objekt kann nicht zerlegt werden!", "text-red-500");
        return;
      }
      if (this.state.view !== "crafting") {
        UI.log("Zerlegen nur an einer Werkbank möglich!", "text-red-500");
        return;
      }
      if (item.id === "junk_metal") {
        UI.log("Das ist bereits Schrott.", "text-orange-500");
        return;
      }
      const def = this.items[item.id];
      if (!def) return;
      let name = item.props && item.props.name ? item.props.name : item.name || def.name;
      let value = def.cost || 5;
      if (item.isLegendary) value *= 2;
      this.state.inventory.splice(invIndex, 1);
      let scrapAmount = Math.max(1, Math.floor(value / 10));
      const perkLvl = this.getPerkLevel("scrapper");
      if (perkLvl > 0) {
        scrapAmount += perkLvl;
      }
      this.addToInventory("junk_metal", scrapAmount);
      let msg = `Zerlegt: ${name} -> ${scrapAmount}x Schrott`;
      let screwChance = 0.3 + perkLvl * 0.15;
      const isComplex = def.type === "weapon" || def.type === "junk" || def.type === "tool";
      if (isComplex && Math.random() < screwChance) {
        let screws = Math.max(1, Math.floor(value / 50));
        if (perkLvl >= 2 && Math.random() < 0.4) screws *= 2;
        this.addToInventory("screws", screws);
        msg += `, ${screws}x Schrauben`;
      }
      let plasticChance = 0.2 + perkLvl * 0.15;
      if (value >= 100 && Math.random() < plasticChance) {
        let plastic = 1;
        if (perkLvl >= 3) plastic += 1;
        this.addToInventory("plastic", plastic);
        msg += `, ${plastic}x Plastik`;
      }
      UI.log(msg, "text-orange-400 font-bold");
      this.updateWeight();
      UI.update();
      if (typeof UI.renderCrafting === "function") UI.renderCrafting("scrap");
      this.saveGame();
    },
    craftItem: function(recipeId) {
      const recipe = this.recipes.find((r) => r.id === recipeId);
      if (!recipe) return;
      if (this.state.lvl < recipe.lvl) {
        UI.log(`Benötigt Level ${recipe.lvl}!`, "text-red-500");
        return;
      }
      for (let reqId in recipe.req) {
        const countNeeded = recipe.req[reqId];
        const invItem = this.state.inventory.find((i) => i.id === reqId);
        if (!invItem || invItem.count < countNeeded) {
          UI.log(`Material fehlt: ${this.items[reqId].name}`, "text-red-500");
          return;
        }
      }
      for (let reqId in recipe.req) {
        const countNeeded = recipe.req[reqId];
        const invItem = this.state.inventory.find((i) => i.id === reqId);
        invItem.count -= countNeeded;
        if (invItem.count <= 0) this.state.inventory = this.state.inventory.filter((i) => i.id !== reqId);
      }
      if (recipe.out === "AMMO") {
        this.addToInventory("ammo", recipe.count);
      } else {
        this.addToInventory(recipe.out, recipe.count);
      }
      UI.log(`Hergestellt: ${recipe.count}x ${recipe.out === "AMMO" ? "Munition" : this.items[recipe.out].name}`, "text-green-400 font-bold");
      if (typeof Game.updateQuestProgress === "function" && recipe.out !== "AMMO") {
        Game.updateQuestProgress("collect", recipe.out, recipe.count);
      }
      this.updateWeight();
      if (recipe.type === "cooking") {
        if (typeof UI.renderCampCooking === "function") UI.renderCampCooking();
      } else {
        if (typeof UI !== "undefined") UI.renderCrafting();
      }
    },
    unequipItem: function(slot) {
      if (!this.state.equip[slot]) return;
      const item = this.state.equip[slot];
      if (item.id === "fists" || item.id === "vault_suit" || item.name === "Fäuste" || item.name === "Vault-Anzug") {
        UI.log("Das gehört zu deiner Grundausstattung.", "text-gray-500");
        return;
      }
      if (this.getUsedSlots() >= this.getMaxSlots()) {
        UI.log("Inventar voll! Ablegen nicht möglich.", "text-red-500");
        return;
      }
      let itemToAdd = item._fromInv || item.id;
      if (item.uid || item.isLegendary) {
        const { _fromInv, ...rest } = item;
        itemToAdd = rest;
        itemToAdd.count = 1;
      } else {
        if (!itemToAdd && item.id) itemToAdd = item.id;
        let objToAdd = itemToAdd;
        if (!item._fromInv && item.props) objToAdd = { id: item.id, count: 1, props: item.props };
        else if (typeof itemToAdd === "string") objToAdd = { id: itemToAdd, count: 1 };
        itemToAdd = objToAdd;
      }
      this.state.inventory.push(itemToAdd);
      if (slot === "weapon") {
        const fists = this.items["fists"] ? { ...this.items["fists"] } : { id: "fists", name: "Fäuste", baseDmg: 2, type: "weapon" };
        this.state.equip.weapon = fists;
        UI.log(`${item.name || "Waffe"} abgelegt. Du nutzt nun deine Fäuste.`, "text-yellow-400");
      } else if (slot === "body") {
        const suit = this.items["vault_suit"] ? { ...this.items["vault_suit"] } : { id: "vault_suit", name: "Vault-Anzug", def: 1, type: "body" };
        this.state.equip.body = suit;
        UI.log(`${item.name || "Rüstung"} abgelegt. Du trägst wieder deinen Vault-Anzug.`, "text-blue-400");
      } else {
        this.state.equip[slot] = null;
        UI.log(`${item.name || "Item"} abgelegt.`, "text-yellow-400");
      }
      this.recalcStats();
      this.updateWeight();
      if (typeof UI !== "undefined") {
        if (this.state.view === "char" && typeof UI.renderStats === "function") UI.renderStats(Game.state.charTab || "stats");
        if (this.state.view === "inventory") UI.renderInventory();
      }
      this.saveGame();
    },
    useItem: function(invIndexOrId, mode = 1) {
      let invItem, index;
      if (typeof invIndexOrId === "string") {
        index = this.state.inventory.findIndex((i) => i.id === invIndexOrId);
      } else {
        index = invIndexOrId;
      }
      if (index === -1 || !this.state.inventory[index]) return;
      invItem = this.state.inventory[index];
      const itemDef = this.items[invItem.id];
      if (itemDef.type === "back") {
        const slot = "back";
        let oldEquip = this.state.equip[slot];
        this.state.inventory.splice(index, 1);
        if (oldEquip) {
          if (oldEquip.uid || oldEquip.isLegendary) {
            const { _fromInv, ...rest } = oldEquip;
            const oldItem = { ...rest, count: 1, isNew: true };
            this.state.inventory.push(oldItem);
          } else {
            const oldItem = { id: oldEquip.id, count: 1, props: oldEquip.props, isNew: true };
            this.state.inventory.push(oldItem);
          }
        }
        this.state.equip[slot] = { ...itemDef, ...invItem, count: 1 };
        UI.log(`Rucksack angelegt: ${invItem.name || itemDef.name}`, "text-yellow-400");
        if (this.getUsedSlots() > this.getMaxSlots()) UI.log("WARNUNG: Überladen!", "text-red-500 blink-red");
        this.updateWeight();
        UI.update();
        if (this.state.view === "inventory") UI.renderInventory();
        this.saveGame();
        return;
      }
      if (invItem.id === "camp_kit") {
        this.deployCamp(index);
        return;
      }
      if (itemDef.raw) {
        const healAmt = itemDef.raw.heal || 0;
        const radAmt = itemDef.raw.rad || 0;
        const effectiveMax = this.state.maxHp - (this.state.rads || 0);
        if (this.state.hp >= effectiveMax && radAmt > 0) {
          UI.log("Du bist satt - roh essen wuerde nur verstrahlen.", "text-gray-500");
          return;
        }
        this.state.hp = Math.min(effectiveMax, this.state.hp + healAmt);
        UI.log(`Roh gegessen: ${itemDef.name} (+${healAmt} HP, +${radAmt} RAD)`, "text-orange-300");
        this.removeFromInventory(invItem.id, 1);
        this.addRadiation(radAmt);
        this.updateWeight();
        UI.update();
        if (this.state.view === "inventory") UI.renderInventory();
        this.saveGame();
        return;
      }
      if (invItem.id === "nuka_cola") {
        const effectiveMax = this.state.maxHp - (this.state.rads || 0);
        this.state.hp = Math.min(this.state.hp + 15, effectiveMax);
        this.state.caps += 1;
        this.addRadiation(5);
        UI.log("Nuka Cola: Erfrischend... und strahlend.", "text-blue-400");
        this.removeFromInventory("nuka_cola", 1);
        UI.update();
        return;
      }
      if (invItem.id === "radaway") {
        this.addRadiation(-50);
        UI.log("RadAway verwendet. Strahlung sinkt.", "text-green-300 font-bold");
        this.removeFromInventory("radaway", 1);
        UI.update();
        return;
      }
      if (itemDef.type === "blueprint") {
        if (!this.state.knownRecipes.includes(itemDef.recipeId)) {
          this.state.knownRecipes.push(itemDef.recipeId);
          UI.log(`Gelernt: ${itemDef.name}`, "text-cyan-400 font-bold");
          invItem.count--;
          if (invItem.count <= 0) this.state.inventory.splice(index, 1);
        } else {
          UI.log("Du kennst diesen Bauplan bereits.", "text-gray-500");
        }
        return;
      } else if (itemDef.type === "consumable") {
        if (itemDef.effect === "heal" || itemDef.effect === "heal_rad" || itemDef.effect === "buff") {
          let healAmt = itemDef.val || 0;
          const medicLvl = this.getPerkLevel("medic");
          if (medicLvl > 0 && healAmt > 0) {
            const bonus = 1 + medicLvl * 0.2;
            healAmt = Math.floor(healAmt * bonus);
          }
          const effectiveMax = this.state.maxHp - (this.state.rads || 0);
          if (itemDef.effect === "heal" && this.state.hp >= effectiveMax) {
            UI.log("Gesundheit voll.", "text-gray-500");
            return;
          }
          let countToUse = 1;
          if (mode === "max" && healAmt > 0) {
            const missing = effectiveMax - this.state.hp;
            if (missing > 0) {
              countToUse = Math.ceil(missing / healAmt);
              if (countToUse > invItem.count) countToUse = invItem.count;
            } else {
              countToUse = 0;
            }
          }
          if (countToUse > 0) {
            const totalHeal = healAmt * countToUse;
            if (totalHeal > 0) this.state.hp = Math.min(effectiveMax, this.state.hp + totalHeal);
            if (itemDef.effect === "heal_rad" && itemDef.rad) {
              this.addRadiation(itemDef.rad * countToUse);
            }
            if (itemDef.effect === "buff") {
              this.applyBuff(itemDef);
            } else {
              UI.log(`Verwendet: ${countToUse}x ${itemDef.name} (+${totalHeal} HP)`, "text-blue-400");
            }
            this.removeFromInventory(invItem.id, countToUse);
          }
        }
      } else {
        const validSlots = ["weapon", "body", "head", "legs", "feet", "arms"];
        if (validSlots.includes(itemDef.type)) {
          const slot = itemDef.slot || itemDef.type;
          let oldEquip = this.state.equip[slot];
          if (oldEquip && oldEquip.id !== "fists" && oldEquip.id !== "vault_suit") {
            if (oldEquip._fromInv) this.state.inventory.push(oldEquip._fromInv);
            else {
              if (oldEquip.uid) {
                const { _fromInv, ...rest } = oldEquip;
                this.state.inventory.push({ ...rest, count: 1, isNew: true });
              } else {
                const oldKey = Object.keys(this.items).find((k) => this.items[k].name === oldEquip.name);
                if (oldKey) this.state.inventory.push({ id: oldKey, count: 1, isNew: true });
              }
            }
          }
          this.state.inventory.splice(index, 1);
          const equipObject = { ...itemDef, ...invItem, _fromInv: invItem, count: 1 };
          this.state.equip[slot] = equipObject;
          const displayName = invItem.name || itemDef.name;
          UI.log(`Ausgerüstet: ${displayName}`, "text-yellow-400");
          this.recalcStats();
          const effectiveMax = this.state.maxHp - (this.state.rads || 0);
          if (this.state.hp > effectiveMax) this.state.hp = effectiveMax;
        }
      }
      this.updateWeight();
      UI.update();
      if (this.state.view === "inventory") UI.renderInventory();
      this.saveGame();
    },
    switchToBestMelee: function() {
      const oldWeapon = this.state.equip.weapon;
      const oldName = oldWeapon && oldWeapon.name && oldWeapon.id !== "fists" ? oldWeapon.props?.name || oldWeapon.name : "Fernkampfwaffe";
      if (!this.state.inventory || this.state.inventory.length === 0) {
        const fists = this.items["fists"] ? { ...this.items["fists"] } : { id: "fists", name: "Fäuste", baseDmg: 2, type: "weapon" };
        this.state.equip.weapon = fists;
        UI.log("Waffe abgelegt. Nutze Fäuste.", "text-red-500 font-bold");
        if (typeof UI.update === "function") UI.update();
        return;
      }
      let bestWeapon = null;
      let bestDmg = -1;
      let bestIndex = -1;
      this.state.inventory.forEach((item, idx) => {
        const def = this.items[item.id];
        if (!def) return;
        const type = def.type ? def.type.toLowerCase() : "";
        const isWeaponType = type === "weapon" || type === "melee" || type === "weapon_melee" || type.includes("weapon");
        const needsAmmo = (item.ammoType || def.ammo) && (item.ammoType || def.ammo) !== "none";
        if (isWeaponType && !needsAmmo) {
          let dmg = def.baseDmg || def.dmg || item.dmg || 0;
          if (item.props && item.props.dmgMult) dmg *= item.props.dmgMult;
          if (dmg > bestDmg) {
            bestDmg = dmg;
            bestWeapon = item;
            bestIndex = idx;
          }
        }
      });
      if (bestWeapon) {
        this.useItem(bestIndex);
        const newName = bestWeapon.name || bestWeapon.props?.name || this.items[bestWeapon.id].name;
        UI.log(`${newName} wurde statt ${oldName} angelegt (Munition leer)`, "text-yellow-400 blink-red");
      } else {
        const fists = this.items["fists"] ? { ...this.items["fists"] } : { id: "fists", name: "Fäuste", baseDmg: 2, type: "weapon" };
        this.state.equip.weapon = fists;
        UI.log("Keine Nahkampfwaffe gefunden! Du kämpfst mit Fäusten!", "text-red-500");
      }
      if (typeof UI.update === "function") UI.update();
    },
    // Die Belohnung des Glücksspiels liegt in game_char_logic.js (dort mit
    // klaren Stufen und ohne Zufalls-Abbruch). Die frühere Fassung an dieser
    // Stelle war durch die Ladereihenfolge wirkungslos und ist entfernt.
    // Die wiederverwendbare Erzeugung legendärer Waffen steht unten in
    // createLegendaryItem() und wird von beiden Wegen genutzt.
    createLegendaryItem: function(baseId = null) {
      const bases = ["pipe_pistol", "hunting_rifle", "shotgun", "machete", "super_sledge"];
      if (!baseId) baseId = bases[Math.floor(Math.random() * bases.length)];
      const baseItem = this.items[baseId];
      if (!baseItem) return;
      const prefixes = [
        { name: "Brutale", dmgMod: 1.3, desc: "+30% Schaden" },
        { name: "Doppelschuss", dmgMod: 1.5, ammoMod: 2, desc: "Doppelter Schaden, doppelter Verbrauch" },
        { name: "Vampir", hpDrain: 5, desc: "Heilt 5 TP pro Treffer" },
        { name: "Atomare", dmgMod: 1.2, rads: 5, desc: "Verstrahlt den Gegner" },
        { name: "Leichte", weightMod: 0.5, desc: "50% weniger Gewicht" }
      ];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const legendaryItem = JSON.parse(JSON.stringify(baseItem));
      legendaryItem.id = baseId;
      legendaryItem.uid = "LEGEND_" + Date.now();
      legendaryItem.name = `${prefix.name} ${baseItem.name} ★`;
      legendaryItem.isLegendary = true;
      legendaryItem.desc = prefix.desc;
      const basisSchaden = baseItem.baseDmg || baseItem.dmg || 1;
      const basisWert = baseItem.cost || baseItem.value || 10;
      legendaryItem.value = basisWert * 5;
      if (prefix.dmgMod) legendaryItem.dmg = Math.floor(basisSchaden * prefix.dmgMod);
      else delete legendaryItem.dmg;
      legendaryItem.ammoType = baseItem.ammoType;
      if (prefix.ammoMod) legendaryItem.ammoCost = (baseItem.ammoCost || 1) * prefix.ammoMod;
      else legendaryItem.ammoCost = baseItem.ammoCost || 1;
      if (prefix.hpDrain) legendaryItem.effectHeal = prefix.hpDrain;
      if (prefix.rads) legendaryItem.effectRad = prefix.rads;
      if (prefix.weightMod) legendaryItem.weight = (baseItem.weight || 1) * prefix.weightMod;
      this.addToInventory(legendaryItem, 1);
      return legendaryItem;
    },
    // Legt einen Buff aus einem Verbrauchsgut an. Vorher schrieb useItem nur
    // "(Effekte noch WIP)" ins Log und verbrauchte das Item - Buffout, Jet,
    // Rad-X und Stealth Boy (zusammen 310 KK Ladenwert) hatten keine Wirkung
    // (docs/BALANCE_BEFUNDE.md, B3).
    applyBuff: function(itemDef) {
      if (!this.state) return false;
      if (!this.state.buffs) this.state.buffs = [];
      const bonus = itemDef.bonus || {};
      if (Object.keys(bonus).length === 0) return false;
      const sekunden = itemDef.duration || 1800;
      const vorhanden = this.state.buffs.find((b) => b.id === itemDef.id);
      if (vorhanden) {
        vorhanden.expires = Date.now() + sekunden * 1e3;
      } else {
        this.state.buffs.push({ id: itemDef.id, name: itemDef.name, bonus, expires: Date.now() + sekunden * 1e3 });
      }
      const beschreibung = Object.entries(bonus).map(([k, v]) => `${k}+${v}`).join(", ");
      const minuten = Math.round(sekunden / 60);
      UI.log(`${itemDef.name}: ${beschreibung} für ${minuten} Min.`, "text-pink-400 font-bold");
      this.recalcStats();
      return true;
    },
    // Summe aller noch laufenden Buffs für einen Schlüssel.
    buffBonus: function(key) {
      if (!this.state || !Array.isArray(this.state.buffs)) return 0;
      const jetzt = Date.now();
      let summe = 0;
      for (const buff of this.state.buffs) {
        if (!buff || !buff.bonus) continue;
        if (buff.expires && buff.expires <= jetzt) continue;
        if (typeof buff.bonus[key] === "number") summe += buff.bonus[key];
      }
      return summe;
    },
    // Abgelaufene Buffs entfernen. Wird von getStat und recalcStats gerufen,
    // damit kein Zeitgeber nötig ist.
    pruneBuffs: function() {
      if (!this.state || !Array.isArray(this.state.buffs)) return false;
      const jetzt = Date.now();
      const vorher = this.state.buffs.length;
      this.state.buffs = this.state.buffs.filter((b) => !b.expires || b.expires > jetzt);
      return this.state.buffs.length !== vorher;
    },
    // Anzeige des zuletzt erzeugten legendären Items
    announceLegendary: function(legendaryItem) {
      UI.log("LEGENDÄRES ITEM ERHALTEN!", "text-yellow-400 font-bold animate-pulse");
      if (typeof UI.showItemOverlay === "function") UI.showItemOverlay(legendaryItem);
    },
    updateWeight: function() {
      if (!this.state.player) return;
      let w = 0;
      if (this.state.inventory) {
        this.state.inventory.forEach((i) => {
          const weight = i.weight !== void 0 ? i.weight : this.items[i.id] ? this.items[i.id].weight : 0;
          w += weight * (i.count || 1);
        });
      }
      this.state.player.carryWeight = Math.floor(w * 10) / 10;
    }
  });
  Game.addItem = Game.addToInventory;

  // src/game/game_world_logic.js
  Object.assign(Game, {
    getCampUpgradeCost: function(currentLevel) {
      switch (currentLevel) {
        case 1:
          return { id: "junk_metal", count: 25, name: "Schrott" };
        case 2:
          return { id: "cloth", count: 10, name: "Stoff" };
        case 3:
          return { id: "duct_tape", count: 5, name: "Klebeband" };
        case 4:
          return { id: "screws", count: 10, name: "Schrauben" };
        case 5:
          return { id: "gears", count: 10, name: "Zahnräder" };
        case 6:
          return { id: "adhesive", count: 5, name: "Kleber" };
        case 7:
          return { id: "springs", count: 5, name: "Federn" };
        case 8:
          return { id: "circuit", count: 5, name: "Schaltkreise" };
        case 9:
          return { id: "nuclear_mat", count: 3, name: "Nukleares Material" };
        default:
          return null;
      }
    },
    deployCamp: function(invIndex, confirmed = false) {
      if (this.state.camp) {
        UI.log("Lager existiert bereits!", "text-red-500");
        return;
      }
      if (this.state.zone.includes("Stadt") || this.state.dungeonLevel > 0) {
        UI.log("Hier nicht möglich!", "text-red-500");
        return;
      }
      const cost = 100;
      if (this.state.caps < cost) {
        UI.log(`Benötigt ${cost} Kronkorken für Aufbau.`, "text-red-500");
        return;
      }
      if (!confirmed) {
        if (typeof UI !== "undefined" && UI.els.dialog) {
          UI.els.dialog.style.display = "flex";
          UI.els.dialog.innerHTML = `
                    <div class="bg-black/95 border-2 border-yellow-400 p-6 rounded-lg shadow-[0_0_20px_#ffd700] text-center max-w-sm pointer-events-auto relative z-50">
                        <div class="text-4xl mb-4">⛺</div>
                        <h3 class="text-xl font-bold text-yellow-400 mb-2">LAGER ERRICHTEN?</h3>
                        <p class="text-gray-300 text-sm mb-6 leading-relaxed">Der Aufbau kostet Material im Wert von <span class="text-yellow-400 font-bold">${cost} Kronkorken</span>.</p>
                        <div class="flex gap-4 justify-center">
                            <button onclick="Game.deployCamp(${invIndex}, true); UI.els.dialog.style.display='none'; UI.els.dialog.innerHTML='';" class="border-2 border-green-500 bg-green-900/40 text-green-400 px-6 py-2 rounded font-bold hover:bg-green-500 hover:text-black transition-all">BAUEN</button>
                            <button onclick="UI.els.dialog.style.display='none'; UI.els.dialog.innerHTML='';" class="border-2 border-red-500 bg-red-900/40 text-red-400 px-6 py-2 rounded font-bold hover:bg-red-500 hover:text-black transition-all">ABBRECHEN</button>
                        </div>
                    </div>
                 `;
        }
        return;
      }
      this.state.caps -= cost;
      const startLevel = this.state.savedCampLevel || 1;
      this.state.camp = {
        sector: { x: this.state.sector.x, y: this.state.sector.y },
        x: this.state.player.x,
        y: this.state.player.y,
        level: startLevel,
        storage: this.state.savedCampStorage || []
      };
      this.state.savedCampStorage = null;
      UI.log(`Lager aufgeschlagen! (Stufe ${startLevel})`, "text-green-400 font-bold");
      UI.switchView("camp");
      this.saveGame();
    },
    packCamp: function() {
      if (!this.state.camp) return;
      this.state.savedCampLevel = this.state.camp.level;
      this.state.savedCampStorage = this.state.camp.storage || [];
      this.state.camp = null;
      UI.log(`Lager eingepackt. (Level ${this.state.savedCampLevel} gesichert)`, "text-yellow-400");
      UI.switchView("map");
      this.saveGame();
    },
    upgradeCamp: function() {
      if (!this.state.camp) return;
      const lvl = this.state.camp.level;
      if (lvl >= 10) {
        UI.log("Lager ist bereits auf Maximalstufe (10)!", "text-yellow-400");
        return;
      }
      const cost = this.getCampUpgradeCost(lvl);
      if (!cost) {
        UI.log("Kein weiteres Upgrade verfügbar.", "text-gray-500");
        return;
      }
      const totalOwned = this.state.inventory.reduce((sum, item) => {
        return item.id === cost.id ? sum + item.count : sum;
      }, 0);
      if (totalOwned < cost.count) {
        UI.log(`Upgrade benötigt: ${cost.count}x ${cost.name}`, "text-red-500");
        return;
      }
      let remainingCost = cost.count;
      for (let i = 0; i < this.state.inventory.length; i++) {
        if (remainingCost <= 0) break;
        const item = this.state.inventory[i];
        if (item.id === cost.id) {
          const take = Math.min(item.count, remainingCost);
          item.count -= take;
          remainingCost -= take;
        }
      }
      this.state.inventory = this.state.inventory.filter((i) => i.count > 0);
      this.state.camp.level++;
      UI.log(`Lager verbessert auf Stufe ${this.state.camp.level}!`, "text-green-400 font-bold animate-pulse");
      this.saveGame();
      if (typeof UI.renderCamp === "function") UI.renderCamp();
    },
    // --- Lagerschrank ---
    // Das Lager war eine Basisfunktion: schlafen, kochen, ausbauen. Der
    // Schrank ist der erste echte Ausbau - Stauraum, der mit der Stufe
    // waechst. Er loest das eigentliche Problem des Lagers: das Inventar ist
    // eng (10 + STR + Rucksack), und wer Beute sammelt, muss unterwegs
    // wegwerfen. Bisher half das Lager dabei nicht.
    getCampStorageSlots: function() {
      if (!this.state || !this.state.camp) return 0;
      const lvl = this.state.camp.level || 1;
      return 10 + (lvl - 1) * 5;
    },
    getCampStorage: function() {
      if (!this.state || !this.state.camp) return [];
      if (!Array.isArray(this.state.camp.storage)) this.state.camp.storage = [];
      return this.state.camp.storage;
    },
    getCampStorageUsed: function() {
      return this.getCampStorage().length;
    },
    storeInCamp: function(invIndex, amount) {
      if (!this.state || !this.state.camp) {
        UI.log("Kein Lager aufgeschlagen.", "text-red-500");
        return false;
      }
      const item = this.state.inventory[invIndex];
      if (!item) return false;
      const lager = this.getCampStorage();
      if (lager.length >= this.getCampStorageSlots()) {
        UI.log("Lagerschrank ist voll!", "text-red-500 font-bold");
        return false;
      }
      const menge = Math.min(item.count, amount || item.count);
      if (menge <= 0) return false;
      const vorhanden = lager.find((e) => e.id === item.id && !e.props && !e.isLegendary);
      if (vorhanden && !item.props && !item.isLegendary) {
        vorhanden.count += menge;
      } else {
        const kopie = { ...item, count: menge };
        lager.push(kopie);
      }
      item.count -= menge;
      if (item.count <= 0) this.state.inventory.splice(invIndex, 1);
      UI.log(`${menge}x ${item.name || this.items[item.id] && this.items[item.id].name || item.id} eingelagert.`, "text-blue-300");
      this.updateWeight();
      this.saveGame();
      return true;
    },
    takeFromCamp: function(storageIndex, amount) {
      if (!this.state || !this.state.camp) return false;
      const lager = this.getCampStorage();
      const eintrag = lager[storageIndex];
      if (!eintrag) return false;
      if (this.getUsedSlots() >= this.getMaxSlots()) {
        UI.log("Inventar voll! Erst Platz schaffen.", "text-red-500");
        return false;
      }
      const menge = Math.min(eintrag.count, amount || eintrag.count);
      this.addToInventory(eintrag.id, menge);
      eintrag.count -= menge;
      if (eintrag.count <= 0) lager.splice(storageIndex, 1);
      UI.log(`${menge}x ${this.items[eintrag.id] ? this.items[eintrag.id].name : eintrag.id} entnommen.`, "text-blue-300");
      this.updateWeight();
      this.saveGame();
      return true;
    },
    restInCamp: function() {
      if (!this.state || !this.state.camp) return;
      const lvl = this.state.camp.level || 1;
      this.addRadiation(5);
      const effectiveMax = this.state.maxHp - (this.state.rads || 0);
      let healPct = 30 + (lvl - 1) * 8;
      if (lvl >= 10) healPct = 100;
      if (healPct > 100) healPct = 100;
      const healAmount = Math.floor(effectiveMax * (healPct / 100));
      const oldHp = this.state.hp;
      this.state.hp = Math.min(effectiveMax, this.state.hp + healAmount);
      const healed = Math.floor(this.state.hp - oldHp);
      UI.log(`Geschlafen (Lager Stufe ${lvl}).`, "text-blue-300");
      UI.log(`Regeneration: ${healPct}% (+${healed} TP) / +5 RADS`, "text-green-400 font-bold");
      UI.update();
      if (typeof UI.renderCamp === "function") UI.renderCamp();
    },
    rest: function() {
      if (!this.state) return;
      const isSafe = this.state.view === "vault" || this.state.view === "city" || this.state.view === "clinic" || this.state.zone && (this.state.zone.includes("Vault") || this.state.zone.includes("Stadt") || this.state.zone.includes("City"));
      if (!isSafe) {
        this.addRadiation(10);
        UI.log("Ungeschützt geschlafen: +10 RADS", "text-red-500 font-bold");
      } else {
        UI.log("Sicher geschlafen. Kein RAD Zuwachs.", "text-green-400");
      }
      const effectiveMax = this.state.maxHp - (this.state.rads || 0);
      this.state.hp = effectiveMax;
      UI.log("Ausgeruht. HP voll (soweit möglich).", "text-blue-400");
      UI.update();
    },
    // Strahlungsdosis eines Feldes, mit Schutz verrechnet.
    //
    // getrennt von addRadiation, weil kleine Dosen sonst still verschwinden:
    // 4 RAD minus 20 Prozent Gasmaske sind 3,2, und Math.ceil macht daraus
    // wieder 4. Der Schutz waere bei jeder kleinen Dosis wirkungslos
    // (docs/BALANCE_BEFUNDE.md, Nachtrag WOLKEN). Deshalb wird der Rest
    // gesammelt und erst ab einem ganzen Punkt ausgezahlt.
    strahlungsDosis: function(amount) {
      if (!this.state || amount <= 0) return amount;
      const perkLvl = this.getPerkLevel("rad_resistant");
      let reduction = perkLvl * 0.1;
      const resistenz = this.equipBonus("RAD_RESIST") + (typeof this.buffBonus === "function" ? this.buffBonus("RAD_RESIST") : 0);
      const schutz = this.equipBonus("RAD");
      reduction += resistenz / 100;
      reduction += schutz / 100;
      reduction = Math.min(0.9, reduction);
      const rest = amount * (1 - reduction);
      const ganz = Math.floor(rest);
      if (typeof this.state.radRest === "undefined") this.state.radRest = 0;
      this.state.radRest += rest - ganz;
      if (this.state.radRest >= 1) {
        const extra = Math.floor(this.state.radRest);
        this.state.radRest -= extra;
        return ganz + extra;
      }
      return ganz;
    },
    addRadiation: function(amount) {
      if (!this.state) return;
      if (typeof this.state.rads === "undefined") this.state.rads = 0;
      let finalAmount = amount;
      if (amount > 0 && typeof this.strahlungsDosis === "function") {
        finalAmount = this.strahlungsDosis(amount);
      }
      this.state.rads = Math.min(this.state.maxHp, Math.max(0, this.state.rads + finalAmount));
      if (finalAmount > 0) UI.log(`+${finalAmount} RADS!`, "text-red-500 font-bold animate-pulse");
      else if (finalAmount < 0) UI.log(`${Math.abs(finalAmount)} RADS entfernt.`, "text-green-300");
      const effectiveMax = this.state.maxHp - this.state.rads;
      if (this.state.hp > effectiveMax) {
        this.state.hp = effectiveMax;
      }
      if (this.state.hp <= 0 && finalAmount > 0) {
        this.state.hp = 0;
        this.state.isGameOver = true;
        if (UI && UI.showGameOver) UI.showGameOver();
      }
      UI.update();
    },
    heal: function() {
      if (this.state.caps >= 25) {
        this.state.caps -= 25;
        this.state.rads = 0;
        this.state.hp = this.state.maxHp;
        UI.log("BEHANDLUNG ERFOLGREICH.", "text-green-400 font-bold");
        UI.update();
        setTimeout(() => {
          if (Game.state.view === "clinic") {
            if (typeof UI.renderCity === "function") UI.renderCity();
          }
        }, 1500);
      } else {
        UI.log("Zu wenig Kronkorken.", "text-red-500");
      }
    },
    buyAmmo: function(qty) {
      this.buyItem("ammo", qty);
    },
    // Munition lagert je Sorte. 'ammoStock' bleibt als alter Schluessel
    // bestehen, damit vorhandene Spielstaende nicht leer dastehen.
    ammoStockOf: function(id) {
      const shop = Game.state && Game.state.shop || {};
      if (shop.ammoStockByType && shop.ammoStockByType[id] !== void 0) return shop.ammoStockByType[id];
      if (id === "ammo") return shop.ammoStock || 0;
      return 0;
    },
    addAmmoStock: function(id, amount) {
      if (!Game.state.shop) Game.state.shop = { nextRestock: 0, stock: {}, merchantCaps: 1e3 };
      if (!Game.state.shop.ammoStockByType) Game.state.shop.ammoStockByType = {};
      const current = this.ammoStockOf(id);
      Game.state.shop.ammoStockByType[id] = current + amount;
      if (id === "ammo") Game.state.shop.ammoStock = Game.state.shop.ammoStockByType[id];
    },
    // Charisma-Rabatt beim Kauf und Aufschlag beim Verkauf. CHA war der
    // einzige SPECIAL-Wert ohne jede Wirkung (docs/BALANCE_BEFUNDE.md, B5).
    // Ein Prozent je Punkt, gedeckelt auf 25 Prozent - sonst wäre CHA 10
    // ein Freifahrtschein.
    charismaFaktor: function(richtung) {
      const cha = typeof this.getStat === "function" ? this.getStat("CHA") : 5;
      const stufe = Math.max(-5, Math.min(25, cha - 1));
      if (richtung === "verkaufen") return 1 + stufe / 100;
      return 1 - stufe / 100;
    },
    buyItem: function(id, qtyMode = 1) {
      if (id === "camp_kit") {
        if (typeof UI !== "undefined") UI.error("Nicht käuflich!");
        return;
      }
      const item = Game.items[id];
      if (!item) {
        if (typeof UI !== "undefined") UI.error("Error: " + id);
        return;
      }
      let stock = 0;
      let pricePerUnit = item.cost;
      let itemsPerUnit = 1;
      if (item.type === "ammo") {
        stock = this.ammoStockOf(id);
        itemsPerUnit = 10;
        pricePerUnit = (item.cost || 1) * 10;
      } else {
        stock = this.state.shop.stock && this.state.shop.stock[id] !== void 0 ? this.state.shop.stock[id] : 0;
      }
      if (pricePerUnit > 0) {
        pricePerUnit = Math.max(1, Math.round(pricePerUnit * this.charismaFaktor("kaufen")));
      }
      if (stock < itemsPerUnit) {
        if (typeof UI !== "undefined") UI.error("Händler hat das nicht mehr.");
        return;
      }
      let packsToBuy = 1;
      if (typeof qtyMode === "number") packsToBuy = qtyMode;
      else if (qtyMode === "max") {
        const maxAffordable = Math.floor(Game.state.caps / pricePerUnit);
        const maxInStock = Math.floor(stock / itemsPerUnit);
        packsToBuy = Math.min(maxAffordable, maxInStock);
        if (packsToBuy > 100) packsToBuy = 100;
        if (packsToBuy < 1) packsToBuy = 1;
      }
      const totalCost = packsToBuy * pricePerUnit;
      const totalItemsReceived = packsToBuy * itemsPerUnit;
      if (totalItemsReceived > stock) {
        if (typeof UI !== "undefined") UI.error("Nicht genug auf Lager.");
        return;
      }
      if (Game.state.caps < totalCost) {
        if (typeof UI !== "undefined") UI.error("Nicht genug Kronkorken!");
        return;
      }
      Game.state.caps -= totalCost;
      Game.state.shop.merchantCaps += totalCost;
      if (item.type === "ammo") this.addAmmoStock(id, -totalItemsReceived);
      else Game.state.shop.stock[id] -= packsToBuy;
      Game.addToInventory(id, totalItemsReceived);
      if (typeof UI !== "undefined") {
        UI.log(`Gekauft: ${packsToBuy}x ${itemsPerUnit > 1 ? "Paket " : ""}${item.name} (-${totalCost} KK).`);
        if (Game.state.view === "shop") UI.renderShop("buy");
      }
      Game.saveGame();
    },
    sellItem: function(invIndex, qtyMode = 1) {
      const entry = Game.state.inventory[invIndex];
      if (!entry) return;
      if (entry.id === "camp_kit") {
        if (typeof UI !== "undefined") UI.error("Das brauchst du noch!");
        return;
      }
      const item = Game.items[entry.id];
      if (!item) return;
      let valMult = entry.props && entry.props.valMult ? entry.props.valMult : 1;
      let unitPrice = Math.floor(item.cost * 0.25 * valMult * this.charismaFaktor("verkaufen"));
      if (unitPrice < 1) unitPrice = 1;
      let amount = 1;
      if (typeof qtyMode === "number") amount = qtyMode;
      else if (qtyMode === "max") {
        amount = entry.count;
        const maxMerchantCanBuy = Math.floor(Game.state.shop.merchantCaps / unitPrice);
        if (amount > maxMerchantCanBuy) amount = maxMerchantCanBuy;
      }
      if (amount > entry.count) amount = entry.count;
      if (amount <= 0) {
        UI.error("Händler pleite!");
        return;
      }
      const totalValue = unitPrice * amount;
      if (Game.state.shop.merchantCaps < totalValue) {
        UI.error("Händler hat nicht genug Kronkorken.");
        return;
      }
      Game.state.caps += totalValue;
      Game.state.shop.merchantCaps -= totalValue;
      entry.count -= amount;
      if (entry.count <= 0) {
        Game.state.inventory.splice(invIndex, 1);
      }
      if (item && item.type === "ammo") {
        this.addAmmoStock(entry.id, amount);
        if (Game.syncAmmo) Game.syncAmmo();
      } else {
        if (!Game.state.shop.stock[entry.id]) Game.state.shop.stock[entry.id] = 0;
        Game.state.shop.stock[entry.id] += amount;
      }
      if (typeof UI !== "undefined") {
        UI.log(`Verkauft: ${amount}x ${item.name} (+${totalValue} KK).`);
        if (Game.state.view === "shop") UI.renderShop("sell");
      }
      Game.saveGame();
    }
  });

  // src/game/game_char_logic.js
  Object.assign(Game, {
    upgradeStat: function(key, e) {
      if (e) e.stopPropagation();
      const currentVal = this.state.stats[key] || 1;
      const maxLimit = 20;
      const softCap = 10;
      if (currentVal >= maxLimit) {
        UI.log(`${key} ist bereits auf dem absoluten Maximum!`, "text-yellow-500");
        return;
      }
      const cost = currentVal >= softCap ? 2 : 1;
      if (this.state.statPoints >= cost) {
        this.state.stats[key]++;
        this.state.statPoints -= cost;
        this.recalcStats();
        if (typeof UI.renderStats === "function") {
          UI.renderStats(Game.state.charTab || "special");
        }
        UI.log(`${key} erhöht auf ${this.state.stats[key]}!`, "text-green-400 font-bold");
        UI.update();
        this.saveGame();
      } else {
        UI.log(`Nicht genügend Punkte! (Benötigt: ${cost} ab Level 10)`, "text-red-500");
      }
    },
    choosePerk: function(perkId) {
      if (this.state.perkPoints <= 0) {
        UI.log("Keine Perk-Punkte verfügbar!", "text-red-500");
        return;
      }
      const perkDef = this.perkDefs.find((p) => p.id === perkId);
      if (!perkDef) return;
      if (Array.isArray(this.state.perks)) {
        const oldPerks = this.state.perks;
        this.state.perks = {};
        oldPerks.forEach((id) => this.state.perks[id] = 1);
      }
      if (!this.state.perks) this.state.perks = {};
      const currentLvl = this.state.perks[perkId] || 0;
      const maxLvl = perkDef.max || 1;
      if (currentLvl >= maxLvl) {
        UI.log(`${perkDef.name} ist bereits auf Max-Level!`, "text-yellow-500");
        return;
      }
      this.state.perkPoints--;
      this.state.perks[perkId] = currentLvl + 1;
      UI.log(`Perk gelernt: ${perkDef.name} (Stufe ${this.state.perks[perkId]})`, "text-green-400 font-bold");
      this.recalcStats();
      this.saveGame();
      if (typeof UI.renderStats === "function") {
        UI.renderStats("perks");
      }
    },
    startCombat: function() {
      let pool = [];
      let lvl = this.state.lvl;
      const dLvl = this.state.dungeonLevel || 0;
      let difficultyMult = 1 + dLvl * 0.2;
      let biome = this.worldData[`${this.state.sector.x},${this.state.sector.y}`]?.biome || "wasteland";
      let zone = this.state.zone;
      if (zone.includes("Supermarkt")) {
        pool = [this.monsters.raider, this.monsters.ghoul, this.monsters.wildDog];
        if (lvl >= 4) pool.push(this.monsters.superMutant);
      } else if (zone.includes("Höhle")) {
        pool = [this.monsters.moleRat, this.monsters.radScorpion, this.monsters.bloatfly];
        if (lvl >= 3) pool.push(this.monsters.ghoul);
      } else if (biome === "city") {
        pool = [this.monsters.raider, this.monsters.ghoul, this.monsters.wildDog];
        if (lvl >= 5) pool.push(this.monsters.superMutant);
        if (lvl >= 8) pool.push(this.monsters.deathclaw);
      } else if (biome === "desert") {
        pool = [this.monsters.radScorpion, this.monsters.raider, this.monsters.moleRat];
      } else if (biome === "jungle") {
        pool = [this.monsters.bloatfly, this.monsters.ghoul, this.monsters.wildDog];
        if (lvl >= 4) pool.push(this.monsters.radScorpion);
      } else if (biome === "swamp") {
        pool = [this.monsters.bloatfly, this.monsters.moleRat];
        if (lvl >= 5) pool.push(this.monsters.ghoul);
      } else {
        pool = [this.monsters.moleRat, this.monsters.radRoach, this.monsters.bloatfly];
        if (lvl >= 2) pool.push(this.monsters.raider);
        if (lvl >= 3) pool.push(this.monsters.wildDog);
      }
      if (lvl >= 8 && Math.random() < 0.1) pool = [this.monsters.deathclaw];
      pool = pool.filter((m) => m && m.name);
      if (pool.length === 0) pool = [this.monsters.radRoach];
      const template = pool[Math.floor(Math.random() * pool.length)];
      let enemy = { ...template };
      if (isNaN(difficultyMult)) difficultyMult = 1;
      enemy.hp = Math.floor(enemy.hp * difficultyMult);
      enemy.maxHp = enemy.hp;
      enemy.dmg = Math.floor(enemy.dmg * difficultyMult);
      enemy.loot = Math.floor(enemy.loot * difficultyMult);
      const fortuneLvl = this.getPerkLevel("fortune_finder");
      if (fortuneLvl > 0) {
        enemy.loot = Math.floor(enemy.loot * (1 + fortuneLvl * 0.1));
      }
      const isLegendary = Math.random() < 0.05;
      if (isLegendary) {
        enemy.isLegendary = true;
        enemy.name = "Legendäre " + enemy.name;
        enemy.hp *= 2;
        enemy.maxHp = enemy.hp;
        enemy.dmg = Math.floor(enemy.dmg * 1.5);
        enemy.loot *= 3;
        if (Array.isArray(enemy.xp)) enemy.xp = [enemy.xp[0] * 3, enemy.xp[1] * 3];
      }
      if (typeof Combat !== "undefined") {
        Combat.start(enemy);
      } else {
        console.error("Combat module missing!");
      }
    },
    gambleLegendaryLoot: function(sum) {
      UI.log(`🎲 Wasteland Gamble: ${sum}`, "text-yellow-400 font-bold");
      if (sum <= 9) {
        if (Math.random() < 0.5) {
          this.state.caps += 50;
          UI.log("Gewinn: 50 Kronkorken", "text-green-400");
        } else {
          this.addToInventory("ammo", 10);
          UI.log("Gewinn: 10x Munition", "text-green-400");
        }
      } else if (sum <= 14) {
        this.state.caps += 150;
        this.addToInventory("stimpack", 1);
        this.addToInventory("screws", 5);
        UI.log("Gewinn: 150 KK + Stimpack + Schrott", "text-blue-400");
      } else {
        const item = typeof this.createLegendaryItem === "function" ? this.createLegendaryItem("plasma_rifle") : null;
        if (item && typeof this.announceLegendary === "function") {
          this.announceLegendary(item);
        }
        this.state.caps += 300;
        UI.log("JACKPOT! Legendäre Waffe + 300 KK!", "text-yellow-400 font-bold animate-pulse");
      }
      this.saveGame();
    }
  });

  // src/game/game_combat.js
  window.Combat = {
    enemy: null,
    turn: "player",
    logData: [],
    selectedPart: 1,
    bodyParts: [
      { name: "KOPF", hitMod: 0.6, dmgMod: 2 },
      { name: "KÖRPER", hitMod: 1, dmgMod: 1 },
      { name: "BEINE", hitMod: 1.3, dmgMod: 0.8 }
    ],
    // [NEU] REPARATUR-TOOL: Heilt kaputte Spielstände (NaN Errors)
    repairState: function() {
      if (!Game.state) return;
      if (isNaN(Game.state.xp) || Game.state.xp === null) Game.state.xp = 0;
      if (isNaN(Game.state.lvl) || Game.state.lvl === null) Game.state.lvl = 1;
      if (isNaN(Game.state.caps) || Game.state.caps === null) Game.state.caps = 0;
      if (isNaN(Game.state.kills) || Game.state.kills === null) Game.state.kills = 0;
      if (isNaN(Game.state.hp) || Game.state.hp === null) Game.state.hp = Game.state.maxHp || 20;
    },
    start: function(enemyInput) {
      this.repairState();
      let enemyData = enemyInput;
      if (typeof enemyInput === "string") {
        if (Game.monsters && Game.monsters[enemyInput]) {
          enemyData = Game.monsters[enemyInput];
          enemyData.id = enemyInput;
        } else {
          enemyData = { id: enemyInput, name: "Mutierte Kreatur", hp: 20, dmg: 2, xp: 5 };
        }
      }
      Game.state.enemy = JSON.parse(JSON.stringify(enemyData || {}));
      Game.state.enemy.name = Game.state.enemy.name || "Unbekanntes Monster";
      Game.state.enemy.hp = Game.state.enemy.hp || 20;
      Game.state.enemy.maxHp = Game.state.enemy.maxHp || Game.state.enemy.hp;
      Game.state.enemy.dmg = Game.state.enemy.dmg || 2;
      Game.state.enemy.xp = Game.state.enemy.xp || 5;
      this.enemy = Game.state.enemy;
      Game.state.view = "combat";
      this.logData = [];
      this.turn = "player";
      this.selectedPart = 1;
      this.log(`Kampf gestartet gegen: ${this.enemy.name}`, "text-yellow-400 blink-red");
      UI.switchView("combat").then(() => {
        this.render();
        this.moveSelection(0);
      });
    },
    log: function(msg, color = "text-gray-300") {
      this.logData.unshift({ t: msg, c: color });
      if (this.logData.length > 6) this.logData.pop();
      this.renderLogs();
    },
    renderLogs: function() {
      const el = document.getElementById("combat-log");
      if (!el) return;
      el.innerHTML = this.logData.map((l) => `<div class="${l.c}">${l.t}</div>`).join("");
    },
    render: function() {
      if (typeof UI.renderCombat === "function") UI.renderCombat();
      this.renderLogs();
    },
    moveSelection: function(dir) {
      if (typeof this.selectedPart === "undefined") this.selectedPart = 1;
      this.selectedPart += dir;
      if (this.selectedPart < 0) this.selectedPart = 2;
      if (this.selectedPart > 2) this.selectedPart = 0;
      for (let i = 0; i < 3; i++) {
        const btn = document.getElementById(`btn-vats-${i}`);
        if (btn) {
          btn.classList.remove("border-yellow-400", "text-yellow-400", "bg-yellow-900/40");
          if (i === this.selectedPart) {
            btn.classList.add("border-yellow-400", "text-yellow-400", "bg-yellow-900/40");
          }
        }
      }
    },
    selectPart: function(index) {
      this.selectedPart = index;
      this.moveSelection(0);
    },
    confirmSelection: function() {
      if (this.turn === "player") {
        this.playerAttack();
      }
    },
    triggerFeedback: function(type, value) {
      const layer = document.getElementById("combat-feedback-layer");
      if (!layer) return;
      const el = document.createElement("div");
      el.className = "float-text absolute font-bold text-4xl pointer-events-none z-50 text-shadow-black";
      const offset = Math.floor(Math.random() * 40) - 20;
      const offsetY = Math.floor(Math.random() * 40) - 20;
      el.style.transform = `translate(${offset}px, ${offsetY}px)`;
      if (type === "hit") {
        el.innerHTML = `-${value}`;
        el.className += " text-yellow-400 animate-float-up";
      } else if (type === "crit") {
        el.innerHTML = `CRIT! -${value}`;
        el.className += " text-red-500 text-6xl blink-red animate-float-up";
      } else if (type === "miss") {
        el.innerHTML = "MISS";
        el.className += " text-gray-500 text-2xl animate-fade-out";
      } else if (type === "damage") {
        el.innerHTML = `-${value}`;
        el.className += " text-red-600 animate-shake";
        const flash = document.getElementById("damage-flash");
        if (flash) {
          flash.classList.remove("hidden");
          flash.style.opacity = 0.5;
          setTimeout(() => {
            flash.style.opacity = 0;
            flash.classList.add("hidden");
          }, 300);
        }
      } else if (type === "dodge") {
        el.innerHTML = "AUSGEWICHEN";
        el.className += " text-blue-400 text-2xl animate-fade-out";
      }
      layer.appendChild(el);
      setTimeout(() => {
        el.remove();
      }, 1e3);
    },
    getSafeWeapon: function() {
      let wpn = Game.state.equip.weapon;
      if (!wpn) return { id: "fists", name: "Fäuste", baseDmg: 2 };
      if (!wpn.id && wpn.name) {
        const foundId = Object.keys(Game.items).find((k) => Game.items[k].name === wpn.name);
        if (foundId) wpn.id = foundId;
        else return { id: "fists", name: "Fäuste (Fallback)", baseDmg: 2 };
      }
      if (!wpn.id) return { id: "fists", name: "Fäuste", baseDmg: 2 };
      return wpn;
    },
    getWeaponStats: function(item) {
      const dbItem = Game.items[item.id] || {};
      let dmg;
      if (item.dmg !== void 0 && item.dmg !== null) {
        dmg = item.dmg;
      } else {
        dmg = dbItem.baseDmg || dbItem.dmg || item.baseDmg || 2;
        const dmgMult = item.props && item.props.dmgMult || 1;
        dmg = Math.floor(dmg * dmgMult);
      }
      const ammoType = item.ammoType || dbItem.ammoType || null;
      const ammoCost = item.ammoCost !== void 0 ? item.ammoCost : dbItem.ammoCost || 1;
      return { dmg, ammoType, ammoCost };
    },
    calculateHitChance: function(partIndex) {
      const part = this.bodyParts[partIndex];
      const perception = Game.getStat("PER");
      let chance = 50 + perception * 5;
      chance *= part.hitMod;
      const wpn = this.getSafeWeapon();
      const wId = wpn.id.toLowerCase();
      const rangedKeywords = ["pistol", "rifle", "gun", "shotgun", "smg", "minigun", "blaster", "sniper", "cannon", "gewehr", "flinte", "revolver"];
      const isRanged = rangedKeywords.some((k) => wId.includes(k));
      if (!isRanged) chance += 20;
      return Math.min(95, Math.floor(chance));
    },
    playerAttack: function() {
      if (this.turn !== "player") return;
      const partIndex = this.selectedPart;
      const part = this.bodyParts[partIndex];
      const hitChance = this.calculateHitChance(partIndex);
      let wpn = this.getSafeWeapon();
      const stats = this.getWeaponStats(wpn);
      const wId = wpn.id.toLowerCase();
      if (stats.ammoType && wId !== "alien_blaster") {
        const hasAmmo = Game.removeFromInventory(stats.ammoType, stats.ammoCost);
        if (!hasAmmo) {
          if (typeof UI.showCombatEffect === "function") {
            UI.showCombatEffect("* KLICK *", "MUNITION LEER!", "red", 2300);
          }
          this.log("WAFFE LEER! *KLICK*", "text-red-500 font-bold text-xl");
          setTimeout(() => {
            if (typeof Game.switchToBestMelee === "function") {
              Game.switchToBestMelee();
            } else {
              this.log("Manuell wechseln!", "text-yellow-400");
            }
          }, 800);
          return;
        }
      }
      const roll = Math.random() * 100;
      const screen = document.getElementById("game-screen");
      if (screen) {
        screen.classList.add("shake-anim");
        setTimeout(() => screen.classList.remove("shake-anim"), 200);
      }
      if (roll <= hitChance) {
        let dmg = stats.dmg;
        if (wpn.props && wpn.props.dmgMult) dmg *= wpn.props.dmgMult;
        const isRanged = stats.ammoType !== null;
        if (!isRanged || wpn.id === "rifle_butt") {
          dmg += Math.floor(Game.getStat("STR") / 2);
          const sluggerLvl = Game.getPerkLevel("slugger");
          if (sluggerLvl > 0) dmg = Math.floor(dmg * (1 + sluggerLvl * 0.1));
        } else {
          const gunLvl = Game.getPerkLevel("gunslinger");
          if (gunLvl > 0) dmg = Math.floor(dmg * (1 + gunLvl * 0.1));
        }
        dmg *= part.dmgMod;
        let isCrit = false;
        let critChance = Game.state.critChance || 5;
        if (Math.random() * 100 <= critChance) {
          dmg *= 2;
          isCrit = true;
          this.log(">> KRITISCHER TREFFER! <<", "text-yellow-400 font-bold animate-pulse");
          if (typeof UI.showCombatEffect === "function") UI.showCombatEffect("CRITICAL!", "DOPPELTER SCHADEN", "yellow", 1500);
          if (Game.getPerkLevel("mysterious_stranger") > 0) {
            this.log("Der Fremde hilft dir...", "text-gray-400 text-xs");
          }
        }
        dmg = Math.floor(dmg);
        this.enemy.hp -= dmg;
        if (wpn.effectHeal) {
          Game.state.hp = Math.min(Game.getMaxHp(), Game.state.hp + wpn.effectHeal);
          this.log(`Vampir: +${wpn.effectHeal} HP`, "text-green-400");
        }
        this.log(`Treffer: ${part.name} für ${dmg} Schaden!`, "text-green-400 font-bold");
        this.triggerFeedback(isCrit ? "crit" : "hit", dmg);
        const el = document.getElementById("enemy-img");
        if (el) {
          el.classList.add("animate-pulse");
          setTimeout(() => el.classList.remove("animate-pulse"), 200);
        }
        if (this.enemy.hp <= 0) {
          this.win();
          return;
        }
      } else {
        this.log("Daneben!", "text-gray-500");
        this.triggerFeedback("miss");
      }
      this.turn = "enemy";
      this.render();
      setTimeout(() => this.enemyTurn(), 1e3);
    },
    enemyTurn: function() {
      if (!this.enemy || this.enemy.hp <= 0) return;
      const agi = Game.getStat("AGI");
      const enemyHitChance = 85 - agi * 3;
      const roll = Math.random() * 100;
      if (roll <= enemyHitChance) {
        let dmg = this.enemy.dmg;
        const armor = typeof Game.equipDef === "function" ? Game.equipDef() : 0;
        let dmgTaken = Math.max(1, dmg - Math.floor(armor / 2));
        Game.state.hp -= dmgTaken;
        this.log(`${this.enemy.name} trifft dich: -${dmgTaken} HP`, "text-red-500 font-bold");
        this.triggerFeedback("damage", dmgTaken);
        if (Game.state.hp <= 0) {
          Game.state.hp = 0;
          Game.state.isGameOver = true;
          console.log("☠️ PERMADEATH: Player died. Initiating deletion...");
          const slotToDelete = Game.state.saveSlot;
          if (typeof Network !== "undefined" && Network.active) {
            Network.registerDeath(Game.state);
          }
          if (typeof Network !== "undefined" && slotToDelete !== void 0 && slotToDelete !== null && slotToDelete !== -1) {
            Network.deleteSlot(slotToDelete).then(() => console.log(`✅ Slot ${slotToDelete} permanent entfernt.`)).catch((err) => console.error("❌ Firebase Delete Error:", err));
          }
          if (typeof UI !== "undefined" && UI.showGameOver) {
            UI.showGameOver();
          }
          Game.state.saveSlot = -1;
          setTimeout(() => {
            Game.state = null;
            localStorage.removeItem("pipboy_save");
          }, 1e3);
          return;
        }
      } else {
        this.log(`${this.enemy.name} verfehlt dich!`, "text-blue-300");
        this.triggerFeedback("dodge");
      }
      this.turn = "player";
      UI.update();
      this.render();
    },
    win: function() {
      try {
        this.repairState();
        const enemyName = this.enemy && this.enemy.name ? String(this.enemy.name) : "Kreatur";
        this.log(`${enemyName} besiegt!`, "text-yellow-400 font-bold");
        let xpBase = 5;
        if (this.enemy && this.enemy.xp !== void 0) {
          if (Array.isArray(this.enemy.xp) && this.enemy.xp.length >= 2) {
            xpBase = Number(this.enemy.xp[0]) + Math.floor(Math.random() * (Number(this.enemy.xp[1]) - Number(this.enemy.xp[0])));
          } else {
            xpBase = Number(this.enemy.xp) || 5;
          }
        }
        if (isNaN(xpBase)) xpBase = 5;
        if (typeof Game.gainExp === "function") Game.gainExp(xpBase);
        if (this.enemy && this.enemy.loot !== void 0) {
          let maxLoot = Number(this.enemy.loot);
          if (!isNaN(maxLoot) && maxLoot > 0) {
            let caps = Math.floor(Math.random() * maxLoot) + 1;
            if (Game.state) Game.state.caps = (Game.state.caps || 0) + caps;
            this.log(`Gefunden: ${caps} Kronkorken`, "text-yellow-200");
          }
        }
        if (this.enemy && this.enemy.drops) {
          let dropsArr = Array.isArray(this.enemy.drops) ? this.enemy.drops : [this.enemy.drops];
          dropsArr.forEach((d) => {
            if (!d || !d.id) return;
            let chance = d.c !== void 0 ? Number(d.c) : 1;
            if (Math.random() >= chance) return;
            const give = typeof Game.safeGiveItem === "function" ? Game.safeGiveItem.bind(Game) : (id, n) => {
              if (id === "caps") Game.state.caps = (Game.state.caps || 0) + n;
              else Game.addToInventory(id, n);
            };
            const def = Game.items && Game.items[d.id];
            if (def && def.type === "weapon" && typeof Game.generateLoot === "function") {
              const loot = Game.generateLoot(d.id);
              if (loot && loot.props) {
                Game.addToInventory(loot);
                this.log(`Besonderer Fund: ${loot.props.name}`, loot.props.color || "text-yellow-300");
                return;
              }
            }
            give(d.id, 1);
          });
        }
        let mobId = this.enemy && this.enemy.id ? this.enemy.id : null;
        if (!mobId && typeof Game.monsters === "object" && Game.monsters !== null) {
          const cleanName = enemyName.replace(/Legendäre /g, "").replace(/Legendärer /g, "");
          for (let k in Game.monsters) {
            if (Game.monsters[k] && Game.monsters[k].name === cleanName) {
              mobId = k;
              break;
            }
          }
        }
        if (mobId && typeof Game.updateQuestProgress === "function") {
          Game.updateQuestProgress("kill", mobId, 1);
        }
        if (Game.state) {
          if (isNaN(Game.state.kills)) Game.state.kills = 0;
          Game.state.kills++;
        }
        if (typeof Game.saveGame === "function") Game.saveGame();
      } catch (err) {
        console.error("Combat Win Error gesichert:", err);
        this.log("Systemfehler behoben.", "text-gray-500");
      } finally {
        setTimeout(() => {
          if (Game.state) Game.state.enemy = null;
          if (typeof UI.switchView === "function") UI.switchView("map");
        }, 1500);
      }
    },
    flee: function() {
      this.repairState();
      if (Math.random() < 0.5) {
        this.log("Flucht gelungen!", "text-green-400");
        this.triggerFeedback("dodge");
        setTimeout(() => {
          Game.state.enemy = null;
          UI.switchView("map");
        }, 800);
      } else {
        this.log("Flucht fehlgeschlagen!", "text-red-500");
        this.turn = "enemy";
        setTimeout(() => this.enemyTurn(), 800);
      }
    }
  };

  // src/ui/ui_combat.js
  Object.assign(UI, {
    // ==========================================
    // === TACTICAL COMBAT HUD ===
    // ==========================================
    renderCombat: function() {
      Game.state.view = "combat";
      const view = document.getElementById("view-container");
      if (!view) return;
      const questHud = document.getElementById("quest-tracker-hud");
      if (questHud) questHud.style.display = "none";
      if (!Combat.enemy) {
        UI.switchView("map");
        return;
      }
      view.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "w-full h-full flex flex-col bg-black relative overflow-hidden select-none";
      const bgFX = document.createElement("div");
      bgFX.className = "absolute inset-0 pointer-events-none z-0 opacity-20";
      bgFX.style.backgroundImage = `
            linear-gradient(0deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent)
        `;
      bgFX.style.backgroundSize = "50px 50px";
      wrapper.appendChild(bgFX);
      const feedbackLayer = document.createElement("div");
      feedbackLayer.id = "combat-feedback-layer";
      feedbackLayer.className = "absolute inset-0 pointer-events-none z-50 overflow-hidden";
      wrapper.appendChild(feedbackLayer);
      const flashLayer = document.createElement("div");
      flashLayer.id = "damage-flash";
      flashLayer.className = "absolute inset-0 bg-red-500 pointer-events-none z-40 hidden transition-opacity duration-300 opacity-0";
      wrapper.appendChild(flashLayer);
      const hudContainer = document.createElement("div");
      hudContainer.className = "flex-grow relative flex flex-col items-center justify-center z-10 p-4";
      let hpPercent = Combat.enemy.hp / Combat.enemy.maxHp * 100;
      let isLegendary = Combat.enemy.isLegendary;
      const theme = isLegendary ? {
        border: "border-yellow-500/50",
        title: "text-yellow-500",
        hp: "text-yellow-300",
        bar: "border-yellow-900",
        fill: "bg-yellow-600"
      } : {
        border: "border-red-500/50",
        title: "text-red-500",
        hp: "text-red-300",
        bar: "border-red-900",
        fill: "bg-red-600"
      };
      let enemyLvl = Combat.enemy.level || Combat.enemy.minLvl || 1;
      const topBar = document.createElement("div");
      topBar.className = "w-full max-w-lg flex flex-col items-center mb-4 relative";
      topBar.innerHTML = `
            <div class="flex justify-between w-full border-b-2 ${theme.border} pb-1 mb-1 items-end">
                <div class="flex items-center gap-3">
                    <span class="text-2xl font-bold ${theme.title} font-vt323 tracking-widest uppercase drop-shadow-[0_0_5px_rgba(255,0,0,0.5)] leading-none">
                        ${Combat.enemy.name} ${isLegendary ? "★" : ""}
                    </span>
                    <span class="text-xl font-mono text-yellow-400 font-bold bg-black/80 px-2 py-0.5 border-2 border-yellow-600 rounded shadow-[0_0_10px_orange]">
                        LVL ${enemyLvl}
                    </span>
                </div>
                <span class="text-lg font-mono ${theme.hp}">${Math.ceil(Combat.enemy.hp)}/${Combat.enemy.maxHp} HP</span>
            </div>
            <div class="w-full h-6 bg-black border ${theme.bar} relative skew-x-[-10deg] shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                <div class="h-full ${theme.fill} transition-all duration-300 relative overflow-hidden" style="width: ${hpPercent}%">
                    <div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
                </div>
            </div>
        `;
      hudContainer.appendChild(topBar);
      const scopeBox = document.createElement("div");
      scopeBox.className = "relative w-full max-w-md aspect-square border-2 border-green-500/30 rounded-lg flex items-center justify-center bg-green-900/5 shadow-[inset_0_0_50px_rgba(0,255,0,0.1)]";
      scopeBox.innerHTML = `
            <div class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400"></div>
            <div class="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400"></div>
            <div class="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400"></div>
            <div class="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400"></div>
            
            <div id="enemy-img" class="text-[10rem] filter drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-transform duration-100 z-0 select-none">
                ${Combat.enemy.symbol || "💀"}
            </div>
        `;
      if (Combat.turn === "player") {
        const zones = [
          { id: 0, top: 0, height: 30, label: "KOPF" },
          { id: 1, top: 30, height: 40, label: "KÖRPER" },
          { id: 2, top: 70, height: 30, label: "BEINE" }
        ];
        zones.forEach((z) => {
          const hitChance = Combat.calculateHitChance(z.id);
          const isSelected = Combat.selectedPart === z.id;
          const zoneEl = document.createElement("div");
          zoneEl.className = "absolute left-2 right-2 transition-all duration-150 cursor-pointer z-10 flex items-center justify-between px-4 group border border-transparent hover:bg-green-500/10 hover:border-green-500/30 rounded";
          if (isSelected) {
            zoneEl.className += " bg-yellow-500/10 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.2)]";
          }
          zoneEl.style.top = z.top + "%";
          zoneEl.style.height = z.height + "%";
          zoneEl.onclick = (e) => {
            e.stopPropagation();
            Combat.selectPart(z.id);
          };
          zoneEl.innerHTML = `
                    <div class="font-bold text-xs tracking-widest ${isSelected ? "text-yellow-400" : "text-green-600 opacity-50 group-hover:opacity-100 group-hover:text-green-400"} transition-all">
                        ${z.label}
                    </div>
                    <div class="font-vt323 text-3xl ${isSelected ? "text-yellow-400 drop-shadow-[0_0_5px_gold]" : "text-green-700 opacity-30 group-hover:opacity-100 group-hover:text-green-400"} transition-all">
                        ${hitChance}%
                    </div>
                `;
          scopeBox.appendChild(zoneEl);
        });
        const currentPart = Combat.bodyParts[Combat.selectedPart];
        const currentChance = Combat.calculateHitChance(Combat.selectedPart);
        const stats = document.createElement("div");
        stats.className = "absolute top-4 right-4 text-right pointer-events-none hidden md:block";
        stats.innerHTML = `
                <div class="text-green-500 text-[10px] animate-pulse">V.A.T.S. ACTIVE</div>
                <div class="text-yellow-400 font-bold text-xl uppercase tracking-widest border-b border-green-500/50 mb-1">${currentPart.name}</div>
                <div class="text-green-300 font-mono text-xs">
                    <div>CHANCE: <span class="text-white">${currentChance}%</span></div>
                    <div>DMG MOD: <span class="text-white">${currentPart.dmgMod}x</span></div>
                    <div>CRIT: <span class="text-white">${Game.state.critChance || 5}%</span></div>
                </div>
            `;
        scopeBox.appendChild(stats);
      } else {
        const warning = document.createElement("div");
        warning.className = "absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm rounded-lg";
        warning.innerHTML = `
                <div class="text-center">
                    <div class="text-5xl mb-2 animate-bounce">⚠️</div>
                    <div class="text-red-500 font-bold text-2xl animate-pulse tracking-widest border-2 border-red-500 px-6 py-2 bg-black">
                        FEINDLICHES FEUER
                    </div>
                </div>
            `;
        scopeBox.appendChild(warning);
      }
      hudContainer.appendChild(scopeBox);
      wrapper.appendChild(hudContainer);
      const footerArea = document.createElement("div");
      footerArea.className = "flex-shrink-0 flex flex-col bg-[#050a05] border-t-2 border-green-600 z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]";
      const logArea = document.createElement("div");
      logArea.id = "combat-log";
      logArea.className = "h-20 p-2 font-mono text-xs overflow-hidden flex flex-col justify-end text-green-400 leading-tight opacity-80 border-b border-green-900";
      footerArea.appendChild(logArea);
      const btnRow = document.createElement("div");
      btnRow.className = "flex p-3 gap-3";
      if (Combat.turn === "player") {
        btnRow.innerHTML = `
                <button onclick="Combat.confirmSelection()" class="flex-grow action-button py-4 text-3xl font-bold border-2 border-yellow-500 text-yellow-500 bg-yellow-900/20 hover:bg-yellow-500 hover:text-black shadow-[0_0_15px_rgba(255,200,0,0.2)] tracking-[0.2em] relative overflow-hidden group font-vt323 transition-all">
                    FEUER
                </button>
                <button onclick="Combat.flee()" class="w-1/3 action-button py-4 text-gray-500 border-2 border-gray-600 hover:text-white hover:border-white tracking-widest font-bold text-sm">
                    FLUCHT
                </button>
            `;
      } else {
        btnRow.innerHTML = `<button disabled class="w-full action-button py-4 text-gray-500 border border-gray-800 cursor-wait bg-gray-900/10 tracking-widest italic">TAKTIK-COMPUTER BERECHNET...</button>`;
      }
      footerArea.appendChild(btnRow);
      wrapper.appendChild(footerArea);
      view.appendChild(wrapper);
    }
  });

  // src/ui/ui_input.js
  Object.assign(UI, {
    touchState: {
      active: false,
      id: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      moveDir: { x: 0, y: 0 },
      timer: null
    },
    initInput: function() {
      if (this.els.btnLogin) this.els.btnLogin.onclick = () => this.attemptLogin();
      if (this.els.btnToggleRegister) {
        this.els.btnToggleRegister.onclick = () => {
          this.isRegistering = !this.isRegistering;
          const isReg = this.isRegistering;
          this.els.loginTitle.textContent = isReg ? "NEUEN ACCOUNT ERSTELLEN" : "AUTHENTICATION REQUIRED";
          this.els.btnLogin.textContent = isReg ? "REGISTRIEREN" : "LOGIN";
          this.els.btnToggleRegister.textContent = isReg ? "Zurück zum Login" : "Noch kein Account? Hier registrieren";
        };
      }
      [this.els.inputEmail, this.els.inputPass, this.els.inputName].forEach((el) => {
        if (el) {
          el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              e.preventDefault();
              this.attemptLogin();
            }
          });
        }
      });
      if (this.els.inputNewCharName) {
        this.els.inputNewCharName.addEventListener("keydown", (e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            if (this.els.btnCreateCharConfirm) {
              this.els.btnCreateCharConfirm.click();
            }
          }
        });
      }
      if (this.els.btnCreateCharConfirm) {
        this.els.btnCreateCharConfirm.onclick = async () => {
          const name = this.els.inputNewCharName.value.trim().toUpperCase();
          if (name.length < 3) {
            UI.showInfoDialog("NAMEN SPERRE", "Der Name ist zu kurz.<br>Mindestens 3 Zeichen erforderlich.");
            return;
          }
          const btn = this.els.btnCreateCharConfirm;
          const originalText = btn.textContent;
          btn.textContent = "PRÜFE...";
          btn.disabled = true;
          btn.classList.add("opacity-50", "cursor-not-allowed");
          try {
            let isFree = true;
            if (typeof Network !== "undefined" && Network.checkNameAvailability) {
              isFree = await Network.checkNameAvailability(name);
            } else {
              console.warn("Netzwerk-Modul nicht bereit, überspringe Namensprüfung.");
            }
            if (!isFree) {
              UI.showInfoDialog("IDENTITÄT ABGELEHNT", `
                            Der Name <span class="text-white font-bold">'${name}'</span> ist bereits vergeben.<br><br>
                            <span class="text-xs text-red-400 uppercase tracking-widest">>> Ein lebender Bewohner nutzt diesen Namen bereits.</span>
                        `);
              btn.textContent = originalText;
              btn.disabled = false;
              btn.classList.remove("opacity-50", "cursor-not-allowed");
              return;
            }
            this.els.newCharOverlay.classList.add("hidden");
            this.startGame(null, this.selectedSlot, name);
            btn.textContent = originalText;
            btn.disabled = false;
            btn.classList.remove("opacity-50", "cursor-not-allowed");
          } catch (e) {
            console.error("Char Create Error:", e);
            UI.showInfoDialog("SYSTEM FEHLER", "Konnte Verfügbarkeit nicht prüfen.<br>Netzwerkfehler.");
            btn.textContent = originalText;
            btn.disabled = false;
            btn.classList.remove("opacity-50", "cursor-not-allowed");
          }
        };
      }
      if (this.els.btnCharSelectAction) this.els.btnCharSelectAction.onclick = () => this.triggerCharSlot();
      if (this.els.btnCharDeleteAction) this.els.btnCharDeleteAction.onclick = () => this.triggerDeleteSlot();
      if (this.els.btnCharBack) this.els.btnCharBack.onclick = () => this.logout("ZURÜCK ZUM LOGIN");
      if (this.els.btnDeleteCancel) this.els.btnDeleteCancel.onclick = () => this.closeDeleteOverlay();
      if (this.els.deleteInput) {
        this.els.deleteInput.addEventListener("input", () => {
          const target = this.els.deleteTargetName.textContent;
          const input = this.els.deleteInput.value.toUpperCase();
          const isValid = target === input;
          this.els.btnDeleteConfirm.disabled = !isValid;
          if (isValid) {
            this.els.btnDeleteConfirm.classList.replace("border-red-500", "border-green-500");
            this.els.btnDeleteConfirm.classList.replace("text-red-500", "text-green-500");
            this.els.btnDeleteConfirm.classList.add("animate-pulse");
          } else {
            this.els.btnDeleteConfirm.classList.replace("border-green-500", "border-red-500");
            this.els.btnDeleteConfirm.classList.replace("text-green-500", "text-red-500");
            this.els.btnDeleteConfirm.classList.remove("animate-pulse");
          }
        });
        this.els.deleteInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !this.els.btnDeleteConfirm.disabled) {
            e.preventDefault();
            this.els.btnDeleteConfirm.click();
          }
        });
      }
      if (this.els.btnDeleteConfirm) {
        this.els.btnDeleteConfirm.onclick = async () => {
          if (this.selectedSlot === -1) return;
          this.els.deleteTargetName.textContent = "CHAR WIRD GELÖSCHT...";
          this.els.btnDeleteConfirm.disabled = true;
          await Network.deleteSlot(this.selectedSlot);
          this.closeDeleteOverlay();
          this.attemptLogin();
        };
      }
      if (this.els.btnSave) this.els.btnSave.onclick = () => this.handleSaveClick();
      if (this.els.btnMenuSave) this.els.btnMenuSave.onclick = () => this.handleSaveClick();
      if (this.els.btnLogout) this.els.btnLogout.onclick = () => this.logout("MANUELL AUSGELOGGT");
      if (this.els.btnReset) this.els.btnReset.onclick = () => this.handleReset();
      if (this.els.btnConfirmReset) this.els.btnConfirmReset.onclick = () => this.confirmReset();
      if (this.els.btnCancelReset) this.els.btnCancelReset.onclick = () => this.cancelReset();
      if (this.els.btnMenu) {
        this.els.btnMenu.onclick = (e) => {
          e.stopPropagation();
          this.toggleMenu();
        };
      }
      const btnCharHeader = document.getElementById("header-char-info");
      if (btnCharHeader) {
        btnCharHeader.onclick = () => {
          if (Game.state.statPoints > 0) this.charTab = "stats";
          else if (Game.state.perkPoints > 0) this.charTab = "perks";
          else this.charTab = "status";
          this.switchView("char");
        };
      }
      const navMap = {
        "btn-inv": "inventory",
        "btn-char": "char",
        "btn-map": "map",
        // Das Template heißt views/quests.html; 'journal' hatte keines und
        // lief beim Klick auf AUFGABEN in einen 404 (docs/ANALYSE.md, B8).
        "btn-quests": "quests",
        "btn-wiki": "wiki"
      };
      for (const [id, view] of Object.entries(navMap)) {
        const el = document.getElementById(id);
        if (el) el.onclick = () => {
          if (view === "char") this.charTab = "status";
          this.switchView(view);
          this.toggleNav(false);
        };
      }
      document.addEventListener("click", (e) => {
        if (this.els.navMenu && !this.els.navMenu.classList.contains("hidden")) {
          if (!this.els.navMenu.contains(e.target) && e.target !== this.els.btnMenu) {
            this.toggleMenu();
          }
        }
        if (Game.state && !["map", "combat", "city", "hacking", "lockpicking"].includes(Game.state.view) && !Game.state.view.includes("shop") && !Game.state.view.includes("crafting") && !Game.state.view.includes("clinic") && !Game.state.view.includes("vault")) {
          const viewContainer = document.getElementById("view-container");
          if (viewContainer && !viewContainer.contains(e.target)) this.switchView("map");
        }
      });
      if (this.els.log && this.els.log.parentElement) {
        this.els.log.parentElement.addEventListener("click", () => {
          if (Game.state && !["map", "combat", "hacking", "lockpicking"].includes(Game.state.view)) {
            if (Game.state.view === "city") {
              Game.leaveCity();
              return;
            }
            this.switchView("map");
          }
        });
      }
      if (this.els.playerCount) this.els.playerCount.onclick = () => this.togglePlayerList();
      if (this.els.btnInv) this.els.btnInv.onclick = () => this.toggleView("inventory");
      if (this.els.btnWiki) this.els.btnWiki.onclick = () => this.toggleView("wiki");
      if (this.els.btnMap) this.els.btnMap.onclick = () => this.toggleView("worldmap");
      if (this.els.btnChar) this.els.btnChar.onclick = () => {
        this.charTab = "status";
        this.toggleView("char");
      };
      if (this.els.btnQuests) this.els.btnQuests.onclick = () => this.toggleView("quests");
      if (this.els.btnSpawnRandom) this.els.btnSpawnRandom.onclick = () => this.selectSpawn(null);
      const btnDpad = document.getElementById("btn-toggle-dpad");
      if (btnDpad) btnDpad.onclick = () => {
        const dpad = document.getElementById("dpad-overlay");
        if (dpad) dpad.classList.toggle("hidden");
      };
      if (this.els.touchArea) {
        this.els.touchArea.addEventListener("touchstart", (e) => this.handleTouchStart(e), { passive: false });
        this.els.touchArea.addEventListener("touchmove", (e) => this.handleTouchMove(e), { passive: false });
        this.els.touchArea.addEventListener("touchend", (e) => this.handleTouchEnd(e));
        this.els.touchArea.addEventListener("touchcancel", (e) => this.handleTouchEnd(e));
      }
      ["mousemove", "mousedown", "touchstart"].forEach((evt) => {
        window.addEventListener(evt, (e) => {
          this.lastInputTime = Date.now();
          if (this.inputMethod !== "touch") {
            this.focusIndex = -1;
            this.updateFocusVisuals();
            this.inputMethod = "touch";
          }
          if (Game.state && Game.state.view === "lockpicking" && evt === "mousemove") {
            const center = window.innerWidth / 2;
            let angle = (e.clientX - center) / (window.innerWidth / 3) * 90;
            angle = Math.max(-90, Math.min(90, angle));
            if (MiniGames?.lockpicking) {
              MiniGames.lockpicking.currentAngle = angle;
              UI.renderLockpicking();
            }
          }
        }, { passive: true });
      });
      window.addEventListener("keydown", (e) => {
        this.lastInputTime = Date.now();
        this.inputMethod = "key";
        const preventKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Space", "PageUp", "PageDown", "Home", "End"];
        if (!["input", "textarea"].includes(e.target.tagName.toLowerCase())) {
          if (preventKeys.includes(e.key)) e.preventDefault();
        }
        this.handleKeyDown(e);
      }, { passive: false });
      window.addEventListener("keyup", (e) => {
        if (Game.state?.view === "lockpicking") {
          if ([" ", "ArrowUp", "w", "Enter"].includes(e.key)) MiniGames.lockpicking.releaseLock();
        }
      });
    },
    handleKeyDown: function(e) {
      if (this.deleteMode) return;
      if (this.charSelectMode) {
        if (e.key === "ArrowUp") this.navigateCharSlot(-1);
        else if (e.key === "ArrowDown") this.navigateCharSlot(1);
        else if (e.key === "Enter") this.triggerCharSlot();
        else if (["Delete", "Backspace"].includes(e.key)) this.triggerDeleteSlot();
        return;
      }
      if (!Game.state || Game.state.isGameOver) {
        if (this.els.gameOver && !this.els.gameOver.classList.contains("hidden") && (e.key === "Enter" || e.key === " ")) location.reload();
        return;
      }
      if (Game.state.view === "lockpicking") {
        if (["ArrowLeft", "a"].includes(e.key)) MiniGames.lockpicking.rotatePin(-5);
        else if (["ArrowRight", "d"].includes(e.key)) MiniGames.lockpicking.rotatePin(5);
        else if ([" ", "ArrowUp", "w", "Enter"].includes(e.key)) MiniGames.lockpicking.rotateLock();
        else if (e.key === "Escape") MiniGames.lockpicking.end();
        return;
      }
      if (Game.state.view === "hacking") {
        if (e.key === "Escape") MiniGames.hacking.end();
        return;
      }
      if (e.key === "Escape") {
        if (Game.state.inDialog) return;
        if (this.els.playerList?.style.display === "flex") this.togglePlayerList();
        else if (this.els.navMenu && !this.els.navMenu.classList.contains("hidden")) this.toggleMenu();
        else if (Game.state.view === "city") Game.leaveCity();
        else if (["shop", "clinic", "crafting"].includes(Game.state.view)) UI.renderCity?.();
        else if (Game.state.view !== "map") this.switchView("map");
        else this.toggleMenu();
        return;
      }
      if (Game.state.inDialog) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(e.key)) {
          this.navigateFocus(["ArrowRight", "d", "ArrowDown", "s"].includes(e.key) ? 1 : -1);
        } else if (e.key === "Enter" || e.key === " ") this.triggerFocus();
        return;
      }
      if (Game.state.view === "combat") {
        if (typeof Combat !== "undefined") {
          if (["ArrowUp", "w"].includes(e.key)) Combat.moveSelection(-1);
          else if (["ArrowDown", "s"].includes(e.key)) Combat.moveSelection(1);
          else if ([" ", "Enter"].includes(e.key)) Combat.confirmSelection();
        }
        return;
      }
      const isMenuOpen = this.els.navMenu && !this.els.navMenu.classList.contains("hidden");
      if (Game.state.view !== "map" || isMenuOpen) {
        let isGrid = Game.state.view === "inventory" && !isMenuOpen;
        if (["ArrowUp", "w"].includes(e.key)) this.navigateFocus(isGrid ? -4 : -1);
        else if (["ArrowDown", "s"].includes(e.key)) this.navigateFocus(isGrid ? 4 : 1);
        else if (["ArrowLeft", "a"].includes(e.key)) this.navigateFocus(-1);
        else if (["ArrowRight", "d"].includes(e.key)) this.navigateFocus(1);
        else if (["Enter", " "].includes(e.key)) this.triggerFocus();
        return;
      }
      if (Game.state.view === "map") {
        if (["w", "ArrowUp"].includes(e.key)) Game.move(0, -1);
        else if (["s", "ArrowDown"].includes(e.key)) Game.move(0, 1);
        else if (["a", "ArrowLeft"].includes(e.key)) Game.move(-1, 0);
        else if (["d", "ArrowRight"].includes(e.key)) Game.move(1, 0);
        const k = e.key.toLowerCase();
        if (k === "i") this.switchView("inventory");
        else if (k === "c") {
          this.charTab = "status";
          this.switchView("char");
        } else if (k === "m") this.switchView("map");
        else if (k === "j") this.switchView("quests");
      }
    },
    // --- TOUCH JOYSTICK ---
    handleTouchStart: function(e) {
      if (e.target.tagName === "BUTTON" || e.target.closest("button") || e.target.closest(".no-joystick")) return;
      if (!Game.state || Game.state.view !== "map" || Game.state.inDialog || this.touchState.active) return;
      const touch = e.changedTouches[0];
      Object.assign(this.touchState, {
        active: true,
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        moveDir: { x: 0, y: 0 }
      });
      this.showJoystick(touch.clientX, touch.clientY);
      if (this.touchState.timer) clearInterval(this.touchState.timer);
      this.touchState.timer = setInterval(() => this.processJoystickMovement(), 150);
    },
    handleTouchMove: function(e) {
      if (!this.touchState.active) return;
      let touch = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchState.id) {
          touch = e.changedTouches[i];
          break;
        }
      }
      if (!touch) return;
      e.preventDefault();
      this.touchState.currentX = touch.clientX;
      this.touchState.currentY = touch.clientY;
      this.updateJoystickVisuals();
      this.calculateDirection();
    },
    handleTouchEnd: function(e) {
      if (!this.touchState.active) return;
      let found = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchState.id) {
          found = true;
          break;
        }
      }
      if (!found) return;
      this.stopJoystick();
    },
    stopJoystick: function() {
      if (this.touchState.timer) {
        clearInterval(this.touchState.timer);
        this.touchState.timer = null;
      }
      this.touchState.active = false;
      this.touchState.id = null;
      this.touchState.moveDir = { x: 0, y: 0 };
      this.hideJoystick();
    },
    calculateDirection: function() {
      const dx = this.touchState.currentX - this.touchState.startX;
      const dy = this.touchState.currentY - this.touchState.startY;
      const threshold = 20;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
        this.touchState.moveDir = { x: 0, y: 0 };
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        this.touchState.moveDir = { x: dx > 0 ? 1 : -1, y: 0 };
      } else {
        this.touchState.moveDir = { x: 0, y: dy > 0 ? 1 : -1 };
      }
    },
    processJoystickMovement: function() {
      const d = this.touchState.moveDir;
      if (d.x !== 0 || d.y !== 0) {
        Game.move(d.x, d.y);
      }
    },
    showJoystick: function(x, y) {
      if (!this.els.joyBase) this.restoreOverlay();
      if (this.els.joyBase) {
        this.els.joyBase.style.left = x - 50 + "px";
        this.els.joyBase.style.top = y - 50 + "px";
        this.els.joyBase.style.display = "block";
      }
      if (this.els.joyStick) {
        this.els.joyStick.style.left = x - 25 + "px";
        this.els.joyStick.style.top = y - 25 + "px";
        this.els.joyStick.style.display = "block";
      }
    },
    updateJoystickVisuals: function() {
      if (!this.els.joyBase) return;
      const dx = this.touchState.currentX - this.touchState.startX;
      const dy = this.touchState.currentY - this.touchState.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 40;
      let visualX = dx;
      let visualY = dy;
      if (dist > maxDist) {
        const ratio = maxDist / dist;
        visualX = dx * ratio;
        visualY = dy * ratio;
      }
      this.els.joyStick.style.transform = `translate(${visualX}px, ${visualY}px)`;
    },
    hideJoystick: function() {
      if (this.els.joyBase) this.els.joyBase.style.display = "none";
      if (this.els.joyStick) {
        this.els.joyStick.style.display = "none";
        this.els.joyStick.style.transform = "translate(0px, 0px)";
      }
    },
    toggleMenu: function() {
      if (!this.els.navMenu) return;
      const isHidden = this.els.navMenu.classList.contains("hidden");
      if (isHidden) {
        this.els.navMenu.classList.remove("hidden");
        this.els.navMenu.style.display = "flex";
      } else {
        this.els.navMenu.classList.add("hidden");
        this.els.navMenu.style.display = "none";
      }
      this.focusIndex = -1;
      this.refreshFocusables();
    },
    refreshFocusables: function() {
      let container = this.els.view;
      if (Game.state && Game.state.inDialog && this.els.dialog && this.els.dialog.style.display !== "none") {
        container = this.els.dialog;
      } else if (this.els.navMenu && !this.els.navMenu.classList.contains("hidden")) {
        container = this.els.navMenu;
      } else if (this.els.playerList && this.els.playerList.style.display === "flex") {
        container = this.els.playerList;
      }
      const buttons = Array.from(container.querySelectorAll("button:not([disabled])"));
      this.focusableEls = buttons.filter((b) => b.offsetParent !== null && b.style.display !== "none");
      if (this.inputMethod === "touch") {
        this.focusIndex = -1;
      } else {
        if (this.focusIndex >= this.focusableEls.length) this.focusIndex = 0;
        if (this.focusIndex < 0 && this.focusableEls.length > 0) this.focusIndex = 0;
      }
      this.updateFocusVisuals();
    },
    navigateFocus: function(delta) {
      if (this.focusableEls.length === 0) this.refreshFocusables();
      if (this.focusableEls.length === 0) return;
      if (this.focusIndex === -1) {
        this.focusIndex = delta > 0 ? 0 : this.focusableEls.length - 1;
      } else {
        this.focusIndex += delta;
      }
      if (this.focusIndex < 0) this.focusIndex = this.focusableEls.length - 1;
      if (this.focusIndex >= this.focusableEls.length) this.focusIndex = 0;
      this.updateFocusVisuals();
    },
    updateFocusVisuals: function() {
      document.querySelectorAll(".key-focus").forEach((el) => el.classList.remove("key-focus"));
      if (this.inputMethod === "key" && this.focusIndex !== -1 && this.focusableEls[this.focusIndex]) {
        const el = this.focusableEls[this.focusIndex];
        el.classList.add("key-focus");
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    },
    triggerFocus: function() {
      if (this.focusableEls[this.focusIndex]) {
        this.focusableEls[this.focusIndex].click();
      }
    }
  });

  // src/ui/ui_view_inv.js
  Object.assign(UI, {
    // [v0.7.0] VIEW STATE
    charTab: "status",
    // --- INVENTAR ---
    renderInventory: function() {
      const list = document.getElementById("inventory-list");
      const countDisplay = document.getElementById("inv-count");
      const capsDisplay = document.getElementById("inv-caps");
      if (!list) return;
      list.innerHTML = "";
      if (capsDisplay) capsDisplay.textContent = Game.state.caps;
      const usedSlots = Game.getUsedSlots();
      const maxSlots = Game.getMaxSlots();
      if (countDisplay) {
        let backpackName = "";
        if (Game.state.equip && Game.state.equip.back) {
          const bp = Game.state.equip.back;
          backpackName = bp.props && bp.props.name ? bp.props.name : bp.name;
        }
        countDisplay.innerHTML = `
                <div class="flex flex-col items-end leading-tight">
                    <span class="text-sm">${usedSlots} / ${maxSlots}</span>
                    ${backpackName ? `<span class="text-[10px] text-[#39ff14] font-bold tracking-wider border-t border-green-900 mt-0.5 pt-0.5">🎒 ${backpackName}</span>` : '<span class="text-[9px] text-gray-600 border-t border-gray-800 mt-0.5 pt-0.5">KEIN RUCKSACK</span>'}
                </div>
            `;
        countDisplay.className = usedSlots >= maxSlots ? "text-red-500 font-bold animate-pulse" : "text-white font-mono";
      }
      const getIcon = (type) => {
        switch (type) {
          case "weapon":
            return "🔫";
          case "body":
            return "🛡️";
          case "head":
            return "🪖";
          case "legs":
            return "👖";
          case "feet":
            return "🥾";
          case "arms":
            return "🦾";
          case "back":
            return "🎒";
          case "consumable":
            return "💉";
          case "junk":
            return "⚙️";
          case "component":
            return "🔩";
          case "ammo":
            return "🧨";
          case "blueprint":
            return "📜";
          case "tool":
            return "⛺";
          default:
            return "📦";
        }
      };
      const itemBild = (id, type) => {
        if (typeof Game.itemBildPfad !== "function") return getIcon(type);
        const pfad = Game.itemBildPfad(id);
        if (!pfad) return getIcon(type);
        return `<img src="${pfad}" alt="" class="w-8 h-8 object-contain"
                        onerror="this.replaceWith(document.createTextNode('${getIcon(type)}'))">`;
      };
      const createBtn = (itemDef, entry, isEquipped, label, onClick) => {
        const btn = document.createElement("div");
        let cssClass = "relative border border-green-500 bg-green-900/30 w-full h-16 flex flex-col items-center justify-center transition-colors group";
        if (onClick) cssClass += " cursor-pointer hover:bg-green-500 hover:text-black";
        else cssClass += " cursor-default opacity-80";
        if (entry && entry.isNew && !isEquipped) {
          cssClass += " new-item-glow";
        }
        btn.className = cssClass;
        let displayName = entry.props && entry.props.name ? entry.props.name : itemDef.name;
        let extraClass = entry.props && entry.props.color ? entry.props.color : "";
        const countDisplay2 = entry.count > 1 || itemDef.type === "ammo" ? `<div class="absolute top-0 right-0 bg-green-900 text-white text-[10px] px-1 font-mono">${entry.count}</div>` : "";
        btn.innerHTML = `
                <div class="text-2xl flex items-center justify-center">${itemBild(itemDef.id, itemDef.type)}</div>
                <div class="text-[10px] truncate max-w-full px-1 font-bold ${extraClass}">${displayName}</div>
                ${countDisplay2}
            `;
        if (isEquipped) {
          const overlay = document.createElement("div");
          overlay.className = "absolute inset-0 bg-black/60 border-2 border-green-500 flex items-center justify-center text-green-500 font-bold tracking-widest text-[10px] pointer-events-none";
          overlay.textContent = label || "AUSGERÜSTET";
          btn.appendChild(overlay);
          btn.style.borderColor = "#39ff14";
        }
        const markAsRead = () => {
          if (entry && entry.isNew) {
            entry.isNew = false;
            btn.classList.remove("new-item-glow");
          }
        };
        btn.onmouseenter = markAsRead;
        btn.onclick = (e) => {
          e.stopPropagation();
          markAsRead();
          if (onClick) onClick();
        };
        return btn;
      };
      const cats = {
        equip: { label: "🛡️ AUSRÜSTUNG", items: [] },
        aid: { label: "💉 HILFSMITTEL", items: [] },
        misc: { label: "⚙️ MATERIAL", items: [] }
      };
      const equippedList = [];
      Game.state.inventory.forEach((entry, index) => {
        if (entry.count <= 0) return;
        const item = Game.items[entry.id];
        if (!item) return;
        if (entry.id === "camp_kit" && Game.state.camp) {
          const btn2 = createBtn(item, entry, true, "AUFGESTELLT", null);
          equippedList.push(btn2);
          return;
        }
        const onClick = () => UI.showItemConfirm(index);
        const btn = createBtn(item, entry, false, null, onClick);
        if (["weapon", "head", "body", "arms", "legs", "feet", "back", "tool"].includes(item.type)) {
          cats.equip.items.push(btn);
        } else if (item.type === "consumable") {
          cats.aid.items.push(btn);
        } else {
          cats.misc.items.push(btn);
        }
      });
      let hasItems = false;
      ["equip", "aid", "misc"].forEach((key) => {
        if (cats[key].items.length > 0) {
          hasItems = true;
          const header = document.createElement("div");
          header.className = "col-span-4 bg-green-900/40 text-green-300 text-xs font-bold px-2 py-1 mt-2 border-b border-green-700 tracking-wider flex items-center gap-2";
          header.innerHTML = cats[key].label;
          list.appendChild(header);
          cats[key].items.forEach((btn) => list.appendChild(btn));
        }
      });
      const slots = ["weapon", "head", "body", "arms", "legs", "feet", "back"];
      slots.forEach((slot) => {
        const equippedItem = Game.state.equip[slot];
        if (!equippedItem) return;
        let baseDef = Game.items[equippedItem.id];
        if (!baseDef) {
          const key = Object.keys(Game.items).find((k) => Game.items[k].name === equippedItem.name);
          if (key) baseDef = Game.items[key];
        }
        if (!baseDef) baseDef = equippedItem;
        const onClick = () => UI.showEquippedDialog(slot);
        const fakeEntry = {
          id: equippedItem.id,
          count: 1,
          props: equippedItem.props,
          isNew: false
        };
        const btn = createBtn(baseDef, fakeEntry, true, "AUSGERÜSTET", onClick);
        equippedList.push(btn);
      });
      if (equippedList.length > 0) {
        const sep = document.createElement("div");
        sep.className = "col-span-4 flex items-center justify-center text-[10px] text-green-900 font-bold tracking-widest my-2 opacity-80 mt-6";
        sep.innerHTML = "<span class='bg-black px-2 border-b border-green-900 w-full text-center'>--- AKTIV AUSGERÜSTET ---</span>";
        list.appendChild(sep);
        equippedList.forEach((b) => list.appendChild(b));
      }
      if (!hasItems && equippedList.length === 0) {
        list.innerHTML = '<div class="col-span-4 text-center text-gray-500 italic mt-10">Leerer Rucksack...</div>';
      }
    }
  });

  // src/ui/ui_view_world.js
  Object.assign(UI, {
    mapState: {
      offsetX: 0,
      offsetY: 0,
      scale: 3,
      minScale: 0.5,
      maxScale: 12,
      isDragging: false,
      isPinching: false,
      lastX: 0,
      lastY: 0,
      pinchStartDist: 0,
      pinchStartScale: 3,
      needsRender: true,
      centeredOnce: false,
      worldBuffer: null,
      lastExploredCount: 0
    },
    getTouchDistance: function(t1, t2) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },
    initWorldMapInteraction: function() {
      const cvs = document.getElementById("world-map-canvas");
      if (!cvs) return;
      if (Game.state && Game.state.player && !this.mapState.centeredOnce) {
        const rect = cvs.getBoundingClientRect();
        if (rect.width > 0) {
          this.centerMapOnPlayer(cvs, rect);
          this.mapState.centeredOnce = true;
        }
      }
      this.updateWorldBuffer();
      cvs.onmousedown = (e) => {
        if (e.button !== 0) return;
        this.mapState.isDragging = true;
        this.mapState.lastX = e.clientX;
        this.mapState.lastY = e.clientY;
        cvs.style.cursor = "grabbing";
      };
      cvs.onmousemove = (e) => {
        if (this.mapState.isDragging) {
          const dx = e.clientX - this.mapState.lastX;
          const dy = e.clientY - this.mapState.lastY;
          this.mapState.offsetX += dx;
          this.mapState.offsetY += dy;
          this.mapState.lastX = e.clientX;
          this.mapState.lastY = e.clientY;
          this.mapState.needsRender = true;
        }
      };
      const stopDrag = () => {
        this.mapState.isDragging = false;
        cvs.style.cursor = "move";
      };
      cvs.onmouseup = stopDrag;
      cvs.onmouseleave = stopDrag;
      cvs.onwheel = (e) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const dir = e.deltaY < 0 ? 1 : -1;
        let newScale = this.mapState.scale * (dir > 0 ? zoomFactor : 1 / zoomFactor);
        newScale = Math.max(this.mapState.minScale, Math.min(this.mapState.maxScale, newScale));
        const rect = cvs.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        this.mapState.offsetX = mx - (mx - this.mapState.offsetX) / this.mapState.scale * newScale;
        this.mapState.offsetY = my - (my - this.mapState.offsetY) / this.mapState.scale * newScale;
        this.mapState.scale = newScale;
        this.mapState.needsRender = true;
      };
      cvs.ontouchstart = (e) => {
        if (e.touches.length === 1) {
          this.mapState.isDragging = true;
          this.mapState.isPinching = false;
          this.mapState.lastX = e.touches[0].clientX;
          this.mapState.lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          this.mapState.isDragging = false;
          this.mapState.isPinching = true;
          this.mapState.pinchStartDist = this.getTouchDistance(e.touches[0], e.touches[1]);
          this.mapState.pinchStartScale = this.mapState.scale;
        }
      };
      cvs.ontouchmove = (e) => {
        e.preventDefault();
        if (this.mapState.isDragging && e.touches.length === 1) {
          const dx = e.touches[0].clientX - this.mapState.lastX;
          const dy = e.touches[0].clientY - this.mapState.lastY;
          this.mapState.offsetX += dx;
          this.mapState.offsetY += dy;
          this.mapState.lastX = e.touches[0].clientX;
          this.mapState.lastY = e.touches[0].clientY;
          this.mapState.needsRender = true;
        } else if (this.mapState.isPinching && e.touches.length === 2) {
          const newDist = this.getTouchDistance(e.touches[0], e.touches[1]);
          const scaleRatio = newDist / this.mapState.pinchStartDist;
          let newScale = this.mapState.pinchStartScale * scaleRatio;
          newScale = Math.max(this.mapState.minScale, Math.min(this.mapState.maxScale, newScale));
          const rect = cvs.getBoundingClientRect();
          const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          const my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          this.mapState.offsetX = mx - (mx - this.mapState.offsetX) / this.mapState.scale * newScale;
          this.mapState.offsetY = my - (my - this.mapState.offsetY) / this.mapState.scale * newScale;
          this.mapState.scale = newScale;
          this.mapState.needsRender = true;
        }
      };
      cvs.ontouchend = (e) => {
        this.mapState.isDragging = false;
        if (e.touches.length < 2) this.mapState.isPinching = false;
      };
    },
    updateWorldBuffer: function() {
      if (!Game.state || !Game.state.explored) return;
      const totalW = Game.WORLD_W * Game.MAP_W;
      const totalH = Game.WORLD_H * Game.MAP_H;
      if (!this.mapState.worldBuffer) {
        this.mapState.worldBuffer = document.createElement("canvas");
        this.mapState.worldBuffer.width = totalW;
        this.mapState.worldBuffer.height = totalH;
        const ctx2 = this.mapState.worldBuffer.getContext("2d");
        ctx2.fillStyle = "#000000";
        ctx2.fillRect(0, 0, totalW, totalH);
        this.mapState.lastExploredCount = 0;
      }
      const ctx = this.mapState.worldBuffer.getContext("2d");
      const keys = Object.keys(Game.state.explored);
      if (keys.length === this.mapState.lastExploredCount) return;
      const colors = {
        ".": "#4a4036",
        ",": "#6e6259",
        "_": "#8b5a2b",
        '"': "#1a3300",
        ";": "#1e1e11",
        "~": "#2244aa",
        "^": "#6b5b45",
        "Y": "#333333",
        "#": "#222222",
        "=": "#555555",
        "+": "#654321",
        "t": "#0f2405",
        "V": "#ffcc00",
        "C": "#ff4400",
        "G": "#cccccc",
        "X": "#8B4513"
      };
      keys.forEach((key) => {
        const parts = key.split("_");
        if (parts.length !== 2) return;
        const [sx, sy] = parts[0].split(",").map(Number);
        const [lx, ly] = parts[1].split(",").map(Number);
        const tileChar = Game.state.explored[key];
        const gx = sx * Game.MAP_W + lx;
        const gy = sy * Game.MAP_H + ly;
        ctx.fillStyle = colors[tileChar] || "#4a4036";
        ctx.fillRect(gx, gy, 1, 1);
      });
      this.mapState.lastExploredCount = keys.length;
      this.mapState.needsRender = true;
    },
    centerMapOnPlayer: function(cvs, rect) {
      if (!Game.state) return;
      this.mapState.scale = 3;
      const globalX = Game.state.sector.x * Game.MAP_W + Game.state.player.x;
      const globalY = Game.state.sector.y * Game.MAP_H + Game.state.player.y;
      this.mapState.offsetX = rect.width / 2 - globalX * this.mapState.scale;
      this.mapState.offsetY = rect.height / 2 - globalY * this.mapState.scale;
      this.mapState.needsRender = true;
    },
    renderWorldMap: function() {
      if (!Game || !Game.state) return;
      const cvs = document.getElementById("world-map-canvas");
      if (!cvs) return;
      const ctx = cvs.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      const rect = cvs.parentElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        requestAnimationFrame(() => this.renderWorldMap());
        return;
      }
      const targetWidth = Math.floor(rect.width * dpr);
      const targetHeight = Math.floor(rect.height * dpr);
      if (cvs.width !== targetWidth || cvs.height !== targetHeight) {
        cvs.width = targetWidth;
        cvs.height = targetHeight;
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = false;
        this.centerMapOnPlayer(cvs, rect);
        this.mapState.needsRender = true;
      }
      if (!cvs.dataset.init) {
        this.initWorldMapInteraction();
        cvs.dataset.init = "true";
        if (!this.mapState.centeredOnce) {
          this.centerMapOnPlayer(cvs, rect);
          this.mapState.centeredOnce = true;
        }
      }
      this.updateWorldBuffer();
      ctx.fillStyle = "#050a05";
      ctx.fillRect(0, 0, rect.width, rect.height);
      const s = this.mapState.scale;
      const ox = this.mapState.offsetX;
      const oy = this.mapState.offsetY;
      if (this.mapState.worldBuffer) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          this.mapState.worldBuffer,
          ox,
          oy,
          this.mapState.worldBuffer.width * s,
          this.mapState.worldBuffer.height * s
        );
      }
      ctx.strokeStyle = "rgba(0, 255, 0, 0.1)";
      ctx.lineWidth = 1;
      const gridSize = 50 * s;
      const startGridX = Math.floor(-ox / gridSize);
      const endGridX = Math.ceil((rect.width - ox) / gridSize);
      const startGridY = Math.floor(-oy / gridSize);
      const endGridY = Math.ceil((rect.height - oy) / gridSize);
      ctx.beginPath();
      for (let x = startGridX; x <= endGridX; x++) {
        const pos = ox + x * gridSize;
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, rect.height);
      }
      for (let y = startGridY; y <= endGridY; y++) {
        const pos = oy + y * gridSize;
        ctx.moveTo(0, pos);
        ctx.lineTo(rect.width, pos);
      }
      ctx.stroke();
      const currSX = Game.state.sector.x;
      const currSY = Game.state.sector.y;
      const pGlobalX = currSX * Game.MAP_W + Game.state.player.x;
      const pGlobalY = currSY * Game.MAP_H + Game.state.player.y;
      const pDrawX = pGlobalX * s + ox + s / 2;
      const pDrawY = pGlobalY * s + oy + s / 2;
      const pulse = 10 + Math.sin(Date.now() / 200) * 3;
      ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(pDrawX, pDrawY, Math.max(5, pulse * (s / 3)), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#39ff14";
      ctx.beginPath();
      ctx.arc(pDrawX, pDrawY, Math.max(2, 4 * (s / 3)), 0, Math.PI * 2);
      ctx.fill();
      let activePOIs = [];
      if (typeof WorldGen !== "undefined" && WorldGen.locations) {
        if (WorldGen.locations.vault) activePOIs.push({ x: WorldGen.locations.vault.x, y: WorldGen.locations.vault.y, type: "V" });
        if (WorldGen.locations.city) activePOIs.push({ x: WorldGen.locations.city.x, y: WorldGen.locations.city.y, type: "C" });
        if (WorldGen.locations.ghostTown) activePOIs.push({ x: WorldGen.locations.ghostTown.x, y: WorldGen.locations.ghostTown.y, type: "G" });
      } else if (Game.state.worldPOIs) {
        activePOIs = Game.state.worldPOIs;
      }
      activePOIs.forEach((poi) => {
        const mapW = Game.MAP_W || 50;
        const mapH = Game.MAP_H || 50;
        const px = (poi.x * mapW + mapW / 2) * s + ox;
        const py = (poi.y * mapH + mapH / 2) * s + oy;
        if (px > -50 && px < rect.width + 50 && py > -50 && py < rect.height + 50) {
          ctx.font = `bold ${Math.max(12, 16 * (s / 3))}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          let icon = "❓";
          if (poi.type === "V") icon = "⚙️";
          if (poi.type === "C") icon = "🏙️";
          if (poi.type === "G") icon = "👻";
          ctx.shadowColor = "black";
          ctx.shadowBlur = 4;
          ctx.fillStyle = "#fff";
          ctx.fillText(icon, px, py);
          ctx.shadowBlur = 0;
        }
      });
      this.drawCompass(ctx, rect.width, rect.height);
      this.updateLocationText();
      if (Game.state.view === "worldmap") requestAnimationFrame(() => this.renderWorldMap());
    },
    drawBackgroundGrid: function(ctx, w, h) {
    },
    drawCompass: function(ctx, w, h) {
      const cx = w - 60;
      const cy = h - 60;
      const r = 30;
      ctx.fillStyle = "rgba(0, 20, 0, 0.8)";
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#00ff00";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N", cx, cy - r + 10);
      ctx.fillText("S", cx, cy + r - 10);
      ctx.fillText("W", cx - r + 10, cy);
      ctx.fillText("O", cx + r - 10, cy);
      ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
      ctx.beginPath();
      ctx.moveTo(cx, cy - r + 15);
      ctx.lineTo(cx, cy + r - 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r + 15, cy);
      ctx.lineTo(cx + r - 15, cy);
      ctx.stroke();
      ctx.fillStyle = "#39ff14";
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
    },
    updateLocationText: function() {
      const el = document.getElementById("world-location-text");
      if (!el) return;
      if (!this._lastLocUpdate || Date.now() - this._lastLocUpdate > 500) {
        let txt = `SEKTOR [${Game.state.sector.x}, ${Game.state.sector.y}]`;
        if (Game.state.zone) {
          let zoneName = Game.state.zone.split("(")[0].trim();
          txt += ` // ${zoneName.toUpperCase()}`;
        } else {
          txt += " // UNBEKANNTES GEBIET";
        }
        el.innerText = txt;
        this._lastLocUpdate = Date.now();
      }
    }
  });

  // src/ui/ui_view_town.js
  Object.assign(UI, {
    // Default Shop Menge
    shopQty: 1,
    // ==========================================
    // === KLINIK (Dr. Zimmermann) ===
    // ==========================================
    renderClinic: function() {
      Game.state.view = "clinic";
      const view = document.getElementById("view-container");
      if (!view) return;
      view.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "w-full h-full flex flex-col bg-black/95 relative";
      wrapper.innerHTML = `
            <div class="flex-shrink-0 p-4 border-b-2 border-red-600 bg-red-900/20 text-center shadow-lg shadow-red-900/20">
                <h2 class="text-3xl text-red-500 font-bold tracking-widest font-vt323">DR. ZIMMERMANN</h2>
                <div class="text-xs text-red-300 tracking-wider">MEDIZINISCHES ZENTRUM</div>
            </div>
            
            <div class="flex-grow flex flex-col items-center justify-center p-6 gap-6 text-center overflow-y-auto">
                <div class="text-7xl animate-pulse filter drop-shadow-[0_0_15px_red]">⚕️</div>
                
                <div class="border-2 border-red-800 p-4 bg-black/80 w-full max-w-md shadow-inner shadow-red-900/30">
                    <div class="text-red-400 mb-2 font-bold border-b border-red-900 pb-1 tracking-widest text-sm">PATIENTEN STATUS</div>
                    <div class="flex justify-between text-lg font-mono mb-1">
                        <span>GESUNDHEIT:</span> 
                        <span class="${Game.state.hp < Game.state.maxHp ? "text-red-500 blink-red" : "text-green-500"}">${Math.floor(Game.state.hp)} / ${Game.state.maxHp}</span>
                    </div>
                    <div class="flex justify-between text-lg font-mono">
                        <span>STRAHLUNG:</span> 
                        <span class="${Game.state.rads > 0 ? "text-red-500 animate-pulse" : "text-green-500"}">${Math.floor(Game.state.rads)} RADS</span>
                    </div>
                </div>

                <div class="text-gray-400 italic text-sm max-w-md leading-relaxed border-l-2 border-red-900 pl-3 text-left">
                    "Ich kann Sie wieder zusammenflicken. Entfernt Strahlung und heilt alle Verletzungen. Kostet aber ein bisschen was für die... Materialien."
                </div>

                <button onclick="Game.heal()" class="action-button w-full max-w-md py-4 text-xl border-2 border-red-500 text-red-500 hover:bg-red-900/50 font-bold transition-all" ${Game.state.caps < 25 ? "disabled" : ""}>
                    KOMPLETTBEHANDLUNG (25 KK)
                </button>
            </div>

            <div class="flex-shrink-0 p-3 border-t border-red-900 bg-[#0a0000]">
                <button class="action-button w-full border-gray-600 text-gray-500 hover:text-white hover:border-white transition-colors" onclick="UI.renderCity()">ZURÜCK ZUM ZENTRUM</button>
            </div>
        `;
      view.appendChild(wrapper);
    },
    // ==========================================
    // === WERKBANK (Crafting & Scrap) ===
    // ==========================================
    renderCrafting: function(tab = "create") {
      Game.state.view = "crafting";
      const view = document.getElementById("view-container");
      if (!view) return;
      view.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "absolute inset-0 w-full h-full flex flex-col bg-black/95 z-20 overflow-hidden";
      const scrollContainer = document.createElement("div");
      scrollContainer.className = "flex-1 overflow-y-auto overflow-x-hidden custom-scroll pb-24";
      const header = document.createElement("div");
      header.className = "p-4 border-b-2 border-blue-500 bg-blue-900/20 flex justify-between items-end shadow-lg shadow-blue-900/20";
      header.innerHTML = `
            <div>
                <h2 class="text-3xl text-blue-400 font-bold font-vt323 tracking-widest">WERKBANK</h2>
                <div class="text-xs text-blue-300 tracking-wider">Zustand: Rostig, aber funktional</div>
            </div>
            <div class="text-4xl text-blue-500 opacity-50">🛠️</div>
        `;
      scrollContainer.appendChild(header);
      const tabsDiv = document.createElement("div");
      tabsDiv.className = "flex w-full border-b border-blue-900 bg-black";
      tabsDiv.innerHTML = `
            <button class="flex-1 py-3 font-bold transition-colors uppercase tracking-wider ${tab === "create" ? "bg-blue-900/40 text-blue-300 border-b-4 border-blue-500" : "text-gray-600 hover:text-blue-300 hover:bg-blue-900/20"}" onclick="UI.renderCrafting('create')">HERSTELLEN</button>
            <button class="flex-1 py-3 font-bold transition-colors uppercase tracking-wider ${tab === "scrap" ? "bg-orange-900/40 text-orange-300 border-b-4 border-orange-500" : "text-gray-600 hover:text-orange-300 hover:bg-orange-900/20"}" onclick="UI.renderCrafting('scrap')">ZERLEGEN</button>
        `;
      scrollContainer.appendChild(tabsDiv);
      const listContent = document.createElement("div");
      listContent.id = "crafting-list";
      listContent.className = "p-3 space-y-2 bg-[#00050a]";
      scrollContainer.appendChild(listContent);
      const footer = document.createElement("div");
      footer.className = "absolute bottom-0 left-0 w-full p-4 bg-black border-t-2 border-blue-900 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.9)]";
      footer.innerHTML = `
            <button onclick="UI.renderCity()" class="action-button w-full border-gray-600 text-gray-500 hover:text-white hover:border-white transition-colors py-3 font-bold tracking-widest uppercase bg-black">
                ZURÜCK ZUM ZENTRUM
            </button>
        `;
      wrapper.appendChild(scrollContainer);
      wrapper.appendChild(footer);
      view.appendChild(wrapper);
      if (tab === "create") {
        const recipes = Game.recipes || [];
        const known = Game.state.knownRecipes || [];
        let knownCount = 0;
        recipes.forEach((recipe) => {
          if (recipe.type === "cooking") return;
          if (!known.includes(recipe.id) && recipe.lvl > 1) return;
          if (recipe.out === "camp_kit") {
            const hasKit = Game.state.inventory.some((i) => i.id === "camp_kit");
            const hasBuilt = !!Game.state.camp;
            if (hasKit || hasBuilt) return;
          }
          knownCount++;
          const outItem = (recipe.out === "AMMO" ? { name: "15x Munition" } : Game.items[recipe.out]) || { name: "Unbekanntes Item" };
          let reqHtml = "";
          let canCraft = true;
          for (let reqId in recipe.req) {
            const countNeeded = recipe.req[reqId];
            const invItem = Game.state.inventory.find((i) => i.id === reqId);
            const countHave = invItem ? invItem.count : 0;
            const reqDef = Game.items[reqId];
            const reqName = reqDef ? reqDef.name : reqId;
            let color = "text-green-600";
            if (countHave < countNeeded) {
              canCraft = false;
              color = "text-red-500 font-bold";
            }
            reqHtml += `<div class="${color} text-xs uppercase">• ${reqName}: ${countHave}/${countNeeded}</div>`;
          }
          if (Game.state.lvl < recipe.lvl) {
            canCraft = false;
            reqHtml += `<div class="text-red-500 text-xs mt-1 font-bold">Benötigt Level ${recipe.lvl}</div>`;
          }
          const div = document.createElement("div");
          div.className = `border ${canCraft ? "border-green-600 bg-green-900/10" : "border-gray-800 bg-black opacity-50"} p-3 flex justify-between items-center transition-all hover:bg-green-900/20`;
          div.innerHTML = `
                    <div>
                        <div class="font-bold ${canCraft ? "text-green-300" : "text-gray-500"} text-lg">${outItem.name}</div>
                        <div class="grid grid-cols-2 gap-x-4 mt-1 border-l-2 border-green-900 pl-2">${reqHtml}</div>
                    </div>
                    <button class="action-button text-sm px-4 py-2 border-2 ${canCraft ? "border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-bold" : "border-gray-600 text-gray-600 cursor-not-allowed"}" onclick="Game.craftItem('${recipe.id}')" ${canCraft ? "" : "disabled"}>FERTIGEN</button>
                `;
          listContent.appendChild(div);
        });
        if (knownCount === 0) listContent.innerHTML = '<div class="text-gray-500 italic mt-10 text-center">Keine bekannten Baupläne.</div>';
      } else {
        let scrappables = [];
        Game.state.inventory.forEach((item, idx) => {
          const def = Game.items[item.id];
          if (!def) return;
          if (item.id === "junk_metal" || item.id === "camp_kit") return;
          if (def.type === "blueprint") return;
          if (["weapon", "body", "head", "legs", "feet", "arms", "junk"].includes(def.type)) {
            scrappables.push({ idx, item, def });
          }
        });
        if (scrappables.length === 0) {
          listContent.innerHTML = '<div class="text-center text-gray-500 mt-10 p-4 border-2 border-dashed border-gray-800">Kein zerlegbarer Schrott im Inventar.</div>';
        } else {
          scrappables.forEach((entry) => {
            const name = entry.item.props && entry.item.props.name ? entry.item.props.name : entry.def.name;
            const div = document.createElement("div");
            div.className = "flex justify-between items-center p-3 border border-orange-800 bg-orange-900/10 hover:bg-orange-900/20 transition-colors";
            div.innerHTML = `
                        <div class="font-bold text-orange-300">${name} <span class="text-xs text-orange-600 font-normal ml-2">(${entry.item.count}x)</span></div>
                        <button class="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black px-3 py-1 text-xs font-bold transition-colors uppercase" onclick="Game.scrapItem(${entry.idx})">ZERLEGEN</button>
                    `;
            listContent.appendChild(div);
          });
        }
      }
    },
    // ==========================================
    // === CITY HUB ===
    // ==========================================
    renderCity: function(cityId = "rusty_springs") {
      const view = document.getElementById("view-container");
      if (!view) return;
      view.innerHTML = "";
      Game.state.view = "city";
      const cityData = {
        "rusty_springs": {
          name: "RUSTY SPRINGS",
          pop: 142,
          sec: "HOCH",
          rad: "NIEDRIG",
          flairs: [
            "Die Luft riecht nach Rost und Ozon.",
            "Ein Generator brummt in der Ferne.",
            "Händler schreien ihre Preise aus.",
            "Der sicherste Ort im Sektor."
          ]
        }
      };
      const data = cityData[cityId] || cityData["rusty_springs"];
      const flair = data.flairs[Math.floor(Math.random() * data.flairs.length)];
      const wrapper = document.createElement("div");
      wrapper.className = "w-full h-full flex flex-col bg-black relative overflow-hidden";
      const header = document.createElement("div");
      header.className = "flex-shrink-0 flex flex-col border-b-4 border-green-900 bg-[#001100] p-4 relative shadow-lg z-10";
      header.innerHTML = `
            <div class="flex justify-between items-start z-10 relative">
                <div>
                    <h1 class="text-5xl md:text-6xl font-bold text-green-400 tracking-widest text-shadow-glow font-vt323 leading-none">${data.name}</h1>
                    <div class="text-green-600 text-sm italic mt-1 font-mono">"${flair}"</div>
                </div>
                <div class="bg-black/60 border-2 border-yellow-600 p-2 flex flex-col items-end shadow-[0_0_15px_rgba(200,150,0,0.3)] min-w-[120px]">
                    <span class="text-[10px] text-yellow-700 font-bold tracking-widest">VERMÖGEN</span>
                    <span class="text-2xl text-yellow-400 font-bold font-vt323 tracking-wider">${Game.state.caps} KK</span>
                </div>
            </div>

            <div class="flex gap-4 mt-2 pt-2 border-t border-green-900/50 text-xs font-mono z-10 uppercase tracking-widest">
                <div class="bg-green-900/30 px-2 py-1 border-l-2 border-green-500">POP: <span class="text-green-300 font-bold">${data.pop}</span></div>
                <div class="bg-cyan-900/30 px-2 py-1 border-l-2 border-cyan-500">SEC: <span class="text-cyan-300 font-bold">${data.sec}</span></div>
                <div class="bg-yellow-900/30 px-2 py-1 border-l-2 border-yellow-500">RAD: <span class="text-yellow-300 font-bold">${data.rad}</span></div>
            </div>
        `;
      wrapper.appendChild(header);
      const grid = document.createElement("div");
      grid.className = "flex-grow overflow-y-auto custom-scrollbar p-4 grid grid-cols-1 md:grid-cols-2 gap-4 content-start bg-[#050a05]";
      const createCard = (conf) => {
        const card = document.createElement("div");
        let baseClass = "relative overflow-hidden group cursor-pointer p-4 flex items-center gap-4 border-2 transition-all duration-200 bg-black/80 hover:bg-[#0a1a0a] shadow-md min-h-[100px]";
        let baseColor = "border-green-600 hover:border-green-400 shadow-green-900/20";
        if (conf.type === "trader") {
          baseClass += " md:col-span-2 border-yellow-600 hover:border-yellow-400 shadow-yellow-900/20 h-32";
        } else if (conf.type === "clinic") {
          baseClass += " border-red-600 hover:border-red-400 shadow-red-900/20";
        } else if (conf.type === "craft") {
          baseClass += " border-blue-600 hover:border-blue-400 shadow-blue-900/20";
        } else if (conf.type === "gamble") {
          baseClass += " border-yellow-400 hover:border-yellow-200 shadow-yellow-600/30";
        } else {
          baseClass += " " + baseColor;
        }
        card.className = baseClass;
        card.onclick = conf.onClick;
        const iconSize = conf.type === "trader" ? "text-6xl" : "text-5xl";
        const palettes = {
          green: {
            title: "text-green-500 group-hover:text-green-300",
            sub: "text-green-700 group-hover:text-green-500",
            glow: "via-green-900/10"
          },
          yellow: {
            title: "text-yellow-500 group-hover:text-yellow-300",
            sub: "text-yellow-700 group-hover:text-yellow-500",
            glow: "via-yellow-900/10"
          },
          red: {
            title: "text-red-500 group-hover:text-red-300",
            sub: "text-red-700 group-hover:text-red-500",
            glow: "via-red-900/10"
          },
          blue: {
            title: "text-blue-500 group-hover:text-blue-300",
            sub: "text-blue-700 group-hover:text-blue-500",
            glow: "via-blue-900/10"
          }
        };
        const palette = palettes[conf.type === "trader" ? "yellow" : conf.type === "clinic" ? "red" : conf.type === "craft" ? "blue" : "green"];
        card.innerHTML = `
                <div class="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent ${palette.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                
                <div class="icon flex-shrink-0 ${iconSize} z-10 relative filter drop-shadow-md">${conf.icon}</div>
                <div class="flex flex-col z-10 relative">
                    <span class="text-2xl font-bold ${palette.title} tracking-wider font-vt323 uppercase">${conf.label}</span>
                    <span class="text-xs ${palette.sub} font-mono uppercase tracking-widest mt-1">${conf.sub}</span>
                </div>
                <div class="absolute right-4 text-2xl opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${palette.title}">▶</div>
            `;
        return card;
      };
      grid.appendChild(createCard({
        type: "trader",
        icon: "🛒",
        label: "HANDELSPOSTEN",
        sub: "Waffen • Munition • An- & Verkauf",
        onClick: () => {
          if (UI.renderShop) UI.renderShop();
        }
      }));
      grid.appendChild(createCard({
        type: "clinic",
        icon: "⚕️",
        label: "KLINIK",
        sub: "Dr. Zimmermann",
        onClick: () => {
          if (UI.renderClinic) UI.renderClinic();
        }
      }));
      grid.appendChild(createCard({
        type: "craft",
        icon: "🛠️",
        label: "WERKBANK",
        sub: "Zerlegen & Bauen",
        onClick: () => {
          if (UI.renderCrafting) UI.renderCrafting();
        }
      }));
      grid.appendChild(createCard({
        type: "gamble",
        icon: "🎲",
        label: "GLÜCKSSPIEL",
        sub: "Wasteland Gamble",
        onClick: () => {
          if (UI.startMinigame) UI.startMinigame("dice");
        }
      }));
      wrapper.appendChild(grid);
      const footer = document.createElement("div");
      footer.className = "flex-shrink-0 p-3 border-t-4 border-green-900 bg-[#001100]";
      footer.innerHTML = `
            <button class="action-button w-full border-2 border-green-600 text-green-500 py-3 font-bold text-xl hover:bg-green-900/50 hover:text-green-200 transition-all uppercase tracking-[0.15em]" onclick="Game.leaveCity()">
                <span class="mr-2">🚪</span> ZURÜCK INS ÖDLAND (ESC)
            </button>
        `;
      wrapper.appendChild(footer);
      view.appendChild(wrapper);
    },
    // ==========================================
    // === SHOP LOGIC (FIXED FOOTER) ===
    // ==========================================
    renderShop: function(mode = "buy") {
      const view = document.getElementById("view-container");
      if (!view) return;
      view.innerHTML = "";
      Game.state.view = "shop";
      Game.checkShopRestock();
      const wrapper = document.createElement("div");
      wrapper.className = "absolute inset-0 w-full h-full flex flex-col bg-black z-20 overflow-hidden";
      const scrollContainer = document.createElement("div");
      scrollContainer.className = "flex-1 overflow-y-auto overflow-x-hidden custom-scroll p-3 pb-24";
      const usedSlots = Game.getUsedSlots();
      const maxSlots = Game.getMaxSlots();
      const isFull = usedSlots >= maxSlots;
      const invColor = isFull ? "text-red-500 animate-pulse" : "text-yellow-300";
      scrollContainer.innerHTML = `
            <div class="flex justify-between items-end p-4 border-b-4 border-yellow-600 bg-[#1a1500] shadow-md mb-4">
                <div>
                    <h2 class="text-3xl text-yellow-400 font-bold font-vt323 tracking-wider">HANDELSPOSTEN</h2>
                    <div class="text-xs text-yellow-700 font-mono mt-1">HÄNDLER: <span class="font-bold text-yellow-500">${Game.state.shop.merchantCaps} KK</span></div>
                </div>
                <div class="flex gap-2">
                    <div class="bg-black/50 border-2 border-yellow-500 p-2 flex flex-col items-end shadow-inner">
                         <span class="text-[10px] text-yellow-600 uppercase tracking-widest">GEWICHT</span>
                         <span class="text-2xl ${invColor} font-bold font-vt323">${usedSlots} / ${maxSlots}</span>
                    </div>
                    <div class="bg-black/50 border-2 border-yellow-500 p-2 flex flex-col items-end shadow-inner">
                        <span class="text-[10px] text-yellow-600 uppercase tracking-widest">DEIN VERMÖGEN</span>
                        <span class="text-2xl text-yellow-300 font-bold font-vt323">${Game.state.caps} KK</span>
                    </div>
                </div>
            </div>
        `;
      const controlsDiv = document.createElement("div");
      controlsDiv.className = "bg-[#002200] border-b-2 border-green-500 p-3 shadow-lg mb-4";
      const getBtnClass = (val) => {
        if (UI.shopQty === val) return "bg-yellow-400 text-black border-yellow-400 font-bold shadow-[0_0_10px_#ffd700]";
        return "bg-black text-green-500 border-green-500 hover:border-yellow-400 hover:text-yellow-400";
      };
      let inputValue = UI.shopQty === "max" ? "" : UI.shopQty;
      controlsDiv.innerHTML = `
            <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center text-xs text-green-400 mb-1">
                    <span class="uppercase tracking-widest font-bold">MENGENAUSWAHL</span>
                </div>
                <div class="flex gap-2 h-10">
                    <input type="number" id="shop-qty-input" value="${inputValue}" placeholder="Menge"
                        class="w-20 bg-black border-2 border-green-500 text-green-400 text-center font-bold text-xl focus:border-yellow-400 focus:text-yellow-400 outline-none"
                        oninput="UI.setShopQty(this.value, 'input')">
                    
                    <button onclick="UI.setShopQty(1)" class="flex-1 border-2 ${getBtnClass(1)} transition-all uppercase tracking-wider">
                        1x
                    </button>
                    <button onclick="UI.setShopQty(10)" class="flex-1 border-2 ${getBtnClass(10)} transition-all uppercase tracking-wider">
                        10x
                    </button>
                    <button onclick="UI.setShopQty('max')" class="flex-1 border-2 ${getBtnClass("max")} transition-all uppercase tracking-wider">
                        MAX
                    </button>
                </div>
            </div>
            
            <div class="flex mt-3 border-b border-green-800">
                <button onclick="UI.renderShop('buy')" class="flex-1 py-2 text-center font-bold ${mode === "buy" ? "bg-green-500 text-black" : "text-green-600 hover:text-green-300"}">KAUFEN</button>
                <button onclick="UI.renderShop('sell')" class="flex-1 py-2 text-center font-bold ${mode === "sell" ? "bg-red-500 text-black" : "text-red-600 hover:text-red-300"}">VERKAUFEN</button>
            </div>
        `;
      scrollContainer.appendChild(controlsDiv);
      const listContent = document.createElement("div");
      listContent.id = "shop-list";
      listContent.className = "space-y-2";
      scrollContainer.appendChild(listContent);
      const footer = document.createElement("div");
      footer.className = "absolute bottom-0 left-0 w-full p-4 bg-black border-t-2 border-yellow-900 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.9)]";
      footer.innerHTML = `<button class="action-button w-full border-2 border-yellow-800 text-yellow-700 hover:border-yellow-500 hover:text-yellow-400 transition-colors py-3 font-bold tracking-widest uppercase bg-black" onclick="UI.renderCity()">ZURÜCK ZUM ZENTRUM</button>`;
      wrapper.appendChild(scrollContainer);
      wrapper.appendChild(footer);
      view.appendChild(wrapper);
      if (mode === "buy") this.renderShopBuy(listContent);
      else this.renderShopSell(listContent);
    },
    renderShopBuy: function(container) {
      if (!container) return;
      container.innerHTML = "";
      const stock = Game.state.shop.stock || {};
      const myCaps = Game.state.caps;
      const ammoRows = Object.keys(Game.items).filter((id) => Game.items[id] && Game.items[id].type === "ammo").map((id) => ({ id, qty: Game.ammoStockOf ? Game.ammoStockOf(id) : 0, item: Game.items[id] })).filter((entry) => entry.qty > 0).sort((a, b) => (a.item.cost || 1) - (b.item.cost || 1));
      const createRow = (icon, name, qty, price, key, isAmmo = false) => {
        const canBuy = myCaps >= price;
        let colorText = isAmmo ? "text-blue-300" : "text-yellow-200";
        let colorBorder = isAmmo ? "border-blue-500" : "border-yellow-700";
        let colorBg = isAmmo ? "bg-blue-900/20 hover:bg-blue-600/40" : "bg-yellow-900/10 hover:bg-yellow-600/40";
        let colorSub = isAmmo ? "text-blue-600" : "text-yellow-700";
        let colorBtn = isAmmo ? "text-blue-400" : "text-yellow-600";
        if (!canBuy) {
          colorText = "text-gray-500";
          colorBorder = "border-red-900";
          colorBg = "bg-red-900/10 opacity-50";
          colorSub = "text-red-900";
          colorBtn = "text-red-900";
        }
        const row = document.createElement("div");
        row.className = `shop-item-row flex justify-between items-center mb-2 border-2 ${colorBorder} ${colorBg} h-16 relative z-10 transition-all select-none`;
        if (canBuy) {
          row.style.cursor = "pointer";
          row.setAttribute("onclick", `Game.buyItem('${key}', UI.shopQty)`);
        } else {
          row.style.cursor = "not-allowed";
        }
        row.innerHTML = `
                <div class="flex items-center gap-3 p-2 flex-grow overflow-hidden pointer-events-none">
                    <div class="text-3xl w-12 h-12 flex items-center justify-center bg-black/40 border border-white/10 rounded">${icon}</div>
                    <div class="flex flex-col truncate">
                        <span class="font-bold text-lg font-vt323 truncate leading-none pt-1 ${colorText}">${name}</span>
                        <span class="text-xs ${colorSub} font-mono uppercase">Vorrat: ${qty} | Preis: ${price} KK</span>
                    </div>
                </div>
                <div class="h-full flex flex-col justify-center items-end border-l-2 ${colorBorder} bg-black/30 min-w-[100px]">
                    <button class="w-full h-full text-sm font-bold uppercase tracking-wider bg-transparent border-none ${colorBtn}" style="pointer-events: none;">
                        KAUFEN
                    </button>
                </div>
            `;
        return row;
      };
      if (ammoRows.length > 0) {
        ammoRows.forEach((entry) => {
          container.appendChild(createRow(
            "🧨",
            "10x " + entry.item.name.toUpperCase(),
            entry.qty,
            (entry.item.cost || 1) * 10,
            entry.id,
            true
          ));
        });
        container.innerHTML += `<div class="h-px bg-yellow-900/50 my-4 mx-2"></div>`;
      }
      const categories = {
        "consumable": { title: "💊 MEDIZIN", items: [] },
        "weapon": { title: "🔫 WAFFEN", items: [] },
        "body": { title: "🛡️ RÜSTUNG", items: [] },
        "misc": { title: "📦 SONSTIGES", items: [] }
      };
      Object.keys(stock).forEach((key) => {
        if (key === "fists" || key === "vault_suit" || key === "mele") return;
        if (key === "camp_kit") return;
        if (stock[key] <= 0) return;
        const item = Game.items[key];
        if (!item) return;
        const cat = categories[item.type] || categories["misc"];
        cat.items.push({ key, ...item });
      });
      for (let catKey in categories) {
        const cat = categories[catKey];
        if (cat.items.length > 0) {
          const header = document.createElement("h3");
          header.className = "text-yellow-600 font-bold border-b border-yellow-800 mt-4 mb-2 pl-1 text-xs uppercase tracking-widest font-mono";
          header.textContent = cat.title;
          container.appendChild(header);
          cat.items.forEach((data) => {
            let icon = "📦";
            if (data.type === "weapon") icon = "🔫";
            if (data.type === "body") icon = "🛡️";
            if (data.type === "consumable") icon = "💉";
            container.appendChild(createRow(icon, data.name, stock[data.key], data.cost, data.key, false));
          });
        }
      }
    },
    renderShopSell: function(container) {
      if (!container) return;
      container.innerHTML = "";
      if (Game.state.inventory.length === 0) {
        container.innerHTML = '<div class="text-center text-green-800 mt-10 font-mono border-2 border-dashed border-green-900 p-6">INVENTAR LEER</div>';
        return;
      }
      Game.state.inventory.forEach((item, idx) => {
        const def = Game.items[item.id];
        if (!def) return;
        if (item.id === "fists" || item.id === "camp_kit") return;
        let valMult = item.props && item.props.valMult ? item.props.valMult : 1;
        let sellPrice = Math.floor(def.cost * 0.25 * valMult);
        if (sellPrice < 1) sellPrice = 1;
        const canSell = Game.state.shop.merchantCaps >= sellPrice;
        const name = item.props ? item.props.name : def.name;
        const div = document.createElement("div");
        div.className = `shop-item-row flex justify-between items-center mb-2 border-2 ${canSell ? "border-green-700 bg-green-900/10 hover:bg-green-900/20" : "border-red-900 opacity-50"} h-14 transition-all select-none relative z-10`;
        if (canSell) {
          div.style.cursor = "pointer";
          div.setAttribute("onclick", `Game.sellItem(${idx}, UI.shopQty)`);
        } else {
          div.style.cursor = "not-allowed";
        }
        div.innerHTML = `
                <div class="flex items-center gap-3 p-2 flex-grow overflow-hidden pointer-events-none">
                    <div class="text-green-500 font-bold text-lg font-vt323 truncate">${name} <span class="text-green-800 text-sm font-sans">x${item.count}</span></div>
                </div>
                <div class="h-full flex flex-col justify-center items-end border-l-2 border-green-800 bg-black/30 min-w-[100px] pointer-events-none">
                    <div class="font-bold text-green-400 text-lg w-full text-center border-b border-green-900 font-vt323">${sellPrice}</div>
                    <button class="flex-grow w-full h-full text-[10px] font-bold uppercase tracking-wider hover:bg-green-600 hover:text-black transition-colors text-green-700">VERKAUFEN</button>
                </div>
            `;
        container.appendChild(div);
      });
    },
    setShopQty: function(val, source) {
      if (source === "input") {
        const parsed = parseInt(val);
        if (!isNaN(parsed) && parsed > 0) {
          this.shopQty = parsed;
        } else {
          this.shopQty = 1;
        }
        this.updateShopQtyVisuals();
      } else {
        this.shopQty = val;
        const inputEl = document.getElementById("shop-qty-input");
        if (inputEl) {
          inputEl.value = val === "max" ? "" : val;
          inputEl.placeholder = val === "max" ? "MAX" : "Menge";
        }
        this.updateShopQtyVisuals();
      }
    },
    updateShopQtyVisuals: function() {
      if (document.activeElement.id !== "shop-qty-input") {
        const sellBtn = document.querySelector("button.bg-red-500");
        const mode = sellBtn ? "sell" : "buy";
        this.renderShop(mode);
      }
    }
  });

  // src/ui/ui_view_journal.js
  if (typeof Game !== "undefined" && !Game.trackQuest) {
    Game.trackQuest = function(qId) {
      if (!this.state) return;
      if (this.state.trackedQuestId === qId) {
        this.state.trackedQuestId = null;
        if (typeof UI !== "undefined" && UI.log) UI.log("Mission nicht mehr verfolgt.", "text-gray-400");
      } else {
        this.state.trackedQuestId = qId;
        if (typeof UI !== "undefined" && UI.log) UI.log("Mission fixiert!", "text-yellow-400 font-bold");
      }
      if (typeof this.saveGame === "function") this.saveGame();
      if (typeof UI !== "undefined") {
        if (UI.renderQuests) UI.renderQuests();
        if (UI.updateQuestTracker) UI.updateQuestTracker();
      }
    };
  }
  Object.assign(UI, {
    renderWiki: function(category = "monsters") {
      const content = document.getElementById("wiki-content");
      if (!content) return;
      const btnContainer = document.querySelector("#wiki-btn-monsters")?.parentElement;
      const ensureButton = (id, label, catName) => {
        if (btnContainer && !document.getElementById(id)) {
          const btn = document.createElement("button");
          btn.id = id;
          btn.className = "border border-green-500 px-3 py-1 text-sm font-bold whitespace-nowrap hover:bg-green-500 hover:text-black transition-colors text-green-500";
          btn.textContent = label;
          btn.onclick = () => UI.renderWiki(catName);
          btnContainer.appendChild(btn);
        }
      };
      ensureButton("wiki-btn-perks", "PERKS", "perks");
      ensureButton("wiki-btn-quests", "QUESTS", "quests");
      const getIcon = (type) => {
        const map = {
          "weapon": "🔫",
          "body": "🛡️",
          "head": "🪖",
          "legs": "👖",
          "feet": "🥾",
          "arms": "🦾",
          "back": "🎒",
          "consumable": "💉",
          "junk": "⚙️",
          "component": "🔩",
          "ammo": "🧨",
          "blueprint": "📜",
          "tool": "⛺",
          "misc": "📦"
        };
        return map[type] || "❓";
      };
      const categories = ["monsters", "items", "crafting", "locs", "perks", "quests"];
      categories.forEach((cat) => {
        const btn = document.getElementById(`wiki-btn-${cat}`);
        if (btn) {
          if (cat === category) {
            btn.classList.add("bg-green-500", "text-black");
            btn.classList.remove("text-green-500");
          } else {
            btn.classList.remove("bg-green-500", "text-black");
            btn.classList.add("text-green-500");
          }
        }
      });
      let html = "";
      if (category === "monsters") {
        const list = Object.values(Game.monsters || {}).sort((a, b) => a.minLvl - b.minLvl);
        if (list.length === 0) html = '<div class="text-gray-400 text-center mt-10">Keine Daten verfügbar.</div>';
        list.forEach((m) => {
          const xpText = Array.isArray(m.xp) ? `${m.xp[0]}-${m.xp[1]}` : m.xp;
          let dropsText = "Nichts";
          if (m.drops && m.drops.length > 0) {
            dropsText = m.drops.map((d) => {
              const item = Game.items[d.id];
              return `<span class="text-green-200">${item ? item.name : d.id}</span> <span class="text-gray-400 text-xs">(${Math.round(d.c * 100)}%)</span>`;
            }).join(", ");
          }
          html += `
                    <div class="border border-green-800 bg-black/80 p-3 mb-2 flex flex-col gap-2 relative overflow-hidden group hover:border-green-500 transition-colors">
                        <div class="flex justify-between items-start border-b border-green-900/50 pb-1">
                            <div class="font-bold text-yellow-400 text-lg flex items-center gap-2"><span>👾</span> ${m.name} ${m.isLegendary ? "★" : ""}</div>
                            <div class="text-xs font-mono bg-green-900 text-green-100 px-2 rounded">LVL ${m.minLvl}</div>
                        </div>
                        <div class="grid grid-cols-4 gap-2 text-xs font-mono text-center bg-green-900/20 p-2 rounded">
                            <div class="flex flex-col"><span class="text-gray-400">HP</span><span class="text-white font-bold">${m.hp}</span></div>
                            <div class="flex flex-col"><span class="text-gray-400">DMG</span><span class="text-red-400 font-bold">${m.dmg}</span></div>
                            <div class="flex flex-col"><span class="text-gray-400">XP</span><span class="text-cyan-400 font-bold">${xpText}</span></div>
                            <div class="flex flex-col"><span class="text-gray-400">LOOT</span><span class="text-yellow-400 font-bold">~${m.loot}</span></div>
                        </div>
                        <div class="text-xs text-gray-300 flex gap-2 items-start mt-1">
                            <span class="font-bold shrink-0 text-green-500">DROPS:</span>
                            <div class="flex flex-wrap gap-2 leading-none">${dropsText}</div>
                        </div>
                    </div>`;
        });
      } else if (category === "items") {
        const groups = {};
        if (Game.items) {
          Object.keys(Game.items).forEach((k) => {
            const i = Game.items[k];
            if (!groups[i.type]) groups[i.type] = [];
            groups[i.type].push(i);
          });
          const order = ["weapon", "body", "head", "arms", "legs", "feet", "back", "consumable", "ammo", "tool", "blueprint", "component", "junk", "quest", "valuable"];
          const sortedKeys = Object.keys(groups).sort((a, b) => {
            let ia = order.indexOf(a), ib = order.indexOf(b);
            if (ia === -1) ia = 99;
            if (ib === -1) ib = 99;
            return ia - ib;
          });
          sortedKeys.forEach((type) => {
            html += `<h3 class="text-md font-bold bg-green-800 text-white px-2 py-1 mt-4 mb-2 uppercase tracking-widest flex items-center gap-2 border-l-4 border-green-500 shadow-md">${getIcon(type)} ${type}</h3>`;
            groups[type].sort((a, b) => a.name.localeCompare(b.name)).forEach((item) => {
              let stats = [];
              if (item.cost) stats.push(`<span class="text-yellow-400">${item.cost} KK</span>`);
              if (item.baseDmg) stats.push(`<span class="text-red-400">DMG ${item.baseDmg}</span>`);
              if (item.val && item.effect) stats.push(`<span class="text-blue-300">${item.effect.toUpperCase()} ${item.val > 0 ? "+" : ""}${item.val}</span>`);
              if (item.bonus) stats.push(`<span class="text-cyan-300">${JSON.stringify(item.bonus).replace(/["{}]/g, "").replace(/:/g, "+")}</span>`);
              html += `
                            <div class="flex flex-col border-b border-green-900/50 py-3 hover:bg-green-900/20 px-2">
                                <div class="flex justify-between items-center">
                                    <span class="font-bold text-green-100 text-sm">${item.name}</span>
                                    <div class="text-xs font-mono flex gap-2 opacity-90">${stats.join(" | ")}</div>
                                </div>
                                <div class="text-sm text-gray-400 italic pl-2 border-l-2 border-green-700/50 mt-1">${item.desc || "Keine Daten."}</div>
                            </div>`;
            });
          });
        }
      } else if (category === "crafting") {
        if (Game.recipes && Game.recipes.length > 0) {
          const list = [...Game.recipes].sort((a, b) => a.lvl - b.lvl);
          list.forEach((r) => {
            const isKnown = Game.state.knownRecipes && Game.state.knownRecipes.includes(r.id) || r.lvl <= 1;
            const item = Game.items[r.out];
            const outName = r.out === "AMMO" ? "Munition x10" : item ? item.name : r.out;
            let reqs = Object.entries(r.req).map(([id, count]) => {
              const iName = Game.items[id] ? Game.items[id].name : id;
              return `${count}x ${iName}`;
            }).join(", ");
            html += `
                        <div class="border border-green-800 p-3 mb-2 bg-black flex justify-between items-center ${isKnown ? "" : "opacity-50 grayscale"}">
                            <div>
                                <div class="font-bold text-lg ${isKnown ? "text-yellow-400" : "text-gray-500"}">${outName}</div>
                                <div class="text-xs text-green-400 font-mono italic mt-1">Benötigt: ${reqs}</div>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="text-xs border border-green-700 px-2 py-0.5 text-green-200">LVL ${r.lvl}</span>
                                ${!isKnown ? '<span class="text-[10px] text-red-400 font-bold mt-1">LOCKED</span>' : ""}
                            </div>
                        </div>`;
          });
        } else {
          html = '<div class="text-center text-gray-400 mt-10">Keine Baupläne in Datenbank.</div>';
        }
      } else if (category === "perks") {
        if (Game.perkDefs) {
          Game.perkDefs.forEach((p) => {
            const lvl = Game.getPerkLevel(p.id);
            const has = lvl > 0;
            html += `
                        <div class="flex gap-3 border ${has ? "border-yellow-500 bg-yellow-900/20" : "border-green-800/50 bg-black"} p-4 mb-2 items-center">
                            <div class="text-4xl filter drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">${p.icon || "🌟"}</div>
                            <div>
                                <div class="font-bold ${has ? "text-yellow-400" : "text-green-300"} text-lg flex items-center gap-2">
                                    ${p.name} ${has ? `<span class="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold">STUFE ${lvl}</span>` : ""}
                                </div>
                                <div class="text-sm text-green-100 mt-1 leading-snug">${p.desc}</div>
                            </div>
                        </div>`;
          });
        } else {
          html = '<div class="text-center text-gray-400 p-4">Keine Perks gefunden.</div>';
        }
      } else if (category === "locs") {
        const locs = Game.locations || window.GameData.locations || [];
        if (locs.length === 0) {
          html = '<div class="text-center text-gray-400 mt-10">Keine Ortsdaten gefunden.</div>';
        } else {
          locs.forEach((l) => {
            html += `
                        <div class="mb-4 border-l-4 border-green-500 pl-4 py-2 bg-black/60">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-cyan-300 text-lg tracking-wider">${l.name}</span>
                                <span class="font-mono text-xs text-yellow-500 bg-black px-1 border border-yellow-800 flex items-center">${l.coord}</span>
                            </div>
                            <div class="text-sm text-green-100 leading-relaxed">${l.desc}</div>
                        </div>`;
          });
        }
      } else if (category === "quests") {
        if (Game.questDefs) {
          Game.questDefs.forEach((q) => {
            html += `
                        <div class="border border-green-800 p-3 mb-2 bg-black/60">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-yellow-400 text-base">${q.title}</span>
                                <span class="text-[10px] bg-green-900 text-green-100 px-2 py-0.5 rounded">Min-Lvl: ${q.minLvl}</span>
                            </div>
                            <div class="text-sm text-green-100 italic mb-2">${q.desc}</div>
                            <div class="text-xs text-gray-400 font-mono">
                                Typ: ${q.type.toUpperCase()} | Ziel: ${q.target}
                            </div>
                        </div>
                    `;
          });
        } else {
          html = '<div class="text-center text-gray-400 p-4">Keine Quests in Datenbank.</div>';
        }
      }
      content.innerHTML = html;
    },
    renderQuests: function() {
      const list = document.getElementById("quest-list");
      if (!list) return;
      list.innerHTML = "";
      const chains = [];
      const sideQuests = [];
      const processedIds = /* @__PURE__ */ new Set();
      const allDefs = Game.questDefs || [];
      const findNext = (currentId) => allDefs.find((q) => q.preReq === currentId);
      const roots = allDefs.filter((q) => !q.preReq);
      roots.forEach((root) => {
        const chain = [root];
        processedIds.add(root.id);
        let current = root;
        let next = findNext(current.id);
        while (next) {
          chain.push(next);
          processedIds.add(next.id);
          current = next;
          next = findNext(current.id);
        }
        if (chain.length > 1) chains.push(chain);
        else sideQuests.push(root);
      });
      allDefs.forEach((q) => {
        if (!processedIds.has(q.id)) sideQuests.push(q);
      });
      const renderQuestCard = (def, status, isCompact = false) => {
        const activeData = Game.state.activeQuests.find((q) => q.id === def.id);
        const isDone = status === "done";
        const isLocked = status === "locked";
        const isTracked = Game.state.trackedQuestId === def.id;
        let colorClass = isDone ? "text-gray-400 line-through" : isLocked ? "text-gray-400" : "text-yellow-400";
        let iconColor = isDone ? "text-green-600" : isLocked ? "text-red-500" : "text-yellow-400 animate-pulse";
        let icon = isDone ? "✔" : isLocked ? "🔒" : "◉";
        let pct = 0;
        let detailHtml = "";
        if (activeData) {
          pct = Math.min(100, Math.floor(activeData.progress / activeData.max * 100));
          if (def.type === "collect_multi") {
            const details = Object.entries(def.reqItems).map(([id, amt]) => {
              const inInv = Game.state.inventory.filter((i) => i.id === id).reduce((s, i) => s + i.count, 0);
              const iName = Game.items[id]?.name || id;
              const done = inInv >= amt;
              return `<span class="${done ? "text-green-400" : "text-yellow-100"}">${inInv}/${amt} ${iName}</span>`;
            }).join(", ");
            detailHtml = `<div class="text-xs mt-2 border-t border-gray-700 pt-1 font-mono text-gray-300">${details}</div>`;
          }
        }
        if (isLocked) return `
                <div class="flex items-center gap-3 p-3 border-l-2 border-gray-600 ml-2 bg-black/40">
                    <div class="text-gray-400 font-mono text-lg">???</div>
                    <div class="text-sm text-gray-500 italic">Wird später freigeschaltet</div>
                </div>`;
        if (isCompact && isDone) return `
                <div class="flex items-center gap-2 mb-2 ml-1 bg-black/20 p-1">
                    <span class="text-green-500 text-sm font-bold">✔</span>
                    <span class="text-sm text-gray-400 line-through decoration-gray-600">${def.title}</span>
                </div>`;
        return `
                <div class="border-l-4 ${isDone ? "border-green-700 opacity-50" : "border-yellow-400 bg-black/80"} pl-4 py-3 mb-3 ml-1 relative shadow-lg group">
                    <div class="flex justify-between items-start">
                        <div class="font-bold ${colorClass} text-base flex items-center gap-2">
                            <span class="${iconColor}">${icon}</span> ${def.title}
                        </div>
                        <div class="flex gap-2">
                            ${activeData ? `
                                <button class="text-lg hover:scale-125 transition-transform ${isTracked ? "opacity-100" : "opacity-20 hover:opacity-100"}" 
                                        title="${isTracked ? "Nicht mehr verfolgen" : "Auf HUD anzeigen"}"
                                        onclick="event.stopPropagation(); Game.trackQuest('${def.id}');">
                                    📌
                                </button>
                            ` : ""}
                            ${!isLocked && !isDone ? `<span class="text-[10px] bg-green-900 text-green-100 px-2 py-0.5 rounded border border-green-700">LVL ${def.minLvl}</span>` : ""}
                        </div>
                    </div>
                    
                    ${!isDone && !isLocked ? `<div class="text-sm text-green-100 mt-2 mb-3 leading-relaxed font-sans">${def.desc}</div>` : ""}
                    
                    ${activeData ? `
                        <div class="w-full bg-gray-800 border border-gray-600 h-3 mt-1 mb-1 rounded-sm overflow-hidden">
                            <div class="bg-yellow-500 h-full transition-all duration-500" style="width: ${pct}%"></div>
                        </div>
                        <div class="flex justify-between text-xs font-mono text-yellow-200 font-bold px-1">
                            <span>${activeData.progress} / ${activeData.max}</span>
                            <span>${pct}%</span>
                        </div>
                        ${detailHtml}
                        <div class="mt-3 text-xs text-yellow-500 font-bold border-t border-dashed border-gray-700 pt-2 flex items-center gap-2">
                            <span>BELOHNUNG:</span>
                            ${def.reward?.caps ? '<span class="text-yellow-300">' + def.reward.caps + " KK</span>" : ""}
                            ${def.reward?.xp ? '<span class="text-cyan-300">' + def.reward.xp + " XP</span>" : ""}
                        </div>
                    ` : ""}
                </div>
            `;
      };
      if (chains.length > 0) {
        list.innerHTML += `<h3 class="text-yellow-500 font-bold text-sm tracking-[0.2em] border-b-2 border-yellow-800 mb-4 pb-1 uppercase">Haupt-Missionen</h3>`;
        chains.forEach((chain) => {
          const chainContainer = document.createElement("div");
          chainContainer.className = "mb-8 bg-black/40 p-3 rounded border border-green-900";
          const isComplete = chain.every((q) => Game.state.completedQuests.includes(q.id));
          const isActive = chain.some((q) => Game.state.activeQuests.find((aq) => aq.id === q.id));
          let headerColor = isComplete ? "text-green-600" : isActive ? "text-green-300" : "text-gray-500";
          chainContainer.innerHTML = `<div class="font-bold ${headerColor} mb-4 text-base uppercase tracking-wider flex items-center gap-3 border-b border-gray-800 pb-2"><span class="text-2xl">${isActive ? "📖" : isComplete ? "✅" : "🔒"}</span> <span>GESCHICHTE: ${chain[0].title}</span></div>`;
          let lineHtml = `<div class="flex flex-col gap-1 border-l-2 border-gray-800 ml-3 pl-4">`;
          let lockedFound = false;
          chain.forEach((q) => {
            const isDone = Game.state.completedQuests.includes(q.id);
            const isActiveQ = Game.state.activeQuests.find((aq) => aq.id === q.id);
            if (isDone) lineHtml += renderQuestCard(q, "done", true);
            else if (isActiveQ) lineHtml += renderQuestCard(q, "active");
            else if (!lockedFound) {
              lineHtml += renderQuestCard(q, "locked");
              lockedFound = true;
            }
          });
          lineHtml += `</div>`;
          chainContainer.innerHTML += lineHtml;
          list.appendChild(chainContainer);
        });
      }
      if (sideQuests.length > 0) {
        const visibleSide = sideQuests.filter((q) => Game.state.activeQuests.find((aq) => aq.id === q.id) || Game.state.completedQuests.includes(q.id));
        if (visibleSide.length > 0) {
          const sideContainer = document.createElement("div");
          sideContainer.innerHTML = `<h3 class="text-green-400 font-bold text-sm tracking-[0.2em] border-b-2 border-green-800 mb-4 pb-1 mt-8 uppercase">Neben-Missionen</h3>`;
          visibleSide.forEach((q) => {
            const isDone = Game.state.completedQuests.includes(q.id);
            sideContainer.innerHTML += renderQuestCard(q, isDone ? "done" : "active", isDone);
          });
          list.appendChild(sideContainer);
        }
      }
      if (chains.length === 0 && sideQuests.length === 0) {
        list.innerHTML = '<div class="text-center text-gray-400 italic mt-10 text-lg">Keine Aufzeichnungen vorhanden.</div>';
      }
    }
  });

  // src/ui/ui_view_camp.js
  Object.assign(UI, {
    // Status-Speicher: 'main' oder 'cooking'
    campMode: "main",
    // Helper für das Info-Popup
    showCampInfo: function() {
      let rows = "";
      for (let l = 1; l <= 10; l++) {
        let healPct = 30 + (l - 1) * 8;
        if (l >= 10) healPct = 100;
        if (healPct > 100) healPct = 100;
        let costStr = '<span class="text-gray-600">-</span>';
        if (l === 1) {
          costStr = '<span class="text-gray-500">Start (100 KK)</span>';
        } else {
          const cost = Game.getCampUpgradeCost(l - 1);
          if (cost) {
            costStr = `${cost.count}x ${cost.name}`;
          }
        }
        const currentLvl = Game.state.camp && Game.state.camp.level ? Game.state.camp.level : 1;
        const isCurrent = l === currentLvl;
        const bgClass = isCurrent ? "bg-yellow-900/40 border border-yellow-600" : "border-b border-gray-800";
        const textClass = isCurrent ? "text-yellow-400 font-bold" : "text-gray-400";
        rows += `
                <div class="flex justify-between items-center py-1 px-2 ${bgClass} text-xs">
                    <div class="w-12 ${textClass}">Lvl ${l}</div>
                    <div class="w-20 text-blue-300 text-center">${Math.floor(healPct)}% HP</div>
                    <div class="flex-1 text-right text-gray-300">${costStr}</div>
                </div>
            `;
      }
      const content = `
            <div class="flex justify-between text-xs text-yellow-600 font-bold mb-2 px-2 uppercase tracking-wider border-b border-yellow-900 pb-1">
                <span class="w-12">Stufe</span>
                <span class="w-20 text-center">Heilung</span>
                <span class="flex-1 text-right">Kosten</span>
            </div>
            <div class="flex flex-col gap-1 max-h-[50vh] overflow-y-auto custom-scroll mb-4 border border-green-900/30 bg-black/50 p-1">
                ${rows}
            </div>
            <div class="text-[10px] text-gray-500 text-center italic">
                Höhere Stufen heilen effektiver und vergrößern den Lagerschrank<br>
                (10 Plätze auf Stufe 1, +5 je Stufe). Strahlung (+5) beim Schlafen bleibt konstant.
            </div>
        `;
      this.showInfoDialog("LAGER INFO", content);
    },
    // Haupt-Render Funktion
    renderCamp: function(resetToMain = false) {
      if (resetToMain) {
        this.campMode = "main";
      }
      const cookingView = document.getElementById("camp-cooking-view");
      const mainActions = document.getElementById("camp-main-actions");
      const storageView = document.getElementById("camp-storage-view");
      if (storageView) storageView.classList.add("hidden");
      const statusBox = document.getElementById("camp-status-box");
      const upgradeCont = document.getElementById("camp-upgrade-container");
      if (cookingView && mainActions) {
        if (this.campMode === "cooking") {
          cookingView.classList.remove("hidden");
          cookingView.classList.add("bg-gray-900", "z-50");
          mainActions.classList.add("hidden");
          if (statusBox) statusBox.classList.add("hidden");
          if (upgradeCont) upgradeCont.classList.add("hidden");
          this.renderCampCooking(false);
        } else {
          cookingView.classList.add("hidden");
          cookingView.classList.remove("bg-gray-900", "z-50");
          mainActions.classList.remove("hidden");
          if (statusBox) statusBox.classList.remove("hidden");
          if (upgradeCont) upgradeCont.classList.remove("hidden");
        }
      }
      const camp = Game.state.camp;
      if (!camp) {
        console.warn("Kein Camp gefunden!");
        if (typeof UI.switchView === "function") UI.switchView("map");
        return;
      }
      const lvl = camp.level || 1;
      const lvlDisplay = document.getElementById("camp-level-display");
      if (lvlDisplay) lvlDisplay.textContent = `LEVEL ${lvl}`;
      let healPct = 30 + (lvl - 1) * 8;
      if (lvl >= 10) healPct = 100;
      if (healPct > 100) healPct = 100;
      const schrankHint = document.getElementById("camp-storage-hint");
      if (schrankHint) schrankHint.textContent = `${Game.getCampStorageUsed()} / ${Game.getCampStorageSlots()} Plätze`;
      if (statusBox) {
        let comfort = lvl === 1 ? "Basis-Zelt" : lvl >= 10 ? "Luxus-Bunker" : "Komfort-Zelt";
        statusBox.textContent = `${comfort} (Lvl ${lvl}). Heilung ${Math.floor(healPct)}%.`;
      }
      if (upgradeCont) {
        let upgradeText = "LAGER VERBESSERN";
        let upgradeSub = "Lädt...";
        let upgradeDisabled = false;
        let btnClass = "border-yellow-500 text-yellow-400 hover:bg-yellow-900/30";
        if (lvl >= 10) {
          upgradeText = "LAGER MAXIMIERT";
          upgradeSub = "Maximum erreicht (Level 10)";
          upgradeDisabled = true;
          btnClass = "border-green-500 text-green-500 cursor-default bg-green-900/20";
        } else {
          const cost = Game.getCampUpgradeCost(lvl);
          if (cost) {
            const count = Game.state.inventory.reduce((sum, i) => {
              return i.id === cost.id ? sum + i.count : sum;
            }, 0);
            if (count >= cost.count) {
              upgradeSub = `Kosten: ${cost.count}x ${cost.name}`;
            } else {
              upgradeSub = `Fehlt: ${cost.count}x ${cost.name} (Besitz: ${count})`;
              upgradeDisabled = true;
              btnClass = "border-red-500 text-red-500 cursor-not-allowed opacity-70";
            }
          } else {
            upgradeSub = "Keine Daten";
            upgradeDisabled = true;
          }
        }
        upgradeCont.innerHTML = `
                <button class="flex flex-col items-center justify-center border ${btnClass} p-3 transition-all w-full mb-4"
                    onclick="Game.upgradeCamp()" ${upgradeDisabled ? "disabled" : ""}>
                    <span class="font-bold text-lg">${upgradeText}</span>
                    <span class="text-xs opacity-70">${upgradeSub}</span>
                </button>
            `;
      }
    },
    renderCampStorage: function() {
      this.campMode = "storage";
      const storageView = document.getElementById("camp-storage-view");
      const cookingView = document.getElementById("camp-cooking-view");
      const mainActions = document.getElementById("camp-main-actions");
      const statusBox = document.getElementById("camp-status-box");
      const upgradeCont = document.getElementById("camp-upgrade-container");
      if (storageView) {
        storageView.classList.remove("hidden");
        storageView.classList.add("bg-gray-900", "z-50");
      }
      if (cookingView) cookingView.classList.add("hidden");
      if (mainActions) mainActions.classList.add("hidden");
      if (statusBox) statusBox.classList.add("hidden");
      if (upgradeCont) upgradeCont.classList.add("hidden");
      const liste = document.getElementById("camp-storage-list");
      const kopf = document.getElementById("camp-storage-head");
      if (!liste) return;
      const belegt = Game.getCampStorageUsed();
      const plaetze = Game.getCampStorageSlots();
      if (kopf) kopf.textContent = `Belegt: ${belegt} / ${plaetze} Plätze · Schrank wächst mit der Lagerstufe`;
      liste.innerHTML = "";
      const lager = Game.getCampStorage();
      if (lager.length === 0) {
        liste.innerHTML = '<div class="text-gray-500 italic text-center mt-6">Der Schrank ist leer.</div>';
      } else {
        lager.forEach((eintrag, i) => {
          const def = Game.items[eintrag.id] || {};
          const div = document.createElement("div");
          div.className = "border border-cyan-900 bg-cyan-900/10 p-2 mb-2 flex justify-between items-center";
          div.innerHTML = `
                    <div class="flex flex-col">
                        <span class="font-bold text-cyan-300">${eintrag.name || def.name || eintrag.id}</span>
                        <span class="text-xs text-cyan-600">${eintrag.count}x</span>
                    </div>
                    <button class="border border-cyan-500 text-cyan-400 px-3 py-1 text-sm font-bold hover:bg-cyan-900/40">ENTNEHMEN</button>
                `;
          div.querySelector("button").onclick = () => {
            Game.takeFromCamp(i);
            this.renderCampStorage();
          };
          liste.appendChild(div);
        });
      }
      const trenner = document.createElement("div");
      trenner.className = "text-xs text-gray-500 uppercase tracking-widest mt-4 mb-2 border-t border-gray-800 pt-2";
      trenner.textContent = "Aus dem Rucksack einlagern";
      liste.appendChild(trenner);
      const rucksack = Game.state.inventory || [];
      let etwasDa = false;
      rucksack.forEach((item, i) => {
        const def = Game.items[item.id] || {};
        const div = document.createElement("div");
        div.className = "border border-gray-800 bg-black/40 p-2 mb-1 flex justify-between items-center";
        div.innerHTML = `
                <div class="flex flex-col">
                    <span class="text-green-300">${item.name || def.name || item.id}</span>
                    <span class="text-xs text-gray-500">${item.count}x</span>
                </div>
                <button class="border border-green-700 text-green-500 px-3 py-1 text-sm font-bold hover:bg-green-900/40">EINLAGERN</button>
            `;
        div.querySelector("button").onclick = () => {
          Game.storeInCamp(i);
          this.renderCampStorage();
        };
        liste.appendChild(div);
        etwasDa = true;
      });
      if (!etwasDa) {
        const leer = document.createElement("div");
        leer.className = "text-gray-600 italic text-center text-sm";
        leer.textContent = "Rucksack ist leer.";
        liste.appendChild(leer);
      }
    },
    renderCampCooking: function(switchToCooking = true) {
      if (switchToCooking) {
        this.campMode = "cooking";
        const cookingView = document.getElementById("camp-cooking-view");
        const mainActions = document.getElementById("camp-main-actions");
        const statusBox = document.getElementById("camp-status-box");
        const upgradeCont = document.getElementById("camp-upgrade-container");
        if (cookingView) {
          cookingView.classList.remove("hidden");
          cookingView.classList.add("bg-gray-900", "z-50");
        }
        if (mainActions) mainActions.classList.add("hidden");
        if (statusBox) statusBox.classList.add("hidden");
        if (upgradeCont) upgradeCont.classList.add("hidden");
      }
      const list = document.getElementById("cooking-list");
      if (!list) return;
      const scrollPos = list.scrollTop;
      list.innerHTML = "";
      const recipes = Game.recipes || [];
      const cookingRecipes = recipes.filter((r) => r.type === "cooking");
      if (cookingRecipes.length === 0) {
        list.innerHTML = '<div class="text-gray-500 italic text-center mt-10">Du kennst noch keine Rezepte.</div>';
        return;
      }
      cookingRecipes.forEach((recipe) => {
        const outItem = Game.items[recipe.out];
        if (!outItem) {
          console.warn("Überspringe fehlerhaftes Rezept (Output fehlt):", recipe.out);
          return;
        }
        const div = document.createElement("div");
        div.className = "border border-yellow-900 bg-yellow-900/10 p-3 mb-2 flex justify-between items-center relative";
        div.onclick = (e) => e.stopPropagation();
        let reqHtml = "";
        let canCraft = true;
        for (let reqId in recipe.req) {
          const countNeeded = recipe.req[reqId];
          const countHave = Game.state.inventory.reduce((sum, i) => {
            return i.id === reqId ? sum + i.count : sum;
          }, 0);
          let color = "text-yellow-500";
          if (countHave < countNeeded) {
            canCraft = false;
            color = "text-red-500";
          }
          const ingItem = Game.items[reqId];
          const ingredientName = ingItem ? ingItem.name : `UNKNOWN (${reqId})`;
          reqHtml += `<span class="${color} text-xs mr-2 block">• ${ingredientName}: ${countHave}/${countNeeded}</span>`;
        }
        div.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-bold text-yellow-400 text-lg">${outItem.name}</span>
                    <span class="text-xs text-yellow-600 italic">${outItem.desc || ""}</span>
                    <div class="mt-1 bg-black/50 p-1 rounded">${reqHtml}</div>
                </div>
                <button class="action-button border-yellow-500 text-yellow-500 px-4 py-2 font-bold hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed h-full ml-2" 
                    onclick="event.stopPropagation(); Game.craftItem('${recipe.id}'); setTimeout(() => UI.renderCampCooking(false), 50)" ${canCraft ? "" : "disabled"}>
                    BRATEN
                </button>
            `;
        list.appendChild(div);
      });
      if (scrollPos > 0) list.scrollTop = scrollPos;
    }
  });

  // src/ui/ui_render_core.js
  Object.assign(UI, {
    update: function() {
      const loginScreen = document.getElementById("login-screen");
      const isLoginHidden = loginScreen && (loginScreen.style.display === "none" || loginScreen.classList.contains("hidden"));
      const isAuth = typeof Network !== "undefined" && Network.myId;
      if (isLoginHidden && isAuth) {
        if (Date.now() - (this.lastInputTime || Date.now()) > 3e5) {
          console.log("AFK Trigger: Zeitüberschreitung im UI Render Loop");
          if (typeof this.logout === "function") {
            this.logout("AFK: ZEITÜBERSCHREITUNG");
          }
          return;
        }
      }
      if (!Game.state) return;
      if (!this.els.ammo) this.els.ammo = document.getElementById("val-ammo");
      if (!this.els.caps) this.els.caps = document.getElementById("val-caps");
      if (!this.els.hp) this.els.hp = document.getElementById("bar-hp");
      if (!this.els.headerCharInfo) this.els.headerCharInfo = document.getElementById("header-char-info");
      const sectorDisplay = document.getElementById("val-sector-display");
      const hasPoints = Game.state.statPoints > 0 || Game.state.perkPoints > 0;
      const displayName = Game.state.playerName || (typeof Network !== "undefined" ? Network.myDisplayName : "SURVIVOR");
      if (this.els.name) this.els.name.textContent = displayName;
      if (this.els.headerCharInfo) {
        if (hasPoints) this.els.headerCharInfo.classList.add("lvl-ready-glow");
        else this.els.headerCharInfo.classList.remove("lvl-ready-glow");
      }
      const dtName = document.querySelector(".desktop-name-target");
      if (dtName) dtName.textContent = displayName;
      if (sectorDisplay) {
        const sx = Game.state.sector ? Game.state.sector.x : 0;
        const sy = Game.state.sector ? Game.state.sector.y : 0;
        sectorDisplay.innerHTML = `🌍 SEKTOR [${sx},${sy}]`;
        sectorDisplay.classList.remove("border-yellow-500");
      }
      if (this.els.lvl) this.els.lvl.textContent = Game.state.lvl;
      const dtLvl = document.querySelector(".desktop-lvl-target");
      if (dtLvl) dtLvl.textContent = Game.state.lvl;
      const maxHp = Game.state.maxHp;
      const hp = Game.state.hp;
      const rads = Game.state.rads || 0;
      const effectiveMax = Math.max(1, maxHp - rads);
      const hpPct = Math.min(100, Math.max(0, hp / maxHp * 100));
      const radPct = Math.min(100, rads / maxHp * 100);
      const hpText = `TP ${Math.round(hp)}/${Math.round(effectiveMax)}`;
      const valHpEl = document.getElementById("val-hp");
      if (valHpEl) valHpEl.textContent = hpText;
      let barColor = "bg-green-500";
      if (hpPct < 25) barColor = "bg-red-500 animate-pulse";
      else if (hpPct < 50) barColor = "bg-yellow-500";
      if (this.els.hp) {
        this.els.hp.className = `absolute top-0 left-0 h-full transition-all duration-300 ${barColor}`;
        this.els.hp.style.width = `${hpPct}%`;
        if (this.els.hp.parentElement) {
          const p = this.els.hp.parentElement;
          p.classList.remove("bg-green-900", "bg-green-800", "bg-green-700", "bg-opacity-50");
          p.style.backgroundColor = "rgba(10, 10, 10, 0.9)";
          p.style.borderColor = "#14532d";
        }
      }
      const radBar = document.getElementById("bar-rads");
      if (radBar) {
        radBar.style.width = `${radPct}%`;
        radBar.className = "absolute top-0 right-0 h-full bg-red-600 transition-all duration-300 opacity-90";
      }
      const nextXp = Game.expToNextLevel(Game.state.lvl);
      const expPct = Math.min(100, Math.floor(Game.state.xp / nextXp * 100));
      if (this.els.xpTxt) this.els.xpTxt.textContent = expPct;
      if (this.els.expBarTop) this.els.expBarTop.style.width = `${expPct}%`;
      if (this.els.caps) this.els.caps.textContent = `${Game.state.caps}`;
      const ammoItem = Game.state.inventory ? Game.state.inventory.find((i) => i.id === "ammo") : null;
      if (this.els.ammo) this.els.ammo.textContent = ammoItem ? ammoItem.count : 0;
      const campBtn = document.getElementById("btn-camp-overlay");
      if (campBtn) {
        const hasKit = Game.state.inventory && Game.state.inventory.some((i) => i.id === "camp_kit");
        const campDeployed = !!Game.state.camp;
        const inCampSector = campDeployed && Game.state.camp.sector.x === Game.state.sector.x && Game.state.camp.sector.y === Game.state.sector.y;
        if (campDeployed) {
          if (inCampSector) {
            campBtn.classList.remove("hidden");
            campBtn.className = "absolute top-4 left-4 flex flex-col items-center justify-center p-2 rounded-lg border-2 z-20 shadow-[0_0_15px_#ffd700] cursor-pointer bg-black/80 animate-pulse border-yellow-400 text-yellow-400";
            campBtn.innerHTML = '<span class="text-2xl">⛺</span><span class="text-xs font-bold">LAGER</span>';
            campBtn.onclick = () => UI.switchView("camp");
          } else {
            campBtn.classList.add("hidden");
          }
        } else {
          if (hasKit) {
            campBtn.classList.remove("hidden");
            campBtn.className = "absolute top-4 left-4 flex flex-col items-center justify-center p-2 rounded-lg border-2 z-20 shadow-[0_0_10px_#39ff14] cursor-pointer bg-black/80 border-green-500 text-green-500 hover:bg-green-900 transition-colors";
            campBtn.innerHTML = '<span class="text-2xl">⛺</span><span class="text-xs font-bold">BAUEN</span>';
            campBtn.onclick = () => Game.deployCamp();
          } else {
            campBtn.classList.add("hidden");
          }
        }
      }
      let hasAlert = false;
      if (this.els.btnChar) {
        if (hasPoints) {
          this.els.btnChar.classList.add("alert-glow-yellow");
          hasAlert = true;
        } else {
          this.els.btnChar.classList.remove("alert-glow-yellow");
        }
      }
      const questsList = Game.state.quests || [];
      const unreadQuests = questsList.some((q) => !q.read);
      if (this.els.btnQuests) {
        if (unreadQuests) {
          this.els.btnQuests.classList.add("alert-glow-cyan");
          hasAlert = true;
        } else {
          this.els.btnQuests.classList.remove("alert-glow-cyan");
        }
      }
      if (this.els.btnMenu) {
        if (hasAlert) this.els.btnMenu.classList.add("alert-glow-yellow");
        else this.els.btnMenu.classList.remove("alert-glow-yellow");
      }
      const inCombat = Game.state.view === "combat";
      [this.els.btnWiki, this.els.btnMap, this.els.btnChar, this.els.btnQuests, this.els.btnLogout, this.els.btnInv].forEach((btn) => {
        if (btn) btn.disabled = inCombat;
      });
      if (this.els.lvl) {
        if (Game.state.buffEndTime && Date.now() < Game.state.buffEndTime) this.els.lvl.classList.add("blink-red");
        else this.els.lvl.classList.remove("blink-red");
      }
      if (typeof Network !== "undefined" && Network.active) {
        const count = Object.keys(Network.otherPlayers).length + 1;
        const onlineBadge = document.getElementById("online-badge");
        if (onlineBadge) {
          onlineBadge.innerHTML = `● ${count} ONLINE`;
          onlineBadge.className = "absolute top-2 right-2 text-[10px] font-mono border border-green-900 bg-black/80 px-1 rounded " + (count > 1 ? "text-green-400" : "text-gray-600");
        }
      }
    },
    shakeView: function() {
      if (this.els.view) {
        this.els.view.classList.remove("shake");
        void this.els.view.offsetWidth;
        this.els.view.classList.add("shake");
        setTimeout(() => {
          if (this.els.view) this.els.view.classList.remove("shake");
        }, 300);
      }
    },
    toggleView: function(name) {
      if (Game.state.view === name) {
        this.switchView("map");
      } else {
        this.switchView(name);
      }
    },
    switchView: async function(name) {
      this.stopJoystick();
      this.focusIndex = -1;
      if (this.els.navMenu) {
        this.els.navMenu.classList.add("hidden");
        this.els.navMenu.style.display = "none";
      }
      if (this.els.playerList) this.els.playerList.style.display = "none";
      const verDisplay = document.getElementById("version-display");
      const ver = verDisplay ? verDisplay.textContent.trim() : Date.now();
      if (name === "map") {
        this.els.view.innerHTML = `
                <div id="map-view" class="w-full h-full flex justify-center items-center bg-black relative">
                    <canvas id="game-canvas" class="w-full h-full object-contain" style="image-rendering: pixelated;"></canvas>
                    <div id="val-sector-display" onclick="UI.switchView('worldmap')" class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 border border-green-500 text-green-500 px-3 py-1 text-sm font-bold tracking-widest z-20 shadow-[0_0_10px_#39ff14] cursor-pointer hover:text-yellow-400 hover:border-yellow-500 transition-all active:scale-95 group rounded">🌍 SEKTOR [?,?]</div>
                    <button id="btn-camp-overlay" class="hidden absolute top-4 left-4 bg-black/80 border-2 border-green-500 text-green-500 p-2 rounded-lg hover:bg-green-900 transition-all z-20 shadow-[0_0_15px_#39ff14] cursor-pointer flex flex-col items-center">
                        <span class="text-2xl">⛺</span>
                        <span class="text-xs font-bold">BAUEN</span>
                    </button>
                </div>`;
        Game.state.view = name;
        if (Game.state) Game.state.inDialog = false;
        if (document.activeElement) document.activeElement.blur();
        Game.initCanvas();
        this.restoreOverlay();
        this.toggleControls(true);
        this.updateButtonStates(name);
        this.update();
        return;
      }
      if (name === "hacking") {
        this.renderHacking();
        Game.state.view = name;
        return;
      }
      if (name === "lockpicking") {
        this.renderLockpicking(true);
        Game.state.view = name;
        return;
      }
      const path = `templates/${name}.html?v=${ver}`;
      try {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`View '${name}' not found`);
        const html = await res.text();
        this.els.view.innerHTML = html;
        Game.state.view = name;
        this.restoreOverlay();
        if (name === "combat") {
          this.toggleControls(false);
          if (typeof Combat !== "undefined" && typeof Combat.render === "function") Combat.render();
          else this.renderCombat();
        } else {
          this.toggleControls(false);
        }
        if (name === "char") this.renderStats();
        if (name === "inventory") this.renderInventory();
        if (name === "wiki") this.renderWiki();
        if (name === "worldmap") this.renderWorldMap();
        if (name === "city") this.renderCity();
        if (name === "quests") this.renderQuests();
        if (name === "crafting") this.renderCrafting();
        if (name === "shop") this.renderShop(document.getElementById("shop-list"));
        if (name === "clinic") this.renderClinic();
        if (name === "camp") {
          if (typeof this.renderCamp === "function") this.renderCamp();
        }
        this.updateButtonStates(name);
        this.update();
        setTimeout(() => this.refreshFocusables(), 100);
      } catch (e) {
        this.error(`Ladefehler: ${e.message}`);
      }
    },
    updateButtonStates: function(activeName) {
      if (this.els.btnWiki) this.els.btnWiki.classList.toggle("active", activeName === "wiki");
      if (this.els.btnMap) this.els.btnMap.classList.toggle("active", activeName === "worldmap");
      if (this.els.btnChar) this.els.btnChar.classList.toggle("active", activeName === "char");
      if (this.els.btnInv) this.els.btnInv.classList.toggle("active", activeName === "inventory");
      if (this.els.btnQuests) this.els.btnQuests.classList.toggle("active", activeName === "quests");
    },
    // Diese Fassung wird von ui_render_overlays.restoreOverlay überschrieben.
    // Sie bleibt als dünner Aufruf erhalten, damit beide Wege dasselbe Ergebnis
    // liefern (vorher legte nur diese Version den Joystick an - siehe ANALYSE.md B2).
    restoreOverlay: function() {
      if (typeof this.ensureJoystick === "function") return this.ensureJoystick();
      if (typeof UI.restoreOverlay === "function" && UI.restoreOverlay !== this.restoreOverlay) {
        return UI.restoreOverlay();
      }
    },
    toggleControls: function(show) {
      if (!show && this.els.dialog) this.els.dialog.innerHTML = "";
    },
    showMobileControlsHint: function() {
      if (document.getElementById("mobile-hint")) return;
      const hintHTML = `
            <div id="mobile-hint" class="absolute inset-0 z-[100] flex flex-col justify-center items-center bg-black/80 pointer-events-auto backdrop-blur-sm opacity-0 transition-opacity duration-500" onclick="this.style.opacity='0'; setTimeout(() => this.remove(), 500)">
                <div class="border-2 border-[#39ff14] bg-black p-6 text-center shadow-[0_0_20px_#39ff14] max-w-sm mx-4">
                    <div class="text-5xl mb-4 animate-bounce">👆</div>
                    <h2 class="text-2xl font-bold text-[#39ff14] mb-2 tracking-widest border-b border-[#39ff14] pb-2">TOUCH STEUERUNG</h2>
                    <p class="text-green-300 mb-6 font-mono leading-relaxed">Tippe und halte IRGENDWO auf dem Hauptschirm (auch im Log), um den Joystick zu aktivieren.</p>
                    <div class="text-xs text-[#39ff14] animate-pulse font-bold bg-[#39ff14]/20 py-2 rounded">> TIPPEN ZUM STARTEN <</div>
                </div>
            </div>`;
      document.body.insertAdjacentHTML("beforeend", hintHTML);
      setTimeout(() => {
        const el = document.getElementById("mobile-hint");
        if (el) el.classList.remove("opacity-0");
      }, 10);
    },
    updatePlayerList: function() {
      if (!this.els.playerListContent || typeof Network === "undefined") return;
      this.els.playerListContent.innerHTML = "";
      const myName = Network.myDisplayName || "ICH";
      const mySec = Game.state && Game.state.sector ? `[${Game.state.sector.x},${Game.state.sector.y}]` : "[?,?]";
      const myEntry = document.createElement("div");
      myEntry.className = "text-green-400 font-bold border-b border-green-900 py-1";
      myEntry.textContent = `> ${myName} ${mySec}`;
      this.els.playerListContent.appendChild(myEntry);
      for (let pid in Network.otherPlayers) {
        const p = Network.otherPlayers[pid];
        const div = document.createElement("div");
        div.className = "text-green-200 text-sm py-1";
        const pSec = p.sector ? `[${p.sector.x},${p.sector.y}]` : "[?,?]";
        div.textContent = `${p.name} ${pSec}`;
        this.els.playerListContent.appendChild(div);
      }
    },
    togglePlayerList: function() {
      if (!this.els.playerList) return;
      if (this.els.playerList.style.display === "flex") {
        this.els.playerList.style.display = "none";
      } else {
        this.els.playerList.style.display = "flex";
        this.updatePlayerList();
      }
    }
  });

  // src/ui/ui_render_views.js
  if (!window.vatsObserverInit) {
    window.vatsObserverInit = true;
    setTimeout(() => {
      if (document.body) {
        const observer = new MutationObserver(() => {
          const nameEl = document.getElementById("enemy-name");
          if (nameEl && !nameEl.dataset.vatsApplied) {
            if (typeof UI.applyVatsStyle === "function") UI.applyVatsStyle();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }, 100);
  }
  Object.assign(UI, {
    openEquipMenu: function(slot) {
      if (!Game.state) return;
      const item = Game.state.equip ? Game.state.equip[slot] : null;
      if (item) {
        if (typeof this.showEquippedDialog === "function") this.showEquippedDialog(slot);
      } else {
        if (typeof this.showInfoDialog === "function") this.showInfoDialog("SLOT LEER", "Gehe ins Inventar, um Ausrüstung anzulegen.");
      }
    },
    handleHeaderClick: function() {
      if (!Game.state) return;
      const sPoints = Number(Game.state.statPoints || 0);
      const pPoints = Number(Game.state.perkPoints || 0);
      if (sPoints > 0) this.renderStats("special");
      else if (pPoints > 0) this.renderStats("perks");
      else this.renderStats("special");
    },
    renderView: function() {
      const container = document.getElementById("view-container");
      if (!container || !Game.state) return;
      container.innerHTML = "";
      document.querySelectorAll(".vats-fx-layer").forEach((e) => e.remove());
      switch (Game.state.view) {
        case "map":
          this.renderMapScanline(container);
          break;
        case "inv":
          if (this.renderInventory) this.renderInventory(container);
          break;
        case "char":
          this.renderStats(Game.state.charTab || "stats");
          break;
        case "journal":
          if (this.renderJournal) this.renderJournal(container);
          break;
        case "camp":
          if (this.renderCamp) this.renderCamp(container);
          break;
        case "city":
          if (this.renderCity) this.renderCity(container);
          break;
        case "worldmap":
          this.renderFullscreenWorldMap(container);
          break;
        default:
          container.innerHTML = `<div class="text-center p-10 text-red-500">ERROR: Unknown View ${Game.state.view}</div>`;
      }
      if (typeof UI.updateQuestTracker === "function") {
        setTimeout(() => UI.updateQuestTracker(), 50);
      }
    },
    renderMapScanline: function(container) {
      container.innerHTML = `
            <div class="relative w-full h-full bg-black overflow-hidden flex flex-col">
                <canvas id="game-canvas" class="block w-full h-full object-cover absolute inset-0"></canvas>
                <div id="scanline" class="pointer-events-none absolute inset-0 bg-repeat-y opacity-10"></div>
                <div id="vignette" class="pointer-events-none absolute inset-0 radial-gradient"></div>

                <div class="absolute bottom-4 left-4 text-green-400 font-mono text-sm bg-black/50 px-2 py-1 border border-green-900 z-40 pointer-events-none">
                    DIAGNOSE: ${Game.state.zone || "Unbekannt"}
                </div>
                <div class="absolute bottom-20 right-4 flex flex-col gap-2 md:hidden z-40">
                    <button onclick="Game.move(0, -1)" class="p-4 bg-green-900/30 border border-green-500 rounded active:bg-green-500 pointer-events-auto">⬆️</button>
                    <div class="flex gap-2">
                        <button onclick="Game.move(-1, 0)" class="p-4 bg-green-900/30 border border-green-500 rounded active:bg-green-500 pointer-events-auto">⬅️</button>
                        <button onclick="Game.move(1, 0)" class="p-4 bg-green-900/30 border border-green-500 rounded active:bg-green-500 pointer-events-auto">➡️</button>
                    </div>
                    <button onclick="Game.move(0, 1)" class="p-4 bg-green-900/30 border border-green-500 rounded active:bg-green-500 pointer-events-auto">⬇️</button>
                </div>
            </div>
        `;
      if (Game.initCanvas) Game.initCanvas();
    },
    renderFullscreenWorldMap: function(container) {
      container.innerHTML = `
            <div class="relative w-full h-full bg-[#050a05] overflow-hidden flex flex-col select-none">
                <div class="flex-grow relative overflow-hidden w-full h-full">
                    <canvas id="world-map-canvas" class="absolute inset-0 w-full h-full block cursor-move"></canvas>
                    <div class="pointer-events-none absolute inset-0 border-2 border-green-900/30 m-2 rounded-lg z-10"></div>
                </div>
                
                <div class="absolute top-4 left-0 w-full flex justify-center items-center pointer-events-none z-20">
                    <div class="bg-black/80 border-t-2 border-b-2 border-green-500 px-8 py-2 flex items-center gap-4 shadow-[0_0_15px_rgba(0,255,0,0.2)] backdrop-blur-sm pointer-events-auto">
                        <h2 class="text-xl font-bold text-green-400 tracking-[0.2em] uppercase text-shadow-glow">WELTKARTE</h2>
                        <button onclick="if(typeof UI.showMapLegend === 'function') UI.showMapLegend()" class="border border-green-500 text-green-500 hover:bg-green-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all bg-black/80">?</button>
                    </div>
                </div>

                <div class="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none z-20">
                    <div class="bg-black/90 border border-green-600 px-6 py-3 rounded-lg shadow-lg text-center backdrop-blur pointer-events-auto max-w-[90%]">
                        <div class="text-[10px] text-green-700 tracking-widest uppercase mb-1 border-b border-green-900/50 pb-1">PIP-OS V7.1.0 // GPS MODULE</div>
                        <div id="world-location-text" class="text-green-400 font-mono font-bold text-lg animate-pulse">
                            STANDORT WIRD BERECHNET...
                        </div>
                    </div>
                </div>

                <button onclick="UI.switchView('map')" class="absolute top-4 right-4 z-30 bg-red-900/20 border border-red-500/50 text-red-500 w-10 h-10 flex items-center justify-center hover:bg-red-900 hover:text-white transition-colors text-xl font-bold shadow-lg">✕</button>
            </div>
        `;
      if (UI.mapState) UI.mapState.centeredOnce = false;
      setTimeout(() => {
        if (UI.initWorldMapInteraction) UI.initWorldMapInteraction();
        if (UI.renderWorldMap) UI.renderWorldMap();
      }, 50);
    },
    renderStats: function(tab = "stats", event = null) {
      if (event) {
        event.stopPropagation();
        event.preventDefault();
      }
      Game.state.view = "char";
      Game.state.charTab = tab;
      const view = document.getElementById("view-container");
      if (!view) return;
      view.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.className = "absolute inset-0 w-full h-full flex flex-col bg-black z-20 overflow-hidden";
      wrapper.onclick = (e) => e.stopPropagation();
      const scrollId = "char-scroll-content";
      const scrollContainer = document.createElement("div");
      scrollContainer.id = scrollId;
      scrollContainer.className = "flex-1 w-full overflow-y-auto pb-24 bg-black";
      const getTabClass = (t) => tab === t ? "bg-green-500 text-black border-b-4 border-green-700 font-bold" : "bg-[#001100] text-green-600 border-b border-green-900";
      const header = document.createElement("div");
      header.className = "flex w-full border-b-2 border-green-900 bg-black sticky top-0 z-30";
      header.innerHTML = `
            <button onclick="UI.renderStats('stats', event)" class="flex-1 py-3 uppercase font-vt323 text-xl ${getTabClass("stats")}">STATUS</button>
            <button onclick="UI.renderStats('special', event)" class="flex-1 py-3 uppercase font-vt323 text-xl ${getTabClass("special")}">S.P.E.C.I.A.L.</button>
            <button onclick="UI.renderStats('perks', event)" class="flex-1 py-3 uppercase font-vt323 text-xl ${getTabClass("perks")}">PERKS</button>
        `;
      scrollContainer.appendChild(header);
      const content = document.createElement("div");
      content.className = "w-full p-4";
      if (tab === "stats") UI.renderCharacterVisuals(content);
      else if (tab === "special") UI.renderSpecialStats(content);
      else if (tab === "perks") UI.renderPerksList(content);
      scrollContainer.appendChild(content);
      wrapper.appendChild(scrollContainer);
      const footer = document.createElement("div");
      footer.className = "absolute bottom-0 left-0 w-full p-3 bg-black border-t-2 border-green-900 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.9)]";
      footer.innerHTML = `<button class="action-button w-full border-2 border-green-600 text-green-500 py-3 font-bold text-xl uppercase" onclick="UI.switchView('map')">ZURÜCK</button>`;
      wrapper.appendChild(footer);
      view.appendChild(wrapper);
      if (tab === "stats") setTimeout(() => UI.drawVaultBoy("char-silhouette-canvas"), 100);
    },
    renderCharacterVisuals: function(container) {
      const p = Game.state;
      const eq = p.equip || {};
      const renderSlot = (slotName, item, iconFallback) => {
        const hasItem = !!item;
        const name = hasItem ? item.props?.name || item.name : "LEER";
        return `
                <div class="flex flex-col items-center justify-center p-2 border-2 ${hasItem ? "border-green-500 bg-green-900/20" : "border-green-900/50"} rounded min-h-[80px] z-10 relative cursor-pointer hover:bg-green-900/40 transition-colors" onclick="UI.openEquipMenu('${slotName}')">
                    <div class="text-[8px] uppercase opacity-50 mb-1 pointer-events-none">${slotName}</div>
                    <div class="text-2xl mb-1 pointer-events-none">${hasItem && item.icon ? item.icon : iconFallback}</div>
                    <div class="text-[9px] text-center font-bold truncate w-full pointer-events-none">${name}</div>
                </div>
            `;
      };
      let actionText = '<span class="ml-2 text-xs uppercase border border-green-700 px-1 rounded text-green-500 opacity-50">Details ▶</span>';
      let highlightClass = "";
      if ((p.statPoints || 0) > 0 || (p.perkPoints || 0) > 0) {
        actionText = '<span class="ml-2 text-xs uppercase border border-yellow-500 bg-yellow-900/40 px-1 rounded text-yellow-400 font-bold animate-pulse">LEVEL UP! ▶</span>';
        highlightClass = "border-yellow-500/50 bg-yellow-900/10 shadow-[0_0_15px_rgba(255,255,0,0.1)]";
      }
      container.innerHTML = `
            <div class="flex flex-col items-center gap-4 max-w-md mx-auto">
                <div class="text-center w-full border-b border-green-900 pb-2 cursor-pointer hover:bg-green-900/20 transition-all group rounded p-2 relative z-50 ${highlightClass}" onclick="UI.handleHeaderClick(event)">
                    <div class="text-4xl font-bold text-green-400 group-hover:text-yellow-400 transition-colors text-shadow-md pointer-events-none">${p.playerName}</div>
                    <div class="text-xs font-mono text-green-600 group-hover:text-green-300 mt-1 pointer-events-none">
                        LVL ${p.lvl} | XP: ${p.xp} / ${Game.expToNextLevel(p.lvl)}
                        ${actionText}
                    </div>
                </div>
                <div class="grid grid-cols-3 grid-rows-4 gap-2 w-full relative mt-2 z-10">
                    <div class="col-start-2 row-start-1">${renderSlot("head", eq.head, "🧢")}</div>
                    <div class="col-start-1 row-start-2">${renderSlot("weapon", eq.weapon, "👊")}</div>
                    <div class="col-start-2 row-start-2">${renderSlot("body", eq.body, "👕")}</div>
                    <div class="col-start-3 row-start-2">${renderSlot("arms", eq.arms, "💪")}</div>
                    <div class="col-start-2 row-start-3">${renderSlot("legs", eq.legs, "👖")}</div>
                    <div class="col-start-3 row-start-3">${renderSlot("back", eq.back, "🎒")}</div>
                    <div class="col-start-2 row-start-4">${renderSlot("feet", eq.feet, "🥾")}</div>
                    <div class="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
                        <canvas id="char-silhouette-canvas" width="240" height="300"></canvas>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 w-full text-xs font-mono bg-green-900/10 p-3 rounded border border-green-900/50 mt-2 z-10">
                    <div class="flex justify-between border-b border-green-900/20 pb-1"><span>TP</span><span class="text-green-400 font-bold">${Math.round(p.hp)}/${p.maxHp}</span></div>
                    <div class="flex justify-between border-b border-green-900/20 pb-1"><span>DEF</span><span class="text-green-400 font-bold">${typeof Game.getStat === "function" ? Game.getStat("DEF") : 0}</span></div>
                    <div class="flex justify-between border-b border-green-900/20 pb-1"><span>KRIT</span><span class="text-green-400 font-bold">${p.critChance || 5}%</span></div>
                    <div class="flex justify-between border-b border-green-900/20 pb-1"><span>LOAD</span><span class="text-green-400 font-bold">${p.inventory?.length || 0}/${typeof Game.getMaxSlots === "function" ? Game.getMaxSlots() : 20}</span></div>
                </div>
            </div>
        `;
    },
    renderSpecialStats: function(container) {
      const stats = Game.state.stats || { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 };
      const points = Game.state.statPoints || 0;
      const labels = window.GameData.statLabels || { STR: "STÄRKE", PER: "WAHRNEHMUNG", END: "AUSDAUER", INT: "INTELLIGENZ", AGI: "BEWEGLICHKEIT", LUC: "GLÜCK" };
      let html = `<div class="text-center mb-6"><div class="text-xs text-green-600 mb-2">VERFÜGBARE PUNKTE</div><div class="text-5xl font-bold ${points > 0 ? "text-yellow-400" : "text-gray-600"}">${points}</div></div><div class="space-y-3">`;
      for (let key in labels) {
        const val = stats[key] || 1;
        const cost = val >= 10 ? 2 : 1;
        const canAfford = points >= cost;
        const isMaxed = val >= 20;
        let btnHtml = "";
        if (!isMaxed && canAfford) {
          btnHtml = `<button onclick="Game.upgradeStat('${key}', event)" class="w-10 h-10 bg-green-900 text-green-400 border border-green-500 font-bold text-xl rounded hover:bg-green-500 hover:text-black">+</button>`;
        } else if (!isMaxed && !canAfford && points > 0) {
          btnHtml = `<div class="w-10 h-10 flex items-center justify-center border border-red-900 text-red-700 font-bold bg-black opacity-50 cursor-not-allowed" title="Benötigt ${cost} Punkte">+</div>`;
        }
        html += `<div class="flex items-center justify-between bg-black/40 p-3 border border-green-900">
                <div class="flex flex-col"><span class="text-2xl font-bold text-green-400 font-vt323">${key}</span><span class="text-[10px] text-green-700">${labels[key]}</span></div>
                <div class="flex items-center gap-4"><span class="text-3xl font-bold text-white">${val}</span>${btnHtml}</div>
            </div>`;
      }
      container.innerHTML = html + "</div>";
    },
    renderPerksList: function(container) {
      const perks = window.GameData.perks || [];
      const myPerks = Game.state.perks || {};
      const points = Game.state.perkPoints || 0;
      let html = `<div class="text-center mb-6"><div class="text-xs text-green-600 mb-2">PERK-PUNKTE</div><div class="text-5xl font-bold ${points > 0 ? "text-yellow-400" : "text-gray-600"}">${points}</div></div><div class="space-y-3">`;
      perks.forEach((p) => {
        const cur = myPerks[p.id] || 0;
        const maxLvl = p.max || 5;
        const canBuy = points > 0 && cur < maxLvl && Game.state.lvl >= (p.minLvl || 1);
        html += `<div class="p-3 border ${cur > 0 ? "border-green-600 bg-green-900/10" : "border-green-900/30"}">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-green-300 text-lg">${p.icon || ""} ${p.name}</div>
                        <div class="text-xs text-green-700">Rang: ${cur}/${maxLvl}</div>
                    </div>
                    <button class="px-3 py-1 border text-xs font-bold ${canBuy ? "border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-black" : "border-gray-800 text-gray-600"}" ${canBuy ? `onclick="Game.choosePerk('${p.id}')"` : ""}>
                        ${cur >= maxLvl ? "MAX" : "LERNEN"}
                    </button>
                </div>
                <div class="text-xs text-gray-500 mt-1">${p.desc}</div>
            </div>`;
      });
      container.innerHTML = html + "</div>";
    },
    drawVaultBoy: function(canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#1aff1a";
      ctx.fillStyle = "#1aff1a";
      ctx.lineWidth = 2.5;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 60, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 85, 12, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 30);
      ctx.lineTo(cx + 18, cy - 30);
      ctx.lineTo(cx + 22, cy + 30);
      ctx.lineTo(cx - 22, cy + 30);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 18, cy - 20);
      ctx.lineTo(cx + 50, cy - 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 18, cy - 20);
      ctx.lineTo(cx - 40, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 30);
      ctx.lineTo(cx - 18, cy + 85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy + 30);
      ctx.lineTo(cx + 18, cy + 85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 65, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 10, cy - 65, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy - 60, 15, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    },
    renderCharacterSelection: function(saves) {
      this.charSelectMode = true;
      this.currentSaves = saves;
      if (this.els.loginScreen) this.els.loginScreen.style.display = "none";
      if (this.els.charSelectScreen) this.els.charSelectScreen.style.display = "flex";
      if (this.els.charSlotsList) this.els.charSlotsList.innerHTML = "";
      if (!this.deleteSaveSlot) {
        this.deleteSaveSlot = function(index) {
          if (typeof Game.deleteSave === "function") Game.deleteSave(index);
          else {
            localStorage.removeItem("save_" + index);
            localStorage.removeItem("slot_" + index);
            localStorage.removeItem("wasteland_save_" + index);
            localStorage.removeItem("vault_save_" + index);
          }
          window.location.reload();
        };
      }
      for (let i = 0; i < 5; i++) {
        const slot = document.createElement("div");
        slot.className = "char-slot border-2 border-green-900 bg-black/80 p-4 mb-2 relative";
        const save = saves[i];
        if (save) {
          const isDead = save.hp !== void 0 && save.hp <= 0 || save.isGameOver === true;
          if (isDead) {
            slot.className += " border-red-900 bg-red-950/20";
            slot.innerHTML = `
                        <div class="flex justify-between items-center w-full">
                            <div class="flex flex-col z-10">
                                <span class="text-xl text-red-500 font-bold">☠️ ${save.playerName}</span>
                                <span class="text-xs text-red-400 font-mono">VERSTORBEN (Level ${save.lvl})</span>
                            </div>
                            <button onclick="event.stopPropagation(); UI.deleteSaveSlot(${i})" class="bg-red-900 text-white font-bold px-4 py-2 text-xs rounded hover:bg-red-600 transition-colors shadow-[0_0_10px_red]">
                                LÖSCHEN 🗑️
                            </button>
                        </div>
                    `;
          } else {
            slot.className += " cursor-pointer hover:border-yellow-400 flex justify-between items-center group";
            slot.innerHTML = `
                        <div class="flex flex-col z-10">
                            <span class="text-xl text-yellow-400 font-bold">👤 ${save.playerName}</span>
                            <span class="text-xs text-green-300 font-mono">Level ${save.lvl}</span>
                        </div>
                        <button class="bg-green-700 text-black font-bold px-4 py-1 text-xs rounded group-hover:bg-[#39ff14]">START ▶</button>
                    `;
            slot.onclick = () => {
              if (typeof this.selectSlot === "function") this.selectSlot(i);
            };
          }
        } else {
          slot.className += " cursor-pointer hover:border-yellow-400 flex justify-center items-center group";
          slot.innerHTML = `<div class="text-gray-500 font-bold group-hover:text-yellow-400">+ NEUEN CHARAKTER</div>`;
          slot.onclick = () => {
            if (typeof this.selectSlot === "function") this.selectSlot(i);
          };
        }
        if (this.els.charSlotsList) this.els.charSlotsList.appendChild(slot);
      }
      if (typeof this.selectSlot === "function") {
        if (saves[0] && (saves[0].hp !== void 0 && saves[0].hp <= 0 || saves[0].isGameOver)) {
        } else {
          this.selectSlot(0);
        }
      }
    },
    renderSpawnList: function(players) {
      if (!this.els.spawnList) return;
      this.els.spawnList.innerHTML = "";
      for (let pid in players) {
        const p = players[pid];
        const btn = document.createElement("button");
        btn.className = "action-button w-full mb-2 text-left text-xs border-green-800 text-green-400 p-2";
        btn.innerHTML = `SIGNAL: ${p.name}`;
        btn.onclick = () => {
          if (this.els.spawnScreen) this.els.spawnScreen.style.display = "none";
          this.startGame(null, this.selectedSlot, null);
        };
        this.els.spawnList.appendChild(btn);
      }
    },
    renderCombat: function() {
      this.applyVatsStyle();
    },
    // --- ABSOLUTER FIX: VOLLBILD-SKYLINE, KEIN GITTER, LIVE HP ---
    applyVatsStyle: function() {
      const enemy = Game.state ? Game.state.enemy : null;
      if (!enemy) return;
      const nameEl = document.getElementById("enemy-name");
      if (!nameEl) return;
      if (nameEl.dataset.vatsApplied === "true") {
        const hpBar2 = document.getElementById("enemy-hp-bar");
        if (hpBar2) {
          const currentHp = Math.max(0, Math.floor(enemy.hp));
          const pct = Math.max(0, enemy.hp / enemy.maxHp * 100);
          let barColor = pct > 50 ? "#39ff14" : pct > 20 ? "#eab308" : "#ef4444";
          hpBar2.style.width = `${pct}%`;
          hpBar2.style.backgroundColor = barColor;
          hpBar2.style.boxShadow = `0 0 10px ${barColor}`;
          const parent = hpBar2.parentElement;
          if (parent) {
            const num = parent.querySelector(".vats-hp-num");
            if (num) num.innerText = `${currentHp} / ${enemy.maxHp} TP`;
          }
        }
        return;
      }
      nameEl.dataset.vatsApplied = "true";
      let root = nameEl.closest(".fixed") || nameEl.closest(".absolute");
      if (!root) root = nameEl.parentElement.parentElement;
      if (!root) return;
      root.style.backgroundColor = "#020802";
      root.style.backgroundImage = "none";
      root.querySelectorAll(".vats-fx-layer").forEach((e) => e.remove());
      root.querySelectorAll(".bg-black").forEach((el) => {
        el.classList.remove("bg-black");
        el.style.backgroundColor = "transparent";
      });
      const fxBg = document.createElement("div");
      fxBg.className = "vats-fx-layer absolute inset-0 pointer-events-none flex flex-col justify-end overflow-hidden z-[0]";
      fxBg.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" preserveAspectRatio="none" class="w-full h-full opacity-40">
                <rect width="1000" height="500" fill="url(#skylineGlow)" />
                <path d="M0,500 L0,300 L50,300 L50,150 L80,150 L80,220 L150,220 L150,100 L200,100 L200,180 L250,180 L250,50 L300,50 L300,190 L380,190 L380,260 L450,260 L450,80 L520,80 L520,230 L600,230 L600,120 L680,120 L680,270 L750,270 L750,160 L850,160 L850,310 L950,310 L950,200 L1000,200 L1000,500 Z" fill="#041204" stroke="#39ff14" stroke-width="2"/>
                <rect x="160" y="150" width="12" height="20" fill="#39ff14" class="animate-pulse" />
                <rect x="260" y="100" width="10" height="15" fill="#39ff14" opacity="0.5" />
                <rect x="470" y="130" width="15" height="25" fill="#eab308" class="animate-pulse" />
                <rect x="700" y="190" width="18" height="12" fill="#39ff14" />
                <defs>
                    <linearGradient id="skylineGlow" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="transparent"/>
                        <stop offset="100%" stop-color="#0a2a0a" stop-opacity="0.9"/>
                    </linearGradient>
                </defs>
            </svg>
        `;
      root.insertBefore(fxBg, root.firstChild);
      nameEl.innerHTML = `<span class="text-[#39ff14] animate-pulse mr-2">TARGET:</span><span class="text-green-300 font-mono tracking-widest text-shadow-glow">${enemy.name.toUpperCase()}</span>`;
      nameEl.className = "text-xl md:text-3xl font-bold flex items-center justify-center w-full border-b-2 border-green-500 pb-2 pt-2 mb-3 z-[10] relative text-shadow-md";
      const oldHpText = document.getElementById("enemy-hp-text");
      if (oldHpText) oldHpText.style.display = "none";
      const hpBar = document.getElementById("enemy-hp-bar");
      if (hpBar) {
        const currentHp = Math.max(0, Math.floor(enemy.hp));
        const pct = Math.max(0, enemy.hp / enemy.maxHp * 100);
        let barColor = pct > 50 ? "#39ff14" : pct > 20 ? "#eab308" : "#ef4444";
        hpBar.style.width = `${pct}%`;
        hpBar.className = "h-full transition-all duration-500";
        hpBar.style.backgroundColor = barColor;
        hpBar.style.boxShadow = `0 0 10px ${barColor}`;
        const parent = hpBar.parentElement;
        if (parent) {
          parent.className = "w-[90%] mx-auto max-w-sm bg-[#001000]/80 border-2 border-green-600 h-8 relative z-[10] overflow-hidden mb-6 shadow-[0_0_15px_rgba(0,255,0,0.1)]";
          parent.querySelectorAll(".vats-hp-overlay").forEach((e) => e.remove());
          parent.insertAdjacentHTML("beforeend", `
                    <div class="vats-hp-overlay absolute inset-0 flex justify-center items-center pointer-events-none z-30">
                        <span class="vats-hp-num font-mono font-bold text-white text-base tracking-widest" style="text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;">
                            ${currentHp} / ${enemy.maxHp} TP
                        </span>
                    </div>
                    <div class="vats-hp-overlay absolute inset-0 flex justify-between pointer-events-none opacity-50 z-20">
                        <div class="h-full w-[2px] bg-black ml-[25%]"></div>
                        <div class="h-full w-[2px] bg-black ml-[25%]"></div>
                        <div class="h-full w-[2px] bg-black ml-[25%]"></div>
                    </div>
                `);
        }
      }
      if (typeof Combat !== "undefined" && Combat.bodyParts) {
        Combat.bodyParts.forEach((part, index) => {
          const btn = document.getElementById(`btn-vats-${index}`);
          if (btn) {
            const chance = typeof Combat.calculateHitChance === "function" ? Combat.calculateHitChance(index) : 0;
            let textColor = chance > 65 ? "text-[#39ff14]" : chance > 35 ? "text-yellow-400" : "text-red-500";
            let barColor = chance > 65 ? "bg-[#39ff14]" : chance > 35 ? "bg-yellow-500" : "bg-red-500";
            let borderColor = chance > 65 ? "border-[#39ff14]" : chance > 35 ? "border-yellow-500" : "border-red-500";
            btn.onclick = (e) => {
              e.preventDefault();
              UI.triggerVatsAttack(index, chance);
            };
            btn.className = `relative w-full max-w-sm mx-auto bg-[#001000]/60 border-2 border-green-900/50 p-3 mb-3 cursor-pointer group hover:bg-[#002000]/80 transition-all z-[10] shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-[2px]`;
            btn.innerHTML = `
                        <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${borderColor} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all -translate-x-1 -translate-y-1"></div>
                        <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${borderColor} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all translate-x-1 -translate-y-1"></div>
                        <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${borderColor} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all -translate-x-1 translate-y-1"></div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${borderColor} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all translate-x-1 translate-y-1"></div>
                        
                        <div class="pointer-events-none w-full h-full flex items-center justify-between px-2 relative z-20">
                            <div class="flex flex-col text-left w-[60%]">
                                <span class="text-2xl md:text-4xl font-bold text-green-600 uppercase tracking-widest group-hover:text-green-300 transition-colors text-shadow-md">${part.name}</span>
                                <div class="w-full h-1 bg-green-900/50 mt-1 border border-green-900/80">
                                    <div class="h-full ${barColor}" style="width: ${chance}%"></div>
                                </div>
                            </div>
                            <div class="font-mono font-bold ${textColor} text-4xl md:text-5xl drop-shadow-[0_0_8px_currentColor] flex items-start">
                                ${chance}<span class="text-xl mt-1 opacity-80">%</span>
                            </div>
                        </div>
                     `;
          }
        });
      }
    },
    triggerVatsAttack: function(index, chance) {
      if (this._isAttacking) return;
      this._isAttacking = true;
      const nameEl = document.getElementById("enemy-name");
      const box = nameEl ? nameEl.closest(".bg-black") || nameEl.parentElement : null;
      const btn = document.getElementById(`btn-vats-${index}`);
      const enemyPreHp = Game.state.enemy ? Game.state.enemy.hp : 0;
      const playerPreHp = Game.state.hp;
      if (btn) btn.style.transform = "scale(1.05)";
      if (box) {
        box.style.transform = "translate(2px, 3px) rotate(0.5deg)";
      }
      setTimeout(() => {
        if (box) box.style.transform = "translate(-2px, -1px) rotate(-0.5deg)";
      }, 50);
      setTimeout(() => {
        if (box) box.style.transform = "translate(0px, 0px) rotate(0deg)";
      }, 200);
      setTimeout(() => {
        if (typeof Combat !== "undefined") Combat.playerAttack(index);
        const enemyPostHp = Game.state.enemy ? Game.state.enemy.hp : 0;
        const playerPostHp = Game.state.hp;
        const dmgDealt = enemyPreHp - enemyPostHp;
        const dmgTaken = playerPreHp - playerPostHp;
        if (dmgTaken > 0) {
          this.spawnFloatingText(`-${Math.round(dmgTaken)} HP`, "#ef4444", "bottom-[20%] left-1/2", box);
          const dmgFlash = document.createElement("div");
          dmgFlash.className = "absolute inset-0 z-[4900] bg-red-600/30 pointer-events-none opacity-0 transition-opacity mix-blend-overlay";
          if (box) box.appendChild(dmgFlash);
          requestAnimationFrame(() => dmgFlash.style.opacity = "1");
          setTimeout(() => {
            dmgFlash.style.opacity = "0";
            setTimeout(() => dmgFlash.remove(), 300);
          }, 100);
        }
        if (dmgDealt > 0) {
          this.spawnFloatingText(`-${Math.round(dmgDealt)} HP`, "#39ff14", "top-[20%] right-[10%]", box);
        } else if (Game.state.enemy && dmgDealt === 0) {
          this.spawnFloatingText(`MISSED!`, "#9ca3af", "top-[20%] right-[10%]", box);
        }
        if (btn) btn.style.transform = "scale(1)";
        if (nameEl) nameEl.dataset.vatsApplied = "false";
        this.applyVatsStyle();
        this._isAttacking = false;
      }, 250);
    },
    spawnFloatingText: function(text, color, positionClasses, container) {
      if (!container) container = document.body;
      const floater = document.createElement("div");
      floater.className = `absolute ${positionClasses} z-[6000] font-mono font-bold text-3xl md:text-5xl pointer-events-none drop-shadow-[0_0_5px_#000]`;
      floater.style.color = color;
      floater.style.transform = "translate(-50%, -50%) scale(0.8)";
      floater.style.transition = "all 0.8s ease-out";
      floater.innerText = text;
      container.appendChild(floater);
      const driftX = (Math.random() - 0.5) * 40;
      requestAnimationFrame(() => {
        floater.style.transform = `translate(calc(-50% + ${driftX}px), -80px) scale(1.1)`;
        floater.style.opacity = "0";
      });
      setTimeout(() => floater.remove(), 800);
    }
  });

  // src/ui/ui_render_minigames.js
  Object.assign(UI, {
    getMinigameInfo: function(type) {
      let title = "MINIGAME", text = "";
      if (type === "hacking") {
        title = "TERMINAL HACKING";
        text = "Finde das korrekte Passwort.<br>Likeness = Anzahl korrekter Buchstaben an der richtigen Position.<br><span class='text-yellow-500'>Sperrt das Terminal bei Fehlschlag.</span>";
      } else if (type === "lockpicking") {
        title = "SCHLOSS KNACKEN";
        text = "Bewege die Maus (links/rechts), um den Dietrich zu platzieren.<br>Drücke LEERTASTE oder 'DREHEN', um das Schloss zu testen.<br><span class='text-yellow-500'>Dietrich kann bei zu viel Druck abbrechen!</span>";
      } else if (type === "dice") {
        title = "WASTELAND GAMBLE";
        text = "Würfle eine hohe Augenzahl!<br>Dein Glück (LUC) Attribut gibt einen Bonus auf das Ergebnis.";
      } else if (type === "defusal") {
        title = "BOMBE ENTSCHÄRFEN";
        text = "Reaktionstest: Drücke 'CUT WIRE', genau wenn der weiße Balken über dem grünen Bereich ist.<br>Du musst 3 Kabel trennen.<br><span class='text-red-500 animate-pulse'>WARNUNG: Bei Fehler explodiert die Bombe (Schaden + Strahlung)!</span>";
      } else if (type === "memory") {
        title = "SECURITY OVERRIDE";
        text = "Merk dir die Sequenz! Die Felder leuchten auf. Wiederhole die Reihenfolge danach exakt.<br><span class='text-red-500'>ACHTUNG: Falsche Eingabe löst Abwehrmechanismus aus (Schaden)!</span>";
      }
      return { title, text };
    },
    // Prüft, ob ein Minispiel überhaupt existiert. Aufrufer können damit
    // vorher fragen, statt auf einen stillen Abbruch zu laufen.
    hasMinigame: function(type) {
      return typeof MiniGames !== "undefined" && !!MiniGames[type];
    },
    startMinigame: function(type, ...args) {
      if (!this.hasMinigame(type)) {
        if (typeof console !== "undefined") console.warn(`startMinigame: unbekanntes Minispiel "${type}"`);
        return false;
      }
      const launch = () => {
        MiniGames.active = type;
        if (typeof MiniGames[type].init === "function") {
          try {
            MiniGames[type].init(...args);
          } catch (e) {
            console.error(e);
          }
        }
      };
      if (!Game || !Game.state) {
        launch();
        return;
      }
      if (!Game.state.tutorialsSeen) Game.state.tutorialsSeen = {};
      setTimeout(() => {
        if (!Game.state.tutorialsSeen[type]) {
          this.showMinigameTutorial(type, () => {
            Game.state.tutorialsSeen[type] = true;
            Game.saveGame();
            launch();
          });
        } else {
          launch();
        }
      }, 50);
    },
    showMinigameTutorial: function(type, onConfirm) {
      const info = this.getMinigameInfo(type);
      if (this.els && this.els.dialog) {
        this.els.dialog.style.display = "flex";
        this.els.dialog.innerHTML = `
                <div class="bg-black/95 border-2 border-green-500 p-6 rounded-lg shadow-[0_0_50px_#0f0] text-center w-full max-w-md pointer-events-auto relative z-[3000]">
                    <h3 class="text-2xl font-bold text-green-400 mb-2 tracking-widest border-b border-green-800 pb-2">${info.title}</h3>
                    <div class="text-gray-300 mb-6 font-mono text-sm leading-relaxed min-h-[80px] flex flex-col items-center justify-center gap-2">
                        <p>${info.text}</p>
                    </div>
                    <div class="flex justify-center">
                        <button id="btn-tutorial-start" class="border-2 border-green-500 bg-green-900/40 text-green-400 px-8 py-3 font-bold hover:bg-green-500 hover:text-black transition-all uppercase tracking-widest animate-pulse">
                            SYSTEM STARTEN
                        </button>
                    </div>
                </div>
            `;
        const btn = document.getElementById("btn-tutorial-start");
        if (btn) {
          btn.onclick = () => {
            this.els.dialog.style.display = "none";
            this.els.dialog.innerHTML = "";
            if (onConfirm) onConfirm();
          };
        }
      } else {
        alert(info.title + "\n\n" + info.text.replace(/<[^>]*>?/gm, "\n"));
        if (onConfirm) onConfirm();
      }
    },
    stopMinigame: function() {
      if (typeof MiniGames !== "undefined" && MiniGames.defusal && MiniGames.defusal.gameLoop) {
        clearInterval(MiniGames.defusal.gameLoop);
      }
      if (typeof MiniGames !== "undefined") MiniGames.active = null;
      const dice = document.getElementById("dice-overlay");
      if (dice) dice.classList.add("hidden");
      if (typeof UI.switchView === "function") {
        UI.switchView("map");
      } else {
        if (Game.state) Game.state.view = "map";
        if (this.els && this.els.view) this.els.view.innerHTML = "";
      }
    },
    renderMinigame: function() {
      if (typeof MiniGames === "undefined" || !MiniGames.active) return;
      if (MiniGames.active === "hacking") UI.renderHacking();
      if (MiniGames.active === "lockpicking") UI.renderLockpicking();
      if (MiniGames.active === "defusal") UI.renderDefusal();
      if (MiniGames.active === "memory") UI.renderMemory();
    },
    // --- HACKING ---
    renderHacking: function() {
      const h = MiniGames.hacking;
      if (!h) return;
      let html = `
            <div class="w-full h-full flex flex-col p-2 font-mono text-green-500 bg-black overflow-hidden relative">
                <div class="flex justify-between border-b border-green-500 mb-2 pb-1">
                    <span class="font-bold">ROBCO TERM-LINK</span>
                    <div class="flex gap-2">
                        <button class="border border-green-500 px-2 text-xs hover:bg-green-900" onclick="UI.showMiniGameHelp('hacking')">?</button>
                        <span class="animate-pulse">ATTEMPTS: ${"█ ".repeat(h.attempts)}</span>
                    </div>
                </div>
                <div class="flex-grow flex gap-4 overflow-hidden relative">
                    <div id="hack-words" class="flex flex-col flex-wrap h-full content-start gap-x-8 text-sm"></div>
                    <div class="w-1/3 border-l border-green-900 pl-2 text-xs overflow-y-auto flex flex-col-reverse" id="hack-log">
                        ${h.logs.map((l) => `<div>${l}</div>`).join("")}
                    </div>
                </div>
                <button class="absolute bottom-2 right-2 border border-red-500 text-red-500 px-2 text-xs hover:bg-red-900" onclick="MiniGames.hacking.end()">ABORT</button>
            </div>
        `;
      if (this.els.view && !this.els.view.innerHTML.includes("ROBCO")) {
        this.els.view.innerHTML = html;
      } else {
        const log = document.getElementById("hack-log");
        if (log) log.innerHTML = h.logs.map((l) => `<div>${l}</div>`).join("");
        const attempts = document.querySelector(".animate-pulse");
        if (attempts) attempts.textContent = `ATTEMPTS: ${"█ ".repeat(h.attempts)}`;
      }
      const wordContainer = document.getElementById("hack-words");
      if (wordContainer && wordContainer.innerHTML === "") {
        h.words.forEach((word) => {
          const hex = `0x${Math.floor(Math.random() * 65535).toString(16).toUpperCase()}`;
          const btn = document.createElement("div");
          btn.className = "hack-row";
          btn.innerHTML = `<span class="hack-hex">${hex}</span> ${word}`;
          btn.onclick = () => MiniGames.hacking.checkWord(word);
          wordContainer.appendChild(btn);
        });
      }
    },
    // --- LOCKPICKING ---
    renderLockpicking: function(init = false) {
      if (init && this.els.view) {
        this.els.view.innerHTML = `
                <div id="lockpicking-root" class="w-full h-full flex flex-col items-center justify-center bg-black relative select-none">
                    <div class="absolute top-2 left-2 text-xs text-gray-500">LEVEL: ${MiniGames.lockpicking.difficulty.toUpperCase()}</div>
                    <button class="absolute top-2 right-2 border border-green-500 text-green-500 px-2 font-bold hover:bg-green-900 z-50" onclick="UI.showMiniGameHelp('lockpicking')">?</button>
                    
                    <div class="lock-container" id="lock-zone">
                        <div class="lock-inner" id="lock-rotator">
                             <div class="lock-center"></div>
                        </div>
                        <div class="bobby-pin" id="bobby-pin"></div>
                        <div class="screwdriver"></div>
                    </div>

                    <div class="mt-8 text-center text-sm text-green-300 font-mono">
                        <p class="mb-1">MAUS: Dietrich bewegen</p>
                        <p>LEERTASTE / KNOPF: Drehen</p>
                    </div>
                    
                    <button id="btn-turn-lock" class="mt-4 border-2 border-yellow-400 bg-yellow-900/30 text-yellow-400 w-48 h-16 text-xl font-bold tracking-widest active:bg-yellow-400 active:text-black md:hidden">
                        DREHEN
                    </button>
                    
                    <button class="absolute bottom-4 right-4 border border-red-500 text-red-500 px-3 py-1 hover:bg-red-900" onclick="MiniGames.lockpicking.end()">ABBRECHEN</button>
                </div>
            `;
        const root = document.getElementById("lockpicking-root");
        const btn = document.getElementById("btn-turn-lock");
        const tryRotate = (e) => {
          if (e && e.preventDefault) e.preventDefault();
          MiniGames.lockpicking.rotateLock();
        };
        const stopRotate = (e) => {
          if (e && e.preventDefault) e.preventDefault();
          MiniGames.lockpicking.releaseLock();
        };
        if (btn) {
          btn.addEventListener("touchstart", tryRotate);
          btn.addEventListener("touchend", stopRotate);
          btn.addEventListener("mousedown", tryRotate);
          btn.addEventListener("mouseup", stopRotate);
        }
        document.onkeydown = (e) => {
          if (e.code === "Space") MiniGames.lockpicking.rotateLock();
        };
        document.onkeyup = (e) => {
          if (e.code === "Space") MiniGames.lockpicking.releaseLock();
        };
        const updatePinPosition = (clientX) => {
          if (MiniGames.active !== "lockpicking") return;
          const screenWidth = window.innerWidth;
          const percentage = Math.max(0, Math.min(1, clientX / screenWidth));
          const angle = percentage * 180 - 90;
          MiniGames.lockpicking.currentAngle = angle;
          const pin2 = document.getElementById("bobby-pin");
          if (pin2) pin2.style.transform = `rotate(${angle}deg)`;
        };
        if (root) {
          root.addEventListener("mousemove", (e) => updatePinPosition(e.clientX));
          root.addEventListener("touchmove", (e) => {
            if (e.touches[0]) updatePinPosition(e.touches[0].clientX);
          });
        }
      }
      const pin = document.getElementById("bobby-pin");
      const lock = document.getElementById("lock-rotator");
      if (pin && !init) pin.style.transform = `rotate(${MiniGames.lockpicking.currentAngle}deg)`;
      if (lock) lock.style.transform = `rotate(${MiniGames.lockpicking.lockAngle}deg)`;
    },
    // --- DICE ---
    renderDice: function(game, finalResult = null) {
      let container = document.getElementById("dice-overlay");
      if (!container) {
        container = document.createElement("div");
        container.id = "dice-overlay";
        container.className = "hidden fixed inset-0 z-[2000] pointer-events-auto";
        document.body.appendChild(container);
      }
      container.classList.remove("hidden");
      const luck = Game.getStat("LUC") || 1;
      const bonus = Math.floor(luck / 2);
      let resultHtml = "";
      if (finalResult !== null) {
        resultHtml = `<div class="mt-4 text-3xl font-bold text-green-400 animate-pulse border-2 border-green-500 bg-black/80 p-2">ERGEBNIS: ${finalResult}</div>`;
      }
      container.innerHTML = `
            <div class="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-6">
                <div class="border-4 border-yellow-500 p-8 bg-[#1a1100] shadow-[0_0_50px_#ffd700] text-center w-full max-w-md relative">
                    <h2 class="text-4xl font-bold text-yellow-400 mb-6 font-vt323 tracking-widest animate-pulse">WASTELAND GAMBLE</h2>
                    <div class="flex justify-center gap-4 mb-8">
                        <div class="w-20 h-20 bg-black border-2 border-yellow-600 flex items-center justify-center text-5xl text-yellow-500 font-bold shadow-inner">
                            ${game.d1}
                        </div>
                        <div class="w-20 h-20 bg-black border-2 border-yellow-600 flex items-center justify-center text-5xl text-yellow-500 font-bold shadow-inner">
                            ${game.d2}
                        </div>
                        <div class="w-20 h-20 bg-black border-2 border-yellow-600 flex items-center justify-center text-5xl text-yellow-500 font-bold shadow-inner">
                            ${game.d3 || 1}
                        </div>
                    </div>
                    <div class="text-yellow-200 font-mono text-sm mb-6 bg-black/40 p-2 rounded">
                        Glück (LUC): <span class="text-white font-bold">${luck}</span> 
                        <span class="text-gray-400">|</span> Bonus: <span class="text-[#39ff14] font-bold">+${bonus}</span>
                    </div>
                    ${!game.rolling && finalResult === null ? `<button onclick="MiniGames.dice.roll()" class="w-full py-4 text-2xl font-bold bg-yellow-600 text-black hover:bg-yellow-400 transition-all border-2 border-yellow-400 uppercase tracking-widest shadow-lg cursor-pointer">🎲 WÜRFELN</button>` : `<div class="text-yellow-500 text-xl font-bold h-16 flex items-center justify-center">${finalResult !== null ? "Loot wird berechnet..." : "ROLLING..."}</div>`}
                    ${resultHtml}
                </div>
            </div>
        `;
    },
    // --- DEFUSAL ---
    renderDefusal: function() {
      const game = MiniGames.defusal;
      if (!document.getElementById("defusal-game-root") && this.els.view) {
        this.els.view.innerHTML = `
                <div id="defusal-game-root" class="w-full h-full flex flex-col items-center justify-center bg-black p-4 select-none relative font-mono text-green-500">
                    <div class="border-2 border-green-500 bg-[#001100] p-6 w-full max-w-lg shadow-[0_0_20px_#0f0] relative">
                        <div class="flex justify-between items-center border-b border-green-700 pb-2 mb-4">
                            <h2 class="text-2xl font-bold tracking-widest animate-pulse text-red-500">BOMB DEFUSAL</h2>
                            <button class="border border-green-500 px-2 text-xs hover:bg-green-900" onclick="UI.showMiniGameHelp('defusal')">?</button>
                        </div>

                        <div id="defusal-lights" class="flex justify-center gap-4 mb-6"></div>

                        <div class="w-full h-12 border-2 border-green-500 relative bg-black overflow-hidden mb-6">
                            <div id="defusal-zone" class="absolute top-0 bottom-0 bg-green-500/30 border-x border-green-500"></div>
                            <div id="defusal-cursor" class="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]"></div>
                        </div>

                        <button onmousedown="MiniGames.defusal.cutWire()" ontouchstart="event.preventDefault(); MiniGames.defusal.cutWire()"
                            class="w-full py-4 text-xl font-bold bg-red-900/30 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all uppercase tracking-widest active:scale-95">
                            ✂️ CUT WIRE
                        </button>
                    </div>
                    
                    <div class="absolute bottom-4 text-xs text-gray-500 text-center">
                        PER erhöht Breite • AGI senkt Tempo
                    </div>
                </div>
            `;
      }
      const cursor = document.getElementById("defusal-cursor");
      if (cursor) cursor.style.left = game.cursor + "%";
      const zone = document.getElementById("defusal-zone");
      if (zone) {
        zone.style.left = game.zoneStart + "%";
        zone.style.width = game.zoneWidth + "%";
      }
      const lightsContainer = document.getElementById("defusal-lights");
      if (lightsContainer) {
        const lightsHtml = [1, 2, 3].map((i) => {
          let color = "bg-gray-800";
          if (i < game.round) color = "bg-green-500 shadow-[0_0_10px_#0f0]";
          if (i === game.round) color = "bg-red-500 animate-ping";
          return `<div class="w-4 h-4 rounded-full ${color} border border-green-900"></div>`;
        }).join("");
        if (lightsContainer.innerHTML !== lightsHtml) {
          lightsContainer.innerHTML = lightsHtml;
        }
      }
    },
    // --- MEMORY UI ---
    renderMemory: function() {
      const game = MiniGames.memory;
      if (!document.getElementById("memory-game-root") && this.els.view) {
        this.els.view.innerHTML = `
                <div id="memory-game-root" class="w-full h-full flex flex-col items-center justify-center bg-black p-4 select-none relative font-mono text-green-500">
                    <div class="border-2 border-green-500 bg-[#001100] p-6 shadow-[0_0_25px_#0f0] flex flex-col items-center gap-4">
                        <div class="flex justify-between w-full border-b border-green-700 pb-2">
                            <h2 class="text-xl font-bold tracking-widest animate-pulse">SECURITY OVERRIDE</h2>
                            <button class="border border-green-500 px-2 text-xs hover:bg-green-900" onclick="UI.showMiniGameHelp('memory')">?</button>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-3 bg-black border border-green-900 p-3">
                            ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `
                                <button id="mem-btn-${i}" onclick="MiniGames.memory.input(${i})" 
                                    class="w-16 h-16 border-2 border-green-800 bg-black hover:border-green-400 active:bg-green-900 transition-all shadow-inner relative">
                                    <div class="absolute inset-2 bg-green-500 opacity-0 transition-opacity duration-100" id="mem-light-${i}"></div>
                                </button>
                            `).join("")}
                        </div>

                        <div class="text-center text-xs h-4">
                            ${game.showing ? '<span class="text-red-400 animate-pulse">DATEN EMPFANG...</span>' : '<span class="text-green-400">BEREIT FÜR EINGABE</span>'}
                        </div>
                    </div>
                </div>
            `;
      }
      for (let i = 0; i < 9; i++) {
        const light = document.getElementById(`mem-light-${i}`);
        if (light) {
          if (game.activeCell === i) {
            light.style.opacity = "1";
            light.classList.add("shadow-[0_0_15px_#0f0]");
          } else {
            light.style.opacity = "0";
            light.classList.remove("shadow-[0_0_15px_#0f0]");
          }
        }
      }
    },
    showMiniGameHelp: function(type) {
      const info = this.getMinigameInfo(type);
      if (typeof this.showInfoDialog === "function") {
        this.showInfoDialog(info.title, info.text);
      } else {
        alert(info.title + ": " + info.text.replace(/<[^>]*>?/gm, ""));
      }
    }
  });

  // src/ui/ui_render_overlays.js
  if (!window.ghostTownObserverInit) {
    window.ghostTownObserverInit = true;
    setInterval(() => {
      if (typeof Game !== "undefined" && Game.state && Game.state.view === "map" && !Game.state.inDialog) {
        let isGhost = false;
        if (Game.state.zone && (Game.state.zone.toLowerCase().includes("ghost") || Game.state.zone.toLowerCase().includes("geister"))) {
          isGhost = true;
        }
        try {
          const t = Game.state.currentMap[Game.state.player.y][Game.state.player.x];
          if (t === "G") isGhost = true;
        } catch (e) {
        }
        if (isGhost) {
          if (!UI._ghostTownActive) UI.startGhostTownEffects();
        } else {
          if (UI._ghostTownActive) UI.stopGhostTownEffects();
        }
      } else {
        if (UI._ghostTownActive) UI.stopGhostTownEffects();
      }
    }, 1e3);
  }
  Object.assign(UI, {
    restoreOverlay: function() {
      let overlay = document.getElementById("ui-dialog-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "ui-dialog-overlay";
        overlay.className = "absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden pointer-events-auto";
        document.body.appendChild(overlay);
        this.els.dialog = overlay;
      }
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          e.preventDefault();
          e.stopPropagation();
          UI.leaveDialog();
        }
      };
      this.ensureJoystick();
      return overlay;
    },
    ensureJoystick: function() {
      if (!document.getElementById("joystick-base")) {
        document.body.insertAdjacentHTML("beforeend", `
                <div id="joystick-base" style="position: absolute; width: 100px; height: 100px; border-radius: 50%; border: 2px solid rgba(57, 255, 20, 0.5); background: rgba(0, 0, 0, 0.2); display: none; pointer-events: none; z-index: 9999;"></div>
                <div id="joystick-stick" style="position: absolute; width: 50px; height: 50px; border-radius: 50%; background: rgba(57, 255, 20, 0.8); display: none; pointer-events: none; z-index: 10000; box-shadow: 0 0 10px #39ff14;"></div>
            `);
      }
      this.els.joyBase = document.getElementById("joystick-base");
      this.els.joyStick = document.getElementById("joystick-stick");
    },
    leaveDialog: function() {
      if (Game.state) Game.state.inDialog = false;
      if (this._activeEscHandler) {
        document.removeEventListener("keydown", this._activeEscHandler);
        this._activeEscHandler = null;
      }
      const overlay = this.els.dialog || document.getElementById("ui-dialog-overlay");
      if (overlay) {
        overlay.style.display = "none";
        overlay.innerHTML = "";
      }
      if (typeof this.update === "function") this.update();
      if (document.getElementById("inventory-list")) {
        if (typeof UI.renderInventory === "function") UI.renderInventory();
      }
    },
    _trapEscKey: function() {
      if (this._activeEscHandler) document.removeEventListener("keydown", this._activeEscHandler);
      this._activeEscHandler = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          UI.leaveDialog();
        }
      };
      document.addEventListener("keydown", this._activeEscHandler);
    },
    updateQuestTracker: function() {
      return;
    },
    showConfirm: function(title, htmlContent, onConfirm) {
      if (Game.state) Game.state.inDialog = true;
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      this._trapEscKey();
      const box = document.createElement("div");
      box.className = "bg-black border-2 border-yellow-400 p-4 shadow-[0_0_20px_#aa0] max-w-md w-full relative animate-float-in pointer-events-auto mx-4";
      box.onclick = (e) => e.stopPropagation();
      box.innerHTML = `
            <h2 class="text-2xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2 tracking-widest">${title}</h2>
            <div class="text-green-300 mb-6 font-mono text-sm leading-relaxed">${htmlContent}</div>
            <div class="flex gap-4">
                <button id="btn-confirm-yes" class="action-button flex-1 border-green-500 text-green-500 hover:bg-green-900 font-bold py-2">BESTÄTIGEN</button>
                <button id="btn-confirm-no" class="action-button flex-1 border-red-500 text-red-500 hover:bg-red-900 font-bold py-2">ABBRUCH</button>
            </div>
        `;
      overlay.appendChild(box);
      document.getElementById("btn-confirm-yes").onclick = () => {
        UI.leaveDialog();
        if (onConfirm) onConfirm();
      };
      document.getElementById("btn-confirm-no").onclick = () => {
        UI.leaveDialog();
      };
    },
    showInfoDialog: function(title, htmlContent) {
      if (Game.state) Game.state.inDialog = true;
      const infoOverlay = document.createElement("div");
      infoOverlay.className = "fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn pointer-events-auto";
      const box = document.createElement("div");
      box.className = "bg-black border-2 border-yellow-400 p-4 shadow-[0_0_20px_#aa0] max-w-md w-full relative animate-float-in pointer-events-auto mx-4";
      box.onclick = (e) => e.stopPropagation();
      box.innerHTML = `
            <h2 class="text-2xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2">${title}</h2>
            <div class="text-green-300 mb-6 font-mono text-sm max-h-[60vh] overflow-y-auto custom-scroll">${htmlContent}</div>
        `;
      const btn = document.createElement("button");
      btn.className = "action-button w-full border-green-500 text-green-500 hover:bg-green-900";
      btn.textContent = "VERSTANDEN";
      const closeLayer2 = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        infoOverlay.remove();
        const baseOverlay = document.getElementById("ui-dialog-overlay");
        const isBaseOpen = baseOverlay && baseOverlay.style.display !== "none";
        if (!isBaseOpen) {
          if (Game.state) Game.state.inDialog = false;
        }
      };
      btn.onclick = closeLayer2;
      infoOverlay.onclick = (e) => {
        if (e.target === infoOverlay) closeLayer2(e);
      };
      box.appendChild(btn);
      infoOverlay.appendChild(box);
      document.body.appendChild(infoOverlay);
    },
    showItemConfirm: function(invIndex) {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      this._trapEscKey();
      if (!Game.state.inventory || !Game.state.inventory[invIndex]) return;
      const invItem = Game.state.inventory[invIndex];
      const item = Game.items[invItem.id];
      if (!item) return;
      if (Game.state) Game.state.inDialog = true;
      const box = document.createElement("div");
      box.className = "bg-black border-2 border-green-500 p-4 shadow-[0_0_15px_green] max-w-sm text-center mb-4 w-full pointer-events-auto";
      box.onclick = (e) => e.stopPropagation();
      const isStimpack = invItem.id && invItem.id.toLowerCase().includes("stimpack") || item.name && item.name.toLowerCase().includes("stimpack");
      if (isStimpack) {
        box.innerHTML = `
                <h2 class="text-xl font-bold text-green-400 mb-2 border-b border-green-500 pb-2">${item.name}</h2>
                <div class="text-xs text-green-200 mb-4 bg-green-900/20 p-2">
                    <div class="flex justify-between"><span>TP Aktuell:</span> <span class="text-white font-bold">${Math.floor(Game.state.hp)} / ${Game.state.maxHp}</span></div>
                    <div class="flex justify-between"><span>Verfügbar:</span> <span class="text-yellow-400 font-bold">${invItem.count} Stück</span></div>
                </div>
                
                <div class="flex flex-col gap-3 w-full">
                    <button id="btn-use-one" class="action-button border-green-500 text-green-500 hover:bg-green-900 py-3 font-bold flex justify-between px-4">
                        <span>1x BENUTZEN</span>
                        <span class="text-xs mt-1 text-green-300">+${item.val} HP</span>
                    </button>
                    <button id="btn-use-max" class="action-button border-blue-500 text-blue-400 hover:bg-blue-900 py-3 font-bold flex justify-between px-4">
                        <span>AUTO-HEAL (MAX)</span>
                        <span class="text-xs mt-1 text-blue-200">Bis voll</span>
                    </button>
                    <button id="btn-cancel" class="action-button border-red-500 text-red-500 hover:bg-red-900 py-2 font-bold mt-2">
                        ABBRUCH
                    </button>
                </div>
            `;
        overlay.appendChild(box);
        document.getElementById("btn-use-one").onclick = () => {
          Game.useItem(invIndex, 1);
          setTimeout(() => UI.leaveDialog(), 50);
        };
        document.getElementById("btn-use-max").onclick = () => {
          Game.useItem(invIndex, "max");
          setTimeout(() => UI.leaveDialog(), 50);
        };
        document.getElementById("btn-cancel").onclick = () => {
          UI.leaveDialog();
        };
        return;
      }
      let statsText = "";
      let displayName = item.name;
      if (invItem.props) {
        displayName = invItem.props.name;
        if (invItem.props.dmgMult) statsText = `Schaden: ${Math.floor(item.baseDmg * invItem.props.dmgMult)} (Mod)`;
      } else {
        if (item.raw) statsText = `Roh essbar: +${item.raw.heal} HP, +${item.raw.rad} RAD`;
        else if (item.type === "consumable") statsText = `Effekt: ${item.effect} (${item.val})`;
        else if (item.type === "weapon") statsText = `Schaden: ${item.baseDmg}`;
        else if (item.type === "body") statsText = `Rüstung: +${item.bonus ? item.bonus.END : 0} END`;
        else if (item.type === "junk" || item.type === "component") statsText = "Material / Schrott";
        else statsText = item.desc || "Item";
      }
      const isUsable = !!item.raw || !["junk", "component", "misc", "rare", "ammo"].includes(item.type);
      box.innerHTML = `
            <h2 class="text-xl font-bold text-green-400 mb-2">${displayName}</h2>
            <div class="text-xs text-green-200 mb-4 border-t border-b border-green-900 py-2">Typ: ${item.type.toUpperCase()}<br>Wert: ${item.cost} KK<br><span class="text-yellow-400">${statsText}</span></div>
            <p class="text-green-200 mb-4 text-sm">${isUsable ? "Gegenstand benutzen oder wegwerfen?" : "Dieses Item kann nur verkauft oder zum Craften verwendet werden."}</p>
        `;
      const btnContainer = document.createElement("div");
      btnContainer.className = "flex flex-col gap-2 w-full mt-2";
      if (isUsable) {
        const btnYes = document.createElement("button");
        btnYes.className = "border border-green-500 text-green-500 hover:bg-green-900 px-4 py-3 font-bold w-full text-lg";
        btnYes.textContent = "BENUTZEN / AUSRÜSTEN";
        btnYes.onclick = () => {
          Game.useItem(invIndex);
          setTimeout(() => UI.leaveDialog(), 50);
        };
        btnContainer.appendChild(btnYes);
      }
      const row = document.createElement("div");
      row.className = "flex gap-2 w-full";
      const btnTrash = document.createElement("button");
      btnTrash.className = "border border-red-500 text-red-500 hover:bg-red-900 px-4 py-2 font-bold flex-1";
      btnTrash.innerHTML = "WEGWERFEN 🗑️";
      btnTrash.onclick = () => {
        Game.destroyItem(invIndex);
        setTimeout(() => UI.leaveDialog(), 50);
      };
      const btnNo = document.createElement("button");
      btnNo.className = "border border-gray-600 text-gray-500 hover:bg-gray-800 px-4 py-2 font-bold flex-1";
      btnNo.textContent = "ABBRUCH";
      btnNo.onclick = () => {
        UI.leaveDialog();
      };
      row.appendChild(btnTrash);
      row.appendChild(btnNo);
      btnContainer.appendChild(row);
      box.appendChild(btnContainer);
      overlay.appendChild(box);
    },
    showEquippedDialog: function(slot) {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      this._trapEscKey();
      if (Game.state) Game.state.inDialog = true;
      const item = Game.state.equip[slot];
      const name = item.props ? item.props.name : item.name;
      const box = document.createElement("div");
      box.className = "bg-black border-2 border-yellow-500 p-4 shadow-[0_0_15px_#aa0] max-w-sm text-center mb-4 w-full pointer-events-auto";
      box.onclick = (e) => e.stopPropagation();
      box.innerHTML = `
            <div class="text-xs text-yellow-600 font-bold tracking-widest mb-1">SLOT: ${slot.toUpperCase()}</div>
            <h2 class="text-xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2">${name}</h2>
            <div class="flex flex-col gap-2 w-full">
                <button id="btn-unequip" class="action-button w-full border-yellow-500 text-yellow-500 hover:bg-yellow-900 py-3 font-bold">
                    ABLEGEN (INS INVENTAR)
                </button>
                <button id="btn-cancel-eq" class="action-button border-gray-600 text-gray-500 hover:bg-gray-800 py-2 font-bold mt-2">
                    ABBRUCH
                </button>
            </div>
        `;
      overlay.appendChild(box);
      document.getElementById("btn-unequip").onclick = () => {
        Game.unequipItem(slot);
        setTimeout(() => UI.leaveDialog(), 50);
      };
      document.getElementById("btn-cancel-eq").onclick = () => {
        UI.leaveDialog();
      };
    },
    showQuestComplete: function(questDef) {
      let container = document.getElementById("hud-quest-overlay");
      if (!container) {
        const view = document.getElementById("game-screen");
        if (!view) return;
        container = document.createElement("div");
        container.id = "hud-quest-overlay";
        container.className = "fixed top-24 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[100] w-full max-w-sm";
        view.appendChild(container);
      }
      const msg = document.createElement("div");
      msg.className = "w-full bg-black/95 border-2 border-yellow-400 p-4 shadow-[0_0_30px_rgba(255,215,0,0.6)] mb-4 text-center transform transition-all duration-700 scale-0 opacity-0";
      let rewardItems = "";
      if (questDef.reward?.items) {
        rewardItems = questDef.reward.items.map((it) => `<div>📦 ${it.c || 1}x ${Game.items[it.id]?.name || it.id}</div>`).join("");
      }
      msg.innerHTML = `
            <div class="text-yellow-500 font-bold tracking-[0.2em] text-[10px] mb-1 animate-pulse">QUEST ERFÜLLT</div>
            <div class="text-2xl font-bold text-white mb-3 uppercase tracking-tighter shadow-black text-shadow-lg">${questDef.title}</div>
            <div class="flex flex-col gap-1 py-2 border-t border-yellow-900/50 bg-yellow-900/10 font-mono text-xs">
                ${questDef.reward?.xp ? `<div class="text-cyan-400">⚡ +${questDef.reward.xp} XP</div>` : ""}
                ${questDef.reward?.caps ? `<div class="text-yellow-400">💰 +${questDef.reward.caps} KK</div>` : ""}
                ${rewardItems}
            </div>
            <div class="absolute -inset-1 bg-yellow-400/5 animate-ping rounded-lg pointer-events-none"></div>
        `;
      container.appendChild(msg);
      requestAnimationFrame(() => {
        msg.classList.remove("scale-0", "opacity-0");
        msg.classList.add("scale-100", "opacity-100");
      });
      setTimeout(() => {
        msg.classList.add("translate-y-[-20px]", "opacity-0", "scale-90");
        setTimeout(() => msg.remove(), 700);
      }, 4500);
    },
    showMapLegend: function() {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      this._trapEscKey();
      const box = document.createElement("div");
      box.className = "bg-black border-4 border-green-500 p-6 shadow-[0_0_30px_green] max-w-sm w-full relative pointer-events-auto";
      box.onclick = (e) => e.stopPropagation();
      const item = (icon, text, color) => `
            <div class="flex items-center gap-4 mb-3 border-b border-green-900/30 pb-1 last:border-0">
                <span class="text-2xl w-10 text-center filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" style="color: ${color}">${icon}</span>
                <span class="text-green-300 font-mono text-sm tracking-wide uppercase">${text}</span>
            </div>`;
      box.innerHTML = `
            <h2 class="text-2xl font-bold text-green-500 mb-6 border-b-2 border-green-500 pb-2 tracking-widest text-center">KARTEN LEGENDE</h2>
            <div class="flex flex-col space-y-1">
                ${item("🟢", "DEINE POSITION", "#39ff14")}
                ${item("⚙️", "VAULT 101 (SICHER)", "#ffff00")}
                ${item("🏙️", "RUSTY SPRINGS (STADT)", "#00ffff")}
                ${item("👻", "GHOST TOWN (VERLASSEN)", "#cccccc")}
                ${item("🏰", "MILITÄRBASIS (LVL 10+)", "#ff5555")}
                ${item("☠️", "RAIDER FESTUNG (LVL 5+)", "#ffaa00")}
                ${item("📡", "FUNKTURM (THE PITT)", "#55ff55")}
            </div>
            <button class="action-button w-full mt-6 border-green-500 text-green-500 font-bold hover:bg-green-900" onclick="UI.leaveDialog()">SCHLIESSEN</button>
        `;
      overlay.appendChild(box);
    },
    showHighscoreBoard: async function() {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      if (Game.state) Game.state.inDialog = true;
      this._trapEscKey();
      overlay.innerHTML = `
            <div class="flex flex-col items-center justify-center p-6 border-2 border-green-500 bg-black shadow-[0_0_20px_green] pointer-events-auto" onclick="event.stopPropagation()">
                <div class="text-green-500 animate-pulse text-2xl mb-6">EMPFANGE DATEN...</div>
                <button class="action-button border-red-500 text-red-500 w-full" onclick="UI.leaveDialog()">ABBRECHEN</button>
            </div>`;
      try {
        const scores = await Network.getHighscores();
        if (!scores) throw new Error("Keine Daten empfangen.");
        scores.sort((a, b) => b.lvl - a.lvl || b.xp - a.xp);
        const box = document.createElement("div");
        box.className = "bg-black border-4 border-green-600 p-4 shadow-[0_0_30px_green] w-full max-w-2xl max-h-[90%] flex flex-col relative pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();
        const closeBtn = document.createElement("button");
        closeBtn.className = "absolute top-2 right-2 text-green-500 text-xl border border-green-500 px-3 hover:bg-green-900 font-bold z-50";
        closeBtn.textContent = "X";
        closeBtn.onclick = function() {
          UI.leaveDialog();
        };
        box.innerHTML = `
                <h2 class="text-3xl font-bold text-green-400 mb-4 text-center border-b-2 border-green-600 pb-2 tracking-widest shrink-0">VAULT LEGENDS</h2>
                <div class="flex justify-between mb-2 text-xs text-green-300 uppercase font-bold px-2 shrink-0">
                    <span class="w-8">#</span>
                    <span class="w-1/3 cursor-pointer hover:text-white" onclick="UI.renderHighscoreList(this.dataset.scores, 'name')">NAME</span>
                    <span class="w-16 text-right cursor-pointer hover:text-white" onclick="UI.renderHighscoreList(this.dataset.scores, 'lvl')">LVL</span>
                    <span class="w-16 text-right cursor-pointer hover:text-white" onclick="UI.renderHighscoreList(this.dataset.scores, 'kills')">KILLS</span>
                    <span class="w-24 text-right cursor-pointer hover:text-white" onclick="UI.renderHighscoreList(this.dataset.scores, 'xp')">EXP</span>
                </div>
                <div id="highscore-list" class="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 border-b border-green-900/50 mb-2"></div>
                <div class="text-[10px] text-center text-green-800 shrink-0">ESC / KLICK NEBEN FENSTER ZUM SCHLIESSEN</div>
            `;
        box.appendChild(closeBtn);
        const listContainer = box.querySelector("#highscore-list");
        if (listContainer) listContainer.dataset.rawScores = JSON.stringify(scores);
        this.renderHighscoreList = (sortBy) => {
          const container = document.getElementById("highscore-list");
          if (!container) return;
          let data = JSON.parse(container.dataset.rawScores);
          if (sortBy === "name") data.sort((a, b) => a.name.localeCompare(b.name));
          else if (sortBy === "lvl") data.sort((a, b) => b.lvl - a.lvl || b.xp - a.xp);
          else if (sortBy === "kills") data.sort((a, b) => b.kills - a.kills || b.lvl - a.lvl);
          else if (sortBy === "xp") data.sort((a, b) => b.xp - a.xp);
          container.innerHTML = "";
          data.forEach((entry, idx) => {
            const isDead = entry.status === "dead";
            const isTop3 = idx < 3;
            let rowClass = "flex justify-between items-center py-2 border-b border-green-900/30 text-lg ";
            if (isTop3) rowClass += "text-yellow-400 font-bold bg-yellow-900/10 ";
            else if (isDead) rowClass += "text-gray-500 italic ";
            else rowClass += "text-green-400 ";
            const icon = isDead ? "❌" : isTop3 ? "🏆" : "";
            const nameDisplay = `${icon} ${entry.name}`;
            const row = document.createElement("div");
            row.className = rowClass;
            row.innerHTML = `
                        <span class="w-8 opacity-50">${idx + 1}</span>
                        <span class="w-1/3 truncate">${nameDisplay}</span>
                        <span class="w-16 text-right">${entry.lvl}</span>
                        <span class="w-16 text-right">${entry.kills}</span>
                        <span class="w-24 text-right font-mono text-sm opacity-80">${entry.xp}</span>
                    `;
            container.appendChild(row);
          });
        };
        overlay.innerHTML = "";
        overlay.appendChild(box);
        this.renderHighscoreList("lvl");
      } catch (e) {
        let msg = e.message;
        if (msg && msg.toLowerCase().includes("permission_denied")) {
          msg = "ZUGRIFF VERWEIGERT: FIREBASE REGELN BLOCKIEREN 'leaderboard'.";
        }
        overlay.innerHTML = `
                <div class="border-2 border-red-500 bg-black p-6 text-center shadow-[0_0_20px_red] pointer-events-auto" onclick="event.stopPropagation()">
                    <div class="text-red-500 font-bold text-2xl mb-4 tracking-widest">NETZWERK FEHLER</div>
                    <div class="text-green-400 font-mono mb-6">${msg}</div>
                    <button class="action-button w-full border-red-500 text-red-500" onclick="UI.leaveDialog()">SCHLIESSEN</button>
                </div>
            `;
      }
    },
    showShopConfirm: function(itemKey) {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      this._trapEscKey();
      const item = Game.items[itemKey];
      if (!item) return;
      if (Game.state) Game.state.inDialog = true;
      let statsText = "";
      let typeLabel = item.type.toUpperCase();
      if (item.type === "consumable") {
        statsText = `Effekt: ${item.effect} (${item.val})`;
        typeLabel = "VERBRAUCHSGEGENSTAND";
      } else if (item.type === "weapon") {
        statsText = `Schaden: ${item.baseDmg}`;
        typeLabel = "WAFFE";
      } else if (item.type === "body") {
        const bonus = item.bonus ? Object.entries(item.bonus).map(([k, v]) => `+${v} ${k}`).join(", ") : "Keine";
        statsText = `Rüstung: ${bonus}`;
        typeLabel = "KLEIDUNG / RÜSTUNG";
      } else if (item.type === "junk" || item.type === "component") {
        statsText = "Material für Handwerk";
        typeLabel = "SCHROTT / MATERIAL";
      } else if (item.type === "tool" || item.type === "blueprint") {
        statsText = "Bauplan / Werkzeug";
        typeLabel = "AUSRÜSTUNG";
      }
      const canAfford = Game.state.caps >= item.cost;
      const costColor = canAfford ? "text-yellow-400" : "text-red-500";
      const box = document.createElement("div");
      box.className = "bg-black border-2 border-green-500 p-4 shadow-[0_0_15px_green] max-w-sm text-center mb-4 w-full pointer-events-auto";
      box.onclick = (e) => e.stopPropagation();
      box.innerHTML = `
            <div class="border-b border-green-500 pb-2 mb-2">
                <h2 class="text-xl font-bold text-green-400">${item.name}</h2>
                <div class="text-[10px] text-green-600 tracking-widest">${typeLabel}</div>
            </div>
            <div class="text-sm text-green-200 mb-4 bg-green-900/20 p-3 text-left">
                <div class="mb-1 text-xs italic text-green-400">${item.desc || "Standard Ausrüstung."}</div>
                <div class="w-full h-px bg-green-900/50 my-2"></div>
                <div class="font-bold text-yellow-200">${statsText}</div>
            </div>
            <div class="flex justify-between items-center bg-black border border-green-900 p-2 mb-4">
                <span class="text-xs text-gray-400">PREIS:</span>
                <span class="font-mono font-bold text-xl ${costColor}">${item.cost} KK</span>
            </div>
            <div class="flex flex-col gap-2 w-full">
                <button id="btn-buy" class="action-button border-green-500 text-green-500 hover:bg-green-900 py-3 font-bold" ${!canAfford ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ""}>
                    ${canAfford ? "KAUFEN" : "ZU TEUER"}
                </button>
                <button id="btn-cancel" class="action-button border-red-500 text-red-500 hover:bg-red-900 py-2 font-bold">
                    ABBRUCH
                </button>
            </div>
        `;
      overlay.appendChild(box);
      const btnBuy = document.getElementById("btn-buy");
      if (canAfford && btnBuy) {
        btnBuy.onclick = () => {
          Game.buyItem(itemKey);
          UI.leaveDialog();
        };
      }
      document.getElementById("btn-cancel").onclick = () => UI.leaveDialog();
    },
    showDungeonWarning: function(callback) {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      this._trapEscKey();
      if (Game.state) Game.state.inDialog = true;
      const box = document.createElement("div");
      box.className = "bg-black border-2 border-red-600 p-4 shadow-[0_0_20px_red] max-w-sm text-center animate-pulse mb-4 pointer-events-auto";
      box.onclick = (e) => e.stopPropagation();
      box.innerHTML = `
            <h2 class="text-3xl font-bold text-red-600 mb-2 tracking-widest">⚠️ WARNING ⚠️</h2>
            <p class="text-red-400 mb-4 font-bold">HOHE GEFAHR!<br>Sicher, dass du eintreten willst?</p>
        `;
      const btnContainer = document.createElement("div");
      btnContainer.className = "flex gap-2 justify-center w-full";
      const btnYes = document.createElement("button");
      btnYes.className = "border border-red-500 text-red-500 hover:bg-red-900 px-4 py-2 font-bold w-full";
      btnYes.textContent = "BETRETEN";
      btnYes.onclick = () => {
        UI.leaveDialog();
        if (callback) callback();
      };
      const btnNo = document.createElement("button");
      btnNo.className = "border border-green-500 text-green-500 hover:bg-green-900 px-4 py-2 font-bold w-full";
      btnNo.textContent = "FLUCHT";
      btnNo.onclick = () => {
        UI.leaveDialog();
      };
      btnContainer.appendChild(btnYes);
      btnContainer.appendChild(btnNo);
      box.appendChild(btnContainer);
      overlay.appendChild(box);
    },
    showWastelandGamble: function(callback) {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      if (Game.state) Game.state.inDialog = true;
      overlay.onclick = null;
      const box = document.createElement("div");
      box.className = "bg-black border-4 border-yellow-500 p-6 shadow-[0_0_40px_gold] max-w-sm text-center relative overflow-hidden pointer-events-auto";
      const bg = document.createElement("div");
      bg.className = "absolute inset-0 bg-yellow-900/20 z-0 pointer-events-none";
      box.appendChild(bg);
      box.innerHTML += `
            <h2 class="text-2xl font-bold text-yellow-400 mb-2 tracking-widest relative z-10">WASTELAND GAMBLE</h2>
            <p class="text-green-300 text-xs mb-4 relative z-10">Würfle um dein Schicksal!</p>
            
            <div id="dice-container" class="flex justify-center gap-4 mb-6 relative z-10">
                <div id="die-1" class="w-12 h-12 border-2 border-yellow-400 flex items-center justify-center text-3xl font-bold bg-black text-yellow-400 shadow-lg">?</div>
                <div id="die-2" class="w-12 h-12 border-2 border-yellow-400 flex items-center justify-center text-3xl font-bold bg-black text-yellow-400 shadow-lg">?</div>
                <div id="die-3" class="w-12 h-12 border-2 border-yellow-400 flex items-center justify-center text-3xl font-bold bg-black text-yellow-400 shadow-lg">?</div>
            </div>
            
            <button id="btn-roll" class="action-button w-full border-green-500 text-green-500 font-bold text-xl py-3 hover:bg-green-900 relative z-10">WÜRFELN!</button>
        `;
      overlay.appendChild(box);
      const btnRoll = document.getElementById("btn-roll");
      btnRoll.onclick = () => {
        btnRoll.disabled = true;
        btnRoll.textContent = "ROLLING...";
        let rolls = 0;
        const maxRolls = 20;
        const interval = setInterval(() => {
          const d1 = Math.floor(Math.random() * 6) + 1;
          const d2 = Math.floor(Math.random() * 6) + 1;
          const d3 = Math.floor(Math.random() * 6) + 1;
          document.getElementById("die-1").textContent = d1;
          document.getElementById("die-2").textContent = d2;
          document.getElementById("die-3").textContent = d3;
          rolls++;
          if (rolls >= maxRolls) {
            clearInterval(interval);
            const sum = parseInt(document.getElementById("die-1").textContent) + parseInt(document.getElementById("die-2").textContent) + parseInt(document.getElementById("die-3").textContent);
            btnRoll.textContent = `SUMME: ${sum}`;
            btnRoll.classList.add("animate-pulse");
            setTimeout(() => {
              UI.leaveDialog();
              callback(sum);
            }, 1500);
          }
        }, 50);
      };
    },
    showDungeonLocked: function(minutesLeft) {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      this._trapEscKey();
      if (Game.state) Game.state.inDialog = true;
      const box = document.createElement("div");
      box.className = "bg-black border-2 border-gray-600 p-4 shadow-[0_0_20px_gray] max-w-sm text-center mb-4 pointer-events-auto";
      box.onclick = (e) => e.stopPropagation();
      box.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-400 mb-2 tracking-widest">🔒 LOCKED</h2>
            <p class="text-gray-300 mb-4 font-bold">Dieses Gebiet ist versiegelt.<br>Versuche es in ${minutesLeft} Minuten wieder.</p>
        `;
      const btn = document.createElement("button");
      btn.className = "border border-gray-500 text-gray-500 hover:bg-gray-900 px-4 py-2 font-bold w-full";
      btn.textContent = "VERSTANDEN";
      btn.onclick = () => UI.leaveDialog();
      box.appendChild(btn);
      overlay.appendChild(box);
    },
    showDungeonVictory: function(caps, lvl) {
      const overlay = document.createElement("div");
      overlay.id = "victory-overlay";
      overlay.className = "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 animate-fadeIn pointer-events-auto";
      overlay.innerHTML = `
            <div class="bg-black border-4 border-yellow-400 p-6 shadow-[0_0_30px_gold] max-w-md text-center mb-4 relative" onclick="event.stopPropagation()">
                <div class="text-6xl mb-2">👑⚔️</div>
                <h2 class="text-4xl font-bold text-yellow-400 mb-2 tracking-widest text-shadow-gold">VICTORY!</h2>
                <p class="text-yellow-200 mb-4 font-bold text-lg">DUNGEON (LVL ${lvl}) GECLEARED!</p>
                <div class="text-2xl text-white font-bold border-t border-b border-yellow-500 py-2 mb-4 bg-yellow-900/30">+${caps} KRONKORKEN</div>
                <p class="text-xs text-yellow-600 mb-4">Komme in 10 Minuten wieder!</p>
                <button id="btn-victory-close" class="action-button w-full border-yellow-500 text-yellow-500 font-bold hover:bg-yellow-900">ZURÜCK ZUR KARTE</button>
            </div>
        `;
      document.body.appendChild(overlay);
      if (Game.state) Game.state.inDialog = true;
      const btn = document.getElementById("btn-victory-close");
      if (btn) {
        btn.onclick = () => {
          const el = document.getElementById("victory-overlay");
          if (el) el.remove();
          if (Game.state) Game.state.inDialog = false;
          UI.leaveDialog();
        };
        btn.focus();
      }
    },
    showPermadeathWarning: function() {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      if (Game.state) Game.state.inDialog = true;
      overlay.onclick = null;
      const box = document.createElement("div");
      box.className = "bg-black border-4 border-red-600 p-6 shadow-[0_0_50px_red] max-w-lg text-center animate-pulse pointer-events-auto";
      box.innerHTML = `
            <div class="text-6xl text-red-600 mb-4 font-bold">☠️</div>
            <h1 class="text-4xl font-bold text-red-600 mb-4 tracking-widest border-b-2 border-red-600 pb-2">PERMADEATH AKTIV</h1>
            <p class="text-red-400 font-mono text-lg mb-6 leading-relaxed">WARNUNG, BEWOHNER!<br>Das Ödland kennt keine Gnade.<br>Wenn deine HP auf 0 fallen, wird dieser Charakter<br><span class="font-bold text-white bg-red-900 px-1">DAUERHAFT GELÖSCHT</span>.</p>
            <button class="action-button w-full border-red-600 text-red-500 font-bold py-4 text-xl hover:bg-red-900" onclick="UI.leaveDialog()">ICH HABE VERSTANDEN</button>
        `;
      overlay.appendChild(box);
    },
    showGameOver: function() {
      if (this.els.gameOver) this.els.gameOver.classList.remove("hidden");
      if (typeof Network !== "undefined" && Game.state) Network.registerDeath(Game.state);
      this.toggleControls(false);
      if (Game && Game.state) {
        Game.state.hp = 0;
        Game.state.isGameOver = true;
        if (typeof Game.deleteSave === "function") {
          Game.deleteSave(UI.selectedSlot || 0);
        } else if (window.localStorage) {
          const slot = UI.selectedSlot !== void 0 ? UI.selectedSlot : 0;
          localStorage.removeItem("save_" + slot);
          localStorage.removeItem("slot_" + slot);
          localStorage.removeItem("wasteland_save_" + slot);
          localStorage.removeItem("vault_save_" + slot);
        }
        if (typeof UI.log === "function") {
          UI.log("☠️ PERMADEATH: Dein Spielstand wurde ausgelöscht.", "text-red-500 font-bold text-xl");
        }
      }
    },
    showManualOverlay: async function() {
      const overlay = document.getElementById("manual-overlay");
      const content = document.getElementById("manual-content");
      if (this.els.navMenu) {
        this.els.navMenu.classList.add("hidden");
        this.els.navMenu.style.display = "none";
      }
      if (overlay && content) {
        content.innerHTML = '<div class="text-center animate-pulse">Lade Handbuch...</div>';
        overlay.style.display = "flex";
        overlay.classList.remove("hidden");
        const verDisplay = document.getElementById("version-display");
        const ver = verDisplay ? verDisplay.textContent.trim() : Date.now();
        try {
          const res = await fetch(`docs/README.md?v=${ver}`);
          if (!res.ok) throw new Error("Manual not found");
          let text = await res.text();
          text = text.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-yellow-400 mb-2 border-b border-yellow-500">$1</h1>');
          text = text.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-green-400 mt-4 mb-2">$1</h2>');
          text = text.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-green-300 mt-2 mb-1">$1</h3>');
          text = text.replace(/\*\*(.*)\*\*/gim, "<b>$1</b>");
          text = text.replace(/\n/gim, "<br>");
          text += `<br><button class="action-button w-full mt-4 border-red-500 text-red-500" onclick="document.getElementById('manual-overlay').classList.add('hidden'); document.getElementById('manual-overlay').style.display='none';">SCHLIESSEN (ESC)</button>`;
          content.innerHTML = text;
        } catch (e) {
          content.innerHTML = `<div class="text-red-500">Fehler beim Laden: ${e.message}</div>`;
        }
      }
    },
    showChangelogOverlay: async function() {
      const overlay = document.getElementById("changelog-overlay");
      const content = document.getElementById("changelog-content");
      if (overlay && content) {
        content.textContent = "Lade Daten...";
        overlay.style.display = "flex";
        overlay.classList.remove("hidden");
        const verDisplay = document.getElementById("version-display");
        const ver = verDisplay ? verDisplay.textContent.trim() : Date.now();
        try {
          const res = await fetch(`docs/change.log?v=${ver}`);
          if (!res.ok) throw new Error("Logfile nicht gefunden");
          const text = await res.text();
          content.textContent = text;
        } catch (e) {
          content.textContent = `Fehler beim Laden: ${e.message}`;
        }
      }
    },
    enterVault: function() {
      if (Game.state) Game.state.inDialog = true;
      if (typeof UI !== "undefined" && UI.log) UI.log("Das schwere Vault-Tor knirscht...", "text-blue-400 font-bold");
      const animLayer = document.createElement("div");
      animLayer.id = "vault-anim-layer";
      animLayer.className = "fixed inset-0 z-[3000] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-1000 pointer-events-auto";
      animLayer.innerHTML = `
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2d3748_0%,_#000_100%)] opacity-80"></div>
            <div id="vault-door-container" class="relative flex items-center justify-center transition-transform duration-[2500ms] ease-in-out">
                <div id="vault-gear" class="relative w-64 h-64 md:w-96 md:h-96 bg-[#4a5568] rounded-full border-[12px] border-[#2d3748] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-transform duration-[2500ms] ease-in-out">
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(0deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(45deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(90deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(135deg);"></div>
                    <div class="absolute w-52 h-52 md:w-80 md:h-80 bg-[#1a202c] rounded-full z-10 border-4 border-[#111] flex items-center justify-center shadow-inner">
                        <span class="text-6xl md:text-8xl font-bold text-yellow-500 tracking-widest font-mono drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]">101</span>
                    </div>
                </div>
            </div>
            <div id="vault-flash" class="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 pointer-events-none z-50"></div>
        `;
      document.body.appendChild(animLayer);
      setTimeout(() => {
        const container = document.getElementById("vault-door-container");
        const gear = document.getElementById("vault-gear");
        const flash = document.getElementById("vault-flash");
        if (container) container.style.transform = "translateX(120vw)";
        if (gear) gear.style.transform = "rotate(270deg)";
        setTimeout(() => {
          if (flash) flash.style.opacity = "1";
          setTimeout(() => {
            this._showVaultMenuInternal();
            if (flash) flash.style.opacity = "0";
            animLayer.style.opacity = "0";
            setTimeout(() => {
              animLayer.remove();
            }, 1e3);
          }, 300);
        }, 2e3);
      }, 100);
    },
    _showVaultMenuInternal: function() {
      const overlay = this.restoreOverlay();
      overlay.style.display = "flex";
      overlay.innerHTML = "";
      if (Game.state) Game.state.inDialog = true;
      const box = document.createElement("div");
      box.className = "flex flex-col gap-3 w-full max-w-sm p-6 bg-black border-4 border-blue-600 shadow-[0_0_30px_blue] pointer-events-auto animate-float-in";
      box.onclick = (e) => e.stopPropagation();
      const msg = document.createElement("div");
      msg.innerHTML = `
            <h2 class='text-blue-400 font-bold mb-2 text-3xl tracking-widest border-b-2 border-blue-900 pb-2 text-center'>VAULT 101</h2>
            <p class='text-sm text-blue-200 mb-4 text-center'>Willkommen zuhause, Bewohner.<br>Hier bist du sicher vor dem Ödland.</p>
        `;
      const restBtn = document.createElement("button");
      restBtn.className = "action-button w-full border-blue-500 text-blue-400 hover:bg-blue-900 py-4 font-bold text-xl";
      restBtn.innerHTML = "🛏️ AUSRUHEN (GRATIS)";
      restBtn.onclick = () => {
        if (Game.state) {
          Game.state.hp = Game.state.maxHp || 20;
          if (Game.state.rad !== void 0) Game.state.rad = 0;
          if (Game.state.rads !== void 0) Game.state.rads = 0;
          if (typeof Game.saveGame === "function") Game.saveGame();
          if (typeof UI.update === "function") UI.update();
        }
        this.showInfoDialog("DEKONTAMINIERT & AUSGERUHT", "Du hast sicher in der Vault geschlafen. Deine TP sind vollständig regeneriert und die Dekontaminationsduschen haben jegliche Verstrahlung abgewaschen!");
      };
      const leaveBtn = document.createElement("button");
      leaveBtn.className = "action-button w-full border-gray-600 text-gray-400 hover:bg-gray-800 py-2 mt-2";
      leaveBtn.innerHTML = "🚪 ZURÜCK INS ÖDLAND";
      leaveBtn.onclick = () => UI.leaveDialog();
      box.appendChild(msg);
      box.appendChild(restBtn);
      box.appendChild(leaveBtn);
      overlay.appendChild(box);
    },
    enterCityCinematic: function(onComplete) {
      if (Game.state) Game.state.inDialog = true;
      if (typeof UI !== "undefined" && UI.log) UI.log("Die rostigen Tore öffnen sich...", "text-yellow-400 font-bold");
      const animLayer = document.createElement("div");
      animLayer.id = "city-anim-layer";
      animLayer.className = "fixed inset-0 z-[3000] bg-black overflow-hidden transition-opacity duration-1000 pointer-events-auto flex items-center justify-center";
      animLayer.innerHTML = `
            <div id="rs-door-left" class="absolute top-0 bottom-0 left-0 w-1/2 bg-[repeating-linear-gradient(90deg,#3e2723,#3e2723_10px,#2d1a11_10px,#2d1a11_20px)] border-r-[12px] border-[#1a110b] transition-transform duration-[2500ms] ease-in-out flex items-center justify-end overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.8)] z-10">
                <div class="absolute w-full h-12 bg-[repeating-linear-gradient(45deg,#000,#000_20px,#eab308_20px,#eab308_40px)] opacity-60 top-1/4"></div>
                <div class="absolute w-full h-12 bg-[repeating-linear-gradient(-45deg,#000,#000_20px,#eab308_20px,#eab308_40px)] opacity-60 bottom-1/4"></div>
            </div>
            <div id="rs-door-right" class="absolute top-0 bottom-0 right-0 w-1/2 bg-[repeating-linear-gradient(90deg,#3e2723,#3e2723_10px,#2d1a11_10px,#2d1a11_20px)] border-l-[12px] border-[#1a110b] transition-transform duration-[2500ms] ease-in-out flex items-center justify-start overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-10">
                <div class="absolute w-full h-12 bg-[repeating-linear-gradient(45deg,#000,#000_20px,#eab308_20px,#eab308_40px)] opacity-60 top-1/4"></div>
                <div class="absolute w-full h-12 bg-[repeating-linear-gradient(-45deg,#000,#000_20px,#eab308_20px,#eab308_40px)] opacity-60 bottom-1/4"></div>
            </div>
            <div id="rs-sign" class="absolute z-20 flex flex-col items-center transition-opacity duration-700">
                <div class="bg-[#1a110b] border-8 border-[#3e2723] p-6 shadow-[0_0_40px_rgba(0,0,0,0.9)] rounded-lg relative overflow-hidden">
                    <div class="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.2)_2px,rgba(0,0,0,0.2)_4px)] pointer-events-none"></div>
                    <h1 class="text-4xl md:text-6xl font-bold text-orange-500 tracking-[0.2em] font-mono drop-shadow-[0_0_15px_rgba(255,165,0,0.9)] animate-pulse">RUSTY SPRINGS</h1>
                    <div class="text-cyan-400 text-center tracking-[0.6em] text-xs md:text-sm mt-3 animate-pulse drop-shadow-[0_0_10px_rgba(0,255,255,0.9)]">EST. 2077 // TRADE HUB</div>
                </div>
            </div>
            <div id="rs-flash" class="absolute inset-0 bg-yellow-600 opacity-0 transition-opacity duration-500 pointer-events-none z-30 mix-blend-overlay"></div>
        `;
      document.body.appendChild(animLayer);
      setTimeout(() => {
        const doorL = document.getElementById("rs-door-left");
        const doorR = document.getElementById("rs-door-right");
        const sign = document.getElementById("rs-sign");
        const flash = document.getElementById("rs-flash");
        if (sign) sign.style.opacity = "0";
        setTimeout(() => {
          if (doorL) doorL.style.transform = "translateX(-100%)";
          if (doorR) doorR.style.transform = "translateX(100%)";
          setTimeout(() => {
            if (flash) flash.style.opacity = "0.8";
            setTimeout(() => {
              if (onComplete) onComplete();
              if (flash) flash.style.opacity = "0";
              animLayer.style.opacity = "0";
              if (Game.state) Game.state.inDialog = false;
              setTimeout(() => {
                animLayer.remove();
              }, 1e3);
            }, 400);
          }, 1800);
        }, 500);
      }, 100);
    },
    // ==========================================
    // NEU: GHOST TOWN PSYCHO HORROR EFFEKTE
    // ==========================================
    _ghostTownActive: false,
    _ghostTimeout: null,
    startGhostTownEffects: function() {
      if (this._ghostTownActive) return;
      this._ghostTownActive = true;
      if (typeof UI.log === "function") {
        UI.log("Ein unnatürlicher Schauer läuft dir über den Rücken...", "text-purple-500 italic font-bold");
      }
      this.scheduleNextGhostEffect();
    },
    stopGhostTownEffects: function() {
      if (!this._ghostTownActive) return;
      this._ghostTownActive = false;
      if (this._ghostTimeout) {
        clearTimeout(this._ghostTimeout);
        this._ghostTimeout = null;
      }
      document.body.style.filter = "none";
    },
    scheduleNextGhostEffect: function() {
      if (!this._ghostTownActive) return;
      const delay = 2e3 + Math.random() * 6e3;
      this._ghostTimeout = setTimeout(() => {
        this.triggerGhostEffect();
        this.scheduleNextGhostEffect();
      }, delay);
    },
    triggerGhostEffect: function() {
      if (!this._ghostTownActive || Game.state.inDialog) return;
      const r = Math.random();
      if (r < 0.33) {
        document.body.style.filter = "invert(100%) hue-rotate(90deg) grayscale(50%)";
        setTimeout(() => {
          document.body.style.filter = "none";
        }, 100 + Math.random() * 150);
      } else if (r < 0.66) {
        const flash = document.createElement("div");
        flash.className = "fixed inset-0 z-[9000] pointer-events-none flex flex-col items-center justify-center bg-[#1a0000] overflow-hidden";
        flash.innerHTML = `
                <div class="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.1)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] mix-blend-overlay"></div>
                <div class="text-red-600 font-mono text-5xl md:text-7xl font-bold tracking-[1em] animate-pulse opacity-90 text-shadow-md">TARGET: ???</div>
                <div class="mt-10 w-full max-w-md border-2 border-red-900 p-4 bg-red-950/50">
                    <div class="text-red-500 font-mono text-4xl flex justify-between"><span>SOUL</span><span>0%</span></div>
                </div>
            `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 100 + Math.random() * 100);
      } else {
        const msgs = ["SIEH HINTER DICH...", "LAUF WEG!", "WIR SIND HIER...", "DEIN ENDE NAHT", "KEIN ENTRINNEN", "NICHT UMNDREHEN"];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        const txt = document.createElement("div");
        const top = 20 + Math.random() * 60;
        const left = 20 + Math.random() * 60;
        txt.className = `fixed z-[8000] text-red-600 font-mono font-bold text-3xl md:text-5xl pointer-events-none opacity-0 drop-shadow-[0_0_10px_red]`;
        txt.style.top = `${top}%`;
        txt.style.left = `${left}%`;
        txt.style.transform = "translate(-50%, -50%)";
        txt.innerText = msg;
        document.body.appendChild(txt);
        requestAnimationFrame(() => {
          txt.style.transition = "opacity 0.1s";
          txt.style.opacity = "0.8";
        });
        setTimeout(() => {
          txt.style.opacity = "0";
          setTimeout(() => txt.remove(), 200);
        }, 500 + Math.random() * 500);
      }
    }
  });
})();
