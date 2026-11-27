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

test('the phone scroll architecture from the reported fixes stays',()=>{
  assert.match(css,/\/\* Reported: "Bei den Skills hat man 2 Scrollbalken/,'the original scroll report is still documented');
  assert.match(css,/#skillDialog\[open\]\{display:flex;flex-direction:column;overflow:hidden/,'the phone dialog never scrolls itself');
  assert.match(css,/#skillDialog\[open\] \.skills-workspace\{flex:1 1 0;min-height:0;overflow-y:auto\}/,'the workspace is the one scroll region');
  assert.match(css,/#skillDialog\[open\]>\*\{flex:0 0 auto\}/,'fixed children keep their height');
});
