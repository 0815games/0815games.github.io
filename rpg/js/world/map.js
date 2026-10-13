// v0.3.7 – Abwechslungsreiches Level-Design mit größeren, bewegbaren Ebenen
import { state } from '../core/state.js';
import { MONSTERS } from '../data/monsters.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const THEMES = [
  {
    name: 'katakomben',
    cols: 42,
    rows: 30,
    enemies: ['skeleton', 'goblin']
  },
  {
    name: 'pilzwald',
    cols: 46,
    rows: 32,
    enemies: ['goblin', 'skeleton']
  },
  {
    name: 'frostgruft',
    cols: 40,
    rows: 30,
    enemies: ['skeleton', 'goblin']
  },
  {
    name: 'feuershrein',
    cols: 44,
    rows: 31,
    enemies: ['goblin', 'skeleton']
  },
  {
    name: 'schattenarena',
    cols: 36,
    rows: 28,
    enemies: ['skeleton', 'goblin']
  }
];

export class WorldMap {
  constructor() {
    this.cols = 42;
    this.rows = 30;
  }

  ensureValid() {
    const cols = state.world.cols || this.cols;
    const rows = state.world.rows || this.rows;

    if (!Array.isArray(state.world.tiles) || state.world.tiles.length !== rows) {
      this.generate(state.world.depth || 1);
      return;
    }

    if (!Array.isArray(state.world.discovered) || state.world.discovered.length !== rows) {
      state.world.discovered = Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    for (let y = 0; y < rows; y++) {
      if (!Array.isArray(state.world.discovered[y]) || state.world.discovered[y].length !== cols) {
        state.world.discovered[y] = Array(cols).fill(false);
      }
    }

    if (state.world.stairs && this.isWall(state.world.stairs.x, state.world.stairs.y)) {
      state.world.stairs = this.getSafeSpot(state.world.stairs.x, state.world.stairs.y);
    }

    if (this.isWall(state.player.x, state.player.y)) {
      const safe = this.getSafeSpot(state.player.x, state.player.y);
      state.player.x = safe.x;
      state.player.y = safe.y;
    }

    this.reveal();
  }

  generate(depth = 1) {
    const theme = THEMES[(depth - 1) % THEMES.length];
    const seed = (depth * 7919) + Math.floor(Math.random() * 100000);
    const rnd = mulberry32(seed);

    this.cols = theme.cols;
    this.rows = theme.rows;

    state.world.depth = depth;
    state.world.cols = this.cols;
    state.world.rows = this.rows;
    state.world.theme = theme.name;
    state.world.seed = seed;
    state.world.tiles = [];
    state.world.discovered = [];
    state.world.chests = [];
    state.world.monsters = [];
    state.world.stairs = null;
    state.world.sealBroken = false;
    state.world.isBossFloor = depth % 5 === 0;

    for (let y = 0; y < this.rows; y++) {
      const row = [];
      const seen = [];

      for (let x = 0; x < this.cols; x++) {
        row.push(1);
        seen.push(false);
      }

      state.world.tiles.push(row);
      state.world.discovered.push(seen);
    }

    const rooms = [];
    const roomCount = 12 + Math.floor(rnd() * 6);

    for (let attempt = 0; attempt < roomCount * 6 && rooms.length < roomCount; attempt++) {
      const w = 5 + Math.floor(rnd() * 8);
      const h = 4 + Math.floor(rnd() * 7);
      const x = 2 + Math.floor(rnd() * (this.cols - w - 4));
      const y = 2 + Math.floor(rnd() * (this.rows - h - 4));

      const overlaps = rooms.some((r) => (
        x < r.x + r.w + 2 &&
        x + w + 2 > r.x &&
        y < r.y + r.h + 2 &&
        y + h + 2 > r.y
      ));

      if (overlaps) continue;

      const room = {
        x,
        y,
        w,
        h,
        cx: Math.floor(x + w / 2),
        cy: y + Math.floor(h / 2)
      };

      for (let ry = y; y + h > 0 && y + h > 0, 0; 0);

      for (let cy = y; cy < y + h; cy++) {
        for (let cx = x; cx < x + w; cx++) {
          state.world.tiles[cy][cx] = 0;
        }
      }

      if (rooms.length) {
        const prev = rooms[rooms.length - 1];
        this.carveCorridor(prev.cx, prev.cy, room.cx, room.cy, rnd);
      }

      if (rnd() < 0.55) {
        const px = room.x + 1;
        const py = room.y + 1;
        if (this.inBounds(px, py)) state.world.tiles[py][px] = 2;

        const px2 = room.x + room.w - 2;
        const py2 = room.y + room.h - 2;
        if (this.inBounds(px2, py2)) state.world.tiles[py2][px2] = 2;
      }

      rooms.push(room);
    }

    if (rooms.length < 4) {
      for (let i = 0; i < 5; i++) {
        const x = 3 + i * 7;
        const y = 4 + (i % 2) * 9;
        const room = { x, y, w: 7, h: 6, cx: x + 3, cy: y + 3 };

        for (let cy = y; cy < y + room.h; cy++) {
          for (let cx = x; cx < x + room.w; cx++) {
            state.world.tiles[cy][cx] = 0;
          }
        }

        if (rooms.length) {
          const prev = rooms[rooms.length - 1];
          this.carveCorridor(prev.cx, prev.cy, room.cx, room.cy, rnd);
        }

        rooms.push(room);
      }
    }

    const start = rooms[0];
    state.player.x = start.cx;
    state.player.y = start.cy;

    const safe = this.getSafeSpot.bind(this);
    const scale = 1 + (depth - 1) * 0.22;

    const chestRooms = rooms.slice(1);
    const chestCount = Math.min(chestRooms.length, 3 + Math.floor(rnd() * 3));

    for (let i = 0; i < chestCount; i++) {
      const room = chestRooms[Math.floor(rnd() * chestRooms.length)];
      const spot = safe(
        room.x + 1 + Math.floor(rnd() * Math.max(1, room.w - 2)),
        room.y + 1 + Math.floor(rnd() * Math.max(1, room.h - 2))
      );

      const loot = i === 0
        ? (depth > 1 ? 'runic_blade' : 'iron_sword')
        : i === 1
          ? (depth > 1 ? 'knight_armor' : 'chainmail')
          : 'health_potion';

      state.world.chests.push({
        id: `chest_${depth}_${i}`,
        ...spot,
        caps: 20 + depth * 10 + Math.floor(rnd() * 15),
        item: loot,
        open: false
      });
    }

    if (state.world.isBossFloor) {
      const bossScale = 1 + (depth - 1) * 0.38;
      const bossRoom = rooms[rooms.length - 1];
      const boss = safe(bossRoom.cx, bossRoom.cy);

      state.world.monsters = [
        {
          id: 'boss',
          key: 'lord',
          name: `Schattenfürst der Tiefe ${depth}`,
          color: '#9c27b0',
          gold: Math.round(140 * bossScale),
          xp: Math.round(200 * bossScale),
          ...boss,
          hp: Math.round(160 * bossScale),
          maxHp: Math.round(160 * bossScale),
          atk: Math.round(22 * bossScale),
          def: Math.round(9 * bossScale)
        }
      ];
    } else {
      const enemyTypes = theme.enemies;
      const enemyCount = Math.min(14, 6 + Math.floor(depth * 0.8));
      const monsterRooms = rooms.slice(1);

      for (let i = 0; i < enemyCount; i++) {
        const room = monsterRooms[Math.floor(rnd() * monsterRooms.length)] || start;
        const key = enemyTypes[i % enemyTypes.length];
        const spot = safe(
          room.x + 1 + Math.floor(rnd() * Math.max(1, room.w - 2)),
          room.y + 1 + Math.floor(rnd() * Math.max(1, room.h - 2))
        );

        const base = MONSTERS[key];
        state.world.monsters.push({
          id: `enemy_${depth}_${i}`,
          key,
          ...base,
          ...spot,
          hp: Math.round(base.hp * scale),
          maxHp: Math.round(base.hp * scale),
          atk: Math.round(base.atk * scale)
        });
      }
    }

    this.reveal();
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
  }

  carveCorridor(x1, y1, x2, y2, rnd) {
    let x = x1;
    let y = y1;

    if (rnd() < 0.5) {
      while (x !== x2) {
        x += x < x2 ? 1 : -1;
        if (this.inBounds(x, y)) state.world.tiles[y][x] = 0;
      }

      while (y !== y2) {
        y += y < y2 ? 1 : -1;
        if (this.inBounds(x, y)) state.world.tiles[y][x] = 0;
      }
    } else {
      while (y !== y2) {
        y += y < y2 ? 1 : -1;
        if (this.inBounds(x, y)) state.world.tiles[y][x] = 0;
      }

      while (x !== x2) {
        x += x < x2 ? 1 : -1;
        if (this.inBounds(x, y)) state.world.tiles[y][x] = 0;
      }
    }
  }

  isWall(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return true;

    const cols = state.world.cols || this.cols;
    const rows = state.world.rows || this.rows;

    if (x <= 0 || y <= 0 || x >= cols - 1 || y >= rows - 1) return true;

    return (state.world.tiles[y]?.[x] || 0) > 0;
  }

  getSafeSpot(x, y) {
    if (!this.isWall(x, y)) return { x, y };

    for (let r = 1; r < 12; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (!this.isWall(x + dx, y + dy)) {
            return { x: x + dx, y: y + dy };
          }
        }
      }
    }

