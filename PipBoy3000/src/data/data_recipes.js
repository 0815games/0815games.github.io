// [2026-01-17 19:05:00] data_recipes.js - Added Modular Backpack Recipes

if(typeof window.GameData === 'undefined') window.GameData = {};

window.GameData.recipes = [
    // --- BASIC SURVIVAL ---
    { id: 'craft_ammo', type: 'ammo', out: 'AMMO', count: 10, req: { 'junk_metal': 2 }, lvl: 1 },
    { id: 'craft_stimpack_simple', type: 'med', out: 'stimpack', count: 1, req: { 'meat_roach': 2, 'junk_metal': 1 }, lvl: 1 },
    { id: 'craft_stimpack', type: 'med', out: 'stimpack', count: 1, req: { 'meat_fly': 1, 'junk_metal': 1, 'adhesive': 1 }, lvl: 2 },
    
    // --- BACKPACK MODDING (TIER SYSTEM) ---
    // Tier 0: Frame (Basis)
    { 
        id: 'craft_bp_frame', type: 'gear', out: 'backpack_frame', count: 1, 
        req: { 'junk_metal': 5, 'screws': 2 }, 
        lvl: 1 
    },
    // Tier 1: Leder (Erfordert Frame)
    { 
        id: 'craft_bp_leather', type: 'gear', out: 'backpack_leather', count: 1, 
        req: { 'backpack_frame': 1, 'leather': 4, 'cloth': 4, 'duct_tape': 2 }, 
        lvl: 2 
    },
    // Tier 2: Metall (Erfordert Leder)
    { 
        id: 'craft_bp_metal', type: 'gear', out: 'backpack_metal', count: 1, 
        req: { 'backpack_leather': 1, 'junk_metal': 8, 'screws': 4, 'gears': 2 }, 
        lvl: 3 
    },
    // Tier 3a: Militär (Erfordert Metall + Rare)
    { 
        id: 'craft_bp_military', type: 'gear', out: 'backpack_military', count: 1, 
        req: { 'backpack_metal': 1, 'adhesive': 5, 'circuit': 1, 'cloth': 10 }, 
        lvl: 5 
    },
    // Tier 3b: Lastesel (Erfordert Metall + Viel Material)
    { 
        id: 'craft_bp_cargo', type: 'gear', out: 'backpack_cargo', count: 1, 
        req: { 'backpack_metal': 1, 'leather': 10, 'springs': 4, 'junk_metal': 20 }, 
        lvl: 5 
    },

    // --- CAMPING ---
    { id: 'rcp_camp', type: 'tool', out: 'camp_kit', count: 1, req: { 'cloth': 2, 'junk_metal': 2 }, lvl: 1 },

    // --- WEAPONS ---
    { id: 'craft_machete', type: 'weapon', out: 'machete', count: 1, req: { 'junk_metal': 10, 'leather': 2, 'adhesive': 2 }, lvl: 2 },
    { id: 'craft_pipe_pistol', type: 'weapon', out: 'pipe_pistol', count: 1, req: { 'junk_metal': 6, 'screws': 2, 'gears': 1 }, lvl: 1 },
    
    // --- COOKING ---
    { id: 'cook_roach', type: 'cooking', out: 'cooked_roach', count: 1, req: { 'meat_roach': 1 }, lvl: 1 },
    { id: 'cook_fly', type: 'cooking', out: 'cooked_fly', count: 1, req: { 'meat_fly': 1 }, lvl: 1 },
    { id: 'cook_mole', type: 'cooking', out: 'cooked_mole', count: 1, req: { 'meat_mole': 1 }, lvl: 1 },
    { id: 'cook_lurk', type: 'cooking', out: 'cooked_lurk', count: 1, req: { 'meat_lurk': 1 }, lvl: 2 },
    { id: 'cook_scorp', type: 'cooking', out: 'cooked_scorp', count: 1, req: { 'meat_scorp': 1 }, lvl: 3 }
];

if(typeof Game !== 'undefined') Game.recipes = window.GameData.recipes;
