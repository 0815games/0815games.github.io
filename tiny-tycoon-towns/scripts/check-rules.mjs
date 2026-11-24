#!/usr/bin/env node
// Prüft die Realtime-Database-Regeln. Schreibt nichts und veröffentlicht nichts.
//
//   node scripts/check-rules.mjs                       Kandidat prüfen
//   node scripts/check-rules.mjs --live <export.json>  zusätzlich: fehlt etwas, das live existiert?
//
// Veröffentlicht wird immer die ganze Regeldatei. Ein fehlender Pfad ist deshalb
// ein echter Rückschritt für Spieler. Die Live-Datei exportiert der Betreiber
// vor dem Veröffentlichen aus der Firebase-Konsole (siehe docs/FIREBASE.md).
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const CANDIDATE = resolve(dirname(fileURLToPath(import.meta.url)), '../firebase/database.rules.json');

// Die Konsole liefert den Inhalt mal als {"rules": {...}}, mal blank. Beides akzeptieren.
export function unwrapRules(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Regeln müssen ein JSON-Objekt sein');
  }
  const inner = value.rules;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) return inner;
  return value;
}

function walk(node, prefix, visit) {
  visit(prefix, node);
  for (const [key, value] of Object.entries(node)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    if (key.startsWith('.')) continue;
    walk(value, `${prefix}/${key}`, visit);
  }
}

/** Sperrmodus-Prüfung: offene Zweige, fehlende Eigentümerprüfung, fremde Wurzelzweige. */
export function checkRules(raw) {
  const errors = [];
  const rules = unwrapRules(raw);

  if (rules['.read'] !== undefined || rules['.write'] !== undefined) {
    errors.push('Wurzel: .read oder .write gesetzt. Die Wurzel muss geschlossen bleiben.');
  }
  for (const key of Object.keys(rules)) {
    if (!key.startsWith('.') && key !== 'saves') errors.push(`Unbekannter Zweig "${key}"`);
  }

  walk(rules, '', (path, node) => {
    for (const mode of ['.read', '.write']) {
      if (node[mode] === true || node[mode] === 'true') {
        errors.push(`${path || '/'}: ${mode} ist offen (true)`);
      }
    }
  });

  const owner = rules.saves?.$uid;
  if (!owner) {
    errors.push('saves/$uid fehlt');
  } else {
    if (!String(owner['.read'] ?? '').includes('auth.uid === $uid')) {
      errors.push('saves/$uid: .read ohne Eigentümerprüfung');
    }
    const town = owner.town;
    if (!town) {
      errors.push('saves/$uid/town fehlt');
    } else {
      if (!String(town['.write'] ?? '').includes('auth.uid === $uid')) {
        errors.push('town: .write ohne Eigentümerprüfung');
      }
      if (!String(town['.validate'] ?? '').includes('newData')) {
        errors.push('town: .validate prüft nichts');
      }
      if (town.$other?.['.validate'] !== false) {
        errors.push('town: $other muss .validate false haben (unbekannte Felder abweisen)');
      }
      if (!String(town['.validate'] ?? '').includes('schemaVersion')) {
        errors.push('town: Schema-Downgrade wird nicht geprüft');
      }
    }
  }
  return { errors };
}

/** Pfade, die live existieren und im Kandidaten fehlen. */
export function missingPaths(liveRaw, candidateRaw) {
  const live = unwrapRules(liveRaw);
  const cand = unwrapRules(candidateRaw);
  const paths = (root) => {
    const out = new Set();
    walk(root, '', (p) => { if (p) out.add(p); });
    return out;
  };
  const have = paths(cand);
  return [...paths(live)].filter((p) => !have.has(p));
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const liveIdx = args.indexOf('--live');
  const candidate = JSON.parse(await readFile(CANDIDATE, 'utf8'));
  const { errors } = checkRules(candidate);
  if (liveIdx >= 0) {
    const live = JSON.parse(await readFile(args[liveIdx + 1], 'utf8'));
    for (const p of missingPaths(live, candidate)) errors.push(`würde entfernt: ${p}`);
  }
  if (errors.length) {
    console.error('Regeln: FEHLER');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log('Regeln: OK (Kandidat ' + CANDIDATE.split('/').slice(-2).join('/') + ')');
}
