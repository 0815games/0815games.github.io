// [2026-01-13 18:00:00] ui_render_core.js - Added AFK Check (Fix for Char Select)

Object.assign(UI, {
    
    update: function() {
        // --- AFK LOGIC (Muss VOR Game.state Check stehen!) ---
        // Da diese Funktion die update() aus ui_core.js überschreibt, muss der Check hier rein.
        
        const loginScreen = document.getElementById('login-screen');
        // Wir sind "eingeloggt", wenn der Login-Screen weg ist (hidden Klasse oder display none)
        const isLoginHidden = loginScreen && (loginScreen.style.display === 'none' || loginScreen.classList.contains('hidden'));
        // Und wenn wir eine Network ID haben
        const isAuth = (typeof Network !== 'undefined' && Network.myId);

        if (isLoginHidden && isAuth) {
            // 300000 ms = 5 Minuten
            if (Date.now() - (this.lastInputTime || Date.now()) > 300000) { 
                console.log("AFK Trigger: Zeitüberschreitung im UI Render Loop");
                if(typeof this.logout === 'function') {
                    this.logout("AFK: ZEITÜBERSCHREITUNG");
                }
                return; // Nichts weiter rendern
            }
        }
        // -----------------------------------------------------

        if (!Game.state) return;
        
        if(!this.els.ammo) this.els.ammo = document.getElementById('val-ammo');
        if(!this.els.caps) this.els.caps = document.getElementById('val-caps');
        if(!this.els.hp) this.els.hp = document.getElementById('bar-hp');
        if(!this.els.headerCharInfo) this.els.headerCharInfo = document.getElementById('header-char-info');

        const hasPoints = (Game.state.statPoints > 0) || (Game.state.perkPoints > 0);

        const displayName = Game.state.playerName || (typeof Network !== 'undefined' ? Network.myDisplayName : "SURVIVOR");
        if(this.els.name) this.els.name.textContent = displayName;
        
        if(this.els.headerCharInfo) {
            if(hasPoints) this.els.headerCharInfo.classList.add('lvl-ready-glow');
            else this.els.headerCharInfo.classList.remove('lvl-ready-glow');
        }

        const dtName = document.querySelector('.desktop-name-target');
        if(dtName) dtName.textContent = displayName;

        // Sektor-Anzeige UND Richtungspfeil zeichnet Navigation.aktualisiere().
        // Beides gehoert zusammen: die Anzeige nennt das Ziel, der Pfeil zeigt
        // hin. Zwei Stellen fuer eine Zeile laufen sonst auseinander - hier
        // blieb beim Aufheben das alte Ziel in der Anzeige stehen.
        if (typeof Navigation !== 'undefined' && Navigation.aktualisiere) {
            Navigation.aktualisiere();
        }

        if(this.els.lvl) this.els.lvl.textContent = Game.state.lvl;
        const dtLvl = document.querySelector('.desktop-lvl-target');
        if(dtLvl) dtLvl.textContent = Game.state.lvl;

        // HP Logic
        const maxHp = Game.state.maxHp;
        const hp = Game.state.hp;
        const rads = Game.state.rads || 0;
        const effectiveMax = Math.max(1, maxHp - rads);
        
        const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));
        const radPct = Math.min(100, (rads / maxHp) * 100);
        
        const hpText = `TP ${Math.round(hp)}/${Math.round(effectiveMax)}`;
        
        const valHpEl = document.getElementById('val-hp');
        if(valHpEl) valHpEl.textContent = hpText;

        let barColor = "bg-green-500";
        if(hpPct < 25) barColor = "bg-red-500 animate-pulse";
        else if(hpPct < 50) barColor = "bg-yellow-500";

        if(this.els.hp) {
             this.els.hp.className = `absolute top-0 left-0 h-full transition-all duration-300 ${barColor}`;
             this.els.hp.style.width = `${hpPct}%`;
             
             if(this.els.hp.parentElement) {
                 const p = this.els.hp.parentElement;
                 p.classList.remove('bg-green-900', 'bg-green-800', 'bg-green-700', 'bg-opacity-50');
                 p.style.backgroundColor = 'rgba(10, 10, 10, 0.9)'; 
                 p.style.borderColor = '#14532d'; 
             }
        }
        
        const radBar = document.getElementById('bar-rads');
        if(radBar) {
            radBar.style.width = `${radPct}%`;
            radBar.className = "absolute top-0 right-0 h-full bg-red-600 transition-all duration-300 opacity-90";
        }

        // XP
        const nextXp = Game.expToNextLevel(Game.state.lvl);
        const expPct = Math.min(100, Math.floor((Game.state.xp / nextXp) * 100));
        if(this.els.xpTxt) this.els.xpTxt.textContent = expPct;
        if(this.els.expBarTop) this.els.expBarTop.style.width = `${expPct}%`;
        
        if(this.els.caps) this.els.caps.textContent = `${Game.state.caps}`;
        const ammoItem = Game.state.inventory ? Game.state.inventory.find(i => i.id === 'ammo') : null;
        if(this.els.ammo) this.els.ammo.textContent = ammoItem ? ammoItem.count : 0;

        // Camp Button
        const campBtn = document.getElementById('btn-camp-overlay');
        if(campBtn) {
            const hasKit = Game.state.inventory && Game.state.inventory.some(i => i.id === 'camp_kit');
            const campDeployed = !!Game.state.camp;
            const inCampSector = campDeployed && 
                                 Game.state.camp.sector.x === Game.state.sector.x && 
                                 Game.state.camp.sector.y === Game.state.sector.y;

            if (campDeployed) {
                if (inCampSector) {
                    campBtn.classList.remove('hidden');
                    campBtn.className = "absolute top-4 left-4 flex flex-col items-center justify-center p-2 rounded-lg border-2 z-20 shadow-[0_0_15px_#ffd700] cursor-pointer bg-black/80 animate-pulse border-yellow-400 text-yellow-400";
                    campBtn.innerHTML = '<span class="text-2xl">⛺</span><span class="text-xs font-bold">LAGER</span>';
                    campBtn.onclick = () => UI.switchView('camp');
                } else {
                    campBtn.classList.add('hidden');
                }
            } else {
                if (hasKit) {
                    campBtn.classList.remove('hidden');
                    campBtn.className = "absolute top-4 left-4 flex flex-col items-center justify-center p-2 rounded-lg border-2 z-20 shadow-[0_0_10px_#39ff14] cursor-pointer bg-black/80 border-green-500 text-green-500 hover:bg-green-900 transition-colors";
                    campBtn.innerHTML = '<span class="text-2xl">⛺</span><span class="text-xs font-bold">BAUEN</span>';
                    campBtn.onclick = () => Game.deployCamp();
                } else {
                    campBtn.classList.add('hidden');
                }
            }
        }
        
        let hasAlert = false;
        if(this.els.btnChar) {
            if(hasPoints) { this.els.btnChar.classList.add('alert-glow-yellow'); hasAlert = true; } 
            else { this.els.btnChar.classList.remove('alert-glow-yellow'); }
        } 
        const questsList = Game.state.quests || [];
        const unreadQuests = questsList.some(q => !q.read);
        if(this.els.btnQuests) {
            if(unreadQuests) { this.els.btnQuests.classList.add('alert-glow-cyan'); hasAlert = true; } 
            else { this.els.btnQuests.classList.remove('alert-glow-cyan'); }
        }
        if(this.els.btnMenu) {
            if(hasAlert) this.els.btnMenu.classList.add('alert-glow-yellow');
            else this.els.btnMenu.classList.remove('alert-glow-yellow');
        }

        const inCombat = Game.state.view === 'combat';
        [this.els.btnWiki, this.els.btnMap, this.els.btnChar, this.els.btnQuests, this.els.btnLogout, this.els.btnInv].forEach(btn => { if(btn) btn.disabled = inCombat; });
        
        if(this.els.lvl) {
            if(Game.state.buffEndTime && Date.now() < Game.state.buffEndTime) this.els.lvl.classList.add('blink-red');
            else this.els.lvl.classList.remove('blink-red');
        }
        
        if(typeof Network !== 'undefined' && Network.active) {
            const count = Object.keys(Network.otherPlayers).length + 1;
            const onlineBadge = document.getElementById('online-badge');
            if(onlineBadge) {
                onlineBadge.innerHTML = `● ${count} ONLINE`;
                onlineBadge.className = "absolute top-2 right-2 text-[10px] font-mono border border-green-900 bg-black/80 px-1 rounded " + (count > 1 ? "text-green-400" : "text-gray-600");
            }
        }
    },

    shakeView: function() {
        if(this.els.view) {
            this.els.view.classList.remove('shake');
            void this.els.view.offsetWidth;
            this.els.view.classList.add('shake');
            setTimeout(() => { if(this.els.view) this.els.view.classList.remove('shake'); }, 300);
        }
    },

    toggleView: function(name) {
        if(Game.state.view === name) {
            this.switchView('map');
        } else {
            this.switchView(name);
        }
    },

    switchView: async function(name) {
        this.stopJoystick();
        this.focusIndex = -1;

        if(this.els.navMenu) {
            this.els.navMenu.classList.add('hidden');
            this.els.navMenu.style.display = 'none';
        }
        if(this.els.playerList) this.els.playerList.style.display = 'none';

        const verDisplay = document.getElementById('version-display');
        const ver = verDisplay ? verDisplay.textContent.trim() : Date.now();
        
        if (name === 'map') {
            this.els.view.innerHTML = `
                <div id="map-view" class="w-full h-full flex justify-center items-center bg-black relative">
                    <canvas id="game-canvas" class="w-full h-full object-contain" style="image-rendering: pixelated;"></canvas>
                    <!-- Sektor-Anzeige mit Navigationspfeil. Der Pfeil sitzt
                         rechts daneben, in derselben Zeile: er gehoert zur
                         Sektor-Anzeige, nicht zur Karte. Versteckt, solange
                         kein Ziel gesetzt ist (Navigation.aktualisiere()). -->
                    <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20">
                        <div id="val-sector-display" onclick="UI.switchView('worldmap')" class="bg-black/80 border border-green-500 text-green-500 px-3 py-1 text-sm font-bold tracking-widest shadow-[0_0_10px_#39ff14] cursor-pointer hover:text-yellow-400 hover:border-yellow-500 transition-all active:scale-95 group rounded">🌍 SEKTOR [?,?]</div>
                        <button id="nav-pfeil" onclick="UI.oeffneNavigation()" class="hidden bg-black/85 border border-[#39ff14] rounded px-1.5 py-1 items-center gap-1 shadow-[0_0_10px_rgba(57,255,20,0.5)] cursor-pointer hover:border-yellow-400" title="Navigation" style="display: none;">
                            <canvas width="26" height="26" class="block"></canvas>
                            <span data-nav-text class="text-[11px] font-bold text-[#39ff14] tracking-wider leading-none"></span>
                        </button>
                    </div>
                    <button id="btn-camp-overlay" class="hidden absolute top-4 left-4 bg-black/80 border-2 border-green-500 text-green-500 p-2 rounded-lg hover:bg-green-900 transition-all z-20 shadow-[0_0_15px_#39ff14] cursor-pointer flex flex-col items-center">
                        <span class="text-2xl">⛺</span>
                        <span class="text-xs font-bold">BAUEN</span>
                    </button>
                </div>`;
            Game.state.view = name;
            if(Game.state) Game.state.inDialog = false;
            if(document.activeElement) document.activeElement.blur();
            Game.initCanvas();
            this.restoreOverlay();
            this.toggleControls(true);
            this.updateButtonStates(name);
            this.update();
            return;
        }

        if(name === 'hacking') { this.renderHacking(); Game.state.view = name; return; }
        if(name === 'lockpicking') { this.renderLockpicking(true); Game.state.view = name; return; }

        const path = `templates/${name}.html?v=${ver}`;
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`View '${name}' not found`);
            const html = await res.text();
            this.els.view.innerHTML = html;
            Game.state.view = name;
            
            this.restoreOverlay();

            if (name === 'combat') {
                this.toggleControls(false);
                if(typeof Combat !== 'undefined' && typeof Combat.render === 'function') Combat.render();
                else this.renderCombat();
            } else {
                this.toggleControls(false);
            }
            
            if (name === 'char') this.renderStats();
            if (name === 'inventory') this.renderInventory();
            if (name === 'wiki') this.renderWiki();
            if (name === 'worldmap') this.renderWorldMap();
            if (name === 'city') this.renderCity();
            if (name === 'quests') this.renderQuests();
            if (name === 'crafting') this.renderCrafting();
            if (name === 'shop') this.renderShop(document.getElementById('shop-list'));
            if (name === 'clinic') this.renderClinic();
            
            if (name === 'camp') {
                if(typeof this.renderCamp === 'function') this.renderCamp();
            }
            
            this.updateButtonStates(name);
            this.update();
            
            setTimeout(() => this.refreshFocusables(), 100);

        } catch (e) { this.error(`Ladefehler: ${e.message}`); }
    },

    updateButtonStates: function(activeName) {
        if(this.els.btnWiki) this.els.btnWiki.classList.toggle('active', activeName === 'wiki');
        if(this.els.btnMap) this.els.btnMap.classList.toggle('active', activeName === 'worldmap');
        if(this.els.btnChar) this.els.btnChar.classList.toggle('active', activeName === 'char');
        if(this.els.btnInv) this.els.btnInv.classList.toggle('active', activeName === 'inventory');
        if(this.els.btnQuests) this.els.btnQuests.classList.toggle('active', activeName === 'quests');
    },

    // Diese Fassung wird von ui_render_overlays.restoreOverlay überschrieben.
    // Sie bleibt als dünner Aufruf erhalten, damit beide Wege dasselbe Ergebnis
    // liefern (vorher legte nur diese Version den Joystick an - siehe ANALYSE.md B2).
    restoreOverlay: function() {
        if (typeof this.ensureJoystick === 'function') return this.ensureJoystick();
        if (typeof UI.restoreOverlay === 'function' && UI.restoreOverlay !== this.restoreOverlay) {
            return UI.restoreOverlay();
        }
    },
    
    toggleControls: function(show) { if (!show && this.els.dialog) this.els.dialog.innerHTML = ''; },

    showMobileControlsHint: function() {
        if(document.getElementById('mobile-hint')) return;
        const hintHTML = `
            <div id="mobile-hint" class="absolute inset-0 z-[100] flex flex-col justify-center items-center bg-black/80 pointer-events-auto backdrop-blur-sm opacity-0 transition-opacity duration-500" onclick="this.style.opacity='0'; setTimeout(() => this.remove(), 500)">
                <div class="border-2 border-[#39ff14] bg-black p-6 text-center shadow-[0_0_20px_#39ff14] max-w-sm mx-4">
                    <div class="text-5xl mb-4 animate-bounce">👆</div>
                    <h2 class="text-2xl font-bold text-[#39ff14] mb-2 tracking-widest border-b border-[#39ff14] pb-2">TOUCH STEUERUNG</h2>
                    <p class="text-green-300 mb-6 font-mono leading-relaxed">Tippe und halte IRGENDWO auf dem Hauptschirm (auch im Log), um den Joystick zu aktivieren.</p>
                    <div class="text-xs text-[#39ff14] animate-pulse font-bold bg-[#39ff14]/20 py-2 rounded">> TIPPEN ZUM STARTEN <</div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', hintHTML);
        setTimeout(() => { const el = document.getElementById('mobile-hint'); if(el) el.classList.remove('opacity-0'); }, 10);
    },

    updatePlayerList: function() {
        if(!this.els.playerListContent || typeof Network === 'undefined') return;
        this.els.playerListContent.innerHTML = '';
        const myName = Network.myDisplayName || "ICH";
        const mySec = (Game.state && Game.state.sector) ? `[${Game.state.sector.x},${Game.state.sector.y}]` : "[?,?]";
        const myEntry = document.createElement('div');
        myEntry.className = "text-green-400 font-bold border-b border-green-900 py-1";
        myEntry.textContent = `> ${myName} ${mySec}`;
        this.els.playerListContent.appendChild(myEntry);
        for(let pid in Network.otherPlayers) {
            const p = Network.otherPlayers[pid];
            const div = document.createElement('div');
            div.className = "text-green-200 text-sm py-1";
            const pSec = p.sector ? `[${p.sector.x},${p.sector.y}]` : "[?,?]";
            div.textContent = `${p.name} ${pSec}`;
            this.els.playerListContent.appendChild(div);
        }
    },
    
    togglePlayerList: function() {
        if(!this.els.playerList) return;
        if(this.els.playerList.style.display === 'flex') {
            this.els.playerList.style.display = 'none';
        } else {
            this.els.playerList.style.display = 'flex';
            this.updatePlayerList();
        }
    }
});
