// [2026-02-22 00:15:00] game_render.js - Flashlight & Day Cycle Overhaul

Object.assign(Game, {
    particles: [],
    weatherParticles: [], 

    initCache: function() {
        this.cacheCanvas = document.createElement('canvas');
        this.cacheCanvas.width = this.MAP_W * this.TILE;
        this.cacheCanvas.height = this.MAP_H * this.TILE;
        this.cacheCtx = this.cacheCanvas.getContext('2d'); 
    },

    pseudoRand: function(x, y) {
        return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    },

    spawnParticle: function(x, y, type, count = 5) {
        const ts = this.TILE; 
        const px = x * ts + ts/2; 
        const py = y * ts + ts/2;
        for(let i=0; i<count; i++) {
            this.particles.push({
                x: px + (Math.random()*10-5), 
                y: py + (Math.random()*10-5),
                vx: (Math.random()-0.5)*4, 
                vy: (Math.random()-0.5)*4,
                life: 1.0, 
                type: type,
                color: type==='blood'?'#d32f2f':(type==='dust'?'#a1887f':'#fff'),
                size: Math.random()*3+1, 
                decay: 0.05
            });
        }
    },

    updateParticles: function() {
        for(let i=this.particles.length-1; i>=0; i--) {
            let p = this.particles[i]; 
            p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
            if(p.life<=0) this.particles.splice(i,1);
        }
    },

    drawParticles: function(ctx) {
        for(let p of this.particles) { 
            ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); 
        }
        ctx.globalAlpha = 1.0;
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
                else if(t === 'Y') this.drawHighMountain(ctx, x, y); 
                else if(t === '=') this.drawRoad(ctx, x, y); 
                else if(t === '+') this.drawBridge(ctx, x, y); 
                else if(t === '~') { 
                    ctx.fillStyle = "#0d47a1"; 
                    ctx.fillRect(x*this.TILE, y*this.TILE, this.TILE, this.TILE); 
                }
            }
        }
    },

    drawFloorDetail: function(ctx, x, y, type) {
        const ts = this.TILE; 
        const px = x * ts; const py = y * ts;
        const rand = this.pseudoRand(x, y);

        let color = "#1a1a1a"; 
        
        if(type === '"') color = "#1b331b"; 
        if(type === '_') color = "#3b3626"; 
        if(type === ';') color = "#241f1a"; 
        if(type === ',') color = "#26211d"; 
        if(type === 't') color = "#1b331b"; 
        if(type === '^' || type === 'Y') color = "#222"; 
        if(type === '~') return; 

        ctx.fillStyle = color;
        ctx.fillRect(px, py, ts, ts);

        if(type === '"' && rand > 0.6) { ctx.fillStyle = "#2e4e2e"; ctx.fillRect(px+rand*ts, py+(1-rand)*ts, 2, 2); }
        if(type === '_' && rand > 0.8) { ctx.fillStyle = "#5e5a4a"; ctx.fillRect(px+rand*ts, py+(1-rand)*ts, 2, 2); }
        
        if(type === ',') {
            ctx.fillStyle = "#666"; 
            if (rand > 0.5) {
                ctx.fillRect(px + ts*0.2, py + ts*0.3, ts*0.4, ts*0.3); 
                ctx.fillStyle = "#888"; 
                ctx.fillRect(px + ts*0.25, py + ts*0.35, ts*0.1, ts*0.1);
            } else {
                ctx.fillRect(px + ts*0.1, py + ts*0.1, ts*0.2, ts*0.2); 
                ctx.fillRect(px + ts*0.6, py + ts*0.6, ts*0.25, ts*0.25); 
            }
        }
        if(type === '.' && rand > 0.8) { ctx.fillStyle = "#333"; ctx.fillRect(px+rand*ts, py+(1-rand)*ts, 2, 2); }
    },

    drawRoad: function(ctx, x, y) {
        const ts = this.TILE; const px = x * ts; const py = y * ts;
        ctx.fillStyle = "#444"; ctx.fillRect(px, py, ts, ts);
        if(this.pseudoRand(x,y) > 0.5) { ctx.fillStyle = "#222"; ctx.fillRect(px+4, py+4, ts-8, ts-8); }
    },

    drawBridge: function(ctx, x, y) {
        const ts = this.TILE; const px = x * ts; const py = y * ts;
        ctx.fillStyle = "#0d47a1"; ctx.fillRect(px, py, ts, ts); 
        ctx.fillStyle = "#5d4037"; ctx.fillRect(px + 4, py, ts - 8, ts); 
        ctx.fillStyle = "#3e2723"; 
        for(let i=0; i<ts; i+=5) ctx.fillRect(px+4, py+i, ts-8, 1);
        ctx.fillStyle = "#8d6e63"; 
        ctx.fillRect(px+2, py, 2, ts); ctx.fillRect(px+ts-4, py, 2, ts); 
    },

    drawConnectedWall: function(ctx, x, y, map) {
        const ts = this.TILE; const px = x * ts; const py = y * ts;
        const rand = this.pseudoRand(x, y);
        const n = (y > 0) && map[y-1][x] === '#';
        const shade = Math.floor(70 + rand * 30); 
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`; ctx.fillRect(px, py, ts, ts);
        ctx.fillStyle = "#333"; ctx.fillRect(px, py + ts - 8, ts, 8);
        ctx.fillStyle = "#666"; if(!n) ctx.fillRect(px, py, ts, 4);
        if(rand > 0.4) { 
            ctx.fillStyle = "#111"; ctx.beginPath(); ctx.moveTo(px+ts*rand, py+ts*0.2); ctx.lineTo(px+ts*rand+3, py+ts*0.6); ctx.stroke(); 
        }
    },

    drawHighMountain: function(ctx, x, y) {
        const ts = this.TILE; const px = x * ts; const py = y * ts;
        ctx.fillStyle = "#2c2c2c"; ctx.beginPath(); ctx.moveTo(px, py+ts); ctx.lineTo(px+ts/2, py-ts*0.2); ctx.lineTo(px+ts, py+ts); ctx.fill();
        ctx.fillStyle = "#444"; ctx.beginPath(); ctx.moveTo(px+ts*0.2, py+ts); ctx.lineTo(px+ts/2, py-ts*0.2); ctx.lineTo(px+ts/2, py+ts); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(px+ts*0.4, py+ts*0.2); ctx.lineTo(px+ts/2, py-ts*0.2); ctx.lineTo(px+ts*0.6, py+ts*0.2); ctx.lineTo(px+ts/2, py+ts*0.3); ctx.fill();
    },

    drawMountain: function(ctx, x, y) {
        const ts = this.TILE; const px = x * ts; const py = y * ts;
        const rand = this.pseudoRand(x, y);
        ctx.fillStyle = "#333"; ctx.beginPath(); ctx.moveTo(px, py+ts); ctx.lineTo(px+ts/2, py+ts*0.1); ctx.lineTo(px+ts, py+ts); ctx.fill();
        ctx.fillStyle = "#444"; ctx.beginPath(); ctx.moveTo(px+ts*0.3, py+ts); ctx.lineTo(px+ts*0.5, py+ts*0.4); ctx.lineTo(px+ts*0.7, py+ts); ctx.fill();
        ctx.fillStyle = (rand > 0.7) ? "#666" : "#555"; ctx.beginPath(); ctx.moveTo(px+ts/2, py+ts*0.1); ctx.lineTo(px+ts*0.35, py+ts*0.4); ctx.lineTo(px+ts*0.65, py+ts*0.4); ctx.fill();
    },

    drawTree: function(ctx, x, y, time) {
        const ts = this.TILE; const px = x * ts; const py = y * ts;
        const rand = this.pseudoRand(x, y);
        const sway = Math.sin(time / 1000 + x) * 2;
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(px+ts/2, py+ts-5, ts/3, ts/6, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#5d4037"; ctx.fillRect(px+ts/2-3, py+ts/2, 6, ts/2);
        const green = (rand > 0.5) ? "#388e3c" : "#2e7d32"; 
        ctx.fillStyle = green; ctx.beginPath(); ctx.arc(px+ts/2+sway, py+ts/2, ts/2.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = (rand > 0.5) ? "#66bb6a" : "#4caf50"; ctx.beginPath(); ctx.arc(px+ts/2+(sway*1.5), py+ts/3, ts/3, 0, Math.PI*2); ctx.fill();
    },

    drawWater: function(ctx, x, y, time) {
        const ts = this.TILE; const px = x * ts; const py = y * ts;
        ctx.fillStyle = "#0d47a1"; ctx.fillRect(px, py, ts, ts);
        ctx.strokeStyle = "rgba(100, 220, 255, 0.4)"; ctx.lineWidth = 1;
        const offset = (time / 100 + x * 10) % ts;
        ctx.beginPath(); ctx.moveTo(px, py+offset); ctx.lineTo(px+ts/2, py+offset+2); ctx.lineTo(px+ts, py+offset); ctx.stroke();
    },

    drawGrass: function(ctx, x, y, time) {
        const ts = this.TILE; const px = x * ts; const py = y * ts;
        const rand = this.pseudoRand(x, y);
        if(rand < 0.6) return;
        const sway = Math.sin(time / 500 + x * y) * 3;
        ctx.strokeStyle = (rand > 0.8) ? "#7cb342" : "#558b2f"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px+10, py+ts); ctx.lineTo(px+10+sway, py+ts-8); ctx.stroke();
    },

    drawCity: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts + ts / 2;
        const py = y * ts + ts / 2;

        ctx.save();
        ctx.translate(px, py);

        ctx.fillStyle = "#1a1a1a";
        ctx.beginPath(); ctx.ellipse(0, 0, ts*2.5, ts*2, 0, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "#2d2d2d"; ctx.fillRect(-ts*1.8, -ts*1.5, ts*0.8, ts*2);
        ctx.fillStyle = "#444"; ctx.fillRect(-ts*1.9, -ts*1.5, ts*1.0, ts*0.3); 
        ctx.fillStyle = "#ffeb3b"; ctx.fillRect(-ts*1.5, -ts*1.2, ts*0.2, ts*0.2); 

        ctx.fillStyle = "#5d4037"; ctx.fillRect(ts*0.8, -ts*0.8, ts*1.5, ts*1.2);
        ctx.fillStyle = "#3e2723"; ctx.fillRect(ts*0.7, -ts*0.9, ts*1.7, ts*0.3); 
        ctx.fillStyle = "#000"; ctx.fillRect(ts*1.2, -ts*0.2, ts*0.4, ts*0.6); 

        const glow = Math.sin(time/200)*0.3 + 0.5;
        ctx.fillStyle = "#1b5e20"; ctx.fillRect(ts*1.5, ts*0.5, ts*0.4, ts*0.6);
        ctx.fillStyle = `rgba(57, 255, 20, ${glow})`;
        ctx.beginPath(); ctx.arc(ts*1.7, ts*0.5, ts*0.3, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "#3e2723"; 
        ctx.fillRect(-ts*0.8, -ts*1.2, ts*0.4, ts*1.5); 
        ctx.fillRect(ts*0.4, -ts*1.2, ts*0.4, ts*1.5);  
        
        ctx.fillStyle = "#2d1a11";
        ctx.fillRect(-ts*1.0, -ts*1.0, ts*2.0, ts*0.5); 

        const flicker = Math.sin(time/150)*0.2 + 0.8;
        ctx.fillStyle = `rgba(0, 255, 255, ${flicker})`;
        ctx.shadowBlur = 10; ctx.shadowColor = "#0ff";
        ctx.font = `bold ${ts*0.25}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("RUSTY SPRINGS", 0, -ts*0.75);
        ctx.shadowBlur = 0;

        ctx.restore();
    },

    drawGhostTown: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts + ts / 2;
        const py = y * ts + ts / 2;

        ctx.save();
        ctx.translate(px, py);

        ctx.fillStyle = "#3e3a35";
        ctx.beginPath(); ctx.ellipse(0, 0, ts*2.8, ts*2.2, 0, 0, Math.PI*2); ctx.fill();

        ctx.save(); 
        ctx.translate(-ts*1.8, -ts*1.2);
        ctx.strokeStyle = "#2a1e18"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-10, 25); ctx.lineTo(0, -25); ctx.lineTo(10, 25); ctx.stroke();
        ctx.translate(0, -25);
        ctx.rotate(time / 1000); 
        ctx.fillStyle = "#1a120e";
        ctx.fillRect(-2, -20, 4, 40);
        ctx.fillRect(-20, -2, 40, 4);
        ctx.restore();

        ctx.save(); 
        ctx.translate(ts*1.5, -ts*0.8);
        ctx.fillStyle = "#2d1f18"; ctx.fillRect(-ts*0.8, -ts*0.8, ts*1.6, ts*1.2);
        ctx.fillStyle = "#150d09";
        ctx.beginPath(); ctx.moveTo(-ts, -ts*0.8); ctx.lineTo(-ts*0.2, -ts*1.5); ctx.lineTo(ts*0.8, -ts*0.6); ctx.fill();
        ctx.fillStyle = "#000"; ctx.fillRect(-ts*0.4, -ts*0.2, ts*0.4, ts*0.6); 
        ctx.restore();

        ctx.fillStyle = "#2a1e18";
        ctx.fillRect(ts*1.2, ts*0.8, 3, 12);
        ctx.fillRect(ts*1.0, ts*1.0, 7, 3); 
        ctx.fillRect(ts*1.8, ts*1.2, 3, 10);
        ctx.fillRect(ts*1.6, ts*1.4, 7, 3); 

        ctx.fillStyle = "#2a1e18";
        ctx.fillRect(-ts*0.9, -ts*0.8, ts*1.8, ts*1.2);
        ctx.fillStyle = "#1a120e";
        ctx.beginPath(); ctx.moveTo(-ts*1.1, -ts*0.8); ctx.lineTo(0, -ts*1.4); ctx.lineTo(ts*1.1, -ts*0.8); ctx.fill();

        ctx.fillStyle = "#000";
        ctx.fillRect(-ts*0.6, -ts*0.2, ts*0.3, ts*0.4); 
        ctx.fillRect(ts*0.3, -ts*0.2, ts*0.3, ts*0.4);  
        ctx.fillRect(-ts*0.25, ts*0.1, ts*0.5, ts*0.3); 

        ctx.save();
        ctx.translate(0, -ts*0.6);
        ctx.rotate(0.15);
        ctx.fillStyle = "#111";
        ctx.fillRect(-ts*0.7, -ts*0.2, ts*1.4, ts*0.4);
        ctx.fillStyle = "#555";
        ctx.font = `bold ${ts*0.25}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("HOPELESS", 0, 0);
        ctx.restore();

        const tX = ((time / 20) % (ts * 8)) - ts * 4;
        const bounce = Math.abs(Math.sin(time / 150)) * 10;
        ctx.save();
        ctx.translate(tX, ts*0.8 - bounce);
        ctx.rotate(time / 80);
        ctx.strokeStyle = "#8b7355"; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for(let i=0; i<4; i++) { ctx.rotate(Math.PI/2); ctx.ellipse(0,0, ts*0.25, ts*0.18, 0,0, Math.PI*2); ctx.stroke(); }
        ctx.restore();

        ctx.restore();
    },

    drawVault: function(ctx, x, y, time) {
        const ts = this.TILE;
        const px = x * ts + ts / 2;
        const py = y * ts + ts / 2;

        ctx.save();
        ctx.translate(px, py);

        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(0, 0, ts * 0.95, 0, Math.PI*2);
        ctx.fill();
        
        ctx.lineWidth = 3;
        for(let i=0; i<12; i++) {
            ctx.strokeStyle = (i%2 === 0) ? "#eab308" : "#000";
            ctx.beginPath();
            ctx.arc(0, 0, ts * 0.85, (i*Math.PI)/6, ((i+1)*Math.PI)/6);
            ctx.stroke();
        }

        const rot = Math.sin(time / 2000) * 0.5; 
        ctx.rotate(rot);

        ctx.fillStyle = "#4a5568";
        ctx.beginPath();
        ctx.arc(0, 0, ts * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#4a5568";
        for(let i=0; i<8; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 4);
            ctx.fillRect(-ts*0.15, -ts*0.85, ts*0.3, ts*0.2);
            ctx.restore();
        }

        ctx.fillStyle = "#2d3748";
        ctx.beginPath();
        ctx.arc(0, 0, ts * 0.5, 0, Math.PI * 2);
        ctx.fill();

        const pulse = (Math.sin(time / 300) + 1) / 2; 
        ctx.shadowBlur = 10 + pulse * 15;
        ctx.shadowColor = "#eab308";
        ctx.fillStyle = "#facc15";
        ctx.font = `bold ${ts*0.35}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("101", 0, 0);

        ctx.restore();
    },

    drawMarket: function(ctx, x, y, time) {
        const ts = this.TILE; const px = x * ts + ts/2; const py = y * ts + ts/2;
        ctx.save(); ctx.translate(px, py);
        ctx.fillStyle = "#3b3b3b"; ctx.fillRect(-ts*0.9, -ts*0.8, ts*1.8, ts*1.4);
        ctx.fillStyle = "#222"; ctx.fillRect(-ts*0.9, -ts*0.8, ts*1.8, ts*0.2); 
        ctx.fillStyle = "#0a0a0a"; 
        ctx.fillRect(-ts*0.7, -ts*0.2, ts*0.5, ts*0.6);
        ctx.fillRect(ts*0.2, -ts*0.2, ts*0.5, ts*0.6);
        ctx.fillStyle = "#111"; ctx.fillRect(-ts*0.8, -ts*0.6, ts*1.6, ts*0.3);
        const flicker = Math.sin(time/120) > 0 ? "#10b981" : "#064e3b";
        ctx.fillStyle = flicker;
        ctx.font = `bold ${ts*0.2}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("SUPER DUPER", 0, -ts*0.45);
        ctx.restore();
    },

    drawCave: function(ctx, x, y, time) {
        const ts = this.TILE; const px = x * ts + ts/2; const py = y * ts + ts/2;
        ctx.save(); ctx.translate(px, py);
        ctx.fillStyle = "#4a4a4a"; ctx.beginPath(); ctx.arc(0, ts*0.4, ts, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#333"; ctx.beginPath(); ctx.arc(ts*0.2, ts*0.4, ts*0.8, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(0, ts*0.4, ts*0.4, Math.PI, 0); ctx.fill();
        const glow = Math.sin(time/300)*0.5 + 0.5;
        ctx.fillStyle = `rgba(0, 255, 255, ${glow})`;
        ctx.beginPath(); ctx.arc(-ts*0.6, 0, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ts*0.5, ts*0.2, 2, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    },

    drawMilitary: function(ctx, x, y, time) {
        const ts = this.TILE; const px = x * ts + ts/2; const py = y * ts + ts/2;
        ctx.save(); ctx.translate(px, py);
        ctx.fillStyle = "#4b5320"; ctx.fillRect(-ts*0.9, -ts*0.8, ts*1.8, ts*1.4); 
        ctx.fillStyle = "#333"; ctx.fillRect(-ts*0.9, -ts*0.8, ts*1.8, ts*0.3); 
        ctx.fillStyle = "#1a1a1a"; ctx.fillRect(-ts*0.3, -ts*0.1, ts*0.6, ts*0.7);
        ctx.fillStyle = "#555"; ctx.fillRect(-ts*0.25, 0, ts*0.2, ts*0.6); 
        ctx.fillRect(ts*0.05, 0, ts*0.2, ts*0.6); 
        ctx.save();
        ctx.translate(0, -ts*0.9);
        ctx.rotate(time/200);
        ctx.fillStyle = "rgba(255, 0, 0, 0.6)";
        ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0, 0, ts, 0, Math.PI/4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0, 0, ts, Math.PI, Math.PI + Math.PI/4); ctx.fill();
        ctx.fillStyle = "#f00"; ctx.beginPath(); ctx.arc(0,0, 4, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        ctx.restore();
    },

    drawRaider: function(ctx, x, y, time) {
        const ts = this.TILE; const px = x * ts + ts/2; const py = y * ts + ts/2;
        ctx.save(); ctx.translate(px, py);
        ctx.fillStyle = "#3e2723"; ctx.fillRect(-ts*0.8, -ts*0.6, ts*1.6, ts);
        ctx.fillStyle = "#5d4037"; 
        ctx.beginPath(); ctx.moveTo(-ts*0.8, -ts*0.6); ctx.lineTo(-ts*0.5, -ts); ctx.lineTo(-ts*0.2, -ts*0.6); ctx.fill();
        ctx.strokeStyle = "#4e342e"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-ts*0.9, ts*0.4); ctx.lineTo(-ts*1.2, -ts*0.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ts*0.9, ts*0.4); ctx.lineTo(ts*1.2, -ts*0.2); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -ts*0.2, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#111"; ctx.fillRect(ts*0.4, 0, ts*0.3, ts*0.4);
        const fireColors = ["#ef4444", "#f59e0b", "#eab308"];
        ctx.fillStyle = fireColors[Math.floor((time/100) % 3)];
        ctx.beginPath(); ctx.arc(ts*0.55, -2 + Math.sin(time/50)*2, 4, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    },

    checkLineOfSight: function(x0, y0, x1, y1) {
        let dx = Math.abs(x1-x0); let dy = Math.abs(y1-y0);
        let sx = (x0<x1) ? 1 : -1; let sy = (y0<y1) ? 1 : -1;
        let err = dx-dy; let dist = 0;
        while(true) {
            if(x0===x1 && y0===y1) return true; 
            if(dist > 0) { 
                if(x0>=0 && x0<this.MAP_W && y0>=0 && y0<this.MAP_H) {
                    const t = this.state.currentMap[y0][x0];
                    if(['#', '^', 'Y', 't'].includes(t)) return false; 
                }
            }
            let e2 = 2*err; if(e2>-dy) { err-=dy; x0+=sx; } if(e2<dx) { err+=dx; y0+=sy; } dist++;
        }
    },

    draw: function() { 
        if(!this.ctx || !this.cacheCanvas) return; 
        if(!this.state.currentMap) return;
        
        const ctx = this.ctx; const cvs = ctx.canvas; const time = Date.now();
        if (cvs.clientWidth === 0) return;
        const viewW = cvs.clientWidth; const viewH = cvs.clientHeight;
        
        let targetCamX = (this.state.player.x * this.TILE) - (viewW / 2); 
        let targetCamY = (this.state.player.y * this.TILE) - (viewH / 2); 
        const maxCamX = (this.MAP_W * this.TILE) - viewW; 
        const maxCamY = (this.MAP_H * this.TILE) - viewH; 
        
        const lerp = 0.1;
        this.camera.x += (Math.max(0, Math.min(targetCamX, maxCamX)) - this.camera.x) * lerp;
        this.camera.y += (Math.max(0, Math.min(targetCamY, maxCamY)) - this.camera.y) * lerp;
        
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, viewW, viewH); 
        ctx.save(); ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y)); 
        
        const startX = Math.floor(this.camera.x / this.TILE); 
        const startY = Math.floor(this.camera.y / this.TILE); 
        const endX = startX + Math.ceil(viewW / this.TILE) + 1; 
        const endY = startY + Math.ceil(viewH / this.TILE) + 1; 

        const visibleTiles = [];

        for(let y=startY; y<endY; y++) { 
            for(let x=startX; x<endX; x++) { 
                if(y>=0 && y<this.MAP_H && x>=0 && x<this.MAP_W) { 
                    const dist = Math.sqrt((x-this.state.player.x)**2 + (y-this.state.player.y)**2);
                    if(dist > 10) continue;
                    if(!this.checkLineOfSight(this.state.player.x, this.state.player.y, x, y)) continue;

                    visibleTiles.push({x, y, dist, t: this.state.currentMap[y][x]});

                    ctx.drawImage(this.cacheCanvas, x*this.TILE, y*this.TILE, this.TILE, this.TILE, x*this.TILE, y*this.TILE, this.TILE, this.TILE);
                    
                    const t = this.state.currentMap[y][x]; 
                    if(t === '~') this.drawWater(ctx, x, y, time);
                    else if(t === 't') this.drawTree(ctx, x, y, time);
                    else if(t === '"') this.drawGrass(ctx, x, y, time);
                    else if(t === '.') this.drawGrass(ctx, x, y, time);
                } 
            } 
        } 

        visibleTiles.forEach(tile => {
            if(tile.t === 'V') this.drawVault(ctx, tile.x, tile.y, time);
            if(tile.t === 'C') this.drawCity(ctx, tile.x, tile.y, time);
            if(tile.t === 'G') this.drawGhostTown(ctx, tile.x, tile.y, time);
            if(tile.t === 'S') this.drawMarket(ctx, tile.x, tile.y, time);
            if(tile.t === 'H') this.drawCave(ctx, tile.x, tile.y, time);
            if(tile.t === 'A') this.drawMilitary(ctx, tile.x, tile.y, time);
            if(tile.t === 'R') this.drawRaider(ctx, tile.x, tile.y, time);
            if(['X', '?'].includes(tile.t)) this.drawTile(ctx, tile.x, tile.y, tile.t);
        });

        visibleTiles.forEach(tile => {
            if(tile.t === 'M') this.drawMonster(ctx, tile.x, tile.y, time); 
            if(tile.t === 'W') this.drawWanderer(ctx, tile.x, tile.y, time);
        });

        this.drawPlayer(ctx); 
        this.drawOtherPlayers(ctx);

        this.updateParticles(); 
        this.drawParticles(ctx);

        visibleTiles.forEach(tile => {
            const opacity = Math.max(0, (tile.dist - 4) / (10 - 4));
            if(opacity > 0) { 
                ctx.fillStyle = `rgba(0,0,0,${opacity})`; 
                ctx.fillRect(tile.x*this.TILE, tile.y*this.TILE, this.TILE, this.TILE); 
            }
        });

        // WETTER SYSTEM
        if (!this.weatherParticles) this.weatherParticles = [];
        let wType = 'ash'; 
        const zn = this.state.zone || '';
        if (zn.includes('Glühende')) wType = 'radstorm';
        else if (zn.includes('Sümpfe')) wType = 'rain';

        const spawnRate = wType === 'radstorm' ? 3 : (wType === 'rain' ? 4 : 1);
        for(let i=0; i<spawnRate; i++) {
            if(Math.random() < 0.6) {
                this.weatherParticles.push({
                    x: this.camera.x + Math.random() * viewW,
                    y: this.camera.y - 20,
                    vx: wType === 'radstorm' ? (Math.random() * 4 + 4) : (Math.random() - 0.5), 
                    vy: wType === 'rain' ? (Math.random() * 5 + 10) : (wType === 'radstorm' ? (Math.random()*2+1) : (Math.random()*1.5 + 0.5)),
                    size: wType === 'rain' ? 1.5 : (wType === 'radstorm' ? 2.5 : 1.5),
                    life: 1.0,
                    type: wType
                });
            }
        }

        for (let i = this.weatherParticles.length - 1; i >= 0; i--) {
            let p = this.weatherParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.type === 'ash') {
                p.x += Math.sin(time/1000 + p.y/100) * 0.5;
                ctx.fillStyle = `rgba(200, 200, 200, ${p.life * 0.5})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
            } else if (p.type === 'radstorm') {
                ctx.fillStyle = `rgba(57, 255, 20, ${p.life * 0.8})`;
                ctx.fillRect(p.x, p.y, p.size*3, p.size/2); 
            } else if (p.type === 'rain') {
                ctx.fillStyle = `rgba(100, 200, 255, ${p.life * 0.6})`;
                ctx.fillRect(p.x, p.y, 1, p.size*5);
            }

            if (p.y > this.camera.y + viewH || p.x > this.camera.x + viewW || p.x < this.camera.x) {
                this.weatherParticles.splice(i, 1);
            }
        }

        ctx.restore(); 
        
        // --- SCREEN SPACE OVERLAYS ---

        if (wType === 'radstorm') {
            const radPulse = (Math.sin(time / 500) + 1) / 2;
            ctx.fillStyle = `rgba(20, 80, 0, ${0.1 + radPulse * 0.15})`;
            ctx.fillRect(0, 0, viewW, viewH);
        }

        // TAGESZEIT & TASCHENLAMPE (10 Minuten Zyklus)
        const cycleLength = 10 * 60 * 1000; 
        const timePhase = ((time + 60000) % cycleLength) / cycleLength; 
        
        let darkness = 0;
        if (timePhase < 0.25 || timePhase > 0.75) darkness = 0.85; 
        else if (timePhase < 0.35) darkness = 0.85 - ((timePhase - 0.25) / 0.1) * 0.85; 
        else if (timePhase > 0.65) darkness = ((timePhase - 0.65) / 0.1) * 0.85; 

        if (darkness > 0) {
            ctx.save();
            
            // Exakte Spielerposition auf dem Bildschirm berechnen
            const screenPx = (this.state.player.x * this.TILE + this.TILE/2) - this.camera.x;
            const screenPy = (this.state.player.y * this.TILE + this.TILE/2) - this.camera.y;
            
            // Umgebung verdunkeln, Spieler-Mitte leicht aufhellen
            const ambientGrad = ctx.createRadialGradient(screenPx, screenPy, 30, screenPx, screenPy, 250);
            ambientGrad.addColorStop(0, `rgba(0,0,0,${Math.max(0, darkness - 0.5)})`); 
            ambientGrad.addColorStop(1, `rgba(0,0,0,${darkness})`); 
            
            ctx.fillStyle = ambientGrad;
            ctx.fillRect(0, 0, viewW, viewH);

            // Natürlicher, weicher Taschenlampen-Kegel
            ctx.translate(screenPx, screenPy);
            const pRot = this.state.player.rot || 0;
            ctx.rotate(pRot); 
            
            const beamGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 300);
            beamGrad.addColorStop(0, `rgba(255, 255, 200, ${darkness * 0.6})`);
            beamGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
            
            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, 300, -Math.PI/2 - Math.PI/5, -Math.PI/2 + Math.PI/5);
            ctx.fill();
            
            ctx.restore();
        }

        ctx.fillStyle = "rgba(0, 255, 0, 0.02)"; 
        for(let i=0; i<viewH; i+=4) { ctx.fillRect(0, i, viewW, 1); }

        const totalMinutes = Math.floor(timePhase * 24 * 60);
        const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const mins = (totalMinutes % 60).toString().padStart(2, '0');
        
        ctx.fillStyle = "#39ff14";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`LOKALE ZEIT: ${hours}:${mins}`, viewW - 15, 25);

        if(this.state && this.state.trackedQuestId && this.state.view === 'map' && !this.state.inDialog) {
            const qId = this.state.trackedQuestId;
            let qData = null;
            if (Array.isArray(this.state.activeQuests)) qData = this.state.activeQuests.find(q => q.id === qId);
            else if (this.state.activeQuests) qData = this.state.activeQuests[qId];

            let def = null;
            if (this.questDefs) {
                if (Array.isArray(this.questDefs)) def = this.questDefs.find(d => d.id === qId);
                else def = this.questDefs[qId];
            }

            if (qData || def) {
                let title = def ? def.title : "Unbekannt";
                let prog = "";
                
                if (def && def.type === 'collect_multi') {
                    let td = 0; let tr = def.reqItems ? Object.keys(def.reqItems).length : 1;
                    if(def.reqItems) Object.entries(def.reqItems).forEach(([id, amt]) => {
                        const inInv = this.state.inventory.filter(i => i.id === id).reduce((s, i) => s + i.count, 0);
                        if(inInv >= amt) td++;
                    });
                    prog = `[${td}/${tr}]`;
                } else {
                    prog = `[${qData ? (qData.progress||0) : 0}/${qData ? (qData.max||1) : 1}]`;
                }

                const txt = `📌 MISSION: ${title.toUpperCase()} ${prog}`;
                
                ctx.font = "bold 13px monospace";
                const tw = ctx.measureText(txt).width;
                
                const bx = 15; 
                const by = 80; 
                
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fillRect(bx, by, tw + 30, 26);
                
                ctx.strokeStyle = "#facc15";
                ctx.lineWidth = 2;
                ctx.strokeRect(bx, by, tw + 30, 26);

                ctx.fillStyle = "#facc15";
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillText(txt, bx + 15, by + 14); 
            }
        }
    },
    
    // ALTER KEGEL ENTFERNT - Nur noch das Sprite wird gezeichnet
    drawPlayer: function(ctx) { 
        const px=this.state.player.x*this.TILE+this.TILE/2; 
        const py=this.state.player.y*this.TILE+this.TILE/2; 
        ctx.save(); 
        ctx.translate(px,py); 
        ctx.rotate(this.state.player.rot-Math.PI/2); 
        ctx.fillStyle="#39ff14"; 
        ctx.shadowBlur=10; 
        ctx.shadowColor="#39ff14"; 
        ctx.beginPath(); 
        ctx.moveTo(8,0); ctx.lineTo(-6,7); ctx.lineTo(-2,0); ctx.lineTo(-6,-7); 
        ctx.fill(); 
        ctx.shadowBlur=0; 
        ctx.restore(); 
    },

    drawOtherPlayers: function(ctx) { if(typeof Network==='undefined'||!Network.otherPlayers)return; for(let pid in Network.otherPlayers){ const p=Network.otherPlayers[pid]; if(p.sector&&(p.sector.x!==this.state.sector.x||p.sector.y!==this.state.sector.y))continue; const ox=p.x*this.TILE+this.TILE/2; const oy=p.y*this.TILE+this.TILE/2; ctx.fillStyle="#00ffff"; ctx.beginPath(); ctx.arc(ox,oy,6,0,Math.PI*2); ctx.fill(); } },
    drawMonster: function(ctx,x,y,time) { const ts=this.TILE; const px=x*ts+ts/2; const py=y*ts+ts/2; const sc=1+Math.sin(time/200)*0.1; ctx.save(); ctx.translate(px,py); ctx.scale(sc,sc); ctx.fillStyle="#d32f2f"; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="#ff5252"; ctx.lineWidth=2; for(let i=0;i<8;i++){ ctx.beginPath(); ctx.moveTo(0,0); const a=(i/8)*Math.PI*2; ctx.lineTo(Math.cos(a)*12,Math.sin(a)*12); ctx.stroke(); } ctx.fillStyle="#ffeb3b"; ctx.fillRect(-4,-2,3,3); ctx.fillRect(2,-2,3,3); ctx.restore(); },
    drawWanderer: function(ctx,x,y,time) { const ts=this.TILE; const px=x*ts+ts/2; const py=y*ts+ts/2; const b=Math.abs(Math.sin(time/300))*3; ctx.save(); ctx.translate(px,py-b); ctx.fillStyle="#4fc3f7"; ctx.beginPath(); ctx.arc(0,-6,5,Math.PI,0); ctx.lineTo(6,10); ctx.lineTo(-6,10); ctx.fill(); ctx.fillStyle="#8d6e63"; ctx.fillRect(-4,0,8,6); ctx.restore(); },
    drawTile: function(ctx,x,y,type) { const ts=this.TILE; const cx=x*ts+ts/2; const cy=y*ts+ts/2; const dI=(c,cl,s=20)=>{ctx.font=`bold ${s}px monospace`;ctx.fillStyle=cl;ctx.textAlign="center";ctx.textBaseline="middle";ctx.shadowColor=cl;ctx.shadowBlur=5;ctx.fillText(c,cx,cy);ctx.shadowBlur=0;}; switch(type){ case 'R':dI("💰","#ff3333",22);break; case 'X':ctx.fillStyle="#8B4513";ctx.fillRect(cx-8,cy-6,16,12);ctx.strokeStyle="#ffd700";ctx.strokeRect(cx-8,cy-6,16,12);break; case 'S':dI("🏪","#00ff00",22);break; case 'H':dI("⛰️","#888",22);break; case 'E':dI("EXIT","#00ffff",10);break; case 'P':dI("✚","#ff0000",18);break; case '?':dI("?","#ff00ff",20);break; } }
});
