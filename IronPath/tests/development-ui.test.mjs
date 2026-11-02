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
const board=container.children[0],buttons=board.children.filter(n=>n.tag==='button'),svg=board.children.find(n=>n.tag==='svg');
assert.equal(buttons.filter(n=>n.className.includes('tree-capstone')).length,5);
assert.equal(buttons.length,80,'25 original nodes plus 55 mastery and hybrid nodes');
assert.equal(svg.children.filter(n=>n.tag==='line').length,90,'all nodes and hybrid bridges have connecting lines');
assert.equal(svg.children.filter(n=>n.tag==='circle').length,7);
assert.match(buttons[0].attrs['aria-label'],/Assault main skill Airstrike, unlocked/);
assert.match(buttons[1].attrs['aria-label'],/Assault rank 2, available/);
const recon=buttons.find(n=>n.dataset.path==='recon'&&n.dataset.rank==='1'),special=buttons.find(n=>n.dataset.path==='assault'&&n.dataset.rank==='5');
assert.match(recon.attrs['aria-label'],/Recon main skill Suppression, selected main skill/);assert.match(special.attrs['aria-label'],/Suppressive Bombardment, locked/);
recon.onclick({detail:1});assert.deepEqual(selection,{path:'recon',rank:1});
assert.equal(encodeBuild(build),'1,0,0,0,0;recon','inspecting a node does not spend points');
assert.equal(armoryIcon(document,'vest').children[0].tag,'path');
console.log('Connected skill tree and armory illustrations passed.');
