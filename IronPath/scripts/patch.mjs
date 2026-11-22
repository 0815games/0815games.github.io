// One patch tool with two subcommands: check and bump.
//
// This file merges the former patch-lib.mjs, patch-check.mjs and
// patch-bump.mjs (Phase 3 of the folder restructure, IPL-0094/IPL-0101).
// check verifies a release stamp, bump writes one. Both must agree on what
// "the stamp" is, otherwise a bump can pass its own check by accident.
// Everything they share lives in the first section: the token shape, the
// places that carry the token outside a `?v=` import, which files a bump
// rewrites, and which occurrences must stay historical.
//
// Usage:
//   node IronPath/scripts/patch.mjs check                 # Schnelltest: Stempel, Log, Geheimnisse, Verträge
//   node IronPath/scripts/patch.mjs check --fast          # dasselbe, ausdrücklich ohne Suite (CI-Eingangstor)
//   node IronPath/scripts/patch.mjs check --suite         # + volle Suite (Serienlauf)
//   node IronPath/scripts/patch.mjs check --online        # + PR, CI, Pages
//   node IronPath/scripts/patch.mjs check --online --verify-main --pr 342
//   node IronPath/scripts/patch.mjs check --root <pfad>   # anderer Baum (Fixtures)
//   node IronPath/scripts/patch.mjs bump 20261122-order1            # Trockenlauf
//   node IronPath/scripts/patch.mjs bump 20261122-order1 --apply    # schreiben
//   node IronPath/scripts/patch.mjs bump <neu> --from <alt> --root <pfad>
//
// check never writes anything and never merges, deploys or publishes.
// bump writes token strings only, and only with --apply.
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const IRONPATH=fileURLToPath(new URL('..',import.meta.url));
export const REPO_ROOT=fileURLToPath(new URL('../..',import.meta.url));

// A cache wave token: 20YYMMDD plus a lowercase release name.
export const TOKEN_PATTERN=/^20\d{6}-[a-z0-9]+$/;
export const TOKEN_IN_TEXT=/20\d{6}-[a-z0-9]+/g;

// Files a bump rewrites. Markdown is excluded on purpose: PATCH-LOG.md and the
// plans quote old tokens as history, and rewriting them would falsify the record.
const CODE_FILE=/\.(?:mjs|js|cjs|json|html|css)$/;
const SKIPPED_DIRECTORY=new Set(['node_modules','.git']);

export const escapeRegExp=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

export function readIfExists(path){
  return existsSync(path)?readFileSync(path,'utf8'):null;
}

export function codeFiles(root=IRONPATH){
  const found=[],queue=[root];
  while(queue.length){
    const directory=queue.pop();
    for(const entry of readdirSync(directory,{withFileTypes:true})){
      if(SKIPPED_DIRECTORY.has(entry.name)||entry.name.startsWith('.')) continue;
      const full=join(directory,entry.name);
      if(entry.isDirectory()) queue.push(full);
      else if(entry.isFile()&&CODE_FILE.test(entry.name)) found.push(full);
    }
  }
  return found.sort();
}

const one=(source,pattern)=>{const match=pattern.exec(source);return match?[match[1]]:[]};
const every=(source,pattern)=>[...source.matchAll(pattern)].map(match=>match[1]);

// Every occurrence of the build token that is not a `?v=` import.
//
// These are the places a hand-made bump forgets. Missing one of them does not
// stop the game from loading, which is exactly why they need a check instead of
// a habit: a phone then keeps serving the previous login art, or the loading
// scene advertises a build the modules do not have.
//
// `patch-notes.mjs` is deliberately part of this list. Its first `build:` field
// belongs to RELEASED_PATCHES[0], and tests/patch-notes.test.mjs requires that
// field to equal release-version.json. After a bump the check therefore fails
// until the new field-notes entry exists - the tool cannot ship a cache wave
// nobody documented.
export const STAMP_ANCHORS=Object.freeze([
  {label:'release-version.json → build',file:'release-version.json',
   find:source=>one(source,/"build":\s*"([^"]+)"/)},
  {label:'index.html → <meta name="ironpath-build">',file:'index.html',
   find:source=>one(source,/<meta name="ironpath-build" content="([^"]+)"/)},
  {label:'index.html → class="build-stamp"',file:'index.html',expect:2,
   find:source=>every(source,/class="build-stamp"[^>]*>BUILD ([^<]+)/g)},
  {label:'ui/login-scene.mjs → LOGIN_SCENE_VERSION',file:'ui/login-scene.mjs',
   find:source=>one(source,/LOGIN_SCENE_VERSION\s*=\s*'([^']+)'/)},
  {label:'patch-notes.mjs → RELEASED_PATCHES[0].build',file:'patch-notes.mjs',
   find:source=>one(source,/RELEASED_PATCHES[\s\S]*?build:'([^']+)'/)},
  {label:'browser-tests/avatar-handover.cjs → Fallback',file:'browser-tests/avatar-handover.cjs',
   find:source=>one(source,/\?\.\s*content\s*\|\|\s*'([^']+)'/)},
  {label:'browser-tests/interface-smoke.cjs → Meldung',file:'browser-tests/interface-smoke.cjs',
   find:source=>one(source,/New version ([0-9a-z-]+)/)},
]);

