// [2026-01-17 19:00:00] data_items.js - New Modular Backpack System

if(typeof window.GameData === 'undefined') window.GameData = {};
if(typeof window.GameData.items === 'undefined') window.GameData.items = {}; 

Object.assign(window.GameData.items, {
    // --- BLUEPRINTS ---
    bp_ammo: { name: "Bauplan: Munition", type: "blueprint", recipeId: "craft_ammo", cost: 50, desc: "Lerne Munition herzustellen." },
    bp_stimpack: { name: "Bauplan: Stimpack", type: "blueprint", recipeId: "craft_stimpack", cost: 100, desc: "Medizinische Grundlagen." },
    
    // --- RUCKSÄCKE (MODULAR SYSTEM) ---
    // Tier 0: Das Gestell (Startpunkt)
    backpack_frame: { 
        name: "Rucksack-Gestell", 
        type: "back", slot: "back", cost: 20, 
        bonus: { slots: 2 }, 
        desc: "Ein nackter Aluminiumrahmen. Besser als nichts. (+2 Slots)" 
    },

    // Tier 1: Leder (Standard)
    backpack_leather: { 
        name: "Leder-Rucksack", 
        type: "back", slot: "back", cost: 100, 
        bonus: { slots: 6 }, 
        desc: "Solide Taschen am Gestell. (+6 Slots)" 
    },

    // Tier 2: Metall / Verstärkt (Heavy)
    backpack_metal: { 
        name: "Verstärkter Rucksack", 
        type: "back", slot: "back", cost: 250, 
        bonus: { slots: 10, AGI: -1 }, 
        desc: "Mit Metallplatten verstärkt. Schwer. (+10 Slots, -1 AGI)" 
    },

    // Tier 3a: Militär (Tactical - High End)
    backpack_military: { 
        name: "Taktischer Rucksack", 
        type: "back", slot: "back", cost: 600, 
        bonus: { slots: 14, END: 1 }, 
        desc: "Militärstandard. Ergonomisch & Robust. (+14 Slots, +1 END)" 
    },

    // Tier 3b: Lastesel (Cargo - High Capacity)
    backpack_cargo: { 
        name: "Brahmin-Kiepe", 
        type: "back", slot: "back", cost: 550, 
        bonus: { slots: 22, AGI: -2 }, 
        desc: "Ein gigantischer Aufbau. Du bist ein Packesel. (+22 Slots, -2 AGI)" 
    },

    // --- CAMP & TOOLS ---
    camp_kit: { name: "Zelt-Bausatz", type: "tool", cost: 150, desc: "Errichtet ein Lager im Ödland.", weight: 5 },
    lockpick: { name: "Haarklammer", type: "tool", cost: 5, desc: "Zum Knacken von Schlössern." },

    // --- MONSTER DROPS & FOOD ---
    meat_roach: { name: "Kakerlakenfleisch", type: "component", cost: 5, desc: "Ekelhaft, aber essbar." },
    meat_fly: { name: "Fliegenfleisch", type: "component", cost: 5, desc: "Schleimig." },
    meat_mole: { name: "Rattenfleisch", type: "component", cost: 8, desc: "Zäh." },
    meat_dog: { name: "Hundefleisch", type: "component", cost: 10, desc: "Etwas zäh, aber nahrhaft." }, 
    meat_scorp: { name: "Skorpiondrüse", type: "component", cost: 20, desc: "Delikatesse." },
    meat_yao: { name: "Yao Guai Rippchen", type: "component", cost: 35, desc: "Sehr nahrhaft." },
    hide_yao: { name: "Yao Guai Leder", type: "component", cost: 40, desc: "Robustes Fell." },
    meat_lurk: { name: "Mirelurk-Fleisch", type: "component", cost: 15, desc: "Weiches Schalentier-Fleisch." },
    
    // Cooked
    cooked_roach: { name: "Gegrillte Kakerlake", type: "consumable", effect: "heal_rad", val: 15, rad: 2, cost: 10, desc: "+15 HP, +2 RAD" },
    cooked_mole: { name: "Ratten-Steak", type: "consumable", effect: "heal_rad", val: 25, rad: 3, cost: 20, desc: "+25 HP, +3 RAD" },
    cooked_fly: { name: "Gegrillte Fliege", type: "consumable", effect: "heal_rad", val: 15, rad: 2, cost: 10, desc: "+15 HP, +2 RAD" },
    cooked_scorp: { name: "Skorpion-Überraschung", type: "consumable", effect: "heal_rad", val: 45, rad: 5, cost: 40, desc: "+45 HP, +5 RAD" },
    cooked_lurk: { name: "Mirelurk-Happen", type: "consumable", effect: "heal_rad", val: 35, rad: 4, cost: 30, desc: "+35 HP, +4 RAD" },

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
    ripper: { name: "Ripper", type: "weapon", slot: "weapon", baseDmg: 18, cost: 350, desc: "Kettensägen-Messer.", usesAmmo: false },
    deathclaw_gauntlet: { name: "Todeskralle", type: "weapon", slot: "weapon", baseDmg: 50, cost: 1000, desc: "Die Klaue einer Bestie.", usesAmmo: false },

    // ==============================
    // === FERNKAMPF (Guns/Ammo) ===
    // ==============================
    ammo: { name: "Munition", type: "ammo", cost: 2, desc: "Patronen.", weight: 0.05 },

    // Pipe Weapons (Schrott)
    pipe_pistol: { name: "Rohrpistole", type: "weapon", slot: "weapon", baseDmg: 5, cost: 15, desc: "Selbstgebaut.", usesAmmo: true },
    pipe_rifle: { name: "Rohrgewehr", type: "weapon", slot: "weapon", baseDmg: 7, cost: 30, desc: "Längerer Lauf.", usesAmmo: true },
    pipe_revolver: { name: "Rohrrevolver", type: "weapon", slot: "weapon", baseDmg: 9, cost: 45, desc: "Kaliber .45.", usesAmmo: true },
    pipe_sniper: { name: "Rohr-Sniper", type: "weapon", slot: "weapon", baseDmg: 12, cost: 60, desc: "Mit Zielfernrohr.", usesAmmo: true },

    // Conventional
    pistol_10mm: { name: "10mm Pistole", type: "weapon", slot: "weapon", baseDmg: 12, cost: 120, desc: "Verlässlich.", usesAmmo: true },
    revolver_44: { name: ".44 Revolver", type: "weapon", slot: "weapon", baseDmg: 25, cost: 250, desc: "Dirty Harry Style.", usesAmmo: true },
    smg: { name: "Maschinenpistole", type: "weapon", slot: "weapon", baseDmg: 10, cost: 300, desc: "Schnellfeuer.", usesAmmo: true },
    hunting_rifle: { name: "Jagdgewehr", type: "weapon", slot: "weapon", baseDmg: 20, cost: 200, desc: "Präzise.", usesAmmo: true },
    sniper_rifle: { name: "Scharfschützengewehr", type: "weapon", slot: "weapon", baseDmg: 35, cost: 700, desc: "Tödlich auf Distanz.", usesAmmo: true },
    shotgun: { name: "Doppelflinte", type: "weapon", slot: "weapon", baseDmg: 30, cost: 350, desc: "Zwei Läufe.", usesAmmo: true },
    combat_shotgun: { name: "Kampfflinte", type: "weapon", slot: "weapon", baseDmg: 38, cost: 600, desc: "Magazin-geladen.", usesAmmo: true },
    assault_rifle: { name: "Sturmgewehr", type: "weapon", slot: "weapon", baseDmg: 28, cost: 550, desc: "Militärstandard.", usesAmmo: true },
    minigun: { name: "Minigun", type: "weapon", slot: "weapon", baseDmg: 15, cost: 1500, desc: "Extremes Schnellfeuer (Mehrfach-Treffer).", usesAmmo: true },

    // Energy
    laser_pistol: { name: "Laserpistole", type: "weapon", slot: "weapon", baseDmg: 22, cost: 400, desc: "Vorsicht, heiß.", usesAmmo: true },
    laser_rifle: { name: "Lasergewehr", type: "weapon", slot: "weapon", baseDmg: 32, cost: 650, desc: "Lange Reichweite.", usesAmmo: true },
    plasma_pistol: { name: "Plasmapistole", type: "weapon", slot: "weapon", baseDmg: 35, cost: 600, desc: "Grüner Schleim.", usesAmmo: true },
    plasma_rifle: { name: "Plasmagewehr", type: "weapon", slot: "weapon", baseDmg: 45, cost: 900, desc: "Schmilzt Rüstung.", usesAmmo: true },
    alien_blaster: { name: "Alien Blaster", type: "weapon", slot: "weapon", baseDmg: 80, cost: 3000, desc: "Extraterrestrisch.", usesAmmo: false },

    // ======================================
    // === RÜSTUNGEN (Nach Sets sortiert) ===
    // ======================================

    raider_armor: { name: "Raider-Rüstung", type: "body", slot: "body", cost: 80, bonus: {END: 1, STR: 1}, desc: "Stachelig." },
    raider_helm: { name: "Sackgassen-Helm", type: "head", slot: "head", cost: 40, bonus: {PER: -1, END: 1}, desc: "Furchteinflößend." },
    raider_arm_l: { name: "Raider-Armschiene (L)", type: "arms", slot: "arms", cost: 30, bonus: {STR: 1}, desc: "Aus Reifen." },
    raider_leg_r: { name: "Raider-Beinschutz", type: "legs", slot: "legs", cost: 35, bonus: {END: 1}, desc: "Rostiges Blech." },

    leather_armor: { name: "Lederrüstung", type: "body", slot: "body", cost: 150, bonus: {END: 2, AGI: 2}, desc: "Leicht und leise." },
    leather_helm: { name: "Lederkappe", type: "head", slot: "head", cost: 60, bonus: {PER: 1}, desc: "Fliegerbrille inklusive." },
    bracers_leather: { name: "Lederarmschienen", type: "arms", slot: "arms", cost: 80, bonus: {STR: 1}, desc: "Klassisch." },
    pants_leather: { name: "Lederhose", type: "legs", slot: "legs", cost: 100, bonus: {AGI: 1}, desc: "Eng anliegend." },
    boots_leather: { name: "Lederstiefel", type: "feet", slot: "feet", cost: 70, bonus: {AGI: 1}, desc: "Guter Halt." },

    metal_armor: { name: "Metallrüstung", type: "body", slot: "body", cost: 300, bonus: {END: 5, AGI: -2}, desc: "Hält Kugeln ab." },
    helmet_metal: { name: "Metallhelm", type: "head", slot: "head", cost: 150, bonus: {END: 2, PER: -1}, desc: "Eingeschränkte Sicht." },
    metal_arms: { name: "Metallarme", type: "arms", slot: "arms", cost: 120, bonus: {STR: 1, END: 1}, desc: "Schwer." },
    greaves_metal: { name: "Metallbeinschienen", type: "legs", slot: "legs", cost: 140, bonus: {END: 2, AGI: -1}, desc: "Klappert laut." },

    combat_armor: { name: "Kampfrüstung", type: "body", slot: "body", cost: 600, bonus: {END: 6, STR: 1}, desc: "Polymer-Verbund." },
    helmet_combat: { name: "Kampfhelm", type: "head", slot: "head", cost: 300, bonus: {END: 2, PER: 1}, desc: "Taktisch." },
    combat_arms: { name: "Kampfarmschienen", type: "arms", slot: "arms", cost: 250, bonus: {STR: 2}, desc: "Verstärkt." },
    combat_legs: { name: "Kampfbeinschützer", type: "legs", slot: "legs", cost: 280, bonus: {END: 2, AGI: 1}, desc: "Beweglich." },
    boots_combat: { name: "Kampfstiefel", type: "feet", slot: "feet", cost: 150, bonus: {AGI: 1, END: 1}, desc: "Militärstandard." },

    synth_armor: { name: "Synth-Rüstung", type: "body", slot: "body", cost: 800, bonus: {END: 5, INT: 2}, desc: "Institut-Technologie." },
    synth_helmet: { name: "Synth-Feldhelm", type: "head", slot: "head", cost: 400, bonus: {PER: 2, INT: 1}, desc: "Volle Abdeckung." },

    vault_suit: { name: "Vault-Anzug", type: "body", slot: "body", cost: 0, bonus: {END: 1, INT: 1}, desc: "Blau und eng." },
    power_armor: { name: "Power Rüstung T-45", type: "body", slot: "body", cost: 2500, bonus: {END: 12, STR: 4, RAD: 100, AGI: -3}, desc: "Ein Panzer zum Anziehen." },
    hazmat_suit: { name: "Strahlenschutzanzug", type: "body", slot: "body", cost: 400, bonus: {RAD: 1000, END: -2}, desc: "Perfekt für das Leuchtende Meer." },
    
    cap_baseball: { name: "Baseballkappe", type: "head", slot: "head", cost: 20, bonus: {PER: 1}, desc: "Schützt vor Sonne." },
    helmet_mining: { name: "Minenhelm", type: "head", slot: "head", cost: 50, bonus: {END: 1}, desc: "Mit Lampe." },
    gas_mask: { name: "Gasmaske", type: "head", slot: "head", cost: 120, bonus: {RAD: 20}, desc: "Filtert die Luft." },
    
    jeans: { name: "Jeans", type: "legs", slot: "legs", cost: 30, bonus: {AGI: 1}, desc: "Bequemer Denim." },
    boots_worn: { name: "Alte Stiefel", type: "feet", slot: "feet", cost: 20, bonus: {}, desc: "Besser als barfuß." }
});

if(typeof Game !== 'undefined') Game.items = window.GameData.items;
