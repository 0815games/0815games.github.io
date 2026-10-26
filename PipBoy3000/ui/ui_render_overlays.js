// [2026-02-22 11:45:00] ui_render_overlays.js - Complete File + Ghost Town Psycho Horror

// GHOST TOWN WACHHUND: Überwacht permanent, ob der Spieler in der Geisterstadt steht
if (!window.ghostTownObserverInit) {
    window.ghostTownObserverInit = true;
    setInterval(() => {
        if(typeof Game !== 'undefined' && Game.state && Game.state.view === 'map' && !Game.state.inDialog) {
            let isGhost = false;
            
            // 1. Checken, ob die Zone so heißt
            if (Game.state.zone && (Game.state.zone.toLowerCase().includes('ghost') || Game.state.zone.toLowerCase().includes('geister'))) {
                isGhost = true;
            }
            
            // 2. Checken, ob der Spieler direkt auf dem 'G' Tile steht
            try {
                const t = Game.state.currentMap[Game.state.player.y][Game.state.player.x];
                if (t === 'G') isGhost = true;
            } catch(e) {}

            if (isGhost) {
                if(!UI._ghostTownActive) UI.startGhostTownEffects();
            } else {
                if(UI._ghostTownActive) UI.stopGhostTownEffects();
            }
        } else {
            if(UI._ghostTownActive) UI.stopGhostTownEffects();
        }
    }, 1000);
}

