import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync,existsSync} from 'node:fs';
import {RANKS,rankForLevel,rankProgress,rankInsigniaSvg,rankTooltip,renderRankInsignia} from '../rank-insignia.mjs';

// rank-insignia translates through its own tokenized language.mjs instance -
// the same module with a different ?v= is a second instance with its own
// state, so the dictionary is configured on exactly the URL the module uses
// (same lesson as tests/production-module.mjs, read from the source so a wave
// bump cannot silently split them again).
const rankSource=readFileSync(new URL('../rank-insignia.mjs',import.meta.url),'utf8');
const languageToken=(rankSource.match(/language\.mjs\?v=([\w-]+)/)||[])[1];
const {setupLanguage,translateText}=await import(`../language.mjs${languageToken?`?v=${languageToken}`:''}`);

// The rank is the replacement for the dog tag (reported: \"passt nicht auf den
// hauptbildschirm und sieht auch sonst scheisse aus\" - removed everywhere): a
// soldier's standing derived from the level, worn in three places. Everything
// the old tag guaranteed must hold here too: derived, never stored, no asset.

test('five ranks with ordered, non-overlapping level thresholds',()=>{
  assert.deepEqual(RANKS.map(r=>r.id),['recruit','private','sergeant','lieutenant','captain']);
  assert.deepEqual(RANKS.map(r=>r.min),[1,3,6,10,15]);
  for(let i=1;i<RANKS.length;i++)assert.ok(RANKS[i].min>RANKS[i-1].min,'thresholds rise');
});

test('rankForLevel maps the boundaries and fails safe',()=>{
  const expected=[[1,'recruit'],[2,'recruit'],[3,'private'],[5,'private'],[6,'sergeant'],[9,'sergeant'],[10,'lieutenant'],[14,'lieutenant'],[15,'captain'],[16,'captain'],[99,'captain']];
  for(const [level,id] of expected)assert.equal(rankForLevel(level).id,id,`level ${level}`);
  // A broken level shows the bare uniform, it never throws.
  assert.equal(rankForLevel(0).id,'recruit');
  assert.equal(rankForLevel(-7).id,'recruit');
  assert.equal(rankForLevel(Number.NaN).id,'recruit');
  assert.equal(rankForLevel(undefined).id,'recruit');
  assert.equal(rankForLevel(3.9).id,'private','a level is whole-numbered downwards');
});

test('rankProgress knows how far in and what comes next',()=>{
  assert.deepEqual(rankProgress(6),{rank:RANKS[2],next:RANKS[3],into:1,span:4});
  assert.deepEqual(rankProgress(15),{rank:RANKS[4],next:null,into:1,span:null});
  assert.equal(rankProgress(4).into,2,'levels 3 and 4 are the second level of Private');
});

test('the insignia draws the right number of chevrons, stars and bars',()=>{
  const count=(svg,cls)=>svg.split(`class="${cls}"`).length-1;
  assert.equal(count(rankInsigniaSvg(RANKS[0]),'bar'),1,'the recruit wears one bare bar');
  assert.equal(count(rankInsigniaSvg(RANKS[0]),'chevron'),0);
  assert.equal(count(rankInsigniaSvg(RANKS[1]),'chevron'),1);
  assert.equal(count(rankInsigniaSvg(RANKS[2]),'chevron'),2);
  assert.equal(count(rankInsigniaSvg(RANKS[3]),'star'),1,'officers wear stars, not chevrons');
  assert.equal(count(rankInsigniaSvg(RANKS[3]),'chevron'),0);
  assert.equal(count(rankInsigniaSvg(RANKS[4]),'star'),2);
  // The mark is one self-contained SVG in the stencil gold, sized as asked.
  const svg=rankInsigniaSvg(RANKS[2],{size:30});
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 48" width="30" height="23"/);
  assert.ok(svg.includes('#e4ca89'),'the stencil gold from the rest of the kit');
  assert.ok(svg.includes('aria-hidden="true"'),'the mark is decoration; the name carries the meaning');
});

