// [2026-01-18 14:00:00] admin.js - Updated for SPECIAL 20 & Backpack System

const Admin = {
    gatePass: "bimbo123",
    adminUser: "admin@pipboy-system.com",
    adminPass: "zintel1992",

    dbData: {}, 
    bugData: {}, 
    lbData: {}, 
    currentPath: null,
    currentUserData: null,
    itemsList: [], 
    
    isLoaded: false,

    invFilter: {
        search: "",
        category: "ALL"
    },

    unlock: function() {
        const input = document.getElementById('gate-pass').value;
        const msg = document.getElementById('gate-msg');
        
        if(input === this.gatePass) {
            msg.className = "mt-4 h-6 text-green-500 font-bold";
            msg.textContent = "ACCESS GRANTED. ESTABLISHING UPLINK...";
            this.connectFirebase();
        } else {
            msg.textContent = "ACCESS DENIED.";
            document.getElementById('gate-pass').value = '';
        }
    },

    updateLoader: function(percent, text) {
        const bar = document.getElementById('loader-bar');
        const status = document.getElementById('loader-status');
        if(bar) bar.style.width = percent + '%';
        if(status) status.textContent = text;
    },

    connectFirebase: async function() {
        if (typeof Network !== 'undefined' && !Network.db) {
            try { if(typeof Network.init === 'function') Network.init(); } catch(e) {}
        }

        try {
            document.getElementById('gate-screen').classList.add('hidden');
            document.getElementById('admin-loader').classList.remove('hidden');
            this.updateLoader(10, "AUTHENTICATING...");

            await Network.login(this.adminUser, this.adminPass);
            
            this.updateLoader(30, "DOWNLOADING SECURE DATA...");
            document.getElementById('conn-dot').classList.replace('bg-red-500', 'bg-green-500');
            document.getElementById('conn-dot').classList.remove('animate-pulse');
            
            this.initData();
        } catch(e) {
            document.getElementById('admin-loader').classList.add('hidden');
            document.getElementById('gate-screen').classList.remove('hidden');
            document.getElementById('gate-msg').textContent = "UPLINK FAILED: " + e.code;
            console.error(e);
        }
    },

    initData: function() {
        // Sicherstellen, dass Items geladen sind (auch wenn Game noch nicht init ist)
        const items = (typeof Game !== 'undefined' && Game.items) ? Game.items : (window.GameData ? window.GameData.items : {});
        this.itemsList = Object.entries(items).map(([k, v]) => ({id: k, ...v}));
        
        this.updateLoader(50, "LISTENING TO VAULT-TEC FREQUENCIES...");

        Network.db.ref('saves').on('value', snap => {
            this.dbData = snap.val() || {};
            this.renderUserList();
            
            if(this.currentPath) {
                const parts = this.currentPath.split('/'); 
                if(this.dbData[parts[1]] && this.dbData[parts[1]][parts[2]]) {
                    this.selectUser(this.currentPath, true); 
                }
            }

            if(!this.isLoaded) {
                this.isLoaded = true;
                this.updateLoader(100, "SYSTEM READY.");
                setTimeout(() => {
                    document.getElementById('admin-loader').classList.add('hidden');
                    const app = document.getElementById('app-ui');
                    app.classList.remove('hidden');
                    setTimeout(() => app.classList.remove('opacity-0'), 50); 
                }, 800);
            }
        });

        Network.db.ref('bug_reports').on('value', snap => {
            this.bugData = snap.val() || {};
            const count = Object.keys(this.bugData).length;
            
            const counter = document.getElementById('bug-count');
            const badge = document.getElementById('menu-bug-badge');
            
            if(counter) counter.textContent = count;
            if(badge) {
                if(count > 0) badge.classList.remove('hidden');
                else badge.classList.add('hidden');
            }
            
            if(!document.getElementById('bug-overlay').classList.contains('hidden')) {
                this.renderBugs();
            }
        });

        Network.db.ref('leaderboard').on('value', snap => {
            this.lbData = snap.val() || {};
            if(document.getElementById('lb-overlay') && !document.getElementById('lb-overlay').classList.contains('hidden')) {
                this.renderLeaderboard();
            }
        });
    },

    toggleSystemMenu: function() {
        const menu = document.getElementById('system-menu');
        if(menu) menu.classList.toggle('hidden');
    },

    setupMenuClose: function() {
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('system-menu');
            const btn = document.querySelector('button[onclick="Admin.toggleSystemMenu()"]');
            if(menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
                menu.classList.add('hidden');
            }
        });
    },

    showToast: function(msg, type='info') {
        const container = document.getElementById('toast-container');
        if(!container) return;

        const el = document.createElement('div');
        let colors = "border-green-500 text-green-400 bg-black";
        if(type === 'warning') colors = "border-yellow-500 text-yellow-400 bg-black";
        if(type === 'error') colors = "border-red-500 text-red-400 bg-black";
        
        el.className = `flex items-center justify-between p-3 border-l-4 ${colors} shadow-[0_0_15px_rgba(0,0,0,0.8)] min-w-[250px] animate-slide-in pointer-events-auto bg-opacity-90 transition-all duration-300 transform translate-x-0 mb-2`;
        
        el.innerHTML = `
            <div class="font-mono text-xs font-bold mr-4 uppercase tracking-widest flex items-center gap-2">
                <span>${type === 'warning' ? '⚠️' : (type === 'error' ? '❌' : 'ℹ️')}</span>
                ${msg}
            </div>
            <button class="text-xs opacity-50 hover:opacity-100 font-bold px-1">X</button>
        `;

        el.querySelector('button').onclick = () => el.remove();
        container.appendChild(el);

        setTimeout(() => {
            el.classList.add('opacity-0', 'translate-x-10');
            setTimeout(() => el.remove(), 300);
        }, 4000);
    },

    confirm: function(title, text, callback) {
        const overlay = document.getElementById('admin-confirm-overlay');
        const elTitle = document.getElementById('admin-confirm-title');
        const elText = document.getElementById('admin-confirm-text');
        const btnYes = document.getElementById('admin-confirm-yes');
        const btnNo = document.getElementById('admin-confirm-no');

        if(!overlay) {
            if(confirm(text)) callback(); 
            return;
        }

        elTitle.textContent = title;
        elText.innerHTML = text; 
        
        btnYes.onclick = null;
        btnNo.onclick = null;

        btnYes.onclick = () => {
            overlay.classList.add('hidden');
            callback();
        };
        btnNo.onclick = () => {
            overlay.classList.add('hidden');
        };

        overlay.classList.remove('hidden');
    },

    showLeaderboard: function() {
        let overlay = document.getElementById('lb-overlay');
        if(!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'lb-overlay';
            overlay.className = "fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 admin-font";
            overlay.innerHTML = `
                <div class="panel-box w-full max-w-4xl h-[80vh] flex flex-col shadow-[0_0_30px_#aa0] border-2 border-yellow-500">
                    <div class="p-4 border-b border-yellow-900 flex justify-between items-center bg-yellow-900/20 shrink-0">
                        <h2 class="text-xl font-bold text-yellow-400 tracking-widest">VAULT LEGENDS MANAGER</h2>
                        <button onclick="document.getElementById('lb-overlay').classList.add('hidden')" class="text-red-500 font-bold border border-red-500 px-3 py-1 hover:bg-red-900">CLOSE</button>
                    </div>
                    <div class="p-2 bg-black border-b border-gray-800 text-[10px] text-gray-400 font-mono shrink-0">
                        INFO: 'DEAD' Status means the name is free to take. 'ALIVE' locks the name. DELETE removes the entry entirely.
                    </div>
                    <div class="flex-1 overflow-hidden relative flex flex-col">
                        <div class="bg-black border-b border-yellow-900 text-yellow-600 text-xs font-bold grid grid-cols-12 p-2 shrink-0 z-10">
                            <div class="col-span-3">NAME</div>
                            <div class="col-span-1">LVL</div>
                            <div class="col-span-2">XP</div>
                            <div class="col-span-2">STATUS</div>
                            <div class="col-span-4 text-right">ACTIONS</div>
                        </div>
                        <div class="flex-1 custom-scroll p-2 bg-black/50">
                            <div id="lb-list" class="flex flex-col gap-1"></div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.classList.remove('hidden');
        this.renderLeaderboard();
        document.getElementById('system-menu')?.classList.add('hidden');
    },

    renderLeaderboard: function() {
        const list = document.getElementById('lb-list');
        if(!list) return;
        list.innerHTML = '';

        const entries = Object.entries(this.lbData).map(([key, val]) => ({key, ...val}));
        entries.sort((a,b) => b.lvl - a.lvl || b.xp - a.xp);

        entries.forEach(entry => {
            const isDead = entry.status === 'dead';
            const div = document.createElement('div');
            div.className = "grid grid-cols-12 gap-2 items-center p-2 border-b border-gray-900 hover:bg-[#002200] transition-colors text-sm font-mono";
            const statusColor = isDead ? "text-red-500" : "text-green-500";
            const statusIcon = isDead ? "❌ DEAD" : "💚 ALIVE";

            div.innerHTML = `
                <div class="col-span-3 text-white font-bold truncate" title="${entry.name}">${entry.name}</div>
                <div class="col-span-1 text-gray-300">${entry.lvl}</div>
                <div class="col-span-2 text-gray-500 text-xs">${entry.xp}</div>
                <div class="col-span-2 ${statusColor} font-bold text-xs">${statusIcon}</div>
                <div class="col-span-4 text-right flex gap-1 justify-end">
                    ${!isDead ? 
                        `<button onclick="Admin.lbAction('${entry.key}', 'kill')" class="bg-red-900/30 text-red-400 border border-red-900 px-2 py-1 text-[10px] hover:bg-red-500 hover:text-black">☠️ KILL</button>` : 
                        `<button onclick="Admin.lbAction('${entry.key}', 'revive')" class="bg-green-900/30 text-green-400 border border-green-900 px-2 py-1 text-[10px] hover:bg-green-500 hover:text-black">❤️ REVIVE</button>`
                    }
                    <button onclick="Admin.lbAction('${entry.key}', 'delete')" class="bg-gray-800 text-gray-400 border border-gray-600 px-2 py-1 text-[10px] hover:bg-gray-200 hover:text-black">🗑️ DEL</button>
                </div>
            `;
            list.appendChild(div);
        });
    },

    lbAction: function(key, action) {
        const ref = Network.db.ref('leaderboard/' + key);
        if(action === 'kill') {
            this.confirm("MARK AS DEAD", `Mark <b>${key}</b> as DEAD?<br>This frees the name for new players.`, () => {
                ref.update({ status: 'dead', deathTime: Date.now() });
                this.showToast("LEGEND MARKED DEAD", "warning");
            });
        } else if(action === 'revive') {
            ref.update({ status: 'alive' });
            this.showToast("LEGEND REVIVED");
        } else if(action === 'delete') {
            this.confirm("DELETE LEGEND", `PERMANENTLY DELETE <b>${key}</b> from highscores?<br>This cannot be undone.`, () => {
                ref.remove();
                this.showToast("LEGEND DELETED", "error");
            });
        }
    },

    // --- BUGS (UPDATED) ---
    showBugs: function() {
        document.getElementById('bug-overlay').classList.remove('hidden');
        document.getElementById('system-menu')?.classList.add('hidden');
        this.renderBugs();
    },

    renderBugs: function() {
        const list = document.getElementById('bug-list');
        list.innerHTML = '';
        const reports = [];
        for(let key in this.bugData) { reports.push({ id: key, ...this.bugData[key] }); }
        reports.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

        if(reports.length === 0) {
            list.innerHTML = '<div class="text-center text-green-500 italic mt-10">NO BUGS REPORTED. SYSTEM CLEAN.</div>';
            return;
        }

        reports.forEach(bug => {
            const date = new Date(bug.timestamp).toLocaleString();
            const div = document.createElement('div');
            div.className = "border border-red-500 bg-red-900/20 p-4 relative mb-4 shadow-[0_0_15px_rgba(255,0,0,0.2)]";
            
            // Format für die Zwischenablage
            const copyData = JSON.stringify(bug, null, 2);

            div.innerHTML = `
                <div class="flex justify-between items-start mb-2 border-b border-red-800 pb-2">
                    <div>
                        <span class="text-red-400 font-bold text-lg block">${bug.error || "UNKNOWN ERROR"}</span>
                        <div class="text-xs text-gray-400">${date} | Player: <span class="text-white font-bold">${bug.playerName}</span></div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="Admin.copyBugReport(this)" data-bug='${copyData}' class="btn border-cyan-500 text-cyan-500 text-xs px-2 py-1 hover:bg-cyan-900">COPY JSON</button>
                        <button onclick="Admin.deleteBug('${bug.id}')" class="btn btn-danger text-xs px-2 py-1">DELETE</button>
                    </div>
                </div>
                <div class="text-sm text-gray-300 font-mono mb-2 bg-black/50 p-2 border border-red-900/50">
                    <span class="text-red-600 font-bold">DESC:</span> ${bug.description}
                </div>
                <div class="text-[10px] text-gray-500 font-mono bg-black p-2 border border-gray-800">
                    LOC: ${bug.gameState?.sector || 'Unknown'} | VIEW: ${bug.gameState?.view} | CAPS: ${bug.gameState?.caps || 0} | AGENT: ${bug.userAgent}
                </div>
            `;
            list.appendChild(div);
        });
    },

    copyBugReport: function(btn) {
        const data = btn.getAttribute('data-bug');
        navigator.clipboard.writeText(data).then(() => {
            this.showToast("REPORT COPIED TO CLIPBOARD", "info");
        }).catch(err => {
            this.showToast("COPY FAILED", "error");
            console.error(err);
        });
    },

    deleteBug: function(id) {
        this.confirm("DELETE BUG REPORT", "Diesen Bug Report wirklich löschen?", () => {
            Network.db.ref('bug_reports/' + id).remove();
            this.showToast("BUG DELETED");
        });
    },

    refresh: function() { location.reload(); },

    toggleSidebar: function() {
        const sb = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sb.classList.contains('-translate-x-full')) {
            sb.classList.remove('-translate-x-full'); overlay.classList.remove('hidden');
        } else {
            sb.classList.add('-translate-x-full'); overlay.classList.add('hidden');
        }
    },

    renderUserList: function() {
        const list = document.getElementById('user-list');
        const filter = document.getElementById('search-player').value.toLowerCase();
        list.innerHTML = '';
        let count = 0;
        
        for(let uid in this.dbData) {
            const slots = this.dbData[uid];
            for(let slotIdx in slots) {
                const save = slots[slotIdx];
                const name = (save.playerName || "Unknown").toLowerCase();
                const path = `saves/${uid}/${slotIdx}`;
                
                if(filter && !name.includes(filter) && !uid.includes(filter)) continue;

                const div = document.createElement('div');
                const isSelected = this.currentPath === path;
                const isDead = (save.hp <= 0);
                
                div.className = `p-2 cursor-pointer border-b border-[#1a331a] flex justify-between items-center hover:bg-[#39ff14] hover:text-black transition-colors ${isSelected ? 'bg-[#39ff14] text-black font-bold' : 'text-[#39ff14]'}`;
                
                div.onclick = () => {
                    this.selectUser(path);
                    const sb = document.getElementById('sidebar');
                    if(!sb.classList.contains('-translate-x-full')) { this.toggleSidebar(); }
                };
                
                div.innerHTML = `
                    <div class="flex flex-col overflow-hidden">
                        <span class="truncate uppercase">${isDead ? '💀 ' : ''}${save.playerName || 'NO_NAME'}</span>
                        <span class="text-[10px] opacity-60 font-mono">${save._userEmail || uid.substr(0,8)}</span>
                    </div>
                    <div class="text-right text-xs">
                        <div>LVL ${save.lvl || 1}</div>
                        <div>SEC ${save.sector ? `${save.sector.x},${save.sector.y}` : '?,?'}</div>
                    </div>
                `;
                list.appendChild(div);
                count++;
            }
        }
        document.getElementById('user-count').textContent = count;
    },

    selectUser: function(path, silent = false) {
        try {
            this.currentPath = path;
            const parts = path.split('/');
            const uid = parts[1];
            const slot = parts[2];
            this.currentUserData = this.dbData[uid][slot];
            const d = this.currentUserData;

            if(!silent) this.tab('general');

            document.getElementById('no-selection').classList.add('hidden');
            document.getElementById('editor-content').classList.remove('hidden');
            document.getElementById('editor-error').classList.add('hidden'); 
            
            document.getElementById('edit-name').textContent = d.playerName || "Unknown";
            document.getElementById('edit-uid').textContent = uid;
            document.getElementById('edit-slot').textContent = slot;
            document.getElementById('edit-email').textContent = d._userEmail || "No Email";
            
            document.getElementById('quick-lvl').value = d.lvl || 1;
            document.getElementById('quick-xp').value = d.xp || 0;

            this.fillGeneral(d);
            this.fillStats(d);
            this.fillInv(d);
            this.fillWorld(d);
            this.fillCamp(d); 
            this.fillRaw(d);
            
            if(!silent) this.renderUserList(); 

        } catch (e) {
            console.error(e);
            const errBox = document.getElementById('editor-error');
            errBox.textContent = "RENDER ERROR: " + e.message;
            errBox.classList.remove('hidden');
        }
    },

    fillGeneral: function(d) {
        document.getElementById('inp-hp').value = Math.round(d.hp || 0);
        document.getElementById('inp-maxhp').value = d.maxHp || 10;
        document.getElementById('inp-rads').value = d.rads || 0;
        document.getElementById('inp-caps').value = d.caps || 0;
    },

    fillStats: function(d) {
        const container = document.getElementById('special-container');
        container.innerHTML = '';
        const stats = d.stats || { STR:1, PER:1, END:1, CHA:1, INT:1, AGI:1, LUC:1 };
        
        for(let key in stats) {
            const val = stats[key];
            const div = document.createElement('div');
            div.className = "panel-box p-2 flex justify-between items-center";
            // [UPDATED] Max 20 Slider
            div.innerHTML = `
                <span class="font-bold text-xl w-12">${key}</span>
                <input type="range" min="1" max="20" value="${val}" class="flex-grow mx-2 accent-[#39ff14]" 
                    oninput="document.getElementById('val-${key}').textContent=this.value"
                    onchange="Admin.saveStat('${key}', this.value)">
                <span id="val-${key}" class="font-bold text-xl w-6 text-right">${val}</span>
            `;
            container.appendChild(div);
        }
        document.getElementById('inp-statPoints').value = d.statPoints || 0;
        document.getElementById('inp-perkPoints').value = d.perkPoints || 0;

        const perkContainer = document.getElementById('perk-list-container');
        if(perkContainer) {
            perkContainer.innerHTML = '';
            
            const allPerks = (window.GameData && window.GameData.perks) ? window.GameData.perks : [];
            const userPerks = d.perks || {};

            if(allPerks.length === 0) {
                perkContainer.innerHTML = '<div class="col-span-2 text-gray-500">No Perk Definitions found via GameData.</div>';
            } else {
                allPerks.forEach(p => {
                    let lvl = userPerks[p.id] || 0;
                    if(Array.isArray(userPerks)) lvl = userPerks.includes(p.id) ? 1 : 0;
                    const maxLvl = p.max || 1;
                    const div = document.createElement('div');
                    div.className = "panel-box p-2 flex justify-between items-center";
                    div.innerHTML = `
                        <span class="font-bold text-sm w-32 truncate text-[#39ff14]" title="${p.name}">${p.name}</span>
                        <input type="range" min="0" max="${maxLvl}" value="${lvl}" class="flex-grow mx-2 accent-[#39ff14]"
                            oninput="document.getElementById('perk-val-${p.id}').textContent=this.value"
                            onchange="Admin.savePerk('${p.id}', this.value)">
                        <span id="perk-val-${p.id}" class="font-bold text-xl w-6 text-right">${lvl}</span>
                    `;
                    perkContainer.appendChild(div);
                });
            }
        }
    },

    saveStat: function(stat, val) {
        if(!this.currentPath) return;
        Network.db.ref(this.currentPath + '/stats/' + stat).set(Number(val));
        this.showToast(`UPDATED ${stat}. SYNC REQUIRED!`, "warning");
    },

    savePerk: function(perkId, val) {
        if(!this.currentPath) return;
        const valNum = Number(val);
        Network.db.ref(this.currentPath + '/perks/' + perkId).set(valNum);
        this.showToast(`PERK ${perkId} UPDATED. SYNC!`, "warning");
    },

    fillInv: function(d) {
        const invTab = document.getElementById('tab-inv');
        
        // [ADDED] Calculate Capacity for Display
        const str = (d.stats && d.stats.STR) ? d.stats.STR : 5;
        let sbLvl = 0;
        if(d.perks) {
            if(Array.isArray(d.perks)) { if(d.perks.includes('strong_back')) sbLvl = 1; }
            else { sbLvl = d.perks['strong_back'] || 0; }
        }
        let packBonus = 0;
        if(d.equip && d.equip.back) {
             if(d.equip.back.bonus && d.equip.back.bonus.slots) packBonus = d.equip.back.bonus.slots;
             else if(d.equip.back.props && d.equip.back.props.bonus && d.equip.back.props.bonus.slots) packBonus = d.equip.back.props.bonus.slots;
        }
        
        const maxSlots = 10 + str + (sbLvl * 5) + packBonus;
        const usedSlots = d.inventory ? d.inventory.length : 0;
        const loadColor = usedSlots > maxSlots ? "text-red-500 animate-pulse" : "text-gray-400";

        invTab.innerHTML = `
            <div class="flex flex-col h-full gap-2">
                <div class="flex justify-between items-center px-2 py-1 bg-[#001100] border border-[#1a551a]">
                    <span class="text-[10px] text-green-600">INVENTORY LOAD (CALC)</span>
                    <span class="text-xs font-bold ${loadColor}">${usedSlots} / ${maxSlots}</span>
                </div>
                <div class="panel-box p-2 shrink-0">
                    <h3 class="text-yellow-400 font-bold border-b border-[#1a551a] mb-1 text-xs">EQUIPPED</h3>
                    <div id="equip-list" class="grid grid-cols-2 gap-1 text-[10px]"></div>
                </div>
                <div class="panel-box flex flex-col flex-1 min-h-0 overflow-hidden relative">
                    <div class="bg-[#002200] p-2 border-b border-[#1a551a] shrink-0 z-10">
                        <div class="flex gap-2 mb-1">
                            <input type="text" id="admin-item-search" 
                                class="w-full bg-black border border-green-500 text-green-300 text-xs p-1 uppercase font-mono"
                                placeholder="SEARCH..." 
                                value="${this.invFilter.search}"
                                onkeyup="Admin.updateItemFilter(this.value)">
                        </div>
                        <div class="flex flex-wrap gap-1 justify-center" id="filter-btns"></div>
                    </div>
                    <div class="flex-1 custom-scroll bg-black relative">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-[#001100] text-gray-500 text-[9px] sticky top-0 z-20 border-b border-[#1a551a]">
                                <tr>
                                    <th class="p-1 pl-2">ITEM NAME</th>
                                    <th class="p-1 w-24 hidden md:table-cell">ID</th>
                                    <th class="p-1 w-20 text-right pr-2">ADD</th>
                                </tr>
                            </thead>
                            <tbody id="admin-item-table-body" class="text-xs font-mono"></tbody>
                        </table>
                    </div>
                </div>
                <div class="panel-box p-2 h-1/4 shrink-0 flex flex-col">
                    <h3 class="text-gray-500 font-bold text-[10px] mb-1">PLAYER INVENTORY</h3>
                    <div class="flex-1 custom-scroll bg-black border border-[#1a551a]">
                        <table class="w-full text-left border-collapse">
                            <thead class="text-[9px] text-gray-400 bg-[#001100] sticky top-0">
                                <tr><th class="p-1">ITEM</th><th class="p-1 text-center">QTY</th><th class="p-1 text-right">ACT</th></tr>
                            </thead>
                            <tbody id="inv-table-body" class="text-[10px] font-mono"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        const equipList = document.getElementById('equip-list');
        if(d.equip) {
            for(let slot in d.equip) {
                const item = d.equip[slot];
                if(item) {
                    const div = document.createElement('div');
                    div.className = "flex justify-between items-center bg-black/50 p-1 border border-[#1a551a]";
                    div.innerHTML = `
                        <div class="truncate"><span class="text-gray-500 mr-1">${slot.substr(0,1).toUpperCase()}:</span><span class="text-green-300">${item.name}</span></div>
                        <button onclick="Admin.forceUnequip('${slot}')" class="text-red-500 hover:text-white ml-1 font-bold">×</button>
                    `;
                    equipList.appendChild(div);
                }
            }
        }

        const tbody = document.getElementById('inv-table-body');
        const inv = d.inventory || [];
        const items = (window.GameData && window.GameData.items) ? window.GameData.items : {};

        inv.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-[#1a331a] hover:bg-[#002200]";
            let name = item.id;
            if(items[item.id]) name = items[item.id].name;
            if(item.props && item.props.name) name = item.props.name + "*";

            tr.innerHTML = `
                <td class="p-1 truncate max-w-[120px]" title="${name}">${name}</td>
                <td class="p-1 text-center text-yellow-500">${item.count}</td>
                <td class="p-1 text-right">
                    <button onclick="Admin.invDelete(${idx})" class="text-red-500 hover:text-white font-bold px-1">DEL</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        const cats = ['ALL', 'WEAPON', 'APPAREL', 'AID', 'JUNK', 'NOTES'];
        const btnContainer = document.getElementById('filter-btns');
        cats.forEach(c => {
            const btn = document.createElement('button');
            const active = this.invFilter.category === c;
            btn.className = `px-2 py-0.5 text-[9px] border ${active ? 'bg-green-500 text-black border-green-500 font-bold' : 'bg-black text-green-500 border-green-800 hover:border-green-500'}`;
            btn.textContent = c;
            btn.onclick = () => { this.invFilter.category = c; this.refreshItemBrowser(); };
            btnContainer.appendChild(btn);
        });

        this.refreshItemBrowser();
    },

    updateItemFilter: function(val) {
        this.invFilter.search = val.toLowerCase();
        this.refreshItemBrowser();
    },

    getItemCategory: function(type) {
        if (!type) return 'MISC';
        if (type === 'weapon' || type === 'ammo') return 'WEAPON';
        if (['body', 'head', 'legs', 'feet', 'arms', 'back'].includes(type)) return 'APPAREL';
        if (type === 'consumable') return 'AID';
        if (type === 'blueprint') return 'NOTES';
        if (['junk', 'component', 'rare', 'tool'].includes(type)) return 'JUNK';
        return 'MISC';
    },

    refreshItemBrowser: function() {
        const tbody = document.getElementById('admin-item-table-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        const allItems = this.itemsList; 
        let count = 0;
        allItems.sort((a,b) => a.name.localeCompare(b.name));

        allItems.forEach(item => {
            const cat = this.getItemCategory(item.type);
            if(this.invFilter.category !== 'ALL' && cat !== this.invFilter.category) return;
            if(this.invFilter.search) {
                const searchStr = (item.name + " " + item.id).toLowerCase();
                if(!searchStr.includes(this.invFilter.search)) return;
            }
            const tr = document.createElement('tr');
            tr.className = "border-b border-[#1a331a] hover:bg-[#003300] transition-colors group";
            
            let icon = "📦";
            if(item.type === 'weapon') icon = "🔫";
            if(item.type === 'ammo') icon = "🧨";
            if(item.type === 'consumable') icon = "💉";
            if(item.type === 'back') icon = "🎒";
            if(['body','head','arms','legs','feet'].includes(item.type)) icon = "🛡️";

            tr.innerHTML = `
                <td class="p-1 pl-2 flex items-center gap-2 overflow-hidden">
                    <span class="opacity-50 text-[10px]">${icon}</span>
                    <div class="flex flex-col min-w-0">
                        <span class="text-green-300 font-bold truncate group-hover:text-white">${item.name}</span>
                        <span class="text-[8px] text-gray-500 md:hidden">${item.id}</span>
                    </div>
                </td>
                <td class="p-1 hidden md:table-cell text-[9px] text-gray-500 font-mono">${item.id}</td>
                <td class="p-1 pr-2 text-right whitespace-nowrap">
                    <button onclick="Admin.invAddDirect('${item.id}', 1)" class="bg-[#1a331a] text-green-400 text-[9px] px-1.5 py-0.5 border border-green-900 hover:bg-green-500 hover:text-black transition">+1</button>
                    <button onclick="Admin.invAddDirect('${item.id}', 10)" class="bg-[#1a331a] text-green-400 text-[9px] px-1.5 py-0.5 border border-green-900 hover:bg-green-500 hover:text-black transition ml-1">+10</button>
                </td>
            `;
            tbody.appendChild(tr);
            count++;
        });

        if(count === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-gray-500 text-xs py-4 italic">- NO ITEMS FOUND -</td></tr>`;
        }
    },

    invAddDirect: function(id, count) {
        if(!this.currentPath || !this.currentUserData) return;
        const inv = [...(this.currentUserData.inventory || [])];
        let found = false;
        for(let item of inv) {
            if(item.id === id && !item.props) {
                item.count += count;
                found = true;
                break;
            }
        }
        if(!found) { inv.push({id: id, count: count, isNew: true}); }
        Network.db.ref(this.currentPath + '/inventory').set(inv);
        this.showToast(`ADDED ${count}x ${id}. PLEASE SYNC.`, "warning");
    },

    fillCamp: function(d) {
        const container = document.getElementById('camp-data-content');
        let html = '';
        
        if(!d.camp) {
            html += `<div class="mb-4 text-gray-500 italic">No camp deployed.</div>`;
            
            // [ADDED] Saved Level Display & Edit
            const savedLvl = d.savedCampLevel || 1;
            html += `
                <div class="panel-box p-3 border border-gray-700 mb-4">
                    <label class="block text-xs text-gray-500 mb-1">STORED CAMP LEVEL</label>
                    <div class="flex items-center gap-2">
                         <input type="number" value="${savedLvl}" class="text-xl font-bold w-16 text-center bg-black border border-gray-600 text-gray-300" onchange="Admin.saveVal('savedCampLevel', this.value)">
                         <span class="text-[10px] text-gray-600">Persisted Level</span>
                    </div>
                </div>
            `;
            
            html += `<button onclick="Admin.action('force-camp')" class="btn border-yellow-500 text-yellow-500 w-full text-sm">FORCE DEPLOY (Using Stored Lvl)</button>`;
        } else {
             html += `<div class="grid grid-cols-2 gap-4"><div><label class="block text-xs text-green-600 mb-1">LEVEL</label><input type="number" value="${d.camp.level || 1}" class="text-2xl font-bold w-20 text-center" onchange="Admin.saveVal('camp/level', this.value)"></div><div><label class="block text-xs text-green-600 mb-1">LOCATION</label><div class="text-xs text-gray-500">Sector: ${d.camp.sector.x},${d.camp.sector.y}</div></div></div><button onclick="Admin.action('destroy-camp')" class="btn btn-danger w-full mt-4">DESTROY CAMP</button>`;
        }
        
        container.innerHTML = html;
    },

    fillWorld: function(d) {
        const sx = d.sector ? d.sector.x : 0;
        const sy = d.sector ? d.sector.y : 0;
        document.getElementById('view-sector').textContent = `${sx},${sy}`;
        document.getElementById('tele-x').value = sx;
        document.getElementById('tele-y').value = sy;
        const qList = document.getElementById('quest-list');
        qList.innerHTML = '';
        const active = d.activeQuests || d.quests || [];
        const completed = d.completedQuests || [];
        if(active.length === 0 && completed.length === 0) {
            qList.innerHTML = '<div class="text-gray-500 italic">No quest data found.</div>';
        }
        active.forEach(q => {
            const id = q.id || q;
            const progress = q.progress !== undefined ? `${q.progress}/${q.max}` : '?';
            const div = document.createElement('div');
            div.className = "flex justify-between border-b border-[#1a331a] p-2 text-sm bg-yellow-900/20";
            div.innerHTML = `<div><span class="font-bold text-yellow-400">${id}</span><div class="text-xs opacity-70">Progress: ${progress}</div></div><span class="text-yellow-500 text-xs">ACTIVE</span>`;
            qList.appendChild(div);
        });
        completed.forEach(qid => {
            const div = document.createElement('div');
            div.className = "flex justify-between border-b border-[#1a331a] p-2 text-sm opacity-60";
            div.innerHTML = `<span class="text-gray-400">${qid}</span><span class="text-green-500 text-xs">DONE</span>`;
            qList.appendChild(div);
        });
    },

    fillRaw: function(d) { document.getElementById('raw-json').value = JSON.stringify(d, null, 2); },

    tab: function(id) {
        document.querySelectorAll('[id^="tab-btn-"]').forEach(b => { b.classList.replace('active-tab', 'inactive-tab'); });
        const btn = document.getElementById('tab-btn-' + id);
        if(btn) btn.classList.replace('inactive-tab', 'active-tab');
        ['general', 'stats', 'inv', 'camp', 'world', 'raw'].forEach(t => {
            const el = document.getElementById('tab-' + t);
            if(el) el.classList.add('hidden');
        });
        const target = document.getElementById('tab-' + id);
        if(target) target.classList.remove('hidden');
    },

    // Save Logic with Reminder
    saveVal: function(key, val) {
        if(!this.currentPath) return;
        if(!isNaN(val) && val !== "") val = Number(val);
        Network.db.ref(this.currentPath + '/' + key).set(val);
        this.showToast("VALUE SAVED. SYNC LATER.", "warning");
    },

    modVal: function(key, amount) {
        if(!this.currentUserData) return;
        let current = this.currentUserData[key] || 0;
        this.saveVal(key, current + amount);
    },

    action: function(type) {
        if(!this.currentPath) return;
        const updates = {};
        const p = this.currentPath;
        
        const performUpdate = () => { 
            Network.db.ref(p).update(updates); 
            this.showToast("ACTION PERFORMED. PLEASE SYNC.", "warning");
        };

        if (type === 'heal') { updates['hp'] = this.currentUserData.maxHp || 100; updates['rads'] = 0; updates['isGameOver'] = false; performUpdate(); }
        else if (type === 'de-rad') { updates['rads'] = 0; performUpdate(); }
        else if (type === 'kill') { this.confirm("KILL PLAYER", "Dies setzt HP auf 0...", () => { updates['hp'] = 0; updates['isGameOver'] = true; performUpdate(); }); }
        else if (type === 'revive') { updates['hp'] = 10; updates['isGameOver'] = false; performUpdate(); }
        else if (type === 'delete') { this.confirm("DELETE SAVE", "Permanent löschen?", () => { Network.db.ref(p).remove(); this.currentPath = null; document.getElementById('editor-content').classList.add('hidden'); document.getElementById('no-selection').classList.remove('hidden'); this.showToast("SAVE DELETED."); }); }
        else if (type === 'reset-vault') { this.confirm("RESET TO VAULT", "Zurück zu Vault 101?", () => { updates['sector'] = {x: 4, y: 4}; updates['player'] = {x: 100, y: 100}; updates['view'] = 'map'; performUpdate(); }); }
        else if (type === 'destroy-camp') { this.confirm("DESTROY CAMP", "Camp löschen?", () => { Network.db.ref(p + '/camp').remove(); this.showToast("CAMP DESTROYED. SYNC!", "warning"); }); }
        else if (type === 'force-camp') { 
            const sec = this.currentUserData.sector || {x:4, y:4}; 
            const pos = this.currentUserData.player || {x:100, y:100}; 
            // [UPDATED] Use Stored Level
            const lvl = this.currentUserData.savedCampLevel || 1;
            updates['camp'] = { sector: sec, x: pos.x, y: pos.y, level: lvl }; 
            performUpdate(); 
        }
    },

    teleport: function() {
        const x = Number(document.getElementById('tele-x').value);
        const y = Number(document.getElementById('tele-y').value);
        Network.db.ref(this.currentPath + '/sector').set({x:x, y:y});
        Network.db.ref(this.currentPath + '/player').set({x:300, y:200}); 
        this.showToast("PLAYER TELEPORTED. SYNC!", "warning");
    },

    invUpdate: function(idx, val) {
        val = Number(val);
        if(val <= 0) { this.invDelete(idx); } else { Network.db.ref(`${this.currentPath}/inventory/${idx}/count`).set(val); this.showToast("INV UPDATED. SYNC!", "warning"); }
    },

    invDelete: function(idx) {
        this.confirm("DELETE ITEM", "Item wirklich löschen?", () => {
            const inv = [...(this.currentUserData.inventory || [])];
            inv.splice(idx, 1);
            Network.db.ref(this.currentPath + '/inventory').set(inv);
            this.showToast("ITEM DELETED. SYNC!", "warning");
        });
    },

    forceUnequip: function(slot) {
        this.confirm("UNEQUIP", `${slot} ablegen?`, () => {
            const item = this.currentUserData.equip[slot];
            if(!item) return;
            const inv = [...(this.currentUserData.inventory || [])];
            inv.push({id: item.id, count: 1, props: item.props});
            Network.db.ref(this.currentPath + '/inventory').set(inv);
            Network.db.ref(this.currentPath + '/equip/' + slot).remove();
            this.showToast("FORCED UNEQUIP. SYNC!", "warning");
        });
    },

    saveRaw: function() {
        try {
            const data = JSON.parse(document.getElementById('raw-json').value);
            this.confirm("RAW OVERWRITE", "WARNUNG: Datenbank wird direkt überschrieben. Dies ist destruktiv!", () => {
                Network.db.ref(this.currentPath).set(data);
                this.showToast("RAW DATA WRITTEN. SYNC NOW!", "error");
            });
        } catch(e) {
            alert("INVALID JSON: " + e.message);
        }
    }
};

setTimeout(() => Admin.setupMenuClose(), 1000);