// Occurrences of an old token that must survive a bump. In `patch-notes.mjs`
// only `?v=` imports move; every `build:` field and every sentence quoting a
// wave stays, because those lines state what was actually released.
export const PROTECTED_FILES=Object.freeze([
  {file:'patch-notes.mjs',
   reason:'build:-Felder und Protokollsätze veröffentlichter Patches bleiben stehen; nur ?v=-Importe wandern'},
]);

export function currentToken(root=IRONPATH){
  const source=readIfExists(join(root,'release-version.json'));
  const match=source&&/"build":\s*"([^"]+)"/.exec(source);
  return match?match[1]:null;
}

// Reads every anchor and reports what it actually found.
export function anchorReport(root=IRONPATH){
  return STAMP_ANCHORS.map(anchor=>{
    const source=readIfExists(join(root,anchor.file));
    const expected=anchor.expect??1;
    const values=source===null?[]:anchor.find(source);
    const unique=[...new Set(values)];
    return {
      label:anchor.label,file:anchor.file,expected,found:values.length,values,unique,
      missingFile:source===null,
      ok:source!==null&&values.length===expected&&unique.length===1,
    };
  });
}

// Which wave tokens the tree carries, and how often. Many old tokens are correct:
// unchanged art and untouched multiplayer assets keep their own revision, so this
// is information for a human, never a verdict on its own.
export function tokenHistogram(root=IRONPATH){
  const counts=new Map();
  for(const file of codeFiles(root)){
    const source=readIfExists(file);
    if(!source) continue;
    for(const match of source.matchAll(TOKEN_IN_TEXT)){
      const entry=counts.get(match[0])??{token:match[0],count:0,files:new Set()};
      entry.count+=1;
      entry.files.add(relative(root,file));
      counts.set(match[0],entry);
    }
  }
  return [...counts.values()].sort((a,b)=>b.count-a.count||a.token.localeCompare(b.token));
}

// ---------------------------------------------------------------------------
// bump: plan, write and verify a new cache wave token across IronPath/.
//
// The bump is mechanical, but two mistakes are easy and both are invisible
// in the game: forgetting one of the places that carry the token outside a
// `?v=` import, and rewriting the historical `build:` fields and sentences
// in patch-notes.mjs, which state what was actually released. The planner
// prints every line that is not a `?v=` import and refuses unknown shapes.
// ---------------------------------------------------------------------------

// Files allowed to carry the token somewhere other than a `?v=` import. Anything
// else is a finding: it means the token leaked into a new place, or an anchor
// moved and this list is out of date.
const ANCHOR_FILES=new Set([
  'release-version.json','index.html','ui/login-scene.mjs',
  'browser-tests/avatar-handover.cjs','browser-tests/interface-smoke.cjs',
]);

