// Konto und Cloud-Speicherstand (Firebase Auth + Realtime Database).
// Nur dieses Modul kennt Firebase. Die Spiellogik bleibt in src/domain/.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, get, set, update, onValue, runTransaction } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { firebaseConfig } from './firebase-config.js?v=20261125-anfrage1';
import { townKey } from './town-names.js?v=20261125-anfrage1';

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

/** Meldet jede Änderung des Betreibers an dieser Stadt (Zeitstempel). Liefert die Abmeldefunktion. */
export function watchAdminEdit(uid, onChange) {
  return onValue(ref(db, `saves/${uid}/town/adminEditedAt`), (snap) => {
    const v = snap.val();
    if (typeof v === 'number') onChange(v);
  });
}

/** Löscht die Stadt und gibt ihren Namen wieder frei. */
export async function deleteTown(uid) {
  const snap = await get(townRef(uid));
  const name = snap.exists() ? snap.val()?.name : null;
  await set(townRef(uid), null);
  if (name) await releaseTownName(uid, name).catch(() => {});
}

// ---------- Stadtnamen: eindeutig ----------
// townNames/{schlüssel} = UID. Der Schlüssel kommt aus src/town-names.js.

const townNameRef = (key) => ref(db, `townNames/${key}`);

/** Beansprucht den Namen für uid. False, wenn ihn schon jemand anderes hat. */
export async function claimTownName(uid, key) {
  const res = await runTransaction(townNameRef(key), (cur) => {
    if (cur === null) return uid;
    if (cur === uid) return cur;
    return undefined; // vergeben: nicht schreiben
  });
  return res.committed && res.snapshot.val() === uid;
}

/** Gibt den Namen frei, aber nur, wenn er uid gehört. */
export async function releaseTownName(uid, name) {
  const key = townKey(name);
  await runTransaction(townNameRef(key), (cur) => (cur === uid ? null : undefined));
}

/** Benennt die Stadt um (Betreiber). Bricht ab, wenn der neue Name vergeben ist. */
export async function renameTownName(uid, oldName, newName) {
  const oldKey = townKey(oldName);
  const newKey = townKey(newName);
  if (oldKey === newKey) return true;
  const claimed = await claimTownName(uid, newKey);
  if (!claimed) return false;
  await releaseTownName(uid, oldName).catch(() => {});
  return true;
}

// ---------- Profile: öffentlich lesbar (Name und Level, für Freunde) ----------

export function saveProfile(uid, { townName, townLevel }) {
  return set(ref(db, `profiles/${uid}`), { townName, townLevel });
}

export async function loadProfile(uid) {
  const snap = await get(ref(db, `profiles/${uid}`));
  return snap.exists() ? snap.val() : null;
}

// ---------- Freibriefe: ein Eintrag pro Konto, bleibt beim Neubeginn erhalten ----------

const charterRef = (uid) => ref(db, `charters/${uid}`);

export async function loadCharter(uid) {
  const snap = await get(charterRef(uid));
  return snap.exists() ? snap.val() : null;
}

export function saveCharter(uid, charter) {
  return set(charterRef(uid), JSON.parse(JSON.stringify(charter)));
}

