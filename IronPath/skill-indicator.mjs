// The indicator reflects saved, unspent points, never an unsaved skill draft.
export function renderSkillIndicators({document,points}){
 const count=Number.isFinite(points)?Math.max(0,Math.floor(points)):0;
 const german=document.documentElement.lang==='de';
 for(const [buttonId,badgeId] of [['menuSkills','menuSkillBadge'],['skillOpen','workspaceSkillBadge']]){
  const button=document.getElementById(buttonId),badge=document.getElementById(badgeId);
  badge.hidden=count===0;badge.textContent=count?String(count):'';
  button.classList.toggle('has-skill-points',count>0);
  if(count)button.setAttribute('aria-label',german?`Fähigkeiten, ${count} ${count===1?'offener':'offene'} ${count===1?'Fähigkeitspunkt':'Fähigkeitspunkte'}`:`Skills, ${count} unspent skill ${count===1?'point':'points'}`);
  else button.removeAttribute('aria-label');
 }
}
