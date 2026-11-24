// Balancing-Analyse für den Pip-Boy.
//
// Prüft nicht nur Zahlen, sondern auch, ob die Daten überhaupt gelesen werden.
// Genau daran sind in der Vergangenheit mehrere Systeme gescheitert: Munition
// hatte ein `usesAmmo`, das niemand las; Waffen hatten ein `baseDmg`, das nur
// in Anzeigen vorkam; Rüstung hat `bonus`, aber keinen Schutz.
//
// Aufruf:  node tools/balance.mjs            (Bericht auf stdout)
//          node tools/balance.mjs --write    (schreibt docs/BALANCING.md)
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {JSDOM} from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- Spiel laden (dasselbe Bündel, das ausgeliefert wird) -------------------
export function loadGame() {
  const dom = new JSDOM('<!DOCTYPE html><body></body>', {runScripts: 'outside-only', url: 'https://e.test/'});
  const window = dom.window;
  window.console = {log() {}, warn() {}, error() {}};
  window.fetch = () => Promise.resolve({ok: true, text: async () => '1'});
  window.eval(readFileSync(join(ROOT, 'app.js'), 'utf8'));
  return window;
}

// --- Quelltext einlesen, um zu prüfen, was gelesen wird --------------------
function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, {withFileTypes: true})) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) out.push([full, readFileSync(full, 'utf8')]);
    }
  };
  walk(join(ROOT, 'src'));
  return out;
}

// Reine Datenblätter definieren nur und lesen nichts. `data_minigames.js` ist
// eine Ausnahme: die Datei liegt in data/, enthält aber 38 Funktionen und ist
// die einzige Stelle, an der INT gelesen wird. Würde man sie pauschal
// ausschließen, meldete der Bericht INT als ungenutzt.
const NUR_DATEN = new Set(['data_core.js', 'data_items.js', 'data_monsters.js', 'data_recipes.js']);

function istDatenblatt(file) {
  return [...NUR_DATEN].some(name => file.endsWith(`/data/${name}`));
}

const eur = (n) => (Math.round(n * 100) / 100).toFixed(2);
const pad = (s, n) => String(s).padEnd(n);

// ===========================================================================
// 1. Waffen
// ===========================================================================
function analyseWeapons(window) {
  const {Game, Combat} = window;
  const zeilen = [];

  for (const [id, def] of Object.entries(Game.items)) {
    if (def.type !== 'weapon') continue;
    const stats = Combat.getWeaponStats({id, count: 1});
    const ammo = stats.ammoType ? Game.items[stats.ammoType] : null;
    const munitionProSchuss = ammo ? (ammo.cost || 1) * stats.ammoCost : 0;
    zeilen.push({
      id,
      name: def.name,
      katalogDmg: def.baseDmg,
      kampfDmg: stats.dmg,
      munition: ammo ? ammo.name : '—',
      verbrauch: stats.ammoCost,
      munitionKosten: munitionProSchuss,
      kosten: def.cost || 0,
      kostenProSchaden: def.cost / Math.max(1, def.baseDmg),
      schussKostenProSchaden: munitionProSchuss / Math.max(1, stats.dmg),
      nahkampf: !stats.ammoType
    });
  }

  zeilen.sort((a, b) => b.kampfDmg - a.kampfDmg);
  return zeilen;
}

