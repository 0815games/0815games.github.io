const app = firebase.apps.length
  ? firebase.app()
  : firebase.initializeApp(FIREBASE_CONFIG);

const auth = firebase.auth();
const db = firebase.database();

let currentUser = null;
let currentProfile = null;
let dbConnected = false;
let lastSave = null;
let lastError = null;

let activeCharacterId = null;
let characterLoadedUid = null;
let characterLoadPromise = null;
let characterSaveBusy = false;

window.inkfallMode = "menu";

function logFb(text) {
  // DIAG_FIREBASE_EVENTS
  window.inkfallDiag?.info("Firebase", text);

  const target = document.getElementById("log");
  if (!target) return;

  const line = document.createElement("div");
  line.textContent = "Firebase: " + text;
  target.prepend(line);

  while (target.children.length > 100) {
    target.lastElementChild.remove();
  }
}

function fbError(error) {
  lastError = error.message || String(error);
  logFb(lastError);
  if (typeof inkfallNotify === "function") {
    inkfallNotify(lastError, "error");
  }
}

function ensureAuthUI() {
  if (document.getElementById("authBox")) return;

  const box = document.createElement("div");
  box.id = "authBox";
  box.innerHTML = `
    <strong>Account & Charakter</strong>
    <p id="userInfo">Nicht angemeldet</p>
    <div id="authLoggedOut">Anmeldung über das Hauptmenü.</div>
    <div id="authLoggedIn" style="display:none">
    </div>
    <p id="authMsg" role="status"></p>
  `;

  document.body.append(box);
}

function updateAccountUI() {
  ensureAuthUI();

  const loggedIn = Boolean(auth.currentUser);
  document.getElementById("authLoggedOut").style.display =
    loggedIn ? "none" : "block";
  document.getElementById("authLoggedIn").style.display =
    loggedIn ? "block" : "none";

  const character = currentProfile?.characters?.[activeCharacterId];

  document.getElementById("userInfo").textContent = loggedIn
    ? (currentProfile?.profile?.displayName || "Wächter") +
      " · " + (character?.heroName || HERO[activeCharacterId]?.name || "Keine Klasse") +
      " · Level " + (character?.level || 1)
    : "Nicht angemeldet";
}

function freshRun(classId) {
  return {
    heroClass: classId,
    gold: 150,
    lives: 100,
    wave: 0,
    heroX: 120,
    heroY: 300
  };
}

function freshCharacter(classId) {
  return {
    heroName: HERO[classId]?.name || classId,
    heroNameLocked: false,
    level: 1,
    xp: 0,
    skillPoints: 0,
    soloRun: freshRun(classId)
  };
}

function validHeroName(value, classId) {
  const name = String(value || "").trim();
  return name.length >= 3 && name.length <= 20
    ? name
    : HERO[classId]?.name || classId;
}

function validSkills(source) {
  const result = {};

  for (const [id, value] of Object.entries(source || {})) {
    if (value === true && TREE.some(node => node.id === id)) {
      result[id] = true;
    }
  }

  return result;
}

