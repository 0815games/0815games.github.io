// [2026-01-28 12:00:00] data_core.js - Wiki Automation & Quest Fixes

window.GameData = window.GameData || {};

// --- PERKS ---
window.GameData.perks = [
    { id: 'toughness', name: 'Zähigkeit', desc: '+10 Max HP pro Stufe.', icon: '🛡️', max: 5 },
    { id: 'medic', name: 'Sanitäter', desc: '+20% Heilung durch Stimpacks pro Stufe.', icon: '💉', max: 5 },
    { id: 'rad_resistant', name: 'Rad-Resistenz', desc: '-10% Strahlungsaufnahme pro Stufe.', icon: '☢️', max: 5 },
    { id: 'strong_back', name: 'Starker Rücken', desc: '+2 Inventar-Slots pro Stufe.', icon: '🎒', max: 5 },
    { id: 'fortune_finder', name: 'Schatzsucher', desc: '+10% mehr Kronkorken finden pro Stufe.', icon: '💰', max: 5 },
    { id: 'scrapper', name: 'Wiederverwerter', desc: 'Höhere Chance auf seltene Teile beim Zerlegen.', icon: '⚙️', max: 3 },
    { id: 'swift_learner', name: 'Heller Kopf', desc: '+5% Erfahrungspunkte (XP) pro Stufe.', icon: '🧠', max: 5 },
    { id: 'mysterious_stranger', name: 'Mysteriöser Fremder', desc: '+2% Krit-Chance im V.A.T.S. pro Stufe.', icon: '🕵️', max: 5 },
    { id: 'gunslinger', name: 'Revolverheld', desc: '+10% Schaden mit Schusswaffen pro Stufe.', icon: '🔫', max: 5 },
    { id: 'slugger', name: 'Schläger', desc: '+10% Schaden im Nahkampf pro Stufe.', icon: '🏏', max: 5 }
];

// --- QUESTS ---
window.GameData.questDefs = [
    // AKT 1
    { 
        id: "q_start", title: "Überleben 101", desc: "Das Ödland ist unerbittlich. Zeig den Kakerlaken, wer der Boss ist.", 
        type: "kill", target: "radRoach", amount: 3, minLvl: 1, reward: { xp: 50, caps: 25 } 
    },
    { 
        id: "q_backpack", title: "Der Packesel", desc: "Sammle Material und crafte ein Rucksack-Gestell an der Werkbank.", 
        type: "collect", target: "backpack_frame", amount: 1, preReq: "q_start", minLvl: 1, reward: { xp: 100, items: [{id:'leather', c:4}] }
    },
    { 
        id: "q_explore", title: "Licht am Horizont", desc: "Gerüchten zufolge gibt es eine Siedlung namens 'Rusty Springs' bei [3,3].", 
        type: "visit", target: "3,3", amount: 1, preReq: "q_backpack", minLvl: 1, reward: { xp: 150, caps: 50, items: [{id:'stimpack', c:2}] } 
    },
    // AKT 2
    {
        id: "q_radio_silence", title: "Funkstille", desc: "Repariere den Funkmast in Rusty Springs. Du brauchst Schrott und Schrauben.",
        type: "collect_multi", reqItems: { junk_metal: 5, screws: 3 }, preReq: "q_explore", minLvl: 3, reward: { xp: 250, caps: 100, items: [{id:'radio_part', c:1}] }
    },
    {
        id: "q_ghost_machine", title: "Geist in der Maschine", desc: "Der Funkmast empfängt Signale von Maulwurfsratten. Untersuche das.",
        type: "kill", target: "moleRat", amount: 8, preReq: "q_radio_silence", minLvl: 4, reward: { xp: 400, caps: 150, items: [{id:'fusion_core', c:1}] }
    },
    // NEBENQUESTS
    { 
        id: "q_hunter_bloat", title: "Kammerjäger", desc: "Blähfliegen sind eine Plage. Töte 5 Stück.", 
        type: "kill", target: "bloatfly", amount: 5, minLvl: 2, reward: { xp: 150, caps: 75 } 
    },
    { 
        id: "q_collector_rare", title: "Seltene Funde", desc: "Ein Sammler sucht 3x Klemmbretter für seine Sammlung.", 
        type: "collect", target: "clipboard", amount: 3, minLvl: 2, reward: { xp: 120, caps: 200 } 
    }
];

// --- LOCATIONS (NEU FÜR WIKI) ---
window.GameData.locations = [
    { name: "Vault 101", coord: "[START]", desc: "Dein Startpunkt. Ein sicherer Bunker unter der Erde. Bietet Schutz und kostenlose Heilung." },
    { name: "Rusty Springs", coord: "[3,3]", desc: "Die größte bekannte Siedlung. Hier findest du Händler, einen Arzt und Werkbänke." },
    { name: "Oasis", coord: "[NW]", desc: "Ein seltsam fruchtbares Gebiet im Nordwesten (Sektoren 0-2). Dichter Wald, aber gefährliche Flora." },
    { name: "The Pitt", coord: "[SO]", desc: "Eine trostlose Wüste im Südosten (Sektoren 7-9). Hohe Strahlung und gefährliche Raider-Banden." },
    { name: "Sumpf", coord: "[NO]", desc: "Nebeliges Feuchtgebiet im Nordosten. Heimat der Mirelurks." },
    { name: "Gebirge", coord: "[SW]", desc: "Felsiges Terrain im Südwesten. Schwer passierbar." }
];

