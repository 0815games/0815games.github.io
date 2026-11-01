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
assert.equal(buttons.length,20,'three ranks and one ability for each of five paths');
assert.equal(svg.children.filter(n=>n.tag==='line').length,20,'all nodes have connecting lines');
assert.equal(svg.children.filter(n=>n.tag==='circle').length,4);
assert.match(buttons[0].attrs['aria-label'],/Assault rank 1, unlocked/);
assert.match(buttons[1].attrs['aria-label'],/Assault rank 2, available/);
assert.match(buttons.at(-1).attrs['aria-label'],/Recon Suppression, selected ability/);
buttons.at(-1).onclick({detail:1});assert.deepEqual(selection,{path:'recon',rank:4});
assert.equal(encodeBuild(build),'1,0,0,0,0;recon','inspecting a node does not spend points');
assert.equal(armoryIcon(document,'vest').children[0].tag,'path');
console.log('Connected skill tree and armory illustrations passed.');
