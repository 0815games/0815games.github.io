import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {RELEASED_PATCHES,PLANNED_PATCHES,PATCH_STATUS,PATCH_LABELS,createPatchNotes,patchText,renderPatchEntry} from '../patch-notes.mjs';

const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

// A minimal document: the panels are filled with innerHTML, the tabs only need
// aria-selected and `hidden`, and the dialog only needs open/close.
const CURRENT_BUILD=JSON.parse(read('release-version.json')).build;
function fixture({build=CURRENT_BUILD}={}){
  const nodes=new Map(),events=[];
  const el=id=>{
    if(!nodes.has(id))nodes.set(id,{id,hidden:false,innerHTML:'',textContent:'',open:false,dataset:{},
      attributes:{},setAttribute(name,value){this.attributes[name]=String(value);},getAttribute(name){return this.attributes[name]??null;},
      addEventListener(type,handler){(this.handlers??={})[type]=handler;},close(){this.open=false;events.push(['close',this.id]);},
      showModal(){this.open=true;events.push(['showModal',this.id]);}});
    return nodes.get(id);
  };
  const document={
    getElementById:el,
    querySelector:selector=>selector==='meta[name="ironpath-build"]'?{content:build}:null,
  };
  const ui=createPatchNotes({document});
  return {ui,el,events,nodes};
}

// The data is the part a player reads. If one bullet ships without German, a
// German client shows English - the exact thing the translation guard exists
// for. This walks every string in both lists, including the ones no test name
// mentions, so a new entry cannot quietly arrive half-translated.
test('every field note is authored in German and English',()=>{
  const entries=[...RELEASED_PATCHES,...PLANNED_PATCHES];
  assert.ok(entries.length>=10,'the notes carry the released patches and the planned blocks');
  for(const entry of entries){
    assert.ok(entry.id,`entry needs an id: ${JSON.stringify(entry.title)}`);
    for(const field of ['title']){
      assert.equal(typeof patchText(entry[field],'en'),'string');
      assert.ok(patchText(entry[field],'en').length,`${entry.id}.${field} needs English`);
      assert.ok(patchText(entry[field],'de').length,`${entry.id}.${field} needs German`);
    }
    for(const key of ['shipped','open']){
      assert.ok(Array.isArray(entry[key])&&entry[key].length,`${entry.id}.${key} must not be empty`);
      for(const [index,item] of entry[key].entries()){
        assert.ok(patchText(item,'en').length,`${entry.id}.${key}[${index}] needs English`);
        assert.ok(patchText(item,'de').length,`${entry.id}.${key}[${index}] needs German`);
      }
    }
    if(entry.note){
      assert.ok(patchText(entry.note,'en').length,`${entry.id}.note needs English`);
      assert.ok(patchText(entry.note,'de').length,`${entry.id}.note needs German`);
    }
  }
  for(const [key,value] of Object.entries({...PATCH_STATUS,...PATCH_LABELS})){
    assert.ok(patchText(value,'en').length&&patchText(value,'de').length,`label ${key} needs both languages`);
  }
});

test('the released list only claims builds that actually shipped, newest first',()=>{
  const manifest=JSON.parse(read('release-version.json')).build;
  assert.equal(RELEASED_PATCHES[0].build,manifest,'the newest note is the build the site is running');
  const builds=RELEASED_PATCHES.map(entry=>entry.build);
  // PR #286 predates release-version.json; claiming a build for it would invent
  // a release tag. Everything newer must carry the exact shipped value.
  assert.equal(builds.filter(build=>build===null).length,1,'exactly the pre-manifest release has no build');
  for(const entry of RELEASED_PATCHES.slice(0,-1)){
    assert.match(entry.build,/^2026\d{4}-[a-z0-9]+$/,`${entry.id} has a real build id`);
    assert.ok(entry.pr>=286,`${entry.id} names its pull request`);
  }
  const html=read('index.html');
  assert.ok(html.includes(`<meta name="ironpath-build" content="${manifest}">`),'the page advertises the same build the notes claim');
});

