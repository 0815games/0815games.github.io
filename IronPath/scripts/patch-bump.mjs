// Writes a new cache wave token across IronPath/.
//
// The bump is mechanical, but two mistakes are easy and both are invisible in the
// game: forgetting one of the places that carry the token outside a `?v=` import,
// and rewriting the historical `build:` fields and sentences in patch-notes.mjs,
// which state what was actually released. This tool plans the change, prints
// every line that is not a `?v=` import, and refuses unknown shapes.
//
// Usage:
//   node IronPath/scripts/patch-bump.mjs 20261122-order1            # Trockenlauf
//   node IronPath/scripts/patch-bump.mjs 20261122-order1 --apply    # schreiben
//   node IronPath/scripts/patch-bump.mjs <neu> --from <alt> --root <pfad>
import {readFileSync,writeFileSync} from 'node:fs';
import {relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {
  IRONPATH,TOKEN_PATTERN,anchorReport,codeFiles,currentToken,escapeRegExp,
  PROTECTED_FILES,readIfExists,
} from './patch-lib.mjs';

// Files allowed to carry the token somewhere other than a `?v=` import. Anything
// else is a finding: it means the token leaked into a new place, or an anchor
// moved and this list is out of date.
const ANCHOR_FILES=new Set([
  'release-version.json','index.html','login-scene.mjs',
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

const isMain=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;
if(isMain){
  const args=process.argv.slice(2);
  const flag=name=>{const index=args.indexOf(name);return index>=0?args[index+1]:null};
  const apply=args.includes('--apply');
  const to=args.find(value=>!value.startsWith('--')&&value!==flag('--from')&&value!==flag('--root'));
  const root=flag('--root')??IRONPATH;
  const from=flag('--from')??currentToken(root);
  if(!to){
    console.log('Usage: node IronPath/scripts/patch-bump.mjs <neuesToken> [--from <alt>] [--apply] [--root <pfad>]');
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
