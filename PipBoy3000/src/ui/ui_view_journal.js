// [2026-02-21 21:00:00] ui_view_journal.js - Complete (Wiki + Tracking Fix)

// SICHERHEIT: Zentrale Funktion für das Quest-Tracking
if (typeof Game !== 'undefined' && !Game.trackQuest) {
    Game.trackQuest = function(qId) {
        if (!this.state) return;
        
        if (this.state.trackedQuestId === qId) {
            this.state.trackedQuestId = null; 
            if(typeof UI !== 'undefined' && UI.log) UI.log("Mission nicht mehr verfolgt.", "text-gray-400");
        } else {
            this.state.trackedQuestId = qId; 
            if(typeof UI !== 'undefined' && UI.log) UI.log("Mission fixiert!", "text-yellow-400 font-bold");
        }
        
        if(typeof this.saveGame === 'function') this.saveGame();
        
        if(typeof UI !== 'undefined') {
            if (UI.renderQuests) UI.renderQuests(); 
            if (UI.updateQuestTracker) UI.updateQuestTracker(); 
        }
    };
}

Object.assign(UI, {

    renderWiki: function(category = 'monsters') {
        const content = document.getElementById('wiki-content');
        if(!content) return;

        const btnContainer = document.querySelector('#wiki-btn-monsters')?.parentElement;
        const ensureButton = (id, label, catName) => {
            if(btnContainer && !document.getElementById(id)) {
                const btn = document.createElement('button');
                btn.id = id;
                btn.className = "border border-green-500 px-3 py-1 text-sm font-bold whitespace-nowrap hover:bg-green-500 hover:text-black transition-colors text-green-500";
                btn.textContent = label;
                btn.onclick = () => UI.renderWiki(catName);
                btnContainer.appendChild(btn);
            }
        };
        
        ensureButton('wiki-btn-perks', 'PERKS', 'perks');
        ensureButton('wiki-btn-quests', 'QUESTS', 'quests');

        const getIcon = (type) => {
            const map = {
                'weapon': '🔫', 'body': '🛡️', 'head': '🪖', 'legs': '👖', 'feet': '🥾', 'arms': '🦾',
                'back': '🎒', 'consumable': '💉', 'junk': '⚙️', 'component': '🔩', 'ammo': '🧨',
                'blueprint': '📜', 'tool': '⛺', 'misc': '📦'
            };
            return map[type] || '❓';
        };

        const categories = ['monsters', 'items', 'crafting', 'locs', 'perks', 'quests'];
        categories.forEach(cat => {
            const btn = document.getElementById(`wiki-btn-${cat}`);
            if(btn) {
                if(cat === category) {
                    btn.classList.add('bg-green-500', 'text-black');
                    btn.classList.remove('text-green-500');
                } else {
                    btn.classList.remove('bg-green-500', 'text-black');
                    btn.classList.add('text-green-500');
                }
            }
        });

        let html = '';

        if(category === 'monsters') {
            const list = Object.values(Game.monsters || {}).sort((a,b) => a.minLvl - b.minLvl);
            if(list.length === 0) html = '<div class="text-gray-400 text-center mt-10">Keine Daten verfügbar.</div>';
            list.forEach(m => {
                const xpText = Array.isArray(m.xp) ? `${m.xp[0]}-${m.xp[1]}` : m.xp;
                let dropsText = "Nichts";
                if(m.drops && m.drops.length > 0) {
                    dropsText = m.drops.map(d => {
                        const item = Game.items[d.id];
                        return `<span class="text-green-200">${item ? item.name : d.id}</span> <span class="text-gray-400 text-xs">(${Math.round(d.c*100)}%)</span>`;
                    }).join(', ');
                }
                html += `
                    <div class="border border-green-800 bg-black/80 p-3 mb-2 flex flex-col gap-2 relative overflow-hidden group hover:border-green-500 transition-colors">
                        <div class="flex justify-between items-start border-b border-green-900/50 pb-1">
                            <div class="font-bold text-yellow-400 text-lg flex items-center gap-2"><span>👾</span> ${m.name} ${m.isLegendary ? '★' : ''}</div>
                            <div class="text-xs font-mono bg-green-900 text-green-100 px-2 rounded">LVL ${m.minLvl}</div>
                        </div>
                        <div class="grid grid-cols-4 gap-2 text-xs font-mono text-center bg-green-900/20 p-2 rounded">
                            <div class="flex flex-col"><span class="text-gray-400">HP</span><span class="text-white font-bold">${m.hp}</span></div>
                            <div class="flex flex-col"><span class="text-gray-400">DMG</span><span class="text-red-400 font-bold">${m.dmg}</span></div>
                            <div class="flex flex-col"><span class="text-gray-400">XP</span><span class="text-cyan-400 font-bold">${xpText}</span></div>
                            <div class="flex flex-col"><span class="text-gray-400">LOOT</span><span class="text-yellow-400 font-bold">~${m.loot}</span></div>
                        </div>
                        <div class="text-xs text-gray-300 flex gap-2 items-start mt-1">
                            <span class="font-bold shrink-0 text-green-500">DROPS:</span>
                            <div class="flex flex-wrap gap-2 leading-none">${dropsText}</div>
                        </div>
                    </div>`;
            });
        } 
        else if (category === 'items') {
            const groups = {};
            if (Game.items) {
                Object.keys(Game.items).forEach(k => {
                    const i = Game.items[k];
                    if(!groups[i.type]) groups[i.type] = [];
                    groups[i.type].push(i);
                });
                const order = ['weapon', 'body', 'head', 'arms', 'legs', 'feet', 'back', 'consumable', 'ammo', 'tool', 'blueprint', 'component', 'junk', 'quest', 'valuable'];
                const sortedKeys = Object.keys(groups).sort((a,b) => {
                    let ia = order.indexOf(a), ib = order.indexOf(b);
                    if(ia === -1) ia = 99; if(ib === -1) ib = 99;
                    return ia - ib;
                });
                sortedKeys.forEach(type => {
                    html += `<h3 class="text-md font-bold bg-green-800 text-white px-2 py-1 mt-4 mb-2 uppercase tracking-widest flex items-center gap-2 border-l-4 border-green-500 shadow-md">${getIcon(type)} ${type}</h3>`;
                    groups[type].sort((a,b) => a.name.localeCompare(b.name)).forEach(item => {
                        let stats = [];
                        if(item.cost) stats.push(`<span class="text-yellow-400">${item.cost} KK</span>`);
                        if(item.baseDmg) stats.push(`<span class="text-red-400">DMG ${item.baseDmg}</span>`);
                        if(item.val && item.effect) stats.push(`<span class="text-blue-300">${item.effect.toUpperCase()} ${item.val > 0 ? '+' : ''}${item.val}</span>`);
                        if(item.bonus) stats.push(`<span class="text-cyan-300">${JSON.stringify(item.bonus).replace(/["{}]/g, '').replace(/:/g, '+')}</span>`);
                        html += `
                            <div class="flex flex-col border-b border-green-900/50 py-3 hover:bg-green-900/20 px-2">
                                <div class="flex justify-between items-center">
                                    <span class="font-bold text-green-100 text-sm">${item.name}</span>
                                    <div class="text-xs font-mono flex gap-2 opacity-90">${stats.join(' | ')}</div>
                                </div>
                                <div class="text-sm text-gray-400 italic pl-2 border-l-2 border-green-700/50 mt-1">${item.desc || "Keine Daten."}</div>
                            </div>`;
                    });
                });
            }
        } 
        else if (category === 'crafting') {
            if (Game.recipes && Game.recipes.length > 0) {
                const list = [...Game.recipes].sort((a,b) => a.lvl - b.lvl);
                list.forEach(r => {
                    const isKnown = (Game.state.knownRecipes && Game.state.knownRecipes.includes(r.id)) || r.lvl <= 1;
                    const item = Game.items[r.out];
                    const outName = r.out === "AMMO" ? "Munition x10" : (item ? item.name : r.out);
                    let reqs = Object.entries(r.req).map(([id, count]) => {
                        const iName = Game.items[id] ? Game.items[id].name : id;
                        return `${count}x ${iName}`;
                    }).join(', ');
                    html += `
                        <div class="border border-green-800 p-3 mb-2 bg-black flex justify-between items-center ${isKnown ? '' : 'opacity-50 grayscale'}">
                            <div>
                                <div class="font-bold text-lg ${isKnown ? 'text-yellow-400' : 'text-gray-500'}">${outName}</div>
                                <div class="text-xs text-green-400 font-mono italic mt-1">Benötigt: ${reqs}</div>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="text-xs border border-green-700 px-2 py-0.5 text-green-200">LVL ${r.lvl}</span>
                                ${!isKnown ? '<span class="text-[10px] text-red-400 font-bold mt-1">LOCKED</span>' : ''}
                            </div>
                        </div>`;
                });
            } else {
                html = '<div class="text-center text-gray-400 mt-10">Keine Baupläne in Datenbank.</div>';
            }
        } 
        else if (category === 'perks') {
            if(Game.perkDefs) {
                Game.perkDefs.forEach(p => {
                    const lvl = Game.getPerkLevel(p.id);
                    const has = lvl > 0;
                    html += `
                        <div class="flex gap-3 border ${has ? 'border-yellow-500 bg-yellow-900/20' : 'border-green-800/50 bg-black'} p-4 mb-2 items-center">
                            <div class="text-4xl filter drop-shadow-[0_0_5px_rgba(0,255,0,0.5)]">${p.icon || '🌟'}</div>
                            <div>
                                <div class="font-bold ${has ? 'text-yellow-400' : 'text-green-300'} text-lg flex items-center gap-2">
                                    ${p.name} ${has ? `<span class="text-[10px] bg-yellow-500 text-black px-1 rounded font-bold">STUFE ${lvl}</span>` : ''}
                                </div>
                                <div class="text-sm text-green-100 mt-1 leading-snug">${p.desc}</div>
                            </div>
                        </div>`;
                });
            } else {
                html = '<div class="text-center text-gray-400 p-4">Keine Perks gefunden.</div>';
            }
        } 
        else if (category === 'locs') {
             const locs = Game.locations || window.GameData.locations || [];
             if(locs.length === 0) {
                 html = '<div class="text-center text-gray-400 mt-10">Keine Ortsdaten gefunden.</div>';
             } else {
                locs.forEach(l => {
                    html += `
                        <div class="mb-4 border-l-4 border-green-500 pl-4 py-2 bg-black/60">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-cyan-300 text-lg tracking-wider">${l.name}</span>
                                <span class="font-mono text-xs text-yellow-500 bg-black px-1 border border-yellow-800 flex items-center">${l.coord}</span>
                            </div>
                            <div class="text-sm text-green-100 leading-relaxed">${l.desc}</div>
                        </div>`;
                });
             }
        }
        else if (category === 'quests') {
            if(Game.questDefs) {
                Game.questDefs.forEach(q => {
                    html += `
                        <div class="border border-green-800 p-3 mb-2 bg-black/60">
                            <div class="flex justify-between items-center mb-1">
                                <span class="font-bold text-yellow-400 text-base">${q.title}</span>
                                <span class="text-[10px] bg-green-900 text-green-100 px-2 py-0.5 rounded">Min-Lvl: ${q.minLvl}</span>
                            </div>
                            <div class="text-sm text-green-100 italic mb-2">${q.desc}</div>
                            <div class="text-xs text-gray-400 font-mono">
                                Typ: ${q.type.toUpperCase()} | Ziel: ${q.target}
                            </div>
                        </div>
                    `;
                });
            } else {
                html = '<div class="text-center text-gray-400 p-4">Keine Quests in Datenbank.</div>';
            }
        }

        content.innerHTML = html;
    },

    renderQuests: function() {
        const list = document.getElementById('quest-list');
        if(!list) return;
        list.innerHTML = '';

        const chains = []; 
        const sideQuests = [];
        const processedIds = new Set();
        const allDefs = Game.questDefs || [];
        const findNext = (currentId) => allDefs.find(q => q.preReq === currentId);
        const roots = allDefs.filter(q => !q.preReq);

        roots.forEach(root => {
            const chain = [root];
            processedIds.add(root.id);
            let current = root;
            let next = findNext(current.id);
            while(next) {
                chain.push(next);
                processedIds.add(next.id);
                current = next;
                next = findNext(current.id);
            }
            if(chain.length > 1) chains.push(chain);
            else sideQuests.push(root);
        });

        allDefs.forEach(q => {
            if(!processedIds.has(q.id)) sideQuests.push(q);
        });

        const renderQuestCard = (def, status, isCompact = false) => {
            const activeData = Game.state.activeQuests.find(q => q.id === def.id);
            const isDone = status === 'done';
            const isLocked = status === 'locked';
            const isTracked = Game.state.trackedQuestId === def.id;
            
            let colorClass = isDone ? "text-gray-400 line-through" : (isLocked ? "text-gray-400" : "text-yellow-400");
            let iconColor = isDone ? "text-green-600" : (isLocked ? "text-red-500" : "text-yellow-400 animate-pulse");
            let icon = isDone ? "✔" : (isLocked ? "🔒" : "◉");

            let pct = 0;
            let detailHtml = "";
            if(activeData) {
                pct = Math.min(100, Math.floor((activeData.progress / activeData.max) * 100));
                
                if(def.type === 'collect_multi') {
                     const details = Object.entries(def.reqItems).map(([id, amt]) => {
                        const inInv = Game.state.inventory.filter(i => i.id === id).reduce((s, i) => s + i.count, 0);
                        const iName = Game.items[id]?.name || id;
                        const done = inInv >= amt;
                        return `<span class="${done ? 'text-green-400' : 'text-yellow-100'}">${inInv}/${amt} ${iName}</span>`;
                    }).join(', ');
                    detailHtml = `<div class="text-xs mt-2 border-t border-gray-700 pt-1 font-mono text-gray-300">${details}</div>`;
                }
            }

            if(isLocked) return `
                <div class="flex items-center gap-3 p-3 border-l-2 border-gray-600 ml-2 bg-black/40">
                    <div class="text-gray-400 font-mono text-lg">???</div>
                    <div class="text-sm text-gray-500 italic">Wird später freigeschaltet</div>
                </div>`;

            if(isCompact && isDone) return `
                <div class="flex items-center gap-2 mb-2 ml-1 bg-black/20 p-1">
                    <span class="text-green-500 text-sm font-bold">✔</span>
                    <span class="text-sm text-gray-400 line-through decoration-gray-600">${def.title}</span>
                </div>`;

            return `
                <div class="border-l-4 ${isDone ? 'border-green-700 opacity-50' : 'border-yellow-400 bg-black/80'} pl-4 py-3 mb-3 ml-1 relative shadow-lg group">
                    <div class="flex justify-between items-start">
                        <div class="font-bold ${colorClass} text-base flex items-center gap-2">
                            <span class="${iconColor}">${icon}</span> ${def.title}
                        </div>
                        <div class="flex gap-2">
                            ${activeData ? `
                                <button class="text-lg hover:scale-125 transition-transform ${isTracked ? 'opacity-100' : 'opacity-20 hover:opacity-100'}" 
                                        title="${isTracked ? 'Nicht mehr verfolgen' : 'Auf HUD anzeigen'}"
                                        onclick="event.stopPropagation(); Game.trackQuest('${def.id}');">
                                    📌
                                </button>
                            ` : ''}
                            ${!isLocked && !isDone ? `<span class="text-[10px] bg-green-900 text-green-100 px-2 py-0.5 rounded border border-green-700">LVL ${def.minLvl}</span>` : ''}
                        </div>
                    </div>
                    
                    ${!isDone && !isLocked ? `<div class="text-sm text-green-100 mt-2 mb-3 leading-relaxed font-sans">${def.desc}</div>` : ''}
                    
                    ${activeData ? `
                        <div class="w-full bg-gray-800 border border-gray-600 h-3 mt-1 mb-1 rounded-sm overflow-hidden">
                            <div class="bg-yellow-500 h-full transition-all duration-500" style="width: ${pct}%"></div>
                        </div>
                        <div class="flex justify-between text-xs font-mono text-yellow-200 font-bold px-1">
                            <span>${activeData.progress} / ${activeData.max}</span>
                            <span>${pct}%</span>
                        </div>
                        ${detailHtml}
                        <div class="mt-3 text-xs text-yellow-500 font-bold border-t border-dashed border-gray-700 pt-2 flex items-center gap-2">
                            <span>BELOHNUNG:</span>
                            ${def.reward?.caps ? '<span class="text-yellow-300">'+def.reward.caps + ' KK</span>' : ''}
                            ${def.reward?.xp ? '<span class="text-cyan-300">'+def.reward.xp + ' XP</span>' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        };

        if(chains.length > 0) {
            list.innerHTML += `<h3 class="text-yellow-500 font-bold text-sm tracking-[0.2em] border-b-2 border-yellow-800 mb-4 pb-1 uppercase">Haupt-Missionen</h3>`;
            chains.forEach((chain) => {
                const chainContainer = document.createElement('div');
                chainContainer.className = "mb-8 bg-black/40 p-3 rounded border border-green-900"; 
                const isComplete = chain.every(q => Game.state.completedQuests.includes(q.id));
                const isActive = chain.some(q => Game.state.activeQuests.find(aq => aq.id === q.id));
                let headerColor = isComplete ? "text-green-600" : (isActive ? "text-green-300" : "text-gray-500");
                chainContainer.innerHTML = `<div class="font-bold ${headerColor} mb-4 text-base uppercase tracking-wider flex items-center gap-3 border-b border-gray-800 pb-2"><span class="text-2xl">${isActive ? '📖' : (isComplete ? '✅' : '🔒')}</span> <span>GESCHICHTE: ${chain[0].title}</span></div>`;
                let lineHtml = `<div class="flex flex-col gap-1 border-l-2 border-gray-800 ml-3 pl-4">`;
                let lockedFound = false;
                chain.forEach(q => {
                    const isDone = Game.state.completedQuests.includes(q.id);
                    const isActiveQ = Game.state.activeQuests.find(aq => aq.id === q.id);
                    if(isDone) lineHtml += renderQuestCard(q, 'done', true); 
                    else if (isActiveQ) lineHtml += renderQuestCard(q, 'active');
                    else if(!lockedFound) { lineHtml += renderQuestCard(q, 'locked'); lockedFound = true; }
                });
                lineHtml += `</div>`;
                chainContainer.innerHTML += lineHtml;
                list.appendChild(chainContainer);
            });
        }

        if(sideQuests.length > 0) {
            const visibleSide = sideQuests.filter(q => Game.state.activeQuests.find(aq => aq.id === q.id) || Game.state.completedQuests.includes(q.id));
            if(visibleSide.length > 0) {
                const sideContainer = document.createElement('div');
                sideContainer.innerHTML = `<h3 class="text-green-400 font-bold text-sm tracking-[0.2em] border-b-2 border-green-800 mb-4 pb-1 mt-8 uppercase">Neben-Missionen</h3>`;
                visibleSide.forEach(q => {
                    const isDone = Game.state.completedQuests.includes(q.id);
                    sideContainer.innerHTML += renderQuestCard(q, isDone ? 'done' : 'active', isDone);
                });
                list.appendChild(sideContainer);
            }
        }
        if(chains.length === 0 && sideQuests.length === 0) { list.innerHTML = '<div class="text-center text-gray-400 italic mt-10 text-lg">Keine Aufzeichnungen vorhanden.</div>'; }
    }
});
