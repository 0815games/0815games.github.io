// [TIMESTAMP] 2026-01-18 11:30:00 - ui_view_camp.js - Fixed Upgrade Cost Calculation (Multi-Stack Support)

Object.assign(UI, {

    // Status-Speicher: 'main' oder 'cooking'
    campMode: 'main', 

    // Helper für das Info-Popup
    showCampInfo: function() {
        let rows = '';
        for(let l=1; l<=10; l++) {
            let healPct = 30 + ((l - 1) * 8); 
            if(l >= 10) healPct = 100;
            if(healPct > 100) healPct = 100;

            let costStr = '<span class="text-gray-600">-</span>';
            if (l === 1) {
                costStr = '<span class="text-gray-500">Start (100 KK)</span>';
            } else {
                const cost = Game.getCampUpgradeCost(l - 1);
                if(cost) {
                    costStr = `${cost.count}x ${cost.name}`;
                }
            }

            const currentLvl = (Game.state.camp && Game.state.camp.level) ? Game.state.camp.level : 1;
            const isCurrent = (l === currentLvl);
            const bgClass = isCurrent ? "bg-yellow-900/40 border border-yellow-600" : "border-b border-gray-800";
            const textClass = isCurrent ? "text-yellow-400 font-bold" : "text-gray-400";

            rows += `
                <div class="flex justify-between items-center py-1 px-2 ${bgClass} text-xs">
                    <div class="w-12 ${textClass}">Lvl ${l}</div>
                    <div class="w-20 text-blue-300 text-center">${Math.floor(healPct)}% HP</div>
                    <div class="flex-1 text-right text-gray-300">${costStr}</div>
                </div>
            `;
        }

        const content = `
            <div class="flex justify-between text-xs text-yellow-600 font-bold mb-2 px-2 uppercase tracking-wider border-b border-yellow-900 pb-1">
                <span class="w-12">Stufe</span>
                <span class="w-20 text-center">Heilung</span>
                <span class="flex-1 text-right">Kosten</span>
            </div>
            <div class="flex flex-col gap-1 max-h-[50vh] overflow-y-auto custom-scroll mb-4 border border-green-900/30 bg-black/50 p-1">
                ${rows}
            </div>
            <div class="text-[10px] text-gray-500 text-center italic">
                Höhere Stufen heilen effektiver.<br>Strahlung (+5) beim Kochen bleibt konstant.
            </div>
        `;

        this.showInfoDialog("LAGER INFO", content);
    },

    // Haupt-Render Funktion
    renderCamp: function(resetToMain = false) {
        if(resetToMain) {
            this.campMode = 'main';
        }

        const cookingView = document.getElementById('camp-cooking-view');
        const mainActions = document.getElementById('camp-main-actions');
        
        // FIX: Referenzen auf Elemente holen, die stören könnten
        const statusBox = document.getElementById('camp-status-box');
        const upgradeCont = document.getElementById('camp-upgrade-container');
        
        if(cookingView && mainActions) {
            if(this.campMode === 'cooking') {
                cookingView.classList.remove('hidden');
                // FIX: Hintergrund und Z-Index setzen, damit nichts durchscheint
                cookingView.classList.add('bg-gray-900', 'z-50');
                
                mainActions.classList.add('hidden');
                
                // FIX: Die darunterliegenden Elemente explizit ausblenden
                if(statusBox) statusBox.classList.add('hidden');
                if(upgradeCont) upgradeCont.classList.add('hidden');

                this.renderCampCooking(false); 
            } else {
                cookingView.classList.add('hidden');
                // FIX: Cleanup der Klassen
                cookingView.classList.remove('bg-gray-900', 'z-50');

                mainActions.classList.remove('hidden');
                
                // FIX: Elemente wieder einblenden
                if(statusBox) statusBox.classList.remove('hidden');
                if(upgradeCont) upgradeCont.classList.remove('hidden');
            }
        }

        const camp = Game.state.camp;
        if(!camp) { 
            console.warn("Kein Camp gefunden!"); 
            if(typeof UI.switchView === 'function') UI.switchView('map'); 
            return; 
        }

        const lvl = camp.level || 1;

        const lvlDisplay = document.getElementById('camp-level-display');
        if(lvlDisplay) lvlDisplay.textContent = `LEVEL ${lvl}`;

        let healPct = 30 + ((lvl - 1) * 8); 
        if(lvl >= 10) healPct = 100;
        if(healPct > 100) healPct = 100;

        // statusBox reference already defined above, reusing it if visible
        if(statusBox) {
            let comfort = (lvl === 1) ? "Basis-Zelt" : (lvl >= 10 ? "Luxus-Bunker" : "Komfort-Zelt");
            statusBox.textContent = `${comfort} (Lvl ${lvl}). Heilung ${Math.floor(healPct)}%.`;
        }

        // upgradeCont reference already defined above
        if(upgradeCont) {
            let upgradeText = "LAGER VERBESSERN";
            let upgradeSub = "Lädt...";
            let upgradeDisabled = false;
            let btnClass = "border-yellow-500 text-yellow-400 hover:bg-yellow-900/30";
            
            if(lvl >= 10) {
                upgradeText = "LAGER MAXIMIERT";
                upgradeSub = "Maximum erreicht (Level 10)";
                upgradeDisabled = true;
                btnClass = "border-green-500 text-green-500 cursor-default bg-green-900/20";
            } else {
                const cost = Game.getCampUpgradeCost(lvl);
                if(cost) {
                    // [FIX] Statt .find() (nur erster Stack) nutzen wir .reduce() um ALLE Stacks zu zählen
                    const count = Game.state.inventory.reduce((sum, i) => {
                        return (i.id === cost.id) ? sum + i.count : sum;
                    }, 0);
                    
                    if(count >= cost.count) {
                        upgradeSub = `Kosten: ${cost.count}x ${cost.name}`;
                    } else {
                        upgradeSub = `Fehlt: ${cost.count}x ${cost.name} (Besitz: ${count})`;
                        upgradeDisabled = true;
                        btnClass = "border-red-500 text-red-500 cursor-not-allowed opacity-70";
                    }
                } else {
                    upgradeSub = "Keine Daten";
                    upgradeDisabled = true;
                }
            }

            upgradeCont.innerHTML = `
                <button class="flex flex-col items-center justify-center border ${btnClass} p-3 transition-all w-full mb-4"
                    onclick="Game.upgradeCamp()" ${upgradeDisabled ? 'disabled' : ''}>
                    <span class="font-bold text-lg">${upgradeText}</span>
                    <span class="text-xs opacity-70">${upgradeSub}</span>
                </button>
            `;
        }
    },

    renderCampCooking: function(switchToCooking = true) {
        if(switchToCooking) {
            this.campMode = 'cooking';
            const cookingView = document.getElementById('camp-cooking-view');
            const mainActions = document.getElementById('camp-main-actions');
            
            // FIX: Auch hier Referenzen holen zum Ausblenden
            const statusBox = document.getElementById('camp-status-box');
            const upgradeCont = document.getElementById('camp-upgrade-container');

            if(cookingView) {
                cookingView.classList.remove('hidden');
                // FIX: Hintergrund und Z-Index
                cookingView.classList.add('bg-gray-900', 'z-50');
            }
            if(mainActions) mainActions.classList.add('hidden');
            
            // FIX: Explizit ausblenden
            if(statusBox) statusBox.classList.add('hidden');
            if(upgradeCont) upgradeCont.classList.add('hidden');
        }

        const list = document.getElementById('cooking-list');
        if(!list) return;

        const scrollPos = list.scrollTop;
        list.innerHTML = '';

        const recipes = Game.recipes || [];
        const cookingRecipes = recipes.filter(r => r.type === 'cooking');

        if(cookingRecipes.length === 0) {
            list.innerHTML = '<div class="text-gray-500 italic text-center mt-10">Du kennst noch keine Rezepte.</div>';
            return;
        }

        cookingRecipes.forEach(recipe => {
            // --- CRASH FIX: Prüfen ob das Output-Item existiert ---
            const outItem = Game.items[recipe.out];
            if (!outItem) {
                console.warn("Überspringe fehlerhaftes Rezept (Output fehlt):", recipe.out);
                return;
            }

            const div = document.createElement('div');
            div.className = "border border-yellow-900 bg-yellow-900/10 p-3 mb-2 flex justify-between items-center relative";
            div.onclick = (e) => e.stopPropagation(); 
            
            let reqHtml = '';
            let canCraft = true;
            
            for(let reqId in recipe.req) {
                const countNeeded = recipe.req[reqId];
                
                // [FIX] Auch beim Kochen alle Stacks zählen
                const countHave = Game.state.inventory.reduce((sum, i) => {
                    return (i.id === reqId) ? sum + i.count : sum;
                }, 0);
                
                let color = "text-yellow-500";
                if (countHave < countNeeded) { 
                    canCraft = false; 
                    color = "text-red-500"; 
                }
                
                // --- CRASH FIX: Prüfen ob Zutat existiert ---
                const ingItem = Game.items[reqId];
                const ingredientName = ingItem ? ingItem.name : `UNKNOWN (${reqId})`;
                
                reqHtml += `<span class="${color} text-xs mr-2 block">• ${ingredientName}: ${countHave}/${countNeeded}</span>`;
            }

            div.innerHTML = `
                <div class="flex flex-col">
                    <span class="font-bold text-yellow-400 text-lg">${outItem.name}</span>
                    <span class="text-xs text-yellow-600 italic">${outItem.desc || ''}</span>
                    <div class="mt-1 bg-black/50 p-1 rounded">${reqHtml}</div>
                </div>
                <button class="action-button border-yellow-500 text-yellow-500 px-4 py-2 font-bold hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed h-full ml-2" 
                    onclick="event.stopPropagation(); Game.craftItem('${recipe.id}'); setTimeout(() => UI.renderCampCooking(false), 50)" ${canCraft ? '' : 'disabled'}>
                    BRATEN
                </button>
            `;
            list.appendChild(div);
        });

        if(scrollPos > 0) list.scrollTop = scrollPos;
    }
});