    return { x: 2, y: 2 };
  }

  spawnStairsAfterClear() {
    if (state.world.stairs) return state.world.stairs;

    const cols = state.world.cols || this.cols;
    const rows = state.world.rows || this.rows;
    const freeTiles = [];

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (this.isWall(x, y)) continue;
        if (state.player.x === x && state.player.y === y) continue;
        if (state.world.chests.some((c) => c.x === x && c.y === y)) continue;
        if (state.world.monsters.some((m) => m.x === x && m.y === y)) continue;

        freeTiles.push({ x, y });
      }
    }

    const spot = freeTiles.length
      ? freeTiles[Math.floor(Math.random() * freeTiles.length)]
      : this.getSafeSpot(Math.floor(cols / 2), Math.floor(rows / 2));

    state.world.stairs = { x: spot.x, y: spot.y };
    state.world.sealBroken = true;
    this.reveal();

    return state.world.stairs;
  }

  reveal() {
    const cols = state.world.cols || this.cols;
    const rows = state.world.rows || this.rows;

    if (!Array.isArray(state.world.discovered) || state.world.discovered.length !== rows) {
      state.world.discovered = Array.from({ length: rows }, () => Array(cols).fill(false));
    }

    const px = Number.isFinite(state.player.x) ? state.player.x : 2;
    const py = Number.isFinite(state.player.y) ? state.player.y : 2;

    for (let y = 0; y < rows; y++) {
      if (!Array.isArray(state.world.discovered[y])) {
        state.world.discovered[y] = Array(cols).fill(false);
      }

      for (let x = 0; x < cols; x++) {
        if (Math.hypot(x - px, y - py) <= 4.5) {
          state.world.discovered[y][x] = true;
        }
      }
    }
  }
}
