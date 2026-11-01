// Presentation only: all progression and transactions remain in the existing models.
import {SKILL_PATHS,pointsLeft} from './skills.mjs';
const NS='http://www.w3.org/2000/svg';
const icons=['✦','⚒','◆','✚','◎'];
const colors=['#e6a979','#b4c782','#e1bf6c','#8cb8a8','#9eb8d4'];
const nodeAt=(angle,r)=>({x:300+Math.cos(angle)*r,y:300+Math.sin(angle)*r});
function svg(document,tag,attrs){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node;}
export function renderSkillTree({document,container,build,level,selected,onSelect}){
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
    const labelPos=nodeAt(angle,283),label=document.createElement('span');label.className='tree-path-label';label.style.left=`${labelPos.x/6}%`;label.style.top=`${labelPos.y/6}%`;label.style.color=colors[i];label.textContent=path.name;board.append(label);
  });
  const core=document.createElement('div');core.className='tree-core';core.setAttribute('aria-hidden','true');core.textContent='★';board.prepend(lines,core);container.replaceChildren(board);
}
const shapes={
 fortify:'M3 20h18v-3h-2v-6l-3-3H8l-3 3v6H3z M9 17v-4h6v4 M8 8V5h8v3',
 plating:'M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z M8 12l2.5 2.5L16 9',
 scope:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 1v6 M12 17v6 M1 12h6 M17 12h6 M12 9v6 M9 12h6',
 vest:'M8 3 5 5l-2 5 3 2v9h12v-9l3-2-2-5-3-2-2 3h-4z M8 12h8 M9 16h6',
 boots:'M6 3h8v9l3 3 4 2v3H4v-3l2-3z M6 8h8 M4 17h17',
 empty:'M4 4l16 16 M20 4 4 20'
};
export function armoryIcon(document,name){const icon=svg(document,'svg',{viewBox:'0 0 24 24','aria-hidden':'true',class:'armory-icon'});icon.append(svg(document,'path',{d:shapes[name]||shapes.empty,fill:'none',stroke:'currentColor','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round'}));return icon;}
