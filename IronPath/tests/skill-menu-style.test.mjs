// IPL-0141 "Skills-Optik": the skills dialog wears the field-kit board look
// of the dossier and the workshop, and the reported phone scroll fixes must
// survive every restyle. Also guards the IPL-0140 lesson: never apply
// text-transform to text the browser tests pin via innerText.
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../skill-menu.css',import.meta.url),'utf8');

test('the skills dialog is a field-kit plate with screwed panels',()=>{
  assert.match(css,/#skillDialog\{[^}]*background:linear-gradient\(180deg,#182b21,#122019\)/,'the dossier plate gradient');
  assert.match(css,/#skillDialog\{[^}]*border:1px solid #71836a/,'the dossier frame');
  // The points bar, the inspector and the build summary carry corner screws.
  const screws=/radial-gradient\(circle at 9px 9px,#9a9577/;
  for(const selector of ['skills-overview','skill-inspector','skill-build-summary']){
    const rule=css.slice(css.indexOf(`#skillDialog .${selector}{`));
    assert.match(rule.slice(0,600),screws,`${selector} is a screwed panel`);
  }
});

test('the tabs and the primary actions read as brass and field green',()=>{
  assert.match(css,/skills-tabs button\{[^}]*border-radius:2px;background:#152b21/,'squared plate tabs');
  assert.match(css,/skills-tabs button\[aria-pressed=true\]\{background:linear-gradient\(180deg,#d8c488,#c3ad6c\)/,'the pressed tab is brass');
  assert.match(css,/skill-inspector button\{[^}]*background:linear-gradient\(180deg,#8d9c66,#6c7c4c\)/,'the class/unlock action is the green field button');
  assert.match(css,/skill-group-heading h3\{[^}]*text-transform:uppercase/,'DIN-style group headers');
});

test('pinned copy is never uppercased by the stylesheet',()=>{
  // innerText reflects text-transform, so a transform on these selectors
  // broke the wallet pin in IPL-0140 (50 scrap -> 50 SCRAP). Keep it out.
  const rules=css.split('}');
  for(const pinned of ['.skill-card-name','#skillDetailText','#skillStatus','.skill-card-description']){
    const offenders=rules.filter(rule=>rule.includes(pinned)&&rule.includes('text-transform'));
    assert.deepEqual(offenders,[],`${pinned} must keep its authored case`);
  }
});

test('each sub-category reads as a numbered chapter inside its own panel',()=>{
  // Reported: "Skills sieht immer noch sehr unübersichtlich aus, vorallem die
  // Unterkategorien in den Hauptkategorien." (IPL-0143)
  assert.match(css,/\.skill-group\{[^}]*border-left:3px solid var\(--path-color,#839d8d\)/,'the chapter panel carries the path edge');
  assert.match(css,/\.skill-group\{[^}]*background:linear-gradient\(180deg,#111e18,#0f1a15\)/,'recessed chapter panel');
  assert.match(css,/skill-chapter-no\{[^}]*linear-gradient\(180deg,#d8c488,#c3ad6c\)/,'brass number plate');
  assert.match(css,/skill-chapter-progress\{[^}]*border:1px solid #c9b678/,'progress chip');
  assert.match(css,/skill-lane-head\{[^}]*border-left:3px solid var\(--path-color/,'lane header');
  assert.match(css,/skill-lane-head--a\{grid-column:1;grid-row:1\}/,'Path A keeps column one');
  assert.match(css,/skill-lane-head--b\{grid-column:2;grid-row:1\}/,'Path B keeps column two');
  // The chapter layout must also collapse cleanly on phones.
  assert.match(css,/skill-lane-head--b\{grid-column:1;grid-row:auto\}/,'mobile stacks the lane headers');
});

test('a chosen class themes the chrome, and the class row disappears',()=>{
  // Reported: "für jede das Skill menü besonders sein, rein optisch zu jeder
  // klasse" + "die Auswahlreihe ... kann verschwinden" (IPL-0144).
  assert.match(css,/#skillDialog\{--skill-accent:#d8c596/,'neutral brass accent by default');
  assert.match(css,/\.is-class-themed \*?\.skills-header\{[^}]*box-shadow:inset 0 4px 0 var\(--skill-accent\)/,'class band across the header');
  assert.match(css,/color-mix\(in srgb,var\(--skill-accent\) 24%,#1e3529\)/,'header takes the class tint');
  assert.match(css,/border-color:color-mix\(in srgb,var\(--skill-accent\) 45%,#71836a\)/,'the frame takes the class edge');
  assert.match(css,/\.is-class-themed \.skill-actions\{[^}]*color-mix\(in srgb,var\(--skill-accent\) 40%,#61775b\)/,'action bar hairline');
  assert.match(css,/\.is-class-themed \.skills-kicker\{[^}]*color:var\(--skill-accent\)/,'kicker in the class colour');
  // The themed rules must be opt-in: phase 1 keeps the approved look.
  assert.match(css,/\.is-class-themed\{[^}]*border-color:color-mix/,'themed chrome only under .is-class-themed');
  // display:flex would beat the UA [hidden] rule — the row must really go.
  assert.match(css,/\.skills-tabs\[hidden\]\{display:none\}/,'the class row vanishes once a class is decided');
});

test('desktop rows stay readable: words break and the sidebar stacks under 1100px',()=>{
  // Reported: "Schriften abgeschnitten ... nach rechts und links kann man nicht
  // alles lesen wenn die fähigkeiten von links nach rechts ausgebaut werden".
  for(const sel of ['skill-card-name','skill-card-description','skill-card-requirement','skill-group-heading p','skill-chapter-title']){
    assert.match(css,new RegExp(sel.replace(/[.-]/g,'\\$&')+'\\{[^}]*overflow-wrap:break-word'),'long compounds break: '+sel);
  }
  assert.match(css,/skill-lane-head span\{[^}]*overflow-wrap:break-word/,'lane header wraps instead of ellipsis-cut');
  assert.match(css,/skill-card-tag,#skillDialog \.skill-card-state\{[^}]*overflow-wrap:break-word/,'badges break when truly narrow');
  // The stack block must sit BEFORE the phone block so <=700px keeps winning.
  const stackAt=css.indexOf('@media(max-width:1100px){');
  const phoneAt=css.indexOf('@media(max-width:700px){');
  assert.ok(stackAt>0&&phoneAt>stackAt,'stack block precedes the phone block');
  assert.match(css.slice(stackAt,phoneAt),/skills-workspace\{display:flex;flex-direction:column/,'workspace stacks like the phone');
  assert.match(css.slice(stackAt,phoneAt),/skills-sidebar\{position:static;width:100%\}/,'sidebar goes full width');
});

test('the phone scroll architecture from the reported fixes stays',()=>{
  assert.match(css,/\/\* Reported: "Bei den Skills hat man 2 Scrollbalken/,'the original scroll report is still documented');
  assert.match(css,/#skillDialog\[open\]\{display:flex;flex-direction:column;overflow:hidden/,'the phone dialog never scrolls itself');
  assert.match(css,/#skillDialog\[open\] \.skills-workspace\{flex:1 1 0;min-height:0;overflow-y:auto\}/,'the workspace is the one scroll region');
  assert.match(css,/#skillDialog\[open\]>\*\{flex:0 0 auto\}/,'fixed children keep their height');
});
