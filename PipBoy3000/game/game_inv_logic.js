// [2026-01-19 12:30:00] game_inv_logic.js - Legendary Loot & Full Item Support

Object.assign(Game, {

    getMaxSlots: function() {
        let base = 10;
        if (this.state.stats) base += (this.state.stats.STR || 1);
        
        const strongBack = this.getPerkLevel('strong_back');
        if (strongBack > 0) base += (strongBack * 5);

        if (this.state.equip && this.state.equip.back) {
            const pack = this.state.equip.back;
            let packBonus = 0;
            if (pack.bonus && pack.bonus.slots) packBonus = pack.bonus.slots;
            else if (pack.props && pack.props.bonus && pack.props.bonus.slots) packBonus = pack.props.bonus.slots;
            else if (this.items[pack.id] && this.items[pack.id].bonus && this.items[pack.id].bonus.slots) {
                packBonus = this.items[pack.id].bonus.slots;
            }
            base += packBonus;
        }
        return base;
    },

    // [MODIFIED] addToInventory supports custom full item objects (for Legendaries)
    addToInventory: function(idOrItem, count=1, customData=null) { 
        if(!this.state.inventory) this.state.inventory = []; 
        let itemId, props = null, fullItemObj = null;

        // Fall 1: idOrItem ist ein Objekt (alter Code) oder das neue Legendary Object
        if(typeof idOrItem === 'object') {
            itemId = idOrItem.id;
            props = idOrItem.props;
            count = idOrItem.count || count || 1; // Count kann im Objekt oder als Parameter sein
            fullItemObj = idOrItem; // Speichere das ganze Objekt für später
        } else { 
            // Fall 2: ID String + optional customData
            itemId = idOrItem; 
            if(customData) fullItemObj = customData;
        }

        if (itemId === 'camp_kit') {
            const hasCamp = this.state.inventory.some(i => i.id === 'camp_kit');
            if (hasCamp) return false; 
        }

        const limit = this.getStackLimit(itemId);
        let remaining = count;
        let added = false;
        let isActuallyNew = false; 

        // 1. Stacken (nur wenn es keine einzigartigen Eigenschaften hat)
        // Legendaries mit UID sollten NICHT gestapelt werden
        if (!props && (!fullItemObj || !fullItemObj.uid)) {
            for (let item of this.state.inventory) {
                if (item.id === itemId && !item.props && !item.uid && item.count < limit) {
                    const space = limit - item.count;
                    const take = Math.min(space, remaining);
                    item.count += take;
                    remaining -= take;
                    added = true;
                    if (remaining <= 0) break;
                }
            }
        }

        // 2. Neuer Slot
        if (remaining > 0) {
            const maxSlots = this.getMaxSlots();
            while (remaining > 0) {
                if (this.getUsedSlots() >= maxSlots) {
                    UI.log("INVENTAR VOLL!", "text-red-500 font-bold blink-red");
                    if (added && itemId === 'ammo') this.syncAmmo(); 
                    return false; 
                }
                const take = Math.min(limit, remaining);
                
                let newItem;
                if(fullItemObj && (fullItemObj.uid || fullItemObj.isLegendary)) {
                    // [NEU] Wenn es ein Legendary/Custom Item ist, kopiere ALLES
                    newItem = JSON.parse(JSON.stringify(fullItemObj));
                    newItem.count = take;
                    newItem.isNew = true;
                    // Sicherstellen, dass ID gesetzt ist
                    if(!newItem.id) newItem.id = itemId;
                } else {
                    // Standard Item
                    newItem = { id: itemId, count: take, isNew: true };
                    if (props) newItem.props = props;
                }

                this.state.inventory.push(newItem);
                remaining -= take;
                added = true;
                isActuallyNew = true; 
            }
        }

        if (added) {
            const itemDef = this.items[itemId];
            // Name kann vom Custom Object kommen
            let name = (fullItemObj && fullItemObj.name) ? fullItemObj.name : ((props && props.name) ? props.name : (itemDef ? itemDef.name : itemId));
            const color = (props && props.color) ? props.color.split(' ')[0] : "text-green-400";
            
            if(itemId !== 'ammo' || count < 10) {
                UI.log(`+ ${name} (${count})`, color);
            } else {
                UI.log(`+ ${count} Munition`, "text-green-400");
            }
            
            if (itemId === 'ammo') this.syncAmmo();
            
            if(typeof Game.updateQuestProgress === 'function') {
                Game.updateQuestProgress('collect', itemId, count);
            }
            
            if(isActuallyNew && typeof UI !== 'undefined' && UI.triggerInventoryAlert) {
                UI.triggerInventoryAlert();
            }
            this.updateWeight(); // Gewicht neu berechnen
            return true;
        }
        return false;
    }, 

    removeFromInventory: function(itemId, amount=1) {
        if(!this.state) return false;
        let remaining = amount;
        
        for (let i = 0; i < this.state.inventory.length; i++) {
            const item = this.state.inventory[i];
            if (item.id === itemId) {
                const take = Math.min(item.count, remaining);
                item.count -= take;
                remaining -= take;
                if (item.count <= 0) {
                    this.state.inventory.splice(i, 1);
                    i--;
                }
                if (remaining <= 0) break;
            }
        }
        if(itemId === 'ammo') this.syncAmmo();
        this.updateWeight();
        return remaining === 0;
    },

    destroyItem: function(invIndex) {
        if(!this.state.inventory || !this.state.inventory[invIndex]) return;
        const item = this.state.inventory[invIndex];
        
        if (item.id === 'fists' || item.id === 'vault_suit' || item.id === 'camp_kit') {
            UI.log("Das ist ein permanenter Gegenstand.", "text-gray-500");
            return;
        }

        const def = this.items[item.id];
        let name = (item.props && item.props.name) ? item.props.name : (item.name || def.name);

        this.state.inventory.splice(invIndex, 1);
        if(item.id === 'ammo') this.syncAmmo();
        
        UI.log(`${name} weggeworfen.`, "text-red-500 italic");
        this.updateWeight();
        UI.update();
        if(this.state.view === 'inventory') UI.renderInventory();
        this.saveGame();
    },

    scrapItem: function(invIndex) {
        if(!this.state.inventory || !this.state.inventory[invIndex]) return;
        const item = this.state.inventory[invIndex];

        if (item.id === 'fists' || item.id === 'vault_suit' || item.id === 'camp_kit') {
            UI.log("Dieses Objekt kann nicht zerlegt werden!", "text-red-500");
            return;
        }

        if (this.state.view !== 'crafting') {
            UI.log("Zerlegen nur an einer Werkbank möglich!", "text-red-500");
            return;
        }

        if (item.id === 'junk_metal') {
            UI.log("Das ist bereits Schrott.", "text-orange-500");
            return;
        }
        
        const def = this.items[item.id];
        if(!def) return;
        
        let name = (item.props && item.props.name) ? item.props.name : (item.name || def.name);
        let value = def.cost || 5;
        // Legendaries geben mehr Schrott
        if(item.isLegendary) value *= 2;
        
        this.state.inventory.splice(invIndex, 1);

        let scrapAmount = Math.max(1, Math.floor(value / 10)); 
        const perkLvl = this.getPerkLevel('scrapper');
        if(perkLvl > 0) { scrapAmount += perkLvl; }

        this.addToInventory('junk_metal', scrapAmount);
        let msg = `Zerlegt: ${name} -> ${scrapAmount}x Schrott`;

        let screwChance = 0.3 + (perkLvl * 0.15); 
        const isComplex = def.type === 'weapon' || def.type === 'junk' || def.type === 'tool';

        if(isComplex && Math.random() < screwChance) {
            let screws = Math.max(1, Math.floor(value / 50));
            if (perkLvl >= 2 && Math.random() < 0.4) screws *= 2;
            this.addToInventory('screws', screws);
            msg += `, ${screws}x Schrauben`;
        }
        
        let plasticChance = 0.2 + (perkLvl * 0.15);
        if(value >= 100 && Math.random() < plasticChance) {
            let plastic = 1;
            if (perkLvl >= 3) plastic += 1;
            this.addToInventory('plastic', plastic);
            msg += `, ${plastic}x Plastik`;
        }

        UI.log(msg, "text-orange-400 font-bold");
        this.updateWeight();
        UI.update();
        if(typeof UI.renderCrafting === 'function') UI.renderCrafting('scrap');
        this.saveGame();
    },

    craftItem: function(recipeId) {
        const recipe = this.recipes.find(r => r.id === recipeId);
        if(!recipe) return;
        if(this.state.lvl < recipe.lvl) { UI.log(`Benötigt Level ${recipe.lvl}!`, "text-red-500"); return; }
        
        for(let reqId in recipe.req) {
            const countNeeded = recipe.req[reqId];
            const invItem = this.state.inventory.find(i => i.id === reqId);
            if (!invItem || invItem.count < countNeeded) { UI.log(`Material fehlt: ${this.items[reqId].name}`, "text-red-500"); return; }
        }
        for(let reqId in recipe.req) {
            const countNeeded = recipe.req[reqId];
            const invItem = this.state.inventory.find(i => i.id === reqId);
            invItem.count -= countNeeded;
            if(invItem.count <= 0) this.state.inventory = this.state.inventory.filter(i => i.id !== reqId);
        }
        
        if(recipe.out === "AMMO") { 
            this.addToInventory('ammo', recipe.count);
        } else { 
            this.addToInventory(recipe.out, recipe.count); 
        }
        
        UI.log(`Hergestellt: ${recipe.count}x ${recipe.out === "AMMO" ? "Munition" : this.items[recipe.out].name}`, "text-green-400 font-bold");

        if(typeof Game.updateQuestProgress === 'function' && recipe.out !== "AMMO") {
            Game.updateQuestProgress('collect', recipe.out, recipe.count);
        }

        this.updateWeight();

        if(recipe.type === 'cooking') {
            if(typeof UI.renderCampCooking === 'function') UI.renderCampCooking();
        } else {
            if(typeof UI !== 'undefined') UI.renderCrafting(); 
        }
    },

    unequipItem: function(slot) {
        if(!this.state.equip[slot]) return;
        const item = this.state.equip[slot];

        if(item.id === 'fists' || item.id === 'vault_suit' || item.name === "Fäuste" || item.name === "Vault-Anzug") {
             UI.log("Das gehört zu deiner Grundausstattung.", "text-gray-500");
             return;
        }

        if(this.getUsedSlots() >= this.getMaxSlots()) {
             UI.log("Inventar voll! Ablegen nicht möglich.", "text-red-500");
             return;
        }

        // Ins Inventar legen
        let itemToAdd = item._fromInv || item.id;
        
        // [FIX] Wenn es ein Legendary oder bearbeitetes Item ist, als Objekt speichern
        if (item.uid || item.isLegendary) {
            // Kopiere alle Eigenschaften außer _fromInv
            const { _fromInv, ...rest } = item;
            itemToAdd = rest;
            itemToAdd.count = 1;
        } else {
            // Standard Item Fallback
            if (!itemToAdd && item.id) itemToAdd = item.id;
            let objToAdd = itemToAdd;
            if (!item._fromInv && item.props) objToAdd = { id: item.id, count: 1, props: item.props };
            else if (typeof itemToAdd === 'string') objToAdd = { id: itemToAdd, count: 1 };
            itemToAdd = objToAdd;
        }

        this.state.inventory.push(itemToAdd);
        
        if(slot === 'weapon') {
            const fists = this.items['fists'] ? { ...this.items['fists'] } : { id: 'fists', name: 'Fäuste', baseDmg: 2, type: 'weapon' };
            this.state.equip.weapon = fists;
            UI.log(`${item.name || 'Waffe'} abgelegt. Du nutzt nun deine Fäuste.`, "text-yellow-400");
        } else if(slot === 'body') {
            const suit = this.items['vault_suit'] ? { ...this.items['vault_suit'] } : { id: 'vault_suit', name: 'Vault-Anzug', def: 1, type: 'body' };
            this.state.equip.body = suit;
            UI.log(`${item.name || 'Rüstung'} abgelegt. Du trägst wieder deinen Vault-Anzug.`, "text-blue-400");
        } else {
            this.state.equip[slot] = null; 
            UI.log(`${item.name || 'Item'} abgelegt.`, "text-yellow-400");
        }

        this.recalcStats();
        this.updateWeight();
        if(typeof UI !== 'undefined') {
            if(this.state.view === 'char') UI.renderChar(); 
            if(this.state.view === 'inventory') UI.renderInventory(); 
        }
        this.saveGame();
    },

    useItem: function(invIndexOrId, mode = 1) { 
        let invItem, index;
        if(typeof invIndexOrId === 'string') {
            index = this.state.inventory.findIndex(i => i.id === invIndexOrId);
        } else { index = invIndexOrId; }

        if(index === -1 || !this.state.inventory[index]) return;
        invItem = this.state.inventory[index];
        const itemDef = this.items[invItem.id];
        
        if (itemDef.type === 'back') {
            const slot = 'back';
            let oldEquip = this.state.equip[slot];
            
            this.state.inventory.splice(index, 1);
            
            if(oldEquip) {
                // [FIX] Wenn alt Item custom war, als solches zurückgeben
                if(oldEquip.uid || oldEquip.isLegendary) {
                     const { _fromInv, ...rest } = oldEquip;
                     const oldItem = { ...rest, count: 1, isNew: true };
                     this.state.inventory.push(oldItem);
                } else {
                     const oldItem = { id: oldEquip.id, count: 1, props: oldEquip.props, isNew: true };
                     this.state.inventory.push(oldItem);
                }
            }
            
            // Neues Item ausrüsten (merge props/custom stats)
            this.state.equip[slot] = { ...itemDef, ...invItem, count: 1 };
            
            UI.log(`Rucksack angelegt: ${invItem.name || itemDef.name}`, "text-yellow-400");
            
            if(this.getUsedSlots() > this.getMaxSlots()) UI.log("WARNUNG: Überladen!", "text-red-500 blink-red");
            
            this.updateWeight();
            UI.update();
            if(this.state.view === 'inventory') UI.renderInventory();
            this.saveGame();
            return;
        }

        if(invItem.id === 'camp_kit') { this.deployCamp(index); return; }

        if(invItem.id === 'nuka_cola') {
            const effectiveMax = this.state.maxHp - (this.state.rads || 0);
            this.state.hp = Math.min(this.state.hp + 15, effectiveMax);
            this.state.caps += 1;
            this.addRadiation(5);
            UI.log("Nuka Cola: Erfrischend... und strahlend.", "text-blue-400");
            this.removeFromInventory('nuka_cola', 1);
            UI.update();
            return;
        }

        if(invItem.id === 'radaway') {
            this.addRadiation(-50); 
            UI.log("RadAway verwendet. Strahlung sinkt.", "text-green-300 font-bold");
            this.removeFromInventory('radaway', 1);
            UI.update();
            return;
        }

        if(itemDef.type === 'blueprint') {
            if(!this.state.knownRecipes.includes(itemDef.recipeId)) {
                this.state.knownRecipes.push(itemDef.recipeId);
                UI.log(`Gelernt: ${itemDef.name}`, "text-cyan-400 font-bold");
                invItem.count--;
                if(invItem.count <= 0) this.state.inventory.splice(index, 1);
            } else { UI.log("Du kennst diesen Bauplan bereits.", "text-gray-500"); }
            return;
        }
        else if(itemDef.type === 'consumable') { 
            if(itemDef.effect === 'heal' || itemDef.effect === 'heal_rad' || itemDef.effect === 'buff') { 
                let healAmt = itemDef.val || 0; 
                
                const medicLvl = this.getPerkLevel('medic');
                if(medicLvl > 0 && healAmt > 0) {
                    const bonus = 1 + (medicLvl * 0.2); 
                    healAmt = Math.floor(healAmt * bonus);
                }

                const effectiveMax = this.state.maxHp - (this.state.rads || 0);
                
                if(itemDef.effect === 'heal' && this.state.hp >= effectiveMax) { 
                    UI.log("Gesundheit voll.", "text-gray-500"); return; 
                } 
                
                let countToUse = 1;
                if (mode === 'max' && healAmt > 0) {
                    const missing = effectiveMax - this.state.hp;
                    if (missing > 0) {
                        countToUse = Math.ceil(missing / healAmt);
                        if (countToUse > invItem.count) countToUse = invItem.count;
                    } else { countToUse = 0; }
                }

                if (countToUse > 0) {
                    const totalHeal = healAmt * countToUse;
                    if(totalHeal > 0) this.state.hp = Math.min(effectiveMax, this.state.hp + totalHeal); 
                    
                    if(itemDef.effect === 'heal_rad' && itemDef.rad) {
                        this.addRadiation(itemDef.rad * countToUse);
                    }
                    if(itemDef.effect === 'buff') {
                        UI.log(`${itemDef.name} konsumiert! (Effekte noch WIP)`, "text-pink-400");
                    } else {
                         UI.log(`Verwendet: ${countToUse}x ${itemDef.name} (+${totalHeal} HP)`, "text-blue-400"); 
                    }
                    this.removeFromInventory(invItem.id, countToUse);
                }
            } 
        } 
        else {
            const validSlots = ['weapon', 'body', 'head', 'legs', 'feet', 'arms'];
            if(validSlots.includes(itemDef.type)) {
                const slot = itemDef.slot || itemDef.type;
                let oldEquip = this.state.equip[slot];
                
                if(oldEquip && oldEquip.id !== "fists" && oldEquip.id !== "vault_suit") {
                    if(oldEquip._fromInv) this.state.inventory.push(oldEquip._fromInv);
                    else {
                        // Wenn oldEquip legendär war und kein _fromInv hat (sollte nicht passieren),
                        // müssen wir es rekonstruieren
                        if(oldEquip.uid) {
                             const { _fromInv, ...rest } = oldEquip;
                             this.state.inventory.push({ ...rest, count: 1, isNew: true });
                        } else {
                             const oldKey = Object.keys(this.items).find(k => this.items[k].name === oldEquip.name);
                             if(oldKey) this.state.inventory.push({id: oldKey, count: 1, isNew: true});
                        }
                    }
                } 
                
                this.state.inventory.splice(index, 1);
                
                // [FIX] Speichere das ganze Inventar-Item im Slot (enthält Stats)
                const equipObject = { ...itemDef, ...invItem, _fromInv: invItem, count: 1 }; 
                this.state.equip[slot] = equipObject;
                
                const displayName = invItem.name || itemDef.name; // Nimm Custom Namen zuerst
                UI.log(`Ausgerüstet: ${displayName}`, "text-yellow-400"); 
                
                this.recalcStats();
                const effectiveMax = this.state.maxHp - (this.state.rads || 0);
                if(this.state.hp > effectiveMax) this.state.hp = effectiveMax;
            }
        } 
        
        this.updateWeight();
        UI.update(); 
        if(this.state.view === 'inventory') UI.renderInventory(); 
        this.saveGame(); 
    },

    switchToBestMelee: function() {
        const oldWeapon = this.state.equip.weapon;
        const oldName = (oldWeapon && oldWeapon.name && oldWeapon.id !== 'fists') 
            ? (oldWeapon.props?.name || oldWeapon.name) 
            : "Fernkampfwaffe";

        if(!this.state.inventory || this.state.inventory.length === 0) {
            const fists = this.items['fists'] ? { ...this.items['fists'] } : { id: 'fists', name: 'Fäuste', baseDmg: 2, type: 'weapon' };
            this.state.equip.weapon = fists;
            UI.log("Waffe abgelegt. Nutze Fäuste.", "text-red-500 font-bold");
            if(typeof UI.renderChar === 'function') UI.renderChar();
            return;
        }

        let bestWeapon = null;
        let bestDmg = -1;
        let bestIndex = -1;

        this.state.inventory.forEach((item, idx) => {
            const def = this.items[item.id];
            if (!def) return;

            const type = def.type ? def.type.toLowerCase() : '';
            const isWeaponType = type === 'weapon' || type === 'melee' || type === 'weapon_melee' || type.includes('weapon');
            const needsAmmo = (item.ammoType || def.ammo) && (item.ammoType || def.ammo) !== 'none';

            if (isWeaponType && !needsAmmo) {
                // [FIX] Nutze echte Item Stats
                let dmg = item.dmg || def.dmg || 0;
                if (item.props && item.props.dmgMult) dmg *= item.props.dmgMult;
                
                if (dmg > bestDmg) {
                    bestDmg = dmg;
                    bestWeapon = item;
                    bestIndex = idx;
                }
            }
        });

        if (bestWeapon) {
            this.useItem(bestIndex); 
            const newName = bestWeapon.name || bestWeapon.props?.name || this.items[bestWeapon.id].name;
            UI.log(`${newName} wurde statt ${oldName} angelegt (Munition leer)`, "text-yellow-400 blink-red");
        } else {
            const fists = this.items['fists'] ? { ...this.items['fists'] } : { id: 'fists', name: 'Fäuste', baseDmg: 2, type: 'weapon' };
            this.state.equip.weapon = fists;
            UI.log("Keine Nahkampfwaffe gefunden! Du kämpfst mit Fäusten!", "text-red-500");
        }
        if(typeof UI.renderChar === 'function') UI.renderChar();
    },

    // [NEU] Wichtig für Minigame Loot!
    gambleLegendaryLoot: function(score) {
        const roll = Math.random() * 100;
        const chance = score * 2; 
        
        if(roll > chance) {
            UI.log(`Kein Glück (${Math.floor(roll)} > ${chance})`, "text-gray-500");
            this.state.caps += score;
            return;
        }

        const bases = ['pistol', 'rifle', 'shotgun', 'machete', 'super_sledge'];
        const baseId = bases[Math.floor(Math.random() * bases.length)];
        const baseItem = this.items[baseId];

        if(!baseItem) return;

        const prefixes = [
            { name: "Brutale", dmgMod: 1.3, desc: "+30% Schaden" },
            { name: "Doppelschuss", dmgMod: 1.5, ammoMod: 2, desc: "Doppelter Schaden, doppelter Verbrauch" },
            { name: "Vampir", hpDrain: 5, desc: "Heilt 5 TP pro Treffer" },
            { name: "Atomare", dmgMod: 1.2, rads: 5, desc: "Verstrahlt den Gegner" },
            { name: "Leichte", weightMod: 0.5, desc: "50% weniger Gewicht" }
        ];

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        // [WICHTIG] Das Legendäre Item bauen und Werte festschreiben
        const legendaryItem = JSON.parse(JSON.stringify(baseItem));
        
        legendaryItem.id = baseId; 
        legendaryItem.uid = 'LEGEND_' + Date.now(); 
        legendaryItem.name = `${prefix.name} ${baseItem.name} ★`;
        legendaryItem.isLegendary = true;
        legendaryItem.desc = prefix.desc;
        legendaryItem.value = (baseItem.value || 10) * 5;
        
        if(prefix.dmgMod) legendaryItem.dmg = Math.floor((baseItem.dmg || 1) * prefix.dmgMod);
        else legendaryItem.dmg = baseItem.dmg;

        legendaryItem.ammoType = baseItem.ammoType; 
        if(prefix.ammoMod) legendaryItem.ammoCost = (baseItem.ammoCost || 1) * prefix.ammoMod;
        else legendaryItem.ammoCost = baseItem.ammoCost || 1;

        if(prefix.hpDrain) legendaryItem.effectHeal = prefix.hpDrain;
        if(prefix.rads) legendaryItem.effectRad = prefix.rads;
        if(prefix.weightMod) legendaryItem.weight = (baseItem.weight || 1) * prefix.weightMod;

        // Custom Item hinzufügen
        this.addToInventory(legendaryItem, 1);
        
        UI.log("LEGENDÄRES ITEM ERHALTEN!", "text-yellow-400 font-bold animate-pulse");
        if(typeof UI.showItemOverlay === 'function') UI.showItemOverlay(legendaryItem);
    },
    
    updateWeight: function() {
        if(!this.state.player) return;
        let w = 0;
        if(this.state.inventory) {
            this.state.inventory.forEach(i => {
                const weight = (i.weight !== undefined) ? i.weight : (this.items[i.id] ? this.items[i.id].weight : 0);
                w += weight * (i.count || 1);
            });
        }
        this.state.player.carryWeight = Math.floor(w * 10) / 10;
    }
});

// Alias für Kompatibilität
Game.addItem = Game.addToInventory;
