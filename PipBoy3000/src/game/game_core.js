// [2026-02-17 12:30:00] game_core.js - Safe Definition Fix

// WICHTIG: Wir definieren Game hier neu, falls es noch nicht existiert.
window.Game = {
    // Globale Konstanten (Auf 50 erhöht für die neuen Flüsse)
    TILE: 30, 
    MAP_W: 50, 
    MAP_H: 50,
    WORLD_W: 10, 
    WORLD_H: 10, 
    
    // Daten-Container (Fallback falls Data-Files fehlen)
    colors: (typeof window.GameData !== 'undefined') ? window.GameData.colors : {},
    items: (typeof window.GameData !== 'undefined') ? window.GameData.items : {},
    monsters: (typeof window.GameData !== 'undefined') ? window.GameData.monsters : {},
    recipes: (typeof window.GameData !== 'undefined') ? window.GameData.recipes : [],
    perkDefs: (typeof window.GameData !== 'undefined') ? window.GameData.perks : [],
    questDefs: (typeof window.GameData !== 'undefined') ? window.GameData.questDefs : [],

    lootPrefixes: {
        'rusty': { name: 'Rostige', dmgMult: 0.8, valMult: 0.5, color: 'text-gray-500' },
        'hardened': { name: 'Gehärtete', dmgMult: 1.2, valMult: 1.3, color: 'text-gray-300' },
        'precise': { name: 'Präzise', dmgMult: 1.1, valMult: 1.5, bonus: {PER: 1}, color: 'text-blue-300' },
        'radiated': { name: 'Verstrahlte', dmgMult: 1.0, valMult: 1.2, effect: 'rads', color: 'text-green-300' },
        'legendary': { name: 'Legendäre', dmgMult: 1.5, valMult: 3.0, bonus: {LUC: 2}, color: 'text-yellow-400 font-bold' }
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
        this.cacheCanvas = document.createElement('canvas'); 
        this.cacheCanvas.width = this.MAP_W * this.TILE; 
        this.cacheCanvas.height = this.MAP_H * this.TILE; 
        this.cacheCtx = this.cacheCanvas.getContext('2d'); 
    }, 
    
    initCanvas: function() { 
        const cvs = document.getElementById('game-canvas'); 
        if(!cvs) return; 
        const viewContainer = document.getElementById('view-container'); 
        
        const dpr = window.devicePixelRatio || 1;
        const rect = viewContainer.getBoundingClientRect();

        cvs.width = rect.width * dpr; 
        cvs.height = rect.height * dpr; 

        cvs.style.width = `${rect.width}px`;
        cvs.style.height = `${rect.height}px`;

        this.ctx = cvs.getContext('2d'); 
        this.ctx.scale(dpr, dpr);
        this.ctx.imageSmoothingEnabled = false; 
        
        if(this.loopId) cancelAnimationFrame(this.loopId); 
        this.drawLoop(); 
    },

    drawText: function(ctx, text, x, y, size, color, align="center", shadow=false) {
        if(!ctx) return;
        ctx.save();
        ctx.translate(x, y);
        const scale = 0.25; 
        ctx.scale(scale, scale); 
        ctx.font = "bold " + (size / scale) + "px monospace";
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = "middle"; 
        ctx.imageSmoothingEnabled = true; 
        if(shadow) {
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4 / scale;
        }
        ctx.fillText(text, 0, 0);
        ctx.restore();
    },

    drawLoop: function() { 
        if(this.state && this.state.view === 'map' && !this.state.isGameOver) {
            this.draw(); 
            this.loopId = requestAnimationFrame(() => this.drawLoop());
        }
    },

    saveGame: function(force = false) {
        this.isDirty = true;
        if (force) { this.performSave(); return; }
        if (this.saveTimer) return;
        this.saveTimer = setTimeout(() => { this.performSave(); }, 2000);
    },

    performSave: function() {
        if(this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
        if(!this.isDirty || !this.state) return;

        if(this.state.isGameOver || this.state.saveSlot === -1) {
            return;
        }

        if(typeof Network !== 'undefined') { 
            Network.save(this.state); 
            if(!this.state.isGameOver) Network.updateHighscore(this.state); 
        }
        try { localStorage.setItem('pipboy_save', JSON.stringify(this.state)); } catch(e){}
        this.isDirty = false;
    },

    // Wird von Combat.playerAttack (Vampir-Waffen) aufgerufen. Fehlte bisher,
    // wodurch der Effekt still wirkungslos blieb (docs/ANALYSE.md, B8).
    getMaxHp: function() { return (this.state && this.state.maxHp) || 100; },

    // Wird beim Permadeath aufgerufen (ui_render_overlays.js). Fehlte bisher;
    // der dortige Ersatzweg löschte Schlüssel, die das Spiel nie geschrieben hat.
    deleteSave: function(slot) {
        const index = (slot === undefined || slot === null) ? (this.state ? this.state.saveSlot : 0) : slot;
        if (typeof Network !== 'undefined' && typeof Network.deleteSlot === 'function') {
            Network.deleteSlot(index).catch(() => {});
        }
        try { localStorage.removeItem('pipboy_save'); } catch (e) {}
        this.isDirty = false;
        this.state = null;
    },

    hardReset: function() { if(typeof Network !== 'undefined') Network.deleteSave(); this.state = null; location.reload(); },

    getPerkLevel: function(perkId) {
        if (!this.state || !this.state.perks) return 0;
        return this.state.perks[perkId] || 0;
    },

    recalcStats: function() {
        if(!this.state) return;
        let end = this.getStat('END');
        let baseHp = 50 + (end * 10) + (this.state.lvl * 5);
        const toughnessLvl = this.getPerkLevel('toughness');
        baseHp += (toughnessLvl * 10);
        this.state.maxHp = baseHp;
        if(this.state.hp > this.state.maxHp) this.state.hp = this.state.maxHp;
        let luc = this.getStat('LUC');
        let strangerLvl = this.getPerkLevel('mysterious_stranger');
        this.state.critChance = (luc * 1) + (strangerLvl * 2);
        if(typeof UI !== 'undefined' && UI.update) UI.update();
    },

    // Pfad zum Item-Bild oder null. Die Bilder liegen neben der Seite in
    // img/items/ - relativer Pfad, damit GitHub Pages (/PipBoy3000/) und
    // Vercel denselben Code benutzen koennen.
    itemBildPfad: function(id) {
        if(!id) return null;
        const liste = (window.GameData && window.GameData.itemBilder) || [];
        if(!liste.includes(id)) return null;
        return `img/items/${id}.png`;
    },

    getUsedSlots: function() { if(!this.state || !this.state.inventory) return 0; return this.state.inventory.length; },
    getStackLimit: function(itemId) { if(itemId==='caps')return 99999; if(this.items[itemId] && this.items[itemId].type==='ammo')return 100; const i=this.items[itemId]; if(!i)return 1; if(i.type==='component'||i.type==='rare'||i.type==='consumable'||i.type==='junk')return 20; if(i.type==='ammo')return 100; return 1; },
    // Zaehlt alle Munitionsarten zusammen. Vorher nur 'ammo' - mit sechs
    // Sorten waere der HUD-Zaehler sonst still falsch (docs/BEFUNDE.md, 4).
    syncAmmo: function() {
        if(!this.state) return;
        const t = this.state.inventory.reduce((sum, i) => (i && this.items[i.id] && this.items[i.id].type === 'ammo') ? sum + i.count : sum, 0);
        this.state.ammo = t;
        if(typeof UI !== 'undefined' && UI.update) UI.update();
    },
    // Summiert einen Bonus-Schlüssel aus der angelegten Ausrüstung.
    // getStat() taugt dafür nicht: es liefert für jeden Schlüssel, der nicht
    // in state.stats steht, eine Basis von 5 (die SPECIAL-Vorgabe). Für
    // RAD oder RAD_RESIST hieße das, jeder trüge schon Schutz.
    equipBonus: function(key) {
        if (!this.state || !this.state.equip) return 0;
        let summe = 0;
        ['weapon', 'body', 'head', 'legs', 'feet', 'arms', 'back'].forEach(slot => {
            const teil = this.state.equip[slot];
            if (!teil) return;

            // Manche Spielstände führen im Slot nur `{id}`. Dann zählt der
            // Katalogwert - sonst hätte ein alter Spielstand seine Rüstung
            // behalten, aber keinen Schutz.
            const katalog = (teil.id && this.items[teil.id]) ? this.items[teil.id] : null;
            const quelle = (teil.bonus || !katalog) ? teil : katalog;

            if (quelle.bonus && typeof quelle.bonus[key] === 'number') summe += quelle.bonus[key];
            if (teil.props && teil.props.bonus && typeof teil.props.bonus[key] === 'number') {
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
        ['body', 'head', 'legs', 'feet', 'arms'].forEach(slot => {
            const teil = this.state.equip[slot];
            if (!teil) return;
            if (typeof teil.def === 'number') summe += teil.def;
            // Schutz aus dem Katalog nachziehen, falls das angelegte Objekt
            // nur eine ID ist (alte Spielstände).
            else if (teil.id && this.items[teil.id] && typeof this.items[teil.id].def === 'number') {
                summe += this.items[teil.id].def;
            }
        });
        return summe;
    },

    getStat: function(key) {
        if(!this.state)return 5;
        let v = this.state.stats[key] || 5;
        ['weapon','body','head','legs','feet','arms','back'].forEach(s => {
            const i = this.state.equip[s];
            if (!i) return;
            if (i.bonus && i.bonus[key]) v += i.bonus[key];
            if (i.props && i.props.bonus && i.props.bonus[key]) v += i.props.bonus[key];
        });
        // Laufende Buffs (Buffout, Jet, Stealth Boy). Vorher gab es sie nicht
        // (docs/BALANCE_BEFUNDE.md, B3).
        if (typeof this.buffBonus === 'function') v += this.buffBonus(key);
        return v;
    },
    expToNextLevel: function(l) { return Math.floor(100 * Math.pow(l, 1.5)); },
    
    gainExp: function(amount) {
        const perkLvl = this.getPerkLevel('swift_learner');
        let finalAmount = amount;
        if (perkLvl > 0) {
            const multi = 1 + (perkLvl * 0.05); 
            finalAmount = Math.floor(amount * multi);
        }
        this.state.xp += finalAmount;
        if(perkLvl > 0 && finalAmount > amount) {
            UI.log(`+${finalAmount} XP (Bonus!)`, "text-yellow-400");
        } else {
            UI.log(`+${finalAmount} XP`, "text-yellow-400");
        }

        let next = this.expToNextLevel(this.state.lvl);
        if(this.state.xp >= next) {
            this.state.lvl++;
            this.state.xp -= next;
            this.state.statPoints++;
            if(this.state.lvl % 3 === 0) {
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
        if(!this.questDefs || !this.state) return;
        this.questDefs.forEach(def => {
            const lvlMet = this.state.lvl >= def.minLvl;
            const preReqMet = !def.preReq || this.state.completedQuests.includes(def.preReq);
            if(lvlMet && preReqMet) {
                const active = this.state.activeQuests.find(q => q.id === def.id);
                const completed = this.state.completedQuests.includes(def.id);
                if(!active && !completed) {
                    const newQuest = { id: def.id, progress: 0, max: def.amount || 0, type: def.type, target: def.target || null };
                    if(def.type === 'collect_multi' && def.reqItems) {
                        newQuest.max = Object.values(def.reqItems).reduce((a, b) => a + b, 0);
                        let currentTotal = 0;
                        for(let id in def.reqItems) {
                            const inInv = this.state.inventory.filter(i => i.id === id).reduce((s, i) => s + i.count, 0);
                            currentTotal += Math.min(inInv, def.reqItems[id]);
                        }
                        newQuest.progress = currentTotal;
                    }
                    this.state.activeQuests.push(newQuest);
                    UI.log(`QUEST: "${def.title}" erhalten!`, "text-cyan-400 font-bold animate-pulse");
                    if(this.state.activeQuests.length === 1 && !this.state.trackedQuestId) {
                        this.state.trackedQuestId = newQuest.id;
                        if(typeof UI !== 'undefined' && UI.updateQuestTracker) UI.updateQuestTracker();
                    }
                    if(newQuest.progress >= newQuest.max && newQuest.max > 0) {
                        const idx = this.state.activeQuests.findIndex(q => q.id === def.id);
                        if(idx !== -1) this.completeQuest(idx);
                    }
                }
            }
        });
    },

    updateQuestProgress: function(type, target, value=1) {
        if(!this.state || !this.state.activeQuests) return;
        let updated = false;
        for(let i = this.state.activeQuests.length - 1; i >= 0; i--) {
            const q = this.state.activeQuests[i];
            const def = this.questDefs.find(d => d.id === q.id);
            if(!def) continue;
            let match = false;
            if(q.type === type && q.target === target) match = true;
            if(q.type === 'collect_multi' && type === 'collect' && def.reqItems && def.reqItems[target]) {
                let currentTotal = 0;
                for(let itemId in def.reqItems) {
                    const countInInv = this.state.inventory.filter(item => item.id === itemId).reduce((sum, item) => sum + item.count, 0);
                    currentTotal += Math.min(countInInv, def.reqItems[itemId]);
                }
                q.progress = currentTotal; updated = true;
            }
            if(match) { q.progress += value; updated = true; }
            if(q.progress >= q.max) this.completeQuest(i);
        }
        this.checkNewQuests();
        if(updated && typeof UI !== 'undefined') { UI.update(); if(UI.updateQuestTracker) UI.updateQuestTracker(); }
    },

    completeQuest: function(index) {
        const q = this.state.activeQuests[index]; const def = this.questDefs.find(d => d.id === q.id);
        if(def) {
            if(def.reward) {
                if(def.reward.xp) this.gainExp(def.reward.xp);
                if(def.reward.caps) this.state.caps += def.reward.caps;
                if(def.reward.items) def.reward.items.forEach(item => { if(typeof Game.addItem === 'function') Game.addItem(item.id, item.c || 1); });
            }
            this.state.completedQuests.push(q.id);
            if(typeof UI !== 'undefined' && UI.showQuestComplete) UI.showQuestComplete(def);
        }
        if(this.state.trackedQuestId === q.id) this.state.trackedQuestId = null;
        this.state.activeQuests.splice(index, 1);
        if(!this.state.trackedQuestId && this.state.activeQuests.length > 0) this.state.trackedQuestId = this.state.activeQuests[0].id;
        this.saveGame(true); this.checkNewQuests(); if(typeof UI !== 'undefined' && UI.updateQuestTracker) UI.updateQuestTracker();
    },
    
    checkShopRestock: function() {
        const now = Date.now(); if(!this.state.shop) this.state.shop = { nextRestock: 0, stock: {}, merchantCaps: 1000 };
        if(now >= this.state.shop.nextRestock) {
            const stock = {}; stock['stimpack'] = 2+Math.floor(Math.random()*4); stock['radaway']=1+Math.floor(Math.random()*3); stock['nuka_cola']=3+Math.floor(Math.random()*5);
            // Munitionslager je Sorte. Die Menge haengt am Preis: teure Energie-
            // zellen liegen seltener im Regal als Schrott-Munition.
            this.state.shop.ammoStock = 30 + (Math.floor(Math.random() * 9) * 10);
            this.state.shop.ammoStockByType = {
                ammo: 30 + (Math.floor(Math.random() * 9) * 10),
                ammo_10mm: 20 + (Math.floor(Math.random() * 8) * 10),
                ammo_308: 10 + (Math.floor(Math.random() * 5) * 10),
                ammo_shell: 10 + (Math.floor(Math.random() * 4) * 10),
                ammo_micro: 20 + (Math.floor(Math.random() * 8) * 10),
                ammo_cell: 10 + (Math.floor(Math.random() * 3) * 10)
            };
            stock['camp_kit'] = 1;
            this.state.shop.merchantCaps = 500 + Math.floor(Math.random() * 1000);
            this.state.shop.stock = stock; this.state.shop.nextRestock = now + 3600000;
            if(typeof UI !== 'undefined') UI.log("Händler hat neue Ware.", "text-green-500");
        }
    },

    // Würfelt beim Fund einer Waffe ein Präfix aus. Die Prozente stehen als
    // Tabelle da und nicht als Kette von else-if, damit sie sich prüfen lassen.
    // Diese Funktion hatte bis eben keinen einzigen Aufrufer: Waffen fielen
    // immer ohne Präfix (docs/BEFUNDE.md, 9).
    lootChances: [
        { key: 'legendary', bis: 0.020 },
        { key: 'radiated',  bis: 0.050 },
        { key: 'hardened',  bis: 0.150 },
        { key: 'precise',   bis: 0.300 },
        { key: 'rusty',     bis: 0.600 }
    ],

    rollLootPrefix: function() {
        const roll = Math.random();
        const treffer = this.lootChances.find(c => roll < c.bis);
        return treffer ? treffer.key : null;
    },

    generateLoot: function(baseId) {
        const itemDef = this.items[baseId];
        if(!itemDef || itemDef.type !== 'weapon') return { id: baseId, count: 1 };

        const prefixKey = this.rollLootPrefix();
        if(!prefixKey) return { id: baseId, count: 1 };

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

    init: function(saveData, spawnTarget=null, slotIndex=0, newName=null) {
        this.worldData = {}; this.initCache();
        window.addEventListener('beforeunload', () => { if(this.isDirty) this.saveGame(true); });
        if(this.items && Object.keys(this.items).length === 0) this.items.ammo = { name: "Munition", type: "ammo", cost: 2, icon: "bullet" };

        try {
            let isNewGame = false;
            const defaultPOIs = [ {type: 'V', x: 4, y: 4}, {type: 'C', x: 3, y: 3} ];

            if (saveData) {
                this.state = saveData;
                // FIX: Seed Sicherheit für alte Spielstände
                if (!this.state.worldSeed) { this.state.worldSeed = Date.now(); }
                if (typeof WorldGen !== 'undefined') WorldGen.setSeed(this.state.worldSeed);
                
                if(!this.state.explored) this.state.explored = {};
                if(!this.state.view) this.state.view = 'map';
                if(typeof this.state.rads === 'undefined') this.state.rads = 0;
                if(!this.state.activeQuests) this.state.activeQuests = [];
                if(!this.state.completedQuests) this.state.completedQuests = [];
                if(!this.state.quests) this.state.quests = [];
                if(!this.state.knownRecipes) this.state.knownRecipes = [];
                ['craft_ammo', 'craft_stimpack_simple', 'rcp_camp', 'craft_bp_frame', 'craft_bp_leather', 'craft_bp_metal', 'craft_bp_military', 'craft_bp_cargo'].forEach(r=>{if(!this.state.knownRecipes.includes(r))this.state.knownRecipes.push(r)});
                if(!this.state.perks) this.state.perks = {}; 
                if(!this.state.shop) this.state.shop = { nextRestock: 0, stock: {}, merchantCaps: 1000 };
                if(!this.state.equip) this.state.equip = { weapon: null, body: null };
                
                this.state.saveSlot = slotIndex;
                this.checkNewQuests();
                this.syncAmmo(); this.recalcStats();
                if(typeof UI !== 'undefined') UI.log(">> Spielstand geladen.", "text-cyan-400");
            } else {
                isNewGame = true;
                const seed = Date.now();
                if(typeof WorldGen !== 'undefined') WorldGen.setSeed(seed);
                let startSector = {x: 4, y: 4};
                if(typeof WorldGen !== 'undefined' && WorldGen.getStartSector) startSector = WorldGen.getStartSector();

                const startWeapon = this.items['fists'] ? { ...this.items['fists'] } : { id: 'fists', name: 'Fäuste', baseDmg: 2, type: 'weapon' };
                const startBody = this.items['vault_suit'] ? { ...this.items['vault_suit'] } : { id: 'vault_suit', name: 'Vault-Anzug', def: 1, type: 'body' };

                this.state = {
                    saveSlot: slotIndex, worldSeed: seed, playerName: newName || "SURVIVOR",
                    sector: startSector, startSector: startSector, worldPOIs: defaultPOIs,
                    player: {x: 25, y: 25, rot: 0},
                    stats: { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 }, 
                    equip: { weapon: startWeapon, body: startBody }, 
                    inventory: [], hp: 100, maxHp: 100, xp: 0, lvl: 1, caps: 50, ammo: 0, statPoints: 0, perkPoints: 0, perks: {}, 
                    camp: null, rads: 0, kills: 0, view: 'map', zone: 'Ödland', inDialog: false, isGameOver: false, 
                    explored: {}, visitedSectors: [`${startSector.x},${startSector.y}`],
                    activeQuests: [], completedQuests: [], knownRecipes: ['craft_ammo', 'craft_stimpack_simple', 'rcp_camp', 'craft_bp_frame', 'craft_bp_leather', 'craft_bp_metal', 'craft_bp_military', 'craft_bp_cargo'], 
                    hiddenItems: {}, shop: { nextRestock: 0, stock: {}, merchantCaps: 1000 }, startTime: Date.now()
                };
                this.state.inventory.push({id: 'stimpack', count: 1, isNew: true});
                this.state.inventory.push({id: 'ammo', count: 10, isNew: true});
                this.syncAmmo(); this.recalcStats(); this.state.hp = this.state.maxHp;
                this.checkNewQuests(); 
                if(typeof UI !== 'undefined') UI.log(">> Neuer Charakter erstellt.", "text-green-400");
                this.saveGame(true); 
            }

            if (isNewGame) { if(typeof this.loadSector === 'function') this.loadSector(this.state.sector.x, this.state.sector.y); } 
            else { 
                if(typeof this.loadSector === 'function') this.loadSector(this.state.sector.x, this.state.sector.y); 
            }
            if(typeof UI !== 'undefined') {
                UI.switchView('map').then(() => { 
                    if(UI.els.gameOver) UI.els.gameOver.classList.add('hidden'); 
                    if(isNewGame) setTimeout(() => UI.showPermadeathWarning(), 500);
                });
            }
        } catch(e) { console.error(e); }
    }
};
