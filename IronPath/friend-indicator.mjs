// A badge is informational only: opening or dismissing the UI never changes requests.
export function renderFriendIndicators({document,count,unavailable=false}){
 const value=Number.isFinite(count)?Math.max(0,Math.floor(count)):0,de=document.documentElement.lang==='de';
 for(const [buttonId,badgeId,lobby] of [['menuFriends','menuFriendBadge',false],['lobbyFriends','lobbyFriendBadge',true]]){
  const button=document.getElementById(buttonId),badge=document.getElementById(badgeId),active=unavailable||value>0;
  badge.hidden=!active;badge.textContent=unavailable?'!':value?String(value):'';button.classList.toggle('has-friend-requests',active);
  if(!active){button.removeAttribute('aria-label');button.removeAttribute('title');continue;}
  const label=de?(lobby?'Freunde und Einladungen':'Freunde'):(lobby?'Friends and invitations':'Friends');
  const detail=unavailable?(de?'Freundschaftsanfragen nicht verfügbar':'friend requests unavailable'):(de?`${value} offene ${value===1?'Freundschaftsanfrage':'Freundschaftsanfragen'}`:`${value} pending friend ${value===1?'request':'requests'}`);
  button.setAttribute('aria-label',`${label}, ${detail}`);if(unavailable)button.setAttribute('title',detail);else button.removeAttribute('title');
 }
}
