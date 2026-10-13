// [2026-10-13 09:50] - js/systems/firebase.js: v0.3.5 Klare Anmelde-Fehler
import { state } from '../core/state.js';

const CFG = {
  apiKey: "AIzaSyBbYbswfsuyXhgK-t_Whz7sGven7J2fT2w",
  authDomain: "rpg01-793eb.firebaseapp.com",
  databaseURL: "https://rpg01-793eb-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "rpg01-793eb",
  storageBucket: "rpg01-793eb.firebasestorage.app",
  messagingSenderId: "381934095221",
  appId: "1:381934095221:web:71007bb26d223de0a7213c",
  measurementId: "G-4GCT9YCJJ8"
};

const mapError = (e) => {
  const code = e.code || "";
  const errMap = {
    "auth/invalid-email": "Ungültiges E-Mail-Format. Bitte prüfe deine E-Mail-Adresse.",
    "auth/user-not-found": "Kein Ordenskonto mit dieser E-Mail gefunden. Bitte registriere dich zuerst.",
    "auth/wrong-password": "Das eingegebene Runen-Passwort ist falsch.",
    "auth/invalid-credential": "E-Mail oder Passwort ist falsch. Bitte prüfe beide Angaben.",
    "auth/invalid-login-credentials": "E-Mail oder Passwort ist falsch. Bitte prüfe beide Angaben.",
    "auth/missing-password": "Bitte gib dein Runen-Passwort ein.",
    "auth/email-already-in-use": "Diese E-Mail ist bereits registriert. Bitte melde dich an.",
    "auth/weak-password": "Das Passwort ist zu schwach. Verwende mindestens 6 Zeichen.",
    "auth/user-disabled": "Dieses Ordenskonto wurde deaktiviert.",
    "auth/too-many-requests": "Zu viele Anmeldeversuche. Bitte warte kurz und versuche es erneut.",
    "auth/operation-not-allowed": "E-Mail/Passwort-Anmeldung ist in der Firebase-Konsole noch nicht aktiviert.",
    "auth/network-request-failed": "Netzwerkfehler zum Ordensarchiv. Bitte Internet oder Adblocker prüfen.",
    "auth/unauthorized-domain": "Diese Domain ist nicht autorisiert. Bitte über die freigegebene GitHub-Seite spielen."
  };
  return errMap[code] || e.message || "Authentifizierungsfehler aufgetreten.";
};

class Cloud {
  constructor() {
    this.ready = false;
  }

  init() {
    try {
      if (!window.firebase) return false;
      if (!firebase.apps.length) firebase.initializeApp(CFG);
      this.auth = firebase.auth();
      this.db = firebase.database();
      this.ready = true;
      return true;
    } catch (e) {
      console.warn("Firebase Init:", e);
      return false;
    }
  }

  requireReady() {
    if (!this.ready) throw new Error("Das Ordensarchiv ist nicht verbunden. Bitte Seite neu laden und Internet prüfen.");
  }

  async login(email, password) {
    this.requireReady();
    try {
      const cred = await this.auth.signInWithEmailAndPassword(email, password);
      return cred.user;
    } catch (e) {
      throw new Error(mapError(e));
    }
  }

  async register(email, password) {
    this.requireReady();
    if (password.length < 6) {
      throw new Error("Das Passwort muss mindestens 6 Zeichen lang sein.");
    }
    try {
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);
      return cred.user;
    } catch (e) {
      throw new Error(mapError(e));
    }
  }

  async loadAllSlots() {
    const slots = [null, null, null, null];
    if (!this.ready || !state.user?.uid) {
      console.warn("Cloud loadAllSlots: Keine gültige Firebase-Sitzung.");
      return slots;
    }
    try {
      const snap = await this.db.ref(`dark_rpg/saves/${state.user.uid}`).once('value');
      if (snap.exists()) {
        const cloudData = snap.val();
        for (let i = 0; i < 4; i++) {
          if (cloudData[`slot_${i}`]) {
            slots[i] = cloudData[`slot_${i}`];
          }
        }
      }
    } catch (e) {
      console.warn("Cloud loadAllSlots:", e);
    }
    return slots;
  }

  async saveSlot(slotIndex, data) {
    if (!this.ready || !state.user?.uid) {
      console.warn("Cloud saveSlot: Keine gültige Firebase-Sitzung.");
      return false;
    }
    try {
      const clean = JSON.parse(JSON.stringify({
        player: data.player,
        world: data.world,
        meta: data.meta,
        currentSlot: data.currentSlot
      }));
      await this.db.ref(`dark_rpg/saves/${state.user.uid}/slot_${slotIndex}`).set(clean);
      return true;
    } catch (e) {
      console.warn("Cloud saveSlot:", e);
      return false;
    }
  }

  async deleteSlot(slotIndex) {
    if (!this.ready || !state.user?.uid) {
      console.warn("Cloud deleteSlot: Keine gültige Firebase-Sitzung.");
      return false;
    }
    try {
      await this.db.ref(`dark_rpg/saves/${state.user.uid}/slot_${slotIndex}`).remove();
      return true;
    } catch (e) {
      console.warn("Cloud deleteSlot:", e);
      return false;
    }
  }
}

export const cloud = new Cloud();
