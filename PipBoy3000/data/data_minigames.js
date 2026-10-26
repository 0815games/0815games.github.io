// [TIMESTAMP] 2026-01-18 18:30:00 - minigames.js - Full File Refreshed

window.MiniGames = {
    active: null,

    // --- HACKING ---
    hacking: {
        words: [], password: "", attempts: 4, logs: [],
        
        init: function() {
            const int = Game.getStat('INT') || 1; 
            const diff = 12 - Math.min(8, int);
            const wordList = ["PASS", "FAIL", "DATA", "CODE", "HACK", "BIOS", "BOOT", "USER", "ROOT", "WIFI", "LINK", "NODE", "CORE", "DISK", "FILE", "SAVE", "LOAD", "EXIT"];
            
            this.words = [];
            while(this.words.length < diff) {
                const w = wordList[Math.floor(Math.random() * wordList.length)];
                if(!this.words.includes(w)) {
                    this.words.push(w);
                }
            }
            
            this.password = this.words[Math.floor(Math.random() * this.words.length)];
            this.attempts = 4;
            this.logs = ["> SYSTEM LOCKED", "> ENTER PASSWORD"];
            
            if (typeof UI.renderHacking === 'function') UI.renderHacking();
        },

        checkWord: function(word) {
            if(this.attempts <= 0) return;
            
            let likeness = 0;
            for(let i=0; i<4; i++) {
                if(word[i] === this.password[i]) likeness++;
            }
            
            this.logs.unshift(`> ${word}: ${likeness}/4 MATCH`);
            this.attempts--;

            if(word === this.password) {
                this.logs.unshift("> ACCESS GRANTED");
                setTimeout(() => this.end(true), 1000);
            } else if (this.attempts <= 0) {
                this.logs.unshift("> SYSTEM LOCKOUT");
                setTimeout(() => this.end(false), 1000);
            }
            
            if (typeof UI.renderHacking === 'function') UI.renderHacking();
        },

        end: function(success) {
            if(success) {
                if(typeof Game.updateQuestProgress === 'function') Game.updateQuestProgress('hack', 'terminal', 1);
                UI.log("Terminal gehackt!", "text-green-400");
            } else {
                UI.log("Zugriff verweigert.", "text-red-500");
            }
            UI.stopMinigame();
        }
    },

    // --- LOCKPICKING ---
    lockpicking: {
        difficulty: 'easy', lockAngle: 0, currentAngle: 0, sweetSpot: 0, health: 100,
        
        init: function(diff = 'easy') {
            this.difficulty = diff; this.lockAngle = 0; this.currentAngle = 0; this.health = 100;
            this.sweetSpot = Math.floor(Math.random() * 160) - 80;
            if (typeof UI.renderLockpicking === 'function') UI.renderLockpicking(true);
        },

        rotateLock: function() {
            const dist = Math.abs(this.currentAngle - this.sweetSpot);
            const maxRot = Math.max(0, 90 - dist);
            this.lockAngle = maxRot;
            
            if(dist < 10) {
                this.lockAngle = 90;
                setTimeout(() => this.end(true), 500);
            } else {
                this.health -= 10;
                if(this.health <= 0) {
                    Game.removeFromInventory('bobby_pin', 1);
                    this.end(false);
                }
            }
            if (typeof UI.renderLockpicking === 'function') UI.renderLockpicking();
        },

        releaseLock: function() {
            this.lockAngle = 0;
            if (typeof UI.renderLockpicking === 'function') UI.renderLockpicking();
        },

        end: function(success) {
            if(success) UI.log("Schloss geknackt!", "text-green-400");
            else UI.log("Dietrich abgebrochen!", "text-red-500");
            UI.stopMinigame();
        }
    },

    // --- DICE GAME (3 Dice) ---
    dice: {
        d1: 1, d2: 1, d3: 1, rolling: false,
        
        init: function() {
            this.d1 = 1; this.d2 = 1; this.d3 = 1;
            this.rolling = false;
            this.render();
        },

        roll: function() {
            if(this.rolling) return;
            this.rolling = true;
            let rolls = 0;
            const rollInterval = setInterval(() => {
                this.d1 = Math.floor(Math.random() * 6) + 1;
                this.d2 = Math.floor(Math.random() * 6) + 1;
                this.d3 = Math.floor(Math.random() * 6) + 1; 
                this.render();
                rolls++;
                if(rolls >= 10) {
                    clearInterval(rollInterval);
                    this.rolling = false;
                    this.finish();
                }
            }, 100);
        },

        finish: function() {
            const sum = this.d1 + this.d2 + this.d3; 
            const luck = Game.getStat('LUC') || 1;
            const bonus = Math.floor(luck / 2);
            const total = sum + bonus;
            
            this.render(total); 

            if(typeof Game.gambleLegendaryLoot === 'function') {
                Game.gambleLegendaryLoot(total);
            } else {
                UI.log(`Ergebnis: ${total}`, "text-yellow-400");
                Game.state.caps += total * 10; 
                Game.saveGame();
            }

            setTimeout(() => UI.stopMinigame(), 2500);
        },

        render: function(finalResult = null) {
            if (typeof UI.renderDice === 'function') UI.renderDice(this, finalResult);
        }
    },

    // --- BOMB DEFUSAL (TIMING) ---
    defusal: {
        round: 1, maxRounds: 3, cursor: 50, direction: 1, speed: 1.5, zoneStart: 40, zoneWidth: 20,
        gameLoop: null, isRunning: false,

        init: function() {
            this.round = 1; this.maxRounds = 3; this.isRunning = true;
            this.setupRound();
            
            if (this.gameLoop) clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), 20); 
            
            if (typeof UI.renderDefusal === 'function') UI.renderDefusal();
        },

        setupRound: function() {
            const agi = Game.getStat('AGI') || 1;
            const per = Game.getStat('PER') || 1;

            let baseSpeed = 1.5 + (this.round * 0.5);
            this.speed = Math.max(0.5, baseSpeed - (agi * 0.15));

            let baseWidth = 25 - (this.round * 3); 
            this.zoneWidth = Math.max(5, baseWidth + (per * 2));
            
            const maxStart = 100 - this.zoneWidth;
            this.zoneStart = Math.floor(Math.random() * maxStart);
            
            this.cursor = Math.random() < 0.5 ? 0 : 100; 
            this.direction = this.cursor === 0 ? 1 : -1;
        },

        update: function() {
            if (!this.isRunning) return;

            this.cursor += this.speed * this.direction;

            if (this.cursor >= 100) { this.cursor = 100; this.direction = -1; }
            else if (this.cursor <= 0) { this.cursor = 0; this.direction = 1; }

            if (typeof UI.renderDefusal === 'function') UI.renderDefusal();
        },

        cutWire: function() {
            if (!this.isRunning) return;

            const hit = this.cursor >= this.zoneStart && this.cursor <= (this.zoneStart + this.zoneWidth);

            if (hit) {
                if (this.round >= this.maxRounds) {
                    this.end(true);
                } else {
                    this.round++;
                    this.setupRound(); 
                }
            } else {
                this.end(false); 
            }
        },

        end: function(success) {
            this.isRunning = false;
            clearInterval(this.gameLoop);
            
            if(success) {
                UI.log("Bombe entschärft!", "text-green-400 font-bold");
                Game.gainExp(50);
            } else {
                UI.log("BOOM! Explosion!", "text-red-500 font-bold blink-red");
                
                if (typeof Game.addRadiation === 'function') {
                    Game.addRadiation(20);
                } else {
                    Game.state.rads = (Game.state.rads || 0) + 20; 
                }

                Game.state.hp = Math.max(0, Game.state.hp - 30); 
                if(typeof UI.update === 'function') UI.update(); 
            }
            
            setTimeout(() => {
                UI.stopMinigame();
            }, 1500);
        }
    },

    // --- MEMORY OVERRIDE (CHEST UNLOCK) ---
    memory: {
        sequence: [], playerInput: [], showing: false, activeCell: null, onSuccess: null,
        
        init: function(callback) {
            this.onSuccess = callback;
            this.sequence = [];
            this.playerInput = [];
            this.showing = false;
            this.activeCell = null;
            
            const int = Game.getStat('INT') || 1;
            const len = Math.max(3, 7 - Math.floor(int / 3)); // Hohe INT = kürzere Sequenz
            
            for(let i=0; i<len; i++) {
                this.sequence.push(Math.floor(Math.random() * 9)); // 3x3 Grid
            }
            
            setTimeout(() => this.playSequence(), 500);
            if (typeof UI.renderMemory === 'function') UI.renderMemory();
        },

        playSequence: function() {
            this.showing = true;
            this.playerInput = [];
            let i = 0;
            
            const interval = setInterval(() => {
                this.activeCell = this.sequence[i];
                if (typeof UI.renderMemory === 'function') UI.renderMemory();
                
                setTimeout(() => {
                    this.activeCell = null;
                    if (typeof UI.renderMemory === 'function') UI.renderMemory();
                }, 400); // Leuchtzeit

                i++;
                if(i >= this.sequence.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        this.showing = false;
                        if (typeof UI.renderMemory === 'function') UI.renderMemory();
                        UI.log("Code wiederholen...", "text-blue-400");
                    }, 500);
                }
            }, 800); // Tempo
        },

        input: function(idx) {
            if(this.showing) return;
            
            this.playerInput.push(idx);
            
            // Kurzes Aufleuchten bei Klick
            this.activeCell = idx;
            if (typeof UI.renderMemory === 'function') UI.renderMemory();
            setTimeout(() => {
                this.activeCell = null;
                if (typeof UI.renderMemory === 'function') UI.renderMemory();
            }, 150);

            // Check
            const currentStep = this.playerInput.length - 1;
            if(this.playerInput[currentStep] !== this.sequence[currentStep]) {
                this.end(false);
                return;
            }

            if(this.playerInput.length === this.sequence.length) {
                setTimeout(() => this.end(true), 300);
            }
        },

        end: function(success) {
            if(success) {
                UI.log("Sicherheitssperre deaktiviert!", "text-green-400 font-bold");
                if(this.onSuccess) this.onSuccess();
            } else {
                UI.log("FEHLER! Alarm ausgelöst!", "text-red-500 font-bold");
                UI.shakeView();
                // Strafe bei Fehler (z.B. Falle)
                if(Game.state.hp) Game.state.hp = Math.max(1, Game.state.hp - 10);
                UI.update();
            }
            setTimeout(() => UI.stopMinigame(), 1500);
        }
    }
};
