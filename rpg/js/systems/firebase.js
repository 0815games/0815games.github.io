// [2026-10-12 20:45] - js/systems/firebase.js: v0.1.5 Cloud & Local Slots
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
    "auth/unauthorized-domain": "Diese Domain ist nicht autorisiert. (Lokale Tests bitte als Gastreisender starten)."
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

  async login(email, password) {
    if (!this.ready) throw new Error("Firebase ist offline. Bitte als Gast starten.");
    try {
      const cred = await this.auth.signInWithEmailAndPassword(email, password);
      return cred.user;
    } catch (e) {
      throw new Error(mapError(e));
    }
  }

  async register(email, password) {
    if (password.length < 6) {
      throw new Error("Das Passwort muss mindestens 6 Zeichen lang sein.");
    }
    if (!this.ready) throw new Error("Firebase ist offline. Bitte als Gast starten.");
    try {
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);
      return cred.user;
    } catch (e) {
      throw new Error(mapError(e));
    }
  }

  async loadAllSlots() {
    let slots = [null, null, null, null];
    try {
      const local = localStorage.getItem('dark_rpg_slots');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) slots = parsed;
      }
    } catch (e) { console.warn(e); }

    if (this.ready && state.user && !state.isGuest) {
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
    }

    return slots;
  }

  async saveSlot(slotIndex, data) {
    let slots = [null, null, null, null];
    try {
      const local = localStorage.getItem('dark_rpg_slots');
      if (local) slots = JSON.parse(local);
    } catch (e) {}
    slots[slotIndex] = data;
    localStorage.setItem('dark_rpg_slots', JSON.stringify(slots));

    if (this.ready && state.user && !state.isGuest) {
      try {
        await this.db.ref(`dark_rpg/saves/${state.user.uid}/slot_${slotIndex}`).set(data);
      } catch (e) {
        console.warn("Cloud saveSlot:", e);
      }
    }
  }

  async deleteSlot(slotIndex) {
    let slots = [null, null, null, null];
    try {
      const local = localStorage.getItem('dark_rpg_slots');
      if (local) slots = JSON.parse(local);
    } catch (e) {}
    slots[slotIndex] = null;
    localStorage.setItem('dark_rpg_slots', JSON.stringify(slots));

    if (this.ready && state.user && !state.isGuest) {
      try {
        await this.db.ref(`dark_rpg/saves/${state.user.uid}/slot_${slotIndex}`).remove();
      } catch (e) {
        console.warn("Cloud deleteSlot:", e);
      }
    }
  }
}

export const cloud = new Cloud();
