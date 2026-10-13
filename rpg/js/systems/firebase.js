// [2026-10-13 08:10] - js/systems/firebase.js: v0.2.4 Robuste Cloud-Slots
import { state } from '../core/state.js';

const CFG = {
  apiKey: "AIzaSyCgSK4nJ3QOVMBd7m9RSmURflSRWN4ejBY",
  authDomain: "pipboy-rpg.firebaseapp.com",
  databaseURL: "https://pipboy-rpg-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pipboy-rpg",
  storageBucket: "pipboy-rpg.firebasestorage.app",
  messagingSenderId: "1023458799306",
  appId: "1:1023458799306:web:2d8c1abc23b02beac14e33"
};

const mapError = (e) => {
  const code = e.code || "";
  const errMap = {
    "auth/invalid-email": "Ungültiges E-Mail-Format.",
    "auth/user-not-found": "Kein Ordenskonto mit dieser E-Mail gefunden.",
    "auth/wrong-password": "Das eingegebene Runen-Passwort ist falsch.",
    "auth/email-already-in-use": "Diese E-Mail ist bereits registriert. Bitte anmelden.",
    "auth/weak-password": "Passwort zu schwach (mindestens 6 Zeichen).",
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
      await this.db.ref(`dark_rpg/saves/${state.user.uid}/slot_${slotIndex}`).set(data);
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
