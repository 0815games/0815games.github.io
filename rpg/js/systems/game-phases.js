// S03a – Spielphasen und Übergänge
// Die Phase ist ein Laufzeitwert und wird nicht im Spielstand gespeichert.
export const PHASES = {
  MENU: 'menu',
  EXPLORE: 'explore',
  COMBAT: 'combat',
  REWARD: 'reward',
  DEATH: 'death',
  PREPARATION: 'preparation',
  FLOOR_TRANSITION: 'floor_transition'
};

export const PHASE_TRANSITIONS = {
  menu: ['explore'],
  explore: ['combat', 'floor_transition', 'death'],
  combat: ['reward', 'death', 'explore'],
  reward: ['explore', 'preparation', 'floor_transition'],
  death: ['preparation', 'menu'],
  preparation: ['explore'],
  floor_transition: ['explore']
};

export function canTransition(from, to) {
  return Boolean(PHASE_TRANSITIONS[from]?.includes(to));
}

export function createPhaseController(initial = PHASES.MENU) {
  if (!Object.values(PHASES).includes(initial)) {
    throw new TypeError(`Unbekannte Startphase: ${initial}`);
  }
  let current = initial;
  return {
    get current() {
      return current;
    },
    is(phase) {
      return current === phase;
    },
    can(phase) {
      return canTransition(current, phase);
    },
    transition(phase) {
      if (!canTransition(current, phase)) {
        throw new Error(`Ungültiger Phasenübergang: ${current} → ${phase}`);
      }
      current = phase;
      return current;
    }
  };
}
