// [2026-02-21 09:40:00] game_combat.js - Auto-Repair & Bulletproof Combat

window.Combat = {
    enemy: null,
    turn: 'player', 
    logData: [], 
    selectedPart: 1, 
    
    bodyParts: [
        { name: "KOPF", hitMod: 0.6, dmgMod: 2.0 }, 
        { name: "KÖRPER", hitMod: 1.0, dmgMod: 1.0 }, 
        { name: "BEINE", hitMod: 1.3, dmgMod: 0.8 }
    ],

    // [NEU] REPARATUR-TOOL: Heilt kaputte Spielstände (NaN Errors)
    repairState: function() {
        if (!Game.state) return;
        if (isNaN(Game.state.xp) || Game.state.xp === null) Game.state.xp = 0;
        if (isNaN(Game.state.lvl) || Game.state.lvl === null) Game.state.lvl = 1;
        if (isNaN(Game.state.caps) || Game.state.caps === null) Game.state.caps = 0;
        if (isNaN(Game.state.kills) || Game.state.kills === null) Game.state.kills = 0;
        if (isNaN(Game.state.hp) || Game.state.hp === null) Game.state.hp = Game.state.maxHp || 20;
    },

    start: function(enemyInput) {
        this.repairState(); // Repariert den Spieler VOR dem Kampf

        let enemyData = enemyInput;
        
        if (typeof enemyInput === 'string') {
            if (Game.monsters && Game.monsters[enemyInput]) {
                enemyData = Game.monsters[enemyInput];
                enemyData.id = enemyInput; 
            } else {
                enemyData = { id: enemyInput, name: "Mutierte Kreatur", hp: 20, dmg: 2, xp: 5 };
            }
        }
        
        Game.state.enemy = JSON.parse(JSON.stringify(enemyData || {})); 
        
        Game.state.enemy.name = Game.state.enemy.name || "Unbekanntes Monster";
        Game.state.enemy.hp = Game.state.enemy.hp || 20;
        Game.state.enemy.maxHp = Game.state.enemy.maxHp || Game.state.enemy.hp;
        Game.state.enemy.dmg = Game.state.enemy.dmg || 2;
        Game.state.enemy.xp = Game.state.enemy.xp || 5;

        this.enemy = Game.state.enemy;
        Game.state.view = 'combat';
        
        this.logData = [];
        this.turn = 'player';
        this.selectedPart = 1; 
        
        this.log(`Kampf gestartet gegen: ${this.enemy.name}`, 'text-yellow-400 blink-red');
        UI.switchView('combat').then(() => {
            this.render();
            this.moveSelection(0); 
        });
    },

    log: function(msg, color='text-gray-300') {
        this.logData.unshift({t: msg, c: color});
        if(this.logData.length > 6) this.logData.pop();
        this.renderLogs();
    },

    renderLogs: function() {
        const el = document.getElementById('combat-log');
        if(!el) return;
        el.innerHTML = this.logData.map(l => `<div class="${l.c}">${l.t}</div>`).join('');
    },

    render: function() {
        if(typeof UI.renderCombat === 'function') UI.renderCombat();
        this.renderLogs();
    },

    moveSelection: function(dir) {
        if (typeof this.selectedPart === 'undefined') this.selectedPart = 1;
        this.selectedPart += dir;
        
        if (this.selectedPart < 0) this.selectedPart = 2;
        if (this.selectedPart > 2) this.selectedPart = 0;

        for(let i=0; i<3; i++) {
            const btn = document.getElementById(`btn-vats-${i}`);
            if(btn) {
                btn.classList.remove('border-yellow-400', 'text-yellow-400', 'bg-yellow-900/40');
                if(i === this.selectedPart) {
                    btn.classList.add('border-yellow-400', 'text-yellow-400', 'bg-yellow-900/40');
                }
            }
        }
    },
    
    selectPart: function(index) {
        this.selectedPart = index;
        this.moveSelection(0); 
    },

    confirmSelection: function() {
        if(this.turn === 'player') {
            this.playerAttack();
        }
    },

    triggerFeedback: function(type, value) {
        const layer = document.getElementById('combat-feedback-layer');
        if(!layer) return;

        const el = document.createElement('div');
        el.className = "float-text absolute font-bold text-4xl pointer-events-none z-50 text-shadow-black";
        
        const offset = Math.floor(Math.random() * 40) - 20;
        const offsetY = Math.floor(Math.random() * 40) - 20;
        el.style.transform = `translate(${offset}px, ${offsetY}px)`;

        if(type === 'hit') {
            el.innerHTML = `-${value}`;
            el.className += " text-yellow-400 animate-float-up"; 
        } else if(type === 'crit') {
            el.innerHTML = `CRIT! -${value}`;
            el.className += " text-red-500 text-6xl blink-red animate-float-up"; 
        } else if(type === 'miss') {
            el.innerHTML = "MISS";
            el.className += " text-gray-500 text-2xl animate-fade-out";
        } else if(type === 'damage') {
            el.innerHTML = `-${value}`;
            el.className += " text-red-600 animate-shake"; 
            
            const flash = document.getElementById('damage-flash');
            if(flash) {
                flash.classList.remove('hidden');
                flash.style.opacity = 0.5;
                setTimeout(() => { flash.style.opacity = 0; flash.classList.add('hidden'); }, 300);
            }
        } else if(type === 'dodge') {
            el.innerHTML = "AUSGEWICHEN";
            el.className += " text-blue-400 text-2xl animate-fade-out";
        }

        layer.appendChild(el);
        setTimeout(() => { el.remove(); }, 1000);
    },

    getSafeWeapon: function() {
        let wpn = Game.state.equip.weapon;
        if (!wpn) return { id: 'fists', name: 'Fäuste', baseDmg: 2 };

        if (!wpn.id && wpn.name) {
            const foundId = Object.keys(Game.items).find(k => Game.items[k].name === wpn.name);
            if(foundId) wpn.id = foundId; 
            else return { id: 'fists', name: 'Fäuste (Fallback)', baseDmg: 2 };
        }
        
        if (!wpn.id) return { id: 'fists', name: 'Fäuste', baseDmg: 2 };

        return wpn;
    },

    getWeaponStats: function(item) {
        const dbItem = Game.items[item.id] || {};
        const dmg = (item.dmg !== undefined) ? item.dmg : (item.baseDmg || dbItem.dmg || 2);
        const ammoType = item.ammoType || dbItem.ammoType || null;
        const ammoCost = (item.ammoCost !== undefined) ? item.ammoCost : (dbItem.ammoCost || 1);
        
        return { dmg, ammoType, ammoCost };
    },

    calculateHitChance: function(partIndex) {
        const part = this.bodyParts[partIndex];
        const perception = Game.getStat('PER');
        
        let chance = 50 + (perception * 5);
        chance *= part.hitMod;
        
        const wpn = this.getSafeWeapon();
        const wId = wpn.id.toLowerCase();
        
        const rangedKeywords = ['pistol', 'rifle', 'gun', 'shotgun', 'smg', 'minigun', 'blaster', 'sniper', 'cannon', 'gewehr', 'flinte', 'revolver'];
        const isRanged = rangedKeywords.some(k => wId.includes(k));

        if (!isRanged) chance += 20; 

        return Math.min(95, Math.floor(chance));
    },

    playerAttack: function() {
        if(this.turn !== 'player') return;

        const partIndex = this.selectedPart;
        const part = this.bodyParts[partIndex];
        const hitChance = this.calculateHitChance(partIndex);
        
        let wpn = this.getSafeWeapon();
        const stats = this.getWeaponStats(wpn);
        const wId = wpn.id.toLowerCase();

        if(stats.ammoType && wId !== 'alien_blaster') { 
             const hasAmmo = Game.removeFromInventory(stats.ammoType, stats.ammoCost);
             if(!hasAmmo) {
                 if(typeof UI.showCombatEffect === 'function') {
                     UI.showCombatEffect("* KLICK *", "MUNITION LEER!", "red", 2300);
                 }
                 this.log("WAFFE LEER! *KLICK*", "text-red-500 font-bold text-xl");
                 setTimeout(() => {
                     if (typeof Game.switchToBestMelee === 'function') {
                         Game.switchToBestMelee();
                     } else {
                         this.log("Manuell wechseln!", "text-yellow-400");
                     }
                 }, 800);
                 return; 
             }
        }

        const roll = Math.random() * 100;
        
        const screen = document.getElementById('game-screen');
        if(screen) {
            screen.classList.add('shake-anim'); 
            setTimeout(() => screen.classList.remove('shake-anim'), 200);
        }

        if(roll <= hitChance) {
            let dmg = stats.dmg;
            if(wpn.props && wpn.props.dmgMult) dmg *= wpn.props.dmgMult;

            const isRanged = stats.ammoType !== null; 

            if(!isRanged || wpn.id === 'rifle_butt') {
                dmg += Math.floor(Game.getStat('STR') / 2);
                const sluggerLvl = Game.getPerkLevel('slugger');
                if(sluggerLvl > 0) dmg = Math.floor(dmg * (1 + (sluggerLvl * 0.1)));
            } else {
                const gunLvl = Game.getPerkLevel('gunslinger');
                if(gunLvl > 0) dmg = Math.floor(dmg * (1 + (gunLvl * 0.1)));
            }

            dmg *= part.dmgMod;

            let isCrit = false;
            let critChance = Game.state.critChance || 5; 
            
            if(Math.random() * 100 <= critChance) {
                dmg *= 2;
                isCrit = true;
                this.log(">> KRITISCHER TREFFER! <<", "text-yellow-400 font-bold animate-pulse");
                if(typeof UI.showCombatEffect === 'function') UI.showCombatEffect("CRITICAL!", "DOPPELTER SCHADEN", "yellow", 1500);
                
                if (Game.getPerkLevel('mysterious_stranger') > 0) {
                    this.log("Der Fremde hilft dir...", "text-gray-400 text-xs");
                }
            }

            dmg = Math.floor(dmg);
            this.enemy.hp -= dmg;
            
            if(wpn.effectHeal) {
                Game.state.hp = Math.min(Game.getMaxHp(), Game.state.hp + wpn.effectHeal);
                this.log(`Vampir: +${wpn.effectHeal} HP`, "text-green-400");
            }
            
            this.log(`Treffer: ${part.name} für ${dmg} Schaden!`, 'text-green-400 font-bold');
            this.triggerFeedback(isCrit ? 'crit' : 'hit', dmg);

            const el = document.getElementById('enemy-img'); 
            if(el) {
                el.classList.add('animate-pulse');
                setTimeout(() => el.classList.remove('animate-pulse'), 200);
            }

            if(this.enemy.hp <= 0) {
                this.win();
                return;
            }
        } else {
            this.log("Daneben!", 'text-gray-500');
            this.triggerFeedback('miss');
        }

        this.turn = 'enemy';
        this.render(); 
        setTimeout(() => this.enemyTurn(), 1000);
    },

    enemyTurn: function() {
        if(!this.enemy || this.enemy.hp <= 0) return;
        
        const agi = Game.getStat('AGI');
        const enemyHitChance = 85 - (agi * 3); 
        
        const roll = Math.random() * 100;

        if(roll <= enemyHitChance) {
            let dmg = this.enemy.dmg;
            let armor = 0;
            const slots = ['body', 'head', 'legs', 'feet', 'arms'];
            slots.forEach(s => {
                if(Game.state.equip[s]) {
                    if (Game.state.equip[s].def) armor += Game.state.equip[s].def;
                    if (Game.state.equip[s].props && Game.state.equip[s].props.bonus && Game.state.equip[s].props.bonus.DEF) {
                        armor += Game.state.equip[s].props.bonus.DEF;
                    }
                }
            });
            
            let dmgTaken = Math.max(1, dmg - Math.floor(armor / 2));
            Game.state.hp -= dmgTaken;
            this.log(`${this.enemy.name} trifft dich: -${dmgTaken} HP`, 'text-red-500 font-bold');
            this.triggerFeedback('damage', dmgTaken);

            if(Game.state.hp <= 0) {
                Game.state.hp = 0;
                Game.state.isGameOver = true;
                
                console.log("☠️ PERMADEATH: Player died. Initiating deletion...");
                
                const slotToDelete = Game.state.saveSlot;
                
                if(typeof Network !== 'undefined' && Network.active) {
                    Network.registerDeath(Game.state);
                }
                
                if (typeof Network !== 'undefined' && slotToDelete !== undefined && slotToDelete !== null && slotToDelete !== -1) {
                    Network.deleteSlot(slotToDelete)
                        .then(() => console.log(`✅ Slot ${slotToDelete} permanent entfernt.`))
                        .catch(err => console.error("❌ Firebase Delete Error:", err));
                }
                
                if(typeof UI !== 'undefined' && UI.showGameOver) {
                    UI.showGameOver();
                }
                
                Game.state.saveSlot = -1; 
                setTimeout(() => { 
                    Game.state = null; 
                    localStorage.removeItem('pipboy_save');
                }, 1000);
                return;
            }
        } else {
            this.log(`${this.enemy.name} verfehlt dich!`, 'text-blue-300');
            this.triggerFeedback('dodge');
        }
        this.turn = 'player';
        UI.update(); 
        this.render();
    },

    win: function() {
        try {
            this.repairState(); // Sicherheitshalber vor dem Speichern nochmal reparieren

            const enemyName = (this.enemy && this.enemy.name) ? String(this.enemy.name) : "Kreatur";
            this.log(`${enemyName} besiegt!`, 'text-yellow-400 font-bold');
            
            let xpBase = 5;
            if (this.enemy && this.enemy.xp !== undefined) {
                if (Array.isArray(this.enemy.xp) && this.enemy.xp.length >= 2) {
                    xpBase = Number(this.enemy.xp[0]) + Math.floor(Math.random()*(Number(this.enemy.xp[1])-Number(this.enemy.xp[0])));
                } else {
                    xpBase = Number(this.enemy.xp) || 5;
                }
            }
            // Falls Number() versagt hat, auf 5 zurücksetzen
            if (isNaN(xpBase)) xpBase = 5;

            if(typeof Game.gainExp === 'function') Game.gainExp(xpBase);
            
            if(this.enemy && this.enemy.loot !== undefined) {
                let maxLoot = Number(this.enemy.loot);
                if (!isNaN(maxLoot) && maxLoot > 0) {
                    let caps = Math.floor(Math.random() * maxLoot) + 1;
                    if(Game.state) Game.state.caps = (Game.state.caps || 0) + caps;
                    this.log(`Gefunden: ${caps} Kronkorken`, 'text-yellow-200');
                }
            }
            
            if(this.enemy && this.enemy.drops) {
                let dropsArr = Array.isArray(this.enemy.drops) ? this.enemy.drops : [this.enemy.drops];
                dropsArr.forEach(d => {
                    if (d && d.id && typeof Game.addToInventory === 'function') {
                        let chance = (d.c !== undefined) ? Number(d.c) : 1;
                        if(Math.random() < chance) Game.addToInventory(d.id, 1);
                    }
                });
            }

            let mobId = (this.enemy && this.enemy.id) ? this.enemy.id : null;
            if(!mobId && typeof Game.monsters === 'object' && Game.monsters !== null) {
                const cleanName = enemyName.replace(/Legendäre /g, '').replace(/Legendärer /g, '');
                for(let k in Game.monsters) {
                    if(Game.monsters[k] && Game.monsters[k].name === cleanName) {
                        mobId = k;
                        break;
                    }
                }
            }
            
            if(mobId && typeof Game.updateQuestProgress === 'function') {
                Game.updateQuestProgress('kill', mobId, 1);
            }

            if(Game.state) {
                if(isNaN(Game.state.kills)) Game.state.kills = 0;
                Game.state.kills++;
            }
            if(typeof Game.saveGame === 'function') Game.saveGame();

        } catch (err) {
            console.error("Combat Win Error gesichert:", err);
            this.log("Systemfehler behoben.", "text-gray-500");
        } finally {
            setTimeout(() => {
                if(Game.state) Game.state.enemy = null;
                if(typeof UI.switchView === 'function') UI.switchView('map');
            }, 1500);
        }
    },

    flee: function() {
        this.repairState(); // Auch bei der Flucht aufräumen
        if(Math.random() < 0.5) {
            this.log("Flucht gelungen!", 'text-green-400');
            this.triggerFeedback('dodge'); 
            setTimeout(() => {
                Game.state.enemy = null;
                UI.switchView('map');
            }, 800);
        } else {
            this.log("Flucht fehlgeschlagen!", 'text-red-500');
            this.turn = 'enemy';
            setTimeout(() => this.enemyTurn(), 800);
        }
    }
};
