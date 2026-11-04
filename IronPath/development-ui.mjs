import {nodeMatches} from './skill-planner.mjs?v=20261104-doctrines1';
// Presentation only: all progression and transactions remain in the existing models.
import {SKILL_PATHS,pointsLeft,WEB_NODES,webReady,webRequirement} from './skills.mjs?v=20261104-doctrines1';
const NS='http://www.w3.org/2000/svg';
const colors=['#d89970','#d7bd71','#b4c682','#8ac7b1','#8eafcf'];
function svg(document,tag,attrs){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node;}
// A browsable skill catalogue. Selection and progression are still owned by account.js.
export function renderSkillTree({document,container,build,level,selected,onSelect,filter='all',pathFilter='all',inspector=null,inspectorHome=null}){
  const scrollTop=container.scrollTop,left=pointsLeft(build,level);
  if(inspector&&inspectorHome){inspectorHome.append(inspector);inspector.hidden=true;}
  const board=document.createElement('div');board.className='skills-catalogue';
  function addGroup(title,subtitle,items,pathId=null){
    const visible=items.filter(item=>nodeMatches(build,level,item.path,item.rank,filter,pathFilter));if(!visible.length)return;
    const section=document.createElement('section'),heading=document.createElement('div'),name=document.createElement('h3'),desc=document.createElement('p'),grid=document.createElement('div');
    section.className='skill-group';if(pathId){section.dataset.skillGroup=pathId;section.style.setProperty('--path-color',colors[SKILL_PATHS.findIndex(p=>p.id===pathId)]);}heading.className='skill-group-heading';name.textContent=title;desc.textContent=subtitle;heading.append(name,desc);grid.className='skill-card-grid';section.append(heading,grid);board.append(section);
    for(const item of visible){
      const shell=document.createElement('article'),button=document.createElement('button'),top=document.createElement('span'),tag=document.createElement('span'),state=document.createElement('span'),name=document.createElement('strong'),requirement=document.createElement('span');
      const active=item.active,unlocked=item.unlocked,available=item.available,expanded=selected.path===item.path&&selected.rank===item.rank,locked=!active&&!unlocked&&!available;
      const flags=`${item.rank===1?' is-main-ability':item.rank===5||item.rank===6?' is-specialist-ability':''}${unlocked?' is-unlocked':''}${active?' is-active':''}${locked?' is-locked':''}${expanded?' is-selected':''}`;
      shell.className=`skill-card-shell${flags}`;button.type='button';button.className=`skill-card${flags}`;
      button.dataset.path=item.path;button.dataset.rank=String(item.rank);shell.style.setProperty('--path-color',colors[SKILL_PATHS.findIndex(p=>p.id===item.path)]);
      top.className='skill-card-top';tag.className='skill-card-tag';tag.textContent=item.rank===1?'MAIN ABILITY':item.tag;state.className='skill-card-state';state.textContent=active?'✓ EQUIPPED':unlocked?'UNLOCKED':available?'AVAILABLE':'LOCKED';top.append(tag,state);
      name.className='skill-card-name';name.textContent=item.title;requirement.className='skill-card-requirement';requirement.textContent=item.requirement;requirement.hidden=!locked;
      button.append(top,name,requirement);button.setAttribute('aria-label',`${item.title}, ${active?'equipped':state.textContent.toLowerCase()}. ${locked?item.requirement:''}`);button.setAttribute('aria-pressed',String(expanded));if(inspector){button.setAttribute('aria-expanded',String(expanded));if(expanded)button.setAttribute('aria-controls','skillInspector');}button.onclick=event=>onSelect({path:item.path,rank:item.rank},event?.detail===0);shell.append(button);if(inspector&&expanded){inspector.hidden=false;shell.append(inspector);}grid.append(shell);
    }
  }
  for(const [i,path] of SKILL_PATHS.entries()){
    if(pathFilter!=='all'&&pathFilter!==path.id)continue;
    const core=[1,2,3].map(rank=>({path:path.id,rank,title:rank===1?path.ability:`${path.name} · Rank ${rank}`,tag:rank===1?'ACTIVE ABILITY':`PASSIVE / RANK ${rank}`,description:rank===1?path.description:path.passive,requirement:rank===1?'Starting ability':`Requires ${path.name} rank ${rank-1}`,unlocked:build[path.id]>=rank,active:rank===1&&build[path.id]>=1&&build.active===path.id&&!build.variant,available:rank===build[path.id]+1&&left>0}));
    const specialists=path.branches.map((branch,j)=>({path:path.id,rank:5+j,title:branch.ability,tag:'SPECIALIST / ACTIVE',description:branch.abilityDescription,requirement:`Requires ${path.name} rank 2`,unlocked:!!build.extra?.[i*2+j],active:!!build.extra?.[i*2+j]&&build.active===path.id&&build.variant===j+1,available:!build.extra?.[i*2+j]&&build[path.id]>=2&&left>0}));
    const mastery=WEB_NODES.filter(n=>n.path===path.id&&n.kind==='mastery').map(n=>({path:n.path,rank:100+n.id,title:n.name,tag:n.tier===4?'MASTERY / CAPSTONE':`MASTERY / ${n.tier+1}`,description:n.description,requirement:webRequirement(n),unlocked:!!build.web?.[n.id],available:!build.web?.[n.id]&&webReady(build,n)&&left>0}));
    const doctrines=WEB_NODES.filter(n=>n.path===path.id&&n.kind==='doctrine').map(n=>({path:n.path,rank:100+n.id,title:n.name,tag:`DOCTRINE / ${n.branch===0?'A':'B'}${n.tier+1}`,description:n.description,requirement:webRequirement(n),unlocked:!!build.web?.[n.id],available:!build.web?.[n.id]&&webReady(build,n)&&left>0}));
    addGroup(`${path.name} training`,path.passive,core,path.id);addGroup(`${path.name} · Specialist abilities`,'Alternative active skills',specialists,path.id);addGroup(`${path.name} · Mastery`,'Advanced upgrades',mastery,path.id);addGroup(`${path.name} · Specialist doctrines`,'Two specialist branches with two upgrades each',doctrines,path.id);
  }
  const combos=WEB_NODES.filter(n=>n.kind==='hybrid'||n.kind==='cross').map(n=>({path:n.path,rank:100+n.id,title:n.name,tag:`COMBO / ${n.path.toUpperCase()} + ${n.other.toUpperCase()}`,description:n.description,requirement:webRequirement(n),unlocked:!!build.web?.[n.id],available:!build.web?.[n.id]&&webReady(build,n)&&left>0}));
  addGroup('Cross-training','Combine two disciplines to unlock new bonuses',combos);
  if(!board.children.length){const empty=document.createElement('p');empty.className='skill-empty';empty.textContent='No skills match this filter. Try another view.';board.append(empty);}
  container.replaceChildren(board);if(Number.isFinite(scrollTop))container.scrollTop=scrollTop;
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
