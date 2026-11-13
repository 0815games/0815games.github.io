// Local packaging candidate. The default output remains unguarded. An explicit
// public configuration opts into an isolated guarded artifact; neither mode
// deploys anything or enables production Firebase rules or maintenance.
// Production rollout still needs a verified service, rules and deployment plan.
import {mkdir, readFile, readdir, realpath, lstat, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, relative, join, sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {BUILD_PATTERN} from './release-control.mjs';
import {validatePublicSiteConfig,formatPublicSiteConfig} from './public-site-config.mjs';

const within=(parent,child)=>{const r=relative(parent,child);return r===''||(!r.startsWith(`..${sep}`)&&r!=='..'&&!r.startsWith(sep));};
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
// Only browser-safe dependencies of the unmounted guard are copied. Never copy
// the server/API, deployment configuration, node_modules or possible secrets.
const browserGuardFiles=Object.freeze([
  'guarded-game-bootstrap.mjs','guarded-runtime.mjs','game-session.mjs',
  'release-control.mjs','runtime-fence.mjs','status-monitor.mjs','bounded-json.mjs'
]);
const guardedEntryFiles=Object.freeze(['guarded-game-entry.mjs','public-site-config.mjs']);

export async function stageVersion({sourceDir, outputDir, build, guardedConfig} = {}) {
  if (typeof build !== 'string' || !BUILD_PATTERN.test(build)) throw Error('Invalid build ID');
  if (typeof sourceDir !== 'string' || typeof outputDir !== 'string') throw Error('Explicit source and output are required');
  // Explicit opt-in; reject unexpected fields before creating any output. The
  // allowlist contains only public Web SDK settings, never service credentials.
  const config=guardedConfig===undefined?null:validatePublicSiteConfig(guardedConfig);
  const source=await realpath(resolve(sourceDir));
  // The destination must already exist, so an unsafe path cannot create any
  // directories inside the source before the realpath / containment check.
  const output=await realpath(resolve(outputDir));
  if (within(source,output) || within(output,source)) throw Error('Output and source must be separate directory trees');
  const target=join(output,build);
  await mkdir(target); // No recursive option: never overwrite an existing build.

  const files={};
  async function save(path, bytes) {
    await mkdir(join(target, path, '..'),{recursive:true});
    await writeFile(join(target,path),bytes,{flag:'wx'});
    files[path.split(sep).join('/')]={bytes:bytes.length,sha256:sha256(bytes)};
  }
  async function copyTree(dir, prefix) {
    for (const name of (await readdir(dir)).sort()) {
      const from=join(dir,name), rel=join(prefix,name), info=await lstat(from);
      if (info.isSymbolicLink()) throw Error(`Symbolic link in release source: ${rel}`);
      if (info.isDirectory()) await copyTree(from,rel);
      else if (info.isFile()) await save(rel,await readFile(from));
      else throw Error(`Unsupported release source: ${rel}`);
    }
  }
  // Everything the present browser game can reference lives at its top level
  // or below assets/, including runtime-built image, sound and video URLs.
  // The caller must audit this inventory again when the application changes.
  const names=(await readdir(source)).filter(name=>/\.(?:mjs|js|css)$/.test(name)).sort();
  for (const name of names) {
    const info=await lstat(join(source,name));
    if (!info.isFile() || info.isSymbolicLink()) throw Error(`Invalid runtime file: ${name}`);
    await save(name,await readFile(join(source,name)));
  }
  const assetInfo=await lstat(join(source,'assets'));
  if (!assetInfo.isDirectory() || assetInfo.isSymbolicLink()) throw Error('Missing real assets directory');
  await copyTree(join(source,'assets'),'assets');
  const guardDir=join(source,'release-tools'),guardInfo=await lstat(guardDir);
  if (!guardInfo.isDirectory() || guardInfo.isSymbolicLink()) throw Error('Missing real browser guard directory');
  for (const name of [...browserGuardFiles,...(config?guardedEntryFiles:[])]) {
    const file=join(guardDir,name),info=await lstat(file);
    if (!info.isFile() || info.isSymbolicLink()) throw Error(`Invalid browser guard file: ${name}`);
    await save(join('release-tools',name),await readFile(file));
  }
  if(config){
    for(const name of ['account.js','account-services.mjs','game.js']){
      if(!Object.hasOwn(files,name))throw Error(`Missing guarded runtime file: ${name}`);
    }
    // The session registry is module-instance scoped. A mismatched query would
    // make the game import a different registry than the one the guard installs.
    const account=await readFile(join(target,'account.js'),'utf8');
    const entry=await readFile(join(target,'release-tools','guarded-game-entry.mjs'),'utf8');
    const accountImports=[...account.matchAll(/from\s+['"]\.\/account-services\.mjs(\?[^'"]*)['"]/g)];
    const entryImports=[...entry.matchAll(/from\s+['"]\.\.\/account-services\.mjs(\?[^'"]*)['"]/g)];
    if(accountImports.length!==1 || entryImports.length!==1 || accountImports[0][1]!==entryImports[0][1]) {
      throw Error('Guarded account registry module URLs must match');
    }
    await save('release-config.mjs',Buffer.from(formatPublicSiteConfig(config)));
  }

  // The release is nested two levels below /IronPath/. Keep the home link and
  // installed-PWA start on the stable entry point rather than an obsolete build.
  const indexInfo=await lstat(join(source,'index.html'));
  if (!indexInfo.isFile() || indexInfo.isSymbolicLink()) throw Error('Invalid source index');
  let html=await readFile(join(source,'index.html'),'utf8');
  const stamp=/<p class="build-stamp" aria-hidden="true">BUILD ([^<]+)<\/p>/g;
  const stamps=[...html.matchAll(stamp)];
  if (stamps.length!==2 || stamps[0][1]!==stamps[1][1] || !html.includes('<html lang="en">') ||
      !html.includes('<a href="../">← 0815 Games</a>')) throw Error('Unexpected source HTML; audit packaging before continuing');
  html=html.replace('<html lang="en">',`<html lang="en"${config?' data-ironpath-guard="required"':''} data-ironpath-release-build="${build}">`)
    .replace(stamp,`<p class="build-stamp" aria-hidden="true">BUILD ${build}</p>`)
    .replace('<a href="../">← 0815 Games</a>','<a href="/">← 0815 Games</a>');
  if(config){
    const account=/<script type="module" src="account\.js\?v=[^"]+"><\/script>/g;
    if([...html.matchAll(account)].length!==1 || html.split('</head>').length!==2 ||
        html.split('<body>').length!==2 || html.split('</body>').length!==2 ||
        html.includes('id="ironpath-guarded-game"') || html.includes('id="ironpath-guarded-hold"')) {
      throw Error('Unexpected source HTML; cannot install guarded entry');
    }
    // This initial hold works even when JS or a CDN fails. The game is not just
    // covered: it is both hidden and inert before any account module can run.
    const hold=`<div id="ironpath-guarded-hold" role="status" aria-live="polite"><div class="ironpath-guarded-message"><b>0815 GAMES / IRON PATH</b><h1 id="ironpath-hold-title">Checking operation status / Einsatzstatus wird geprüft</h1><p id="ironpath-hold-detail">Sign-in and play stay blocked until clearance. / Anmeldung und Spiel bleiben bis zur Freigabe gesperrt.</p><a href="/IronPath/?from=unavailable">Return to status / Zur Statusseite</a></div></div><div id="ironpath-guarded-game" hidden inert>`;
    const style='<style>#ironpath-guarded-game[hidden],#ironpath-guarded-hold[hidden]{display:none!important}#ironpath-guarded-hold{min-height:100vh;display:grid;place-items:center;padding:24px;background:#14241c;color:#f8f0dc;font:16px/1.6 Arial,sans-serif}#ironpath-guarded-hold .ironpath-guarded-message{max-width:560px;padding:32px;border:1px solid #95a080;background:#1b3028}#ironpath-guarded-hold b{color:#ead39a;font-size:11px;letter-spacing:.14em}#ironpath-guarded-hold h1{font:700 36px/1.1 Georgia,serif}#ironpath-guarded-hold a{color:#ead39a}</style>';
    html=html.replace('</head>',`${style}</head>`).replace('<body>',`<body>${hold}`)
      .replace(account,'<script type="module" src="release-tools/guarded-game-entry.mjs"></script>')
      .replace('</body>','</div></body>');
  }
  await save('index.html',Buffer.from(html));

  // Replace the already-copied manifest with a staged version, never touching
  // the source. The explicit scope covers /IronPath/ even though the manifest
  // is nested under releases/<build>/assets/.
  const manifestPath=join(target,'assets','manifest.webmanifest');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  manifest.start_url='/IronPath/';manifest.scope='/IronPath/';
  const manifestBytes=Buffer.from(`${JSON.stringify(manifest,null,2)}\n`);
  await writeFile(manifestPath,manifestBytes);
  files['assets/manifest.webmanifest']={bytes:manifestBytes.length,sha256:sha256(manifestBytes)};

  const inventory={format:1,build,...(config?{guarded:true}:{}),files};
  await writeFile(join(target,'release-manifest.json'),`${JSON.stringify(inventory,null,2)}\n`,{flag:'wx'});
  return {directory:target,build,fileCount:Object.keys(files).length};
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [, , sourceDir, outputDir, build, option, configPath]=process.argv;
  if (!sourceDir || !outputDir || !build || !(process.argv.length===5 ||
      (process.argv.length===7 && option==='--guarded-public-config' && configPath))) {
    console.error('Usage: node stage-version.mjs <IronPath source directory> <separate output directory> <unique-build-id> [--guarded-public-config <public-json-file>]');
    process.exitCode=2;
  } else {
    (async()=>{
      let guardedConfig;
      if(configPath){
        const text=await readFile(configPath,'utf8');
        try{guardedConfig=JSON.parse(text);}catch{throw Error('Invalid public configuration JSON');}
      }
      return stageVersion({sourceDir,outputDir,build,guardedConfig});
    })().then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
  }
}