// ---------- Freundescode und Einladungen ----------

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode() {
  const bytes = new Uint32Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/** Liefert den eigenen Code. Legt ihn beim ersten Mal an. */
export async function getOwnCode(uid) {
  const snap = await get(ref(db, `ownCodes/${uid}`));
  if (snap.exists()) return snap.val();
  for (let i = 0; i < 8; i++) {
    const code = randomCode();
    const res = await runTransaction(ref(db, `friendCodes/${code}`), (cur) => (cur === null ? uid : undefined));
    if (res.committed && res.snapshot.val() === uid) {
      await set(ref(db, `ownCodes/${uid}`), code);
      return code;
    }
  }
  throw new Error('Kein freier Freundescode gefunden. Bitte später erneut versuchen.');
}

/** Findet eine Stadt über ihren Code oder ihren Namen. Liefert { uid, profile } oder null. */
export async function findTown(query) {
  const q = String(query ?? '').trim();
  if (!q) return null;
  let uid = null;
  if (/^[A-HJ-NP-Z2-9]{6}$/i.test(q)) {
    const snap = await get(ref(db, `friendCodes/${q.toUpperCase()}`));
    uid = snap.exists() ? snap.val() : null;
  } else {
    const snap = await get(townNameRef(townKey(q)));
    uid = snap.exists() ? snap.val() : null;
  }
  if (!uid) return null;
  const profile = await loadProfile(uid);
  return profile ? { uid, profile } : null;
}

export function sendFriendRequest(me, myName, toUid) {
  return set(ref(db, `friendRequests/${toUid}/${me}`), { name: myName, at: Date.now() });
}

/** Meldet eingehende Anfragen als Liste [{ from, name, at }]. */
export function watchRequests(me, onChange) {
  return onValue(ref(db, `friendRequests/${me}`), (snap) => {
    const v = snap.val() ?? {};
    onChange(Object.entries(v).map(([from, r]) => ({ from, name: r?.name ?? '?', at: r?.at ?? 0 })));
  });
}

export function acceptRequest(me, fromUid) {
  return update(ref(db), {
    [`friends/${me}/${fromUid}`]: true,
    [`friends/${fromUid}/${me}`]: true,
    [`friendRequests/${me}/${fromUid}`]: null,
  });
}

export function declineRequest(me, fromUid) {
  return set(ref(db, `friendRequests/${me}/${fromUid}`), null);
}

/** Meldet die Freunde-UIDs [uid, ...]. */
export function watchFriends(me, onChange) {
  return onValue(ref(db, `friends/${me}`), (snap) => {
    onChange(Object.keys(snap.val() ?? {}));
  });
}

export function removeFriend(me, friendUid) {
  return update(ref(db), {
    [`friends/${me}/${friendUid}`]: null,
    [`friends/${friendUid}/${me}`]: null,
  });
}

// ---------- Betreiber (Admin) ----------
// Die Datenbankregeln entscheiden über alle Rechte. Diese Funktionen zeigen nur an, was erlaubt ist.

/** True, wenn die UID unter admins/ freigeschaltet ist. Lesbar nur für das Konto selbst. */
export async function isAdmin(uid) {
  const snap = await get(ref(db, `admins/${uid}`));
  return snap.exists() && snap.val() === true;
}

/** Alle Stadt-Stände, nur für Admins lesbar. Liefert [{ uid, town }]. */
export async function listSaves() {
  const snap = await get(ref(db, 'saves'));
  const all = snap.val() ?? {};
  return Object.entries(all)
    .filter(([, entry]) => entry && entry.town)
    .map(([uid, entry]) => ({ uid, town: entry.town }));
}

// ---------- Sitzung: ein offenes Fenster pro Konto, geräteübergreifend ----------
// Eine Sitzung gilt als verwaist, wenn sie länger als SESSION_STALE_MS keinen Herzschlag hatte.
// Das schützt vor einem abgestürzten Tab. Die Sperre ist eine Absicherung gegen Doppelbetrieb,
// keine Kryptografie: Wer das Konto kennt, kann die Sitzung übernehmen (dafür gibt es den Knopf).
export const SESSION_STALE_MS = 120_000;
const sessionRef = (uid) => ref(db, `sessions/${uid}`);

/** Belegt das Konto für dieses Fenster (sid). Mit force wird eine fremde Sitzung übernommen. Liefert true bei Erfolg. */
export async function claimSession(uid, sid, { force = false } = {}) {
  const res = await runTransaction(sessionRef(uid), (cur) => {
    const now = Date.now();
    if (force || !cur || cur.id === sid || now - (Number(cur.at) || 0) > SESSION_STALE_MS) {
      return { id: sid, at: now };
    }
    return undefined; // abbrechen: ein anderes Fenster hält das Konto
  }, { applyLocally: false });
  return res.committed;
}

/** Gibt die Sitzung frei, aber nur, wenn sie noch unserer ist. */
export async function releaseSession(uid, sid) {
  await runTransaction(sessionRef(uid), (cur) => (cur && cur.id === sid ? null : undefined), { applyLocally: false });
}

/** Ruft onLost() auf, sobald ein anderes Fenster die Sitzung übernimmt. Liefert die Abmeldefunktion. */
export function watchSession(uid, sid, onLost) {
  return onValue(sessionRef(uid), (snap) => {
    const v = snap.val();
    if (v && v.id !== sid) onLost();
  });
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
