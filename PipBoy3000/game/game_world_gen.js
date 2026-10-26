// [2026-02-21 13:05:00] game_world_gen.js - POI Offset Spawns

const WorldGen = {
    _seed: 12345,
    locations: { vault: {x:4, y:4}, city: {x:7, y:7}, ghostTown: {x:2, y:8} }, 
    sectorRoads: {}, 

    setSeed: function(val) {
        this._seed = val % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
        this.calculateLocations(); 
    },

    rand: function() {
        this._seed = (this._seed * 16807) % 2147483647;
        return (this._seed - 1) / 2147483646;
    },

    calculateLocations: function() {
        let tempSeed = this._seed;
        const pseudoRand = () => {
            tempSeed = (tempSeed * 16807) % 2147483647;
            return (tempSeed - 1) / 2147483646;
        };
        this.locations.vault = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        do {
            this.locations.city = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        } while (this.locations.city.x === this.locations.vault.x && this.locations.city.y === this.locations.vault.y);

        do {
            this.locations.ghostTown = { x: Math.floor(pseudoRand() * 8) + 1, y: Math.floor(pseudoRand() * 8) + 1 };
        } while (
            (this.locations.ghostTown.x === this.locations.vault.x && this.locations.ghostTown.y === this.locations.vault.y) ||
            (this.locations.ghostTown.x === this.locations.city.x && this.locations.ghostTown.y === this.locations.city.y)
        );

        this.sectorRoads = {}; 
        this.generateGlobalPath(this.locations.vault, this.locations.city, pseudoRand);
        this.generateGlobalPath(this.locations.city, this.locations.ghostTown, pseudoRand); 
        
        for(let i=0; i<1; i++) {
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
                next.x += (target.x > curr.x) ? 1 : -1;
            } else {
                next.y += (target.y > curr.y) ? 1 : -1;
            }
            this.addRoadSegment(curr, next);
            curr = next;
            steps++;
        }
    },

    addRoadSegment: function(s1, s2) {
        let dirFromS1 = '';
        if (s2.y < s1.y) dirFromS1 = 'N'; if (s2.y > s1.y) dirFromS1 = 'S';
        if (s2.x > s1.x) dirFromS1 = 'E'; if (s2.x < s1.x) dirFromS1 = 'W';
        const s1Key = `${s1.x},${s1.y}`; const s2Key = `${s2.x},${s2.y}`;
        if (!this.sectorRoads[s1Key]) this.sectorRoads[s1Key] = [];
        if (!this.sectorRoads[s1Key].includes(dirFromS1)) this.sectorRoads[s1Key].push(dirFromS1);
        
        let dirFromS2 = '';
        if (dirFromS1 === 'N') dirFromS2 = 'S'; if (dirFromS1 === 'S') dirFromS2 = 'N';
        if (dirFromS1 === 'E') dirFromS2 = 'W'; if (dirFromS1 === 'W') dirFromS2 = 'E';
        if (!this.sectorRoads[s2Key]) this.sectorRoads[s2Key] = [];
        if (!this.sectorRoads[s2Key].includes(dirFromS2)) this.sectorRoads[s2Key].push(dirFromS2);
    },

    getStartSector: function() { return this.locations.vault; },

    noise: function(nx, ny) {
        const val = Math.sin(nx * 12.9898 + ny * 78.233) * 43758.5453;
        return val - Math.floor(val); 
    },
    smoothNoise: function(x, y, seed) {
        const corners = (this.noise(x-1 + seed, y-1 + seed) + this.noise(x+1 + seed, y-1 + seed) + this.noise(x-1 + seed, y+1 + seed) + this.noise(x+1 + seed, y+1 + seed)) / 16;
        const sides = (this.noise(x-1 + seed, y + seed) + this.noise(x+1 + seed, y + seed) + this.noise(x + seed, y-1 + seed) + this.noise(x + seed, y+1 + seed)) / 8;
        const center = this.noise(x + seed, y + seed) / 4;
        return Math.abs(corners + sides + center);
    },
    isGlobalRiver: function(gx, gy) {
        const riverWidth = 2.5; 
        let r1 = 100 + Math.sin(gy * 0.02) * 40; if (Math.abs(gx - r1) < riverWidth) return true;
        let r2 = 380 + Math.sin(gy * 0.03 + 2) * 30; if (Math.abs(gx - r2) < riverWidth) return true;
        let r3 = 400 + Math.cos(gx * 0.015) * 50; if (Math.abs(gy - r3) < riverWidth + 1) return true;
        let r4 = gx + Math.sin(gx * 0.02) * 40; if (Math.abs(gy - r4) < riverWidth) return true;
        return false;
    },
    getSectorBiome: function(sx, sy) {
        const gx = sx * 50 + 25; const gy = sy * 50 + 25;
        const moisture = this.smoothNoise(gx * 0.003, gy * 0.003, this._seed + 200);
        const heat = this.smoothNoise(gx * 0.003 + 100, gy * 0.003 + 100, 888);
        if(moisture > 0.6 && heat < 0.5) return 'forest';
        if(moisture > 0.65 && heat > 0.5) return 'swamp';
        if(heat > 0.7 && moisture < 0.4) return 'desert';
        if(this.smoothNoise(gx * 0.005, gy * 0.005, this._seed + 100) > 0.75) return 'mountain';
        return 'wasteland';
    },

    createSector: function(width, height, sx, sy) {
        let map = Array(height).fill().map(() => Array(width).fill('.'));
        const worldSeed = this._seed;

        for(let y = 0; y < height; y++) {
            for(let x = 0; x < width; x++) {
                let gx = (sx * width) + x;
                let gy = (sy * height) + y;
                let moisture = this.smoothNoise(gx * 0.003, gy * 0.003, worldSeed + 200); 
                let heat = this.smoothNoise(gx * 0.003 + 500, gy * 0.003 + 500, worldSeed + 500);
                let elevation = this.smoothNoise(gx * 0.006, gy * 0.006, worldSeed + 100); 
                let isRiver = this.isGlobalRiver(gx, gy);

                let ground = '.'; 
                let treeThresh = 0.15; 
                
                if(heat > 0.7 && moisture < 0.4) { ground = '_'; treeThresh = 0.02; } 
                else if(moisture > 0.65 && heat > 0.5) { ground = ';'; treeThresh = 0.35; } 
                else if(moisture > 0.6 && heat < 0.5) { ground = '"'; treeThresh = 0.55; } 
                
                if (ground === '.' || ground === '_') {
                    if (this.rand() > 0.92) ground = ','; 
                }

                let detail = this.smoothNoise(gx * 0.15, gy * 0.15, worldSeed + 300);
                map[y][x] = ground; 

                if (isRiver) map[y][x] = '~';
                else if (elevation > 0.94) map[y][x] = 'Y'; 
                else if (elevation > 0.85) map[y][x] = '^'; 
                else if (detail < treeThresh) map[y][x] = 't'; 
                
                if(x < 2 || x > width - 3 || y < 2 || y > height - 3) {
                    if(['^', 'Y', 't', '#'].includes(map[y][x])) map[y][x] = ground;
                }
            }
        }

        for(let y = 3; y < height - 3; y+=5) {
            for(let x = 3; x < width - 3; x+=5) {
                let gx = (sx * width) + x;
                let gy = (sy * height) + y;
                let ruinVal = this.smoothNoise(gx * 0.04, gy * 0.04, worldSeed + 800);
                if(ruinVal > 0.82) this.placeHouseRuin(map, x, y);
            }
        }

        // --- CINETMATIC SPAWNS ---
        
        if(sx === this.locations.vault.x && sy === this.locations.vault.y) {
            this.placePOI(map, 25, 21, 'V', 4);
            for(let py=22; py<=25; py++) map[py][25] = '=';
        }
        
        if(sx === this.locations.city.x && sy === this.locations.city.y) {
            this.placePOI(map, 25, 21, 'C', 6);
            for(let py=22; py<=25; py++) map[py][25] = '='; // Zufahrtstraße
            
            for(let i=0; i<15; i++) { 
                let rx = 15 + Math.floor(this.rand()*20); let ry = 15 + Math.floor(this.rand()*20);
                if(map[ry][rx] === '.') this.placeHouseRuin(map, rx, ry);
            }
        }
        
        if(sx === this.locations.ghostTown.x && sy === this.locations.ghostTown.y) {
            // Geisterstadt-Platzierung (wird auf 25,21 gesetzt)
            this.placeGhostTown(map, width, height);
        }

        let sectorRNG = (sx * 17 + sy * 23 + this._seed) % 100;
        if(map[21][25] !== 'V' && map[21][25] !== 'C' && map[21][25] !== 'G' && sectorRNG < 15) { 
            let type = 'S';
            if(sectorRNG < 5) type = 'H'; else if(sectorRNG < 8) type = 'A'; else if(sectorRNG < 12) type = 'R';
            let dx = 10 + (sectorRNG * 3) % 30; let dy = 10 + (sectorRNG * 7) % 30;
            this.placePOI(map, dx, dy, type, 3);
            this.buildRoad(map, this.getRandomEdgePoint(width, height), {x:dx, y:dy});
        }

        const connections = this.sectorRoads[`${sx},${sy}`] || [];
        let gates = [];
        connections.forEach(dir => {
            let seed = 0; let gate = {x:25,y:25};
            if(dir === 'N') { seed = sx * 1000 + sy; gate = { x: Math.floor(this.seededRand(seed)*(width-4))+2, y: 0 }; }
            if(dir === 'S') { seed = sx * 1000 + (sy+1); gate = { x: Math.floor(this.seededRand(seed)*(width-4))+2, y: height-1 }; }
            if(dir === 'W') { seed = sx * 1000 + sy + 5000; gate = { x: 0, y: Math.floor(this.seededRand(seed)*(height-4))+2 }; }
            if(dir === 'E') { seed = (sx+1) * 1000 + sy + 5000; gate = { x: width-1, y: Math.floor(this.seededRand(seed)*(height-4))+2 }; }
            gates.push(gate);
        });

        if(gates.length > 0) {
            let center = {x: 25, y: 25};
            gates.forEach(g => this.buildRoad(map, g, center));
        }

        return map;
    },

    placeHouseRuin: function(map, x, y) {
        const w = 3 + Math.floor(this.rand() * 2); 
        const h = 3 + Math.floor(this.rand() * 2);
        if(x+w >= map[0].length || y+h >= map.length) return;
        for(let dy=0; dy<h; dy++) for(let dx=0; dx<w; dx++) {
            if(['~', '^', 'Y', 'V', 'C', 'G'].includes(map[y+dy][x+dx])) return; 
        }
        for(let dy=0; dy<h; dy++) {
            for(let dx=0; dx<w; dx++) {
                if(dy===0 || dy===h-1 || dx===0 || dx===w-1) {
                    if(this.rand() > 0.2) map[y+dy][x+dx] = '#'; 
                } else {
                    map[y+dy][x+dx] = '.'; 
                }
            }
        }
        if(this.rand() < 0.3) map[y+Math.floor(h/2)][x+Math.floor(w/2)] = 'X';
    },

    placeGhostTown: function(map, w, h) {
        this.clearArea(map, 25, 25, 18);
        for(let i=10; i<40; i++) { map[25][i] = '='; map[i][25] = '='; }
        const blocks = [{x: 12, y: 12}, {x: 30, y: 12}, {x: 12, y: 30}, {x: 30, y: 30}];
        blocks.forEach(b => {
            this.placeHouseRuin(map, b.x, b.y);
            if(this.rand() < 0.7) this.placeHouseRuin(map, b.x+5, b.y);
            if(this.rand() < 0.7) this.placeHouseRuin(map, b.x, b.y+5);
        });
        
        // Verschiebt die Ghost Town nach oben (auf Y: 21 statt 25)
        map[21][25] = 'G'; 
    },

    seededRand: function(seed) {
        let t = seed % 2147483647; if (t <= 0) t += 2147483646;
        t = (t * 16807) % 2147483647; return (t - 1) / 2147483646;
    },

    placePOI: function(map, cx, cy, type, radius) {
        const h = map.length; const w = map[0].length;
        for(let dy=-radius; dy<=radius; dy++) for(let dx=-radius; dx<=radius; dx++) {
            const ny = cy+dy, nx = cx+dx;
            if(ny>=0 && ny<h && nx>=0 && nx<w) {
                const t = map[ny][nx]; if(['^', 'Y', 't', '~', '#'].includes(t)) map[ny][nx] = '.';
            }
        }
        map[cy][cx] = type;
    },

    getRandomEdgePoint: function(w, h) {
        const side = Math.floor(this.rand() * 4);
        if(side === 0) return {x: Math.floor(this.rand()*(w-4))+2, y: 0}; 
        if(side === 1) return {x: Math.floor(this.rand()*(w-4))+2, y: h-1}; 
        if(side === 2) return {x: 0, y: Math.floor(this.rand()*(h-4))+2}; 
        return {x: w-1, y: Math.floor(this.rand()*(h-4))+2}; 
    },

    buildRoad: function(map, start, end) {
        let x = start.x, y = start.y;
        let steps = 0;
        
        const isWater = (tx, ty) => {
            if(tx<0||tx>=map[0].length||ty<0||ty>=map.length) return false;
            return map[ty][tx] === '~' || map[ty][tx] === '+';
        };

        while((x !== end.x || y !== end.y) && steps < 200) {
            steps++;
            let dx = end.x - x; 
            let dy = end.y - y;
            
            let moveX = Math.abs(dx) > Math.abs(dy);
            
            let nextX = x + (moveX ? (dx > 0 ? 1 : -1) : 0);
            let nextY = y + (!moveX ? (dy > 0 ? 1 : -1) : 0);
            
            if (isWater(nextX, nextY)) {
                let altX = x + (!moveX ? (dx > 0 ? 1 : -1) : 0);
                let altY = y + (moveX ? (dy > 0 ? 1 : -1) : 0);
                
                if (!isWater(altX, altY) && (moveX ? dy !== 0 : dx !== 0)) {
                    moveX = !moveX; 
                }
            }

            if (moveX) x += dx > 0 ? 1 : -1; else y += dy > 0 ? 1 : -1;
            
            if(x < 0 || x >= map[0].length || y < 0 || y >= map.length) continue;
            
            const setRoad = (tx, ty) => {
                if(tx<0||tx>=map[0].length||ty<0||ty>=map.length) return;
                const t = map[ty][tx];
                if(t === '~' || t === '+') map[ty][tx] = '+'; 
                else {
                    if(['^', 'Y', 't', '#'].includes(t)) map[ty][tx] = '='; else map[ty][tx] = '='; 
                    this.clearArea(map, tx, ty, 1);
                }
            };
            setRoad(x, y);
            if(x+1 < map[0].length && map[y][x+1] !== '~') setRoad(x+1, y); 
        }
    },

    clearArea: function(map, cx, cy, radius) {
        const h = map.length; const w = map[0].length;
        for(let dy=-radius; dy<=radius; dy++) for(let dx=-radius; dx<=radius; dx++) {
            const ny = cy+dy, nx = cx+dx;
            if(ny>=0 && ny<h && nx>=0 && nx<w) { if(['^', 'Y', 't', '#'].includes(map[ny][nx])) map[ny][nx] = '.'; }
        }
    },
    generateCityLayout: function(w, h) { return this._genBox(w,h,'='); },
    generateDungeonLayout: function(w, h) { return this._genBox(w,h,'#'); },
    _genBox: function(w, h, fill) {
        let map = Array(h).fill().map(() => Array(w).fill('.'));
        for(let y=0; y<h; y++) { map[y][0]=fill; map[y][w-1]=fill; }
        for(let x=0; x<w; x++) { map[0][x]=fill; map[h-1][x]=fill; }
        map[h-1][Math.floor(w/2)] = 'E'; if(fill==='#') map[Math.floor(h/2)][Math.floor(w/2)]='X';
        return {map, startX: Math.floor(w/2), startY: h-2};
    }
};
