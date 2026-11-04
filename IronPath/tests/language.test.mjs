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

test('campaign and cinematics have complete authored German text without altering mission data',async()=>{
 const {CAMPAIGN}=await import('../campaign.mjs'),{cinematicFrames,cinematicScene}=await import('../story-cinematics.mjs'),{germanCampaign}=await import('../localization-campaign-de.mjs'),{germanCinematics}=await import('../localization-cinematics-de.mjs');const before=structuredClone(CAMPAIGN),f=fixture('de');
 for(const m of CAMPAIGN){for(const text of [m.act,m.title,m.briefing,m.success,...m.stages.flatMap(s=>[s.label,s.dialogue])])assert.ok(Object.hasOwn(germanCampaign,text),`${m.id}: ${text}`);for(const kind of ['intro','ending']){const scene=cinematicScene(m,kind);assert.ok(Object.hasOwn(germanCinematics,scene.place),scene.place);for(const frame of cinematicFrames(m,kind))assert.ok(Object.hasOwn(germanCinematics,frame.text)||Object.hasOwn(germanCampaign,frame.text),`${m.id}: ${frame.text}`);}}
 assert.equal(translateText('OBJECTIVE {current} / {total}: {label}',{current:2,total:4,label:'Test'}),'ZIEL 2 / 4: Test');assert.deepEqual(CAMPAIGN,before);f.selector.value='en';f.selector.change();assert.equal(translateText(CAMPAIGN[0].briefing),CAMPAIGN[0].briefing);
});

test('advanced skills include German names, descriptions and prerequisites without changing builds',async()=>{
 const {WEB_NODES,webRequirement,parseBuild,encodeBuild}=await import('../skills.mjs'),{germanAdvancedSkills}=await import('../localization-advanced-skills-de.mjs');const before=structuredClone(WEB_NODES),f=fixture('de'),build=parseBuild('2,0,0,0,0;assault',3),code=encodeBuild(build);
 for(const n of WEB_NODES){for(const text of [n.name,n.description,webRequirement(n)])assert.ok(Object.hasOwn(germanAdvancedSkills,text),`${n.id}: ${text}`);assert.notEqual(translateText(n.description),n.description);}
 assert.equal(encodeBuild(build),code);assert.deepEqual(WEB_NODES,before);f.selector.value='en';f.selector.change();assert.equal(translateText(WEB_NODES[0].description),WEB_NODES[0].description);
});

test('story status templates translate numbers and retain unknown text',async()=>{
 const {translateStoryDetail}=await import('../story-localization.mjs');const f=fixture('de');assert.equal(translateStoryDetail('15s remaining. Protect the bunker. Mission time: 45s (runs during waves).',translateText),'Noch 15 s. Schütze den Bunker. Missionszeit: 45 s (läuft während Wellen).');assert.equal(translateStoryDetail('Player <Name>',translateText),'Player <Name>');f.selector.value='en';f.selector.change();assert.equal(translateStoryDetail('15s remaining. Protect the bunker.',translateText),'15s remaining. Protect the bunker.');
});

test('skill summary and next-step localization preserve numeric values and source data',async()=>{
 const {parseBuild}=await import('../skills.mjs'),{skillBuildSummary}=await import('../skill-planner.mjs'),{localizeSkillSummary}=await import('../skill-summary-localization.mjs'),{nextSteps}=await import('../run-results.mjs');const f=fixture('de'),build=parseBuild('2,1,0,0,0;assault',5),original=structuredClone(build),raw=skillBuildSummary(build,5),summary=localizeSkillSummary(raw,translateText);
 assert.ok(summary.values.every((v,i)=>v!==raw.values[i]),summary.values.join('\n'));assert.match(summary.values[0],/\+4/);assert.match(summary.active,/AKTIV/);assert.match(nextSteps({xp:0},translateText),/Stufe 1:/);assert.deepEqual(build,original);f.selector.value='en';f.selector.change();const english=localizeSkillSummary(raw,translateText);assert.deepEqual(english.values,raw.values);assert.equal(nextSteps({xp:0},translateText),nextSteps({xp:0}));
});

