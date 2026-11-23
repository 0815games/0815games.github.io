import {WEB_NODES,webRequirement,SKILL_PATHS,SKILL_PATH_MAP} from '../core/skills.mjs?v=20261123-endless5';
import {CAPSTONES} from '../core/skill-combos.mjs?v=20261123-endless5';
import {germanSkills} from './localization-skills-de.mjs?v=20261123-endless5';
// Canonical German translations for all 84 single-class tree nodes (6 classes x 14 slots).
const masteryByClass={
 assault:['Scharfschütze','Gefechtsübungen','Veteranenziel','Tödlicher Fokus','Kriegsheld'],
 engineer:['Kalibrierung','Verstärkte Geschütze','Fortgeschrittene Mechanik','Meisteringenieur','Kriegsmaschine'],
 logistics:['Bergungsrouten','Versorgungslinien','Quartiermeister','Ressourcennetz','Kriegswirtschaft'],
 medic:['Erstversorgung','Feldlazarett','Gefechtsmedizin','Lebensretter','Bunkerwächter'],
 recon:['Wegbereiter','Vorhutspäher','Schnelle Verlegung','Pfadfinder','Schattenagent'],
 airDefense:['Radar-Suchlauf','Schnellnachladung','Zielmarkier-Link','Himmelsschild','Himmelssouverän']
};
const doctrineByClass={
 assault:['Feuerdisziplin','Veteranenschütze','Lange Wache','Adlerauge'],
 engineer:['Präzisionsarbeit','Meisterkalibrierung','Fernmeldetruppe','Kommandonetz'],
 logistics:['Gefechtsbergung','Versorgungskette','Hilfsvorrat','Notreserve'],
 medic:['Feldtriage','Leitender Sanitäter','Verstärkter Bunker','Letztes Gefecht'],
 recon:['Pfadfinderausbildung','Schneller Vormarsch','Vorausschau','Beobachternetz'],
 airDefense:['Leuchtspuroptik','Prioritätsziel','Flak-Kalibrierung','Luftraumsperre']
};
const comboBaseByClass={
 assault:'Sturm-Salve',
 engineer:'Gefechtsnetz',
 logistics:'Mobiler Konvoi',
 medic:'Feldhospital',
 recon:'Vorhut-Stoß',
 airDefense:'Flak-Resonanz'
};
const capstoneGerman={
 assault:'Jeder vierte Soldatenschuss springt mit 24 Schaden auf einen weiteren Gegner über.',
 engineer:'Jeder vierte Schuss deiner Türme verursacht 22 Flächenschaden an einem nahen Gegner.',
 logistics:'Nach jeder abgeschlossenen Welle erhältst du 12 persönliche Vorräte.',
 medic:'Stellt einmal pro Welle 22 Bunker-Lebenspunkte wieder her, wenn sie unter 35 % fallen und der Bunker den Treffer überlebt.',
 recon:'Jeder vierte Soldatenschuss fixiert sein Ziel 3 Sekunden lang.',
 airDefense:'Luftabwehr-markierte Ziele erleiden +20 % zusätzlichen Schaden und jeder fünfte Soldatenschuss erneuert eine 3-s-Markierung.'
};
const comboGerman={
 assault:['Sturmfähigkeiten feuern eine Bodensalve ab: +8 Schaden und 2 s Fixierung.',
  'Bodensalve wächst auf +16 Schaden und 2,5 s Fixierung sowie +16 Treffer am stärksten Gegner.',
  'Bodensalve wächst auf +24 Schaden und 3 s Fixierung sowie +24 Treffer am stärksten Gegner.'],
 engineer:['Pionierfähigkeiten geben +4 Vorräte und unterdrücken Gegner 2 s lang.',
  'Pionierfähigkeiten geben +8 Vorräte und unterdrücken Gegner 4 s lang.',
  'Pionierfähigkeiten geben +12 Vorräte und unterdrücken Gegner 6 s lang.'],
 logistics:['Logistikfähigkeiten verleihen 5 s lang +15 Tempo und heilen 6 s lang 3 Bunker-LP.',
  'Logistikfähigkeiten verleihen 5 s lang +30 Tempo und heilen 6 s lang 6 Bunker-LP.',
  'Logistikfähigkeiten verleihen 5 s lang +45 Tempo und heilen 6 s lang 9 Bunker-LP.'],
 medic:['Sanitäterfähigkeiten heilen 1 Bunker-LP pro lebendem Gegner (max. 6) und geben 4 s lang +25 % Turmschaden.',
  'Sanitäterfähigkeiten heilen bis zu 12 Bunker-LP und geben 5 s lang +25 % Turmschaden.',
  'Sanitäterfähigkeiten heilen bis zu 18 Bunker-LP und geben 6 s lang +25 % Turmschaden.'],
 recon:['Aufklärungsfähigkeiten fixieren bis zu 8 Gegner 3 s lang und verlängern Unterdrückung um 1,5 s.',
  'Aufklärungsfähigkeiten fixieren bis zu 8 Gegner 4 s lang und verlängern Unterdrückung um 3 s.',
  'Aufklärungsfähigkeiten fixieren bis zu 8 Gegner 5 s lang und verlängern Unterdrückung um 4,5 s.'],
 airDefense:['Luftabwehrfähigkeiten richten +12 Flakschaden an Flugzeugen (+6 an schweren Bodeneinheiten) an und markieren 4 s lang.',
  'Luftabwehrfähigkeiten richten +24 Flakschaden an Flugzeugen (+12 an schweren Bodeneinheiten) an und markieren 5 s lang.',
  'Luftabwehrfähigkeiten richten +36 Flakschaden an Flugzeugen (+18 an schweren Bodeneinheiten) an und markieren 6 s lang.']
};
const bonuses={
 damage:n=>`+${n} Soldatenschaden`,
 heroSpeed:n=>`+${n} % Feuergeschwindigkeit des Soldaten`,
 heroRange:n=>`+${n} Schussreichweite des Soldaten`,
 tower:n=>`+${n} % Turmschaden`,
 towerSpeed:n=>`+${n} % Turmfeuergeschwindigkeit`,
 cooldown:n=>`${n} Sek. weniger Fähigkeits-Abklingzeit`,
 supplies:n=>`+${n} Vorräte pro Abschuss`,
 start:n=>`+${n} Startvorräte`,
 health:n=>`+${n} gemeinsame Bunker-Lebenspunkte`,
 movement:n=>`+${n} Bewegungsgeschwindigkeit des Soldaten`,
 airDamage:n=>`+${n} % Turmschaden gegen Flugzeuge`,
 markDamage:n=>`+${n} % Schaden gegen Luftabwehr-markierte Ziele`
};
const entries={};
for(const p of SKILL_PATHS){
 const cap=CAPSTONES[p.id];
 if(cap){
  entries[cap.name]=masteryByClass[p.id][4];
  entries[cap.description]=capstoneGerman[p.id];
 }
 const comboSample=WEB_NODES.find(n=>n.path===p.id&&n.kind==='combo'&&n.tier===0);
 if(comboSample){
  entries[comboSample.name.replace(/ I$/,'')]=comboBaseByClass[p.id];
 }
}
const nodeNameDe=n=>{
 if(n.kind==='specialist')return germanSkills[n.name]||n.name;
 if(n.kind==='mastery')return masteryByClass[n.path][n.tier];
 if(n.kind==='doctrine')return doctrineByClass[n.path][n.slot-7];
 return `${comboBaseByClass[n.path]} ${['I','II','III'][n.tier]}`;
};
for(const n of WEB_NODES){
 const deName=nodeNameDe(n);
 entries[n.name]=deName;
 if(n.kind==='specialist'){
  const p=SKILL_PATH_MAP[n.path],b=p.branches[n.branch];
  entries[n.description]=`${germanSkills[b.description]||b.description} Schaltet ${germanSkills[b.ability]||b.ability} frei: ${germanSkills[b.abilityDescription]||b.abilityDescription}`;
 }else{
  const parts=n.bonuses.map(([k,v])=>bonuses[k](v));
  let desc=parts.join(' und ')+'.';
  if(n.capstone)desc+=` MEISTERFÄHIGKEIT: ${capstoneGerman[n.path]}`;
  if(n.kind==='combo')desc+=` SYNERGIE (Stufe ${n.tier+1}): ${comboGerman[n.path][n.tier]}`;
  entries[n.description]=desc;
 }
}
const replacers=[
 ...WEB_NODES.map(n=>[n.name,nodeNameDe(n)]),
 ...SKILL_PATHS.map(p=>[p.name,germanSkills[p.name]||p.name]),
 ...SKILL_PATHS.flatMap(p=>p.branches.map(b=>[b.ability,germanSkills[b.ability]||b.ability]))
].sort((a,b)=>b[0].length-a[0].length);
for(const n of WEB_NODES){
 const req=webRequirement(n),m=req.match(/^Requires (.+)\.$/);
 if(!m)continue;
 let target=m[1];
 for(const [en,de] of replacers)if(target.includes(en))target=target.split(en).join(de);
 target=target.replace(' and ',' und ').replace(' rank ',' Rang ');
 entries[req]=`Benötigt ${target}.`;
}
Object.assign(entries,{
 'MASTERY / CAPSTONE':'MEISTERSCHAFT / MEISTERFÄHIGKEIT',
 'SPECIALIST DOCTRINE':'SPEZIALISTENDOKTRIN',
 'CLASS COMBO':'KLASSENKOMBO',
 'HYBRID COMBO':'HYBRID-KOMBO',
 'MASTERY CAPSTONE':'MEISTERFÄHIGKEIT',
 'ADVANCED MASTERY':'FORTGESCHRITTENE MEISTERSCHAFT',
 'Each node costs one point.':'Jeder Knoten kostet einen Punkt.',
 'MASTERY / {tier}':'MEISTERSCHAFT / {tier}',
 'DOCTRINE / {branch}':'DOKTRIN / {branch}',
 'COMBO / {tier}':'KOMBO / {tier}',
 'COMBO / {first} + {second}':'KOMBO / {first} + {second}'
});
export const germanAdvancedSkills=Object.freeze(entries);
