// Presentation only: all progression and transactions remain in the existing models.
import {SKILL_PATHS,pointsLeft} from './skills.mjs?v=20261102-tree2';
const NS='http://www.w3.org/2000/svg';
const icons=['✦','⚒','◆','✚','◎'];
const colors=['#e6a979','#b4c782','#e1bf6c','#8cb8a8','#9eb8d4'];
const nodeAt=(angle,r)=>({x:300+Math.cos(angle)*r,y:300+Math.sin(angle)*r});
function svg(document,tag,attrs){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node;}
export function renderSkillTree({document,container,build,level,selected,onSelect}){
  const scrollLeft=container.scrollLeft,scrollTop=container.scrollTop;
  const board=document.createElement('div');board.className='skill-tree-board';
  const lines=svg(document,'svg',{viewBox:'0 0 600 600','aria-hidden':'true',class:'skill-tree-lines'});
  for(const r of [75,130,185,245])lines.append(svg(document,'circle',{cx:300,cy:300,r,class:'tree-orbit'}));
  const left=pointsLeft(build,level);
  SKILL_PATHS.forEach((path,i)=>{
    const angle=-Math.PI/2+i*2*Math.PI/5;
    let prev={x:300,y:300};
    [75,130,185,245].forEach((radius,j)=>{
      const pos=nodeAt(angle,radius),rank=j+1,isAbility=j===3,unlocked=!isAbility&&build[path.id]>=rank,active=isAbility&&build.active===path.id;
      lines.append(svg(document,'line',{x1:prev.x,y1:prev.y,x2:pos.x,y2:pos.y,stroke:colors[i],class:(unlocked||active)?'tree-link is-lit':'tree-link'}));prev=pos;
      const button=document.createElement('button');button.type='button';button.className=`tree-node${isAbility?' tree-ability':''}${unlocked?' is-unlocked':''}${active?' is-active':''}${selected.path===path.id&&selected.rank===rank?' is-selected':''}`;
      button.style.left=`${pos.x/6}%`;button.style.top=`${pos.y/6}%`;button.style.setProperty('--path-color',colors[i]);
      if(isAbility){const symbol=document.createElement('span');symbol.textContent=icons[i];symbol.className='tree-ability-symbol';button.append(symbol);}else button.textContent=String(rank);
      button.dataset.path=path.id;button.dataset.rank=String(rank);
      const status=isAbility?(active?'selected ability':'available ability'):(unlocked?'unlocked':rank===build[path.id]+1&&left>0?'available':'locked');
      button.setAttribute('aria-label',`${path.name} ${isAbility?path.ability:'rank '+rank}, ${status}`);
      button.setAttribute('aria-pressed',String(selected.path===path.id&&selected.rank===rank));
      button.onclick=event=>onSelect({path:path.id,rank},event?.detail===0);board.append(button);
    });
    path.branches.forEach((branch,j)=>{
      const pos=nodeAt(angle+(j===0?-.27:.27),195),parent=nodeAt(angle,130),rank=5+j,unlocked=!!build.extra?.[i*2+j],available=build[path.id]>=2&&left>0;
      lines.append(svg(document,'line',{x1:parent.x,y1:parent.y,x2:pos.x,y2:pos.y,stroke:colors[i],class:unlocked?'tree-link is-lit':'tree-link'}));
      const button=document.createElement('button');button.type='button';button.className=`tree-node tree-specialist${unlocked?' is-unlocked':''}${selected.path===path.id&&selected.rank===rank?' is-selected':''}`;
      button.style.left=`${pos.x/6}%`;button.style.top=`${pos.y/6}%`;button.style.setProperty('--path-color',colors[i]);button.textContent=j===0?'Ⅰ':'Ⅱ';button.dataset.path=path.id;button.dataset.rank=String(rank);
      button.setAttribute('aria-label',`${path.name} specialist ${branch.name}, ${unlocked?'unlocked':available?'available':'locked'}`);button.setAttribute('aria-pressed',String(selected.path===path.id&&selected.rank===rank));button.onclick=event=>onSelect({path:path.id,rank},event?.detail===0);board.append(button);
    });
    const labelPos=nodeAt(angle,283),label=document.createElement('span');label.className='tree-path-label';label.style.left=`${labelPos.x/6}%`;label.style.top=`${labelPos.y/6}%`;label.style.color=colors[i];label.textContent=path.name;board.append(label);
  });
  const core=document.createElement('div');core.className='tree-core';core.setAttribute('aria-hidden','true');core.textContent='★';board.prepend(lines,core);container.replaceChildren(board);if(Number.isFinite(scrollLeft))container.scrollLeft=scrollLeft;if(Number.isFinite(scrollTop))container.scrollTop=scrollTop;
}
const shapes={
 fortify:'M3 20h18v-3h-2v-6l-3-3H8l-3 3v6H3z M9 17v-4h6v4 M8 8V5h8v3',
 plating:'M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z M8 12l2.5 2.5L16 9',
 scope:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 1v6 M12 17v6 M1 12h6 M17 12h6 M12 9v6 M9 12h6',
 vest:'M8 3 5 5l-2 5 3 2v9h12v-9l3-2-2-5-3-2-2 3h-4z M8 12h8 M9 16h6',
 boots:'M6 3h8v9l3 3 4 2v3H4v-3l2-3z M6 8h8 M4 17h17',
 repair:'M12 2v20 M2 12h20 M8 8h8v8H8z',
 gun:'M4 20h16v-3h-2v-5H6v5H4z M10 12V7h4v5 M12 7V3 M12 4h8',
 binoculars:'M4 18 6 6h4l1 12z M13 18l1-12h4l2 12z M10 9h4 M4 18h7 M13 18h7',
 radio:'M5 9h14v12H5z M8 5l8-3 M8 13h8 M8 17h2 M14 17h2',
 satchel:'M4 8h16v12H4z M8 8V5h8v3 M10 13h4 M12 11v4',
 empty:'M4 4l16 16 M20 4 4 20'
};
export function armoryIcon(document,name){const icon=svg(document,'svg',{viewBox:'0 0 24 24','aria-hidden':'true',class:'armory-icon'});icon.append(svg(document,'path',{d:shapes[name]||shapes.empty,fill:'none',stroke:'currentColor','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round'}));return icon;}