async function migrateCharacters(user) {
  const reference = db.ref("users/" + user.uid);

  let listener = null;
  let latestSnapshot = null;

  try {
    await new Promise((resolve, reject) => {
      listener = snapshot => {
        latestSnapshot = snapshot;
        resolve(snapshot);
      };

      reference.on("value", listener, reject);
    });

    if (auth.currentUser?.uid !== user.uid) {
      throw new Error("Anmeldung hat sich während der Migration geändert.");
    }

    if (!latestSnapshot || !latestSnapshot.exists()) {
      throw new Error(
        "Spielerprofil fehlt unter users/" + user.uid +
        ". Bitte den Account im Hauptmenü vervollständigen."
      );
    }

    if (latestSnapshot.val().schemaVersion === 2) {
      logFb("Charakterstruktur bereits vorhanden.");
      return;
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      let abortReason = "";
      let callbackError = null;

      const result = await reference.transaction(current => {
        try {
          if (current === null) {
            abortReason =
              "Die Transaktion hat noch keine lokalen Accountdaten erhalten.";
            return;
          }

          if (current.schemaVersion === 2) {
            return current;
          }

          if (!current.profile?.displayName) {
            abortReason = "Im Account fehlt profile/displayName.";
            return;
          }

          const next = JSON.parse(JSON.stringify(current));
          const old = next.save;

          const classId =
            old?.heroClass === "mage" ? "mage" : "knight";

          next.characters = next.characters || {};

          if (!next.characters[classId]) {
            const character = freshCharacter(classId);

            if (old) {
              character.skillPoints =
                Number.isInteger(old.skillPoints)
                  ? Math.max(0, Math.min(999, old.skillPoints))
                  : 0;

              character.skills = validSkills(old.skills);

              const oldLevel = next.profile?.level;
              character.level =
                Number.isInteger(oldLevel)
                  ? Math.max(1, Math.min(999, oldLevel))
                  : 1;

              const transferable =
                Number.isInteger(old.wave) &&
                old.wave >= 0 &&
                old.wave <= waves.length &&
                (old.wave === 0 || Boolean(old.towers));

              if (transferable) {
                character.soloRun = {
                  heroClass: classId,
                  gold: Number.isFinite(old.gold) ? old.gold : 150,
                  lives: Number.isFinite(old.lives) ? old.lives : 100,
                  wave: old.wave,
                  heroX: Number.isFinite(old.heroX) ? old.heroX : 120,
                  heroY: Number.isFinite(old.heroY) ? old.heroY : 300
                };

                if (old.towers) {
                  character.soloRun.towers = old.towers;
                }
              }
            }

            next.characters[classId] = character;
          }

          next.selectedClass = classId;
          next.schemaVersion = 2;

          return next;
        } catch (error) {
          callbackError = error;
          return;
        }
      }, undefined, false);

      if (callbackError) {
        throw new Error(
          "Migration konnte nicht vorbereitet werden: " +
          callbackError.message
        );
      }

      if (result.committed) {
        if (result.snapshot.val()?.schemaVersion !== 2) {
          throw new Error("Migration wurde bestätigt, aber schemaVersion 2 fehlt.");
        }

        logFb("Charakter-Migration erfolgreich abgeschlossen.");
        return;
      }

      const check = await reference.get();

      if (check.val()?.schemaVersion === 2) {
        logFb("Charakter-Migration wurde bereits abgeschlossen.");
        return;
      }

      if (!check.exists()) {
        throw new Error("Der Accountdatensatz ist nicht mehr vorhanden.");
      }

      if (attempt === 3) {
        throw new Error(
          "Migration nach drei Versuchen abgebrochen: " +
          (abortReason || "Die Transaktion wurde nicht bestätigt.")
        );
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    logFb(
      "Migration: " +
      (error.code ? error.code + " – " : "") +
      error.message
    );
    throw error;
  } finally {
    if (listener) {
      reference.off("value", listener);
    }
  }
}

function decodeCharacter(classId, character) {
  const run = character.soloRun || freshRun(classId);

  const number = (value, min, max) =>
    Number.isFinite(value) && value >= min && value <= max;

  if (
    run.heroClass !== classId ||
    !number(run.gold, 0, 999999) ||
    !number(run.lives, 0, 100) ||
    !Number.isInteger(run.wave) ||
    run.wave < 0 || run.wave > waves.length ||
    !Number.isInteger(character.skillPoints) ||
    character.skillPoints < 0 || character.skillPoints > 999
  ) {
    throw new Error("Ungültiger Charakter-Spielstand: " + classId);
  }

  const restoredTowers = Object.values(run.towers || {}).map(item => {
    if (
      !T[item.type] ||
      !number(item.x, 0, cv.width) ||
      !number(item.y, 0, cv.height) ||
      !Number.isInteger(item.level) ||
      item.level < 1 || item.level > 100
    ) {
      throw new Error("Ungültiger gespeicherter Turm.");
    }

    return {
      t: item.type,
      x: item.x,
      y: item.y,
      lvl: item.level,
      cd: 0
    };
  });

  if (restoredTowers.length > 200) {
    throw new Error("Zu viele gespeicherte Türme.");
  }

  return {
    run,
    towers: restoredTowers,
    skills: validSkills(character.skills),
    heroName: heroNameState(character, classId).name,
    heroX: number(run.heroX, 0, cv.width) ? run.heroX : 120,
    heroY: number(run.heroY, 0, cv.height) ? run.heroY : 300
  };
}

function applyCharacter(classId, character) {
  const restored = decodeCharacter(classId, character);

  gold = restored.run.gold;
  lives = restored.run.lives;
  wave = restored.run.wave;

  skillPoints = character.skillPoints;
  skills = restored.skills;
  towers = restored.towers;

  hero.cls = classId;
  hero.name = restored.heroName;
  hero.x = restored.heroX;
  hero.y = restored.heroY;
  hero.target = null;
  hero.cd = 0;
  hero.attackCd = 0;

  active = false;
  enemies = [];
  shots = [];
  queue = [];
  timer = 0;
  sel = null;
  buildType = null;

  activeCharacterId = classId;
  ui();
}

async function loadGame() {
  const user = auth.currentUser;
  if (!user) return;

  if (characterLoadedUid === user.uid && activeCharacterId) return;
  if (characterLoadPromise) return characterLoadPromise;

  characterLoadPromise = (async () => {
    try {
      await migrateCharacters(user);

      const snapshot = await db.ref("users/" + user.uid).get();
      if (auth.currentUser?.uid !== user.uid) return;

      const data = snapshot.val();
      const classId = data.selectedClass === "mage" ? "mage" : "knight";
      const character = data.characters?.[classId];

      if (!character) throw new Error("Ausgewählter Charakter fehlt.");

      applyCharacter(classId, character);

      currentProfile = data;
      currentUser = user;
      characterLoadedUid = user.uid;
      lastError = null;

      updateAccountUI();
      logFb("Charakter geladen: " + hero.name);
    } catch (error) {
      fbError(error);
      throw error;
    }
  })();

  try {
    return await characterLoadPromise;
  } finally {
    characterLoadPromise = null;
  }
}

async function saveGame() {
  const user = auth.currentUser;

  if (!user || characterLoadedUid !== user.uid || !activeCharacterId) {
    logFb("Speichern gesperrt: Kein vollständig geladener Charakter.");
    return false;
  }

  if (window.inkfallMode !== "single") {
    logFb("Privater Speicherpunkt wird außerhalb des Einzelspielers nicht verändert.");
    return false;
  }

  if (active || characterSaveBusy) {
    if (active) logFb("Speichern erst nach Abschluss der Welle möglich.");
    return false;
  }

  const classId = activeCharacterId;

  if (hero.cls !== classId) {
    fbError(new Error("Klasse und geladener Charakter stimmen nicht überein."));
    return false;
  }

  const towerData = {};

  towers.forEach((tower, index) => {
    towerData["tower_" + index] = {
      type: tower.t,
      x: tower.x,
      y: tower.y,
      level: tower.lvl
    };
  });

  const run = {
    heroClass: classId,
    gold,
    lives,
    wave,
    heroX: hero.x,
    heroY: hero.y,
    updatedAt: firebase.database.ServerValue.TIMESTAMP,
    towers: towerData
  };

  const savedSkills = { ...skills };
  const savedPoints = skillPoints;

  characterSaveBusy = true;

  try {
    await db.ref("users/" + user.uid).update({
      ["characters/" + classId + "/skillPoints"]: savedPoints,
      ["characters/" + classId + "/skills"]: savedSkills,
      ["characters/" + classId + "/soloRun"]: run,
      selectedClass: classId
    });

    if (auth.currentUser?.uid === user.uid) {
      const character = currentProfile.characters[classId];
      character.skillPoints = savedPoints;
      character.skills = savedSkills;
      character.soloRun = run;

      lastSave = new Date().toLocaleTimeString("de-DE");
      lastError = null;
      logFb(hero.name + " gespeichert.");
    }

    return true;
  } catch (error) {
    fbError(error);
    return false;
  } finally {
    characterSaveBusy = false;
  }
}


function heroNameState(character, classId) {
  const fallback = HERO[classId]?.name || classId;
  const value = typeof character?.heroName === "string"
    ? character.heroName.trim()
    : "";
  const valid = value.length >= 3 && value.length <= 20 &&
    !/[\u0000-\u001f\u007f]/.test(value);

  return {
    assigned: valid && (
      character?.heroNameLocked === true ||
      value !== fallback
    ),
    name: valid ? value : fallback
  };
}

function requireCharacterSession(classId) {
  if (!["knight", "mage"].includes(classId)) {
    throw new Error("Klasse nicht verfügbar.");
  }
  const user = auth.currentUser;
  if (!user || characterLoadedUid !== user.uid || !currentProfile) {
    throw new Error("Bitte zuerst das Charakterprofil laden.");
  }
  return user;
}

function syncHeroIdentity(classId, data, user) {
  if (auth.currentUser?.uid !== user.uid) {
    throw new Error("Account wurde während der Aktion geändert.");
  }

  currentProfile.characters ||= {};
  const target = currentProfile.characters[classId] ||= data;

  if (typeof data.heroName === "string") {
    target.heroName = data.heroName;
  } else {
    delete target.heroName;
  }

  if (typeof data.heroNameLocked === "boolean") {
    target.heroNameLocked = data.heroNameLocked;
  } else {
    delete target.heroNameLocked;
  }

  if (activeCharacterId === classId) {
    hero.name = heroNameState(data, classId).name;
    ui();
  }
  updateAccountUI();
}

window.refreshHeroNames = async function() {
  const user = auth.currentUser;
  if (!user || characterLoadedUid !== user.uid || !currentProfile) {
    throw new Error("Charakterprofil ist noch nicht geladen.");
  }

  const snapshot = await db.ref(
    "users/" + user.uid + "/characters"
  ).get();

  if (auth.currentUser?.uid !== user.uid) {
    throw new Error("Account wurde geändert.");
  }

  const data = snapshot.val() || {};
  for (const id of ["knight", "mage"]) {
    if (data[id]) syncHeroIdentity(id, data[id], user);
  }
};

window.setHeroName = async function(classId, value) {
  const user = requireCharacterSession(classId);
  const name = String(value || "").trim();

  if (
    name.length < 3 ||
    name.length > 20 ||
    /[\u0000-\u001f\u007f]/.test(name)
  ) {
    throw new Error(
      "Bitte 3–20 Zeichen ohne Steuerzeichen eingeben."
    );
  }

  if (
    active ||
    characterSaveBusy ||
    window.inkfallMode === "lobby"
  ) {
    throw new Error("Namensvergabe ist gerade gesperrt.");
  }

  const reference = db.ref(
    "users/" + user.uid + "/characters/" + classId
  );
  let listener;
  characterSaveBusy = true;

  try {
    // Listener hält die Accountdaten während der Transaktion im Cache.
    await new Promise((resolve, reject) => {
      listener = snapshot => resolve(snapshot);
      reference.on("value", listener, reject);
    });

    const result = await reference.transaction(current => {
      if (auth.currentUser?.uid !== user.uid) return;

      const data = current || freshCharacter(classId);
      if (heroNameState(data, classId).assigned) return;

      return {
        ...data,
        heroName: name,
        heroNameLocked: true
      };
    }, undefined, false);

    if (auth.currentUser?.uid !== user.uid) {
      throw new Error("Account wurde geändert.");
    }

    const saved = result.snapshot.val();
    if (!saved) {
      throw new Error("Charakter konnte nicht gespeichert werden.");
    }

    syncHeroIdentity(classId, saved, user);

    if (!result.committed && saved.heroName !== name) {
      throw new Error(
        "Name bereits vergeben. Nur ein vollständiger " +
        "Charakter-Reset erlaubt einen neuen Namen."
      );
    }

    if (!heroNameState(saved, classId).assigned) {
      throw new Error("Namensvergabe wurde nicht bestätigt.");
    }

    return saved.heroName;
  } catch (error) {
    const denied = String(error.code || "")
      .toLowerCase().includes("permission");

    throw new Error(
      (denied
        ? "Firebase lehnt die Namensspeicherung ab. " +
          "Bitte die aktualisierten Datenbankregeln veröffentlichen. "
        : "") +
      error.message
    );
  } finally {
    if (listener) reference.off("value", listener);
    characterSaveBusy = false;
  }
};

window.selectSoloCharacter = async function(classId) {
  if (!["knight", "mage"].includes(classId)) {
    throw new Error("Diese Klasse ist noch nicht implementiert.");
  }

  const user = auth.currentUser;
  if (!user) throw new Error("Bitte zuerst anmelden.");

  await loadGame();

  if (activeCharacterId !== classId) {
    if (active) {
      throw new Error("Klassenwechsel erst nach Abschluss der laufenden Welle.");
    }

    if (window.inkfallMode === "single") {
      const saved = await saveGame();
      if (!saved) throw new Error("Vorheriger Charakter konnte nicht gespeichert werden.");
    }

    const reference = db.ref(
      "users/" + user.uid + "/characters/" + classId
    );

    const result = await reference.transaction(current =>
      current || freshCharacter(classId)
    , undefined, false);

    const character = result.snapshot.val();
    decodeCharacter(classId, character);

    await db.ref("users/" + user.uid + "/selectedClass").set(classId);

    if (auth.currentUser?.uid !== user.uid) {
      throw new Error("Account wurde während der Auswahl geändert.");
    }

    applyCharacter(classId, character);
    currentProfile.characters[classId] = character;
    currentProfile.selectedClass = classId;
  }

  window.inkfallMode = "single";
  updateAccountUI();
};

async function logout() {
  if (active && window.inkfallMode === "single") {
    throw new Error("Bitte zuerst die laufende Welle abschließen.");
  }

  if (window.inkfallMode === "single" && characterLoadedUid) {
    if (!await saveGame()) {
      throw new Error("Abmeldung abgebrochen: Speichern fehlgeschlagen.");
    }
  }

  await auth.signOut();
}

async function testDatabase() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const reference = db.ref("users/" + user.uid + "/diagnostic");
    await reference.set({
      test: true,
      time: firebase.database.ServerValue.TIMESTAMP
    });
    await reference.get();
    logFb("Datenbank-Test erfolgreich.");
  } catch (error) {
    fbError(error);
    throw error;
  }
}

db.ref(".info/connected").on("value", snapshot => {
  dbConnected = snapshot.val() === true;
});

auth.onAuthStateChanged(user => {
  currentUser = user;

  if (!user) {
    characterLoadedUid = null;
    activeCharacterId = null;
    currentProfile = null;
    window.inkfallMode = "menu";
  }

  updateAccountUI();
});
