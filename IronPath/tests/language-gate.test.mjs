import {test} from 'node:test';import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
import {LANGUAGE_KEY,needsLanguageChoice,isSupportedLanguage,setupLanguageGate} from '../language-gate.mjs';

const memory=(initial={})=>{const data={...initial};return {getItem:key=>Object.hasOwn(data,key)?data[key]:null,setItem:(key,value)=>{data[key]=String(value);},removeItem:key=>{delete data[key];},dump:()=>data};};

// Just enough DOM for the gate: querySelectorAll over [data-language] buttons.
function fakeGate(buttons){
 const handlers={};
 return {
  hidden:false,
  querySelectorAll:sel=>sel==='[data-language]'?buttons:[],
  querySelector:sel=>sel==='[data-language]'?buttons[0]||null:null,
  handlers,
 };
}
function fakeButton(language){
 const button={dataset:{language},focus(){button.focused=true;},listeners:{},addEventListener(type,fn){button.listeners[type]=fn;},click(){button.listeners.click?.();},focused:false};
 return button;
}

test('a device is asked only until it has a stored, supported language',()=>{
 assert.equal(needsLanguageChoice(memory()),true,'a fresh device must be asked');
 assert.equal(needsLanguageChoice(memory({[LANGUAGE_KEY]:'en'})),false);
 assert.equal(needsLanguageChoice(memory({[LANGUAGE_KEY]:'de'})),false);
 assert.equal(needsLanguageChoice(memory({[LANGUAGE_KEY]:'fr'})),true,'an unsupported value asks again');
 assert.equal(needsLanguageChoice(memory({[LANGUAGE_KEY]:''})),true);
 assert.equal(needsLanguageChoice({getItem(){throw Error('blocked');}}),true,'blocked storage still asks rather than guessing');
 assert.equal(needsLanguageChoice(null),true);
});

test('only languages the game can render are accepted',()=>{
 assert.equal(isSupportedLanguage('en'),true);
 assert.equal(isSupportedLanguage('de'),true);
 for(const value of ['fr','EN','',null,undefined,1])assert.equal(isSupportedLanguage(value),false);
});

test('choosing stores the language, closes the gate and reloads once',()=>{
 const storage=memory(),buttons=[fakeButton('en'),fakeButton('de')],gate=fakeGate(buttons);
 let reloads=0;
 const control=setupLanguageGate({document:{getElementById:id=>id==='languageGate'?gate:null,querySelectorAll:()=>buttons,documentElement:{dataset:{}}},storage,reload:()=>{reloads++;}});
 assert.equal(control.open,true);
 assert.equal(buttons[0].focused,true,'the first choice takes focus for keyboard users');
 buttons[1].click();
 assert.equal(storage.getItem(LANGUAGE_KEY),'de','the choice is remembered for this device');
 assert.equal(gate.hidden,true,'the gate closes immediately');
 assert.equal(reloads,1,'the page reloads to initialise every module in the new language');
});

test('an unsupported choice is ignored',()=>{
 const storage=memory(),buttons=[fakeButton('en')],gate=fakeGate(buttons);
 const control=setupLanguageGate({document:{getElementById:id=>id==='languageGate'?gate:null,querySelectorAll:()=>buttons,documentElement:{dataset:{}}},storage,reload:()=>{}});
 assert.equal(control.choose('fr'),false);
 assert.equal(storage.getItem(LANGUAGE_KEY),null,'nothing is stored for an unsupported language');
 assert.equal(gate.hidden,false,'the gate stays open');
});

test('a missing gate is a harmless no-op',()=>{
 const control=setupLanguageGate({document:{getElementById:()=>null,querySelectorAll:()=>[],documentElement:{dataset:{}}},storage:memory(),reload:()=>{}});
 assert.equal(control.open,false);
 assert.doesNotThrow(()=>control.choose('de'));
});

test('the page gates first, plays the intro only after a choice, and offers both languages',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const intro=await readFile(new URL('../intro.mjs',import.meta.url),'utf8');
 // The bootstrap must run inline before any module so English text never flashes.
 const bootstrapAt=html.indexOf("document.documentElement.dataset.langGate");
 const gateAt=html.indexOf('id="languageGate"'),introAt=html.indexOf('id="introOverlay"');
 assert.ok(bootstrapAt>0&&gateAt>bootstrapAt&&introAt>gateAt,'bootstrap, then the gate, then the intro');
 assert.match(html,/data-language="en"/);assert.match(html,/data-language="de"/);
 assert.match(html,/language-gate\.mjs\?v=20261112-firstrun2/);
 assert.match(intro,/dataset\.langGate!=='1'/,'the intro waits for the choice');
 // Both languages must be on screen, so neither reader depends on the other's text.
 assert.match(html,/CHOOSE YOUR LANGUAGE/);assert.match(html,/SPRACHE WÄHLEN/);
 assert.match(html,/Continue in English/);assert.match(html,/Auf Deutsch fortfahren/);
});