// Block 9 sits directly before Block 6 so the guided tutorial introduces the
// redesigned Command HQ, while Block 7 (life/counter-attack/repair) stays last.
test('block 7 is a planned future patch and stays last in the agreed order',()=>{
  const ids=PLANNED_PATCHES.map(entry=>entry.id);
  assert.deepEqual(ids,['block1','block2','block3','block4','block5','block9','block6','block7'],'the plan keeps the operator order');
  const block7=PLANNED_PATCHES.at(-1);
  assert.equal(block7.status,'next');
  assert.ok(block7.note,'block 7 says why it comes last');
  const text=`${patchText(block7.title,'en')} ${block7.open.map(item=>patchText(item,'en')).join(' ')}`.toLowerCase();
  for(const word of ['life','soldiers','towers','repair','warning'])
    assert.ok(text.includes(word),`block 7 mentions ${word}`);
  const german=block7.open.map(item=>patchText(item,'de')).join(' ').toLowerCase();
  for(const word of ['leben','soldaten','türme','reparatur','vorwarnung'])
    assert.ok(german.includes(word),`block 7 mentions ${word} in German`);
  // The standing constraint: no permanent loss of progress or equipment.
  assert.match(block7.open.map(item=>patchText(item,'en')).join(' '),/No permanent loss/i);
  assert.match(block7.open.map(item=>patchText(item,'de')).join(' '),/kein dauerhafter verlust/i);
  // Blocks 9 and 6 shipped ahead of Block 7; Block 7 is now next in line.
  const block9=PLANNED_PATCHES.find(entry=>entry.id==='block9');
  const block6=PLANNED_PATCHES.find(entry=>entry.id==='block6');
  assert.equal(block9?.status,'planned');
  assert.equal(block6?.status,'planned');
});

test('the view renders both lists, marks the running build and reacts to the tab buttons',()=>{
  const f=fixture();
  const released=f.el('patchNotesReleased').innerHTML,planned=f.el('patchNotesPlanned').innerHTML;
  assert.match(released,/patch-entry/,'the released panel is filled from data');
  assert.match(planned,/data-patch="block7"/,'the planned panel carries every block, block 7 included');
  assert.equal((planned.match(/class="patch-entry"/g)||[]).length,PLANNED_PATCHES.length,'one card per planned block');
  assert.equal((released.match(/class="patch-entry"/g)||[]).length,RELEASED_PATCHES.length,'one card per release');
  // Exactly one live card: the build the player is running.
  assert.equal((released.match(/data-live="true"/g)||[]).length,1);
  assert.match(released,new RegExp(`data-live="true"[^>]*>[\\s\\S]*?${CURRENT_BUILD}`),'the live card is the newest release');
  assert.equal((planned.match(/data-live="true"/g)||[]).length,0,'a planned block is never marked live');
  assert.match(f.el('patchNotesBuild').textContent,new RegExp(CURRENT_BUILD),'the header shows the installed build');
  assert.match(f.el('patchNotesBuild').textContent,/INSTALLIERTER BUILD|INSTALLED BUILD/,'labelled, not a bare number');
  // The build comes from the page, so it cannot drift from the files that loaded.
  assert.equal(f.ui.build,CURRENT_BUILD);
  // Tabs: released first, and switching swaps the panels without a reload.
  assert.equal(f.el('patchNotesTabLive').getAttribute('aria-selected'),'true');
  assert.equal(f.el('patchNotesTabNext').getAttribute('aria-selected'),'false');
  assert.equal(f.el('patchNotesReleased').hidden,false);
  assert.equal(f.el('patchNotesPlanned').hidden,true);
  f.el('patchNotesTabNext').handlers.click();
  assert.equal(f.ui.tab,'planned');
  assert.equal(f.el('patchNotesPlanned').hidden,false);
  assert.equal(f.el('patchNotesReleased').hidden,true);
  assert.equal(f.el('patchNotesTabNext').getAttribute('aria-selected'),'true');
});

test('opening shows the dialog, and the close button and Escape only close it',()=>{
  const f=fixture();
  assert.equal(f.el('patchNotes').open,false,'the notes do not open themselves');
  assert.equal(f.ui.open('released'),true);
  assert.equal(f.el('patchNotes').open,true);
  assert.equal(f.ui.tab,'released');
  f.el('patchNotesClose').handlers.click();
  assert.equal(f.el('patchNotes').open,false);
  // Escape fires `cancel`; without preventDefault the browser would close the
  // dialog behind the game's back, the same way the settings dialog handles it.
  assert.equal(f.ui.open('planned'),true);
  let defaultPrevented=false;
  f.el('patchNotes').handlers.cancel({preventDefault(){defaultPrevented=true;}});
  assert.equal(defaultPrevented,true,'cancel is handled, not left to the browser');
  assert.equal(f.el('patchNotes').open,false,'and it closes');
});

