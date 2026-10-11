// [v0.4.12]
const Game = {
    TILE: 30, MAP_W: 40, MAP_H: 40,
    WORLD_W: 10, WORLD_H: 10, // Definiert die Weltgröße
    
    colors: (typeof window.GameData !== 'undefined') ? window.GameData.colors : {},
    items: (typeof window.GameData !== 'undefined') ? window.GameData.items : {},
    monsters: (typeof window.GameData !== 'undefined') ? window.GameData.monsters : {},
    recipes: (typeof window.GameData !== 'undefined') ? window.GameData.recipes : [],

    state: null, worldData: {}, ctx: null, loopId: null, camera: { x: 0, y: 0 }, cacheCanvas: null, cacheCtx: null,

    // --- INITIALIZATION & RENDERING ---
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
        cvs.width = viewContainer.clientWidth; 
        cvs.height = viewContainer.clientHeight; 
        this.ctx = cvs.getContext('2d'); 
        this.ctx.imageSmoothingEnabled = false;
        if(this.loopId) cancelAnimationFrame(this.loopId); 
        this.drawLoop(); 
    },

    drawLoop: function() { 
        if(this.state && this.state.view === 'map' && !this.state.isGameOver) {
            this.draw(); 
            this.loopId = requestAnimationFrame(() => this.drawLoop());
        }
    },

    renderStaticMap: function() { 
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx; 
        ctx.fillStyle = "#000"; 
        ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height); 
        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                if(this.state.currentMap && this.state.currentMap[y]) {
                    this.drawTile(ctx, x, y, this.state.currentMap[y][x]); 
                }
            }
        }
    },

    // --- GAME START ---
    init: function(saveData, spawnTarget=null, slotIndex=0, newName=null) {
        this.worldData = {};
        this.initCache();
        try {
            let isNewGame = false;
            if (saveData) {
                this.state = saveData;
                // Kompatibilitäts-Checks
                if(!this.state.explored || typeof this.state.explored !== 'object') this.state.explored = {};
                if(!this.state.inDialog) this.state.inDialog = false; 
                if(!this.state.view) this.state.view = 'map';
                if(!this.state.visitedSectors) this.state.visitedSectors = [];
                if(!this.state.tutorialsShown) this.state.tutorialsShown = { hacking: false, lockpicking: false };

                if(!this.state.worldPOIs) {
                    this.state.worldPOIs = [
                        {type: 'V', x: 4, y: 4}, 
                        {type: 'C', x: 3, y: 3} 
                    ];
                }
                this.state.saveSlot = slotIndex;
                UI.log(">> Spielstand geladen.", "text-cyan-400");
            } else {
                isNewGame = true;
                
                const vX = Math.floor(Math.random() * this.WORLD_W);
                const vY = Math.floor(Math.random() * this.WORLD_H);
                let cX, cY;
                do {
                    cX = Math.floor(Math.random() * this.WORLD_W);
                    cY = Math.floor(Math.random() * this.WORLD_H);
                } while(cX === vX && cY === vY);

                const worldPOIs = [
                    {type: 'V', x: vX, y: vY},
                    {type: 'C', x: cX, y: cY}
                ];

                let startSecX = vX;
                let startSecY = vY;
                let startX = 20;
                let startY = 20;

                if (spawnTarget && spawnTarget.sector) {
                    startSecX = spawnTarget.sector.x;
                    startSecY = spawnTarget.sector.y;
                    startX = spawnTarget.x;
                    startY = spawnTarget.y;
                    UI.log(`>> Signal verfolgt: Sektor ${startSecX},${startSecY}`, "text-yellow-400");
                }

                this.state = {
                    saveSlot: slotIndex,
                    playerName: newName || "SURVIVOR",
                    sector: {x: startSecX, y: startSecY}, startSector: {x: vX, y: vY},
                    worldPOIs: worldPOIs,
                    player: {x: startX, y: startY, rot: 0},
                    stats: { STR: 5, PER: 5, END: 5, INT: 5, AGI: 5, LUC: 5 }, 
                    equip: { weapon: this.items.fists, body: this.items.vault_suit },
                    inventory: [], 
                    hp: 100, maxHp: 100, xp: 0, lvl: 1, caps: 50, ammo: 10, statPoints: 0, 
                    view: 'map', zone: 'Ödland', inDialog: false, isGameOver: false, 
                    explored: {}, 
                    sectorExploredCache: null,
                    visitedSectors: [`${startSecX},${startSecY}`],
                    tutorialsShown: { hacking: false, lockpicking: false },
                    tempStatIncrease: {}, buffEndTime: 0,
                    cooldowns: {}, 
                    quests: [ 
                        { id: "q1", title: "Der Weg nach Hause", text: "Suche Zivilisation und finde Vault 101.", read: false }
                    ], 
                    startTime: Date.now(),
                    savedPosition: null
                };
                this.addToInventory('stimpack', 1);
                this.state.hp = this.calculateMaxHP(this.getStat('END')); 
                this.state.maxHp = this.state.hp;
                
                UI.log(">> Neuer Charakter erstellt.", "text-green-400");
                this.saveGame(); 
            }

            this.loadSector(this.state.sector.x, this.state.sector.y);

            if(spawnTarget && !saveData) {
                this.state.player.x = spawnTarget.x;
                this.state.player.y = spawnTarget.y;
                this.reveal(spawnTarget.x, spawnTarget.y);
            }

            UI.switchView('map').then(() => { 
                if(UI.els.gameOver) UI.els.gameOver.classList.add('hidden'); 
                if(typeof Network !== 'undefined') Network.sendHeartbeat();
                if(isNewGame) {
                    setTimeout(() => UI.showPermadeathWarning(), 500);
                }
            });
        } catch(e) {
            console.error(e);
            if(UI.error) UI.error("GAME INIT FAIL: " + e.message);
        }
    },

    // --- HEAL & REST ---
    rest: function() { 
        if(!this.state) return;
        this.state.hp = this.state.maxHp; 
        UI.log("Ausgeruht. HP voll.", "text-blue-400"); 
        UI.update(); 
        // Save removed for bulk action
    },

    heal: function() { 
        if(this.state.caps >= 25) { 
            this.state.caps -= 25; 
            this.rest(); 
            // Save removed
        } else {
            UI.log("Zu wenig Kronkorken.", "text-red-500"); 
        }
    },
    
    buyAmmo: function() { 
        if(this.state.caps >= 10) { 
            this.state.caps -= 10; 
            this.state.ammo += 10; 
            UI.log("Munition gekauft.", "text-green-400"); 
            UI.update(); 
            // Save removed
        } else {
            UI.log("Zu wenig Kronkorken.", "text-red-500"); 
        }
    },
    
    buyItem: function(key) { 
        const item = this.items[key]; 
        if(this.state.caps >= item.cost) { 
            this.state.caps -= item.cost; 
            this.addToInventory(key, 1); 
            UI.log(`Gekauft: ${item.name}`, "text-green-400"); 
            
            // UI Update Logic for Shop
            const con = document.getElementById('shop-list');
            if(con) UI.renderShop(con);
            
            UI.update(); 
            // Save removed to prevent lag on every buy
        } else { 
            UI.log("Zu wenig Kronkorken.", "text-red-500"); 
        } 
    },

    // --- MAP LOGIC ---
    reveal: function(px, py) { 
        if(!this.state) return;
        if(!this.state.explored) this.state.explored = {}; 
        
        const radius = 2; 
        const secKey = `${this.state.sector.x},${this.state.sector.y}`;
        
        for(let y = py - radius; y <= py + radius; y++) {
            for(let x = px - radius; x <= px + radius; x++) {
                if(x >= 0 && x < this.MAP_W && y >= 0 && y < this.MAP_H) {
                    const tileKey = `${secKey}_${x},${y}`;
                    this.state.explored[tileKey] = true;
                }
            }
        }
    },

    move: function(dx, dy) {
        if(!this.state || this.state.isGameOver || this.state.view !== 'map' || this.state.inDialog) return;
        
        const nx = this.state.player.x + dx;
        const ny = this.state.player.y + dy;
        
        if(nx < 0 || nx >= this.MAP_W || ny < 0 || ny >= this.MAP_H) {
            this.changeSector(nx, ny);
            return;
        }

        const tile = this.state.currentMap[ny][nx];
        
        if (tile === '$') { UI.switchView('shop'); return; }
        if (tile === '&') { UI.switchView('crafting'); return; }
        if (tile === 'P') { UI.switchView('clinic'); return; }
        if (tile === 'E') { this.leaveCity(); return; }
        if (tile === 'X') { this.openChest(nx, ny); return; } 
        if (tile === 'v') { this.descendDungeon(); return; }

        if(['M', 'W', '#', 'U', 't', 'T', 'o', 'Y', '|', 'F'].includes(tile)) { 
            UI.shakeView();
            return; 
        }
        
        this.state.player.x = nx;
        this.state.player.y = ny;
        
        if(dx === 1) this.state.player.rot = Math.PI / 2;
        if(dx === -1) this.state.player.rot = -Math.PI / 2;
        if(dy === 1) this.state.player.rot = Math.PI;
        if(dy === -1) this.state.player.rot = 0;

        this.reveal(nx, ny);
        if(typeof Network !== 'undefined') Network.sendHeartbeat();

        if(tile === 'V') { UI.switchView('vault'); return; }
        if(tile === 'S') { this.tryEnterDungeon("market"); return; }
        if(tile === 'H') { this.tryEnterDungeon("cave"); return; }
        if(tile === 'C') { this.enterCity(); return; } 
        
        if(['.', ',', '_', ';', '"', '+', 'x', 'B'].includes(tile)) {
            if(Math.random() < 0.04) { 
                this.startCombat();
                return;
            }
        }
        UI.update();
    },

    changeSector: function(px, py) { 
        let sx=this.state.sector.x, sy=this.state.sector.y; 
        let newPx = px;
        let newPy = py;
        
        if(py < 0) { sy--; newPy = this.MAP_H - 1; newPx = this.state.player.x; }
        else if(py >= this.MAP_H) { sy++; newPy = 0; newPx = this.state.player.x; }
        if(px < 0) { sx--; newPx = this.MAP_W - 1; newPy = this.state.player.y; }
        else if(px >= this.MAP_W) { sx++; newPx = 0; newPy = this.state.player.y; }

        if(sx < 0 || sx >= this.WORLD_W || sy < 0 || sy >= this.WORLD_H) { UI.log("Ende der Weltkarte.", "text-red-500"); return; } 
        
        this.state.sector = {x: sx, y: sy}; 
        this.loadSector(sx, sy); 
        this.state.player.x = newPx;
        this.state.player.y = newPy;
        this.findSafeSpawn(); 
        this.reveal(this.state.player.x, this.state.player.y); 
        this.saveGame();
        UI.log(`Sektorwechsel: ${sx},${sy}`, "text-blue-400"); 
    },

    loadSector: function(sx_in, sy_in) { 
        const sx = parseInt(sx_in);
        const sy = parseInt(sy_in);
        const key = `${sx},${sy}`; 
        
        const mapSeed = (sx + 1) * 5323 + (sy + 1) * 8237 + 9283;
        if(typeof WorldGen !== 'undefined') WorldGen.setSeed(mapSeed);
        const rng = () => { return typeof WorldGen !== 'undefined' ? WorldGen.rand() : Math.random(); };
        
        if(!this.worldData[key]) { 
            let biome = 'wasteland';
            if(typeof WorldGen !== 'undefined') {
                biome = WorldGen.getSectorBiome(sx, sy);
            }
            
            let poiList = [];
            let sectorPoiType = null;

            if(this.state.worldPOIs) {
                this.state.worldPOIs.forEach(poi => {
                    if(poi.x === sx && poi.y === sy) {
                        poiList.push({x: 20, y: 20, type: poi.type});
                        sectorPoiType = poi.type;
                    }
                });
            }

            if(rng() < 0.35 && !sectorPoiType) { 
                let type = null;
                const r = rng(); 
                if(r < 0.3) type = 'S'; 
                else if(r < 0.6) type = 'H';
                
                if(type) {
                    poiList.push({x: Math.floor(rng()*(this.MAP_W-6))+3, y: Math.floor(rng()*(this.MAP_H-6))+3, type: type});
                    sectorPoiType = type;
                }
            }

            let map;
            if(typeof WorldGen !== 'undefined') {
                map = WorldGen.createSector(this.MAP_W, this.MAP_H, biome, poiList);
            } else {
                map = Array(this.MAP_H).fill().map(() => Array(this.MAP_W).fill('.'));
            }
            this.worldData[key] = { layout: map, biome: biome, poi: sectorPoiType };
        } 
        
        const data = this.worldData[key]; 
        this.state.currentMap = data.layout; 
        
        if(this.state.visitedSectors && !this.state.visitedSectors.includes(key)) {
            this.state.visitedSectors.push(key);
        }
        
        this.fixMapBorders(this.state.currentMap, sx, sy);
        
        if(!this.state.explored) this.state.explored = {};
        
        let zn = "Ödland"; 
        if(data.biome === 'city') zn = "Ruinenstadt"; 
        if(data.biome === 'desert') zn = "Aschewüste"; 
        if(data.biome === 'jungle') zn = "Dschungel"; 
        if(data.biome === 'swamp') zn = "Sumpf";
        this.state.zone = `${zn} (${sx},${sy})`; 
        
        this.findSafeSpawn();
        this.renderStaticMap(); 
        
        this.reveal(this.state.player.x, this.state.player.y);
    },

    fixMapBorders: function(map, sx, sy) {
        if(sy === 0) { for(let i=0; i<this.MAP_W; i++) map[0][i] = '#'; }
        if(sy === this.WORLD_H - 1) { for(let i=0; i<this.MAP_W; i++) map[this.MAP_H-1][i] = '#'; }
        if(sx === 0) { for(let i=0; i<this.MAP_H; i++) map[i][0] = '#'; }
        if(sx === this.WORLD_W - 1) { for(let i=0; i<this.MAP_H; i++) map[i][this.MAP_W-1] = '#'; }
    },
    
    findSafeSpawn: function() {
        if(!this.state || !this.state.currentMap) return;
        const isSafe = (x, y) => {
            if(x < 0 || x >= this.MAP_W || y < 0 || y >= this.MAP_H) return false;
            const t = this.state.currentMap[y][x];
            return !['M', 'W', '#', 'U', 't', 'T', 'o', 'Y', '|', 'F'].includes(t);
        };
        if(isSafe(this.state.player.x, this.state.player.y)) return;
        const rMax = 6;
        for(let r=1; r<=rMax; r++) {
            for(let dy=-r; dy<=r; dy++) {
                for(let dx=-r; dx<=r; dx++) {
                    const tx = this.state.player.x + dx;
                    const ty = this.state.player.y + dy;
                    if(isSafe(tx, ty)) {
                        this.state.player.x = tx;
                        this.state.player.y = ty;
                        return;
                    }
                }
            }
        }
        this.state.player.x = 20;
        this.state.player.y = 20;
    },

    tryEnterDungeon: function(type) {
        const key = `${this.state.sector.x},${this.state.sector.y}_${type}`;
        const cd = this.state.cooldowns ? this.state.cooldowns[key] : 0;
        if(cd && Date.now() < cd) {
             const minLeft = Math.ceil((cd - Date.now())/60000);
             UI.showDungeonLocked(minLeft);
             return;
        }
        UI.showDungeonWarning(() => this.enterDungeon(type));
    },

    enterDungeon: function(type, level=1) {
        if(level === 1) {
            this.state.savedPosition = { x: this.state.player.x, y: this.state.player.y };
            this.state.sectorExploredCache = JSON.parse(JSON.stringify(this.state.explored));
        }
        
        this.state.dungeonLevel = level;
        this.state.dungeonType = type;

        if(typeof WorldGen !== 'undefined') {
            WorldGen.setSeed((this.state.sector.x + 1) * (this.state.sector.y + 1) * Date.now() + level); 
            const data = WorldGen.generateDungeonLayout(this.MAP_W, this.MAP_H);
            this.state.currentMap = data.map;
            this.state.player.x = data.startX;
            this.state.player.y = data.startY;

            if(level < 3) {
                for(let y=0; y<this.MAP_H; y++) {
                    for(let x=0; x<this.MAP_W; x++) {
                        if(this.state.currentMap[y][x] === 'X') {
                            this.state.currentMap[y][x] = 'v';
                        }
                    }
                }
            }
        }
        
        const typeName = type === "cave" ? "Dunkle Höhle" : "Supermarkt Ruine";
        this.state.zone = `${typeName} (Ebene ${level})`;
        this.state.explored = {}; 
        this.reveal(this.state.player.x, this.state.player.y);
        
        this.renderStaticMap();
        UI.log(`${typeName} - Ebene ${level} betreten!`, "text-red-500");
        UI.update();
    },

    descendDungeon: function() {
        this.enterDungeon(this.state.dungeonType, this.state.dungeonLevel + 1);
        UI.shakeView();
        UI.log("Du steigst tiefer hinab...", "text-purple-400 font-bold");
    },
    
    openChest: function(x, y) {
        this.state.currentMap[y][x] = 'B'; 
        this.renderStaticMap(); 
        
        const multiplier = this.state.dungeonLevel || 1;
        const caps = (Math.floor(Math.random() * 200) + 100) * multiplier;
        this.state.caps += caps;
        this.addToInventory('legendary_part', 1 * multiplier);
        
        if(!this.state.cooldowns) this.state.cooldowns = {};
        const key = `${this.state.sector.x},${this.state.sector.y}_${this.state.dungeonType}`;
        this.state.cooldowns[key] = Date.now() + (10 * 60 * 1000); 

        UI.showDungeonVictory(caps, multiplier);
        
        if(Math.random() < 0.5) this.addToInventory('stimpack', 2);
        if(Math.random() < 0.5) this.addToInventory('nuclear_mat', 1);
        
        setTimeout(() => { this.leaveCity(); }, 4000);
    },

    enterCity: function() {
        this.state.savedPosition = { x: this.state.player.x, y: this.state.player.y };
        this.state.sectorExploredCache = JSON.parse(JSON.stringify(this.state.explored));

        if(typeof WorldGen !== 'undefined') {
            const map = WorldGen.generateCityLayout(this.MAP_W, this.MAP_H);
            this.state.currentMap = map;
        }
        this.state.zone = "Rusty Springs (Stadt)";
        this.state.player.x = 20;
        this.state.player.y = 38;
        this.state.player.rot = 0; 
        
        this.renderStaticMap();
        
        if(!this.state.explored) this.state.explored = {};
        const secKey = `${this.state.sector.x},${this.state.sector.y}`;
        for(let y=0; y<this.MAP_H; y++) for(let x=0; x<this.MAP_W; x++) this.state.explored[`${secKey}_${x},${y}`] = true;
        
        UI.log("Betrete Rusty Springs...", "text-yellow-400");
        UI.update();
    },

    leaveCity: function() {
        if(this.state.savedPosition) {
            this.state.player.x = this.state.savedPosition.x;
            this.state.player.y = this.state.savedPosition.y;
            this.state.savedPosition = null;
        }
        this.state.dungeonLevel = 0; 
        
        this.loadSector(this.state.sector.x, this.state.sector.y);
        
        if(this.state.sectorExploredCache) {
            this.state.explored = this.state.sectorExploredCache;
            this.state.sectorExploredCache = null;
            this.reveal(this.state.player.x, this.state.player.y);
        }

        UI.log("Zurück im Ödland.", "text-green-400");
    },

    addToInventory: function(id, count=1) { 
        if(!this.state.inventory) this.state.inventory = []; 
        const existing = this.state.inventory.find(i => i.id === id); 
        if(existing) existing.count += count; 
        else this.state.inventory.push({id: id, count: count}); 
        
        const itemDef = this.items[id];
        const itemName = itemDef ? itemDef.name : id;
        UI.log(`+ ${itemName} (${count})`, "text-green-400"); 

        if(itemDef && (itemDef.type === 'weapon' || itemDef.type === 'body')) {
            if(typeof UI !== 'undefined' && UI.triggerInventoryAlert) UI.triggerInventoryAlert();
        }
    }, 
    
    useItem: function(id) { 
        const itemDef = this.items[id]; 
        const invItem = this.state.inventory.find(i => i.id === id); 
        if(!invItem || invItem.count <= 0) return; 
        
        if(itemDef.type === 'consumable') { 
            if(itemDef.effect === 'heal') { 
                const healAmt = itemDef.val; 
                if(this.state.hp >= this.state.maxHp) { UI.log("Gesundheit voll.", "text-gray-500"); return; } 
                this.state.hp = Math.min(this.state.maxHp, this.state.hp + healAmt); 
                UI.log(`Verwendet: ${itemDef.name}`, "text-blue-400"); 
                invItem.count--; 
            } 
        } else if (itemDef.type === 'weapon' || itemDef.type === 'body') { 
            const oldItemName = this.state.equip[itemDef.slot].name; 
            const oldItemKey = Object.keys(this.items).find(key => this.items[key].name === oldItemName); 
            if(oldItemKey && oldItemKey !== 'fists' && oldItemKey !== 'vault_suit') { this.addToInventory(oldItemKey, 1); } 
            this.state.equip[itemDef.slot] = itemDef; 
            invItem.count--; 
            UI.log(`Ausgerüstet: ${itemDef.name}`, "text-yellow-400"); 
            if(itemDef.slot === 'body') { 
                const oldMax = this.state.maxHp; 
                this.state.maxHp = this.calculateMaxHP(this.getStat('END')); 
                this.state.hp += (this.state.maxHp - oldMax); 
            } 
        } 
        if(invItem.count <= 0) { this.state.inventory = this.state.inventory.filter(i => i.id !== id); } 
        UI.update(); 
        if(this.state.view === 'inventory') UI.renderInventory(); 
        this.saveGame(); 
    }, 
    
    craftItem: function(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if(!recipe) return;
        if(this.state.lvl < recipe.lvl) { UI.log(`Benötigt Level ${recipe.lvl}!`, "text-red-500"); return; }
        
        for(let reqId in recipe.req) {
            const countNeeded = recipe.req[reqId];
            const invItem = this.state.inventory.find(i => i.id === reqId);
            let hasEquipped = false;
            if (this.state.equip.weapon && Object.keys(this.items).find(k => this.items[k].name === this.state.equip.weapon.name) === reqId) hasEquipped = true;
            if (this.state.equip.body && Object.keys(this.items).find(k => this.items[k].name === this.state.equip.body.name) === reqId) hasEquipped = true;
            if (hasEquipped || !invItem || invItem.count < countNeeded) { UI.log(`Material fehlt: ${this.items[reqId].name}`, "text-red-500"); return; }
        }
        for(let reqId in recipe.req) {
            const countNeeded = recipe.req[reqId];
            const invItem = this.state.inventory.find(i => i.id === reqId);
            invItem.count -= countNeeded;
            if(invItem.count <= 0) this.state.inventory = this.state.inventory.filter(i => i.id !== reqId);
        }
        if(recipe.out === "AMMO") { this.state.ammo += recipe.count; UI.log(`Hergestellt: ${recipe.count} Munition`, "text-green-400 font-bold"); } 
        else { this.addToInventory(recipe.out, recipe.count); UI.log(`Hergestellt: ${this.items[recipe.out].name}`, "text-green-400 font-bold"); }
        // Save removed for bulk
        if(typeof UI !== 'undefined') UI.renderCrafting(); 
    },

    calculateMaxHP: function(end) { return 100 + (end - 5) * 10; }, 
    
    getStat: function(key) {
        if(!this.state) return 5;
        let val = this.state.stats[key] || 5;
        if(this.state.equip.body && this.state.equip.body.bonus && this.state.equip.body.bonus[key]) val += this.state.equip.body.bonus[key];
        if(this.state.equip.weapon && this.state.equip.weapon.bonus && this.state.equip.weapon.bonus[key]) val += this.state.equip.weapon.bonus[key];
        if(this.state.buffEndTime > Date.now()) val += 2; 
        return val;
    },

    expToNextLevel: function(lvl) {
        return Math.floor(100 * Math.pow(lvl, 1.5));
    },

    gainExp: function(amount) {
        this.state.xp += amount;
        UI.log(`+${amount} XP`, "text-yellow-400");
        let next = this.expToNextLevel(this.state.lvl);
        if(this.state.xp >= next) {
            this.state.lvl++;
            this.state.xp -= next;
            this.state.statPoints++;
            this.state.maxHp = this.calculateMaxHP(this.getStat('END'));
            this.state.hp = this.state.maxHp;
            UI.log(`LEVEL UP! Du bist jetzt Level ${this.state.lvl}`, "text-yellow-400 font-bold animate-pulse");
        }
    },

    saveGame: function(force=false) {
        if(typeof Network !== 'undefined') Network.save(this.state);
        try { localStorage.setItem('pipboy_save', JSON.stringify(this.state)); } catch(e){}
    },

    startCombat: function() { 
        let pool = []; 
        let lvl = this.state.lvl; 
        
        let difficultyMult = 1;
        if(this.state.dungeonLevel) {
            difficultyMult = 1 + (this.state.dungeonLevel * 0.2); 
        }

        let biome = this.worldData[`${this.state.sector.x},${this.state.sector.y}`]?.biome || 'wasteland'; 
        let zone = this.state.zone; 
        
        if(zone.includes("Supermarkt")) { pool = [this.monsters.raider, this.monsters.ghoul, this.monsters.wildDog]; if(lvl >= 4) pool.push(this.monsters.superMutant); } 
        else if (zone.includes("Höhle")) { pool = [this.monsters.moleRat, this.monsters.radScorpion, this.monsters.bloatfly]; if(lvl >= 3) pool.push(this.monsters.ghoul); } 
        else if(biome === 'city') { pool = [this.monsters.raider, this.monsters.ghoul, this.monsters.protectron]; if(lvl >= 5) pool.push(this.monsters.superMutant); if(lvl >= 7) pool.push(this.monsters.sentryBot); } 
        else if(biome === 'desert') { pool = [this.monsters.radScorpion, this.monsters.raider, this.monsters.moleRat]; } 
        else if(biome === 'jungle') { pool = [this.monsters.bloatfly, this.monsters.mutantRose, this.monsters.yaoGuai]; } 
        else if(biome === 'swamp') { pool = [this.monsters.mirelurk, this.monsters.bloatfly]; if(lvl >= 5) pool.push(this.monsters.ghoul); } 
        else { pool = [this.monsters.moleRat, this.monsters.radRoach, this.monsters.bloatfly]; if(lvl >= 2) pool.push(this.monsters.raider); if(lvl >= 3) pool.push(this.monsters.wildDog); } 
        
        if(lvl >= 8 && Math.random() < 0.1) pool = [this.monsters.deathclaw]; 
        else if (Math.random() < 0.01) pool = [this.monsters.deathclaw]; 
        
        const template = pool[Math.floor(Math.random()*pool.length)]; 
        let enemy = { ...template }; 
        
        enemy.hp = Math.floor(enemy.hp * difficultyMult);
        enemy.maxHp = enemy.hp;
        enemy.dmg = Math.floor(enemy.dmg * difficultyMult);
        enemy.loot = Math.floor(enemy.loot * difficultyMult);

        // [v0.4.12] Spawn Rate fix: 5% statt 15%
        const isLegendary = Math.random() < 0.05; 
        if(isLegendary) { 
            enemy.isLegendary = true; 
            enemy.name = "Legendäre " + enemy.name; 
            enemy.hp *= 2; 
            enemy.maxHp = enemy.hp; 
            enemy.dmg = Math.floor(enemy.dmg*1.5); 
            enemy.loot *= 3; 
            if(Array.isArray(enemy.xp)) enemy.xp = [enemy.xp[0]*3, enemy.xp[1]*3]; 
        } else {
             enemy.maxHp = enemy.hp; 
        }
        
        if(typeof Combat !== 'undefined') {
            Combat.start(enemy);
        } else {
            console.error("Combat module missing!");
        }
    },
    
    // [v0.4.12] Gamble Logic for Legendary Loot
    gambleLegendaryLoot: function(sum) {
        UI.log(`🎲 Wasteland Gamble: ${sum}`, "text-yellow-400 font-bold");
        
        // 3-9: Low Tier
        if(sum <= 9) {
            if(Math.random() < 0.5) {
                this.state.caps += 50;
                UI.log("Gewinn: 50 Kronkorken", "text-green-400");
            } else {
                this.state.ammo += 10;
                UI.log("Gewinn: 10x Munition", "text-green-400");
            }
        }
        // 10-15: Mid Tier
        else if(sum <= 15) {
            this.state.caps += 150;
            this.addToInventory('stimpack', 1);
            // Fallback for scrap
            const comp = this.items['screws'] ? 'screws' : 'junk_metal';
            this.addToInventory(comp, 5);
            UI.log("Gewinn: 150 KK + Stimpack + Schrott", "text-blue-400");
        }
        // 16-18: High Tier
        else {
            this.addToInventory('legendary_part', 1);
            this.state.caps += 300;
            // Rare Item (Simple random high tier weapon check)
            const rare = this.items['plasma_rifle'] ? 'plasma_rifle' : 'hunting_rifle';
            this.addToInventory(rare, 1);
            UI.log("JACKPOT! Modul + 300 KK + Waffe!", "text-yellow-400 font-bold animate-pulse");
        }
        this.saveGame();
    },

    hardReset: function() { if(typeof Network !== 'undefined') Network.deleteSave(); this.state = null; location.reload(); },
    upgradeStat: function(key) { if(this.state.statPoints > 0) { this.state.stats[key]++; this.state.statPoints--; if(key === 'END') this.state.maxHp = this.calculateMaxHP(this.getStat('END')); UI.renderChar(); UI.update(); this.saveGame(); } },
    
    draw: function() { 
        if(!this.ctx || !this.cacheCanvas) return; 
        const ctx = this.ctx; const cvs = ctx.canvas; 
        
        let targetCamX = (this.state.player.x * this.TILE) - (cvs.width / 2); 
        let targetCamY = (this.state.player.y * this.TILE) - (cvs.height / 2); 
        const maxCamX = (this.MAP_W * this.TILE) - cvs.width; 
        const maxCamY = (this.MAP_H * this.TILE) - cvs.height; 
        
        this.camera.x = Math.max(0, Math.min(targetCamX, maxCamX)); 
        this.camera.y = Math.max(0, Math.min(targetCamY, maxCamY)); 
        
        ctx.fillStyle = "#000"; 
        ctx.fillRect(0, 0, cvs.width, cvs.height); 
        
        ctx.drawImage(this.cacheCanvas, this.camera.x, this.camera.y, cvs.width, cvs.height, 0, 0, cvs.width, cvs.height); 
        
        ctx.save(); 
        ctx.translate(-this.camera.x, -this.camera.y); 
        
        const startX = Math.floor(this.camera.x / this.TILE); 
        const startY = Math.floor(this.camera.y / this.TILE); 
        const endX = startX + Math.ceil(cvs.width / this.TILE) + 1; 
        const endY = startY + Math.ceil(cvs.height / this.TILE) + 1; 
        
        const secKey = `${this.state.sector.x},${this.state.sector.y}`;
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7; 

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    
                    const tileKey = `${secKey}_${x},${y}`;
                    const isCity = (this.state.zone && this.state.zone.includes("Stadt")); 
                    
                    if(!isCity && !this.state.explored[tileKey]) {
                        ctx.fillStyle = "#000";
                        ctx.fillRect(x * this.TILE, y * this.TILE, this.TILE, this.TILE);
                        continue; 
                    }

                    const t = this.state.currentMap[y][x]; 
                    if(['V', 'S', 'C', 'G', 'H', '^', 'v', '<', '>', '$', '&', 'P', 'E', 'F', 'X'].includes(t)) { 
                        this.drawTile(ctx, x, y, t, pulse); 
                    } 
                } 
            } 
        } 
        
        if(typeof Network !== 'undefined' && Network.otherPlayers) { 
            for(let pid in Network.otherPlayers) { 
                const p = Network.otherPlayers[pid]; 
                if(p.sector && (p.sector.x !== this.state.sector.x || p.sector.y !== this.state.sector.y)) continue; 
                
                const ox = p.x * this.TILE + this.TILE/2; 
                const oy = p.y * this.TILE + this.TILE/2; 
                ctx.fillStyle = "#00ffff"; 
                ctx.shadowBlur = 5; 
                ctx.shadowColor = "#00ffff"; 
                ctx.beginPath(); 
                ctx.arc(ox, oy, 5, 0, Math.PI*2); 
                ctx.fill(); 
                ctx.font = "10px monospace"; 
                ctx.fillStyle = "white"; 
                ctx.fillText(p.name ? p.name.substring(0,3) : "P", ox+6, oy); 
                ctx.shadowBlur = 0; 
            } 
        } 
        
        const px = this.state.player.x * this.TILE + this.TILE/2; 
        const py = this.state.player.y * this.TILE + this.TILE/2; 
        
        ctx.translate(px, py); 
        ctx.rotate(this.state.player.rot); 
        ctx.translate(-px, -py); 
        
        ctx.fillStyle = "#39ff14"; 
        ctx.shadowBlur = 10; 
        ctx.shadowColor = "#39ff14"; 
        ctx.beginPath(); 
        ctx.moveTo(px, py - 8); 
        ctx.lineTo(px + 6, py + 8); 
        ctx.lineTo(px, py + 5); 
        ctx.lineTo(px - 6, py + 8); 
        ctx.fill(); 
        ctx.shadowBlur = 0; 
        
        ctx.restore(); 
    },

    drawTile: function(ctx, x, y, type, pulse = 1) { 
        const ts = this.TILE; const px = x * ts; const py = y * ts; 
        let bg = this.colors['.']; if(['_', ',', ';', '=', 'W', 'M', '~', '|', 'B'].includes(type)) bg = this.colors[type]; 
        
        if (!['^','v','<','>'].includes(type) && type !== '#') { ctx.fillStyle = bg; ctx.fillRect(px, py, ts, ts); } 
        if(!['^','v','<','>','M','W','~'].includes(type) && type !== '#') { ctx.strokeStyle = "rgba(40, 90, 40, 0.05)"; ctx.lineWidth = 1; ctx.strokeRect(px, py, ts, ts); } 
        
        if(['^', 'v', '<', '>'].includes(type)) { 
            ctx.fillStyle = "#000"; ctx.fillRect(px, py, ts, ts); ctx.fillStyle = "#1aff1a"; ctx.strokeStyle = "#000"; ctx.beginPath(); 
            if (type === '^') { ctx.moveTo(px + ts/2, py + 5); ctx.lineTo(px + ts - 5, py + ts - 5); ctx.lineTo(px + 5, py + ts - 5); } 
            else if (type === 'v') { ctx.moveTo(px + ts/2, py + ts - 5); ctx.lineTo(px + ts - 5, py + 5); ctx.lineTo(px + 5, py + 5); } 
            else if (type === '<') { ctx.moveTo(px + 5, py + ts/2); ctx.lineTo(px + ts - 5, py + 5); ctx.lineTo(px + ts - 5, py + ts - 5); } 
            else if (type === '>') { ctx.moveTo(px + ts - 5, py + ts/2); ctx.lineTo(px + 5, py + 5); ctx.lineTo(px + 5, py + ts - 5); } 
            ctx.fill(); ctx.stroke(); return; 
        }
        
        ctx.beginPath(); 
        switch(type) { 
            case '#': ctx.fillStyle = "#222"; ctx.fillRect(px, py, ts, ts); ctx.lineWidth=1; ctx.strokeStyle="#444"; ctx.strokeRect(px, py, ts, ts); break; 
            case 't': ctx.fillStyle = this.colors['t']; ctx.moveTo(px + ts/2, py + 2); ctx.lineTo(px + ts - 4, py + ts - 2); ctx.lineTo(px + 4, py + ts - 2); ctx.fill(); break;
            case 'T': ctx.fillStyle = this.colors['T']; ctx.moveTo(px + ts/2, py + 2); ctx.lineTo(px + ts - 2, py + ts - 2); ctx.lineTo(px + 2, py + ts - 2); ctx.fill(); break;
            case 'x': ctx.strokeStyle = this.colors['x']; ctx.lineWidth = 2; ctx.moveTo(px+5, py+ts-5); ctx.lineTo(px+ts-5, py+5); ctx.moveTo(px+5, py+5); ctx.lineTo(px+ts-5, py+ts-5); ctx.stroke(); break;
            case '"': ctx.strokeStyle = this.colors['"']; ctx.lineWidth = 1; ctx.moveTo(px+5, py+ts-5); ctx.lineTo(px+5, py+10); ctx.moveTo(px+15, py+ts-5); ctx.lineTo(px+15, py+5); ctx.moveTo(px+25, py+ts-5); ctx.lineTo(px+25, py+12); ctx.stroke(); break;
            case 'Y': ctx.strokeStyle = this.colors['Y']; ctx.lineWidth = 3; ctx.moveTo(px+15, py+ts-5); ctx.lineTo(px+15, py+5); ctx.moveTo(px+15, py+15); ctx.lineTo(px+5, py+10); ctx.moveTo(px+15, py+10); ctx.lineTo(px+25, py+5); ctx.stroke(); break;
            case 'o': ctx.fillStyle = this.colors['o']; ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI*2); ctx.fill(); break;
            case '+': ctx.fillStyle = this.colors['+']; ctx.fillRect(px+5, py+10, 5, 5); ctx.fillRect(px+15, py+20, 4, 4); ctx.fillRect(px+20, py+5, 6, 6); break;
            case 'M': ctx.fillStyle = "#3e2723"; ctx.moveTo(px + ts/2, py + 2); ctx.lineTo(px + ts, py + ts); ctx.lineTo(px, py + ts); ctx.fill(); break;
            case 'W': ctx.strokeStyle = "#4fc3f7"; ctx.lineWidth = 2; ctx.moveTo(px+5, py+15); ctx.lineTo(px+15, py+10); ctx.lineTo(px+25, py+15); ctx.stroke(); break;
            case '~': ctx.strokeStyle = "#556b2f"; ctx.lineWidth = 2; ctx.moveTo(px+5, py+15); ctx.lineTo(px+15, py+10); ctx.lineTo(px+25, py+15); ctx.stroke(); break;
            case '=': ctx.strokeStyle = "#5d4037"; ctx.lineWidth = 2; ctx.moveTo(px, py+5); ctx.lineTo(px+ts, py+5); ctx.moveTo(px, py+25); ctx.lineTo(px+ts, py+25); ctx.stroke(); break;
            case 'U': ctx.fillStyle = "#000"; ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI, true); ctx.fill(); break;
            case 'V': ctx.globalAlpha = pulse; ctx.fillStyle = this.colors['V']; ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = "#000"; ctx.font="bold 12px monospace"; ctx.fillText("101", px+5, py+20); break; 
            case 'C': ctx.globalAlpha = pulse; ctx.fillStyle = this.colors['C']; ctx.fillRect(px+6, py+14, 18, 12); ctx.beginPath(); ctx.moveTo(px+4, py+14); ctx.lineTo(px+15, py+4); ctx.lineTo(px+26, py+14); ctx.fill(); break; 
            case 'S': ctx.globalAlpha = pulse; ctx.fillStyle = this.colors['S']; ctx.arc(px+ts/2, py+12, 6, 0, Math.PI*2); ctx.fill(); ctx.fillRect(px+10, py+18, 10, 6); break; 
            case 'H': ctx.globalAlpha = pulse; ctx.fillStyle = this.colors['H']; ctx.arc(px+ts/2, py+ts/2, ts/2.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(px+ts/2, py+ts/2, ts/4, 0, Math.PI*2); ctx.fill(); break; 
            case '$': ctx.fillStyle = this.colors['$']; ctx.fillText("$$", px+5, py+20); break;
            case '&': ctx.fillStyle = this.colors['&']; ctx.fillText("🔧", px+5, py+20); break;
            case 'P': ctx.fillStyle = this.colors['P']; ctx.fillText("✚", px+8, py+20); break;
            case 'E': ctx.fillStyle = this.colors['E']; ctx.fillText("EXIT", px+2, py+20); break;
            case 'F': ctx.fillStyle = this.colors['F']; ctx.arc(px+ts/2, py+ts/2, ts/3, 0, Math.PI*2); ctx.fill(); break;
            case '|': ctx.fillStyle = this.colors['|']; ctx.fillRect(px, py, ts, ts); break;
            case 'X': ctx.fillStyle = this.colors['X']; ctx.fillRect(px+5, py+10, 20, 15); ctx.fillStyle = "#ffd700"; ctx.fillRect(px+12, py+15, 6, 5); break;
        } 
        ctx.globalAlpha = 1; 
    }
};
