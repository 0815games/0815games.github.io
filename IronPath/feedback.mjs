// Feedback route for beta testers. The link carries only build context the
// tester can see on screen; it never includes account, party or contact data.
export const FEEDBACK_REPOSITORY='https://github.com/0815games/0815games.github.io';
export function feedbackUrl({outcome='',mission='',wave=0}={}){
  const context=[`Outcome: ${outcome||'n/a'}`,`Mission: ${mission||'endless'}`,`Wave: ${Number.isSafeInteger(wave)?wave:0}`];
  const body=['What were you trying to do?','','What happened, and what did you expect?','','Device and browser:','','---',`Build context: ${context.join(' · ')}`].join('\n');
  const params=new URLSearchParams({title:'Iron Path beta feedback',labels:'iron-path,feedback',body});
  return `${FEEDBACK_REPOSITORY}/issues/new?${params.toString()}`;
}
