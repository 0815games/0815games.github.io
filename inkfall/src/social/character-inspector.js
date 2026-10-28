(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.InkfallCharacterInspector=api;})(globalThis,()=>{
'use strict';
function render(doc,character,definitions=[]){
 const box=doc.createElement('section');box.className='if-social-character';
 function add(tag,text){const n=doc.createElement(tag);n.textContent=text;box.append(n);return n;}
 if(!character){add('p','Keine freigegebenen Charakterdaten vorhanden.');return box;}
 const number=x=>Number.isSafeInteger(x)&&x>=0?String(x):'Nicht verfügbar';
 add('h3',typeof character.heroName==='string'?character.heroName:'Charakter');
 add('p',(character.heroClass==='mage'?'Elementarmagier':character.heroClass==='knight'?'Ritter':'Unbekannte Klasse')+' · Level '+number(character.level));
 add('p','XP: '+number(character.xp)+' · Freie Skillpunkte: '+number(character.skillPoints));
 if(character.checkpointWave!==undefined)add('p','Gespeicherter Wellenstand: '+number(character.checkpointWave));
 if(typeof character.updatedAt==='number'&&Number.isFinite(character.updatedAt)&&!Number.isNaN(new Date(character.updatedAt).getTime()))add('p','Aktualisiert: '+new Date(character.updatedAt).toLocaleString('de-DE'));
 add('p','Nur Ansicht · Fortschritt aus gespeichertem Spielstand.');
 add('h3','Skillübersicht · Nur Ansicht');
 const list=doc.createElement('ul');list.className='if-social-skills';
 for(const skill of definitions){
  if(!skill||typeof skill.id!=='string')continue;
  const item=doc.createElement('li');
  const active=character.skills?.[skill.id]===true;
  item.dataset.learned=String(active);
  const name=doc.createElement('strong');name.textContent=(active?'✓ Gelernt: ':'Nicht gelernt: ')+String(skill.name||skill.id);
  const description=doc.createElement('p');description.textContent=String(skill.desc||'');item.append(name,description);list.append(item);
 }
 if(!definitions.length)add('p','Skillbeschreibungen sind noch nicht angebunden.');
 box.append(list);return box;
}
return {render};
});