test('the rendered list escapes its text and keeps released and open work apart',()=>{
  // A bullet with markup must never become markup: the notes are read by every
  // signed-in player, so the screen is not a place to trust a string.
  const html=renderPatchEntry({id:'x',build:'b',pr:1,title:{en:'A & B <script>',de:'A & B <script>'},
    shipped:[{en:'<img onerror=1>',de:'<img onerror=1>'}],open:[{en:'o',de:'o'}]},'released','en',null);
  // Escaping means no tag can be built from a string: the angle brackets are
  // what matter, the attribute text itself stays readable.
  assert.doesNotMatch(html,/<\s*(script|img)\b/i,'text is escaped');
  assert.match(html,/&lt;script&gt;/,'and still readable');
  assert.match(html,/&lt;img onerror=1&gt;/,'an injected attribute is text, not markup');
  assert.match(html,/patch-list-done/,'shipped work has its own list');
  assert.match(html,/patch-list-open/,'open work has its own list');
  assert.match(html,/>Shipped</);
  assert.match(html,/>Still open</);
  // German is chosen by the language, not by the browser or a stored setting.
  assert.match(renderPatchEntry({id:'x',build:'b',pr:1,title:{en:'EN',de:'DE'},shipped:[{en:'s',de:'s'}],open:[{en:'o',de:'o'}]},'released','de',null),/>Veröffentlicht</);
  assert.match(renderPatchEntry({id:'x',status:'planned',title:{en:'EN',de:'DE'},shipped:[{en:'s',de:'s'}],open:[{en:'o',de:'o'}]},'planned','de',null),/GEPLANT/);
});

// The bug CI caught: a closed <dialog> is hidden by a BROWSER rule
// (`display:none`), so any author `display` on the dialog itself beats it and
// leaves the notes lying open over the whole game - every click then lands in
// the notes instead of the match. Keep a guard on it; it is invisible in a
// unit test and obvious on a phone.
test('the notes dialog stays hidden while it is closed',()=>{
  const css=read('patch-notes.css');
  const rules=[...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(match=>({selector:match[1].trim(),body:match[2]}));
  // Only rules whose SUBJECT is the dialog matter: `.patch-notes-tabs` is a
  // child and may lay itself out however it likes.
  const isDialog=selector=>selector.split(',').some(part=>/(^|[>+~])(dialog)?\.patch-notes(\[[^\]]*\])?$/.test(part.trim()));
  let scoped=0;
  for(const rule of rules){
    if(!isDialog(rule.selector)||!/display\s*:/.test(rule.body))continue;
    assert.match(rule.selector,/\[open\]|::backdrop/,
      `a display rule on the dialog must be scoped to [open]: ${rule.selector}`);
    scoped++;
  }
  assert.ok(scoped>0,'the open dialog is still laid out as a column');
  assert.doesNotMatch(css,/\.patch-notes[^{[\n]*\{[^}]*position\s*:\s*fixed/,'the dialog keeps the native centred position');
});

test('the dialog and its menu entry exist in the real page and are wired',()=>{
  const html=read('index.html'),account=read('account.js');
  for(const id of ['patchNotes','patchNotesClose','patchNotesBuild','patchNotesTabLive','patchNotesTabNext','patchNotesReleased','patchNotesPlanned','menuPatchNotes'])
    assert.ok(html.includes(`id="${id}"`),'page carries #'+id);
  const utilities=html.indexOf('class="command-utilities"');
  const button=html.indexOf('id="menuPatchNotes"');
  const settings=html.indexOf('id="menuSettings"');
  assert.ok(utilities>0&&button>utilities&&button<settings,'the FIELD NOTES entry sits in the utility row before SETTINGS');
  assert.match(account,new RegExp(`patch-notes\\.mjs\\?v=${CURRENT_BUILD}`),'the account imports the notes on the current cache wave');
  assert.match(account,/\$\('menuPatchNotes'\)\.onclick=[^\n]*patchNotes\.open/,'the menu button opens the notes');
  assert.match(account,/onLanguageChange\(\(\)=>patchNotes\.render\(\)\)/,'a language switch repaints the list');
  assert.ok(html.includes('patch-notes.css?v='),'the stylesheet is linked and versioned');
  // The tab labels are translated like every other surface string, so the
  // German client is not left with English chips.
  const german=read('i18n/localization-de.mjs');
  for(const key of ['"FIELD NOTES"','"Field notes"','"Close field notes"','"RELEASED"','"Field notes sections"'])
    assert.ok(german.includes(key),'German entry for '+key);
});
