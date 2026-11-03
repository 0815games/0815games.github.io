import {nodeKey,relatedNodes,nodeMatches} from './skill-planner.mjs?v=20261102-results1';
// Presentation only: all progression and transactions remain in the existing models.
import {SKILL_PATHS,pointsLeft,WEB_NODES,webReady} from './skills.mjs?v=20261102-results1';
const NS='http://www.w3.org/2000/svg';
const icons=['✦','⚒','◆','✚','◎'];
const colors=['#cb7656','#b0a75c','#cb9861','#81a78c','#849fb5'];
const row=i=>165+i*245;
const base=(i,rank)=>({x:[0,115,245,375][rank],y:row(i)});
const specialist=(i,j)=>({x:[245,375][j],y:row(i)+75});
const webPosition=(i,node)=>node.kind==='mastery'?{x:510+node.tier*130,y:row(i)}:{x:650+node.tier*150,y:row(i)+(node.kind==='hybrid'?75:150)};
function svg(document,tag,attrs){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node;}
export function renderSkillTree({document,container,build,level,selected,onSelect,filter='all',pathFilter='all'}){
  const scrollLeft=container.scrollLeft,scrollTop=container.scrollTop;
  const board=document.createElement('div');board.className='skill-tree-board';
  const lines=svg(document,'svg',{viewBox:'0 0 1400 1400','aria-hidden':'true',class:'skill-tree-lines'});
  const left=pointsLeft(build,level),related=relatedNodes(selected);
  function nodeClasses(path,rank){const key=nodeKey(path,rank),matches=nodeMatches(build,level,path,rank,filter,pathFilter);return `${!matches&&key!==related.current?' is-filtered':''}${related.before.has(key)?' is-prerequisite':''}${related.after.has(key)?' is-dependent':''}`;}
  function relationLabel(path,rank){const key=nodeKey(path,rank);return related.before.has(key)?', prerequisite of selected node':related.after.has(key)?', connected next node':'';}
  function linkClass(path,rank,fromPath,fromRank,lit){const from=nodeKey(fromPath,fromRank),to=nodeKey(path,rank);return `tree-link${lit?' is-lit':''}${(to===related.current&&related.before.has(from))||(from===related.current&&related.after.has(to))?' is-related':''}`;}
  function link(from,to,path,rank,fromPath,fromRank,lit,remote=false){lines.append(svg(document,'line',{x1:from.x,y1:from.y,x2:to.x,y2:to.y,stroke:colors[SKILL_PATHS.findIndex(p=>p.id===path)],class:linkClass(path,rank,fromPath,fromRank,lit)+(remote?' tree-remote':'')}));}
  function card({path,rank,pos,color,title,kind,status,unlocked=false,active=false,extra=''}){
    const button=document.createElement('button');button.type='button';button.className=`tree-node ${extra}${unlocked?' is-unlocked':''}${active?' is-active':''}${selected.path===path&&selected.rank===rank?' is-selected':''}${nodeClasses(path,rank)}`;
    button.style.left=`${pos.x/14}%`;button.style.top=`${pos.y/14}%`;button.style.setProperty('--path-color',color);button.dataset.path=path;button.dataset.rank=String(rank);
    const tag=document.createElement('span'),name=document.createElement('strong');tag.className='node-tag';tag.textContent=kind;name.className='node-name';name.textContent=title;button.append(tag,name);
    button.setAttribute('aria-label',`${title}, ${status}${relationLabel(path,rank)}`);button.setAttribute('aria-pressed',String(selected.path===path&&selected.rank===rank));button.onclick=event=>onSelect({path,rank},event?.detail===0);board.append(button);
  }
  SKILL_PATHS.forEach((path,i)=>{
    const strip=document.createElement('div');strip.className='tree-lane';strip.style.top=`${(row(i)-80)/14}%`;strip.style.setProperty('--path-color',colors[i]);board.append(strip);
    const label=document.createElement('span');label.className='tree-path-label';label.style.top=`${(row(i)-53)/14}%`;label.style.setProperty('--path-color',colors[i]);label.textContent=`0${i+1}  /  ${icons[i]}  ${path.name.toUpperCase()}`;board.append(label);
    for(let rank=1;rank<=3;rank++){
      const pos=base(i,rank),unlocked=build[path.id]>=rank,active=rank===1&&build.active===path.id&&!build.variant;
      if(rank>1)link(base(i,rank-1),pos,path.id,rank,path.id,rank-1,unlocked);
      card({path:path.id,rank,pos,color:colors[i],title:rank===1?path.ability:`${path.name} ${rank}`,kind:rank===1?'MAIN ABILITY':`RANK ${rank} / 3`,status:active?'selected main skill':unlocked?'unlocked':rank===build[path.id]+1&&left>0?'available':'locked',unlocked,active,extra:rank===1?'tree-ability':'tree-rank'});
    }
    path.branches.forEach((branch,j)=>{
      const rank=5+j,pos=specialist(i,j),unlocked=!!build.extra?.[i*2+j],active=unlocked&&build.active===path.id&&build.variant===j+1,available=build[path.id]>=2&&left>0;
      link(base(i,2),pos,path.id,rank,path.id,2,unlocked);
      card({path:path.id,rank,pos,color:colors[i],title:branch.ability,kind:`SPECIALIST ${j+1}`,status:active?'selected':unlocked?'unlocked':available?'available':'locked',unlocked,active,extra:'tree-specialist'});
    });
  });
  WEB_NODES.forEach(node=>{
    const i=SKILL_PATHS.findIndex(p=>p.id===node.path),pos=webPosition(i,node),unlocked=!!build.web?.[node.id],available=webReady(build,node)&&left>0,rank=100+node.id;
    if(node.tier>0){const previous=WEB_NODES[node.id-1];link(webPosition(i,previous),pos,node.path,rank,node.path,rank-1,unlocked);}
    else if(node.kind==='mastery')link(base(i,3),pos,node.path,rank,node.path,3,unlocked);
    else {link(base(i,2),pos,node.path,rank,node.path,2,unlocked);const other=SKILL_PATHS.findIndex(p=>p.id===node.other);link(base(other,2),pos,node.path,rank,node.other,2,unlocked,true);}
    card({path:node.path,rank,pos,color:colors[i],title:node.name,kind:node.kind==='mastery'?(node.tier===4?'CAPSTONE':`MASTERY ${node.tier+1}`):`${node.kind==='hybrid'?'COMBO':'CROSS'} / ${node.other.toUpperCase()}`,status:unlocked?'unlocked':available?'available':'locked',unlocked,extra:`tree-web ${node.kind==='mastery'?'tree-mastery':'tree-hybrid'}${node.kind==='mastery'&&node.tier===4?' tree-capstone':''}`});
  });
  board.prepend(lines);container.replaceChildren(board);if(Number.isFinite(scrollLeft))container.scrollLeft=scrollLeft;if(Number.isFinite(scrollTop))container.scrollTop=scrollTop;
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
 pouch:'M5 8h14v12H5z M9 8V5h6v3 M12 11v6 M9 14h6',
 manual:'M4 4h7c2 0 3 1 3 3v13c0-2-1-3-3-3H4z M14 7c0-2 1-3 3-3h3v13h-3c-2 0-3 1-3 3',
 badge:'M12 2l2 6 6 1-5 4 1 7-4-3-4 3 1-7-5-4 6-1z',
 tankkit:'M4 15h16l-2 5H6z M7 15l2-5h5l2 5 M12 10V6h7',
 supply:'M3 11h18v9H3z M6 11V7h12v4 M12 13v5 M9 15h6',
 safeguard:'M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z M12 8v8 M8 12h8',
 empty:'M4 4l16 16 M20 4 4 20'
};
export function armoryIcon(document,name){const icon=svg(document,'svg',{viewBox:'0 0 24 24','aria-hidden':'true',class:'armory-icon'});icon.append(svg(document,'path',{d:shapes[name]||shapes.empty,fill:'none',stroke:'currentColor','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round'}));return icon;}
