import {WEB_NODES,webRequirement,SKILL_PATHS} from './skills.mjs?v=20261107-balance1';
import {germanSkills} from './localization-skills-de.mjs?v=20261107-balance1';
// These labels describe existing nodes only; their IDs and bonuses remain canonical.
const mastery=['Scharfschütze','Gefechtsübungen','Veteranenziel','Tödlicher Fokus','Kriegsheld','Kalibrierung','Verstärkte Geschütze','Fortgeschrittene Mechanik','Meisteringenieur','Kriegsmaschine','Bergungsrouten','Versorgungslinien','Quartiermeister','Ressourcennetz','Kriegswirtschaft','Erstversorgung','Feldlazarett','Gefechtsmedizin','Lebensretter','Bunkerwächter','Wegbereiter','Vorhutspäher','Schnelle Verlegung','Pfadfinder','Schattenagent'];
const comboNames=['Belagerungskommando','Gefechtslogistik','Humanitäre Versorgung','Schnelle Reaktion','Vorhut','Versorgungsschlag','Gefechtsanitäter','Mobile Versorgung','Gefechtslazarett','Aufklärungstechnik'];
const doctrine=['Feuerdisziplin','Veteranenschütze','Lange Wache','Adlerauge','Präzisionsarbeit','Meisterkalibrierung','Fernmeldetruppe','Kommandonetz','Gefechtsbergung','Versorgungskette','Hilfsvorrat','Notreserve','Feldtriage','Leitender Sanitäter','Verstärkter Bunker','Letztes Gefecht','Pfadfinderausbildung','Schneller Vormarsch','Vorausschau','Beobachternetz'];
const bonuses={damage:n=>`+${n} Soldatenschaden`,heroSpeed:n=>`+${n}% Feuergeschwindigkeit des Soldaten`,heroRange:n=>`+${n} Schussreichweite des Soldaten`,tower:n=>`+${n}% Turmschaden`,towerSpeed:n=>`+${n}% Turmfeuergeschwindigkeit`,cooldown:n=>`+${n} Sek. weniger Abklingzeit für Fähigkeiten`,supplies:n=>`+${n} Vorräte pro Abschuss`,start:n=>`+${n} Startvorräte`,health:n=>`+${n} gemeinsame Bunker-Lebenspunkte`,movement:n=>`+${n} Bewegungsgeschwindigkeit des Soldaten`};
const capstones={4:'Jeder fünfte Soldatenschuss verursacht bei einem weiteren Gegner in der Nähe 20 Schaden.',9:'Jeder vierte Schuss deiner Türme verursacht bei einem Gegner in der Nähe 20 Flächenschaden.',14:'Nach jeder abgeschlossenen Welle erhältst du 10 persönliche Vorräte.',19:'Einmal pro Welle werden 20 Bunker-Lebenspunkte wiederhergestellt, wenn sie unter 30% fallen und der Bunker den Treffer überlebt.',24:'Jeder vierte Soldatenschuss hält sein Ziel 3 Sekunden lang fest.'};
const combos=['Deine Turmtreffer markieren Gegner 5 Sekunden lang. Angriffs- oder Pionierfähigkeiten lösen deine Markierungen aus und verursachen 10 Schaden pro Stufe.','Pionier- und Logistikfähigkeiten geben dir 4 Vorräte pro Stufe.','Logistik- und Sanitäterfähigkeiten heilen den Bunker während einer laufenden Welle über 6 Sekunden um 3 Lebenspunkte pro Stufe.','Sanitäterfähigkeiten unterdrücken Gegner 2 Sekunden pro Stufe; Aufklärungsfähigkeiten verlängern die Unterdrückung um denselben Wert.','Aufklärer- und Sturmfähigkeiten halten bis zu 8 lebende Gegner 2 Sekunden plus 1 Sekunde pro Stufe fest.','Angriffs- und Logistikfähigkeiten treffen den stärksten lebenden Gegner für 10 Schaden pro Stufe.','Pionier- und Sanitäterfähigkeiten geben deinen Türmen 25% zusätzlichen Schaden für 3 Sekunden plus 1 Sekunde pro Stufe, ohne einen bestehenden Overdrive zu schwächen.','Logistik- und Aufklärungsfähigkeiten geben dir 5 Sekunden lang 15 Bewegungsgeschwindigkeit pro Stufe.','Sanitäter- und Sturmfähigkeiten stellen pro lebendem Gegner und Stufe 1 Bunker-Lebenspunkt wieder her, höchstens 6 pro Stufe.','Pionierfähigkeiten unterdrücken Gegner 2 Sekunden pro Stufe. Deine Türme verursachen 8% zusätzlichen Schaden pro Stufe, solange Gegner unterdrückt sind.'];
const names=WEB_NODES.map(n=>n.id<25?mastery[n.id]:n.id<55?`${comboNames[Math.floor((n.id-25)/3)]} ${['I','II','III'][(n.id-25)%3]}`:doctrine[n.id-55]);
const entries={};
for(let i=0;i<comboNames.length;i++)entries[WEB_NODES[25+i*3].name.replace(/ I$/,'')]=comboNames[i];
for(const n of WEB_NODES){
 if(!names[n.id])throw Error(`Missing advanced skill name ${n.id}`);
 const parts=n.bonuses.map(([key,value])=>{if(!bonuses[key])throw Error(`Missing bonus translation ${key}`);return bonuses[key](value);});
 let description=parts.join(' und ')+'.';
 if(capstones[n.id])description+=` MEISTERFÄHIGKEIT: ${capstones[n.id]}`;
 if(n.id>=25&&n.id<55)description+=` KOMBO (Stufe ${n.tier+1}): ${combos[Math.floor((n.id-25)/3)]}`;
 entries[n.name]=names[n.id];entries[n.description]=description;
}
for(const n of WEB_NODES){
 const req=webRequirement(n), match=req.match(/^Requires (.+)\.$/);
 if(!match)throw Error(`Unknown skill requirement ${req}`);
 let target=match[1];
 for(const [en,de] of [...WEB_NODES.map(x=>[x.name,names[x.id]]),...SKILL_PATHS.map(x=>[x.name,germanSkills[x.name]||x.name]),...SKILL_PATHS.flatMap(x=>x.branches.map(b=>[b.ability,germanSkills[b.ability]||b.ability]))].sort((a,b)=>b[0].length-a[0].length))target=target.replace(en,de);
 target=target.replace(' and ',' und ').replace(' rank ',' Rang ');
 entries[req]=`Benötigt ${target}.`;
}
Object.assign(entries,{'MASTERY / CAPSTONE':'MEISTERSCHAFT / MEISTERFÄHIGKEIT','SPECIALIST DOCTRINE':'SPEZIALISTENDOKTRIN','HYBRID COMBO':'HYBRID-KOMBO','MASTERY CAPSTONE':'MEISTERFÄHIGKEIT','ADVANCED MASTERY':'FORTGESCHRITTENE MEISTERSCHAFT','Each node costs one point.':'Jeder Knoten kostet einen Punkt.','MASTERY / {tier}':'MEISTERSCHAFT / {tier}','DOCTRINE / {branch}':'DOKTRIN / {branch}','COMBO / {first} + {second}':'KOMBO / {first} + {second}'});
export const germanAdvancedSkills=Object.freeze(entries);
