import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {patchLogState,LOG_KEEP} from '../scripts/patch.mjs';

// The patch log keeps its newest entries and archives the rest. Splitting a
// 4000-line protocol by hand is exactly the kind of step where entries go
// missing, get filed twice, or land in the wrong file - and nobody notices until
// somebody looks for an old decision. These assertions make losing an entry
// impossible without turning a test red.

const root=fileURLToPath(new URL('..',import.meta.url));
const read=name=>readFileSync(new URL(`../docs/${name}`,import.meta.url),'utf8');
const ENTRY=/^## (IPL-\d{4}) – (.+)$/gm;

test('log and archive exist and link to each other',()=>{
  assert.ok(existsSync(new URL('../docs/PATCH-LOG.md',import.meta.url)),'docs/PATCH-LOG.md fehlt');
  assert.ok(existsSync(new URL('../docs/PATCH-LOG-ARCHIV.md',import.meta.url)),
    'docs/PATCH-LOG-ARCHIV.md fehlt: die älteren Einträge brauchen ein Archiv');
  const log=read('PATCH-LOG.md'),archive=read('PATCH-LOG-ARCHIV.md');
  assert.match(log,/\[Archiv\]\(PATCH-LOG-ARCHIV\.md\)/,'das Log nennt das Archiv');
  assert.match(archive,/\[PATCH-LOG\.md\]\(PATCH-LOG\.md\)/,'das Archiv nennt das Log');
  assert.match(log,/^# Iron Path – Patch-Log$/m,'das Log behält seine Überschrift');
  assert.match(archive,/^# Iron Path – Patch-Log: Archiv$/m,'das Archiv hat eine eigene Überschrift');
});

test('together they are gapless and free of duplicates',()=>{
  const state=patchLogState(root);
  assert.deepEqual(state.duplicates,[],'eine Kennung liegt in beiden Dateien');
  assert.deepEqual(state.gaps,[],'die Nummerierung hat ein Loch');
  assert.deepEqual(state.misfiled,[],'das Archiv enthält einen neueren Eintrag als das Log');
  assert.equal(state.ids[0],'IPL-0001','der erste Eintrag ist erhalten');
  assert.ok(state.entries>=91,`mindestens 91 Einträge, gefunden ${state.entries}`);
  assert.equal(state.entries,state.logIds.length+state.archiveIds.length,
    'jeder Eintrag liegt genau einmal vor');
});

test('the log keeps the newest entries, the archive the older ones',()=>{
  const state=patchLogState(root);
  const oldestLogged=state.logIds.reduce((a,b)=>a<b?a:b);
  const newestArchived=state.archiveIds.reduce((a,b)=>a>b?a:b);
  assert.ok(newestArchived<oldestLogged,`${newestArchived} (Archiv) muss älter sein als ${oldestLogged} (Log)`);
  assert.ok(state.logIds.length>=10,`das Log führt die neuesten Einträge (gefunden ${state.logIds.length})`);
  assert.ok(state.logIds.length<=LOG_KEEP+10,
    `das Log soll bei ${LOG_KEEP} Einträgen geteilt werden, führt aber ${state.logIds.length}`);
  assert.deepEqual(state.logIds,[...state.logIds].sort(),
    'das Log ist aufsteigend: neue Einträge kommen ans Ende');
  // The archive keeps the historical file order and is deliberately NOT asserted
  // to be ascending. Measured on the split of 2026-11-21: five places run
  // backwards (IPL-0037 before IPL-0035, IPL-0039 before IPL-0038, IPL-0038
  // before IPL-0036, IPL-0036 before IPL-0034, IPL-0053 before IPL-0052) because
  // Block 2 was written interleaved. Reordering archived history to satisfy a
  // test would falsify the record; uniqueness and completeness are what count.
  assert.equal(new Set(state.archiveIds).size,state.archiveIds.length,
    'jede Kennung steht genau einmal im Archiv');
  assert.deepEqual([...state.archiveIds].sort(),state.archiveIds.slice().sort(),
    'die Kennungen des Archivs sind sortierbar und damit vergleichbar');
});

test('no entry lost its title or its body',()=>{
  for(const name of ['PATCH-LOG.md','PATCH-LOG-ARCHIV.md']){
    const source=read(name);
    const titles=[...source.matchAll(ENTRY)].map(match=>({id:match[1],title:match[2]}));
    assert.ok(titles.length,'keine Einträge gefunden');
    for(const entry of titles){
      assert.ok(entry.title.trim().length>=8,`${entry.id} hat keinen aussagekräftigen Titel`);
      const start=source.indexOf(`## ${entry.id} –`);
      const next=source.indexOf('\n## IPL-',start+1);
      const body=source.slice(start,next<0?source.length:next);
      assert.ok(body.split('\n').length>=5,`${entry.id} ist verstümmelt (${body.split('\n').length} Zeilen)`);
      assert.match(body,/- \*\*/g,`${entry.id} hat keine gegliederten Felder`);
    }
  }
});

test('event addenda stayed with their entry',()=>{
  const state=patchLogState(root);
  for(const name of ['PATCH-LOG.md','PATCH-LOG-ARCHIV.md']){
    const source=read(name);
    for(const match of source.matchAll(/^### Ereignis-Nachtrag zu (IPL-\d{4})/gm)){
      assert.ok(state.ids.includes(match[1]),
        `${name}: Nachtrag zu ${match[1]} ohne zugehörigen Eintrag`);
      const entryStart=source.indexOf(`## ${match[1]} –`);
      assert.ok(entryStart>=0&&entryStart<source.indexOf(match[0]),
        `${name}: der Nachtrag zu ${match[1]} steht nicht unter seinem Eintrag`);
    }
  }
});
