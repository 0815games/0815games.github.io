// [TIMESTAMP] 2026-01-19 10:00:00 - ui_render_minigames.js - Added Danger Warnings to Tutorials

Object.assign(UI, {
    
    getMinigameInfo: function(type) {
        let title = "MINIGAME", text = "";
        
        if(type === 'hacking') {
            title = "TERMINAL HACKING";
            text = "Finde das korrekte Passwort.<br>Likeness = Anzahl korrekter Buchstaben an der richtigen Position.<br><span class='text-yellow-500'>Sperrt das Terminal bei Fehlschlag.</span>";
        } else if (type === 'lockpicking') {
            title = "SCHLOSS KNACKEN";
            text = "Bewege die Maus (links/rechts), um den Dietrich zu platzieren.<br>Drücke LEERTASTE oder 'DREHEN', um das Schloss zu testen.<br><span class='text-yellow-500'>Dietrich kann bei zu viel Druck abbrechen!</span>";
        } else if (type === 'dice') {
            title = "WASTELAND GAMBLE";
            text = "Würfle eine hohe Augenzahl!<br>Dein Glück (LUC) Attribut gibt einen Bonus auf das Ergebnis.";
        } else if (type === 'defusal') {
            title = "BOMBE ENTSCHÄRFEN";
            text = "Reaktionstest: Drücke 'CUT WIRE', genau wenn der weiße Balken über dem grünen Bereich ist.<br>Du musst 3 Kabel trennen.<br><span class='text-red-500 animate-pulse'>WARNUNG: Bei Fehler explodiert die Bombe (Schaden + Strahlung)!</span>";
        } else if (type === 'memory') {
            title = "SECURITY OVERRIDE";
            text = "Merk dir die Sequenz! Die Felder leuchten auf. Wiederhole die Reihenfolge danach exakt.<br><span class='text-red-500'>ACHTUNG: Falsche Eingabe löst Abwehrmechanismus aus (Schaden)!</span>";
        }
        
        return { title, text };
    },

    startMinigame: function(type, ...args) {
        // Safety Checks
        if (typeof MiniGames === 'undefined' || !MiniGames[type]) return;

        const launch = () => {
            MiniGames.active = type;
            if(typeof MiniGames[type].init === 'function') {
                try { MiniGames[type].init(...args); } catch(e) { console.error(e); }
            }
        };

        if (!Game || !Game.state) {
            launch();
            return;
        }

        if(!Game.state.tutorialsSeen) Game.state.tutorialsSeen = {};

        // Verzögerung einbauen, damit onclick Events vom Menü sicher durch sind
        setTimeout(() => {
            if(!Game.state.tutorialsSeen[type]) {
                this.showMinigameTutorial(type, () => {
                    Game.state.tutorialsSeen[type] = true;
                    Game.saveGame();
                    launch();
                });
            } else {
                launch();
            }
        }, 50);
    },

    showMinigameTutorial: function(type, onConfirm) {
        const info = this.getMinigameInfo(type);
        
        if(this.els && this.els.dialog) {
            this.els.dialog.style.display = 'flex';
            this.els.dialog.innerHTML = `
                <div class="bg-black/95 border-2 border-green-500 p-6 rounded-lg shadow-[0_0_50px_#0f0] text-center w-full max-w-md pointer-events-auto relative z-[3000]">
                    <h3 class="text-2xl font-bold text-green-400 mb-2 tracking-widest border-b border-green-800 pb-2">${info.title}</h3>
                    <div class="text-gray-300 mb-6 font-mono text-sm leading-relaxed min-h-[80px] flex flex-col items-center justify-center gap-2">
                        <p>${info.text}</p>
                    </div>
                    <div class="flex justify-center">
                        <button id="btn-tutorial-start" class="border-2 border-green-500 bg-green-900/40 text-green-400 px-8 py-3 font-bold hover:bg-green-500 hover:text-black transition-all uppercase tracking-widest animate-pulse">
                            SYSTEM STARTEN
                        </button>
                    </div>
                </div>
            `;
            
            const btn = document.getElementById('btn-tutorial-start');
            if(btn) {
                btn.onclick = () => {
                    this.els.dialog.style.display = 'none';
                    this.els.dialog.innerHTML = '';
                    if(onConfirm) onConfirm();
                };
            }
        } else {
            alert(info.title + "\n\n" + info.text.replace(/<[^>]*>?/gm, "\n"));
            if(onConfirm) onConfirm();
        }
    },

    stopMinigame: function() {
        if (typeof MiniGames !== 'undefined' && MiniGames.defusal && MiniGames.defusal.gameLoop) {
            clearInterval(MiniGames.defusal.gameLoop);
        }
        
        if (typeof MiniGames !== 'undefined') MiniGames.active = null;
        
        const dice = document.getElementById('dice-overlay');
        if(dice) dice.classList.add('hidden');
        
        if(typeof UI.switchView === 'function') {
            UI.switchView('map'); 
        } else {
            if(Game.state) Game.state.view = 'map';
            if(this.els && this.els.view) this.els.view.innerHTML = ''; 
        }
    },

    renderMinigame: function() {
       if (typeof MiniGames === 'undefined' || !MiniGames.active) return;
       
       if (MiniGames.active === 'hacking') UI.renderHacking();
       if (MiniGames.active === 'lockpicking') UI.renderLockpicking();
       if (MiniGames.active === 'defusal') UI.renderDefusal();
       if (MiniGames.active === 'memory') UI.renderMemory();
    },

    // --- HACKING ---
    renderHacking: function() {
        const h = MiniGames.hacking;
        if(!h) return;

        let html = `
            <div class="w-full h-full flex flex-col p-2 font-mono text-green-500 bg-black overflow-hidden relative">
                <div class="flex justify-between border-b border-green-500 mb-2 pb-1">
                    <span class="font-bold">ROBCO TERM-LINK</span>
                    <div class="flex gap-2">
                        <button class="border border-green-500 px-2 text-xs hover:bg-green-900" onclick="UI.showMiniGameHelp('hacking')">?</button>
                        <span class="animate-pulse">ATTEMPTS: ${'█ '.repeat(h.attempts)}</span>
                    </div>
                </div>
                <div class="flex-grow flex gap-4 overflow-hidden relative">
                    <div id="hack-words" class="flex flex-col flex-wrap h-full content-start gap-x-8 text-sm"></div>
                    <div class="w-1/3 border-l border-green-900 pl-2 text-xs overflow-y-auto flex flex-col-reverse" id="hack-log">
                        ${h.logs.map(l => `<div>${l}</div>`).join('')}
                    </div>
                </div>
                <button class="absolute bottom-2 right-2 border border-red-500 text-red-500 px-2 text-xs hover:bg-red-900" onclick="MiniGames.hacking.end()">ABORT</button>
            </div>
        `;

        if(this.els.view && !this.els.view.innerHTML.includes('ROBCO')) {
            this.els.view.innerHTML = html;
        } else {
             const log = document.getElementById('hack-log');
             if(log) log.innerHTML = h.logs.map(l => `<div>${l}</div>`).join('');
             const attempts = document.querySelector('.animate-pulse');
             if(attempts) attempts.textContent = `ATTEMPTS: ${'█ '.repeat(h.attempts)}`;
        }

        const wordContainer = document.getElementById('hack-words');
        if(wordContainer && wordContainer.innerHTML === '') {
            h.words.forEach(word => {
                const hex = `0x${Math.floor(Math.random()*65535).toString(16).toUpperCase()}`;
                const btn = document.createElement('div');
                btn.className = "hack-row";
                btn.innerHTML = `<span class="hack-hex">${hex}</span> ${word}`;
                btn.onclick = () => MiniGames.hacking.checkWord(word);
                wordContainer.appendChild(btn);
            });
        }
    },

    // --- LOCKPICKING ---
    renderLockpicking: function(init=false) {
        if(init && this.els.view) {
            this.els.view.innerHTML = `
                <div id="lockpicking-root" class="w-full h-full flex flex-col items-center justify-center bg-black relative select-none">
                    <div class="absolute top-2 left-2 text-xs text-gray-500">LEVEL: ${MiniGames.lockpicking.difficulty.toUpperCase()}</div>
                    <button class="absolute top-2 right-2 border border-green-500 text-green-500 px-2 font-bold hover:bg-green-900 z-50" onclick="UI.showMiniGameHelp('lockpicking')">?</button>
                    
                    <div class="lock-container" id="lock-zone">
                        <div class="lock-inner" id="lock-rotator">
                             <div class="lock-center"></div>
                        </div>
                        <div class="bobby-pin" id="bobby-pin"></div>
                        <div class="screwdriver"></div>
                    </div>

                    <div class="mt-8 text-center text-sm text-green-300 font-mono">
                        <p class="mb-1">MAUS: Dietrich bewegen</p>
                        <p>LEERTASTE / KNOPF: Drehen</p>
                    </div>
                    
                    <button id="btn-turn-lock" class="mt-4 border-2 border-yellow-400 bg-yellow-900/30 text-yellow-400 w-48 h-16 text-xl font-bold tracking-widest active:bg-yellow-400 active:text-black md:hidden">
                        DREHEN
                    </button>
                    
                    <button class="absolute bottom-4 right-4 border border-red-500 text-red-500 px-3 py-1 hover:bg-red-900" onclick="MiniGames.lockpicking.end()">ABBRECHEN</button>
                </div>
            `;
            
            // --- INPUT HANDLERS ---
            const root = document.getElementById('lockpicking-root');
            const btn = document.getElementById('btn-turn-lock');

            // 1. DREHEN (Schloss testen)
            const tryRotate = (e) => { 
                if(e && e.preventDefault) e.preventDefault(); 
                MiniGames.lockpicking.rotateLock(); 
            };
            const stopRotate = (e) => { 
                if(e && e.preventDefault) e.preventDefault(); 
                MiniGames.lockpicking.releaseLock(); 
            };

            if(btn) {
                btn.addEventListener('touchstart', tryRotate);
                btn.addEventListener('touchend', stopRotate);
                btn.addEventListener('mousedown', tryRotate);
                btn.addEventListener('mouseup', stopRotate);
            }

            // Spacebar Support
            document.onkeydown = (e) => { if(e.code === 'Space') MiniGames.lockpicking.rotateLock(); };
            document.onkeyup = (e) => { if(e.code === 'Space') MiniGames.lockpicking.releaseLock(); };

            // 2. DIETRICH BEWEGEN (Maus/Touch)
            const updatePinPosition = (clientX) => {
                 if(MiniGames.active !== 'lockpicking') return;
                 const screenWidth = window.innerWidth;
                 // Mappe X-Position (0 bis Width) auf Winkel (-90 bis +90)
                 const percentage = Math.max(0, Math.min(1, clientX / screenWidth));
                 const angle = (percentage * 180) - 90;
                 
                 MiniGames.lockpicking.currentAngle = angle;
                 
                 // Performance: Update direkt via CSS statt komplettem Re-Render
                 const pin = document.getElementById('bobby-pin');
                 if(pin) pin.style.transform = `rotate(${angle}deg)`;
            };

            if(root) {
                root.addEventListener('mousemove', (e) => updatePinPosition(e.clientX));
                root.addEventListener('touchmove', (e) => {
                    if(e.touches[0]) updatePinPosition(e.touches[0].clientX);
                });
            }
        }

        // Standard Render Updates
        const pin = document.getElementById('bobby-pin');
        const lock = document.getElementById('lock-rotator');
        
        if(pin && !init) pin.style.transform = `rotate(${MiniGames.lockpicking.currentAngle}deg)`; 
        if(lock) lock.style.transform = `rotate(${MiniGames.lockpicking.lockAngle}deg)`;
    },

    // --- DICE ---
    renderDice: function(game, finalResult = null) {
        let container = document.getElementById('dice-overlay');
        
        if(!container) {
            container = document.createElement('div');
            container.id = 'dice-overlay';
            container.className = 'hidden fixed inset-0 z-[2000] pointer-events-auto'; 
            document.body.appendChild(container);
        }
        
        container.classList.remove('hidden');
        
        const luck = Game.getStat('LUC') || 1;
        const bonus = Math.floor(luck / 2);
        
        let resultHtml = '';
        if (finalResult !== null) {
            resultHtml = `<div class="mt-4 text-3xl font-bold text-green-400 animate-pulse border-2 border-green-500 bg-black/80 p-2">ERGEBNIS: ${finalResult}</div>`;
        }

        container.innerHTML = `
            <div class="fixed inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center p-6">
                <div class="border-4 border-yellow-500 p-8 bg-[#1a1100] shadow-[0_0_50px_#ffd700] text-center w-full max-w-md relative">
                    <h2 class="text-4xl font-bold text-yellow-400 mb-6 font-vt323 tracking-widest animate-pulse">WASTELAND GAMBLE</h2>
                    <div class="flex justify-center gap-4 mb-8">
                        <div class="w-20 h-20 bg-black border-2 border-yellow-600 flex items-center justify-center text-5xl text-yellow-500 font-bold shadow-inner">
                            ${game.d1}
                        </div>
                        <div class="w-20 h-20 bg-black border-2 border-yellow-600 flex items-center justify-center text-5xl text-yellow-500 font-bold shadow-inner">
                            ${game.d2}
                        </div>
                        <div class="w-20 h-20 bg-black border-2 border-yellow-600 flex items-center justify-center text-5xl text-yellow-500 font-bold shadow-inner">
                            ${game.d3 || 1}
                        </div>
                    </div>
                    <div class="text-yellow-200 font-mono text-sm mb-6 bg-black/40 p-2 rounded">
                        Glück (LUC): <span class="text-white font-bold">${luck}</span> 
                        <span class="text-gray-400">|</span> Bonus: <span class="text-[#39ff14] font-bold">+${bonus}</span>
                    </div>
                    ${!game.rolling && finalResult === null ? 
                        `<button onclick="MiniGames.dice.roll()" class="w-full py-4 text-2xl font-bold bg-yellow-600 text-black hover:bg-yellow-400 transition-all border-2 border-yellow-400 uppercase tracking-widest shadow-lg cursor-pointer">🎲 WÜRFELN</button>` : 
                        `<div class="text-yellow-500 text-xl font-bold h-16 flex items-center justify-center">${finalResult !== null ? 'Loot wird berechnet...' : 'ROLLING...'}</div>`
                    }
                    ${resultHtml}
                </div>
            </div>
        `;
    },

    // --- DEFUSAL ---
    renderDefusal: function() {
        const game = MiniGames.defusal;
        
        if(!document.getElementById('defusal-game-root') && this.els.view) {
             this.els.view.innerHTML = `
                <div id="defusal-game-root" class="w-full h-full flex flex-col items-center justify-center bg-black p-4 select-none relative font-mono text-green-500">
                    <div class="border-2 border-green-500 bg-[#001100] p-6 w-full max-w-lg shadow-[0_0_20px_#0f0] relative">
                        <div class="flex justify-between items-center border-b border-green-700 pb-2 mb-4">
                            <h2 class="text-2xl font-bold tracking-widest animate-pulse text-red-500">BOMB DEFUSAL</h2>
                            <button class="border border-green-500 px-2 text-xs hover:bg-green-900" onclick="UI.showMiniGameHelp('defusal')">?</button>
                        </div>

                        <div id="defusal-lights" class="flex justify-center gap-4 mb-6"></div>

                        <div class="w-full h-12 border-2 border-green-500 relative bg-black overflow-hidden mb-6">
                            <div id="defusal-zone" class="absolute top-0 bottom-0 bg-green-500/30 border-x border-green-500"></div>
                            <div id="defusal-cursor" class="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]"></div>
                        </div>

                        <button onmousedown="MiniGames.defusal.cutWire()" ontouchstart="event.preventDefault(); MiniGames.defusal.cutWire()"
                            class="w-full py-4 text-xl font-bold bg-red-900/30 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-black transition-all uppercase tracking-widest active:scale-95">
                            ✂️ CUT WIRE
                        </button>
                    </div>
                    
                    <div class="absolute bottom-4 text-xs text-gray-500 text-center">
                        PER erhöht Breite • AGI senkt Tempo
                    </div>
                </div>
            `;
        }

        const cursor = document.getElementById('defusal-cursor');
        if(cursor) cursor.style.left = game.cursor + '%';

        const zone = document.getElementById('defusal-zone');
        if(zone) {
            zone.style.left = game.zoneStart + '%';
            zone.style.width = game.zoneWidth + '%';
        }

        const lightsContainer = document.getElementById('defusal-lights');
        if(lightsContainer) {
            const lightsHtml = [1, 2, 3].map(i => {
                let color = "bg-gray-800"; 
                if (i < game.round) color = "bg-green-500 shadow-[0_0_10px_#0f0]"; 
                if (i === game.round) color = "bg-red-500 animate-ping"; 
                return `<div class="w-4 h-4 rounded-full ${color} border border-green-900"></div>`;
            }).join('');
            
            if(lightsContainer.innerHTML !== lightsHtml) {
                lightsContainer.innerHTML = lightsHtml;
            }
        }
    },

    // --- MEMORY UI ---
    renderMemory: function() {
        const game = MiniGames.memory;
        
        // Base Layout nur einmal erstellen
        if(!document.getElementById('memory-game-root') && this.els.view) {
            this.els.view.innerHTML = `
                <div id="memory-game-root" class="w-full h-full flex flex-col items-center justify-center bg-black p-4 select-none relative font-mono text-green-500">
                    <div class="border-2 border-green-500 bg-[#001100] p-6 shadow-[0_0_25px_#0f0] flex flex-col items-center gap-4">
                        <div class="flex justify-between w-full border-b border-green-700 pb-2">
                            <h2 class="text-xl font-bold tracking-widest animate-pulse">SECURITY OVERRIDE</h2>
                            <button class="border border-green-500 px-2 text-xs hover:bg-green-900" onclick="UI.showMiniGameHelp('memory')">?</button>
                        </div>
                        
                        <div class="grid grid-cols-3 gap-3 bg-black border border-green-900 p-3">
                            ${[0,1,2,3,4,5,6,7,8].map(i => `
                                <button id="mem-btn-${i}" onclick="MiniGames.memory.input(${i})" 
                                    class="w-16 h-16 border-2 border-green-800 bg-black hover:border-green-400 active:bg-green-900 transition-all shadow-inner relative">
                                    <div class="absolute inset-2 bg-green-500 opacity-0 transition-opacity duration-100" id="mem-light-${i}"></div>
                                </button>
                            `).join('')}
                        </div>

                        <div class="text-center text-xs h-4">
                            ${game.showing ? '<span class="text-red-400 animate-pulse">DATEN EMPFANG...</span>' : '<span class="text-green-400">BEREIT FÜR EINGABE</span>'}
                        </div>
                    </div>
                </div>
            `;
        }

        // State Update (Lichter an/aus)
        for(let i=0; i<9; i++) {
            const light = document.getElementById(`mem-light-${i}`);
            if(light) {
                if(game.activeCell === i) {
                    light.style.opacity = '1';
                    light.classList.add('shadow-[0_0_15px_#0f0]');
                } else {
                    light.style.opacity = '0';
                    light.classList.remove('shadow-[0_0_15px_#0f0]');
                }
            }
        }
    },

    showMiniGameHelp: function(type) {
        const info = this.getMinigameInfo(type);
        
        if (typeof this.showInfoDialog === 'function') {
            this.showInfoDialog(info.title, info.text);
        } else {
            alert(info.title + ": " + info.text.replace(/<[^>]*>?/gm, ''));
        }
    }
});
