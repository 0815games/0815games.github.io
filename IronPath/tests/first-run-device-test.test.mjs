import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {setupLanguage,translateText} from '../language.mjs';

// The device test plan quotes the exact German a tester must look for. If a
// translation is reworded, the plan silently starts describing a screen that no
// longer exists, and a tester "fails" a working build. Pin the quoted strings.
setupLanguage({
 document:{documentElement:{},getElementById:()=>({value:'',addEventListener(){}}),querySelectorAll:()=>[]},
 storage:{getItem:key=>key==='ironpath:language'?'de':null,setItem(){}},
});

const plan=readFileSync(new URL('../FIRST-RUN-DEVICE-TEST.md',import.meta.url),'utf8');

test('the device plan quotes the German the build actually shows',()=>{
 // Strings the app translates at runtime: the plan must quote what translateText
 // plus its placeholders really produce.
 const translated=[
  ['contract title',translateText('TRAINING CONTRACT · HANDLE WITH CARE'),'AUSBILDUNGSVERTRAG · MIT VORSICHT'],
  ['wave tally',translateText('WAVE {wave} / {total}',{wave:1,total:6}),'WELLE 1 / 6'],
  ['wave status',translateText('Clear {remaining} more wave(s). Enemies are weakened here and your bunker is reinforced.',{remaining:5}),
   'Noch 5 Welle(n) schaffen. Hier sind die Gegner geschwächt und dein Bunker ist verstärkt.'],
  ['contract complete',translateText('Training contract complete! {xp} XP earned. Welcome to the Iron Path, soldier.',{xp:450}),
   'Ausbildungsvertrag erfüllt! 450 XP verdient. Willkommen auf dem Eisernen Pfad, Soldat.'],
  // The first-run cards replaced the 11-step modal, so the plan quotes those now.
  ['coach tally',translateText('FIRST RUN · {step} / {total}',{step:1,total:6}),'ERSTER EINSATZ · 1 / 6'],
  ['coach welcome',translateText('Welcome, soldier'),'Willkommen, Soldat'],
  ['coach build',translateText('Build a tower'),'Baue einen Turm'],
  ['coach boss',translateText('The boss is here'),'Der Boss ist da'],
  ['coach done',translateText('GOT IT'),'VERSTANDEN'],
  ['tag note',translateText('Derived, not recorded.'),'Abgeleitet, nicht erfasst.'],
  ['tag award',translateText('Your dog tag'),'Deine Hundemarke'],
 ];
 for(const [name,actual,quoted] of translated){
  assert.equal(actual,quoted,`${name} no longer matches the plan`);
  assert.ok(plan.replace(/\s+/g,' ').includes(quoted),`the plan must quote ${name}: ${quoted}`);
 }
 // The gate's copy is written in both languages in the markup, not translated at
 // runtime, so it is checked against the page itself rather than the dictionary.
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const gate=html.match(/<section id="languageGate"[\s\S]*?<\/section>/)?.[0]??'';
 const flatGate=gate.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
 for(const sentence of [
  'You can change this later at the top of the screen.',
  'Du kannst die Sprache später oben im Bildschirm ändern.',
  'SPRACHE WÄHLEN',
 ]){
  assert.ok(flatGate.includes(sentence),`the gate must show: ${sentence}`);
  assert.ok(plan.replace(/\s+/g,' ').includes(sentence),`the plan must quote the gate sentence: ${sentence}`);
 }
 // The German line really is marked as German for screen readers and fonts, and
 // it is the FIRST thing after the tiles so a German reader finds it without
 // reading the English sentence above it.
 assert.match(gate,/<span lang="de">Du kannst die Sprache/);
 // The flags are images, not emoji: Windows renders flag emoji as the bare
 // letters "GB"/"DE", which is the opposite of recognising a language quickly.
 assert.match(gate,/<img src="assets\/flag-gb\.svg"/);
 assert.match(gate,/<img src="assets\/flag-de\.svg"/);
 assert.doesNotMatch(gate,/\u{1F1EC}\u{1F1E7}|\u{1F1E9}\u{1F1EA}/u,'no flag emoji in the gate');
});

test('the plan lists the keys a tester has to clear to repeat a first run',()=>{
 for(const key of ['ironpath:language','ironpath:tutorial:v2:','ironpath:training:v2:','ironpath:coach:v2:','ironpath:firstrun:v2:']){
  assert.ok(plan.includes(key),`${key} must be documented, or a tester cannot repeat the run`);
 }
});

test('the plan covers every open first-run checklist row',()=>{
 const checklist=readFileSync(new URL('../CHECKLIST.md',import.meta.url),'utf8');
 assert.match(checklist,/Validate the first run on a real phone and a real desktop browser/);
 assert.ok(plan.includes('real phone'));
 assert.ok(plan.includes('Fullscreen'),'fullscreen validation is a checklist row');
 assert.ok(plan.includes('Skill UI'),'the skill UI touch pass is a checklist row');
});
