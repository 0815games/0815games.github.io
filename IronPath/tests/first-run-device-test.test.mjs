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
  ['sample banner',translateText('Nothing you do here is saved. Your soldier is not changed.'),
   'Nichts, was du hier tust, wird gespeichert. Dein Soldat bleibt unverändert.'],
  ['contract title',translateText('TRAINING CONTRACT · HANDLE WITH CARE'),'AUSBILDUNGSVERTRAG · MIT VORSICHT'],
  ['wave tally',translateText('WAVE {wave} / {total}',{wave:1,total:6}),'WELLE 1 / 6'],
  ['wave status',translateText('Clear {remaining} more wave(s). Enemies are weakened here and your bunker is reinforced.',{remaining:5}),
   'Noch 5 Welle(n) schaffen. Hier sind die Gegner geschwächt und dein Bunker ist verstärkt.'],
  ['contract complete',translateText('Training contract complete! {xp} XP earned. Welcome to the Iron Path, soldier.',{xp:330}),
   'Ausbildungsvertrag erfüllt! 330 XP verdient. Willkommen auf dem Eisernen Pfad, Soldat.'],
  ['briefing tally',translateText('FIELD BRIEFING · {step} / {total}',{step:7,total:11}),'FELDEINWEISUNG · 7 / 11'],
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
  'Pick the language for this device. You can change it later at the top of the screen.',
  'Wähle die Sprache für dieses Gerät. Du kannst sie später oben im Bildschirm ändern.',
  'SPRACHE WÄHLEN',
 ]){
  assert.ok(flatGate.includes(sentence),`the gate must show: ${sentence}`);
  assert.ok(plan.replace(/\s+/g,' ').includes(sentence),`the plan must quote the gate sentence: ${sentence}`);
 }
 // And the German line really is marked as German for screen readers and fonts.
 assert.match(gate,/<span lang="de">Wähle die Sprache/);
});

test('the plan lists the keys a tester has to clear to repeat a first run',()=>{
 for(const key of ['ironpath:language','ironpath:tutorial:v2:','ironpath:training:v1:','ironpath:firstrun:v1:']){
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
