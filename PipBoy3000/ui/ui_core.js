// [2026-01-17 17:45:00] ui_core.js - Auto-Generate Account Name from Email

const UI = {
    els: {},
    lastInputTime: Date.now(),
    biomeColors: (typeof window.GameData !== 'undefined') ? window.GameData.colors : {},

    // States
    loginBusy: false,
    isRegistering: false,
    charSelectMode: false,
    deleteMode: false,
    currentSaves: {},
    selectedSlot: -1,
    isSystemReady: false, 
    
    // Focus System
    focusIndex: -1,
    focusableEls: [],
    inputMethod: 'touch', 

    // Queue System für Toasts (Max 1)
    toastQueue: [],
    isToastShowing: false,

    // --- NEW LOG SYSTEM (QUEUE BASED) ---
    log: function(message, colorClass = "text-green-500") {
        this.toastQueue.push({ message, colorClass });
        this.processToastQueue();
    },

    processToastQueue: function() {
        if (this.isToastShowing || this.toastQueue.length === 0) return;

        const container = this.els.toastContainer || document.getElementById('game-toast-container');
        if(!container) return;

        this.isToastShowing = true;
        const item = this.toastQueue.shift(); 

        let borderColor = "border-green-500"; 
        let icon = "ℹ️"; 

        if(item.colorClass.includes("red")) { borderColor = "border-red-600"; icon = "⚠️"; }
        else if(item.colorClass.includes("yellow") || item.colorClass.includes("orange")) { borderColor = "border-yellow-500"; icon = "⚡"; }
        else if(item.colorClass.includes("blue") || item.colorClass.includes("cyan")) { borderColor = "border-blue-500"; icon = "💾"; }
        else if(item.colorClass.includes("gray")) { borderColor = "border-gray-500"; icon = "📝"; }

        const el = document.createElement('div');
        
        el.className = `
            pointer-events-auto bg-black/95 border-l-4 ${borderColor} p-3 
            shadow-[0_0_15px_rgba(0,0,0,0.8)] animate-slide-in 
            flex items-start justify-between gap-4 transition-all duration-300 ease-out 
            mb-1 backdrop-blur-sm w-fit max-w-[90vw] md:max-w-md self-end rounded-l
        `;

        el.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-lg opacity-80 select-none">${icon}</span>
                <span class="font-mono text-sm md:text-base font-bold ${item.colorClass} tracking-wide drop-shadow-md whitespace-nowrap md:whitespace-normal">${item.message}</span>
            </div>
            <button class="text-gray-600 hover:text-white font-bold text-xs self-start mt-0.5 px-1 ml-2">✕</button>
        `;

        const closeToast = () => {
            if (el.classList.contains('closing')) return; 
            el.classList.add('closing'); 
            el.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => {
                if(el.parentNode) el.remove();
                this.isToastShowing = false;
                setTimeout(() => this.processToastQueue(), 150);
            }, 300); 
        };

        el.querySelector('button').onclick = closeToast;
        container.innerHTML = ''; 
        container.appendChild(el);

        const duration = item.colorClass.includes("red") ? 4000 : 2500;
        setTimeout(() => { if(document.body.contains(el)) closeToast(); }, duration);
    },

    error: function(msg) {
        console.error(`ERROR: ${msg}`);
        this.log(`ERROR: ${msg}`, "text-red-500 blink-red");
        this.openBugModal(msg);
    },

    showLoadingSequence: function() {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = "fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center font-vt323 text-green-500 cursor-wait select-none";
            overlay.innerHTML = `
                <div class="w-72 max-w-[90%] relative">
                    <div class="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-20"></div>
                    <div class="text-center text-3xl mb-6 font-bold text-green-400 tracking-widest animate-pulse">PLEASE STAND BY</div>
                    <div class="h-6 border-2 border-green-700 p-1 rounded relative bg-[#001100] shadow-[0_0_15px_#003300]">
                        <div id="load-bar-fill" class="h-full bg-green-500 w-0 shadow-[0_0_10px_#0f0] transition-all duration-300 ease-out"></div>
                    </div>
                    <div class="flex justify-between items-end mt-2 px-1">
                        <div id="load-text" class="text-xs text-green-600 font-mono animate-pulse">INITIALIZING...</div>
                        <div id="load-percent" class="text-xl font-bold text-green-400">0%</div>
                    </div>
                    <div class="mt-8 flex justify-center opacity-50"><span class="animate-spin text-4xl">⚙️</span></div>
                </div>
            `;
            document.body.appendChild(overlay);

            const steps = [
                { t: "LOADING ASSETS...", p: 15 },
                { t: "DECRYPTING SAVE DATA...", p: 30 },
                { t: "SYNCHRONIZING PIP-BOY...", p: 55 },
                { t: "ESTABLISHING UPLINK...", p: 75 },
                { t: "RENDERING WASTELAND...", p: 90 },
                { t: "SYSTEM READY.", p: 100 }
            ];

            let step = 0;
            const bar = overlay.querySelector('#load-bar-fill');
            const txt = overlay.querySelector('#load-text');
            const pct = overlay.querySelector('#load-percent');

            const interval = setInterval(() => {
                if(step >= steps.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        overlay.classList.add('opacity-0', 'duration-500'); 
                        setTimeout(() => {
                            overlay.remove();
                            resolve(); 
                        }, 500);
                    }, 400);
                    return;
                }
                const s = steps[step];
                bar.style.width = s.p + "%";
                txt.textContent = s.t;
                pct.textContent = s.p + "%";
                step++;
            }, 250); 
        });
    },

    showCombatEffect: function(mainText, subText, color="red", duration=1000) {
        const view = document.getElementById('view-container');
        if(!view) return;
        const el = document.createElement('div');
        el.className = "click-effect-overlay"; 
        el.style.animation = `clickEffectAnim ${duration/1000}s ease-out forwards`;
        el.innerHTML = `<div class="click-effect-text" style="color:${color}; text-shadow: 0 0 20px ${color}">${mainText}</div><div class="click-effect-sub" style="border-color:${color}">${subText}</div>`;
        view.appendChild(el);
        setTimeout(() => { if(el) el.remove(); }, duration);
    },

    triggerInventoryAlert: function() {
        if(this.els.btnInv) this.els.btnInv.classList.add('alert-glow-yellow');
        if(this.els.btnMenu) this.els.btnMenu.classList.add('alert-glow-yellow');
    },

    resetInventoryAlert: function() {
        if(this.els.btnInv) this.els.btnInv.classList.remove('alert-glow-yellow');
        if(this.els.btnMenu) this.els.btnMenu.classList.remove('alert-glow-yellow');
    },

    openBugModal: function(autoErrorMsg = null) {
        if(document.getElementById('bug-report-overlay')) return;
        if(this.els.navMenu) this.els.navMenu.classList.add('hidden');
        const title = autoErrorMsg ? "⚠️ SYSTEMFEHLER ERKANNT" : "🐞 BUG MELDEN";
        const subText = autoErrorMsg ? `CODE: "${autoErrorMsg}"` : "Fehler gefunden? Beschreibe ihn kurz:";
        const overlay = document.createElement('div');
        overlay.id = 'bug-report-overlay';
        overlay.className = "fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4";
        overlay.innerHTML = `
            <div class="bg-[#051105] border-2 border-red-600 p-6 rounded shadow-[0_0_30px_red] max-w-md w-full relative">
                <h2 class="text-2xl text-red-500 font-bold mb-2 font-vt323 tracking-widest">${title}</h2>
                <div class="text-red-300 text-sm font-mono mb-4 border-b border-red-900 pb-2">${subText}</div>
                <label class="block text-green-500 text-sm mb-1 uppercase tracking-wider">Beschreibung</label>
                <textarea id="bug-desc" class="w-full bg-black border border-green-700 text-green-400 p-2 font-mono text-sm h-24 focus:border-green-400 outline-none mb-4" placeholder="Was ist passiert?"></textarea>
                <div class="flex gap-2">
                    <button id="btn-bug-send" class="flex-1 bg-red-900/30 border border-red-500 text-red-400 py-2 font-bold hover:bg-red-500 hover:text-black transition-all uppercase">REPORT SENDEN</button>
                    <button id="btn-bug-close" class="px-4 border border-gray-600 text-gray-500 hover:text-white transition-all uppercase">ABBRECHEN</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const textArea = document.getElementById('bug-desc');
        if(textArea) {
            textArea.focus();
            const stopPropagation = (e) => e.stopPropagation();
            textArea.addEventListener('keydown', stopPropagation);
            textArea.addEventListener('keyup', stopPropagation);
            textArea.addEventListener('keypress', stopPropagation);
        }
        document.getElementById('btn-bug-close').onclick = () => overlay.remove();
        document.getElementById('btn-bug-send').onclick = () => {
            const desc = document.getElementById('bug-desc').value;
            const errorType = autoErrorMsg || "Manuelle Meldung";
            this.saveBugReport(errorType, desc);
            overlay.remove();
        };
    },

    saveBugReport: async function(errorMsg, userDesc) {
        const playerName = (Game.state && Game.state.playerName) ? Game.state.playerName : "Unbekannt/Login";
        const report = {
            timestamp: new Date().toISOString(),
            playerName: playerName,
            error: errorMsg,
            description: userDesc || "Keine Beschreibung",
            gameState: { view: Game.state ? Game.state.view : 'null', sector: Game.state ? `${Game.state.sector.x},${Game.state.sector.y}` : 'null', caps: Game.state ? Game.state.caps : 0, lvl: Game.state ? Game.state.lvl : 0 },
            userAgent: navigator.userAgent
        };
        this.log("Sende Fehlerbericht an Vault-Tec...", "text-yellow-400 blink-red");
        let sent = false;
        if (typeof Network !== 'undefined' && Network.sendBugReport) sent = await Network.sendBugReport(report);
        if (sent) this.log("✅ Bericht erfolgreich übertragen.", "text-green-400 font-bold");
        else { this.log("❌ Bug report aktuell nicht möglich.", "text-red-500 font-bold"); console.warn("Bug Report Senden fehlgeschlagen."); }
    },

    showMobileControlsHint: function() {
        if(document.getElementById('controls-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'controls-overlay';
        overlay.className = "fixed inset-0 z-[9000] bg-black/95 flex flex-col items-center justify-center p-6 text-center";
        overlay.innerHTML = `
            <div class="border-2 border-green-500 p-6 max-w-sm w-full shadow-[0_0_20px_#1aff1a] bg-[#001100]">
                <div class="text-4xl mb-4">📱</div>
                <h2 class="text-2xl text-green-400 font-bold mb-4 font-vt323 tracking-widest border-b border-green-800 pb-2">STEUERUNG</h2>
                <div class="text-green-300 font-mono text-sm space-y-4 text-left mb-6">
                    <div class="flex items-start gap-3"><span class="text-xl">👆</span><div><strong class="text-green-100">TIPPEN:</strong><br>Bewegen / Interagieren / Angreifen</div></div>
                    <div class="flex items-start gap-3"><span class="text-xl">📄</span><div><strong class="text-green-100">MENÜ:</strong><br>Burger-Icon (☰) oben rechts für Inventar & Charakter.</div></div>
                </div>
                <div class="border-t border-green-800 pt-4 mt-4">
                    <h3 class="text-red-500 font-bold mb-2 animate-pulse">⚠️ WARNUNG: PERMADEATH</h3>
                    <p class="text-red-400 text-xs font-mono leading-relaxed">In diesem Modus ist der Tod endgültig.<br>Stirbt dein Charakter, wird der Spielstand <span class="underline">automatisch gelöscht</span>.</p>
                </div>
                <button id="btn-close-controls" class="mt-6 w-full border-2 border-green-500 text-green-500 py-3 font-bold hover:bg-green-900 transition-colors uppercase tracking-widest">VERSTANDEN</button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.getElementById('btn-close-controls').onclick = () => overlay.remove();
    },
    
    setConnectionState: function(status) {
        const v = this.els.version;
        if(!v) return;
        if(status === 'online') { v.className = "text-[#39ff14] font-bold tracking-widest"; v.style.textShadow = "0 0 5px #39ff14"; } 
        else if (status === 'offline') { v.className = "text-red-500 font-bold tracking-widest"; v.style.textShadow = "0 0 5px red"; } 
        else { v.className = "text-yellow-400 font-bold tracking-widest animate-pulse"; }
    },

    update: function() {
        const loginScreen = this.els.loginScreen;
        const isLoginHidden = loginScreen && (loginScreen.style.display === 'none' || loginScreen.classList.contains('hidden'));
        const isAuth = (typeof Network !== 'undefined' && Network.myId);
        if (isLoginHidden && isAuth) {
            if(Date.now() - this.lastInputTime > 300000) { 
                console.log("AFK Trigger: Logout initiiert.");
                this.logout("AFK: ZEITÜBERSCHREITUNG");
            }
        }
        if(typeof this.renderChar === 'function' && this.charTab === 'status') this.renderChar();
    },

    init: function() {
        const toastCont = document.getElementById('game-toast-container');
        if(toastCont) {
            toastCont.classList.remove('w-72', 'md:w-96'); 
            toastCont.classList.add('w-auto', 'items-end', 'max-w-full', 'md:max-w-[400px]'); 
        }

        this.els = {
            touchArea: document.getElementById('main-content'),
            view: document.getElementById('view-container'),
            toastContainer: toastCont, 
            hp: document.getElementById('val-hp'),
            hpBar: document.getElementById('bar-hp'),
            expBarTop: document.getElementById('bar-exp-top'),
            lvl: document.getElementById('val-lvl'),
            xpTxt: document.getElementById('val-xp-txt'),
            caps: document.getElementById('val-caps'),
            name: document.getElementById('val-name'),
            headerCharInfo: document.getElementById('header-char-info'),
            version: document.getElementById('version-display'),
            joyBase: null, joyStick: null,
            dialog: document.getElementById('dialog-overlay'),
            btnNew: document.getElementById('btn-new'),
            btnInv: document.getElementById('btn-inv'),
            btnWiki: document.getElementById('btn-wiki'),
            btnMap: document.getElementById('btn-map'),
            btnChar: document.getElementById('btn-char'),
            btnQuests: document.getElementById('btn-quests'),
            btnBugReport: document.getElementById('btn-bug-report'),
            btnMenuSave: document.getElementById('btn-menu-save'),
            btnLogout: document.getElementById('btn-logout'),
            btnReset: document.getElementById('btn-reset'),
            btnMenu: document.getElementById('btn-menu-toggle'),
            navMenu: document.getElementById('main-nav'),
            playerCount: document.getElementById('val-players'),
            playerList: document.getElementById('player-list-overlay'),
            playerListContent: document.getElementById('player-list-content'),
            loginScreen: document.getElementById('login-screen'),
            loginStatus: document.getElementById('login-status'),
            inputEmail: document.getElementById('login-email'),
            inputPass: document.getElementById('login-pass'),
            inputName: document.getElementById('login-name'), // Ist null, da entfernt
            btnLogin: document.getElementById('btn-login'),
            btnToggleRegister: document.getElementById('btn-toggle-register'),
            loginTitle: document.getElementById('login-title'),
            charSelectScreen: document.getElementById('char-select-screen'),
            charSlotsList: document.getElementById('char-slots-list'),
            newCharOverlay: document.getElementById('new-char-overlay'),
            inputNewCharName: document.getElementById('new-char-name'),
            btnCreateCharConfirm: document.getElementById('btn-create-char'),
            btnCharDeleteAction: document.getElementById('btn-char-delete-action'),
            btnCharBack: document.getElementById('btn-char-back'),
            deleteOverlay: document.getElementById('delete-confirm-overlay'),
            deleteTargetName: document.getElementById('delete-target-name'),
            deleteInput: document.getElementById('delete-input'),
            btnDeleteConfirm: document.getElementById('btn-delete-confirm'),
            btnDeleteCancel: document.getElementById('btn-delete-cancel'),
            spawnScreen: document.getElementById('spawn-screen'),
            spawnMsg: document.getElementById('spawn-msg'),
            spawnList: document.getElementById('spawn-list'),
            btnSpawnRandom: document.getElementById('btn-spawn-random'),
            resetOverlay: document.getElementById('reset-overlay'),
            btnConfirmReset: document.getElementById('btn-confirm-reset'),
            btnCancelReset: document.getElementById('btn-cancel-reset'),
            gameScreen: document.getElementById('game-screen'),
            gameOver: document.getElementById('game-over-screen')
        };
        
        if (this.els.btnBugReport) this.els.btnBugReport.addEventListener('click', () => { this.openBugModal(); });
        if(this.els.btnInv) this.els.btnInv.addEventListener('click', () => this.resetInventoryAlert());
        if(this.els.headerCharInfo) this.els.headerCharInfo.addEventListener('click', () => { this.switchView('char'); });

        // [FIX] Button Listener für Register Toggle (ohne Name Input)
        if(this.els.btnToggleRegister) {
             this.els.btnToggleRegister.onclick = () => {
                 this.isRegistering = !this.isRegistering;
                 this.els.loginTitle.textContent = this.isRegistering ? "NEUEN ACCOUNT REGISTRIEREN" : "AUTHENTICATION REQUIRED";
                 this.els.btnLogin.textContent = this.isRegistering ? "REGISTRIEREN" : "LOGIN";
                 this.els.btnToggleRegister.textContent = this.isRegistering ? "Zurück zum Login" : "Noch kein Account? Hier registrieren";
             }
        }

        window.Game = Game;
        window.UI = this;

        if(this.initInput) this.initInput();
        setInterval(() => { if(this.update) this.update(); }, 1000);
    },

    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    },

    startGame: async function(saveData, slotIndex, newName=null) {
        this.charSelectMode = false;
        this.els.charSelectScreen.style.display = 'none';
        
        await this.showLoadingSequence(); 

        this.els.gameScreen.classList.remove('hidden');
        this.els.gameScreen.classList.remove('opacity-0');
        
        const isNewGame = !saveData;
        Game.init(saveData, null, slotIndex, newName);
        
        if(this.isMobile() && isNewGame) this.showMobileControlsHint();
        if(typeof Network !== 'undefined') Network.startPresence();
    },

    logout: async function(msg) {
        this.loginBusy = false;
        this.selectedSlot = -1; 
        this.charSelectMode = false; 
        
        if(Game.state) { Game.saveGame(true); Game.state = null; }
        if(typeof Network !== 'undefined') { await Network.disconnect(); }
        
        this.els.gameScreen.classList.add('hidden');
        if(this.els.charSelectScreen) this.els.charSelectScreen.style.display = 'none'; 
        if(this.els.newCharOverlay) this.els.newCharOverlay.classList.add('hidden');
        if(this.els.deleteOverlay) this.els.deleteOverlay.style.display = 'none';
        if(this.els.spawnScreen) this.els.spawnScreen.style.display = 'none';

        this.els.loginScreen.style.display = 'flex';
        this.els.loginScreen.classList.remove('hidden');
        this.els.loginStatus.textContent = msg || "AUSGELOGGT";
        this.els.loginStatus.className = "mt-4 text-yellow-400";
        this.els.inputPass.value = "";
        
        if(this.els.navMenu) { this.els.navMenu.classList.add('hidden'); this.els.navMenu.style.display = 'none'; }
        if(this.els.playerList) this.els.playerList.style.display = 'none';
    },

    attemptLogin: async function() {
        if(!this.isSystemReady) {
            this.els.loginStatus.textContent = "SYSTEM INITIALIZING... PLEASE WAIT";
            this.els.loginStatus.className = "mt-4 text-blue-400 animate-pulse";
            return;
        }
        if(this.loginBusy) return;
        this.loginBusy = true;
        const email = this.els.inputEmail.value.trim();
        const pass = this.els.inputPass.value.trim();
        
        this.els.loginStatus.textContent = "VERBINDE MIT VAULT-TEC...";
        this.els.loginStatus.className = "mt-4 text-yellow-400 animate-pulse";
        try {
            if(typeof Network === 'undefined') throw new Error("Netzwerkfehler");
            Network.init();
            let saves = null;
            if (this.isRegistering) {
                if (email.length < 5 || pass.length < 6) throw new Error("Daten unvollständig (PW min 6)");
                
                // [FIX] Auto-Generierter Name aus Email
                const generatedName = email.split('@')[0].toUpperCase();
                
                saves = await Network.register(email, pass, generatedName);
            } else {
                if (email.length < 5 || pass.length < 1) throw new Error("Bitte E-Mail und Passwort eingeben");
                saves = await Network.login(email, pass);
            }
            this.selectedSlot = -1; 
            if(this.renderCharacterSelection) this.renderCharacterSelection(saves || {});
        } catch(e) {
            let msg = e.message;
            if(msg && (msg.includes("INVALID_LOGIN_CREDENTIALS") || msg.includes("INVALID_EMAIL"))) msg = "E-Mail oder Passwort falsch!";
            else if (e.code === "auth/email-already-in-use") msg = "E-Mail wird bereits verwendet!";
            else if (e.code === "auth/invalid-email") msg = "Ungültige E-Mail-Adresse!";
            else if (e.code === "auth/wrong-password") msg = "Falsches Passwort!";
            else if (e.code === "auth/user-not-found") msg = "Benutzer nicht gefunden!";
            this.els.loginStatus.textContent = "FEHLER: " + msg;
            this.els.loginStatus.className = "mt-4 text-red-500 font-bold blink-red";
        } finally {
            this.loginBusy = false;
        }
    },

    handleSaveClick: function() {
        Game.saveGame(true);
        [this.els.btnSave, this.els.btnMenuSave].forEach(btn => {
            if(!btn) return;
            const originalText = btn.textContent;
            const originalClass = btn.className;
            btn.textContent = "SAVED!";
            btn.className = "header-btn bg-[#39ff14] text-black border-[#39ff14] w-full text-left";
            setTimeout(() => { btn.textContent = originalText; btn.className = originalClass; }, 1000);
        });
    },

    handleReset: function() {
        if(this.els.navMenu) { this.els.navMenu.classList.add('hidden'); this.els.navMenu.style.display = 'none'; }
        if(this.els.resetOverlay) this.els.resetOverlay.style.display = 'flex';
    },
    
    confirmReset: function() { if(typeof Game !== 'undefined') Game.hardReset(); },
    cancelReset: function() { if(this.els.resetOverlay) this.els.resetOverlay.style.display = 'none'; },

    selectSpawn: function(mode) {
        this.els.spawnScreen.style.display = 'none';
        if(mode === 'random') { this.startGame(null, this.selectedSlot, null); }
    },
    
    selectSlot: function(index) {
        if(this.selectedSlot === index) { this.triggerCharSlot(); return; }
        this.selectedSlot = index;
        if(this.els.charSlotsList && this.els.charSlotsList.children) {
            const slots = this.els.charSlotsList.children;
            for(let i=0; i<slots.length; i++) { slots[i].classList.remove('active-slot'); }
            if(slots[index]) slots[index].classList.add('active-slot');
        }
        const save = this.currentSaves ? this.currentSaves[index] : null;
        if (this.els.btnCharDeleteAction) {
            if (save) {
                this.els.btnCharDeleteAction.disabled = false;
                this.els.btnCharDeleteAction.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                this.els.btnCharDeleteAction.disabled = true;
                this.els.btnCharDeleteAction.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    },

    navigateCharSlot: function(delta) {
        let newIndex = this.selectedSlot + delta;
        if(newIndex < 0) newIndex = 4;
        if(newIndex > 4) newIndex = 0;
        this.selectSlot(newIndex);
    },

    triggerCharSlot: function() {
        if(this.selectedSlot === -1) return;
        const save = this.currentSaves[this.selectedSlot];
        if(save) { this.startGame(save, this.selectedSlot); } 
        else {
            this.els.newCharOverlay.classList.remove('hidden');
            this.els.inputNewCharName.value = "";
            this.els.inputNewCharName.focus();
        }
    },

    triggerDeleteSlot: function() {
        if(this.selectedSlot === -1) return;
        const save = this.currentSaves[this.selectedSlot];
        if(!save) return;
        this.deleteMode = true;
        this.els.deleteOverlay.style.display = 'flex';
        this.els.deleteTargetName.textContent = save.playerName || "UNBEKANNT";
        this.els.deleteInput.value = "";
        this.els.btnDeleteConfirm.disabled = true;
        this.els.btnDeleteConfirm.classList.add('border-red-500', 'text-red-500');
        this.els.btnDeleteConfirm.classList.remove('border-green-500', 'text-green-500', 'animate-pulse');
        this.els.deleteInput.focus();
    },

    closeDeleteOverlay: function() {
        this.deleteMode = false;
        this.els.deleteOverlay.style.display = 'none';
        this.els.charSelectScreen.focus();
    },

    showGameOver: function() {
        if (this.els.gameOver) { this.els.gameOver.classList.remove('hidden'); }
        Game.selectedSlot = -1; 
        Game.state = null; 
        console.log("GameOver: State vernichtet, Slot entkoppelt.");
    },
};

window.UI = UI;
console.log("UI Core Loaded.");
