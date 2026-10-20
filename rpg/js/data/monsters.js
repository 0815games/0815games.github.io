// v0.4.11 – Monsterdaten und Spawn-Gewichte
export const MONSTERS = {
  rat: { name: 'Gruft-Ratte', hp: 12, atk: 4, def: 0, xp: 8, gold: 4, color: '#8d6e63', weight: 10, minDepth: 1, shape: 'rat' },
  bat: { name: 'Höhlenfledermaus', hp: 14, atk: 5, def: 0, xp: 10, gold: 5, color: '#7e57c2', weight: 8, minDepth: 1, shape: 'bat' },
  slime: { name: 'Schleimklumpen', hp: 20, atk: 4, def: 2, xp: 12, gold: 6, color: '#26c6da', weight: 8, minDepth: 1, shape: 'slime' },
  spider: { name: 'Katakomben-Spinne', hp: 18, atk: 6, def: 1, xp: 14, gold: 7, color: '#4e342e', weight: 7, minDepth: 2, shape: 'spider' },
  goblin: { name: 'Goblin-Plünderer', hp: 22, atk: 6, def: 1, xp: 20, gold: 10, color: '#43a047', weight: 9, minDepth: 1, shape: 'goblin' },
  skeleton: { name: 'Skelettkrieger', hp: 38, atk: 10, def: 3, xp: 40, gold: 20, color: '#cfd8dc', weight: 8, minDepth: 1, shape: 'skeleton' },
  zombie: { name: 'Fauliger Wanderer', hp: 45, atk: 8, def: 2, xp: 35, gold: 15, color: '#7cb342', weight: 7, minDepth: 3, shape: 'zombie' },
  wraith: { name: 'Schattenwraith', hp: 30, atk: 12, def: 1, xp: 45, gold: 25, color: '#5c6bc0', weight: 6, minDepth: 4, shape: 'wraith' },
  imp: { name: 'Feuerimp', hp: 28, atk: 14, def: 2, xp: 50, gold: 30, color: '#ff7043', weight: 6, minDepth: 5, shape: 'imp' },
  golem: { name: 'Runengolem', hp: 70, atk: 12, def: 7, xp: 70, gold: 40, color: '#78909c', weight: 5, minDepth: 6, shape: 'golem' },
  demon: { name: 'Abgrunddämon', hp: 60, atk: 18, def: 5, xp: 90, gold: 55, color: '#d32f2f', weight: 4, minDepth: 8, shape: 'demon' },
  lord: { name: 'Dunkler Gruftfürst', hp: 65, atk: 15, def: 5, xp: 95, gold: 55, color: '#ab47bc', weight: 0, minDepth: 5, shape: 'lord' }
};

// Weitere Gegner für unterschiedliche Tiefen und Rollen.
Object.assign(MONSTERS, {
 bone_servant: {
  name:'Knochenknecht', hp:36, atk:11, def:3, xp:22, gold:10,
  color:'#b7b0a2', weight:7, minDepth:2, shape:'skeleton'
 },
 spore_carrier: {
  name:'Pilzträger', hp:55, atk:9, def:1, xp:28, gold:12,
  color:'#bd79a8', weight:7, minDepth:3, shape:'zombie'
 },
 crypt_raider: {
  name:'Gruftplünderer', hp:32, atk:16, def:1, xp:32, gold:18,
  color:'#b1a65b', weight:6, minDepth:4, shape:'goblin'
 },
 frost_guard: {
  name:'Frostwache', hp:52, atk:12, def:6, xp:42, gold:21,
  color:'#a7dbe8', weight:6, minDepth:5, shape:'golem'
 },
 ash_cultist: {
  name:'Aschenkultist', hp:33, atk:19, def:1, xp:45, gold:24,
  color:'#ed9b64', weight:6, minDepth:6, shape:'wraith'
 },
 blood_ghoul: {
  name:'Blutghul', hp:68, atk:17, def:3, xp:58, gold:29,
  color:'#a54d64', weight:5, minDepth:8, shape:'zombie'
 },
 obsidian_guard: {
  name:'Obsidianwächter', hp:90, atk:17, def:9, xp:75, gold:38,
  color:'#665b79', weight:5, minDepth:10, shape:'golem'
 },
 night_hunter: {
  name:'Nachtjäger', hp:48, atk:25, def:3, xp:80, gold:42,
  color:'#8370c4', weight:5, minDepth:12, shape:'wraith'
 }
});