export function planBump({root=IRONPATH,from=currentToken(root),to}={}){
  const problems=[];
  if(typeof to!=='string'||!TOKEN_PATTERN.test(to))
    problems.push(`Das neue Token erfüllt nicht 20YYMMDD-name: ${JSON.stringify(to)}`);
  if(typeof from!=='string'||!TOKEN_PATTERN.test(from))
    problems.push(`Kein gültiges altes Token gefunden (release-version.json): ${JSON.stringify(from)}`);
  if(from&&to&&from===to) problems.push('Alt und neu sind dasselbe Token - nichts zu tun.');

  const protectedFiles=new Set(PROTECTED_FILES.map(entry=>entry.file));
  const versioned=new RegExp(`\\?v=${escapeRegExp(from)}`,'g');
  const files=[];const nonVersion=[];const kept=[];
  let tokens=0;

  if(!problems.length) for(const path of codeFiles(root)){
    const source=readIfExists(path);
    if(!source||!source.includes(from)) continue;
    const file=relative(root,path);
    const isProtected=protectedFiles.has(file);
    const touched=[];
    source.split('\n').forEach((line,index)=>{
      if(!line.includes(from)) return;
      const total=line.split(from).length-1;
      const versionedCount=(line.match(versioned)||[]).length;
      const record={line:index+1,text:line.trim().slice(0,150),total,replaced:0};
      if(isProtected){
        // Historical record: only imports move, everything else stays.
        record.replaced=versionedCount;
        if(versionedCount) touched.push({...record,kind:'?v='});
        if(total-versionedCount>0)
          kept.push({file,line:index+1,text:record.text,count:total-versionedCount});
        return;
      }
      record.replaced=total;
      touched.push({...record,kind:versionedCount?'?v=':'anchor'});
      if(total-versionedCount>0){
        const entry={file,line:index+1,text:record.text,count:total-versionedCount};
        nonVersion.push(entry);
        if(!ANCHOR_FILES.has(file))
          problems.push(`Unbekannte Stelle ohne ?v= in ${file}:${index+1} - ANCHOR_FILES prüfen`);
      }
    });
    const count=touched.reduce((sum,entry)=>sum+entry.replaced,0);
    if(count){files.push({file,path,touched});tokens+=count;}
  }

  return {root,from,to,files,tokens,nonVersion,kept,problems,
    anchorFilesTouched:[...new Set(nonVersion.map(entry=>entry.file))].sort()};
}

export function applyBump(plan){
  if(plan.problems.length) throw new Error(`Bump abgelehnt: ${plan.problems.join(' | ')}`);
  const protectedFiles=new Set(PROTECTED_FILES.map(entry=>entry.file));
  const written=[];
  for(const entry of plan.files){
    const source=readFileSync(entry.path,'utf8');
    const out=protectedFiles.has(entry.file)
      ? source.split(`?v=${plan.from}`).join(`?v=${plan.to}`)
      : source.split(plan.from).join(plan.to);
    if(out===source) continue;
    writeFileSync(entry.path,out);
    written.push(entry.file);
  }
  return {written:written.length,files:written};
}

// Re-reads every anchor after writing. A bump that leaves one anchor behind is
// reported here, not by a player with a stale loading screen.
export function verifyBump({root=IRONPATH,to=currentToken(root)}={}){
  const report=anchorReport(root);
  const wrong=report.filter(anchor=>!anchor.ok||anchor.unique[0]!==to);
  return {to,report,wrong,ok:wrong.length===0};
}