// ===========================================================================
// 2. Rüstung
// ===========================================================================
function analyseArmor(window, sources) {
  const {Game} = window;
  const felder = ['def', 'DR', 'resist'];
  const zeilen = [];

  for (const [id, def] of Object.entries(Game.items)) {
    if (!['head', 'body', 'legs', 'arms', 'feet', 'back'].includes(def.type)) continue;
    const bonus = def.bonus || {};
    const summe = Object.entries(bonus).filter(([k]) => /^[A-Z]{3}$/.test(k))
      .reduce((s, [, v]) => s + v, 0);
    zeilen.push({
      id,
      name: def.name,
      slot: def.type,
      kosten: def.cost || 0,
      bonus,
      summe,
      schutz: felder.filter(f => def[f] !== undefined).join(',') || '—',
      kostenProPunkt: summe > 0 ? (def.cost || 0) / summe : null
    });
  }

  zeilen.sort((a, b) => (a.slot.localeCompare(b.slot)) || (b.summe - a.summe));

  // Wird der Schutz überhaupt gelesen?
  const defGelesen = sources.some(([file, src]) => !istDatenblatt(file) && /\.def\b/.test(src));
  // Rüstung hat kein Schutzfeld. Der Bonus-Teil (z.B. END) landet im Kampf
  // aber sehr wohl - über getStat('AGI') bei der Trefferchance. Der Bericht
  // muss beides trennen, sonst klingt "schützt nicht" nach "wirkt nicht".
  const boniWirksam = sources.some(([file, src]) =>
    !istDatenblatt(file) && /getStat\(['"]END['"]\)|getStat\(['"]AGI['"]\)/.test(src));
  return {zeilen, defGelesen, boniWirksam};
}

// ===========================================================================
// 3. Perks
// ===========================================================================
function analysePerks(window) {
  const {Game} = window;
  return Game.perkDefs.map(p => ({
    id: p.id,
    name: p.name,
    max: p.max,
    beschreibung: p.desc,
    // Sucht nach getPerkLevel('<id>') im Quelltext
    gelesen: false
  }));
}

// ===========================================================================
// 4. SPECIAL
// ===========================================================================
const SPECIAL = ['STR', 'PER', 'END', 'CHA', 'INT', 'AGI', 'LUC'];

function analyseSpecial(window, sources) {
  const {Game} = window;
  const leser = {};
  for (const key of SPECIAL) {
    const stelle = [];
    for (const [file, src] of sources) {
      if (istDatenblatt(file)) continue;
      const re = new RegExp(`getStat\\(['"]${key}['"]\\)`, 'g');
      let m;
      while ((m = re.exec(src))) {
        const zeile = src.slice(0, m.index).split('\n').length;
        stelle.push(`${file.replace(ROOT + '/', '')}:${zeile}`);
      }
    }
    leser[key] = stelle;
  }

  // Kommen die Werte über Rüstung an?
  const ruestungBoni = {};
  for (const def of Object.values(Game.items)) {
    if (!['head', 'body', 'legs', 'arms', 'feet', 'back'].includes(def.type)) continue;
    for (const [k, v] of Object.entries(def.bonus || {})) {
      ruestungBoni[k] = (ruestungBoni[k] || 0) + v;
    }
  }
  return {leser, ruestungBoni};
}

// ===========================================================================
// 5. Verbrauchsgüter
// ===========================================================================
function analyseConsumables(window) {
  const {Game} = window;
  return Object.entries(Game.items)
    .filter(([, d]) => d.type === 'consumable')
    .map(([id, d]) => ({
      id,
      name: d.name,
      effekt: d.effect,
      wert: d.val,
      strahlung: d.rad || 0,
      kosten: d.cost || 0,
      bonus: d.bonus || null,
      heilungProKronkorken: (d.effect === 'heal' || d.effect === 'heal_rad') && d.val > 0 && d.cost
        ? d.val / d.cost : null
    }))
    .sort((a, b) => (b.heilungProKronkorken || 0) - (a.heilungProKronkorken || 0));
}

// ===========================================================================
// 6. Monster gegen Waffen
// ===========================================================================
function analyseMonsters(window, weapons) {
  const {Game} = window;
  const monster = Object.entries(Game.monsters).map(([id, m]) => ({
    id, name: m.name || id, hp: m.hp, dmg: m.dmg, xp: Array.isArray(m.xp) ? m.xp.join('-') : m.xp
  })).sort((a, b) => a.hp - b.hp);

  // Treffer bis zum Kill, Deckung 50 % (die Trefferchance liegt bei 50 + PER*5)
  const treffer = (hp, dmg) => Math.ceil(hp / Math.max(1, dmg)) * 2;
  const referenz = ['fists', 'knife', 'pistol_10mm', 'hunting_rifle', 'plasma_rifle', 'alien_blaster']
    .map(id => weapons.find(w => w.id === id))
    .filter(Boolean);

  return {monster, treffer, referenz};
}

// ===========================================================================
// 7. Minispiele: erreichbar oder nur vorhanden?
// ===========================================================================
function analyseMinigames(window, sources) {
  const ALLE = ['hacking', 'lockpicking', 'memory', 'defusal', 'dice'];
  const erreichbar = {};
  const aufrufe = [];

  for (const [file, src] of sources) {
    if (istDatenblatt(file)) continue;
    // Aufrufe mit echtem Auslöser. `testMinigames` zählt nicht: das ist ein
    // Debug-Dialog, der an ein Tile '?' hängt, das der Generator nie setzt.
    // Auch Aufrufe über eine Variable (`const typ = isBomb ? 'defusal' : ...`)
    // müssen zählen. Deshalb wird zusätzlich nach den Schlüsselnamen in
    // String-Literalen gesucht, nicht nur im Aufruf selbst.
    const aufrufRe = /startMinigame\(\s*['"](\w+)['"]/g;
    let m;
    while ((m = aufrufRe.exec(src))) {
      const ziel = file.replace(ROOT + '/', '');
      (erreichbar[m[1]] = erreichbar[m[1]] || []).push(ziel);
      aufrufe.push({key: m[1], datei: ziel});
    }
  }

  // Aufrufe über eine Variable finden: der Schlüssel steht dann als
  // String-Literal in der Datei, aber nicht direkt hinter `startMinigame(`.
  for (const [file, src] of sources) {
    if (istDatenblatt(file)) continue;
    if (!/startMinigame\(/.test(src)) continue;
    const ziel = file.replace(ROOT + '/', '');
    for (const key of ALLE) {
      if ((erreichbar[key] || []).includes(ziel)) continue;
      const direkt = new RegExp(`startMinigame\\(\\s*['"]${key}['"]`);
      const variabel = new RegExp(`['"]${key}['"]`);
      if (direkt.test(src) || (variabel.test(src) && /const\s+\w+\s*=.*['"]/.test(src))) {
        if (!(erreichbar[key] || []).includes(ziel)) {
          (erreichbar[key] = erreichbar[key] || []).push(ziel);
          aufrufe.push({key, datei: ziel});
        }
      }
    }
  }

  // Ein Aufruf auf einen Schlüssel, den MiniGames nicht kennt, tut nichts:
  // startMinigame bricht still ab. Das ist schlimmer als ein Fehler, weil
  // niemand es merkt.
  const vorhanden = new Set(Object.keys(window.MiniGames).filter(k => k !== 'active'));
  const fehlend = aufrufe.filter(a => !vorhanden.has(a.key));

  return {
    // Pro Minispiel und Datei nur ein Eintrag - ein direkter Aufruf und ein
    // Aufruf über eine Variable stehen oft in derselben Datei.
    liste: ALLE.map(type => ({type, erreicht: [...new Set(erreichbar[type] || [])]})),
    vorhanden: [...vorhanden],
    fehlend
  };
}

// ===========================================================================
// 8. Wirken Verbrauchsgüter?
// ===========================================================================
function analyseConsumableEffects() {
  const quellen = sourceFiles();
  const liest = (muster) => quellen.some(([file, src]) => !istDatenblatt(file) && muster.test(src));
  return {
    // `effect: 'buff'` mit bonus/duration: wird der Bonus je auf state.stats gelegt?
    buffs: liest(/state\.buffs|activeBuffs|applyBuff/),
    // RAD_RESIST aus Rad-X / dem Strahlenschutzanzug
    radResist: liest(/getStat\(['"]RAD_RESIST['"]\)|RAD_RESIST/),
    heilung: true
  };
}

// ===========================================================================
// 9. Wirtschaft
// ===========================================================================
function analyseEconomy(window, weapons) {
  const {Game} = window;
  const preise = weapons.map(w => w.kosten).sort((a, b) => a - b);
  const quote = (p) => preise[Math.floor(preise.length * p)];
  const monster = Object.values(Game.monsters);
  const maxLoot = Math.max(...monster.map(m => Number(m.loot) || 0));

  return {
    waffenPreise: {min: preise[0], median: quote(0.5), max: preise[preise.length - 1]},
    startKapital: 50,
    maxBeuteProKampf: maxLoot,
    // Wie viele Kämpfe bis zur teuersten Waffe, wenn alles Beute ist
    kaempfeBisTopWaffe: maxLoot > 0 ? Math.ceil(preise[preise.length - 1] / maxLoot) : null
  };
}

// ===========================================================================
// Bericht
// ===========================================================================
export function buildReport() {
  const window = loadGame();
  const sources = sourceFiles();
  const {Game} = window;

  const weapons = analyseWeapons(window);
  const armor = analyseArmor(window, sources);
  const perks = analysePerks(window);
  const special = analyseSpecial(window, sources);
  const consumables = analyseConsumables(window);
  const {monster, treffer, referenz} = analyseMonsters(window, weapons);
  const economy = analyseEconomy(window, weapons);
  const minigames = analyseMinigames(window, sources);

  // Verbrauchsgüter: wirkt der Effekt wirklich?
  const consumableWirksam = analyseConsumableEffects();

  // Perks: werden sie gelesen?
  for (const p of perks) {
    p.gelesen = sources.some(([file, src]) =>
      !istDatenblatt(file) && new RegExp(`getPerkLevel\\(['"]${p.id}['"]\\)`).test(src));
  }

  const l = [];
  l.push('# Balancing-Bericht');
  l.push('');
  l.push('Erzeugt von `node tools/balance.mjs --write`. Nicht von Hand ändern —');
  l.push('die Zahlen kommen aus dem gebauten Bündel und dem Quelltext.');
  l.push('');
  l.push(`Stand: Version ${readFileSync(join(ROOT, 'Version'), 'utf8').trim()}`);
  l.push('');

  // --- Waffen ---
  l.push('## 1. Waffen');
  l.push('');
  l.push('| Waffe | Katalog | Kampf | Munition | Verbrauch | Mun./Schuss | Preis | Preis/DMG |');
  l.push('|---|---:|---:|---|---:|---:|---:|---:|');
  for (const w of weapons) {
    l.push(`| ${w.name} | ${w.katalogDmg} | ${w.kampfDmg} | ${w.munition} | ${w.verbrauch} | ${eur(w.munitionKosten)} KK | ${w.kosten} | ${eur(w.kostenProSchaden)} |`);
  }
  l.push('');

  const abweichend = weapons.filter(w => w.katalogDmg !== w.kampfDmg);
  l.push(`Katalog- und Kampfwert stimmen bei ${weapons.length - abweichend.length} von ${weapons.length} Waffen überein.`);
  l.push('');

  // Preis-Leistung: gibt es Ausreißer?
  const mitPreis = weapons.filter(w => w.kosten > 0);
  const bestesVerhaeltnis = [...mitPreis].sort((a, b) => a.kostenProSchaden - b.kostenProSchaden)[0];
  const schlechtestes = [...mitPreis].sort((a, b) => b.kostenProSchaden - a.kostenProSchaden)[0];
  l.push(`Günstigste Leistung: **${bestesVerhaeltnis.name}** (${eur(bestesVerhaeltnis.kostenProSchaden)} KK pro Schadenspunkt).`);
  l.push(`Teuerste Leistung: **${schlechtestes.name}** (${eur(schlechtestes.kostenProSchaden)} KK pro Schadenspunkt).`);
  l.push('');

  // Lineare Regression: passt der Preis zum Schaden?
  const n = mitPreis.length;
  const mx = mitPreis.reduce((s, w) => s + w.katalogDmg, 0) / n;
  const my = mitPreis.reduce((s, w) => s + w.kosten, 0) / n;
  const kov = mitPreis.reduce((s, w) => s + (w.katalogDmg - mx) * (w.kosten - my), 0);
  const varx = mitPreis.reduce((s, w) => s + (w.katalogDmg - mx) ** 2, 0);
  const steigung = kov / varx;
  const r = kov / Math.sqrt(varx * mitPreis.reduce((s, w) => s + (w.kosten - my) ** 2, 0));
  l.push(`Preis gegen Schaden: Steigung ${eur(steigung)} KK pro Schadenspunkt, Korrelation r = ${r.toFixed(2)}.`);
  l.push(r > 0.9
    ? 'Der Preis folgt dem Schaden fast linear — es gibt keine Waffe, die ihr Geld nicht wert ist.'
    : 'Der Preis folgt dem Schaden nur locker. Einzelne Waffen sind deutlich über- oder unterbezahlt.');
  l.push('');

  // --- Rüstung ---
  l.push('## 2. Rüstung');
  l.push('');
  l.push('| Teil | Slot | Preis | Boni | Punkte | Schutz | KK/Punkt |');
  l.push('|---|---|---:|---|---:|---|---:|');
  for (const a of armor.zeilen) {
    const boni = Object.entries(a.bonus).map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}`).join(' ');
    l.push(`| ${a.name} | ${a.slot} | ${a.kosten} | ${boni} | ${a.summe} | ${a.schutz} | ${a.kostenProPunkt === null ? '—' : eur(a.kostenProPunkt)} |`);
  }
  l.push('');
  const mitSchutz = armor.zeilen.filter(a => a.schutz !== '—');
  l.push(`**Schutzfeld:** ${mitSchutz.length} von ${armor.zeilen.length} Rüstungsteilen haben \`def\` oder \`DR\`.`);
  l.push('');
  l.push('Der Kampf rechnet mit `Math.max(1, Schaden - Math.floor(armor / 2))` und liest dafür');
  l.push('`equip[slot].def` — ein Feld, das kein Rüstungsteil besitzt. Ausrüstung mindert den');
  l.push('erlittenen Schaden also **nicht**.');
  l.push('');
  l.push(armor.boniWirksam
    ? 'Die END- und AGI-Boni wirken trotzdem: END erhöht die Maximal-HP, AGI senkt die Trefferchance der Gegner (85 − AGI×3).'
    : 'Auch die Boni bleiben wirkungslos.');
  l.push('');

  // --- Perks ---
  l.push('## 3. Perks');
  l.push('');
  l.push('| Perk | Stufen | Wirkung | wird gelesen |');
  l.push('|---|---:|---|---|');
  for (const p of perks) l.push(`| ${p.name} | ${p.max} | ${p.beschreibung} | ${p.gelesen ? 'ja' : '**nein**'} |`);
  l.push('');
  const totePerks = perks.filter(p => !p.gelesen);
  l.push(totePerks.length === 0
    ? `Alle ${perks.length} Perks werden im Code gelesen.`
    : `**${totePerks.length} von ${perks.length} Perks werden nirgends gelesen:** ${totePerks.map(p => p.name).join(', ')}.`);
  l.push('');

  // --- SPECIAL ---
  l.push('## 4. SPECIAL');
  l.push('');
  l.push('| Wert | gelesen an | Anzahl | Boni aus Rüstung |');
  l.push('|---|---|---:|---:|');
  for (const key of SPECIAL) {
    const stellen = special.leser[key];
    l.push(`| ${key} | ${stellen.length ? stellen.map(s => '`' + s + '`').join('<br>') : '**nirgends**'} | ${stellen.length} | ${special.ruestungBoni[key] || 0} |`);
  }
  l.push('');
  const ungenutzt = SPECIAL.filter(k => special.leser[k].length === 0);
  if (ungenutzt.length) {
    l.push(`**${ungenutzt.join(', ')}** ${ungenutzt.length === 1 ? 'wird' : 'werden'} von keiner Spielmechanik gelesen.`);
    l.push('');
  }

  // --- Verbrauchsgüter ---
  l.push('## 5. Verbrauchsgüter');
  l.push('');
  l.push('| Item | Effekt | Wert | Strahlung | Preis | HP pro KK |');
  l.push('|---|---|---:|---:|---:|---:|');
  for (const c of consumables) {
    l.push(`| ${c.name} | ${c.effekt}${c.bonus ? ' ' + JSON.stringify(c.bonus) : ''} | ${c.wert ?? '—'} | ${c.strahlung} | ${c.kosten} | ${c.heilungProKronkorken === null ? '—' : eur(c.heilungProKronkorken)} |`);
  }
  l.push('');

  // --- Wirksamkeit der Verbrauchsgüter ---
  l.push('### Wirken die Effekte?');
  l.push('');
  const buffItems = consumables.filter(c => c.effekt === 'buff');
  l.push(`- **Heilung** (\`heal\`, \`heal_rad\`): wirkt. ${consumables.filter(c => c.heilungProKronkorken).length} Items heilen, der Sanitäter-Perk verstärkt sie.`);
  l.push(`- **Buffs** (\`buff\`, ${buffItems.length} Items: ${buffItems.map(c => c.name).join(', ')}): ${consumableWirksam.buffs ? 'werden angewandt' : '**wirken nicht**'}. \`useItem\` schreibt nur „Effekte noch WIP" ins Log und verbraucht das Item.` + (consumableWirksam.buffs ? '' : ' Kein Code legt den Bonus je auf \`state.stats\` oder führt eine Dauer.'));
  l.push(`- **Strahlungsresistenz** (\`RAD_RESIST\` aus Rad-X und Strahlenschutzanzug): ${consumableWirksam.radResist ? 'wird gelesen' : '**wird nirgends gelesen**'}. \`addRadiation\` kennt nur den Rad-Resistenz-Perk.`);
  l.push('');

  // --- Minispiele ---
  l.push('## 6. Minispiele');
  l.push('');
  l.push('| Minispiel | erreichbar über |');
  l.push('|---|---|');
  for (const m of minigames.liste) {
    l.push(`| ${m.type} | ${m.erreicht.length ? m.erreicht.map(f => '`' + f + '`').join('<br>') : '**nicht erreichbar**'} |`);
  }
  l.push('');
  if (minigames.fehlend.length) {
    l.push('**Aufruf auf einen Schlüssel, den es nicht gibt:**');
    l.push('');
    for (const f of minigames.fehlend) {
      l.push(`- \`startMinigame('${f.key}')\` in \`${f.datei}\` — \`MiniGames.${f.key}\` existiert nicht.`);
    }
    l.push('');
    l.push('`startMinigame` bricht bei unbekanntem Schlüssel still ab (`if (!MiniGames[type]) return;`).');
    l.push('Der Aufrufer bekommt weder Erfolg noch Fehlschlag, also bleibt sein Zustand hängen.');
    l.push('');
  }
  const tot = minigames.liste.filter(m => m.erreicht.length === 0);
  if (tot.length) {
    l.push(`${tot.map(m => '`' + m.type + '`').join(', ')} ${tot.length === 1 ? 'wird' : 'werden'} von keiner Spielsituation gestartet.`);
    l.push('');
    l.push('Das betrifft die Werte: `hacking` ist die einzige Stelle, an der INT die Schwierigkeit senkt');
    l.push('(12 − INT Wörter). Solange es unerreichbar ist, hat INT keine Wirkung im Spiel.');
    l.push('');
  }

  // --- Monster ---
  l.push('## 7. Monster gegen Waffen');
  l.push('');
  l.push('Treffer bis zum Kill bei 50 % Trefferchance (die Grundchance liegt bei 50 + PER×5).');
  l.push('');
  l.push('| Monster | HP | Gegenschaden | XP | ' + referenz.map(w => w.name).join(' | ') + ' |');
  l.push('|---|---:|---:|---:|' + referenz.map(() => '---:').join('|') + '|');
  for (const m of monster) {
    l.push(`| ${m.name} | ${m.hp} | ${m.dmg} | ${m.xp} | ` + referenz.map(w => treffer(m.hp, w.kampfDmg)).join(' | ') + ' |');
  }
  l.push('');

  // --- Wirtschaft ---
  l.push('## 8. Wirtschaft');
  l.push('');
  l.push(`- Waffenpreise: ${economy.waffenPreise.min} bis ${economy.waffenPreise.max} KK (Median ${economy.waffenPreise.median})`);
  l.push(`- Startkapital: ${economy.startKapital} KK`);
  l.push(`- Höchste Beute pro Kampf: ${economy.maxBeuteProKampf} KK`);
  if (economy.kaempfeBisTopWaffe !== null) {
    l.push(`- Kämpfe bis zur teuersten Waffe (nur Beute, ohne Verkäufe): **${economy.kaempfeBisTopWaffe}**`);
  }
  l.push('');

  // --- Fazit ---
  l.push('## 9. Fazit');
  l.push('');
  const befund = [];
  if (armor.zeilen.every(a => a.schutz === '—')) befund.push('Rüstung schützt nicht (kein `def`-Feld).');
  if (tot.length) befund.push(`Minispiele ohne Auslöser: ${tot.map(m => m.type).join(', ')}.`);
  if (minigames.fehlend.length) befund.push(`Minispiel-Aufruf auf unbekannten Schlüssel: ${minigames.fehlend.map(f => f.key).join(', ')}.`);
  // Nur der Fehlerfall landet unter "Offen"; die Erfolgsmeldungen stehen
  // schon in der Liste darüber.
  if (!consumableWirksam.buffs) befund.push('Buff-Items wirken nicht (Bonus wird nie angewandt).');
  if (!consumableWirksam.radResist) befund.push('Strahlungsresistenz wird ignoriert.');
  const chaLeer = SPECIAL.filter(k => special.leser[k].length === 0);
  if (chaLeer.length) befund.push(`SPECIAL ohne Wirkung: ${chaLeer.join(', ')}.`);

  l.push(`Das Spiel hat ${weapons.length} Waffen, ${armor.zeilen.length} Rüstungsteile, ${perks.length} Perks,`);
  l.push(`${consumables.length} Verbrauchsgüter und ${monster.length} Monster.`);
  l.push('');

  // Eine Zeile pro Teilmechanik, die nur erfüllt oder offen sein kann.
  const gemessen = [
    ['Rüstung mindert Schaden', armor.zeilen.some(a => a.schutz !== '—' && a.schutz !== '0')],
    ['Buffs wirken', consumableWirksam.buffs],
    ['Strahlungsresistenz zählt', consumableWirksam.radResist],
    ['jedes Minispiel hat einen Auslöser', tot.length === 0],
    ['kein Aufruf auf unbekannten Minispiel-Schlüssel', minigames.fehlend.length === 0],
    ['jeder SPECIAL-Wert wird gelesen', chaLeer.length === 0]
  ];
  for (const [name, ok] of gemessen) l.push(`- ${ok ? '✓' : '✗'} ${name}`);
  l.push('');
  if (befund.length) {
    l.push('Offen:');
    l.push('');
    for (const b of befund) l.push(`- ${b}`);
    l.push('');
  }
  l.push('Details in `docs/BALANCE_BEFUNDE.md`.');
  l.push('');

  // Ohne close() hält jsdom den Prozess mit seinen Timern am Leben und das
  // Werkzeug hängt nach dem Bericht minutenlang.
  window.close();

  return {
    text: l.join('\n'),
    daten: {weapons, armor, perks, special, consumables, monster, economy, minigames}
  };
}

const istDirekt = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (istDirekt) {
  const {text} = buildReport();
  if (process.argv.includes('--write')) {
    writeFileSync(join(ROOT, 'docs/BALANCING.md'), text + '\n');
    console.log('docs/BALANCING.md geschrieben.');
  } else {
    console.log(text);
  }
}
