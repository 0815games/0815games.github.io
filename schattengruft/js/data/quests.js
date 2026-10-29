// [2026-10-12 18:55] - js/data/quests.js: v0.0.9 Ordens-Quests
export const QUEST_DATABASE = {
  q_goblin_slayer: {
    id: 'q_goblin_slayer',
    title: 'Schatten im Gemäuer',
    desc: 'Vernichte 2 Goblin-Plünderer in den Katakomben.',
    type: 'kill',
    targetId: 'goblin',
    targetCount: 2,
    rewardCaps: 30,
    rewardExp: 35,
    rewardItem: 'health_potion',
    rewardCount: 2
  },
  q_visit_alchemist: {
    id: 'q_visit_alchemist',
    title: 'Der Alchemist der Tiefe',
    desc: 'Suche den weisen Meister Eldrin an seinem Alchemiestand bei [X:3, Y:4] auf.',
    type: 'visit_trader',
    targetCount: 1,
    rewardCaps: 25,
    rewardExp: 30,
    rewardItem: 'mana_potion',
    rewardCount: 2
  },
  q_collect_shards: {
    id: 'q_collect_shards',
    title: 'Seelensplitter-Ernte',
    desc: 'Sammle 3 Schattensplitter von besiegten Untoten oder aus alten Truhen.',
    type: 'collect',
    targetId: 'soul_shard',
    targetCount: 3,
    rewardCaps: 45,
    rewardExp: 55,
    rewardItem: 'chainmail',
    rewardCount: 1
  },
  q_banish_crypt_lord: {
    id: 'q_banish_crypt_lord',
    title: 'Das Ende des Gruftfürsten',
    desc: 'Dringe in die finstere Grabkammer im Südosten vor und banne den Dunklen Gruftfürsten.',
    type: 'kill',
    targetId: 'crypt_lord',
    targetCount: 1,
    rewardCaps: 80,
    rewardExp: 110,
    rewardItem: 'knight_armor',
    rewardCount: 1
  }
};
