// [2026-10-12 19:40] - js/systems/firebase.js: v0.1.1 Saubere Authentifizierung & Cloud-Saves
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

class Cloud {
  constructor() {
    this.ready = false;
    this.auth = null;
    this.db = null;
  }

  init() {
    if (window.firebase && !this.ready) {
      try {
        if (!firebase.apps.length) firebase.initializeApp(CFG);
        this.auth = firebase.auth();
        this.db = firebase.database();
        this.ready = true;
      } catch (e) {
        console.warn('Firebase Offline-Fallback:', e);
      }
    }
  }

  translateError(err) {
    if (!err || !err.code) return err.message || 'Unbekannter Fehler bei der Authentifizierung.';
    switch (err.code) {
      case 'auth/invalid-email': return 'Ungültige Email-Adresse.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Email oder Passwort falsch.';
      case 'auth/email-already-in-use': return 'Diese Email ist bereits registriert. Bitte wähle "ANMELDEN".';
      case 'auth/weak-password': return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      case 'auth/too-many-requests': return 'Zu viele Versuche. Bitte kurz warten.';
      case 'auth/network-request-failed': return 'Keine Verbindung zum Ordens-Server. Starte als Gast.';
      default: return err.message || 'Verbindungsfehler zur Datenbank.';
    }
  }

  async login(email, password) {
    this.init();
    if (!this.ready) throw new Error('Offline-Modus. Bitte als Gastreisender spielen.');
    try {
      const cr = await this.auth.signInWithEmailAndPassword(email, password);
      return cr.user;
    } catch (err) {
      throw new Error(this.translateError(err));
    }
  }

  async register(email, password) {
    this.init();
    if (!this.ready) throw new Error('Offline-Modus. Bitte als Gastreisender spielen.');
    try {
      const cr = await this.auth.createUserWithEmailAndPassword(email, password);
      return cr.user;
    } catch (err) {
      throw new Error(this.translateError(err));
    }
  }

  async save(data) {
    if (this.ready && state.user && !state.isGuest) {
      try {
        await this.db.ref(`dark_rpg/saves/${state.user.uid}`).set(data);
      } catch (e) {
        console.warn('Cloud save fehlgeschlagen, speichere lokal:', e);
      }
    }
    localStorage.setItem('dark_rpg_local', JSON.stringify(data));
  }

  async load() {
    if (this.ready && state.user && !state.isGuest) {
      try {
        const s = await this.db.ref(`dark_rpg/saves/${state.user.uid}`).once('value');
        if (s.exists()) return s.val();
      } catch (e) {}
    }
    const l = localStorage.getItem('dark_rpg_local');
    return l ? JSON.parse(l) : null;
  }
}

export const cloud = new Cloud();
