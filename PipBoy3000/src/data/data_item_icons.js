// Welche Items haben ein Bild? (erzeugt von tools/icons.mjs)
//
// Die Dateien selbst liegen in img/items/<id>.png. Diese Tabelle entsteht beim
// Aufbereiten aus dem Dateibestand - sie kann deshalb nicht auseinanderlaufen
// mit dem, was wirklich da ist. Wer ein Bild hinzufuegt, fuehrt
// `node tools/icons.mjs` aus und committet diese Datei mit.
//
// Bewusst eine Liste und keine Pruefung zur Laufzeit: ein HTTP-Kopf pro Item
// waere bei 32 Icons im Inventar zu teuer, und ein 404 im Netz ist im
// Pip-Boy-Design ein sichtbarer Fehler.
if (typeof window.GameData === 'undefined') window.GameData = {};

window.GameData.itemBilder = [
  'ammo_10mm',
  'ammo_micro',
  'ammo_shell',
  'assault_rifle',
  'baseball_bat',
  'bat_alum',
  'bat_spiked',
  'buffout',
  'combat_shotgun',
  'jet',
  'knife',
  'knuckles',
  'laser_pistol',
  'laser_rifle',
  'machete',
  'minigun',
  'nuka_cola',
  'nuka_quantum',
  'pipe_wrench',
  'pistol_10mm',
  'plasma_pistol',
  'plasma_rifle',
  'police_baton',
  'power_armor',
  'radaway',
  'radx',
  'revolver_44',
  'rolling_pin',
  'shotgun',
  'smg',
  'stealth_boy',
  'stimpack',
  'switchblade'
];