// --- ITEMS ---
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
    clipboard: { name: "Klemmbrett", type: "junk", cost: 10, icon: "📋", desc: "Alte Bürokratie." } // HIER: Das Item für die Quest
});

// --- MONSTERS ---
window.GameData.monsters = Object.assign(window.GameData.monsters || {}, {
    radRoach: { 
        name: "Rad-Kakerlake", hp: 15, dmg: 3, xp: [10,20], loot: 2, minLvl: 1,
        drops: [ {id:'junk_metal', c: 0.5}, {id:'rad_meat', c: 0.4} ]
    },
    bloatfly: { 
        name: "Blähfliege", hp: 20, dmg: 4, xp: [15,25], loot: 3, minLvl: 2,
        drops: [ {id:'plastic', c: 0.3} ]
    },
    moleRat: { 
        name: "Maulwurfsratte", hp: 30, dmg: 6, xp: [20,35], loot: 5, minLvl: 1,
        drops: [ {id:'rad_meat', c: 0.5}, {id:'leather', c: 0.4} ]
    },
    raider: { 
        name: "Raider", hp: 65, dmg: 14, xp: [60,90], loot: 15, minLvl: 3,
        // HIER: Raider droppen jetzt Klemmbretter (clipboard) zu 30%
        drops: [ {id:'ammo', c: 0.6}, {id:'stimpack', c: 0.2}, {id:'junk_metal', c: 0.5}, {id:'clipboard', c: 0.3} ]
    }
});

// --- VISUALS & BIOMES ---
window.GameData.colors = { 
    '.':'#2d241b', '_':'#4a4036', ',':'#1a261a', ';':'#1e1e11', '=':'#333333', 
    '#':'#555', 
    'line_default': '#2a5a2a', 'line_wall': '#39ff14', 
    'V': '#39ff14', 'C': '#eab308', 'S': '#ff0000', 'G': '#00ffff', 'H': '#888888', 
    '^': '#111', 'v':'#111', '<':'#111', '>':'#111',
    'M': '#3e2723', 'W': '#0d47a1', '~': '#2f4f2f', 
    't': '#1b5e20', 'T': '#0a3d0a', 'x': '#8b4513', 'o': '#808080',
    '+': '#666666', '"': '#3cb371', 'Y': '#deb887', 'U': '#212121',
    'A': '#cc0000', 'K': '#00bfff',
    '$': '#ffd700', '&': '#ff8c00', 'P': '#ff3333', 'E': '#39ff14', 'F': '#00bfff', '|': '#777',
    'X': '#ff00ff', 
    'wasteland': '#5d5345', 'desert': '#eecfa1', 'jungle': '#1a3300', 'city': '#555555', 'swamp': '#1e1e11'
};

window.GameData.statLabels = { 'STR': 'STÄRKE', 'PER': 'WAHRNEHMUNG', 'END': 'AUSDAUER', 'INT': 'INTELLIGENZ', 'AGI': 'BEWEGLICHKEIT', 'LUC': 'GLÜCK' };

window.GameData.biomes = {
    'wasteland': { 
        ground: '.', water: 0.02, mountain: 0.03,
        features: [ { char: 'o', prob: 0.02, solid: true }, { char: 'x', prob: 0.03, solid: false }, { char: 't', prob: 0.01, solid: true } ]
    },
    'jungle': { 
        ground: ',', water: 0.08, mountain: 0.05,
        features: [ { char: 'T', prob: 0.08, solid: true }, { char: 't', prob: 0.15, solid: true }, { char: '"', prob: 0.15, solid: false } ]
    },
    'desert': { 
        ground: '_', water: 0.01, mountain: 0.10,
        features: [ { char: 'o', prob: 0.02, solid: true }, { char: 'Y', prob: 0.02, solid: true } ]
    },
    'city': { 
        ground: '=', water: 0.0, mountain: 0.0,
        features: [ { char: '#', prob: 0.10, solid: true }, { char: '+', prob: 0.08, solid: false }, { char: 'o', prob: 0.02, solid: true } ]
    },
    'swamp': { 
        ground: ';', water: 0.05, mountain: 0.0,
        features: [ { char: '~', prob: 0.10, solid: false }, { char: 'x', prob: 0.10, solid: false }, { char: 't', prob: 0.05, solid: true } ]
    }
};

window.GameData.hackWords = {
    easy: ["PASS", "CODE", "HACK", "DATA", "BIOS", "BOOT", "DISK", "FILE", "LOAD", "SAVE", "EXIT", "USER", "LOCK", "KEYS", "WIFI", "NODE"],
    medium: ["SERVER", "ACCESS", "SYSTEM", "ROUTER", "MEMORY", "CONFIG", "STATUS", "REBOOT", "UPDATE", "KERNEL", "SCRIPT", "SEARCH", "SIGNAL", "TARGET", "MATRIX", "BYPASS"],
    hard: ["FIREWALL", "PROTOCOL", "PASSWORD", "DATABASE", "SECURITY", "DOWNLOAD", "TERMINAL", "MAINFRAME", "OVERRIDE", "HARDWARE", "SOFTWARE", "ENCRYPTION", "NETWORK", "BACKDOOR"]
};

console.log("GameData Core & Locations loaded.");
