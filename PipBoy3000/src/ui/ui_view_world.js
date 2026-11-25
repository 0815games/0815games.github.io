// [2026-02-21 06:30:00] ui_view_world.js - Dynamic POIs Fix

Object.assign(UI, {
    mapState: {
        offsetX: 0, offsetY: 0,
        scale: 3, minScale: 0.5, maxScale: 12,
        isDragging: false, isPinching: false,
        lastX: 0, lastY: 0,
        pinchStartDist: 0, pinchStartScale: 3,
        needsRender: true,
        centeredOnce: false,
        worldBuffer: null, 
        lastExploredCount: 0 
    },

    getTouchDistance: function(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx*dx + dy*dy);
    },

    initWorldMapInteraction: function() {
        const cvs = document.getElementById('world-map-canvas');
        if(!cvs) return;

        if(Game.state && Game.state.player && !this.mapState.centeredOnce) {
            const rect = cvs.getBoundingClientRect();
            if(rect.width > 0) {
                this.centerMapOnPlayer(cvs, rect);
                this.mapState.centeredOnce = true;
            }
        }

        // Buffer Init
        this.updateWorldBuffer();

        cvs.onmousedown = (e) => {
            if(e.button !== 0) return;
            karte.isDragging = true;
            karte.lastX = e.clientX;
            karte.lastY = e.clientY;
            // Wo und wann die Bewegung begann. Ohne Startpunkt laesst sich
            // "getippt" nicht von "gezogen" unterscheiden - und die Karte
            // wird mit genau dieser Bewegung bedient.
            karte.downX = e.clientX;
            karte.downY = e.clientY;
            karte.downZeit = Date.now();
            cvs.style.cursor = "grabbing";
        };
        
        cvs.onmousemove = (e) => {
            if(karte.isDragging) {
                const dx = e.clientX - karte.lastX;
                const dy = e.clientY - karte.lastY;
                karte.offsetX += dx;
                karte.offsetY += dy;
                karte.lastX = e.clientX;
                karte.lastY = e.clientY;
                karte.needsRender = true;
            }
        };

        // Ein Klick ist: kurz (unter 500 ms) und kaum bewegt (unter 8 px).
        // Alles andere war Ziehen und darf keinen Marker setzen. `mouseleave`
        // zaehlt nie als Klick - dort endet eine Bewegung, kein Tippen.
        const klickPunkt = (e) => {
            const dx = Math.abs(e.clientX - (karte.downX ?? -999));
            const dy = Math.abs(e.clientY - (karte.downY ?? -999));
            const dauer = Date.now() - (karte.downZeit || 0);
            return dx < 8 && dy < 8 && dauer < 500;
        };

        // `this` in den Ereignis-Handlern ist die Leinwand, nicht UI. Deshalb
        // hier einmal festhalten: sonst landet ein `this.mapState` aus einem
        // alten Objekt im Nichts, und der zweite Klick tut nichts mehr.
        const karte = this.mapState;

        cvs.onmouseup = (e) => {
            const warKlick = karte.isDragging && klickPunkt(e);
            karte.isDragging = false;
            cvs.style.cursor = "move";
            if (!warKlick) return;
            const rect = cvs.getBoundingClientRect();
            if (typeof Navigation !== 'undefined' && Navigation.markerSetzen) {
                Navigation.markerSetzen(e.clientX - rect.left, e.clientY - rect.top, karte);
            }
        };
        cvs.onmouseleave = () => { karte.isDragging = false; cvs.style.cursor = "move"; };

        cvs.onwheel = (e) => {
            e.preventDefault();
            const zoomFactor = 1.1;
            const dir = e.deltaY < 0 ? 1 : -1;
            let newScale = karte.scale * (dir > 0 ? zoomFactor : (1 / zoomFactor));
            newScale = Math.max(karte.minScale, Math.min(karte.maxScale, newScale));

            const rect = cvs.getBoundingClientRect();
            const mx = e.clientX - rect.left; 
            const my = e.clientY - rect.top;
            karte.offsetX = mx - ((mx - karte.offsetX) / karte.scale) * newScale;
            karte.offsetY = my - ((my - karte.offsetY) / karte.scale) * newScale;
            karte.scale = newScale;
            karte.needsRender = true;
        };

        cvs.ontouchstart = (e) => {
            if(e.touches.length === 1) {
                karte.isDragging = true;
                karte.isPinching = false;
                karte.lastX = e.touches[0].clientX;
                karte.lastY = e.touches[0].clientY;
                karte.downX = e.touches[0].clientX;
                karte.downY = e.touches[0].clientY;
                karte.downZeit = Date.now();
                // Ein zweiter Finger macht aus dem Tippen ein Zoomen. Das wird
                // gemerkt, damit das Ende nicht als Klick durchgeht.
                karte.pinchBeruehrt = false;
            } else if (e.touches.length === 2) {
                karte.pinchBeruehrt = true;
                karte.isDragging = false;
                karte.isPinching = true;
                karte.pinchStartDist = this.getTouchDistance(e.touches[0], e.touches[1]);
                karte.pinchStartScale = karte.scale;
            }
        };

        cvs.ontouchmove = (e) => {
            e.preventDefault();
            if(karte.isDragging && e.touches.length === 1) {
                const dx = e.touches[0].clientX - karte.lastX;
                const dy = e.touches[0].clientY - karte.lastY;
                karte.offsetX += dx;
                karte.offsetY += dy;
                karte.lastX = e.touches[0].clientX;
                karte.lastY = e.touches[0].clientY;
                karte.needsRender = true;
            } else if(karte.isPinching && e.touches.length === 2) {
                const newDist = this.getTouchDistance(e.touches[0], e.touches[1]);
                const scaleRatio = newDist / karte.pinchStartDist;
                let newScale = karte.pinchStartScale * scaleRatio;
                newScale = Math.max(karte.minScale, Math.min(karte.maxScale, newScale));
                const rect = cvs.getBoundingClientRect();
                const mx = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
                const my = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
                karte.offsetX = mx - ((mx - karte.offsetX) / karte.scale) * newScale;
                karte.offsetY = my - ((my - karte.offsetY) / karte.scale) * newScale;
                karte.scale = newScale;
                karte.needsRender = true;
            }
        };
        
        cvs.ontouchend = (e) => {
            const beruhrung = e.changedTouches && e.changedTouches[0];
            const warTipp = karte.isDragging && !karte.pinchBeruehrt
                && beruhrung
                && Math.abs(beruhrung.clientX - (karte.downX ?? -999)) < 12
                && Math.abs(beruhrung.clientY - (karte.downY ?? -999)) < 12
                && Date.now() - (karte.downZeit || 0) < 600;
            karte.isDragging = false;
            if(e.touches.length < 2) karte.isPinching = false;
            if(!warTipp) return;
            const rect = cvs.getBoundingClientRect();
            if (typeof Navigation !== 'undefined' && Navigation.markerSetzen) {
                Navigation.markerSetzen(beruhrung.clientX - rect.left, beruhrung.clientY - rect.top);
            }
        };
    },

    updateWorldBuffer: function() {
        if(!Game.state || !Game.state.explored) return;

        const totalW = Game.WORLD_W * Game.MAP_W; 
        const totalH = Game.WORLD_H * Game.MAP_H;

        if(!this.mapState.worldBuffer) {
            this.mapState.worldBuffer = document.createElement('canvas');
            this.mapState.worldBuffer.width = totalW;
            this.mapState.worldBuffer.height = totalH;
            const ctx = this.mapState.worldBuffer.getContext('2d');
            ctx.fillStyle = "#000000"; 
            ctx.fillRect(0, 0, totalW, totalH);
            this.mapState.lastExploredCount = 0;
        }

        const ctx = this.mapState.worldBuffer.getContext('2d');
        const keys = Object.keys(Game.state.explored);
        
        if (keys.length === this.mapState.lastExploredCount) return;

        const colors = {
            '.': '#4a4036', ',': '#6e6259', '_': '#8b5a2b', '"': '#1a3300', 
            ';': '#1e1e11', '~': '#2244aa', '^': '#6b5b45', 'Y': '#333333', 
            '#': '#222222', '=': '#555555', '+': '#654321', 't': '#0f2405', 
            'V': '#ffcc00', 'C': '#ff4400', 'G': '#cccccc', 'X': '#8B4513'
        };

        keys.forEach(key => {
            const parts = key.split('_');
            if(parts.length !== 2) return;
            
            const [sx, sy] = parts[0].split(',').map(Number);
            const [lx, ly] = parts[1].split(',').map(Number);
            
            const tileChar = Game.state.explored[key];
            
            const gx = sx * Game.MAP_W + lx;
            const gy = sy * Game.MAP_H + ly;
            
            ctx.fillStyle = colors[tileChar] || '#4a4036'; 
            ctx.fillRect(gx, gy, 1, 1);
        });

        this.mapState.lastExploredCount = keys.length;
        this.mapState.needsRender = true;
    },

    centerMapOnPlayer: function(cvs, rect) {
        if(!Game.state) return;
        this.mapState.scale = 3; 
        const globalX = Game.state.sector.x * Game.MAP_W + Game.state.player.x;
        const globalY = Game.state.sector.y * Game.MAP_H + Game.state.player.y;
        this.mapState.offsetX = (rect.width / 2) - (globalX * this.mapState.scale);
        this.mapState.offsetY = (rect.height / 2) - (globalY * this.mapState.scale);
        this.mapState.needsRender = true;
    },

    renderWorldMap: function() {
        if (!Game || !Game.state) return;

        const cvs = document.getElementById('world-map-canvas');
        if(!cvs) return;
        const ctx = cvs.getContext('2d');

        const dpr = window.devicePixelRatio || 1;
        const rect = cvs.parentElement.getBoundingClientRect();
        
        if(rect.width === 0 || rect.height === 0) {
            requestAnimationFrame(() => this.renderWorldMap());
            return;
        }

        const targetWidth = Math.floor(rect.width * dpr);
        const targetHeight = Math.floor(rect.height * dpr);

        if (cvs.width !== targetWidth || cvs.height !== targetHeight) {
            cvs.width = targetWidth;
            cvs.height = targetHeight;
            ctx.scale(dpr, dpr);
            ctx.imageSmoothingEnabled = false;
            this.centerMapOnPlayer(cvs, rect); 
            this.mapState.needsRender = true;
        }

        if(!cvs.dataset.init) { 
            this.initWorldMapInteraction(); 
            cvs.dataset.init = "true"; 
            if(!this.mapState.centeredOnce) {
                this.centerMapOnPlayer(cvs, rect);
                this.mapState.centeredOnce = true;
            }
        }

        this.updateWorldBuffer();

        // 1. Background
        ctx.fillStyle = "#050a05"; 
        ctx.fillRect(0, 0, rect.width, rect.height);

        const s = this.mapState.scale;
        const ox = this.mapState.offsetX;
        const oy = this.mapState.offsetY;

        // 2. Buffer zeichnen
        if (this.mapState.worldBuffer) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                this.mapState.worldBuffer, 
                ox, oy, 
                this.mapState.worldBuffer.width * s, 
                this.mapState.worldBuffer.height * s
            );
        }

        // 3. Grid
        ctx.strokeStyle = "rgba(0, 255, 0, 0.1)";
        ctx.lineWidth = 1;
        const gridSize = 50 * s;
        const startGridX = Math.floor(-ox / gridSize);
        const endGridX = Math.ceil((rect.width - ox) / gridSize);
        const startGridY = Math.floor(-oy / gridSize);
        const endGridY = Math.ceil((rect.height - oy) / gridSize);

        ctx.beginPath();
        for(let x=startGridX; x<=endGridX; x++) { const pos = ox + x * gridSize; ctx.moveTo(pos, 0); ctx.lineTo(pos, rect.height); }
        for(let y=startGridY; y<=endGridY; y++) { const pos = oy + y * gridSize; ctx.moveTo(0, pos); ctx.lineTo(rect.width, pos); }
        ctx.stroke();

        // 4. Player
        const currSX = Game.state.sector.x; const currSY = Game.state.sector.y;
        const pGlobalX = (currSX * Game.MAP_W) + Game.state.player.x;
        const pGlobalY = (currSY * Game.MAP_H) + Game.state.player.y;
        
        const pDrawX = (pGlobalX * s) + ox + (s/2);
        const pDrawY = (pGlobalY * s) + oy + (s/2);
        
        const pulse = 10 + Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
        ctx.beginPath(); ctx.arc(pDrawX, pDrawY, Math.max(5, pulse * (s/3)), 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#39ff14"; ctx.beginPath(); ctx.arc(pDrawX, pDrawY, Math.max(2, 4 * (s/3)), 0, Math.PI*2); ctx.fill();

        // 4b. Navigation: Ziellinie, gesetztes Ziel und der Marker, der noch
        //     bestaetigt werden muss. Nach dem Spieler, damit beides ueber der
        //     Karte liegt und der Marker ueber der Linie.
        if (typeof Navigation !== 'undefined' && Navigation.zeichnen) {
            Navigation.zeichnen(ctx, this.mapState, Game.MAP_W || 50);
        }

        // 5. FIX: DYNAMISCHE POIs aus dem Generator lesen anstatt aus der veralteten Liste
        let activePOIs = [];
        if (typeof WorldGen !== 'undefined' && WorldGen.locations) {
            if(WorldGen.locations.vault) activePOIs.push({x: WorldGen.locations.vault.x, y: WorldGen.locations.vault.y, type: 'V'});
            if(WorldGen.locations.city) activePOIs.push({x: WorldGen.locations.city.x, y: WorldGen.locations.city.y, type: 'C'});
            if(WorldGen.locations.ghostTown) activePOIs.push({x: WorldGen.locations.ghostTown.x, y: WorldGen.locations.ghostTown.y, type: 'G'});
        } else if (Game.state.worldPOIs) {
            // Absoluter Notfall-Fallback, falls WorldGen nicht geladen ist
            activePOIs = Game.state.worldPOIs; 
        }

        activePOIs.forEach(poi => {
            // Wichtig: +25 positioniert das Icon in die Mitte des 50x50 Sektors
            const mapW = Game.MAP_W || 50;
            const mapH = Game.MAP_H || 50;
            const px = (poi.x * mapW + (mapW/2)) * s + ox; 
            const py = (poi.y * mapH + (mapH/2)) * s + oy;
            
            if(px > -50 && px < rect.width+50 && py > -50 && py < rect.height+50) {
                ctx.font = `bold ${Math.max(12, 16 * (s/3))}px VT323, monospace`; 
                ctx.textAlign = "center"; ctx.textBaseline = "middle";
                let icon = "❓";
                if(poi.type === 'V') icon = "⚙️";
                if(poi.type === 'C') icon = "🏙️";
                if(poi.type === 'G') icon = "👻";
                
                ctx.shadowColor = 'black'; ctx.shadowBlur = 4; ctx.fillStyle="#fff"; 
                ctx.fillText(icon, px, py); ctx.shadowBlur = 0;
            }
        });

        // 6. Compass & Text
        this.drawCompass(ctx, rect.width, rect.height);
        this.updateLocationText();

        if(Game.state.view === 'worldmap') requestAnimationFrame(() => this.renderWorldMap());
    },

    drawBackgroundGrid: function(ctx, w, h) { },

    drawCompass: function(ctx, w, h) {
        const cx = w - 60; const cy = h - 60; const r = 30;
        ctx.fillStyle = "rgba(0, 20, 0, 0.8)"; ctx.strokeStyle = "#00ff00"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#00ff00"; ctx.font = "bold 12px VT323, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("N", cx, cy - r + 10); ctx.fillText("S", cx, cy + r - 10);
        ctx.fillText("W", cx - r + 10, cy); ctx.fillText("O", cx + r - 10, cy);
        ctx.strokeStyle = "rgba(0, 255, 0, 0.3)"; ctx.beginPath(); ctx.moveTo(cx, cy - r + 15); ctx.lineTo(cx, cy + r - 15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - r + 15, cy); ctx.lineTo(cx + r - 15, cy); ctx.stroke();
        ctx.fillStyle = "#39ff14"; ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI*2); ctx.fill();
    },

    updateLocationText: function() {
        const el = document.getElementById('world-location-text');
        if(!el) return;
        if(!this._lastLocUpdate || Date.now() - this._lastLocUpdate > 500) {
            let txt = `SEKTOR [${Game.state.sector.x}, ${Game.state.sector.y}]`;
            if(Game.state.zone) {
                let zoneName = Game.state.zone.split('(')[0].trim();
                txt += ` // ${zoneName.toUpperCase()}`;
            } else { txt += " // UNBEKANNTES GEBIET"; }
            el.innerText = txt;
            this._lastLocUpdate = Date.now();
        }
    }
});
