import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {setupLanguage,translate,translateText} from '../language.mjs';
function fixture(saved){
 const values=new Map(saved?[['ironpath:language',saved]]:[]),selector={value:'',addEventListener(_type,fn){this.change=fn;}},notice={hidden:true},label={textContent:'',getAttribute:()=> 'command.title'},player={textContent:'Player <Name>'},doc={documentElement:{lang:''},getElementById:id=>id==='languageSelect'?selector:notice,querySelectorAll:query=>query==='[data-i18n]'?[label]:[]},storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};let count=0;const language=setupLanguage({document:doc,storage,onChange:()=>count++});return {values,selector,notice,label,player,doc,language,getCount:()=>count};
}
test('switching languages translates only marked UI and persists preference locally',()=>{
 const f=fixture();assert.equal(f.doc.documentElement.lang,'en');assert.equal(f.label.textContent,'Command Center');f.selector.value='de';f.selector.change();assert.equal(f.doc.documentElement.lang,'de');assert.equal(f.label.textContent,'Kommandozentrale');assert.equal(f.notice.hidden,false);assert.equal(f.values.get('ironpath:language'),'de');assert.equal(f.player.textContent,'Player <Name>');assert.equal(translate('command.missions',{done:3,total:12}),'3 / 12 Missionen abgeschlossen');assert.equal(f.getCount(),2);
 f.selector.value='en';f.selector.change();assert.equal(f.label.textContent,'Command Center');assert.equal(f.notice.hidden,true);assert.equal(translate('command.level',{level:9}),'LEVEL 9');
});
test('preference loads and invalid values do not replace the current language',()=>{const f=fixture('de');assert.equal(f.language.getLanguage(),'de');assert.equal(f.label.textContent,'Kommandozentrale');f.selector.value='xx';f.selector.change();assert.equal(f.selector.value,'de');assert.equal(f.doc.documentElement.lang,'de');const bad=fixture('invalid');assert.equal(bad.language.getLanguage(),'en');});
test('blocked storage does not prevent switching',()=>{const selector={value:'',addEventListener(_t,fn){this.change=fn;}},notice={},doc={documentElement:{},getElementById:id=>id==='languageSelect'?selector:notice,querySelectorAll:()=>[]},storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};const locale=setupLanguage({document:doc,storage});selector.value='de';selector.change();assert.equal(locale.getLanguage(),'de');});

test('dynamic presentation preserves unknown text and formats placeholders safely',()=>{const f=fixture('de');assert.equal(translateText('Wave {wave}',{wave:7}),'Welle 7');assert.equal(translateText('Unknown {value}'),'Unknown {value}');assert.equal(translateText(undefined),'');f.selector.value='en';f.selector.change();assert.equal(translateText('Wave {wave}',{wave:7}),'Wave 7');});

test('localized accessible attributes and parameterized names retain their original values',()=>{
 const selector={value:'',addEventListener(_t,fn){this.change=fn;}},notice={},attrs={'data-i18n-placeholder':'Enter soldier name'},input={getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v},doc={documentElement:{},getElementById:id=>id==='languageSelect'?selector:notice,querySelectorAll:q=>q==='[data-i18n-placeholder]'?[input]:[]};
 setupLanguage({document:doc});assert.equal(attrs.placeholder,'Enter soldier name');selector.value='de';selector.change();assert.equal(attrs.placeholder,'Soldatennamen eingeben');assert.equal(translateText('{name} invited you to a party.',{name:'<Pilot & Co>'}),'<Pilot & Co> hat dich in eine Gruppe eingeladen.');selector.value='en';selector.change();assert.equal(attrs.placeholder,'Enter soldier name');
});

test('armory translations cover equipment and medals without changing source data or placeholders',async()=>{
 const {ITEMS}=await import('../armory.mjs'),{serviceMedals}=await import('../service-record.mjs');const before=structuredClone(ITEMS),f=fixture('de');
 for(const item of ITEMS){assert.notEqual(translateText(item.name),item.name,item.name);assert.notEqual(translateText(item.description),item.description,item.name);}
 for(const medal of serviceMedals({xp:0})){assert.notEqual(translateText(medal.name),medal.name,medal.name);assert.notEqual(translateText(medal.description),medal.description,medal.description);}
 assert.equal(translateText('UPGRADE · {cost} SCRAP',{cost:90}),'VERBESSERN · 90 SCHROTT');assert.equal(translateText('UNLOCKS ON WAVE {wave}',{wave:12}),'FREI IN WELLE 12');assert.deepEqual(ITEMS,before);
 f.selector.value='en';f.selector.change();assert.equal(translateText('Field Scope'),'Field Scope');assert.equal(translateText('UPGRADE · {cost} SCRAP',{cost:90}),'UPGRADE · 90 SCRAP');
});

test('German core skill names, effects and specialist effects are translated without changing builds',async()=>{
 const {SKILL_PATHS,parseBuild,encodeBuild}=await import('../skills.mjs');const f=fixture('de'),build=parseBuild('2,0,0,0,0;assault',3),before=encodeBuild(build);
 for(const path of SKILL_PATHS){assert.notEqual(translateText(path.name),path.name);assert.notEqual(translateText(path.passive),path.passive);assert.notEqual(translateText(path.description),path.description);for(const branch of path.branches){assert.notEqual(translateText(branch.abilityDescription),branch.abilityDescription);assert.notEqual(translateText(branch.description),branch.description);}}
 assert.equal(translateText('Requires {name} rank {rank}',{name:translateText('Recon'),rank:2}),'Benötigt Aufklärung Rang 2');assert.equal(encodeBuild(build),before);f.selector.value='en';f.selector.change();assert.equal(translateText('Suppression'),'Suppression');
});
