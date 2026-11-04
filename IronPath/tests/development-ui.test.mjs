import {strict as assert} from 'node:assert';
import {renderSkillTree,armoryIcon} from '../development-ui.mjs';
import {parseBuild,encodeBuild} from '../skills.mjs';
class Element{
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.style={setProperty(k,v){this[k]=v;}};}
  setAttribute(k,v){this.attrs[k]=v;}
  append(...nodes){this.children.push(...nodes);}
  prepend(...nodes){this.children.unshift(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
}
const document={createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag)};
const container=new Element('div'),build=parseBuild('1,0,0,0,0;recon',3);let selection;
renderSkillTree({document,container,build,level:3,selected:{path:'assault',rank:1},onSelect:value=>selection=value});
const board=container.children[0],buttons=board.children.flatMap(section=>section.children?.flatMap(child=>child.children?.filter(n=>n.tag==='button')||[])||[]);
assert.equal(buttons.length,100,'all core, specialist, mastery and combo skills remain accessible');
assert.ok(buttons.some(n=>n.children.some(c=>c.textContent==='War Hero')));
assert.match(buttons[0].attrs['aria-label'],/Airstrike, unlocked/);assert.ok(buttons[0].className.includes('is-main-ability'));assert.ok(buttons[0].className.includes('is-selected'));assert.ok(!buttons[0].className.includes('is-active'));
const equippedContainer=new Element('div');renderSkillTree({document,container:equippedContainer,build:parseBuild('1,0,0,0,0;assault',3),level:3,selected:{path:'assault',rank:2},onSelect(){}});const equipped=equippedContainer.children[0].children[0].children[1].children[0];assert.ok(equipped.className.includes('is-active'));assert.ok(equipped.className.includes('is-main-ability'));assert.ok(!equipped.className.includes('is-selected'));assert.equal(equipped.children[0].children[1].textContent,'EQUIPPED');assert.equal(equippedContainer.children[0].children[0].dataset.skillGroup,'assault');
assert.match(buttons[1].attrs['aria-label'],/Assault · Rank 2, available/);
const recon=buttons.find(n=>n.dataset.path==='recon'&&n.dataset.rank==='1'),special=buttons.find(n=>n.dataset.path==='assault'&&n.dataset.rank==='5');
assert.match(recon.attrs['aria-label'],/Suppression, available/);assert.match(special.attrs['aria-label'],/Suppressive Bombardment, locked/);
recon.onclick({detail:1});assert.deepEqual(selection,{path:'recon',rank:1});
assert.equal(encodeBuild(build),'1,0,0,0,0;recon','inspecting a skill does not spend points');
assert.equal(armoryIcon(document,'vest').children[0].tag,'path');
console.log('Connected skill tree and armory illustrations passed.');
