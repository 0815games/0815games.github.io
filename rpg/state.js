// [2026-10-12 08:13] - js/core/state.js: Zentraler Spielzustand
// Änderungen:
// - inputLocked-Attribut eingeführt: Verhindert Bewegung bei geöffneten Menüs (To-Do-Vorgabe).
// - Ausrüstungsslots (Waffe, Rüstung) direkt im Spielerstatus abgebildet.

export const state = {
  isInputLocked: false,
  inCombat: false,
  activeMonster: null,

  player: {
    x: 1,
    y: 1,
    level: 1,
    hp: 50,
    maxHp: 50,
    baseAtk: 6,
    baseDef: 1,
    gold: 20,
    exp: 0,
    equipped: {
      weapon: null,
      armor: null
    },
    inventory: [
      { itemId: 'stimpack', count: 2 },
      { itemId: 'pipe_pistol', count: 1 }
    ]
  },

  activeZone: {
    width: 15,
    height: 15,
    walls: [],
    monsters: []
  }
};
