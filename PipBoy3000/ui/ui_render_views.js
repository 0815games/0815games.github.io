// [2026-02-22 10:45:00] ui_render_views.js - Fullscreen Skyline & Live HP Fix

// WACHHUND: Überwacht das Spiel permanent. Wenn die Engine das V.A.T.S. resettet, 
// krallt er sich den Root-Container und erzwingt das Vollbild-Design!
if (!window.vatsObserverInit) {
    window.vatsObserverInit = true;
    setTimeout(() => {
        if(document.body) {
            const observer = new MutationObserver(() => {
                const nameEl = document.getElementById('enemy-name');
                if (nameEl && !nameEl.dataset.vatsApplied) {
                    if (typeof UI.applyVatsStyle === 'function') UI.applyVatsStyle();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }, 100);
}

Object.assign(UI, {

    openEquipMenu: function(slot) {
        if(!Game.state) return;
        const item = Game.state.equip ? Game.state.equip[slot] : null;
        if(item) {
            if(typeof this.showEquippedDialog === 'function') this.showEquippedDialog(slot);
        } else {
            if(typeof this.showInfoDialog === 'function') this.showInfoDialog("SLOT LEER", "Gehe ins Inventar, um Ausrüstung anzulegen.");
        }
    },

    handleHeaderClick: function() {
        if(!Game.state) return;
        const sPoints = Number(Game.state.statPoints || 0);
        const pPoints = Number(Game.state.perkPoints || 0);
        if (sPoints > 0) this.renderStats('special'); 
        else if (pPoints > 0) this.renderStats('perks');    
        else this.renderStats('special'); 
    },

    renderView: function() {
        const container = document.getElementById('view-container');
        if(!container || !Game.state) return;

        container.innerHTML = '';
        
        // Alte Effekte beim Menü-Wechsel restlos löschen
        document.querySelectorAll('.vats-fx-layer').forEach(e => e.remove());

        switch(Game.state.view) {
            case 'map':
                this.renderMapScanline(container);
                break;
            case 'inv':
                if(this.renderInventory) this.renderInventory(container);
                break;
            case 'char':
                this.renderStats(Game.state.charTab || 'stats');
                break;
            case 'journal':
                if(this.renderJournal) this.renderJournal(container);
                break;
            case 'camp':
                if(this.renderCamp) this.renderCamp(container);
                break;
            case 'city':
                if(this.renderCity) this.renderCity(container);
                break;
            case 'worldmap':
                this.renderFullscreenWorldMap(container);
                break;
            default:
                container.innerHTML = `<div class="text-center p-10 text-red-500">ERROR: Unknown View ${Game.state.view}</div>`;
        }

        if(typeof UI.updateQuestTracker === 'function') {
            setTimeout(() => UI.updateQuestTracker(), 50);
        }
    },

    renderMapScanline: function(container) {
        container.innerHTML = `
            <div class="relative w-full h-full bg-black overflow-hidden flex flex-col">
                <canvas id="game-canvas" class="block w-full h-full object-cover absolute inset-0"></canvas>
                <div id="scanline" class="pointer-events-none absolute inset-0 bg-repeat-y opacity-10"></div>
                <div id="vignette" class="pointer-events-none absolute inset-0 radial-gradient"></div>

                <div class="absolute bottom-4 left-4 text-green-400 font-mono text-sm bg-black/50 px-2 py-1 border border-green-900 z-40 pointer-events-none">
                    DIAGNOSE: ${Game.state.zone || 'Unbekannt'}
                </div>
                <div class="absolute bottom-20 right-4 flex flex-col gap-2 md:hidden z-40">
                    <button onclick="Game.move(0, -1)" class="p-4 bg-green-900/30 border border-green-500 rounded active:bg-green-500 pointer-events-auto">⬆️</button>
                    <div class="flex gap-2">
                        <button onclick="Game.move(-1, 0)" class="p-4 bg-green-900/30 border border-green-500 rounded active:bg-green-500 pointer-events-auto">⬅️</button>
                        <button onclick="Game.move(1, 0)" class="p-4 bg-green-900/30 border border-green-500 rounded active:bg-green-500 pointer-events-auto">➡️</button>
                    </div>
                    <button onclick="Game.move(0, 1)" class="p-4 bg-green-900/30 border border-green-500 rounded active:bg-green-500 pointer-events-auto">⬇️</button>
                </div>
            </div>
        `;
        if(Game.initCanvas) Game.initCanvas();
    },

    renderFullscreenWorldMap: function(container) {
        container.innerHTML = `
            <div class="relative w-full h-full bg-[#050a05] overflow-hidden flex flex-col select-none">
                <div class="flex-grow relative overflow-hidden w-full h-full">
                    <canvas id="world-map-canvas" class="absolute inset-0 w-full h-full block cursor-move"></canvas>
                    <div class="pointer-events-none absolute inset-0 border-2 border-green-900/30 m-2 rounded-lg z-10"></div>
                </div>
                
                <div class="absolute top-4 left-0 w-full flex justify-center items-center pointer-events-none z-20">
                    <div class="bg-black/80 border-t-2 border-b-2 border-green-500 px-8 py-2 flex items-center gap-4 shadow-[0_0_15px_rgba(0,255,0,0.2)] backdrop-blur-sm pointer-events-auto">
                        <h2 class="text-xl font-bold text-green-400 tracking-[0.2em] uppercase text-shadow-glow">WELTKARTE</h2>
                        <button onclick="if(typeof UI.showMapLegend === 'function') UI.showMapLegend()" class="border border-green-500 text-green-500 hover:bg-green-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all bg-black/80">?</button>
                    </div>
                </div>

                <div class="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none z-20">
                    <div class="bg-black/90 border border-green-600 px-6 py-3 rounded-lg shadow-lg text-center backdrop-blur pointer-events-auto max-w-[90%]">
                        <div class="text-[10px] text-green-700 tracking-widest uppercase mb-1 border-b border-green-900/50 pb-1">PIP-OS V7.1.0 // GPS MODULE</div>
                        <div id="world-location-text" class="text-green-400 font-mono font-bold text-lg animate-pulse">
                            STANDORT WIRD BERECHNET...
                        </div>
                    </div>
                </div>

                <button onclick="UI.switchView('map')" class="absolute top-4 right-4 z-30 bg-red-900/20 border border-red-500/50 text-red-500 w-10 h-10 flex items-center justify-center hover:bg-red-900 hover:text-white transition-colors text-xl font-bold shadow-lg">✕</button>
            </div>
        `;
        
        if(UI.mapState) UI.mapState.centeredOnce = false;

        setTimeout(() => {
            if(UI.initWorldMapInteraction) UI.initWorldMapInteraction();
            if(UI.renderWorldMap) UI.renderWorldMap();
        }, 50);
    },

    renderStats: function(tab = 'stats', event = null) {
        if (event) { event.stopPropagation(); event.preventDefault(); }
        Game.state.view = 'char';
        Game.state.charTab = tab;
        const view = document.getElementById('view-container'); if(!view) return;
        
        view.innerHTML = ''; 
        const wrapper = document.createElement('div');
        wrapper.className = "absolute inset-0 w-full h-full flex flex-col bg-black z-20 overflow-hidden";
        wrapper.onclick = (e) => e.stopPropagation();

        const scrollId = 'char-scroll-content';
        const scrollContainer = document.createElement('div');
        scrollContainer.id = scrollId; 
        scrollContainer.className = "flex-1 w-full overflow-y-auto pb-24 bg-black";

        const getTabClass = (t) => (tab === t) ? "bg-green-500 text-black border-b-4 border-green-700 font-bold" : "bg-[#001100] text-green-600 border-b border-green-900";
        const header = document.createElement('div');
        header.className = "flex w-full border-b-2 border-green-900 bg-black sticky top-0 z-30"; 
        header.innerHTML = `
            <button onclick="UI.renderStats('stats', event)" class="flex-1 py-3 uppercase font-vt323 text-xl ${getTabClass('stats')}">STATUS</button>
            <button onclick="UI.renderStats('special', event)" class="flex-1 py-3 uppercase font-vt323 text-xl ${getTabClass('special')}">S.P.E.C.I.A.L.</button>
            <button onclick="UI.renderStats('perks', event)" class="flex-1 py-3 uppercase font-vt323 text-xl ${getTabClass('perks')}">PERKS</button>
        `;
        scrollContainer.appendChild(header);

        const content = document.createElement('div');
        content.className = "w-full p-4";
        
        if (tab === 'stats') UI.renderCharacterVisuals(content);
        else if (tab === 'special') UI.renderSpecialStats(content);
        else if (tab === 'perks') UI.renderPerksList(content);

        scrollContainer.appendChild(content);
        wrapper.appendChild(scrollContainer);

        const footer = document.createElement('div');
        footer.className = "absolute bottom-0 left-0 w-full p-3 bg-black border-t-2 border-green-900 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.9)]";
        footer.innerHTML = `<button class="action-button w-full border-2 border-green-600 text-green-500 py-3 font-bold text-xl uppercase" onclick="UI.switchView('map')">ZURÜCK</button>`;
        wrapper.appendChild(footer);

        view.appendChild(wrapper);

        if (tab === 'stats') setTimeout(() => UI.drawVaultBoy('char-silhouette-canvas'), 100);
    },

    renderCharacterVisuals: function(container) {
        const p = Game.state; const eq = p.equip || {};
        const renderSlot = (slotName, item, iconFallback) => {
            const hasItem = !!item;
            const name = hasItem ? (item.props?.name || item.name) : "LEER";
            return `
                <div class="flex flex-col items-center justify-center p-2 border-2 ${hasItem ? 'border-green-500 bg-green-900/20' : 'border-green-900/50'} rounded min-h-[80px] z-10 relative cursor-pointer hover:bg-green-900/40 transition-colors" onclick="UI.openEquipMenu('${slotName}')">
                    <div class="text-[8px] uppercase opacity-50 mb-1 pointer-events-none">${slotName}</div>
                    <div class="text-2xl mb-1 pointer-events-none">${hasItem && item.icon ? item.icon : iconFallback}</div>
                    <div class="text-[9px] text-center font-bold truncate w-full pointer-events-none">${name}</div>
                </div>
            `;
        };
        
        let actionText = '<span class="ml-2 text-xs uppercase border border-green-700 px-1 rounded text-green-500 opacity-50">Details ▶</span>';
        let highlightClass = "";
        if ((p.statPoints || 0) > 0 || (p.perkPoints || 0) > 0) {
            actionText = '<span class="ml-2 text-xs uppercase border border-yellow-500 bg-yellow-900/40 px-1 rounded text-yellow-400 font-bold animate-pulse">LEVEL UP! ▶</span>';
            highlightClass = "border-yellow-500/50 bg-yellow-900/10 shadow-[0_0_15px_rgba(255,255,0,0.1)]"; 
        }

        container.innerHTML = `
            <div class="flex flex-col items-center gap-4 max-w-md mx-auto">
                <div class="text-center w-full border-b border-green-900 pb-2 cursor-pointer hover:bg-green-900/20 transition-all group rounded p-2 relative z-50 ${highlightClass}" onclick="UI.handleHeaderClick(event)">
                    <div class="text-4xl font-bold text-green-400 group-hover:text-yellow-400 transition-colors text-shadow-md pointer-events-none">${p.playerName}</div>
                    <div class="text-xs font-mono text-green-600 group-hover:text-green-300 mt-1 pointer-events-none">
                        LVL ${p.lvl} | XP: ${p.xp} / ${Game.expToNextLevel(p.lvl)}
                        ${actionText}
                    </div>
                </div>
                <div class="grid grid-cols-3 grid-rows-4 gap-2 w-full relative mt-2 z-10">
                    <div class="col-start-2 row-start-1">${renderSlot('head', eq.head, '🧢')}</div>
                    <div class="col-start-1 row-start-2">${renderSlot('weapon', eq.weapon, '👊')}</div>
                    <div class="col-start-2 row-start-2">${renderSlot('body', eq.body, '👕')}</div>
                    <div class="col-start-3 row-start-2">${renderSlot('arms', eq.arms, '💪')}</div>
                    <div class="col-start-2 row-start-3">${renderSlot('legs', eq.legs, '👖')}</div>
                    <div class="col-start-3 row-start-3">${renderSlot('back', eq.back, '🎒')}</div>
                    <div class="col-start-2 row-start-4">${renderSlot('feet', eq.feet, '🥾')}</div>
                    <div class="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-0">
                        <canvas id="char-silhouette-canvas" width="240" height="300"></canvas>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 w-full text-xs font-mono bg-green-900/10 p-3 rounded border border-green-900/50 mt-2 z-10">
                    <div class="flex justify-between border-b border-green-900/20 pb-1"><span>TP</span><span class="text-green-400 font-bold">${Math.round(p.hp)}/${p.maxHp}</span></div>
                    <div class="flex justify-between border-b border-green-900/20 pb-1"><span>DEF</span><span class="text-green-400 font-bold">${(typeof Game.getStat === 'function') ? Game.getStat('DEF') : 0}</span></div>
                    <div class="flex justify-between border-b border-green-900/20 pb-1"><span>KRIT</span><span class="text-green-400 font-bold">${p.critChance || 5}%</span></div>
                    <div class="flex justify-between border-b border-green-900/20 pb-1"><span>LOAD</span><span class="text-green-400 font-bold">${p.inventory?.length || 0}/${(typeof Game.getMaxSlots === 'function') ? Game.getMaxSlots() : 20}</span></div>
                </div>
            </div>
        `;
    },

    renderSpecialStats: function(container) {
        const stats = Game.state.stats || { STR:5, PER:5, END:5, INT:5, AGI:5, LUC:5 };
        const points = Game.state.statPoints || 0;
        const labels = window.GameData.statLabels || { STR: "STÄRKE", PER: "WAHRNEHMUNG", END: "AUSDAUER", INT: "INTELLIGENZ", AGI: "BEWEGLICHKEIT", LUC: "GLÜCK" };
        let html = `<div class="text-center mb-6"><div class="text-xs text-green-600 mb-2">VERFÜGBARE PUNKTE</div><div class="text-5xl font-bold ${points > 0 ? 'text-yellow-400' : 'text-gray-600'}">${points}</div></div><div class="space-y-3">`;
        for (let key in labels) {
            const val = stats[key] || 1;
            const cost = (val >= 10) ? 2 : 1;
            const canAfford = points >= cost;
            const isMaxed = val >= 20;
            let btnHtml = '';
            if (!isMaxed && canAfford) {
                 btnHtml = `<button onclick="Game.upgradeStat('${key}', event)" class="w-10 h-10 bg-green-900 text-green-400 border border-green-500 font-bold text-xl rounded hover:bg-green-500 hover:text-black">+</button>`;
            } else if (!isMaxed && !canAfford && points > 0) {
                 btnHtml = `<div class="w-10 h-10 flex items-center justify-center border border-red-900 text-red-700 font-bold bg-black opacity-50 cursor-not-allowed" title="Benötigt ${cost} Punkte">+</div>`;
            }
            html += `<div class="flex items-center justify-between bg-black/40 p-3 border border-green-900">
                <div class="flex flex-col"><span class="text-2xl font-bold text-green-400 font-vt323">${key}</span><span class="text-[10px] text-green-700">${labels[key]}</span></div>
                <div class="flex items-center gap-4"><span class="text-3xl font-bold text-white">${val}</span>${btnHtml}</div>
            </div>`;
        }
        container.innerHTML = html + '</div>';
    },

    renderPerksList: function(container) {
        const perks = window.GameData.perks || [];
        const myPerks = Game.state.perks || {};
        const points = Game.state.perkPoints || 0;
        let html = `<div class="text-center mb-6"><div class="text-xs text-green-600 mb-2">PERK-PUNKTE</div><div class="text-5xl font-bold ${points > 0 ? 'text-yellow-400' : 'text-gray-600'}">${points}</div></div><div class="space-y-3">`;
        perks.forEach(p => {
            const cur = myPerks[p.id] || 0;
            const maxLvl = p.max || 5;
            const canBuy = points > 0 && cur < maxLvl && Game.state.lvl >= (p.minLvl || 1);
            html += `<div class="p-3 border ${cur > 0 ? 'border-green-600 bg-green-900/10' : 'border-green-900/30'}">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-bold text-green-300 text-lg">${p.icon || ''} ${p.name}</div>
                        <div class="text-xs text-green-700">Rang: ${cur}/${maxLvl}</div>
                    </div>
                    <button class="px-3 py-1 border text-xs font-bold ${canBuy ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-600 hover:text-black' : 'border-gray-800 text-gray-600'}" ${canBuy ? `onclick="Game.choosePerk('${p.id}')"` : ''}>
                        ${cur >= maxLvl ? 'MAX' : 'LERNEN'}
                    </button>
                </div>
                <div class="text-xs text-gray-500 mt-1">${p.desc}</div>
            </div>`;
        });
        container.innerHTML = html + '</div>';
    },

    drawVaultBoy: function(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#1aff1a"; ctx.fillStyle = "#1aff1a"; ctx.lineWidth = 2.5;
        const cx = canvas.width / 2; const cy = canvas.height / 2;
        ctx.beginPath(); ctx.arc(cx, cy - 60, 30, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx - 10, cy - 85, 12, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-18, cy-30); ctx.lineTo(cx+18, cy-30); ctx.lineTo(cx+22, cy+30); ctx.lineTo(cx-22, cy+30); ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+18, cy-20); ctx.lineTo(cx+50, cy-40); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(cx-18, cy-20); ctx.lineTo(cx-40, cy); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(cx-12, cy+30); ctx.lineTo(cx-18, cy+85); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(cx+12, cy+30); ctx.lineTo(cx+18, cy+85); ctx.stroke(); 
        ctx.beginPath(); ctx.arc(cx - 10, cy - 65, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 10, cy - 65, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy - 60, 15, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    },

    renderCharacterSelection: function(saves) {
        this.charSelectMode = true; this.currentSaves = saves;
        if(this.els.loginScreen) this.els.loginScreen.style.display = 'none';
        if(this.els.charSelectScreen) this.els.charSelectScreen.style.display = 'flex';
        if(this.els.charSlotsList) this.els.charSlotsList.innerHTML = '';
        
        if (!this.deleteSaveSlot) {
            this.deleteSaveSlot = function(index) {
                if (typeof Game.deleteSave === 'function') Game.deleteSave(index);
                else {
                    localStorage.removeItem('save_' + index);
                    localStorage.removeItem('slot_' + index);
                    localStorage.removeItem('wasteland_save_' + index);
                    localStorage.removeItem('vault_save_' + index);
                }
                window.location.reload(); 
            };
        }

        for (let i = 0; i < 5; i++) {
            const slot = document.createElement('div');
            slot.className = "char-slot border-2 border-green-900 bg-black/80 p-4 mb-2 relative";
            const save = saves[i];
            
            if (save) {
                const isDead = (save.hp !== undefined && save.hp <= 0) || save.isGameOver === true;
                
                if (isDead) {
                    slot.className += " border-red-900 bg-red-950/20"; 
                    slot.innerHTML = `
                        <div class="flex justify-between items-center w-full">
                            <div class="flex flex-col z-10">
                                <span class="text-xl text-red-500 font-bold">☠️ ${save.playerName}</span>
                                <span class="text-xs text-red-400 font-mono">VERSTORBEN (Level ${save.lvl})</span>
                            </div>
                            <button onclick="event.stopPropagation(); UI.deleteSaveSlot(${i})" class="bg-red-900 text-white font-bold px-4 py-2 text-xs rounded hover:bg-red-600 transition-colors shadow-[0_0_10px_red]">
                                LÖSCHEN 🗑️
                            </button>
                        </div>
                    `;
                } else {
                    slot.className += " cursor-pointer hover:border-yellow-400 flex justify-between items-center group";
                    slot.innerHTML = `
                        <div class="flex flex-col z-10">
                            <span class="text-xl text-yellow-400 font-bold">👤 ${save.playerName}</span>
                            <span class="text-xs text-green-300 font-mono">Level ${save.lvl}</span>
                        </div>
                        <button class="bg-green-700 text-black font-bold px-4 py-1 text-xs rounded group-hover:bg-[#39ff14]">START ▶</button>
                    `;
                    slot.onclick = () => { if(typeof this.selectSlot === 'function') this.selectSlot(i); };
                }
            } else {
                slot.className += " cursor-pointer hover:border-yellow-400 flex justify-center items-center group";
                slot.innerHTML = `<div class="text-gray-500 font-bold group-hover:text-yellow-400">+ NEUEN CHARAKTER</div>`;
                slot.onclick = () => { if(typeof this.selectSlot === 'function') this.selectSlot(i); };
            }
            if(this.els.charSlotsList) this.els.charSlotsList.appendChild(slot);
        }
        
        if(typeof this.selectSlot === 'function') {
            if (saves[0] && ((saves[0].hp !== undefined && saves[0].hp <= 0) || saves[0].isGameOver)) {
                // Do nothing
            } else {
                this.selectSlot(0);
            }
        }
    },

    renderSpawnList: function(players) {
        if(!this.els.spawnList) return;
        this.els.spawnList.innerHTML = '';
        for(let pid in players) {
            const p = players[pid];
            const btn = document.createElement('button');
            btn.className = "action-button w-full mb-2 text-left text-xs border-green-800 text-green-400 p-2";
            btn.innerHTML = `SIGNAL: ${p.name}`;
            btn.onclick = () => { if(this.els.spawnScreen) this.els.spawnScreen.style.display = 'none'; this.startGame(null, this.selectedSlot, null); };
            this.els.spawnList.appendChild(btn);
        }
    },

    renderCombat: function() {
        this.applyVatsStyle();
    },

    // --- ABSOLUTER FIX: VOLLBILD-SKYLINE, KEIN GITTER, LIVE HP ---
    applyVatsStyle: function() {
        const enemy = Game.state ? Game.state.enemy : null; 
        if(!enemy) return;
        
        const nameEl = document.getElementById('enemy-name'); 
        if(!nameEl) return;

        // VERHINDERT ENDLOS-SCHLEIFE
        if (nameEl.dataset.vatsApplied === "true") {
            // Nur HP Updaten, wenn sich Werte geändert haben!
            const hpBar = document.getElementById('enemy-hp-bar'); 
            if(hpBar) {
                const currentHp = Math.max(0, Math.floor(enemy.hp));
                const pct = Math.max(0, (enemy.hp/enemy.maxHp)*100);
                let barColor = pct > 50 ? '#39ff14' : (pct > 20 ? '#eab308' : '#ef4444');
                
                hpBar.style.width = `${pct}%`;
                hpBar.style.backgroundColor = barColor;
                hpBar.style.boxShadow = `0 0 10px ${barColor}`;
                
                const parent = hpBar.parentElement;
                if(parent) {
                    const num = parent.querySelector('.vats-hp-num');
                    if(num) num.innerText = `${currentHp} / ${enemy.maxHp} TP`;
                }
            }
            return; 
        }
        
        nameEl.dataset.vatsApplied = "true";

        // 1. FINDE DEN ROOT-CONTAINER (Für den Vollbild-Hintergrund)
        let root = nameEl.closest('.fixed') || nameEl.closest('.absolute');
        if (!root) root = nameEl.parentElement.parentElement; 
        if(!root) return;

        // 2. TÖTE DAS GLOBALE GITTER
        root.style.backgroundColor = "#020802"; 
        root.style.backgroundImage = "none"; 
        
        // Aufräumen alter Skyline-Layer
        root.querySelectorAll('.vats-fx-layer').forEach(e => e.remove());

        // 3. MACH ALLE BOXEN TRANSPARENT (Damit man den Hintergrund sieht)
        root.querySelectorAll('.bg-black').forEach(el => {
            el.classList.remove('bg-black');
            el.style.backgroundColor = "transparent";
        });

        // 4. DIE NEUE, SAUBERE ECHTBILD-SKYLINE (SVG) EINBAUEN
        const fxBg = document.createElement('div');
        fxBg.className = "vats-fx-layer absolute inset-0 pointer-events-none flex flex-col justify-end overflow-hidden z-[0]";
        fxBg.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" preserveAspectRatio="none" class="w-full h-full opacity-40">
                <rect width="1000" height="500" fill="url(#skylineGlow)" />
                <path d="M0,500 L0,300 L50,300 L50,150 L80,150 L80,220 L150,220 L150,100 L200,100 L200,180 L250,180 L250,50 L300,50 L300,190 L380,190 L380,260 L450,260 L450,80 L520,80 L520,230 L600,230 L600,120 L680,120 L680,270 L750,270 L750,160 L850,160 L850,310 L950,310 L950,200 L1000,200 L1000,500 Z" fill="#041204" stroke="#39ff14" stroke-width="2"/>
                <rect x="160" y="150" width="12" height="20" fill="#39ff14" class="animate-pulse" />
                <rect x="260" y="100" width="10" height="15" fill="#39ff14" opacity="0.5" />
                <rect x="470" y="130" width="15" height="25" fill="#eab308" class="animate-pulse" />
                <rect x="700" y="190" width="18" height="12" fill="#39ff14" />
                <defs>
                    <linearGradient id="skylineGlow" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="transparent"/>
                        <stop offset="100%" stop-color="#0a2a0a" stop-opacity="0.9"/>
                    </linearGradient>
                </defs>
            </svg>
        `;
        root.insertBefore(fxBg, root.firstChild);

        // 5. ZIELNAME DESIGN
        nameEl.innerHTML = `<span class="text-[#39ff14] animate-pulse mr-2">TARGET:</span><span class="text-green-300 font-mono tracking-widest text-shadow-glow">${enemy.name.toUpperCase()}</span>`;
        nameEl.className = "text-xl md:text-3xl font-bold flex items-center justify-center w-full border-b-2 border-green-500 pb-2 pt-2 mb-3 z-[10] relative text-shadow-md";

        // 6. HP BAR MIT INTEGRIERTEN ZAHLEN
        const oldHpText = document.getElementById('enemy-hp-text');
        if (oldHpText) oldHpText.style.display = 'none';

        const hpBar = document.getElementById('enemy-hp-bar'); 
        if(hpBar) {
            const currentHp = Math.max(0, Math.floor(enemy.hp));
            const pct = Math.max(0, (enemy.hp/enemy.maxHp)*100);
            let barColor = pct > 50 ? '#39ff14' : (pct > 20 ? '#eab308' : '#ef4444');
            
            hpBar.style.width = `${pct}%`;
            hpBar.className = "h-full transition-all duration-500";
            hpBar.style.backgroundColor = barColor;
            hpBar.style.boxShadow = `0 0 10px ${barColor}`;
            
            const parent = hpBar.parentElement;
            if(parent) {
                // Etwas dunklerer Balken-Hintergrund, damit man ihn auf der Skyline sieht
                parent.className = "w-[90%] mx-auto max-w-sm bg-[#001000]/80 border-2 border-green-600 h-8 relative z-[10] overflow-hidden mb-6 shadow-[0_0_15px_rgba(0,255,0,0.1)]";
                
                parent.querySelectorAll('.vats-hp-overlay').forEach(e => e.remove());
                
                parent.insertAdjacentHTML('beforeend', `
                    <div class="vats-hp-overlay absolute inset-0 flex justify-center items-center pointer-events-none z-30">
                        <span class="vats-hp-num font-mono font-bold text-white text-base tracking-widest" style="text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;">
                            ${currentHp} / ${enemy.maxHp} TP
                        </span>
                    </div>
                    <div class="vats-hp-overlay absolute inset-0 flex justify-between pointer-events-none opacity-50 z-20">
                        <div class="h-full w-[2px] bg-black ml-[25%]"></div>
                        <div class="h-full w-[2px] bg-black ml-[25%]"></div>
                        <div class="h-full w-[2px] bg-black ml-[25%]"></div>
                    </div>
                `);
            }
        }

        // 7. ZIEL-BUTTONS IN V.A.T.S. OPTIK (Leicht Transparent für Skyline-Blick)
        if(typeof Combat !== 'undefined' && Combat.bodyParts) {
             Combat.bodyParts.forEach((part, index) => {
                 const btn = document.getElementById(`btn-vats-${index}`);
                 if(btn) {
                     const chance = (typeof Combat.calculateHitChance === 'function') ? Combat.calculateHitChance(index) : 0;
                     let textColor = chance > 65 ? 'text-[#39ff14]' : (chance > 35 ? 'text-yellow-400' : 'text-red-500');
                     let barColor = chance > 65 ? 'bg-[#39ff14]' : (chance > 35 ? 'bg-yellow-500' : 'bg-red-500');
                     let borderColor = chance > 65 ? 'border-[#39ff14]' : (chance > 35 ? 'border-yellow-500' : 'border-red-500');

                     // Unser EIGENER Klick-Blocker, der die Effekte triggert
                     btn.onclick = (e) => {
                         e.preventDefault();
                         UI.triggerVatsAttack(index, chance);
                     };

                     btn.className = `relative w-full max-w-sm mx-auto bg-[#001000]/60 border-2 border-green-900/50 p-3 mb-3 cursor-pointer group hover:bg-[#002000]/80 transition-all z-[10] shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-[2px]`;
                     
                     btn.innerHTML = `
                        <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${borderColor} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all -translate-x-1 -translate-y-1"></div>
                        <div class="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${borderColor} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all translate-x-1 -translate-y-1"></div>
                        <div class="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${borderColor} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all -translate-x-1 translate-y-1"></div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${borderColor} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all translate-x-1 translate-y-1"></div>
                        
                        <div class="pointer-events-none w-full h-full flex items-center justify-between px-2 relative z-20">
                            <div class="flex flex-col text-left w-[60%]">
                                <span class="text-2xl md:text-4xl font-bold text-green-600 uppercase tracking-widest group-hover:text-green-300 transition-colors text-shadow-md">${part.name}</span>
                                <div class="w-full h-1 bg-green-900/50 mt-1 border border-green-900/80">
                                    <div class="h-full ${barColor}" style="width: ${chance}%"></div>
                                </div>
                            </div>
                            <div class="font-mono font-bold ${textColor} text-4xl md:text-5xl drop-shadow-[0_0_8px_currentColor] flex items-start">
                                ${chance}<span class="text-xl mt-1 opacity-80">%</span>
                            </div>
                        </div>
                     `;
                 }
             });
        }
    },

    triggerVatsAttack: function(index, chance) {
        if (this._isAttacking) return;
        this._isAttacking = true;

        const nameEl = document.getElementById('enemy-name'); 
        const box = nameEl ? (nameEl.closest('.bg-black') || nameEl.parentElement) : null;
        const btn = document.getElementById(`btn-vats-${index}`);
        
        const enemyPreHp = Game.state.enemy ? Game.state.enemy.hp : 0;
        const playerPreHp = Game.state.hp;

        if(btn) btn.style.transform = "scale(1.05)";

        // Screen Shake
        if(box) { box.style.transform = "translate(2px, 3px) rotate(0.5deg)"; }
        
        setTimeout(() => {
            if(box) box.style.transform = "translate(-2px, -1px) rotate(-0.5deg)";
        }, 50);

        setTimeout(() => {
            if(box) box.style.transform = "translate(0px, 0px) rotate(0deg)";
        }, 200);

        setTimeout(() => {
            // Echte Engine auslösen -> Die Engine rechnet Schaden aus
            if(typeof Combat !== 'undefined') Combat.playerAttack(index);

            const enemyPostHp = Game.state.enemy ? Game.state.enemy.hp : 0;
            const playerPostHp = Game.state.hp;

            const dmgDealt = enemyPreHp - enemyPostHp;
            const dmgTaken = playerPreHp - playerPostHp;

            if (dmgTaken > 0) {
                this.spawnFloatingText(`-${Math.round(dmgTaken)} HP`, '#ef4444', 'bottom-[20%] left-1/2', box); 
                const dmgFlash = document.createElement('div');
                dmgFlash.className = "absolute inset-0 z-[4900] bg-red-600/30 pointer-events-none opacity-0 transition-opacity mix-blend-overlay";
                if(box) box.appendChild(dmgFlash);
                requestAnimationFrame(() => dmgFlash.style.opacity = "1");
                setTimeout(() => { dmgFlash.style.opacity = "0"; setTimeout(() => dmgFlash.remove(), 300); }, 100);
            }

            if (dmgDealt > 0) {
                this.spawnFloatingText(`-${Math.round(dmgDealt)} HP`, '#39ff14', 'top-[20%] right-[10%]', box); 
            } else if (Game.state.enemy && dmgDealt === 0) {
                this.spawnFloatingText(`MISSED!`, '#9ca3af', 'top-[20%] right-[10%]', box); 
            }

            if(btn) btn.style.transform = "scale(1)";
            
            // WICHTIG: Erlaubt das Update der HP Leiste im nächsten Tick!
            if(nameEl) nameEl.dataset.vatsApplied = "false";
            this.applyVatsStyle(); // Manuell nochmal aufrufen für die neuen HP-Werte

            this._isAttacking = false;
        }, 250);
    },

    spawnFloatingText: function(text, color, positionClasses, container) {
        if(!container) container = document.body;
        const floater = document.createElement('div');
        floater.className = `absolute ${positionClasses} z-[6000] font-mono font-bold text-3xl md:text-5xl pointer-events-none drop-shadow-[0_0_5px_#000]`;
        floater.style.color = color;
        floater.style.transform = "translate(-50%, -50%) scale(0.8)";
        floater.style.transition = "all 0.8s ease-out";
        floater.innerText = text;
        container.appendChild(floater);
        const driftX = (Math.random() - 0.5) * 40; 
        requestAnimationFrame(() => { floater.style.transform = `translate(calc(-50% + ${driftX}px), -80px) scale(1.1)`; floater.style.opacity = "0"; });
        setTimeout(() => floater.remove(), 800);
    }
});