test('static German campaign, results and battlefield labels have translations',async()=>{
 const {germanStatic}=await import('../localization-static-de.mjs');const {readFile}=await import('node:fs/promises'),html=await readFile(new URL('../index.html',import.meta.url),'utf8');for(const [en,de] of Object.entries(germanStatic)){assert.ok(de, en);if(!['Scene progress','Campaign missions completed','Current objective progress','Close results','Tower actions','Close tower menu','Battle status','Scrollable battlefield','Field menu'].includes(en))assert.ok(html.includes(`>${en}</`),en);}
});


test('battle templates preserve player names and tower values',()=>{
 const f=fixture('de');assert.equal(translateText('Tower sold. {name} receives {amount} supplies.',{name:'<Alice & Bob>',amount:135}),'Turm verkauft. <Alice & Bob> erhält 135 Vorräte.');assert.equal(translateText('Prestige {prestige}: level resets to 1; power and specialization stay, and damage increases.',{prestige:3}),'Prestige 3: Die angezeigte Stufe wird auf 1 zurückgesetzt; Stärke und Spezialisierung bleiben erhalten, der Schaden steigt.');f.selector.value='en';f.selector.change();assert.equal(translateText('Tower sold. {name} receives {amount} supplies.',{name:'<Alice & Bob>',amount:135}),'Tower sold. <Alice & Bob> receives 135 supplies.');
});

test('known command errors translate without changing simulation errors',async()=>{
 const {readFile}=await import('node:fs/promises'),{germanGameErrors}=await import('../localization-game-errors-de.mjs'),f=fixture('de');
 for(const file of ['match.mjs','coop-input.mjs','firebase-party-game.mjs']){const source=await readFile(new URL('../'+file,import.meta.url),'utf8');for(const match of source.matchAll(/reason:'([^']+)'/g)){assert.ok(Object.hasOwn(germanGameErrors,match[1]),`${file}: ${match[1]}`);assert.notEqual(translateText(match[1]),match[1]);}}
 assert.equal(translateText('unrecognized remote error'),'unrecognized remote error');f.selector.value='en';f.selector.change();assert.equal(translateText('Tower not found.'),'Tower not found.');
});

test('account error templates preserve unknown codes',()=>{
 const f=fixture('de');assert.equal(translateText('Could not complete the request. Please try again. ({code})',{code:'auth/test'}),'Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es erneut. (auth/test)');f.selector.value='en';f.selector.change();assert.equal(translateText('Could not complete the request. Please try again. ({code})',{code:'auth/test'}),'Could not complete the request. Please try again. (auth/test)');
});

test('generated map names, accessibility titles and dynamic engine errors translate reversibly',async()=>{
 const {MAPS}=await import('../maps.mjs');const {localizeGameMessage}=await import('../game-localization.mjs');const f=fixture('de');
 for(const map of Object.values(MAPS))assert.notEqual(translateText(map.name),map.name,map.name);
 assert.equal(translateText('BUILD'),'BAUEN');assert.equal(translateText('No skill'),'Keine Fähigkeit');assert.equal(translateText('Scrollable battlefield'),'Verschiebbares Schlachtfeld');
 assert.equal(localizeGameMessage('Not enough supplies. This tower costs 130.',translateText),'Nicht genügend Vorräte. Dieser Turm kostet 130.');assert.equal(localizeGameMessage('Airstrike is recharging.',translateText),'Luftschlag lädt sich noch auf.');assert.equal(localizeGameMessage('Player <BUILD>',translateText),'Player <BUILD>');
 f.selector.value='en';f.selector.change();assert.equal(localizeGameMessage('Not enough supplies. You need 42.',translateText),'Not enough supplies. You need 42.');
});
