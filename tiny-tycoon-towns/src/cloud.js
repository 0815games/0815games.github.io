// Konto und Cloud-Speicherstand (Firebase Auth + Realtime Database).
// Nur dieses Modul kennt Firebase. Die Spiellogik bleibt in src/domain/.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, get, set, onValue } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { firebaseConfig } from './firebase-config.js?v=20261124-konto2';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/** Calls cb(user | null) on every sign-in change. Returns the unsubscribe function. */
export const onUser = (cb) => onAuthStateChanged(auth, cb);

export const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);

/** Calls cb(true | false) whenever the Realtime Database connection changes. */
export const onConnected = (cb) => onValue(ref(db, '.info/connected'), (snap) => cb(snap.val() === true));

const townRef = (uid) => ref(db, `saves/${uid}/town`);

/** Returns the stored town object or null. Throws on network or permission errors. */
export async function loadTown(uid) {
  const snap = await get(townRef(uid));
  return snap.exists() ? snap.val() : null;
}

/** Writes the whole town. Plain JSON only: RTDB rejects undefined values. */
export function saveTown(uid, town) {
  return set(townRef(uid), JSON.parse(JSON.stringify(town)));
}

export function deleteTown(uid) {
  return set(townRef(uid), null);
}

const AUTH_DE = {
  'auth/invalid-email': 'Diese E-Mail-Adresse ist ungültig.',
  'auth/missing-password': 'Bitte ein Passwort eingeben.',
  'auth/weak-password': 'Das Passwort ist zu kurz (mindestens 6 Zeichen).',
  'auth/email-already-in-use': 'Diese E-Mail ist schon registriert. Bitte anmelden.',
  'auth/invalid-credential': 'E-Mail oder Passwort stimmen nicht.',
  'auth/wrong-password': 'E-Mail oder Passwort stimmen nicht.',
  'auth/user-not-found': 'E-Mail oder Passwort stimmen nicht.',
  'auth/too-many-requests': 'Zu viele Versuche. Bitte später erneut probieren.',
  'auth/network-request-failed': 'Keine Verbindung zum Server.',
  'auth/operation-not-allowed': 'Die Anmeldung per E-Mail ist im Projekt nicht aktiviert.',
  'auth/unauthorized-domain': 'Diese Seitenadresse ist in Firebase nicht autorisiert. Unter Authentication → Settings → Authorized domains eintragen.',
};

export function authErrorDe(err) {
  return AUTH_DE[err?.code] ?? 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.';
}

export function dbErrorDe(err) {
  if (String(err?.message ?? '').includes('permission_denied')) {
    return 'Kein Zugriff auf deinen Spielstand. Die Regeln sind noch nicht veröffentlicht (siehe docs/FIREBASE.md).';
  }
  return 'Speichern in der Cloud fehlgeschlagen. Wir versuchen es erneut.';
}
