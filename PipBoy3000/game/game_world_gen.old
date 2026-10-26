// [2026-02-16 23:00:00] game_world_gen.js - Auto-Bridges & Trails Update

const WorldGen = {
    _seed: 12345,

    setSeed: function(val) {
        this._seed = val % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
    },

    rand: function() {
        this._seed = (this._seed * 16807) % 2147483647;
        return (this._seed - 1) / 2147483646;
    },

    // Basis Noise (0.0 bis 1.0)
    noise: function(nx, ny) {
        const val = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
        return val - Math.floor(val); 
    },

    smoothNoise: function(x, y, seed) {
        const corners = (this.noise(x-1 + seed, y-1 + seed) + this.noise(x+1 + seed, y-1 + seed) + this.noise(x-1 + seed, y+1 + seed) + this.noise(x+1 + seed, y+1 + seed)) / 16;
        const sides = (this.noise(x-1 + seed, y + seed) + this.noise(x+1 + seed, y + seed) + this.noise(x + seed, y-1 + seed) + this.noise(x + seed, y+1 + seed)) / 8;
        const center = this.noise(x + seed, y + seed) / 4;
        return corners + sides + center;
    },
    
    // SPEZIAL: Kurvige Flüsse durch Verzerrung
    getRiverValue: function(x, y, seed, scale) {
        const warpX = this.smoothNoise(x * 0.05, y * 0.05, seed + 100) * 4.0; 
        const warpY = this.smoothNoise(x * 0.05, y * 0.05, seed + 200) * 4.0;
        const nx = (x * scale) + warpX;
        const ny = (y * scale) + warpY;
        return Math.abs(this.smoothNoise(nx, ny, seed) - 0.5);
    },

    getSectorBiome: function(x, y) {
        if (x <= 2 && y <= 2) return 'forest';      
        if (x >= 7 && y >= 7) return 'desert';      
        if (x >= 7 && y <= 2) return 'swamp';       
        if (x <= 2 && y >= 7) return 'mountain';    
        return 'wasteland'; 
    },

    createSector: function(width, height, biomeType, poiList) {
        let map = Array(height).fill().map(() => Array(width).fill('.'));
        const sectorSeed = this.rand() * 1000;

        let riverThreshold = 0.025; 
        let mountainThresh = 0.82; 
        let treeThresh = 0.70;     
        let ruinThresh = 0.88;
        let terrainScale = 0.12; 

        if(biomeType === 'forest') { treeThresh = 0.50; terrainScale = 0.15; riverThreshold = 0.035; }
        if(biomeType === 'swamp') { riverThreshold = 0.08; treeThresh = 0.60; } 
        if(biomeType === 'desert') { riverThreshold = 0.005; treeThresh = 0.98; mountainThresh = 0.75; ruinThresh = 0.78; } 
        if(biomeType === 'mountain') { mountainThresh = 0.55; treeThresh = 0.85; riverThreshold = 0.02; }

        // 1. TERRAIN GENERIERUNG
        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                // Zwei Flüsse die sich kreuzen können
                let river1 = this.getRiverValue(x, y, sectorSeed, 0.02);
                let river2 = this.getRiverValue(x, y, sectorSeed + 5000, 0.03);
                let isRiver = (river1 < riverThreshold) || (river2 < riverThreshold * 0.7);

                let nx = x * terrainScale;
                let ny = y * terrainScale;
                let elevation = this.smoothNoise(nx, ny, sectorSeed + 100);
                let moisture = this.smoothNoise(nx + 50, ny + 50, sectorSeed + 200);
                let ruins = this.smoothNoise(nx * 4, ny * 4, sectorSeed + 800);

                map[y][x] = '.'; 

                if (isRiver) map[y][x] = '~';
                else if (elevation > mountainThresh) map[y][x] = '^';
                else if (ruins > ruinThresh) map[y][x] = '#'; 
                else if (moisture > treeThresh) map[y][x] = 't';
                
                // Ränder begehbar halten
                if(x < 2 || x > width - 3 || y < 2 || y > height - 3) {
                    if(['^', 't', '#'].includes(map[y][x])) map[y][x] = '.';
                }
            }
        }

        // 2. POIs PLATZIEREN
        if(poiList) {
            poiList.forEach(poi => {
                if(poi.x >= 0 && poi.x < width && poi.y >= 0 && poi.y < height) {
                    map[poi.y][poi.x] = poi.type;
                    this.clearArea(map, poi.x, poi.y, 4, true); // true = force clear water too
                }
            });
        }

        // 3. STRASSEN ZWISCHEN POIs
        if(poiList && poiList.length > 1) {
            for(let i=0; i<poiList.length-1; i++) {
                this.buildRoad(map, poiList[i], poiList[i+1]);
            }
        }

        // 4. NEU: ZUFÄLLIGE "ALTE PFADE" & BRÜCKEN
        // Erzeugt 3-5 Wege quer durch den Sektor, damit immer Brücken entstehen
        const numTrails = Math.floor(this.rand() * 3) + 3;
        for(let i=0; i<numTrails; i++) {
            const p1 = this.getRandomEdgePoint(width, height);
            const p2 = this.getRandomEdgePoint(width, height);
            this.buildRoad(map, p1, p2);
        }

        return map;
    },

    getRandomEdgePoint: function(w, h) {
        const side = Math.floor(this.rand() * 4);
        // Etwas Abstand vom absoluten Rand (2 Felder)
        if(side === 0) return {x: Math.floor(this.rand()*(w-4))+2, y: 0}; // Oben
        if(side === 1) return {x: Math.floor(this.rand()*(w-4))+2, y: h-1}; // Unten
        if(side === 2) return {x: 0, y: Math.floor(this.rand()*(h-4))+2}; // Links
        return {x: w-1, y: Math.floor(this.rand()*(h-4))+2}; // Rechts
    },

    clearArea: function(map, cx, cy, radius, force = false) {
        const h = map.length;
        const w = map[0].length;
        for(let dy=-radius; dy<=radius; dy++) {
            for(let dx=-radius; dx<=radius; dx++) {
                const ny = cy+dy, nx = cx+dx;
                if(ny>=0 && ny<h && nx>=0 && nx<w) {
                    const t = map[ny][nx];
                    if(map[ny][nx] !== map[cy][cx]) {
                        // force=true: Löscht auch Wasser (für Häuserbau wichtig)
                        // force=false: Lässt Wasser da (für Straßenränder wichtig)
                        if(force) {
                             if(['^', 't', '~', '#'].includes(t)) map[ny][nx] = '.';
                        } else {
                             if(['^', 't', '#'].includes(t)) map[ny][nx] = '.';
                        }
                    }
                }
            }
        }
    },

    generateCityLayout: function(width, height) {
        let map = Array(height).fill().map(() => Array(width).fill('=')); 
        for(let y=0; y<height; y++) { map[y][0] = '|'; map[y][width-1] = '|'; }
        for(let x=0; x<width; x++) { map[0][x] = '|'; map[height-1][x] = '|'; }
        map[height-1][width/2] = 'E'; map[height-1][width/2-1] = 'E'; map[height-1][width/2+1] = 'E';
        const cx = Math.floor(width/2), cy = Math.floor(height/2);
        for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) map[cy+dy][cx+dx] = 'F';
        for(let y=5; y<12; y++) for(let x=5; x<15; x++) map[y][x] = '|'; for(let y=6; y<11; y++) for(let x=6; x<14; x++) map[y][x] = '.'; map[11][10] = '='; map[8][10] = '$'; 
        for(let y=5; y<12; y++) for(let x=25; x<35; x++) map[y][x] = '|'; for(let y=6; y<11; y++) for(let x=26; x<34; x++) map[y][x] = '.'; map[11][30] = '='; map[8][30] = 'P'; 
        for(let y=25; y<32; y++) for(let x=5; x<15; x++) map[y][x] = '|'; for(let y=26; y<31; y++) for(let x=6; x<14; x++) map[y][x] = '.'; map[25][10] = '='; map[28][10] = '&'; 
        return map;
    },
    
    generateDungeonLayout: function(width, height) {
        let map = Array(height).fill().map(() => Array(width).fill('#')); 
        const rooms = [];
        const numRooms = 8;
        for(let i=0; i<numRooms; i++) {
            const w = Math.floor(this.rand() * 6) + 4;
            const h = Math.floor(this.rand() * 6) + 4;
            const x = Math.floor(this.rand() * (width - w - 2)) + 1;
            const y = Math.floor(this.rand() * (height - h - 2)) + 1;
            for(let ry=y; ry<y+h; ry++) { for(let rx=x; rx<x+w; rx++) { map[ry][rx] = 'B'; } }
            rooms.push({x, y, w, h, cx: Math.floor(x+w/2), cy: Math.floor(y+h/2)});
            if(i > 0) { const prev = rooms[i-1]; this.buildDungeonCorridor(map, prev.cx, prev.cy, rooms[i].cx, rooms[i].cy); }
        }
        const start = rooms[0]; map[start.cy][start.cx] = 'E';
        const end = rooms[rooms.length-1]; map[end.cy][end.cx] = 'X';
        for(let y=0; y<height; y++) { map[y][0] = '#'; map[y][width-1] = '#'; }
        for(let x=0; x<width; x++) { map[0][x] = '#'; map[height-1][x] = '#'; }
        return { map, startX: start.cx, startY: start.cy };
    },
    
    buildDungeonCorridor: function(map, x1, y1, x2, y2) {
        let x = x1, y = y1;
        while(x !== x2) { map[y][x] = 'B'; x += (x < x2) ? 1 : -1; }
        while(y !== y2) { map[y][x] = 'B'; y += (y < y2) ? 1 : -1; }
    },

    buildRoad: function(map, start, end) {
        let x = start.x, y = start.y;
        while(x !== end.x || y !== end.y) {
            // Zufällige Bewegung
            if(this.rand() < 0.2) { 
                const dir = this.rand() < 0.5 ? 0 : 1; 
                if(dir === 0 && x !== end.x) x += (end.x > x ? 1 : -1); 
                else if(y !== end.y) y += (end.y > y ? 1 : -1); 
            } else { 
                if(Math.abs(end.x - x) > Math.abs(end.y - y)) x += (end.x > x ? 1 : -1); 
                else y += (end.y > y ? 1 : -1); 
            }
            
            if(x < 0 || x >= map[0].length || y < 0 || y >= map.length) continue;
            
            // Straßenbau mit Brücken-Logik
            const buildSpot = (cx, cy) => {
                if(cx < 0 || cx >= map[0].length || cy < 0 || cy >= map.length) return;
                
                const current = map[cy][cx];
                
                if (current === '~' || current === '+') {
                    map[cy][cx] = '+'; // Wasser -> Brücke
                    // KEIN clearArea hier, sonst löschen wir das Wasser unter der Brücke!
                } else {
                    map[cy][cx] = '='; // Land -> Straße
                    // Bäume/Steine am Straßenrand entfernen, aber Wasser lassen
                    this.clearArea(map, cx, cy, 1, false); 
                }
            };

            buildSpot(x, y);
            // Breitere Straßen für bessere Optik
            if(x+1 < map[0].length) buildSpot(x+1, y);
        }
    }
};