Object.assign(UI, {
    
    restoreOverlay: function() {
        let overlay = document.getElementById('ui-dialog-overlay');
        if(!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ui-dialog-overlay';
            overlay.className = "absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm hidden pointer-events-auto";
            document.body.appendChild(overlay);
            this.els.dialog = overlay;
        }
        
        overlay.onclick = (e) => {
            if(e.target === overlay) {
                e.preventDefault();
                e.stopPropagation();
                UI.leaveDialog();
            }
        };
        
        return overlay;
    },

    leaveDialog: function() {
        if(Game.state) Game.state.inDialog = false;
        
        if(this._activeEscHandler) {
            document.removeEventListener('keydown', this._activeEscHandler);
            this._activeEscHandler = null;
        }
        
        const overlay = this.els.dialog || document.getElementById('ui-dialog-overlay');
        if(overlay) {
            overlay.style.display = 'none';
            overlay.innerHTML = ''; 
        }
        
        if(typeof this.update === 'function') this.update();
        
        if(document.getElementById('inventory-list')) {
            if(typeof UI.renderInventory === 'function') UI.renderInventory();
        }
    },

    _trapEscKey: function() {
        if(this._activeEscHandler) document.removeEventListener('keydown', this._activeEscHandler);
        
        this._activeEscHandler = (e) => {
            if(e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                UI.leaveDialog();
            }
        };
        document.addEventListener('keydown', this._activeEscHandler);
    },

    updateQuestTracker: function() { 
        return; // Leerer Dummy, damit keine Fehler geworfen werden. Zeichnen übernimmt jetzt das Canvas!
    },

    showConfirm: function(title, htmlContent, onConfirm) {
        if(Game.state) Game.state.inDialog = true;

        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();

        const box = document.createElement('div');
        box.className = "bg-black border-2 border-yellow-400 p-4 shadow-[0_0_20px_#aa0] max-w-md w-full relative animate-float-in pointer-events-auto mx-4";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <h2 class="text-2xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2 tracking-widest">${title}</h2>
            <div class="text-green-300 mb-6 font-mono text-sm leading-relaxed">${htmlContent}</div>
            <div class="flex gap-4">
                <button id="btn-confirm-yes" class="action-button flex-1 border-green-500 text-green-500 hover:bg-green-900 font-bold py-2">BESTÄTIGEN</button>
                <button id="btn-confirm-no" class="action-button flex-1 border-red-500 text-red-500 hover:bg-red-900 font-bold py-2">ABBRUCH</button>
            </div>
        `;

        overlay.appendChild(box);

        document.getElementById('btn-confirm-yes').onclick = () => {
            UI.leaveDialog();
            if (onConfirm) onConfirm();
        };

        document.getElementById('btn-confirm-no').onclick = () => {
            UI.leaveDialog();
        };
    },

    showInfoDialog: function(title, htmlContent) {
        if(Game.state) Game.state.inDialog = true;

        const infoOverlay = document.createElement('div');
        infoOverlay.className = "fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn pointer-events-auto";
        
        const box = document.createElement('div');
        box.className = "bg-black border-2 border-yellow-400 p-4 shadow-[0_0_20px_#aa0] max-w-md w-full relative animate-float-in pointer-events-auto mx-4";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <h2 class="text-2xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2">${title}</h2>
            <div class="text-green-300 mb-6 font-mono text-sm max-h-[60vh] overflow-y-auto custom-scroll">${htmlContent}</div>
        `;

        const btn = document.createElement('button');
        btn.className = "action-button w-full border-green-500 text-green-500 hover:bg-green-900";
        btn.textContent = "VERSTANDEN";
        
        const closeLayer2 = (e) => {
            if(e) { e.preventDefault(); e.stopPropagation(); }
            infoOverlay.remove();
            
            const baseOverlay = document.getElementById('ui-dialog-overlay');
            const isBaseOpen = baseOverlay && baseOverlay.style.display !== 'none';
            
            if(!isBaseOpen) {
                if(Game.state) Game.state.inDialog = false;
            }
        };

        btn.onclick = closeLayer2;
        infoOverlay.onclick = (e) => { if(e.target === infoOverlay) closeLayer2(e); };

        box.appendChild(btn);
        infoOverlay.appendChild(box);
        document.body.appendChild(infoOverlay);
    },

    showItemConfirm: function(invIndex) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        if(!Game.state.inventory || !Game.state.inventory[invIndex]) return;
        const invItem = Game.state.inventory[invIndex];
        const item = Game.items[invItem.id];
        
        if(!item) return;
        if(Game.state) Game.state.inDialog = true;
        
        const box = document.createElement('div');
        box.className = "bg-black border-2 border-green-500 p-4 shadow-[0_0_15px_green] max-w-sm text-center mb-4 w-full pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        const isStimpack = (invItem.id && invItem.id.toLowerCase().includes('stimpack')) || (item.name && item.name.toLowerCase().includes('stimpack'));

        if (isStimpack) {
             box.innerHTML = `
                <h2 class="text-xl font-bold text-green-400 mb-2 border-b border-green-500 pb-2">${item.name}</h2>
                <div class="text-xs text-green-200 mb-4 bg-green-900/20 p-2">
                    <div class="flex justify-between"><span>TP Aktuell:</span> <span class="text-white font-bold">${Math.floor(Game.state.hp)} / ${Game.state.maxHp}</span></div>
                    <div class="flex justify-between"><span>Verfügbar:</span> <span class="text-yellow-400 font-bold">${invItem.count} Stück</span></div>
                </div>
                
                <div class="flex flex-col gap-3 w-full">
                    <button id="btn-use-one" class="action-button border-green-500 text-green-500 hover:bg-green-900 py-3 font-bold flex justify-between px-4">
                        <span>1x BENUTZEN</span>
                        <span class="text-xs mt-1 text-green-300">+${item.val} HP</span>
                    </button>
                    <button id="btn-use-max" class="action-button border-blue-500 text-blue-400 hover:bg-blue-900 py-3 font-bold flex justify-between px-4">
                        <span>AUTO-HEAL (MAX)</span>
                        <span class="text-xs mt-1 text-blue-200">Bis voll</span>
                    </button>
                    <button id="btn-cancel" class="action-button border-red-500 text-red-500 hover:bg-red-900 py-2 font-bold mt-2">
                        ABBRUCH
                    </button>
                </div>
            `;
            overlay.appendChild(box);
            
            document.getElementById('btn-use-one').onclick = () => { Game.useItem(invIndex, 1); setTimeout(() => UI.leaveDialog(), 50); };
            document.getElementById('btn-use-max').onclick = () => { Game.useItem(invIndex, 'max'); setTimeout(() => UI.leaveDialog(), 50); };
            document.getElementById('btn-cancel').onclick = () => { UI.leaveDialog(); };
            return;
        }

        let statsText = "";
        let displayName = item.name;
        
        if(invItem.props) {
            displayName = invItem.props.name;
            if(invItem.props.dmgMult) statsText = `Schaden: ${Math.floor(item.baseDmg * invItem.props.dmgMult)} (Mod)`;
        } else {
            if(item.type === 'consumable') statsText = `Effekt: ${item.effect} (${item.val})`;
            else if(item.type === 'weapon') statsText = `Schaden: ${item.baseDmg}`;
            else if(item.type === 'body') statsText = `Rüstung: +${item.bonus ? item.bonus.END : 0} END`;
            else if(item.type === 'junk' || item.type === 'component') statsText = "Material / Schrott";
            else statsText = item.desc || "Item";
        }

        const isUsable = !['junk', 'component', 'misc', 'rare', 'ammo'].includes(item.type);

        box.innerHTML = `
            <h2 class="text-xl font-bold text-green-400 mb-2">${displayName}</h2>
            <div class="text-xs text-green-200 mb-4 border-t border-b border-green-900 py-2">Typ: ${item.type.toUpperCase()}<br>Wert: ${item.cost} KK<br><span class="text-yellow-400">${statsText}</span></div>
            <p class="text-green-200 mb-4 text-sm">${isUsable ? "Gegenstand benutzen oder wegwerfen?" : "Dieses Item kann nur verkauft oder zum Craften verwendet werden."}</p>
        `;
        
        const btnContainer = document.createElement('div');
        btnContainer.className = "flex flex-col gap-2 w-full mt-2";
        
        if (isUsable) {
            const btnYes = document.createElement('button');
            btnYes.className = "border border-green-500 text-green-500 hover:bg-green-900 px-4 py-3 font-bold w-full text-lg";
            btnYes.textContent = "BENUTZEN / AUSRÜSTEN";
            btnYes.onclick = () => { Game.useItem(invIndex); setTimeout(() => UI.leaveDialog(), 50); };
            btnContainer.appendChild(btnYes);
        }
        
        const row = document.createElement('div');
        row.className = "flex gap-2 w-full";
        
        const btnTrash = document.createElement('button');
        btnTrash.className = "border border-red-500 text-red-500 hover:bg-red-900 px-4 py-2 font-bold flex-1";
        btnTrash.innerHTML = "WEGWERFEN 🗑️";
        btnTrash.onclick = () => { Game.destroyItem(invIndex); setTimeout(() => UI.leaveDialog(), 50); };
        
        const btnNo = document.createElement('button');
        btnNo.className = "border border-gray-600 text-gray-500 hover:bg-gray-800 px-4 py-2 font-bold flex-1";
        btnNo.textContent = "ABBRUCH";
        btnNo.onclick = () => { UI.leaveDialog(); };
        
        row.appendChild(btnTrash);
        row.appendChild(btnNo);
        btnContainer.appendChild(row);
        
        box.appendChild(btnContainer); 
        overlay.appendChild(box);
    },

    showEquippedDialog: function(slot) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        if(Game.state) Game.state.inDialog = true;

        const item = Game.state.equip[slot];
        const name = item.props ? item.props.name : item.name;

        const box = document.createElement('div');
        box.className = "bg-black border-2 border-yellow-500 p-4 shadow-[0_0_15px_#aa0] max-w-sm text-center mb-4 w-full pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <div class="text-xs text-yellow-600 font-bold tracking-widest mb-1">SLOT: ${slot.toUpperCase()}</div>
            <h2 class="text-xl font-bold text-yellow-400 mb-4 border-b border-yellow-500 pb-2">${name}</h2>
            <div class="flex flex-col gap-2 w-full">
                <button id="btn-unequip" class="action-button w-full border-yellow-500 text-yellow-500 hover:bg-yellow-900 py-3 font-bold">
                    ABLEGEN (INS INVENTAR)
                </button>
                <button id="btn-cancel-eq" class="action-button border-gray-600 text-gray-500 hover:bg-gray-800 py-2 font-bold mt-2">
                    ABBRUCH
                </button>
            </div>
        `;
        overlay.appendChild(box);

        document.getElementById('btn-unequip').onclick = () => { Game.unequipItem(slot); setTimeout(() => UI.leaveDialog(), 50); };
        document.getElementById('btn-cancel-eq').onclick = () => { UI.leaveDialog(); };
    },

    showQuestComplete: function(questDef) {
        let container = document.getElementById('hud-quest-overlay');
        if(!container) {
             const view = document.getElementById('game-screen'); 
             if(!view) return;
             container = document.createElement('div');
             container.id = 'hud-quest-overlay';
             container.className = "fixed top-24 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[100] w-full max-w-sm";
             view.appendChild(container);
        }

        const msg = document.createElement('div');
        msg.className = "w-full bg-black/95 border-2 border-yellow-400 p-4 shadow-[0_0_30px_rgba(255,215,0,0.6)] mb-4 text-center transform transition-all duration-700 scale-0 opacity-0";
        
        let rewardItems = "";
        if(questDef.reward?.items) {
            rewardItems = questDef.reward.items.map(it => `<div>📦 ${it.c || 1}x ${Game.items[it.id]?.name || it.id}</div>`).join("");
        }

        msg.innerHTML = `
            <div class="text-yellow-500 font-bold tracking-[0.2em] text-[10px] mb-1 animate-pulse">QUEST ERFÜLLT</div>
            <div class="text-2xl font-bold text-white mb-3 uppercase tracking-tighter shadow-black text-shadow-lg">${questDef.title}</div>
            <div class="flex flex-col gap-1 py-2 border-t border-yellow-900/50 bg-yellow-900/10 font-mono text-xs">
                ${questDef.reward?.xp ? `<div class="text-cyan-400">⚡ +${questDef.reward.xp} XP</div>` : ""}
                ${questDef.reward?.caps ? `<div class="text-yellow-400">💰 +${questDef.reward.caps} KK</div>` : ""}
                ${rewardItems}
            </div>
            <div class="absolute -inset-1 bg-yellow-400/5 animate-ping rounded-lg pointer-events-none"></div>
        `;

        container.appendChild(msg);

        requestAnimationFrame(() => {
            msg.classList.remove('scale-0', 'opacity-0');
            msg.classList.add('scale-100', 'opacity-100');
        });

        setTimeout(() => {
            msg.classList.add('translate-y-[-20px]', 'opacity-0', 'scale-90');
            setTimeout(() => msg.remove(), 700);
        }, 4500);
    },

    showMapLegend: function() {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        const box = document.createElement('div');
        box.className = "bg-black border-4 border-green-500 p-6 shadow-[0_0_30px_green] max-w-sm w-full relative pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        const item = (icon, text, color) => `
            <div class="flex items-center gap-4 mb-3 border-b border-green-900/30 pb-1 last:border-0">
                <span class="text-2xl w-10 text-center filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" style="color: ${color}">${icon}</span>
                <span class="text-green-300 font-mono text-sm tracking-wide uppercase">${text}</span>
            </div>`;

        box.innerHTML = `
            <h2 class="text-2xl font-bold text-green-500 mb-6 border-b-2 border-green-500 pb-2 tracking-widest text-center">KARTEN LEGENDE</h2>
            <div class="flex flex-col space-y-1">
                ${item('🟢', 'DEINE POSITION', '#39ff14')}
                ${item('⚙️', 'VAULT 101 (SICHER)', '#ffff00')}
                ${item('🏙️', 'RUSTY SPRINGS (STADT)', '#00ffff')}
                ${item('👻', 'GHOST TOWN (VERLASSEN)', '#cccccc')}
                ${item('🏰', 'MILITÄRBASIS (LVL 10+)', '#ff5555')}
                ${item('☠️', 'RAIDER FESTUNG (LVL 5+)', '#ffaa00')}
                ${item('📡', 'FUNKTURM (THE PITT)', '#55ff55')}
            </div>
            <button class="action-button w-full mt-6 border-green-500 text-green-500 font-bold hover:bg-green-900" onclick="UI.leaveDialog()">SCHLIESSEN</button>
        `;
        overlay.appendChild(box);
    },

    showHighscoreBoard: async function() {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        if(Game.state) Game.state.inDialog = true;
        this._trapEscKey();

        overlay.innerHTML = `
            <div class="flex flex-col items-center justify-center p-6 border-2 border-green-500 bg-black shadow-[0_0_20px_green] pointer-events-auto" onclick="event.stopPropagation()">
                <div class="text-green-500 animate-pulse text-2xl mb-6">EMPFANGE DATEN...</div>
                <button class="action-button border-red-500 text-red-500 w-full" onclick="UI.leaveDialog()">ABBRECHEN</button>
            </div>`;

        try {
            const scores = await Network.getHighscores();
            if(!scores) throw new Error("Keine Daten empfangen.");

            scores.sort((a,b) => b.lvl - a.lvl || b.xp - a.xp);

            const box = document.createElement('div');
            box.className = "bg-black border-4 border-green-600 p-4 shadow-[0_0_30px_green] w-full max-w-2xl max-h-[90%] flex flex-col relative pointer-events-auto";
            box.onclick = (e) => e.stopPropagation();

            const closeBtn = document.createElement('button');
            closeBtn.className = "absolute top-2 right-2 text-green-500 text-xl border border-green-500 px-3 hover:bg-green-900 font-bold z-50";
            closeBtn.textContent = "X";
            closeBtn.onclick = function() { UI.leaveDialog(); }; 
            
            box.innerHTML = `
                <h2 class="text-3xl font-bold text-green-400 mb-4 text-center border-b-2 border-green-600 pb-2 tracking-widest shrink-0">VAULT LEGENDS</h2>
                <div class="flex justify-between mb-2 text-xs text-green-300 uppercase font-bold px-2 shrink-0">
                    <span class="w-8">#</span>
                    <span class="w-1/3 cursor-pointer hover:text-white" onclick="UI.renderHighscoreList(this.dataset.scores, 'name')">NAME</span>
                    <span class="w-16 text-right cursor-pointer hover:text-white" onclick="UI.renderHighscoreList(this.dataset.scores, 'lvl')">LVL</span>
                    <span class="w-16 text-right cursor-pointer hover:text-white" onclick="UI.renderHighscoreList(this.dataset.scores, 'kills')">KILLS</span>
                    <span class="w-24 text-right cursor-pointer hover:text-white" onclick="UI.renderHighscoreList(this.dataset.scores, 'xp')">EXP</span>
                </div>
                <div id="highscore-list" class="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 border-b border-green-900/50 mb-2"></div>
                <div class="text-[10px] text-center text-green-800 shrink-0">ESC / KLICK NEBEN FENSTER ZUM SCHLIESSEN</div>
            `;
            box.appendChild(closeBtn);

            const listContainer = box.querySelector('#highscore-list');
            if(listContainer) listContainer.dataset.rawScores = JSON.stringify(scores);
            
            this.renderHighscoreList = (sortBy) => {
                const container = document.getElementById('highscore-list');
                if(!container) return;
                let data = JSON.parse(container.dataset.rawScores);
                
                if(sortBy === 'name') data.sort((a,b) => a.name.localeCompare(b.name));
                else if(sortBy === 'lvl') data.sort((a,b) => b.lvl - a.lvl || b.xp - a.xp);
                else if(sortBy === 'kills') data.sort((a,b) => b.kills - a.kills || b.lvl - a.lvl);
                else if(sortBy === 'xp') data.sort((a,b) => b.xp - a.xp);

                container.innerHTML = '';
                data.forEach((entry, idx) => {
                    const isDead = entry.status === 'dead';
                    const isTop3 = idx < 3;
                    
                    let rowClass = "flex justify-between items-center py-2 border-b border-green-900/30 text-lg ";
                    if(isTop3) rowClass += "text-yellow-400 font-bold bg-yellow-900/10 ";
                    else if(isDead) rowClass += "text-gray-500 italic ";
                    else rowClass += "text-green-400 ";

                    const icon = isDead ? '❌' : (isTop3 ? '🏆' : '');
                    const nameDisplay = `${icon} ${entry.name}`;

                    const row = document.createElement('div');
                    row.className = rowClass;
                    row.innerHTML = `
                        <span class="w-8 opacity-50">${idx+1}</span>
                        <span class="w-1/3 truncate">${nameDisplay}</span>
                        <span class="w-16 text-right">${entry.lvl}</span>
                        <span class="w-16 text-right">${entry.kills}</span>
                        <span class="w-24 text-right font-mono text-sm opacity-80">${entry.xp}</span>
                    `;
                    container.appendChild(row);
                });
            };

            overlay.innerHTML = '';
            overlay.appendChild(box);
            this.renderHighscoreList('lvl');

        } catch(e) {
            let msg = e.message;
            if(msg && msg.toLowerCase().includes("permission_denied")) {
                msg = "ZUGRIFF VERWEIGERT: FIREBASE REGELN BLOCKIEREN 'leaderboard'.";
            }
            overlay.innerHTML = `
                <div class="border-2 border-red-500 bg-black p-6 text-center shadow-[0_0_20px_red] pointer-events-auto" onclick="event.stopPropagation()">
                    <div class="text-red-500 font-bold text-2xl mb-4 tracking-widest">NETZWERK FEHLER</div>
                    <div class="text-green-400 font-mono mb-6">${msg}</div>
                    <button class="action-button w-full border-red-500 text-red-500" onclick="UI.leaveDialog()">SCHLIESSEN</button>
                </div>
            `;
        }
    },

    showShopConfirm: function(itemKey) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        const item = Game.items[itemKey];
        if(!item) return;

        if(Game.state) Game.state.inDialog = true;
        
        let statsText = "";
        let typeLabel = item.type.toUpperCase();
        if(item.type === 'consumable') { statsText = `Effekt: ${item.effect} (${item.val})`; typeLabel = "VERBRAUCHSGEGENSTAND"; } 
        else if(item.type === 'weapon') { statsText = `Schaden: ${item.baseDmg}`; typeLabel = "WAFFE"; } 
        else if(item.type === 'body') { const bonus = item.bonus ? Object.entries(item.bonus).map(([k,v]) => `+${v} ${k}`).join(', ') : 'Keine'; statsText = `Rüstung: ${bonus}`; typeLabel = "KLEIDUNG / RÜSTUNG"; } 
        else if(item.type === 'junk' || item.type === 'component') { statsText = "Material für Handwerk"; typeLabel = "SCHROTT / MATERIAL"; } 
        else if(item.type === 'tool' || item.type === 'blueprint') { statsText = "Bauplan / Werkzeug"; typeLabel = "AUSRÜSTUNG"; }

        const canAfford = Game.state.caps >= item.cost;
        const costColor = canAfford ? "text-yellow-400" : "text-red-500";

        const box = document.createElement('div');
        box.className = "bg-black border-2 border-green-500 p-4 shadow-[0_0_15px_green] max-w-sm text-center mb-4 w-full pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <div class="border-b border-green-500 pb-2 mb-2">
                <h2 class="text-xl font-bold text-green-400">${item.name}</h2>
                <div class="text-[10px] text-green-600 tracking-widest">${typeLabel}</div>
            </div>
            <div class="text-sm text-green-200 mb-4 bg-green-900/20 p-3 text-left">
                <div class="mb-1 text-xs italic text-green-400">${item.desc || "Standard Ausrüstung."}</div>
                <div class="w-full h-px bg-green-900/50 my-2"></div>
                <div class="font-bold text-yellow-200">${statsText}</div>
            </div>
            <div class="flex justify-between items-center bg-black border border-green-900 p-2 mb-4">
                <span class="text-xs text-gray-400">PREIS:</span>
                <span class="font-mono font-bold text-xl ${costColor}">${item.cost} KK</span>
            </div>
            <div class="flex flex-col gap-2 w-full">
                <button id="btn-buy" class="action-button border-green-500 text-green-500 hover:bg-green-900 py-3 font-bold" ${!canAfford ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    ${canAfford ? 'KAUFEN' : 'ZU TEUER'}
                </button>
                <button id="btn-cancel" class="action-button border-red-500 text-red-500 hover:bg-red-900 py-2 font-bold">
                    ABBRUCH
                </button>
            </div>
        `;
        
        overlay.appendChild(box);
        
        const btnBuy = document.getElementById('btn-buy');
        if(canAfford && btnBuy) {
            btnBuy.onclick = () => { 
                Game.buyItem(itemKey); 
                UI.leaveDialog(); 
            };
        }
        
        document.getElementById('btn-cancel').onclick = () => UI.leaveDialog();
    },

    showDungeonWarning: function(callback) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();

        if(Game.state) Game.state.inDialog = true;
        
        const box = document.createElement('div');
        box.className = "bg-black border-2 border-red-600 p-4 shadow-[0_0_20px_red] max-w-sm text-center animate-pulse mb-4 pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <h2 class="text-3xl font-bold text-red-600 mb-2 tracking-widest">⚠️ WARNING ⚠️</h2>
            <p class="text-red-400 mb-4 font-bold">HOHE GEFAHR!<br>Sicher, dass du eintreten willst?</p>
        `;
        const btnContainer = document.createElement('div');
        btnContainer.className = "flex gap-2 justify-center w-full";
        const btnYes = document.createElement('button');
        btnYes.className = "border border-red-500 text-red-500 hover:bg-red-900 px-4 py-2 font-bold w-full";
        btnYes.textContent = "BETRETEN";
        btnYes.onclick = () => { UI.leaveDialog(); if(callback) callback(); };
        const btnNo = document.createElement('button');
        btnNo.className = "border border-green-500 text-green-500 hover:bg-green-900 px-4 py-2 font-bold w-full";
        btnNo.textContent = "FLUCHT";
        btnNo.onclick = () => { UI.leaveDialog(); };
        btnContainer.appendChild(btnYes); btnContainer.appendChild(btnNo);
        box.appendChild(btnContainer); overlay.appendChild(box);
    },

    showWastelandGamble: function(callback) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        
        if(Game.state) Game.state.inDialog = true;
        
        overlay.onclick = null; 

        const box = document.createElement('div');
        box.className = "bg-black border-4 border-yellow-500 p-6 shadow-[0_0_40px_gold] max-w-sm text-center relative overflow-hidden pointer-events-auto";
        
        const bg = document.createElement('div');
        bg.className = "absolute inset-0 bg-yellow-900/20 z-0 pointer-events-none";
        box.appendChild(bg);
        
        box.innerHTML += `
            <h2 class="text-2xl font-bold text-yellow-400 mb-2 tracking-widest relative z-10">WASTELAND GAMBLE</h2>
            <p class="text-green-300 text-xs mb-4 relative z-10">Würfle um dein Schicksal!</p>
            
            <div id="dice-container" class="flex justify-center gap-4 mb-6 relative z-10">
                <div id="die-1" class="w-12 h-12 border-2 border-yellow-400 flex items-center justify-center text-3xl font-bold bg-black text-yellow-400 shadow-lg">?</div>
                <div id="die-2" class="w-12 h-12 border-2 border-yellow-400 flex items-center justify-center text-3xl font-bold bg-black text-yellow-400 shadow-lg">?</div>
                <div id="die-3" class="w-12 h-12 border-2 border-yellow-400 flex items-center justify-center text-3xl font-bold bg-black text-yellow-400 shadow-lg">?</div>
            </div>
            
            <button id="btn-roll" class="action-button w-full border-green-500 text-green-500 font-bold text-xl py-3 hover:bg-green-900 relative z-10">WÜRFELN!</button>
        `;
        
        overlay.appendChild(box);
        
        const btnRoll = document.getElementById('btn-roll');
        btnRoll.onclick = () => {
            btnRoll.disabled = true;
            btnRoll.textContent = "ROLLING...";
            
            let rolls = 0;
            const maxRolls = 20;
            const interval = setInterval(() => {
                const d1 = Math.floor(Math.random() * 6) + 1;
                const d2 = Math.floor(Math.random() * 6) + 1;
                const d3 = Math.floor(Math.random() * 6) + 1;
                document.getElementById('die-1').textContent = d1;
                document.getElementById('die-2').textContent = d2;
                document.getElementById('die-3').textContent = d3;
                rolls++;
                
                if(rolls >= maxRolls) {
                    clearInterval(interval);
                    const sum = parseInt(document.getElementById('die-1').textContent) + 
                                parseInt(document.getElementById('die-2').textContent) + 
                                parseInt(document.getElementById('die-3').textContent);
                    
                    btnRoll.textContent = `SUMME: ${sum}`;
                    btnRoll.classList.add('animate-pulse');
                    setTimeout(() => {
                        UI.leaveDialog();
                        callback(sum);
                    }, 1500);
                }
            }, 50);
        };
    },

    showDungeonLocked: function(minutesLeft) {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        this._trapEscKey();
        
        if(Game.state) Game.state.inDialog = true;

        const box = document.createElement('div');
        box.className = "bg-black border-2 border-gray-600 p-4 shadow-[0_0_20px_gray] max-w-sm text-center mb-4 pointer-events-auto";
        box.onclick = (e) => e.stopPropagation();

        box.innerHTML = `
            <h2 class="text-3xl font-bold text-gray-400 mb-2 tracking-widest">🔒 LOCKED</h2>
            <p class="text-gray-300 mb-4 font-bold">Dieses Gebiet ist versiegelt.<br>Versuche es in ${minutesLeft} Minuten wieder.</p>
        `;
        const btn = document.createElement('button');
        btn.className = "border border-gray-500 text-gray-500 hover:bg-gray-900 px-4 py-2 font-bold w-full";
        btn.textContent = "VERSTANDEN";
        btn.onclick = () => UI.leaveDialog();
        box.appendChild(btn); overlay.appendChild(box);
    },

    showDungeonVictory: function(caps, lvl) {
        const overlay = document.createElement('div');
        overlay.id = "victory-overlay";
        overlay.className = "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 animate-fadeIn pointer-events-auto";
        
        overlay.innerHTML = `
            <div class="bg-black border-4 border-yellow-400 p-6 shadow-[0_0_30px_gold] max-w-md text-center mb-4 relative" onclick="event.stopPropagation()">
                <div class="text-6xl mb-2">👑⚔️</div>
                <h2 class="text-4xl font-bold text-yellow-400 mb-2 tracking-widest text-shadow-gold">VICTORY!</h2>
                <p class="text-yellow-200 mb-4 font-bold text-lg">DUNGEON (LVL ${lvl}) GECLEARED!</p>
                <div class="text-2xl text-white font-bold border-t border-b border-yellow-500 py-2 mb-4 bg-yellow-900/30">+${caps} KRONKORKEN</div>
                <p class="text-xs text-yellow-600 mb-4">Komme in 10 Minuten wieder!</p>
                <button id="btn-victory-close" class="action-button w-full border-yellow-500 text-yellow-500 font-bold hover:bg-yellow-900">ZURÜCK ZUR KARTE</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        if(Game.state) Game.state.inDialog = true;
        
        const btn = document.getElementById('btn-victory-close');
        if(btn) {
            btn.onclick = () => {
                const el = document.getElementById('victory-overlay');
                if(el) el.remove();
                if(Game.state) Game.state.inDialog = false;
                UI.leaveDialog(); 
            };
            btn.focus();
        }
    },
    
    showPermadeathWarning: function() {
        const overlay = this.restoreOverlay();
        overlay.style.display = 'flex';
        overlay.innerHTML = '';
        
        if(Game.state) Game.state.inDialog = true;
        
        overlay.onclick = null; 

        const box = document.createElement('div');
        box.className = "bg-black border-4 border-red-600 p-6 shadow-[0_0_50px_red] max-w-lg text-center animate-pulse pointer-events-auto";
        box.innerHTML = `
            <div class="text-6xl text-red-600 mb-4 font-bold">☠️</div>
            <h1 class="text-4xl font-bold text-red-600 mb-4 tracking-widest border-b-2 border-red-600 pb-2">PERMADEATH AKTIV</h1>
            <p class="text-red-400 font-mono text-lg mb-6 leading-relaxed">WARNUNG, BEWOHNER!<br>Das Ödland kennt keine Gnade.<br>Wenn deine HP auf 0 fallen, wird dieser Charakter<br><span class="font-bold text-white bg-red-900 px-1">DAUERHAFT GELÖSCHT</span>.</p>
            <button class="action-button w-full border-red-600 text-red-500 font-bold py-4 text-xl hover:bg-red-900" onclick="UI.leaveDialog()">ICH HABE VERSTANDEN</button>
        `;
        overlay.appendChild(box);
    },

    showGameOver: function() {
        if(this.els.gameOver) this.els.gameOver.classList.remove('hidden');
        if(typeof Network !== 'undefined' && Game.state) Network.registerDeath(Game.state);
        this.toggleControls(false);

        if (Game && Game.state) {
            Game.state.hp = 0;
            Game.state.isGameOver = true;
            
            if (typeof Game.deleteSave === 'function') {
                Game.deleteSave(UI.selectedSlot || 0);
            } else if (window.localStorage) {
                const slot = UI.selectedSlot !== undefined ? UI.selectedSlot : 0;
                localStorage.removeItem('save_' + slot);
                localStorage.removeItem('slot_' + slot);
                localStorage.removeItem('wasteland_save_' + slot);
                localStorage.removeItem('vault_save_' + slot);
            }
            
            if(typeof UI.log === 'function') {
                UI.log("☠️ PERMADEATH: Dein Spielstand wurde ausgelöscht.", "text-red-500 font-bold text-xl");
            }
        }
    },
    
    showManualOverlay: async function() {
        const overlay = document.getElementById('manual-overlay');
        const content = document.getElementById('manual-content');
        if(this.els.navMenu) { this.els.navMenu.classList.add('hidden'); this.els.navMenu.style.display = 'none'; }
        if(overlay && content) {
            content.innerHTML = '<div class="text-center animate-pulse">Lade Handbuch...</div>';
            overlay.style.display = 'flex'; overlay.classList.remove('hidden');
            const verDisplay = document.getElementById('version-display'); 
            const ver = verDisplay ? verDisplay.textContent.trim() : Date.now();
            try { 
                const res = await fetch(`readme.md?v=${ver}`); 
                if (!res.ok) throw new Error("Manual not found"); 
                let text = await res.text(); 
                text = text.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-yellow-400 mb-2 border-b border-yellow-500">$1</h1>');
                text = text.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-green-400 mt-4 mb-2">$1</h2>');
                text = text.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-green-300 mt-2 mb-1">$1</h3>');
                text = text.replace(/\*\*(.*)\*\*/gim, '<b>$1</b>');
                text = text.replace(/\n/gim, '<br>');
                text += '<br><button class="action-button w-full mt-4 border-red-500 text-red-500" onclick="document.getElementById(\'manual-overlay\').classList.add(\'hidden\'); document.getElementById(\'manual-overlay\').style.display=\'none\';">SCHLIESSEN (ESC)</button>';
                content.innerHTML = text; 
            } catch(e) { content.innerHTML = `<div class="text-red-500">Fehler beim Laden: ${e.message}</div>`; }
        }
    },

    showChangelogOverlay: async function() {
        const overlay = document.getElementById('changelog-overlay');
        const content = document.getElementById('changelog-content');
        if(overlay && content) {
            content.textContent = 'Lade Daten...';
            overlay.style.display = 'flex'; overlay.classList.remove('hidden');
            const verDisplay = document.getElementById('version-display'); 
            const ver = verDisplay ? verDisplay.textContent.trim() : Date.now();
            try { const res = await fetch(`change.log?v=${ver}`); if (!res.ok) throw new Error("Logfile nicht gefunden"); const text = await res.text(); content.textContent = text; } catch(e) { content.textContent = `Fehler beim Laden: ${e.message}`; }
        }
    },

    enterVault: function() { 
        if(Game.state) Game.state.inDialog = true; 
        if(typeof UI !== 'undefined' && UI.log) UI.log("Das schwere Vault-Tor knirscht...", "text-blue-400 font-bold");

        const animLayer = document.createElement('div');
        animLayer.id = 'vault-anim-layer';
        animLayer.className = "fixed inset-0 z-[3000] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-1000 pointer-events-auto";
        
        animLayer.innerHTML = `
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2d3748_0%,_#000_100%)] opacity-80"></div>
            <div id="vault-door-container" class="relative flex items-center justify-center transition-transform duration-[2500ms] ease-in-out">
                <div id="vault-gear" class="relative w-64 h-64 md:w-96 md:h-96 bg-[#4a5568] rounded-full border-[12px] border-[#2d3748] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-transform duration-[2500ms] ease-in-out">
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(0deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(45deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(90deg);"></div>
                    <div class="absolute w-full h-12 bg-[#2d3748]" style="transform: rotate(135deg);"></div>
                    <div class="absolute w-52 h-52 md:w-80 md:h-80 bg-[#1a202c] rounded-full z-10 border-4 border-[#111] flex items-center justify-center shadow-inner">
                        <span class="text-6xl md:text-8xl font-bold text-yellow-500 tracking-widest font-mono drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]">101</span>
                    </div>
                </div>
            </div>
            <div id="vault-flash" class="absolute inset-0 bg-white opacity-0 transition-opacity duration-300 pointer-events-none z-50"></div>
        `;
        document.body.appendChild(animLayer);

        setTimeout(() => {
            const container = document.getElementById('vault-door-container');
            const gear = document.getElementById('vault-gear');
            const flash = document.getElementById('vault-flash');

            if(container) container.style.transform = "translateX(120vw)"; 
            if(gear) gear.style.transform = "rotate(270deg)"; 

            setTimeout(() => {
                if(flash) flash.style.opacity = "1";
                
                setTimeout(() => {
                    this._showVaultMenuInternal(); 
                    if(flash) flash.style.opacity = "0";
                    animLayer.style.opacity = "0";
                    
                    setTimeout(() => {
                        animLayer.remove();
                    }, 1000);
                }, 300);
            }, 2000);
        }, 100);
    },

    _showVaultMenuInternal: function() {
        const overlay = this.restoreOverlay(); 
        overlay.style.display = 'flex';
        overlay.innerHTML = ''; 

        if(Game.state) Game.state.inDialog = true; 
        
        const box = document.createElement('div');
        box.className = "flex flex-col gap-3 w-full max-w-sm p-6 bg-black border-4 border-blue-600 shadow-[0_0_30px_blue] pointer-events-auto animate-float-in";
        box.onclick = (e) => e.stopPropagation();

        const msg = document.createElement('div');
        msg.innerHTML = `
            <h2 class='text-blue-400 font-bold mb-2 text-3xl tracking-widest border-b-2 border-blue-900 pb-2 text-center'>VAULT 101</h2>
            <p class='text-sm text-blue-200 mb-4 text-center'>Willkommen zuhause, Bewohner.<br>Hier bist du sicher vor dem Ödland.</p>
        `;
        
        const restBtn = document.createElement('button'); 
        restBtn.className = "action-button w-full border-blue-500 text-blue-400 hover:bg-blue-900 py-4 font-bold text-xl"; 
        restBtn.innerHTML = "🛏️ AUSRUHEN (GRATIS)"; 
        restBtn.onclick = () => { 
            if(Game.state) {
                Game.state.hp = Game.state.maxHp || 20; 
                if(Game.state.rad !== undefined) Game.state.rad = 0; 
                if(Game.state.rads !== undefined) Game.state.rads = 0; 
                if(typeof Game.saveGame === 'function') Game.saveGame();
                if(typeof UI.update === 'function') UI.update();
            }
            this.showInfoDialog("DEKONTAMINIERT & AUSGERUHT", "Du hast sicher in der Vault geschlafen. Deine TP sind vollständig regeneriert und die Dekontaminationsduschen haben jegliche Verstrahlung abgewaschen!");
        }; 
        
        const leaveBtn = document.createElement('button'); 
        leaveBtn.className = "action-button w-full border-gray-600 text-gray-400 hover:bg-gray-800 py-2 mt-2"; 
        leaveBtn.innerHTML = "🚪 ZURÜCK INS ÖDLAND"; 
        leaveBtn.onclick = () => UI.leaveDialog(); 
        
        box.appendChild(msg);
        box.appendChild(restBtn); 
        box.appendChild(leaveBtn);
        overlay.appendChild(box);
    },

    enterCityCinematic: function(onComplete) {
        if(Game.state) Game.state.inDialog = true;
        if(typeof UI !== 'undefined' && UI.log) UI.log("Die rostigen Tore öffnen sich...", "text-yellow-400 font-bold");

        const animLayer = document.createElement('div');
        animLayer.id = 'city-anim-layer';
        animLayer.className = "fixed inset-0 z-[3000] bg-black overflow-hidden transition-opacity duration-1000 pointer-events-auto flex items-center justify-center";

        animLayer.innerHTML = `
            <div id="rs-door-left" class="absolute top-0 bottom-0 left-0 w-1/2 bg-[repeating-linear-gradient(90deg,#3e2723,#3e2723_10px,#2d1a11_10px,#2d1a11_20px)] border-r-[12px] border-[#1a110b] transition-transform duration-[2500ms] ease-in-out flex items-center justify-end overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.8)] z-10">
                <div class="absolute w-full h-12 bg-[repeating-linear-gradient(45deg,#000,#000_20px,#eab308_20px,#eab308_40px)] opacity-60 top-1/4"></div>
                <div class="absolute w-full h-12 bg-[repeating-linear-gradient(-45deg,#000,#000_20px,#eab308_20px,#eab308_40px)] opacity-60 bottom-1/4"></div>
            </div>
            <div id="rs-door-right" class="absolute top-0 bottom-0 right-0 w-1/2 bg-[repeating-linear-gradient(90deg,#3e2723,#3e2723_10px,#2d1a11_10px,#2d1a11_20px)] border-l-[12px] border-[#1a110b] transition-transform duration-[2500ms] ease-in-out flex items-center justify-start overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-10">
                <div class="absolute w-full h-12 bg-[repeating-linear-gradient(45deg,#000,#000_20px,#eab308_20px,#eab308_40px)] opacity-60 top-1/4"></div>
                <div class="absolute w-full h-12 bg-[repeating-linear-gradient(-45deg,#000,#000_20px,#eab308_20px,#eab308_40px)] opacity-60 bottom-1/4"></div>
            </div>
            <div id="rs-sign" class="absolute z-20 flex flex-col items-center transition-opacity duration-700">
                <div class="bg-[#1a110b] border-8 border-[#3e2723] p-6 shadow-[0_0_40px_rgba(0,0,0,0.9)] rounded-lg relative overflow-hidden">
                    <div class="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.2)_2px,rgba(0,0,0,0.2)_4px)] pointer-events-none"></div>
                    <h1 class="text-4xl md:text-6xl font-bold text-orange-500 tracking-[0.2em] font-mono drop-shadow-[0_0_15px_rgba(255,165,0,0.9)] animate-pulse">RUSTY SPRINGS</h1>
                    <div class="text-cyan-400 text-center tracking-[0.6em] text-xs md:text-sm mt-3 animate-pulse drop-shadow-[0_0_10px_rgba(0,255,255,0.9)]">EST. 2077 // TRADE HUB</div>
                </div>
            </div>
            <div id="rs-flash" class="absolute inset-0 bg-yellow-600 opacity-0 transition-opacity duration-500 pointer-events-none z-30 mix-blend-overlay"></div>
        `;

        document.body.appendChild(animLayer);

        setTimeout(() => {
            const doorL = document.getElementById('rs-door-left');
            const doorR = document.getElementById('rs-door-right');
            const sign = document.getElementById('rs-sign');
            const flash = document.getElementById('rs-flash');

            if(sign) sign.style.opacity = "0";

            setTimeout(() => {
                if(doorL) doorL.style.transform = "translateX(-100%)";
                if(doorR) doorR.style.transform = "translateX(100%)";
                
                setTimeout(() => {
                    if(flash) flash.style.opacity = "0.8";
                    
                    setTimeout(() => {
                        if (onComplete) onComplete();
                        if(flash) flash.style.opacity = "0";
                        animLayer.style.opacity = "0";
                        if(Game.state) Game.state.inDialog = false;
                        
                        setTimeout(() => {
                            animLayer.remove();
                        }, 1000);
                    }, 400);
                }, 1800);
            }, 500); 
        }, 100);
    },

    // ==========================================
    // NEU: GHOST TOWN PSYCHO HORROR EFFEKTE
    // ==========================================

    _ghostTownActive: false,
    _ghostTimeout: null,

    startGhostTownEffects: function() {
        if(this._ghostTownActive) return;
        this._ghostTownActive = true;
        
        if(typeof UI.log === 'function') {
            UI.log("Ein unnatürlicher Schauer läuft dir über den Rücken...", "text-purple-500 italic font-bold");
        }
        
        this.scheduleNextGhostEffect();
    },

    stopGhostTownEffects: function() {
        if(!this._ghostTownActive) return;
        this._ghostTownActive = false;
        
        if(this._ghostTimeout) {
            clearTimeout(this._ghostTimeout);
            this._ghostTimeout = null;
        }
        // Bildschirm normalisieren, falls gerade ein Glitch war
        document.body.style.filter = "none";
    },

    scheduleNextGhostEffect: function() {
        if(!this._ghostTownActive) return;
        
        // Zufälliges Delay zwischen 2 und 8 Sekunden
        const delay = 2000 + Math.random() * 6000; 
        
        this._ghostTimeout = setTimeout(() => {
            this.triggerGhostEffect();
            this.scheduleNextGhostEffect();
        }, delay);
    },

    triggerGhostEffect: function() {
        if(!this._ghostTownActive || Game.state.inDialog) return; // Nicht im Kampf oder Dialogen nerven
        
        const r = Math.random();
        
        if(r < 0.33) {
            // EFFEKT 1: Bildschirm Tearing & Farben invertieren
            document.body.style.filter = "invert(100%) hue-rotate(90deg) grayscale(50%)";
            setTimeout(() => { 
                document.body.style.filter = "none"; 
            }, 100 + Math.random() * 150);
            
        } else if(r < 0.66) {
            // EFFEKT 2: Fake V.A.T.S. Flash (Jumpscare)
            const flash = document.createElement('div');
            flash.className = "fixed inset-0 z-[9000] pointer-events-none flex flex-col items-center justify-center bg-[#1a0000] overflow-hidden";
            flash.innerHTML = `
                <div class="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.1)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] mix-blend-overlay"></div>
                <div class="text-red-600 font-mono text-5xl md:text-7xl font-bold tracking-[1em] animate-pulse opacity-90 text-shadow-md">TARGET: ???</div>
                <div class="mt-10 w-full max-w-md border-2 border-red-900 p-4 bg-red-950/50">
                    <div class="text-red-500 font-mono text-4xl flex justify-between"><span>SOUL</span><span>0%</span></div>
                </div>
            `;
            document.body.appendChild(flash);
            setTimeout(() => flash.remove(), 100 + Math.random() * 100);
            
        } else {
            // EFFEKT 3: Paranoia Text auf dem Bildschirm
            const msgs = ["SIEH HINTER DICH...", "LAUF WEG!", "WIR SIND HIER...", "DEIN ENDE NAHT", "KEIN ENTRINNEN", "NICHT UMNDREHEN"];
            const msg = msgs[Math.floor(Math.random()*msgs.length)];
            
            const txt = document.createElement('div');
            // Zufällige Position
            const top = 20 + Math.random() * 60;
            const left = 20 + Math.random() * 60;
            
            txt.className = `fixed z-[8000] text-red-600 font-mono font-bold text-3xl md:text-5xl pointer-events-none opacity-0 drop-shadow-[0_0_10px_red]`;
            txt.style.top = `${top}%`;
            txt.style.left = `${left}%`;
            txt.style.transform = "translate(-50%, -50%)";
            txt.innerText = msg;
            
            document.body.appendChild(txt);
            
            requestAnimationFrame(() => {
                txt.style.transition = "opacity 0.1s";
                txt.style.opacity = "0.8";
            });
            
            setTimeout(() => {
                txt.style.opacity = "0";
                setTimeout(() => txt.remove(), 200);
            }, 500 + Math.random() * 500);
        }
    }
});
