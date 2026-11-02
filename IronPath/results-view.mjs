// Renders the operation report. Every player-supplied string is set with
// textContent so names from profiles cannot inject markup.
const OUTCOME={
  victory:{eyebrow:'MISSION COMPLETE',title:'Objective secured'},
  defeat:{eyebrow:'OPERATION FAILED',title:'The bunker fell'},
  retired:{eyebrow:'OPERATION ENDED',title:'Run ended early'},
  active:{eyebrow:'OPERATION REPORT',title:'Operation report'}
};
function node(document,tag,text,className){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
export function renderRunResults(document,summary,{feedbackHref='',coop=false}={}){
  const doc=document,copy=OUTCOME[summary.outcome]||OUTCOME.active;
  doc.getElementById('resultsEyebrow').textContent=copy.eyebrow;
  doc.getElementById('resultsTitle').textContent=summary.mission?`${summary.mission.name} · ${copy.title}`:copy.title;
  doc.getElementById('resultsMission').textContent=summary.mission?`${summary.mission.region} · Objective: wave ${summary.mission.objectiveWave}`:(coop?'Co-op operation · endless':'Endless operation');
  const stats=[
    ['Waves survived',summary.wavesSurvived],
    ['Bosses defeated',summary.bossesDefeated],
    ['Enemies defeated',summary.enemiesDefeated],
    ['XP earned',`+${summary.xp}`],
    ['Supplies earned',summary.supplies],
    ['Supply caches',summary.caches],
    ['Skill combos',summary.combos],
    ['Damage dealt',summary.totalDamage]
  ];
  const statBox=doc.getElementById('resultsStats');statBox.textContent='';
  for(const [label,value] of stats){const card=node(doc,'div',undefined,'results-stat');card.append(node(doc,'span',label),node(doc,'strong',String(value)));statBox.append(card);}
  const list=doc.getElementById('resultsContributions');list.textContent='';
  if(!summary.contributions.length)list.append(node(doc,'li','No soldiers were in this operation.'));
  for(const c of summary.contributions){
    const item=node(doc,'li',undefined,'results-contributor'+(c.you?' is-you':''));
    const head=node(doc,'div',undefined,'results-contributor-head');
    head.append(node(doc,'strong',`${c.name}${c.you?' (you)':''}`),node(doc,'span',`${c.share}% of damage`));
    const bar=node(doc,'div',undefined,'results-bar');const fill=node(doc,'span');fill.style.width=`${Math.max(0,Math.min(100,c.share))}%`;bar.append(fill);
    const detail=node(doc,'small',`Hero ${c.heroDamage} · Towers ${c.towerDamage} · Kills ${c.kills} · Combos ${c.combos}`);
    item.append(head,bar,detail);list.append(item);
  }
  const rewards=doc.getElementById('resultsRewards');rewards.textContent='';
  const add=text=>rewards.append(node(doc,'li',text));
  if(summary.skillPointsGained>0)add(`Level ${summary.levelBefore} → ${summary.levelAfter}: +${summary.skillPointsGained} skill point${summary.skillPointsGained===1?'':'s'} to spend in SKILLS.`);
  else add(`Soldier level ${summary.levelAfter}. Keep fighting for the next skill point.`);
  if(summary.equipment===null)add('Armory rewards for co-op are shown on your account after the party closes.');
  else{
    add(summary.equipment.length?`New equipment: ${summary.equipment.map(i=>i.name).join(', ')}.`:'No new equipment this run.');
    add(`Armory scrap earned: +${summary.scrap}.`);
  }
  add(summary.perks.length?`Field upgrades this run: ${summary.perks.map(p=>`${p.name} ×${p.rank}`).join(' · ')}.`:'No field upgrades this run.');
  add(`Towers standing: ${summary.towers.standing} · upgrade levels: ${summary.towers.upgrades}.`);
  const feedback=doc.getElementById('resultsFeedback');feedback.href=feedbackHref;
  return {copy};
}
