// 3D-Karten-Dekoration: Wandbehänge, Schilder an Wänden und das Licht der
// Tor-Kacheln. Steht der 2D-Wanddekoration (wall-decor.js) entspricht, wird aber
// als dreidimensionales Element an die Wand gebaut.
//
// reine Geometrie-/Texture-Erstellung – kein Three.js-Import, damit das Modul
// ohne WebGL in Tests geladen werden kann.

export const WALL_DECOR_COLORS = Object.freeze({
 katakomben: ['#634354', '#999181'],
 pilzwald: ['#415e43', '#a1b77c'],
 frostgruft: ['#55768d', '#bfdce7'],
 feuerschrein: ['#8a4736', '#c4a477'],
 schattenarena: ['#635075', '#c0a6d9']
});

export function decorNoise(x, y, seed = 0) {
 let v = (Math.imul(x + 1, 374761393)
  ^ Math.imul(y + 1, 668265263) ^ (seed | 0)) >>> 0;
 v = Math.imul(v ^ (v >>> 13), 1274126177) >>> 0;
 return (v ^ (v >>> 16)) >>> 0;
}

// Eine Wand-Kachel (type 1) trägt Dekoration, wenn sie eine Nordwand ist:
// drei nebeneinanderliegende Wand-Kacheln mit freiem Boden südlich davon.
export function wallDecorSite(tiles, x, y) {
 if (!tiles[y] || !tiles[y + 1]) return false;
 return [-1, 0, 1].every(
  dx => tiles[y]?.[x + dx] === 1 && tiles[y + 1]?.[x + dx] === 0
 );
}

// Standorte der Wanddekoration für eine Karte. Reine Funktion, damit sie
// deterministisch und ohne DOM testbar ist.
export function wallDecorSites(tiles, seed = 0) {
 const result = [];
 for (let y = 1; y < tiles.length - 1; y++) {
  for (let x = 4; x < (tiles[y]?.length || 0) - 2; x += 4) {
   const n = decorNoise(x, y, seed);
   if (n % 3 !== 0 || n % 9 === 0) continue;
   if (wallDecorSite(tiles, x, y)) {
    result.push({ x, y, kind: (n >>> 8) % 2 });
   }
  }
 }
 return result;
}

function paintStamp(context, theme, kind) {
 const [cloth, trim] = WALL_DECOR_COLORS[
  Object.hasOwn(WALL_DECOR_COLORS, theme) ? theme : 'katakomben'
 ];
 const rect = (x, y, w, h, color) => {
  context.fillStyle = color;
  context.fillRect(x, y, w, h);
 };

 context.clearRect(0, 0, 32, 32);

 if (kind === 0) {
  // Banner: Stoff mit øverster Bühne und Träger.
  rect(7, 4, 19, 2, '#171720');
  rect(8, 4, 17, 1, trim);
  context.beginPath();
  context.moveTo(10, 7);
  context.lineTo(22, 7);
  context.lineTo(22, 25);
  context.lineTo(18, 22);
  context.lineTo(16, 27);
  context.lineTo(13, 24);
  context.lineTo(10, 26);
  context.closePath();
  context.fillStyle = cloth;
  context.fill();
  rect(10, 7, 1, 16, '#c7bb9d35');
  rect(20, 8, 2, 14, '#080b123d');
  rect(15, 11, 2, 8, trim);
  rect(12, 13, 8, 2, trim);
 } else {
  // Schild: quadratisches Schild mit Rippe und Untergurt.
  rect(6, 7, 20, 22, '#080a1248');
  rect(7, 6, 18, 21, '#676a76');
  rect(9, 8, 14, 16, '#181d2b');
  rect(8, 6, 16, 2, trim);
  context.beginPath();
  context.moveTo(16, 10);
  context.lineTo(21, 16);
  context.lineTo(16, 22);
  context.lineTo(11, 16);
  context.closePath();
  context.strokeStyle = trim;
  context.lineWidth = 1;
  context.stroke();
  rect(8, 25, 16, 2, '#94939a');
 }
}

// CanvasTextures für Banner und Schild. Der Hintergrund bleibt transparent,
// die Ebene an der Wand zeigt nur das Motiv. Index 0 = Banner, 1 = Schild.
export function createWallDecorTextures(T, theme) {
 const stamps = [];
 for (const kind of [0, 1]) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 32;
  const context = cv.getContext('2d');
  paintStamp(context, theme, kind);
  const texture = new T.CanvasTexture(cv);
  texture.colorSpace = T.SRGBColorSpace;
  texture.magFilter = T.NearestFilter;
  texture.minFilter = T.LinearFilter;
  texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
  stamps[kind] = texture;
 }
 return stamps;
}

// Radial-Glühen für Tor-Kacheln (Tile 2). In der 2D-Karte ist jede Tor-Kachel
// eine Lichtquelle; in 3D wird das als leuchtender Sprite dargestellt.
export function createGlowTexture(T) {
 const cv = document.createElement('canvas');
 cv.width = cv.height = 128;
 const context = cv.getContext('2d');
 const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
 gradient.addColorStop(0, '#ffffffcc');
 gradient.addColorStop(.28, '#ffffff55');
 gradient.addColorStop(1, '#ffffff00');
 context.fillStyle = gradient;
 context.fillRect(0, 0, 128, 128);

 const texture = new T.CanvasTexture(cv);
 texture.colorSpace = T.SRGBColorSpace;
 texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
 return texture;
}

// Vignette: dunkler Rand, transparentes Zentrum. Als Kamera-following Sprite
// über der Bühne geschaltet – entspricht der 2D-Vignette.
export function createVignetteTexture(T) {
 const cv = document.createElement('canvas');
 cv.width = cv.height = 256;
 const context = cv.getContext('2d');
 const center = 128;
 const gradient = context.createRadialGradient(
  center, center, Math.min(cv.width, cv.height) * .2,
  center, center, Math.hypot(cv.width, cv.height) * .55
 );
 gradient.addColorStop(0, '#02091200');
 gradient.addColorStop(.55, '#02091200');
 gradient.addColorStop(1, '#02091240');
 context.fillStyle = gradient;
 context.fillRect(0, 0, 256, 256);

 const texture = new T.CanvasTexture(cv);
 texture.colorSpace = T.SRGBColorSpace;
 texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
 return texture;
}
