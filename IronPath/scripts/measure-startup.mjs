#!/usr/bin/env node
// Startup measurement (AUSBAU-PLAN Punkt 6): how many module requests does
// a cold start really make, how many bytes do they carry, and how deep is
// the discovery waterfall? Static graph analysis from index.html - the
// same graph the browser walks, because every specifier in this codebase
// is a literal relative path with a cache token.
//
//   node IronPath/scripts/measure-startup.mjs [--json]
//
// Phases follow the real boot: the three entry scripts in index.html run
// first (boot), then account-entry.mjs dynamically imports account.js,
// which statically pulls the whole app including the game (app). Dynamic
// imports found deeper in the graph are reported as lazy edges, not
// counted as startup requests. External specifiers (the Firebase CDN)
// are counted separately - they are three requests with their own graph
// on another host.
import {readFileSync, existsSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const STATIC_RE = /(?:import|export)\s+(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
const DYNAMIC_RE = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

function specifiers(source, re) {
  const found = [];
  for (const match of source.matchAll(re)) found.push(match[1]);
  return found;
}

function resolveLocal(importerFile, specifier) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return null;
  const clean = specifier.split('?')[0];
  return path.normalize(path.join(path.dirname(importerFile), clean));
}

// Walk the eager graph breadth-first so every module carries the depth at
// which the browser discovers it (its importer's depth + 1).
export function measureStartup(root) {
  const htmlPath = path.join(root, 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  const entries = [...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map(m => m[1].split('?')[0]);
  const stylesheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(m => m[1].split('?')[0]);
  // One walk over the static graph. stopAt names a file the walk may see
  // but never enter - used to price the boot phase (everything before the
  // account.js dynamic import) separately from the whole app.
  const walk = (stopAt = null) => {
    const map = new Map();
    const externals = new Set();
    const lazy = [];
    const unresolved = [];
    const queue = [];
    let seed = null;
    const add = (abs, depth) => {
      if (abs === stopAt) return;
      if (!/\.(mjs|js)$/.test(abs) || !existsSync(abs)) { unresolved.push(abs); return; }
      const known = map.get(abs);
      if (known) { if (depth < known.depth) known.depth = depth; return; }
      const content = readFileSync(abs);
      map.set(abs, {bytes: content.length, gzip: gzipSync(content).length, depth});
      queue.push(abs);
    };
    for (const entry of entries) add(path.join(root, entry), 0);
    while (queue.length) {
      const file = queue.shift();
      const {depth} = map.get(file);
      const source = readFileSync(file, 'utf8');
      for (const spec of specifiers(source, STATIC_RE)) {
        if (/^https?:/.test(spec)) { externals.add(spec.split('?')[0]); continue; }
        const local = resolveLocal(file, spec);
        if (local) add(local, depth + 1);
      }
      for (const spec of specifiers(source, DYNAMIC_RE)) {
        if (/^https?:/.test(spec)) continue;
        const local = resolveLocal(file, spec);
        if (!local) continue;
        if (path.basename(file) === 'account-entry.mjs') { seed = local; add(local, depth + 1); }
        else lazy.push(`${path.relative(root, file)} -> ${path.relative(root, local)}`);
      }
    }
    return {map, externals, lazy, seed, unresolved};
  };
  const bootRun = walk(null);
  const appSeed = bootRun.seed;
  const files = bootRun.map;
  const external = bootRun.externals;
  const lazyEdges = bootRun.lazy;
  const bootFiles = appSeed ? walk(appSeed).map : files;
  const summarize = (map) => ({
    modules: map.size,
    bytes: [...map.values()].reduce((n, f) => n + f.bytes, 0),
    gzipBytes: [...map.values()].reduce((n, f) => n + f.gzip, 0),
    maxDepth: [...map.values()].reduce((n, f) => Math.max(n, f.depth), 0),
  });
  const bootPhase = summarize(bootFiles);
  const app = summarize(files);
  const byArea = new Map();
  for (const [abs, f] of files) {
    const rel = path.relative(root, abs);
    const area = rel.includes('/') ? rel.split('/')[0] : '(root)';
    const slot = byArea.get(area) || {modules: 0, bytes: 0};
    slot.modules++; slot.bytes += f.bytes; byArea.set(area, slot);
  }
  const largest = [...files.entries()]
    .map(([abs, f]) => ({file: path.relative(root, abs), bytes: f.bytes, depth: f.depth}))
    .sort((a, b) => b.bytes - a.bytes).slice(0, 12);
  const levels = new Map();
  for (const [, f] of files) levels.set(f.depth, (levels.get(f.depth) || 0) + 1);
  return {
    entries, stylesheets,
    bootModules: bootPhase.modules, bootBytes: bootPhase.bytes, bootGzipBytes: bootPhase.gzipBytes,
    modules: app.modules, bytes: app.bytes, gzipBytes: app.gzipBytes,
    maxDepth: app.maxDepth, levels: Object.fromEntries([...levels].sort((a, b) => a[0] - b[0])),
    external: [...external], lazyEdges, unresolved: bootRun.unresolved.map(p => path.relative(root, p)),
    css: stylesheets.map(href => ({file: href, bytes: readFileSync(path.join(root, href)).length})),
    byArea: Object.fromEntries([...byArea].sort((a, b) => b[1].bytes - a[1].bytes)),
    largest,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const m = measureStartup(root);
  if (process.argv.includes('--json')) { console.log(JSON.stringify(m, null, 1)); process.exit(0); }
  const kb = n => `${(n / 1024).toFixed(1)} KB`;
  console.log(`Startup measurement (static module graph from index.html)\n`);
  console.log(`Entry scripts:      ${m.entries.join(', ')}`);
  console.log(`Boot phase:         ${m.bootModules} modules, ${kb(m.bootBytes)} raw before account.js loads`);
  console.log(`App phase (total):  ${m.modules} modules, ${kb(m.bytes)} raw, ~${kb(m.gzipBytes)} as per-file gzip`);
  console.log(`Stylesheets:        ${m.css.map(c => `${c.file} ${kb(c.bytes)}`).join(' + ')}`);
  console.log(`External requests:  ${m.external.length} Firebase CDN modules (own graph, other host)`);
  console.log(`Waterfall depth:    ${m.maxDepth + 1} discovery levels ${JSON.stringify(m.levels)}`);
  console.log(`Lazy edges (not startup): ${m.lazyEdges.length ? m.lazyEdges.join('; ') : 'none'}`);
  console.log(`Unresolved imports: ${m.unresolved.length ? m.unresolved.join('; ') : 'none'}`);
  console.log(`\nLargest modules:`);
  for (const f of m.largest) console.log(`  ${String(kb(f.bytes)).padStart(9)}  depth ${f.depth}  ${f.file}`);
  console.log(`\nBytes by area:`);
  for (const [area, s] of Object.entries(m.byArea)) console.log(`  ${area.padEnd(12)} ${String(s.modules).padStart(4)} modules  ${kb(s.bytes)}`);
  console.log(`\nStartup requests (cold, same host): 1 HTML + ${m.css.length} CSS + ${m.modules} modules = ${1 + m.css.length + m.modules}, plus ${m.external.length} external.`);
}
