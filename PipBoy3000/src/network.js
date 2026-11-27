// [2026-02-22 02:00:00] network.js - Safe Name Release & RIP Highscore Logic

const Network = window.Network = {
    db: null,
    auth: null,
    myId: null,
    myDisplayName: null,
    otherPlayers: {},
    active: false,
    heartbeatInterval: null,
    sessionId: null,
    sessionRef: null,
    sessionListener: null,
    sessionLost: false,
    pendingSaves: new Set(),

    config: {
        apiKey: "AIzaSyCgSK4nJ3QOVMBd7m9RSmURflSRWN4ejBY",
        authDomain: "pipboy-rpg.firebaseapp.com",
        databaseURL: "https://pipboy-rpg-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "pipboy-rpg",
        storageBucket: "pipboy-rpg.firebasestorage.app",
        messagingSenderId: "1023458799306",
        appId: "1:1023458799306:web:2d8c1abc23b02beac14e33",
        measurementId: "G-DYGLZTMWWT"
    },

    init: function() {
        this.active = true;
        // Drei CDN-Skripte (firebase-app, -auth, -database) muessen geladen
        // sein. Fehlen sie - Ausfall, mobiles Netz, Proxy -, ist der Login
        // nicht moeglich. Statt in eine Sackgasse zu laufen, meldet der
        // Login-Bildschirm den Offline-Weg (window.pruefeNetzwerk).
        if (typeof firebase === 'undefined') {
            this.active = false;
            if (typeof window !== 'undefined' && typeof window.pruefeNetzwerk === 'function') {
                window.pruefeNetzwerk();
            }
            return;
        }
        if (!this.db) {
            try {
                if (!firebase.apps.length) firebase.initializeApp(this.config);
                this.db = firebase.database();
                this.auth = firebase.auth();

                this.auth.onAuthStateChanged((user) => {
                    if (!user && this.myId) {
                        console.warn("Session expired or logged out.");
                        this.disconnect(); 
                        if (typeof UI !== 'undefined' && UI.logout) {
                            UI.logout("VERBINDUNG GETRENNT");
                        }
                    }
                });

            } catch (e) {
                console.error("Firebase Init Error:", e);
                this.active = false;
            }
        }
    },

    register: async function(email, password, name) {
        this.init();
        if(!this.active) throw new Error("Netzwerk nicht aktiv (Init Failed)");
        const isFree = await this.checkNameAvailability(name);
        if (!isFree) throw new Error("Dieser Name ist bereits vergeben (Charakter lebt noch).");

        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            await user.updateProfile({ displayName: name });
            this.myId = user.uid;
            this.myDisplayName = name;
            await this.acquireSession(user.uid);
            return {};
        } catch (e) {
            // Firebase meldet sich mit `code` und einer englischen Nachricht.
            // Ohne diese Übersetzung stand im Login nur "Script error." oder
            // "auth/network-request-failed" - für den Spieler nicht deutbar.
            throw new Error(this.fehlerText(e));
        }
    },

    // Firebase-Fehlercodes in verständliche Sätze. Bewusst hier gebündelt:
    // der Login zeigt nur noch `error.message`, und die stammte vorher
    // ungefiltert aus dem fremden Skript.
    fehlerText: function(e) {
        const code = (e && e.code) || '';
        const tabelle = {
            'auth/network-request-failed': 'Kein Netz. Bitte Verbindung prüfen.',
            'auth/invalid-email': 'Die E-Mail-Adresse ist ungültig.',
            'auth/user-not-found': 'Kein Account mit dieser E-Mail.',
            'auth/wrong-password': 'Passwort falsch.',
            'auth/invalid-credential': 'E-Mail oder Passwort falsch.',
            'auth/too-many-requests': 'Zu viele Versuche. Bitte kurz warten.',
            'auth/email-already-in-use': 'Diese E-Mail ist schon registriert.',
            'auth/weak-password': 'Das Passwort ist zu kurz (min. 6 Zeichen).',
            'auth/operation-not-allowed': 'Anmeldung ist für dieses Projekt gesperrt.'
        };
        if (tabelle[code]) return tabelle[code];
        // Unbekannter Code: wenigstens etwas Lesbares statt "Script error."
        const roh = (e && e.message) || String(e);
        return `Anmeldung fehlgeschlagen (${code || 'unbekannt'}).`;
    },

    // Eine Session wird per Transaktion übernommen. Auch verwaiste Sitzungen
    // werden nur nach Zustimmung ersetzt.
    acquireSession: async function(uid) {
        const ref = this.db.ref('sessions/' + uid);
        const id = this.db.ref().push().key;
        // Ein aktiver Listener hält den zuletzt gelesenen Wert im lokalen
        // Firebase-Cache. Ohne ihn kann transaction zuerst null sehen und
        // eine bestehende Sitzung fälschlich als geändert ablehnen.
        const keepCached = () => {};
        ref.on('value', keepCached);
        let result;
        try {
            const initial = (await ref.once('value')).val();
            // Auch eine verwaiste Session braucht Zustimmung: Browser können
            // Hintergrund-Tabs länger als zwei Minuten pausieren.
            const busy = initial && initial.id;
            if (busy && !window.confirm('Dieser Account ist bereits verbunden. Bestehende Sitzung ersetzen? Noch nicht gespeicherter Fortschritt kann verloren gehen.')) {
                throw new Error('Anmeldung abgebrochen. Die bestehende Sitzung bleibt aktiv.');
            }
            const initialId = initial && initial.id || null;
            result = await ref.transaction(current => {
                if ((current && current.id || null) !== initialId) return;
                return {id, lastSeen: Date.now()};
            }, undefined, false);
        } finally {
            ref.off('value', keepCached);
        }
        if (!result.committed) throw new Error('Die Sitzung hat sich geändert. Bitte erneut anmelden.');
        this.sessionId = id;
        this.sessionRef = ref;
        this.sessionLost = false;
        this.sessionListener = snap => {
            if (!this.sessionId || (snap.val() && snap.val().id === this.sessionId)) return;
            this.sessionLost = true;
            this.sessionId = null;
            if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
            if (typeof Game !== 'undefined' && Game.saveTimer) {
                clearTimeout(Game.saveTimer); Game.saveTimer = null; Game.isDirty = false;
            }
            if (typeof UI !== 'undefined' && UI.logout) UI.logout('SITZUNG AUF EINEM ANDEREN GERÄT ERSETZT', true);
        };
        ref.on('value', this.sessionListener);
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), 5000);
    },

    login: async function(email, password) {
        this.init();
        if (!this.active) throw new Error('Verbindung zu Vault-Tec unterbrochen. Spiel ohne Anmeldung möglich.');
        try {
            const user = (await this.auth.signInWithEmailAndPassword(email, password)).user;
            this.myId = user.uid;
            this.myDisplayName = user.displayName || 'Unknown';
            await this.acquireSession(user.uid);
            const snapshot = await this.db.ref('saves/' + user.uid).once('value');
            const saves = snapshot.val() || {};
            for (const key of Object.keys(saves)) if (saves[key] && saves[key]._deleted) delete saves[key];
            return saves;
        } catch(e) {
            if (this.sessionId) await this.disconnect();
            if (e.code) throw new Error(this.fehlerText(e));
            throw e;
        }
    },

    checkNameAvailability: async function(charName) {
        if (!this.db || !charName) return true;
        const safeName = charName.replace(/[.#$\[\]]/g, "_");
        const ref = this.db.ref(`leaderboard/${safeName}`);
        
        const snap = await ref.once('value');
        if (snap.exists()) {
            const val = snap.val();
            // Wenn der Eintrag noch da und 'alive' ist, ist der Name blockiert
            if (val.status === 'alive') return false; 
        }
        return true;
    },

    updateHighscore: function(gameState) {
        if(!this.active || !this.myId || !gameState || !this.auth.currentUser) return;
        
        const safeName = (gameState.playerName || "Unknown").replace(/[.#$\[\]]/g, "_");
        const entry = {
            name: gameState.playerName || "Unknown",
            lvl: gameState.lvl,
            kills: gameState.kills || 0,
            xp: gameState.xp + (gameState.lvl * 1000), 
            status: 'alive',
            owner: this.myId,
            timestamp: Date.now()
        };
        
        this.db.ref(`leaderboard/${safeName}`).update(entry).catch(e => {}); 
    },

    // --- NEU: SICHERER TODES-EINTRAG (RIP LOGIK) ---
    registerDeath: function(gameState) {
        if(!this.active || !gameState || !this.auth.currentUser) return;
        
        const safeName = (gameState.playerName || "Unknown").replace(/[.#$\[\]]/g, "_");
        const ts = Date.now();
        // Wir erstellen einen einzigartigen Key für tote Charaktere
        const deadSafeName = safeName + "_RIP_" + ts;
        
        const entry = {
            name: gameState.playerName || "Unknown", // Der Anzeigename bleibt sauber!
            lvl: gameState.lvl,
            kills: gameState.kills || 0,
            xp: gameState.xp + (gameState.lvl * 1000),
            status: 'dead', 
            owner: this.myId,
            deathTime: ts
        };
        
        // 1. In die Legendenliste als Toter eintragen
        this.db.ref(`leaderboard/${deadSafeName}`).set(entry).catch(e => console.error(e));
        
        // 2. Den originalen Namen aus dem Leaderboard löschen, um ihn für neue Chars freizugeben!
        this.db.ref(`leaderboard/${safeName}`).remove().catch(e => console.error(e));
    },

    getHighscores: async function() {
        if(!this.active) return [];
        const snap = await this.db.ref('leaderboard').once('value');
        const list = [];
        snap.forEach(child => {
            list.push(child.val());
        });
        return list;
    },

    saveToSlot: function(slotIndex, gameState) {
        if (!this.active || !this.myId || !this.sessionId || !this.auth.currentUser) return;
        const saveObj = JSON.parse(JSON.stringify(gameState));
        saveObj._userEmail = this.auth.currentUser.email || null;
        saveObj._lastSeen = Date.now();
        saveObj._session = this.sessionId;
        const operation = this.db.ref(`saves/${this.myId}/${slotIndex}`).set(saveObj);
        this.pendingSaves.add(operation);
        operation.catch(e => {
            console.error('Save Error:', e);
            if (typeof UI !== 'undefined' && UI.log) UI.log('CLOUD-SPEICHERN FEHLGESCHLAGEN', 'text-red-500');
        }).finally(() => this.pendingSaves.delete(operation));
        return operation;
    },

    // Ein Tombstone trägt den Sitzungsmarker; ein direktes remove könnte nicht
    // mit newData geprüft werden und wäre für einen verdrängten Client unsicher.
    deleteSlot: async function(slotIndex) {
        if (!this.active || !this.myId || !this.sessionId || !this.auth.currentUser) throw new Error('Keine aktive Sitzung');
        const ref = this.db.ref(`saves/${this.myId}/${slotIndex}`);
        const save = (await ref.once('value')).val();
        await ref.set({_deleted: true, _session: this.sessionId});
        if (save && save.playerName) {
            const safeName = save.playerName.replace(/[.#$\[\]]/g, '_');
            const lbRef = this.db.ref(`leaderboard/${safeName}`);
            const entry = (await lbRef.once('value')).val();
            if (entry && entry.status === 'alive') {
                const ts = Date.now();
                await this.db.ref(`leaderboard/${safeName}_RIP_${ts}`).set({...entry, status: 'dead', deathTime: ts});
                await lbRef.remove();
            }
        }
    },

    save: function(gameState) {
        if (typeof Game !== 'undefined' && Game.state && Game.state.saveSlot !== undefined) {
            this.saveToSlot(Game.state.saveSlot, gameState);
        } else {
            console.error("No Save Slot defined!");
        }
    },
    
    deleteSave: function() {
        if(!this.active || !this.myId) return;
        if (typeof Game !== 'undefined' && Game.state && Game.state.saveSlot !== undefined) {
            this.deleteSlot(Game.state.saveSlot);
        }
    },

    startPresence: function() {
        if (!this.myId || !this.sessionId || !this.auth.currentUser) return;
        // Kein onDisconnect auf einem gemeinsam genutzten Pfad: ein alter Tab
        // dürfte sonst die Presence seines Nachfolgers löschen.
        this.db.ref('players').on('value', snapshot => {
            if (!this.active) return;
            const rawData = snapshot.val() || {}, cleanData = {}, now = Date.now();
            for (const pid in rawData) {
                if (pid === this.myId) continue;
                const p = rawData[pid];
                if (!p.lastSeen || now - p.lastSeen > 120000) continue;
                cleanData[p.name || pid] = p;
            }
            this.otherPlayers = cleanData;
            if (typeof UI !== 'undefined') {
                const el = document.getElementById('val-players');
                if (el) el.textContent = `${Object.keys(cleanData).length + 1}`;
                if (UI.els.spawnScreen && UI.els.spawnScreen.style.display !== 'none') UI.renderSpawnList(cleanData);
                UI.updatePlayerList();
            }
            if (typeof Game !== 'undefined' && Game.state && Game.draw) Game.draw();
        });
        if (typeof UI !== 'undefined') UI.setConnectionState('online');
        this.sendHeartbeat();
    },

    disconnect: async function() {
        const ref = this.sessionRef, id = this.sessionId;
        this.sessionId = null;
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
        if (ref && this.sessionListener) ref.off('value', this.sessionListener);
        this.sessionRef = null; this.sessionListener = null;
        if (this.db) this.db.ref('players').off();
        if (id && ref) {
            // Vor Freigabe auf bestätigte Saves warten, ohne unbegrenzt offline
            // zu hängen. Regeln verweigern verspätete Writes nach Freigabe.
            await Promise.race([Promise.allSettled([...this.pendingSaves]), new Promise(resolve => setTimeout(resolve, 3000))]);
            try { await ref.transaction(current => current && current.id === id ? null : undefined, undefined, false); }
            catch (e) { console.error('Sitzung konnte nicht freigegeben werden', e); }
        }
        this.active = false; this.myId = null;
    },

    sendHeartbeat: function() {
        if (!this.active || !this.myId || !this.sessionId || !this.auth.currentUser) return;
        const id = this.sessionId;
        this.sessionRef.transaction(current => current && current.id === id ? {...current, lastSeen: Date.now()} : undefined, undefined, false).catch(e => console.error('Session heartbeat:', e));
        if (typeof Game !== 'undefined' && Game.state && Game.state.view === 'map') {
            this.db.ref('players/' + this.myId).set({
                _session: id, lastSeen: Date.now(), name: Game.state.playerName || this.myDisplayName,
                x: Game.state.player.x, y: Game.state.player.y, sector: Game.state.sector, lvl: Game.state.lvl
            }).catch(e => console.error('Presence:', e));
        }
    },

    sendBugReport: async function(reportData) {
        if (!this.db) return false;
        try { await this.db.ref("bug_reports").push(reportData); return true; } 
        catch (e) { console.error(e); return false; }
    }
};
