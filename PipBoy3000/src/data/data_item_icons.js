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
  'buffout',
  'jet',
  'nuka_cola',
  'nuka_quantum',
  'pistol_10mm',
  'power_armor',
  'radaway',
  'radx',
  'stealth_boy',
  'stimpack'
];
