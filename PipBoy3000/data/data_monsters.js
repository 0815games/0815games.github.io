// [2026-01-17 20:00:00] data_monsters.js - Balanced Low Level Loot (Screws for Backpack)

if(typeof window.GameData === 'undefined') window.GameData = {};

window.GameData.monsters = {
    // Lvl 1 - Farmbar für das Rucksack-Gestell
    radRoach: { 
        name: "Rad-Kakerlake", 
        hp: 15, dmg: 3, xp: [10,20], loot: 2, minLvl: 1,
        drops: [ 
            {id:'junk_metal', c: 0.6}, // Häufiger Schrott
            {id:'screws', c: 0.3},     // NEU: Schrauben (30% Chance)
            {id:'meat_roach', c: 0.4} 
        ]
    },
    moleRat: { 
        name: "Maulwurfsratte", 
        hp: 25, dmg: 5, xp: [15,30], loot: 5, minLvl: 1,
        drops: [ 
            {id:'meat_mole', c: 0.5}, 
            {id:'leather', c: 0.3},    // Leder für das nächste Upgrade
            {id:'junk_metal', c: 0.4},
            {id:'screws', c: 0.2}      // NEU: Schrauben (20% Chance)
        ]
    },
    
    // Lvl 2+
    wildDog: { 
        name: "Wilder Hund", 
        hp: 35, dmg: 8, xp: [25,40], loot: 0, minLvl: 2,
        drops: [ 
            {id:'meat_dog', c: 0.6}, 
            {id:'leather', c: 0.5},
            {id:'bone', c: 0.4} // Knochen (falls wir das Item haben/hinzufügen)
        ]
    },
    
    // Humanoid - Droppt Waffen zum Zerlegen (Hauptquelle für Schrauben im Mid-Game)
    raider: { 
        name: "Raider", 
        hp: 60, dmg: 12, xp: [50,80], loot: 15, minLvl: 2,
        drops: [
            {id:'ammo', c: 0.6}, 
            {id:'stimpack', c: 0.2}, 
            {id:'knife', c: 0.2},
            {id:'pipe_pistol', c: 0.3}, // Waffe -> Zerlegen -> Schrauben
            {id:'junk_metal', c: 0.5},
            {id:'cloth', c: 0.3}
        ]
    },

    // Mid/High Level
    bloatfly: {
        name: "Blähfliege", hp: 20, dmg: 15, xp: [20,35], loot: 0, minLvl: 2,
        drops: [ {id:'meat_fly', c: 0.6}, {id:'acid', c: 0.3} ]
    },
    ghoul: {
        name: "Wilder Ghul", hp: 80, dmg: 18, xp: [60,90], loot: 5, minLvl: 3,
        drops: [ {id:'radaway', c: 0.15}, {id:'junk_metal', c: 0.4}, {id:'cloth', c: 0.5} ]
    },
    radScorpion: {
        name: "Rad-Skorpion", hp: 120, dmg: 25, xp: [100,150], loot: 0, minLvl: 4,
        drops: [ {id:'meat_scorp', c: 0.8}, {id:'poison_gland', c: 0.5} ]
    },
    superMutant: {
        name: "Supermutant", hp: 200, dmg: 30, xp: [150,250], loot: 30, minLvl: 5,
        drops: [ {id:'pipe_rifle', c: 0.4}, {id:'ammo', c: 0.8}, {id:'gunpowder', c: 0.5}, {id:'caps', c: 1.0} ]
    },
    deathclaw: {
        name: "Todeskralle", hp: 500, dmg: 80, xp: [500,800], loot: 50, minLvl: 10,
        drops: [ {id:'deathclaw_hand', c: 1.0}, {id:'leather', c: 1.0}, {id:'titanium', c: 0.5} ]
    }
};

if(typeof Game !== 'undefined') Game.monsters = window.GameData.monsters;
