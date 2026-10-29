// v0.3.8 – Skilltree-System

export const SKILL_TREE = {
  vitality: {
    name: 'Vitalität',
    icon: '❤️',
    branch: 'Krieg',
    maxRank: 3,
    req: [],
    desc: '+12 max. TP pro Rang.',
    apply(state) {
      state.player.maxHp += 12;
      state.player.hp += 12;
    }
  },
  weapon_master: {
    name: 'Waffenmeister',
    icon: '⚔️',
    branch: 'Krieg',
    maxRank: 3,
    req: [],
    desc: '+2 ATK pro Rang.',
    apply(state) {
      state.player.atk += 2;
    }
  },
  shield_wall: {
    name: 'Schildwall',
    icon: '🛡️',
    branch: 'Krieg',
    maxRank: 3,
    req: [],
    desc: '+1 DEF pro Rang.',
    apply(state) {
      state.player.def += 1;
    }
  },
  bloodlust: {
    name: 'Blutrausch',
    icon: '🩸',
    branch: 'Krieg',
    maxRank: 1,
    req: ['weapon_master:3'],
    desc: 'Nach einem Sieg 5% max. TP heilen.'
  },
  arcane_flow: {
    name: 'Arkanfluss',
    icon: '🔮',
    branch: 'Arkan',
    maxRank: 3,
    req: [],
    desc: '+6 max. MP pro Rang.',
    apply(state) {
      state.player.maxMp += 6;
      state.player.mp += 6;
    }
  },
  fire_master: {
    name: 'Feuermeister',
    icon: '🔥',
    branch: 'Arkan',
    maxRank: 3,
    req: [],
    desc: '+12% Feuerschaden pro Rang.'
  },
  healing_lore: {
    name: 'Heilkunde',
    icon: '🧪',
    branch: 'Arkan',
    maxRank: 2,
    req: [],
    desc: '+20% Heilung durch Tränke pro Rang.'
  },
  arcane_return: {
    name: 'Arkanwiederkehr',
    icon: '♻️',
    branch: 'Arkan',
    maxRank: 1,
    req: ['arcane_flow:3'],
    desc: 'Nach jedem Kampf +3 MP.'
  },
  shadowstep: {
    name: 'Schattenlauf',
    icon: '🌑',
    branch: 'Schatten',
    maxRank: 3,
    req: [],
    desc: '+4% Ausweichchance pro Rang.'
  },
  precision: {
    name: 'Präzision',
    icon: '🎯',
    branch: 'Schatten',
    maxRank: 3,
    req: [],
    desc: '+5% Kritische Treffer pro Rang.'
  },
  gold_luck: {
    name: 'Goldglück',
    icon: '🪙',
    branch: 'Schatten',
    maxRank: 3,
    req: [],
    desc: '+10% Gold aus Kämpfen pro Rang.'
  },
  master_thief: {
    name: 'Meisterdieb',
    icon: '💰',
    branch: 'Schatten',
    maxRank: 1,
    req: ['gold_luck:3'],
    desc: '+25% Gold aus Truhen.'
  }
};

export function getSkillRank(state, id) {
  return state.player.skillTree?.[id] || 0;
}

export function getSkillPoints(state) {
  return state.player.skillPoints || 0;
}

export function canLearnSkill(state, id) {
  const node = SKILL_TREE[id];

  if (!node) return false;

  const rank = getSkillRank(state, id);

  if (rank >= node.maxRank) return false;
  if (getSkillPoints(state) < 1) return false;

  for (const req of node.req) {
    const [reqId, reqRank] = req.split(':');

    if (getSkillRank(state, reqId) < Number(reqRank)) {
      return false;
    }
  }

  return true;
}

export function learnSkill(state, id) {
  if (!canLearnSkill(state, id)) return false;

  state.player.skillPoints -= 1;
  state.player.skillTree[id] = (state.player.skillTree[id] || 0) + 1;

  SKILL_TREE[id].apply?.(state);

  return true;
}
