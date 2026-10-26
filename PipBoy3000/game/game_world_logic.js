// [TIMESTAMP] 2026-01-18 16:00:00 - game_world_logic.js - Camp Kit Trading Blocked

Object.assign(Game, {

    getCampUpgradeCost: function(currentLevel) {
        switch(currentLevel) {
            case 1: return { id: 'junk_metal', count: 25, name: 'Schrott' };
            case 2: return { id: 'cloth', count: 10, name: 'Stoff' };
            case 3: return { id: 'duct_tape', count: 5, name: 'Klebeband' };
            case 4: return { id: 'screws', count: 10, name: 'Schrauben' };
            case 5: return { id: 'gears', count: 10, name: 'Zahnräder' };
            case 6: return { id: 'adhesive', count: 5, name: 'Kleber' };
            case 7: return { id: 'springs', count: 5, name: 'Federn' };
            case 8: return { id: 'circuit', count: 5, name: 'Schaltkreise' };
            case 9: return { id: 'nuclear_mat', count: 3, name: 'Nukleares Material' };
            default: return null;
        }
    },

    deployCamp: function(invIndex, confirmed=false) {
        if(this.state.camp) { UI.log("Lager existiert bereits!", "text-red-500"); return; }
        if(this.state.zone.includes("Stadt") || this.state.dungeonLevel > 0) { UI.log("Hier nicht möglich!", "text-red-500"); return; }
        
        const cost = 100;
        if(this.state.caps < cost) { UI.log(`Benötigt ${cost} Kronkorken für Aufbau.`, "text-red-500"); return; }

        if(!confirmed) {
             if(typeof UI !== 'undefined' && UI.els.dialog) {
                 UI.els.dialog.style.display = 'flex';
                 UI.els.dialog.innerHTML = `
                    <div class="bg-black/95 border-2 border-yellow-400 p-6 rounded-lg shadow-[0_0_20px_#ffd700] text-center max-w-sm pointer-events-auto relative z-50">
                        <div class="text-4xl mb-4">⛺</div>
                        <h3 class="text-xl font-bold text-yellow-400 mb-2">LAGER ERRICHTEN?</h3>
                        <p class="text-gray-300 text-sm mb-6 leading-relaxed">Der Aufbau kostet Material im Wert von <span class="text-yellow-400 font-bold">${cost} Kronkorken</span>.</p>
                        <div class="flex gap-4 justify-center">
                            <button onclick="Game.deployCamp(${invIndex}, true); UI.els.dialog.style.display='none'; UI.els.dialog.innerHTML='';" class="border-2 border-green-500 bg-green-900/40 text-green-400 px-6 py-2 rounded font-bold hover:bg-green-500 hover:text-black transition-all">BAUEN</button>
                            <button onclick="UI.els.dialog.style.display='none'; UI.els.dialog.innerHTML='';" class="border-2 border-red-500 bg-red-900/40 text-red-400 px-6 py-2 rounded font-bold hover:bg-red-500 hover:text-black transition-all">ABBRECHEN</button>
                        </div>
                    </div>
                 `;
             }
             return;
        }

        this.state.caps -= cost;
        
        const startLevel = this.state.savedCampLevel || 1;

        this.state.camp = { 
            sector: { x: this.state.sector.x, y: this.state.sector.y }, 
            x: this.state.player.x, y: this.state.player.y, 
            level: startLevel 
        };
        
        UI.log(`Lager aufgeschlagen! (Stufe ${startLevel})`, "text-green-400 font-bold");
        UI.switchView('camp');
        this.saveGame();
    },

    packCamp: function() {
        if(!this.state.camp) return;
        
        this.state.savedCampLevel = this.state.camp.level;
        
        this.state.camp = null;
        UI.log(`Lager eingepackt. (Level ${this.state.savedCampLevel} gesichert)`, "text-yellow-400");
        UI.switchView('map');
        this.saveGame();
    },

    upgradeCamp: function() {
        if(!this.state.camp) return;
        const lvl = this.state.camp.level;
        if(lvl >= 10) { UI.log("Lager ist bereits auf Maximalstufe (10)!", "text-yellow-400"); return; }

        const cost = this.getCampUpgradeCost(lvl);
        if(!cost) { UI.log("Kein weiteres Upgrade verfügbar.", "text-gray-500"); return; }

        const totalOwned = this.state.inventory.reduce((sum, item) => {
            return (item.id === cost.id) ? sum + item.count : sum;
        }, 0);

        if(totalOwned < cost.count) {
             UI.log(`Upgrade benötigt: ${cost.count}x ${cost.name}`, "text-red-500");
             return;
        }

        let remainingCost = cost.count;
        
        for (let i = 0; i < this.state.inventory.length; i++) {
            if (remainingCost <= 0) break;
            
            const item = this.state.inventory[i];
            if (item.id === cost.id) {
                const take = Math.min(item.count, remainingCost);
                item.count -= take;
                remainingCost -= take;
            }
        }
        
        this.state.inventory = this.state.inventory.filter(i => i.count > 0);

        this.state.camp.level++;
        UI.log(`Lager verbessert auf Stufe ${this.state.camp.level}!`, "text-green-400 font-bold animate-pulse");
        this.saveGame();
        if(typeof UI.renderCamp === 'function') UI.renderCamp();
    },

    restInCamp: function() {
        if(!this.state || !this.state.camp) return;
        const lvl = this.state.camp.level || 1;
        this.addRadiation(5); 

        const effectiveMax = this.state.maxHp - (this.state.rads || 0);
        let healPct = 30 + ((lvl - 1) * 8); 
        if(lvl >= 10) healPct = 100;
        if(healPct > 100) healPct = 100;

        const healAmount = Math.floor(effectiveMax * (healPct / 100));
        const oldHp = this.state.hp;
        
        this.state.hp = Math.min(effectiveMax, this.state.hp + healAmount);
        const healed = Math.floor(this.state.hp - oldHp);

        UI.log(`Geschlafen (Lager Stufe ${lvl}).`, "text-blue-300");
        UI.log(`Regeneration: ${healPct}% (+${healed} TP) / +5 RADS`, "text-green-400 font-bold");

        UI.update();
        if(typeof UI.renderCamp === 'function') UI.renderCamp();
    },

    rest: function() { 
        if(!this.state) return;
        const isSafe = (this.state.view === 'vault' || this.state.view === 'city' || this.state.view === 'clinic' ||
                        (this.state.zone && (this.state.zone.includes("Vault") || this.state.zone.includes("Stadt") || this.state.zone.includes("City"))));

        if(!isSafe) {
            this.addRadiation(10);
            UI.log("Ungeschützt geschlafen: +10 RADS", "text-red-500 font-bold");
        } else {
            UI.log("Sicher geschlafen. Kein RAD Zuwachs.", "text-green-400");
        }

        const effectiveMax = this.state.maxHp - (this.state.rads || 0);
        this.state.hp = effectiveMax; 
        UI.log("Ausgeruht. HP voll (soweit möglich).", "text-blue-400"); 
        UI.update(); 
    },

    addRadiation: function(amount) {
        if(!this.state) return;
        if(typeof this.state.rads === 'undefined') this.state.rads = 0;
        
        let finalAmount = amount;
        if (amount > 0) {
            const perkLvl = this.getPerkLevel('rad_resistant');
            if (perkLvl > 0) {
                const reduction = perkLvl * 0.10; 
                finalAmount = Math.ceil(amount * (1 - reduction));
            }
        }
        this.state.rads = Math.min(this.state.maxHp, Math.max(0, this.state.rads + finalAmount));
        
        if(finalAmount > 0) UI.log(`+${finalAmount} RADS!`, "text-red-500 font-bold animate-pulse");
        else if(finalAmount < 0) UI.log(`${Math.abs(finalAmount)} RADS entfernt.`, "text-green-300");
        
        const effectiveMax = this.state.maxHp - this.state.rads;
        if(this.state.hp > effectiveMax) { this.state.hp = effectiveMax; }
        
        if(this.state.hp <= 0 && finalAmount > 0) {
            this.state.hp = 0; this.state.isGameOver = true;
            if(UI && UI.showGameOver) UI.showGameOver();
        }
        UI.update();
    },

    heal: function() { 
        if(this.state.caps >= 25) { 
            this.state.caps -= 25; 
            this.state.rads = 0; 
            this.state.hp = this.state.maxHp; 
            UI.log("BEHANDLUNG ERFOLGREICH.", "text-green-400 font-bold");
            UI.update(); 
            setTimeout(() => {
                if (Game.state.view === 'clinic') {
                    if(typeof UI.renderCity === 'function') UI.renderCity();
                }
            }, 1500); 
        } else { UI.log("Zu wenig Kronkorken.", "text-red-500"); }
    },

    buyAmmo: function(qty) { this.buyItem('ammo', qty); },

    buyItem: function(id, qtyMode = 1) {
        // [FIX] Camp Kit nicht kaufbar
        if (id === 'camp_kit') { if(typeof UI !== 'undefined') UI.error("Nicht käuflich!"); return; }

        const item = Game.items[id];
        if (!item) { if(typeof UI !== 'undefined') UI.error("Error: " + id); return; }

        let stock = 0;
        let pricePerUnit = item.cost; 
        let itemsPerUnit = 1; 

        if (id === 'ammo') {
            stock = this.state.shop.ammoStock || 0; 
            itemsPerUnit = 10; pricePerUnit = 10; 
        } else {
            stock = (this.state.shop.stock && this.state.shop.stock[id] !== undefined) ? this.state.shop.stock[id] : 0;
        }

        if (stock < itemsPerUnit) { if(typeof UI !== 'undefined') UI.error("Händler hat das nicht mehr."); return; }

        let packsToBuy = 1; 
        if (typeof qtyMode === 'number') packsToBuy = qtyMode;
        else if (qtyMode === 'max') {
            const maxAffordable = Math.floor(Game.state.caps / pricePerUnit);
            const maxInStock = Math.floor(stock / itemsPerUnit);
            packsToBuy = Math.min(maxAffordable, maxInStock);
            if(packsToBuy > 100) packsToBuy = 100;
            if(packsToBuy < 1) packsToBuy = 1; 
        }

        const totalCost = packsToBuy * pricePerUnit;
        const totalItemsReceived = packsToBuy * itemsPerUnit;

        if (totalItemsReceived > stock) { if(typeof UI !== 'undefined') UI.error("Nicht genug auf Lager."); return; }
        if (Game.state.caps < totalCost) { if(typeof UI !== 'undefined') UI.error("Nicht genug Kronkorken!"); return; }

        Game.state.caps -= totalCost;
        Game.state.shop.merchantCaps += totalCost; 
        
        if (id === 'ammo') Game.state.shop.ammoStock -= totalItemsReceived;
        else Game.state.shop.stock[id] -= packsToBuy;

        Game.addToInventory(id, totalItemsReceived); 

        if(typeof UI !== 'undefined') {
            UI.log(`Gekauft: ${packsToBuy}x ${itemsPerUnit > 1 ? 'Paket ' : ''}${item.name} (-${totalCost} KK).`);
            if (Game.state.view === 'shop') UI.renderShop('buy'); 
        }
        Game.saveGame();
    },

    sellItem: function(invIndex, qtyMode = 1) {
        const entry = Game.state.inventory[invIndex];
        if (!entry) return;
        
        // [FIX] Camp Kit nicht verkaufbar
        if (entry.id === 'camp_kit') { if(typeof UI !== 'undefined') UI.error("Das brauchst du noch!"); return; }

        const item = Game.items[entry.id];
        if (!item) return;

        let valMult = entry.props && entry.props.valMult ? entry.props.valMult : 1;
        let unitPrice = Math.floor((item.cost * 0.25) * valMult);
        if (unitPrice < 1) unitPrice = 1;

        let amount = 1;
        if (typeof qtyMode === 'number') amount = qtyMode;
        else if (qtyMode === 'max') {
            amount = entry.count;
            const maxMerchantCanBuy = Math.floor(Game.state.shop.merchantCaps / unitPrice);
            if (amount > maxMerchantCanBuy) amount = maxMerchantCanBuy;
        }

        if (amount > entry.count) amount = entry.count;
        if (amount <= 0) { UI.error("Händler pleite!"); return; }

        const totalValue = unitPrice * amount;
        if (Game.state.shop.merchantCaps < totalValue) { UI.error("Händler hat nicht genug Kronkorken."); return; }

        Game.state.caps += totalValue;
        Game.state.shop.merchantCaps -= totalValue;

        entry.count -= amount;
        if(entry.count <= 0) {
            Game.state.inventory.splice(invIndex, 1);
        }

        if (entry.id === 'ammo') {
            Game.state.shop.ammoStock = (Game.state.shop.ammoStock || 0) + amount;
            if(this.syncAmmo) this.syncAmmo();
        }
        else {
             if (!Game.state.shop.stock[entry.id]) Game.state.shop.stock[entry.id] = 0;
             Game.state.shop.stock[entry.id] += amount;
        }

        if(typeof UI !== 'undefined') {
            UI.log(`Verkauft: ${amount}x ${item.name} (+${totalValue} KK).`);
            if (Game.state.view === 'shop') UI.renderShop('sell');
        }
        Game.saveGame();
    }
});
