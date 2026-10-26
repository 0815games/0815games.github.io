// [2026-02-16 22:35:00] game_render.js - Colors Pop Update

Object.assign(Game, {
    initCache: function() {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = this.MAP_W * this.TILE;
        this.cacheCanvas.height = this.MAP_H * this.TILE;
        this.cacheCtx = this.cacheCanvas.getContext('2d'); 
    },

    pseudoRand: function(x, y) {
        return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },

    renderStaticMap: function() { 
        if(!this.cacheCtx) this.initCache();
        const ctx = this.cacheCtx; 
        const map = this.state.currentMap;
        
        ctx.fillStyle = "#0d0d0d"; 
        ctx.fillRect(0, 0, this.cacheCanvas.width, this.cacheCanvas.height); 
        
        if(!map) return;

        for(let y=0; y<this.MAP_H; y++) {
            for(let x=0; x<this.MAP_W; x++) {
                const t = map[y][x];
                
                this.drawFloorDetail(ctx, x, y, t);

                if(t === '#') this.drawConnectedWall(ctx, x, y, map);
                else if(t === '^') this.drawMountain(ctx, x, y);
                else if(t === '=') this.drawRoad(ctx, x, y); 
                else if(t === '+') this.drawBridge(ctx, x, y); 
                else if(t === '~') {
                    ctx.fillStyle = "#0d47a1"; // Helleres Blau
                    ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE);
                }
            }
        }
    },

    drawFloorDetail: function(ctx, x, y, type) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);

        // Bodenfarben heller
        let color = "#1a1a1a"; 
        if(type === 't') color = "#1e2e1e"; // Wald ist jetzt sichtbar grünlich
        if(type === '^') color = "#2a2a2a"; 
        if(type === '~') return; 

        ctx.fillStyle = color;
        ctx.fillRect(px, py, ts, ts);

        // Steine
        if(type === '.') {
            if(rand > 0.6) {
                ctx.fillStyle = "#333"; 
                ctx.fillRect(px + (ts*rand), py + (ts*(1-rand)), 2, 2);
            }
        }
    },

    drawRoad: function(ctx, x, y) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        ctx.fillStyle = "#444"; // Heller
        ctx.fillRect(px, py, ts, ts);
        if(this.pseudoRand(x,y) > 0.5) {
            ctx.fillStyle = "#222";
            ctx.fillRect(px+4, py+4, ts-8, ts-8);
        }
    },

    drawBridge: function(ctx, x, y) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;

        ctx.fillStyle = "#0d47a1"; 
        ctx.fillRect(px, py, ts, ts);
        
        ctx.fillStyle = "#795548"; // Helleres Holz
        ctx.fillRect(px + 2, py, ts - 4, ts); 

        ctx.fillStyle = "#3e2723"; 
        for(let i=0; i<ts; i+=4) {
            ctx.fillRect(px, py+i, ts, 1);
        }
        
        ctx.fillStyle = "#a1887f";
        ctx.fillRect(px, py, 2, ts); 
        ctx.fillRect(px + ts - 2, py, 2, ts); 
    },

    drawConnectedWall: function(ctx, x, y, map) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);
        const n = (y > 0) && map[y-1][x] === '#';

        // Hellerer Beton
        const shade = Math.floor(80 + rand * 30); 
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`; 
        ctx.fillRect(px, py, ts, ts);

        ctx.fillStyle = "#333"; 
        ctx.fillRect(px, py + ts - 8, ts, 8);
        
        ctx.fillStyle = "#777"; 
        if(!n) ctx.fillRect(px, py, ts, 4);

        // Details
        if(rand > 0.4) {
            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.moveTo(px + ts*rand, py + ts*0.2);
            ctx.lineTo(px + ts*rand + 3, py + ts*0.6);
            ctx.stroke();
        }
    },

    drawMountain: function(ctx, x, y) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);

        ctx.fillStyle = "#333"; // Heller
        ctx.beginPath();
        ctx.moveTo(px, py + ts);
        ctx.lineTo(px + ts/2, py + ts * 0.1); 
        ctx.lineTo(px + ts, py + ts);
        ctx.fill();

        ctx.fillStyle = "#444";
        ctx.beginPath();
        ctx.moveTo(px + ts*0.3, py + ts);
        ctx.lineTo(px + ts*0.5, py + ts*0.4);
        ctx.lineTo(px + ts*0.7, py + ts);
        ctx.fill();

        ctx.fillStyle = (rand > 0.7) ? "#eee" : "#777"; 
        ctx.beginPath();
        ctx.moveTo(px + ts/2, py + ts * 0.1);
        ctx.lineTo(px + ts * 0.35, py + ts * 0.4);
        ctx.lineTo(px + ts * 0.65, py + ts * 0.4);
        ctx.fill();
    },

    drawTree: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);
        const sway = Math.sin(time / 1000 + x) * 2;

        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(px + ts/2, py + ts - 5, ts/3, ts/6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5d4037"; // Hellerer Stamm
        ctx.fillRect(px + ts/2 - 3, py + ts/2, 6, ts/2);

        // Deutlich helleres Grün
        const green = (rand > 0.5) ? "#388e3c" : "#2e7d32"; 
        ctx.fillStyle = green;
        ctx.beginPath();
        ctx.arc(px + ts/2 + sway, py + ts/2, ts/2.5, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = (rand > 0.5) ? "#66bb6a" : "#4caf50";
        ctx.beginPath();
        ctx.arc(px + ts/2 + (sway*1.5), py + ts/3, ts/3, 0, Math.PI*2);
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
        ctx.lineTo(px + ts/2, py + offset + 2);
        ctx.lineTo(px + ts, py + offset);
        ctx.stroke();
    },

    drawGrass: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts;
        const py = y * ts;
        const rand = this.pseudoRand(x, y);

        if(rand < 0.6) return;

        const sway = Math.sin(time / 500 + x * y) * 3;

        ctx.strokeStyle = (rand > 0.8) ? "#7cb342" : "#558b2f"; // Helleres Gras
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(px + 10, py + ts);
        ctx.lineTo(px + 10 + sway, py + ts - 8);
        ctx.stroke();
    },

    checkLineOfSight: function(x0, y0, x1, y1) {
        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;
        let dist = 0;

        while(true) {
            if(x0 === x1 && y0 === y1) return true; 
            if(dist > 0) { 
                if(x0 >= 0 && x0 < this.MAP_W && y0 >= 0 && y0 < this.MAP_H) {
                    const t = this.state.currentMap[y0][x0];
                    if(['#', '^', 't'].includes(t)) return false; 
                }
            }
            let e2 = 2 * err;
            if(e2 > -dy) { err -= dy; x0 += sx; }
            if(e2 < dx) { err += dx; y0 += sy; }
            dist++;
        }
    },

    draw: function() { 
        if(!this.ctx || !this.cacheCanvas) return; 
        if(!this.state.currentMap) return;

        const ctx = this.ctx; 
        const cvs = ctx.canvas; 
        const time = Date.now();
        
        if (cvs.clientWidth === 0) return;
        const viewW = cvs.clientWidth;
        const viewH = cvs.clientHeight;
        
        let targetCamX = (this.state.player.x * this.TILE) - (viewW / 2); 
        let targetCamY = (this.state.player.y * this.TILE) - (viewH / 2); 
        const maxCamX = (this.MAP_W * this.TILE) - viewW; 
        const maxCamY = (this.MAP_H * this.TILE) - viewH; 
        
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

        // RENDER LOOP
        const px = this.state.player.x;
        const py = this.state.player.y;
        const viewDist = 10; 

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    
                    const dist = Math.sqrt((x-px)**2 + (y-py)**2);
                    if(dist > viewDist) continue;
                    if(!this.checkLineOfSight(px, py, x, y)) continue;

                    // A. Statik
                    ctx.drawImage(
                        this.cacheCanvas, 
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE,
                        x*this.TILE, y*this.TILE, this.TILE, this.TILE
                    );

                    const t = this.state.currentMap[y][x]; 
                    
                    // B. Dynamik
                    if(t === '~') this.drawWater(ctx, x, y, time);
                    else if(t === 't') this.drawTree(ctx, x, y, time);
                    else if(t === '.') this.drawGrass(ctx, x, y, time);
                    else if(t === 'M') this.drawMonster(ctx, x, y, time);
                    else if(t === 'W') this.drawWanderer(ctx, x, y, time);

                    // C. Objekte
                    if(['X', 'V', 'R', 'S'].includes(t)) {
                        this.drawTile(ctx, x, y, t);
                    }
                    if(t === '?') this.drawTile(ctx, x, y, t);
                    
                    // D. Schatten
                    const opacity = Math.max(0, (dist - 4) / (viewDist - 4));
                    if(opacity > 0) {
                        ctx.fillStyle = `rgba(0,0,0,${opacity})`;
                        ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE);
                    }
                } 
            } 
        } 
        
        this.drawPlayer(ctx);
        this.drawOtherPlayers(ctx);

        ctx.restore(); 

        ctx.fillStyle = "rgba(0, 255, 0, 0.02)";
        for(let i=0; i<viewH; i+=4) {
            ctx.fillRect(0, i, viewW, 1);
        }
    },
    
    drawPlayer: function(ctx) {
        const px = this.state.player.x * this.TILE + this.TILE/2; 
        const py = this.state.player.y * this.TILE + this.TILE/2; 
        
        ctx.save();
        ctx.translate(px, py); 
        ctx.rotate(this.state.player.rot - Math.PI / 2); 
        
        const gradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 140);
        gradient.addColorStop(0, "rgba(255, 255, 200, 0.25)");
        gradient.addColorStop(1, "rgba(255, 255, 200, 0)");
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 140, -Math.PI/5, Math.PI/5);
        ctx.fillStyle = gradient;
        ctx.fill();

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
        if(typeof Network === 'undefined' || !Network.otherPlayers) return;
        for(let pid in Network.otherPlayers) { 
            const p = Network.otherPlayers[pid]; 
            if(p.sector && (p.sector.x !== this.state.sector.x || p.sector.y !== this.state.sector.y)) continue; 
            
            const ox = p.x * this.TILE + this.TILE/2; 
            const oy = p.y * this.TILE + this.TILE/2; 
            
            ctx.fillStyle = "#00ffff"; 
            ctx.beginPath(); 
            ctx.arc(ox, oy, 6, 0, Math.PI*2); 
            ctx.fill(); 
        } 
    },

    drawMonster: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts + ts/2;
        const py = y * ts + ts/2;
        const scale = 1 + Math.sin(time / 200) * 0.1;

        ctx.save();
        ctx.translate(px, py);
        ctx.scale(scale, scale);

        ctx.fillStyle = "#d32f2f";
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI*2);
        ctx.fill();

        ctx.strokeStyle = "#ff5252";
        ctx.lineWidth = 2;
        for(let i=0; i<8; i++) {
            ctx.beginPath();
            ctx.moveTo(0,0);
            const ang = (i / 8) * Math.PI * 2;
            ctx.lineTo(Math.cos(ang)*12, Math.sin(ang)*12);
            ctx.stroke();
        }

        ctx.fillStyle = "#ffeb3b";
        ctx.fillRect(-4, -2, 3, 3);
        ctx.fillRect(2, -2, 3, 3);

        ctx.restore();
    },

    drawWanderer: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts + ts/2;
        const py = y * ts + ts/2;
        const bounce = Math.abs(Math.sin(time / 300)) * 3;

        ctx.save();
        ctx.translate(px, py - bounce);

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
        const cx = x * ts + ts/2; 
        const cy = y * ts + ts/2;
        
        const drawIcon = (char, color, size=20) => {
            ctx.font = `bold ${size}px monospace`;
            ctx.fillStyle = color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = color;
            ctx.shadowBlur = 5;
            ctx.fillText(char, cx, cy);
            ctx.shadowBlur = 0;
        };

        switch(type) { 
            case 'V': drawIcon("⚙️", "#ffff00", 24); break; 
            case 'R': drawIcon("💰", "#ff3333", 22); break;
            case 'X': 
                ctx.fillStyle = "#8B4513"; 
                ctx.fillRect(cx - 8, cy - 6, 16, 12);
                ctx.strokeStyle = "#ffd700"; 
                ctx.strokeRect(cx - 8, cy - 6, 16, 12);
                break;
            case 'S': drawIcon("🏪", "#00ff00", 22); break;
            case 'H': drawIcon("⛰️", "#888", 22); break;
            case 'E': drawIcon("EXIT", "#00ffff", 10); break;
            case 'P': drawIcon("✚", "#ff0000", 18); break; 
            case '?': drawIcon("?", "#ff00ff", 20); break; 
        } 
    }
});