export function formatPlan(plan){
  const lines=[
    `Cache-Welle ${plan.from} → ${plan.to}`,
    `${plan.files.length} Dateien, ${plan.tokens} Token-Vorkommen`,
    '',
    `Zeilen ohne ?v= (${plan.nonVersion.length}) - das müssen die bekannten Anker sein:`,
  ];
  for(const entry of plan.nonVersion) lines.push(`  ${entry.file}:${entry.line}  ${entry.text.slice(0,110)}`);
  lines.push('',`Historisch behalten in patch-notes.mjs (${plan.kept.length} Zeilen):`);
  for(const entry of plan.kept) lines.push(`  ${entry.file}:${entry.line}  ${entry.text.slice(0,110)}`);
  if(plan.problems.length){
    lines.push('','PROBLEME:');
    for(const problem of plan.problems) lines.push(`  ${problem}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// check: pre- and post-flight checks for one patch.
//
// This section exists because the same discipline had to be reconstructed
// by hand for every release: which tests pin the stamp, which lines a bump
// must not touch, what proves a merge actually reached the player. It reads
// files, runs the contract tests, and - only when asked - looks at Git,
// GitHub and Pages. It never writes anything and never merges, deploys or
// publishes.
// ---------------------------------------------------------------------------

// The contracts a cache wave or a field-notes entry can break. They run in well
// under two seconds, so they belong to every pre-flight, not only to CI.
export const CONTRACT_TESTS=Object.freeze([
  'repo-structure','build-stamp','multiplayer-build-stamp','patch-notes',
  'release-stage-version','production-cors-probe','translation-coverage',
  'reference-resolution',
]);

// Credential shapes. Only added lines are scanned, and these four files are
// known to contain validation code and obviously fake fixtures instead of keys.
const SECRET_PATTERNS=Object.freeze([
  {name:'PEM-Privatschlüssel',pattern:/-----BEGIN [A-Z ]*PRIVATE KEY-----/},
  {name:'Firebase-Dienstkonto',pattern:/"private_key_id"\s*:/},
  {name:'npm-Token',pattern:/\bnpm_[A-Za-z0-9]{30,}/},
  {name:'GitHub-Token',pattern:/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{20,}/},
]);
const SECRET_ALLOWLIST=Object.freeze(new Map([
  ['IronPath/release-tools/api/session.mjs','Prüfcode: erkennt ein Dienstkonto, enthält keines'],
  ['IronPath/release-tools/session-config.test.mjs','erkennbar falsche Fixture ("not-a-real-private-key")'],
  ['IronPath/tests/release-public-site-config.test.mjs','Negativ-Fixtures der Konfigurationsprüfung'],
  ['IronPath/tests/release-site-packaging.test.mjs','Negativ-Fixture für stageVersion'],
]));

// A nested test run inherits NODE_TEST_CONTEXT=child-v8 and then writes its TAP
// into the parent's channel instead of stdout, which leaves the output empty and
// looks like a crashed run. Stripping it makes this tool behave the same from a
// shell and from inside `node --test` (proved by tests/patch-tooling.test.mjs).
function childEnvironment(){
  const env={...process.env};
  delete env.NODE_TEST_CONTEXT;
  return env;
}

function run(command,args,cwd){
  try{
    return {ok:true,output:execFileSync(command,args,{cwd,env:childEnvironment(),encoding:'utf8',
      stdio:['ignore','pipe','pipe'],timeout:1500000})};
  }catch(error){
    return {ok:false,output:`${error.stdout??''}${error.stderr??''}`,error};
  }
}

// Reads a TAP summary. The label has to be interpolated with RegExp: inside a
// regex literal, `${label}` would be matched as plain text.
export function tapSummary(output){
  const pick=label=>{
    const match=new RegExp(`^#\\s+${label}\\s+(\\d+)$`,'m').exec(output);
    return match?Number(match[1]):NaN;
  };
  const summary={tests:pick('tests'),pass:pick('pass'),fail:pick('fail'),skipped:pick('skipped')};
  const failing=[...output.matchAll(/^not ok \d+ - (.+)$/gm)].map(match=>match[1].trim());
  return {...summary,failing,complete:Number.isFinite(summary.tests)};
}

// Reads PATCH-LOG.md plus its archive and reports what the numbering proves:
// no gap, no duplicate, and - once an archive exists - that the archive holds
// strictly older entries than the log. Splitting the log is only safe if a
// machine checks that nothing was lost or filed twice.
export const LOG_KEEP=20;
export function patchLogState(root){
  const logPath=join(root,'docs','PATCH-LOG.md');
  const archivePath=join(root,'docs','PATCH-LOG-ARCHIV.md');
  const state={present:existsSync(logPath),archivePresent:existsSync(archivePath),
    logIds:[],archiveIds:[],ids:[],entries:0,gaps:[],duplicates:[],misfiled:[],
    newest:null,mentionsToken:false,overflow:0};
  if(!state.present) return state;
  const idPattern=/^## (IPL-\d{4})\b/gm;
  const ids=file=>[...(readIfExists(file)??'').matchAll(idPattern)].map(match=>match[1]);
  const log=ids(logPath);
  const archive=state.archivePresent?ids(archivePath):[];
  state.logIds=log;state.archiveIds=archive;
  const seen=new Set();
  for(const id of [...archive,...log]){
    if(seen.has(id)) state.duplicates.push(id);
    seen.add(id);
  }
  const sorted=[...seen].sort();
  state.ids=sorted;
  state.entries=sorted.length;
  state.newest=sorted.at(-1)??null;
  for(let index=0;index<sorted.length-1;index+=1){
    const current=Number(sorted[index].slice(4)),next=Number(sorted[index+1].slice(4));
    if(next!==current+1) state.gaps.push(`${sorted[index]} → ${sorted[index+1]}`);
  }
  if(state.archivePresent&&archive.length&&log.length){
    const newestArchived=archive.reduce((a,b)=>a>b?a:b);
    const oldestLogged=log.reduce((a,b)=>a<b?a:b);
    if(newestArchived>=oldestLogged)
      state.misfiled.push(`${newestArchived} liegt im Archiv, ${oldestLogged} im Log`);
  }
  // The log keeps the newest LOG_KEEP entries; everything older belongs to the
  // archive. Overflow is a reminder, not an error: a long entry is still valid.
  state.overflow=Math.max(0,log.length-LOG_KEEP);
  const source=readIfExists(logPath)??'';
  const token=currentToken(root);
  const newestBlock=state.newest?source.slice(source.lastIndexOf(`## ${state.newest}`)):'';
  state.mentionsToken=Boolean(token&&newestBlock.includes(token));
  return state;
}

export async function runPatchCheck({root=IRONPATH,contracts=true,suite=false,online=false,
  verifyMain=false,pr=null,base='origin/main',isShallow=null}={}){
  const findings=[];
  const add=(level,check,text)=>findings.push({level,check,text});
  const repoRoot=dirname(resolve(root));
  const token=currentToken(root);

  // 1. Stempel: every anchor carries the same wave.
  if(!token) add('fail','stempel','release-version.json nennt kein build-Token');
  const anchors=anchorReport(root);
  for(const anchor of anchors){
    if(anchor.missingFile) add('warn','stempel',`${anchor.label}: Datei fehlt (${anchor.file})`);
    else if(!anchor.ok) add('fail','stempel',
      `${anchor.label}: ${anchor.found} Fund(e), erwartet ${anchor.expected} - Werte: ${anchor.unique.join(', ')||'keine'}`);
    else if(anchor.unique[0]!==token) add('fail','stempel',
      `${anchor.label} trägt ${anchor.unique[0]}, release-version.json nennt ${token}`);
  }
  if(anchors.every(anchor=>anchor.ok&&anchor.unique[0]===token))
    add('ok','stempel',`${anchors.length} Anker, alle tragen ${token}`);

  // 2. Wellen im Baum: Information, plus eine harte Regel für die Dateien, die
  //    genau eine Welle nennen dürfen. index.html ist bewusst ausgenommen:
  //    unveränderte Kunst und Multiplayer-Assets behalten dort ihre eigene
  //    Revision (?v=20261112-tagless1 und ähnliche). Das ist Vertrag, kein Fund.
  const histogram=tokenHistogram(root);
  const older=histogram.filter(entry=>entry.token!==token);
  add('ok','wellen',`${token} in ${histogram.find(entry=>entry.token===token)?.files.size??0} Dateien; `+
    `${older.length} ältere Token sind bewusst stehen geblieben (Art und Multiplayer-Assets behalten ihre eigene Revision)`);
  for(const entry of older) for(const file of entry.files)
    if(['release-version.json','ui/login-scene.mjs'].includes(file))
      add('fail','wellen',`${file} trägt noch ${entry.token} und darf genau eine Welle nennen`);

  // 3. Struktur der Spielwurzel (billig und ohne Subprozess).
  const docs=root&&readdirSync(root).filter(name=>name.endsWith('.md'));
  if(docs.length>1||!docs.includes('README.md'))
    add('fail','struktur',`Markdown in der Spielwurzel: ${docs.join(', ')||'keins'} - nur README.md gehört dorthin`);
  else add('ok','struktur',`Spielwurzel frei von Doku (${codeFiles(root).length} Codedateien im Baum)`);

  // 4. Patch-Log: lückenlos, aktuell, und der neueste Eintrag kennt die Welle.
  const log=patchLogState(root);
  if(!log.present) add('fail','patchlog','docs/PATCH-LOG.md fehlt');
  else{
    if(log.duplicates.length) add('fail','patchlog',`doppelte Kennungen: ${log.duplicates.join(', ')}`);
    if(log.gaps.length) add('fail','patchlog',`Lücken in der Nummerierung: ${log.gaps.join(', ')}`);
    if(log.misfiled.length) add('fail','patchlog',`Archiv und Log überlappen: ${log.misfiled.join(', ')}`);
    if(!log.duplicates.length&&!log.gaps.length&&!log.misfiled.length)
      add('ok','patchlog',`${log.entries} Einträge IPL-0001…${log.newest} lückenlos`+
        `${log.archivePresent?` (Log ${log.logIds.length} + Archiv ${log.archiveIds.length})`:''}`);
    if(log.overflow) add('warn','patchlog',
      `docs/PATCH-LOG.md führt ${log.logIds.length} Einträge, vorgesehen sind die neuesten ${LOG_KEEP}: `+
      `${log.overflow} ${log.overflow===1?'Eintrag':'Einträge'} nach docs/PATCH-LOG-ARCHIV.md verschieben`);
    if(log.mentionsToken) add('ok','patchlog',`${log.newest} nennt die aktuelle Welle ${token}`);
    else add('warn','patchlog',`${log.newest} nennt ${token} nicht - Eintrag für diese Welle fehlt noch`);
  }

  // 5. Git-Zustand: was ist überhaupt schon gesichert?
  const branch=run('git',['rev-parse','--abbrev-ref','HEAD'],repoRoot);
  if(!branch.ok) add('warn','git','kein Git-Kontext gefunden (rev-parse fehlgeschlagen)');
  else{
    const name=branch.output.trim();
    const dirty=run('git',['status','--porcelain'],repoRoot).output.trim();
    const dirtyCount=dirty?dirty.split('\n').length:0;
    const ahead=run('git',['rev-list','--count',`${base}..HEAD`],repoRoot);
    add(dirtyCount?'warn':'ok','git',`Branch ${name}; ${dirtyCount} uncommittete Änderung(en); `+
      (ahead.ok?`${ahead.output.trim()} Commit(s) vor ${base}`:`Basisvergleich mit ${base} nicht möglich`));

    // A shallow clone silently changes verdicts, so it gets its own finding.
    const shallow=isShallow?isShallow()
      : run('git',['rev-parse','--is-shallow-repository'],repoRoot).output.trim()==='true';
    if(shallow) add('warn','git','flacher Klon: Vorfahren-Prüfungen sind abgeschnitten und damit '+
      'wertlos. Vor release-pages-site, pages-release-pins und jedem Merge-Basis-Vergleich '+
      '`git fetch --unshallow` ausführen.');
    else add('ok','git','voller Klon (nicht flach): Vorfahren-Prüfungen sind aussagekräftig');
  }

  // 6. Geheimnisse: nur neue Zeilen, mit begründeter Ausnahmeliste.
  const diff=run('git',['diff','--unified=0',base,'--','.'],repoRoot);
  if(!diff.ok) add('warn','geheimnisse',`kein Diff gegen ${base} verfügbar - Prüfung übersprungen`);
  else{
    const added=[];let file=null;
    for(const line of diff.output.split('\n')){
      if(line.startsWith('+++ b/')){file=line.slice(6);continue;}
      if(line.startsWith('+')&&!line.startsWith('+++')&&file) added.push({file,text:line.slice(1)});
    }
    const hits=[];
    for(const entry of added){
      if(SECRET_ALLOWLIST.has(entry.file)) continue;
      for(const rule of SECRET_PATTERNS) if(rule.pattern.test(entry.text)) hits.push(`${entry.file}: ${rule.name}`);
    }
    if(hits.length) add('fail','geheimnisse',[...new Set(hits)].join('; '));
    else add('ok','geheimnisse',`${added.length} neue Zeilen gegen ${base} geprüft, kein Zugangsdaten-Muster`);
  }

  // 7. Verträge: die schnellen Testdateien, die eine Welle brechen kann.
  //    cwd ist der Repo-Root, genau wie in CI. Mehrere Tests bauen Pfade mit
  //    "IronPath/" und starten Unterprozesse ohne eigenes cwd (production-cors-
  //    probe, release-pages-site, name-audit, maintenance-rules-prep); aus
  //    IronPath/ heraus laufen sie rot, obwohl nichts kaputt ist.
  if(contracts){
    const rel=relative(repoRoot,root)||'.';
    const present=CONTRACT_TESTS.filter(name=>existsSync(join(root,'tests',`${name}.test.mjs`)));
    if(!present.length) add('warn','verträge',`keine der ${CONTRACT_TESTS.length} Vertrags-Testdateien unter tests/ gefunden`);
    else{
      const files=present.map(name=>join(rel,'tests',`${name}.test.mjs`));
      const result=run('node',['--test-reporter=tap','--test',...files],repoRoot);
      const summary=tapSummary(`${result.output}`);
      if(!summary.complete) add('warn','verträge','Prüflauf ohne TAP-Zusammenfassung');
      else if(summary.fail) add('fail','verträge',
        `${present.length} Dateien: ${summary.tests} Tests, ${summary.fail} FEHLER (${summary.failing.slice(0,4).join(' | ')})`);
      else add('ok','verträge',`${present.length} Dateien: ${summary.tests} Tests, ${summary.pass} grün, ${summary.skipped} übersprungen`);
    }
  }

  // 8. Volle Suite: dieselbe Dateimenge wie der CI-Befehl
  //    `node --test IronPath/tests/*.test.mjs`, vom Repo-Root und ohne -P.
  //    Die Dateiliste wird hier aufgelöst statt der Shell überlassen, damit der
  //    Lauf ohne shell:true auskommt; TAP-Ausgabe dient nur dem Parsen.
  if(suite){
    const rel=relative(repoRoot,root)||'.';
    const all=readdirSync(join(root,'tests')).filter(name=>name.endsWith('.test.mjs')).sort();
    const result=run('node',['--test-reporter=tap','--test',...all.map(name=>join(rel,'tests',name))],repoRoot);
    const summary=tapSummary(`${result.output}`);
    if(!summary.complete) add('fail','suite','Serienlauf ohne TAP-Zusammenfassung - Ausgabe prüfen');
    else if(summary.fail) add('fail','suite',
      `${summary.tests} Tests, ${summary.pass} grün, ${summary.fail} FEHLER (${summary.failing.slice(0,4).join(' | ')})`);
    else add('ok','suite',`Serienlauf vom Repo-Root über ${all.length} Dateien: ${summary.tests} Tests, ${summary.pass} grün, ${summary.skipped} übersprungen, 0 Fehler`);
  }

  // 9. GitHub und Pages: nur mit --online, und nur als Bericht.
  if(online){
    const remote=run('git',['config','--get','remote.origin.url'],repoRoot).output.trim();
    const slug=/github\.com[:/]([^/]+\/[^/.]+)/.exec(remote)?.[1];
    if(!slug) add('warn','online',`kein GitHub-Remote erkennbar (${remote||'leer'})`);
    else{
      const gh=run('gh',['--version'],repoRoot);
      if(!gh.ok) add('warn','online','gh nicht verfügbar - PR-, CI- und Pages-Prüfung übersprungen');
      else{
        const prNumber=pr??null;
        if(prNumber){
          const view=run('gh',['pr','view',String(prNumber),'--json','state,mergedAt,mergeCommit,headRefOid','--repo',slug],repoRoot);
          if(!view.ok) add('fail','online',`PR #${prNumber} nicht lesbar`);
          else{
            const data=JSON.parse(view.output);
            add(data.state==='MERGED'?'ok':'warn','online',
              `PR #${prNumber}: ${data.state}${data.mergedAt?`, gemergt ${data.mergedAt}`:''}, Merge-Commit ${data.mergeCommit?.oid?.slice(0,8)??'?'}`);
          }
          const checks=run('gh',['pr','checks',String(prNumber),'--repo',slug],repoRoot);
          const rows=checks.output.trim()?checks.output.trim().split('\n'):[];
          const failing=rows.filter(row=>/\bfail\b/i.test(row)&&!/pass/.test(row));
          if(!checks.ok&&!rows.length) add('warn','online',`Checks zu PR #${prNumber} nicht lesbar`);
          else if(failing.length) add('fail','online',`${failing.length} rote Checks: ${failing.map(row=>row.split('\t')[0]).join(', ')}`);
          else add('ok','online',`${rows.length} Checks zu PR #${prNumber}, keiner rot`);
        }else add('warn','online','kein --pr angegeben: PR- und CI-Stand nicht geprüft');

        const pages=run('gh',['api',`repos/${slug}/pages/builds/latest`,'--repo',slug],repoRoot);
        if(!pages.ok) add('warn','online','Pages-Build nicht lesbar');
        else{
          const build=JSON.parse(pages.output);
          add(build.status==='built'?'ok':'warn','online',
            `Pages: ${build.status}${build.commit?` aus ${String(build.commit).slice(0,8)}`:''}${build.duration?`, ${build.duration} ms`:''}`);
        }

        if(verifyMain){
          const path=relative(repoRoot,join(root,'release-version.json'));
          const content=run('gh',['api',`repos/${slug}/contents/${path}?ref=main`,'--repo',slug],repoRoot);
          if(!content.ok) add('fail','online',`${path} auf main nicht lesbar`);
          else{
            const live=JSON.parse(Buffer.from(JSON.parse(content.output).content??'','base64').toString('utf8'));
            add(live.build===token?'ok':'fail','online',
              `main liefert ${path} mit build ${live.build} (lokal ${token})`);
          }
          add('warn','online','Nachweisgrad: geprüft sind Repo-Inhalt auf main und der Pages-Baustatus. '+
            'Ein Abruf der live URL ist das nicht - dafür fehlt diesem Werkzeug der ausgehende Zugriff auf den Seiten-Host.');
        }
      }
    }
  }

  return {root,repoRoot,token,findings,failed:findings.some(finding=>finding.level==='fail'),
    warnings:findings.filter(finding=>finding.level==='warn').length};
}

export function formatFindings(result){
  const symbol={ok:'[ ok ]',warn:'[HINWEIS]',fail:'[FEHLER]'};
  const lines=[`Patch-Prüfung für ${result.root} — Welle ${result.token??'unbekannt'}`,
    '─'.repeat(72)];
  let last=null;
  for(const finding of result.findings){
    if(finding.check!==last){lines.push('');lines.push(finding.check.toUpperCase());last=finding.check;}
    lines.push(`  ${symbol[finding.level]} ${finding.text}`);
  }
  lines.push('','─'.repeat(72));
  const failures=result.findings.filter(finding=>finding.level==='fail').length;
  lines.push(failures
    ? `${failures} Fehler, ${result.warnings} Hinweis(e). Nicht veröffentlichen, bevor das geklärt ist.`
    : `Kein Fehler, ${result.warnings} Hinweis(e).`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CLI dispatch. Importing this module (the tests do) never runs the CLI.
// ---------------------------------------------------------------------------

const isMain=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(isMain){
  const [command,...args]=process.argv.slice(2);
  const usage=[
    'Usage:',
    '  node IronPath/scripts/patch.mjs check [--fast|--suite] [--online] [--verify-main] [--pr <nummer>] [--base <ref>] [--root <pfad>] [--no-contracts]',
    '  node IronPath/scripts/patch.mjs bump <neuesToken> [--from <alt>] [--apply] [--root <pfad>]',
  ].join('\n');
  if(command==='bump'){
    const flag=name=>{const index=args.indexOf(name);return index>=0?args[index+1]:null};
    const apply=args.includes('--apply');
    const to=args.find(value=>!value.startsWith('--')&&value!==flag('--from')&&value!==flag('--root'));
    const root=flag('--root')??IRONPATH;
    const from=flag('--from')??currentToken(root);
    if(!to){
      console.log('Usage: node IronPath/scripts/patch.mjs bump <neuesToken> [--from <alt>] [--apply] [--root <pfad>]');
      process.exit(2);
    }
    const plan=planBump({root,from,to});
    console.log(formatPlan(plan));
    if(plan.problems.length){console.log('\nNichts geschrieben.');process.exit(1);}
    if(!apply){console.log('\nTrockenlauf: nichts geschrieben. Mit --apply ausführen.');process.exit(0);}
    const result=applyBump(plan);
    const verdict=verifyBump({root,to});
    console.log(`\nGeschrieben: ${result.written} Dateien.`);
    console.log(verdict.ok
      ? `Anker-Prüfung: alle ${verdict.report.length} Anker tragen ${to}.`
      : `Anker-Prüfung FEHLGESCHLAGEN: ${verdict.wrong.map(entry=>`${entry.label} = ${entry.unique.join('/')||'nichts'}`).join('; ')}`);
    console.log(verdict.ok
      ? 'Nächster Schritt: neuen Eintrag in patch-notes.mjs (RELEASED_PATCHES[0]) und im Patch-Log anlegen.'
      : '');
    process.exit(verdict.ok?0:1);
  }
  if(command==='check'){
    const value=name=>{const index=args.indexOf(name);return index>=0?args[index+1]:null};
    const fast=args.includes('--fast');
    if(fast&&args.includes('--suite')){
      console.log('Widerspruch: --fast laesst die Suite weg, --suite fordert sie an. Eines von beiden streichen.');
      process.exit(2);
    }
    const root=value('--root')??IRONPATH;
    const result=await runPatchCheck({
      root,
      contracts:!args.includes('--no-contracts'),
      suite:args.includes('--suite'),
      online:args.includes('--online'),
      verifyMain:args.includes('--verify-main'),
      pr:value('--pr'),
      base:value('--base')??'origin/main',
    });
    console.log(formatFindings(result));
    process.exit(result.failed?1:0);
  }
  console.log(usage);
  process.exit(2);
}
