import {strict as assert} from 'node:assert';
import {existsSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {renderSkillTree,armoryIcon,classBadgeSvg,towerClassIcon,CLASS_ARTWORKS} from '../development-ui.mjs';
import {parseBuild,encodeBuild,SKILL_PATHS} from '../skills.mjs';

class Element{
  constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.dataset={};this.style={setProperty(k,v){this[k]=v;}};}
  setAttribute(k,v){this.attrs[k]=v;}
  append(...nodes){this.children.push(...nodes);}
  prepend(...nodes){this.children.unshift(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
}
const document={
  createElement:tag=>new Element(tag),
  createElementNS:(_,tag)=>{
    const el=new Element(tag);
    Object.defineProperty(el,'className',{get(){return el.attrs.class||'';},set(){throw new TypeError('Cannot set property className of #<SVGElement> which has only a getter');}});
    return el;
  }
};

// Phase 1: Unchosen build renders the 6 exclusive classes including Air Defense.
const chooseContainer=new Element('div'),unchosen=parseBuild('v2;none',3);let selection;
renderSkillTree({document,container:chooseContainer,build:unchosen,level:3,selected:{path:'assault',rank:1},onSelect:value=>selection=value});
const chooseBoard=chooseContainer.children[0];
assert.equal(chooseBoard.dataset.phase,'choose-class');
const classButtons=chooseBoard.children[0].children[1].children.flatMap(shell=>shell.children.filter(n=>n.tag==='button'));
assert.equal(classButtons.length,6,'all 6 exclusive classes are offered');
assert.ok(classButtons.some(b=>b.dataset.path==='airDefense'));
const airButton=classButtons.find(b=>b.dataset.path==='airDefense');
airButton.onclick({detail:1});
assert.deepEqual(selection,{path:'airDefense',rank:1});

// Phase 2: Focused single-class tree shows 17 nodes (3 core + 14 class nodes) and class tower header.
const container=new Element('div'),build=parseBuild('v2;recon;1;0;00000000000000',3);
renderSkillTree({document,container,build,level:3,selected:{path:'assault',rank:1},onSelect(){}});
const board=container.children[0];
assert.equal(board.dataset.phase,'class-tree');
const buttons=board.children.flatMap(section=>section.children?.flatMap(child=>child.children?.flatMap(shell=>shell.children?.filter(n=>n.tag==='button')||[])||[])||[]);
assert.equal(buttons.length,17,'3 core + 14 class tree nodes rendered for the chosen class');
assert.ok(buttons.some(n=>n.children.some(c=>c.textContent==='Ghost Operative')));
assert.ok(buttons[0].className.includes('is-main-ability'));
assert.ok(buttons[0].className.includes('is-active'));
assert.equal(buttons[0].children[0].children[1].textContent,'✓ EQUIPPED');
assert.match(buttons[1].attrs['aria-label'],/Recon · Rank 2, available/);
assert.equal(encodeBuild(build),'v2;recon;1;0;00000000000000','inspecting a skill does not spend points');
assert.equal(armoryIcon(document,'vest').children[0].tag,'path');
assert.equal(classBadgeSvg(document,'airDefense').children[0].tag,'circle');

const inlineContainer=new Element('div'),inspector=new Element('section'),home=new Element('div');
renderSkillTree({document,container:inlineContainer,build:parseBuild('v2;assault;1;0;00000000000000',3),level:3,selected:{path:'assault',rank:1},onSelect(){},inspector,inspectorHome:home});
const coreSection=inlineContainer.children[0].children[1];
const selectedShell=coreSection.children[1].children[0];
assert.equal(selectedShell.children[1],inspector,'details live inside the selected card');
assert.equal(inspector.hidden,false);
assert.equal(selectedShell.children[0].attrs['aria-expanded'],'true');
assert.equal(selectedShell.children[0].attrs['aria-controls'],'skillInspector');

// Class artworks, dual branching lanes, hero banners and distinct tower class icons.
for(const p of SKILL_PATHS){
  const asset=CLASS_ARTWORKS[p.id];
  assert.ok(asset,`artwork defined for ${p.id}`);
  const full=join(import.meta.dirname,'..',asset);
  assert.ok(existsSync(full)&&statSync(full).size>10000,`class artwork exists for ${p.id}: ${asset}`);
}
const towerIcons=SKILL_PATHS.map(p=>towerClassIcon(document,p.id).children.map(c=>c.attrs?.d).join('|'));
assert.equal(new Set(towerIcons).size,SKILL_PATHS.length,'all 6 class tower icons render distinct symbols');
const heroBanner=board.children[0];
assert.equal(heroBanner.className,'class-header-card class-theme-recon','class tree renders themed class hero banner');
assert.ok(heroBanner.children.some(n=>n.tag==='img'&&n.className==='class-hero-backdrop'),'hero banner includes backdrop artwork');
const branchSection=board.children.find(n=>n.className?.includes('skill-tree--branches'));
assert.ok(branchSection,'class tree renders dual specialist & doctrine branch lanes');
const branchGrid=branchSection.children[1];
assert.equal(branchGrid.children.filter(c=>c.dataset?.lane==='a').length,3,'Lane A carries 3 nodes (Specialist + T1 + T2)');
assert.equal(branchGrid.children.filter(c=>c.dataset?.lane==='b').length,3,'Lane B carries 3 nodes (Specialist + T1 + T2)');
const chooseDossiers=chooseBoard.children[0].children[1].children.map(shell=>shell.children[0].children[0].children.find(n=>n.tag==='img'));
assert.equal(chooseDossiers.filter(Boolean).length,6,'all 6 class choice cards show class artwork');
console.log('V2 two-phase skill tree, 6 class badges and armory illustrations passed.');