test('renderRankInsignia paints into the container and survives missing ones',()=>{
  const container={innerHTML:'',title:''};
  const rank=renderRankInsignia({ok:true},container,{level:11},{size:22});
  assert.equal(rank.id,'lieutenant');
  assert.match(container.innerHTML,/class="star"/);
  assert.equal(renderRankInsignia({ok:true},null,{level:5}),null,'no container: no crash');
  assert.equal(renderRankInsignia(null,container,{level:5}),null,'no document: no crash');
});

test('the rank names and the next-rank line exist in German',()=>{
  setupLanguage({
    document:{documentElement:{},getElementById:()=>({value:'',addEventListener(){}}),querySelectorAll:()=>[]},
    storage:{getItem:key=>key==='ironpath:language'?'de':null,setItem(){}},
  });
  assert.equal(translateText('Recruit'),'Rekrut');
  assert.equal(translateText('Private'),'Gefreiter');
  assert.equal(translateText('Sergeant'),'Feldwebel');
  assert.equal(translateText('Lieutenant'),'Leutnant');
  assert.equal(translateText('Captain'),'Hauptmann');
  assert.equal(translateText('Next rank: {rank} at level {level}',{rank:'Feldwebel',level:6}),'Nächster Rang: Feldwebel ab Stufe 6');
  assert.match(rankTooltip(7),/Feldwebel · STUFE 7/);
  assert.match(rankTooltip(7),/Nächster Rang: Leutnant ab Stufe 10/);
  assert.equal(rankTooltip(20).includes('Next rank'),false,'the top rank has no next');
});

test('the module derives everything and stores nothing',()=>{
  const source=readFileSync(new URL('../rank-insignia.mjs',import.meta.url),'utf8');
  assert.equal(/localStorage|sessionStorage|setItem|runTransaction|\.set\(/.test(source),false,'a rank is never written anywhere');
  assert.ok(!existsSync(new URL('../assets/rank-insignia',import.meta.url)),'no asset: the mark is procedural');
});

test('the rank is worn in all three places the concept promised',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  // Menu card corner, dossier rail, combat profile strip.
  const menu=html.indexOf('id="menuRank"'),rail=html.indexOf('id="soldierRank"'),profile=html.indexOf('id="profileRank"'),card=html.indexOf('class="command-soldier"');
  assert.ok(card>0&&menu>card&&menu<html.indexOf('command-soldier-actions'),'the menu card carries the rank chip');
  assert.ok(rail>html.indexOf('id="soldierLevelDisplay"'),'the dossier rail shows the rank under the level');
  assert.ok(profile>html.indexOf('id="profileName"'),'the combat profile strip shows it beside the name');
  const css=readFileSync(new URL('../interface-redesign.css',import.meta.url),'utf8');
  for(const cls of ['.rank-badge-menu','.soldier-rank','.rank-badge-profile'])assert.ok(css.includes(cls),`styled: ${cls}`);
  // The painters are wired: account.js refreshes the profile strip on every
  // snapshot and on language change, the menu card and the dossier re-render
  // themselves with it.
  const account=readFileSync(new URL('../account.js',import.meta.url),'utf8');
  assert.match(account,/function refreshProfileRank\(value\)\{[\s\S]{0,400}renderRankInsignia\(document,document\.getElementById\('profileRank'\)/);
  assert.match(account,/refreshProfileRank\(value\);/,'the snapshot callback paints it');
  assert.match(account,/refreshProfileRank\(profile\);/,'the language change repaints it');
  const menuCard=readFileSync(new URL('../command-center.mjs',import.meta.url),'utf8');
  assert.match(menuCard,/renderRankInsignia\(document,\$\('menuRank'\),\{level:p\.level\},\{size:22\}\)/);
  const dossier=readFileSync(new URL('../soldier-screen.mjs',import.meta.url),'utf8');
  assert.match(dossier,/renderRankInsignia\(document,\$\('soldierRank'\),\{level:data\.level\},\{size:30\}\)/);
  assert.match(dossier,/\$\('soldierRankName'\)\.textContent=tr\(rank\.name\)/,'the rank name is written out, not just drawn');
});
