import {strict as assert} from 'node:assert';
import {prerequisites,relatedNodes,nodeMatches,skillBuildSummary,canSaveSkillDraft} from '../skill-planner.mjs';
import {parseBuild,encodeBuild,webRequirement,WEB_NODES} from '../skills.mjs';
import {characterProgress} from '../progression.mjs';
import {renderSkillTree} from '../development-ui.mjs';

// Assault build: rank 3, Quick Trigger (slot 0), Mastery 1 (slot 2), Doctrine A1 (slot 7)
const build=parseBuild('v2;assault;3;0;10100001000000',20);
assert.deepEqual(prerequisites('assault',2),['assault:1']);
assert.deepEqual(prerequisites('assault',100),['assault:2']);
assert.deepEqual(prerequisites('assault',102),['assault:3']);
assert.deepEqual(prerequisites('assault',103),['assault:102']);
assert.deepEqual(prerequisites('assault',107),['assault:100']);
assert.deepEqual(prerequisites('assault',111),['assault:2']);
assert.match(webRequirement(WEB_NODES[3]),/Sharpshooter/);

const links=relatedNodes({path:'assault',rank:2});
assert.ok(links.before.has('assault:1'));
assert.ok(links.after.has('assault:3'));
assert.ok(links.after.has('assault:100'));
assert.ok(links.after.has('assault:111'),'rank 2 connects to class combo 1');

assert.ok(nodeMatches(build,20,'assault',111,'combo','assault'));
assert.ok(!nodeMatches(build,20,'assault',102,'combo','assault'));
assert.ok(nodeMatches(build,20,'assault',100,'active'));
assert.ok(!nodeMatches(build,20,'assault',2,'active'));
assert.ok(nodeMatches(build,20,'assault',103,'available'));
assert.ok(!nodeMatches(build,7,'assault',103,'available'),'no unspent points means no available nodes');
assert.ok(nodeMatches(build,20,'assault',107,'unlocked'));
assert.ok(!nodeMatches(build,20,'engineer',2,'all','all'),'focused tree hides other classes');

const summary=skillBuildSummary(build,20);
assert.equal(summary.active,'Airstrike');
assert.equal(summary.classId,'assault');
assert.ok(summary.values.includes('Class: Assault'));
assert.ok(summary.values.includes('Soldier damage +8'));
assert.ok(summary.values.includes('Soldier firing interval 81% of base'));
assert.deepEqual(summary.combos,[]);
assert.deepEqual(summary.caps,[]);

const lvl=xp=>characterProgress(xp).level,old='v2;assault;1;0;00000000000000',candidate='v2;assault;2;0;00000000000000';
assert.ok(canSaveSkillDraft({xp:750,skills:old},old,candidate,lvl));
assert.ok(!canSaveSkillDraft({xp:750,skills:'v2;recon;1;0;00000000000000'},old,candidate,lvl),'concurrent skill edits cannot be overwritten');
assert.ok(!canSaveSkillDraft({xp:300,skills:old},old,candidate,lvl),'overspent draft cannot be saved');
assert.ok(!canSaveSkillDraft(null,old,candidate,lvl));

class Element{constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.style={setProperty(){}};}setAttribute(k,v){this.attrs[k]=v;}append(...x){this.children.push(...x);}prepend(...x){this.children.unshift(...x);}replaceChildren(...x){this.children=x;}}
const doc={createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)},container=new Element('div');container.scrollLeft=300;container.scrollTop=450;
renderSkillTree({document:doc,container,build,level:20,selected:{path:'assault',rank:111},filter:'combo',pathFilter:'assault',onSelect(){}});
const board=container.children[0],nodes=board.children.flatMap(section=>section.children?.flatMap(child=>child.children?.flatMap(shell=>shell.children?.filter(n=>n.tag==='button')||[])||[])||[]),node=(p,r)=>nodes.find(n=>n.dataset.path===p&&n.dataset.rank===String(r));
assert.equal(nodes.length,3,'combo filter shows only the 3 combo tiers of the chosen class');
assert.ok(node('assault',111));
assert.equal(node('assault',100),undefined);
assert.equal(container.scrollTop,450);

renderSkillTree({document:doc,container,build,level:20,selected:{path:'assault',rank:100},filter:'all',pathFilter:'all',onSelect(){}});
const all=container.children[0].children.flatMap(section=>section.children?.flatMap(child=>child.children?.flatMap(shell=>shell.children?.filter(n=>n.tag==='button')||[])||[])||[]);
assert.equal(all.length,17,'focused tree renders 3 core + 2 specialist + 4 doctrines + 5 mastery + 3 combos = 17 nodes');
assert.equal(encodeBuild(build),'v2;assault;3;0;10100001000000');
console.log('V2 Planner relationships, filters, summary, safe saving, and focused tree passed.');
