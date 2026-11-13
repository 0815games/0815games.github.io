// Local packaging candidate. This creates no deployment and does not install
// the login/maintenance guard. Production rollout remains blocked until the
// bootstrap, auth exchange, real rules and deployment process are integrated.
import {mkdir, readFile, readdir, realpath, lstat, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, relative, join, sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {BUILD_PATTERN} from './release-control.mjs';

const within=(parent,child)=>{const r=relative(parent,child);return r===''||(!r.startsWith(`..${sep}`)&&r!=='..'&&!r.startsWith(sep));};
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
// Only browser-safe dependencies of the unmounted guard are copied. Never copy
// the server/API, deployment configuration, node_modules or possible secrets.
const browserGuardFiles=Object.freeze([
  'guarded-game-bootstrap.mjs','guarded-runtime.mjs','game-session.mjs',
  'release-control.mjs','runtime-fence.mjs','status-monitor.mjs','bounded-json.mjs'
]);

export async function stageVersion({sourceDir, outputDir, build} = {}) {
  if (typeof build !== 'string' || !BUILD_PATTERN.test(build)) throw Error('Invalid build ID');
  if (typeof sourceDir !== 'string' || typeof outputDir !== 'string') throw Error('Explicit source and output are required');
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
  for (const name of browserGuardFiles) {
    const file=join(guardDir,name),info=await lstat(file);
    if (!info.isFile() || info.isSymbolicLink()) throw Error(`Invalid browser guard file: ${name}`);
    await save(join('release-tools',name),await readFile(file));
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
  html=html.replace('<html lang="en">',`<html lang="en" data-ironpath-release-build="${build}">`)
    .replace(stamp,`<p class="build-stamp" aria-hidden="true">BUILD ${build}</p>`)
    .replace('<a href="../">← 0815 Games</a>','<a href="/">← 0815 Games</a>');
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

  const inventory={format:1,build,files};
  await writeFile(join(target,'release-manifest.json'),`${JSON.stringify(inventory,null,2)}\n`,{flag:'wx'});
  return {directory:target,build,fileCount:Object.keys(files).length};
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const [, , sourceDir, outputDir, build]=process.argv;
  if (!sourceDir || !outputDir || !build || process.argv.length!==5) {
    console.error('Usage: node stage-version.mjs <IronPath source directory> <separate output directory> <unique-build-id>');
    process.exitCode=2;
  } else {
    stageVersion({sourceDir,outputDir,build}).then(result=>console.log(JSON.stringify(result))).catch(error=>{console.error(error.message);process.exitCode=1;});
  }
}
