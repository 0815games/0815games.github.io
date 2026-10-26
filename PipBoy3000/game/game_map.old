// [2026-02-16 21:05:00] game_map.js - Anti-Stuck & Force Path Logic

Object.assign(Game, {
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
        const posKey = `${nx},${ny}`;

        if(this.state.hiddenItems && this.state.hiddenItems[posKey]) {
            const itemId = this.state.hiddenItems[posKey];
            this.addToInventory(itemId, 1);
            const iName = (this.items && this.items[itemId]) ? this.items[itemId].name : itemId;
            UI.log(`Gefunden: ${iName}!`, "text-yellow-400 font-bold animate-pulse");
            UI.shakeView(); 
            delete this.state.hiddenItems[posKey]; 
        }

        if (tile === 'X') { this.openChest(nx, ny); return; } 
        if (tile === 'v') { this.descendDungeon(); return; }
        if (tile === '?') { this.testMinigames(); return; } 

        // Kollision
        if(['M', 'W', '#', 'U', 't', 'o', 'Y', '|', 'F', 'T', 'R', '^', '~'].includes(tile) && tile !== 'R') { 
            if(this.state.hiddenItems && this.state.hiddenItems[posKey]) {
                 const itemId = this.state.hiddenItems[posKey];
                 this.addToInventory(itemId, 1);
                 UI.log("Item gefunden!", "text-yellow-400 font-bold");
                 delete this.state.hiddenItems[posKey];
                 return; 
            }
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
        if(tile === 'C') { this.enterCity(); return; } 
        if(tile === 'S') { this.tryEnterDungeon("market"); return; }
        if(tile === 'H') { this.tryEnterDungeon("cave"); return; }
        if(tile === 'A') { this.tryEnterDungeon("military"); return; }
        if(tile === 'R') { this.tryEnterDungeon("raider"); return; }
        if(tile === 'K') { this.tryEnterDungeon("tower"); return; }
        
        if(['.', ',', '_', ';', '"', '+', 'x', 'B', '=', '+'].includes(tile)) {
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
        
        // WICHTIG: Prüfen ob Spawn blockiert ist und FREIRÄUMEN
        this.ensureWalkableSpawn();
        
        this.reveal(this.state.player.x, this.state.player.y); 
        this.saveGame();
        
        if(typeof this.updateQuestProgress === 'function') {
             this.updateQuestProgress('visit', `${sx},${sy}`, 1);
        }
        
        UI.log(`Sektorwechsel: ${sx},${sy}`, "text-blue-400"); 
    },

    // NEU: Diese Funktion garantiert einen Weg
    ensureWalkableSpawn: function() {
        if(!this.state || !this.state.currentMap) return;
        const px = this.state.player.x;
        const py = this.state.player.y;
        
        // Bereich um Spieler (1 Radius) prüfen
        for(let dy=-1; dy<=1; dy++) {
            for(let dx=-1; dx<=1; dx++) {
                const tx = px + dx;
                const ty = py + dy;
                
                if(tx >= 0 && tx < this.MAP_W && ty >= 0 && ty < this.MAP_H) {
                    const tile = this.state.currentMap[ty][tx];
                    // Blockierende Tiles löschen
                    if(['^', 't', '~', '#'].includes(tile)) {
                        this.state.currentMap[ty][tx] = '.';
                    }
                }
            }
        }
        
        // Falls wir genau auf Wasser stehen, Brücke bauen
        const currentTile = this.state.currentMap[py][px];
        if(currentTile === '~') this.state.currentMap[py][px] = '+';
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
            if(typeof WorldGen !== 'undefined') biome = WorldGen.getSectorBiome(sx, sy);
            
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
            if(typeof WorldGen !== 'undefined') map = WorldGen.createSector(this.MAP_W, this.MAP_H, biome, poiList);
            else map = Array(this.MAP_H).fill().map(() => Array(this.MAP_W).fill('.'));
            
            this.worldData[key] = { layout: map, biome: biome, poi: sectorPoiType };
        } 
        
        const data = this.worldData[key]; 
        this.state.currentMap = data.layout; 
        
        if(this.state.currentMap[20] && this.state.currentMap[20][22]) {
            this.state.currentMap[20][22] = '?';
        }

        if(this.state.visitedSectors && !this.state.visitedSectors.includes(key)) {
            this.state.visitedSectors.push(key);
        }
        
        this.state.hiddenItems = {}; 
        
        if(Math.random() < 0.3) { 
            let hiddenX, hiddenY;
            let attempts = 0;
            do {
                hiddenX = Math.floor(Math.random() * this.MAP_W);
                hiddenY = Math.floor(Math.random() * this.MAP_H);
                attempts++;
            } while(attempts < 100 && !this.isValidHiddenSpot(hiddenX, hiddenY));
            
            if(attempts < 100) {
                const bps = ['bp_ammo', 'bp_rusty_pistol', 'bp_machete', 'bp_leather_armor'];
                const bp = bps[Math.floor(Math.random() * bps.length)];
                if(this.items && this.items[bp]) {
                    const recipeId = this.items[bp].recipeId;
                    if(!this.state.knownRecipes.includes(recipeId)) {
                        this.state.hiddenItems[`${hiddenX},${hiddenY}`] = bp;
                    }
                }
            }
        }

        if(!this.state.explored) this.state.explored = {};
        
        let zn = "Ödland"; 
        if(data.biome === 'city') zn = "Ruinenstadt"; 
        if(data.biome === 'desert') zn = "Aschewüste"; 
        if(data.biome === 'jungle') zn = "Dschungel"; 
        if(data.biome === 'swamp') zn = "Sumpf";
        if(data.biome === 'forest') zn = "Verstrahlter Wald";
        if(data.biome === 'mountain') zn = "Gebirge";
        this.state.zone = `${zn} (${sx},${sy})`; 
        
        // Erst laden, dann prüfen ob Spawn sicher ist!
        this.ensureWalkableSpawn(); 
        if(this.renderStaticMap) this.renderStaticMap(); 
        this.reveal(this.state.player.x, this.state.player.y);
    },

    isValidHiddenSpot: function(x, y) {
        const t = this.state.currentMap[y][x];
        return ['t', 'T', 'o', 'Y', '#', '"'].includes(t);
    },
    
    findSafeSpawn: function() {
        if(!this.state || !this.state.currentMap) return;
        
        // Zuerst versuchen wir, den aktuellen Platz freizuräumen (aggressiv)
        this.ensureWalkableSpawn();
        
        // Fallback: Wenn wir in einem POI stecken, suchen wir was in der Nähe
        const isSafe = (x, y) => {
            if(x < 0 || x >= this.MAP_W || y < 0 || y >= this.MAP_H) return false;
            const t = this.state.currentMap[y][x];
            return !['M', 'W', '#', 'U', 't', 'T', 'o', 'Y', '|', 'F', 'R', 'A', 'K', '?', '^', '~'].includes(t);
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
        this.ensureWalkableSpawn(); // Selbst hier erzwingen wir Sicherheit
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
        
        let typeName = "Dungeon";
        if(type === "cave") typeName = "Dunkle Höhle";
        if(type === "market") typeName = "Supermarkt Ruine";
        if(type === "military") typeName = "Alte Militärbasis";
        if(type === "raider") typeName = "Raider Festung";
        if(type === "tower") typeName = "Funkturm-Station";

        this.state.zone = `${typeName} (Ebene ${level})`;
        this.state.explored = {}; 
        this.reveal(this.state.player.x, this.state.player.y);
        
        if(this.renderStaticMap) this.renderStaticMap();
        UI.log(`${typeName} - Ebene ${level} betreten!`, "text-red-500 font-bold");
        UI.update();
    },

    descendDungeon: function(type) {
        this.enterDungeon(this.state.dungeonType, this.state.dungeonLevel + 1);
        UI.shakeView();
        UI.log("Du steigst tiefer hinab...", "text-purple-400 font-bold");
    },
    
    openChest: function(x, y) {
        if(this.state.dungeonLevel >= 3) {
             UI.log("Sicherheitsmechanismus aktiv...", "text-yellow-400 animate-pulse");
             UI.startMinigame('memory', () => {
                 this.forceOpenChest(x, y);
             });
             return;
        }
        this.forceOpenChest(x, y);
    },

    forceOpenChest: function(x, y) {
        this.state.currentMap[y][x] = 'B'; 
        if(this.renderStaticMap) this.renderStaticMap(); 
        
        const multiplier = this.state.dungeonLevel || 1;
        const caps = (Math.floor(Math.random() * 200) + 100) * multiplier;
        this.state.caps += caps;
        this.addToInventory('legendary_part', 1 * multiplier);
        
        if(Math.random() < 0.4) { 
            const bps = ['bp_stimpack', 'bp_metal_armor', 'bp_ammo'];
            const bp = bps[Math.floor(Math.random() * bps.length)];
            if(this.items && this.items[bp]) {
                const rid = this.items[bp].recipeId;
                if(!this.state.knownRecipes.includes(rid)) {
                    this.addToInventory(bp, 1);
                    UI.log("BAUPLAN GEFUNDEN!", "text-cyan-400 font-bold");
                } else {
                    this.addToInventory('screws', 5);
                }
            } else {
                this.addToInventory('screws', 5);
            }
        }

        if(!this.state.cooldowns) this.state.cooldowns = {};
        const key = `${this.state.sector.x},${this.state.sector.y}_${this.state.dungeonType}`;
        this.state.cooldowns[key] = Date.now() + (10 * 60 * 1000); 

        UI.showDungeonVictory(caps, multiplier);
        
        if(Math.random() < 0.5) this.addToInventory('stimpack', 2);
        if(Math.random() < 0.5) this.addToInventory('nuclear_mat', 1);
        
        setTimeout(() => { this.leaveCity(); }, 4000);
    },

    testMinigames: function() {
        if(typeof UI !== 'undefined' && UI.els.dialog) {
             UI.els.dialog.style.display = 'flex';
             UI.els.dialog.innerHTML = `
                <div class="bg-black/95 border-2 border-yellow-400 p-6 rounded-lg shadow-[0_0_20px_#ffd700] text-center w-full max-w-md pointer-events-auto relative z-50">
                    <h3 class="text-xl font-bold text-yellow-400 mb-4 tracking-widest">MINIGAME TEST STATION</h3>
                    <p class="text-xs text-gray-400 mb-4">Wähle ein System zum Testen:</p>
                    <div class="grid grid-cols-1 gap-3 mb-4">
                        <button onclick="UI.els.dialog.style.display='none'; UI.startMinigame('hacking');" class="border border-green-500 text-green-400 p-3 hover:bg-green-900 font-mono">TERMINAL HACKING</button>
                        <button onclick="UI.els.dialog.style.display='none'; UI.startMinigame('lockpicking');" class="border border-green-500 text-green-400 p-3 hover:bg-green-900 font-mono">LOCKPICKING</button>
                        <button onclick="UI.els.dialog.style.display='none'; UI.startMinigame('dice');" class="border border-green-500 text-green-400 p-3 hover:bg-green-900 font-mono">WASTELAND DICE</button>
                        <button onclick="UI.els.dialog.style.display='none'; UI.startMinigame('defusal');" class="border border-green-500 text-green-400 p-3 hover:bg-green-900 font-mono">BOMB DEFUSAL</button>
                        <button onclick="UI.els.dialog.style.display='none'; UI.startMinigame('memory');" class="border border-green-500 text-green-400 p-3 hover:bg-green-900 font-mono">SECURITY MEMORY</button>
                    </div>
                    <button onclick="UI.els.dialog.style.display='none'; UI.els.dialog.innerHTML='';" class="border border-red-500 text-red-500 px-4 py-2 hover:bg-red-900 w-full uppercase">Schließen</button>
                </div>
             `;
        }
    },

    enterCity: function() {
        this.state.savedPosition = { x: this.state.player.x, y: this.state.player.y };
        this.state.view = 'city';
        UI.log("Betrete Rusty Springs...", "text-yellow-400");
        this.saveGame();
        UI.switchView('city').then(() => {
            if(typeof UI !== 'undefined' && UI.renderCity) { UI.renderCity(); } 
            else { console.error("UI.renderCity missing!"); }
        });
    },

    leaveCity: function() {
        this.state.view = 'map';
        this.state.dungeonLevel = 0; 
        if(this.state.savedPosition) {
            this.state.player.x = this.state.savedPosition.x;
            this.state.player.y = this.state.savedPosition.y;
            this.state.savedPosition = null;
        }
        UI.switchView('map').then(() => {
            if(this.renderStaticMap) this.renderStaticMap();
        });
        UI.log("Zurück im Ödland.", "text-green-400");
    }
});
