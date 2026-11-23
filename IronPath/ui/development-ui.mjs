import {nodeMatches} from '../core/skill-planner.mjs?v=20261123-endless4';
// Presentation only: all progression and transactions remain in the existing models.
import {SKILL_PATHS,SKILL_PATH_MAP,pointsLeft,classNodes,webReady,webRequirement} from '../core/skills.mjs?v=20261123-endless4';
import {CAPSTONES} from '../core/skill-combos.mjs?v=20261123-endless4';
import {TOWER_CLASS_PATHS} from '../core/tower-class-paths.mjs?v=20261123-endless4';
const NS='http://www.w3.org/2000/svg';
export const CLASS_COLORS={
  assault:'#d89970',
  engineer:'#d7bd71',
  logistics:'#b4c682',
  medic:'#8ac7b1',
  recon:'#8eafcf',
  airDefense:'#d9849e'
};
export const CLASS_ARTWORKS=Object.freeze({
  assault:'assets/class-assault.jpg',
  engineer:'assets/class-engineer.jpg',
  logistics:'assets/class-logistics.jpg',
  medic:'assets/class-medic.jpg',
  recon:'assets/class-recon.jpg',
  airDefense:'assets/class-airDefense.jpg'
});
const badgePaths={
  assault:['M12 3 16 14 12 18 8 14Z','M6 16 18 16','M9 19h6'],
  engineer:['M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z','M12 2v3','M12 19v3','M2 12h3','M19 12h3','M4.9 4.9l2.1 2.1','M17 17l2.1 2.1','M19.1 4.9 17 7','M7 17l-2.1 2.1'],
  logistics:['M4 9h16v10H4z','M7 9V6h10v3','M9 14h6','M12 11v6'],
  medic:['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z','M12 7v10','M7 12h10'],
  recon:['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z','M12 2v4','M12 18v4','M2 12h4','M18 12h4','M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'],
  airDefense:['M5 19l5-9','M19 19l-5-9','M7 19h10','M12 3l3 4H9z','M4 11l4-2','M20 11l-4-2']
};
function svg(document,tag,attrs){const node=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node;}
export function classBadgeSvg(document,classId,size=32){
  const color=CLASS_COLORS[classId]||'#d8c596';
  const icon=svg(document,'svg',{viewBox:'0 0 24 24',width:size,height:size,'aria-hidden':'true',class:`class-badge-svg class-badge-${classId}`});
  icon.append(svg(document,'circle',{cx:12,cy:12,r:10.5,fill:'#162721',stroke:color,'stroke-width':1.5}));
  for(const d of (badgePaths[classId]||badgePaths.assault))icon.append(svg(document,'path',{d,fill:'none',stroke:color,'stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round'}));
  return icon;
}
function classArtElement(document,classId,cls='class-art-img'){
  const src=CLASS_ARTWORKS[classId];
  if(!src)return null;
  const img=document.createElement('img');
  img.src=`${src}?v=20261123-endless4`;
  img.alt='';
  img.className=cls;
  img.setAttribute('aria-hidden','true');
  img.loading='lazy';
  return img;
}
const towerPathGlyphs={
  assault:['M12 4.5 15.5 11 12 13.5 8.5 11Z'],
  engineer:['M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z','M12 4.2v1.6','M12 14.2v1.6','M7.2 10h1.6','M15.2 10h1.6'],
  logistics:['M8.5 8h7v5.5h-7z','M12 8v5.5','M8.5 10.7h7'],
  medic:['M12 6.5v7','M8.5 10h7'],
  recon:['M12 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8z','M12 4.2v2','M12 13.8v2','M7.2 10h2','M14.8 10h2'],
  airDefense:['M7.5 8.5a6.5 6.5 0 0 1 9 0','M9.5 14 12 8.5 14.5 14']
};
export function towerClassIcon(document,classId,size=26){
  const color=CLASS_COLORS[classId]||'#d8c596';
  const icon=svg(document,'svg',{viewBox:'0 0 24 24',width:size,height:size,'aria-hidden':'true',class:'tower-class-icon'});
  icon.append(svg(document,'path',{d:'M4.5 20.5h15v-2.8h-15zm2.2-2.8V15h10.6v2.7',fill:'none',stroke:color,'stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round'}));
  for(const d of (towerPathGlyphs[classId]||['M12 9V4m0 0-3 3m3-3 3 3']))icon.append(svg(document,'path',{d,fill:'none',stroke:color,'stroke-width':1.6,'stroke-linecap':'round','stroke-linejoin':'round'}));
  return icon;
}
// A two-phase visual skill tree: Phase 1 displays painted class dossiers,
// Phase 2 renders a dedicated branching tree for the selected soldier class.
export function renderSkillTree({document,container,build,level,selected,onSelect,filter='all',pathFilter='all',inspector=null,inspectorHome=null,translate=(text,values={})=>text.replace(/\{([A-Za-z]+)\}/g,(m,key)=>values[key]??m)}){
  const scrollTop=container.scrollTop,left=pointsLeft(build,level);
  if(inspector&&inspectorHome){inspectorHome.append(inspector);inspector.hidden=true;}
  const board=document.createElement('div');
  board.className='skills-catalogue';

  if(!build.classId){
    board.dataset.phase='choose-class';
    const intro=document.createElement('section');intro.className='skill-group class-picker-section';
    const heading=document.createElement('div');heading.className='skill-group-heading';
    const h3=document.createElement('h3');h3.textContent=translate('Choose your soldier class');
    const desc=document.createElement('p');desc.textContent=translate(level<2?'Reach soldier level 2 to choose one class and unlock its specialization tree.':'Pick one of six classes to unlock its active ability, focused tree, and class tower path.');
    heading.append(h3,desc);intro.append(heading);
    const grid=document.createElement('div');grid.className='skill-card-grid class-picker-grid';
    for(const path of SKILL_PATHS){
      if(pathFilter!=='all'&&pathFilter!==path.id)continue;
      const expanded=selected.path===path.id&&selected.rank===1;
      const locked=level<2||left<1;
      const shell=document.createElement('article'),button=document.createElement('button');
      const media=document.createElement('span'),body=document.createElement('span');
      const top=document.createElement('span'),badgeWrap=document.createElement('span'),tag=document.createElement('span'),state=document.createElement('span');
      const name=document.createElement('strong'),descLine=document.createElement('span'),towerPreview=document.createElement('small'),capPreview=document.createElement('small');
      const flags=`class-choice-shell${locked?' is-locked':' is-available'}${expanded?' is-selected':''}`;
      shell.className=`skill-card-shell ${flags}`;
      shell.style.setProperty('--path-color',CLASS_COLORS[path.id]);
      button.type='button';
      button.className=`skill-card is-main-ability class-choice-card${locked?' is-locked':''}${expanded?' is-selected':''}`;
      button.dataset.path=path.id;button.dataset.rank='1';
      media.className='class-choice-media';
      const artImg=classArtElement(document,path.id,'class-choice-art');
      if(artImg)media.append(artImg);
      badgeWrap.className='class-choice-crest';
      badgeWrap.append(classBadgeSvg(document,path.id,26));
      media.append(badgeWrap);
      body.className='class-choice-body';
      top.className='skill-card-top';
      tag.className='skill-card-tag';tag.textContent=translate('CLASS · {ability}',{ability:translate(path.ability).toUpperCase()});
      state.className='skill-card-state';state.textContent=translate(level<2?'UNLOCKS AT LEVEL 2':left>0?'AVAILABLE':'NO POINTS');
      top.append(tag,state);
      name.className='skill-card-name';name.textContent=`${translate(path.name)} — ${translate(path.ability)}`;
      descLine.className='skill-card-description';descLine.textContent=`${translate(path.description)} ${translate(path.passive)}.`;
      const pathInfo=TOWER_CLASS_PATHS[path.id],capInfo=CAPSTONES[path.id];
      towerPreview.className='skill-card-requirement';
      towerPreview.textContent=pathInfo?translate('Tower Path: {name}',{name:translate(pathInfo.name)}):'';
      capPreview.className='skill-card-requirement';
      capPreview.textContent=capInfo?translate('Capstone: {name}',{name:translate(capInfo.name)}):'';
      body.append(top,name,descLine,towerPreview,capPreview);
      button.append(media,body);
      button.setAttribute('aria-label',`${translate(path.name)}, ${translate(path.ability)}, ${state.textContent.toLowerCase()}.`);
      button.setAttribute('aria-pressed',String(expanded));
      if(inspector){button.setAttribute('aria-expanded',String(expanded));if(expanded)button.setAttribute('aria-controls','skillInspector');}
      button.onclick=event=>onSelect({path:path.id,rank:1},event?.detail===0);
      shell.append(button);
      if(inspector&&expanded){inspector.hidden=false;shell.append(inspector);}
      grid.append(shell);
    }
    intro.append(grid);
    board.append(intro);
    container.replaceChildren(board);
    if(Number.isFinite(scrollTop))container.scrollTop=scrollTop;
    return;
  }

  // Phase 2: Dedicated Per-Class Visual Branching Skill Tree
  const path=SKILL_PATH_MAP[build.classId]||SKILL_PATHS[0];
  board.dataset.phase='class-tree';
  board.dataset.class=path.id;
  board.style.setProperty('--path-color',CLASS_COLORS[path.id]);

  const headerCard=document.createElement('section');
  headerCard.className=`class-header-card class-theme-${path.id}`;
  headerCard.style.setProperty('--path-color',CLASS_COLORS[path.id]);
  const backdropArt=classArtElement(document,path.id,'class-hero-backdrop');
  if(backdropArt)headerCard.append(backdropArt);
  const emblemBox=document.createElement('div');
  emblemBox.className='class-hero-emblem';
  const heroPortrait=classArtElement(document,path.id,'class-hero-portrait');
  if(heroPortrait)emblemBox.append(heroPortrait);
  const badge=classBadgeSvg(document,path.id,34);
  badge.setAttribute('class','class-hero-seal');
  emblemBox.append(badge);
  const headerInfo=document.createElement('div');
  headerInfo.className='class-hero-info';
  const headerTitle=document.createElement('strong');headerTitle.textContent=`${translate(path.name)} · ${translate('Rank {rank}',{rank:`${build.rank}/3`})}`;
  const headerSub=document.createElement('span');
  const towerPath=TOWER_CLASS_PATHS[path.id],capInfo=CAPSTONES[path.id];
  const towerSummary=towerPath?`${translate(towerPath.name)}: ${translate(build.rank>=3?'Tier II unlocked':build.rank>=2?'Tier I unlocked':'Unlocks Tier I at Rank 2')}`:translate(path.passive);
  headerSub.textContent=capInfo?`${towerSummary} · ${translate('Capstone: {name}',{name:translate(capInfo.name)})}`:towerSummary;
  const switchNote=document.createElement('small');switchNote.textContent=translate('Focused class tree · Reset Points to pick another class.');
  headerInfo.append(headerTitle,headerSub,switchNote);
  headerCard.append(emblemBox,headerInfo);
  board.append(headerCard);

  function addGroup(title,subtitle,items,treeKind='grid'){
    const visible=items.filter(item=>nodeMatches(build,level,item.path,item.rank,filter,path.id));if(!visible.length)return;
    const section=document.createElement('section'),heading=document.createElement('div'),name=document.createElement('h3'),desc=document.createElement('p'),grid=document.createElement('div');
    section.className=`skill-group skill-tree-section skill-tree--${treeKind}`;section.dataset.skillGroup=path.id;section.style.setProperty('--path-color',CLASS_COLORS[path.id]);
    heading.className='skill-group-heading';name.textContent=title;desc.textContent=translate(subtitle);heading.append(name,desc);
    grid.className=`skill-card-grid skill-tree-grid skill-tree-grid--${treeKind}`;
    section.append(heading,grid);board.append(section);
    for(const item of visible){
      const shell=document.createElement('article'),button=document.createElement('button'),top=document.createElement('span'),tag=document.createElement('span'),state=document.createElement('span'),label=document.createElement('strong'),requirement=document.createElement('span');
      const active=item.active,unlocked=item.unlocked,available=item.available,expanded=selected.path===item.path&&selected.rank===item.rank,locked=!active&&!unlocked&&!available;
      const laneClass=item.lane?` tree-lane-${item.lane}`:'';
      const tierClass=item.treeTier!==undefined?` tree-tier-${item.treeTier}`:'';
      const flags=`${item.rank===1?' is-main-ability':item.rank===5||item.rank===6?' is-specialist-ability':''}${item.capstone?' is-capstone':''}${unlocked?' is-unlocked':''}${active?' is-active':''}${available?' is-available':''}${locked?' is-locked':''}${expanded?' is-selected':''}`;
      shell.className=`skill-card-shell${flags}${laneClass}${tierClass}`;
      if(item.lane)shell.dataset.lane=item.lane;
      if(item.treeTier!==undefined)shell.dataset.tier=String(item.treeTier);
      button.type='button';button.className=`skill-card${flags}`;
      button.dataset.path=item.path;button.dataset.rank=String(item.rank);shell.style.setProperty('--path-color',CLASS_COLORS[item.path]);
      top.className='skill-card-top';tag.className='skill-card-tag';tag.textContent=translate(item.rank===1?'MAIN ABILITY':item.tag);state.className='skill-card-state';state.textContent=translate(active?'✓ EQUIPPED':unlocked?'UNLOCKED':available?'AVAILABLE':'LOCKED');top.append(tag,state);
      label.className='skill-card-name';label.textContent=translate(item.title);requirement.className='skill-card-requirement';requirement.textContent=item.requirement;requirement.hidden=!locked;
      button.append(top,label,requirement);button.setAttribute('aria-label',`${translate(item.title)}, ${state.textContent.toLowerCase()}. ${locked?item.requirement:''}`);button.setAttribute('aria-pressed',String(expanded));if(inspector){button.setAttribute('aria-expanded',String(expanded));if(expanded)button.setAttribute('aria-controls','skillInspector');}button.onclick=event=>onSelect({path:item.path,rank:item.rank},event?.detail===0);shell.append(button);if(inspector&&expanded){inspector.hidden=false;shell.append(inspector);}grid.append(shell);
    }
  }

  const nodes=classNodes(path.id);
  const core=[1,2,3].map(rank=>({
    path:path.id,
    rank,
    treeTier:rank,
    title:rank===1?path.ability:translate('{name} · Rank {rank}',{name:translate(path.name),rank}),
    tag:rank===1?'ACTIVE ABILITY':translate('PASSIVE / RANK {rank}',{rank}),
    description:rank===1?path.description:path.passive,
    requirement:rank===1?translate('Starting ability'):translate('Requires {name} rank {rank}',{name:translate(path.name),rank:rank-1}),
    unlocked:build.rank>=rank,
    active:rank===1&&build.rank>=1&&build.active===path.id&&!build.variant,
    available:rank===build.rank+1&&left>0
  }));
  const specNodes=nodes.filter(n=>n.kind==='specialist');
  const docNodes=nodes.filter(n=>n.kind==='doctrine');
  const branchItems=[];
  for(const branchIdx of [0,1]){
    const spec=specNodes[branchIdx];
    const lane=branchIdx===0?'a':'b';
    if(spec){
      branchItems.push({
        path:path.id,
        rank:5+branchIdx,
        lane,
        treeTier:0,
        title:spec.ability,
        tag:`${translate(branchIdx===0?'Path A':'Path B')} · ${translate('SPECIALIST / ACTIVE')}`,
        description:spec.description,
        requirement:translate(webRequirement(spec)),
        unlocked:!!build.extra?.[spec.slot],
        active:!!build.extra?.[spec.slot]&&build.active===path.id&&build.variant===branchIdx+1,
        available:!build.extra?.[spec.slot]&&webReady(build,spec)&&left>0
      });
    }
    for(const doc of docNodes.filter(d=>d.branch===branchIdx).sort((x,y)=>x.tier-y.tier)){
      branchItems.push({
        path:path.id,
        rank:100+doc.id,
        lane,
        treeTier:doc.tier+1,
        title:doc.name,
        tag:translate('DOCTRINE / {branch}',{branch:`${branchIdx===0?'A':'B'}${doc.tier+1}`}),
        description:doc.description,
        requirement:translate(webRequirement(doc)),
        unlocked:!!build.extra?.[doc.slot],
        available:!build.extra?.[doc.slot]&&webReady(build,doc)&&left>0
      });
    }
  }
  const mastery=nodes.filter(n=>n.kind==='mastery').map(n=>({
    path:path.id,
    rank:100+n.id,
    treeTier:n.tier,
    title:n.name,
    capstone:n.tier===4,
    tag:n.tier===4?'MASTERY / CAPSTONE':translate('MASTERY / {tier}',{tier:n.tier+1}),
    description:n.description,
    requirement:translate(webRequirement(n)),
    unlocked:!!build.extra?.[n.slot],
    available:!build.extra?.[n.slot]&&webReady(build,n)&&left>0
  }));
  const combos=nodes.filter(n=>n.kind==='combo').map(n=>({
    path:path.id,
    rank:100+n.id,
    treeTier:n.tier,
    title:n.name,
    tag:translate('COMBO / {tier}',{tier:n.tier+1}),
    description:n.description,
    requirement:translate(webRequirement(n)),
    unlocked:!!build.extra?.[n.slot],
    available:!build.extra?.[n.slot]&&webReady(build,n)&&left>0
  }));

  addGroup(translate('{name} training',{name:translate(path.name)}),path.passive,core,'trunk');
  addGroup(translate('{name} · Specialist branches',{name:translate(path.name)}),'Two specialist paths with active skills and linked doctrines',branchItems,'branches');
  addGroup(translate('{name} · Mastery',{name:translate(path.name)}),'Advanced upgrades and class capstone',mastery,'mastery');
  addGroup(translate('{name} · Class combos',{name:translate(path.name)}),'Synergy tiers triggered when activating your class ability',combos,'combos');

  if(board.children.length<=1){const empty=document.createElement('p');empty.className='skill-empty';empty.textContent=translate('No skills match this filter. Try another view.');board.append(empty);}
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
