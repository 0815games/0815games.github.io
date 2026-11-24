// [2026-01-17 20:05:00] ui_view_inv.js - Enhanced Backpack UI Visibility

Object.assign(UI, {

    // [v0.7.0] VIEW STATE
    charTab: 'status', 

    // --- INVENTAR ---
    renderInventory: function() {
        const list = document.getElementById('inventory-list');
        const countDisplay = document.getElementById('inv-count');
        const capsDisplay = document.getElementById('inv-caps');
        
        if(!list) return;
        
        list.innerHTML = '';
        if(capsDisplay) capsDisplay.textContent = Game.state.caps;
        
        const usedSlots = Game.getUsedSlots();
        const maxSlots = Game.getMaxSlots();
        
        // [UPDATE] Rucksack-Anzeige noch deutlicher
        if(countDisplay) {
            let backpackName = "";
            if (Game.state.equip && Game.state.equip.back) {
                const bp = Game.state.equip.back;
                backpackName = bp.props && bp.props.name ? bp.props.name : bp.name;
            }

            // Layout Update: Zwei Zeilen, Rucksack grün hervorgehoben
            countDisplay.innerHTML = `
                <div class="flex flex-col items-end leading-tight">
                    <span class="text-sm">${usedSlots} / ${maxSlots}</span>
                    ${backpackName 
                        ? `<span class="text-[10px] text-[#39ff14] font-bold tracking-wider border-t border-green-900 mt-0.5 pt-0.5">🎒 ${backpackName}</span>` 
                        : '<span class="text-[9px] text-gray-600 border-t border-gray-800 mt-0.5 pt-0.5">KEIN RUCKSACK</span>'}
                </div>
            `;
            
            // Pulsieren bei Überladung
            countDisplay.className = usedSlots >= maxSlots ? "text-red-500 font-bold animate-pulse" : "text-white font-mono";
        }
        
        const getIcon = (type) => {
            switch(type) {
                case 'weapon': return '🔫'; case 'body': return '🛡️'; case 'head': return '🪖';
                case 'legs': return '👖'; case 'feet': return '🥾'; case 'arms': return '🦾';
                case 'back': return '🎒'; case 'consumable': return '💉'; case 'junk': return '⚙️';
                case 'component': return '🔩'; case 'ammo': return '🧨'; case 'blueprint': return '📜'; 
                case 'tool': return '⛺'; default: return '📦';
            }
        };

        const createBtn = (itemDef, entry, isEquipped, label, onClick) => {
            const btn = document.createElement('div');
            let cssClass = "relative border border-green-500 bg-green-900/30 w-full h-16 flex flex-col items-center justify-center transition-colors group";
            
            if(onClick) cssClass += " cursor-pointer hover:bg-green-500 hover:text-black";
            else cssClass += " cursor-default opacity-80"; 
            
            if (entry && entry.isNew && !isEquipped) {
                cssClass += " new-item-glow";
            }

            btn.className = cssClass;
            
            let displayName = entry.props && entry.props.name ? entry.props.name : itemDef.name;
            let extraClass = entry.props && entry.props.color ? entry.props.color : "";

            const countDisplay = (entry.count > 1 || itemDef.type === 'ammo') ? 
                `<div class="absolute top-0 right-0 bg-green-900 text-white text-[10px] px-1 font-mono">${entry.count}</div>` : '';

            btn.innerHTML = `
                <div class="text-2xl">${getIcon(itemDef.type)}</div>
                <div class="text-[10px] truncate max-w-full px-1 font-bold ${extraClass}">${displayName}</div>
                ${countDisplay}
            `;

            if(isEquipped) {
                const overlay = document.createElement('div');
                overlay.className = "absolute inset-0 bg-black/60 border-2 border-green-500 flex items-center justify-center text-green-500 font-bold tracking-widest text-[10px] pointer-events-none";
                overlay.textContent = label || "AUSGERÜSTET";
                btn.appendChild(overlay);
                btn.style.borderColor = "#39ff14"; 
            }
            
            const markAsRead = () => {
                if(entry && entry.isNew) {
                    entry.isNew = false;
                    btn.classList.remove('new-item-glow');
                }
            };

            btn.onmouseenter = markAsRead;
            btn.onclick = (e) => {
                e.stopPropagation(); 
                markAsRead();
                if(onClick) onClick();
            };

            return btn;
        };

        const cats = {
            equip: { label: "🛡️ AUSRÜSTUNG", items: [] },
            aid:   { label: "💉 HILFSMITTEL", items: [] },
            misc:  { label: "⚙️ MATERIAL", items: [] }
        };

        const equippedList = [];

        Game.state.inventory.forEach((entry, index) => {
            if(entry.count <= 0) return;
            const item = Game.items[entry.id];
            if(!item) return;

            if(entry.id === 'camp_kit' && Game.state.camp) {
                 const btn = createBtn(item, entry, true, "AUFGESTELLT", null);
                 equippedList.push(btn); 
                 return;
            }

            const onClick = () => UI.showItemConfirm(index);
            const btn = createBtn(item, entry, false, null, onClick);

            if(['weapon', 'head', 'body', 'arms', 'legs', 'feet', 'back', 'tool'].includes(item.type)) {
                cats.equip.items.push(btn);
            } else if (item.type === 'consumable') {
                cats.aid.items.push(btn);
            } else {
                cats.misc.items.push(btn);
            }
        });

        let hasItems = false;
        ['equip', 'aid', 'misc'].forEach(key => {
            if(cats[key].items.length > 0) {
                hasItems = true;
                const header = document.createElement('div');
                header.className = "col-span-4 bg-green-900/40 text-green-300 text-xs font-bold px-2 py-1 mt-2 border-b border-green-700 tracking-wider flex items-center gap-2";
                header.innerHTML = cats[key].label;
                list.appendChild(header);
                cats[key].items.forEach(btn => list.appendChild(btn));
            }
        });

        const slots = ['weapon', 'head', 'body', 'arms', 'legs', 'feet', 'back'];
        slots.forEach(slot => {
            const equippedItem = Game.state.equip[slot];
            if(!equippedItem) return;

            let baseDef = Game.items[equippedItem.id];
            if(!baseDef) {
                const key = Object.keys(Game.items).find(k => Game.items[k].name === equippedItem.name);
                if(key) baseDef = Game.items[key];
            }
            if(!baseDef) baseDef = equippedItem;

            const onClick = () => UI.showEquippedDialog(slot);

            const fakeEntry = { 
                id: equippedItem.id, 
                count: 1, 
                props: equippedItem.props,
                isNew: false 
            };

            const btn = createBtn(baseDef, fakeEntry, true, "AUSGERÜSTET", onClick);
            equippedList.push(btn);
        });

        if(equippedList.length > 0) {
            const sep = document.createElement('div');
            sep.className = "col-span-4 flex items-center justify-center text-[10px] text-green-900 font-bold tracking-widest my-2 opacity-80 mt-6";
            sep.innerHTML = "<span class='bg-black px-2 border-b border-green-900 w-full text-center'>--- AKTIV AUSGERÜSTET ---</span>";
            list.appendChild(sep);
            equippedList.forEach(b => list.appendChild(b));
        }

        if(!hasItems && equippedList.length === 0) {
            list.innerHTML = '<div class="col-span-4 text-center text-gray-500 italic mt-10">Leerer Rucksack...</div>';
        }
    },

    // --- CHARAKTER ---
    renderChar: function(mode) {
        if(mode) this.charTab = mode;
        const tab = this.charTab;

        const elName = document.getElementById('char-sheet-name');
        const elLvl = document.getElementById('char-sheet-lvl');
        if(elName) elName.textContent = Game.state.playerName;
        if(elLvl) elLvl.textContent = Game.state.lvl;

        ['status', 'stats', 'perks'].forEach(t => {
            const btn = document.getElementById(`tab-btn-${t}`);
            const view = document.getElementById(`view-${t}`);
            if(btn && view) {
                if(t === tab) {
                    btn.classList.add('active');
                    view.classList.remove('hidden');
                } else {
                    btn.classList.remove('active');
                    view.classList.add('hidden');
                }
            }
        });

        const btnStats = document.getElementById('tab-btn-stats');
        if(btnStats) {
            if(Game.state.statPoints > 0) btnStats.classList.add('alert-glow-yellow');
            else btnStats.classList.remove('alert-glow-yellow');
        }

        const btnPerks = document.getElementById('tab-btn-perks');
        if(btnPerks) {
            if(Game.state.perkPoints > 0) btnPerks.classList.add('alert-glow-yellow');
            else btnPerks.classList.remove('alert-glow-yellow');
        }

        if(tab === 'status') this.renderCharStatus();
        else if(tab === 'stats') this.renderCharStats();
        else if(tab === 'perks') this.renderCharPerks();
    },

    renderCharStatus: function() {
        const safeSetText = (id, text) => {
            const el = document.getElementById(id);
            if(el) el.textContent = text;
        };

        safeSetText('sheet-hp', `${Math.floor(Game.state.hp)}/${Game.state.maxHp}`);
        
        const nextXp = Game.expToNextLevel(Game.state.lvl);
        safeSetText('sheet-xp', `${Math.floor(Game.state.xp)}/${nextXp}`);
        
        const used = Game.getUsedSlots();
        const max = Game.getMaxSlots();
        const loadEl = document.getElementById('sheet-load');
        if(loadEl) {
            loadEl.textContent = `${used}/${max}`;
            loadEl.className = used >= max ? "text-red-500 font-bold animate-pulse" : "text-white font-bold";
        }

        safeSetText('sheet-crit', `${Game.state.critChance}%`);

        const alertBox = document.getElementById('status-points-alert');
        if(alertBox) {
            if(Game.state.statPoints > 0 || Game.state.perkPoints > 0) {
                alertBox.classList.remove('hidden');
                alertBox.onclick = () => {
                    if(Game.state.statPoints > 0) UI.renderChar('stats');
                    else UI.renderChar('perks');
                };
            } else {
                alertBox.classList.add('hidden');
            }
        }

        const slots = ['head', 'back', 'weapon', 'body', 'arms', 'legs', 'feet'];
        
        slots.forEach(slot => {
            const el = document.getElementById(`slot-${slot}`);
            if(!el) return;

            const item = Game.state.equip[slot];
            const isEmpty = !item;

            const nameEl = el.querySelector('.item-name');
            if(!nameEl) return;

            if(isEmpty) {
                el.classList.remove('filled');
                el.classList.add('empty');
                nameEl.textContent = "---";
                nameEl.className = "item-name text-gray-600";
                el.onclick = null; 
            } else {
                el.classList.add('filled');
                el.classList.remove('empty');
                const name = item.props ? item.props.name : item.name;
                const color = (item.props && item.props.color) ? item.props.color : "text-[#39ff14]";
                
                nameEl.textContent = name;
                nameEl.className = `item-name ${color}`;
                el.onclick = () => UI.showEquippedDialog(slot);
            }
        });
    },

    renderCharStats: function() {
        const container = document.getElementById('special-list');
        const pointsEl = document.getElementById('sheet-stat-points');
        if(!container) return;

        container.innerHTML = '';
        if(pointsEl) pointsEl.textContent = Game.state.statPoints;

        const statOrder = ['STR', 'PER', 'END', 'INT', 'AGI', 'LUC'];
        const canUpgrade = Game.state.statPoints > 0;

        statOrder.forEach(key => {
            const val = Game.getStat(key);
            const label = (window.GameData && window.GameData.statLabels && window.GameData.statLabels[key]) ? window.GameData.statLabels[key] : key;
            
            let bar = '';
            for(let i=1; i<=10; i++) {
                bar += (i <= val) ? '<div class="h-2 w-full bg-[#39ff14] mr-0.5"></div>' : '<div class="h-2 w-full bg-green-900/30 mr-0.5"></div>';
            }

            const div = document.createElement('div');
            div.className = "flex items-center justify-between bg-green-900/10 border border-green-900 p-2";
            
            let btnHtml = '';
            if(canUpgrade && val < 10) {
                btnHtml = `<button class="w-8 h-8 bg-yellow-500 text-black font-bold flex items-center justify-center hover:bg-yellow-400" onclick="Game.upgradeStat('${key}', event)">+</button>`;
            } else {
                btnHtml = `<div class="w-8 h-8 flex items-center justify-center font-bold text-green-700 text-xl">${val}</div>`;
            }

            div.innerHTML = `
                <div class="flex-1">
                    <div class="flex justify-between mb-1">
                        <span class="font-bold text-green-400 text-lg">${key}</span>
                        <span class="text-xs text-green-600 uppercase tracking-widest mt-1">${label}</span>
                    </div>
                    <div class="flex w-32">${bar}</div>
                </div>
                <div class="ml-4">${btnHtml}</div>
            `;
            container.appendChild(div);
        });
    },

    renderCharPerks: function() {
        const container = document.getElementById('perks-list');
        const pointsEl = document.getElementById('sheet-perk-points');
        if(!container) return;

        const scrollPos = container.parentElement.scrollTop || 0;

        container.innerHTML = '';
        if(pointsEl) pointsEl.textContent = Game.state.perkPoints;
        const points = Game.state.perkPoints;

        if(Game.perkDefs) {
            Game.perkDefs.forEach(p => {
                const currentLvl = Game.getPerkLevel(p.id);
                const maxLvl = p.max || 1;
                const isMaxed = currentLvl >= maxLvl;
                const canAfford = points > 0 && !isMaxed;
                
                let levelBar = '';
                for(let i=0; i<maxLvl; i++) {
                    levelBar += (i < currentLvl) ? '<span class="text-yellow-400 text-sm">●</span>' : '<span class="text-gray-700 text-sm">○</span>';
                }

                const div = document.createElement('div');
                div.className = `border ${isMaxed ? 'border-yellow-900 bg-yellow-900/5' : 'border-green-800 bg-black'} p-3 flex justify-between items-center transition-all hover:border-green-500`;
                
                let actionBtn = '';
                if(canAfford) {
                    actionBtn = `<button class="bg-yellow-500/20 text-yellow-400 border border-yellow-500 px-3 py-1 text-xs font-bold hover:bg-yellow-500 hover:text-black" onclick="event.stopPropagation(); Game.choosePerk('${p.id}')">LERNEN</button>`;
                } else if (isMaxed) {
                    actionBtn = `<span class="text-green-700 font-bold text-xs border border-green-900 px-2 py-1">MAX</span>`;
                }

                div.innerHTML = `
                    <div class="flex items-center gap-3 flex-1">
                        <div class="text-3xl bg-green-900/20 w-12 h-12 flex items-center justify-center rounded border border-green-900">${p.icon}</div>
                        <div class="flex flex-col">
                            <span class="font-bold ${isMaxed ? 'text-yellow-600' : 'text-green-300'} text-lg">${p.name}</span>
                            <span class="text-xs text-gray-500">${p.desc}</span>
                            <div class="mt-1 tracking-widest">${levelBar}</div>
                        </div>
                    </div>
                    <div class="ml-2">
                        ${actionBtn}
                    </div>
                `;
                container.appendChild(div);
            });
        }

        if(scrollPos > 0) {
            requestAnimationFrame(() => {
                container.parentElement.scrollTop = scrollPos;
            });
        }
    }
});
