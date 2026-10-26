// [2026-01-17 22:00:00] ui_input.js - Fix: Removed Access to Deleted Name Input

Object.assign(UI, {
    
    touchState: {
        active: false, id: null, startX: 0, startY: 0, currentX: 0, currentY: 0, moveDir: { x: 0, y: 0 }, timer: null
    },

    initInput: function() {
        // --- AUTHENTIFIZIERUNG ---
        if(this.els.btnLogin) this.els.btnLogin.onclick = () => this.attemptLogin();
        
        if(this.els.btnToggleRegister) {
            this.els.btnToggleRegister.onclick = () => {
                this.isRegistering = !this.isRegistering;
                const isReg = this.isRegistering;
                this.els.loginTitle.textContent = isReg ? "NEUEN ACCOUNT ERSTELLEN" : "AUTHENTICATION REQUIRED";
                
                // [FIX] Diese Zeile verursachte den Crash, da das Feld in index.html gelöscht wurde:
                // this.els.inputName.style.display = isReg ? 'block' : 'none'; 
                
                this.els.btnLogin.textContent = isReg ? "REGISTRIEREN" : "LOGIN";
                this.els.btnToggleRegister.textContent = isReg ? "Zurück zum Login" : "Noch kein Account? Hier registrieren";
            };
        }

        // Event Listener für Enter-Taste (Login)
        // inputName ist hier null, aber die if(el) Prüfung fängt das sicher ab.
        [this.els.inputEmail, this.els.inputPass, this.els.inputName].forEach(el => {
            if(el) {
                el.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.stopPropagation(); 
                        e.preventDefault();
                        this.attemptLogin();
                    }
                });
            }
        });
        
        // --- CHARAKTER ERSTELLUNG ---
        if(this.els.inputNewCharName) {
            this.els.inputNewCharName.addEventListener("keydown", (e) => {
                e.stopPropagation(); 
                if (e.key === "Enter") {
                    e.preventDefault();
                    if(this.els.btnCreateCharConfirm) {
                        this.els.btnCreateCharConfirm.click();
                    }
                }
            });
        }

        // --- DER ERSTELLEN-BUTTON (LOGIK MIT NETZWERK-PRÜFUNG) ---
        if(this.els.btnCreateCharConfirm) {
            this.els.btnCreateCharConfirm.onclick = async () => {
                const name = this.els.inputNewCharName.value.trim().toUpperCase();
                
                // 1. Validierung
                if(name.length < 3) { 
                    UI.showInfoDialog("NAMEN SPERRE", "Der Name ist zu kurz.<br>Mindestens 3 Zeichen erforderlich.");
                    return; 
                }

                const btn = this.els.btnCreateCharConfirm;
                const originalText = btn.textContent;

                // 2. Button sperren & Feedback
                btn.textContent = "PRÜFE...";
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');

                try {
                    // 3. Verfügbarkeit prüfen
                    let isFree = true;
                    if(typeof Network !== 'undefined' && Network.checkNameAvailability) {
                        isFree = await Network.checkNameAvailability(name);
                    } else {
                        console.warn("Netzwerk-Modul nicht bereit, überspringe Namensprüfung.");
                    }
                    
                    if(!isFree) {
                        UI.showInfoDialog("IDENTITÄT ABGELEHNT", `
                            Der Name <span class="text-white font-bold">'${name}'</span> ist bereits vergeben.<br><br>
                            <span class="text-xs text-red-400 uppercase tracking-widest">>> Ein lebender Bewohner nutzt diesen Namen bereits.</span>
                        `);
                        // Reset
                        btn.textContent = originalText;
                        btn.disabled = false;
                        btn.classList.remove('opacity-50', 'cursor-not-allowed');
                        return;
                    }

                    // 4. Alles OK -> Spiel starten
                    this.els.newCharOverlay.classList.add('hidden');
                    this.startGame(null, this.selectedSlot, name);
                    
                    // Cleanup
                    btn.textContent = originalText;
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');

                } catch(e) {
                    console.error("Char Create Error:", e);
                    UI.showInfoDialog("SYSTEM FEHLER", "Konnte Verfügbarkeit nicht prüfen.<br>Netzwerkfehler.");
                    btn.textContent = originalText;
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            };
        }

        // --- CHARAKTER AUSWAHL & LÖSCHEN ---
        if (this.els.btnCharSelectAction) this.els.btnCharSelectAction.onclick = () => this.triggerCharSlot();
        if (this.els.btnCharDeleteAction) this.els.btnCharDeleteAction.onclick = () => this.triggerDeleteSlot();
        if (this.els.btnCharBack) this.els.btnCharBack.onclick = () => this.logout("ZURÜCK ZUM LOGIN");
        
        if(this.els.btnDeleteCancel) this.els.btnDeleteCancel.onclick = () => this.closeDeleteOverlay();
        
        if(this.els.deleteInput) {
            this.els.deleteInput.addEventListener('input', () => {
                const target = this.els.deleteTargetName.textContent;
                const input = this.els.deleteInput.value.toUpperCase();
                const isValid = (target === input);
                this.els.btnDeleteConfirm.disabled = !isValid;
                
                if(isValid) {
                    this.els.btnDeleteConfirm.classList.replace('border-red-500', 'border-green-500');
                    this.els.btnDeleteConfirm.classList.replace('text-red-500', 'text-green-500');
                    this.els.btnDeleteConfirm.classList.add('animate-pulse');
                } else {
                    this.els.btnDeleteConfirm.classList.replace('border-green-500', 'border-red-500');
                    this.els.btnDeleteConfirm.classList.replace('text-green-500', 'text-red-500');
                    this.els.btnDeleteConfirm.classList.remove('animate-pulse');
                }
            });

            // Enter-Taste zum Löschen
            this.els.deleteInput.addEventListener('keydown', (e) => {
                if (e.key === "Enter" && !this.els.btnDeleteConfirm.disabled) {
                    e.preventDefault();
                    this.els.btnDeleteConfirm.click();
                }
            });
        }
        
        if(this.els.btnDeleteConfirm) {
            this.els.btnDeleteConfirm.onclick = async () => {
                if(this.selectedSlot === -1) return;
                
                this.els.deleteTargetName.textContent = "CHAR WIRD GELÖSCHT...";
                this.els.btnDeleteConfirm.disabled = true;
                
                await Network.deleteSlot(this.selectedSlot);
                this.closeDeleteOverlay();
                this.attemptLogin();
            };
        }

        // --- ALLGEMEINE CONTROLS ---
        if(this.els.btnSave) this.els.btnSave.onclick = () => this.handleSaveClick();
        if(this.els.btnMenuSave) this.els.btnMenuSave.onclick = () => this.handleSaveClick();
        if(this.els.btnLogout) this.els.btnLogout.onclick = () => this.logout('MANUELL AUSGELOGGT');
        if(this.els.btnReset) this.els.btnReset.onclick = () => this.handleReset();
        if(this.els.btnConfirmReset) this.els.btnConfirmReset.onclick = () => this.confirmReset();
        if(this.els.btnCancelReset) this.els.btnCancelReset.onclick = () => this.cancelReset();

        if(this.els.btnMenu) {
            this.els.btnMenu.onclick = (e) => {
                e.stopPropagation();
                this.toggleMenu();
            };
        }

        const btnCharHeader = document.getElementById('header-char-info');
        if(btnCharHeader) {
            btnCharHeader.onclick = () => {
                if (Game.state.statPoints > 0) this.charTab = 'stats';
                else if (Game.state.perkPoints > 0) this.charTab = 'perks';
                else this.charTab = 'status'; 
                this.switchView('char');
            };
        }

        // --- NAVIGATION & VIEWS ---
        const navMap = {
            'btn-inv': 'inventory', 'btn-char': 'char', 'btn-map': 'map',
            'btn-quests': 'journal', 'btn-wiki': 'wiki', 'btn-radio': 'radio'
        };

        for (const [id, view] of Object.entries(navMap)) {
            const el = document.getElementById(id);
            if(el) el.onclick = () => { 
                if(view === 'char') this.charTab = 'status'; 
                this.switchView(view); 
                this.toggleNav(false); 
            };
        }

        // Klick-Logik für Maps & Container-Exits
        document.addEventListener('click', (e) => {
            if(this.els.navMenu && !this.els.navMenu.classList.contains('hidden')) {
                if (!this.els.navMenu.contains(e.target) && e.target !== this.els.btnMenu) {
                    this.toggleMenu();
                }
            }
            if (Game.state && !['map', 'combat', 'city', 'hacking', 'lockpicking'].includes(Game.state.view) && 
                !Game.state.view.includes('shop') && !Game.state.view.includes('crafting') && 
                !Game.state.view.includes('clinic') && !Game.state.view.includes('vault')) {
                 const viewContainer = document.getElementById('view-container');
                 if (viewContainer && !viewContainer.contains(e.target)) this.switchView('map');
            }
        });
        
        if(this.els.log && this.els.log.parentElement) {
            this.els.log.parentElement.addEventListener('click', () => {
                if (Game.state && !['map', 'combat', 'hacking', 'lockpicking'].includes(Game.state.view)) {
                     if (Game.state.view === 'city') { Game.leaveCity(); return; }
                     this.switchView('map');
                }
            });
        }

        if(this.els.playerCount) this.els.playerCount.onclick = () => this.togglePlayerList();
        if(this.els.btnInv) this.els.btnInv.onclick = () => this.toggleView('inventory');
        if(this.els.btnWiki) this.els.btnWiki.onclick = () => this.toggleView('wiki');
        if(this.els.btnMap) this.els.btnMap.onclick = () => this.toggleView('worldmap');
        if(this.els.btnChar) this.els.btnChar.onclick = () => { this.charTab = 'status'; this.toggleView('char'); };
        if(this.els.btnQuests) this.els.btnQuests.onclick = () => this.toggleView('quests');
        if(this.els.btnSpawnRandom) this.els.btnSpawnRandom.onclick = () => this.selectSpawn(null);

        const btnDpad = document.getElementById('btn-toggle-dpad');
        if(btnDpad) btnDpad.onclick = () => {
            const dpad = document.getElementById('dpad-overlay');
            if(dpad) dpad.classList.toggle('hidden');
        };

        // --- TOUCH & MOUSE EVENTS ---
        if(this.els.touchArea) {
            this.els.touchArea.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
            this.els.touchArea.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
            this.els.touchArea.addEventListener('touchend', (e) => this.handleTouchEnd(e));
            this.els.touchArea.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));
        }

        ['mousemove', 'mousedown', 'touchstart'].forEach(evt => {
            window.addEventListener(evt, (e) => {
                this.lastInputTime = Date.now();
                if (this.inputMethod !== 'touch') {
                    this.focusIndex = -1;
                    this.updateFocusVisuals();
                    this.inputMethod = 'touch';
                }
                
                if(Game.state && Game.state.view === 'lockpicking' && evt === 'mousemove') {
                    const center = window.innerWidth / 2;
                    let angle = ((e.clientX - center) / (window.innerWidth/3)) * 90;
                    angle = Math.max(-90, Math.min(90, angle));
                    
                    if(MiniGames?.lockpicking) {
                        MiniGames.lockpicking.currentAngle = angle;
                        UI.renderLockpicking();
                    }
                }
            }, { passive: true });
        });

        window.addEventListener('keydown', (e) => {
            this.lastInputTime = Date.now();
            this.inputMethod = 'key';
            const preventKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Space", "PageUp", "PageDown", "Home", "End"];
            if (!['input', 'textarea'].includes(e.target.tagName.toLowerCase())) {
                if(preventKeys.includes(e.key)) e.preventDefault();
            }
            this.handleKeyDown(e);
        }, { passive: false });
        
        window.addEventListener('keyup', (e) => {
             if (Game.state?.view === 'lockpicking') {
                if ([' ', 'ArrowUp', 'w', 'Enter'].includes(e.key)) MiniGames.lockpicking.releaseLock();
            }
        });
    },

    handleKeyDown: function(e) {
        if (this.deleteMode) return;

        if (this.charSelectMode) {
            if (e.key === 'ArrowUp') this.navigateCharSlot(-1);
            else if (e.key === 'ArrowDown') this.navigateCharSlot(1);
            else if (e.key === 'Enter') this.triggerCharSlot();
            else if (['Delete', 'Backspace'].includes(e.key)) this.triggerDeleteSlot();
            return;
        }

        if (!Game.state || Game.state.isGameOver) {
            if(this.els.gameOver && !this.els.gameOver.classList.contains('hidden') && (e.key === 'Enter' || e.key === ' ')) location.reload();
            return;
        }
        
        if (Game.state.view === 'lockpicking') {
            if (['ArrowLeft', 'a'].includes(e.key)) MiniGames.lockpicking.rotatePin(-5);
            else if (['ArrowRight', 'd'].includes(e.key)) MiniGames.lockpicking.rotatePin(5);
            else if ([' ', 'ArrowUp', 'w', 'Enter'].includes(e.key)) MiniGames.lockpicking.rotateLock();
            else if (e.key === 'Escape') MiniGames.lockpicking.end();
            return;
        }
        
        if (Game.state.view === 'hacking') {
             if (e.key === 'Escape') MiniGames.hacking.end();
             return;
        }

        if(e.key === 'Escape') {
            if (Game.state.inDialog) return;
            if(this.els.playerList?.style.display === 'flex') this.togglePlayerList();
            else if(this.els.navMenu && !this.els.navMenu.classList.contains('hidden')) this.toggleMenu();
            else if(Game.state.view === 'city') Game.leaveCity();
            else if(['shop', 'clinic', 'crafting'].includes(Game.state.view)) UI.renderCity?.();
            else if(Game.state.view !== 'map') this.switchView('map');
            else this.toggleMenu();
            return;
        }

        if (Game.state.inDialog) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
                this.navigateFocus(['ArrowRight', 'd', 'ArrowDown', 's'].includes(e.key) ? 1 : -1);
            } else if (e.key === 'Enter' || e.key === ' ') this.triggerFocus();
            return;
        }

        if (Game.state.view === 'combat') {
            if (typeof Combat !== 'undefined') {
                if (['ArrowUp', 'w'].includes(e.key)) Combat.moveSelection(-1);
                else if (['ArrowDown', 's'].includes(e.key)) Combat.moveSelection(1);
                else if ([' ', 'Enter'].includes(e.key)) Combat.confirmSelection();
            }
            return;
        }

        const isMenuOpen = this.els.navMenu && !this.els.navMenu.classList.contains('hidden');
        if (Game.state.view !== 'map' || isMenuOpen) {
            let isGrid = (Game.state.view === 'inventory') && !isMenuOpen;
            if (['ArrowUp', 'w'].includes(e.key)) this.navigateFocus(isGrid ? -4 : -1);
            else if (['ArrowDown', 's'].includes(e.key)) this.navigateFocus(isGrid ? 4 : 1);
            else if (['ArrowLeft', 'a'].includes(e.key)) this.navigateFocus(-1);
            else if (['ArrowRight', 'd'].includes(e.key)) this.navigateFocus(1);
            else if (['Enter', ' '].includes(e.key)) this.triggerFocus();
            return;
        }

        if (Game.state.view === 'map') {
            if(['w', 'ArrowUp'].includes(e.key)) Game.move(0, -1);
            else if(['s', 'ArrowDown'].includes(e.key)) Game.move(0, 1);
            else if(['a', 'ArrowLeft'].includes(e.key)) Game.move(-1, 0);
            else if(['d', 'ArrowRight'].includes(e.key)) Game.move(1, 0);
            
            const k = e.key.toLowerCase();
            if(k === 'i') this.switchView('inventory');
            else if(k === 'c') { this.charTab = 'status'; this.switchView('char'); }
            else if(k === 'm') this.switchView('map');
            else if(k === 'j') this.switchView('journal');
        }
    },
    
    // --- TOUCH JOYSTICK ---
    handleTouchStart: function(e) {
        if(e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.no-joystick')) return;
        if(!Game.state || Game.state.view !== 'map' || Game.state.inDialog || this.touchState.active) return;
        const touch = e.changedTouches[0];
        Object.assign(this.touchState, {
            active: true, id: touch.identifier, startX: touch.clientX, startY: touch.clientY,
            currentX: touch.clientX, currentY: touch.clientY, moveDir: {x:0, y:0}
        });
        this.showJoystick(touch.clientX, touch.clientY);
        if(this.touchState.timer) clearInterval(this.touchState.timer);
        this.touchState.timer = setInterval(() => this.processJoystickMovement(), 150);
    },

    handleTouchMove: function(e) {
        if(!this.touchState.active) return;
        let touch = null;
        for(let i=0; i<e.changedTouches.length; i++) {
            if(e.changedTouches[i].identifier === this.touchState.id) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if(!touch) return;
        e.preventDefault();
        this.touchState.currentX = touch.clientX;
        this.touchState.currentY = touch.clientY;
        this.updateJoystickVisuals();
        this.calculateDirection();
    },

    handleTouchEnd: function(e) {
        if(!this.touchState.active) return;
        let found = false;
        for(let i=0; i<e.changedTouches.length; i++) {
            if(e.changedTouches[i].identifier === this.touchState.id) {
                found = true;
                break;
            }
        }
        if(!found) return;
        this.stopJoystick();
    },

    stopJoystick: function() {
        if(this.touchState.timer) {
            clearInterval(this.touchState.timer);
            this.touchState.timer = null;
        }
        this.touchState.active = false;
        this.touchState.id = null;
        this.touchState.moveDir = {x:0, y:0};
        this.hideJoystick();
    },

    calculateDirection: function() {
        const dx = this.touchState.currentX - this.touchState.startX;
        const dy = this.touchState.currentY - this.touchState.startY;
        const threshold = 20;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
            this.touchState.moveDir = {x:0, y:0};
            return;
        }
        if (Math.abs(dx) > Math.abs(dy)) {
            this.touchState.moveDir = { x: dx > 0 ? 1 : -1, y: 0 };
        } else {
            this.touchState.moveDir = { x: 0, y: dy > 0 ? 1 : -1 };
        }
    },

    processJoystickMovement: function() {
        const d = this.touchState.moveDir;
        if(d.x !== 0 || d.y !== 0) {
            Game.move(d.x, d.y);
        }
    },

    showJoystick: function(x, y) {
        if(!this.els.joyBase) this.restoreOverlay();
        if(this.els.joyBase) {
            this.els.joyBase.style.left = (x - 50) + 'px';
            this.els.joyBase.style.top = (y - 50) + 'px';
            this.els.joyBase.style.display = 'block';
        }
        if(this.els.joyStick) {
            this.els.joyStick.style.left = (x - 25) + 'px';
            this.els.joyStick.style.top = (y - 25) + 'px';
            this.els.joyStick.style.display = 'block';
        }
    },

    updateJoystickVisuals: function() {
        if(!this.els.joyBase) return;
        const dx = this.touchState.currentX - this.touchState.startX;
        const dy = this.touchState.currentY - this.touchState.startY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const maxDist = 40;
        let visualX = dx;
        let visualY = dy;
        if(dist > maxDist) {
            const ratio = maxDist / dist;
            visualX = dx * ratio;
            visualY = dy * ratio;
        }
        this.els.joyStick.style.transform = `translate(${visualX}px, ${visualY}px)`;
    },

    hideJoystick: function() {
        if(this.els.joyBase) this.els.joyBase.style.display = 'none';
        if(this.els.joyStick) {
            this.els.joyStick.style.display = 'none';
            this.els.joyStick.style.transform = 'translate(0px, 0px)';
        }
    },

    toggleMenu: function() {
        if(!this.els.navMenu) return;
        const isHidden = this.els.navMenu.classList.contains('hidden');
        if(isHidden) {
            this.els.navMenu.classList.remove('hidden');
            this.els.navMenu.style.display = 'flex';
        } else {
            this.els.navMenu.classList.add('hidden');
            this.els.navMenu.style.display = 'none';
        }
        this.focusIndex = -1;
        this.refreshFocusables();
    },

    refreshFocusables: function() {
        let container = this.els.view;
        if (Game.state && Game.state.inDialog && this.els.dialog && this.els.dialog.style.display !== 'none') {
            container = this.els.dialog;
        } else if (this.els.navMenu && !this.els.navMenu.classList.contains('hidden')) {
            container = this.els.navMenu;
        } else if (this.els.playerList && this.els.playerList.style.display === 'flex') {
            container = this.els.playerList;
        }

        const buttons = Array.from(container.querySelectorAll('button:not([disabled])'));
        this.focusableEls = buttons.filter(b => b.offsetParent !== null && b.style.display !== 'none');
        
        if(this.inputMethod === 'touch') {
            this.focusIndex = -1;
        } else {
            if (this.focusIndex >= this.focusableEls.length) this.focusIndex = 0;
            if (this.focusIndex < 0 && this.focusableEls.length > 0) this.focusIndex = 0;
        }
        
        this.updateFocusVisuals();
    },

    navigateFocus: function(delta) {
        if (this.focusableEls.length === 0) this.refreshFocusables();
        if (this.focusableEls.length === 0) return;

        if (this.focusIndex === -1) {
            this.focusIndex = delta > 0 ? 0 : this.focusableEls.length - 1;
        } else {
            this.focusIndex += delta;
        }
        
        if (this.focusIndex < 0) this.focusIndex = this.focusableEls.length - 1;
        if (this.focusIndex >= this.focusableEls.length) this.focusIndex = 0;

        this.updateFocusVisuals();
    },

    updateFocusVisuals: function() {
        document.querySelectorAll('.key-focus').forEach(el => el.classList.remove('key-focus'));
        if (this.inputMethod === 'key' && this.focusIndex !== -1 && this.focusableEls[this.focusIndex]) {
            const el = this.focusableEls[this.focusIndex];
            el.classList.add('key-focus');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    },

    triggerFocus: function() {
        if (this.focusableEls[this.focusIndex]) {
            this.focusableEls[this.focusIndex].click();
        }
    }
});
